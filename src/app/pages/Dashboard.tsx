import { useState } from "react";
import {
  Text, Title, Button, UnstyledButton, ActionIcon,
  Badge, SegmentedControl, Menu, FocusTrap,
} from "@mantine/core";
import { useNavigate } from "react-router";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Eye, MessageSquare, TrendingUp, Film, Send, Clock, Activity, Zap, Target,
  CircleCheckBig, CircleAlert, Settings, X, Check, Mail, PhoneOff, Wifi,
  TriangleAlert, MousePointerClick, Timer, UserCheck, Inbox, Star,
  Play, Plus, Video, ChevronRight, ChevronDown, Users,
  Megaphone, ChartColumn, GitBranch, Bell, Bookmark, Clapperboard,
} from "lucide-react";
// Stock photos for campaign thumbnails
const imgImageThankYouForYourFeedbackCadences20 = "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=220&h=165&fit=crop&auto=format";
const imgImageTest = "https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=220&h=165&fit=crop&auto=format";
import svgPaths from "../../imports/svg-gd1t0gj97i";
import { TV } from "../theme";
import { CreateCampaignDropdown } from "./CampaignsList";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Metric = {
  id: string; label: string; value: string; sub: string; subColor: string;
  icon: React.ElementType; iconColor: string; iconBg: string; category: string;
};

// ─── METRICS POOL ──────────────────────────────────────────────────────────

