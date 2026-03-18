import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ChevronLeft, ChevronRight, Check, Plus,
  Mail, MessageSquare, Video, Sparkles,
  Save, Send, Link2, Type, AlignLeft,
  GripVertical, Trash2,
} from "lucide-react";
import {
  Box, Stack, Text, Title, Button, UnstyledButton, ActionIcon,
  Badge, TextInput, MultiSelect, Switch, SimpleGrid, Tooltip,
  Textarea,
} from "@mantine/core";
import { TV } from "../theme";
import { useToast } from "../contexts/ToastContext";

// ── Merge Tags ──────────────────────────────────────────────────────────────
const MERGE_TAGS = [
  { tag: "{{first_name}}", label: "First Name" },
  { tag: "{{last_name}}", label: "Last Name" },
  { tag: "{{full_name}}", label: "Full Name" },
  { tag: "{{email}}", label: "Email" },
  { tag: "{{organization}}", label: "Organization" },
  { tag: "{{gift_amount}}", label: "Gift Amount" },
  { tag: "{{gift_date}}", label: "Gift Date" },
  { tag: "{{gift_years}}", label: "Years Giving" },
  { tag: "{{video_link}}", label: "Video Link" },
  { tag: "{{landing_page_url}}", label: "Landing Page URL" },
];

const TAGS = ["Thank You", "Solicitation", "Welcome", "Event", "Update", "Birthday", "Anniversary", "General"];

// ── Email content sections ──────────────────────────────────────────────────
type SectionType = "text" | "video" | "cta";

interface ContentSection {
  id: string;
  type: SectionType;
  body?: string;
  videoCaption?: string;
  ctaText?: string;
  ctaUrl?: string;
}

