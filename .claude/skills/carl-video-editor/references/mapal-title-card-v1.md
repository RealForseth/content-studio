# Mapal Title Card Style v1

Editorial, textured, warm title card-stil inspirert av Mapal.
Remotion-kode: `/home/main/matt-gray-demo/src/MapalDemo.jsx`

---

## Fargepalett

| Element | Hex | Beskrivelse |
|---------|-----|-------------|
| Bakgrunn | `#1a1714` | Warm near-black (aldri pure black) |
| Primær tekst | `#f5f0e8` | Warm off-white/cream |
| Sekundær tekst | `#8a8278` | Muted warm grå (labels, annotations) |
| Aksent 1 | `#c4653a` | Terracotta/rust (hero-ord) |
| Aksent 2 | `#c9a84c` | Dusty gold/ochre (highlights, linjer) |

---

## Typografi

### Fonter
| Rolle | Font | Vekt | Stil |
|-------|------|------|------|
| Hero serif | Playfair Display | 900 | Normal, UPPERCASE |
| Hero serif italic | Playfair Display | 400-700 | Italic, Title Case |
| Labels/small caps | Space Grotesk | 300-500 | Uppercase, wide tracking |
| Sans body | Inter | 300-900 | Generell bruk |

### Størrelser
- Hero tekst: 110-140px
- Sekundær hero: 60-80px
- Labels: 14-18px, letter-spacing 0.15-0.35em
- Annotations: 12-14px

### Line-height
- Hero: 0.85-0.9 (veldig tight, linjer nesten overlapper)
- Labels: 1.0

### Letter-spacing
- Uppercase sans: 0.15em - 0.35em (wide)
- Serif hero: -0.02em til 0em (tight)

---

## Mixed Typography (VIKTIG)

Kjerneteknikken — bland ulike stiler i samme komposisjon:
```
[SMALL CAPS LABEL]     ← Space Grotesk 300, 16px, 0.2em spacing, muted
[Big Italic Serif]     ← Playfair Italic 400, 110px, cream
[BIG BOLD SERIF]       ← Playfair 900, 110px, UPPERCASE, accent
[small annotation]     ← Space Grotesk 300, 13px, muted
```

---

## Animasjoner

### 1. Mask Reveal (hoved-teknikk)
- Parent div har `overflow: hidden`
- Tekst starter `translateY(110%)` (under masken)
- Glir opp med spring: `{ damping: 15, stiffness: 80, mass: 0.8 }`
- Fake motion blur under bevegelse (blur 3px → 0px)
- Stagger mellom elementer: 4-8 frames

### 2. Wiggle Expression
- Konstant, subtil bevegelse på all tekst
- Bruker multiple sine-bølger for organisk feel:
  - X: `sin(frame * 0.35) * 1.2 + sin(frame * 0.63) * 0.5`
  - Y: `cos(frame * 0.25) * 0.84 + cos(frame * 0.55) * 0.36`
  - Rotation: `sin(frame * 0.15) * 0.2°`
- wiggleAmount: 1.2px (subtil), 1.5-2px (hero tekst)

### 3. Camera Shake
- Hele komposisjonen har subtil bevegelse
- Intensity: 1.2px
- Bruker sine/cosine med ulike frekvenser
- Inkluderer micro-rotation (±0.15°)

### 4. Decorative Lines
- Tynne horisontale linjer (1px) som animerer bredde fra 0
- Spring: `{ damping: 20, stiffness: 60, mass: 1.0 }`
- Farge: muted eller gold
- Brukes som separatorer over/under tittelblokker

---

## Tekstur & Overlays (påkrevd — aldri skip!)

### 1. Film Grain (VIKTIG)
- SVG feTurbulence, fractalNoise
- baseFrequency: 0.75, numOctaves: 4
- Animert: seed endres hvert frame (`frame * 7 % 1000`)
- mixBlendMode: "overlay"
- opacity: 0.06-0.07

### 2. Paper Texture
- To lag turbulence: coarse (0.04) + fine (0.8)
- mixBlendMode: "softLight"
- opacity: 0.1
- Statisk (ikke animert)

### 3. Light Flicker
- Subtil brightness-variasjon over tid
- Bruker multiple sine-bølger: `1 + sin(f*0.7)*0.015 + sin(f*1.3)*0.01 + sin(f*3.1)*0.005`
- mixBlendMode: "overlay"
- Veldig subtilt — skal knapt synes

### 4. Vignette
- Radial gradient: transparent senter → rgba(10,8,6,0.35) kanter
- Start fade ved 30% fra senter
- Alltid på topp

---

## Displacement Map

- SVG filter med feTurbulence + feDisplacementMap
- baseFrequency: 0.012
- numOctaves: 2
- scale: 3
- Edge-only: feMorphology erode radius 0.3 + feComposite
- Seed drifter hvert 5. frame

---

## Easing Curves

| Formål | Spring config | CSS equivalent |
|--------|--------------|----------------|
| Primær enter | damping: 15, stiffness: 80, mass: 0.8 | cubic-bezier(0.22, 1.0, 0.36, 1.0) |
| Soft enter | damping: 20, stiffness: 60, mass: 1.0 | cubic-bezier(0.33, 1.0, 0.68, 1.0) |
| Overshoot | damping: 10, stiffness: 100, mass: 0.5 | cubic-bezier(0.34, 1.56, 0.64, 1.0) |

---

## Layout

- Venstre-justert ELLER sentrert (avhenger av slide)
- Padding fra kanter: 10-12% av frame bredde
- Asymmetrisk — unngå perfekt sentrering
- Tight vertikal stacking (minimal gap mellom linjer)
- Dekorative linjer og small labels skaper balanse

---

## Komposisjon-rekkefølge (z-index, bunn til topp)

1. Bakgrunn (#1a1714)
2. Camera Shake wrapper (rundt alt innhold)
3. Displacement filter
4. Innhold (tekst, linjer)
5. Paper texture (softLight, 0.1)
6. Film grain (overlay, 0.06)
7. Light flicker (overlay)
8. Vignette (topp)

---

## Video-teknisk

- 1920x1080 (16:9)
- 30 fps
- Remotion med OffthreadVideo for video-inkludering
- Re-encode til constant 30fps før bruk

---

## Referansefiler

- Remotion-kode: `/home/main/matt-gray-demo/src/MapalDemo.jsx`
- Alle komponenter er i samme fil (FilmGrain, PaperTexture, Vignette, LightFlicker, CameraShake, WiggleText, MaskReveal, etc.)
