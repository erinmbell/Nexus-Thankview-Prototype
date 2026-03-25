import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router";
import { useToast } from "../contexts/ToastContext";
import { useTemplates, type CampaignTemplate } from "../contexts/TemplateContext";
import { DeleteModal } from "../components/ui/DeleteModal";
import { EditColumnsModal, ColumnsButton, type ColumnDef } from "../components/ColumnCustomizer";
import {
  Plus, Mail, MessageSquare, Edit2, Copy,
  Trash2, X, FileText, Link2,
  PlayCircle, Archive, Send, GitBranch, Bell, ChevronDown,
  Bookmark, Tag, ChevronRight, SlidersHorizontal, Radio, User,
  ListFilter, Video, MoreHorizontal,
  ArrowUp, ArrowDown, ArrowUpDown, ChevronLeft, Search, Check,
} from "lucide-react";
import {
  TextInput, Button, Paper, Badge, Modal, Menu, ActionIcon,
  Title, Text, Group, Stack, Box, Checkbox, Table, UnstyledButton, Select, FocusTrap,
} from "@mantine/core";
import { TV } from "../theme";
import { PillSearchInput } from "../components/PillSearchInput";
import { TvTooltip } from "../components/TvTooltip";
import { FilterBar, type FilterValues, type FilterDef, DATE_CREATED_FILTER, dateFilterMatches } from "../components/FilterBar";
import { UserCheck, Calendar } from "lucide-react";

// ── Create-campaign dropdown items ─────────────────────────────────────────────
const CREATE_ITEMS: { mode: string; label: string; desc: string; icon: any; bg: string; iconColor: string }[] = [
  { mode: "single",           label: "Single-Step",      desc: "One message, one send",                     icon: Send,      bg: "var(--tv-brand-tint)", iconColor: "var(--tv-brand)" },
  { mode: "multi",            label: "Multi-Step",        desc: "Automated sequence of messages",            icon: GitBranch, bg: "var(--tv-info-bg)",    iconColor: "var(--tv-info)" },
  { mode: "video-request",    label: "Video Request",     desc: "Collect videos from constituents",          icon: Bell,      bg: "var(--tv-success-bg)", iconColor: "var(--tv-success)" },
];

// ── Campaign thumbnail stock images (Unsplash) ───────────────────────────────
const THUMB_IMAGES: Record<number, string> = {
  1:  "https://images.unsplash.com/photo-1743059840242-83a4ef88c32d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcHJpbmclMjBjaGVycnklMjBibG9zc29tJTIwY2FtcHVzfGVufDF8fHx8MTc3MzcyMTA0NXww&ixlib=rb-4.1.0&q=80&w=400",
  2:  "https://images.unsplash.com/photo-1634277449038-640d8db33127?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGFuayUyMHlvdSUyMGhhbmR3cml0dGVuJTIwY2FyZCUyMGdyYXRpdHVkZXxlbnwxfHx8fDE3NzM3MjEwMzR8MA&ixlib=rb-4.1.0&q=80&w=400",
  3:  "https://images.unsplash.com/photo-1739298061740-5ed03045b280?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3Jwb3JhdGUlMjBib2FyZCUyMG1lZXRpbmclMjBwcm9mZXNzaW9uYWxzfGVufDF8fHx8MTc3MzcyMTAzNXww&ixlib=rb-4.1.0&q=80&w=400",
  4:  "https://images.unsplash.com/photo-1671709034123-d816bf151d89?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwc3R1ZGVudHMlMjBvcmllbnRhdGlvbiUyMHdlbGNvbWV8ZW58MXx8fHwxNzczNzIxMDM1fDA&ixlib=rb-4.1.0&q=80&w=400",
  5:  "https://images.unsplash.com/photo-1678345201957-5612bd7dd6dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaGlsYW50aHJvcGlzdCUyMGRvbmF0aW9uJTIwaGFuZHNoYWtlfGVufDF8fHx8MTc3MzcyMTAzNnww&ixlib=rb-4.1.0&q=80&w=400",
  6:  "https://images.unsplash.com/photo-1748144679532-c36d9d5584e6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbHVtbmklMjByZXVuaW9uJTIwdW5pdmVyc2l0eSUyMGNhbXB1c3xlbnwxfHx8fDE3NzM3MjEwMzZ8MA&ixlib=rb-4.1.0&q=80&w=400",
  7:  "https://images.unsplash.com/photo-1700045530510-6e03007a8f48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFyaXR5JTIwbWF0Y2hpbmclMjBnaWZ0JTIwZnVuZHJhaXNlcnxlbnwxfHx8fDE3NzM3MjEwMzZ8MA&ixlib=rb-4.1.0&q=80&w=400",
  8:  "https://images.unsplash.com/photo-1770922809090-6a4b9fb06fff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvbGFyc2hpcCUyMGdyYWR1YXRpb24lMjBjYXAlMjBjZXJlbW9ueXxlbnwxfHx8fDE3NzM3MjEwMzd8MA&ixlib=rb-4.1.0&q=80&w=400",
  9:  "https://images.unsplash.com/photo-1607504622473-62981bf57d13?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwcmV1bmlvbiUyMGZyaWVuZHMlMjBjZWxlYnJhdGluZ3xlbnwxfHx8fDE3NzM3MjEwMzh8MA&ixlib=rb-4.1.0&q=80&w=400",
  10: "https://images.unsplash.com/photo-1560268744-aaab797cdfc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwaG9uZSUyMGNhbGwlMjB2b2x1bnRlZXIlMjBub25wcm9maXR8ZW58MXx8fHwxNzczNzIxMDM4fDA&ixlib=rb-4.1.0&q=80&w=400",
  11: "https://images.unsplash.com/photo-1651842082063-f0dc64c372cc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdHVkZW50JTIwdGVzdGltb25pYWwlMjB2aWRlbyUyMHJlY29yZGluZ3xlbnwxfHx8fDE3NzM3MjEwMzh8MA&ixlib=rb-4.1.0&q=80&w=400",
  12: "https://images.unsplash.com/photo-1651399973942-1721a0de0851?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaXJ0aGRheSUyMGNlbGVicmF0aW9uJTIwY29uZmV0dGklMjBwYXJ0eXxlbnwxfHx8fDE3NzM3MjEwMzl8MA&ixlib=rb-4.1.0&q=80&w=400",
  13: "https://images.unsplash.com/photo-1760960553755-0f355491749e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwY2FtcHVzJTIwaXZ5JTIwbGVhZ3VlJTIwYXV0dW1ufGVufDF8fHx8MTc3MzcyMTAzOXww&ixlib=rb-4.1.0&q=80&w=400",
  14: "https://images.unsplash.com/photo-1772987438485-ac832640c8a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBjYXJlZXIlMjBzdWNjZXNzJTIwYnVzaW5lc3N8ZW58MXx8fHwxNzczNjY4ODc4fDA&ixlib=rb-4.1.0&q=80&w=400",
};

// Fallback gradient for any campaigns without a mapped image
const FALLBACK_GRADIENT = "linear-gradient(135deg, #7c45b0 0%, #b07ce0 100%)";

function CampaignThumbnail({ campaign, size = "md" }: { campaign: Campaign; size?: "sm" | "md" }) {
  const imgSrc = THUMB_IMAGES[campaign.id];
  const dim = size === "md" ? "w-[100px] h-[68px]" : "w-[72px] h-[50px]";
  return (
    <div
      className={`${dim} rounded-md shrink-0 relative overflow-hidden`}
      style={imgSrc ? undefined : { background: FALLBACK_GRADIENT }}
    >
      {imgSrc ? (
        <img
          src={imgSrc}
          alt={campaign.name || "Campaign thumbnail"}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Mail size={size === "md" ? 22 : 16} className="text-white/80" />
        </div>
      )}
    </div>
  );
}

