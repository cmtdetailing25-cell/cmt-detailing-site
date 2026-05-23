import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Img,
  Video,
} from "remotion";
import type { CMTReelProps, MediaItem } from "./types";

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:      "#151b23",
  primary: "#e9f0ef",
  muted:   "#708289",
  subtle:  "#434e56",
  accent:  "#94b2b6",
  black:   "#000000",
};

const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

// ── Timing (30 fps, 15 s = 450 frames) ───────────────────────────────────────

const HOOK_IN    = 0;
const HOOK_DUR   = 60;   // 0 – 2 s

const BEFORE_IN  = 60;
const BEFORE_DUR = 120;  // 2 – 6 s

const PROC_IN    = 180;
const PROC_DUR   = 150;  // 6 – 11 s

const AFTER_IN   = 330;
const AFTER_DUR  = 90;   // 11 – 14 s

const CTA_IN     = 420;
const CTA_DUR    = 30;   // 14 – 15 s

// ── Animation helpers ─────────────────────────────────────────────────────────

function fadeIn(frame: number, dur = 18): number {
  return interpolate(frame, [0, dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function fadeOut(frame: number, total: number, dur = 18): number {
  return interpolate(frame, [total - dur, total], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function riseY(frame: number, fps: number, distance = 36): number {
  return spring({
    frame,
    fps,
    config: { damping: 180, stiffness: 90, mass: 1 },
    from: distance,
    to: 0,
  });
}

function scaleIn(frame: number, fps: number): number {
  return spring({
    frame,
    fps,
    config: { damping: 200, stiffness: 80, mass: 1 },
    from: 1.06,
    to: 1,
  });
}

// ── Placeholder panel (used when media array is empty) ────────────────────────

function Placeholder({ label }: { label: string }) {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, #1c2530 0%, ${C.bg} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Subtle grid lines */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(148,178,182,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,178,182,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />
      <div
        style={{
          border: `1px solid ${C.subtle}`,
          borderRadius: 6,
          padding: "28px 60px",
          textAlign: "center",
          position: "relative",
        }}
      >
        <p
          style={{
            fontFamily: FONT,
            color: C.muted,
            fontSize: 22,
            letterSpacing: 5,
            textTransform: "uppercase",
            margin: 0,
            fontWeight: 300,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: FONT,
            color: C.subtle,
            fontSize: 14,
            letterSpacing: 2,
            textTransform: "uppercase",
            margin: "10px 0 0",
            fontWeight: 300,
          }}
        >
          No media attached
        </p>
      </div>
    </AbsoluteFill>
  );
}

// ── Single media item renderer ────────────────────────────────────────────────

function MediaFrame({ item, scale = 1 }: { item: MediaItem; scale?: number }) {
  const style: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transform: `scale(${scale})`,
    transformOrigin: "center center",
  };

  if (item.type === "video") {
    return <Video src={item.url} style={style} />;
  }
  return <Img src={item.url} style={style} />;
}

// ── Hook segment (0 – 2 s) ────────────────────────────────────────────────────

function HookSegment({ hook }: { hook: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity  = fadeIn(frame, 20) * fadeOut(frame, HOOK_DUR, 20);
  const y        = riseY(frame, fps, 50);
  const brandY   = riseY(frame, fps, 30);
  const lineW    = interpolate(frame, [0, 30], [0, 52], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT }}>
      {/* Ambient glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 45%, rgba(148,178,182,0.07) 0%, transparent 70%)`,
        }}
      />
      {/* Subtle grid */}
      <AbsoluteFill
        style={{
          backgroundImage: `
            linear-gradient(rgba(148,178,182,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148,178,182,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Content */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 90px",
          gap: 40,
          opacity,
        }}
      >
        {/* Brand row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            transform: `translateY(${brandY}px)`,
          }}
        >
          <div
            style={{
              width: lineW,
              height: 1,
              background: C.accent,
            }}
          />
          <p
            style={{
              color: C.accent,
              fontSize: 16,
              letterSpacing: 8,
              textTransform: "uppercase",
              fontWeight: 400,
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            CMT Detailing
          </p>
          <div
            style={{
              width: lineW,
              height: 1,
              background: C.accent,
            }}
          />
        </div>

        {/* Hook text */}
        <p
          style={{
            color: C.primary,
            fontSize: 64,
            fontWeight: 700,
            lineHeight: 1.15,
            textAlign: "center",
            margin: 0,
            transform: `translateY(${y}px)`,
            letterSpacing: -1,
          }}
        >
          {hook || "See the transformation"}
        </p>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── Media segment (Before / Process / After) ──────────────────────────────────

interface MediaSegmentProps {
  items:            MediaItem[];
  label:            string;
  sublabel?:        string;
  durationInFrames: number;
  accentColor?:     string;
}

function MediaSegment({ items, label, sublabel, durationInFrames, accentColor = C.accent }: MediaSegmentProps) {
  const frame     = useCurrentFrame();
  const { fps }   = useVideoConfig();
  const hasMedia  = items.length > 0;

  const photoOpacity = fadeIn(frame, 24) * fadeOut(frame, durationInFrames, 24);
  const photoScale   = scaleIn(frame, fps);
  const labelOpacity = fadeIn(frame, 28);
  const labelY       = riseY(frame, fps, 40);
  const barW         = interpolate(frame, [8, 40], [0, 64], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* Media layer with subtle Ken Burns zoom */}
      <AbsoluteFill style={{ opacity: photoOpacity }}>
        {hasMedia ? (
          <MediaFrame item={items[0]} scale={photoScale} />
        ) : (
          <Placeholder label={label} />
        )}
      </AbsoluteFill>

      {/* Cinematic vignette — top and bottom */}
      <AbsoluteFill
        style={{
          background: `
            linear-gradient(to bottom,
              rgba(21,27,35,0.72) 0%,
              rgba(21,27,35,0.15) 22%,
              transparent 40%,
              transparent 55%,
              rgba(21,27,35,0.30) 75%,
              rgba(21,27,35,0.88) 100%
            )
          `,
        }}
      />

      {/* Label block — bottom of frame */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 72px 120px",
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
          fontFamily: FONT,
        }}
      >
        {sublabel && (
          <p
            style={{
              color: accentColor,
              fontSize: 15,
              letterSpacing: 6,
              textTransform: "uppercase",
              margin: "0 0 10px",
              fontWeight: 400,
            }}
          >
            {sublabel}
          </p>
        )}
        <p
          style={{
            color: C.primary,
            fontSize: 52,
            fontWeight: 700,
            letterSpacing: 2,
            textTransform: "uppercase",
            margin: 0,
            lineHeight: 1,
          }}
        >
          {label}
        </p>
        <div
          style={{
            width: barW,
            height: 2,
            background: accentColor,
            borderRadius: 1,
            marginTop: 20,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

// ── CTA segment (14 – 15 s) ───────────────────────────────────────────────────

function CTASegment({ cta }: { cta: string }) {
  const frame   = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = fadeIn(frame, 16);
  const y       = riseY(frame, fps, 30);

  return (
    <AbsoluteFill
      style={{
        background: C.bg,
        fontFamily: FONT,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        opacity,
      }}
    >
      {/* Ambient glow */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 50% at 50% 50%, rgba(148,178,182,0.09) 0%, transparent 65%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
          padding: "0 80px",
          transform: `translateY(${y}px)`,
          position: "relative",
        }}
      >
        {/* Brand */}
        <p
          style={{
            color: C.accent,
            fontSize: 17,
            letterSpacing: 8,
            textTransform: "uppercase",
            margin: 0,
            fontWeight: 400,
          }}
        >
          CMT Detailing
        </p>

        {/* Divider */}
        <div style={{ width: 40, height: 1, background: C.subtle }} />

        {/* CTA headline */}
        <p
          style={{
            color: C.primary,
            fontSize: 56,
            fontWeight: 700,
            textAlign: "center",
            margin: 0,
            lineHeight: 1.2,
            letterSpacing: -0.5,
          }}
        >
          {cta || "Book your mobile detail"}
        </p>

        {/* Location */}
        <p
          style={{
            color: C.muted,
            fontSize: 22,
            letterSpacing: 3,
            textTransform: "uppercase",
            margin: "4px 0 0",
            fontWeight: 300,
          }}
        >
          Taunton, MA
        </p>
      </div>
    </AbsoluteFill>
  );
}

// ── Root composition ──────────────────────────────────────────────────────────

export function CMTBeforeAfterReel({ hook, cta, media }: CMTReelProps) {
  const beforeItems  = media?.before   ?? [];
  const processItems = media?.process  ?? [];
  const afterItems   = media?.after    ?? [];

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      {/* 0 – 2 s: Hook */}
      <Sequence from={HOOK_IN} durationInFrames={HOOK_DUR}>
        <HookSegment hook={hook} />
      </Sequence>

      {/* 2 – 6 s: Before */}
      <Sequence from={BEFORE_IN} durationInFrames={BEFORE_DUR}>
        <MediaSegment
          items={beforeItems}
          label="Before"
          sublabel="The starting point"
          durationInFrames={BEFORE_DUR}
          accentColor={C.muted}
        />
      </Sequence>

      {/* 6 – 11 s: Detailing Process */}
      <Sequence from={PROC_IN} durationInFrames={PROC_DUR}>
        <MediaSegment
          items={processItems}
          label="Detailing Process"
          durationInFrames={PROC_DUR}
          accentColor={C.accent}
        />
      </Sequence>

      {/* 11 – 14 s: Final Reveal */}
      <Sequence from={AFTER_IN} durationInFrames={AFTER_DUR}>
        <MediaSegment
          items={afterItems}
          label="Final Reveal"
          sublabel="The result"
          durationInFrames={AFTER_DUR}
          accentColor={C.primary}
        />
      </Sequence>

      {/* 14 – 15 s: CTA */}
      <Sequence from={CTA_IN} durationInFrames={CTA_DUR}>
        <CTASegment cta={cta} />
      </Sequence>
    </AbsoluteFill>
  );
}
