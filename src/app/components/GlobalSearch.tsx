import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  Box, Text, Stack, UnstyledButton, Avatar,
  Badge, Menu, ActionIcon, Kbd, ScrollArea,
} from "@mantine/core";
import {
  Search, X, ChevronDown, Mail, Video, Send,
  Phone, RefreshCw, MessageSquare, Eye, MousePointerClick,
  Users, List, Filter, FileText, LayoutTemplate, Image,
  PlayCircle, Clapperboard, Package,
} from "lucide-react";
import { TV } from "../theme";
import { INIT_CONTACTS } from "../data/contacts";

// ═══════════════════════════════════════════════════════════════════════════════
// DATA: Every searchable entity mirrored from actual app pages
// ═══════════════════════════════════════════════════════════════════════════════

// ── Contacts (derived from shared INIT_CONTACTS data store) ─────────────────────

interface SearchContact {
  id: number; first: string; last: string; email: string; phone: string;
  affiliation: string; remoteId: string; company: string; title: string;
  avatar: string; color: string; tags: string[];
  city: string; state: string; givingLevel: string;
  customFields: Record<string, string>;
}

const SEARCH_CONTACTS: SearchContact[] = INIT_CONTACTS.map(c => ({
  id: c.id, first: c.first, last: c.last, email: c.email, phone: c.phone,
  affiliation: c.affiliation, remoteId: c.remoteId, company: c.company,
  title: c.title, avatar: c.avatar, color: c.color, tags: c.tags,
  city: c.city, state: c.state, givingLevel: c.givingLevel,
  customFields: c.customFields,
}));

// ── Campaigns (mirrors CAMPAIGNS in CampaignsList.tsx) ────────────────────────

interface SearchCampaign {
  id: number; name: string; type: string; status: string;
  channel: string; sendDate: string; sent: number; openRate: string; creator: string;
}

const SEARCH_CAMPAIGNS: SearchCampaign[] = [
  { id: 1, name: "Spring Annual Fund Appeal", type: "Solicitation", status: "Sent", channel: "Email", sendDate: "Feb 14, 2026", sent: 142, openRate: "82.4%", creator: "Kelley Molt" },
  { id: 2, name: "Thank You – Multi-Step 2.0", type: "Thank You", status: "Sent", channel: "Email", sendDate: "Feb 10, 2026", sent: 9, openRate: "77.8%", creator: "Kelley Molt" },
  { id: 3, name: "Board Member Appreciation", type: "Thank You", status: "Scheduled", channel: "Email", sendDate: "Feb 28, 2026", sent: 0, openRate: "—", creator: "James Okafor" },
  { id: 4, name: "New Student Welcome Series", type: "Update", status: "Draft", channel: "Email", sendDate: "—", sent: 0, openRate: "—", creator: "Michelle Park" },
  { id: 5, name: "Major Gift Cultivation – Q1", type: "Solicitation", status: "Sent", channel: "SMS", sendDate: "Jan 30, 2026", sent: 34, openRate: "91.2%", creator: "Kelley Molt" },
  { id: 6, name: "Alumni Weekend 2026 Save the Date", type: "Event", status: "Archived", channel: "Email", sendDate: "Jan 15, 2026", sent: 504, openRate: "68.3%", creator: "James Okafor" },
  { id: 7, name: "Matching Gift Challenge", type: "Solicitation", status: "Draft", channel: "Email", sendDate: "—", sent: 0, openRate: "—", creator: "Kelley Molt" },
  { id: 8, name: "Scholarship Endowment Report 2025", type: "Endowment Report", status: "Sent", channel: "Email", sendDate: "Dec 5, 2025", sent: 891, openRate: "74.1%", creator: "Kelley Molt" },
  { id: 9, name: "Reunion Giving Challenge", type: "Solicitation", status: "Scheduled", channel: "Email", sendDate: "Mar 10, 2026", sent: 0, openRate: "—", creator: "Michelle Park" },
  { id: 10, name: "Phonathon Follow-Up Drip", type: "Thank You", status: "Sent", channel: "SMS", sendDate: "Jan 22, 2026", sent: 66, openRate: "88.5%", creator: "Kelley Molt" },
  { id: 11, name: "Student Video Testimonials", type: "Video Request", status: "Sent", channel: "Shareable Link", sendDate: "Feb 3, 2026", sent: 237, openRate: "61.8%", creator: "Michelle Park" },
];

// ── Videos (mirrors INITIAL_VIDEOS in VideoLibrary.tsx) ───────────────────────

interface SearchVideo {
  id: number; title: string; creator: string; date: string;
  duration: string; folder: string; tags: string[];
  description: string; recipient: string; archived: boolean; favorited: boolean;
}

