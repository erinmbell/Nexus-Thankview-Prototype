import { TriangleAlert } from "lucide-react";
import { Modal, Button, Text, Title, Box, FocusTrap } from "@mantine/core";
import { TV } from "../../theme";

interface DeleteModalProps {
  opened: boolean;
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteModal({ opened, title, description, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onCancel}
      withCloseButton={false}
      size={420}
      padding="lg"
      title={title}
      aria-label={title}
      styles={{ title: { display: "none" } }}
    >
      <FocusTrap active>
        <div className="flex items-start gap-4 mb-6" style={{ flexWrap: "nowrap" }}>
          <Box
            w={44} h={44}
            style={{ borderRadius: "50%", backgroundColor: TV.dangerBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            <TriangleAlert size={20} style={{ color: TV.danger }} />
          </Box>
          <div style={{ flex: 1 }}>
            <Title order={3} fz={16} mb={4}>{title}</Title>
            <Text fz={13} c={TV.textSecondary}>
              {description ?? "This action cannot be undone."}
            </Text>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" color="red" onClick={onCancel}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </FocusTrap>
    </Modal>
  );
}