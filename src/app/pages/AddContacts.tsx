import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Upload, Database, ChevronLeft, ChevronRight, X,
  FileSpreadsheet, CheckCircle2, AlertTriangle, CircleCheckBig,
  Plus, RefreshCw, Replace, Search, ArrowRight, Info, Link2,
  Download, Trash2, CloudDownload,
  Settings, Check, Pencil,
  Users, ListFilter, Calendar,
} from "lucide-react";
import {
  Button, Badge, Modal, ActionIcon, Title, Text,
  Stack, Box, TextInput, Radio, Checkbox, Tooltip,
  Avatar, Table, UnstyledButton, SimpleGrid, Stepper,
  Progress, Textarea, Switch,
  ThemeIcon, Divider, Loader, Alert,
} from "@mantine/core";
import { useToast } from "../contexts/ToastContext";
import { FilterBar, FilterValues, DATE_CREATED_FILTER } from "../components/FilterBar";
import type { FilterDef } from "../components/FilterBar";
import { TagSelect, CONTACT_PRESET_TAGS } from "../components/TagSelect";
import { TV } from "../theme";
import { TablePagination } from "../components/TablePagination";
import { SortableHeader, nextSort, sortRows } from "../components/SortableHeader";
import type { SortState } from "../components/SortableHeader";
import { EditColumnsModal, ColumnsButton } from "../components/ColumnCustomizer";
import type { ColumnDef } from "../components/ColumnCustomizer";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES & CONSTANTS
// ═══════════════════════════════════════════════���═══════════════════════════════

type AddMethod = "csv" | "manual" | "renxt" | "salesforce" | "bloomerang" | null;

// ── CSV ──

type CsvStep = "upload" | "mode" | "mapping" | "validating" | "review" | "complete";
type ImportMode = "add" | "update" | "replace";

interface CsvColumn {
  header: string;
  sample: string[];
  mappedTo: string;
}

interface ValidationError {
  row: number;
  column: string;
  value: string;
  error: string;
  severity: "error" | "warning";
}

const TV_FIELDS = [
  { value: "first_name", label: "First Name", group: "Core" },
  { value: "last_name", label: "Last Name", group: "Core" },
  { value: "email", label: "Email Address", group: "Core" },
  { value: "phone", label: "Phone Number", group: "Core" },
  { value: "remote_id", label: "Remote (Donor) ID", group: "Core" },
  { value: "company", label: "Company / Organization", group: "Profile" },
  { value: "affiliation", label: "Affiliation", group: "Profile" },
  { value: "tags", label: "Tags", group: "Profile" },
  { value: "assignee", label: "Assignee", group: "Profile" },
  { value: "star_rating", label: "Star Rating", group: "Engagement" },
  { value: "address_line1", label: "Address Line 1", group: "Address" },
  { value: "address_line2", label: "Address Line 2", group: "Address" },
  { value: "city", label: "City", group: "Address" },
  { value: "state", label: "State", group: "Address" },
  { value: "zip", label: "Zip Code", group: "Address" },
  { value: "skip", label: "— Skip this column —", group: "Other" },
];

// Mantine v8 grouped data format helper
function toGroupedData(fields: typeof TV_FIELDS) {
  const groups: Record<string, { value: string; label: string }[]> = {};
  for (const f of fields) {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push({ value: f.value, label: f.label });
  }
  return Object.entries(groups).map(([group, items]) => ({ group, items }));
}

const TV_FIELDS_GROUPED = toGroupedData(TV_FIELDS);

const IMPORT_MODES: { value: ImportMode; label: string; desc: string; icon: typeof Upload; danger?: boolean }[] = [
  { value: "add", label: "Add New Constituents", desc: "Import new constituents from your CSV. Duplicate rows (matched by email) will be skipped.", icon: Plus },
  { value: "update", label: "Edit / Update Constituents", desc: "Match CSV rows to existing constituents and overwrite their fields with updated values. Rows with no match are added as new constituents.", icon: RefreshCw },
  { value: "replace", label: "Full Replace (Delete & Reimport)", desc: "Replace your entire constituent database with this CSV. Any constituents not present in the file will be permanently deleted from your portal.", icon: Replace, danger: true },
];

// Simulated parsed CSV data
const MOCK_CSV_COLUMNS: CsvColumn[] = [
  { header: "First Name", sample: ["Shaylee", "Jarvis", "Erika"], mappedTo: "first_name" },
  { header: "Last Name", sample: ["O'Keefe", "Bogan", "Hayes"], mappedTo: "last_name" },
  { header: "Email", sample: ["julio201686@example.name", "dyouch5@yahoo.com", "—"], mappedTo: "email" },
  { header: "Phone", sample: ["(617) 555-0182", "(617) 555-0244", "(617) 555-0371"], mappedTo: "phone" },
  { header: "Donor ID", sample: ["D-10482", "D-29371", "12345ABCD"], mappedTo: "remote_id" },
  { header: "Organization", sample: ["Bentall Kennedy", "Alpha USA", "Test company 1"], mappedTo: "company" },
  { header: "Category", sample: ["Major Donor, Alumni", "Alumni", "Alumni"], mappedTo: "tags" },
  { header: "Class Year", sample: ["2002", "1989", ""], mappedTo: "affiliation" },
];

const MOCK_VALIDATION_ERRORS: ValidationError[] = [
  { row: 14, column: "Email", value: "not-an-email", error: "Invalid email format", severity: "error" },
  { row: 31, column: "Phone", value: "(617) 555-ABCD", error: "Invalid phone format — contains letters", severity: "error" },
  { row: 47, column: "Email", value: "", error: "Missing email address — row will be added without email", severity: "warning" },
  { row: 89, column: "Donor ID", value: "D-10482", error: "Duplicate Donor ID — matches existing constituent Shaylee O'Keefe", severity: "warning" },
  { row: 102, column: "Phone", value: "+44 20 7946 0958", error: "International format detected — may not receive SMS campaigns", severity: "warning" },
];

// ── Manual ──

interface ManualFormData {
  first: string;
  last: string;
  email: string;
  phone: string;
  company: string;
  affiliation: string;
  remoteId: string;
  assignee: string;
  title: string;
  givingLevel: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
}

const EMPTY_FORM: ManualFormData = {
  first: "", last: "", email: "", phone: "",
  company: "", affiliation: "", remoteId: "", assignee: "",
  title: "", givingLevel: "",
  addressLine1: "", addressLine2: "", city: "", state: "", zip: "",
  notes: "",
};

// ── Manual field definitions for the field picker ──

type ManualFieldKey = keyof ManualFormData | "tags";

interface ManualFieldDef {
  key: ManualFieldKey;
  label: string;
  group: string;
  placeholder: string;
  required?: boolean;
  type?: "text" | "textarea" | "select";
  selectOptions?: string[];
}

const MANUAL_FIELDS: ManualFieldDef[] = [
  { key: "remoteId", label: "Donor ID", group: "Core", placeholder: "e.g. D-10482", required: true },
  { key: "first", label: "First Name", group: "Core", placeholder: "e.g. Margaret" },
  { key: "last", label: "Last Name", group: "Core", placeholder: "e.g. Wellington" },
  { key: "email", label: "Email Address", group: "Core", placeholder: "e.g. m.wellington@alumni.edu" },
  { key: "phone", label: "Phone Number", group: "Core", placeholder: "e.g. (617) 555-0182" },
  { key: "company", label: "Company / Organization", group: "Profile", placeholder: "e.g. Hartwell University" },
  { key: "affiliation", label: "Affiliation", group: "Profile", placeholder: "e.g. Class of 2002" },
  { key: "title", label: "Title / Role", group: "Profile", placeholder: "e.g. Director of Development" },
  { key: "assignee", label: "Assignee", group: "Profile", placeholder: "e.g. Kelley Molt" },
  { key: "givingLevel", label: "Giving Level", group: "Profile", placeholder: "Select…", type: "select", selectOptions: ["Major Donor", "Mid-Level", "Annual Fund", "Prospect", "Lapsed"] },
  { key: "tags", label: "Tags", group: "Profile", placeholder: "Search or add tags…" },
  { key: "addressLine1", label: "Address Line 1", group: "Address", placeholder: "123 Main St" },
  { key: "addressLine2", label: "Address Line 2", group: "Address", placeholder: "Suite 400" },
  { key: "city", label: "City", group: "Address", placeholder: "Boston" },
  { key: "state", label: "State", group: "Address", placeholder: "MA" },
  { key: "zip", label: "Zip Code", group: "Address", placeholder: "02101" },
  { key: "notes", label: "Notes", group: "Other", placeholder: "Internal notes about this constituent…", type: "textarea" },
];

const DEFAULT_ENABLED_FIELDS: ManualFieldKey[] = ["remoteId", "first", "last", "email"];

interface StagedContact {
  _id: number;
  form: ManualFormData;
  tags: string[];
}

// ── RE NXT ──

type RenxtStep = "connect" | "query" | "mapping" | "preview" | "importing" | "complete";

const RENXT_FIELDS = [
  { value: "constituent_id", label: "Constituent ID" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "preferred_name", label: "Preferred Name" },
  { value: "email_address", label: "Primary Email" },
  { value: "phone_number", label: "Primary Phone" },
  { value: "organization_name", label: "Organization Name" },
  { value: "lookup_id", label: "Lookup ID" },
  { value: "class_of", label: "Class Of" },
  { value: "constituent_type", label: "Constituent Type" },
  { value: "status", label: "Status" },
  { value: "date_added", label: "Date Added" },
  { value: "last_gift_amount", label: "Last Gift Amount" },
  { value: "last_gift_date", label: "Last Gift Date" },
  { value: "total_giving", label: "Total Giving" },
  { value: "address_line1", label: "Address Line 1" },
  { value: "address_city", label: "City" },
  { value: "address_state", label: "State" },
  { value: "address_zip", label: "Zip Code" },
];

const DEFAULT_RENXT_MAPPING = [
  { renxt: "first_name", tv: "first_name" },
  { renxt: "last_name", tv: "last_name" },
  { renxt: "email_address", tv: "email" },
  { renxt: "phone_number", tv: "phone" },
  { renxt: "constituent_id", tv: "remote_id" },
  { renxt: "organization_name", tv: "company" },
  { renxt: "class_of", tv: "affiliation" },
];

