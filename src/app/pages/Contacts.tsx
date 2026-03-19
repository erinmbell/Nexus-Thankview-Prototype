import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Search, Download, Upload, X, Database,
  ChevronDown, ChevronRight, Trash2, CircleCheckBig,
  UserPlus, Send,
  Star, Users, List, FileSpreadsheet,
  AlertTriangle, RefreshCw, Replace,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { TagSelect, CONTACT_PRESET_TAGS } from "../components/TagSelect";
import { DeleteModal } from "../components/ui/DeleteModal";
import { FilterBar, CONTACT_FILTERS, FilterValues, dateFilterMatches } from "../components/FilterBar";
import {
  TextInput, Button, Badge, Modal, Menu, ActionIcon,
  Avatar, Title, Text, Stack, Box, SimpleGrid, Checkbox,
  Table, Tooltip, Select, UnstyledButton, Radio,
} from "@mantine/core";
import { TV } from "../theme";
import { TablePagination } from "../components/TablePagination";
import { SortableHeader, nextSort, sortRows } from "../components/SortableHeader";
import type { SortDir } from "../components/SortableHeader";
import { EditColumnsModal, ColumnsButton } from "../components/ColumnCustomizer";
import type { ColumnDef } from "../components/ColumnCustomizer";

// ── Types ──────────────────────────────────────────────────────────────────��──

import { type Contact, INIT_CONTACTS } from "../data/contacts";

// ── Column definitions ───────────────────────────────��────────────────────────

const ALL_COLUMNS: ColumnDef[] = [
  { key: "constituent", label: "Constituent",   group: "Summary", required: true },
  { key: "email",       label: "Primary Email",  group: "Summary" },
  { key: "phone",       label: "Primary Phone",  group: "Summary" },
  { key: "remoteId",    label: "Remote ID",       group: "Summary" },
  { key: "company",     label: "Company",         group: "Summary" },
  { key: "assignee",    label: "Assignee",        group: "Summary" },
  { key: "tags",        label: "Tags",            group: "Summary" },
  { key: "dateAdded",   label: "Date Added",      group: "Summary" },
  { key: "affiliation", label: "Affiliation",     group: "Summary" },
  { key: "classYear",   label: "Class Year",      group: "Profile" },
  { key: "title",       label: "Title / Role",    group: "Profile" },
  { key: "givingLevel", label: "Giving Level",    group: "Profile" },
  { key: "birthday",    label: "Birthday",        group: "Profile" },
  { key: "anniversary", label: "Anniversary",     group: "Profile" },
  { key: "askAmount",   label: "Ask Amount",      group: "Giving" },
  { key: "askDonationDesignation", label: "Ask Donation Designation", group: "Giving" },
  { key: "yearsGiving", label: "Years Giving",    group: "Giving" },
  { key: "donorStatus", label: "Donor Status",    group: "Giving" },
  { key: "starRating",  label: "Star Rating",     group: "Engagement" },
  { key: "ctScore",     label: "CT Score",         group: "Engagement" },
  { key: "videoScore",  label: "Video Score",      group: "Engagement" },
  { key: "lastCampaign",label: "Last Campaign",   group: "Engagement" },
  { key: "emailStatus", label: "Email Status",    group: "Constituent Info" },
  { key: "phoneStatus", label: "Phone Status",    group: "Constituent Info" },
  { key: "city",        label: "City",            group: "Address" },
  { key: "state",       label: "State / Region",  group: "Address" },
  { key: "cf_preferred_name",   label: "Preferred Name",   group: "Custom Fields" },
  { key: "cf_spouse_name",      label: "Spouse Name",      group: "Custom Fields" },
  { key: "cf_graduation_year",  label: "Graduation Year",  group: "Custom Fields" },
  { key: "cf_degree",           label: "Degree",           group: "Custom Fields" },
  { key: "cf_interest_area",    label: "Interest Area",    group: "Custom Fields" },
  { key: "cf_board_term",       label: "Board Term",       group: "Custom Fields" },
  { key: "cf_committee",        label: "Committee",        group: "Custom Fields" },
  { key: "cf_department",       label: "Department",       group: "Custom Fields" },
];

const DEFAULT_ACTIVE_COLUMNS = ["constituent", "email", "classYear", "askAmount", "askDonationDesignation", "givingLevel", "donorStatus", "assignee"];

// Mock data imported from shared data module (see ../data/contacts.ts)

const TOTAL_COUNT = 542578;

// ── Sort helpers ──────────────────────────────────────────────────────────────

function getSortValue(c: Contact, key: string): string {
  switch (key) {
    case "constituent": return `${c.first} ${c.last}`;
    case "email": return c.email;
    case "phone": return c.phone;
    case "remoteId": return c.remoteId;
    case "company": return c.company;
    case "assignee": return c.assignee;
    case "tags": return c.tags.join(", ");
    case "starRating": return String(c.starRating).padStart(2, "0");
    case "ctScore": return String(c.ctScore).padStart(3, "0");
    case "videoScore": return String(c.videoScore).padStart(3, "0");
    case "emailStatus": return c.emailStatus;
    case "phoneStatus": return c.phoneStatus;
    case "lastCampaign": return c.lastCampaign;
    case "dateAdded": return c.dateAdded;
    case "affiliation": return c.affiliation;
    case "donorStatus": return c.donorStatus;
    case "classYear": return c.classYear || "";
    case "askAmount": return c.askAmount != null ? String(c.askAmount).padStart(10, "0") : "";
    case "askDonationDesignation": return c.askDonationDesignation || "";
    case "yearsGiving": return c.yearsGiving != null ? String(c.yearsGiving).padStart(3, "0") : "";
    case "birthday": return c.birthday || "";
    case "anniversary": return c.anniversary || "";
    default: return "";
  }
}

// SortableHeader imported from ../components/SortableHeader

// ── Add Contact Modal ─────────────────────────────────────────────────────────

function AddContactModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Partial<Contact>) => void }) {
  const [form, setForm] = useState({ first: "", last: "", email: "", phone: "" });
  const [formTags, setFormTags] = useState<string[]>([]);
  const set = (k: keyof typeof form) => (val: string) => setForm(f => ({ ...f, [k]: val }));

  return (
    <Modal opened onClose={onClose} title="Add Constituent" size="md">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" mb="sm">
        <TextInput label="First Name" placeholder="James" value={form.first} onChange={e => set("first")(e.currentTarget.value)} />
        <TextInput label="Last Name" placeholder="Whitfield" value={form.last} onChange={e => set("last")(e.currentTarget.value)} />
        <TextInput label="Email Address" placeholder="j.whitfield@…" value={form.email} onChange={e => set("email")(e.currentTarget.value)} />
        <TextInput label="Phone Number" placeholder="(617) 555-0000" value={form.phone} onChange={e => set("phone")(e.currentTarget.value)} />
      </SimpleGrid>
      <Box mb="sm">
        <TagSelect
          value={formTags}
          onChange={setFormTags}
          presetTags={CONTACT_PRESET_TAGS}
          label={<>
            <Text span fz={11} fw={600} c={TV.textLabel} tt="uppercase" style={{ letterSpacing: "0.05em" }}>Tags</Text>
            {" "}<Text span fz={11} c={TV.textSecondary} fw={400} tt="none">(optional)</Text>
          </>}
          placeholder="Search or add tags…"
        />
      </Box>
      <Text fz={11} c={TV.textSecondary} mb="md">Custom fields configured in your org settings will also appear here.</Text>
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
        <Button color="tvPurple" onClick={() => { onSave({ ...form, tags: formTags.join(", ") } as any); onClose(); }} disabled={!form.first || !form.email}>Save Constituent</Button>
      </div>
    </Modal>
  );
}

// ── CSV Import Modal ──────────────────────────────────────────────────────────

type ImportMode = "add" | "update" | "replace";

const IMPORT_MODE_OPTIONS: { value: ImportMode; label: string; desc: string; icon: typeof Upload }[] = [
  { value: "add",     label: "Add New Constituents",          desc: "Import new constituents from your CSV. Duplicate rows (matched by email) will be skipped.",              icon: Plus },
  { value: "update",  label: "Update Existing Constituents",  desc: "Match CSV rows to existing constituents and merge/update their fields. New rows are added.",             icon: RefreshCw },
  { value: "replace", label: "Full Replace",               desc: "Replace your entire constituent database with this CSV. Constituents not in the file will be permanently deleted.", icon: Replace },
];

