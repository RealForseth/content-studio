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

const C = {
  bg: "#0f0d0a",
  text: "#f5f0e8",
  muted: "#8a8278",
  accent: "#e07a3a",
  gold: "#d4a84c",
  pink: "#c75a6a",
};

// ==================== RETRO GLASS SCRATCH OVERLAY ====================
const GlassScratchTexture = ({ opacity = 0.16 }) => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 3);
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", opacity, pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`glass-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.002 0.12" numOctaves={3} seed={seed} result="scratches" />
          <feComponentTransfer in="scratches" result="sharp">
            <feFuncR type="linear" slope="3.5" intercept="-1.4" />
            <feFuncG type="linear" slope="3.5" intercept="-1.4" />
            <feFuncB type="linear" slope="3.5" intercept="-1.4" />
          </feComponentTransfer>
          <feColorMatrix type="saturate" values="0" in="sharp" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#glass-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// ==================== GLASS DISPLACEMENT ====================
const GlassDisplacement = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 4);
  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="glass-refract" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.004 0.06" numOctaves={2} seed={seed} result="glassNoise" />
          <feDisplacementMap in="SourceGraphic" in2="glassNoise" scale={4} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  );
};

// ==================== CHROMATIC ABERRATION ====================
const ChromaticAb = () => (
  <svg width="0" height="0" style={{ position: "absolute" }}>
    <defs>
      <filter id="chroma" x="-5%" y="-5%" width="110%" height="110%">
        <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="red" />
        <feOffset in="red" dx="1.5" dy="0" result="redShift" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="green" />
        <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="blue" />
        <feOffset in="blue" dx="-1.5" dy="0" result="blueShift" />
        <feBlend in="redShift" in2="green" mode="screen" result="rg" />
        <feBlend in="rg" in2="blueShift" mode="screen" />
      </filter>
    </defs>
  </svg>
);

