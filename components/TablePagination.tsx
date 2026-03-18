import { useMemo } from "react";
import { Text, ActionIcon, Select } from "@mantine/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TV } from "../theme";

// ── Shared table pagination bar ─────────────────────────────────────────────
// Drop-in footer for every Mantine <Table> in the app. Mirrors the
// established Contacts / Lists / SavedSearches pattern exactly.

export interface TablePaginationProps {
  page: number;
  rowsPerPage: number;
  totalRows: number;
  onPageChange: (p: number) => void;
  onRowsPerPageChange: (n: number) => void;
  /** Override the rows-per-page options. Default: ["10","25","50","100"] */
  rowOptions?: string[];
}

export function TablePagination({
  page,
  rowsPerPage,
  totalRows,
  onPageChange,
  onRowsPerPageChange,
  rowOptions = ["10", "25", "50", "100"],
}: TablePaginationProps) {
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const start = totalRows === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, totalRows);

  const pageButtons = useMemo(() => {
    if (totalPages <= 1) return [];
    const btns: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) btns.push(i);
    } else {
      btns.push(1);
      if (page > 3) btns.push("...");
      for (
        let i = Math.max(2, page - 1);
        i <= Math.min(totalPages - 1, page + 1);
        i++
      )
        btns.push(i);
      if (page < totalPages - 2) btns.push("...");
      btns.push(totalPages);
    }
    return btns;
  }, [page, totalPages]);

  if (totalRows === 0) return null;

  return (
    <div
      className="flex items-center justify-between flex-wrap gap-y-2 px-5 py-3"
      style={{ borderTop: `1px solid ${TV.borderLight}` }}
    >
      {/* Left: rows-per-page + range label */}
      <div className="flex items-center gap-3">
        <Text fz={12} c={TV.textSecondary}>
          Rows per page:
        </Text>
        <Select
          data={rowOptions}
          value={String(rowsPerPage)}
          onChange={(v) => {
            onRowsPerPageChange(Number(v));
            onPageChange(1);
          }}
          size="xs"
          w={70}
          radius="md"
          comboboxProps={{ shadow: "md" }}
          styles={{
            input: {
              borderColor: TV.borderLight,
              fontSize: 12,
              paddingRight: 24,
            },
          }}
        />
        <Text fz={12} c={TV.textSecondary}>
          {start.toLocaleString()}&ndash;{end.toLocaleString()} of{" "}
          {totalRows.toLocaleString()}
        </Text>
      </div>

      {/* Right: page buttons */}
      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Table pagination">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </ActionIcon>
          {pageButtons.map((btn, i) =>
            btn === "..." ? (
              <Text key={`dots-${i}`} fz={12} c={TV.textSecondary} px={4} aria-hidden="true">
                &hellip;
              </Text>
            ) : (
              <ActionIcon
                key={btn}
                size="sm"
                radius="md"
                variant={btn === page ? "filled" : "subtle"}
                color={btn === page ? "tvPurple" : "gray"}
                onClick={() => onPageChange(btn as number)}
                aria-label={`Page ${btn}`}
                aria-current={btn === page ? "page" : undefined}
              >
                <Text fz={11}>{(btn as number).toLocaleString()}</Text>
              </ActionIcon>
            )
          )}
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight size={14} aria-hidden="true" />
          </ActionIcon>
        </nav>
      )}
    </div>
  );
}