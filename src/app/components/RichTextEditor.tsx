/**
 * RichTextEditor — contentEditable-based rich text editor with a toolbar matching
 * the ThankView design system (bg-tv-surface, rounded-sm buttons, tv-brand active).
 *
 * Toolbar: B, I, U, Strikethrough | Link, Image | Align L/C/R/J | UL, OL | Indent, Outdent | Templates, Signature
 */
import { useState, useCallback, useRef, useEffect, useLayoutEffect } from "react";
import { MergeFieldPicker } from "./MergeFieldPicker";
import { createPortal } from "react-dom";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  Link as LinkIcon, ImageIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, IndentIncrease, IndentDecrease,
  FileText, PenLine, ChevronDown, X, Check, ExternalLink, Braces, Minus,
} from "lucide-react";
import type { MergeFieldDef } from "../pages/campaign/types";
import {
  EMAIL_BODY_FONTS, EMAIL_BODY_FONT_SIZES, EMAIL_BODY_LINE_HEIGHTS, EMAIL_TEXT_COLORS,
} from "../pages/campaign/types";

import { SAVED_SIGNATURES } from "../pages/campaign/SharedUI";
import { TvTooltip } from "./TvTooltip";

// ── Mock templates ───────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "thank-you",
    name: "Thank You",
    html: `<p>Dear {{first_name}},</p><p>Thank you so much for your generous gift of {{last_gift_amount}}. Your support makes a real difference in the lives of our students and the future of our programs.</p><p>We are deeply grateful for your continued partnership.</p><p>With appreciation,</p>`,
  },
  {
    id: "annual-appeal",
    name: "Annual Appeal",
    html: `<p>Dear {{first_name}},</p><p>As we approach the end of this fiscal year, I wanted to personally reach out and share the incredible impact your past support has had on our community.</p><p>This year, we're aiming to raise $2M for student scholarships. Every gift — no matter the size — moves us closer to that goal.</p><p>Will you consider making a gift today?</p>`,
  },
  {
    id: "event-invite",
    name: "Event Invite",
    html: `<p>Dear {{first_name}},</p><p>You're cordially invited to our Annual Gala on Saturday, April 18th at 6:00 PM. Join us for an evening of celebration, connection, and inspiration.</p><p>Please RSVP by April 10th using the link below. We look forward to seeing you there!</p>`,
  },
];

// ── Props ────────────────────────────────────────────────────────────────────
export interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  compact?: boolean;
  mergeFields?: string[];
  onInsertMergeField?: (field: string) => void;
  extraMergeFields?: MergeFieldDef[];
  wrapperClassName?: string;
  bodyClassName?: string;
  bodyFontFamily?: string;
  bodyFontSize?: number;
  bodyTextColor?: string;
  bodyLineHeight?: number;
  onBodyFontFamilyChange?: (v: string) => void;
  onBodyFontSizeChange?: (v: number) => void;
  onBodyTextColorChange?: (v: string) => void;
  onBodyLineHeightChange?: (v: number) => void;
  /** Called when user inserts a signature into the body */
  onInsertSignature?: (sigHtml: string) => void;
}

// ── Portal dropdown — renders at body level to avoid overflow clipping ───────
function PortalDropdown({
  anchorRef,
  children,
  onClose,
  width = 200,
  align = "right",
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  onClose: () => void;
  width?: number;
  align?: "left" | "right";
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    let top = rect.bottom + 6;
    let left = align === "right" ? rect.right - width : rect.left;
    if (left + width > window.innerWidth - 8) left = window.innerWidth - width - 8;
    if (left < 8) left = 8;
    // If overflows bottom, open upward (estimate 300px max height)
    if (top + 300 > window.innerHeight - 8) {
      top = Math.max(8, rect.top - 300 - 6);
    }
    setPos({ top, left });
  }, [anchorRef, width, align]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        className="fixed z-[9999] bg-white rounded-md border border-tv-border-light shadow-xl"
        style={pos ? { top: pos.top, left: pos.left, width } : { visibility: "hidden" as const }}
      >
        {children}
      </div>
    </>,
    document.body,
  );
}

