import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
// FilterBar + SortableHeader refactor complete — shared components used across all tabs
import {
  Box, Text, Title, Button, ActionIcon, Avatar, Badge, Paper,
  Stack, Tabs, TextInput, Tooltip, SimpleGrid, Table,
  Select, Divider,
} from "@mantine/core";
import {
  ArrowLeft, Mail, Phone, Clock, Send, Edit2, Trash2, X, Check,
  Eye, Film, MousePointerClick, MessageSquare, Share2, Download,
  CircleCheckBig, CircleAlert, Play, ChevronRight, ChevronDown, Globe,
  Monitor, Smartphone, Tablet, Calendar, Tag, User, BarChart3,
  Video, Star, AlertTriangle, ShieldAlert, Ban, Hash, Briefcase,
  GraduationCap, Building2, UserCheck, Home, Plus, DollarSign,
  TrendingUp, ExternalLink, Zap, Heart, Search, Link2,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie } from "recharts";
import { TV } from "../theme";
import { useToast } from "../contexts/ToastContext";
import { DeleteModal } from "../components/ui/DeleteModal";
import { TagSelect, CONTACT_PRESET_TAGS } from "../components/TagSelect";
import { FilterBar } from "../components/FilterBar";
import type { FilterValues, FilterDef } from "../components/FilterBar";
import { SortableHeader, nextSort, sortRows } from "../components/SortableHeader";
import type { SortState } from "../components/SortableHeader";
import { TablePagination } from "../components/TablePagination";
import { FormSection } from "../components/ui/FormSection";
import { EditColumnsModal, ColumnsButton } from "../components/ColumnCustomizer";
import type { ColumnDef } from "../components/ColumnCustomizer";
import { Breadcrumbs } from "../components/Breadcrumbs";

// ── Giving History column definitions ─────────────────────────────────────────
const GIVING_ALL_COLUMNS: ColumnDef[] = [
  { key: "date",        label: "Date",        group: "Summary", required: true },
  { key: "amount",      label: "Amount",      group: "Summary" },
  { key: "designation", label: "Designation", group: "Summary" },
  { key: "type",        label: "Type",        group: "Summary" },
  { key: "channel",     label: "Channel",     group: "Details" },
  { key: "campaign",    label: "Campaign",    group: "Details" },
];
const GIVING_DEFAULT_COLUMNS = ["date", "amount", "designation", "type", "channel", "campaign"];

// ── Campaign History column definitions ───────────────────────────────────────
const CAMP_HIST_ALL_COLUMNS: ColumnDef[] = [
  { key: "campaign",  label: "Campaign",  group: "Summary", required: true },
  { key: "sender",    label: "Sender",    group: "Summary" },
  { key: "channel",   label: "Channel",   group: "Summary" },
  { key: "status",    label: "Status",    group: "Summary" },
  { key: "viewRate",  label: "View %",    group: "Engagement" },
  { key: "watchPct",  label: "Watch %",   group: "Engagement" },
  { key: "score",     label: "Score",     group: "Engagement" },
  { key: "sentAt",    label: "Sent",      group: "Summary" },
];
const CAMP_HIST_DEFAULT_COLUMNS = ["campaign", "sender", "channel", "status", "viewRate", "watchPct", "score", "sentAt"];

// ── Shared mock data ──────────────────────────────────────────────────────────

interface Contact {
  id: number; first: string; last: string; email: string;
  phone: string; tags: string[]; lastCampaign: string;
  dateAdded: string; avatar: string; color: string;
  city?: string; state?: string; age?: string;
  givingLevel?: string; totalGiving?: string; affiliation?: string;
  remoteId?: string; company?: string; title?: string;
  assignee?: string;
  addressLine1?: string; addressLine2?: string; zip?: string;
  donorStatus?: "major" | "active" | "first-time" | "lapsed" | "prospective";
  emailStatus?: "valid" | "bounced" | "unsubscribed" | "spam" | "missing";
  phoneStatus?: "valid" | "bounced" | "unsubscribed" | "missing";
  starRating?: number;
  ctScore?: number;
  videoScore?: number;
  customFields?: Record<string, string>;
  ccAddresses?: string[];
  bccAddresses?: string[];
}

const CONTACTS: Contact[] = [
  { id: 1, first: "James",  last: "Whitfield", email: "j.whitfield@alumni.edu", phone: "(617) 555-0182", tags: ["Major Donor", "Alumni"], lastCampaign: "Spring Annual Fund Appeal", dateAdded: "Jan 12, 2024", avatar: "JW", color: TV.brand, city: "Boston", state: "MA", age: "35-44", givingLevel: "Leadership Circle", totalGiving: "$24,800", affiliation: "Class of 2012", remoteId: "D-10482", company: "Whitfield Consulting", title: "Managing Partner", assignee: "Kelley Molt", addressLine1: "142 Beacon St", addressLine2: "Suite 300", zip: "02116", donorStatus: "major", emailStatus: "valid", phoneStatus: "valid", starRating: 5, ctScore: 92, videoScore: 88, customFields: { "Preferred Name": "Jim", "Spouse Name": "Laura Whitfield", "Graduation Year": "2012", "Degree": "MBA" }, ccAddresses: ["assistant@hartwell.edu"], bccAddresses: ["giving-records@hartwell.edu"] },
  { id: 2, first: "Sarah",  last: "Chen",      email: "s.chen@foundation.org",  phone: "(617) 555-0244", tags: ["Foundation"],            lastCampaign: "Board Member Appreciation",    dateAdded: "Mar 5, 2023",  avatar: "SC", color: TV.info, city: "San Francisco", state: "CA", age: "45-54", givingLevel: "Benefactor", totalGiving: "$42,500", affiliation: "Parent", remoteId: "D-22815", company: "Chen Family Foundation", title: "Executive Director", assignee: "James Okafor", addressLine1: "88 Pacific Ave", addressLine2: "", zip: "94111", donorStatus: "active", emailStatus: "valid", phoneStatus: "valid", starRating: 4, ctScore: 78, videoScore: 65, customFields: { "Preferred Name": "Sarah", "Spouse Name": "Michael Chen", "Interest Area": "Scholarships" } },
  { id: 3, first: "Marcus", last: "Reid",       email: "m.reid@email.com",       phone: "(617) 555-0371", tags: ["Alumni"],                lastCampaign: "Welcome Message – Class of 2026", dateAdded: "Aug 22, 2025", avatar: "MR", color: TV.success, city: "Chicago", state: "IL", age: "18-24", givingLevel: "New Donor", totalGiving: "$50", affiliation: "Class of 2026", remoteId: "12345ABCD", company: "—", title: "Student", assignee: "Michelle Park", addressLine1: "2201 S Michigan Ave", addressLine2: "Apt 4B", zip: "60616", donorStatus: "first-time", emailStatus: "valid", phoneStatus: "valid", starRating: 2, ctScore: 30, videoScore: 22, customFields: { "Graduation Year": "2026", "Degree": "B.A. Computer Science" } },
  { id: 4, first: "Emily",  last: "Torres",     email: "e.torres@corp.com",      phone: "(617) 555-0198", tags: ["Board Member"],          lastCampaign: "Spring Annual Fund Appeal",    dateAdded: "Feb 1, 2025",  avatar: "ET", color: TV.warning, city: "New York", state: "NY", age: "25-34", givingLevel: "Annual Supporter", totalGiving: "$3,200", affiliation: "Board Member", remoteId: "—", company: "Torres Capital Group", title: "VP of Development", assignee: "Kelley Molt", addressLine1: "350 5th Ave", addressLine2: "Floor 24", zip: "10118", donorStatus: "active", emailStatus: "bounced", phoneStatus: "bounced", starRating: 4, ctScore: 82, videoScore: 71, customFields: { "Board Term": "2024-2027", "Committee": "Finance" } },
  { id: 5, first: "David",  last: "Park",       email: "d.park@alumni.edu",      phone: "(617) 555-0429", tags: ["Alumni", "Lapsed"],       lastCampaign: "Matching Gift Challenge",      dateAdded: "May 14, 2022", avatar: "DP", color: TV.danger, city: "Austin", state: "TX", age: "55-64", givingLevel: "Lapsed", totalGiving: "$8,400", affiliation: "Class of 1992", remoteId: "D-05891", company: "Park Industries", title: "Retired", assignee: "—", addressLine1: "1100 Congress Ave", addressLine2: "", zip: "78701", donorStatus: "lapsed", emailStatus: "unsubscribed", phoneStatus: "unsubscribed", starRating: 3, ctScore: 47, videoScore: 35, customFields: { "Preferred Name": "Dave", "Graduation Year": "1992", "Degree": "B.S. Engineering" } },
  { id: 6, first: "Aisha",  last: "Johnson",    email: "a.johnson@gmail.com",    phone: "(617) 555-0512", tags: ["Prospective"],           lastCampaign: "—",                           dateAdded: "Feb 10, 2026", avatar: "AJ", color: "#8b5cf6", city: "Unknown", state: "—", age: "18-24", givingLevel: "Prospective", totalGiving: "$0", affiliation: "Prospective Student", remoteId: "—", company: "—", title: "—", assignee: "—", addressLine1: "", addressLine2: "", zip: "", donorStatus: "prospective", emailStatus: "valid", phoneStatus: "valid", starRating: 0, ctScore: 0, videoScore: 0, customFields: {} },
  { id: 7, first: "Robert", last: "Kim",        email: "r.kim@hartwell.edu",     phone: "(617) 555-0633", tags: ["Staff"],                 lastCampaign: "Board Member Appreciation",   dateAdded: "Jul 7, 2021",  avatar: "RK", color: "#0891b2", city: "Boston", state: "MA", age: "35-44", givingLevel: "Staff Donor", totalGiving: "$1,800", affiliation: "Staff", remoteId: "S-00412", company: "Hartwell University", title: "Dir. of Annual Giving", assignee: "Kelley Molt", addressLine1: "200 Hartwell Way", addressLine2: "Harris Hall Rm 210", zip: "02215", donorStatus: "active", emailStatus: "spam", phoneStatus: "valid", starRating: 1, ctScore: 15, videoScore: 8, customFields: { "Department": "Advancement", "Start Date": "2018" } },
  { id: 8, first: "Linda",  last: "Osei",       email: "l.osei@alumni.edu",      phone: "(617) 555-0744", tags: ["Alumni", "Major Donor"],  lastCampaign: "Spring Annual Fund Appeal",   dateAdded: "Nov 30, 2023", avatar: "LO", color: "#c026d3", city: "Atlanta", state: "GA", age: "45-54", givingLevel: "Leadership Circle", totalGiving: "$31,200", affiliation: "Class of 1998", remoteId: "D-14003", company: "Osei Legal Group", title: "Senior Partner", assignee: "James Okafor", addressLine1: "191 Peachtree St NE", addressLine2: "Suite 4600", zip: "30303", donorStatus: "major", emailStatus: "valid", phoneStatus: "valid", starRating: 5, ctScore: 95, videoScore: 91, customFields: { "Preferred Name": "Linda", "Spouse Name": "Samuel Osei", "Graduation Year": "1998", "Degree": "J.D." } },
  { id: 9, first: "Jordan", last: "Blake",      email: "j.blake@alumni.edu",     phone: "(617) 555-0855", tags: ["Alumni"],                 lastCampaign: "Student Video Testimonials",  dateAdded: "Sep 15, 2025", avatar: "JB", color: "#3b5998", city: "Denver", state: "CO", age: "18-24", givingLevel: "New Donor", totalGiving: "$75", affiliation: "Class of 2025", remoteId: "—", company: "—", title: "—", assignee: "Michelle Park", addressLine1: "1700 Lincoln St", addressLine2: "", zip: "80203", donorStatus: "first-time", emailStatus: "valid", phoneStatus: "missing", starRating: 3, ctScore: 54, videoScore: 55, customFields: { "Graduation Year": "2025", "Degree": "B.A. English" } },
];

// Send records per contact (by email)
interface SendRecord {
  id: number; campaign: string; sender: string; type: string; channel: string;
  status: string; sentAt: string; openedAt: string;
  viewRate: number; watchPct: number; replyRate: boolean; ctaClicked: boolean;
  shared: boolean; downloaded: boolean; watchTime: string; videoDuration: string;
  device: string; engagementScore: number; notes: string;
}

const ALL_SENDS: Record<string, SendRecord[]> = {
  "j.whitfield@alumni.edu": [
    { id: 1, campaign: "Spring Annual Fund Appeal", sender: "Kelley Molt", type: "Solicitation", channel: "Email", status: "Opened", sentAt: "Feb 14, 9:02 AM", openedAt: "Feb 14, 9:17 AM", viewRate: 94, watchPct: 87, replyRate: true, ctaClicked: true, shared: false, downloaded: false, watchTime: "1:02", videoDuration: "1:08", device: "Desktop", engagementScore: 92, notes: "Watched to completion, clicked CTA, replied with pledge." },
    { id: 10, campaign: "Matching Gift Challenge", sender: "Kelley Molt", type: "Solicitation", channel: "Email", status: "Replied", sentAt: "Dec 5, 9:00 AM", openedAt: "Dec 5, 10:14 AM", viewRate: 100, watchPct: 100, replyRate: true, ctaClicked: true, shared: true, downloaded: false, watchTime: "1:08", videoDuration: "1:08", device: "Desktop", engagementScore: 100, notes: "Full watch, replied with matching gift info." },
    { id: 11, campaign: "Major Gift Cultivation – Q1", sender: "Kelley Molt", type: "Solicitation", channel: "SMS", status: "Opened", sentAt: "Jan 30, 10:00 AM", openedAt: "Jan 30, 11:05 AM", viewRate: 80, watchPct: 72, replyRate: true, ctaClicked: true, shared: false, downloaded: false, watchTime: "0:49", videoDuration: "1:08", device: "Mobile", engagementScore: 85, notes: "Watched most, replied confirming pledge increase." },
  ],
  "s.chen@foundation.org": [
    { id: 2, campaign: "Spring Annual Fund Appeal", sender: "Kelley Molt", type: "Solicitation", channel: "Email", status: "Replied", sentAt: "Feb 14, 9:02 AM", openedAt: "Feb 14, 11:34 AM", viewRate: 100, watchPct: 100, replyRate: true, ctaClicked: true, shared: true, downloaded: false, watchTime: "1:08", videoDuration: "1:08", device: "Mobile", engagementScore: 100, notes: "Full watch, replied with $1,200 pledge. High-value." },
    { id: 12, campaign: "Board Member Appreciation", sender: "James Okafor", type: "Thank You", channel: "Email", status: "Opened", sentAt: "Jan 20, 9:00 AM", openedAt: "Jan 20, 9:45 AM", viewRate: 88, watchPct: 80, replyRate: false, ctaClicked: true, shared: false, downloaded: true, watchTime: "0:55", videoDuration: "1:08", device: "Desktop", engagementScore: 78, notes: "Good engagement, downloaded video." },
  ],
  "m.reid@email.com": [
    { id: 3, campaign: "Welcome Message – Class of 2026", sender: "Michelle Park", type: "Update", channel: "Email", status: "Watched", sentAt: "Feb 10, 2:00 PM", openedAt: "Feb 10, 4:52 PM", viewRate: 78, watchPct: 62, replyRate: false, ctaClicked: false, shared: false, downloaded: false, watchTime: "0:43", videoDuration: "1:08", device: "Tablet", engagementScore: 58, notes: "Watched majority of video but did not click CTA or reply." },
  ],
  "e.torres@corp.com": [
    { id: 4, campaign: "Spring Annual Fund Appeal", sender: "Kelley Molt", type: "Solicitation", channel: "Email", status: "Opened", sentAt: "Feb 14, 9:02 AM", openedAt: "Feb 15, 8:01 AM", viewRate: 55, watchPct: 38, replyRate: false, ctaClicked: true, shared: false, downloaded: true, watchTime: "0:26", videoDuration: "1:08", device: "Desktop", engagementScore: 45, notes: "Clicked CTA but dropped off early in video." },
  ],
  "d.park@alumni.edu": [
    { id: 5, campaign: "Board Outreach", sender: "James Okafor", type: "Thank You", channel: "Email", status: "Replied", sentAt: "Feb 12, 10:15 AM", openedAt: "Feb 12, 10:22 AM", viewRate: 100, watchPct: 100, replyRate: true, ctaClicked: true, shared: true, downloaded: true, watchTime: "1:08", videoDuration: "1:08", device: "Mobile", engagementScore: 100, notes: "Immediate open, full watch, replied within 7 minutes." },
    { id: 13, campaign: "Matching Gift Challenge", sender: "Kelley Molt", type: "Solicitation", channel: "Email", status: "Opened", sentAt: "Dec 5, 9:00 AM", openedAt: "Dec 6, 7:30 AM", viewRate: 60, watchPct: 45, replyRate: false, ctaClicked: false, shared: false, downloaded: false, watchTime: "0:31", videoDuration: "1:08", device: "Desktop", engagementScore: 35, notes: "Opened next day, partial watch." },
  ],
  "a.johnson@gmail.com": [
    { id: 6, campaign: "Welcome Message – Class of 2026", sender: "Michelle Park", type: "Update", channel: "Email", status: "Not opened", sentAt: "Feb 10, 2:00 PM", openedAt: "—", viewRate: 0, watchPct: 0, replyRate: false, ctaClicked: false, shared: false, downloaded: false, watchTime: "0:00", videoDuration: "1:08", device: "Unknown", engagementScore: 0, notes: "Delivered successfully but not yet opened." },
  ],
  "l.osei@alumni.edu": [
    { id: 7, campaign: "Major Gift Cultivation – Q1", sender: "Kelley Molt", type: "Solicitation", channel: "SMS", status: "Replied", sentAt: "Jan 30, 8:00 AM", openedAt: "Jan 30, 8:12 AM", viewRate: 100, watchPct: 95, replyRate: true, ctaClicked: true, shared: false, downloaded: false, watchTime: "1:05", videoDuration: "1:08", device: "Mobile", engagementScore: 95, notes: "Opened via SMS link, near-full watch, replied with increase pledge." },
    { id: 14, campaign: "Spring Annual Fund Appeal", sender: "Kelley Molt", type: "Solicitation", channel: "Email", status: "Replied", sentAt: "Feb 14, 9:03 AM", openedAt: "Feb 14, 10:20 AM", viewRate: 100, watchPct: 100, replyRate: true, ctaClicked: true, shared: true, downloaded: false, watchTime: "1:08", videoDuration: "1:08", device: "Desktop", engagementScore: 100, notes: "Full watch, replied immediately, shared with spouse." },
  ],
  "j.blake@alumni.edu": [
    { id: 8, campaign: "Student Video Testimonials", sender: "Michelle Park", type: "Video Request", channel: "Shareable Link", status: "Opened", sentAt: "Feb 3, 12:00 PM", openedAt: "Feb 3, 3:20 PM", viewRate: 40, watchPct: 30, replyRate: false, ctaClicked: false, shared: true, downloaded: false, watchTime: "0:20", videoDuration: "1:08", device: "Mobile", engagementScore: 32, notes: "Opened via shareable link, partial watch, shared but didn't submit." },
  ],
  "r.kim@hartwell.edu": [
    { id: 15, campaign: "Board Member Appreciation", sender: "James Okafor", type: "Thank You", channel: "Email", status: "Opened", sentAt: "Jan 20, 9:00 AM", openedAt: "Jan 20, 2:10 PM", viewRate: 72, watchPct: 58, replyRate: false, ctaClicked: false, shared: false, downloaded: false, watchTime: "0:40", videoDuration: "1:08", device: "Desktop", engagementScore: 48, notes: "Opened in the afternoon, watched over half." },
  ],
};

