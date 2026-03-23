import React from "react";
import { TriangleAlert } from "lucide-react";

// ── Character count limits (shared across all campaign builders) ──────────────
export const CHAR_LIMITS = { subject: 150, senderName: 50, sms: 160, body: 5000 } as const;

/** Strip HTML tags and decode entities to get plain-text char count */
export function htmlTextLength(html: string): number {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return (tmp.textContent || "").length;
}

// ── Warning-level helpers (used by editors & counter bars) ────────────────────
type WarnLevel = "normal" | "amber" | "red";

/** Returns warning level based on how close length is to the limit */
export function getWarnLevel(length: number, limit: number): WarnLevel {
  const amberAt = Math.ceil(limit * 0.875);  // 140 for SMS, 4375 for email
  const redAt   = Math.ceil(limit * 0.969);  // 155 for SMS, 4845 for email
  if (length >= redAt) return "red";
  if (length >= amberAt) return "amber";
  return "normal";
}

/** Returns { wrapperCls, bodyCls } for editor border + background tinting */
export function getEditorWarnCls(length: number, limit: number): { wrapperCls: string; bodyCls: string } {
  const level = getWarnLevel(length, limit);
  if (level === "red")   return { wrapperCls: "border-tv-danger-border",   bodyCls: "bg-tv-danger-bg/40" };
  if (level === "amber") return { wrapperCls: "border-tv-warning-border", bodyCls: "bg-tv-warning-bg/30" };
  return { wrapperCls: "", bodyCls: "" };
}

/** Returns counter text color class for a given warning level */
function counterColor(level: WarnLevel): string {
  if (level === "red") return "text-tv-danger";
  if (level === "amber") return "text-tv-warning";
  return "text-tv-text-decorative";
}

/** Returns counter bar background + border classes */
function counterBarBg(level: WarnLevel): string {
  if (level === "red") return "bg-tv-danger-bg border-tv-danger-border";
  if (level === "amber") return "bg-tv-warning-bg border-tv-warning-border";
  return "bg-tv-surface-muted border-tv-border-light";
}

/** Returns progress bar fill color class */
function progressBarColor(level: WarnLevel): string {
  if (level === "red") return "bg-tv-danger";
  if (level === "amber") return "bg-tv-warning";
  return "bg-tv-brand-bg";
}

// ── Inline header counter (X/Y next to label) ────────────────────────────────

/** Live "X/Y" inline character count indicator for subject, sender name */
export function CharCount({ current, max }: { current: number; max: number }) {
  const pct = current / max;
  const color =
    current > max ? "text-tv-danger" :
    pct >= 0.9 ? "text-tv-warning" :
    "text-tv-text-decorative";
  return (
    <span className={`text-[10px] tabular-nums transition-colors ${color}`} style={{ fontWeight: 500 }}>
      {current}/{max}
    </span>
  );
}

/** Bold "X/Y" header counter for message body labels — matches SMS style everywhere */
export function BodyHeaderCount({ length, limit }: { length: number; limit: number }) {
  const level = getWarnLevel(length, limit);
  const cc = counterColor(level);
  const display = limit >= 1000 ? `${length.toLocaleString()}/${limit.toLocaleString()}` : `${length}/${limit}`;
  return (
    <span className={`text-[12px] tabular-nums transition-colors ${cc}`} style={{ fontWeight: 700 }}>
      {display}
    </span>
  );
}

// ── Prominent counter bar (below editor) ─────────────────────────────────────

