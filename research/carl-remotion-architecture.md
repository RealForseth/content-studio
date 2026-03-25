# Carl + Remotion Architecture

Integrating Remotion-based video rendering into the Carl AI video editor.

---

## System Diagram

```
                          +------------------+
                          |   Carl Frontend  |
                          |   (Next.js/React)|
                          +--------+---------+
                                   |
                          REST API + WebSocket (progress)
                                   |
                          +--------v---------+
                          |   Carl Backend   |
                          |   (Next.js API)  |
                          +--+---+---+---+---+
                             |   |   |   |
              +--------------+   |   |   +---------------+
              |                  |   |                    |
     +--------v------+  +-------v---v----+  +------------v-----------+
     | Upload/Proxy   |  | Analysis       |  | Remotion Render Service |
     | (FFmpeg)       |  | Pipeline       |  | (Node.js subprocess)    |
     |                |  |                |  |                         |
     | - Proxy encode |  | - Gemini API   |  | - Bundle compositions   |
     | - Thumbnail    |  | - faster-whisper|  | - Render to MP4         |
     | - 30fps re-enc |  | - Scene detect |  | - Style registry        |
     +----------------+  +-------+--------+  +------------+------------+
                                  |                        |
                          +-------v--------+      +--------v--------+
                          |  Project DB    |      | Remotion Bundle |
                          |  (SQLite)      |      | (matt-gray-demo)|
                          |                |      |                 |
                          | - clips        |      | - Styles (JSX)  |
                          | - scenes       |      | - Effects       |
                          | - transcripts  |      | - Fonts         |
                          | - timelines    |      +-----------------+
                          | - style prefs  |
                          +----------------+

Chat/Refine Loop:
  User <-> Carl Chat <-> Gemini Flash <-> Timeline JSON <-> Remotion
```

---

## Core Technical Decision: JSON Timeline as Intermediate Representation

The central design choice is that **all edit decisions are expressed as a JSON timeline** that maps directly to Remotion `<Sequence>` components. The AI generates JSON, the user refines via chat, and Remotion renders from JSON. No one writes JSX at edit time.

```
User chat -> AI -> Timeline JSON -> Remotion DynamicComposition -> MP4
```

---

## Timeline JSON Schema

Every project has a timeline that fully describes the output video:

```jsonc
{
  "version": 1,
  "style": "johannes-broll-v1",        // or "mapal-title-card-v1", etc.
  "canvas": { "width": 464, "height": 848 },
  "fps": 30,
  "tracks": [
    {
      "type": "video",
      "clips": [
        {
          "id": "clip_01",
          "sourceFileId": "abc123",     // references workspace file
          "startInSource": 0.0,         // seconds into source file
          "endInSource": 8.5,
          "startInTimeline": 0.0,       // position in final output
          "volume": 1.0
        },
        {
          "id": "clip_02",
          "sourceFileId": "abc123",
          "startInSource": 14.2,
          "endInSource": 22.0,
          "startInTimeline": 8.5
        }
      ]
    },
    {
      "type": "subtitles",
      "segments": [
        {
          "text": "Jeg heter Johannes,",
          "start": 0.0,
          "end": 0.98
        }
        // ... word-level segments from faster-whisper
      ]
    },
    {
      "type": "broll",
      "slides": [
        {
          "start": 2.68,
          "duration": 1.36,
          "lines": [
            { "text": "droppe ut", "big": true, "accent": true },
            { "text": "av hoeyskolen", "big": false }
          ]
        }
      ]
    },
    {
      "type": "title-card",
      "cards": [
        {
          "start": 0.0,
          "duration": 3.0,
          "layout": "centered",         // layout variant
          "elements": [
            { "type": "label", "text": "introducing" },
            { "type": "hero-italic", "text": "Beautiful" },
            { "type": "hero-bold", "text": "TITLES", "color": "accent" },
            { "type": "annotation", "text": "made with remotion - 2026" }
          ]
        }
      ]
    }
  ],
  "effects": {
    "progressBar": true,
    "filmGrain": { "enabled": true, "opacity": 0.06 },
    "paperTexture": { "enabled": false },
    "vignette": { "enabled": false },
    "lightFlicker": { "enabled": false },
    "cameraShake": { "enabled": false, "intensity": 1.2 },
    "displacement": { "enabled": true }
  }
}
```

---

## Style System

