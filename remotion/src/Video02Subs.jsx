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

const SUBS = [
  { text: "Jo,", start: 0.14, end: 0.76 },
  { text: "nå har jeg bestemt", start: 1.08, end: 2.0 },
  { text: "meg for å oppdatere", start: 2.0, end: 3.48 },
  { text: "Karl.", start: 3.48, end: 3.76 },
  { text: "Karl jobber inn her", start: 3.88, end: 4.76 },
  { text: "as we speak", start: 4.76, end: 5.22 },
  { text: "for å redigere", start: 5.22, end: 6.04 },
  { text: "en video,", start: 6.04, end: 6.36 },
  { text: "bare for å teste.", start: 6.5, end: 6.9 },
  { text: "Og nå tenkte jeg", start: 7.1, end: 7.96 },
  { text: "å filme den her,", start: 7.96, end: 8.66 },
  { text: "bare for å teste", start: 8.86, end: 9.26 },
  { text: "mens han tester.", start: 9.26, end: 10.06 },
  { text: "Sånn double test,", start: 10.92, end: 11.78 },
  { text: "vet du.", start: 12.04, end: 12.2 },
  { text: "Jeg valgte å kalle", start: 12.32, end: 12.8 },
  { text: "assistenten min Karl,", start: 12.8, end: 13.86 },
  { text: "men jeg merket", start: 14.02, end: 15.28 },
  { text: "at det ruller ikke", start: 15.28, end: 15.8 },
  { text: "så veldig mye på", start: 15.8, end: 16.52 },
  { text: "tunga.", start: 16.52, end: 16.88 },
  { text: "Så,", start: 17.22, end: 17.62 },
  { text: "vi skal finne på", start: 17.96, end: 18.38 },
  { text: "et bedre navn til", start: 18.38, end: 18.8 },
  { text: "Karl.", start: 18.8, end: 19.14 },
  { text: "Til assistenten.", start: 19.5, end: 20.02 },
  { text: "Men nå er jeg", start: 20.36, end: 20.68 },
  { text: "veldig spent på å", start: 20.68, end: 21.42 },
  { text: "se om den klarer", start: 21.42, end: 22.08 },
  { text: "å analysere alle de", start: 22.08, end: 23.36 },
  { text: "ulike mellomrommene,", start: 23.36, end: 24.44 },
  { text: "der det er silence,", start: 24.6, end: 25.32 },
  { text: "om det er ulike", start: 25.32, end: 26.66 },
  { text: "kutt som er failet", start: 26.66, end: 27.62 },
  { text: "og fucka opp.", start: 27.62, end: 28.36 },
  { text: "Så er tanken min", start: 28.54, end: 29.12 },
  { text: "at den skal ha", start: 29.12, end: 29.7 },
  { text: "muligheten til å analysere", start: 29.7, end: 31.94 },
  { text: "hva det er jeg sier,", start: 31.94, end: 32.78 },
  { text: "hva det er som", start: 33.12, end: 33.58 },
  { text: "jeg ikke sier,", start: 33.58, end: 34.4 },
  { text: "eller hva jeg sier,", start: 34.64, end: 35.74 },
  { text: "og hva jeg fucker opp.", start: 36.06, end: 37.12 },
  { text: "Analyser bad takes,", start: 37.48, end: 38.46 },
  { text: "kanskje dårlige kameravinkler.", start: 38.68, end: 40.06 },
  { text: "Ja, det blir litt", start: 40.22, end: 40.76 },
  { text: "avansert.", start: 40.76, end: 41.18 },
  { text: "Vi må gjøre det", start: 41.84, end: 42.24 },
  { text: "litt enkelt, tror jeg.", start: 42.24, end: 42.72 },
  { text: "Mens jeg snakker,", start: 42.9, end: 43.52 },
  { text: "så har Karl mekket", start: 43.72, end: 45.22 },
  { text: "en video her.", start: 45.22, end: 46.48 },
  { text: "Og da er jeg", start: 46.7, end: 47.0 },
  { text: "veldig spent på å", start: 47.0, end: 47.48 },
  { text: "se om den faktisk", start: 47.48, end: 48.18 },
  { text: "mekker en jævlig bra", start: 48.18, end: 48.72 },
  { text: "video.", start: 48.72, end: 48.72 },
];

const Subtitle = ({ text }) => (
  <div style={{ position: "absolute", bottom: 220, left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none", zIndex: 10 }}>
    <span style={{ fontFamily, fontWeight: 900, fontSize: 54, letterSpacing: "-1.5px", lineHeight: 1.25, color: C.subtitleColor, textShadow: C.subtitleShadow, textAlign: "center", padding: "10px 20px", maxWidth: "90%" }}>
      {text}
    </span>
  </div>
);

export const Video02Subs = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  const activeSub = SUBS.find((s) => currentTime >= s.start && currentTime < s.end);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <OffthreadVideo
        src={staticFile("video02_30fps.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {activeSub && <Subtitle text={activeSub.text} />}
    </AbsoluteFill>
  );
};
