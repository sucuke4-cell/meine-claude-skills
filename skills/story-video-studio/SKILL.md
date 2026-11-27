---
name: story-video-studio
description: "Makes finished, animated story videos (9:16 MP4 with 3D blocky characters, AI voices, captions, music and sound effects) for this user's TikTok/YouTube series, for free, with the video-studio folder in the meine-claude-skills repo. Use when the user wants a new episode or part of 'Never Open the Red Door' (Milo, Juno, the Admin, the Keeper), wants a story turned into an animation or a ready-to-post video, or wants an existing episode changed (music, voices, scenes, captions). Needs a Claude Code session (laptop or cloud) with the repo; not possible in the plain chat app."
---

# Story Video Studio

Turns a story into a finished vertical video, all generated in code: no paid tools. Explain to the user in simple German; all video content is English.

## Where everything lives
Repo `sucuke4-cell/meine-claude-skills`, folder `video-studio/`:
- `setup.sh`: installs three.js, Kokoro TTS (free, offline voices) and Python packages, downloads the voice model from GitHub releases (Hugging Face may be blocked).
- `build.sh episodes/<name>`: voice-over → music + sfx mix → frames (Playwright + headless Chromium) → `out/<name>.mp4`.
- `shared/render.mjs`: renders frames; `RANGE="a-b"` re-renders only some seconds, `node shared/render.mjs <ep> 30 "1.5,20"` renders test stills.
- `shared/music.py`: procedural cinematic score. Moods: mystery, tension, action, sad, otherworld, dread, climax, silence.
- `episodes/part1`, `episodes/part2`: each has `make_vo.py` (script + voices + timing), `make_audio.py` (music cues + sfx), `scene.js` (3D scene, one `case` per story scene), `index.html` (caption styles), `timeline.json` (generated).
- Finished MP4s are on the git branch `videos` (not on `main`, to keep the plugin small).

## Making a new episode
1. **Story first.** Write it as 10–14 scenes, 60–100 s: hook in the first 3 s (recap or question), clear goal and stakes, a mystery or clue, an emotional beat, a twist that was foreshadowed earlier, and an open cliffhanger plus a comment question. Show it to the user and get an OK before building.
2. Copy the latest episode folder to `episodes/partN`. In `make_vo.py`, edit `SCENES` (gap, speaker, key, text). Speakers: N narrator `am_onyx`, M Milo `am_puck`, J Juno `af_nicole`, A Admin `bm_george`, K Keeper (`am_onyx`, pitched down + echo), AK Admin with the Keeper's voice.
3. In `scene.js`, write one `case` per scene: positions, poses, faces (`smile laugh shock worried determined stern smirk redeyes keeper sleep sad blank`), camera `camPos`/`look`, and overlays. Use `vs(key)` / `ve(key)` to sync to the voice lines.
4. In `make_audio.py`, set the music `cues` and sound effects. Keep the background quiet and free of hiss (the user asked for no rushing noise). Use tonal sounds and low-passed rumbles, never plain white noise.
5. **Check before the full render.** Render 2 stills per scene, put them on a contact sheet and look at them. Fix any shot where a character's head or the open door blocks the camera (the most common problem). Then run the full render (about 0.45 s per frame with 4 workers).
6. Check the finished MP4: a contact sheet of frames, and the loudness (mean about −15 dB, peak ≤ −1.5 dB).
7. Send the MP4 and a cover JPG to the user, with a TikTok caption, a YouTube title and description, and a comment to pin. Remind them to switch on the "AI-generated content" label. Commit the code to `main` and the MP4 to the `videos` branch.

## Series bible (keep it consistent)
- **Milo:** orange hair, red hoodie with a white stripe, jeans, white shoes; brave and loyal. Since Part 2 he is trapped behind the door.
- **Juno:** purple pigtails, yellow jacket, black skirt; Milo's best friend; whispers.
- **Admin:** gold crown, purple shirt. Secretly connected to the Keeper: his eyes glow red and he speaks with the Keeper's voice.
- **Keeper:** tall, black, hooded, glowing red eyes; rule: "every time the door opens, someone must stay."
- **Rules:** #1 Never open the red door. #2 Never trust the admin.
- The characters are original blocky avatars "in Roblox style": no Roblox logos, and never present it as official Roblox content.