Each style is a named bundle of:
1. **Default effects** (which overlays are on/off, parameters)
2. **Component mappings** (how subtitle/broll/title-card tracks render)
3. **Color palette**
4. **Typography config**
5. **Animation presets**

### Style Registry

```
carl-video-editor/
  src/
    remotion/
      styles/
        index.ts                    # Registry: style name -> config
        johannes-broll-v1/
          config.ts                 # Colors, fonts, effects defaults
          BrollSlide.tsx            # B-roll text slide component
          Subtitle.tsx              # Subtitle overlay component
          ProgressBar.tsx           # Bottom progress bar
          effects.ts                # Which effects to enable
        mapal-title-card-v1/
          config.ts
          TitleCard.tsx             # Editorial title card component
          effects.ts
      components/
        shared/                     # Shared across all styles
          FilmGrain.tsx
          PaperTexture.tsx
          Vignette.tsx
          LightFlicker.tsx
          CameraShake.tsx
          WiggleText.tsx
          MaskReveal.tsx
          DecorativeLine.tsx
          DisplacementFilter.tsx
          ShimmerFilter.tsx
      DynamicComposition.tsx        # Main: reads timeline JSON, renders correct style
      Root.tsx                      # Remotion entry point
```

### Style config example (johannes-broll-v1/config.ts)

```ts
export const johannesBrollV1 = {
  id: "johannes-broll-v1",
  name: "Johannes B-roll",
  canvas: { width: 464, height: 848 },
  fps: 30,
  colors: {
    bg: "#F6F6F6",
    text: "#2B2B2B",
    accent: "#FF8C00",
    subtitleText: "#FFFFFF",
  },
  fonts: {
    primary: { family: "Inter", weight: "900" },
  },
  effects: {
    filmGrain: false,
    paperTexture: false,
    vignette: false,
    lightFlicker: false,
    cameraShake: false,
    displacement: true,  // edge-only shimmer on b-roll
    progressBar: true,
  },
  subtitle: {
    fontSize: 36,
    bottom: 140,
    maxWords: 5,
    letterSpacing: "-1px",
    shadow: "0 2px 6px rgba(0,0,0,0.7), 0 0 14px rgba(0,0,0,0.4)",
  },
  broll: {
    bigFontSize: 58,
    smallFontSize: 34,
  },
};
```

### Style config example (mapal-title-card-v1/config.ts)

```ts
export const mapalTitleCardV1 = {
  id: "mapal-title-card-v1",
  name: "Mapal Title Card",
  canvas: { width: 1920, height: 1080 },
  fps: 30,
  colors: {
    bg: "#1a1714",
    text: "#f5f0e8",
    muted: "#8a8278",
    accent: "#c4653a",
    gold: "#c9a84c",
  },
  fonts: {
    serif: { family: "Playfair Display", weights: ["400", "700", "900"] },
    serifItalic: { family: "Playfair Display", style: "italic", weights: ["400", "700"] },
    sans: { family: "Inter", weights: ["300", "500", "900"] },
    mono: { family: "Space Grotesk", weights: ["300", "500", "700"] },
  },
  effects: {
    filmGrain: { enabled: true, opacity: 0.06 },
    paperTexture: { enabled: true, opacity: 0.1 },
    vignette: { enabled: true, strength: 0.35 },
    lightFlicker: true,
    cameraShake: { enabled: true, intensity: 1.2 },
    displacement: { enabled: true, baseFrequency: 0.012, scale: 3 },
    progressBar: false,
  },
  animations: {
    maskReveal: { damping: 15, stiffness: 80, mass: 0.8 },
    wiggle: { amount: 1.2, speed: 0.5 },
    stagger: 6, // frames between elements
  },
};
```

---

## API Endpoints

All under `/api/` in the Next.js app.

### Existing (keep as-is)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/upload` | Add video files from local path |
| GET | `/api/files` | List workspace files |
| GET | `/api/proxy/[id]` | Stream proxy video |
| GET | `/api/thumbnail/[id]` | Serve thumbnail |

### New: Analysis

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/analyze` | Start Gemini + whisper analysis on a file |
| GET | `/api/analyze/[fileId]` | Get analysis status/results |
| GET | `/api/transcript/[fileId]` | Get word-level transcript |

### New: Project / Timeline

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/projects` | Create new project (selects files + style) |
| GET | `/api/projects/[id]` | Get project with current timeline |
| PUT | `/api/projects/[id]/timeline` | Update timeline JSON directly |
| POST | `/api/projects/[id]/suggest` | AI generates initial timeline from analysis |
| POST | `/api/projects/[id]/chat` | Chat refinement ("move clip 2 to end") |
| GET | `/api/projects/[id]/chat/history` | Get chat history for project |

