import { useState } from "react";
import {
  FileText, Check, X, Search,
  Bookmark, Clock, PenLine, Eye, ChevronRight,
} from "lucide-react";

// ── Email Templates ─────────────────────────────────────────────────────────

export interface EmailTemplate {
  id: string;
  name: string;
  category: "thank-you" | "solicitation" | "event" | "stewardship" | "welcome" | "custom";
  subject: string;
  body: string;
  builtIn: boolean;
  lastUsed?: string;
}

const CATEGORY_LABELS: Record<EmailTemplate["category"], string> = {
  "thank-you": "Thank You",
  solicitation: "Solicitation",
  event: "Event",
  stewardship: "Stewardship",
  welcome: "Welcome",
  custom: "Custom",
};

const CATEGORY_COLORS: Record<EmailTemplate["category"], { bg: string; text: string }> = {
  "thank-you": { bg: "bg-tv-success-bg", text: "text-tv-success" },
  solicitation: { bg: "bg-tv-brand-tint", text: "text-tv-brand" },
  event: { bg: "bg-tv-info-bg", text: "text-tv-info" },
  stewardship: { bg: "bg-tv-warning-bg", text: "text-tv-warning" },
  welcome: { bg: "bg-tv-info-bg", text: "text-tv-info" },
  custom: { bg: "bg-tv-surface", text: "text-tv-text-secondary" },
};

export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: "tpl-1",
    name: "Heartfelt Thank You",
    category: "thank-you",
    subject: "Thank you for your generous gift, {{first_name}}",
    body: "Dear {{first_name}},\n\nI wanted to take a moment to personally thank you for your incredible {{gift_amount}} gift to {{fund_name}}. Your generosity is making a real difference in the lives of our students.\n\nBecause of supporters like you, we\u2019re able to provide scholarships, expand research opportunities, and create transformative experiences that shape futures.\n\nWith heartfelt gratitude,\n{{sender_name}}",
    builtIn: true,
    lastUsed: "Feb 14, 2026",
  },
  {
    id: "tpl-2",
    name: "Annual Fund Appeal",
    category: "solicitation",
    subject: "Your support can change lives, {{first_name}}",
    body: "Dear {{first_name}},\n\nAs we approach the end of our fiscal year, I\u2019m reaching out to share an exciting opportunity. Every gift to the Annual Fund directly supports student scholarships, faculty research, and campus improvements.\n\nThis year, a generous donor has offered to match all gifts dollar-for-dollar \u2014 so your impact is doubled.\n\nWill you consider making a gift today?\n\nWith appreciation,\n{{sender_name}}",
    builtIn: true,
  },
  {
    id: "tpl-3",
    name: "Event Invitation",
    category: "event",
    subject: "You\u2019re invited: {{campaign_name}}",
    body: "Dear {{first_name}},\n\nWe would be honored to have you join us for {{campaign_name}}. This special gathering brings together our most valued supporters for an evening of celebration and connection.\n\nDate: [Event Date]\nTime: [Event Time]\nLocation: [Venue]\n\nPlease RSVP by [Date] to reserve your seat.\n\nWe look forward to seeing you there!\n\nWarm regards,\n{{sender_name}}",
    builtIn: true,
  },
  {
    id: "tpl-4",
    name: "Impact Report Follow-Up",
    category: "stewardship",
    subject: "See the impact of your generosity, {{first_name}}",
    body: "Dear {{first_name}},\n\nI\u2019m excited to share an update on how your support has made a difference this year. Thanks to your {{gift_amount}} contribution to {{fund_name}}, we\u2019ve been able to:\n\n\u2022 Fund 12 new student scholarships\n\u2022 Expand our mentoring program to 200+ students\n\u2022 Launch 3 new research initiatives\n\nI\u2019ve recorded a short video message to share more about these achievements and to express our sincere gratitude.\n\nThank you for being a part of our community.\n\nWith gratitude,\n{{sender_name}}",
    builtIn: true,
    lastUsed: "Jan 30, 2026",
  },
  {
    id: "tpl-5",
    name: "New Donor Welcome",
    category: "welcome",
    subject: "Welcome to the {{fund_name}} family, {{first_name}}!",
    body: "Dear {{first_name}},\n\nOn behalf of everyone at Hartwell University, welcome! Your first gift to {{fund_name}} marks the beginning of a meaningful journey with us.\n\nAs a valued supporter, you\u2019ll receive regular updates on how your generosity is making an impact, invitations to exclusive events, and personal messages from the students and faculty whose lives you\u2019re touching.\n\nWe\u2019re so glad to have you with us.\n\nWarmly,\n{{sender_name}}",
    builtIn: true,
  },
  {
    id: "tpl-6",
    name: "Scholarship Thank You (Custom)",
    category: "custom",
    subject: "A message from your scholarship recipient, {{first_name}}",
    body: "Dear {{first_name}},\n\nMy name is [Student Name], and I\u2019m a [Year] studying [Major] at Hartwell University. I\u2019m writing to thank you for your generous support of the {{fund_name}} scholarship.\n\nBecause of your kindness, I\u2019ve been able to focus on my studies without the burden of financial worry. This semester, I\u2019m [specific achievement or activity].\n\nI\u2019ve recorded a short video to share more about my experience and to say thank you in person.\n\nWith sincere gratitude,\n[Student Name]",
    builtIn: false,
    lastUsed: "Feb 3, 2026",
  },
];