// ── ThankView landing-page interaction data ───────────────────────────────────
interface TVInteraction {
  campaign: string; landingPageViews: number; videoPlaysOnPage: number;
  avgTimeOnPage: string; ctaClicksOnPage: number; socialShares: number;
}
const ALL_TV_INTERACTIONS: Record<string, TVInteraction[]> = {
  "j.whitfield@alumni.edu": [
    { campaign: "Spring Annual Fund Appeal", landingPageViews: 3, videoPlaysOnPage: 2, avgTimeOnPage: "1:42", ctaClicksOnPage: 2, socialShares: 0 },
    { campaign: "Matching Gift Challenge", landingPageViews: 2, videoPlaysOnPage: 2, avgTimeOnPage: "2:05", ctaClicksOnPage: 1, socialShares: 1 },
    { campaign: "Major Gift Cultivation – Q1", landingPageViews: 1, videoPlaysOnPage: 1, avgTimeOnPage: "0:58", ctaClicksOnPage: 1, socialShares: 0 },
  ],
  "s.chen@foundation.org": [
    { campaign: "Spring Annual Fund Appeal", landingPageViews: 2, videoPlaysOnPage: 2, avgTimeOnPage: "1:55", ctaClicksOnPage: 1, socialShares: 1 },
    { campaign: "Board Member Appreciation", landingPageViews: 1, videoPlaysOnPage: 1, avgTimeOnPage: "1:20", ctaClicksOnPage: 1, socialShares: 0 },
  ],
  "m.reid@email.com": [
    { campaign: "Welcome Message – Class of 2026", landingPageViews: 1, videoPlaysOnPage: 1, avgTimeOnPage: "0:45", ctaClicksOnPage: 0, socialShares: 0 },
  ],
  "e.torres@corp.com": [
    { campaign: "Spring Annual Fund Appeal", landingPageViews: 2, videoPlaysOnPage: 1, avgTimeOnPage: "0:38", ctaClicksOnPage: 1, socialShares: 0 },
  ],
  "d.park@alumni.edu": [
    { campaign: "Board Outreach", landingPageViews: 2, videoPlaysOnPage: 2, avgTimeOnPage: "1:32", ctaClicksOnPage: 1, socialShares: 1 },
  ],
  "l.osei@alumni.edu": [
    { campaign: "Major Gift Cultivation – Q1", landingPageViews: 2, videoPlaysOnPage: 2, avgTimeOnPage: "1:48", ctaClicksOnPage: 2, socialShares: 0 },
    { campaign: "Spring Annual Fund Appeal", landingPageViews: 3, videoPlaysOnPage: 3, avgTimeOnPage: "2:10", ctaClicksOnPage: 2, socialShares: 1 },
  ],
  "j.blake@alumni.edu": [
    { campaign: "Student Video Testimonials", landingPageViews: 1, videoPlaysOnPage: 0, avgTimeOnPage: "0:22", ctaClicksOnPage: 0, socialShares: 1 },
  ],
  "r.kim@hartwell.edu": [
    { campaign: "Board Member Appreciation", landingPageViews: 1, videoPlaysOnPage: 1, avgTimeOnPage: "0:50", ctaClicksOnPage: 0, socialShares: 0 },
  ],
};

// ── Giving event data ─────────────────────────────────────────────────────────
interface GivingEvent {
  date: string; amount: string; amountNum: number; campaign: string;
  type: "online" | "pledge" | "matching" | "recurring" | "event";
  channel: string; attributed: boolean; designation: string;
}
const ALL_GIVING_EVENTS: Record<string, GivingEvent[]> = {
  "j.whitfield@alumni.edu": [
    { date: "Feb 16, 2026", amount: "$5,000", amountNum: 5000, campaign: "Spring Annual Fund Appeal", type: "online", channel: "Email CTA", attributed: true, designation: "Annual Fund" },
    { date: "Dec 10, 2025", amount: "$10,000", amountNum: 10000, campaign: "Matching Gift Challenge", type: "matching", channel: "Email CTA", attributed: true, designation: "Scholarship Fund" },
    { date: "Feb 2, 2026", amount: "$5,000", amountNum: 5000, campaign: "Major Gift Cultivation – Q1", type: "pledge", channel: "SMS Reply", attributed: true, designation: "Capital Campaign" },
    { date: "Jun 15, 2024", amount: "$4,800", amountNum: 4800, campaign: "—", type: "recurring", channel: "Auto-Draft", attributed: false, designation: "Annual Fund" },
    { date: "Mar 22, 2024", amount: "$2,500", amountNum: 2500, campaign: "—", type: "online", channel: "Website", attributed: false, designation: "Library Renovation" },
    { date: "Dec 31, 2023", amount: "$5,000", amountNum: 5000, campaign: "—", type: "online", channel: "Year-End Appeal", attributed: false, designation: "Annual Fund" },
    { date: "Jun 10, 2023", amount: "$3,000", amountNum: 3000, campaign: "—", type: "recurring", channel: "Auto-Draft", attributed: false, designation: "Scholarship Fund" },
  ],
  "s.chen@foundation.org": [
    { date: "Feb 20, 2026", amount: "$15,000", amountNum: 15000, campaign: "Spring Annual Fund Appeal", type: "online", channel: "Landing Page", attributed: true, designation: "Scholarship Fund" },
    { date: "Jan 22, 2026", amount: "$5,000", amountNum: 5000, campaign: "Board Member Appreciation", type: "online", channel: "Email CTA", attributed: true, designation: "Annual Fund" },
    { date: "Sep 1, 2025", amount: "$22,500", amountNum: 22500, campaign: "—", type: "recurring", channel: "Auto-Draft", attributed: false, designation: "Endowment" },
    { date: "Mar 15, 2025", amount: "$10,000", amountNum: 10000, campaign: "—", type: "online", channel: "Website", attributed: false, designation: "Scholarship Fund" },
    { date: "Sep 1, 2024", amount: "$20,000", amountNum: 20000, campaign: "—", type: "recurring", channel: "Auto-Draft", attributed: false, designation: "Endowment" },
  ],
  "m.reid@email.com": [
    { date: "Feb 12, 2026", amount: "$50", amountNum: 50, campaign: "Welcome Message – Class of 2026", type: "online", channel: "Landing Page", attributed: true, designation: "Student Activities" },
  ],
  "e.torres@corp.com": [
    { date: "Feb 18, 2026", amount: "$1,200", amountNum: 1200, campaign: "Spring Annual Fund Appeal", type: "online", channel: "Email CTA", attributed: true, designation: "Annual Fund" },
    { date: "Nov 1, 2025", amount: "$2,000", amountNum: 2000, campaign: "—", type: "event", channel: "Gala", attributed: false, designation: "Capital Campaign" },
    { date: "Apr 10, 2025", amount: "$1,000", amountNum: 1000, campaign: "—", type: "online", channel: "Website", attributed: false, designation: "Annual Fund" },
  ],
  "d.park@alumni.edu": [
    { date: "Feb 13, 2026", amount: "$500", amountNum: 500, campaign: "Board Outreach", type: "online", channel: "Landing Page", attributed: true, designation: "Annual Fund" },
    { date: "Mar 1, 2023", amount: "$7,900", amountNum: 7900, campaign: "—", type: "recurring", channel: "Auto-Draft (ended)", attributed: false, designation: "Engineering Fund" },
    { date: "Dec 20, 2022", amount: "$2,500", amountNum: 2500, campaign: "—", type: "online", channel: "Year-End Appeal", attributed: false, designation: "Annual Fund" },
    { date: "Jun 5, 2022", amount: "$1,500", amountNum: 1500, campaign: "—", type: "online", channel: "Website", attributed: false, designation: "Engineering Fund" },
  ],
  "l.osei@alumni.edu": [
    { date: "Feb 15, 2026", amount: "$10,000", amountNum: 10000, campaign: "Spring Annual Fund Appeal", type: "online", channel: "Email CTA", attributed: true, designation: "Law School Fund" },
    { date: "Feb 1, 2026", amount: "$8,000", amountNum: 8000, campaign: "Major Gift Cultivation – Q1", type: "pledge", channel: "SMS Reply", attributed: true, designation: "Scholarship Fund" },
    { date: "Oct 15, 2025", amount: "$13,200", amountNum: 13200, campaign: "—", type: "recurring", channel: "Auto-Draft", attributed: false, designation: "Endowment" },
    { date: "Apr 20, 2025", amount: "$5,000", amountNum: 5000, campaign: "—", type: "online", channel: "Website", attributed: false, designation: "Law School Fund" },
    { date: "Oct 15, 2024", amount: "$12,000", amountNum: 12000, campaign: "—", type: "recurring", channel: "Auto-Draft", attributed: false, designation: "Endowment" },
  ],
};

const GIVING_TYPE_LABEL: Record<string, { label: string; color: string }> = {
  online: { label: "Online Gift", color: "tvPurple" },
  pledge: { label: "Pledge", color: "tvPurple" },
  matching: { label: "Matching Gift", color: "tvPurple" },
  recurring: { label: "Recurring", color: "tvPurple" },
  event: { label: "Event", color: "tvPurple" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function avgEngagement(sends: SendRecord[]): number {
  if (!sends.length) return 0;
  return Math.round(sends.reduce((s, r) => s + r.engagementScore, 0) / sends.length);
}

const CHANNEL_ICON: Record<string, typeof Mail> = { Email: Mail, SMS: MessageSquare, "Shareable Link": Link2 };
const DEVICE_ICON: Record<string, typeof Monitor> = { Desktop: Monitor, Mobile: Smartphone, Tablet: Tablet };

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  Replied:     { bg: TV.successBg, text: TV.success },
  Opened:      { bg: TV.brandTint, text: TV.brand },
  Watched:     { bg: TV.infoBg, text: TV.info },
  "Not opened": { bg: TV.surfaceMuted, text: TV.textSecondary },
  Delivered:   { bg: TV.infoBg, text: TV.info },
};

// ── FilterBar definitions for Campaign History tab ────────────────────────────
const CAMPAIGN_HISTORY_FILTERS: FilterDef[] = [
  { key: "campStatus", label: "Status", icon: Check, group: "Campaign", type: "multi-select", essential: true,
    options: [
      { value: "Replied", label: "Replied", color: "green" },
      { value: "Opened", label: "Opened" },
      { value: "Watched", label: "Watched" },
      { value: "Not opened", label: "Not opened", color: "red" },
      { value: "Delivered", label: "Delivered" },
    ] },
  { key: "campType", label: "Type", icon: Tag, group: "Campaign", type: "multi-select", essential: true,
    options: [
      { value: "Solicitation", label: "Solicitation" },
      { value: "Stewardship", label: "Stewardship" },
      { value: "Thank You", label: "Thank You" },
      { value: "Event Invite", label: "Event Invite" },
      { value: "Re-engagement", label: "Re-engagement" },
    ] },
  { key: "campChannel", label: "Channel", icon: Globe, group: "Campaign", type: "multi-select", essential: true,
    options: [
      { value: "Email", label: "Email" },
      { value: "SMS", label: "SMS" },
      { value: "Shareable Link", label: "Shareable Link" },
    ] },
];

// ── FilterBar definitions for Activity Timeline ───────────────────────────────
const ACTIVITY_TIMELINE_FILTERS: FilterDef[] = [
  { key: "activityType", label: "Event Type", icon: Tag, group: "Activity", type: "multi-select", essential: true,
    options: [
      { value: "email", label: "Email" },
      { value: "video", label: "Video" },
      { value: "sms", label: "SMS" },
      { value: "social", label: "Social" },
      { value: "thankview", label: "ThankView" },
      { value: "gift", label: "Gift" },
      { value: "reply", label: "Reply" },
      { value: "cta", label: "CTA Click" },
      { value: "share", label: "Share" },
      { value: "download", label: "Download" },
    ] },
  { key: "activityDate", label: "Date", icon: Calendar, group: "Activity", type: "date",
    options: [], essential: true },
];

function DashCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <Paper withBorder className={className}>{children}</Paper>;
}

// ── Giving History Panel ────────────────────────────────────────────────────

const DESIGNATION_COLORS = [TV.brand, TV.info, TV.success, TV.warning, TV.danger, "#8b5cf6", "#0891b2", "#c026d3"];

