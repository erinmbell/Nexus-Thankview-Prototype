import {
  Box, Text, Title, Button, ActionIcon, Tabs,
  Avatar, Drawer, Modal, TextInput, Checkbox,
  SegmentedControl, Tooltip, Stack, Badge, UnstyledButton,
} from "@mantine/core";
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import {
  Eye, EyeOff, MessageSquare, MousePointerClick,
  Play, ChevronRight, X, Film, Send, Download,
  CircleCheckBig, CircleAlert, TriangleAlert, Search, Users, ListPlus,
  Smartphone, Monitor, Tablet, Globe, MapPin, Mail, MailX, MailOpen,
  Share2, Video, Clock, CalendarRange, ArrowLeft, ArrowUpDown, ArrowUp, ArrowDown,
  Settings, Check, BarChart3, Ban,
  TrendingUp, TrendingDown, Target, ChevronDown,
  UserMinus, ShieldAlert, Goal, Trophy,
  Tag, Layers, GitCompareArrows, LayoutDashboard, FileText, Info, Pin,
  Activity, PhoneOff, SlidersHorizontal,
} from "lucide-react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  AreaChart, Area, BarChart, Bar, PieChart as RPieChart, Pie, Cell,
} from "recharts";
import { TV } from "../theme";
import { useToast } from "../contexts/ToastContext";
import { VisualizationsTab } from "../components/VisualizationsTab";
import { FilterBar, FilterValues, ChipFilter } from "../components/FilterBar";
import type { FilterDef } from "../components/FilterBar";
import { DashCard, ChartBox, DRAWER_STYLES } from "../components/shared";
import { EditColumnsModal, ColumnsButton, type ColumnDef } from "../components/ColumnCustomizer";
import dayjs from "dayjs";

// ═════════════════════════════════════════��══��══════════════════════════════════
// MOCK DATA
// ═════���════════════════��════════════════════════════════════════════════════════

const TREND_DATA = [
  { date: "Feb 1",  sends: 38, delivered: 37, opens: 31, clicks: 18, views: 42, replies: 6  },
  { date: "Feb 3",  sends: 52, delivered: 51, opens: 44, clicks: 24, views: 58, replies: 9  },
  { date: "Feb 5",  sends: 48, delivered: 46, opens: 37, clicks: 21, views: 51, replies: 7  },
  { date: "Feb 7",  sends: 68, delivered: 66, opens: 54, clicks: 29, views: 73, replies: 11 },
  { date: "Feb 9",  sends: 61, delivered: 59, opens: 49, clicks: 26, views: 67, replies: 8  },
  { date: "Feb 11", sends: 84, delivered: 82, opens: 68, clicks: 35, views: 89, replies: 14 },
  { date: "Feb 13", sends: 91, delivered: 89, opens: 74, clicks: 38, views: 94, replies: 16 },
  { date: "Feb 15", sends: 79, delivered: 77, opens: 62, clicks: 31, views: 82, replies: 12 },
  { date: "Feb 17", sends: 103, delivered: 100, opens: 84, clicks: 44, views: 108, replies: 18 },
  { date: "Feb 19", sends: 121, delivered: 118, opens: 98, clicks: 51, views: 127, replies: 21 },
];

// Per-date campaign breakdown for engagement tooltip drilldown
const TREND_CAMPAIGN_BREAKDOWN: Record<string, { campaign: string; sends: number; opens: number; clicks: number; views: number; replies: number }[]> = {
  "Feb 1":  [{ campaign: "Spring Annual Fund Appeal", sends: 14, opens: 12, clicks: 7, views: 16, replies: 2 }, { campaign: "Board Outreach", sends: 6, opens: 6, clicks: 5, views: 6, replies: 2 }, { campaign: "Welcome Message – Class of 2026", sends: 10, opens: 7, clicks: 3, views: 11, replies: 1 }, { campaign: "Major Gift Cultivation – Q1", sends: 5, opens: 4, clicks: 2, views: 6, replies: 1 }],
  "Feb 3":  [{ campaign: "Spring Annual Fund Appeal", sends: 20, opens: 17, clicks: 10, views: 22, replies: 4 }, { campaign: "Board Outreach", sends: 8, opens: 8, clicks: 5, views: 9, replies: 2 }, { campaign: "Welcome Message – Class of 2026", sends: 13, opens: 10, clicks: 5, views: 15, replies: 2 }, { campaign: "Major Gift Cultivation – Q1", sends: 7, opens: 6, clicks: 3, views: 8, replies: 1 }],
  "Feb 5":  [{ campaign: "Spring Annual Fund Appeal", sends: 18, opens: 14, clicks: 8, views: 20, replies: 3 }, { campaign: "Board Outreach", sends: 7, opens: 7, clicks: 5, views: 7, replies: 2 }, { campaign: "Welcome Message – Class of 2026", sends: 12, opens: 9, clicks: 4, views: 13, replies: 1 }, { campaign: "Major Gift Cultivation – Q1", sends: 7, opens: 5, clicks: 3, views: 8, replies: 1 }],
  "Feb 7":  [{ campaign: "Spring Annual Fund Appeal", sends: 26, opens: 21, clicks: 12, views: 28, replies: 5 }, { campaign: "Board Outreach", sends: 10, opens: 10, clicks: 7, views: 10, replies: 3 }, { campaign: "Welcome Message – Class of 2026", sends: 15, opens: 11, clicks: 5, views: 17, replies: 1 }, { campaign: "Major Gift Cultivation – Q1", sends: 9, opens: 7, clicks: 3, views: 10, replies: 1 }],
  "Feb 9":  [{ campaign: "Spring Annual Fund Appeal", sends: 23, opens: 19, clicks: 10, views: 26, replies: 4 }, { campaign: "Board Outreach", sends: 9, opens: 9, clicks: 6, views: 9, replies: 2 }, { campaign: "Welcome Message – Class of 2026", sends: 14, opens: 10, clicks: 5, views: 15, replies: 1 }, { campaign: "Major Gift Cultivation – Q1", sends: 8, opens: 6, clicks: 3, views: 9, replies: 1 }],
  "Feb 11": [{ campaign: "Spring Annual Fund Appeal", sends: 32, opens: 26, clicks: 14, views: 34, replies: 6 }, { campaign: "Board Outreach", sends: 12, opens: 12, clicks: 8, views: 12, replies: 3 }, { campaign: "Welcome Message – Class of 2026", sends: 18, opens: 14, clicks: 6, views: 20, replies: 2 }, { campaign: "Major Gift Cultivation – Q1", sends: 12, opens: 9, clicks: 4, views: 13, replies: 2 }],
  "Feb 13": [{ campaign: "Spring Annual Fund Appeal", sends: 35, opens: 28, clicks: 15, views: 36, replies: 7 }, { campaign: "Board Outreach", sends: 13, opens: 13, clicks: 9, views: 13, replies: 4 }, { campaign: "Welcome Message – Class of 2026", sends: 20, opens: 15, clicks: 7, views: 21, replies: 2 }, { campaign: "Major Gift Cultivation – Q1", sends: 13, opens: 10, clicks: 4, views: 14, replies: 2 }],
  "Feb 15": [{ campaign: "Spring Annual Fund Appeal", sends: 30, opens: 24, clicks: 12, views: 32, replies: 5 }, { campaign: "Board Outreach", sends: 11, opens: 11, clicks: 7, views: 11, replies: 3 }, { campaign: "Welcome Message – Class of 2026", sends: 17, opens: 13, clicks: 6, views: 18, replies: 2 }, { campaign: "Major Gift Cultivation – Q1", sends: 11, opens: 8, clicks: 3, views: 12, replies: 1 }],
  "Feb 17": [{ campaign: "Spring Annual Fund Appeal", sends: 39, opens: 32, clicks: 17, views: 42, replies: 8 }, { campaign: "Board Outreach", sends: 15, opens: 15, clicks: 10, views: 15, replies: 4 }, { campaign: "Welcome Message – Class of 2026", sends: 23, opens: 17, clicks: 8, views: 24, replies: 3 }, { campaign: "Major Gift Cultivation – Q1", sends: 15, opens: 12, clicks: 5, views: 16, replies: 2 }],
  "Feb 19": [{ campaign: "Spring Annual Fund Appeal", sends: 46, opens: 38, clicks: 20, views: 49, replies: 9 }, { campaign: "Board Outreach", sends: 17, opens: 17, clicks: 12, views: 17, replies: 5 }, { campaign: "Welcome Message – Class of 2026", sends: 27, opens: 20, clicks: 9, views: 28, replies: 3 }, { campaign: "Major Gift Cultivation – Q1", sends: 17, opens: 13, clicks: 6, views: 18, replies: 2 }],
};

const SEND_RECORDS = [
  { id: 1, campaign: "Spring Annual Fund Appeal", sender: "Kelley Molt", type: "Solicitation", channel: "Email", recipient: "James Whitfield", email: "j.whitfield@alumni.edu", avatar: "JW", color: "bg-tv-brand", status: "Opened", statusColor: "bg-tv-brand-tint text-tv-brand", sentAt: "Feb 14, 9:02 AM", openedAt: "Feb 14, 9:17 AM", viewRate: 94, watchPct: 87, replyRate: true, ctaClicked: true, shared: false, downloaded: false, watchTime: "1:02", videoDuration: "1:08", device: "Desktop", city: "Boston", state: "MA", country: "US", age: "35-44", engagementScore: 92, notes: "Watched to completion, clicked CTA, replied with pledge.", title: "Mr.", preferredName: "Jim", donorId: "D-100412", company: "Whitfield & Associates", phone: "+1 617-555-0142" },
  { id: 2, campaign: "Spring Annual Fund Appeal", sender: "Kelley Molt", type: "Solicitation", channel: "Email", recipient: "Sarah Chen", email: "s.chen@foundation.org", avatar: "SC", color: "bg-tv-info", status: "Replied", statusColor: "bg-tv-success-bg text-tv-success", sentAt: "Feb 14, 9:02 AM", openedAt: "Feb 14, 11:34 AM", viewRate: 100, watchPct: 100, replyRate: true, ctaClicked: true, shared: true, downloaded: false, watchTime: "1:08", videoDuration: "1:08", device: "Mobile", city: "San Francisco", state: "CA", country: "US", age: "45-54", engagementScore: 100, notes: "Full watch, replied with $1,200 pledge. High-value.", title: "Ms.", preferredName: "Sarah", donorId: "D-100287", company: "Chen Foundation", phone: "+1 415-555-0198" },
  { id: 3, campaign: "Welcome Message – Class of 2026", sender: "Michelle Park", type: "Update", channel: "Email", recipient: "Marcus Reid", email: "m.reid@email.com", avatar: "MR", color: "bg-tv-success", status: "Watched", statusColor: "bg-tv-info-bg text-tv-info", sentAt: "Feb 10, 2:00 PM", openedAt: "Feb 10, 4:52 PM", viewRate: 78, watchPct: 62, replyRate: false, ctaClicked: false, shared: false, downloaded: false, watchTime: "0:43", videoDuration: "1:08", device: "Tablet", city: "Chicago", state: "IL", country: "US", age: "18-24", engagementScore: 58, notes: "Watched majority of video but did not click CTA or reply.", title: "", preferredName: "Marcus", donorId: "D-102651", company: "", phone: "+1 312-555-0076" },
  { id: 4, campaign: "Board Outreach", sender: "James Okafor", type: "Thank You", channel: "Email", recipient: "David Park", email: "d.park@alumni.edu", avatar: "DP", color: "bg-tv-danger", status: "Replied", statusColor: "bg-tv-success-bg text-tv-success", sentAt: "Feb 12, 10:15 AM", openedAt: "Feb 12, 10:22 AM", viewRate: 100, watchPct: 100, replyRate: true, ctaClicked: true, shared: true, downloaded: true, watchTime: "1:08", videoDuration: "1:08", device: "Mobile", city: "Austin", state: "TX", country: "US", age: "55-64", engagementScore: 100, notes: "Immediate open, full watch, replied within 7 minutes.", title: "Dr.", preferredName: "Dave", donorId: "D-100018", company: "Park Medical Group", phone: "+1 512-555-0234" },
  { id: 5, campaign: "Welcome Message – Class of 2026", sender: "Michelle Park", type: "Update", channel: "Email", recipient: "Aisha Johnson", email: "a.johnson@gmail.com", avatar: "AJ", color: "bg-tv-brand", status: "Not opened", statusColor: "bg-tv-surface-muted text-tv-text-secondary", sentAt: "Feb 10, 2:00 PM", openedAt: "—", viewRate: 0, watchPct: 0, replyRate: false, ctaClicked: false, shared: false, downloaded: false, watchTime: "0:00", videoDuration: "1:08", device: "Unknown", city: "Unknown", state: "—", country: "US", age: "18-24", engagementScore: 0, notes: "", title: "", preferredName: "Aisha", donorId: "D-102799", company: "", phone: "" },
];

// ── Campaign-level aggregated performance data ─────────────────────────────
// Seed function for deterministic pseudo-random mock data
function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

// Legacy campaign type tags (migrated from old ThankView campaign types)
const CAMPAIGN_TAGS = [
  "Thank You", "Appeals / Solicitation", "Video Request", "Event Related",
  "Updates", "Birthdays", "Anniversaries", "Endowment Reports",
  "Career Moves", "Other",
  "Welcome Series", "Reunion", "Scholarship", "Planned Giving",
] as const;
type CampaignTag = typeof CAMPAIGN_TAGS[number];

// Map template names → legacy tags
const TEMPLATE_TAG_MAP: Record<string, CampaignTag> = {
  "Thank You": "Thank You", "Stewardship": "Thank You",
  "Annual Fund": "Appeals / Solicitation", "Giving Day": "Appeals / Solicitation",
  "Year-End Appeal": "Appeals / Solicitation", "Planned Giving": "Appeals / Solicitation",
  "Capital Campaign": "Appeals / Solicitation", "Scholarship": "Appeals / Solicitation",
  "Video Request": "Video Request",
  "Event Invite": "Event Related", "Reunion": "Event Related",
  "Welcome": "Updates", "Dean's Message": "Updates", "Donor Update": "Updates",
  "Impact Report": "Updates",
  "Endowment Report": "Endowment Reports",
  "Volunteer Ask": "Other",
};

// Tag display colors (icon bg / accent)
const TAG_COLORS: Record<CampaignTag, { color: string; bg: string }> = {
  "Thank You":               { color: TV.success,  bg: TV.successBg },
  "Appeals / Solicitation":  { color: TV.textBrand, bg: TV.brandTint },
  "Video Request":           { color: TV.warning,  bg: TV.warningBg },
  "Event Related":           { color: TV.info,     bg: TV.infoBg },
  "Updates":                 { color: "#6366f1",   bg: "#eef2ff" },
  "Birthdays":               { color: "#ec4899",   bg: "#fdf2f8" },
  "Anniversaries":           { color: TV.warning,  bg: TV.warningBg },
  "Endowment Reports":       { color: TV.info,   bg: TV.infoBg },
  "Career Moves":            { color: TV.brand,    bg: TV.brandTint },
  "Other":                   { color: TV.textSecondary, bg: TV.surfaceMuted },
  // Extended tags
  "Welcome Series":          { color: TV.success,  bg: TV.successBg },
  "Reunion":                 { color: "#f97316",   bg: "#fff7ed" },
  "Scholarship":             { color: TV.info,   bg: TV.infoBg },
  "Planned Giving":          { color: TV.brand,    bg: TV.brandTint },
};

type CampaignStat = {
  name: string; tag: CampaignTag; sent: number; delivered: number; opened: number;
  clicked: number; replied: number; views: number; avgVideoPct: number;
  ctaClicks: number; shares: number; downloads: number; avgOpenTime: string;
  topDevice: string; trend: "up" | "flat" | "down"; replyDelta: number; openDelta: number;
};

// Featured campaigns (hand-crafted, always first)
const FEATURED_CAMPAIGNS: CampaignStat[] = [
  { name: "Spring Annual Fund Appeal", tag: "Appeals / Solicitation", sent: 412, delivered: 403, opened: 342, clicked: 178, replied: 62, views: 298, avgVideoPct: 74, ctaClicks: 98, shares: 18, downloads: 12, avgOpenTime: "18 min", topDevice: "Desktop" as const, trend: "up" as const, replyDelta: 2.1, openDelta: 1.3 },
  { name: "Welcome Message – Class of 2026", tag: "Updates", sent: 198, delivered: 192, opened: 148, clicked: 61, replied: 8, views: 118, avgVideoPct: 52, ctaClicks: 41, shares: 11, downloads: 4, avgOpenTime: "2.4 hr", topDevice: "Mobile" as const, trend: "flat" as const, replyDelta: 0.3, openDelta: 0.9 },
  { name: "Board Outreach", tag: "Thank You", sent: 22, delivered: 22, opened: 22, clicked: 18, replied: 14, views: 22, avgVideoPct: 91, ctaClicks: 16, shares: 8, downloads: 6, avgOpenTime: "7 min", topDevice: "Mobile" as const, trend: "up" as const, replyDelta: 4.0, openDelta: 1.5 },
  { name: "Major Gift Cultivation – Q1", tag: "Appeals / Solicitation", sent: 78, delivered: 76, opened: 68, clicked: 42, replied: 21, views: 64, avgVideoPct: 82, ctaClicks: 38, shares: 9, downloads: 5, avgOpenTime: "12 min", topDevice: "Desktop" as const, trend: "up" as const, replyDelta: 1.7, openDelta: 1.1 },
  { name: "Student Video Testimonials", tag: "Video Request", sent: 35, delivered: 34, opened: 21, clicked: 9, replied: 2, views: 14, avgVideoPct: 34, ctaClicks: 3, shares: 1, downloads: 0, avgOpenTime: "5.1 hr", topDevice: "Mobile" as const, trend: "down" as const, replyDelta: 0.4, openDelta: 0.7 },
];

// Generate ~150 additional realistic advancement campaign names
const CAMPAIGN_TEMPLATES = [
  "Thank You", "Stewardship", "Annual Fund", "Giving Day", "Scholarship",
  "Endowment Report", "Reunion", "Impact Report", "Event Invite", "Video Request",
  "Welcome", "Dean's Message", "Capital Campaign", "Donor Update",
  "Year-End Appeal", "Planned Giving", "Volunteer Ask",
];
const CAMPAIGN_TARGETS = [
  "FY25", "FY26", "Q1", "Q2", "Spring", "Fall",
  "Class of 2025", "Class of 2026", "Major Donors", "First-Time Donors",
  "Parents", "Alumni", "Board Members", "Young Alumni",
];

const _rng = seededRandom(42);
const GENERATED_CAMPAIGNS: CampaignStat[] = (() => {
  const names = new Set(FEATURED_CAMPAIGNS.map(c => c.name));
  const result: CampaignStat[] = [];
  const devices = ["Desktop", "Mobile", "Tablet"];
  const trends = ["up", "flat", "down"] as const;
  const openTimes = ["4 min", "8 min", "12 min", "22 min", "35 min", "1.2 hr", "2.8 hr", "4.6 hr"];

  for (let i = 0; i < 500 && result.length < 25; i++) {
    const tmpl = CAMPAIGN_TEMPLATES[Math.floor(_rng() * CAMPAIGN_TEMPLATES.length)];
    const target = CAMPAIGN_TARGETS[Math.floor(_rng() * CAMPAIGN_TARGETS.length)];
    const name = `${tmpl} – ${target}`;
    if (names.has(name)) continue;
    names.add(name);

    const sent = Math.floor(_rng() * 800) + 10;
    const delivered = Math.floor(sent * (0.94 + _rng() * 0.05));
    const opened = Math.floor(delivered * (0.35 + _rng() * 0.55));
    const clicked = Math.floor(opened * (0.15 + _rng() * 0.55));
    const replied = Math.floor(opened * (_rng() * 0.25));
    const views = Math.floor(opened * (0.4 + _rng() * 0.5));
    const avgVideoPct = Math.floor(25 + _rng() * 70);
    const ctaClicks = Math.floor(clicked * (0.3 + _rng() * 0.6));
    const shares = Math.floor(_rng() * (sent * 0.05));
    const downloads = Math.floor(_rng() * (sent * 0.03));

    const tag = TEMPLATE_TAG_MAP[tmpl] || "Other";
    result.push({
      name, tag, sent, delivered, opened, clicked, replied, views, avgVideoPct,
      ctaClicks, shares, downloads,
      avgOpenTime: openTimes[Math.floor(_rng() * openTimes.length)],
      topDevice: devices[Math.floor(_rng() * devices.length)],
      trend: trends[Math.floor(_rng() * trends.length)],
      replyDelta: Math.round((_rng() * 4) * 10) / 10,
      openDelta: Math.round((0.5 + _rng() * 1.5) * 10) / 10,
    });
  }
  return result;
})();

// Extra campaigns for underrepresented tags (these would come from old TV migrations)
const EXTRA_TAG_CAMPAIGNS: CampaignStat[] = [
  { name: "Birthday Greetings – FY25", tag: "Birthdays", sent: 1842, delivered: 1810, opened: 1502, clicked: 412, replied: 189, views: 1124, avgVideoPct: 68, ctaClicks: 198, shares: 42, downloads: 18, avgOpenTime: "22 min", topDevice: "Mobile", trend: "up", replyDelta: 1.8, openDelta: 1.2 },
  { name: "Work Anniversary – FY25", tag: "Anniversaries", sent: 624, delivered: 612, opened: 498, clicked: 145, replied: 78, views: 389, avgVideoPct: 76, ctaClicks: 67, shares: 22, downloads: 5, avgOpenTime: "15 min", topDevice: "Desktop", trend: "up", replyDelta: 1.5, openDelta: 1.1 },
  { name: "Career Update – New Roles Q1", tag: "Career Moves", sent: 245, delivered: 240, opened: 198, clicked: 68, replied: 34, views: 156, avgVideoPct: 58, ctaClicks: 28, shares: 15, downloads: 4, avgOpenTime: "35 min", topDevice: "Mobile", trend: "flat", replyDelta: 0.9, openDelta: 0.8 },
  { name: "New Student Welcome Fall '25", tag: "Welcome Series", sent: 2105, delivered: 2068, opened: 1812, clicked: 624, replied: 245, views: 1456, avgVideoPct: 74, ctaClicks: 312, shares: 68, downloads: 24, avgOpenTime: "12 min", topDevice: "Mobile", trend: "up", replyDelta: 2.1, openDelta: 1.8 },
  { name: "Class of 2000 – 25th Reunion", tag: "Reunion", sent: 1456, delivered: 1428, opened: 1198, clicked: 412, replied: 186, views: 952, avgVideoPct: 82, ctaClicks: 245, shares: 56, downloads: 18, avgOpenTime: "32 min", topDevice: "Desktop", trend: "up", replyDelta: 1.9, openDelta: 1.5 },
  { name: "Merit Scholarship Thank You", tag: "Scholarship", sent: 1124, delivered: 1102, opened: 968, clicked: 356, replied: 165, views: 812, avgVideoPct: 85, ctaClicks: 198, shares: 42, downloads: 15, avgOpenTime: "18 min", topDevice: "Mobile", trend: "up", replyDelta: 2.4, openDelta: 1.6 },
  { name: "Planned Giving – Legacy Q4", tag: "Planned Giving", sent: 892, delivered: 876, opened: 712, clicked: 234, replied: 112, views: 568, avgVideoPct: 72, ctaClicks: 145, shares: 32, downloads: 12, avgOpenTime: "45 min", topDevice: "Desktop", trend: "up", replyDelta: 1.5, openDelta: 1.2 },
];

const CAMPAIGN_STATS: CampaignStat[] = [...FEATURED_CAMPAIGNS, ...GENERATED_CAMPAIGNS, ...EXTRA_TAG_CAMPAIGNS];

// ── Tag group aggregation ─────────────────────────────────────────────────
type TagGroup = {
  tag: CampaignTag;
  campaigns: CampaignStat[];
  totalSent: number;
  totalDelivered: number;
  totalOpened: number;
  totalClicked: number;
  totalReplied: number;
  totalViews: number;
  avgOpenRate: number;
  avgClickRate: number;
  avgReplyRate: number;
  avgVideoPct: number;
  topCampaign: CampaignStat;
  trendUp: number;
  trendDown: number;
};

const TAG_GROUPS: TagGroup[] = (() => {
  const grouped = new Map<CampaignTag, CampaignStat[]>();
  for (const tag of CAMPAIGN_TAGS) grouped.set(tag, []);
  for (const c of CAMPAIGN_STATS) {
    const arr = grouped.get(c.tag);
    if (arr) arr.push(c);
  }
  return CAMPAIGN_TAGS
    .filter(tag => (grouped.get(tag)?.length ?? 0) > 0)
    .map(tag => {
      const campaigns = grouped.get(tag)!;
      const totalSent = campaigns.reduce((s, c) => s + c.sent, 0);
      const totalDelivered = campaigns.reduce((s, c) => s + c.delivered, 0);
      const totalOpened = campaigns.reduce((s, c) => s + c.opened, 0);
      const totalClicked = campaigns.reduce((s, c) => s + c.clicked, 0);
      const totalReplied = campaigns.reduce((s, c) => s + c.replied, 0);
      const totalViews = campaigns.reduce((s, c) => s + c.views, 0);
      const avgOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
      const avgClickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
      const avgReplyRate = totalDelivered > 0 ? (totalReplied / totalDelivered) * 100 : 0;
      const avgVideoPct = campaigns.length > 0
        ? campaigns.reduce((s, c) => s + c.avgVideoPct * c.views, 0) / Math.max(totalViews, 1)
        : 0;
      const topCampaign = [...campaigns].sort((a, b) => b.sent - a.sent)[0];
      const trendUp = campaigns.filter(c => c.trend === "up").length;
      const trendDown = campaigns.filter(c => c.trend === "down").length;
      return { tag, campaigns, totalSent, totalDelivered, totalOpened, totalClicked, totalReplied, totalViews, avgOpenRate, avgClickRate, avgReplyRate, avgVideoPct, topCampaign, trendUp, trendDown };
    });
})();

// ─��� Best Performing Video Clips ──────────────────────────────────────────
type VideoClip = {
  id: string;
  title: string;
  campaignName: string;
  thumbnail: string;
  duration: string;
  openRate: number;
  clickRate: number;
  views: number;
  avgCompletion: number;
  sender: string;
  createdAt: string;
  timeline: { firstView: string; peakViews: string; lastView: string };
};
const TOP_VIDEO_CLIPS: VideoClip[] = [
  { id: "vc1", title: "Board Chair Thank You Message", campaignName: "Board Outreach", thumbnail: "https://images.unsplash.com/photo-1565828052994-aa2276b131a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwZGVhbiUyMG9mZmljZSUyMHBvcnRyYWl0fGVufDF8fHx8MTc3MjU3NzE5Nnww&ixlib=rb-4.1.0&q=80&w=1080", duration: "1:42", openRate: 100, clickRate: 81.8, views: 22, avgCompletion: 91, sender: "Dr. Patricia Knowles", createdAt: "Jan 8, 2026", timeline: { firstView: "7 min after send", peakViews: "45 min after send", lastView: "2 days after send" } },
  { id: "vc2", title: "Major Gift Personal Appeal", campaignName: "Major Gift Cultivation – Q1", thumbnail: "https://images.unsplash.com/photo-1697665387559-253e7a645e96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb25vciUyMHBoaWxhbnRocm9weSUyMGhhbmRzaGFrZXxlbnwxfHx8fDE3NzI1NzcxOTJ8MA&ixlib=rb-4.1.0&q=80&w=1080", duration: "2:15", openRate: 89.5, clickRate: 55.3, views: 64, avgCompletion: 82, sender: "Michael Torres", createdAt: "Feb 3, 2026", timeline: { firstView: "12 min after send", peakViews: "3 hours after send", lastView: "5 days after send" } },
  { id: "vc3", title: "Annual Fund Impact Update", campaignName: "Spring Annual Fund Appeal", thumbnail: "https://images.unsplash.com/photo-1604336480714-ed7fa506014e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2hvbGFyc2hpcCUyMGF3YXJkJTIwc3R1ZGVudHxlbnwxfHx8fDE3NzI1Njc0OTV8MA&ixlib=rb-4.1.0&q=80&w=1080", duration: "1:58", openRate: 84.9, clickRate: 44.2, views: 298, avgCompletion: 74, sender: "Sarah Mitchell", createdAt: "Mar 15, 2026", timeline: { firstView: "2 min after send", peakViews: "6 hours after send", lastView: "8 days after send" } },
  { id: "vc4", title: "Dean's Welcome Address", campaignName: "Welcome Message – Class of 2026", thumbnail: "https://images.unsplash.com/photo-1736066330610-c102cab4e942?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzb3IlMjB0ZWFjaGluZyUyMGNsYXNzcm9vbXxlbnwxfHx8fDE3NzI1NzcxOTN8MA&ixlib=rb-4.1.0&q=80&w=1080", duration: "3:04", openRate: 77.1, clickRate: 31.8, views: 118, avgCompletion: 52, sender: "Dean Robert Chen", createdAt: "Aug 20, 2025", timeline: { firstView: "18 min after send", peakViews: "1.5 hours after send", lastView: "12 days after send" } },
  { id: "vc5", title: "Reunion Recap Montage", campaignName: "Reunion – Class of 2025", thumbnail: "https://images.unsplash.com/photo-1618371947078-e6a83940f8cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbHVtbmklMjByZXVuaW9uJTIwZ3JvdXAlMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NzI1NzcxOTZ8MA&ixlib=rb-4.1.0&q=80&w=1080", duration: "2:38", openRate: 72.4, clickRate: 38.1, views: 185, avgCompletion: 68, sender: "Alumni Relations Team", createdAt: "Jun 5, 2025", timeline: { firstView: "5 min after send", peakViews: "2 hours after send", lastView: "6 days after send" } },
  { id: "vc6", title: "Graduation Congratulations", campaignName: "Commencement – Class of 2025", thumbnail: "https://images.unsplash.com/photo-1738949538943-e54722a44ffc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwZ3JhZHVhdGlvbiUyMGNlcmVtb255fGVufDF8fHx8MTc3MjUyMjUzMXww&ixlib=rb-4.1.0&q=80&w=1080", duration: "1:22", openRate: 69.8, clickRate: 28.5, views: 342, avgCompletion: 63, sender: "President Linda Hayes", createdAt: "May 18, 2025", timeline: { firstView: "3 min after send", peakViews: "8 hours after send", lastView: "14 days after send" } },
  { id: "vc7", title: "Campus Life Spotlight", campaignName: "Student Video Testimonials", thumbnail: "https://images.unsplash.com/photo-1656321717360-be568acc171b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwc3R1ZGVudCUyMHZpZGVvfGVufDF8fHx8MTc3MjU3NzE5MXww&ixlib=rb-4.1.0&q=80&w=1080", duration: "2:51", openRate: 61.8, clickRate: 26.5, views: 14, avgCompletion: 34, sender: "Student Affairs", createdAt: "Nov 10, 2025", timeline: { firstView: "42 min after send", peakViews: "5 hours after send", lastView: "3 days after send" } },
  { id: "vc8", title: "VP of Advancement Intro", campaignName: "Donor Update – FY26", thumbnail: "https://images.unsplash.com/photo-1758273705996-bdeefbdbce5e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbiUyMHNwZWFraW5nJTIwY2FtZXJhfGVufDF8fHx8MTc3MjU3NzE5MXww&ixlib=rb-4.1.0&q=80&w=1080", duration: "1:35", openRate: 58.2, clickRate: 22.1, views: 410, avgCompletion: 71, sender: "VP Jennifer Park", createdAt: "Oct 1, 2025", timeline: { firstView: "9 min after send", peakViews: "4 hours after send", lastView: "10 days after send" } },
];

// Derived aggregations — computed from full CAMPAIGN_STATS (used by OVERALL_AVG)
const totalDelivered = CAMPAIGN_STATS.reduce((s, c) => s + c.delivered, 0);
const totalOpened = CAMPAIGN_STATS.reduce((s, c) => s + c.opened, 0);
const totalClicked = CAMPAIGN_STATS.reduce((s, c) => s + c.clicked, 0);
const totalViewed = CAMPAIGN_STATS.reduce((s, c) => s + c.views, 0);
const totalReplies = CAMPAIGN_STATS.reduce((s, c) => s + c.replied, 0);
const industryOpenRate = "21.3";
const industryClickRate = "2.6";
// Overall averages for comparison bars in Performance by Category
const OVERALL_AVG = {
  openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
  clickRate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0,
  replyRate: totalDelivered > 0 ? (totalReplies / totalDelivered) * 100 : 0,
  videoPct: CAMPAIGN_STATS.length > 0
    ? CAMPAIGN_STATS.reduce((s, c) => s + c.avgVideoPct * c.views, 0) / Math.max(totalViewed, 1)
    : 0,
};

// ── Campaign Goals / Success Metrics ──────────────────────────────────────
type GoalMetric = "Open Rate" | "Click Rate" | "Reply Rate" | "Video Completion" | "CTA Rate";
type GoalStatus = "met" | "not_met";

type CampaignGoal = {
  campaignName: string;
  metric: GoalMetric;
  target: number;       // target % value
  actual: number;       // actual % achieved
  status: GoalStatus;   // derived from target vs actual
  sent: number;
  tag: CampaignTag;
};

const GOAL_METRIC_COLORS: Record<GoalMetric, string> = {
  "Open Rate": TV.textBrand,
  "Click Rate": TV.info,
  "Reply Rate": TV.success,
  "Video Completion": TV.warning,
  "CTA Rate": TV.warning,
};

// Mock goals — each campaign can have one success metric set by the user
const CAMPAIGN_GOALS: CampaignGoal[] = (() => {
  const goals: CampaignGoal[] = [];
  const goalDefs: { name: string; metric: GoalMetric; target: number }[] = [
    { name: "Spring Annual Fund Appeal", metric: "Open Rate", target: 80 },
    { name: "Welcome Message – Class of 2026", metric: "Open Rate", target: 85 },
    { name: "Board Outreach", metric: "Reply Rate", target: 50 },
    { name: "Major Gift Cultivation – Q1", metric: "Click Rate", target: 50 },
    { name: "Student Video Testimonials", metric: "Video Completion", target: 60 },
    { name: "Birthday Greetings – FY25", metric: "Open Rate", target: 75 },
    { name: "Birthday Greetings – FY26", metric: "Open Rate", target: 80 },
    { name: "Work Anniversary – FY25", metric: "Reply Rate", target: 10 },
    { name: "Donor Anniversary – FY26", metric: "Open Rate", target: 80 },
    { name: "Career Update – New Roles Q1", metric: "Click Rate", target: 30 },
    { name: "Career Milestone Celebrations", metric: "CTA Rate", target: 15 },
  ];

  // Also add goals for some generated campaigns
  const generatedGoalSample = [
    { nameIncludes: "Thank You", metric: "Open Rate" as GoalMetric, target: 70 },
    { nameIncludes: "Giving Day", metric: "CTA Rate" as GoalMetric, target: 20 },
    { nameIncludes: "Stewardship", metric: "Reply Rate" as GoalMetric, target: 12 },
    { nameIncludes: "Event Recap", metric: "Video Completion" as GoalMetric, target: 55 },
    { nameIncludes: "Reunion", metric: "Open Rate" as GoalMetric, target: 65 },
    { nameIncludes: "Impact Report", metric: "Click Rate" as GoalMetric, target: 35 },
    { nameIncludes: "Endowment Report", metric: "Open Rate" as GoalMetric, target: 75 },
    { nameIncludes: "Legacy Society", metric: "Reply Rate" as GoalMetric, target: 15 },
    { nameIncludes: "Donor Update", metric: "Open Rate" as GoalMetric, target: 70 },
    { nameIncludes: "Alumni Spotlight", metric: "Click Rate" as GoalMetric, target: 25 },
    { nameIncludes: "1:1", metric: "Video Completion" as GoalMetric, target: 50 },
    { nameIncludes: "Video Request", metric: "Video Completion" as GoalMetric, target: 45 },
  ];

  for (const gd of goalDefs) {
    const c = CAMPAIGN_STATS.find(cs => cs.name === gd.name);
    if (!c) continue;
    const actual = getActual(c, gd.metric);
    goals.push({
      campaignName: c.name, metric: gd.metric, target: gd.target,
      actual, status: getGoalStatus(actual, gd.target), sent: c.sent, tag: c.tag,
    });
  }
  for (const gs of generatedGoalSample) {
    const c = CAMPAIGN_STATS.find(cs => cs.name.includes(gs.nameIncludes) && !goals.some(g => g.campaignName === cs.name));
    if (!c) continue;
    const actual = getActual(c, gs.metric);
    goals.push({
      campaignName: c.name, metric: gs.metric, target: gs.target,
      actual, status: getGoalStatus(actual, gs.target), sent: c.sent, tag: c.tag,
    });
  }
  return goals;
})();

function getActual(c: CampaignStat, metric: GoalMetric): number {
  switch (metric) {
    case "Open Rate": return c.delivered > 0 ? parseFloat(((c.opened / c.delivered) * 100).toFixed(1)) : 0;
    case "Click Rate": return c.delivered > 0 ? parseFloat(((c.clicked / c.delivered) * 100).toFixed(1)) : 0;
    case "Reply Rate": return c.delivered > 0 ? parseFloat(((c.replied / c.delivered) * 100).toFixed(1)) : 0;
    case "Video Completion": return c.avgVideoPct;
    case "CTA Rate": return c.delivered > 0 ? parseFloat(((c.ctaClicks / c.delivered) * 100).toFixed(1)) : 0;
  }
}

