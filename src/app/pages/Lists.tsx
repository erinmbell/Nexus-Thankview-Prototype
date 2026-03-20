import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, Download, Trash2, Archive, ArchiveRestore, Edit2,
  ChevronRight, List, UserPlus,
  Share2, X, Lock, MoreHorizontal,
  Clock, Upload,
  Tag, UserCheck, Hash, Calendar,
} from "lucide-react";
import {
  Box, Stack, Text, Title, Button, TextInput,
  ActionIcon, Modal, Badge, Avatar, Menu, Table, Checkbox,
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

interface ListContact {
  id: number; first: string; last: string; email: string;
  avatar: string; color: string;
}

interface ContactList {
  id: number;
  name: string;
  description: string;
  contacts: ListContact[];
  createdAt: string;
  updatedAt: string;
  creator: string;
  archived: boolean;
  sharedWith: string[];
  tags: string[];
}

// ── Column definitions ────────────────────────────────────────────────────────

const ALL_COLUMNS: ColumnDef[] = [
  { key: "listName",   label: "List",          group: "Summary", required: true },
  { key: "contacts",   label: "Constituents",      group: "Summary" },
  { key: "creator",    label: "Creator",        group: "Summary" },
  { key: "updatedAt",  label: "Last Updated",   group: "Summary" },
  { key: "createdAt",  label: "Created",        group: "Summary" },
  { key: "shared",     label: "Shared With",    group: "Summary" },
  { key: "tags",       label: "Tags",           group: "Organization" },
  { key: "description", label: "Description",   group: "Summary" },
  { key: "archived",   label: "Archived",       group: "Organization" },
  { key: "folder",     label: "Folder",         group: "Organization" },
];

const DEFAULT_ACTIVE_COLUMNS = ["listName", "contacts", "creator", "updatedAt", "shared"];

// ── Detail member column definitions ──────────────────────────────────────────

const MEMBER_COLUMNS: ColumnDef[] = [
  { key: "name",  label: "Name",  group: "Summary", required: true },
  { key: "email", label: "Email", group: "Summary" },
];

const DEFAULT_MEMBER_COLUMNS = ["name", "email"];

// ── List-specific filter definitions ─────────────────────────────────────────

const LIST_FILTERS: FilterDef[] = [
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
    key: "shared", label: "Shared", icon: Share2, type: "select", essential: true,
    options: [
      { value: "shared", label: "Shared with me" },
      { value: "not-shared", label: "Not shared" },
      { value: "shared-by-me", label: "Shared by me" },
    ],
  },
  {
    key: "status", label: "Status", icon: Archive, type: "select", essential: true,
    options: [
      { value: "active", label: "Active", color: "green" },
      { value: "archived", label: "Archived", color: "gray" },
    ],
  },
  {
    key: "tags", label: "Tags", icon: Tag, type: "multi-select",
    options: [
      { value: "Annual Fund", label: "Annual Fund" },
      { value: "Events", label: "Events" },
      { value: "Major Gifts", label: "Major Gifts" },
      { value: "Alumni", label: "Alumni" },
      { value: "Board", label: "Board" },
      { value: "Phonathon", label: "Phonathon" },
    ],
  },
  {
    key: "contactCount", label: "Constituent Count", icon: Hash, type: "select",
    options: [
      { value: "0", label: "Empty (0 constituents)" },
      { value: "1-10", label: "1 – 10 constituents" },
      { value: "11-50", label: "11 – 50 constituents" },
      { value: "50+", label: "50+ constituents" },
    ],
  },
  {
    key: "lastUpdated", label: "Last Updated", icon: Calendar, type: "select",
    options: [
      { value: "7d", label: "Last 7 days" },
      { value: "30d", label: "Last 30 days" },
      { value: "90d", label: "Last 90 days" },
      { value: "older", label: "More than 90 days ago" },
    ],
  },
  DATE_CREATED_FILTER,
];

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_USERS = ["Kelley Molt", "James Okafor", "Michelle Park", "You"];

const ALL_CONTACTS: ListContact[] = [
  { id: 1, first: "James",  last: "Whitfield", email: "j.whitfield@alumni.edu", avatar: "JW", color: "#7c45b0" },
  { id: 2, first: "Sarah",  last: "Chen",      email: "s.chen@foundation.org",  avatar: "SC", color: "#0e7490" },
  { id: 3, first: "Marcus", last: "Reid",       email: "m.reid@email.com",       avatar: "MR", color: "#15803d" },
  { id: 4, first: "Emily",  last: "Torres",     email: "e.torres@corp.com",      avatar: "ET", color: "#b45309" },
  { id: 5, first: "David",  last: "Park",       email: "d.park@alumni.edu",      avatar: "DP", color: "#dc2626" },
  { id: 6, first: "Aisha",  last: "Johnson",    email: "a.johnson@gmail.com",    avatar: "AJ", color: "#8b5cf6" },
  { id: 7, first: "Robert", last: "Kim",        email: "r.kim@hartwell.edu",     avatar: "RK", color: "#0891b2" },
  { id: 8, first: "Linda",  last: "Osei",       email: "l.osei@alumni.edu",      avatar: "LO", color: "#c026d3" },
];

