/**
 * ThankView-style envelope preview.
 *
 * Two modes:
 *   "thumbnail" — stacked pair (back open + front closed), used in grid cards
 *   "front"     — single full-size front face, used in builder & detail previews
 */

// ── Types ──────────────────────────────────────────────────────────────────
export interface EnvelopePreviewProps {
  /** Envelope body colour */
  envelopeColor: string;
  /** Liner colour visible inside the open flap */
  linerColor: string;
  /** Decorative pattern on the body */
  frontDesign?: "none" | "swoops" | "stripes";
  /** Swoop sub-variant */
  swoopVariant?: "single" | "double";
  /** Stripe sub-variant */
  stripeVariant?: "single" | "double" | "triple" | "airmail";
  /** Colour used for the front-design overlay */
  frontDesignColor?: string;
  /** Brand colours */
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor?: string;
  /** Stamp style */
  stampSelection?: "classic" | "forever" | "university" | "heart";
  /** Postmark / stamp accent colour */
  postmarkColor?: string;
  /** Front-left logo glyph */
  frontLeftLogo?: "none" | "shield" | "wordmark" | "seal";
  /** Recipient-name text colour */
  recipientNameColor?: string;
  /** Show recipient name? (front mode only) */
  showName?: boolean;
  /** Display mode: "thumbnail" = stacked pair; "front" = single face */
  mode?: "thumbnail" | "front";
  /** Width override (height auto-scales). Default 200 for thumbnail, 400 for front. */
  width?: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function contrast(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#333" : "#fff";
}

/** Slightly shift a hex colour toward white / black. */
function adjust(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const r = clamp(parseInt(h.substring(0, 2), 16) + amount);
  const g = clamp(parseInt(h.substring(2, 4), 16) + amount);
  const b = clamp(parseInt(h.substring(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ── Sub-pieces (pure SVG, no html overlays) ─────────────────────────────────

/** Wavy cancellation lines + circular postmark, drawn left of the stamp. */
function CancellationMarks({ x, y, w, h, color }: { x: number; y: number; w: number; h: number; color: string }) {
  const lines = 5;
  const gap = h / (lines + 1);
  return (
    <g opacity={0.5}>
      {/* Circle postmark */}
      <circle cx={x + w * 0.22} cy={y + h * 0.5} r={h * 0.32} fill="none" stroke={color} strokeWidth={1.2} />
      <circle cx={x + w * 0.22} cy={y + h * 0.5} r={h * 0.2} fill="none" stroke={color} strokeWidth={0.8} />
      {/* Wavy lines */}
      {Array.from({ length: lines }).map((_, i) => {
        const ly = y + gap * (i + 1);
        const amp = h * 0.04;
        const seg = w * 0.12;
        let d = `M${x + w * 0.42} ${ly}`;
        for (let s = 0; s < 5; s++) {
          const sx = x + w * 0.42 + seg * s;
          d += ` Q${sx + seg * 0.25} ${ly + (s % 2 === 0 ? -amp : amp)} ${sx + seg * 0.5} ${ly}`;
        }
        return <path key={i} d={d} fill="none" stroke={color} strokeWidth={1} />;
      })}
    </g>
  );
}

/** Simple postage-stamp rectangle with perforated-style edge and inner icon area. */
function Stamp({
  x, y, w, h, accentColor, stampType = "classic",
}: { x: number; y: number; w: number; h: number; accentColor: string; stampType?: string }) {
  const pad = 2;
  const innerH = h - pad * 2 - 6;
  const cx = x + w / 2;
  const cy = y + pad + innerH / 2;

  // Stamp icon varies by type
  let stampInner: React.ReactNode = null;
  switch (stampType) {
    case "classic":
      // Column/pillar icon
      stampInner = (
        <g>
          <rect x={cx - 4} y={cy + innerH * 0.15} width={8} height={innerH * 0.35} fill="white" opacity={0.8} />
          <path d={`M${cx - 6} ${cy - innerH * 0.25} L${cx} ${cy - innerH * 0.4} L${cx + 6} ${cy - innerH * 0.25} Z`} fill="white" opacity={0.8} />
          <rect x={cx - 6} y={cy + innerH * 0.15} width={12} height={2} fill="white" opacity={0.6} />
          <rect x={cx - 2} y={cy - innerH * 0.25} width={4} height={innerH * 0.4} fill="white" opacity={0.5} />
        </g>
      );
      break;
    case "forever":
      // Circular arrow / infinity feel
      stampInner = (
        <g>
          <circle cx={cx} cy={cy} r={innerH * 0.28} fill="none" stroke="white" strokeWidth={1.5} opacity={0.8} />
          <path d={`M${cx - 3} ${cy - 1} L${cx + 3} ${cy - 1} L${cx + 1} ${cy - 4} Z`} fill="white" opacity={0.8} />
          <text x={cx} y={cy + 2} textAnchor="middle" fontSize={4} fontWeight={700} fill="white" opacity={0.9}>∞</text>
        </g>
      );
      break;
    case "university":
      // Graduation cap / crest
      stampInner = (
        <g>
          <path d={`M${cx} ${cy - innerH * 0.3} L${cx - 7} ${cy - innerH * 0.05} L${cx} ${cy + innerH * 0.1} L${cx + 7} ${cy - innerH * 0.05} Z`} fill="white" opacity={0.8} />
          <line x1={cx} y1={cy + innerH * 0.1} x2={cx} y2={cy + innerH * 0.35} stroke="white" strokeWidth={0.8} opacity={0.7} />
          <circle cx={cx} cy={cy + innerH * 0.35} r={1.5} fill="white" opacity={0.7} />
        </g>
      );
      break;
    case "heart":
      stampInner = (
        <g>
          <path
            d={`M${cx} ${cy + innerH * 0.25} C${cx - 10} ${cy - innerH * 0.1} ${cx - 6} ${cy - innerH * 0.4} ${cx} ${cy - innerH * 0.1} C${cx + 6} ${cy - innerH * 0.4} ${cx + 10} ${cy - innerH * 0.1} ${cx} ${cy + innerH * 0.25} Z`}
            fill="white"
            opacity={0.8}
          />
        </g>
      );
      break;
  }

  return (
    <g>
      {/* White stamp body */}
      <rect x={x} y={y} width={w} height={h} rx={1.5} fill="white" />
      {/* Perforated edge */}
      <rect x={x} y={y} width={w} height={h} rx={1.5} fill="none" stroke="#ccc" strokeWidth={0.8} strokeDasharray="2 1.5" />
      {/* Coloured inner area */}
      <rect x={x + pad} y={y + pad} width={w - pad * 2} height={innerH} rx={1} fill={accentColor} opacity={0.85} />
      {/* Stamp icon */}
      {stampInner}
      {/* Label text at bottom */}
      <text x={x + w / 2} y={y + h - 2.5} textAnchor="middle" fontSize={3.5} fontWeight={600} fill="#999" letterSpacing={0.3}>
        {stampType === "forever" ? "FOREVER" : stampType === "heart" ? "LOVE" : "FIRST CLASS"}
      </text>
    </g>
  );
}

/** Small logo placeholder glyph. */
function LogoMark({ x, y, size, color }: { x: number; y: number; size: number; color: string }) {
  const fg = contrast(color);
  return (
    <g>
      <path
        d={`M${x + size / 2} ${y} L${x} ${y + size * 0.35} V${y + size} H${x + size} V${y + size * 0.35} Z`}
        fill={color}
        stroke={fg}
        strokeWidth={0.6}
        opacity={0.9}
      />
      <text x={x + size / 2} y={y + size * 0.7} textAnchor="middle" fontSize={size * 0.38} fontWeight={700} fill={fg}>
        H
      </text>
    </g>
  );
}

/** Single decorative swoop at envelope bottom. */
function SingleSwoosh({
  y, w, h, color,
}: { y: number; w: number; h: number; color: string }) {
  return (
    <g>
      <path
        d={`M0 ${y + h * 0.5} Q${w * 0.3} ${y} ${w * 0.55} ${y + h * 0.35} T${w} ${y + h * 0.15} V${y + h} H0 Z`}
        fill={color}
      />
    </g>
  );
}

/** Double decorative swoop at envelope bottom. */
function DoubleSwoosh({
  y, w, h, color1, color2,
}: { y: number; w: number; h: number; color1: string; color2: string }) {
  return (
    <g>
      {/* Back band (secondary colour) */}
      <path
        d={`M0 ${y + h * 0.4} Q${w * 0.3} ${y} ${w * 0.55} ${y + h * 0.3} T${w} ${y + h * 0.1} V${y + h} H0 Z`}
        fill={color2}
      />
      {/* Front wave (design colour, overlapping) */}
      <path
        d={`M0 ${y + h * 0.55} Q${w * 0.25} ${y + h * 0.15} ${w * 0.5} ${y + h * 0.45} T${w} ${y + h * 0.25} V${y + h} H0 Z`}
        fill={color1}
        opacity={0.75}
      />
    </g>
  );
}

/** Stripe patterns for front design. */
function StripesOverlay({
  vw, vh, color, variant,
}: { vw: number; vh: number; color: string; variant: string }) {
  switch (variant) {
    case "single":
      return (
        <g>
          <rect x={0} y={vh - 12} width={vw} height={12} fill={color} opacity={0.7} />
        </g>
      );
    case "double":
      return (
        <g>
          <rect x={0} y={vh - 20} width={vw} height={8} fill={color} opacity={0.5} />
          <rect x={0} y={vh - 8} width={vw} height={8} fill={color} opacity={0.7} />
        </g>
      );
    case "triple":
      return (
        <g>
          <rect x={0} y={vh - 30} width={vw} height={8} fill={color} opacity={0.35} />
          <rect x={0} y={vh - 19} width={vw} height={8} fill={color} opacity={0.55} />
          <rect x={0} y={vh - 8} width={vw} height={8} fill={color} opacity={0.75} />
        </g>
      );
    case "airmail":
      // Classic red/blue alternating diagonal stripes along top and bottom edges
      return (
        <g>
          {/* Top border */}
          {Array.from({ length: 30 }).map((_, i) => {
            const sw = 16;
            const x = i * sw - 4;
            const fillColor = i % 2 === 0 ? "#dc2626" : "#1d4ed8";
            return <rect key={`t-${i}`} x={x} y={0} width={sw / 2} height={8} fill={fillColor} opacity={0.7} />;
          })}
          {/* Bottom border */}
          {Array.from({ length: 30 }).map((_, i) => {
            const sw = 16;
            const x = i * sw - 4;
            const fillColor = i % 2 === 0 ? "#dc2626" : "#1d4ed8";
            return <rect key={`b-${i}`} x={x} y={vh - 8} width={sw / 2} height={8} fill={fillColor} opacity={0.7} />;
          })}
        </g>
      );
    default:
      return null;
  }
}

// ── Thumbnail mode: two envelopes side by side ─────────────────────────────

function ThumbnailEnvelope({
  envelopeColor,
  linerColor,
  stampColor,
  stampType,
  frontLeftLogo,
  primaryColor,
  width,
}: {
  envelopeColor: string;
  linerColor: string;
  stampColor: string;
  stampType: string;
  frontLeftLogo: string;
  primaryColor: string;
  width: number;
}) {
  // Viewbox: two envelopes side-by-side with a gap
  const vw = 260;
  const vh = 100;
  const aspect = vh / vw;

  // Envelope dimensions (same size for both)
  const ew = 116;
  const eh = 76;
  const gap = 12;

  // ── Left envelope: back / open (showing liner inside flap) ──
  const lx = 6;
  const ly = 20;
  const flapTip = ly - 18;

  // ── Right envelope: front / closed (stamp + cancellation) ──
  const rx = lx + ew + gap;
  const ry = ly;

  // Stamp on right envelope
  const stW = 16;
  const stH = 20;
  const stX = rx + ew - stW - 5;
  const stY = ry + 5;

  // Cancellation marks
  const cmW = 24;
  const cmH = 20;
  const cmX = stX - cmW - 1;
  const cmY = stY;

  return (
    <svg
      width={width}
      height={width * aspect}
      viewBox={`0 0 ${vw} ${vh}`}
      style={{ display: "block" }}
    >
      {/* ── Left: open envelope (back view) ────────────────── */}
      <rect x={lx} y={ly} width={ew} height={eh} rx={3} fill={envelopeColor} />

      {/* Liner visible inside body (V shape) */}
      <path
        d={`M${lx + 2} ${ly} L${lx + ew / 2} ${ly + eh * 0.48} L${lx + ew - 2} ${ly} Z`}
        fill={linerColor}
      />

      {/* Open flap (folded backward above body) */}
      <path
        d={`M${lx + 2} ${ly + 1} L${lx + ew / 2} ${flapTip} L${lx + ew - 2} ${ly + 1} Z`}
        fill={adjust(envelopeColor, 18)}
      />
      {/* Fold shadow */}
      <line x1={lx + 3} y1={ly + 1} x2={lx + ew - 3} y2={ly + 1} stroke="rgba(0,0,0,0.15)" strokeWidth={0.8} />

      {/* ── Right: closed envelope (front view) ────────────── */}
      <rect x={rx} y={ry} width={ew} height={eh} rx={3} fill={envelopeColor} />

      {/* Subtle bottom-flap fold */}
      <path
        d={`M${rx + 2} ${ry + eh} L${rx + ew / 2} ${ry + eh * 0.68} L${rx + ew - 2} ${ry + eh} Z`}
        fill={adjust(envelopeColor, -12)}
        opacity={0.4}
      />

      {/* Stamp */}
      <Stamp x={stX} y={stY} w={stW} h={stH} accentColor={stampColor} stampType={stampType} />

      {/* Cancellation marks */}
      <CancellationMarks x={cmX} y={cmY} w={cmW} h={cmH} color={contrast(envelopeColor)} />

      {/* Logo on front envelope */}
      {frontLeftLogo !== "none" && (
        <LogoMark x={rx + 6} y={ry + 7} size={14} color={primaryColor} />
      )}
    </svg>
  );
}

// ── Front mode: single full-size envelope face ─────────────────────────────

function FrontEnvelope({
  envelopeColor,
  linerColor: _linerColor,
  frontDesign,
  swoopVariant,
  stripeVariant,
  frontDesignColor,
  primaryColor,
  secondaryColor,
  tertiaryColor,
  stampColor,
  stampType,
  frontLeftLogo,
  recipientNameColor,
  showName,
  width,
}: {
  envelopeColor: string;
  linerColor: string;
  frontDesign: string;
  swoopVariant: string;
  stripeVariant: string;
  frontDesignColor: string;
  primaryColor: string;
  secondaryColor: string;
  tertiaryColor?: string;
  stampColor: string;
  stampType: string;
  frontLeftLogo: string;
  recipientNameColor: string;
  showName: boolean;
  width: number;
}) {
  const vw = 400;
  const vh = 260;
  const aspect = vh / vw;

  // Paper background tint (slightly off-white for realism, unless envelope is coloured)
  const isLight = (() => {
    const h = envelopeColor.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 200;
  })();
  const paperBg = isLight ? "#f9f8f6" : envelopeColor;
  const textColor = contrast(paperBg);

  // Stamp
  const stW = 36; const stH = 44;
  const stX = vw - stW - 20;
  const stY = 16;

  // Cancellation marks
  const cmW = 54; const cmH = 40;
  const cmX = stX - cmW - 4;
  const cmY = stY + 2;

  // Bottom swoosh area
  const swooshH = 52;
  const swooshY = vh - swooshH;

  return (
    <svg
      width={width}
      height={width * aspect}
      viewBox={`0 0 ${vw} ${vh}`}
      style={{ display: "block", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
    >
      {/* Paper background */}
      <rect x={0} y={0} width={vw} height={vh} fill={paperBg} />

      {/* Subtle paper grain texture */}
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" />
        <feColorMatrix type="saturate" values="0" in="noise" result="gray" />
        <feBlend in="SourceGraphic" in2="gray" mode="multiply" />
      </filter>
      <rect x={0} y={0} width={vw} height={vh} fill={paperBg} filter="url(#grain)" opacity={0.15} />

      {/* Front design overlay — stripes */}
      {frontDesign === "stripes" && (
        <StripesOverlay vw={vw} vh={vh} color={frontDesignColor} variant={stripeVariant} />
      )}

      {/* Front design overlay — swoops */}
      {frontDesign === "swoops" && swoopVariant === "single" && (
        <SingleSwoosh y={swooshY} w={vw} h={swooshH} color={frontDesignColor} />
      )}
      {frontDesign === "swoops" && swoopVariant === "double" && (
        <DoubleSwoosh y={swooshY} w={vw} h={swooshH} color1={frontDesignColor} color2={secondaryColor} />
      )}

      {/* When no front design, show thin brand-colour stripe at very bottom */}
      {frontDesign === "none" && (
        <g>
          <rect x={0} y={vh - 6} width={vw / 3} height={6} fill={primaryColor} />
          <rect x={vw / 3} y={vh - 6} width={vw / 3} height={6} fill={secondaryColor} />
          <rect x={(vw / 3) * 2} y={vh - 6} width={vw / 3} height={6} fill={tertiaryColor ?? primaryColor} />
        </g>
      )}

      {/* Thin border */}
      <rect x={0} y={0} width={vw} height={vh} rx={0} fill="none" stroke="#ddd" strokeWidth={1} />

      {/* Logo — top left */}
      {frontLeftLogo !== "none" && (
        <LogoMark x={22} y={20} size={34} color={primaryColor} />
      )}

      {/* Stamp — top right */}
      <Stamp x={stX} y={stY} w={stW} h={stH} accentColor={stampColor} stampType={stampType} />

      {/* Cancellation marks */}
      <CancellationMarks x={cmX} y={cmY} w={cmW} h={cmH} color={textColor} />

      {/* Recipient name — centred */}
      {showName && (
        <text
          x={vw / 2}
          y={vh * 0.48}
          textAnchor="middle"
          fontSize={18}
          fontWeight={500}
          fontFamily="Georgia, serif"
          fill={recipientNameColor === "#FFFFFF" && isLight ? "#333" : recipientNameColor}
        >
          Mr. John Smith
        </text>
      )}
    </svg>
  );
}

// ── Exported component ──────────────────────────────────────────────────────
export function EnvelopePreview({
  envelopeColor,
  linerColor,
  frontDesign = "none",
  swoopVariant = "single",
  stripeVariant = "single",
  frontDesignColor = "#C8962A",
  primaryColor,
  secondaryColor,
  tertiaryColor,
  stampSelection = "classic",
  postmarkColor = "#C8962A",
  frontLeftLogo = "none",
  recipientNameColor = "#FFFFFF",
  showName = false,
  mode = "thumbnail",
  width,
}: EnvelopePreviewProps) {
  const w = width ?? (mode === "thumbnail" ? 200 : 400);

  if (mode === "thumbnail") {
    return (
      <ThumbnailEnvelope
        envelopeColor={envelopeColor}
        linerColor={linerColor}
        stampColor={postmarkColor}
        stampType={stampSelection}
        frontLeftLogo={frontLeftLogo}
        primaryColor={primaryColor}
        width={w}
      />
    );
  }

  return (
    <FrontEnvelope
      envelopeColor={envelopeColor}
      linerColor={linerColor}
      frontDesign={frontDesign}
      swoopVariant={swoopVariant}
      stripeVariant={stripeVariant}
      frontDesignColor={frontDesignColor}
      primaryColor={primaryColor}
      secondaryColor={secondaryColor}
      tertiaryColor={tertiaryColor}
      stampColor={postmarkColor}
      stampType={stampSelection}
      frontLeftLogo={frontLeftLogo}
      recipientNameColor={recipientNameColor}
      showName={showName}
      width={w}
    />
  );
}