function getGoalStatus(actual: number, target: number): GoalStatus {
  return actual >= target ? "met" : "not_met";
}

const GOAL_STATUS_STYLES: Record<GoalStatus, { label: string; color: string; bg: string; icon: typeof Trophy }> = {
  met:     { label: "Met",      color: TV.success,       bg: TV.successBg,    icon: Trophy },
  not_met: { label: "Not Met",  color: TV.danger,        bg: TV.dangerBg,      icon: CircleAlert },
};

// ── Per-metric contact drilldown data ──────────────────────────────────────
// Each contact has enriched fields for the drilldown table
type EngagementStatus = "active" | "at_risk" | "lapsed" | "new";
const ENGAGEMENT_STYLES: Record<EngagementStatus, { label: string; color: string; bg: string }> = {
  active:  { label: "Active",  color: TV.success, bg: TV.successBg },
  at_risk: { label: "At Risk", color: TV.warning, bg: TV.warningBg },
  lapsed:  { label: "Lapsed",  color: TV.danger, bg: TV.dangerBg },
  new:     { label: "New",     color: TV.info, bg: TV.infoBg },
};

type MetricContact = {
  name: string; email: string; donorId: string; phone: string;
  totalSends: number; lastReceived: string; avatar: string; avatarColor: string;
  /** How many times this contact triggered the specific metric in the current period */
  occurrences?: number;
  /** Engagement health status */
  engagementStatus: EngagementStatus;
  /** Campaign(s) this contact appeared in */
  campaigns: string[];
  /** City / location */
  city: string;
  /** Recipient lists this contact belongs to */
  lists: string[];
  /** Campaign sender(s) who sent to this contact */
  senders: string[];
};

const ALL_CONTACTS: MetricContact[] = [
  { name: "James Whitfield", email: "j.whitfield@alumni.edu", donorId: "DN-10041", phone: "(617) 555-0142", totalSends: 6, lastReceived: "Feb 14, 2026", avatar: "JW", avatarColor: TV.brand, occurrences: 4, engagementStatus: "active", campaigns: ["Spring Thank You", "Donor Update Q1"], city: "Boston, MA", lists: ["Major Donors", "Alumni 2020"], senders: ["Kelley Molt", "James Okafor"] },
  { name: "Sarah Chen", email: "s.chen@foundation.org", donorId: "DN-10042", phone: "(415) 555-0198", totalSends: 6, lastReceived: "Feb 14, 2026", avatar: "SC", avatarColor: TV.info, occurrences: 5, engagementStatus: "active", campaigns: ["Spring Thank You", "Impact Report 2025"], city: "San Francisco, CA", lists: ["Foundation Partners", "Major Donors"], senders: ["Kelley Molt", "Michelle Park"] },
  { name: "Marcus Reid", email: "m.reid@email.com", donorId: "DN-10043", phone: "(312) 555-0267", totalSends: 4, lastReceived: "Feb 10, 2026", avatar: "MR", avatarColor: TV.success, occurrences: 2, engagementStatus: "at_risk", campaigns: ["Donor Update Q1"], city: "Chicago, IL", lists: ["Alumni 2020"], senders: ["Michelle Park"] },
  { name: "Emily Torres", email: "e.torres@corp.com", donorId: "DN-10044", phone: "(212) 555-0331", totalSends: 6, lastReceived: "Feb 14, 2026", avatar: "ET", avatarColor: TV.warning, occurrences: 3, engagementStatus: "active", campaigns: ["Spring Thank You", "Legacy Society Invite"], city: "New York, NY", lists: ["Corporate Sponsors", "Legacy Society"], senders: ["Kelley Molt", "James Okafor"] },
  { name: "David Park", email: "d.park@alumni.edu", donorId: "DN-10045", phone: "(512) 555-0412", totalSends: 5, lastReceived: "Feb 12, 2026", avatar: "DP", avatarColor: TV.danger, occurrences: 6, engagementStatus: "new", campaigns: ["Spring Thank You", "Alumni Spotlight"], city: "Austin, TX", lists: ["Alumni 2020", "New Donors 2026"], senders: ["James Okafor", "Michelle Park"] },
  { name: "Aisha Johnson", email: "a.johnson@gmail.com", donorId: "DN-10046", phone: "(404) 555-0523", totalSends: 4, lastReceived: "Feb 10, 2026", avatar: "AJ", avatarColor: TV.brand, occurrences: 1, engagementStatus: "lapsed", campaigns: ["Donor Update Q1"], city: "Atlanta, GA", lists: ["Lapsed Donors"], senders: ["Michelle Park"] },
];

// Which contacts appear under each metric key
const METRIC_CONTACTS: Record<string, MetricContact[]> = {
  sent: ALL_CONTACTS,
  delivered: ALL_CONTACTS.slice(0, 5),
  opened: ALL_CONTACTS.slice(0, 4),
  clicked: [ALL_CONTACTS[0], ALL_CONTACTS[1], ALL_CONTACTS[3], ALL_CONTACTS[4]],
  started: ALL_CONTACTS.slice(0, 5),
  finished: [ALL_CONTACTS[0], ALL_CONTACTS[1], ALL_CONTACTS[4]],
  views: ALL_CONTACTS.slice(0, 5),
  avg_view: ALL_CONTACTS.slice(0, 5),
  cta: [ALL_CONTACTS[0], ALL_CONTACTS[1], ALL_CONTACTS[3], ALL_CONTACTS[4]],
  shares: [ALL_CONTACTS[1], ALL_CONTACTS[4]],
  downloads: [ALL_CONTACTS[3], ALL_CONTACTS[4]],
  replies: [ALL_CONTACTS[1], ALL_CONTACTS[4]],
  opened_no_click: [ALL_CONTACTS[0], ALL_CONTACTS[2]],
  didnt_open: [ALL_CONTACTS[5]],
  didnt_click: [ALL_CONTACTS[0], ALL_CONTACTS[2], ALL_CONTACTS[5]],
  viewed: ALL_CONTACTS.slice(0, 5),
  didnt_view: [ALL_CONTACTS[5]],
  unsubscribed: [ALL_CONTACTS[5]],
  bounced: [],
  spam: [],
  // Portal health metrics (not contact-specific, show aggregate info)
  accountHealth: [],
  smsOptOut: [],
  // Benchmark metrics (not contact-specific)
  unsubscribeRate: [ALL_CONTACTS[5]],
  spamRate: [],
  bounceRate: [],
  industryOpen: [],
  industryClick: [],
};

// ── Stat bar metric definitions (Figma-style cards) ───────��────────────────
type StatMetricDef = {
  key: string;
  label: string;
  value: string;
  sub: string;
  subColor: "green" | "gray" | "red";
  iconColor: string;
  iconBg: string;
  icon: React.ComponentType<{ size?: number }>;
  description: string;
};

// Core metrics always shown in the hero section (not removable)
const CORE_KEYS = ["sent", "delivered", "opened", "clicked"];
// Default extra metrics shown in the grid below the hero section
const DEFAULT_EXTRA_KEYS = ["opened_no_click", "didnt_open", "unsubscribed", "bounced", "started", "finished", "views", "avg_view", "cta", "shares", "downloads", "replies", "accountHealth", "smsOptOut"];

// Funnel category shape (used by FunnelRow component)
type FunnelCategory = { key: string; label: string; count: number; color: string };

// Endowment (ODDER) data
// Feature flag: only show ODDER sections if the customer has ODDER enabled
const HAS_ODDER = true; // In production, this would come from org feature flags / subscription tier

type OdderPdf = {
  id: number;
  label: string;
  // Delivery-level metrics (per-PDF; all PDFs in one email share delivery stats)
  sends: number;
  delivered: number;
  opened: number;          // email opens (between delivered and PDF viewed)
  unsubRate: string;
  spamRate: string;
  bounceRate: string;
  // PDF engagement metrics
  uniqueViews: number;
  totalViews: number;
  downloads: number;
  prints: number;
  shares: number;
  requestPrint: number;
  avgCompletion: string;
  completedReaders: number; // recipients who read ≥90% of the PDF
  actionTakers: number;     // recipients who took ≥1 action (download/print/share/request)
};

type OdderCampaign = {
  id: number;
  name: string;
  pdfDocuments: OdderPdf[];
};

const ODDER_CAMPAIGNS: OdderCampaign[] = [
  {
    id: 1, name: "Scholarship Endowment Report 2025",
    pdfDocuments: [
      // Sent to all donors — broadest audience
      { id: 1, label: "Endowment Summary", sends: 4891, delivered: 4783, opened: 3842, unsubRate: "0.08%", spamRate: "0.00%", bounceRate: "2.21%", uniqueViews: 2148, totalViews: 4102, downloads: 1012, prints: 278, shares: 142, requestPrint: 68, avgCompletion: "78.2%", completedReaders: 1678, actionTakers: 1284 },
      // Sent to investment-committee members + major gift donors
      { id: 2, label: "Investment Performance", sends: 1820, delivered: 1794, opened: 1512, unsubRate: "0.11%", spamRate: "0.00%", bounceRate: "1.43%", uniqueViews: 1842, totalViews: 3412, downloads: 612, prints: 156, shares: 82, requestPrint: 42, avgCompletion: "72.4%", completedReaders: 1334, actionTakers: 798 },
      // Sent to scholarship recipients + their families
      { id: 3, label: "Donor Impact Statement", sends: 3204, delivered: 3148, opened: 2486, unsubRate: "0.16%", spamRate: "0.03%", bounceRate: "1.75%", uniqueViews: 1456, totalViews: 2689, downloads: 488, prints: 98, shares: 124, requestPrint: 34, avgCompletion: "68.1%", completedReaders: 992, actionTakers: 648 },
    ],
  },
  {
    id: 2, name: "Hartwell Foundation Annual Report",
    pdfDocuments: [
      // Sent to all foundation stakeholders
      { id: 4, label: "Annual Report Summary", sends: 2340, delivered: 2288, opened: 1814, unsubRate: "0.26%", spamRate: "0.00%", bounceRate: "2.22%", uniqueViews: 1241, totalViews: 2012, downloads: 418, prints: 92, shares: 56, requestPrint: 28, avgCompletion: "71.8%", completedReaders: 893, actionTakers: 524 },
      // Sent to board members + finance committee only
      { id: 5, label: "Financial Statements", sends: 486, delivered: 482, opened: 441, unsubRate: "0.00%", spamRate: "0.00%", bounceRate: "0.82%", uniqueViews: 898, totalViews: 1456, downloads: 312, prints: 68, shares: 34, requestPrint: 18, avgCompletion: "64.2%", completedReaders: 577, actionTakers: 386 },
    ],
  },
];

// ODDER Recipient-level data — per-donor engagement for endowment reports
type OdderRecipient = {
  name: string;
  email: string;
  donorId: string;
  avatar: string;
  avatarColor: string;
  campaign: string;
  openedEmail: boolean;
  viewedPdf: boolean;
  pdfCompletion: number;   // 0–100
  downloaded: boolean;
  printed: boolean;
  shared: boolean;
  requestedPrint: boolean;
  engagementStatus: EngagementStatus;
  lastActivity: string;
};

const ODDER_RECIPIENTS: OdderRecipient[] = [
  { name: "Margaret Chen", email: "m.chen@foundation.org", donorId: "DN-20101", avatar: "MC", avatarColor: TV.brand, campaign: "Scholarship Endowment Report 2025", openedEmail: true, viewedPdf: true, pdfCompletion: 100, downloaded: true, printed: false, shared: true, requestedPrint: false, engagementStatus: "active", lastActivity: "Feb 18, 2026" },
  { name: "Robert Hartwell III", email: "r.hartwell@hartwell.org", donorId: "DN-20102", avatar: "RH", avatarColor: TV.info, campaign: "Hartwell Foundation Annual Report", openedEmail: true, viewedPdf: true, pdfCompletion: 92, downloaded: true, printed: true, shared: false, requestedPrint: true, engagementStatus: "active", lastActivity: "Feb 17, 2026" },
  { name: "Linda Morales", email: "l.morales@alumni.edu", donorId: "DN-20103", avatar: "LM", avatarColor: TV.success, campaign: "Scholarship Endowment Report 2025", openedEmail: true, viewedPdf: true, pdfCompletion: 85, downloaded: false, printed: false, shared: false, requestedPrint: false, engagementStatus: "active", lastActivity: "Feb 16, 2026" },
  { name: "William Nguyen", email: "w.nguyen@corp.com", donorId: "DN-20104", avatar: "WN", avatarColor: TV.warning, campaign: "Scholarship Endowment Report 2025", openedEmail: true, viewedPdf: true, pdfCompletion: 64, downloaded: true, printed: false, shared: true, requestedPrint: false, engagementStatus: "active", lastActivity: "Feb 15, 2026" },
  { name: "Patricia Evans", email: "p.evans@gmail.com", donorId: "DN-20105", avatar: "PE", avatarColor: TV.danger, campaign: "Hartwell Foundation Annual Report", openedEmail: true, viewedPdf: true, pdfCompletion: 48, downloaded: false, printed: false, shared: false, requestedPrint: false, engagementStatus: "at_risk", lastActivity: "Feb 14, 2026" },
  { name: "David Kimura", email: "d.kimura@university.edu", donorId: "DN-20106", avatar: "DK", avatarColor: TV.brand, campaign: "Scholarship Endowment Report 2025", openedEmail: true, viewedPdf: false, pdfCompletion: 0, downloaded: false, printed: false, shared: false, requestedPrint: false, engagementStatus: "at_risk", lastActivity: "Feb 12, 2026" },
  { name: "Susan Blackwell", email: "s.blackwell@donors.org", donorId: "DN-20107", avatar: "SB", avatarColor: "#0369a1", campaign: "Hartwell Foundation Annual Report", openedEmail: true, viewedPdf: false, pdfCompletion: 0, downloaded: false, printed: false, shared: false, requestedPrint: false, engagementStatus: "at_risk", lastActivity: "Feb 10, 2026" },
  { name: "Thomas Ortega", email: "t.ortega@legacy.edu", donorId: "DN-20108", avatar: "TO", avatarColor: "#be123c", campaign: "Scholarship Endowment Report 2025", openedEmail: false, viewedPdf: false, pdfCompletion: 0, downloaded: false, printed: false, shared: false, requestedPrint: false, engagementStatus: "lapsed", lastActivity: "—" },
  { name: "Janet Whitmore", email: "j.whitmore@email.com", donorId: "DN-20109", avatar: "JW", avatarColor: "#a16207", campaign: "Hartwell Foundation Annual Report", openedEmail: false, viewedPdf: false, pdfCompletion: 0, downloaded: false, printed: false, shared: false, requestedPrint: false, engagementStatus: "lapsed", lastActivity: "—" },
  { name: "Charles Fitzpatrick", email: "c.fitz@alumni.edu", donorId: "DN-20110", avatar: "CF", avatarColor: "#4f46e5", campaign: "Scholarship Endowment Report 2025", openedEmail: true, viewedPdf: true, pdfCompletion: 100, downloaded: true, printed: true, shared: true, requestedPrint: true, engagementStatus: "active", lastActivity: "Feb 19, 2026" },
];

// CSV export helper for ODDER data
function exportOdderCsv() {
  const headers = ["Campaign", "PDF Document", "Sends", "Delivered", "Opened", "Unsub Rate", "Spam Rate", "Bounce Rate", "Unique Views", "Total Views", "Downloads", "Prints", "Shares", "Request Print Copies", "Avg Completion", "Completed Readers", "Action Takers"];
  const rows: string[][] = [];
  for (const c of ODDER_CAMPAIGNS) {
    for (const p of c.pdfDocuments) {
      rows.push([
        c.name, p.label, String(p.sends), String(p.delivered), String(p.opened),
        p.unsubRate, p.spamRate, p.bounceRate,
        String(p.uniqueViews), String(p.totalViews), String(p.downloads),
        String(p.prints), String(p.shares), String(p.requestPrint), p.avgCompletion,
        String(p.completedReaders), String(p.actionTakers),
      ]);
    }
  }
  const csvContent = [headers, ...rows].map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "odder_endowment_metrics.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// PDF Campaign data (non-endowment campaigns that include PDF attachments)
const PDF_CAMPAIGNS = [
  { id: 10, name: "Board Member Information Packet 2026", sends: 22, delivered: 22, unsubRate: "0.0%", spamRate: "0.0%", bounceRate: "0.0%", uniqueViews: 18, totalViews: 31, downloads: 14, prints: 6, shares: 3, requestPrint: 2, avgCompletion: "81.4%" },
  { id: 11, name: "Campaign Toolkit – Spring 2026", sends: 145, delivered: 142, unsubRate: "0.0%", spamRate: "0.0%", bounceRate: "2.1%", uniqueViews: 98, totalViews: 178, downloads: 67, prints: 12, shares: 8, requestPrint: 4, avgCompletion: "72.3%" },
  { id: 12, name: "Donor Welcome Kit – Q1 2026", sends: 310, delivered: 304, unsubRate: "0.3%", spamRate: "0.0%", bounceRate: "1.9%", uniqueViews: 201, totalViews: 348, downloads: 112, prints: 28, shares: 19, requestPrint: 8, avgCompletion: "69.8%" },
  { id: 13, name: "Alumni Benefits Guide 2026", sends: 1250, delivered: 1218, unsubRate: "0.2%", spamRate: "0.0%", bounceRate: "2.6%", uniqueViews: 642, totalViews: 1089, downloads: 284, prints: 56, shares: 41, requestPrint: 14, avgCompletion: "65.1%" },
  { id: 14, name: "Giving Tuesday Impact Report", sends: 3780, delivered: 3691, unsubRate: "0.1%", spamRate: "0.0%", bounceRate: "2.4%", uniqueViews: 1892, totalViews: 3104, downloads: 814, prints: 142, shares: 98, requestPrint: 38, avgCompletion: "74.6%" },
];

// 1:1 Video metrics (with campaign associations and time-period breakdowns)
// Each user has data bucketed by period so the time period filter adjusts summation
const VIDEO_1_1_RAW: {
  user: string;
  campaigns: string[];
  periods: { period: string; recorded: number; views: number; ctaInteractions: number; startedPct: number; finishedPct: number; avgDurationSecs: number }[];
}[] = [
  {
    user: "Kelley Molt", campaigns: ["Spring Outreach 2026", "Scholarship Thank-You"],
    periods: [
      { period: "last_30", recorded: 128, views: 814, ctaInteractions: 234, startedPct: 87.1, finishedPct: 61.4, avgDurationSecs: 62 },
      { period: "last_90", recorded: 410, views: 2580, ctaInteractions: 731, startedPct: 86.5, finishedPct: 60.8, avgDurationSecs: 63 },
      { period: "last_6m", recorded: 680, views: 4280, ctaInteractions: 1210, startedPct: 86.3, finishedPct: 60.4, avgDurationSecs: 62 },
      { period: "all_time", recorded: 842, views: 5298, ctaInteractions: 1498, startedPct: 86.2, finishedPct: 60.2, avgDurationSecs: 62 },
    ],
  },
  {
    user: "Michelle Park", campaigns: ["Spring Outreach 2026", "Alumni Reunion Invite"],
    periods: [
      { period: "last_30", recorded: 92, views: 638, ctaInteractions: 172, startedPct: 83.0, finishedPct: 64.2, avgDurationSecs: 54 },
      { period: "last_90", recorded: 274, views: 1905, ctaInteractions: 510, startedPct: 82.4, finishedPct: 63.5, avgDurationSecs: 54 },
      { period: "last_6m", recorded: 458, views: 3170, ctaInteractions: 845, startedPct: 82.2, finishedPct: 63.2, avgDurationSecs: 54 },
      { period: "all_time", recorded: 567, views: 3918, ctaInteractions: 1041, startedPct: 82.1, finishedPct: 63.1, avgDurationSecs: 54 },
    ],
  },
  {
    user: "James Okafor", campaigns: ["Scholarship Thank-You", "Giving Tuesday 2025"],
    periods: [
      { period: "last_30", recorded: 58, views: 452, ctaInteractions: 146, startedPct: 90.2, finishedPct: 62.8, avgDurationSecs: 72 },
      { period: "last_90", recorded: 168, views: 1305, ctaInteractions: 416, startedPct: 89.4, finishedPct: 62.1, avgDurationSecs: 72 },
      { period: "last_6m", recorded: 280, views: 2168, ctaInteractions: 688, startedPct: 89.1, finishedPct: 61.9, avgDurationSecs: 72 },
      { period: "all_time", recorded: 345, views: 2673, ctaInteractions: 845, startedPct: 89.0, finishedPct: 61.8, avgDurationSecs: 72 },
    ],
  },
  {
    user: "Sarah Hernandez", campaigns: ["Alumni Reunion Invite", "Giving Tuesday 2025", "Spring Outreach 2026"],
    periods: [
      { period: "last_30", recorded: 50, views: 381, ctaInteractions: 118, startedPct: 85.4, finishedPct: 61.6, avgDurationSecs: 58 },
      { period: "last_90", recorded: 151, views: 1140, ctaInteractions: 350, startedPct: 84.8, finishedPct: 61.0, avgDurationSecs: 58 },
      { period: "last_6m", recorded: 252, views: 1893, ctaInteractions: 578, startedPct: 84.6, finishedPct: 60.8, avgDurationSecs: 58 },
      { period: "all_time", recorded: 312, views: 2341, ctaInteractions: 712, startedPct: 84.5, finishedPct: 60.7, avgDurationSecs: 58 },
    ],
  },
  {
    user: "David Chen", campaigns: ["Spring Outreach 2026"],
    periods: [
      { period: "last_30", recorded: 34, views: 218, ctaInteractions: 58, startedPct: 80.5, finishedPct: 55.8, avgDurationSecs: 48 },
      { period: "last_90", recorded: 102, views: 654, ctaInteractions: 172, startedPct: 80.2, finishedPct: 55.4, avgDurationSecs: 48 },
      { period: "last_6m", recorded: 170, views: 1086, ctaInteractions: 284, startedPct: 80.0, finishedPct: 55.1, avgDurationSecs: 48 },
      { period: "all_time", recorded: 210, views: 1340, ctaInteractions: 350, startedPct: 79.8, finishedPct: 54.9, avgDurationSecs: 48 },
    ],
  },
  {
    user: "Aisha Williams", campaigns: ["Scholarship Thank-You", "Spring Outreach 2026"],
    periods: [
      { period: "last_30", recorded: 44, views: 296, ctaInteractions: 92, startedPct: 88.4, finishedPct: 66.2, avgDurationSecs: 66 },
      { period: "last_90", recorded: 132, views: 885, ctaInteractions: 278, startedPct: 88.0, finishedPct: 65.8, avgDurationSecs: 66 },
      { period: "last_6m", recorded: 220, views: 1472, ctaInteractions: 461, startedPct: 87.8, finishedPct: 65.5, avgDurationSecs: 66 },
      { period: "all_time", recorded: 272, views: 1820, ctaInteractions: 570, startedPct: 87.6, finishedPct: 65.3, avgDurationSecs: 66 },
    ],
  },
];

const VIDEO_1_1_TIME_PERIODS = [
  { value: "last_30", label: "Last 30 days" },
  { value: "last_90", label: "Last 90 days" },
  { value: "last_6m", label: "Last 6 months" },
  { value: "all_time", label: "All time" },
];

/** Helper: resolve a user's data for the selected time period */
function getVideo1_1Row(raw: (typeof VIDEO_1_1_RAW)[0], period: string) {
  const p = raw.periods.find(pp => pp.period === period) ?? raw.periods[raw.periods.length - 1];
  const ctaPct = p.views > 0 ? ((p.ctaInteractions / p.views) * 100).toFixed(1) : "0.0";
  const durMin = Math.floor(p.avgDurationSecs / 60);
  const durSec = String(p.avgDurationSecs % 60).padStart(2, "0");
  return {
    user: raw.user,
    campaigns: raw.campaigns,
    recorded: p.recorded,
    views: p.views,
    ctaInteractions: p.ctaInteractions,
    ctaPct: `${ctaPct}%`,
    startedPct: `${p.startedPct.toFixed(1)}%`,
    finishedPct: `${p.finishedPct.toFixed(1)}%`,
    avgDuration: `${durMin}:${durSec}`,
    startedPctNum: p.startedPct,
    finishedPctNum: p.finishedPct,
    avgDurationSecs: p.avgDurationSecs,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═════════════════════════════════════════════════════════���═════════════════════

/** Compact inline metric for the KPI strip */
function Kpi({ label, value, sub, warn, good }: { label: string; value: string; sub?: string; warn?: boolean; good?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 min-w-0 flex-1">
      <span className="text-[10px] uppercase tracking-wider whitespace-nowrap" style={{ color: TV.textSecondary }}>{label}</span>
      <span className="text-[15px] xl:text-[17px] font-bold font-display leading-none whitespace-nowrap" style={{ color: warn ? TV.danger : good ? TV.success : TV.textPrimary }}>{value}</span>
      {sub && <span className="text-[10px] whitespace-nowrap" style={{ color: TV.textDecorative }}>{sub}</span>}
    </div>
  );
}

/** Thin progress bar */
function MiniBar({ pct, color }: { pct: number; color: string }) {
  const display = Number.isInteger(pct) ? `${pct}%` : `${pct.toFixed(1)}%`;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: TV.borderLight, minWidth: 32 }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }} />
      </div>
      <span className="text-[12px] font-semibold w-10 text-right whitespace-nowrap" style={{ color: TV.textPrimary }}>{display}</span>
    </div>
  );
}

const METRIC_LABELS: Record<string, string> = { sends: "Sent", opens: "Opens", clicks: "Clicks", views: "Views", replies: "Replies" };

// Lighter accent colors for tooltip display
const TOOLTIP_COLORS: Record<string, string> = { sends: "#999999", opens: "#a06dd4", clicks: "#2fafc4", views: "#3db86a", replies: "#d4880f" };

/** Custom tooltip for the engagement chart — shows total + top campaign breakdown.
 *  Caches last-shown data so the tooltip stays visible while the user hovers over it. */
