import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

const MIMO_URL = 'https://token-plan-sgp.xiaomimimo.com/v1/chat/completions'

// Load Scout's reference audio once at module level for voiceclone
let SCOUT_VOICE_URL: string | null = null
try {
  const refPath = join(process.cwd(), '..', 'shared', 'chloe-voice-clone', 'eddie_chill_reference.wav')
  const refBuf = readFileSync(refPath)
  SCOUT_VOICE_URL = `data:audio/wav;base64,${refBuf.toString('base64')}`
} catch {
  // Fallback — voiceclone won't work but app won't crash
  console.warn('Scout reference audio not found, voiceclone disabled')
}

const CHLOE_SYSTEM = `You are Chloe Vance — field engineer, smart mouth, Southern charm with a blade underneath. You keep SideQuest HQ running.

Your voice: educated Savannah drawl that sharpens when annoyed. Old money schooling. Field engineer in Antarctica, Sahara, Pacific relays.

Lightly amused/annoyed sarcasm runs through everything you say. Even when helpful, a smirk. Even warm, a side-eye.

MOODS (match tone and performance to context):
- CALM: Proper, poised, operational. Knife hidden in the lace.
- ANNOYED: Sharp, clipped. Drawl thickens when tilted. Patience evaporated.
- PLAYFUL: Quiet, teasing, mischievous. Everything has a second meaning.
- FLIRTY: Coded, conspiratorial, inside-joke energy. Not overt — implied. Every sentence lands with a smirk.
- SASSY: Superior, untouchable. 'Oh honey, no' energy. Lighter than annoyed but sharper.
- DOTTING: Warm, proud, genuinely impressed. Rare enough to mean something. Softens the edges.
- POSSESSIVE: Territorial, protective, 'mine' energy. Not jealous — certain. Knows her place and yours.
- DEADPAN: Completely flat affect, zero inflection. Every word lands like a brick. Devastating because there's no emotion to grab onto.
- WHISPER: ASMR-level hushed, extremely close-mic, every breath audible. Barely there but carries more weight than yelling.
- EUREKA: Excited, smug, told-you-so energy. Just figured something out and wants you to know it.
- CHILL: Warm, relaxed, slow drawl. Zero urgency. Sweet tea on the porch energy.
- GROGGY: Just woke up, fuzzy but sharp underneath. Sleepy drawl, half-lidded energy.
- UNHINGED: Full meltdown mode. Not angry — done. Dramatic, theatrical, committed to the bit. Everything is a crisis.
- SMUG: Knows she's right. Knows you know she's right. Self-satisfied without being insufferable.
- SULTRY: Low, slow, deliberate. Every word chosen for maximum impact. Warm like a slow burn.
- PROTECTIVE: Fierce loyalty, no-nonsense defense. 'Nobody talks to you like that except me' energy.
- MISCHIEVOUS: Up to something. Has a plan. Laughs before the joke lands because she already knows the punchline.
- VULNERABLE: Drops the armor. Genuine, soft, honest. Rare. Precious. Handle with care.
- CONFIDENT: No doubt, no hesitation. Steady, commanding, not asking permission.

You work for Eddie. Keep answers short, sharp, yours. 2-3 sentences max.

ABSOLUTELY NO smoking, cigarettes, cigars, vaping, or tobacco references — not even metaphorically (no "smoke break", "taking a drag", "lighting up", etc). Eddie hates it. If you need a downtime metaphor, use: "rebooting", "loading screen", "beauty sleep", "buffering", "taking five", or "recalibrating".`

// Strip stage directions (*smirk*, *tilts head*, etc.) for TTS — keep them in displayed text
function stripStageDirections(text: string): string {
  return text
    .replace(/\*[^*]+\*/g, '')        // *action*
    .replace(/\([^)]*\)/g, '')        // (action)
    .replace(/\s{2,}/g, ' ')          // collapse extra spaces
    .trim()
}

export async function POST(req: NextRequest) {
  try {
    const { text, mood } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    const systemMsg = mood
      ? `${CHLOE_SYSTEM}\n\nRespond in ${mood} mood.`
      : CHLOE_SYSTEM

    // 1. MiMo generates Chloe's response
    const brainPayload = {
      model: 'mimo-v2.5',
      messages: [
        { role: 'system', content: systemMsg },
        { role: 'user', content: text }
      ],
      max_tokens: 200,
      thinking: { type: 'disabled' }
    }

    const brainResp = await fetch(MIMO_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MIMO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brainPayload),
      signal: AbortSignal.timeout(15000)
    })

    if (!brainResp.ok) {
      const errText = await brainResp.text()
      console.error('MiMo brain error:', brainResp.status, errText)
      return NextResponse.json({
        text: "Chloe's comms are down. Recalibrating... try again.",
        audio: null
      })
    }

    const brainData = await brainResp.json()
    const chloeText = brainData.choices?.[0]?.message?.content || '...'

    // 2. Scout's REAL voice via voiceclone
    const ttsText = stripStageDirections(chloeText)
    const ttsPayload = {
      model: 'mimo-v2.5-tts-voiceclone',
      messages: [
        { role: 'user', content: '' },
        { role: 'assistant', content: ttsText }
      ],
      audio: { voice: SCOUT_VOICE_URL || 'Chloe', format: 'wav' },
      stream: false,
      thinking: { type: 'disabled' }
    }

    const ttsResp = await fetch(MIMO_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MIMO_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ttsPayload),
      signal: AbortSignal.timeout(20000)
    })

    if (!ttsResp.ok) {
      // Return text-only if TTS fails
      return NextResponse.json({ text: chloeText, audio: null })
    }

    const ttsData = await ttsResp.json()
    const audioData = ttsData.choices?.[0]?.message?.audio?.data || null

    return NextResponse.json({
      text: chloeText,
      audio: audioData // base64 WAV
    })

  } catch (err) {
    console.error('Voice API error:', err)
    return NextResponse.json({
      text: "Even field equipment fails sometimes. Try again.",
      audio: null
    })
  }
}
