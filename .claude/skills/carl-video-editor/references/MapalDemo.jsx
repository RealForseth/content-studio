import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadSpace } from "@remotion/google-fonts/SpaceGrotesk";

const { fontFamily: serifFont } = loadPlayfair("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
const { fontFamily: serifItalic } = loadPlayfair("italic", { weights: ["400", "700"], subsets: ["latin"] });
const { fontFamily: sansFont } = loadInter("normal", { weights: ["300", "500", "900"], subsets: ["latin"] });
const { fontFamily: monoFont } = loadSpace("normal", { weights: ["300", "500", "700"], subsets: ["latin"] });

// ==================== COLORS (Mapal warm palette) ====================
const C = {
  bg: "#1a1714",
  text: "#f5f0e8",
  muted: "#8a8278",
  accent: "#c4653a",
  gold: "#c9a84c",
};

// ==================== ANIMATED FILM GRAIN ====================
const FilmGrain = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();
  const seed = (frame * 7) % 1000;
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity, pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// ==================== PAPER TEXTURE ====================
const PaperTexture = ({ opacity = 0.1 }) => (
  <AbsoluteFill style={{ mixBlendMode: "softLight", opacity, pointerEvents: "none" }}>
    <svg width="100%" height="100%">
      <filter id="paper-tex">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" seed={42} result="coarse" />
        <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" seed={7} result="fine" />
        <feMerge>
          <feMergeNode in="coarse" />
          <feMergeNode in="fine" />
        </feMerge>
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#paper-tex)" />
    </svg>
  </AbsoluteFill>
);

// ==================== VIGNETTE ====================
const Vignette = ({ strength = 0.4 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(10,8,6,${strength}) 100%)`,
      pointerEvents: "none",
    }}
  />
);

// ==================== LIGHT FLICKER ====================
const LightFlicker = () => {
  const frame = useCurrentFrame();
  // Subtle brightness variation — organic flicker
  const flicker = 1 + Math.sin(frame * 0.7) * 0.015 + Math.sin(frame * 1.3) * 0.01 + Math.sin(frame * 3.1) * 0.005;
  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(255,255,255,${(flicker - 1) * 2})`,
        mixBlendMode: "overlay",
        pointerEvents: "none",
      }}
    />
  );
};

