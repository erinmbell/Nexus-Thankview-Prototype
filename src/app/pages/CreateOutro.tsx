import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Play, Pause, ChevronDown, ChevronLeft, Trash2,
  Save, Send, ChevronRight, MonitorPlay,
} from "lucide-react";
import { Text } from "@mantine/core";
import { TV } from "../theme";
import { useToast } from "../contexts/ToastContext";

// Google Fonts for preview
const GOOGLE_FONTS_URL = "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;800&display=swap";

// ── Outro Theme Data ────────────────────────────────────────────────────────
interface OutroTheme {
  id: number;
  name: string;
  category: "saved" | "legacy";
  gradient: string;
}

const OUTRO_THEMES: OutroTheme[] = [
  { id: 1, name: "Thanks!", category: "saved", gradient: "linear-gradient(143.13deg, #7c45b0 0%, #7c45b0 100%)" },
  { id: 2, name: "Donate", category: "saved", gradient: "linear-gradient(143.13deg, #166534 0%, #15803d 100%)" },
  { id: 3, name: "Visit", category: "saved", gradient: "linear-gradient(143.13deg, #007c9e 0%, #00c0f5 100%)" },
  { id: 4, name: "Connect", category: "saved", gradient: "linear-gradient(143.13deg, #b45309 0%, #b45309 100%)" },
  { id: 10, name: "Classic", category: "legacy", gradient: "linear-gradient(143.13deg, #7c45b0 0%, #7c45b0 100%)" },
  { id: 11, name: "Simple End", category: "legacy", gradient: "linear-gradient(143.13deg, #374151 0%, #6b7280 100%)" },
  { id: 12, name: "Branded", category: "legacy", gradient: "linear-gradient(143.13deg, #1B3461 0%, #3b82f6 100%)" },
];

const BG_COLORS = [
  "#7c45b0", "#1e3a8a", "#14532d", "#b91c1c", "#0f766e", "#374151", "#b45309", "#ffffff",
];


// Mock edit data for pre-population
const EDIT_DATA: Record<string, { bgColor: string; themeId: number; saveAsTemplate: boolean }> = {
  "1": { bgColor: "#7c45b0", themeId: 1, saveAsTemplate: false },
  "2": { bgColor: "#166534", themeId: 2, saveAsTemplate: false },
  "3": { bgColor: "#007c9e", themeId: 3, saveAsTemplate: false },
  "4": { bgColor: "#b45309", themeId: 4, saveAsTemplate: false },
};

// ── Sidebar Theme Section ───────────────────────────────────────────────────
function ThemeSection({
  title,
  count,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  count?: number;
  expanded: boolean;
  onToggle: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
      <button
        onClick={onToggle}
        className="w-full h-[33px] px-3 flex items-center gap-2 hover:bg-tv-surface-muted transition-colors"
      >
        <ChevronDown
          size={10}
          style={{
            color: TV.textSecondary,
            transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
            transition: "transform 0.2s",
          }}
        />
        <Text fz={11} fw={600} c={TV.textPrimary} className="flex-1 text-left leading-none">
          {title}
        </Text>
        {count !== undefined && (
          <Text fz={9} c={TV.textDecorative} className="leading-none">
            ({count})
          </Text>
        )}
      </button>
      {expanded && children && <div className="px-3 py-3">{children}</div>}
    </div>
  );
}

