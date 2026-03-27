import { useState, useRef, useEffect, type ReactNode } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { useToast } from "../contexts/ToastContext";
import { DeleteModal } from "../components/ui/DeleteModal";
import {
  Send, TriangleAlert, ChevronRight, Mail, MessageSquare,
  Clock, CircleCheckBig, Link2, Copy, Trash2, X,
  CircleAlert, ExternalLink, Play, Eye, ChartColumn, FileQuestion, Users,
  Palette, Video, ChevronDown, ChevronUp, Reply, CalendarDays, Lock,
  Info, Tag, Share2, Zap, Target, BarChart3, RefreshCw, Search,
  Check, Filter, Download, Repeat, Loader2, Timer, GitBranch,
  PenLine, UserPlus,
} from "lucide-react";
import {
  Badge,
  Box, Stack, Text, Title, Button, UnstyledButton,
  Paper,
  Modal, TextInput, Checkbox,
} from "@mantine/core";
import { TV } from "../theme";
import { Toggle } from "../components/ui/Toggle";
import { StatusChangeModal } from "../components/StatusChangeModal";
import { TvTooltip } from "../components/TvTooltip";
import { EditColumnsModal, ColumnsButton, type ColumnDef } from "../components/ColumnCustomizer";

/* ── Row: drop-in for Mantine Group (avoids Children.toArray null-key bug with FGCmp wrapper) ── */
const MANTINE_SP: Record<string, string> = { xs: "10px", sm: "12px", md: "16px", lg: "20px", xl: "24px" };
function Row({ children, gap, justify, align, wrap, mb, mt, ml, className, style, ...rest }:
  { children?: ReactNode; gap?: string | number; justify?: string; align?: string; wrap?: string;
    mb?: string | number; mt?: string | number; ml?: string; className?: string;
    style?: React.CSSProperties; [k: string]: any }) {
  const g = typeof gap === "number" ? `${gap}px` : MANTINE_SP[gap ?? "md"] ?? gap ?? "16px";
  const mbv = mb != null ? (typeof mb === "number" ? `${mb}px` : MANTINE_SP[mb] ?? mb) : undefined;
  const mtv = mt != null ? (typeof mt === "number" ? `${mt}px` : MANTINE_SP[mt] ?? mt) : undefined;
  return (
    <div className={className}
      style={{ display: "flex", gap: g, justifyContent: justify, alignItems: align ?? "center",
        flexWrap: wrap as any, marginBottom: mbv, marginTop: mtv, marginLeft: ml, ...style }}
      {...rest}>{children}</div>
  );
}

