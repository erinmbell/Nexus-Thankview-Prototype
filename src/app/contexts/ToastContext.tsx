import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CircleCheckBig, CircleAlert, X } from "lucide-react";
import { TV } from "../theme";

export interface ToastItem { id: string; message: string; type: "success" | "error" | "info"; }
interface ToastCtx { show: (message: string, type?: "success" | "error" | "info") => void; }

export const ToastContext = createContext<ToastCtx>({ show: () => {} });
export const useToast = () => useContext(ToastContext);

const TOAST_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  success: { bg: TV.successBg, border: TV.successBorder, text: TV.success },
  error:   { bg: TV.dangerBg,  border: TV.dangerBorder,  text: TV.danger },
  info:    { bg: TV.brandTint, border: TV.borderStrong,   text: TV.brand },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const show = useCallback((message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const remove = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2" role="status" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const s = TOAST_STYLES[t.type];
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 px-4 py-3 rounded-[12px] shadow-xl border min-w-[280px] max-w-[360px] animate-in slide-in-from-right-4 transition-all"
              style={{ backgroundColor: s.bg, borderColor: s.border, color: s.text }}
              role="alert"
            >
              {t.type === "success" ? <CircleCheckBig size={16} aria-hidden="true" /> : <CircleAlert size={16} aria-hidden="true" />}
              <span style={{ fontFamily: "Roboto, sans-serif" }} className="text-[13px] font-medium flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="opacity-60 hover:opacity-100 transition-opacity" aria-label="Dismiss notification"><X size={13} aria-hidden="true" /></button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}