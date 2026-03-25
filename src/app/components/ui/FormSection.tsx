import type { ReactNode } from "react";

interface FormSectionProps {
  legend: string;
  children: ReactNode;
  className?: string;
}

/** Semantic form group wrapper (WCAG 1.3.1). Legend is visually hidden. */
export function FormSection({ legend, children, className }: FormSectionProps) {
  return (
    <fieldset className={`border-0 p-0 m-0 min-w-0 ${className ?? ""}`}>
      <legend className="sr-only">{legend}</legend>
      {children}
    </fieldset>
  );
}
