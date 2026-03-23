/**
 * Animated envelope open sequence for the ThankView landing page preview.
 * Envelope opens → card rises → expands to full landing page.
 *
 * Sequence (auto-plays after mount):
 *   1. Front of envelope visible (~1 s pause)
 *   2. Envelope flips to show back
 *   3. Back flap opens upward
 *   4. Card slides up out of envelope with video / message
 *   5. Video auto-plays (user can pause)
 *
 * Respects prefers-reduced-motion: skips straight to the card-revealed state.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { EnvelopePreview, type EnvelopePreviewProps } from "./EnvelopePreview";
import { Play, Pause, RotateCcw, Volume2, Maximize, Reply, Download, ExternalLink } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
type AnimationPhase = "front" | "flipping" | "back" | "flap-opening" | "card-rising" | "done" | "expanding" | "landing-page";

export interface LandingPageBackground {
  /** "color" | "gradient" | "image" */
  kind: "color" | "gradient" | "image";
  /** Solid colour or primary gradient colour */
  color?: string;
  /** Gradient start colour */
  gradientFrom?: string;
  /** Gradient end colour */
  gradientTo?: string;
  /** Gradient direction, e.g. "to bottom" */
  gradientDir?: string;
  /** Background image URL */
  imageUrl?: string;
}

export interface EnvelopeOpenAnimationProps {
  /** All the envelope visual props (colours, stamp, design, etc.) */
  envelope: Omit<EnvelopePreviewProps, "mode" | "width">;
  /** Width of the envelope. Defaults to 320. */
  width?: number;
  /** Whether there is a video (shows play button on card). */
  hasVideo?: boolean;
  /** Whether to show the video-free message variant instead. */
  sendWithoutVideo?: boolean;
  /** Sender name shown on the card. */
  senderName?: string;
  /** Message body text (used when sendWithoutVideo). */
  messageBody?: string;
  /** CTA button text. */
  ctaText?: string;
  /** CTA button colour. */
  ctaColor?: string;
  /** Landing page background. Defaults to offwhite gradient. */
  landingPageBg?: LandingPageBackground;
  /** Auto-start the animation? Defaults to true. */
  autoPlay?: boolean;
  /** Called when animation completes. */
  onComplete?: () => void;
  /** Called when user clicks to replay. */
  onReplay?: () => void;
}

const DEFAULT_BG = "linear-gradient(160deg, #f0edf5 0%, #e8e4ef 40%, #ddd8e8 100%)";

function landingBgCss(bg?: LandingPageBackground): string {
  if (!bg) return DEFAULT_BG;
  if (bg.kind === "color" && bg.color) return bg.color;
  if (bg.kind === "gradient" && bg.gradientFrom && bg.gradientTo)
    return `linear-gradient(${bg.gradientDir || "to bottom"}, ${bg.gradientFrom}, ${bg.gradientTo})`;
  if (bg.kind === "image" && bg.imageUrl) return DEFAULT_BG; // image handled separately
  return DEFAULT_BG;
}

// ── Timing (ms) ────────────────────────────────────────────────────────────
const FRONT_PAUSE = 1000;
const FLIP_DURATION = 0.6;
const FLAP_DURATION = 0.5;
const CARD_RISE_DURATION = 0.7;
const FLAP_DELAY = 0.15;
const CARD_DELAY = 0.2;
const EXPAND_PAUSE = 600;   // pause after card rises before expanding
const EXPAND_DURATION = 0.8; // card expands to landing page

