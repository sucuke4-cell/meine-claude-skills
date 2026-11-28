---
name: video-reference-analyst
description: "Turns a video the user loves (TikTok, Reel, Short, YouTube link or uploaded file) into a grounded plan for an ORIGINAL video of their own: watches it, breaks every shot down into subject, motion, scene, framing and camera, names what makes it work, then offers 2–3 different concepts that keep the strengths but change topic, story and look. Use when the user sends a reference and says 'like this', 'in this style', 'analyse this video', 'make me something similar' — not when they want their own footage edited."
---

# Video Reference Analyst

> Adapted from OpenMontage's `video-reference-analyst` meta skill (github.com/OpenMontageInc/OpenMontage, AGPL-3.0; licence text in `licenses/openmontage-AGPL-3.0-LICENSE`). Rewritten for this user's free toolset: the `watch` skill, ffmpeg and the code-rendered `story-video-studio` pipeline. No paid services.

## When to use
- The user pastes a TikTok / Reel / Shorts / YouTube URL or uploads a clip **as inspiration** ("make me one like this", "same style", "analyse his videos").
- Not for "edit this footage" — that is a different job.

## Step 1 — Watch it
1. Use the `watch` skill for a URL (download, frames, transcript). For an uploaded file: `ffmpeg -i in.mp4 -vf "fps=1/2,scale=216:384,tile=8x3" sheet.jpg` for a contact sheet, and extract the audio for analysis.
2. Ignore overlays that are not part of the video (reposter watermarks, a face-cam in a corner) and say so.
3. Measure what can be measured: length, number of cuts (frames where the picture changes), seconds per shot, words per caption, narrator pitch/speed/brightness (see the voice comparison method in `story-video-studio`).

## Step 2 — Report in this exact structure (keep the labels)
```
Content:   2 sentences — what happens / what it is about
Style:     1 sentence — pacing, look, energy
Structure: X shots over Y seconds (avg Z s per shot); hook = …; ending = …
Motion:    are shots real animation / moving footage, or still images with zoom?

5-aspect breakdown (per shot or group of shots):
- Subject:        who/what, how many, outfits, distinguishing features; how subjects change between shots
- Subject motion: actions in order, gestures, facial expressions, interactions
- Scene:          setting, time of day, weather; OVERLAYS listed separately (captions, titles, emojis)
- Framing:        close-up / medium / wide, where the subject sits in frame, foreground/background use
- Camera:         height, angle, movement (push-in, orbit, static), depth of field

What makes it work: 2–3 concrete things (hook technique, cut rhythm, voice, visual symbol, twist)
```
Mark an aspect **N/A** instead of skipping it. For the Camera aspect, also name the *purpose* of each move (establish / scale / tension / follow / chase / let emotion land) — see "Camera language v4" in `story-video-studio`. Then look at the keyframes yourself and add colour palette, caption style and transition patterns.

## Step 3 — Honest capability check
Say plainly which parts can be matched with the free pipeline (three.js rounded avatars, Kokoro voices, procedural music, ffmpeg) and which cannot (for example real Roblox Studio scenes or paid AI video clips). Never promise a 1:1 copy.

## Step 4 — Only the questions that are still open (one at a time)
- Narrator only, character dialogue, or narrator + characters?
- Target length (the reference is X s)?
- Same theme or a new topic? Anything they especially love or hate in it?
Skip questions the user already answered.

## Step 5 — 2–3 original concepts, never a carbon copy
For each option:
```
Option A: "Title"
Keeps from the reference:  pacing / structure / tone / hook style
Creative twist:            new topic, new visual symbol, new setting
Visual plan:               locations, cast (always NEW characters and a NEW town), key shots
Audio plan:                narrator voice, character voices, music moods
Hook line (first 2 s):     "…"
```
Recommend one and say why. After the user picks, hand over to `bmad-forge-idea` / `bmad-party-mode` to harden the story, then to `story-video-studio` to build it.

## Rules
- Respect copyright: take inspiration from structure, pacing and techniques, never copy the reference's characters, names, story, art or music.
- Keep the user's standing rules: new cast + new place every story, English content, explanations in simple German, free tools only.
