# Johannes B-roll Style v1

Stil for short-form video med talking head + b-roll text slides.
Remotion-prosjekt: `/home/main/matt-gray-demo/`

---

## Oversikt

Talking head-video med undertekster + b-roll text slides som kuttes inn på nøkkelord.
Inspirert av Matt Gray / Dan Koe-stilen, tilpasset Johannes sin brand.

---

## Farger

| Element | Farge | Hex |
|---------|-------|-----|
| B-roll bakgrunn | Lys hvit-grå | `#F6F6F6` |
| B-roll tekst (normal) | Mørk grå | `#2B2B2B` |
| B-roll tekst (aksent) | Oransje | `#FF8C00` |
| Undertekst (over video) | Hvit | `#FFFFFF` |

---

## Typografi

- **Font:** Inter (Google Fonts)
- **Vekt:** 900 (Black) — alltid
- **Undertekst:** 36px, letter-spacing -1px
- **B-roll stor tekst:** 58px, letter-spacing -2px
- **B-roll liten tekst:** 34px, letter-spacing -0.5px
- **Line-height:** 1.15 (b-roll), 1.25 (undertekst)

---

## Undertekster (over talking head)

- 3-4 ord om gangen, maks 5
- **Instant** — ingen animasjon inn/ut, bare vises og forsvinner
- Posisjon: bottom 140px, sentrert, padding 16px
- Shadow: `0 2px 6px rgba(0,0,0,0.7), 0 0 14px rgba(0,0,0,0.4)`
- Timing: word-level fra faster-whisper (medium modell)

---

## B-roll Text Slides

- Kuttes inn på nøkkelord/fraser i talen
- **Instant cut** — ingen fade inn/ut
- Sentrert vertikal + horisontal
- 1-3 linjer tekst per slide
- Viktigste ord er `accent: true` (oransje) + `big: true` (58px)
- Støttetekst er `#2B2B2B` + 34px

### Shadow på b-roll tekst
- Aksent: `0 4px 24px #FF8C0018, 0 0 60px #FF8C0008, 0 2px 8px rgba(0,0,0,0.05)`
- Normal: `0 2px 12px rgba(0,0,0,0.06), 0 0 50px rgba(0,0,0,0.03)`

---

## Displacement Map (Edge Shimmer)

SVG filter på b-roll tekst — subtil, konstant, ambient kantforvrengning.

| Parameter | Verdi | Beskrivelse |
|-----------|-------|-------------|
| `baseFrequency` | `0.003` | Ultra-smooth, store bølger |
| `numOctaves` | `1` | Rent, ikke crunchy |
| `scale` | `5` | ~5px kantforvrengning |
| `seed` drift | Hvert 4. frame | Sakte organisk bevegelse |
| `type` | `turbulence` | Skarpere kontrast enn fractalNoise |

### Edge-only teknikk
- `feDisplacementMap` lager displaced versjon
- `feMorphology erode radius="0.6"` lager crisp inner shape
- `feComposite over` legger crisp center over displaced kanter
- Resultat: kun kantene av bokstavene shimrer, midten er skarp

---

## Video-teknisk

- **Remotion** for rendering
- **OffthreadVideo** (IKKE Video) — frame-perfect rendering
- Originale videoer MÅ re-encodes til constant 30fps før bruk:
  ```
  ffmpeg -vf "fps=30,format=yuv420p" -c:v libx264 -preset slow -crf 15 -g 30 -bf 2 -movflags +faststart -c:a aac -b:a 192k
  ```
- Canvas: matcher original video (464x848 for vertical)
- FPS: 30

---

## Transkripsjon

- **faster-whisper** medium modell med `word_timestamps=True`
- Norsk (`language="no"`)
- Gir word-level timestamps for nøyaktig subtitle-synk
- B-roll timing baseres på nøkkelord-timestamps

---

## Workflow

1. Ta inn video
2. Re-encode til constant 30fps
3. Transkriber med faster-whisper (word timestamps)
4. Identifiser nøkkelord for b-roll slides
5. Bygg Remotion-komposisjon med undertekster + b-roll
6. Render

---

## Referansefiler

- Remotion-prosjekt: `/home/main/matt-gray-demo/`
- Hovedfil: `/home/main/matt-gray-demo/src/JohannesVideo.jsx`
- Matt Gray brand-analyse: `/home/main/assistant/research/matt-gray/`