const ALL_METRICS: Metric[] = [
  { id: "videos_sent",        label: "Videos Sent",        value: "247",     sub: "↑ 18 this month",          subColor: "text-tv-success", icon: Send,              iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Delivery"    },
  { id: "emails_delivered",   label: "Emails Delivered",   value: "1,389",   sub: "99.1% delivery rate",       subColor: "text-tv-success", icon: Mail,              iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Delivery"    },
  { id: "contacts_reached",   label: "Constituents Reached",   value: "891",     sub: "Across all campaigns",      subColor: "text-tv-text-secondary", icon: UserCheck,         iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Delivery"    },
  { id: "sms_delivered",      label: "SMS Delivered",      value: "312",     sub: "↑ 24 this month",           subColor: "text-tv-success", icon: Inbox,             iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Delivery"    },
  { id: "open_rate",          label: "Avg. Open Rate",     value: "79.4%",   sub: "↑ +2.1% vs last month",    subColor: "text-tv-success", icon: Eye,               iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Engagement"  },
  { id: "video_views",        label: "Total Video Views",  value: "1,842",   sub: "Across all campaigns",      subColor: "text-tv-text-secondary", icon: Film,              iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Engagement"  },
  { id: "reply_rate",         label: "Reply Rate",         value: "14.2%",   sub: "↑ across all campaigns",        subColor: "text-tv-success", icon: MessageSquare,     iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Engagement"  },
  { id: "click_rate",         label: "Click Rate",         value: "24.7%",   sub: "↑ +1.3% vs last month",    subColor: "text-tv-success", icon: MousePointerClick, iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Engagement"  },
  { id: "avg_watch_time",     label: "Avg. Watch Time",    value: "0:48",    sub: "Out of avg 1:02 length",    subColor: "text-tv-text-secondary", icon: Timer,             iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Engagement"  },
  { id: "videos_recorded",    label: "Videos Recorded",    value: "31",      sub: "By your team this month",   subColor: "text-tv-text-secondary", icon: Video,             iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Engagement"  },
  { id: "account_health",     label: "Account Health",     value: "Good",    sub: "All signals healthy",       subColor: "text-tv-success", icon: Star,              iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Health"      },
  { id: "bounce_rate",        label: "Bounce Rate",        value: "0.3%",    sub: "Low bounce rate",           subColor: "text-tv-success", icon: Wifi,              iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Health"      },
  { id: "spam_rate",          label: "Spam Rate",          value: "0.00%",   sub: "Well within limits",        subColor: "text-tv-success", icon: TriangleAlert,     iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Health"      },
  { id: "unsubscribe_rate",   label: "Unsubscribe Rate",   value: "0.12%",   sub: "Below 0.5% threshold",     subColor: "text-tv-success", icon: UserCheck,         iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Health"      },
  { id: "sms_optout",         label: "SMS Opt-Out",        value: "2.29%",   sub: "Within normal range",       subColor: "text-tv-text-secondary", icon: PhoneOff,          iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Health"      },
  { id: "active_campaigns",   label: "Active Campaigns",   value: "3",       sub: "2 sent, 1 draft",           subColor: "text-tv-text-secondary", icon: Megaphone,         iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Campaigns"   },
  { id: "new_contacts",       label: "New Constituents",       value: "42",      sub: "Added this month",          subColor: "text-tv-success", icon: Users,             iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Campaigns"   },
  { id: "total_replies",      label: "Total Replies",      value: "18",      sub: "Across all campaigns",      subColor: "text-tv-text-secondary", icon: MessageSquare,     iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Campaigns"   },
  { id: "campaign_performance",label: "Engagement Score", value: "4.2 / 5",  sub: "Based on opens, views & replies", subColor: "text-tv-success", icon: ChartColumn,     iconColor: "text-tv-brand", iconBg: "bg-tv-brand-tint",  category: "Campaigns"   },
];

const DEFAULT_METRIC_IDS = ["videos_sent", "open_rate", "video_views", "reply_rate"];
const CATEGORY_ORDER = ["Delivery", "Engagement", "Health", "Campaigns"];

// ─── DATA ─────────────────────────────────────────────────────────────────────

const performanceData = [
  { month: "Sep", openRate: 68, clickThrough: 21, avgWatched: 58 },
  { month: "Oct", openRate: 72, clickThrough: 24, avgWatched: 63 },
  { month: "Nov", openRate: 75, clickThrough: 22, avgWatched: 61 },
  { month: "Dec", openRate: 80, clickThrough: 27, avgWatched: 70 },
  { month: "Jan", openRate: 77, clickThrough: 25, avgWatched: 66 },
  { month: "Feb", openRate: 79, clickThrough: 24, avgWatched: 72 },
];

const campaigns = [
  {
    id: 1, title: "Thank you for your feedback - Multi-Step 2.0",
    meta: "9 Recipients · Thank You · Email", status: "Sent",
    statusColor: "bg-tv-success-bg text-tv-success", image: imgImageThankYouForYourFeedbackCadences20,
    videosAdded: 9, sent: 9, openRate: "77.8%", replies: 0, spam: "0.00%", bounce: "0.0%",
    recentOpen: "3 min ago", isLive: true,
    goal:   { target: 80,  targetDisplay: "80%", actual: 77.8, actualDisplay: "77.8%", unit: "%" },
    result: { target: 3,   targetDisplay: "3",   actual: 0,    actualDisplay: "0",     unit: ""  },
  },
  {
    id: 2, title: "test", meta: "1 Recipient · Thank You · Email", status: "Draft",
    statusColor: "bg-tv-brand-tint text-tv-brand", image: imgImageTest,
    videosAdded: 0, sent: 0, openRate: "—", replies: 0, spam: "—", bounce: "—",
    recentOpen: null, isLive: false,
    goal:   { target: 75,  targetDisplay: "75%", actual: null, actualDisplay: "—",    unit: "%" },
    result: { target: 1,   targetDisplay: "1",   actual: null, actualDisplay: "—",    unit: ""  },
  },
  {
    id: 3, title: "Spring Annual Fund Appeal",
    meta: "142 Recipients · Appeal · Email", status: "Sent",
    statusColor: "bg-tv-success-bg text-tv-success", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=220&h=165&fit=crop&auto=format",
    videosAdded: 142, sent: 142, openRate: "82.4%", replies: 18, spam: "0.01%", bounce: "0.2%",
    recentOpen: "27 min ago", isLive: true,
    goal:   { target: 75,  targetDisplay: "75%", actual: 82.4, actualDisplay: "82.4%", unit: "%" },
    result: { target: 10,  targetDisplay: "10",  actual: 18,   actualDisplay: "18",    unit: ""  },
  },
];

const recentVideos = [
  { id: 1, title: "Welcome Message – Class of 2026",    duration: "0:42", date: "Feb 14", views: 127 },
  { id: 2, title: "Annual Fund Thank You",              duration: "1:08", date: "Feb 10", views: 89  },
  { id: 3, title: "Campaign Kick-off – Spring 2026",   duration: "0:55", date: "Feb 6",  views: 203 },
  { id: 4, title: "Personal Outreach – Major Donors",  duration: "1:22", date: "Jan 28", views: 56  },
];

const topCampaigns = [
  { id: 1, title: "Holiday Thank You 2023",    meta: "Sent to 3,456 Constituents", goalLabel: "Open rate above 85%",     resultLabel: "94% open rate",      exceeded: 9,  image: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=500&h=300&fit=crop&auto=format" },
  { id: 2, title: "New Student Welcome",       meta: "Sent to 2,187 Constituents", goalLabel: "Response rate above 60%", resultLabel: "73% response rate",  exceeded: 13, image: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=500&h=300&fit=crop&auto=format" },
  { id: 3, title: "Scholarship Announcement",  meta: "Sent to 1,892 Constituents", goalLabel: "Click rate above 50%",    resultLabel: "61% click rate",     exceeded: 11, image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500&h=300&fit=crop&auto=format" },
];

const recentActivity = [
  { id: 1, donor: "James Whitfield", action: "opened",    video: "Spring Annual Fund Appeal",          time: "2m ago",  avatar: "JW", color: "bg-tv-brand" },
  { id: 2, donor: "Sarah Chen",      action: "replied to",video: "Welcome Message – Class of 2026",   time: "14m ago", avatar: "SC", color: "bg-tv-brand" },
  { id: 3, donor: "Marcus Reid",     action: "watched",   video: "Annual Fund Thank You",             time: "31m ago", avatar: "MR", color: "bg-tv-brand-bg" },
  { id: 4, donor: "Emily Torres",    action: "opened",    video: "Campaign Kick-off – Spring 2026",  time: "1h ago",  avatar: "ET", color: "bg-[var(--tv-brand-hover)]" },
  { id: 5, donor: "David Park",      action: "replied to",video: "Spring Annual Fund Appeal",         time: "2h ago",  avatar: "DP", color: "bg-[var(--tv-brand-hover)]" },
];

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

function GoalResultBlock({ campaign }: { campaign: typeof campaigns[0] }) {
  const { goal, result } = campaign;
  const isDraft = campaign.status === "Draft";
  const goalPct   = goal.actual   !== null ? Math.min((goal.actual   / goal.target)   * 100, 100) : 0;
  const resultPct = result.actual !== null ? Math.min((result.actual / result.target) * 100, 100) : 0;
  const goalMet   = goal.actual   !== null && goal.actual   >= goal.target;
  const goalNear  = goal.actual   !== null && !goalMet && goal.actual >= goal.target * 0.85;
  const resultMet = result.actual !== null && result.actual >= result.target;
  const bar = (met: boolean, near: boolean) =>
    isDraft ? "bg-tv-border-light" : met ? "bg-tv-success" : near ? "bg-tv-warning" : "bg-tv-brand";

  return (
    <div className="flex gap-6 mt-3 pt-3 border-t border-tv-border-divider">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-1 shrink-0">
          <Target size={11} className="text-tv-brand" />
          <span className="text-[11px] font-medium text-tv-text-label">Goal</span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 h-[5px] bg-tv-border-light rounded-full overflow-hidden min-w-[60px]">
            <div className={`h-full rounded-full ${bar(goalMet, goalNear)}`} style={{ width: isDraft ? "0%" : `${goalPct}%` }} />
          </div>
          <span className={`text-[12px] font-semibold shrink-0 ${isDraft || goal.actual === null ? "text-tv-text-tertiary" : goalMet ? "text-tv-success" : goalNear ? "text-tv-warning" : "text-tv-text-primary"}`}>{goal.actualDisplay}</span>
          <span className="text-[11px] text-tv-text-secondary shrink-0">/ {goal.targetDisplay}</span>
          {!isDraft && goal.actual !== null && (goalMet ? <CircleCheckBig size={12} className="text-tv-success shrink-0" /> : <CircleAlert size={12} className="text-tv-warning shrink-0" />)}
        </div>
      </div>
      <div className="w-px bg-tv-border-divider shrink-0" />
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="flex items-center gap-1 shrink-0">
          <CircleCheckBig size={11} className="text-tv-info" />
          <span className="text-[11px] font-medium text-tv-text-label">Replies</span>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="flex-1 h-[5px] bg-tv-border-light rounded-full overflow-hidden min-w-[60px]">
            <div className={`h-full rounded-full ${bar(resultMet, false)}`} style={{ width: isDraft ? "0%" : `${resultPct}%` }} />
          </div>
          <span className={`text-[12px] font-semibold shrink-0 ${isDraft || result.actual === null ? "text-tv-text-tertiary" : resultMet ? "text-tv-success" : "text-tv-text-primary"}`}>{result.actualDisplay}</span>
          <span className="text-[11px] text-tv-text-secondary shrink-0">/ {result.targetDisplay}</span>
          {!isDraft && result.actual !== null && (resultMet ? <CircleCheckBig size={12} className="text-tv-success shrink-0" /> : <CircleAlert size={12} className="text-tv-warning shrink-0" />)}
        </div>
      </div>
    </div>
  );
}

function CampaignCard({ campaign, onViewAnalytics }: { campaign: typeof campaigns[0]; onViewAnalytics: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col py-5 border-b border-tv-border-light last:border-b-0">
      <div className="flex gap-4">
        <div className="relative w-[110px] h-[82px] rounded-lg bg-tv-brand-tint overflow-hidden shrink-0" style={{ border: `1px solid ${TV.borderStrong}` }}>
          {campaign.image ? <img src={campaign.image} alt={`${campaign.title} thumbnail`} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Play size={24} className="text-tv-text-decorative" aria-hidden="true" /></div>}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div className="min-w-0">
              <a href={`/campaigns/${campaign.id}`} className="text-[14px] font-bold text-tv-text-primary truncate hover:text-tv-brand transition-colors cursor-pointer block" onClick={(e) => { e.preventDefault(); navigate(`/campaigns/${campaign.id}`); }}>{campaign.title}</a>
              <p className="text-[12px] text-tv-text-secondary mt-0.5">{campaign.meta}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {campaign.isLive && campaign.recentOpen && (
                <div className="flex items-center gap-1.5 bg-tv-success-bg border border-tv-success-border rounded-full px-2.5 py-1">
                  <span className="relative flex h-2 w-2" aria-hidden="true"><span className="animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full bg-tv-success opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-tv-success" /></span>
                  <span className="text-[10px] text-tv-success font-medium">{campaign.recentOpen}</span>
                </div>
              )}
              <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${campaign.statusColor}`}>{campaign.status}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 mb-2">
            {[
              { label: "Videos Added", value: campaign.videosAdded },
              { label: "You've Sent",  value: campaign.sent       },
              { label: "Open Rate",    value: campaign.openRate   },
              { label: "Replies",      value: campaign.replies    },
              { label: "Spam / Bounce",value: `${campaign.spam} / ${campaign.bounce}` },
            ].map((s) => (
              <span key={s.label} className="text-[12px] text-tv-text-secondary">{s.label}: <span className="font-semibold text-tv-text-primary">{s.value}</span></span>
            ))}
          </div>
          <Button variant="outline" size="xs" leftSection={<ChartColumn size={11} />} onClick={onViewAnalytics}>
            View analytics
          </Button>
        </div>
      </div>
      <GoalResultBlock campaign={campaign} />
    </div>
  );
}

function CampaignsWidget({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="flex flex-col bg-white rounded-xl border border-tv-border-light">
      <div className="flex items-center justify-between gap-2 flex-wrap px-4 sm:px-6 py-4 sm:py-6" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
        <Title order={2} fz={{ base: 16, sm: 18 }} className="min-w-0 truncate">Your Ongoing Campaigns</Title>
        <CreateCampaignDropdown navigate={navigate} />
      </div>
      <div className="px-4 sm:px-6">
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} onViewAnalytics={() => navigate(`/campaigns/${c.id}?tab=data`)} />
        ))}
      </div>
      <div className="flex items-center justify-center py-4" style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
        <UnstyledButton onClick={() => navigate("/campaigns")} className="flex items-center gap-1 hover:underline" style={{ color: TV.textBrand, fontSize: 13, fontWeight: 500 }}>
          Go to your campaigns <ChevronRight size={14} />
        </UnstyledButton>
      </div>
    </div>
  );
}

function PerformanceChart({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-tv-border-light">
      <button onClick={onToggle} className="w-full flex items-center gap-2.5 px-6 py-5 hover:bg-black/[0.02] transition-colors text-left">
        <ChevronDown size={14} style={{ color: TV.textSecondary, transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
        <div className="flex-1">
          <Title order={2} fz={16}>Campaign Performance</Title>
          {collapsed && <Text fz={12} c={TV.textSecondary} mt={2}>Open rate, click-through rate & avg. % watched · 6 months</Text>}
        </div>
      </button>
      {!collapsed && <div className="px-6 pb-6">
      <Text fz={13} c={TV.textSecondary} mb="lg">Open rate, click-through rate & avg. % watched over the last 6 months</Text>
      <div role="img" aria-label="Bar chart showing campaign open rate, click-through rate, and average percent watched over the last 6 months">
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={performanceData} barSize={10} barGap={3}>
          <CartesianGrid key="grid" vertical={false} strokeDasharray="3 3" stroke={TV.borderLight} />
          <XAxis key="xaxis" dataKey="month" tick={{ fill: TV.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis key="yaxis" tick={{ fill: TV.textSecondary, fontSize: 12 }} axisLine={false} tickLine={false} unit="%" />
          <RechartsTooltip key="tooltip" contentStyle={{ borderRadius: 10, border: `1px solid ${TV.borderLight}`, fontSize: 12 }} cursor={{ fill: TV.brandTint }} formatter={(v: number, name: string) => [`${v}%`, name === "openRate" ? "Open Rate" : name === "clickThrough" ? "Click-Through Rate" : "Avg. % Watched"]} />
          <Legend key="legend" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} formatter={(v) => v === "openRate" ? "Open Rate" : v === "clickThrough" ? "Click-Through Rate" : "Avg. % Watched"} />
          <Bar key="bar-openRate" dataKey="openRate" fill={TV.brand} radius={[4,4,0,0]} name="openRate" isAnimationActive={false} />
          <Bar key="bar-clickThrough" dataKey="clickThrough" fill="#b38ce8" radius={[4,4,0,0]} name="clickThrough" isAnimationActive={false} />
          <Bar key="bar-avgWatched" dataKey="avgWatched" fill="#d8c8f5" radius={[4,4,0,0]} name="avgWatched" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
      </div>
      </div>}
    </div>
  );
}

function QuickActionsWidget({ navigate }: { navigate: (path: string) => void }) {
  const actions = [
    {
      label: "New Campaign",
      desc: "Create a new outreach campaign",
      to: "",
      campaignDropdown: true,
      icon: (
        <svg className="block size-[16px]" fill="none" viewBox="0 0 16 16" aria-hidden="true">
          <path d="M3.33333 8H12.6667" stroke="#00C0F5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6667" stroke="#00C0F5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </svg>
      ),
    },
    {
      label: "Create Video",
      desc: "Create a new personal video",
      to: "/video/create",
      icon: <Clapperboard size={16} color="#007c9e" aria-hidden="true" />,
    },
    {
      label: "Add Constituents",
      desc: "Import or add new constituents",
      to: "/contacts",
      icon: (
        <svg className="block size-[16px]" fill="none" viewBox="0 0 16 16" aria-hidden="true">
          <path d={svgPaths.p32887f80} stroke="#7c45b0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p3694d280} stroke="#7c45b0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p1f197700} stroke="#7c45b0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p3bf3e100} stroke="#7c45b0" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </svg>
      ),
    },
    {
      label: "Create Assets",
      desc: "Landing page, envelope & more",
      to: "/assets",
      icon: (
        <svg className="block size-[16px]" fill="none" viewBox="0 0 16 16" aria-hidden="true">
          <path d={svgPaths.p19416e00} stroke="#F97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p3e059a80} stroke="#F97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M6.66667 6H5.33333" stroke="#F97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M10.6667 8.66667H5.33333" stroke="#F97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M10.6667 11.3333H5.33333" stroke="#F97316" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </svg>
      ),
    },
  ];

  return (
    <div className="bg-white relative rounded-xl">
      <div aria-hidden="true" className="absolute border border-tv-border-light inset-0 pointer-events-none rounded-xl" />
      {/* Header */}
      <div className="relative border-b border-tv-border-divider px-[24px] pt-[20px] pb-[13px]">
        <h2 className="font-['Roboto',sans-serif] font-bold text-tv-text-primary text-[18px] tracking-[-0.44px] leading-[27px]">Quick Actions</h2>
      </div>
      {/* 2×2 grid */}
      <div className="grid grid-cols-2 grid-rows-2 gap-[12px] p-[16px]">
        {actions.map((action) => {
          const card = (
            <button
              key={action.label}
              onClick={action.to ? () => navigate(action.to) : undefined}
              className="bg-tv-brand-tint relative rounded-[14px] text-left transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer w-full"
            >
              <div aria-hidden="true" className="absolute border border-tv-border-light inset-0 pointer-events-none rounded-[14px]" />
              <div className="flex flex-col gap-[8px] items-start pl-[17px] pr-[8px] py-[17px] h-full">
                <div className="bg-white rounded-md w-10 h-10 flex items-center justify-center shrink-0">
                  {action.icon}
                </div>
                <p className="font-['Inter',Roboto,sans-serif] font-semibold text-tv-text-primary text-[13px] tracking-[-0.08px] leading-[19.5px]">{action.label}</p>
                <p className="font-['Inter',Roboto,sans-serif] font-medium text-tv-text-secondary text-[11px] tracking-[0.06px] leading-[13.75px]">{action.desc}</p>
              </div>
            </button>
          );
          if (action.campaignDropdown) {
            return <CreateCampaignDropdown key={action.label} navigate={navigate}>{card}</CreateCampaignDropdown>;
          }
          return card;
        })}
      </div>
    </div>
  );
}

function RecentActivityWidget({ navigate }: { navigate: (path: string) => void }) {
  const [activeTab, setActiveTab] = useState<"videos" | "activity">("activity");
  return (
    <div className="flex flex-col bg-white rounded-xl border border-tv-border-light">
      <div className="px-6 py-6" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
        <div className="flex items-center justify-between mb-2">
          <Title order={2} fz={16}>{activeTab === "videos" ? "Video Library" : "Donor Activity"}</Title>
          <UnstyledButton onClick={() => navigate(activeTab === "videos" ? "/videos" : "/analytics?tab=video_1_1")} className="flex items-center gap-0.5 hover:underline" style={{ color: TV.textBrand, fontSize: 13, fontWeight: 500 }}
            aria-label={activeTab === "videos" ? "View all videos" : "View all donor activity"}>
            View all <ChevronRight size={14} aria-hidden="true" />
          </UnstyledButton>
        </div>
        <SegmentedControl
          value={activeTab}
          onChange={v => setActiveTab(v as "videos" | "activity")}
          fullWidth
          size="xs"
          data={[
            { value: "activity", label: (
              <div className="flex items-center gap-1 flex-nowrap justify-center">
                <Activity size={10} />
                <span>Donor Activity</span>
                <Badge size="xs" radius="xl" color="tvPurple" variant="filled" className="w-3.5 h-3.5 p-0 flex items-center justify-center">5</Badge>
              </div>
            )},
            { value: "videos", label: (
              <div className="flex items-center gap-1 flex-nowrap justify-center">
                <Film size={10} />
                <span>My Videos</span>
              </div>
            )},
          ]}
        />
      </div>
      <div className="flex flex-col divide-y divide-tv-border-divider">
        {activeTab === "videos" ? (
          recentVideos.map((v) => (
            <div key={v.id} className="flex items-center gap-3 px-6 py-4 hover:bg-tv-surface-muted transition-colors group">
              <div className="w-10 h-10 bg-tv-brand-tint rounded-md flex items-center justify-center shrink-0 group-hover:bg-tv-surface-hover transition-colors">
                <Play size={14} className="text-tv-brand" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-tv-text-primary truncate">{v.title}</p>
                <p className="text-[12px] text-tv-text-secondary">{v.duration} · {v.date}</p>
              </div>
              <div className="flex items-center gap-1 text-[12px] text-tv-text-secondary shrink-0"><Eye size={12} />{v.views}</div>
            </div>
          ))
        ) : (
          recentActivity.map((item) => (
            <div key={item.id} className="flex items-start gap-3 px-6 py-4 hover:bg-tv-surface-muted transition-colors">
              <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>{item.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-tv-text-primary leading-snug">
                  <span className="font-semibold">{item.donor}</span>
                  <span className="text-tv-text-secondary"> {item.action} </span>
                  <span className="font-medium text-tv-brand block truncate">{item.video}</span>
                </p>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-tv-text-secondary shrink-0 mt-0.5"><Clock size={11} aria-hidden="true" />{item.time}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function MostSuccessfulCampaigns({ navigate, collapsed, onToggle }: { navigate: (path: string) => void; collapsed: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-tv-border-light">
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 sm:px-6 py-4 sm:py-5">
        <button onClick={onToggle} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <ChevronDown size={14} style={{ color: TV.textSecondary, transform: collapsed ? "rotate(-90deg)" : "rotate(0deg)", transition: "transform 0.15s" }} />
          <div className="text-left">
            <Title order={2} fz={{ base: 16, sm: 18 }}>Most Successful Campaigns</Title>
            <Text fz={{ base: 12, sm: 13 }} c={TV.textSecondary} mt={2}>Historical campaigns that exceeded their goals</Text>
          </div>
        </button>
        {!collapsed && <Button variant="outline" size="xs" onClick={() => navigate("/analytics?tab=performance")} className="shrink-0">View All</Button>}
      </div>
      {!collapsed && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 p-4 sm:p-6" style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
        {topCampaigns.map((c) => (
          <button type="button" key={c.id} onClick={() => navigate(`/analytics?tab=performance&campaign=${encodeURIComponent(c.title)}`)} className="rounded-xl border border-tv-border-light overflow-hidden flex flex-col hover:shadow-md transition-shadow group cursor-pointer text-left" aria-label={`View campaign: ${c.title}`}>
            <div className="relative h-[148px] flex items-center justify-center overflow-hidden">
              <img src={c.image} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-black/10" />
              <div className="relative w-12 h-12 rounded-full border-2 border-white/60 flex items-center justify-center group-hover:border-white group-hover:bg-white/10 group-hover:scale-110 transition-all duration-200 backdrop-blur-sm bg-black/20">
                <Play size={18} className="text-white/90 group-hover:text-white transition-colors ml-0.5" fill="currentColor" />
              </div>
              <div className="absolute top-3 right-3 bg-tv-success text-white text-[10px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                <TrendingUp size={9} />+{c.exceeded}%
              </div>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <h3 className="text-[14px] font-bold text-tv-text-primary leading-snug">{c.title}</h3>
                <p className="text-[12px] text-tv-text-secondary mt-0.5">{c.meta}</p>
              </div>
              <div className="border-t border-tv-border-divider" />
              <div className="flex flex-col gap-1.5">
                <p className="text-[12px] text-tv-text-secondary">Goal: {c.goalLabel}</p>
                <p className="text-[13px] font-bold text-tv-text-primary">Result: {c.resultLabel}</p>
                <div className="flex items-center gap-1.5 text-[12px] text-tv-success font-medium mt-0.5">
                  <CircleCheckBig size={13} />Exceeded goal by {c.exceeded}%
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>}
    </div>
  );
}

function MetricsSettingsPanel({ selectedIds, onToggle, onReset, onClose }: { selectedIds: string[]; onToggle: (id: string) => void; onReset: () => void; onClose: () => void }) {
  const grouped = CATEGORY_ORDER.reduce<Record<string, Metric[]>>((acc, cat) => {
    acc[cat] = ALL_METRICS.filter((m) => m.category === cat);
    return acc;
  }, {});

  return (
    <>
      <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-40" onClick={onClose} aria-hidden="true" />
      <FocusTrap active>
      <div
        className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="metrics-settings-title"
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
        tabIndex={-1}
        ref={(el) => el?.focus()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-tv-border-divider">
          <div>
            <h2 id="metrics-settings-title" className="text-[16px] font-black" style={{ color: TV.textPrimary }}>Customize Key Stats</h2>
            <p className="text-[12px] mt-0.5" style={{ color: TV.textSecondary }}>Choose up to 4 metrics to display</p>
          </div>
          <ActionIcon variant="subtle" color="gray" radius="xl" size="lg" onClick={onClose}
            className="hover:bg-tv-surface-hover"
            styles={{ root: { backgroundColor: TV.surface } }}
            aria-label="Close settings panel">
            <X size={15} />
          </ActionIcon>
        </div>
        <div className="px-6 py-4 border-b" style={{ borderColor: TV.borderDivider, backgroundColor: TV.surfaceMuted }}>
          <p className="text-[10px] font-medium text-tv-text-label uppercase tracking-wider mb-3">Current Selection</p>
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => {
              const metric = ALL_METRICS.find((m) => m.id === selectedIds[i]);
              return (
                <div key={i} className={`flex-1 rounded-md border px-2.5 py-2 transition-all ${metric ? "border-tv-border-strong bg-white" : "border-dashed border-tv-border bg-tv-surface"}`}>
                  {metric ? (
                    <div className="flex items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-md ${metric.iconBg} flex items-center justify-center shrink-0`}><metric.icon size={11} className={metric.iconColor} /></div>
                      <span className="text-[10px] font-medium text-tv-text-primary truncate">{metric.label}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-5"><span className="text-[10px] text-tv-text-decorative">Slot {i+1}</span></div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-tv-text-secondary mt-2.5"><span className={`font-semibold ${selectedIds.length >= 4 ? "text-tv-brand" : "text-tv-text-primary"}`}>{selectedIds.length}/4</span> selected</p>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {CATEGORY_ORDER.map((cat) => (
            <div key={cat} className="mb-5">
              <p className="text-[10px] font-medium text-tv-text-label uppercase tracking-wider mb-2.5">{cat}</p>
              <div className="flex flex-col gap-1.5">
                {grouped[cat].map((metric) => {
                  const isSelected = selectedIds.includes(metric.id);
                  const isFull = selectedIds.length >= 4 && !isSelected;
                  return (
                    <button key={metric.id} onClick={() => !isFull && onToggle(metric.id)} disabled={isFull}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${isSelected ? "border-tv-brand bg-tv-brand-tint" : isFull ? "border-tv-surface bg-white opacity-40 cursor-not-allowed" : "border-tv-surface bg-white hover:border-tv-border-strong hover:bg-tv-surface-muted cursor-pointer"}`}>
                      <div className={`w-8 h-8 rounded-sm ${metric.iconBg} flex items-center justify-center shrink-0`}><metric.icon size={15} className={metric.iconColor} /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-tv-text-primary">{metric.label}</p>
                        <p className="text-[11px] text-tv-text-secondary truncate">{metric.value} · {metric.sub}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-all ${isSelected ? "bg-tv-brand border-tv-brand" : "border-tv-border-light bg-white"}`}>
                        {isSelected && <Check size={11} className="text-white" strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
          <Button variant="subtle" color="gray" size="sm" onClick={onReset}
            className="hover:text-tv-brand"
            styles={{ root: { color: TV.textSecondary } }}>
            Reset to defaults
          </Button>
          <Button color="tvPurple" radius="xl" onClick={onClose}>Done</Button>
        </div>
      </div>
      </FocusTrap>
    </>
  );
}

function KeyStatsBar({ selectedIds, onOpenSettings }: { selectedIds: string[]; onOpenSettings: () => void }) {
  const navigate = useNavigate();
  const metrics = selectedIds.map((id) => ALL_METRICS.find((m) => m.id === id)).filter(Boolean) as Metric[];

  const getRoute = (m: Metric) => {
    if (m.category === "Campaigns") return "/campaigns";
    if (m.category === "Delivery")  return "/campaigns";
    if (m.id === "video_views" || m.id === "videos_recorded") return "/videos";
    if (m.category === "Health")    return "/analytics?tab=overview";
    return "/analytics?tab=performance";
  };

  return (
    <div className="bg-white rounded-xl border border-tv-border-light">
      {/* ── Mobile: 2×2 grid ── */}
      <div className="grid grid-cols-2 sm:hidden">
        {metrics.map((stat, i) => (
          <button
            key={stat.id}
            onClick={() => navigate(getRoute(stat))}
            className={[
              "flex items-center gap-3 p-4 hover:bg-tv-surface-muted transition-colors text-left",
              i % 2 === 0 ? "border-r border-tv-border-light" : "",
              i < 2 ? "border-b border-tv-border-light" : "",
            ].join(" ")}
          >
            <div className={`w-10 h-10 rounded-md ${stat.iconBg} flex items-center justify-center shrink-0`}>
              <stat.icon size={17} className={stat.iconColor} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium text-tv-text-label uppercase tracking-wider mb-0.5 truncate">{stat.label}</p>
              <p className="text-[18px] font-bold text-tv-text-primary leading-tight font-display">{stat.value}</p>
              <p className={`text-[10px] mt-0.5 ${stat.subColor} truncate`}>{stat.sub}</p>
            </div>
          </button>
        ))}
      </div>
      {/* Mobile customize button */}
      <div className="sm:hidden border-t border-tv-border-light flex items-center justify-end px-4 py-2">
        <button onClick={onOpenSettings} className="flex items-center gap-1.5 text-[11px] text-tv-text-secondary hover:text-tv-brand transition-colors">
          <Settings size={13} className="shrink-0" />Customize metrics
        </button>
      </div>

      {/* ── Desktop: horizontal bar ── */}
      <div className="hidden sm:flex items-stretch overflow-hidden">
        <div className="flex flex-1 min-w-0 divide-x divide-tv-border-light">
          {metrics.map((stat) => (
            <button
              key={stat.id}
              onClick={() => navigate(getRoute(stat))}
              className="flex-1 flex items-center gap-2.5 px-3 lg:px-5 py-4 lg:py-5 min-w-0 hover:bg-tv-surface-muted transition-colors group text-left"
            >
              <div className={`w-11 h-11 rounded-lg ${stat.iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}><stat.icon size={18} className={stat.iconColor} /></div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium text-tv-text-label uppercase tracking-wider mb-0.5 truncate">{stat.label}</p>
                <p className="text-[20px] lg:text-[22px] font-bold text-tv-text-primary leading-tight group-hover:text-tv-brand transition-colors font-display truncate">{stat.value}</p>
                <p className={`text-[11px] mt-0.5 ${stat.subColor} truncate`}>{stat.sub}</p>
              </div>
            </button>
          ))}
        </div>
        <div className="border-l border-tv-border-light flex items-center px-3 lg:px-4 shrink-0">
          <button onClick={onOpenSettings} title="Customize metrics" className="w-10 h-10 rounded-full bg-tv-surface border border-tv-border-light flex items-center justify-center text-tv-text-secondary hover:bg-tv-brand-tint hover:border-tv-border-strong hover:text-tv-brand transition-all group">
            <Settings size={15} className="group-hover:rotate-45 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────

export function Dashboard() {
  const navigate = useNavigate();
  const [selectedMetricIds, setSelectedMetricIds] = useState<string[]>(DEFAULT_METRIC_IDS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Progressive disclosure — collapsible dashboard sections
  const [chartCollapsed, setChartCollapsed] = useState(false);
  const [topCampaignsCollapsed, setTopCampaignsCollapsed] = useState(true);

  const handleToggleMetric = (id: string) => {
    setSelectedMetricIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id]);
  };

  return (
    <div className="p-3 sm:p-6 min-w-0 overflow-hidden">
      {/* Hero */}
      <div className="relative bg-tv-brand rounded-xl overflow-hidden mb-5 px-4 sm:px-8 py-5 sm:py-7">
        <div className="absolute right-16 top-[-32px] w-48 h-48 bg-white rounded-full opacity-10" />
        <div className="absolute right-24 top-8 w-32 h-32 bg-white rounded-full opacity-5" />
        <div className="absolute right-48 top-4 w-20 h-20 bg-white rounded-full opacity-[0.07]" />
        <h1 className="text-[24px] sm:text-[38px] font-black text-white leading-tight font-display">Welcome, Kelley!</h1>
        <p className="text-[13px] sm:text-[14px] text-white/90 mt-1">Today is Friday, February 20, 2026</p>
        <div className="flex flex-wrap items-center gap-2 sm:gap-6 mt-4">
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2"><Zap size={13} className="text-yellow-300" /><span className="text-[12px] text-white font-medium">3 campaigns active now</span></div>
          <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2"><TrendingUp size={13} className="text-white/90" aria-hidden="true" /><span className="text-[12px] text-white font-medium">18 new video opens today</span></div>
        </div>
      </div>

      {/* Key Stats Bar */}
      <div className="mb-5">
        <KeyStatsBar selectedIds={selectedMetricIds} onOpenSettings={() => setSettingsOpen(true)} />
      </div>

      {/* Two-column layout — stacks on mobile */}
      <div className="flex flex-col lg:flex-row gap-5 items-start mb-5">
        <div className="flex-1 min-w-0 flex flex-col gap-5 w-full">
          <CampaignsWidget navigate={navigate} />
          <PerformanceChart collapsed={chartCollapsed} onToggle={() => setChartCollapsed(c => !c)} />
        </div>
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-5">
          <QuickActionsWidget navigate={navigate} />
          <RecentActivityWidget navigate={navigate} />
        </div>
      </div>

      <MostSuccessfulCampaigns navigate={navigate} collapsed={topCampaignsCollapsed} onToggle={() => setTopCampaignsCollapsed(c => !c)} />

      {settingsOpen && (
        <MetricsSettingsPanel
          selectedIds={selectedMetricIds}
          onToggle={handleToggleMetric}
          onReset={() => setSelectedMetricIds([...DEFAULT_METRIC_IDS])}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}