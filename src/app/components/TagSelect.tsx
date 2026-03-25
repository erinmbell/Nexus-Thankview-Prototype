import { useState, useRef } from "react";
import { Combobox, Pill, PillsInput, Text, useCombobox, ScrollArea } from "@mantine/core";
import { Tag, Plus } from "lucide-react";
import { TV } from "../theme";

/** Default preset tags for video contexts */
export const VIDEO_PRESET_TAGS = [
  "thank-you", "annual-fund", "2026", "welcome", "campaign",
  "major-donors", "outreach", "board", "spotlight", "matching",
  "scholarship", "impact", "orientation", "reply", "event",
  "stewardship", "alumni", "giving-day",
];

/** Default preset tags for contact contexts */
export const CONTACT_PRESET_TAGS = [
  "Alumni", "Major Donor", "Foundation", "Board Member",
  "Lapsed", "Prospective", "Staff", "Parent", "Student",
  "Volunteer", "Corporate", "Legacy",
];

interface TagSelectProps {
  /** Currently selected tags */
  value: string[];
  /** Called when selected tags change */
  onChange: (tags: string[]) => void;
  /** Available preset tags shown in the dropdown */
  presetTags?: string[];
  /** Placeholder shown when no tags are selected */
  placeholder?: string;
  /** Optional label displayed above the input */
  label?: React.ReactNode;
  /** Compact sizing for card-context use (smaller pills & input) */
  compact?: boolean;
}

const PILL_ATTR = "data-tag-pill";

