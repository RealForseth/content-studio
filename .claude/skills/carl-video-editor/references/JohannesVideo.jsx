import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Sequence,
  OffthreadVideo,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["900"],
  subsets: ["latin"],
});

// ==================== STYLE ====================
const ACCENT = "#FF8C00";
const BG = "#F6F6F6";
const FONT = fontFamily;
const s = (sec) => Math.round(sec * 30);

// ==================== EDGE-ONLY SHIMMER (F2 settings) ====================
const ShimmerFilter = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(frame / 4);

  return (
    <svg width="0" height="0" style={{ position: "absolute" }}>
      <defs>
        <filter id="shimmer" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.003"
            numOctaves={1}
            seed={seed}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale={5}
            xChannelSelector="R"
            yChannelSelector="G"
            result="displaced"
          />
          <feMorphology
            in="SourceGraphic"
            operator="erode"
            radius="0.6"
            result="innerCrisp"
          />
          <feComposite
            in="innerCrisp"
            in2="displaced"
            operator="over"
          />
        </filter>
      </defs>
    </svg>
  );
};

// ==================== SIMPLE SUBTITLE (v7 style — instant, 3-4 words) ====================
const Subtitle = ({ text, from, duration }) => (
  <Sequence from={from} durationInFrames={duration}>
    <div
      style={{
        position: "absolute",
        bottom: 140,
        left: 16,
        right: 16,
        textAlign: "center",
        zIndex: 50,
      }}
    >
      <span
        style={{
          fontSize: 36,
          fontWeight: 900,
          color: "#FFFFFF",
          fontFamily: FONT,
          letterSpacing: "-1px",
          lineHeight: 1.25,
          textShadow: "0 2px 6px rgba(0,0,0,0.7), 0 0 14px rgba(0,0,0,0.4)",
        }}
      >
        {text}
      </span>
    </div>
  </Sequence>
);

// ==================== B-ROLL SLIDE ====================
const BrollSlide = ({ lines }) => (
  <AbsoluteFill style={{ backgroundColor: BG }}>
    <ShimmerFilter />
    <div
      style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        padding: "0 36px",
        filter: "url(#shimmer)",
      }}
    >
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            fontSize: line.big ? 58 : 34,
            fontWeight: 900,
            color: line.accent ? ACCENT : "#2B2B2B",
            fontFamily: FONT,
            textAlign: "center",
            letterSpacing: line.big ? "-2px" : "-0.5px",
            lineHeight: 1.15,
            textShadow: line.accent
              ? `0 4px 24px ${ACCENT}18, 0 0 60px ${ACCENT}08, 0 2px 8px rgba(0,0,0,0.05)`
              : "0 2px 12px rgba(0,0,0,0.06), 0 0 50px rgba(0,0,0,0.03)",
          }}
        >
          {line.text}
        </div>
      ))}
    </div>
  </AbsoluteFill>
);

const Broll = ({ from, duration, children }) => (
  <Sequence from={from} durationInFrames={duration}>
    {children}
  </Sequence>
);

// ==================== PROGRESS BAR ====================
const ProgressBar = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return (
    <div style={{
      position: "absolute", bottom: 0, left: 0,
      width: "100%", height: 3,
      backgroundColor: "rgba(255,255,255,0.06)",
      zIndex: 100,
    }}>
      <div style={{
        width: `${(frame / durationInFrames) * 100}%`,
        height: "100%",
        backgroundColor: ACCENT,
      }} />
    </div>
  );
};

// ==================== MAIN ====================
export const JohannesVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile("talking-head-v2.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* ===== SUBTITLES (instant, 3-4 words) ===== */}
      <Subtitle text="Jeg heter Johannes," from={s(0.00)} duration={s(0.98)} />
      <Subtitle text="og jeg vurderer" from={s(0.98)} duration={s(0.72)} />
      <Subtitle text="så jævlig å" from={s(1.70)} duration={s(0.98)} />
      <Subtitle text="Jeg har så jævlig" from={s(4.04)} duration={s(0.54)} />
      <Subtitle text="lyst å satse" from={s(4.58)} duration={s(0.82)} />
      <Subtitle text="som jeg skulle ønske." from={s(9.60)} duration={s(0.72)} />
      <Subtitle text="Og det skjønner jeg" from={s(10.32)} duration={s(0.72)} />
      <Subtitle text="jævlig godt." from={s(11.04)} duration={s(0.62)} />
      <Subtitle text="Så for å få" from={s(11.66)} duration={s(0.56)} />
      <Subtitle text="ting til å gå opp," from={s(12.22)} duration={s(0.82)} />
      <Subtitle text="Hva er det egentlig" from={s(14.70)} duration={s(0.64)} />
      <Subtitle text="jeg holder på med?" from={s(15.34)} duration={s(0.42)} />
      <Subtitle text="Programmerer ikke" from={s(18.24)} duration={s(0.54)} />
      <Subtitle text="selv lenger." from={s(18.78)} duration={s(0.56)} />
      <Subtitle text="Man må bare" from={s(22.08)} duration={s(0.62)} />
      <Subtitle text="starte en plass," from={s(22.70)} duration={s(0.58)} />

      {/* ===== B-ROLL ===== */}
      <Broll from={s(2.68)} duration={s(1.36)}>
        <BrollSlide lines={[
          { text: "droppe ut", big: true, accent: true },
          { text: "av høyskolen", big: false },
        ]} />
      </Broll>

      <Broll from={s(5.40)} duration={s(0.94)}>
        <BrollSlide lines={[
          { text: "jævlig", big: false },
          { text: "risky.", big: true, accent: true },
        ]} />
      </Broll>

      <Broll from={s(6.04)} duration={s(1.96)}>
        <BrollSlide lines={[
          { text: "hva faen", big: true, accent: true },
          { text: "skal man gjøre?", big: false },
        ]} />
      </Broll>

      <Broll from={s(8.02)} duration={s(1.58)}>
        <BrollSlide lines={[
          { text: "mamma og pappa", big: false },
          { text: "støtter ikke", big: true, accent: true },
        ]} />
      </Broll>

      <Broll from={s(13.24)} duration={s(1.46)}>
        <BrollSlide lines={[
          { text: "ikke droppe ut", big: false },
          { text: "før ting skjer.", big: true, accent: true },
        ]} />
      </Broll>

      <Broll from={s(16.06)} duration={s(2.18)}>
        <BrollSlide lines={[
          { text: "utvikler apper", big: false },
          { text: "med AI", big: true, accent: true },
        ]} />
      </Broll>

      <Broll from={s(19.34)} duration={s(2.74)}>
        <BrollSlide lines={[
          { text: "1. apper", big: false, accent: true },
          { text: "2. videoer", big: false, accent: true },
          { text: "3. reise", big: false, accent: true },
        ]} />
      </Broll>

      <Broll from={s(23.68)} duration={s(2.32)}>
        <BrollSlide lines={[
          { text: "dette er", big: false },
          { text: "min start.", big: true, accent: true },
        ]} />
      </Broll>

      <ProgressBar />
    </AbsoluteFill>
  );
};
