import { FileText } from "lucide-react";

export function EndowmentReportsPanel() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <div className="w-16 h-16 rounded-xl bg-tv-brand-tint flex items-center justify-center mb-4">
        <FileText size={28} className="text-tv-brand" />
      </div>
      <h3 className="text-[18px] text-tv-text-primary mb-2" style={{ fontWeight: 700 }}>ODDER Reports</h3>
      <p className="text-[13px] text-tv-text-secondary text-center max-w-md">
        Online Donor Directed Endowment Reports will be available here. This feature is coming soon.
      </p>
    </div>
  );
}
