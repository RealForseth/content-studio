# Content Studio — Johannes Forseth

## About
Personal content creation system for Johannes Forseth (21, Oslo, BI student).
Two YouTube channels: Professional (AI/tech tutorials) + Personal brand (vlogs).

## What's Here

### Skills (.claude/skills/)
- **carl-video-editor** — AI video editing: cut silence, add subtitles, b-roll, effects, render with Remotion
- **gemini-api** — Google Gemini models via beta.vertexapis.com (text, images, video analysis)

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
- RetroGlass.jsx, RetroPong.jsx — Retro glass effects

### Research (research/)
- **matt-gray/** — Deep brand analysis (text, visual, video, strategy)
- **nick-saraev/** — Video-by-video Gemini analysis (in progress)
- **liam-ottley/** — Professional channel analysis (in progress)
- **liam-vlogs/** — Vlog channel analysis (in progress)
- **autoresearch-video.py** — Karpathy-inspired self-improving video loop

## How to Work
- Norwegian by default unless asked for English
- Use skills when available
- Read style files before applying any style
- All Remotion rendering: use OffthreadVideo, re-encode VFR to constant 30fps
- Gemini API: always include "role": "user", use requests lib with User-Agent header
- Don't over-engineer. Start small, iterate.

## API Keys
- Gemini: in .env (GEMINI_API_KEY)
- ElevenLabs: in .env (ELEVENLABS_API_KEY)
- YouTube: in .env (YOUTUBE_API_KEY)

## Content Strategy
- Professional channel: AI agents, Claude Code tutorials (Nick Saraev / Liam Ottley inspired)
- Personal brand channel: vlogs, building in public (Liam Ottley VLOGs / Matt Gray inspired)
- Brand voice: authentic, casual, Norwegian, NOT techie-bro
- Skills-based workflow: scriptwriter → film → cut → subtitles → b-roll → post
