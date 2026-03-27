/**
 * Shared Image Upload Modal — used across the asset area for uploading images,
 * logos, and thumbnails. Supports drag-and-drop, file browse, and URL import.
 *
 * Since there's no real backend, local files are previewed via URL.createObjectURL()
 * and URL imports are validated with an <img> probe.
 *
 * Uses Mantine Modal for consistent z-indexing, focus trapping, and visual
 * treatment (20px radius, centered, branded header) matching the rest of the app.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Modal, Text, Box, Button, FocusTrap } from "@mantine/core";
import {
  Upload, Link2, X, Image as ImageIcon, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { TV } from "../../theme";

// ── Types ────────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  name: string;
  size: string;
  dimensions: string;
}

export interface ImageUploadModalProps {
  opened: boolean;
  onClose: () => void;
  onUpload: (result: UploadResult) => void;
  /** Title shown at top of modal */
  title?: string;
  /** Subtitle / description */
  subtitle?: string;
  /** Accepted mime types, e.g. "image/png,image/jpeg" */
  accept?: string;
  /** Max file size in KB. Default 2048. */
  maxSizeKB?: number;
}

type TabKey = "file" | "url";

// ── Utilities ────────────────────────────────────────────────────────────────

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function loadImageDims(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = src;
  });
}

const TABS: { key: TabKey; icon: typeof Upload; label: string }[] = [
  { key: "file", icon: Upload, label: "Upload File" },
  { key: "url",  icon: Link2, label: "From URL" },
];

// ── Component ────────────────────────────────────────────────────────────────

