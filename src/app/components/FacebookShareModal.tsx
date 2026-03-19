/**
 * FacebookShareModal — OG preview card + editable fields + Copy Share URL.
 */
import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FocusTrap } from "@mantine/core";
import { X, Globe, Copy, Check, Image as ImageIcon, ExternalLink } from "lucide-react";

export interface OgData {
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  initial: OgData;
  campaignUrl: string;
  /** Persist edits back to parent */
  onChange?: (data: OgData) => void;
}

export function FacebookShareModal({ open, onClose, initial, campaignUrl, onChange }: Props) {
  const [ogTitle, setOgTitle] = useState(initial.ogTitle);
  const [ogDescription, setOgDescription] = useState(initial.ogDescription);
  const [ogImage, setOgImage] = useState(initial.ogImage);
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(campaignUrl)}`;

  const handleCopy = useCallback(() => {
    try {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* fallback */
    }
  }, [shareUrl]);

  const handleClose = useCallback(() => {
    onChange?.({ ogTitle, ogDescription, ogImage });
    onClose();
  }, [onClose, onChange, ogTitle, ogDescription, ogImage]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <FocusTrap active>
        <motion.div
          className="fixed inset-0 z-[10000] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog" aria-modal="true" aria-label="Share to Facebook"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            className="relative z-10 bg-white rounded-xl border border-tv-border-light shadow-2xl w-full overflow-hidden"
            style={{ maxWidth: 480 }}
            initial={{ y: 24, scale: 0.96 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 24, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-tv-border-divider">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <span className="text-[15px] text-[#1a1a1a]" style={{ fontWeight: 700 }}>
                  Share on Facebook
                </span>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <X size={14} className="text-[#1a1a1a]" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1 block" style={{ fontWeight: 600 }}>
                    Title
                  </label>
                  <input
                    value={ogTitle}
                    onChange={e => setOgTitle(e.target.value)}
                    placeholder="Page title\u2026"
                    className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1 block" style={{ fontWeight: 600 }}>
                    Description
                  </label>
                  <textarea
                    value={ogDescription}
                    onChange={e => setOgDescription(e.target.value)}
                    placeholder="Page description\u2026"
                    rows={2}
                    className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[13px] outline-none resize-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]/40 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1 block" style={{ fontWeight: 600 }}>
                    Image URL
                  </label>
                  <input
                    value={ogImage}
                    onChange={e => setOgImage(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="w-full border border-tv-border-light rounded-sm px-3 py-2 text-[13px] font-mono outline-none focus:ring-2 focus:ring-[#1877F2]/20 focus:border-[#1877F2]/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5" style={{ fontWeight: 600 }}>
                  Facebook Preview
                </p>
                <div className="border border-[#dadde1] rounded-sm overflow-hidden bg-[#f0f2f5]">
                  <div className="flex">
                    <div className="w-[158px] shrink-0 bg-[#e4e6eb] flex items-center justify-center overflow-hidden" style={{ minHeight: 120 }}>
                      {ogImage ? (
                        <img
                          src={ogImage}
                          alt="Facebook share preview"
                          className="w-full h-full object-cover"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <ImageIcon size={24} className="text-[#bec3c9]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 px-3 py-2.5 flex flex-col justify-center gap-1 bg-[#f0f2f5]">
                      <span className="text-[10px] text-[#65676b] uppercase tracking-wide">
                        hartwell.thankview.com
                      </span>
                      <span className="text-[14px] text-[#1c1e21] leading-tight line-clamp-2" style={{ fontWeight: 600 }}>
                        {ogTitle || "Untitled Page"}
                      </span>
                      <span className="text-[12px] text-[#65676b] leading-snug line-clamp-2">
                        {ogDescription || "No description provided."}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-tv-surface rounded-sm px-3 py-2">
                <Globe size={12} className="text-tv-text-decorative shrink-0" />
                <span className="text-[11px] text-tv-text-secondary font-mono truncate flex-1">
                  {shareUrl}
                </span>
                <ExternalLink size={11} className="text-tv-text-decorative shrink-0" />
              </div>

              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-md text-[13px] text-white transition-colors"
                style={{
                  fontWeight: 600,
                  backgroundColor: copied ? "#16a34a" : "#4338ca",
                }}
              >
                {copied ? (
                  <>
                    <Check size={15} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Share URL
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
        </FocusTrap>
      )}
    </AnimatePresence>
  );
}