### New: Render

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/render` | Start Remotion render from timeline JSON |
| GET | `/api/render/[jobId]` | Get render status + progress |
| GET | `/api/render/[jobId]/download` | Download finished MP4 |

### New: Styles

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/styles` | List available styles with preview info |
| GET | `/api/styles/[id]` | Get style config details |

---

## Data Flow

### 1. Upload + Proxy

```
User uploads folder path
  -> POST /api/upload
  -> FFmpeg creates proxy (1280p, h264, 30fps)
  -> FFmpeg generates thumbnail
  -> FFprobe extracts metadata (duration, resolution)
  -> Workspace updated with file info
```

### 2. Analysis

```
POST /api/analyze { fileId }
  |
  +-> faster-whisper (local, medium model)
  |     -> word-level transcript with timestamps
  |     -> stored in SQLite: transcripts table
  |
  +-> FFmpeg re-encode to constant 30fps (for Remotion)
  |     -> stored alongside original
  |
  +-> Gemini Flash (video analysis)
        -> scene changes with timestamps
        -> visual content descriptions per scene
        -> emotional tone / energy levels
        -> suggested b-roll keywords
        -> stored in SQLite: scenes table
```

### 3. AI Suggests Timeline

```
POST /api/projects/{id}/suggest
  |
  +-> Load transcript + scene analysis from DB
  +-> Load style config (effects, colors, typography rules)
  +-> Prompt Gemini Pro:
  |     "Given this transcript, scene analysis, and style rules,
  |      generate a timeline JSON with:
  |      - Clip ordering (cut dead air, reorder for story)
  |      - B-roll slides on key phrases
  |      - Subtitle segments (3-4 words each)
  |      - Title card if style supports it"
  +-> Validate output against timeline schema
  +-> Store as project timeline
  +-> Return to frontend for preview
```

### 4. Chat Refinement

```
POST /api/projects/{id}/chat { message: "add more b-roll at 0:15" }
  |
  +-> Load current timeline JSON
  +-> Load transcript + analysis for context
  +-> Prompt Gemini Flash:
  |     "Current timeline: {json}
  |      User request: 'add more b-roll at 0:15'
  |      Transcript around 0:15: '...'
  |      Return the updated timeline JSON."
  +-> Validate, diff against previous
  +-> Store new timeline version
  +-> Return updated timeline + description of changes
```

### 5. Render

```
POST /api/render { projectId }
  |
  +-> Load timeline JSON from project
  +-> Write timeline to temp file in Remotion project
  +-> Resolve video source paths (use 30fps re-encoded versions)
  +-> Symlink/copy source videos to Remotion public/ directory
  +-> Execute: npx remotion render DynamicComposition --props=timeline.json
  |     (runs as child process)
  +-> Stream progress via WebSocket or polling GET /api/render/{jobId}
  +-> On complete: move output MP4 to carl-data/renders/
  +-> Return download URL
```

---

## DynamicComposition: The Bridge

This is the core Remotion component that reads timeline JSON and renders the correct style.

