/**
 * MergeFieldValidation — Pre-send merge-field gap scanner.
 */
import { useState, useCallback, useMemo } from "react";
import {
  ChevronDown, ChevronRight, CheckCircle2, AlertTriangle,
  X, Trash2, Type, UserX, ShieldCheck,
} from "lucide-react";

interface GapConstituent { name: string; email: string; }
interface MergeFieldGap { field: string; fieldLabel: string; missingConstituents: GapConstituent[]; }

const MOCK_GAPS: MergeFieldGap[] = [
  { field: "{{gift_amount}}", fieldLabel: "Last Gift Amount", missingConstituents: [
    { name: "Morgan Chambers", email: "m.chambers@alumni.edu" },
    { name: "Priya Nair", email: "p.nair@foundation.org" },
    { name: "Devin Ross", email: "d.ross@hartwell.edu" },
    { name: "Talia Mendez", email: "t.mendez@email.com" },
  ]},
  { field: "{{fund_name}}", fieldLabel: "Fund Name", missingConstituents: [
    { name: "Priya Nair", email: "p.nair@foundation.org" },
    { name: "Jamal Carter", email: "j.carter@alumni.edu" },
    { name: "Devin Ross", email: "d.ross@hartwell.edu" },
  ]},
  { field: "{{campaign_name}}", fieldLabel: "Campaign Name", missingConstituents: [
    { name: "Talia Mendez", email: "t.mendez@email.com" },
  ]},
];

type Resolution = { type: "removed" } | { type: "fallback"; text: string } | { type: "skipped" };

export interface MergeFieldValidationProps {
  compact?: boolean;
  onRemovedFieldsChange?: (fields: string[]) => void;
  onSkippedConstituentsChange?: (emails: string[]) => void;
}

