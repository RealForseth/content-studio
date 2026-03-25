# VOX Title Animation Style v1

Scrollende tekstliste med animated highlight box — inspirert av Mapal sin "Vox Title Animation" AE tutorial.
Remotion-kode: `/home/main/matt-gray-demo/src/VoxTitle.jsx`

---

## Inspirasjon

- **Video**: "Vox Title Animation (After Effects Tutorial)" av Mapal — https://www.youtube.com/watch?v=mBMcyaa-c44
- **Analyse**: Full video lastet ned, 300 frames + audio analysert med Gemini 2.5 Flash + faster-whisper transkripsjon
- **Analysefiler**: `/tmp/vox_analysis_part1.txt`, `/tmp/vox_analysis_part2.txt`, `/tmp/vox_anim_curves.txt`, `/tmp/vox_sauce_detail.txt`, `/tmp/vox_transcript.txt`

---

## Farger

| Element | Hex | Beskrivelse |
|---------|-----|-------------|
| Bakgrunn | `#EFECE7` | Aged paper, pale warm cream (RGB 239,236,231) |
| Faded tekst | `#868686` | Medium grey — bakgrunnsfarge mørket litt (RGB 134,134,134) |
| Dark tekst (highlight) | `#2A2A2A` | Near-black, vises kun inni boksen |
| White box fill | `#FFFFFF` | Alpha matte for track matte-effekten |
| Red stroke | `#D42C2C` | Outline-boks + highlighter scribble |

---

## Typografi

- **Font**: Playfair Display Regular (400)
  - Original: Instrument Serif — Playfair Display er nærmeste gratis alternativ
  - Lastes via `@remotion/google-fonts/PlayfairDisplay`
- **Størrelse**: 80px
- **Leading**: 120px (baseline-to-baseline)
- **Alignment**: Center
- **Letter-spacing**: 0.5px

---

## Animasjon

### Scroll
- Tekstliste med 7 items stacked vertikalt
- Parented til en null (i AE) / wrapper div (i Remotion)
- Position animeres oppover for å scrolle gjennom listen
- Starter med siste item sentrert, scroller til target item

### Easing — S-Curve (VIKTIG)
Fra Mapal sin Flow plugin, custom bezier:
```javascript
const sCurveEasing = (t) => {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
```
- Sakte start → rask akselerasjon midt → smooth deselerasjon
- Brukes på ALL animasjon (scroll, box, stroke)

### Box Animation
1. **White filled rectangle** ekspanderer horisontalt fra CENTER outward
2. Fungerer som alpha matte — tekst inni = dark, utenfor = faded
3. **Track matte teknikk**: to kopier av tekst, dark kopi har `clipPath` til boks-området

### Red Stroke Outline
- Dukker opp ETTER white box er åpen
- 2px solid `#D42C2C`
- Roughen edges via SVG feDisplacementMap (baseFreq 0.04, scale 1.5)

### Highlighter Scribble
- Rød semi-transparent stripe over highlighted ord
- Opacity 55%, slight rotation (-0.8deg)
- Roughen edges filter
- Tegner seg fra venstre til høyre med S-curve

### Zoom
- Dramatisk zoom-in (1x → 1.8x) på slutten
- S-curve easing
- transformOrigin: center

### Micro-movement
- Subtle sin-bølge bevegelse (±3px) i hold-fasen

---

## The Sauce (post-effekter)

### Posterize Time (12fps)
```javascript
const pf = Math.floor(frame / 2.5) * 2.5;
```
- Gir choppy, retro, stop-motion feel
- Brukes på ALLE animasjonsberegninger

### Turbulent Displace
- SVG feTurbulence + feDisplacementMap
- baseFrequency: 0.015, numOctaves: 3
- scale: 4
- Varierer seed per posterized frame
- Gir subtle hand-printed/paper wobble

### Film Grain
- Animated SVG feTurbulence (fractalNoise)
- baseFrequency: 0.7, numOctaves: 4
- mixBlendMode: overlay, opacity: 7%
- Seed endres med posterized frame

### Paper Texture
- Dual-layer feTurbulence (coarse 0.04 + fine 0.8)
- mixBlendMode: softLight, opacity: 8%
- Statisk (ikke animert)

### Edge Fade
- Top + bottom gradient (200px) fra bakgrunnsfarge til transparent
- Tekst nær kantene fader ut — fokus på senteret

### Roughen Edges (på stroke)
- Separat SVG filter
- feTurbulence baseFreq 0.04, numOctaves 4
- feDisplacementMap scale 1.5
- Gir organisk, imperfekt kant på rød outline

---

## Lydeffekter

- Whoosh (pink noise, bandpass 600-4000Hz) synkronisert med scroll
- Click (white noise burst, highpass 2000Hz) ved box-åpning
- Generert med ffmpeg lavfi anoisesrc
- Fil: `public/vox-sfx.wav`

---

## Animasjons-Faser

### Fase 1 (frames 0-120, ~4 sek):
1. Start: "Undefeated" (siste item) sentrert
2. Scroll oppover til "Subscribe" (index 1)
3. White box ekspanderer fra center
4. "Subscribe" blir dark gjennom track matte
5. Red stroke outline dukker opp
6. Hold med micro-movement

### Fase 2 (frames 120-240, ~4 sek):
1. Box lukker seg
2. Scroll videre til "Free Ketchup" (index 4)
3. Ny box åpner
4. Ny red stroke
5. Highlighter scribble tegner seg over teksten
6. Dramatisk zoom-in (1x → 1.8x)

---

## Teknisk

- 1920x1080, 30fps, 240 frames (8 sek)
- Remotion med Playfair Display via Google Fonts
- Alle effekter som CSS/SVG (ingen canvas)
- Posterize time gjør at effektiv visuell framerate er ~12fps
- Audio via Remotion `<Audio>` component

---

## Originalverdier fra Mapal sin video

Fra transkripsjon + Gemini-analyse:
- Composition: 1920x1080, 23.976fps, 10 sek
- Background solid: F1EBE0 (vi bruker EFECE7 som er nøyaktigere fra Gemini frame-analyse)
- Font: Instrument Serif (vi bruker Playfair Display)
- Faded color: DAD3C7 (vi justerte til #868686 basert på Gemini)
- Flow preset easing: custom S-curve
- Posterize time: 12fps
- Turbulent displace: amount 30, size 2
- Stroke: 3-4px (vi bruker 2px)
- Red scribble: roughen edges med evolution animation

---

## Referansefiler

- Remotion-kode: `/home/main/matt-gray-demo/src/VoxTitle.jsx`
- Lydeffekter: `/home/main/matt-gray-demo/public/vox-sfx.wav`
- Video-analyse: `/tmp/vox_analysis_part1.txt`, `/tmp/vox_analysis_part2.txt`
- Transkripsjon: `/tmp/vox_transcript.txt`
- Animasjons-analyse: `/tmp/vox_anim_curves.txt`
- Original video: `/tmp/mapal_vox.mp4`