// ==================== FILM GRAIN ====================
const FilmGrain = ({ opacity = 0.07 }) => {
  const frame = useCurrentFrame();
  const seed = (frame * 7) % 1000;
  return (
    <AbsoluteFill style={{ mixBlendMode: "overlay", opacity, pointerEvents: "none" }}>
      <svg width="100%" height="100%">
        <filter id={`grain-${seed}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves={4} seed={seed} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter={`url(#grain-${seed})`} />
      </svg>
    </AbsoluteFill>
  );
};

// ==================== LIGHT LEAK ====================
const LightLeak = ({ opacity = 0.1 }) => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame * 0.015) * 20;
  const pulse = 0.85 + Math.sin(frame * 0.04) * 0.15;
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(${135 + drift}deg, transparent 15%, rgba(224,122,58,0.18) 40%, rgba(212,168,76,0.12) 55%, rgba(199,90,106,0.08) 70%, transparent 85%)`,
      mixBlendMode: "screen",
      opacity: opacity * pulse,
      pointerEvents: "none",
    }} />
  );
};

// ==================== VIGNETTE ====================
const Vignette = ({ strength = 0.45 }) => (
  <AbsoluteFill style={{
    background: `radial-gradient(ellipse at 50% 50%, transparent 25%, rgba(8,6,4,${strength}) 100%)`,
    pointerEvents: "none",
  }} />
);

// ==================== LIGHT FLICKER ====================
const LightFlicker = () => {
  const frame = useCurrentFrame();
  const flicker = 1 + Math.sin(frame * 0.7) * 0.02 + Math.sin(frame * 1.3) * 0.012 + Math.sin(frame * 3.7) * 0.006;
  return (
    <AbsoluteFill style={{
      backgroundColor: `rgba(255,245,220,${Math.max(0, (flicker - 1) * 1.5)})`,
      mixBlendMode: "overlay",
      pointerEvents: "none",
    }} />
  );
};

// ==================== CAMERA SHAKE ====================
const CameraShake = ({ children, intensity = 1.0 }) => {
  const frame = useCurrentFrame();
  const x = Math.sin(frame * 0.4) * intensity * 0.5 + Math.sin(frame * 0.9) * intensity * 0.3;
  const y = Math.cos(frame * 0.5) * intensity * 0.4 + Math.cos(frame * 1.1) * intensity * 0.2;
  const rot = Math.sin(frame * 0.3) * 0.12;
  return (
    <AbsoluteFill style={{ transform: `translate(${x}px, ${y}px) rotate(${rot}deg)` }}>
      {children}
    </AbsoluteFill>
  );
};

// ==================== WIGGLE TEXT ====================
const WiggleText = ({ children, style, amount = 1.0, speed = 0.5 }) => {
  const frame = useCurrentFrame();
  const wx = Math.sin(frame * speed * 0.7 + 1.2) * amount;
  const wy = Math.cos(frame * speed * 0.5 + 0.8) * amount * 0.6;
  const wr = Math.sin(frame * speed * 0.3 + 2.1) * 0.15;
  return (
    <div style={{ ...style, transform: `${style?.transform || ""} translate(${wx}px, ${wy}px) rotate(${wr}deg)`.trim() }}>
      {children}
    </div>
  );
};

// ==================== MASK REVEAL WITH SPEED RAMP ====================
const MaskReveal = ({ children, delay = 0, overshoot = false, style = {} }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const config = overshoot
    ? { damping: 8, stiffness: 140, mass: 0.4 }
    : { damping: 15, stiffness: 80, mass: 0.8 };
  const progress = spring({ frame: Math.max(0, frame - delay), fps, config });
  const yPercent = interpolate(progress, [0, 1], [120, 0]);
  const opacity = interpolate(progress, [0, 0.12, 1], [0, 1, 1]);
  const blur = interpolate(progress, [0, 0.25, 1], [4, 1, 0]);
  return (
    <div style={{ overflow: "hidden", ...style }}>
      <div style={{ transform: `translateY(${yPercent}%)`, opacity, filter: `blur(${blur}px)` }}>
        {children}
      </div>
    </div>
  );
};

// ==================== NEON GLOW TEXT ====================
const NeonText = ({ children, style, color = C.accent, glowStrength = 1.0 }) => {
  const frame = useCurrentFrame();
  const flicker = 0.92 + Math.sin(frame * 1.2) * 0.05 + Math.sin(frame * 3.4) * 0.03;
  const g = glowStrength * flicker;
  return (
    <div style={{
      ...style,
      textShadow: `0 0 ${8*g}px rgba(255,255,255,0.4), 0 0 ${20*g}px ${color}90, 0 0 ${50*g}px ${color}50, 0 0 ${100*g}px ${color}25, 0 0 ${160*g}px ${color}12`,
    }}>
      {children}
    </div>
  );
};

// ==================== DECORATIVE LINE ====================
const DecorativeLine = ({ delay = 0, width = 60, color = C.muted }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: Math.max(0, frame - delay), fps, config: { damping: 20, stiffness: 60, mass: 1.0 } });
  return <div style={{ width: interpolate(p, [0, 1], [0, width]), height: 1, backgroundColor: color, opacity: 0.4 }} />;
};

// ==================== DUST PARTICLES ====================
const DustParticles = ({ count = 15 }) => {
  const frame = useCurrentFrame();
  const particles = Array.from({ length: count }, (_, i) => {
    const seed = i * 137.5;
    const x = ((Math.sin(seed) * 0.5 + 0.5) * 1920 + frame * (0.3 + (i % 5) * 0.15)) % 1920;
    const y = ((Math.cos(seed * 1.3) * 0.5 + 0.5) * 1080 + frame * (0.1 + (i % 3) * 0.08)) % 1080;
    const size = 1 + (i % 3) * 0.8;
    const flicker = 0.3 + Math.sin(frame * 0.1 + seed) * 0.3 + 0.4;
    return (
      <div key={i} style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: `rgba(255,245,220,${flicker})`,
        boxShadow: `0 0 ${size * 3}px rgba(255,245,220,${flicker * 0.5})`,
      }} />
    );
  });
  return <AbsoluteFill style={{ pointerEvents: "none" }}>{particles}</AbsoluteFill>;
};

// ==================== SCAN LINES ====================
const ScanLines = ({ opacity = 0.04, gap = 4 }) => (
  <AbsoluteFill style={{
    backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent ${gap - 1}px, rgba(0,0,0,${opacity}) ${gap - 1}px, rgba(0,0,0,${opacity}) ${gap}px)`,
    pointerEvents: "none",
  }} />
);

