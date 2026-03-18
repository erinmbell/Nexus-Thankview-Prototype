import { useState } from "react";

// ── Utilities ────────────────────────────────────────────────────────────────

/** Normalise any partial hex string into a safe 7-char #RRGGBB value. */
export function safeHex(hex: string): string {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return "#" + clean.padEnd(6, "0");
}

// ── Preset swatch sets ──────────────────────────────────────────────────────

export interface ColorSwatch {
  hex: string;
  name: string;
}

/** 12-colour envelope palette */
export const ENVELOPE_COLOR_SWATCHES: ColorSwatch[] = [
  { hex: "#1B3461", name: "Hartwell Navy" },
  { hex: "#C8962A", name: "Hartwell Gold" },
  { hex: "#BE3455", name: "Rose" },
  { hex: "#7c45b0", name: "Purple" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#1e6b4f", name: "Forest" },
  { hex: "#2B8A3E", name: "Green" },
  { hex: "#0E8A45", name: "Emerald" },
  { hex: "#334155", name: "Slate" },
  { hex: "#111111", name: "Black" },
  { hex: "#6b21a8", name: "Violet" },
  { hex: "#8B1E33", name: "Heritage Maroon" },
];

/** 9-colour brand palette (envelope builder modal) */
export const BRAND_PALETTE: ColorSwatch[] = [
  { hex: "#1B3461", name: "Hartwell Navy" },
  { hex: "#C8962A", name: "Hartwell Gold" },
  { hex: "#A23B3B", name: "Heritage Crimson" },
  { hex: "#3B5998", name: "Crest Blue" },
  { hex: "#5B8FAF", name: "Lake Blue" },
  { hex: "#2D7D46", name: "Ivy Green" },
  { hex: "#1A3A2A", name: "Forest" },
  { hex: "#6B3FA0", name: "Regal Purple" },
  { hex: "#555555", name: "Slate" },
];

/** 10-colour landing page palette */
export const LP_COLOR_PRESETS: ColorSwatch[] = [
  { hex: "#7c45b0", name: "Purple" },
  { hex: "#1B3461", name: "Navy" },
  { hex: "#2563eb", name: "Blue" },
  { hex: "#0d9488", name: "Teal" },
  { hex: "#16a34a", name: "Green" },
  { hex: "#dc2626", name: "Red" },
  { hex: "#ea580c", name: "Orange" },
  { hex: "#1e293b", name: "Dark" },
  { hex: "#ffffff", name: "White" },
  { hex: "#374151", name: "Gray" },
];

// ── Component ────────────────────────────────────────────────────────────────

export interface ColorSwatchPickerProps {
  /** Current hex colour value */
  value: string;
  /** Called with the new hex string and the matched swatch name (or "Custom") */
  onChange: (hex: string, label: string) => void;
  /** Array of preset colour swatches to display */
  swatches: ColorSwatch[];
  /** Optional label text rendered above the swatches */
  label?: string;
  /** Optional description text below everything */
  description?: string;
  /** Diameter of each swatch circle in px (default 22) */
  swatchSize?: number;
  /** Show the rainbow "custom colour" popup button (default true) */
  showCustomPopup?: boolean;
  /** Extra class on the outer wrapper */
  className?: string;
}

/**
 * Unified colour picker used across the entire app.
 *
 * Renders:
 *  1. Preset swatch circles
 *  2. (optional) Rainbow popup for native colour picker
 *  3. Inline hex input + colour swatch + matched name
 */
export function ColorSwatchPicker({
  value,
  onChange,
  swatches,
  label,
  description,
  swatchSize = 22,
  showCustomPopup = true,
  className = "",
}: ColorSwatchPickerProps) {
  const [showPopup, setShowPopup] = useState(false);
  const matched = swatches.find(
    (s) => s.hex.toLowerCase() === value.toLowerCase()
  );
  const matchedLabel = matched?.name ?? "Custom";

  const handleHexInput = (raw: string) => {
    let v = raw;
    if (!v.startsWith("#")) v = "#" + v;
    if (v.length <= 7) onChange(v, "Custom");
  };

  return (
    <div className={className}>
      {label && (
        <p className="text-[10px] text-tv-text-decorative mb-1.5">{label}</p>
      )}

      {/* ── Swatch row ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        {swatches.map((s) => {
          const selected = s.hex.toLowerCase() === value.toLowerCase();
          return (
            <button
              key={s.hex}
              type="button"
              onClick={() => onChange(s.hex, s.name)}
              className={`rounded-full border-2 transition-all shrink-0 ${
                selected
                  ? "border-tv-brand ring-2 ring-tv-brand/30 scale-110"
                  : "border-transparent hover:border-tv-border-strong hover:scale-105"
              }`}
              style={{
                width: swatchSize,
                height: swatchSize,
                backgroundColor: s.hex,
              }}
              title={s.name}
              aria-label={`Select ${s.name}`}
            />
          );
        })}

        {/* Rainbow / custom colour popup */}
        {showCustomPopup && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPopup(!showPopup)}
              className={`rounded-full border-2 transition-all shrink-0 ${
                !matched
                  ? "border-tv-brand scale-110 ring-2 ring-tv-brand/30"
                  : "border-transparent hover:scale-105"
              }`}
              style={{
                width: swatchSize,
                height: swatchSize,
                background:
                  "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
              }}
              title="Custom color"
              aria-label="Custom color"
            />
            {showPopup && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowPopup(false)}
                />
                <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-[8px] shadow-xl border border-tv-border-light p-2">
                  <input
                    type="color"
                    value={safeHex(value)}
                    onChange={(e) => onChange(e.target.value, "Custom")}
                    className="w-28 h-28 cursor-pointer border-0"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Hex input row ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-2">
        <label
          className="w-5 h-5 rounded border border-tv-border-light shrink-0 relative overflow-hidden cursor-pointer"
          style={{ backgroundColor: safeHex(value) }}
        >
          <input
            type="color"
            value={safeHex(value)}
            onChange={(e) => onChange(e.target.value, "Custom")}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
        <input
          value={value}
          onChange={(e) => handleHexInput(e.target.value)}
          className="w-[80px] text-[11px] font-mono text-tv-text-secondary border border-tv-border-light rounded-[6px] px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-tv-brand/40 focus:border-tv-brand uppercase"
          placeholder="#000000"
        />
        <span className="text-[10px] text-tv-text-decorative">
          &middot; {matchedLabel}
        </span>
      </div>

      {description && (
        <p className="text-[10px] text-tv-text-secondary mt-1">{description}</p>
      )}
    </div>
  );
}