/* ── Pill — thin wrapper around Mantine Badge for consistent styling ── */
function Pill({ children, color = "gray", size = "xs", variant = "light", className = "", style }: {
  children: React.ReactNode; color?: string; size?: "xs" | "sm"; variant?: "light" | "filled";
  className?: string; style?: React.CSSProperties;
}) {
  const badgeColor = color === "tvPurple" ? "tvPurple" : color;
  return (
    <Badge size={size === "xs" ? "xs" : "sm"} variant={variant} color={badgeColor} radius="xl"
      className={className} style={style}>{children}</Badge>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * MOCK DATA
 * ═══════��═══════════════════════════════════════════════════════════════════════ */

interface SendEvent {
  date: string;
  status: "Delivered" | "Failed Send" | "Send Scheduled" | "Sending";
  opened: boolean;
  clicked: boolean;
}

interface ConstituentReply {
  date: string;
  message: string;
}

interface Constituent {
  id: number;
  name: string;
  email: string;
  hasVideo: boolean;
  delivery: string;
  replies: string;
  resendCount: number;
  sendHistory: SendEvent[];
  replyContent: ConstituentReply[];
}

interface VideoSlot {
  label: string;
  type: "intro" | "personal" | "addon1" | "addon2" | "overlay" | "outro";
  set: boolean;
  thumbnailGradient: string;
  description?: string;
}

interface EnvelopeSetup {
  color: string;
  colorName: string;
  returnAddress: string;
  logo: boolean;
  logoPosition?: string;
}

interface LandingPageSetup {
  headline: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  mergeFields: string[];
  backgroundImage: boolean;
}

interface CampaignData {
  id: number;
  name: string;
  type: string;
  channel: string;
  status: string;
  sendDate: string;
  constituents: number;
  openRate: string;
  replies: number;
  videos: number;
  videoViews: number;
  clickRate: string;
  spamRate: string;
  bounceRate: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  replyTo: string;
  bodyPreview: string;
  mergeFieldsInMessage: string[];
  envelope: EnvelopeSetup | null;
  landingPage: LandingPageSetup;
  videoSlots: VideoSlot[];
  hasOverlay: boolean;         // historically sent with an overlay
  overlayText?: string;        // the overlay text (only shown for sent campaigns)
  constituents_list: Constituent[];
  sendDates: string[];         // multiple send dates if applicable
  // Video Request campaign fields
  isVideoRequest?: boolean;
  vrDueDate?: string;
  vrSubmissionsReceived?: number;
  vrSubmissionsTotal?: number;
  vrShareableUrl?: string;
  vrSubmissions?: VRSubmission[];
  // Resend data
  resendHistory?: ResendRecord[];
  maxResends?: number;
  // Multi-step campaign flow data
  flowSteps?: CampaignFlowStep[];
  automationRules?: AutomationRule[];
}

interface CampaignFlowStep {
  id: string;
  stepNumber: number;
  label: string;
  type: "email" | "sms" | "wait" | "condition";
  description?: string;
  hardCodedDate?: string;   // e.g. "March 15" — triggers amber warning on copy
  // Per-step sent-state metrics (populated for sent multi-step campaigns)
  sentDate?: string;
  sentCount?: number;
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  status?: "completed" | "active" | "skipped" | "pending";
  // For condition steps
  conditionMetLabel?: string;   // e.g. "Opened"
  conditionNotMetLabel?: string; // e.g. "Did not open"
  conditionMetCount?: number;
  conditionNotMetCount?: number;
  // Branch target step IDs (for condition nodes)
  yesTargetId?: string;
  noTargetId?: string;
  // Per-step recipient list (who was sent to for this step)
  recipients?: StepRecipient[];
}

interface StepRecipient {
  name: string;
  email: string;
  status: "Delivered" | "Opened" | "Clicked" | "Failed" | "Pending";
}

interface AutomationRule {
  id: string;
  label: string;
  sourceStepId: string;
  targetStepId: string;
}

interface VRSubmission {
  id: number;
  recorderName: string;
  recorderEmail: string;
  submittedDate: string;
  duration: string;
  thumbnailColor: string;
  status: "received" | "reviewed" | "approved" | "rejected";
}

interface ResendRecord {
  sendNumber: number;
  date: string;
  subject: string;
  constituentCount: number;
  delivered: number;
  opened: number;
  clicked: number;
  status: "Delivered" | "Sending" | "Scheduled";
}

// Helper to build common video slot arrays
function buildVideoSlots(opts: { intro: boolean; personal: boolean; addon1: boolean; addon2: boolean; outro: boolean }): VideoSlot[] {
  return [
    { label: "Intro", type: "intro", set: opts.intro, thumbnailGradient: "from-tv-brand to-tv-brand-bg", description: "Plays before the personal video for every constituent" },
    { label: "Personal Videos", type: "personal", set: opts.personal, thumbnailGradient: "from-tv-info to-[#00C0F5]", description: "Unique video recorded for each constituent" },
    { label: "Add-On Video 1", type: "addon1", set: opts.addon1, thumbnailGradient: opts.addon1 ? "from-tv-success to-[#15803d]" : "from-tv-border-light to-tv-border-strong", description: "Extra clip appended after personal video" },
    { label: "Add-On Video 2", type: "addon2", set: opts.addon2, thumbnailGradient: opts.addon2 ? "from-tv-warning to-[#b45309]" : "from-tv-border-light to-tv-border-strong", description: "Second extra clip" },
    { label: "Outro", type: "outro", set: opts.outro, thumbnailGradient: opts.outro ? "from-tv-brand to-[#c084fc]" : "from-tv-border-light to-tv-border-strong", description: "Plays at the end of every constituent's video" },
  ];
}

const MOCK_CAMPAIGNS: Record<string, CampaignData> = {
  "1": {
    id: 1, name: "Spring Annual Fund Appeal", type: "Solicitation", channel: "Email",
    status: "Sent", sendDate: "Feb 14, 2026", constituents: 142, openRate: "82.4%", replies: 18, videos: 142, videoViews: 118, clickRate: "34.5%",
    spamRate: "0.1%", bounceRate: "1.4%",
    subject: "A personal message about your impact this spring",
    senderName: "Kelley Molt", senderEmail: "kelley.molt@hartwell.edu", replyTo: "giving@hartwell.edu",
    bodyPreview: "Dear {{first_name}},\n\nThis spring, our community came together in an extraordinary way. Your generous gift of {{gift_amount}} helped us reach 12 first-generation students who would not otherwise have access to a Hartwell education.\n\nI recorded a quick video just for you — please take a moment to watch it.\n\nWarmly,\nKelley Molt",
    mergeFieldsInMessage: ["{{first_name}}", "{{gift_amount}}"],
    envelope: { color: "#7c45b0", colorName: "Purple", returnAddress: "Office of Advancement, Hartwell University, 100 Campus Dr, Hartford, CT 06106", logo: true, logoPosition: "Top Left" },
    landingPage: {
      headline: "Thank you, {{first_name}}!",
      bodyHtml: "Your generous support of {{gift_amount}} is making a real difference at Hartwell University. Watch the video above for a personal message from our team.",
      ctaLabel: "Make Another Gift",
      ctaUrl: "https://give.hartwell.edu/donate",
      mergeFields: ["{{first_name}}", "{{gift_amount}}"],
      backgroundImage: true,
    },
    videoSlots: buildVideoSlots({ intro: true, personal: true, addon1: false, addon2: false, outro: true }),
    hasOverlay: true,
    overlayText: "Spring 2026 Annual Fund",
    sendDates: ["Feb 14, 2026"],
    resendHistory: [
      { sendNumber: 1, date: "Feb 14, 2026 9:00 AM", subject: "A personal message about your impact this spring", constituentCount: 142, delivered: 140, opened: 115, clicked: 49, status: "Delivered" },
      { sendNumber: 2, date: "Feb 21, 2026 10:00 AM", subject: "Don't miss your personal video message", constituentCount: 27, delivered: 27, opened: 18, clicked: 9, status: "Delivered" },
    ],
    maxResends: 3,
    constituents_list: [
      { id: 1, name: "James Whitfield", email: "j.whitfield@alumni.edu", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Feb 14, 2026 9:02 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Feb 15, 2026", message: "Thank you so much for the personal video, Kelley! It really made my day. Happy to continue supporting Hartwell." }] },
      { id: 2, name: "Sarah Chen", email: "s.chen@foundation.org", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 1,
        sendHistory: [
          { date: "Feb 14, 2026 9:02 AM", status: "Delivered", opened: true, clicked: false },
          { date: "Feb 21, 2026 10:00 AM", status: "Delivered", opened: true, clicked: true },
        ],
        replyContent: [{ date: "Feb 22, 2026", message: "What a wonderful surprise! I shared the video with my family. Count me in for the gala." }] },
      { id: 3, name: "Marcus Reid", email: "m.reid@email.com", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Feb 14, 2026 9:02 AM", status: "Delivered", opened: true, clicked: false }], replyContent: [] },
      { id: 4, name: "Emily Torres", email: "e.torres@corp.com", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Feb 14, 2026 9:03 AM", status: "Delivered", opened: false, clicked: false }], replyContent: [] },
      { id: 5, name: "David Park", email: "d.park@alumni.edu", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Feb 14, 2026 9:03 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Feb 16, 2026", message: "This is amazing! I'll be doubling my gift this year." }] },
      { id: 6, name: "Alicia Grant", email: "a.grant@corp.com", hasVideo: true, delivery: "Failed Send", replies: "\u2014", resendCount: 0,
        sendHistory: [{ date: "Feb 14, 2026 9:03 AM", status: "Failed Send", opened: false, clicked: false }], replyContent: [] },
      { id: 7, name: "Tom Hernandez", email: "t.hernandez@alumni.edu", hasVideo: false, delivery: "Video Added", replies: "\u2014", resendCount: 0,
        sendHistory: [], replyContent: [] },
    ],
  },
  "2": {
    id: 2, name: "Thank You \u2013 Multi-Step 2.0", type: "Thank You", channel: "Email",
    status: "Sent", sendDate: "Feb 10, 2026", constituents: 9, openRate: "77.8%", replies: 0, videos: 9, videoViews: 7, clickRate: "55.6%",
    spamRate: "0.0%", bounceRate: "0.0%",
    subject: "A heartfelt thank you from Kelley",
    senderName: "Kelley Molt", senderEmail: "kelley.molt@hartwell.edu", replyTo: "giving@hartwell.edu",
    bodyPreview: "Dear {{first_name}},\n\nOn behalf of the entire Hartwell community, I want to personally thank you for your incredible generosity. Watch the video above to see the impact you've made.",
    mergeFieldsInMessage: ["{{first_name}}"],
    envelope: null,
    landingPage: {
      headline: "Thank you, {{first_name}}!",
      bodyHtml: "Your support means the world to us. Please watch the video above for a personal message.",
      ctaLabel: "Share Your Story",
      ctaUrl: "https://thankview.com/hartwell/stories",
      mergeFields: ["{{first_name}}"],
      backgroundImage: false,
    },
    videoSlots: buildVideoSlots({ intro: false, personal: true, addon1: false, addon2: false, outro: false }),
    hasOverlay: false,
    sendDates: ["Feb 10, 2026"],
    constituents_list: [
      { id: 1, name: "Alice Hernandez", email: "a.hernandez@alumni.edu", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Feb 10, 2026 8:00 AM", status: "Delivered", opened: true, clicked: false }], replyContent: [] },
      { id: 2, name: "Bob Kim", email: "b.kim@email.com", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Feb 10, 2026 8:00 AM", status: "Delivered", opened: false, clicked: false }], replyContent: [] },
      { id: 3, name: "Carol Smith", email: "c.smith@corp.com", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Feb 10, 2026 8:00 AM", status: "Delivered", opened: true, clicked: true }], replyContent: [] },
    ],
    flowSteps: [
      { id: "cs1", stepNumber: 1, label: "Welcome Email", type: "email", description: "Initial thank-you email with personal video", sentDate: "Feb 10, 2026 8:00 AM", sentCount: 9, deliveredCount: 9, openedCount: 7, clickedCount: 5, status: "completed",
        recipients: [
          { name: "Alice Hernandez", email: "a.hernandez@alumni.edu", status: "Clicked" },
          { name: "Bob Kim", email: "b.kim@email.com", status: "Delivered" },
          { name: "Carol Smith", email: "c.smith@corp.com", status: "Clicked" },
          { name: "Dan Williams", email: "d.williams@alumni.edu", status: "Opened" },
          { name: "Eva Chen", email: "e.chen@corp.com", status: "Clicked" },
          { name: "Frank Lee", email: "f.lee@alumni.edu", status: "Opened" },
          { name: "Grace Park", email: "g.park@email.com", status: "Clicked" },
          { name: "Henry Zhang", email: "h.zhang@alumni.edu", status: "Clicked" },
          { name: "Irene Okafor", email: "i.okafor@corp.com", status: "Opened" },
        ] },
      { id: "cs2", stepNumber: 2, label: "Wait 3 Days", type: "wait", description: "Pause before follow-up", sentDate: "Feb 13, 2026", status: "completed" },
      { id: "cs3", stepNumber: 3, label: "Follow-Up Email", type: "email", description: "Reminder for constituents who haven't opened", sentDate: "Feb 13, 2026 8:00 AM", sentCount: 2, deliveredCount: 2, openedCount: 1, clickedCount: 0, status: "completed",
        recipients: [
          { name: "Bob Kim", email: "b.kim@email.com", status: "Opened" },
          { name: "Irene Okafor", email: "i.okafor@corp.com", status: "Delivered" },
        ] },
      { id: "cs4", stepNumber: 4, label: "Condition: Opened?", type: "condition", description: "Branch based on email open status", status: "completed", conditionMetLabel: "Opened", conditionNotMetLabel: "Did not open", conditionMetCount: 8, conditionNotMetCount: 1, yesTargetId: "cs5", noTargetId: undefined },
      { id: "cs5", stepNumber: 5, label: "Final Thank You SMS", type: "sms", description: "Personal SMS to engaged constituents", sentDate: "Feb 14, 2026 10:00 AM", sentCount: 8, deliveredCount: 8, openedCount: 7, clickedCount: 4, status: "completed",
        recipients: [
          { name: "Alice Hernandez", email: "a.hernandez@alumni.edu", status: "Clicked" },
          { name: "Carol Smith", email: "c.smith@corp.com", status: "Clicked" },
          { name: "Dan Williams", email: "d.williams@alumni.edu", status: "Opened" },
          { name: "Eva Chen", email: "e.chen@corp.com", status: "Clicked" },
          { name: "Frank Lee", email: "f.lee@alumni.edu", status: "Delivered" },
          { name: "Grace Park", email: "g.park@email.com", status: "Opened" },
          { name: "Henry Zhang", email: "h.zhang@alumni.edu", status: "Clicked" },
          { name: "Bob Kim", email: "b.kim@email.com", status: "Opened" },
        ] },
    ],
    automationRules: [
      { id: "ar1", label: "Send Step 3 if no open after 3 days", sourceStepId: "cs1", targetStepId: "cs3" },
      { id: "ar2", label: "Send Step 5 only if Step 3 was opened", sourceStepId: "cs3", targetStepId: "cs5" },
    ],
  },
  "3": {
    id: 3, name: "Board Member Appreciation", type: "Thank You", channel: "Email",
    status: "Scheduled", sendDate: "Feb 28, 2026", constituents: 18, openRate: "\u2014", replies: 0, videos: 18, videoViews: 0, clickRate: "\u2014",
    spamRate: "\u2014", bounceRate: "\u2014",
    subject: "A personal message from the President's Office",
    senderName: "Kelley Molt", senderEmail: "president@hartwell.edu", replyTo: "president@hartwell.edu",
    bodyPreview: "Dear {{first_name}},\n\nThe Board of Trustees plays an invaluable role in shaping the future of Hartwell University. I recorded a personal video to express our deepest gratitude for your service and leadership.",
    mergeFieldsInMessage: ["{{first_name}}"],
    envelope: { color: "#1a1a2e", colorName: "Navy", returnAddress: "President's Office, Hartwell University, 100 Campus Dr, Hartford, CT 06106", logo: true, logoPosition: "Center" },
    landingPage: {
      headline: "Dear {{first_name}},",
      bodyHtml: "Please watch this personal video message from the President's Office. We are deeply grateful for your continued commitment to Hartwell.",
      ctaLabel: "View Board Portal",
      ctaUrl: "https://board.hartwell.edu",
      mergeFields: ["{{first_name}}"],
      backgroundImage: true,
    },
    videoSlots: buildVideoSlots({ intro: true, personal: true, addon1: true, addon2: false, outro: true }),
    hasOverlay: false,
    sendDates: ["Feb 28, 2026"],
    constituents_list: [
      { id: 1, name: "Patricia Nguyen", email: "p.nguyen@board.edu", hasVideo: true, delivery: "Send Scheduled", replies: "\u2014", resendCount: 0,
        sendHistory: [{ date: "Feb 28, 2026 9:00 AM", status: "Send Scheduled", opened: false, clicked: false }], replyContent: [] },
      { id: 2, name: "Thomas Wells", email: "t.wells@board.edu", hasVideo: true, delivery: "Send Scheduled", replies: "\u2014", resendCount: 0,
        sendHistory: [{ date: "Feb 28, 2026 9:00 AM", status: "Send Scheduled", opened: false, clicked: false }], replyContent: [] },
      { id: 3, name: "Diane Lee", email: "d.lee@board.edu", hasVideo: false, delivery: "N/A", replies: "\u2014", resendCount: 0,
        sendHistory: [], replyContent: [] },
    ],
  },
  "4": {
    id: 4, name: "New Student Welcome Series", type: "Update", channel: "Email",
    status: "Draft", sendDate: "\u2014", constituents: 0, openRate: "\u2014", replies: 0, videos: 0, videoViews: 0, clickRate: "\u2014",
    spamRate: "\u2014", bounceRate: "\u2014",
    subject: "Welcome to Hartwell, {{first_name}}!",
    senderName: "Michelle Park", senderEmail: "m.park@hartwell.edu", replyTo: "admissions@hartwell.edu",
    bodyPreview: "Dear {{first_name}},\n\nWe're thrilled to welcome you to the Hartwell University family! As you begin this exciting new chapter, we wanted to share a personal video message from your future classmates and faculty.",
    mergeFieldsInMessage: ["{{first_name}}"],
    envelope: null,
    landingPage: {
      headline: "Welcome to Hartwell, {{first_name}}!",
      bodyHtml: "Watch the video above for a personal welcome from your future classmates and faculty.",
      ctaLabel: "Explore Campus",
      ctaUrl: "https://hartwell.edu/campus",
      mergeFields: ["{{first_name}}"],
      backgroundImage: false,
    },
    videoSlots: buildVideoSlots({ intro: false, personal: false, addon1: false, addon2: false, outro: false }),
    hasOverlay: false,
    sendDates: [],
    constituents_list: [],
    flowSteps: [
      { id: "cs1", stepNumber: 1, label: "Welcome Email", type: "email", description: "Personalized welcome from the admissions team", status: "pending" },
      { id: "cs2", stepNumber: 2, label: "Wait 3 Days", type: "wait", description: "Pause before campus highlights", status: "pending" },
      { id: "cs3", stepNumber: 3, label: "Campus Highlights Email", type: "email", description: "Top things to know before move-in day", status: "pending" },
    ],
    automationRules: [
      { id: "ar1", label: "Send Step 3 after 3-day wait", sourceStepId: "cs1", targetStepId: "cs3" },
    ],
  },
  "5": {
    id: 5, name: "Major Gift Cultivation \u2013 Q1", type: "Solicitation", channel: "SMS",
    status: "Sent", sendDate: "Jan 30, 2026", constituents: 34, openRate: "91.2%", replies: 12, videos: 34, videoViews: 31, clickRate: "41.2%",
    spamRate: "0.0%", bounceRate: "0.3%",
    subject: "A personal video message from Kelley at Hartwell",
    senderName: "Kelley Molt", senderEmail: "kelley.molt@hartwell.edu", replyTo: "giving@hartwell.edu",
    bodyPreview: "Hi {{first_name}}, I recorded a quick video just for you about what your investment made possible this quarter. Tap to watch: {{video_link}}",
    mergeFieldsInMessage: ["{{first_name}}", "{{video_link}}"],
    envelope: null,
    landingPage: {
      headline: "{{first_name}}, see your impact",
      bodyHtml: "Your extraordinary generosity has helped transform lives at Hartwell. Watch the video above to see what your {{gift_amount}} gift made possible.",
      ctaLabel: "Continue Your Impact",
      ctaUrl: "https://give.hartwell.edu/majorgift",
      mergeFields: ["{{first_name}}", "{{gift_amount}}"],
      backgroundImage: true,
    },
    videoSlots: buildVideoSlots({ intro: true, personal: true, addon1: true, addon2: true, outro: true }),
    hasOverlay: true,
    overlayText: "Q1 Major Gifts",
    sendDates: ["Jan 30, 2026"],
    constituents_list: [
      { id: 1, name: "Linda Osei", email: "l.osei@alumni.edu", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Jan 30, 2026 10:00 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Jan 31, 2026", message: "Kelley, this was so thoughtful! I'm increasing my pledge." }] },
      { id: 2, name: "James Whitfield", email: "j.whitfield@alumni.edu", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Jan 30, 2026 10:00 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Feb 1, 2026", message: "Wonderful video! Let's schedule a call about the scholarship fund." }] },
      { id: 3, name: "Robert Kim", email: "r.kim@hartwell.edu", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 1,
        sendHistory: [
          { date: "Jan 30, 2026 10:00 AM", status: "Delivered", opened: false, clicked: false },
          { date: "Feb 6, 2026 10:00 AM", status: "Delivered", opened: true, clicked: false },
        ], replyContent: [] },
      { id: 4, name: "Catherine Moore", email: "c.moore@alumni.edu", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Jan 30, 2026 10:00 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Jan 31, 2026", message: "I showed the video to my husband \u2014 we're both so moved." }] },
      { id: 5, name: "William Sato", email: "w.sato@corp.com", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Jan 30, 2026 10:00 AM", status: "Delivered", opened: true, clicked: false }], replyContent: [] },
      { id: 6, name: "Margaret Chen", email: "m.chen@foundation.org", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Jan 30, 2026 10:00 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Feb 2, 2026", message: "Loved the personal touch. Happy to chat about foundation giving." }] },
    ],
    flowSteps: [
      { id: "cs1", stepNumber: 1, label: "Personal Video SMS", type: "sms", description: "Initial personalized video message via SMS", sentDate: "Jan 30, 2026 10:00 AM", sentCount: 34, deliveredCount: 33, openedCount: 30, clickedCount: 14, status: "completed",
        recipients: [
          { name: "Linda Osei", email: "l.osei@alumni.edu", status: "Clicked" },
          { name: "James Whitfield", email: "j.whitfield@alumni.edu", status: "Clicked" },
          { name: "Robert Kim", email: "r.kim@hartwell.edu", status: "Delivered" },
          { name: "Catherine Moore", email: "c.moore@alumni.edu", status: "Clicked" },
          { name: "William Sato", email: "w.sato@corp.com", status: "Opened" },
          { name: "Margaret Chen", email: "m.chen@foundation.org", status: "Clicked" },
        ] },
      { id: "cs2", stepNumber: 2, label: "Wait 7 Days", type: "wait", description: "Pause before follow-up", sentDate: "Feb 6, 2026", status: "completed" },
      { id: "cs3", stepNumber: 3, label: "Follow-Up SMS", type: "sms", description: "Gentle reminder for constituents who haven't clicked", sentDate: "Feb 6, 2026 10:00 AM", sentCount: 20, deliveredCount: 20, openedCount: 15, clickedCount: 8, status: "completed",
        recipients: [
          { name: "Robert Kim", email: "r.kim@hartwell.edu", status: "Opened" },
          { name: "William Sato", email: "w.sato@corp.com", status: "Opened" },
          { name: "Patricia Lang", email: "p.lang@alumni.edu", status: "Clicked" },
          { name: "George Foster", email: "g.foster@corp.com", status: "Delivered" },
        ] },
      { id: "cs4", stepNumber: 4, label: "Condition: Clicked?", type: "condition", description: "Branch based on CTA click", status: "completed", conditionMetLabel: "Clicked", conditionNotMetLabel: "No click", conditionMetCount: 22, conditionNotMetCount: 12, yesTargetId: "cs5", noTargetId: undefined },
      { id: "cs5", stepNumber: 5, label: "Thank You SMS", type: "sms", description: "Thank engaged prospects and invite to a call", sentDate: "Feb 8, 2026 10:00 AM", sentCount: 22, deliveredCount: 22, openedCount: 20, clickedCount: 11, status: "completed",
        recipients: [
          { name: "Linda Osei", email: "l.osei@alumni.edu", status: "Clicked" },
          { name: "James Whitfield", email: "j.whitfield@alumni.edu", status: "Clicked" },
          { name: "Catherine Moore", email: "c.moore@alumni.edu", status: "Opened" },
          { name: "Margaret Chen", email: "m.chen@foundation.org", status: "Clicked" },
          { name: "Patricia Lang", email: "p.lang@alumni.edu", status: "Opened" },
        ] },
    ],
    automationRules: [
      { id: "ar1", label: "Send Step 3 if no click after 7 days", sourceStepId: "cs1", targetStepId: "cs3" },
      { id: "ar2", label: "Send Step 5 if CTA clicked", sourceStepId: "cs4", targetStepId: "cs5" },
    ],
  },
  "6": {
    id: 6, name: "Alumni Weekend 2026 Save the Date", type: "Event", channel: "Email",
    status: "Archived", sendDate: "Jan 15, 2026", constituents: 504, openRate: "68.3%", replies: 47, videos: 0, videoViews: 0, clickRate: "22.8%",
    spamRate: "0.2%", bounceRate: "3.1%",
    subject: "Save the Date: Hartwell Alumni Weekend \u2014 June 6\u20138",
    senderName: "James Okafor", senderEmail: "j.okafor@hartwell.edu", replyTo: "alumni@hartwell.edu",
    bodyPreview: "Dear {{first_name}},\n\nMark your calendars! Hartwell Alumni Weekend is returning June 6\u20138, 2026. Reconnect with classmates, explore campus, and celebrate the Hartwell community. Registration details coming soon.",
    mergeFieldsInMessage: ["{{first_name}}"],
    envelope: null,
    landingPage: {
      headline: "Alumni Weekend 2026",
      bodyHtml: "Save the date for June 6\u20138! Registration opens March 1. We can't wait to welcome you back to campus, {{first_name}}.",
      ctaLabel: "Pre-Register",
      ctaUrl: "https://alumni.hartwell.edu/weekend2026",
      mergeFields: ["{{first_name}}"],
      backgroundImage: true,
    },
    videoSlots: buildVideoSlots({ intro: false, personal: false, addon1: false, addon2: false, outro: false }),
    hasOverlay: false,
    sendDates: ["Jan 15, 2026"],
    constituents_list: [
      { id: 1, name: "Sarah Chen", email: "s.chen@foundation.org", hasVideo: false, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Jan 15, 2026 8:00 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Jan 16, 2026", message: "I'll be there! Can I bring a guest?" }] },
      { id: 2, name: "Marcus Reid", email: "m.reid@email.com", hasVideo: false, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Jan 15, 2026 8:00 AM", status: "Delivered", opened: false, clicked: false }], replyContent: [] },
      { id: 3, name: "Emily Torres", email: "e.torres@corp.com", hasVideo: false, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Jan 15, 2026 8:01 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Jan 17, 2026", message: "So excited! Will there be a Class of 2010 table?" }] },
      { id: 4, name: "David Park", email: "d.park@alumni.edu", hasVideo: false, delivery: "Delivered", replies: "No reply", resendCount: 1,
        sendHistory: [
          { date: "Jan 15, 2026 8:01 AM", status: "Delivered", opened: false, clicked: false },
          { date: "Jan 22, 2026 9:00 AM", status: "Delivered", opened: true, clicked: false },
        ], replyContent: [] },
      { id: 5, name: "Priya Sharma", email: "p.sharma@alumni.edu", hasVideo: false, delivery: "Failed Send", replies: "\u2014", resendCount: 0,
        sendHistory: [{ date: "Jan 15, 2026 8:01 AM", status: "Failed Send", opened: false, clicked: false }], replyContent: [] },
    ],
  },
  "7": {
    id: 7, name: "Matching Gift Challenge", type: "Solicitation", channel: "Email",
    status: "Draft", sendDate: "\u2014", constituents: 0, openRate: "\u2014", replies: 0, videos: 0, videoViews: 0, clickRate: "\u2014",
    spamRate: "\u2014", bounceRate: "\u2014",
    subject: "Double your impact today, {{first_name}}",
    senderName: "Kelley Molt", senderEmail: "kelley.molt@hartwell.edu", replyTo: "giving@hartwell.edu",
    bodyPreview: "Dear {{first_name}},\n\nGreat news \u2014 a generous alumni couple has agreed to match every gift made this month, dollar for dollar, up to $100,000. Your donation today will go twice as far.",
    mergeFieldsInMessage: ["{{first_name}}"],
    envelope: { color: "#dc2626", colorName: "Red", returnAddress: "Office of Advancement, Hartwell University, 100 Campus Dr, Hartford, CT 06106", logo: true, logoPosition: "Top Left" },
    landingPage: {
      headline: "Double your impact, {{first_name}}",
      bodyHtml: "Every dollar you give this month will be matched 1:1 up to $100,000. Watch the video to learn more about this special opportunity.",
      ctaLabel: "Give Now",
      ctaUrl: "https://give.hartwell.edu/match",
      mergeFields: ["{{first_name}}"],
      backgroundImage: false,
    },
    videoSlots: buildVideoSlots({ intro: false, personal: false, addon1: false, addon2: false, outro: false }),
    hasOverlay: false,
    sendDates: [],
    constituents_list: [],
  },
  "8": {
    id: 8, name: "Scholarship Endowment Report 2025", type: "Endowment Report", channel: "Email",
    status: "Sent", sendDate: "Dec 5, 2025", constituents: 891, openRate: "74.1%", replies: 203, videos: 891, videoViews: 661, clickRate: "28.9%",
    spamRate: "0.0%", bounceRate: "2.0%",
    subject: "Your 2025 Endowment Impact Report",
    senderName: "Kelley Molt", senderEmail: "kelley.molt@hartwell.edu", replyTo: "endowment@hartwell.edu",
    bodyPreview: "Dear {{first_name}},\n\nAttached you'll find your personalized Endowment Impact Report for 2025. This year, your endowed scholarship of {{endowment_name}} supported {{scholar_count}} students in {{college_name}}.",
    mergeFieldsInMessage: ["{{first_name}}", "{{endowment_name}}", "{{scholar_count}}", "{{college_name}}"],
    envelope: { color: "#7c45b0", colorName: "Purple", returnAddress: "Endowment Services, Hartwell University, 100 Campus Dr, Hartford, CT 06106", logo: true, logoPosition: "Top Left" },
    landingPage: {
      headline: "Your Impact Report, {{first_name}}",
      bodyHtml: "Your {{endowment_name}} scholarship supported {{scholar_count}} students this year. Watch the video above for a personal update from the scholars themselves.",
      ctaLabel: "View Full Report",
      ctaUrl: "https://thankview.com/hartwell/endowment/2025",
      mergeFields: ["{{first_name}}", "{{endowment_name}}", "{{scholar_count}}"],
      backgroundImage: true,
    },
    videoSlots: buildVideoSlots({ intro: true, personal: true, addon1: true, addon2: false, outro: true }),
    hasOverlay: true,
    overlayText: "2025 Endowment Report",
    sendDates: ["Dec 5, 2025"],
    constituents_list: [
      { id: 1, name: "James Whitfield", email: "j.whitfield@alumni.edu", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Dec 5, 2025 9:00 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Dec 6, 2025", message: "The student video was so moving. Thank you for sharing this." }] },
      { id: 2, name: "Linda Osei", email: "l.osei@alumni.edu", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 1,
        sendHistory: [
          { date: "Dec 5, 2025 9:00 AM", status: "Delivered", opened: false, clicked: false },
          { date: "Dec 12, 2025 9:00 AM", status: "Delivered", opened: true, clicked: true },
        ],
        replyContent: [{ date: "Dec 13, 2025", message: "Just watched the video \u2014 brought tears to my eyes. Please keep these coming!" }] },
      { id: 3, name: "Catherine Moore", email: "c.moore@alumni.edu", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Dec 5, 2025 9:00 AM", status: "Delivered", opened: true, clicked: false }], replyContent: [] },
      { id: 4, name: "Richard Tanaka", email: "r.tanaka@corp.com", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Dec 5, 2025 9:01 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Dec 7, 2025", message: "Wonderful report. I'd love to meet the scholars at the spring event." }] },
      { id: 5, name: "Deborah Washington", email: "d.washington@foundation.org", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Dec 5, 2025 9:01 AM", status: "Delivered", opened: true, clicked: false }], replyContent: [] },
      { id: 6, name: "Frank Mendez", email: "f.mendez@alumni.edu", hasVideo: true, delivery: "Failed Send", replies: "\u2014", resendCount: 0,
        sendHistory: [{ date: "Dec 5, 2025 9:01 AM", status: "Failed Send", opened: false, clicked: false }], replyContent: [] },
    ],
  },
  "9": {
    id: 9, name: "Reunion Giving Challenge", type: "Solicitation", channel: "Email",
    status: "Scheduled", sendDate: "Mar 10, 2026", constituents: 4, openRate: "\u2014", replies: 0, videos: 4, videoViews: 0, clickRate: "\u2014",
    spamRate: "\u2014", bounceRate: "\u2014",
    subject: "Class of 2016 \u2014 it's reunion time! Can we count on you, {{first_name}}?",
    senderName: "Michelle Park", senderEmail: "m.park@hartwell.edu", replyTo: "reunion@hartwell.edu",
    bodyPreview: "Hi {{first_name}},\n\nYour 10-year reunion is right around the corner! To celebrate this milestone, we're launching a class giving challenge. Can the Class of {{class_year}} reach 50% participation?",
    mergeFieldsInMessage: ["{{first_name}}", "{{class_year}}"],
    envelope: { color: "#15803d", colorName: "Green", returnAddress: "Alumni Relations, Hartwell University, 100 Campus Dr, Hartford, CT 06106", logo: true, logoPosition: "Top Left" },
    landingPage: {
      headline: "Class of {{class_year}} Reunion Challenge",
      bodyHtml: "Hey {{first_name}}, can the Class of {{class_year}} reach 50% participation? Watch the video and make your gift today!",
      ctaLabel: "Give Now",
      ctaUrl: "https://give.hartwell.edu/reunion",
      mergeFields: ["{{first_name}}", "{{class_year}}"],
      backgroundImage: false,
    },
    videoSlots: buildVideoSlots({ intro: true, personal: true, addon1: false, addon2: false, outro: true }),
    hasOverlay: false,
    sendDates: ["Mar 10, 2026"],
    constituents_list: [
      { id: 1, name: "Olivia Nguyen", email: "o.nguyen@alumni.edu", hasVideo: true, delivery: "Send Scheduled", replies: "\u2014", resendCount: 0,
        sendHistory: [{ date: "Mar 10, 2026 9:00 AM", status: "Send Scheduled", opened: false, clicked: false }], replyContent: [] },
      { id: 2, name: "Jason Patel", email: "j.patel@email.com", hasVideo: true, delivery: "Send Scheduled", replies: "\u2014", resendCount: 0,
        sendHistory: [{ date: "Mar 10, 2026 9:00 AM", status: "Send Scheduled", opened: false, clicked: false }], replyContent: [] },
      { id: 3, name: "Brittany Cole", email: "b.cole@corp.com", hasVideo: true, delivery: "Send Scheduled", replies: "\u2014", resendCount: 0,
        sendHistory: [{ date: "Mar 10, 2026 9:00 AM", status: "Send Scheduled", opened: false, clicked: false }], replyContent: [] },
      { id: 4, name: "Kevin O'Brien", email: "k.obrien@alumni.edu", hasVideo: true, delivery: "Send Scheduled", replies: "\u2014", resendCount: 0,
        sendHistory: [{ date: "Mar 10, 2026 9:00 AM", status: "Send Scheduled", opened: false, clicked: false }], replyContent: [] },
    ],
    flowSteps: [
      { id: "cs1", stepNumber: 1, label: "Reunion Kickoff Email", type: "email", description: "Initial appeal with class challenge details", sentDate: "Mar 10, 2026 9:00 AM", sentCount: 4, deliveredCount: 4, openedCount: 0, clickedCount: 0, status: "completed",
        recipients: [
          { name: "Olivia Nguyen", email: "o.nguyen@alumni.edu", status: "Delivered" },
          { name: "Jason Patel", email: "j.patel@email.com", status: "Delivered" },
          { name: "Brittany Cole", email: "b.cole@corp.com", status: "Delivered" },
          { name: "Kevin O'Brien", email: "k.obrien@alumni.edu", status: "Delivered" },
        ] },
      { id: "cs2", stepNumber: 2, label: "Wait 5 Days", type: "wait", description: "Pause before reminder", status: "active" },
      { id: "cs3", stepNumber: 3, label: "Reunion Reminder Email", type: "email", description: "Follow-up referencing the reunion event date", hardCodedDate: "March 15", status: "pending" },
      { id: "cs4", stepNumber: 4, label: "Condition: Clicked?", type: "condition", description: "Branch based on CTA click", status: "pending", conditionMetLabel: "Clicked CTA", conditionNotMetLabel: "No click", yesTargetId: "cs5", noTargetId: "cs6" },
      { id: "cs5", stepNumber: 5, label: "Thank You SMS", type: "sms", description: "SMS thank-you for donors", status: "pending" },
      { id: "cs6", stepNumber: 6, label: "Final Appeal Email", type: "email", description: "Last chance email before reunion weekend", status: "pending" },
    ],
    automationRules: [
      { id: "ar1", label: "Send Step 3 if no open after 5 days", sourceStepId: "cs1", targetStepId: "cs3" },
      { id: "ar2", label: "Send Step 5 if CTA clicked in Step 3", sourceStepId: "cs3", targetStepId: "cs5" },
      { id: "ar3", label: "Send Step 6 if no click after 2 days", sourceStepId: "cs3", targetStepId: "cs6" },
    ],
  },
  "10": {
    id: 10, name: "Phonathon Follow-Up Drip", type: "Thank You", channel: "SMS",
    status: "Sent", sendDate: "Jan 22, 2026", constituents: 66, openRate: "88.5%", replies: 9, videos: 66, videoViews: 52, clickRate: "36.4%",
    spamRate: "0.0%", bounceRate: "0.5%",
    subject: "Thanks for chatting with us, {{first_name}}!",
    senderName: "Kelley Molt", senderEmail: "kelley.molt@hartwell.edu", replyTo: "phonathon@hartwell.edu",
    bodyPreview: "Hi {{first_name}}, it was wonderful speaking with you during our phonathon! Tap the link to watch a personal video update on how your past gifts made a difference: {{video_link}}",
    mergeFieldsInMessage: ["{{first_name}}", "{{video_link}}"],
    envelope: null,
    landingPage: {
      headline: "Thanks for chatting, {{first_name}}!",
      bodyHtml: "We loved speaking with you. Watch the video above for a personal update on your impact at Hartwell.",
      ctaLabel: "Give Again",
      ctaUrl: "https://give.hartwell.edu/phonathon",
      mergeFields: ["{{first_name}}"],
      backgroundImage: false,
    },
    videoSlots: buildVideoSlots({ intro: false, personal: true, addon1: false, addon2: false, outro: true }),
    hasOverlay: false,
    sendDates: ["Jan 22, 2026"],
    constituents_list: [
      { id: 1, name: "David Park", email: "d.park@alumni.edu", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Jan 22, 2026 11:00 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Jan 23, 2026", message: "Great follow-up! I'll be making a gift this week." }] },
      { id: 2, name: "Aisha Johnson", email: "a.johnson@gmail.com", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Jan 22, 2026 11:00 AM", status: "Delivered", opened: true, clicked: false }], replyContent: [] },
      { id: 3, name: "Marcus Reid", email: "m.reid@email.com", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 1,
        sendHistory: [
          { date: "Jan 22, 2026 11:00 AM", status: "Delivered", opened: false, clicked: false },
          { date: "Jan 29, 2026 11:00 AM", status: "Delivered", opened: true, clicked: false },
        ], replyContent: [] },
      { id: 4, name: "Emily Torres", email: "e.torres@corp.com", hasVideo: true, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Jan 22, 2026 11:01 AM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Jan 24, 2026", message: "The personal video was such a nice touch!" }] },
      { id: 5, name: "Robert Kim", email: "r.kim@hartwell.edu", hasVideo: true, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Jan 22, 2026 11:01 AM", status: "Delivered", opened: false, clicked: false }], replyContent: [] },
      { id: 6, name: "Natalie Brooks", email: "n.brooks@alumni.edu", hasVideo: true, delivery: "Failed Send", replies: "\u2014", resendCount: 0,
        sendHistory: [{ date: "Jan 22, 2026 11:01 AM", status: "Failed Send", opened: false, clicked: false }], replyContent: [] },
    ],
    flowSteps: [
      { id: "cs1", stepNumber: 1, label: "Thank You SMS", type: "sms", description: "Personal thank-you SMS with video link", sentDate: "Jan 22, 2026 11:00 AM", sentCount: 66, deliveredCount: 65, openedCount: 58, clickedCount: 24, status: "completed",
        recipients: [
          { name: "David Park", email: "d.park@alumni.edu", status: "Clicked" },
          { name: "Aisha Johnson", email: "a.johnson@gmail.com", status: "Opened" },
          { name: "Marcus Reid", email: "m.reid@email.com", status: "Delivered" },
          { name: "Emily Torres", email: "e.torres@corp.com", status: "Clicked" },
          { name: "Robert Kim", email: "r.kim@hartwell.edu", status: "Delivered" },
          { name: "Natalie Brooks", email: "n.brooks@alumni.edu", status: "Failed" },
        ] },
      { id: "cs2", stepNumber: 2, label: "Wait 5 Days", type: "wait", description: "Pause before follow-up", sentDate: "Jan 27, 2026", status: "completed" },
      { id: "cs3", stepNumber: 3, label: "Giving Reminder SMS", type: "sms", description: "Follow-up with a giving link for those who engaged", sentDate: "Jan 27, 2026 11:00 AM", sentCount: 40, deliveredCount: 40, openedCount: 35, clickedCount: 18, status: "completed",
        recipients: [
          { name: "David Park", email: "d.park@alumni.edu", status: "Clicked" },
          { name: "Aisha Johnson", email: "a.johnson@gmail.com", status: "Clicked" },
          { name: "Emily Torres", email: "e.torres@corp.com", status: "Opened" },
          { name: "Marcus Reid", email: "m.reid@email.com", status: "Opened" },
        ] },
    ],
    automationRules: [
      { id: "ar1", label: "Send Step 3 if opened Step 1", sourceStepId: "cs1", targetStepId: "cs3" },
    ],
  },
  "11": {
    id: 11, name: "Student Video Testimonials", type: "Video Request", channel: "Shareable Link",
    status: "Sent", sendDate: "Feb 3, 2026", constituents: 237, openRate: "61.8%", replies: 42, videos: 0, videoViews: 0, clickRate: "18.6%",
    isVideoRequest: true, vrDueDate: "Mar 1, 2026", vrSubmissionsReceived: 42, vrSubmissionsTotal: 237,
    vrShareableUrl: "https://thankview.com/hartwell/vr/student-testimonials-2026",
    vrSubmissions: [
      { id: 1, recorderName: "Jordan Blake", recorderEmail: "j.blake@alumni.edu", submittedDate: "Feb 4, 2026", duration: "1:23", thumbnailColor: "#7c45b0", status: "approved" },
      { id: 2, recorderName: "Samira Patel", recorderEmail: "s.patel@email.com", submittedDate: "Feb 5, 2026", duration: "0:58", thumbnailColor: "#007c9e", status: "approved" },
      { id: 3, recorderName: "Maria Gonzalez", recorderEmail: "m.gonzalez@corp.com", submittedDate: "Feb 4, 2026", duration: "1:45", thumbnailColor: "#15803d", status: "reviewed" },
      { id: 4, recorderName: "Alex Kim", recorderEmail: "a.kim@alumni.edu", submittedDate: "Feb 6, 2026", duration: "2:01", thumbnailColor: "#b45309", status: "received" },
      { id: 5, recorderName: "Priya Nair", recorderEmail: "p.nair@foundation.org", submittedDate: "Feb 7, 2026", duration: "1:10", thumbnailColor: "#7c45b0", status: "approved" },
    ],
    spamRate: "\u2014", bounceRate: "\u2014",
    subject: "We'd love to hear your story, {{first_name}}!",
    senderName: "Michelle Park", senderEmail: "m.park@hartwell.edu", replyTo: "stories@hartwell.edu",
    bodyPreview: "Hi {{first_name}},\n\nAs part of our Student Voices initiative, we're collecting video testimonials from current students and recent grads. Record a short video telling us how Hartwell has impacted your life \u2014 it only takes a minute!",
    mergeFieldsInMessage: ["{{first_name}}"],
    envelope: null,
    landingPage: {
      headline: "Share Your Hartwell Story, {{first_name}}",
      bodyHtml: "We'd love to hear how Hartwell has made a difference in your life. Record a short video testimonial below \u2014 it only takes 60 seconds!",
      ctaLabel: "Record Your Video",
      ctaUrl: "https://thankview.com/hartwell/record",
      mergeFields: ["{{first_name}}"],
      backgroundImage: true,
    },
    videoSlots: buildVideoSlots({ intro: false, personal: false, addon1: false, addon2: false, outro: false }),
    hasOverlay: false,
    sendDates: ["Feb 3, 2026"],
    constituents_list: [
      { id: 1, name: "Jordan Blake", email: "j.blake@alumni.edu", hasVideo: false, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Feb 3, 2026 12:00 PM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Feb 4, 2026", message: "Just submitted my video! Thanks for the opportunity." }] },
      { id: 2, name: "Samira Patel", email: "s.patel@email.com", hasVideo: false, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Feb 3, 2026 12:00 PM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Feb 5, 2026", message: "Loved doing this! Can I share the link with friends?" }] },
      { id: 3, name: "Tyler Nguyen", email: "t.nguyen@alumni.edu", hasVideo: false, delivery: "Delivered", replies: "No reply", resendCount: 0,
        sendHistory: [{ date: "Feb 3, 2026 12:01 PM", status: "Delivered", opened: false, clicked: false }], replyContent: [] },
      { id: 4, name: "Maria Gonzalez", email: "m.gonzalez@corp.com", hasVideo: false, delivery: "Delivered", replies: "1 reply", resendCount: 0,
        sendHistory: [{ date: "Feb 3, 2026 12:01 PM", status: "Delivered", opened: true, clicked: true }],
        replyContent: [{ date: "Feb 4, 2026", message: "What a fun initiative! Video submitted." }] },
      { id: 5, name: "Chris Anderson", email: "c.anderson@alumni.edu", hasVideo: false, delivery: "Failed Send", replies: "\u2014", resendCount: 0,
        sendHistory: [{ date: "Feb 3, 2026 12:01 PM", status: "Failed Send", opened: false, clicked: false }], replyContent: [] },
    ],
  },
};

// ── Status badge styles ─────────────────────────────────────────────────────────
const STATUS_BADGE_STYLES: Record<string, { backgroundColor: string; color: string }> = {
  Sent:      { backgroundColor: TV.successBg, color: TV.success },
  Scheduled: { backgroundColor: TV.infoBg, color: TV.info },
  Sending:   { backgroundColor: TV.warningBg, color: TV.warning },
  Draft:     { backgroundColor: TV.brandTint, color: TV.textBrand },
  Archived:  { backgroundColor: TV.surfaceMuted, color: TV.textSecondary },
};

const DELIVERY_STATUS_BG: Record<string, string> = {
  "N/A":            "bg-tv-surface text-tv-text-secondary",
  "Video Added":    "bg-tv-brand-tint text-tv-brand",
  "Send Scheduled": "bg-tv-info-bg text-tv-info",
  "Sending":        "bg-tv-warning-bg text-tv-warning",
  "Sent":           "bg-tv-info-bg text-tv-info",
  "Delivered":      "bg-tv-success-bg text-tv-success",
  "Opened":         "bg-emerald-50 text-emerald-700",
  "Clicked":        "bg-cyan-50 text-cyan-700",
  "Replied":        "bg-tv-info-bg text-tv-info",
  "Bounced":        "bg-tv-danger-bg text-tv-danger",
  "Unsubscribed":   "bg-tv-warning-bg text-tv-warning",
  "Failed Send":    "bg-tv-danger-bg text-tv-danger",
};

/** Derive the most advanced status from constituent data */
function deriveStatus(r: Constituent): string {
  if (r.replyContent.length > 0) return "Replied";
  const lastSend = r.sendHistory[r.sendHistory.length - 1];
  if (!lastSend) {
    if (r.hasVideo) return "Video Added";
    return "N/A";
  }
  if (lastSend.status === "Failed Send") return "Bounced";
  if (lastSend.clicked) return "Clicked";
  if (lastSend.opened) return "Opened";
  if (lastSend.status === "Delivered") return "Sent";
  return r.delivery;
}

const CONSTITUENT_COLUMNS: ColumnDef[] = [
  { key: "name",    label: "Name",         group: "Summary", required: true },
  { key: "email",   label: "Email / Phone", group: "Contact" },
  { key: "video",   label: "Video",        group: "Engagement" },
  { key: "status",  label: "Status",       group: "Engagement" },
  { key: "opened",  label: "Opened",       group: "Engagement" },
  { key: "lastSent", label: "Last Sent",   group: "Engagement" },
  { key: "replies", label: "Replies",      group: "Engagement" },
  { key: "actions", label: "Actions",      group: "Summary" },
];

const DEFAULT_CONSTITUENT_COLS = CONSTITUENT_COLUMNS.map(c => c.key);

/* ═══════════════════════════════════════════════════════════════════════════════
 * SUB-COMPONENTS
 * ═══════════════════════════════════════════════════════════════════════════════ */

// Merge field highlighter
function MergeHighlight({ text }: { text: string }) {
  const parts = text.split(/({{[^}]+}})/g);
  return (
    <span>
      {parts.map((part, i) =>
        part.startsWith("{{") ? (
          <span key={i} className="bg-tv-brand-tint text-tv-brand px-1 py-0.5 rounded font-mono text-[12px]">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

// Test Send Modal
function TestSendModal({ constituents, onSend, onCancel }: { constituents: Constituent[]; onSend: (constituentId: number) => void; onCancel: () => void }) {
  const [selectedId, setSelectedId] = useState(constituents[0]?.id ?? 0);
  const [testEmail, setTestEmail] = useState("kelley.molt@hartwell.edu");

  return (
    <Modal opened onClose={onCancel} title="Send Test" size="md">
      <TextInput label="Send test to" value={testEmail} onChange={e => setTestEmail(e.currentTarget.value)} mb="md" description="The test will be sent to this email address." />
      <Box mb="lg">
        <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={8}>Preview as constituent</Text>
        <Text fz={11} c={TV.textSecondary} mb="xs">Merge fields and personalized video will reflect the selected constituent.</Text>
        <Paper radius="md" withBorder style={{ borderColor: TV.borderLight, maxHeight: 200, overflowY: "auto" }}>
          {constituents.map((r) => (
            <UnstyledButton key={r.id} onClick={() => setSelectedId(r.id)}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-tv-border-divider last:border-b-0 transition-colors text-left"
              style={{ backgroundColor: selectedId === r.id ? TV.brandTint : undefined }}>
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedId === r.id ? "bg-tv-brand border-tv-brand" : "border-tv-border"}`}>
                {selectedId === r.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>
              <div className="w-7 h-7 bg-tv-brand-tint rounded-full flex items-center justify-center text-tv-brand text-[9px] shrink-0" style={{ fontWeight: 700 }}>
                {r.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <Text fz={12} fw={600} c={selectedId === r.id ? TV.textBrand : TV.textPrimary} truncate>{r.name}</Text>
                <Text fz={10} c={TV.textSecondary} truncate>{r.email}</Text>
              </div>
            </UnstyledButton>
          ))}
        </Paper>
      </Box>
      <Row justify="flex-end" gap="sm">
        <Button variant="default" onClick={onCancel}>Cancel</Button>
        <Button color="tvPurple" leftSection={<Send size={13} />} onClick={() => onSend(selectedId)}>Send Test</Button>
      </Row>
    </Modal>
  );
}



// Expandable constituent row (for Data tab)
function ConstituentDataRow({ r, isSent }: { r: Constituent; isSent: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const hasExpansion = r.sendHistory.length > 0 || r.replyContent.length > 0;
  const status = deriveStatus(r);

  return (
    <div className="border-b border-tv-border-divider last:border-b-0">
      <UnstyledButton onClick={() => hasExpansion && setExpanded(!expanded)} className="w-full text-left" style={{ cursor: hasExpansion ? "pointer" : "default" }}>
        {/* Desktop */}
        <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1.5fr_1.2fr_1fr_0.5fr] gap-3 px-5 py-3.5 items-center hover:bg-tv-surface-muted transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 bg-tv-brand-tint rounded-full flex items-center justify-center text-tv-brand text-[9px] shrink-0" style={{ fontWeight: 700 }}>
              {r.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <span className="text-[13px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{r.name}</span>
          </div>
          <span className="text-[12px] text-tv-text-secondary truncate">{r.email}</span>
          <div>
            {r.hasVideo
              ? <Pill color="green">Video</Pill>
              : <Pill color="gray">No video</Pill>}
          </div>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full ${DELIVERY_STATUS_BG[status] ?? "bg-tv-surface text-tv-text-secondary"}`} style={{ fontWeight: 600 }}>{status}</span>
          <div className="flex items-center gap-1.5">
            {r.replyContent.length > 0 ? (
              <>
                <Reply size={11} className="text-tv-info" />
                <span className="text-[12px] text-tv-info" style={{ fontWeight: 500 }}>{r.replyContent.length} repl{r.replyContent.length === 1 ? "y" : "ies"}</span>
              </>
            ) : (
              <span className="text-[12px] text-tv-text-secondary">{isSent ? "No reply" : "\u2014"}</span>
            )}
          </div>
          <span className="text-[11px] text-tv-text-secondary">{r.sendHistory.length} send{r.sendHistory.length !== 1 ? "s" : ""}</span>
          {hasExpansion ? (expanded ? <ChevronUp size={13} className="text-tv-text-decorative" /> : <ChevronDown size={13} className="text-tv-text-decorative" />) : <span />}
        </div>
        {/* Mobile */}
        <div className="sm:hidden flex items-center gap-3 px-4 py-3.5 hover:bg-tv-surface-muted transition-colors">
          <div className="w-8 h-8 bg-tv-brand-tint rounded-full flex items-center justify-center text-tv-brand text-[10px] shrink-0" style={{ fontWeight: 700 }}>
            {r.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{r.name}</p>
            <div className="flex items-center gap-2 mt-0.5">
              {r.hasVideo && <CircleCheckBig size={11} className="text-tv-success" />}
              <span className={`text-[9px] px-2 py-0.5 rounded-full ${DELIVERY_STATUS_BG[deriveStatus(r)] ?? "bg-tv-surface text-tv-text-secondary"}`} style={{ fontWeight: 600 }}>{deriveStatus(r)}</span>
              {r.replyContent.length > 0 && <Reply size={10} className="text-tv-info" />}
            </div>
          </div>
          {hasExpansion && (expanded ? <ChevronUp size={13} className="text-tv-text-decorative" /> : <ChevronDown size={13} className="text-tv-text-decorative" />)}
        </div>
      </UnstyledButton>

      {expanded && (
        <div className="px-5 sm:pl-14 pb-4 space-y-3">
          {/* Send History */}
          {r.sendHistory.length > 0 && (
            <div>
              <Text fz={10} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Send History</Text>
              <div className="space-y-1.5">
                {r.sendHistory.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 text-[12px]">
                    <CalendarDays size={11} className="text-tv-text-decorative shrink-0" />
                    <span className="text-tv-text-secondary w-[160px] shrink-0">{s.date}</span>
                    <Pill color={s.status === "Delivered" ? "green" : s.status === "Failed Send" ? "red" : s.status === "Send Scheduled" ? "cyan" : "yellow"}>
                      {s.status}
                    </Pill>
                    {s.opened && <Pill color="tvPurple">Opened</Pill>}
                    {s.clicked && <Pill color="tvPurple">Clicked CTA</Pill>}
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Replies */}
          {r.replyContent.length > 0 && (
            <div>
              <Text fz={10} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Landing Page Replies</Text>
              <div className="space-y-2">
                {r.replyContent.map((reply, i) => (
                  <Paper key={i} radius="md" p="sm" style={{ backgroundColor: TV.infoBg, borderLeft: `3px solid ${TV.infoBorder}` }}>
                    <Text fz={10} c={TV.info} mb={4}>{reply.date}</Text>
                    <Text fz={12} c={TV.textPrimary} style={{ lineHeight: 1.5 }}>{reply.message}</Text>
                  </Paper>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Inheritance toggle item ────────────────────────────────────────────────────
interface InheritOption {
  key: string;
  label: string;
  description: string;
  icon: ReactNode;
  defaultOn: boolean;
}

const INHERIT_OPTIONS: InheritOption[] = [
  { key: "sendMethod",    label: "Send method",     description: "Email, SMS, or Shareable Link delivery channel",                     icon: <Mail size={14} className="text-tv-brand" />,            defaultOn: true },
  { key: "constituentList", label: "Constituent list",  description: "All constituents and their associated data",                      icon: <Users size={14} className="text-tv-info" />,            defaultOn: true },
  { key: "successMetric", label: "Success metric",   description: "The KPI used to measure campaign effectiveness",              icon: <BarChart3 size={14} className="text-tv-success" />,     defaultOn: true },
  { key: "shareSettings", label: "Share settings",   description: "Visibility and sharing configuration for the campaign",       icon: <Share2 size={14} className="text-tv-info" />,           defaultOn: true },
  { key: "tags",          label: "Tags",             description: "Organizational tags applied to the campaign",                 icon: <Tag size={14} className="text-tv-brand" />,             defaultOn: true },
  { key: "failureEvent",  label: "Failure event",    description: "Action triggered when a constituent doesn't engage",            icon: <Zap size={14} className="text-tv-danger" />,            defaultOn: true },
  { key: "successEvent",  label: "Success event",    description: "Action triggered when a constituent completes the desired goal", icon: <Target size={14} className="text-tv-success" />,        defaultOn: true },
];

// Step-type icon + color mapping for campaign flow steps
const STEP_VISUAL: Record<string, { icon: ReactNode; bg: string; color: string }> = {
  email:     { icon: <Mail size={13} />,           bg: TV.brandTint,  color: TV.brand },
  sms:       { icon: <MessageSquare size={13} />,   bg: TV.infoBg,     color: TV.info },
  wait:      { icon: <Timer size={13} />,           bg: TV.warningBg,  color: TV.warning },
  condition: { icon: <GitBranch size={13} />,       bg: TV.brandTint,  color: TV.brand },
};

/* ── Campaign Flow Map — visual tree preview for multi-step campaigns ──────── */

const RECIPIENT_STATUS_STYLE: Record<string, { bg: string; text: string; icon: typeof CircleCheckBig }> = {
  Clicked:   { bg: TV.brandTint, text: TV.brand, icon: BarChart3 },
  Opened:    { bg: TV.infoBg, text: TV.info, icon: Eye },
  Delivered: { bg: TV.successBg, text: TV.success, icon: CircleCheckBig },
  Failed:    { bg: TV.dangerBg, text: TV.danger, icon: CircleAlert },
  Pending:   { bg: TV.surface, text: TV.textSecondary, icon: Clock },
};

function FlowStepNode({ step, isLast, isExpanded, onToggle }: { step: CampaignFlowStep; isLast: boolean; isExpanded: boolean; onToggle: () => void }) {
  const vis = STEP_VISUAL[step.type] ?? STEP_VISUAL.email;
  const isCompleted = step.status === "completed";
  const isActive = step.status === "active";
  const isSkipped = step.status === "skipped";

  const statusLabel = isCompleted ? "Completed" : isActive ? "In Progress" : isSkipped ? "Skipped" : "Pending";
  const statusColor = isCompleted ? TV.success : isActive ? TV.warning : isSkipped ? TV.textSecondary : TV.textDecorative;
  const statusBg = isCompleted ? TV.successBg : isActive ? TV.warningBg : isSkipped ? TV.surface : TV.surface;

  const hasMetrics = step.type !== "wait" && step.type !== "condition" && (step.sentCount ?? 0) > 0;
  const isCondition = step.type === "condition";
  const isSendStep = step.type === "email" || step.type === "sms";
  const hasRecipients = isSendStep && (step.recipients?.length ?? 0) > 0;

  return (
    <div className="flex items-start gap-0 relative">
      {/* Vertical connector line + node circle */}
      <div className="flex flex-col items-center shrink-0" style={{ width: 40 }}>
        {/* Node circle */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 relative border-2"
          style={{
            backgroundColor: isCompleted || isActive ? vis.bg : TV.surface,
            borderColor: isCompleted ? TV.success : isActive ? TV.warning : isSkipped ? TV.borderLight : TV.borderLight,
            color: isCompleted || isActive ? vis.color : TV.textDecorative,
          }}
        >
          {isCompleted ? (
            <CircleCheckBig size={16} style={{ color: TV.success }} />
          ) : isActive ? (
            <Loader2 size={14} className="animate-spin" style={{ color: TV.warning }} />
          ) : (
            vis.icon
          )}
        </div>
        {/* Vertical line down */}
        {!isLast && (
          <div
            className="w-0.5 flex-1 min-h-[24px]"
            style={{ backgroundColor: isCompleted ? TV.successBorder : TV.borderLight }}
          />
        )}
      </div>

      {/* Step content card */}
      <div className={`flex-1 min-w-0 pb-3 ${!isLast ? "mb-1" : ""}`}>
        <div
          className={`rounded-lg border p-3.5 transition-all ${hasRecipients ? "cursor-pointer hover:shadow-sm" : ""} ${isExpanded ? "ring-2 ring-tv-brand/20" : ""}`}
          style={{
            borderColor: isExpanded ? TV.brand : isCompleted ? TV.successBorder : isActive ? TV.warningBorder : TV.borderLight,
            backgroundColor: isActive ? TV.warningBg : "white",
          }}
          onClick={hasRecipients ? onToggle : undefined}
          role={hasRecipients ? "button" : undefined}
          tabIndex={hasRecipients ? 0 : undefined}
          onKeyDown={hasRecipients ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } } : undefined}
          aria-expanded={hasRecipients ? isExpanded : undefined}
          aria-label={hasRecipients ? `${step.label} — click to ${isExpanded ? "hide" : "view"} recipients` : undefined}
        >
          {/* Header row */}
          <div className="flex items-center gap-2.5 mb-1.5">
            <div
              className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0"
              style={{ backgroundColor: vis.bg, color: vis.color }}
            >
              {vis.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>
                  {step.label}
                </span>
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] shrink-0"
                  style={{ fontWeight: 600, backgroundColor: statusBg, color: statusColor }}
                >
                  {statusLabel}
                </span>
              </div>
              {step.description && (
                <p className="text-[11px] text-tv-text-secondary mt-0.5">{step.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {step.sentDate && (
                <span className="text-[10px] text-tv-text-secondary flex items-center gap-1">
                  <CalendarDays size={10} className="text-tv-text-decorative" />
                  {step.sentDate}
                </span>
              )}
              {hasRecipients && (
                <div className="flex items-center gap-1 text-tv-text-secondary">
                  <Users size={11} />
                  <span className="text-[10px]" style={{ fontWeight: 600 }}>{step.recipients!.length}</span>
                  {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </div>
              )}
            </div>
          </div>

          {/* Metrics row for email/sms steps */}
          {hasMetrics && (
            <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-tv-border-divider">
              {[
                { label: "Sent", value: step.sentCount, icon: Send, color: TV.textSecondary, iconColor: "text-tv-text-decorative" },
                { label: "Delivered", value: step.deliveredCount, icon: CircleCheckBig, color: TV.success, iconColor: "text-tv-success" },
                { label: "Opened", value: step.openedCount, icon: Eye, color: TV.info, iconColor: "text-tv-info" },
                { label: "Clicked", value: step.clickedCount, icon: BarChart3, color: TV.brand, iconColor: "text-tv-brand" },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-1.5">
                  <m.icon size={11} className={m.iconColor} />
                  <span className="text-[11px]" style={{ fontWeight: 700, color: m.color }}>{m.value ?? 0}</span>
                  <span className="text-[9px] text-tv-text-secondary">{m.label}</span>
                </div>
              ))}
              {/* Delivery rate mini bar */}
              {(step.sentCount ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 ml-auto">
                  <div className="w-[60px] h-1.5 rounded-full bg-tv-surface overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.round(((step.openedCount ?? 0) / (step.sentCount ?? 1)) * 100)}%`,
                        backgroundColor: TV.success,
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-tv-text-secondary" style={{ fontWeight: 600 }}>
                    {Math.round(((step.openedCount ?? 0) / (step.sentCount ?? 1)) * 100)}% open
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Condition branch summary */}
          {isCondition && (step.conditionMetCount != null || step.conditionNotMetCount != null) && (
            <div className="flex items-stretch gap-2 mt-2.5 pt-2.5 border-t border-tv-border-divider">
              <div className="flex-1 rounded-sm p-2 flex items-center gap-2" style={{ backgroundColor: TV.successBg }}>
                <CircleCheckBig size={12} className="text-tv-success shrink-0" />
                <div>
                  <span className="text-[11px] text-tv-success block" style={{ fontWeight: 700 }}>{step.conditionMetCount ?? 0}</span>
                  <span className="text-[9px] text-tv-text-secondary">{step.conditionMetLabel ?? "Yes"}</span>
                </div>
              </div>
              <div className="flex-1 rounded-sm p-2 flex items-center gap-2" style={{ backgroundColor: TV.dangerBg }}>
                <CircleAlert size={12} className="text-tv-danger shrink-0" />
                <div>
                  <span className="text-[11px] text-tv-danger block" style={{ fontWeight: 700 }}>{step.conditionNotMetCount ?? 0}</span>
                  <span className="text-[9px] text-tv-text-secondary">{step.conditionNotMetLabel ?? "No"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hard-coded date warning chip */}
          {step.hardCodedDate && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
                style={{ backgroundColor: TV.warningBg, color: TV.warning, fontWeight: 600, border: `1px solid ${TV.warningBorder}` }}
              >
                <CalendarDays size={10} />
                Hard-coded: {step.hardCodedDate}
              </span>
            </div>
          )}

          {/* ── Expanded recipient list ── */}
          {isExpanded && hasRecipients && (
            <div className="mt-3 pt-3 border-t border-tv-border-divider" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Users size={12} className="text-tv-text-label" />
                  <span className="text-[11px] text-tv-text-label" style={{ fontWeight: 600 }}>
                    RECIPIENTS ({step.recipients!.length}{(step.sentCount ?? 0) > step.recipients!.length ? ` of ${step.sentCount} shown` : ""})
                  </span>
                </div>
                {/* Status legend */}
                <div className="flex items-center gap-2">
                  {["Clicked", "Opened", "Delivered", "Failed"].map(s => {
                    const count = step.recipients!.filter(r => r.status === s).length;
                    if (count === 0) return null;
                    const st = RECIPIENT_STATUS_STYLE[s];
                    return (
                      <span key={s} className="flex items-center gap-1 text-[9px]" style={{ color: st.text, fontWeight: 600 }}>
                        <st.icon size={9} /> {count} {s.toLowerCase()}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-sm border border-tv-border-divider overflow-hidden bg-white">
                {step.recipients!.map((r, ri) => {
                  const st = RECIPIENT_STATUS_STYLE[r.status] ?? RECIPIENT_STATUS_STYLE.Pending;
                  return (
                    <div
                      key={ri}
                      className={`flex items-center gap-3 px-3 py-2 ${ri < step.recipients!.length - 1 ? "border-b border-tv-border-divider" : ""} hover:bg-tv-surface-muted/50 transition-colors`}
                    >
                      {/* Avatar circle */}
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] text-white shrink-0"
                        style={{ fontWeight: 700, backgroundColor: vis.color }}
                      >
                        {r.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{r.name}</p>
                        <p className="text-[10px] text-tv-text-secondary truncate">{r.email}</p>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] shrink-0"
                        style={{ fontWeight: 600, backgroundColor: st.bg, color: st.text }}
                      >
                        <st.icon size={9} />
                        {r.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CampaignFlowMap({ steps, rules }: { steps: CampaignFlowStep[]; rules: AutomationRule[] }) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  // Build a linear flow first, then branch condition targets
  // Identify condition steps and their branch targets
  const conditionSteps = steps.filter(s => s.type === "condition");

  // Build main trunk: steps that are NOT branch-only targets
  // A "branch target" is a step that is ONLY reachable via a condition's yesTargetId/noTargetId
  // and is NOT the next sequential step
  const branchTargetIds = new Set<string>();
  conditionSteps.forEach(cs => {
    const csIndex = steps.findIndex(s => s.id === cs.id);
    const nextStep = steps[csIndex + 1];
    // If yesTarget is the next sequential step, it stays in trunk
    if (cs.yesTargetId && cs.yesTargetId !== nextStep?.id) branchTargetIds.add(cs.yesTargetId);
    if (cs.noTargetId && cs.noTargetId !== nextStep?.id) branchTargetIds.add(cs.noTargetId);
  });

  // For simpler visualization: show all steps in order (trunk), then show branching inline
  // This works well for the common pattern of linear + condition at the end

  const completedSteps = steps.filter(s => s.status === "completed").length;
  const totalSteps = steps.length;
  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <Paper radius="xl" withBorder style={{ borderColor: TV.borderLight, overflow: "hidden" }} className="mb-6">
      {/* Header */}
      <div className="px-5 py-4 border-b border-tv-border-divider bg-tv-surface-muted">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-tv-brand-tint flex items-center justify-center">
              <GitBranch size={16} className="text-tv-brand" />
            </div>
            <div>
              <h2 className="text-[15px] text-tv-text-primary" style={{ fontWeight: 700 }}>Campaign Flow</h2>
              <p className="text-[11px] text-tv-text-secondary">
                {totalSteps} step{totalSteps !== 1 ? "s" : ""} · {rules.length} automation rule{rules.length !== 1 ? "s" : ""} · Click a step to view recipients
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Progress indicator */}
            <div className="flex items-center gap-2">
              <div className="w-[100px] h-2 rounded-full bg-tv-surface overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressPct}%`, backgroundColor: progressPct === 100 ? TV.success : TV.brand }}
                />
              </div>
              <span className="text-[11px] text-tv-text-secondary" style={{ fontWeight: 600 }}>
                {completedSteps}/{totalSteps} steps
              </span>
            </div>
            {progressPct === 100 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 600, backgroundColor: TV.successBg, color: TV.success }}>
                <CircleCheckBig size={10} /> All steps complete
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Flow visualization */}
      <div className="p-5">
        {/* Start marker */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex flex-col items-center" style={{ width: 40 }}>
            <div className="w-5 h-5 rounded-full bg-tv-success flex items-center justify-center">
              <Play size={9} className="text-white" fill="white" />
            </div>
            <div className="w-0.5 h-4" style={{ backgroundColor: TV.successBorder }} />
          </div>
          <span className="text-[10px] text-tv-text-secondary" style={{ fontWeight: 600 }}>CAMPAIGN START</span>
        </div>

        {/* Steps */}
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const isBranch = branchTargetIds.has(step.id);
          // Find the condition step that targets this step
          const parentCondition = conditionSteps.find(
            cs => cs.yesTargetId === step.id || cs.noTargetId === step.id
          );
          const branchLabel = parentCondition
            ? parentCondition.yesTargetId === step.id
              ? parentCondition.conditionMetLabel ?? "Yes"
              : parentCondition.conditionNotMetLabel ?? "No"
            : null;

          return (
            <div key={step.id}>
              {/* Branch label connector */}
              {isBranch && branchLabel && (
                <div className="flex items-center gap-0 mb-1">
                  <div className="flex flex-col items-center" style={{ width: 40 }}>
                    <div
                      className="w-0.5 h-3"
                      style={{ backgroundColor: TV.borderLight }}
                    />
                    <div
                      className="px-2 py-0.5 rounded-full text-[9px]"
                      style={{
                        fontWeight: 700,
                        backgroundColor: branchLabel === (parentCondition?.conditionMetLabel ?? "Yes") ? TV.successBg : TV.dangerBg,
                        color: branchLabel === (parentCondition?.conditionMetLabel ?? "Yes") ? TV.success : TV.danger,
                        border: `1px solid ${branchLabel === (parentCondition?.conditionMetLabel ?? "Yes") ? TV.successBorder : TV.dangerBorder}`,
                      }}
                    >
                      {branchLabel}
                    </div>
                    <div
                      className="w-0.5 h-3"
                      style={{ backgroundColor: TV.borderLight }}
                    />
                  </div>
                </div>
              )}
              <FlowStepNode step={step} isLast={isLast} isExpanded={expandedStepId === step.id} onToggle={() => setExpandedStepId(prev => prev === step.id ? null : step.id)} />
            </div>
          );
        })}

        {/* End marker */}
        <div className="flex items-center gap-3 mt-1">
          <div className="flex flex-col items-center" style={{ width: 40 }}>
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ backgroundColor: progressPct === 100 ? TV.success : TV.borderLight }}
            >
              {progressPct === 100
                ? <CircleCheckBig size={10} className="text-white" />
                : <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TV.textDecorative }} />
              }
            </div>
          </div>
          <span className="text-[10px] text-tv-text-secondary" style={{ fontWeight: 600 }}>
            {progressPct === 100 ? "CAMPAIGN COMPLETE" : "CAMPAIGN IN PROGRESS"}
          </span>
        </div>

        {/* Automation Rules summary */}
        {rules.length > 0 && (
          <div className="mt-5 pt-4 border-t border-tv-border-divider">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={13} className="text-tv-brand" />
              <span className="text-[11px] text-tv-text-label" style={{ fontWeight: 600 }}>AUTOMATION RULES</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rules.map(rule => {
                const sourceStep = steps.find(s => s.id === rule.sourceStepId);
                const targetStep = steps.find(s => s.id === rule.targetStepId);
                return (
                  <div
                    key={rule.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-sm border border-tv-border-light bg-white"
                  >
                    <div className="w-6 h-6 rounded-sm bg-tv-brand-tint flex items-center justify-center shrink-0">
                      <Zap size={11} className="text-tv-brand" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{rule.label}</p>
                      <p className="text-[9px] text-tv-text-decorative">
                        Step {sourceStep?.stepNumber ?? "?"} → Step {targetStep?.stepNumber ?? "?"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Paper>
  );
}

// Duplicate Campaign Modal
function CopyCampaignModal({ campaign, onCopy, onCancel }: {
  campaign: CampaignData;
  onCopy: (newName: string, inheritOptions: Record<string, boolean>) => void;
  onCancel: () => void;
}) {
  const [newName, setNewName] = useState(`${campaign.name} (Duplicate)`);
  const [inherit, setInherit] = useState<Record<string, boolean>>(
    Object.fromEntries(INHERIT_OPTIONS.map(o => [o.key, o.defaultOn]))
  );

  // Campaign flow step selection (all on by default)
  const hasSteps = (campaign.flowSteps?.length ?? 0) > 1;
  const [selectedSteps, setSelectedSteps] = useState<Set<string>>(
    new Set(campaign.flowSteps?.map(s => s.id) ?? [])
  );
  // Automation rule selection (all on by default)
  const [selectedRules, setSelectedRules] = useState<Set<string>>(
    new Set(campaign.automationRules?.map(r => r.id) ?? [])
  );

  const toggle = (key: string) => setInherit(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleStep = (id: string) => setSelectedSteps(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleRule = (id: string) => setSelectedRules(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const constituentsCopied = inherit.constituentList;

  // Summary counts
  const totalSteps = campaign.flowSteps?.length ?? 0;
  const checkedSteps = selectedSteps.size;
  const totalRules = campaign.automationRules?.length ?? 0;
  const checkedRules = selectedRules.size;

  // Steps with hard-coded dates that are selected
  const dateWarnings = (campaign.flowSteps ?? []).filter(
    s => s.hardCodedDate && selectedSteps.has(s.id)
  );

  return (
    <Modal opened onClose={onCancel} title="Duplicate Campaign" size="lg">
      <Stack gap="md">
        {/* New campaign name */}
        <TextInput
          label="New campaign name"
          value={newName}
          onChange={e => setNewName(e.currentTarget.value)}
          placeholder="Enter a name for the duplicated campaign"
        />

        {/* Always duplicated section */}
        <div>
          <Text fz={11} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={8} style={{ fontWeight: 600 }}>
            Always duplicated
          </Text>
          <Paper radius="md" withBorder style={{ borderColor: TV.borderLight }} p="sm">
            <Stack gap="xs">
              {[
                { label: "Message copy", note: campaign.channel === "SMS" ? "SMS body" : "Email subject & body" },
                { label: "Landing page design, settings & copy", note: "Full landing page configuration" },
                { label: "Video content", note: !constituentsCopied ? "Personalized videos will not be included (constituent list not duplicated)" : "Includes all video segments" },
              ].map(item => (
                <Row key={item.label} gap="sm" wrap="nowrap" align="flex-start">
                  <CircleCheckBig size={14} className="text-tv-success shrink-0 mt-0.5" />
                  <div>
                    <Text fz={13} c={TV.textPrimary} style={{ fontWeight: 500 }}>{item.label}</Text>
                    <Text fz={11} c={TV.textSecondary}>{item.note}</Text>
                  </div>
                </Row>
              ))}
            </Stack>
          </Paper>
        </div>

        {/* Personalized video caveat */}
        {!constituentsCopied && (
          <Paper radius="md" p="sm" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
            <Row gap="xs" wrap="nowrap" align="flex-start">
              <Info size={13} className="text-tv-warning shrink-0 mt-0.5" />
              <Text fz={11} c={TV.warning}>
                Since the constituent list is not being duplicated, personalized video portions will not carry over to the new campaign. Only shared video segments (intro, add-ons, outro) will be duplicated.
              </Text>
            </Row>
          </Paper>
        )}

        {/* ── Campaign Steps section (multi-step only) ──────────────────────── */}
        {hasSteps && (
          <div>
            <Text fz={11} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={8} style={{ fontWeight: 600 }}>
              Campaign Steps
            </Text>
            <Paper radius="md" withBorder style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
              {campaign.flowSteps!.map((step, i) => {
                const vis = STEP_VISUAL[step.type] ?? STEP_VISUAL.email;
                const checked = selectedSteps.has(step.id);
                return (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      i < totalSteps - 1 ? "border-b border-tv-border-divider" : ""
                    }`}
                    style={{ backgroundColor: checked ? undefined : TV.surface }}
                    onClick={() => toggleStep(step.id)}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleStep(step.id)}
                      color="tvPurple"
                      size="sm"
                      onClick={e => e.stopPropagation()}
                    />
                    {/* Step number badge */}
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[11px]"
                      style={{ backgroundColor: vis.bg, color: vis.color, fontWeight: 700 }}
                    >
                      {step.stepNumber}
                    </div>
                    {/* Icon + label */}
                    <div
                      className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0"
                      style={{ backgroundColor: vis.bg, color: vis.color }}
                    >
                      {vis.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Text fz={13} c={checked ? TV.textPrimary : TV.textSecondary} style={{ fontWeight: 500 }} truncate>
                        {step.label}
                      </Text>
                      {step.description && (
                        <Text fz={10} c={TV.textSecondary} truncate>{step.description}</Text>
                      )}
                    </div>
                    {/* Date chip if hard-coded */}
                    {step.hardCodedDate && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] shrink-0"
                        style={{ backgroundColor: TV.warningBg, color: TV.warning, fontWeight: 600, border: `1px solid ${TV.warningBorder}` }}
                      >
                        <CalendarDays size={10} />
                        {step.hardCodedDate}
                      </span>
                    )}
                  </div>
                );
              })}
            </Paper>
          </div>
        )}

        {/* ── Automation Rules section (multi-step only) ───────────────────── */}
        {hasSteps && (campaign.automationRules?.length ?? 0) > 0 && (
          <div>
            <Text fz={11} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={8} style={{ fontWeight: 600 }}>
              Automation Rules
            </Text>
            <Paper radius="md" withBorder style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
              {campaign.automationRules!.map((rule, i) => {
                const checked = selectedRules.has(rule.id);
                return (
                  <div
                    key={rule.id}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      i < totalRules - 1 ? "border-b border-tv-border-divider" : ""
                    }`}
                    style={{ backgroundColor: checked ? undefined : TV.surface }}
                    onClick={() => toggleRule(rule.id)}
                  >
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleRule(rule.id)}
                      color="tvPurple"
                      size="sm"
                      onClick={e => e.stopPropagation()}
                    />
                    <div
                      className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0"
                      style={{ backgroundColor: TV.brandTint, color: TV.brand }}
                    >
                      <Zap size={12} />
                    </div>
                    <Text fz={13} c={checked ? TV.textPrimary : TV.textSecondary} className="flex-1 min-w-0" style={{ fontWeight: 500 }}>
                      {rule.label}
                    </Text>
                  </div>
                );
              })}
            </Paper>
          </div>
        )}

        {/* ── Hard-coded date warnings ─────────────────────────────────────── */}
        {dateWarnings.length > 0 && (
          <Paper radius="md" p="sm" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
            <Row gap="xs" wrap="nowrap" align="flex-start">
              <TriangleAlert size={13} className="text-tv-warning shrink-0 mt-0.5" />
              <div>
                {dateWarnings.map(step => (
                  <Text key={step.id} fz={11} c={TV.warning} style={{ fontWeight: 500 }}>
                    Step {step.stepNumber} references &lsquo;{step.hardCodedDate}&rsquo; &mdash; update this date in the new campaign.
                  </Text>
                ))}
              </div>
            </Row>
          </Paper>
        )}

        {/* Inherit toggles */}
        <div>
          <Text fz={11} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={8} style={{ fontWeight: 600 }}>
            Optional — inherit from original
          </Text>
          <Text fz={11} c={TV.textSecondary} mb="sm">
            These settings will be duplicated by default. Toggle off any you'd like to reset in the new campaign.
          </Text>
          <Paper radius="md" withBorder style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
            {INHERIT_OPTIONS.map((opt, i) => (
              <div
                key={opt.key}
                className={`flex items-center gap-3 px-4 py-3 ${i < INHERIT_OPTIONS.length - 1 ? "border-b border-tv-border-divider" : ""}`}
                style={{ backgroundColor: inherit[opt.key] ? undefined : TV.surface }}
              >
                <div className="w-8 h-8 rounded-sm bg-tv-brand-tint flex items-center justify-center shrink-0">
                  {opt.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <Row gap={5} align="center" wrap="nowrap">
                    <Text fz={13} c={inherit[opt.key] ? TV.textPrimary : TV.textSecondary} style={{ fontWeight: 500 }}>
                      {opt.label}
                    </Text>
                  </Row>
                  <Text fz={10} c={TV.textSecondary}>{opt.description}</Text>
                </div>
                <Toggle enabled={inherit[opt.key]} onToggle={() => toggle(opt.key)} size="sm" />
              </div>
            ))}
          </Paper>
        </div>

        {/* ── Summary footer (multi-step) ────��─────────────────────────────── */}
        {hasSteps && (
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-sm"
            style={{ backgroundColor: TV.surface, border: `1px solid ${TV.borderLight}` }}
          >
            <Info size={13} style={{ color: TV.brand }} className="shrink-0" />
            <Text fz={12} c={TV.textPrimary} style={{ fontWeight: 600 }}>
              Copying {checkedSteps} of {totalSteps} step{totalSteps !== 1 ? "s" : ""}
              {totalRules > 0 && (
                <> with {checkedRules} automation rule{checkedRules !== 1 ? "s" : ""}</>
              )}
            </Text>
          </div>
        )}

        {/* Actions */}
        <Row justify="flex-end" gap="sm" mt="xs">
          <Button variant="default" onClick={onCancel}>Cancel</Button>
          <Button
            color="tvPurple"
            leftSection={<Copy size={13} />}
            onClick={() => onCopy(newName, inherit)}
            disabled={!newName.trim()}
          >
            Duplicate
          </Button>
        </Row>
      </Stack>
    </Modal>
  );
}

// Constituent-Specific Link Modal
function ConstituentLinkModal({ opened, constituents, search, onSearchChange, selectedId, onSelectId, copied, onCopy, onResetCopied, onClose }: {
  opened: boolean;
  constituents: Constituent[];
  search: string;
  onSearchChange: (s: string) => void;
  selectedId: number | null;
  onSelectId: (id: number | null) => void;
  copied: boolean;
  onCopy: (url: string, name: string) => void;
  onResetCopied: () => void;
  onClose: () => void;
}) {
  if (!opened) return null;

  const rlSearch = search.toLowerCase();
  const filteredConstituents = rlSearch
    ? constituents.filter(r => r.name.toLowerCase().includes(rlSearch) || r.email.toLowerCase().includes(rlSearch))
    : constituents;
  const selectedConstituent = selectedId != null ? constituents.find(r => r.id === selectedId) ?? null : null;
  const generatedUrl = selectedConstituent ? `https://thankview.com/v/abc123?r=${selectedConstituent.id}` : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
      <div className="bg-white rounded-xl border border-tv-border-light shadow-2xl w-full max-w-[480px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border-divider">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-tv-brand-tint flex items-center justify-center">
              <Users size={14} className="text-tv-brand" />
            </div>
            <div>
              <h2 className="text-[14px] text-tv-text-primary" style={{ fontWeight: 700 }}>Constituent-Specific Link</h2>
              <p className="text-[11px] text-tv-text-secondary">Generate a personalized viewing link</p>
            </div>
          </div>
          <TvTooltip label="Close">
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-7 h-7 rounded-full border border-tv-border-light flex items-center justify-center hover:bg-tv-surface transition-colors"
            >
              <X size={12} className="text-tv-text-secondary" />
            </button>
          </TvTooltip>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="text-[11px] text-tv-text-secondary block mb-1.5" style={{ fontWeight: 600 }}>Select constituent</label>
            <div className="relative h-[30px]">
              <Search size={13} className="absolute left-[9px] top-1/2 -translate-y-1/2 text-tv-text-secondary pointer-events-none" />
              <input
                value={search}
                onChange={e => { onSearchChange(e.target.value); onSelectId(null); onResetCopied(); }}
                placeholder="Search by name or email…"
                aria-label="Search constituents"
                className="w-full h-[30px] pl-[30px] pr-[30px] text-[12px] bg-white border border-tv-border-light rounded-full outline-none transition-colors placeholder:text-tv-text-decorative text-tv-text-primary focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand"
              />
              {search && (
                <button onClick={() => { onSearchChange(""); onSelectId(null); }} aria-label="Clear search" className="absolute right-[9px] top-1/2 -translate-y-1/2 p-0.5 text-tv-text-secondary hover:text-tv-text-primary transition-colors">
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="mt-1.5 border border-tv-border-light rounded-sm max-h-[160px] overflow-y-auto">
              {filteredConstituents.length === 0 ? (
                <div className="px-3 py-4 text-center text-[11px] text-tv-text-decorative">No constituents match your search</div>
              ) : (
                filteredConstituents.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { onSelectId(r.id); onResetCopied(); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-b border-tv-border-divider last:border-b-0 ${
                      selectedId === r.id ? "bg-tv-brand-tint/40" : "hover:bg-tv-surface"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      selectedId === r.id ? "bg-tv-brand-bg" : "bg-tv-surface"
                    }`}>
                      {selectedId === r.id
                        ? <Check size={9} className="text-white" />
                        : <Users size={9} className="text-tv-text-decorative" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] text-tv-text-primary block truncate" style={{ fontWeight: 500 }}>{r.name}</span>
                      <span className="text-[10px] text-tv-text-decorative block truncate">{r.email}</span>
                    </div>
                    {selectedId === r.id && <Check size={11} className="text-tv-brand shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </div>

          {selectedConstituent && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-tv-text-secondary block mb-1.5" style={{ fontWeight: 600 }}>
                  Generated link for {selectedConstituent.name}
                </label>
                <div className="flex items-center gap-2 p-2.5 bg-tv-surface rounded-sm border border-tv-border-light">
                  <code className="text-[11px] text-tv-text-primary flex-1 break-all" style={{ fontWeight: 500 }}>{generatedUrl}</code>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-3 bg-tv-warning-bg border border-tv-warning-border rounded-md">
                <TriangleAlert size={14} className="text-tv-warning shrink-0 mt-0.5" />
                <p className="text-[11px] text-tv-warning" style={{ fontWeight: 500 }}>
                  Views through this link count as opens/views for this constituent and may affect campaign analytics.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-tv-border-divider flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[12px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors"
            style={{ fontWeight: 500 }}
          >
            Cancel
          </button>
          <button
            disabled={!selectedConstituent}
            onClick={() => {
              if (!selectedConstituent) return;
              onCopy(generatedUrl, selectedConstituent.name);
            }}
            className={`flex items-center gap-1.5 px-4 py-2 text-[12px] rounded-full transition-colors ${
              selectedConstituent
                ? copied
                  ? "bg-tv-success text-white"
                  : "bg-tv-brand-bg text-white hover:bg-tv-brand-hover"
                : "bg-tv-surface text-tv-text-decorative cursor-not-allowed"
            }`}
            style={{ fontWeight: 600 }}
          >
            {copied ? (
              <><Check size={12} /> Copied!</>
            ) : (
              <><Copy size={12} /> Copy Link</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * MAIN COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════════ */

export function CampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<string | null>(() => {
    const t = searchParams.get("tab");
    return t && ["constituents", "setup", "videos", "data", "replies", "resend"].includes(t) ? t : "constituents";
  });
  const [showDelete, setShowDelete] = useState(false);
  const [showTestSend, setShowTestSend] = useState(false);
  const [showCopy, setShowCopy] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  // Resend state
  const [showResendModal, setShowResendModal] = useState(false);
  const [resendSubject, setResendSubject] = useState("");
  const [resendSearch, setResendSearch] = useState("");
  const [resendFilter, setResendFilter] = useState<"all" | "ready" | "sent24h" | "limit" | "clicked">("all");
  const [resendExcluded, setResendExcluded] = useState<Set<number>>(new Set());
  const [resendScheduleMode, setResendScheduleMode] = useState<"now" | "later">("now");
  const [resendScheduleDate, setResendScheduleDate] = useState("");
  const [resendScheduleTime, setResendScheduleTime] = useState("09:00");
  const [resendStep, setResendStep] = useState<"configure" | "confirm">("configure");
  const [resendSending, setResendSending] = useState(false);
  // Replies state
  const [repliesFilter, setRepliesFilter] = useState<"all" | "received" | "reviewed" | "approved" | "rejected">("all");
  // Status change modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<string | null>(null);
  const [showEditColumns, setShowEditColumns] = useState(false);
  const [activeConstCols, setActiveConstCols] = useState<string[]>(DEFAULT_CONSTITUENT_COLS);
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState<string>("All");
  const [recipientActionId, setRecipientActionId] = useState<number | null>(null);

  // Task assignment
  const [assignTaskRecipient, setAssignTaskRecipient] = useState<Constituent | null>(null);
  const [assignTaskUser, setAssignTaskUser] = useState("Kelley Molt");
  const PORTAL_USERS = ["Kelley Molt", "James Okafor", "Sarah Chen", "Alex Rivera", "Jordan Lee"];

  // Copy Link popover + Constituent Link modal
  const [copyLinkPopoverOpen, setCopyLinkPopoverOpen] = useState(false);
  const [copiedGenericInline, setCopiedGenericInline] = useState(false);
  const [constituentLinkModalOpen, setConstituentLinkModalOpen] = useState(false);
  const [constituentLinkSearch, setConstituentLinkSearch] = useState("");
  const [selectedConstituentId, setSelectedConstituentId] = useState<number | null>(null);
  const [copiedConstituentLink, setCopiedConstituentLink] = useState(false);
  const copyLinkRef = useRef<HTMLDivElement>(null);

  // Close copy-link popover on outside click
  useEffect(() => {
    if (!copyLinkPopoverOpen) return;
    const handler = (e: MouseEvent) => {
      if (copyLinkRef.current && !copyLinkRef.current.contains(e.target as Node)) {
        setCopyLinkPopoverOpen(false);
        setCopiedGenericInline(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [copyLinkPopoverOpen]);

  const campaign = MOCK_CAMPAIGNS[id ?? "1"];
  const [name, setName] = useState(campaign?.name ?? "");
  const [subject, setSubject] = useState(campaign?.subject ?? "");
  const effectiveStatus = campaignStatus ?? campaign?.status ?? "Draft";

  const isSent = effectiveStatus === "Sent" || effectiveStatus === "Archived";

  const handleEditCampaign = () => {
    navigate(`/campaigns/${id}/edit`);
  };

  const handleStatusChange = (newStatus: string) => {
    setCampaignStatus(newStatus);
    show(`Campaign status changed to ${newStatus}`, "success");
  };

  const handleDelete = () => { setShowDelete(false); show(`"${campaign.name}" deleted`, "success"); navigate("/campaigns"); };
  const handleCopyCampaign = (newName: string, inheritOptions: Record<string, boolean>) => {
    setShowCopy(false);
    const inheritedCount = Object.values(inheritOptions).filter(Boolean).length;
    show(`"${newName}" created as a draft (${inheritedCount} settings inherited)`, "success");
    navigate("/campaigns");
  };
  const handleTestSend = (constituentId: number) => {
    const constituent = campaign.constituents_list.find(r => r.id === constituentId);
    show(`Test sent to kelley.molt@hartwell.edu (as ${constituent?.name ?? "constituent"})`, "success");
    setShowTestSend(false);
  };
  const handleCopyLandingPageLink = () => {
    const link = `https://thankview.com/hartwell/c/${campaign.id}`;
    navigator.clipboard?.writeText(link).catch(() => {});
    setCopiedLink(true);
    show("Landing page link copied!", "success");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!campaign) {
    return (
      <Box style={{ minHeight: "100%" }} className="p-3 sm:p-5 flex flex-col items-center justify-center text-center py-20">
        <div className="w-16 h-16 bg-tv-brand-tint rounded-full flex items-center justify-center mb-4">
          <FileQuestion size={28} className="text-tv-text-decorative" />
        </div>
        <Title order={1} fz={22} mb="xs">Campaign not found</Title>
        <Text fz={13} c={TV.textSecondary} mb="lg" maw={360}>The campaign you're looking for doesn't exist or may have been deleted.</Text>
        <Button color="tvPurple" leftSection={<ChevronRight size={14} className="rotate-180" />} onClick={() => navigate("/campaigns")}>Back to Campaigns</Button>
      </Box>
    );
  }

  // Count stats for Data tab
  const constituentsWithVideo = campaign.constituents_list.filter(r => r.hasVideo).length;
  const deliveredCount = campaign.constituents_list.filter(r => r.delivery === "Delivered").length;
  const failedCount = campaign.constituents_list.filter(r => r.delivery === "Failed Send").length;
  const scheduledCount = campaign.constituents_list.filter(r => r.delivery === "Send Scheduled").length;
  const totalReplies = campaign.constituents_list.reduce((sum, r) => sum + r.replyContent.length, 0);

  return (
    <Box style={{ minHeight: "100%" }} className="p-3 sm:p-6">
      {/* Breadcrumb */}
      <Row gap={6} mb="md" className="text-[12px] text-tv-text-secondary">
        <UnstyledButton onClick={() => navigate("/campaigns")} style={{ fontSize: 12, fontWeight: 500, color: TV.textSecondary }} className="hover:text-tv-brand transition-colors">Campaigns</UnstyledButton>
        <ChevronRight size={13} />
        <Text fz={12} fw={600} c={TV.textPrimary} truncate className="max-w-[200px] sm:max-w-[300px]">{name}</Text>
      </Row>

      {/* Header */}
      <Row justify="space-between" mb="lg" gap="md" wrap="wrap" align="flex-start">
        <div className="flex-1 min-w-0">
          <Title order={1} fz={22} mb="xs" className="sm:text-[24px]">{name}</Title>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              title="Click to change status"
              className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] cursor-pointer transition-opacity hover:opacity-80"
              style={{ fontWeight: 600, ...(STATUS_BADGE_STYLES[effectiveStatus] ?? { backgroundColor: TV.surfaceMuted, color: TV.textSecondary }) }}
              onClick={() => setShowStatusModal(true)}
            >
              {effectiveStatus}
            </button>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px]" style={{ fontWeight: 600, backgroundColor: TV.surface, color: TV.textSecondary, borderWidth: 1, borderStyle: "solid", borderColor: TV.borderLight }}>
              {campaign.type}
            </span>
            <div className="flex items-center gap-1">
              {campaign.channel === "Email" ? <Mail size={12} className="text-tv-brand" /> : campaign.channel === "SMS" ? <MessageSquare size={12} className="text-tv-info" /> : <Link2 size={12} className="text-tv-brand" />}
              <Text fz={12} c={TV.textSecondary}>{campaign.channel}</Text>
            </div>
            {campaign.sendDate !== "\u2014" && (
              <div className="flex items-center gap-1">
                <Clock size={12} className="text-tv-text-secondary" />
                <Text fz={12} c={TV.textSecondary}>{campaign.sendDate}</Text>
              </div>
            )}
            {campaign.sendDates.length > 1 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-tv-brand-tint text-tv-brand" style={{ fontWeight: 600 }}>{campaign.sendDates.length} sends</span>
            )}
          </div>
          {/* Migration metadata: visibility + auto-assigned tag */}
          <Row gap="xs" mt={6} wrap="wrap">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 600, backgroundColor: TV.successBg, color: TV.success, borderWidth: 1, borderStyle: "solid", borderColor: TV.successBorder }}>
              <Lock size={8} /> Visible to all users
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]" style={{ fontWeight: 600, backgroundColor: TV.brandTint, color: TV.brand, borderWidth: 1, borderStyle: "solid", borderColor: TV.borderLight }}>
              <Tag size={8} /> {campaign.type}
            </span>
          </Row>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                <Button
                  variant="light"
                  color="tvPurple"
                  size="xs"
                  radius="xl"
                  leftSection={<PenLine size={13} />}
                  onClick={handleEditCampaign}
                  styles={{ root: { fontWeight: 600, fontSize: 12, height: 28, paddingLeft: 12, paddingRight: 14 } }}
                >
                  Edit Campaign
                </Button>
                <TvTooltip label="Send Test">
                  <button aria-label="Send Test" onClick={() => setShowTestSend(true)} className="w-7 h-7 rounded-full border border-tv-border-strong bg-tv-brand-tint flex items-center justify-center text-tv-brand hover:bg-tv-surface-hover transition-colors">
                    <Send size={13} />
                  </button>
                </TvTooltip>
                <TvTooltip label={copiedLink ? "Copied!" : "Copy Landing Page Link"}>
                  <button aria-label="Copy Landing Page Link" onClick={handleCopyLandingPageLink} className="hidden sm:flex w-7 h-7 rounded-full border border-tv-border-light items-center justify-center text-tv-text-secondary hover:border-tv-brand-bg hover:text-tv-brand hover:bg-tv-brand-tint transition-colors">
                    {copiedLink ? <CircleCheckBig size={13} className="text-tv-success" /> : <Link2 size={13} />}
                  </button>
                </TvTooltip>
                <TvTooltip label="Duplicate Campaign">
                  <button aria-label="Duplicate Campaign" onClick={() => setShowCopy(true)} className="hidden sm:flex w-7 h-7 rounded-full border border-tv-border-light items-center justify-center text-tv-text-secondary hover:border-tv-brand-bg hover:text-tv-brand hover:bg-tv-brand-tint transition-colors">
                    <Copy size={13} />
                  </button>
                </TvTooltip>
              {/* Copy Link popover trigger */}
              <div ref={copyLinkRef} className="relative">
                  <button
                    title="Copy Link"
                    onClick={() => setCopyLinkPopoverOpen(prev => !prev)}
                    className={`hidden sm:flex w-7 h-7 rounded-full border items-center justify-center transition-colors ${
                      copyLinkPopoverOpen
                        ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand"
                        : "border-tv-border-light text-tv-text-secondary hover:border-tv-brand-bg hover:text-tv-brand hover:bg-tv-brand-tint"
                    }`}
                  >
                    <Link2 size={13} />
                  </button>

                {/* Popover */}
                {copyLinkPopoverOpen && (
                  <div className="absolute z-50 top-full right-0 mt-2 w-[260px] bg-white border border-tv-border-light rounded-md shadow-lg overflow-hidden">
                    {/* Row 1: Campaign Link (generic) */}
                    <button
                      onClick={() => {
                        const url = `https://thankview.com/hartwell/v/${campaign.id}`;
                        navigator.clipboard?.writeText(url).catch(() => {});
                        setCopiedGenericInline(true);
                        setTimeout(() => setCopiedGenericInline(false), 2000);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-tv-surface transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-sm bg-tv-surface flex items-center justify-center shrink-0">
                        <Link2 size={13} className="text-tv-text-secondary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] text-tv-text-primary block" style={{ fontWeight: 600 }}>Campaign Link (generic)</span>
                        <span className="text-[10px] text-tv-text-decorative">Anyone can view</span>
                      </div>
                      {copiedGenericInline ? (
                        <span className="flex items-center gap-1 text-[10px] text-tv-success shrink-0" style={{ fontWeight: 600 }}>
                          <Check size={10} /> Copied!
                        </span>
                      ) : (
                        <Copy size={12} className="text-tv-text-decorative shrink-0" />
                      )}
                    </button>

                    <div className="border-t border-tv-border-divider" />

                    {/* Row 2: Constituent-Specific Link */}
                    <button
                      onClick={() => {
                        setCopyLinkPopoverOpen(false);
                        setCopiedGenericInline(false);
                        setConstituentLinkSearch("");
                        setSelectedConstituentId(null);
                        setCopiedConstituentLink(false);
                        setConstituentLinkModalOpen(true);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-tv-surface transition-colors text-left"
                    >
                      <div className="w-7 h-7 rounded-sm bg-tv-brand-tint flex items-center justify-center shrink-0">
                        <Users size={13} className="text-tv-brand" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[12px] text-tv-text-primary block" style={{ fontWeight: 600 }}>Constituent-Specific Link</span>
                        <span className="text-[10px] text-tv-text-decorative">Tracks views for a constituent</span>
                      </div>
                      <ChevronRight size={12} className="text-tv-text-decorative shrink-0" />
                    </button>
                  </div>
                )}
              </div>
              <TvTooltip label="Delete Campaign">
                <button aria-label="Delete campaign" onClick={() => setShowDelete(true)} className="w-7 h-7 rounded-full border border-tv-danger-border flex items-center justify-center text-tv-danger hover:bg-tv-danger-bg transition-colors">
                  <Trash2 size={13} />
                </button>
              </TvTooltip>
        </div>
      </Row>

      {/* ── Campaign Flow Map (multi-step campaigns only) ── */}
      {(campaign.flowSteps?.length ?? 0) > 1 && (
        <CampaignFlowMap
          steps={campaign.flowSteps!}
          rules={campaign.automationRules ?? []}
        />
      )}


      {/* ── Tabs ── */}
      {(<div className="mb-6">
        <div className="flex gap-0 border-b border-tv-border-divider">
          {[
            { value: "constituents", label: "Constituents" },
            { value: "setup", label: "Setup" },
            { value: "videos", label: "Videos" },
            ...(campaign.isVideoRequest ? [{ value: "replies", label: `Replies (${campaign.vrSubmissionsReceived || 0})` }] : []),
            { value: "data", label: "Data" },
            ...(campaign.resendHistory && campaign.resendHistory.length > 0 ? [{ value: "resend", label: "Resend" }] : []),
          ].map(tab => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2.5 text-[13px] border-b-2 transition-colors capitalize ${
                activeTab === tab.value
                  ? "border-tv-brand text-tv-brand"
                  : "border-transparent text-tv-text-secondary hover:text-tv-text-primary hover:border-tv-border-light"
              }`}
              style={{ fontWeight: 600 }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>)}

      {/* ════════════════════════════════════════════════════════════════════════
       * TAB: CONSTITUENTS
       * ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "constituents" && (
        <div>
          {/* Status filter pills */}
          <div className="flex items-center gap-2 mb-3">
            {(() => {
              const statuses = ["All", "Delivered", "Sending", "Scheduled", "Failed Send", "Recorded"];
              const counts: Record<string, number> = {};
              campaign.constituents_list.forEach((r: any) => {
                counts[r.delivery] = (counts[r.delivery] || 0) + 1;
              });
              return statuses.map(s => {
                const count = s === "All" ? campaign.constituents_list.length : (counts[s] || 0);
                const active = deliveryStatusFilter === s;
                return (
                  <button key={s} onClick={() => setDeliveryStatusFilter(s)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] transition-colors ${active ? "border-tv-brand bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`}
                    style={{ fontWeight: active ? 600 : 500 }}>
                    {s} <span className="text-[10px] opacity-70">{count}</span>
                  </button>
                );
              });
            })()}
            <div className="ml-auto">
              <ColumnsButton onClick={() => setShowEditColumns(true)} />
            </div>
          </div>
          <Paper radius="xl" withBorder style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
            {campaign.constituents_list.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center px-4">
                <div className="w-14 h-14 bg-tv-brand-tint rounded-full flex items-center justify-center mb-3">
                  <Users size={22} className="text-tv-text-decorative" />
                </div>
                <Text fz={14} fw={600} c={TV.textPrimary} mb={4}>No constituents yet</Text>
                <Text fz={12} c={TV.textSecondary} maw={320}>
                  {effectiveStatus === "Draft" ? "Add constituents to this campaign by importing a list or selecting from your records." : "No constituents have been added to this campaign."}
                </Text>
              </div>
            ) : (
              <>
                {/* Desktop table header */}
                <div className="overflow-x-auto" role="region" aria-label="Campaign constituents table" tabIndex={0}>
                  <div className="min-w-[600px]">
                <div className="hidden sm:grid gap-4 px-5 py-3 bg-tv-surface-muted border-b border-tv-border-divider text-[10px] text-tv-text-secondary uppercase tracking-wider [&>span]:whitespace-nowrap" style={{ fontWeight: 600, gridTemplateColumns: activeConstCols.map(k => ({ name: "2fr", email: "2fr", video: "0.8fr", status: "1.2fr", opened: "0.8fr", lastSent: "1.4fr", replies: "1fr", actions: "0.8fr" }[k] || "1fr")).join(" ") }}>
                  {activeConstCols.map(k => {
                    const col = CONSTITUENT_COLUMNS.find(c => c.key === k);
                    return col ? <span key={k}>{col.label}</span> : null;
                  })}
                </div>
                {campaign.constituents_list.filter((r: any) => deliveryStatusFilter === "All" || r.delivery === deliveryStatusFilter).map((r) => (
                  <div key={r.id} className="border-b border-tv-border-divider last:border-b-0 hover:bg-tv-surface-muted transition-colors">
                    {/* Desktop */}
                    <div className="hidden sm:grid gap-4 px-5 py-4 items-center" style={{ gridTemplateColumns: activeConstCols.map(k => ({ name: "2fr", email: "2fr", video: "0.8fr", status: "1.2fr", opened: "0.8fr", lastSent: "1.4fr", replies: "1fr", actions: "0.8fr" }[k] || "1fr")).join(" ") }}>
                      {activeConstCols.map(k => {
                        switch (k) {
                          case "name": return <span key={k} className="text-[13px] text-tv-text-primary" style={{ fontWeight: 600 }}>{r.name}</span>;
                          case "email": return <span key={k} className="text-[12px] text-tv-text-secondary truncate">{r.email}</span>;
                          case "video": return <div key={k}>{r.hasVideo ? <CircleCheckBig size={15} className="text-tv-success" /> : <CircleAlert size={15} className="text-tv-text-decorative" />}</div>;
                          case "status": return <div key={k}><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] whitespace-nowrap w-fit ${DELIVERY_STATUS_BG[r.delivery] ?? "bg-tv-surface text-tv-text-secondary"}`} style={{ fontWeight: 600 }}>{r.delivery}</span></div>;
                          case "opened": return <div key={k}>{r.sendHistory?.some((h: any) => h.opened) ? <Check size={14} className="text-tv-success" /> : <X size={14} className="text-tv-text-decorative" />}</div>;
                          case "lastSent": return <span key={k} className="text-[11px] text-tv-text-secondary">{r.sendHistory?.[r.sendHistory.length - 1]?.date || "—"}</span>;
                          case "replies": return <span key={k} className="text-[12px] text-tv-text-secondary">{r.replies}</span>;
                          case "actions": return (
                            <div key={k} className="relative">
                              <button onClick={e => { e.stopPropagation(); setRecipientActionId(recipientActionId === r.id ? null : r.id); }}
                                className="w-7 h-7 rounded-full border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface transition-colors">
                                <ChevronDown size={11} />
                              </button>
                              {recipientActionId === r.id && (
                                <div className="absolute right-0 top-full mt-1 w-[180px] bg-white border border-tv-border-light rounded-lg shadow-lg z-20 py-1">
                                  {[
                                    { label: "Preview Video", icon: Play },
                                    { label: "Send Test", icon: Send },
                                    { label: "Resend", icon: RefreshCw },
                                    { label: "Copy Direct Link", icon: Link2 },
                                    { label: "Copy Generic Link", icon: Copy },
                                    { label: "Assign Video Task", icon: UserPlus },
                                    { label: "Unassign Video Task", icon: X },
                                  ].map(a => (
                                    <button key={a.label} onClick={() => {
                                      if (a.label === "Assign Video Task") {
                                        setAssignTaskRecipient(r);
                                        setRecipientActionId(null);
                                      } else if (a.label === "Unassign Video Task") {
                                        show(`Video task unassigned for ${r.name}`, "info");
                                        setRecipientActionId(null);
                                      } else {
                                        show(`${a.label} for ${r.name}`, "info");
                                        setRecipientActionId(null);
                                      }
                                    }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-tv-text-primary hover:bg-tv-surface transition-colors text-left">
                                      <a.icon size={12} className="text-tv-text-secondary" />{a.label}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                          default: return null;
                        }
                      })}
                    </div>
                    {/* Mobile */}
                    <div className="sm:hidden flex items-center gap-3 px-4 py-3.5">
                      <div className="w-8 h-8 bg-tv-brand-tint rounded-full flex items-center justify-center text-tv-brand text-[10px] shrink-0" style={{ fontWeight: 700 }}>
                        {r.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{r.name}</p>
                        <p className="text-[11px] text-tv-text-secondary truncate">{r.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {r.hasVideo && <CircleCheckBig size={12} className="text-tv-success" />}
                          <span className={`text-[9px] px-2 py-0.5 rounded-full ${DELIVERY_STATUS_BG[deriveStatus(r)] ?? "bg-tv-surface text-tv-text-secondary"}`} style={{ fontWeight: 600 }}>{deriveStatus(r)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-tv-border-divider">
                  <Text fz={12} c={TV.textSecondary}>Showing {campaign.constituents_list.length} of {campaign.constituents} total constituents</Text>
                </div>
              </>
            )}
          </Paper>
        </div>
      )}

      {/* ═══════════��════════════════════════════════════════════════════════════
       * TAB: SETUP (Message, Envelope, Landing Page, Merge Fields)
       * ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "setup" && (
        <Stack gap="md">
          {/* Message Setup */}
          <Paper radius="xl" withBorder style={{ borderColor: TV.borderLight }} className="p-4 sm:p-5">
            <Row gap="xs" mb="md">
              <Mail size={16} className="text-tv-brand" />
              <Title order={2} fz={16}>Message Setup</Title>
            </Row>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              {[
                { label: "Subject Line", value: subject },
                { label: "Sender Name", value: campaign.senderName },
                { label: "Sender Email", value: campaign.senderEmail },
                { label: "Reply-To", value: campaign.replyTo },
              ].map(f => (
                <div key={f.label}>
                  <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>{f.label}</Text>
                  <div className="bg-tv-surface rounded-md px-3 py-2">
                    <Text fz={13} c={TV.textPrimary}><MergeHighlight text={f.value} /></Text>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Message Body</Text>
              <div className="bg-tv-surface rounded-lg p-4" style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                <Text fz={13} c={TV.textSecondary} component="div"><MergeHighlight text={campaign.bodyPreview} /></Text>
              </div>
            </div>

            {/* Merge Fields Used */}
            {campaign.mergeFieldsInMessage.length > 0 && (
              <div className="mt-4">
                <Text fz={10} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Merge Fields in Message</Text>
                <Row gap={6}>
                  {campaign.mergeFieldsInMessage.map(f => (
                    <Pill key={f} color="tvPurple" size="sm" style={{ fontFamily: "monospace" }}>{f}</Pill>
                  ))}
                </Row>
              </div>
            )}
          </Paper>

          {/* Envelope Setup */}
          {campaign.envelope && (
            <Paper radius="xl" withBorder style={{ borderColor: TV.borderLight }} className="p-4 sm:p-5">
              <Row gap="xs" mb="md">
                <Palette size={16} className="text-tv-brand" />
                <Title order={2} fz={16}>Envelope Setup</Title>
              </Row>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Color preview */}
                <div>
                  <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Envelope Color</Text>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-7 rounded-sm border border-tv-border-light" style={{ backgroundColor: campaign.envelope.color }} />
                    <Text fz={13} c={TV.textPrimary}>{campaign.envelope.colorName}</Text>
                  </div>
                </div>
                <div>
                  <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Logo</Text>
                  <Text fz={13} c={TV.textPrimary}>{campaign.envelope.logo ? `Yes \u2014 ${campaign.envelope.logoPosition}` : "None"}</Text>
                </div>
                <div className="sm:col-span-1">
                  <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Return Address</Text>
                  <Text fz={12} c={TV.textSecondary} style={{ lineHeight: 1.5 }}>{campaign.envelope.returnAddress}</Text>
                </div>
              </div>

              {/* Envelope mini preview */}
              <div className="mt-4 flex justify-center">
                <div className="w-[240px] h-[140px] rounded-lg relative overflow-hidden border border-tv-border-light" style={{ backgroundColor: campaign.envelope.color }}>
                  <div className="absolute top-3 left-3 w-6 h-6 bg-white/30 rounded-[4px]" />
                  <div className="absolute bottom-4 left-4 right-4 space-y-1.5">
                    <div className="h-1.5 bg-white/30 rounded-full w-3/4" />
                    <div className="h-1.5 bg-white/30 rounded-full w-1/2" />
                  </div>
                  <div className="absolute top-3 right-3 w-5 h-5 bg-white/20 rounded border border-white/30" />
                </div>
              </div>
            </Paper>
          )}

          {/* Landing Page Setup */}
          <Paper radius="xl" withBorder style={{ borderColor: TV.borderLight }} className="p-4 sm:p-5">
            <Row gap="xs" mb="md">
              <ExternalLink size={16} className="text-tv-brand" />
              <Title order={2} fz={16}>Landing Page Setup</Title>
            </Row>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Headline</Text>
                <div className="bg-tv-surface rounded-md px-3 py-2">
                  <Text fz={13} c={TV.textPrimary} fw={600}><MergeHighlight text={campaign.landingPage.headline} /></Text>
                </div>
              </div>
              <div>
                <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>CTA Button</Text>
                <div className="bg-tv-surface rounded-md px-3 py-2">
                  <Text fz={13} c={TV.textBrand} fw={600}>{campaign.landingPage.ctaLabel}</Text>
                  <Text fz={10} c={TV.textSecondary} ff="monospace" truncate>{campaign.landingPage.ctaUrl}</Text>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Body Content</Text>
              <div className="bg-tv-surface rounded-lg p-4" style={{ lineHeight: 1.6 }}>
                <Text fz={13} c={TV.textSecondary} component="div"><MergeHighlight text={campaign.landingPage.bodyHtml} /></Text>
              </div>
            </div>

            {campaign.landingPage.mergeFields.length > 0 && (
              <div className="mb-4">
                <Text fz={10} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Merge Fields on Landing Page</Text>
                <Row gap={6}>
                  {campaign.landingPage.mergeFields.map(f => (
                    <Pill key={f} color="tvPurple" size="sm" style={{ fontFamily: "monospace" }}>{f}</Pill>
                  ))}
                </Row>
              </div>
            )}

            {/* Landing page link */}
            <Paper radius="md" p="sm" withBorder style={{ borderColor: TV.borderLight, backgroundColor: TV.surface }}>
              <Row gap="sm" wrap="nowrap">
                <Link2 size={14} className="text-tv-brand shrink-0" />
                <div className="flex-1 min-w-0">
                  <Text fz={12} ff="monospace" c={TV.textSecondary} truncate>https://thankview.com/hartwell/c/{campaign.id}</Text>
                </div>
                <Button variant="default" size="xs" radius="xl"
                  leftSection={copiedLink ? <CircleCheckBig size={11} className="text-tv-success" /> : <Link2 size={11} />}
                  onClick={handleCopyLandingPageLink}
                  styles={{ root: { borderColor: TV.borderLight, color: TV.textSecondary } }}>
                  {copiedLink ? "Copied" : "Copy"}
                </Button>
              </Row>
            </Paper>
            <Row gap={4} mt="xs">
              <TriangleAlert size={10} className="text-tv-warning" />
              <Text fz={10} c={TV.textSecondary}>Viewing a constituent-specific link will impact their analytics (it will appear as if they viewed it).</Text>
            </Row>
          </Paper>
        </Stack>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
       * TAB: VIDEOS (Intro, Personal, Add-on 1 & 2, Outro)
       * ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "videos" && (
        <Stack gap="md">
          {/* Video Pipeline */}
          <Paper radius="xl" withBorder style={{ borderColor: TV.borderLight }} className="p-4 sm:p-5">
            <Row gap="xs" mb="md">
              <Video size={16} className="text-tv-brand" />
              <Title order={2} fz={16}>Video Pipeline</Title>
            </Row>
            <Text fz={12} c={TV.textSecondary} mb="md">
              Videos play in this order: Intro {"\u2192"} Personal Video {"\u2192"} Add-On 1 {"\u2192"} Add-On 2 {"\u2192"} Outro
            </Text>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {campaign.videoSlots.map(v => (
                <div key={v.type} className="flex-1">
                  <div className={`h-24 rounded-lg bg-gradient-to-br ${v.thumbnailGradient} flex items-center justify-center mb-2 relative overflow-hidden`}>
                    {v.set ? (
                      <Play size={18} className="text-white/80" fill="white" />
                    ) : (
                      <div className="w-8 h-8 border-2 border-white/40 rounded-full flex items-center justify-center text-white/40 text-lg">+</div>
                    )}
                    {v.type === "personal" && (
                      <Pill size="xs" variant="filled" color="tvPurple" className="absolute top-2 right-2" style={{ fontSize: 8 }}>
                        {constituentsWithVideo}/{campaign.constituents_list.length}
                      </Pill>
                    )}
                  </div>
                  <Text fz={12} fw={600} c={TV.textLabel} ta="center">{v.label}</Text>
                  <Text fz={10} ta="center" c={TV.textSecondary}>{v.set ? "Added" : "Not set"}</Text>
                  {v.description && <Text fz={9} ta="center" c={TV.borderStrong} mt={2}>{v.description}</Text>}
                </div>
              ))}
            </div>
          </Paper>

          {/* Per-constituent personal video status */}
          {campaign.constituents_list.length > 0 && (
            <Paper radius="xl" withBorder style={{ borderColor: TV.borderLight }} className="p-4 sm:p-5">
              <Row gap="xs" mb="md">
                <Users size={16} className="text-tv-brand" />
                <Title order={2} fz={16}>Personal Videos by Constituent</Title>
                <Pill color="tvPurple" size="sm" style={{ marginLeft: "auto" }}>
                  {constituentsWithVideo} of {campaign.constituents_list.length} recorded
                </Pill>
              </Row>
              <div className="space-y-1">
                {campaign.constituents_list.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-tv-surface-muted transition-colors">
                    <div className="w-7 h-7 bg-tv-brand-tint rounded-full flex items-center justify-center text-tv-brand text-[9px] shrink-0" style={{ fontWeight: 700 }}>
                      {r.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <Text fz={13} fw={500} c={TV.textPrimary} className="flex-1">{r.name}</Text>
                    {r.hasVideo ? (
                      <Row gap={4}>
                        <CircleCheckBig size={13} className="text-tv-success" />
                        <Text fz={11} c={TV.success} fw={500}>Video recorded</Text>
                      </Row>
                    ) : (
                      <Row gap={4}>
                        <CircleAlert size={13} className="text-tv-text-decorative" />
                        <Text fz={11} c={TV.textSecondary}>No video</Text>
                      </Row>
                    )}
                  </div>
                ))}
              </div>
            </Paper>
          )}


        </Stack>
      )}

      {/* ════════════���═══════════════════════════════════════════════════════════
       * TAB: DATA (Campaign analytics, delivery drill-down, replies)
       * ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "data" && (
        <Stack gap="md">
          {/* Stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {[
              { label: "Videos Recorded", value: constituentsWithVideo, icon: Play, color: "text-tv-brand", bg: "bg-tv-brand-tint" },
              { label: "Video Views",     value: campaign.videoViews, icon: Eye, color: "text-tv-brand", bg: "bg-tv-brand-tint" },
              { label: "Delivered",       value: deliveredCount,      icon: CircleCheckBig, color: "text-tv-success", bg: "bg-tv-success-bg" },
              { label: "Failed",          value: failedCount,         icon: CircleAlert, color: "text-tv-danger", bg: "bg-tv-danger-bg" },
              { label: "Scheduled",       value: scheduledCount,      icon: Clock, color: "text-tv-info", bg: "bg-tv-info-bg" },
              { label: "Replies",         value: totalReplies,        icon: Reply, color: "text-tv-warning", bg: "bg-tv-warning-bg" },
              { label: "Open Rate",       value: campaign.openRate,   icon: Eye, color: "text-tv-success", bg: "bg-tv-success-bg" },
              { label: "Click Rate",      value: campaign.clickRate,  icon: BarChart3, color: "text-tv-info", bg: "bg-tv-info-bg" },
            ].map(s => (
              <Paper key={s.label} radius="xl" withBorder p="md" style={{ borderColor: TV.borderLight }} className="flex flex-col items-center text-center gap-2">
                <div className={`w-10 h-10 ${s.bg} rounded-md flex items-center justify-center shrink-0`}><s.icon size={16} className={s.color} /></div>
                <Text fz={9} fw={600} c={TV.textLabel} tt="uppercase" lts="0.05em">{s.label}</Text>
                <Text fz={20} fw={900} c={TV.textPrimary} ff="Fraunces, Roboto, sans-serif">{s.value}</Text>
              </Paper>
            ))}
          </div>

          {/* Delivery Health Summary */}
          {(effectiveStatus === "Sent" || effectiveStatus === "Archived") && (
            <Paper radius="xl" withBorder p="lg" style={{ borderColor: TV.borderLight }}>
              <Row gap="xs" mb="sm">
                <TriangleAlert size={16} className="text-tv-warning" />
                <Title order={2} fz={16}>Delivery Health</Title>
              </Row>
              <div className="grid grid-cols-4 gap-3">
                <div className="p-3 bg-tv-surface-muted rounded-md text-center">
                  <Text fz={20} fw={900} c={TV.textPrimary} ff="Fraunces, Roboto, sans-serif">{campaign.constituents}</Text>
                  <Text fz={10} c={TV.textSecondary}>Total Sent</Text>
                </div>
                <div className="p-3 bg-tv-success-bg rounded-md text-center">
                  <Text fz={20} fw={900} c={TV.success} ff="Fraunces, Roboto, sans-serif">{deliveredCount}</Text>
                  <Text fz={10} c={TV.textSecondary}>Delivered</Text>
                </div>
                <div className="p-3 bg-tv-danger-bg rounded-md text-center">
                  <Text fz={20} fw={900} c={TV.danger} ff="Fraunces, Roboto, sans-serif">{campaign.bounceRate}</Text>
                  <Text fz={10} c={TV.textSecondary}>Bounce Rate</Text>
                </div>
                <div className="p-3 bg-tv-warning-bg rounded-md text-center">
                  <Text fz={20} fw={900} c={TV.warning} ff="Fraunces, Roboto, sans-serif">{campaign.spamRate}</Text>
                  <Text fz={10} c={TV.textSecondary}>Spam Rate</Text>
                </div>
              </div>
              {failedCount > 0 && (
                <div className="mt-3 p-2.5 bg-tv-danger-bg border border-tv-danger-border rounded-md flex items-start gap-2">
                  <TriangleAlert size={12} className="text-tv-danger shrink-0 mt-0.5" />
                  <Text fz={11} c={TV.danger}>
                    {failedCount} constituent{failedCount !== 1 ? "s" : ""} failed to receive this campaign. Check the constituent table below for per-address error details.
                  </Text>
                </div>
              )}
            </Paper>
          )}

          {/* Send Dates */}
          {campaign.sendDates.length > 0 && (
            <Paper radius="xl" withBorder p="lg" style={{ borderColor: TV.borderLight }}>
              <Row gap="xs" mb="sm">
                <CalendarDays size={16} className="text-tv-brand" />
                <Title order={2} fz={16}>Send Dates</Title>
              </Row>
              <Row gap="sm">
                {campaign.sendDates.map((d, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] bg-tv-brand-tint text-tv-brand" style={{ fontWeight: 600 }}>
                    <Clock size={10} /> {d}
                  </span>
                ))}
              </Row>
              <Text fz={10} c={TV.textSecondary} mt="xs">
                {campaign.sendDates.length === 1 ? "This campaign was sent on a single date." : `This campaign was sent across ${campaign.sendDates.length} dates.`}
              </Text>
            </Paper>
          )}

          {/* Per-constituent data with expandable rows */}
          <Paper radius="xl" withBorder style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
            <div className="px-5 py-3 border-b border-tv-border-divider bg-tv-surface-muted">
              <Row justify="space-between">
                <Title order={2} fz={16}>Constituent-Level Data</Title>
                <Text fz={11} c={TV.textSecondary}>Click a row to see send history & replies</Text>
              </Row>
            </div>

            {campaign.constituents_list.length === 0 ? (
              <div className="py-14 text-center">
                <Text fz={13} c={TV.textSecondary}>No constituent data available for this campaign.</Text>
              </div>
            ) : (
              <>
                {/* Desktop header */}
                <div className="overflow-x-auto" role="region" aria-label="Per-constituent data table" tabIndex={0}>
                  <div className="min-w-[700px]">
                    <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1fr_1.5fr_1.2fr_1fr_0.5fr] gap-3 px-5 py-2.5 bg-tv-surface-muted border-b border-tv-border-divider text-[10px] text-tv-text-secondary uppercase tracking-wider [&>span]:whitespace-nowrap" style={{ fontWeight: 600 }}>
                      <span>Name</span><span>Email / Phone</span><span>Video</span><span>Delivery</span><span>Replies</span><span>Sends</span><span></span>
                    </div>
                    {campaign.constituents_list.map(r => (
                      <ConstituentDataRow key={r.id} r={r} isSent={isSent} />
                    ))}
                  </div>
                </div>
                <div className="px-5 py-3 border-t border-tv-border-divider">
                  <Text fz={12} c={TV.textSecondary}>Showing {campaign.constituents_list.length} of {campaign.constituents} total constituents</Text>
                </div>
              </>
            )}
          </Paper>

          {/* Quick link to full analytics */}
          <Paper radius="xl" withBorder p="lg" style={{ borderColor: TV.borderLight }}>
            <Row justify="space-between">
              <Row gap="xs">
                <ChartColumn size={16} className="text-tv-brand" />
                <Title order={2} fz={16}>Full Analytics</Title>
              </Row>
              <UnstyledButton onClick={() => navigate(`/analytics?tab=performance&campaign=${encodeURIComponent(campaign.name)}`)} className="flex items-center gap-1 hover:underline" style={{ color: TV.textBrand, fontSize: 13, fontWeight: 500 }}>
                <ChartColumn size={13} />Open in ThankView Metrics
              </UnstyledButton>
            </Row>
            <Text fz={13} c={TV.textSecondary} mt="xs">Detailed view rate, reply rate, CTA click data, geographic breakdown, and per-send analytics are available in the ThankView Metrics section.</Text>
          </Paper>
        </Stack>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
       * TAB: REPLIES (VR campaigns only)
       * ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "replies" && campaign.isVideoRequest && (
        <Stack gap="md">
          {/* VR Summary cards */}
          <Row gap="md">
            <Paper radius="xl" withBorder p="md" style={{ borderColor: TV.borderLight, flex: 1 }}>
              <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" mb={4}>Submissions Received</Text>
              <Text fz={28} fw={900} c={TV.textBrand}>{campaign.vrSubmissionsReceived || 0}</Text>
              <Text fz={11} c={TV.textSecondary}>of {campaign.vrSubmissionsTotal || 0} recorders</Text>
            </Paper>
            <Paper radius="xl" withBorder p="md" style={{ borderColor: TV.borderLight, flex: 1 }}>
              <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" mb={4}>Due Date</Text>
              <Text fz={28} fw={900} c={TV.textPrimary}>{campaign.vrDueDate || "\u2014"}</Text>
              <Text fz={11} c={TV.textSecondary}>Recording deadline</Text>
            </Paper>
            <Paper radius="xl" withBorder p="md" style={{ borderColor: TV.borderLight, flex: 1 }}>
              <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" mb={4}>Shareable Link</Text>
              <Row gap={4}>
                <Text fz={11} c={TV.textBrand} truncate style={{ maxWidth: 180 }}>{campaign.vrShareableUrl}</Text>
                <UnstyledButton onClick={() => { navigator.clipboard?.writeText(campaign.vrShareableUrl || ""); show("Shareable link copied!", "success"); }}
                  style={{ color: TV.textBrand }}><Copy size={12} /></UnstyledButton>
              </Row>
            </Paper>
          </Row>

          {/* Filter pills */}
          <Row gap="xs">
            {(["all", "received", "reviewed", "approved", "rejected"] as const).map(f => (
              <UnstyledButton key={f} onClick={() => setRepliesFilter(f)}
                className={`px-4 py-2 rounded-full text-[14px] capitalize transition-colors ${repliesFilter === f ? "bg-tv-brand-bg text-white" : "bg-tv-brand-tint text-tv-brand hover:bg-tv-surface-hover"}`}
                style={{ fontWeight: 600 }}>
                {f === "all" ? "All Submissions" : f}
              </UnstyledButton>
            ))}
          </Row>

          {/* Submissions table */}
          <Paper radius="xl" withBorder style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
            <table className="w-full text-left" aria-label="Video request submissions">
              <thead>
                <tr className="border-b border-tv-border-divider bg-tv-surface/40">
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Recorder</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Video</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Submitted</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Duration</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Status</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(campaign.vrSubmissions || [])
                  .filter(s => repliesFilter === "all" || s.status === repliesFilter)
                  .map(sub => (
                  <tr key={sub.id} className="border-b border-tv-border-divider last:border-b-0 hover:bg-tv-surface/30">
                    <td className="px-4 py-3">
                      <Text fz={13} fw={500} c={TV.textPrimary}>{sub.recorderName}</Text>
                      <Text fz={11} c={TV.textSecondary}>{sub.recorderEmail}</Text>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-16 h-12 rounded-sm flex items-center justify-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${sub.thumbnailColor}, ${sub.thumbnailColor}88)` }}>
                        <Play size={14} className="text-white" fill="white" />
                      </div>
                    </td>
                    <td className="px-4 py-3"><Text fz={12} c={TV.textSecondary}>{sub.submittedDate}</Text></td>
                    <td className="px-4 py-3"><Text fz={12} c={TV.textSecondary}>{sub.duration}</Text></td>
                    <td className="px-4 py-3">
                      <Pill size="sm"
                        color={sub.status === "approved" ? "green" : sub.status === "rejected" ? "red" : sub.status === "reviewed" ? "cyan" : "gray"}>
                        {sub.status}
                      </Pill>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <TvTooltip label="Preview">
                          <button aria-label="Preview" className="w-7 h-7 rounded-full flex items-center justify-center text-tv-text-secondary hover:text-tv-brand hover:bg-tv-brand-tint transition-colors">
                            <Eye size={13} />
                          </button>
                        </TvTooltip>
                        <TvTooltip label="Download">
                          <button aria-label="Download" className="w-7 h-7 rounded-full flex items-center justify-center text-tv-text-secondary hover:text-tv-brand hover:bg-tv-brand-tint transition-colors">
                            <Download size={13} />
                          </button>
                        </TvTooltip>
                        <TvTooltip label="Add to Video Library">
                          <button aria-label="Add to Video Library" onClick={() => show(`"${sub.recorderName}" video added to Replies folder in Video Library`, "success")}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-tv-text-secondary hover:text-tv-brand hover:bg-tv-brand-tint transition-colors">
                            <Video size={13} />
                          </button>
                        </TvTooltip>
                        {sub.status !== "approved" && sub.status !== "rejected" && (
                          <TvTooltip label="Approve">
                            <button aria-label="Approve" onClick={() => show(`"${sub.recorderName}" video approved`, "success")}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-tv-success hover:bg-tv-success-bg transition-colors">
                              <Check size={13} />
                            </button>
                          </TvTooltip>
                        )}
                        {sub.status !== "approved" && sub.status !== "rejected" && (
                          <TvTooltip label="Reject">
                            <button aria-label="Reject" onClick={() => show(`"${sub.recorderName}" video rejected`, "info")}
                              className="w-7 h-7 rounded-full flex items-center justify-center text-tv-danger hover:bg-tv-danger-bg transition-colors">
                              <X size={13} />
                            </button>
                          </TvTooltip>
                        )}
                        <button title="Request Rerecord" onClick={() => show(`Rerecord request sent to ${sub.recorderName}`, "success")}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-tv-text-secondary hover:text-tv-warning hover:bg-tv-warning-bg transition-colors">
                          <RefreshCw size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(campaign.vrSubmissions || []).filter(s => repliesFilter === "all" || s.status === repliesFilter).length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-12 h-12 bg-tv-brand-tint rounded-full flex items-center justify-center mb-3">
                  <Video size={20} className="text-tv-text-decorative" />
                </div>
                <Text fz={13} fw={500} c={TV.textSecondary}>No submissions match this filter.</Text>
              </div>
            )}
          </Paper>

          {/* Bulk actions */}
          <Row gap="sm">
            <Button variant="light" color="tvPurple" size="xs" leftSection={<Download size={13} />}
              onClick={() => show("Downloading all approved videos\u2026", "success")}>Download All Approved</Button>
            <Button variant="light" color="tvPurple" size="xs" leftSection={<Video size={13} />}
              onClick={() => show("All approved videos added to Replies folder in Video Library", "success")}>Add All to Video Library</Button>
            <Button variant="light" color="tvPurple" size="xs" leftSection={<Send size={13} />}
              onClick={() => show(`Reminder sent to ${(campaign.vrSubmissionsTotal || 0) - (campaign.vrSubmissionsReceived || 0)} pending recorders`, "success")}>Send Reminder</Button>
            <Button variant="light" color="tvPurple" size="xs" leftSection={<Check size={13} />}
              onClick={() => show("All reviewed videos approved", "success")}>Approve All Reviewed</Button>
          </Row>
        </Stack>
      )}

      {/* ════════════════════════════════════════════════════════════════════════
       * TAB: RESEND
       * ════════════════════════════════════════════════════════════════════════ */}
      {activeTab === "resend" && campaign.resendHistory && (
        <Stack gap="md">
          {/* Resend summary */}
          <Row gap="md" align="stretch">
            <Paper radius="xl" withBorder p="md" style={{ borderColor: TV.borderLight, flex: 1 }}>
              <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" mb={4}>Total Sends</Text>
              <Text fz={28} fw={900} c={TV.textBrand}>{campaign.resendHistory.length}</Text>
              <Text fz={11} c={TV.textSecondary}>of {campaign.maxResends || 3} max</Text>
            </Paper>
            <Paper radius="xl" withBorder p="md" style={{ borderColor: TV.borderLight, flex: 1 }}>
              <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" mb={4}>Total Delivered</Text>
              <Text fz={28} fw={900} c={TV.success}>{campaign.resendHistory.reduce((s, r) => s + r.delivered, 0)}</Text>
            </Paper>
            <Paper radius="xl" withBorder p="md" style={{ borderColor: TV.borderLight, flex: 1 }}>
              <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" mb={4}>Total Opened</Text>
              <Text fz={28} fw={900} c={TV.info}>{campaign.resendHistory.reduce((s, r) => s + r.opened, 0)}</Text>
            </Paper>
          </Row>

          {/* Per-send metrics table */}
          <Paper radius="xl" withBorder style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
            <div className="px-4 py-3 bg-tv-surface/40 border-b border-tv-border-divider flex items-center justify-between">
              <Row gap="xs">
                <Repeat size={14} className="text-tv-brand" />
                <Text fz={14} fw={700} c={TV.textPrimary}>Send History</Text>
              </Row>
              {(campaign.resendHistory.length < (campaign.maxResends || 3)) && isSent && (
                <Button size="xs" color="tvPurple" leftSection={<RefreshCw size={12} />}
                  onClick={() => { setResendSubject(subject); setResendStep("configure"); setResendExcluded(new Set()); setResendSending(false); setResendScheduleMode("now"); setShowResendModal(true); }}>
                  Resend Campaign
                </Button>
              )}
            </div>
            <table className="w-full text-left" aria-label="Resend history">
              <thead>
                <tr className="border-b border-tv-border-divider bg-tv-surface/20">
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Send #</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Date</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Subject</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Constituents</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Delivered</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Opened</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Clicked</th>
                  <th scope="col" className="px-4 py-2.5 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaign.resendHistory.map(r => (
                  <tr key={r.sendNumber} className="border-b border-tv-border-divider last:border-b-0 hover:bg-tv-surface/30">
                    <td className="px-4 py-3"><Pill size="sm" color="tvPurple">Send {r.sendNumber}</Pill></td>
                    <td className="px-4 py-3"><Text fz={12} c={TV.textSecondary}>{r.date}</Text></td>
                    <td className="px-4 py-3"><Text fz={12} c={TV.textPrimary} fw={500} truncate style={{ maxWidth: 200 }}>{r.subject}</Text></td>
                    <td className="px-4 py-3"><Text fz={12} c={TV.textSecondary}>{r.constituentCount}</Text></td>
                    <td className="px-4 py-3"><Text fz={12} c={TV.success} fw={600}>{r.delivered}</Text></td>
                    <td className="px-4 py-3"><Text fz={12} c={TV.info} fw={600}>{r.opened}</Text></td>
                    <td className="px-4 py-3"><Text fz={12} c={TV.textBrand} fw={600}>{r.clicked}</Text></td>
                    <td className="px-4 py-3">
                      <Pill size="sm"
                        color={r.status === "Delivered" ? "green" : r.status === "Sending" ? "yellow" : "cyan"}>
                        {r.status}
                      </Pill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>

          {/* Resend constituent breakdown */}
          <Paper radius="xl" withBorder style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
            <div className="px-4 py-3 bg-tv-surface/40 border-b border-tv-border-divider flex items-center justify-between">
              <Text fz={13} fw={700} c={TV.textPrimary}>Resend Constituents</Text>
              <Row gap="xs">
                <div className="relative h-[26px] w-[200px]">
                  <Search size={11} className="absolute left-[8px] top-1/2 -translate-y-1/2 text-tv-text-secondary pointer-events-none" />
                  <input value={resendSearch} onChange={e => setResendSearch(e.target.value)} placeholder="Search by name or email…"
                    aria-label="Search resend constituents" className="w-full h-[26px] pl-[26px] pr-[24px] text-[10px] bg-white border border-tv-border-light rounded-full outline-none transition-colors placeholder:text-tv-text-decorative text-tv-text-primary focus:ring-2 focus:ring-tv-brand/30 focus:border-tv-brand" />
                  {resendSearch && (
                    <button onClick={() => setResendSearch("")} className="absolute right-[8px] top-1/2 -translate-y-1/2 text-tv-text-secondary hover:text-tv-text-primary transition-colors" aria-label="Clear search">
                      <X size={11} />
                    </button>
                  )}
                </div>
                <Row gap={4}>
                  {(["all", "ready", "sent24h", "limit", "clicked"] as const).map(f => (
                    <UnstyledButton key={f} onClick={() => setResendFilter(f)}
                      className={`px-4 py-2 rounded-full text-[14px] transition-colors ${resendFilter === f ? "bg-tv-brand-bg text-white" : "bg-tv-brand-tint text-tv-brand hover:bg-tv-surface-hover"}`}
                      style={{ fontWeight: 600 }}>
                      {f === "all" ? "All" : f === "ready" ? "Ready" : f === "sent24h" ? "Sent < 24h" : f === "limit" ? "At Limit" : "Has Clicked"}
                    </UnstyledButton>
                  ))}
                </Row>
              </Row>
            </div>
            <table className="w-full text-left" aria-label="Resend constituents">
              <thead>
                <tr className="border-b border-tv-border-divider bg-tv-surface/20">
                  <th scope="col" className="px-4 py-2 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Name</th>
                  <th scope="col" className="px-4 py-2 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Email</th>
                  <th scope="col" className="px-4 py-2 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Last Sent</th>
                  <th scope="col" className="px-4 py-2 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Times Sent</th>
                  <th scope="col" className="px-4 py-2 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {campaign.constituents_list
                  .filter(r => {
                    if (resendSearch) {
                      const s = resendSearch.toLowerCase();
                      if (!r.name.toLowerCase().includes(s) && !r.email.toLowerCase().includes(s)) return false;
                    }
                    if (resendFilter === "ready") return r.resendCount < (campaign.maxResends || 3) && r.delivery !== "Failed Send";
                    if (resendFilter === "sent24h") return r.resendCount > 0;
                    if (resendFilter === "limit") return r.resendCount >= (campaign.maxResends || 3);
                    if (resendFilter === "clicked") return r.sendHistory.some(h => h.clicked);
                    return true;
                  })
                  .map(r => (
                  <tr key={r.id} className="border-b border-tv-border-divider last:border-b-0 hover:bg-tv-surface/30">
                    <td className="px-4 py-2.5"><Text fz={12} fw={500} c={TV.textPrimary}>{r.name}</Text></td>
                    <td className="px-4 py-2.5"><Text fz={11} c={TV.textSecondary}>{r.email}</Text></td>
                    <td className="px-4 py-2.5"><Text fz={11} c={TV.textSecondary}>{r.sendHistory[r.sendHistory.length - 1]?.date || "\u2014"}</Text></td>
                    <td className="px-4 py-2.5"><Text fz={11} c={TV.textSecondary}>{r.sendHistory.length}</Text></td>
                    <td className="px-4 py-2.5">
                      {r.resendCount >= (campaign.maxResends || 3) ? (
                        <Pill size="sm" color="red">Limit Reached</Pill>
                      ) : r.delivery === "Failed Send" ? (
                        <Pill size="sm" color="red">Failed</Pill>
                      ) : (
                        <Pill size="sm" color="green">Ready</Pill>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Paper>

          {/* CSV export */}
          <Row>
            <Button variant="light" color="tvPurple" size="xs" leftSection={<Download size={13} />}
              onClick={() => show("Per-send metrics CSV downloaded", "success")}>Export Send Metrics CSV</Button>
          </Row>
        </Stack>
      )}

      {/* Resend Modal — Interactive Flow */}
      <Modal opened={showResendModal} onClose={() => { setShowResendModal(false); setResendStep("configure"); setResendSending(false); setResendExcluded(new Set()); }}
        title={resendStep === "configure" ? "Resend Campaign" : "Confirm Resend"} centered size="lg"
        styles={{ title: { fontSize: 16 } }}>
        {(() => {
          const maxR = campaign.maxResends || 3;
          const eligible = campaign.constituents_list.filter(r => r.resendCount < maxR && r.delivery !== "Failed Send");
          const filtered = eligible.filter(r => {
            if (resendSearch && !r.name.toLowerCase().includes(resendSearch.toLowerCase()) && !r.email.toLowerCase().includes(resendSearch.toLowerCase())) return false;
            if (resendFilter === "ready") return r.resendCount === 0;
            if (resendFilter === "sent24h") return r.sendHistory.some(h => h.status === "Delivered");
            if (resendFilter === "limit") return r.resendCount >= maxR - 1;
            if (resendFilter === "clicked") return r.sendHistory.some(h => h.clicked);
            return true;
          });
          const included = filtered.filter(r => !resendExcluded.has(r.id));

          if (resendStep === "confirm") {
            return (
              <Stack gap="md">
                <div className="p-3 bg-tv-surface rounded-md border border-tv-border-light">
                  <Text fz={11} fw={600} c={TV.textLabel} tt="uppercase" mb={6}>Resend Summary</Text>
                  <div className="space-y-2">
                    <div className="flex justify-between"><Text fz={12} c={TV.textSecondary}>Subject</Text><Text fz={12} fw={600} c={TV.textPrimary}>{resendSubject || "(unchanged)"}</Text></div>
                    <div className="flex justify-between"><Text fz={12} c={TV.textSecondary}>Constituents</Text><Text fz={12} fw={600} c={TV.textPrimary}>{included.length} constituent{included.length !== 1 ? "s" : ""}</Text></div>
                    <div className="flex justify-between"><Text fz={12} c={TV.textSecondary}>Excluded</Text><Text fz={12} fw={600} c={TV.textPrimary}>{resendExcluded.size}</Text></div>
                    <div className="flex justify-between"><Text fz={12} c={TV.textSecondary}>Schedule</Text><Text fz={12} fw={600} c={TV.textPrimary}>{resendScheduleMode === "now" ? "Send immediately" : `${resendScheduleDate} at ${resendScheduleTime}`}</Text></div>
                    <div className="flex justify-between"><Text fz={12} c={TV.textSecondary}>Send #{" "}</Text><Text fz={12} fw={600} c={TV.textPrimary}>{(campaign.resendHistory?.length || 0) + 1} of {maxR}</Text></div>
                  </div>
                </div>
                {(campaign.resendHistory?.length || 0) >= (maxR - 1) && (
                  <div className="p-2.5 bg-tv-warning-bg border border-tv-warning-border rounded-sm flex items-start gap-2">
                    <TriangleAlert size={13} className="text-tv-warning shrink-0 mt-0.5" />
                    <Text fz={11} c={TV.warning}>This will be the final allowed resend for this campaign ({maxR} send maximum).</Text>
                  </div>
                )}
                <Row justify="space-between" gap="sm">
                  <Button variant="subtle" color="gray" onClick={() => setResendStep("configure")}>Back</Button>
                  <Row gap="sm">
                    <Button variant="subtle" color="gray" onClick={() => { setShowResendModal(false); setResendStep("configure"); setResendSending(false); }}>Cancel</Button>
                    <Button color="tvPurple" leftSection={resendSending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      disabled={resendSending || included.length === 0}
                      onClick={() => {
                        setResendSending(true);
                        setTimeout(() => {
                          setResendSending(false);
                          setShowResendModal(false);
                          setResendStep("configure");
                          setResendExcluded(new Set());
                          show(`Resend ${resendScheduleMode === "now" ? "sent" : "scheduled"} for ${included.length} constituent${included.length !== 1 ? "s" : ""}`, "success");
                        }, 1500);
                      }}>
                      {resendSending ? "Sending…" : resendScheduleMode === "now" ? "Send Resend Now" : "Schedule Resend"}
                    </Button>
                  </Row>
                </Row>
              </Stack>
            );
          }

          return (
            <Stack gap="md">
              {/* Subject */}
              <div>
                <Text fz={11} fw={600} c={TV.textLabel} tt="uppercase" mb={4}>Subject Line</Text>
                <TextInput value={resendSubject} onChange={e => setResendSubject(e.currentTarget.value)}
                  placeholder="Update the subject line for this resend" aria-label="Resend subject line" />
                <Text fz={10} c={TV.textSecondary} mt={4}>Updating the subject can improve open rates for constituents who didn&rsquo;t open previously.</Text>
              </div>

              {/* Schedule */}
              <div>
                <Text fz={11} fw={600} c={TV.textLabel} tt="uppercase" mb={6}>Schedule</Text>
                <div className="flex gap-2">
                  {(["now", "later"] as const).map(m => (
                    <button key={m} onClick={() => setResendScheduleMode(m)}
                      className={`flex-1 px-3 py-2 rounded-sm border text-[12px] transition-all ${resendScheduleMode === m ? "border-tv-brand-bg bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-secondary hover:border-tv-border-strong"}`}
                      style={{ fontWeight: resendScheduleMode === m ? 600 : 400 }}>
                      {m === "now" ? "Send Immediately" : "Schedule for Later"}
                    </button>
                  ))}
                </div>
                {resendScheduleMode === "later" && (
                  <div className="flex gap-2 mt-2">
                    <input type="date" value={resendScheduleDate} onChange={e => setResendScheduleDate(e.target.value)} aria-label="Resend date"
                      className="flex-1 border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                    <input type="time" value={resendScheduleTime} onChange={e => setResendScheduleTime(e.target.value)} aria-label="Resend time"
                      className="w-[120px] border border-tv-border-light rounded-sm px-3 py-2 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
                  </div>
                )}
              </div>

              {/* Constituents */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Text fz={11} fw={600} c={TV.textLabel} tt="uppercase">Constituents ({included.length} of {eligible.length})</Text>
                  <div className="flex gap-1">
                    {([
                      { key: "all" as const, label: "All" },
                      { key: "ready" as const, label: "Never resent" },
                      { key: "clicked" as const, label: "Clicked" },
                    ]).map(f => (
                      <button key={f.key} onClick={() => setResendFilter(f.key)}
                        className={`px-2 py-0.5 rounded-full text-[9px] transition-colors ${resendFilter === f.key ? "bg-tv-brand-bg text-white" : "bg-tv-surface text-tv-text-secondary hover:bg-tv-surface-hover"}`}
                        style={{ fontWeight: 600 }}>{f.label}</button>
                    ))}
                  </div>
                </div>
                <TextInput size="xs" placeholder="Search constituents…" aria-label="Search constituents" value={resendSearch} onChange={e => setResendSearch(e.currentTarget.value)}
                  leftSection={<Search size={12} aria-hidden="true" />} mb={8} />
                <div className="max-h-[200px] overflow-auto border border-tv-border-light rounded-sm divide-y divide-tv-border-divider">
                  {filtered.length === 0 ? (
                    <div className="px-3 py-4 text-center"><Text fz={11} c={TV.textSecondary}>No eligible constituents match your filter.</Text></div>
                  ) : filtered.map(r => {
                    const excluded = resendExcluded.has(r.id);
                    return (
                      <div key={r.id} className={`flex items-center gap-2 px-3 py-2 ${excluded ? "opacity-50" : ""}`}>
                        <Checkbox size="xs" checked={!excluded}
                          onChange={() => setResendExcluded(prev => { const n = new Set(prev); if (n.has(r.id)) n.delete(r.id); else n.add(r.id); return n; })} />
                        <div className="flex-1 min-w-0">
                          <Text fz={12} fw={500} c={TV.textPrimary} truncate>{r.name}</Text>
                          <Text fz={10} c={TV.textSecondary} truncate>{r.email}</Text>
                        </div>
                        <div className="text-right shrink-0">
                          <Text fz={10} c={TV.textSecondary}>{r.resendCount} send{r.resendCount !== 1 ? "s" : ""}</Text>
                          <Text fz={9} c={r.sendHistory.some(h => h.opened) ? TV.success : TV.textDecorative}>
                            {r.sendHistory.some(h => h.opened) ? "Opened" : "Not opened"}
                          </Text>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <button onClick={() => setResendExcluded(new Set())} className="text-[10px] text-tv-brand hover:underline">Select all</button>
                  <button onClick={() => setResendExcluded(new Set(filtered.map(r => r.id)))} className="text-[10px] text-tv-text-secondary hover:underline">Deselect all</button>
                </div>
              </div>

              {/* Previous sends history */}
              {(campaign.resendHistory?.length || 0) > 0 && (
                <div>
                  <Text fz={11} fw={600} c={TV.textLabel} tt="uppercase" mb={4}>Send History</Text>
                  <div className="space-y-1">
                    {campaign.resendHistory!.map((h, i) => (
                      <div key={i} className="flex items-center justify-between px-2.5 py-1.5 bg-tv-surface rounded-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-tv-brand-tint flex items-center justify-center"><Text fz={9} fw={700} c={TV.brand}>#{h.sendNumber}</Text></div>
                          <div><Text fz={11} c={TV.textPrimary}>{h.date}</Text><Text fz={9} c={TV.textSecondary}>{h.constituentCount} constituents • {h.opened} opened • {h.clicked} clicked</Text></div>
                        </div>
                        <Pill color={h.status === "Delivered" ? "green" : "gray"}>{h.status}</Pill>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <Row justify="flex-end" gap="sm">
                <Button variant="subtle" color="gray" onClick={() => { setShowResendModal(false); setResendStep("configure"); }}>Cancel</Button>
                <Button color="tvPurple" disabled={included.length === 0}
                  onClick={() => setResendStep("confirm")}>
                  Review &amp; Confirm ({included.length})
                </Button>
              </Row>
            </Stack>
          );
        })()}
      </Modal>

      {/* Modals */}
      {showDelete && <DeleteModal opened title={`Delete "${name}"?`} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />}
      {showTestSend && campaign.constituents_list.length > 0 && <TestSendModal constituents={campaign.constituents_list} onSend={handleTestSend} onCancel={() => setShowTestSend(false)} />}
      {showCopy && <CopyCampaignModal campaign={campaign} onCopy={handleCopyCampaign} onCancel={() => setShowCopy(false)} />}

      {/* Assign Video Task Modal */}
      {assignTaskRecipient && (
        <Modal opened onClose={() => setAssignTaskRecipient(null)} title="Assign Video Task" size={400} radius="xl">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: TV.surface }}>
              <div className="w-8 h-8 rounded-full bg-tv-brand-tint flex items-center justify-center text-tv-brand text-[10px] shrink-0" style={{ fontWeight: 700 }}>
                {assignTaskRecipient.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <Text fz={13} fw={600} c={TV.textPrimary}>{assignTaskRecipient.name}</Text>
                <Text fz={11} c={TV.textSecondary}>{assignTaskRecipient.email}</Text>
              </div>
            </div>
            <div>
              <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Assign To</Text>
              <select value={assignTaskUser} onChange={e => setAssignTaskUser(e.target.value)}
                className="w-full border border-tv-border-light rounded-md px-3 py-2.5 text-[13px] text-tv-text-primary outline-none focus:ring-2 focus:ring-tv-brand/20 focus:border-tv-brand">
                {PORTAL_USERS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAssignTaskRecipient(null)}>Cancel</Button>
              <Button onClick={() => { show(`Video task for ${assignTaskRecipient.name} assigned to ${assignTaskUser}`, "success"); setAssignTaskRecipient(null); }}>
                <UserPlus size={13} className="mr-1.5" />Assign Task
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Constituent-Specific Link Modal */}
      <ConstituentLinkModal
        opened={constituentLinkModalOpen}
        constituents={campaign.constituents_list}
        search={constituentLinkSearch}
        onSearchChange={setConstituentLinkSearch}
        selectedId={selectedConstituentId}
        onSelectId={setSelectedConstituentId}
        copied={copiedConstituentLink}
        onCopy={(url, name) => {
          navigator.clipboard?.writeText(url).catch(() => {});
          setCopiedConstituentLink(true);
          show(`Link copied for ${name}`, "success");
          setTimeout(() => setCopiedConstituentLink(false), 2500);
        }}
        onResetCopied={() => setCopiedConstituentLink(false)}
        onClose={() => setConstituentLinkModalOpen(false)}
      />

      <StatusChangeModal
        opened={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        currentStatus={effectiveStatus}
        constituentCount={campaign.constituents}
        scheduledSends={campaign.constituents_list.filter(r => r.sendHistory.some(h => h.status === "Send Scheduled")).length}
        onStatusChange={handleStatusChange}
      />

      {showEditColumns && (
        <EditColumnsModal columns={CONSTITUENT_COLUMNS} active={activeConstCols} onClose={() => setShowEditColumns(false)}
          onSave={cols => { setActiveConstCols(cols); show("Columns updated!", "success"); }} />
      )}
    </Box>
  );
}
