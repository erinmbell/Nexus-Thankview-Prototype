import { useState, useEffect, useCallback } from "react";
import { X, Play, Pause, Volume2, VolumeX, Maximize2 } from "lucide-react";
import { TV } from "../theme";

type DesignOption = "none" | "single-swoop" | "double-swoop" | "single-stripe" | "double-stripes" | "triple-stripes" | "airmail-stripe";
type PostmarkOption = "black" | "white" | "none";
type StampStyle = "classic" | "forever" | "crest" | "heart";

interface LivePreviewModalProps {
  open: boolean;
  onClose: () => void;
  envelopeColor: string;
  nameColor: string;
  primaryColor: string;
  linerColor: string;
  design: DesignOption;
  swoop1Color: string;
  swoop2Color: string;
  stripe1Color: string;
  stripe2Color: string;
  postmark: PostmarkOption;
  postmarkText: string;
  stampPreview: string | null;
  logoPreview: string | null;
  backFlapLogoPreview: string | null;
  stampStyle?: StampStyle;
}

export function LivePreviewModal({ open, onClose, envelopeColor, nameColor, primaryColor }: LivePreviewModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col" role="dialog" aria-modal="true" aria-label="Live preview">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} />

      <button onClick={onClose} aria-label="Close preview" className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-colors">
        <X size={18} />
      </button>

      <div className="relative flex-1 flex flex-col items-center justify-center overflow-y-auto">
        {/* Envelope preview */}
        <div className="w-[440px] aspect-[3/2] rounded-xl overflow-hidden shadow-2xl relative" style={{ backgroundColor: envelopeColor }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[18px] italic" style={{ color: nameColor, fontWeight: 500 }}>Your Constituent's Name</span>
          </div>
        </div>

        {/* Video player */}
        <div className="mt-8 relative w-full max-w-[600px] bg-black rounded-lg overflow-hidden shadow-2xl" style={{ aspectRatio: "16/10" }}>
          <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <button onClick={() => setIsPlaying(!isPlaying)} aria-label={isPlaying ? "Pause" : "Play"} className="w-20 h-20 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center transition-colors">
              {isPlaying ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white ml-1" />}
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsPlaying(!isPlaying)} className="text-white">{isPlaying ? <Pause size={16} /> : <Play size={16} />}</button>
              <div className="flex-1 h-1 bg-white/20 rounded-full" />
              <span className="text-[11px] text-white/60 font-mono">0:00 / 6:19</span>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button className="px-10 py-3.5 rounded-full text-white text-[16px] hover:shadow-lg" style={{ backgroundColor: TV.brandBg, fontWeight: 600 }}>
            Give to the Annual Fund
          </button>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-center px-6 py-3 bg-white/90 backdrop-blur-sm border-t border-tv-border-divider">
        <button onClick={onClose} className="px-4 py-1.5 rounded-full bg-tv-surface text-[11px] text-tv-text-label hover:bg-tv-surface-active transition-colors" style={{ fontWeight: 500 }}>Close Preview</button>
      </div>
    </div>
  );
}
