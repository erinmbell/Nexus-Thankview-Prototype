import { Info } from "lucide-react";

/**
 * Small info-circle tooltip explaining the "Constituent" terminology.
 * Renders an <Info> icon that shows a native title tooltip on hover.
 */
export function ConstituentTooltip({ size = 11 }: { size?: number }) {
  return (
    <span
      title="A constituent is the person this video is intended for — a donor, alumni, or supporter."
      aria-label="A constituent is the person this video is intended for — a donor, alumni, or supporter."
      className="inline-flex items-center cursor-help text-tv-text-secondary hover:text-tv-text-primary transition-colors"
    >
      <Info size={size} />
    </span>
  );
}