const SEARCH_VIDEOS: SearchVideo[] = [
  { id: 1, title: "Welcome Message – Class of 2026", creator: "Kelley Molt", date: "Feb 14, 2026", duration: "0:42", folder: "Thank You Videos", tags: ["welcome", "2026"], description: "Warm welcome video for incoming class.", recipient: "", archived: false, favorited: true },
  { id: 2, title: "Annual Fund Thank You", creator: "Emma Chen", date: "Feb 10, 2026", duration: "1:08", folder: "Thank You Videos", tags: ["thank-you", "annual-fund"], description: "Thanks to annual fund donors.", recipient: "Margaret Williams", archived: false, favorited: false },
  { id: 3, title: "Campaign Kick-off – Spring 2026", creator: "David Ross", date: "Feb 6, 2026", duration: "0:55", folder: "Solicitation 2025", tags: ["campaign"], description: "Spring solicitation kick-off announcement.", recipient: "", archived: false, favorited: false },
  { id: 4, title: "Personal Outreach – Major Donors", creator: "Kelley Molt", date: "Jan 28, 2026", duration: "1:22", folder: "Thank You Videos", tags: ["major-donors", "outreach"], description: "Personalized outreach to major gift donors.", recipient: "Robert Chen", archived: false, favorited: true },
  { id: 5, title: "Board Member Spotlight", creator: "Sarah Kim", date: "Jan 20, 2026", duration: "2:01", folder: "Solicitation 2025", tags: ["board", "spotlight"], description: "Spotlight interview with board member.", recipient: "", archived: false, favorited: false },
  { id: 6, title: "Matching Gift Challenge", creator: "Emma Chen", date: "Jan 15, 2026", duration: "0:38", folder: "Replies", tags: ["matching"], description: "", recipient: "", archived: false, favorited: false },
  { id: 7, title: "Scholarship Impact Story 2025", creator: "David Ross", date: "Jan 10, 2026", duration: "1:45", folder: "Solicitation 2025", tags: ["scholarship", "impact"], description: "Impact story from scholarship recipients.", recipient: "", archived: false, favorited: false },
  { id: 8, title: "New Student Orientation Welcome", creator: "Sarah Kim", date: "Dec 20, 2025", duration: "0:30", folder: "Thank You Videos", tags: ["orientation", "welcome"], description: "Welcome video for orientation.", recipient: "", archived: true, favorited: false },
  { id: 9, title: "Reply – Jane D. Thank You", creator: "Jane Doe", date: "Dec 12, 2025", duration: "0:18", folder: "Replies", tags: ["reply"], description: "Reply video from campaign recipient.", recipient: "", archived: false, favorited: false },
];

// ── Interactions ───────────────────────────────────────────────────────────────

interface SearchInteraction {
  id: number;
  type: "email" | "video_view" | "reply" | "sms" | "landing_page";
  contactFirst: string; contactLast: string; contactId: number;
  campaignName: string; campaignId: number;
  subject: string; preview: string; date: string;
}

const SEARCH_INTERACTIONS: SearchInteraction[] = [
  { id: 1, type: "email", contactFirst: "Derek", contactLast: "Holmes", contactId: 11, campaignName: "Phonathon Follow-Up Drip", campaignId: 10, subject: "Quick Test Email", preview: "Sent the following email: Dear Derek, Here is an email for you. I hope you're doing well. How are your kids, I'm sure they're so grown up now! This is another line in the email. Adding an edit on Se...", date: "08/25/2025" },
  { id: 2, type: "video_view", contactFirst: "Shaylee", contactLast: "O'Keefe", contactId: 1, campaignName: "Spring Annual Fund Appeal", campaignId: 1, subject: "Video Viewed", preview: "Shaylee O'Keefe watched your ThankView video \"Thank You for Your Gift\" (42 seconds, 100% viewed)", date: "02/15/2026" },
  { id: 3, type: "reply", contactFirst: "Tamara", contactLast: "Wunsch", contactId: 5, campaignName: "Major Gift Cultivation – Q1", campaignId: 5, subject: "Reply Received", preview: "Thank you so much for the personal video! It really made my day. I'd love to increase my gift this year...", date: "02/01/2026" },
  { id: 4, type: "email", contactFirst: "Carlos", contactLast: "Lindgren", contactId: 8, campaignName: "Scholarship Endowment Report 2025", campaignId: 8, subject: "Your Endowment Impact Report", preview: "Dear Carlos, Thank you for your continued support of the Lindgren Family Scholarship. This year, your endowment funded 3 student scholarships...", date: "12/06/2025" },
  { id: 5, type: "video_view", contactFirst: "Jared", contactLast: "Legros", contactId: 4, campaignName: "Board Member Appreciation", campaignId: 3, subject: "Video Viewed", preview: "Jared Legros watched your ThankView video \"Board Thank You\" (1:15, 87% viewed)", date: "02/28/2026" },
  { id: 6, type: "sms", contactFirst: "Derek", contactLast: "Holmes", contactId: 11, campaignName: "Phonathon Follow-Up Drip", campaignId: 10, subject: "SMS Sent", preview: "Hi Derek, thanks for chatting during our Phonathon! Here's a video from our students: [link]", date: "01/22/2026" },
  { id: 7, type: "email", contactFirst: "Derek", contactLast: "Washington", contactId: 15, campaignName: "Spring Annual Fund Appeal", campaignId: 1, subject: "Spring Fund Appeal", preview: "Dear Derek, As a valued member of Class of 2005, we invite you to support this year's Annual Fund...", date: "02/14/2026" },
  { id: 8, type: "reply", contactFirst: "Rosalind", contactLast: "Mueller", contactId: 10, campaignName: "Board Member Appreciation", campaignId: 3, subject: "Re: Thank You from Hartwell", preview: "This is so thoughtful! I shared it with the entire foundation board. What a wonderful use of technology.", date: "03/01/2026" },
  { id: 9, type: "landing_page", contactFirst: "Jarvis", contactLast: "Bogan", contactId: 2, campaignName: "Board Member Appreciation", campaignId: 3, subject: "Landing Page Visited", preview: "Jarvis Bogan visited the landing page for \"Board Member Appreciation\" and clicked the donation CTA", date: "02/12/2026" },
  { id: 10, type: "email", contactFirst: "Johnathan", contactLast: "Hicks", contactId: 12, campaignName: "Spring Annual Fund Appeal", campaignId: 1, subject: "Spring Fund Appeal", preview: "Dear Johnathan, Thank you for decades of generosity to Hartwell. Your giving has transformed lives...", date: "02/14/2026" },
];

