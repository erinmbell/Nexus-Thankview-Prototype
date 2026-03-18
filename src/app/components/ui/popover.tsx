/**
 * Popover — thin wrapper using native HTML for positioning.
 * Replaces @radix-ui/react-popover since it's not installed.
 */
import { useState, useRef, useEffect, type ReactNode } from "react";

interface PopoverContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

import { createContext, useContext } from "react";

const PopoverCtx = createContext<PopoverContextValue>({
  open: false,
  setOpen: () => {},
  triggerRef: { current: null },
});

export function Popover({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
  children: ReactNode;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <PopoverCtx.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block">{children}</div>
    </PopoverCtx.Provider>
  );
}

export function PopoverTrigger({
  children,
  asChild,
  ...props
}: {
  children: ReactNode;
  asChild?: boolean;
  [key: string]: any;
}) {
  const { open, setOpen, triggerRef } = useContext(PopoverCtx);
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
    </button>
  );
}

export function PopoverContent({
  children,
  className = "",
  side = "bottom",
  align = "start",
  sideOffset = 4,
  ...props
}: {
  children: ReactNode;
  className?: string;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  [key: string]: any;
}) {
  const { open, setOpen } = useContext(PopoverCtx);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, setOpen]);

  if (!open) return null;

  const positionClass =
    side === "top" ? "bottom-full mb-1" :
    side === "bottom" ? "top-full mt-1" :
    side === "left" ? "right-full mr-1" : "left-full ml-1";

  const alignClass =
    align === "end" ? "right-0" :
    align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";

  return (
    <div
      ref={ref}
      className={`absolute z-50 ${positionClass} ${alignClass} ${className}`}
      style={{ marginTop: side === "bottom" ? sideOffset : undefined, marginBottom: side === "top" ? sideOffset : undefined }}
      {...props}
    >
      {children}
    </div>
  );
}

export function PopoverAnchor({ children, ...props }: { children?: ReactNode; [key: string]: any }) {
  return <div {...props}>{children}</div>;
}
