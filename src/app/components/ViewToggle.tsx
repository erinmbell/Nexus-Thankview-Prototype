import { TV } from "../theme";

interface ViewToggleOption {
  value: string;
  icon: React.ReactNode;
  label: string;
}

interface ViewToggleProps {
  options: ViewToggleOption[];
  value: string;
  onChange: (value: string) => void;
}

export function ViewToggle({ options, value, onChange }: ViewToggleProps) {
  return (
    <div
      className="flex rounded-full p-[3px]"
      style={{ backgroundColor: TV.surface }}
      role="radiogroup"
      aria-label="View mode"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition-all"
            style={{
              fontWeight: active ? 600 : 400,
              color: active ? TV.textBrand : TV.textSecondary,
              backgroundColor: active ? "white" : "transparent",
              boxShadow: active
                ? "0 1px 3px rgba(0,0,0,0.08)"
                : "none",
            }}
            role="radio"
            aria-checked={active}
            aria-label={opt.label}
            title={opt.label}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}