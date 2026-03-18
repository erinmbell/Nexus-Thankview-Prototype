import { useNavigate } from "react-router";
import { Button, Title, Text, Stack, Box } from "@mantine/core";
import { Home, ArrowLeft } from "lucide-react";
import { TV } from "../theme";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <Box className="flex items-center justify-center h-full" p="xl">
      <Stack align="center" gap="lg" maw={440} ta="center">
        <Box
          w={96} h={96}
          className="rounded-full flex items-center justify-center"
          style={{ backgroundColor: TV.surface, border: `2px solid ${TV.borderLight}` }}
        >
          <Text fz={48} fw={900} c={TV.textBrand} className="font-display" style={{ lineHeight: 1 }}>
            404
          </Text>
        </Box>

        <div>
          <Title order={2} fz={26} mb={8}>
            Page not found
          </Title>
          <Text fz={14} c={TV.textSecondary} maw={360} mx="auto">
            The page you're looking for doesn't exist or may have been moved.
            Check the URL or head back to your dashboard.
          </Text>
        </div>

        <Box className="flex items-center gap-3">
          <Button
            variant="default"
            leftSection={<ArrowLeft size={14} />}
            onClick={() => navigate(-1)}
            radius="xl"
          >
            Go back
          </Button>
          <Button
            color="tvPurple"
            leftSection={<Home size={14} />}
            onClick={() => navigate("/")}
            radius="xl"
          >
            Dashboard
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}