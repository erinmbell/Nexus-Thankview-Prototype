import { useNavigate } from "react-router";
import { PersonalizedRecorder } from "./PersonalizedRecorder";

export function PersonalizedRecorderPage() {
  const navigate = useNavigate();
  return (
    <PersonalizedRecorder
      onBack={() => navigate("/videos")}
      onRecordingAdded={() => {}}
      onDone={() => navigate("/videos")}
    />
  );
}