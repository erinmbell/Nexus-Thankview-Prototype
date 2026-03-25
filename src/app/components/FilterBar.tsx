import { useState, useMemo, useCallback } from "react";
import {
  Plus, X, ChevronDown, Check, Search,
  SlidersHorizontal, ChevronLeft, ChevronRight, CalendarRange,
} from "lucide-react";
import {
  Box, Text, Menu, Badge, Popover,
  Tooltip, Checkbox, TextInput, UnstyledButton,
  ScrollArea,
} from "@mantine/core";
import { TV } from "../theme";
import { CONTACT_FILTERS, DATE_CREATED_FILTER, CREATED_BY_FILTER } from "./filterDefs";
import type { FilterDef } from "./filterDefs";
import dayjs from "dayjs";

// Re-export types
export type { FilterDef } from "./filterDefs";
export { CONTACT_FILTERS, DATE_CREATED_FILTER, CREATED_BY_FILTER } from "./filterDefs";

/** Mapping of filter key → selected values (string array) */
export type FilterValues = Record<string, string[]>;

// ── Date helpers (exported for page-level filtering logic) ────────────────────
export function dateFilterMatches(itemDateStr: string, filterValues: string[]): boolean {
  if (filterValues.length === 0) return true;
  if (filterValues.length === 1) return itemDateStr === filterValues[0];
  // range: filterValues = [start, end]
  return itemDateStr >= filterValues[0] && itemDateStr <= filterValues[1];
}

