/**
 * ColorPickerPopover — A polished, reusable color picker popover.
 */
import { useState, useRef, useCallback, useEffect } from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Pipette } from "lucide-react";

// ── Color math helpers ──────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const c = hex.replace("#", "");
  const full = c.length === 3
    ? c[0] + c[0] + c[1] + c[1] + c[2] + c[2]
    : c.padEnd(6, "0");
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const { r, g, b } = hexToRgb(hex);
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60;
    else if (max === gg) h = ((bb - rr) / d + 2) * 60;
    else h = ((rr - gg) / d + 4) * 60;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let rr = 0, gg = 0, bb = 0;
  if (h < 60) { rr = c; gg = x; }
  else if (h < 120) { rr = x; gg = c; }
  else if (h < 180) { gg = c; bb = x; }
  else if (h < 240) { gg = x; bb = c; }
  else if (h < 300) { rr = x; bb = c; }
  else { rr = c; bb = x; }
  return rgbToHex(
    Math.round((rr + m) * 255),
    Math.round((gg + m) * 255),
    Math.round((bb + m) * 255)
  );
}

// ── Saturation / Brightness canvas ──────────────────────────────────────────

function SatBrightCanvas({ hue, sat, bright, onChange }: {
  hue: number; sat: number; bright: number;
  onChange: (s: number, v: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef(false);
  const W = 224, H = 150;

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
    ctx.fillRect(0, 0, W, H);
    const white = ctx.createLinearGradient(0, 0, W, 0);
    white.addColorStop(0, "rgba(255,255,255,1)");
    white.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = white;
    ctx.fillRect(0, 0, W, H);
    const black = ctx.createLinearGradient(0, 0, 0, H);
    black.addColorStop(0, "rgba(0,0,0,0)");
    black.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, W, H);
  }, [hue]);

  const setFromMouse = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(W, e.clientX - rect.left));
    const y = Math.max(0, Math.min(H, e.clientY - rect.top));
    onChange(x / W, 1 - y / H);
  }, [onChange]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) setFromMouse(e); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [setFromMouse]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.02;
    switch (e.key) {
      case "ArrowRight": e.preventDefault(); onChange(Math.min(1, sat + step), bright); break;
      case "ArrowLeft":  e.preventDefault(); onChange(Math.max(0, sat - step), bright); break;
      case "ArrowUp":    e.preventDefault(); onChange(sat, Math.min(1, bright + step)); break;
      case "ArrowDown":  e.preventDefault(); onChange(sat, Math.max(0, bright - step)); break;
    }
  }, [sat, bright, onChange]);

  return (
    <div className="relative" style={{ width: W, height: H }}
      role="slider" tabIndex={0} aria-label="Color saturation and brightness"
      aria-valuetext={`Saturation ${Math.round(sat * 100)}%, Brightness ${Math.round(bright * 100)}%`}
      onKeyDown={handleKey}>
      <canvas ref={canvasRef} width={W} height={H} className="rounded-sm cursor-crosshair" style={{ width: W, height: H }}
        onMouseDown={(e) => { dragging.current = true; setFromMouse(e); }} />
      <div className="absolute pointer-events-none" style={{
        left: sat * W - 7, top: (1 - bright) * H - 7,
        width: 14, height: 14, borderRadius: "50%",
        border: "2px solid white", boxShadow: "0 0 3px rgba(0,0,0,.5)",
      }} />
    </div>
  );
}

// ── Hue slider ──────────────────────────────────────────────────────────────

function HueSlider({ hue, onChange }: { hue: number; onChange: (h: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const W = 224;

  const setFromMouse = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(W, e.clientX - rect.left));
    onChange((x / W) * 360);
  }, [onChange]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) setFromMouse(e); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [setFromMouse]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 36 : 5;
    switch (e.key) {
      case "ArrowRight": case "ArrowUp":   e.preventDefault(); onChange((hue + step) % 360); break;
      case "ArrowLeft":  case "ArrowDown":  e.preventDefault(); onChange((hue - step + 360) % 360); break;
      case "Home": e.preventDefault(); onChange(0); break;
      case "End":  e.preventDefault(); onChange(359); break;
    }
  }, [hue, onChange]);

  return (
    <div ref={trackRef} className="relative rounded-full cursor-pointer"
      role="slider" tabIndex={0} aria-label="Hue"
      aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(hue)}
      aria-valuetext={`Hue ${Math.round(hue)}°`}
      onKeyDown={handleKey}
      style={{ width: W, height: 12, background: "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)" }}
      onMouseDown={(e) => { dragging.current = true; setFromMouse(e); }}>
      <div className="absolute top-1/2 pointer-events-none" style={{
        left: (hue / 360) * W - 7, transform: "translateY(-50%)",
        width: 14, height: 14, borderRadius: "50%",
        border: "2px solid white", boxShadow: "0 0 3px rgba(0,0,0,.4)",
        backgroundColor: `hsl(${hue}, 100%, 50%)`,
      }} />
    </div>
  );
}

// ── Main popover component ──────────────────────────────────────────────────

export interface ColorPickerPopoverProps {
  value: string;
  onChange: (hex: string) => void;
  presets?: string[];
  children?: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "start" | "center" | "end";
}

