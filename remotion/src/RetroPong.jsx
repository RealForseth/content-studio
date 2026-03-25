import { useCurrentFrame, interpolate, Easing } from "remotion";

// Pre-defined bounce points for the ball path
const BOUNCES = [
  { x: 960, y: 540, frame: 0 },
  { x: 1800, y: 720, frame: 55 },
  { x: 120, y: 200, frame: 120 },
  { x: 1800, y: 820, frame: 185 },
  { x: 120, y: 380, frame: 255 },
  { x: 1800, y: 280, frame: 320 },
  { x: 120, y: 700, frame: 390 },
  { x: 1800, y: 350, frame: 455 },
  { x: 120, y: 550, frame: 520 },
  { x: 960, y: 400, frame: 540 },
];

// Wall bounce Y reflections within segments
const WALL_BOUNCES = [];
for (let i = 0; i < BOUNCES.length - 1; i++) {
  const a = BOUNCES[i];
  const b = BOUNCES[i + 1];
  const midFrame = Math.round((a.frame + b.frame) / 2);
  // Add a wall bounce in the middle of long segments for realism
  if (b.frame - a.frame > 50) {
    const midX = (a.x + b.x) / 2;
    // Bounce off top or bottom
    const midY = a.y < 400 ? 60 : 1020;
    WALL_BOUNCES.push({ segIndex: i, x: midX, y: midY, frame: midFrame });
  }
}

// Custom easing: fast near endpoints (paddles), slow in middle
function speedRampEasing(t) {
  // Accelerate near 0 and 1, decelerate in middle
  // Using a sine-based curve that's fast at edges
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}

function getBallPosition(frame) {
  // Find current segment
  for (let i = 0; i < BOUNCES.length - 1; i++) {
    const a = BOUNCES[i];
    const b = BOUNCES[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const segDuration = b.frame - a.frame;
      const localProgress = (frame - a.frame) / segDuration;
      // Speed ramp easing
      const eased = speedRampEasing(localProgress);
      return {
        x: a.x + (b.x - a.x) * eased,
        y: a.y + (b.y - a.y) * eased,
        segment: i,
        progress: localProgress,
      };
    }
  }
  // Before first or after last
  if (frame <= BOUNCES[0].frame) return { x: BOUNCES[0].x, y: BOUNCES[0].y, segment: 0, progress: 0 };
  const last = BOUNCES[BOUNCES.length - 1];
  return { x: last.x, y: last.y, segment: BOUNCES.length - 2, progress: 1 };
}

function isNearPaddle(frame, threshold = 8) {
  for (let i = 0; i < BOUNCES.length; i++) {
    const b = BOUNCES[i];
    if (i === 0 || i === BOUNCES.length - 1) continue;
    if (Math.abs(frame - b.frame) < threshold) {
      return { bounce: b, dist: Math.abs(frame - b.frame), index: i };
    }
  }
  return null;
}

// Paddle positions: track ball Y with smooth lag
function getPaddleY(frame, side) {
  // Look ahead slightly to where ball will be
  const lookAhead = 15;
  const futureFrame = Math.min(frame + lookAhead, 539);
  const ballPos = getBallPosition(futureFrame);
  const currentBallPos = getBallPosition(frame);

  // Only track when ball is moving toward this paddle
  const isApproaching =
    (side === "left" && currentBallPos.x < 960) ||
    (side === "right" && currentBallPos.x > 960);

  const targetY = isApproaching ? ballPos.y : currentBallPos.y;

  // Smooth with interpolation across frames (approximate with spring-like behavior)
  return targetY;
}

// Dust particles
const DUST_PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  x: Math.sin(i * 7.3) * 900 + 960,
  y: Math.cos(i * 4.1) * 500 + 540,
  size: 1 + Math.random() * 2.5,
  speed: 0.15 + Math.random() * 0.3,
  opacity: 0.15 + Math.random() * 0.35,
  drift: Math.sin(i * 2.7) * 0.5,
}));

// Scratch lines
const SCRATCHES = Array.from({ length: 8 }, (_, i) => ({
  x1: Math.sin(i * 3.7) * 800 + 960,
  y1: Math.cos(i * 2.3) * 400 + 200,
  x2: Math.sin(i * 3.7) * 800 + 960 + (Math.random() - 0.5) * 200,
  y2: Math.cos(i * 2.3) * 400 + 200 + 300 + Math.random() * 300,
  opacity: 0.04 + Math.random() * 0.06,
  width: 0.5 + Math.random() * 1,
}));