const MOCK_RENXT_RESULTS = [
  { id: "C-10201", name: "Margaret Wellington", email: "m.wellington@alumni.hartwell.edu", classOf: "1998", type: "Individual", totalGiving: "$24,500" },
  { id: "C-10455", name: "Robert Chen", email: "robert.chen@gmail.com", classOf: "2005", type: "Individual", totalGiving: "$8,200" },
  { id: "C-11230", name: "Hartwell Foundation", email: "grants@hartwellfdn.org", classOf: "—", type: "Organization", totalGiving: "$150,000" },
  { id: "C-10877", name: "Sandra Okafor", email: "s.okafor@outlook.com", classOf: "2012", type: "Individual", totalGiving: "$3,400" },
  { id: "C-10932", name: "David Morales", email: "dmorales@hartwell.edu", classOf: "1985", type: "Individual", totalGiving: "$67,800" },
];

// ── Column definitions for search results ─────────────────────────────────────

const AC_COLUMNS: ColumnDef[] = [
  { key: "constituent", label: "Constituent",   group: "Summary", required: true },
  { key: "email",       label: "Email",          group: "Summary" },
  { key: "classOf",     label: "Class",           group: "Summary" },
  { key: "type",        label: "Type",            group: "Summary" },
  { key: "totalGiving", label: "Total Giving",    group: "Summary" },
];

const DEFAULT_AC_COLUMNS = ["constituent", "email", "classOf", "type", "totalGiving"];

// ═══════════════════════════════════════════════════════════════════════════════
// METHOD PICKER
// ═══════════════════════════════════════════════════════════════════════════════

