/**
 * PillSearchInput — Design-system-compliant pill-shaped search input.
 *
 * Sizes:
 *   - "md" (default): 36px height, 13px text
 *   - "sm":           30px height, 12px text
 *   - "xs":           26px height, 10px text
 */
import { Search, X } from "lucide-react";

const SIZE_MAP = {
  md: { h: "h-[36px]", text: "text-[13px]", icon: 14, pl: "pl-[34px]", pr: "pr-[12px]", iconLeft: "left-[10px]", clearRight: "right-[10px]" },
  sm: { h: "h-[30px]", text: "text-[12px]", icon: 13, pl: "pl-[30px]", pr: "pr-[10px]", iconLeft: "left-[9px]",  clearRight: "right-[9px]" },
  xs: { h: "h-[26px]", text: "text-[10px]", icon: 11, pl: "pl-[26px]", pr: "pr-[8px]",  iconLeft: "left-[8px]",  clearRight: "right-[8px]" },
} as const;

interface PillSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  size?: "md" | "sm" | "xs";
  /** Show an X clear button when value is non-empty */
  clearable?: boolean;
  className?: string;
  /** If true, auto-focuses on mount */
  autoFocus?: boolean;
}

export function PillSearchInput({
  value,
  onChange,
  placeholder = "Search\u2026",
  ariaLabel,
  size = "md",
  clearable = true,
  className = "",
  autoFocus,
}: PillSearchInputProps) {
  const s = SIZE_MAP[size];

  return (
    <div className={`relative ${s.h} ${className}`}>
      {/* Search icon */}
      <Search
        size={s.icon}
        className={`absolute ${s.iconLeft} top-1/2 -translate-y-1/2 text-tv-text-secondary pointer-events-none`}
      />
      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder.replace(/\u2026$/, "")}
        autoFocus={autoFocus}
        className={`w-full ${s.h} ${s.pl} ${clearable && value ? "pr-[30px]" : s.pr} ${s.text} bg-white border border-tv-border-light rounded-full outline-none transition-colors placeholder:text-tv-text-decorative text-tv-text-primary focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand`}
      />
      {/* Clear button */}
      {clearable && value && (
        <button
          onClick={() => onChange("")}
          className={`absolute ${s.clearRight} top-1/2 -translate-y-1/2 text-tv-text-secondary hover:text-tv-text-primary transition-colors`}
          aria-label="Clear search"
        >
          <X size={s.icon} />
        </button>
      )}
    </div>
  );
}
