import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useToast } from "../../contexts/ToastContext";
import { VideoTimelineBar, VideoOverview } from "./VideoTimeline";
import { SharedVideoRecorder } from "./SharedVideoRecorder";
import { IntroBuilder, OutroBuilder } from "./IntroOutroBuilder";
import { PersonalizedRecorder } from "./PersonalizedRecorder";
import { VideoLibrary } from "./VideoLibraryPanel";
import {
  type BuilderView,
  type VideoElements,
  DEFAULT_VIDEO_ELEMENTS,
  DEFAULT_ELEMENT_ORDER,
} from "./types";

// ═════════════════════════════════════════════════════════════════════════════
//  VideoBuilder — orchestrator for the video-creation step.
//  Manages which sub-view is active, element toggle state, and done flags.
//  The timeline bar is always visible at the bottom; the content area swaps
//  between Overview / builders / recorder / library.
// ═════════════════════════════════════════════════════════════════════════════

export interface VideoBuilderProps {
  onPreviousStep?: () => void;
  onNextStep?: () => void;
  hideFooter?: boolean;
}

export function VideoBuilder({
  onPreviousStep,
  onNextStep,
  hideFooter = false,
}: VideoBuilderProps) {
  const { show } = useToast();

  // ── State ────────────────────────────────────────────────────────────────
  const [builderView, setBuilderView] = useState<BuilderView>("overview");
  const [hasIntro, setHasIntro] = useState(false);
  const [hasMain, setHasMain] = useState(false);
  const [hasOutro, setHasOutro] = useState(false);
  const [hasOverlay, setHasOverlay] = useState(false);
  const [videoElements, setVideoElements] = useState<VideoElements>({
    ...DEFAULT_VIDEO_ELEMENTS,
  });
  const [elementOrder, setElementOrder] = useState<(keyof VideoElements)[]>([
    ...DEFAULT_ELEMENT_ORDER,
  ]);

  type LibraryTarget = "intro" | "personalized" | "shared" | "outro" | null;
  const [libraryPickTarget, setLibraryPickTarget] = useState<LibraryTarget>(null);

  // ── Derived ──────────────────────────────────────────────────────────────
  const hasAnyVideoElement = Object.values(videoElements).some(Boolean);
  const isVideoComplete =
    hasAnyVideoElement &&
    (!videoElements.intro || hasIntro) &&
    (!videoElements.personalizedClip || hasMain) &&
    (!videoElements.sharedVideo || hasMain) &&
    (!videoElements.outro || hasOutro);

  // ── Footer helpers ───────────────────────────────────────────────────────
  const isSubView = builderView !== "overview";

  /** Human-readable label for the current sub-view section */
  const sectionLabel = (() => {
    switch (builderView) {
      case "intro-builder":
        return "Intro";
      case "personalized-recorder":
        return "Personalized Video";
      case "shared-recording":
        return "Shared Video";
      case "outro-builder":
        return "Outro";
      case "library":
        return "Library";
      default:
        return "";
    }
  })();

  /** Footer progress dots (Intro / Video / Outro) — only for sub-views */
  const dots: { label: string; done: boolean; editing: boolean }[] = [
    {
      label: "Intro",
      done: hasIntro,
      editing: builderView === "intro-builder",
    },
    {
      label: "Video",
      done: hasMain,
      editing:
        builderView === "personalized-recorder" ||
        builderView === "shared-recording",
    },
    {
      label: "Outro",
      done: hasOutro,
      editing: builderView === "outro-builder",
    },
  ];

  /** Mark the current section done and return to overview */
  const saveSectionAndReturn = () => {
    switch (builderView) {
      case "intro-builder":
        setHasIntro(true);
        show("Intro saved", "success");
        break;
      case "personalized-recorder":
      case "shared-recording":
        setHasMain(true);
        show("Video saved", "success");
        break;
      case "outro-builder":
        setHasOutro(true);
        show("Outro saved", "success");
        break;
      default:
        break;
    }
    setBuilderView("overview");
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col bg-tv-surface-muted">
      {/* Top bar */}
      <div className="bg-white border-b border-tv-border-divider px-4 sm:px-6 py-1.5 shrink-0">
        <div className="flex items-center gap-2 text-[12px]">
          <span className="text-tv-text-primary" style={{ fontWeight: 600 }}>
            Create Campaign
          </span>
          <span className="text-tv-text-decorative">&middot;</span>
          <span className="text-tv-brand" style={{ fontWeight: 600 }}>
            Video Creation
          </span>
        </div>
      </div>

      {/* Content area + Timeline wrapper */}
      <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col">
          {builderView === "overview" ? (
            <VideoOverview
              videoElements={videoElements}
              elementOrder={elementOrder}
              doneFlags={{ hasIntro, hasMain, hasOutro, hasOverlay }}
              hasAnyVideoElement={hasAnyVideoElement}
              isVideoComplete={isVideoComplete}
              onNavigate={setBuilderView}
            />
          ) : builderView === "shared-recording" ? (
            <SharedVideoRecorder
              onBack={() => setBuilderView("overview")}
              onComplete={() => {
                setHasMain(true);
                setBuilderView("overview");
              }}
              onOpenLibrary={() => {
                setLibraryPickTarget("shared");
                setBuilderView("library");
              }}
            />
          ) : builderView === "intro-builder" ? (
            <IntroBuilder
              onBack={() => setBuilderView("overview")}
              onComplete={() => {
                setHasIntro(true);
                setBuilderView("overview");
              }}
              onOpenLibrary={() => {
                setLibraryPickTarget("intro");
                setBuilderView("library");
              }}
            />
          ) : builderView === "outro-builder" ? (
            <OutroBuilder
              onBack={() => setBuilderView("overview")}
              onComplete={() => {
                setHasOutro(true);
                setBuilderView("overview");
              }}
              onOpenLibrary={() => {
                setLibraryPickTarget("outro");
                setBuilderView("library");
              }}
            />
          ) : builderView === "personalized-recorder" ? (
            <PersonalizedRecorder
              onBack={() => setBuilderView("overview")}
              onRecordingAdded={() => setHasMain(true)}
              onOpenLibrary={() => {
                setLibraryPickTarget("personalized");
                setBuilderView("library");
              }}
            />
          ) : builderView === "library" ? (
            <VideoLibrary
              pickMode={libraryPickTarget !== null}
              onBack={() => {
                if (libraryPickTarget === "intro") setBuilderView("intro-builder");
                else if (libraryPickTarget === "outro") setBuilderView("outro-builder");
                else if (libraryPickTarget === "shared") setBuilderView("shared-recording");
                else if (libraryPickTarget === "personalized")
                  setBuilderView("personalized-recorder");
                else setBuilderView("overview");
                setLibraryPickTarget(null);
              }}
              onSelectVideo={(video) => {
                if (libraryPickTarget === "intro") setHasIntro(true);
                else if (libraryPickTarget === "outro") setHasOutro(true);
                else if (
                  libraryPickTarget === "shared" ||
                  libraryPickTarget === "personalized"
                )
                  setHasMain(true);
                show(`"${video.name}" selected`, "success");
                setBuilderView("overview");
                setLibraryPickTarget(null);
              }}
            />
          ) : null}
        </div>

        {/* VideoTimelineBar — always visible */}
        <VideoTimelineBar
          videoElements={videoElements}
          elementOrder={elementOrder}
          builderView={builderView}
          doneFlags={{ hasIntro, hasMain, hasOutro, hasOverlay }}
          onNavigate={setBuilderView}
          onAddElement={(key) =>
            setVideoElements((prev) => ({ ...prev, [key]: true }))
          }
          onRemoveElement={(key) => {
            setVideoElements((prev) => ({ ...prev, [key]: false }));
            if (key === "intro") setHasIntro(false);
            if (key === "personalizedClip" || key === "sharedVideo")
              setHasMain(false);
            if (key === "outro") setHasOutro(false);
            const viewMap: Record<string, BuilderView[]> = {
              intro: ["intro-builder"],
              personalizedClip: ["personalized-recorder"],
              sharedVideo: ["shared-recording"],
              outro: ["outro-builder"],
            };
            if (viewMap[key]?.includes(builderView)) setBuilderView("overview");
          }}
          onReorder={setElementOrder}
        />
      </div>

      {/* Bottom navigation */}
      {!hideFooter && (
        <div className="bg-white border-t border-tv-border-divider px-4 sm:px-6 py-1.5 shrink-0 z-30 relative">
          <div className="flex items-center justify-between">
            {/* LEFT — Back */}
            <button
              onClick={() => {
                if (isSubView) {
                  setBuilderView("overview");
                } else {
                  onPreviousStep?.();
                }
              }}
              className="flex items-center gap-1 text-[12px] text-tv-text-secondary hover:text-tv-text-primary transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              {isSubView ? "Back to Overview" : "Previous Step"}
            </button>

            {/* CENTER — Section progress dots (sub-views only) */}
            {isSubView && builderView !== "library" && (
              <div className="flex items-center gap-3">
                {dots.map((dot) => (
                  <div key={dot.label} className="flex items-center gap-1">
                    <div
                      className={`
                        w-2 h-2 rounded-full transition-colors
                        ${dot.done
                          ? "bg-tv-success"
                          : dot.editing
                            ? "bg-tv-brand"
                            : "bg-tv-border-divider"
                        }
                      `}
                    />
                    <span
                      className={`text-[10px] font-medium ${
                        dot.editing
                          ? "text-tv-brand"
                          : dot.done
                            ? "text-tv-success"
                            : "text-tv-text-decorative"
                      }`}
                    >
                      {dot.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* RIGHT — Done / Save section */}
            {!isSubView ? (
              <button
                onClick={onNextStep}
                disabled={!isVideoComplete}
                className={`
                  flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold transition-colors
                  ${isVideoComplete
                    ? "bg-tv-brand text-white hover:bg-tv-brand-hover"
                    : "bg-tv-surface-muted text-tv-text-decorative cursor-not-allowed"
                  }
                `}
              >
                Done
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : builderView !== "library" ? (
              <button
                onClick={saveSectionAndReturn}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold bg-tv-brand text-white hover:bg-tv-brand-hover transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Save {sectionLabel}
              </button>
            ) : (
              <div /> /* empty spacer for library view */
            )}
          </div>
        </div>
      )}
    </div>
  );
}
