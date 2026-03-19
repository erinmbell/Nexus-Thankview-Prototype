import { TV } from "../theme";

export const CTA_COLOR_PRESETS = [
  { label: "Brand Purple", bg: TV.brand,     text: "#ffffff" },
  { label: "Deep Purple",  bg: "#4a1a78",    text: "#ffffff" },
  { label: "Blue",         bg: "#2563eb",    text: "#ffffff" },
  { label: "Teal",         bg: "#0d9488",    text: "#ffffff" },
  { label: "Green",        bg: "#16a34a",    text: "#ffffff" },
  { label: "Red",          bg: "#dc2626",    text: "#ffffff" },
  { label: "Orange",       bg: "#ea580c",    text: "#ffffff" },
  { label: "Dark",         bg: "#1e293b",    text: "#ffffff" },
  { label: "White",        bg: "#ffffff",    text: "#242436" },
] as const;

interface CtaButtonControlsProps {
  ctaText: string;
  btnBg: string;
  btnText: string;
  onCtaTextChange: (text: string) => void;
  onBtnBgChange: (color: string) => void;
  onBtnTextChange: (color: string) => void;
  compact?: boolean;
  className?: string;
}

export function CtaButtonControls({
  ctaText, btnBg, btnText,
  onCtaTextChange, onBtnBgChange, onBtnTextChange,
  compact = false, className = "",
}: CtaButtonControlsProps) {
  const effectiveBg = btnBg || TV.brand;
  const effectiveText = btnText || "#ffffff";
  const inputCls = compact
    ? "w-full border border-tv-border-light rounded-[6px] px-2 py-1.5 text-[11px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand"
    : "w-full border border-tv-border-light rounded-sm px-2.5 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand";

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <label className={compact ? "block text-[10px] text-tv-text-secondary mb-1 uppercase tracking-wider" : "tv-label mb-1 block"} style={{ fontWeight: 600 }}>
          Button Text
        </label>
        <input value={ctaText} onChange={e => onCtaTextChange(e.target.value)} placeholder="Give to the Annual Fund" className={inputCls} />
      </div>

      <div>
        <label className={compact ? "block text-[10px] text-tv-text-secondary mb-1.5 uppercase tracking-wider" : "tv-label mb-1.5 block"} style={{ fontWeight: 600 }}>
          Button Color
        </label>
        <div className="flex flex-wrap gap-1.5">
          {CTA_COLOR_PRESETS.map(preset => {
            const isActive = effectiveBg.toLowerCase() === preset.bg.toLowerCase();
            return (
              <button
                key={preset.label} type="button"
                onClick={() => { onBtnBgChange(preset.bg); onBtnTextChange(preset.text); }}
                title={preset.label}
                className={`w-6 h-6 rounded-full border-2 transition-all shrink-0 ${
                  isActive ? "border-tv-brand ring-2 ring-tv-brand/30 scale-110" : "border-tv-border-light hover:border-tv-border-strong hover:scale-105"
                }`}
                style={{ backgroundColor: preset.bg }}
              />
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <ColorPickerField label="BG" value={effectiveBg} onChange={onBtnBgChange} compact={compact} />
        <ColorPickerField label="Text" value={effectiveText} onChange={onBtnTextChange} compact={compact} />
      </div>

      <div className={`p-3 bg-tv-surface rounded-md border border-tv-border-divider ${compact ? "p-2.5" : ""}`}>
        <p className="tv-label mb-2" style={{ fontSize: 9 }}>Button Preview</p>
        <div className="flex justify-center">
          <span
            className={`inline-block rounded-full cursor-default ${compact ? "px-4 py-1.5 text-[11px]" : "px-5 py-2 text-[12px]"}`}
            style={{ fontWeight: 600, backgroundColor: effectiveBg, color: effectiveText }}
          >
            {ctaText || "Give to the Annual Fund"}
          </span>
        </div>
      </div>
    </div>
  );
}

function ColorPickerField({ label, value, onChange, compact }: { label: string; value: string; onChange: (v: string) => void; compact?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="text-[10px] text-tv-text-secondary">{label}</label>
      <div className="flex items-center gap-1 border border-tv-border-light rounded-[6px] px-1.5 py-1">
        <label className="w-4 h-4 rounded border border-tv-border-light relative overflow-hidden cursor-pointer shrink-0" style={{ backgroundColor: value }}>
          <input type="color" value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </label>
        <input value={value} onChange={e => onChange(e.target.value)} className="w-[58px] text-[11px] font-mono text-tv-text-primary outline-none focus:ring-1 focus:ring-tv-brand/40" />
      </div>
    </div>
  );
}