// ── Email Signatures ─────────────────────────────────────────────────────────

export interface EmailSignature {
  id: string;
  name: string;
  html: string;
  isDefault: boolean;
}

/** Simulated user signatures pulled from "user settings" */
export const USER_SIGNATURES: EmailSignature[] = [
  {
    id: "sig-1",
    name: "Formal \u2013 Kelley Molt",
    isDefault: true,
    html: `\n\n\u2014\nKelley Molt\nDirector of Annual Giving\nHartwell University\nkelley.molt@hartwell.edu | (555) 012-3456\nhartwell.edu/give`,
  },
  {
    id: "sig-2",
    name: "Casual \u2013 Kelley",
    isDefault: false,
    html: `\n\nBest,\nKelley\nDirector of Annual Giving | Hartwell University`,
  },
  {
    id: "sig-3",
    name: "Department \u2013 Advancement Office",
    isDefault: false,
    html: `\n\n\u2014\nOffice of University Advancement\nHartwell University\ngiving@hartwell.edu | (555) 012-3400\nhartwell.edu/give`,
  },
];

// ── Template Picker Component ────────────────────────────────────────────────

interface EmailTemplatePickerProps {
  onSelect: (template: EmailTemplate) => void;
  onClose: () => void;
  compact?: boolean;
}

export function EmailTemplatePicker({ onSelect, onClose, compact }: EmailTemplatePickerProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<EmailTemplate["category"] | "all">("all");
  const [preview, setPreview] = useState<EmailTemplate | null>(null);

  const filtered = EMAIL_TEMPLATES.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || t.category === category;
    return matchSearch && matchCat;
  });

  if (preview) {
    return (
      <div className={`bg-white border border-tv-border-light rounded-lg shadow-xl overflow-hidden ${compact ? "w-[520px]" : "w-[640px]"}`}>
        {/* Preview header */}
        <div className="px-4 py-3 border-b border-tv-border-divider bg-tv-surface-muted flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setPreview(null)} className="text-tv-text-secondary hover:text-tv-brand transition-colors">
              <ChevronRight size={14} className="rotate-180" />
            </button>
            <p className="text-[13px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{preview.name}</p>
          </div>
          <button onClick={onClose} className="text-tv-text-decorative hover:text-tv-text-primary transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Preview content */}
        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
          <div>
            <p className="text-[9px] text-tv-text-decorative uppercase tracking-wider mb-1" style={{ fontWeight: 600 }}>Subject</p>
            <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 500 }}>{preview.subject}</p>
          </div>
          <div>
            <p className="text-[9px] text-tv-text-decorative uppercase tracking-wider mb-1" style={{ fontWeight: 600 }}>Body</p>
            <div className="p-3 bg-tv-surface-muted rounded-md border border-tv-border-divider">
              <p className="text-[12px] text-tv-text-primary whitespace-pre-wrap leading-relaxed">{preview.body}</p>
            </div>
          </div>
        </div>

        {/* Use template button */}
        <div className="px-4 py-3 border-t border-tv-border-divider flex items-center justify-between">
          <p className="text-[10px] text-tv-text-secondary">Subject & body will be pre-filled. You can edit after.</p>
          <button
            onClick={() => { onSelect(preview); onClose(); }}
            className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-white bg-tv-brand rounded-full hover:bg-tv-brand-hover transition-colors"
            style={{ fontWeight: 600 }}
          >
            <Check size={12} /> Use Template
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-tv-border-light rounded-lg shadow-xl overflow-hidden ${compact ? "w-[520px]" : "w-[640px]"}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-tv-border-divider bg-tv-surface-muted flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={14} />
          <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 600 }}>Email Templates</p>
        </div>
        <button onClick={onClose} className="text-tv-text-decorative hover:text-tv-text-primary transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Search + filters */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tv-text-decorative" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search templates\u2026"
            className="w-full pl-8 pr-3 py-2 border border-tv-border-light rounded-sm text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {(["all", "thank-you", "solicitation", "event", "stewardship", "welcome", "custom"] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-full text-[14px] border transition-all ${
                category === cat
                  ? "border-tv-brand bg-tv-brand-tint text-tv-brand"
                  : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"
              }`}
              style={{ fontWeight: 500 }}
            >
              {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Template list */}
      <div className="px-2 pb-2 max-h-[320px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-8 gap-2">
            <FileText size={20} className="text-tv-text-decorative" />
            <p className="text-[12px] text-tv-text-secondary">No templates match your search.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(tpl => {
              const catColor = CATEGORY_COLORS[tpl.category];
              return (
                <button
                  key={tpl.id}
                  onClick={() => setPreview(tpl)}
                  className="w-full text-left px-3 py-2.5 rounded-md border border-transparent hover:border-tv-brand/30 hover:bg-tv-surface-muted transition-all group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-sm bg-tv-surface-muted flex items-center justify-center shrink-0 mt-0.5">
                      {tpl.builtIn ? <Bookmark size={13} className="text-tv-brand" /> : <PenLine size={13} className="text-tv-text-secondary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{tpl.name}</p>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${catColor.bg} ${catColor.text} shrink-0`} style={{ fontWeight: 600 }}>
                          {CATEGORY_LABELS[tpl.category]}
                        </span>
                      </div>
                      <p className="text-[10px] text-tv-text-secondary truncate">{tpl.subject}</p>
                      {tpl.lastUsed && (
                        <p className="text-[9px] text-tv-text-decorative mt-0.5 flex items-center gap-1">
                          <Clock size={8} /> Last used {tpl.lastUsed}
                        </p>
                      )}
                    </div>
                    <Eye size={12} className="text-tv-text-decorative group-hover:text-tv-brand transition-colors shrink-0 mt-1.5" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Signature Picker Component ───────────────────────────────────────────────

