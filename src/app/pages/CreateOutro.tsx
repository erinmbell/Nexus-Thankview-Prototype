import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Play, Pause, ChevronDown, ChevronLeft, Trash2,
  Save, Send, ChevronRight, MonitorPlay, Music, Link2,
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
  category: "saved" | "video" | "legacy";
  gradient: string;
  ctaLabel: string;
}

const OUTRO_THEMES: OutroTheme[] = [
  { id: 1, name: "Thanks!", category: "saved", gradient: "linear-gradient(143.13deg, #7c45b0 0%, #7c45b0 100%)", ctaLabel: "Thank You" },
  { id: 2, name: "Donate", category: "saved", gradient: "linear-gradient(143.13deg, #166534 0%, #15803d 100%)", ctaLabel: "Donate Now" },
  { id: 3, name: "Visit", category: "saved", gradient: "linear-gradient(143.13deg, #007c9e 0%, #00c0f5 100%)", ctaLabel: "Visit Us" },
  { id: 4, name: "Connect", category: "saved", gradient: "linear-gradient(143.13deg, #b45309 0%, #b45309 100%)", ctaLabel: "Connect" },
  { id: 5, name: "Give Now", category: "video", gradient: "linear-gradient(143.13deg, #1B3461 0%, #3b82f6 100%)", ctaLabel: "Give Now" },
  { id: 6, name: "Support", category: "video", gradient: "linear-gradient(143.13deg, #b91c1c 0%, #dc2626 100%)", ctaLabel: "Support Us" },
  { id: 7, name: "Learn More", category: "video", gradient: "linear-gradient(143.13deg, #0f766e 0%, #2dd4bf 100%)", ctaLabel: "Learn More" },
  { id: 8, name: "Register", category: "video", gradient: "linear-gradient(143.13deg, #374151 0%, #6b7280 100%)", ctaLabel: "Register" },
  { id: 9, name: "Explore", category: "video", gradient: "linear-gradient(143.13deg, #4c1d95 0%, #7c3aed 100%)", ctaLabel: "Explore" },
  { id: 10, name: "Classic CTA", category: "legacy", gradient: "linear-gradient(143.13deg, #7c45b0 0%, #7c45b0 100%)", ctaLabel: "Click Here" },
  { id: 11, name: "Simple End", category: "legacy", gradient: "linear-gradient(143.13deg, #374151 0%, #6b7280 100%)", ctaLabel: "" },
  { id: 12, name: "Branded", category: "legacy", gradient: "linear-gradient(143.13deg, #1B3461 0%, #3b82f6 100%)", ctaLabel: "Visit" },
];

const BG_COLORS = [
  "#7c45b0", "#1e3a8a", "#14532d", "#b91c1c", "#0f766e", "#374151", "#b45309", "#ffffff",
];

const MUSIC_OPTIONS = [
  { value: "uplifting", label: "Uplifting" },
  { value: "calm", label: "Calm" },
  { value: "corporate", label: "Corporate" },
  { value: "festive", label: "Festive" },
];

const MUSIC_TRACKS = [
  { value: "bright-horizons", label: "Bright Horizons", mood: "uplifting", duration: "0:30" },
  { value: "sunrise-walk", label: "Sunrise Walk", mood: "uplifting", duration: "0:25" },
  { value: "still-waters", label: "Still Waters", mood: "calm", duration: "0:22" },
  { value: "quiet-evening", label: "Quiet Evening", mood: "calm", duration: "0:28" },
  { value: "forward-motion", label: "Forward Motion", mood: "corporate", duration: "0:20" },
  { value: "steady-climb", label: "Steady Climb", mood: "corporate", duration: "0:18" },
  { value: "bright-bells", label: "Bright Bells", mood: "festive", duration: "0:24" },
  { value: "celebration", label: "Celebration", mood: "festive", duration: "0:30" },
];