function MethodCard({ icon: Icon, title, desc, badge, disabled, onClick }: {
  icon: typeof Upload;
  title: string;
  desc: string;
  badge?: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      onClick={onClick}
      disabled={disabled}
      w="100%"
      p="lg"
      style={{
        border: `2px solid ${disabled ? TV.borderLight : TV.border}`,
        borderRadius: 20,
        backgroundColor: disabled ? "#fafbfc" : undefined,
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.2s",
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      className={disabled ? "" : "hover:border-tv-brand hover:bg-tv-brand-tint"}
    >
      <div className="flex items-start gap-4 flex-nowrap">
        <ThemeIcon size={52} radius={14} variant="light" color="tvPurple"
          style={disabled ? { backgroundColor: "#f1f5f9", color: TV.textSecondary } : undefined}>
          <Icon size={24} />
        </ThemeIcon>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 4 }}>
            <Text fz={16} fw={700} c={disabled ? TV.textSecondary : TV.textPrimary}>{title}</Text>
            {badge && (
              <Badge size="xs" variant="light" color={disabled ? "gray" : "cyan"}>{badge}</Badge>
            )}
          </div>
          <Text fz={13} c={TV.textSecondary}>{desc}</Text>
        </div>
        <ArrowRight size={18} style={{ color: disabled ? TV.borderLight : TV.textBrand, flexShrink: 0, marginTop: 4 }} />
      </div>
    </UnstyledButton>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CSV UPLOAD FLOW
// ═══════════════════════════════════════════════════════════════════════════════

function CsvFlow({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<CsvStep>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [rowCount, setRowCount] = useState(0);
  const [mode, setMode] = useState<ImportMode>("add");
  const [matchKey, setMatchKey] = useState("email");
  const [columns, setColumns] = useState<CsvColumn[]>([]);
  const [confirmText, setConfirmText] = useState("");
  const [validationProgress, setValidationProgress] = useState(0);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [skipErrors, setSkipErrors] = useState(true);
  const [showAllErrors, setShowAllErrors] = useState(false);

  // Simulated stats
  const stats = useMemo(() => {
    if (mode === "add") return { valid: 142, flagged: errors.filter(e => e.severity === "error").length, matched: 0, newRows: 142, deleted: 0 };
    if (mode === "update") return { valid: 142, flagged: errors.filter(e => e.severity === "error").length, matched: 87, newRows: 55, deleted: 0 };
    return { valid: 142, flagged: errors.filter(e => e.severity === "error").length, matched: 87, newRows: 55, deleted: 400234 };
  }, [mode, errors]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, []);

  const processFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      show("Please upload a .csv file", "error");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      show("File exceeds 10 MB limit", "error");
      return;
    }
    setFileName(file.name);
    setFileSize(file.size < 1024 ? `${file.size} B` : file.size < 1048576 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1048576).toFixed(1)} MB`);
    setRowCount(144);
    setColumns(MOCK_CSV_COLUMNS);
    show(`"${file.name}" loaded — 144 rows detected`, "success");
    setStep("mode");
  };

  const handleMapping = (idx: number, value: string) => {
    setColumns(cols => cols.map((c, i) => i === idx ? { ...c, mappedTo: value } : c));
  };

  const startValidation = () => {
    setStep("validating");
    setValidationProgress(0);
    setErrors([]);
    // Simulate validation progress
    const interval = setInterval(() => {
      setValidationProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setErrors(MOCK_VALIDATION_ERRORS);
          setTimeout(() => setStep("review"), 300);
          return 100;
        }
        return p + Math.random() * 15 + 5;
      });
    }, 200);
  };

  const handleImport = () => {
    setStep("complete");
    if (mode === "add") {
      show(`${stats.valid - stats.flagged} constituents imported successfully!`, "success");
    } else if (mode === "update") {
      show(`${stats.matched} constituents updated, ${stats.newRows} new constituents added`, "success");
    } else {
      show("Full replace complete — database updated", "warning");
    }
  };

  const stepIndex = { upload: 0, mode: 1, mapping: 2, validating: 3, review: 3, complete: 4 }[step];
  const CSV_STEPS_BY_INDEX: CsvStep[] = ["upload", "mode", "mapping", "review", "complete"];
  const handleCsvStepClick = (index: number) => {
    if (index < (stepIndex ?? 0)) setStep(CSV_STEPS_BY_INDEX[index]);
  };

  const errorCount = errors.filter(e => e.severity === "error").length;
  const warningCount = errors.filter(e => e.severity === "warning").length;

  return (
    <Stack gap="lg">
      {/* Stepper */}
      <Stepper active={stepIndex} size="sm" color="tvPurple"
        onStepClick={handleCsvStepClick}
        styles={{
          step: { padding: 0, cursor: "pointer" },
          stepIcon: { borderWidth: 2 },
          separator: { marginLeft: 4, marginRight: 4 },
        }}>
        <Stepper.Step label="Upload" />
        <Stepper.Step label="Import Mode" />
        <Stepper.Step label="Map Fields" />
        <Stepper.Step label="Review" />
        <Stepper.Step label="Done" allowStepSelect={false} />
      </Stepper>

      {/* ── Upload ── */}
      {step === "upload" && (
        <Stack gap="md">
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
          <Box
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            p="xl"
            style={{
              border: `2px dashed ${dragOver ? TV.textBrand : TV.borderStrong}`,
              borderRadius: 20, cursor: "pointer", textAlign: "center",
              backgroundColor: dragOver ? TV.brandTint : undefined,
              transition: "all 0.2s",
              minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Stack align="center" gap="sm">
              <ThemeIcon size={56} radius="xl" variant="light" color="tvPurple">
                <Upload size={24} />
              </ThemeIcon>
              <Text fz={16} fw={700} c={TV.textPrimary}>Drop your CSV here, or click to browse</Text>
              <Text fz={13} c={TV.textSecondary}>Supports .csv files up to 10 MB</Text>
              <div className="flex items-center gap-1.5 mt-2.5">
                <Badge variant="outline" color="gray" size="sm">UTF-8 encoding</Badge>
                <Badge variant="outline" color="gray" size="sm">Comma or tab delimited</Badge>
              </div>
            </Stack>
          </Box>

          <Alert variant="light" color="blue" icon={<Info size={16} />} radius="md">
            <Text fz={12}>
              Your CSV should include column headers in the first row. We'll auto-detect common field names
              like "First Name", "Email", "Phone", etc. and suggest field mappings.
            </Text>
          </Alert>

          <div className="flex items-center gap-1.5">
            <Button variant="subtle" color="gray" leftSection={<Download size={14} />} size="xs"
              onClick={() => {
                const templateFields = TV_FIELDS.filter(f => f.value !== "skip");
                const headers = templateFields.map(f => f.label).join(",");
                const sampleRow = templateFields.map(f => {
                  const samples: Record<string, string> = {
                    first_name: "Jane", last_name: "Doe", email: "jane.doe@example.com",
                    phone: "(555) 123-4567", remote_id: "D-00001",
                    company: "Acme University", affiliation: "Class of 2015",
                    tags: "\"Alumni, Major Donor\"", assignee: "John Smith",
                    star_rating: "5", address_line1: "123 Main St",
                    address_line2: "Suite 400", city: "Boston", state: "MA", zip: "02101",
                  };
                  return samples[f.value] ?? "";
                }).join(",");
                const blob = new Blob([headers + "\n" + sampleRow + "\n"], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "thankview_contacts_template.csv";
                a.click();
                URL.revokeObjectURL(url);
              }}>
              Download sample CSV template
            </Button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <Button variant="default" leftSection={<ChevronLeft size={14} />} onClick={onBack}>
              Back
            </Button>
          </div>
        </Stack>
      )}

      {/* ── Import Mode ── */}
      {step === "mode" && (
        <Stack gap="md">
          {/* File badge */}
          <div className="rounded-lg p-3" style={{ border: `1px solid ${TV.borderLight}` }}>
            <div className="flex items-center gap-3">
              <ThemeIcon size={36} radius="md" variant="light" color="green">
                <FileSpreadsheet size={18} />
              </ThemeIcon>
              <div style={{ flex: 1 }}>
                <Text fz={14} fw={600} c={TV.textPrimary}>{fileName}</Text>
                <Text fz={12} c={TV.textSecondary}>{rowCount} rows · {fileSize} · {columns.length} columns detected</Text>
              </div>
              <ActionIcon variant="subtle" color="gray" onClick={() => { setStep("upload"); setFileName(""); }} aria-label="Clear file">
                <X size={14} aria-hidden="true" />
              </ActionIcon>
            </div>
          </div>

          <Text fz={14} fw={600} c={TV.textPrimary}>How would you like to import this data?</Text>

          <Radio.Group value={mode} onChange={v => setMode(v as ImportMode)}>
            <Stack gap="sm">
              {IMPORT_MODES.map(opt => {
                const Icon = opt.icon;
                const isActive = mode === opt.value;
                return (
                  <UnstyledButton key={opt.value} onClick={() => setMode(opt.value)}
                    py="sm" px="md"
                    style={{
                      border: `2px solid ${isActive ? (opt.danger ? TV.danger : TV.textBrand) : TV.borderLight}`,
                      borderRadius: 12,
                      backgroundColor: isActive ? (opt.danger ? TV.dangerBg : TV.brandTint) : undefined,
                      transition: "all 0.15s",
                    }}
                    className="hover:bg-tv-surface"
                  >
                    <div className="flex items-center gap-3 flex-nowrap">
                      <Radio value={opt.value} color={opt.danger ? "red" : "tvPurple"} size="sm" />
                      <ThemeIcon size={36} radius={10} variant="light"
                        color={opt.danger ? "red" : "tvPurple"}>
                        <Icon size={16} />
                      </ThemeIcon>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text fz={14} fw={600} c={opt.danger ? TV.danger : TV.textPrimary}>{opt.label}</Text>
                        <Text fz={12} c={TV.textSecondary}>{opt.desc}</Text>
                      </div>
                    </div>
                  </UnstyledButton>
                );
              })}
            </Stack>
          </Radio.Group>

          {mode === "update" && (
            <div className="rounded-lg p-4" style={{ backgroundColor: TV.brandTint, border: `1px solid ${TV.borderStrong}` }}>
              <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em" mb="xs">Match Existing Constituents By</Text>
              <Radio.Group value={matchKey} onChange={setMatchKey}>
                <div className="flex items-center gap-5">
                  <Radio value="email" label="Email Address" color="tvPurple" size="sm" styles={{ label: { fontSize: 13 } }} />
                  <Radio value="remoteId" label="Remote (Donor) ID" color="tvPurple" size="sm" styles={{ label: { fontSize: 13 } }} />
                </div>
              </Radio.Group>
              <Text fz={11} c={TV.textSecondary} mt="xs">
                Rows with a matching {matchKey === "email" ? "email address" : "Remote ID"} will update the existing constituent. Rows with no match will be added as new constituents.
              </Text>
            </div>
          )}

          {mode === "replace" && (
            <Alert variant="light" color="red" icon={<AlertTriangle size={16} />} radius="md"
              title="Destructive Operation">
              <Text fz={12}>
                Full Replace will <b>permanently delete</b> every constituent in your database that is <b>not</b> present
                in the uploaded CSV. This action cannot be undone. Make sure you have a recent backup before proceeding.
              </Text>
            </Alert>
          )}

          <div className="flex items-center justify-between mt-3">
            <Button variant="default" leftSection={<ChevronLeft size={14} />}
              onClick={() => setStep("upload")}>Back</Button>
            <Button color={mode === "replace" ? "red" : "tvPurple"}
              rightSection={<ChevronRight size={14} />}
              onClick={() => setStep("mapping")}>
              Continue to Field Mapping
            </Button>
          </div>
        </Stack>
      )}

      {/* ── Field Mapping ── */}
      {step === "mapping" && (
        <Stack gap="md">
          <div className="flex items-center gap-1.5">
            <Badge color={mode === "replace" ? "red" : mode === "update" ? "orange" : "tvPurple"} variant="light" size="lg">
              {IMPORT_MODES.find(o => o.value === mode)?.label}
            </Badge>
            {mode === "update" && (
              <Badge variant="outline" color="tvPurple" size="lg">Match: {matchKey === "email" ? "Email" : "Remote ID"}</Badge>
            )}
          </div>

          <Text fz={14} fw={600} c={TV.textPrimary}>Map your CSV columns to ThankView fields</Text>
          <Text fz={13} c={TV.textSecondary}>
            We've auto-detected mappings where possible. Review and adjust as needed.
          </Text>

          <div className="rounded-lg" style={{ border: `1px solid ${TV.borderLight}`, overflow: "hidden" }}>
            {/* Header */}
            <div className="flex items-center px-4 py-2.5" style={{ borderBottom: `1px solid ${TV.borderLight}`, backgroundColor: TV.surface }}>
              <Text fz={11} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em" style={{ flex: 1 }}>CSV Column</Text>
              <Box w={28} />
              <Text fz={11} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em" style={{ flex: 1 }}>ThankView Field</Text>
              <Text fz={11} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em" w={180}>Sample Data</Text>
            </div>

            {columns.map((col, idx) => (
              <div key={col.header} className="flex items-center flex-nowrap px-4 py-3 hover:bg-tv-surface-muted transition-colors"
                style={{ borderBottom: idx < columns.length - 1 ? `1px solid ${TV.borderDivider}` : undefined }}>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="light" color="gray" size="sm" radius="sm"
                      styles={{ label: { fontFamily: "monospace", fontSize: 11 } }}>
                      {col.header}
                    </Badge>
                  </div>
                </Box>
                <ArrowRight size={14} style={{ color: TV.borderStrong, flexShrink: 0 }} />
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Select
                    data={TV_FIELDS_GROUPED}
                    value={col.mappedTo}
                    onChange={v => handleMapping(idx, v ?? "skip")}
                    size="xs" radius="md"
                    aria-label={`Map column ${col.csvHeader} to field`}
                    comboboxProps={{ shadow: "md", width: 240 }}
                    styles={{ input: { borderColor: col.mappedTo === "skip" ? TV.warningBorder : TV.borderLight, fontSize: 12 } }}
                  />
                </Box>
                <Box w={180} style={{ flexShrink: 0 }}>
                  <Text fz={11} c={TV.textSecondary} truncate style={{ fontFamily: "monospace" }}>
                    {col.sample[0]}
                  </Text>
                  <Text fz={10} c={TV.textDecorative} truncate style={{ fontFamily: "monospace" }}>
                    {col.sample[1]}
                  </Text>
                </Box>
              </div>
            ))}
          </div>

          {/* Mapping warnings */}
          {!columns.some(c => c.mappedTo === "email") && (
            <Alert variant="light" color="orange" icon={<AlertTriangle size={14} />} radius="md">
              <Text fz={12}>No column is mapped to <b>Email Address</b>. Constituents without emails cannot receive email campaigns.</Text>
            </Alert>
          )}

          {!columns.some(c => c.mappedTo === "first_name") && (
            <Alert variant="light" color="orange" icon={<AlertTriangle size={14} />} radius="md">
              <Text fz={12}>No column is mapped to <b>First Name</b>. Personalization merge fields won't work without names.</Text>
            </Alert>
          )}

          <div className="flex items-center justify-between mt-3">
            <Button variant="default" leftSection={<ChevronLeft size={14} />}
              onClick={() => setStep("mode")}>Back</Button>
            <Button color={mode === "replace" ? "red" : "tvPurple"}
              rightSection={<ChevronRight size={14} />}
              onClick={startValidation}>
              Validate & Preview
            </Button>
          </div>
        </Stack>
      )}

      {/* ── Validating ── */}
      {step === "validating" && (
        <Stack align="center" gap="lg" py="xl">
          <Loader size="lg" color="tvPurple" />
          <div style={{ textAlign: "center" }}>
            <Text fz={16} fw={700} c={TV.textPrimary} mb={4}>Validating your data…</Text>
            <Text fz={13} c={TV.textSecondary}>Checking {rowCount} rows for errors and duplicates</Text>
          </div>
          <Box w="100%" maw={400}>
            <Progress value={Math.min(validationProgress, 100)} color="tvPurple" size="lg" radius="xl" animated />
            <Text fz={12} c={TV.textSecondary} ta="center" mt="xs">
              {Math.min(Math.round(validationProgress), 100)}%
            </Text>
          </Box>
        </Stack>
      )}

      {/* ── Review ── */}
      {step === "review" && (
        <Stack gap="md">
          {/* Summary cards */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm">
            <div className="rounded-lg p-4" style={{ backgroundColor: TV.successBg, border: `1px solid ${TV.successBorder}` }}>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={16} style={{ color: TV.success }} />
                <Text fz={12} fw={700} c={TV.success}>Valid Rows</Text>
              </div>
              <Text fz={24} fw={900} c={TV.success}>{stats.valid - stats.flagged}</Text>
              <Text fz={11} c={TV.textSecondary}>Ready to import</Text>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: TV.dangerBg, border: `1px solid ${TV.dangerBorder}` }}>
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} style={{ color: TV.danger }} />
                <Text fz={12} fw={700} c={TV.danger}>Errors</Text>
              </div>
              <Text fz={24} fw={900} c={TV.danger}>{errorCount}</Text>
              <Text fz={11} c={TV.textSecondary}>Rows with invalid data</Text>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
              <div className="flex items-center gap-2 mb-1">
                <Info size={16} style={{ color: TV.warning }} />
                <Text fz={12} fw={700} c={TV.warning}>Warnings</Text>
              </div>
              <Text fz={24} fw={900} c={TV.warning}>{warningCount}</Text>
              <Text fz={11} c={TV.textSecondary}>Potential issues</Text>
            </div>
          </SimpleGrid>

          {/* Mode-specific summary */}
          {mode === "update" && (
            <div className="rounded-lg p-4" style={{ backgroundColor: TV.surface, border: `1px solid ${TV.borderLight}` }}>
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw size={16} style={{ color: TV.textBrand }} />
                <Text fz={14} fw={700} c={TV.textPrimary}>Update Summary</Text>
              </div>
              <div className="flex items-center gap-6">
                <div>
                  <Text fz={20} fw={900} c={TV.textBrand}>{stats.matched}</Text>
                  <Text fz={11} c={TV.textSecondary}>Existing matches</Text>
                </div>
                <div>
                  <Text fz={20} fw={900} c={TV.success}>{stats.newRows}</Text>
                  <Text fz={11} c={TV.textSecondary}>New constituents</Text>
                </div>
              </div>
            </div>
          )}

          {mode === "replace" && (
            <Alert variant="light" color="red" icon={<AlertTriangle size={16} />} radius="md"
              title={`${stats.deleted.toLocaleString()} constituents will be permanently deleted`}>
              <Text fz={12} mb="md">
                These constituents are <b>not</b> present in the uploaded CSV and will be removed from your database.
                This action is <b>irreversible</b>.
              </Text>
              <TextInput
                label={<Text fz={12} c={TV.danger} fw={600}>Type <b>DELETE {stats.deleted.toLocaleString()}</b> to confirm</Text>}
                placeholder={`DELETE ${stats.deleted.toLocaleString()}`}
                value={confirmText} onChange={e => setConfirmText(e.currentTarget.value)}
                styles={{ input: { borderColor: TV.danger, fontFamily: "monospace" } }}
              />
            </Alert>
          )}

          {/* Error details */}
          {errors.length > 0 && (
            <div className="rounded-lg" style={{ border: `1px solid ${TV.borderLight}`, overflow: "hidden" }}>
              <div className="flex items-center justify-between px-4 py-3"
                style={{ borderBottom: `1px solid ${TV.borderLight}`, backgroundColor: TV.surface }}>
                <Text fz={13} fw={700} c={TV.textPrimary}>
                  Validation Issues ({errors.length})
                </Text>
                <div className="flex items-center gap-2">
                  <Switch label="Skip error rows" checked={skipErrors} onChange={e => setSkipErrors(e.currentTarget.checked)}
                    size="xs" color="tvPurple" styles={{ label: { fontSize: 12 } }} />
                </div>
              </div>
              {(showAllErrors ? errors : errors.slice(0, 3)).map((err, i) => (
                <div key={i} className="flex items-center gap-3 flex-nowrap px-4 py-3"
                  style={{ borderBottom: i < (showAllErrors ? errors.length : 3) - 1 ? `1px solid ${TV.borderDivider}` : undefined }}>
                  {err.severity === "error" ? (
                    <ThemeIcon size={24} radius="xl" variant="light" color="red"><X size={12} /></ThemeIcon>
                  ) : (
                    <ThemeIcon size={24} radius="xl" variant="light" color="orange"><AlertTriangle size={12} /></ThemeIcon>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex items-center gap-2">
                      <Text fz={12} fw={600} c={TV.textPrimary}>Row {err.row}</Text>
                      <Badge size="xs" variant="light" color="gray">{err.column}</Badge>
                      {err.value && (
                        <Text fz={11} c={TV.textSecondary} style={{ fontFamily: "monospace" }}>"{err.value}"</Text>
                      )}
                    </div>
                    <Text fz={12} c={err.severity === "error" ? TV.danger : TV.warning}>{err.error}</Text>
                  </div>
                </div>
              ))}
              {errors.length > 3 && (
                <UnstyledButton w="100%" py="sm" onClick={() => setShowAllErrors(s => !s)}
                  style={{ textAlign: "center" }}>
                  <Text fz={12} fw={600} c={TV.textBrand}>
                    {showAllErrors ? "Show less" : `Show ${errors.length - 3} more issues…`}
                  </Text>
                </UnstyledButton>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <Button variant="default" leftSection={<ChevronLeft size={14} />}
              onClick={() => setStep("mapping")}>Back to Mapping</Button>
            <div className="flex items-center gap-3">
              {mode === "replace" ? (
                <Button color="red" leftSection={<AlertTriangle size={14} />}
                  disabled={confirmText !== `DELETE ${stats.deleted.toLocaleString()}`}
                  onClick={handleImport}>
                  Replace All Constituents
                </Button>
              ) : (
                <Button color="tvPurple" rightSection={<ChevronRight size={14} />}
                  onClick={handleImport}>
                  {mode === "update"
                    ? `Update ${stats.matched} + Add ${stats.newRows} Constituents`
                    : `Import ${stats.valid - stats.flagged} Constituents`}
                </Button>
              )}
            </div>
          </div>
        </Stack>
      )}

      {/* ── Complete ── */}
      {step === "complete" && (() => {
        const failedErrors = errors.filter(e => e.severity === "error");
        const hasFailures = skipErrors && failedErrors.length > 0;
        const successCount = mode === "add"
          ? stats.valid - stats.flagged
          : mode === "update"
            ? stats.matched + stats.newRows
            : stats.valid - stats.flagged;

        const handleDownloadErrorCsv = () => {
          const header = "Row,Column,Value,Error,Severity\n";
          const rows = errors.map(e =>
            `${e.row},"${e.column}","${(e.value ?? "").replace(/"/g, '""')}","${e.error.replace(/"/g, '""')}",${e.severity}`
          ).join("\n");
          const blob = new Blob([header + rows], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${fileName.replace(".csv", "")}_error_report.csv`;
          a.click();
          URL.revokeObjectURL(url);
        };

        return (
          <Stack gap="lg">
            {/* Hero */}
            <Stack align="center" gap="md" py="lg">
              <ThemeIcon size={72} radius="xl" variant="light" color={hasFailures ? "orange" : "green"}>
                {hasFailures ? <AlertTriangle size={36} /> : <CircleCheckBig size={36} />}
              </ThemeIcon>
              <div style={{ textAlign: "center" }}>
                <Text fz={20} fw={900} c={TV.textPrimary} mb={4}>
                  {hasFailures ? "Import Completed with Errors" : "Import Complete!"}
                </Text>
                <Text fz={14} c={TV.textSecondary}>
                  {mode === "add" && `${successCount} new constituents have been added to your database.`}
                  {mode === "update" && `${stats.matched} constituents updated and ${stats.newRows} new constituents added.`}
                  {mode === "replace" && "Your constituent database has been replaced with the uploaded CSV data."}
                </Text>
              </div>
            </Stack>

            {/* Results summary bar */}
            <SimpleGrid cols={{ base: 1, sm: hasFailures ? 3 : 2 }} spacing="sm">
              <div className="rounded-lg p-4" style={{ backgroundColor: TV.successBg, border: `1px solid ${TV.successBorder}` }}>
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 size={16} style={{ color: TV.success }} />
                  <Text fz={12} fw={700} c={TV.success}>Successfully Imported</Text>
                </div>
                <Text fz={24} fw={900} c={TV.success}>{successCount}</Text>
                <Text fz={11} c={TV.textSecondary}>
                  {mode === "update" ? `${stats.matched} updated · ${stats.newRows} new` : "New constituents added"}
                </Text>
              </div>
              {hasFailures && (
                <div className="rounded-lg p-4" style={{ backgroundColor: TV.dangerBg, border: `1px solid ${TV.dangerBorder}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <X size={16} style={{ color: TV.danger }} />
                    <Text fz={12} fw={700} c={TV.danger}>Failed to Import</Text>
                  </div>
                  <Text fz={24} fw={900} c={TV.danger}>{failedErrors.length}</Text>
                  <Text fz={11} c={TV.textSecondary}>Rows skipped due to errors</Text>
                </div>
              )}
              {warningCount > 0 && (
                <div className="rounded-lg p-4" style={{ backgroundColor: TV.warningBg, border: `1px solid ${TV.warningBorder}` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={16} style={{ color: TV.warning }} />
                    <Text fz={12} fw={700} c={TV.warning}>Warnings</Text>
                  </div>
                  <Text fz={24} fw={900} c={TV.warning}>{warningCount}</Text>
                  <Text fz={11} c={TV.textSecondary}>Imported with potential issues</Text>
                </div>
              )}
            </SimpleGrid>

            {/* Visual progress bar showing success vs failure ratio */}
            {hasFailures && (
              <div className="rounded-lg p-4" style={{ border: `1px solid ${TV.borderLight}` }}>
                <div className="flex items-center justify-between mb-2">
                  <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em">Import Results</Text>
                  <Text fz={12} c={TV.textSecondary}>
                    {successCount} of {successCount + failedErrors.length} rows ({Math.round(successCount / (successCount + failedErrors.length) * 100)}%)
                  </Text>
                </div>
                <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", height: 12 }}>
                  <div style={{
                    width: `${(successCount / (successCount + failedErrors.length)) * 100}%`,
                    backgroundColor: TV.success,
                    transition: "width 0.5s ease",
                  }} />
                  <div style={{
                    width: `${(failedErrors.length / (successCount + failedErrors.length)) * 100}%`,
                    backgroundColor: TV.danger,
                    transition: "width 0.5s ease",
                  }} />
                </div>
                <div className="flex items-center gap-5 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: TV.success }} />
                    <Text fz={11} c={TV.textSecondary}>Imported ({successCount})</Text>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: TV.danger }} />
                    <Text fz={11} c={TV.textSecondary}>Failed ({failedErrors.length})</Text>
                  </div>
                </div>
              </div>
            )}

            {/* Detailed error table for failed rows */}
            {hasFailures && (
              <div className="rounded-lg" style={{ border: `1px solid ${TV.dangerBorder}`, overflow: "hidden" }}>
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: `1px solid ${TV.borderLight}`, backgroundColor: TV.dangerBg }}>
                  <div className="flex items-center gap-2">
                    <X size={14} style={{ color: TV.danger }} />
                    <Text fz={13} fw={700} c={TV.danger}>
                      Failed Rows ({failedErrors.length})
                    </Text>
                  </div>
                  <Tooltip label="Download a CSV containing all failed rows and error details" withArrow>
                    <Button
                      variant="light" color="red" size="xs" radius="md"
                      leftSection={<Download size={13} />}
                      onClick={handleDownloadErrorCsv}
                    >
                      Download Error Report
                    </Button>
                  </Tooltip>
                </div>
                {/* Column headers */}
                <div className="flex items-center gap-3 flex-nowrap px-4 py-2"
                  style={{ borderBottom: `1px solid ${TV.borderDivider}`, backgroundColor: TV.surface }}>
                  <Box w={60}><Text fz={10} fw={700} c={TV.textLabel} tt="uppercase">Row</Text></Box>
                  <Box w={100}><Text fz={10} fw={700} c={TV.textLabel} tt="uppercase">Column</Text></Box>
                  <Box style={{ flex: 1 }}><Text fz={10} fw={700} c={TV.textLabel} tt="uppercase">Error</Text></Box>
                  <Box w={140}><Text fz={10} fw={700} c={TV.textLabel} tt="uppercase">Value</Text></Box>
                </div>
                {(showAllErrors ? failedErrors : failedErrors.slice(0, 5)).map((err, i) => (
                  <div key={i} className="flex items-center gap-3 flex-nowrap px-4 py-3 hover:bg-tv-danger-bg transition-colors"
                    style={{ borderBottom: i < (showAllErrors ? failedErrors.length : Math.min(failedErrors.length, 5)) - 1 ? `1px solid ${TV.borderDivider}` : undefined }}>
                    <Box w={60}>
                      <Badge variant="light" color="red" size="sm" radius="sm">
                        #{err.row}
                      </Badge>
                    </Box>
                    <Box w={100}>
                      <Badge variant="outline" color="gray" size="sm" radius="sm"
                        styles={{ label: { fontSize: 11 } }}>
                        {err.column}
                      </Badge>
                    </Box>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text fz={12} c={TV.danger}>{err.error}</Text>
                    </Box>
                    <Box w={140}>
                      {err.value ? (
                        <Text fz={11} c={TV.textSecondary} truncate style={{ fontFamily: "monospace" }}>
                          "{err.value}"
                        </Text>
                      ) : (
                        <Text fz={11} c={TV.textSecondary} fs="italic">empty</Text>
                      )}
                    </Box>
                  </div>
                ))}
                {failedErrors.length > 5 && (
                  <UnstyledButton w="100%" py="sm" onClick={() => setShowAllErrors(s => !s)}
                    style={{ textAlign: "center", borderTop: `1px solid ${TV.borderDivider}` }}>
                    <Text fz={12} fw={600} c={TV.textBrand}>
                      {showAllErrors ? "Show fewer rows" : `Show all ${failedErrors.length} failed rows…`}
                    </Text>
                  </UnstyledButton>
                )}
              </div>
            )}

            {/* Warning rows (imported but with potential issues) */}
            {warningCount > 0 && (
              <div className="rounded-lg" style={{ border: `1px solid ${TV.warningBorder}`, overflow: "hidden" }}>
                <div className="flex items-center justify-between px-4 py-3"
                  style={{ borderBottom: `1px solid ${TV.borderLight}`, backgroundColor: TV.warningBg }}>
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} style={{ color: TV.warning }} />
                    <Text fz={13} fw={700} c={TV.warning}>
                      Imported with Warnings ({warningCount})
                    </Text>
                  </div>
                </div>
                {errors.filter(e => e.severity === "warning").map((err, i, arr) => (
                  <div key={i} className="flex items-center gap-3 flex-nowrap px-4 py-3 hover:bg-tv-warning-bg transition-colors"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${TV.borderDivider}` : undefined }}>
                    <Box w={60}>
                      <Badge variant="light" color="orange" size="sm" radius="sm">
                        #{err.row}
                      </Badge>
                    </Box>
                    <Box w={100}>
                      <Badge variant="outline" color="gray" size="sm" radius="sm"
                        styles={{ label: { fontSize: 11 } }}>
                        {err.column}
                      </Badge>
                    </Box>
                    <Box style={{ flex: 1, minWidth: 0 }}>
                      <Text fz={12} c={TV.warning}>{err.error}</Text>
                    </Box>
                    <Box w={140}>
                      {err.value ? (
                        <Text fz={11} c={TV.textSecondary} truncate style={{ fontFamily: "monospace" }}>
                          "{err.value}"
                        </Text>
                      ) : (
                        <Text fz={11} c={TV.textSecondary} fs="italic">empty</Text>
                      )}
                    </Box>
                  </div>
                ))}
              </div>
            )}

            {/* Tip for failed rows */}
            {hasFailures && (
              <Alert variant="light" color="blue" icon={<Info size={16} />} radius="md">
                <Text fz={12}>
                  <b>Tip:</b> Download the error report, fix the issues in your spreadsheet, then re-import just the
                  corrected rows using the <b>Update Existing</b> mode to fill in the gaps without creating duplicates.
                </Text>
              </Alert>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-between">
              <Button variant="default" onClick={onComplete}>Back to Constituents</Button>
              <div className="flex items-center gap-3">
                {hasFailures && (
                  <Button variant="light" color="tvPurple"
                    leftSection={<RefreshCw size={14} />}
                    onClick={() => { setStep("upload"); setFileName(""); setErrors([]); setShowAllErrors(false); }}>
                    Re-import Corrected File
                  </Button>
                )}
                <Button color="tvPurple" onClick={() => { setStep("upload"); setFileName(""); setErrors([]); setShowAllErrors(false); }}>
                  Import Another File
                </Button>
              </div>
            </div>
          </Stack>
        );
      })()}
    </Stack>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MANUAL ADD FLOW
