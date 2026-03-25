import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TV } from "../theme";

/**
 * Unified breadcrumb component used across the entire app.
 *
 * Style: parent items are secondary-gray clickable text, separated by `>`
 * chevrons in a lighter gray, with the final (current) page in bold primary.
 *
 * Usage:
 *   <Breadcrumbs items={[
 *     { label: "Home", href: "/" },
 *     { label: "Assets", href: "/assets" },
 *     { label: "Envelope Designs" },        // last item = current page
 *   ]} />
 */

export interface BreadcrumbItem {
  label: string;
  /** If provided the item is clickable. Omit for the current page (last item). */
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  /** Truncate the last item if it exceeds this width (px). */
  maxLastWidth?: number;
}

export function Breadcrumbs({ items, maxLastWidth }: BreadcrumbsProps) {
  const navigate = useNavigate();

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 min-w-0">
      {/* Back button — always visible */}
      <button
        onClick={() => navigate(-1)}
        type="button"
        aria-label="Go back"
        className="hover:bg-tv-surface transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-tv-brand"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 26,
          height: 26,
          borderRadius: "50%",
          border: `1px solid ${TV.borderLight}`,
          background: "none",
          padding: 0,
          cursor: "pointer",
          flexShrink: 0,
          color: TV.textSecondary,
          marginRight: 2,
        }}
      >
        <ChevronLeft size={14} />
      </button>
      <ol className="flex items-center gap-2 min-w-0 list-none m-0 p-0">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const isClickable = !isLast && (item.href || item.onClick);

          return (
            <li key={idx} className="flex items-center gap-2 min-w-0" aria-current={isLast ? "page" : undefined}>
              {idx > 0 && (
                <ChevronRight
                  size={14}
                  aria-hidden="true"
                  style={{ color: TV.textSecondary, flexShrink: 0 }}
                />
              )}
              {isLast ? (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: TV.textPrimary,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    ...(maxLastWidth ? { maxWidth: maxLastWidth, display: "inline-block", verticalAlign: "bottom" } : {}),
                  }}
                >
                  {item.label}
                </span>
              ) : isClickable ? (
                <button
                  onClick={item.onClick ?? (() => item.href && navigate(item.href))}
                  type="button"
                  className="hover:text-tv-brand transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-tv-brand"
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: TV.textSecondary,
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </button>
              ) : (
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: TV.textSecondary,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}