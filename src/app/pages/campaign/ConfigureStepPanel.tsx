/**
 * ConfigureStepPanel — Step 1 of the multi-step campaign builder.
 *
 * Three sections:
 *   1. Success Metrics (REQUIRED) — pick 1-5 KPIs to track
 *   2. Campaign Tags — organize and categorize campaigns
 *   3. Advanced Settings (OPTIONAL) — sharing, auto-removal, proposals, shell
 */
import { useState, useCallback } from "react";
import {
  ChevronDown, ChevronUp, Plus, X,
  Lock, Globe, UserCheck, Settings, Trash2, Check, Info,
  TriangleAlert, Link2, Layers, Target, Tag,
} from "lucide-react";
import { SUCCESS_METRICS } from "./types";
import { MetricChip } from "../../components/MetricChip";
import { TagPicker } from "./TagPicker";
import { INPUT_CLS, SELECT_CLS } from "./styles";
import { PillSearchInput } from "../../components/PillSearchInput";

/* ── Types ─────────────────────────────────────────────────────────────────── */
type SharingMode = "private" | "organization" | "selected";

interface AutoRemovalRule {
  id: string;
  condition: string;
  sendFinalEmail: boolean;
  emailTemplate: string;
}

interface ConfigureStepPanelProps {
  campaignName?: string;
  onCampaignNameChange?: (name: string) => void;
  selectedMetrics: string[];
  onMetricsChange: (metrics: string[]) => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  markDirty?: () => void;
}

/* ── Mock data ─────────────────────────────────────────────────────────────── */
const CONDITION_OPTIONS_REMOVAL = [
  "Bounced email",
  "Unsubscribed",
  "Replied to message",
  "Clicked CTA link",
  "Viewed video",
  "No engagement after 3 sends",
  "Marked as spam",
];

const EMAIL_TEMPLATES = [
  "Default goodbye template",
  "Thank you for engaging",
  "We're sorry to see you go",
  "Custom template...",
];

let _ruleIdCounter = 1;

