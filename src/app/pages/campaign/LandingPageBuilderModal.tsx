import { useState, useCallback, useEffect } from "react";
import { ChevronLeft, Plus, Globe, Eye, Palette } from "lucide-react";
import { FocusTrap } from "@mantine/core";
import { useToast } from "../../contexts/ToastContext";
import { ColorSwatchPicker, BRAND_PALETTE } from "../../components/ColorSwatchPicker";

export interface SavedLandingPage { id: number; name: string; color: string; accent: string; image?: string; category: string; }

export function LandingPageBuilderModal({ onSave, onClose }: { onSave: (lp: SavedLandingPage) => void; onClose: () => void; }) {
  const { show } = useToast();
  const [lpTitle, setLpTitle] = useState("New Landing Page");
  const [lpColor, setLpColor] = useState("#7c45b0");
  const [lpAccent, setLpAccent] = useState("#a78bfa");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSave = useCallback(() => {
    onSave({ id: Date.now(), name: lpTitle.trim() || "Untitled Landing Page", color: lpColor, accent: lpAccent, category: "Branded" });
  }, [lpTitle, lpColor, lpAccent, onSave]);

  return (
    <FocusTrap active>
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Landing page builder">
      <div className="w-full max-w-[1140px] bg-white rounded-xl border border-tv-border-light shadow-2xl flex flex-col" style={{ maxHeight: "94vh" }}>
        <div className="px-6 py-4 border-b border-tv-border-divider shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-tv-text-secondary hover:text-tv-text-primary transition-colors">
              <ChevronLeft size={18} />
            </button>
            <div>
              <h2 className="text-[17px] text-tv-text-primary leading-tight" style={{ fontWeight: 900 }}>New Landing Page</h2>
              <p className="text-[11px] text-tv-text-secondary">{lpTitle || "New Landing Page"}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Settings panel */}
          <div className="w-[320px] shrink-0 border-r border-tv-border-divider flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              <div>
                <p className="tv-label mb-2">Landing Page Title</p>
                <input value={lpTitle} onChange={e => setLpTitle(e.target.value)} className="w-full border border-tv-border-light rounded-md px-3 py-2.5 text-[13px] text-tv-text-primary outline-none focus:ring-2 focus:ring-tv-brand/20 focus:border-tv-brand transition-colors" />
              </div>
              <ColorSwatchPicker label="Primary Color" value={lpColor} onChange={(hex) => setLpColor(hex)} swatches={BRAND_PALETTE} swatchSize={32} />
              <ColorSwatchPicker label="Accent Color" value={lpAccent} onChange={(hex) => setLpAccent(hex)} swatches={BRAND_PALETTE} swatchSize={32} />
            </div>
          </div>

          {/* Preview panel */}
          <div className="flex-1 bg-tv-surface flex flex-col items-center justify-center p-6 overflow-y-auto">
            <p className="text-[10px] text-tv-text-secondary uppercase tracking-[0.15em] mb-4" style={{ fontWeight: 600 }}>Live preview</p>
            <div className="w-full max-w-[420px]">
              <div className="aspect-[3/4] rounded-lg overflow-hidden shadow-xl relative" style={{ background: `linear-gradient(135deg, ${lpColor}, ${lpAccent})` }}>
                {/* Header */}
                <div className="p-4 flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-white/20" />
                  <p className="text-[10px] text-white/70" style={{ fontWeight: 500 }}>yourschool.edu</p>
                </div>
                {/* Video area */}
                <div className="mx-4 aspect-video rounded-sm bg-black/20 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-[8px] border-l-white border-y-[5px] border-y-transparent ml-1" />
                  </div>
                </div>
                {/* Content area */}
                <div className="p-4 text-center">
                  <p className="text-[12px] text-white/90 mb-1" style={{ fontWeight: 600 }}>Sender Name</p>
                  <p className="text-[9px] text-white/60 mb-3">Your personal message preview...</p>
                  <div className="inline-block px-5 py-2 rounded-sm bg-white/20 text-[10px] text-white" style={{ fontWeight: 600 }}>
                    CTA Button
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-tv-border-divider shrink-0 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-tv-text-secondary hover:text-tv-text-primary transition-colors" style={{ fontWeight: 500 }}>
            Cancel
          </button>
          <button onClick={handleSave} className="flex items-center gap-1.5 px-5 py-2.5 text-[12px] text-white rounded-full bg-tv-brand-bg hover:bg-tv-brand-hover transition-colors" style={{ fontWeight: 600 }}>
            <Globe size={13} />Save Landing Page
          </button>
        </div>
      </div>
    </div>
    </FocusTrap>
  );
}