// ==================== MAIN COMPOSITION ====================
export const RetroGlass = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <CameraShake intensity={1.0}>
        <GlassDisplacement />
        <ChromaticAb />

        {/* ===== SLIDE 1: Title (0-100) ===== */}
        <Sequence from={0} durationInFrames={100}>
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 11%", filter: "url(#glass-refract) url(#chroma)" }}>
            <DecorativeLine delay={0} width={45} color={C.gold} />
            <div style={{ height: 14 }} />
            <MaskReveal delay={4}>
              <WiggleText style={{ fontFamily: monoFont, fontSize: 15, fontWeight: 300, textTransform: "uppercase", letterSpacing: "0.25em", color: C.muted }}>
                retro glass
              </WiggleText>
            </MaskReveal>
            <MaskReveal delay={10} overshoot>
              <NeonText color={C.accent} style={{ fontFamily: serifItalic, fontSize: 120, fontWeight: 400, fontStyle: "italic", color: C.text, lineHeight: 0.88, letterSpacing: "-0.02em" }}>
                Texture
              </NeonText>
            </MaskReveal>
            <MaskReveal delay={16} overshoot>
              <NeonText color={C.gold} glowStrength={0.7} style={{ fontFamily: serifFont, fontSize: 120, fontWeight: 900, textTransform: "uppercase", color: C.accent, lineHeight: 0.88, letterSpacing: "-0.01em" }}>
                & GLOW
              </NeonText>
            </MaskReveal>
            <div style={{ height: 10 }} />
            <DecorativeLine delay={20} width={45} color={C.gold} />
            <MaskReveal delay={24}>
              <WiggleText style={{ fontFamily: monoFont, fontSize: 12, fontWeight: 300, letterSpacing: "0.2em", color: C.muted, marginTop: 8, textTransform: "uppercase" }}>
                after effects — recreated in remotion
              </WiggleText>
            </MaskReveal>
          </AbsoluteFill>
        </Sequence>

        {/* ===== SLIDE 2: Speed Ramp Demo (100-200) ===== */}
        <Sequence from={100} durationInFrames={100}>
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", filter: "url(#glass-refract) url(#chroma)" }}>
            <MaskReveal delay={0}>
              <WiggleText style={{ fontFamily: sansFont, fontSize: 16, fontWeight: 300, letterSpacing: "0.4em", textTransform: "uppercase", color: C.muted }}>
                step one
              </WiggleText>
            </MaskReveal>
            <MaskReveal delay={6} overshoot>
              <NeonText color={C.pink} style={{ fontFamily: serifFont, fontSize: 150, fontWeight: 900, textTransform: "uppercase", color: C.text, lineHeight: 0.82 }}>
                SPEED
              </NeonText>
            </MaskReveal>
            <MaskReveal delay={12} overshoot>
              <NeonText color={C.accent} glowStrength={0.8} style={{ fontFamily: serifItalic, fontSize: 80, fontWeight: 400, fontStyle: "italic", color: C.gold, lineHeight: 0.85 }}>
                ramp
              </NeonText>
            </MaskReveal>
          </AbsoluteFill>
        </Sequence>

        {/* ===== SLIDE 3: Glass Texture (200-310) ===== */}
        <Sequence from={200} durationInFrames={110}>
          <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center", filter: "url(#glass-refract) url(#chroma)" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 24 }}>
              <MaskReveal delay={0}>
                <WiggleText style={{ fontFamily: sansFont, fontSize: 24, fontWeight: 300, letterSpacing: "0.35em", textTransform: "uppercase", color: C.muted }}>
                  the
                </WiggleText>
              </MaskReveal>
              <MaskReveal delay={6} overshoot>
                <NeonText color={C.accent} glowStrength={1.2} style={{ fontFamily: serifItalic, fontSize: 140, fontWeight: 700, fontStyle: "italic", color: C.accent, lineHeight: 0.85 }}>
                  glass.
                </NeonText>
              </MaskReveal>
            </div>
          </AbsoluteFill>
        </Sequence>

        {/* ===== SLIDE 4: Sauce / Polish (310-420) ===== */}
        <Sequence from={310} durationInFrames={110}>
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 10%", gap: 4, filter: "url(#glass-refract) url(#chroma)" }}>
            {[
              { label: "01", text: "Chromatic", delay: 0 },
              { label: "02", text: "Film Grain", delay: 8 },
              { label: "03", text: "Light Leaks", delay: 16 },
              { label: "04", text: "Dust", delay: 24 },
              { label: "05", text: "Scan Lines", delay: 32 },
            ].map((item) => (
              <MaskReveal key={item.label} delay={item.delay} overshoot>
                <WiggleText style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <span style={{ fontFamily: monoFont, fontSize: 13, fontWeight: 300, color: C.gold, letterSpacing: "0.1em" }}>{item.label}</span>
                  <NeonText color={C.accent} glowStrength={0.5} style={{ fontFamily: serifFont, fontSize: 60, fontWeight: 700, color: C.text, lineHeight: 1.05 }}>
                    {item.text}
                  </NeonText>
                </WiggleText>
              </MaskReveal>
            ))}
          </AbsoluteFill>
        </Sequence>

        {/* ===== SLIDE 5: Closer (420-540) ===== */}
        <Sequence from={420} durationInFrames={120}>
          <AbsoluteFill style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4, filter: "url(#glass-refract) url(#chroma)" }}>
            <DecorativeLine delay={0} width={80} color={C.accent} />
            <div style={{ height: 6 }} />
            <MaskReveal delay={4}>
              <WiggleText style={{ fontFamily: monoFont, fontSize: 13, fontWeight: 300, textTransform: "uppercase", letterSpacing: "0.35em", color: C.muted }}>
                all effects
              </WiggleText>
            </MaskReveal>
            <MaskReveal delay={10} overshoot>
              <NeonText color={C.accent} glowStrength={1.5} style={{ fontFamily: serifFont, fontSize: 130, fontWeight: 900, textTransform: "uppercase", color: C.text, lineHeight: 0.82 }}>
                RETRO
              </NeonText>
            </MaskReveal>
            <MaskReveal delay={16} overshoot>
              <NeonText color={C.gold} glowStrength={1.0} style={{ fontFamily: serifItalic, fontSize: 90, fontWeight: 700, fontStyle: "italic", color: C.gold, lineHeight: 0.85 }}>
                glass
              </NeonText>
            </MaskReveal>
            <div style={{ height: 6 }} />
            <DecorativeLine delay={20} width={80} color={C.accent} />
          </AbsoluteFill>
        </Sequence>
      </CameraShake>

      {/* ===== OVERLAY STACK ===== */}
      <GlassScratchTexture opacity={0.14} />
      <ScanLines opacity={0.035} gap={3} />
      <FilmGrain opacity={0.065} />
      <DustParticles count={18} />
      <LightLeak opacity={0.1} />
      <LightFlicker />
      <Vignette strength={0.45} />
    </AbsoluteFill>
  );
};
