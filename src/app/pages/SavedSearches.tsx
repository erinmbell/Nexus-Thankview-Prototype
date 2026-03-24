import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, Trash2, Edit2, Copy, ChevronRight, MoreHorizontal,
  Users, List, MapPin, DollarSign, Tag, Mail, Phone,
  Star, X, Calendar, Hash, Filter, Play, Pause, Eye, Download,
  RefreshCw, Zap, UserCheck, Info,
} from "lucide-react";
import {
  Box, Stack, Text, Title, Button, TextInput,
  ActionIcon, Modal, Badge, Avatar, Menu, Table, Select, Checkbox,
  Tooltip, UnstyledButton,
} from "@mantine/core";
import { TV } from "../theme";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { useToast } from "../contexts/ToastContext";
import { DeleteModal } from "../components/ui/DeleteModal";
import { FilterBar, FilterValues, FilterDef, DATE_CREATED_FILTER, dateFilterMatches } from "../components/FilterBar";
import { TablePagination } from "../components/TablePagination";
import { SortableHeader } from "../components/SortableHeader";
import type { SortDir } from "../components/SortableHeader";
import { EditColumnsModal, ColumnsButton } from "../components/ColumnCustomizer";
import type { ColumnDef } from "../components/ColumnCustomizer";

// ── Types ─────────────────────────────────────────────────────────────────────

interface CriterionDef {
  id: string;
  field: string;
  operator: string;
  value: string;
  category: string;
}

interface SavedSearch {
  id: number;
  name: string;
  description: string;
  criteria: CriterionDef[];
  matchCount: number;
  createdAt: string;
  updatedAt: string;
  lastRefreshed: string;
  creator: string;
  active: boolean;
  autoRefresh: boolean;
}

// ── Column definitions ────────────────────────────────────────────────────────

const ALL_COLUMNS: ColumnDef[] = [
  { key: "searchName", label: "Search",         group: "Summary", required: true },
  { key: "criteria",   label: "Criteria",        group: "Summary" },
  { key: "matches",    label: "Matches",         group: "Summary" },
  { key: "creator",    label: "Creator",          group: "Summary" },
  { key: "updatedAt",  label: "Last Refreshed",   group: "Summary" },
  { key: "createdAt",  label: "Created",           group: "Summary" },
  { key: "status",     label: "Status",            group: "Summary" },
  { key: "autoRefresh",label: "Auto-Refresh",      group: "Settings" },
];

const DEFAULT_ACTIVE_COLUMNS = ["searchName", "criteria", "matches", "creator", "updatedAt", "status"];

// ── Detail match member column definitions ────────────────────────────────────

const MATCH_COLUMNS: ColumnDef[] = [
  { key: "name",  label: "Name",  group: "Summary", required: true },
  { key: "email", label: "Email", group: "Summary" },
];

const DEFAULT_MATCH_COLUMNS = ["name", "email"];

// ── Saved Search–specific filter definitions ──────────────────────────────────

const SEARCH_FILTERS: FilterDef[] = [
  {
    key: "status", label: "Status", icon: Zap, type: "select", essential: true,
    options: [
      { value: "active", label: "Active", color: "green" },
      { value: "paused", label: "Paused", color: "gray" },
    ],
  },
  {
    key: "creator", label: "Creator", icon: UserCheck, type: "select", essential: true, searchable: true,
    options: [
      { value: "You", label: "You (mine)" },
      { value: "Kelley Molt", label: "Kelley Molt" },
      { value: "James Okafor", label: "James Okafor" },
      { value: "Michelle Park", label: "Michelle Park" },
      { value: "Sarah Hernandez", label: "Sarah Hernandez" },
      { value: "David Nguyen", label: "David Nguyen" },
      { value: "Rachel Thompson", label: "Rachel Thompson" },
      { value: "Marcus Williams", label: "Marcus Williams" },
      { value: "Amy Chen", label: "Amy Chen" },
      { value: "Brian Foster", label: "Brian Foster" },
      { value: "Linda Ramirez", label: "Linda Ramirez" },
      { value: "Tom Kowalski", label: "Tom Kowalski" },
      { value: "Priya Patel", label: "Priya Patel" },
      { value: "Carlos Reyes", label: "Carlos Reyes" },
      { value: "Hannah Kim", label: "Hannah Kim" },
      { value: "Ethan Brooks", label: "Ethan Brooks" },
      { value: "Nina Johansson", label: "Nina Johansson" },
      { value: "Derek Washington", label: "Derek Washington" },
      { value: "Fiona Li", label: "Fiona Li" },
      { value: "Andre Mitchell", label: "Andre Mitchell" },
      { value: "Samantha Clarke", label: "Samantha Clarke" },
      { value: "Ravi Subramanian", label: "Ravi Subramanian" },
      { value: "Olivia Grant", label: "Olivia Grant" },
      { value: "Jake Moreno", label: "Jake Moreno" },
      { value: "Tanya Volkov", label: "Tanya Volkov" },
    ],
  },
  {
    key: "criteriaField", label: "Field", icon: Filter, type: "multi-select", essential: true, searchable: true,
    options: [
      { value: "total_giving",   label: "Total Giving",           group: "Giving" },
      { value: "last_gift_date", label: "Last Gift Date",         group: "Giving" },
      { value: "open_rate",      label: "Open Rate",              group: "Engagement" },
      { value: "views",          label: "Views",                  group: "Engagement" },
      { value: "giving_level",   label: "Giving Level",           group: "Giving" },
      { value: "last_gift_amt",  label: "Last Gift Amount",       group: "Giving" },
      { value: "donor_status",   label: "Donor Status",           group: "Giving" },
      { value: "star_rating",    label: "Video Star Rating",      group: "Engagement" },
      { value: "campaigns_recv", label: "Campaigns Received",     group: "Engagement" },
      { value: "avg_engagement", label: "Avg. Engagement Score",  group: "Engagement" },
      { value: "click_rate",     label: "Click Rate",             group: "Engagement" },
      { value: "reply_count",    label: "Reply Count",            group: "Engagement" },
      { value: "state",          label: "State",                  group: "Location" },
      { value: "city",           label: "City",                   group: "Location" },
      { value: "zipcode",        label: "Zip Code",               group: "Location" },
      { value: "country",        label: "Country",                group: "Location" },
      { value: "age_range",      label: "Age Range",              group: "Demographics" },
      { value: "affiliation",    label: "Affiliation",            group: "Demographics" },
      { value: "class_year",     label: "Class Year",             group: "Demographics" },
      { value: "has_email",      label: "Has Valid Email",        group: "Constituent Info" },
      { value: "has_phone",      label: "Has Valid Phone",        group: "Constituent Info" },
      { value: "email_unsub",    label: "Email Unsubscribed",     group: "Constituent Info" },
      { value: "phone_unsub",    label: "Phone Unsubscribed",     group: "Constituent Info" },
      { value: "email_bounced",  label: "Email Bounced",          group: "Constituent Info" },
      { value: "email_spam",     label: "Marked as Spam",         group: "Constituent Info" },
      { value: "tags",           label: "Tags",                   group: "Tags & Custom" },
      { value: "custom_field",   label: "Custom Field",           group: "Tags & Custom" },
      { value: "remote_id",      label: "Remote (Donor) ID",      group: "Tags & Custom" },
    ],
  },
  {
    key: "matchCount", label: "Match Count", icon: Hash, type: "select",
    options: [
      { value: "0", label: "No matches (0)" },
      { value: "1-10", label: "1 – 10 matches" },
      { value: "11-50", label: "11 – 50 matches" },
      { value: "50+", label: "50+ matches" },
    ],
  },
  {
    key: "lastRefreshed", label: "Last Refreshed", icon: Calendar, type: "select",
    options: [
      { value: "today", label: "Today" },
      { value: "7d", label: "Last 7 days" },
      { value: "30d", label: "Last 30 days" },
      { value: "older", label: "More than 30 days ago" },
    ],
  },
  {
    key: "autoRefresh", label: "Auto-Refresh", icon: RefreshCw, type: "select",
    options: [
      { value: "on", label: "Auto-refresh on" },
      { value: "off", label: "Auto-refresh off" },
    ],
  },
  DATE_CREATED_FILTER,
];