// ── Toolbar button ───────────────────────────────────────────────────────────
function TbBtn({
  icon: Icon,
  active,
  onClick,
  title,
  size,
}: {
  icon: typeof Bold;
  active?: boolean;
  onClick: () => void;
  title?: string;
  size: number;
}) {
  return (
    <TvTooltip label={title || ""}>
      <button
        type="button"
        onClick={onClick}
        aria-label={title}
        className={`p-1.5 rounded-[6px] transition-colors ${
          active
            ? "bg-tv-brand-bg/10 text-tv-brand"
            : "text-tv-text-secondary hover:bg-tv-surface-hover hover:text-tv-text-primary"
        }`}
      >
        <Icon size={size} />
      </button>
    </TvTooltip>
  );
}

function TbSep({ h }: { h: number }) {
  return <div className="w-px bg-tv-border-divider mx-1" style={{ height: h }} />;
}

// ── Helper: check if a command is active ─────────────────────────────────────
function isCommandActive(cmd: string): boolean {
  try {
    return document.queryCommandState(cmd);
  } catch {
    return false;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing\u2026",
  compact = false,
  mergeFields,
  onInsertMergeField,
  extraMergeFields,
  wrapperClassName,
  bodyClassName,
  bodyFontFamily,
  bodyFontSize,
  bodyTextColor,
  bodyLineHeight,
  onBodyFontFamilyChange,
  onBodyFontSizeChange,
  onBodyTextColorChange,
  onBodyLineHeightChange,
  onInsertSignature,
}: RichTextEditorProps) {
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState("https://");
  const [linkText, setLinkText] = useState("");
  const [linkNewTab, setLinkNewTab] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showMergePicker, setShowMergePicker] = useState(false);
  const [, setForceUpdate] = useState(0);
  const linkPopRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const mergeRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  const iconSize = compact ? 12 : 13;
  const barPy = compact ? "py-1.5" : "py-2";
  const barPx = compact ? "px-2" : "px-3";
  const editorPy = compact ? "py-2.5" : "py-3";
  const editorPx = compact ? "px-3" : "px-3.5";
  const minH = compact ? "min-h-[120px]" : "min-h-[180px]";

  // Sync external value changes
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (value !== editorRef.current.innerHTML) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (linkPopRef.current && !linkPopRef.current.contains(e.target as Node)) {
        setShowLinkPopover(false);
      }
      if (templateRef.current && !templateRef.current.contains(e.target as Node)) {
        setShowTemplates(false);
      }
      if (mergeRef.current && !mergeRef.current.contains(e.target as Node)) {
        setShowMergePicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const exec = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
    setForceUpdate(n => n + 1);
  }, [handleInput]);

  // ── Link popover handlers ─────────────────────────────────────────────────
  const openLinkPopover = useCallback(() => {
    setLinkUrl("https://");
    const sel = window.getSelection();
    setLinkText(sel?.toString() || "");
    setShowLinkPopover(true);
  }, []);

  const insertLink = useCallback(() => {
    if (!linkUrl || linkUrl === "https://") return;
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (linkText && (!sel || sel.isCollapsed)) {
      const a = document.createElement("a");
      a.href = linkUrl;
      a.textContent = linkText;
      a.className = "text-tv-brand underline";
      if (linkNewTab) a.target = "_blank";
      sel?.getRangeAt(0)?.insertNode(a);
    } else {
      document.execCommand("createLink", false, linkUrl);
    }
    handleInput();
    setShowLinkPopover(false);
  }, [linkUrl, linkText, linkNewTab, handleInput]);

  // ── Image handler ─────────────────────────────────────────────────────────
  const insertImage = useCallback(() => {
    const url = window.prompt("Image URL:");
    if (url) {
      exec("insertImage", url);
    }
  }, [exec]);

  // ── Template select ───────────────────────────────────────────────────────
  const applyTemplate = useCallback(
    (html: string) => {
      if (editorRef.current) {
        editorRef.current.innerHTML = html;
        isInternalChange.current = true;
        onChange(html);
      }
      setShowTemplates(false);
    },
    [onChange]
  );

  // ── Signature — picker dropdown ───────────────────────────────────────────
  const [showSigPicker, setShowSigPicker] = useState(false);
  const sigRef = useRef<HTMLDivElement>(null);

  // ── Insert merge field into editor ────────────────────────────────────────
  const handleMergeInsert = useCallback((token: string) => {
    if (onInsertMergeField) {
      onInsertMergeField(token);
    } else {
      editorRef.current?.focus();
      document.execCommand("insertHTML", false, ` ${token} `);
      handleInput();
    }
  }, [onInsertMergeField, handleInput]);

  return (
    <div className={`border ${wrapperClassName || "border-tv-border-light"} rounded-md overflow-visible transition-colors`}>
      {/* ── Font & styling bar ── */}
      {onBodyFontFamilyChange && (
        <div className={`flex items-center gap-2.5 ${barPx} py-2 bg-tv-surface border-b border-tv-border-light flex-wrap rounded-t-[9px]`}>
          {/* Font family */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-tv-text-secondary uppercase tracking-wider whitespace-nowrap" style={{ fontWeight: 600 }}>Font</label>
            <select
              value={bodyFontFamily || EMAIL_BODY_FONTS[0].value}
              onChange={e => onBodyFontFamilyChange?.(e.target.value)}
              title="Font Family"
              className="border border-tv-border-light rounded-sm px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white cursor-pointer"
              style={{ fontFamily: bodyFontFamily || EMAIL_BODY_FONTS[0].value }}
            >
              {EMAIL_BODY_FONTS.map(f => (
                <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>{f.label}</option>
              ))}
            </select>
          </div>
          <div className="h-5 w-px bg-tv-border-light" />
          {/* Font size */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-tv-text-secondary uppercase tracking-wider whitespace-nowrap" style={{ fontWeight: 600 }}>Size</label>
            <select
              value={bodyFontSize || 14}
              onChange={e => onBodyFontSizeChange?.(Number(e.target.value))}
              title="Font Size"
              className="border border-tv-border-light rounded-sm px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white cursor-pointer"
            >
              {EMAIL_BODY_FONT_SIZES.map(s => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
          </div>
          <div className="h-5 w-px bg-tv-border-light" />
          {/* Text color picker */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-tv-text-secondary uppercase tracking-wider whitespace-nowrap" style={{ fontWeight: 600 }}>Color</label>
            <div className="relative group/tcRte">
              <button type="button" title="Text Color" className="flex items-center gap-1.5 border border-tv-border-light rounded-sm px-3 py-1.5 text-[13px] bg-white hover:border-tv-border-strong transition-colors cursor-pointer">
                <span className="w-4 h-4 rounded-[4px] border border-tv-border-light shrink-0" style={{ backgroundColor: bodyTextColor || "#1e293b" }} />
                <span className="text-tv-text-primary">{EMAIL_TEXT_COLORS.find(c => c.value === (bodyTextColor || "#1e293b"))?.label || "Custom"}</span>
                <ChevronDown size={11} className="text-tv-text-secondary" />
              </button>
              <div className="absolute top-full left-0 mt-1.5 p-2.5 bg-white border border-tv-border-light rounded-md shadow-xl z-30 hidden group-hover/tcRte:grid grid-cols-5 gap-1.5 w-[155px]">
                {EMAIL_TEXT_COLORS.map(c => (
                  <button key={c.value} type="button" onClick={() => onBodyTextColorChange?.(c.value)} title={c.label}
                    className={`w-5.5 h-5.5 rounded-full border-2 transition-transform hover:scale-110 ${(bodyTextColor || "#1e293b") === c.value ? "border-tv-brand ring-1 ring-tv-brand/30" : "border-tv-border-light"}`}
                    style={{ backgroundColor: c.value }} />
                ))}
              </div>
            </div>
          </div>
          <div className="h-5 w-px bg-tv-border-light" />
          {/* Line height */}
          <div className="flex items-center gap-1.5">
            <label className="text-[10px] text-tv-text-secondary uppercase tracking-wider whitespace-nowrap" style={{ fontWeight: 600 }}>Spacing</label>
            <select
              value={bodyLineHeight || 1.5}
              onChange={e => onBodyLineHeightChange?.(Number(e.target.value))}
              title="Line Spacing"
              className="border border-tv-border-light rounded-sm px-3 py-1.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand bg-white cursor-pointer"
            >
              {EMAIL_BODY_LINE_HEIGHTS.map(lh => (
                <option key={lh.value} value={lh.value}>{lh.label}</option>
              ))}
            </select>
          </div>
          <div className="h-5 w-px bg-tv-border-light" />
          {/* Horizontal rule button */}
          <button type="button" onClick={() => exec("insertHorizontalRule")} title="Insert Horizontal Rule"
            className="p-1.5 rounded-sm transition-colors text-tv-text-secondary hover:bg-tv-surface-hover hover:text-tv-text-primary">
            <Minus size={iconSize} />
          </button>
        </div>
      )}
      {/* ── Toolbar ── */}
      <div className={`flex items-center gap-0.5 ${barPx} ${barPy} bg-tv-surface border-b border-tv-border-light flex-wrap ${!onBodyFontFamilyChange ? "rounded-t-[9px]" : ""}`}>
        {/* Formatting */}
        <TbBtn icon={Bold} size={iconSize} active={isCommandActive("bold")} onClick={() => exec("bold")} title="Bold" />
        <TbBtn icon={Italic} size={iconSize} active={isCommandActive("italic")} onClick={() => exec("italic")} title="Italic" />
        <TbBtn icon={UnderlineIcon} size={iconSize} active={isCommandActive("underline")} onClick={() => exec("underline")} title="Underline" />
        <TbBtn icon={Strikethrough} size={iconSize} active={isCommandActive("strikeThrough")} onClick={() => exec("strikeThrough")} title="Strikethrough" />

        <TbSep h={compact ? 14 : 16} />

        {/* Link & Image */}
        <div className="relative" ref={linkPopRef}>
          <TbBtn icon={LinkIcon} size={iconSize} onClick={openLinkPopover} title="Link" />
          {showLinkPopover && (
            <PortalDropdown
              anchorRef={linkPopRef}
              onClose={() => setShowLinkPopover(false)}
              width={280}
              align="left"
            >
              <div className="p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Insert Link</span>
                  <button onClick={() => setShowLinkPopover(false)} className="text-tv-text-secondary hover:text-tv-text-primary">
                    <X size={12} />
                  </button>
                </div>
                <div>
                  <label className="text-[10px] text-tv-text-secondary block mb-0.5" style={{ fontWeight: 500 }}>URL</label>
                  <input
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full border border-tv-border-light rounded-sm px-2.5 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-tv-text-secondary block mb-0.5" style={{ fontWeight: 500 }}>Display Text</label>
                  <input
                    value={linkText}
                    onChange={e => setLinkText(e.target.value)}
                    placeholder="Link text\u2026"
                    className="w-full border border-tv-border-light rounded-sm px-2.5 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={linkNewTab}
                    onChange={() => setLinkNewTab(!linkNewTab)}
                    className="sr-only peer"
                  />
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-tv-brand/40 ${
                      linkNewTab ? "bg-tv-brand-bg border-tv-brand-bg" : "border-tv-border-light"
                    }`}
                    aria-hidden="true"
                  >
                    {linkNewTab && <Check size={10} className="text-white" />}
                  </span>
                  <span className="text-[11px] text-tv-text-secondary flex items-center gap-1">
                    <ExternalLink size={10} aria-hidden="true" /> Open in new tab
                  </span>
                </label>
                <button
                  onClick={insertLink}
                  disabled={!linkUrl || linkUrl === "https://"}
                  className="w-full py-1.5 text-[11px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ fontWeight: 600 }}
                >
                  Insert
                </button>
              </div>
            </PortalDropdown>
          )}
        </div>
        <TbBtn icon={ImageIcon} size={iconSize} onClick={insertImage} title="Image" />

        <TbSep h={compact ? 14 : 16} />

        {/* Alignment */}
        <TbBtn icon={AlignLeft} size={iconSize} active={isCommandActive("justifyLeft")} onClick={() => exec("justifyLeft")} title="Align Left" />
        <TbBtn icon={AlignCenter} size={iconSize} active={isCommandActive("justifyCenter")} onClick={() => exec("justifyCenter")} title="Align Center" />
        <TbBtn icon={AlignRight} size={iconSize} active={isCommandActive("justifyRight")} onClick={() => exec("justifyRight")} title="Align Right" />
        <TbBtn icon={AlignJustify} size={iconSize} active={isCommandActive("justifyFull")} onClick={() => exec("justifyFull")} title="Justify" />

        <TbSep h={compact ? 14 : 16} />

        {/* Lists */}
        <TbBtn icon={List} size={iconSize} active={isCommandActive("insertUnorderedList")} onClick={() => exec("insertUnorderedList")} title="Bullet List" />
        <TbBtn icon={ListOrdered} size={iconSize} active={isCommandActive("insertOrderedList")} onClick={() => exec("insertOrderedList")} title="Numbered List" />

        <TbSep h={compact ? 14 : 16} />

        {/* Indent */}
        <TbBtn icon={IndentIncrease} size={iconSize} onClick={() => exec("indent")} title="Indent" />
        <TbBtn icon={IndentDecrease} size={iconSize} onClick={() => exec("outdent")} title="Outdent" />

        <TbSep h={compact ? 14 : 16} />

        {/* Templates dropdown */}
        <div className="relative" ref={templateRef}>
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-[6px] text-[11px] transition-colors ${
              showTemplates
                ? "bg-tv-brand-bg/10 text-tv-brand"
                : "text-tv-text-secondary hover:bg-tv-surface-hover hover:text-tv-text-primary"
            }`}
            style={{ fontWeight: 500 }}
          >
            <FileText size={iconSize - 1} />
            <span className="hidden sm:inline">Templates</span>
            <ChevronDown size={9} />
          </button>
          {showTemplates && (
            <PortalDropdown
              anchorRef={templateRef}
              onClose={() => setShowTemplates(false)}
              width={200}
              align="right"
            >
              <p className="px-3 py-1 text-[10px] text-tv-text-secondary uppercase tracking-wider" style={{ fontWeight: 600 }}>Insert Template</p>
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  onClick={() => applyTemplate(t.html)}
                  className="w-full text-left px-3 py-2 text-[12px] text-tv-text-primary hover:bg-tv-surface transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  {t.name}
                </button>
              ))}
            </PortalDropdown>
          )}
        </div>

        {/* Signature — picker dropdown */}
        {onInsertSignature && (<div className="relative" ref={sigRef}>
          <button
            type="button"
            onClick={() => { setShowSigPicker(!showSigPicker); setShowTemplates(false); setShowMergePicker(false); }}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-[6px] text-[11px] transition-colors ${
              showSigPicker
                ? "bg-tv-brand-bg/10 text-tv-brand"
                : "text-tv-text-secondary hover:bg-tv-surface-hover hover:text-tv-text-primary"
            }`}
            style={{ fontWeight: 500 }}
            title="Email Signature"
            aria-label="Email Signature"
          >
            <PenLine size={iconSize - 1} />
            <span className="hidden sm:inline">Signature</span>
            <ChevronDown size={9} />
          </button>
          {showSigPicker && (
            <PortalDropdown
              anchorRef={sigRef}
              onClose={() => setShowSigPicker(false)}
              width={260}
              align="right"
            >
              <div className="px-3 py-2 border-b border-tv-border-divider">
                <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>Email Signatures</p>
              </div>
              <div className="py-1.5 max-h-[240px] overflow-y-auto">
                {SAVED_SIGNATURES.map(sig => (
                    <button
                      key={sig.id}
                      onClick={() => {
                        onInsertSignature?.(sig.html);
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
            </PortalDropdown>
          )}
        </div>)}

        {/* Merge Fields — searchable picker */}
        <TbSep h={compact ? 14 : 16} />
        <div className="relative" ref={mergeRef}>
          <button
            type="button"
            onClick={() => setShowMergePicker(!showMergePicker)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-[6px] text-[11px] transition-colors ${
              showMergePicker
                ? "bg-tv-brand-bg/10 text-tv-brand"
                : "text-tv-text-secondary hover:bg-tv-surface-hover hover:text-tv-text-primary"
            }`}
            style={{ fontWeight: 500 }}
            title="Insert Merge Field"
          >
            <Braces size={iconSize - 1} />
            <span className="hidden sm:inline">Merge Fields</span>
            <ChevronDown size={9} />
          </button>
          {showMergePicker && (
            <MergeFieldPicker
              onInsert={handleMergeInsert}
              onClose={() => setShowMergePicker(false)}
              compact={compact}
              extraFields={extraMergeFields}
            />
          )}
        </div>
      </div>

      {/* ── Editor area ── */}
      <div className={`rounded-b-[9px] overflow-hidden ${bodyClassName || ""}`}>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyUp={() => setForceUpdate(n => n + 1)}
          onMouseUp={() => setForceUpdate(n => n + 1)}
          data-placeholder={placeholder}
          style={{
            fontFamily: bodyFontFamily || undefined,
            fontSize: bodyFontSize ? `${bodyFontSize}px` : undefined,
            color: bodyTextColor || undefined,
            lineHeight: bodyLineHeight || undefined,
          }}
          className={`w-full ${editorPx} ${editorPy} ${minH} text-[13px] text-tv-text-primary outline-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&:empty]:before:content-[attr(data-placeholder)] [&:empty]:before:text-tv-text-secondary/50 transition-colors`}
          dangerouslySetInnerHTML={{ __html: value || "" }}
        />
      </div>
    </div>
  );
}

export default RichTextEditor;