const INIT_LISTS: ContactList[] = [
  {
    id: 1, name: "Spring Gala Invitees", description: "VIP invite list for the 2026 spring gala event",
    contacts: ALL_CONTACTS.slice(0, 5),
    createdAt: "Jan 8, 2026", updatedAt: "Feb 20, 2026", creator: "Kelley Molt",
    archived: false, sharedWith: ["James Okafor"],
    tags: ["Events", "Major Gifts"],
  },
  {
    id: 2, name: "Major Donors – Q1 Outreach", description: "High-value donors for personal thank-you campaign",
    contacts: [ALL_CONTACTS[0], ALL_CONTACTS[1], ALL_CONTACTS[7]],
    createdAt: "Feb 1, 2026", updatedAt: "Feb 18, 2026", creator: "You",
    archived: false, sharedWith: [],
    tags: ["Major Gifts"],
  },
  {
    id: 3, name: "Alumni Phonathon 2025", description: "Alumni targets for fall phonathon",
    contacts: [ALL_CONTACTS[0], ALL_CONTACTS[2], ALL_CONTACTS[4], ALL_CONTACTS[7]],
    createdAt: "Sep 15, 2025", updatedAt: "Nov 3, 2025", creator: "Michelle Park",
    archived: false, sharedWith: ["You", "James Okafor"],
    tags: ["Phonathon", "Alumni"],
  },
  {
    id: 4, name: "Board Welcome Package", description: "New board members for welcome video",
    contacts: [ALL_CONTACTS[3]],
    createdAt: "Dec 2, 2024", updatedAt: "Dec 2, 2024", creator: "James Okafor",
    archived: true, sharedWith: [],
    tags: ["Board"],
  },
  {
    id: 5, name: "Lapsed Donors Re-engagement", description: "Donors who haven't given in 18+ months",
    contacts: [ALL_CONTACTS[4], ALL_CONTACTS[6]],
    createdAt: "Mar 10, 2025", updatedAt: "Feb 12, 2026", creator: "You",
    archived: false, sharedWith: ["Kelley Molt", "Michelle Park"],
    tags: ["Major Gifts"],
  },
  {
    id: 6, name: "Student Ambassadors 2024", description: "",
    contacts: ALL_CONTACTS.slice(2, 7),
    createdAt: "Aug 1, 2024", updatedAt: "Aug 1, 2024", creator: "Michelle Park",
    archived: true, sharedWith: [],
    tags: ["Alumni"],
  },
  {
    id: 7, name: "Annual Fund Thank You", description: "Donors to thank for annual fund participation",
    contacts: ALL_CONTACTS.slice(0, 6),
    createdAt: "Jan 20, 2026", updatedAt: "Feb 25, 2026", creator: "You",
    archived: false, sharedWith: ["James Okafor"],
    tags: ["Annual Fund"],
  },
  {
    id: 8, name: "Homecoming Weekend VIPs", description: "Reunion attendees for special outreach",
    contacts: [ALL_CONTACTS[0], ALL_CONTACTS[3], ALL_CONTACTS[5]],
    createdAt: "Oct 5, 2025", updatedAt: "Feb 27, 2026", creator: "Kelley Molt",
    archived: false, sharedWith: ["You", "Michelle Park"],
    tags: ["Events", "Alumni"],
  },
];

// Recently-used list IDs (simulated by last updatedAt)
const RECENTLY_USED_IDS = [8, 7, 1, 2];

// ── Sort helpers ──────────────────────────────────────────────────────────────

function getListSortValue(l: ContactList, key: string): string {
  switch (key) {
    case "listName":  return l.name;
    case "contacts":  return String(l.contacts.length).padStart(6, "0");
    case "creator":   return l.creator;
    case "updatedAt": return l.updatedAt;
    case "createdAt": return l.createdAt;
    case "shared":    return String(l.sharedWith.length).padStart(4, "0");
    case "tags":      return l.tags.join(", ");
    default:          return "";
  }
}

// SortableHeader imported from ../components/SortableHeader

// ── Create / Edit List Modal ──────────────────────────────────────────────────

function ListFormModal({ list, onClose, onSave }: {
  list?: ContactList | null;
  onClose: () => void;
  onSave: (data: { name: string; description: string }) => void;
}) {
  const [name, setName] = useState(list?.name ?? "");
  const [desc, setDesc] = useState(list?.description ?? "");

  return (
    <Modal opened onClose={onClose} title={list ? "Rename List" : "Create New List"} size="md">
      <Stack gap="sm">
        <TextInput label="List Name" placeholder="e.g. Spring Gala Invitees" value={name}
          onChange={e => setName(e.currentTarget.value)} data-autofocus />
        <TextInput label="Description" placeholder="Optional description…" value={desc}
          onChange={e => setDesc(e.currentTarget.value)} />
      </Stack>
      <div className="flex items-center justify-end gap-3 mt-5">
        <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
        <Button color="tvPurple" onClick={() => onSave({ name, description: desc })} disabled={!name.trim()}>
          {list ? "Save Changes" : "Create List"}
        </Button>
      </div>
    </Modal>
  );
}

// ── Share Modal ───────────────────────────────────────────────────────────────