export function TagSelect({
  value,
  onChange,
  presetTags = VIDEO_PRESET_TAGS,
  placeholder = "Search or add tags\u2026",
  label,
  compact = false,
}: TagSelectProps) {
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  // Merge presetTags with any custom tags in value that aren't already in presets
  const allKnown = [...new Set([...presetTags, ...value])];

  // Filter options: not already selected, matches search
  const q = search.trim().toLowerCase();
  const filtered = allKnown
    .filter(t => !value.includes(t))
    .filter(t => !q || t.toLowerCase().includes(q));

  // Should we show a "create" option?
  const normalized = q.replace(/\s+/g, "-");
  const exactMatch = allKnown.some(t => t.toLowerCase() === q || t.toLowerCase() === normalized);
  const showCreate = q.length > 0 && !exactMatch;

  const handleSelect = (tag: string) => {
    if (tag === "__create__") {
      const newTag = normalized;
      if (newTag && !value.includes(newTag)) {
        onChange([...value, newTag]);
      }
    } else if (!value.includes(tag)) {
      onChange([...value, tag]);
    }
    setSearch("");
    combobox.resetSelectedOption();
    // Keep focus on input after selection
    inputRef.current?.focus();
  };

  const handleRemove = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && search === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
    if (e.key === "Enter" && showCreate) {
      e.preventDefault();
      handleSelect("__create__");
    }
    // Arrow left from input (when cursor at start) → focus last pill
    if (e.key === "ArrowLeft" && search === "" && value.length > 0) {
      e.preventDefault();
      const pills = getPillElements();
      if (pills.length > 0) {
        pills[pills.length - 1]?.focus();
      }
    }
  };

  // Get all pill elements inside the group
  const getPillElements = (): HTMLElement[] => {
    if (!groupRef.current) return [];
    return Array.from(groupRef.current.querySelectorAll<HTMLElement>(`[${PILL_ATTR}]`));
  };

  // Arrow-key navigation between pills
  const handlePillKeyDown = (tag: string, e: React.KeyboardEvent) => {
    if (e.key === "Delete" || e.key === "Backspace") {
      e.preventDefault();
      const pills = getPillElements();
      const idx = pills.findIndex(el => el === e.currentTarget);
      handleRemove(tag);
      // After removal, focus adjacent pill or input
      requestAnimationFrame(() => {
        const remaining = getPillElements();
        if (remaining.length === 0) {
          inputRef.current?.focus();
        } else if (idx >= remaining.length) {
          remaining[remaining.length - 1]?.focus();
        } else {
          remaining[idx]?.focus();
        }
      });
      return;
    }

    const pills = getPillElements();
    const idx = pills.findIndex(el => el === e.currentTarget);

    if (e.key === "ArrowRight") {
      e.preventDefault();
      if (idx < pills.length - 1) {
        pills[idx + 1]?.focus();
      } else {
        // Move to input when past last pill
        inputRef.current?.focus();
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (idx > 0) {
        pills[idx - 1]?.focus();
      }
    } else if (e.key === "Home") {
      e.preventDefault();
      pills[0]?.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      inputRef.current?.focus();
    }
  };

  const pillSize = compact ? "xs" : "sm";

  const pills = value.map(tag => (
    <Pill
      key={tag}
      withRemoveButton
      onRemove={() => handleRemove(tag)}
      {...{ [PILL_ATTR]: "" }}
      tabIndex={0}
      aria-label={`Tag: ${tag}. Arrow keys to navigate, Delete to remove`}
      onKeyDown={(e: React.KeyboardEvent) => handlePillKeyDown(tag, e)}
      size={pillSize}
      styles={{
        root: { backgroundColor: TV.brandTint, color: TV.brandBg, border: `1px solid ${TV.borderLight}`, gap: 3, cursor: "default", outline: "none" },
        remove: { color: TV.brandBg, width: 14, height: 14, minWidth: 24, minHeight: 24, display: "flex", alignItems: "center", justifyContent: "center" },
      }}
      className="focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-tv-brand focus-visible:rounded-full"
    >
      <span className="inline-flex items-center gap-1">
        <Tag size={compact ? 8 : 9} />
        {tag}
      </span>
    </Pill>
  ));

  return (
    <div>
      {label && (
        <div className="mb-1.5">{typeof label === "string" ? (
          <span
            className="uppercase tracking-wider block"
            style={{ fontSize: compact ? 10 : 11, fontWeight: 600, color: TV.textLabel }}
          >
            {label}
          </span>
        ) : label}</div>
      )}
      <Combobox store={combobox} onOptionSubmit={handleSelect} withinPortal={false}>
        <Combobox.DropdownTarget>
          <PillsInput
            pointer
            onClick={() => combobox.toggleDropdown()}
            styles={{
              input: {
                borderColor: TV.borderLight,
                borderRadius: compact ? 8 : 10,
                minHeight: compact ? 30 : 36,
                fontSize: compact ? 11 : 13,
                padding: "4px 10px",
                cursor: "text",
                backgroundColor: "white",
              },
            }}
          >
            <Pill.Group gap={4} ref={groupRef}>
              {pills}
              <Combobox.EventsTarget>
                <PillsInput.Field
                  ref={inputRef}
                  value={search}
                  placeholder={value.length === 0 ? placeholder : ""}
                  onChange={e => {
                    setSearch(e.currentTarget.value);
                    combobox.openDropdown();
                    combobox.updateSelectedOptionIndex();
                  }}
                  onFocus={() => combobox.openDropdown()}
                  onBlur={() => combobox.closeDropdown()}
                  onKeyDown={handleInputKeyDown}
                  style={{ fontSize: compact ? 11 : 13 }}
                />
              </Combobox.EventsTarget>
            </Pill.Group>
          </PillsInput>
        </Combobox.DropdownTarget>

        <Combobox.Dropdown>
          <Combobox.Options>
            <ScrollArea.Autosize mah={200} type="scroll">
              {filtered.map(tag => (
                <Combobox.Option key={tag} value={tag}>
                  <div className="flex items-center gap-2">
                    <Tag size={12} color={TV.textBrand} />
                    <Text fz={12} c={TV.textPrimary}>{tag}</Text>
                  </div>
                </Combobox.Option>
              ))}
              {showCreate && (
                <Combobox.Option value="__create__">
                  <div className="flex items-center gap-2">
                    <Plus size={12} color={TV.textBrand} />
                    <Text fz={12} c={TV.textBrand} fw={500}>Create &ldquo;{normalized}&rdquo;</Text>
                  </div>
                </Combobox.Option>
              )}
              {filtered.length === 0 && !showCreate && (
                <Combobox.Empty>
                  <Text fz={12} c={TV.textSecondary} ta="center" py={8}>No tags found</Text>
                </Combobox.Empty>
              )}
            </ScrollArea.Autosize>
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  );
}