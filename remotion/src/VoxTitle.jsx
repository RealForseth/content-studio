import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Audio,
  staticFile,
} from "remotion";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";

// ==================== FONTS ====================
const { fontFamily: serifFont } = loadPlayfair("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

// ==================== COLORS (precise from video) ====================
const C = {
  bg: "#EFECE7",
  textFaded: "#868686",
  textDark: "#2A2A2A",
  boxFill: "#FFFFFF",
  strokeRed: "#D42C2C",
};

// ==================== S-CURVE EASING ====================
const sCurveEasing = (t) => {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.5
    ? 4 * clamped * clamped * clamped
    : 1 - Math.pow(-2 * clamped + 2, 3) / 2;
};

// ==================== TEXT ITEMS ====================
const TEXT_ITEMS = [
  "Chicken Nuggets",
  "Subscribe",
  "Please",
  "Road to 100k",
  "Free Ketchup",
  "Nutella",
  "Undefeated",
];

const LINE_HEIGHT = 120; // 120px baseline-to-baseline
const FONT_SIZE = 80;

// Target indices for each phase
const TARGET_1 = 1; // "Subscribe"
const TARGET_2 = 4; // "Free Ketchup"

// Box dimensions per target (wider for longer text)
const BOX_WIDTHS = {
  [TARGET_1]: 520, // "Subscribe"
  [TARGET_2]: 640, // "Free Ketchup"
};
const BOX_HEIGHT = LINE_HEIGHT + 20;

// ==================== FILM GRAIN ====================
const FilmGrain = ({ opacity = 0.07, frame }) => {
  const seed = (Math.floor(frame / 2.5) * 17) % 997;
  return (
    <AbsoluteFill
      style={{ mixBlendMode: "overlay", opacity, pointerEvents: "none" }}
    >
      <svg width="100%" height="100%">
        <filter id={`vox-grain-${seed}`}>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.7"
            numOctaves="4"
            seed={seed}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter={`url(#vox-grain-${seed})`}
        />
      </svg>
    </AbsoluteFill>
  );
};

// ==================== EDGE FADE/BLUR (top + bottom) ====================
const EdgeFade = () => (
  <AbsoluteFill style={{ pointerEvents: "none", zIndex: 10 }}>
    {/* Top fade */}
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 200,
        background: `linear-gradient(to bottom, ${C.bg} 0%, ${C.bg}00 100%)`,
      }}
    />
    {/* Bottom fade */}
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
        background: `linear-gradient(to top, ${C.bg} 0%, ${C.bg}00 100%)`,
      }}
    />
  </AbsoluteFill>
);

// ==================== PAPER TEXTURE ====================
const PaperTexture = ({ opacity = 0.08 }) => (
  <AbsoluteFill
    style={{ mixBlendMode: "softLight", opacity, pointerEvents: "none" }}
  >
    <svg width="100%" height="100%">
      <filter id="vox-paper">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.04"
          numOctaves="5"
          seed={42}
          result="coarse"
        />
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.8"
          numOctaves="2"
          seed={7}
          result="fine"
        />
        <feMerge>
          <feMergeNode in="coarse" />
          <feMergeNode in="fine" />
        </feMerge>
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#vox-paper)" />
    </svg>
  </AbsoluteFill>
);

// ==================== TURBULENT DISPLACE (hand-printed wobble) ====================
const TurbulentDisplace = ({ frame }) => {
  // Vary seed per posterized frame for subtle wobble shift
  const seed = 5 + (Math.floor(frame / 2.5) % 3);
  return (
    <svg
      width="0"
      height="0"
      style={{ position: "absolute", pointerEvents: "none" }}
    >
      <defs>
        <filter id="vox-displace" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.015"
            numOctaves="3"
            seed={seed}
            result="turbulence"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="turbulence"
            scale="4"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
        {/* Roughen edges filter for the red stroke */}
        <filter id="vox-roughen" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence
            type="turbulence"
            baseFrequency="0.04"
            numOctaves="4"
            seed={3}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="1.5"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
};

// ==================== TEXT LIST COMPONENT ====================
const TextList = ({ color, scrollY, clipRect = null, fontWeight = 400 }) => {
  const totalHeight = TEXT_ITEMS.length * LINE_HEIGHT;
  const startY = 1080 / 2 - totalHeight / 2;

  const content = (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1920,
        height: 1080,
        transform: `translateY(${scrollY}px)`,
      }}
    >
      {TEXT_ITEMS.map((text, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            top: startY + i * LINE_HEIGHT,
            width: "100%",
            textAlign: "center",
            fontFamily: serifFont,
            fontSize: FONT_SIZE,
            fontWeight,
            color,
            lineHeight: `${LINE_HEIGHT}px`,
            whiteSpace: "nowrap",
            userSelect: "none",
            letterSpacing: "0.5px",
          }}
        >
          {text}
        </div>
      ))}
    </div>
  );

  if (clipRect) {
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          overflow: "hidden",
          clipPath: `inset(${clipRect.top}px ${clipRect.right}px ${clipRect.bottom}px ${clipRect.left}px)`,
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1920,
        height: 1080,
        overflow: "hidden",
      }}
    >
      {content}
    </div>
  );
};

