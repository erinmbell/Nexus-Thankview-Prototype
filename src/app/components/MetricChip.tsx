/**
 * MetricChip — Shared chip-toggle for Success Metrics selection.
 *
 * Used by both CreateCampaign (single-step) and MultiStepBuilder (multi-step)
 * in the Schedule step. Renders as a pill button that toggles
 * on/off within the 1-5 selection constraint.
 */
import { Check } from "lucide-react";
import type { SuccessMetricDef } from "../pages/campaign/types";

interface MetricChipProps {
  metric: SuccessMetricDef;
  active: boolean;
  disabled: boolean;
  negative?: boolean;
  onToggle: (id: string) => void;
}

export function MetricChip({ metric, active, disabled, negative, onToggle }: MetricChipProps) {
  const activeColor = negative
    ? "bg-tv-danger text-white border-tv-danger"
    : "bg-tv-brand-bg text-white border-tv-brand-bg";
  const hoverColor = negative
    ? "hover:border-tv-danger hover:text-tv-danger"
    : "hover:border-tv-brand-bg hover:text-tv-brand";

  return (
    <button
      onClick={() => !disabled && onToggle(metric.id)}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] border transition-all ${
        active
          ? `${activeColor} shadow-sm`
          : disabled
            ? "bg-tv-surface text-tv-text-decorative border-tv-border-light opacity-40 cursor-not-allowed"
            : `bg-white text-tv-text-secondary border-tv-border-light ${hoverColor}`
      }`}
    >
      {active ? <Check size={13} /> : <metric.icon size={13} />}
      {metric.label}
    </button>
  );
}
