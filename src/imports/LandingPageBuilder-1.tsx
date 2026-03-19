/**
 * LandingPageBuilder — 2-step wizard: Build → Finish
 *
 * Build step:  Left accordion form (480 px) + right live preview with device toggle
 * Finish step: Left success message + right final preview
 *
 * Accordion sections:
 *   1. Landing Page Title
 *   2. Navigation Bar (color + logo upload)
 *   3. Your Background  (upload / grid of saved images / color / gradient)
 *   4. Button Colors (6 color inputs)
 */
import { useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  ChevronLeft, ChevronRight, ChevronDown, Check, X, Plus,
  Play, Eye, Upload, Trash2, Pencil, Info,
  Landmark, Star, Mail, Globe, Monitor, Tablet, Smartphone,
  Image as ImageIcon, Droplets, Palette, ArrowDown, ArrowRight, ArrowDownRight, ArrowDownLeft,
  Undo2, Redo2,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { LandingPageLivePreviewModal } from "../components/LandingPageLivePreviewModal";

// ── Types ────────────────────────────────────────────────────────────────────
type WizardStep = "build" | "finish";
type DeviceView = "desktop" | "tablet" | "mobile";
type BgKind = "image" | "color" | "gradient";
type GradientDir = "to bottom" | "to right" | "to bottom right" | "to bottom left" | "to top" | "to left";

interface Background {
  id: number;
  name: string;
  kind: BgKind;
  url?: string;            // image
  color?: string;          // solid color
  gradientFrom?: string;   // gradient
  gradientTo?: string;
  gradientDir?: GradientDir;
}

// ── Background library ──────────────────────────────────────────────────────
const DEFAULT_BACKGROUNDS: Background[] = [
  { id: 1, kind: "image", name: "Campus Aerial", url: "https://images.unsplash.com/photo-1605221011656-10dff4f1549b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwZHJvbmUlMjBncmVlbiUyMHF1YWR8ZW58MXx8fHwxNzczMDc3OTEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 2, kind: "image", name: "Graduation Day", url: "https://images.unsplash.com/photo-1747836385998-91224d0fe041?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkdWF0aW9uJTIwY2VyZW1vbnklMjBjYXBzJTIwdGhyb3duJTIwc3Vubnl8ZW58MXx8fHwxNzczMDc3OTEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 3, kind: "image", name: "Library Interior", url: "https://images.unsplash.com/photo-1629059465910-a5498f0bc2f5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcm5hdGUlMjBjb2xsZWdlJTIwbGlicmFyeSUyMHJlYWRpbmclMjByb29tJTIwc3VubGlnaHR8ZW58MXx8fHwxNzczMDc3OTEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 4, kind: "image", name: "Autumn Walkway", url: "https://images.unsplash.com/photo-1742093151014-c736bdb64368?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhdXR1bW4lMjB0cmVlJTIwbGluZWQlMjBjYW1wdXMlMjB3YWxrd2F5JTIwZ29sZGVuJTIwbGVhdmVzfGVufDF8fHx8MTc3MzA3NzkxM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 5, kind: "image", name: "Spring Walkway", url: "https://images.unsplash.com/photo-1771042101874-0c109ad92fa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGVycnklMjBibG9zc29tJTIwdW5pdmVyc2l0eSUyMGNhbXB1cyUyMHNwcmluZyUyMHBhdGh3YXl8ZW58MXx8fHwxNzczMDc3OTEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  { id: 6, kind: "image", name: "Campus Building", url: "https://images.unsplash.com/photo-1621009047117-30b97f97965b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpdnklMjBjb3ZlcmVkJTIwYnJpY2slMjB1bml2ZXJzaXR5JTIwaGFsbCUyMGJsdWUlMjBza3l8ZW58MXx8fHwxNzczMDc3OTE3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" },
  // Preset solid colors
  { id: 100, kind: "color", name: "Deep Navy", color: "#1a1a2e" },
  { id: 101, kind: "color", name: "Warm Ivory", color: "#f5f0e8" },
  { id: 102, kind: "color", name: "Sage Green", color: "#a8c5a0" },
  { id: 103, kind: "color", name: "Soft Blush", color: "#f4d9d0" },
  // Preset gradients
  { id: 200, kind: "gradient", name: "Sunset Glow", gradientFrom: "#f093fb", gradientTo: "#f5576c", gradientDir: "to bottom right" },
  { id: 201, kind: "gradient", name: "Ocean Breeze", gradientFrom: "#4facfe", gradientTo: "#00f2fe", gradientDir: "to right" },
  { id: 202, kind: "gradient", name: "Forest Mist", gradientFrom: "#0ba360", gradientTo: "#3cba92", gradientDir: "to bottom" },
  { id: 203, kind: "gradient", name: "Warm Dusk", gradientFrom: "#a18cd1", gradientTo: "#fbc2eb", gradientDir: "to bottom right" },
];

const GRADIENT_DIRECTIONS: { dir: GradientDir; icon: typeof ArrowDown; label: string }[] = [
  { dir: "to bottom",       icon: ArrowDown,      label: "↓" },
  { dir: "to right",        icon: ArrowRight,      label: "→" },
  { dir: "to bottom right", icon: ArrowDownRight,  label: "↘" },
  { dir: "to bottom left",  icon: ArrowDownLeft,   label: "↙" },
];

function bgCss(bg: Background): string {
  if (bg.kind === "color")    return bg.color || "#ffffff";
  if (bg.kind === "gradient") return `linear-gradient(${bg.gradientDir || "to bottom"}, ${bg.gradientFrom || "#000"}, ${bg.gradientTo || "#fff"})`;
  return "";
}

// ── Logo presets ────────────────────────────────────────────────────────────
const LOGO_OPTIONS = [
  { id: "shield" as const, label: "Shield Crest", icon: Landmark },
  { id: "star" as const,   label: "Star Mark",    icon: Star },
  { id: "mail" as const,   label: "Letter Mark",  icon: Mail },
  { id: "none" as const,   label: "None",         icon: X },
];
type LogoId = (typeof LOGO_OPTIONS)[number]["id"];

// ── Helpers ─────────────────────────────────────────────────────────────────
const inputCls = "w-full border border-tv-border-light rounded-[10px] px-3 py-2.5 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand-bg/30 bg-white";

function safeHex(hex: string): string {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  return "#" + clean.padEnd(6, "0");
}

function isDarkColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

// ═════════════════════════════════════════════════════════════════════════════
// Main component
// ═════════════════════════════════════════════════════════════════════════════
export function LandingPageBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { show } = useToast();
  const returnTo = searchParams.get("returnTo") || "/campaigns/create";

  // ── Wizard ──────────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>("build");
  const [saving, setSaving] = useState(false);

  // ── Form state ──────────────────────────────────────────────────────────
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState(false);

  // Nav bar
  const [navBarColor, setNavBarColor] = useState("#7c45b0");
  const [logo, setLogo] = useState<LogoId>("shield");
  const [logoFile, setLogoFile] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Background
  const [backgrounds, setBackgrounds] = useState(DEFAULT_BACKGROUNDS);
  const [selectedBgId, setSelectedBgId] = useState<number | null>(1);
  const [fadeGradient, setFadeGradient] = useState(true);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showUploadNaming, setShowUploadNaming] = useState(false);
  const [newBgName, setNewBgName] = useState("");
  const bgInputRef = useRef<HTMLInputElement>(null);
  const [bgTab, setBgTab] = useState<BgKind>("image");
  const [bgDragOver, setBgDragOver] = useState(false);
  const [pendingBgFile, setPendingBgFile] = useState<string | null>(null); // objectURL for new upload

  // New solid color / gradient builder state
  const [newColorHex, setNewColorHex] = useState("#1a1a2e");
  const [newColorName, setNewColorName] = useState("");
  const [newGradFrom, setNewGradFrom] = useState("#f093fb");
  const [newGradTo, setNewGradTo] = useState("#f5576c");
  const [newGradDir, setNewGradDir] = useState<GradientDir>("to bottom right");
  const [newGradName, setNewGradName] = useState("");

  // Button colors (6 fields per spec)
  const [ctaTextColor, setCtaTextColor] = useState("#ffffff");
  const [ctaBtnColor, setCtaBtnColor] = useState("#7c45b0");
  const [secondaryBtnTextColor, setSecondaryBtnTextColor] = useState("#374151");
  const [replyBtnColor, setReplyBtnColor] = useState("#374151");
  const [saveBtnColor, setSaveBtnColor] = useState("#7c45b0");
  const [shareBtnColor, setShareBtnColor] = useState("#14532d");

  // Preview device
  const [device, setDevice] = useState<DeviceView>("desktop");

  // Live preview modal
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Accordion state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    title: true, navbar: true, background: false, buttons: false,
  });
  const toggleSection = useCallback((key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────
  const selectedBg = backgrounds.find(b => b.id === selectedBgId);

  // ── Background management ──────────────────────────────────────────────
  const deleteBg = (id: number) => {
    const bg = backgrounds.find(b => b.id === id);
    setBackgrounds(prev => prev.filter(b => b.id !== id));
    if (selectedBgId === id) setSelectedBgId(null);
    if (bg) show(`"${bg.name}" removed`, "info");
  };

  const startRename = (id: number) => {
    const bg = backgrounds.find(b => b.id === id);
    if (bg) { setRenamingId(id); setRenameValue(bg.name); }
  };
  const confirmRename = () => {
    if (renamingId && renameValue.trim()) {
      setBackgrounds(prev => prev.map(b => b.id === renamingId ? { ...b, name: renameValue.trim() } : b));
      setRenamingId(null);
    }
  };

  // ── Logo file ──────────────────────────────────────────────────────────
  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setLogoFile(URL.createObjectURL(file));
    e.target.value = "";
  };

  // ── Actions ────────────────────────────────────────────────────────────
  const handleSave = (useInCampaign: boolean) => {
    if (!name.trim()) {
      setNameError(true);
      setOpenSections(prev => ({ ...prev, title: true }));
      show("Please enter a landing page title", "warning");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      const data = {
        id: Date.now(),
        name: name.trim(),
        navBarColor, logo, logoFile,
        fadeGradient,
        backgroundId: selectedBgId,
        backgroundUrl: selectedBg?.url || null,
        backgroundKind: selectedBg?.kind || null,
        backgroundCss: selectedBg ? bgCss(selectedBg) : null,
        ctaTextColor, ctaBtnColor, secondaryBtnTextColor,
        replyBtnColor, saveBtnColor, shareBtnColor,
      };
      sessionStorage.setItem("tv-saved-landing-page", JSON.stringify(data));
      setSaving(false);
      if (useInCampaign) {
        show("Landing page saved & selected!", "success");
        navigate(returnTo);
      } else {
        setStep("finish");
        show("Landing page saved to library!", "success");
      }
    }, 1200);
  };

  // ═════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Hidden file inputs */}
      <input type="file" accept=".png,.jpg,.jpeg" ref={logoInputRef} onChange={handleLogoFile}
        aria-hidden="true" tabIndex={-1}
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }} />
      <input type="file" accept=".png,.jpg,.jpeg" ref={bgInputRef} onChange={e => {
          const file = e.target.files?.[0];
          if (file && file.type.startsWith("image/")) {
            setPendingBgFile(URL.createObjectURL(file));
            setNewBgName("");
            setShowUploadNaming(true);
          }
          e.target.value = "";
        }}
        aria-hidden="true" tabIndex={-1}
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0,0,0,0)" }} />

      {/* ═══ Header ══════════════════════════════════════════════════════════ */}
      <div className="shrink-0 px-6 py-4 border-b border-tv-border-divider">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(returnTo)} className="text-tv-text-secondary hover:text-tv-text-primary transition-colors" aria-label="Go back">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-[18px] text-tv-text-primary" style={{ fontWeight: 800 }}>{name || "New Landing Page"}</h1>
            <p className="text-[12px] text-tv-text-secondary">{name || "New Landing Page"}</p>
          </div>
        </div>
      </div>

      {/* ═══ Content ═════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex min-h-0">
        {step === "build" ? (
          <>
            {/* ── Left panel ──────────────────────────────────────────────── */}
            <div className="w-[380px] shrink-0 flex flex-col border-r border-tv-border-divider">
              <div className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-0">

                  {/* Section 1: Landing Page Title */}
                  <AccordionSection title="Landing Page Title" open={!!openSections.title} onToggle={() => toggleSection("title")}
                    helper="Use a memorable name to find it quickly.">
                    <div>
                      <label className="text-[11px] text-tv-text-label mb-1.5 block font-semibold">
                        Page Title <span className="text-tv-danger">*</span>
                      </label>
                      <input value={name}
                        onChange={e => { if (e.target.value.length <= 20) { setName(e.target.value); if (e.target.value.trim()) setNameError(false); } }}
                        placeholder="Annual Fund Thank You"
                        className={`${inputCls} ${nameError ? "border-tv-danger ring-2 ring-tv-danger/20" : ""}`} />
                      <div className="flex items-center justify-between mt-1">
                        {nameError && <span className="text-[9px] text-tv-danger">Required</span>}
                        <span className={`text-[9px] ml-auto ${name.length >= 20 ? "text-tv-danger" : "text-tv-text-decorative"}`}>
                          {name.length}/20
                        </span>
                      </div>
                    </div>
                  </AccordionSection>

                  {/* Section 2: Navigation Bar */}
                  <AccordionSection title="Navigation Bar" open={!!openSections.navbar} onToggle={() => toggleSection("navbar")}
                    helper="Style your landing page with branded elements." hasInfo>
                    <div className="space-y-4">
                      {/* Nav bar color */}
                      <ColorField label="Navigation Bar Color" value={navBarColor} onChange={setNavBarColor} required />

                      {/* Organization Logo */}
                      <div>
                        <label className="text-[10px] text-tv-text-label uppercase tracking-wider mb-2 block font-semibold">
                          Organization Logo
                        </label>
                        {/* Preset logos */}
                        

                        {/* Upload zone */}
                        {logoFile ? (
                          <div className="relative w-full h-20 rounded-[10px] border border-tv-border-light overflow-hidden bg-tv-surface/30 flex items-center justify-center group mb-2">
                            <img src={logoFile} alt="Logo" className="max-h-full max-w-full object-contain" />
                            <button type="button" onClick={() => setLogoFile(null)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-tv-danger/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <X size={10} strokeWidth={3} />
                            </button>
                          </div>
                        ) : null}
                        <button type="button" onClick={() => logoInputRef.current?.click()}
                          className="w-full border-2 border-dashed border-tv-border-light rounded-[12px] p-5 text-center hover:border-tv-brand/40 transition-colors cursor-pointer">
                          <Upload size={20} className="mx-auto text-tv-text-decorative mb-1.5" />
                          <p className="text-[12px] text-tv-text-secondary">Drag an image to upload</p>
                          <p className="text-[9px] text-tv-text-decorative mt-1">High-quality .png or .jpeg recommended.</p>
                        </button>
                        <button type="button" onClick={() => logoInputRef.current?.click()}
                          className="mt-2 w-full py-2.5 text-center rounded-[10px] border border-tv-border-light text-[12px] text-tv-text-primary hover:border-tv-brand hover:bg-tv-brand-tint/40 transition-all cursor-pointer" style={{ fontWeight: 500 }}>
                          Choose File
                        </button>
                      </div>
                    </div>
                  </AccordionSection>

                  {/* Section 3: Your Background */}
                  <AccordionSection title="Your Background" open={!!openSections.background} onToggle={() => toggleSection("background")}
                    helper="Place an image, solid color, or gradient behind your video." hasInfo>
                    <div className="space-y-4">

                      {/* ── Tab bar: Image | Color | Gradient ── */}
                      <div className="flex rounded-[10px] border border-tv-border-light overflow-hidden">
                        {([
                          { key: "image" as BgKind, label: "Image", icon: ImageIcon },
                          { key: "color" as BgKind, label: "Color", icon: Palette },
                          { key: "gradient" as BgKind, label: "Gradient", icon: Droplets },
                        ]).map(tab => (
                          <button key={tab.key} type="button" onClick={() => setBgTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] transition-colors ${
                              bgTab === tab.key ? "bg-tv-brand-bg text-white" : "text-tv-text-secondary hover:bg-tv-surface"
                            }`} style={{ fontWeight: bgTab === tab.key ? 600 : 400 }}>
                            <tab.icon size={12} />
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Gradient overlay toggle (shared across all tabs) */}
                      <button type="button" onClick={() => setFadeGradient(!fadeGradient)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-[10px] border text-[12px] transition-all ${
                          !fadeGradient ? "border-tv-brand bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"
                        }`}>
                        <div className="text-left">
                          <p className="text-tv-text-primary" style={{ fontWeight: 500 }}>Fade to white overlay</p>
                          <p className="text-[9px] text-tv-text-secondary">Softens bottom edge for text readability</p>
                        </div>
                        <div className={`w-9 h-5 rounded-full relative shrink-0 transition-colors ${fadeGradient ? "bg-tv-brand-bg" : "bg-tv-surface-active"}`}>
                          <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${fadeGradient ? "left-[17px]" : "left-[2px]"}`} />
                        </div>
                      </button>

                      {/* ─── IMAGE TAB ─────────────────────────────────── */}
                      {bgTab === "image" && (
                        <div className="space-y-3">
                          {/* Drag & drop zone */}
                          <div
                            onDragOver={e => { e.preventDefault(); setBgDragOver(true); }}
                            onDragLeave={() => setBgDragOver(false)}
                            onDrop={e => {
                              e.preventDefault(); setBgDragOver(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file && file.type.startsWith("image/")) {
                                setPendingBgFile(URL.createObjectURL(file));
                                setNewBgName("");
                                setShowUploadNaming(true);
                              }
                            }}
                            onClick={() => bgInputRef.current?.click()}
                            className={`w-full border-2 border-dashed rounded-[12px] p-5 text-center cursor-pointer transition-all ${
                              bgDragOver
                                ? "border-tv-brand bg-tv-brand-tint/50 scale-[1.01]"
                                : "border-tv-border-light hover:border-tv-brand/40"
                            }`}>
                            <Upload size={20} className={`mx-auto mb-1.5 ${bgDragOver ? "text-tv-brand" : "text-tv-text-decorative"}`} />
                            <p className="text-[12px] text-tv-text-secondary">
                              {bgDragOver ? "Drop image here" : "Drag an image or click to upload"}
                            </p>
                            <p className="text-[9px] text-tv-text-decorative mt-1">.png or .jpeg &middot; saved for future use</p>
                          </div>

                          {/* Upload naming dialog */}
                          {showUploadNaming && (
                            <div className="p-3 bg-tv-surface rounded-[10px] border border-tv-border-light space-y-2">
                              {pendingBgFile && (
                                <div className="w-full h-16 rounded-[8px] overflow-hidden mb-1">
                                  <img src={pendingBgFile} alt="Preview" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <label className="text-[10px] text-tv-text-label uppercase tracking-wider block font-semibold">Name this image *</label>
                              <input autoFocus value={newBgName} onChange={e => setNewBgName(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === "Enter" && newBgName.trim()) {
                                    const newBg: Background = { id: Date.now(), kind: "image", name: newBgName.trim(), url: pendingBgFile || "https://images.unsplash.com/photo-1605221011656-10dff4f1549b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwZHJvbmUlMjBncmVlbiUyMHF1YWR8ZW58MXx8fHwxNzczMDc3OTEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" };
                                    setBackgrounds(prev => [...prev, newBg]); setSelectedBgId(newBg.id); setShowUploadNaming(false); setNewBgName(""); setPendingBgFile(null); show(`"${newBg.name}" saved`, "success");
                                  }
                                  if (e.key === "Escape") { setShowUploadNaming(false); setPendingBgFile(null); }
                                }}
                                placeholder="e.g. Spring Campus 2026"
                                className="w-full border border-tv-border-light rounded-[8px] px-2.5 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand-bg/30" />
                              <div className="flex items-center gap-2">
                                <button type="button" onClick={() => { setShowUploadNaming(false); setPendingBgFile(null); }} className="px-2.5 py-1 text-[11px] text-tv-text-secondary hover:text-tv-text-primary">Cancel</button>
                                <button type="button" onClick={() => {
                                  if (!newBgName.trim()) return;
                                  const newBg: Background = { id: Date.now(), kind: "image", name: newBgName.trim(), url: pendingBgFile || "https://images.unsplash.com/photo-1605221011656-10dff4f1549b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwZHJvbmUlMjBncmVlbiUyMHF1YWR8ZW58MXx8fHwxNzczMDc3OTEyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral" };
                                  setBackgrounds(prev => [...prev, newBg]); setSelectedBgId(newBg.id); setShowUploadNaming(false); setNewBgName(""); setPendingBgFile(null); show(`"${newBg.name}" saved`, "success");
                                }} disabled={!newBgName.trim()}
                                  className="px-3 py-1 bg-tv-brand-bg text-white text-[11px] rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-40 flex items-center gap-1 font-semibold">
                                  <Upload size={10} />Save
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Thumbnail grid — images only + No Background */}
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setSelectedBgId(null)}
                              className={`group relative rounded-[10px] overflow-hidden border-2 transition-all ${selectedBgId === null ? "border-tv-brand ring-2 ring-tv-brand/20" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                              <div className="aspect-[4/3] bg-tv-surface flex items-center justify-center"><X size={16} className="text-tv-text-decorative" /></div>
                              <div className="px-2 py-1.5 bg-white"><p className={`text-[10px] truncate ${selectedBgId === null ? "text-tv-brand" : "text-tv-text-secondary"}`} style={{ fontWeight: 500 }}>No Background</p></div>
                              {selectedBgId === null && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-tv-brand flex items-center justify-center"><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                            </button>
                            {backgrounds.filter(bg => bg.kind === "image").map(bg => (
                              <div key={bg.id} className={`group relative rounded-[10px] overflow-hidden border-2 transition-all cursor-pointer ${selectedBgId === bg.id ? "border-tv-brand ring-2 ring-tv-brand/20" : "border-tv-border-light hover:border-tv-border-strong"}`} onClick={() => setSelectedBgId(bg.id)}>
                                <div className="aspect-[4/3] overflow-hidden">{bg.url?.startsWith("blob:") ? <img src={bg.url} alt={bg.name} className="w-full h-full object-cover" /> : <ImageWithFallback src={bg.url!} alt={bg.name} className="w-full h-full object-cover" />}</div>
                                <div className="px-2 py-1.5 bg-white flex items-center justify-between">
                                  {renamingId === bg.id ? (
                                    <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()}>
                                      <input autoFocus value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => { if (e.key === "Enter") confirmRename(); if (e.key === "Escape") setRenamingId(null); }} className="flex-1 text-[10px] border border-tv-border-light rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-tv-brand-bg/30" />
                                      <button onClick={confirmRename} className="p-0.5 text-tv-brand"><Check size={10} /></button>
                                    </div>
                                  ) : (<>
                                    <p className={`text-[10px] truncate flex-1 ${selectedBgId === bg.id ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 500 }}>{bg.name}</p>
                                    <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                      <button onClick={() => startRename(bg.id)} className="p-0.5 text-tv-text-decorative hover:text-tv-info" title="Rename"><Pencil size={9} /></button>
                                      <button onClick={() => deleteBg(bg.id)} className="p-0.5 text-tv-text-decorative hover:text-tv-danger" title="Delete"><Trash2 size={9} /></button>
                                    </div></>)}
                                </div>
                                {selectedBgId === bg.id && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-tv-brand flex items-center justify-center"><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ─── COLOR TAB ─────────────────────────────────── */}
                      {bgTab === "color" && (
                        <div className="space-y-3">
                          <div className="p-3 bg-tv-surface rounded-[10px] border border-tv-border-light space-y-3">
                            <p className="text-[10px] text-tv-text-label uppercase tracking-wider font-semibold">Create Solid Color</p>
                            <div className="flex items-center gap-2">
                              <label className="w-12 h-12 rounded-[10px] border border-tv-border-light cursor-pointer shrink-0 relative overflow-hidden shadow-sm" style={{ backgroundColor: safeHex(newColorHex) }}>
                                <input type="color" value={safeHex(newColorHex)} onChange={e => setNewColorHex(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                              </label>
                              <div className="flex-1 space-y-1.5">
                                <input value={newColorHex} onChange={e => { let v = e.target.value; if (!v.startsWith("#")) v = "#" + v; if (v.length <= 7) setNewColorHex(v); }} className="w-full border border-tv-border-light rounded-[8px] px-2.5 py-1.5 text-[12px] font-mono outline-none focus:ring-2 focus:ring-tv-brand-bg/30" placeholder="#1a1a2e" />
                                <input value={newColorName} onChange={e => setNewColorName(e.target.value)} placeholder="Name (e.g. Deep Navy)" className="w-full border border-tv-border-light rounded-[8px] px-2.5 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand-bg/30" />
                              </div>
                            </div>
                            <button type="button" onClick={() => {
                              const cName = newColorName.trim() || safeHex(newColorHex);
                              const newBg: Background = { id: Date.now(), kind: "color", name: cName, color: safeHex(newColorHex) };
                              setBackgrounds(prev => [...prev, newBg]); setSelectedBgId(newBg.id); setNewColorName(""); show(`"${cName}" added`, "success");
                            }} className="w-full py-2 bg-tv-brand-bg text-white text-[11px] rounded-full hover:bg-tv-brand-hover transition-colors flex items-center justify-center gap-1 font-semibold">
                              <Plus size={11} />Add Color
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setSelectedBgId(null)} className={`group relative rounded-[10px] overflow-hidden border-2 transition-all ${selectedBgId === null ? "border-tv-brand ring-2 ring-tv-brand/20" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                              <div className="aspect-[4/3] bg-tv-surface flex items-center justify-center"><X size={16} className="text-tv-text-decorative" /></div>
                              <div className="px-2 py-1.5 bg-white"><p className={`text-[10px] truncate ${selectedBgId === null ? "text-tv-brand" : "text-tv-text-secondary"}`} style={{ fontWeight: 500 }}>No Background</p></div>
                              {selectedBgId === null && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-tv-brand flex items-center justify-center"><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                            </button>
                            {backgrounds.filter(bg => bg.kind === "color").map(bg => (
                              <div key={bg.id} className={`group relative rounded-[10px] overflow-hidden border-2 transition-all cursor-pointer ${selectedBgId === bg.id ? "border-tv-brand ring-2 ring-tv-brand/20" : "border-tv-border-light hover:border-tv-border-strong"}`} onClick={() => setSelectedBgId(bg.id)}>
                                <div className="aspect-[4/3]" style={{ backgroundColor: bg.color }} />
                                <div className="px-2 py-1.5 bg-white flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0"><div className="w-3 h-3 rounded-full shrink-0 border border-tv-border-light" style={{ backgroundColor: bg.color }} /><p className={`text-[10px] truncate ${selectedBgId === bg.id ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 500 }}>{bg.name}</p></div>
                                  <button className="p-0.5 text-tv-text-decorative hover:text-tv-danger opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); deleteBg(bg.id); }} title="Delete"><Trash2 size={9} /></button>
                                </div>
                                {selectedBgId === bg.id && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-tv-brand flex items-center justify-center"><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ─── GRADIENT TAB ──────────────────────────────── */}
                      {bgTab === "gradient" && (
                        <div className="space-y-3">
                          <div className="p-3 bg-tv-surface rounded-[10px] border border-tv-border-light space-y-3">
                            <p className="text-[10px] text-tv-text-label uppercase tracking-wider font-semibold">Create Gradient</p>
                            <div className="h-14 rounded-[10px] border border-tv-border-light overflow-hidden" style={{ background: `linear-gradient(${newGradDir}, ${safeHex(newGradFrom)}, ${safeHex(newGradTo)})` }} />
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] text-tv-text-secondary mb-1 block">From</label>
                                <div className="flex items-center gap-1.5">
                                  <label className="w-8 h-8 rounded-[6px] border border-tv-border-light cursor-pointer shrink-0 relative overflow-hidden" style={{ backgroundColor: safeHex(newGradFrom) }}><input type="color" value={safeHex(newGradFrom)} onChange={e => setNewGradFrom(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" /></label>
                                  <input value={newGradFrom} onChange={e => { let v = e.target.value; if (!v.startsWith("#")) v = "#" + v; if (v.length <= 7) setNewGradFrom(v); }} className="flex-1 min-w-0 border border-tv-border-light rounded-[6px] px-2 py-1 text-[10px] font-mono outline-none focus:ring-1 focus:ring-tv-brand-bg/30" />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] text-tv-text-secondary mb-1 block">To</label>
                                <div className="flex items-center gap-1.5">
                                  <label className="w-8 h-8 rounded-[6px] border border-tv-border-light cursor-pointer shrink-0 relative overflow-hidden" style={{ backgroundColor: safeHex(newGradTo) }}><input type="color" value={safeHex(newGradTo)} onChange={e => setNewGradTo(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" /></label>
                                  <input value={newGradTo} onChange={e => { let v = e.target.value; if (!v.startsWith("#")) v = "#" + v; if (v.length <= 7) setNewGradTo(v); }} className="flex-1 min-w-0 border border-tv-border-light rounded-[6px] px-2 py-1 text-[10px] font-mono outline-none focus:ring-1 focus:ring-tv-brand-bg/30" />
                                </div>
                              </div>
                            </div>
                            <div>
                              <label className="text-[9px] text-tv-text-secondary mb-1 block">Direction</label>
                              <div className="flex items-center gap-1.5">
                                {GRADIENT_DIRECTIONS.map(d => (
                                  <button key={d.dir} type="button" onClick={() => setNewGradDir(d.dir)} className={`w-8 h-8 rounded-[8px] flex items-center justify-center border transition-all ${newGradDir === d.dir ? "border-tv-brand bg-tv-brand-tint text-tv-brand" : "border-tv-border-light text-tv-text-decorative hover:border-tv-border-strong"}`} title={d.dir}><d.icon size={13} /></button>
                                ))}
                              </div>
                            </div>
                            <input value={newGradName} onChange={e => setNewGradName(e.target.value)} placeholder="Name (e.g. Sunset Glow)" className="w-full border border-tv-border-light rounded-[8px] px-2.5 py-1.5 text-[12px] outline-none focus:ring-2 focus:ring-tv-brand-bg/30" />
                            <button type="button" onClick={() => {
                              const gName = newGradName.trim() || `${safeHex(newGradFrom)} → ${safeHex(newGradTo)}`;
                              const newBg: Background = { id: Date.now(), kind: "gradient", name: gName, gradientFrom: safeHex(newGradFrom), gradientTo: safeHex(newGradTo), gradientDir: newGradDir };
                              setBackgrounds(prev => [...prev, newBg]); setSelectedBgId(newBg.id); setNewGradName(""); show(`"${gName}" added`, "success");
                            }} className="w-full py-2 bg-tv-brand-bg text-white text-[11px] rounded-full hover:bg-tv-brand-hover transition-colors flex items-center justify-center gap-1 font-semibold">
                              <Plus size={11} />Add Gradient
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setSelectedBgId(null)} className={`group relative rounded-[10px] overflow-hidden border-2 transition-all ${selectedBgId === null ? "border-tv-brand ring-2 ring-tv-brand/20" : "border-tv-border-light hover:border-tv-border-strong"}`}>
                              <div className="aspect-[4/3] bg-tv-surface flex items-center justify-center"><X size={16} className="text-tv-text-decorative" /></div>
                              <div className="px-2 py-1.5 bg-white"><p className={`text-[10px] truncate ${selectedBgId === null ? "text-tv-brand" : "text-tv-text-secondary"}`} style={{ fontWeight: 500 }}>No Background</p></div>
                              {selectedBgId === null && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-tv-brand flex items-center justify-center"><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                            </button>
                            {backgrounds.filter(bg => bg.kind === "gradient").map(bg => (
                              <div key={bg.id} className={`group relative rounded-[10px] overflow-hidden border-2 transition-all cursor-pointer ${selectedBgId === bg.id ? "border-tv-brand ring-2 ring-tv-brand/20" : "border-tv-border-light hover:border-tv-border-strong"}`} onClick={() => setSelectedBgId(bg.id)}>
                                <div className="aspect-[4/3]" style={{ background: bgCss(bg) }} />
                                <div className="px-2 py-1.5 bg-white flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 flex-1 min-w-0"><div className="w-3 h-3 rounded-full shrink-0 border border-tv-border-light" style={{ background: bgCss(bg) }} /><p className={`text-[10px] truncate ${selectedBgId === bg.id ? "text-tv-brand" : "text-tv-text-primary"}`} style={{ fontWeight: 500 }}>{bg.name}</p></div>
                                  <button className="p-0.5 text-tv-text-decorative hover:text-tv-danger opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => { e.stopPropagation(); deleteBg(bg.id); }} title="Delete"><Trash2 size={9} /></button>
                                </div>
                                {selectedBgId === bg.id && (<div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-tv-brand flex items-center justify-center"><Check size={10} className="text-white" strokeWidth={3} /></div>)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionSection>

                  {/* Section 4: Button Colors */}
                  <AccordionSection title="Button Colors" open={!!openSections.buttons} onToggle={() => toggleSection("buttons")}
                    helper="Use bold colors to grab your recipients' attention." hasInfo>
                    <div className="space-y-3">
                      <ColorField label="Call to Action Text" value={ctaTextColor} onChange={setCtaTextColor} />
                      <ColorField label="Call to Action Button" value={ctaBtnColor} onChange={setCtaBtnColor} required />
                      <ColorField label="Secondary Button Text" value={secondaryBtnTextColor} onChange={setSecondaryBtnTextColor} />
                      <ColorField label="Reply Button" value={replyBtnColor} onChange={setReplyBtnColor} />
                      <ColorField label="Save Button" value={saveBtnColor} onChange={setSaveBtnColor} />
                      <ColorField label="Share Button" value={shareBtnColor} onChange={setShareBtnColor} />
                    </div>
                  </AccordionSection>

                </div>
              </div>
            </div>

            {/* ── Right: Preview ───────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col bg-tv-surface/20 overflow-hidden">
              {/* Top bar */}
              <div className="px-5 py-3 border-b border-tv-border-divider bg-white flex items-center justify-between shrink-0">
                <p className="text-[14px] text-tv-text-primary italic font-semibold" style={{ fontFamily: "var(--tv-font-display, 'Fraunces', Roboto, sans-serif)" }}>
                  {name || "Untitled Landing Page"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-tv-text-secondary" style={{ fontWeight: 500 }}>Preview as:</span>
                  <DeviceToggle device={device} onChange={setDevice} />
                </div>
              </div>

              {/* Preview area */}
              <div className="flex-1 overflow-y-auto p-6 flex justify-center">
                <LandingPagePreview
                  device={device}
                  name={name}
                  navBarColor={navBarColor}
                  logo={logo}
                  logoFile={logoFile}
                  selectedBg={selectedBg}
                  fadeGradient={fadeGradient}
                  ctaTextColor={ctaTextColor}
                  ctaBtnColor={ctaBtnColor}
                  secondaryBtnTextColor={secondaryBtnTextColor}
                  replyBtnColor={replyBtnColor}
                  saveBtnColor={saveBtnColor}
                  shareBtnColor={shareBtnColor}
                />
              </div>
            </div>
          </>
        ) : (
          /* ── FINISH STEP ───────────────────────────────────────────────── */
          <div className="flex-1 flex min-h-0">
            {/* Left: success */}
            <div className="w-[42%] shrink-0 border-r border-tv-border-divider flex items-center justify-center p-10">
              <div>
                <h2 className="font-display text-tv-text-primary mb-3 font-bold" style={{ fontSize: "40px" }}>
                  Huzzah!
                </h2>
                <p className="text-[15px] text-tv-text-primary mb-4" style={{ fontWeight: 500 }}>
                  Your landing page is now in your portal.
                </p>
                <p className="text-[12px] text-tv-text-secondary leading-relaxed">
                  Your landing page has been saved and is ready to use in a campaign. You can edit or manage your landing pages anytime from <strong style={{ color: "var(--tv-text-primary)" }}>Assets & Templates</strong>.
                </p>
              </div>
            </div>

            {/* Right: 3-device summary */}
            <div className="flex-1 min-w-0 flex flex-col items-center justify-center p-8 bg-tv-surface/30 overflow-y-auto">
              <div className="w-full max-w-[680px]">
                <h3 className="text-tv-text-primary mb-1 font-bold" style={{ fontSize: "17px" }}>{name || "Untitled Landing Page"}</h3>
                <div className="h-px bg-tv-border-divider mb-5" />
                <div className="grid grid-cols-3 gap-4 items-start">
                  {(["desktop", "tablet", "mobile"] as const).map(d => (
                    <div key={d}>
                      <div className="rounded-[10px] overflow-hidden border border-tv-border-light shadow-sm bg-white max-h-[340px]">
                        <LandingPagePreview
                          device="mobile"
                          name={name}
                          navBarColor={navBarColor}
                          logo={logo}
                          logoFile={logoFile}
                          selectedBg={selectedBg}
                          fadeGradient={fadeGradient}
                          ctaTextColor={ctaTextColor}
                          ctaBtnColor={ctaBtnColor}
                          secondaryBtnTextColor={secondaryBtnTextColor}
                          replyBtnColor={replyBtnColor}
                          saveBtnColor={saveBtnColor}
                          shareBtnColor={shareBtnColor}
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-[10px] text-tv-text-secondary" style={{ fontWeight: 500 }}>
                          {d === "desktop" ? "Desktop" : d === "tablet" ? "Tablet" : "Mobile"}
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
          <button className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-tv-text-secondary rounded-lg hover:bg-tv-surface transition-colors" style={{ fontWeight: 500 }}>
            <Undo2 size={13} /> Undo
          </button>
          <button className="flex items-center gap-1 px-3 py-1.5 text-[12px] text-tv-text-secondary rounded-lg hover:bg-tv-surface transition-colors" style={{ fontWeight: 500 }}>
            <Redo2 size={13} /> Redo
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {step === "build" ? (
            <>
              <button onClick={() => handleSave(false)} disabled={saving}
                className="flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full border border-tv-border text-tv-brand hover:bg-tv-brand-tint transition-all font-semibold">
                {saving ? "Saving..." : "Save to Library"}
              </button>
              <button onClick={() => handleSave(true)} disabled={saving}
                className={`flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full transition-all ${
                  saving
                    ? "bg-tv-surface-active text-tv-text-secondary cursor-not-allowed"
                    : "bg-tv-brand-bg hover:bg-tv-brand-hover text-white"
                } font-semibold`}>
                <span>{saving ? "Processing..." : "Save & Use in Campaign"}</span>
                <ChevronRight size={14} />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep("build")}
                className="flex items-center gap-1.5 text-[13px] text-tv-text-secondary hover:text-tv-text-primary transition-colors" style={{ fontWeight: 500 }}>
                <ChevronLeft size={14} />
                <span>Back</span>
              </button>
              <button onClick={() => setShowLivePreview(true)}
                className="flex items-center gap-1.5 px-4 py-2 text-[12px] rounded-full border border-tv-border-light text-tv-text-secondary hover:border-tv-brand hover:text-tv-brand transition-all" style={{ fontWeight: 500 }}>
                <Eye size={13} /> Live Preview
              </button>
              <button onClick={() => navigate(returnTo)}
                className="flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full bg-tv-brand-bg hover:bg-tv-brand-hover text-white transition-all font-semibold">
                <span>Use This Landing Page</span>
                <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Fullscreen live preview modal */}
      <LandingPageLivePreviewModal
        open={showLivePreview}
        onClose={() => setShowLivePreview(false)}
        name={name}
        navBarColor={navBarColor}
        logo={logo}
        logoFile={logoFile}
        selectedBg={selectedBg}
        fadeGradient={fadeGradient}
        ctaTextColor={ctaTextColor}
        ctaBtnColor={ctaBtnColor}
        secondaryBtnTextColor={secondaryBtnTextColor}
        replyBtnColor={replyBtnColor}
        saveBtnColor={saveBtnColor}
        shareBtnColor={shareBtnColor}
      />
    </div>
  );
}

export default LandingPageBuilder;

// ═════════════════════════════════════════════════════════════════════════════
//  Accordion Section
// ═════════════════════════════════════════════════════════════════════════════
function AccordionSection({ title, open, onToggle, helper, hasInfo, children }: {
  title: string; open: boolean; onToggle: () => void;
  helper?: string; hasInfo?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="border-b border-tv-border-divider">
      <button onClick={onToggle} type="button"
        className="w-full flex items-center justify-between py-3.5 text-left group">
        <span className="text-[13px] text-tv-text-primary font-bold">{title}</span>
        <ChevronDown size={15} className={`text-tv-text-secondary transition-transform ${open ? "rotate-0" : "-rotate-90"}`} />
      </button>
      {open && (
        <div className="pb-4">
          {helper && (
            <p className="text-[11px] text-tv-text-secondary leading-relaxed mb-3 flex items-start gap-1.5">
              <span>{helper}</span>
              {hasInfo && (
                <span className="shrink-0 mt-0.5" title={helper}>
                  <Info size={11} className="text-tv-text-decorative" />
                </span>
              )}
            </p>
          )}
          {children}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  Color Field
// ═════════════════════════════════════════════════════════════════════════════
function ColorField({ label, value, onChange, required }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] text-tv-text-label uppercase tracking-wider mb-1.5 block font-semibold">
        {label} {required && <span className="text-tv-danger">*</span>}
      </label>
      <div className="flex items-center gap-2">
        <input value={value} onChange={e => {
          let v = e.target.value;
          if (!v.startsWith("#")) v = "#" + v;
          if (v.length <= 7) onChange(v);
        }}
          className={`${inputCls} flex-1 font-mono`}
          placeholder="#000000" />
        <label className="w-10 h-10 rounded-[8px] border border-tv-border-light cursor-pointer shrink-0 relative overflow-hidden shadow-sm"
          style={{ backgroundColor: safeHex(value) }}>
          <input type="color" value={safeHex(value)} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  Device Toggle Bar
// ═════════════════════════════════════════════════════════════════════════════
function DeviceToggle({ device, onChange }: { device: DeviceView; onChange: (d: DeviceView) => void }) {
  const items: { key: DeviceView; icon: typeof Monitor; label: string }[] = [
    { key: "desktop", icon: Monitor,    label: "Desktop" },
    { key: "tablet",  icon: Tablet,     label: "Tablet" },
    { key: "mobile",  icon: Smartphone, label: "Mobile" },
  ];
  return (
    <div className="flex items-center gap-1 bg-tv-surface rounded-[10px] p-1 border border-tv-border-light">
      {items.map(item => {
        const active = device === item.key;
        return (
          <button key={item.key} onClick={() => onChange(item.key)}
            title={item.label}
            className={`w-8 h-8 rounded-[8px] flex items-center justify-center transition-all ${
              active
                ? "bg-white shadow-sm border border-tv-border-light text-tv-brand"
                : "text-tv-text-decorative hover:text-tv-text-secondary"
            }`}>
            <item.icon size={14} />
          </button>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
//  Landing Page Preview
// ═════════════════════════════════════════════════════════════════════════════
function LandingPagePreview({
  device, name, navBarColor, logo, logoFile, selectedBg, fadeGradient,
  ctaTextColor, ctaBtnColor, secondaryBtnTextColor,
  replyBtnColor, saveBtnColor, shareBtnColor,
}: {
  device: DeviceView;
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
}) {
  const width = device === "desktop" ? 560 : device === "tablet" ? 380 : 280;
  const isMobile = device === "mobile";
  const navTextColor = isDarkColor(navBarColor) ? "#ffffffee" : "#1a1a1a";

  return (
    <div style={{ width }} className="transition-all duration-300">
      {/* Browser chrome */}
      <div className="bg-[#2d2d2d] rounded-t-[12px] px-3.5 py-2.5 flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <div className="flex-1 bg-[#1a1a1a] rounded-[6px] px-3 py-1 flex items-center gap-1.5 min-w-0">
          <Globe size={9} className="text-white/30 shrink-0" />
          <span className="text-[9px] text-white/50 font-mono truncate">
            hartwell.thankview.com/{name ? name.toLowerCase().replace(/\s+/g, "-") : "untitled-page"}
          </span>
        </div>
      </div>

      {/* Page body */}
      <div className="rounded-b-[12px] overflow-hidden shadow-xl border border-tv-border-light border-t-0 bg-white">

        {/* Nav bar */}
        <div className="relative px-4 py-3 flex items-center" style={{ backgroundColor: navBarColor }}>
          {logo !== "none" || logoFile ? (
            <div className="flex items-center gap-2">
              {logoFile ? (
                <img src={logoFile} alt="" className="h-5 object-contain" style={{ filter: isDarkColor(navBarColor) ? "brightness(10)" : "none" }} />
              ) : (
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: isDarkColor(navBarColor) ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.1)" }}>
                  {logo === "shield" && <Landmark size={11} style={{ color: navTextColor }} />}
                  {logo === "star" && <Star size={11} style={{ color: navTextColor }} />}
                  {logo === "mail" && <Mail size={11} style={{ color: navTextColor }} />}
                </div>
              )}
              <span className="text-[10px] font-semibold" style={{ color: navTextColor }}>Hartwell University</span>
            </div>
          ) : (
            <span className="text-[10px] font-semibold" style={{ color: navTextColor }}>Hartwell University</span>
          )}
          <span className="ml-auto text-[8px]" style={{ color: navTextColor, opacity: 0.4 }}>thankview.com</span>
        </div>

        {/* Background area — image, color, or gradient */}
        {selectedBg ? (
          selectedBg.kind === "image" ? (
            <div className="relative">
              <div style={{ aspectRatio: isMobile ? "1.4/1" : "2.2/1" }} className="overflow-hidden">
                {selectedBg.url?.startsWith("blob:") ? (
                  <img src={selectedBg.url} alt={selectedBg.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageWithFallback src={selectedBg.url!} alt={selectedBg.name} className="w-full h-full object-cover" />
                )}
              </div>
              {fadeGradient && (
                <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-white to-transparent" />
              )}
            </div>
          ) : (
            <div className="relative">
              <div style={{ aspectRatio: isMobile ? "1.4/1" : "2.2/1", background: selectedBg.kind === "color" ? selectedBg.color : bgCss(selectedBg) }} />
              {fadeGradient && (
                <div className="absolute bottom-0 left-0 right-0 h-[45%] bg-gradient-to-t from-white to-transparent" />
              )}
            </div>
          )
        ) : (
          <div style={{ aspectRatio: isMobile ? "1.4/1" : "2.2/1" }} className="bg-gradient-to-b from-tv-surface to-white flex items-center justify-center">
            <div className="text-center">
              <ImageIcon size={20} className="text-tv-text-decorative mx-auto mb-1" />
              <p className="text-[10px] text-tv-text-decorative">No background selected</p>
            </div>
          </div>
        )}

        {/* Video player placeholder */}
        <div className={`${isMobile ? "px-3 -mt-2" : "px-5 -mt-4"} relative z-10 pb-3`}>
          <div className="rounded-[10px] overflow-hidden shadow-lg">
            <div style={{ aspectRatio: isMobile ? "1/1" : "16/9" }} className="bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center relative">
              <div className={`${isMobile ? "w-10 h-10" : "w-14 h-14"} rounded-full bg-white/15 flex items-center justify-center backdrop-blur-sm border border-white/20`}>
                <Play size={isMobile ? 14 : 20} className="text-white ml-0.5" fill="white" />
              </div>
              <span className="absolute bottom-2 right-2 text-[8px] font-mono px-1.5 py-0.5 rounded bg-black/50 text-white">1:08</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <div className="px-5 py-3 flex justify-center">
          <span className={`inline-block ${isMobile ? "px-5 py-2" : "px-7 py-2.5"} rounded-full text-[12px] cursor-default font-semibold`}
            style={{ backgroundColor: ctaBtnColor, color: ctaTextColor }}>
            Give to the Annual Fund
          </span>
        </div>

        {/* Message body text */}
        <div className={`${isMobile ? "px-3" : "px-5"} py-3`}>
          <p className={`${isMobile ? "text-[10px]" : "text-[11px]"} text-tv-text-secondary leading-relaxed`}>
            Thanks to the generosity of alumni like you, we've been able to fund 42 new scholarships this year, providing life-changing opportunities for students across campus. Your support truly makes a difference.
          </p>
        </div>

        {/* Divider */}
        <div className="mx-5 border-t border-tv-border-divider" />

        {/* Action buttons row */}
        <div className={`px-5 py-3 flex ${isMobile ? "flex-col gap-2" : "flex-row items-center justify-center gap-2"}`}>
          <span className={`inline-flex items-center justify-center gap-1 ${isMobile ? "w-full" : ""} px-4 py-2 rounded-full border text-[10px] cursor-default`}
            style={{ color: replyBtnColor, borderColor: replyBtnColor + "60", fontWeight: 500 }}>
            Reply
          </span>
          <span className={`inline-flex items-center justify-center gap-1 ${isMobile ? "w-full" : ""} px-4 py-2 rounded-full text-[10px] text-white cursor-default`}
            style={{ backgroundColor: saveBtnColor, fontWeight: 500 }}>
            Save
          </span>
          <span className={`inline-flex items-center justify-center gap-1 ${isMobile ? "w-full" : ""} px-4 py-2 rounded-full text-[10px] text-white cursor-default`}
            style={{ backgroundColor: shareBtnColor, fontWeight: 500 }}>
            Share
          </span>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-tv-surface border-t border-tv-border-divider text-center">
          <p className="text-[7px] text-tv-text-decorative">Powered by ThankView by EverTrue</p>
        </div>
      </div>

      {/* Label */}
      <div className="text-center mt-4">
        <p className="text-[12px] text-tv-text-primary font-semibold">{name || "Untitled Landing Page"}</p>
        <p className="text-[10px] text-tv-text-secondary mt-0.5">
          {device === "desktop" ? "Desktop" : device === "tablet" ? "Tablet" : "Mobile"} Preview &middot; {selectedBg ? selectedBg.name : "No background"}
        </p>
      </div>
    </div>
  );
}