import React, { useState, useEffect, useCallback } from "react";
import {
  TriangleAlert, Check, Send, ChevronLeft, Loader2,
  Users, Video, Clock, Mail, CircleAlert, ChevronDown, ChevronRight,
  X, Type, UserX, CheckCircle2,
} from "lucide-react";

type ConfirmState = "review" | "sending" | "success";

export interface MergeFieldWarning {
  field: string;
  missingCount: number;
  affectedConstituents: string[];
}

type Resolution = "removed" | "fallback" | "skipped";

export interface ConfirmSendProps {
  constituentCount: number;
  videoSegments: string[];
  personalizedCount: number;
  deliveryType: string;
  mergeFieldWarnings?: MergeFieldWarning[];
  campaignName?: string;
  deliveryMethod?: string;
  contentSummary?: string;
  onBack: () => void;
  onSend: () => void;
}

export function ConfirmSend({
  constituentCount, videoSegments, personalizedCount, deliveryType,
  mergeFieldWarnings = [], campaignName, deliveryMethod, contentSummary,
  onBack, onSend,
}: ConfirmSendProps) {
  const [state, setState] = useState<ConfirmState>("review");
  const [expandedField, setExpandedField] = useState<string | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [fallbackValues, setFallbackValues] = useState<Record<string, string>>({});
  const [editingFallback, setEditingFallback] = useState<string | null>(null);

  const unresolvedCount = mergeFieldWarnings.filter(w => !resolutions[w.field]).length;
  const allResolved = mergeFieldWarnings.length > 0 && unresolvedCount === 0;

  const resolveField = (field: string, resolution: Resolution) => {
    setResolutions(prev => ({ ...prev, [field]: resolution }));
    setExpandedField(null);
    setEditingFallback(null);
  };

  const unresolveField = (field: string) => {
    setResolutions(prev => { const next = { ...prev }; delete next[field]; return next; });
    setFallbackValues(prev => { const next = { ...prev }; delete next[field]; return next; });
  };

  const handleSend = useCallback(() => setState("sending"), []);

  useEffect(() => {
    if (state !== "sending") return;
    const timer = setTimeout(() => setState("success"), 2000);
    return () => clearTimeout(timer);
  }, [state]);

  if (state === "success") {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-[480px] text-center">
          <div className="w-16 h-16 rounded-full bg-tv-success-bg flex items-center justify-center mx-auto mb-5">
            <Check size={28} className="text-tv-success" />
          </div>
          <h2 className="text-[22px] text-tv-text-primary font-display mb-2" style={{ fontWeight: 900 }}>Campaign Sent!</h2>
          <p className="text-[13px] text-tv-text-secondary leading-relaxed">
            Your video campaign has been queued for delivery to{" "}
            <span className="text-tv-text-primary" style={{ fontWeight: 600 }}>{constituentCount.toLocaleString()} constituents</span>.
          </p>
          <button onClick={onSend} className="mt-6 px-6 py-2.5 bg-tv-success text-white text-[13px] rounded-full hover:opacity-90 transition-colors" style={{ fontWeight: 600 }}>Done</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-[520px]">
        <div className="bg-white border border-tv-border-light rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 pt-6 pb-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-md bg-tv-warning-bg flex items-center justify-center shrink-0">
              <TriangleAlert size={18} className="text-tv-warning" />
            </div>
            <div>
              <h2 className="text-[17px] text-tv-text-primary" style={{ fontWeight: 900 }}>Review & Confirm</h2>
              <p className="text-[12px] text-tv-text-secondary mt-1 leading-relaxed">Review the details below before confirming.</p>
            </div>
          </div>

          <div className="mx-6 mb-4 p-4 bg-tv-surface-muted border border-tv-border-divider rounded-lg space-y-2.5">
            {campaignName && <SummaryRow icon={<Mail size={13} className="text-tv-brand" />} label="Campaign" value={campaignName} />}
            {deliveryMethod && <SummaryRow icon={<Send size={13} className="text-tv-brand" />} label="Channel" value={deliveryMethod} />}
            <SummaryRow icon={<Users size={13} className="text-tv-brand" />} label="Constituents" value={`${constituentCount.toLocaleString()} constituents`} />
            <SummaryRow icon={<Video size={13} className="text-tv-brand" />} label="Video segments" value={videoSegments.length > 0 ? videoSegments.join(" + ") : "None"} />
            {personalizedCount > 0 && <SummaryRow icon={<Mail size={13} className="text-tv-brand" />} label="Personalized clips" value={`${personalizedCount} clips`} />}
            {contentSummary && <SummaryRow icon={<Mail size={13} className="text-tv-brand" />} label="Content" value={contentSummary} />}
            <SummaryRow icon={<Clock size={13} className="text-tv-brand" />} label="Delivery" value={deliveryType} />
          </div>

          {mergeFieldWarnings.length > 0 && (
            <div className="mx-6 mb-4">
              <div className={`border rounded-lg overflow-hidden transition-colors ${allResolved ? "border-tv-success/40 bg-tv-success-bg/50" : "border-tv-warning-border bg-tv-warning-bg/30"}`}>
                <div className={`px-4 py-3 flex items-center gap-2.5 ${allResolved ? "bg-tv-success-bg/60" : "bg-tv-warning-bg/60"}`}>
                  {allResolved ? <CheckCircle2 size={15} className="text-tv-success shrink-0" /> : <CircleAlert size={15} className="text-tv-warning shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 700 }}>Merge Field Check</p>
                    {!allResolved && <p className="text-[10px] text-tv-text-secondary mt-0.5">{unresolvedCount} field{unresolvedCount !== 1 ? "s" : ""} with missing data</p>}
                  </div>
                  {allResolved && <span className="text-[10px] text-tv-success px-2 py-0.5 rounded-full bg-tv-success/10 border border-tv-success/20" style={{ fontWeight: 600 }}>All resolved</span>}
                </div>
                {!allResolved && (
                  <div className="divide-y divide-tv-warning-border/40">
                    {mergeFieldWarnings.map(w => {
                      const isExpanded = expandedField === w.field;
                      const isResolved = !!resolutions[w.field];
                      return (
                        <div key={w.field}>
                          <button onClick={() => { if (!isResolved) setExpandedField(isExpanded ? null : w.field); }}
                            className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${isResolved ? "bg-tv-success-bg/30 cursor-default" : "hover:bg-tv-warning-bg/50 cursor-pointer"}`}>
                            {isResolved ? <Check size={12} className="text-tv-success shrink-0" /> : isExpanded ? <ChevronDown size={12} className="text-tv-warning shrink-0" /> : <ChevronRight size={12} className="text-tv-warning shrink-0" />}
                            <span className={`text-[11px] flex-1 ${isResolved ? "text-tv-text-secondary line-through" : "text-tv-text-primary"}`}>
                              <span style={{ fontWeight: 600 }}>{w.missingCount}</span> missing <code className="font-mono text-[10px]">{`{{${w.field}}}`}</code>
                            </span>
                            {isResolved && <button onClick={e => { e.stopPropagation(); unresolveField(w.field); }} className="text-[9px] text-tv-text-secondary hover:text-tv-text-primary underline shrink-0">Undo</button>}
                          </button>
                          {isExpanded && !isResolved && (
                            <div className="px-4 pb-3 pt-1 bg-white/60">
                              <div className="mb-3">
                                <div className="flex flex-wrap gap-1">
                                  {w.affectedConstituents.map(name => <span key={name} className="inline-flex items-center px-2 py-[3px] bg-tv-warning-bg border border-tv-warning-border/60 rounded-full text-[9px] text-tv-text-primary" style={{ fontWeight: 500 }}>{name}</span>)}
                                </div>
                              </div>
                              {editingFallback === w.field && (
                                <div className="mb-3 flex items-center gap-2">
                                  <input type="text" value={fallbackValues[w.field] || ""} onChange={e => setFallbackValues(prev => ({ ...prev, [w.field]: e.target.value }))} placeholder={`Fallback for {{${w.field}}}`} className="flex-1 border border-tv-border-light rounded-sm px-3 py-1.5 text-[11px] outline-none focus:ring-2 focus:ring-tv-brand-bg/20" autoFocus />
                                  <button onClick={() => { if (fallbackValues[w.field]?.trim()) resolveField(w.field, "fallback"); }} disabled={!fallbackValues[w.field]?.trim()} className="px-3 py-1.5 text-[10px] rounded-sm bg-tv-brand-bg text-white disabled:opacity-50" style={{ fontWeight: 600 }}>Apply</button>
                                  <button onClick={() => setEditingFallback(null)} className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-tv-surface-hover text-tv-text-secondary"><X size={11} /></button>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-2">
                                <button onClick={() => resolveField(w.field, "removed")} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-tv-border-light rounded-sm text-tv-text-secondary hover:text-tv-text-primary bg-white" style={{ fontWeight: 500 }}><X size={10} />Remove field</button>
                                <button onClick={() => setEditingFallback(w.field)} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-tv-border-light rounded-sm text-tv-text-secondary hover:text-tv-brand bg-white" style={{ fontWeight: 500 }}><Type size={10} />Set fallback</button>
                                <button onClick={() => resolveField(w.field, "skipped")} className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] border border-tv-danger/30 rounded-sm text-tv-danger/80 hover:text-tv-danger bg-white" style={{ fontWeight: 500 }}><UserX size={10} />Skip constituents</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mx-6 mb-5 p-3 bg-tv-warning-bg border border-tv-warning-border rounded-md flex items-start gap-2">
            <TriangleAlert size={13} className="text-tv-warning shrink-0 mt-0.5" />
            <p className="text-[11px] text-tv-text-primary leading-relaxed"><strong>This action cannot be undone.</strong></p>
          </div>

          <div className="px-6 pb-6 flex items-center justify-between">
            <button onClick={onBack} disabled={state === "sending"} className="flex items-center gap-1.5 px-4 py-2 text-[12px] border border-tv-border-light rounded-full text-tv-text-secondary hover:text-tv-text-primary disabled:opacity-50" style={{ fontWeight: 500 }}><ChevronLeft size={12} />Back</button>
            <button onClick={handleSend} disabled={state === "sending"} className="flex items-center gap-1.5 px-5 py-2.5 text-[12px] rounded-full bg-tv-brand-bg text-white hover:bg-tv-brand-hover disabled:opacity-70" style={{ fontWeight: 600 }}>
              {state === "sending" ? <><Loader2 size={13} className="animate-spin" />Sending…</> : <><Send size={13} />Send Campaign</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">{icon}<span className="text-[11px] text-tv-text-secondary">{label}</span></div>
      <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
