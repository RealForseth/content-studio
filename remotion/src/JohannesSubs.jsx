import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  OffthreadVideo,
  staticFile,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Inter";

const { fontFamily } = loadFont("normal", {
  weights: ["900"],
  subsets: ["latin", "latin-ext"],
});

const C = {
  subtitleColor: "#FFFFFF",
  subtitleShadow: "0 2px 6px rgba(0,0,0,0.7), 0 0 14px rgba(0,0,0,0.4)",
  accent: "#FFBF65",
};

// v6: v4 edit — insert clip moved AFTER mikrofoner, trimmed 1s
const SUBS = [
  { text: "Mitt navn er Johannes,", start: 0.14, end: 1.2 },
  { text: "og jeg har en", start: 1.52, end: 2.58 },
  { text: "tendens til å utsette", start: 2.58, end: 3.26 },
  { text: "ting hele tiden.", start: 3.26, end: 3.98 },
  { text: "Jeg skulle ha startet", start: 4.22, end: 4.74 },
  { text: "å poste videoer på", start: 4.74, end: 5.36 },
  { text: "Instagram,", start: 5.36, end: 5.84 },
  { text: "TikTok,", start: 5.96, end: 6.28 },
  { text: "YouTube,", start: 6.6, end: 7.02 },
  { text: "LinkedIn,", start: 7.22, end: 7.68 },
  { text: "X.", start: 8.12, end: 8.3 },
  { text: "Jeg kjøpte meg et", start: 9.02, end: 9.44 },
  { text: "kamera,", start: 9.44, end: 9.9 },
  { text: "hvis dere vil.", start: 10.22, end: 10.76 },
  { text: "30 000 pluss.", start: 13.1, end: 14.22 },
  { text: "Ikke inkludert linse,", start: 14.4, end: 15.48 },
  { text: "ikke inkludert mikrofoner.", start: 15.48, end: 17.22 },
  { text: "Men hva er det", start: 20.0, end: 20.46 },
  { text: "jeg gjør istedenfor?", start: 20.46, end: 21.08 },
  { text: "Nei.", start: 21.28, end: 21.64 },
  { text: "Jeg prøver å automatisere", start: 21.74, end: 23.2 },
  { text: "content creation.", start: 23.2, end: 23.84 },
  { text: "Nå er jeg på", start: 24.0, end: 24.3 },
  { text: "å lage en AI-bot", start: 24.3, end: 25.36 },
  { text: "som jobber på", start: 25.36, end: 26.26, slackCorrection: true },
  { text: "Hva er det den", start: 26.38, end: 26.7 },
  { text: "gjør?", start: 26.7, end: 26.94 },
  { text: "Tankegangen er at når", start: 27.28, end: 27.96 },
  { text: "jeg filmer en video", start: 27.96, end: 28.48 },
  { text: "her,", start: 28.48, end: 28.94 },
  { text: "så sender jeg den", start: 28.96, end: 29.46 },
  { text: "til AI-boten.", start: 29.46, end: 30.36 },
  { text: "La oss kalle den", start: 30.44, end: 30.82 },
  { text: "en assistent.", start: 30.82, end: 31.32 },
  { text: "Så analyserer assistenten min,", start: 31.46, end: 33.06 },
  { text: "alt jeg sier.", start: 33.44, end: 33.94 },
  { text: "Hva jeg snakker om.", start: 34.02, end: 34.72 },
  { text: "Og så redigerer den,", start: 34.94, end: 36.3 },
  { text: "klipper det sammen.", start: 36.42, end: 37.1 },
  { text: "På en artig måte.", start: 37.26, end: 38.3 },
  { text: "Og finner ut hva", start: 38.54, end: 38.92 },
  { text: "som er viktig.", start: 38.92, end: 39.1 },
  { text: "Legger på tekst.", start: 39.26, end: 39.94 },
  { text: "Poster den på sosiale medier", start: 40.12, end: 41.1 },
  { text: "for meg.", start: 41.1, end: 41.52 },
  { text: "Det er det som", start: 41.7, end: 41.94 },
  { text: "er tankegangen.", start: 41.94, end: 42.26 },
  { text: "Så hvis videoen her", start: 42.4, end: 43.36 },
  { text: "ser bra ut,", start: 43.36, end: 43.9 },
  { text: "så er det ikke", start: 44.16, end: 44.68 },
  { text: "jeg som burde få kreds,", start: 44.68, end: 45.18 },
  { text: "da er det AI-en.", start: 45.32, end: 46.42 },
  { text: "For jeg tok bare", start: 46.56, end: 47.22 },
  { text: "nettopp telefonen.", start: 47.22, end: 48.02 },
  { text: "Og skulle sjekke om", start: 48.06, end: 48.52 },
  { text: "det fungerer.", start: 48.52, end: 48.84 },
  { text: "Nice,", start: 48.96, end: 49.18 },
  { text: "ok.", start: 49.32, end: 49.5 },
  { text: "Hadet!", start: 49.64, end: 49.88 },
];

const SlackCorrection = () => (
  <div style={{ position: "absolute", bottom: 140, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 10 }}>
    <span style={{ fontFamily, fontWeight: 900, fontSize: 36, letterSpacing: "-1px", lineHeight: 1.25, color: C.subtitleColor, textShadow: C.subtitleShadow, textAlign: "center", padding: "8px 16px" }}>
      {"som jobber på "}
      <span style={{ position: "relative", display: "inline-block" }}>
        <span style={{ position: "absolute", top: -32, left: "50%", transform: "translateX(-50%)", color: C.accent, fontSize: 30, fontWeight: 900, whiteSpace: "nowrap", textShadow: C.subtitleShadow }}>
          Telegram
        </span>
        <span style={{ position: "relative" }}>
          Slack.
          <span style={{ position: "absolute", left: -4, right: -4, top: "50%", height: 5, backgroundColor: C.accent, borderRadius: 3, transform: "rotate(-2deg)" }} />
        </span>
      </span>
    </span>
  </div>
);

const Subtitle = ({ text }) => (
  <div style={{ position: "absolute", bottom: 140, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 10 }}>
    <span style={{ fontFamily, fontWeight: 900, fontSize: 36, letterSpacing: "-1px", lineHeight: 1.25, color: C.subtitleColor, textShadow: C.subtitleShadow, textAlign: "center", padding: "8px 16px", maxWidth: "90%" }}>
      {text}
    </span>
  </div>
);

export const JohannesSubs = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  const activeSub = SUBS.find((s) => currentTime >= s.start && currentTime < s.end);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile("edited_v4_30fps.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {activeSub && (activeSub.slackCorrection ? <SlackCorrection /> : <Subtitle text={activeSub.text} />)}
    </AbsoluteFill>
  );
};