// ==================== FILLED WHITE BOX (alpha matte) ====================
const FilledBox = ({ width, height, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      top: 1080 / 2 - height / 2,
      left: 1920 / 2 - width / 2,
      width: Math.max(0, width),
      height,
      backgroundColor: C.boxFill,
      opacity,
      pointerEvents: "none",
    }}
  />
);

// ==================== HIGHLIGHTER SCRIBBLE ====================
const HighlighterScribble = ({ width, opacity = 1, frame }) => {
  // Animated red scribble/highlight that draws across the text
  const pf = Math.floor(frame / 2.5) * 2.5;
  // Draw progress: scribble draws from left to right
  const drawWidth = width * opacity;

  return (
    <div
      style={{
        position: "absolute",
        top: 1080 / 2 - 8,
        left: 1920 / 2 - width / 2,
        width: Math.max(0, drawWidth),
        height: 16,
        backgroundColor: C.strokeRed,
        opacity: 0.55,
        borderRadius: "4px 6px 3px 5px",
        transform: "rotate(-0.8deg)",
        filter: "url(#vox-roughen)",
        pointerEvents: "none",
      }}
    />
  );
};

// ==================== RED STROKE OUTLINE ====================
const RedStrokeBox = ({ width, height, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      top: 1080 / 2 - height / 2,
      left: 1920 / 2 - width / 2,
      width: Math.max(0, width),
      height,
      border: `2px solid ${C.strokeRed}`,
      borderRadius: 2,
      opacity,
      pointerEvents: "none",
      filter: "url(#vox-roughen)",
    }}
  />
);

