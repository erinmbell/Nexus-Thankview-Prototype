/**
 * CSVImportWizard — 4-step CSV upload flow for adding constituents.
 *
 * Step 1: Upload (drag-and-drop / file picker)
 * Step 2: Field Mapping (CSV headers → ThankView fields)
 * Step 3: Preview (first 5 rows, validation highlighting)
 * Step 4: Results (imported/skipped/errors, error log download)
 */
import { useState, useCallback, useRef, useMemo } from "react";
import {
  Upload, FileSpreadsheet, Check, X, ChevronDown,
  AlertTriangle, CircleCheckBig, Download, ChevronRight,
  ArrowLeft, TriangleAlert,
} from "lucide-react";

// ── ThankView target fields ──────────────────────────────────────────────────
const TV_FIELDS = [
  { id: "name",           label: "Name" },
  { id: "email",          label: "Email" },
  { id: "preferredName",  label: "Preferred Name" },
  { id: "salutation",     label: "Salutation" },
  { id: "classYear",      label: "Class Year" },
  { id: "lastGiftAmount", label: "Last Gift Amount" },
  { id: "lastGiftDate",   label: "Last Gift Date" },
  { id: "lifetimeGiving", label: "Lifetime Giving" },
  { id: "fund",           label: "Fund" },
  { id: "designation",    label: "Designation" },
  { id: "group",          label: "Group" },
] as const;

type TVFieldId = typeof TV_FIELDS[number]["id"] | "skip";

// Auto-matching map (lowercase csv header → ThankView field id)
const AUTO_MAP: Record<string, TVFieldId> = {
  name: "name",
  full_name: "name",
  fullname: "name",
  "full name": "name",
  first_name: "preferredName",
  firstname: "preferredName",
  "first name": "preferredName",
  preferred_name: "preferredName",
  preferred: "preferredName",
  email: "email",
  email_address: "email",
  "email address": "email",
  salutation: "salutation",
  title: "salutation",
  class_year: "classYear",
  classyear: "classYear",
  "class year": "classYear",
  year: "classYear",
  graduation_year: "classYear",
  last_gift_amount: "lastGiftAmount",
  lastgiftamount: "lastGiftAmount",
  "last gift amount": "lastGiftAmount",
  last_gift: "lastGiftAmount",
  last_gift_date: "lastGiftDate",
  lastgiftdate: "lastGiftDate",
  "last gift date": "lastGiftDate",
  lifetime_giving: "lifetimeGiving",
  lifetimegiving: "lifetimeGiving",
  "lifetime giving": "lifetimeGiving",
  total_giving: "lifetimeGiving",
  fund: "fund",
  designation: "designation",
  group: "group",
};

// ── Types ────────────────────────────────────────────────────────────────────
interface CSVRow {
  values: string[];
}

interface RowError {
  row: number;
  field: string;
  reason: string;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: RowError[];
}

export interface CSVImportWizardProps {
  existingEmails?: Set<string>;
  onImport: (constituents: { name: string; email: string; [k: string]: string }[]) => void;
}

// ── Simple CSV parser ────────────────────────────────────────────────────────
function parseCSV(text: string): { headers: string[]; rows: CSVRow[] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    rows.push({ values });
  }
  return { headers, rows };
}

// ── Email validation ─────────────────────────────────────────────────────────
function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