export const RetroPong = () => {
  const frame = useCurrentFrame();

  const ball = getBallPosition(frame);
  const impact = isNearPaddle(frame, 8);

  // Impact glow multiplier
  const glowMultiplier = impact
    ? interpolate(impact.dist, [0, 8], [2.5, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 1;

  // Screen shake on impact
  const shakeIntensity = impact
    ? interpolate(impact.dist, [0, 6], [6, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;
  const shakeX = shakeIntensity * Math.sin(frame * 13) * 0.7;
  const shakeY = shakeIntensity * Math.cos(frame * 17) * 0.7;

  // Ball squash & stretch on impact
  const squashFactor = impact
    ? interpolate(impact.dist, [0, 6], [0.35, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  // Determine squash direction based on which paddle
  const squashAngle = ball.x > 960 ? 0 : 180;
  const ballScaleX = 1 - squashFactor * 0.4;
  const ballScaleY = 1 + squashFactor * 0.3;

  // Impact flash
  const flashOpacity = impact
    ? interpolate(impact.dist, [0, 5], [0.3, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : 0;

  // Paddle positions
  const leftPaddleY = getPaddleY(frame, "left");
  const rightPaddleY = getPaddleY(frame, "right");

  // Film grain seed changes per frame
  const grainSeed = frame * 3.7;

  // Scan line animation
  const scanOffset = (frame * 0.5) % 4;

  return (
    <div
      style={{
        width: 1920,
        height: 1080,
        overflow: "hidden",
        position: "relative",
        background: "radial-gradient(ellipse at center, #1a1a3a 0%, #111130 40%, #0a0a15 100%)",
      }}
    >
      {/* SVG Filters */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          {/* Film grain filter */}
          <filter id="grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              seed={Math.floor(grainSeed)}
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="overlay" />
          </filter>

          {/* Noise texture for smudges */}
          <filter id="smudge">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.015"
              numOctaves="4"
              seed={42}
              result="noise"
            />
            <feColorMatrix
              in="noise"
              type="saturate"
              values="0"
              result="bwNoise"
            />
            <feComponentTransfer in="bwNoise" result="smudgeAlpha">
              <feFuncA type="linear" slope="0.12" intercept="-0.02" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="smudgeAlpha" mode="screen" />
          </filter>

          {/* Glow filter for elements */}
          <filter id="elementGlow" x="-100%" y="-100%" width="300%" height="300%">
            {/* Inner glow */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="innerBlur" />
            <feFlood floodColor="#FFFFFF" floodOpacity={0.9 * glowMultiplier} result="innerColor" />
            <feComposite in="innerColor" in2="innerBlur" operator="in" result="innerGlow" />

            {/* Mid glow */}
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="midBlur" />
            <feFlood floodColor="#FFFDE0" floodOpacity={0.5 * glowMultiplier} result="midColor" />
            <feComposite in="midColor" in2="midBlur" operator="in" result="midGlow" />

            {/* Outer glow */}
            <feGaussianBlur in="SourceGraphic" stdDeviation={50 * glowMultiplier} result="outerBlur" />
            <feFlood floodColor="#FFE4B5" floodOpacity={0.25 * glowMultiplier} result="outerColor" />
            <feComposite in="outerColor" in2="outerBlur" operator="in" result="outerGlow" />

            {/* Merge all layers */}
            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="midGlow" />
              <feMergeNode in="innerGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Ball glow - separate so we can control independently */}
          <filter id="ballGlow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="innerBlur" />
            <feFlood floodColor="#FFFFFF" floodOpacity={0.95 * glowMultiplier} result="innerColor" />
            <feComposite in="innerColor" in2="innerBlur" operator="in" result="innerGlow" />

            <feGaussianBlur in="SourceGraphic" stdDeviation="15" result="midBlur" />
            <feFlood floodColor="#FFFDE0" floodOpacity={0.6 * glowMultiplier} result="midColor" />
            <feComposite in="midColor" in2="midBlur" operator="in" result="midGlow" />

            <feGaussianBlur in="SourceGraphic" stdDeviation={40 * glowMultiplier} result="outerBlur" />
            <feFlood floodColor="#FFE4B5" floodOpacity={0.3 * glowMultiplier} result="outerColor" />
            <feComposite in="outerColor" in2="outerBlur" operator="in" result="outerGlow" />

            <feMerge>
              <feMergeNode in="outerGlow" />
              <feMergeNode in="midGlow" />
              <feMergeNode in="innerGlow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      {/* Game layer with shake */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          transform: `translate(${shakeX}px, ${shakeY}px)`,
        }}
      >
        {/* Center line (dashed) */}
        <div
          style={{
            position: "absolute",
            left: 959,
            top: 0,
            width: 2,
            height: 1080,
            background: "repeating-linear-gradient(to bottom, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 15px, transparent 15px, transparent 30px)",
          }}
        />

        {/* Left paddle */}
        <div
          style={{
            position: "absolute",
            left: 80,
            top: leftPaddleY - 60,
            width: 18,
            height: 120,
            borderRadius: 6,
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,253,224,0.5) 50%, rgba(255,228,181,0.15) 100%)",
            filter: "url(#elementGlow)",
            transition: "top 0.08s ease-out",
          }}
        />

        {/* Right paddle */}
        <div
          style={{
            position: "absolute",
            left: 1822,
            top: rightPaddleY - 60,
            width: 18,
            height: 120,
            borderRadius: 6,
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.85) 0%, rgba(255,253,224,0.5) 50%, rgba(255,228,181,0.15) 100%)",
            filter: "url(#elementGlow)",
            transition: "top 0.08s ease-out",
          }}
        />

        {/* Ball */}
        <div
          style={{
            position: "absolute",
            left: ball.x - 25,
            top: ball.y - 25,
            width: 50,
            height: 50,
            borderRadius: "50%",
            background: "radial-gradient(circle at 40% 35%, rgba(255,255,255,0.95) 0%, rgba(255,253,224,0.7) 40%, rgba(255,228,181,0.2) 80%, transparent 100%)",
            filter: "url(#ballGlow)",
            transform: `scaleX(${ballScaleX}) scaleY(${ballScaleY})`,
          }}
        />

        {/* Ball trail (subtle) */}
        {[1, 2, 3, 4].map((i) => {
          const trailFrame = Math.max(0, frame - i * 2);
          const trailPos = getBallPosition(trailFrame);
          const trailOpacity = interpolate(i, [1, 4], [0.15, 0.03]);
          const trailSize = interpolate(i, [1, 4], [40, 20]);
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: trailPos.x - trailSize / 2,
                top: trailPos.y - trailSize / 2,
                width: trailSize,
                height: trailSize,
                borderRadius: "50%",
                background: `radial-gradient(circle, rgba(255,253,224,${trailOpacity}) 0%, transparent 70%)`,
                pointerEvents: "none",
              }}
            />
          );
        })}
      </div>

      {/* Impact flash overlay */}
      {flashOpacity > 0 && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 1920,
            height: 1080,
            background: `radial-gradient(circle at ${ball.x}px ${ball.y}px, rgba(255,255,255,${flashOpacity}) 0%, transparent 40%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Fingerprint smudges / noise overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          filter: "url(#smudge)",
          mixBlendMode: "screen",
          opacity: 0.1,
          pointerEvents: "none",
        }}
      />

      {/* Film grain overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          filter: "url(#grain)",
          mixBlendMode: "overlay",
          opacity: 0.06,
          pointerEvents: "none",
        }}
      />

      {/* Scan lines */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          background: `repeating-linear-gradient(to bottom, transparent 0px, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)`,
          backgroundPositionY: scanOffset,
          pointerEvents: "none",
          mixBlendMode: "multiply",
        }}
      />

      {/* Dust particles */}
      {DUST_PARTICLES.map((p, i) => {
        const px = ((p.x + frame * p.drift + frame * 0.1) % 2000) - 40;
        const py = ((p.y - frame * p.speed) % 1140);
        const adjustedPy = py < 0 ? py + 1140 : py;
        const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.08 + i * 1.7);
        return (
          <div
            key={`dust-${i}`}
            style={{
              position: "absolute",
              left: px,
              top: adjustedPy,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              background: `rgba(255, 255, 240, ${p.opacity * twinkle})`,
              boxShadow: `0 0 ${p.size * 2}px rgba(255, 255, 240, ${p.opacity * twinkle * 0.5})`,
              pointerEvents: "none",
            }}
          />
        );
      })}

      {/* Scratches */}
      <svg
        width="1920"
        height="1080"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      >
        {SCRATCHES.map((s, i) => (
          <line
            key={`scratch-${i}`}
            x1={s.x1}
            y1={s.y1}
            x2={s.x2}
            y2={s.y2}
            stroke={`rgba(255, 255, 255, ${s.opacity})`}
            strokeWidth={s.width}
          />
        ))}
      </svg>

      {/* Vignette overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1920,
          height: 1080,
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