interface SignaturePickerProps {
  onInsert: (signature: EmailSignature) => void;
  onClose: () => void;
  compact?: boolean;
}

export function SignaturePicker({ onInsert, onClose, compact }: SignaturePickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    USER_SIGNATURES.find(s => s.isDefault)?.id || null
  );

  const selected = USER_SIGNATURES.find(s => s.id === selectedId);

  return (
    <div className={`bg-white border border-tv-border-light rounded-lg shadow-xl overflow-hidden ${compact ? "max-w-[380px]" : "max-w-[460px]"}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-tv-border-divider bg-tv-surface-muted flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenLine size={14} />
          <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 600 }}>Email Signatures</p>
        </div>
        <button onClick={onClose} className="text-tv-text-decorative hover:text-tv-text-primary transition-colors">
          <X size={14} />
        </button>
      </div>

      <div className="p-3 space-y-1.5">
        <p className="text-[10px] text-tv-text-secondary px-1 mb-1">Select a signature from your account settings:</p>
        {USER_SIGNATURES.map(sig => (
          <button
            key={sig.id}
            onClick={() => setSelectedId(sig.id)}
            className={`w-full text-left px-3 py-2.5 rounded-md border transition-all ${
              selectedId === sig.id
                ? "border-tv-brand bg-tv-brand-tint/30"
                : "border-tv-border-light hover:border-tv-border-strong"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <p className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>{sig.name}</p>
                {sig.isDefault && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-tv-brand-tint text-tv-brand" style={{ fontWeight: 600 }}>DEFAULT</span>
                )}
              </div>
              {selectedId === sig.id && <Check size={13} className="text-tv-brand shrink-0" />}
            </div>
            <div className="p-2 bg-tv-surface-muted rounded-sm border border-tv-border-divider mt-1">
              <p className="text-[10px] text-tv-text-secondary whitespace-pre-wrap leading-relaxed">{sig.html.trim()}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-tv-border-divider flex items-center justify-between">
        <p className="text-[10px] text-tv-text-decorative">Manage signatures in Account Settings</p>
        <button
          onClick={() => { if (selected) { onInsert(selected); onClose(); } }}
          disabled={!selected}
          className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-white bg-tv-brand rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontWeight: 600 }}
        >
          <Check size={12} /> Insert Signature
        </button>
      </div>
    </div>
  );
}

// ── Inline action buttons (to be placed above the editor) ────────────────────

interface EmailTemplateActionsProps {
  onApplyTemplate: (template: EmailTemplate) => void;
  compact?: boolean;
}

export function EmailTemplateActions({ onApplyTemplate, compact }: EmailTemplateActionsProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Template button */}
      <div className="relative">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] border transition-all ${
            showTemplates
              ? "border-tv-brand bg-tv-brand-tint text-tv-brand"
              : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong hover:text-tv-brand"
          }`}
          style={{ fontWeight: 500 }}
        >
          <FileText size={11} />
          {compact ? "Template" : "Start from Template"}
        </button>
        {showTemplates && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowTemplates(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="pointer-events-auto">
                <EmailTemplatePicker
                  onSelect={onApplyTemplate}
                  onClose={() => setShowTemplates(false)}
                  compact={compact}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
