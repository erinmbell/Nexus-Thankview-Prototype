/**
 * ThankView Design System — Toggle Switch
 */
import { type ButtonHTMLAttributes } from "react";

interface ToggleProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  enabled: boolean;
  onToggle: () => void;
  size?: "default" | "compact";
}

const SIZES = {
  default: {
    track: "w-9 h-5",
    knob: "w-4 h-4",
    onLeft: "left-[17px]",
    offLeft: "left-0.5",
    knobTop: "top-0.5",
  },
  compact: {
    track: "w-8 h-[18px]",
    knob: "w-3.5 h-3.5",
    onLeft: "left-[15px]",
    offLeft: "left-[2px]",
    knobTop: "top-[2px]",
  },
} as const;

export function Toggle({ enabled, onToggle, size = "default", className = "", ...rest }: ToggleProps) {
  const s = SIZES[size];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onToggle}
      className={`${s.track} rounded-full relative shrink-0 transition-colors ${
        enabled ? "bg-tv-brand-bg" : "bg-[#9585ad]"
      } ${className}`}
      {...rest}
    >
      <div
        className={`${s.knob} bg-white rounded-full absolute ${s.knobTop} transition-all shadow-sm ${
          enabled ? s.onLeft : s.offLeft
        }`}
      />
    </button>
  );
}
