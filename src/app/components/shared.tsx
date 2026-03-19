import React, { useState, useRef, useEffect } from "react";
import { TV } from "../theme";

/** Reusable section card shell — rounded-xl, white bg, borderLight border */
export function DashCard({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return (
    <div id={id} className={`bg-white rounded-xl border ${className}`} style={{ borderColor: TV.borderLight }}>
      {children}
    </div>
  );
}

/**
 * ResizeObserver-based responsive chart wrapper.
 * Use `height` for a fixed-height container, or `flex` to fill available space.
 */
export function ChartBox({ height, flex, children }: { height?: number; flex?: boolean; children: (w: number, h: number) => React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = Math.floor(entry.contentRect.width);
      const h = Math.floor(entry.contentRect.height);
      if (w > 0 && h > 0) setSize({ w, h });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ width: "100%", ...(flex ? { flex: "1 1 0%", minHeight: 120 } : { height: height ?? 250 }), minWidth: 0, overflow: "visible", position: "relative" }}>
      {size.w > 0 && size.h > 0 ? children(size.w, size.h) : null}
    </div>
  );
}

/** Shared Mantine Drawer styles -- compact title, tighter padding */
export const DRAWER_STYLES = {
  header: { padding: "14px 20px 10px 20px", borderBottom: `1px solid ${TV.borderDivider}`, marginBottom: 0, minHeight: "unset" as const },
  title: { fontSize: 15, fontWeight: 900, color: TV.textPrimary, lineHeight: 1.4 },
  body: { padding: "16px 20px 20px 20px" },
  close: { color: TV.textSecondary, width: 28, height: 28, minWidth: 28, minHeight: 28 },
  content: { borderRadius: "20px 0 0 20px" },
};