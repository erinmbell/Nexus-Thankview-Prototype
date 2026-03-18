/**
 * SaveChangesModal — Shown when a user tries to navigate away from a step
 * that has unsaved changes. Offers "Save & Continue" (autosave + navigate)
 * or "Stay" (cancel navigation).
 */
import { Save, ArrowLeft } from "lucide-react";

interface SaveChangesModalProps {
  /** The label of the step the user is leaving */
  fromStep?: string;
  /** The label of the step the user wants to go to */
  toStep?: string;
  /** Called when the user confirms — save changes and navigate */
  onSaveAndContinue: () => void;
  /** Called when the user wants to discard changes and navigate */
  onDiscard: () => void;
  /** Called when the user cancels — stay on current step */
  onStay: () => void;
}

export function SaveChangesModal({
  fromStep,
  toStep,
  onSaveAndContinue,
  onDiscard,
  onStay,
}: SaveChangesModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="save-changes-title">
      <div className="bg-white rounded-[16px] border border-tv-border-light shadow-xl w-full max-w-[400px] mx-4 p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-tv-brand-tint flex items-center justify-center shrink-0">
            <Save size={18} className="text-tv-brand" />
          </div>
          <h3 id="save-changes-title" className="text-tv-text-primary" style={{ fontSize: "16px", fontWeight: 900 }}>
            Save your changes?
          </h3>
        </div>
        <p className="text-[13px] text-tv-text-secondary mb-1 leading-relaxed">
          You have unsaved changes{fromStep ? ` on "${fromStep}"` : ""}.
        </p>
        <p className="text-[13px] text-tv-text-secondary mb-6 leading-relaxed">
          Would you like to save your progress before{" "}
          {toStep ? `going to "${toStep}"` : "navigating away"}?
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onSaveAndContinue}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] text-white bg-tv-brand-bg rounded-full hover:bg-tv-brand-hover transition-colors"
            style={{ fontWeight: 600 }}
          >
            <Save size={13} />
            Save &amp; Continue
          </button>
          <button
            onClick={onDiscard}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-[13px] text-tv-text-secondary border border-tv-border-light rounded-full hover:bg-tv-surface transition-colors"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft size={13} />
            Discard Changes
          </button>
          <button
            onClick={onStay}
            className="w-full px-5 py-2 text-[13px] text-tv-text-secondary hover:text-tv-text-primary transition-colors"
            style={{ fontWeight: 500 }}
          >
            Stay on This Step
          </button>
        </div>
      </div>
    </div>
  );
}
