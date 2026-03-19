import { useState } from "react";
import {
  Check, CheckCheck, Video, Calendar, UserPlus, Mail, BarChart3,
  AlertCircle, Bell, X, FileDown, AlertTriangle,
} from "lucide-react";
import {
  Box, Stack, Text, Badge, ActionIcon, UnstyledButton,
  ScrollArea, Avatar, Tooltip,
} from "@mantine/core";
import { TV } from "../theme";

// ── Types ────────────────────────────────────────────────────────────────────
export interface Notification {
  id: string;
  type: "reply" | "scheduled" | "contact" | "campaign" | "metric" | "system" | "video_processed" | "delivery_failure" | "export_ready";
  title: string;
  description: string;
  time: string;
  read: boolean;
  avatar?: string;
  avatarColor?: string;
}

// ── Mock data ────────────────────────────────────────────────────────────────
const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "reply",     title: "Sarah Chen replied to your video",      description: "\"Thank you so much for the personalized message! This means…\"", time: "12 min ago", read: false, avatar: "SC", avatarColor: "#3b82f6" },
  { id: "n2", type: "scheduled", title: "Campaign scheduled for Feb 28",          description: "\"Spring Giving 2026\" will begin sending at 9:00 AM EST.",      time: "1 hr ago",   read: false, avatarColor: "#7c45b0" },
  { id: "n3", type: "contact",   title: "New constituent added",                      description: "Marcus Rivera was added to the \"Major Donors\" list via CSV import.", time: "3 hrs ago", read: false, avatar: "MR", avatarColor: "#10b981" },
  { id: "n7", type: "video_processed", title: "Video finished processing",        description: "\"Spring Thank You — Shaylee O'Keefe\" is ready for review.",      time: "4 hrs ago",  read: false, avatarColor: "#7c45b0" },
  { id: "n8", type: "delivery_failure", title: "3 messages failed to deliver",    description: "Bounced emails detected in \"Board Outreach\" campaign. Review recipients.", time: "5 hrs ago", read: false, avatarColor: "#dc2626" },
  { id: "n4", type: "campaign",  title: "\"Alumni Thank You\" completed",         description: "Campaign finished sending to all 1,247 recipients. Open rate: 68%.", time: "Yesterday", read: true, avatarColor: "#7c45b0" },
  { id: "n9", type: "export_ready", title: "Constituent export ready",               description: "Your CSV export of 2,847 constituents is ready to download.",       time: "Yesterday", read: true, avatarColor: "#0e7490" },
  { id: "n5", type: "metric",    title: "Weekly metrics summary ready",           description: "Your ThankView performance report for Feb 17–23 is available.",       time: "Yesterday", read: true, avatarColor: "#f59e0b" },
  { id: "n6", type: "system",    title: "System maintenance completed",           description: "All services have been restored. No action needed.",                  time: "2 days ago", read: true, avatarColor: "#6b7280" },
];

// ── Icon map ─────────────────────────────────────────────────────────────────
function NotifIcon({ type }: { type: Notification["type"] }) {
  const size = 14;
  const cls = "text-white";
  switch (type) {
    case "reply":             return <Video size={size} className={cls} />;
    case "scheduled":         return <Calendar size={size} className={cls} />;
    case "contact":           return <UserPlus size={size} className={cls} />;
    case "campaign":          return <Mail size={size} className={cls} />;
    case "metric":            return <BarChart3 size={size} className={cls} />;
    case "system":            return <AlertCircle size={size} className={cls} />;
    case "video_processed":   return <Video size={size} className={cls} />;
    case "delivery_failure":  return <AlertTriangle size={size} className={cls} />;
    case "export_ready":      return <FileDown size={size} className={cls} />;
  }
}

// ── Panel component ──────────────────────────────────────────────────────────
interface Props { onClose: () => void }

