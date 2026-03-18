/**
 * SharedVideoRecorder — Thin wrapper around VideoRecorder for the
 * "Shared Video" flow. Routes to VideoEditorView when editing.
 */
import { useState, useCallback } from "react";
import { Users } from "lucide-react";
import { VideoRecorder, type VideoRecorderResult } from "./VideoRecorder";
import { VideoEditorView } from "./VideoEditorView";
import { type PickerVideo } from "./types";

export interface SharedVideoRecorderProps {
  onBack: () => void;
  onComplete: (video: PickerVideo) => void;
  onOpenLibrary?: () => void;
}

export function SharedVideoRecorder({
  onBack,
  onComplete,
  onOpenLibrary,
}: SharedVideoRecorderProps) {
  const [editorVideo, setEditorVideo] = useState<PickerVideo | null>(null);

  const handleEditVideo = useCallback((video: PickerVideo) => {
    setEditorVideo(video);
  }, []);

  const handleEditorSave = useCallback((v: PickerVideo) => {
    setEditorVideo(null);
    onComplete(v);
  }, [onComplete]);

  const handleEditorCancel = useCallback(() => {
    setEditorVideo(null);
  }, []);

  const handleRecorderComplete = useCallback((result: VideoRecorderResult) => {
    setEditorVideo(result.video);
  }, []);

  if (editorVideo) {
    return (
      <VideoEditorView
        video={editorVideo}
        onCancel={handleEditorCancel}
        onSave={handleEditorSave}
      />
    );
  }

  return (
    <VideoRecorder
      title="Shared Video for All Recipients"
      subtitle="This clip will appear in every recipient's final video."
      badgeLabel="Same video for everyone"
      badgeIcon={Users}
      contextLabel="Shared Video"
      contextSublabel="Same for all recipients"
      contextIcon={<Users size={10} />}
      maxDuration={120}
      onComplete={handleRecorderComplete}
      onCancel={onBack}
      onOpenLibrary={onOpenLibrary}
      onEditVideo={handleEditVideo}
    />
  );
}
