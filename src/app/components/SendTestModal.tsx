import { useState, useEffect } from "react";
import { Send, X, Check } from "lucide-react";
import { TvTooltip } from "./TvTooltip";
import { INPUT_CLS } from "../pages/campaign/styles";

interface Constituent {
  id: number;
  name: string;
  email: string;
  classYear?: number;
  city?: string;
}

interface SendTestModalProps {
  opened: boolean;
  onClose: () => void;
  onSend: (email: string, previewAs: number) => void;
  /** Optional send-to-group callback. When provided the single/group toggle is shown. */
  onSendGroup?: (emails: string[], previewAs: number) => void;
  constituents: Constituent[];
  /** CSS class for the label elements */
  labelCls?: string;
  /** CSS class for the tag-input wrapper (group mode) */
  tagInputWrapperCls?: string;
}

export function SendTestModal({
  opened,
  onClose,
  onSend,
  onSendGroup,
  constituents,
  labelCls = "text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5 block font-semibold",
  tagInputWrapperCls,
}: SendTestModalProps) {
  const [email, setEmail] = useState("kelley.molt@hartwell.edu");
  const [previewAs, setPreviewAs] = useState(0);
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<"single" | "group">("single");
  const [group, setGroup] = useState<string[]>(["kelley.molt@hartwell.edu", "james.okafor@hartwell.edu"]);
  const [newEmail, setNewEmail] = useState("");

  const supportsGroup = !!onSendGroup;

  // Close on Escape (WCAG 2.1.1)
  useEffect(() => {
    if (!opened) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") { onClose(); setSending(false); } };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [opened, onClose]);

  if (!opened) return null;

  const handleSend = () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      if (supportsGroup && mode === "group") {
        onSendGroup!(group, previewAs);
      } else {
        onSend(email, previewAs);
      }
    }, 1500);
  };

  const canSend = supportsGroup && mode === "group"
    ? group.length > 0
    : !!email.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl border border-tv-border-light shadow-xl w-full max-w-[560px] overflow-hidden">
        <div className="px-6 pt-5 pb-3 border-b border-tv-border-divider flex items-center justify-between">
          <div>
            <h3 className="text-[16px] text-tv-text-primary" style={{ fontWeight: 900 }}>Send Test</h3>
            <p className="text-[11px] text-tv-text-secondary mt-0.5">Preview exactly what your constituents will receive.</p>
          </div>
          <TvTooltip label="Close">
            <button
              onClick={() => { onClose(); setSending(false); }}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-tv-surface transition-colors"
              aria-label="Close send test modal"
            >
              <X size={14} className="text-tv-text-secondary" />
            </button>
          </TvTooltip>
        </div>
        <div className="px-6 py-4 space-y-4">
          {/* Single vs Group toggle — only when group mode is supported */}
          {supportsGroup && (
            <div className="flex rounded-sm border border-tv-border-light overflow-hidden">
              <button onClick={() => setMode("single")} className={`flex-1 py-2 text-[11px] transition-colors ${mode === "single" ? "bg-tv-brand-bg text-white" : "text-tv-text-secondary hover:bg-tv-surface-hover"} font-semibold`}>Single Email</button>
              <button onClick={() => setMode("group")} className={`flex-1 py-2 text-[11px] transition-colors ${mode === "group" ? "bg-tv-brand-bg text-white" : "text-tv-text-secondary hover:bg-tv-surface-hover"} font-semibold`}>Test Group</button>
            </div>
          )}

          {supportsGroup && mode === "group" ? (
            <div>
              <label className={labelCls}>Test Group ({group.length} addresses)</label>
              <div className={`${tagInputWrapperCls ?? ""} mb-1`}>
                {group.map((addr, i) => (
                  <span key={i} className="inline-flex items-center gap-1 bg-tv-brand-tint border border-tv-border rounded-full px-2 py-0.5 text-[10px] text-tv-brand">
                    {addr}
                    <button onClick={() => setGroup(g => g.filter((_, j) => j !== i))} className="min-w-6 min-h-6 flex items-center justify-center hover:text-tv-danger" aria-label={`Remove ${addr}`}><X size={8} /></button>
                  </span>
                ))}
                <input value={newEmail} onChange={e => setNewEmail(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === "Enter" || e.key === ",") && newEmail.trim()) {
                      e.preventDefault();
                      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim()) && !group.includes(newEmail.trim())) {
                        setGroup(g => [...g, newEmail.trim()]);
                        setNewEmail("");
                      }
                    }
                  }}
                  placeholder={group.length === 0 ? "Add email addresses..." : "Add another..."}
                  aria-label="Test email address"
                  className="flex-1 min-w-[80px] text-[11px] outline-none focus:ring-1 focus:ring-tv-brand/40 bg-transparent" />
              </div>
              <p className="text-[9px] text-tv-text-decorative">Press Enter or comma to add. This group persists across test sends.</p>
            </div>
          ) : (
            <div>
              <label className={labelCls}>Send test to</label>
              <input value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Enter email address"
                className={INPUT_CLS} />
              <p className="text-[10px] text-tv-text-decorative mt-1">The test will be sent to this email address.</p>
            </div>
          )}

          <div>
            <label className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5 block flex items-center gap-1 font-semibold">
              Preview as constituent
              <span className="text-[8px] px-1.5 py-0.5 bg-tv-brand-tint text-tv-brand rounded-full" style={{ fontWeight: 700 }}>Merge fields</span>
            </label>
            <p className="text-[10px] text-tv-text-secondary mb-2">Select which constituent&rsquo;s data to use for merge field resolution in the test.</p>
            <div className="space-y-1.5">
              {constituents.map(r => (
                <button key={r.id} onClick={() => setPreviewAs(r.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-sm border text-left transition-all ${previewAs === r.id ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${previewAs === r.id ? "border-tv-brand-bg bg-tv-brand-bg" : "border-tv-border-light"}`}>
                    {previewAs === r.id && <Check size={8} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-[12px] text-tv-text-primary">{r.name}</p>
                      {r.classYear && <span className="text-[9px] text-tv-text-decorative">'{String(r.classYear).slice(-2)}</span>}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] text-tv-text-secondary truncate">{r.email}</p>
                      {r.city && <span className="text-[9px] text-tv-text-decorative shrink-0">{r.city}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex items-center justify-between">
          <button onClick={() => { onClose(); setSending(false); }}
            className="px-4 py-2 text-[12px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors" style={{ fontWeight: 500 }}>Cancel</button>
          <button
            onClick={handleSend}
            disabled={!canSend || sending}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-[13px] rounded-full transition-colors ${sending ? "bg-tv-brand-bg/70 text-white cursor-not-allowed" : "bg-tv-brand-bg text-white hover:bg-tv-brand-hover"} disabled:opacity-50 font-semibold`}
          >
            {sending ? <><span className="animate-spin">&#9696;</span>Sending...</> : <><Send size={12} />Send Test</>}
          </button>
        </div>
      </div>
    </div>
  );
}
