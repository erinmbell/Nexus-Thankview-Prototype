import { useState, useRef, useCallback, useEffect } from "react";
import {
  Sparkles, StopCircle, RefreshCw, TriangleAlert,
  ArrowDownToLine, Replace, RotateCcw, PenLine,
} from "lucide-react";

const EMAIL_TEXT =
  "Dear {{first_name}},\n\nYour incredible generosity has made a transformative difference for students at Hartwell University this year. Thanks to supporters like you, we\u2019ve been able to fund 12 new scholarships and expand our mentoring program to reach over 200 first-generation students.\n\nI wanted to take a moment to share a personal video message with you \u2014 because your impact truly deserves more than just words on a screen.\n\nWith gratitude,\nKelley Molt";

const SMS_TEXT =
  "Hi {{first_name}}! Thank you for your generous support of the Annual Fund. Your gift is making a real difference for students at Hartwell. Click here to see a message from us: {{link}}";

type AiPhase = "idle" | "streaming" | "done" | "error";

interface AIWritingPopoverProps {
  channel: "email" | "sms";
  onInsertBelow: (text: string) => void;
  onReplaceBody: (text: string) => void;
  onClose: () => void;
  size?: "sm" | "lg";
}

export function AIWritingPopover({
  channel,
  onInsertBelow,
  onReplaceBody,
  onClose,
  size = "lg",
}: AIWritingPopoverProps) {
  const sm = size === "sm";
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<AiPhase>("idle");
  const [streamedText, setStreamedText] = useState("");
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wordsRef = useRef<string[]>([]);
  const wordIdxRef = useRef(0);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const addToHistory = useCallback((p: string) => {
    setPromptHistory(prev => {
      const trimmed = p.trim();
      const deduped = prev.filter(x => x !== trimmed);
      return [trimmed, ...deduped].slice(0, 3);
    });
  }, []);

  const startStreaming = useCallback(() => {
    const p = prompt.trim();
    if (!p) return;
    addToHistory(p);

    if (Math.random() < 0.15) {
      setPhase("error");
      return;
    }

    const fullText = channel === "email" ? EMAIL_TEXT : SMS_TEXT;
    const words = fullText.split(/(\s+)/);
    wordsRef.current = words;
    wordIdxRef.current = 0;
    setStreamedText("");
    setPhase("streaming");

    intervalRef.current = setInterval(() => {
      const idx = wordIdxRef.current;
      const chunk = words.slice(idx, idx + 3).join("");
      wordIdxRef.current = idx + 3;

      setStreamedText(prev => prev + chunk);

      if (wordIdxRef.current >= words.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
        setPhase("done");
      }
    }, 80);
  }, [prompt, channel, addToHistory]);

  const stopStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPhase("done");
  }, []);

  const retry = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStreamedText("");
    setPhase("idle");
    setTimeout(() => startStreaming(), 0);
  }, [startStreaming]);

  const newPrompt = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setStreamedText("");
    setPrompt("");
    setPhase("idle");
  }, []);

  const pad = sm ? "p-2.5" : "p-3";
  const gap = sm ? "space-y-2" : "space-y-2.5";
  const textSm = sm ? "text-[11px]" : "text-[12px]";
  const textXs = sm ? "text-[10px]" : "text-[11px]";
  const btnPad = sm ? "px-2.5 py-1" : "px-3 py-1.5";
  const placeholder = channel === "email"
    ? "e.g. Write a heartfelt thank-you message\u2026"
    : "e.g. Write a brief thank-you SMS\u2026";

  return (
    <div className={`mt-2 ${pad} bg-tv-brand-tint border border-tv-border-strong rounded-[10px] ${gap}`}>
      {(phase === "idle" || phase === "error") && (
        <>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className={`w-full border border-tv-border rounded-[8px] px-2.5 py-1.5 ${textSm} outline-none resize-none focus:ring-2 focus:ring-tv-brand/40 focus:border-tv-brand`}
          />
          {promptHistory.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {promptHistory.map((h, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(h)}
                  className={`${textXs} px-2.5 py-1 rounded-full border border-tv-border-light bg-white text-tv-text-secondary hover:border-tv-brand hover:text-tv-brand transition-colors truncate max-w-[240px]`}
                  title={h}
                >
                  {h.length > 40 ? h.slice(0, 40) + "\u2026" : h}
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {phase === "error" && (
        <div className="flex items-center gap-2 p-2 bg-tv-warning-bg border border-tv-warning-border rounded-[8px]">
          <TriangleAlert size={12} className="text-tv-warning shrink-0" />
          <p className={`${textXs} text-tv-warning flex-1`} style={{ fontWeight: 500 }}>
            AI generation failed &mdash; try again
          </p>
          <button
            onClick={retry}
            className={`${textXs} flex items-center gap-1 px-2 py-0.5 rounded-full border border-tv-warning text-tv-warning hover:bg-tv-warning/10 transition-colors`}
            style={{ fontWeight: 600 }}
          >
            <RefreshCw size={9} />Retry
          </button>
        </div>
      )}

      {(phase === "streaming" || phase === "done") && (
        <div className="relative">
          <div
            className={`w-full border border-tv-border rounded-[8px] px-2.5 py-2 ${textSm} text-tv-text-primary bg-white min-h-[60px] max-h-[180px] overflow-y-auto whitespace-pre-wrap leading-relaxed`}
          >
            {streamedText}
            {phase === "streaming" && (
              <span className="inline-block w-[2px] h-[14px] bg-tv-brand animate-pulse ml-0.5 align-text-bottom" />
            )}
          </div>
          {phase === "streaming" && (
            <div className="absolute top-2 right-2">
              <span className={`${textXs} text-tv-text-decorative`} style={{ fontWeight: 500 }}>
                Generating\u2026
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={onClose}
          className={`${btnPad} ${textSm} text-tv-text-secondary hover:text-tv-brand transition-colors`}
          style={{ fontWeight: 500 }}
        >
          Cancel
        </button>

        <div className="flex-1" />

        {phase === "idle" && (
          <button
            onClick={startStreaming}
            disabled={!prompt.trim()}
            className={`${btnPad} bg-tv-brand-bg text-white ${textSm} rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
            style={{ fontWeight: 600 }}
          >
            <Sparkles size={sm ? 10 : 11} />Generate
          </button>
        )}

        {phase === "streaming" && (
          <button
            onClick={stopStreaming}
            className={`${btnPad} ${textSm} rounded-full border border-tv-danger text-tv-danger hover:bg-tv-danger-bg transition-colors flex items-center gap-1`}
            style={{ fontWeight: 600 }}
          >
            <StopCircle size={sm ? 10 : 11} />Stop
          </button>
        )}

        {phase === "done" && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={retry}
              className={`${btnPad} ${textXs} text-tv-text-secondary hover:text-tv-brand border border-transparent hover:border-tv-border-light rounded-full transition-colors flex items-center gap-1`}
              style={{ fontWeight: 500 }}
            >
              <RotateCcw size={sm ? 9 : 10} />Retry
            </button>
            <button
              onClick={newPrompt}
              className={`${btnPad} ${textXs} text-tv-text-secondary hover:text-tv-brand border border-transparent hover:border-tv-border-light rounded-full transition-colors flex items-center gap-1`}
              style={{ fontWeight: 500 }}
            >
              <PenLine size={sm ? 9 : 10} />New Prompt
            </button>
            <button
              onClick={() => onInsertBelow(streamedText)}
              className={`${btnPad} ${textXs} border border-tv-brand text-tv-brand hover:bg-tv-brand-tint rounded-full transition-colors flex items-center gap-1`}
              style={{ fontWeight: 600 }}
            >
              <ArrowDownToLine size={sm ? 9 : 10} />Insert Below
            </button>
            <button
              onClick={() => onReplaceBody(streamedText)}
              className={`${btnPad} ${textXs} bg-tv-brand-bg text-white hover:bg-tv-brand-hover rounded-full transition-colors flex items-center gap-1`}
              style={{ fontWeight: 600 }}
            >
              <Replace size={sm ? 9 : 10} />Replace Body
            </button>
          </div>
        )}

        {phase === "error" && (
          <button
            onClick={startStreaming}
            disabled={!prompt.trim()}
            className={`${btnPad} bg-tv-brand-bg text-white ${textSm} rounded-full hover:bg-tv-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1`}
            style={{ fontWeight: 600 }}
          >
            <RefreshCw size={sm ? 10 : 11} />Retry
          </button>
        )}
      </div>
    </div>
  );
}