// ── Standalone Chip Filter (reusable purple chip matching global style) ────────
// Use this anywhere you need a filter chip outside the full FilterBar.
export function ChipFilter({ label, icon: Icon, options, values, onChange, searchable }: {
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  options: { value: string; label: string; color?: string }[];
  values: string[];
  onChange: (vals: string[]) => void;
  searchable?: boolean;
}) {
  const [searchText, setSearchText] = useState("");
  const [opened, setOpened] = useState(false);
  const isActive = values.length > 0;

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const getSummary = (): string => {
    if (values.length === 0) return "All";
    if (values.length === 1) {
      const opt = options.find(o => o.value === values[0]);
      return opt?.label ?? values[0];
    }
    return `${values.length} selected`;
  };

  const toggleValue = (val: string) => {
    onChange(
      values.includes(val)
        ? values.filter(v => v !== val)
        : [...values, val]
    );
  };

  return (
    <Menu shadow="md" width={options.length > 20 ? 320 : 260} closeOnItemClick={false}
      opened={opened} onChange={setOpened}
      onClose={() => setSearchText("")}
      position="bottom-start">
      <Menu.Target>
        <UnstyledButton
          py={6} px={12}
          aria-expanded={opened}
          style={{
            border: `1px solid ${isActive ? TV.borderStrong : TV.borderLight}`,
            borderRadius: "var(--mantine-radius-xl)",
            backgroundColor: isActive ? TV.brandTint : "white",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
          className="hover:border-tv-border-strong"
        >
          <Icon size={13} style={{ color: isActive ? TV.textBrand : TV.textSecondary, flexShrink: 0 }} />
          <Text fz={12} fw={isActive ? 600 : 500} c={isActive ? TV.textBrand : TV.textPrimary}>
            {label}
          </Text>
          <Box w={1} h={14} bg={isActive ? TV.borderStrong : TV.borderLight} style={{ flexShrink: 0, opacity: isActive ? 0.4 : 0.6 }} />
          <Text fz={11} fw={isActive ? 600 : 500} c={isActive ? TV.textBrand : TV.textSecondary} style={{ maxWidth: 160 }} truncate>
            {getSummary()}
          </Text>
          {isActive ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); onChange([]); }}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); onChange([]); } }}
              className="min-w-6 min-h-6 flex items-center justify-center focus:ring-2 focus:ring-tv-brand/40 focus:outline-none rounded-full"
              style={{ color: TV.textBrand, flexShrink: 0, cursor: "pointer", display: "inline-flex", background: "none", border: "none", padding: 0 }}
              aria-label={`Clear ${label} filter`}
            >
              <X size={12} aria-hidden="true" />
            </span>
          ) : (
            <ChevronDown size={11} style={{ color: TV.textSecondary, flexShrink: 0 }} />
          )}
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Box px="xs" pt="xs" pb={4}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <Text fz={11} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em">{label}</Text>
            {values.length > 0 && (
              <UnstyledButton onClick={() => onChange([])}>
                <Text fz={11} fw={600} c={TV.danger}>Clear</Text>
              </UnstyledButton>
            )}
          </div>
          {(searchable || options.length > 5) && (
            <TextInput
              placeholder={`Search ${label.toLowerCase()}\u2026`}
              aria-label={`Search ${label.toLowerCase()}`}
              size="xs" radius="md" mb={6}
              value={searchText} onChange={e => setSearchText(e.currentTarget.value)}
              leftSection={<Search size={13} style={{ color: TV.textSecondary }} aria-hidden="true" />}
              styles={{ input: { borderColor: TV.borderLight, fontSize: 11 } }}
            />
          )}
        </Box>
        <ScrollArea.Autosize mah={options.length > 20 ? 320 : 240} type="auto" offsetScrollbars>
          {filteredOptions.map(opt => {
            const checked = values.includes(opt.value);
            return (
              <Menu.Item key={opt.value} fz={13}
                onClick={() => toggleValue(opt.value)}
                leftSection={
                  <Checkbox checked={checked} onChange={() => {}} color="tvPurple" size="xs"
                    styles={{ input: { cursor: "pointer" } }} />
                }
                style={checked ? { backgroundColor: TV.brandTint } : undefined}
              >
                {opt.label}
              </Menu.Item>
            );
          })}
          {filteredOptions.length === 0 && (
            <Text fz={12} c={TV.textSecondary} ta="center" py="sm">No matches</Text>
          )}
        </ScrollArea.Autosize>
      </Menu.Dropdown>
    </Menu>
  );
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function MiniCalendar({ month, rangeStart, rangeEnd, onSelect, maxDate }: {
  month: dayjs.Dayjs;
  rangeStart: string | null;
  rangeEnd: string | null;
  onSelect: (iso: string) => void;
  maxDate?: string;
}) {
  const startOfMonth = month.startOf("month");
  const daysInMonth = month.daysInMonth();
  const startDay = startOfMonth.day();

  const today = dayjs().format("YYYY-MM-DD");

  const cells: (dayjs.Dayjs | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(month.date(d));

  const isInRange = (iso: string) => {
    if (!rangeStart || !rangeEnd) return false;
    return iso >= rangeStart && iso <= rangeEnd;
  };
  const isStart = (iso: string) => iso === rangeStart;
  const isEnd = (iso: string) => iso === rangeEnd;

  return (
    <div>
      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAYS.map(d => (
          <div key={d} className="flex items-center justify-center" style={{ width: 32, height: 24 }}>
            <Text fz={10} fw={600} c={TV.textSecondary} ta="center">{d}</Text>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} style={{ width: 32, height: 32 }} />;
          const iso = day.format("YYYY-MM-DD");
          const disabled = (maxDate && iso > maxDate) || false;
          const inRange = isInRange(iso);
          const start = isStart(iso);
          const end = isEnd(iso);
          const isToday = iso === today;
          const selected = start || end;

          return (
            <button
              key={iso}
              disabled={disabled}
              onClick={() => onSelect(iso)}
              className="flex items-center justify-center transition-colors"
              style={{
                width: 32,
                height: 32,
                borderRadius: selected ? "50%" : start ? "50% 0 0 50%" : end ? "0 50% 50% 0" : 0,
                backgroundColor: selected ? TV.brand : inRange ? TV.brandTint : "transparent",
                color: disabled ? "#ccc" : selected ? "#fff" : TV.textPrimary,
                cursor: disabled ? "default" : "pointer",
                fontWeight: selected || isToday ? 600 : 400,
                fontSize: 12,
                border: "none",
                outline: isToday && !selected ? `1px solid ${TV.borderStrong}` : "none",
                position: "relative",
              }}
            >
              {inRange && !selected && (
                <div style={{
                  position: "absolute", inset: 0,
                  backgroundColor: TV.brandTint,
                  borderRadius: start ? "50% 0 0 50%" : end ? "0 50% 50% 0" : 0,
                }} />
              )}
              <span style={{ position: "relative", zIndex: 1 }}>{day.date()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Date Range Presets ────────────────────────────────────────────────────────

const DATE_PRESETS = [
  { label: "Today", getRange: () => [dayjs().format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")] },
  { label: "Last 7 days", getRange: () => [dayjs().subtract(6, "day").format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")] },
  { label: "Last 30 days", getRange: () => [dayjs().subtract(29, "day").format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")] },
  { label: "Last 90 days", getRange: () => [dayjs().subtract(89, "day").format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")] },
  { label: "Last 6 months", getRange: () => [dayjs().subtract(6, "month").format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")] },
  { label: "Last year", getRange: () => [dayjs().subtract(1, "year").format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")] },
  { label: "All time", getRange: () => [dayjs("2020-01-01").format("YYYY-MM-DD"), dayjs().format("YYYY-MM-DD")] },
];

// ── Date Range Filter Chip ────────────────────────────────────────────────────

function DateRangeFilterChip({ def, values, onChange, onRemove, removable }: {
  def: FilterDef;
  values: string[];
  onChange: (vals: string[]) => void;
  onRemove?: () => void;
  removable?: boolean;
}) {
  const [opened, setOpened] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => dayjs());
  const [pendingStart, setPendingStart] = useState<string | null>(null);

  const rangeStart = values[0] || null;
  const rangeEnd = values[1] || null;
  const isActive = !!(rangeStart && rangeEnd);
  const Icon = def.icon;
  const maxDate = dayjs().format("YYYY-MM-DD");

  const getSummary = (): string => {
    if (!rangeStart || !rangeEnd) return "";
    if (rangeStart === rangeEnd) return dayjs(rangeStart).format("MMM D, YYYY");
    return `${dayjs(rangeStart).format("MMM D")} \u2013 ${dayjs(rangeEnd).format("MMM D, YYYY")}`;
  };

  const handleDayClick = useCallback((iso: string) => {
    if (!pendingStart) {
      setPendingStart(iso);
      onChange([iso]);
    } else {
      const [s, e] = iso >= pendingStart ? [pendingStart, iso] : [iso, pendingStart];
      onChange([s, e]);
      setPendingStart(null);
      setTimeout(() => setOpened(false), 200);
    }
  }, [pendingStart, onChange]);

  const handlePreset = (getRange: () => string[]) => {
    const [s, e] = getRange();
    onChange([s, e]);
    setPendingStart(null);
    setTimeout(() => setOpened(false), 150);
  };

  const handleClear = () => {
    onChange([]);
    setPendingStart(null);
  };

  const handleOpen = (o: boolean) => {
    setOpened(o);
    if (o) {
      setViewMonth(rangeEnd ? dayjs(rangeEnd) : dayjs());
      setPendingStart(null);
    }
  };

  const displayStart = pendingStart || rangeStart;
  const displayEnd = values.length === 2 ? rangeEnd : pendingStart;

  return (
    <Popover opened={opened} onChange={handleOpen} position="bottom-start" shadow="lg" width="auto" withArrow arrowSize={10}>
      <Popover.Target>
        <UnstyledButton
          onClick={() => handleOpen(!opened)}
          aria-expanded={opened}
          py={6} px={12}
          style={{
            border: `1px solid ${isActive ? TV.borderStrong : TV.borderLight}`,
            borderRadius: "var(--mantine-radius-xl)",
            backgroundColor: isActive ? TV.brandTint : "white",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
          className="hover:border-tv-border-strong"
        >
          <Icon size={13} style={{ color: isActive ? TV.textBrand : TV.textSecondary, flexShrink: 0 }} />
          <Text fz={12} fw={isActive ? 600 : 500} c={isActive ? TV.textBrand : TV.textPrimary}>
            {def.label}
          </Text>
          {isActive && (
            <>
              <Box w={1} h={14} bg={TV.borderStrong} style={{ flexShrink: 0, opacity: 0.4 }} />
              <Text fz={11} fw={600} c={TV.textBrand} style={{ maxWidth: 200 }} truncate>
                {getSummary()}
              </Text>
            </>
          )}
          {isActive ? (
            <Box
              component="span"
              className="min-w-6 min-h-6 flex items-center justify-center focus:ring-2 focus:ring-tv-brand/40 focus:outline-none rounded-full"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); handleClear(); }}
              style={{ color: TV.textBrand, flexShrink: 0, cursor: "pointer", display: "inline-flex" }}
              role="button"
              tabIndex={0}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); handleClear(); } }}
              aria-label={`Clear ${def.label} filter`}
            >
              <X size={12} aria-hidden="true" />
            </Box>
          ) : (
            <ChevronDown size={11} style={{ color: TV.textSecondary, flexShrink: 0 }} />
          )}
        </UnstyledButton>
      </Popover.Target>

      <Popover.Dropdown p={0} style={{ borderRadius: "var(--mantine-radius-lg)", overflow: "hidden" }}>
        <div className="flex" style={{ minWidth: 420 }}>
          {/* Presets sidebar */}
          <div className="flex flex-col py-2" style={{ borderRight: `1px solid ${TV.borderLight}`, width: 140 }}>
            <Text fz={10} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em" px={12} mb={4} mt={4}>Quick Select</Text>
            {DATE_PRESETS.map(p => {
              const [ps, pe] = p.getRange();
              const selected = rangeStart === ps && rangeEnd === pe;
              return (
                <UnstyledButton
                  key={p.label}
                  onClick={() => handlePreset(p.getRange)}
                  py={6} px={12}
                  style={{
                    backgroundColor: selected ? TV.brandTint : "transparent",
                    transition: "background-color 0.1s",
                  }}
                  className="hover:bg-tv-surface"
                >
                  <Text fz={12} fw={selected ? 600 : 400} c={selected ? TV.textBrand : TV.textPrimary}>
                    {p.label}
                  </Text>
                </UnstyledButton>
              );
            })}
            {(isActive || pendingStart) && (
              <>
                <Box mx={12} my={4} h={1} bg={TV.borderLight} />
                <UnstyledButton onClick={handleClear} py={4} px={12}>
                  <Text fz={11} fw={600} c={TV.danger}>Clear</Text>
                </UnstyledButton>
              </>
            )}
            {removable && (
              <>
                <Box mx={12} my={4} h={1} bg={TV.borderLight} />
                <UnstyledButton onClick={() => { handleClear(); onRemove?.(); setOpened(false); }} py={4} px={12}>
                  <Text fz={11} fw={500} c={TV.textSecondary}>Remove filter</Text>
                </UnstyledButton>
              </>
            )}
          </div>

          {/* Calendar */}
          <div className="p-3 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <UnstyledButton onClick={() => setViewMonth(m => m.subtract(1, "month"))} p={4} style={{ borderRadius: "var(--mantine-radius-xs)" }} className="hover:bg-tv-surface">
                <ChevronLeft size={14} style={{ color: TV.textSecondary }} />
              </UnstyledButton>
              <Text fz={13} fw={600} c={TV.textPrimary}>{viewMonth.format("MMMM YYYY")}</Text>
              <UnstyledButton
                onClick={() => setViewMonth(m => m.add(1, "month"))}
                p={4} style={{ borderRadius: "var(--mantine-radius-xs)" }}
                className="hover:bg-tv-surface"
                disabled={viewMonth.add(1, "month").startOf("month").isAfter(dayjs())}
              >
                <ChevronRight size={14} style={{ color: viewMonth.add(1, "month").startOf("month").isAfter(dayjs()) ? TV.borderLight : TV.textSecondary }} />
              </UnstyledButton>
            </div>

            {pendingStart && (
              <Text fz={10} c={TV.textSecondary} ta="center" mb={4}>
                Click another date to complete the range
              </Text>
            )}

            <MiniCalendar
              month={viewMonth}
              rangeStart={displayStart}
              rangeEnd={displayEnd}
              onSelect={handleDayClick}
              maxDate={maxDate}
            />

            {isActive && (
              <div className="flex items-center justify-center gap-2 mt-2 pt-2" style={{ borderTop: `1px solid ${TV.borderLight}` }}>
                <CalendarRange size={12} style={{ color: TV.textBrand }} />
                <Text fz={11} fw={600} c={TV.textBrand}>{getSummary()}</Text>
              </div>
            )}
          </div>
        </div>
      </Popover.Dropdown>
    </Popover>
  );
}

// ── Single Filter Chip ────────────────────────────────────────────────────────

function FilterChip({ def, values, onChange, onRemove, removable }: {
  def: FilterDef;
  values: string[];
  onChange: (vals: string[]) => void;
  onRemove?: () => void;
  removable?: boolean;
}) {
  const [searchText, setSearchText] = useState("");
  const [opened, setOpened] = useState(false);
  const isActive = values.length > 0;
  const Icon = def.icon;

  const filteredOptions = def.options.filter(o =>
    o.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const getSummary = (): string => {
    if (values.length === 0) return "All";
    if (values.length === 1) {
      const opt = def.options.find(o => o.value === values[0]);
      return opt?.label ?? values[0];
    }
    return `${values.length} selected`;
  };

  const toggleValue = (val: string) => {
    if (def.type === "select" || def.type === "boolean") {
      onChange(values.includes(val) ? [] : [val]);
    } else {
      onChange(
        values.includes(val)
          ? values.filter(v => v !== val)
          : [...values, val]
      );
    }
  };

  return (
    <Menu shadow="md" width={def.options.length > 20 ? 320 : 260} closeOnItemClick={def.type === "select" || def.type === "boolean"}
      opened={opened} onChange={setOpened}
      onClose={() => setSearchText("")}
      position="bottom-start">
      <Menu.Target>
        <UnstyledButton
          py={6} px={12}
          aria-expanded={opened}
          style={{
            border: `1px solid ${isActive ? TV.borderStrong : TV.borderLight}`,
            borderRadius: "var(--mantine-radius-xl)",
            backgroundColor: isActive ? TV.brandTint : "white",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
          className="hover:border-tv-border-strong"
        >
          <Icon size={13} style={{ color: isActive ? TV.textBrand : TV.textSecondary, flexShrink: 0 }} />
          <Text fz={12} fw={isActive ? 600 : 500} c={isActive ? TV.textBrand : TV.textPrimary}>
            {def.label}
          </Text>
          <Box w={1} h={14} bg={isActive ? TV.borderStrong : TV.borderLight} style={{ flexShrink: 0, opacity: isActive ? 0.4 : 0.6 }} />
          <Text fz={11} fw={isActive ? 600 : 500} c={isActive ? TV.textBrand : TV.textSecondary} style={{ maxWidth: 160 }} truncate>
            {getSummary()}
          </Text>
          {isActive ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); e.preventDefault(); onChange([]); }}
              onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); e.preventDefault(); onChange([]); } }}
              className="min-w-6 min-h-6 flex items-center justify-center focus:ring-2 focus:ring-tv-brand/40 focus:outline-none rounded-full"
              style={{ color: TV.textBrand, flexShrink: 0, cursor: "pointer", display: "inline-flex", background: "none", border: "none", padding: 0 }}
              aria-label={`Clear ${def.label} filter`}
            >
              <X size={12} aria-hidden="true" />
            </span>
          ) : (
            <ChevronDown size={11} style={{ color: TV.textSecondary, flexShrink: 0 }} />
          )}
        </UnstyledButton>
      </Menu.Target>

      <Menu.Dropdown>
        <Box px="xs" pt="xs" pb={4}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <Text fz={11} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em">{def.label}</Text>
            <div className="flex items-center gap-1">
              {values.length > 0 && (
                <UnstyledButton onClick={() => onChange([])}>
                  <Text fz={11} fw={600} c={TV.danger}>Clear</Text>
                </UnstyledButton>
              )}
              {removable && (
                <>
                  <Box w={1} h={12} bg={TV.borderLight} />
                  <Tooltip label="Remove filter from bar" withArrow>
                    <UnstyledButton onClick={() => { onChange([]); onRemove?.(); }} className="min-w-6 min-h-6 flex items-center justify-center">
                      <X size={12} style={{ color: TV.textSecondary }} />
                    </UnstyledButton>
                  </Tooltip>
                </>
              )}
            </div>
          </div>
          {(def.searchable || def.options.length > 5) && (
            <TextInput
              placeholder={`Search ${def.label.toLowerCase()}\u2026`}
              size="xs" radius="md" mb={6}
              value={searchText} onChange={e => setSearchText(e.currentTarget.value)}
              leftSection={<Search size={13} style={{ color: TV.textSecondary }} />}
              styles={{ input: { borderColor: TV.borderLight, fontSize: 11 } }}
            />
          )}
        </Box>
        <ScrollArea.Autosize mah={def.options.length > 20 ? 320 : 240} type="auto" offsetScrollbars>
          {def.type === "select" && !searchText && (
            <Menu.Item fz={13}
              onClick={() => onChange([])}
              rightSection={values.length === 0 ? <Check size={14} style={{ color: TV.textBrand }} /> : null}
              style={values.length === 0 ? { backgroundColor: TV.brandTint } : undefined}
            >
              All
            </Menu.Item>
          )}
          {filteredOptions.map(opt => {
            const checked = values.includes(opt.value);
            return (
              <Menu.Item key={opt.value} fz={13}
                onClick={() => toggleValue(opt.value)}
                rightSection={checked ? <Check size={14} style={{ color: TV.textBrand }} /> : null}
                leftSection={
                  def.type === "multi-select" ? (
                    <Checkbox checked={checked} onChange={() => {}} color="tvPurple" size="xs"
                      styles={{ input: { cursor: "pointer" } }} />
                  ) : opt.color ? (
                    <Box w={8} h={8} style={{
                      borderRadius: "50%",
                      backgroundColor: opt.color === "green" ? TV.success : opt.color === "red" ? TV.danger : opt.color === "orange" ? TV.warning : TV.textSecondary,
                    }} />
                  ) : null
                }
                style={checked && def.type !== "multi-select" ? { backgroundColor: TV.brandTint } : undefined}
              >
                {opt.label}
              </Menu.Item>
            );
          })}
          {filteredOptions.length === 0 && (
            <Text fz={12} c={TV.textSecondary} ta="center" py="sm">No matches</Text>
          )}
        </ScrollArea.Autosize>
      </Menu.Dropdown>
    </Menu>
  );
}

// ── Add Filter Menu ───────────────────────────────────────────────────────────

function AddFilterMenu({ available, onAdd }: {
  available: FilterDef[];
  onAdd: (key: string) => void;
}) {
  const [searchText, setSearchText] = useState("");

  const filtered = useMemo(() => {
    if (!searchText) return available;
    const q = searchText.toLowerCase();
    return available.filter(f => f.label.toLowerCase().includes(q));
  }, [available, searchText]);

  return (
    <Menu shadow="lg" width={260} position="bottom-start" onClose={() => setSearchText("")} closeOnItemClick={false}>
      <Menu.Target>
        <Tooltip label="Add a filter to the bar" withArrow>
          <UnstyledButton
            py={6} px={10}
            style={{
              border: `1px dashed ${TV.borderLight}`,
              borderRadius: "var(--mantine-radius-xl)",
              display: "flex",
              alignItems: "center",
              gap: 4,
              transition: "all 0.15s ease",
            }}
            className="hover:border-tv-border-strong hover:bg-tv-surface"
          >
            <Plus size={13} style={{ color: TV.textLabel }} />
            <Text fz={12} c={TV.textLabel}>Add Filter</Text>
          </UnstyledButton>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown p={0}>
        <Box px="sm" pt="sm" pb={6}>
          <TextInput
            placeholder="Search filters\u2026"
            size="xs" radius="md"
            value={searchText}
            onChange={e => setSearchText(e.currentTarget.value)}
            leftSection={<Search size={13} style={{ color: TV.textSecondary }} />}
            styles={{ input: { borderColor: TV.borderLight, fontSize: 11 } }}
          />
        </Box>
        <ScrollArea.Autosize mah={320} type="auto" offsetScrollbars>
          <Box pb={4}>
            {filtered.length === 0 && (
              <Text fz={12} c={TV.textSecondary} ta="center" py="lg">No matching filters</Text>
            )}
            {filtered.map(f => {
              const FIcon = f.icon;
              return (
                <UnstyledButton
                  key={f.key} w="100%" py={7} px="sm"
                  onClick={() => onAdd(f.key)}
                  className="hover:bg-tv-surface"
                  style={{ display: "flex", alignItems: "center", gap: 8 }}
                >
                  <FIcon size={14} style={{ color: TV.textSecondary, flexShrink: 0 }} />
                  <Text fz={13} c={TV.textPrimary}>{f.label}</Text>
                </UnstyledButton>
              );
            })}
          </Box>
        </ScrollArea.Autosize>
      </Menu.Dropdown>
    </Menu>
  );
}

// ── Main Filter Bar Component ─────────────────────────────────────────────────

export function FilterBar({ filters, activeFilterKeys, filterValues, onFilterValuesChange, onActiveFilterKeysChange }: {
  filters: FilterDef[];
  activeFilterKeys: string[];
  filterValues: FilterValues;
  onFilterValuesChange: (vals: FilterValues) => void;
  onActiveFilterKeysChange: (keys: string[]) => void;
}) {
  const activeCount = Object.values(filterValues).filter(v => v.length > 0).length;

  const visibleFilters = activeFilterKeys
    .map(key => filters.find(f => f.key === key))
    .filter(Boolean) as FilterDef[];

  const availableToAdd = filters.filter(f => !activeFilterKeys.includes(f.key));

  const handleChange = (key: string, vals: string[]) => {
    onFilterValuesChange({ ...filterValues, [key]: vals });
  };

  const handleAdd = (key: string) => {
    if (!activeFilterKeys.includes(key)) {
      onActiveFilterKeysChange([...activeFilterKeys, key]);
    }
  };

  const handleRemove = (key: string) => {
    onActiveFilterKeysChange(activeFilterKeys.filter(k => k !== key));
    const next = { ...filterValues };
    delete next[key];
    onFilterValuesChange(next);
  };

  const clearAll = () => {
    const essentialKeys = filters.filter(f => f.essential).map(f => f.key);
    onActiveFilterKeysChange(essentialKeys);
    onFilterValuesChange({});
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center mr-1">
        <SlidersHorizontal size={14} style={{ color: TV.textLabel }} />
        <Text fz={12} fw={600} c={TV.textLabel} ml={5} mr={2} className="select-none">
          Filters
        </Text>
        {activeCount > 0 && (
          <Badge size="xs" color="tvPurple" variant="filled" radius="xl" ml={2}>
            {activeCount}
          </Badge>
        )}
      </div>

      <Box w={1} h={20} bg={TV.borderLight} mx={2} style={{ flexShrink: 0 }} />

      {visibleFilters.map(f =>
        f.type === "date-range" || f.type === "date" ? (
          <DateRangeFilterChip
            key={f.key}
            def={f}
            values={filterValues[f.key] ?? []}
            onChange={(vals) => handleChange(f.key, vals)}
            onRemove={() => handleRemove(f.key)}
            removable={!f.essential}
          />
        ) : (
          <FilterChip
            key={f.key}
            def={f}
            values={filterValues[f.key] ?? []}
            onChange={(vals) => handleChange(f.key, vals)}
            onRemove={() => handleRemove(f.key)}
            removable={!f.essential}
          />
        )
      )}

      {availableToAdd.length > 0 && (
        <AddFilterMenu available={availableToAdd} onAdd={handleAdd} />
      )}

      {activeCount > 0 && (
        <>
          <Box w={1} h={20} bg={TV.borderLight} mx={2} style={{ flexShrink: 0 }} />
          <UnstyledButton onClick={clearAll}>
            <Text fz={12} fw={600} c={TV.danger} className="hover:underline select-none">
              Clear all
            </Text>
          </UnstyledButton>
        </>
      )}
    </div>
  );
}
