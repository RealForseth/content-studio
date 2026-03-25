# Content Studio — Johannes Forseth

## About
Personal content creation system for Johannes Forseth (21, Oslo, BI student).
Two YouTube channels: Professional (AI/tech tutorials) + Personal brand (vlogs).

## What's Here

### Skills (.claude/skills/)
- **gemini-api** — Google Gemini models via beta.vertexapis.com (text, images, video analysis, image generation)

### Commands (.claude/commands/)
- **/wrapup** — Save conversation, generate summary, compact
- **/catchup** — Read latest summaries, check system status

### Styles (styles/)
Video editing styles — read these before applying any style:
- **johannes-broll-v1.md** — Light bg, orange accent, Inter Black, edge-only displacement
- **mapal-title-card-v1.md** — Dark editorial, warm palette, film grain, mask reveals, wiggle
- **vox-title-v1.md** — Scrolling list with highlight box, posterize time, turbulent displace

### Remotion (remotion/)
Video rendering components. Setup: `cd remotion && npm install`
- MapalDemo.jsx — Editorial title cards with full effects stack
- JohannesVideo.jsx — Talking head + b-roll subtitles
- VoxTitle.jsx — VOX scrolling title animation
- ShortBrand.jsx — Short-form personal brand video

### Research (research/)
- **matt-gray/** — Deep brand analysis (text, visual, video, strategy)
- **nick-saraev/** — Video-by-video Gemini analysis (in progress)
- **liam-ottley/** — Professional channel analysis (in progress)
- **liam-vlogs/** — Vlog channel analysis (in progress)
- **autoresearch-video.py** — Karpathy-inspired self-improving video loop

## Video Editing Workflow

When Johannes gives you a raw video file, follow this pipeline:

### Step 1: Prepare
```bash
# If file is >20MB, create proxy for Gemini analysis
./scripts/proxy.sh input.mp4

# Re-encode to constant 30fps (required for Remotion)
ffmpeg -i input.mp4 -vf "fps=30,format=yuv420p" -c:v libx264 -preset fast -crf 18 -movflags +faststart -c:a aac output_30fps.mp4
```

### Step 2: Transcribe (faster-whisper)
```python
from faster_whisper import WhisperModel
model = WhisperModel("medium", device="cpu", compute_type="int8")
segments, info = model.transcribe("audio.wav", language="no", word_timestamps=True)
```
This gives word-level timestamps for subtitles and cut points.

### Step 3: Analyze with Gemini
Send the video (or proxy) to Gemini for content analysis:
- What's being said and when
- Key moments for b-roll
- Silence/bad takes to cut
- Suggested structure

Use the gemini-api skill for API details. Key: always `"role": "user"`, always `User-Agent` header.

### Step 4: Cut
Use ffmpeg to remove silence and bad takes based on Gemini + whisper analysis:
```bash
# Detect silence
ffmpeg -i input.mp4 -af "silencedetect=noise=-30dB:d=0.5" -f null - 2>&1 | grep silence

# Cut specific segment
ffmpeg -i input.mp4 -ss START -to END -c copy segment.mp4
```

### Step 5: Overlays (Remotion)
Generate subtitle overlay and b-roll slides matching Johannes's style.
Read the relevant style from styles/ before generating.
Use OffthreadVideo (NEVER Video component) for embedding video in Remotion.

## How to Work
- Norwegian by default unless asked for English
- Use skills when available
- Read style files before applying any style
- All Remotion rendering: use OffthreadVideo, re-encode VFR to constant 30fps
- Gemini API: always include "role": "user", use requests lib with User-Agent header
- For large videos (>20MB): use scripts/proxy.sh before sending to Gemini
- Don't over-engineer. Start small, iterate.

## API Keys (put in .env)
- GEMINI_API_KEY — Google Gemini via beta.vertexapis.com
- ELEVENLABS_API_KEY — Text-to-speech
- YOUTUBE_API_KEY — YouTube data API

## Content Strategy
- Professional channel: AI agents, Claude Code tutorials (Nick Saraev / Liam Ottley inspired)
- Personal brand channel: vlogs, building in public (Liam Ottley VLOGs / Matt Gray inspired)
- Brand voice: authentic, casual, Norwegian, NOT techie-bro
- Research in research/ folder — read before creating content
- Skills-based workflow: scriptwriter → film → cut → subtitles → b-roll → post
