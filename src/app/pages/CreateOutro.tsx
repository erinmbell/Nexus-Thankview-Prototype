import { useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Play, Pause, ChevronLeft, Trash2,
  Save, Send, ChevronRight, MonitorPlay, Upload, Image as ImageIcon, X,
} from "lucide-react";
import { Text } from "@mantine/core";
import { TV } from "../theme";
import { useToast } from "../contexts/ToastContext";

// ═══════════════════════════════════════════════════════════════════════════
export function CreateOutro() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Builder state ──
  const [bgColor, setBgColor] = useState<"black" | "white">("black");
  const [outroImage, setOutroImage] = useState<{ url: string; name: string } | null>(null);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // ── Edit mode ──
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const isLight = bgColor === "white";
  const previewBg = isLight ? "#ffffff" : "#111111";
  const textColor = isLight ? TV.textPrimary : "white";

  const handleDiscard = () => navigate("/assets/intros-outros");
  const handleSaveToLibrary = () => {
    show(`Outro ${isEditMode ? "updated in" : "saved to"} your library`, "success");
    setTimeout(() => navigate("/assets/intros-outros"), 1200);
  };
  const handleSaveAndUse = () => {
    show("Outro saved — opening campaign builder…", "success");
    setTimeout(() => navigate("/campaigns/create"), 1200);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ backgroundColor: TV.surfaceMuted }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white px-6 py-4 border-b border-tv-border-divider">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/assets/intros-outros")}
            className="flex items-center gap-1 text-tv-text-secondary hover:text-tv-brand transition-colors">
            <ChevronLeft size={14} />
            <span className="text-[12px]" style={{ fontWeight: 500 }}>Intros & Outros</span>
          </button>
        </div>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: TV.brandTint }}>
            <MonitorPlay size={16} style={{ color: TV.brand }} />
          </div>
          <div>
            <Text fz={16} fw={800} c={TV.textPrimary}>{isEditMode ? "Edit Outro" : "New Outro"}</Text>
            <Text fz={12} c={TV.textSecondary}>Upload an image on a black or white background.</Text>
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-3xl xl:max-w-4xl 2xl:max-w-5xl mx-auto space-y-6">

          {/* Preview */}
          <div className="rounded-lg overflow-hidden relative aspect-video" style={{ backgroundColor: previewBg, border: isLight ? `1px solid ${TV.borderLight}` : "none" }}>
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              {outroImage ? (
                <img src={outroImage.url} alt={outroImage.name}
                  className="absolute inset-0 w-full h-full object-contain p-8 pointer-events-none" />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-40">
                  <ImageIcon size={36} style={{ color: textColor }} />
                  <Text fz={13} c={textColor} style={{ fontWeight: 500 }}>Upload an image to preview</Text>
                </div>
              )}

              {/* Play / Pause */}
              {outroImage && (
                <button onClick={() => setIsPlaying(p => !p)}
                  className="w-12 h-12 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center hover:bg-white/30 transition-colors z-10">
                  {isPlaying
                    ? <Pause size={20} className="text-white" fill="white" />
                    : <Play size={20} className="text-white ml-0.5" fill="white" />
                  }
                </button>
              )}
            </div>
          </div>

          {/* Configuration */}
          <div className="bg-white rounded-lg p-6 space-y-6" style={{ border: `1px solid ${TV.borderLight}` }}>

            {/* Background Color — just Black or White */}
            <div>
              <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5" mb={8}>Background Color</Text>
              <div className="flex items-center gap-3">
                <button onClick={() => setBgColor("black")}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-lg border-2 transition-all ${
                    bgColor === "black" ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"
                  }`}>
                  <div className="w-7 h-7 rounded-full bg-[#111111] border border-tv-border-light" />
                  <Text fz={13} fw={bgColor === "black" ? 600 : 400} c={bgColor === "black" ? TV.textBrand : TV.textPrimary}>Black</Text>
                </button>
                <button onClick={() => setBgColor("white")}
                  className={`flex items-center gap-2.5 px-5 py-3 rounded-lg border-2 transition-all ${
                    bgColor === "white" ? "border-tv-brand-bg bg-tv-brand-tint" : "border-tv-border-light hover:border-tv-border-strong"
                  }`}>
                  <div className="w-7 h-7 rounded-full bg-white border-2 border-tv-border-light" />
                  <Text fz={13} fw={bgColor === "white" ? 600 : 400} c={bgColor === "white" ? TV.textBrand : TV.textPrimary}>White</Text>
                </button>
              </div>
            </div>

            {/* Image Upload */}
            <div>
              <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5" mb={8}>Outro Image</Text>
              {outroImage ? (
                <div className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderColor: TV.borderLight }}>
                  <img src={outroImage.url} alt={outroImage.name} className="w-16 h-10 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <Text fz={12} fw={600} c={TV.textPrimary} className="truncate">{outroImage.name}</Text>
                    <Text fz={10} c={TV.textSecondary}>Click to replace</Text>
                  </div>
                  <button onClick={() => setOutroImage(null)} className="p-1 rounded hover:bg-tv-surface-muted transition-colors" title="Remove image">
                    <X size={14} style={{ color: TV.textSecondary }} />
                  </button>
                </div>
              ) : (
                <button onClick={() => imageInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-lg border-2 border-dashed transition-colors hover:border-tv-brand hover:bg-tv-brand-tint/30"
                  style={{ borderColor: TV.borderLight }}>
                  <Upload size={16} style={{ color: TV.textSecondary }} />
                  <Text fz={13} fw={500} c={TV.textSecondary}>Upload logo or image</Text>
                </button>
              )}
              <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) setOutroImage({ url: URL.createObjectURL(file), name: file.name });
                  e.target.value = "";
                }} />
              <Text fz={10} c={TV.textDecorative} className="mt-1.5">PNG, JPG, or SVG. Displayed centered over the background.</Text>
            </div>

            {/* Save as reusable template */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={saveAsTemplate} onChange={e => setSaveAsTemplate(e.target.checked)}
                className="w-4 h-4" style={{ accentColor: TV.brand }} />
              <Text fz={12} c={TV.textPrimary}>Save as reusable template</Text>
            </label>
          </div>
        </div>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white px-3 sm:px-6 py-3 flex items-center justify-between border-t border-tv-border-divider">
        <button onClick={handleDiscard}
          className="flex items-center gap-1.5 text-[12px] text-tv-text-secondary hover:text-tv-brand transition-colors" style={{ fontWeight: 500 }}>
          <Trash2 size={13} />Discard
        </button>
        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={handleSaveToLibrary}
            className="flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full border border-tv-border text-tv-brand hover:bg-tv-brand-tint transition-all" style={{ fontWeight: 600 }}>
            <Save size={12} />Save to Library
          </button>
          <button onClick={handleSaveAndUse}
            className="flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full bg-tv-brand-bg hover:bg-tv-brand-hover text-white transition-all" style={{ fontWeight: 600 }}>
            <Send size={12} />Save & Use in Campaign <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