function CreateCampaignDropdown({ navigate, compact, onOpenTemplates }: { navigate: (path: string) => void; compact?: boolean; onOpenTemplates: () => void }) {
  return (
    <Menu position="bottom-end" withinPortal styles={{
      dropdown: { borderColor: TV.borderLight, borderRadius: 10, padding: "6px 6px 2px", minWidth: 300, boxShadow: TV.shadowDropdown },
    }}>
      <Menu.Target>
        <Button
          leftSection={<Plus size={15} />}
          rightSection={<ChevronDown size={13} />}
          color="tvPurple"
          radius="xl"
          styles={{ label: { display: "flex", alignItems: "center" } }}
        >
          {compact ? "New" : <><span className="hidden sm:inline">Create Campaign</span><span className="sm:hidden">New</span></>}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <div className="px-3 pt-2 pb-1.5">
          <span className="text-[11px] text-tv-text-secondary tracking-widest uppercase font-semibold">Create Campaign</span>
        </div>
        {CREATE_ITEMS.map((item) => (
          <Menu.Item
            key={item.mode}
            onClick={() => navigate(`/campaigns/create?mode=${item.mode}`)}
            styles={{
              item: { borderRadius: 10, padding: "10px 12px", marginBottom: 2 },
              itemLabel: { display: "flex", alignItems: "center", gap: 12 },
            }}
          >
            <div className="flex items-center gap-3 w-full">
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
                style={{ backgroundColor: item.bg }}
              >
                <item.icon size={18} style={{ color: item.iconColor }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] text-tv-text-primary font-semibold">{item.label}</p>
                <p className="text-[11px] text-tv-text-secondary">{item.desc}</p>
              </div>
            </div>
          </Menu.Item>
        ))}
        <div className="mx-2 my-1 border-t border-tv-border-divider" />
        <div className="px-3 pt-1.5 pb-1">
          <span className="text-[11px] text-tv-text-secondary tracking-widest uppercase font-semibold">From Template</span>
        </div>
        <Menu.Item
          onClick={onOpenTemplates}
          styles={{
            item: { borderRadius: 10, padding: "10px 12px", marginBottom: 4 },
            itemLabel: { display: "flex", alignItems: "center", gap: 12 },
          }}
        >
          <div className="flex items-center gap-3 w-full">
            <div
              className="w-10 h-10 rounded-md flex items-center justify-center shrink-0"
              style={{ backgroundColor: "var(--tv-star-bg)" }}
            >
              <Bookmark size={18} className="text-tv-warning" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-tv-text-primary font-semibold">Start from Template</p>
              <p className="text-[11px] text-tv-text-secondary">Pre-populate from a saved template</p>
            </div>
            <ChevronRight size={14} className="text-tv-text-decorative shrink-0" />
          </div>
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────────
type Campaign = {
  id: number; name: string; steps: "single" | "multi" | "video-request";
  channel: string; status: string; creator: string;
  videos: number; sent: number; openRate: string;
  replies: number; spamRate: string; bounceRate: string; sendDate: string;
  videoViews: number; clickRate: string;
  constituents: number;
  tags: string[];
};

const CAMPAIGNS: Campaign[] = [
  { id: 1,  name: "Spring Annual Fund Appeal",         steps: "single", channel: "Email", status: "Sent",      creator: "Kelley Molt",    videos: 142, sent: 142, openRate: "82.4%", replies: 18,  spamRate: "0.1%", bounceRate: "1.4%", sendDate: "Feb 14, 2026", videoViews: 118, clickRate: "34.5%", constituents: 142, tags: ["Solicitation", "Annual Fund", "Q1 2026"] },
  { id: 2,  name: "Thank You – Multi-Step 2.0",          steps: "multi",  channel: "Email + SMS", status: "Sent",      creator: "Kelley Molt",    videos: 9,   sent: 9,   openRate: "77.8%", replies: 0,   spamRate: "0.0%", bounceRate: "0.0%", sendDate: "Feb 10, 2026", videoViews: 7,   clickRate: "55.6%", constituents: 9, tags: ["Thank You", "Stewardship"] },
  { id: 3,  name: "Board Member Appreciation",         steps: "single", channel: "Email", status: "Scheduled", creator: "James Okafor",   videos: 18,  sent: 0,   openRate: "—",     replies: 0,   spamRate: "—",    bounceRate: "—",    sendDate: "Feb 28, 2026", videoViews: 0,   clickRate: "—", constituents: 18, tags: ["Thank You", "Board", "VIP"] },
  { id: 4,  name: "New Student Welcome Series",        steps: "multi",  channel: "Email + SMS", status: "Draft",     creator: "Michelle Park",  videos: 0,   sent: 0,   openRate: "—",     replies: 0,   spamRate: "—",    bounceRate: "—",    sendDate: "—",            videoViews: 0,   clickRate: "—", constituents: 0, tags: ["Update", "Onboarding", "Students"] },
  { id: 5,  name: "Major Gift Cultivation – Q1",       steps: "multi",  channel: "SMS",   status: "Sent",      creator: "Kelley Molt",    videos: 34,  sent: 34,  openRate: "91.2%", replies: 12,  spamRate: "0.0%", bounceRate: "0.3%", sendDate: "Jan 30, 2026", videoViews: 31,  clickRate: "41.2%", constituents: 34, tags: ["Solicitation", "Major Gifts", "Q1 2026", "High Priority"] },
  { id: 6,  name: "Alumni Weekend 2026 Save the Date", steps: "single", channel: "Email", status: "Archived",  creator: "James Okafor",   videos: 0,   sent: 504, openRate: "68.3%", replies: 47,  spamRate: "0.2%", bounceRate: "3.1%", sendDate: "Jan 15, 2026", videoViews: 0,   clickRate: "22.8%", constituents: 504, tags: ["Event", "Alumni", "2026"] },
  { id: 7,  name: "Matching Gift Challenge",           steps: "single", channel: "Email", status: "Draft",     creator: "Kelley Molt",    videos: 0,   sent: 0,   openRate: "—",     replies: 0,   spamRate: "—",    bounceRate: "—",    sendDate: "—",            videoViews: 0,   clickRate: "—", constituents: 0, tags: ["Solicitation", "Matching Gift"] },
  { id: 8,  name: "Scholarship Endowment Report 2025", steps: "single", channel: "Email", status: "Sent",      creator: "Kelley Molt",    videos: 891, sent: 891, openRate: "74.1%", replies: 203, spamRate: "0.0%", bounceRate: "2.0%", sendDate: "Dec 5, 2025",  videoViews: 661, clickRate: "28.9%", constituents: 891, tags: ["Endowment Report", "Scholarship", "Year-End", "Stewardship"] },
  { id: 9,  name: "Reunion Giving Challenge",          steps: "multi",  channel: "Email + SMS", status: "Scheduled", creator: "Michelle Park",  videos: 4,   sent: 0,   openRate: "—",     replies: 0,   spamRate: "—",    bounceRate: "—",    sendDate: "Mar 10, 2026", videoViews: 0,   clickRate: "—", constituents: 0, tags: ["Solicitation", "Reunion", "Alumni"] },
  { id: 10, name: "Phonathon Follow-Up Drip",          steps: "multi",  channel: "SMS",   status: "Sent",      creator: "Kelley Molt",    videos: 66,  sent: 66,  openRate: "88.5%", replies: 9,   spamRate: "0.0%", bounceRate: "0.5%", sendDate: "Jan 22, 2026", videoViews: 52,  clickRate: "36.4%", constituents: 66, tags: ["Thank You", "Phonathon"] },
  { id: 11, name: "Student Video Testimonials",         steps: "video-request", channel: "Email", status: "Sent",      creator: "Michelle Park",  videos: 0,   sent: 237, openRate: "61.8%", replies: 42,  spamRate: "—",    bounceRate: "—",    sendDate: "Feb 3, 2026",  videoViews: 0,   clickRate: "18.6%", constituents: 237, tags: ["Video Request", "Students", "Testimonials"] },
  { id: 12, name: "Birthday Outreach – Feb Cohort",    steps: "single", channel: "Email", status: "Sent",      creator: "Kelley Molt",    videos: 45,  sent: 45,  openRate: "91.1%", replies: 8,   spamRate: "0.0%", bounceRate: "0.0%", sendDate: "Feb 1, 2026",  videoViews: 38,  clickRate: "42.2%", constituents: 45, tags: ["Birthday", "Engagement"] },
  { id: 13, name: "Class of 2016 – 10th Reunion",      steps: "single", channel: "Email", status: "Scheduled", creator: "James Okafor", videos: 0, sent: 0,  openRate: "—",     replies: 0,   spamRate: "—",    bounceRate: "—",    sendDate: "Mar 15, 2026", videoViews: 0,   clickRate: "—", constituents: 0, tags: ["Anniversary", "Reunion", "Class of 2016"] },
  { id: 14, name: "Career Update – Alumni Success",    steps: "single", channel: "Email", status: "Draft",      creator: "Michelle Park", videos: 0,   sent: 0,   openRate: "—",     replies: 0,   spamRate: "—",    bounceRate: "—",    sendDate: "—",            videoViews: 0,   clickRate: "—", constituents: 0, tags: ["Career Move", "Alumni", "Engagement"] },
  { id: 15, name: "Faculty Thank You Videos",          steps: "video-request", channel: "Email", status: "Scheduled", creator: "James Okafor", videos: 0,   sent: 0,   openRate: "—",     replies: 0,   spamRate: "—",    bounceRate: "—",    sendDate: "Mar 20, 2026", videoViews: 0,   clickRate: "—", constituents: 62, tags: ["Video Request", "Faculty", "Thank You"] },
];

const STATUS_BADGE: Record<string, string> = {
  Sent:      "green",
  Scheduled: "cyan",
  Draft:     "tvPurple",
  Paused:    "yellow",
  Archived:  "gray",
};

const STATUSES  = ["All", "Sent", "Scheduled", "Draft", "Paused", "Archived"];
const CHANNELS  = ["All Channels", "Email", "SMS", "Email + SMS", "Shareable Link"];
const CREATORS  = ["All Creators", "Kelley Molt", "James Okafor", "Michelle Park"];

// Collect all unique tags from campaign data
const ALL_TAGS = Array.from(new Set(CAMPAIGNS.flatMap(c => c.tags))).sort();

// ── Shared FilterBar definitions for campaigns ─────────────────────────────────
const CAMPAIGN_FILTERS: FilterDef[] = [
  {
    key: "status", label: "Status", icon: ListFilter, type: "select", essential: true,
    options: STATUSES.filter(s => s !== "All").map(s => ({ value: s, label: s })),
  },
  {
    key: "tags", label: "Tags", icon: Tag, type: "select", essential: true, searchable: true,
    options: ALL_TAGS.map(t => ({ value: t, label: t })),
  },
  {
    key: "channel", label: "Channel", icon: Radio, type: "select", essential: true,
    options: CHANNELS.filter(c => c !== "All Channels").map(c => ({ value: c, label: c })),
  },
  {
    key: "creator", label: "Creator", icon: UserCheck, type: "select", essential: true, searchable: true,
    options: CREATORS.filter(c => c !== "All Creators").map(c => ({ value: c, label: c })),
  },
  {
    ...DATE_CREATED_FILTER,
    essential: false,
  },
];
const DEFAULT_CAMPAIGN_FILTER_KEYS = CAMPAIGN_FILTERS.filter(f => f.essential).map(f => f.key);

// ── Rename Modal ────────────��──────────────────────────────────────────────────
function RenameModal({ name, onRename, onCancel }: { name: string; onRename: (n: string) => void; onCancel: () => void }) {
  const [newName, setNewName] = useState(name);
  return (
    <Modal opened onClose={onCancel} title="Rename Campaign" size="sm">
      <TextInput label="Campaign name" value={newName} onChange={e => setNewName(e.currentTarget.value)} autoFocus mb="lg" />
      <Group justify="flex-end" gap="sm">
        <Button key="cancel-btn" variant="default" onClick={onCancel}>Cancel</Button>
        <Button key="rename-btn" color="tvPurple" onClick={() => onRename(newName)} disabled={!newName.trim()}>Rename</Button>
      </Group>
    </Modal>
  );
}

// ── Duplicate Modal ──────────────────────────────────────────────────────────
function DuplicateModal({ name, channel, steps, onDuplicate, onCancel }: { name: string; channel: string; steps: "single" | "multi" | "video-request"; onDuplicate: (n: string) => void; onCancel: () => void }) {
  const [newName, setNewName] = useState(`Duplicate of ${name}`);
  const [dupChannel, setDupChannel] = useState(channel);
  const [dupMode, setDupMode] = useState<"single" | "multi" | "video-request">(steps);
  const [checked, setChecked] = useState({
    message: true, landing: true, video: true, constituents: true,
    sendMethod: true, schedule: true, inboxSettings: true, successMetric: true,
    share: false, tags: true,
    beforeEvent: false, failureEvent: false, successEvent: false,
  });
  const toggle = (k: keyof typeof checked) => setChecked(c => ({ ...c, [k]: !c[k] }));

  const ITEMS: { key: keyof typeof checked; label: string; note?: string }[] = [
    { key: "message",       label: "Message copy (subject, body, sender info)" },
    { key: "landing",       label: "Landing page design, settings & copy" },
    { key: "video",         label: "Video content" },
    { key: "constituents",    label: "Constituent list", note: "If not included, personalized videos won't copy" },
    { key: "sendMethod",    label: "Send method (Email / SMS / Shareable Link)" },
    { key: "schedule",      label: "Schedule (send date, time & constituent-field triggers)" },
    { key: "inboxSettings", label: "Inbox settings (reply-to addresses, tracking)" },
    { key: "successMetric", label: "Success metric (defaults to Open Rate)" },
    { key: "share",         label: "Share settings" },
    { key: "tags",          label: "Tags" },
    { key: "beforeEvent",   label: "Before event" },
    { key: "failureEvent",  label: "Failure event" },
    { key: "successEvent",  label: "Success event" },
  ];

  return (
    <Modal opened onClose={onCancel} title="Duplicate Campaign" size="lg">
      <TextInput label="New campaign name" value={newName} onChange={e => setNewName(e.currentTarget.value)} mb="md" />

      {/* Channel switch option */}
      <Box mb="md">
        <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={8}>Delivery channel for new campaign</Text>
        <Group gap="xs" grow>
          {["Email", "SMS", "Email + SMS", "Shareable Link"].map(ch => (
            <Button
              key={ch}
              onClick={() => setDupChannel(ch)}
              variant={dupChannel === ch ? "light" : "default"}
              color={dupChannel === ch ? "tvPurple" : "gray"}
              size="compact-sm"
              leftSection={ch === "Email" ? <Mail size={13} /> : ch === "SMS" ? <MessageSquare size={13} /> : ch === "Email + SMS" ? <><Mail size={11} /><MessageSquare size={11} /></> : <Link2 size={13} />}
              styles={{
                root: {
                  borderWidth: 2,
                  borderColor: dupChannel === ch ? TV.textBrand : TV.borderLight,
                  backgroundColor: dupChannel === ch ? TV.brandTint : "white",
                },
                label: { color: dupChannel === ch ? TV.textBrand : TV.textPrimary }
              }}
            >
              {ch}
            </Button>
          ))}
        </Group>
        {dupChannel !== channel && (
          <Text fz={11} c={TV.warning} mt={6}>Message copy will be adapted for {dupChannel} format.</Text>
        )}
      </Box>

      {/* Campaign mode (single vs multi-step) */}
      <Box mb="md">
        <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={8}>Campaign mode</Text>
        <Group gap="xs">
          {([{ key: "single" as const, label: "Single-Step" }, { key: "multi" as const, label: "Multi-Step" }, { key: "video-request" as const, label: "Video Request" }]).map(m => (
            <Button key={m.key} onClick={() => setDupMode(m.key)}
              variant={dupMode === m.key ? "light" : "default"}
              color={dupMode === m.key ? "tvPurple" : "gray"}
              size="compact-sm"
              styles={{
                root: { borderWidth: 2, borderColor: dupMode === m.key ? TV.textBrand : TV.borderLight, backgroundColor: dupMode === m.key ? TV.brandTint : "white" },
                label: { color: dupMode === m.key ? TV.textBrand : TV.textPrimary },
              }}
            >{m.label}</Button>
          ))}
        </Group>
        {dupMode !== steps && (
          <Text fz={11} c={TV.warning} mt={6}>{
            dupMode === "multi" ? "Automation steps will need to be configured after duplication."
            : dupMode === "video-request" ? "Campaign will be converted to a video request flow."
            : "Multi-step automation will be flattened to a single send."
          }</Text>
        )}
      </Box>

      <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb="sm">What to include</Text>
      <Stack gap="xs" mb="lg">
        {ITEMS.map(item => (
          <Checkbox key={item.key} checked={checked[item.key]} onChange={() => toggle(item.key)} color="tvPurple" size="sm"
            label={<>
              <Group gap={5} align="center" wrap="nowrap"><Text fz={13} c={TV.textPrimary}>{item.label}</Text></Group>
              {item.note && <Text fz={11} c={TV.textSecondary}>{item.note}</Text>}
            </>}
          />
        ))}
      </Stack>
      <Group justify="flex-end" gap="sm">
        <Button key="cancel-btn" variant="default" onClick={onCancel}>Cancel</Button>
        <Button key="duplicate-btn" color="tvPurple" onClick={() => onDuplicate(newName)}>Duplicate</Button>
      </Group>
    </Modal>
  );
}

// ── Template Picker Modal ──────────────────────────────────────────────────────
function TemplatePickerModal({ onSelect, onCancel }: { onSelect: (tpl: CampaignTemplate) => void; onCancel: () => void }) {
  const { templates, removeTemplate } = useTemplates();
  const [tplSearch, setTplSearch] = useState("");
  const [modeFilter, setModeFilter] = useState<"all" | "single" | "multi">("all");
  const [confirmDelete, setConfirmDelete] = useState<CampaignTemplate | null>(null);
  const { show } = useToast();

  // Close delete confirmation on Escape (WCAG 2.1.1)
  useEffect(() => {
    if (!confirmDelete) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setConfirmDelete(null); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [confirmDelete]);

  const filtered = templates.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(tplSearch.toLowerCase()) || t.description.toLowerCase().includes(tplSearch.toLowerCase());
    const matchMode = modeFilter === "all" || t.mode === modeFilter;
    return matchSearch && matchMode;
  });

  const GOAL_LABELS: Record<string, string> = {
    "send-video": "Send with Video",
    "send-without-video": "Send without Video",
    "request-video": "Video Request",
  };

  return (
    <Modal opened onClose={onCancel} title="Start from Template" size="lg"
      styles={{ body: { padding: "0 20px 20px" } }}>
      <div className="flex items-center gap-3 mb-4 pt-1">
        <PillSearchInput value={tplSearch} onChange={setTplSearch} placeholder="Search templates…" className="flex-1" />
        <div className="flex gap-1">
          {(["all", "single", "multi"] as const).map(m => (
            <button key={m} onClick={() => setModeFilter(m)}
              className={`px-4 py-2 rounded-full text-[14px] border transition-all ${
                modeFilter === m
                  ? "bg-tv-brand-bg text-white border-tv-brand-bg"
                  : "bg-white text-tv-text-secondary border-tv-border-light hover:border-tv-border-strong"
              }`} style={{ fontWeight: 500 }}>
              {m === "all" ? "All" : m === "single" ? "Single" : "Multi"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-3">
          <Bookmark size={28} className="text-tv-text-decorative" />
          <p className="text-[14px] text-tv-text-primary font-semibold">No templates found</p>
          <p className="text-[12px] text-tv-text-secondary">Try adjusting your search or create a campaign and save it as a template.</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {filtered.map(tpl => (
            <button key={tpl.id} onClick={() => onSelect(tpl)}
              className="w-full text-left p-4 rounded-xl border border-tv-border-light bg-white hover:border-tv-brand hover:shadow-sm transition-all group relative">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: tpl.builtIn ? "var(--tv-brand-tint)" : "var(--tv-star-bg)" }}>
                  <Bookmark size={17} className={tpl.builtIn ? "text-tv-brand" : "text-tv-warning"} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] text-tv-text-primary truncate font-semibold">{tpl.name}</p>
                    {tpl.builtIn && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-tv-brand-tint text-tv-brand shrink-0 font-semibold">BUILT-IN</span>
                    )}
                  </div>
                  <p className="text-[12px] text-tv-text-secondary mb-2 line-clamp-2">{tpl.description}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge size="xs" variant="light" color={tpl.mode === "single" ? "tvPurple" : tpl.mode === "video-request" ? "green" : "blue"} radius="xl">
                      {tpl.mode === "single" ? "Single-Step" : tpl.mode === "video-request" ? "Video Request" : "Multi-Step"}
                    </Badge>
                    {tpl.goal && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-tv-surface text-tv-text-label border border-tv-border-divider">{GOAL_LABELS[tpl.goal] || tpl.goal}</span>
                    )}
                    {tpl.channel && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-tv-surface text-tv-text-label border border-tv-border-divider flex items-center gap-1">
                        {tpl.channel === "email" ? <Mail size={9} /> : <MessageSquare size={9} />}
                        {tpl.channel === "email" ? "Email" : "SMS"}
                      </span>
                    )}
                    {tpl.tags.map(t => (
                      <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-tv-surface text-tv-text-secondary border border-tv-border-divider flex items-center gap-1">
                        <Tag size={8} />{t}
                      </span>
                    ))}
                  </div>
                  {/* Content preview */}
                  {tpl.stepContent && (tpl.stepContent.subject || tpl.stepContent.smsBody) && (
                    <div className="mt-2 p-2 bg-tv-surface-muted rounded-sm border border-tv-border-divider">
                      {tpl.stepContent.subject && (
                        <p className="text-[10px] text-tv-text-label truncate"><span className="font-semibold">Subject:</span> {tpl.stepContent.subject}</p>
                      )}
                      {tpl.stepContent.body && (
                        <p className="text-[10px] text-tv-text-secondary truncate mt-0.5">{tpl.stepContent.body.replace(/<[^>]+>/g, "").slice(0, 90)}{tpl.stepContent.body.replace(/<[^>]+>/g, "").length > 90 ? "\u2026" : ""}</p>
                      )}
                      {tpl.stepContent.smsBody && (
                        <p className="text-[10px] text-tv-text-secondary truncate"><span className="font-semibold">SMS:</span> {tpl.stepContent.smsBody.slice(0, 90)}{tpl.stepContent.smsBody.length > 90 ? "\u2026" : ""}</p>
                      )}
                      {tpl.mode === "multi" && tpl.multiSteps && (
                        <p className="text-[10px] text-tv-text-label mt-0.5" style={{ fontWeight: 500 }}>{tpl.multiSteps.length} steps pre-configured</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!tpl.builtIn && (
                    <TvTooltip label="Delete template">
                      <button onClick={e => { e.stopPropagation(); setConfirmDelete(tpl); }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-tv-text-decorative hover:text-tv-danger hover:bg-tv-danger/10 transition-colors"
                        aria-label={`Delete template ${tpl.name}`}>
                        <Trash2 size={13} />
                      </button>
                    </TvTooltip>
                  )}
                  <ChevronRight size={16} className="text-tv-text-decorative group-hover:text-tv-brand transition-colors" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <FocusTrap active>
        <div className="fixed inset-0 bg-black/30 z-[1000] flex items-center justify-center" onClick={() => setConfirmDelete(null)} role="dialog" aria-modal="true" aria-labelledby="delete-template-title">
          <div className="bg-white rounded-xl border border-tv-border-light p-6 max-w-[380px] w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <p id="delete-template-title" className="text-[15px] text-tv-text-primary mb-2" style={{ fontWeight: 900 }}>Delete template?</p>
            <p className="text-[13px] text-tv-text-secondary mb-5">"{confirmDelete.name}" will be permanently removed. This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-[13px] text-tv-text-primary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors">
                Cancel
              </button>
              <button onClick={() => {
                removeTemplate(confirmDelete.id);
                show(`Template "${confirmDelete.name}" deleted`, "success");
                setConfirmDelete(null);
              }}
                className="px-4 py-2 text-[13px] text-white bg-tv-danger rounded-full hover:bg-tv-danger-hover transition-colors font-semibold">
                Delete
              </button>
            </div>
          </div>
        </div>
        </FocusTrap>
      )}
    </Modal>
  );
}

// ── View tab strip ────────────────────────────────────────────────────────��────
type ViewKey = "all" | "single" | "multi" | "video-request";
const VIEW_TABS: { key: ViewKey; label: string }[] = [
  { key: "all",             label: "All Campaigns"  },
  { key: "single",          label: "Single Step"     },
  { key: "multi",           label: "Multi-Step"      },
  { key: "video-request",   label: "Video Request"   },
];

// ── SortableHeader ──────────────────────────────────────────────────────────────
function SortableHeader({ label, sortKey, currentSort, currentDir, onSort }: {
  label: string; sortKey: string;
  currentSort: string | null; currentDir: "asc" | "desc" | null;
  onSort: (key: string) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <UnstyledButton onClick={() => onSort(sortKey)} className="flex items-center gap-1 group">
      <Text fz={11} fw={600} tt="uppercase" lts="0.04em"
        c={active ? TV.textBrand : TV.textSecondary}
        className="select-none whitespace-nowrap">
        {label}
      </Text>
      <Box className="shrink-0" style={{ color: active ? TV.textBrand : TV.borderStrong }}>
        {active && currentDir === "asc" ? <ArrowUp size={12} /> :
         active && currentDir === "desc" ? <ArrowDown size={12} /> :
         <ArrowUpDown size={11} />}
      </Box>
    </UnstyledButton>
  );
}

// ── TablePagination ────��────────────────────────────────────────────────────────
function TablePagination({ page, rowsPerPage, totalRows, onPageChange, onRowsPerPageChange }: {
  page: number; rowsPerPage: number; totalRows: number;
  onPageChange: (p: number) => void; onRowsPerPageChange: (r: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const start = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, totalRows);

  const pageButtons: number[] = [];
  for (let i = 1; i <= totalPages; i++) pageButtons.push(i);

  return (
    <div className="flex items-center justify-between flex-wrap gap-y-2 px-5 py-3"
      style={{ borderTop: `1px solid ${TV.borderLight}` }}>
      <div className="flex items-center gap-3">
        <Text fz={12} c={TV.textSecondary}>Rows per page:</Text>
        <Select data={["10","25","50","100"]} value={String(rowsPerPage)}
          onChange={v => { onRowsPerPageChange(Number(v)); onPageChange(1); }}
          size="xs" w={70} radius="md"
          styles={{ input: { borderColor: TV.borderLight, fontSize: 12 } }} />
        <Text fz={12} c={TV.textSecondary}>
          {start}–{end} of {totalRows}
        </Text>
      </div>
      <nav className="flex items-center gap-1">
        <ActionIcon variant="subtle" color="gray" size="sm" disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}>
          <ChevronLeft size={14} />
        </ActionIcon>
        {pageButtons.map(btn => (
          <ActionIcon key={btn} size="sm" radius="md"
            variant={btn === page ? "filled" : "subtle"}
            color={btn === page ? "tvPurple" : "gray"}
            onClick={() => onPageChange(btn)}>
            <Text fz={11}>{btn}</Text>
          </ActionIcon>
        ))}
        <ActionIcon variant="subtle" color="gray" size="sm" disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}>
          <ChevronRight size={14} />
        </ActionIcon>
      </nav>
    </div>
  );
}

// ── Column definitions ──────────────────────────────────────────────────────────
const ALL_COLUMNS: ColumnDef[] = [
  { key: "name",     label: "Campaign",  group: "Summary", required: true },
  { key: "status",   label: "Status",    group: "Summary" },
  { key: "sent",     label: "Sent",      group: "Engagement" },
  { key: "openRate", label: "Open Rate", group: "Engagement" },
  { key: "clickRate",label: "Clicks",    group: "Engagement" },
  { key: "replies",  label: "Reply Count", group: "Engagement" },
  { key: "created",  label: "Created",   group: "Summary" },
];

const DEFAULT_COLUMNS = ALL_COLUMNS.map(c => c.key);

// ── Filter Dropdown (portal-based) ──────────────────────────────────────────────
function FilterDropdown({
  icon: Icon, label, items, value, defaultValue, onChange, showSearch,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  items: { value: string; label: string }[];
  value: string;
  defaultValue: string;
  onChange: (v: string) => void;
  showSearch?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const btnRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const isActive = value !== defaultValue;

  const updatePos = useCallback(() => {
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const onScroll = () => updatePos();
    window.addEventListener("scroll", onScroll, true);
    return () => window.removeEventListener("scroll", onScroll, true);
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (btnRef.current?.contains(e.target as Node)) return;
      if (dropRef.current?.contains(e.target as Node)) return;
      setOpen(false);
      setSearch("");
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const filtered = showSearch && search
    ? items.filter(i => i.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  const activeLabel = isActive ? items.find(i => i.value === value)?.label || value : "";

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => { setOpen(!open); setSearch(""); }}
        className={`flex items-center gap-[6px] px-[13px] py-[6px] rounded-full border text-[12px] whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
          isActive
            ? "border-tv-brand bg-tv-brand-tint"
            : "border-tv-border-light bg-white text-tv-text-primary hover:bg-tv-surface"
        }`}
        style={{ fontWeight: 500 }}
      >
        {isActive ? (
          <>
            <Icon size={13} className="text-tv-brand shrink-0" />
            <span className="text-tv-brand font-semibold">{label}</span>
            <div className="w-px h-[14px] bg-tv-brand/30 shrink-0" />
            <span className="text-tv-brand" style={{ fontWeight: 500 }}>{activeLabel}</span>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); e.preventDefault(); onChange(defaultValue); }}
              className="shrink-0 size-[14px] rounded-full inline-flex items-center justify-center text-tv-brand hover:text-tv-brand-hover transition-colors cursor-pointer"
              aria-label={`Clear ${label} filter`}
            >
              <X size={10} />
            </button>
          </>
        ) : (
          <>
            <Icon size={13} className="text-tv-text-secondary shrink-0" />
            <span className="text-tv-text-primary" style={{ fontWeight: 500 }}>{label}</span>
            <ChevronDown size={11} className="text-tv-text-secondary shrink-0" />
          </>
        )}
      </button>
      {open && createPortal(
        <div
          ref={dropRef}
          className="fixed z-[9999] bg-white rounded-md border border-tv-border-light shadow-lg py-1 min-w-[160px] max-h-[320px] flex flex-col"
          style={{ top: pos.top, left: pos.left }}
        >
          {showSearch && (
            <div className="px-2 pt-1.5 pb-1">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-tv-text-secondary pointer-events-none" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${label.toLowerCase()}…`}
                  className="w-full pl-[28px] pr-3 py-1.5 text-[12px] border border-tv-border-light rounded-full outline-none focus:ring-1 focus:ring-tv-brand/40 focus:border-tv-brand bg-white text-tv-text-primary placeholder:text-tv-text-decorative"
                  autoFocus
                />
              </div>
            </div>
          )}
          <div className="overflow-y-auto flex-1">
            {filtered.map(item => (
              <button
                key={item.value}
                onClick={() => { onChange(item.value); setOpen(false); setSearch(""); }}
                className={`w-full text-left px-3 py-[7px] text-[14px] transition-colors flex items-center justify-between gap-2 ${
                  value === item.value
                    ? "text-tv-brand bg-tv-brand-tint/40"
                    : "text-tv-text-primary hover:bg-tv-surface-muted"
                }`}
                style={{ fontWeight: value === item.value ? 600 : 400 }}
              >
                <span className="truncate">{item.label}</span>
                {value === item.value && <Check size={13} className="text-tv-brand shrink-0" />}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-[12px] text-tv-text-secondary text-center">No results</p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// ── Main page ──────────────────────────────────────────────��───────────────────
export function CampaignsList() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const view = (searchParams.get("view") ?? "all") as ViewKey;
  const setView = (v: ViewKey) => {
    if (v === "all") setSearchParams({});
    else setSearchParams({ view: v });
  };

  const [search,  setSearch]  = useState("");
  const [filterValues, setFilterValues] = useState<FilterValues>({});
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(DEFAULT_CAMPAIGN_FILTER_KEYS);
  const [openMenu,    setOpenMenu]    = useState<number | null>(null);
  const [duplicating, setDuplicating] = useState<Campaign | null>(null);
  const [deleting,    setDeleting]    = useState<Campaign | null>(null);
  const [renaming,    setRenaming]    = useState<Campaign | null>(null);
  const [campaigns,   setCampaigns]   = useState(CAMPAIGNS);
  const [bulkSelected, setBulkSelected] = useState<number[]>([]);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc" | null>(null);
  const [showEditColumns, setShowEditColumns] = useState(false);
  const [activeColumns, setActiveColumns] = useState<string[]>(DEFAULT_COLUMNS);

  const handleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir("asc"); }
    else if (sortDir === "asc") setSortDir("desc");
    else { setSortKey(null); setSortDir(null); }
  };

  const handleSelectTemplate = (tpl: CampaignTemplate) => {
    setShowTemplatePicker(false);
    // Navigate to builder with template ID as URL param
    const mode = tpl.mode === "multi" ? "multi" : (tpl.goal === "request-video" ? "video-request" : "single");
    navigate(`/campaigns/create?mode=${mode}&template=${tpl.id}`);
  };

  const filtered = campaigns.filter(c => {
    const matchView    = view === "all" || c.steps === view;
    const matchSearch  = c.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus  = !filterValues.status?.length  || filterValues.status.includes(c.status);
    const matchChannel = !filterValues.channel?.length  || filterValues.channel.includes(c.channel);
    const matchCreator = !filterValues.creator?.length  || filterValues.creator.includes(c.creator);
    const matchTag     = !filterValues.tags?.length     || c.tags.some(t => filterValues.tags.includes(t));
    return matchView && matchSearch && matchStatus && matchChannel && matchCreator && matchTag;
  });

  // Sort
  const sortedFiltered = [...filtered].sort((a, b) => {
    if (!sortKey || !sortDir) return 0;
    const valA = (a as any)[sortKey];
    const valB = (b as any)[sortKey];
    if (typeof valA === "number" && typeof valB === "number") return sortDir === "asc" ? valA - valB : valB - valA;
    const sA = String(valA ?? ""); const sB = String(valB ?? "");
    return sortDir === "asc" ? sA.localeCompare(sB) : sB.localeCompare(sA);
  });

  // Paginate
  const paginatedRows = sortedFiltered.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const allOnPageSelected = paginatedRows.length > 0 && paginatedRows.every(r => bulkSelected.includes(r.id));
  const someSelected = bulkSelected.length > 0;

  const handleDelete = () => {
    if (!deleting) return;
    setCampaigns(c => c.filter(x => x.id !== deleting.id));
    setBulkSelected(s => s.filter(id => id !== deleting.id));
    show(`"${deleting.name}" deleted`, "success");
    setDeleting(null);
  };

  const handleDuplicate = (newName: string) => {
    if (!duplicating) return;
    const newC: Campaign = { ...duplicating, id: Date.now(), name: newName, status: "Draft", sent: 0, openRate: "—", replies: 0, spamRate: "—", bounceRate: "—", sendDate: "—", videoViews: 0, clickRate: "—", constituents: 0 };
    setCampaigns(c => [newC, ...c]);
    show(`Campaign duplicated as "${newName}"`, "success");
    setDuplicating(null);
  };

  const handleRename = (newName: string) => {
    if (!renaming) return;
    setCampaigns(c => c.map(x => x.id === renaming.id ? { ...x, name: newName } : x));
    show(`Campaign renamed to "${newName}"`, "success");
    setRenaming(null);
  };

  // ── Bulk actions ──
  const toggleBulk = (id: number) => setBulkSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const bulkDelete = () => {
    setCampaigns(c => c.filter(x => !bulkSelected.includes(x.id)));
    show(`${bulkSelected.length} campaign${bulkSelected.length > 1 ? "s" : ""} deleted`, "success");
    setBulkSelected([]);
  };

  const changeStatus = (id: number, newStatus: string) => {
    setCampaigns(c => c.map(x => x.id === id ? { ...x, status: newStatus } : x));
    const name = campaigns.find(x => x.id === id)?.name || "Campaign";
    show(`"${name}" → ${newStatus}`, "success");
    setOpenMenu(null);
  };

  const bulkChangeStatus = (newStatus: string) => {
    setCampaigns(c => c.map(x => bulkSelected.includes(x.id) ? { ...x, status: newStatus } : x));
    show(`${bulkSelected.length} campaign${bulkSelected.length > 1 ? "s" : ""} → ${newStatus}`, "success");
    setBulkSelected([]);
  };

  const viewCounts: Record<ViewKey, number> = {
    all:              campaigns.length,
    single:           campaigns.filter(c => c.steps === "single").length,
    multi:            campaigns.filter(c => c.steps === "multi").length,
    "video-request":  campaigns.filter(c => c.steps === "video-request").length,
  };

  return (
    <Box p={{ base: "sm", xl: "xl" }} style={{ minHeight: "100%" }}>
      {/* ── Header — sticky so Create CTA stays visible ── */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-1 pb-3 mb-1">
        <Group justify="space-between" mb="md" gap="md" wrap="nowrap">
          <div key="header-title">
            <Title order={1} fz={{ base: 22, sm: 26 }} mb={4}>Campaigns</Title>
            <Text fz={13} c={TV.textSecondary}>
              {campaigns.length} campaigns · {campaigns.filter(c => c.status === "Sent").length} sent
            </Text>
          </div>
          <CreateCampaignDropdown navigate={navigate} onOpenTemplates={() => setShowTemplatePicker(true)} />
        </Group>
      </div>

      {/* ── View tabs ── */}
      <Box mb="md">
        <div
          className="inline-flex items-center gap-[2px] rounded-full bg-white p-[3px]"
          style={{ border: `1px solid ${TV.borderLight}` }}
          role="tablist"
        >
          {VIEW_TABS.map((tab) => {
            const isActive = view === tab.key;
            return (
              <button
                key={tab.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => setView(tab.key)}
                className={`inline-flex items-center gap-[6px] px-[16px] py-[7px] rounded-full text-[14px] transition-colors cursor-pointer border-0 outline-none focus-visible:ring-2 focus-visible:ring-tv-brand/40 ${
                  isActive
                    ? "text-white"
                    : "text-tv-text-primary hover:bg-tv-surface"
                }`}
                style={{
                  fontWeight: isActive ? 600 : 500,
                  backgroundColor: isActive ? TV.brandBg : "transparent",
                }}
              >
                <span>{tab.label}</span>
                {tab.key !== "all" ? (
                  <span
                    className="inline-flex items-center justify-center px-[7px] py-[1px] rounded-full text-[12px] font-semibold"
                    style={{
                      backgroundColor: isActive ? "rgba(255,255,255,0.25)" : TV.brandTint,
                      color: isActive ? "white" : TV.textBrand,
                    }}
                  >
                    {viewCounts[tab.key]}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </Box>

      {/* ── Search ── */}
      <div className="flex items-center gap-3 mb-3">
        <div className="max-w-[460px] flex-1">
          <PillSearchInput value={search} onChange={setSearch} placeholder="Search campaigns…" />
        </div>
        <ColumnsButton onClick={() => setShowEditColumns(true)} />
      </div>

      {/* ── Filter bar (shared component) ── */}
      <div className="mb-4">
        <FilterBar
          filters={CAMPAIGN_FILTERS}
          activeFilterKeys={activeFilterKeys}
          filterValues={filterValues}
          onFilterValuesChange={setFilterValues}
          onActiveFilterKeysChange={setActiveFilterKeys}
        />
      </div>

      {/* ── Bulk actions bar ── */}
      {bulkSelected.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg mb-3"
          style={{ backgroundColor: TV.brandTint, border: `1px solid ${TV.borderLight}` }}>
          <Text fz={13} fw={600} c={TV.textBrand}>
            {bulkSelected.length} selected
          </Text>
          <Menu position="bottom-end" withinPortal>
            <Menu.Target>
              <Button size="compact-xs" variant="default" leftSection={<PlayCircle size={11} />}>
                Change Status
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<PlayCircle size={12} />} onClick={() => bulkChangeStatus("Draft")}>Draft</Menu.Item>
              <Menu.Item leftSection={<PlayCircle size={12} />} onClick={() => bulkChangeStatus("Scheduled")}>Scheduled</Menu.Item>
              <Menu.Item leftSection={<Archive size={12} />} onClick={() => bulkChangeStatus("Archived")}>Archive</Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Button size="compact-xs" variant="outline" color="red" leftSection={<Trash2 size={11} />}
            onClick={bulkDelete}>
            Delete
          </Button>
          <ActionIcon variant="subtle" color="gray" size="xs" ml="auto"
            onClick={() => setBulkSelected([])}>
            <X size={13} />
          </ActionIcon>
        </div>
      )}

      {/* ── Table / Cards ── */}
      <div className="bg-white rounded-xl border border-tv-border-light overflow-hidden" role="region" aria-label={`${sortedFiltered.length} campaigns shown`}>
        <p className="sr-only" aria-live="polite">{sortedFiltered.length} campaigns shown</p>
        {sortedFiltered.length === 0 ? (
          <Stack align="center" gap="sm" py={60}>
            <Box w={64} h={64} bg={TV.brandTint}
              style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FileText size={28} style={{ color: TV.textBrand }} />
            </Box>
            <Title order={2} c={TV.textPrimary}>No campaigns found</Title>
            <Text fz={13} c={TV.textSecondary}>Try adjusting your filters or create a new campaign.</Text>
            <CreateCampaignDropdown navigate={navigate} onOpenTemplates={() => setShowTemplatePicker(true)} />
          </Stack>
        ) : (
          <>
            {/* ── Desktop Mantine Table ── */}
            <Box visibleFrom="md" className="overflow-x-auto" role="region" aria-label="Campaigns table" tabIndex={0}>
              <Table
                verticalSpacing={0}
                horizontalSpacing={0}
                highlightOnHover
                styles={{
                  table: { borderCollapse: "collapse", minWidth: Math.max(800, activeColumns.length * 170 + 100) },
                  td: { whiteSpace: "nowrap" as const },
                }}
              >
                <Table.Thead className="sticky top-0 z-20" style={{ backgroundColor: TV.surfaceMuted }}>
                  <Table.Tr style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
                    <Table.Th w={44} style={{ padding: "10px 0 10px 16px", verticalAlign: "middle" }}>
                      <Checkbox
                        checked={allOnPageSelected}
                        indeterminate={someSelected && !allOnPageSelected}
                        onChange={() => {
                          if (allOnPageSelected) setBulkSelected(s => s.filter(id => !paginatedRows.some(r => r.id === id)));
                          else setBulkSelected(s => [...new Set([...s, ...paginatedRows.map(r => r.id)])]);
                        }}
                        color="tvPurple"
                        size="xs"
                      />
                    </Table.Th>
                    {activeColumns.map(colKey => {
                      const col = ALL_COLUMNS.find(c => c.key === colKey);
                      if (!col) return null;
                      return (
                        <Table.Th key={col.key} aria-sort={sortKey === col.key && sortDir ? (sortDir === "asc" ? "ascending" : "descending") : "none"} style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          <SortableHeader label={col.label} sortKey={col.key} currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                        </Table.Th>
                      );
                    })}
                    <Table.Th w={60} style={{ padding: "10px 16px", verticalAlign: "middle" }} />
                  </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                  {paginatedRows.map((c) => (
                    <Table.Tr
                      key={c.id}
                      onClick={() => navigate(`/campaigns/${c.id}`)}
                      style={{ cursor: "pointer", borderBottom: `1px solid ${TV.borderDivider}` }}
                    >
                      {/* Checkbox */}
                      <Table.Td style={{ padding: "12px 0 12px 16px", verticalAlign: "middle" }}
                        onClick={e => { e.stopPropagation(); toggleBulk(c.id); }}>
                        <Checkbox checked={bulkSelected.includes(c.id)} onChange={() => toggleBulk(c.id)} color="tvPurple" size="xs" />
                      </Table.Td>

                      {activeColumns.map(colKey => {
                        switch (colKey) {
                          case "name":
                            return (
                              <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle", whiteSpace: "normal" }}>
                                <div className="flex items-center gap-2 flex-nowrap">
                                  <CampaignThumbnail campaign={c} size="sm" />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <Text fz={13} fw={600} c={TV.textBrand} truncate className="hover:underline">
                                      {c.name}
                                    </Text>
                                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                      <Badge size="xs" variant="light" color={c.steps === "single" ? "tvPurple" : c.steps === "video-request" ? "green" : "blue"} radius="xl">
                                        {c.steps === "single" ? "Single" : c.steps === "video-request" ? "Video Request" : "Multi-Step"}
                                      </Badge>
                                      <div className="flex items-center gap-1">
                                        {c.channel === "Email + SMS" ? (
                                          <><Mail size={10} className="text-tv-brand" /><MessageSquare size={10} className="text-tv-info" /></>
                                        ) : c.channel === "Email" ? <Mail size={10} className="text-tv-brand" /> : c.channel === "SMS" ? <MessageSquare size={10} className="text-tv-info" /> : <Link2 size={10} className="text-tv-brand" />}
                                        <Text fz={11} c={TV.textSecondary}>{c.channel}</Text>
                                      </div>
                                      {c.tags.length > 0 && (
                                        <Badge size="xs" variant="light" color="gray" radius="xl">{c.tags[0]}</Badge>
                                      )}
                                      {c.tags.length > 1 && (
                                        <span className="relative group/tags">
                                          <span className="inline-flex items-center justify-center size-[18px] rounded-full bg-tv-surface border border-tv-border-light text-tv-text-secondary cursor-default hover:bg-tv-brand-tint hover:border-tv-brand hover:text-tv-brand transition-colors">
                                            <Plus size={10} />
                                          </span>
                                          <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-50 hidden group-hover/tags:flex flex-wrap gap-1 bg-white border border-tv-border-light rounded-md shadow-lg px-2.5 py-2 min-w-max max-w-[240px]">
                                            {c.tags.map(tag => (
                                              <Badge key={tag} size="xs" variant="light" color="gray" radius="xl">{tag}</Badge>
                                            ))}
                                          </span>
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </Table.Td>
                            );
                          case "status":
                            return (
                              <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                                <Badge size="sm" variant="light" color={STATUS_BADGE[c.status]} radius="xl">{c.status}</Badge>
                              </Table.Td>
                            );
                          case "sent":
                            return (
                              <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                                <Text fz={12} c={TV.textSecondary}>{c.sent || "—"}</Text>
                              </Table.Td>
                            );
                          case "openRate":
                            return (
                              <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                                <Text fz={12} c={TV.textSecondary}>{c.openRate}</Text>
                              </Table.Td>
                            );
                          case "clickRate":
                            return (
                              <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                                <Text fz={12} c={TV.textSecondary}>{c.clickRate}</Text>
                              </Table.Td>
                            );
                          case "replies":
                            return (
                              <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                                <Text fz={12} c={TV.textSecondary}>{c.replies || "—"}</Text>
                              </Table.Td>
                            );
                          case "created":
                            return (
                              <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                                <Text fz={12} c={TV.textSecondary}>{c.sendDate !== "—" ? c.sendDate : "Not scheduled"}</Text>
                                <Text fz={11} c={TV.textDecorative}>{c.creator}</Text>
                              </Table.Td>
                            );
                          default: return null;
                        }
                      })}

                      {/* Actions */}
                      <Table.Td style={{ padding: "12px 16px", verticalAlign: "middle" }} onClick={e => e.stopPropagation()}>
                        <Menu opened={openMenu === c.id} onChange={(o) => setOpenMenu(o ? c.id : null)} position="bottom-end" withinPortal>
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Campaign actions" title="Campaign actions">
                              <MoreHorizontal size={15} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<Edit2 size={13} />} onClick={() => navigate(`/campaigns/${c.id}`)}>Edit</Menu.Item>
                            <Menu.Item leftSection={<Edit2 size={13} />} onClick={() => setRenaming(c)}>Rename</Menu.Item>
                            <Menu.Item leftSection={<Copy size={13} />} onClick={() => setDuplicating(c)}>Duplicate</Menu.Item>
                            <Menu.Divider />
                            <Menu.Label>Change status</Menu.Label>
                            {["Draft", "Scheduled", "Paused", "Archived"].filter(s => s !== c.status).map(s => (
                              <Menu.Item key={s} leftSection={s === "Archived" ? <Archive size={13} /> : <PlayCircle size={13} />}
                                onClick={() => changeStatus(c.id, s)}>{s === "Archived" ? "Archive" : s === "Paused" ? "Pause" : `Move to ${s}`}</Menu.Item>
                            ))}
                            <Menu.Divider />
                            <Menu.Item leftSection={<Trash2 size={13} />} color="red" onClick={() => setDeleting(c)}>Delete</Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              <TablePagination
                page={page}
                rowsPerPage={rowsPerPage}
                totalRows={sortedFiltered.length}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
              />
            </Box>

            {/* ── Mobile card fallback ── */}
            <Box hiddenFrom="md">
              {paginatedRows.map(c => (
                <Box key={c.id} px="sm" py="sm"
                  style={{ borderBottom: `1px solid ${TV.borderDivider}`, cursor: "pointer" }}
                  className="hover:bg-tv-surface-muted transition-colors">
                  <div className="flex items-center gap-3 flex-nowrap">
                    <Checkbox checked={bulkSelected.includes(c.id)} onChange={() => toggleBulk(c.id)} color="tvPurple" size="xs" />
                    <CampaignThumbnail campaign={c} size="sm" />
                    <button type="button" style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={() => navigate(`/campaigns/${c.id}`)} className="text-left">
                      <Text fz={13} fw={600} c={TV.textBrand} truncate className="hover:underline mb-1">{c.name}</Text>
                      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        <Badge size="xs" variant="light" color={c.steps === "single" ? "tvPurple" : c.steps === "video-request" ? "green" : "blue"} radius="xl">
                          {c.steps === "single" ? "Single" : c.steps === "video-request" ? "Video Request" : "Multi-Step"}
                        </Badge>
                        <Badge size="xs" color={STATUS_BADGE[c.status]} radius="xl">{c.status}</Badge>
                        <div className="flex items-center gap-1">
                          {c.channel === "Email + SMS" ? (
                            <><Mail size={10} className="text-tv-brand" /><MessageSquare size={10} className="text-tv-info" /></>
                          ) : c.channel === "Email" ? <Mail size={10} className="text-tv-brand" /> : c.channel === "SMS" ? <MessageSquare size={10} className="text-tv-info" /> : <Link2 size={10} className="text-tv-brand" />}
                          <Text fz={11} c={TV.textSecondary}>{c.channel}</Text>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-1">
                        <Text fz={11} c={TV.textSecondary}>Sent: <Text span fz={11} fw={600} c={TV.textPrimary}>{c.sent || "—"}</Text></Text>
                        <Text fz={11} c={TV.textSecondary}>Open: <Text span fz={11} fw={600} c={TV.textPrimary}>{c.openRate}</Text></Text>
                        <Text fz={11} c={TV.textSecondary}>Clicks: <Text span fz={11} fw={600} c={TV.textPrimary}>{c.clickRate}</Text></Text>
                      </div>
                      <Text fz={11} c={TV.textDecorative}>{c.creator} · {c.sendDate !== "—" ? c.sendDate : "Not scheduled"}</Text>
                    </button>
                    <Menu position="bottom-end" withinPortal>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" size="sm" onClick={e => e.stopPropagation()} aria-label="Campaign actions" title="Campaign actions">
                          <MoreHorizontal size={15} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<Edit2 size={13} />} onClick={() => navigate(`/campaigns/${c.id}`)}>Edit</Menu.Item>
                        <Menu.Item leftSection={<Edit2 size={13} />} onClick={() => setRenaming(c)}>Rename</Menu.Item>
                        <Menu.Item leftSection={<Copy size={13} />} onClick={() => setDuplicating(c)}>Duplicate</Menu.Item>
                        <Menu.Divider />
                        <Menu.Label>Change status</Menu.Label>
                        {["Draft", "Scheduled", "Paused", "Archived"].filter(s => s !== c.status).map(s => (
                          <Menu.Item key={s} leftSection={s === "Archived" ? <Archive size={13} /> : <PlayCircle size={13} />}
                            onClick={() => changeStatus(c.id, s)}>{s === "Archived" ? "Archive" : s === "Paused" ? "Pause" : `Move to ${s}`}</Menu.Item>
                        ))}
                        <Menu.Divider />
                        <Menu.Item leftSection={<Trash2 size={13} />} color="red" onClick={() => setDeleting(c)}>Delete</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                </Box>
              ))}
              <TablePagination
                page={page}
                rowsPerPage={rowsPerPage}
                totalRows={sortedFiltered.length}
                onPageChange={setPage}
                onRowsPerPageChange={setRowsPerPage}
              />
            </Box>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {duplicating    && <DuplicateModal name={duplicating.name} channel={duplicating.channel} steps={duplicating.steps} onDuplicate={handleDuplicate} onCancel={() => setDuplicating(null)} />}
      {deleting       && <DeleteModal title={`Delete "${deleting.name}"?`} onConfirm={handleDelete} onCancel={() => setDeleting(null)} />}
      {renaming       && <RenameModal name={renaming.name} onRename={handleRename} onCancel={() => setRenaming(null)} />}
      {showTemplatePicker && <TemplatePickerModal onSelect={handleSelectTemplate} onCancel={() => setShowTemplatePicker(false)} />}
      {showEditColumns && (
        <EditColumnsModal columns={ALL_COLUMNS} active={activeColumns} onClose={() => setShowEditColumns(false)}
          onSave={cols => { setActiveColumns(cols); show("Columns updated!", "success"); }} />
      )}
    </Box>
  );
}