```tsx
// remotion/DynamicComposition.tsx (simplified)

import { AbsoluteFill, Sequence, OffthreadVideo, staticFile } from "remotion";
import { getStyle } from "./styles";

export const DynamicComposition: React.FC = () => {
  // Timeline JSON passed as Remotion inputProps
  const timeline = getInputProps();
  const style = getStyle(timeline.style);

  const totalFrames = calculateTotalFrames(timeline);
  const s = (sec: number) => Math.round(sec * timeline.fps);

  return (
    <AbsoluteFill style={{ backgroundColor: style.colors.bg }}>
      {/* Video track */}
      {timeline.tracks.find(t => t.type === "video")?.clips.map(clip => (
        <Sequence key={clip.id} from={s(clip.startInTimeline)} durationInFrames={s(clip.endInSource - clip.startInSource)}>
          <OffthreadVideo
            src={staticFile(resolveSource(clip.sourceFileId))}
            startFrom={s(clip.startInSource)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </Sequence>
      ))}

      {/* Subtitle track */}
      {timeline.tracks.find(t => t.type === "subtitles")?.segments.map((seg, i) => (
        <style.components.Subtitle key={i} text={seg.text} from={s(seg.start)} duration={s(seg.end - seg.start)} />
      ))}

      {/* B-roll track */}
      {timeline.tracks.find(t => t.type === "broll")?.slides.map((slide, i) => (
        <Sequence key={i} from={s(slide.start)} durationInFrames={s(slide.duration)}>
          <style.components.BrollSlide lines={slide.lines} />
        </Sequence>
      ))}

      {/* Title card track */}
      {timeline.tracks.find(t => t.type === "title-card")?.cards.map((card, i) => (
        <Sequence key={i} from={s(card.start)} durationInFrames={s(card.duration)}>
          <style.components.TitleCard elements={card.elements} layout={card.layout} />
        </Sequence>
      ))}

      {/* Effects overlay stack (from style config) */}
      {style.effects.displacement && <style.components.DisplacementFilter />}
      {style.effects.paperTexture && <PaperTexture opacity={style.effects.paperTexture.opacity} />}
      {style.effects.filmGrain && <FilmGrain opacity={style.effects.filmGrain.opacity} />}
      {style.effects.lightFlicker && <LightFlicker />}
      {style.effects.vignette && <Vignette strength={style.effects.vignette.strength} />}
      {style.effects.progressBar && <style.components.ProgressBar />}
    </AbsoluteFill>
  );
};
```

---

## File Structure (Final)

```
carl-video-editor/
  src/
    app/
      page.tsx                          # Main UI (file browser + chat + preview)
      api/
        upload/route.ts                 # (existing)
        files/route.ts                  # (existing)
        proxy/[id]/route.ts             # (existing)
        thumbnail/[id]/route.ts         # (existing)
        analyze/
          route.ts                      # POST: start analysis
          [fileId]/route.ts             # GET: analysis results
        transcript/[fileId]/route.ts    # GET: word-level transcript
        projects/
          route.ts                      # POST: create project
          [id]/
            route.ts                    # GET: project details
            timeline/route.ts           # PUT: update timeline
            suggest/route.ts            # POST: AI generate timeline
            chat/
              route.ts                  # POST: chat refinement
              history/route.ts          # GET: chat log
        render/
          route.ts                      # POST: start render
          [jobId]/
            route.ts                    # GET: status
            download/route.ts           # GET: download MP4
        styles/
          route.ts                      # GET: list styles
          [id]/route.ts                 # GET: style details
    lib/
      workspace.ts                      # (existing) file management
      ffmpeg.ts                         # (existing) proxy/thumbnail/info
      db.ts                             # SQLite connection + schema
      whisper.ts                        # faster-whisper subprocess wrapper
      gemini.ts                         # Gemini API client (analysis + chat)
      timeline.ts                       # Timeline JSON validation + helpers
      render.ts                         # Remotion render subprocess manager

  remotion/                             # Remotion project (separate from Next.js)
    src/
      index.ts                          # Remotion entry
      Root.tsx                          # RegisterRoot
      DynamicComposition.tsx            # Main dynamic renderer
      styles/
        index.ts                        # Style registry
        johannes-broll-v1/
          config.ts
          BrollSlide.tsx
          Subtitle.tsx
          ProgressBar.tsx
        mapal-title-card-v1/
          config.ts
          TitleCard.tsx
      components/
        FilmGrain.tsx
        PaperTexture.tsx
        Vignette.tsx
        LightFlicker.tsx
        CameraShake.tsx
        WiggleText.tsx
        MaskReveal.tsx
        DecorativeLine.tsx
        DisplacementFilter.tsx
        ShimmerFilter.tsx
    public/                             # Symlinked source videos go here
    package.json                        # Separate deps: remotion, @remotion/*

  .carl-data/                           # Runtime data (gitignored)
    workspace.json
    uploads/
    proxies/
    thumbnails/
    renders/
    carl.db                             # SQLite database
```

---

## SQLite Schema

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  style TEXT NOT NULL DEFAULT 'johannes-broll-v1',
  canvas_width INTEGER NOT NULL,
  canvas_height INTEGER NOT NULL,
  fps INTEGER NOT NULL DEFAULT 30,
  timeline_json TEXT,                   -- full timeline JSON
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE project_files (
  project_id TEXT NOT NULL REFERENCES projects(id),
  file_id TEXT NOT NULL,                -- references workspace file
  PRIMARY KEY (project_id, file_id)
);

