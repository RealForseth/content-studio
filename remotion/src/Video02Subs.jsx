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
  { text: "Jo,", start: 0.21, end: 0.81 },
  { text: "nå har jeg bestemt", start: 1.13, end: 2.07 },
  { text: "meg for å oppdatere", start: 2.07, end: 3.73 },
  { text: "Karl.", start: 3.73, end: 3.99 },
  { text: "Karl jobber inn her", start: 4.15, end: 5.01 },
  { text: "i The As We", start: 5.01, end: 5.47 },
  { text: "Speak for å redigere", start: 5.47, end: 6.29 },
  { text: "en video, bare for", start: 6.29, end: 6.89 },
  { text: "å teste.", start: 6.89, end: 7.15 },
  { text: "Og nå tenkte jeg", start: 7.37, end: 8.19 },
  { text: "å filme den her", start: 8.19, end: 9.03 },
  { text: "bare for å teste", start: 9.03, end: 9.63 },
  { text: "mens han testet.", start: 9.63, end: 11.17 },
  { text: "Sånn double test,", start: 11.35, end: 12.25 },
  { text: "vet du.", start: 12.53, end: 12.53 },
  { text: "Så,", start: 12.79, end: 13.19 },
  { text: "vi skal finne på", start: 13.61, end: 14.01 },
  { text: "et bedre navn til", start: 14.01, end: 14.47 },
  { text: "Karl.", start: 14.47, end: 14.79 },
  { text: "Til assistenten.", start: 15.17, end: 15.73 },
  { text: "Men nå er jeg", start: 16.15, end: 16.41 },
  { text: "veldig spent på å", start: 16.41, end: 17.11 },
  { text: "se om den klarer", start: 17.11, end: 17.81 },
  { text: "å analysere alle de", start: 17.81, end: 19.11 },
  { text: "ulike mellomrommene, der det", start: 19.11, end: 20.53 },
  { text: "er silens,", start: 20.53, end: 21.19 },
  { text: "om det er ulike", start: 21.35, end: 22.55 },
  { text: "kutt som er feil", start: 22.55, end: 23.53 },
  { text: "å fucka opp på.", start: 23.53, end: 24.37 },
  { text: "Så er tanken min", start: 24.37, end: 25.33 },
  { text: "at den skal ha", start: 25.33, end: 25.91 },
  { text: "muligheten til å analysere", start: 25.91, end: 28.15 },
  { text: "hva det er jeg", start: 28.15, end: 28.69 },
  { text: "sier,", start: 28.69, end: 29.07 },
  { text: "hva det er som", start: 29.31, end: 29.81 },
  { text: "jeg ikke sier,", start: 29.81, end: 31.33 },
  { text: "eller hva det er", start: 32.13, end: 32.65 },
  { text: "jeg sier og hva", start: 32.65, end: 33.67 },
  { text: "det er jeg fucka", start: 33.67, end: 34.11 },
  { text: "oppå.", start: 34.11, end: 34.59 },
  { text: "Jeg ser bad takes,", start: 34.95, end: 36.07 },
  { text: "kanskje dårlige kameravinkler.", start: 36.17, end: 37.71 },
  { text: "Ja, det blir litt", start: 37.87, end: 38.37 },
  { text: "avansert.", start: 38.37, end: 38.81 },
  { text: "Vi må gjøre det", start: 39.45, end: 39.83 },
  { text: "litt enkelt, tror jeg.", start: 39.83, end: 40.39 },
  { text: "Men nå ser jeg", start: 40.67, end: 41.03 },
  { text: "at Karl,", start: 41.03, end: 41.37 },
  { text: "der, mens jeg snakket,", start: 41.49, end: 43.25 },
  { text: "så har Karl...", start: 43.37, end: 44.43 },
  { text: "Det her blir spennende", start: 44.43, end: 44.99 },
  { text: "å se.", start: 44.99, end: 45.35 },
  { text: "Mens jeg snakket,", start: 45.35, end: 46.13 },
  { text: "så har Karl mekket", start: 46.33, end: 47.73 },
  { text: "en video her, basert", start: 47.73, end: 48.73 },
  { text: "på min request.", start: 48.73, end: 51.39 },
  { text: "Og da er jeg", start: 52.45, end: 52.73 },
  { text: "veldig spent på å", start: 52.73, end: 53.17 },
  { text: "se om den faktisk", start: 53.17, end: 53.89 },
  { text: "mekker en jævlig bra", start: 53.89, end: 54.41 },
  { text: "video.", start: 54.41, end: 54.45 },
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