export function ColorPickerPopover({ value, onChange, presets, children, side = "bottom", align = "start" }: ColorPickerPopoverProps) {
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [hexInput, setHexInput] = useState(value);

  useEffect(() => {
    if (!open) { setHsv(hexToHsv(value)); setHexInput(value); }
  }, [value, open]);

  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const rgb = hexToRgb(currentHex);

  const commitColor = useCallback((hex: string) => { onChange(hex); setHexInput(hex); }, [onChange]);

  const handleSatBright = useCallback((s: number, v: number) => {
    const newHsv = { ...hsv, s, v };
    setHsv(newHsv);
    commitColor(hsvToHex(newHsv.h, s, v));
  }, [hsv, commitColor]);

  const handleHue = useCallback((h: number) => {
    const newHsv = { ...hsv, h };
    setHsv(newHsv);
    commitColor(hsvToHex(h, newHsv.s, newHsv.v));
  }, [hsv, commitColor]);

  const handleHexCommit = useCallback(() => {
    let clean = hexInput.trim();
    if (!clean.startsWith("#")) clean = "#" + clean;
    if (/^#[0-9a-fA-F]{3}$/.test(clean) || /^#[0-9a-fA-F]{6}$/.test(clean)) {
      const full = clean.length === 4
        ? "#" + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3]
        : clean;
      setHsv(hexToHsv(full));
      commitColor(full.toLowerCase());
    } else {
      setHexInput(currentHex);
    }
  }, [hexInput, currentHex, commitColor]);

  const handleRgbChange = useCallback((channel: "r" | "g" | "b", val: number) => {
    const clamped = Math.max(0, Math.min(255, Math.round(val)));
    const newRgb = { ...rgb, [channel]: clamped };
    const hex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    setHsv(hexToHsv(hex));
    commitColor(hex);
  }, [rgb, commitColor]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children ?? (
          <button type="button" className="w-[28px] h-[28px] rounded-full border flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
            style={{ borderColor: "#e0daea", background: "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}
            title="Custom color"
            aria-expanded={open}
            aria-label="Custom color picker">
            <Pipette size={11} className="text-white drop-shadow-sm" />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent side={side} align={align} className="w-auto p-0 rounded-lg border border-tv-border-light bg-white shadow-lg z-[999]" sideOffset={8}>
        <div className="p-3 space-y-3">
          <SatBrightCanvas hue={hsv.h} sat={hsv.s} bright={hsv.v} onChange={handleSatBright} />
          <HueSlider hue={hsv.h} onChange={handleHue} />
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-sm border border-tv-border-light shrink-0" style={{ backgroundColor: currentHex }} />
            <div className="flex-1 min-w-0">
              <label htmlFor="color-picker-hex" className="text-[9px] text-tv-text-secondary uppercase tracking-wider block mb-0.5">Hex</label>
              <input id="color-picker-hex" value={hexInput} onChange={(e) => setHexInput(e.target.value)} onBlur={handleHexCommit}
                onKeyDown={(e) => e.key === "Enter" && handleHexCommit()}
                className="w-full h-7 px-2 rounded-sm border border-tv-border-light text-[12px] font-mono outline-none focus:ring-2 focus:ring-tv-brand-bg/30" spellCheck={false} />
            </div>
          </div>
          <div className="flex gap-2">
            {(["r", "g", "b"] as const).map((ch) => (
              <div key={ch} className="flex-1">
                <label htmlFor={`color-picker-${ch}`} className="text-[9px] text-tv-text-secondary uppercase tracking-wider block mb-0.5">{ch.toUpperCase()}</label>
                <input id={`color-picker-${ch}`} type="number" min={0} max={255} value={rgb[ch]}
                  onChange={(e) => handleRgbChange(ch, Number(e.target.value))}
                  className="w-full h-7 px-2 rounded-sm border border-tv-border-light text-[12px] font-mono outline-none focus:ring-2 focus:ring-tv-brand-bg/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
              </div>
            ))}
          </div>
          {presets && presets.length > 0 && (
            <div>
              <label className="text-[9px] text-tv-text-secondary uppercase tracking-wider block mb-1.5">Presets</label>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((hex) => (
                  <button key={hex} type="button" onClick={() => { setHsv(hexToHsv(hex)); setHexInput(hex); commitColor(hex); }}
                    className={`w-6 h-6 rounded-full transition-all ${hex.toLowerCase() === currentHex.toLowerCase() ? "ring-2 ring-tv-brand-bg ring-offset-1 scale-110" : "hover:scale-110"}`}
                    style={{ backgroundColor: hex }} />
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function RainbowSwatchTrigger({ value, isCustom, size = 28 }: { value: string; isCustom: boolean; size?: number }) {
  return (
    <button type="button"
      className={`rounded-full border-2 transition-all shrink-0 cursor-pointer relative overflow-hidden ${
        isCustom ? "border-tv-brand scale-110 ring-2 ring-tv-brand/20" : "border-tv-border-light hover:border-tv-border-strong"
      }`}
      style={{ width: size, height: size, background: isCustom ? value : "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}>
      {!isCustom && <Pipette size={Math.max(9, size * 0.36)} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white drop-shadow-sm" />}
    </button>
  );
}