CREATE TABLE transcripts (
  file_id TEXT PRIMARY KEY,
  language TEXT,
  full_text TEXT,
  words_json TEXT,                      -- [{word, start, end, confidence}, ...]
  created_at TEXT NOT NULL
);

CREATE TABLE scenes (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  start_time REAL NOT NULL,
  end_time REAL NOT NULL,
  description TEXT,                     -- Gemini visual description
  emotion TEXT,                         -- calm, energetic, serious, etc.
  has_speech BOOLEAN,
  keywords_json TEXT,                   -- suggested b-roll keywords
  created_at TEXT NOT NULL
);

CREATE TABLE chat_messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  role TEXT NOT NULL,                   -- 'user' or 'assistant'
  content TEXT NOT NULL,
  timeline_version INTEGER,             -- which timeline version this produced
  created_at TEXT NOT NULL
);

CREATE TABLE render_jobs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  status TEXT NOT NULL,                 -- 'queued', 'rendering', 'done', 'error'
  progress REAL DEFAULT 0,
  output_path TEXT,
  error_message TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL
);
```

---

## Key Technical Decisions

### 1. Remotion as separate project, not embedded in Next.js

Remotion has its own webpack config and rendering pipeline. Embedding it in Next.js creates bundler conflicts. Instead:
- `carl-video-editor/remotion/` is a standalone Remotion project with its own `package.json`
- Carl's backend calls `npx remotion render` as a subprocess
- Timeline JSON is passed via `--props` flag
- Source videos are symlinked into `remotion/public/`

This keeps the two build systems separate and avoids version conflicts between React 18 (Carl/Next.js) and React 19 (Remotion v4).

### 2. JSON timeline as the single source of truth

Why not generate JSX directly?
- JSON is easy to validate, diff, and version
- The AI can generate/modify JSON reliably (structured output)
- The frontend can display a visual timeline from the same JSON
- Chat refinement is just JSON patching
- One `DynamicComposition` handles all rendering

### 3. faster-whisper runs locally (not API)

As established in past work: faster-whisper with the medium model runs on this VPS. No external API needed.
- Word-level timestamps are critical for subtitle sync
- Norwegian language support with `language="no"`
- Wrapper in `lib/whisper.ts` calls the Python process

### 4. Two Gemini calls: analysis + timeline generation

- **Analysis** (Gemini Flash): scene detection, visual descriptions, emotion, keywords. Runs once per file. Cached.
- **Timeline generation** (Gemini Pro): takes analysis + transcript + style rules, outputs timeline JSON. Runs per project.
- **Chat refinement** (Gemini Flash): takes current timeline + user message, outputs updated timeline. Fast and cheap.

### 5. Source videos re-encoded to constant 30fps before Remotion

Remotion + OffthreadVideo requires constant frame rate for frame-perfect sync. The re-encode step:
```
ffmpeg -i input.mp4 -vf "fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 15 -g 30 -bf 2 -movflags +faststart -c:a aac -b:a 192k output_30fps.mp4
```
This runs during the analysis step (after proxy creation). Stored alongside the original.

### 6. Preview uses Remotion Player in the browser

The `@remotion/player` package renders compositions in-browser without server-side rendering. Carl's frontend can show a live preview of the timeline using the same `DynamicComposition` component. This gives instant feedback during chat refinement without waiting for a full render.

---

## Implementation Plan

### Phase 1: Foundation (Remotion service + style extraction)

1. **Create `remotion/` directory** inside `carl-video-editor/` with its own package.json
2. **Extract shared components** from `matt-gray-demo/src/MapalDemo.jsx` into `remotion/src/components/` (FilmGrain, PaperTexture, Vignette, LightFlicker, CameraShake, WiggleText, MaskReveal, DecorativeLine, DisplacementFilter)
3. **Extract ShimmerFilter** from `matt-gray-demo/src/JohannesVideo.jsx` into shared components
4. **Create style configs** for both existing styles (johannes-broll-v1, mapal-title-card-v1)
5. **Build `DynamicComposition.tsx`** that reads timeline JSON from inputProps and renders using the style registry
6. **Create `lib/render.ts`** in the Next.js app to call `npx remotion render` as a subprocess
7. **Test**: hardcode a timeline JSON, render a video, verify output matches existing `matt-gray-demo` quality

### Phase 2: Analysis pipeline

8. **Add SQLite** (`lib/db.ts`) with schema for transcripts, scenes, projects, chat, render jobs
9. **Build `lib/whisper.ts`** wrapper that calls faster-whisper Python and returns word-level JSON
10. **Build `lib/gemini.ts`** client for scene analysis (Gemini Flash with video input)
11. **Create `/api/analyze` endpoint** that orchestrates: whisper + Gemini + 30fps re-encode
12. **Create `/api/transcript/[fileId]` endpoint**
13. **Test**: upload a video, run analysis, verify transcript + scene data in DB

### Phase 3: Timeline generation

14. **Define timeline JSON schema** with validation (`lib/timeline.ts`)
15. **Build `/api/projects` endpoints** (create, get, update timeline)
16. **Build `/api/projects/[id]/suggest`** endpoint that prompts Gemini Pro with analysis data + style rules to generate initial timeline
17. **Test**: create project, run suggest, verify timeline JSON is valid and makes sense

### Phase 4: Chat refinement

18. **Build `/api/projects/[id]/chat`** endpoint with conversation history
19. **Gemini Flash** receives: current timeline + transcript + user message, returns updated timeline
20. **Store chat history + timeline versions** in SQLite
21. **Test**: refine a timeline via chat commands ("move clip 2 to end", "add b-roll at 0:15", "remove the title card")

### Phase 5: Render pipeline

22. **Build `/api/render` endpoint** that:
    - Reads project timeline
    - Symlinks source videos to `remotion/public/`
    - Writes props JSON
    - Spawns `npx remotion render`
    - Tracks progress
23. **Build `/api/render/[jobId]` status + download endpoints**
24. **Test**: full flow from upload to rendered MP4

### Phase 6: Frontend (preview + chat UI)

25. **Add `@remotion/player`** to Next.js frontend dependencies
26. **Build timeline preview** using Remotion Player + DynamicComposition
27. **Build chat interface** for timeline refinement
28. **Build style selector** dropdown
29. **Build render button + progress indicator**
30. **Wire everything together** into the main page

### Phase 7: New styles

31. **Adding a new style** = create a new directory under `remotion/src/styles/`, implement the style-specific components, add config to registry. No changes to the pipeline.

---

## Remotion Render Command

The render subprocess call from `lib/render.ts`:

```ts
import { spawn } from "child_process";
import path from "path";

