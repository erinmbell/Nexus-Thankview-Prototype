/**
 * VideoProfile — Page at /videos/:id
 *
 * Thin wrapper: looks up the video from INITIAL_VIDEOS and renders the
 * shared VideoEditor component (same one used after recording/uploading).
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router";
import { Box, Text, Title, Button } from "@mantine/core";
import { TV } from "../theme";
import { useToast } from "../contexts/ToastContext";
import { VideoEditor, type VideoEditorData } from "../../imports/VideoEditor";
import {
  type VideoItem,
  INITIAL_VIDEOS,
} from "../data/videos";
import { fmtSec } from "../utils";
import { Breadcrumbs } from "../components/Breadcrumbs";

// ══════════════════════════════════════════════════════════════════════════════
export function VideoProfile() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { show } = useToast();

  const initial = INITIAL_VIDEOS.find(v => v.id === Number(id));
  const [video, setVideo] = useState<VideoItem | null>(initial ?? null);

  // Escape key → navigate back to Videos
  const goBack = useCallback(() => navigate("/videos"), [navigate]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Escape") { e.preventDefault(); goBack(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack]);

  if (!video) {
    return (
      <Box p="xl" className="text-center">
        <Title order={3} c={TV.textPrimary} mb="sm">Video not found</Title>
        <Text c={TV.textSecondary} mb="lg">This video doesn't exist or has been deleted.</Text>
        <Button variant="default" onClick={() => navigate("/videos")}>Back to Videos</Button>
      </Box>
    );
  }

  const videoTypeLabel = video.videoType === "campaign" ? "Campaign Video" : "Shared Video";

  const handleSave = (data: VideoEditorData) => {
    // Persist edits back into local state
    const trimmedDur = data.trimEnd - data.trimStart;
    setVideo(prev => prev ? {
      ...prev,
      title: data.name,
      description: data.description,
      recipient: data.recipientName,
      folder: data.folder,
      tags: data.tags,
      rotation: data.rotation as 0 | 90 | 180 | 270,
      crop: data.cropArea ? { x: data.cropArea.x, y: data.cropArea.y, width: data.cropArea.w, height: data.cropArea.h } : null,
      trimStart: data.trimStart,
      trimEnd: data.trimEnd,
      isTrimmed: data.isTrimmed,
      durationSec: trimmedDur,
      duration: fmtSec(trimmedDur),
      thumbnailImage: data.thumbnailUrl,
      thumbnailSaved: !!data.thumbnailUrl,
      captions: data.captions,
    } : prev);
    show("Video saved!", "success");
  };

  const handleDelete = () => {
    show(`"${video.title}" deleted`, "success");
    setTimeout(() => navigate("/videos"), 400);
  };

  const handleCancel = () => {
    navigate("/videos");
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Breadcrumb */}
      <div
        className="px-4 py-2 flex items-center gap-1.5 shrink-0"
        style={{ borderBottom: `1px solid ${TV.borderLight}`, backgroundColor: "white" }}
      >
        <Breadcrumbs items={[
          { label: "Home", href: "/" },
          { label: "Videos", href: "/videos" },
          { label: video.title },
        ]} maxLastWidth={300} />
      </div>

      {/* Video Editor — fills the remaining space */}
      <div className="flex-1 min-h-0">
        <VideoEditor
          initialName={video.title}
          initialDuration={video.duration}
          videoType={videoTypeLabel}
          recipientName={video.recipient}
          canDelete
          initialData={{
            tags: video.tags,
            description: video.description,
            folder: video.folder,
            rotation: video.rotation,
            trimStart: video.trimStart,
            trimEnd: video.trimEnd,
            isTrimmed: video.isTrimmed,
            cropArea: video.crop ? { x: video.crop.x, y: video.crop.y, w: video.crop.width, h: video.crop.height } : null,
            captions: video.captions,
            thumbnailUrl: video.thumbnailImage ?? null,
          }}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}