// ── Step badge ───────────────────────────────────────────────────────────────
function StepDot({ step, current, label }: { step: number; current: number; label: string }) {
  const done = current > step;
  const active = current === step;
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] transition-colors ${
          done
            ? "bg-tv-success text-white"
            : active
            ? "bg-tv-brand-bg text-white"
            : "bg-tv-surface text-tv-text-secondary border border-tv-border-light"
        }`}
        style={{ fontWeight: 700 }}
      >
        {done ? <Check size={11} /> : step}
      </div>
      <span
        className={`text-[11px] ${active ? "text-tv-text-primary" : "text-tv-text-secondary"}`}
        style={{ fontWeight: active ? 600 : 400 }}
      >
        {label}
      </span>
    </div>
  );
}

function StepConnector() {
  return <div className="w-6 h-px bg-tv-border-light mx-1" />;
}

// ═════════════════════════════════════════════════════════════════════════════
export function CSVImportWizard({ existingEmails = new Set(), onImport }: CSVImportWizardProps) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CSVRow[]>([]);
  const [mapping, setMapping] = useState<Record<number, TVFieldId>>({});
  const [duplicateMode, setDuplicateMode] = useState<"skip" | "update">("skip");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [expandErrors, setExpandErrors] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File handling ─────────────────────────────────────────────────────────
  const processFile = useCallback((file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      // Auto-map headers
      const autoMapped: Record<number, TVFieldId> = {};
      parsed.headers.forEach((h, i) => {
        const key = h.toLowerCase().trim();
        if (AUTO_MAP[key]) autoMapped[i] = AUTO_MAP[key];
        else autoMapped[i] = "skip";
      });
      setMapping(autoMapped);
      setStep(2);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      processFile(file);
    }
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }, [processFile]);

  // ── Mapping helpers ───────────────────────────────────────────────────────
  const updateMapping = (colIdx: number, fieldId: TVFieldId) => {
    setMapping(prev => ({ ...prev, [colIdx]: fieldId }));
  };

  const mappedEmailCol = useMemo(() => {
    return Object.entries(mapping).find(([, v]) => v === "email")?.[0];
  }, [mapping]);

  const mappedNameCol = useMemo(() => {
    return Object.entries(mapping).find(([, v]) => v === "name")?.[0];
  }, [mapping]);

  const canProceedMapping = mappedEmailCol !== undefined;

  // ── Preview validation ────────────────────────────────────────────────────
  const previewRows = rows.slice(0, 5);

  const rowValidation = useMemo(() => {
    const emailIdx = mappedEmailCol != null ? parseInt(mappedEmailCol) : -1;
    const nameIdx = mappedNameCol != null ? parseInt(mappedNameCol) : -1;
    return previewRows.map((row, _i) => {
      const errors: string[] = [];
      if (emailIdx >= 0) {
        const email = row.values[emailIdx] ?? "";
        if (!email) errors.push("Missing email");
        else if (!isValidEmail(email)) errors.push("Invalid email format");
      } else {
        errors.push("No email column mapped");
      }
      if (nameIdx >= 0 && !(row.values[nameIdx] ?? "").trim()) {
        errors.push("Missing name");
      }
      return { rowNum: _i + 2, errors, valid: errors.length === 0 };
    });
  }, [previewRows, mappedEmailCol, mappedNameCol]);

  // ── Import simulation ─────────────────────────────────────────────────────
  const runImport = useCallback(() => {
    const emailIdx = mappedEmailCol != null ? parseInt(mappedEmailCol) : -1;
    const nameIdx = mappedNameCol != null ? parseInt(mappedNameCol) : -1;

    let imported = 0;
    let skipped = 0;
    const errors: RowError[] = [];
    const importedConstituents: { name: string; email: string; [k: string]: string }[] = [];

    rows.forEach((row, i) => {
      const email = emailIdx >= 0 ? (row.values[emailIdx] ?? "").trim() : "";
      const name = nameIdx >= 0 ? (row.values[nameIdx] ?? "").trim() : "";

      if (!email) {
        errors.push({ row: i + 2, field: "Email", reason: "Missing email address" });
        return;
      }
      if (!isValidEmail(email)) {
        errors.push({ row: i + 2, field: "Email", reason: `Invalid email format: "${email}"` });
        return;
      }
      if (existingEmails.has(email.toLowerCase())) {
        if (duplicateMode === "skip") {
          skipped++;
          return;
        }
        // "update" mode — still import (override)
      }
      if (!name && nameIdx >= 0) {
        errors.push({ row: i + 2, field: "Name", reason: "Missing name" });
        return;
      }

      const constituent: Record<string, string> = { name, email };
      Object.entries(mapping).forEach(([colStr, fieldId]) => {
        if (fieldId !== "skip" && fieldId !== "email" && fieldId !== "name") {
          constituent[fieldId] = (row.values[parseInt(colStr)] ?? "").trim();
        }
      });
      importedConstituents.push(constituent as { name: string; email: string; [k: string]: string });
      imported++;
    });

    setImportResult({ imported, skipped, errors });
    setStep(4);

    if (importedConstituents.length > 0) {
      onImport(importedConstituents);
    }
  }, [rows, mapping, mappedEmailCol, mappedNameCol, existingEmails, duplicateMode, onImport]);

  // ── Download error log ────────────────────────────────────────────────────
  const downloadErrorLog = useCallback(() => {
    if (!importResult) return;
    const csvLines = ["Row,Field,Reason"];
    importResult.errors.forEach(e => {
      csvLines.push(`${e.row},"${e.field}","${e.reason}"`);
    });
    const blob = new Blob([csvLines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "import-errors.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [importResult]);

  // ── Reset ────────────────────────────────────────────────────────────────
  const reset = () => {
    setStep(1);
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setImportResult(null);
    setExpandErrors(false);
  };

  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Step indicator */}
      <div className="px-5 pt-4 pb-3 shrink-0">
        <div className="flex items-center justify-center gap-0.5 mb-1">
          <StepDot step={1} current={step} label="Upload" />
          <StepConnector />
          <StepDot step={2} current={step} label="Map Fields" />
          <StepConnector />
          <StepDot step={3} current={step} label="Preview" />
          <StepConnector />
          <StepDot step={4} current={step} label="Results" />
        </div>
      </div>

      {/* ── Step 1: Upload ─────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="flex-1 flex flex-col items-center justify-center px-8 pb-8">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileInput}
            className="hidden"
          />
          <div
            role="button"
            tabIndex={0}
            aria-label="Upload CSV file"
            className={`w-full border-2 border-dashed rounded-lg p-10 flex flex-col items-center gap-4 transition-colors cursor-pointer ${
              dragOver
                ? "border-tv-brand-bg bg-tv-brand-tint/30"
                : "border-tv-border-light hover:border-tv-border-strong bg-tv-surface/40"
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
          >
            <div className="w-12 h-12 rounded-lg bg-tv-brand-tint flex items-center justify-center">
              <Upload size={20} className="text-tv-brand" />
            </div>
            <div className="text-center">
              <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 600 }}>
                Drag &amp; drop your CSV file here
              </p>
              <p className="text-[11px] text-tv-text-secondary mt-1">
                or click to browse &middot; .csv files only
              </p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] text-tv-text-decorative">
              <FileSpreadsheet size={11} />
              Required: Email column
            </div>
            <div className="flex items-center gap-2 text-[10px] text-tv-text-decorative">
              <Check size={11} />
              Recommended: Name, Class Year
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Field Mapping ──────────────────────────────────────────── */}
      {step === 2 && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-5 pb-2 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-[11px] text-tv-brand hover:underline" style={{ fontWeight: 500 }}>
                <ArrowLeft size={11} />Back
              </button>
              <span className="text-[10px] text-tv-text-decorative">{fileName}</span>
            </div>
            <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 600 }}>Map CSV Columns</p>
            <p className="text-[11px] text-tv-text-secondary mt-0.5">
              Match each CSV column to a ThankView field. Columns mapped to &ldquo;Skip&rdquo; won&rsquo;t be imported.
            </p>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-3">
            {/* Column header row */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <span className="text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>CSV Column</span>
              <span className="text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>ThankView Field</span>
            </div>

            {headers.map((header, i) => {
              const mapped = mapping[i] ?? "skip";
              const isAutoMatched = (() => {
                const key = header.toLowerCase().trim();
                return AUTO_MAP[key] !== undefined && mapped === AUTO_MAP[key];
              })();

              return (
                <div
                  key={i}
                  className="grid grid-cols-2 gap-3 py-2.5 border-b border-tv-border-divider last:border-0 items-center"
                >
                  {/* CSV header name */}
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded bg-tv-surface flex items-center justify-center shrink-0">
                      <span className="text-[9px] text-tv-text-decorative" style={{ fontWeight: 700 }}>{i + 1}</span>
                    </div>
                    <span className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>{header}</span>
                    {isAutoMatched && (
                      <span className="text-[8px] text-tv-success bg-tv-success-bg px-1.5 py-0.5 rounded-full shrink-0" style={{ fontWeight: 600 }}>
                        Auto
                      </span>
                    )}
                  </div>

                  {/* Dropdown */}
                  <div className="relative">
                    <select
                      value={mapped}
                      onChange={e => updateMapping(i, e.target.value as TVFieldId)}
                      aria-label={`Map "${headers[i]}" to ThankView field`}
                      className={`w-full appearance-none pl-3 pr-7 py-2 rounded-sm border text-[12px] outline-none transition-colors cursor-pointer ${
                        mapped === "skip"
                          ? "border-tv-border-light text-tv-text-secondary bg-tv-surface"
                          : "border-tv-brand-bg/30 text-tv-text-primary bg-tv-brand-tint/20"
                      }`}
                      style={{ fontWeight: 500 }}
                    >
                      <option value="skip">&mdash; Skip &mdash;</option>
                      {TV_FIELDS.map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tv-text-secondary pointer-events-none" />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-tv-border-divider shrink-0 flex items-center justify-between">
            {!canProceedMapping && (
              <div className="flex items-center gap-1.5 text-[11px] text-tv-warning" style={{ fontWeight: 500 }}>
                <AlertTriangle size={12} />
                Map at least the Email column to proceed
              </div>
            )}
            {canProceedMapping && (
              <span className="text-[11px] text-tv-text-secondary">
                {Object.values(mapping).filter(v => v !== "skip").length} of {headers.length} columns mapped
              </span>
            )}
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedMapping}
              className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontWeight: 600 }}
            >
              Next
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-5 pb-2 shrink-0">
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-[11px] text-tv-brand hover:underline" style={{ fontWeight: 500 }}>
                <ArrowLeft size={11} />Back
              </button>
              <span className="text-[10px] text-tv-text-decorative">{rows.length} total rows</span>
            </div>
            <p className="text-[13px] text-tv-text-primary" style={{ fontWeight: 600 }}>Preview Import</p>
            <p className="text-[11px] text-tv-text-secondary mt-0.5">
              Showing the first {Math.min(5, rows.length)} rows. Errors are highlighted in red.
            </p>
          </div>

          <div className="flex-1 overflow-x-auto px-5 pb-3">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th scope="col" className="px-2 py-2 text-[10px] text-tv-text-label uppercase tracking-wider border-b border-tv-border-divider" style={{ fontWeight: 600 }}>Row</th>
                  {headers.map((h, i) => {
                    const mapped = mapping[i];
                    if (mapped === "skip") return null;
                    const field = TV_FIELDS.find(f => f.id === mapped);
                    return (
                      <th key={i} scope="col" className="px-2 py-2 text-[10px] border-b border-tv-border-divider" style={{ fontWeight: 600 }}>
                        <span className="text-tv-text-label uppercase tracking-wider">{field?.label ?? h}</span>
                      </th>
                    );
                  })}
                  <th scope="col" className="px-2 py-2 text-[10px] text-tv-text-label uppercase tracking-wider border-b border-tv-border-divider w-[80px]" style={{ fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => {
                  const validation = rowValidation[i];
                  return (
                    <tr
                      key={i}
                      className={validation.valid ? "bg-tv-success-bg/60" : "bg-tv-danger-bg/60"}
                    >
                      <td className="px-2 py-2 text-[11px] text-tv-text-secondary border-b border-tv-border-divider" style={{ fontWeight: 500 }}>
                        {validation.rowNum}
                      </td>
                      {headers.map((_, colIdx) => {
                        const mapped = mapping[colIdx];
                        if (mapped === "skip") return null;
                        const val = row.values[colIdx] ?? "";
                        // Highlight cell if it's the error source
                        const isEmailCol = mapped === "email";
                        const isNameCol = mapped === "name";
                        const cellError =
                          (isEmailCol && (!val || !isValidEmail(val))) ||
                          (isNameCol && !val.trim());

                        return (
                          <td
                            key={colIdx}
                            className={`px-2 py-2 text-[11px] border-b border-tv-border-divider ${
                              cellError ? "text-tv-danger" : "text-tv-text-primary"
                            }`}
                            style={{ fontWeight: cellError ? 600 : 400 }}
                          >
                            {val || <span className="text-tv-danger/60 italic">empty</span>}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 border-b border-tv-border-divider">
                        {validation.valid ? (
                          <span className="inline-flex items-center gap-1 text-[10px] text-tv-success" style={{ fontWeight: 600 }}>
                            <CircleCheckBig size={10} />Valid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-tv-danger-bg rounded text-[10px] text-tv-danger" style={{ fontWeight: 600 }}>
                            <AlertTriangle size={9} />{validation.errors[0]}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {rows.length > 5 && (
              <div className="mt-3 px-2 text-[11px] text-tv-text-secondary">
                + {rows.length - 5} more rows will be processed on import
              </div>
            )}
          </div>

          {/* Duplicate handling */}
          <div className="px-5 py-3 border-t border-tv-border-divider shrink-0">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Duplicate Handling</p>
                <p className="text-[10px] text-tv-text-secondary">What to do when an email already exists in this campaign</p>
              </div>
              <div className="flex items-center bg-tv-surface rounded-sm p-0.5">
                <button
                  onClick={() => setDuplicateMode("skip")}
                  className={`px-3 py-1.5 rounded-sm text-[11px] transition-colors ${
                    duplicateMode === "skip"
                      ? "bg-white text-tv-brand shadow-sm"
                      : "text-tv-text-secondary"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  Skip Duplicates
                </button>
                <button
                  onClick={() => setDuplicateMode("update")}
                  className={`px-3 py-1.5 rounded-sm text-[11px] transition-colors ${
                    duplicateMode === "update"
                      ? "bg-white text-tv-brand shadow-sm"
                      : "text-tv-text-secondary"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  Update Existing
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                onClick={runImport}
                className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors"
                style={{ fontWeight: 600 }}
              >
                Import {rows.length} Row{rows.length !== 1 ? "s" : ""}
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Results ────────────────────────────────────────────────── */}
      {step === 4 && importResult && (
        <div className="flex-1 flex flex-col min-h-0 px-5 pt-2 pb-5">
          {/* Summary banner */}
          <div className={`rounded-lg p-5 mb-4 ${
            importResult.errors.length === 0
              ? "bg-tv-success-bg border border-tv-success-border"
              : "bg-tv-warning-bg border border-tv-warning-border"
          }`}>
            <div className="flex items-start gap-3">
              {importResult.errors.length === 0 ? (
                <div className="w-10 h-10 rounded-full bg-tv-success-bg flex items-center justify-center shrink-0">
                  <CircleCheckBig size={20} className="text-tv-success" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-tv-warning-bg flex items-center justify-center shrink-0">
                  <TriangleAlert size={20} className="text-tv-warning" />
                </div>
              )}
              <div>
                <p className="text-[15px] text-tv-text-primary" style={{ fontWeight: 700 }}>Import Complete</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-tv-success" />
                    <span className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>
                      {importResult.imported} imported
                    </span>
                  </div>
                  {importResult.skipped > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-tv-warning" />
                      <span className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>
                        {importResult.skipped} skipped (duplicate)
                      </span>
                    </div>
                  )}
                  {importResult.errors.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-tv-danger" />
                      <span className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>
                        {importResult.errors.length} error{importResult.errors.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Error list (expandable) */}
          {importResult.errors.length > 0 && (
            <div className="rounded-lg border border-tv-border-light overflow-hidden mb-4">
              <button
                onClick={() => setExpandErrors(!expandErrors)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-tv-surface/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className="text-tv-danger" />
                  <span className="text-[12px] text-tv-text-primary" style={{ fontWeight: 600 }}>
                    {importResult.errors.length} Error{importResult.errors.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <ChevronDown
                  size={13}
                  className={`text-tv-text-secondary transition-transform ${expandErrors ? "rotate-180" : ""}`}
                />
              </button>

              {expandErrors && (
                <div className="border-t border-tv-border-divider max-h-[200px] overflow-y-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-tv-surface/50">
                        <th className="px-4 py-2 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Row</th>
                        <th className="px-4 py-2 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Field</th>
                        <th className="px-4 py-2 text-[10px] text-tv-text-label uppercase tracking-wider" style={{ fontWeight: 600 }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importResult.errors.map((err, i) => (
                        <tr key={i} className="border-t border-tv-border-divider">
                          <td className="px-4 py-2 text-[11px] text-tv-text-primary" style={{ fontWeight: 500 }}>#{err.row}</td>
                          <td className="px-4 py-2 text-[11px] text-tv-danger" style={{ fontWeight: 500 }}>{err.field}</td>
                          <td className="px-4 py-2 text-[11px] text-tv-text-secondary">{err.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 mt-auto">
            {importResult.errors.length > 0 && (
              <button
                onClick={downloadErrorLog}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-tv-brand border border-tv-brand-bg/30 rounded-full hover:bg-tv-brand-tint transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Download size={12} />
                Download Error Log
              </button>
            )}
            <button
              onClick={reset}
              className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors"
              style={{ fontWeight: 500 }}
            >
              Upload Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CSVImportWizard;
