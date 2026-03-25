---
name: video-edit
description: Johannes's signature video editing pipeline. Takes raw footage, cuts retakes/silence, adds pause-based subtitles, background music with lowpass, and renders via Remotion. Use when the user gives you a video file to edit, wants subtitles added, or says "rediger denne videoen". Covers the full pipeline from raw footage to final render.
---

# Video Edit — Johannes's Signature Style Pipeline

Full editing pipeline: raw footage → silence/retake removal → subtitles → music → render.

## Overview

1. **Prepare** — Re-encode to 30fps, create proxy if needed
2. **Transcribe** — faster-whisper with word-level timestamps
3. **Cut** — Remove retakes, silence, bad takes (Gemini + whisper, or whisper-only)
4. **Subtitle** — Pause-based grouping, corrected text, single line always
5. **Music** — Pick from Spotify playlists, lowpass filter, subtle mix
6. **Render** — Remotion with Inter Black font, #FFBF65 accent color

---

## Step 1: Prepare

```bash
# FIRST: Check rotation metadata (iPhone often records 16:9 with rotation=90 making it 9:16)
ffprobe -v quiet -print_format json -show_streams input.mp4 | grep rotation

# Re-encode to constant 30fps at MAXIMUM resolution (REQUIRED for Remotion)
# For 9:16 vertical content: ALWAYS 1080x1920 minimum
# ffmpeg auto-handles rotation metadata
ffmpeg -i input.mp4 -vf "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,format=yuv420p,fps=30" \
  -c:v libx264 -preset fast -crf 18 -movflags +faststart -c:a aac output_1080.mp4

# If >20MB, create proxy for Gemini analysis
./scripts/proxy.sh input.mp4
```

**NEVER render below 1080p.** Always scale UP to 1080x1920 for 9:16.

### Organize files
```
raw-footage/video-XX-name/
├── originals/      ← raw footage files
├── proxies/        ← proxy versions for Gemini
├── cuts/           ← cut segments + concat files
├── frames/         ← extracted frames for analysis
├── transcripts/    ← whisper + subtitle JSON files
└── final/          ← rendered output videos
```

---

## Step 2: Transcribe with faster-whisper

```python
from faster_whisper import WhisperModel
model = WhisperModel("medium", device="cpu", compute_type="int8")
segments, info = model.transcribe("video.mp4", language="no", word_timestamps=True, vad_filter=True)
```

Save ALL word-level timestamps. These are the ground truth for subtitle timing.

---

## Step 3: Cut — Remove retakes, silence, bad takes

### Method A: Gemini + whisper (best quality, if Gemini is up)

1. Send proxy video + whisper transcript to Gemini
2. Gemini identifies which segments to KEEP (not cut)
3. Returns a JSON cut list with start/end times

```python
# Use gemini-3.1-pro-preview (preferred) or gemini-2.5-flash (fallback)
# If beta.vertexapis.com is down, use original Google API:
#   https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=GOOGLE_API_KEY
prompt = f"""Denne videoen er rå footage. Lag en STRAM cut-liste som fjerner:
1. Alle retakes (behold KUN den beste versjonen)
2. ALL silence over 0.3 sekunder — vær AGGRESSIV, kutt tett!
3. Nøling, uferdige setninger, feilstart
Kutt skal være TETT — Matt Gray / Liam Ottley stil. Ingen dead air.
Returner JSON: [{{"s": 0.0, "e": 4.3, "t": "hva som sies"}}]"""
```

**IMPORTANT — Gemini trunkerer ofte JSON-responses.** Løsninger:
- Bruk korte nøkler (`s`, `e`, `t` istedenfor `start`, `end`, `text`)
- Sett `maxOutputTokens: 8192`
- Hvis JSON er trunkert: finn siste `}` og legg til `]` for å lukke arrayen
- Hold prompten kort — Gemini trunkerer mer med lange prompts