// ═══════════════════════════════════════════════════════════════════════════════

function ManualFlow({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const { show } = useToast();

  // ── Field picker state ──
  const [enabledFields, setEnabledFields] = useState<ManualFieldKey[]>([...DEFAULT_ENABLED_FIELDS]);
  const [fieldPickerOpen, setFieldPickerOpen] = useState(false);

  // ── Current entry form ──
  const [form, setForm] = useState<ManualFormData>(EMPTY_FORM);
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<ManualFieldKey, string>>>({});

  // ── Staged contacts queue ──
  const [staged, setStaged] = useState<StagedContact[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const nextId = useRef(1);

  const set = (k: keyof ManualFormData) => (val: string) => {
    setForm(f => ({ ...f, [k]: val }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const toggleField = (key: ManualFieldKey) => {
    const def = MANUAL_FIELDS.find(f => f.key === key);
    if (def?.required) return;
    setEnabledFields(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const enabledFieldDefs = MANUAL_FIELDS.filter(f => enabledFields.includes(f.key));
  const groupedEnabled = enabledFieldDefs.reduce<Record<string, ManualFieldDef[]>>((acc, f) => {
    (acc[f.group] ??= []).push(f);
    return acc;
  }, {});

  const validate = (): boolean => {
    const errs: Partial<Record<ManualFieldKey, string>> = {};
    if (!form.remoteId.trim()) errs.remoteId = "Donor ID is required";
    if (enabledFields.includes("email") && form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Enter a valid email address";
    }
    if (enabledFields.includes("phone") && form.phone && !/^[\d\s()+\-–.]+$/.test(form.phone)) {
      errs.phone = "Enter a valid phone number";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAddToQueue = () => {
    if (!validate()) return;
    if (editingId !== null) {
      setStaged(prev => prev.map(c => c._id === editingId ? { ...c, form: { ...form }, tags: [...tags] } : c));
      setEditingId(null);
      show("Constituent updated.", "success");
    } else {
      const contact: StagedContact = { _id: nextId.current++, form: { ...form }, tags: [...tags] };
      setStaged(prev => [...prev, contact]);
      show(`Constituent added — ${staged.length + 1} total.`, "success");
    }
    setForm(EMPTY_FORM);
    setTags([]);
    setErrors({});
  };

  const handleEditStaged = (c: StagedContact) => {
    setForm({ ...c.form });
    setTags([...c.tags]);
    setEditingId(c._id);
    setErrors({});
  };

  const handleRemoveStaged = (id: number) => {
    setStaged(prev => prev.filter(c => c._id !== id));
    if (editingId === id) {
      setEditingId(null);
      setForm(EMPTY_FORM);
      setTags([]);
    }
  };

  const handleSaveAll = () => {
    if (staged.length === 0) {
      // If the form has data, try to queue it first
      if (form.remoteId.trim()) {
        if (!validate()) return;
        const contact: StagedContact = { _id: nextId.current++, form: { ...form }, tags: [...tags] };
        show(`${contact.form.remoteId} — 1 constituent added!`, "success");
      } else {
        show("No constituents to save. Add at least one constituent.", "warning");
        return;
      }
    } else {
      show(`${staged.length} constituent${staged.length !== 1 ? "s" : ""} added successfully!`, "success");
    }
    onComplete();
  };

  // Summary label for a staged contact
  const contactLabel = (c: StagedContact) => {
    const parts: string[] = [];
    if (c.form.first || c.form.last) parts.push(`${c.form.first} ${c.form.last}`.trim());
    if (c.form.email) parts.push(c.form.email);
    if (parts.length === 0) parts.push(c.form.remoteId);
    return parts.join(" · ");
  };

  // Group MANUAL_FIELDS for the picker modal
  const pickerGroups = MANUAL_FIELDS.reduce<Record<string, ManualFieldDef[]>>((acc, f) => {
    (acc[f.group] ??= []).push(f);
    return acc;
  }, {});

  return (
    <Stack gap="lg">
      {/* ── Field picker summary ── */}
      <Box p="md" style={{ borderRadius: 10, border: `1px solid ${TV.borderLight}`, background: TV.surfaceMuted }}>
        <div className="flex items-center justify-between" style={{ marginBottom: enabledFields.length > 1 ? 8 : 0 }}>
          <div className="flex items-center gap-2">
            <Settings size={14} style={{ color: TV.textBrand }} />
            <Text fz={13} fw={600} c={TV.textPrimary}>Active Fields</Text>
            <Badge size="sm" variant="light" color="tvPurple" radius="xl">{enabledFields.length}</Badge>
          </div>
          <UnstyledButton onClick={() => setFieldPickerOpen(true)}>
            <Text fz={12} fw={600} c={TV.textBrand}>Customize Fields</Text>
          </UnstyledButton>
        </div>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {enabledFieldDefs.map(f => (
            <Badge key={f.key} size="sm" radius="xl" variant={f.required ? "filled" : "light"} color={f.required ? "tvPurple" : "gray"}
              rightSection={!f.required ? (
                <UnstyledButton lh={1} onClick={() => toggleField(f.key)} style={{ display: "flex" }}>
                  <X size={10} />
                </UnstyledButton>
              ) : undefined}
            >
              {f.label}
            </Badge>
          ))}
        </div>
      </Box>

      {/* ── Field picker modal ── */}
      <Modal opened={fieldPickerOpen} onClose={() => setFieldPickerOpen(false)} title="Choose Fields" size="md" radius="xl">
        <Text fz={12} c={TV.textSecondary} mb="md">
          Select which fields to fill in for each constituent. Donor ID is always required.
        </Text>
        <Stack gap="md">
          {Object.entries(pickerGroups).map(([group, fields]) => (
            <div key={group}>
              <Text fz={11} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em" mb={6}>{group}</Text>
              <Stack gap={4}>
                {fields.map(f => (
                  <Checkbox
                    key={f.key}
                    label={<Text fz={13}>{f.label}{f.required ? <Text span fz={11} c={TV.textSecondary} ml={6}>(Required)</Text> : ""}</Text>}
                    checked={enabledFields.includes(f.key)}
                    disabled={f.required}
                    onChange={() => toggleField(f.key)}
                    color="tvPurple"
                    size="xs"
                  />
                ))}
              </Stack>
            </div>
          ))}
        </Stack>
        <div className="flex items-center justify-end mt-5 gap-3">
          <Button variant="default" onClick={() => setEnabledFields([...DEFAULT_ENABLED_FIELDS])}>Reset to Defaults</Button>
          <Button color="tvPurple" onClick={() => setFieldPickerOpen(false)}>Done</Button>
        </div>
      </Modal>

      {/* ── Entry form ── */}
      <Box>
        <div className="flex items-center gap-2 mb-3">
          <Text fz={13} fw={700} c={TV.textPrimary}>
            {editingId !== null ? "Edit Constituent" : "New Constituent"}
          </Text>
          {editingId !== null && (
            <Badge size="xs" variant="light" color="tvPurple">Editing</Badge>
          )}
        </div>

        {Object.entries(groupedEnabled).map(([group, fields]) => (
          <div key={group} style={{ marginBottom: 16 }}>
            <Text fz={11} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em" mb={8}>{group}</Text>
            <SimpleGrid cols={{ base: 1, sm: group === "Address" ? 3 : 2 }} spacing="sm">
              {fields.map(f => {
                if (f.key === "tags") {
                  return (
                    <Box key="tags" style={{ gridColumn: "1 / -1" }}>
                      <TagSelect
                        value={tags}
                        onChange={setTags}
                        presetTags={CONTACT_PRESET_TAGS}
                        label={
                          <Text span fz={11} fw={600} c={TV.textLabel} tt="uppercase" style={{ letterSpacing: "0.05em" }}>Tags</Text>
                        }
                        placeholder="Search or add tags…"
                      />
                    </Box>
                  );
                }
                if (f.type === "textarea") {
                  return (
                    <Box key={f.key} style={{ gridColumn: "1 / -1" }}>
                      <Textarea
                        label={f.label}
                        placeholder={f.placeholder}
                        minRows={2}
                        value={form[f.key as keyof ManualFormData]}
                        onChange={e => set(f.key as keyof ManualFormData)(e.currentTarget.value)}
                      />
                    </Box>
                  );
                }
                if (f.type === "select") {
                  return (
                    <Select
                      key={f.key}
                      label={f.label}
                      placeholder={f.placeholder}
                      data={f.selectOptions ?? []}
                      value={form[f.key as keyof ManualFormData] || null}
                      onChange={val => set(f.key as keyof ManualFormData)(val ?? "")}
                      clearable
                    />
                  );
                }
                return (
                  <TextInput
                    key={f.key}
                    label={<span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>{f.label}{f.required && <Text span c={TV.danger}>*</Text>}</span>}
                    placeholder={f.placeholder}
                    required={f.required}
                    value={form[f.key as keyof ManualFormData]}
                    onChange={e => set(f.key as keyof ManualFormData)(e.currentTarget.value)}
                    error={errors[f.key]}
                  />
                );
              })}
            </SimpleGrid>
          </div>
        ))}

        <div className="flex items-center justify-end mt-3 gap-3">
          {editingId !== null && (
            <Button variant="default" size="xs" onClick={() => {
              setEditingId(null);
              setForm(EMPTY_FORM);
              setTags([]);
              setErrors({});
            }}>
              Cancel Edit
            </Button>
          )}
          <Button
            variant={editingId !== null ? "filled" : "light"}
            color="tvPurple"
            size="xs"
            leftSection={editingId !== null ? <Check size={13} /> : <Plus size={13} />}
            onClick={handleAddToQueue}
            disabled={!form.remoteId.trim()}
          >
            {editingId !== null ? "Save Changes" : "Add Next Constituent"}
          </Button>
        </div>
      </Box>

      {/* ── Staged contacts queue ── */}
      {staged.length > 0 && (
        <Box>
          <Divider color={TV.borderDivider} mb="md" />
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Text fz={13} fw={700} c={TV.textPrimary}>Constituents to Add</Text>
              <Badge size="sm" variant="filled" color="tvPurple" radius="xl">{staged.length}</Badge>
            </div>
            <UnstyledButton onClick={() => { setStaged([]); show("All constituents removed.", "info"); }}>
              <Text fz={12} c={TV.danger}>Clear All</Text>
            </UnstyledButton>
          </div>

          <Stack gap={0}>
            {staged.map((c, idx) => (
              <div
                key={c._id}
                className="flex items-center gap-3 flex-nowrap px-3 hover:bg-tv-surface transition-colors"
                style={{
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderBottom: idx < staged.length - 1 ? `1px solid ${TV.borderDivider}` : undefined,
                  background: editingId === c._id ? TV.surface : undefined,
                  borderRadius: editingId === c._id ? 8 : 0,
                }}
              >
                <Avatar size={30} radius="xl" color="tvPurple" variant="light">
                  <Text fz={11} fw={700}>{(c.form.first?.[0] ?? c.form.remoteId[0] ?? "?").toUpperCase()}</Text>
                </Avatar>
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text fz={13} c={TV.textPrimary} truncate="end">{contactLabel(c)}</Text>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Badge size="xs" variant="light" color="gray" radius="sm">ID: {c.form.remoteId}</Badge>
                    {c.tags.length > 0 && (
                      <Badge size="xs" variant="light" color="tvPurple" radius="sm">{c.tags.length} tag{c.tags.length !== 1 ? "s" : ""}</Badge>
                    )}
                  </div>
                </Box>
                <div className="flex items-center gap-1">
                  <Tooltip label="Edit" withArrow>
                    <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => handleEditStaged(c)} aria-label="Edit contact">
                      <Pencil size={13} aria-hidden="true" />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label="Remove" withArrow>
                    <ActionIcon variant="subtle" color="red" size="sm" onClick={() => handleRemoveStaged(c._id)} aria-label="Remove contact">
                      <Trash2 size={13} aria-hidden="true" />
                    </ActionIcon>
                  </Tooltip>
                </div>
              </div>
            ))}
          </Stack>
        </Box>
      )}

      <Divider color={TV.borderDivider} />

      {/* ── Footer actions ── */}
      <div className="flex items-center justify-between">
        <Button variant="default" leftSection={<ChevronLeft size={14} />} onClick={onBack}>
          Back
        </Button>
        <Button
          color="tvPurple"
          onClick={handleSaveAll}
          disabled={staged.length === 0 && !form.remoteId.trim()}
          leftSection={<CheckCircle2 size={14} />}
        >
          {staged.length > 0
            ? `Save ${staged.length} Constituent${staged.length !== 1 ? "s" : ""}`
            : "Save Constituent"}
        </Button>
      </div>
    </Stack>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BB RE NXT IMPORT FLOW
// ═══════════════════════════════════════════════════════════════════════════════

function RenxtFlow({ onComplete, onBack }: { onComplete: () => void; onBack: () => void }) {
  const { show } = useToast();
  const [step, setStep] = useState<RenxtStep>("connect");
  const [integrationEnabled] = useState(true); // Simulate integration status
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Query filters (using FilterBar)
  const CONSTITUENT_FILTERS: FilterDef[] = useMemo(() => [
    { key: "constituentType", label: "Constituent Type", icon: Users, group: "Query", type: "select" as const,
      options: [{ value: "Individual", label: "Individual" }, { value: "Organization", label: "Organization" }], essential: true },
    { key: "status", label: "Status", icon: ListFilter, group: "Query", type: "select" as const,
      options: [{ value: "Active", label: "Active" }, { value: "Inactive", label: "Inactive" }, { value: "Deceased", label: "Deceased" }], essential: true },
    { key: "dateRange", label: "Date Added", icon: Calendar, group: "Query", type: "select" as const,
      options: [{ value: "30d", label: "Last 30 Days" }, { value: "90d", label: "Last 90 Days" }, { value: "1y", label: "Last Year" }], essential: true },
    DATE_CREATED_FILTER,
  ], []);
  const CONSTITUENT_FILTER_KEYS = ["constituentType", "status", "dateRange", "dateCreated"];
  const [queryFilterValues, setQueryFilterValues] = useState<FilterValues>({});
  const [queryFilterKeys, setQueryFilterKeys]     = useState<string[]>(CONSTITUENT_FILTER_KEYS);

  // Derive filter values from FilterBar state
  const constituentType = queryFilterValues.constituentType?.[0] ?? "All";
  const statusFilter    = queryFilterValues.status?.[0] ?? null;
  const dateRange       = queryFilterValues.dateRange?.[0] ?? "all";
  const [querySearch, setQuerySearch] = useState("");
  const [selectedResults, setSelectedResults] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [acPage, setAcPage] = useState(1);
  const [acRowsPerPage, setAcRowsPerPage] = useState(25);
  const [acSort, setAcSort] = useState<SortState>({ key: null, dir: null });
  const handleAcSort = (key: string) => setAcSort(prev => nextSort(prev, key));
  const [acActiveCols, setAcActiveCols] = useState<string[]>(DEFAULT_AC_COLUMNS);
  const [showAcEditColumns, setShowAcEditColumns] = useState(false);

  // Field mapping
  const [mapping, setMapping] = useState(DEFAULT_RENXT_MAPPING);

  // Preview table sort
  const [previewSort, setPreviewSort] = useState<SortState>({ key: null, dir: null });
  const handlePreviewSort = (key: string) => setPreviewSort(prev => nextSort(prev, key));

  // Import progress
  const [importProgress, setImportProgress] = useState(0);

  const stepIndex = { connect: 0, query: 1, mapping: 2, preview: 3, importing: 3, complete: 4 }[step];
  const RENXT_STEPS_BY_INDEX: RenxtStep[] = ["connect", "query", "mapping", "preview", "complete"];
  const handleRenxtStepClick = (index: number) => {
    if (index < (stepIndex ?? 0)) setStep(RENXT_STEPS_BY_INDEX[index]);
  };

  const handleConnect = () => {
    setConnecting(true);
    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
      show("Connected to Blackbaud RE NXT!", "success");
      setTimeout(() => setStep("query"), 500);
    }, 2000);
  };

  const filteredResults = sortRows(
    MOCK_RENXT_RESULTS.filter(r =>
      !querySearch || r.name.toLowerCase().includes(querySearch.toLowerCase()) ||
      r.email.toLowerCase().includes(querySearch.toLowerCase()) ||
      r.id.toLowerCase().includes(querySearch.toLowerCase())
    ),
    acSort,
    (r, key) => {
      switch (key) {
        case "constituent": return r.name;
        case "email": return r.email;
        case "classOf": return r.classOf;
        case "type": return r.type;
        case "totalGiving": return parseFloat(r.totalGiving.replace(/[$,]/g, ""));
        default: return "";
      }
    },
  );

  const paginatedResults = filteredResults.slice(
    (acPage - 1) * acRowsPerPage,
    acPage * acRowsPerPage
  );

  const toggleResult = (id: string) => {
    setSelectedResults(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedResults([]);
    } else {
      setSelectedResults(filteredResults.map(r => r.id));
    }
    setSelectAll(!selectAll);
  };

  const handleMappingChange = (idx: number, tvField: string) => {
    setMapping(m => m.map((item, i) => i === idx ? { ...item, tv: tvField } : item));
  };

  const addMappingRow = () => {
    setMapping(m => [...m, { renxt: "", tv: "" }]);
  };

  const removeMappingRow = (idx: number) => {
    setMapping(m => m.filter((_, i) => i !== idx));
  };

  const startImport = () => {
    setStep("importing");
    setImportProgress(0);
    const interval = setInterval(() => {
      setImportProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setStep("complete");
            show(`${selectAll ? filteredResults.length : selectedResults.length} constituents imported from RE NXT!`, "success");
          }, 300);
          return 100;
        }
        return p + Math.random() * 12 + 3;
      });
    }, 250);
  };

  const importCount = selectAll ? filteredResults.length : selectedResults.length;

  return (
    <Stack gap="lg">
      {/* Stepper */}
      <Stepper active={stepIndex} size="sm" color="tvPurple"
        onStepClick={handleRenxtStepClick}
        styles={{
          step: { padding: 0, cursor: "pointer" },
          stepIcon: { borderWidth: 2 },
          separator: { marginLeft: 4, marginRight: 4 },
        }}>
        <Stepper.Step label="Connect" />
        <Stepper.Step label="Select" />
        <Stepper.Step label="Map Fields" />
        <Stepper.Step label="Import" />
        <Stepper.Step label="Done" allowStepSelect={false} />
      </Stepper>

      {/* ── Connect ── */}
      {step === "connect" && (
        <Stack gap="md">
          {!integrationEnabled ? (
            /* Integration not enabled */
            <div className="rounded-xl p-6" style={{ border: `2px dashed ${TV.borderStrong}`, textAlign: "center" }}>
              <Stack align="center" gap="md">
                <ThemeIcon size={64} radius="xl" variant="light" color="gray">
                  <Database size={28} />
                </ThemeIcon>
                <div>
                  <Text fz={18} fw={900} c={TV.textPrimary} mb={4}>Integration Not Enabled</Text>
                  <Text fz={14} c={TV.textSecondary} maw={420} mx="auto">
                    The Blackbaud RE NXT integration needs to be enabled by your administrator
                    before you can import constituents.
                  </Text>
                </div>
                <Button variant="default" leftSection={<Settings size={14} />}
                  onClick={() => show("Redirecting to Settings → Integrations", "info")}>
                  Go to Integration Settings
                </Button>
              </Stack>
            </div>
          ) : !connected ? (
            /* Ready to connect */
            <div className="rounded-xl p-6" style={{ border: `2px solid ${TV.border}`, textAlign: "center" }}>
              <Stack align="center" gap="md">
                <Box w={72} h={72} style={{
                  borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(135deg, #003B5C 0%, #005A8C 100%)",
                }}>
                  <Text fz={28} fw={900} c="white">BB</Text>
                </Box>
                <div>
                  <Text fz={18} fw={900} c={TV.textPrimary} mb={4}>Connect to Blackbaud RE NXT</Text>
                  <Text fz={14} c={TV.textSecondary} maw={420} mx="auto">
                    Authenticate with your Blackbaud account to browse and import constituents
                    directly into ThankView.
                  </Text>
                </div>
                <Alert variant="light" color="blue" icon={<Info size={14} />} radius="md" maw={460}>
                  <Text fz={12}>
                    This requires the <b>Blackbaud SKY API</b> integration to be configured in your
                    organization's Settings → Integrations page.
                  </Text>
                </Alert>
                <Button color="tvPurple" size="md" leftSection={connecting ? <Loader size={16} color="white" /> : <Link2 size={16} />}
                  onClick={handleConnect}
                  loading={connecting}>
                  {connecting ? "Authenticating…" : "Connect to RE NXT"}
                </Button>
              </Stack>
            </div>
          ) : (
            /* Connected */
            <div className="rounded-xl p-6" style={{ backgroundColor: TV.successBg, border: `1px solid ${TV.successBorder}`, textAlign: "center" }}>
              <Stack align="center" gap="sm">
                <ThemeIcon size={56} radius="xl" variant="light" color="green">
                  <CheckCircle2 size={28} />
                </ThemeIcon>
                <Text fz={16} fw={700} c={TV.success}>Connected to Blackbaud RE NXT</Text>
                <Text fz={13} c={TV.textSecondary}>Hartwell University — Production Environment</Text>
                <Button color="tvPurple" onClick={() => setStep("query")} rightSection={<ChevronRight size={14} />}>
                  Continue to Select Constituents
                </Button>
              </Stack>
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <Button variant="default" leftSection={<ChevronLeft size={14} />} onClick={onBack}>
              Back
            </Button>
          </div>
        </Stack>
      )}

      {/* ── Query / Select ── */}
      {step === "query" && (
        <Stack gap="md">
          <div>
            <FilterBar
              filters={CONSTITUENT_FILTERS}
              activeFilterKeys={queryFilterKeys}
              filterValues={queryFilterValues}
              onFilterValuesChange={setQueryFilterValues}
              onActiveFilterKeysChange={setQueryFilterKeys}
            />
            <TextInput leftSection={<Search size={14} style={{ color: TV.textSecondary }} />}
              placeholder="Search by name, email, or constituent ID…"
              value={querySearch} onChange={e => setQuerySearch(e.currentTarget.value)}
              mt="sm" size="xs" radius="xl"
              styles={{ input: { borderColor: TV.borderLight, backgroundColor: '#fff', color: TV.textPrimary } }} />
          </div>

          {/* Results table */}
          <div className="rounded-lg" style={{ border: `1px solid ${TV.borderLight}`, overflow: "hidden" }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${TV.borderLight}`, backgroundColor: TV.surface }}>
              <div className="flex items-center gap-3">
                <Checkbox checked={selectAll} onChange={handleSelectAll} color="tvPurple" size="xs" />
                <Text fz={12} fw={600} c={TV.textPrimary}>
                  {selectAll ? "All" : selectedResults.length} of {filteredResults.length} constituents selected
                </Text>
              </div>
              <Badge variant="light" color="tvPurple" size="sm">
                Showing {filteredResults.length} of 12,847 total
              </Badge>
              <ColumnsButton onClick={() => setShowAcEditColumns(true)} />
            </div>

            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto" role="region" aria-label="Add contacts table" tabIndex={0}>
            <Table aria-label="Add contacts results" verticalSpacing={0} horizontalSpacing={0} highlightOnHover styles={{ table: { borderCollapse: "collapse", minWidth: Math.max(500, acActiveCols.length * 140 + 60) }, td: { whiteSpace: "nowrap" } }}>
              <Table.Thead className="sticky top-0 z-20" style={{ backgroundColor: TV.surfaceMuted }}>
                <Table.Tr style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
                  <Table.Th scope="col" w={44} style={{ padding: "10px 0 10px 16px", verticalAlign: "middle" }} />
                  {acActiveCols.map(colKey => {
                    const colDef = AC_COLUMNS.find(c => c.key === colKey);
                    if (!colDef) return null;
                    return (
                      <Table.Th scope="col" key={colKey} style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                        <SortableHeader label={colDef.label} sortKey={colKey} currentSort={acSort.key} currentDir={acSort.dir} onSort={handleAcSort} />
                      </Table.Th>
                    );
                  })}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedResults.map((r) => {
                  const isSelected = selectAll || selectedResults.includes(r.id);
                  return (
                    <Table.Tr key={r.id}
                      style={{ borderBottom: `1px solid ${TV.borderDivider}`, cursor: "pointer" }}
                      bg={isSelected ? TV.brandTint : undefined}
                      onClick={() => { if (selectAll) { setSelectAll(false); setSelectedResults(filteredResults.map(x => x.id).filter(x => x !== r.id)); } else toggleResult(r.id); }}
                      className="hover:bg-tv-surface-muted transition-colors">
                      <Table.Td style={{ padding: "12px 0 12px 16px", verticalAlign: "middle" }}>
                        <Checkbox checked={isSelected} onChange={() => {}} color="tvPurple" size="xs" />
                      </Table.Td>
                      {acActiveCols.map(colKey => (
                        <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          {colKey === "constituent" ? (
                            <div className="flex items-center gap-1" style={{ flexWrap: "nowrap" }}>
                              <Avatar size={28} radius="xl"
                                styles={{ placeholder: { backgroundColor: TV.textBrand, color: "white", fontSize: 11 } }}>
                                {r.name.charAt(0)}
                              </Avatar>
                              <div style={{ minWidth: 0 }}>
                                <Text fz={13} fw={600} c={TV.textPrimary} truncate>{r.name}</Text>
                                <Text fz={10} c={TV.textSecondary} style={{ fontFamily: "monospace" }}>{r.id}</Text>
                              </div>
                            </div>
                          ) : colKey === "email" ? (
                            <Text fz={12} c={TV.textSecondary} truncate>{r.email}</Text>
                          ) : colKey === "classOf" ? (
                            <Text fz={12} c={TV.textSecondary}>{r.classOf}</Text>
                          ) : colKey === "type" ? (
                            <Badge size="xs" variant="light" color={r.type === "Organization" ? "cyan" : "tvPurple"}>
                              {r.type}
                            </Badge>
                          ) : colKey === "totalGiving" ? (
                            <Text fz={12} fw={600} c={TV.textPrimary}>{r.totalGiving}</Text>
                          ) : null}
                        </Table.Td>
                      ))}
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
            <TablePagination page={acPage} rowsPerPage={acRowsPerPage} totalRows={filteredResults.length}
              onPageChange={setAcPage} onRowsPerPageChange={setAcRowsPerPage} />
            </div>

            {filteredResults.length === 0 && (
              <Stack align="center" py="xl" gap="xs">
                <Text fz={14} c={TV.textSecondary}>No constituents match your search criteria.</Text>
              </Stack>
            )}
          </div>

          <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
            <Button variant="default" leftSection={<ChevronLeft size={14} />}
              onClick={() => setStep("connect")}>Back</Button>
            <Button color="tvPurple" rightSection={<ChevronRight size={14} />}
              disabled={importCount === 0}
              onClick={() => setStep("mapping")}>
              Map Fields ({importCount} selected)
            </Button>
          </div>
        </Stack>
      )}

      {/* ── Field Mapping ── */}
      {step === "mapping" && (
        <Stack gap="md">
          <Text fz={14} fw={600} c={TV.textPrimary}>Map RE NXT fields to ThankView fields</Text>
          <Text fz={13} c={TV.textSecondary}>
            Configure how constituent data from Blackbaud maps to your ThankView constituent fields.
          </Text>

          <div className="rounded-lg" style={{ border: `1px solid ${TV.borderLight}`, overflow: "hidden" }}>
            <div className="flex items-center px-4 py-2" style={{ borderBottom: `1px solid ${TV.borderLight}`, backgroundColor: TV.surface }}>
              <Text fz={11} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em" style={{ flex: 1 }}>RE NXT Field</Text>
              <Box w={28} />
              <Text fz={11} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em" style={{ flex: 1 }}>ThankView Field</Text>
              <Box w={32} />
            </div>

            {mapping.map((m, idx) => (
              <div key={idx} className="flex items-center px-4 py-3" style={{ flexWrap: "nowrap", borderBottom: idx < mapping.length - 1 ? `1px solid ${TV.borderDivider}` : undefined }}>
                <Box style={{ flex: 1 }}>
                  <Select
                    data={RENXT_FIELDS.map(f => ({ value: f.value, label: f.label }))}
                    value={m.renxt}
                    onChange={v => setMapping(mp => mp.map((item, i) => i === idx ? { ...item, renxt: v ?? "" } : item))}
                    size="xs" radius="md" placeholder="Select RE NXT field…"
                    aria-label="RE NXT field"
                    comboboxProps={{ shadow: "md" }}
                  />
                </Box>
                <ArrowRight size={14} style={{ color: TV.borderStrong, flexShrink: 0 }} />
                <Box style={{ flex: 1 }}>
                  <Select
                    data={TV_FIELDS.filter(f => f.value !== "skip").map(f => ({ value: f.value, label: f.label }))}
                    value={m.tv}
                    onChange={v => handleMappingChange(idx, v ?? "")}
                    size="xs" radius="md" placeholder="Select TV field…"
                    aria-label="ThankView field"
                    comboboxProps={{ shadow: "md" }}
                  />
                </Box>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => removeMappingRow(idx)} aria-label="Remove mapping row">
                  <Trash2 size={13} aria-hidden="true" />
                </ActionIcon>
              </div>
            ))}
          </div>

          <UnstyledButton onClick={addMappingRow}>
            <div className="flex items-center gap-1.5">
              <Plus size={13} style={{ color: TV.textBrand }} />
              <Text fz={13} fw={600} c={TV.textBrand}>Add field mapping</Text>
            </div>
          </UnstyledButton>

          <Alert variant="light" color="blue" icon={<Info size={14} />} radius="md">
            <Text fz={12}>
              Unmapped RE NXT fields will not be imported. The <b>Constituent ID</b> → <b>Remote ID</b> mapping
              is recommended for future syncs and deduplication.
            </Text>
          </Alert>

          <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
            <Button variant="default" leftSection={<ChevronLeft size={14} />}
              onClick={() => setStep("query")}>Back</Button>
            <Button color="tvPurple" rightSection={<ChevronRight size={14} />}
              onClick={() => setStep("preview")}>
              Preview Import
            </Button>
          </div>
        </Stack>
      )}

      {/* ── Preview ── */}
      {step === "preview" && (
        <Stack gap="md">
          <div className="p-4 rounded-lg" style={{ backgroundColor: TV.surface, border: `1px solid ${TV.borderLight}` }}>
            <div className="flex items-center gap-2 mb-1">
              <CloudDownload size={18} style={{ color: TV.textBrand }} />
              <Text fz={16} fw={700} c={TV.textPrimary}>Import Summary</Text>
            </div>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <div>
                <Text fz={24} fw={900} c={TV.textBrand}>{importCount}</Text>
                <Text fz={12} c={TV.textSecondary}>Constituents to import</Text>
              </div>
              <div>
                <Text fz={24} fw={900} c={TV.success}>{mapping.filter(m => m.renxt && m.tv).length}</Text>
                <Text fz={12} c={TV.textSecondary}>Fields mapped</Text>
              </div>
              <div>
                <Text fz={24} fw={900} c={TV.textPrimary}>0</Text>
                <Text fz={12} c={TV.textSecondary}>Potential duplicates</Text>
              </div>
            </SimpleGrid>
          </div>

          {/* Preview data */}
          <Text fz={12} fw={700} c={TV.textLabel} tt="uppercase" lts="0.05em">Data Preview (first 3 records)</Text>
          <div className="rounded-lg" style={{ border: `1px solid ${TV.borderLight}`, overflow: "auto", maxHeight: "60vh" }}>
            <Table aria-label="Data preview" verticalSpacing={0} horizontalSpacing={0} styles={{ table: { borderCollapse: "collapse", minWidth: 500 }, td: { whiteSpace: "nowrap" } }}>
              <Table.Thead className="sticky top-0 z-20" style={{ backgroundColor: TV.surfaceMuted }}>
                <Table.Tr style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
                  {mapping.filter(m => m.tv).map(m => (
                    <Table.Th scope="col" key={m.tv} style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <SortableHeader label={TV_FIELDS.find(f => f.value === m.tv)?.label ?? m.tv} sortKey={m.tv} currentSort={previewSort.key} currentDir={previewSort.dir} onSort={handlePreviewSort} />
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sortRows(MOCK_RENXT_RESULTS.slice(0, 3), previewSort, (r, key) => {
                  const m = mapping.find(mp => mp.tv === key);
                  if (!m) return "";
                  if (m.renxt === "first_name") return r.name.split(" ")[0];
                  if (m.renxt === "last_name") return r.name.split(" ").slice(1).join(" ");
                  if (m.renxt === "email_address") return r.email;
                  if (m.renxt === "constituent_id") return r.id;
                  if (m.renxt === "organization_name") return r.type === "Organization" ? r.name : "";
                  if (m.renxt === "class_of") return r.classOf;
                  if (m.renxt === "phone_number") return "(617) 555-XXXX";
                  return "";
                }).map(r => (
                  <Table.Tr key={r.id} style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
                    {mapping.filter(m => m.tv).map(m => {
                      let val = "—";
                      if (m.renxt === "first_name") val = r.name.split(" ")[0];
                      else if (m.renxt === "last_name") val = r.name.split(" ").slice(1).join(" ");
                      else if (m.renxt === "email_address") val = r.email;
                      else if (m.renxt === "constituent_id") val = r.id;
                      else if (m.renxt === "organization_name") val = r.type === "Organization" ? r.name : "—";
                      else if (m.renxt === "class_of") val = r.classOf;
                      else if (m.renxt === "phone_number") val = "(617) 555-XXXX";
                      return (
                        <Table.Td key={m.tv} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                          <Text fz={12} c={TV.textSecondary} truncate>{val}</Text>
                        </Table.Td>
                      );
                    })}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </div>

          <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
            <Button variant="default" leftSection={<ChevronLeft size={14} />}
              onClick={() => setStep("mapping")}>Back</Button>
            <Button color="tvPurple" onClick={startImport}>
              Import {importCount} Constituents
            </Button>
          </div>
        </Stack>
      )}

      {/* ── Importing ── */}
      {step === "importing" && (
        <Stack align="center" gap="lg" py="xl">
          <Loader size="lg" color="tvPurple" />
          <div style={{ textAlign: "center" }}>
            <Text fz={16} fw={700} c={TV.textPrimary} mb={4}>Importing from RE NXT…</Text>
            <Text fz={13} c={TV.textSecondary}>Syncing {importCount} constituents to ThankView</Text>
          </div>
          <Box w="100%" maw={400}>
            <Progress value={Math.min(importProgress, 100)} color="tvPurple" size="lg" radius="xl" animated />
            <Text fz={12} c={TV.textSecondary} ta="center" mt="xs">
              {Math.min(Math.round(importProgress), 100)}%
            </Text>
          </Box>
        </Stack>
      )}

      {/* ── Complete ── */}
      {step === "complete" && (
        <Stack align="center" gap="lg" py="xl">
          <ThemeIcon size={72} radius="xl" variant="light" color="green">
            <CircleCheckBig size={36} />
          </ThemeIcon>
          <div style={{ textAlign: "center" }}>
            <Text fz={20} fw={900} c={TV.textPrimary} mb={4}>Import Complete!</Text>
            <Text fz={14} c={TV.textSecondary}>
              {importCount} constituents from Blackbaud RE NXT have been imported into ThankView.
            </Text>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" onClick={onComplete}>Back to Constituents</Button>
            <Button color="tvPurple" onClick={() => { setStep("query"); setSelectedResults([]); setSelectAll(false); }}>
              Import More
            </Button>
          </div>
        </Stack>
      )}

      {/* Edit Columns Modal */}
      {showAcEditColumns && (
        <EditColumnsModal columns={AC_COLUMNS} active={acActiveCols} onClose={() => setShowAcEditColumns(false)}
          onSave={cols => { setAcActiveCols(cols); }} />
      )}
    </Stack>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTEGRATION PLACEHOLDER (Salesforce & Bloomerang)
// ═══════════════════════════════════════════════════════════════════════════════

function IntegrationPlaceholder({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <Stack align="center" gap="lg" py={60}>
      <Box w={72} h={72} bg={TV.brandTint} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <CloudDownload size={32} style={{ color: TV.textBrand }} />
      </Box>
      <Title order={3} c={TV.textPrimary} ta="center">
        {name} Import Wizard
      </Title>
      <Text fz={15} c={TV.textSecondary} ta="center" maw={480} style={{ lineHeight: 1.6 }}>
        The {name} import wizard will follow the same 5-step flow as the Blackbaud RE NXT integration: OAuth connection, query &amp; filter, field mapping, validation, and review/import.
      </Text>
      <Badge size="lg" variant="light" color="tvPurple" radius="xl">
        Coming Soon — Insert {name} Migration Wizard Here
      </Badge>
      <Button variant="default" leftSection={<ChevronLeft size={14} />} onClick={onBack}
        styles={{ root: { borderColor: TV.borderLight, color: TV.textSecondary } }}>
        Back to Methods
      </Button>
    </Stack>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════

export function AddContacts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialMethod = searchParams.get("method") as AddMethod;
  const [method, setMethod] = useState<AddMethod>(initialMethod);

  const goBack = () => navigate("/contacts");

  // If no method param, redirect to contacts — the method picker is accessed from the Contacts toolbar dropdown
  useEffect(() => {
    if (!method) navigate("/contacts", { replace: true });
  }, [method, navigate]);

  if (!method) return null;

  const subtitles: Record<string, string> = {
    csv: "Upload a CSV file to import constituents in bulk.",
    manual: "Add one or more constituents manually — choose your fields, then save them all in one go.",
    renxt: "Import constituents from your Blackbaud RE NXT instance.",
    salesforce: "Import constituents from your Salesforce org.",
    bloomerang: "Import constituents from your Bloomerang account.",
  };

  return (
    <Box p={{ base: "sm", sm: "xl" }} pt={0} maw={960} mx="auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 sm:pt-6 pb-3 -mx-3 sm:-mx-6 px-3 sm:px-6 flex items-center gap-2 mb-3">
        <ActionIcon variant="subtle" color="gray" size="lg" onClick={goBack} aria-label="Go back">
          <ChevronLeft size={20} aria-hidden="true" />
        </ActionIcon>
        <div>
          <Title order={2} fz={{ base: 20, sm: 24 }}>Add Constituents</Title>
          <Text fz={13} c={TV.textSecondary}>{subtitles[method] ?? ""}</Text>
        </div>
      </div>

      {/* Flows */}
      {method === "csv" && (
        <div className="p-4 sm:p-6 rounded-xl" style={{ border: `1px solid ${TV.borderLight}` }}>
          <CsvFlow onComplete={goBack} onBack={goBack} />
        </div>
      )}
      {method === "manual" && (
        <div className="p-4 sm:p-6 rounded-xl" style={{ border: `1px solid ${TV.borderLight}` }}>
          <ManualFlow onComplete={goBack} onBack={goBack} />
        </div>
      )}
      {method === "renxt" && (
        <div className="p-4 sm:p-6 rounded-xl" style={{ border: `1px solid ${TV.borderLight}` }}>
          <RenxtFlow onComplete={goBack} onBack={goBack} />
        </div>
      )}
      {method === "salesforce" && (
        <div className="p-4 sm:p-6 rounded-xl" style={{ border: `1px solid ${TV.borderLight}` }}>
          <IntegrationPlaceholder name="Salesforce" onBack={goBack} />
        </div>
      )}
      {method === "bloomerang" && (
        <div className="p-4 sm:p-6 rounded-xl" style={{ border: `1px solid ${TV.borderLight}` }}>
          <IntegrationPlaceholder name="Bloomerang" onBack={goBack} />
        </div>
      )}
    </Box>
  );
}
