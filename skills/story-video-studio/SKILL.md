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

## Series 2: "Shadow Shift" (In this town, your shadow clocks out at 9 PM)
- Folder `episodes/shadows1`: its own town world (`main.js`, built into `scene.js` by `build_scene.py`, which reuses the helpers and avatars from part2). Street with houses, lamps, a clock tower, the factory (interior at z=-60) and Theo's room (at z=+60). Times of day are set with `setTOD('dusk'|'night'|'morning')`. Shadow people come from `makeShadow()` and are moved with `placeShadow(holder, x, z, rotY, standK)`.
- Cast: **Theo** (12, green hoodie, brown cap hair, voice `am_liam`), **Mom** (`af_sarah`), the **Foreman** shadow (tall, top hat, white eyes, `am_fenrir` pitched down + echo), and Theo's own shadow (it cannot talk and writes on walls).
- World rule: at 9 PM every shadow stands up and walks to the old factory for the night shift; they come back at sunrise. People without a shadow slowly fade (Theo's hand turns transparent).
- Part 1 cliffhanger: the shadows build a glowing "sunrise" in the factory. Theo's shadow hid in his closet and wrote "THEY LIED. IT'S NOT A SUNRISE." The tower strikes nine again at midnight.
- Part 2 (`episodes/shadows2`, built from shadows1's main.js plus `_assets.js` and `_switch.js`): Theo's shadow draws a black sun on the wall ("TONIGHT 9:00"); Mom's shadow turns its head and smiles; the black sun rises over the factory, the lamps die and people fade. Theo pulls the lever at the clock tower: all the lights blaze, the black sun cracks and the shadows are pulled home. Twist: Theo's new shadow wears the Foreman's top hat. The real shadow is missing. Next: Part 3 ("Where is Theo's REAL shadow?").
- Part 3 (`episodes/shadows3`, from shadows2's main.js plus `_assets3.js` and `_switch3.js`): the top-hat shadow follows Theo one second late and threatens to take him at nine. Mom believes Theo. In the factory, a door behind the time clock leads to a bright hall where hundreds of shadows hang from hooks like coats (the HALL set at z=-100). The Foreman stands up and drags Theo; Mom's flashlight (SpotLight + beam cone) makes him let go; Theo punches his card and his real shadow comes home and waves. Twist: the last hook holds a dusty shadow tagged "MARA" (Mom's name), and the shadow following Mom smiles. Next: Part 4 ("Whose shadow is following Mom?").

## Series 3: "In This Town" (compilation format, copies the viral montage style)
- Folder `episodes/townclocks1` (self-contained `main.js`, built by `build_scene.py`): one long street with houses/lamps/clock tower plus per-story props (umbrella+rain, market stall+doll, birthday cake with a changeable number of candles, a garden of tomato plants whose eyes open, a spooky house with stacking welcome mats, a siren pole + a window where Mom smiles). Reuses the shared avatars/helpers.
- Format: 6 short original "In this town..." micro-stories (~18-22s each), narrator (am_onyx), big captions, each a weird town rule + a quick twist, ~2 min, ending on "Which rule would you break?". This matches the compilation style the user likes from TikTok. Make new episodes by swapping the 6 rules and props; keep them original (no clocks-only repeat).

## New look (from whatifstoriess study) + emotional format
- `shared/avatars_round.js`: ROUNDED, expressive avatar system (sphere head, capsule/rounded limbs, soft shading). makeAvatar({seed/skin/hair/top/legs/hairStyle/acc}); setFace (smile/happy/laugh/sad/cry/worried/surprise/angry/warm/blink), setBlush, setTears, pose, idle (breathing+sway), blinkFace, walkPose, place. Use this for all NEW episodes; keep the old blocky makeAvatar only for the earlier Red Door / Shadow Shift series.
- Reference channel whatifstoriess: ONE continuous emotional "what if" story (~90-115s), a strong visual metaphor (he uses grey→color), many locations, FAST narrator (am_onyx speed ~1.06), fast cuts (~1 caption word per cut), bittersweet/wholesome. Hook = title card + first line.
- Example `episodes/window1` ("The Window She Drew"): grey room, alley windows with chalk drawings, and vignette locations (ocean+whale, forest+fireflies, city night, snow mountains, outdoor street, sunset beach). Grey vs warm/color lighting via setMood('grey'|'warm'|'color').
- USER RULE: for every NEW story, make NEW characters AND a NEW town/area/places (don't reuse the same set). Always use the rounded avatars, lots of expression + gesture.

## World-building v2 (much higher quality) — use this for ALL new episodes going forward
- `shared/world_kit.js`: richer environment kit. setupRenderer/setupComposer (adds UnrealBloomPass + a subtle vignette/grade pass — call `composer.render()` instead of `renderer.render()` each frame), makeSky (gradient dome)+sunGlowSprite+cloudField, ground() with a real grass/sand/stone/dirt texture (not a flat color), water() with animated sparkle, contactShadow() (put one under every character so they don't float), treeRound()/treePine() (layered foliage, not a single cone), building() (real window grid with individually-lit glass, door+frame+knob+porch roof, corner trim, hip or gable roof, optional chimney), pier(), lighthouse() (striped tower, lamp room, rotating beam via setBeamAngle), boat(), rainField() for storms.
- Demo: `episodes/lighthouse1` "The Lighthouse That Waited" — fishing village, pier, lighthouse with sweeping beam, storm with rain+lightning, rescue of a stranger (not her father). Bittersweet, hopeful ending.
- HARD LESSONS (check these on every new episode before the full render, they bit us hard):
  1. **Portrait video has a much narrower HORIZONTAL fov than the vertical fov number** (three.js fov is vertical; aspect 0.5625 roughly halves the effective horizontal view). Two characters side-by-side more than ~1.5 units apart at a normal camera distance WILL get cropped at the left/right edges. Keep multi-character shots either front-to-back (one behind the other) or within ~1-1.5 units of lateral separation, or pull the camera back / raise fov to ~58-65 for wider two-shots.
  2. **Never point the camera through/past a subject from behind it.** When framing a tall landmark (tower, building), the camera's z (or relevant axis) must be on the near side of the subject, with the look-at target AT or beyond the subject — not the reverse (camera beyond the subject looking further away = empty sky, looks like a render bug). Sanity-check establishing shots by computing which side of the subject the camera sits on.
  3. Night/storm scenes need real ambient fill (hemi ~0.9-1.1, a moonlight directional ~0.6-0.9) or everything reads as pure black — moody-dark is fine, invisible is not.
  4. Point lights placed close to a character for "rim light" easily blow out with bloom on; keep intensities low (~3-6 at a few units' distance), not 10+.
  5. After any batch of fixes, re-render stills for literally all scenes (not just the one you changed) before committing to the full render — fixes elsewhere can reveal or hide problems.
