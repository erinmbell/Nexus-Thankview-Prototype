import { useState, useCallback, useEffect } from "react";
import { Check, ChevronLeft, Eye, Palette, Image as ImageIcon, Stamp, Settings, Landmark, Heart, RotateCcw, RotateCw, Camera, Bookmark, RefreshCw, X } from "lucide-react";
import { FocusTrap } from "@mantine/core";
import { useToast } from "../../contexts/ToastContext";
import { ColorSwatchPicker, BRAND_PALETTE } from "../../components/ColorSwatchPicker";

export interface SavedEnvelope { id: number; name: string; preview: string; category: string; }

export function EnvelopeBuilderModal({ onSave, onClose }: { onSave: (env: SavedEnvelope) => void; onClose: () => void; }) {
  const { show } = useToast();
  const [envTitle, setEnvTitle] = useState("New Envelope");
  const [envColor, setEnvColor] = useState("#1B3461");
  const [linerColor, setLinerColor] = useState("#C8962A");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = useCallback(() => {
    onSave({ id: Date.now(), name: envTitle.trim() || "Untitled Envelope", preview: envColor, category: "Branded" });
  }, [envTitle, envColor, onSave]);

  return (
    <FocusTrap active>
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Envelope builder">
      <div className="w-full max-w-[1140px] bg-white rounded-[20px] border border-tv-border-light shadow-2xl flex flex-col" style={{ maxHeight: "94vh" }}>
        <div className="px-6 py-4 border-b border-tv-border-divider shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-tv-text-secondary hover:text-tv-text-primary transition-colors">
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
                <p className="tv-label mb-2">Envelope Title</p>
                <input value={envTitle} onChange={e => setEnvTitle(e.target.value)} className="w-full border border-tv-border-light rounded-[10px] px-3 py-2.5 text-[13px] text-tv-text-primary outline-none focus:ring-2 focus:ring-tv-brand/20 focus:border-tv-brand transition-colors" />
              </div>
              <ColorSwatchPicker label="Envelope Color" value={envColor} onChange={(hex) => setEnvColor(hex)} swatches={BRAND_PALETTE} swatchSize={32} />
              <ColorSwatchPicker label="Liner Color" value={linerColor} onChange={(hex) => setLinerColor(hex)} swatches={BRAND_PALETTE} swatchSize={32} />
            </div>
          </div>

          <div className="flex-1 bg-tv-surface flex flex-col items-center justify-center p-6 overflow-y-auto">
            <p className="text-[10px] text-tv-text-secondary uppercase tracking-[0.15em] mb-4" style={{ fontWeight: 600 }}>Live preview</p>
            <div className="w-full max-w-[420px]">
              <div className="aspect-[3/2] rounded-[12px] overflow-hidden shadow-xl relative" style={{ backgroundColor: envColor }}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[18px] italic text-white/90" style={{ fontWeight: 500 }}>Your Constituent's Name</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-tv-border-divider bg-white flex items-center justify-end gap-3 shrink-0">
          <button onClick={() => { show("Envelope saved to your library", "success"); onClose(); }} className="flex items-center gap-1.5 px-4 py-2 text-[12px] text-tv-brand border-2 border-tv-brand rounded-full hover:bg-tv-brand-tint transition-colors" style={{ fontWeight: 600 }}>
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