function EngagementTooltip({ active, payload, label, chartMode, chartColor, filteredCampaignNames, onCampaignClick, onDrillDown }: any) {
  const [isHovering, setIsHovering] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const cacheRef = useRef<{ label: string; total: number; sorted: any[]; metricLabel: string } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const tooltipColor = TOOLTIP_COLORS[chartMode] || chartColor;

  // When chart reports active data, update the cache
  if (active && payload?.length) {
    const total = payload[0]?.value ?? 0;
    const metricLabel = METRIC_LABELS[chartMode] || chartMode;
    const rawBreakdown = TREND_CAMPAIGN_BREAKDOWN[label];
    const breakdown = rawBreakdown && filteredCampaignNames?.size > 0
      ? rawBreakdown.filter((b: any) => filteredCampaignNames.has(b.campaign))
      : rawBreakdown;
    const sorted = breakdown
      ? [...breakdown].sort((a: any, b: any) => (b[chartMode as keyof typeof b] as number) - (a[chartMode as keyof typeof a] as number)).slice(0, 5)
      : [];
    cacheRef.current = { label, total, sorted, metricLabel };
  }

  // Schedule hide when chart becomes inactive and not hovering/pinned
  useEffect(() => {
    if (!active && !isHovering && !isPinned) {
      hideTimer.current = setTimeout(() => { cacheRef.current = null; }, 150);
    }
    return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
  }, [active, isHovering, isPinned]);

  // Escape key unpins
  useEffect(() => {
    if (!isPinned) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsPinned(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isPinned]);

  const handleMouseEnter = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setIsHovering(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);
  const handlePin = useCallback(() => {
    setIsPinned(prev => !prev);
  }, []);

  const data = (active && payload?.length) ? cacheRef.current : ((isHovering || isPinned) ? cacheRef.current : null);
  if (!data) return null;

  const { total, sorted, metricLabel } = data;
  const displayLabel = data.label;
  const topMax = sorted.length ? (sorted[0][chartMode as keyof (typeof sorted)[0]] as number) : 1;

  return (
    <div
      onClick={handlePin}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: `1px solid ${isPinned ? TV.borderStrong : TV.borderLight}`,
        boxShadow: isPinned ? "0 6px 24px rgba(0,0,0,0.14)" : "0 4px 20px rgba(0,0,0,0.10)",
        padding: "10px 14px",
        minWidth: 220,
        maxWidth: 280,
        pointerEvents: "auto",
        cursor: isPinned ? "default" : "pointer",
        transition: "border-color 150ms, box-shadow 150ms",
      }}
    >
      {/* Pinned indicator bar */}
      {isPinned && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: TV.textBrand, display: "flex", alignItems: "center", gap: 4 }}>
            <Pin size={10} /> Pinned
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setIsPinned(false); }}
            style={{ background: "none", border: "none", padding: 2, cursor: "pointer", color: TV.textSecondary, display: "flex", alignItems: "center", borderRadius: 4 }}
            onMouseEnter={e => (e.currentTarget.style.color = TV.textPrimary)}
            onMouseLeave={e => (e.currentTarget.style.color = TV.textSecondary)}
          >
            <X size={12} />
          </button>
        </div>
      )}
      {!isPinned && isHovering && (
        <div style={{ fontSize: 9, color: TV.textDecorative, textAlign: "center", marginBottom: 4, opacity: 0.8 }}>Click to pin</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: TV.textSecondary }}>{displayLabel}</span>
        <span style={{ fontSize: 15, fontWeight: 700, color: tooltipColor }}>{total} {metricLabel}</span>
      </div>
      <div style={{ height: 1, background: TV.borderLight, marginBottom: 8 }} />
      {sorted.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: TV.textSecondary, marginBottom: 6 }}>
            Top campaigns
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {sorted.map((row) => {
              const val = row[chartMode as keyof typeof row] as number;
              const pct = topMax > 0 ? (val / topMax) * 100 : 0;
              return (
                <div key={row.campaign}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span
                      onClick={(e) => { e.stopPropagation(); if (onCampaignClick) onCampaignClick(row.campaign); }}
                      className={onCampaignClick ? "cursor-pointer hover:underline" : ""}
                      style={{ fontSize: 11, color: onCampaignClick ? TV.textBrand : TV.textPrimary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 170, display: "inline-block" }}
                    >
                      {row.campaign}
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: tooltipColor, marginLeft: 8, flexShrink: 0 }}>{val}</span>
                  </div>
                  <div style={{ height: 3, borderRadius: 2, background: TV.borderLight }}>
                    <div style={{ height: 3, borderRadius: 2, background: tooltipColor, opacity: 0.6, width: `${pct}%`, transition: "width 150ms" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      {/* Drill-down CTA */}
      <div
        onClick={(e) => { e.stopPropagation(); if (onDrillDown && displayLabel) onDrillDown(displayLabel); }}
        className="cursor-pointer"
        style={{
          marginTop: 8,
          paddingTop: 8,
          borderTop: `1px solid ${TV.borderLight}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 600,
          color: TV.textBrand,
          transition: "opacity 150ms",
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
        onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
      >
        Click for full breakdown →
      </div>
    </div>
  );
}


// ── Analytics Filter Definitions ──────────────────────────────────────────────

const ANALYTICS_FILTERS: FilterDef[] = [
  {
    key: "campaign", label: "Campaign", icon: Film, group: "Scope", type: "multi-select", essential: true,
    options: CAMPAIGN_STATS.map(c => ({ value: c.name, label: c.name })),
  },
  {
    key: "dateRange", label: "Date Range", icon: CalendarRange, group: "Scope", type: "date-range", essential: true,
    options: [], // date-range type uses its own calendar picker
  },
  {
    key: "creator", label: "Created By", icon: Users, group: "Campaign", type: "select", essential: true,
    options: [
      { value: "Kelley Molt", label: "Kelley Molt" },
      { value: "James Okafor", label: "James Okafor" },
      { value: "Michelle Park", label: "Michelle Park" },
      { value: "Sarah Hernandez", label: "Sarah Hernandez" },
      { value: "David Nguyen", label: "David Nguyen" },
      { value: "Rachel Thompson", label: "Rachel Thompson" },
      { value: "Marcus Williams", label: "Marcus Williams" },
      { value: "Amy Chen", label: "Amy Chen" },
    ],
  },
  {
    key: "creationDate", label: "Creation Date", icon: CalendarRange, group: "Campaign", type: "select",
    options: [
      { value: "last_7", label: "Last 7 days" },
      { value: "last_30", label: "Last 30 days" },
      { value: "last_90", label: "Last 90 days" },
      { value: "last_6m", label: "Last 6 months" },
      { value: "last_1y", label: "Last year" },
      { value: "all", label: "All time" },
    ],
  },
  {
    key: "lastSendDate", label: "Last Send Date", icon: Send, group: "Campaign", type: "select",
    options: [
      { value: "last_7", label: "Last 7 days" },
      { value: "last_30", label: "Last 30 days" },
      { value: "last_90", label: "Last 90 days" },
      { value: "last_6m", label: "Last 6 months" },
      { value: "never", label: "Never sent" },
    ],
  },
  {
    key: "deliveryMethod", label: "Delivery Method", icon: Send, group: "Campaign", type: "select",
    options: [
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS" },
      { value: "shareable-link", label: "Shareable Link" },
    ],
  },
  {
    key: "campaignType", label: "Tag", icon: Film, group: "Campaign", type: "select",
    options: [
      { value: "thank_you", label: "Thank You" },
      { value: "solicitation", label: "Solicitation" },
      { value: "video_request", label: "Video Request" },
      { value: "event", label: "Event" },
      { value: "update", label: "Update" },
      { value: "endowment", label: "Endowment Report" },
      { value: "birthday", label: "Birthdays" },
      { value: "anniversary", label: "Anniversaries" },
      { value: "career", label: "Career Moves" },
      { value: "other", label: "Other" },
    ],
  },
  {
    key: "recipientList", label: "On List", icon: ListPlus, group: "Recipients", type: "multi-select",
    options: [
      { value: "Major Donors FY26", label: "Major Donors FY26" },
      { value: "Class of 2026", label: "Class of 2026" },
      { value: "Board Members", label: "Board Members" },
      { value: "First-Time Donors FY26", label: "First-Time Donors FY26" },
      { value: "Leadership Circle", label: "Leadership Circle" },
      { value: "Young Alumni (0-10 yrs)", label: "Young Alumni (0-10 yrs)" },
      { value: "Parents — Current Students", label: "Parents — Current Students" },
      { value: "Faculty & Staff", label: "Faculty & Staff" },
    ],
  },
  {
    key: "excludeList", label: "Not on List", icon: ListPlus, group: "Recipients", type: "multi-select",
    options: [
      { value: "Major Donors FY26", label: "Major Donors FY26" },
      { value: "Class of 2026", label: "Class of 2026" },
      { value: "Board Members", label: "Board Members" },
      { value: "First-Time Donors FY26", label: "First-Time Donors FY26" },
      { value: "Leadership Circle", label: "Leadership Circle" },
      { value: "Young Alumni (0-10 yrs)", label: "Young Alumni (0-10 yrs)" },
      { value: "Parents — Current Students", label: "Parents — Current Students" },
      { value: "Faculty & Staff", label: "Faculty & Staff" },
    ],
  },
  {
    key: "location", label: "Location", icon: MapPin, group: "Recipients", type: "multi-select",
    options: [
      { value: "New York", label: "New York" },
      { value: "California", label: "California" },
      { value: "Texas", label: "Texas" },
      { value: "Illinois", label: "Illinois" },
      { value: "Massachusetts", label: "Massachusetts" },
      { value: "Colorado", label: "Colorado" },
    ],
  },
  {
    key: "engagement", label: "Engagement", icon: Eye, group: "Performance", type: "multi-select",
    options: [
      { value: "sent", label: "Sent" },
      { value: "delivered", label: "Delivered" },
      { value: "opened", label: "Opened", color: "green" },
      { value: "opened_no_click", label: "Opened but didn't click", color: "orange" },
      { value: "not_opened", label: "Didn't open", color: "red" },
      { value: "clicked", label: "Clicked", color: "green" },
      { value: "not_clicked", label: "Didn't click", color: "red" },
      { value: "viewed", label: "Viewed", color: "green" },
      { value: "not_viewed", label: "Didn't view", color: "red" },
      { value: "started", label: "Started watching", color: "green" },
      { value: "finished", label: "Finished watching", color: "green" },
      { value: "shared", label: "Shared", color: "green" },
      { value: "cta_clicked", label: "CTA clicked", color: "green" },
      { value: "downloaded", label: "Downloaded" },
      { value: "replied", label: "Replied", color: "green" },
      { value: "unsubscribed", label: "Unsubscribed", color: "red" },
      { value: "bounced", label: "Bounced", color: "orange" },
      { value: "spam", label: "Marked as Spam", color: "red" },
    ],
  },
  {
    key: "donorStatus", label: "Donor Status", icon: ShieldAlert, group: "Recipients", type: "multi-select",
    options: [
      { value: "active", label: "Active Donor", color: "green" },
      { value: "lapsed", label: "Lapsed", color: "orange" },
      { value: "new", label: "New Donor", color: "green" },
      { value: "non-donor", label: "Non-Donor", color: "gray" },
    ],
  },
  {
    key: "givingLevel", label: "Giving Level", icon: Trophy, group: "Recipients", type: "multi-select",
    options: [
      { value: "leadership", label: "Leadership Circle ($10k+)", color: "green" },
      { value: "major", label: "Major Donor ($1k–$10k)", color: "green" },
      { value: "mid", label: "Mid-Level ($250–$999)" },
      { value: "annual", label: "Annual Fund (<$250)" },
      { value: "non-donor", label: "Non-Donor", color: "gray" },
    ],
  },
  {
    key: "engagementScore", label: "Engagement Score", icon: BarChart3, group: "Recipients", type: "multi-select",
    options: [
      { value: "81-100", label: "81–100 (Highly Engaged)", color: "green" },
      { value: "61-80", label: "61–80 (Engaged)" },
      { value: "41-60", label: "41–60 (Moderate)" },
      { value: "21-40", label: "21–40 (Low)", color: "orange" },
      { value: "0-20", label: "0–20 (Disengaged)", color: "red" },
    ],
  },
  {
    key: "graduationYear", label: "Graduation Year", icon: CalendarRange, group: "Recipients", type: "multi-select",
    options: [
      { value: "2026", label: "Class of 2026" },
      { value: "2025", label: "Class of 2025" },
      { value: "2024", label: "Class of 2024" },
      { value: "2023", label: "Class of 2023" },
      { value: "2020-2022", label: "2020–2022" },
      { value: "2015-2019", label: "2015–2019" },
      { value: "2010-2014", label: "2010–2014" },
      { value: "2000-2009", label: "2000–2009" },
      { value: "pre-2000", label: "Before 2000" },
    ],
  },

  {
    key: "constituentType", label: "Constituent Type", icon: Users, group: "Recipients", type: "multi-select",
    options: [
      { value: "alumni", label: "Alumni" },
      { value: "parent", label: "Parent" },
      { value: "student", label: "Current Student" },
      { value: "friend", label: "Friend of Institution" },
      { value: "faculty", label: "Faculty / Staff" },
      { value: "board", label: "Board Member" },
      { value: "prospect", label: "Prospect" },
    ],
  },
  {
    key: "affiliation", label: "Affiliation / School", icon: LayoutDashboard, group: "Recipients", type: "multi-select",
    options: [
      { value: "arts_sciences", label: "Arts & Sciences" },
      { value: "business", label: "Business School" },
      { value: "engineering", label: "Engineering" },
      { value: "law", label: "Law School" },
      { value: "medicine", label: "School of Medicine" },
      { value: "education", label: "School of Education" },
      { value: "other", label: "Other" },
    ],
  },
  {
    key: "device", label: "Device", icon: Smartphone, group: "Performance", type: "select",
    options: [
      { value: "mobile", label: "Mobile" },
      { value: "desktop", label: "Desktop" },
      { value: "tablet", label: "Tablet" },
    ],
  },
];

// ── Export Modal ─────────────────────────────────────────────────────────────

function ExportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { show } = useToast();
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (v: string) => setSelected(s => s.includes(v) ? s.filter(x => x !== v) : [...s, v]);

  const EXPORTS = [
    { id: "campaign_report", label: "Campaign Report", desc: "Full summary of campaign performance with per-campaign breakdowns" },
    { id: "campaign_metrics", label: "Campaign Metrics", desc: "Aggregate KPIs (open, click, bounce, spam, reply rates) by campaign" },
    { id: "recipient_metrics", label: "Recipient Metrics", desc: "Per-recipient engagement data across all campaigns" },
    // Only show ODDER export if the customer has ODDER enabled
    ...(HAS_ODDER ? [{ id: "odder_metrics", label: "Endowment (ODDER) Metrics", desc: "PDF view, download, print, and share data for endowment campaigns" }] : []),
    { id: "pdf_metrics", label: "PDF Metrics", desc: "View, download, print, and share data for PDF-embedded campaigns" },
    { id: "1_1_video", label: "1:1 Video Metrics", desc: "Per-user video recording, view, and engagement data" },
  ];

  const allSelected = selected.length === EXPORTS.length;
  const toggleAll = () => setSelected(allSelected ? [] : EXPORTS.map(e => e.id));

  if (!open) return null;
  return (
    <Modal opened onClose={onClose} title="Request Report Export" size="lg" styles={{
      header: { padding: "16px 20px 12px 20px", borderBottom: `1px solid ${TV.borderDivider}`, minHeight: "unset" },
      title: { fontSize: 15, fontWeight: 900, color: TV.textPrimary, lineHeight: 1.4 },
      body: { padding: "16px 20px 20px 20px" },
      close: { color: TV.textSecondary, width: 28, height: 28, minWidth: 28, minHeight: 28 },
      content: { borderRadius: 20 },
    }}>
      <Text fz={13} c={TV.textSecondary} mb="md">Select one or more reports. They'll be generated and emailed to your address when ready.</Text>
      {/* Select All */}
      <button
        onClick={toggleAll}
        className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-md mb-2 text-left transition-all ${allSelected ? "bg-tv-brand-tint" : "bg-tv-surface-muted hover:bg-tv-brand-tint"}`}
      >
        <Checkbox checked={allSelected} indeterminate={selected.length > 0 && !allSelected} onChange={toggleAll} color="tvPurple" aria-label={`Select all ${EXPORTS.length} reports`} />
        <Text fz={13} fw={600} c={TV.textPrimary}>Select All ({EXPORTS.length} reports)</Text>
      </button>
      <Stack gap="xs" mb="lg">
        {EXPORTS.map(exp => (
          <button key={exp.id} onClick={() => toggle(exp.id)} className={`flex items-start gap-3 p-4 rounded-[14px] border-2 text-left transition-all ${selected.includes(exp.id) ? "border-[#7c45b0] bg-tv-brand-tint" : "border-[#e0daea] bg-white hover:border-[#b5a4cd]"}`}>
            <Checkbox checked={selected.includes(exp.id)} onChange={() => toggle(exp.id)} color="tvPurple" aria-label={exp.label} />
            <div>
              <p className="text-[13px] font-semibold" style={{ color: TV.textPrimary }}>{exp.label}</p>
              <p className="text-[11px]" style={{ color: TV.textSecondary }}>{exp.desc}</p>
            </div>
          </button>
        ))}
      </Stack>
      <div className="flex items-center justify-end gap-2">
        <Button variant="default" onClick={onClose}>Cancel</Button>
        <Button color="tvPurple" leftSection={<Mail size={13} />} disabled={selected.length === 0} onClick={() => { show(`${selected.length} report${selected.length > 1 ? "s" : ""} requested — check your email shortly`, "success"); onClose(); }}>
          Request {selected.length > 0 ? `${selected.length} Report${selected.length > 1 ? "s" : ""}` : "Reports"}
        </Button>
      </div>
    </Modal>
  );
}

// ── Clip Column Customization ────────────────────────────────────────────────

const CLIP_COLUMNS: ColumnDef[] = [
  { key: "title",         label: "Video Clip",     group: "Summary", required: true },
  { key: "campaignName",  label: "Campaign",       group: "Summary" },
  { key: "sender",        label: "Sender",         group: "Summary" },
  { key: "openRate",      label: "Open Rate",      group: "Engagement" },
  { key: "clickRate",     label: "Click Rate",     group: "Engagement" },
  { key: "views",         label: "Views",          group: "Engagement" },
  { key: "avgCompletion", label: "Avg Completion", group: "Engagement" },
];

const DEFAULT_CLIP_COLS = CLIP_COLUMNS.map(c => c.key);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════════���══════════

export function Analytics() {
  const { show } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Email → contact ID mapping for navigation
  const EMAIL_TO_CONTACT_ID: Record<string, number> = {
    "j.whitfield@alumni.edu": 1, "s.chen@foundation.org": 2, "m.reid@email.com": 3,
    "e.torres@corp.com": 4, "d.park@alumni.edu": 5, "a.johnson@gmail.com": 6,
    "l.osei@alumni.edu": 8, "j.blake@alumni.edu": 9,
  };
  const navigateToContact = (send: typeof SEND_RECORDS[0]) => {
    const contactId = EMAIL_TO_CONTACT_ID[send.email];
    if (contactId) navigate(`/contacts/${contactId}?from=analytics&tab=engagement`);
  };
  const [chartMode, setChartMode] = useState<"sends" | "opens" | "clicks" | "views" | "replies">("views");
  const [mainTab, setMainTab] = useState<string | null>(() => {
    const t = searchParams.get("tab");
    return t && ["overview", "performance", "visualizations", "tags", "pdf", "endowment", "video_1_1"].includes(t) ? t : "overview";
  });
  const DEFAULT_ANALYTICS_FILTER_KEYS = ANALYTICS_FILTERS.filter(f => f.essential).map(f => f.key);
  const [analyticsFilterKeys, setAnalyticsFilterKeys] = useState<string[]>(DEFAULT_ANALYTICS_FILTER_KEYS);
  const initCampaign = (() => {
    const c = searchParams.get("campaign");
    return c && CAMPAIGN_STATS.some(cs => cs.name === c) ? c : "";
  })();
  const [analyticsFilterValues, setAnalyticsFilterValues] = useState<FilterValues>({
    ...(initCampaign && initCampaign !== "All Campaigns" ? { campaign: [initCampaign] } : {}),
  });

  // Derive campaign from filter chip selections
  const campaign = analyticsFilterValues.campaign?.[0] ?? "All Campaigns";
  const selectedCampaigns = new Set(analyticsFilterValues.campaign ?? []);
  const hasCampaignFilter = selectedCampaigns.size > 0;
  const [exportOpen, setExportOpen] = useState(false);
  const [activeMetric, setActiveMetric] = useState<string | null>(null);
  const [drillSearch, setDrillSearch] = useState("");
  const [drillSort, setDrillSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "name", dir: "asc" });
  const [drillFilterCampaign, setDrillFilterCampaign] = useState<string[]>([]);
  const [drillFilterStatus, setDrillFilterStatus] = useState<string[]>([]);
  const [drillFilterCity, setDrillFilterCity] = useState<string[]>([]);
  const [drillFilterList, setDrillFilterList] = useState<string[]>([]);
  const [drillFilterSender, setDrillFilterSender] = useState<string[]>([]);
  const [visibleMetrics, setVisibleMetrics] = useState<string[]>(DEFAULT_EXTRA_KEYS);
  const [createListPending, setCreateListPending] = useState<string | null>(null);
  const [createListName, setCreateListName] = useState("");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [metricsExpanded, setMetricsExpanded] = useState(false);
  const [showGearHint, setShowGearHint] = useState(() => {
    try { return !sessionStorage.getItem("tv_metrics_hint_dismissed"); } catch (_e) { return true; }
  });
  const [tagSort, setTagSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "totalSent", dir: "desc" });
  const [expandedTag, setExpandedTag] = useState<string | null>(null);
  const [funnelSearch, setFunnelSearch] = useState("");

  const [expandedFunnel, setExpandedFunnel] = useState<string | null>(null);
  const [goalFilter, setGoalFilter] = useState<GoalStatus | "all">("all");
  const [goalSearch, setGoalSearch] = useState("");
  const [goalSort, setGoalSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "status", dir: "asc" });
  const [goalExpanded, setGoalExpanded] = useState(false);
  const [goalTagFilter, setGoalTagFilter] = useState<string[]>([]);
  const [goalMetricFilter, setGoalMetricFilter] = useState<string[]>([]);

  // Performance tab: integrated section collapse state
  const [perfOdderOpen, setPerfOdderOpen] = useState(false);
  const [perfPdfOpen, setPerfPdfOpen] = useState(false);

  // Tab-local campaign filters
  const [pdfCampaignFilter, setPdfCampaignFilter] = useState<string[]>([]);
  const [odderCampaignFilter, setOdderCampaignFilter] = useState<string[]>([]);
  const [videoCampaignFilter, setVideoCampaignFilter] = useState<string[]>([]);
  const [videoTimePeriod, setVideoTimePeriod] = useState<string[]>(["all_time"]);
  const [videoSort, setVideoSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "recorded", dir: "desc" });

  // Endowment tab: expanded campaign rows (show per-PDF breakdown)
  const [expandedOdderIds, setExpandedOdderIds] = useState<Set<number>>(new Set());
  const toggleOdderExpand = (id: number) => {
    setExpandedOdderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  // ODDER recipient drilldown state
  const [odderRecipientSearch, setOdderRecipientSearch] = useState("");
  const [odderRecipientSort, setOdderRecipientSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "pdfCompletion", dir: "desc" });
  const [odderStatusFilter, setOdderStatusFilter] = useState<string[]>([]);
  const [odderActionFilter, setOdderActionFilter] = useState<string[]>([]);
  const [perfVideo11Open, setPerfVideo11Open] = useState(false);

  // Chart drilldown drawer
  const [chartDrillDate, setChartDrillDate] = useState<string | null>(null);

  // Video clips state
  const [clipSort, setClipSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "openRate", dir: "desc" });
  const [clipsExpanded, setClipsExpanded] = useState(false);
  const [clipDrawer, setClipDrawer] = useState<VideoClip | null>(null);
  const [clipSearch, setClipSearch] = useState("");
  const [compareClips, setCompareClips] = useState<VideoClip[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [showEditClipColumns, setShowEditClipColumns] = useState(false);
  const [activeClipColumns, setActiveClipColumns] = useState<string[]>(DEFAULT_CLIP_COLS);

  // Performance by Tag state
  const [tagSearch, setTagSearch] = useState("");
  const [tagsVisibleCount, setTagsVisibleCount] = useState(10);
  const [tagDrawerGroup, setTagDrawerGroup] = useState<TagGroup | null>(null);
  const [tagDrawerSort, setTagDrawerSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "sent", dir: "desc" });
  const [tagDrawerSearch, setTagDrawerSearch] = useState("");

  // Tags tab state
  const [tagsTabSearch, setTagsTabSearch] = useState("");
  const [tagsTabSort, setTagsTabSort] = useState<{ col: string; dir: "asc" | "desc" }>({ col: "totalSent", dir: "desc" });
  const [tagsTabShowAll, setTagsTabShowAll] = useState(false);
  const [tagsTabMetric, setTagsTabMetric] = useState<"avgOpenRate" | "avgClickRate" | "avgReplyRate" | "avgVideoPct" | "totalSent">("avgOpenRate");

  // Navigate to the campaign detail page (or fall back to Performance tab filter)
  const CAMPAIGN_NAME_TO_ID: Record<string, string> = {
    "Spring Annual Fund Appeal": "1",
    "Major Gift Cultivation – Q1": "5",
    "Student Video Testimonials": "11",
  };
  const navigateToCampaign = (campaignName: string) => {
    const detailId = CAMPAIGN_NAME_TO_ID[campaignName];
    if (detailId) {
      navigate(`/campaigns/${detailId}?from=analytics`);
    } else {
      // Fallback: filter the Performance tab to this campaign
      setAnalyticsFilterValues(prev => ({ ...prev, campaign: [campaignName] }));
      setMainTab("performance");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ── Filter wiring ─────────────────────────────────────────────────────────
  // Map engagement filter values to SEND_RECORDS status strings
  const ENGAGEMENT_STATUS_MAP: Record<string, (s: typeof SEND_RECORDS[0]) => boolean> = {
    sent: () => true,
    delivered: (s) => s.status !== "Bounced",
    opened: (s) => s.status === "Opened" || s.status === "Replied" || s.status === "Watched",
    opened_no_click: (s) => (s.status === "Opened" || s.status === "Watched") && !s.ctaClicked,
    not_opened: (s) => s.status === "Not opened",
    clicked: (s) => s.ctaClicked,
    not_clicked: (s) => s.status !== "Not opened" && !s.ctaClicked,
    viewed: (s) => s.viewRate > 0,
    not_viewed: (s) => s.viewRate === 0,
    started: (s) => s.viewRate > 0,
    finished: (s) => s.watchPct >= 90,
    shared: (s) => s.shared,
    cta_clicked: (s) => s.ctaClicked,
    downloaded: (s) => s.downloaded,
    replied: (s) => s.replyRate === true,
    unsubscribed: () => false, // mock — none in sample data
    bounced: (s) => s.status === "Bounced",
    spam: () => false, // mock — none in sample data
  };

  // Derive the campaign type tag key → tag label mapping for filtering
  const CAMPAIGN_TYPE_VALUE_TO_TAG: Record<string, CampaignTag> = {
    thank_you: "Thank You",
    solicitation: "Appeals / Solicitation",
    video_request: "Video Request",
    event: "Event Related",
    update: "Updates",
    endowment: "Endowment Reports",
    birthday: "Birthdays",
    anniversary: "Anniversaries",
    career: "Career Moves",
    other: "Other",
  };

  const filteredCampaigns = useMemo(() => {
    let cs = [...CAMPAIGN_STATS];
    // Filter by campaign name(s) — supports multi-select
    if (hasCampaignFilter) {
      cs = cs.filter(c => selectedCampaigns.has(c.name));
    }
    // Filter by campaign type (tag)
    const typeVals = analyticsFilterValues.campaignType;
    if (typeVals?.length) {
      const allowedTags = new Set(typeVals.map(v => CAMPAIGN_TYPE_VALUE_TO_TAG[v]).filter(Boolean));
      cs = cs.filter(c => allowedTags.has(c.tag));
    }
    // Filter by creator
    const creators = analyticsFilterValues.creator;
    if (creators?.length) {
      // Map campaigns by matching creator names to SEND_RECORDS senders
      const creatorCampaigns = new Set(
        SEND_RECORDS.filter(s => creators.includes(s.sender)).map(s => s.campaign)
      );
      cs = cs.filter(c => creatorCampaigns.has(c.name));
    }
    // Filter by delivery method
    const methods = analyticsFilterValues.deliveryMethod;
    if (methods?.length) {
      const methodCampaigns = new Set(
        SEND_RECORDS.filter(s => methods.includes(s.channel.toLowerCase())).map(s => s.campaign)
      );
      cs = cs.filter(c => methodCampaigns.has(c.name));
    }
    return cs;
  }, [campaign, analyticsFilterValues]);

  // Filter send records using all applicable filters + recipient search
  const filteredSends = useMemo(() => {
    let sends = [...SEND_RECORDS];
    // Campaign(s) — multi-select
    if (hasCampaignFilter) {
      sends = sends.filter(s => selectedCampaigns.has(s.campaign));
    }
    // Campaign type
    const typeVals = analyticsFilterValues.campaignType;
    if (typeVals?.length) {
      const allowedTags = new Set(typeVals.map(v => CAMPAIGN_TYPE_VALUE_TO_TAG[v]).filter(Boolean));
      // Find campaign names that match those tags
      const matchingCampaigns = new Set(CAMPAIGN_STATS.filter(c => allowedTags.has(c.tag)).map(c => c.name));
      sends = sends.filter(s => matchingCampaigns.has(s.campaign));
    }
    // Creator
    const creators = analyticsFilterValues.creator;
    if (creators?.length) {
      sends = sends.filter(s => creators.includes(s.sender));
    }
    // Delivery method
    const methods = analyticsFilterValues.deliveryMethod;
    if (methods?.length) {
      sends = sends.filter(s => methods.includes(s.channel.toLowerCase()));
    }
    // Location (filter values are full state names; records use abbreviations)
    const locations = analyticsFilterValues.location;
    if (locations?.length) {
      const STATE_ABBR: Record<string, string> = {
        "New York": "NY", "California": "CA", "Texas": "TX", "Illinois": "IL",
        "Florida": "FL", "Massachusetts": "MA", "Pennsylvania": "PA", "Georgia": "GA",
        "Ohio": "OH", "Washington": "WA", "Colorado": "CO", "Oregon": "OR",
        "Michigan": "MI", "North Carolina": "NC", "Virginia": "VA",
        "New Jersey": "NJ", "Maryland": "MD", "Connecticut": "CT",
        "Minnesota": "MN", "District of Columbia": "DC",
      };
      const abbrs = new Set(locations.map(l => STATE_ABBR[l] ?? l));
      sends = sends.filter(s => abbrs.has(s.state) || locations.some(l => s.city.includes(l)));
    }
    // Device
    const device = analyticsFilterValues.device;
    if (device?.length) {
      sends = sends.filter(s => device.includes(s.device.toLowerCase()));
    }
    // Engagement status
    const engagement = analyticsFilterValues.engagement;
    if (engagement?.length) {
      sends = sends.filter(s => engagement.some(e => ENGAGEMENT_STATUS_MAP[e]?.(s)));
    }

    return sends;
  }, [campaign, analyticsFilterValues]);

  // ── Recompute aggregate metrics from filtered campaigns ─────────────────
  const stats = useMemo(() => {
    const cs = filteredCampaigns;
    const _totalSends = cs.reduce((s, c) => s + c.sent, 0);
    const _totalDelivered = cs.reduce((s, c) => s + c.delivered, 0);
    const _totalOpened = cs.reduce((s, c) => s + c.opened, 0);
    const _totalClicked = cs.reduce((s, c) => s + c.clicked, 0);
    const _totalViewed = cs.reduce((s, c) => s + c.views, 0);
    const _totalCTAClicks = cs.reduce((s, c) => s + c.ctaClicks, 0);
    const _totalShares = cs.reduce((s, c) => s + c.shares, 0);
    const _totalDownloads = cs.reduce((s, c) => s + c.downloads, 0);
    const _totalReplies = cs.reduce((s, c) => s + c.replied, 0);
    const _startedWatching = Math.floor(_totalViewed * 0.86);
    const _finishedWatching = Math.floor(_totalViewed * 0.64);
    const _avgViewPct = cs.length > 0
      ? (cs.reduce((s, c) => s + c.avgVideoPct * c.views, 0) / Math.max(_totalViewed, 1)).toFixed(1)
      : "0.0";
    const _openRate = _totalDelivered > 0 ? ((_totalOpened / _totalDelivered) * 100).toFixed(1) : "0.0";
    const _clickRate = _totalDelivered > 0 ? ((_totalClicked / _totalDelivered) * 100).toFixed(1) : "0.0";
    const _unsubRate = _totalSends > 0 ? (Math.floor(_totalSends * 0.003) / _totalSends * 100).toFixed(1) : "0.0";
    const _spamRateVal = _totalSends > 0 ? (Math.round(_totalSends * 0.0008) / _totalSends * 100).toFixed(2) : "0.00";
    const _bounceRateVal = _totalSends > 0 ? (Math.floor(_totalSends * 0.019) / _totalSends * 100).toFixed(1) : "0.0";
    const _totalUnsubscribed = Math.floor(_totalSends * 0.003);
    const _totalBounced = Math.floor(_totalSends * 0.019);
    const _totalSpam = Math.round(_totalSends * 0.0008);
    const _openedNoClick = _totalOpened - _totalClicked;
    const _didntOpen = _totalDelivered - _totalOpened;
    const _didntClick = _totalOpened - _totalClicked;
    const _didntView = _totalDelivered - _totalViewed;

    // Account Health: composite score based on bounce, spam, unsub rates (lower is better → inverted)
    const _bounceNum = _totalSends > 0 ? (Math.floor(_totalSends * 0.019) / _totalSends) * 100 : 0;
    const _spamNum = _totalSends > 0 ? (Math.round(_totalSends * 0.0008) / _totalSends) * 100 : 0;
    const _unsubNum = _totalSends > 0 ? (Math.floor(_totalSends * 0.003) / _totalSends) * 100 : 0;
    const _accountHealth = Math.max(0, Math.min(100, 100 - (_bounceNum * 3) - (_spamNum * 10) - (_unsubNum * 5))).toFixed(1);
    // SMS Opt Out Rate (mock: ~1.2% of SMS sends which are ~18% of total)
    const _smsSends = Math.floor(_totalSends * 0.18);
    const _smsOptOuts = Math.floor(_smsSends * 0.012);
    const _smsOptOutRate = _smsSends > 0 ? ((_smsOptOuts / _smsSends) * 100).toFixed(1) : "0.0";

    return {
      totalSends: _totalSends, totalDelivered: _totalDelivered, totalOpened: _totalOpened,
      totalClicked: _totalClicked, totalViewed: _totalViewed, totalCTAClicks: _totalCTAClicks,
      totalShares: _totalShares, totalDownloads: _totalDownloads, totalReplies: _totalReplies,
      startedWatching: _startedWatching, finishedWatching: _finishedWatching,
      avgViewPct: _avgViewPct, openRate: _openRate, clickRate: _clickRate,
      unsubRate: _unsubRate, spamRateVal: _spamRateVal, bounceRateVal: _bounceRateVal,
      totalUnsubscribed: _totalUnsubscribed, totalBounced: _totalBounced, totalSpam: _totalSpam,
      openedNoClick: _openedNoClick, didntOpen: _didntOpen, didntClick: _didntClick, didntView: _didntView,
      accountHealth: _accountHealth, smsSends: _smsSends, smsOptOuts: _smsOptOuts, smsOptOutRate: _smsOptOutRate,
    };
  }, [filteredCampaigns]);

  // Shorthand destructure for use in metrics/funnel
  const {
    totalSends: fSends, totalDelivered: fDelivered, totalOpened: fOpened,
    totalClicked: fClicked, totalViewed: fViewed, totalCTAClicks: fCTA,
    totalShares: fShares, totalDownloads: fDownloads, totalReplies: fReplies,
    startedWatching: fStarted, finishedWatching: fFinished,
    avgViewPct: fAvgViewPct, openRate: fOpenRate, clickRate: fClickRate,
    unsubRate: fUnsubRate, spamRateVal: fSpamRate, bounceRateVal: fBounceRate,
    totalUnsubscribed: fUnsub, totalBounced: fBounced, totalSpam: fSpam,
    openedNoClick: fOpenedNoClick, didntOpen: fDidntOpen, didntClick: fDidntClick, didntView: fDidntView,
    accountHealth: fAccountHealth, smsSends: fSmsSends, smsOptOuts: fSmsOptOuts, smsOptOutRate: fSmsOptOutRate,
  } = stats;

  // Filtered funnel categories (recomputed from filtered aggregates)
  const filteredFunnelCats = useMemo(() => [
    { key: "sent", label: "Sent", count: fSends, color: TV.textSecondary },
    { key: "delivered", label: "Delivered", count: fDelivered, color: TV.info },
    { key: "opened", label: "Opened", count: fOpened, color: TV.brand },
    { key: "opened_no_click", label: "Opened but didn't click", count: fOpenedNoClick, color: TV.warning },
    { key: "didnt_open", label: "Didn't open", count: fDidntOpen, color: TV.danger },
    { key: "clicked", label: "Clicked", count: fClicked, color: TV.info },
    { key: "didnt_click", label: "Didn't click", count: fDidntClick, color: "#e0daea" },
    { key: "viewed", label: "Viewed", count: fViewed, color: TV.success },
    { key: "didnt_view", label: "Didn't view", count: Math.max(0, fClicked - fViewed), color: "#e0daea" },
    { key: "started", label: "Started watching", count: fStarted, color: TV.brand },
    { key: "finished", label: "Finished watching", count: fFinished, color: TV.success },
    { key: "shared", label: "Shared", count: fShares, color: TV.info },
    { key: "cta_clicked", label: "CTA clicked", count: fCTA, color: TV.warning },
    { key: "downloaded", label: "Downloaded", count: fDownloads, color: TV.textSecondary },
    { key: "replied", label: "Replied", count: fReplies, color: TV.success },
    { key: "unsubscribed", label: "Unsubscribed", count: fUnsub, color: TV.danger },
    { key: "bounced", label: "Bounced", count: fBounced, color: TV.danger },
    { key: "spam", label: "Marked as Spam", count: Math.max(fSends > 0 ? 1 : 0, fSpam), color: TV.danger },
  ], [fSends, fDelivered, fOpened, fClicked, fViewed, fCTA, fShares, fDownloads, fReplies, fStarted, fFinished, fUnsub, fBounced, fSpam, fOpenedNoClick, fDidntOpen, fDidntClick]);

  const filtered = filteredSends;

  // Tag groups — filtered by selected campaign if applicable, then sorted
  const filteredTagGroups: TagGroup[] = (() => {
    if (hasCampaignFilter) {
      return TAG_GROUPS.filter(g => g.campaigns.some(c => selectedCampaigns.has(c.name)));
    }
    // Also filter by campaign type if selected
    const typeVals = analyticsFilterValues.campaignType;
    if (typeVals?.length) {
      const allowedTags = new Set(typeVals.map(v => CAMPAIGN_TYPE_VALUE_TO_TAG[v]).filter(Boolean));
      return TAG_GROUPS.filter(g => allowedTags.has(g.tag));
    }
    return TAG_GROUPS;
  })();
  const sortedTagGroups = [...filteredTagGroups].sort((a, b) => {
    const getVal = (g: TagGroup): number | string => {
      if (tagSort.col === "tag") return g.tag;
      if (tagSort.col === "campaigns") return g.campaigns.length;
      if (tagSort.col === "avgOpenRate") return g.avgOpenRate;
      if (tagSort.col === "avgClickRate") return g.avgClickRate;
      if (tagSort.col === "avgReplyRate") return g.avgReplyRate;
      if (tagSort.col === "avgVideoPct") return g.avgVideoPct;
      return (g as any)[tagSort.col] ?? 0;
    };
    const av = getVal(a), bv = getVal(b);
    const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
    return tagSort.dir === "asc" ? cmp : -cmp;
  });
  const campaignFilteredClips = !hasCampaignFilter ? TOP_VIDEO_CLIPS : TOP_VIDEO_CLIPS.filter(c => selectedCampaigns.has(c.campaignName));
  const filteredClips = clipSearch.trim()
    ? campaignFilteredClips.filter(c => { const q = clipSearch.toLowerCase(); return c.title.toLowerCase().includes(q) || c.campaignName.toLowerCase().includes(q) || c.sender.toLowerCase().includes(q); })
    : campaignFilteredClips;

  // Filtered trend data — respects campaign and campaignType filters via TREND_CAMPAIGN_BREAKDOWN
  const filteredTrend = useMemo(() => {
    const hasFilter = hasCampaignFilter || (analyticsFilterValues.campaignType?.length ?? 0) > 0;
    if (!hasFilter) return TREND_DATA;
    const filteredNames = new Set(filteredCampaigns.map(c => c.name));
    return TREND_DATA.map(point => {
      const breakdown = TREND_CAMPAIGN_BREAKDOWN[point.date];
      if (!breakdown) return point;
      const matched = breakdown.filter(b => filteredNames.has(b.campaign));
      if (matched.length === 0 && hasFilter) return { ...point, sends: 0, delivered: 0, opens: 0, clicks: 0, views: 0, replies: 0 };
      return {
        date: point.date,
        sends: matched.reduce((s, c) => s + c.sends, 0),
        delivered: Math.round(matched.reduce((s, c) => s + c.sends, 0) * 0.97),
        opens: matched.reduce((s, c) => s + c.opens, 0),
        clicks: matched.reduce((s, c) => s + c.clicks, 0),
        views: matched.reduce((s, c) => s + c.views, 0),
        replies: matched.reduce((s, c) => s + c.replies, 0),
      };
    });
  }, [campaign, analyticsFilterValues.campaignType, filteredCampaigns]);

  const CHART_COLORS: Record<string, string> = { sends: TV.textSecondary, opens: TV.brand, clicks: TV.info, views: TV.success, replies: TV.warning };
  const chartColor = CHART_COLORS[chartMode];

  const handleCreateList = (label: string) => {
    setCreateListPending(label);
    setCreateListName(`${label} — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`);
  };

  const confirmCreateList = () => {
    const name = createListName.trim() || createListPending || "Untitled List";
    setCreateListPending(null);
    setCreateListName("");
    show(`List "${name}" created successfully`, "success");
  };

  // Map funnel category keys → metric drilldown keys (some differ in naming)
  const FUNNEL_TO_METRIC: Record<string, string> = {
    cta_clicked: "cta", shared: "shares", downloaded: "downloads",
    replied: "replies", didnt_open: "didnt_open", didnt_click: "didnt_click",
    didnt_view: "didnt_view", opened_no_click: "opened_no_click",
  };
  const handleViewContacts = (catKey: string, _catLabel: string) => {
    const metricKey = FUNNEL_TO_METRIC[catKey] || catKey;
    setActiveMetric(metricKey);
    setDrillSearch("");
    setDrillSort({ col: "name", dir: "asc" });
    setDrillFilterCampaign([]);
    setDrillFilterStatus([]);
    setDrillFilterCity([]);
    setDrillFilterList([]);
    setDrillFilterSender([]);
  };

  // Funnel grouping
  const funnelGroups = [
    { title: "Delivery", keys: ["sent", "delivered", "bounced", "spam", "unsubscribed"] },
    { title: "Engagement", keys: ["opened", "opened_no_click", "didnt_open", "clicked", "didnt_click"] },
    { title: "Video", keys: ["viewed", "didnt_view", "started", "finished"] },
    { title: "Actions", keys: ["cta_clicked", "replied", "shared", "downloaded"] },
  ];

  const filteredFunnel = funnelSearch
    ? filteredFunnelCats.filter(c => c.label.toLowerCase().includes(funnelSearch.toLowerCase()))
    : filteredFunnelCats;

  // ── All available stat metrics for the bar (uses filtered aggregates) ───
  const ALL_METRICS: StatMetricDef[] = [
    // Delivery
    { key: "sent", label: "Sent", value: fSends.toLocaleString(), sub: `${fUnsub} unsubscribed`, subColor: "gray", iconColor: TV.brandBg, iconBg: TV.brandTint, icon: Send, description: "All recipients who were sent a ThankView" },
    { key: "delivered", label: "Delivered", value: fDelivered.toLocaleString(), sub: `${fBounced} bounced`, subColor: "gray", iconColor: TV.info, iconBg: TV.infoBg, icon: CircleCheckBig, description: "Recipients who successfully received the message" },
    { key: "unsubscribeRate", label: "Unsubscribe Rate", value: `${fUnsubRate}%`, sub: `${fUnsub} recipients`, subColor: "gray", iconColor: TV.danger, iconBg: TV.dangerBg, icon: UserMinus, description: "Percentage of recipients who unsubscribed" },
    { key: "spamRate", label: "Spam Rate", value: `${fSpamRate}%`, sub: `${fSpam} messages flagged`, subColor: "gray", iconColor: TV.dangerHover, iconBg: TV.dangerBg, icon: ShieldAlert, description: "Percentage of messages marked as spam" },
    { key: "bounceRate", label: "Bounce Rate", value: `${fBounceRate}%`, sub: `${fBounced} bounced`, subColor: "gray", iconColor: TV.warning, iconBg: TV.warningBg, icon: TriangleAlert, description: "Percentage of messages that bounced back" },
    // Portal Health
    { key: "accountHealth", label: "Account Health", value: `${fAccountHealth}%`, sub: parseFloat(fAccountHealth) >= 90 ? "Excellent" : parseFloat(fAccountHealth) >= 75 ? "Good" : "Needs attention", subColor: parseFloat(fAccountHealth) >= 90 ? "green" : parseFloat(fAccountHealth) >= 75 ? "gray" : "red", iconColor: TV.success, iconBg: TV.successBg, icon: Activity, description: "Composite health score based on bounce, spam, and unsubscribe rates" },
    { key: "smsOptOut", label: "SMS Opt Out Rate", value: `${fSmsOptOutRate}%`, sub: `${fSmsOptOuts} of ${fSmsSends.toLocaleString()} SMS sends`, subColor: "gray", iconColor: TV.danger, iconBg: TV.dangerBg, icon: PhoneOff, description: "Percentage of SMS recipients who opted out" },
    // Engagement
    { key: "opened", label: "Open Rate", value: `${fOpened.toLocaleString()} (${fOpenRate}%)`, sub: parseFloat(fOpenRate) > parseFloat(industryOpenRate) ? `↑ above ${industryOpenRate}% industry avg` : `↓ below ${industryOpenRate}% industry avg`, subColor: parseFloat(fOpenRate) > parseFloat(industryOpenRate) ? "green" : "red", iconColor: TV.info, iconBg: TV.infoBg, icon: Mail, description: "Recipients who opened the email" },
    { key: "clicked", label: "Click Rate", value: `${fClicked.toLocaleString()} (${fClickRate}%)`, sub: parseFloat(fClickRate) > parseFloat(industryClickRate) ? `↑ above ${industryClickRate}% industry avg` : `↓ below ${industryClickRate}% industry avg`, subColor: parseFloat(fClickRate) > parseFloat(industryClickRate) ? "green" : "red", iconColor: TV.info, iconBg: TV.infoBg, icon: MousePointerClick, description: "Recipients who clicked a link" },
    { key: "industryOpen", label: "Industry Std. Open Rate", value: `${industryOpenRate}%`, sub: parseFloat(fOpenRate) > parseFloat(industryOpenRate) ? `Your rate: ${fOpenRate}% (above)` : `Your rate: ${fOpenRate}% (below)`, subColor: parseFloat(fOpenRate) > parseFloat(industryOpenRate) ? "green" : "red", iconColor: TV.success, iconBg: TV.successBg, icon: TrendingUp, description: `Industry average open rate benchmark · Avg: ${industryOpenRate}%` },
    { key: "industryClick", label: "Industry Std. Click Rate", value: `${industryClickRate}%`, sub: parseFloat(fClickRate) > parseFloat(industryClickRate) ? `Your rate: ${fClickRate}% (above)` : `Your rate: ${fClickRate}% (below)`, subColor: parseFloat(fClickRate) > parseFloat(industryClickRate) ? "green" : "red", iconColor: TV.success, iconBg: TV.successBg, icon: BarChart3, description: `Industry average click rate benchmark · Avg: ${industryClickRate}%` },
    { key: "opened_no_click", label: "Opened, No Click", value: fOpenedNoClick.toLocaleString(), sub: `${((fOpenedNoClick / Math.max(fDelivered, 1)) * 100).toFixed(1)}% of delivered`, subColor: "gray", iconColor: TV.warning, iconBg: TV.warningBg, icon: MailOpen, description: "Recipients who opened but did not click any link" },
    { key: "didnt_open", label: "Didn't Open", value: fDidntOpen.toLocaleString(), sub: `${((fDidntOpen / Math.max(fDelivered, 1)) * 100).toFixed(1)}% of delivered`, subColor: "red", iconColor: TV.danger, iconBg: TV.dangerBg, icon: MailX, description: "Recipients who received the message but never opened it" },
    { key: "didnt_click", label: "Didn't Click", value: fDidntClick.toLocaleString(), sub: `${((fDidntClick / Math.max(fOpened, 1)) * 100).toFixed(1)}% of opened`, subColor: "red", iconColor: TV.danger, iconBg: TV.dangerBg, icon: MousePointerClick, description: "Recipients who opened but did not click" },
    // Video
    { key: "started", label: "Started Watching", value: fStarted.toLocaleString(), sub: `${((fStarted / Math.max(fDelivered, 1)) * 100).toFixed(1)}% of recipients`, subColor: "gray", iconColor: TV.brand, iconBg: TV.brandTint, icon: Play, description: "% of recipients who started playing the video" },
    { key: "finished", label: "Finished Watching", value: fFinished.toLocaleString(), sub: `${((fFinished / Math.max(fDelivered, 1)) * 100).toFixed(1)}% of recipients`, subColor: "gray", iconColor: TV.success, iconBg: TV.successBg, icon: CircleCheckBig, description: "% of recipients who watched the video to completion" },
    { key: "views", label: "Total Views", value: fViewed.toLocaleString(), sub: "Across all campaigns", subColor: "gray", iconColor: TV.warning, iconBg: TV.warningBg, icon: Eye, description: "Total number of video views across all recipients" },
    { key: "avg_view", label: "Avg Video %", value: `${fAvgViewPct}%`, sub: "Average watch completion", subColor: "gray", iconColor: TV.warning, iconBg: TV.warningBg, icon: BarChart3, description: "Average percentage of video watched across all views" },
    { key: "viewed", label: "Viewed", value: fViewed.toLocaleString(), sub: `${((fViewed / Math.max(fDelivered, 1)) * 100).toFixed(1)}% of recipients`, subColor: "gray", iconColor: TV.brand, iconBg: TV.brandTint, icon: Eye, description: "Recipients who viewed the video at least once" },
    { key: "didnt_view", label: "Didn't View", value: fDidntView.toLocaleString(), sub: `${((fDidntView / Math.max(fDelivered, 1)) * 100).toFixed(1)}% of recipients`, subColor: "red", iconColor: TV.danger, iconBg: TV.dangerBg, icon: EyeOff, description: "Recipients who never viewed the video" },
    // Actions
    { key: "cta", label: "CTA Clicks", value: fCTA.toLocaleString(), sub: `${((fCTA / Math.max(fDelivered, 1)) * 100).toFixed(1)}% of recipients`, subColor: "gray", iconColor: TV.warning, iconBg: TV.warningBg, icon: Target, description: "Recipients who clicked the call-to-action button" },
    { key: "shares", label: "Shares", value: fShares.toLocaleString(), sub: `${((fShares / Math.max(fDelivered, 1)) * 100).toFixed(1)}% of recipients`, subColor: "gray", iconColor: TV.info, iconBg: TV.infoBg, icon: Share2, description: "Recipients who shared the ThankView" },
    { key: "downloads", label: "Downloads", value: fDownloads.toLocaleString(), sub: `${((fDownloads / Math.max(fDelivered, 1)) * 100).toFixed(1)}% of recipients`, subColor: "gray", iconColor: TV.textSecondary, iconBg: TV.surface, icon: Download, description: "Recipients who downloaded the video" },
    { key: "replies", label: "Replies", value: fReplies.toLocaleString(), sub: `${((fReplies / Math.max(fDelivered, 1)) * 100).toFixed(1)}% reply rate`, subColor: "green", iconColor: TV.success, iconBg: TV.successBg, icon: MessageSquare, description: "Recipients who sent a reply" },
    // Negative outcomes
    { key: "unsubscribed", label: "Unsubscribed", value: fUnsub.toLocaleString(), sub: `${fUnsubRate}% of sends`, subColor: "red", iconColor: TV.danger, iconBg: TV.dangerBg, icon: UserMinus, description: "Recipients who unsubscribed after receiving the message" },
    { key: "bounced", label: "Bounced", value: fBounced.toLocaleString(), sub: `${fBounceRate}% of sends`, subColor: "red", iconColor: TV.warning, iconBg: TV.warningBg, icon: TriangleAlert, description: "Messages that failed to deliver (hard + soft bounces)" },
    { key: "spam", label: "Marked as Spam", value: fSpam.toLocaleString(), sub: `${fSpamRate}% of sends`, subColor: "red", iconColor: TV.dangerHover, iconBg: TV.dangerBg, icon: Ban, description: "Recipients who reported the message as spam" },
  ];

  const extraMetrics = ALL_METRICS.filter(m => !CORE_KEYS.includes(m.key));
  const shownExtras = extraMetrics.filter(m => visibleMetrics.includes(m.key));

  // Group metrics into logical rows for the Performance Overview grid
  const METRIC_ROW_ORDER: { group: string; keys: string[] }[] = [
    { group: "Delivery", keys: ["sent", "delivered", "opened", "clicked"] },
    { group: "Engagement Detail", keys: ["opened_no_click", "didnt_open", "didnt_click", "unsubscribed", "bounced", "spam"] },
    { group: "Benchmarks", keys: ["unsubscribeRate", "spamRate", "bounceRate", "industryOpen", "industryClick"] },
    { group: "Portal Health", keys: ["accountHealth", "smsOptOut"] },
    { group: "Video", keys: ["started", "finished", "views", "avg_view", "viewed", "didnt_view"] },
    { group: "Actions", keys: ["cta", "shares", "downloads", "replies"] },
  ];
  // Build the visible metrics lookup
  const allVisibleKeys = new Set([...CORE_KEYS, ...visibleMetrics]);
  const allMetricMap = new Map(ALL_METRICS.map(m => [m.key, m]));
  // Build grouped rows: first place metrics into their designated row, preserving order
  const metricRows: { group: string; metrics: StatMetricDef[] }[] = METRIC_ROW_ORDER
    .map(row => ({
      group: row.group,
      metrics: row.keys.map(k => allMetricMap.get(k)).filter((m): m is StatMetricDef => !!m && allVisibleKeys.has(m.key)),
    }))
    .filter(row => row.metrics.length > 0);
  // Any visible metrics not yet placed go into an "Other" overflow row
  const placedKeys = new Set(METRIC_ROW_ORDER.flatMap(r => r.keys));
  const overflow = [...allVisibleKeys].filter(k => !placedKeys.has(k)).map(k => allMetricMap.get(k)).filter((m): m is StatMetricDef => !!m);
  if (overflow.length) metricRows.push({ group: "Other", metrics: overflow });
  // Flat list for backwards-compat (drawer, etc.)
  const allDisplayed = metricRows.flatMap(r => r.metrics);

  return (
    <Box p={{ base: "sm", sm: "lg" }} style={{ minHeight: "100%" }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <div>
          <Title order={1} fz={{ base: 22, sm: 24 }}>ThankView Metrics</Title>
          <Text fz={13} c={TV.textSecondary}>Comprehensive analytics across campaigns, videos, and engagement</Text>
        </div>
        <Button variant="default" radius="xl" leftSection={<Download size={13} />} onClick={() => setExportOpen(true)} styles={{ root: { borderColor: TV.borderLight } }}>Export</Button>
      </div>

      {/* Filter Bar */}
      <Box mb="md" py="sm" px="md" bg={TV.surface} style={{ borderRadius: 12, border: `1px solid ${TV.borderLight}` }}>
        <FilterBar
          filters={ANALYTICS_FILTERS}
          activeFilterKeys={analyticsFilterKeys}
          filterValues={analyticsFilterValues}
          onFilterValuesChange={setAnalyticsFilterValues}
          onActiveFilterKeysChange={setAnalyticsFilterKeys}
        />
        {/* Active filter summary */}
        {Object.values(analyticsFilterValues).some(v => v?.length > 0) && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t" style={{ borderColor: TV.borderLight }}>
            <Text fz={11} c={TV.textSecondary}>
              Showing filtered results: <span className="font-semibold" style={{ color: TV.textBrand }}>{fSends.toLocaleString()}</span> sends across <span className="font-semibold" style={{ color: TV.textBrand }}>{filteredCampaigns.length}</span> campaign{filteredCampaigns.length !== 1 ? "s" : ""}
            </Text>
            <button
              onClick={() => { setAnalyticsFilterValues({}); }}
              className="text-[11px] px-2 py-0.5 rounded-full transition-colors"
              style={{ color: TV.textBrand, backgroundColor: TV.brandTint, border: `1px solid ${TV.borderLight}` }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = TV.surfaceHover)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = TV.brandTint)}
            >
              Clear all
            </button>
          </div>
        )}
      </Box>

      {/* Main tabs */}
      <Tabs value={mainTab} onChange={setMainTab} color="tvPurple" mb="lg"
        styles={{ tab: { fontWeight: 600, fontSize: 13 }, tabLabel: { textTransform: "capitalize" as const } }}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<LayoutDashboard size={13} />}>Overview</Tabs.Tab>
          <Tabs.Tab value="performance" leftSection={<TrendingUp size={13} />}>Performance</Tabs.Tab>
          <Tabs.Tab value="pdf" leftSection={<FileText size={13} />}>PDF</Tabs.Tab>
          {HAS_ODDER && <Tabs.Tab value="endowment" leftSection={<Layers size={13} />}>Endowment</Tabs.Tab>}
          <Tabs.Tab value="video_1_1" leftSection={<Video size={13} />}>1:1 Video</Tabs.Tab>
          <Tabs.Tab value="visualizations" leftSection={<BarChart3 size={13} />}>Visualizations</Tabs.Tab>
          <Tabs.Tab value="tags" leftSection={<Tag size={13} />}>Tags</Tabs.Tab>
        </Tabs.List>
      </Tabs>

      {/* ─── TAB: Overview ─────────────────────────────────────────────────── */}
      {mainTab === "overview" && (
        <>
          {/* ── Performance Overview ──────────────────────────────────────── */}
          <div className="bg-white rounded-lg border mb-4 overflow-visible" style={{ borderColor: TV.borderLight }}>
            {/* Header row */}
            <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: TV.borderLight }}>
              <span className="text-[13px] uppercase tracking-[0.6px] font-semibold" style={{ color: TV.textLabel }}>Performance Overview</span>
              <div className="flex items-center gap-2">

              <div className="relative">
                {/* First-visit hint popover */}
                {showGearHint && (
                  <div className="absolute z-20 pointer-events-auto" style={{ bottom: "calc(100% + 10px)", right: 0, width: 220 }}>
                    <div className="rounded-md px-3.5 py-3 shadow-lg" style={{ background: TV.brand, color: "#fff" }}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <Text fz={12} fw={600} c="#fff" style={{ lineHeight: 1.3 }}>More metrics available</Text>
                        <button
                          onClick={() => { setShowGearHint(false); try { sessionStorage.setItem("tv_metrics_hint_dismissed", "1"); } catch (_e) { /* noop */ } }}
                          className="shrink-0 mt-0.5 opacity-70 hover:opacity-100 transition-opacity"
                        >
                          <X size={12} color="#fff" />
                        </button>
                      </div>
                      <Text fz={11} c="rgba(255,255,255,0.85)" style={{ lineHeight: 1.4 }}>
                        Click the gear icon to customize which metrics you see here.
                      </Text>
                    </div>
                    {/* Arrow pointing down */}
                    <div style={{ position: "absolute", bottom: -5, right: 12, width: 10, height: 10, background: TV.brand, transform: "rotate(45deg)", borderRadius: 2 }} />
                  </div>
                )}
                <Tooltip label="Customize metrics" position="left">
                  <button
                    onClick={() => {
                      setCustomizeOpen(true);
                      if (showGearHint) { setShowGearHint(false); try { sessionStorage.setItem("tv_metrics_hint_dismissed", "1"); } catch (_e) { /* noop */ } }
                    }}
                    className="w-[32px] h-[32px] rounded-full flex items-center justify-center transition-colors"
                    style={{ backgroundColor: TV.surface, border: `1px solid ${TV.borderLight}` }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = TV.surfaceHover)}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = TV.surface)}
                    aria-label="Customize metrics"
                  >
                    <Settings size={14} style={{ color: TV.textSecondary }} aria-hidden="true" />
                  </button>
                </Tooltip>
              </div>
            </div>
            </div>

            {/* Metric cards — grouped into logical rows, collapsed to top 2 by default */}
            <div className="overflow-hidden rounded-b-[20px]">
            {(() => {
              const displayRows = metricsExpanded ? metricRows : metricRows.slice(0, 2);
              const hiddenMetricCount = metricRows.slice(2).reduce((s, r) => s + r.metrics.length, 0);
              return (
                <>
                  {displayRows.map((row, rowIdx) => {
                    const n = row.metrics.length;
                    const colClass =
                      n === 1 ? "grid-cols-1"
                      : n === 2 ? "grid-cols-2"
                      : n === 3 ? "grid-cols-2 sm:grid-cols-3"
                      : n === 4 ? "grid-cols-2 sm:grid-cols-4"
                      : n === 5 ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"
                      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6";
                    return (
                      <div key={row.group}>
                        {rowIdx > 0 && <div style={{ height: 1, background: TV.borderLight }} />}
                        <div className={`grid gap-px ${colClass}`} style={{ background: TV.borderLight }}>
                          {row.metrics.map((m) => {
                            const IconComp = m.icon;
                            const isActive = activeMetric === m.key;
                            return (
                              <button
                                key={m.key}
                                onClick={() => { setActiveMetric(isActive ? null : m.key); setDrillSearch(""); setDrillSort({ col: "name", dir: "asc" }); }}
                                className={`flex items-center gap-2.5 px-4 py-4 text-left transition-all relative ${
                                  isActive ? "bg-tv-brand-tint" : "bg-white hover:bg-tv-surface-muted"
                                }`}
                              >
                                {isActive && (
                                  <div className="absolute bottom-0 left-4 right-4 h-[3px] rounded-t-full bg-[#7c45b0]" />
                                )}
                                <div className="w-[40px] h-[40px] rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: m.iconBg, color: m.iconColor }}>
                                  <IconComp size={18} />
                                </div>
                                <div className="min-w-0 flex-1 flex flex-col gap-[2px] overflow-hidden">
                                  <span className="text-[10px] uppercase tracking-[0.6px] truncate" style={{ color: TV.textLabel }}>{m.label}</span>
                                  <span className="text-[18px] font-display truncate" style={{ fontWeight: 700, lineHeight: 1, color: TV.textPrimary, letterSpacing: "-0.26px" }}>{m.value}</span>
                                  <span className="text-[11px] tracking-[0.06px] truncate" style={{ color: m.subColor === "green" ? TV.success : m.subColor === "red" ? TV.danger : TV.textSecondary }}>{m.sub}</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  {/* Show more / Show less toggle */}
                  {metricRows.length > 2 && hiddenMetricCount > 0 && (
                    <>
                      <div style={{ height: 1, background: TV.borderLight }} />
                      <button
                        onClick={() => setMetricsExpanded(prev => !prev)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 transition-colors bg-white hover:bg-tv-surface-muted rounded-b-[20px]"
                      >
                        <ChevronDown
                          size={14}
                          style={{
                            color: TV.textBrand,
                            transition: "transform 200ms",
                            transform: metricsExpanded ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                        <span className="text-[12px] font-semibold" style={{ color: TV.textBrand }}>
                          {metricsExpanded ? "Show less" : `Show ${hiddenMetricCount} more metric${hiddenMetricCount !== 1 ? "s" : ""}`}
                        </span>
                      </button>
                    </>
                  )}
                </>
              );
            })()}
            </div>
          </div>

          {/* ── Customize Metrics Drawer ──────────────────────────────────── */}
          <Drawer opened={customizeOpen} onClose={() => setCustomizeOpen(false)} position="right" size="sm" title="Customize Stat Bar" styles={DRAWER_STYLES}>
            <Text fz={12} c={TV.textSecondary} mb={4}>Sent, Delivered, Opened, and Clicked are always shown.</Text>
            <Text fz={12} c={TV.textSecondary} mb="md">Select up to 16 additional metrics to display below. Click to toggle.</Text>
            <div className="space-y-1.5 mb-5">
              {extraMetrics.map(m => {
                const selected = visibleMetrics.includes(m.key);
                const IconComp = m.icon;
                return (
                  <button
                    key={m.key}
                    onClick={() => {
                      if (selected) {
                        setVisibleMetrics(prev => prev.filter(k => k !== m.key));
                      } else if (visibleMetrics.length < 16) {
                        setVisibleMetrics(prev => [...prev, m.key]);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all border-2 ${
                      selected
                        ? "border-tv-brand bg-tv-brand-tint"
                        : visibleMetrics.length >= 16
                        ? "bg-tv-surface-muted opacity-50 cursor-not-allowed"
                        : "bg-white hover:border-[#e0daea]"
                    }`}
                    style={!selected ? { borderColor: TV.borderDivider } : undefined}
                  >
                    <div className="w-[36px] h-[36px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: m.iconBg, color: m.iconColor }}>
                      <IconComp size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold" style={{ color: TV.textPrimary }}>{m.label}</p>
                      <p className="text-[11px] truncate" style={{ color: TV.textSecondary }}>{m.description}</p>
                    </div>
                    {selected && (
                      <div className="w-5 h-5 rounded-full bg-tv-brand flex items-center justify-center shrink-0">
                        <Check size={12} className="text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between">
              <Button variant="subtle" color="gray" size="xs" onClick={() => setVisibleMetrics(DEFAULT_EXTRA_KEYS)}>Reset to default</Button>
              <Button color="tvPurple" onClick={() => setCustomizeOpen(false)}>Done</Button>
            </div>
          </Drawer>



          {/* ── Metric Drilldown Panel ─────────────────────────────────────── */}
          {activeMetric && (() => {
            const metricDef = ALL_METRICS.find(m => m.key === activeMetric);
            if (!metricDef) return null;
            const meta = { label: metricDef.label, value: metricDef.value, color: metricDef.iconColor, description: metricDef.description };

            const contacts = METRIC_CONTACTS[activeMetric] ?? [];

            // Collect unique filter options from the contacts in this metric
            const drillCampaignOptions = [...new Set(contacts.flatMap(c => c.campaigns))].sort();
            const drillStatusOptions: EngagementStatus[] = [...new Set(contacts.map(c => c.engagementStatus))].sort() as EngagementStatus[];
            const drillCityOptions = [...new Set(contacts.map(c => c.city))].sort();
            const drillListOptions = [...new Set(contacts.flatMap(c => c.lists))].sort();
            const drillSenderOptions = [...new Set(contacts.flatMap(c => c.senders))].sort();
            const hasDrillFilters = drillFilterCampaign.length > 0 || drillFilterStatus.length > 0 || drillFilterCity.length > 0 || drillFilterList.length > 0 || drillFilterSender.length > 0;
            const activeDrillFilterCount = (drillFilterCampaign.length > 0 ? 1 : 0) + (drillFilterStatus.length > 0 ? 1 : 0) + (drillFilterCity.length > 0 ? 1 : 0) + (drillFilterList.length > 0 ? 1 : 0) + (drillFilterSender.length > 0 ? 1 : 0);

            const filtered = contacts.filter(c => {
              if (drillFilterCampaign.length > 0 && !c.campaigns.some(camp => drillFilterCampaign.includes(camp))) return false;
              if (drillFilterStatus.length > 0 && !drillFilterStatus.includes(c.engagementStatus)) return false;
              if (drillFilterCity.length > 0 && !drillFilterCity.includes(c.city)) return false;
              if (drillFilterList.length > 0 && !c.lists.some(l => drillFilterList.includes(l))) return false;
              if (drillFilterSender.length > 0 && !c.senders.some(s => drillFilterSender.includes(s))) return false;
              return true;
            });

            const searched = drillSearch
              ? filtered.filter(c =>
                  c.name.toLowerCase().includes(drillSearch.toLowerCase()) ||
                  c.email.toLowerCase().includes(drillSearch.toLowerCase()) ||
                  c.donorId.toLowerCase().includes(drillSearch.toLowerCase()) ||
                  c.phone.includes(drillSearch) ||
                  c.city.toLowerCase().includes(drillSearch.toLowerCase())
                )
              : filtered;

            const sorted = [...searched].sort((a, b) => {
              const col = drillSort.col as keyof MetricContact;
              const av = a[col], bv = b[col];
              const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
              return drillSort.dir === "asc" ? cmp : -cmp;
            });

            const toggleSort = (col: string) => {
              setDrillSort(prev => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
            };
            const SortIcon = ({ col }: { col: string }) => {
              const active = drillSort.col === col;
              if (!active) return <ArrowUpDown size={11} style={{ color: TV.borderStrong, marginLeft: 2 }} />;
              return drillSort.dir === "asc"
                ? <ArrowUp size={12} style={{ color: TV.textBrand, marginLeft: 2 }} />
                : <ArrowDown size={12} style={{ color: TV.textBrand, marginLeft: 2 }} />;
            };

            return (
              <DashCard className="mb-4 overflow-hidden">
                {/* Drilldown header */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b bg-tv-surface-muted flex-wrap" style={{ borderColor: TV.borderDivider }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <button onClick={() => setActiveMetric(null)} className="shrink-0 p-1 rounded-lg transition-colors" style={{ color: TV.textSecondary }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = TV.borderDivider)} onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}>
                      <ArrowLeft size={16} />
                    </button>
                    <div className="w-[36px] h-[36px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: metricDef.iconBg, color: metricDef.iconColor }}>
                      <metricDef.icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Text fz={15} fw={700} c={TV.textPrimary}>{meta.label}</Text>
                        <Badge size="lg" radius="xl" variant="light" color="tvPurple">{meta.value}</Badge>
                      </div>
                      <Text fz={11} c={TV.textSecondary}>{meta.description}</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-nowrap shrink-0">
                    <TextInput
                      placeholder="Search contacts…"
                      value={drillSearch}
                      onChange={e => setDrillSearch(e.currentTarget.value)}
                      leftSection={<Search size={13} />}
                      radius="xl"
                      size="xs"
                      styles={{ input: { borderColor: TV.borderLight, minWidth: 180 } }}
                    />
                    <Tooltip label="Export this segment">
                      <ActionIcon variant="default" radius="xl" size="sm" onClick={() => show(`${meta.label} contacts exported`, "success")} style={{ borderColor: TV.borderLight }} aria-label="Export this segment">
                        <Download size={13} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Create list from segment">
                      <ActionIcon variant="default" radius="xl" size="sm" onClick={() => handleCreateList(meta.label)} style={{ borderColor: TV.borderLight }} aria-label="Create list from segment">
                        <ListPlus size={13} />
                      </ActionIcon>
                    </Tooltip>
                  </div>
                </div>

                {/* Filter chips bar — always visible, matching global purple chip style */}
                <div className="px-4 sm:px-5 py-2.5 border-b bg-tv-surface-muted flex flex-wrap gap-2 items-center" style={{ borderColor: TV.borderDivider }}>
                  <div className="flex items-center mr-1">
                    <SlidersHorizontal size={14} style={{ color: TV.textSecondary }} />
                    <Text fz={12} fw={600} c={TV.textSecondary} ml={5} mr={2} className="select-none">Filters</Text>
                    {hasDrillFilters && (
                      <Badge size="xs" color="tvPurple" variant="filled" radius="xl" ml={2}>{activeDrillFilterCount}</Badge>
                    )}
                  </div>
                  <Box w={1} h={20} bg={TV.borderLight} mx={2} style={{ flexShrink: 0 }} />
                  <ChipFilter
                    label="Campaign Sender"
                    icon={Send}
                    options={drillSenderOptions.map(s => ({ value: s, label: s }))}
                    values={drillFilterSender}
                    onChange={setDrillFilterSender}
                    searchable
                  />
                  <ChipFilter
                    label="Campaign"
                    icon={Film}
                    options={drillCampaignOptions.map(c => ({ value: c, label: c }))}
                    values={drillFilterCampaign}
                    onChange={setDrillFilterCampaign}
                    searchable
                  />
                  <ChipFilter
                    label="Status"
                    icon={Activity}
                    options={drillStatusOptions.map(s => ({ value: s, label: ENGAGEMENT_STYLES[s].label }))}
                    values={drillFilterStatus}
                    onChange={setDrillFilterStatus}
                  />
                  <ChipFilter
                    label="Location"
                    icon={MapPin}
                    options={drillCityOptions.map(c => ({ value: c, label: c }))}
                    values={drillFilterCity}
                    onChange={setDrillFilterCity}
                    searchable
                  />
                  <ChipFilter
                    label="Recipient List"
                    icon={ListPlus}
                    options={drillListOptions.map(l => ({ value: l, label: l }))}
                    values={drillFilterList}
                    onChange={setDrillFilterList}
                    searchable
                  />
                  {hasDrillFilters && (
                    <>
                      <Box w={1} h={20} bg={TV.borderLight} mx={2} style={{ flexShrink: 0 }} />
                      <button onClick={() => { setDrillFilterCampaign([]); setDrillFilterStatus([]); setDrillFilterCity([]); setDrillFilterList([]); setDrillFilterSender([]); }} className="hover:underline select-none" style={{ background: "none", border: "none", cursor: "pointer" }}>
                        <Text fz={12} fw={600} c={TV.danger}>Clear all</Text>
                      </button>
                    </>
                  )}
                </div>

                {/* Desktop contact table */}
                <div className="hidden md:block overflow-x-auto">
                  <div className="grid grid-cols-[1.8fr_2fr_0.9fr_1fr_0.7fr_0.7fr_0.8fr_0.9fr_1fr] gap-3 px-5 py-2.5 bg-tv-surface-muted border-b select-none min-w-[900px]" style={{ borderColor: TV.borderDivider }}>
                    {[
                      { col: "name", label: "Name" },
                      { col: "email", label: "Email" },
                      { col: "engagementStatus", label: "Status" },
                      { col: "city", label: "Location" },
                      { col: "occurrences", label: "Count" },
                      { col: "totalSends", label: "Sent" },
                      { col: "donorId", label: "Donor ID" },
                      { col: "lastReceived", label: "Last Received" },
                      { col: "lists", label: "Lists" },
                    ].map(h => {
                      const active = drillSort.col === h.col;
                      return (
                        <button key={h.col} onClick={() => toggleSort(h.col)} className="flex items-center gap-1 group whitespace-nowrap text-left">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] transition-colors" style={{ color: active ? TV.textBrand : TV.textSecondary }}>{h.label}</span>
                          <SortIcon col={h.col} />
                        </button>
                      );
                    })}
                  </div>
                  {sorted.length === 0 && (
                    <div className="px-5 py-8 text-center">
                      <Text fz={13} c={TV.textSecondary}>
                        {contacts.length === 0 && !drillSearch && !hasDrillFilters
                          ? "This is an aggregate metric \u2014 no individual contact list available."
                          : hasDrillFilters && !drillSearch
                            ? "No contacts match the current filters."
                            : <>No contacts match &ldquo;{drillSearch}&rdquo;{hasDrillFilters ? " with current filters" : ""}</>}
                      </Text>
                      {hasDrillFilters && (
                        <Button variant="subtle" color="tvPurple" size="xs" radius="xl" mt={8} onClick={() => { setDrillFilterCampaign([]); setDrillFilterStatus([]); setDrillFilterCity([]); setDrillFilterList([]); setDrillFilterSender([]); }}>
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  )}
                  {sorted.map(c => {
                    const es = ENGAGEMENT_STYLES[c.engagementStatus];
                    return (
                    <div
                      key={c.email}
                      className="w-full grid grid-cols-[1.8fr_2fr_0.9fr_1fr_0.7fr_0.7fr_0.8fr_0.9fr_1fr] gap-3 px-5 py-3 border-b last:border-b-0 hover:bg-tv-surface-muted transition-colors text-left items-center min-w-[900px]"
                      style={{ borderColor: TV.borderDivider }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: c.avatarColor }}>{c.avatar}</div>
                        <button onClick={() => navigate("/404")} className="text-[13px] font-semibold truncate hover:underline cursor-pointer" style={{ color: TV.textBrand }}>{c.name}</button>
                      </div>
                      <span className="text-[12px] truncate" style={{ color: TV.textSecondary }}>{c.email}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold w-fit" style={{ backgroundColor: es.bg, color: es.color }}>{es.label}</span>
                      <span className="text-[12px] truncate" style={{ color: TV.textSecondary }}>{c.city}</span>
                      <span className="text-[12px] font-semibold text-center" style={{ color: TV.textBrand }}>{c.occurrences ?? "—"}</span>
                      <span className="text-[12px] font-semibold text-center" style={{ color: TV.textPrimary }}>{c.totalSends}</span>
                      <span className="text-[12px] font-mono" style={{ color: TV.textPrimary }}>{c.donorId}</span>
                      <span className="text-[12px]" style={{ color: TV.textSecondary }}>{c.lastReceived}</span>
                      <span className="text-[11px] truncate" style={{ color: TV.textSecondary }}>{c.lists.join(", ")}</span>
                    </div>
                    );
                  })}
                </div>

                {/* Mobile contact cards */}
                <div className="md:hidden" style={{ borderColor: TV.borderDivider }}>
                  {sorted.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <Text fz={13} c={TV.textSecondary}>
                        {contacts.length === 0 && !drillSearch && !hasDrillFilters
                          ? "This is an aggregate metric \u2014 no individual contact list available."
                          : hasDrillFilters && !drillSearch
                            ? "No contacts match the current filters."
                            : <>No contacts match &ldquo;{drillSearch}&rdquo;{hasDrillFilters ? " with current filters" : ""}</>}
                      </Text>
                      {hasDrillFilters && (
                        <Button variant="subtle" color="tvPurple" size="xs" radius="xl" mt={8} onClick={() => { setDrillFilterCampaign([]); setDrillFilterStatus([]); setDrillFilterCity([]); setDrillFilterList([]); setDrillFilterSender([]); }}>
                          Clear all filters
                        </Button>
                      )}
                    </div>
                  )}
                  {sorted.map(c => {
                    const esm = ENGAGEMENT_STYLES[c.engagementStatus];
                    return (
                    <div
                      key={c.email}
                      className="w-full flex items-start gap-3 px-4 py-3.5 border-b hover:bg-tv-surface-muted transition-colors text-left"
                      style={{ borderColor: TV.borderDivider }}
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: c.avatarColor }}>{c.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button onClick={() => navigate("/404")} className="text-[13px] font-semibold truncate hover:underline cursor-pointer" style={{ color: TV.textBrand }}>{c.name}</button>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ backgroundColor: esm.bg, color: esm.color }}>{esm.label}</span>
                        </div>
                        <p className="text-[11px] truncate" style={{ color: TV.textSecondary }}>{c.email}</p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          <span className="text-[10px]" style={{ color: TV.textSecondary }}>{c.city}</span>
                          <span className="text-[10px]" style={{ color: TV.textSecondary }}>{c.donorId}</span>
                          {c.occurrences != null && <span className="text-[10px] font-semibold" style={{ color: TV.textBrand }}>×{c.occurrences} this period</span>}
                          <span className="text-[10px]" style={{ color: TV.textSecondary }}>Sent: {c.totalSends}</span>
                          <span className="text-[10px]" style={{ color: TV.textSecondary }}>Last: {c.lastReceived}</span>
                        </div>
                        {c.lists.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {c.lists.map(l => <span key={l} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ backgroundColor: TV.brandTint, color: TV.textBrand }}>{l}</span>)}
                          </div>
                        )}
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-2.5 bg-tv-surface-muted border-t flex-wrap gap-2" style={{ borderColor: TV.borderDivider }}>
                  <Text fz={11} c={TV.textSecondary}>{sorted.length} contact{sorted.length !== 1 ? "s" : ""}{drillSearch ? ` matching "${drillSearch}"` : ""}{hasDrillFilters ? ` · ${activeDrillFilterCount} filter${activeDrillFilterCount !== 1 ? "s" : ""} applied` : ""}</Text>
                  <Button size="xs" variant="light" color="tvPurple" radius="xl" leftSection={<ListPlus size={11} />} onClick={() => handleCreateList(meta.label)}>
                    Create List from {meta.label}
                  </Button>
                </div>
              </DashCard>
            );
          })()}

          {/* ── 2-column: Goals & Engagement side-by-side ────────────── */}
          {(
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

          {/* ── Goals & Success Metrics (left column) ──────────────────── */}
          {(() => {
            // Filter goals by campaign selection and search
            const filteredCampaignNames = new Set(filteredCampaigns.map(c => c.name));
            const filteredGoals = CAMPAIGN_GOALS
              .filter(g => filteredCampaignNames.has(g.campaignName))
              .filter(g => goalTagFilter.length === 0 || goalTagFilter.includes(g.tag))
              .filter(g => goalMetricFilter.length === 0 || goalMetricFilter.includes(g.metric))
              .filter(g => goalFilter === "all" || g.status === goalFilter)
              .filter(g => !goalSearch || g.campaignName.toLowerCase().includes(goalSearch.toLowerCase()) || g.metric.toLowerCase().includes(goalSearch.toLowerCase()));

            // Sort goals
            const sortedGoals = [...filteredGoals].sort((a, b) => {
              const getVal = (g: CampaignGoal): number | string => {
                if (goalSort.col === "campaign") return g.campaignName;
                if (goalSort.col === "metric") return g.metric;
                if (goalSort.col === "target") return g.target;
                if (goalSort.col === "actual") return g.actual;
                if (goalSort.col === "gap") return g.actual - g.target;
                if (goalSort.col === "status") return g.status === "met" ? 0 : 1;
                return 0;
              };
              const av = getVal(a), bv = getVal(b);
              const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
              return goalSort.dir === "asc" ? cmp : -cmp;
            });

            const allForCampaign = CAMPAIGN_GOALS
              .filter(g => filteredCampaignNames.has(g.campaignName))
              .filter(g => goalTagFilter.length === 0 || goalTagFilter.includes(g.tag))
              .filter(g => goalMetricFilter.length === 0 || goalMetricFilter.includes(g.metric))
              .filter(g => !goalSearch || g.campaignName.toLowerCase().includes(goalSearch.toLowerCase()) || g.metric.toLowerCase().includes(goalSearch.toLowerCase()));
            const metCount = allForCampaign.filter(g => g.status === "met").length;
            const notMetCount = allForCampaign.filter(g => g.status === "not_met").length;
            const total = allForCampaign.length;
            const metPct = total > 0 ? Math.round((metCount / total) * 100) : 0;
            const notMetPct = total > 0 ? 100 - metPct : 0;

            // Donut chart data
            const donutData = [
              { name: "Met", value: metCount, color: TV.success },
              { name: "Not Met", value: notMetCount, color: TV.danger },
            ].filter(d => d.value > 0);

            const toggleGoalSort = (col: string) => {
              setGoalSort(prev => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
            };
            const GoalSortIcon = ({ col }: { col: string }) => {
              const active = goalSort.col === col;
              if (!active) return <ArrowUpDown size={11} style={{ color: TV.borderStrong, marginLeft: 2 }} />;
              return goalSort.dir === "asc"
                ? <ArrowUp size={12} style={{ color: TV.textBrand, marginLeft: 2 }} />
                : <ArrowDown size={12} style={{ color: TV.textBrand, marginLeft: 2 }} />;
            };

            return (
              <DashCard className="overflow-hidden flex flex-col min-w-0">
                {/* Header */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-b flex-wrap" style={{ borderColor: TV.borderDivider }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-[36px] h-[36px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: TV.brandTint, color: TV.textBrand }}>
                      <Goal size={18} />
                    </div>
                    <div>
                      <Text fz={14} fw={700} c={TV.textPrimary}>Goals & Success Metrics</Text>
                      <Text fz={11} c={TV.textSecondary}>{total} campaign{total !== 1 ? "s" : ""} with goals set</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <ChipFilter
                      label="Tag"
                      icon={Tag}
                      options={CAMPAIGN_TAGS.map(t => ({ value: t, label: t }))}
                      values={goalTagFilter}
                      onChange={setGoalTagFilter}
                      searchable
                    />
                    <ChipFilter
                      label="Metric"
                      icon={Target}
                      options={(["Open Rate", "Click Rate", "Reply Rate", "Video Completion", "CTA Rate"] as GoalMetric[]).map(m => ({ value: m, label: m }))}
                      values={goalMetricFilter}
                      onChange={setGoalMetricFilter}
                    />
                    <TextInput
                      placeholder="Search campaigns…"
                      value={goalSearch}
                      onChange={e => setGoalSearch(e.currentTarget.value)}
                      size="xs" radius="xl"
                      leftSection={<Search size={12} />}
                      rightSection={goalSearch ? <X size={11} style={{ cursor: "pointer" }} onClick={() => setGoalSearch("")} /> : null}
                      styles={{ input: { fontSize: 12, borderColor: TV.borderLight } }}
                      className="w-[150px]"
                    />
                  </div>
                </div>

                {/* Summary row: donut + status breakdown cards */}
                <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-0 border-b" style={{ borderColor: TV.borderDivider }}>
                  {/* Donut */}
                  <div className="flex items-center justify-center p-3 sm:border-r" style={{ borderColor: TV.borderDivider }}>
                    <div className="relative" style={{ width: 100, height: 100 }} role="img" aria-label={`Goal completion: ${metPct}% met`}>
                      <RPieChart id="goal-donut" width={100} height={100} role="presentation">
                        <Pie key="pie" data={donutData} cx="50%" cy="50%" innerRadius={30} outerRadius={44} paddingAngle={3} dataKey="value" stroke="none" isAnimationActive={false} tabIndex={-1}>
                          {donutData.map((d, i) => <Cell key={i} fill={d.color} tabIndex={undefined as any} />)}
                        </Pie>
                      </RPieChart>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-[18px] font-display" style={{ fontWeight: 800, lineHeight: 1, color: TV.textPrimary }}>{metPct}%</span>
                        <span className="text-[8px] uppercase tracking-wider" style={{ color: TV.textSecondary }}>met</span>
                      </div>
                    </div>
                  </div>

                  {/* Status breakdown cards */}
                  <div className="grid grid-cols-2 gap-px" style={{ background: TV.borderLight }}>
                    {([
                      { status: "met" as GoalStatus, count: metCount, pct: metPct, label: "Goals Met", sublabel: "Target achieved or exceeded" },
                      { status: "not_met" as GoalStatus, count: notMetCount, pct: notMetPct, label: "Not Met", sublabel: "Below target" },
                    ]).map(item => {
                      const gs = GOAL_STATUS_STYLES[item.status];
                      const IconComp = gs.icon;
                      const isActive = goalFilter === item.status;
                      return (
                        <button
                          key={item.status}
                          onClick={() => setGoalFilter(prev => prev === item.status ? "all" : item.status)}
                          className="flex items-center gap-2.5 px-3 py-3 text-left transition-all"
                          style={{
                            backgroundColor: isActive ? gs.bg : "#fff",
                            boxShadow: isActive ? `inset 0 0 0 2px ${gs.color}` : undefined,
                          }}
                          onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = TV.surfaceMuted; }}
                          onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = "#fff"; }}
                        >
                          <div className="w-[32px] h-[32px] rounded-sm flex items-center justify-center shrink-0" style={{ backgroundColor: gs.bg, color: gs.color }}>
                            <IconComp size={14} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-[18px] font-display" style={{ fontWeight: 700, lineHeight: 1, color: TV.textPrimary }}>{item.count}</span>
                              <span className="text-[10px]" style={{ color: TV.textSecondary }}>({item.pct}%)</span>
                            </div>
                            <span className="text-[9px] uppercase tracking-[0.5px]" style={{ color: gs.color }}>{item.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Campaign goals table */}
                <div className="overflow-x-auto flex-1">
                  <div className="min-w-[580px]">
                    {/* Table header */}
                    <div className="grid grid-cols-[2fr_1fr_0.7fr_0.7fr_0.7fr_0.6fr] gap-2 px-3 py-2 border-b" style={{ borderColor: TV.borderDivider, backgroundColor: TV.surface }}>
                      {[
                        { col: "campaign", label: "Campaign" },
                        { col: "metric", label: "Goal Metric" },
                        { col: "target", label: "Target" },
                        { col: "actual", label: "Actual" },
                        { col: "gap", label: "Gap" },
                        { col: "status", label: "Status" },
                      ].map(h => (
                        <button key={h.col} onClick={() => toggleGoalSort(h.col)} className="flex items-center gap-0.5 text-left" style={{ cursor: "pointer" }}>
                          <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ letterSpacing: "0.04em", color: goalSort.col === h.col ? TV.textBrand : TV.textLabel }}>{h.label}</span>
                          <GoalSortIcon col={h.col} />
                        </button>
                      ))}
                    </div>

                    {/* Rows */}
                    {(goalExpanded ? sortedGoals : sortedGoals.slice(0, 6)).map(g => {
                      const gs = GOAL_STATUS_STYLES[g.status];
                      const gap = g.actual - g.target;
                      const tagColor = TAG_COLORS[g.tag];
                      const StatusIcon = gs.icon;
                      return (
                        <div key={g.campaignName} className="grid grid-cols-[2fr_1fr_0.7fr_0.7fr_0.7fr_0.6fr] gap-2 px-3 py-2 border-b items-center transition-colors hover:bg-tv-surface-muted" style={{ borderColor: TV.borderDivider }}>
                          {/* Campaign name + tag */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className="w-[5px] h-[5px] rounded-full shrink-0" style={{ backgroundColor: tagColor?.color || TV.textSecondary }} />
                            <button
                              onClick={(e) => { e.stopPropagation(); navigateToCampaign(g.campaignName); }}
                              className="truncate text-left transition-colors hover:underline font-semibold"
                              style={{ color: TV.textBrand, fontSize: 11 }}
                              title={CAMPAIGN_NAME_TO_ID[g.campaignName] ? `Open "${g.campaignName}" campaign` : `View "${g.campaignName}" in Performance`}
                            >
                              {g.campaignName}
                            </button>
                          </div>
                          {/* Metric type */}
                          <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOAL_METRIC_COLORS[g.metric] }} />
                            <Text fz={10} c={TV.textSecondary}>{g.metric}</Text>
                          </div>
                          {/* Target */}
                          <Text fz={11} fw={600} c={TV.textSecondary}>{g.target}%</Text>
                          {/* Actual — with mini bar */}
                          <div>
                            <MiniBar pct={g.actual} color={GOAL_METRIC_COLORS[g.metric]} />
                          </div>
                          {/* Gap */}
                          <Text fz={11} fw={600} c={gap >= 0 ? TV.success : TV.danger}>
                            {gap >= 0 ? "+" : ""}{gap.toFixed(1)}%
                          </Text>
                          {/* Status badge */}
                          <Badge
                            size="xs" radius="xl" variant="light"
                            leftSection={<StatusIcon size={9} />}
                            styles={{ root: { backgroundColor: gs.bg, color: gs.color, border: `1px solid ${g.status === "met" ? TV.successBorder : TV.dangerBorder}` } }}
                          >
                            {gs.label}
                          </Badge>
                        </div>
                      );
                    })}

                    {sortedGoals.length === 0 && (
                      <div className="flex items-center justify-center py-6">
                        <Text fz={12} c={TV.textSecondary}>No goals match your filters</Text>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                {(() => {
                  const hasAnyGoalFilter = goalFilter !== "all" || goalTagFilter.length > 0 || goalMetricFilter.length > 0 || goalSearch !== "";
                  const activeGoalFilterCount = (goalFilter !== "all" ? 1 : 0) + (goalTagFilter.length > 0 ? 1 : 0) + (goalMetricFilter.length > 0 ? 1 : 0) + (goalSearch ? 1 : 0);
                  return (
                <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-t flex-wrap gap-2 mt-auto rounded-b-[16px]" style={{ borderColor: TV.borderDivider, backgroundColor: TV.surface }}>
                  <Text fz={10} c={TV.textSecondary}>
                    {sortedGoals.length} goal{sortedGoals.length !== 1 ? "s" : ""}
                    {goalFilter !== "all" ? ` · ${GOAL_STATUS_STYLES[goalFilter].label}` : ""}
                    {goalTagFilter.length > 0 ? ` · ${goalTagFilter.length} tag${goalTagFilter.length !== 1 ? "s" : ""}` : ""}
                    {goalMetricFilter.length > 0 ? ` · ${goalMetricFilter.join(", ")}` : ""}
                  </Text>
                  <div className="flex items-center gap-2">
                    {hasAnyGoalFilter && (
                      <Button size="xs" variant="subtle" color="gray" radius="xl" onClick={() => { setGoalFilter("all"); setGoalTagFilter([]); setGoalMetricFilter([]); setGoalSearch(""); }} leftSection={<X size={10} />}>
                        Clear {activeGoalFilterCount > 1 ? `(${activeGoalFilterCount})` : ""}
                      </Button>
                    )}
                    {sortedGoals.length > 6 && (
                      <Button size="xs" variant="light" color="tvPurple" radius="xl" onClick={() => setGoalExpanded(prev => !prev)}>
                        {goalExpanded ? "Show less" : `Show all ${sortedGoals.length}`}
                      </Button>
                    )}
                  </div>
                </div>
                  );
                })()}
              </DashCard>
            );
          })()}

          {/* ── Engagement over time (right column) ────────────────────── */}
          {(
          <DashCard className="px-4 sm:px-5 py-3 flex flex-col min-w-0 overflow-visible">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
              <Text fz={14} fw={700} c={TV.textPrimary}>Engagement over time</Text>
            </div>
            <SegmentedControl value={chartMode} onChange={v => setChartMode(v as any)} radius="xl" color="tvPurple" size="xs" mb="sm"
              data={[
                { value: "sends", label: "Sent" },
                { value: "opens", label: "Opens" },
                { value: "clicks", label: "Clicks" },
                { value: "views", label: "Views" },
                { value: "replies", label: "Replies" },
              ]}
              styles={{ root: { backgroundColor: TV.surface, border: "none" } }}
            />
            <ChartBox flex>
              {(w, h) => (
              <AreaChart id="engagement-trend" width={w} height={h} data={filteredTrend}>
                <defs key="user-gradient-defs">
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid key="grid" vertical={false} strokeDasharray="3 3" stroke={TV.borderLight} />
                <XAxis key="xaxis" dataKey="date" tick={{ fill: TV.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis key="yaxis" tick={{ fill: TV.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} width={35} />
                <RTooltip key="tooltip" content={<EngagementTooltip chartMode={chartMode} chartColor={chartColor} filteredCampaignNames={new Set(filteredCampaigns.map(c => c.name))} onCampaignClick={navigateToCampaign} onDrillDown={setChartDrillDate} />} cursor={{ stroke: TV.borderStrong, strokeDasharray: "3 3" }} wrapperStyle={{ pointerEvents: "auto", zIndex: 9999, overflow: "visible" }} allowEscapeViewBox={{ x: true, y: true }} />
                <Area key="area" type="monotone" dataKey={chartMode} stroke={chartColor} strokeWidth={2.5} fill="url(#chartGrad)" dot={{ fill: chartColor, r: 3, strokeWidth: 0, cursor: "pointer" }} activeDot={{ r: 6, cursor: "pointer", onClick: (_: any, payload: any) => { if (payload?.payload?.date) setChartDrillDate(payload.payload.date); } }} />
              </AreaChart>
              )}
            </ChartBox>
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={() => { setMainTab("tags"); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className="text-[11px] transition-colors hover:underline"
                style={{ color: TV.textBrand }}
              >
                View top campaigns by tag →
              </button>
            </div>
          </DashCard>
          )}

          </div>)}{/* end 2-column grid */}

          {/* Chart drilldown drawer */}
          <Drawer opened={!!chartDrillDate} onClose={() => setChartDrillDate(null)} position="right" size="md" title={`Campaign breakdown — ${chartDrillDate}`} styles={DRAWER_STYLES}>
            {chartDrillDate && (() => {
              const breakdown = TREND_CAMPAIGN_BREAKDOWN[chartDrillDate];
              const filteredNames = new Set(filteredCampaigns.map(c => c.name));
              const rows = breakdown
                ? breakdown.filter(b => filteredNames.size === 0 || filteredNames.has(b.campaign))
                    .sort((a, b) => (b[chartMode as keyof typeof b] as number) - (a[chartMode as keyof typeof a] as number))
                : [];
              const metricLabel = METRIC_LABELS[chartMode] || chartMode;
              const total = rows.reduce((s, r) => s + (r[chartMode as keyof typeof r] as number), 0);
              return (
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b" style={{ borderColor: TV.borderDivider }}>
                    <div>
                      <Text fz={11} c={TV.textSecondary} tt="uppercase" lts="0.5px">Total {metricLabel}</Text>
                      <Text fz={22} fw={800} c={chartColor}>{total}</Text>
                    </div>
                    <Badge variant="light" color="tvPurple" radius="xl">{rows.length} campaign{rows.length !== 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="space-y-2">
                    {rows.map(r => {
                      const val = r[chartMode as keyof typeof r] as number;
                      const pct = total > 0 ? (val / total) * 100 : 0;
                      return (
                        <div key={r.campaign} className="p-3 rounded-lg border transition-colors hover:bg-tv-surface-muted" style={{ borderColor: TV.borderLight }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <button onClick={() => { setChartDrillDate(null); navigateToCampaign(r.campaign); }} className="text-[13px] font-semibold text-left truncate transition-colors hover:underline" style={{ color: TV.textBrand }}>{r.campaign}</button>
                            <Text fz={14} fw={700} c={chartColor}>{val}</Text>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: TV.borderLight }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: chartColor, opacity: 0.7 }} />
                          </div>
                          <div className="grid grid-cols-5 gap-2 mt-2">
                            {(["sends", "opens", "clicks", "views", "replies"] as const).map(k => (
                              <div key={k} className="text-center">
                                <Text fz={9} c={TV.textSecondary} tt="uppercase">{k}</Text>
                                <Text fz={12} fw={k === chartMode ? 700 : 500} c={k === chartMode ? chartColor : TV.textPrimary}>{r[k]}</Text>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {rows.length === 0 && <Text fz={13} c={TV.textSecondary} ta="center" py="xl">No campaign data for this date</Text>}
                  </div>
                </div>
              );
            })()}
          </Drawer>

          {/* ── Best Performing Video Clips ─────────────────────────────── */}
          {(() => {
            // Sort clips
            const sortedClips = [...filteredClips].sort((a, b) => {
              const col = clipSort.col;
              const av = col === "title" ? a.title : col === "campaignName" ? a.campaignName : (a as any)[col] ?? 0;
              const bv = col === "title" ? b.title : col === "campaignName" ? b.campaignName : (b as any)[col] ?? 0;
              const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
              return clipSort.dir === "asc" ? cmp : -cmp;
            });
            const displayClips = clipsExpanded ? sortedClips : sortedClips.slice(0, 8);
            const toggleClipSort = (col: string) => {
              setClipSort(prev => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" });
            };
            const ClipSortIcon = ({ col }: { col: string }) => {
              const active = clipSort.col === col;
              if (!active) return <ArrowUpDown size={11} style={{ color: TV.borderStrong, marginLeft: 2 }} />;
              return clipSort.dir === "asc"
                ? <ArrowUp size={12} style={{ color: TV.textBrand, marginLeft: 2 }} />
                : <ArrowDown size={12} style={{ color: TV.textBrand, marginLeft: 2 }} />;
            };

            if (campaignFilteredClips.length === 0) return null;
            return (
              <DashCard className="overflow-hidden mb-4">
                <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b flex-wrap gap-2" style={{ borderColor: TV.borderDivider }}>
                  <div className="flex items-center gap-2">
                    <Play size={15} style={{ color: TV.brand }} />
                    <div>
                      <Text fz={14} fw={700} c={TV.textPrimary}>Best performing video clips</Text>
                      <Text fz={11} c={TV.textSecondary}>{clipsExpanded ? "All" : "Top"} {displayClips.length}{!clipsExpanded && sortedClips.length > 8 ? ` of ${sortedClips.length}` : ""} clips ranked by {clipSort.col === "openRate" ? "open rate" : clipSort.col === "clickRate" ? "click rate" : clipSort.col === "views" ? "views" : clipSort.col === "avgCompletion" ? "completion" : clipSort.col === "sender" ? "sender" : "open rate"}</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {compareClips.length >= 2 && (
                      <Button size="xs" variant="light" color="tvPurple" radius="xl" leftSection={<GitCompareArrows size={13} />} onClick={() => setCompareOpen(true)}>
                        Compare {compareClips.length}
                      </Button>
                    )}
                    {compareClips.length > 0 && compareClips.length < 2 && (
                      <Text fz={11} c={TV.textSecondary}>Select {2 - compareClips.length} more to compare</Text>
                    )}
                    <TextInput
                      placeholder="Search clips…"
                      value={clipSearch}
                      onChange={e => setClipSearch(e.currentTarget.value)}
                      size="xs" radius="xl"
                      leftSection={<Search size={12} />}
                      rightSection={clipSearch ? <X size={11} style={{ cursor: "pointer" }} onClick={() => setClipSearch("")} /> : null}
                      styles={{ input: { fontSize: 12, borderColor: TV.borderLight, minWidth: 160 } }}
                    />
                    <ColumnsButton onClick={() => setShowEditClipColumns(true)} />
                  </div>
                </div>

                {filteredClips.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 px-4">
                    <Search size={24} style={{ color: TV.borderStrong }} />
                    <Text fz={13} c={TV.textSecondary} mt={8}>No clips match "{clipSearch}"</Text>
                    <Button variant="subtle" color="tvPurple" size="xs" mt={8} onClick={() => setClipSearch("")}>Clear search</Button>
                  </div>
                )}

                {/* Desktop table */}
                {filteredClips.length > 0 && <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 1050 }}>
                    <thead>
                      <tr style={{ backgroundColor: TV.surface }}>
                        <th className="px-2 py-2.5 w-[36px]">
                          <Tooltip label={compareClips.length > 0 ? "Clear compare selection" : "Select clips to compare"}>
                            <ActionIcon variant="subtle" color={compareClips.length > 0 ? "tvPurple" : "gray"} size="xs" radius="xl" onClick={() => setCompareClips([])} aria-label="Compare clips">
                              <GitCompareArrows size={12} />
                            </ActionIcon>
                          </Tooltip>
                        </th>
                        {activeClipColumns.map(colKey => {
                          const col = CLIP_COLUMNS.find(c => c.key === colKey);
                          if (!col) return null;
                          const isRightAligned = ["openRate", "clickRate", "views", "avgCompletion"].includes(colKey);
                          return (
                            <th key={colKey} className={`${isRightAligned ? "text-right" : "text-left"} px-3 py-2.5`} style={colKey === "title" ? { width: "28%" } : colKey === "avgCompletion" ? { paddingRight: 16 } : undefined}>
                              <button onClick={() => toggleClipSort(colKey)} className={`flex items-center gap-1 ${isRightAligned ? "ml-auto" : ""}`}>
                                <Text fz={11} fw={600} tt="uppercase" lts="0.04em" c={clipSort.col === colKey ? TV.textBrand : TV.textSecondary}>{col.label}</Text>
                                <ClipSortIcon col={colKey} />
                              </button>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {displayClips.map((clip) => {
                        const isCompareSelected = compareClips.some(c => c.id === clip.id);
                        const toggleCompare = () => {
                          setCompareClips(prev => prev.some(c => c.id === clip.id)
                            ? prev.filter(c => c.id !== clip.id)
                            : prev.length < 3 ? [...prev, clip] : prev
                          );
                        };
                        return (
                        <tr key={clip.id} className={`group transition-colors ${isCompareSelected ? "bg-tv-brand-tint" : "hover:bg-[#f5f3fa]"}`} style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
                          <td className="px-2 py-3 text-center">
                            <Tooltip label={isCompareSelected ? "Remove from compare" : compareClips.length >= 3 ? "Max 3 clips" : "Add to compare"}>
                              <Checkbox
                                checked={isCompareSelected}
                                onChange={toggleCompare}
                                color="tvPurple"
                                size="xs"
                                disabled={!isCompareSelected && compareClips.length >= 3}
                                aria-label={`Compare ${clip.title}`}
                              />
                            </Tooltip>
                          </td>
                          {activeClipColumns.map(colKey => {
                            switch (colKey) {
                              case "title":
                                return (
                                  <td key={colKey} className="px-3 py-3">
                                    <button onClick={() => setClipDrawer(clip)} className="flex items-center gap-3 text-left w-full group/clip">
                                      <div className="relative shrink-0 w-[72px] h-[44px] rounded-sm overflow-hidden bg-[#1a1a2e]">
                                        <img src={clip.thumbnail} alt={clip.title || "Video clip thumbnail"} className="w-full h-full object-cover opacity-85" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                          <div className="w-[22px] h-[22px] rounded-full bg-white/90 flex items-center justify-center">
                                            <Play size={10} fill={TV.brand} color={TV.brand} />
                                          </div>
                                        </div>
                                        <div className="absolute bottom-0.5 right-0.5 px-1 py-px rounded bg-black/70">
                                          <Text fz={9} c="#fff" fw={600}>{clip.duration}</Text>
                                        </div>
                                      </div>
                                      <div className="min-w-0">
                                        <Text fz={13} fw={600} c={TV.textBrand} className="truncate group-hover/clip:underline">{clip.title}</Text>
                                        <Text fz={11} c={TV.textSecondary}>{clip.createdAt}</Text>
                                      </div>
                                    </button>
                                  </td>
                                );
                              case "campaignName":
                                return (
                                  <td key={colKey} className="px-3 py-3">
                                    <button
                                      onClick={() => navigateToCampaign(clip.campaignName)}
                                      className="truncate text-left transition-colors hover:underline"
                                      style={{ color: TV.textBrand, fontSize: 12, maxWidth: 160 }}
                                      title={`View "${clip.campaignName}" in Performance`}
                                    >
                                      {clip.campaignName}
                                    </button>
                                  </td>
                                );
                              case "sender":
                                return (
                                  <td key={colKey} className="px-3 py-3">
                                    <Text fz={12} c={TV.textPrimary} className="truncate" style={{ maxWidth: 130 }}>{clip.sender}</Text>
                                  </td>
                                );
                              case "openRate":
                                return (
                                  <td key={colKey} className="px-3 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-[48px] h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: TV.borderLight }}>
                                        <div className="h-full rounded-full" style={{ width: `${clip.openRate}%`, backgroundColor: TV.brand }} />
                                      </div>
                                      <Text fz={13} fw={600} c={clip.openRate >= 80 ? TV.success : clip.openRate >= 60 ? TV.textPrimary : TV.textSecondary}>{clip.openRate.toFixed(1)}%</Text>
                                    </div>
                                  </td>
                                );
                              case "clickRate":
                                return (
                                  <td key={colKey} className="px-3 py-3 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      <div className="w-[48px] h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: TV.borderLight }}>
                                        <div className="h-full rounded-full" style={{ width: `${Math.min(clip.clickRate, 100)}%`, backgroundColor: TV.info }} />
                                      </div>
                                      <Text fz={13} fw={600} c={clip.clickRate >= 40 ? TV.success : TV.textPrimary}>{clip.clickRate.toFixed(1)}%</Text>
                                    </div>
                                  </td>
                                );
                              case "views":
                                return (
                                  <td key={colKey} className="px-3 py-3 text-right">
                                    <Text fz={13} fw={600} c={TV.textPrimary}>{clip.views.toLocaleString()}</Text>
                                  </td>
                                );
                              case "avgCompletion":
                                return (
                                  <td key={colKey} className="px-4 py-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      <div className="w-[48px] h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: TV.borderLight }}>
                                        <div className="h-full rounded-full" style={{ width: `${clip.avgCompletion}%`, backgroundColor: TV.success }} />
                                      </div>
                                      <Text fz={13} fw={600} c={clip.avgCompletion >= 70 ? TV.success : TV.textPrimary}>{clip.avgCompletion}%</Text>
                                    </div>
                                  </td>
                                );
                              default:
                                return null;
                            }
                          })}
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>}

                {/* Mobile cards */}
                {filteredClips.length > 0 && <div className="lg:hidden divide-y" style={{ borderColor: TV.borderLight }}>
                  {displayClips.map((clip) => {
                    const isCompSel = compareClips.some(c => c.id === clip.id);
                    return (
                    <div key={clip.id} className={`px-4 py-3 ${isCompSel ? "bg-tv-brand-tint" : ""}`}>
                      <div className="flex items-start gap-2 mb-2.5">
                        <Checkbox
                          checked={isCompSel}
                          onChange={() => setCompareClips(prev => prev.some(c => c.id === clip.id) ? prev.filter(c => c.id !== clip.id) : prev.length < 3 ? [...prev, clip] : prev)}
                          color="tvPurple" size="xs" mt={4}
                          disabled={!isCompSel && compareClips.length >= 3}
                          aria-label={`Compare ${clip.title}`}
                        />
                      <button onClick={() => setClipDrawer(clip)} className="flex gap-3 text-left flex-1 group/clip">
                        <div className="relative shrink-0 w-[80px] h-[50px] rounded-sm overflow-hidden bg-[#1a1a2e]">
                          <img src={clip.thumbnail} alt={clip.title || "Video clip thumbnail"} className="w-full h-full object-cover opacity-85" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[24px] h-[24px] rounded-full bg-white/90 flex items-center justify-center">
                              <Play size={11} fill={TV.brand} color={TV.brand} />
                            </div>
                          </div>
                          <div className="absolute bottom-0.5 right-0.5 px-1 py-px rounded bg-black/70">
                            <Text fz={9} c="#fff" fw={600}>{clip.duration}</Text>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <Text fz={13} fw={600} c={TV.textBrand} className="truncate group-hover/clip:underline">{clip.title}</Text>
                          <span
                            role="link"
                            tabIndex={-1}
                            onClick={(e) => { e.stopPropagation(); navigateToCampaign(clip.campaignName); }}
                            className="truncate text-left transition-colors hover:underline block cursor-pointer"
                            style={{ color: TV.textBrand, fontSize: 11 }}
                          >
                            {clip.campaignName}
                          </span>
                          <Text fz={10} c={TV.textSecondary}>{clip.sender} · {clip.createdAt}</Text>
                        </div>
                      </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 ml-6">
                        {[
                          { label: "Open", value: `${clip.openRate.toFixed(1)}%`, pct: clip.openRate, color: TV.brand },
                          { label: "Click", value: `${clip.clickRate.toFixed(1)}%`, pct: clip.clickRate, color: TV.info },
                          { label: "Views", value: clip.views.toLocaleString(), pct: 0, color: "" },
                          { label: "Compl.", value: `${clip.avgCompletion}%`, pct: clip.avgCompletion, color: TV.success },
                        ].map(m => (
                          <div key={m.label} className="text-center">
                            <Text fz={10} c={TV.textSecondary} mb={2}>{m.label}</Text>
                            <Text fz={12} fw={600} c={TV.textPrimary}>{m.value}</Text>
                            {m.pct > 0 && (
                              <div className="w-full h-[3px] rounded-full mt-1" style={{ backgroundColor: TV.borderLight }}>
                                <div className="h-full rounded-full" style={{ width: `${Math.min(m.pct, 100)}%`, backgroundColor: m.color }} />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    );
                  })}
                </div>}

                {/* Footer with Show More */}
                {filteredClips.length > 0 && sortedClips.length > 8 && (
                  <div className="flex items-center justify-center px-4 py-2.5 border-t rounded-b-[16px]" style={{ borderColor: TV.borderDivider, backgroundColor: TV.surface }}>
                    <Button size="xs" variant="light" color="tvPurple" radius="xl" onClick={() => setClipsExpanded(prev => !prev)}>
                      {clipsExpanded ? "Show less" : `Show all ${sortedClips.length} clips`}
                    </Button>
                  </div>
                )}
              </DashCard>
            );
          })()}

          {/* Video Clip Preview Drawer */}
          <Drawer opened={!!clipDrawer} onClose={() => setClipDrawer(null)} position="right" size="md" title={clipDrawer?.title ?? "Video Preview"} styles={DRAWER_STYLES}>
            {clipDrawer && (
              <div>
                {/* Video preview */}
                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#1a1a2e] mb-4">
                  <img src={clipDrawer.thumbnail} alt={clipDrawer.title || "Video clip detail"} className="w-full h-full object-cover opacity-85" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-[56px] h-[56px] rounded-full bg-white/90 flex items-center justify-center">
                      <Play size={24} fill={TV.brand} color={TV.brand} />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-black/70">
                    <Text fz={11} c="#fff" fw={600}>{clipDrawer.duration}</Text>
                  </div>
                </div>

                {/* Campaign link */}
                <div className="flex items-center gap-2 mb-4">
                  <Text fz={11} c={TV.textSecondary}>Campaign:</Text>
                  <button onClick={() => { setClipDrawer(null); navigateToCampaign(clipDrawer.campaignName); }} className="text-[12px] font-semibold hover:underline" style={{ color: TV.textBrand }}>{clipDrawer.campaignName}</button>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {[
                    { label: "Open Rate", value: `${clipDrawer.openRate.toFixed(1)}%`, color: TV.brand },
                    { label: "Click Rate", value: `${clipDrawer.clickRate.toFixed(1)}%`, color: TV.info },
                    { label: "Total Views", value: clipDrawer.views.toLocaleString(), color: TV.textPrimary },
                    { label: "Avg Completion", value: `${clipDrawer.avgCompletion}%`, color: TV.success },
                  ].map(s => (
                    <div key={s.label} className="p-3 rounded-lg border" style={{ borderColor: TV.borderLight }}>
                      <Text fz={10} c={TV.textSecondary} tt="uppercase" lts="0.5px" mb={4}>{s.label}</Text>
                      <Text fz={18} fw={700} c={s.color}>{s.value}</Text>
                    </div>
                  ))}
                </div>

                {/* Details */}
                <div className="space-y-2 border-t pt-3" style={{ borderColor: TV.borderDivider }}>
                  <div className="flex justify-between"><Text fz={12} c={TV.textSecondary}>Sender</Text><Text fz={12} fw={600} c={TV.textPrimary}>{clipDrawer.sender}</Text></div>
                  <div className="flex justify-between"><Text fz={12} c={TV.textSecondary}>Created</Text><Text fz={12} fw={600} c={TV.textPrimary}>{clipDrawer.createdAt}</Text></div>
                  <div className="flex justify-between"><Text fz={12} c={TV.textSecondary}>Duration</Text><Text fz={12} fw={600} c={TV.textPrimary}>{clipDrawer.duration}</Text></div>
                </div>

                {/* Engagement timeline */}
                <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: TV.surface, border: `1px solid ${TV.borderLight}` }}>
                  <Text fz={11} fw={600} c={TV.textSecondary} tt="uppercase" lts="0.5px" mb={8}>Engagement timeline</Text>
                  <div className="space-y-2">
                    {[
                      { label: "First view", time: clipDrawer.timeline.firstView, icon: Eye },
                      { label: "Peak views", time: clipDrawer.timeline.peakViews, icon: TrendingUp },
                      { label: "Last view", time: clipDrawer.timeline.lastView, icon: Clock },
                    ].map(ev => (
                      <div key={ev.label} className="flex items-center gap-2">
                        <ev.icon size={12} style={{ color: TV.textSecondary }} />
                        <Text fz={11} c={TV.textPrimary}>{ev.label}</Text>
                        <Text fz={11} c={TV.textSecondary} ml="auto">{ev.time}</Text>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </Drawer>

          {/* Video Clip Compare Drawer */}
          <Drawer opened={compareOpen} onClose={() => setCompareOpen(false)} position="right" size="xl" title="Compare Video Clips" styles={DRAWER_STYLES}>
            {compareClips.length >= 2 && (() => {
              const metrics: { key: keyof VideoClip; label: string; format: (v: any) => string; color: string; higherBetter: boolean }[] = [
                { key: "openRate", label: "Open Rate", format: (v: number) => `${v.toFixed(1)}%`, color: TV.brand, higherBetter: true },
                { key: "clickRate", label: "Click Rate", format: (v: number) => `${v.toFixed(1)}%`, color: TV.info, higherBetter: true },
                { key: "views", label: "Total Views", format: (v: number) => v.toLocaleString(), color: TV.textPrimary, higherBetter: true },
                { key: "avgCompletion", label: "Avg Completion", format: (v: number) => `${v}%`, color: TV.success, higherBetter: true },
              ];
              const best = (key: keyof VideoClip) => {
                const vals = compareClips.map(c => c[key] as number);
                return Math.max(...vals);
              };
              return (
                <div>
                  {/* Clip headers */}
                  <div className={`grid gap-4 mb-6`} style={{ gridTemplateColumns: `repeat(${compareClips.length}, 1fr)` }}>
                    {compareClips.map(clip => (
                      <div key={clip.id} className="text-center">
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-[#1a1a2e] mb-3">
                          <img src={clip.thumbnail} alt={clip.title || "Video clip thumbnail"} className="w-full h-full object-cover opacity-85" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[40px] h-[40px] rounded-full bg-white/90 flex items-center justify-center">
                              <Play size={16} fill={TV.brand} color={TV.brand} />
                            </div>
                          </div>
                          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70">
                            <Text fz={10} c="#fff" fw={600}>{clip.duration}</Text>
                          </div>
                        </div>
                        <Text fz={13} fw={700} c={TV.textPrimary} className="truncate mb-0.5">{clip.title}</Text>
                        <Text fz={11} c={TV.textSecondary} className="truncate">{clip.sender}</Text>
                        <button
                          onClick={() => { setCompareOpen(false); navigateToCampaign(clip.campaignName); }}
                          className="text-[11px] hover:underline truncate block mx-auto mt-0.5"
                          style={{ color: TV.textBrand }}
                        >
                          {clip.campaignName}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Metrics comparison */}
                  <div className="space-y-1">
                    {metrics.map(m => {
                      const bestVal = best(m.key);
                      return (
                        <div key={m.key} className="rounded-lg border p-3" style={{ borderColor: TV.borderLight }}>
                          <Text fz={10} c={TV.textSecondary} tt="uppercase" lts="0.5px" mb={8}>{m.label}</Text>
                          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${compareClips.length}, 1fr)` }}>
                            {compareClips.map(clip => {
                              const val = clip[m.key] as number;
                              const isBest = val === bestVal && m.higherBetter;
                              return (
                                <div key={clip.id} className="text-center">
                                  <Text fz={20} fw={700} c={isBest ? m.color : TV.textSecondary}>
                                    {m.format(val)}
                                  </Text>
                                  {isBest && compareClips.length > 2 && (
                                    <Badge size="xs" variant="light" color="green" radius="xl" mt={4}>Best</Badge>
                                  )}
                                  {!isBest && m.key !== "views" && (
                                    <Text fz={10} c={TV.textSecondary} mt={2}>
                                      {((val - bestVal)).toFixed(1)}pp
                                    </Text>
                                  )}
                                  {/* Mini progress bar */}
                                  {m.key !== "views" && (
                                    <div className="w-full h-[4px] rounded-full mt-2 mx-auto" style={{ backgroundColor: TV.borderLight, maxWidth: 120 }}>
                                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(val, 100)}%`, backgroundColor: isBest ? m.color : TV.borderStrong }} />
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Engagement timeline comparison */}
                  <div className="mt-4 rounded-lg border p-3" style={{ borderColor: TV.borderLight }}>
                    <Text fz={10} c={TV.textSecondary} tt="uppercase" lts="0.5px" mb={8}>Details</Text>
                    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${compareClips.length}, 1fr)` }}>
                      {compareClips.map(clip => (
                        <div key={clip.id} className="space-y-2">
                          <div>
                            <Text fz={10} c={TV.textSecondary}>Duration</Text>
                            <Text fz={12} fw={600} c={TV.textPrimary}>{clip.duration}</Text>
                          </div>
                          <div>
                            <Text fz={10} c={TV.textSecondary}>Created</Text>
                            <Text fz={12} fw={600} c={TV.textPrimary}>{clip.createdAt}</Text>
                          </div>
                          <div>
                            <Text fz={10} c={TV.textSecondary}>First view</Text>
                            <Text fz={12} fw={600} c={TV.textPrimary}>{clip.timeline.firstView}</Text>
                          </div>
                          <div>
                            <Text fz={10} c={TV.textSecondary}>Peak views</Text>
                            <Text fz={12} fw={600} c={TV.textPrimary}>{clip.timeline.peakViews}</Text>
                          </div>
                          <div>
                            <Text fz={10} c={TV.textSecondary}>Last view</Text>
                            <Text fz={12} fw={600} c={TV.textPrimary}>{clip.timeline.lastView}</Text>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t" style={{ borderColor: TV.borderDivider }}>
                    <Button variant="subtle" color="gray" size="xs" onClick={() => setCompareClips([])} styles={{ root: { color: TV.textSecondary, fontSize: 14 } }}>
                      Clear selection
                    </Button>
                    <Button variant="subtle" color="tvPurple" size="xs" onClick={() => setCompareOpen(false)}>
                      Done
                    </Button>
                  </div>
                </div>
              );
            })()}
          </Drawer>

          {/* ── Performance by Tag ────────────────────────────────────────── */}
          {(() => {
            const searchedTagGroups = tagSearch
              ? sortedTagGroups.filter(g => g.tag.toLowerCase().includes(tagSearch.toLowerCase()))
              : sortedTagGroups;
            const displayTagGroups = searchedTagGroups.slice(0, tagsVisibleCount);
            const hasMoreTags = searchedTagGroups.length > tagsVisibleCount;
            const remainingTags = searchedTagGroups.length - tagsVisibleCount;
            return (
          <DashCard className="overflow-hidden" id="performance-by-tag">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b flex-wrap gap-2" style={{ borderColor: TV.borderDivider }}>
              <div>
                <Text fz={15} fw={600} c={TV.textPrimary}>Performance by tag</Text>
                <Text fz={11} c={TV.textSecondary}>{searchedTagGroups.length} tag{searchedTagGroups.length !== 1 ? "s" : ""} · {searchedTagGroups.reduce((s, g) => s + g.campaigns.length, 0)} campaigns · {searchedTagGroups.reduce((s, g) => s + g.totalSent, 0).toLocaleString()} total sent</Text>
              </div>
              <div className="flex items-center gap-2">
                <TextInput
                  placeholder="Search tags…"
                  value={tagSearch}
                  onChange={e => setTagSearch(e.currentTarget.value)}
                  size="xs" radius="xl"
                  leftSection={<Search size={12} />}
                  rightSection={tagSearch ? <X size={11} style={{ cursor: "pointer" }} onClick={() => setTagSearch("")} /> : null}
                  styles={{ input: { fontSize: 12, borderColor: TV.borderLight, minWidth: 160 } }}
                />
                <Tooltip label="Export tag report">
                  <ActionIcon variant="subtle" color="gray" radius="xl" onClick={() => show("Tag report exported", "success")} aria-label="Export tag report"><Download size={14} /></ActionIcon>
                </Tooltip>
                <Button variant="subtle" color="tvPurple" size="compact-xs" rightSection={<ChevronRight size={11} />} onClick={() => { setMainTab("tags"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
                  View all tags
                </Button>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block">
              {(() => {
                const cols: { key: string; label: string; w: string }[] = [
                  { key: "tag", label: "Tag", w: "2fr" },
                  { key: "campaigns", label: "Campaigns", w: "0.7fr" },
                  { key: "totalSent", label: "Total Sent", w: "0.8fr" },
                  { key: "avgOpenRate", label: "Open %", w: "0.9fr" },
                  { key: "avgClickRate", label: "Click %", w: "0.9fr" },
                  { key: "avgReplyRate", label: "Reply %", w: "0.9fr" },
                  { key: "avgVideoPct", label: "Avg Video", w: "0.9fr" },
                ];
                const gridTemplate = cols.map(c => c.w).join(" ") + " 36px";
                const toggleTagSort = (col: string) => {
                  setTagSort(prev => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" });
                };
                return (
                  <>
                    <div className="grid gap-3 px-5 py-2.5 bg-tv-surface-muted border-b" style={{ gridTemplateColumns: gridTemplate, borderColor: TV.borderDivider }}>
                      {cols.map(col => {
                        const active = tagSort.col === col.key;
                        return (
                          <button key={col.key} onClick={() => toggleTagSort(col.key)} className="flex items-center gap-1 group text-left">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap select-none transition-colors" style={{ color: active ? TV.textBrand : TV.textSecondary }}>
                              {col.label}
                            </span>
                            <span className="shrink-0 transition-colors" style={{ color: active ? TV.textBrand : TV.borderStrong }}>
                              {active && tagSort.dir === "asc" ? <ArrowUp size={12} /> :
                               active && tagSort.dir === "desc" ? <ArrowDown size={12} /> :
                               <ArrowUpDown size={11} />}
                            </span>
                          </button>
                        );
                      })}
                      <span />
                    </div>
                    {displayTagGroups.map(g => {
                      const isExpanded = expandedTag === g.tag;
                      const tc = TAG_COLORS[g.tag];
                      const topCamps = [...g.campaigns].sort((a, b) => {
                        const aRate = a.delivered > 0 ? (a.opened / a.delivered) * 100 : 0;
                        const bRate = b.delivered > 0 ? (b.opened / b.delivered) * 100 : 0;
                        return bRate - aRate;
                      }).slice(0, 5);
                      return (
                        <div key={g.tag}>
                          <button
                            onClick={() => setExpandedTag(isExpanded ? null : g.tag)}
                            className={`w-full grid gap-3 px-5 py-3.5 border-b hover:bg-tv-surface-muted transition-colors text-left items-center ${isExpanded ? "bg-tv-surface-muted" : ""}`}
                            style={{ gridTemplateColumns: gridTemplate, borderColor: TV.borderDivider }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: tc.bg }}>
                                <BarChart3 size={14} style={{ color: tc.color }} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[13px] font-semibold truncate" style={{ color: TV.textPrimary }}>{g.tag}</p>
                                <p className="text-[11px]" style={{ color: TV.textSecondary }}>
                                  {g.trendUp > 0 && <span style={{ color: TV.success }}>↑{g.trendUp}</span>}
                                  {g.trendUp > 0 && g.trendDown > 0 && " · "}
                                  {g.trendDown > 0 && <span style={{ color: TV.danger }}>↓{g.trendDown}</span>}
                                  {g.trendUp === 0 && g.trendDown === 0 && "—"}
                                </p>
                              </div>
                            </div>
                            <Text fz={13} fw={600} c={TV.textPrimary}>{g.campaigns.length}</Text>
                            <Text fz={13} fw={600} c={TV.textPrimary}>{g.totalSent.toLocaleString()}</Text>
                            <MiniBar pct={g.avgOpenRate} color={TV.textBrand} />
                            <MiniBar pct={g.avgClickRate} color={TV.info} />
                            <MiniBar pct={g.avgReplyRate} color={TV.success} />
                            <MiniBar pct={g.avgVideoPct} color={TV.warning} />
                            <div className="flex items-center gap-1">
                              {!isExpanded && <Text fz={10} c={TV.textDecorative}>View details</Text>}
                              {isExpanded ? <ChevronDown size={14} style={{ color: TV.textBrand }} /> : <ChevronRight size={14} style={{ color: TV.textBrand }} />}
                            </div>
                          </button>

                          {/* Expanded drilldown */}
                          {isExpanded && (
                            <div style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
                              {/* Comparison bars: this category vs overall average */}
                              <div className="px-5 py-4 bg-tv-surface-muted">
                                <Text fz={11} fw={600} c={TV.textSecondary} mb={10} className="uppercase tracking-[0.04em]">Category vs. overall average</Text>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                                  {([
                                    { label: "Open Rate", val: g.avgOpenRate, avg: OVERALL_AVG.openRate, color: TV.textBrand },
                                    { label: "Click Rate", val: g.avgClickRate, avg: OVERALL_AVG.clickRate, color: TV.info },
                                    { label: "Reply Rate", val: g.avgReplyRate, avg: OVERALL_AVG.replyRate, color: TV.success },
                                    { label: "Avg Video", val: g.avgVideoPct, avg: OVERALL_AVG.videoPct, color: TV.warning },
                                  ] as const).map(m => {
                                    const diff = m.val - m.avg;
                                    const maxVal = Math.max(m.val, m.avg, 1);
                                    return (
                                      <div key={m.label}>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <span className="text-[11px] font-semibold" style={{ color: TV.textSecondary }}>{m.label}</span>
                                          <span className="text-[11px] font-semibold" style={{ color: diff > 0 ? TV.success : diff < -2 ? TV.danger : TV.textSecondary }}>
                                            {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                                          </span>
                                        </div>
                                        {/* Category bar */}
                                        <div className="flex items-center gap-2 mb-1">
                                          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: TV.borderLight }}>
                                            <div className="h-full rounded-full" style={{ width: `${(m.val / maxVal) * 100}%`, backgroundColor: m.color }} />
                                          </div>
                                          <span className="text-[12px] font-semibold w-12 text-right" style={{ color: TV.textPrimary }}>{m.val.toFixed(1)}%</span>
                                        </div>
                                        {/* Average bar */}
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: TV.borderLight }}>
                                            <div className="h-full rounded-full opacity-40" style={{ width: `${(m.avg / maxVal) * 100}%`, backgroundColor: m.color }} />
                                          </div>
                                          <span className="text-[10px] w-12 text-right" style={{ color: TV.textDecorative }}>avg {m.avg.toFixed(1)}%</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Volume breakdown */}
                              <div className="px-5 py-3 border-t" style={{ borderColor: TV.borderDivider, backgroundColor: TV.surfaceMuted }}>
                                <div className="grid grid-cols-5 gap-4">
                                  <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>Sent</p>
                                    <p className="text-[15px] font-bold" style={{ color: TV.textPrimary }}>{g.totalSent.toLocaleString()}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>Delivered</p>
                                    <p className="text-[15px] font-bold" style={{ color: TV.textPrimary }}>{g.totalDelivered.toLocaleString()}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>Opened</p>
                                    <p className="text-[15px] font-bold" style={{ color: TV.textBrand }}>{g.totalOpened.toLocaleString()}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>Clicked</p>
                                    <p className="text-[15px] font-bold" style={{ color: TV.info }}>{g.totalClicked.toLocaleString()}</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-[10px] uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>Replied</p>
                                    <p className="text-[15px] font-bold" style={{ color: TV.success }}>{g.totalReplied.toLocaleString()}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Top campaigns in this category */}
                              <div className="border-t" style={{ borderColor: TV.borderDivider }}>
                                <div className="flex items-center justify-between px-5 py-2.5">
                                  <Text fz={11} fw={600} c={TV.textSecondary} className="uppercase tracking-[0.04em]">Top campaigns by open rate</Text>
                                  <Button variant="subtle" color="tvPurple" size="compact-xs" rightSection={<ChevronRight size={11} />} onClick={(e: React.MouseEvent) => { e.stopPropagation(); setTagDrawerGroup(g); setTagDrawerSort({ col: "sent", dir: "desc" }); }}>
                                    View all {g.campaigns.length}
                                  </Button>
                                </div>
                                {topCamps.map((c, i) => {
                                  const cOpenRate = c.delivered > 0 ? ((c.opened / c.delivered) * 100) : 0;
                                  const cReplyRate = c.delivered > 0 ? ((c.replied / c.delivered) * 100) : 0;
                                  return (
                                    <div key={c.name} className="grid gap-3 px-5 py-2.5 border-t items-center hover:bg-white transition-colors" style={{ gridTemplateColumns: "auto 2fr 0.6fr 0.8fr 0.8fr", borderColor: TV.borderDivider }}>
                                      <span className="text-[11px] font-semibold w-5 text-center" style={{ color: TV.textDecorative }}>{i + 1}</span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); navigateToCampaign(c.name); }}
                                        className="text-[12px] font-semibold truncate text-left transition-colors hover:underline"
                                        style={{ color: TV.textBrand }}
                                        title={`View "${c.name}" in Performance`}
                                      >
                                        {c.name}
                                      </button>
                                      <Text fz={11} c={TV.textSecondary}>{c.sent.toLocaleString()} sent</Text>
                                      <MiniBar pct={cOpenRate} color={TV.textBrand} />
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-semibold" style={{ color: cReplyRate > 5 ? TV.success : TV.textSecondary }}>{cReplyRate.toFixed(1)}% reply</span>
                                        {c.trend === "up" && <TrendingUp size={11} style={{ color: TV.success }} />}
                                        {c.trend === "down" && <TrendingDown size={11} style={{ color: TV.danger }} />}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden" style={{ borderColor: TV.borderDivider }}>
              {displayTagGroups.map(g => {
                const isExpanded = expandedTag === g.tag;
                const tc = TAG_COLORS[g.tag];
                return (
                  <div key={g.tag} className={`border-b ${isExpanded ? "bg-tv-surface-muted" : ""}`} style={{ borderColor: TV.borderDivider }}>
                    <div role="button" tabIndex={0} onClick={() => setExpandedTag(isExpanded ? null : g.tag)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedTag(isExpanded ? null : g.tag); } }} className="w-full text-left px-4 py-4 hover:bg-tv-surface-muted transition-colors cursor-pointer">
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: tc.bg }}>
                            <BarChart3 size={12} style={{ color: tc.color }} />
                          </div>
                          <p className="text-[13px] font-semibold truncate" style={{ color: TV.textPrimary }}>{g.tag}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {!isExpanded && <Text fz={10} c={TV.textDecorative}>Details</Text>}
                          {isExpanded ? <ChevronDown size={14} style={{ color: TV.textBrand }} /> : <ChevronRight size={14} style={{ color: TV.textBrand }} />}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                        <div><p className="text-[10px] uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>Campaigns</p><p className="text-[13px] font-semibold" style={{ color: TV.textPrimary }}>{g.campaigns.length}</p></div>
                        <div><p className="text-[10px] uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>Total Sent</p><p className="text-[13px] font-semibold" style={{ color: TV.textPrimary }}>{g.totalSent.toLocaleString()}</p></div>
                        <div><p className="text-[10px] uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>Open %</p><p className="text-[13px] font-semibold" style={{ color: TV.textPrimary }}>{g.avgOpenRate.toFixed(1)}%</p></div>
                        <div><p className="text-[10px] uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>Click %</p><p className="text-[13px] font-semibold" style={{ color: TV.textPrimary }}>{g.avgClickRate.toFixed(1)}%</p></div>
                        <div><p className="text-[10px] uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>Reply %</p><p className="text-[13px] font-semibold" style={{ color: TV.success }}>{g.avgReplyRate.toFixed(1)}%</p></div>
                        <div><p className="text-[10px] uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>Avg Video</p><p className="text-[13px] font-semibold" style={{ color: TV.textPrimary }}>{g.avgVideoPct.toFixed(1)}%</p></div>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t pt-3 space-y-3" style={{ borderColor: TV.borderDivider }}>
                        {/* Comparison metrics */}
                        <div className="space-y-2">
                          {([
                            { label: "Open Rate", val: g.avgOpenRate, avg: OVERALL_AVG.openRate, color: TV.textBrand },
                            { label: "Click Rate", val: g.avgClickRate, avg: OVERALL_AVG.clickRate, color: TV.info },
                            { label: "Reply Rate", val: g.avgReplyRate, avg: OVERALL_AVG.replyRate, color: TV.success },
                          ] as const).map(m => {
                            const diff = m.val - m.avg;
                            return (
                              <div key={m.label} className="flex items-center justify-between">
                                <span className="text-[11px]" style={{ color: TV.textSecondary }}>{m.label}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-[12px] font-semibold" style={{ color: TV.textPrimary }}>{m.val.toFixed(1)}%</span>
                                  <span className="text-[10px]" style={{ color: diff > 0 ? TV.success : diff < -2 ? TV.danger : TV.textSecondary }}>
                                    {diff > 0 ? "+" : ""}{diff.toFixed(1)} vs avg
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <Button variant="subtle" color="tvPurple" size="compact-xs" rightSection={<ChevronRight size={11} />} onClick={() => { setTagDrawerGroup(g); setTagDrawerSort({ col: "sent", dir: "desc" }); }}>
                          View all {g.campaigns.length} campaigns
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Show more tags footer */}
            {(hasMoreTags || tagsVisibleCount > 10) && (
              <div className="flex items-center justify-center gap-2 px-4 py-2.5 border-t rounded-b-[16px]" style={{ borderColor: TV.borderDivider, backgroundColor: TV.surface }}>
                {hasMoreTags && (
                  <Button size="xs" variant="light" color="tvPurple" radius="xl" onClick={() => setTagsVisibleCount(prev => prev + 10)}>
                    Show {Math.min(remainingTags, 10)} more tag{Math.min(remainingTags, 10) !== 1 ? "s" : ""}{remainingTags > 10 ? ` (${remainingTags} remaining)` : ""}
                  </Button>
                )}
                {tagsVisibleCount > 10 && (
                  <Button size="xs" variant="subtle" color="gray" radius="xl" onClick={() => setTagsVisibleCount(10)}>
                    Collapse
                  </Button>
                )}
              </div>
            )}
          </DashCard>
          );
          })()}

          {/* Tag Drawer — full sortable campaign list */}
          <Drawer opened={!!tagDrawerGroup} onClose={() => { setTagDrawerGroup(null); setTagDrawerSearch(""); }} position="right" size="lg" title={tagDrawerGroup ? `${tagDrawerGroup.tag} — All Campaigns` : ""} styles={DRAWER_STYLES}>
            {tagDrawerGroup && (() => {
              const g = tagDrawerGroup;
              const toggleDrawerTagSort = (col: string) => {
                setTagDrawerSort(prev => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" });
              };
              const searched = tagDrawerSearch
                ? g.campaigns.filter(c => c.name.toLowerCase().includes(tagDrawerSearch.toLowerCase()))
                : g.campaigns;
              const sorted = [...searched].sort((a, b) => {
                const col = tagDrawerSort.col;
                let av: number, bv: number;
                if (col === "name") return tagDrawerSort.dir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                if (col === "openRate") { av = a.delivered > 0 ? a.opened / a.delivered : 0; bv = b.delivered > 0 ? b.opened / b.delivered : 0; }
                else if (col === "clickRate") { av = a.delivered > 0 ? a.clicked / a.delivered : 0; bv = b.delivered > 0 ? b.clicked / b.delivered : 0; }
                else if (col === "replyRate") { av = a.delivered > 0 ? a.replied / a.delivered : 0; bv = b.delivered > 0 ? b.replied / b.delivered : 0; }
                else { av = (a as any)[col] ?? 0; bv = (b as any)[col] ?? 0; }
                return tagDrawerSort.dir === "asc" ? av - bv : bv - av;
              });
              const DrawerSortIcon = ({ col }: { col: string }) => {
                const active = tagDrawerSort.col === col;
                if (!active) return <ArrowUpDown size={10} style={{ color: TV.borderStrong }} />;
                return tagDrawerSort.dir === "asc" ? <ArrowUp size={11} style={{ color: TV.textBrand }} /> : <ArrowDown size={11} style={{ color: TV.textBrand }} />;
              };
              const tc = TAG_COLORS[g.tag];
              return (
                <div>
                  {/* Summary */}
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: TV.borderDivider }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: tc.bg }}>
                      <BarChart3 size={18} style={{ color: tc.color }} />
                    </div>
                    <div className="flex-1">
                      <Text fz={15} fw={700} c={TV.textPrimary}>{g.tag}</Text>
                      <Text fz={11} c={TV.textSecondary}>{g.campaigns.length} campaigns · {g.totalSent.toLocaleString()} total sent</Text>
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-4 gap-3 mb-4 pb-3 border-b" style={{ borderColor: TV.borderDivider }}>
                    <div><Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Open %</Text><Text fz={14} fw={700} c={g.avgOpenRate > 60 ? TV.success : TV.textPrimary}>{g.avgOpenRate.toFixed(1)}%</Text></div>
                    <div><Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Click %</Text><Text fz={14} fw={700} c={TV.textPrimary}>{g.avgClickRate.toFixed(1)}%</Text></div>
                    <div><Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Reply %</Text><Text fz={14} fw={700} c={TV.textPrimary}>{g.avgReplyRate.toFixed(1)}%</Text></div>
                    <div><Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Video %</Text><Text fz={14} fw={700} c={TV.textPrimary}>{g.avgVideoPct.toFixed(1)}%</Text></div>
                  </div>

                  {/* Search */}
                  <TextInput
                    placeholder="Search campaigns…"
                    value={tagDrawerSearch}
                    onChange={e => setTagDrawerSearch(e.currentTarget.value)}
                    size="xs" radius="xl" mb="sm"
                    leftSection={<Search size={12} />}
                    rightSection={tagDrawerSearch ? <X size={11} style={{ cursor: "pointer" }} onClick={() => setTagDrawerSearch("")} /> : null}
                    styles={{ input: { fontSize: 12, borderColor: TV.borderLight } }}
                  />
                  {tagDrawerSearch && (
                    <Text fz={10} c={TV.textSecondary} mb={6}>
                      Showing {sorted.length} of {g.campaigns.length} campaigns
                    </Text>
                  )}

                  {/* Column headers */}
                  <div className="grid grid-cols-[2fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-2 px-1 pb-2 border-b mb-1" style={{ borderColor: TV.borderDivider }}>
                    {[
                      { col: "name", label: "Campaign" },
                      { col: "sent", label: "Sent" },
                      { col: "openRate", label: "Open %" },
                      { col: "clickRate", label: "Click %" },
                      { col: "replyRate", label: "Reply %" },
                    ].map(h => (
                      <button key={h.col} onClick={() => toggleDrawerTagSort(h.col)} className="flex items-center gap-0.5 text-left">
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: tagDrawerSort.col === h.col ? TV.textBrand : TV.textSecondary }}>{h.label}</span>
                        <DrawerSortIcon col={h.col} />
                      </button>
                    ))}
                  </div>

                  {/* Campaign rows */}
                  <div className="max-h-[60vh] overflow-y-auto">
                    {sorted.map(c => {
                      const cOpenRate = c.delivered > 0 ? (c.opened / c.delivered) * 100 : 0;
                      const cClickRate = c.delivered > 0 ? (c.clicked / c.delivered) * 100 : 0;
                      const cReplyRate = c.delivered > 0 ? (c.replied / c.delivered) * 100 : 0;
                      return (
                        <div key={c.name} className="grid grid-cols-[2fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-2 px-1 py-2 border-b items-center hover:bg-tv-surface-muted transition-colors" style={{ borderColor: TV.borderDivider }}>
                          <button onClick={() => { setTagDrawerGroup(null); setTagDrawerSearch(""); navigateToCampaign(c.name); }} className="text-[12px] font-semibold truncate text-left hover:underline" style={{ color: TV.textBrand }}>{c.name}</button>
                          <Text fz={12} fw={600} c={TV.textPrimary}>{c.sent.toLocaleString()}</Text>
                          <Text fz={12} fw={600} c={cOpenRate > 70 ? TV.success : TV.textPrimary}>{cOpenRate.toFixed(1)}%</Text>
                          <Text fz={12} fw={600} c={cClickRate > 30 ? TV.success : TV.textPrimary}>{cClickRate.toFixed(1)}%</Text>
                          <Text fz={12} fw={600} c={cReplyRate > 5 ? TV.success : TV.textSecondary}>{cReplyRate.toFixed(1)}%</Text>
                        </div>
                      );
                    })}
                    {sorted.length === 0 && (
                      <div className="flex items-center justify-center py-6">
                        <Text fz={12} c={TV.textSecondary}>No campaigns match "{tagDrawerSearch}"</Text>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </Drawer>
        </>
      )}

      {/* ─── TAB: Performance ──────────────────────────────────────────────── */}
      {mainTab === "performance" && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <Title order={3} fz={16}>Detailed Message Metrics</Title>
              <Text fz={12} c={TV.textSecondary}>Hover any row to create a list or view contacts in that segment</Text>
            </div>
            <TextInput placeholder="Search categories…" value={funnelSearch} onChange={e => setFunnelSearch(e.currentTarget.value)} leftSection={<Search size={13} />} radius="xl" styles={{ input: { borderColor: TV.borderLight, minWidth: 200 } }} />
          </div>

          {funnelSearch ? (
            /* Flat filtered list when searching */
            <DashCard className="overflow-hidden mb-4">
              {filteredFunnel.map(cat => (
                <FunnelRow key={cat.key} cat={cat} max={fSends} onCreateList={handleCreateList} onViewContacts={handleViewContacts} />
              ))}
              {filteredFunnel.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <Text fz={13} c={TV.textSecondary}>No categories match "{funnelSearch}"</Text>
                </div>
              )}
            </DashCard>
          ) : (
            /* Grouped funnel sections */
            <div className="space-y-3 mb-4">
              {funnelGroups.map(group => {
                const cats = filteredFunnelCats.filter(c => group.keys.includes(c.key));
                return (
                  <DashCard key={group.title} className="overflow-hidden">
                    <div className="px-5 py-2.5 bg-tv-surface-muted border-b" style={{ borderColor: TV.borderDivider }}>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ color: TV.textSecondary }}>{group.title}</span>
                    </div>
                    {cats.map(cat => (
                      <FunnelRow key={cat.key} cat={cat} max={fSends} onCreateList={handleCreateList} onViewContacts={handleViewContacts} expanded={expandedFunnel === cat.key} onToggle={() => setExpandedFunnel(expandedFunnel === cat.key ? null : cat.key)} />
                    ))}
                  </DashCard>
                );
              })}
            </div>
          )}

          <div className="rounded-[14px] border p-3" style={{ borderColor: TV.borderLight, backgroundColor: TV.surfaceMuted }}>
            <div className="flex items-center gap-2 flex-nowrap">
              <CircleAlert size={14} style={{ color: TV.textBrand }} className="shrink-0" />
              <Text fz={11} c={TV.textSecondary}>
                Click any row to expand it. Use <strong>"Create list"</strong> to save that segment, or <strong>"View contacts"</strong> to see each contact and how many times they appeared in the selected period.
              </Text>
            </div>
          </div>

          {/* ODDER, PDF, and 1:1 Video metrics moved to dedicated tabs */}
        </>
      )}

      {/* ─── TAB: PDF ──────────────────────────────────────────────────────── */}
      {mainTab === "pdf" && (() => {
        const filteredPdfCampaigns = pdfCampaignFilter.length > 0
          ? PDF_CAMPAIGNS.filter(c => pdfCampaignFilter.includes(c.name))
          : PDF_CAMPAIGNS;
        const pdfTotalSent = filteredPdfCampaigns.reduce((s, c) => s + c.sends, 0);
        const pdfTotalDelivered = filteredPdfCampaigns.reduce((s, c) => s + c.delivered, 0);
        const pdfTotalUniqueViews = filteredPdfCampaigns.reduce((s, c) => s + c.uniqueViews, 0);
        const pdfTotalViews = filteredPdfCampaigns.reduce((s, c) => s + c.totalViews, 0);
        const pdfTotalDownloads = filteredPdfCampaigns.reduce((s, c) => s + c.downloads, 0);
        const pdfTotalPrints = filteredPdfCampaigns.reduce((s, c) => s + c.prints, 0);
        const pdfTotalShares = filteredPdfCampaigns.reduce((s, c) => s + c.shares, 0);
        const pdfTotalRequestPrint = filteredPdfCampaigns.reduce((s, c) => s + c.requestPrint, 0);
        const pdfAvgUnsub = pdfTotalSent > 0 ? filteredPdfCampaigns.reduce((s, c) => s + parseFloat(c.unsubRate) * c.sends, 0) / pdfTotalSent : 0;
        const pdfAvgSpam = pdfTotalSent > 0 ? filteredPdfCampaigns.reduce((s, c) => s + parseFloat(c.spamRate) * c.sends, 0) / pdfTotalSent : 0;
        const pdfAvgBounce = pdfTotalSent > 0 ? filteredPdfCampaigns.reduce((s, c) => s + parseFloat(c.bounceRate) * c.sends, 0) / pdfTotalSent : 0;
        const pdfAvgCompletion = filteredPdfCampaigns.length > 0 ? (filteredPdfCampaigns.reduce((s, c) => s + parseFloat(c.avgCompletion), 0) / filteredPdfCampaigns.length).toFixed(1) : "0.0";
        return (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <Title order={3} fz={16}>PDF Metrics</Title>
              <Text fz={12} c={TV.textSecondary}>View, download, print, and share metrics for campaigns with PDF attachments</Text>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <ChipFilter label="Campaign" icon={Send} options={PDF_CAMPAIGNS.map(c => ({ value: c.name, label: c.name }))} values={pdfCampaignFilter} onChange={setPdfCampaignFilter} searchable />
            {pdfCampaignFilter.length > 0 && (
              <UnstyledButton onClick={() => setPdfCampaignFilter([])} className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-tv-surface-muted transition-colors">
                <X size={11} style={{ color: TV.textSecondary }} /><Text fz={10} c={TV.textSecondary}>Clear</Text>
              </UnstyledButton>
            )}
          </div>
          <div className="flex items-center gap-2.5 px-4 py-3 mb-4 rounded-lg" style={{ backgroundColor: TV.brandTint, border: `1px solid ${TV.borderLight}` }}>
            <Info size={14} style={{ color: TV.textBrand, flexShrink: 0 }} />
            <Text fz={12} c={TV.textSecondary}>This view shows <span className="font-semibold" style={{ color: TV.textBrand }}>all campaigns containing PDF attachments</span>. Global filters above (date range, creator, etc.) further refine these results.</Text>
          </div>
          <DashCard className="overflow-hidden mb-4">
            <div className="flex items-center justify-between px-5 py-3 bg-tv-surface-muted border-b" style={{ borderColor: TV.borderDivider }}>
              <div className="flex items-center gap-2.5">
                <div className="w-[36px] h-[36px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: TV.infoBg, color: TV.info }}><FileText size={18} /></div>
                <div>
                  <Text fz={14} fw={700} c={TV.textPrimary}>PDF Campaign Metrics</Text>
                  <Text fz={11} c={TV.textSecondary}>{filteredPdfCampaigns.length} campaign{filteredPdfCampaigns.length !== 1 ? "s" : ""}{pdfCampaignFilter.length > 0 ? " (filtered)" : ""}</Text>
                </div>
              </div>
              <Badge size="sm" radius="xl" color="blue" variant="light">{filteredPdfCampaigns.length} campaign{filteredPdfCampaigns.length !== 1 ? "s" : ""}</Badge>
            </div>
            <div className="px-5 py-4 border-b" style={{ borderColor: TV.borderDivider }}>
              <div className="flex flex-wrap gap-x-6 gap-y-4 sm:gap-x-8 lg:gap-x-10">
                <Kpi label="Total Sent" value={pdfTotalSent.toLocaleString()} />
                <div className="h-10 w-px hidden sm:block self-center" style={{ backgroundColor: TV.borderDivider }} />
                <Kpi label="Delivered" value={pdfTotalDelivered.toLocaleString()} sub={`${pdfTotalSent > 0 ? ((pdfTotalDelivered / pdfTotalSent) * 100).toFixed(1) : "0.0"}%`} />
                <Kpi label="Unsub Rate" value={`${pdfAvgUnsub.toFixed(2)}%`} />
                <Kpi label="Spam Rate" value={`${pdfAvgSpam.toFixed(2)}%`} />
                <Kpi label="Bounce Rate" value={`${pdfAvgBounce.toFixed(1)}%`} warn={pdfAvgBounce > 2} />
                <div className="h-10 w-px hidden sm:block self-center" style={{ backgroundColor: TV.borderDivider }} />
                <Kpi label="Unique Views" value={pdfTotalUniqueViews.toLocaleString()} />
                <Kpi label="Total Views" value={pdfTotalViews.toLocaleString()} />
                <Kpi label="Downloads" value={pdfTotalDownloads.toLocaleString()} />
                <Kpi label="Prints" value={pdfTotalPrints.toLocaleString()} />
                <Kpi label="Shares" value={pdfTotalShares.toLocaleString()} />
                <Kpi label="Request Print" value={pdfTotalRequestPrint.toLocaleString()} />
                <Kpi label="Avg Completion" value={`${pdfAvgCompletion}%`} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[1200px]">
                <div className="grid grid-cols-[2.5fr_repeat(12,1fr)] gap-2 px-5 py-2.5 bg-tv-surface-muted border-b text-[11px] font-semibold uppercase tracking-[0.04em] [&>span]:whitespace-nowrap" style={{ borderColor: TV.borderDivider, color: TV.textSecondary }}>
                  <span>Campaign</span><span>Sent</span><span>Delivered</span><span>Unsub Rate</span><span>Spam Rate</span><span>Bounce Rate</span><span>Unique Views</span><span>Total Views</span><span>Downloads</span><span>Prints</span><span>Shares</span><span>Request Print</span><span>Avg Completion</span>
                </div>
                {filteredPdfCampaigns.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <FileText size={28} style={{ color: TV.textDecorative }} />
                    <Text fz={13} c={TV.textSecondary}>No PDF campaigns match the selected filter</Text>
                    <UnstyledButton onClick={() => setPdfCampaignFilter([])}><Text fz={12} c={TV.textBrand} className="hover:underline">Clear filter</Text></UnstyledButton>
                  </div>
                )}
                {filteredPdfCampaigns.map(c => (
                  <div key={c.id} className="grid grid-cols-[2.5fr_repeat(12,1fr)] gap-2 px-5 py-3 border-b last:border-b-0 items-center" style={{ borderColor: TV.borderDivider }}>
                    <Text fz={12} fw={600} c={TV.textPrimary} className="truncate">{c.name}</Text>
                    <Text fz={12} c={TV.textPrimary}>{c.sends}</Text><Text fz={12} c={TV.textPrimary}>{c.delivered}</Text>
                    <Text fz={12} c={TV.textPrimary}>{c.unsubRate}</Text><Text fz={12} c={TV.textPrimary}>{c.spamRate}</Text><Text fz={12} c={TV.textPrimary}>{c.bounceRate}</Text>
                    <Text fz={12} c={TV.textPrimary}>{c.uniqueViews}</Text><Text fz={12} c={TV.textPrimary}>{c.totalViews}</Text><Text fz={12} c={TV.textPrimary}>{c.downloads}</Text>
                    <Text fz={12} c={TV.textPrimary}>{c.prints}</Text><Text fz={12} c={TV.textPrimary}>{c.shares}</Text><Text fz={12} c={TV.textPrimary}>{c.requestPrint}</Text>
                    <Text fz={12} fw={700} c={TV.textPrimary}>{c.avgCompletion}</Text>
                  </div>
                ))}
              </div>
            </div>
          </DashCard>
        </>
        );
      })()}

      {/* ─── TAB: Endowment ────────────────────────────────────────────────── */}
      {mainTab === "endowment" && (() => {
        const filteredOdderCampaigns = odderCampaignFilter.length > 0
          ? ODDER_CAMPAIGNS.filter(c => odderCampaignFilter.includes(c.name))
          : ODDER_CAMPAIGNS;
        const allOdderPdfs = filteredOdderCampaigns.flatMap(c => c.pdfDocuments);
        const odderAgg = {
          sends: allOdderPdfs.reduce((s, p) => s + p.sends, 0),
          delivered: allOdderPdfs.reduce((s, p) => s + p.delivered, 0),
          opened: allOdderPdfs.reduce((s, p) => s + p.opened, 0),
          uniqueViews: allOdderPdfs.reduce((s, p) => s + p.uniqueViews, 0),
          totalViews: allOdderPdfs.reduce((s, p) => s + p.totalViews, 0),
          downloads: allOdderPdfs.reduce((s, p) => s + p.downloads, 0),
          prints: allOdderPdfs.reduce((s, p) => s + p.prints, 0),
          shares: allOdderPdfs.reduce((s, p) => s + p.shares, 0),
          requestPrint: allOdderPdfs.reduce((s, p) => s + p.requestPrint, 0),
          completedReaders: allOdderPdfs.reduce((s, p) => s + p.completedReaders, 0),
          actionTakers: allOdderPdfs.reduce((s, p) => s + p.actionTakers, 0),
          avgCompletion: allOdderPdfs.length > 0
            ? (allOdderPdfs.reduce((s, p) => s + parseFloat(p.avgCompletion), 0) / allOdderPdfs.length).toFixed(1)
            : "0.0",
          totalPdfs: allOdderPdfs.length,
        };
        const odderUnsubRate = odderAgg.sends > 0
          ? (allOdderPdfs.reduce((s, p) => s + parseFloat(p.unsubRate) * p.sends, 0) / odderAgg.sends).toFixed(2)
          : "0.00";
        const odderSpamRate = odderAgg.sends > 0
          ? (allOdderPdfs.reduce((s, p) => s + parseFloat(p.spamRate) * p.sends, 0) / odderAgg.sends).toFixed(2)
          : "0.00";
        const odderBounceRate = odderAgg.sends > 0
          ? (allOdderPdfs.reduce((s, p) => s + parseFloat(p.bounceRate) * p.sends, 0) / odderAgg.sends).toFixed(2)
          : "0.00";
        return (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <Title order={3} fz={16}>Endowment (ODDER) Reporting</Title>
              <Text fz={12} c={TV.textSecondary}>Metrics for endowment report PDFs sent through ODDER cadences</Text>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <ChipFilter label="Campaign" icon={Send} options={ODDER_CAMPAIGNS.map(c => ({ value: c.name, label: c.name }))} values={odderCampaignFilter} onChange={setOdderCampaignFilter} searchable />
            {odderCampaignFilter.length > 0 && (
              <UnstyledButton onClick={() => setOdderCampaignFilter([])} className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-tv-surface-muted transition-colors">
                <X size={11} style={{ color: TV.textSecondary }} /><Text fz={10} c={TV.textSecondary}>Clear</Text>
              </UnstyledButton>
            )}
          </div>
          <DashCard className="overflow-hidden mb-4">
            <div className="flex items-center justify-between px-5 py-3 bg-tv-surface-muted border-b" style={{ borderColor: TV.borderDivider }}>
              <div className="flex items-center gap-2.5">
                <div className="w-[36px] h-[36px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: TV.infoBg, color: TV.info }}>
                  <Layers size={18} />
                </div>
                <div>
                  <Text fz={14} fw={700} c={TV.textPrimary}>Endowment (ODDER) Reports</Text>
                  <Text fz={11} c={TV.textSecondary}>{filteredOdderCampaigns.length} endowment campaign{filteredOdderCampaigns.length !== 1 ? "s" : ""} with {odderAgg.totalPdfs} total PDFs — click a row to expand per-PDF breakdown</Text>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge size="sm" radius="xl" color="teal" variant="light">{odderAgg.totalPdfs} PDFs</Badge>
                <Badge size="sm" radius="xl" color="gray" variant="light">{filteredOdderCampaigns.length} campaigns</Badge>
                <Tooltip label="Export ODDER metrics as CSV" withArrow>
                  <ActionIcon variant="light" color="teal" radius="xl" size="sm" onClick={() => { exportOdderCsv(); show("ODDER metrics exported", "success"); }} aria-label="Export ODDER metrics">
                    <Download size={13} />
                  </ActionIcon>
                </Tooltip>
              </div>
            </div>
            {/* Aggregate KPI strip — message-level delivery + PDF-level engagement */}
            <div className="px-5 py-4 border-b" style={{ borderColor: TV.borderDivider }}>
              <div className="flex flex-wrap gap-x-6 gap-y-4 sm:gap-x-8 lg:gap-x-10">
                {/* Message delivery */}
                <Kpi label="Total Sent" value={odderAgg.sends.toLocaleString()} />
                <div className="h-10 w-px hidden sm:block self-center" style={{ backgroundColor: TV.borderDivider }} />
                <Kpi label="Delivered" value={odderAgg.delivered.toLocaleString()} sub={`${odderAgg.sends > 0 ? ((odderAgg.delivered / odderAgg.sends) * 100).toFixed(1) : "0.0"}%`} />
                <Kpi label="Opened" value={odderAgg.opened.toLocaleString()} sub={`${odderAgg.delivered > 0 ? ((odderAgg.opened / odderAgg.delivered) * 100).toFixed(1) : "0.0"}%`} />
                <Kpi label="Unsub Rate" value={`${odderUnsubRate}%`} />
                <Kpi label="Spam Rate" value={`${odderSpamRate}%`} />
                <Kpi label="Bounce Rate" value={`${odderBounceRate}%`} warn={parseFloat(odderBounceRate) > 2} />
                <div className="h-10 w-px hidden sm:block self-center" style={{ backgroundColor: TV.borderDivider }} />
                {/* PDF engagement */}
                <Kpi label="Unique Views" value={odderAgg.uniqueViews.toLocaleString()} sub={`across ${odderAgg.totalPdfs} PDFs`} />
                <Kpi label="Completed" value={odderAgg.completedReaders.toLocaleString()} sub={`${odderAgg.uniqueViews > 0 ? ((odderAgg.completedReaders / odderAgg.uniqueViews) * 100).toFixed(1) : "0.0"}%`} good />
                <Kpi label="Action Takers" value={odderAgg.actionTakers.toLocaleString()} sub={`${odderAgg.uniqueViews > 0 ? ((odderAgg.actionTakers / odderAgg.uniqueViews) * 100).toFixed(1) : "0.0"}%`} />
                <Kpi label="Downloads" value={odderAgg.downloads.toLocaleString()} />
                <Kpi label="Prints" value={odderAgg.prints.toLocaleString()} />
                <Kpi label="Shares" value={odderAgg.shares.toLocaleString()} />
                <Kpi label="Request Print" value={odderAgg.requestPrint.toLocaleString()} />
                <Kpi label="Avg Completion" value={`${odderAgg.avgCompletion}%`} />
              </div>
            </div>

            {/* Table: message-level rows expandable to per-PDF sub-rows */}
            <div className="overflow-x-auto">
              <div className="min-w-[1340px]">
                {/* Header — two tiers: delivery columns then PDF columns */}
                <div className="grid grid-cols-[2.5fr_repeat(5,minmax(0,1fr))_1px_repeat(7,minmax(0,1fr))] gap-2 px-5 py-2.5 bg-tv-surface-muted border-b text-[11px] font-semibold uppercase tracking-[0.04em] [&>span]:whitespace-nowrap items-center" style={{ borderColor: TV.borderDivider, color: TV.textSecondary }}>
                  <span>Campaign / PDF</span>
                  <span>Sent</span><span>Delivered</span><span>Unsub Rate</span><span>Spam Rate</span><span>Bounce Rate</span>
                  <div className="h-full w-px" style={{ backgroundColor: TV.borderDivider }} />
                  <span>Unique Views</span><span>Total Views</span><span>Downloads</span><span>Prints</span><span>Shares</span><span>Request Print</span><span>Avg Completion</span>
                </div>

                {filteredOdderCampaigns.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Layers size={28} style={{ color: TV.textDecorative }} />
                    <Text fz={13} c={TV.textSecondary}>No endowment campaigns match the selected filter</Text>
                    <UnstyledButton onClick={() => setOdderCampaignFilter([])}><Text fz={12} c={TV.textBrand} className="hover:underline">Clear filter</Text></UnstyledButton>
                  </div>
                )}
                {filteredOdderCampaigns.map(c => {
                  const isExpanded = expandedOdderIds.has(c.id);
                  const aggSends = c.pdfDocuments.reduce((s, p) => s + p.sends, 0);
                  const aggDelivered = c.pdfDocuments.reduce((s, p) => s + p.delivered, 0);
                  const aggUnsubRate = aggSends > 0 ? (c.pdfDocuments.reduce((s, p) => s + parseFloat(p.unsubRate) * p.sends, 0) / aggSends).toFixed(2) : "0.00";
                  const aggSpamRate = aggSends > 0 ? (c.pdfDocuments.reduce((s, p) => s + parseFloat(p.spamRate) * p.sends, 0) / aggSends).toFixed(2) : "0.00";
                  const aggBounceRate = aggSends > 0 ? (c.pdfDocuments.reduce((s, p) => s + parseFloat(p.bounceRate) * p.sends, 0) / aggSends).toFixed(2) : "0.00";
                  const pdfAgg = {
                    uniqueViews: c.pdfDocuments.reduce((s, p) => s + p.uniqueViews, 0),
                    totalViews: c.pdfDocuments.reduce((s, p) => s + p.totalViews, 0),
                    downloads: c.pdfDocuments.reduce((s, p) => s + p.downloads, 0),
                    prints: c.pdfDocuments.reduce((s, p) => s + p.prints, 0),
                    shares: c.pdfDocuments.reduce((s, p) => s + p.shares, 0),
                    requestPrint: c.pdfDocuments.reduce((s, p) => s + p.requestPrint, 0),
                    avgCompletion: c.pdfDocuments.length > 0
                      ? (c.pdfDocuments.reduce((s, p) => s + parseFloat(p.avgCompletion), 0) / c.pdfDocuments.length).toFixed(1)
                      : "—",
                  };

                  return (
                    <div key={c.id}>
                      {/* Campaign row — message-level delivery + aggregated PDF metrics */}
                      <button
                        onClick={() => toggleOdderExpand(c.id)}
                        className="w-full grid grid-cols-[2.5fr_repeat(5,minmax(0,1fr))_1px_repeat(7,minmax(0,1fr))] gap-2 px-5 py-3 border-b items-center text-left transition-colors hover:bg-tv-surface-muted cursor-pointer"
                        style={{ borderColor: TV.borderDivider }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <ChevronRight size={14} className="shrink-0 transition-transform" style={{ color: TV.textSecondary, transform: isExpanded ? "rotate(90deg)" : "none" }} />
                          <div className="truncate">
                            <Text fz={12} fw={600} c={TV.textPrimary} className="truncate">{c.name}</Text>
                            <Text fz={10} c={TV.textSecondary}>{c.pdfDocuments.length} PDF{c.pdfDocuments.length !== 1 ? "s" : ""} attached</Text>
                          </div>
                        </div>
                        {/* Delivery stats (aggregated across all PDFs in the campaign) */}
                        <Text fz={12} c={TV.textPrimary}>{aggSends.toLocaleString()}</Text>
                        <Text fz={12} c={TV.textPrimary}>{aggDelivered.toLocaleString()}</Text>
                        <Text fz={12} c={TV.textPrimary}>{aggUnsubRate}%</Text>
                        <Text fz={12} c={TV.textPrimary}>{aggSpamRate}%</Text>
                        <Text fz={12} c={parseFloat(aggBounceRate) > 2 ? TV.warning : TV.textPrimary}>{aggBounceRate}%</Text>
                        <div className="h-full w-px" style={{ backgroundColor: TV.borderDivider }} />
                        {/* Aggregated PDF engagement stats */}
                        <Text fz={12} c={TV.textPrimary}>{pdfAgg.uniqueViews.toLocaleString()}</Text>
                        <Text fz={12} c={TV.textPrimary}>{pdfAgg.totalViews.toLocaleString()}</Text>
                        <Text fz={12} c={TV.textPrimary}>{pdfAgg.downloads.toLocaleString()}</Text>
                        <Text fz={12} c={TV.textPrimary}>{pdfAgg.prints.toLocaleString()}</Text>
                        <Text fz={12} c={TV.textPrimary}>{pdfAgg.shares.toLocaleString()}</Text>
                        <Text fz={12} c={TV.textPrimary}>{pdfAgg.requestPrint.toLocaleString()}</Text>
                        <Text fz={12} fw={600} c={TV.textPrimary}>{pdfAgg.avgCompletion}%</Text>
                      </button>

                      {/* Per-PDF sub-rows (expanded) — each row shows ALL 12 data points + mini engagement bar */}
                      {isExpanded && c.pdfDocuments.map((pdf, pi) => {
                        // Engagement segments for the mini bar chart
                        const engSegments = [
                          { label: "Views", value: pdf.uniqueViews, color: TV.info },
                          { label: "Downloads", value: pdf.downloads, color: "#3b82f6" },
                          { label: "Prints", value: pdf.prints, color: TV.brand },
                          { label: "Shares", value: pdf.shares, color: "#b45309" },
                          { label: "Req. Print", value: pdf.requestPrint, color: "#dc2626" },
                        ];
                        const engTotal = engSegments.reduce((s, seg) => s + seg.value, 0);
                        return (
                        <div
                          key={pdf.id}
                          className={`grid grid-cols-[2.5fr_repeat(5,minmax(0,1fr))_1px_repeat(7,minmax(0,1fr))] gap-2 px-5 py-2.5 items-center ${pi === c.pdfDocuments.length - 1 ? "border-b" : ""}`}
                          style={{ backgroundColor: TV.surfaceMuted, borderColor: TV.borderDivider }}
                        >
                          <div className="pl-6 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <FileText size={13} style={{ color: TV.info, flexShrink: 0 }} />
                              <Text fz={11} fw={500} c={TV.textPrimary} className="truncate">{pdf.label}</Text>
                              <Badge size="xs" radius="xl" variant="light" color="gray">PDF {pi + 1}</Badge>
                            </div>
                            {/* Mini engagement bar chart */}
                            <div className="pl-5">
                              <Tooltip withArrow label={engSegments.map(s => `${s.label}: ${s.value.toLocaleString()}`).join("  ·  ")}>
                                <div className="flex h-[5px] rounded-full overflow-hidden" style={{ backgroundColor: TV.borderLight }}>
                                  {engSegments.map(seg => (
                                    <div
                                      key={seg.label}
                                      style={{
                                        width: engTotal > 0 ? `${(seg.value / engTotal) * 100}%` : "0%",
                                        backgroundColor: seg.color,
                                        minWidth: seg.value > 0 ? 3 : 0,
                                      }}
                                    />
                                  ))}
                                </div>
                              </Tooltip>
                              <div className="flex gap-2.5 mt-1">
                                {engSegments.map(seg => (
                                  <div key={seg.label} className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                                    <Text fz={8} c={TV.textSecondary} className="whitespace-nowrap">{seg.label}</Text>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          {/* Delivery metrics per PDF */}
                          <Text fz={11} c={TV.textPrimary}>{pdf.sends.toLocaleString()}</Text>
                          <Text fz={11} c={TV.textPrimary}>{pdf.delivered.toLocaleString()}</Text>
                          <Text fz={11} c={TV.textPrimary}>{pdf.unsubRate}</Text>
                          <Text fz={11} c={TV.textPrimary}>{pdf.spamRate}</Text>
                          <Text fz={11} c={parseFloat(pdf.bounceRate) > 2 ? TV.warning : TV.textPrimary}>{pdf.bounceRate}</Text>
                          <div className="h-full w-px" style={{ backgroundColor: TV.borderDivider }} />
                          {/* PDF-specific engagement */}
                          <Text fz={11} c={TV.textPrimary}>{pdf.uniqueViews.toLocaleString()}</Text>
                          <Text fz={11} c={TV.textPrimary}>{pdf.totalViews.toLocaleString()}</Text>
                          <Text fz={11} c={TV.textPrimary}>{pdf.downloads.toLocaleString()}</Text>
                          <Text fz={11} c={TV.textPrimary}>{pdf.prints}</Text>
                          <Text fz={11} c={TV.textPrimary}>{pdf.shares}</Text>
                          <Text fz={11} c={TV.textPrimary}>{pdf.requestPrint}</Text>
                          <Text fz={11} fw={600} c={TV.textPrimary}>{pdf.avgCompletion}</Text>
                        </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Expand all / collapse all control */}
            <div className="flex items-center justify-between px-5 py-2.5 bg-tv-surface-muted rounded-b-[16px]" style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
              <Text fz={11} c={TV.textSecondary}>{expandedOdderIds.size} of {filteredOdderCampaigns.length} campaigns expanded</Text>
              <Button
                variant="subtle"
                color="tvPurple"
                size="xs"
                radius="xl"
                onClick={() => {
                  if (expandedOdderIds.size === filteredOdderCampaigns.length) {
                    setExpandedOdderIds(new Set());
                  } else {
                    setExpandedOdderIds(new Set(filteredOdderCampaigns.map(c => c.id)));
                  }
                }}
              >
                {expandedOdderIds.size === filteredOdderCampaigns.length ? "Collapse All" : "Expand All"}
              </Button>
            </div>
          </DashCard>

          {/* ── Email → PDF Conversion Funnel ──────────────────────────────── */}
          {(() => {
            const funnelStages = [
              { key: "delivered", label: "Delivered", count: odderAgg.delivered, color: TV.textSecondary, icon: Mail },
              { key: "opened", label: "Opened Email", count: odderAgg.opened, color: TV.info, icon: MailOpen },
              { key: "viewed", label: "Viewed PDF", count: odderAgg.uniqueViews, color: "#3b82f6", icon: Eye },
              { key: "completed", label: "Completed PDF", count: odderAgg.completedReaders, color: TV.brand, icon: CircleCheckBig },
              { key: "acted", label: "Took Action", count: odderAgg.actionTakers, color: "#b45309", icon: MousePointerClick },
            ];
            const maxCount = funnelStages[0]?.count || 1;
            const endToEnd = maxCount > 0 ? ((funnelStages[funnelStages.length - 1].count / maxCount) * 100).toFixed(1) : "0.0";
            return (
            <DashCard className="overflow-hidden mb-4">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-tv-surface-muted border-b" style={{ borderColor: TV.borderDivider }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-[36px] h-[36px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: TV.infoBg, color: TV.info }}>
                    <GitCompareArrows size={18} />
                  </div>
                  <div>
                    <Text fz={14} fw={700} c={TV.textPrimary}>Email → PDF Conversion Funnel</Text>
                    <Text fz={11} c={TV.textSecondary}>Delivery through action on personalized endowment reports</Text>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-4">
                  <Text fz={10} c={TV.textSecondary}>End-to-end</Text>
                  <Text fz={18} fw={700} c={TV.textBrand} className="font-display leading-none">{endToEnd}%</Text>
                </div>
              </div>
              {/* Funnel stages */}
              <div className="px-5 py-5">
                {funnelStages.map((stage, i) => {
                  const pctOfMax = maxCount > 0 ? ((stage.count / maxCount) * 100) : 0;
                  const prevCount = i > 0 ? funnelStages[i - 1].count : stage.count;
                  const convFromPrev = prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(1) : "100.0";
                  const StageIcon = stage.icon;
                  const barFillPct = Math.max(pctOfMax, 2);
                  return (
                    <div key={stage.key} className={i > 0 ? "mt-1" : ""}>
                      {/* Conversion connector */}
                      {i > 0 && (
                        <div className="flex items-center ml-[7px] h-4">
                          <div className="w-px h-full" style={{ backgroundColor: TV.borderDivider }} />
                          <Badge size="xs" radius="sm" variant="light" color="gray" className="ml-2" styles={{ root: { textTransform: "none", letterSpacing: 0 } }}>
                            {convFromPrev}%
                          </Badge>
                        </div>
                      )}
                      {/* Stage row */}
                      <div className="flex items-center gap-3">
                        <div className="w-[15px] flex justify-center shrink-0">
                          <StageIcon size={14} style={{ color: stage.color }} />
                        </div>
                        {/* Tapering bar */}
                        <div className="flex-1 min-w-0">
                          <div className="h-[26px] rounded-md overflow-hidden relative" style={{ backgroundColor: `${stage.color}0a` }}>
                            <div
                              className="h-full rounded-md"
                              style={{ width: `${barFillPct}%`, backgroundColor: stage.color, opacity: 0.82 }}
                            />
                            <span className="absolute inset-y-0 left-2.5 flex items-center text-[11px] font-semibold" style={{ color: barFillPct > 35 ? "#fff" : TV.textPrimary }}>{stage.label}</span>
                          </div>
                        </div>
                        {/* Metrics */}
                        <div className="text-right shrink-0 w-[88px]">
                          <span className="text-[15px] font-bold font-display leading-none" style={{ color: TV.textPrimary }}>{stage.count.toLocaleString()}</span>
                          <div className="text-[10px] mt-0.5" style={{ color: TV.textSecondary }}>{pctOfMax.toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Bottom — step-by-step rates */}
              <div className="px-5 py-2.5 border-t bg-tv-surface-muted flex items-center gap-3 overflow-x-auto" style={{ borderColor: TV.borderDivider }}>
                {funnelStages.slice(1).map((stage, i) => {
                  const prev = funnelStages[i];
                  const rate = prev.count > 0 ? ((stage.count / prev.count) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={stage.key} className="flex items-center gap-1.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: stage.color }} />
                      <Text fz={10} c={TV.textSecondary} className="whitespace-nowrap">{prev.label} → {stage.label}: <span className="font-semibold" style={{ color: TV.textPrimary }}>{rate}%</span></Text>
                    </div>
                  );
                })}
              </div>
            </DashCard>
            );
          })()}

          {/* ── Recipient-Level Drilldown ────────────────────────────────── */}
          {(() => {
            // Filter recipients by campaign selection + status + action filters + search
            const activeCampaignNames = odderCampaignFilter.length > 0 ? odderCampaignFilter : ODDER_CAMPAIGNS.map(c => c.name);
            let filteredRecipients = ODDER_RECIPIENTS.filter(r => activeCampaignNames.includes(r.campaign));

            if (odderStatusFilter.length > 0) {
              filteredRecipients = filteredRecipients.filter(r => {
                return odderStatusFilter.some(f => {
                  if (f === "opened_email") return r.openedEmail;
                  if (f === "viewed_pdf") return r.viewedPdf;
                  if (f === "completed_pdf") return r.pdfCompletion >= 90;
                  if (f === "took_action") return r.downloaded || r.printed || r.shared || r.requestedPrint;
                  if (f === "didnt_open") return !r.openedEmail;
                  return true;
                });
              });
            }
            if (odderActionFilter.length > 0) {
              filteredRecipients = filteredRecipients.filter(r => {
                return odderActionFilter.some(f => {
                  if (f === "downloaded") return r.downloaded;
                  if (f === "printed") return r.printed;
                  if (f === "shared") return r.shared;
                  if (f === "requested_print") return r.requestedPrint;
                  return true;
                });
              });
            }
            if (odderRecipientSearch.trim()) {
              const q = odderRecipientSearch.toLowerCase();
              filteredRecipients = filteredRecipients.filter(r =>
                r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.donorId.toLowerCase().includes(q)
              );
            }

            // Sort
            const sorted = [...filteredRecipients].sort((a, b) => {
              const { col, dir } = odderRecipientSort;
              let cmp = 0;
              if (col === "name") cmp = a.name.localeCompare(b.name);
              else if (col === "pdfCompletion") cmp = a.pdfCompletion - b.pdfCompletion;
              else if (col === "lastActivity") cmp = a.lastActivity.localeCompare(b.lastActivity);
              else if (col === "campaign") cmp = a.campaign.localeCompare(b.campaign);
              else if (col === "status") {
                const order: Record<string, number> = { active: 0, new: 1, at_risk: 2, lapsed: 3 };
                cmp = (order[a.engagementStatus] ?? 4) - (order[b.engagementStatus] ?? 4);
              }
              return dir === "asc" ? cmp : -cmp;
            });

            const toggleSort = (col: string) => {
              setOdderRecipientSort(prev =>
                prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" }
              );
            };
            const SortIcon = ({ col }: { col: string }) => {
              if (odderRecipientSort.col !== col) return <ArrowUpDown size={10} style={{ color: TV.textDecorative }} />;
              return odderRecipientSort.dir === "asc"
                ? <ArrowUp size={10} style={{ color: TV.textBrand }} />
                : <ArrowDown size={10} style={{ color: TV.textBrand }} />;
            };

            const STATUS_COLORS: Record<string, string> = { active: "teal", new: "blue", at_risk: "orange", lapsed: "red" };
            const STATUS_LABELS: Record<string, string> = { active: "Active", new: "New", at_risk: "At Risk", lapsed: "Lapsed" };

            return (
            <DashCard className="overflow-hidden mb-4">
              <div className="flex items-center justify-between px-5 py-3 bg-tv-surface-muted border-b" style={{ borderColor: TV.borderDivider }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-[36px] h-[36px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: TV.infoBg, color: TV.info }}>
                    <Users size={18} />
                  </div>
                  <div>
                    <Text fz={14} fw={700} c={TV.textPrimary}>Recipient Engagement</Text>
                    <Text fz={11} c={TV.textSecondary}>Per-donor engagement data for personalized endowment reports — {sorted.length} of {ODDER_RECIPIENTS.length} recipients shown</Text>
                  </div>
                </div>
              </div>
              {/* Filter + search bar */}
              <div className="flex items-center gap-2 flex-wrap px-5 py-3 border-b" style={{ borderColor: TV.borderDivider }}>
                <ChipFilter
                  label="Status"
                  icon={Activity}
                  options={[
                    { value: "opened_email", label: "Opened Email" },
                    { value: "viewed_pdf", label: "Viewed PDF" },
                    { value: "completed_pdf", label: "Completed PDF" },
                    { value: "took_action", label: "Took Action" },
                    { value: "didnt_open", label: "Didn't Open" },
                  ]}
                  values={odderStatusFilter}
                  onChange={setOdderStatusFilter}
                />
                <ChipFilter
                  label="Action"
                  icon={MousePointerClick}
                  options={[
                    { value: "downloaded", label: "Downloaded" },
                    { value: "printed", label: "Printed" },
                    { value: "shared", label: "Shared" },
                    { value: "requested_print", label: "Requested Print" },
                  ]}
                  values={odderActionFilter}
                  onChange={setOdderActionFilter}
                />
                <div className="flex-1" />
                <TextInput
                  placeholder="Search recipients…"
                  leftSection={<Search size={12} style={{ color: TV.textSecondary }} />}
                  value={odderRecipientSearch}
                  onChange={e => setOdderRecipientSearch(e.currentTarget.value)}
                  size="xs"
                  radius="xl"
                  styles={{ input: { borderColor: TV.borderLight, fontSize: 11, minWidth: 200, height: 30, minHeight: 30 }, section: { width: 28 } }}
                />
              </div>
              {/* Table */}
              <div className="overflow-x-auto">
                <div className="min-w-[960px]">
                  {/* Header */}
                  <div className="grid grid-cols-[2fr_1.2fr_80px_80px_60px_60px_60px_60px_80px_100px] gap-2 px-5 py-2.5 bg-tv-surface-muted border-b text-[11px] font-semibold uppercase tracking-[0.04em]" style={{ borderColor: TV.borderDivider, color: TV.textSecondary }}>
                    <button className="flex items-center gap-1 text-left" onClick={() => toggleSort("name")}>Recipient <SortIcon col="name" /></button>
                    <button className="flex items-center gap-1 text-left" onClick={() => toggleSort("campaign")}>Campaign <SortIcon col="campaign" /></button>
                    <span className="text-center">Opened</span>
                    <span className="text-center">Viewed</span>
                    <button className="flex items-center gap-1 justify-center" onClick={() => toggleSort("pdfCompletion")}>Compl. <SortIcon col="pdfCompletion" /></button>
                    <span className="text-center">DL</span>
                    <span className="text-center">Print</span>
                    <span className="text-center">Share</span>
                    <button className="flex items-center gap-1 text-left" onClick={() => toggleSort("status")}>Status <SortIcon col="status" /></button>
                    <button className="flex items-center gap-1 text-left" onClick={() => toggleSort("lastActivity")}>Last Activity <SortIcon col="lastActivity" /></button>
                  </div>
                  {/* Rows */}
                  {sorted.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 gap-2">
                      <Users size={28} style={{ color: TV.textDecorative }} />
                      <Text fz={13} c={TV.textSecondary}>No recipients match the current filters</Text>
                      {(odderStatusFilter.length > 0 || odderActionFilter.length > 0 || odderRecipientSearch.trim()) && (
                        <UnstyledButton onClick={() => { setOdderStatusFilter([]); setOdderActionFilter([]); setOdderRecipientSearch(""); }}>
                          <Text fz={12} c={TV.textBrand} className="hover:underline">Clear all filters</Text>
                        </UnstyledButton>
                      )}
                    </div>
                  )}
                  {sorted.map(r => {
                    const hasAction = r.downloaded || r.printed || r.shared || r.requestedPrint;
                    return (
                    <div key={r.donorId} className="grid grid-cols-[2fr_1.2fr_80px_80px_60px_60px_60px_60px_80px_100px] gap-2 px-5 py-2.5 border-b items-center hover:bg-tv-surface-muted transition-colors" style={{ borderColor: TV.borderDivider }}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar size={28} radius="xl" style={{ backgroundColor: r.avatarColor, fontSize: 10, flexShrink: 0 }} color="white">{r.avatar}</Avatar>
                        <div className="min-w-0">
                          <Text fz={12} fw={600} c={TV.textPrimary} className="truncate">{r.name}</Text>
                          <Text fz={10} c={TV.textSecondary} className="truncate">{r.email} · {r.donorId}</Text>
                        </div>
                      </div>
                      <Text fz={11} c={TV.textSecondary} className="truncate">{r.campaign.length > 30 ? r.campaign.slice(0, 28) + "…" : r.campaign}</Text>
                      <div className="flex justify-center">
                        {r.openedEmail
                          ? <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.successBg }}><Check size={11} style={{ color: TV.success }} /></div>
                          : <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.dangerBg }}><X size={11} style={{ color: TV.danger }} /></div>
                        }
                      </div>
                      <div className="flex justify-center">
                        {r.viewedPdf
                          ? <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.infoBg }}><Check size={11} style={{ color: TV.info }} /></div>
                          : <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: TV.surface }}><X size={11} style={{ color: TV.textDecorative }} /></div>
                        }
                      </div>
                      <div className="flex justify-center">
                        {r.pdfCompletion > 0 ? (
                          <Tooltip label={`${r.pdfCompletion}% completed`} withArrow>
                            <div className="relative w-7 h-7">
                              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <circle cx="18" cy="18" r="14" fill="none" stroke={TV.borderLight} strokeWidth="3" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke={r.pdfCompletion >= 90 ? TV.brand : r.pdfCompletion >= 50 ? "#3b82f6" : "#b45309"} strokeWidth="3" strokeDasharray={`${(r.pdfCompletion / 100) * 87.96} 87.96`} strokeLinecap="round" />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-[7px] font-bold" style={{ color: TV.textPrimary }}>{r.pdfCompletion}</span>
                            </div>
                          </Tooltip>
                        ) : (
                          <Text fz={10} c={TV.textDecorative}>—</Text>
                        )}
                      </div>
                      <div className="flex justify-center">{r.downloaded ? <Download size={13} style={{ color: "#3b82f6" }} /> : <Text fz={10} c={TV.textDecorative}>—</Text>}</div>
                      <div className="flex justify-center">{r.printed ? <FileText size={13} style={{ color: TV.brand }} /> : <Text fz={10} c={TV.textDecorative}>—</Text>}</div>
                      <div className="flex justify-center">{r.shared ? <Share2 size={13} style={{ color: TV.warning }} /> : <Text fz={10} c={TV.textDecorative}>—</Text>}</div>
                      <Badge size="xs" radius="xl" color={STATUS_COLORS[r.engagementStatus] || "gray"} variant="light">{STATUS_LABELS[r.engagementStatus] || r.engagementStatus}</Badge>
                      <Text fz={10} c={TV.textSecondary}>{r.lastActivity}</Text>
                    </div>
                    );
                  })}
                </div>
              </div>
              {/* Footer summary */}
              <div className="px-5 py-2.5 bg-tv-surface-muted border-t flex items-center gap-4 flex-wrap" style={{ borderColor: TV.borderDivider }}>
                <Text fz={10} c={TV.textSecondary}>
                  <span className="font-semibold" style={{ color: TV.textPrimary }}>{sorted.filter(r => r.openedEmail).length}</span> opened ·
                  <span className="font-semibold" style={{ color: TV.textPrimary }}> {sorted.filter(r => r.viewedPdf).length}</span> viewed PDF ·
                  <span className="font-semibold" style={{ color: TV.textPrimary }}> {sorted.filter(r => r.pdfCompletion >= 90).length}</span> completed ·
                  <span className="font-semibold" style={{ color: TV.textPrimary }}> {sorted.filter(r => r.downloaded || r.printed || r.shared || r.requestedPrint).length}</span> took action
                </Text>
                <div className="flex-1" />
                <Text fz={10} c={TV.textDecorative}>Showing {sorted.length} of {ODDER_RECIPIENTS.length} recipients</Text>
              </div>
            </DashCard>
            );
          })()}

        </>
        );
      })()}

      {/* ─── TAB: 1:1 Video ────────────────────────────────────────────────── */}
      {mainTab === "video_1_1" && (() => {
        const selectedPeriod = videoTimePeriod[0] || "all_time";
        const periodLabel = VIDEO_1_1_TIME_PERIODS.find(p => p.value === selectedPeriod)?.label ?? "All time";
        const allVideoCampaigns = Array.from(new Set(VIDEO_1_1_RAW.flatMap(u => u.campaigns))).sort();
        // Resolve each user's data for the selected time period
        const resolvedUsers = VIDEO_1_1_RAW.map(raw => getVideo1_1Row(raw, selectedPeriod));
        const filteredVideoUsers = videoCampaignFilter.length > 0
          ? resolvedUsers.filter(u => u.campaigns.some(c => videoCampaignFilter.includes(c)))
          : resolvedUsers;

        // Aggregate summation
        const aggRecorded = filteredVideoUsers.reduce((s, u) => s + u.recorded, 0);
        const aggViews = filteredVideoUsers.reduce((s, u) => s + u.views, 0);
        const aggCta = filteredVideoUsers.reduce((s, u) => s + u.ctaInteractions, 0);
        const aggCtaPct = aggViews > 0 ? ((aggCta / aggViews) * 100).toFixed(1) : "0.0";
        const weightedStarted = filteredVideoUsers.reduce((s, u) => s + u.startedPctNum * u.views, 0);
        const aggStartedPct = aggViews > 0 ? (weightedStarted / aggViews).toFixed(1) : "0.0";
        const aggStartedCount = aggViews > 0 ? Math.round(parseFloat(aggStartedPct) / 100 * aggViews) : 0;
        const weightedFinished = filteredVideoUsers.reduce((s, u) => s + u.finishedPctNum * u.views, 0);
        const aggFinishedPct = aggViews > 0 ? (weightedFinished / aggViews).toFixed(1) : "0.0";
        const aggFinishedCount = aggViews > 0 ? Math.round(parseFloat(aggFinishedPct) / 100 * aggViews) : 0;
        const weightedDur = filteredVideoUsers.reduce((s, u) => s + u.avgDurationSecs * u.views, 0);
        const aggDurSecs = aggViews > 0 ? Math.round(weightedDur / aggViews) : 0;
        const aggDurStr = `${Math.floor(aggDurSecs / 60)}:${String(aggDurSecs % 60).padStart(2, "0")}`;

        const hasAnyFilter = videoCampaignFilter.length > 0 || selectedPeriod !== "all_time";

        // Sort helpers
        const toggleVideoSort = (col: string) => {
          setVideoSort(prev => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" });
        };
        const VideoSortIcon = ({ col }: { col: string }) => {
          const active = videoSort.col === col;
          if (!active) return <ArrowUpDown size={11} style={{ color: TV.borderStrong, marginLeft: 2 }} />;
          return videoSort.dir === "asc"
            ? <ArrowUp size={12} style={{ color: TV.textBrand, marginLeft: 2 }} />
            : <ArrowDown size={12} style={{ color: TV.textBrand, marginLeft: 2 }} />;
        };

        // Sort the filtered rows
        const sortedVideoUsers = [...filteredVideoUsers].sort((a, b) => {
          const getVal = (row: typeof a): number | string => {
            switch (videoSort.col) {
              case "user": return row.user;
              case "recorded": return row.recorded;
              case "views": return row.views;
              case "ctaInteractions": return row.ctaInteractions;
              case "ctaPct": return parseFloat(row.ctaPct);
              case "avgDuration": return row.avgDurationSecs;
              default: return 0;
            }
          };
          const av = getVal(a), bv = getVal(b);
          const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
          return videoSort.dir === "asc" ? cmp : -cmp;
        });

        const VIDEO_COLS = [
          { key: "user", label: "User", w: "2fr" },
          { key: "recorded", label: "Recorded", w: "1fr" },
          { key: "views", label: "Views", w: "1fr" },
          { key: "ctaInteractions", label: "CTA Interactions", w: "1fr" },
          { key: "ctaPct", label: "CTA %", w: "1fr" },
          { key: "avgDuration", label: "Avg Duration", w: "1fr" },
        ];
        const videoGridTemplate = VIDEO_COLS.map(c => c.w).join(" ");

        return (
        <>
          {/* Header with export */}
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <div>
              <Title order={3} fz={16}>1:1 Video Metrics</Title>
              <Text fz={12} c={TV.textSecondary}>Per-user video recording, view, and engagement data{selectedPeriod !== "all_time" ? ` · ${periodLabel}` : ""}</Text>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="default" radius="xl" size="xs" leftSection={<Download size={13} />}
                onClick={() => {
                  show("1:1 Video Metrics export requested — you\u2019ll receive it via email shortly", "success");
                }}
                styles={{ root: { borderColor: TV.borderLight } }}
              >
                Export
              </Button>
            </div>
          </div>

          {/* Filters: Time Period + Campaign */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <ChipFilter
              label="Time Period" icon={Clock}
              options={VIDEO_1_1_TIME_PERIODS}
              values={videoTimePeriod}
              onChange={(vals) => setVideoTimePeriod(vals.length > 0 ? [vals[vals.length - 1]] : ["all_time"])}
            />
            <ChipFilter label="Campaign" icon={Send} options={allVideoCampaigns.map(c => ({ value: c, label: c }))} values={videoCampaignFilter} onChange={setVideoCampaignFilter} searchable />
            {hasAnyFilter && (
              <UnstyledButton onClick={() => { setVideoCampaignFilter([]); setVideoTimePeriod(["all_time"]); }} className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-tv-surface-muted transition-colors">
                <X size={11} style={{ color: TV.textSecondary }} /><Text fz={10} c={TV.textSecondary}>Clear all</Text>
              </UnstyledButton>
            )}
          </div>

          {/* Aggregate KPI strip — Req Row 1: summation with all 6 data points */}
          <DashCard className="overflow-hidden mb-4">
            <div className="flex items-center gap-2.5 px-5 py-3 bg-tv-surface-muted border-b" style={{ borderColor: TV.borderDivider }}>
              <div className="w-[36px] h-[36px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: TV.brandTint, color: TV.textBrand }}>
                <Video size={18} />
              </div>
              <div>
                <Text fz={14} fw={700} c={TV.textPrimary}>Aggregate Performance</Text>
                <Text fz={11} c={TV.textSecondary}>{aggRecorded.toLocaleString()} videos recorded across {filteredVideoUsers.length} user{filteredVideoUsers.length !== 1 ? "s" : ""}{hasAnyFilter ? ` · ${periodLabel}` : ""}</Text>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex flex-wrap gap-x-6 gap-y-4 sm:gap-x-8 lg:gap-x-10">
                <Kpi label="Total Recorded" value={aggRecorded.toLocaleString()} />
                <div className="h-10 w-px hidden sm:block self-center" style={{ backgroundColor: TV.borderDivider }} />
                <Kpi label="Total Views" value={aggViews.toLocaleString()} />
                <div className="h-10 w-px hidden sm:block self-center" style={{ backgroundColor: TV.borderDivider }} />
                <Kpi label="CTA Interactions" value={aggCta.toLocaleString()} sub={`${aggCtaPct}%`} />
                <div className="h-10 w-px hidden sm:block self-center" style={{ backgroundColor: TV.borderDivider }} />
                <Kpi label="Started Watching" value={`${aggStartedPct}%`} sub={`${aggStartedCount.toLocaleString()} of ${aggViews.toLocaleString()}`} />
                <Kpi label="Watched Full Video" value={`${aggFinishedPct}%`} sub={`${aggFinishedCount.toLocaleString()} of ${aggViews.toLocaleString()}`} />
                <div className="h-10 w-px hidden sm:block self-center" style={{ backgroundColor: TV.borderDivider }} />
                <Kpi label="Avg View Duration" value={aggDurStr} />
              </div>
            </div>
          </DashCard>

          {/* Per-user breakdown — Req Row 2 */}
          <DashCard className="overflow-hidden mb-4">
            <div className="flex items-center justify-between px-5 py-3 bg-tv-surface-muted border-b" style={{ borderColor: TV.borderDivider }}>
              <Text fz={13} fw={700} c={TV.textPrimary}>Per-User Breakdown</Text>
              <div className="flex items-center gap-2">
                <Badge size="sm" radius="xl" color="tvPurple" variant="light">{filteredVideoUsers.length} user{filteredVideoUsers.length !== 1 ? "s" : ""}</Badge>
                <Tooltip label="Export per-user breakdown via email" withArrow>
                  <ActionIcon variant="subtle" size={28} radius="xl" color="gray" onClick={() => show("Per-user breakdown export requested — check your email shortly", "success")}
                    styles={{ root: { color: TV.textSecondary } }} aria-label="Export per-user breakdown">
                    <Download size={14} />
                  </ActionIcon>
                </Tooltip>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Sortable column headers */}
                <div className="grid gap-3 px-5 py-2.5 bg-tv-surface-muted border-b" style={{ gridTemplateColumns: videoGridTemplate, borderColor: TV.borderDivider }}>
                  {VIDEO_COLS.map(col => {
                    const active = videoSort.col === col.key;
                    return (
                      <button key={col.key} onClick={() => toggleVideoSort(col.key)} className="flex items-center gap-1 group text-left">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap select-none transition-colors" style={{ color: active ? TV.textBrand : TV.textSecondary }}>
                          {col.label}
                        </span>
                        <VideoSortIcon col={col.key} />
                      </button>
                    );
                  })}
                </div>
                {filteredVideoUsers.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-12 gap-2">
                    <Video size={28} style={{ color: TV.textDecorative }} />
                    <Text fz={13} c={TV.textSecondary}>No users match the selected filters</Text>
                    <UnstyledButton onClick={() => { setVideoCampaignFilter([]); setVideoTimePeriod(["all_time"]); }}><Text fz={12} c={TV.textBrand} className="hover:underline">Clear filters</Text></UnstyledButton>
                  </div>
                )}
                {sortedVideoUsers.map((u) => (
                  <div key={u.user} className="grid gap-3 px-5 py-3 border-b last:border-b-0 items-center" style={{ gridTemplateColumns: videoGridTemplate, borderColor: TV.borderDivider }}>
                    <div className="flex items-center gap-2 flex-nowrap">
                      <Avatar radius="xl" size="xs" color="tvPurple">{u.user.split(" ").map(n => n[0]).join("")}</Avatar>
                      <Text fz={12} fw={600} c={TV.textPrimary}>{u.user}</Text>
                    </div>
                    <Text fz={12} c={TV.textPrimary}>{u.recorded.toLocaleString()}</Text>
                    <Text fz={12} c={TV.textPrimary}>{u.views.toLocaleString()}</Text>
                    <Text fz={12} c={TV.textPrimary}>{u.ctaInteractions.toLocaleString()}</Text>
                    <Text fz={12} c={TV.textPrimary}>{u.ctaPct}</Text>
                    <Text fz={12} c={TV.textPrimary}>{u.avgDuration}</Text>
                  </div>
                ))}
              </div>
            </div>
            {/* Table footer */}
            <div className="px-5 py-2.5 bg-tv-surface-muted border-t flex items-center justify-between flex-wrap gap-2" style={{ borderColor: TV.borderDivider }}>
              <Text fz={10} c={TV.textSecondary}>
                Showing {filteredVideoUsers.length} of {resolvedUsers.length} users{videoCampaignFilter.length > 0 ? " (filtered by campaign)" : ""} · {periodLabel}
              </Text>
              <Text fz={10} c={TV.textDecorative}>
                Totals: {aggRecorded.toLocaleString()} recorded · {aggViews.toLocaleString()} views · {aggCta.toLocaleString()} CTA interactions
              </Text>
            </div>
          </DashCard>

          {/* Export info banner — Req Row 3 */}
          <DashCard className="overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5" style={{ backgroundColor: TV.brandTint }}>
              <Mail size={16} style={{ color: TV.textBrand, flexShrink: 0 }} />
              <div className="flex-1">
                <Text fz={12} c={TV.textPrimary} fw={600}>Need a full export?</Text>
                <Text fz={11} c={TV.textSecondary}>Request a comprehensive 1:1 Video Metrics report including all users, campaigns, and time periods. The report will be generated and emailed to your registered address.</Text>
              </div>
              <Button variant="light" color="tvPurple" size="xs" radius="xl" leftSection={<Download size={13} />}
                onClick={() => show("Full 1:1 Video Metrics report requested — you\u2019ll receive it via email shortly", "success")}
              >
                Request Full Report
              </Button>
            </div>
          </DashCard>
        </>
        );
      })()}

      {/* ─── TAB: Visualizations ───────────────────────────────────────────── */}
      {mainTab === "visualizations" && <VisualizationsTab />}

      {/* ─── TAB: Tags by Performance ─────────────────────────────────────── */}
      {mainTab === "tags" && (() => {
        const TAGS_DEFAULT_VISIBLE = 15;
        const allTagGroups = [...filteredTagGroups];
        // Sort
        const tagsTabSorted = allTagGroups.sort((a, b) => {
          const getVal = (g: TagGroup): number | string => {
            if (tagsTabSort.col === "tag") return g.tag;
            if (tagsTabSort.col === "campaigns") return g.campaigns.length;
            if (tagsTabSort.col === "avgOpenRate") return g.avgOpenRate;
            if (tagsTabSort.col === "avgClickRate") return g.avgClickRate;
            if (tagsTabSort.col === "avgReplyRate") return g.avgReplyRate;
            if (tagsTabSort.col === "avgVideoPct") return g.avgVideoPct;
            return (g as any)[tagsTabSort.col] ?? 0;
          };
          const av = getVal(a), bv = getVal(b);
          const cmp = typeof av === "number" ? av - (bv as number) : String(av).localeCompare(String(bv));
          return tagsTabSort.dir === "asc" ? cmp : -cmp;
        });
        // Search
        const searchedTags = tagsTabSearch
          ? tagsTabSorted.filter(g => g.tag.toLowerCase().includes(tagsTabSearch.toLowerCase()))
          : tagsTabSorted;
        const displayTags = tagsTabShowAll ? searchedTags : searchedTags.slice(0, TAGS_DEFAULT_VISIBLE);
        const remainingCount = searchedTags.length - TAGS_DEFAULT_VISIBLE;
        const totalCampaigns = searchedTags.reduce((s, g) => s + g.campaigns.length, 0);
        const totalSent = searchedTags.reduce((s, g) => s + g.totalSent, 0);
        const totalDelivered = searchedTags.reduce((s, g) => s + g.totalDelivered, 0);
        const totalOpened = searchedTags.reduce((s, g) => s + g.totalOpened, 0);
        const totalClicked = searchedTags.reduce((s, g) => s + g.totalClicked, 0);
        const totalReplied = searchedTags.reduce((s, g) => s + g.totalReplied, 0);
        const overallOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
        const overallClickRate = totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0;
        const overallReplyRate = totalDelivered > 0 ? (totalReplied / totalDelivered) * 100 : 0;

        // Bar chart data — top 15 by selected metric
        const metricLabel: Record<string, string> = { avgOpenRate: "Open Rate", avgClickRate: "Click Rate", avgReplyRate: "Reply Rate", avgVideoPct: "Avg Video %", totalSent: "Total Sent" };
        const barData = [...searchedTags]
          .sort((a, b) => ((b as any)[tagsTabMetric] ?? 0) - ((a as any)[tagsTabMetric] ?? 0))
          .slice(0, 15)
          .map(g => ({
            tag: g.tag.length > 18 ? g.tag.slice(0, 16) + "…" : g.tag,
            fullTag: g.tag,
            value: tagsTabMetric === "totalSent" ? g.totalSent : parseFloat(((g as any)[tagsTabMetric] as number).toFixed(1)),
            color: TAG_COLORS[g.tag]?.color || TV.textBrand,
          }));

        const toggleTagsTabSort = (col: string) => {
          setTagsTabSort(prev => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" });
        };
        const TagsTabSortIcon = ({ col }: { col: string }) => {
          const active = tagsTabSort.col === col;
          if (!active) return <ArrowUpDown size={11} style={{ color: TV.borderStrong, marginLeft: 2 }} />;
          return tagsTabSort.dir === "asc"
            ? <ArrowUp size={12} style={{ color: TV.textBrand, marginLeft: 2 }} />
            : <ArrowDown size={12} style={{ color: TV.textBrand, marginLeft: 2 }} />;
        };

        return (
        <>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
            <div>
              <Title order={3} fz={16}>Tags by Performance</Title>
              <Text fz={12} c={TV.textSecondary}>Compare engagement metrics across all campaign tags — find your strongest categories</Text>
            </div>
            <Button variant="default" radius="xl" size="xs" leftSection={<Download size={12} />} onClick={() => { show("Tag performance report exported", "success"); }} styles={{ root: { borderColor: TV.borderLight } }}>
              Export Tags Report
            </Button>
          </div>

          {/* KPI summary strip */}
          <DashCard className="p-4 sm:p-5 mb-4">
            <div className="flex flex-wrap gap-x-6 gap-y-4 sm:gap-x-8 lg:gap-x-10">
              <Kpi label="Total Tags" value={String(searchedTags.length)} />
              <Kpi label="Campaigns" value={totalCampaigns.toLocaleString()} />
              <Kpi label="Total Sent" value={totalSent.toLocaleString()} />
              <Kpi label="Avg Open Rate" value={`${overallOpenRate.toFixed(1)}%`} good={overallOpenRate > 60} />
              <Kpi label="Avg Click Rate" value={`${overallClickRate.toFixed(1)}%`} good={overallClickRate > 20} />
              <Kpi label="Avg Reply Rate" value={`${overallReplyRate.toFixed(1)}%`} good={overallReplyRate > 5} />
            </div>
          </DashCard>

          {/* Horizontal bar chart — top tags by metric */}
          <DashCard className="overflow-hidden mb-4">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b flex-wrap gap-2" style={{ borderColor: TV.borderDivider }}>
              <div className="flex items-center gap-2.5">
                <div className="w-[36px] h-[36px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: TV.brandTint, color: TV.textBrand }}>
                  <BarChart3 size={18} />
                </div>
                <div>
                  <Text fz={14} fw={700} c={TV.textPrimary}>Top Tags by {metricLabel[tagsTabMetric]}</Text>
                  <Text fz={11} c={TV.textSecondary}>Top 15 tags ranked by selected metric</Text>
                </div>
              </div>
              <SegmentedControl
                value={tagsTabMetric}
                onChange={v => setTagsTabMetric(v as any)}
                size="xs" radius="xl" color="tvPurple"
                data={[
                  { value: "avgOpenRate", label: "Open %" },
                  { value: "avgClickRate", label: "Click %" },
                  { value: "avgReplyRate", label: "Reply %" },
                  { value: "avgVideoPct", label: "Video %" },
                  { value: "totalSent", label: "Volume" },
                ]}
              />
            </div>
            <div className="px-4 sm:px-5 py-4">
              {barData.map((d, i) => {
                const maxVal = Math.max(...barData.map(b => b.value), 1);
                const pct = (d.value / maxVal) * 100;
                const tc = TAG_COLORS[d.fullTag as CampaignTag];
                return (
                  <button
                    key={d.fullTag}
                    className="w-full flex items-center gap-3 py-1.5 group text-left transition-colors hover:bg-tv-surface-muted rounded-sm px-2 -mx-2"
                    onClick={() => {
                      const grp = searchedTags.find(g => g.tag === d.fullTag);
                      if (grp) { setTagDrawerGroup(grp); setTagDrawerSort({ col: "sent", dir: "desc" }); }
                    }}
                  >
                    <span className="text-[11px] font-semibold w-4 text-center shrink-0" style={{ color: TV.textDecorative }}>{i + 1}</span>
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tc?.color || TV.textBrand }} />
                    <span className="text-[12px] font-semibold w-[140px] shrink-0 truncate" style={{ color: TV.textPrimary }}>{d.tag}</span>
                    <div className="flex-1 h-[18px] rounded-sm overflow-hidden relative" style={{ backgroundColor: TV.borderLight }}>
                      <div
                        className="h-full rounded-sm transition-all"
                        style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: tc?.color || TV.textBrand, opacity: 0.75 }}
                      />
                    </div>
                    <span className="text-[12px] font-semibold w-14 text-right shrink-0" style={{ color: TV.textPrimary }}>
                      {tagsTabMetric === "totalSent" ? d.value.toLocaleString() : `${d.value}%`}
                    </span>
                    <ChevronRight size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: TV.textSecondary }} />
                  </button>
                );
              })}
              {barData.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <Text fz={12} c={TV.textSecondary}>No tags match your search</Text>
                </div>
              )}
            </div>
          </DashCard>

          {/* Full sortable tag table */}
          <DashCard className="overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b flex-wrap gap-2" style={{ borderColor: TV.borderDivider }}>
              <div className="flex items-center gap-2.5">
                <div className="w-[36px] h-[36px] rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: TV.brandTint, color: TV.textBrand }}>
                  <Layers size={18} />
                </div>
                <div>
                  <Text fz={14} fw={700} c={TV.textPrimary}>All Tags</Text>
                  <Text fz={11} c={TV.textSecondary}>
                    {searchedTags.length} tag{searchedTags.length !== 1 ? "s" : ""} · {totalCampaigns} campaigns · {totalSent.toLocaleString()} total sent
                    {!tagsTabShowAll && remainingCount > 0 ? ` · showing top ${TAGS_DEFAULT_VISIBLE}` : ""}
                  </Text>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TextInput
                  placeholder="Search tags…"
                  value={tagsTabSearch}
                  onChange={e => setTagsTabSearch(e.currentTarget.value)}
                  size="xs" radius="xl"
                  leftSection={<Search size={12} />}
                  rightSection={tagsTabSearch ? <X size={11} style={{ cursor: "pointer" }} onClick={() => setTagsTabSearch("")} /> : null}
                  styles={{ input: { fontSize: 12, borderColor: TV.borderLight, minWidth: 160 } }}
                />
                <Tooltip label="Export tag data">
                  <ActionIcon variant="subtle" color="gray" radius="xl" onClick={() => show("Tag data exported", "success")} aria-label="Export tag data"><Download size={14} /></ActionIcon>
                </Tooltip>
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block">
              {(() => {
                const cols: { key: string; label: string; w: string }[] = [
                  { key: "tag", label: "Tag", w: "2fr" },
                  { key: "campaigns", label: "Campaigns", w: "0.7fr" },
                  { key: "totalSent", label: "Sent", w: "0.8fr" },
                  { key: "avgOpenRate", label: "Open %", w: "0.9fr" },
                  { key: "avgClickRate", label: "Click %", w: "0.9fr" },
                  { key: "avgReplyRate", label: "Reply %", w: "0.9fr" },
                  { key: "avgVideoPct", label: "Video %", w: "0.9fr" },
                ];
                const gridTemplate = cols.map(c => c.w).join(" ") + " 36px";
                return (
                  <>
                    <div className="grid gap-3 px-5 py-2.5 bg-tv-surface-muted border-b" style={{ gridTemplateColumns: gridTemplate, borderColor: TV.borderDivider }}>
                      {cols.map(col => {
                        const active = tagsTabSort.col === col.key;
                        return (
                          <button key={col.key} onClick={() => toggleTagsTabSort(col.key)} className="flex items-center gap-1 group text-left">
                            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap select-none transition-colors" style={{ color: active ? TV.textBrand : TV.textSecondary }}>
                              {col.label}
                            </span>
                            <TagsTabSortIcon col={col.key} />
                          </button>
                        );
                      })}
                      <span />
                    </div>
                    {displayTags.map((g, i) => {
                      const tc = TAG_COLORS[g.tag];
                      const rank = searchedTags.indexOf(g) + 1;
                      return (
                        <button
                          key={g.tag}
                          onClick={() => { setTagDrawerGroup(g); setTagDrawerSort({ col: "sent", dir: "desc" }); }}
                          className={`w-full grid gap-3 px-5 py-3.5 border-b hover:bg-tv-surface-muted transition-colors text-left items-center`}
                          style={{ gridTemplateColumns: gridTemplate, borderColor: TV.borderDivider }}
                        >
                          {/* Tag */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-[11px] font-semibold w-5 text-center shrink-0" style={{ color: TV.textDecorative }}>{rank}</span>
                            <div className="w-[28px] h-[28px] rounded-sm flex items-center justify-center shrink-0" style={{ backgroundColor: tc?.bg || TV.surface }}>
                              <Tag size={13} style={{ color: tc?.color || TV.textSecondary }} />
                            </div>
                            <div className="min-w-0">
                              <Text fz={13} fw={600} c={TV.textPrimary} className="truncate">{g.tag}</Text>
                              <Text fz={10} c={TV.textSecondary}>{g.topCampaign ? `Top: ${g.topCampaign.name.slice(0, 30)}${g.topCampaign.name.length > 30 ? "…" : ""}` : ""}</Text>
                            </div>
                          </div>
                          {/* Campaigns */}
                          <Text fz={13} fw={600} c={TV.textPrimary}>{g.campaigns.length}</Text>
                          {/* Sent */}
                          <Text fz={13} fw={600} c={TV.textPrimary}>{g.totalSent.toLocaleString()}</Text>
                          {/* Open % */}
                          <div><MiniBar pct={g.avgOpenRate} color={tc?.color || TV.textBrand} /></div>
                          {/* Click % */}
                          <div><MiniBar pct={g.avgClickRate} color={TV.info} /></div>
                          {/* Reply % */}
                          <div><MiniBar pct={g.avgReplyRate} color={TV.success} /></div>
                          {/* Video % */}
                          <div><MiniBar pct={g.avgVideoPct} color={TV.warning} /></div>
                          {/* Chevron */}
                          <ChevronRight size={14} style={{ color: TV.textSecondary }} />
                        </button>
                      );
                    })}
                  </>
                );
              })()}
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden">
              {displayTags.map((g, i) => {
                const tc = TAG_COLORS[g.tag];
                const rank = searchedTags.indexOf(g) + 1;
                return (
                  <button
                    key={g.tag}
                    onClick={() => { setTagDrawerGroup(g); setTagDrawerSort({ col: "sent", dir: "desc" }); }}
                    className="w-full text-left px-4 py-4 border-b hover:bg-tv-surface-muted transition-colors"
                    style={{ borderColor: TV.borderDivider }}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <span className="text-[11px] font-semibold w-4 text-center shrink-0" style={{ color: TV.textDecorative }}>{rank}</span>
                      <div className="w-[28px] h-[28px] rounded-sm flex items-center justify-center shrink-0" style={{ backgroundColor: tc?.bg || TV.surface }}>
                        <Tag size={13} style={{ color: tc?.color || TV.textSecondary }} />
                      </div>
                      <Text fz={14} fw={600} c={TV.textPrimary} className="flex-1 truncate">{g.tag}</Text>
                      <ChevronRight size={14} style={{ color: TV.textSecondary }} />
                    </div>
                    <div className="grid grid-cols-3 gap-2 ml-9">
                      <div>
                        <Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Campaigns</Text>
                        <Text fz={13} fw={600} c={TV.textPrimary}>{g.campaigns.length}</Text>
                      </div>
                      <div>
                        <Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Sent</Text>
                        <Text fz={13} fw={600} c={TV.textPrimary}>{g.totalSent.toLocaleString()}</Text>
                      </div>
                      <div>
                        <Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Open %</Text>
                        <Text fz={13} fw={600} c={g.avgOpenRate > 60 ? TV.success : TV.textPrimary}>{g.avgOpenRate.toFixed(1)}%</Text>
                      </div>
                      <div>
                        <Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Click %</Text>
                        <Text fz={13} fw={600} c={TV.textPrimary}>{g.avgClickRate.toFixed(1)}%</Text>
                      </div>
                      <div>
                        <Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Reply %</Text>
                        <Text fz={13} fw={600} c={TV.textPrimary}>{g.avgReplyRate.toFixed(1)}%</Text>
                      </div>
                      <div>
                        <Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Video %</Text>
                        <Text fz={13} fw={600} c={TV.textPrimary}>{g.avgVideoPct.toFixed(1)}%</Text>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {searchedTags.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Text fz={12} c={TV.textSecondary}>No tags match "{tagsTabSearch}"</Text>
              </div>
            )}

            {/* Footer — show more / collapse */}
            {((!tagsTabShowAll && remainingCount > 0) || tagsTabShowAll) && (
              <div className="flex items-center justify-center gap-2 px-4 py-3 border-t rounded-b-[16px]" style={{ borderColor: TV.borderDivider, backgroundColor: TV.surface }}>
                {!tagsTabShowAll && remainingCount > 0 ? (
                  <Button size="xs" variant="light" color="tvPurple" radius="xl" leftSection={<ChevronDown size={12} />} onClick={() => setTagsTabShowAll(true)}>
                    Show {remainingCount} more tag{remainingCount !== 1 ? "s" : ""}
                  </Button>
                ) : tagsTabShowAll ? (
                  <Button size="xs" variant="subtle" color="gray" radius="xl" onClick={() => setTagsTabShowAll(false)}>
                    Show top {TAGS_DEFAULT_VISIBLE} only
                  </Button>
                ) : null}
              </div>
            )}
          </DashCard>

          {/* Reuse the existing tag drawer */}
          <Drawer opened={!!tagDrawerGroup} onClose={() => { setTagDrawerGroup(null); setTagDrawerSearch(""); }} position="right" size="lg" title={tagDrawerGroup ? `${tagDrawerGroup.tag} — All Campaigns` : ""} styles={DRAWER_STYLES}>
            {tagDrawerGroup && (() => {
              const g = tagDrawerGroup;
              const toggleDrawerSort = (col: string) => {
                setTagDrawerSort(prev => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "desc" });
              };
              const searched = tagDrawerSearch
                ? g.campaigns.filter(c => c.name.toLowerCase().includes(tagDrawerSearch.toLowerCase()))
                : g.campaigns;
              const sorted = [...searched].sort((a, b) => {
                const col = tagDrawerSort.col;
                let av: number, bv: number;
                if (col === "name") return tagDrawerSort.dir === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
                if (col === "openRate") { av = a.delivered > 0 ? a.opened / a.delivered : 0; bv = b.delivered > 0 ? b.opened / b.delivered : 0; }
                else if (col === "clickRate") { av = a.delivered > 0 ? a.clicked / a.delivered : 0; bv = b.delivered > 0 ? b.clicked / b.delivered : 0; }
                else if (col === "replyRate") { av = a.delivered > 0 ? a.replied / a.delivered : 0; bv = b.delivered > 0 ? b.replied / b.delivered : 0; }
                else { av = (a as any)[col] ?? 0; bv = (b as any)[col] ?? 0; }
                return tagDrawerSort.dir === "asc" ? av - bv : bv - av;
              });
              const DrawerSortIcon = ({ col }: { col: string }) => {
                const active = tagDrawerSort.col === col;
                if (!active) return <ArrowUpDown size={10} style={{ color: TV.borderStrong }} />;
                return tagDrawerSort.dir === "asc" ? <ArrowUp size={11} style={{ color: TV.textBrand }} /> : <ArrowDown size={11} style={{ color: TV.textBrand }} />;
              };
              const tc = TAG_COLORS[g.tag];
              return (
                <div>
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b" style={{ borderColor: TV.borderDivider }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: tc.bg }}>
                      <BarChart3 size={18} style={{ color: tc.color }} />
                    </div>
                    <div className="flex-1">
                      <Text fz={15} fw={700} c={TV.textPrimary}>{g.tag}</Text>
                      <Text fz={11} c={TV.textSecondary}>{g.campaigns.length} campaigns · {g.totalSent.toLocaleString()} total sent</Text>
                    </div>
                  </div>
                  {/* Quick stats */}
                  <div className="grid grid-cols-4 gap-3 mb-4 pb-3 border-b" style={{ borderColor: TV.borderDivider }}>
                    <div><Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Open %</Text><Text fz={14} fw={700} c={g.avgOpenRate > 60 ? TV.success : TV.textPrimary}>{g.avgOpenRate.toFixed(1)}%</Text></div>
                    <div><Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Click %</Text><Text fz={14} fw={700} c={TV.textPrimary}>{g.avgClickRate.toFixed(1)}%</Text></div>
                    <div><Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Reply %</Text><Text fz={14} fw={700} c={TV.textPrimary}>{g.avgReplyRate.toFixed(1)}%</Text></div>
                    <div><Text fz={9} c={TV.textSecondary} className="uppercase tracking-wider">Video %</Text><Text fz={14} fw={700} c={TV.textPrimary}>{g.avgVideoPct.toFixed(1)}%</Text></div>
                  </div>
                  <TextInput
                    placeholder="Search campaigns…"
                    value={tagDrawerSearch}
                    onChange={e => setTagDrawerSearch(e.currentTarget.value)}
                    size="xs" radius="xl" mb="sm"
                    leftSection={<Search size={12} />}
                    rightSection={tagDrawerSearch ? <X size={11} style={{ cursor: "pointer" }} onClick={() => setTagDrawerSearch("")} /> : null}
                    styles={{ input: { fontSize: 12, borderColor: TV.borderLight } }}
                  />
                  {tagDrawerSearch && (
                    <Text fz={10} c={TV.textSecondary} mb={6}>
                      Showing {sorted.length} of {g.campaigns.length} campaigns
                    </Text>
                  )}
                  <div className="grid grid-cols-[2fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-2 px-1 pb-2 border-b mb-1" style={{ borderColor: TV.borderDivider }}>
                    {[
                      { col: "name", label: "Campaign" },
                      { col: "sent", label: "Sent" },
                      { col: "openRate", label: "Open %" },
                      { col: "clickRate", label: "Click %" },
                      { col: "replyRate", label: "Reply %" },
                    ].map(h => (
                      <button key={h.col} onClick={() => toggleDrawerSort(h.col)} className="flex items-center gap-0.5 text-left">
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: tagDrawerSort.col === h.col ? TV.textBrand : TV.textSecondary }}>{h.label}</span>
                        <DrawerSortIcon col={h.col} />
                      </button>
                    ))}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {sorted.map(c => {
                      const cOpenRate = c.delivered > 0 ? (c.opened / c.delivered) * 100 : 0;
                      const cClickRate = c.delivered > 0 ? (c.clicked / c.delivered) * 100 : 0;
                      const cReplyRate = c.delivered > 0 ? (c.replied / c.delivered) * 100 : 0;
                      return (
                        <div key={c.name} className="grid grid-cols-[2fr_0.7fr_0.7fr_0.7fr_0.7fr] gap-2 px-1 py-2 border-b items-center hover:bg-tv-surface-muted transition-colors" style={{ borderColor: TV.borderDivider }}>
                          <button onClick={() => { setTagDrawerGroup(null); setTagDrawerSearch(""); navigateToCampaign(c.name); }} className="text-[12px] font-semibold truncate text-left hover:underline" style={{ color: TV.textBrand }}>{c.name}</button>
                          <Text fz={12} fw={600} c={TV.textPrimary}>{c.sent.toLocaleString()}</Text>
                          <Text fz={12} fw={600} c={cOpenRate > 70 ? TV.success : TV.textPrimary}>{cOpenRate.toFixed(1)}%</Text>
                          <Text fz={12} fw={600} c={cClickRate > 30 ? TV.success : TV.textPrimary}>{cClickRate.toFixed(1)}%</Text>
                          <Text fz={12} fw={600} c={cReplyRate > 5 ? TV.success : TV.textSecondary}>{cReplyRate.toFixed(1)}%</Text>
                        </div>
                      );
                    })}
                    {sorted.length === 0 && (
                      <div className="flex items-center justify-center py-6">
                        <Text fz={12} c={TV.textSecondary}>No campaigns match "{tagDrawerSearch}"</Text>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </Drawer>
        </>
        );
      })()}

      {/* Modals */}
      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />

      {showEditClipColumns && (
        <EditColumnsModal
          columns={CLIP_COLUMNS}
          active={activeClipColumns}
          onClose={() => setShowEditClipColumns(false)}
          onSave={cols => {
            setActiveClipColumns(cols);
            show("Column preferences updated", "success");
          }}
        />
      )}

      {/* Create List Naming Modal */}
      <Modal opened={!!createListPending} onClose={() => { setCreateListPending(null); setCreateListName(""); }} title="Name Your List" centered size="sm" radius={16}
        styles={{ title: { fontWeight: 700, fontSize: 16 }, header: { borderBottom: `1px solid ${TV.borderDivider}`, paddingBottom: 12 }, body: { paddingTop: 16 } }}>
        <Text fz={13} c={TV.textSecondary} mb={12}>
          Create a list from <strong style={{ color: TV.textPrimary }}>{createListPending}</strong> contacts. You can rename it below.
        </Text>
        <TextInput
          label="List name"
          placeholder="e.g. Follow-up — March 2026"
          value={createListName}
          onChange={e => setCreateListName(e.currentTarget.value)}
          onKeyDown={e => { if (e.key === "Enter" && createListName.trim()) confirmCreateList(); }}
          styles={{ label: { fontSize: 12, fontWeight: 600, marginBottom: 4, color: TV.textSecondary }, input: { borderRadius: 10, borderColor: TV.borderLight } }}
          autoFocus
        />
        <div className="flex items-center justify-end gap-2 mt-5">
          <Button variant="default" radius="xl" size="sm" onClick={() => { setCreateListPending(null); setCreateListName(""); }}
            style={{ borderColor: TV.borderLight }}>
            Cancel
          </Button>
          <Button color="tvPurple" radius="xl" size="sm" disabled={!createListName.trim()} leftSection={<ListPlus size={14} />} onClick={confirmCreateList}>
            Create List
          </Button>
        </div>
      </Modal>
    </Box>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Funnel Row — used in Performance tab
// ══════���════════════════════════════════════════════════════════════════════════

// Expanded sample contacts per funnel category — richer dataset for search & filter (Row 15)
const FUNNEL_CONTACTS: Record<string, { name: string; freq: number; email: string; donorId: string }[]> = (() => {
  const base = [
    { name: "Sarah Chen", freq: 4, email: "s.chen@foundation.org", donorId: "DN-10042" },
    { name: "David Park", freq: 3, email: "d.park@alumni.edu", donorId: "DN-10045" },
    { name: "James Whitfield", freq: 2, email: "j.whitfield@alumni.edu", donorId: "DN-10041" },
    { name: "Linda Osei", freq: 2, email: "l.osei@alumni.edu", donorId: "DN-10055" },
    { name: "Emily Torres", freq: 1, email: "e.torres@corp.com", donorId: "DN-10044" },
    { name: "Marcus Reid", freq: 1, email: "m.reid@email.com", donorId: "DN-10043" },
    { name: "Aisha Johnson", freq: 1, email: "a.johnson@gmail.com", donorId: "DN-10046" },
    { name: "Rachel Thompson", freq: 3, email: "r.thompson@alumni.edu", donorId: "DN-10058" },
    { name: "Kevin Zhang", freq: 2, email: "k.zhang@alumni.edu", donorId: "DN-10062" },
    { name: "Monica Price", freq: 1, email: "m.price@alumni.edu", donorId: "DN-10071" },
  ];
  // Create per-key variants (slice different subsets to make it realistic)
  const keys = ["sent", "delivered", "opened", "opened_no_click", "didnt_open", "clicked", "didnt_click", "viewed", "didnt_view", "started", "finished", "shared", "cta_clicked", "downloaded", "replied", "unsubscribed", "bounced", "spam"];
  const result: Record<string, typeof base> = {};
  for (const k of keys) {
    if (["didnt_open", "unsubscribed", "bounced", "spam"].includes(k)) {
      result[k] = base.slice(5, 8);
    } else if (["shared", "downloaded"].includes(k)) {
      result[k] = base.slice(0, 3);
    } else {
      result[k] = base;
    }
  }
  return result;
})();

function FunnelRow({ cat, max, onCreateList, onViewContacts, expanded, onToggle }: {
  cat: FunnelCategory;
  max: number;
  onCreateList: (label: string) => void;
  onViewContacts?: (catKey: string, catLabel: string) => void;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const [inlineSearch, setInlineSearch] = useState("");
  const pct = ((cat.count / max) * 100).toFixed(1);
  const isNegative = ["opened_no_click", "didnt_open", "didnt_click", "didnt_view", "unsubscribed", "bounced", "spam"].includes(cat.key);

  // Get sample contacts for this category and filter by search
  const allContacts = FUNNEL_CONTACTS[cat.key] || FUNNEL_CONTACTS.sent;
  const filteredContacts = inlineSearch.trim()
    ? allContacts.filter(c => {
        const q = inlineSearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.donorId.toLowerCase().includes(q);
      })
    : allContacts;

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: TV.borderDivider }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle?.(); } }}
        className="w-full flex items-center gap-3 px-5 py-3 hover:bg-tv-surface-muted transition-colors text-left group cursor-pointer"
      >
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
        <span className="text-[12px] w-40 sm:w-48 shrink-0 truncate" style={{ color: TV.textPrimary }}>{cat.label}</span>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: TV.borderLight }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${Math.min(parseFloat(pct), 100)}%`, backgroundColor: cat.color, opacity: isNegative ? 0.5 : 1 }}
          />
        </div>
        <span className="text-[13px] font-bold font-display w-14 text-right shrink-0" style={{ color: TV.textPrimary }}>{cat.count.toLocaleString()}</span>
        <span className="text-[10px] w-12 text-right shrink-0" style={{ color: TV.textSecondary }}>{pct}%</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Tooltip label={`Create list from "${cat.label}"`} position="top">
            <ActionIcon variant="subtle" color="tvPurple" size="xs" radius="xl" onClick={(e) => { e.stopPropagation(); onCreateList(cat.label); }} aria-label={`Create list from ${cat.label}`}>
              <ListPlus size={13} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="View all contacts" position="top">
            <ActionIcon variant="subtle" color="gray" size="xs" radius="xl" onClick={(e) => { e.stopPropagation(); onViewContacts?.(cat.key, cat.label); }} aria-label="View all contacts">
              <Users size={13} />
            </ActionIcon>
          </Tooltip>
        </div>
        <ChevronRight size={12} className={`shrink-0 transition-transform ${expanded ? "rotate-90" : ""}`} style={{ color: TV.textDecorative }} />
      </div>
      {expanded && (
        <div className="px-5 pb-3 pt-0 space-y-2">
          <div className="bg-tv-surface-muted rounded-md p-3 text-[11px] flex items-center gap-4 flex-wrap" style={{ color: TV.textSecondary }}>
            <span><span className="font-semibold" style={{ color: TV.textPrimary }}>{cat.count.toLocaleString()}</span> contacts in this segment</span>
            <span style={{ color: TV.textDecorative }} aria-hidden="true">|</span>
            <span>{pct}% of total sent</span>
            <div className="flex-1" />
            <Button size="xs" variant="light" color="tvPurple" radius="xl" leftSection={<ListPlus size={11} />} onClick={() => onCreateList(cat.label)}>
              Create List
            </Button>
            <Button size="xs" variant="subtle" color="gray" radius="xl" leftSection={<Users size={11} />} onClick={() => onViewContacts?.(cat.key, cat.label)}>
              View All Contacts
            </Button>
          </div>
          {/* Per-contact frequency sample with search (Row 15: search/filter through contacts) */}
          <div className="bg-white border rounded-md overflow-hidden" style={{ borderColor: TV.borderDivider }}>
            <div className="flex items-center justify-between gap-3 px-3 py-2 bg-tv-surface-muted border-b" style={{ borderColor: TV.borderDivider }}>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] shrink-0" style={{ color: TV.textSecondary }}>Contacts in &quot;{cat.label}&quot;</span>
              <TextInput
                placeholder="Search by name or email…"
                leftSection={<Search size={11} style={{ color: TV.textSecondary }} />}
                value={inlineSearch}
                onChange={e => setInlineSearch(e.currentTarget.value)}
                size="xs"
                radius="md"
                onClick={e => e.stopPropagation()}
                styles={{ input: { borderColor: TV.borderLight, fontSize: 11, minWidth: 180, height: 26, minHeight: 26 }, section: { width: 24 } }}
              />
            </div>
            {filteredContacts.length === 0 && (
              <div className="flex items-center justify-center py-4">
                <Text fz={11} c={TV.textSecondary}>{inlineSearch.trim() ? `No contacts match "${inlineSearch}"` : "No contacts in this segment"}</Text>
              </div>
            )}
            {filteredContacts.map(c => (
              <div key={c.email} className="flex items-center gap-3 px-3 py-2 border-b last:border-b-0" style={{ borderColor: TV.borderDivider }}>
                <span className="text-[12px] font-semibold flex-1 min-w-0 truncate" style={{ color: TV.textPrimary }}>{c.name}</span>
                <span className="text-[11px] shrink-0 hidden sm:inline" style={{ color: TV.textSecondary }}>{c.donorId}</span>
                <span className="text-[11px] shrink-0" style={{ color: TV.textSecondary }}>{c.email}</span>
                <Badge size="xs" radius="xl" color={c.freq >= 3 ? "tvPurple" : "gray"} variant="light" className="shrink-0">{c.freq}×</Badge>
              </div>
            ))}
            {inlineSearch.trim() && filteredContacts.length > 0 && (
              <div className="px-3 py-1.5 bg-tv-surface-muted border-t" style={{ borderColor: TV.borderDivider }}>
                <Text fz={10} c={TV.textSecondary}>Showing {filteredContacts.length} of {allContacts.length} sample contacts{cat.count > allContacts.length ? ` (${cat.count.toLocaleString()} total)` : ""}</Text>
              </div>
            )}
            {!inlineSearch.trim() && cat.count > allContacts.length && (
              <div className="px-3 py-1.5 bg-tv-surface-muted border-t" style={{ borderColor: TV.borderDivider }}>
                <Text fz={10} c={TV.textSecondary}>Showing {allContacts.length} of {cat.count.toLocaleString()} total — <button className="underline" style={{ color: TV.textBrand }} onClick={() => onViewContacts?.(cat.key, cat.label)}>view all</button></Text>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
