import { MantineProvider } from "@mantine/core";
import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ToastProvider } from "./contexts/ToastContext";
import { TemplateProvider } from "./contexts/TemplateContext";
import { DesignLibraryProvider } from "./contexts/DesignLibraryContext";
import { thankviewTheme } from "./theme";
import "@mantine/core/styles.css";

// ThankView Dashboard – Mantine v8 + React Router
export default function App() {
  // WCAG 3.1.1: Ensure language of page is set
  if (typeof document !== "undefined" && document.documentElement && !document.documentElement.lang) {
    document.documentElement.lang = "en";
  }

  return (
    <MantineProvider
      theme={thankviewTheme}
      forceColorScheme="light"
    >
      <ToastProvider>
        <DesignLibraryProvider>
          <TemplateProvider>
            <RouterProvider router={router} />
          </TemplateProvider>
        </DesignLibraryProvider>
      </ToastProvider>
    </MantineProvider>
  );
}