// ── Component ──────────────────────────────────────────────────────────────
export function EnvelopeOpenAnimation({
  envelope,
  width = 320,
  hasVideo = true,
  sendWithoutVideo = false,
  senderName = "Kelley Molt",
  messageBody = "Dear friend, I wanted to reach out personally to thank you for your generous support...",
  ctaText = "View Your ThankView",
  ctaColor = "#7c45b0",
  landingPageBg,
  autoPlay = true,
  onComplete,
}: EnvelopeOpenAnimationProps) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<AnimationPhase>(reducedMotion ? "done" : "front");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const height = width * 0.65; // envelope aspect ratio
  const cardWidth = width * 0.85;
  // Estimate card height based on content: video + message + CTA
  const videoH = (hasVideo && !sendWithoutVideo) ? cardWidth * 0.56 : 0;
  const cardHeight = videoH + 140; // video + text/CTA area

  // Phase sequencing
  useEffect(() => {
    if (reducedMotion || !autoPlay) return;
    if (phase === "front") {
      timerRef.current = setTimeout(() => setPhase("flipping"), FRONT_PAUSE);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase, autoPlay, reducedMotion]);

  const handleFlipComplete = useCallback(() => {
    if (phase === "flipping") setPhase("back");
  }, [phase]);

  useEffect(() => {
    if (phase === "back") {
      timerRef.current = setTimeout(() => setPhase("flap-opening"), 200);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  const handleFlapComplete = useCallback(() => {
    if (phase === "flap-opening") setPhase("card-rising");
  }, [phase]);

  const handleCardComplete = useCallback(() => {
    if (phase === "card-rising") {
      setPhase("done");
    }
  }, [phase]);

  // After card is fully up ("done"), pause then start expanding
  useEffect(() => {
    if (phase === "done") {
      timerRef.current = setTimeout(() => setPhase("expanding"), EXPAND_PAUSE);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [phase]);

  const handleExpandComplete = useCallback(() => {
    if (phase === "expanding") {
      setPhase("landing-page");
      if (hasVideo && !sendWithoutVideo) setIsVideoPlaying(true);
      onComplete?.();
    }
  }, [phase, hasVideo, sendWithoutVideo, onComplete]);

  // Restart animation
  const replay = useCallback(() => {
    setIsVideoPlaying(false);
    setPhase("front");
  }, []);

  const showFront = phase === "front";
  const flapOpen = phase === "flap-opening" || phase === "card-rising" || phase === "done" || phase === "expanding" || phase === "landing-page";
  const cardVisible = phase === "card-rising" || phase === "done" || phase === "expanding" || phase === "landing-page";
  const cardFullyUp = phase === "done" || phase === "expanding" || phase === "landing-page";
  const isExpanding = phase === "expanding" || phase === "landing-page";
  const isLandingPage = phase === "landing-page";
  const envelopeVisible = !isExpanding && !isLandingPage;

  const bgCss = landingBgCss(landingPageBg);
  const hasImage = landingPageBg?.kind === "image" && !!landingPageBg.imageUrl;

  return (
    <div className="flex flex-col w-full h-full">
      {/* Evertrue banner — always visible */}
      <div className="flex items-center justify-between px-5 py-2 bg-white border-b border-tv-border-divider shrink-0">
        <div className="flex items-center gap-1.5">
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <path d="M3 3l8 4.5L3 12V3zm18 9l-8 4.5L21 21V12z" fill="var(--tv-brand)" />
          </svg>
          <span className="text-[15px] text-tv-text-primary" style={{ fontWeight: 700 }}>evertrue</span>
        </div>
        <button
          onClick={replay}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tv-surface text-[11px] text-tv-text-label hover:bg-tv-surface-active transition-colors"
          style={{ fontWeight: 500 }}
        >
          <RotateCcw size={12} />Replay
        </button>
      </div>

      {/* Main content area — background crossfades */}
      <div className="flex-1 relative overflow-y-auto">
        {/* Background layer — fades in the chosen landing page bg */}
        <motion.div
          className="absolute inset-0"
          style={{ background: bgCss }}
          animate={{ opacity: isLandingPage ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />
        {hasImage && (
          <motion.img
            src={landingPageBg!.imageUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            animate={{ opacity: isLandingPage ? 1 : 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />
        )}

        {/* Envelope layer — centered, fades out */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ opacity: envelopeVisible ? 1 : 0, scale: envelopeVisible ? 1 : 0.9 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{ pointerEvents: envelopeVisible ? "auto" : "none" }}
        >
          <div className="flex flex-col items-center">
            {/* Card — slides up above the envelope */}
            <AnimatePresence>
              {(cardVisible && !isExpanding) && (
                <motion.div
                  className="rounded-lg shadow-xl border border-tv-border-light bg-white overflow-hidden"
                  style={{ position: "relative", zIndex: 5 }}
                  initial={{ width: cardWidth, height: 0, opacity: 0, marginBottom: 0 }}
                  animate={{
                    width: cardWidth,
                    height: "auto",
                    opacity: 1,
                    marginBottom: cardFullyUp ? -20 : -height * 0.35,
                  }}
                  transition={{
                    duration: CARD_RISE_DURATION,
                    delay: !cardFullyUp ? CARD_DELAY : 0,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  onAnimationComplete={handleCardComplete}
                >
                  <CardContent
                    hasVideo={hasVideo}
                    sendWithoutVideo={sendWithoutVideo}
                    senderName={senderName}
                    messageBody={messageBody}
                    ctaText={ctaText}
                    ctaColor={ctaColor}
                    cardWidth={cardWidth}
                    isPlaying={false}
                    onTogglePlay={() => {}}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Envelope with 3D flip */}
            <div style={{ width, perspective: 1200 }}>
              <div
                className="relative"
                style={{ width, height, transformStyle: "preserve-3d" }}
              >
                <motion.div
                  className="absolute inset-0"
                  style={{ transformStyle: "preserve-3d" }}
                  initial={{ rotateY: 0 }}
                  animate={{ rotateY: showFront ? 0 : 180 }}
                  transition={{ duration: FLIP_DURATION, ease: [0.4, 0, 0.2, 1] }}
                  onAnimationComplete={handleFlipComplete}
                >
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                    <EnvelopePreview {...envelope} mode="front" width={width} />
                  </div>
                  <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                    <BackEnvelope
                      envelopeColor={envelope.envelopeColor}
                      linerColor={envelope.linerColor}
                      width={width}
                      height={height}
                      flapOpen={flapOpen}
                      flapDuration={FLAP_DURATION}
                      flapDelay={FLAP_DELAY}
                      onFlapComplete={handleFlapComplete}
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Landing page layer — fades in */}
        <motion.div
          className="absolute inset-0 flex items-start justify-center overflow-y-auto"
          animate={{ opacity: isExpanding || isLandingPage ? 1 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{ pointerEvents: isLandingPage ? "auto" : "none" }}
        >
          <div className="relative flex flex-col items-center w-full max-w-[480px] py-6 px-4">
            <div className="w-full bg-white rounded-lg shadow-2xl overflow-hidden">
              <CardContent
                hasVideo={hasVideo}
                sendWithoutVideo={sendWithoutVideo}
                senderName={senderName}
                messageBody={messageBody}
                ctaText={ctaText}
                ctaColor={ctaColor}
                cardWidth={Math.min(480, width * 1.4)}
                isPlaying={isVideoPlaying}
                onTogglePlay={() => setIsVideoPlaying(!isVideoPlaying)}
              />
              {/* Divider */}
              <div className="mx-auto my-3" style={{ width: "25%", height: 1, backgroundColor: "var(--tv-border-divider)" }} />
              {/* Action buttons */}
              <div className="flex items-center justify-center gap-3 pb-4 pt-1">
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-md border text-tv-brand border-tv-brand/30 bg-white text-[13px]" style={{ fontWeight: 500 }}>
                  <Reply size={14} />Reply
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-md text-white text-[13px]" style={{ fontWeight: 500, backgroundColor: ctaColor }}>
                  <Download size={14} />Save
                </button>
                <button className="flex items-center gap-1.5 px-4 py-2 rounded-md border text-tv-brand border-tv-brand/30 bg-white text-[13px]" style={{ fontWeight: 500 }}>
                  Share On Facebook <ExternalLink size={14} />
                </button>
              </div>
            </div>
            {/* Footer */}
            <div className="flex items-center justify-between w-full mt-4 px-2">
              <span className="text-[11px] text-tv-text-decorative underline">Privacy Policy</span>
              <div className="flex items-center gap-1 text-tv-text-decorative text-[11px]">
                <svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z" fill="currentColor" />
                </svg>
                by <span style={{ fontWeight: 600 }}>thankview</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Back of envelope (SVG) ─────────────────────────────────────────────────
function BackEnvelope({
  envelopeColor,
  linerColor,
  width,
  height,
  flapOpen,
  flapDuration,
  flapDelay,
  onFlapComplete,
}: {
  envelopeColor: string;
  linerColor: string;
  width: number;
  height: number;
  flapOpen: boolean;
  flapDuration: number;
  flapDelay: number;
  onFlapComplete: () => void;
}) {
  const vw = 400;
  const vh = 260;
  const aspect = vh / vw;

  return (
    <div className="relative" style={{ width, height: width * aspect }}>
      {/* Envelope body */}
      <svg
        width={width}
        height={width * aspect}
        viewBox={`0 0 ${vw} ${vh}`}
        style={{ display: "block", borderRadius: 8, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }}
      >
        {/* Body */}
        <rect x={0} y={0} width={vw} height={vh} fill={envelopeColor} />

        {/* Liner (V shape inside) */}
        <path
          d={`M4 0 L${vw / 2} ${vh * 0.5} L${vw - 4} 0 Z`}
          fill={linerColor}
          opacity={0.9}
        />

        {/* Side flaps (triangles from edges) */}
        <path d={`M0 0 L${vw * 0.35} ${vh * 0.5} L0 ${vh} Z`} fill={adjust(envelopeColor, -8)} opacity={0.6} />
        <path d={`M${vw} 0 L${vw * 0.65} ${vh * 0.5} L${vw} ${vh} Z`} fill={adjust(envelopeColor, -8)} opacity={0.6} />

        {/* Bottom flap */}
        <path
          d={`M0 ${vh} L${vw / 2} ${vh * 0.55} L${vw} ${vh} Z`}
          fill={adjust(envelopeColor, -15)}
          opacity={0.7}
        />

        {/* Fold shadow line across the top (where flap folds) */}
        <line x1={4} y1={2} x2={vw - 4} y2={2} stroke="rgba(0,0,0,0.1)" strokeWidth={1} />
      </svg>

      {/* Animated top flap (positioned over the SVG) */}
      <motion.div
        className="absolute left-0 right-0 top-0"
        style={{
          transformOrigin: "top center",
          zIndex: 2,
        }}
        initial={{ rotateX: 0 }}
        animate={{ rotateX: flapOpen ? -180 : 0 }}
        transition={{ duration: flapDuration, delay: flapDelay, ease: [0.4, 0, 0.2, 1] }}
        onAnimationComplete={onFlapComplete}
      >
        <svg
          width={width}
          height={width * aspect * 0.52}
          viewBox={`0 0 ${vw} ${vh * 0.52}`}
          style={{ display: "block" }}
        >
          {/* Top flap triangle */}
          <path
            d={`M2 0 L${vw / 2} ${vh * 0.5} L${vw - 2} 0 Z`}
            fill={adjust(envelopeColor, 12)}
          />
          {/* Liner inside flap (visible when flap is face-up) */}
          <path
            d={`M8 2 L${vw / 2} ${vh * 0.46} L${vw - 8} 2 Z`}
            fill={linerColor}
            opacity={0.5}
          />
          {/* Subtle fold shadow at base */}
          <line x1={4} y1={1} x2={vw - 4} y2={1} stroke="rgba(0,0,0,0.15)" strokeWidth={1.5} />
        </svg>
      </motion.div>
    </div>
  );
}

// ── Card content (mimics the ThankView landing page) ────────────────────────
function CardContent({
  hasVideo,
  sendWithoutVideo,
  senderName,
  messageBody,
  ctaText,
  ctaColor,
  cardWidth,
  isPlaying,
  onTogglePlay,
}: {
  hasVideo: boolean;
  sendWithoutVideo: boolean;
  senderName: string;
  messageBody: string;
  ctaText: string;
  ctaColor: string;
  cardWidth: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) {
  const showVideo = hasVideo && !sendWithoutVideo;
  const videoH = cardWidth * 0.65;
  const controlsH = 28;
  const iconSz = cardWidth < 300 ? 10 : 12;

  return (
    <div className="flex flex-col">
      {showVideo && (
        <div className="flex flex-col">
          {/* Video area */}
          <div
            className="relative flex items-center justify-center cursor-pointer overflow-hidden"
            style={{ height: videoH, background: "#c8cfe0" }}
            onClick={onTogglePlay}
          >
            {/* Black letterbox top bar */}
            <div className="absolute top-0 left-0 right-0 bg-black" style={{ height: videoH * 0.14 }} />

            {/* ThankView branding in center */}
            <div className="relative flex flex-col items-center justify-center" style={{ marginTop: videoH * 0.04 }}>
              {/* Logo mark + wordmark */}
              <div className="flex items-center gap-1.5">
                <svg width={iconSz + 6} height={iconSz + 6} viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14l-4-4 1.41-1.41L11 13.17l5.59-5.59L18 9l-7 7z" fill="#2d3a6d" opacity="0.7" />
                </svg>
                <span className="text-[#2d3a6d]" style={{ fontSize: cardWidth * 0.065, fontWeight: 700, letterSpacing: "-0.02em" }}>
                  thankview
                </span>
              </div>

              {/* Play button overlay */}
              <button
                className="mt-2 rounded-full flex items-center justify-center transition-colors"
                style={{
                  width: cardWidth * 0.11,
                  height: cardWidth * 0.11,
                  backgroundColor: "rgba(100,116,170,0.35)",
                  border: "2px solid rgba(100,116,170,0.5)",
                }}
                onClick={(e) => { e.stopPropagation(); onTogglePlay(); }}
              >
                {isPlaying ? (
                  <Pause size={iconSz + 2} className="text-[#2d3a6d]" fill="#2d3a6d" />
                ) : (
                  <Play size={iconSz + 2} className="text-[#2d3a6d] ml-px" fill="#2d3a6d" />
                )}
              </button>
            </div>

            {/* Confetti / hearts decoration bottom-right */}
            <div className="absolute" style={{ bottom: 8, right: 8 }}>
              <svg width={cardWidth * 0.14} height={cardWidth * 0.1} viewBox="0 0 50 35" fill="none">
                {[
                  { x: 10, y: 5, r: 8 }, { x: 25, y: 2, r: 6 }, { x: 38, y: 8, r: 5 },
                  { x: 5, y: 18, r: 5 }, { x: 20, y: 15, r: 7 }, { x: 35, y: 20, r: 4 },
                  { x: 15, y: 28, r: 6 }, { x: 30, y: 30, r: 5 }, { x: 42, y: 25, r: 6 },
                ].map((d, i) => (
                  <path
                    key={i}
                    d={`M${d.x} ${d.y + d.r * 0.3} l${d.r * 0.3} -${d.r * 0.3} l${d.r * 0.3} ${d.r * 0.3} l-${d.r * 0.3} ${d.r * 0.4} l-${d.r * 0.3} -${d.r * 0.4}z`}
                    fill="#2d3a6d"
                    opacity={0.5 + Math.random() * 0.3}
                  />
                ))}
              </svg>
            </div>
          </div>

          {/* Video controls bar */}
          <div
            className="flex items-center gap-1.5 px-2"
            style={{ height: controlsH, backgroundColor: "#1a2340" }}
          >
            <RotateCcw size={iconSz} className="text-white/70 shrink-0" />
            <Volume2 size={iconSz} className="text-white/70 shrink-0" />
            {/* Progress bar */}
            <div className="flex-1 h-[3px] bg-white/20 rounded-full overflow-hidden mx-1">
              {isPlaying ? (
                <motion.div
                  className="h-full rounded-full bg-[#4a7dff]"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 15, ease: "linear" }}
                />
              ) : (
                <div className="h-full rounded-full bg-[#4a7dff]" style={{ width: "100%" }} />
              )}
            </div>
            <span className="text-white/60 shrink-0" style={{ fontSize: cardWidth * 0.028, fontWeight: 500 }}>
              6:19 / 6:19
            </span>
            <Maximize size={iconSz} className="text-white/70 shrink-0" />
          </div>
        </div>
      )}

      {/* CTA Button */}
      <div className="py-3 text-center">
        <span
          className="inline-block px-5 py-2 rounded-md text-white"
          style={{ backgroundColor: ctaColor, fontWeight: 600, fontSize: cardWidth * 0.038 }}
        >
          {ctaText}
        </span>
      </div>

      {/* Message text */}
      <div className="px-4 pb-2">
        {(sendWithoutVideo || !hasVideo) ? (
          <p className="text-center leading-relaxed line-clamp-4" style={{ fontSize: cardWidth * 0.035, color: "var(--tv-text-secondary)" }}>
            {messageBody}
          </p>
        ) : (
          <p className="text-center leading-relaxed" style={{ fontSize: cardWidth * 0.035, color: "var(--tv-text-secondary)" }}>
            This is where you can add a message to your guests.
          </p>
        )}
      </div>

    </div>
  );
}

// ── Helpers (duplicated from EnvelopePreview to keep module self-contained) ─
function adjust(hex: string, amount: number): string {
  const h = hex.replace("#", "");
  const clamp = (n: number) => Math.max(0, Math.min(255, n));
  const r = clamp(parseInt(h.substring(0, 2), 16) + amount);
  const g = clamp(parseInt(h.substring(2, 4), 16) + amount);
  const b = clamp(parseInt(h.substring(4, 6), 16) + amount);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