function GivingHistoryPanel({ givingEvents, contactName }: { givingEvents: GivingEvent[]; contactName: string }) {
  const [givSort, setGivSort] = useState<SortState>({ key: "date", dir: "desc" });
  const handleGivSort = (key: string) => setGivSort(s => nextSort(s, key));
  const [givFilterValues, setGivFilterValues] = useState<FilterValues>({});
  const [givActiveFilterKeys, setGivActiveFilterKeys] = useState<string[]>(["givDesignation", "givType"]);
  const [givPage, setGivPage] = useState(1);
  const [givRowsPerPage, setGivRowsPerPage] = useState(10);
  const [givActiveCols, setGivActiveCols] = useState<string[]>(GIVING_DEFAULT_COLUMNS);
  const [showGivEditCols, setShowGivEditCols] = useState(false);

  // ── Computed data ──
  const totalGiving = givingEvents.reduce((s, g) => s + g.amountNum, 0);
  const attributedTotal = givingEvents.filter(g => g.attributed).reduce((s, g) => s + g.amountNum, 0);
  const avgGift = givingEvents.length ? Math.round(totalGiving / givingEvents.length) : 0;
  const largestGift = givingEvents.length ? Math.max(...givingEvents.map(g => g.amountNum)) : 0;
  const attributedPct = totalGiving > 0 ? Math.round((attributedTotal / totalGiving) * 100) : 0;

  // Designation breakdown
  const designationMap = new Map<string, number>();
  givingEvents.forEach(g => designationMap.set(g.designation, (designationMap.get(g.designation) ?? 0) + g.amountNum));
  const designations = Array.from(designationMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  // Type breakdown
  const typeMap = new Map<string, number>();
  givingEvents.forEach(g => {
    const label = GIVING_TYPE_LABEL[g.type]?.label ?? g.type;
    typeMap.set(label, (typeMap.get(label) ?? 0) + g.amountNum);
  });
  const typeBreakdown = Array.from(typeMap.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);

  // Trend data — aggregate by quarter
  const parseDate = (d: string) => new Date(d);
  const quarterLabel = (dt: Date) => {
    const q = Math.floor(dt.getMonth() / 3) + 1;
    return `Q${q} ${dt.getFullYear()}`;
  };
  const trendMap = new Map<string, { total: number; attributed: number; sortKey: number }>();
  givingEvents.forEach(g => {
    const dt = parseDate(g.date);
    const lbl = quarterLabel(dt);
    const existing = trendMap.get(lbl) ?? { total: 0, attributed: 0, sortKey: dt.getFullYear() * 10 + Math.floor(dt.getMonth() / 3) };
    existing.total += g.amountNum;
    if (g.attributed) existing.attributed += g.amountNum;
    trendMap.set(lbl, existing);
  });
  const trendData = Array.from(trendMap.entries())
    .map(([quarter, v]) => ({ quarter, total: v.total, attributed: v.attributed, sortKey: v.sortKey }))
    .sort((a, b) => a.sortKey - b.sortKey);

  // Pie data for designations (embed fill for recharts to avoid Cell key collisions)
  const pieData = designations.map((d, i) => ({ ...d, fill: DESIGNATION_COLORS[i % DESIGNATION_COLORS.length] }));

  // Bar data with embedded fill
  const typeBarData = typeBreakdown.map((d, i) => ({ ...d, fill: DESIGNATION_COLORS[i % DESIGNATION_COLORS.length] }));

  // Dynamic filter definitions derived from data
  const givingFilterDefs: FilterDef[] = [
    { key: "givDesignation", label: "Designation", icon: Tag, group: "Giving", type: "multi-select", essential: true,
      options: designations.map(d => ({ value: d.name, label: d.name })) },
    { key: "givType", label: "Gift Type", icon: DollarSign, group: "Giving", type: "multi-select", essential: true,
      options: [...new Set(givingEvents.map(g => g.type))].map(t => ({ value: t, label: GIVING_TYPE_LABEL[t]?.label ?? t })) },
  ];

  // Filtered & sorted events
  const designationFilter = givFilterValues["givDesignation"] ?? [];
  const typeFilter = givFilterValues["givType"] ?? [];
  const filtered = givingEvents
    .filter(g => designationFilter.length === 0 || designationFilter.includes(g.designation))
    .filter(g => typeFilter.length === 0 || typeFilter.includes(g.type));
  const sorted = sortRows(filtered, givSort, (row, key) => {
    if (key === "date") return parseDate(row.date).getTime();
    if (key === "amount") return row.amountNum;
    if (key === "designation") return row.designation;
    return row.type;
  });

  // Reset to page 1 when filters change the result count
  const clampedGivPage = Math.max(1, Math.min(givPage, Math.ceil(filtered.length / givRowsPerPage) || 1));
  const givStart = (clampedGivPage - 1) * givRowsPerPage;
  const paginatedGifts = sorted.slice(givStart, givStart + givRowsPerPage);

  if (givingEvents.length === 0) {
    return (
      <DashCard className="p-10 text-center">
        <Box w={52} h={52} mx="auto" mb="md" bg={TV.surfaceMuted} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <DollarSign size={24} style={{ color: TV.textSecondary }} />
        </Box>
        <Text fz={15} fw={600} c={TV.textPrimary}>No giving history</Text>
        <Text fz={13} c={TV.textSecondary}>No gifts have been recorded for this constituent.</Text>
      </DashCard>
    );
  }

  return (
    <Stack gap="md">
      {/* ── Summary cards ── */}
      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        {[
          { label: "Total Giving", value: `$${totalGiving.toLocaleString()}`, icon: DollarSign, color: TV.success, bg: TV.successBg },
          { label: "TV Attributed", value: `$${attributedTotal.toLocaleString()}`, sub: `${attributedPct}% of total`, icon: Zap, color: TV.brand, bg: TV.brandTint },
          { label: "Average Gift", value: `$${avgGift.toLocaleString()}`, sub: `${givingEvents.length} gifts`, icon: TrendingUp, color: TV.info, bg: TV.infoBg },
          { label: "Largest Gift", value: `$${largestGift.toLocaleString()}`, icon: Star, color: TV.warning, bg: TV.warningBg },
        ].map(c => (
          <DashCard key={c.label} className="p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <Box w={32} h={32} bg={c.bg} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <c.icon size={15} style={{ color: c.color }} />
              </Box>
              <Text fz={10} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em">{c.label}</Text>
            </div>
            <Text fz={22} fw={900} c={TV.textPrimary} className="font-display">{c.value}</Text>
            {c.sub && <Text fz={11} c={TV.textSecondary} mt={2}>{c.sub}</Text>}
          </DashCard>
        ))}
      </SimpleGrid>

      {/* ── Giving Trend Over Time ── */}
      <DashCard className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={15} style={{ color: TV.brand }} />
          <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em">Giving Trend</Text>
        </div>
        <Text fz={12} c={TV.textSecondary} mb="lg">Quarterly giving totals with ThankView attribution</Text>
        <div style={{ minWidth: 0 }} role="img" aria-label="Area chart showing quarterly giving totals with ThankView attribution over time">
          <ResponsiveContainer width="100%" height={240} minWidth={0}>
            <AreaChart data={trendData} margin={{ top: 5, right: 10, left: 10, bottom: 0 }} id="giving-trend-area">
              <defs key="area-defs">
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TV.brand} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={TV.brand} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAttr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TV.success} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={TV.success} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid key="area-grid" strokeDasharray="3 3" stroke={TV.borderLight} />
              <XAxis key="area-xaxis" dataKey="quarter" tick={{ fontSize: 11, fill: TV.textSecondary }} tickLine={false} axisLine={{ stroke: TV.borderLight }} />
              <YAxis key="area-yaxis" tick={{ fontSize: 11, fill: TV.textSecondary }} tickLine={false} axisLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={50} />
              <RTooltip
                key="area-tooltip"
                contentStyle={{ fontSize: 12, borderRadius: 12, borderColor: TV.borderLight, boxShadow: TV.shadowTooltip }}
                formatter={(value: number, name: string) => [`$${value.toLocaleString()}`, name === "total" ? "Total" : "Attributed"]}
              />
              <Area key="area-total" type="monotone" dataKey="total" stroke={TV.brand} strokeWidth={2} fill="url(#gTotal)" name="total" />
              <Area key="area-attributed" type="monotone" dataKey="attributed" stroke={TV.success} strokeWidth={2} fill="url(#gAttr)" name="attributed" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-3 justify-center">
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: TV.brand }} /><Text fz={11} c={TV.textSecondary}>Total Giving</Text></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded-full" style={{ backgroundColor: TV.success }} /><Text fz={11} c={TV.textSecondary}>TV Attributed</Text></div>
        </div>
      </DashCard>

      {/* ── Designation Breakdown + Type Breakdown side by side ── */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Designation pie */}
        <DashCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tag size={14} style={{ color: TV.brand }} />
            <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em">By Designation</Text>
          </div>
          <div className="flex items-center gap-4">
            <div style={{ width: 130, height: 130, flexShrink: 0 }} role="img" aria-label="Pie chart showing giving breakdown by designation">
              <PieChart width={130} height={130} id="designation-pie">
                <Pie key="pie-desig" data={pieData} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={35} paddingAngle={2} strokeWidth={0} />
                <RTooltip
                  key="pie-tooltip"
                  contentStyle={{ fontSize: 11, borderRadius: 10, borderColor: TV.borderLight }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
              </PieChart>
            </div>
            <Stack gap={6} className="flex-1 min-w-0">
              {pieData.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                  <Text fz={12} c={TV.textPrimary} className="flex-1 min-w-0 truncate">{d.name}</Text>
                  <Text fz={12} fw={700} c={TV.textPrimary} className="font-display">${d.total.toLocaleString()}</Text>
                </div>
              ))}
            </Stack>
          </div>
        </DashCard>

        {/* Type bar chart */}
        <DashCard className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} style={{ color: TV.brand }} />
            <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em">By Gift Type</Text>
          </div>
          <div style={{ minWidth: 0 }} role="img" aria-label="Horizontal bar chart showing giving totals by gift type">
            <ResponsiveContainer width="100%" height={140} minWidth={0}>
              <BarChart data={typeBarData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }} id="gift-type-bar">
                <CartesianGrid key="bar-grid" strokeDasharray="3 3" stroke={TV.borderLight} horizontal={false} />
                <XAxis key="bar-xaxis" type="number" tick={{ fontSize: 10, fill: TV.textSecondary }} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                <YAxis key="bar-yaxis" type="category" dataKey="name" tick={{ fontSize: 11, fill: TV.textPrimary }} width={100} axisLine={false} tickLine={false} />
                <RTooltip
                  key="bar-tooltip"
                  contentStyle={{ fontSize: 11, borderRadius: 10, borderColor: TV.borderLight }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Bar key="bar-total" dataKey="total" radius={[0, 6, 6, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashCard>
      </SimpleGrid>

      {/* ── Attribution banner ── */}
      {attributedTotal > 0 && (
        <DashCard className="p-0 overflow-hidden">
          <Box bg={TV.successBg} px="lg" py="md" style={{ borderBottom: `1px solid ${TV.successBorder}` }}>
            <div className="flex items-center gap-3">
              <Box w={36} h={36} bg={TV.successBg} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Zap size={16} style={{ color: TV.success }} />
              </Box>
              <div>
                <Text fz={14} fw={700} c={TV.success}>
                  ${attributedTotal.toLocaleString()} attributed to ThankView campaigns
                </Text>
                <Text fz={12} c={TV.success}>
                  {attributedPct}% of {contactName}'s total giving · {givingEvents.filter(g => g.attributed).length} attributed gift{givingEvents.filter(g => g.attributed).length !== 1 ? "s" : ""} of {givingEvents.length} total
                </Text>
              </div>
            </div>
          </Box>
        </DashCard>
      )}

      {/* ── Detailed Gifts Table ── */}
      <DashCard className="p-0 overflow-hidden">
        <div className="px-5 py-3">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={15} style={{ color: TV.brand }} />
            <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em">All Gifts</Text>
            <Badge size="sm" variant="light" color="tvPurple" ml={4}>{filtered.length}</Badge>
            <div className="ml-auto"><ColumnsButton onClick={() => setShowGivEditCols(true)} /></div>
          </div>
          <FilterBar
            filters={givingFilterDefs}
            activeFilterKeys={givActiveFilterKeys}
            filterValues={givFilterValues}
            onFilterValuesChange={setGivFilterValues}
            onActiveFilterKeysChange={setGivActiveFilterKeys}
          />
        </div>

        {/* Desktop table */}
        <div className="hidden md:block max-h-[60vh] overflow-y-auto">
          <div className="sticky top-0 z-20 gap-3 px-5 py-3.5 bg-tv-surface-muted border-b border-tv-border-divider"
            style={{ display: "grid", gridTemplateColumns: givActiveCols.map(() => "1fr").join(" ") }}>
            {givActiveCols.map(colKey => {
              const col = GIVING_ALL_COLUMNS.find(c => c.key === colKey);
              if (!col) return null;
              const sortable = ["date", "amount", "designation", "type"].includes(colKey);
              return sortable ? (
                <SortableHeader key={colKey} label={col.label} sortKey={colKey} currentSort={givSort.key} currentDir={givSort.dir} onSort={handleGivSort} />
              ) : (
                <Text key={colKey} fz={11} fw={600} tt="uppercase" lts="0.04em" c={TV.textSecondary} className="whitespace-nowrap">{col.label}</Text>
              );
            })}
          </div>
          {paginatedGifts.map((g, i) => {
            const gType = GIVING_TYPE_LABEL[g.type] ?? { label: g.type, color: "gray" };
            return (
              <div key={i} className="gap-3 px-5 py-4 border-b border-tv-border-divider last:border-b-0 hover:bg-tv-surface-muted transition-colors items-center"
                style={{ display: "grid", gridTemplateColumns: givActiveCols.map(() => "1fr").join(" ") }}>
                {givActiveCols.map(colKey => (
                  <div key={colKey}>
                    {colKey === "date" ? <Text fz={13} c={TV.textSecondary}>{g.date}</Text> :
                     colKey === "amount" ? (
                      <div className="flex items-center gap-2">
                        <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{g.amount}</Text>
                        {g.attributed && <Badge size="xs" variant="light" color="green" leftSection={<Zap size={7} />}>TV</Badge>}
                      </div>
                     ) :
                     colKey === "designation" ? <Text fz={13} c={TV.textPrimary}>{g.designation}</Text> :
                     colKey === "type" ? <Badge size="sm" variant="light" color={gType.color}>{gType.label}</Badge> :
                     colKey === "channel" ? <Text fz={12} c={TV.textSecondary}>{g.channel}</Text> :
                     colKey === "campaign" ? <Text fz={12} c={g.campaign !== "—" ? TV.textBrand : TV.textSecondary} truncate>{g.campaign}</Text> :
                     <Text fz={12} c={TV.textSecondary}>—</Text>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden">
          {paginatedGifts.map((g, i) => {
            const gType = GIVING_TYPE_LABEL[g.type] ?? { label: g.type, color: "gray" };
            return (
              <div key={i} className="px-5 py-4 border-b border-tv-border-divider last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Text fz={16} fw={800} c={TV.textPrimary} className="font-display">{g.amount}</Text>
                    {g.attributed && <Badge size="xs" variant="light" color="green" leftSection={<Zap size={7} />}>TV</Badge>}
                  </div>
                  <Badge size="sm" variant="light" color={gType.color}>{gType.label}</Badge>
                </div>
                <Text fz={13} c={TV.textPrimary} mb={2}>{g.designation}</Text>
                <div className="flex items-center gap-2 flex-wrap">
                  <Text fz={11} c={TV.textSecondary}>{g.date}</Text>
                  <Text fz={11} c={TV.textSecondary}>·</Text>
                  <Text fz={11} c={TV.textSecondary}>{g.channel}</Text>
                  {g.campaign !== "—" && (
                    <>
                      <Text fz={11} c={TV.textSecondary}>·</Text>
                      <Text fz={11} c={TV.textBrand}>{g.campaign}</Text>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="p-10 text-center">
            <Text fz={13} c={TV.textSecondary}>No gifts match the current filters.</Text>
          </div>
        )}
        {filtered.length > 0 && (
          <TablePagination
            page={clampedGivPage}
            rowsPerPage={givRowsPerPage}
            totalRows={filtered.length}
            onPageChange={setGivPage}
            onRowsPerPageChange={setGivRowsPerPage}
          />
        )}
      </DashCard>

      {/* Edit Columns Modal */}
      {showGivEditCols && (
        <EditColumnsModal columns={GIVING_ALL_COLUMNS} active={givActiveCols} onClose={() => setShowGivEditCols(false)}
          onSave={setGivActiveCols} />
      )}
    </Stack>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ContactProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [searchParams] = useSearchParams();

  const contact = CONTACTS.find(c => String(c.id) === id);
  if (!contact) {
    return (
      <Box p="xl" className="flex flex-col items-center justify-center" style={{ minHeight: "60vh" }}>
        <Title order={1} mb="sm">Constituent not found</Title>
        <Text c={TV.textSecondary} mb="lg">This constituent doesn't exist or has been removed.</Text>
        <Button color="tvPurple" onClick={() => navigate("/contacts")}>Back to Constituents</Button>
      </Box>
    );
  }

  const sends = ALL_SENDS[contact.email] ?? [];
  const avg = avgEngagement(sends);
  const tvInteractions = ALL_TV_INTERACTIONS[contact.email] ?? [];
  const givingEvents = ALL_GIVING_EVENTS[contact.email] ?? [];
  const fromAnalytics = searchParams.get("from") === "analytics";
  const fromCampaign = searchParams.get("from")?.startsWith("campaign");

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(`${contact.first} ${contact.last}`);
  const [tags, setTags] = useState(contact.tags);
  const [editEmail, setEditEmail] = useState(contact.email);
  const [editPhone, setEditPhone] = useState(contact.phone);
  const [editCompany, setEditCompany] = useState(contact.company ?? "");
  const [editTitle, setEditTitle] = useState(contact.title ?? "");
  const [editRemoteId, setEditRemoteId] = useState(contact.remoteId ?? "");
  const [editAffiliation, setEditAffiliation] = useState(contact.affiliation ?? "");
  const [editAssignee, setEditAssignee] = useState(contact.assignee ?? "");
  const [editAddr1, setEditAddr1] = useState(contact.addressLine1 ?? "");
  const [editAddr2, setEditAddr2] = useState(contact.addressLine2 ?? "");
  const [editCity, setEditCity] = useState(contact.city ?? "");
  const [editState, setEditState] = useState(contact.state ?? "");
  const [editZip, setEditZip] = useState(contact.zip ?? "");
  const [editCustomFields, setEditCustomFields] = useState<Record<string, string>>({ ...(contact.customFields ?? {}) });
  const [newCfKey, setNewCfKey] = useState("");
  const [newCfValue, setNewCfValue] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<string | null>(searchParams.get("tab") ?? "overview");

  // Activity Timeline search & filters (using shared FilterBar)
  const [tlSearch, setTlSearch] = useState("");
  const [tlFilterValues, setTlFilterValues] = useState<FilterValues>({});
  const [tlActiveFilterKeys, setTlActiveFilterKeys] = useState<string[]>(["activityType", "activityDate"]);

  // Campaign History search, sort & filter (using shared FilterBar + SortableHeader)
  const [campSearch, setCampSearch] = useState("");
  const [campSort, setCampSort] = useState<SortState>({ key: "date", dir: "desc" });
  const handleCampSort = (key: string) => setCampSort(s => nextSort(s, key));
  const [campFilterValues, setCampFilterValues] = useState<FilterValues>({});
  const [campActiveFilterKeys, setCampActiveFilterKeys] = useState<string[]>(["campStatus", "campType", "campChannel"]);
  const [campPage, setCampPage] = useState(1);
  const [campRowsPerPage, setCampRowsPerPage] = useState(10);
  const [campHistActiveCols, setCampHistActiveCols] = useState<string[]>(CAMP_HIST_DEFAULT_COLUMNS);
  const [showCampHistEditCols, setShowCampHistEditCols] = useState(false);

  // Activity Timeline pagination
  const [tlPage, setTlPage] = useState(1);
  const [tlRowsPerPage, setTlRowsPerPage] = useState(10);

  // Progressive disclosure — collapsible sections on Overview tab
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    contactInfo: false,
    extendedDetails: false,
    scores: false,
    deliveryStatus: true,
    customFields: false,
    engagementSummary: true,
  });
  const toggleSection = (key: string) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const resetEditFields = () => {
    setName(`${contact.first} ${contact.last}`);
    setTags(contact.tags);
    setEditEmail(contact.email);
    setEditPhone(contact.phone);
    setEditCompany(contact.company ?? "");
    setEditTitle(contact.title ?? "");
    setEditRemoteId(contact.remoteId ?? "");
    setEditAffiliation(contact.affiliation ?? "");
    setEditAssignee(contact.assignee ?? "");
    setEditAddr1(contact.addressLine1 ?? "");
    setEditAddr2(contact.addressLine2 ?? "");
    setEditCity(contact.city ?? "");
    setEditState(contact.state ?? "");
    setEditZip(contact.zip ?? "");
    setEditCustomFields({ ...(contact.customFields ?? {}) });
    setNewCfKey("");
    setNewCfValue("");
  };

  const handleBack = () => {
    if (fromAnalytics) navigate("/analytics?tab=sends");
    else if (fromCampaign) navigate(-1);
    else navigate("/contacts");
  };

  return (
    <Box p={{ base: "sm", xl: "xl" }} pt={0} style={{ minHeight: "100%" }}>
      {/* ── Back button + Header ── */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 xl:pt-6 pb-3 -mx-3 xl:-mx-6 px-3 xl:px-6 flex items-center gap-3 mb-2">
        <Breadcrumbs items={[
          { label: "Constituents", onClick: handleBack },
          { label: `${contact.first} ${contact.last}` },
        ]} />
      </div>

      {/* ── Hero card ── */}
      <DashCard className="p-6 sm:p-8 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-5">
          <div className="flex items-center gap-8 flex-nowrap">
            <Avatar size={84} radius="xl"
              styles={{ placeholder: { backgroundColor: contact.color, color: "white", fontSize: 26, fontWeight: 800 } }}>
              {contact.avatar}
            </Avatar>
            <div>
              {editing ? (
                <TextInput value={name} onChange={e => setName(e.currentTarget.value)} variant="unstyled"
                  styles={{ input: { fontWeight: 900, fontSize: 26, color: TV.textPrimary, borderBottom: `2px solid ${TV.textBrand}`, borderRadius: 0, padding: 0, lineHeight: 1.3 } }} />
              ) : (
                <Title order={1} fz={{ base: 24, sm: 28 }} c={TV.textPrimary}>{contact.first} {contact.last}</Title>
              )}
              <Text fz={15} c={TV.textLabel} mt={6}>{contact.email}</Text>
              <div className="flex items-center gap-2 mt-2.5">
                {tags.map(t => <Badge key={t} color="tvPurple" size="md" radius="xl">{t}</Badge>)}
                {contact.affiliation && <Badge variant="light" color="gray" size="md" radius="xl">{contact.affiliation}</Badge>}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            {editing ? (
              <>
                <Button variant="outline" color="red" size="sm" leftSection={<X size={14} />} onClick={() => { setEditing(false); resetEditFields(); }}>
                  Cancel
                </Button>
                <Button color="tvPurple" size="sm" leftSection={<Check size={14} />}
                  onClick={() => { setEditing(false); show("Constituent updated!", "success"); }}>
                  Save
                </Button>
              </>
            ) : (
              <>
                <Tooltip label="Edit constituent" withArrow>
                  <ActionIcon variant="default" radius="xl" size={38} onClick={() => setEditing(true)}
                    styles={{ root: { borderColor: TV.borderLight, color: TV.textLabel } }} aria-label="Edit constituent">
                    <Edit2 size={15} aria-hidden="true" />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Delete constituent" withArrow>
                  <ActionIcon variant="default" radius="xl" size={38} onClick={() => setShowDelete(true)}
                    styles={{ root: { borderColor: TV.dangerBorder, color: TV.danger } }} aria-label="Delete constituent">
                    <Trash2 size={15} aria-hidden="true" />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* Quick stats row */}
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md" mt="xl">
          {[
            { label: "Campaigns Received", value: sends.length, icon: Send, color: TV.brand, numeric: true },
            { label: "Avg. Engagement", value: `${avg}%`, icon: BarChart3, color: avg >= 70 ? TV.success : avg >= 40 ? TV.warning : TV.danger, numeric: true },
            { label: "Total Giving", value: contact.totalGiving ?? "—", icon: CircleCheckBig, color: TV.info, numeric: true },
            { label: "Giving Level", value: contact.givingLevel ?? "—", icon: Tag, color: TV.brand, numeric: false },
          ].map(s => (
            <Box key={s.label} bg={TV.surface} p="md" style={{ borderRadius: 12 }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <s.icon size={16} style={{ color: s.color }} />
                <Text fz={11} c={TV.textLabel} tt="uppercase" lts="0.05em" fw={700}>{s.label}</Text>
              </div>
              <Text fz={s.numeric ? 24 : 15} fw={s.numeric ? 900 : 700} c={TV.textPrimary}
                className={s.numeric ? "font-display" : ""}>{s.value}</Text>
            </Box>
          ))}
        </SimpleGrid>
      </DashCard>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onChange={setActiveTab} color="tvPurple" radius="xl">
        <Tabs.List mb="md">
          <Tabs.Tab value="overview" leftSection={<User size={14} />}>Overview</Tabs.Tab>
          <Tabs.Tab value="activity" leftSection={<Clock size={14} />}>Activity Timeline</Tabs.Tab>
          <Tabs.Tab value="campaigns" leftSection={<Send size={14} />}>Campaign History</Tabs.Tab>
          <Tabs.Tab value="engagement" leftSection={<BarChart3 size={14} />}>Engagement</Tabs.Tab>
          <Tabs.Tab value="giving" leftSection={<DollarSign size={14} />}>Giving History</Tabs.Tab>
        </Tabs.List>

        {/* ── Overview tab ── */}
        <Tabs.Panel value="overview">
          {/* ── Engagement Preview (full-width) ── */}
          <DashCard className="p-5 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={15} style={{ color: TV.textBrand }} />
                <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em">Engagement Preview</Text>
                {sends.length > 0 && (
                  <div className="flex items-center gap-1 ml-2">
                    {[...new Set(sends.map(s => s.channel))].map(ch => {
                      const Icon = CHANNEL_ICON[ch] || Globe;
                      return (
                        <Tooltip key={ch} label={ch} withArrow>
                          <Box w={20} h={20} bg={TV.surface} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Icon size={10} style={{ color: TV.textSecondary }} />
                          </Box>
                        </Tooltip>
                      );
                    })}
                    {tvInteractions.length > 0 && (
                      <Tooltip label="ThankView Pages" withArrow>
                        <Box w={20} h={20} bg={TV.surface} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <ExternalLink size={10} style={{ color: TV.textSecondary }} />
                        </Box>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
              <Button variant="subtle" color="tvPurple" size="compact-sm" rightSection={<ChevronRight size={13} />}
                onClick={() => setActiveTab("engagement")}>
                View Full Engagement
              </Button>
            </div>

            {sends.length > 0 ? (
              <>
                {/* Aggregate metrics row */}
                <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="sm" mb="sm">
                  {[
                    { label: "Avg. Engagement", value: `${avg}%`, color: avg >= 70 ? TV.success : avg >= 40 ? TV.warning : TV.danger },
                    { label: "Reply Rate", value: `${Math.round((sends.filter(s => s.replyRate).length / sends.length) * 100)}%`, color: TV.brand },
                    { label: "CTA Click Rate", value: `${Math.round((sends.filter(s => s.ctaClicked).length / sends.length) * 100)}%`, color: TV.info },
                    { label: "Avg. Watch %", value: `${Math.round(sends.reduce((a, s) => a + s.watchPct, 0) / sends.length)}%`, color: TV.brand },
                  ].map(m => (
                    <Box key={m.label} bg={TV.surface} px="sm" py="xs" style={{ borderRadius: 10 }}>
                      <Text fz={9} c={TV.textLabel} tt="uppercase" lts="0.04em" fw={600}>{m.label}</Text>
                      <Text fz={18} fw={900} c={m.color} className="font-display">{m.value}</Text>
                    </Box>
                  ))}
                </SimpleGrid>

                {/* Giving attribution callout */}
                {givingEvents.length > 0 && (() => {
                  const attributed = givingEvents.filter(g => g.attributed);
                  const attributedTotal = attributed.reduce((a, g) => a + g.amountNum, 0);
                  return attributed.length > 0 ? (
                    <Box bg={TV.successBg} px="sm" py={6} mb="sm" style={{ borderRadius: 10, border: `1px solid ${TV.successBorder}` }}>
                      <div className="flex items-center gap-2">
                        <DollarSign size={12} style={{ color: TV.success }} />
                        <Text fz={11} fw={600} c={TV.success}>
                          ${attributedTotal.toLocaleString()} in gifts attributed across {attributed.length} giving event{attributed.length !== 1 ? "s" : ""}
                        </Text>
                      </div>
                    </Box>
                  ) : null;
                })()}

                {/* Recent sends (up to 3) */}
                <div className="flex flex-col gap-1.5">
                  {sends.slice(0, 3).map(send => (
                    <div key={send.id} className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-black/[0.02] transition-colors">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full" style={{
                        backgroundColor: send.engagementScore >= 70 ? TV.successBg : send.engagementScore >= 40 ? TV.warningBg : TV.dangerBg,
                      }}>
                        <Text fz={11} fw={800} c={send.engagementScore >= 70 ? TV.success : send.engagementScore >= 40 ? TV.warning : TV.danger}>
                          {send.engagementScore}
                        </Text>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text fz={12} fw={600} c={TV.textPrimary} truncate>{send.campaign}</Text>
                        <Text fz={10} c={TV.textSecondary}>{send.sentAt} · {send.channel}</Text>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {send.replyRate && <Badge size="xs" variant="light" color="green">Replied</Badge>}
                        {send.ctaClicked && <Badge size="xs" variant="light" color="tvPurple">CTA</Badge>}
                        {!send.replyRate && !send.ctaClicked && (
                          <Badge size="xs" variant="light" color={send.viewRate > 0 ? "blue" : "gray"}>
                            {send.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {sends.length > 3 && (
                    <Text fz={11} c={TV.textSecondary} ta="center" mt={2}>
                      + {sends.length - 3} more campaign{sends.length - 3 > 1 ? "s" : ""}
                    </Text>
                  )}
                </div>
              </>
            ) : (
              <Box bg={TV.surface} p="md" style={{ borderRadius: 12 }} className="text-center">
                <Text fz={13} c={TV.textSecondary}>No engagement data yet — this constituent hasn't received any campaigns.</Text>
              </Box>
            )}
          </DashCard>

          <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
            {/* Contact info */}
            <DashCard className="p-6">
              <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em" mb="sm">Constituent Information</Text>
              {editing ? (
                <Stack gap="sm">
                  {/* ── Contact Details ── */}
                  <FormSection legend="Contact Details">
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <TextInput label="Email" leftSection={<Mail size={14} style={{ color: TV.textBrand }} />}
                      value={editEmail} onChange={e => setEditEmail(e.currentTarget.value)}
                      autoComplete="email"
                      radius="md" styles={{ input: { borderColor: TV.borderLight } }} />
                    <TextInput label="Phone" leftSection={<Phone size={14} style={{ color: TV.textBrand }} />}
                      value={editPhone} onChange={e => setEditPhone(e.currentTarget.value)}
                      autoComplete="tel"
                      radius="md" styles={{ input: { borderColor: TV.borderLight } }} />
                  </SimpleGrid>
                  </FormSection>

                  <FormSection legend="Professional Details">
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <TextInput label="Company" leftSection={<Building2 size={14} style={{ color: TV.textBrand }} />}
                      value={editCompany} onChange={e => setEditCompany(e.currentTarget.value)}
                      radius="md" styles={{ input: { borderColor: TV.borderLight } }} />
                    <TextInput label="Title" leftSection={<Briefcase size={14} style={{ color: TV.textBrand }} />}
                      value={editTitle} onChange={e => setEditTitle(e.currentTarget.value)}
                      radius="md" styles={{ input: { borderColor: TV.borderLight } }} />
                  </SimpleGrid>
                  </FormSection>

                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                    <TextInput label="Remote (Donor) ID" leftSection={<Hash size={14} style={{ color: TV.textBrand }} />}
                      value={editRemoteId} onChange={e => setEditRemoteId(e.currentTarget.value)}
                      radius="md" styles={{ input: { borderColor: TV.borderLight } }} />
                    <TextInput label="Affiliation" leftSection={<GraduationCap size={14} style={{ color: TV.textBrand }} />}
                      value={editAffiliation} onChange={e => setEditAffiliation(e.currentTarget.value)}
                      radius="md" styles={{ input: { borderColor: TV.borderLight } }} />
                  </SimpleGrid>

                  <Select label="Assignee" leftSection={<UserCheck size={14} style={{ color: TV.textBrand }} />}
                    value={editAssignee || null} onChange={v => setEditAssignee(v ?? "")}
                    data={[
                      { value: "Kelley Molt", label: "Kelley Molt" },
                      { value: "James Okafor", label: "James Okafor" },
                      { value: "Michelle Park", label: "Michelle Park" },
                    ]}
                    clearable placeholder="Unassigned"
                    radius="md" styles={{ input: { borderColor: TV.borderLight } }} />

                  {/* ── Address ── */}
                  <FormSection legend="Address">
                  <Divider label="Address" labelPosition="left" mt="xs"
                    styles={{ label: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: TV.textLabel } }} />

                  <Stack gap="sm">
                  <TextInput label="Address Line 1" leftSection={<Home size={14} style={{ color: TV.textBrand }} />}
                    value={editAddr1} onChange={e => setEditAddr1(e.currentTarget.value)}
                    autoComplete="address-line1"
                    radius="md" styles={{ input: { borderColor: TV.borderLight } }} />
                  <TextInput label="Address Line 2"
                    value={editAddr2} onChange={e => setEditAddr2(e.currentTarget.value)}
                    autoComplete="address-line2"
                    radius="md" styles={{ input: { borderColor: TV.borderLight } }} />
                  <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
                    <TextInput label="City" value={editCity} onChange={e => setEditCity(e.currentTarget.value)}
                      autoComplete="address-level2"
                      radius="md" styles={{ input: { borderColor: TV.borderLight } }} />
                    <TextInput label="State" value={editState} onChange={e => setEditState(e.currentTarget.value)}
                      autoComplete="address-level1"
                      radius="md" styles={{ input: { borderColor: TV.borderLight } }} />
                    <TextInput label="Zip" value={editZip} onChange={e => setEditZip(e.currentTarget.value)}
                      autoComplete="postal-code"
                      radius="md" styles={{ input: { borderColor: TV.borderLight } }} />
                  </SimpleGrid>
                  </Stack>
                  </FormSection>

                  {/* ── Tags ── */}
                  <Divider label="Tags" labelPosition="left" mt="xs"
                    styles={{ label: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: TV.textLabel } }} />
                  <TagSelect label="" value={tags} onChange={setTags} presetTags={CONTACT_PRESET_TAGS} />

                  {/* ── Custom Fields ── */}
                  <Divider label="Custom Fields" labelPosition="left" mt="xs"
                    styles={{ label: { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: TV.textLabel } }} />
                  <Stack gap="sm">
                    {Object.entries(editCustomFields).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <TextInput
                          value={key}
                          readOnly
                          radius="md"
                          styles={{ input: { borderColor: TV.borderLight, backgroundColor: TV.surface } }}
                        />
                        <TextInput
                          value={value}
                          onChange={e => setEditCustomFields(prev => ({ ...prev, [key]: e.currentTarget.value }))}
                          radius="md"
                          styles={{ input: { borderColor: TV.borderLight } }}
                        />
                        <ActionIcon
                          size="sm"
                          color="red"
                          onClick={() => setEditCustomFields(prev => {
                            const { [key]: _, ...rest } = prev;
                            return rest;
                          })}
                          aria-label="Remove custom field"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </ActionIcon>
                      </div>
                    ))}
                    <div className="flex items-center gap-3">
                      <TextInput
                        value={newCfKey}
                        onChange={e => setNewCfKey(e.currentTarget.value)}
                        radius="md"
                        styles={{ input: { borderColor: TV.borderLight } }}
                        placeholder="Key"
                      />
                      <TextInput
                        value={newCfValue}
                        onChange={e => setNewCfValue(e.currentTarget.value)}
                        radius="md"
                        styles={{ input: { borderColor: TV.borderLight } }}
                        placeholder="Value"
                      />
                      <ActionIcon
                        size="sm"
                        color="tvPurple"
                        onClick={() => {
                          if (newCfKey && newCfValue) {
                            setEditCustomFields(prev => ({ ...prev, [newCfKey]: newCfValue }));
                            setNewCfKey("");
                            setNewCfValue("");
                          }
                        }}
                        aria-label="Add custom field"
                      >
                        <Plus size={14} aria-hidden="true" />
                      </ActionIcon>
                    </div>
                  </Stack>
                </Stack>
              ) : (
                <Stack gap="sm">
                  {/* ── Contact Info (collapsible, compact) ── */}
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: TV.borderLight }}>
                    <button onClick={() => toggleSection("contactInfo")} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-black/[0.02] transition-colors">
                      <ChevronDown size={12} style={{ color: TV.textSecondary, transform: openSections.contactInfo ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }} />
                      <Text fz={11} fw={700} c={TV.textPrimary} className="flex-1 text-left">Contact Details</Text>
                      {!openSections.contactInfo && (
                        <Text fz={10} c={TV.textSecondary} truncate className="max-w-[200px]">{contact.email} · {contact.phone}</Text>
                      )}
                    </button>
                    {openSections.contactInfo && (
                      <div className="px-4 pb-3 pt-0.5">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {[
                            { icon: Mail,      label: "Email",    value: contact.email },
                            { icon: Phone,     label: "Phone",    value: contact.phone },
                            { icon: Building2, label: "Company",  value: contact.company ?? "—" },
                            { icon: Briefcase, label: "Title",    value: contact.title ?? "—" },
                            { icon: UserCheck, label: "Assignee", value: contact.assignee ?? "—" },
                          ].map(f => (
                            <div key={f.label} className="flex items-center gap-2 min-w-0">
                              <f.icon size={12} style={{ color: TV.textBrand, flexShrink: 0 }} />
                              <div className="min-w-0">
                                <Text fz={9} c={TV.textLabel} tt="uppercase" lts="0.04em" fw={600}>{f.label}</Text>
                                <Text fz={12} c={TV.textPrimary} truncate>{f.value}</Text>
                              </div>
                            </div>
                          ))}
                          {/* Address inline */}
                          {contact.addressLine1 && (
                            <div className="flex items-center gap-2 min-w-0 col-span-2">
                              <Home size={12} style={{ color: TV.textBrand, flexShrink: 0 }} />
                              <div className="min-w-0">
                                <Text fz={9} c={TV.textLabel} tt="uppercase" lts="0.04em" fw={600}>Address</Text>
                                <Text fz={12} c={TV.textPrimary} truncate>
                                  {contact.addressLine1}{contact.addressLine2 ? `, ${contact.addressLine2}` : ""}, {[contact.city, contact.state].filter(Boolean).join(", ")}{contact.zip ? ` ${contact.zip}` : ""}
                                </Text>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Extended Details (collapsible) ── */}
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: TV.borderLight }}>
                    <button onClick={() => toggleSection("extendedDetails")} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-black/[0.02] transition-colors">
                      <ChevronDown size={12} style={{ color: TV.textSecondary, transform: openSections.extendedDetails ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }} />
                      <Text fz={11} fw={700} c={TV.textPrimary} className="flex-1 text-left">More Details</Text>
                      {!openSections.extendedDetails && (
                        <Text fz={10} c={TV.textSecondary}>{contact.affiliation ?? ""}{contact.affiliation && contact.city ? " · " : ""}{contact.city ?? ""}</Text>
                      )}
                    </button>
                    {openSections.extendedDetails && (
                      <div className="px-4 pb-3 pt-0.5">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                          {[
                            { icon: Mail,          label: "CC Addresses", value: (contact.ccAddresses?.length) ? contact.ccAddresses.join(", ") : "—" },
                            { icon: Mail,          label: "BCC Addresses", value: (contact.bccAddresses?.length) ? contact.bccAddresses.join(", ") : "—" },
                            { icon: Hash,          label: "Remote ID",   value: contact.remoteId ?? "—" },
                            { icon: GraduationCap, label: "Affiliation", value: contact.affiliation ?? "—" },
                            { icon: Calendar,      label: "Date Added",  value: contact.dateAdded },
                            { icon: User,          label: "Age Range",   value: contact.age ?? "—" },
                            { icon: Send,          label: "Last Campaign",value: contact.lastCampaign ?? "—" },
                            { icon: Tag,           label: "Donor Status", value: contact.donorStatus ? contact.donorStatus.charAt(0).toUpperCase() + contact.donorStatus.slice(1).replace("-", " ") : "—" },
                          ].map(f => (
                            <div key={f.label} className="flex items-center gap-2 min-w-0">
                              <f.icon size={12} style={{ color: TV.textBrand, flexShrink: 0 }} />
                              <div className="min-w-0">
                                <Text fz={9} c={TV.textLabel} tt="uppercase" lts="0.04em" fw={600}>{f.label}</Text>
                                <Text fz={12} c={TV.textPrimary} truncate>{f.value}</Text>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ── Scores & Ratings (collapsible) ── */}
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: TV.borderLight }}>
                    <button onClick={() => toggleSection("scores")} className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-black/[0.02] transition-colors">
                      <ChevronDown size={12} style={{ color: TV.textSecondary, transform: openSections.scores ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }} />
                      <Text fz={11} fw={700} c={TV.textPrimary} className="flex-1 text-left">Scores & Ratings</Text>
                      {!openSections.scores && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-0.5">
                            {Array.from({ length: 5 }, (_, i) => (
                              <Star key={i} size={10} fill={i < (contact.starRating ?? 0) ? TV.star : "none"}
                                style={{ color: i < (contact.starRating ?? 0) ? TV.star : TV.borderLight }} />
                            ))}
                          </div>
                          <Text fz={10} c={TV.textSecondary}>CT {contact.ctScore ?? 0}</Text>
                          <Text fz={10} c={TV.textSecondary}>Vid {contact.videoScore ?? 0}</Text>
                        </div>
                      )}
                    </button>
                    {openSections.scores && (
                      <div className="px-4 pb-4 pt-1">
                        <Stack gap="md">
                          {/* Star Rating */}
                          <div className="flex items-center gap-3 flex-nowrap">
                            <Box w={32} h={32} bg={TV.starBg} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Star size={14} style={{ color: TV.star }} />
                            </Box>
                            <div>
                              <Text fz={10} c={TV.textLabel} tt="uppercase" lts="0.05em" fw={600}>Star Rating</Text>
                              {(contact.starRating ?? 0) > 0 ? (
                                <div className="flex items-center gap-0.5 mt-0.5">
                                  {Array.from({ length: 5 }, (_, i) => (
                                    <Star key={i} size={14} fill={i < (contact.starRating ?? 0) ? TV.star : "none"}
                                      style={{ color: i < (contact.starRating ?? 0) ? TV.star : TV.borderLight }} />
                                  ))}
                                  <Text fz={12} c={TV.textPrimary} ml={4}>{contact.starRating} / 5</Text>
                                </div>
                              ) : (
                                <Text fz={13} c={TV.textSecondary}>Unrated</Text>
                              )}
                            </div>
                          </div>

                          {/* CT Score */}
                          <div className="flex items-center gap-3 flex-nowrap">
                            <Box w={32} h={32} bg={(contact.ctScore ?? 0) >= 70 ? TV.successBg : (contact.ctScore ?? 0) >= 40 ? TV.warningBg : TV.dangerBg} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <BarChart3 size={14} style={{ color: (contact.ctScore ?? 0) >= 70 ? TV.statusSuccess : (contact.ctScore ?? 0) >= 40 ? TV.statusWarning : TV.statusError }} />
                            </Box>
                            <div style={{ flex: 1 }}>
                              <Text fz={10} c={TV.textLabel} tt="uppercase" lts="0.05em" fw={600}>CT Score</Text>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Box w={80} h={5} bg={TV.borderLight} style={{ borderRadius: 4, overflow: "hidden" }}>
                                  <Box h={5} w={`${contact.ctScore ?? 0}%`} bg={(contact.ctScore ?? 0) >= 70 ? TV.statusSuccess : (contact.ctScore ?? 0) >= 40 ? TV.statusWarning : TV.statusError} style={{ borderRadius: 4 }} />
                                </Box>
                                <Text fz={12} c={TV.textPrimary}>{contact.ctScore ?? 0} / 100</Text>
                              </div>
                            </div>
                          </div>

                          {/* Video Score */}
                          <div className="flex items-center gap-3 flex-nowrap">
                            <Box w={32} h={32} bg={(contact.videoScore ?? 0) >= 70 ? TV.successBg : (contact.videoScore ?? 0) >= 40 ? TV.warningBg : TV.dangerBg} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Film size={14} style={{ color: (contact.videoScore ?? 0) >= 70 ? TV.statusSuccess : (contact.videoScore ?? 0) >= 40 ? TV.statusWarning : TV.statusError }} />
                            </Box>
                            <div style={{ flex: 1 }}>
                              <Text fz={10} c={TV.textLabel} tt="uppercase" lts="0.05em" fw={600}>Video Score</Text>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Box w={80} h={5} bg={TV.borderLight} style={{ borderRadius: 4, overflow: "hidden" }}>
                                  <Box h={5} w={`${contact.videoScore ?? 0}%`} bg={(contact.videoScore ?? 0) >= 70 ? TV.statusSuccess : (contact.videoScore ?? 0) >= 40 ? TV.statusWarning : TV.statusError} style={{ borderRadius: 4 }} />
                                </Box>
                                <Text fz={12} c={TV.textPrimary}>{contact.videoScore ?? 0} / 100</Text>
                              </div>
                            </div>
                          </div>
                        </Stack>
                      </div>
                    )}
                  </div>
                </Stack>
              )}
            </DashCard>

            {/* Right column: Delivery Status + Custom Fields + Engagement */}
            <Stack gap="md">
              {/* ── Delivery Status (collapsible) ── */}
              <DashCard className="overflow-hidden">
                <button onClick={() => toggleSection("deliveryStatus")} className="w-full flex items-center gap-2.5 px-6 py-4 hover:bg-black/[0.02] transition-colors">
                  <ChevronDown size={13} style={{ color: TV.textSecondary, transform: openSections.deliveryStatus ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }} />
                  <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em" className="flex-1 text-left">Delivery Status</Text>
                  {!openSections.deliveryStatus && (
                    <div className="flex items-center gap-1.5">
                      <Badge size="xs" variant="light" color={contact.emailStatus === "valid" ? "green" : contact.emailStatus === "bounced" || contact.emailStatus === "spam" ? "red" : "orange"}>
                        Email: {contact.emailStatus}
                      </Badge>
                      <Badge size="xs" variant="light" color={contact.phoneStatus === "valid" ? "green" : contact.phoneStatus === "bounced" ? "red" : "orange"}>
                        Phone: {contact.phoneStatus}
                      </Badge>
                    </div>
                  )}
                </button>
                {openSections.deliveryStatus && <div className="px-6 pb-6">
                <Stack gap="sm">
                  {/* Email status */}
                  <Box p="sm" style={{ borderRadius: 12, border: `1px solid ${
                    contact.emailStatus === "valid" ? TV.borderLight :
                    contact.emailStatus === "bounced" || contact.emailStatus === "spam" ? TV.dangerBorder :
                    contact.emailStatus === "unsubscribed" ? TV.warningBorder : TV.borderLight
                  }`, backgroundColor:
                    contact.emailStatus === "bounced" || contact.emailStatus === "spam" ? TV.dangerBg :
                    contact.emailStatus === "unsubscribed" ? TV.warningBg :
                    contact.emailStatus === "valid" ? TV.successBg : TV.surface
                  }}>
                    <div className="flex items-center gap-3 flex-nowrap">
                      <Box w={32} h={32} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        backgroundColor: contact.emailStatus === "valid" ? TV.successBg :
                          contact.emailStatus === "bounced" || contact.emailStatus === "spam" ? TV.dangerBorder :
                          contact.emailStatus === "unsubscribed" ? TV.warningBorder : TV.surface }}>
                        {contact.emailStatus === "valid" ? <CircleCheckBig size={15} style={{ color: TV.success }} /> :
                         contact.emailStatus === "bounced" ? <AlertTriangle size={15} style={{ color: TV.danger }} /> :
                         contact.emailStatus === "spam" ? <ShieldAlert size={15} style={{ color: TV.danger }} /> :
                         contact.emailStatus === "unsubscribed" ? <Ban size={15} style={{ color: TV.warning }} /> :
                         <Mail size={15} style={{ color: TV.textSecondary }} />}
                      </Box>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-1.5">
                          <Text fz={13} fw={600} c={TV.textPrimary}>Email</Text>
                          <Badge size="xs" variant="light"
                            color={contact.emailStatus === "valid" ? "green" : contact.emailStatus === "bounced" || contact.emailStatus === "spam" ? "red" : contact.emailStatus === "unsubscribed" ? "orange" : "gray"}>
                            {contact.emailStatus === "valid" ? "Valid" :
                             contact.emailStatus === "bounced" ? "Bounced" :
                             contact.emailStatus === "spam" ? "Spam" :
                             contact.emailStatus === "unsubscribed" ? "Unsubscribed" : "Missing"}
                          </Badge>
                        </div>
                        <Text fz={12} c={TV.textSecondary} truncate>{contact.email}</Text>
                      </div>
                    </div>
                  </Box>

                  {/* Phone status */}
                  <Box p="sm" style={{ borderRadius: 12, border: `1px solid ${
                    contact.phoneStatus === "valid" ? TV.borderLight :
                    contact.phoneStatus === "bounced" ? TV.dangerBorder :
                    contact.phoneStatus === "unsubscribed" ? TV.warningBorder : TV.borderLight
                  }`, backgroundColor:
                    contact.phoneStatus === "bounced" ? TV.dangerBg :
                    contact.phoneStatus === "unsubscribed" ? TV.warningBg :
                    contact.phoneStatus === "valid" ? TV.successBg : TV.surface
                  }}>
                    <div className="flex items-center gap-3 flex-nowrap">
                      <Box w={32} h={32} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        backgroundColor: contact.phoneStatus === "valid" ? TV.successBg :
                          contact.phoneStatus === "bounced" ? TV.dangerBorder :
                          contact.phoneStatus === "unsubscribed" ? TV.warningBorder : TV.surface }}>
                        {contact.phoneStatus === "valid" ? <CircleCheckBig size={15} style={{ color: TV.success }} /> :
                         contact.phoneStatus === "bounced" ? <AlertTriangle size={15} style={{ color: TV.danger }} /> :
                         contact.phoneStatus === "unsubscribed" ? <Ban size={15} style={{ color: TV.warning }} /> :
                         <Phone size={15} style={{ color: TV.textSecondary }} />}
                      </Box>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-1.5">
                          <Text fz={13} fw={600} c={TV.textPrimary}>Phone</Text>
                          <Badge size="xs" variant="light"
                            color={contact.phoneStatus === "valid" ? "green" : contact.phoneStatus === "bounced" ? "red" : contact.phoneStatus === "unsubscribed" ? "orange" : "gray"}>
                            {contact.phoneStatus === "valid" ? "Valid" :
                             contact.phoneStatus === "bounced" ? "Bounced" :
                             contact.phoneStatus === "unsubscribed" ? "Unsubscribed" : "Missing"}
                          </Badge>
                        </div>
                        <Text fz={12} c={TV.textSecondary}>{contact.phone}</Text>
                      </div>
                    </div>
                  </Box>
                </Stack>
                </div>}
              </DashCard>

              {/* ── Custom Fields (collapsible) ── */}
              {contact.customFields && Object.keys(contact.customFields).length > 0 && (
                <DashCard className="overflow-hidden">
                  <button onClick={() => toggleSection("customFields")} className="w-full flex items-center gap-2.5 px-6 py-4 hover:bg-black/[0.02] transition-colors">
                    <ChevronDown size={13} style={{ color: TV.textSecondary, transform: openSections.customFields ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }} />
                    <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em" className="flex-1 text-left">Custom Fields</Text>
                    <Badge size="xs" variant="light" color="tvPurple">{Object.keys(contact.customFields).length}</Badge>
                  </button>
                  {openSections.customFields && (
                    <div className="px-6 pb-6">
                      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
                        {Object.entries(contact.customFields).map(([key, value]) => (
                          <Box key={key} bg={TV.surface} p="sm" style={{ borderRadius: 12 }}>
                            <Text fz={11} c={TV.textLabel} tt="uppercase" lts="0.05em" fw={600}>{key}</Text>
                            <Text fz={14} c={TV.textPrimary} mt={2}>{value}</Text>
                          </Box>
                        ))}
                      </SimpleGrid>
                    </div>
                  )}
                </DashCard>
              )}

              {/* ── Multi-Channel Engagement Summary (collapsible) ── */}
              <DashCard className="overflow-hidden">
                <button onClick={() => toggleSection("engagementSummary")} className="w-full flex items-center gap-2.5 px-6 py-4 hover:bg-black/[0.02] transition-colors">
                  <ChevronDown size={13} style={{ color: TV.textSecondary, transform: openSections.engagementSummary ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.15s" }} />
                  <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em" className="flex-1 text-left">Engagement Summary</Text>
                  {!openSections.engagementSummary && sends.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Text fz={16} fw={900} className="font-display" c={avg >= 70 ? TV.success : avg >= 40 ? TV.warning : TV.danger}>{avg}</Text>
                      <Text fz={10} c={TV.textSecondary}>avg · {sends.length} sends · {[...new Set(sends.map(s => s.channel))].length} channels</Text>
                    </div>
                  )}
                </button>
                {openSections.engagementSummary && (
                  <div className="px-6 pb-6">
                    {sends.length === 0 ? (
                      <Text fz={14} c={TV.textSecondary}>No send records yet.</Text>
                    ) : (() => {
                      const emailSends = sends.filter(s => s.channel === "Email");
                      const smsSends = sends.filter(s => s.channel === "SMS");
                      const socialSends = sends.filter(s => s.channel !== "Email" && s.channel !== "SMS");
                      const totalTvViews = tvInteractions.reduce((a, t) => a + t.landingPageViews, 0);
                      const totalTvPlays = tvInteractions.reduce((a, t) => a + t.videoPlaysOnPage, 0);
                      const totalTvCta = tvInteractions.reduce((a, t) => a + t.ctaClicksOnPage, 0);
                      const totalTvShares = tvInteractions.reduce((a, t) => a + t.socialShares, 0);
                      const totalGiftAmt = givingEvents.reduce((a, g) => a + g.amountNum, 0);
                      const attributedGifts = givingEvents.filter(g => g.attributed);
                      const attributedAmt = attributedGifts.reduce((a, g) => a + g.amountNum, 0);

                      return (
                        <Stack gap="lg">
                          {/* ── 1. Composite Score ── */}
                          <Box>
                            <Text fz={11} c={TV.textLabel} tt="uppercase" lts="0.05em" fw={600} mb={8}>Composite Engagement Score</Text>
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-3.5 bg-tv-border-light rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${avg}%`, backgroundColor: avg >= 70 ? TV.success : avg >= 40 ? TV.warning : TV.danger }} />
                              </div>
                              <Text fz={22} fw={900} className="font-display" c={TV.textPrimary}>{avg}</Text>
                            </div>
                            <Text fz={10} c={TV.textSecondary} mt={4}>
                              Across {sends.length} touchpoint{sends.length !== 1 ? "s" : ""} on {[...new Set(sends.map(s => s.channel))].join(", ")}
                            </Text>
                          </Box>

                          {/* ── 2. Channel Performance Breakdown ── */}
                          <Box>
                            <Text fz={11} c={TV.textLabel} tt="uppercase" lts="0.05em" fw={600} mb={8}>Channel Performance</Text>
                            <Stack gap="sm">
                              {/* Email */}
                              {emailSends.length > 0 && (
                                <Box p="sm" style={{ borderRadius: 12, border: `1px solid ${TV.borderLight}` }}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Box w={24} h={24} bg={TV.brandTint} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <Mail size={12} style={{ color: TV.textBrand }} />
                                    </Box>
                                    <Text fz={12} fw={700} c={TV.textPrimary}>Email</Text>
                                    <Badge size="xs" variant="light" color="tvPurple" ml="auto">{emailSends.length} send{emailSends.length !== 1 ? "s" : ""}</Badge>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Open Rate</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{Math.round((emailSends.filter(s => s.openedAt !== "—").length / emailSends.length) * 100)}%</Text>
                                    </div>
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Avg Watch</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{Math.round(emailSends.reduce((a, s) => a + s.watchPct, 0) / emailSends.length)}%</Text>
                                    </div>
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Replied</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{emailSends.filter(s => s.replyRate).length}/{emailSends.length}</Text>
                                    </div>
                                  </div>
                                </Box>
                              )}

                              {/* SMS */}
                              {smsSends.length > 0 && (
                                <Box p="sm" style={{ borderRadius: 12, border: `1px solid ${TV.borderLight}` }}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Box w={24} h={24} bg={TV.successBg} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <MessageSquare size={12} style={{ color: TV.success }} />
                                    </Box>
                                    <Text fz={12} fw={700} c={TV.textPrimary}>SMS</Text>
                                    <Badge size="xs" variant="light" color="tvPurple" ml="auto">{smsSends.length} send{smsSends.length !== 1 ? "s" : ""}</Badge>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Opened</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{Math.round((smsSends.filter(s => s.openedAt !== "—").length / smsSends.length) * 100)}%</Text>
                                    </div>
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Responded</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{smsSends.filter(s => s.replyRate).length}/{smsSends.length}</Text>
                                    </div>
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>CTA Click</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{smsSends.filter(s => s.ctaClicked).length}/{smsSends.length}</Text>
                                    </div>
                                  </div>
                                </Box>
                              )}

                              {/* Social */}
                              {socialSends.length > 0 && (
                                <Box p="sm" style={{ borderRadius: 12, border: `1px solid ${TV.borderLight}` }}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Box w={24} h={24} bg={TV.infoBg} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <Globe size={12} style={{ color: TV.info }} />
                                    </Box>
                                    <Text fz={12} fw={700} c={TV.textPrimary}>Social</Text>
                                    <Badge size="xs" variant="light" color="tvPurple" ml="auto">{socialSends.length} send{socialSends.length !== 1 ? "s" : ""}</Badge>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2">
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Reached</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{Math.round((socialSends.filter(s => s.openedAt !== "—").length / socialSends.length) * 100)}%</Text>
                                    </div>
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Shared</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{socialSends.filter(s => s.shared).length}/{socialSends.length}</Text>
                                    </div>
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Avg Watch</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{Math.round(socialSends.reduce((a, s) => a + s.watchPct, 0) / socialSends.length)}%</Text>
                                    </div>
                                  </div>
                                </Box>
                              )}

                              {/* ThankView Landing Pages */}
                              {tvInteractions.length > 0 && (
                                <Box p="sm" style={{ borderRadius: 12, border: `1px solid ${TV.borderLight}` }}>
                                  <div className="flex items-center gap-2 mb-2">
                                    <Box w={24} h={24} bg={TV.brandTint} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                      <ExternalLink size={12} style={{ color: TV.brand }} />
                                    </Box>
                                    <Text fz={12} fw={700} c={TV.textPrimary}>ThankView Pages</Text>
                                    <Badge size="xs" variant="light" color="tvPurple" ml="auto">{tvInteractions.length} page{tvInteractions.length !== 1 ? "s" : ""}</Badge>
                                  </div>
                                  <div className="grid grid-cols-4 gap-2">
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Page Views</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{totalTvViews}</Text>
                                    </div>
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Video Plays</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{totalTvPlays}</Text>
                                    </div>
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>CTA Clicks</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{totalTvCta}</Text>
                                    </div>
                                    <div>
                                      <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Shares</Text>
                                      <Text fz={15} fw={800} c={TV.textPrimary} className="font-display">{totalTvShares}</Text>
                                    </div>
                                  </div>
                                </Box>
                              )}
                            </Stack>
                          </Box>

                          {/* ── 3. Video Engagement ── */}
                          <Box>
                            <Text fz={11} c={TV.textLabel} tt="uppercase" lts="0.05em" fw={600} mb={8}>Video Engagement</Text>
                            <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="sm">
                              {[
                                { label: "Total Views", value: sends.filter(s => s.viewRate > 0).length, icon: Eye, color: TV.brand },
                                { label: "Avg. Watch %", value: `${Math.round(sends.reduce((a, s) => a + s.watchPct, 0) / sends.length)}%`, icon: Film, color: TV.info },
                                { label: "Completions", value: sends.filter(s => s.watchPct >= 90).length, icon: CircleCheckBig, color: TV.success },
                                { label: "CTA Clicks", value: sends.filter(s => s.ctaClicked).length, icon: MousePointerClick, color: TV.warning },
                                { label: "Shares", value: sends.filter(s => s.shared).length, icon: Share2, color: TV.brand },
                                { label: "Downloads", value: sends.filter(s => s.downloaded).length, icon: Download, color: TV.textSecondary },
                              ].map(m => (
                                <Box key={m.label} bg={TV.surface} p="sm" style={{ borderRadius: 10 }}>
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <m.icon size={12} style={{ color: m.color }} />
                                    <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>{m.label}</Text>
                                  </div>
                                  <Text fz={16} fw={900} c={TV.textPrimary} className="font-display">{m.value}</Text>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </Box>

                          {/* ── 4. Giving Events ── */}
                          {givingEvents.length > 0 && (
                            <Box>
                              <div className="flex items-center justify-between mb-2">
                                <Text fz={11} c={TV.textLabel} tt="uppercase" lts="0.05em" fw={600}>Giving Events</Text>
                                <div className="flex items-center gap-1.5">
                                  <DollarSign size={12} style={{ color: TV.success }} />
                                  <Text fz={13} fw={800} c={TV.success}>${totalGiftAmt.toLocaleString()}</Text>
                                  <Text fz={10} c={TV.textSecondary}>total</Text>
                                </div>
                              </div>

                              {/* Attribution summary */}
                              {attributedGifts.length > 0 && (
                                <Box bg={TV.successBg} px="sm" py="xs" mb="sm" style={{ borderRadius: 10, border: `1px solid ${TV.successBorder}` }}>
                                  <div className="flex items-center gap-2">
                                    <Zap size={12} style={{ color: TV.success }} />
                                    <Text fz={11} c={TV.success} fw={600}>
                                      ${attributedAmt.toLocaleString()} attributed to ThankView ({Math.round((attributedAmt / totalGiftAmt) * 100)}% of total)
                                    </Text>
                                  </div>
                                </Box>
                              )}

                              <Stack gap={6}>
                                {givingEvents.map((g, i) => {
                                  const gType = GIVING_TYPE_LABEL[g.type] ?? { label: g.type, color: "gray" };
                                  return (
                                    <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md" style={{ backgroundColor: TV.surface }}>
                                      <Box w={28} h={28} bg={g.attributed ? TV.successBg : TV.surfaceMuted} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <DollarSign size={13} style={{ color: g.attributed ? TV.success : TV.textSecondary }} />
                                      </Box>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <Text fz={14} fw={800} c={TV.textPrimary}>{g.amount}</Text>
                                          <Badge size="xs" variant="light" color={gType.color}>{gType.label}</Badge>
                                          {g.attributed && <Badge size="xs" variant="light" color="green">Attributed</Badge>}
                                        </div>
                                        <Text fz={10} c={TV.textSecondary}>{g.date} · {g.channel}{g.campaign !== "—" ? ` · ${g.campaign}` : ""}</Text>
                                      </div>
                                    </div>
                                  );
                                })}
                              </Stack>
                            </Box>
                          )}

                          {/* ── 5. Device & Preference Breakdown ── */}
                          <Box>
                            <Text fz={11} c={TV.textLabel} tt="uppercase" lts="0.05em" fw={600} mb={8}>Device Breakdown</Text>
                            <div className="flex items-center gap-2 flex-wrap">
                              {Object.entries(sends.reduce<Record<string, number>>((acc, s) => { acc[s.device] = (acc[s.device] || 0) + 1; return acc; }, {}))
                                .sort((a, b) => b[1] - a[1])
                                .map(([dev, count]) => {
                                  const Icon = DEVICE_ICON[dev] || Globe;
                                  const pct = Math.round((count / sends.length) * 100);
                                  return (
                                    <Box key={dev} bg={TV.surface} px="sm" py="xs" style={{ borderRadius: 10 }}>
                                      <div className="flex items-center gap-1.5">
                                        <Icon size={12} style={{ color: TV.textBrand }} />
                                        <Text fz={11} fw={600} c={TV.textPrimary}>{dev}</Text>
                                      </div>
                                      <Text fz={14} fw={800} c={TV.textPrimary} className="font-display">{pct}%</Text>
                                      <Text fz={9} c={TV.textSecondary}>{count} of {sends.length}</Text>
                                    </Box>
                                  );
                                })}
                            </div>
                          </Box>
                        </Stack>
                      );
                    })()}
                  </div>
                )}
              </DashCard>
            </Stack>
          </SimpleGrid>
        </Tabs.Panel>

        {/* ── Activity Timeline tab ── */}
        <Tabs.Panel value="activity">
          <DashCard className="p-6">
            <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em" mb="md">Activity Timeline</Text>

            {/* ── Search + Date Range + Filter bar ── */}
            {(() => {
              // Date parser: turns informal time strings into Date objects
              const NOW = new Date(2026, 2, 16); // March 16, 2026 (today)
              const parseTlDate = (timeStr: string, fallback?: Date): Date | null => {
                // Full date like "Feb 16, 2026"
                const full = new Date(timeStr);
                if (!isNaN(full.getTime())) return full;
                // Short date+time like "Feb 14, 9:02 AM" → append 2026
                const withYear = new Date(timeStr + " 2026");
                if (!isNaN(withYear.getTime())) return withYear;
                // Relative labels → use fallback
                if (fallback) return fallback;
                return null;
              };

              // Date range from FilterBar's date filter values
              const dateRangeBounds = (): { from: Date | null; to: Date | null } => {
                const dateVals = tlFilterValues["activityDate"] ?? [];
                if (dateVals.length === 0) return { from: null, to: null };
                if (dateVals.length === 1) {
                  const d = new Date(dateVals[0] + "T00:00:00");
                  return { from: d, to: new Date(dateVals[0] + "T23:59:59") };
                }
                return {
                  from: new Date(dateVals[0] + "T00:00:00"),
                  to: new Date(dateVals[1] + "T23:59:59"),
                };
              };
              const bounds = dateRangeBounds();

              // Build the full enriched event list
              const ACTIVITY_TYPES = [
                { key: "email", label: "Email", icon: Mail, color: "tvPurple", bg: TV.brandTint, fg: TV.textBrand },
                { key: "video", label: "Video", icon: Play, color: "cyan", bg: TV.infoBg, fg: TV.info },
                { key: "sms", label: "SMS", icon: MessageSquare, color: "green", bg: TV.successBg, fg: TV.success },
                { key: "link", label: "Shareable Link", icon: Link2, color: "blue", bg: TV.infoBg, fg: TV.info },
                { key: "thankview", label: "ThankView", icon: ExternalLink, color: "grape", bg: TV.brandTint, fg: TV.brand },
                { key: "gift", label: "Gift", icon: DollarSign, color: "green", bg: TV.successBg, fg: TV.success },
                { key: "reply", label: "Reply", icon: MessageSquare, color: "green", bg: TV.successBg, fg: TV.success },
                { key: "cta", label: "CTA Click", icon: MousePointerClick, color: "orange", bg: TV.warningBg, fg: TV.warning },
                { key: "share", label: "Share", icon: Share2, color: "tvPurple", bg: TV.brandTint, fg: TV.textBrand },
                { key: "download", label: "Download", icon: Download, color: "gray", bg: TV.surfaceMuted, fg: TV.textSecondary },
              ];

              type TlEvent = {
                icon: typeof Send; label: string; time: string; color: string; campaign: string;
                type: string; channel?: string; detail?: string; sortDate: Date | null;
              };

              const allEvents: TlEvent[] = [];

              // Events from sends
              sends.forEach(send => {
                const ch = send.channel;
                const sendDate = parseTlDate(send.sentAt);
                const openDate = send.openedAt !== "—" ? parseTlDate(send.openedAt, sendDate ?? undefined) : sendDate;
                allEvents.push({ icon: ch === "SMS" ? MessageSquare : ch === "Shareable Link" ? Link2 : Mail, label: `${ch === "SMS" ? "SMS" : ch === "Shareable Link" ? "Shareable link" : "Email"} sent`, time: send.sentAt, color: ch === "SMS" ? "bg-tv-success-bg text-tv-success" : ch === "Shareable Link" ? "bg-tv-info-bg text-tv-info" : "bg-tv-brand-tint text-tv-brand", campaign: send.campaign, type: ch === "SMS" ? "sms" : ch === "Shareable Link" ? "link" : "email", channel: ch, sortDate: sendDate });
                if (send.openedAt !== "—") allEvents.push({ icon: Eye, label: `${ch === "SMS" ? "SMS link" : "Envelope"} opened`, time: send.openedAt, color: "bg-tv-info-bg text-tv-info", campaign: send.campaign, type: ch === "SMS" ? "sms" : "email", channel: ch, sortDate: openDate });
                if (send.viewRate > 0) allEvents.push({ icon: Play, label: `Video played (${send.watchPct}% watched)`, time: send.openedAt, color: "bg-tv-success-bg text-tv-success", campaign: send.campaign, type: "video", channel: ch, detail: `${send.watchTime} of ${send.videoDuration} · ${send.device}`, sortDate: openDate });
                if (send.ctaClicked) allEvents.push({ icon: MousePointerClick, label: "CTA button clicked", time: "Shortly after", color: "bg-tv-warning-bg text-tv-warning", campaign: send.campaign, type: "cta", channel: ch, sortDate: openDate });
                if (send.shared) allEvents.push({ icon: Share2, label: "Content shared", time: "Shortly after", color: "bg-tv-brand-tint text-tv-brand", campaign: send.campaign, type: "share", channel: ch, sortDate: openDate });
                if (send.downloaded) allEvents.push({ icon: Download, label: "Content downloaded", time: "Shortly after", color: "bg-tv-surface-muted text-tv-text-secondary", campaign: send.campaign, type: "download", channel: ch, sortDate: openDate });
                if (send.replyRate) allEvents.push({ icon: MessageSquare, label: `Reply received via ${ch}`, time: "Same session", color: "bg-tv-success-bg text-tv-success", campaign: send.campaign, type: "reply", channel: ch, sortDate: openDate });
              });

              // Events from ThankView interactions (date from matching send)
              tvInteractions.forEach(tv => {
                const matchingSend = sends.find(s => s.campaign === tv.campaign);
                const tvDate = matchingSend ? parseTlDate(matchingSend.sentAt) : null;
                if (tv.landingPageViews > 0) allEvents.push({ icon: ExternalLink, label: `ThankView page visited (${tv.landingPageViews}×)`, time: "After send", color: "bg-tv-brand-tint text-tv-brand", campaign: tv.campaign, type: "thankview", detail: `${tv.videoPlaysOnPage} video play${tv.videoPlaysOnPage !== 1 ? "s" : ""} · avg ${tv.avgTimeOnPage} on page`, sortDate: tvDate });
                if (tv.ctaClicksOnPage > 0) allEvents.push({ icon: MousePointerClick, label: `Landing page CTA clicked (${tv.ctaClicksOnPage}×)`, time: "On page", color: "bg-tv-brand-tint text-tv-brand", campaign: tv.campaign, type: "thankview", sortDate: tvDate });
                if (tv.socialShares > 0) allEvents.push({ icon: Share2, label: `Shared from ThankView page`, time: "On page", color: "bg-tv-brand-tint text-tv-brand", campaign: tv.campaign, type: "thankview", sortDate: tvDate });
              });

              // Events from giving
              givingEvents.forEach(g => {
                const gType = GIVING_TYPE_LABEL[g.type] ?? { label: g.type, color: "gray" };
                allEvents.push({ icon: DollarSign, label: `${gType.label}: ${g.amount}`, time: g.date, color: "bg-tv-success-bg text-tv-success", campaign: g.campaign !== "—" ? g.campaign : "", type: "gift", channel: g.channel, detail: g.attributed ? "Attributed to ThankView" : "Not attributed", sortDate: parseTlDate(g.date) });
              });

              // Sort by date descending (newest first), nulls at end
              allEvents.sort((a, b) => {
                if (!a.sortDate && !b.sortDate) return 0;
                if (!a.sortDate) return 1;
                if (!b.sortDate) return -1;
                return b.sortDate.getTime() - a.sortDate.getTime();
              });

              // Apply search + type filters (from FilterBar) + date range
              const q = tlSearch.toLowerCase().trim();
              const typeFilterVals = tlFilterValues["activityType"] ?? [];
              const filtered = allEvents.filter(e => {
                if (typeFilterVals.length > 0 && !typeFilterVals.includes(e.type)) return false;
                if (q) {
                  const haystack = `${e.label} ${e.campaign} ${e.time} ${e.channel ?? ""} ${e.detail ?? ""}`.toLowerCase();
                  if (!haystack.includes(q)) return false;
                }
                // Date range filter
                if (bounds.from || bounds.to) {
                  if (!e.sortDate) return false;
                  if (bounds.from && e.sortDate < bounds.from) return false;
                  if (bounds.to && e.sortDate > bounds.to) return false;
                }
                return true;
              });

              const hasAnyFilter = tlSearch || typeFilterVals.length > 0 || (tlFilterValues["activityDate"]?.length ?? 0) > 0;
              const clampedTlPage = Math.max(1, Math.min(tlPage, Math.ceil(filtered.length / tlRowsPerPage) || 1));
              const tlStart = (clampedTlPage - 1) * tlRowsPerPage;
              const paginatedEvents = filtered.slice(tlStart, tlStart + tlRowsPerPage);
              return (
                <>
                  {/* Search bar */}
                  <TextInput
                    placeholder="Search timeline…"
                    leftSection={<Search size={14} style={{ color: TV.textSecondary }} />}
                    value={tlSearch}
                    onChange={e => setTlSearch(e.currentTarget.value)}
                    radius="xl"
                    size="sm"
                    mb="sm"
                    styles={{ input: { borderColor: TV.borderLight, backgroundColor: TV.surface } }}
                    rightSection={tlSearch ? (
                      <ActionIcon variant="subtle" size="xs" radius="xl" onClick={() => setTlSearch("")} aria-label="Clear search">
                        <X size={12} />
                      </ActionIcon>
                    ) : null}
                  />

                  {/* Shared FilterBar for type + date */}
                  <div className="mb-3">
                    <FilterBar
                      filters={ACTIVITY_TIMELINE_FILTERS}
                      activeFilterKeys={tlActiveFilterKeys}
                      filterValues={tlFilterValues}
                      onFilterValuesChange={setTlFilterValues}
                      onActiveFilterKeysChange={setTlActiveFilterKeys}
                    />
                  </div>

                  {/* Results count */}
                  {hasAnyFilter && (
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <Text fz={11} c={TV.textSecondary}>
                        Showing {filtered.length} of {allEvents.length} event{allEvents.length !== 1 ? "s" : ""}
                      </Text>
                    </div>
                  )}

                  {/* Timeline */}
                  {allEvents.length === 0 ? (
                    <Text fz={14} c={TV.textSecondary}>No activity yet.</Text>
                  ) : filtered.length === 0 ? (
                    <Box bg={TV.surface} p="xl" style={{ borderRadius: 12 }} className="text-center">
                      <Search size={28} style={{ color: TV.textSecondary, margin: "0 auto 8px" }} />
                      <Text fz={14} fw={600} c={TV.textPrimary} mb={4}>No matching events</Text>
                      <Text fz={12} c={TV.textSecondary}>Try adjusting your search, date range, or type filters.</Text>
                    </Box>
                  ) : (
                    <>
                      <div className="relative">
                        <div className="absolute left-[17px] top-4 bottom-4 w-px bg-tv-border-light" />
                        <Stack gap={0}>
                          {paginatedEvents.map((e, i) => {
                            const typeInfo = ACTIVITY_TYPES.find(t => t.key === e.type);
                            return (
                              <div key={i} className="flex items-start gap-4 py-3.5 relative">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 z-10 ${e.color}`}>
                                  <e.icon size={15} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <Text fz={14} fw={600} c={TV.textPrimary}>{e.label}</Text>
                                    {typeInfo && (
                                      <Badge size="xs" variant="light" color={typeInfo.color}>{typeInfo.label}</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-[3px] flex-wrap">
                                    <Text fz={12} c={TV.textSecondary}>{e.time}</Text>
                                    {e.campaign && <Text fz={12} c={TV.textBrand}>· {e.campaign}</Text>}
                                    {e.channel && <Text fz={11} c={TV.textSecondary}>· via {e.channel}</Text>}
                                  </div>
                                  {e.detail && (
                                    <Text fz={11} c={TV.textSecondary} mt={2}>{e.detail}</Text>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </Stack>
                      </div>
                      <TablePagination
                        page={clampedTlPage}
                        rowsPerPage={tlRowsPerPage}
                        totalRows={filtered.length}
                        onPageChange={setTlPage}
                        onRowsPerPageChange={setTlRowsPerPage}
                      />
                    </>
                  )}
                </>
              );
            })()}
          </DashCard>
        </Tabs.Panel>

        {/* ── Campaign History tab ── */}
        <Tabs.Panel value="campaigns">
          <DashCard className="p-0 sm:p-0 overflow-hidden">
            {sends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 bg-tv-brand-tint rounded-full flex items-center justify-center">
                  <Send size={24} className="text-tv-brand" />
                </div>
                <Text fz={15} fw={600} c={TV.textPrimary}>No campaigns yet</Text>
                <Text fz={13} c={TV.textSecondary}>This contact hasn't been included in any campaigns.</Text>
              </div>
            ) : (() => {
              const q = campSearch.toLowerCase();
              const statusFilter = campFilterValues["campStatus"] ?? [];
              const typeFilter = campFilterValues["campType"] ?? [];
              const channelFilter = campFilterValues["campChannel"] ?? [];
              const filtered = sends.filter(s => {
                if (statusFilter.length > 0 && !statusFilter.includes(s.status)) return false;
                if (typeFilter.length > 0 && !typeFilter.includes(s.type)) return false;
                if (channelFilter.length > 0 && !channelFilter.includes(s.channel)) return false;
                if (q && !(s.campaign.toLowerCase().includes(q) || s.sender.toLowerCase().includes(q) || s.type.toLowerCase().includes(q) || s.channel.toLowerCase().includes(q) || s.status.toLowerCase().includes(q))) return false;
                return true;
              });
              const parseSimpleDate = (d: string) => new Date(d.replace(/,.*/, "") + ", 2025");
              const sorted = sortRows(filtered, campSort, (row, key) => {
                if (key === "date") return parseSimpleDate(row.sentAt).getTime();
                if (key === "status") return row.status;
                if (key === "type") return row.type;
                return row.engagementScore;
              });
              const clampedCampPage = Math.max(1, Math.min(campPage, Math.ceil(sorted.length / campRowsPerPage) || 1));
              const campStart = (clampedCampPage - 1) * campRowsPerPage;
              const paginatedCamps = sorted.slice(campStart, campStart + campRowsPerPage);
              return (
                <>
                  {/* Search bar + FilterBar */}
                  <div className="px-5 py-3 border-b border-tv-border-divider">
                    <div className="flex items-center gap-2 mb-2">
                      <TextInput
                        placeholder="Search campaigns…"
                        leftSection={<Search size={14} />}
                        value={campSearch}
                        onChange={e => setCampSearch(e.currentTarget.value)}
                        size="xs"
                        radius="xl"
                        className="flex-1"
                        styles={{ input: { backgroundColor: TV.surface, borderColor: TV.borderLight } }}
                        aria-label="Search campaigns"
                      />
                      <ColumnsButton onClick={() => setShowCampHistEditCols(true)} />
                    </div>
                    <FilterBar
                      filters={CAMPAIGN_HISTORY_FILTERS}
                      activeFilterKeys={campActiveFilterKeys}
                      filterValues={campFilterValues}
                      onFilterValuesChange={setCampFilterValues}
                      onActiveFilterKeysChange={setCampActiveFilterKeys}
                    />
                    <Text fz={12} c={TV.textSecondary} mt="xs">
                      {sorted.length} of {sends.length} campaign{sends.length !== 1 ? "s" : ""}
                    </Text>
                  </div>

                  {/* Desktop table */}
                  <div className="hidden md:block max-h-[60vh] overflow-y-auto">
                    <div className="sticky top-0 z-20 gap-3 px-5 py-3.5 bg-tv-surface-muted border-b border-tv-border-divider"
                      style={{ display: "grid", gridTemplateColumns: campHistActiveCols.map(() => "1fr").join(" ") }}>
                      {campHistActiveCols.map(colKey => {
                        const col = CAMP_HIST_ALL_COLUMNS.find(c => c.key === colKey);
                        if (!col) return null;
                        const sortKeyMap: Record<string, string> = { status: "status", score: "score", sentAt: "date" };
                        const sortKey = sortKeyMap[colKey];
                        return sortKey ? (
                          <SortableHeader key={colKey} label={col.label} sortKey={sortKey} currentSort={campSort.key} currentDir={campSort.dir} onSort={handleCampSort} />
                        ) : (
                          <Text key={colKey} fz={11} fw={600} tt="uppercase" lts="0.04em" c={TV.textSecondary} className="whitespace-nowrap">{col.label}</Text>
                        );
                      })}
                    </div>
                    {sorted.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-2">
                        <Search size={20} style={{ color: TV.textSecondary }} />
                        <Text fz={13} c={TV.textSecondary}>No campaigns match "{campSearch}"</Text>
                      </div>
                    ) : paginatedCamps.map(send => {
                      const sc = STATUS_COLOR[send.status] ?? { bg: TV.surface, text: TV.textSecondary };
                      return (
                        <div key={send.id} className="gap-3 px-5 py-4 border-b border-tv-border-divider last:border-b-0 hover:bg-tv-surface-muted transition-colors items-center"
                          style={{ display: "grid", gridTemplateColumns: campHistActiveCols.map(() => "1fr").join(" ") }}>
                          {campHistActiveCols.map(colKey => (
                            <div key={colKey}>
                              {colKey === "campaign" ? (
                                <div className="min-w-0">
                                  <Text fz={14} fw={600} c={TV.textPrimary} truncate>{send.campaign}</Text>
                                  <Text fz={12} c={TV.textSecondary}>{send.type}</Text>
                                </div>
                              ) : colKey === "sender" ? (
                                <Text fz={13} c={TV.textSecondary} truncate>{send.sender}</Text>
                              ) : colKey === "channel" ? (
                                <div className="flex items-center gap-1">
                                  {(() => { const Icon = CHANNEL_ICON[send.channel] || Globe; return <Icon size={13} style={{ color: TV.textBrand }} />; })()}
                                  <Text fz={12} c={TV.textSecondary}>{send.channel}</Text>
                                </div>
                              ) : colKey === "status" ? (
                                <Badge size="sm" radius="xl" styles={{ root: { backgroundColor: sc.bg, color: sc.text } }}>{send.status}</Badge>
                              ) : colKey === "viewRate" ? (
                                <Text fz={13} fw={600} c={TV.textPrimary}>{send.viewRate}%</Text>
                              ) : colKey === "watchPct" ? (
                                <Text fz={13} fw={600} c={TV.textPrimary}>{send.watchPct}%</Text>
                              ) : colKey === "score" ? (
                                <Text fz={14} fw={900} className="font-display" c={send.engagementScore >= 70 ? TV.success : send.engagementScore >= 40 ? TV.warning : TV.danger}>
                                  {send.engagementScore}
                                </Text>
                              ) : colKey === "sentAt" ? (
                                <Text fz={12} c={TV.textSecondary}>{send.sentAt.split(",")[0]}</Text>
                              ) : (
                                <Text fz={12} c={TV.textSecondary}>—</Text>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden">
                    {/* Mobile sort controls */}
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-tv-border-divider">
                      <Text fz={11} c={TV.textLabel} fw={600}>Sort:</Text>
                      {[{ key: "date", label: "Sent" }, { key: "status", label: "Status" }, { key: "type", label: "Type" }, { key: "score", label: "Score" }].map(col => (
                        <Badge
                          component="button"
                          type="button"
                          key={col.key}
                          size="sm"
                          radius="xl"
                          variant={campSort.key === col.key ? "filled" : "light"}
                          color="tvPurple"
                          className="cursor-pointer select-none"
                          onClick={() => handleCampSort(col.key)}
                        >
                          {col.label}
                          {campSort.key === col.key && <span className="ml-1">{campSort.dir === "asc" ? "↑" : "↓"}</span>}
                        </Badge>
                      ))}
                    </div>
                    <div className="divide-y divide-tv-border-divider">
                      {sorted.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2">
                          <Search size={20} style={{ color: TV.textSecondary }} />
                          <Text fz={13} c={TV.textSecondary}>No campaigns match "{campSearch}"</Text>
                        </div>
                      ) : paginatedCamps.map(send => {
                        const sc = STATUS_COLOR[send.status] ?? { bg: TV.surface, text: TV.textSecondary };
                        return (
                          <div key={send.id} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Text fz={14} fw={600} c={TV.textPrimary}>{send.campaign}</Text>
                              <Badge size="sm" radius="xl" styles={{ root: { backgroundColor: sc.bg, color: sc.text } }}>{send.status}</Badge>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap">
                              <Text fz={12} c={TV.textLabel}>Type: <b style={{ color: TV.textPrimary }}>{send.type}</b></Text>
                              <Text fz={12} c={TV.textLabel}>View: <b style={{ color: TV.textPrimary }}>{send.viewRate}%</b></Text>
                              <Text fz={12} c={TV.textLabel}>Watch: <b style={{ color: TV.textPrimary }}>{send.watchPct}%</b></Text>
                              <Text fz={12} c={TV.textLabel}>Score: <b style={{ color: TV.textPrimary }}>{send.engagementScore}</b></Text>
                              <Text fz={12} c={TV.textSecondary}>{send.sentAt}</Text>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {sorted.length > 0 && (
                    <TablePagination
                      page={clampedCampPage}
                      rowsPerPage={campRowsPerPage}
                      totalRows={sorted.length}
                      onPageChange={setCampPage}
                      onRowsPerPageChange={setCampRowsPerPage}
                    />
                  )}
                  {showCampHistEditCols && (
                    <EditColumnsModal columns={CAMP_HIST_ALL_COLUMNS} active={campHistActiveCols}
                      onClose={() => setShowCampHistEditCols(false)} onSave={setCampHistActiveCols} />
                  )}
                </>
              );
            })()}
          </DashCard>
        </Tabs.Panel>

        {/* ── Engagement tab ── */}
        <Tabs.Panel value="engagement">
          <Stack gap="md">
            {/* ── Per-send engagement cards ── */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              {sends.map(send => {
                const ChIcon = CHANNEL_ICON[send.channel] || Globe;
                const tvMatch = tvInteractions.find(t => t.campaign === send.campaign);
                const giftMatch = givingEvents.find(g => g.campaign === send.campaign);
                return (
                  <DashCard key={send.id} className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <Text fz={15} fw={700} c={TV.textPrimary}>{send.campaign}</Text>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge size="sm" variant="light" color={send.channel === "Email" ? "tvPurple" : send.channel === "SMS" ? "green" : "blue"} leftSection={<ChIcon size={10} />}>
                            {send.channel}
                          </Badge>
                          <Text fz={12} c={TV.textSecondary}>{send.sentAt}</Text>
                        </div>
                      </div>
                      <Text fz={26} fw={900} className="font-display" c={send.engagementScore >= 70 ? TV.success : send.engagementScore >= 40 ? TV.warning : TV.danger}>
                        {send.engagementScore}
                      </Text>
                    </div>

                    {/* Metrics grid */}
                    <SimpleGrid cols={3} spacing="xs" mb="md">
                      {[
                        { label: "View Rate", value: `${send.viewRate}%`, icon: Eye, met: send.viewRate >= 70 },
                        { label: "% Watched", value: `${send.watchPct}%`, icon: Film, met: send.watchPct >= 60 },
                        { label: "CTA Click", value: send.ctaClicked ? "Yes" : "No", icon: MousePointerClick, met: send.ctaClicked },
                        { label: "Replied", value: send.replyRate ? "Yes" : "No", icon: MessageSquare, met: send.replyRate },
                        { label: "Shared", value: send.shared ? "Yes" : "No", icon: Share2, met: send.shared },
                        { label: "Downloaded", value: send.downloaded ? "Yes" : "No", icon: Download, met: send.downloaded },
                      ].map(m => (
                        <Box key={m.label} bg={TV.surface} p="sm" style={{ borderRadius: 12, border: `1px solid ${m.met ? TV.borderLight : TV.borderDivider}` }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <m.icon size={13} style={{ color: TV.textBrand }} />
                            {m.met ? <CircleCheckBig size={12} className="text-tv-success" /> : <CircleAlert size={12} className="text-tv-text-decorative" />}
                          </div>
                          <Text fz={16} fw={900} c={TV.textPrimary} className="font-display">{m.value}</Text>
                          <Text fz={11} c={TV.textLabel} mt={2}>{m.label}</Text>
                        </Box>
                      ))}
                    </SimpleGrid>

                    {/* Watch depth */}
                    <Box bg={TV.surface} p="md" style={{ borderRadius: 12 }} mb="sm">
                      <div className="flex items-center justify-between mb-1.5">
                        <Text fz={11} c={TV.textLabel} fw={600}>Watch Depth</Text>
                        <Text fz={11} c={TV.textLabel}>{send.watchTime} / {send.videoDuration}</Text>
                      </div>
                      <div className="h-2.5 bg-tv-border-light rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-tv-brand to-tv-info rounded-full" style={{ width: `${send.watchPct}%` }} />
                      </div>
                    </Box>

                    {/* ThankView landing page data for this campaign */}
                    {tvMatch && (
                      <Box bg={TV.brandTint} p="sm" style={{ borderRadius: 12, border: `1px solid ${TV.border}` }} mb="sm">
                        <div className="flex items-center gap-1.5 mb-2">
                          <ExternalLink size={12} style={{ color: TV.brand }} />
                          <Text fz={10} fw={700} c={TV.brand} tt="uppercase" lts="0.04em">ThankView Page</Text>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Views</Text>
                            <Text fz={14} fw={800} c={TV.textPrimary} className="font-display">{tvMatch.landingPageViews}</Text>
                          </div>
                          <div>
                            <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Plays</Text>
                            <Text fz={14} fw={800} c={TV.textPrimary} className="font-display">{tvMatch.videoPlaysOnPage}</Text>
                          </div>
                          <div>
                            <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>CTA</Text>
                            <Text fz={14} fw={800} c={TV.textPrimary} className="font-display">{tvMatch.ctaClicksOnPage}</Text>
                          </div>
                          <div>
                            <Text fz={9} c={TV.textLabel} tt="uppercase" fw={600}>Time</Text>
                            <Text fz={14} fw={800} c={TV.textPrimary} className="font-display">{tvMatch.avgTimeOnPage}</Text>
                          </div>
                        </div>
                      </Box>
                    )}

                    {/* Attributed gift for this campaign */}
                    {giftMatch && (
                      <Box bg={TV.successBg} p="sm" style={{ borderRadius: 12, border: `1px solid ${TV.successBorder}` }} mb="sm">
                        <div className="flex items-center gap-2">
                          <DollarSign size={13} style={{ color: TV.success }} />
                          <Text fz={13} fw={800} c={TV.success}>{giftMatch.amount}</Text>
                          <Badge size="xs" variant="light" color={GIVING_TYPE_LABEL[giftMatch.type]?.color ?? "gray"}>
                            {GIVING_TYPE_LABEL[giftMatch.type]?.label ?? giftMatch.type}
                          </Badge>
                          <Text fz={10} c={TV.textSecondary} ml="auto">{giftMatch.date} · {giftMatch.channel}</Text>
                        </div>
                      </Box>
                    )}

                    {/* Notes */}
                    {send.notes && (
                      <Text fz={13} c={TV.textSecondary} style={{ lineHeight: 1.6 }}>{send.notes}</Text>
                    )}
                  </DashCard>
                );
              })}

              {sends.length === 0 && (
                <DashCard className="p-10 col-span-full text-center">
                  <Text fz={15} fw={600} c={TV.textPrimary} mb={4}>No engagement data</Text>
                  <Text fz={13} c={TV.textSecondary}>This constituent hasn't received any campaigns yet.</Text>
                </DashCard>
              )}
            </SimpleGrid>

            {/* ── Giving Events (full-width) ── */}
            {givingEvents.length > 0 && (
              <DashCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign size={15} style={{ color: TV.success }} />
                    <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em">All Giving Events</Text>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Text fz={18} fw={900} c={TV.success} className="font-display">
                      ${givingEvents.reduce((a, g) => a + g.amountNum, 0).toLocaleString()}
                    </Text>
                    <Text fz={11} c={TV.textSecondary}>total</Text>
                  </div>
                </div>

                {/* Attribution banner */}
                {(() => {
                  const att = givingEvents.filter(g => g.attributed);
                  const attAmt = att.reduce((a, g) => a + g.amountNum, 0);
                  const totalAmt = givingEvents.reduce((a, g) => a + g.amountNum, 0);
                  return att.length > 0 ? (
                    <Box bg={TV.successBg} px="md" py="sm" mb="md" style={{ borderRadius: 12, border: `1px solid ${TV.successBorder}` }}>
                      <div className="flex items-center gap-2">
                        <Zap size={14} style={{ color: TV.success }} />
                        <div>
                          <Text fz={13} fw={700} c={TV.success}>
                            ${attAmt.toLocaleString()} attributed to ThankView campaigns
                          </Text>
                          <Text fz={11} c={TV.success}>
                            {Math.round((attAmt / totalAmt) * 100)}% of total giving · {att.length} attributed gift{att.length !== 1 ? "s" : ""} of {givingEvents.length} total
                          </Text>
                        </div>
                      </div>
                    </Box>
                  ) : null;
                })()}

                <Stack gap="sm">
                  {givingEvents.map((g, i) => {
                    const gType = GIVING_TYPE_LABEL[g.type] ?? { label: g.type, color: "gray" };
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ backgroundColor: TV.surface }}>
                        <Box w={36} h={36} bg={g.attributed ? TV.successBg : TV.surfaceMuted} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <DollarSign size={16} style={{ color: g.attributed ? TV.success : TV.textSecondary }} />
                        </Box>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Text fz={16} fw={900} c={TV.textPrimary} className="font-display">{g.amount}</Text>
                            <Badge size="xs" variant="light" color={gType.color}>{gType.label}</Badge>
                            {g.attributed && <Badge size="xs" variant="light" color="green" leftSection={<Zap size={8} />}>Attributed</Badge>}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Text fz={11} c={TV.textSecondary}>{g.date}</Text>
                            <Text fz={11} c={TV.textSecondary}>·</Text>
                            <Text fz={11} c={TV.textSecondary}>{g.channel}</Text>
                            {g.campaign !== "—" && (
                              <>
                                <Text fz={11} c={TV.textSecondary}>·</Text>
                                <Text fz={11} c={TV.textBrand}>{g.campaign}</Text>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </Stack>
              </DashCard>
            )}
          </Stack>
        </Tabs.Panel>

        {/* ── Giving History tab ── */}
        <Tabs.Panel value="giving">
          <GivingHistoryPanel givingEvents={givingEvents} contactName={`${contact.first} ${contact.last}`} />
        </Tabs.Panel>
      </Tabs>

      {/* Delete modal */}
      {showDelete && (
        <DeleteModal
          opened
          title={`Delete "${contact.first} ${contact.last}"?`}
          onConfirm={() => {
            setShowDelete(false);
            show("Constituent deleted", "success");
            navigate("/contacts");
          }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </Box>
  );
}