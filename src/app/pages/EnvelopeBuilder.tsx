/**
 * EnvelopeBuilder — 2-step wizard: Build → Preview & Save
 *
 * Build step:  Left tab panel (Design / Colors / Logos / Marks) + right live preview
 * Finish step: Left success message + right final preview
 *
 * Matches the reference screenshots with swatch rows, card selectors, and a
 * "Flip to see inside" interaction.
 */
import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ChevronLeft, ChevronRight, Check, X, Play, Eye,
  Palette, Droplets, Image as ImageIcon, Stamp,
  Undo2, Redo2, Heart, Shield, Building2, Award,
  RotateCcw, Upload,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { LivePreviewModal } from "../components/LivePreviewModal";

// ── Types ────────────────────────────────────────────────────────────────────
type WizardStep = "build" | "finish";
type PreviewView = "front" | "back" | "open";
type BuildTab = "design" | "colors" | "logos" | "marks";

type DesignOption =
  | "none"
  | "single-swoop" | "double-swoop"
  | "single-stripe" | "double-stripes" | "triple-stripes" | "airmail-stripe";

type DesignGroup = "none" | "swoops" | "stripes";

type PostmarkOption = "black" | "white" | "none";
type StampStyle = "classic" | "forever" | "crest" | "heart";
type LogoChoice = "none" | "shield-crest" | "wordmark" | "university-seal" | "custom";

// ── Constants ────────────────────────────────────────────────────────────────
const TABS: { key: BuildTab; label: string; icon: any }[] = [
  { key: "design", label: "Design",  icon: Palette },
  { key: "colors", label: "Colors",  icon: Droplets },
  { key: "logos",  label: "Logos",   icon: ImageIcon },
  { key: "marks",  label: "Marks",   icon: Stamp },
];