// ── Theme Tile ──────────────────────────────────────────────────────────────
function ThemeTile({
  theme,
  selected,
  onSelect,
}: {
  theme: OutroTheme;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full h-[56px] rounded-md overflow-hidden relative group"
      style={{
        background: theme.gradient,
        boxShadow: selected
          ? `0px 0px 0px 1px white, 0px 0px 0px 3px ${TV.brandBg}`
          : "none",
      }}
    >
      {selected && (
        <div
          className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
          style={{ backgroundColor: TV.brandBg }}
        >
          <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
            <path
              d="M1.5 3.5L3 5L5.5 2"
              stroke="white"
              strokeWidth="0.583333"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <Text fz={8} fw={600} c="rgba(255,255,255,0.7)">
          {theme.name}
        </Text>
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export function CreateOutro() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Sidebar state ──
  const [savedExpanded, setSavedExpanded] = useState(true);
  const [legacyExpanded, setLegacyExpanded] = useState(false);

  // ── Builder state ──
  const [selectedTheme, setSelectedTheme] = useState<OutroTheme>(OUTRO_THEMES[2]); // Visit (teal)
  const [selectedColor, setSelectedColor] = useState<string>(BG_COLORS[0]);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // ── Edit mode ──
  const editId = searchParams.get("edit");
  const [isEditMode, setIsEditMode] = useState(!!editId);

  useEffect(() => {
    if (!editId) return;
    setIsEditMode(true);
    const data = EDIT_DATA[editId];
    if (!data) return;
    setSelectedColor(data.bgColor);
    setSaveAsTemplate(data.saveAsTemplate);
    const theme = OUTRO_THEMES.find((t) => t.id === data.themeId);
    if (theme) setSelectedTheme(theme);
    setSearchParams({}, { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build the preview background from the selected color
  const previewBackground = (() => {
    // If the selected color matches a theme gradient, use it. Otherwise build one.
    const c = selectedColor;
    if (c === "#ffffff") return `linear-gradient(143.13deg, #f8f8f8 0%, #ffffff 100%)`;
    return `linear-gradient(143.13deg, ${c} 0%, ${c}cc 50%, ${c}88 100%)`;
  })();

  const isLightBg = selectedColor === "#ffffff";
  const textOnBg = isLightBg ? TV.textPrimary : "white";

  const savedThemes = OUTRO_THEMES.filter((t) => t.category === "saved");
  const legacyThemes = OUTRO_THEMES.filter((t) => t.category === "legacy");

  const handleSelectTheme = (theme: OutroTheme) => {
    setSelectedTheme(theme);
  };

  const handleDiscard = () => {
    navigate("/assets/outros");
  };

  const handleSaveToLibrary = () => {
    const verb = isEditMode ? "updated in" : "saved to";
    show(`Outro ${verb} your outro library`, "success");
    setTimeout(() => navigate("/assets/outros"), 1200);
  };

  const handleSaveAndUse = () => {
    show("Outro saved — opening campaign builder…", "success");
    setTimeout(() => navigate("/campaigns/create"), 1200);
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ backgroundColor: TV.surfaceMuted }}>
      {/* Load Google Fonts for the preview */}
      <link rel="stylesheet" href={GOOGLE_FONTS_URL} />

      {/* ── Left Sidebar ────────────────────────────────────────────────── */}
      <div
        className="w-[260px] min-w-[220px] bg-white shrink-0 flex flex-col"
        style={{ borderRight: `1px solid ${TV.borderDivider}` }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-4 pt-3 pb-2.5"
          style={{ borderBottom: `1px solid ${TV.borderDivider}` }}
        >
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate("/assets/outros")}
              className="flex items-center gap-1 hover:text-tv-brand transition-colors"
              style={{ color: TV.textSecondary }}
            >
              <ChevronLeft size={12} />
              <span className="text-[11px]" style={{ fontWeight: 500 }}>Outro Library</span>
            </button>
          </div>

          <div className="flex items-start gap-2.5 mt-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: TV.brandTint }}
            >
              <MonitorPlay size={14} style={{ color: TV.brand }} />
            </div>
            <div className="flex-1 min-w-0">
              <Text fz={13} fw={800} c={TV.textPrimary} className="leading-[1.25]">
                {isEditMode ? "Edit Outro" : "New Outro"}
              </Text>
              <Text fz={11} c={TV.textSecondary} className="leading-[1.3] mt-0.5">
                Choose a theme and customize your outro.
              </Text>
            </div>
          </div>
        </div>

        {/* Scrollable sections */}
        <div className="flex-1 overflow-auto">
          <ThemeSection
            title="Your Outro Templates"
            count={savedThemes.length}
            expanded={savedExpanded}
            onToggle={() => setSavedExpanded(!savedExpanded)}
          >
            <div className="grid grid-cols-3 gap-2">
              {savedThemes.map((theme) => (
                <ThemeTile
                  key={theme.id}
                  theme={theme}
                  selected={selectedTheme.id === theme.id}
                  onSelect={() => handleSelectTheme(theme)}
                />
              ))}
            </div>
          </ThemeSection>


          <ThemeSection
            title="Legacy Outros"
            count={legacyThemes.length}
            expanded={legacyExpanded}
            onToggle={() => setLegacyExpanded(!legacyExpanded)}
          >
            <div className="grid grid-cols-3 gap-2">
              {legacyThemes.map((theme) => (
                <ThemeTile
                  key={theme.id}
                  theme={theme}
                  selected={selectedTheme.id === theme.id}
                  onSelect={() => handleSelectTheme(theme)}
                />
              ))}
            </div>
          </ThemeSection>
        </div>
      </div>

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Preview + Config */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-5xl mx-auto">
            {/* Video Preview */}
            <div
              className="rounded-lg overflow-hidden relative aspect-video mb-4"
              style={{ background: previewBackground }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                {/* Theme name as large centered text */}
                <Text
                  fz={36}
                  fw={800}
                  c={textOnBg}
                  className="text-center px-8"
                  style={{
                    textShadow: isLightBg ? "none" : "0 2px 8px rgba(0,0,0,0.3)",
                    opacity: 0.6,
                    fontFamily: "'Fraunces', Roboto, sans-serif",
                  }}
                >
                  {selectedTheme.name}
                </Text>

                {/* Play / Pause toggle */}
                <button
                  onClick={() => setIsPlaying((p) => !p)}
                  className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/50 flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  {isPlaying ? (
                    <Pause size={24} className="text-white" fill="white" />
                  ) : (
                    <Play size={24} className="text-white ml-1" fill="white" />
                  )}
                </button>
              </div>

              {/* Bottom bar: theme badge */}
              <div className="absolute bottom-4 right-4 pointer-events-none">
                <div className="px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                  <Text fz={10} c="white" className="leading-none">
                    {selectedTheme.name} Theme
                  </Text>
                </div>
              </div>
            </div>

            {/* Configuration Panel */}
            <div className="bg-white rounded-lg p-6 space-y-6" style={{ border: `1px solid ${TV.borderLight}` }}>
              {/* Background Color */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M5 1.66667C3.15905 1.66667 1.66667 3.15905 1.66667 5C1.66667 6.84095 3.15905 8.33333 5 8.33333C6.84095 8.33333 8.33333 6.84095 8.33333 5C8.33333 3.15905 6.84095 1.66667 5 1.66667Z"
                      fill={TV.textLabel}
                      stroke={TV.textLabel}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="0.833333"
                    />
                  </svg>
                  <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5">
                    Background Color
                  </Text>
                </div>
                <div className="flex items-center gap-3">
                  {BG_COLORS.map((color) => {
                    const isSelected = selectedColor === color;
                    const isWhite = color === "#ffffff";
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className="relative"
                      >
                        <div
                          className="w-[28px] h-[28px] rounded-full"
                          style={{
                            backgroundColor: color,
                            boxShadow: isSelected
                              ? `0px 0px 0px 1.5px ${TV.brandBg}`
                              : isWhite
                              ? `0px 0px 0px 1px ${TV.borderLight}`
                              : "0px 0px 0px 1px transparent",
                            border: isWhite && !isSelected ? `1.5px solid ${TV.borderLight}` : "none",
                          }}
                        >
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                                <path
                                  d="M2 5.5L4.5 8L9 3.5"
                                  stroke={isWhite ? TV.brand : "white"}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="0.916667"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Save as reusable template */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveAsTemplate}
                  onChange={(e) => setSaveAsTemplate(e.target.checked)}
                  className="w-4 h-4"
                  style={{ accentColor: TV.brand }}
                />
                <Text fz={12} c={TV.textPrimary}>
                  Save as reusable template
                </Text>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="shrink-0 bg-white px-3 sm:px-6 py-3 flex items-center justify-between border-t border-tv-border-divider"
        >
          <div className="flex items-center gap-3">
            <button
              onClick={handleDiscard}
              className="flex items-center gap-1.5 text-[12px] transition-colors hover:text-tv-brand"
              style={{ fontWeight: 500, color: TV.textSecondary }}
            >
              <Trash2 size={13} />
              Discard
            </button>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSaveToLibrary}
              className="flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full border border-tv-border text-tv-brand hover:bg-tv-brand-tint transition-all"
              style={{ fontWeight: 600 }}
            >
              <Save size={12} />Save to Library
            </button>
            <button
              onClick={handleSaveAndUse}
              className="flex items-center gap-1.5 px-5 py-2 text-[13px] rounded-full bg-tv-brand-bg hover:bg-tv-brand-hover text-white transition-all"
              style={{ fontWeight: 600 }}
            >
              <Send size={12} />Save & Use in Campaign
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateOutro;