#!/usr/bin/env python3
"""
Batch Chatterbox voice generation for Scout quips.
Resumes from manifest — skips already-generated clips.
"""
import json, os, sys, time, warnings
warnings.filterwarnings("ignore")

# Fix perth before importing chatterbox
import perth
perth.PerthImplicitWatermarker = perth.DummyWatermarker

from chatterbox.tts import ChatterboxTTS
import torchaudio

REF = "/opt/data/shared/chloe-voice-clone/eddie_chill_reference.wav"
OUT_DIR = "/opt/data/SideQuestHQ/public/audio/scout"
MANIFEST = os.path.join(OUT_DIR, "manifest.json")

# All Scout quips with their keys, text, and exaggeration levels
QUIPS = [
    # Snooze Warn (tier 1) — sassy but gentle
    ("snooze_warn_1", "Should I get you coffee since you're so lazy right now?", 0.4),
    ("snooze_warn_2", "You're building a bad habit here.", 0.4),
    ("snooze_warn_3", "Snooze button broken? Or is that just your motivation?", 0.4),
    ("snooze_warn_4", "I see you. Snoozing. I'm taking notes.", 0.4),
    ("snooze_warn_5", "This is how it starts. First a snooze, then total chaos.", 0.4),
    ("snooze_warn_6", "You know what doesn't snooze? Your bills.", 0.4),
    # Snooze Scold (tier 2) — annoyed
    ("snooze_scold_1", "Oh, AGAIN? Cool cool cool.", 0.6),
    ("snooze_scold_2", "Two snoozes. I'm not angry, just disappointed. Okay I'm a little angry.", 0.6),
    ("snooze_scold_3", "You're really testing me today.", 0.6),
    ("snooze_scold_4", "I'm putting this in your permanent record.", 0.6),
    ("snooze_scold_5", "The snooze button is NOT a life strategy, Eddie.", 0.65),
    ("snooze_scold_6", "Bold move snoozing that again. Bold and wrong.", 0.6),
    # Snooze Give-up (tier 3) — defeated/exhausted
    ("snooze_give_up_1", "Yeah, fuck it. Who cares right? Why am I even here?", 0.35),
    ("snooze_give_up_2", "Three snoozes. I quit. You win. Enjoy your chaos.", 0.35),
    ("snooze_give_up_3", "I'm just gonna sit here. In the dark. While you snooze everything.", 0.3),
    ("snooze_give_up_4", "You know what? Snooze the whole app. Snooze your whole life.", 0.4),
    ("snooze_give_up_5", "I'm not even mad anymore. I'm just tired.", 0.25),
    ("snooze_give_up_6", "Congratulations. You've broken an AI's will to remind.", 0.3),
    # Complete — happy/proud
    ("complete_1", "Well look at you being productive.", 0.5),
    ("complete_2", "One down. How many to go? Don't ask.", 0.5),
    ("complete_3", "Done. Filed. Forgotten. By me, not by you probably.", 0.5),
    ("complete_4", "Marking that one off before you change your mind.", 0.5),
    ("complete_5", "And THAT is how it's done.", 0.6),
    # Dismiss — muttering under breath
    ("dismiss_1", "Wow, unreal. I will just remind you again.", 0.4),
    ("dismiss_2", "Did you just? No. I will remind you again later.", 0.45),
    ("dismiss_3", "Snoozed. I'll bring it back when you're ready to be an adult.", 0.5),
    ("dismiss_4", "Fine. Sweeping that under the rug for now.", 0.4),
    ("dismiss_5", "Dismissed. But I have the receipts.", 0.45),
    ("dismiss_6", "Putting that in the deal with later pile. It's a big pile.", 0.4),
    ("dismiss_7", "Okay but when this comes back around, don't say I didn't warn you.", 0.45),
    ("dismiss_8", "Sure. Snooze. Whatever.", 0.35),
    ("dismiss_9", "That's going back in the pile and I'm NOT happy about it.", 0.55),
    ("dismiss_10", "You're lucky I'm an AI and can't actually throw things.", 0.5),
]

os.makedirs(OUT_DIR, exist_ok=True)

# Load existing manifest
manifest = {}
if os.path.exists(MANIFEST):
    with open(MANIFEST) as f:
        manifest = json.load(f)

# Find what's missing
todo = [(k, t, e) for k, t, e in QUIPS if k not in manifest]
print(f"Total quips: {len(QUIPS)}, Already done: {len(manifest)}, Remaining: {len(todo)}")

if not todo:
    print("All quips generated!")
    sys.exit(0)

# Load model
print("Loading Chatterbox model...")
model = ChatterboxTTS.from_pretrained("cpu")
print(f"Model loaded. Generating {len(todo)} clips...")

start_all = time.time()
for i, (key, text, exh) in enumerate(todo):
    t0 = time.time()
    print(f"  [{i+1}/{len(todo)}] {key}: \"{text[:50]}...\" (exh={exh})")
    
    try:
        wav = model.generate(
            text=text,
            audio_prompt_path=REF,
            exaggeration=exh,
            temperature=0.8,
        )
        
        wav_path = os.path.join(OUT_DIR, f"{key}.wav")
        torchaudio.save(wav_path, wav, model.sr)
        
        # Convert to ogg for web delivery
        ogg_path = os.path.join(OUT_DIR, f"{key}.ogg")
        os.system(f"ffmpeg -y -i {wav_path} -c:a libopus -b:a 64k {ogg_path} 2>/dev/null")
        
        duration = time.time() - t0
        
        manifest[key] = {
            "file": f"{key}.wav",
            "ogg": f"{key}.ogg",
            "text": text,
            "exaggeration": exh,
            "duration": round(duration, 1),
        }
        
        # Save manifest after each clip (crash-safe)
        with open(MANIFEST, "w") as f:
            json.dump(manifest, f, indent=2)
        
        elapsed = time.time() - start_all
        eta = (elapsed / (i+1)) * (len(todo) - i - 1)
        print(f"    ✓ Done in {duration:.0f}s (ETA: {eta/60:.0f}m remaining)")
        
    except Exception as e:
        print(f"    ✗ FAILED: {e}")
        continue

total = time.time() - start_all
print(f"\nBatch complete! {len(manifest)}/{len(QUIPS)} quips in {total/60:.1f} minutes")