// ── Lists (mirrors INIT_LISTS in Lists.tsx) ───────────────────────────────────

interface SearchList {
  id: number; name: string; description: string; contactCount: number;
  creator: string; tags: string[]; updatedAt: string; archived: boolean;
}

const SEARCH_LISTS: SearchList[] = [
  { id: 1, name: "Spring Gala Invitees", description: "VIP invite list for the 2026 spring gala event", contactCount: 5, creator: "Kelley Molt", tags: ["Events", "Major Gifts"], updatedAt: "Feb 20, 2026", archived: false },
  { id: 2, name: "Major Donors – Q1 Outreach", description: "High-value donors for personal thank-you campaign", contactCount: 3, creator: "You", tags: ["Major Gifts"], updatedAt: "Feb 18, 2026", archived: false },
  { id: 3, name: "Alumni Phonathon 2025", description: "Alumni targets for fall phonathon", contactCount: 4, creator: "Michelle Park", tags: ["Phonathon", "Alumni"], updatedAt: "Nov 3, 2025", archived: false },
  { id: 4, name: "Board Welcome Package", description: "New board members for welcome video", contactCount: 1, creator: "James Okafor", tags: ["Board"], updatedAt: "Dec 2, 2024", archived: true },
  { id: 5, name: "Lapsed Donors Re-engagement", description: "Donors who haven't given in 18+ months", contactCount: 2, creator: "You", tags: ["Major Gifts"], updatedAt: "Feb 12, 2026", archived: false },
  { id: 6, name: "Student Ambassadors 2024", description: "", contactCount: 5, creator: "Michelle Park", tags: ["Alumni"], updatedAt: "Aug 1, 2024", archived: true },
  { id: 7, name: "Annual Fund Thank You", description: "Donors to thank for annual fund participation", contactCount: 6, creator: "You", tags: ["Annual Fund"], updatedAt: "Feb 25, 2026", archived: false },
  { id: 8, name: "Homecoming Weekend VIPs", description: "Reunion attendees for special outreach", contactCount: 3, creator: "Kelley Molt", tags: ["Events", "Alumni"], updatedAt: "Feb 27, 2026", archived: false },
];

// ── Saved Searches (mirrors INIT_SEARCHES in SavedSearches.tsx) ───────────────

interface SearchSavedSearch {
  id: number; name: string; description: string;
  matchCount: number; creator: string; active: boolean;
}

const SEARCH_SAVED_SEARCHES: SearchSavedSearch[] = [
  { id: 1, name: "Boston-Area Major Donors", description: "Donors in MA with $10k+ total giving", matchCount: 14, creator: "Kelley Molt", active: true },
  { id: 2, name: "Lapsed Donors (18+ months)", description: "Haven't given since Aug 2024", matchCount: 31, creator: "You", active: true },
  { id: 3, name: "High Engagement Alumni", description: "Alumni with 4+ star rating", matchCount: 8, creator: "You", active: true },
  { id: 4, name: "Bounced Emails — Cleanup", description: "Constituents with bounced emails for data hygiene", matchCount: 5, creator: "James Okafor", active: true },
  { id: 5, name: "TX Prospective Donors", description: "Prospective donors located in Texas", matchCount: 12, creator: "Michelle Park", active: false },
  { id: 6, name: "Unsubscribed Constituents", description: "Constituents who opted out of email", matchCount: 19, creator: "You", active: true },
  { id: 7, name: "Class of 2002 – No Phone", description: "2002 alumni missing phone for phonathon prep", matchCount: 4, creator: "You", active: true },
];

// ── Assets: Templates, Envelopes, Landing Pages, Intros, Outros, Images ──────

interface SearchAsset {
  id: number; name: string; assetType: "email_template" | "sms_template" | "envelope" | "landing_page" | "intro" | "outro" | "image";
  category: string; description: string; route: string;
}

