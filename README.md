# Content Studio

Personal content creation system built with Claude Code + Remotion.

## Quick Start

```bash
git clone https://github.com/RealForseth/content-studio.git
cd content-studio

# Setup Remotion
cd remotion && npm install && cd ..

# Copy env
cp .env.example .env
# Fill in your API keys
```

## Usage

Open Claude Code in this directory:
```bash
claude
```

Skills are automatically loaded from `.claude/skills/`.

### Available Skills
- `/carl` — AI video editing (cut, subtitle, b-roll, render)
- `/gemini` — Gemini API for analysis and image generation

### Styles
Check `styles/` for video editing style guides.

### Remotion
```bash
cd remotion
npx remotion render CompositionId out/video.mp4
```
