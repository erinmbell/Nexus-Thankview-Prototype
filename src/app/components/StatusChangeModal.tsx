/**
 * StatusChangeModal — Vertical flowchart timeline for campaign status transitions.
 *
 * Five steps: Draft -> Scheduled -> Sending -> Sent -> Archived
 * Current status = filled indigo dot; valid forward steps = clickable;
 * past / invalid = grayed out with tooltip.
 * Clicking a valid step shows an inline confirmation view.
 * Extra actions: Pause (Scheduled) and Cancel Send (Sending).
 */
import { useState } from "react";
import { Modal, Button, Text, Group, Stack, Tooltip } from "@mantine/core";
import {
  FileEdit, CalendarClock, Loader2, CheckCircle2, Archive,
  Pause, XCircle, ArrowLeft, TriangleAlert,
} from "lucide-react";
import { TV } from "../theme";

/* ── Types ──────────────────────────────────────────────────────────────────── */

type CampaignStatus = "Draft" | "Scheduled" | "Sending" | "Sent" | "Archived";

interface StatusChangeModalProps {
  opened: boolean;
  onClose: () => void;
  currentStatus: string;
  constituentCount: number;
  scheduledSends?: number;
  onStatusChange: (newStatus: CampaignStatus) => void;
}

/* ── Static data ────────────────────────────────────────────────────────────── */

const STEPS: { status: CampaignStatus; label: string; icon: typeof FileEdit }[] = [
  { status: "Draft",     label: "Draft",     icon: FileEdit },
  { status: "Scheduled", label: "Scheduled", icon: CalendarClock },
  { status: "Sending",   label: "Sending",   icon: Loader2 },
  { status: "Sent",      label: "Sent",      icon: CheckCircle2 },
  { status: "Archived",  label: "Archived",  icon: Archive },
];

const STATUS_INDEX: Record<CampaignStatus, number> = {
  Draft: 0, Scheduled: 1, Sending: 2, Sent: 3, Archived: 4,
};

/** Which forward transitions are valid from a given status */
const VALID_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  Draft:     ["Scheduled"],
  Scheduled: ["Sending", "Sent", "Archived"],
  Sending:   ["Sent", "Archived"],
  Sent:      ["Archived"],
  Archived:  [],
};

/** Human-readable consequence for each transition */
function getConsequence(
  from: CampaignStatus,
  to: CampaignStatus,
  constituentCount: number,
  scheduledSends: number,
): { text: string; severity: "warning" | "danger" } {
  const r = constituentCount || 0;
  const s = scheduledSends || 0;

  if (to === "Archived") {
    if (from === "Scheduled")
      return { text: `Archiving will cancel ${s || r} scheduled send${(s || r) !== 1 ? "s" : ""} and move this campaign to the archive.`, severity: "danger" };
    if (from === "Sending")
      return { text: `Archiving will stop the current send in progress and move this campaign to the archive. Constituents who haven't received the message yet will not get it.`, severity: "danger" };
    return { text: "This campaign will be moved to the archive. It can be restored later.", severity: "warning" };
  }
  if (to === "Sent" && from === "Sending")
    return { text: "This will mark the campaign as fully sent. Any pending deliveries will continue in the background.", severity: "warning" };
  if (to === "Sent" && from === "Scheduled")
    return { text: `This will immediately send the campaign to ${r} constituent${r !== 1 ? "s" : ""}.`, severity: "warning" };
  if (to === "Sending" && from === "Scheduled")
    return { text: `This will begin sending to ${r} constituent${r !== 1 ? "s" : ""} right now instead of at the scheduled time.`, severity: "warning" };
  if (to === "Scheduled" && from === "Draft")
    return { text: "The campaign will be queued for send at the scheduled date & time.", severity: "warning" };

  return { text: `Status will change from ${from} to ${to}.`, severity: "warning" };
}

function getSpecialActionConsequence(
  action: "pause" | "cancel",
  constituentCount: number,
  scheduledSends: number,
): { text: string; severity: "warning" | "danger" } {
  if (action === "pause")
    return { text: `Pausing will hold ${scheduledSends || constituentCount} scheduled send${(scheduledSends || constituentCount) !== 1 ? "s" : ""}. The campaign will return to Draft status and can be rescheduled.`, severity: "warning" };
  return { text: `Cancelling will immediately stop the send in progress. ${constituentCount} remaining constituent${constituentCount !== 1 ? "s" : ""} will not receive the message. The campaign will return to Draft status.`, severity: "danger" };
}

/* ── Component ──────────────────────────────────────────────────────────────── */

