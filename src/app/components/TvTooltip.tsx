/**
 * TvTooltip — lightweight tooltip wrapper styled for the ThankView design system.
 *
 * Uses Radix UI Tooltip primitives with TV-branded styling.
 * Wrap any element to get a styled tooltip on hover/focus.
 *
 * Usage:
 *   <TvTooltip label="Bold">
 *     <button>...</button>
 *   </TvTooltip>
 */
import type { ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

interface TvTooltipProps {
  /** Tooltip text */
  label: string;
  /** The trigger element */
  children: ReactNode;
  /** Which side to prefer (default: "top") */
  side?: "top" | "bottom" | "left" | "right";
  /** Side offset in px (default: 6) */
  sideOffset?: number;
  /** Delay before showing in ms (default: 300) */
  delayDuration?: number;
  /** Whether to skip delay on subsequent tooltips (default: 200ms) */
  skipDelayDuration?: number;
  /** If false, tooltip won't render (useful for conditional tooltips) */
  enabled?: boolean;
}

export function TvTooltip({
  label,
  children,
  side = "top",
  sideOffset = 6,
  delayDuration = 300,
  skipDelayDuration = 200,
  enabled = true,
}: TvTooltipProps) {
  if (!enabled || !label) return <>{children}</>;

  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration} skipDelayDuration={skipDelayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span style={{ display: "inline-flex" }}>{children}</span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={sideOffset}
            className="z-[10000] rounded-sm px-2.5 py-1.5 text-[11px] shadow-lg border border-tv-border-light animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=top]:slide-in-from-bottom-1 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 max-w-[220px] text-center pointer-events-none select-none"
            style={{
              backgroundColor: "#1e293b",
              color: "#f8fafc",
              fontWeight: 500,
              letterSpacing: "0.01em",
              lineHeight: 1.4,
            }}
          >
            {label}
            <TooltipPrimitive.Arrow
              className="z-[10000]"
              style={{ fill: "#1e293b" }}
              width={10}
              height={5}
            />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
