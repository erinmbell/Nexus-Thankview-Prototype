/**
 * VideoRequestCampaign — Standalone Video Request campaign page.
 *
 * Provides a dedicated experience for creating and managing video request
 * campaigns, separate from the general multi-step campaign builder.
 *
 * Tabs:
 *   1. Setup — name, delivery type, instructions, due date, reminders
 *   2. Recorders — manage who will record (constituent picker)
 *   3. Submissions — view submitted videos
 */
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft, Video, Mail, MessageSquare, Link2, Copy,
  Calendar, Bell, Check, X, Plus, Clock, Users,
  Play, Eye, Download, Search, MoreHorizontal,
  AlertCircle, Info, Send,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { TV } from "../theme";

// ── Types ────────────────────────────────────────────────────────────────────
type Tab = "setup" | "recorders" | "submissions";
type DeliveryType = "email" | "sms" | "link";

interface Submission {
  id: number;
  recorderName: string;
  recorderEmail: string;
  date: string;
  duration: string;
  status: "submitted" | "approved" | "rejected";
  thumbnailColor: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────
const MOCK_SUBMISSIONS: Submission[] = [
  { id: 1, recorderName: "James Okafor",    recorderEmail: "j.okafor@hartwell.edu",  date: "Mar 20, 2026", duration: "1:32", status: "submitted",  thumbnailColor: "#7c45b0" },
  { id: 2, recorderName: "Michelle Park",   recorderEmail: "m.park@hartwell.edu",    date: "Mar 19, 2026", duration: "2:05", status: "approved",   thumbnailColor: "#1e3a8a" },
  { id: 3, recorderName: "Sarah Chen",      recorderEmail: "s.chen@hartwell.edu",    date: "Mar 18, 2026", duration: "0:48", status: "submitted",  thumbnailColor: "#047857" },
  { id: 4, recorderName: "Derek Williams",  recorderEmail: "d.williams@hartwell.edu", date: "Mar 17, 2026", duration: "1:15", status: "rejected",   thumbnailColor: "#b91c1c" },
  { id: 5, recorderName: "Kelley Molt",     recorderEmail: "kelley.molt@hartwell.edu", date: "Mar 16, 2026", duration: "1:58", status: "approved",   thumbnailColor: "#0369a1" },
];

const REMINDER_DAYS = [14, 7, 5, 3, 2, 1];

const MOCK_RECORDERS = [
  { id: 1, name: "James Okafor",   email: "j.okafor@hartwell.edu",   status: "recorded" as const },
  { id: 2, name: "Michelle Park",  email: "m.park@hartwell.edu",     status: "recorded" as const },
  { id: 3, name: "Sarah Chen",     email: "s.chen@hartwell.edu",     status: "recorded" as const },
  { id: 4, name: "Derek Williams", email: "d.williams@hartwell.edu", status: "pending" as const },
  { id: 5, name: "Kelley Molt",    email: "kelley.molt@hartwell.edu", status: "recorded" as const },
  { id: 6, name: "Tyler Hernandez", email: "t.hernandez@hartwell.edu", status: "pending" as const },
  { id: 7, name: "Anna Kowalski",  email: "a.kowalski@hartwell.edu", status: "not_sent" as const },
];

// ── Component ────────────────────────────────────────────────────────────────
export function VideoRequestCampaign() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [tab, setTab] = useState<Tab>("setup");

  // Setup state
  const [name, setName] = useState("Spring Thank You — Video Request");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("email");
  const [instructions, setInstructions] = useState("Please record a short thank-you video for your assigned donor. Mention their name and gift if possible. Keep it under 2 minutes.");
  const [dueDate, setDueDate] = useState("2026-04-15");
  const [activeReminders, setActiveReminders] = useState<Set<number>>(new Set([7, 3, 1]));
  const [submissionsOpen, setSubmissionsOpen] = useState(true);
  const shareableUrl = "https://thankview.com/vr/hartwell-spring-2026";