function makeSection(type: SectionType): ContentSection {
  const id = `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  switch (type) {
    case "text": return { id, type, body: "" };
    case "video": return { id, type, videoCaption: "Watch your personal video message" };
    case "cta": return { id, type, ctaText: "Give Now", ctaUrl: "https://example.com/give" };
  }
}

// ── Preset Templates ────────────────────────────────────────────────────────
interface EmailPreset {
  id: string; name: string; category: string; description: string;
  subject: string; preheader: string; greeting: string;
  sections: ContentSection[]; closing: string;
}

interface SmsPreset {
  id: string; name: string; category: string; description: string;
  body: string;
}

const EMAIL_PRESETS: EmailPreset[] = [
  {
    id: "e1", name: "Thank You – Video", category: "Thank You",
    description: "Personal thank you with an embedded video and a giving CTA",
    subject: "A personal thank you, {{first_name}}",
    preheader: "Watch a message recorded just for you",
    greeting: "Dear {{first_name}},",
    sections: [
      { id: "p1-t1", type: "text", body: "I wanted to personally reach out and share how much your support means to our community at Hartwell University. Your generosity has made a real difference in the lives of our students." },
      { id: "p1-v1", type: "video", videoCaption: "Watch your personal video message" },
      { id: "p1-t2", type: "text", body: "Your {{gift_amount}} gift last year helped fund 47 scholarships. Thank you for being part of the Hartwell family." },
      { id: "p1-cta1", type: "cta", ctaText: "See Your Impact", ctaUrl: "{{landing_page_url}}" },
    ],
    closing: "With gratitude,\nKelley Armstrong\nDirector of Annual Giving",
  },
  {
    id: "e2", name: "Event Invitation", category: "Event",
    description: "Formal event invite with RSVP call-to-action",
    subject: "You're invited, {{first_name}}!",
    preheader: "Join us for a special evening at the Hartwell Gala",
    greeting: "Dear {{first_name}},",
    sections: [
      { id: "p2-t1", type: "text", body: "We are delighted to invite you to the annual Hartwell Gala. This year's theme celebrates the transformative power of philanthropy in higher education.\n\nThe event will be held on Saturday, April 18 at the Grand Ballroom." },
      { id: "p2-cta1", type: "cta", ctaText: "RSVP Now", ctaUrl: "{{landing_page_url}}" },
    ],
    closing: "We hope to see you there!\nThe Hartwell Events Team",
  },
  {
    id: "e3", name: "Fundraising Appeal", category: "Solicitation",
    description: "Giving appeal with impact stats and matching gift hook",
    subject: "Double your impact today, {{first_name}}",
    preheader: "Every dollar matched through Friday",
    greeting: "Dear {{first_name}},",
    sections: [
      { id: "p3-t1", type: "text", body: "Thanks to a generous matching gift from the Hartwell Foundation, every dollar you give today will be doubled. That means your support goes twice as far." },
      { id: "p3-v1", type: "video", videoCaption: "Watch a message from our scholarship recipients" },
      { id: "p3-t2", type: "text", body: "Last year, gifts like yours funded 47 scholarships and supported 12 research programs. With your continued support, we can do even more." },
      { id: "p3-cta1", type: "cta", ctaText: "Make a Gift", ctaUrl: "{{landing_page_url}}" },
    ],
    closing: "Thank you for making a difference,\nPresident Sarah Chen",
  },
  {
    id: "e4", name: "Impact Update", category: "Update",
    description: "Stewardship update showing how gifts were used",
    subject: "See the impact of your scholarship gift",
    preheader: "A quick update from the Hartwell community",
    greeting: "Dear {{first_name}},",
    sections: [
      { id: "p4-t1", type: "text", body: "We are thrilled to share the latest updates from Hartwell University. Your support continues to change lives." },
      { id: "p4-t2", type: "text", body: "This semester, we awarded 52 scholarships, launched 3 new research initiatives, and welcomed our most diverse class ever. None of this would be possible without donors like you." },
      { id: "p4-v1", type: "video", videoCaption: "A thank you from one of your scholarship recipients" },
    ],
    closing: "With appreciation,\nThe Hartwell Advancement Office",
  },
];

const SMS_PRESETS: SmsPreset[] = [
  { id: "s1", name: "Thank You SMS", category: "Thank You", description: "Short personal thank you with video link", body: "Hi {{first_name}}! This is Kelley from Hartwell. I recorded a personal thank you video just for you. Watch it here: {{video_link}}" },
  { id: "s2", name: "Event Reminder", category: "Event", description: "Quick event reminder with RSVP link", body: "Hi {{first_name}}, just a reminder about the Hartwell Gala on March 15! We'd love to see you there. RSVP: {{landing_page_url}}" },
  { id: "s3", name: "Birthday Greeting", category: "Birthday", description: "Personal birthday message", body: "Happy birthday, {{first_name}}! Everyone at Hartwell University wishes you a wonderful day. We're so grateful to have you in our community." },
  { id: "s4", name: "Giving Day Nudge", category: "Solicitation", description: "Short giving day appeal", body: "{{first_name}}, today is Hartwell Giving Day! Every gift — no matter the size — makes a difference. Give now: {{landing_page_url}}" },
];

// ── Merge Tag Pill Helper ───────────────────────────────────────────────────
function MergeTagBar({ onInsert, compact }: { onInsert: (tag: string) => void; compact?: boolean }) {
  const tags = compact ? MERGE_TAGS.slice(0, 6) : MERGE_TAGS;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map(mt => (
        <button
          key={mt.tag}
          onClick={() => onInsert(mt.tag)}
          className="px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors hover:bg-tv-brand-tint"
          style={{ border: `1px solid ${TV.borderLight}`, color: TV.textBrand }}
        >
          {mt.label}
        </button>
      ))}
    </div>
  );
}

// ── Step Bar ────────────────────────────────────────────────────────────────
function StepBar({ step, channel }: { step: number; channel: "email" | "sms" }) {
  const steps = ["Starting Point", channel === "email" ? "Email Content" : "Compose SMS", "Review & Save"];
  return (
    <div className="flex items-center gap-2 mt-1">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all"
              style={{
                backgroundColor: i < step ? TV.brand : i === step ? TV.brandBg : TV.surface,
                color: i <= step ? "white" : TV.textSecondary,
              }}
            >
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            <span className="text-[12px] font-medium hidden sm:inline" style={{ color: i <= step ? TV.textPrimary : TV.textSecondary }}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && <div className="w-8 h-px" style={{ backgroundColor: i < step ? TV.brand : TV.borderLight }} />}
        </div>
      ))}
    </div>
  );
}

// ── Email Content Preview ───────────────────────────────────────────────────
function EmailContentPreview({
  subject, preheader, greeting, sections, closing,
}: {
  subject: string; preheader: string; greeting: string;
  sections: ContentSection[]; closing: string;
}) {
  return (
    <div className="bg-white rounded-[16px] overflow-hidden" style={{ border: `1px solid ${TV.borderLight}` }}>
      <div className="px-5 py-3.5" style={{ borderBottom: `1px solid ${TV.borderDivider}`, backgroundColor: TV.surface }}>
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.brand }}>
            <Mail size={9} color="white" />
          </div>
          <Text fz={10} fw={600} c={TV.textSecondary}>Subject & Preheader</Text>
        </div>
        <Text fz={13} fw={600} c={TV.textPrimary} className="break-words">{subject || "No subject line"}</Text>
        <Text fz={11} c={TV.textSecondary} mt={2} className="break-words">{preheader || "No preheader"}</Text>
      </div>
      <div className="px-5 py-4">
        {greeting && <p className="text-[13px] mb-3" style={{ color: TV.textPrimary }}>{greeting}</p>}
        {sections.length === 0 && (
          <div className="py-6 text-center">
            <Text fz={12} c={TV.textDecorative}>No content sections yet. Add text, a video, or a CTA below.</Text>
          </div>
        )}
        {sections.map(sec => {
          if (sec.type === "text") {
            return (
              <div key={sec.id} className="mb-3">
                <p className="text-[13px] whitespace-pre-line" style={{ color: TV.textPrimary }}>
                  {sec.body || <span style={{ color: TV.textDecorative }}>Empty text section</span>}
                </p>
              </div>
            );
          }
          if (sec.type === "video") {
            return (
              <div key={sec.id} className="my-4 rounded-[12px] px-4 py-3 flex items-center gap-3" style={{ backgroundColor: TV.surface, border: `1px dashed ${TV.borderStrong}` }}>
                <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: TV.brandTint }}>
                  <Video size={16} style={{ color: TV.brand }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fz={11} fw={600} c={TV.textBrand}>Video Placeholder</Text>
                  <Text fz={10} c={TV.textSecondary}>{sec.videoCaption || "Personalized video"}</Text>
                </div>
              </div>
            );
          }
          if (sec.type === "cta") {
            return (
              <div key={sec.id} className="my-4 text-center">
                <span className="inline-block px-6 py-2 rounded-full text-[12px] font-semibold text-white" style={{ backgroundColor: TV.brand }}>
                  {sec.ctaText || "Button"}
                </span>
                {sec.ctaUrl && <Text fz={9} c={TV.textDecorative} mt={4}>{sec.ctaUrl}</Text>}
              </div>
            );
          }
          return null;
        })}
        {closing && (
          <div className="mt-4 pt-3" style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
            <p className="text-[12px] whitespace-pre-line" style={{ color: TV.textSecondary }}>{closing}</p>
          </div>
        )}
      </div>
      <div className="px-5 py-2.5 text-center" style={{ backgroundColor: TV.surface, borderTop: `1px solid ${TV.borderDivider}` }}>
        <Text fz={9} c={TV.textDecorative}>Header, footer, and visual styling are applied in the Campaign Builder</Text>
      </div>
    </div>
  );
}

// ── SMS Phone Preview ───────────────────────────────────────────────────────
function SmsPhonePreview({ body }: { body: string }) {
  const charCount = body.length;
  const segments = Math.ceil(charCount / 160) || 1;
  return (
    <div className="flex flex-col items-center">
      <div className="w-[280px] rounded-[32px] border-[3px] p-3 bg-[#1a1a2e]" style={{ borderColor: TV.borderStrong }}>
        <div className="w-16 h-1.5 bg-[#333] rounded-full mx-auto mb-3" />
        <div className="bg-white rounded-[20px] min-h-[360px] p-4 flex flex-col">
          <div className="flex items-center gap-2 pb-3" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.brandTint }}>
              <MessageSquare size={14} style={{ color: TV.brand }} />
            </div>
            <div>
              <p className="text-[12px] font-semibold" style={{ color: TV.textPrimary }}>Hartwell University</p>
              <p className="text-[9px]" style={{ color: TV.textSecondary }}>SMS Message</p>
            </div>
          </div>
          <div className="flex-1 pt-4">
            {body ? (
              <div className="inline-block max-w-[85%] rounded-2xl rounded-tl-sm px-3.5 py-2.5" style={{ backgroundColor: TV.surface }}>
                <p className="text-[12px] whitespace-pre-line" style={{ color: TV.textPrimary }}>{body}</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-[11px]" style={{ color: TV.textDecorative }}>Message preview will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-3 text-[11px]" style={{ color: TV.textSecondary }}>
        <span>{charCount} character{charCount !== 1 ? "s" : ""}</span>
        <span className="w-px h-3" style={{ backgroundColor: TV.borderLight }} />
        <span>{segments} SMS segment{segments !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// ── Main Component ──────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════════
export function EmailTemplateBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { show } = useToast();

  const initialChannel = (searchParams.get("channel") === "sms" ? "sms" : "email") as "email" | "sms";

  const [step, setStep] = useState(0);
  const [channel, setChannel] = useState<"email" | "sms">(initialChannel);
  const [templateName, setTemplateName] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [startMode, setStartMode] = useState<"blank" | "preset">("blank");

  // Email content
  const [subject, setSubject] = useState("");
  const [preheader, setPreheader] = useState("");
  const [greeting, setGreeting] = useState("Dear {{first_name}},");
  const [sections, setSections] = useState<ContentSection[]>([
    makeSection("text"),
    makeSection("video"),
    makeSection("cta"),
  ]);
  const [closing, setClosing] = useState("With gratitude,\nKelley Armstrong\nDirector of Annual Giving");

  // SMS
  const [smsBody, setSmsBody] = useState("");

  // Save
  const [saveAsTemplate, setSaveAsTemplate] = useState(true);
  const [saveAction, setSaveAction] = useState<"library" | "campaign">("library");

  const canSave = templateName.trim().length > 0;
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  useEffect(() => {
    if (editId) {
      setTemplateName("Spring Appeal — Thank You");
      setTags(["Thank You"]);
      setSubject("A personal thank you, {{first_name}}");
      setPreheader("Watch a message recorded just for you");
      setStep(1);
    }
  }, [editId]);

  const handleApplyEmailPreset = (p: EmailPreset) => {
    setSelectedPreset(p.id);
    setSubject(p.subject);
    setPreheader(p.preheader);
    setGreeting(p.greeting);
    setSections(p.sections.map(s => ({ ...s, id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` })));
    setClosing(p.closing);
    if (!templateName) setTemplateName(p.name);
    setTags([p.category]);
  };

  const handleApplySmsPreset = (p: SmsPreset) => {
    setSelectedPreset(p.id);
    setSmsBody(p.body);
    if (!templateName) setTemplateName(p.name);
    setTags([p.category]);
  };

  const handleSave = () => {
    const verb = isEditMode ? "updated in" : "saved to";
    if (saveAction === "library") {
      show(`"${templateName}" ${verb} your template library`, "success");
      navigate("/assets/templates");
    } else {
      show(`"${templateName}" saved — opening campaign builder…`, "success");
      navigate("/campaigns/create");
    }
  };

  const addSection = (type: SectionType) => setSections(prev => [...prev, makeSection(type)]);
  const removeSection = (id: string) => setSections(prev => prev.filter(s => s.id !== id));
  const updateSection = (id: string, patch: Partial<ContentSection>) => setSections(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));

  const moveSection = (id: string, dir: -1 | 1) => {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[target]] = [copy[target], copy[idx]];
      return copy;
    });
  };

  return (
    <Box className="min-h-full" bg={TV.surfaceMuted}>
      {/* Sticky header */}
      <Box className="sticky top-0 z-20" bg="white" style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
        <Box className="max-w-[1100px] mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {channel === "email" ? <Mail size={18} style={{ color: TV.textBrand }} /> : <MessageSquare size={18} style={{ color: TV.info }} />}
              <Title order={3} fz={18} fw={700} c={TV.textPrimary}>
                {isEditMode ? "Edit" : "New"} {channel === "email" ? "Email" : "SMS"} Template
              </Title>
            </div>
            <Button variant="outline" color="red" radius="xl" size="sm" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
          <StepBar step={step} channel={channel} />
        </Box>
      </Box>

      <Box className="max-w-[1100px] mx-auto px-4 md:px-8 py-8">

        {/* ══════ STEP 0: Starting Point ══════ */}
        {step === 0 && (
          <Stack gap={32}>
            <Box>
              <Title order={2} fz={22} fw={700} c={TV.textPrimary} mb={4}>Choose a Starting Point</Title>
              <Text fz={13} c={TV.textSecondary}>Start from scratch or pick a content preset to customize.</Text>
            </Box>

            {/* Channel toggle */}
            <Box>
              <Text fz={12} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5px" mb={10}>Channel</Text>
              <div className="flex flex-col sm:flex-row gap-3">
                {(["email", "sms"] as const).map(ch => (
                  <UnstyledButton
                    key={ch}
                    onClick={() => { setChannel(ch); setSelectedPreset(null); }}
                    className="flex-1"
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "16px 20px", borderRadius: 14,
                      border: `2px solid ${channel === ch ? (ch === "email" ? TV.brand : TV.info) : TV.borderLight}`,
                      backgroundColor: channel === ch ? (ch === "email" ? TV.brandTint : TV.infoBg) : "white",
                      transition: "all 0.15s",
                    }}
                  >
                    {ch === "email" ? <Mail size={18} style={{ color: channel === ch ? TV.brand : TV.textSecondary }} /> : <MessageSquare size={18} style={{ color: channel === ch ? TV.info : TV.textSecondary }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text fz={14} fw={600} c={channel === ch ? (ch === "email" ? TV.textBrand : TV.info) : TV.textPrimary}>{ch === "email" ? "Email Template" : "SMS Template"}</Text>
                      <Text fz={11} c={TV.textSecondary}>{ch === "email" ? "Subject, body copy, video, and CTA content" : "Short text message with merge tags"}</Text>
                    </div>
                    {channel === ch && <Check size={16} style={{ color: ch === "email" ? TV.brand : TV.info, flexShrink: 0 }} />}
                  </UnstyledButton>
                ))}
              </div>
            </Box>

            {/* Start mode */}
            <Box>
              <Text fz={12} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5px" mb={10}>How to Start</Text>
              <div className="flex flex-col sm:flex-row gap-3">
                {(["blank", "preset"] as const).map(mode => (
                  <UnstyledButton
                    key={mode}
                    onClick={() => { setStartMode(mode); if (mode === "blank") setSelectedPreset(null); }}
                    className="flex-1"
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "16px 20px", borderRadius: 14,
                      border: `2px solid ${startMode === mode ? TV.brand : TV.borderLight}`,
                      backgroundColor: startMode === mode ? TV.brandTint : "white",
                      transition: "all 0.15s",
                    }}
                  >
                    {mode === "blank" ? <Plus size={16} style={{ color: startMode === mode ? TV.brand : TV.textSecondary }} /> : <Sparkles size={16} style={{ color: startMode === mode ? TV.brand : TV.textSecondary }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text fz={13} fw={600} c={startMode === mode ? TV.textBrand : TV.textPrimary}>{mode === "blank" ? "Start from Scratch" : "Use a Preset"}</Text>
                      <Text fz={11} c={TV.textSecondary}>{mode === "blank" ? "Empty template with default fields" : "Pre-written content to customize"}</Text>
                    </div>
                    {startMode === mode && <Check size={14} style={{ color: TV.brand, flexShrink: 0 }} />}
                  </UnstyledButton>
                ))}
              </div>
            </Box>

            {/* Preset gallery */}
            {startMode === "preset" && (
              <Box>
                <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                  <Sparkles size={14} style={{ color: TV.textBrand }} />
                  <Text fz={14} fw={600} c={TV.textPrimary}>Content Presets</Text>
                  <Badge size="xs" variant="light" color={channel === "email" ? "tvPurple" : "cyan"} radius="xl">
                    {channel === "email" ? EMAIL_PRESETS.length : SMS_PRESETS.length}
                  </Badge>
                </div>
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {channel === "email" ? EMAIL_PRESETS.map(p => (
                    <UnstyledButton key={p.id} onClick={() => handleApplyEmailPreset(p)} p="md"
                      style={{ borderRadius: 14, border: `1.5px solid ${selectedPreset === p.id ? TV.brand : TV.borderLight}`, backgroundColor: selectedPreset === p.id ? TV.brandTint : "white", transition: "all 0.15s" }}
                      className="hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: TV.brandTint }}>
                          <Mail size={16} style={{ color: TV.brand }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text fz={13} fw={700} c={selectedPreset === p.id ? TV.textBrand : TV.textPrimary} mb={2}>{p.name}</Text>
                          <Text fz={11} c={TV.textSecondary} lh="16px">{p.description}</Text>
                          <Badge size="xs" variant="light" color="gray" mt={8}>{p.category}</Badge>
                        </div>
                        {selectedPreset === p.id && <Check size={16} style={{ color: TV.brand, flexShrink: 0, marginTop: 2 }} />}
                      </div>
                    </UnstyledButton>
                  )) : SMS_PRESETS.map(p => (
                    <UnstyledButton key={p.id} onClick={() => handleApplySmsPreset(p)} p="md"
                      style={{ borderRadius: 14, border: `1.5px solid ${selectedPreset === p.id ? TV.info : TV.borderLight}`, backgroundColor: selectedPreset === p.id ? TV.infoBg : "white", transition: "all 0.15s" }}
                      className="hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0" style={{ backgroundColor: TV.infoBg }}>
                          <MessageSquare size={16} style={{ color: TV.info }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text fz={13} fw={700} c={selectedPreset === p.id ? TV.info : TV.textPrimary} mb={2}>{p.name}</Text>
                          <Text fz={11} c={TV.textSecondary} lh="16px">{p.description}</Text>
                          <Badge size="xs" variant="light" color="gray" mt={8}>{p.category}</Badge>
                        </div>
                        {selectedPreset === p.id && <Check size={16} style={{ color: TV.info, flexShrink: 0, marginTop: 2 }} />}
                      </div>
                    </UnstyledButton>
                  ))}
                </SimpleGrid>
              </Box>
            )}

            <div className="flex items-center justify-end">
              <Button radius="xl" size="md" color="tvPurple" disabled={startMode === "preset" && !selectedPreset}
                rightSection={<ChevronRight size={16} />}
                onClick={() => setStep(1)}
                styles={{ root: { fontSize: 14, height: 44, paddingInline: 28 } }}
              >
                {channel === "email" ? "Write Email Content" : "Compose SMS"}
              </Button>
            </div>
          </Stack>
        )}

        {/* ══════ STEP 1: Email Content Editor ══════ */}
        {step === 1 && channel === "email" && (
          <Box className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
            <Stack gap={16}>
              <Box>
                <Title order={2} fz={22} fw={700} c={TV.textPrimary} mb={4}>Email Content</Title>
                <Text fz={13} c={TV.textSecondary}>Write your email copy, insert merge tags, and add video or CTA sections. Visual styling is applied when building a campaign.</Text>
              </Box>

              {/* Template Info */}
              <div className="bg-white rounded-[16px] p-5" style={{ border: `1px solid ${TV.borderLight}` }}>
                <div className="flex items-center gap-2 mb-4">
                  <Mail size={16} style={{ color: TV.textBrand }} />
                  <Text fz={14} fw={600} c={TV.textPrimary}>Template Info</Text>
                </div>
                <Stack gap={12}>
                  <TextInput label="Template Name" value={templateName} onChange={e => setTemplateName(e.currentTarget.value)} placeholder="e.g. Spring Appeal Thank You" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <MultiSelect label="Tags" value={tags} onChange={setTags} data={TAGS} placeholder="Select tags…" />
                    <TextInput label="Subject Line" value={subject} onChange={e => setSubject(e.currentTarget.value)} placeholder="A personal thank you, {{first_name}}" />
                  </div>
                  <TextInput label="Preheader" value={preheader} onChange={e => setPreheader(e.currentTarget.value)} placeholder="Short preview text shown in inbox" />
                </Stack>
              </div>

              {/* Greeting */}
              <div className="bg-white rounded-[16px] p-5" style={{ border: `1px solid ${TV.borderLight}` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlignLeft size={14} style={{ color: TV.textBrand }} />
                    <Text fz={14} fw={600} c={TV.textPrimary}>Greeting</Text>
                  </div>
                  <MergeTagBar onInsert={tag => setGreeting(prev => prev + tag)} compact />
                </div>
                <TextInput value={greeting} onChange={e => setGreeting(e.currentTarget.value)} placeholder="Dear {{first_name}}," />
              </div>

              {/* Content sections */}
              <div className="bg-white rounded-[16px] p-5" style={{ border: `1px solid ${TV.borderLight}` }}>
                <div className="flex items-center gap-2 mb-4">
                  <Type size={14} style={{ color: TV.textBrand }} />
                  <Text fz={14} fw={600} c={TV.textPrimary}>Content Sections</Text>
                  <Badge size="xs" variant="light" color="tvPurple" radius="xl">{sections.length}</Badge>
                </div>
                <Stack gap={12}>
                  {sections.map((sec, idx) => (
                    <div key={sec.id} className="rounded-[14px] p-4" style={{ border: `1px solid ${TV.borderLight}`, backgroundColor: TV.surface }}>
                      <div className="flex items-center gap-2 mb-3">
                        <GripVertical size={12} style={{ color: TV.textDecorative }} />
                        <Badge size="xs" variant="light" color={sec.type === "video" ? "tvPurple" : sec.type === "cta" ? "blue" : "gray"} radius="xl">
                          {sec.type === "text" ? "Text" : sec.type === "video" ? "Video" : "CTA"}
                        </Badge>
                        <div style={{ flex: 1 }} />
                        <div className="flex gap-1">
                          {idx > 0 && (
                            <Tooltip label="Move Up">
                              <ActionIcon variant="subtle" size={24} radius="xl" onClick={() => moveSection(sec.id, -1)}>
                                <ChevronLeft size={12} style={{ transform: "rotate(90deg)" }} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          {idx < sections.length - 1 && (
                            <Tooltip label="Move Down">
                              <ActionIcon variant="subtle" size={24} radius="xl" onClick={() => moveSection(sec.id, 1)}>
                                <ChevronRight size={12} style={{ transform: "rotate(90deg)" }} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          <Tooltip label="Remove">
                            <ActionIcon variant="subtle" size={24} radius="xl" color="red" onClick={() => removeSection(sec.id)}>
                              <Trash2 size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </div>
                      </div>
                      {sec.type === "text" && (
                        <div>
                          <Textarea value={sec.body || ""} onChange={e => updateSection(sec.id, { body: e.currentTarget.value })}
                            placeholder="Write your paragraph here…" minRows={3} autosize
                            styles={{ input: { fontSize: 13, borderColor: TV.borderLight, backgroundColor: "white" } }} mb={8}
                          />
                          <MergeTagBar onInsert={tag => updateSection(sec.id, { body: (sec.body || "") + tag })} compact />
                        </div>
                      )}
                      {sec.type === "video" && (
                        <TextInput label="Video Caption" value={sec.videoCaption || ""}
                          onChange={e => updateSection(sec.id, { videoCaption: e.currentTarget.value })}
                          placeholder="Watch your personal video message"
                          styles={{ input: { backgroundColor: "white" } }}
                        />
                      )}
                      {sec.type === "cta" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <TextInput label="Button Text" value={sec.ctaText || ""}
                            onChange={e => updateSection(sec.id, { ctaText: e.currentTarget.value })}
                            placeholder="Give Now" styles={{ input: { backgroundColor: "white" } }}
                          />
                          <TextInput label="Button URL" value={sec.ctaUrl || ""}
                            onChange={e => updateSection(sec.id, { ctaUrl: e.currentTarget.value })}
                            placeholder="{{landing_page_url}}" styles={{ input: { backgroundColor: "white" } }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </Stack>
                <div className="flex flex-wrap gap-2 mt-4 pt-3" style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
                  {([["text", "Text", Plus], ["video", "Video", Video], ["cta", "CTA Button", Link2]] as const).map(([type, label, Icon]) => (
                    <button key={type} onClick={() => addSection(type)}
                      className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium rounded-full transition-colors hover:bg-tv-brand-tint"
                      style={{ border: `1px solid ${TV.borderLight}`, color: TV.textBrand }}
                    >
                      <Icon size={10} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Closing */}
              <div className="bg-white rounded-[16px] p-5" style={{ border: `1px solid ${TV.borderLight}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlignLeft size={14} style={{ color: TV.textBrand }} />
                  <Text fz={14} fw={600} c={TV.textPrimary}>Closing / Signature</Text>
                </div>
                <Textarea value={closing} onChange={e => setClosing(e.currentTarget.value)}
                  placeholder="With gratitude,\nYour Name\nTitle" minRows={3} autosize
                  styles={{ input: { fontSize: 13, borderColor: TV.borderLight } }}
                />
              </div>
            </Stack>

            {/* Right: Live preview */}
            <Box className="hidden lg:block">
              <div className="sticky top-[120px]">
                <Text fz={12} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5px" mb={10}>Content Preview</Text>
                <EmailContentPreview subject={subject} preheader={preheader} greeting={greeting} sections={sections} closing={closing} />
              </div>
            </Box>
          </Box>
        )}

        {/* ══════ STEP 1: SMS Composer ══════ */}
        {step === 1 && channel === "sms" && (
          <div className="flex gap-8 flex-col lg:flex-row">
            <div className="flex-1">
              <Stack gap={16}>
                <Box>
                  <Title order={2} fz={22} fw={700} c={TV.textPrimary} mb={4}>Compose SMS</Title>
                  <Text fz={13} c={TV.textSecondary}>Write your text message and insert merge tags for personalization.</Text>
                </Box>
                <div className="bg-white rounded-[16px] p-5" style={{ border: `1px solid ${TV.borderLight}` }}>
                  <TextInput label="Template Name" value={templateName} onChange={e => setTemplateName(e.currentTarget.value)} placeholder="e.g. Birthday Greeting SMS" mb="md" />
                  <MultiSelect label="Tags" value={tags} onChange={setTags} data={TAGS} placeholder="Select tags…" />
                </div>
                <div className="bg-white rounded-[16px] p-5" style={{ border: `1px solid ${TV.borderLight}` }}>
                  <Text fz={14} fw={600} c={TV.textPrimary} mb={12}>Message Body</Text>
                  <Textarea value={smsBody} onChange={e => setSmsBody(e.currentTarget.value)}
                    placeholder="Type your SMS message here…" minRows={6} autosize
                    styles={{ input: { fontSize: 13, borderColor: TV.borderLight } }} mb="sm"
                  />
                  <div className="flex items-center justify-between mb-4">
                    <Text fz={11} c={TV.textSecondary}>
                      {smsBody.length} / 160 characters
                      {smsBody.length > 160 && <span style={{ color: TV.warning }}> ({Math.ceil(smsBody.length / 160)} segments)</span>}
                    </Text>
                    {smsBody.length > 0 && smsBody.length <= 160 && <Badge size="xs" variant="light" color="green">Single segment</Badge>}
                  </div>
                  <Text fz={12} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5px" mb={8}>Insert Merge Tag</Text>
                  <MergeTagBar onInsert={tag => setSmsBody(prev => prev + tag)} />
                </div>
              </Stack>
            </div>
            <div className="lg:w-[340px] shrink-0">
              <div className="sticky top-[120px]">
                <Text fz={12} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5px" mb={10} ta="center">Live Preview</Text>
                <SmsPhonePreview body={smsBody} />
              </div>
            </div>
          </div>
        )}

        {/* ══════ STEP 2: Review & Save ══════ */}
        {step === 2 && (
          <Stack gap={24}>
            <Box>
              <Title order={2} fz={22} fw={700} c={TV.textPrimary} mb={4}>Review & Save</Title>
              <Text fz={13} c={TV.textSecondary}>Review your content and choose how to save your template.</Text>
            </Box>

            <Box className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
            <Stack gap={24}>
              {/* Save options */}
              <div className="bg-white rounded-[16px] p-5" style={{ border: `1px solid ${TV.borderLight}` }}>
                <Stack gap={16}>
                  <TextInput label="Template Name" value={templateName} onChange={e => setTemplateName(e.currentTarget.value)} placeholder="Name your template" />
                  <MultiSelect label="Tags" value={tags} onChange={setTags} data={TAGS} placeholder="Select tags…" />
                  <Switch label="Save as reusable template" description="Templates appear in the template picker when creating campaigns"
                    checked={saveAsTemplate} onChange={e => setSaveAsTemplate(e.currentTarget.checked)}
                    color="tvPurple" size="md" styles={{ label: { fontSize: 13 }, description: { fontSize: 11 } }}
                  />
                </Stack>
              </div>

              <div className="bg-white rounded-[16px] p-5" style={{ border: `1px solid ${TV.borderLight}` }}>
                <Text fz={14} fw={600} c={TV.textPrimary} mb={12}>What would you like to do next?</Text>
                <Stack gap={10}>
                  <UnstyledButton onClick={() => setSaveAction("library")}
                    className={`flex items-center gap-4 px-5 py-4 rounded-[14px] transition-colors ${saveAction === "library" ? "" : "hover:bg-tv-surface"}`}
                    bg={saveAction === "library" ? TV.brandTint : undefined}
                    style={{ border: `2px solid ${saveAction === "library" ? TV.brand : TV.borderLight}` }}
                  >
                    <Box w={40} h={40} className="rounded-[12px] flex items-center justify-center shrink-0" bg={saveAction === "library" ? TV.brand : TV.surface}>
                      <Save size={18} color={saveAction === "library" ? "white" : TV.textLabel} />
                    </Box>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text fz={14} fw={600} c={saveAction === "library" ? TV.textBrand : TV.textPrimary}>Save to Library</Text>
                      <Text fz={12} c={TV.textSecondary}>Save this template to your library for future use</Text>
                    </Box>
                    {saveAction === "library" && <Check size={16} style={{ color: TV.brand }} />}
                  </UnstyledButton>

                  <UnstyledButton onClick={() => setSaveAction("campaign")}
                    className={`flex items-center gap-4 px-5 py-4 rounded-[14px] transition-colors ${saveAction === "campaign" ? "" : "hover:bg-tv-surface"}`}
                    bg={saveAction === "campaign" ? TV.brandTint : undefined}
                    style={{ border: `2px solid ${saveAction === "campaign" ? TV.brand : TV.borderLight}` }}
                  >
                    <Box w={40} h={40} className="rounded-[12px] flex items-center justify-center shrink-0" bg={saveAction === "campaign" ? TV.brand : TV.surface}>
                      <Send size={18} color={saveAction === "campaign" ? "white" : TV.textLabel} />
                    </Box>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text fz={14} fw={600} c={saveAction === "campaign" ? TV.textBrand : TV.textPrimary}>Save & Use in Campaign</Text>
                      <Text fz={12} c={TV.textSecondary}>Save and immediately attach to a new campaign</Text>
                    </Box>
                    {saveAction === "campaign" && <Check size={16} style={{ color: TV.brand }} />}
                  </UnstyledButton>
                </Stack>
              </div>

              {/* Summary */}
              <div className="rounded-[16px] p-5" style={{ backgroundColor: TV.surface, border: `1px solid ${TV.borderDivider}` }}>
                <Text fz={12} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5px" mb={10}>Summary</Text>
                <Stack gap={6}>
                  <div className="flex items-center gap-2">
                    <Text fz={12} c={TV.textSecondary} w={100}>Channel</Text>
                    <Badge size="xs" variant="light" color={channel === "email" ? "tvPurple" : "cyan"}>{channel.toUpperCase()}</Badge>
                  </div>
                  {channel === "email" && (
                    <>
                      <div className="flex items-center gap-2">
                        <Text fz={12} c={TV.textSecondary} w={100}>Subject</Text>
                        <Text fz={12} c={TV.textPrimary} className="truncate">{subject || "—"}</Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Text fz={12} c={TV.textSecondary} w={100}>Sections</Text>
                        <Text fz={12} c={TV.textPrimary}>
                          {sections.filter(s => s.type === "text").length} text, {sections.filter(s => s.type === "video").length} video, {sections.filter(s => s.type === "cta").length} CTA
                        </Text>
                      </div>
                    </>
                  )}
                  {channel === "sms" && (
                    <>
                      <div className="flex items-center gap-2">
                        <Text fz={12} c={TV.textSecondary} w={100}>Characters</Text>
                        <Text fz={12} c={TV.textPrimary}>{smsBody.length}</Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Text fz={12} c={TV.textSecondary} w={100}>Segments</Text>
                        <Text fz={12} c={TV.textPrimary}>{Math.ceil(smsBody.length / 160) || 1}</Text>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <Text fz={12} c={TV.textSecondary} w={100}>Template</Text>
                    <Text fz={12} c={TV.textPrimary}>{saveAsTemplate ? "Yes" : "No"}</Text>
                  </div>
                </Stack>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button variant="subtle" color="gray" radius="xl" size="md" leftSection={<ChevronLeft size={16} />}
                  onClick={() => setStep(1)} styles={{ root: { color: TV.textSecondary, fontSize: 14 } }}
                >
                  Back
                </Button>
                <Button radius="xl" size="md" color="tvPurple" disabled={!canSave}
                  leftSection={saveAction === "library" ? <Save size={16} /> : <Send size={16} />}
                  onClick={handleSave}
                  styles={{ root: { fontSize: 14, height: 44, paddingInline: 28 } }}
                >
                  {saveAction === "library" ? "Save to Library" : "Save & Use in Campaign"}
                </Button>
              </div>
            </Stack>

            <Box className="hidden lg:block lg:sticky lg:top-[120px] lg:self-start">
              <Text fz={12} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5px" mb={10}>Preview</Text>
              {channel === "email" ? (
                <EmailContentPreview subject={subject} preheader={preheader} greeting={greeting} sections={sections} closing={closing} />
              ) : (
                <SmsPhonePreview body={smsBody} />
              )}
            </Box>
          </Box>
          </Stack>
        )}

        {/* Step 1 nav */}
        {step === 1 && (
          <div className="flex items-center justify-between mt-8">
            <Button variant="subtle" color="gray" radius="xl" size="md" leftSection={<ChevronLeft size={16} />}
              onClick={() => setStep(0)} styles={{ root: { color: TV.textSecondary, fontSize: 14 } }}
            >
              Back
            </Button>
            <Button radius="xl" size="md" color="tvPurple" rightSection={<ChevronRight size={16} />}
              onClick={() => {
                if (!templateName && channel === "email") setTemplateName("Untitled Email Template");
                if (!templateName && channel === "sms") setTemplateName("Untitled SMS Template");
                setStep(2);
              }}
              styles={{ root: { fontSize: 14, height: 44, paddingInline: 28 } }}
            >
              Review & Save
            </Button>
          </div>
        )}
      </Box>
    </Box>
  );
}