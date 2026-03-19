import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, GripHorizontal } from "lucide-react";
import { LivePreviewPanel } from "./LivePreviewPanel";
import { TV } from "../../theme";
import { TvTooltip } from "../../components/TvTooltip";
import type { FlowStep } from "./types";
import { ENVELOPE_DESIGNS } from "./types";
import { useDesignLibrary } from "../../contexts/DesignLibraryContext";

const MIN_W = 320;
const MIN_H = 300;
const MAX_W = 800;
const MAX_H = 900;
const DEFAULT_W = 480;
const DEFAULT_H = 540;

interface FloatingPreviewProps {
  step: FlowStep;
  visible: boolean;
  onClose: () => void;
  constraintRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Floating, draggable, resizable live preview card for the multi-step builder.
 * Wraps LivePreviewPanel directly — no duplicate header/viewport chrome.
 */
export function FloatingPreview({ step, visible, onClose, constraintRef }: FloatingPreviewProps) {
  const { customEnvelopes } = useDesignLibrary();
  const [size, setSize] = useState({ w: DEFAULT_W, h: DEFAULT_H });
  const resizing = useRef(false);
  const startPos = useRef({ x: 0, y: 0, w: 0, h: 0 });

  const isSms = step.type === "sms";

  // ── Resize via corner drag handle ──
  const onResizeStart = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizing.current = true;
    startPos.current = { x: e.clientX, y: e.clientY, w: size.w, h: size.h };

    const onMove = (ev: PointerEvent) => {
      if (!resizing.current) return;
      const dw = ev.clientX - startPos.current.x;
      const dh = ev.clientY - startPos.current.y;
      setSize({
        w: Math.min(MAX_W, Math.max(MIN_W, startPos.current.w + dw)),
        h: Math.min(MAX_H, Math.max(MIN_H, startPos.current.h + dh)),
      });
    };
    const onUp = () => {
      resizing.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [size]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          drag
          dragConstraints={constraintRef}
          dragMomentum={false}
          dragElastic={0}
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed z-50 flex flex-col select-none"
          style={{
            width: size.w,
            height: size.h,
            bottom: 72,
            left: 190,
          }}
        >
          {/* ── Thin drag bar ── */}
          <div
            className="flex items-center justify-between px-2.5 py-1.5 bg-white border border-tv-border-strong rounded-t-xl cursor-grab active:cursor-grabbing shrink-0"
            style={{ borderBottom: "none" }}
          >
            <div className="flex items-center gap-1.5">
              <GripHorizontal size={11} className="text-tv-text-decorative" />
              <span className="text-[10px] text-tv-text-label font-semibold uppercase tracking-wider">
                Preview
              </span>
            </div>
            <TvTooltip label="Close preview">
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="w-5 h-5 rounded-full flex items-center justify-center text-tv-text-secondary hover:bg-tv-surface-hover transition-colors"
              >
                <X size={10} />
              </button>
            </TvTooltip>
          </div>

          {/* ── LivePreviewPanel (owns its own header, tabs, viewport switcher) ── */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 rounded-b-xl border border-tv-border-strong"
            style={{ boxShadow: TV.shadowModal }}
          >
            <LivePreviewPanel
              subject={step.subject || ""}
              body={step.body || ""}
              senderName={step.senderName || ""}
              senderEmail={step.senderEmail || ""}
              font={step.font}
              envelopeId={step.envelopeId ?? 1}
              thumbnailType={step.thumbnailType}
              includeVideoThumbnail={step.includeVideoThumbnail !== false}
              btnBg={step.btnBg || "#7c45b0"}
              btnText={step.btnText || "#ffffff"}
              ctaText={step.ctaText || ""}
              ctaUrl={step.ctaUrl || ""}
              attachedVideo={step.attachedVideo || null}
              bodyFontFamily={step.bodyFontFamily}
              bodyFontSize={step.bodyFontSize}
              bodyTextColor={step.bodyTextColor}
              bodyLineHeight={step.bodyLineHeight}
              landingPageColor={step.landingPageColor}
              landingPageAccent={step.landingPageAccent}
              landingPageImage={step.landingPageImage}
              envTextBefore={step.envTextBefore}
              envNameFormat={step.envNameFormat}
              envTextAfter={step.envTextAfter}
              selectedSignature={step.selectedSignature}
              allowSaveButton={step.allowSaveButton}
              allowShareButton={step.allowShareButton}
              allowVideoReply={step.allowVideoReply}
              allowEmailReply={step.allowEmailReply}
              allowDownloadVideo={step.allowDownloadVideo}
              closedCaptionsEnabled={step.closedCaptionsEnabled}
              smsMode={isSms}
              smsBody={step.smsBody || ""}
              smsPhoneNumber={step.smsPhoneNumber || ""}
            />
          </div>

          {/* ── Resize handle (bottom-right corner) ── */}
          <div
            onPointerDown={onResizeStart}
            className="absolute bottom-0 right-0 w-5 h-5 cursor-nwse-resize flex items-center justify-center"
            style={{ touchAction: "none" }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" className="text-tv-text-decorative">
              <path d="M9 1L1 9M9 5L5 9M9 8L8 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
