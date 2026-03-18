import { ReactNode, useRef, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";
import { TV } from "../../theme";

export interface MenuAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

interface AssetActionMenuProps {
  actions: MenuAction[];
  onClose: () => void;
  /** z-index for the backdrop; the dropdown gets zIndex + 1. Card menus default to 20, modal menus should pass 70. */
  zIndex?: number;
  width?: number;
  /** Override hover classes for non-danger items. Defaults to purple accent. */
  hoverClass?: string;
}

export function AssetActionMenu({
  actions,
  onClose,
  zIndex = 20,
  width = 170,
  hoverClass = "hover:bg-tv-brand-tint hover:text-tv-brand",
}: AssetActionMenuProps) {
  const markerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const el = markerRef.current;
    if (!el) return;
    // Walk up to the nearest `position: relative` ancestor (the trigger wrapper)
    const anchor = el.parentElement;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    // Position below the trigger, right-aligned
    let top = rect.bottom + 4;
    let left = rect.right - width;
    // Clamp so the menu doesn't overflow viewport edges
    if (left < 8) left = 8;
    if (top + 200 > window.innerHeight) top = rect.top - 4; // flip above if near bottom
    setPos({ top, left });
  }, [width]);

  const normal = actions.filter(a => !a.danger);
  const danger = actions.filter(a => a.danger);

  const dropdown = (
    <>
      <div className="fixed inset-0" style={{ zIndex }} onClick={onClose} aria-hidden="true" />
      {pos && (
        <div
          role="menu"
          aria-label="Actions"
          className="fixed bg-white rounded-[12px] border overflow-hidden"
          style={{ zIndex: zIndex + 1, width, top: pos.top, left: pos.left, borderColor: TV.borderLight, boxShadow: "0 25px 50px -12px rgba(0,0,0,.25)" }}
        >
          {normal.map(a => (
            <button
              key={a.label}
              role="menuitem"
              onClick={a.onClick}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] ${hoverClass} transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-tv-brand`}
              style={{ color: TV.textLabel }}
            >
              <span aria-hidden="true">{a.icon}</span>
              {a.label}
            </button>
          ))}
          {danger.length > 0 && <div role="separator" style={{ borderTop: `1px solid ${TV.borderDivider}` }} />}
          {danger.map(a => (
            <button
              key={a.label}
              role="menuitem"
              onClick={a.onClick}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[12px] text-tv-danger hover:bg-tv-danger-bg transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-tv-brand"
            >
              <span aria-hidden="true">{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Invisible marker to measure anchor position */}
      <div ref={markerRef} className="absolute w-0 h-0 overflow-hidden" />
      {createPortal(dropdown, document.body)}
    </>
  );
}