  // Recorders state
  const [recorderSearch, setRecorderSearch] = useState("");
  const [recorderFilter, setRecorderFilter] = useState<"all" | "recorded" | "pending" | "not_sent">("all");
  const [recorderPage, setRecorderPage] = useState(1);

  // Submissions state
  const [subSearch, setSubSearch] = useState("");
  const [subFilter, setSubFilter] = useState<"all" | "submitted" | "approved" | "rejected">("all");

  const toggleReminder = (d: number) => setActiveReminders(prev => {
    const next = new Set(prev);
    next.has(d) ? next.delete(d) : next.add(d);
    return next;
  });

  const filteredSubmissions = MOCK_SUBMISSIONS.filter(s => {
    if (subFilter !== "all" && s.status !== subFilter) return false;
    if (subSearch && !s.recorderName.toLowerCase().includes(subSearch.toLowerCase())) return false;
    return true;
  });

  const TABS: { key: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { key: "setup",       label: "Setup",       icon: Video },
    { key: "recorders",   label: "Recorders",   icon: Users, count: MOCK_RECORDERS.length },
    { key: "submissions", label: "Submissions",  icon: Play,  count: MOCK_SUBMISSIONS.length },
  ];

  const statusColor = (s: string) => s === "approved" ? TV.success : s === "rejected" ? TV.danger : TV.warning;
  const statusBg    = (s: string) => s === "approved" ? TV.successBg : s === "rejected" ? TV.dangerBg : TV.warningBg;
  const statusLabel = (s: string) => s === "approved" ? "Approved" : s === "rejected" ? "Rejected" : "Submitted";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-tv-border-divider bg-white shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/campaigns")} className="w-8 h-8 flex items-center justify-center text-tv-text-secondary hover:text-tv-text-primary transition-colors rounded-full hover:bg-tv-surface">
            <ChevronLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Video size={16} style={{ color: TV.brand }} />
              <h1 className="text-[18px] text-tv-text-primary truncate" style={{ fontWeight: 800 }}>{name || "Untitled Video Request"}</h1>
            </div>
            <p className="text-[11px] text-tv-text-secondary mt-0.5">Video Request Campaign</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => { show("Video request campaign saved as draft!", "success"); }}
              className="px-4 py-2 text-[12px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors"
              style={{ fontWeight: 500 }}
            >
              Save Draft
            </button>
            <button
              onClick={() => { show("Video request sent to recorders!", "success"); }}
              className="flex items-center gap-1.5 px-5 py-2 text-[12px] text-white rounded-full bg-tv-brand-bg hover:bg-tv-brand-hover transition-colors"
              style={{ fontWeight: 600 }}
            >
              <Send size={13} />Send Request
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 bg-white border-b border-tv-border-divider shrink-0">
        <div className="flex items-center gap-1">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-[13px] border-b-2 transition-colors ${
                tab === t.key
                  ? "border-tv-brand text-tv-brand"
                  : "border-transparent text-tv-text-secondary hover:text-tv-text-primary"
              }`}
              style={{ fontWeight: tab === t.key ? 600 : 400 }}
            >
              <t.icon size={14} />
              {t.label}
              {t.count != null && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? "bg-tv-brand-tint text-tv-brand" : "bg-tv-surface text-tv-text-secondary"
                }`} style={{ fontWeight: 600 }}>{t.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-tv-surface p-6">
        <div className="max-w-[720px] mx-auto space-y-5">

          {/* Success Metric Banner — video request uses "Submitted" not email metrics */}
          <div className="flex items-center gap-3 p-3.5 bg-tv-brand-tint/40 border border-tv-brand-bg/20 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-tv-brand-bg flex items-center justify-center shrink-0">
              <Check size={14} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] text-tv-brand" style={{ fontWeight: 700 }}>Success Metric: Replied &amp; Submitted a Request</p>
              <p className="text-[10px] text-tv-text-secondary">This campaign tracks video submissions, not standard email metrics like open rate.</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[16px] text-tv-brand" style={{ fontWeight: 800 }}>{MOCK_SUBMISSIONS.length}</p>
              <p className="text-[9px] text-tv-text-secondary">submitted</p>
            </div>
          </div>

          {/* ═══ SETUP TAB ═══ */}
          {tab === "setup" && (
            <>
              {/* Campaign Name */}
              <div className="bg-white rounded-xl border border-tv-border-light p-5 space-y-4">
                <h3 className="text-[14px] text-tv-text-primary" style={{ fontWeight: 700 }}>Campaign Details</h3>
                <div>
                  <label className="tv-label mb-1.5 block">Campaign Name</label>
                  <input value={name} onChange={e => setName(e.target.value)}
                    className="w-full border border-tv-border-light rounded-lg px-3 py-2.5 text-[13px] text-tv-text-primary outline-none focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand" />
                </div>
              </div>

              {/* Delivery Type */}
              <div className="bg-white rounded-xl border border-tv-border-light p-5 space-y-4">
                <h3 className="text-[14px] text-tv-text-primary" style={{ fontWeight: 700 }}>Delivery Method</h3>
                <p className="text-[12px] text-tv-text-secondary -mt-2">How should recorders receive the recording request?</p>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { id: "email" as const, icon: Mail,          label: "Email",          desc: "Send recording link via email" },
                    { id: "sms"   as const, icon: MessageSquare, label: "SMS",            desc: "Send recording link via text" },
                    { id: "link"  as const, icon: Link2,         label: "Shareable Link", desc: "Share a link anyone can use" },
                  ] as const).map(d => (
                    <button
                      key={d.id}
                      onClick={() => setDeliveryType(d.id)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
                        deliveryType === d.id
                          ? "border-tv-brand bg-tv-brand-tint"
                          : "border-tv-border-light hover:border-tv-border-strong bg-white"
                      }`}
                    >
                      <d.icon size={20} style={{ color: deliveryType === d.id ? TV.brand : TV.textSecondary }} />
                      <span className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>{d.label}</span>
                      <span className="text-[10px] text-tv-text-secondary">{d.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Shareable URL (shown when delivery = link) */}
                {deliveryType === "link" && (
                  <div className="bg-tv-surface rounded-lg p-3">
                    <label className="tv-label mb-1.5 block">Shareable Recording URL</label>
                    <div className="flex items-center gap-2">
                      <input readOnly value={shareableUrl}
                        className="flex-1 bg-white border border-tv-border-light rounded-lg px-3 py-2 text-[12px] text-tv-text-secondary font-mono" />
                      <button onClick={() => { navigator.clipboard?.writeText(shareableUrl); show("Link copied!", "success"); }}
                        className="flex items-center gap-1.5 px-3 py-2 text-[11px] text-tv-brand border border-tv-brand rounded-lg hover:bg-tv-brand-tint transition-colors"
                        style={{ fontWeight: 600 }}>
                        <Copy size={12} />Copy
                      </button>
                    </div>
                    <p className="text-[10px] text-tv-text-secondary mt-1.5">Anyone with this link can submit a recording. You can disable submissions at any time.</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-white rounded-xl border border-tv-border-light p-5 space-y-4">
                <h3 className="text-[14px] text-tv-text-primary" style={{ fontWeight: 700 }}>Recording Instructions</h3>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4}
                  className="w-full border border-tv-border-light rounded-lg px-3 py-2.5 text-[13px] text-tv-text-primary outline-none focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand resize-none"
                  placeholder="Tell recorders what to say and how long the video should be..." />
              </div>

              {/* Due Date & Reminders */}
              <div className="bg-white rounded-xl border border-tv-border-light p-5 space-y-4">
                <h3 className="text-[14px] text-tv-text-primary" style={{ fontWeight: 700 }}>Due Date & Reminders</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="tv-label mb-1.5 block">Due Date</label>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} style={{ color: TV.textSecondary }} />
                      <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                        className="flex-1 border border-tv-border-light rounded-lg px-3 py-2 text-[13px] text-tv-text-primary outline-none focus:ring-2 focus:ring-tv-brand/30" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="tv-label mb-1.5 block">Automatic Reminders</label>
                  <p className="text-[11px] text-tv-text-secondary mb-2">Select which days before the due date recorders should be reminded.</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {REMINDER_DAYS.map(d => (
                      <button
                        key={d}
                        onClick={() => toggleReminder(d)}
                        className={`px-3 py-1.5 rounded-full text-[11px] border transition-all ${
                          activeReminders.has(d)
                            ? "border-tv-brand bg-tv-brand-tint text-tv-brand"
                            : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"
                        }`}
                        style={{ fontWeight: activeReminders.has(d) ? 600 : 400 }}
                      >
                        {d} day{d !== 1 ? "s" : ""} before
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-tv-text-secondary mt-2">
                    {activeReminders.size > 0 ? `${activeReminders.size} reminder${activeReminders.size !== 1 ? "s" : ""} scheduled` : "No reminders set"}
                  </p>
                </div>
              </div>

              {/* Submissions Control */}
              <div className="bg-white rounded-xl border border-tv-border-light p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[14px] text-tv-text-primary" style={{ fontWeight: 700 }}>Accept Submissions</h3>
                    <p className="text-[12px] text-tv-text-secondary mt-1">When turned off, recorders can no longer submit videos through this request.</p>
                  </div>
                  <button
                    onClick={() => setSubmissionsOpen(!submissionsOpen)}
                    role="switch" aria-checked={submissionsOpen}
                    className="flex items-center gap-2"
                  >
                    <div className={`w-10 h-[22px] rounded-full relative transition-colors ${submissionsOpen ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                      <div className={`w-4 h-4 bg-white rounded-full absolute top-[3px] shadow-sm transition-all ${submissionsOpen ? "left-[21px]" : "left-[3px]"}`} />
                    </div>
                    <span className={`text-[11px] ${submissionsOpen ? "text-tv-brand" : "text-tv-text-secondary"}`} style={{ fontWeight: 600 }}>
                      {submissionsOpen ? "Open" : "Closed"}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ═══ RECORDERS TAB ═══ */}
          {tab === "recorders" && (() => {
            const recSearch = recorderSearch.toLowerCase();
            const filteredRecorders = MOCK_RECORDERS.filter(r => {
              if (recorderFilter !== "all" && r.status !== recorderFilter) return false;
              if (recSearch && !r.name.toLowerCase().includes(recSearch) && !r.email.toLowerCase().includes(recSearch)) return false;
              return true;
            });
            const recorded = MOCK_RECORDERS.filter(r => r.status === "recorded").length;
            const pending = MOCK_RECORDERS.filter(r => r.status === "pending").length;
            const notSent = MOCK_RECORDERS.filter(r => r.status === "not_sent").length;
            const PAGE_SIZE = 20;
            const visibleRecorders = filteredRecorders.slice(0, recorderPage * PAGE_SIZE);
            const hasMore = visibleRecorders.length < filteredRecorders.length;

            return (
            <>
              {/* Search + Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-text-secondary" />
                  <input value={recorderSearch} onChange={e => { setRecorderSearch(e.target.value); setRecorderPage(1); }} aria-label="Search recorders" placeholder="Search recorders..."
                    className="w-full pl-9 pr-3 py-2 border border-tv-border-light rounded-full text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand bg-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  {(["all", "recorded", "pending", "not_sent"] as const).map(f => (
                    <button key={f} onClick={() => { setRecorderFilter(f); setRecorderPage(1); }}
                      className={`px-3 py-1.5 rounded-full text-[11px] border transition-all ${
                        recorderFilter === f ? "border-tv-brand bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong bg-white"
                      }`} style={{ fontWeight: recorderFilter === f ? 600 : 400 }}>
                      {f === "all" ? "All" : f === "not_sent" ? "Not Sent" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary bar */}
              <div className="flex items-center gap-4 bg-white rounded-xl border border-tv-border-light px-5 py-3">
                <div className="text-center flex-1">
                  <p className="text-[18px] text-tv-text-primary" style={{ fontWeight: 700 }}>{MOCK_RECORDERS.length}</p>
                  <p className="text-[10px] text-tv-text-secondary">Total</p>
                </div>
                <div className="w-px h-8 bg-tv-border-divider" />
                <div className="text-center flex-1">
                  <p className="text-[18px]" style={{ fontWeight: 700, color: TV.success }}>{recorded}</p>
                  <p className="text-[10px] text-tv-text-secondary">Recorded</p>
                </div>
                <div className="w-px h-8 bg-tv-border-divider" />
                <div className="text-center flex-1">
                  <p className="text-[18px]" style={{ fontWeight: 700, color: TV.warning }}>{pending}</p>
                  <p className="text-[10px] text-tv-text-secondary">Pending</p>
                </div>
                <div className="w-px h-8 bg-tv-border-divider" />
                <div className="text-center flex-1">
                  <p className="text-[18px]" style={{ fontWeight: 700, color: TV.textSecondary }}>{notSent}</p>
                  <p className="text-[10px] text-tv-text-secondary">Not Sent</p>
                </div>
              </div>

              {/* Recorder list */}
              <div className="bg-white rounded-xl border border-tv-border-light overflow-hidden">
                <div className="px-5 py-3.5 border-b border-tv-border-divider flex items-center justify-between">
                  <p className="text-[12px] text-tv-text-secondary">
                    Showing <span style={{ fontWeight: 600 }} className="text-tv-text-primary">{visibleRecorders.length}</span> of {filteredRecorders.length} recorders
                  </p>
                  <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-tv-brand border border-tv-brand rounded-full hover:bg-tv-brand-tint transition-colors" style={{ fontWeight: 600 }}>
                    <Plus size={12} />Add Recorders
                  </button>
                </div>
                {visibleRecorders.map((r, i) => {
                  const statusClr = r.status === "recorded" ? TV.success : r.status === "pending" ? TV.warning : TV.textSecondary;
                  const statusLbl = r.status === "recorded" ? "Recorded" : r.status === "pending" ? "Pending" : "Not Sent";
                  return (
                    <div key={r.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-tv-surface-hover transition-colors" style={{ borderBottom: i < visibleRecorders.length - 1 ? `1px solid ${TV.borderDivider}` : undefined }}>
                      <div className="w-7 h-7 rounded-full bg-tv-brand-tint flex items-center justify-center text-[10px] text-tv-brand shrink-0" style={{ fontWeight: 700 }}>
                        {r.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{r.name}</p>
                        <p className="text-[10px] text-tv-text-secondary truncate">{r.email}</p>
                      </div>
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px]" style={{ backgroundColor: statusClr + "18", color: statusClr, fontWeight: 600 }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusClr }} />
                        {statusLbl}
                      </div>
                    </div>
                  );
                })}
                {hasMore && (
                  <button onClick={() => setRecorderPage(p => p + 1)}
                    className="w-full py-3 text-[12px] text-tv-brand hover:bg-tv-brand-tint/30 transition-colors border-t border-tv-border-divider" style={{ fontWeight: 600 }}>
                    Load more ({filteredRecorders.length - visibleRecorders.length} remaining)
                  </button>
                )}
                {filteredRecorders.length === 0 && (
                  <div className="px-5 py-8 text-center">
                    <p className="text-[13px] text-tv-text-secondary">No recorders match your search.</p>
                  </div>
                )}
              </div>
            </>
            );
          })()}

          {/* ═══ SUBMISSIONS TAB ═══ */}
          {tab === "submissions" && (
            <>
              {/* Filters */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px] relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tv-text-secondary" />
                  <input value={subSearch} onChange={e => setSubSearch(e.target.value)} aria-label="Search submissions" placeholder="Search submissions..."
                    className="w-full pl-9 pr-3 py-2 border border-tv-border-light rounded-full text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand bg-white" />
                </div>
                <div className="flex items-center gap-1.5">
                  {(["all", "submitted", "approved", "rejected"] as const).map(f => (
                    <button key={f} onClick={() => setSubFilter(f)}
                      className={`px-3 py-1.5 rounded-full text-[11px] border transition-all ${
                        subFilter === f ? "border-tv-brand bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong bg-white"
                      }`} style={{ fontWeight: subFilter === f ? 600 : 400 }}>
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary bar */}
              <div className="flex items-center gap-4 bg-white rounded-xl border border-tv-border-light px-5 py-3">
                <div className="text-center flex-1">
                  <p className="text-[18px] text-tv-text-primary" style={{ fontWeight: 700 }}>{MOCK_SUBMISSIONS.length}</p>
                  <p className="text-[10px] text-tv-text-secondary">Total</p>
                </div>
                <div className="w-px h-8 bg-tv-border-divider" />
                <div className="text-center flex-1">
                  <p className="text-[18px]" style={{ fontWeight: 700, color: TV.warning }}>{MOCK_SUBMISSIONS.filter(s => s.status === "submitted").length}</p>
                  <p className="text-[10px] text-tv-text-secondary">Pending Review</p>
                </div>
                <div className="w-px h-8 bg-tv-border-divider" />
                <div className="text-center flex-1">
                  <p className="text-[18px]" style={{ fontWeight: 700, color: TV.success }}>{MOCK_SUBMISSIONS.filter(s => s.status === "approved").length}</p>
                  <p className="text-[10px] text-tv-text-secondary">Approved</p>
                </div>
                <div className="w-px h-8 bg-tv-border-divider" />
                <div className="text-center flex-1">
                  <p className="text-[18px]" style={{ fontWeight: 700, color: TV.danger }}>{MOCK_SUBMISSIONS.filter(s => s.status === "rejected").length}</p>
                  <p className="text-[10px] text-tv-text-secondary">Rejected</p>
                </div>
              </div>

              {/* Submissions grid */}
              <div className="grid grid-cols-2 gap-4">
                {filteredSubmissions.map(s => (
                  <div key={s.id} className="bg-white rounded-xl border border-tv-border-light overflow-hidden hover:shadow-md transition-shadow">
                    {/* Video thumbnail */}
                    <div className="aspect-video relative" style={{ background: `linear-gradient(135deg, ${s.thumbnailColor}, ${s.thumbnailColor}cc)` }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center backdrop-blur-sm">
                          <Play size={16} style={{ color: "white", marginLeft: 2 }} />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white">{s.duration}</div>
                      <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px]"
                        style={{ backgroundColor: statusBg(s.status), color: statusColor(s.status), fontWeight: 600 }}>
                        {statusLabel(s.status)}
                      </div>
                    </div>
                    {/* Info */}
                    <div className="p-3">
                      <p className="text-[13px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{s.recorderName}</p>
                      <p className="text-[11px] text-tv-text-secondary">{s.date}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <button className="flex items-center gap-1 px-2 py-1 text-[10px] text-tv-text-secondary border border-tv-border-light rounded hover:bg-tv-surface transition-colors">
                          <Eye size={10} />Preview
                        </button>
                        <button className="flex items-center gap-1 px-2 py-1 text-[10px] text-tv-text-secondary border border-tv-border-light rounded hover:bg-tv-surface transition-colors">
                          <Download size={10} />Download
                        </button>
                        {s.status === "submitted" && (
                          <button className="flex items-center gap-1 px-2 py-1 text-[10px] text-white bg-tv-brand-bg rounded hover:bg-tv-brand-hover transition-colors" style={{ fontWeight: 600 }}>
                            <Check size={10} />Approve
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSubmissions.length === 0 && (
                <div className="bg-white rounded-xl border border-tv-border-light p-10 text-center">
                  <Video size={32} style={{ color: TV.textDecorative }} className="mx-auto mb-3" />
                  <p className="text-[14px] text-tv-text-primary" style={{ fontWeight: 600 }}>No submissions yet</p>
                  <p className="text-[12px] text-tv-text-secondary mt-1">Submissions will appear here as recorders submit their videos.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
