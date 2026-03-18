import {
  Tag, Mail, Phone, ShieldAlert, AlertTriangle, Ban, Hash, Star,
  Calendar, User,
} from "lucide-react";

export interface FilterDef {
  key: string;
  label: string;
  icon: typeof Tag;
  group: string;
  type: "multi-select" | "select" | "boolean" | "date" | "date-range";
  options: { value: string; label: string; color?: string; group?: string }[];
  essential?: boolean;
  /** Always show the search box inside this filter's dropdown */
  searchable?: boolean;
}

export const CONTACT_FILTERS: FilterDef[] = [
  // ── Score ──────────────────────────────────────────────────────────────────
  { key: "starRating", label: "Score", icon: Star, group: "Score", type: "multi-select", essential: true,
    options: [
      { value: "5", label: "\u2B50\u2B50\u2B50\u2B50\u2B50" },
      { value: "4", label: "\u2B50\u2B50\u2B50\u2B50" },
      { value: "3", label: "\u2B50\u2B50\u2B50" },
      { value: "2", label: "\u2B50\u2B50" },
      { value: "1", label: "\u2B50" },
    ] },

  // ── Email Recipients ───────────────────────────────────────────────────────
  { key: "hasValidEmail", label: "Valid Email", icon: Mail, group: "Email Recipients", type: "boolean", essential: true,
    options: [{ value: "yes", label: "Yes \u2014 valid email" }, { value: "no", label: "No \u2014 no valid email" }] },
  { key: "hasBouncedEmail", label: "Bounced Email", icon: AlertTriangle, group: "Email Recipients", type: "boolean",
    options: [{ value: "yes", label: "Yes \u2014 bounced" }, { value: "no", label: "No" }] },
  { key: "hasUnsubscribedEmail", label: "Unsubscribed Email", icon: ShieldAlert, group: "Email Recipients", type: "boolean",
    options: [{ value: "yes", label: "Yes \u2014 unsubscribed" }, { value: "no", label: "No" }] },
  { key: "hasSpamEmail", label: "Spam Report", icon: Ban, group: "Email Recipients", type: "boolean",
    options: [{ value: "yes", label: "Yes \u2014 marked as spam" }, { value: "no", label: "No" }] },

  // ── Text Recipients ────────────────────────────────────────────────────────
  { key: "hasValidPhone", label: "Valid Phone", icon: Phone, group: "Text Recipients", type: "boolean", essential: true,
    options: [{ value: "yes", label: "Yes \u2014 valid phone" }, { value: "no", label: "No \u2014 no valid phone" }] },
  { key: "hasBouncedPhone", label: "Bounced Phone", icon: AlertTriangle, group: "Text Recipients", type: "boolean",
    options: [{ value: "yes", label: "Yes \u2014 bounced" }, { value: "no", label: "No" }] },
  { key: "hasUnsubscribedPhone", label: "Unsubscribed Phone", icon: ShieldAlert, group: "Text Recipients", type: "boolean",
    options: [{ value: "yes", label: "Yes \u2014 unsubscribed" }, { value: "no", label: "No" }] },

  // ── Custom Fields ──────────────────────────────────────────────────────────
  { key: "customField", label: "Custom Field Data", icon: Hash, group: "Custom Fields", type: "multi-select",
    options: [
      { value: "has:Preferred Name", label: "Has Preferred Name" },
      { value: "has:Graduation Year", label: "Has Graduation Year" },
      { value: "has:Degree", label: "Has Degree" },
      { value: "has:Board Term", label: "Has Board Term" },
      { value: "has:Committee", label: "Has Committee" },
      { value: "has:Spouse Name", label: "Has Spouse Name" },
      { value: "has:Department", label: "Has Department" },
      { value: "has:Interest Area", label: "Has Interest Area" },
    ] },

  // ── Date ────────────────────────────────────────────────────────────────────
  { key: "dateCreated", label: "Date Created", icon: Calendar, group: "Date", type: "date",
    options: [], essential: true },
];

// ── Shared "Date Created" filter (reusable across all pages) ──────────────────
export const DATE_CREATED_FILTER: FilterDef = {
  key: "dateCreated", label: "Date Created", icon: Calendar, group: "Date", type: "date",
  options: [], essential: true,
};

// ── Shared "Created By" filter (reusable across all asset pages) ──────────────
export const CREATED_BY_FILTER: FilterDef = {
  key: "createdBy", label: "Created By", icon: User, group: "People", type: "multi-select",
  options: [
    { value: "kelley-molt", label: "Kelley Molt" },
    { value: "sarah-chen", label: "Sarah Chen" },
    { value: "marcus-johnson", label: "Marcus Johnson" },
    { value: "priya-patel", label: "Priya Patel" },
    { value: "david-kim", label: "David Kim" },
  ],
  searchable: true,
};