export function MergeFieldValidation({ compact = false, onRemovedFieldsChange, onSkippedConstituentsChange }: MergeFieldValidationProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [fallbackInputs, setFallbackInputs] = useState<Record<string, string>>({});
  const [showFallbackInput, setShowFallbackInput] = useState<Record<string, boolean>>({});

  const toggleExpand = (field: string) => setExpanded(prev => { const n = new Set(prev); n.has(field) ? n.delete(field) : n.add(field); return n; });

  const resolve = useCallback((field: string, resolution: Resolution) => {
    setResolutions(prev => {
      const next = { ...prev, [field]: resolution };
      onRemovedFieldsChange?.(Object.entries(next).filter(([, r]) => r.type === "removed").map(([f]) => f));
      if (onSkippedConstituentsChange) {
        const emails: string[] = [];
        Object.entries(next).forEach(([f, r]) => { if (r.type === "skipped") { const gap = MOCK_GAPS.find(g => g.field === f); if (gap) gap.missingConstituents.forEach(rec => emails.push(rec.email)); } });
        onSkippedConstituentsChange([...new Set(emails)]);
      }
      return next;
    });
    setShowFallbackInput(prev => ({ ...prev, [field]: false }));
  }, [onRemovedFieldsChange, onSkippedConstituentsChange]);

  const unresolve = useCallback((field: string) => {
    setResolutions(prev => { const next = { ...prev }; delete next[field]; return next; });
    setShowFallbackInput(prev => ({ ...prev, [field]: false }));
    setFallbackInputs(prev => ({ ...prev, [field]: "" }));
  }, []);

  const allResolved = useMemo(() => MOCK_GAPS.every(g => resolutions[g.field]), [resolutions]);

  const px = compact ? "px-3.5" : "px-4";
  const py = compact ? "py-2.5" : "py-3";
  const headerSize = compact ? "text-[12px]" : "text-[13px]";
  const bodySize = compact ? "text-[11px]" : "text-[12px]";

  if (allResolved) {
    return (
      <div className={`${px} ${py} rounded-lg border border-tv-success-border bg-tv-success-bg flex items-center gap-3`}>
        <div className="w-8 h-8 rounded-full bg-tv-success-bg border border-tv-success-border flex items-center justify-center shrink-0">
          <ShieldCheck size={15} className="text-tv-success" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${headerSize} text-tv-success`} style={{ fontWeight: 700 }}>All merge fields validated</p>
          <p className={`${compact ? "text-[10px]" : "text-[11px]"} text-tv-success/70 mt-0.5`}>Every constituent has data for all merge fields used in this campaign.</p>
        </div>
        <button onClick={() => setResolutions({})} className="text-[10px] text-tv-success/60 hover:text-tv-success hover:underline shrink-0" style={{ fontWeight: 500 }}>Reset</button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-tv-warning-border overflow-hidden">
      <div className={`${px} ${py} bg-tv-warning-bg flex items-center gap-2.5`}>
        <AlertTriangle size={14} className="text-tv-warning shrink-0" />
        <div className="flex-1 min-w-0">
          <p className={`${headerSize} text-tv-warning-hover`} style={{ fontWeight: 700 }}>Merge Field Check</p>
          <p className={`${compact ? "text-[9px]" : "text-[10px]"} text-tv-warning/80 mt-0.5`}>{MOCK_GAPS.length - Object.keys(resolutions).length} of {MOCK_GAPS.length} field{MOCK_GAPS.length !== 1 ? "s" : ""} need attention</p>
        </div>
      </div>
      <div className="divide-y divide-tv-warning-border/40 bg-white">
        {MOCK_GAPS.map(gap => {
          const isExpanded = expanded.has(gap.field);
          const resolution = resolutions[gap.field];
          const isResolved = !!resolution;
          const isFallbackOpen = showFallbackInput[gap.field];
          return (
            <div key={gap.field} className={isResolved ? "bg-tv-success-bg/30" : ""}>
              <button onClick={() => toggleExpand(gap.field)} className={`w-full flex items-center gap-2.5 ${px} ${compact ? "py-2" : "py-2.5"} text-left hover:bg-tv-surface/50 transition-colors`}>
                <span className="text-tv-text-decorative shrink-0">{isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}</span>
                {isResolved ? <CheckCircle2 size={13} className="text-tv-success shrink-0" /> : <AlertTriangle size={12} className="text-tv-warning shrink-0" />}
                <span className={`${bodySize} flex-1 min-w-0 ${isResolved ? "text-tv-success line-through" : "text-tv-text-primary"}`}>
                  <span style={{ fontWeight: 600 }}>{gap.missingConstituents.length} constituent{gap.missingConstituents.length !== 1 ? "s" : ""}</span>
                  {" missing "}
                  <code className="font-mono text-tv-brand bg-tv-brand-tint px-1 py-0.5 rounded text-[10px]">{gap.field}</code>
                </span>
                {isResolved && (
                  <span className={`${compact ? "text-[9px]" : "text-[10px]"} text-tv-success shrink-0 px-2 py-0.5 rounded-full bg-tv-success-bg border border-tv-success-border`} style={{ fontWeight: 600 }}>
                    {resolution.type === "removed" ? "Removed" : resolution.type === "fallback" ? `Fallback: "${resolution.text}"` : "Skipped"}
                  </span>
                )}
              </button>
              {isExpanded && (
                <div className={`${px} pb-3 ${compact ? "pt-0.5" : "pt-1"}`}>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {gap.missingConstituents.map(r => (
                      <span key={r.email} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-tv-surface border border-tv-border-light text-[10px] text-tv-text-secondary" title={r.email}>
                        <span className="w-4 h-4 rounded-full bg-tv-surface-active flex items-center justify-center text-[8px] text-tv-text-decorative shrink-0" style={{ fontWeight: 700 }}>{r.name.charAt(0)}</span>
                        {r.name}
                      </span>
                    ))}
                  </div>
                  {!isResolved ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <button onClick={(e) => { e.stopPropagation(); resolve(gap.field, { type: "removed" }); }} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-tv-border-light rounded-sm text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-text-primary transition-colors" style={{ fontWeight: 500 }}><Trash2 size={11} />Remove field from message</button>
                        <button onClick={(e) => { e.stopPropagation(); setShowFallbackInput(prev => ({ ...prev, [gap.field]: !prev[gap.field] })); }} className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] border rounded-sm transition-colors ${isFallbackOpen ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-text-primary"}`} style={{ fontWeight: 500 }}><Type size={11} />Set fallback text</button>
                        <button onClick={(e) => { e.stopPropagation(); resolve(gap.field, { type: "skipped" }); }} className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] border border-tv-danger-border rounded-sm text-tv-danger hover:border-tv-danger hover:bg-tv-danger-bg transition-colors" style={{ fontWeight: 500 }}><UserX size={11} />Skip these constituents</button>
                      </div>
                      {isFallbackOpen && (
                        <div className="flex items-center gap-2">
                          <input value={fallbackInputs[gap.field] || ""} onChange={e => setFallbackInputs(prev => ({ ...prev, [gap.field]: e.target.value }))} placeholder={`Default text for ${gap.fieldLabel}\u2026`} aria-label="Fallback text" className="flex-1 border border-tv-border-light rounded-sm px-2.5 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" onClick={e => e.stopPropagation()} />
                          <button onClick={(e) => { e.stopPropagation(); const text = (fallbackInputs[gap.field] || "").trim(); if (text) resolve(gap.field, { type: "fallback", text }); }} disabled={!(fallbackInputs[gap.field] || "").trim()} className="px-3 py-1.5 text-[11px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed" style={{ fontWeight: 600 }}>Apply</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); unresolve(gap.field); }} className="flex items-center gap-1 text-[10px] text-tv-text-decorative hover:text-tv-text-secondary transition-colors" style={{ fontWeight: 500 }}><X size={10} />Undo</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MergeFieldValidation;