export function startRender(timelineJson: object, jobId: string): Promise<string> {
  const remotionDir = path.join(process.cwd(), "remotion");
  const propsPath = path.join(remotionDir, `props-${jobId}.json`);
  const outputPath = path.join(process.cwd(), ".carl-data", "renders", `${jobId}.mp4`);

  // Write props file
  fs.writeFileSync(propsPath, JSON.stringify(timelineJson));

  const totalFrames = calculateTotalFrames(timelineJson);

  const args = [
    "remotion", "render",
    "DynamicComposition",
    outputPath,
    "--props", propsPath,
    "--concurrency", "2",       // VPS-friendly, don't overload
    "--log", "verbose",
  ];

  const proc = spawn("npx", args, { cwd: remotionDir });
  // ... progress parsing, status updates, cleanup
}
```

---

## Skill/Claude Code Interface

Carl can be operated via Claude Code (the assistant) for automation:

1. **Upload**: Claude calls `POST /api/upload` with a folder path
2. **Analyze**: Claude calls `POST /api/analyze` with the file ID
3. **Create project**: Claude calls `POST /api/projects` with file IDs + style
4. **Generate timeline**: Claude calls `POST /api/projects/{id}/suggest`
5. **Refine**: Claude calls `POST /api/projects/{id}/chat` with instructions
6. **Render**: Claude calls `POST /api/render` with the project ID
7. **Poll**: Claude polls `GET /api/render/{jobId}` until done

This means the full video editing pipeline can run headless through the assistant, triggered from Telegram or Slack. The frontend is for when Johannes wants to visually refine.

---

## Open Questions

1. **VPS GPU**: Does the VPS have a GPU for Remotion rendering? If not, rendering will be CPU-only (slower but works). Remotion uses headless Chrome, so GPU is optional.
2. **Concurrent renders**: Should we queue renders or allow parallel? Recommend a simple queue (one at a time) given VPS resources.
3. **Video storage**: Large video files on VPS disk. May need a cleanup policy or external storage eventually.
4. **Remotion license**: Remotion is free for personal use. If Carl becomes a product, a license is needed.