export function ImageUploadModal({
  opened,
  onClose,
  onUpload,
  title = "Upload Image",
  subtitle = "Drag and drop an image, browse your files, or paste a URL.",
  accept = "image/png,image/jpeg,image/gif,image/svg+xml,image/webp",
  maxSizeKB = 2048,
}: ImageUploadModalProps) {
  const [tab, setTab] = useState<TabKey>("file");
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [fileDims, setFileDims] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [urlLoading, setUrlLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset all state when modal closes
  useEffect(() => {
    if (!opened) {
      setTab("file");
      setDragOver(false);
      setPreview(null);
      setFileName("");
      setFileSize("");
      setFileDims("");
      setUrlInput("");
      setUrlError(null);
      setUrlLoading(false);
      setFileError(null);
    }
  }, [opened]);

  // ── File processing ──────────────────────────────────────────────────────

  const processFile = useCallback(async (file: File) => {
    setFileError(null);

    const validTypes = accept.split(",").map(t => t.trim());
    if (!validTypes.some(t => file.type === t || t === "*")) {
      setFileError(`Unsupported file type. Accepted: ${validTypes.map(t => t.replace("image/", ".")).join(", ")}`);
      return;
    }

    if (file.size > maxSizeKB * 1024) {
      setFileError(`File too large (${formatSize(file.size)}). Maximum: ${formatSize(maxSizeKB * 1024)}.`);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const dims = await loadImageDims(objectUrl);
    setPreview(objectUrl);
    setFileName(file.name);
    setFileSize(formatSize(file.size));
    setFileDims(dims.w > 0 ? `${dims.w} × ${dims.h}` : "Unknown");
  }, [accept, maxSizeKB]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }, [processFile]);

  // ── URL import ───────────────────────────────────────────────────────────

  const handleUrlImport = useCallback(async () => {
    if (!urlInput.trim()) { setUrlError("Please enter a URL."); return; }

    let url = urlInput.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }

    setUrlLoading(true);
    setUrlError(null);

    try {
      const dims = await loadImageDims(url);
      if (dims.w === 0) {
        setUrlError("Could not load image from this URL. Please check the link.");
        setUrlLoading(false);
        return;
      }
      setPreview(url);
      const segments = url.split("/").filter(Boolean);
      const rawName = segments[segments.length - 1]?.split("?")[0] || "imported_image";
      setFileName(rawName.length > 40 ? rawName.slice(0, 37) + "..." : rawName);
      setFileSize("—");
      setFileDims(`${dims.w} × ${dims.h}`);
    } catch (_e) {
      setUrlError("Failed to load image. Please check the URL.");
    } finally {
      setUrlLoading(false);
    }
  }, [urlInput]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleConfirm = () => {
    if (!preview) return;
    onUpload({ url: preview, name: fileName, size: fileSize, dimensions: fileDims });
    onClose();
  };

  const clearPreview = () => {
    if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    setPreview(null);
    setFileName("");
    setFileSize("");
    setFileDims("");
    setFileError(null);
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="lg"
      title={
        <div className="flex items-center gap-3">
          <Box
            w={36} h={36}
            style={{
              borderRadius: 10,
              backgroundColor: TV.brandTint,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Upload size={16} style={{ color: TV.brand }} />
          </Box>
          <div>
            <Text fz={15} fw={700} c={TV.textPrimary}>{title}</Text>
            <Text fz={11} c={TV.textSecondary}>{subtitle}</Text>
          </div>
        </div>
      }
      styles={{
        title: { flex: 1 },
        body: { padding: 0 },
      }}
    >
      <FocusTrap active>
      {/* ── Tab switcher (hidden when previewing) ─────────────────────────── */}
      {!preview && (
        <div className="flex px-6 pt-4 gap-0" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setFileError(null); setUrlError(null); }}
              className="flex items-center gap-1.5 px-3 pb-3 text-[12px] relative"
              style={{
                fontWeight: tab === t.key ? 600 : 400,
                color: tab === t.key ? TV.brand : TV.textSecondary,
              }}
            >
              <t.icon size={12} />
              {t.label}
              {tab === t.key && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t"
                  style={{ backgroundColor: TV.brand }}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      <div className="px-6 py-5">

        {/* File tab — drag-and-drop zone */}
        {!preview && tab === "file" && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); inputRef.current?.click(); } }}
            role="button"
            tabIndex={0}
            aria-label="Upload image by clicking or pressing Enter"
            className="flex flex-col items-center justify-center gap-3 rounded-[12px] border-2 border-dashed py-12 cursor-pointer transition-all focus:ring-2 focus:ring-tv-brand/40 focus:outline-none"
            style={{
              borderColor: dragOver ? TV.brand : TV.borderLight,
              backgroundColor: dragOver ? TV.brandTint : TV.surface,
            }}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleFileInput}
              className="hidden"
            />
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: dragOver ? TV.brand : TV.borderLight }}
            >
              <Upload size={20} style={{ color: dragOver ? "white" : TV.textSecondary }} />
            </div>
            <div className="text-center">
              <Text fz={13} fw={600} c={TV.textPrimary}>
                {dragOver ? "Drop to upload" : "Drag & drop your image here"}
              </Text>
              <Text fz={11} c={TV.textSecondary} mt={4}>
                or <span style={{ color: TV.brand, fontWeight: 600 }}>browse files</span> · PNG, JPG, SVG, WebP · Max {formatSize(maxSizeKB * 1024)}
              </Text>
            </div>
          </div>
        )}

        {/* File error */}
        {!preview && fileError && tab === "file" && (
          <ErrorBanner message={fileError} />
        )}

        {/* URL tab */}
        {!preview && tab === "url" && (
          <div className="space-y-3">
            <div>
              <Text fz={11} fw={600} c={TV.textLabel} mb={6}>Image URL</Text>
              <div className="flex gap-2">
                <div
                  className="flex-1 flex items-center gap-2 border rounded-md px-3 py-2"
                  style={{ borderColor: urlError ? TV.danger : TV.borderLight }}
                >
                  <Link2 size={13} style={{ color: TV.textSecondary }} className="shrink-0" />
                  <input
                    value={urlInput}
                    onChange={e => { setUrlInput(e.target.value); setUrlError(null); }}
                    onKeyDown={e => e.key === "Enter" && handleUrlImport()}
                    placeholder="https://example.com/image.png"
                    aria-label="Image URL"
                    aria-invalid={urlError ? true : undefined}
                    aria-describedby={urlError ? "image-url-error" : undefined}
                    className="flex-1 text-[13px] outline-none bg-transparent"
                    style={{ color: TV.textPrimary }}
                  />
                </div>
                <button
                  onClick={handleUrlImport}
                  disabled={urlLoading}
                  className="px-4 rounded-md text-[12px] font-semibold text-white transition-colors shrink-0 flex items-center gap-1.5"
                  style={{ backgroundColor: urlLoading ? TV.borderStrong : TV.brandBg }}
                >
                  {urlLoading ? <Loader2 size={13} className="animate-spin" /> : <ImageIcon size={13} />}
                  {urlLoading ? "Loading…" : "Import"}
                </button>
              </div>
            </div>
            {urlError && <ErrorBanner message={urlError} id="image-url-error" />}
            <Text fz={10} c={TV.textSecondary}>
              Paste a direct link to a publicly accessible image file. The image must be served over HTTPS.
            </Text>
          </div>
        )}

        {/* Preview state */}
        {preview && (
          <div className="space-y-4">
            {/* Image preview */}
            <div
              className="relative rounded-lg overflow-hidden"
              style={{ backgroundColor: TV.surface, border: `1px solid ${TV.borderLight}` }}
            >
              <img
                src={preview}
                alt="Uploaded image preview"
                className="w-full max-h-[240px] object-contain"
                style={{ minHeight: 120 }}
              />
              <button
                onClick={clearPreview}
                aria-label="Remove image"
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
              >
                <X size={13} />
              </button>
            </div>

            {/* File info badge */}
            <div
              className="flex items-center gap-3 rounded-md px-3 py-2.5"
              style={{ backgroundColor: TV.surface, border: `1px solid ${TV.borderDivider}` }}
            >
              <CheckCircle2 size={16} style={{ color: TV.success }} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <Text fz={12} fw={600} c={TV.textPrimary} truncate>{fileName}</Text>
                <Text fz={10} c={TV.textSecondary}>{fileDims} · {fileSize}</Text>
              </div>
            </div>

            {/* Editable display name */}
            <div>
              <Text fz={11} fw={600} c={TV.textLabel} mb={6}>Display Name</Text>
              <input
                value={fileName}
                onChange={e => setFileName(e.target.value)}
                className="w-full border rounded-md px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-tv-brand-bg/30 focus:border-tv-brand-bg"
                style={{ borderColor: TV.borderLight, color: TV.textPrimary }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderTop: `1px solid ${TV.borderDivider}` }}
      >
        <Button variant="outline" color="red" onClick={onClose}>
          Cancel
        </Button>
        <Button
          color="tvPurple"
          onClick={handleConfirm}
          disabled={!preview}
          leftSection={<CheckCircle2 size={13} />}
        >
          Confirm Upload
        </Button>
      </div>
      </FocusTrap>
    </Modal>
  );
}

// ── Shared sub-component ─────────────────────────────────────────────────────

function ErrorBanner({ message, id }: { message: string; id?: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-sm px-3 py-2 mt-3"
      style={{ backgroundColor: TV.dangerBg, border: `1px solid ${TV.dangerBorder}` }}
      role="alert"
      id={id}
    >
      <AlertCircle size={13} style={{ color: TV.danger }} className="shrink-0 mt-0.5" />
      <Text fz={11} c={TV.danger}>{message}</Text>
    </div>
  );
}