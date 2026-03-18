/**
 * LandingPageLivePreviewModal — fullscreen scrollable preview
 */
import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X, Globe, Play, Landmark, Star, Mail,
  Image as ImageIcon,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { FacebookShareModal, type OgData } from "./FacebookShareModal";

type BgKind = "image" | "color" | "gradient";
type GradientDir = "to bottom" | "to right" | "to bottom right" | "to bottom left" | "to top" | "to left";
type LogoId = "shield" | "star" | "mail" | "none";

interface Background {
  id: number;
  name: string;
  kind: BgKind;
  url?: string;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  gradientDir?: GradientDir;
}

export interface LandingPageLivePreviewModalProps {
  open: boolean;
  onClose: () => void;
  name: string;
  navBarColor: string;
  logo: LogoId;
  logoFile: string | null;
  selectedBg: Background | undefined;
  fadeGradient: boolean;
  ctaTextColor: string;
  ctaBtnColor: string;
  secondaryBtnTextColor: string;
  replyBtnColor: string;
  saveBtnColor: string;
  shareBtnColor: string;
  ogData?: OgData;
  onOgChange?: (data: OgData) => void;
}

function isDark(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function bgCss(bg: Background): string {
  if (bg.kind === "color") return bg.color || "#ffffff";
  if (bg.kind === "gradient")
    return `linear-gradient(${bg.gradientDir || "to bottom"}, ${bg.gradientFrom || "#000"}, ${bg.gradientTo || "#fff"})`;
  return "";
}

const DEFAULT_OG: OgData = {
  ogTitle: "Your ThankView from Hartwell University",
  ogDescription: "Thanks to the generosity of alumni like you, we\u2019ve been able to fund 42 new scholarships this year.",
  ogImage: "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=600&q=80",
};

export function LandingPageLivePreviewModal({
  open, onClose, name, navBarColor, logo, logoFile, selectedBg, fadeGradient,
  ctaTextColor, ctaBtnColor, secondaryBtnTextColor, replyBtnColor, saveBtnColor, shareBtnColor,
  ogData, onOgChange,
}: LandingPageLivePreviewModalProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const handleClose = useCallback(() => onClose(), [onClose]);

  const navTextColor = isDark(navBarColor) ? "#ffffffee" : "#1a1a1a";
  const slug = name ? name.toLowerCase().replace(/\s+/g, "-") : "untitled-page";
  const campaignUrl = `https://hartwell.thankview.com/${slug}`;

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const resolvedOg = ogData || DEFAULT_OG;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[9999] flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog" aria-modal="true" aria-label="Landing page preview"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px]" onClick={handleClose} />

            <button
              onClick={handleClose}
              className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white flex items-center justify-center transition-colors"
              aria-label="Close preview"
            >
              <X size={18} />
            </button>

            <motion.div
              className="relative z-10 flex flex-col mx-auto mt-8 mb-0 w-full"
              style={{ maxWidth: 900, height: "calc(100vh - 80px)" }}
              initial={{ y: 40, scale: 0.95 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 40, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="bg-[#2d2d2d] rounded-t-[14px] px-4 py-3 flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 bg-[#1a1a1a] rounded-[8px] px-4 py-1.5 flex items-center gap-2 min-w-0">
                  <Globe size={11} className="text-white/30 shrink-0" />
                  <span className="text-[11px] text-white/50 font-mono truncate">
                    hartwell.thankview.com/{slug}
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-white rounded-b-[14px] border border-t-0 border-[#3a3a3a]">
                {/* Nav bar */}
                <div className="relative px-6 py-4 flex items-center" style={{ backgroundColor: navBarColor }}>
                  {logo !== "none" || logoFile ? (
                    <div className="flex items-center gap-3">
                      {logoFile ? (
                        <img src={logoFile} alt="" className="h-7 object-contain" style={{ filter: isDark(navBarColor) ? "brightness(10)" : "none" }} />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: isDark(navBarColor) ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}>
                          {logo === "shield" && <Landmark size={14} style={{ color: navTextColor }} />}
                          {logo === "star" && <Star size={14} style={{ color: navTextColor }} />}
                          {logo === "mail" && <Mail size={14} style={{ color: navTextColor }} />}
                        </div>
                      )}
                      <span className="text-[14px]" style={{ color: navTextColor, fontWeight: 600 }}>Hartwell University</span>
                    </div>
                  ) : (
                    <span className="text-[14px]" style={{ color: navTextColor, fontWeight: 600 }}>Hartwell University</span>
                  )}
                  <span className="ml-auto text-[11px]" style={{ color: navTextColor, opacity: 0.4 }}>thankview.com</span>
                </div>

                {/* Background area */}
                {selectedBg ? (
                  selectedBg.kind === "image" ? (
                    <div className="relative">
                      <div style={{ aspectRatio: "2.6/1" }} className="overflow-hidden">
                        {selectedBg.url?.startsWith("blob:") ? (
                          <img src={selectedBg.url} alt={selectedBg.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageWithFallback src={selectedBg.url!} alt={selectedBg.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      {fadeGradient && <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-white to-transparent" />}
                    </div>
                  ) : (
                    <div className="relative">
                      <div style={{ aspectRatio: "2.6/1", background: selectedBg.kind === "color" ? selectedBg.color : bgCss(selectedBg) }} />
                      {fadeGradient && <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-white to-transparent" />}
                    </div>
                  )
                ) : (
                  <div style={{ aspectRatio: "2.6/1" }} className="bg-gradient-to-b from-tv-surface to-white flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon size={28} className="text-tv-text-decorative mx-auto mb-2" />
                      <p className="text-[13px] text-tv-text-decorative">No background selected</p>
                    </div>
                  </div>
                )}

                {/* Video player placeholder */}
                <div className="px-8 -mt-6 relative z-10 pb-4">
                  <div className="rounded-[12px] overflow-hidden shadow-2xl max-w-[680px] mx-auto">
                    <div style={{ aspectRatio: "16/9" }} className="bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
                      <div className="w-20 h-20 rounded-full bg-white/25 flex items-center justify-center backdrop-blur-sm border border-white/30">
                        <Play size={28} className="text-white ml-1" fill="white" />
                      </div>
                      <span className="absolute bottom-3 right-3 text-[10px] font-mono px-2 py-1 rounded bg-black/50 text-white">1:08</span>
                    </div>
                  </div>
                </div>

                {/* CTA button */}
                <div className="px-8 py-5 flex justify-center">
                  <span className="inline-block px-10 py-3 rounded-full text-[15px] cursor-default" style={{ backgroundColor: ctaBtnColor, color: ctaTextColor, fontWeight: 600 }}>
                    Give to the Annual Fund
                  </span>
                </div>

                {/* Body text */}
                <div className="px-10 py-4 max-w-[680px] mx-auto">
                  <p className="text-[14px] text-tv-text-secondary leading-relaxed">
                    Thanks to the generosity of alumni like you, we've been able to fund 42 new
                    scholarships this year, providing life-changing opportunities for students across campus.
                  </p>
                  <p className="text-[14px] text-tv-text-secondary leading-relaxed mt-4">
                    Every gift, no matter the size, helps us continue our mission to provide
                    world-class education and support.
                  </p>
                </div>

                <div className="mx-10 border-t border-tv-border-divider" />

                {/* Action buttons */}
                <div className="px-10 py-5 flex flex-row items-center justify-center gap-3">
                  <span className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full border text-[13px] cursor-default" style={{ color: replyBtnColor, borderColor: replyBtnColor + "80", fontWeight: 500 }}>Reply</span>
                  <span className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-[13px] text-white cursor-default" style={{ backgroundColor: saveBtnColor, fontWeight: 500 }}>Save</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setShareModalOpen(true); }}
                    className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-full text-[13px] text-white cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: shareBtnColor, fontWeight: 500 }}
                  >
                    Share on Facebook
                  </button>
                </div>

                <div className="px-8 py-5 bg-tv-surface border-t border-tv-border-divider text-center">
                  <p className="text-[10px] text-tv-text-decorative">Powered by ThankView by EverTrue</p>
                </div>
              </div>
            </motion.div>

            <div className="relative z-10 flex items-center justify-between px-6 py-3 bg-white/90 backdrop-blur-sm border-t border-tv-border-divider shrink-0">
              <span className="text-[11px] text-tv-text-decorative italic">Live Preview &middot; {name || "Untitled Landing Page"}</span>
              <button onClick={handleClose} className="px-5 py-1.5 rounded-full bg-tv-surface text-[12px] text-tv-text-label hover:bg-tv-surface-active transition-colors" style={{ fontWeight: 500 }}>Close Preview</button>
              <span className="text-[11px] text-tv-text-decorative italic">by thankview</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <FacebookShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        initial={resolvedOg}
        campaignUrl={campaignUrl}
        onChange={onOgChange}
      />
    </>
  );
}
