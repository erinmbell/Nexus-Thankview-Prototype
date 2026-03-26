import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { FocusTrap } from "@mantine/core";
import { EnvelopeOpenAnimation, type LandingPageBackground } from "./EnvelopeOpenAnimation";

type DesignOption = "none" | "single-swoop" | "double-swoop" | "single-stripe" | "double-stripes" | "triple-stripes" | "airmail-stripe";
type PostmarkOption = "black" | "white" | "none";
type StampStyle = "classic" | "forever" | "crest" | "heart";

interface LivePreviewModalProps {
  opened: boolean;
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
  hasVideo?: boolean;
  sendWithoutVideo?: boolean;
  ctaText?: string;
  landingPageBg?: LandingPageBackground;
}

export function LivePreviewModal({
  opened, onClose,
  envelopeColor, nameColor, primaryColor, linerColor,
  hasVideo = true, sendWithoutVideo = false,
  ctaText = "Give to the Annual Fund",
  landingPageBg,
}: LivePreviewModalProps) {
  const [animKey, setAnimKey] = useState(0);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (opened) {
      triggerRef.current = document.activeElement as HTMLElement;
    }
  }, [opened]);

  const handleClose = () => {
    onClose();
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!opened) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [opened, onClose]);

  useEffect(() => {
    if (opened) setAnimKey(k => k + 1);
  }, [opened]);

  if (!opened) return null;

  return createPortal(
    <FocusTrap active>
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Envelope animation preview"
      style={{ background: "linear-gradient(160deg, #f0edf5 0%, #e8e4ef 40%, #ddd8e8 100%)" }}
    >
      {/* Close button — floats top-right over the animation */}
      <button
        onClick={handleClose}
        aria-label="Close preview"
        className="absolute top-3 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-tv-text-secondary flex items-center justify-center transition-colors shadow-sm"
      >
        <X size={16} />
      </button>

      {/* Full-height animation with integrated evertrue banner */}
      <div className="flex-1 flex flex-col min-h-0">
        <EnvelopeOpenAnimation
          key={animKey}
          envelope={{
            envelopeColor,
            linerColor,
            primaryColor,
            secondaryColor: envelopeColor,
            postmarkColor: primaryColor,
            recipientNameColor: nameColor,
            showName: true,
          }}
          width={380}
          hasVideo={hasVideo}
          sendWithoutVideo={sendWithoutVideo}
          ctaText={ctaText}
          ctaColor={primaryColor}
          landingPageBg={landingPageBg}
          autoPlay
        />
      </div>
    </div>
    </FocusTrap>,
    document.body,
  );
}