export function StatusChangeModal({
  opened, onClose, currentStatus, constituentCount, scheduledSends = 0, onStatusChange,
}: StatusChangeModalProps) {
  const [confirmTarget, setConfirmTarget] = useState<CampaignStatus | null>(null);
  const [specialAction, setSpecialAction] = useState<"pause" | "cancel" | null>(null);

  const current = (currentStatus as CampaignStatus) || "Draft";
  const currentIdx = STATUS_INDEX[current] ?? 0;
  const validTargets = VALID_TRANSITIONS[current] ?? [];

  const handleClose = () => {
    setConfirmTarget(null);
    setSpecialAction(null);
    onClose();
  };

  const handleConfirm = () => {
    if (specialAction) {
      onStatusChange("Draft");
    } else if (confirmTarget) {
      onStatusChange(confirmTarget);
    }
    handleClose();
  };

  const handleBack = () => {
    setConfirmTarget(null);
    setSpecialAction(null);
  };

  const isConfirming = confirmTarget !== null || specialAction !== null;

  const consequence = confirmTarget
    ? getConsequence(current, confirmTarget, constituentCount, scheduledSends)
    : specialAction
      ? getSpecialActionConsequence(specialAction, constituentCount, scheduledSends)
      : null;

  const confirmLabel = confirmTarget
    ? `Change to ${confirmTarget}`
    : specialAction === "pause"
      ? "Pause Campaign"
      : "Cancel Send";

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Text fz={16} c={TV.textPrimary}>
          {isConfirming ? "Confirm Status Change" : "Change Campaign Status"}
        </Text>
      }
      centered
      size={420}
      radius="xl"
      styles={{
        header: { borderBottom: `1px solid ${TV.borderDivider}`, paddingBottom: 12 },
        body: { padding: "20px 24px 24px" },
      }}
    >
      {!isConfirming ? (
        <Stack gap={0}>
          {STEPS.map((step, idx) => {
            const isCurrent = step.status === current;
            const isPast = idx < currentIdx;
            const isValid = validTargets.includes(step.status);
            const isLast = idx === STEPS.length - 1;
            const Icon = step.icon;

            let dotBg = TV.borderLight;
            let dotBorder = TV.borderLight;
            let textColor = TV.textSecondary;
            let iconColor = TV.textSecondary;
            if (isCurrent) {
              dotBg = TV.brand;
              dotBorder = TV.brand;
              textColor = TV.textPrimary;
              iconColor = "#ffffff";
            } else if (isValid) {
              dotBg = "#ffffff";
              dotBorder = TV.brand;
              textColor = TV.textPrimary;
              iconColor = TV.brand;
            } else if (isPast) {
              dotBg = TV.surfaceMuted;
              dotBorder = TV.borderLight;
              textColor = TV.textSecondary;
              iconColor = TV.textSecondary;
            }

            const row = (
              <div
                key={step.status}
                className="flex items-start gap-4"
                style={{ position: "relative" }}
              >
                <div className="flex flex-col items-center" style={{ width: 32 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: dotBg,
                      border: `2px solid ${dotBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      cursor: isValid ? "pointer" : "default",
                      transition: "all 150ms ease",
                    }}
                    onClick={isValid ? () => setConfirmTarget(step.status) : undefined}
                    onMouseEnter={isValid ? (e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = TV.brandTint;
                      (e.currentTarget as HTMLDivElement).style.transform = "scale(1.1)";
                    } : undefined}
                    onMouseLeave={isValid ? (e) => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = dotBg;
                      (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
                    } : undefined}
                  >
                    <Icon size={14} color={iconColor} />
                  </div>
                  {!isLast && (
                    <div
                      style={{
                        width: 2,
                        height: 28,
                        backgroundColor: idx < currentIdx ? TV.border : TV.borderLight,
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>

                <div
                  className="flex-1 pt-[5px]"
                  style={{
                    cursor: isValid ? "pointer" : "default",
                    minHeight: isLast ? 32 : 60,
                  }}
                  onClick={isValid ? () => setConfirmTarget(step.status) : undefined}
                >
                  <Text fz={14} c={textColor} style={{ fontWeight: isCurrent ? 700 : isValid ? 600 : 400 }}>
                    {step.label}
                    {isCurrent && (
                      <span
                        className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px]"
                        style={{
                          fontWeight: 600,
                          backgroundColor: TV.brandTint,
                          color: TV.textBrand,
                        }}
                      >
                        Current
                      </span>
                    )}
                  </Text>
                  {isValid && (
                    <Text fz={11} c={TV.textSecondary} mt={2} style={{ fontWeight: 400 }}>
                      Click to transition
                    </Text>
                  )}
                </div>
              </div>
            );

            if (!isCurrent && !isValid) {
              const reason = isPast
                ? "This step has already been completed"
                : "Cannot transition here from the current status";
              return (
                <Tooltip key={step.status} label={reason} position="right" withArrow>
                  <div style={{ opacity: 0.5 }}>{row}</div>
                </Tooltip>
              );
            }

            return row;
          })}

          {(current === "Scheduled" || current === "Sending") && (
            <>
              <div
                style={{
                  height: 1,
                  backgroundColor: TV.borderDivider,
                  margin: "16px 0",
                }}
              />
              <Stack gap={8}>
                {current === "Scheduled" && (
                  <Button
                    variant="light"
                    color="yellow"
                    leftSection={<Pause size={14} />}
                    radius={8}
                    fullWidth
                    onClick={() => setSpecialAction("pause")}
                    styles={{
                      root: {
                        backgroundColor: TV.warningBg,
                        color: TV.warning,
                        border: `1px solid ${TV.warningBorder}`,
                        fontWeight: 600,
                        fontSize: 13,
                      },
                    }}
                  >
                    Pause Campaign
                  </Button>
                )}
                {current === "Sending" && (
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<XCircle size={14} />}
                    radius={8}
                    fullWidth
                    onClick={() => setSpecialAction("cancel")}
                    styles={{
                      root: {
                        backgroundColor: TV.dangerBg,
                        color: TV.danger,
                        border: `1px solid ${TV.dangerBorder}`,
                        fontWeight: 600,
                        fontSize: 13,
                      },
                    }}
                  >
                    Cancel Send
                  </Button>
                )}
              </Stack>
            </>
          )}
        </Stack>
      ) : (
        <Stack gap={16}>
          <button
            type="button"
            className="flex items-center gap-1 bg-transparent border-0 p-0 cursor-pointer"
            style={{ color: TV.textSecondary, fontSize: 13, fontWeight: 500 }}
            onClick={handleBack}
          >
            <ArrowLeft size={14} />
            Back
          </button>

          {consequence && (
            <div
              className="flex items-start gap-3 p-3 rounded-sm"
              style={{
                backgroundColor: consequence.severity === "danger" ? TV.dangerBg : TV.warningBg,
                border: `1px solid ${consequence.severity === "danger" ? TV.dangerBorder : TV.warningBorder}`,
              }}
            >
              <TriangleAlert
                size={16}
                className="flex-shrink-0 mt-0.5"
                color={consequence.severity === "danger" ? TV.danger : TV.warning}
              />
              <Text fz={13} c={consequence.severity === "danger" ? TV.danger : TV.warning} style={{ fontWeight: 500 }}>
                {consequence.text}
              </Text>
            </div>
          )}

          <div
            className="flex items-center gap-3 p-3 rounded-sm"
            style={{ backgroundColor: TV.surface }}
          >
            <div className="flex items-center gap-2 flex-1">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px]"
                style={{
                  fontWeight: 600,
                  backgroundColor:
                    current === "Draft" ? TV.brandTint
                    : current === "Scheduled" ? TV.infoBg
                    : current === "Sending" ? TV.warningBg
                    : current === "Sent" ? TV.successBg
                    : TV.surfaceMuted,
                  color:
                    current === "Draft" ? TV.textBrand
                    : current === "Scheduled" ? TV.info
                    : current === "Sending" ? TV.warning
                    : current === "Sent" ? TV.success
                    : TV.textSecondary,
                }}
              >
                {current}
              </span>
              <span style={{ color: TV.textSecondary, fontSize: 16 }}>{"\u2192"}</span>
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px]"
                style={{
                  fontWeight: 600,
                  backgroundColor:
                    (confirmTarget ?? "Draft") === "Draft" ? TV.brandTint
                    : (confirmTarget ?? "Draft") === "Scheduled" ? TV.infoBg
                    : (confirmTarget ?? "Draft") === "Sending" ? TV.warningBg
                    : (confirmTarget ?? "Draft") === "Sent" ? TV.successBg
                    : (confirmTarget ?? "Draft") === "Archived" ? TV.surfaceMuted
                    : TV.surfaceMuted,
                  color:
                    (confirmTarget ?? "Draft") === "Draft" ? TV.textBrand
                    : (confirmTarget ?? "Draft") === "Scheduled" ? TV.info
                    : (confirmTarget ?? "Draft") === "Sending" ? TV.warning
                    : (confirmTarget ?? "Draft") === "Sent" ? TV.success
                    : TV.textSecondary,
                }}
              >
                {specialAction === "pause" ? "Draft (Paused)" : specialAction === "cancel" ? "Draft (Cancelled)" : confirmTarget}
              </span>
            </div>
          </div>

          <Group justify="flex-end" gap={8} mt={4}>
            <Button
              variant="default"
              radius={8}
              onClick={handleBack}
              styles={{ root: { fontWeight: 600, fontSize: 13, borderColor: TV.borderLight } }}
            >
              Cancel
            </Button>
            <Button
              radius={8}
              onClick={handleConfirm}
              styles={{
                root: {
                  fontWeight: 600,
                  fontSize: 13,
                  backgroundColor:
                    (consequence?.severity === "danger") ? TV.danger : TV.brand,
                  color: "#ffffff",
                },
              }}
            >
              {confirmLabel}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
