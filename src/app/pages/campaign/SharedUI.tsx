/**
 * SharedUI — Small reusable presentational components used by
 * CreateCampaign, MultiStepBuilder, and other campaign sub-panels.
 *
 * Extracting these eliminates repeated inline JSX for toolbars,
 * merge-field dropdowns, and emoji pickers across the campaign builder.
 */
import { type ComponentType, type ReactNode, useState, useRef, useLayoutEffect } from "react";
import {
  Bold, Italic, Underline, Link, AlignLeft, List,
  IndentIncrease, IndentDecrease, Braces, PenLine, Check, X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { TvTooltip } from "../../components/TvTooltip";
import { EMOJI_CATEGORIES } from "./types";
import { MergeFieldPicker } from "../../components/MergeFieldPicker";
import {
  TOOLBAR_BTN_CLS,
  DROPDOWN_CLS,
  RTE_WRAPPER_CLS,
  RTE_WRAPPER_BASE_CLS,
  RTE_TOOLBAR_CLS,
  RTE_BODY_CLS,
  RTE_FIRST_BAR_CLS,
  EMOJI_ITEM_CLS,
  SECTION_HEADING_CLS,
  SECTION_HEADING_STYLE,
  LABEL_CLS,
} from "./styles";

// ═══════════════════════════════════════════════════════════════════════════════
//  TvLabel — design-system-compliant <label> using .tv-label (font-weight: 600 baked in)
// ══════════════════════════════════════════════════════════════════════════════
export function TvLabel({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <label
      className={className ? `${LABEL_CLS} ${className}` : LABEL_CLS}
      style={style}
    >
      {children}
    </label>
  );
}

// ── Toolbar icon descriptors ────────────────────────────────────────────────
type ToolbarItem = readonly [label: string, icon: ComponentType<{ size?: number }>];

const FULL_TOOLBAR: ToolbarItem[] = [
  ["Bold", Bold],
  ["Italic", Italic],
  ["Underline", Underline],
  ["Insert link", Link],
  ["Align left", AlignLeft],
  ["List", List],
  ["Increase indent", IndentIncrease],
  ["Decrease indent", IndentDecrease],
];

const MINI_TOOLBAR: ToolbarItem[] = FULL_TOOLBAR.slice(0, 6); // no indent buttons

// ═══════════════════════════════════════════════════════════════════════════════
//  Saved email signatures — mock data for the signature picker
// ═══════════════════════════════════════════════════════════════════════════════
export interface EmailSignature {
  id: number;
  name: string;
  title?: string;
  org?: string;
  phone?: string;
  email?: string;
  isDefault?: boolean;
  /** Pre-formatted HTML for insertion into the email body */
  html: string;
}

export const SAVED_SIGNATURES: EmailSignature[] = [
  { id: 1, name: "Erin Beler", title: "Director of Annual Giving", org: "Hartwell University", phone: "(555) 234-5678", email: "erin.beler@hartwell.edu", isDefault: true,
    html: "\n\n\u2014\nErin Beler\nDirector of Annual Giving\nHartwell University\nerin.beler@hartwell.edu | (555) 234-5678" },
  { id: 2, name: "Erin Beler", title: "VP, Advancement", org: "Hartwell University", phone: "(555) 234-5678", email: "erin.beler@hartwell.edu",
    html: "\n\nBest,\nErin Beler\nVP, Advancement | Hartwell University" },
  { id: 3, name: "Hartwell Giving Team", org: "Hartwell University Office of Advancement", email: "giving@hartwell.edu",
    html: "\n\n\u2014\nHartwell Giving Team\nHartwell University Office of Advancement\ngiving@hartwell.edu" },
  { id: 4, name: "Erin Beler (Informal)", title: "Annual Giving", org: "Hartwell University", email: "erin.beler@hartwell.edu",
    html: "\n\nCheers,\nErin" },
];

// ═══════════════════════════════════════════════════════════════════════════════
//  RichTextToolbar — a row of formatting buttons with optional merge-field button
// ═══════════════════════════════════════════════════════════════════════════════
export function RichTextToolbar({
  variant = "full",
  mergeTarget,
  onInsertMerge,
  className,
  onInsertSignature,
}: {
  /** "full" includes indent buttons; "mini" is 6 icons only */
  variant?: "full" | "mini";
  /** If provided, renders inline merge-field pills after the toolbar divider */
  mergeTarget?: string;
  /** Called when a merge pill is clicked (receives the field token, e.g. "{{first_name}}") */
  onInsertMerge?: (field: string) => void;
  className?: string;
  /** Called when a signature is selected for insertion */
  onInsertSignature?: (sigHtml: string) => void;
}) {
  const items = variant === "full" ? FULL_TOOLBAR : MINI_TOOLBAR;
  const [showPicker, setShowPicker] = useState(false);
  const [showSigPicker, setShowSigPicker] = useState(false);
  const sigBtnRef = useRef<HTMLButtonElement>(null);
  const [sigPos, setSigPos] = useState<{ top: number; left: number } | null>(null);

  const openSigPicker = () => {
    if (sigBtnRef.current) {
      const rect = sigBtnRef.current.getBoundingClientRect();
      const w = 260;
      let left = rect.left;
      if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
      if (left < 8) left = 8;
      let top = rect.bottom + 6;
      if (top + 220 > window.innerHeight - 8) top = Math.max(8, rect.top - 220 - 6);
      setSigPos({ top, left });
    }
    setShowSigPicker(!showSigPicker);
    setShowPicker(false);
  };

  return (
    <div className={className || RTE_TOOLBAR_CLS}>
      {items.map(([label, Icon], i) => (
        <TvTooltip key={i} label={label}>
          <button aria-label={label} className={TOOLBAR_BTN_CLS}>
            <Icon size={12} />
          </button>
        </TvTooltip>
      ))}
      {onInsertMerge && (
        <>
          <div className="h-3.5 w-px bg-tv-border-light mx-0.5" />
          <div className="relative">
            <button
              onClick={() => { setShowPicker(!showPicker); setShowSigPicker(false); }}
              className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] transition-colors ${
                showPicker
                  ? "bg-tv-brand-bg/10 text-tv-brand"
                  : "text-tv-text-secondary hover:bg-tv-surface-hover hover:text-tv-brand"
              }`}
              title="Insert merge field"
            >
              <Braces size={11} />
              <span>Merge Fields</span>
            </button>
            {showPicker && (
              <MergeFieldPicker
                onInsert={onInsertMerge}
                onClose={() => setShowPicker(false)}
                compact
              />
            )}
          </div>
        </>
      )}
      {onInsertSignature && (
        <>
          <div className="h-3.5 w-px bg-tv-border-light mx-0.5" />
          <div className="relative">
            <button
              ref={sigBtnRef}
              onClick={openSigPicker}
              className={`flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] transition-colors ${
                showSigPicker
                  ? "bg-tv-brand-bg/10 text-tv-brand"
                  : "text-tv-text-secondary hover:bg-tv-surface-hover hover:text-tv-brand"
              }`}
              title="Insert email signature"
              aria-label="Insert email signature"
            >
              <PenLine size={11} />
              <span>Signature</span>
            </button>
            {showSigPicker && createPortal(
              <>
                <div className="fixed inset-0 z-[9998]" onClick={() => setShowSigPicker(false)} />
                <div
                  className="fixed z-[9999] w-[260px] bg-white rounded-md border border-tv-border-light shadow-xl overflow-hidden"
                  style={sigPos ? { top: sigPos.top, left: sigPos.left } : { visibility: "hidden" as const }}
                >
                  <div className="px-3 py-2 border-b border-tv-border-divider">
                    <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Insert Signature</p>
                  </div>
                  <div className="py-1.5 max-h-[240px] overflow-y-auto">
                    {SAVED_SIGNATURES.map(sig => (
                      <button
                        key={sig.id}
                        onClick={() => {
                          onInsertSignature(sig.html);
                          setShowSigPicker(false);
                        }}
                        className="w-full text-left px-3 py-2 flex items-start gap-2 transition-colors hover:bg-tv-surface-hover"
                        style={{ fontSize: 14 }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 500 }}>
                            {sig.name}
                            {sig.isDefault && (
                              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full bg-tv-brand-bg/10 text-tv-brand" style={{ fontWeight: 500 }}>Default</span>
                            )}
                          </p>
                          {sig.title && <p className="text-[10px] text-tv-text-secondary truncate">{sig.title}</p>}
                          {sig.org && <p className="text-[10px] text-tv-text-decorative truncate">{sig.org}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </>,
              document.body,
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  MergeFieldDropdown — popover that lists all merge fields for insertion
//  Now wraps the full MergeFieldPicker with search, categories & favorites
// ═══════════════════════════════════════════════════════════════════════════════
export function MergeFieldDropdown({
  onSelect,
  onClose,
  width = "w-[200px]",
}: {
  onSelect: (field: string) => void;
  onClose: () => void;
  width?: string;
}) {
  return (
    <MergeFieldPicker
      onInsert={onSelect}
      onClose={onClose}
      compact
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  EmojiDropdown — emoji picker with categories
// ═══════════════════════════════════════════════════════════════════════════════
export function EmojiDropdown({
  onSelect,
  onClose,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState(0);
  const cat = EMOJI_CATEGORIES[tab];
  return (
    <div className={DROPDOWN_CLS} style={{ width: 260 }}>
      {/* Category tabs */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-tv-border-light overflow-x-auto">
        {EMOJI_CATEGORIES.map((c, i) => (
          <button
            key={c.label}
            onClick={() => setTab(i)}
            className={`px-2 py-1 rounded-full text-[10px] whitespace-nowrap transition-colors ${
              i === tab ? "bg-tv-brand-bg text-white" : "text-tv-text-secondary hover:bg-tv-surface-hover"
            }`}
            style={{ fontWeight: i === tab ? 600 : 400 }}
          >
            {c.label}
          </button>
        ))}
      </div>
      {/* Emoji grid */}
      <div className="p-2 grid grid-cols-8 gap-0.5 max-h-[160px] overflow-y-auto">
        {cat.emojis.map(e => (
          <button
            key={e}
            onClick={() => { onSelect(e); onClose(); }}
            className={EMOJI_ITEM_CLS}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  SimpleRTE — self-contained rich-text editor block (toolbar + textarea)
//  Used for message bodies that don't need active formatting state.
// ═══════════════════════════════════════════════════════════════════════════════
export function SimpleRTE({
  value,
  onChange,
  placeholder,
  ariaLabel,
  rows = 6,
  variant = "full",
  onInsertMerge,
  wrapperClassName,
  bodyClassName,
  bodyStyle,
  onInsertSignature,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  ariaLabel: string;
  rows?: number;
  variant?: "full" | "mini";
  onInsertMerge?: (field: string) => void;
  /** Extra CSS class for the outer border wrapper (e.g. warning border color) */
  wrapperClassName?: string;
  /** Extra CSS class for the textarea body area (e.g. warning background tint) */
  bodyClassName?: string;
  /** Inline styles applied to the textarea (font, size, color, line-height) */
  bodyStyle?: React.CSSProperties;
  /** Called when a signature is selected for insertion */
  onInsertSignature?: (sigHtml: string) => void;
}) {
  return (
    <div className={`${wrapperClassName ? RTE_WRAPPER_BASE_CLS : RTE_WRAPPER_CLS} ${wrapperClassName || ""}`}>
      <RichTextToolbar
        variant={variant}
        onInsertMerge={onInsertMerge}
        onInsertSignature={onInsertSignature}
        className={`${RTE_TOOLBAR_CLS} ${RTE_FIRST_BAR_CLS}`}
      />
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
        aria-label={ariaLabel}
        style={bodyStyle}
        className={`${RTE_BODY_CLS} transition-colors ${bodyClassName || ""}`}
      />
    </div>
  );
}
