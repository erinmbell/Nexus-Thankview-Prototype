import { useState, useCallback } from "react";
import { Video, Check } from "lucide-react";
import { RecordingStudio } from "./RecordingStudio";

export function VRRecorderPanel() {
  const [recorded, setRecorded] = useState(false);
  const [duration, setDuration] = useState("");

  const handleComplete = useCallback((result: { duration: string; seconds: number }) => {
    setRecorded(true);
    setDuration(result.duration);
  }, []);

  if (recorded) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-8">
        <div className="w-16 h-16 rounded-xl bg-tv-success-bg flex items-center justify-center mb-4">
          <Check size={28} className="text-tv-success" />
        </div>
        <h3 className="text-[18px] text-tv-text-primary mb-2" style={{ fontWeight: 700 }}>Recording Complete</h3>
        <p className="text-[13px] text-tv-text-secondary text-center max-w-md">
          Your video request recording ({duration}) has been saved.
        </p>
        <button
          onClick={() => setRecorded(false)}
          className="mt-4 px-5 py-2 text-[13px] font-semibold text-tv-brand border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors"
        >
          Record Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-8 px-8">
      <div className="w-full max-w-[720px]">
        <div className="text-center mb-6">
          <h3 className="text-[18px] text-tv-text-primary mb-2" style={{ fontWeight: 700 }}>Video Request Recorder</h3>
          <p className="text-[13px] text-tv-text-secondary max-w-md mx-auto">
            Record a video request for constituents to submit personalized thank-you videos.
          </p>
        </div>
        <RecordingStudio
          contextLabel="Video Request"
          onRecordingComplete={handleComplete}
          onClose={() => {}}
          maxDuration={120}
        />
      </div>
    </div>
  );
}
