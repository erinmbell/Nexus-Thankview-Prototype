import { useState, useEffect, type ReactNode } from "react";
import { FocusTrap } from "@mantine/core";
import { Bookmark } from "lucide-react";
import { INPUT_CLS, TEXTAREA_CLS } from "../pages/campaign/styles";

interface SaveTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (name: string, desc: string) => void;
  defaultName?: string;
  /** Subtitle text below the heading */
  subtitle?: string;
  /** Content shown in the "Configuration to save" summary box */
  summaryContent?: ReactNode;
  /** Accessible ID prefix for the modal heading */
  idPrefix?: string;
}

export function SaveTemplateModal({
  opened,
  onClose,
  onSave,
  defaultName = "",
  subtitle = "Save this campaign configuration for reuse.",
  summaryContent,
  idPrefix = "save-template",
}: SaveTemplateModalProps) {
  const [name, setName] = useState(defaultName);
  const [desc, setDesc] = useState("");

  // Reset fields when the modal opens
  useEffect(() => {
    if (opened) { setName(defaultName); setDesc(""); }
  }, [opened, defaultName]);

  // Close on Escape (WCAG 2.1.1)
  useEffect(() => {
    if (!opened) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [opened, onClose]);

  if (!opened) return null;

  return (
    <FocusTrap active>
      <div
        className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${idPrefix}-title`}
      >
        <div className="bg-white rounded-xl border border-tv-border-light shadow-xl w-full max-w-[460px] mx-4" onClick={e => e.stopPropagation()}>
          <div className="px-6 pt-6 pb-4 border-b border-tv-border-divider">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-md flex items-center justify-center shrink-0 bg-tv-star-bg">
                <Bookmark size={18} className="text-tv-warning" />
              </div>
              <div>
                <h2 id={`${idPrefix}-title`} className="text-tv-text-primary" style={{ fontSize: "16px", fontWeight: 700 }}>Save as Template</h2>
                <p className="text-[12px] text-tv-text-secondary">{subtitle}</p>
              </div>
            </div>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="text-[12px] text-tv-text-label mb-1.5 block font-semibold">Template Name</label>
              <input
                type="text"
                autoComplete="off"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Annual Fund Thank You"
                className={INPUT_CLS}
                autoFocus
              />
            </div>
            <div>
              <label className="text-[12px] text-tv-text-label mb-1.5 block font-semibold">Description <span className="text-tv-text-decorative">(optional)</span></label>
              <textarea
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="Brief description of what this template is for..."
                rows={3}
                className={TEXTAREA_CLS}
              />
            </div>
            {/* Summary of what will be saved */}
            {summaryContent && (
              <div className="p-3 bg-tv-surface rounded-md border border-tv-border-divider">
                <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-2 font-semibold">Configuration to save</p>
                {summaryContent}
              </div>
            )}
          </div>
          <div className="px-6 pb-6 flex justify-end gap-2">
            <button onClick={onClose}
              className="px-4 py-2 text-[13px] text-tv-text-primary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors">
              Cancel
            </button>
            <button
              disabled={!name.trim()}
              onClick={() => onSave(name.trim(), desc.trim())}
              className={`flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full transition-colors ${
                name.trim()
                  ? "text-white bg-tv-brand-bg hover:bg-tv-brand-hover"
                  : "text-white/60 bg-tv-brand-bg/40 cursor-not-allowed"
              } font-semibold`}>
              <Bookmark size={13} />Save Template
            </button>
          </div>
        </div>
      </div>
    </FocusTrap>
  );
}