const SEARCH_ASSETS: SearchAsset[] = [
  // Email & SMS Templates (from EmailTemplates.tsx)
  { id: 101, name: "Spring Appeal — Thank You", assetType: "email_template", category: "Thank You", description: "A personal thank you, {{first_name}}", route: "/assets/templates" },
  { id: 102, name: "Year-End Giving Reminder", assetType: "email_template", category: "Solicitation", description: "Your year-end gift makes an impact", route: "/assets/templates" },
  { id: 103, name: "New Student Welcome SMS", assetType: "sms_template", category: "Welcome", description: "Welcome to Hartwell", route: "/assets/templates" },
  { id: 104, name: "Event Invitation — Gala 2026", assetType: "email_template", category: "Event", description: "You're invited to the Hartwell Gala", route: "/assets/templates" },
  { id: 105, name: "Scholarship Impact Update", assetType: "email_template", category: "Update", description: "See the impact of your scholarship gift", route: "/assets/templates" },
  { id: 106, name: "Birthday Greeting SMS", assetType: "sms_template", category: "Birthday", description: "Happy birthday greeting", route: "/assets/templates" },
  { id: 107, name: "Donor Anniversary", assetType: "email_template", category: "Anniversary", description: "Thank you for years of giving", route: "/assets/templates" },
  { id: 108, name: "Matching Gift Challenge", assetType: "email_template", category: "Solicitation", description: "Double your impact today", route: "/assets/templates" },

  // Envelope Designs (from EnvelopeDesigns.tsx)
  { id: 201, name: "Hartwell Navy — Formal", assetType: "envelope", category: "Branded", description: "Formal envelope with navy color scheme", route: "/assets/envelopes" },
  { id: 202, name: "Hartwell Gold — Donor", assetType: "envelope", category: "Branded", description: "Gold envelope for donor communications", route: "/assets/envelopes" },
  { id: 203, name: "Heritage Maroon — President", assetType: "envelope", category: "Branded", description: "Presidential office envelope design", route: "/assets/envelopes" },
  { id: 204, name: "Holiday Red — Winter 2025", assetType: "envelope", category: "Holiday", description: "Festive red holiday envelope", route: "/assets/envelopes" },
  { id: 205, name: "Holiday Evergreen", assetType: "envelope", category: "Holiday", description: "Evergreen holiday envelope", route: "/assets/envelopes" },
  { id: 206, name: "Legacy Midnight — Endowment", assetType: "envelope", category: "Legacy", description: "Endowment office envelope", route: "/assets/envelopes" },
  { id: 207, name: "Legacy Slate — Board", assetType: "envelope", category: "Legacy", description: "Board of trustees envelope", route: "/assets/envelopes" },
  { id: 208, name: "True Purple — Default", assetType: "envelope", category: "Branded", description: "Default ThankView purple envelope", route: "/assets/envelopes" },

  // Landing Page Designs (from LandingPageDesigns.tsx)
  { id: 301, name: "Annual Fund Thank You", assetType: "landing_page", category: "Thank You", description: "Give to the Annual Fund", route: "/assets/landing-pages" },
  { id: 302, name: "Scholarship Impact Story", assetType: "landing_page", category: "Impact", description: "Support Scholarships", route: "/assets/landing-pages" },
  { id: 303, name: "New Student Welcome", assetType: "landing_page", category: "Welcome", description: "Watch Welcome Message", route: "/assets/landing-pages" },
  { id: 304, name: "Matching Gift Challenge", assetType: "landing_page", category: "Solicitation", description: "Double My Gift", route: "/assets/landing-pages" },
  { id: 305, name: "Endowment Report Landing", assetType: "landing_page", category: "Report", description: "View Your Report", route: "/assets/landing-pages" },
  { id: 306, name: "Board Thank You", assetType: "landing_page", category: "Thank You", description: "Share Your Thoughts", route: "/assets/landing-pages" },

  // Intros (from IntroLibrary.tsx)
  { id: 401, name: "Welcome — Logo Reveal", assetType: "intro", category: "Logo", description: "Welcome to Hartwell intro", route: "/assets/intros" },
  { id: 402, name: "Annual Fund — Full Frame", assetType: "intro", category: "Full Frame", description: "Your Impact Matters headline", route: "/assets/intros" },
  { id: 403, name: "Scholarship — Tryptic", assetType: "intro", category: "Tryptic", description: "Scholarship Impact intro", route: "/assets/intros" },
  { id: 404, name: "Spring Appeal — Light Leak", assetType: "intro", category: "Light Leak", description: "Spring at Hartwell", route: "/assets/intros" },
  { id: 405, name: "Gala 2026 — Cubed", assetType: "intro", category: "Cubed", description: "You're Invited gala intro", route: "/assets/intros" },
  { id: 406, name: "Clean Minimal — Board", assetType: "intro", category: "Clean", description: "Board of Trustees intro", route: "/assets/intros" },
  { id: 407, name: "Linen Texture — Alumni", assetType: "intro", category: "Linen", description: "Dear Alumni intro", route: "/assets/intros" },
  { id: 408, name: "Holiday — Light Leak", assetType: "intro", category: "Light Leak", description: "Happy Holidays intro", route: "/assets/intros" },
  { id: 409, name: "Donor Welcome — Logo", assetType: "intro", category: "Logo", description: "Thank You for Giving", route: "/assets/intros" },

  // Outros (from OutroLibrary.tsx)
  { id: 501, name: "Thank You — Purple CTA", assetType: "outro", category: "CTA", description: "Thank You for Watching with Give Now CTA", route: "/assets/outros" },
  { id: 502, name: "Hartwell Shield — Branded", assetType: "outro", category: "Branded", description: "Branded outro with Visit Our Website CTA", route: "/assets/outros" },
  { id: 503, name: "Scholarship Impact End", assetType: "outro", category: "CTA", description: "Your Gift Changes Lives with Support Scholarships CTA", route: "/assets/outros" },

  // Images (from ImageLibrary.tsx)
  { id: 601, name: "hartwell_logo_navy.png", assetType: "image", category: "Logo", description: "Navy logo", route: "/assets/images" },
  { id: 602, name: "hartwell_logo_white.png", assetType: "image", category: "Logo", description: "White logo", route: "/assets/images" },
  { id: 603, name: "spring_appeal_header.jpg", assetType: "image", category: "Header", description: "Spring appeal header image", route: "/assets/images" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

type SearchScope = "all" | "contacts" | "campaigns" | "videos" | "interactions" | "lists" | "saved_searches" | "assets";

const SCOPE_OPTIONS: { value: SearchScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "contacts", label: "Constituents" },
  { value: "campaigns", label: "Campaigns" },
  { value: "videos", label: "Videos" },
  { value: "interactions", label: "Interactions" },
  { value: "lists", label: "Lists" },
  { value: "saved_searches", label: "Saved Searches" },
  { value: "assets", label: "Assets" },
];

// Tokenize query into lowercase words
function tokenize(query: string): string[] {
  return query.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

/**
 * Score how well a set of fields matches a list of search tokens.
 *
 * Returns 0 if any token is completely absent (hard requirement).
 * Otherwise returns a relevance score based on:
 *   - Word-boundary matches score higher than substring matches
 *   - Matches in "primary" fields (name) score higher than secondary fields
 *   - Exact full-word matches get a bonus
 *
 * primaryFields: the most important fields (name, title)
 * secondaryFields: supporting fields (email, tags, description, etc.)
 */
function scoreMatch(tokens: string[], primaryFields: string[], secondaryFields: string[]): number {
  const primaryText = primaryFields.join(" ").toLowerCase();
  const secondaryText = secondaryFields.join(" ").toLowerCase();
  const combined = primaryText + " " + secondaryText;

  let score = 0;
  for (const token of tokens) {
    // Token must appear somewhere
    if (!combined.includes(token)) return 0;

    // Word-boundary regex: does the token start at a word boundary?
    const boundaryRegex = new RegExp(`(^|[\\s,;.\\-–—()/])${escapeRegex(token)}`);

    if (boundaryRegex.test(primaryText)) {
      score += 10; // Strong match in primary field
      // Exact full-word match bonus
      const exactWord = new RegExp(`(^|[\\s,;.\\-–—()/])${escapeRegex(token)}($|[\\s,;.\\-–—()/])`);
      if (exactWord.test(primaryText)) score += 5;
    } else if (primaryText.includes(token)) {
      score += 6; // Substring match in primary
    } else if (boundaryRegex.test(secondaryText)) {
      score += 4; // Word-boundary match in secondary
    } else {
      score += 2; // Substring match in secondary
    }
  }

  return score;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Typed scored result
interface ScoredResult<T> {
  item: T;
  score: number;
}

function topScored<T>(items: T[], scorer: (item: T) => number, limit: number): ScoredResult<T>[] {
  const scored: ScoredResult<T>[] = [];
  for (const item of items) {
    const s = scorer(item);
    if (s > 0) scored.push({ item, score: s });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit);
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS: icons & labels
// ═══════════════════════════════════════════════════════════════════════════════

function InteractionIcon({ type }: { type: SearchInteraction["type"] }) {
  const sz = 16;
  switch (type) {
    case "email": return <Mail size={sz} />;
    case "video_view": return <Eye size={sz} />;
    case "reply": return <MessageSquare size={sz} />;
    case "sms": return <Phone size={sz} />;
    case "landing_page": return <MousePointerClick size={sz} />;
  }
}

function interactionLabel(type: SearchInteraction["type"]) {
  switch (type) {
    case "email": return "Email";
    case "video_view": return "Video View";
    case "reply": return "Reply";
    case "sms": return "SMS";
    case "landing_page": return "Landing Page";
  }
}

const ASSET_TYPE_LABEL: Record<string, string> = {
  email_template: "Email Template",
  sms_template: "SMS Template",
  envelope: "Envelope Design",
  landing_page: "Landing Page",
  intro: "Intro",
  outro: "Outro",
  image: "Image",
};

function AssetIcon({ type }: { type: string }) {
  const sz = 16;
  switch (type) {
    case "email_template": return <Mail size={sz} />;
    case "sms_template": return <Phone size={sz} />;
    case "envelope": return <Package size={sz} />;
    case "landing_page": return <LayoutTemplate size={sz} />;
    case "intro": return <PlayCircle size={sz} />;
    case "outro": return <Clapperboard size={sz} />;
    case "image": return <Image size={sz} />;
    default: return <FileText size={sz} />;
  }
}

const STATUS_COLOR: Record<string, string> = {
  Sent: "green", Scheduled: "cyan", Draft: "tvPurple", Archived: "gray",
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function GlobalSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [open, setOpen] = useState(false);
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const tokens = useMemo(() => tokenize(query), [query]);
  const hasQuery = tokens.length > 0;

  // ── Scoped search helpers ─────────────────────────────────────────────────
  const inScope = (s: SearchScope) => scope === "all" || scope === s;

  // ── Scored results per category ───────────────────────────────────────────

  const contactResults = useMemo(() => {
    if (!hasQuery || !inScope("contacts")) return [];
    return topScored(SEARCH_CONTACTS, c => scoreMatch(
      tokens,
      [c.first, c.last, c.first + " " + c.last],
      [c.email, c.phone, c.company, c.title, c.affiliation, c.remoteId, c.city, c.state, c.givingLevel, ...c.tags, ...Object.values(c.customFields)]
    ), 4);
  }, [tokens, hasQuery, scope]);

  const campaignResults = useMemo(() => {
    if (!hasQuery || !inScope("campaigns")) return [];
    return topScored(SEARCH_CAMPAIGNS, c => scoreMatch(
      tokens,
      [c.name],
      [c.type, c.status, c.creator, c.channel, c.sendDate]
    ), 3);
  }, [tokens, hasQuery, scope]);

  const videoResults = useMemo(() => {
    if (!hasQuery || !inScope("videos")) return [];
    return topScored(SEARCH_VIDEOS, v => scoreMatch(
      tokens,
      [v.title],
      [v.creator, v.folder, v.description, v.recipient, ...v.tags]
    ), 3);
  }, [tokens, hasQuery, scope]);

  const interactionResults = useMemo(() => {
    if (!hasQuery || !inScope("interactions")) return [];
    return topScored(SEARCH_INTERACTIONS, i => scoreMatch(
      tokens,
      [i.contactFirst + " " + i.contactLast, i.subject],
      [i.contactFirst, i.contactLast, i.campaignName, i.preview, i.date]
    ), 3);
  }, [tokens, hasQuery, scope]);

  const listResults = useMemo(() => {
    if (!hasQuery || !inScope("lists")) return [];
    return topScored(SEARCH_LISTS, l => scoreMatch(
      tokens,
      [l.name],
      [l.description, l.creator, ...l.tags]
    ), 3);
  }, [tokens, hasQuery, scope]);

  const savedSearchResults = useMemo(() => {
    if (!hasQuery || !inScope("saved_searches")) return [];
    return topScored(SEARCH_SAVED_SEARCHES, s => scoreMatch(
      tokens,
      [s.name],
      [s.description, s.creator]
    ), 3);
  }, [tokens, hasQuery, scope]);

  const assetResults = useMemo(() => {
    if (!hasQuery || !inScope("assets")) return [];
    return topScored(SEARCH_ASSETS, a => scoreMatch(
      tokens,
      [a.name],
      [a.description, a.category, ASSET_TYPE_LABEL[a.assetType] || ""]
    ), 4);
  }, [tokens, hasQuery, scope]);

  const totalResults = contactResults.length + campaignResults.length + videoResults.length +
    interactionResults.length + listResults.length + savedSearchResults.length + assetResults.length;

  const handleNavigate = useCallback((path: string) => {
    setOpen(false);
    setQuery("");
    navigate(path);
  }, [navigate]);

  const quotedTokens = tokens.map(t => `"${t}"`).join(" and ");

  // ── Section rendering helpers ─────────────────────────────────────────────

  function SectionHeader({ title, count, linkLabel, linkTo }: { title: string; count: number; linkLabel: string; linkTo: string }) {
    return (
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
        <div className="flex items-center gap-1.5">
          <Text fz={12} fw={700} c={TV.textPrimary}>{title}</Text>
          <Text fz={11} c={TV.textSecondary}>({count})</Text>
        </div>
        <UnstyledButton onClick={() => handleNavigate(linkTo)}>
          <Text fz={12} fw={600} c={TV.textBrand} className="hover:underline">{linkLabel}</Text>
        </UnstyledButton>
      </div>
    );
  }

  function ResultRow({ icon, onClick, children }: { icon: React.ReactNode; onClick: () => void; children: React.ReactNode }) {
    return (
      <UnstyledButton w="100%" px="md" py="sm" onClick={onClick}
        className="hover:bg-tv-surface-muted transition-colors"
      >
        <div className="flex gap-3 flex-nowrap items-start">
          {icon}
          <Box style={{ flex: 1, minWidth: 0 }}>{children}</Box>
        </div>
      </UnstyledButton>
    );
  }

  function CircleIcon({ children }: { children: React.ReactNode }) {
    return (
      <Box className="shrink-0 flex items-center justify-center" mt={4}
        style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: TV.surface, color: TV.textBrand }}>
        {children}
      </Box>
    );
  }

  // Compute which sections are visible (for border-top logic)
  const visibleSections = useMemo(() => {
    const s: string[] = [];
    if (contactResults.length > 0) s.push("contacts");
    if (interactionResults.length > 0) s.push("interactions");
    if (campaignResults.length > 0) s.push("campaigns");
    if (videoResults.length > 0) s.push("videos");
    if (listResults.length > 0) s.push("lists");
    if (savedSearchResults.length > 0) s.push("saved_searches");
    if (assetResults.length > 0) s.push("assets");
    return s;
  }, [contactResults, interactionResults, campaignResults, videoResults, listResults, savedSearchResults, assetResults]);

  const sectionBorder = (key: string) =>
    visibleSections.indexOf(key) > 0 ? `1px solid ${TV.borderLight}` : undefined;

  return (
    <Box ref={containerRef} className="flex-1 relative" style={{ maxWidth: 560 }}>
      <div className="flex items-center" style={{
        border: `1.5px solid ${open && hasQuery ? TV.textBrand : TV.borderLight}`,
        borderRadius: 24,
        backgroundColor: TV.surface,
        transition: "border-color 0.15s",
        overflow: "hidden",
      }}>
        {/* Scope selector */}
        <Menu opened={scopeMenuOpen} onChange={setScopeMenuOpen} shadow="md" width={180} position="bottom-start">
          <Menu.Target>
            <UnstyledButton
              px={12} py={8}
              className="flex items-center gap-1 shrink-0 hover:bg-tv-surface-hover transition-colors"
              style={{ borderRight: `1px solid ${TV.borderLight}` }}
              onClick={() => setScopeMenuOpen(v => !v)}
            >
              <Text fz={12} fw={600} c={TV.textBrand}>
                {SCOPE_OPTIONS.find(s => s.value === scope)?.label}
              </Text>
              <ChevronDown size={12} style={{ color: TV.textBrand }} />
            </UnstyledButton>
          </Menu.Target>
          <Menu.Dropdown>
            {SCOPE_OPTIONS.map(opt => (
              <Menu.Item key={opt.value} fz={13}
                onClick={() => { setScope(opt.value); setScopeMenuOpen(false); inputRef.current?.focus(); }}
                bg={scope === opt.value ? TV.brandTint : undefined}
                c={scope === opt.value ? TV.textBrand : undefined}
              >
                {opt.label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>

        {/* Search input */}
        <Box className="flex-1 flex items-center" pr={8}>
          <Search size={14} style={{ color: TV.textSecondary, marginLeft: 12, flexShrink: 0 }} aria-hidden="true" />
          <input
            ref={inputRef}
            type="text"
            autoComplete="off"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => { if (hasQuery) setOpen(true); }}
            placeholder="Search across ThankView…"
            aria-label="Global search"
            aria-expanded={open && hasQuery}
            style={{
              flex: 1, border: "none", background: "transparent",
              fontSize: 13, color: TV.textPrimary, padding: "8px 8px",
              fontFamily: "Roboto, sans-serif",
            }}
          />
          {query ? (
            <ActionIcon variant="subtle" size={24} radius="xl" color="gray"
              onClick={() => { setQuery(""); setOpen(false); inputRef.current?.focus(); }}
              styles={{ root: { backgroundColor: "transparent" } }}
              aria-label="Clear search"
            >
              <X size={14} style={{ color: TV.textSecondary }} aria-hidden="true" />
            </ActionIcon>
          ) : (
            <Kbd size="xs" style={{ fontSize: 10, color: TV.textSecondary, border: `1px solid ${TV.borderLight}`, background: "white", padding: "1px 6px" }}>⌘K</Kbd>
          )}
        </Box>
      </div>

      {/* ── Dropdown ─────────────────────────────────────────────────────────── */}
      {open && hasQuery && (
        <Box
          style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
            zIndex: 1000, backgroundColor: "white",
            border: `1px solid ${TV.borderLight}`, borderRadius: 12,
            boxShadow: "0 20px 60px -12px rgba(0,0,0,.18), 0 4px 20px -4px rgba(0,0,0,.1)",
            overflow: "hidden",
          }}
        >
          {totalResults === 0 ? (
            <Box p="xl" ta="center">
              <Text fz={13} c={TV.textSecondary}>No results found for {quotedTokens}</Text>
              <Text fz={11} c={TV.textLabel} mt={4}>Try different keywords or broaden your search scope</Text>
            </Box>
          ) : (
            <ScrollArea.Autosize mah={520} type="auto">
              {/* ── Contacts ─────────────────────────────────────────── */}
              {contactResults.length > 0 && (
                <Box key="section-contacts" style={{ borderTop: sectionBorder("contacts") }}>
                  <SectionHeader title="Constituents" count={contactResults.length} linkLabel={`View constituent result${contactResults.length !== 1 ? "s" : ""}`} linkTo="/contacts" />
                  <Stack gap={0}>
                    {contactResults.map(({ item: c }) => (
                      <ResultRow key={c.id} onClick={() => handleNavigate(`/contacts/${c.id}`)}
                        icon={
                          <Avatar size={40} radius="xl" color="tvPurple"
                            styles={{ root: { backgroundColor: c.color, flexShrink: 0, marginTop: 2 } }}>
                            <Text fz={14} fw={700} c="white">{c.avatar}</Text>
                          </Avatar>
                        }
                      >
                        <Text fz={14} fw={700} c={TV.textBrand}>{c.first} {c.last}</Text>
                        <Text fz={12} fw={700} c={TV.textPrimary}>{c.affiliation}</Text>
                        {c.remoteId !== "—" && <Text fz={11} c={TV.textSecondary}>Remote ID: {c.remoteId}</Text>}
                        <Text fz={11} c={TV.textLabel}>Emails: {c.email !== "—" ? c.email : "None on file"}</Text>
                        {c.company && c.company !== "—" && (
                          <Text fz={11} c={TV.textSecondary}>{c.title !== "—" ? `${c.title} at ` : ""}{c.company}</Text>
                        )}
                      </ResultRow>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* ── Interactions ──────────────────────────────────────── */}
              {interactionResults.length > 0 && (
                <Box key="section-interactions" style={{ borderTop: sectionBorder("interactions") }}>
                  <SectionHeader title="Interactions" count={interactionResults.length} linkLabel={`View interaction result${interactionResults.length !== 1 ? "s" : ""}`} linkTo="/analytics" />
                  <Stack gap={0}>
                    {interactionResults.map(({ item: i }) => (
                      <ResultRow key={i.id} onClick={() => handleNavigate(`/contacts/${i.contactId}`)}
                        icon={<CircleIcon><InteractionIcon type={i.type} /></CircleIcon>}
                      >
                        <Text fz={12} c={TV.textLabel}>{interactionLabel(i.type)}</Text>
                        <Text fz={13} fw={700} c={TV.textPrimary}>{i.subject}</Text>
                        <Text fz={12} c={TV.textSecondary} lineClamp={2} style={{ lineHeight: 1.5 }}>{i.preview}</Text>
                        <div className="flex items-center gap-1 mt-0.5">
                          <RefreshCw size={10} style={{ color: TV.textSecondary }} />
                          <Text fz={11} c={TV.textSecondary}>{i.date}</Text>
                        </div>
                      </ResultRow>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* ── Campaigns ────────────────────────────────────────── */}
              {campaignResults.length > 0 && (
                <Box key="section-campaigns" style={{ borderTop: sectionBorder("campaigns") }}>
                  <SectionHeader title="Campaigns" count={campaignResults.length} linkLabel="View all campaigns" linkTo="/campaigns" />
                  <Stack gap={0}>
                    {campaignResults.map(({ item: c }) => (
                      <ResultRow key={c.id} onClick={() => handleNavigate(`/campaigns/${c.id}`)}
                        icon={<CircleIcon><Send size={16} /></CircleIcon>}
                      >
                        <div className="flex items-center gap-2 flex-nowrap">
                          <Text fz={13} fw={700} c={TV.textBrand} truncate>{c.name}</Text>
                          <Badge size="xs" color={STATUS_COLOR[c.status] ?? "gray"} variant="light" radius="xl" className="shrink-0">{c.status}</Badge>
                        </div>
                        <Text fz={11} c={TV.textSecondary}>
                          {c.type} · {c.channel} · {c.sent > 0 ? `${c.sent} sent` : "No sends yet"}{c.openRate !== "—" ? ` · ${c.openRate} open rate` : ""}
                        </Text>
                        <Text fz={11} c={TV.textLabel}>{c.sendDate !== "—" ? c.sendDate : "Not scheduled"} · by {c.creator}</Text>
                      </ResultRow>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* ── Videos ───────────────────────────────────────────── */}
              {videoResults.length > 0 && (
                <Box key="section-videos" style={{ borderTop: sectionBorder("videos") }}>
                  <SectionHeader title="Videos" count={videoResults.length} linkLabel="View all videos" linkTo="/videos" />
                  <Stack gap={0}>
                    {videoResults.map(({ item: v }) => (
                      <ResultRow key={v.id} onClick={() => handleNavigate("/videos")}
                        icon={<CircleIcon><Video size={16} /></CircleIcon>}
                      >
                        <Text fz={13} fw={700} c={TV.textBrand} truncate>{v.title}</Text>
                        <Text fz={11} c={TV.textSecondary}>
                          {v.duration} · {v.folder}{v.recipient ? ` · To: ${v.recipient}` : ""}
                        </Text>
                        <Text fz={11} c={TV.textLabel}>{v.date} · by {v.creator}</Text>
                      </ResultRow>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* ── Lists ────────────────────────────────────────────── */}
              {listResults.length > 0 && (
                <Box key="section-lists" style={{ borderTop: sectionBorder("lists") }}>
                  <SectionHeader title="Lists" count={listResults.length} linkLabel="View all lists" linkTo="/lists" />
                  <Stack gap={0}>
                    {listResults.map(({ item: l }) => (
                      <ResultRow key={l.id} onClick={() => handleNavigate("/lists")}
                        icon={<CircleIcon><List size={16} /></CircleIcon>}
                      >
                        <div className="flex items-center gap-2 flex-nowrap">
                          <Text fz={13} fw={700} c={TV.textBrand} truncate>{l.name}</Text>
                          {l.archived && <Badge size="xs" color="gray" variant="light" radius="xl" className="shrink-0">Archived</Badge>}
                        </div>
                        {l.description && <Text fz={11} c={TV.textSecondary} lineClamp={1}>{l.description}</Text>}
                        <Text fz={11} c={TV.textLabel}>{l.contactCount} constituents · by {l.creator} · Updated {l.updatedAt}</Text>
                      </ResultRow>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* ── Saved Searches ────────────────────────────────────── */}
              {savedSearchResults.length > 0 && (
                <Box key="section-saved-searches" style={{ borderTop: sectionBorder("saved_searches") }}>
                  <SectionHeader title="Saved Searches" count={savedSearchResults.length} linkLabel="View all saved searches" linkTo="/saved-searches" />
                  <Stack gap={0}>
                    {savedSearchResults.map(({ item: s }) => (
                      <ResultRow key={s.id} onClick={() => handleNavigate("/saved-searches")}
                        icon={<CircleIcon><Filter size={16} /></CircleIcon>}
                      >
                        <div className="flex items-center gap-2 flex-nowrap">
                          <Text fz={13} fw={700} c={TV.textBrand} truncate>{s.name}</Text>
                          <Badge size="xs" color={s.active ? "green" : "gray"} variant="light" radius="xl" className="shrink-0">{s.active ? "Active" : "Paused"}</Badge>
                        </div>
                        {s.description && <Text fz={11} c={TV.textSecondary}>{s.description}</Text>}
                        <Text fz={11} c={TV.textLabel}>{s.matchCount} matches · by {s.creator}</Text>
                      </ResultRow>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* ── Assets ───────────────────────────────────────────── */}
              {assetResults.length > 0 && (
                <Box key="section-assets" style={{ borderTop: sectionBorder("assets") }}>
                  <SectionHeader title="Assets & Templates" count={assetResults.length} linkLabel="View all assets" linkTo="/assets" />
                  <Stack gap={0}>
                    {assetResults.map(({ item: a }) => (
                      <ResultRow key={a.id} onClick={() => handleNavigate(a.route)}
                        icon={<CircleIcon><AssetIcon type={a.assetType} /></CircleIcon>}
                      >
                        <Text fz={13} fw={700} c={TV.textBrand} truncate>{a.name}</Text>
                        <Text fz={11} c={TV.textSecondary}>{ASSET_TYPE_LABEL[a.assetType]} · {a.category}</Text>
                        {a.description && <Text fz={11} c={TV.textLabel} lineClamp={1}>{a.description}</Text>}
                      </ResultRow>
                    ))}
                  </Stack>
                </Box>
              )}

              {/* ── View All Footer ──────────────────────────────────── */}
              <Box px="md" py="sm" style={{ borderTop: `1px solid ${TV.borderLight}`, backgroundColor: TV.surfaceMuted }}>
                <UnstyledButton w="100%" onClick={() => handleNavigate("/contacts")}>
                  <Text fz={13} fw={600} c={TV.textBrand} ta="center" className="hover:underline">
                    View all results for {quotedTokens}
                  </Text>
                </UnstyledButton>
              </Box>
            </ScrollArea.Autosize>
          )}
        </Box>
      )}
    </Box>
  );
}