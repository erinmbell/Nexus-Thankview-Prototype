import { useState, useMemo, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  X, Check, Filter, ChevronDown, ChevronRight, Columns,
  User, Mail, Video, Play, RefreshCw,
  Upload, UserPlus, Trash2, Plus, AlertTriangle,
  List, Bookmark, Users, Hash, Minus,
  Cloud, ExternalLink, ArrowLeft,
} from "lucide-react";
import { PillSearchInput } from "../../components/PillSearchInput";
import { CSVImportWizard } from "../../components/CSVImportWizard";

// ── Constituent type ─────────────────────────────────────────────────────────
interface Constituent {
  id: number;
  name: string;
  email: string;
  phone?: string;
  group: string;
  status: "ready" | "pending";
  videoAssigned: string | null;
  emailStatus?: "valid" | "bounced" | "invalid" | "suppressed";
  source?: string;
}

// ── Mock data generation ─────────────────────────────────────────────────────
const FIRST_NAMES = [
  "Alex","Amara","Anika","Anna","Ben","Blake","Brian","Carmen","Chloe","Clara",
  "Daniel","David","Diana","Elena","Emily","Ethan","Fiona","Gabriel","Grace","Hannah",
  "Isaac","James","Jason","Jennifer","Jessica","Jordan","Julia","Karen","Kevin","Kyle",
  "Laura","Leo","Liam","Lisa","Lucia","Marcus","Maria","Mark","Maya","Megan",
  "Michael","Morgan","Naomi","Nathan","Nina","Noah","Olivia","Omar","Patricia","Paul",
  "Quinn","Rachel","Rebecca","Robert","Rosa","Ryan","Samantha","Sarah","Sofia","Sonia",
  "Tariq","Thomas","Tyler","Uma","Vanessa","Victor","Wendy","Xavier","Yara","Zachary",
];
const LAST_NAMES = [
  "Adams","Baker","Campbell","Chen","Cho","Cruz","Davis","Diaz","Edwards","Fischer",
  "Garcia","Gonzalez","Green","Gupta","Hall","Harris","Hernandez","Hoffman","Huang","Jackson",
  "Johnson","Jones","Kim","King","Kumar","Lee","Lewis","Lopez","Martin","Miller",
  "Mitchell","Moore","Morales","Morgan","Nakamura","Nguyen","O'Brien","Ortiz","Osborne","Park",
  "Patel","Perez","Phillips","Quinn","Ramirez","Reed","Rivera","Robinson","Rodriguez","Ross",
  "Santos","Schmidt","Singh","Smith","Sullivan","Taylor","Thomas","Thompson","Torres","Turner",
  "Vargas","Walker","Wang","White","Williams","Wilson","Wright","Yamamoto","Young","Zhang",
];
const DOMAINS = ["alumni.edu","corp.com","email.com","foundation.org","org.edu","university.edu","college.edu","school.edu"];
const GROUPS = ["Donors","Alumni","Prospects","Board Members","Faculty","Parents"];
const VIDEO_NAMES = [
  "Spring Thank You","Scholarship Impact Story","Campus Tour Highlight","End of Year Appeal",
  "Student Spotlight","Dean's Welcome","Homecoming Recap","Research Impact Story",
  "Graduation Message","Library Renovation Update","Athletics Highlight","Annual Fund Thank You",
];

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generateMockConstituents(count: number): Constituent[] {
  const rand = seededRandom(42);
  const constituents: Constituent[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      const first = FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)];
      const last = LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)];
      name = `${first} ${last}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const [first, last] = name.split(" ");
    const domain = DOMAINS[Math.floor(rand() * DOMAINS.length)];
    const email = `${first.toLowerCase().charAt(0)}.${last.toLowerCase()}@${domain}`;
    const phone = rand() > 0.3 ? `+1 (${Math.floor(200 + rand() * 800)}) ${Math.floor(100 + rand() * 900)}-${Math.floor(1000 + rand() * 9000)}` : undefined;
    const group = GROUPS[Math.floor(rand() * GROUPS.length)];
    const status: "ready" | "pending" = rand() > 0.12 ? "ready" : "pending";
    const hasVideo = rand() > 0.6;
    const videoAssigned = hasVideo
      ? (rand() > 0.4 ? VIDEO_NAMES[Math.floor(rand() * VIDEO_NAMES.length)] : `${name} — Personal`)
      : null;
    const emailRoll = rand();
    const emailStatus: Constituent["emailStatus"] = emailRoll < 0.03 ? "bounced" : emailRoll < 0.05 ? "invalid" : "valid";

    constituents.push({ id: i + 1, name, email, phone, group, status, videoAssigned, emailStatus });
  }

  return constituents.sort((a, b) => a.name.localeCompare(b.name));
}

// Full constituent database — 2000 people
const ALL_CONSTITUENTS: Constituent[] = generateMockConstituents(2000);

// ── Lists & Saved Searches (mock) ────────────────────────────────────────────
interface ConstituentList {
  id: string;
  name: string;
  type: "list" | "saved-search";
  description: string;
  constituentIds: number[];
  icon: "list" | "search" | "users";
  updatedAt: string;
}

function pickIds(count: number, offset: number): number[] {
  const ids: number[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(((offset + i * 7) % 2000) + 1);
  }
  return [...new Set(ids)];
}

const MOCK_LISTS: ConstituentList[] = [
  { id: "l1", name: "Major Donors 2025", type: "list", description: "All donors with gifts over $5,000 this fiscal year", constituentIds: pickIds(187, 0), icon: "list", updatedAt: "2 days ago" },
  { id: "l2", name: "Spring Appeal Constituents", type: "list", description: "Curated list for the Spring 2026 giving campaign", constituentIds: pickIds(342, 50), icon: "list", updatedAt: "1 week ago" },
  { id: "l3", name: "Board Members", type: "list", description: "Current university board of trustees", constituentIds: pickIds(24, 200), icon: "users", updatedAt: "3 weeks ago" },
  { id: "l4", name: "Alumni Class of 2020", type: "list", description: "All graduates from the class of 2020", constituentIds: pickIds(485, 100), icon: "users", updatedAt: "1 month ago" },
  { id: "l5", name: "Faculty & Staff", type: "list", description: "All current faculty and staff members", constituentIds: pickIds(156, 300), icon: "users", updatedAt: "2 weeks ago" },
  { id: "l6", name: "Planned Giving Society", type: "list", description: "Members of the Planned Giving Society", constituentIds: pickIds(89, 600), icon: "list", updatedAt: "5 days ago" },
  { id: "l7", name: "Reunion 2026 Attendees", type: "list", description: "Confirmed attendees for 2026 reunion", constituentIds: pickIds(213, 700), icon: "users", updatedAt: "1 day ago" },
  { id: "s1", name: "Donors > $1,000 (Last 12mo)", type: "saved-search", description: "Dynamic: donors who gave over $1,000 in the past 12 months", constituentIds: pickIds(298, 10), icon: "search", updatedAt: "Live" },
  { id: "s2", name: "Lapsed Donors (2+ years)", type: "saved-search", description: "Dynamic: donors with no gift in 2+ years", constituentIds: pickIds(412, 250), icon: "search", updatedAt: "Live" },
  { id: "s3", name: "First-Time Donors", type: "saved-search", description: "Dynamic: constituents whose first gift was in the current FY", constituentIds: pickIds(89, 400), icon: "search", updatedAt: "Live" },
  { id: "s4", name: "Parents of Current Students", type: "saved-search", description: "Dynamic: parents with currently enrolled students", constituentIds: pickIds(223, 500), icon: "search", updatedAt: "Live" },
  { id: "s5", name: "Leadership Giving Prospects", type: "saved-search", description: "Dynamic: constituents with capacity rating of $25k+", constituentIds: pickIds(145, 800), icon: "search", updatedAt: "Live" },
];

const TV_LISTS = MOCK_LISTS.filter(l => l.type === "list");
const TV_SAVED_SEARCHES = MOCK_LISTS.filter(l => l.type === "saved-search");

const GROUP_OPTIONS   = ["All", ...GROUPS];
const STATUS_OPTIONS  = ["All", "Ready", "Pending"];
const VIDEO_FILTERS   = ["All", "Has Video", "No Video"];
const SWAP_OPTIONS    = ["Spring Thank You", "Scholarship Impact Story", "Campus Tour Highlight", "End of Year Appeal", "Remove Video"];

const ROW_HEIGHT = 44;

type AddMethod = "salesforce" | "blackbaud" | "lists" | "saved-searches" | "browse" | "csv" | "manual";

// ── Integration connection states ──
interface IntegrationState {
  connected: boolean;
  syncing: boolean;
  lastSync?: string;
  objectCount?: number;
  selectedObjects: Set<string>;
}

// Mock Salesforce objects
const SF_OBJECTS = [
  { id: "sf-contacts", name: "Contacts", count: 12450, description: "All Salesforce Contact records" },
  { id: "sf-campaign-members", name: "Campaign Members", count: 3280, description: "Members of Salesforce Campaigns" },
  { id: "sf-reports", name: "Reports", count: 47, description: "Import from a Salesforce Report" },
  { id: "sf-opportunities", name: "Opportunity Contact Roles", count: 1890, description: "Contacts linked to Opportunities" },
];

// Mock Salesforce campaigns/reports for sub-selection
const SF_CAMPAIGNS = [
  { id: "sfc1", name: "Spring 2026 Annual Fund", members: 1240, status: "Active" },
  { id: "sfc2", name: "Planned Giving Outreach", members: 340, status: "Active" },
  { id: "sfc3", name: "Year-End Appeal 2025", members: 2890, status: "Completed" },
  { id: "sfc4", name: "Alumni Engagement Drive", members: 780, status: "Active" },
  { id: "sfc5", name: "Board Communication", members: 24, status: "Active" },
];

const SF_REPORTS = [
  { id: "sfr1", name: "Major Donors FY26", rows: 187, folder: "Development" },
  { id: "sfr2", name: "Lapsed Donors > 2yrs", rows: 412, folder: "Analytics" },
  { id: "sfr3", name: "New Donors This Quarter", rows: 89, folder: "Development" },
  { id: "sfr4", name: "Email Engagement Summary", rows: 1540, folder: "Marketing" },
];

// Mock Blackbaud objects
const BB_OBJECTS = [
  { id: "bb-constituents", name: "Constituents", count: 15200, description: "All RE NXT/FE constituent records" },
  { id: "bb-lists", name: "Lists", count: 38, description: "Import from a Blackbaud List" },
  { id: "bb-queries", name: "Queries", count: 24, description: "Import from a saved query" },
];

const BB_LISTS = [
  { id: "bbl1", name: "Annual Fund Donors", count: 2340, category: "Giving" },
  { id: "bbl2", name: "Major Gift Prospects", count: 156, category: "Prospect Research" },
  { id: "bbl3", name: "Event Attendees — Gala 2025", count: 420, category: "Events" },
  { id: "bbl4", name: "Scholarship Constituents", count: 89, category: "Financial Aid" },
  { id: "bbl5", name: "Planned Giving Pipeline", count: 67, category: "Planned Giving" },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  ConstituentPanel — Constituents Step
// ═══════════════════════════════════════════════════════════════════════════════
export interface ConstituentPanelProps {
  hasPersonalizedClips?: boolean;
}

export function ConstituentPanel({ hasPersonalizedClips = false }: ConstituentPanelProps) {
  // Campaign constituents — the people who will receive the campaign
  const [campaignConstituentIds, setCampaignConstituentIds] = useState<Set<number>>(new Set());
  // Extra constituents added manually or via CSV (not in ALL_CONSTITUENTS)
  const [extraConstituents, setExtraConstituents] = useState<Constituent[]>([]);

  const [focusId, setFocusId] = useState<number | null>(null);
  const [addMethod, setAddMethod] = useState<AddMethod>("lists");

  // Search & filter (for browse mode)
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [groupFilter, setGroupFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [videoFilter, setVideoFilter] = useState("All");
  const [groupOpen, setGroupOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [swapOpenId, setSwapOpenId] = useState<number | null>(null);

  // Browse multi-select
  const [browseSelectedIds, setBrowseSelectedIds] = useState<Set<number>>(new Set());

  // Campaign list search & multi-select
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignSelectedIds, setCampaignSelectedIds] = useState<Set<number>>(new Set());

  // Lists & Saved Searches
  const [listSearch, setListSearch] = useState("");
  const [expandedListId, setExpandedListId] = useState<string | null>(null);

  // Manual add
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualGroup, setManualGroup] = useState("Donors");

  // Integration states
  const [sfState, setSfState] = useState<IntegrationState>({
    connected: false, syncing: false, selectedObjects: new Set(),
  });
  const [bbState, setBbState] = useState<IntegrationState>({
    connected: false, syncing: false, selectedObjects: new Set(),
  });
  const [sfSubView, setSfSubView] = useState<"root" | "campaigns" | "reports">("root");
  const [sfSearch, setSfSearch] = useState("");
  const [sfSelectedItems, setSfSelectedItems] = useState<Set<string>>(new Set());
  const [bbSubView, setBbSubView] = useState<"root" | "lists" | "queries">("root");
  const [bbSearch, setBbSearch] = useState("");
  const [bbSelectedItems, setBbSelectedItems] = useState<Set<string>>(new Set());
  const [importProgress, setImportProgress] = useState<{ source: string; pct: number; total: number } | null>(null);

  // Column visibility
  const [visibleCols, setVisibleCols] = useState<Set<string>>(new Set(["name", "email", "status", "group", "video"]));
  const [showColConfig, setShowColConfig] = useState(false);
  const COLUMN_DEFS = [
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email" },
    { key: "status", label: "Status" },
    { key: "group", label: "Group" },
    { key: "video", label: "Video" },
  ];
  const toggleCol = (key: string) => {
    setVisibleCols(prev => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  };

  const activeFilterCount = [groupFilter !== "All", statusFilter !== "All", videoFilter !== "All"].filter(Boolean).length;

  // ── Full database (includes extras) ──
  const allConstituents = useMemo(() => [...ALL_CONSTITUENTS, ...extraConstituents], [extraConstituents]);

  // ── Campaign constituents (resolved) ──
  const campaignConstituents = useMemo(
    () => allConstituents.filter(r => campaignConstituentIds.has(r.id)),
    [allConstituents, campaignConstituentIds],
  );

  // ── Stats (only for campaign constituents) ──
  const total = campaignConstituents.length;
  const readyCount = campaignConstituents.filter(r => r.status === "ready").length;
  const videoCount = campaignConstituents.filter(r => r.videoAssigned !== null).length;
  const bouncedInCampaign = campaignConstituents.filter(r => r.emailStatus === "bounced").length;
  const invalidInCampaign = campaignConstituents.filter(r => r.emailStatus === "invalid").length;
  const problemCount = bouncedInCampaign + invalidInCampaign;

  // ── Filtered campaign list ──
  const filteredCampaign = useMemo(() => {
    let list = campaignConstituents;
    if (campaignSearch.trim()) {
      const q = campaignSearch.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }
    return list;
  }, [campaignConstituents, campaignSearch]);

  // ── Browse mode: filtered database (excluding already-added) ──
  const browsableConstituents = useMemo(() => {
    let list = allConstituents.filter(r => !campaignConstituentIds.has(r.id));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r => r.name.toLowerCase().includes(q) || r.email.toLowerCase().includes(q));
    }
    if (groupFilter !== "All") list = list.filter(r => r.group === groupFilter);
    if (statusFilter === "Ready") list = list.filter(r => r.status === "ready");
    if (statusFilter === "Pending") list = list.filter(r => r.status === "pending");
    if (videoFilter === "Has Video") list = list.filter(r => r.videoAssigned !== null);
    if (videoFilter === "No Video") list = list.filter(r => r.videoAssigned === null);
    return list;
  }, [allConstituents, campaignConstituentIds, search, groupFilter, statusFilter, videoFilter]);

  // ── Filtered lists (TV Lists tab) ──
  const filteredTVLists = useMemo(() => {
    let lists = TV_LISTS;
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      lists = lists.filter(l => l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
    return lists;
  }, [listSearch]);

  // ── Filtered saved searches (TV Saved Searches tab) ──
  const filteredSavedSearches = useMemo(() => {
    let lists = TV_SAVED_SEARCHES;
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      lists = lists.filter(l => l.name.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
    }
    return lists;
  }, [listSearch]);

  // Focus constituent
  const focusConstituent = focusId !== null ? allConstituents.find(r => r.id === focusId) ?? null : null;

  // ── Virtualizer for browse mode ──
  const browseParentRef = useRef<HTMLDivElement>(null);
  const browseVirtualizer = useVirtualizer({
    count: browsableConstituents.length,
    getScrollElement: () => browseParentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  // ── Virtualizer for campaign list ──
  const campaignParentRef = useRef<HTMLDivElement>(null);
  const campaignVirtualizer = useVirtualizer({
    count: filteredCampaign.length,
    getScrollElement: () => campaignParentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 15,
  });

  // ── Actions ──
  const addToCampaign = useCallback((ids: number[]) => {
    setCampaignConstituentIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return next;
    });
  }, []);

  const removeFromCampaign = useCallback((ids: number[]) => {
    setCampaignConstituentIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    setCampaignSelectedIds(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.delete(id));
      return next;
    });
    setFocusId(prev => (prev && ids.includes(prev) ? null : prev));
  }, []);

  const addListToCampaign = useCallback((list: ConstituentList) => {
    addToCampaign(list.constituentIds);
  }, [addToCampaign]);

  const removeListFromCampaign = useCallback((list: ConstituentList) => {
    removeFromCampaign(list.constituentIds);
  }, [removeFromCampaign]);

  // How many from a list are already added
  const listOverlap = useCallback((list: ConstituentList) => {
    return list.constituentIds.filter(id => campaignConstituentIds.has(id)).length;
  }, [campaignConstituentIds]);

  // ── Browse multi-select helpers ──
  const toggleBrowseSelect = useCallback((id: number) => {
    setBrowseSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleBrowseSelectAll = useCallback(() => {
    const ids = browsableConstituents.map(r => r.id);
    setBrowseSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  }, [browsableConstituents]);

  const addBrowseSelectedToCampaign = useCallback(() => {
    addToCampaign([...browseSelectedIds]);
    setBrowseSelectedIds(new Set());
  }, [browseSelectedIds, addToCampaign]);

  // ── Campaign multi-select helpers ──
  const toggleCampaignSelect = useCallback((id: number) => {
    setCampaignSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleCampaignSelectAll = useCallback(() => {
    const ids = filteredCampaign.map(r => r.id);
    setCampaignSelectedIds(prev => {
      const allSelected = ids.every(id => prev.has(id));
      if (allSelected) return new Set();
      return new Set(ids);
    });
  }, [filteredCampaign]);

  const removeSelectedFromCampaign = useCallback(() => {
    removeFromCampaign([...campaignSelectedIds]);
  }, [campaignSelectedIds, removeFromCampaign]);

  // Campaign select-all state
  const campaignAllSelected = filteredCampaign.length > 0 && filteredCampaign.every(r => campaignSelectedIds.has(r.id));
  const campaignSomeSelected = filteredCampaign.some(r => campaignSelectedIds.has(r.id));

  // Browse select-all state
  const browseAllSelected = browsableConstituents.length > 0 && browsableConstituents.every(r => browseSelectedIds.has(r.id));
  const browseSomeSelected = browsableConstituents.some(r => browseSelectedIds.has(r.id));

  // ── Mock integration import ──
  const simulateImport = useCallback((source: string, count: number) => {
    setImportProgress({ source, pct: 0, total: count });
    let pct = 0;
    const interval = setInterval(() => {
      pct += Math.random() * 18 + 7;
      if (pct >= 100) {
        clearInterval(interval);
        setImportProgress(null);
        // Add mock constituents
        const baseId = Date.now();
        const newConstituents: Constituent[] = [];
        const rng = seededRandom(baseId);
        const importCount = Math.min(count, 200); // cap for demo
        for (let i = 0; i < importCount; i++) {
          const first = FIRST_NAMES[Math.floor(rng() * FIRST_NAMES.length)];
          const last = LAST_NAMES[Math.floor(rng() * LAST_NAMES.length)];
          const domain = DOMAINS[Math.floor(rng() * DOMAINS.length)];
          newConstituents.push({
            id: baseId + i,
            name: `${first} ${last}`,
            email: `${first.toLowerCase().charAt(0)}.${last.toLowerCase()}@${domain}`,
            group: GROUPS[Math.floor(rng() * GROUPS.length)],
            status: "ready",
            videoAssigned: null,
            source,
          });
        }
        setExtraConstituents(prev => [...prev, ...newConstituents]);
        addToCampaign(newConstituents.map(r => r.id));
      } else {
        setImportProgress(prev => prev ? { ...prev, pct: Math.round(pct) } : null);
      }
    }, 150);
  }, [addToCampaign]);

  // ── Source categories ──
  const SOURCE_CATEGORIES = [
    {
      label: "Integrations",
      items: [
        { key: "salesforce" as AddMethod, label: "Salesforce", icon: Cloud, color: "text-[#00A1E0]", bg: "bg-[#E8F7FF]" },
        { key: "blackbaud" as AddMethod, label: "Blackbaud", icon: Cloud, color: "text-[#004B8D]", bg: "bg-[#E6F0FA]" },
      ],
    },
    {
      label: "ThankView",
      items: [
        { key: "lists" as AddMethod, label: "TV Lists", icon: List, color: "text-tv-brand", bg: "bg-tv-brand-tint" },
        { key: "saved-searches" as AddMethod, label: "Saved Searches", icon: Bookmark, color: "text-tv-warning", bg: "bg-tv-warning-bg" },
      ],
    },
    {
      label: "Direct",
      items: [
        { key: "browse" as AddMethod, label: "Browse All", icon: Users, color: "text-tv-text-primary", bg: "bg-tv-surface" },
        { key: "csv" as AddMethod, label: "CSV Upload", icon: Upload, color: "text-tv-success", bg: "bg-tv-success-bg" },
        { key: "manual" as AddMethod, label: "Manual", icon: UserPlus, color: "text-tv-info", bg: "bg-tv-info/10" },
      ],
    },
  ];

  // ── Checkbox component ──
  const Checkbox = ({ checked, indeterminate, onChange, size = 14 }: {
    checked: boolean; indeterminate?: boolean; onChange: () => void; size?: number;
  }) => (
    <button
      onClick={e => { e.stopPropagation(); onChange(); }}
      className={`shrink-0 rounded border flex items-center justify-center transition-colors ${
        checked || indeterminate
          ? "bg-tv-brand-bg border-tv-brand-bg"
          : "border-tv-border-light hover:border-tv-brand-bg/60"
      }`}
      style={{ width: size, height: size }}
    >
      {checked && <Check size={size - 4} className="text-white" strokeWidth={3} />}
      {!checked && indeterminate && <Minus size={size - 4} className="text-white" strokeWidth={3} />}
    </button>
  );

  // ── Shared list card renderer ──
  const renderListCard = (list: ConstituentList) => {
    const overlap = listOverlap(list);
    const isFullyAdded = overlap === list.constituentIds.length;
    const isPartiallyAdded = overlap > 0 && !isFullyAdded;
    const expanded = expandedListId === list.id;
    const newCount = list.constituentIds.length - overlap;

    return (
      <div key={list.id} className="border-b border-tv-border-divider last:border-b-0">
        <div className="flex items-center gap-2 px-4 py-3 hover:bg-tv-surface/50 transition-colors">
          <button onClick={() => setExpandedListId(expanded ? null : list.id)} className="shrink-0">
            <ChevronRight
              size={12}
              className={`text-tv-text-secondary transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
          <div className={`w-7 h-7 rounded-sm flex items-center justify-center shrink-0 ${
            list.type === "saved-search" ? "bg-tv-warning-bg" : "bg-tv-surface"
          }`}>
            {list.icon === "search" ? (
              <Bookmark size={12} className="text-tv-warning" />
            ) : list.icon === "users" ? (
              <Users size={12} className="text-tv-text-secondary" />
            ) : (
              <List size={12} className="text-tv-text-secondary" />
            )}
          </div>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpandedListId(expanded ? null : list.id)}
          >
            <div className="flex items-center gap-1.5">
              <p style={{ fontSize: "11px", fontWeight: 600 }} className="text-tv-text-primary truncate">{list.name}</p>
              {list.type === "saved-search" && (
                <span className="shrink-0 px-1.5 py-px bg-tv-warning-bg text-tv-warning rounded-full" style={{ fontSize: "7px", fontWeight: 700 }}>DYNAMIC</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span style={{ fontSize: "9px" }} className="text-tv-text-secondary">
                <Hash size={8} className="inline mr-0.5" />{list.constituentIds.length} constituents
              </span>
              <span style={{ fontSize: "8px" }} className="text-tv-text-decorative">Updated {list.updatedAt}</span>
            </div>
          </div>

          {/* Add / Added button */}
          <div className="shrink-0">
            {isFullyAdded ? (
              <button
                onClick={() => removeListFromCampaign(list)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-tv-success-bg text-tv-success border border-tv-success-border hover:bg-tv-danger-bg hover:text-tv-danger hover:border-tv-danger-border transition-colors group"
              >
                <Check size={10} className="group-hover:hidden" />
                <Minus size={10} className="hidden group-hover:block" />
                <span style={{ fontSize: "9px", fontWeight: 600 }} className="group-hover:hidden">Added</span>
                <span style={{ fontSize: "9px", fontWeight: 600 }} className="hidden group-hover:block">Remove</span>
              </button>
            ) : (
              <button
                onClick={() => addListToCampaign(list)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-tv-brand-bg text-white hover:bg-tv-brand-hover transition-colors"
              >
                <Plus size={10} />
                <span style={{ fontSize: "9px", fontWeight: 600 }}>
                  {isPartiallyAdded ? `Add ${newCount} new` : `Add all ${list.constituentIds.length}`}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Expanded: list details */}
        {expanded && (
          <div className="px-4 pb-3 pt-0">
            <p style={{ fontSize: "10px" }} className="text-tv-text-secondary mb-2 ml-[30px]">{list.description}</p>
            {isPartiallyAdded && (
              <div className="ml-[30px] mb-2 flex items-center gap-2 p-2 bg-tv-brand-tint/40 rounded-sm">
                <span style={{ fontSize: "9px" }} className="text-tv-brand">
                  {overlap} of {list.constituentIds.length} already in campaign — {newCount} new would be added
                </span>
              </div>
            )}
            {/* Preview first few constituents */}
            <div className="ml-[30px] space-y-0.5 max-h-[140px] overflow-y-auto">
              {list.constituentIds.slice(0, 8).map(id => {
                const r = ALL_CONSTITUENTS.find(c => c.id === id);
                if (!r) return null;
                const inCampaign = campaignConstituentIds.has(id);
                return (
                  <div key={id} className={`flex items-center gap-2 px-2 py-1 rounded-[6px] ${inCampaign ? "opacity-50" : ""}`}>
                    <span style={{ fontSize: "10px" }} className="text-tv-text-primary truncate">{r.name}</span>
                    <span style={{ fontSize: "9px" }} className="text-tv-text-decorative truncate ml-auto">{r.email}</span>
                    {inCampaign && <span style={{ fontSize: "7px", fontWeight: 600 }} className="text-tv-text-decorative bg-tv-surface px-1 py-0.5 rounded shrink-0">Added</span>}
                  </div>
                );
              })}
              {list.constituentIds.length > 8 && (
                <p style={{ fontSize: "9px" }} className="text-tv-text-decorative pl-2 pt-1">
                  …and {list.constituentIds.length - 8} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden border border-tv-border-light rounded-lg bg-white">
      {/* ── Left Panel — Source Sidebar ── */}
      <div className="w-[420px] shrink-0 border-r border-tv-border-divider flex flex-col">
        {/* Header */}
        <div className="px-5 pt-5 pb-3 shrink-0">
          <h3 style={{ fontSize: "15px", fontWeight: 900 }} className="text-tv-text-primary">Constituents</h3>
          <p style={{ fontSize: "11px" }} className="text-tv-text-secondary mt-0.5">
            {total === 0
              ? "Add constituents from integrations, lists, or by browsing your database."
              : `${total} constituent${total !== 1 ? "s" : ""} will receive this campaign.`}
          </p>

          {/* Stats bar */}
          {total > 0 && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-tv-surface rounded-full">
                <User size={10} className="text-tv-text-secondary" />
                <span style={{ fontSize: "10px", fontWeight: 500 }} className="text-tv-text-primary">{total} total</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-tv-success-bg rounded-full">
                <Check size={10} className="text-tv-success" />
                <span style={{ fontSize: "10px", fontWeight: 500 }} className="text-tv-success">{readyCount} ready</span>
              </div>
              {hasPersonalizedClips && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-tv-brand-tint rounded-full">
                  <Video size={10} className="text-tv-brand" />
                  <span style={{ fontSize: "10px", fontWeight: 500 }} className="text-tv-brand">{videoCount} video</span>
                </div>
              )}
              {problemCount > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-tv-danger-bg rounded-full">
                  <AlertTriangle size={10} className="text-tv-danger" />
                  <span style={{ fontSize: "10px", fontWeight: 500 }} className="text-tv-danger">{problemCount} issue{problemCount !== 1 ? "s" : ""}</span>
                </div>
              )}
            </div>
          )}

          {/* Warning — ONLY for campaign constituents with issues */}
          {problemCount > 0 && (
            <div className="mt-2.5 p-2.5 bg-tv-danger-bg border border-tv-danger-border rounded-md flex items-start gap-2">
              <AlertTriangle size={12} className="text-tv-danger shrink-0 mt-0.5" />
              <div style={{ fontSize: "10px" }} className="text-tv-danger leading-relaxed">
                <p style={{ fontWeight: 600 }} className="mb-0.5">{problemCount} constituent{problemCount !== 1 ? "s" : ""} with delivery issues:</p>
                {bouncedInCampaign > 0 && <p>{bouncedInCampaign} hard bounce{bouncedInCampaign !== 1 ? "s" : ""}</p>}
                {invalidInCampaign > 0 && <p>{invalidInCampaign} invalid email{invalidInCampaign !== 1 ? "s" : ""}</p>}
                <p className="mt-1" style={{ fontSize: "9px" }}>These will be excluded from the send.</p>
              </div>
            </div>
          )}
        </div>

        {/* ── Source Navigation ── */}
        <div className="px-4 pb-2 shrink-0">
          <div className="space-y-1">
            {SOURCE_CATEGORIES.map(cat => (
              <div key={cat.label}>
                <p style={{ fontSize: "8px", fontWeight: 700 }} className="text-tv-text-decorative uppercase tracking-wider px-1 pt-1.5 pb-0.5">{cat.label}</p>
                <div className="flex flex-wrap gap-1">
                  {cat.items.map(item => (
                    <button
                      key={item.key}
                      onClick={() => { setAddMethod(item.key); setListSearch(""); setExpandedListId(null); setSfSubView("root"); setBbSubView("root"); setSfSearch(""); setBbSearch(""); }}
                      className={`flex items-center gap-1.5 px-2.5 py-[6px] rounded-sm transition-all ${
                        addMethod === item.key
                          ? "bg-white text-tv-brand shadow-sm ring-1 ring-tv-brand-bg/30"
                          : "text-tv-text-secondary hover:bg-tv-surface hover:text-tv-text-primary"
                      }`}
                    >
                      <item.icon size={12} className={addMethod === item.key ? "text-tv-brand" : ""} />
                      <span style={{ fontSize: "10px", fontWeight: addMethod === item.key ? 600 : 500 }}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Source content area ── */}
        <div className="flex-1 min-h-0 flex flex-col border-t border-tv-border-divider">

          {/* ────── Salesforce ────── */}
          {addMethod === "salesforce" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {!sfState.connected ? (
                /* Connection prompt */
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-14 h-14 rounded-lg bg-[#E8F7FF] flex items-center justify-center mb-4">
                    <Cloud size={24} className="text-[#00A1E0]" />
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 700 }} className="text-tv-text-primary mb-1">Connect Salesforce</p>
                  <p style={{ fontSize: "11px" }} className="text-tv-text-secondary mb-4 max-w-[280px]">
                    Import contacts, campaign members, and report data directly from your Salesforce org.
                  </p>
                  <button
                    onClick={() => setSfState(prev => ({ ...prev, connected: true, lastSync: "Just now" }))}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#00A1E0] text-white rounded-full hover:bg-[#0081B3] transition-colors"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    <ExternalLink size={13} />Connect to Salesforce
                  </button>
                  <p style={{ fontSize: "9px" }} className="text-tv-text-decorative mt-3">
                    Uses OAuth 2.0 — your credentials are never stored
                  </p>
                </div>
              ) : sfSubView === "root" ? (
                /* Connected — show object sources */
                <div className="flex-1 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-tv-border-divider flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#E8F7FF] flex items-center justify-center">
                        <Cloud size={11} className="text-[#00A1E0]" />
                      </div>
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: 600 }} className="text-tv-text-primary">Salesforce Connected</p>
                        <p style={{ fontSize: "9px" }} className="text-tv-text-decorative">Last sync: {sfState.lastSync || "Never"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSfState(prev => ({ ...prev, connected: false, selectedObjects: new Set() }))}
                      className="text-[9px] text-tv-text-secondary hover:text-tv-danger transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      Disconnect
                    </button>
                  </div>

                  {importProgress && importProgress.source === "salesforce" ? (
                    <div className="p-6 flex flex-col items-center justify-center">
                      <div className="w-full max-w-xs">
                        <p style={{ fontSize: "12px", fontWeight: 600 }} className="text-tv-text-primary mb-2 text-center">Importing from Salesforce…</p>
                        <div className="w-full h-2 bg-tv-border-divider rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-[#00A1E0] rounded-full transition-all" style={{ width: `${importProgress.pct}%` }} />
                        </div>
                        <p style={{ fontSize: "10px" }} className="text-tv-text-secondary text-center">{importProgress.pct}% — importing ~{importProgress.total} constituents</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 space-y-1.5">
                      {SF_OBJECTS.map(obj => (
                        <button
                          key={obj.id}
                          onClick={() => {
                            if (obj.id === "sf-campaign-members") setSfSubView("campaigns");
                            else if (obj.id === "sf-reports") setSfSubView("reports");
                            else simulateImport("salesforce", obj.count);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-md border border-tv-border-light hover:border-[#00A1E0]/40 hover:bg-[#E8F7FF]/30 transition-all text-left group"
                        >
                          <div className="w-8 h-8 rounded-sm bg-[#E8F7FF] flex items-center justify-center shrink-0">
                            {obj.id === "sf-reports" ? <List size={14} className="text-[#00A1E0]" /> : <Users size={14} className="text-[#00A1E0]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: "11px", fontWeight: 600 }} className="text-tv-text-primary">{obj.name}</p>
                            <p style={{ fontSize: "9px" }} className="text-tv-text-secondary">{obj.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span style={{ fontSize: "9px" }} className="text-tv-text-decorative">{obj.count.toLocaleString()}</span>
                            <ChevronRight size={12} className="text-tv-text-secondary group-hover:text-[#00A1E0] transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Sub-view: campaigns or reports */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-tv-border-divider flex items-center gap-2 shrink-0">
                    <button onClick={() => setSfSubView("root")} className="w-6 h-6 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors">
                      <ArrowLeft size={12} />
                    </button>
                    <p style={{ fontSize: "12px", fontWeight: 700 }} className="text-tv-text-primary">
                      {sfSubView === "campaigns" ? "Salesforce Campaigns" : "Salesforce Reports"}
                    </p>
                  </div>
                  <div className="px-4 py-2 shrink-0">
                    <PillSearchInput value={sfSearch} onChange={setSfSearch} placeholder={`Search ${sfSubView}…`} size="sm" />
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 pb-3">
                    {sfSubView === "campaigns" && SF_CAMPAIGNS
                      .filter(c => !sfSearch.trim() || c.name.toLowerCase().includes(sfSearch.toLowerCase()))
                      .map(c => (
                        <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-sm hover:bg-tv-surface transition-colors">
                          <Checkbox
                            checked={sfSelectedItems.has(c.id)}
                            onChange={() => setSfSelectedItems(prev => {
                              const next = new Set(prev);
                              next.has(c.id) ? next.delete(c.id) : next.add(c.id);
                              return next;
                            })}
                          />
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: "11px", fontWeight: 500 }} className="text-tv-text-primary truncate">{c.name}</p>
                            <p style={{ fontSize: "9px" }} className="text-tv-text-secondary">{c.members.toLocaleString()} members · {c.status}</p>
                          </div>
                        </div>
                      ))}
                    {sfSubView === "reports" && SF_REPORTS
                      .filter(r => !sfSearch.trim() || r.name.toLowerCase().includes(sfSearch.toLowerCase()))
                      .map(r => (
                        <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-sm hover:bg-tv-surface transition-colors">
                          <Checkbox
                            checked={sfSelectedItems.has(r.id)}
                            onChange={() => setSfSelectedItems(prev => {
                              const next = new Set(prev);
                              next.has(r.id) ? next.delete(r.id) : next.add(r.id);
                              return next;
                            })}
                          />
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: "11px", fontWeight: 500 }} className="text-tv-text-primary truncate">{r.name}</p>
                            <p style={{ fontSize: "9px" }} className="text-tv-text-secondary">{r.rows.toLocaleString()} rows · {r.folder}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  {sfSelectedItems.size > 0 && (
                    <div className="px-4 py-2.5 border-t border-tv-border-divider shrink-0 flex items-center justify-between bg-tv-surface/30">
                      <span style={{ fontSize: "10px", fontWeight: 500 }} className="text-tv-text-secondary">{sfSelectedItems.size} selected</span>
                      <button
                        onClick={() => {
                          const totalRows = sfSubView === "campaigns"
                            ? SF_CAMPAIGNS.filter(c => sfSelectedItems.has(c.id)).reduce((s, c) => s + c.members, 0)
                            : SF_REPORTS.filter(r => sfSelectedItems.has(r.id)).reduce((s, r) => s + r.rows, 0);
                          setSfSubView("root");
                          setSfSelectedItems(new Set());
                          simulateImport("salesforce", totalRows);
                        }}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00A1E0] text-white rounded-full hover:bg-[#0081B3] transition-colors"
                        style={{ fontSize: "10px", fontWeight: 600 }}
                      >
                        <Plus size={11} />Import Selected
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ────── Blackbaud ────── */}
          {addMethod === "blackbaud" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {!bbState.connected ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-14 h-14 rounded-lg bg-[#E6F0FA] flex items-center justify-center mb-4">
                    <Cloud size={24} className="text-[#004B8D]" />
                  </div>
                  <p style={{ fontSize: "14px", fontWeight: 700 }} className="text-tv-text-primary mb-1">Connect Blackbaud</p>
                  <p style={{ fontSize: "11px" }} className="text-tv-text-secondary mb-4 max-w-[280px]">
                    Import constituents from Raiser's Edge NXT or Financial Edge lists, queries, and more.
                  </p>
                  <button
                    onClick={() => setBbState(prev => ({ ...prev, connected: true, lastSync: "Just now" }))}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#004B8D] text-white rounded-full hover:bg-[#003A6E] transition-colors"
                    style={{ fontSize: "12px", fontWeight: 600 }}
                  >
                    <ExternalLink size={13} />Connect to Blackbaud
                  </button>
                  <p style={{ fontSize: "9px" }} className="text-tv-text-decorative mt-3">
                    Uses SKY API — your credentials are never stored
                  </p>
                </div>
              ) : bbSubView === "root" ? (
                <div className="flex-1 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-tv-border-divider flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#E6F0FA] flex items-center justify-center">
                        <Cloud size={11} className="text-[#004B8D]" />
                      </div>
                      <div>
                        <p style={{ fontSize: "11px", fontWeight: 600 }} className="text-tv-text-primary">Blackbaud Connected</p>
                        <p style={{ fontSize: "9px" }} className="text-tv-text-decorative">Last sync: {bbState.lastSync || "Never"}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setBbState(prev => ({ ...prev, connected: false, selectedObjects: new Set() }))}
                      className="text-[9px] text-tv-text-secondary hover:text-tv-danger transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      Disconnect
                    </button>
                  </div>

                  {importProgress && importProgress.source === "blackbaud" ? (
                    <div className="p-6 flex flex-col items-center justify-center">
                      <div className="w-full max-w-xs">
                        <p style={{ fontSize: "12px", fontWeight: 600 }} className="text-tv-text-primary mb-2 text-center">Importing from Blackbaud…</p>
                        <div className="w-full h-2 bg-tv-border-divider rounded-full overflow-hidden mb-2">
                          <div className="h-full bg-[#004B8D] rounded-full transition-all" style={{ width: `${importProgress.pct}%` }} />
                        </div>
                        <p style={{ fontSize: "10px" }} className="text-tv-text-secondary text-center">{importProgress.pct}% — importing ~{importProgress.total} constituents</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 space-y-1.5">
                      {BB_OBJECTS.map(obj => (
                        <button
                          key={obj.id}
                          onClick={() => {
                            if (obj.id === "bb-lists") setBbSubView("lists");
                            else if (obj.id === "bb-queries") setBbSubView("queries");
                            else simulateImport("blackbaud", obj.count);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-md border border-tv-border-light hover:border-[#004B8D]/40 hover:bg-[#E6F0FA]/30 transition-all text-left group"
                        >
                          <div className="w-8 h-8 rounded-sm bg-[#E6F0FA] flex items-center justify-center shrink-0">
                            {obj.id === "bb-lists" || obj.id === "bb-queries" ? <List size={14} className="text-[#004B8D]" /> : <Users size={14} className="text-[#004B8D]" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: "11px", fontWeight: 600 }} className="text-tv-text-primary">{obj.name}</p>
                            <p style={{ fontSize: "9px" }} className="text-tv-text-secondary">{obj.description}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span style={{ fontSize: "9px" }} className="text-tv-text-decorative">{obj.count}</span>
                            <ChevronRight size={12} className="text-tv-text-secondary group-hover:text-[#004B8D] transition-colors" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Sub-view: Blackbaud lists or queries */
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-tv-border-divider flex items-center gap-2 shrink-0">
                    <button onClick={() => setBbSubView("root")} className="w-6 h-6 rounded-full bg-tv-surface flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors">
                      <ArrowLeft size={12} />
                    </button>
                    <p style={{ fontSize: "12px", fontWeight: 700 }} className="text-tv-text-primary">
                      Blackbaud {bbSubView === "lists" ? "Lists" : "Queries"}
                    </p>
                  </div>
                  <div className="px-4 py-2 shrink-0">
                    <PillSearchInput value={bbSearch} onChange={setBbSearch} placeholder={`Search ${bbSubView}…`} size="sm" />
                  </div>
                  <div className="flex-1 overflow-y-auto px-3 pb-3">
                    {BB_LISTS
                      .filter(l => !bbSearch.trim() || l.name.toLowerCase().includes(bbSearch.toLowerCase()))
                      .map(l => (
                        <div key={l.id} className="flex items-center gap-3 p-2.5 rounded-sm hover:bg-tv-surface transition-colors">
                          <Checkbox
                            checked={bbSelectedItems.has(l.id)}
                            onChange={() => setBbSelectedItems(prev => {
                              const next = new Set(prev);
                              next.has(l.id) ? next.delete(l.id) : next.add(l.id);
                              return next;
                            })}
                          />
                          <div className="flex-1 min-w-0">
                            <p style={{ fontSize: "11px", fontWeight: 500 }} className="text-tv-text-primary truncate">{l.name}</p>
                            <p style={{ fontSize: "9px" }} className="text-tv-text-secondary">{l.count.toLocaleString()} records · {l.category}</p>
                          </div>
                        </div>
                      ))}
                  </div>
                  {bbSelectedItems.size > 0 && (
                    <div className="px-4 py-2.5 border-t border-tv-border-divider shrink-0 flex items-center justify-between bg-tv-surface/30">
                      <span style={{ fontSize: "10px", fontWeight: 500 }} className="text-tv-text-secondary">{bbSelectedItems.size} selected</span>
                      <button
                        onClick={() => {
                          const totalCount = BB_LISTS.filter(l => bbSelectedItems.has(l.id)).reduce((s, l) => s + l.count, 0);
                          setBbSubView("root");
                          setBbSelectedItems(new Set());
                          simulateImport("blackbaud", totalCount);
                        }}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[#004B8D] text-white rounded-full hover:bg-[#003A6E] transition-colors"
                        style={{ fontSize: "10px", fontWeight: 600 }}
                      >
                        <Plus size={11} />Import Selected
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ────── TV Lists ────── */}
          {addMethod === "lists" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-3 shrink-0 border-b border-tv-border-divider">
                <PillSearchInput value={listSearch} onChange={setListSearch} placeholder="Search lists…" size="sm" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredTVLists.length === 0 ? (
                  <div className="p-6 text-center">
                    <List size={20} className="text-tv-text-decorative/40 mx-auto mb-2" />
                    <p style={{ fontSize: "11px" }} className="text-tv-text-secondary">No lists match your search.</p>
                  </div>
                ) : filteredTVLists.map(renderListCard)}
              </div>
            </div>
          )}

          {/* ────── TV Saved Searches ────── */}
          {addMethod === "saved-searches" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-3 shrink-0 border-b border-tv-border-divider">
                <PillSearchInput value={listSearch} onChange={setListSearch} placeholder="Search saved searches…" size="sm" />
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredSavedSearches.length === 0 ? (
                  <div className="p-6 text-center">
                    <Bookmark size={20} className="text-tv-text-decorative/40 mx-auto mb-2" />
                    <p style={{ fontSize: "11px" }} className="text-tv-text-secondary">No saved searches match your search.</p>
                  </div>
                ) : filteredSavedSearches.map(renderListCard)}
              </div>
            </div>
          )}

          {/* ────── Browse All (individual + multi-select) ────── */}
          {addMethod === "browse" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search + filter */}
              <div className="px-4 py-3 space-y-2.5 shrink-0 border-b border-tv-border-divider">
                <div className="flex items-center gap-2">
                  <PillSearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" size="sm" className="flex-1" />
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`relative flex items-center justify-center w-9 h-9 rounded-full border transition-colors shrink-0 ${
                      showFilters || activeFilterCount > 0
                        ? "border-tv-brand bg-tv-brand-tint text-tv-brand"
                        : "border-tv-border-light text-tv-text-secondary hover:bg-tv-surface hover:border-tv-border-strong"
                    }`}
                  >
                    <Filter size={14} />
                    {activeFilterCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-tv-brand-bg text-white text-[8px] flex items-center justify-center" style={{ fontWeight: 700 }}>
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Filter chips row */}
                {showFilters && (
                  <div className="flex items-center gap-2">
                    {/* Group filter chip */}
                    <div className="relative">
                      <button
                        onClick={() => { setGroupOpen(!groupOpen); setStatusOpen(false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] whitespace-nowrap transition-colors cursor-pointer ${
                          groupFilter !== "All"
                            ? "border-tv-brand bg-tv-brand-tint text-tv-brand"
                            : "border-tv-border-light bg-white text-tv-text-label hover:bg-tv-surface"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        <span className="text-tv-text-secondary">Group:</span>
                        <span style={{ fontWeight: 600 }}>{groupFilter}</span>
                        <ChevronDown size={11} className="opacity-60" />
                      </button>
                      {groupOpen && (
                        <div className="absolute top-full left-0 mt-1 min-w-[140px] bg-white border border-tv-border-light rounded-md shadow-lg z-10 overflow-hidden max-h-[200px] overflow-y-auto py-1">
                          {GROUP_OPTIONS.map(g => (
                            <button key={g} onClick={() => { setGroupFilter(g); setGroupOpen(false); }}
                              className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-tv-surface transition-colors ${groupFilter === g ? "bg-tv-brand-tint text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: groupFilter === g ? 600 : 400 }}>
                              {g}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Status filter chip */}
                    <div className="relative">
                      <button
                        onClick={() => { setStatusOpen(!statusOpen); setGroupOpen(false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] whitespace-nowrap transition-colors cursor-pointer ${
                          statusFilter !== "All" || videoFilter !== "All"
                            ? "border-tv-brand bg-tv-brand-tint text-tv-brand"
                            : "border-tv-border-light bg-white text-tv-text-label hover:bg-tv-surface"
                        }`}
                        style={{ fontWeight: 500 }}
                      >
                        <span className="text-tv-text-secondary">Status:</span>
                        <span style={{ fontWeight: 600 }}>
                          {statusFilter !== "All" ? statusFilter : videoFilter !== "All" ? videoFilter : "All"}
                        </span>
                        <ChevronDown size={11} className="opacity-60" />
                      </button>
                      {statusOpen && (
                        <div className="absolute top-full left-0 mt-1 min-w-[140px] bg-white border border-tv-border-light rounded-md shadow-lg z-10 overflow-hidden py-1">
                          {[...STATUS_OPTIONS, ...(hasPersonalizedClips ? VIDEO_FILTERS.slice(1) : [])].map(s => (
                            <button key={s} onClick={() => {
                              if (STATUS_OPTIONS.includes(s)) { setStatusFilter(s); setVideoFilter("All"); }
                              else { setVideoFilter(s); setStatusFilter("All"); }
                              setStatusOpen(false);
                            }}
                              className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-tv-surface transition-colors ${
                                (STATUS_OPTIONS.includes(s) && statusFilter === s) || (VIDEO_FILTERS.includes(s) && videoFilter === s)
                                  ? "bg-tv-brand-tint text-tv-brand"
                                  : "text-tv-text-primary"
                              }`}
                              style={{ fontWeight: (STATUS_OPTIONS.includes(s) && statusFilter === s) || (VIDEO_FILTERS.includes(s) && videoFilter === s) ? 600 : 400 }}>
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Clear button */}
                    {activeFilterCount > 0 && (
                      <button
                        onClick={() => { setGroupFilter("All"); setStatusFilter("All"); setVideoFilter("All"); }}
                        className="text-[12px] text-tv-danger hover:underline shrink-0"
                        style={{ fontWeight: 600 }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                )}

                {/* Select all + count */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={browseAllSelected}
                      indeterminate={!browseAllSelected && browseSomeSelected}
                      onChange={toggleBrowseSelectAll}
                    />
                    <span style={{ fontSize: "12px", fontWeight: 500 }} className="text-tv-text-primary">
                      {browseAllSelected ? "Deselect all" : browseSomeSelected ? `${browseSelectedIds.size} selected` : "Select all"}
                    </span>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: 500 }} className="text-tv-text-decorative">
                    {browsableConstituents.length} of {allConstituents.length - total} available
                  </span>
                </div>
              </div>

              {/* Virtualized browse list */}
              <div ref={browseParentRef} className="flex-1 overflow-y-auto">
                <div style={{ height: `${browseVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                  {browseVirtualizer.getVirtualItems().map(virtualRow => {
                    const r = browsableConstituents[virtualRow.index];
                    const isSelected = browseSelectedIds.has(r.id);
                    return (
                      <div
                        key={r.id}
                        ref={browseVirtualizer.measureElement}
                        data-index={virtualRow.index}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        onClick={() => toggleBrowseSelect(r.id)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 border-b border-tv-border-divider cursor-pointer transition-colors ${
                          isSelected ? "bg-tv-brand-tint/40" : "hover:bg-tv-surface/50"
                        }`}
                      >
                        <Checkbox checked={isSelected} onChange={() => toggleBrowseSelect(r.id)} />
                        <div className="flex-1 min-w-0">
                          <p style={{ fontSize: "11px", fontWeight: 500 }} className="text-tv-text-primary truncate">{r.name}</p>
                          <div className="flex items-center gap-1.5">
                            <p style={{ fontSize: "10px" }} className="text-tv-text-secondary truncate">{r.email}</p>
                            <span className="px-1.5 py-0.5 bg-tv-surface text-tv-text-decorative rounded-full shrink-0" style={{ fontSize: "8px", fontWeight: 500 }}>{r.group}</span>
                          </div>
                        </div>
                        {/* Individual add button */}
                        <button
                          onClick={e => { e.stopPropagation(); addToCampaign([r.id]); setBrowseSelectedIds(prev => { const n = new Set(prev); n.delete(r.id); return n; }); }}
                          className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-full bg-tv-brand-bg text-white hover:bg-tv-brand-hover transition-colors opacity-0 group-hover:opacity-100"
                          style={{ fontSize: "9px", fontWeight: 600 }}
                          title="Add to campaign"
                        >
                          <Plus size={9} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Floating action bar for multi-select */}
              {browseSelectedIds.size > 0 && (
                <div className="px-4 py-2.5 border-t border-tv-border-divider shrink-0 flex items-center justify-between bg-tv-brand-tint/30">
                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: "11px", fontWeight: 600 }} className="text-tv-brand">
                      {browseSelectedIds.size} selected
                    </span>
                    <button
                      onClick={() => setBrowseSelectedIds(new Set())}
                      className="text-[10px] text-tv-text-secondary hover:text-tv-text-primary transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                  <button
                    onClick={addBrowseSelectedToCampaign}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-tv-brand-bg text-white rounded-full hover:bg-tv-brand-hover transition-colors"
                    style={{ fontSize: "10px", fontWeight: 600 }}
                  >
                    <Plus size={11} />Add {browseSelectedIds.size} to Campaign
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ────── CSV Upload ────── */}
          {addMethod === "csv" && (
            <div className="flex-1 overflow-y-auto">
              <CSVImportWizard
                onImport={imported => {
                  const baseId = Date.now();
                  const newConstituents: Constituent[] = imported.map((c, i) => ({
                    id: baseId + i,
                    name: c.name,
                    email: c.email,
                    group: c.group || "Donors",
                    status: "ready" as const,
                    videoAssigned: null,
                    source: "csv",
                  }));
                  setExtraConstituents(prev => [...prev, ...newConstituents]);
                  addToCampaign(newConstituents.map(r => r.id));
                }}
              />
            </div>
          )}

          {/* ────── Manual Add ────── */}
          {addMethod === "manual" && (
            <div className="px-4 py-4 space-y-2.5">
              <p style={{ fontSize: "10px", fontWeight: 600 }} className="text-tv-text-label uppercase tracking-wider">Add Constituent</p>
              <input value={manualName} onChange={e => setManualName(e.target.value)} placeholder="Full name" aria-label="Constituent full name"
                className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
              <input value={manualEmail} onChange={e => setManualEmail(e.target.value)} placeholder="Email address" aria-label="Constituent email address"
                className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[11px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand" />
              <select value={manualGroup} onChange={e => setManualGroup(e.target.value)}
                className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[11px] outline-none focus:ring-1 focus:ring-tv-brand/40">
                {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    if (!manualName.trim() || !manualEmail.trim()) return;
                    const id = Date.now();
                    const newR: Constituent = {
                      id,
                      name: manualName.trim(),
                      email: manualEmail.trim(),
                      group: manualGroup,
                      status: "ready",
                      videoAssigned: null,
                      source: "manual",
                    };
                    setExtraConstituents(prev => [...prev, newR]);
                    addToCampaign([id]);
                    setManualName("");
                    setManualEmail("");
                  }}
                  disabled={!manualName.trim() || !manualEmail.trim()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-tv-brand-bg text-white rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontSize: "10px", fontWeight: 600 }}
                >
                  <Plus size={10} />Add to Campaign
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel — Campaign Constituents / Detail ── */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Campaign list header */}
        <div className="px-5 pt-4 pb-3 shrink-0 border-b border-tv-border-divider bg-tv-surface/30">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h4 style={{ fontSize: "12px", fontWeight: 800 }} className="text-tv-text-primary">Campaign Constituents</h4>
              <span className="px-2 py-0.5 bg-tv-brand-bg text-white rounded-full" style={{ fontSize: "9px", fontWeight: 700 }}>{total}</span>
            </div>
            <div className="flex items-center gap-1.5">
              {/* Column config */}
              <div className="relative">
                <button
                  onClick={() => setShowColConfig(!showColConfig)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-full text-[10px] transition-colors ${
                    showColConfig
                      ? "border-tv-brand bg-tv-brand-tint text-tv-brand"
                      : "border-tv-border-light text-tv-text-secondary hover:bg-tv-surface hover:border-tv-border-strong"
                  }`}
                  title="Adjust columns"
                >
                  <Columns size={10} />
                </button>
                {showColConfig && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-tv-border-light rounded-md shadow-lg z-20 p-1.5">
                    <p style={{ fontSize: "9px", fontWeight: 600 }} className="text-tv-text-label uppercase tracking-wider px-2 py-1">Visible Columns</p>
                    {COLUMN_DEFS.map(col => (
                      <button key={col.key}
                        onClick={() => { if (!col.required) toggleCol(col.key); }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-[10px] transition-colors ${col.required ? "opacity-50 cursor-not-allowed" : "hover:bg-tv-surface"}`}>
                        <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${visibleCols.has(col.key) ? "bg-tv-brand-bg border-tv-brand-bg" : "border-tv-border-light"}`}>
                          {visibleCols.has(col.key) && <Check size={8} className="text-white" />}
                        </div>
                        <span className="text-tv-text-primary">{col.label}</span>
                        {col.required && <span style={{ fontSize: "8px" }} className="text-tv-text-decorative ml-auto">Required</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* Bulk actions */}
              {campaignSelectedIds.size > 0 && (
                <button
                  onClick={removeSelectedFromCampaign}
                  className="flex items-center gap-1 px-3 py-1.5 border border-tv-danger-border text-tv-danger bg-tv-danger-bg rounded-full hover:bg-tv-danger-border/30 transition-colors"
                  style={{ fontSize: "10px", fontWeight: 500 }}
                >
                  <Trash2 size={10} />Remove {campaignSelectedIds.size}
                </button>
              )}
              {total > 0 && campaignSelectedIds.size === 0 && (
                <button
                  onClick={() => { setCampaignConstituentIds(new Set()); setFocusId(null); setCampaignSelectedIds(new Set()); }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-tv-danger-border text-tv-danger bg-tv-danger-bg rounded-full hover:bg-tv-danger-border/30 transition-colors"
                  style={{ fontSize: "10px", fontWeight: 500 }}
                >
                  <Trash2 size={10} />Clear All
                </button>
              )}
            </div>
          </div>

          {/* Search + select-all within campaign */}
          {total > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={campaignAllSelected}
                indeterminate={!campaignAllSelected && campaignSomeSelected}
                onChange={toggleCampaignSelectAll}
              />
              <PillSearchInput value={campaignSearch} onChange={setCampaignSearch} placeholder="Filter campaign constituents…" size="sm" className="flex-1" />
              {campaignSomeSelected && (
                <span style={{ fontSize: "9px", fontWeight: 500 }} className="text-tv-brand shrink-0">
                  {campaignSelectedIds.size} selected
                </span>
              )}
            </div>
          )}
        </div>

        {/* Campaign constituent list or empty state */}
        {total === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="w-16 h-16 rounded-full bg-tv-surface flex items-center justify-center mx-auto mb-3">
              <Users size={24} className="text-tv-text-decorative/40" />
            </div>
            <p style={{ fontSize: "13px", fontWeight: 600 }} className="text-tv-text-secondary">No constituents added yet</p>
            <p style={{ fontSize: "10px" }} className="text-tv-text-decorative mt-1 text-center max-w-[320px]">
              Use the panel on the left to add constituents from Salesforce, Blackbaud, ThankView lists, saved searches, or browse your database.
            </p>
          </div>
        ) : focusConstituent ? (
          /* Detail view */
          <div className="flex-1 overflow-y-auto p-5">
            <button
              onClick={() => setFocusId(null)}
              className="flex items-center gap-1 text-tv-brand hover:underline mb-3"
              style={{ fontSize: "10px", fontWeight: 500 }}
            >
              ← Back to list
            </button>
            <div className="max-w-[420px] space-y-4">
              {/* Constituent detail card */}
              <div className="bg-white border border-tv-border-light rounded-lg p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-tv-brand-tint flex items-center justify-center">
                    <User size={18} className="text-tv-brand" />
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontSize: "14px", fontWeight: 900 }} className="text-tv-text-primary">{focusConstituent.name}</p>
                    <p style={{ fontSize: "11px" }} className="text-tv-text-secondary flex items-center gap-1">
                      <Mail size={10} />{focusConstituent.email}
                    </p>
                  </div>
                  <button
                    onClick={() => { removeFromCampaign([focusConstituent.id]); }}
                    className="ml-auto shrink-0 flex items-center gap-1 px-2.5 py-1.5 border border-tv-danger-border text-tv-danger bg-tv-danger-bg rounded-full hover:bg-tv-danger-border/30 transition-colors"
                    style={{ fontSize: "9px", fontWeight: 600 }}
                  >
                    <Minus size={9} />Remove
                  </button>
                </div>

                {/* Delivery issue warning */}
                {(focusConstituent.emailStatus === "bounced" || focusConstituent.emailStatus === "invalid") && (
                  <div className="mb-4 p-2.5 bg-tv-danger-bg border border-tv-danger-border rounded-sm flex items-start gap-2">
                    <AlertTriangle size={11} className="text-tv-danger shrink-0 mt-0.5" />
                    <div style={{ fontSize: "10px" }} className="text-tv-danger leading-relaxed">
                      {focusConstituent.emailStatus === "bounced"
                        ? "Hard bounce — this email does not exist. This constituent will be excluded from the send."
                        : "Invalid email — the address format is incorrect. This constituent will be excluded from the send."}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p style={{ fontSize: "9px", fontWeight: 600 }} className="text-tv-text-label uppercase tracking-wider mb-0.5">Group</p>
                    <p style={{ fontSize: "12px" }} className="text-tv-text-primary">{focusConstituent.group}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: "9px", fontWeight: 600 }} className="text-tv-text-label uppercase tracking-wider mb-0.5">Status</p>
                    <span className={`inline-flex px-2 py-0.5 rounded-full ${
                      focusConstituent.status === "ready"
                        ? "bg-tv-success-bg text-tv-success"
                        : "bg-tv-warning-bg text-tv-warning"
                    }`} style={{ fontSize: "10px", fontWeight: 600 }}>
                      {focusConstituent.status === "ready" ? "Ready" : "Pending"}
                    </span>
                  </div>
                  {focusConstituent.source && (
                    <div>
                      <p style={{ fontSize: "9px", fontWeight: 600 }} className="text-tv-text-label uppercase tracking-wider mb-0.5">Source</p>
                      <p style={{ fontSize: "12px" }} className="text-tv-text-primary capitalize">{focusConstituent.source}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Video preview */}
              {hasPersonalizedClips && focusConstituent.videoAssigned && (
                <div className="bg-white border border-tv-border-light rounded-lg overflow-hidden">
                  <div className="aspect-[4/3] bg-gradient-to-br from-[#7c45b0] to-[#995cd3] flex items-center justify-center relative">
                    <div className="w-12 h-12 rounded-full bg-black/30 flex items-center justify-center backdrop-blur-sm cursor-pointer hover:bg-black/40 transition-colors">
                      <Play size={18} className="text-white ml-0.5" />
                    </div>
                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/60 text-white rounded" style={{ fontSize: "9px", fontFamily: "monospace" }}>
                      0:45
                    </div>
                  </div>
                  <div className="p-4">
                    <p style={{ fontSize: "12px", fontWeight: 600 }} className="text-tv-text-primary">{focusConstituent.videoAssigned}</p>
                    <p style={{ fontSize: "10px" }} className="text-tv-text-secondary mt-0.5">Assigned personalized video</p>
                    <div className="mt-3 relative">
                      <button
                        onClick={() => setSwapOpenId(swapOpenId === focusConstituent.id ? null : focusConstituent.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 border border-tv-border-light rounded-full text-tv-text-secondary hover:border-tv-brand-bg hover:text-tv-brand transition-colors"
                        style={{ fontSize: "10px", fontWeight: 500 }}
                      >
                        <RefreshCw size={10} />Swap Video
                      </button>
                      {swapOpenId === focusConstituent.id && (
                        <div className="absolute left-0 top-full mt-1 w-52 bg-white border border-tv-border-light rounded-sm shadow-lg z-20 overflow-hidden">
                          {SWAP_OPTIONS.map(opt => (
                            <button key={opt} onClick={() => setSwapOpenId(null)}
                              className={`w-full text-left px-3 py-2 text-[10px] hover:bg-tv-surface transition-colors ${
                                opt === "Remove Video" ? "text-tv-danger border-t border-tv-border-divider" : "text-tv-text-primary"
                              }`}>
                              {opt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {hasPersonalizedClips && !focusConstituent.videoAssigned && (
                <div className="bg-white border border-dashed border-tv-border-light rounded-lg p-6 text-center">
                  <Video size={24} className="text-tv-text-decorative/40 mx-auto mb-2" />
                  <p style={{ fontSize: "12px" }} className="text-tv-text-secondary">No personalized video assigned</p>
                  <p style={{ fontSize: "10px" }} className="text-tv-text-decorative mt-0.5">
                    This constituent will receive the shared campaign video instead.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Campaign constituents list with multi-select */
          <div className="flex-1 flex flex-col min-h-0">
            <div ref={campaignParentRef} className="flex-1 overflow-y-auto">
              <div style={{ height: `${campaignVirtualizer.getTotalSize()}px`, width: "100%", position: "relative" }}>
                {campaignVirtualizer.getVirtualItems().map(virtualRow => {
                  const r = filteredCampaign[virtualRow.index];
                  const hasIssue = r.emailStatus === "bounced" || r.emailStatus === "invalid";
                  const isSelected = campaignSelectedIds.has(r.id);
                  return (
                    <div
                      key={r.id}
                      ref={campaignVirtualizer.measureElement}
                      data-index={virtualRow.index}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className={`flex items-center gap-2 px-5 py-2.5 border-b border-tv-border-divider cursor-pointer transition-colors ${
                        isSelected ? "bg-tv-brand-tint/30" : "hover:bg-tv-surface/50"
                      }`}
                      onClick={() => setFocusId(r.id)}
                    >
                      {/* Multi-select checkbox */}
                      <Checkbox
                        checked={isSelected}
                        onChange={() => toggleCampaignSelect(r.id)}
                        size={13}
                      />

                      {/* Avatar */}
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        hasIssue ? "bg-tv-danger-bg" : "bg-tv-brand-tint"
                      }`}>
                        {hasIssue
                          ? <AlertTriangle size={11} className="text-tv-danger" />
                          : <User size={11} className="text-tv-brand" />
                        }
                      </div>

                      {/* Name + email */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p style={{ fontSize: "11px", fontWeight: 500 }} className="text-tv-text-primary truncate">{r.name}</p>
                          {visibleCols.has("status") && (
                            <span className={`px-1.5 py-0.5 uppercase rounded-full shrink-0 ${
                              r.status === "ready"
                                ? "bg-tv-success-bg text-tv-success"
                                : "bg-tv-warning-bg text-tv-warning"
                            }`} style={{ fontSize: "7px", fontWeight: 700 }}>
                              {r.status}
                            </span>
                          )}
                          {hasIssue && (
                            <span className="shrink-0 px-1 py-px bg-tv-danger-bg text-tv-danger rounded" style={{ fontSize: "7px", fontWeight: 600 }}>
                              {r.emailStatus === "bounced" ? "Bounced" : "Invalid"}
                            </span>
                          )}
                        </div>
                        {visibleCols.has("email") && (
                          <p style={{ fontSize: "10px" }} className="text-tv-text-secondary truncate">{r.email}</p>
                        )}
                      </div>

                      {/* Group badge */}
                      {visibleCols.has("group") && (
                        <span className="px-1.5 py-0.5 bg-tv-surface text-tv-text-secondary rounded-full shrink-0 truncate max-w-[70px]" style={{ fontSize: "8px", fontWeight: 500 }}>
                          {r.group}
                        </span>
                      )}

                      {/* Video pill */}
                      {hasPersonalizedClips && visibleCols.has("video") && (
                        <div className="shrink-0">
                          {r.videoAssigned ? (
                            <span className="px-1.5 py-0.5 bg-tv-brand-tint text-tv-brand rounded-full truncate max-w-[90px] inline-block" style={{ fontSize: "8px", fontWeight: 500 }}>
                              {r.videoAssigned}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-tv-surface text-tv-text-decorative rounded-full" style={{ fontSize: "8px", fontWeight: 500 }}>
                              No video
                            </span>
                          )}
                        </div>
                      )}

                      {/* Remove button */}
                      <button
                        onClick={e => { e.stopPropagation(); removeFromCampaign([r.id]); }}
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-tv-text-decorative hover:text-tv-danger hover:bg-tv-danger-bg transition-colors"
                        title="Remove from campaign"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

