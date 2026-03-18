/**
 * DesignLibraryContext — stub for LivePreviewPanel
 * Provides design library data (logos, headers, footers, etc.)
 */
import { createContext, useContext, useState, type ReactNode } from "react";

export interface DesignAsset {
  id: string;
  name: string;
  url: string;
  type: "logo" | "header" | "footer" | "background";
  category?: string;
}

export interface CustomEnvelope {
  id: string;
  name: string;
  color: string;
  textColor: string;
  thumbnail?: string;
}

export interface CustomLandingPage {
  id: string;
  name: string;
  thumbnail?: string;
}

interface DesignLibraryContextValue {
  assets: DesignAsset[];
  logos: DesignAsset[];
  headers: DesignAsset[];
  footers: DesignAsset[];
  backgrounds: DesignAsset[];
  customEnvelopes: CustomEnvelope[];
  customLandingPages: CustomLandingPage[];
  loading: boolean;
  refresh: () => void;
}

const MOCK_ASSETS: DesignAsset[] = [
  { id: "logo-1", name: "Primary Logo", url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=80&fit=crop", type: "logo" },
  { id: "logo-2", name: "Secondary Logo", url: "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200&h=80&fit=crop", type: "logo" },
  { id: "header-1", name: "Default Header", url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&h=200&fit=crop", type: "header" },
  { id: "footer-1", name: "Default Footer", url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&h=100&fit=crop", type: "footer" },
  { id: "bg-1", name: "Blue Gradient", url: "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=600&h=400&fit=crop", type: "background" },
];

const DesignLibraryContext = createContext<DesignLibraryContextValue>({
  assets: MOCK_ASSETS,
  logos: MOCK_ASSETS.filter((a) => a.type === "logo"),
  headers: MOCK_ASSETS.filter((a) => a.type === "header"),
  footers: MOCK_ASSETS.filter((a) => a.type === "footer"),
  backgrounds: MOCK_ASSETS.filter((a) => a.type === "background"),
  customEnvelopes: [],
  customLandingPages: [],
  loading: false,
  refresh: () => {},
});

export function DesignLibraryProvider({ children }: { children: ReactNode }) {
  const [assets] = useState(MOCK_ASSETS);
  const [loading] = useState(false);

  const value: DesignLibraryContextValue = {
    assets,
    logos: assets.filter((a) => a.type === "logo"),
    headers: assets.filter((a) => a.type === "header"),
    footers: assets.filter((a) => a.type === "footer"),
    backgrounds: assets.filter((a) => a.type === "background"),
    customEnvelopes: [],
    customLandingPages: [],
    loading,
    refresh: () => {},
  };

  return <DesignLibraryContext.Provider value={value}>{children}</DesignLibraryContext.Provider>;
}

export function useDesignLibrary() {
  return useContext(DesignLibraryContext);
}