export function ConfigureStepPanel({
  campaignName,
  onCampaignNameChange,
  selectedMetrics,
  onMetricsChange,
  selectedTags,
  onTagsChange,
  markDirty,
}: ConfigureStepPanelProps) {
  const [showMetricsInfo, setShowMetricsInfo] = useState(false);
  const [showDropoffInfo, setShowDropoffInfo] = useState(false);

  const toggleMetric = useCallback((id: string) => {
    onMetricsChange(
      selectedMetrics.includes(id)
        ? selectedMetrics.filter(m => m !== id)
        : selectedMetrics.length >= 5
          ? selectedMetrics
          : [...selectedMetrics, id]
    );
    markDirty?.();
  }, [selectedMetrics, onMetricsChange, markDirty]);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sharingMode, setSharingMode] = useState<SharingMode>("private");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [peopleSearch, setPeopleSearch] = useState("");
  const [removalRules, setRemovalRules] = useState<AutoRemovalRule[]>([]);

  const addRemovalRule = () => {
    setRemovalRules(prev => [...prev, {
      id: `rule-${_ruleIdCounter++}`,
      condition: "",
      sendFinalEmail: true,
      emailTemplate: "",
    }]);
    markDirty?.();
  };

  const updateRule = (id: string, patch: Partial<AutoRemovalRule>) => {
    setRemovalRules(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
    markDirty?.();
  };

  const removeRule = (id: string) => {
    setRemovalRules(prev => prev.filter(r => r.id !== id));
    markDirty?.();
  };

  const MOCK_TEAM = [
    { id: "1", name: "Jordan Lee", email: "jordan.lee@hartwell.edu" },
    { id: "2", name: "Priya Patel", email: "priya.patel@hartwell.edu" },
    { id: "3", name: "Marcus Chen", email: "marcus.chen@hartwell.edu" },
    { id: "4", name: "Ava Thompson", email: "ava.thompson@hartwell.edu" },
  ];

  const filteredTeam = peopleSearch
    ? MOCK_TEAM.filter(t =>
        !selectedPeople.includes(t.id) &&
        (t.name.toLowerCase().includes(peopleSearch.toLowerCase()) || t.email.toLowerCase().includes(peopleSearch.toLowerCase()))
      )
    : MOCK_TEAM.filter(t => !selectedPeople.includes(t.id));

  return (
    <div className="max-w-[800px] xl:max-w-[960px] 2xl:max-w-[1100px] mx-auto space-y-5">
      <div>
        <h2 className="text-tv-text-primary mb-1" style={{ fontSize: "24px", fontWeight: 900 }}>Configure Campaign</h2>
        <p className="text-[13px] text-tv-text-secondary">Define how you'll measure success and configure additional settings.</p>
      </div>

      {/* 0. CAMPAIGN NAME */}
      {onCampaignNameChange && (
        <section className="rounded-lg border border-tv-border-light bg-white overflow-hidden">
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 700 }}>Campaign Name</p>
            </div>
            <input
              value={campaignName || ""}
              onChange={e => { onCampaignNameChange(e.target.value); markDirty?.(); }}
              placeholder="e.g. Spring Annual Fund Appeal"
              className="w-full border border-tv-border-light rounded-md px-4 py-3 text-[14px] text-tv-text-primary outline-none focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand transition-colors placeholder:text-tv-text-decorative"
            />
            <p className="text-[11px] text-tv-text-secondary mt-2">Give your campaign a memorable name so it's easy to find later.</p>
          </div>
        </section>
      )}

      {/* 1. SUCCESS METRICS */}
      <section className="rounded-lg border border-tv-border-light bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-tv-surface/50 border-b border-tv-border-divider">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-tv-brand-tint rounded-sm flex items-center justify-center">
              <Target size={15} className="text-tv-brand" />
            </div>
            <div>
              <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 700 }}>Success Metrics</p>
              <p className="text-[11px] text-tv-text-secondary">Define how you'll measure success (add multiple)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${selectedMetrics.length >= 1 ? "bg-tv-success-bg text-tv-success border border-tv-success-border" : "bg-tv-surface text-tv-text-secondary border border-tv-border-light"}`} style={{ fontWeight: 700 }}>
              {selectedMetrics.length}/5
            </span>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-tv-brand-tint text-tv-brand border border-tv-brand-bg/20" style={{ fontWeight: 700 }}>REQUIRED</span>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowMetricsInfo(v => !v)} aria-label="Toggle metrics explanation" aria-expanded={showMetricsInfo} className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${showMetricsInfo ? "bg-tv-brand-bg text-white" : "bg-tv-surface text-tv-text-secondary hover:bg-tv-surface-hover"}`}>
              <Info size={10} />
            </button>
            <p className="text-[11px] text-tv-text-secondary">Choose 1-5 metrics to track on your campaign dashboard.</p>
          </div>

          {showMetricsInfo && (
            <div className="p-3 bg-tv-brand-tint border border-tv-brand-bg/20 rounded-sm">
              <p className="text-[11px] text-tv-brand leading-relaxed">
                Success metrics define which KPIs appear on your campaign dashboard after sending. Pick the outcomes that matter most to your team.
              </p>
            </div>
          )}

          {selectedMetrics.length === 0 && (
            <div className="flex items-center gap-1.5 p-2.5 bg-tv-warning-bg border border-tv-warning-border rounded-sm">
              <TriangleAlert size={11} className="text-tv-warning shrink-0" />
              <p className="text-[10px] text-tv-warning">Select at least 1 metric to continue.</p>
            </div>
          )}
          {selectedMetrics.length >= 5 && (
            <div className="flex items-center gap-1.5 p-2.5 bg-tv-info-bg border border-tv-info-border rounded-sm">
              <Info size={11} className="text-tv-info shrink-0" />
              <p className="text-[10px] text-tv-info">Maximum reached. Deselect one to swap.</p>
            </div>
          )}

          <div>
            <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5" style={{ fontWeight: 600 }}>Delivery</p>
            <div className="flex flex-wrap gap-1.5">
              {SUCCESS_METRICS.filter(m => m.category === "delivery").map(m => (
                <MetricChip key={m.id} metric={m} active={selectedMetrics.includes(m.id)} disabled={!selectedMetrics.includes(m.id) && selectedMetrics.length >= 5} onToggle={toggleMetric} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5" style={{ fontWeight: 600 }}>Engagement</p>
            <div className="flex flex-wrap gap-1.5">
              {SUCCESS_METRICS.filter(m => m.category === "engagement").map(m => (
                <MetricChip key={m.id} metric={m} active={selectedMetrics.includes(m.id)} disabled={!selectedMetrics.includes(m.id) && selectedMetrics.length >= 5} onToggle={toggleMetric} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <p className="text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Drop-off & Issues</p>
              <button onClick={() => setShowDropoffInfo(v => !v)} aria-label="Toggle drop-off explanation" aria-expanded={showDropoffInfo} className={`w-4 h-4 rounded-full flex items-center justify-center transition-colors ${showDropoffInfo ? "bg-tv-danger text-white" : "bg-tv-surface text-tv-text-decorative hover:bg-tv-surface-hover"}`}>
                <Info size={8} />
              </button>
            </div>
            {showDropoffInfo && (
              <div className="p-2.5 bg-tv-danger-bg border border-tv-danger/15 rounded-sm mb-1.5">
                <p className="text-[10px] text-tv-danger leading-relaxed">
                  These are watchdog metrics — track them to spot deliverability problems early.
                </p>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {SUCCESS_METRICS.filter(m => m.category === "negative").map(m => (
                <MetricChip key={m.id} metric={m} active={selectedMetrics.includes(m.id)} disabled={!selectedMetrics.includes(m.id) && selectedMetrics.length >= 5} negative onToggle={toggleMetric} />
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowMetricsInfo(true)}
            className="w-full py-2.5 border-2 border-dashed border-tv-border-light rounded-md text-[11px] text-tv-brand hover:border-tv-brand-bg/40 hover:bg-tv-brand-tint/20 transition-colors"
            style={{ fontWeight: 500 }}
          >
            + Add another success metric
          </button>
        </div>
      </section>

      {/* 2. CAMPAIGN TAGS */}
      <section className="rounded-lg border border-tv-border-light bg-white overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 bg-tv-surface/50 border-b border-tv-border-divider">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-tv-brand-tint rounded-sm flex items-center justify-center">
              <Tag size={15} className="text-tv-brand" />
            </div>
            <div>
              <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 700 }}>Campaign Tags</p>
              <p className="text-[11px] text-tv-text-secondary">Add tags to help organize and find your campaigns</p>
            </div>
          </div>
        </div>
        <div className="p-5">
          <TagPicker selectedTags={selectedTags} onTagsChange={onTagsChange} markDirty={markDirty} />
        </div>
      </section>

      {/* 3. ADVANCED SETTINGS */}
      <section className="rounded-lg border border-tv-border-light bg-white overflow-hidden">
        <button
          onClick={() => setAdvancedOpen(v => !v)}
          className="w-full flex items-center justify-between px-5 py-3.5 bg-tv-surface/50 border-b border-tv-border-divider hover:bg-tv-surface/70 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-tv-surface-active rounded-sm flex items-center justify-center">
              <Settings size={15} className="text-tv-text-secondary" />
            </div>
            <div className="text-left">
              <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 700 }}>Advanced Settings</p>
              <p className="text-[11px] text-tv-text-secondary">Visibility, auto-removal rules, and proposals</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-tv-surface text-tv-text-secondary border border-tv-border-light" style={{ fontWeight: 600 }}>OPTIONAL</span>
            {advancedOpen ? <ChevronUp size={16} className="text-tv-text-secondary" /> : <ChevronDown size={16} className="text-tv-text-secondary" />}
          </div>
        </button>

        {advancedOpen && (
          <div className="divide-y divide-tv-border-divider">
            {/* Sharing */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Lock size={13} className="text-tv-text-primary" />
                <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 700 }}>Sharing</p>
              </div>
              <p className="text-[11px] text-tv-text-secondary">Control who can access this campaign</p>

              <div className="space-y-2">
                {([
                  { id: "private" as const, icon: Lock, label: "Only me", desc: "Private — no one else can see this campaign" },
                  { id: "organization" as const, icon: Globe, label: "Everyone in my organization", desc: "All team members can access" },
                  { id: "selected" as const, icon: UserCheck, label: "Selected people", desc: "Only specific team members you choose" },
                ] as const).map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setSharingMode(opt.id); markDirty?.(); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-md border-2 text-left transition-all ${
                      sharingMode === opt.id
                        ? "border-tv-brand-bg bg-tv-brand-tint/40"
                        : "border-tv-border-light hover:border-tv-border-strong bg-white"
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      sharingMode === opt.id ? "border-tv-brand-bg bg-tv-brand-bg" : "border-tv-border-light"
                    }`}>
                      {sharingMode === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <opt.icon size={14} className={sharingMode === opt.id ? "text-tv-brand" : "text-tv-text-secondary"} />
                    <div>
                      <p className={`text-[12px] ${sharingMode === opt.id ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 600 }}>{opt.label}</p>
                      <p className="text-[10px] text-tv-text-secondary">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              {sharingMode === "selected" && (
                <div className="pl-10 space-y-2">
                  <PillSearchInput value={peopleSearch} onChange={setPeopleSearch} placeholder="Search team members\u2026" size="sm" />
                  {filteredTeam.length > 0 && (
                    <div className="border border-tv-border-light rounded-sm overflow-hidden divide-y divide-tv-border-divider">
                      {filteredTeam.slice(0, 4).map(t => (
                        <button key={t.id} onClick={() => { setSelectedPeople(p => [...p, t.id]); setPeopleSearch(""); markDirty?.(); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-tv-surface/60 transition-colors">
                          <div className="w-6 h-6 rounded-full bg-tv-brand-bg/60 flex items-center justify-center shrink-0">
                            <span className="text-[8px] text-white" style={{ fontWeight: 700 }}>{t.name.split(" ").map(n => n[0]).join("")}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-tv-text-primary truncate">{t.name}</p>
                            <p className="text-[9px] text-tv-text-decorative truncate">{t.email}</p>
                          </div>
                          <Plus size={12} className="text-tv-brand shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedPeople.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPeople.map(id => {
                        const person = MOCK_TEAM.find(t => t.id === id);
                        if (!person) return null;
                        return (
                          <span key={id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-tv-brand-tint border border-tv-brand-bg/20 text-[10px] text-tv-brand" style={{ fontWeight: 500 }}>
                            {person.name}
                            <button onClick={() => { setSelectedPeople(p => p.filter(pid => pid !== id)); markDirty?.(); }} className="hover:text-tv-brand-hover">
                              <X size={10} />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auto-Removal Rules */}
            <div className="p-5 space-y-3">
              <div>
                <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 700 }}>Auto-Removal Rules</p>
                <p className="text-[11px] text-tv-text-secondary mt-0.5">Define conditions that should lead to a constituent being removed from the campaign.</p>
              </div>

              {removalRules.map((rule, idx) => (
                <div key={rule.id} className="p-4 rounded-md border border-tv-border-light bg-tv-surface/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Rule {idx + 1}</p>
                    <button onClick={() => removeRule(rule.id)} className="w-5 h-5 rounded-full flex items-center justify-center text-tv-text-decorative hover:text-tv-danger hover:bg-tv-danger-bg transition-colors">
                      <Trash2 size={10} />
                    </button>
                  </div>

                  <div>
                    <p className="text-[11px] text-tv-text-secondary mb-1.5">Constituent should be removed from the campaign if they:</p>
                    <select value={rule.condition} onChange={e => updateRule(rule.id, { condition: e.target.value })} aria-label="Removal condition" className={SELECT_CLS}>
                      <option value="">Select a condition...</option>
                      {CONDITION_OPTIONS_REMOVAL.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div>
                    <p className="text-[11px] text-tv-brand mb-1.5" style={{ fontWeight: 600 }}>Send a final email before removal?</p>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={rule.sendFinalEmail} onChange={() => updateRule(rule.id, { sendFinalEmail: true })} className="w-3.5 h-3.5 accent-[#7c45b0]" />
                        <span className="text-[11px] text-tv-text-primary">Yes</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="radio" checked={!rule.sendFinalEmail} onChange={() => updateRule(rule.id, { sendFinalEmail: false })} className="w-3.5 h-3.5 accent-[#7c45b0]" />
                        <span className="text-[11px] text-tv-text-primary">No</span>
                      </label>
                    </div>
                  </div>

                  {rule.sendFinalEmail && (
                    <div>
                      <p className="text-[11px] text-tv-brand mb-1.5" style={{ fontWeight: 600 }}>Email template:</p>
                      <select value={rule.emailTemplate} onChange={e => updateRule(rule.id, { emailTemplate: e.target.value })} aria-label="Email template" className={SELECT_CLS}>
                        <option value="">Select a template...</option>
                        {["Default goodbye template", "Thank you for engaging", "We're sorry to see you go", "Custom template..."].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={addRemovalRule}
                className="w-full py-2.5 border-2 border-dashed border-tv-border-light rounded-md text-[11px] text-tv-brand hover:border-tv-brand-bg/40 hover:bg-tv-brand-tint/20 transition-colors"
                style={{ fontWeight: 500 }}
              >
                + Add another removal rule
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