// Mock edit data for pre-population
const EDIT_DATA: Record<string, { bgColor: string; ctaLabel: string; ctaUrl: string; music: string; mood: string; themeId: number; saveAsTemplate: boolean }> = {
  "1": { bgColor: "#7c45b0", ctaLabel: "Thank You", ctaUrl: "https://give.hartwell.edu", music: "bright-horizons", mood: "uplifting", themeId: 1, saveAsTemplate: false },
  "2": { bgColor: "#166534", ctaLabel: "Donate Now", ctaUrl: "https://give.hartwell.edu", music: "still-waters", mood: "calm", themeId: 2, saveAsTemplate: false },
  "3": { bgColor: "#007c9e", ctaLabel: "Visit Us", ctaUrl: "https://hartwell.edu", music: "bright-horizons", mood: "uplifting", themeId: 3, saveAsTemplate: false },
  "4": { bgColor: "#b45309", ctaLabel: "Connect", ctaUrl: "https://hartwell.edu/connect", music: "forward-motion", mood: "corporate", themeId: 4, saveAsTemplate: false },
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
  const [videoExpanded, setVideoExpanded] = useState(false);
  const [legacyExpanded, setLegacyExpanded] = useState(false);

  // ── Builder state ──
  const [selectedTheme, setSelectedTheme] = useState<OutroTheme>(OUTRO_THEMES[2]); // Visit (teal)
  const [ctaUrl, setCtaUrl] = useState("");
  const [buttonText, setButtonText] = useState("Donate Now");
  const [selectedColor, setSelectedColor] = useState<string>(BG_COLORS[0]);
  const [selectedMood, setSelectedMood] = useState<string>("uplifting");
  const [selectedTrack, setSelectedTrack] = useState<string | null>("bright-horizons");
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
    setButtonText(data.ctaLabel);
    setCtaUrl(data.ctaUrl);
    setSelectedMood(data.mood);
    setSelectedTrack(data.music);
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

  const filteredTracks = MUSIC_TRACKS.filter((t) => t.mood === selectedMood);
  const activeTrackLabel = MUSIC_TRACKS.find((t) => t.value === selectedTrack)?.label ?? null;

  const savedThemes = OUTRO_THEMES.filter((t) => t.category === "saved");
  const videoThemes = OUTRO_THEMES.filter((t) => t.category === "video");
  const legacyThemes = OUTRO_THEMES.filter((t) => t.category === "legacy");

  const handleSelectTheme = (theme: OutroTheme) => {
    setSelectedTheme(theme);
    if (theme.ctaLabel) setButtonText(theme.ctaLabel);
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
            title="Video Outros"
            count={videoThemes.length}
            expanded={videoExpanded}
            onToggle={() => setVideoExpanded(!videoExpanded)}
          >
            <div className="grid grid-cols-3 gap-2">
              {videoThemes.map((theme) => (
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
              {/* CTA Button badge (top-left) */}
              {buttonText && (
                <div className="absolute top-3 left-3 px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-sm">
                  <Text fz={10} c="white" fw={500} className="leading-none">
                    {buttonText}
                  </Text>
                </div>
              )}

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
                  {buttonText || selectedTheme.name}
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

              {/* Bottom bar: theme badge + music indicator */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                {activeTrackLabel ? (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                    <Music size={10} className="text-white" />
                    <Text fz={10} c="white" className="leading-none">
                      {activeTrackLabel}
                    </Text>
                  </div>
                ) : (
                  <div />
                )}
                <div className="px-2.5 py-1 rounded-full bg-black/30 backdrop-blur-sm">
                  <Text fz={10} c="white" className="leading-none">
                    {selectedTheme.name} Theme
                  </Text>
                </div>
              </div>
            </div>

            {/* Configuration Panel */}
            <div className="bg-white rounded-lg p-6 space-y-6" style={{ border: `1px solid ${TV.borderLight}` }}>
              {/* CTA Link URL */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Link2 size={10} style={{ color: TV.textLabel }} />
                  <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5">
                    CTA Link URL
                  </Text>
                </div>
                <input
                  type="text"
                  autoComplete="off"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-lg text-[16px] focus-visible:outline-2 focus-visible:outline-tv-brand focus-visible:outline-offset-2"
                  style={{ border: `1px solid ${TV.borderLight}`, color: TV.textPrimary }}
                  placeholder="https://"
                />
              </div>

              {/* Button Text */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2.08333 8.33333L5 1.66667L7.91667 8.33333M3.75 8.33333H6.25M5 1.66667V8.33333"
                      stroke={TV.textLabel}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="0.833333"
                    />
                  </svg>
                  <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5">
                    Button Text
                  </Text>
                </div>
                <input
                  type="text"
                  autoComplete="off"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full h-[42px] px-3 rounded-lg text-[16px] focus-visible:outline-2 focus-visible:outline-tv-brand focus-visible:outline-offset-2"
                  style={{ border: `1px solid ${TV.borderLight}`, color: TV.textPrimary }}
                  placeholder="Donate Now"
                />
              </div>

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

              {/* Music */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path
                      d="M3.33333 7.5V3.33333M5.83333 7.5V1.66667M1.66667 7.5V5"
                      stroke={TV.textLabel}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="0.833333"
                    />
                  </svg>
                  <Text fz={10} fw={600} c={TV.textLabel} tt="uppercase" lts="0.5">
                    Music
                  </Text>
                </div>

                {/* Mood pills */}
                <div className="flex gap-2 mb-3">
                  {MUSIC_OPTIONS.map((mood) => (
                    <button
                      key={mood.value}
                      onClick={() => {
                        setSelectedMood(mood.value);
                        const firstTrack = MUSIC_TRACKS.find((t) => t.mood === mood.value);
                        setSelectedTrack(firstTrack ? firstTrack.value : null);
                      }}
                      className="px-4 h-[30px] rounded-full text-[16px] border transition-colors"
                      style={{
                        backgroundColor: selectedMood === mood.value ? TV.brandTint : "white",
                        borderColor: selectedMood === mood.value ? TV.brandBg : TV.borderLight,
                        color: selectedMood === mood.value ? TV.brand : TV.textSecondary,
                      }}
                    >
                      {mood.label}
                    </button>
                  ))}
                </div>

                {/* Track list */}
                <div className="space-y-1.5">
                  {filteredTracks.map((track) => {
                    const isActive = selectedTrack === track.value;
                    return (
                      <div
                        key={track.value}
                        onClick={() => setSelectedTrack(isActive ? null : track.value)}
                        className="h-[37px] rounded-lg border px-2 flex items-center gap-2.5 cursor-pointer transition-colors"
                        style={{
                          borderColor: isActive ? TV.brandBg : TV.borderLight,
                          backgroundColor: isActive ? TV.brandTint : "white",
                        }}
                      >
                        <button
                          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: isActive ? TV.brandBg : TV.surface }}
                        >
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                            <path
                              d="M2 2.5L5.5 4.5L2 6.5V2.5Z"
                              fill={isActive ? "white" : TV.textPrimary}
                              stroke={isActive ? "white" : TV.textPrimary}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="0.666"
                            />
                          </svg>
                        </button>
                        <Text fz={10} fw={isActive ? 600 : 500} c={isActive ? TV.brand : TV.textPrimary} className="flex-1">
                          {track.label}
                        </Text>
                        <Text fz={9} c={isActive ? TV.brand : TV.textDecorative}>
                          {track.duration}
                        </Text>
                      </div>
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