// ── Field catalog ─────────────────────────────────────────────────────────────

const FIELD_OPTIONS = [
  { group: "Giving",       items: [
    { value: "total_giving",  label: "Total Giving" },
    { value: "last_gift_date",label: "Last Gift Date" },
    { value: "giving_level",  label: "Giving Level" },
    { value: "last_gift_amt", label: "Last Gift Amount" },
    { value: "donor_status",  label: "Donor Status" },
  ]},
  { group: "Engagement",   items: [
    { value: "open_rate",     label: "Open Rate" },
    { value: "views",         label: "Views" },
    { value: "star_rating",   label: "Video Star Rating" },
    { value: "campaigns_recv", label: "Campaigns Received" },
    { value: "avg_engagement", label: "Avg. Engagement Score" },
    { value: "click_rate",    label: "Click Rate" },
    { value: "reply_count",   label: "Reply Count" },
  ]},
  { group: "Location",     items: [
    { value: "state",        label: "State" },
    { value: "city",         label: "City" },
    { value: "zipcode",      label: "Zip Code" },
    { value: "country",      label: "Country" },
  ]},
  { group: "Demographics", items: [
    { value: "age_range",    label: "Age Range" },
    { value: "affiliation",  label: "Affiliation" },
    { value: "class_year",   label: "Class Year" },
  ]},
  { group: "Constituent Info",  items: [
    { value: "has_email",     label: "Has Valid Email" },
    { value: "has_phone",     label: "Has Valid Phone" },
    { value: "email_unsub",   label: "Email Unsubscribed" },
    { value: "phone_unsub",   label: "Phone Unsubscribed" },
    { value: "email_bounced", label: "Email Bounced" },
    { value: "email_spam",    label: "Marked as Spam" },
  ]},
  { group: "Tags & Custom", items: [
    { value: "tags",          label: "Tags" },
    { value: "custom_field",  label: "Custom Field" },
    { value: "remote_id",     label: "Remote (Donor) ID" },
  ]},
];

const OPERATOR_OPTIONS: Record<string, { value: string; label: string }[]> = {
  text:    [{ value: "is", label: "is" }, { value: "is_not", label: "is not" }, { value: "contains", label: "contains" }, { value: "starts_with", label: "starts with" }],
  number:  [{ value: "eq", label: "equals" }, { value: "gt", label: "greater than" }, { value: "lt", label: "less than" }, { value: "gte", label: "at least" }, { value: "lte", label: "at most" }],
  bool:    [{ value: "is_true", label: "Yes" }, { value: "is_false", label: "No" }],
  date:    [{ value: "before", label: "before" }, { value: "after", label: "after" }, { value: "within", label: "within last" }],
  rating:  [{ value: "gte", label: "at least" }, { value: "lte", label: "at most" }, { value: "eq", label: "exactly" }],
  list:    [{ value: "includes", label: "includes" }, { value: "excludes", label: "excludes" }],
};

function getFieldType(field: string): string {
  if (["has_email", "has_phone", "email_unsub", "phone_unsub", "email_bounced", "email_spam"].includes(field)) return "bool";
  if (["total_giving", "last_gift_amt", "campaigns_recv", "avg_engagement", "class_year", "open_rate", "views", "click_rate", "reply_count"].includes(field)) return "number";
  if (["last_gift_date"].includes(field)) return "date";
  if (["star_rating"].includes(field)) return "rating";
  if (["tags"].includes(field)) return "list";
  return "text";
}

function getFieldCategory(field: string): string {
  for (const g of FIELD_OPTIONS) {
    if (g.items.some(i => i.value === field)) return g.group;
  }
  return "Other";
}

function getFieldLabel(field: string): string {
  for (const g of FIELD_OPTIONS) {
    const item = g.items.find(i => i.value === field);
    if (item) return item.label;
  }
  return field;
}

const FIELD_ICON: Record<string, typeof MapPin> = {
  Location: MapPin, Giving: DollarSign, Demographics: Users,
  "Constituent Info": Mail, Engagement: Star, "Tags & Custom": Tag,
};

// ── Mock data ─────────────────────────────────────────────────────────────────

const INIT_SEARCHES: SavedSearch[] = [
  {
    id: 1, name: "Boston-Area Major Donors", description: "Donors in MA with $10k+ total giving",
    criteria: [
      { id: "c1", field: "state", operator: "is", value: "MA", category: "Location" },
      { id: "c2", field: "total_giving", operator: "gte", value: "10000", category: "Giving" },
    ],
    matchCount: 14, createdAt: "Jan 15, 2026", updatedAt: "Feb 27, 2026", lastRefreshed: "Feb 27, 2026",
    creator: "Kelley Molt", active: true, autoRefresh: true,
  },
  {
    id: 2, name: "Lapsed Donors (18+ months)", description: "Haven't given since Aug 2024",
    criteria: [
      { id: "c3", field: "last_gift_date", operator: "before", value: "2024-08-01", category: "Giving" },
      { id: "c4", field: "donor_status", operator: "is", value: "Lapsed", category: "Giving" },
    ],
    matchCount: 31, createdAt: "Nov 3, 2025", updatedAt: "Feb 27, 2026", lastRefreshed: "Feb 27, 2026",
    creator: "You", active: true, autoRefresh: true,
  },
  {
    id: 3, name: "High Engagement Alumni", description: "Alumni with 4+ star rating",
    criteria: [
      { id: "c5", field: "tags", operator: "includes", value: "Alumni", category: "Tags & Custom" },
      { id: "c6", field: "star_rating", operator: "gte", value: "4", category: "Engagement" },
    ],
    matchCount: 8, createdAt: "Feb 1, 2026", updatedAt: "Feb 27, 2026", lastRefreshed: "Feb 27, 2026",
    creator: "You", active: true, autoRefresh: true,
  },
  {
    id: 4, name: "Bounced Emails — Cleanup", description: "Constituents with bounced emails for data hygiene",
    criteria: [
      { id: "c7", field: "email_bounced", operator: "is_true", value: "", category: "Constituent Info" },
    ],
    matchCount: 5, createdAt: "Dec 10, 2025", updatedAt: "Feb 27, 2026", lastRefreshed: "Feb 26, 2026",
    creator: "James Okafor", active: true, autoRefresh: false,
  },
  {
    id: 5, name: "TX Prospective Donors", description: "Prospective donors located in Texas",
    criteria: [
      { id: "c8", field: "state", operator: "is", value: "TX", category: "Location" },
      { id: "c9", field: "giving_level", operator: "is", value: "Prospective", category: "Giving" },
    ],
    matchCount: 12, createdAt: "Sep 22, 2025", updatedAt: "Feb 25, 2026", lastRefreshed: "Feb 25, 2026",
    creator: "Michelle Park", active: false, autoRefresh: true,
  },
  {
    id: 6, name: "Unsubscribed Constituents", description: "Constituents who opted out of email",
    criteria: [
      { id: "c10", field: "email_unsub", operator: "is_true", value: "", category: "Constituent Info" },
    ],
    matchCount: 19, createdAt: "Oct 14, 2025", updatedAt: "Feb 27, 2026", lastRefreshed: "Feb 27, 2026",
    creator: "You", active: true, autoRefresh: true,
  },
  {
    id: 7, name: "Class of 2002 – No Phone", description: "2002 alumni missing phone for phonathon prep",
    criteria: [
      { id: "c11", field: "class_year", operator: "eq", value: "2002", category: "Demographics" },
      { id: "c12", field: "has_phone", operator: "is_false", value: "", category: "Constituent Info" },
    ],
    matchCount: 4, createdAt: "Feb 20, 2026", updatedAt: "Feb 27, 2026", lastRefreshed: "Feb 27, 2026",
    creator: "You", active: true, autoRefresh: true,
  },
];


// ── Sort helpers ──────────────────────────────────────────────────────────────

function getSearchSortValue(s: SavedSearch, key: string): string {
  switch (key) {
    case "searchName": return s.name;
    case "criteria":   return s.criteria.map(c => c.field).join(", ");
    case "matches":    return String(s.matchCount).padStart(8, "0");
    case "creator":    return s.creator;
    case "updatedAt":  return s.updatedAt;
    case "createdAt":  return s.createdAt;
    case "status":     return s.active ? "Active" : "Paused";
    case "autoRefresh":return s.autoRefresh ? "On" : "Off";
    default:           return "";
  }
}

// ── Criterion Row Component ───────────────────────────────────────────────────

function CriterionRow({ criterion, onChange, onRemove }: {
  criterion: CriterionDef;
  onChange: (c: CriterionDef) => void;
  onRemove: () => void;
}) {
  const fieldType = getFieldType(criterion.field);
  const operators = OPERATOR_OPTIONS[fieldType] ?? OPERATOR_OPTIONS.text;
  const allFields = FIELD_OPTIONS;

  return (
    <Box bg={TV.surface} p="sm" style={{ borderRadius: 12, border: `1px solid ${TV.borderLight}` }}>
      <div className="flex items-end gap-3 flex-wrap">
        <Select
          label="Field" size="xs" w={200}
          data={allFields}
          value={criterion.field || null}
          placeholder="Choose a field…"
          onChange={v => {
            if (!v) return;
            const newType = getFieldType(v);
            const newOps = OPERATOR_OPTIONS[newType] ?? OPERATOR_OPTIONS.text;
            onChange({ ...criterion, field: v, operator: newOps[0].value, value: "", category: getFieldCategory(v) });
          }}
          searchable
          styles={{ input: { borderColor: TV.borderLight, fontSize: 12 } }}
          comboboxProps={{ shadow: "md" }}
        />
        <Select
          label="Condition" size="xs" w={140}
          data={operators}
          value={criterion.operator}
          onChange={v => v && onChange({ ...criterion, operator: v })}
          styles={{ input: { borderColor: TV.borderLight, fontSize: 12 } }}
          comboboxProps={{ shadow: "md" }}
        />
        {fieldType !== "bool" && (
          <TextInput
            label="Value" size="xs" style={{ flex: 1, minWidth: 120 }}
            placeholder={fieldType === "number" || fieldType === "rating" ? "e.g. 10000" : "e.g. MA"}
            value={criterion.value}
            onChange={e => onChange({ ...criterion, value: e.currentTarget.value })}
            styles={{ input: { borderColor: TV.borderLight, fontSize: 12 } }}
          />
        )}
        <Tooltip label="Remove criterion" withArrow>
          <ActionIcon variant="subtle" color="red" size="sm" onClick={onRemove} mt={fieldType === "bool" ? 18 : 0}>
            <X size={14} />
          </ActionIcon>
        </Tooltip>
      </div>
    </Box>
  );
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────

function SearchFormModal({ search, onClose, onSave }: {
  search?: SavedSearch | null;
  onClose: () => void;
  onSave: (data: { name: string; description: string; criteria: CriterionDef[] }) => void;
}) {
  const [name, setName] = useState(search?.name ?? "");
  const [desc, setDesc] = useState(search?.description ?? "");
  const [criteria, setCriteria] = useState<CriterionDef[]>(
    search?.criteria ?? []
  );

  const addCriterion = () => {
    setCriteria(c => [...c, { id: `new-${Date.now()}-${c.length}`, field: "", operator: "is", value: "", category: "" }]);
  };

  const updateCriterion = (idx: number, updated: CriterionDef) => {
    setCriteria(c => c.map((cr, i) => i === idx ? updated : cr));
  };

  const removeCriterion = (idx: number) => {
    setCriteria(c => c.filter((_, i) => i !== idx));
  };

  const valid = name.trim() && criteria.length > 0 && criteria.every(c =>
    c.field.trim() && c.operator && (getFieldType(c.field) === "bool" || c.value.trim())
  );

  // Simulated estimated match count based on criteria completeness
  const estimatedMatches = useMemo(() => {
    if (!valid) return null;
    // In production this would call a backend endpoint; here we simulate a stable count from criteria
    let hash = 0;
    const key = criteria.map(c => `${c.field}|${c.operator}|${c.value}`).join("~");
    for (let i = 0; i < key.length; i++) hash = ((hash << 5) - hash + key.charCodeAt(i)) | 0;
    return Math.abs(hash % 200) + 1;
  }, [criteria, valid]);

  return (
    <Modal opened onClose={onClose} title={search ? "Edit Saved Search" : "Create Saved Search"} size="lg">
      <Stack gap="sm">
        <TextInput label="Search Name" placeholder="e.g. Boston-Area Major Donors" value={name}
          onChange={e => setName(e.currentTarget.value)} data-autofocus />
        <TextInput label="Description" placeholder="Optional description…" value={desc}
          onChange={e => setDesc(e.currentTarget.value)} />

        <Box bg={TV.brandTint} px="md" py="sm" mt="xs" style={{ borderRadius: 10, border: `1px solid ${TV.borderLight}` }}>
          <div className="flex items-center gap-3">
            <RefreshCw size={14} style={{ color: TV.textBrand }} />
            <Text fz={12} c={TV.textBrand} fw={600}>
              Auto-updating search — constituents matching all criteria below will be included automatically as data changes.
            </Text>
          </div>
        </Box>

        <Box mt="xs">
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em">
              Criteria — constituents matching ALL of:
            </Text>
            <Button size="compact-xs" variant="light" color="tvPurple" leftSection={<Plus size={12} />}
              onClick={addCriterion}>
              Add Criterion
            </Button>
          </div>

          <Stack gap="xs">
            {criteria.map((c, i) => (
              <CriterionRow key={c.id} criterion={c}
                onChange={updated => updateCriterion(i, updated)}
                onRemove={() => removeCriterion(i)} />
            ))}
          </Stack>

          {criteria.length === 0 && (
            <Box bg={TV.surface} p="lg" style={{ borderRadius: 12, textAlign: "center" }}>
              <Text fz={13} c={TV.textSecondary} mb={8}>No criteria yet. Add a criterion to start building your search.</Text>
              <Button size="compact-sm" variant="light" color="tvPurple" leftSection={<Plus size={13} />}
                onClick={addCriterion}>
                Add Your First Criterion
              </Button>
            </Box>
          )}
        </Box>

        {/* Estimated match count */}
        {estimatedMatches !== null && (
          <Box bg={TV.surface} px="md" py="sm" style={{ borderRadius: 10, border: `1px solid ${TV.borderLight}` }}>
            <div className="flex items-center gap-3">
              <Users size={15} style={{ color: TV.textBrand, flexShrink: 0 }} />
              <div className="flex items-center gap-2">
                <Text fz={13} fw={700} c={TV.textBrand}>{estimatedMatches}</Text>
                <Text fz={12} c={TV.textSecondary}>estimated matching constituents</Text>
                <Tooltip
                  label="This is an estimate of how many constituents in your database currently match all of the criteria above. The actual count will be calculated when the search is saved."
                  withArrow multiline w={280} position="top"
                >
                  <Box component="span" style={{ display: "inline-flex", alignItems: "center", cursor: "help" }}>
                    <Info size={13} style={{ color: TV.textSecondary }} />
                  </Box>
                </Tooltip>
              </div>
            </div>
          </Box>
        )}
      </Stack>

      <div className="flex items-center justify-end gap-3" style={{ marginTop: 20 }}>
        <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
        <Button color="tvPurple" onClick={() => onSave({ name, description: desc, criteria })} disabled={!valid}>
          {search ? "Save Changes" : "Create Search"}
        </Button>
      </div>
    </Modal>
  );
}

// ── Criteria Summary (inline badges) ──────────────────────────────────────────

function formatCriterionText(c: CriterionDef): string {
  const label = getFieldLabel(c.field);
  const fieldType = getFieldType(c.field);
  const op = c.operator.replace(/_/g, " ");
  const displayValue = fieldType === "bool" ? (c.operator === "is_true" ? "Yes" : "No") : c.value;
  return `${label} ${fieldType !== "bool" ? op + " " : ""}${displayValue}`;
}

function CriteriaSummary({ criteria }: { criteria: CriterionDef[] }) {
  const tooltipContent = (
    <div style={{ maxWidth: 320 }}>
      <Text fz={11} fw={700} c="white" mb={4}>
        {criteria.length === 1 ? "1 Criterion" : `${criteria.length} Criteria`} — match ALL:
      </Text>
      {criteria.map((c, i) => {
        const Icon = FIELD_ICON[c.category] ?? Filter;
        return (
          <div key={c.id} className="flex items-start gap-1.5" style={{ marginBottom: i < criteria.length - 1 ? 4 : 0 }}>
            <Icon size={11} style={{ color: "rgba(255,255,255,0.6)", marginTop: 2, flexShrink: 0 }} />
            <Text fz={11} c="white" style={{ lineHeight: 1.4 }}>
              {formatCriterionText(c)}
            </Text>
          </div>
        );
      })}
    </div>
  );

  return (
    <Tooltip label={tooltipContent} multiline withArrow position="bottom-start" maw={360}>
      <div className="flex items-center gap-1 flex-wrap cursor-default">
        {criteria.slice(0, 3).map(c => {
          const Icon = FIELD_ICON[c.category] ?? Filter;
          return (
            <Badge key={c.id} variant="light" color="tvPurple" size="sm" radius="xl"
              leftSection={<Icon size={10} />}>
              {formatCriterionText(c)}
            </Badge>
          );
        })}
        {criteria.length > 3 && (
          <Badge variant="light" color="gray" size="sm" radius="xl">
            +{criteria.length - 3} more
          </Badge>
        )}
      </div>
    </Tooltip>
  );
}

// ── Cell renderer ─────────────────────────────────────────────────────────────

function SearchCellValue({ col, search: s }: { col: string; search: SavedSearch }) {
  switch (col) {
    case "searchName":
      return (
        <div className="flex items-center gap-2 flex-nowrap">
          <Box w={34} h={34} bg={s.active ? TV.brandTint : TV.surface}
            style={{ borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Filter size={15} style={{ color: s.active ? TV.textBrand : TV.textLabel }} />
          </Box>
          <div style={{ minWidth: 0 }}>
            <div className="flex items-center gap-1.5 flex-nowrap">
              <Text fz={13} fw={600} c={TV.textBrand} truncate className="hover:underline">{s.name}</Text>
              {!s.active && <Badge size="xs" color="gray" variant="light">Paused</Badge>}
            </div>
            {s.description && <Text fz={11} c={TV.textSecondary} truncate>{s.description}</Text>}
          </div>
        </div>
      );
    case "criteria":
      return <CriteriaSummary criteria={s.criteria} />;
    case "matches":
      return (
        <div className="flex items-center gap-1.5 flex-nowrap">
          <Tooltip label={`${s.matchCount} constituent${s.matchCount !== 1 ? "s" : ""} currently match this search's criteria`} withArrow>
            <Badge variant="light" color="tvPurple" size="sm" style={{ cursor: "default" }}>{s.matchCount}</Badge>
          </Tooltip>
          {s.autoRefresh && (
            <Tooltip label="Auto-updates as constituent data changes" withArrow>
              <RefreshCw size={11} style={{ color: TV.textBrand }} />
            </Tooltip>
          )}
        </div>
      );
    case "creator":
      return (
        <div className="flex items-center gap-1.5 flex-nowrap">
          <Avatar size="xs" radius="xl" color="tvPurple">{s.creator[0]}</Avatar>
          <Text fz={12} c={TV.textSecondary}>{s.creator}</Text>
          {s.creator === "You" && <Badge size="xs" color="tvPurple" variant="filled" radius="xl">You</Badge>}
        </div>
      );
    case "updatedAt":
      return (
        <div className="flex items-center gap-1.5 flex-nowrap">
          <Text fz={12} c={TV.textSecondary}>{s.lastRefreshed}</Text>
        </div>
      );
    case "createdAt":
      return <Text fz={12} c={TV.textSecondary}>{s.createdAt}</Text>;
    case "status":
      return (
        <Badge size="sm" variant="light" color={s.active ? "green" : "gray"} radius="xl">
          {s.active ? "Active" : "Paused"}
        </Badge>
      );
    case "autoRefresh":
      return (
        <div className="flex items-center gap-1.5">
          <RefreshCw size={12} style={{ color: s.autoRefresh ? TV.success : TV.textSecondary }} />
          <Text fz={12} c={s.autoRefresh ? TV.success : TV.textSecondary}>
            {s.autoRefresh ? "On" : "Off"}
          </Text>
        </div>
      );
    default:
      return <Text fz={12} c={TV.textSecondary}>—</Text>;
  }
}

// ── Pagination ────────────────────────────────────────────────────────────────




// ── Recently Used Sidebar ───────────────────────────────��─────────────────────


// ── Detail View ───────────────────────────────────────────────────────────────

function SearchDetail({ search, onBack, onEdit, onDuplicate, onToggleActive, onToggleAutoRefresh, onDelete, onRefresh }: {
  search: SavedSearch;
  onBack: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
  onToggleAutoRefresh: () => void;
  onDelete: () => void;
  onRefresh: () => void;
}) {
  const navigate = useNavigate();
  const { show } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const mockMatches = [
    { id: 1, first: "James", last: "Whitfield", email: "j.whitfield@alumni.edu", avatar: "JW", color: "#7c45b0" },
    { id: 5, first: "David", last: "Park",      email: "d.park@alumni.edu",      avatar: "DP", color: "#dc2626" },
    { id: 8, first: "Linda", last: "Osei",       email: "l.osei@alumni.edu",      avatar: "LO", color: "#c026d3" },
  ].slice(0, Math.min(search.matchCount, 3));

  const [detailSort, setDetailSort] = useState<{ col: string; dir: SortDir }>({ col: "name", dir: "asc" });
  const [detailPage, setDetailPage] = useState(1);
  const [detailRowsPerPage, setDetailRowsPerPage] = useState(10);
  const [detailSelected, setDetailSelected] = useState<number[]>([]);
  const toggleDetailSort = (col: string) => {
    setDetailSort(prev => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
  };
  const toggleDetailSelect = (id: number) => setDetailSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const sortedMatches = [...mockMatches].sort((a, b) => {
    const { col, dir } = detailSort;
    if (!col || !dir) return 0;
    let av: string, bv: string;
    if (col === "name") { av = `${a.first} ${a.last}`.toLowerCase(); bv = `${b.first} ${b.last}`.toLowerCase(); }
    else { av = (a.email ?? "").toLowerCase(); bv = (b.email ?? "").toLowerCase(); }
    const cmp = av.localeCompare(bv);
    return dir === "asc" ? cmp : -cmp;
  });
  const clampedDetailPage = Math.max(1, Math.min(detailPage, Math.ceil(search.matchCount / detailRowsPerPage) || 1));
  const detailStart = (clampedDetailPage - 1) * detailRowsPerPage;
  const paginatedMatches = sortedMatches.slice(detailStart, detailStart + detailRowsPerPage);
  const allOnDetailPageSelected = paginatedMatches.length > 0 && paginatedMatches.every(c => detailSelected.includes(c.id));
  const toggleDetailAll = () => {
    if (allOnDetailPageSelected) setDetailSelected(s => s.filter(id => !paginatedMatches.some(c => c.id === id)));
    else setDetailSelected(s => [...new Set([...s, ...paginatedMatches.map(c => c.id)])]);
  };

  return (
    <Box>
      <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
        <Breadcrumbs items={[
          { label: "Saved Searches", onClick: onBack },
          { label: search.name },
        ]} />
      </div>

      <div className="flex items-start justify-between flex-wrap gap-3" style={{ marginBottom: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-3 flex-wrap">
            <Title order={3} fz={20} c={TV.textPrimary}>{search.name}</Title>
            <Badge size="sm" variant="light" color={search.active ? "green" : "gray"}>
              {search.active ? "Active" : "Paused"}
            </Badge>
            {search.autoRefresh && (
              <Tooltip label="Auto-refreshes as constituent data changes" withArrow>
                <Badge size="sm" variant="light" color="tvPurple" leftSection={<RefreshCw size={10} />}>
                  Auto-updating
                </Badge>
              </Tooltip>
            )}
          </div>
          {search.description && <Text fz={13} c={TV.textSecondary} mt={4}>{search.description}</Text>}
          <div className="flex items-center gap-4 flex-wrap" style={{ marginTop: 10 }}>
            <Text fz={12} c={TV.textLabel}>Created by {search.creator} · {search.createdAt}</Text>
            <Text fz={12} c={TV.textLabel}>Last refreshed {search.lastRefreshed}</Text>
          </div>
        </div>

        {/* ── Action toolbar ── */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button size="compact-sm" variant="light" color="tvPurple" leftSection={<Edit2 size={13} />}
            onClick={onEdit}>
            Edit
          </Button>
          <Button size="compact-sm" variant="default" leftSection={search.active ? <Pause size={13} /> : <Play size={13} />}
            onClick={onToggleActive}>
            {search.active ? "Pause" : "Activate"}
          </Button>
          <Tooltip label={search.autoRefresh ? "Turn off auto-refresh" : "Turn on auto-refresh"} withArrow>
            <Button size="compact-sm" variant="default"
              leftSection={<RefreshCw size={13} style={{ color: search.autoRefresh ? TV.success : TV.textSecondary }} />}
              onClick={onToggleAutoRefresh}>
              {search.autoRefresh ? "Auto-refresh On" : "Auto-refresh Off"}
            </Button>
          </Tooltip>
          <Menu shadow="md" width={180} position="bottom-end">
            <Menu.Target>
              <ActionIcon variant="default" size="md" radius={8}
                styles={{ root: { borderColor: TV.borderLight } }} aria-label="Search actions">
                <MoreHorizontal size={15} style={{ color: TV.textLabel }} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item fz={13} leftSection={<Copy size={14} />} onClick={onDuplicate}>
                Duplicate
              </Menu.Item>
              <Menu.Item fz={13} leftSection={<RefreshCw size={14} />} onClick={onRefresh}>
                Refresh Now
              </Menu.Item>
              <Menu.Item fz={13} leftSection={<Download size={14} />}
                onClick={() => show(`Exported ${search.matchCount} results from "${search.name}"`, "success")}>
                Export Results
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item fz={13} color="red" leftSection={<Trash2 size={14} />}
                onClick={() => setShowDeleteConfirm(true)}>
                Delete Search
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </div>

      <div className="rounded-lg border" style={{ borderColor: TV.borderLight, padding: 20, marginBottom: 16 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em">
            Search Criteria (matches ALL)
          </Text>
          <Button size="compact-xs" variant="light" color="tvPurple" leftSection={<Edit2 size={11} />}
            onClick={onEdit}>
            Edit Criteria
          </Button>
        </div>
        <Stack gap="xs">
          {search.criteria.map(c => {
            const Icon = FIELD_ICON[c.category] ?? Filter;
            const label = getFieldLabel(c.field);
            const fieldType = getFieldType(c.field);
            const op = c.operator.replace(/_/g, " ");
            const displayValue = fieldType === "bool" ? (c.operator === "is_true" ? "Yes" : "No") : c.value;

            return (
              <Box key={c.id} bg={TV.surface} px="md" py="sm" style={{ borderRadius: 10 }}>
                <div className="flex items-center gap-3">
                  <Box w={30} h={30} bg="white" style={{ borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} style={{ color: TV.textBrand }} />
                  </Box>
                  <Text fz={13} c={TV.textPrimary}>
                    <Text span fw={600}>{label}</Text>
                    {" "}
                    <Text span c={TV.textSecondary}>{fieldType !== "bool" ? op : ""}</Text>
                    {" "}
                    <Text span fw={600} c={TV.textBrand}>{displayValue}</Text>
                  </Text>
                </div>
              </Box>
            );
          })}
        </Stack>
      </div>

      <div className="rounded-lg border" style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
        <Box px="lg" py="md" bg={TV.surfaceMuted} style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users size={16} style={{ color: TV.textBrand }} />
              <div>
                <Text fz={13} fw={700} c={TV.textPrimary}>
                  {search.matchCount} matching constituent{search.matchCount !== 1 ? "s" : ""}
                </Text>
                <Text fz={10} c={TV.textSecondary}>
                  Constituents currently matching all search criteria
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <RefreshCw size={12} style={{ color: TV.success }} />
              <Text fz={11} c={TV.textSecondary}>Auto-updates as constituent data changes</Text>
            </div>
          </div>
        </Box>

        {detailSelected.length > 0 && (
          <Box px="md" py="xs" bg={TV.brandTint} style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
            <div className="flex items-center justify-between">
              <Text fz={12} fw={600} c={TV.textBrand}>{detailSelected.length} constituent{detailSelected.length !== 1 ? "s" : ""} selected</Text>
              <div className="flex items-center gap-2">
                <Button size="xs" variant="light" color="tvPurple" leftSection={<List size={12} />}
                  onClick={() => { show(`${detailSelected.length} constituent${detailSelected.length !== 1 ? "s" : ""} added to list`, "success"); setDetailSelected([]); }}>
                  Add to List
                </Button>
                <Button size="xs" variant="light" color="tvPurple" leftSection={<Download size={12} />}
                  onClick={() => { show(`Exported ${detailSelected.length} constituent${detailSelected.length !== 1 ? "s" : ""}`, "success"); setDetailSelected([]); }}>
                  Export
                </Button>
                <Button size="xs" variant="subtle" color="gray" onClick={() => setDetailSelected([])}>Clear</Button>
              </div>
            </div>
          </Box>
        )}
        <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
        <Table verticalSpacing={0} horizontalSpacing={0} highlightOnHover
          styles={{ table: { borderCollapse: "collapse", minWidth: 500 }, td: { whiteSpace: "nowrap" } }}>
          <Table.Thead className="sticky top-0 z-20" style={{ backgroundColor: TV.surfaceMuted }}>
            <Table.Tr style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
              <Table.Th w={44} style={{ padding: "10px 0 10px 16px", verticalAlign: "middle" }}>
                <Checkbox
                  checked={allOnDetailPageSelected}
                  indeterminate={detailSelected.length > 0 && !allOnDetailPageSelected}
                  onChange={toggleDetailAll} color="tvPurple" size="xs"
                />
              </Table.Th>
              <Table.Th style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                <SortableHeader label="Name" sortKey="name" currentSort={detailSort.col} currentDir={detailSort.dir} onSort={toggleDetailSort} />
              </Table.Th>
              <Table.Th style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                <SortableHeader label="Email" sortKey="email" currentSort={detailSort.col} currentDir={detailSort.dir} onSort={toggleDetailSort} />
              </Table.Th>
              <Table.Th w={60} style={{ padding: "10px 16px", verticalAlign: "middle" }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedMatches.map(c => (
              <Table.Tr key={c.id} onClick={() => navigate(`/contacts/${c.id}`)} style={{ cursor: "pointer", borderBottom: `1px solid ${TV.borderDivider}` }}>
                <Table.Td style={{ padding: "12px 0 12px 16px", verticalAlign: "middle" }}
                  onClick={e => { e.stopPropagation(); toggleDetailSelect(c.id); }}>
                  <Checkbox checked={detailSelected.includes(c.id)} onChange={() => toggleDetailSelect(c.id)} color="tvPurple" size="xs" />
                </Table.Td>
                <Table.Td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                  <div className="flex items-center gap-2 flex-nowrap">
                    <Avatar size="sm" radius="xl"
                      styles={{ placeholder: { backgroundColor: c.color, color: "white" } }}>{c.avatar}</Avatar>
                    <Text fz={13} fw={600} c={TV.textPrimary}>{c.first} {c.last}</Text>
                  </div>
                </Table.Td>
                <Table.Td style={{ padding: "12px 16px", verticalAlign: "middle" }}><Text fz={12} c={TV.textSecondary}>{c.email}</Text></Table.Td>
                <Table.Td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                  <ActionIcon variant="subtle" color="gray" size="sm" aria-label="View profile"><ChevronRight size={14} aria-hidden="true" /></ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        </div>
        <TablePagination
          page={clampedDetailPage}
          rowsPerPage={detailRowsPerPage}
          totalRows={search.matchCount}
          onPageChange={setDetailPage}
          onRowsPerPageChange={setDetailRowsPerPage}
        />
      </div>

      {showDeleteConfirm && (
        <DeleteModal
          title={`Delete "${search.name}"?`}
          description="This saved search will be permanently removed. No constituents will be deleted."
          onConfirm={onDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function SavedSearches() {
  const { show } = useToast();
  const [searches, setSearches] = useState<SavedSearch[]>(INIT_SEARCHES);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  // Column customization
  const [activeColumns, setActiveColumns] = useState<string[]>(DEFAULT_ACTIVE_COLUMNS);

  // Filters
  const DEFAULT_FILTER_KEYS = SEARCH_FILTERS.filter(f => f.essential).map(f => f.key);
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(DEFAULT_FILTER_KEYS);
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  // Sort
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [showEditColumns, setShowEditColumns] = useState(false);
  const [editTarget, setEditTarget] = useState<SavedSearch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SavedSearch | null>(null);
  const [detailView, setDetailView] = useState<SavedSearch | null>(null);

  // Sort handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortKey(null); setSortDir(null); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };


  // Filtered & sorted
  const filtered = useMemo(() => {
    let result = searches.filter(s =>
      `${s.name} ${s.description} ${s.creator}`.toLowerCase().includes(search.toLowerCase())
    );

    for (const [key, vals] of Object.entries(filterValues)) {
      if (!vals || vals.length === 0) continue;
      switch (key) {
        case "status":
          result = result.filter(s => {
            if (vals.includes("active")) return s.active;
            if (vals.includes("paused")) return !s.active;
            return true;
          });
          break;
        case "creator":
          result = result.filter(s => vals.includes(s.creator));
          break;
        case "criteriaField":
          result = result.filter(s =>
            vals.some(v => s.criteria.some(c => c.field === v))
          );
          break;
        case "matchCount":
          result = result.filter(s => {
            const count = s.matchCount;
            if (vals.includes("0")) return count === 0;
            if (vals.includes("1-10")) return count >= 1 && count <= 10;
            if (vals.includes("11-50")) return count >= 11 && count <= 50;
            if (vals.includes("50+")) return count > 50;
            return true;
          });
          break;
        case "autoRefresh":
          result = result.filter(s => {
            if (vals.includes("on")) return s.autoRefresh;
            if (vals.includes("off")) return !s.autoRefresh;
            return true;
          });
          break;
        case "dateCreated": {
          result = result.filter(s => {
            const d = new Date(s.createdAt);
            if (isNaN(d.getTime())) return true;
            const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            return dateFilterMatches(iso, vals);
          });
          break;
        }
        default:
          break;
      }
    }

    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        const aVal = getSearchSortValue(a, sortKey);
        const bVal = getSearchSortValue(b, sortKey);
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [searches, search, sortKey, sortDir, filterValues]);

  // Pagination
  const paginatedSearches = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  // Select
  const allOnPageSelected = paginatedSearches.length > 0 && paginatedSearches.every(s => selected.includes(s.id));
  const toggleSelect = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => {
    if (allOnPageSelected) setSelected(s => s.filter(id => !paginatedSearches.some(sr => sr.id === id)));
    else setSelected(s => [...new Set([...s, ...paginatedSearches.map(sr => sr.id)])]);
  };

  // Handlers
  const handleCreate = (data: { name: string; description: string; criteria: CriterionDef[] }) => {
    const newSearch: SavedSearch = {
      id: Date.now(), name: data.name, description: data.description,
      criteria: data.criteria,
      matchCount: Math.floor(Math.random() * 30) + 3,
      createdAt: "Feb 27, 2026", updatedAt: "Feb 27, 2026", lastRefreshed: "Feb 27, 2026",
      creator: "You", active: true, autoRefresh: true,
    };
    setSearches(ss => [newSearch, ...ss]);
    setShowCreate(false);
    show("Saved search created! It will auto-update as constituent data changes.", "success");
  };

  const handleEdit = (data: { name: string; description: string; criteria: CriterionDef[] }) => {
    if (!editTarget) return;
    setSearches(ss => ss.map(s => s.id === editTarget.id
      ? { ...s, name: data.name, description: data.description, criteria: data.criteria, updatedAt: "Feb 27, 2026" }
      : s
    ));
    if (detailView?.id === editTarget.id) {
      setDetailView(prev => prev ? { ...prev, name: data.name, description: data.description, criteria: data.criteria } : null);
    }
    setEditTarget(null);
    show("Search updated!", "success");
  };

  const handleDelete = (id: number) => {
    setSearches(ss => ss.filter(s => s.id !== id));
    setDeleteTarget(null);
    if (detailView?.id === id) setDetailView(null);
    setSelected(s => s.filter(x => x !== id));
    show("Saved search deleted", "success");
  };

  const handleToggleActive = (id: number) => {
    setSearches(ss => ss.map(s => s.id === id ? { ...s, active: !s.active } : s));
    const item = searches.find(s => s.id === id);
    show(item?.active ? "Search paused — it will no longer auto-update" : "Search activated — it will auto-update again", "success");
  };

  const handleToggleAutoRefresh = (id: number) => {
    setSearches(ss => ss.map(s => s.id === id ? { ...s, autoRefresh: !s.autoRefresh } : s));
    const item = searches.find(s => s.id === id);
    show(item?.autoRefresh ? "Auto-refresh turned off" : "Auto-refresh turned on — search will update automatically", "success");
  };

  const handleRefresh = (id: number) => {
    const item = searches.find(s => s.id === id);
    if (!item) return;
    const newCount = item.matchCount + Math.floor(Math.random() * 5) - 2;
    setSearches(ss => ss.map(s => s.id === id ? { ...s, lastRefreshed: "Mar 17, 2026", matchCount: Math.max(0, newCount) } : s));
    show(`"${item.name}" refreshed — ${Math.max(0, newCount)} matches found`, "success");
  };

  const handleDuplicate = (s: SavedSearch) => {
    const dup: SavedSearch = {
      ...s, id: Date.now(), name: `${s.name} (Copy)`,
      createdAt: "Feb 27, 2026", updatedAt: "Feb 27, 2026", lastRefreshed: "Feb 27, 2026", creator: "You",
    };
    setSearches(ss => [dup, ...ss]);
    show("Search duplicated!", "success");
  };

  const handleBulkPause = () => {
    setSearches(ss => ss.map(s => selected.includes(s.id) ? { ...s, active: false } : s));
    show(`${selected.length} search${selected.length !== 1 ? "es" : ""} paused`, "success");
    setSelected([]);
  };

  const handleBulkActivate = () => {
    setSearches(ss => ss.map(s => selected.includes(s.id) ? { ...s, active: true } : s));
    show(`${selected.length} search${selected.length !== 1 ? "es" : ""} activated`, "success");
    setSelected([]);
  };

  const handleBulkDelete = () => {
    setSearches(ss => ss.filter(s => !selected.includes(s.id)));
    show(`${selected.length} search${selected.length !== 1 ? "es" : ""} deleted`, "success");
    setSelected([]);
  };

  // Detail view
  if (detailView) {
    const current = searches.find(s => s.id === detailView.id) ?? detailView;
    return (
      <Box p={{ base: "sm", sm: "xl" }}>
        <SearchDetail
          search={current}
          onBack={() => setDetailView(null)}
          onEdit={() => setEditTarget(current)}
          onDuplicate={() => handleDuplicate(current)}
          onToggleActive={() => handleToggleActive(current.id)}
          onToggleAutoRefresh={() => handleToggleAutoRefresh(current.id)}
          onDelete={() => { handleDelete(current.id); setDetailView(null); }}
          onRefresh={() => handleRefresh(current.id)}
        />
      </Box>
    );
  }

  return (
    <Box p={{ base: "sm", sm: "xl" }} pt={0}>
      {/* Sticky header zone */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 sm:pt-6 -mx-3 sm:-mx-6 px-3 sm:px-6 pb-3">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap" style={{ marginBottom: 16 }}>
        <div className="flex items-center gap-3">
          <div>
            <Title order={1} fz={{ base: 22, sm: 26 }}>Saved Searches</Title>
            <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
              <Text fz={13} c={TV.textSecondary}>
                {searches.filter(s => s.active).length} active · {searches.filter(s => !s.active).length} paused
              </Text>
              <Tooltip label="Saved searches auto-update as constituent data changes" withArrow>
                <div className="flex items-center gap-1" style={{ cursor: "help" }}>
                  <RefreshCw size={12} style={{ color: TV.success }} />
                  <Text fz={11} c={TV.success} fw={600}>Auto-updating</Text>
                </div>
              </Tooltip>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip label="Create Saved Search" withArrow>
            <ActionIcon variant="filled" color="tvPurple" size="lg" radius="xl" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Export All Results" withArrow>
            <ActionIcon variant="default" size="lg" radius="xl" onClick={() => show("All search results exported!", "success")}
              styles={{ root: { borderColor: TV.borderLight } }}>
              <Download size={16} style={{ color: TV.textLabel }} />
            </ActionIcon>
          </Tooltip>
          <ColumnsButton onClick={() => setShowEditColumns(true)} />
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <TextInput
          leftSection={<Search size={14} style={{ color: TV.textSecondary }} />}
          placeholder="Search saved searches…"
          value={search} onChange={e => { setSearch(e.currentTarget.value); setPage(1); }}
          radius="xl" style={{ flex: 1, maxWidth: 420 }}
          styles={{ input: { borderColor: TV.borderLight, backgroundColor: '#fff', color: TV.textPrimary } }}
        />
      </div>

      {/* Filter Bar */}
      <div className="mb-0">
        <FilterBar
          filters={SEARCH_FILTERS}
          activeFilterKeys={activeFilterKeys}
          filterValues={filterValues}
          onFilterValuesChange={v => { setFilterValues(v); setPage(1); }}
          onActiveFilterKeysChange={setActiveFilterKeys}
        />
      </div>
      </div>{/* end sticky header zone */}

      {/* Bulk action bar */}
      {selected.length > 0 && (
        <Box px="sm" py="xs" bg={TV.brandTint} mb="md" style={{ borderRadius: 10, border: `1px solid ${TV.borderStrong}` }}>
          <div className="flex items-center gap-2 flex-wrap">
            <Text fz={13} fw={600} c={TV.textBrand}>{selected.length} selected</Text>

            <Button size="compact-xs" variant="default" leftSection={<Play size={11} />}
              onClick={handleBulkActivate}>
              Activate
            </Button>

            <Button size="compact-xs" variant="default" leftSection={<Pause size={11} />}
              onClick={handleBulkPause}>
              Pause
            </Button>

            <Button size="compact-xs" variant="default" leftSection={<Download size={11} />}
              onClick={() => { show(`Exported results from ${selected.length} searches`, "success"); }}>
              Export Results
            </Button>

            <Button size="compact-xs" variant="outline" color="red" leftSection={<Trash2 size={11} />}
              onClick={handleBulkDelete}>
              Delete
            </Button>

            <ActionIcon variant="subtle" color="gray" size="xs" ml="auto" onClick={() => setSelected([])} aria-label="Clear selection"><X size={13} aria-hidden="true" /></ActionIcon>
          </div>
        </Box>
      )}

      {/* Main content: table + recently used sidebar */}
      <div className="flex gap-5 flex-nowrap items-stretch">
        {/* Table */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <div className="rounded-lg border" style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
            {filtered.length === 0 ? (
              <Stack align="center" py="xl" gap="sm">
                <Box w={48} h={48} bg={TV.brandTint}
                  style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Filter size={20} style={{ color: TV.textBrand }} />
                </Box>
                <Text fz={15} fw={700} c={TV.textPrimary}>
                  {search ? "No searches match your query" : "No saved searches yet"}
                </Text>
                <Text fz={13} c={TV.textSecondary}>
                  {search ? "Try a different search term or adjust filters." : "Create a saved search to automatically track constituents matching specific criteria."}
                </Text>
                {!search && <Button color="tvPurple" onClick={() => setShowCreate(true)}>Create Search</Button>}
              </Stack>
            ) : (
              <>
                {/* Desktop table */}
                <Box visibleFrom="md" className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                  <Table verticalSpacing={0} horizontalSpacing={0} highlightOnHover
                    styles={{ table: { borderCollapse: "collapse", minWidth: Math.max(1000, activeColumns.length * 170 + 100) }, td: { whiteSpace: "nowrap" } }}>
                    <Table.Thead className="sticky top-0 z-20" style={{ backgroundColor: TV.surfaceMuted }}>
                      <Table.Tr style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
                        <Table.Th w={44} style={{ padding: "10px 0 10px 16px", verticalAlign: "middle" }}>
                          <Checkbox
                            checked={allOnPageSelected}
                            indeterminate={selected.length > 0 && !allOnPageSelected}
                            onChange={toggleAll} color="tvPurple" size="xs"
                            aria-label={allOnPageSelected ? "Deselect all" : "Select all"}
                          />
                        </Table.Th>
                        {activeColumns.map(colKey => {
                          const colDef = ALL_COLUMNS.find(c => c.key === colKey);
                          if (!colDef) return null;
                          return (
                            <Table.Th key={colKey} style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                              <SortableHeader label={colDef.label} sortKey={colKey}
                                currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                            </Table.Th>
                          );
                        })}
                        <Table.Th w={60} style={{ padding: "10px 16px", verticalAlign: "middle" }} />
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {paginatedSearches.map(s => (
                        <Table.Tr key={s.id} onClick={() => setDetailView(s)}
                          style={{ cursor: "pointer", borderBottom: `1px solid ${TV.borderDivider}` }}>
                          <Table.Td style={{ padding: "12px 0 12px 16px", verticalAlign: "middle" }}
                            onClick={e => { e.stopPropagation(); toggleSelect(s.id); }}>
                            <Checkbox checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} color="tvPurple" size="xs" />
                          </Table.Td>
                          {activeColumns.map(colKey => (
                            <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle", ...(colKey === "criteria" ? { maxWidth: 320 } : {}) }}>
                              <SearchCellValue col={colKey} search={s} />
                            </Table.Td>
                          ))}
                          <Table.Td style={{ padding: "12px 16px", verticalAlign: "middle" }} onClick={e => e.stopPropagation()}>
                            <Menu shadow="md" width={200} position="bottom-end">
                              <Menu.Target>
                                <ActionIcon variant="subtle" color="gray" size="sm" aria-label="Search actions">
                                  <MoreHorizontal size={15} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item fz={13} leftSection={<Eye size={14} />} onClick={() => setDetailView(s)}>
                                  View Results
                                </Menu.Item>
                                <Menu.Item fz={13} leftSection={<Edit2 size={14} />} onClick={() => setEditTarget(s)}>
                                  Edit Criteria
                                </Menu.Item>
                                <Menu.Item fz={13} leftSection={<Copy size={14} />} onClick={() => handleDuplicate(s)}>
                                  Duplicate
                                </Menu.Item>
                                <Menu.Item fz={13}
                                  leftSection={s.active ? <Pause size={14} /> : <Play size={14} />}
                                  onClick={() => handleToggleActive(s.id)}>
                                  {s.active ? "Pause" : "Activate"}
                                </Menu.Item>
                                <Menu.Item fz={13} leftSection={<Download size={14} />}
                                  onClick={() => show(`Exported ${s.matchCount} results from "${s.name}"`, "success")}>
                                  Export Results
                                </Menu.Item>
                                <Menu.Divider />
                                <Menu.Item fz={13} color="red" leftSection={<Trash2 size={14} />} onClick={() => setDeleteTarget(s)}>
                                  Delete
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>

                  <TablePagination page={page} rowsPerPage={rowsPerPage} totalRows={filtered.length}
                    onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />
                </Box>

                {/* Mobile cards */}
                <Box hiddenFrom="md">
                  {paginatedSearches.map(s => (
                    <Box key={s.id} px="sm" py="sm"
                      style={{ borderBottom: `1px solid ${TV.borderDivider}`, cursor: "pointer" }}
                      className="hover:bg-tv-surface-muted transition-colors">
                      <div className="flex items-center gap-3 flex-nowrap">
                        <Checkbox checked={selected.includes(s.id)}
                          onChange={() => toggleSelect(s.id)} color="tvPurple" size="xs"
                          onClick={e => e.stopPropagation()} />
                        <Box onClick={() => setDetailView(s)} style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center gap-3 flex-nowrap">
                            <Box w={40} h={40} bg={s.active ? TV.brandTint : TV.surface}
                              style={{ borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Filter size={17} style={{ color: s.active ? TV.textBrand : TV.textLabel }} />
                            </Box>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="flex items-center gap-1.5">
                                <Text fz={14} fw={600} c={TV.textBrand} truncate>{s.name}</Text>
                                <Badge size="xs" variant="light" color={s.active ? "green" : "gray"}>
                                  {s.active ? "Active" : "Paused"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                                <Text fz={12} c={TV.textSecondary}>{s.matchCount} matches</Text>
                                <Text fz={12} c={TV.textSecondary}>· {s.criteria.length} criteria</Text>
                                {s.autoRefresh && <RefreshCw size={10} style={{ color: TV.success }} />}
                              </div>
                            </div>
                            <ChevronRight size={14} style={{ color: TV.borderStrong, flexShrink: 0 }} />
                          </div>
                        </Box>
                      </div>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </div>
        </Box>

      </div>

      {/* ── Modals ── */}
      {showCreate && <SearchFormModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {editTarget && <SearchFormModal search={editTarget} onClose={() => setEditTarget(null)} onSave={handleEdit} />}
      {showEditColumns && (
        <EditColumnsModal columns={ALL_COLUMNS} active={activeColumns} onClose={() => setShowEditColumns(false)}
          onSave={cols => { setActiveColumns(cols); show("Columns updated!", "success"); }} />
      )}
      {deleteTarget && (
        <DeleteModal
          title={`Delete "${deleteTarget.name}"?`}
          description="This saved search will be permanently removed. No constituents will be deleted."
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Box>
  );
}
