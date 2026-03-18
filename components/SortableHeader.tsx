import { UnstyledButton, Text, Box } from "@mantine/core";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { TV } from "../theme";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SortDir = "asc" | "desc" | null;

export interface SortState {
  key: string | null;
  dir: SortDir;
}

// ── Sort handler (tri-state: asc → desc → none) ──────────────────────────────

export function nextSort(current: SortState, key: string): SortState {
  if (current.key !== key) return { key, dir: "asc" };
  if (current.dir === "asc") return { key, dir: "desc" };
  return { key: null, dir: null };
}

// ── Generic comparator ────────────────────────────────────────────────────────

export function sortRows<T>(
  rows: T[],
  state: SortState,
  getValue: (row: T, key: string) => string | number,
): T[] {
  if (!state.key || !state.dir) return rows;
  const k = state.key;
  const d = state.dir;
  return [...rows].sort((a, b) => {
    const av = getValue(a, k);
    const bv = getValue(b, k);
    let cmp: number;
    if (typeof av === "number" && typeof bv === "number") {
      cmp = av - bv;
    } else {
      cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    }
    return d === "asc" ? cmp : -cmp;
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
  align,
}: {
  label: string;
  sortKey: string;
  currentSort: string | null;
  currentDir: SortDir;
  onSort: (key: string) => void;
  /** Set to "right" for right-aligned numeric columns */
  align?: "left" | "right";
}) {
  const active = currentSort === sortKey;
  const sortLabel = active && currentDir === "asc" ? "ascending" : active && currentDir === "desc" ? "descending" : "none";
  return (
    <UnstyledButton
      onClick={() => onSort(sortKey)}
      className={`flex items-center gap-1 group ${align === "right" ? "ml-auto" : ""}`}
      aria-label={`Sort by ${label}, currently ${sortLabel}`}
    >
      <Text
        fz={11}
        fw={600}
        tt="uppercase"
        lts="0.04em"
        c={active ? TV.textBrand : TV.textSecondary}
        className="select-none whitespace-nowrap"
      >
        {label}
      </Text>
      <Box
        className="shrink-0"
        style={{
          color: active ? TV.textBrand : TV.borderStrong,
          transition: "color 0.15s",
        }}
        aria-hidden="true"
      >
        {active && currentDir === "asc" ? (
          <ArrowUp size={12} />
        ) : active && currentDir === "desc" ? (
          <ArrowDown size={12} />
        ) : (
          <ArrowUpDown size={11} />
        )}
      </Box>
    </UnstyledButton>
  );
}