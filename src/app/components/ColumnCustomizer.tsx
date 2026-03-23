import { useState } from "react";
import {
  Plus, X, Search, ArrowUp, ArrowDown, GripVertical, Columns3,
} from "lucide-react";
import {
  Box, Text, Modal, TextInput, Stack, UnstyledButton,
  ActionIcon, Tooltip, Button,
} from "@mantine/core";
import { TV } from "../theme";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ColumnDef {
  key: string;
  label: string;
  group: string;
  /** If true, column is always shown and cannot be removed */
  required?: boolean;
}

// ── Edit Columns Modal ────────────────────────────────────────────────────────

export function EditColumnsModal({ columns, active, onClose, onSave }: {
  columns: ColumnDef[];
  active: string[];
  onClose: () => void;
  onSave: (cols: string[]) => void;
}) {
  const [activeCols, setActiveCols] = useState<string[]>(active);
  const [colSearch, setColSearch] = useState("");

  // Find the first required column key (to protect from removal)
  const requiredKeys = new Set(columns.filter(c => c.required).map(c => c.key));

  const available = columns.filter(c => !activeCols.includes(c.key));
  const grouped = available.reduce<Record<string, ColumnDef[]>>((acc, col) => {
    if (colSearch && !col.label.toLowerCase().includes(colSearch.toLowerCase())) return acc;
    (acc[col.group] ??= []).push(col);
    return acc;
  }, {});

  const addCol = (key: string) => setActiveCols(c => [...c, key]);
  const removeCol = (key: string) => setActiveCols(c => c.filter(k => k !== key));

  // Find the first non-removable index (required columns at start)
  const firstMovableIndex = activeCols.findIndex(k => !requiredKeys.has(k));
  const minMoveIdx = firstMovableIndex === -1 ? activeCols.length : firstMovableIndex;

  const moveUp = (idx: number) => {
    if (idx <= minMoveIdx) return;
    setActiveCols(c => { const n = [...c]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n; });
  };
  const moveDown = (idx: number) => {
    if (requiredKeys.has(activeCols[idx])) return;
    setActiveCols(c => { if (idx >= c.length - 1) return c; const n = [...c]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n; });
  };

  const resetToRequired = () => {
    setActiveCols(activeCols.filter(k => requiredKeys.has(k)));
  };

  return (
    <Modal opened onClose={onClose} title="Edit Columns" size="lg" radius="lg">
      <div className="flex items-start gap-6 flex-nowrap" style={{ minHeight: 320 }}>
        {/* Available */}
        <Box style={{ flex: 1 }}>
          <div className="flex items-center justify-between mb-2">
            <Text fz={12} fw={700} c={TV.textPrimary}>Available</Text>
            <UnstyledButton onClick={() => setActiveCols([...activeCols, ...available.map(c => c.key)])}>
              <Text fz={12} fw={600} c={TV.textBrand}>Add All &rarr;</Text>
            </UnstyledButton>
          </div>
          <TextInput
            leftSection={<Search size={13} style={{ color: TV.textSecondary }} />}
            placeholder="Search&hellip;" size="xs" mb="sm" radius="md"
            value={colSearch} onChange={e => setColSearch(e.currentTarget.value)}
            styles={{ input: { borderColor: TV.borderLight, backgroundColor: '#fff', color: TV.textPrimary } }}
          />
          <Box style={{ maxHeight: 280, overflowY: "auto" }}>
            {Object.entries(grouped).map(([group, cols]) => (
              <Box key={group} mb="sm">
                <Text fz={11} fw={700} c={TV.textLabel} tt="uppercase" lts="0.04em" mb={4}>{group}</Text>
                {cols.map(col => (
                  <UnstyledButton key={col.key} w="100%" py={6} px="xs"
                    className="flex items-center justify-between rounded-md hover:bg-tv-surface transition-colors"
                    onClick={() => addCol(col.key)}>
                    <Text fz={13} c={TV.textPrimary}>{col.label}</Text>
                    <Plus size={14} style={{ color: TV.textBrand }} />
                  </UnstyledButton>
                ))}
              </Box>
            ))}
            {Object.keys(grouped).length === 0 && (
              <Text fz={12} c={TV.textSecondary} ta="center" py="md">
                {colSearch ? "No matching columns" : "All columns added"}
              </Text>
            )}
          </Box>
        </Box>

        {/* Divider */}
        <Box w={1} bg={TV.borderLight} style={{ alignSelf: "stretch" }} />

        {/* Active */}
        <Box style={{ flex: 1 }}>
          <div className="flex items-center justify-between mb-2">
            <Text fz={12} fw={700} c={TV.textPrimary}>Active</Text>
            <UnstyledButton onClick={resetToRequired}>
              <Text fz={12} fw={600} c={TV.danger}>Remove All</Text>
            </UnstyledButton>
          </div>
          <Text fz={11} c={TV.textSecondary} mb="sm">Drag and drop to prioritize the order.</Text>
          <Stack gap={0} style={{ maxHeight: 300, overflowY: "auto" }}>
            {activeCols.map((key, idx) => {
              const col = columns.find(c => c.key === key);
              if (!col) return null;
              const isRequired = requiredKeys.has(key);
              return (
                <div key={key} className="flex items-center gap-2 py-1.5 px-2 hover:bg-tv-surface transition-colors"
                  style={{ borderBottom: `1px solid ${TV.borderDivider}` }}
                  aria-roledescription="sortable"
                >
                  {!isRequired && (
                    <Box className="cursor-grab" style={{ color: TV.borderStrong }} aria-label={`Reorder ${col.label}`} role="button" tabIndex={0}>
                      <GripVertical size={14} aria-hidden="true" />
                    </Box>
                  )}
                  <Text fz={13} c={TV.textPrimary} style={{ flex: 1 }}>
                    {col.label}
                    {isRequired && <Text span fz={11} c={TV.textSecondary} ml={6}>Required</Text>}
                  </Text>
                  {!isRequired && (
                    <div className="flex items-center gap-0.5">
                      <Tooltip label="Move up" withArrow>
                        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => moveUp(idx)}
                          disabled={idx <= minMoveIdx} aria-label={`Move ${col.label} up`}>
                          <ArrowUp size={12} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Move down" withArrow>
                        <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => moveDown(idx)}
                          disabled={idx >= activeCols.length - 1} aria-label={`Move ${col.label} down`}>
                          <ArrowDown size={12} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Remove" withArrow>
                        <ActionIcon variant="subtle" color="red" size="sm" onClick={() => removeCol(key)} aria-label={`Remove ${col.label} column`}>
                          <X size={12} />
                        </ActionIcon>
                      </Tooltip>
                    </div>
                  )}
                </div>
              );
            })}
          </Stack>
        </Box>
      </div>
      <div className="flex items-center justify-end gap-3 mt-5">
        <Button variant="outline" color="red" onClick={onClose}>Cancel</Button>
        <Button color="tvPurple" onClick={() => { onSave(activeCols); onClose(); }}>Save Columns</Button>
      </div>
    </Modal>
  );
}

// ── Columns Button (for toolbar placement) ────────────────────────────────────

export function ColumnsButton({ onClick }: { onClick: () => void }) {
  return (
    <Tooltip label="Customize Columns" withArrow>
      <ActionIcon variant="default" size="lg" radius="xl" onClick={onClick}
        aria-label="Customize columns"
        styles={{ root: { borderColor: TV.borderLight } }}>
        <Columns3 size={16} style={{ color: TV.textLabel }} />
      </ActionIcon>
    </Tooltip>
  );
}