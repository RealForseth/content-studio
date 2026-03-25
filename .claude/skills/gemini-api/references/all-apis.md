# All Available APIs

Same API key works across all services: from .env `GEMINI_API_KEY`

## 1. Gemini (Video + Image Analysis + Generation)
- **Base URL:** `https://beta.vertexapis.com/v1beta/models`
- **Priority order:** gemini-3.1-pro-preview (BEST, use first) → gemini-2.5-pro (backup) → gemini-2.5-flash (fast fallback)
- **Image gen:** gemini-3.1-flash-image-preview, gemini-3-pro-image-preview
- **DO NOT use api.claude.gg for Gemini** (returns empty responses)
- **Can do:** Analyze WHOLE video files, generate images, text, audio transcription
- **Gotchas:** Always `"role": "user"`, always `User-Agent` header, use `requests` not `urllib`

## 2. Perplexity Sonar Pro (Web Research)
- **Base URL:** `https://perplexity.claude.gg`
- **Models:** sonar (fast), sonar-pro (deep, 20 results), unlimited-ai
- **Format:** OpenAI-compatible (`/v1/chat/completions`)
- **Can do:** Real-time web search, trending topics, current info
- **Best for:** Creator research, trending sounds, market analysis, niche research

## 3. GPT-5 / Codex (Text + Code)
- **Base URL (GPT):** `https://api.claude.gg`
- **Base URL (Codex):** `https://codex.claude.gg`
- **GPT models:** gpt-5, gpt-5.1, gpt-4o, gpt-o3, deepseek-r1, grok-4
- **Codex models:** gpt-5.3-codex, gpt-5.2-codex, gpt-5.1-codex-max, gpt-5-codex
- **Format:** OpenAI-compatible
- **Can do:** Text, code, image analysis (frames, not video)
- **Codex CLI:** Already installed, use `codex` command to delegate tasks to headless agents

## 4. ElevenLabs (Text-to-Speech)
- **API Key:** from .env `ELEVENLABS_API_KEY`
- **Best voice:** Liam (TX3LPaxmHKxFdv7VOQHJ) — young, energetic, casual
- **Model:** eleven_multilingual_v2 (supports Norwegian)

## Quick Decision Guide

| Task | Use This |
|------|----------|
| Analyze a video | Gemini 3.1 Pro (first) → 2.5 Pro → 2.5 Flash |
| Generate an image | Gemini 3-Pro Image or 3.1 Flash Image |
| Research trending topics | Sonar Pro |
| Write/fix code fast | GPT-5.3 Codex or Codex CLI |
| Generate voiceover | ElevenLabs (Liam) |
| Delegate parallel tasks | Codex CLI agents |
