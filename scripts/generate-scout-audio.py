#!/usr/bin/env python3
"""Batch-generate Scout audio clips via MiMo VOICECLONE TTS.
Uses Scout's actual reference audio — not the generic Chloe preset.
Run once to pre-cache all quip audio. Outputs OGG files + manifest.json.
"""
import json, os, sys, base64, subprocess, time
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError

# Load API key
ENV_PATH = Path("/opt/data/SideQuestHQ/.env.local")
API_KEY = None
for line in ENV_PATH.read_text().splitlines():
    if line.startswith("MIMO_API_KEY="):
        API_KEY = line.split("=", 1)[1].strip().strip('"').strip("'")
        break
if not API_KEY:
    print("ERROR: No MIMO_API_KEY in .env.local")
    sys.exit(1)

MIMO_URL = "https://token-plan-sgp.xiaomimimo.com/v1/chat/completions"
OUT_DIR = Path("/opt/data/SideQuestHQ/public/audio/scout")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Load Scout's reference audio as data: URL
REF_PATH = Path("/opt/data/shared/chloe-voice-clone/eddie_chill_reference.wav")
if not REF_PATH.exists():
    print(f"ERROR: Reference audio not found at {REF_PATH}")
    sys.exit(1)

ref_b64 = base64.b64encode(REF_PATH.read_bytes()).decode()
VOICE_DATA_URL = f"data:audio/wav;base64,{ref_b64}"
print(f"Reference audio loaded: {REF_PATH} ({REF_PATH.stat().st_size // 1024}KB)")

MANIFEST_PATH = Path("/opt/data/SideQuestHQ/scripts/quip-manifest.json")
manifest_data = json.loads(MANIFEST_PATH.read_text())

def tts_generate(text: str) -> bytes | None:
    """Call MiMo VoiceClone TTS, return WAV bytes or None on failure."""
    payload = {
        "model": "mimo-v2.5-tts-voiceclone",
        "messages": [
            {"role": "user", "content": ""},
            {"role": "assistant", "content": text}
        ],
        "audio": {"voice": VOICE_DATA_URL, "format": "wav"},
        "stream": False,
        "thinking": {"type": "disabled"}
    }
    req = Request(MIMO_URL, data=json.dumps(payload).encode(), headers={
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    })
    try:
        resp = urlopen(req, timeout=30)
        data = json.loads(resp.read())
        audio_b64 = data["choices"][0]["message"]["audio"]["data"]
        return base64.b64decode(audio_b64)
    except (HTTPError, KeyError, Exception) as e:
        print(f"  TTS error: {e}")
        return None

def wav_to_ogg(wav_path: Path, ogg_path: Path):
    """Convert WAV to OGG Opus."""
    subprocess.run([
        "ffmpeg", "-y", "-i", str(wav_path),
        "-c:a", "libopus", "-b:a", "64k",
        str(ogg_path)
    ], capture_output=True, check=True)

# Collect all quips
all_quips = []
for tier_key, tier_quips in manifest_data.get("snooze", {}).items():
    for q in tier_quips:
        all_quips.append(("snooze", q["key"], q["text"]))
for q in manifest_data.get("complete", []):
    all_quips.append(("complete", q["key"], q["text"]))
for q in manifest_data.get("agent_filler", []):
    all_quips.append(("agent_filler", q["key"], q["text"]))

print(f"Regenerating {len(all_quips)} Scout clips with VOICECLONE...")
print(f"Output: {OUT_DIR}\n")

# Nuke old files first — these were the wrong voice
for f in OUT_DIR.glob("*.ogg"):
    f.unlink()
for f in OUT_DIR.glob("*.wav"):
    f.unlink()
(OUT_DIR / "manifest.json").unlink(missing_ok=True)
print("Cleared old clips.\n")

app_manifest = {}
success = 0
fail = 0

for i, (category, key, text) in enumerate(all_quips):
    short = text[:50] + ("..." if len(text) > 50 else "")
    print(f"[{i+1}/{len(all_quips)}] {key}: {short}", end=" ... ")

    wav_path = OUT_DIR / f"{key}.wav"
    ogg_path = OUT_DIR / f"{key}.ogg"

    wav_data = tts_generate(text)
    if not wav_data:
        print("FAILED")
        fail += 1
        continue

    wav_path.write_bytes(wav_data)
    try:
        wav_to_ogg(wav_path, ogg_path)
        wav_path.unlink()
        app_manifest[key] = {"ogg": f"{key}.ogg", "text": text, "category": category}
        success += 1
        print(f"OK ({ogg_path.stat().st_size // 1024}KB)")
    except Exception as e:
        print(f"FFmpeg error: {e}")
        fail += 1

    time.sleep(0.5)  # Rate limit

manifest_out = OUT_DIR / "manifest.json"
manifest_out.write_text(json.dumps(app_manifest, indent=2))
print(f"\nDone: {success} voicecloned, {fail} failed")
print(f"Manifest: {manifest_out}")