function ShareModal({ list, onClose, onShare }: {
  list: ContactList;
  onClose: () => void;
  onShare: (users: string[]) => void;
}) {
  const availableUsers = MOCK_USERS.filter(u => u !== list.creator && u !== "You");
  const [shared, setShared] = useState<string[]>(list.sharedWith.filter(u => u !== "You"));

  const toggle = (user: string) =>
    setShared(s => s.includes(user) ? s.filter(u => u !== user) : [...s, user]);

  return (
    <Modal opened onClose={onClose} title={`Share "${list.name}"`} size="sm">
      <Text fz={13} c={TV.textSecondary} mb="md">
        Shared users can view, add/remove constituents, and export — but cannot rename, archive, or delete this list.
      </Text>
      <Stack gap="xs" mb="lg">
        {availableUsers.map(user => (
          <Box key={user} px="sm" py="xs" bg={shared.includes(user) ? TV.brandTint : undefined}
            style={{ borderRadius: 10, border: `1px solid ${shared.includes(user) ? TV.borderStrong : TV.borderLight}`, cursor: "pointer" }}
            onClick={() => toggle(user)}>
            <div className="flex items-center gap-3">
              <Checkbox checked={shared.includes(user)} onChange={() => toggle(user)} color="tvPurple" size="xs" />
              <Avatar size="sm" radius="xl" color="tvPurple">{user[0]}</Avatar>
              <Text fz={13} fw={600} c={TV.textPrimary}>{user}</Text>
            </div>
          </Box>
        ))}
      </Stack>
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
        <Button color="tvPurple" leftSection={<Share2 size={14} />} onClick={() => { onShare(shared); onClose(); }}>
          Update Sharing
        </Button>
      </div>
    </Modal>
  );
}

// ── Manage Contacts Modal ─────────────────────────────────────────────────────

