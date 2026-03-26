import { useState, useCallback, useRef, useEffect, type ReactNode } from "react";

interface ResizableSplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  defaultRightPercent?: number;
  minRightPercent?: number;
  maxRightPercent?: number;
  gap?: number;
  className?: string;
  stickyRight?: boolean;
  stickyTop?: string;
}

export function ResizableSplitPane({
  left, right,
  defaultRightPercent = 42, minRightPercent = 20, maxRightPercent = 65,
  gap = 0, className = "", stickyRight = true, stickyTop = "1rem",
}: ResizableSplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rightPercent, setRightPercent] = useState(defaultRightPercent);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDoubleClick = useCallback(() => {
    setRightPercent(defaultRightPercent);
  }, [defaultRightPercent]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setRightPercent(prev => Math.min(maxRightPercent, prev + 2));
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      setRightPercent(prev => Math.max(minRightPercent, prev - 2));
    }
  }, [minRightPercent, maxRightPercent]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const rightPx = rect.width - mouseX;
      let pct = (rightPx / rect.width) * 100;
      pct = Math.max(minRightPercent, Math.min(maxRightPercent, pct));
      setRightPercent(pct);
    };
    const handleMouseUp = () => setIsDragging(false);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isDragging, minRightPercent, maxRightPercent]);

  const leftPercent = 100 - rightPercent;

  return (
    <div ref={containerRef} className={`flex items-start ${className}`} style={{ gap: `${gap}px` }}>
      <div className="min-w-0 shrink-0 overflow-hidden" style={{ width: `calc(${leftPercent}% - 12px)` }}>{left}</div>
      <div className="shrink-0 flex items-stretch self-stretch group" style={{ width: "24px" }}>
        <button
          onMouseDown={handleMouseDown}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          className="relative w-full flex items-center justify-center cursor-col-resize focus:outline-none focus-visible:ring-2 focus-visible:ring-tv-brand/40"
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(rightPercent)}
          aria-valuemin={minRightPercent}
          aria-valuemax={maxRightPercent}
          aria-label="Resize panes (drag, double-click to reset, or use arrow keys)"
          title="Resize panes (drag, double-click to reset, or use arrow keys)"
        >
          <div className={`absolute inset-y-0 left-1/2 -translate-x-1/2 w-[3px] rounded-full transition-colors duration-150 ${isDragging ? "bg-tv-brand-bg" : "bg-tv-border-light group-hover:bg-tv-brand-bg/50"}`} />
          <div
            className={`relative z-10 flex flex-col items-center gap-[3px] py-2 px-1 rounded-full transition-all duration-150 ${isDragging ? "bg-tv-brand-bg shadow-md scale-110" : "bg-tv-surface-hover border border-tv-border-light group-hover:bg-tv-brand-tint group-hover:border-tv-brand-bg/30 group-hover:shadow-sm"}`}
            style={{ marginTop: "120px", position: "sticky", top: "140px" }}
          >
            {[0,1,2,3,4].map(i => (
              <div key={i} className={`w-[3px] h-[3px] rounded-full ${isDragging ? "bg-white" : "bg-tv-text-decorative group-hover:bg-tv-brand"}`} />
            ))}
          </div>
        </button>
      </div>
      <div
        className={`min-w-0 shrink-0 ${stickyRight ? "z-10" : ""}`}
        style={{ width: `calc(${rightPercent}% - 12px)`, ...(stickyRight ? { position: "sticky" as const, top: stickyTop } : {}) }}
      >
        {right}
      </div>
    </div>
  );
}