// ==================== CAMERA SHAKE ====================
const CameraShake = ({ children, intensity = 1.5 }) => {
  const frame = useCurrentFrame();
  // Smooth wiggle using multiple sine waves
  const x = Math.sin(frame * 0.4) * intensity * 0.6 + Math.sin(frame * 0.9) * intensity * 0.4;
  const y = Math.cos(frame * 0.5) * intensity * 0.5 + Math.cos(frame * 1.1) * intensity * 0.3;
  const rot = Math.sin(frame * 0.3) * 0.15;

  return (
    <AbsoluteFill
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

// ==================== WIGGLE TEXT ====================
// Subtle constant position wiggle on text — like AE wiggle expression
const WiggleText = ({ children, style, wiggleAmount = 1.2, wiggleSpeed = 0.5 }) => {
  const frame = useCurrentFrame();
  const wx = Math.sin(frame * wiggleSpeed * 0.7 + 1.2) * wiggleAmount;
  const wy = Math.cos(frame * wiggleSpeed * 0.5 + 0.8) * wiggleAmount * 0.7;
  const wr = Math.sin(frame * wiggleSpeed * 0.3 + 2.1) * 0.2;

  return (
    <div
      style={{
        ...style,
        transform: `${style?.transform || ""} translate(${wx}px, ${wy}px) rotate(${wr}deg)`.trim(),
      }}
    >
      {children}
    </div>
  );
};

// ==================== MASK REVEAL ====================
// Text slides up from behind a mask — signature Mapal technique
const MaskReveal = ({ children, delay = 0, style = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 15, stiffness: 80, mass: 0.8 },
  });

  const yPercent = interpolate(progress, [0, 1], [110, 0]);
  const opacity = interpolate(progress, [0, 0.15, 1], [0, 1, 1]);
  // Motion blur fake — blur proportional to speed
  const blur = interpolate(progress, [0, 0.3, 1], [3, 1, 0]);

  return (
    <div style={{ overflow: "hidden", ...style }}>
      <div
        style={{
          transform: `translateY(${yPercent}%)`,
          opacity,
          filter: `blur(${blur}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
};

// ==================== DECORATIVE LINE ====================
const DecorativeLine = ({ delay = 0, width = 50, color = C.muted }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 20, stiffness: 60, mass: 1.0 },
  });

  return (
    <div
      style={{
        width: interpolate(progress, [0, 1], [0, width]),
        height: 1,
        backgroundColor: color,
        opacity: 0.5,
      }}
    />
  );
};

// ==================== DISPLACEMENT FILTER ====================
const DisplacementFilter = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 5);
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="text-displace" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="turbulence" baseFrequency="0.012" numOctaves={2} seed={seed} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={3} xChannelSelector="R" yChannelSelector="G" result="displaced" />
          <feMorphology in="SourceGraphic" operator="erode" radius="0.3" result="crisp" />
          <feComposite in="crisp" in2="displaced" operator="over" />
        </filter>
      </defs>
    </svg>
  );
};

// ==================== MAIN COMPOSITION ====================
export const MapalDemo = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <CameraShake intensity={1.2}>
        <DisplacementFilter />

        {/* ===== SLIDE 1: Title Card (0-90 frames / 3 sec) ===== */}
        <Sequence from={0} durationInFrames={90}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 12%",
              filter: "url(#text-displace)",
            }}
          >
            <DecorativeLine delay={0} width={50} />
            <div style={{ height: 16 }} />

            <MaskReveal delay={4} style={{ marginBottom: -4 }}>
              <WiggleText
                style={{
                  fontFamily: monoFont,
                  fontSize: 16,
                  fontWeight: 500,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: C.muted,
                }}
              >
                introducing
              </WiggleText>
            </MaskReveal>

            <MaskReveal delay={10}>
              <WiggleText
                style={{
                  fontFamily: serifItalic,
                  fontSize: 110,
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: C.text,
                  lineHeight: 0.9,
                  letterSpacing: "-0.02em",
                }}
              >
                Beautiful
              </WiggleText>
            </MaskReveal>

            <MaskReveal delay={16}>
              <WiggleText
                style={{
                  fontFamily: serifFont,
                  fontSize: 110,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color: C.accent,
                  lineHeight: 0.9,
                  letterSpacing: "-0.01em",
                }}
              >
                TITLES
              </WiggleText>
            </MaskReveal>

            <div style={{ height: 12 }} />
            <DecorativeLine delay={20} width={50} />

            <MaskReveal delay={24}>
              <WiggleText
                style={{
                  fontFamily: monoFont,
                  fontSize: 13,
                  fontWeight: 300,
                  letterSpacing: "0.15em",
                  color: C.muted,
                  marginTop: 10,
                  textTransform: "uppercase",
                }}
              >
                made with remotion — 2026
              </WiggleText>
            </MaskReveal>
          </AbsoluteFill>
        </Sequence>

        {/* ===== SLIDE 2: Mixed Typography (90-180 frames / 3 sec) ===== */}
        <Sequence from={90} durationInFrames={90}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              filter: "url(#text-displace)",
            }}
          >
            <MaskReveal delay={0}>
              <WiggleText
                style={{
                  fontFamily: sansFont,
                  fontSize: 18,
                  fontWeight: 300,
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: C.muted,
                }}
              >
                the power of
              </WiggleText>
            </MaskReveal>

            <MaskReveal delay={6}>
              <WiggleText
                wiggleAmount={1.5}
                style={{
                  fontFamily: serifFont,
                  fontSize: 140,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color: C.text,
                  lineHeight: 0.85,
                  letterSpacing: "-0.02em",
                }}
              >
                TEXTURE
              </WiggleText>
            </MaskReveal>

            <MaskReveal delay={12}>
              <WiggleText
                style={{
                  fontFamily: serifItalic,
                  fontSize: 60,
                  fontWeight: 400,
                  fontStyle: "italic",
                  color: C.gold,
                  lineHeight: 0.9,
                }}
              >
                & grain
              </WiggleText>
            </MaskReveal>
          </AbsoluteFill>
        </Sequence>

        {/* ===== SLIDE 3: Editorial Layout (180-270 frames / 3 sec) ===== */}
        <Sequence from={180} durationInFrames={90}>
          <AbsoluteFill
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              filter: "url(#text-displace)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 20,
              }}
            >
              <MaskReveal delay={0}>
                <WiggleText
                  style={{
                    fontFamily: sansFont,
                    fontSize: 28,
                    fontWeight: 300,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: C.muted,
                  }}
                >
                  make it
                </WiggleText>
              </MaskReveal>

              <MaskReveal delay={6}>
                <WiggleText
                  wiggleAmount={2}
                  style={{
                    fontFamily: serifItalic,
                    fontSize: 130,
                    fontWeight: 700,
                    fontStyle: "italic",
                    color: C.accent,
                    lineHeight: 0.85,
                  }}
                >
                  move.
                </WiggleText>
              </MaskReveal>
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* ===== SLIDE 4: Kinetic List (270-390 frames / 4 sec) ===== */}
        <Sequence from={270} durationInFrames={120}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "0 10%",
              gap: 6,
              filter: "url(#text-displace)",
            }}
          >
            {[
              { label: "01", text: "Displacement", delay: 0 },
              { label: "02", text: "Wiggle", delay: 8 },
              { label: "03", text: "Camera Shake", delay: 16 },
              { label: "04", text: "Film Grain", delay: 24 },
              { label: "05", text: "Light Flicker", delay: 32 },
            ].map((item) => (
              <MaskReveal key={item.label} delay={item.delay}>
                <WiggleText
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: monoFont,
                      fontSize: 14,
                      fontWeight: 300,
                      color: C.gold,
                      letterSpacing: "0.1em",
                    }}
                  >
                    {item.label}
                  </span>
                  <span
                    style={{
                      fontFamily: serifFont,
                      fontSize: 64,
                      fontWeight: 700,
                      color: C.text,
                      lineHeight: 1.0,
                    }}
                  >
                    {item.text}
                  </span>
                </WiggleText>
              </MaskReveal>
            ))}
          </AbsoluteFill>
        </Sequence>

        {/* ===== SLIDE 5: Closer (390-480 frames / 3 sec) ===== */}
        <Sequence from={390} durationInFrames={90}>
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 4,
              filter: "url(#text-displace)",
            }}
          >
            <DecorativeLine delay={0} width={80} color={C.gold} />
            <div style={{ height: 8 }} />

            <MaskReveal delay={4}>
              <WiggleText
                style={{
                  fontFamily: monoFont,
                  fontSize: 14,
                  fontWeight: 300,
                  textTransform: "uppercase",
                  letterSpacing: "0.3em",
                  color: C.muted,
                }}
              >
                all made in
              </WiggleText>
            </MaskReveal>

            <MaskReveal delay={10}>
              <WiggleText
                wiggleAmount={2}
                style={{
                  fontFamily: serifFont,
                  fontSize: 120,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  color: C.text,
                  lineHeight: 0.85,
                }}
              >
                REMOTION
              </WiggleText>
            </MaskReveal>

            <div style={{ height: 8 }} />
            <DecorativeLine delay={14} width={80} color={C.gold} />
          </AbsoluteFill>
        </Sequence>
      </CameraShake>

      {/* ===== OVERLAY STACK (always on top) ===== */}
      <PaperTexture opacity={0.1} />
      <FilmGrain opacity={0.06} />
      <LightFlicker />
      <Vignette strength={0.35} />
    </AbsoluteFill>
  );
};