const COLOR_SWATCHES = [
  { hex: "#1B3461", name: "Hartwell Navy" },
  { hex: "#C8962A", name: "Hartwell Gold" },
  { hex: "#BE3455", name: "Rose" },
  { hex: "#7c45b0", name: "Purple" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#1e6b4f", name: "Forest" },
  { hex: "#2B8A3E", name: "Green" },
  { hex: "#0E8A45", name: "Emerald" },
  { hex: "#334155", name: "Slate" },
  { hex: "#111111", name: "Black" },
  { hex: "#6b21a8", name: "Violet" },
  { hex: "#8B1E33", name: "Heritage Maroon" },
];

const LOGO_OPTIONS: { id: LogoChoice; label: string; icon: any }[] = [
  { id: "none",            label: "None",            icon: X },
  { id: "shield-crest",    label: "Shield Crest",    icon: Shield },
  { id: "wordmark",        label: "Wordmark",        icon: Building2 },
  { id: "university-seal", label: "University Seal",  icon: Award },
  { id: "custom",          label: "Custom",          icon: Upload },
];

const STAMP_OPTIONS: { id: StampStyle; label: string; icon: any }[] = [
  { id: "classic",  label: "Classic",          icon: Building2 },
  { id: "forever",  label: "Forever",          icon: RotateCcw },
  { id: "crest",    label: "University Crest", icon: Shield },
  { id: "heart",    label: "Heart",            icon: Heart },
];

const PAPER_TEXTURE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

/** Mock recently-used logos — in a real app these come from the user's asset library */
const RECENT_LOGOS: { id: string; name: string; usedAt: string; icon: any; bg: string }[] = [
  { id: "recent-1", name: "Hartwell Shield",     usedAt: "Mar 8, 2026",  icon: Shield,   bg: "#1B3461" },
  { id: "recent-2", name: "Athletics Wordmark",  usedAt: "Mar 5, 2026",  icon: Building2, bg: "#C8962A" },
  { id: "recent-3", name: "Foundation Seal",     usedAt: "Feb 28, 2026", icon: Award,    bg: "#8B1E33" },
  { id: "recent-4", name: "Alumni Crest",        usedAt: "Feb 20, 2026", icon: Shield,   bg: "#7c45b0" },
  { id: "recent-5", name: "Campaign Logo 2026",  usedAt: "Feb 14, 2026", icon: Heart,    bg: "#1e6b4f" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function isDark(hex: string) {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function safeHex(hex: string): string {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return "#" + clean.padEnd(6, "0");
}

const designLabel = (d: DesignOption): string =>
  d === "none" ? "None" : d === "single-swoop" ? "Single Swoop" : d === "double-swoop" ? "Double Swoop"
  : d === "single-stripe" ? "Single Stripe" : d === "double-stripes" ? "Double Stripes"
  : d === "triple-stripes" ? "Triple Stripes" : "Airmail";

// ═══════════════════════════════════════════════════════════════════════════════
//  Main export
// ═══════════════════════════════════════════════════════════════════════════════
export function EnvelopeBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { show } = useToast();
  const returnTo = searchParams.get("returnTo") || "/campaigns/create";

  // Wizard
  const [wizardStep, setWizardStep] = useState<WizardStep>("build");
  const [saving, setSaving] = useState(false);

  // Build tab
  const [activeTab, setActiveTab] = useState<BuildTab>("design");

  // ── Envelope state ───────────────────────────────────────────────────────
  const [title, setTitle] = useState("New Envelope");
  const [envelopeColor, setEnvelopeColor] = useState("#1B3461");
  const [linerColor, setLinerColor] = useState("#C8962A");
  const [primaryColor, setPrimaryColor] = useState("#1B3461");
  const [secondaryColor, setSecondaryColor] = useState("#C8962A");
  const [tertiaryColor, setTertiaryColor] = useState("#8B1E33");
  const [nameColor, setNameColor] = useState("#ffffff");
  const [design, setDesign] = useState<DesignOption>("none");
  const [designGroup, setDesignGroup] = useState<DesignGroup>("none");
  const [swoop1Color, setSwoop1Color] = useState("#C8962A");
  const [swoop2Color, setSwoop2Color] = useState("#f3eeff");
  const [stripe1Color, setStripe1Color] = useState("#C8962A");
  const [stripe2Color, setStripe2Color] = useState("#8B1E33");
  const [frontLogo, setFrontLogo] = useState<LogoChoice>("none");
  const [backLogo, setBackLogo] = useState<LogoChoice>("none");
  const [postmark, setPostmark] = useState<PostmarkOption>("none");
  const [postmarkText, setPostmarkText] = useState("");
  const [stampStyle, setStampStyle] = useState<StampStyle>("classic");

  // Preview
  const [previewView, setPreviewView] = useState<PreviewView>("front");
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);

  // File refs for custom logo / stamp upload
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backLogoInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [backFlapLogoPreview, setBackFlapLogoPreview] = useState<string | null>(null);
  const [stampImagePreview, setStampImagePreview] = useState<string | null>(null);
  const [stampFileName, setStampFileName] = useState<string | null>(null);
  const [stampFileSize, setStampFileSize] = useState<number | null>(null);
  const [stampDragOver, setStampDragOver] = useState(false);
  const [frontLogoName, setFrontLogoName] = useState<string | null>(null);
  const [backLogoName, setBackLogoName] = useState<string | null>(null);
  const [frontLogoFileName, setFrontLogoFileName] = useState<string | null>(null);
  const [frontLogoFileSize, setFrontLogoFileSize] = useState<number | null>(null);
  const [backLogoFileName, setBackLogoFileName] = useState<string | null>(null);
  const [backLogoFileSize, setBackLogoFileSize] = useState<number | null>(null);
  const [frontLogoDragOver, setFrontLogoDragOver] = useState(false);
  const [backLogoDragOver, setBackLogoDragOver] = useState(false);

  // ── Shared preview renderer (used by both inline preview and LivePreviewModal) ──
  const renderEnvelopePreview = (view: PreviewView, compact: boolean) => (
    <EnvelopePreview
      view={view}
      envelopeColor={envelopeColor}
      nameColor={nameColor}
      primaryColor={primaryColor}
      design={design}
      swoop1Color={swoop1Color}
      swoop2Color={swoop2Color}
      stripe1Color={stripe1Color}
      stripe2Color={stripe2Color}
      postmark={postmark}
      postmarkText={postmarkText}
      stampPreview={stampImagePreview}
      logoPreview={frontLogo !== "none" ? (logoPreview || "placeholder") : null}
      backFlapLogoPreview={backLogo !== "none" ? (backFlapLogoPreview || "placeholder") : null}
      linerColor={linerColor}
      stampStyle={stampStyle}
      frontLogoChoice={frontLogo}
      backLogoChoice={backLogo}
      frontLogoName={frontLogoName}
      backLogoName={backLogoName}
      compact={compact}
    />
  );

  // ── Actions ──────────────────────────────────────────────────────────────
  const handleSave = (useInCampaign: boolean) => {
    if (!title.trim()) {
      show("Please enter an envelope title", "warning");
      setActiveTab("design");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const envelope = {
        id: Date.now(),
        name: title,
        color: envelopeColor,
        accent: primaryColor,
        nameColor,
        branded: true,
        lastUsed: new Date().toISOString().split("T")[0],
        category: "standard",
        design,
        linerColor,
      };
      sessionStorage.setItem("tv-saved-envelope", JSON.stringify(envelope));
      setSaving(false);
      if (useInCampaign) {
        show("Envelope saved & selected!", "success");
        navigate(returnTo);
      } else {
        setWizardStep("finish");
        show("Envelope saved to library!", "success");
      }
    }, 800);
  };

  return (
    <div className="h-full flex flex-col bg-white overflow-hidden">
      {/* Hidden file inputs */}
      <input type="file" accept=".png,.jpg,.jpeg" ref={logoInputRef} aria-hidden="true" tabIndex={-1}
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 512000) { show("File exceeds 500 KB limit", "warning"); e.target.value = ""; return; }
          if (!f.type.startsWith("image/")) { show("Please upload a PNG or JPEG image", "warning"); e.target.value = ""; return; }
          setLogoPreview(URL.createObjectURL(f));
          setFrontLogoFileName(f.name);
          setFrontLogoFileSize(f.size);
          setFrontLogo("custom");
          setFrontLogoName(null);
          show(`"${f.name}" uploaded`, "success");
          e.target.value = "";
        }} />
      <input type="file" accept=".png,.jpg,.jpeg" ref={backLogoInputRef} aria-hidden="true" tabIndex={-1}
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 512000) { show("File exceeds 500 KB limit", "warning"); e.target.value = ""; return; }
          if (!f.type.startsWith("image/")) { show("Please upload a PNG or JPEG image", "warning"); e.target.value = ""; return; }
          setBackFlapLogoPreview(URL.createObjectURL(f));
          setBackLogoFileName(f.name);
          setBackLogoFileSize(f.size);
          setBackLogo("custom");
          setBackLogoName(null);
          show(`"${f.name}" uploaded`, "success");
          e.target.value = "";
        }} />
      <input type="file" accept=".png,.jpg,.jpeg" ref={stampInputRef} aria-hidden="true" tabIndex={-1}
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }}
        onChange={e => {
          const f = e.target.files?.[0];
          if (!f) return;
          if (f.size > 5242880) { show("File exceeds 5 MB limit", "warning"); e.target.value = ""; return; }
          if (!f.type.startsWith("image/")) { show("Please upload a PNG or JPEG image", "warning"); e.target.value = ""; return; }
          setStampImagePreview(URL.createObjectURL(f));
          setStampFileName(f.name);
          setStampFileSize(f.size);
          show(`"${f.name}" uploaded as stamp`, "success");
          e.target.value = "";
        }} />

      {/* ═══ Header ══════════════════════════════════════════════════════════ */}
      <div className="shrink-0 px-6 py-4 border-b border-tv-border-divider">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(returnTo)} className="text-tv-text-secondary hover:text-tv-text-primary transition-colors" aria-label="Go back">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-[18px] text-tv-text-primary" style={{ fontWeight: 800 }}>{title || "New Envelope"}</h1>
            <p className="text-[12px] text-tv-text-secondary">{title || "New Envelope"}</p>
          </div>
        </div>
      </div>

      {/* ═══ Content ═════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0">
        {wizardStep === "build" ? (
          <>
            {/* ── Left panel ──────────────────────────────────────────────── */}
            <div className="w-[320px] min-w-[260px] shrink-0 flex flex-col border-r border-tv-border-divider">
              {/* Tabs */}
              <div className="flex items-center gap-0 px-5 pt-4 pb-2 border-b border-tv-border-divider overflow-x-auto scrollbar-none">
                {TABS.map(t => {
                  const active = activeTab === t.key;
                  const Icon = t.icon;
                  return (
                    <button key={t.key} onClick={() => setActiveTab(t.key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] whitespace-nowrap shrink-0 transition-colors ${
                        active ? "text-tv-brand" : "text-tv-text-secondary hover:text-tv-text-primary"
                      }`}
                      style={{ fontWeight: active ? 600 : 400, borderBottom: active ? "2px solid var(--tv-brand)" : "2px solid transparent" }}>
                      <Icon size={13} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {/* Tab content — scrollable */}
              <div className="flex-1 overflow-y-auto p-5">

                {/* ── DESIGN TAB ─────────────────────────────────────────── */}
                {activeTab === "design" && (
                  <div className="space-y-5">
                    {/* Envelope Title */}
                    <div>
                      <SectionLabel>Envelope Title</SectionLabel>
                      <input value={title} onChange={e => setTitle(e.target.value)}
                        className="w-full border-0 border-b border-tv-border-light text-[14px] text-tv-text-primary py-1.5 outline-none focus:border-tv-brand transition-colors bg-transparent"
                        style={{ fontWeight: 500 }}
                        placeholder="Untitled Envelope" />
                    </div>

                    {/* Envelope Color */}
                    <div>
                      <SectionLabel>Envelope Color</SectionLabel>
                      <SwatchRow value={envelopeColor} onChange={setEnvelopeColor} />
                    </div>

                    {/* Envelope Liner Color */}
                    <div>
                      <SectionLabel>Envelope Liner Color</SectionLabel>
                      <SwatchRow value={linerColor} onChange={setLinerColor} />
                    </div>

                    {/* Front Design */}
                    <div>
                      <SectionLabel>Front Design</SectionLabel>
                      <p className="text-[11px] text-tv-text-secondary mb-3">A simple design to elevate the look of your envelope.</p>

                      {/* No Design radio */}
                      <button onClick={() => { setDesignGroup("none"); setDesign("none"); }}
                        className="flex items-center gap-2 mb-3 group">
                        <RadioDot selected={design === "none"} />
                        <span className={`text-[12px] ${design === "none" ? "text-tv-text-primary" : "text-tv-text-secondary group-hover:text-tv-text-primary"}`}
                          style={{ fontWeight: design === "none" ? 600 : 400 }}>No Design</span>
                      </button>

                      {/* Swoops subgroup */}
                      <p className="text-[11px] text-tv-text-primary mb-1.5" style={{ fontWeight: 600 }}>Swoops</p>
                      <div className="flex gap-3 mb-3">
                        {(["single-swoop", "double-swoop"] as const).map(opt => (
                          <button key={opt} onClick={() => { setDesignGroup("swoops"); setDesign(opt); }}
                            className="flex items-center gap-1.5 group">
                            <RadioDot selected={design === opt} />
                            <span className={`text-[12px] ${design === opt ? "text-tv-text-primary" : "text-tv-text-secondary group-hover:text-tv-text-primary"}`}
                              style={{ fontWeight: design === opt ? 600 : 400 }}>
                              {opt === "single-swoop" ? "Single Swoop" : "Double Swoop"}
                            </span>
                          </button>
                        ))}
                      </div>
                      {designGroup === "swoops" && (
                        <div className="space-y-2 mb-3 pl-1">
                          <SwatchRow value={swoop1Color} onChange={setSwoop1Color} label="Swoop Color" />
                          {design === "double-swoop" && (
                            <SwatchRow value={swoop2Color} onChange={setSwoop2Color} label="Second Color" />
                          )}
                        </div>
                      )}

                      {/* Stripes subgroup */}
                      <p className="text-[11px] text-tv-text-primary mb-1.5" style={{ fontWeight: 600 }}>Stripes</p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 mb-3">
                        {(["single-stripe", "double-stripes", "triple-stripes", "airmail-stripe"] as const).map(opt => (
                          <button key={opt} onClick={() => { setDesignGroup("stripes"); setDesign(opt); }}
                            className="flex items-center gap-1.5 group">
                            <RadioDot selected={design === opt} />
                            <span className={`text-[12px] ${design === opt ? "text-tv-text-primary" : "text-tv-text-secondary group-hover:text-tv-text-primary"}`}
                              style={{ fontWeight: design === opt ? 600 : 400 }}>
                              {designLabel(opt)}
                            </span>
                          </button>
                        ))}
                      </div>
                      {designGroup === "stripes" && (
                        <div className="space-y-2 mb-3 pl-1">
                          <SwatchRow value={stripe1Color} onChange={setStripe1Color} label="Stripe Color" />
                          <SwatchRow value={stripe2Color} onChange={setStripe2Color} label="Second Color" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ── COLORS TAB ─────────────────────────────────────────── */}
                {activeTab === "colors" && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 px-3 py-2 bg-tv-brand-tint/50 rounded-[8px] border border-tv-brand-bg/20">
                      <div className="w-4 h-4 rounded-full border-2 border-tv-brand-bg flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-tv-brand-bg" />
                      </div>
                      <span className="text-[11px] text-tv-text-primary"><strong>Hartwell University</strong> brand colors</span>
                    </div>

                    <div>
                      <SectionLabel>Primary Brand Color</SectionLabel>
                      <SwatchRow value={primaryColor} onChange={setPrimaryColor} />
                    </div>
                    <div>
                      <SectionLabel>Secondary Brand Color</SectionLabel>
                      <SwatchRow value={secondaryColor} onChange={setSecondaryColor} />
                    </div>
                    <div>
                      <SectionLabel>Tertiary Brand Color</SectionLabel>
                      <SwatchRow value={tertiaryColor} onChange={setTertiaryColor} />
                    </div>
                    <div>
                      <SectionLabel>Recipient Name Color</SectionLabel>
                      <SwatchRow value={nameColor} onChange={setNameColor} />
                      <p className="text-[10px] text-tv-text-decorative mt-1">Color of the recipient's name on the front of the envelope.</p>
                    </div>
                  </div>
                )}

                {/* ── LOGOS TAB ───────────────────────────────────────────── */}
                {activeTab === "logos" && (
                  <div className="space-y-5">
                    <p className="text-[11px] text-tv-text-secondary leading-relaxed">
                      Custom logos should be 300 x 300px PNG with transparent background, max 500 KB. Logos are rendered at ~40px on the envelope.
                    </p>

                    {/* ─── Front Left Logo ─────────────────────────────────── */}
                    <div>
                      <SectionLabel>Front Left Logo</SectionLabel>

                      {/* Uploaded file preview */}
                      {frontLogo === "custom" && logoPreview && (
                        <div className="relative w-full rounded-[12px] border border-tv-border-light overflow-hidden bg-tv-surface/30 mb-3 group">
                          <div className="flex items-center gap-3 p-3">
                            <div className="w-12 h-12 rounded-[8px] border border-tv-border-light bg-white flex items-center justify-center overflow-hidden shrink-0">
                              <img src={logoPreview} alt="Front logo" className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{frontLogoFileName || "Custom Logo"}</p>
                              <p className="text-[10px] text-tv-text-decorative">
                                {frontLogoFileSize ? `${(frontLogoFileSize / 1024).toFixed(1)} KB` : "Uploaded"}
                              </p>
                            </div>
                            <button onClick={() => { setLogoPreview(null); setFrontLogo("none"); setFrontLogoFileName(null); setFrontLogoFileSize(null); show("Front logo removed", "info"); }}
                              className="w-6 h-6 rounded-full bg-tv-danger/10 text-tv-danger hover:bg-tv-danger/20 flex items-center justify-center shrink-0 transition-colors"
                              title="Remove logo">
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                          <button onClick={() => logoInputRef.current?.click()}
                            className="w-full py-1.5 text-[10px] text-tv-text-secondary hover:text-tv-brand border-t border-tv-border-light bg-white/50 hover:bg-tv-brand-tint/30 transition-colors"
                            style={{ fontWeight: 500 }}>
                            Replace
                          </button>
                        </div>
                      )}

                      {/* Upload drop zone */}
                      {!(frontLogo === "custom" && logoPreview) && (
                        <div
                          onDragOver={e => { e.preventDefault(); setFrontLogoDragOver(true); }}
                          onDragLeave={() => setFrontLogoDragOver(false)}
                          onDrop={e => {
                            e.preventDefault(); setFrontLogoDragOver(false);
                            const f = e.dataTransfer.files?.[0];
                            if (!f) return;
                            if (f.size > 512000) { show("File exceeds 500 KB limit", "warning"); return; }
                            if (!f.type.startsWith("image/")) { show("Please upload a PNG or JPEG image", "warning"); return; }
                            setLogoPreview(URL.createObjectURL(f));
                            setFrontLogoFileName(f.name);
                            setFrontLogoFileSize(f.size);
                            setFrontLogo("custom");
                            setFrontLogoName(null);
                            show(`"${f.name}" uploaded`, "success");
                          }}
                          onClick={() => logoInputRef.current?.click()}
                          className={`w-full flex items-center gap-3 px-3 py-3 mb-3 rounded-[12px] border-2 border-dashed cursor-pointer transition-all ${
                            frontLogoDragOver
                              ? "border-tv-brand bg-tv-brand-tint/50 scale-[1.01]"
                              : "border-tv-border text-tv-text-secondary hover:border-tv-brand hover:text-tv-brand hover:bg-tv-brand-tint/30"
                          }`}
                          aria-label="Upload front logo">
                          <div className="w-8 h-8 rounded-full bg-tv-surface flex items-center justify-center shrink-0">
                            <Upload size={14} className={frontLogoDragOver ? "text-tv-brand" : ""} />
                          </div>
                          <div className="text-left">
                            <span className="text-[12px] block" style={{ fontWeight: 600 }}>
                              {frontLogoDragOver ? "Drop image here" : "Upload Logo"}
                            </span>
                            <span className="text-[10px] text-tv-text-decorative">PNG, JPG — max 500 KB</span>
                          </div>
                        </div>
                      )}

                      {/* Recently Used */}
                      <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5" style={{ fontWeight: 600 }}>Recently Used</p>
                      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
                        {RECENT_LOGOS.map(logo => {
                          const Icon = logo.icon;
                          const selected = frontLogo === "custom" && frontLogoName === logo.id;
                          return (
                            <button key={logo.id} onClick={() => { setFrontLogo("custom"); setFrontLogoName(logo.id); setLogoPreview(null); show(`"${logo.name}" selected`, "success"); }}
                              className={`shrink-0 w-[52px] flex flex-col items-center gap-1 py-2 px-1 rounded-[8px] border transition-all ${
                                selected ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"
                              }`}
                              title={`${logo.name} — ${logo.usedAt}`}>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: logo.bg }}>
                                <Icon size={12} className="text-white" />
                              </div>
                              <span className={`text-[8px] truncate w-full text-center ${selected ? "text-tv-brand" : "text-tv-text-secondary"}`} style={{ fontWeight: selected ? 600 : 400 }}>
                                {logo.name.split(" ")[0]}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Preset options */}
                      <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5" style={{ fontWeight: 600 }}>Presets</p>
                      <div className="space-y-1.5">
                        {LOGO_OPTIONS.filter(o => o.id !== "custom").map(opt => {
                          const Icon = opt.icon;
                          const selected = frontLogo === opt.id;
                          return (
                            <button key={opt.id} onClick={() => { setFrontLogo(opt.id); setFrontLogoName(null); setLogoPreview(null); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] border transition-all ${
                                selected
                                  ? "border-tv-brand-bg bg-tv-brand-tint"
                                  : "border-tv-border-light hover:border-tv-border-strong"
                              }`}>
                              {opt.id === "none" ? (
                                <X size={16} className={selected ? "text-tv-brand" : "text-tv-text-decorative"} />
                              ) : (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                  selected ? "bg-tv-brand-bg/10" : "bg-tv-surface"
                                }`}>
                                  <Icon size={14} className={selected ? "text-tv-brand" : "text-tv-text-secondary"} />
                                </div>
                              )}
                              <span className={`text-[13px] ${selected ? "text-tv-brand" : "text-tv-text-primary"}`}
                                style={{ fontWeight: selected ? 600 : 400 }}>{opt.label}</span>
                              {selected && <Check size={14} className="ml-auto text-tv-brand" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* ─── Back Flap Logo ──────────────────────────────────── */}
                    <div className="pt-2 border-t border-tv-border-divider">
                      <SectionLabel>Back Flap Logo</SectionLabel>

                      {/* Uploaded file preview */}
                      {backLogo === "custom" && backFlapLogoPreview && (
                        <div className="relative w-full rounded-[12px] border border-tv-border-light overflow-hidden bg-tv-surface/30 mb-3 group">
                          <div className="flex items-center gap-3 p-3">
                            <div className="w-12 h-12 rounded-[8px] border border-tv-border-light bg-white flex items-center justify-center overflow-hidden shrink-0">
                              <img src={backFlapLogoPreview} alt="Back logo" className="max-w-full max-h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{backLogoFileName || "Custom Logo"}</p>
                              <p className="text-[10px] text-tv-text-decorative">
                                {backLogoFileSize ? `${(backLogoFileSize / 1024).toFixed(1)} KB` : "Uploaded"}
                              </p>
                            </div>
                            <button onClick={() => { setBackFlapLogoPreview(null); setBackLogo("none"); setBackLogoFileName(null); setBackLogoFileSize(null); show("Back logo removed", "info"); }}
                              className="w-6 h-6 rounded-full bg-tv-danger/10 text-tv-danger hover:bg-tv-danger/20 flex items-center justify-center shrink-0 transition-colors"
                              title="Remove logo">
                              <X size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                          <button onClick={() => backLogoInputRef.current?.click()}
                            className="w-full py-1.5 text-[10px] text-tv-text-secondary hover:text-tv-brand border-t border-tv-border-light bg-white/50 hover:bg-tv-brand-tint/30 transition-colors"
                            style={{ fontWeight: 500 }}>
                            Replace
                          </button>
                        </div>
                      )}

                      {/* Upload drop zone */}
                      {!(backLogo === "custom" && backFlapLogoPreview) && (
                        <div
                          onDragOver={e => { e.preventDefault(); setBackLogoDragOver(true); }}
                          onDragLeave={() => setBackLogoDragOver(false)}
                          onDrop={e => {
                            e.preventDefault(); setBackLogoDragOver(false);
                            const f = e.dataTransfer.files?.[0];
                            if (!f) return;
                            if (f.size > 512000) { show("File exceeds 500 KB limit", "warning"); return; }
                            if (!f.type.startsWith("image/")) { show("Please upload a PNG or JPEG image", "warning"); return; }
                            setBackFlapLogoPreview(URL.createObjectURL(f));
                            setBackLogoFileName(f.name);
                            setBackLogoFileSize(f.size);
                            setBackLogo("custom");
                            setBackLogoName(null);
                            show(`"${f.name}" uploaded`, "success");
                          }}
                          onClick={() => backLogoInputRef.current?.click()}
                          className={`w-full flex items-center gap-3 px-3 py-3 mb-3 rounded-[12px] border-2 border-dashed cursor-pointer transition-all ${
                            backLogoDragOver
                              ? "border-tv-brand bg-tv-brand-tint/50 scale-[1.01]"
                              : "border-tv-border text-tv-text-secondary hover:border-tv-brand hover:text-tv-brand hover:bg-tv-brand-tint/30"
                          }`}
                          aria-label="Upload back flap logo">
                          <div className="w-8 h-8 rounded-full bg-tv-surface flex items-center justify-center shrink-0">
                            <Upload size={14} className={backLogoDragOver ? "text-tv-brand" : ""} />
                          </div>
                          <div className="text-left">
                            <span className="text-[12px] block" style={{ fontWeight: 600 }}>
                              {backLogoDragOver ? "Drop image here" : "Upload Logo"}
                            </span>
                            <span className="text-[10px] text-tv-text-decorative">PNG, JPG — max 500 KB</span>
                          </div>
                        </div>
                      )}

                      {/* Recently Used */}
                      <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5" style={{ fontWeight: 600 }}>Recently Used</p>
                      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 scrollbar-none">
                        {RECENT_LOGOS.map(logo => {
                          const Icon = logo.icon;
                          const selected = backLogo === "custom" && backLogoName === logo.id;
                          return (
                            <button key={logo.id} onClick={() => { setBackLogo("custom"); setBackLogoName(logo.id); setBackFlapLogoPreview(null); show(`"${logo.name}" selected`, "success"); }}
                              className={`shrink-0 w-[52px] flex flex-col items-center gap-1 py-2 px-1 rounded-[8px] border transition-all ${
                                selected ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"
                              }`}
                              title={`${logo.name} — ${logo.usedAt}`}>
                              <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: logo.bg }}>
                                <Icon size={12} className="text-white" />
                              </div>
                              <span className={`text-[8px] truncate w-full text-center ${selected ? "text-tv-brand" : "text-tv-text-secondary"}`} style={{ fontWeight: selected ? 600 : 400 }}>
                                {logo.name.split(" ")[0]}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Preset options */}
                      <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5" style={{ fontWeight: 600 }}>Presets</p>
                      <div className="space-y-1.5">
                        {LOGO_OPTIONS.filter(o => o.id !== "custom").map(opt => {
                          const Icon = opt.icon;
                          const selected = backLogo === opt.id;
                          return (
                            <button key={opt.id} onClick={() => { setBackLogo(opt.id); setBackLogoName(null); setBackFlapLogoPreview(null); }}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[12px] border transition-all ${
                                selected
                                  ? "border-tv-brand-bg bg-tv-brand-tint"
                                  : "border-tv-border-light hover:border-tv-border-strong"
                              }`}>
                              {opt.id === "none" ? (
                                <X size={16} className={selected ? "text-tv-brand" : "text-tv-text-decorative"} />
                              ) : (
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                                  selected ? "bg-tv-brand-bg/10" : "bg-tv-surface"
                                }`}>
                                  <Icon size={14} className={selected ? "text-tv-brand" : "text-tv-text-secondary"} />
                                </div>
                              )}
                              <span className={`text-[13px] ${selected ? "text-tv-brand" : "text-tv-text-primary"}`}
                                style={{ fontWeight: selected ? 600 : 400 }}>{opt.label}</span>
                              {selected && <Check size={14} className="ml-auto text-tv-brand" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── MARKS TAB ───────────────────────────────────────────── */}
                {activeTab === "marks" && (
                  <div className="space-y-5">
                    {/* ─── Postmark ─────────────────────────── */}
                    <div>
                      <SectionLabel>Postmark</SectionLabel>
                      <p className="text-[11px] text-tv-text-secondary mb-3">A detailed touch that adds to the effect of the envelope. Max: 40 chars, 4 line-breaks.</p>
                      <div className="space-y-1.5 mb-3">
                        {(["black", "white", "none"] as PostmarkOption[]).map(opt => (
                          <button key={opt} onClick={() => setPostmark(opt)}
                            className="flex items-center gap-2 group w-full">
                            <RadioDot selected={postmark === opt} />
                            <span className={`text-[12px] ${postmark === opt ? "text-tv-text-primary" : "text-tv-text-secondary group-hover:text-tv-text-primary"}`}
                              style={{ fontWeight: postmark === opt ? 600 : 400 }}>
                              {opt === "none" ? "No postmark" : opt === "black" ? "Black Postmark" : "White Postmark"}
                            </span>
                          </button>
                        ))}
                      </div>

                      {postmark !== "none" && (
                        <div className="mt-3">
                          <label className="text-[11px] text-tv-text-primary mb-1.5 block" style={{ fontWeight: 600 }}>Postmark Inner Copy</label>
                          <textarea value={postmarkText}
                            onChange={e => {
                              const val = e.target.value;
                              const lineCount = (val.match(/\n/g) || []).length;
                              if (val.length <= 40 && lineCount <= 3) setPostmarkText(val);
                            }}
                            rows={3}
                            className="w-full border border-tv-border-light rounded-[8px] text-[13px] text-tv-text-primary p-2.5 outline-none focus:border-tv-brand transition-colors bg-white resize-y"
                            style={{ fontWeight: 500, minHeight: 56 }}
                            placeholder="Hartwell University" />
                          <p className="text-[9px] text-tv-text-decorative mt-1">{40 - postmarkText.length} characters remaining</p>
                        </div>
                      )}
                    </div>

                    {/* ─── Stamp ────────────────────────────── */}
                    <div className="pt-2 border-t border-tv-border-divider">
                      <SectionLabel>Stamp</SectionLabel>
                      <p className="text-[11px] text-tv-text-secondary mb-2">Your envelope always includes a postage stamp. Choose a style below, or upload a custom image to fill the stamp.</p>

                      {/* Live stamp preview */}
                      <div className="flex items-center gap-3 mb-3 px-3 py-2.5 rounded-[10px] bg-tv-surface/50 border border-tv-border-light">
                        <PerforatedStamp size={52} accentColor={primaryColor} stampStyle={stampStyle} customImage={stampImagePreview} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-tv-text-primary" style={{ fontWeight: 600 }}>
                            {stampImagePreview ? "Custom Image" : stampStyle.charAt(0).toUpperCase() + stampStyle.slice(1) + " Style"}
                          </p>
                          <p className="text-[10px] text-tv-text-decorative">Current stamp preview</p>
                        </div>
                      </div>

                      {/* Uploaded stamp preview */}
                      {stampImagePreview && (
                        <div className="relative w-full rounded-[12px] border border-tv-border-light overflow-hidden bg-tv-surface/30 mb-3 group">
                          <div className="flex items-center gap-3 p-3">
                            <div className="w-16 h-16 rounded-[8px] border border-tv-border-light bg-white flex items-center justify-center overflow-hidden shrink-0">
                              <img src={stampImagePreview} alt="Custom stamp" className="max-w-full max-h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] text-tv-text-primary truncate" style={{ fontWeight: 600 }}>{stampFileName || "Custom Stamp"}</p>
                              <p className="text-[10px] text-tv-text-decorative">
                                {stampFileSize ? `${(stampFileSize / 1024).toFixed(1)} KB` : "Uploaded"}
                              </p>
                            </div>
                            <button onClick={() => { setStampImagePreview(null); setStampFileName(null); setStampFileSize(null); show("Stamp image removed", "info"); }}
                              className="w-6 h-6 rounded-full bg-tv-danger/10 text-tv-danger hover:bg-tv-danger/20 flex items-center justify-center shrink-0 transition-colors"
                              title="Remove stamp">
                              <X size={12} />
                            </button>
                          </div>
                          <button onClick={() => stampInputRef.current?.click()}
                            className="w-full py-1.5 text-[10px] text-tv-text-secondary hover:text-tv-brand border-t border-tv-border-light bg-white/50 hover:bg-tv-brand-tint/30 transition-colors"
                            style={{ fontWeight: 500 }}>
                            Replace Image
                          </button>
                        </div>
                      )}

                      {/* Upload drop zone */}
                      {!stampImagePreview && (
                        <div
                          onDragOver={e => { e.preventDefault(); setStampDragOver(true); }}
                          onDragLeave={() => setStampDragOver(false)}
                          onDrop={e => {
                            e.preventDefault(); setStampDragOver(false);
                            const f = e.dataTransfer.files?.[0];
                            if (!f) return;
                            if (f.size > 5242880) { show("File exceeds 5 MB limit", "warning"); return; }
                            if (!f.type.startsWith("image/")) { show("Please upload a PNG or JPEG image", "warning"); return; }
                            setStampImagePreview(URL.createObjectURL(f));
                            setStampFileName(f.name);
                            setStampFileSize(f.size);
                            show(`"${f.name}" uploaded as stamp`, "success");
                          }}
                          onClick={() => stampInputRef.current?.click()}
                          className={`w-full flex flex-col items-center gap-2 px-3 py-4 mb-3 rounded-[12px] border-2 border-dashed cursor-pointer transition-all ${
                            stampDragOver
                              ? "border-tv-brand bg-tv-brand-tint/50 scale-[1.01]"
                              : "border-tv-border text-tv-text-secondary hover:border-tv-brand hover:text-tv-brand hover:bg-tv-brand-tint/30"
                          }`}
                          aria-label="Upload stamp image">
                          <div className="w-8 h-8 rounded-full bg-tv-surface flex items-center justify-center">
                            <Upload size={14} className={stampDragOver ? "text-tv-brand" : ""} />
                          </div>
                          <div className="text-center">
                            <span className="text-[12px] block" style={{ fontWeight: 600 }}>
                              {stampDragOver ? "Drop image here" : "Choose File"}
                            </span>
                            <span className="text-[10px] text-tv-text-decorative">PNG, JPG — max 5 MB</span>
                          </div>
                        </div>
                      )}

                      {/* Stamp Style presets */}
                      <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5 mt-3" style={{ fontWeight: 600 }}>Stamp Style</p>
                      <div className="grid grid-cols-2 gap-2">
                        {STAMP_OPTIONS.map(opt => {
                          const Icon = opt.icon;
                          const selected = stampStyle === opt.id;
                          return (
                            <button key={opt.id} onClick={() => { setStampStyle(opt.id); setStampImagePreview(null); setStampFileName(null); setStampFileSize(null); }}
                              className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-[12px] border transition-all ${
                                selected && !stampImagePreview
                                  ? "border-tv-brand-bg bg-tv-brand-tint"
                                  : "border-tv-border-light hover:border-tv-border-strong"
                              }`}>
                              <Icon size={18} className={selected && !stampImagePreview ? "text-tv-brand" : "text-tv-text-secondary"} />
                              <span className={`text-[11px] ${selected && !stampImagePreview ? "text-tv-brand" : "text-tv-text-secondary"}`}
                                style={{ fontWeight: selected && !stampImagePreview ? 600 : 400 }}>{opt.label}</span>
                              {selected && !stampImagePreview && <Check size={11} className="text-tv-brand" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Preview ───────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-8 bg-tv-surface/20 overflow-y-auto">
              <div className="w-full max-w-[500px]">
                {/* Envelope */}
                {renderEnvelopePreview(previewView, false)}

                {/* View switcher */}
                <div className="flex items-center gap-1.5 mt-4 bg-white rounded-full border border-tv-border-light p-1">
                  {([
                    { id: "front" as PreviewView, label: "Front" },
                    { id: "back" as PreviewView, label: "Back (Closed)" },
                    { id: "open" as PreviewView, label: "Back (Open)" },
                  ]).map(v => {
                    const active = previewView === v.id;
                    return (
                      <button key={v.id} onClick={() => setPreviewView(v.id)}
                        className={`flex-1 py-2 rounded-full text-[12px] transition-all ${
                          active
                            ? "bg-tv-brand-bg text-white shadow-sm"
                            : "text-tv-text-secondary hover:text-tv-text-primary hover:bg-tv-surface/60"
                        }`}
                        style={{ fontWeight: active ? 600 : 400 }}>
                        {v.label}
                      </button>
                    );
                  })}
                </div>

                {/* Summary pills */}
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  <SummaryPill label="Design" value={designLabel(design)} />
                  <SummaryPill label="Stamp" value={stampStyle.charAt(0).toUpperCase() + stampStyle.slice(1)} />
                  <SummaryPill label="Front Logo" value={frontLogo === "none" ? "None" : frontLogo === "custom" && frontLogoFileName ? frontLogoFileName : LOGO_OPTIONS.find(l => l.id === frontLogo)?.label || "None"} />
                  <SummaryPill label="Back Logo" value={backLogo === "none" ? "None" : backLogo === "custom" && backLogoFileName ? backLogoFileName : LOGO_OPTIONS.find(l => l.id === backLogo)?.label || "None"} />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ── FINISH STEP ───────────────────────────────────────────────── */
          <div className="flex-1 flex min-h-0">
            {/* Left: success */}
            <div className="w-[42%] shrink-0 border-r border-tv-border-divider flex items-center justify-center p-10">
              <div>
                <h2 className="font-display text-tv-text-primary mb-3" style={{ fontSize: "40px", fontWeight: 700 }}>
                  Huzzah!
                </h2>
                <p className="text-[15px] text-tv-text-primary mb-4" style={{ fontWeight: 500 }}>
                  Your envelope is now in your portal.
                </p>
                <p className="text-[12px] text-tv-text-secondary leading-relaxed">
                  Your envelope has been saved and is ready to use in a campaign. You can edit or manage your envelopes anytime from <strong style={{ color: "var(--tv-text-primary)" }}>Assets & Templates</strong>.
                </p>
              </div>
            </div>

            {/* Right: 3-view summary */}
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-8 bg-tv-surface/30 overflow-y-auto">
              <div className="w-full max-w-[480px]">
                <h3 className="text-tv-text-primary mb-1" style={{ fontSize: "17px", fontWeight: 700 }}>{title || "Untitled Envelope"}</h3>
                <div className="h-px bg-tv-border-divider mb-5" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(["front", "back", "open"] as const).map(v => (
                    <div key={v} className="rounded-[10px] overflow-hidden border border-tv-border-light shadow-sm">
                      {renderEnvelopePreview(v, true)}
                      <div className="px-2 py-1.5 bg-white">
                        <p className="text-[9px] text-tv-text-secondary text-center" style={{ fontWeight: 500 }}>
                          {v === "front" ? "Front" : v === "back" ? "Back" : "Open"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Footer bar ═════════════════════════════════════════════════════ */}
      <div className="shrink-0 border-t border-tv-border-divider px-6 py-3.5 flex items-center justify-between bg-white">
        {/* Left: Undo / Redo */}
        <div className="flex items-center gap-1">
          <button className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-tv-text-secondary rounded-[8px] hover:bg-tv-surface transition-colors" style={{ fontWeight: 500 }}>
            <Undo2 size={13} /> Undo
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-tv-text-secondary rounded-[8px] hover:bg-tv-surface transition-colors" style={{ fontWeight: 500 }}>
            <Redo2 size={13} /> Redo
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {wizardStep === "build" ? (
            <>
              <button onClick={() => setLivePreviewOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] rounded-full border border-tv-border-light text-tv-text-secondary hover:border-tv-brand hover:text-tv-brand transition-all" style={{ fontWeight: 500 }}>
                <Eye size={13} /> Open view
              </button>
              <button onClick={() => handleSave(false)} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full border border-tv-border text-tv-brand hover:bg-tv-brand-tint transition-all" style={{ fontWeight: 600 }}>
                {saving ? "Saving..." : "Save to Library"}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className={`flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full transition-all ${
                  saving
                    ? "bg-tv-surface-active text-tv-text-secondary cursor-not-allowed"
                    : "bg-tv-brand-bg hover:bg-tv-brand-hover text-white"
                }`} style={{ fontWeight: 600 }}>
                <span>{saving ? "Processing..." : "Save & Use in Campaign"}</span>
                <ChevronRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setWizardStep("build")}
                className="flex items-center gap-1.5 text-[13px] text-tv-text-secondary hover:text-tv-text-primary transition-colors" style={{ fontWeight: 500 }}>
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
              <button onClick={() => setLivePreviewOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] rounded-full border border-tv-border-light text-tv-text-secondary hover:border-tv-brand hover:text-tv-brand transition-all" style={{ fontWeight: 500 }}>
                <Eye size={13} /> Live Preview
              </button>
              <button onClick={() => navigate(returnTo)}
                className="flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full bg-tv-brand-bg hover:bg-tv-brand-hover text-white transition-all" style={{ fontWeight: 600 }}>
                <span>Use This Envelope</span>
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Live Preview fullscreen modal */}
      <LivePreviewModal
        open={livePreviewOpen}
        onClose={() => setLivePreviewOpen(false)}
        renderPreview={renderEnvelopePreview}
      />
    </div>
  );
}

export default EnvelopeBuilder;

// ═══════════════════════════════════════════════════════════════════════════════
//  Shared sub-components
// ═══════════════════════════════════════════════════════════════════════════════

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-tv-text-label uppercase tracking-wider mb-2" style={{ fontWeight: 700 }}>
      {children}
    </p>
  );
}

/** Color swatch row — circles + hex display below */
function SwatchRow({ value, onChange, label }: { value: string; onChange: (v: string) => void; label?: string }) {
  const [showCustom, setShowCustom] = useState(false);
  const matchedSwatch = COLOR_SWATCHES.find(s => s.hex.toLowerCase() === value.toLowerCase());

  return (
    <div>
      {label && <p className="text-[10px] text-tv-text-decorative mb-1.5">{label}</p>}
      <div className="flex flex-wrap items-center gap-1.5">
        {COLOR_SWATCHES.map(s => {
          const selected = s.hex.toLowerCase() === value.toLowerCase();
          return (
            <button key={s.hex} onClick={() => onChange(s.hex)}
              className={`w-[22px] h-[22px] rounded-full border-2 transition-all ${
                selected ? "border-tv-brand-bg scale-110" : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: s.hex }}
              title={s.name}
              aria-label={`Select ${s.name}`} />
          );
        })}
        {/* Custom color (rainbow gradient) */}
        <div className="relative">
          <button onClick={() => setShowCustom(!showCustom)}
            className={`w-[22px] h-[22px] rounded-full border-2 transition-all ${
              !matchedSwatch ? "border-tv-brand-bg scale-110" : "border-transparent hover:scale-105"
            }`}
            style={{
              background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
            }}
            title="Custom color"
            aria-label="Custom color" />
          {showCustom && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowCustom(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-[8px] shadow-xl border border-tv-border-light p-2">
                <input type="color" value={safeHex(value)} onChange={e => onChange(e.target.value)}
                  className="w-28 h-28 cursor-pointer border-0" />
              </div>
            </>
          )}
        </div>
      </div>
      {/* Hex display */}
      <div className="flex items-center gap-2 mt-2">
        <div className="w-5 h-5 rounded border border-tv-border-light shrink-0" style={{ backgroundColor: safeHex(value) }} />
        <span className="text-[11px] font-mono text-tv-text-secondary">{value.toUpperCase()}</span>
        <span className="text-[10px] text-tv-text-decorative">· {matchedSwatch?.name || "Custom"}</span>
      </div>
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-tv-border-light bg-white text-[10px] text-tv-text-secondary">
      <strong className="text-tv-text-primary">{label}:</strong> {value}
    </span>
  );
}

function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div className={`w-[14px] h-[14px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
      selected ? "border-tv-brand-bg" : "border-tv-border-strong"
    }`}>
      {selected && <div className="w-1.5 h-1.5 rounded-full bg-tv-brand-bg" />}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Perforated stamp
// ═══════════════════════════════════════════════════════════════════════════════
function PerforatedStamp({ size = 48, accentColor = "#c09696", stampStyle = "classic", customImage }: { size?: number; accentColor?: string; stampStyle?: StampStyle; customImage?: string | null }) {
  const w = size;
  const h = size * 0.65 + 20;
  const notchR = size * 0.035;
  const notchCountH = Math.round(w / (notchR * 3.2));
  const notchCountV = Math.round(h / (notchR * 3.2));

  const buildEdge = (x1: number, y1: number, x2: number, y2: number, count: number) => {
    const segs: string[] = [];
    for (let i = 0; i < count; i++) {
      const t2 = (i + 0.5) / count;
      const t3 = (i + 1) / count;
      const mx = x1 + (x2 - x1) * t2;
      const my = y1 + (y2 - y1) * t2;
      const ex = x1 + (x2 - x1) * t3;
      const ey = y1 + (y2 - y1) * t3;
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      const nx = -dy / len * notchR * 1.2, ny = dx / len * notchR * 1.2;
      segs.push(`Q ${mx + nx} ${my + ny} ${ex} ${ey}`);
    }
    return segs.join(" ");
  };

  const m = notchR * 2;
  const path = [
    `M ${m} ${m}`,
    buildEdge(m, m, w - m, m, notchCountH),
    buildEdge(w - m, m, w - m, h - m, notchCountV),
    buildEdge(w - m, h - m, m, h - m, notchCountH),
    buildEdge(m, h - m, m, m, notchCountV),
    "Z",
  ].join(" ");

  const clipId = `stamp-clip-${size}-${stampStyle}`;
  const iconSize = h * 0.38;
  const cx = w / 2;
  const cy = h / 2;

  // Inner rect inset — the "image area" of the stamp (like the printed part inside the perforated border)
  const inset = size * 0.1;
  const innerX = m + inset;
  const innerY = m + inset;
  const innerW = w - 2 * (m + inset);
  const innerH = h - 2 * (m + inset);
  const innerClipId = `stamp-inner-${size}-${stampStyle}`;

  const renderStampIcon = () => {
    const r = iconSize * 0.58;
    switch (stampStyle) {
      case "heart":
        return (
          <g transform={`translate(${cx}, ${cy - r * 0.15})`}>
            <path
              d={`M 0 ${r * 0.35} C 0 ${r * 1.1} ${-r * 1.1} ${r * 0.5} ${-r * 1.1} ${-r * 0.1} C ${-r * 1.1} ${-r * 0.7} ${-r * 0.55} ${-r * 1.0} 0 ${-r * 0.55} C ${r * 0.55} ${-r * 1.0} ${r * 1.1} ${-r * 0.7} ${r * 1.1} ${-r * 0.1} C ${r * 1.1} ${r * 0.5} 0 ${r * 1.1} 0 ${r * 0.35} Z`}
              fill={accentColor}
            />
          </g>
        );
      case "crest":
        return (
          <g transform={`translate(${cx}, ${cy})`}>
            <path
              d={`M 0 ${-r * 0.95} L ${r * 0.8} ${-r * 0.55} L ${r * 0.8} ${r * 0.25} C ${r * 0.8} ${r * 0.65} ${r * 0.4} ${r * 0.9} 0 ${r * 1.05} C ${-r * 0.4} ${r * 0.9} ${-r * 0.8} ${r * 0.65} ${-r * 0.8} ${r * 0.25} L ${-r * 0.8} ${-r * 0.55} Z`}
              fill="none" stroke={accentColor} strokeWidth={1.2}
            />
            <path
              d={`M 0 ${-r * 0.55} L ${r * 0.45} ${-r * 0.3} L ${r * 0.45} ${r * 0.15} C ${r * 0.45} ${r * 0.4} ${r * 0.22} ${r * 0.55} 0 ${r * 0.65} C ${-r * 0.22} ${r * 0.55} ${-r * 0.45} ${r * 0.4} ${-r * 0.45} ${r * 0.15} L ${-r * 0.45} ${-r * 0.3} Z`}
              fill={accentColor} opacity={0.5}
            />
          </g>
        );
      case "forever":
        return (
          <>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={accentColor} strokeWidth={1.2} />
            <text x={cx} y={cy + r * 0.08} textAnchor="middle" dominantBaseline="middle"
              fill={accentColor} style={{ fontSize: `${r * 1.1}px`, fontWeight: 800, letterSpacing: "-0.5px" }}>
              ∞
            </text>
          </>
        );
      case "classic":
      default:
        return (
          <>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke={accentColor} strokeWidth={1.2} />
            <g transform={`translate(${cx - r * 0.55}, ${cy - r * 0.6})`}>
              <polygon
                points={`${r * 0.55},${0} ${0},${r * 0.4} ${r * 1.1},${r * 0.4}`}
                fill={accentColor}
              />
              <rect x={r * 0.15} y={r * 0.45} width={r * 0.15} height={r * 0.6} fill={accentColor} />
              <rect x={r * 0.48} y={r * 0.45} width={r * 0.15} height={r * 0.6} fill={accentColor} />
              <rect x={r * 0.8} y={r * 0.45} width={r * 0.15} height={r * 0.6} fill={accentColor} />
              <rect x={r * 0.05} y={r * 1.05} width={r * 1.0} height={r * 0.15} fill={accentColor} rx={1} />
            </g>
          </>
        );
    }
  };

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none"
      style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.18))" }}>
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
        <clipPath id={innerClipId}>
          <rect x={innerX} y={innerY} width={innerW} height={innerH} rx={1} />
        </clipPath>
      </defs>
      {/* White stamp base with perforated edge */}
      <path d={path} fill="#faf8f4" stroke="#d4cfc7" strokeWidth={0.6} />
      {/* Accent-tinted inner area */}
      <rect x={innerX} y={innerY} width={innerW} height={innerH} rx={1}
        fill={`${accentColor}18`} stroke={accentColor} strokeWidth={0.5} strokeOpacity={0.35} />
      {customImage ? (
        <image href={customImage} x={innerX} y={innerY} width={innerW} height={innerH}
          preserveAspectRatio="xMidYMid slice" clipPath={`url(#${innerClipId})`} />
      ) : (
        renderStampIcon()
      )}
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Postmark SVG
// ═══════════════════════════════════════════════════════════════════════════════
function PostmarkSVG({ size, color, text, compact = false, bgColor = "transparent" }: { size: number; color: string; text: string; compact?: boolean; bgColor?: string }) {
  const r = size / 2;
  const innerR = r - (compact ? 2.5 : 4);
  const textR = r - (compact ? 4.5 : 7);
  const uid = compact ? "pmc" : "pmf";
  const maskR = innerR - (compact ? 0.3 : 0.5);
  const lineStartX = r * 0.5;
  const wavyLen = compact ? 37 : 72;
  const totalW = lineStartX + wavyLen;
  const lineCount = compact ? 6 : 8;
  const totalLineH = compact ? 14 : 24;
  const maskCutX = r + innerR * 0.08;

  return (
    <svg width={totalW} height={size} viewBox={`0 0 ${totalW} ${size}`} fill="none" className="shrink-0" style={{ overflow: "visible" }}>
      <defs>
        <clipPath id={`${uid}-halfmask`}>
          <rect x={0} y={0} width={maskCutX} height={size} />
        </clipPath>
        <path id={uid} d={`M ${r - textR},${r} A ${textR},${textR} 0 0,0 ${r + textR},${r}`} />
      </defs>
      {Array.from({ length: lineCount }).map((_, i) => {
        const spacing = totalLineH / (lineCount - 1);
        const y = r - totalLineH / 2 + i * spacing;
        const waveW = compact ? 5 : 8;
        const waveA = compact ? 1.2 : 2;
        let d = `M ${lineStartX},${y}`;
        for (let x = 0; x < wavyLen; x += waveW) {
          const amp = Math.floor(x / waveW) % 2 === 0 ? -waveA : waveA;
          const segLen = Math.min(waveW, wavyLen - x);
          d += ` q ${segLen / 2},${amp} ${segLen},0`;
        }
        return <path key={i} d={d} stroke={color} strokeWidth={compact ? 0.7 : 1.1} fill="none" />;
      })}
      <circle cx={r} cy={r} r={maskR} fill={bgColor} clipPath={`url(#${uid}-halfmask)`} />
      <circle cx={r} cy={r} r={r - 1} stroke={color} strokeWidth={compact ? 1.2 : 2} fill="none" />
      <circle cx={r} cy={r} r={innerR} stroke={color} strokeWidth={compact ? 0.6 : 1} fill="none" />
      <text fill={color} stroke={color} strokeWidth={compact ? 0.3 : 0.5} paintOrder="stroke"
        style={{ fontSize: compact ? "4.5px" : "8px", fontWeight: 900, letterSpacing: compact ? "0.4px" : "1px" }}>
        <textPath href={`#${uid}`} startOffset="50%" textAnchor="middle">
          {(text || "YOUR TEXT").toUpperCase()}
        </textPath>
      </text>
      <circle cx={r - innerR + (compact ? 1 : 1.5)} cy={r} r={compact ? 0.7 : 1} fill={color} />
      <circle cx={r + innerR - (compact ? 1 : 1.5)} cy={r} r={compact ? 0.7 : 1} fill={color} />
      <line x1={r - innerR + (compact ? 2.5 : 4)} y1={r} x2={r + innerR - (compact ? 2.5 : 4)} y2={r}
        stroke={color} strokeWidth={compact ? 0.4 : 0.6} />
    </svg>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Envelope Preview
// ═══════════════════════════════════════════════════════════════════════════════
function EnvelopePreview({
  view, envelopeColor, nameColor, primaryColor, design,
  swoop1Color, swoop2Color, stripe1Color, stripe2Color,
  postmark, postmarkText, stampPreview, logoPreview, backFlapLogoPreview, linerColor,
  stampStyle = "classic",
  compact = false,
  frontLogoChoice,
  backLogoChoice,
  frontLogoName,
  backLogoName,
}: {
  view: "front" | "back" | "open";
  envelopeColor: string; nameColor: string; primaryColor: string;
  design: DesignOption;
  swoop1Color: string; swoop2Color: string; stripe1Color: string; stripe2Color: string;
  postmark: PostmarkOption; postmarkText: string;
  stampPreview: string | null; logoPreview: string | null; backFlapLogoPreview: string | null;
  linerColor: string; stampStyle?: StampStyle; compact?: boolean;
  frontLogoChoice?: LogoChoice; backLogoChoice?: LogoChoice;
  frontLogoName?: string | null; backLogoName?: string | null;
}) {
  const pmColor = postmark === "black" ? (isDark(envelopeColor) ? "#000000b0" : "#000000cc")
    : postmark === "white" ? (isDark(envelopeColor) ? "#ffffffdd" : "#ffffffaa") : "transparent";
  const stampSize = compact ? 40 : 72;

  // ── FRONT ──
  if (view === "front") {
    return (
      <div className="aspect-[3/2] rounded-[12px] overflow-hidden relative"
        style={{ backgroundColor: envelopeColor, boxShadow: compact ? "2px 3px 8px rgba(0,0,0,0.15)" : "4px 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_TEXTURE, backgroundSize: "200px 200px", mixBlendMode: "overlay" }} />

        {/* Designs */}
        {design === "single-swoop" && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 266" preserveAspectRatio="none">
            <path d="M-5,266 L-5,248 Q50,218 110,240 Q170,262 230,232 Q290,202 350,228 Q380,240 405,222 L405,266 Z" fill={swoop1Color} />
          </svg>
        )}
        {design === "double-swoop" && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 266" preserveAspectRatio="none">
            <path d="M-5,266 L-5,240 Q60,206 130,232 Q200,258 270,224 Q340,190 405,218 L405,266 Z" fill={swoop1Color} />
            <path d="M-5,266 L-5,252 Q70,228 140,248 Q210,268 280,240 Q350,212 405,236 L405,266 Z" fill={swoop2Color} />
          </svg>
        )}
        {design === "single-stripe" && (
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: "8%", backgroundColor: stripe1Color }} />
        )}
        {design === "double-stripes" && (
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
            <div style={{ height: compact ? "3px" : "6px", backgroundColor: stripe1Color }} />
            <div style={{ height: compact ? "1.5px" : "3px" }} />
            <div style={{ height: compact ? "2px" : "4px", backgroundColor: stripe2Color }} />
          </div>
        )}
        {design === "triple-stripes" && (
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none flex flex-col">
            <div style={{ height: compact ? "2px" : "5px", backgroundColor: stripe1Color }} />
            <div style={{ height: compact ? "1px" : "2px" }} />
            <div style={{ height: compact ? "2px" : "4px", backgroundColor: stripe2Color }} />
            <div style={{ height: compact ? "1px" : "2px" }} />
            <div style={{ height: compact ? "1.5px" : "3px", backgroundColor: stripe1Color }} />
          </div>
        )}
        {design === "airmail-stripe" && (
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none overflow-hidden" style={{ height: compact ? "6px" : "12px" }}>
            <div className="w-[200%] h-full" style={{
              background: `repeating-linear-gradient(135deg, ${stripe1Color} 0px, ${stripe1Color} 8px, transparent 8px, transparent 16px, ${stripe2Color} 16px, ${stripe2Color} 24px, transparent 24px, transparent 32px)`,
            }} />
          </div>
        )}

        {/* Stamp + Postmark */}
        <div className={`absolute ${compact ? "top-[5%] right-[4%]" : "top-[6%] right-[4%]"} flex items-center`} style={{ zIndex: 2 }}>
          {postmark !== "none" && (
            <div style={{ zIndex: 3, marginRight: 4 }}>
              <PostmarkSVG size={compact ? 26 : 44} color={pmColor} text={postmarkText} compact={compact} bgColor={envelopeColor} />
            </div>
          )}
          <div className="relative" style={{ zIndex: 1 }}>
            <PerforatedStamp size={stampSize} accentColor={primaryColor} stampStyle={stampStyle} customImage={stampPreview} />
          </div>
        </div>

        {/* Logo */}
        {logoPreview && (
          <div className={`absolute ${compact ? "top-[5%] left-[4%]" : "top-[6%] left-[4%]"}`} style={{ zIndex: 2 }}>
            {logoPreview.startsWith("blob:") ? (
              <div className={`${compact ? "w-6 h-6" : "w-10 h-10"} rounded-[4px] overflow-hidden bg-white/20 flex items-center justify-center`}>
                <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (() => {
              const recentLogo = frontLogoName ? RECENT_LOGOS.find(l => l.id === frontLogoName) : null;
              if (recentLogo) {
                const RIcon = recentLogo.icon;
                return (
                  <div className={`${compact ? "w-6 h-6" : "w-10 h-10"} rounded-full flex items-center justify-center`} style={{ backgroundColor: recentLogo.bg }}>
                    <RIcon size={compact ? 10 : 16} className="text-white" />
                  </div>
                );
              }
              const LogoIcon = frontLogoChoice === "wordmark" ? Building2 : frontLogoChoice === "university-seal" ? Award : Shield;
              return (
                <div className={`${compact ? "w-6 h-6" : "w-10 h-10"} rounded-[4px] bg-white/20 flex items-center justify-center`}>
                  <LogoIcon size={compact ? 10 : 16} className="opacity-70" style={{ color: nameColor }} />
                </div>
              );
            })()}
          </div>
        )}

        {/* Name */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className={`${compact ? "text-[8px]" : "text-[16px]"} italic`}
            style={{ color: nameColor, fontWeight: 500, letterSpacing: "0.02em" }}>
            Mr. John Smith
          </span>
        </div>
      </div>
    );
  }

  // ── BACK (closed — realistic 4-flap sealed envelope) ──
  if (view === "back") {
    const dark = isDark(envelopeColor);
    const flapDark = dark ? 0.15 : 0.08;
    const edgeAlpha = dark ? 0.3 : 0.18;
    const hlAlpha = dark ? 0.08 : 0.12;

    return (
      <div className="aspect-[3/2] rounded-[12px] overflow-hidden relative"
        style={{ backgroundColor: envelopeColor, boxShadow: compact ? "2px 3px 8px rgba(0,0,0,0.15)" : "4px 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_TEXTURE, backgroundSize: "200px 200px", mixBlendMode: "overlay" }} />

        {/* 4-flap structure */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 266" preserveAspectRatio="none">
          <defs>
            <linearGradient id="topFlapGrad" x1="200" y1="133" x2="200" y2="50" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor={`rgba(0,0,0,0.07)`} />
              <stop offset="100%" stopColor={`rgba(0,0,0,0)`} />
            </linearGradient>
          </defs>
          <polygon points="55,266 200,180 345,266" fill={`rgba(0,0,0,${flapDark * 0.4})`} />
          <line x1="55" y1="266" x2="200" y2="180" stroke={`rgba(0,0,0,${edgeAlpha * 0.4})`} strokeWidth="0.7" />
          <line x1="345" y1="266" x2="200" y2="180" stroke={`rgba(0,0,0,${edgeAlpha * 0.4})`} strokeWidth="0.7" />
          <polygon points="0,30 0,236 155,133" fill={`rgba(0,0,0,${flapDark * 0.6})`} />
          <polygon points="0,30 0,236 155,133" fill={`rgba(255,255,255,${hlAlpha * 0.25})`} />
          <line x1="0" y1="30" x2="155" y2="133" stroke={`rgba(0,0,0,${edgeAlpha * 0.9})`} strokeWidth="0.9" />
          <line x1="0" y1="236" x2="155" y2="133" stroke={`rgba(0,0,0,${edgeAlpha * 0.5})`} strokeWidth="0.7" />
          <polygon points="400,30 400,236 245,133" fill={`rgba(0,0,0,${flapDark * 0.6})`} />
          <polygon points="400,30 400,236 245,133" fill={`rgba(255,255,255,${hlAlpha * 0.25})`} />
          <line x1="400" y1="30" x2="245" y2="133" stroke={`rgba(0,0,0,${edgeAlpha * 0.9})`} strokeWidth="0.9" />
          <line x1="400" y1="236" x2="245" y2="133" stroke={`rgba(0,0,0,${edgeAlpha * 0.5})`} strokeWidth="0.7" />
          <polygon points="0,0 200,133 400,0" fill={`rgba(0,0,0,${flapDark})`} />
          <polygon points="0,0 200,133 400,0" fill="url(#topFlapGrad)" />
          <line x1="0" y1="0" x2="200" y2="133" stroke={`rgba(0,0,0,${edgeAlpha * 1.1})`} strokeWidth="1.1" />
          <line x1="400" y1="0" x2="200" y2="133" stroke={`rgba(0,0,0,${edgeAlpha * 1.1})`} strokeWidth="1.1" />
          <line x1="24" y1="3" x2="200" y2="130" stroke={`rgba(255,255,255,${hlAlpha * 0.4})`} strokeWidth="0.5" />
          <line x1="376" y1="3" x2="200" y2="130" stroke={`rgba(255,255,255,${hlAlpha * 0.4})`} strokeWidth="0.5" />
        </svg>

        {/* Back flap logo */}
        {backFlapLogoPreview && (
          <div className="absolute left-1/2 -translate-x-1/2" style={{ zIndex: 2, top: compact ? "12%" : "10%" }}>
            {backFlapLogoPreview.startsWith("blob:") ? (
              <div className={`${compact ? "w-8 h-8" : "w-14 h-14"} rounded-full overflow-hidden bg-white/20 flex items-center justify-center`}
                style={{ border: "1.5px solid rgba(255,255,255,0.2)", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                <img src={backFlapLogoPreview} alt="Back logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (() => {
              const recentLogo = backLogoName ? RECENT_LOGOS.find(l => l.id === backLogoName) : null;
              if (recentLogo) {
                const RIcon = recentLogo.icon;
                return (
                  <div className={`${compact ? "w-8 h-8" : "w-14 h-14"} rounded-full flex items-center justify-center`}
                    style={{ backgroundColor: recentLogo.bg, border: "1.5px solid rgba(255,255,255,0.2)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
                    <RIcon size={compact ? 12 : 22} className="text-white" />
                  </div>
                );
              }
              const LogoIcon = backLogoChoice === "wordmark" ? Building2 : backLogoChoice === "university-seal" ? Award : Shield;
              return (
                <div className={`${compact ? "w-8 h-8" : "w-14 h-14"} rounded-full flex items-center justify-center`}
                  style={{ backgroundColor: `rgba(255,255,255,0.15)`, border: "1.5px solid rgba(255,255,255,0.2)", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
                  <LogoIcon size={compact ? 12 : 22} className="opacity-70" style={{ color: nameColor }} />
                </div>
              );
            })()}
          </div>
        )}

        {/* Wax seal */}
        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: "46%", zIndex: 3 }}>
          <div className={`${compact ? "w-5 h-5" : "w-8 h-8"} rounded-full flex items-center justify-center`}
            style={{
              backgroundColor: primaryColor,
              boxShadow: compact
                ? "0 1px 3px rgba(0,0,0,0.25), inset 0 1px 2px rgba(255,255,255,0.15)"
                : "0 2px 6px rgba(0,0,0,0.3), inset 0 1px 3px rgba(255,255,255,0.2)",
            }}>
            <div className={`${compact ? "w-2.5 h-2.5" : "w-4 h-4"} rounded-full`}
              style={{
                border: `${compact ? "0.5px" : "1px"} solid rgba(255,255,255,0.25)`,
                background: "radial-gradient(circle at 35% 35%, rgba(255,255,255,0.3), transparent 60%)",
              }} />
          </div>
        </div>
      </div>
    );
  }

  // ── OPEN ──
  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 400 160" preserveAspectRatio="none" className="w-full pointer-events-none"
        style={{ display: "block", marginBottom: "-1px", filter: compact ? "drop-shadow(0 -1px 2px rgba(0,0,0,0.08))" : "drop-shadow(0 -2px 4px rgba(0,0,0,0.1))" }}>
        <polygon points="0,160 200,4 400,160" fill={linerColor} />
        <polygon points="0,160 200,4 400,160" fill={envelopeColor} fillOpacity="0.15" />
        <polygon points="0,160 200,4 400,160" fill="none" stroke={`${primaryColor}30`} strokeWidth="1.2" />
      </svg>
      <div className="w-full aspect-[3/2] rounded-b-[12px] overflow-hidden relative"
        style={{ backgroundColor: envelopeColor, boxShadow: compact ? "2px 3px 8px rgba(0,0,0,0.15)" : "4px 6px 20px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: PAPER_TEXTURE, backgroundSize: "200px 200px", mixBlendMode: "overlay" }} />
        <svg className="absolute top-0 left-0 w-full pointer-events-none" viewBox="0 0 400 120" preserveAspectRatio="none" style={{ height: "45%" }}>
          <polygon points="0,0 200,120 400,0" fill={linerColor} />
          <polygon points="0,0 200,120 400,0" fill="black" fillOpacity="0.06" />
        </svg>
        <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{ height: "1.5px", backgroundColor: `${primaryColor}20` }} />
        <div className={`absolute ${compact ? "inset-x-3 top-[8%] bottom-3" : "inset-x-5 top-[6%] bottom-4"} bg-white rounded-[6px] flex items-center justify-center`}
          style={{ boxShadow: compact ? "0 1px 4px rgba(0,0,0,0.12)" : "0 2px 8px rgba(0,0,0,0.12)" }}>
          <div className="text-center">
            <div className={`${compact ? "w-8 h-8" : "w-14 h-14"} rounded-full bg-tv-brand-tint flex items-center justify-center mx-auto mb-2`}>
              <Play size={compact ? 10 : 18} className="text-tv-brand ml-0.5" />
            </div>
            <p className={`${compact ? "text-[7px]" : "text-[11px]"} text-tv-text-secondary`}>Your ThankView</p>
          </div>
        </div>
      </div>
    </div>
  );
}