export function NotificationsPanel({ onClose }: Props) {
  const [items, setItems] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const unreadCount = items.filter(n => !n.read).length;
  const displayed = filter === "unread" ? items.filter(n => !n.read) : items;

  const markOne = (id: string) => setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  const markAll = () => setItems(prev => prev.map(n => ({ ...n, read: true })));

  return (
    <>
      <Box className="fixed inset-0 z-30" onClick={onClose} aria-hidden="true" />

      <Box
        className="absolute right-0 top-full mt-2 z-40 flex flex-col overflow-hidden"
        w={380}
        maw="calc(100vw - 24px)"
        bg="white"
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        tabIndex={-1}
        onKeyDown={(e: React.KeyboardEvent) => { if (e.key === "Escape") onClose(); }}
        style={{ borderRadius: 20, border: `1px solid ${TV.borderLight}`, boxShadow: TV.shadowModal, maxHeight: "min(520px, calc(100vh - 80px))" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 shrink-0" style={{ borderBottom: `1px solid ${TV.borderDivider}`, backgroundColor: TV.surfaceMuted }}>
          <div className="flex items-center gap-2">
            <Bell size={15} style={{ color: TV.textBrand }} />
            <Text fz={14} fw={600} c={TV.textPrimary}>Notifications</Text>
            {unreadCount > 0 && <Badge size="sm" color="tvPurple" variant="filled" radius="xl">{unreadCount}</Badge>}
          </div>
          <ActionIcon variant="subtle" size={24} radius="xl" color="gray" onClick={onClose} aria-label="Close notifications">
            <X size={12} aria-hidden="true" />
          </ActionIcon>
        </div>

        {/* Tabs + mark-all */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <div className="flex items-center gap-1">
            {(["all", "unread"] as const).map(tab => (
              <UnstyledButton
                key={tab}
                onClick={() => setFilter(tab)}
                px={12}
                py={4}
                style={{
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: filter === tab ? 600 : 400,
                  backgroundColor: filter === tab ? TV.brandTint : "transparent",
                  color: filter === tab ? TV.textBrand : TV.textSecondary,
                  border: filter === tab ? `1px solid ${TV.border}` : "1px solid transparent",
                }}
              >
                {tab === "all" ? "All" : `Unread (${unreadCount})`}
              </UnstyledButton>
            ))}
          </div>
          {unreadCount > 0 && (
            <UnstyledButton onClick={markAll} className="flex items-center gap-1 hover:text-tv-brand-hover transition-colors" style={{ fontSize: 12, fontWeight: 500, color: TV.textBrand }}>
              <CheckCheck size={12} />Mark all read
            </UnstyledButton>
          )}
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          {displayed.length === 0 ? (
            <Stack align="center" justify="center" py={40} gap={8}>
              <Avatar size={40} radius="xl" color="tvPurple" variant="light"><Check size={18} /></Avatar>
              <Text fz={13} c={TV.textSecondary} fw={500}>You're all caught up!</Text>
            </Stack>
          ) : (
            displayed.map(n => (
              <Box
                key={n.id}
                className="flex gap-3 cursor-default group"
                px="md"
                py="sm"
                bg={n.read ? "white" : "#faf7ff"}
                style={{ borderBottom: `1px solid ${TV.borderDivider}`, transition: "background .15s" }}
              >
                <Avatar size={32} radius="xl" color={n.avatarColor ?? TV.textBrand} className="shrink-0 mt-0.5" styles={{ root: { backgroundColor: n.avatarColor ?? TV.textBrand } }}>
                  {n.avatar ? <Text fz={10} fw={700} c="white">{n.avatar}</Text> : <NotifIcon type={n.type} />}
                </Avatar>

                <Box className="flex-1 min-w-0">
                  <Text fz={13} lh="18px" c={n.read ? TV.textLabel : TV.textPrimary} fw={n.read ? 400 : 500}>{n.title}</Text>
                  <Text fz={12} c={TV.textSecondary} lh="17px" mt={2} lineClamp={2}>{n.description}</Text>
                  <Text fz={11} c={TV.textDecorative} mt={4}>{n.time}</Text>
                </Box>

                {!n.read && (
                  <Tooltip label="Mark as read" withArrow position="left">
                    <ActionIcon
                      variant="subtle" size={24} radius="xl" color="tvPurple"
                      onClick={() => markOne(n.id)}
                      className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    >
                      <Check size={13} />
                    </ActionIcon>
                  </Tooltip>
                )}
                {!n.read && <Box w={8} h={8} className="rounded-full shrink-0 mt-2" style={{ backgroundColor: TV.textBrand }} />}
              </Box>
            ))
          )}
        </ScrollArea>
      </Box>
    </>
  );
}