**IMPORTANT — Gemini kan gi for løse cuts.** Etter Gemini returnerer, gå gjennom listen manuelt:
- Fjern retakes Gemini ikke fanget (den beholder ofte begge versjoner)
- Stram silence: hvis det er >0.5s gap mellom segmenter, vurder å kutte tettere
- Videoen skal føles snappy — ingen pauser der personen ikke snakker

### Method B: Whisper-only (if Gemini is down)

Use whisper's word timestamps + silence detection to build cuts:
```bash
ffmpeg -i input.mp4 -af "silencedetect=noise=-30dB:d=0.3" -f null - 2>&1 | grep silence
```
Then manually review with the user which segments to keep.

### Cut with ffmpeg
```python
# For each segment in cut list:
ffmpeg -y -ss START -i input.mp4 -t DURATION \
  -c:v libx264 -preset fast -crf 18 \
  -c:a aac -b:a 128k segment_XX.mp4

# Concatenate all segments:
ffmpeg -f concat -safe 0 -i concat.txt -c:v libx264 -preset fast -crf 18 output.mp4
```

### IMPORTANT: Ask user to confirm cuts
After generating the cut list, tell the user what will be removed and ask for confirmation before cutting. Especially flag:
- Segments where retakes were chosen (which version was kept)
- Any B-roll or visual moments that might be cut by accident

---

## Step 4: Subtitle — Pause-based grouping (Johannes method v3)

This is the proven method. NEVER use fixed word-count grouping.

### 4a: Get word timestamps from whisper on the EDITED video
```python
# Transcribe the EDITED video (not the original)
segments, info = model.transcribe("edited_video.mp4", language="no", word_timestamps=True, vad_filter=True)
```

### 4b: Correct text with Gemini (or manually)
Send whisper transcript to Gemini for text correction. Common whisper errors:
- Names (Jonas → Johannes)
- English words mixed into Norwegian
- Slang, brand names, technical terms

If Gemini is down: ask the user to review and correct the transcript manually.

### 4c: Group by natural speech pauses

```python
PAUSE_THRESHOLD = 0.12  # seconds — break at any gap > 120ms

for each word:
    if gap_from_previous > PAUSE_THRESHOLD: start new group
    if previous_word ends with (. ? !): start new group
    if group has >= 4 words: start new group
```

### Rules (CRITICAL — these make or break subtitle quality)
- **ALWAYS single line** (never two lines)
- **No ellipsis** (...) — just normal text
- **No mechanical grouping** — follow actual speech rhythm
- **Sentence boundaries ALWAYS trigger new group** (. ? !)
- **Lists shown one at a time** (Instagram, → TikTok, → YouTube, → each separate)
- **Short standalone words are fine** ("gjør?", "her,", "AI-en.")
- **No cross-sentence contamination** — NEVER mix end of one sentence with start of next
- **B-roll/insert clips get NO subtitles** — mark no-sub zones

### 4d: Ask user to verify subtitle accuracy
Show the user a few key subtitle groups and ask if they match what's being said. Especially verify:
- First and last subtitles
- Any corrected words (names, technical terms)
- Timing around cut points

---

## Step 5: Music — From Spotify playlists with lowpass

### Pick a track from Johannes's curated playlists

**DO NOT research with Sonar Pro unless explicitly asked.** Pick from these:

| Playlist | Vibe | Use for |
|----------|------|---------|
| **CONTENT 26** (Johannes's personal) | Mixed, personal picks | When he says "fra min liste" |
| **Alltid bra valg** (Daniel Dalen) | Hip-hop, soulful, confident | Short-form, entrepreneur energy |
| **Aesthetic YouTube Vlogs** | Lo-fi, chill | Talking head, day-in-the-life |
| **Ethan Weng Vlogs** | Upbeat, energetic | Travel, montages, longer YouTube |

Full playlists with Spotify links are in the trending-sound skill.

### Download from YouTube (requires WARP)
```bash
warp-cli connect
sleep 2
yt-dlp --extract-audio --audio-format mp3 --audio-quality 0 \
  -o "music.%(ext)s" "ytsearch1:TRACK ARTIST instrumental"
# DON'T disconnect WARP yet — do it at the very end of the session
```

**Prefer instrumental versions** — search with "instrumental" appended.

### Mix with lowpass filter
```bash
# Lowpass at 800Hz gives muffled "through the wall" texture
# Volume at 7% — very subtle, just fills the background
# Fade in 2s, fade out 3s
ffmpeg -y -i edited_video.mp4 -i music.mp3 \
  -filter_complex "[1:a]atrim=0:DURATION+5,asetpts=PTS-STARTPTS,lowpass=f=800,volume=0.07,afade=t=in:st=0:d=2,afade=t=out:st=FADE_OUT_START:d=3[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=3[out]" \
  -map 0:v -map "[out]" \
  -c:v copy -c:a aac -b:a 192k \
  output_with_music.mp4
```

### Audio settings
- **Lowpass:** 800Hz (ask user if they want different — this is the proven default)
- **Volume:** 7% for talking head (ask user to confirm)
- **Fade in:** 2 seconds from start
- **Fade out:** 3 seconds before end
- **Always analyze voice volume first** with `volumedetect`

---

## Step 6: Render with Remotion

### Subtitle style (Inter Black, white, shadow)
```jsx
const C = {
  subtitleColor: "#FFFFFF",
  subtitleShadow: "0 2px 6px rgba(0,0,0,0.7), 0 0 14px rgba(0,0,0,0.4)",
  accent: "#FFBF65", // Johannes signature warm gold
};

// Font: Inter Black (900)
// Size: scale to canvas — 54px for 1080x1920, 36px for 720x1280
// Letter-spacing: -1.5px (1080) or -1px (720)
// Position: bottom 220px (1080) or bottom 140px (720)
// Max width: 90%
// Always single line
```

### Special effects available
- **Slack→Telegram correction:** Strikethrough in #FFBF65 with correction text above. Use when Johannes says the wrong word and wants to show the correction creatively.
- **Accent color highlights:** #FFBF65 warm gold for important words (use sparingly, only when asked)

### Render command
```bash
cd remotion && npx remotion render JohannesSubs --output out/final.mp4 --concurrency=3
```
Use `--concurrency=3` to avoid disk space issues on Mac.

### Composition setup
```jsx
// ALWAYS 1080x1920 for 9:16 content — NEVER 720x1280
<Composition
  id="VideoSubs"
  component={VideoSubs}
  durationInFrames={TOTAL_FRAMES}  // video duration * 30
  fps={30}
  width={1080}
  height={1920}
/>
```

---

## Step 7: Deliver + cleanup

1. Open the rendered video for the user
2. Ask: "Hva synes du? Noe du vil justere?"
3. Common adjustments:
   - Music volume (up/down)
   - Subtitle text corrections
   - Cut timing tweaks
   - Add/remove B-roll segments
4. Disconnect WARP at the very end: `warp-cli disconnect`

---

## What NOT to do

- **No zoom transitions** — tested, didn't work for this style
- **No motion blur effects** — too heavy, wrong aesthetic
- **No fixed word-count subtitle grouping** — always use pause-based
- **No TikTok Creative Center as sole music source** — results are often sad/mismatched
- **No Sonar Pro music research unless asked** — use the Spotify playlists
- **Don't leave WARP connected** between tasks — disconnect at session end
- **Don't render at full concurrency** if disk is tight — use `--concurrency=3`

---

## Quick reference

| Setting | Value |
|---------|-------|
| Font | Inter Black (900) |
| Subtitle size | 54px (1080w) / 36px (720w) |
| Subtitle color | #FFFFFF |
| Accent color | #FFBF65 |
| Music volume | 7% |
| Lowpass | 800Hz |
| Fade in | 2s |
| Fade out | 3s |
| Pause threshold | 0.12s |
| Max words/group | 4 |
| FPS | 30 |
| Whisper model | medium, language="no" |
| Gemini model | gemini-3.1-pro-preview (fallback: 2.5-flash) |