const IMPORT_FIELD_OPTIONS = [
  { value: "first_name",    label: "First Name" },
  { value: "last_name",     label: "Last Name" },
  { value: "email_address", label: "Email Address" },
  { value: "phone_number",  label: "Phone Number" },
  { value: "remote_id",     label: "Remote (Donor) ID" },
  { value: "company",       label: "Company" },
  { value: "affiliation",   label: "Affiliation" },
  { value: "tags",          label: "Tags" },
  { value: "star_rating",   label: "Star Rating" },
  { value: "assignee",      label: "Assignee" },
  { value: "skip",          label: "— Skip this column —" },
];

function ImportModal({ onClose, onImport }: { onClose: () => void; onImport: (mode: ImportMode, matchKey?: string) => void }) {
  const [step, setStep] = useState<"mode" | "upload" | "mapping" | "confirm">("mode");
  const [mode, setMode] = useState<ImportMode>("add");
  const [matchKey, setMatchKey] = useState<string>("email");
  const [uploaded, setUploaded] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  // Simulated CSV columns detected after upload
  const csvColumns = [
    { csv: "First Name",   tv: "first_name" },
    { csv: "Last Name",    tv: "last_name" },
    { csv: "Email",        tv: "email_address" },
    { csv: "Phone",        tv: "phone_number" },
    { csv: "Donor ID",     tv: "remote_id" },
    { csv: "Organization", tv: "company" },
    { csv: "Category",     tv: "tags" },
  ];

  // Simulated validation results per mode
  const mockStats = {
    add:     { valid: 142, flagged: 2, matched: 0,  newRows: 142, deleted: 0 },
    update:  { valid: 142, flagged: 2, matched: 87, newRows: 55,  deleted: 0 },
    replace: { valid: 142, flagged: 2, matched: 87, newRows: 55,  deleted: 400234 },
  };
  const stats = mockStats[mode];

  const stepTitle: Record<string, string> = {
    mode: "Import Constituents from CSV",
    upload: "Import Constituents from CSV",
    mapping: "Map CSV Columns",
    confirm: mode === "replace" ? "Confirm Full Replace" : "Confirm Import",
  };

  return (
    <Modal opened onClose={onClose} title={stepTitle[step]} size="lg" radius="lg">

      {/* ── Step 1: Choose mode ── */}
      {step === "mode" && (
        <Stack gap="md">
          <Text fz={13} c={TV.textSecondary}>How would you like to import this CSV?</Text>
          <Radio.Group value={mode} onChange={v => setMode(v as ImportMode)}>
            <Stack gap="sm">
              {IMPORT_MODE_OPTIONS.map(opt => {
                const Icon = opt.icon;
                const isActive = mode === opt.value;
                const isDanger = opt.value === "replace";
                return (
                  <UnstyledButton key={opt.value} onClick={() => setMode(opt.value)}
                    py="sm" px="md"
                    style={{
                      border: `2px solid ${isActive ? (isDanger ? TV.danger : TV.textBrand) : TV.borderLight}`,
                      borderRadius: 12,
                      backgroundColor: isActive ? (isDanger ? TV.dangerBg : TV.brandTint) : undefined,
                      transition: "all 0.15s",
                    }}
                    className="hover:bg-tv-surface"
                  >
                    <div className="flex items-center gap-3 flex-nowrap">
                      <Radio value={opt.value} color={isDanger ? "red" : "tvPurple"} size="sm" />
                      <Box w={36} h={36}
                        bg={isDanger ? TV.dangerBg : TV.brandTint}
                        style={{ borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon size={16} style={{ color: isDanger ? TV.danger : TV.textBrand }} />
                      </Box>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text fz={14} fw={600} c={isDanger ? TV.danger : TV.textPrimary}>{opt.label}</Text>
                        <Text fz={12} c={TV.textSecondary}>{opt.desc}</Text>
                      </div>
                    </div>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </Radio.Group>

          {/* Match key selector — only for "update" mode */}
          {mode === "update" && (
            <Box bg={TV.brandTint} p="md" style={{ borderRadius: 12, border: `1px solid ${TV.borderStrong}` }}>
              <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em" mb="xs">Match Existing Constituents By</Text>
              <Radio.Group value={matchKey} onChange={setMatchKey}>
                <div className="flex items-center gap-5">
                  <Radio value="email" label="Email Address" color="tvPurple" size="sm"
                    styles={{ label: { fontSize: 13 } }} />
                  <Radio value="remoteId" label="Remote (Donor) ID" color="tvPurple" size="sm"
                    styles={{ label: { fontSize: 13 } }} />
                </div>
              </Radio.Group>
              <Text fz={11} c={TV.textSecondary} mt="xs">
                Rows with a matching {matchKey === "email" ? "email address" : "Remote ID"} will update the existing constituent.
                Rows with no match will be added as new constituents.
              </Text>
            </Box>
          )}

          {/* Danger callout for Full Replace */}
          {mode === "replace" && (
            <Box bg={TV.dangerBg} p="md" style={{ borderRadius: 12, border: `1px solid ${TV.danger}` }}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={16} style={{ color: TV.danger }} />
                <Text fz={13} fw={700} c={TV.danger}>Destructive Operation</Text>
              </div>
              <Text fz={12} c="#991b1b">
                Full Replace will <b>permanently delete</b> every constituent in your database that is <b>not</b> present in the uploaded CSV.
                This action cannot be undone. Make sure you have a recent backup before proceeding.
              </Text>
            </Box>
          )}

          <div className="flex items-center justify-end gap-3 mt-3">
            <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
            <Button color={mode === "replace" ? "red" : "tvPurple"} onClick={() => setStep("upload")}>
              Continue
            </Button>
          </div>
        </Stack>
      )}

      {/* ── Step 2: Upload CSV ── */}
      {step === "upload" && (
        <Stack gap="md">
          {/* Mode badge reminder */}
          <div className="flex items-center gap-2">
            <Badge
              color={mode === "replace" ? "red" : mode === "update" ? "orange" : "tvPurple"}
              variant="light" size="lg"
              leftSection={mode === "add" ? <Plus size={12} /> : mode === "update" ? <RefreshCw size={12} /> : <Replace size={12} />}
            >
              {IMPORT_MODE_OPTIONS.find(o => o.value === mode)?.label}
            </Badge>
            {mode === "update" && (
              <Badge variant="outline" color="tvPurple" size="lg">
                Match on: {matchKey === "email" ? "Email" : "Remote ID"}
              </Badge>
            )}
          </div>

          <Box
            onClick={() => { setUploaded(true); setTimeout(() => setStep("mapping"), 400); }}
            p="xl"
            style={{
              border: `2px dashed ${uploaded ? TV.success : TV.borderStrong}`,
              borderRadius: 20, cursor: "pointer", textAlign: "center",
              backgroundColor: uploaded ? TV.successBg : undefined,
              transition: "all 0.2s",
            }}
          >
            {uploaded ? (
              <Stack align="center" gap="xs">
                <CircleCheckBig size={32} style={{ color: TV.success }} />
                <Text fz={14} fw={700} c={TV.textPrimary}>contacts.csv ready</Text>
                <Text fz={12} c={TV.textSecondary}>144 rows detected (2 headers)</Text>
              </Stack>
            ) : (
              <Stack align="center" gap="xs">
                <Upload size={28} style={{ color: TV.textBrand }} />
                <Text fz={14} fw={700} c={TV.textPrimary}>Drop your CSV here, or click to browse</Text>
                <Text fz={12} c={TV.textSecondary}>Supports .csv files up to 10 MB</Text>
              </Stack>
            )}
          </Box>
          <div className="flex items-center justify-between">
            <Button variant="subtle" color="gray" onClick={() => { setUploaded(false); setStep("mode"); }}>
              ← Back
            </Button>
            <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
          </div>
        </Stack>
      )}

      {/* ── Step 3: Column mapping ── */}
      {step === "mapping" && (
        <Stack gap="sm">
          <div className="flex items-center gap-2 mb-2">
            <Badge
              color={mode === "replace" ? "red" : mode === "update" ? "orange" : "tvPurple"}
              variant="light" size="sm"
            >
              {IMPORT_MODE_OPTIONS.find(o => o.value === mode)?.label}
            </Badge>
            {mode === "update" && (
              <Badge variant="outline" color="tvPurple" size="sm">
                Match: {matchKey === "email" ? "Email" : "Remote ID"}
              </Badge>
            )}
          </div>
          <Text fz={13} c={TV.textSecondary}>Match your CSV columns to ThankView fields.</Text>

          {csvColumns.map(m => (
            <div key={m.csv} className="flex items-center gap-3">
              <Box w={128} px="xs" py={6} bg={TV.surface}
                style={{ borderRadius: 4, fontFamily: "monospace", fontSize: 12, color: TV.textSecondary }}>
                {m.csv}
              </Box>
              <ChevronRight size={13} style={{ color: TV.textDecorative }} />
              <select defaultValue={m.tv}
                style={{ flex: 1, border: `1px solid ${TV.borderLight}`, borderRadius: 8, padding: "6px 12px", fontSize: 12 }}>
                {IMPORT_FIELD_OPTIONS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          ))}

          <div className="flex items-center justify-between mt-2">
            <Button variant="subtle" color="gray" onClick={() => setStep("upload")}>
              ← Back
            </Button>
            <Button color={mode === "replace" ? "red" : "tvPurple"} onClick={() => setStep("confirm")}>
              Validate file →
            </Button>
          </div>
        </Stack>
      )}

      {/* ── Step 4: Confirm ── */}
      {step === "confirm" && (
        <Stack gap="md">
          {/* Flagged rows warning */}
          {stats.flagged > 0 && (
            <Box bg="#fef9ee" p="md" style={{ borderRadius: 12, border: `1px solid ${TV.warningBorder}` }}>
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle size={14} style={{ color: TV.warningHover }} />
                <Text fz={12} fw={600} c={TV.warningHover}>{stats.flagged} rows flagged</Text>
              </div>
              <Text fz={12} c={TV.warningHover}>Row 14: missing email address</Text>
              <Text fz={12} c={TV.warningHover}>Row 31: invalid phone format</Text>
            </Box>
          )}

          {/* Mode-specific summary */}
          {mode === "add" && (
            <Box bg={TV.surface} p="md" style={{ borderRadius: 12 }}>
              <div className="flex items-center gap-3 mb-2">
                <Plus size={16} style={{ color: TV.textBrand }} />
                <Text fz={14} fw={700} c={TV.textPrimary}>Add New Constituents</Text>
              </div>
              <Stack gap={4}>
                <div className="flex items-center gap-2">
                  <Badge color="green" variant="light" size="sm">{stats.valid}</Badge>
                  <Text fz={13} c={TV.textPrimary}>valid constituents will be added</Text>
                </div>
                <Text fz={12} c={TV.textSecondary}>Flagged rows will be skipped.</Text>
              </Stack>
            </Box>
          )}

          {mode === "update" && (
            <Box bg={TV.surface} p="md" style={{ borderRadius: 12 }}>
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw size={16} style={{ color: TV.textBrand }} />
                <Text fz={14} fw={700} c={TV.textPrimary}>Update Existing Constituents</Text>
              </div>
              <Stack gap={4}>
                <div className="flex items-center gap-2">
                  <Badge color="tvPurple" variant="light" size="sm">{stats.matched}</Badge>
                  <Text fz={13} c={TV.textPrimary}>
                    existing constituents matched by {matchKey === "email" ? "email address" : "Remote ID"} — fields will be updated
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Badge color="green" variant="light" size="sm">{stats.newRows}</Badge>
                  <Text fz={13} c={TV.textPrimary}>new constituents will be added</Text>
                </div>
                <Text fz={12} c={TV.textSecondary}>Flagged rows will be skipped. Existing fields not in the CSV will be preserved.</Text>
              </Stack>
            </Box>
          )}

          {mode === "replace" && (
            <>
              <Box bg={TV.surface} p="md" style={{ borderRadius: 12 }}>
                <div className="flex items-center gap-3 mb-2">
                  <Replace size={16} style={{ color: TV.textBrand }} />
                  <Text fz={14} fw={700} c={TV.textPrimary}>Full Replace Summary</Text>
                </div>
                <Stack gap={4}>
                  <div className="flex items-center gap-2">
                    <Badge color="tvPurple" variant="light" size="sm">{stats.matched}</Badge>
                    <Text fz={13} c={TV.textPrimary}>existing constituents matched — fields will be overwritten</Text>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge color="green" variant="light" size="sm">{stats.newRows}</Badge>
                    <Text fz={13} c={TV.textPrimary}>new constituents will be added</Text>
                  </div>
                </Stack>
              </Box>

              {/* Danger: deletion count */}
              <Box bg={TV.dangerBg} p="md" style={{ borderRadius: 12, border: `2px solid ${TV.danger}` }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} style={{ color: TV.danger }} />
                  <Text fz={14} fw={700} c={TV.danger}>
                    {stats.deleted.toLocaleString()} constituents will be permanently deleted
                  </Text>
                </div>
                <Text fz={12} c="#991b1b" mb="md">
                  These constituents are <b>not</b> present in the uploaded CSV and will be removed from your database.
                  This action is <b>irreversible</b>. All associated campaign history, engagement data, and custom fields for these constituents will also be deleted.
                </Text>
                <TextInput
                  label={
                    <Text fz={12} c="#991b1b" fw={600}>
                      Type <b>DELETE {stats.deleted.toLocaleString()}</b> to confirm
                    </Text>
                  }
                  placeholder={`DELETE ${stats.deleted.toLocaleString()}`}
                  value={confirmText}
                  onChange={e => setConfirmText(e.currentTarget.value)}
                  styles={{
                    input: { borderColor: TV.danger, fontFamily: "monospace" },
                  }}
                />
              </Box>
            </>
          )}

          <div className="flex items-center justify-between">
            <Button variant="subtle" color="gray" onClick={() => setStep("mapping")}>
              ← Back
            </Button>
            <div className="flex items-center gap-3">
              <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
              {mode === "replace" ? (
                <Button color="red"
                  leftSection={<AlertTriangle size={14} />}
                  disabled={confirmText !== `DELETE ${stats.deleted.toLocaleString()}`}
                  onClick={() => { onImport(mode, matchKey); onClose(); }}>
                  Replace All Constituents
                </Button>
              ) : (
                <Button color="tvPurple"
                  onClick={() => { onImport(mode, mode === "update" ? matchKey : undefined); onClose(); }}>
                  {mode === "update"
                    ? `Update ${stats.matched} + Add ${stats.newRows} Constituents`
                    : `Confirm Import (${stats.valid} constituents)`
                  }
                </Button>
              )}
            </div>
          </div>
        </Stack>
      )}
    </Modal>
  );
}



// ── Export Modal ──────────────────────────────────────────────────────────────

// ── Export: Category → Field Group → Fields (EverTrue two-panel layout) ──────

interface ExportField { key: string; label: string }
interface ExportFieldGroup { label: string; fields: ExportField[] }
interface ExportCategory { label: string; color: string; fieldGroups: ExportFieldGroup[] }

const EXPORT_CATEGORIES: ExportCategory[] = [
  {
    label: "Basic Information",
    color: TV.textBrand,
    fieldGroups: [
      { label: "Name", fields: [
        { key: "prefix", label: "Prefix" },
        { key: "first_name", label: "First Name" },
        { key: "middle_name", label: "Middle Name" },
        { key: "last_name", label: "Last Name" },
        { key: "suffix", label: "Suffix" },
        { key: "nickname", label: "Nickname / Preferred Name" },
        { key: "maiden_name", label: "Maiden Name" },
        { key: "formal_greeting", label: "Formal Greeting" },
        { key: "informal_greeting", label: "Informal Greeting" },
      ]},
      { label: "Deceased", fields: [
        { key: "deceased", label: "Deceased Flag" },
        { key: "deceased_date", label: "Date of Death" },
      ]},
      { label: "Year", fields: [
        { key: "class_year", label: "Class Year" },
        { key: "graduation_year", label: "Graduation Year" },
        { key: "enrollment_year", label: "Enrollment Year" },
      ]},
      { label: "Education", fields: [
        { key: "degree", label: "Degree" },
        { key: "major", label: "Major" },
        { key: "minor", label: "Minor" },
        { key: "school_college", label: "School / College" },
        { key: "campus", label: "Campus" },
      ]},
      { label: "Work History", fields: [
        { key: "company", label: "Company / Organization" },
        { key: "title", label: "Title / Role" },
        { key: "department", label: "Department" },
        { key: "industry", label: "Industry" },
      ]},
      { label: "Assigned To", fields: [
        { key: "assignee", label: "Assignee" },
        { key: "assignment_team", label: "Assignment Team" },
        { key: "assignment_date", label: "Assignment Date" },
      ]},
      { label: "Wealth and Assets", fields: [
        { key: "est_wealth", label: "Estimated Wealth" },
        { key: "est_income", label: "Estimated Income" },
        { key: "real_estate_value", label: "Real Estate Value" },
        { key: "stock_holdings", label: "Stock Holdings" },
        { key: "business_ownership", label: "Business Ownership" },
      ]},
      { label: "Career Moves", fields: [
        { key: "career_move_date", label: "Career Move Date" },
        { key: "career_move_from", label: "Previous Employer" },
        { key: "career_move_to", label: "New Employer" },
        { key: "career_move_title", label: "New Title" },
      ]},
    ],
  },
  {
    label: "Constituent Information",
    color: TV.textBrand,
    fieldGroups: [
      { label: "Email", fields: [
        { key: "email_primary", label: "Primary Email" },
        { key: "email_secondary", label: "Secondary Email" },
        { key: "email_preferred", label: "Preferred Email" },
        { key: "email_status", label: "Email Status" },
        { key: "email_opt_in", label: "Email Opt-in" },
      ]},
      { label: "Phone", fields: [
        { key: "phone_primary", label: "Primary Phone" },
        { key: "phone_mobile", label: "Mobile Phone" },
        { key: "phone_work", label: "Work Phone" },
        { key: "phone_status", label: "Phone Status" },
        { key: "phone_opt_in", label: "Phone Opt-in" },
      ]},
      { label: "Address", fields: [
        { key: "address_type", label: "Address Type" },
        { key: "address_line1", label: "Address Line 1" },
        { key: "address_line2", label: "Address Line 2" },
        { key: "city", label: "City" },
        { key: "state", label: "State / Region" },
        { key: "zip", label: "Zip / Postal Code" },
        { key: "country", label: "Country" },
        { key: "address_preferred", label: "Preferred Address" },
      ]},
      { label: "Social Profiles", fields: [
        { key: "linkedin_url", label: "LinkedIn URL" },
        { key: "facebook_url", label: "Facebook URL" },
        { key: "twitter_handle", label: "X (Twitter) Handle" },
        { key: "instagram_handle", label: "Instagram Handle" },
      ]},
    ],
  },
  {
    label: "Census Data",
    color: TV.textBrand,
    fieldGroups: [
      { label: "Demographics", fields: [
        { key: "age", label: "Age" },
        { key: "gender", label: "Gender" },
        { key: "marital_status", label: "Marital Status" },
        { key: "birth_date", label: "Birth Date" },
        { key: "spouse_name", label: "Spouse Name" },
      ]},
      { label: "Household", fields: [
        { key: "household_id", label: "Household ID" },
        { key: "household_size", label: "Household Size" },
        { key: "household_income", label: "Household Income Range" },
        { key: "homeowner_status", label: "Homeowner Status" },
        { key: "home_value", label: "Home Value Range" },
      ]},
      { label: "Geography", fields: [
        { key: "geo_region", label: "Region" },
        { key: "geo_metro_area", label: "Metro Area" },
        { key: "geo_county", label: "County" },
        { key: "geo_congressional", label: "Congressional District" },
        { key: "geo_latitude", label: "Latitude" },
        { key: "geo_longitude", label: "Longitude" },
      ]},
    ],
  },
  {
    label: "Giving History",
    color: TV.textBrand,
    fieldGroups: [
      { label: "Lifetime Giving", fields: [
        { key: "total_giving", label: "Total Lifetime Giving" },
        { key: "total_gifts", label: "Total Gift Count" },
        { key: "largest_gift", label: "Largest Gift Amount" },
        { key: "largest_gift_date", label: "Largest Gift Date" },
        { key: "first_gift_date", label: "First Gift Date" },
        { key: "first_gift_amount", label: "First Gift Amount" },
      ]},
      { label: "Annual Giving", fields: [
        { key: "fy_giving_current", label: "Current FY Giving" },
        { key: "fy_giving_prev", label: "Previous FY Giving" },
        { key: "fy_gift_count_current", label: "Current FY Gift Count" },
        { key: "fy_gift_count_prev", label: "Previous FY Gift Count" },
        { key: "giving_level", label: "Giving Level" },
        { key: "giving_consecutive_years", label: "Consecutive Giving Years" },
      ]},
      { label: "Recent Gift", fields: [
        { key: "last_gift_date", label: "Last Gift Date" },
        { key: "last_gift_amount", label: "Last Gift Amount" },
        { key: "last_gift_designation", label: "Last Gift Designation" },
        { key: "last_gift_fund", label: "Last Gift Fund" },
      ]},
      { label: "Pledges", fields: [
        { key: "pledge_balance", label: "Total Pledge Balance" },
        { key: "pledge_count", label: "Active Pledge Count" },
        { key: "pledge_next_payment", label: "Next Pledge Payment Date" },
        { key: "recurring_gift", label: "Recurring Gift Flag" },
        { key: "recurring_amount", label: "Recurring Gift Amount" },
      ]},
    ],
  },
  {
    label: "Social",
    color: TV.textBrand,
    fieldGroups: [
      { label: "Social Engagement", fields: [
        { key: "social_linkedin_connections", label: "LinkedIn Connections" },
        { key: "social_twitter_followers", label: "X (Twitter) Followers" },
        { key: "social_last_post", label: "Last Social Post Date" },
      ]},
      { label: "Online Presence", fields: [
        { key: "website_url", label: "Personal Website" },
        { key: "blog_url", label: "Blog URL" },
        { key: "bio", label: "Bio / About" },
      ]},
    ],
  },
  {
    label: "Scores",
    color: TV.textBrand,
    fieldGroups: [
      { label: "Engagement", fields: [
        { key: "star_rating", label: "Star Rating" },
        { key: "ct_score", label: "CT Score" },
        { key: "video_score", label: "Video Score" },
        { key: "engagement_score", label: "Engagement Score" },
        { key: "tv_opens", label: "ThankView Opens" },
        { key: "tv_open_rate", label: "Open Rate (%)" },
        { key: "tv_click_rate", label: "Click Rate (%)" },
        { key: "tv_views", label: "ThankView Video Views" },
        { key: "tv_replies", label: "ThankView Replies" },
        { key: "tv_reply_rate", label: "Reply Rate (%)" },
        { key: "last_campaign", label: "Last Campaign" },
        { key: "last_interaction_date", label: "Last Interaction Date" },
      ]},
      { label: "Capacity", fields: [
        { key: "capacity_rating", label: "Capacity Rating" },
        { key: "capacity_range", label: "Capacity Range" },
        { key: "major_gift_likelihood", label: "Major Gift Likelihood" },
      ]},
      { label: "Propensity", fields: [
        { key: "propensity_score", label: "Propensity to Give Score" },
        { key: "affinity_score", label: "Affinity Score" },
        { key: "planned_giving_score", label: "Planned Giving Score" },
      ]},
    ],
  },
  {
    label: "Your Custom Fields",
    color: TV.textBrand,
    fieldGroups: [
      { label: "Custom Fields", fields: [
        { key: "cf_preferred_name", label: "Preferred Name" },
        { key: "cf_spouse_name", label: "Spouse Name" },
        { key: "cf_graduation_year", label: "Graduation Year" },
        { key: "cf_degree", label: "Degree" },
        { key: "cf_interest_area", label: "Interest Area" },
        { key: "cf_board_term", label: "Board Term" },
        { key: "cf_committee", label: "Committee" },
        { key: "cf_department", label: "Department" },
      ]},
      { label: "System IDs", fields: [
        { key: "remote_id", label: "Remote (Donor) ID" },
        { key: "external_id", label: "External System ID" },
        { key: "crm_id", label: "CRM Record ID" },
      ]},
      { label: "Metadata", fields: [
        { key: "date_added", label: "Date Added" },
        { key: "date_modified", label: "Date Last Modified" },
        { key: "source", label: "Source / Import Origin" },
        { key: "affiliation", label: "Affiliation" },
        { key: "tags", label: "Tags" },
        { key: "notes", label: "Notes" },
        { key: "do_not_contact", label: "Do Not Contact Flag" },
      ]},
    ],
  },
];

const ALL_EXPORT_FIELD_KEYS = EXPORT_CATEGORIES.flatMap(c => c.fieldGroups.flatMap(g => g.fields.map(f => f.key)));

function ExportModal({ selectedCount, filteredCount, totalCount, onClose, onExport }: {
  selectedCount: number;
  filteredCount: number;
  totalCount: number;
  onClose: () => void;
  onExport: (scope: string, fieldCount: number) => void;
}) {
  const [scope, setScope] = useState<string>(selectedCount > 0 ? "selected" : "all");
  const [selectedFields, setSelectedFields] = useState<string[]>([...ALL_EXPORT_FIELD_KEYS]);
  const [activeCategory, setActiveCategory] = useState(0);

  const toggleField = (key: string) =>
    setSelectedFields(s => s.includes(key) ? s.filter(k => k !== key) : [...s, key]);

  const toggleFieldGroup = (group: ExportFieldGroup) => {
    const keys = group.fields.map(f => f.key);
    const allSelected = keys.every(k => selectedFields.includes(k));
    if (allSelected) setSelectedFields(s => s.filter(k => !keys.includes(k)));
    else setSelectedFields(s => [...new Set([...s, ...keys])]);
  };

  const toggleCategory = (cat: ExportCategory) => {
    const keys = cat.fieldGroups.flatMap(g => g.fields.map(f => f.key));
    const allSelected = keys.every(k => selectedFields.includes(k));
    if (allSelected) setSelectedFields(s => s.filter(k => !keys.includes(k)));
    else setSelectedFields(s => [...new Set([...s, ...keys])]);
  };

  const getCategoryState = (cat: ExportCategory) => {
    const keys = cat.fieldGroups.flatMap(g => g.fields.map(f => f.key));
    const count = keys.filter(k => selectedFields.includes(k)).length;
    return { all: count === keys.length, some: count > 0, count, total: keys.length };
  };

  const getGroupState = (group: ExportFieldGroup) => {
    const keys = group.fields.map(f => f.key);
    const count = keys.filter(k => selectedFields.includes(k)).length;
    return { all: count === keys.length, some: count > 0, count, total: keys.length };
  };

  const scopeCount = scope === "selected" ? selectedCount : scope === "filtered" ? filteredCount : totalCount;
  const activeCat = EXPORT_CATEGORIES[activeCategory];

  return (
    <Modal opened onClose={onClose} title="Export Fields" size={720} radius="lg"
      styles={{ title: { fontSize: 20, fontWeight: 900, color: TV.textPrimary } }}>
      <Stack gap="md">
        <Text fz={13} c={TV.textSecondary}>
          Choose the fields to include in your .CSV file. When your export is ready, you'll receive an
          alert and an email with a link to your download.
        </Text>

        {/* Scope selection */}
        <Box>
          <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em" mb="sm">Export Scope</Text>
          <Radio.Group value={scope} onChange={setScope}>
            <div className="flex items-center gap-5">
              <Radio value="all" label={`All constituents (${totalCount.toLocaleString()})`} color="tvPurple" size="sm"
                styles={{ label: { fontSize: 13 } }} />
              {filteredCount < totalCount && (
                <Radio value="filtered" label={`Filtered view (${filteredCount.toLocaleString()})`} color="tvPurple" size="sm"
                  styles={{ label: { fontSize: 13 } }} />
              )}
              {selectedCount > 0 && (
                <Radio value="selected" label={`Selected (${selectedCount})`} color="tvPurple" size="sm"
                  styles={{ label: { fontSize: 13 } }} />
              )}
            </div>
          </Radio.Group>
        </Box>

        {/* Two-panel field picker */}
        <Box style={{ border: `1px solid ${TV.borderLight}`, borderRadius: 10, overflow: "hidden", display: "flex", minHeight: 340 }}>
          {/* Left panel: Categories */}
          <Box style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${TV.borderLight}`, overflowY: "auto" }}>
            <Box px="sm" py="xs" style={{ borderBottom: `1px solid ${TV.borderLight}`, backgroundColor: TV.surface }}>
              <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em">Categories</Text>
            </Box>
            <Stack gap={0}>
              {EXPORT_CATEGORIES.map((cat, idx) => {
                const st = getCategoryState(cat);
                const isActive = activeCategory === idx;
                return (
                  <UnstyledButton key={cat.label} onClick={() => setActiveCategory(idx)}
                    py="sm" px="sm"
                    style={{
                      backgroundColor: isActive ? TV.brandTint : undefined,
                      borderLeft: isActive ? `3px solid ${TV.textBrand}` : "3px solid transparent",
                      transition: "all 0.12s",
                    }}
                    className="hover:bg-tv-surface">
                    <div className="flex items-center gap-2 flex-nowrap">
                      <Checkbox
                        checked={st.all}
                        indeterminate={st.some && !st.all}
                        onChange={(e) => { e.stopPropagation(); toggleCategory(cat); }}
                        color="tvPurple" size="sm"
                        styles={{ input: { cursor: "pointer" } }}
                      />
                      <Box style={{ flex: 1, minWidth: 0 }}>
                        <Text fz={13} fw={600} c={isActive ? TV.textBrand : TV.textPrimary}
                          style={{ lineHeight: 1.3 }}>
                          {cat.label}
                        </Text>
                        {st.some && (
                          <Text fz={10} c={TV.textSecondary}>{st.count}/{st.total} fields</Text>
                        )}
                      </Box>
                    </div>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </Box>

          {/* Right panel: Field Groups for active category */}
          <Box style={{ flex: 1, overflowY: "auto" }}>
            <Box px="md" py="xs" style={{ borderBottom: `1px solid ${TV.borderLight}`, backgroundColor: TV.surface }}>
              <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em">Field Groups</Text>
            </Box>
            <Stack gap={0} p="sm">
              {activeCat.fieldGroups.map(group => {
                const gs = getGroupState(group);
                return (
                  <Box key={group.label} mb="sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Checkbox
                        checked={gs.all}
                        indeterminate={gs.some && !gs.all}
                        onChange={() => toggleFieldGroup(group)}
                        color="tvPurple" size="sm"
                      />
                      <Text fz={13} fw={600} c={TV.textPrimary}>{group.label}</Text>
                      <Text fz={11} c={TV.textSecondary}>({gs.count}/{gs.total})</Text>
                    </div>
                    <Stack gap={2} ml={32}>
                      {group.fields.map(f => (
                        <Checkbox key={f.key} label={f.label} checked={selectedFields.includes(f.key)}
                          onChange={() => toggleField(f.key)} color="tvPurple" size="xs"
                          styles={{ label: { fontSize: 12, color: TV.textSecondary } }} />
                      ))}
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        </Box>

        {/* Select/clear helpers + count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UnstyledButton onClick={() => setSelectedFields([...ALL_EXPORT_FIELD_KEYS])}>
              <Text fz={12} fw={600} c={TV.textBrand}>Select All</Text>
            </UnstyledButton>
            <Text fz={12} c={TV.borderStrong}>·</Text>
            <UnstyledButton onClick={() => setSelectedFields([])}>
              <Text fz={12} fw={600} c={TV.danger}>Clear All</Text>
            </UnstyledButton>
          </div>
          <Text fz={12} c={TV.textSecondary}>
            {selectedFields.length} of {ALL_EXPORT_FIELD_KEYS.length} fields selected
          </Text>
        </div>

        {/* Summary bar */}
        <Box bg={TV.surface} p="md" style={{ borderRadius: 10 }}>
          <div className="flex items-center gap-3">
            <FileSpreadsheet size={16} style={{ color: TV.textBrand }} />
            <Text fz={13} c={TV.textPrimary}>
              Export <b>{scopeCount.toLocaleString()}</b> constituent{scopeCount !== 1 ? "s" : ""} with <b>{selectedFields.length}</b> field{selectedFields.length !== 1 ? "s" : ""} as .CSV
            </Text>
          </div>
        </Box>

        {/* Actions — Cancel left, Start Export right */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
          <Button color="tvPurple" leftSection={<Download size={14} />}
            disabled={selectedFields.length === 0}
            onClick={() => { onExport(scope, selectedFields.length); onClose(); }}>
            Start Export
          </Button>
        </div>
      </Stack>
    </Modal>
  );
}

// ── Add to List Modal ─────────────────────────────────────────────────────────

const MOCK_LISTS = [
  { id: 1, name: "Spring Gala Invitees", count: 5 },
  { id: 2, name: "Major Donors – Q1 Outreach", count: 3 },
  { id: 3, name: "Alumni Phonathon 2025", count: 4 },
  { id: 5, name: "Lapsed Donors Re-engagement", count: 2 },
  { id: 7, name: "Annual Fund Thank You", count: 6 },
  { id: 8, name: "Homecoming Weekend VIPs", count: 3 },
];

function AddToListModal({ selectedCount, onClose, onAdd }: {
  selectedCount: number;
  onClose: () => void;
  onAdd: (listName: string, isNew: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [chosen, setChosen] = useState<number | null>(null);

  const filteredLists = MOCK_LISTS.filter(l =>
    l.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal opened onClose={onClose} title={`Add ${selectedCount} Constituent${selectedCount !== 1 ? "s" : ""} to List`} size="md" radius="lg">
      {creating ? (
        <Stack gap="sm">
          <TextInput label="New List Name" placeholder="e.g. Spring Gala Invitees"
            value={newName} onChange={e => setNewName(e.currentTarget.value)} data-autofocus />
          <div className="flex items-center justify-end gap-3 mt-4">
            <Button variant="default" onClick={() => setCreating(false)}>Back</Button>
            <Button color="tvPurple" disabled={!newName.trim()}
              onClick={() => { onAdd(newName, true); onClose(); }}>
              Create & Add
            </Button>
          </div>
        </Stack>
      ) : (
        <Stack gap="sm">
          <TextInput leftSection={<Search size={14} style={{ color: TV.textSecondary }} />}
            placeholder="Search lists…" value={search} onChange={e => setSearch(e.currentTarget.value)}
            radius="xl" styles={{ input: { borderColor: TV.borderLight, backgroundColor: '#fff', color: TV.textPrimary } }} />

          <Box style={{ maxHeight: 280, overflowY: "auto", border: `1px solid ${TV.borderLight}`, borderRadius: 12 }}>
            {filteredLists.map(l => (
              <UnstyledButton key={l.id} w="100%" py="sm" px="md"
                onClick={() => setChosen(l.id)}
                bg={chosen === l.id ? TV.brandTint : undefined}
                style={{ borderBottom: `1px solid ${TV.borderDivider}`, transition: "all 0.15s" }}
                className="hover:bg-tv-surface">
                <div className="flex items-center gap-3 flex-nowrap">
                  <Radio checked={chosen === l.id} onChange={() => setChosen(l.id)} color="tvPurple" size="xs" />
                  <Box w={28} h={28} bg={TV.brandTint}
                    style={{ borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <List size={12} style={{ color: TV.textBrand }} />
                  </Box>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text fz={13} fw={600} c={TV.textPrimary} truncate>{l.name}</Text>
                    <Text fz={11} c={TV.textSecondary}>{l.count} constituents</Text>
                  </div>
                </div>
              </UnstyledButton>
            ))}
            {filteredLists.length === 0 && (
              <Text fz={12} c={TV.textSecondary} ta="center" py="lg">No lists match your search</Text>
            )}
          </Box>

          <UnstyledButton onClick={() => setCreating(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-tv-surface transition-colors"
            style={{ border: `1px dashed ${TV.borderStrong}`, borderRadius: 10 }}>
            <Plus size={14} style={{ color: TV.textBrand }} />
            <Text fz={13} fw={600} c={TV.textBrand}>Create New List</Text>
          </UnstyledButton>

          <div className="flex items-center justify-end gap-3 mt-3">
            <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
            <Button color="tvPurple" leftSection={<List size={14} />}
              disabled={chosen === null}
              onClick={() => {
                const list = MOCK_LISTS.find(l => l.id === chosen);
                if (list) { onAdd(list.name, false); onClose(); }
              }}>
              Add to List
            </Button>
          </div>
        </Stack>
      )}
    </Modal>
  );
}

// ── Cell renderer ─────────────────────────────────────────────────────────────

const EMAIL_STATUS_BADGE: Record<string, { color: string; label: string }> = {
  valid: { color: "green", label: "Valid" },
  bounced: { color: "red", label: "Bounced" },
  unsubscribed: { color: "orange", label: "Unsubscribed" },
  spam: { color: "red", label: "Spam" },
  missing: { color: "gray", label: "Missing" },
};

const PHONE_STATUS_BADGE: Record<string, { color: string; label: string }> = {
  valid: { color: "green", label: "Valid" },
  unsubscribed: { color: "orange", label: "Unsubscribed" },
  missing: { color: "gray", label: "Missing" },
};

function CellValue({ col, contact }: { col: string; contact: Contact }) {
  switch (col) {
    case "constituent":
      return (
        <div className="flex items-center gap-2 flex-nowrap">
          <Avatar size={32} radius="xl"
            styles={{ placeholder: { backgroundColor: contact.color, color: "white", fontSize: 13, fontWeight: 700 } }}>
            {contact.avatar}
          </Avatar>
          <div style={{ minWidth: 0 }}>
            <Text fz={13} fw={600} c={TV.textBrand} truncate className="hover:underline">
              {contact.first} {contact.last}
            </Text>
            <Text fz={11} c={TV.textSecondary} truncate>{contact.affiliation}</Text>
          </div>
        </div>
      );
    case "email":
      return (
        <div className="flex items-center gap-1.5 flex-nowrap">
          <Text fz={12} c={TV.textSecondary} truncate style={{ flex: 1, minWidth: 0 }}>{contact.email}</Text>
          {contact.emailStatus !== "valid" && contact.emailStatus !== "missing" && (
            <Tooltip label={EMAIL_STATUS_BADGE[contact.emailStatus].label} withArrow>
              <Badge size="xs" color={EMAIL_STATUS_BADGE[contact.emailStatus].color} variant="light" style={{ flexShrink: 0 }}>
                {EMAIL_STATUS_BADGE[contact.emailStatus].label}
              </Badge>
            </Tooltip>
          )}
        </div>
      );
    case "phone":
      return (
        <div className="flex items-center gap-1.5 flex-nowrap">
          <Text fz={12} c={TV.textSecondary}>{contact.phone}</Text>
          {contact.phoneStatus !== "valid" && contact.phoneStatus !== "missing" && (
            <Tooltip label={PHONE_STATUS_BADGE[contact.phoneStatus].label} withArrow>
              <Badge size="xs" color={PHONE_STATUS_BADGE[contact.phoneStatus].color} variant="light" style={{ flexShrink: 0 }}>
                {PHONE_STATUS_BADGE[contact.phoneStatus].label}
              </Badge>
            </Tooltip>
          )}
        </div>
      );
    case "remoteId":
      return <Text fz={12} c={TV.textSecondary}>{contact.remoteId}</Text>;
    case "company":
      return <Text fz={12} c={TV.textBrand} truncate>{contact.company !== "—" ? contact.company : ""}</Text>;
    case "assignee":
      return <Text fz={12} c={TV.textSecondary} truncate>{contact.assignee}</Text>;
    case "tags":
      return (
        <div className="flex items-center gap-1">
          {contact.tags.slice(0, 2).map(t => <Badge key={t} color="tvPurple" size="xs">{t}</Badge>)}
          {contact.tags.length > 2 && <Text fz={10} c={TV.textSecondary}>+{contact.tags.length - 2}</Text>}
        </div>
      );
    case "starRating":
      if (contact.starRating === 0) return <Text fz={12} c={TV.textSecondary}>Unrated</Text>;
      return (
        <div className="flex items-center gap-px">
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={13} fill={i < contact.starRating ? TV.star : "none"}
              style={{ color: i < contact.starRating ? TV.star : TV.borderLight }} />
          ))}
        </div>
      );
    case "ctScore":
      return (
        <div className="flex items-center gap-1 flex-nowrap">
          <Box w={40} h={6} bg={TV.borderLight} style={{ borderRadius: 3, overflow: "hidden" }}>
            <Box h={6} w={`${contact.ctScore}%`} bg={contact.ctScore >= 70 ? TV.statusSuccess : contact.ctScore >= 40 ? TV.statusWarning : TV.statusError} style={{ borderRadius: 3 }} />
          </Box>
          <Text fz={11} c={TV.textSecondary}>{contact.ctScore}</Text>
        </div>
      );
    case "videoScore":
      return (
        <div className="flex items-center gap-1 flex-nowrap">
          <Box w={40} h={6} bg={TV.borderLight} style={{ borderRadius: 3, overflow: "hidden" }}>
            <Box h={6} w={`${contact.videoScore}%`} bg={contact.videoScore >= 70 ? TV.statusSuccess : contact.videoScore >= 40 ? TV.statusWarning : TV.statusError} style={{ borderRadius: 3 }} />
          </Box>
          <Text fz={11} c={TV.textSecondary}>{contact.videoScore}</Text>
        </div>
      );
    case "emailStatus": {
      const st = EMAIL_STATUS_BADGE[contact.emailStatus];
      return <Badge size="sm" color={st.color} variant="light">{st.label}</Badge>;
    }
    case "phoneStatus": {
      const st = PHONE_STATUS_BADGE[contact.phoneStatus];
      return <Badge size="sm" color={st.color} variant="light">{st.label}</Badge>;
    }
    case "lastCampaign":
      return <Text fz={12} c={TV.textSecondary} truncate>{contact.lastCampaign}</Text>;
    case "dateAdded":
      return <Text fz={12} c={TV.textSecondary}>{contact.dateAdded}</Text>;
    case "affiliation":
      return <Text fz={12} c={TV.textSecondary}>{contact.affiliation}</Text>;
    case "title":
      return <Text fz={12} c={TV.textSecondary} truncate>{contact.title || "—"}</Text>;
    case "givingLevel":
      return contact.givingLevel
        ? <Badge size="sm" variant="light" color="tvPurple">{contact.givingLevel}</Badge>
        : <Text fz={12} c={TV.textSecondary}>—</Text>;
    case "donorStatus": {
      const dsLabels: Record<string, string> = { active: "Active", lapsed: "Lapsed", "first-time": "First-Time", prospective: "Prospective", major: "Major" };
      const dsColors: Record<string, string> = { active: "green", lapsed: "orange", "first-time": "blue", prospective: "gray", major: "tvPurple" };
      return <Badge size="sm" variant="light" color={dsColors[contact.donorStatus] ?? "gray"}>{dsLabels[contact.donorStatus] ?? contact.donorStatus}</Badge>;
    }
    case "classYear":
      return <Text fz={12} c={TV.textPrimary} fw={500}>{contact.classYear || "—"}</Text>;
    case "askAmount":
      return contact.askAmount != null
        ? <Text fz={12} c={TV.textPrimary} fw={500}>${contact.askAmount.toLocaleString()}</Text>
        : <Text fz={12} c={TV.textSecondary}>—</Text>;
    case "askDonationDesignation":
      return contact.askDonationDesignation
        ? <Badge size="sm" variant="light" color="tvPurple">{contact.askDonationDesignation}</Badge>
        : <Text fz={12} c={TV.textSecondary}>—</Text>;
    case "yearsGiving":
      return contact.yearsGiving != null
        ? <Text fz={12} c={TV.textPrimary}>{contact.yearsGiving} yr{contact.yearsGiving !== 1 ? "s" : ""}</Text>
        : <Text fz={12} c={TV.textSecondary}>—</Text>;
    case "birthday":
      return <Text fz={12} c={TV.textSecondary}>{contact.birthday || "—"}</Text>;
    case "anniversary":
      return <Text fz={12} c={TV.textSecondary}>{contact.anniversary || "—"}</Text>;
    case "city":
      return <Text fz={12} c={TV.textSecondary}>{contact.city || "—"}</Text>;
    case "state":
      return <Text fz={12} c={TV.textSecondary}>{contact.state || "—"}</Text>;
    default: {
      // Custom fields (cf_* keys)
      if (col.startsWith("cf_") && contact.customFields) {
        const cfLabel = ALL_COLUMNS.find(c => c.key === col)?.label ?? col;
        const val = contact.customFields[cfLabel];
        return <Text fz={12} c={TV.textSecondary}>{val || "—"}</Text>;
      }
      return <Text fz={12} c={TV.textSecondary}>—</Text>;
    }
  }
}

// ── Main Page ────────────────────────────────────────────────────────────────

export function Contacts() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [contacts, setContacts] = useState<Contact[]>(INIT_CONTACTS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<number[]>([]);

  const [showEditColumns, setShowEditColumns] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAddToList, setShowAddToList] = useState(false);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);

  // Column customization
  const [activeColumns, setActiveColumns] = useState<string[]>(DEFAULT_ACTIVE_COLUMNS);

  // Filters
  const DEFAULT_FILTER_KEYS = CONTACT_FILTERS.filter(f => f.essential).map(f => f.key);
  const [activeFilterKeys, setActiveFilterKeys] = useState<string[]>(DEFAULT_FILTER_KEYS);
  const [filterValues, setFilterValues] = useState<FilterValues>({});

  // Sort
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else if (sortDir === "desc") { setSortKey(null); setSortDir(null); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const filtered = useMemo(() => {
    let result = contacts.filter(c =>
      `${c.first} ${c.last} ${c.email} ${c.remoteId} ${c.company}`.toLowerCase().includes(search.toLowerCase())
    );

    // Apply active filters
    for (const [key, vals] of Object.entries(filterValues)) {
      if (!vals || vals.length === 0) continue;
      switch (key) {
        case "starRating":
          result = result.filter(c =>
            vals.includes(String(c.starRating))
          );
          break;
        case "hasValidEmail":
          result = result.filter(c =>
            vals.includes("yes") ? c.emailStatus === "valid" : c.emailStatus !== "valid"
          );
          break;
        case "hasValidPhone":
          result = result.filter(c =>
            vals.includes("yes") ? c.phoneStatus === "valid" : c.phoneStatus !== "valid"
          );
          break;
        case "hasUnsubscribedEmail":
          result = result.filter(c =>
            vals.includes("yes") ? c.emailStatus === "unsubscribed" : c.emailStatus !== "unsubscribed"
          );
          break;
        case "hasUnsubscribedPhone":
          result = result.filter(c =>
            vals.includes("yes") ? c.phoneStatus === "unsubscribed" : c.phoneStatus !== "unsubscribed"
          );
          break;
        case "hasSpamEmail":
          result = result.filter(c =>
            vals.includes("yes") ? c.emailStatus === "spam" : c.emailStatus !== "spam"
          );
          break;
        case "hasBouncedEmail":
          result = result.filter(c =>
            vals.includes("yes") ? c.emailStatus === "bounced" : c.emailStatus !== "bounced"
          );
          break;
        case "hasBouncedPhone":
          result = result.filter(c =>
            vals.includes("yes") ? c.phoneStatus === "bounced" : c.phoneStatus !== "bounced"
          );
          break;
        case "customField":
          result = result.filter(c => vals.every(v => {
            const fieldName = v.replace("has:", "");
            return c.customFields && fieldName in c.customFields;
          }));
          break;
        case "dateCreated": {
          result = result.filter(c => {
            const d = new Date(c.dateAdded);
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
        const aVal = getSortValue(a, sortKey);
        const bVal = getSortValue(b, sortKey);
        const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
    }
    return result;
  }, [contacts, search, sortKey, sortDir, filterValues]);

  // For demo: show paginated slice of the filtered data
  const paginatedContacts = filtered.slice(0, rowsPerPage);

  const handleAdd = (data: Partial<Contact>) => {
    const colors = ["#7c45b0", "#0e7490", "#15803d", "#b45309", "#dc2626"];
    const newC: Contact = {
      id: Date.now(), first: data.first!, last: data.last!, email: data.email!,
      phone: data.phone ?? "—", tags: data.tags ? (data.tags as string).split(",").map(t => t.trim()).filter(Boolean) : [],
      lastCampaign: "—", dateAdded: "Feb 27, 2026",
      avatar: (data.first ?? "?")[0],
      color: colors[Math.floor(Math.random() * colors.length)],
      affiliation: "—", remoteId: "—", company: "—", assignee: "—",
      starRating: 0,
      emailStatus: "missing",
      phoneStatus: "missing",
      city: "—", state: "—", title: "—", givingLevel: "",
      customFields: {},
    };
    setContacts(c => [newC, ...c]);
    show(`${newC.first} ${newC.last} added!`, "success");
  };

  const handleDelete = (id: number) => {
    setContacts(c => c.filter(x => x.id !== id));
  };

  const toggleSelect = (id: number) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const allOnPageSelected = paginatedContacts.length > 0 && paginatedContacts.every(c => selected.includes(c.id));
  const toggleAll = () => {
    if (allOnPageSelected) setSelected(s => s.filter(id => !paginatedContacts.some(c => c.id === id)));
    else setSelected(s => [...new Set([...s, ...paginatedContacts.map(c => c.id)])]);
  };

  return (
    <Box p={{ base: "sm", sm: "xl" }} pt={0}>
      {/* Sticky header zone */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 sm:pt-6 -mx-3 sm:-mx-6 px-3 sm:px-6 pb-3">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap mb-4">
        <div className="flex items-center gap-3">
          <div>
            <Title order={1} fz={{ base: 22, sm: 26 }}>All Constituents</Title>
            <Text fz={13} c={TV.textSecondary}>{TOTAL_COUNT.toLocaleString()} Constituents</Text>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Menu shadow="md" width={240} position="bottom-end">
            <Menu.Target>
              <Tooltip label="Add Constituents" withArrow>
                <ActionIcon variant="filled" color="tvPurple" size="lg" radius="xl">
                  <UserPlus size={16} />
                </ActionIcon>
              </Tooltip>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item fz={13} leftSection={<UserPlus size={14} />} onClick={() => navigate("/contacts/add?method=manual")}>
                Add Single Constituent
              </Menu.Item>
              <Menu.Divider />
              <Menu.Label fz={10} tt="uppercase" lts="0.05em">Bulk Import</Menu.Label>
              <Menu.Item fz={13} leftSection={<Upload size={14} />} onClick={() => navigate("/contacts/add?method=csv")}>
                Import from CSV
              </Menu.Item>
              <Menu.Item fz={13} leftSection={<Database size={14} />} onClick={() => navigate("/contacts/add?method=renxt")}>
                Import from RE NXT
              </Menu.Item>
              <Menu.Item fz={13} leftSection={<Database size={14} />} onClick={() => navigate("/contacts/add?method=salesforce")}>
                Import from Salesforce
              </Menu.Item>
              <Menu.Item fz={13} leftSection={<Database size={14} />} onClick={() => navigate("/contacts/add?method=bloomerang")}>
                Import from Bloomerang
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <Tooltip label="Export All" withArrow>
            <ActionIcon variant="default" size="lg" radius="xl" onClick={() => setShowExport(true)}
              styles={{ root: { borderColor: TV.borderLight } }}>
              <Download size={16} style={{ color: TV.textLabel }} />
            </ActionIcon>
          </Tooltip>
          <ColumnsButton onClick={() => setShowEditColumns(true)} />
        </div>
      </div>

      {/* Toolbar: Search */}
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <TextInput
          leftSection={<Search size={14} style={{ color: TV.textSecondary }} />}
          placeholder="Search all constituents…"
          value={search} onChange={e => { setSearch(e.currentTarget.value); setPage(1); }}
          radius="xl" style={{ flex: 1, maxWidth: 420 }}
          styles={{ input: { borderColor: TV.borderLight, backgroundColor: '#fff', color: TV.textPrimary } }}
        />
        <ActionIcon variant="default" radius="xl" size="lg" hiddenFrom="sm" onClick={() => navigate("/contacts/add?method=manual")}>
          <UserPlus size={13} />
        </ActionIcon>
      </div>

      {/* Filter Bar */}
      <div className="mb-0">
        <FilterBar
          filters={CONTACT_FILTERS}
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

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Button size="compact-xs" variant="default" rightSection={<ChevronDown size={10} />}>
                  Add to…
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item fz={13} leftSection={<Send size={13} />}
                  onClick={() => { show(`${selected.length} constituents added to campaign`, "info"); setSelected([]); }}>
                  Campaign
                </Menu.Item>
                <Menu.Item fz={13} leftSection={<List size={13} />}
                  onClick={() => setShowAddToList(true)}>
                  List
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            <Button size="compact-xs" variant="default" leftSection={<Download size={11} />}
              onClick={() => setShowExport(true)}>
              Export
            </Button>
            <Button size="compact-xs" variant="outline" color="red" leftSection={<Trash2 size={11} />}
              onClick={() => { setContacts(c => c.filter(x => !selected.includes(x.id))); show(`${selected.length} deleted`); setSelected([]); }}>
              Delete
            </Button>
            <ActionIcon variant="subtle" color="gray" size="xs" ml="auto" onClick={() => setSelected([])} aria-label="Clear selection"><X size={13} aria-hidden="true" /></ActionIcon>
          </div>
        </Box>
      )}

      {/* Table */}
      <div className="rounded-xl border" style={{ overflow: "hidden", borderColor: TV.borderLight }}>
        {filtered.length === 0 ? (
          <Stack align="center" py="xl" gap="sm">
            <Box w={48} h={48} bg={TV.brandTint} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Plus size={20} style={{ color: TV.textBrand }} />
            </Box>
            <Text fz={15} fw={700} c={TV.textPrimary}>No constituents found</Text>
            <Text fz={13} c={TV.textSecondary}>Try a different search or add a new constituent.</Text>
            <Button color="tvPurple" onClick={() => navigate("/contacts/add?method=manual")}>Add Constituent</Button>
          </Stack>
        ) : (
          <>
            {/* ── Desktop table ── */}
            <Box visibleFrom="md" className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              <Table verticalSpacing={0} horizontalSpacing={0} highlightOnHover
                styles={{ table: { borderCollapse: "collapse", minWidth: Math.max(1000, activeColumns.length * 170 + 100) }, td: { whiteSpace: "nowrap" } }}
              >
                <Table.Thead className="sticky top-0 z-20" style={{ backgroundColor: "#fff" }}>
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
                      const tooltip = colKey === "ctScore"
                        ? "Click-through engagement score (0–100) based on link clicks across campaigns"
                        : colKey === "videoScore"
                        ? "Video engagement score (0–100) based on ThankView video watch rates"
                        : null;
                      return (
                        <Table.Th key={colKey} style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                          {tooltip ? (
                            <Tooltip label={tooltip} withArrow multiline w={240} fz={11}>
                              <span>
                                <SortableHeader label={colDef.label} sortKey={colKey}
                                  currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                              </span>
                            </Tooltip>
                          ) : (
                            <SortableHeader label={colDef.label} sortKey={colKey}
                              currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                          )}
                        </Table.Th>
                      );
                    })}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedContacts.map(c => (
                    <Table.Tr key={c.id} onClick={() => navigate(`/contacts/${c.id}`)}
                      style={{ cursor: "pointer", borderBottom: `1px solid ${TV.borderDivider}` }}>
                      <Table.Td style={{ padding: "12px 0 12px 16px", verticalAlign: "middle" }}
                        onClick={e => { e.stopPropagation(); toggleSelect(c.id); }}>
                        <Checkbox checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} color="tvPurple" size="xs" />
                      </Table.Td>
                      {activeColumns.map(colKey => (
                        <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <CellValue col={colKey} contact={c} />
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>

              {/* Pagination */}
              <TablePagination page={page} rowsPerPage={rowsPerPage} totalRows={TOTAL_COUNT}
                onPageChange={setPage} onRowsPerPageChange={setRowsPerPage} />
            </Box>

            {/* ── Mobile cards ── */}
            <Box hiddenFrom="md">
              {paginatedContacts.map(c => (
                <Box key={c.id} onClick={() => navigate(`/contacts/${c.id}`)} px="sm" py="sm"
                  style={{ borderBottom: `1px solid ${TV.borderDivider}`, cursor: "pointer" }}
                  className="hover:bg-tv-surface-muted transition-colors">
                  <div className="flex items-center gap-3 flex-nowrap">
                    <Avatar size="md" radius="xl"
                      styles={{ placeholder: { backgroundColor: c.color, color: "white" } }}>{c.avatar}</Avatar>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text fz={14} fw={600} c={TV.textBrand} truncate>{c.first} {c.last}</Text>
                      <Text fz={12} c={TV.textSecondary} truncate>{c.affiliation}</Text>
                      <Text fz={11} c={TV.textSecondary} truncate>{c.email}</Text>
                    </div>
                    <ChevronRight size={14} style={{ color: TV.borderStrong, flexShrink: 0 }} />
                  </div>
                </Box>
              ))}
            </Box>
          </>
        )}
      </div>

      {/* Modals */}
      {showEditColumns && (
        <EditColumnsModal columns={ALL_COLUMNS} active={activeColumns} onClose={() => setShowEditColumns(false)}
          onSave={cols => { setActiveColumns(cols); show("Columns updated!", "success"); }} />
      )}
      {showExport && (
        <ExportModal
          selectedCount={selected.length}
          filteredCount={filtered.length}
          totalCount={TOTAL_COUNT}
          onClose={() => setShowExport(false)}
          onExport={(scope, fieldCount) => {
            const count = scope === "selected" ? selected.length : scope === "filtered" ? filtered.length : TOTAL_COUNT;
            show(`Exported ${count.toLocaleString()} constituents (${fieldCount} fields)`, "success");
            if (scope === "selected") setSelected([]);
          }}
        />
      )}
      {showAddToList && (
        <AddToListModal
          selectedCount={selected.length}
          onClose={() => setShowAddToList(false)}
          onAdd={(listName, isNew) => {
            show(`${selected.length} constituent${selected.length !== 1 ? "s" : ""} added to "${listName}"${isNew ? " (new list)" : ""}`, "success");
            setSelected([]);
          }}
        />
      )}
      {deleteContact && (
        <DeleteModal title={`Delete "${deleteContact.first} ${deleteContact.last}"?`}
          onConfirm={() => { handleDelete(deleteContact.id); setDeleteContact(null); show("Constituent deleted"); }}
          onCancel={() => setDeleteContact(null)} />
      )}
    </Box>
  );
}