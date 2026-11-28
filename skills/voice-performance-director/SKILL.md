---
name: voice-performance-director
description: "Plans how AI narration should be performed so it sounds directed, not read: energy curve, pacing, pauses before reveals, emphasis words and per-line delivery cues, then checks a sample. Use whenever a video needs text-to-speech narration or character voices, before generating the voice files."
---

# Voice Performance Director

Use this meta skill whenever a pipeline will generate narration with TTS.

The goal is to make generated narration sound directed, not merely read. Do not
leave expressiveness as "read naturally" in a prompt. Carry a concrete voice
performance plan from script to asset generation, then verify it with a sample.


> Adapted from OpenMontage (github.com/OpenMontageInc/OpenMontage, AGPL-3.0; licence text in `licenses/openmontage-AGPL-3.0-LICENSE`). Changed for this user's free, code-rendered story-video pipeline: paid services and OpenMontage's own tools removed.

## Required Contract

Every narration-led script should include a top-level `voice_performance`
object and section-level `delivery_cues` where the schema allows it.

Top-level voice performance:

```json
{
  "performance_intent": "Warm, decisive product narrator with human pauses.",
  "pacing_profile": "conversational",
  "energy_curve": "measured hook, warmer middle, more deliberate close",
  "pause_policy": "Use short pauses after setup lines and longer pauses before reversals or important claims.",
  "provider_notes": {
    "kokoro": "No SSML: make pauses with the gap before each line and with punctuation (comma, ellipsis, full stop); speed per line (0.95 slow and emotional, 1.08 normal, 1.12 tense)."
  }
}
```

Section-level delivery cues:

```json
{
  "pace": "measured",
  "energy": "curious",
  "emphasis_words": ["not", "process"],
  "pause_before_seconds": 0.2,
  "pause_after_seconds": 0.7,
  "delivery_note": "Set up the contrast, then slow down on the final phrase.",
  "provider_text": "This is not just another tool. <break time=\"0.6s\"/> It is a process."
}
```

## Writing Rules

- Write spoken language, not essay language. Prefer short sentences, light
  contractions, and clear punctuation.
- Use silence as structure. Add a pause before reversals, after surprising
  claims, and before the final takeaway.
- Keep pause tags purposeful. Too many breaks sound theatrical and slow.
- Avoid generic directions such as "natural", "engaging", or "expressive"
  unless they are paired with exact pace, emphasis, pause, or energy cues.
- Prefer one delivery idea per section. If a section needs three emotional
  turns, split it.

## Provider Mapping

- OpenAI TTS: use `model: "gpt-4o-mini-tts"` when sending `instructions`.
  Put the emotional arc, pacing, emphasis, and role in `instructions`; keep the
  input text clean but punctuated. Do not send `instructions` to `tts-1` or
  `tts-1-hd`.
- Google TTS: use `input_type: "ssml"` only when adding break tags or other
  SSML. The tool maps this to Google `input.ssml` and wraps the utterance in
  `<speak>...</speak>` when needed. Keep `speaking_rate` in Google's supported
  `0.25..2.0` range and pitch in `-20..20`.
- Offline/basic voices: rely on punctuation, shorter sentences, and explicit
  segment splitting because provider-level emotion controls may be unavailable.

## Sample Gate

Before batch narration generation:

1. Generate a sample from the most performance-sensitive section, not
   automatically the first section.
2. Verify voice, pace, pauses, emphasis, and emotional arc.
3. If the sample is flat, adjust the `voice_performance` plan or provider
   settings before generating the rest.
4. Record the approved sample path and provider settings in the asset manifest.

## Failure Conditions

Treat these as quality failures:

- A narration-led script has no `voice_performance` plan.
- Section directions only say "read naturally" or "expressive" with no concrete
  pause, emphasis, pace, or energy cue.
- TTS provider, voice, speed, or model changes after sample approval without a
  new sample.
- Final narration is generated from raw script text while structured
  `provider_text` or `delivery_cues` were present.


## In this user's pipeline (Kokoro, free and offline)
- Narrator `af_jessica`, speed ~1.08; character voices per `make_vo.py` SPK table.
- Kokoro has no SSML or style controls. Express the plan through: the `gap` before each line (0.2 s normal, 0.4–0.6 s before a reveal or after an emotional line), splitting a sentence into two lines so a pause falls in the right place, punctuation (… for hesitation, ! for energy, ? for rising questions), and per-speaker speed (slower for sad or tender lines).
- Emphasis words: put them at the end of a short line, and highlight them in yellow in the captions.
- Always listen-check (or measure) one sample line per voice before the full render.
