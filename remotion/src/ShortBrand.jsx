import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Audio,
  staticFile,
} from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSpace } from "@remotion/google-fonts/SpaceGrotesk";

// ==================== FONTS ====================
const { fontFamily: serifFont } = loadPlayfair("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin"],
});
const { fontFamily: serifItalic } = loadPlayfair("italic", {
  weights: ["400", "700"],
  subsets: ["latin"],
});
const { fontFamily: sansFont } = loadInter("normal", {
  weights: ["300", "500", "900"],
  subsets: ["latin"],
});
const { fontFamily: monoFont } = loadSpace("normal", {
  weights: ["300", "500", "700"],
  subsets: ["latin"],
});

// ==================== COLORS ====================
const DARK = {
  bg: "#0f0d0a",
  text: "#f5f0e8",
  muted: "#8a8278",
  accent: "#e07a3a",
  gold: "#d4a84c",
  pink: "#c75a6a",
  neon: "#e07a3a",
};

const LIGHT = {
  bg: "#EFECE7",
  text: "#2A2A2A",
  muted: "#868686",
  accent: "#D42C2C",
};

// ==================== FILM GRAIN (CSS-based, fast) ====================
const GRAIN_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`;

const FilmGrain = ({ opacity = 0.08, light = false }) => {
  const frame = useCurrentFrame();
  // Shift position each frame for animation effect
  const x = (frame * 37) % 256;
  const y = (frame * 53) % 256;
  return (
    <AbsoluteFill
      style={{
        backgroundImage: `url("${GRAIN_SVG}")`,
        backgroundPosition: `${x}px ${y}px`,
        backgroundSize: "256px 256px",
        mixBlendMode: light ? "multiply" : "overlay",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

// ==================== VIGNETTE ====================
const Vignette = ({ strength = 0.5 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(8,6,4,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

// ==================== DEEP GLOW TEXT (CSS text-shadow) ====================
const DeepGlowText = ({ children, style, color = DARK.accent, strength = 1.0 }) => {
  const frame = useCurrentFrame();
  const flicker = 0.92 + Math.sin(frame * 1.1) * 0.05 + Math.sin(frame * 3.2) * 0.03;
  const g = strength * flicker;
  return (
    <div
      style={{
        ...style,
        textShadow: `0 0 ${10 * g}px rgba(255,255,255,0.35), 0 0 ${25 * g}px ${color}88, 0 0 ${60 * g}px ${color}44, 0 0 ${120 * g}px ${color}22`,
      }}
    >
      {children}
    </div>
  );
};

// ==================== CHROMATIC ABERRATION (3 div overlay, fast) ====================
const ChromaticText = ({ children, style, offset = 1.5 }) => (
  <div style={{ position: "relative", ...style }}>
    {/* Red channel */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: offset,
        right: -offset,
        bottom: 0,
        color: "#ff0000",
        mixBlendMode: "screen",
        opacity: 0.7,
      }}
    >
      {children}
    </div>
    {/* Blue channel */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: -offset,
        right: offset,
        bottom: 0,
        color: "#0066ff",
        mixBlendMode: "screen",
        opacity: 0.7,
      }}
    >
      {children}
    </div>
    {/* Main (green) channel */}
    <div style={{ position: "relative", color: style?.color || DARK.text }}>{children}</div>
  </div>
);

// ==================== MASK REVEAL ANIMATION ====================
const MaskReveal = ({ children, delay = 0, overshoot = false, style = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const config = overshoot
    ? { damping: 8, stiffness: 140, mass: 0.4 }
    : { damping: 15, stiffness: 80, mass: 0.8 };
  const progress = spring({ frame: Math.max(0, frame - delay), fps, config });
  const yPercent = interpolate(progress, [0, 1], [110, 0]);
  const opacity = interpolate(progress, [0, 0.15, 1], [0, 1, 1]);
  return (
    <div style={{ overflow: "hidden", ...style }}>
      <div style={{ transform: `translateY(${yPercent}%)`, opacity }}>{children}</div>
    </div>
  );
};

// ==================== FADE ====================
const Fade = ({ children, delay = 0, duration = 15 }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame - delay, [0, duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <div style={{ opacity }}>{children}</div>;
};

// ==================== DITHER TRANSITION ====================
const DitherTransition = ({ durationFrames = 10 }) => {
  const frame = useCurrentFrame();
  if (frame >= durationFrames) return null;
  const progress = frame / durationFrames;
  // High contrast + brightness manipulation for dither/posterize look
  const contrast = interpolate(progress, [0, 0.3, 1], [15, 10, 1], {
    extrapolateRight: "clamp",
  });
  const brightness = interpolate(progress, [0, 0.3, 1], [0.4, 0.6, 1], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(progress, [0, 0.7, 1], [1, 0.5, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        filter: `contrast(${contrast}) brightness(${brightness})`,
        opacity,
        pointerEvents: "none",
        zIndex: 100,
        // Pixelated scaling for dither feel
        imageRendering: "pixelated",
      }}
    >
      {/* Dither pattern noise */}
      <AbsoluteFill
        style={{
          backgroundImage: `url("${GRAIN_SVG}")`,
          backgroundSize: "128px 128px",
          imageRendering: "pixelated",
          filter: `contrast(${contrast * 2}) brightness(${brightness * 0.8})`,
          mixBlendMode: "screen",
        }}
      />
    </AbsoluteFill>
  );
};

// ==================== COOL TINT OVERLAY (blue-purple) ====================
const CoolTint = ({ opacity = 0.08 }) => (
  <AbsoluteFill
    style={{
      background: "linear-gradient(180deg, rgba(60,40,120,0.12) 0%, rgba(30,50,100,0.08) 100%)",
      mixBlendMode: "color",
      opacity,
      pointerEvents: "none",
    }}
  />
);

// ==================== PAPER TEXTURE (for light slides) ====================
const PaperTexture = ({ opacity = 0.04 }) => (
  <AbsoluteFill
    style={{
      backgroundImage: `url("${GRAIN_SVG}")`,
      backgroundSize: "512px 512px",
      mixBlendMode: "multiply",
      opacity,
      pointerEvents: "none",
    }}
  />
);

// ==================== HIGHLIGHT BOX (VOX-style) ====================
const HighlightBox = ({ children, style, color = LIGHT.accent, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.5 },
  });
  const scaleX = interpolate(p, [0, 1], [0, 1]);
  return (
    <div style={{ position: "relative", display: "inline-block", ...style }}>
      <div
        style={{
          position: "absolute",
          inset: "-6px -14px",
          backgroundColor: color,
          opacity: 0.15,
          transform: `scaleX(${scaleX})`,
          transformOrigin: "left",
          borderRadius: 4,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: "-6px -14px",
          border: `2px solid ${color}`,
          opacity: 0.6,
          transform: `scaleX(${scaleX})`,
          transformOrigin: "left",
          borderRadius: 4,
        }}
      />
      {children}
    </div>
  );
};

// ==================== DECORATIVE LINE ====================
const DecorativeLine = ({ delay = 0, width = 60, color = DARK.muted, vertical = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 20, stiffness: 60, mass: 1.0 },
  });
  const size = interpolate(p, [0, 1], [0, width]);
  return (
    <div
      style={{
        width: vertical ? 1 : size,
        height: vertical ? size : 1,
        backgroundColor: color,
        opacity: 0.4,
      }}
    />
  );
};

// ==================== SCROLLING LIST ITEM ====================
const ScrollItem = ({ text, highlighted = false, delay = 0, highlightDelay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.6 },
  });
  const y = interpolate(enter, [0, 1], [60, 0]);
  const opacity = interpolate(enter, [0, 0.3, 1], [0, 1, 1]);

  const hlProgress = highlighted
    ? spring({
        frame: Math.max(0, frame - highlightDelay),
        fps,
        config: { damping: 10, stiffness: 150, mass: 0.4 },
      })
    : 0;

  return (
    <div
      style={{
        transform: `translateY(${y}px)`,
        opacity,
        position: "relative",
        padding: "8px 0",
      }}
    >
      {highlighted && (
        <div
          style={{
            position: "absolute",
            inset: "0 -20px",
            backgroundColor: LIGHT.accent,
            opacity: interpolate(hlProgress, [0, 1], [0, 0.15]),
            borderRadius: 6,
            border: `2px solid ${LIGHT.accent}`,
            borderColor: `rgba(212,44,44,${interpolate(hlProgress, [0, 1], [0, 0.5])})`,
            transform: `scaleX(${hlProgress})`,
            transformOrigin: "left",
          }}
        />
      )}
      <span
        style={{
          fontFamily: serifFont,
          fontSize: 72,
          fontWeight: 700,
          color: highlighted ? LIGHT.accent : LIGHT.text,
          position: "relative",
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ==================================================================
// SLIDE 1: HOOK (frames 0-180)
// ==================================================================
const Slide1Hook = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [150, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
        opacity: fadeOut,
      }}
    >
      <MaskReveal delay={8} overshoot>
        <DeepGlowText
          color={DARK.text}
          strength={0.6}
          style={{
            fontFamily: serifFont,
            fontSize: 88,
            fontWeight: 900,
            color: DARK.text,
            textAlign: "center",
            lineHeight: 1.05,
          }}
        >
          Jeg har utsatt dette
        </DeepGlowText>
      </MaskReveal>
      <div style={{ height: 20 }} />
      <MaskReveal delay={20} overshoot>
        <DeepGlowText
          color={DARK.accent}
          strength={1.2}
          style={{
            fontFamily: serifItalic,
            fontSize: 80,
            fontWeight: 700,
            fontStyle: "italic",
            color: DARK.accent,
            textAlign: "center",
            lineHeight: 1.05,
          }}
        >
          i over ett år.
        </DeepGlowText>
      </MaskReveal>
      <FilmGrain opacity={0.1} />
      <CoolTint opacity={0.1} />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

// ==================================================================
// SLIDE 2: WHO (frames 180-360)
// ==================================================================
const Slide2Who = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [150, 180], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: LIGHT.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
        opacity: fadeOut,
      }}
    >
      <DitherTransition durationFrames={12} />
      <MaskReveal delay={14} overshoot>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span
            style={{
              fontFamily: serifFont,
              fontSize: 110,
              fontWeight: 900,
              color: LIGHT.text,
            }}
          >
            Johannes,
          </span>
          <HighlightBox color={LIGHT.accent} delay={24}>
            <span
              style={{
                fontFamily: serifFont,
                fontSize: 110,
                fontWeight: 900,
                color: LIGHT.accent,
              }}
            >
              21
            </span>
          </HighlightBox>
        </div>
      </MaskReveal>
      <div style={{ height: 24 }} />
      <MaskReveal delay={28}>
        <span
          style={{
            fontFamily: sansFont,
            fontSize: 40,
            fontWeight: 300,
            color: LIGHT.muted,
            letterSpacing: "0.12em",
          }}
        >
          Oslo — BI student
        </span>
      </MaskReveal>
      <PaperTexture opacity={0.05} />
    </AbsoluteFill>
  );
};

// ==================================================================
// SLIDE 3: BUILDING (frames 360-600)
// ==================================================================
const Slide3Building = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [210, 240], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
        opacity: fadeOut,
      }}
    >
      <MaskReveal delay={6} overshoot>
        <DeepGlowText
          color={DARK.neon}
          strength={1.0}
          style={{
            fontFamily: serifFont,
            fontSize: 100,
            fontWeight: 900,
            color: DARK.text,
            textAlign: "center",
          }}
        >
          Bygger apper
        </DeepGlowText>
      </MaskReveal>
      <div style={{ height: 16 }} />
      <MaskReveal delay={18} overshoot>
        <ChromaticText
          offset={2}
          style={{
            fontFamily: serifFont,
            fontSize: 140,
            fontWeight: 900,
            color: DARK.accent,
            textAlign: "center",
          }}
        >
          med AI
        </ChromaticText>
      </MaskReveal>
      <FilmGrain opacity={0.08} />
      <CoolTint opacity={0.12} />
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

// ==================================================================
// SLIDE 4: APPS (frames 600-840)
// ==================================================================
const Slide4Apps = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [210, 240], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: LIGHT.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 60px",
        opacity: fadeOut,
      }}
    >
      <DitherTransition durationFrames={12} />
      {/* Decorative top line */}
      <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "center" }}>
        <DecorativeLine delay={14} width={200} color={LIGHT.muted} />
      </div>
      <div style={{ height: 60 }} />
      {/* Split layout */}
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "center",
          gap: 60,
        }}
      >
        {/* Left: StudyPal */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <MaskReveal delay={18} overshoot>
            <span
              style={{
                fontFamily: serifFont,
                fontSize: 72,
                fontWeight: 900,
                color: LIGHT.text,
              }}
            >
              StudyPal
            </span>
          </MaskReveal>
          <div style={{ height: 12 }} />
          <MaskReveal delay={28}>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 24,
                fontWeight: 300,
                color: LIGHT.muted,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              studieplattform
            </span>
          </MaskReveal>
        </div>
        {/* Center divider */}
        <div
          style={{
            width: 1,
            backgroundColor: LIGHT.muted,
            opacity: 0.3,
            alignSelf: "stretch",
          }}
        />
        {/* Right: Toonie */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <MaskReveal delay={22} overshoot>
            <span
              style={{
                fontFamily: serifFont,
                fontSize: 72,
                fontWeight: 900,
                color: LIGHT.text,
              }}
            >
              Toonie
            </span>
          </MaskReveal>
          <div style={{ height: 12 }} />
          <MaskReveal delay={32}>
            <span
              style={{
                fontFamily: monoFont,
                fontSize: 24,
                fontWeight: 300,
                color: LIGHT.muted,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
              }}
            >
              barneboker
            </span>
          </MaskReveal>
        </div>
      </div>
      <div style={{ height: 60 }} />
      {/* Decorative bottom line */}
      <div style={{ alignSelf: "stretch", display: "flex", justifyContent: "center" }}>
        <DecorativeLine delay={36} width={200} color={LIGHT.muted} />
      </div>
      <PaperTexture opacity={0.05} />
    </AbsoluteFill>
  );
};

// ==================================================================
// SLIDE 5: AUTHENTIC (frames 840-1050)
// ==================================================================
const Slide5Authentic = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [180, 210], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: DARK.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 80px",
        opacity: fadeOut,
      }}
    >
      <MaskReveal delay={8} overshoot>
        <DeepGlowText
          color="#8866cc"
          strength={0.8}
          style={{
            fontFamily: sansFont,
            fontSize: 100,
            fontWeight: 900,
            color: DARK.text,
            textAlign: "center",
          }}
        >
          Ikke techbro.
        </DeepGlowText>
      </MaskReveal>
      <div style={{ height: 30 }} />
      <MaskReveal delay={22}>
        <span
          style={{
            fontFamily: sansFont,
            fontSize: 38,
            fontWeight: 300,
            color: DARK.muted,
            textAlign: "center",
          }}
        >
          bare en fyr som bygger
        </span>
      </MaskReveal>
      <FilmGrain opacity={0.14} />
      <CoolTint opacity={0.18} />
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

// ==================================================================
// SLIDE 6: THE QUESTION (frames 1050-1260)
// ==================================================================
const Slide6Question = () => {
  const frame = useCurrentFrame();
  const fadeOut = interpolate(frame, [180, 210], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill
      style={{
        backgroundColor: LIGHT.bg,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 100px",
        opacity: fadeOut,
      }}
    >
      <DitherTransition durationFrames={12} />
      <ScrollItem text="BI?" delay={14} />
      <ScrollItem text="Droppe ut?" delay={22} />
      <ScrollItem text="Satse?" highlighted delay={30} highlightDelay={50} />
      <ScrollItem text="Risikere alt?" delay={38} />
      <PaperTexture opacity={0.05} />
    </AbsoluteFill>
  );
};

// ==================================================================
// SLIDE 7: CLOSER (frames 1260-1350)
// ==================================================================
const Slide7Closer = () => {
  const frame = useCurrentFrame();
  const fadeToBlack = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ backgroundColor: DARK.bg }}>
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 80px",
        }}
      >
        <MaskReveal delay={4} overshoot>
          <DeepGlowText
            color={DARK.accent}
            strength={1.5}
            style={{
              fontFamily: serifItalic,
              fontSize: 90,
              fontWeight: 700,
              fontStyle: "italic",
              color: DARK.text,
              textAlign: "center",
            }}
          >
            Her er jeg.
          </DeepGlowText>
        </MaskReveal>
        <div style={{ height: 30 }} />
        <Fade delay={16} duration={20}>
          <span
            style={{
              fontFamily: monoFont,
              fontSize: 28,
              fontWeight: 300,
              color: DARK.muted,
              letterSpacing: "0.1em",
            }}
          >
            @johannesforseth
          </span>
        </Fade>
      </AbsoluteFill>
      <FilmGrain opacity={0.1} />
      <Vignette strength={0.5} />
      {/* Fade to black */}
      <AbsoluteFill
        style={{
          backgroundColor: "#000",
          opacity: fadeToBlack,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

// ==================================================================
// MAIN COMPOSITION
// ==================================================================
export const ShortBrand = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: DARK.bg }}>
      {/* Audio: first 45 seconds of voiceover */}
      <Audio src={staticFile("voiceover.wav")} endAt={45 * 30} />

      {/* SLIDE 1: HOOK (0-180) */}
      <Sequence from={0} durationInFrames={180}>
        <Slide1Hook />
      </Sequence>

      {/* SLIDE 2: WHO (180-360) */}
      <Sequence from={180} durationInFrames={180}>
        <Slide2Who />
      </Sequence>

      {/* SLIDE 3: BUILDING (360-600) */}
      <Sequence from={360} durationInFrames={240}>
        <Slide3Building />
      </Sequence>

      {/* SLIDE 4: APPS (600-840) */}
      <Sequence from={600} durationInFrames={240}>
        <Slide4Apps />
      </Sequence>

      {/* SLIDE 5: AUTHENTIC (840-1050) */}
      <Sequence from={840} durationInFrames={210}>
        <Slide5Authentic />
      </Sequence>

      {/* SLIDE 6: THE QUESTION (1050-1260) */}
      <Sequence from={1050} durationInFrames={210}>
        <Slide6Question />
      </Sequence>

      {/* SLIDE 7: CLOSER (1260-1350) */}
      <Sequence from={1260} durationInFrames={90}>
        <Slide7Closer />
      </Sequence>
    </AbsoluteFill>
  );
};