/** Prominent SMS character counter with progress bar, segment info, and warnings */
export function SmsCharCounter({ length }: { length: number }) {
  const limit = CHAR_LIMITS.sms;
  const level = getWarnLevel(length, limit);
  const segments = Math.max(1, Math.ceil(length / limit));
  const charsIntoCurrentSegment = length > 0 ? ((length - 1) % limit) + 1 : 0;
  const charsLeftInSegment = length === 0 ? limit : limit - charsIntoCurrentSegment;
  const overLimit = length > limit;
  const cc = counterColor(level);

  return (
    <div className="mt-1.5 space-y-1.5">
      {/* Main counter bar */}
      <div className={`flex items-center justify-between px-3 py-1.5 rounded-sm border transition-colors ${counterBarBg(level)}`}>
        <div className="flex items-center gap-2">
          <span className={`text-[12px] tabular-nums transition-colors ${cc}`} style={{ fontWeight: 700 }}>
            {length}/{limit}
          </span>
          {overLimit && (
            <span className="text-[10px] text-tv-text-secondary">
              &middot; {segments} segment{segments !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span className={`text-[10px] tabular-nums transition-colors ${cc}`} style={{ fontWeight: 500 }}>
          {charsLeftInSegment} left{overLimit ? " in segment" : ""}
        </span>
      </div>
      {/* Progress bar */}
      <div
        className="h-1 rounded-full bg-tv-border-light overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.min(100, Math.round((length / limit) * 100))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="SMS character count"
      >
        <div
          className={`h-full rounded-full transition-all duration-200 ${progressBarColor(level)}`}
          style={{ width: `${Math.min(100, (length / limit) * 100)}%` }}
        />
      </div>
      {/* Segment warning */}
      {overLimit && (
        <div className="p-2.5 bg-tv-warning-bg border border-tv-warning-border rounded-sm flex items-start gap-2">
          <TriangleAlert size={12} className="text-tv-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] text-tv-warning" style={{ fontWeight: 600 }}>
              Message will be split into {segments} SMS segments
            </p>
            <p className="text-[10px] text-tv-warning">
              Messages over 160 characters are automatically split. Each segment is billed separately and may arrive out of order on some carriers.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** Prominent email body character counter — matches SMS counter layout exactly */
export function EmailBodyCharCounter({ length }: { length: number }) {
  const limit = CHAR_LIMITS.body;
  const level = getWarnLevel(length, limit);
  const remaining = limit - length;
  const overLimit = length > limit;
  const cc = counterColor(level);

  return (
    <div className="mt-1.5 space-y-1.5">
      {/* Main counter bar */}
      <div className={`flex items-center justify-between px-3 py-1.5 rounded-sm border transition-colors ${counterBarBg(level)}`}>
        <div className="flex items-center gap-2">
          <span className={`text-[12px] tabular-nums transition-colors ${cc}`} style={{ fontWeight: 700 }}>
            {length.toLocaleString()}/{limit.toLocaleString()}
          </span>
          {overLimit && (
            <span className="text-[10px] text-tv-text-secondary">
              &middot; Over limit
            </span>
          )}
        </div>
        <span className={`text-[10px] tabular-nums transition-colors ${cc}`} style={{ fontWeight: 500 }}>
          {overLimit ? `${Math.abs(remaining).toLocaleString()} over` : `${remaining.toLocaleString()} left`}
        </span>
      </div>
      {/* Progress bar */}
      <div
        className="h-1 rounded-full bg-tv-border-light overflow-hidden"
        role="progressbar"
        aria-valuenow={Math.min(100, Math.round((length / limit) * 100))}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Email body character count"
      >
        <div
          className={`h-full rounded-full transition-all duration-200 ${progressBarColor(level)}`}
          style={{ width: `${Math.min(100, (length / limit) * 100)}%` }}
        />
      </div>
      {/* Over-limit warning */}
      {overLimit && (
        <div className="p-2.5 bg-tv-danger-bg border border-tv-danger-border rounded-sm flex items-start gap-2">
          <TriangleAlert size={12} className="text-tv-danger shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] text-tv-danger" style={{ fontWeight: 600 }}>
              Message body exceeds {limit.toLocaleString()} character limit
            </p>
            <p className="text-[10px] text-tv-danger">
              Please shorten your message. Content beyond {limit.toLocaleString()} characters may be truncated when delivered.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
