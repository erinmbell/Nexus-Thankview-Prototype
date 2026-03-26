import { useState, useCallback, useEffect, useRef } from "react";
import { Check, ChevronLeft, Eye, Palette, Image as ImageIcon, Stamp, Settings, Landmark, Heart, RotateCcw, RotateCw, Camera, Bookmark, RefreshCw, X } from "lucide-react";
import { FocusTrap } from "@mantine/core";
import { useToast } from "../../contexts/ToastContext";
import { ColorSwatchPicker, BRAND_PALETTE } from "../../components/ColorSwatchPicker";
import { EnvelopePreview } from "../../components/EnvelopePreview";

export interface SavedEnvelope { id: number; name: string; preview: string; category: string; }

/**
 * Simplified envelope builder shown in a modal within the campaign flow.
 * Shares the same validation/save pattern as the full-page `EnvelopeBuilder`
 * (`src/app/pages/EnvelopeBuilder.tsx`) but exposes only the 3 most-used controls.
 * If the full builder's state/validation logic grows, consider extracting a
 * shared `useEnvelopeBuilder()` hook to keep them in sync.
 */
export function EnvelopeBuilderModal({ onSave, onClose }: { onSave: (env: SavedEnvelope) => void; onClose: () => void; }) {
  const { show } = useToast();
  const [envTitle, setEnvTitle] = useState("");
  const [envColor, setEnvColor] = useState("#1B3461");
  const [linerColor, setLinerColor] = useState("#C8962A");
  const [nameError, setNameError] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    triggerRef.current = document.activeElement as HTMLElement;
  }, []);

  const handleClose = () => {
    onClose();
    triggerRef.current?.focus();
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const validateName = useCallback(() => {
    if (!envTitle.trim()) {
      setNameError(true);
      show("Please name your envelope before saving", "warning");
      nameInputRef.current?.focus();
      return false;
    }
    return true;
  }, [envTitle, show]);

  const handleSave = useCallback(() => {
    if (!validateName()) return;
    triggerRef.current?.focus();
    onSave({ id: Date.now(), name: envTitle.trim(), preview: envColor, category: "Branded" });
  }, [envTitle, envColor, onSave, validateName]);

  return (
    <FocusTrap active>
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Envelope builder">
      <div className="w-full max-w-[1140px] bg-white rounded-xl border border-tv-border-light shadow-2xl flex flex-col" style={{ maxHeight: "94vh" }}>
        <div className="px-6 py-4 border-b border-tv-border-divider shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={handleClose} className="w-7 h-7 flex items-center justify-center text-tv-text-secondary hover:text-tv-text-primary transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div>
              <h2 className="text-[17px] text-tv-text-primary leading-tight" style={{ fontWeight: 900 }}>New Envelope</h2>
              <p className="text-[11px] text-tv-text-secondary">{envTitle || "New Envelope"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="w-[320px] shrink-0 border-r border-tv-border-divider flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <p className="tv-label mb-2">Envelope Title <span className="text-red-500">*</span></p>
                <input ref={nameInputRef} value={envTitle} onChange={e => { setEnvTitle(e.target.value); setNameError(false); }} placeholder="Enter envelope name" aria-required="true" aria-invalid={nameError} aria-describedby={nameError ? "env-name-error" : undefined} className={`w-full border rounded-md px-3 py-2.5 text-[13px] text-tv-text-primary outline-none focus:ring-2 transition-colors ${nameError ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "border-tv-border-light focus:ring-tv-brand/20 focus:border-tv-brand"}`} />
                {nameError && <p id="env-name-error" role="alert" className="text-red-500 text-[11px] mt-1">A name is required to save</p>}
              </div>
              <ColorSwatchPicker label="Envelope Color" value={envColor} onChange={(hex) => setEnvColor(hex)} swatches={BRAND_PALETTE} swatchSize={32} />
              <ColorSwatchPicker label="Liner Color" value={linerColor} onChange={(hex) => setLinerColor(hex)} swatches={BRAND_PALETTE} swatchSize={32} />
            </div>
          </div>

          <div className="flex-1 bg-tv-surface flex flex-col items-center justify-center p-6 overflow-y-auto">
            <p className="text-[10px] text-tv-text-secondary uppercase tracking-[0.15em] mb-4" style={{ fontWeight: 600 }}>Live preview</p>
            <div className="w-full max-w-[420px] flex flex-col items-center gap-6">
              <EnvelopePreview
                envelopeColor={envColor}
                linerColor={linerColor}
                primaryColor={linerColor}
                secondaryColor={envColor}
                postmarkColor={linerColor}
                showName
                mode="front"
                width={360}
              />
              <EnvelopePreview
                envelopeColor={envColor}
                linerColor={linerColor}
                primaryColor={linerColor}
                secondaryColor={envColor}
                postmarkColor={linerColor}
                mode="thumbnail"
                width={200}
              />
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-tv-border-divider bg-white flex items-center justify-end gap-3 shrink-0">
          <button onClick={() => { if (!validateName()) return; show("Envelope saved to your library", "success"); handleClose(); }} className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-tv-brand border-2 border-tv-brand rounded-full hover:bg-tv-brand-tint transition-colors" style={{ fontWeight: 600 }}>
            <Bookmark size={13} />Save to Library
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-2.5 text-[13px] text-white rounded-full transition-colors bg-tv-brand-bg hover:bg-tv-brand-hover" style={{ fontWeight: 600 }}>
            <Check size={13} />Save & Use
          </button>
        </div>
      </div>
    </div>
    </FocusTrap>
  );
}