// ==================== MAIN COMPOSITION ====================
export const VoxTitle = () => {
  const frame = useCurrentFrame();

  // ====== POSTERIZE TIME — ~12fps choppy feel ======
  const pf = Math.floor(frame / 2.5) * 2.5;

  // ====== LAYOUT: natural center of list ======
  const middleIndex = (TEXT_ITEMS.length - 1) / 2; // 3.0
  const lastIndex = TEXT_ITEMS.length - 1; // 6

  // scrollY offset to center a given index
  const scrollForIndex = (idx) => -(idx - middleIndex) * LINE_HEIGHT;

  // ========================================================
  //  PHASE 1: frames 0–120
  //    - Start with "Undefeated" (last) centered
  //    - Scroll up so "Subscribe" (index 1) reaches center
  //    - White box expands from center to reveal "Subscribe"
  //    - Red stroke appears after box opens
  // ========================================================

  // Phase 1 scroll: "Undefeated" -> "Subscribe"
  const scroll1Start = scrollForIndex(lastIndex);
  const scroll1End = scrollForIndex(TARGET_1);
  const scroll1Progress = sCurveEasing(
    interpolate(pf, [0, 55], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Phase 1 box open (slightly delayed from scroll start)
  const box1Progress = sCurveEasing(
    interpolate(pf, [15, 55], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const box1Width = box1Progress * BOX_WIDTHS[TARGET_1];

  // Phase 1 red stroke (appears after box opens)
  const stroke1Opacity = interpolate(pf, [50, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ========================================================
  //  PHASE 2: frames 120–240
  //    - Brief hold with micro-movement
  //    - Close box on "Subscribe"
  //    - Scroll to "Free Ketchup" (index 4)
  //    - Open box on "Free Ketchup"
  //    - Red stroke on new target
  // ========================================================

  // Phase 2: close box 1
  const box1Close = sCurveEasing(
    interpolate(pf, [120, 140], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Phase 2 scroll: "Subscribe" -> "Free Ketchup"
  const scroll2Start = scrollForIndex(TARGET_1);
  const scroll2End = scrollForIndex(TARGET_2);
  const scroll2Progress = sCurveEasing(
    interpolate(pf, [125, 175], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  // Phase 2 box open
  const box2Progress = sCurveEasing(
    interpolate(pf, [145, 185], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const box2Width = box2Progress * BOX_WIDTHS[TARGET_2];

  // Phase 2 red stroke
  const stroke2Opacity = interpolate(pf, [180, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ====== COMBINE SCROLL ======
  let scrollY;
  if (pf <= 120) {
    // Phase 1: scroll from last item to target 1
    scrollY = scroll1Start + scroll1Progress * (scroll1End - scroll1Start);
    // Micro-movement in hold zone (frames 60-120)
    const microProgress = interpolate(pf, [60, 120], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    scrollY += Math.sin(microProgress * Math.PI * 2) * 3;
  } else {
    // Phase 2: scroll from target 1 to target 2
    scrollY = scroll2Start + scroll2Progress * (scroll2End - scroll2Start);
    // Micro-movement in hold zone (frames 190-240)
    const microProgress = interpolate(pf, [190, 240], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    scrollY += Math.sin(microProgress * Math.PI * 2) * 3;
  }

  // ====== COMBINE BOX WIDTH ======
  let activeBoxWidth;
  let activeBoxHeight = BOX_HEIGHT;
  if (pf <= 120) {
    activeBoxWidth = box1Width;
  } else if (pf <= 145) {
    // Closing box 1, box 2 not yet open
    const closingWidth = box1Width * (1 - box1Close);
    activeBoxWidth = Math.max(closingWidth, box2Width);
  } else {
    activeBoxWidth = box2Width;
  }

  // ====== COMBINE RED STROKE ======
  let strokeOpacity;
  let strokeWidth;
  if (pf <= 120) {
    strokeOpacity = stroke1Opacity;
    strokeWidth = BOX_WIDTHS[TARGET_1];
  } else if (pf <= 140) {
    // Fade out stroke 1
    strokeOpacity = interpolate(pf, [120, 130], [1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    strokeWidth = BOX_WIDTHS[TARGET_1];
  } else {
    strokeOpacity = stroke2Opacity;
    strokeWidth = BOX_WIDTHS[TARGET_2];
  }

  // ====== CLIP RECT for track matte ======
  const clipCenterX = 1920 / 2;
  const clipCenterY = 1080 / 2;
  const halfW = activeBoxWidth / 2;
  const halfH = activeBoxHeight / 2;
  const clipRect = {
    top: clipCenterY - halfH,
    right: 1920 - (clipCenterX + halfW),
    bottom: 1080 - (clipCenterY + halfH),
    left: clipCenterX - halfW,
  };

  // ====== ZOOM at end of phase 2 (frames 200-240) ======
  const zoomProgress = sCurveEasing(
    interpolate(pf, [200, 235], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const zoomScale = 1 + zoomProgress * 0.8; // zoom from 1x to 1.8x
  const zoomX = interpolate(zoomProgress, [0, 1], [0, 0]); // stay centered
  const zoomY = interpolate(zoomProgress, [0, 1], [0, 0]);

  // ====== HIGHLIGHTER on "Free Ketchup" (frames 195-225) ======
  const highlighterProgress = sCurveEasing(
    interpolate(pf, [195, 215], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      {/* Sound effects */}
      <Audio src={staticFile("vox-sfx.wav")} volume={0.7} />

      {/* SVG filters */}
      <TurbulentDisplace frame={frame} />

      {/* Main content with turbulent displacement wobble + zoom */}
      <AbsoluteFill
        style={{
          filter: "url(#vox-displace)",
          transform: `scale(${zoomScale})`,
          transformOrigin: "50% 50%",
        }}
      >
        {/* Layer 1: Faded grey text (always visible) */}
        <TextList
          color={C.textFaded}
          scrollY={scrollY}
          fontWeight={400}
        />

        {/* Layer 2: Filled white box (the matte itself — visible behind dark text) */}
        {activeBoxWidth > 0 && (
          <FilledBox width={activeBoxWidth} height={activeBoxHeight} />
        )}

        {/* Layer 3: Dark text clipped to white box area (track matte reveal) */}
        {activeBoxWidth > 0 && (
          <TextList
            color={C.textDark}
            scrollY={scrollY}
            fontWeight={400}
            clipRect={{
              top: Math.max(0, clipRect.top),
              right: Math.max(0, clipRect.right),
              bottom: Math.max(0, clipRect.bottom),
              left: Math.max(0, clipRect.left),
            }}
          />
        )}

        {/* Layer 4: Red stroke outline */}
        {strokeOpacity > 0 && (
          <RedStrokeBox
            width={strokeWidth + 16}
            height={activeBoxHeight + 8}
            opacity={strokeOpacity}
          />
        )}

        {/* Layer 5: Highlighter scribble on "Free Ketchup" (phase 2 end) */}
        {highlighterProgress > 0 && (
          <HighlighterScribble
            width={BOX_WIDTHS[TARGET_2] - 40}
            opacity={highlighterProgress}
            frame={frame}
          />
        )}
      </AbsoluteFill>

      {/* Edge fade — text near top/bottom fades out */}
      <EdgeFade />

      {/* Paper texture overlay */}
      <PaperTexture opacity={0.08} />

      {/* Film grain overlay */}
      <FilmGrain opacity={0.07} frame={frame} />
    </AbsoluteFill>
  );
};