function ManageContactsModal({ list, onClose, onSave }: {
  list: ContactList;
  onClose: () => void;
  onSave: (contacts: ListContact[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>(list.contacts.map(c => c.id));

  const filtered = ALL_CONTACTS.filter(c =>
    `${c.first} ${c.last} ${c.email}`.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: number) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const allFilteredSelected = filtered.length > 0 && filtered.every(c => selected.includes(c.id));
  const someFilteredSelected = filtered.some(c => selected.includes(c.id));
  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      setSelected(s => s.filter(id => !filtered.some(c => c.id === id)));
    } else {
      setSelected(s => [...new Set([...s, ...filtered.map(c => c.id)])]);
    }
  };

  return (
    <Modal opened onClose={onClose} title={`Manage Constituents — ${list.name}`} size="lg">
      <TextInput leftSection={<Search size={14} style={{ color: TV.textSecondary }} />}
        placeholder="Search constituents…" value={search} onChange={e => setSearch(e.currentTarget.value)}
        radius="xl" mb="md" styles={{ input: { borderColor: TV.borderLight, backgroundColor: '#fff', color: TV.textPrimary } }} />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={allFilteredSelected}
            indeterminate={someFilteredSelected && !allFilteredSelected}
            onChange={toggleAllFiltered}
            color="tvPurple"
            size="xs"
            aria-label={allFilteredSelected ? "Deselect all" : "Select all"}
          />
          <Text fz={12} fw={600} c={TV.textSecondary}>
            {allFilteredSelected ? "Deselect All" : "Select All"}
            {search && ` (${filtered.length} result${filtered.length !== 1 ? "s" : ""})`}
          </Text>
        </div>
        <Text fz={12} c={TV.textSecondary}>{selected.length} constituent{selected.length !== 1 ? "s" : ""} selected</Text>
      </div>

      <Box style={{ maxHeight: 360, overflowY: "auto", border: `1px solid ${TV.borderLight}`, borderRadius: 12 }}>
        {filtered.map(c => {
          const isIn = selected.includes(c.id);
          return (
            <Box key={c.id} px="sm" py="xs" onClick={() => toggle(c.id)}
              style={{ cursor: "pointer", borderBottom: `1px solid ${TV.borderDivider}` }}
              bg={isIn ? TV.brandTint : undefined}
              className="hover:bg-tv-surface-muted transition-colors">
              <div className="flex items-center gap-3">
                <Checkbox checked={isIn} onChange={() => toggle(c.id)} color="tvPurple" size="xs" />
                <Avatar size="sm" radius="xl"
                  styles={{ placeholder: { backgroundColor: c.color, color: "white" } }}>{c.avatar}</Avatar>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text fz={13} fw={600} c={TV.textPrimary} truncate>{c.first} {c.last}</Text>
                  <Text fz={11} c={TV.textSecondary} truncate>{c.email}</Text>
                </div>
                {isIn ? (
                  <Badge size="xs" color="tvPurple" variant="light">In list</Badge>
                ) : (
                  <Badge size="xs" color="gray" variant="light">Not in list</Badge>
                )}
              </div>
            </Box>
          );
        })}
      </Box>

      <div className="flex items-center justify-end gap-3 mt-5">
        <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
        <Button color="tvPurple" onClick={() => {
          onSave(ALL_CONTACTS.filter(c => selected.includes(c.id)));
          onClose();
        }}>Save Changes</Button>
      </div>
    </Modal>
  );
}

// ── Cell renderer ─────────────────────────────────────────────────────────────

function ListCellValue({ col, list }: { col: string; list: ContactList }) {
  switch (col) {
    case "listName":
      return (
        <div className="flex items-center gap-2 flex-nowrap">
          <Box w={34} h={34} bg={list.archived ? TV.surface : TV.brandTint}
            style={{ borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <List size={15} style={{ color: list.archived ? TV.textLabel : TV.textBrand }} />
          </Box>
          <div style={{ minWidth: 0 }}>
            <div className="flex items-center gap-1.5 flex-nowrap">
              <Text fz={13} fw={600} c={TV.textBrand} truncate className="hover:underline">{list.name}</Text>
              {list.archived && <Badge size="xs" color="gray" variant="light">Archived</Badge>}
            </div>
            {list.description && <Text fz={11} c={TV.textSecondary} truncate>{list.description}</Text>}
          </div>
        </div>
      );
    case "contacts":
      return <Badge variant="light" color="tvPurple" size="sm">{list.contacts.length}</Badge>;
    case "creator":
      return (
        <div className="flex items-center gap-1.5 flex-nowrap">
          <Avatar size="xs" radius="xl" color="tvPurple">{list.creator[0]}</Avatar>
          <Text fz={12} c={TV.textSecondary}>{list.creator}</Text>
          {list.creator === "You" && <Badge size="xs" color="tvPurple" variant="filled" radius="xl">You</Badge>}
        </div>
      );
    case "updatedAt":
      return <Text fz={12} c={TV.textSecondary}>{list.updatedAt}</Text>;
    case "createdAt":
      return <Text fz={12} c={TV.textSecondary}>{list.createdAt}</Text>;
    case "shared":
      return list.sharedWith.length > 0 ? (
        <Tooltip label={`Shared with ${list.sharedWith.join(", ")}`} withArrow>
          <div className="flex items-center gap-1">
            <Share2 size={12} style={{ color: TV.textBrand }} />
            <Text fz={12} c={TV.textBrand}>{list.sharedWith.length}</Text>
          </div>
        </Tooltip>
      ) : (
        <Text fz={12} c={TV.textSecondary}>—</Text>
      );
    case "tags":
      return (
        <div className="flex items-center gap-1">
          {list.tags.slice(0, 2).map(t => <Badge key={t} color="tvPurple" size="xs" radius="xl">{t}</Badge>)}
          {list.tags.length > 2 && <Text fz={10} c={TV.textSecondary}>+{list.tags.length - 2}</Text>}
        </div>
      );
    default:
      return <Text fz={12} c={TV.textSecondary}>—</Text>;
  }
}

// ── Pagination ───────────────────────────────────────────────────────────────




// ── Recently Used Sidebar ─────────────────────────────────────────────────────

function RecentlyUsedSidebar({ lists, onSelect }: { lists: ContactList[]; onSelect: (l: ContactList) => void }) {
  if (lists.length === 0) return null;
  return (
    <div className="rounded-lg border p-4" style={{ borderColor: TV.borderLight, minWidth: 220, maxWidth: 260, flexShrink: 0, alignSelf: "flex-start", position: "sticky", top: 24 }}>
      <div className="flex items-center gap-3 mb-4">
        <Clock size={14} style={{ color: TV.textBrand }} />
        <Text fz={12} fw={700} c={TV.textPrimary}>Recently Used</Text>
      </div>
      <Stack gap={0}>
        {lists.map(l => (
          <UnstyledButton key={l.id} onClick={() => onSelect(l)}
            py="xs" px="sm"
            style={{ borderRadius: 10, transition: "all 0.15s" }}
            className="hover:bg-tv-surface">
            <div className="flex items-center gap-3 flex-nowrap">
              <Box w={28} h={28} bg={l.archived ? TV.surface : TV.brandTint}
                style={{ borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <List size={12} style={{ color: l.archived ? TV.textLabel : TV.textBrand }} />
              </Box>
              <div style={{ minWidth: 0, flex: 1 }}>
                <Text fz={12} fw={600} c={TV.textPrimary} truncate>{l.name}</Text>
                <Text fz={10} c={TV.textSecondary}>{l.contacts.length} constituents · {l.updatedAt}</Text>
              </div>
            </div>
          </UnstyledButton>
        ))}
      </Stack>
    </div>
  );
}

// ── List Detail Panel ─────────────────────────────────────────────────────────

function ListDetail({ list, onBack, onManage, isOwner }: {
  list: ContactList; onBack: () => void; onManage: () => void; isOwner: boolean;
}) {
  const navigate = useNavigate();
  const { show } = useToast();
  const [detailSort, setDetailSort] = useState<{ col: string; dir: SortDir }>({ col: "name", dir: "asc" });
  const [detailPage, setDetailPage] = useState(1);
  const [detailRowsPerPage, setDetailRowsPerPage] = useState(10);
  const [detailSelected, setDetailSelected] = useState<number[]>([]);
  const [memberActiveCols, setMemberActiveCols] = useState<string[]>(DEFAULT_MEMBER_COLUMNS);
  const [showMemberEditCols, setShowMemberEditCols] = useState(false);
  const toggleDetailSort = (col: string) => {
    setDetailSort(prev => prev.col === col ? { col, dir: prev.dir === "asc" ? "desc" : "asc" } : { col, dir: "asc" });
  };
  const toggleDetailSelect = (id: number) => setDetailSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const sortedContacts = useMemo(() => {
    const rows = [...list.contacts];
    const { col, dir } = detailSort;
    if (!col || !dir) return rows;
    return rows.sort((a, b) => {
      let av: string, bv: string;
      if (col === "name") { av = `${a.first} ${a.last}`.toLowerCase(); bv = `${b.first} ${b.last}`.toLowerCase(); }
      else { av = (a.email ?? "").toLowerCase(); bv = (b.email ?? "").toLowerCase(); }
      const cmp = av.localeCompare(bv);
      return dir === "asc" ? cmp : -cmp;
    });
  }, [list.contacts, detailSort]);
  const clampedDetailPage = Math.max(1, Math.min(detailPage, Math.ceil(sortedContacts.length / detailRowsPerPage) || 1));
  const detailStart = (clampedDetailPage - 1) * detailRowsPerPage;
  const paginatedContacts = sortedContacts.slice(detailStart, detailStart + detailRowsPerPage);
  const allOnDetailPageSelected = paginatedContacts.length > 0 && paginatedContacts.every(c => detailSelected.includes(c.id));
  const toggleDetailAll = () => {
    if (allOnDetailPageSelected) setDetailSelected(s => s.filter(id => !paginatedContacts.some(c => c.id === id)));
    else setDetailSelected(s => [...new Set([...s, ...paginatedContacts.map(c => c.id)])]);
  };

  return (
    <Box>
      <div className="flex items-center gap-3 mb-5">
        <Breadcrumbs items={[
          { label: "Lists", onClick: onBack },
          { label: list.name },
        ]} />
        {list.archived && <Badge size="xs" color="gray">Archived</Badge>}
      </div>

      <div className="flex items-center justify-between flex-wrap mb-4">
        <div>
          <Title order={3} fz={20} c={TV.textPrimary}>{list.name}</Title>
          {list.description && <Text fz={13} c={TV.textSecondary} mt={4}>{list.description}</Text>}
          <div className="flex items-center gap-4 mt-2">
            <Text fz={12} c={TV.textLabel}>{list.contacts.length} constituent{list.contacts.length !== 1 ? "s" : ""}</Text>
            <Text fz={12} c={TV.textLabel}>Created by {list.creator}</Text>
            <Text fz={12} c={TV.textLabel}>Updated {list.updatedAt}</Text>
            {list.sharedWith.length > 0 && (
              <div className="flex items-center gap-1">
                <Share2 size={11} style={{ color: TV.textLabel }} />
                <Text fz={12} c={TV.textLabel}>Shared with {list.sharedWith.length}</Text>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ColumnsButton onClick={() => setShowMemberEditCols(true)} />
          <Button color="tvPurple" leftSection={<UserPlus size={14} />} onClick={onManage}>
            Manage Constituents
          </Button>
        </div>
      </div>

      <div className="rounded-lg border" style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
        {list.contacts.length === 0 ? (
          <div className="flex flex-col items-center py-12 px-6">
            <Box w={64} h={64} bg={TV.brandTint} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} mb={16}>
              <List size={28} style={{ color: TV.textBrand }} />
            </Box>
            <Text fz={18} fw={700} c={TV.textPrimary} mb={4}>This list is empty</Text>
            <Text fz={14} c={TV.textSecondary} ta="center" maw={380} mb={20}>
              Add constituents to start using this list in campaigns, exports, and segmentation.
            </Text>
            <Button color="tvPurple" size="md" leftSection={<UserPlus size={16} />} onClick={onManage} mb={24}>
              Add Constituents
            </Button>
            <div className="w-full max-w-[420px] rounded-xl p-4" style={{ backgroundColor: TV.brandTint }}>
              <Text fz={12} fw={600} c={TV.textBrand} mb={8}>Ways to add constituents</Text>
              <div className="flex flex-col gap-2">
                {[
                  { icon: <UserPlus size={14} style={{ color: TV.textBrand, flexShrink: 0 }} />, text: "Search and add individual constituents from your database" },
                  { icon: <Upload size={14} style={{ color: TV.textBrand, flexShrink: 0 }} />, text: "Import a CSV or spreadsheet to bulk-add constituents" },
                  { icon: <List size={14} style={{ color: TV.textBrand, flexShrink: 0 }} />, text: "Copy constituents from another existing list" },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="mt-0.5">{item.icon}</div>
                    <Text fz={12} c={TV.textSecondary} lh={1.5}>{item.text}</Text>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
          {detailSelected.length > 0 && (
            <Box px="md" py="xs" bg={TV.brandTint} style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
              <div className="flex items-center justify-between">
                <Text fz={12} fw={600} c={TV.textBrand}>{detailSelected.length} constituent{detailSelected.length !== 1 ? "s" : ""} selected</Text>
                <div className="flex items-center gap-2">
                  <Button size="xs" variant="light" color="red" leftSection={<Trash2 size={12} />}
                    onClick={() => { show(`${detailSelected.length} constituent${detailSelected.length !== 1 ? "s" : ""} removed from list`, "success"); setDetailSelected([]); }}>
                    Remove from List
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
                {memberActiveCols.map(colKey => {
                  const colDef = MEMBER_COLUMNS.find(c => c.key === colKey);
                  if (!colDef) return null;
                  return (
                    <Table.Th key={colKey} style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <SortableHeader label={colDef.label} sortKey={colKey} currentSort={detailSort.col} currentDir={detailSort.dir} onSort={toggleDetailSort} />
                    </Table.Th>
                  );
                })}
                <Table.Th w={60} style={{ padding: "10px 16px", verticalAlign: "middle" }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedContacts.map(c => (
                <Table.Tr key={c.id} style={{ cursor: "pointer", borderBottom: `1px solid ${TV.borderDivider}` }} onClick={() => navigate(`/contacts/${c.id}`)}>
                  <Table.Td style={{ padding: "12px 0 12px 16px", verticalAlign: "middle" }}
                    onClick={e => { e.stopPropagation(); toggleDetailSelect(c.id); }}>
                    <Checkbox checked={detailSelected.includes(c.id)} onChange={() => toggleDetailSelect(c.id)} color="tvPurple" size="xs" />
                  </Table.Td>
                  {memberActiveCols.map(colKey => (
                    <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      {colKey === "name" ? (
                        <div className="flex items-center gap-2 flex-nowrap">
                          <Avatar size="sm" radius="xl"
                            styles={{ placeholder: { backgroundColor: c.color, color: "white" } }}>{c.avatar}</Avatar>
                          <Text fz={13} fw={600} c={TV.textPrimary}>{c.first} {c.last}</Text>
                        </div>
                      ) : colKey === "email" ? (
                        <Text fz={12} c={TV.textSecondary}>{c.email}</Text>
                      ) : null}
                    </Table.Td>
                  ))}
                  <Table.Td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                    <Tooltip label="View profile" withArrow>
                      <ActionIcon variant="subtle" color="gray" size="sm" onClick={e => { e.stopPropagation(); navigate(`/contacts/${c.id}`); }}>
                        <ChevronRight size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <TablePagination
            page={clampedDetailPage}
            rowsPerPage={detailRowsPerPage}
            totalRows={sortedContacts.length}
            onPageChange={setDetailPage}
            onRowsPerPageChange={setDetailRowsPerPage}
          />
          </div>
          </>
        )}
      </div>

      {/* Edit Member Columns Modal */}
      {showMemberEditCols && (
        <EditColumnsModal columns={MEMBER_COLUMNS} active={memberActiveCols} onClose={() => setShowMemberEditCols(false)}
          onSave={cols => { setMemberActiveCols(cols); }} />
      )}
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function Lists() {
  const { show } = useToast();
  const [lists, setLists] = useState<ContactList[]>(INIT_LISTS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  // Column customization
  const [activeColumns, setActiveColumns] = useState<string[]>(DEFAULT_ACTIVE_COLUMNS);

  // Filters
  const DEFAULT_FILTER_KEYS = LIST_FILTERS.filter(f => f.essential).map(f => f.key);
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
  const [renameTarget, setRenameTarget] = useState<ContactList | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ContactList | null>(null);
  const [shareTarget, setShareTarget] = useState<ContactList | null>(null);
  const [manageTarget, setManageTarget] = useState<ContactList | null>(null);
  const [detailView, setDetailView] = useState<ContactList | null>(null);

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

  // Recently used
  const recentlyUsed = useMemo(() =>
    RECENTLY_USED_IDS.map(id => lists.find(l => l.id === id)).filter(Boolean) as ContactList[],
    [lists]
  );

  // Filtered & sorted
  const filtered = useMemo(() => {
    let result = lists.filter(l =>
      `${l.name} ${l.description} ${l.creator}`.toLowerCase().includes(search.toLowerCase())
    );

    // Apply filters
    for (const [key, vals] of Object.entries(filterValues)) {
      if (!vals || vals.length === 0) continue;
      switch (key) {
        case "creator":
          result = result.filter(l => vals.includes(l.creator));
          break;
        case "shared":
          result = result.filter(l => {
            if (vals.includes("shared")) return l.sharedWith.includes("You") || l.sharedWith.length > 0;
            if (vals.includes("not-shared")) return l.sharedWith.length === 0;
            if (vals.includes("shared-by-me")) return l.creator === "You" && l.sharedWith.length > 0;
            return true;
          });
          break;
        case "status":
          result = result.filter(l => {
            if (vals.includes("active")) return !l.archived;
            if (vals.includes("archived")) return l.archived;
            return true;
          });
          break;
        case "tags":
          result = result.filter(l => vals.some(v => l.tags.includes(v)));
          break;
        case "contactCount":
          result = result.filter(l => {
            const count = l.contacts.length;
            if (vals.includes("0")) return count === 0;
            if (vals.includes("1-10")) return count >= 1 && count <= 10;
            if (vals.includes("11-50")) return count >= 11 && count <= 50;
            if (vals.includes("50+")) return count > 50;
            return true;
          });
          break;
        case "dateCreated": {
          result = result.filter(l => {
            const d = new Date(l.createdAt);
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

    // Apply sort
    if (sortKey && sortDir) {
      result = [...result].sort((a, b) => {
        const aVal = getListSortValue(a, sortKey);
        const bVal = getListSortValue(b, sortKey);
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }

    return result;
  }, [lists, search, sortKey, sortDir, filterValues]);

  // Pagination
  const paginatedLists = filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  const isOwner = (l: ContactList) => l.creator === "You";

  // Select
  const allOnPageSelected = paginatedLists.length > 0 && paginatedLists.every(l => selected.includes(l.id));
  const toggleSelect = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () => {
    if (allOnPageSelected) setSelected(s => s.filter(id => !paginatedLists.some(l => l.id === id)));
    else setSelected(s => [...new Set([...s, ...paginatedLists.map(l => l.id)])]);
  };

  // Handlers
  const handleCreate = (data: { name: string; description: string }) => {
    const newList: ContactList = {
      id: Date.now(), name: data.name, description: data.description,
      contacts: [], createdAt: "Feb 27, 2026", updatedAt: "Feb 27, 2026",
      creator: "You", archived: false, sharedWith: [],
      tags: [],
    };
    setLists(ls => [newList, ...ls]);
    setShowCreate(false);
    show("List created!", "success");
  };

  const handleRename = (data: { name: string; description: string }) => {
    if (!renameTarget) return;
    setLists(ls => ls.map(l => l.id === renameTarget.id ? { ...l, name: data.name, description: data.description, updatedAt: "Feb 27, 2026" } : l));
    if (detailView?.id === renameTarget.id) setDetailView(prev => prev ? { ...prev, name: data.name, description: data.description } : null);
    setRenameTarget(null);
    show("List renamed!", "success");
  };

  const handleDelete = (id: number) => {
    setLists(ls => ls.filter(l => l.id !== id));
    setDeleteTarget(null);
    if (detailView?.id === id) setDetailView(null);
    setSelected(s => s.filter(x => x !== id));
    show("List deleted", "success");
  };

  const handleArchive = (id: number) => {
    setLists(ls => ls.map(l => l.id === id ? { ...l, archived: !l.archived, updatedAt: "Feb 27, 2026" } : l));
    const list = lists.find(l => l.id === id);
    if (detailView?.id === id) setDetailView(prev => prev ? { ...prev, archived: !prev.archived } : null);
    show(list?.archived ? "List restored" : "List archived", "success");
  };

  const handleShare = (id: number, users: string[]) => {
    setLists(ls => ls.map(l => l.id === id ? { ...l, sharedWith: users, updatedAt: "Feb 27, 2026" } : l));
    show("Sharing updated!", "success");
  };

  const handleManageContacts = (id: number, contacts: ListContact[]) => {
    setLists(ls => ls.map(l => l.id === id ? { ...l, contacts, updatedAt: "Feb 27, 2026" } : l));
    if (detailView?.id === id) setDetailView(prev => prev ? { ...prev, contacts } : null);
    show("Constituents updated!", "success");
  };

  const handleExport = (list: ContactList) => {
    show(`Exported "${list.name}" (${list.contacts.length} constituents)`, "success");
  };

  const handleBulkArchive = () => {
    setLists(ls => ls.map(l => selected.includes(l.id) ? { ...l, archived: true, updatedAt: "Feb 27, 2026" } : l));
    show(`${selected.length} list${selected.length !== 1 ? "s" : ""} archived`, "success");
    setSelected([]);
  };

  const handleBulkDelete = () => {
    setLists(ls => ls.filter(l => !selected.includes(l.id)));
    show(`${selected.length} list${selected.length !== 1 ? "s" : ""} deleted`, "success");
    setSelected([]);
  };

  // ── Detail view ──
  if (detailView) {
    const current = lists.find(l => l.id === detailView.id) ?? detailView;
    return (
      <Box p={{ base: "sm", sm: "xl" }}>
        <ListDetail
          list={current}
          onBack={() => setDetailView(null)}
          onManage={() => setManageTarget(current)}
          isOwner={isOwner(current)}
        />
        {manageTarget && (
          <ManageContactsModal
            list={manageTarget}
            onClose={() => setManageTarget(null)}
            onSave={contacts => handleManageContacts(manageTarget.id, contacts)}
          />
        )}
      </Box>
    );
  }

  // ── Main list view ──
  return (
    <Box p={{ base: "sm", sm: "xl" }} pt={0}>
      {/* Sticky header zone */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 sm:pt-6 -mx-3 sm:-mx-6 px-3 sm:px-6 pb-3">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap mb-4">
        <div className="flex items-center gap-3">
          <div>
            <Title order={1} fz={{ base: 22, sm: 26 }}>Lists</Title>
            <Text fz={13} c={TV.textSecondary}>
              {lists.filter(l => !l.archived).length} active list{lists.filter(l => !l.archived).length !== 1 ? "s" : ""}
              {lists.filter(l => l.archived).length > 0 && ` · ${lists.filter(l => l.archived).length} archived`}
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip label="Create List" withArrow>
            <ActionIcon variant="filled" color="tvPurple" size="lg" radius="xl" onClick={() => setShowCreate(true)}>
              <Plus size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Export All Lists" withArrow>
            <ActionIcon variant="default" size="lg" radius="xl" onClick={() => show("All lists exported!", "success")}
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
          placeholder="Search lists…"
          value={search} onChange={e => { setSearch(e.currentTarget.value); setPage(1); }}
          radius="xl" style={{ flex: 1, maxWidth: 420 }}
          styles={{ input: { borderColor: TV.borderLight, backgroundColor: '#fff', color: TV.textPrimary } }}
        />
      </div>

      {/* Filter Bar */}
      <div className="mb-0">
        <FilterBar
          filters={LIST_FILTERS}
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

            <Button size="compact-xs" variant="default" leftSection={<Archive size={11} />}
              onClick={handleBulkArchive}>
              Archive
            </Button>

            <Button size="compact-xs" variant="default" leftSection={<Download size={11} />}
              onClick={() => { show(`Exported ${selected.length} lists`, "success"); }}>
              Export
            </Button>

            <Button size="compact-xs" variant="outline" color="red" leftSection={<Trash2 size={11} />}
              onClick={handleBulkDelete}>
              Delete
            </Button>

            <ActionIcon variant="subtle" color="gray" size="xs" className="ml-auto" onClick={() => setSelected([])} aria-label="Clear selection"><X size={13} aria-hidden="true" /></ActionIcon>
          </div>
        </Box>
      )}

      {/* Main content: table */}
      <div>
        <Box>
        <div className="rounded-lg border" style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
        {filtered.length === 0 ? (
          <Stack align="center" py="xl" gap="sm">
            <Box w={48} h={48} bg={TV.brandTint}
              style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <List size={20} style={{ color: TV.textBrand }} />
            </Box>
            <Text fz={15} fw={700} c={TV.textPrimary}>
              {search ? "No lists match your search" : "No lists yet"}
            </Text>
            <Text fz={13} c={TV.textSecondary}>
              {search ? "Try a different search term or adjust filters." : "Create your first list to organize constituents for campaigns."}
            </Text>
            {!search && <Button color="tvPurple" onClick={() => setShowCreate(true)}>Create List</Button>}
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
                  {paginatedLists.map(list => (
                    <Table.Tr key={list.id} onClick={() => setDetailView(list)}
                      style={{ cursor: "pointer", borderBottom: `1px solid ${TV.borderDivider}` }}>
                      <Table.Td style={{ padding: "12px 0 12px 16px", verticalAlign: "middle" }}
                        onClick={e => { e.stopPropagation(); toggleSelect(list.id); }}>
                        <Checkbox checked={selected.includes(list.id)} onChange={() => toggleSelect(list.id)} color="tvPurple" size="xs" />
                      </Table.Td>
                      {activeColumns.map(colKey => (
                        <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <ListCellValue col={colKey} list={list} />
                        </Table.Td>
                      ))}
                      <Table.Td style={{ padding: "12px 16px", verticalAlign: "middle" }} onClick={e => e.stopPropagation()}>
                        <Menu shadow="md" width={200} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" size="sm" aria-label="List actions">
                              <MoreHorizontal size={15} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item fz={13} leftSection={<List size={14} />} onClick={() => setDetailView(list)}>
                              View List
                            </Menu.Item>
                            <Menu.Item fz={13} leftSection={<UserPlus size={14} />} onClick={() => setManageTarget(list)}>
                              Manage Constituents
                            </Menu.Item>
                            <Menu.Item fz={13} leftSection={<Download size={14} />} onClick={() => handleExport(list)}>
                              Export
                            </Menu.Item>
                            <Menu.Item fz={13} leftSection={<Share2 size={14} />}
                              onClick={() => setShareTarget(list)}
                              disabled={!isOwner(list)}
                              rightSection={!isOwner(list) ? <Lock size={11} style={{ color: TV.textSecondary }} /> : undefined}>
                              Share
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item fz={13} leftSection={<Edit2 size={14} />} onClick={() => setRenameTarget(list)}
                              disabled={!isOwner(list)}
                              rightSection={!isOwner(list) ? <Lock size={11} style={{ color: TV.textSecondary }} /> : undefined}>
                              Rename
                            </Menu.Item>
                            <Menu.Item fz={13}
                              leftSection={list.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                              onClick={() => handleArchive(list.id)}
                              disabled={!isOwner(list)}
                              rightSection={!isOwner(list) ? <Lock size={11} style={{ color: TV.textSecondary }} /> : undefined}>
                              {list.archived ? "Restore" : "Archive"}
                            </Menu.Item>
                            <Menu.Item fz={13} color="red" leftSection={<Trash2 size={14} />} onClick={() => setDeleteTarget(list)}
                              disabled={!isOwner(list)}
                              rightSection={!isOwner(list) ? <Lock size={11} style={{ color: TV.textSecondary }} /> : undefined}>
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
              {paginatedLists.map(list => (
                <Box key={list.id} px="sm" py="sm"
                  style={{ borderBottom: `1px solid ${TV.borderDivider}`, cursor: "pointer" }}
                  className="hover:bg-tv-surface-muted transition-colors">
                  <div className="flex items-center gap-3 flex-nowrap">
                    <Checkbox checked={selected.includes(list.id)}
                      onChange={() => toggleSelect(list.id)} color="tvPurple" size="xs"
                      onClick={e => e.stopPropagation()} />
                    <Box onClick={() => setDetailView(list)} style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-3 flex-nowrap">
                        <Box w={40} h={40} bg={list.archived ? TV.surface : TV.brandTint}
                          style={{ borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <List size={17} style={{ color: list.archived ? TV.textLabel : TV.textBrand }} />
                        </Box>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="flex items-center gap-1.5">
                            <Text fz={14} fw={600} c={TV.textBrand} truncate>{list.name}</Text>
                            {list.archived && <Badge size="xs" color="gray">Archived</Badge>}
                          </div>
                          <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                            <Text fz={12} c={TV.textSecondary}>{list.contacts.length} constituents</Text>
                            <Text fz={12} c={TV.textSecondary}>· {list.creator}</Text>
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
      {showCreate && <ListFormModal onClose={() => setShowCreate(false)} onSave={handleCreate} />}
      {renameTarget && <ListFormModal list={renameTarget} onClose={() => setRenameTarget(null)} onSave={handleRename} />}
      {shareTarget && <ShareModal list={shareTarget} onClose={() => setShareTarget(null)} onShare={users => handleShare(shareTarget.id, users)} />}
      {manageTarget && (
        <ManageContactsModal
          list={manageTarget}
          onClose={() => setManageTarget(null)}
          onSave={contacts => handleManageContacts(manageTarget.id, contacts)}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          title={`Delete "${deleteTarget.name}"?`}
          description="This will permanently delete this list. Constituents in the list will not be deleted."
          onConfirm={() => handleDelete(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {showEditColumns && (
        <EditColumnsModal columns={ALL_COLUMNS} active={activeColumns} onClose={() => setShowEditColumns(false)}
          onSave={cols => { setActiveColumns(cols); show("Columns updated!", "success"); }} />
      )}
    </Box>
  );
}