import {
  Tag, Mail, Phone, ShieldAlert, AlertTriangle, Ban, Hash, Star,
  Calendar, User, MapPin, GraduationCap, Heart, DollarSign, Layers,
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

  // ── Merge Fields ──────────────────────────────────────────────────────────
  { key: "state", label: "State", icon: MapPin, group: "Merge Fields", type: "multi-select", searchable: true,
    options: [
      { value: "AZ", label: "Arizona" }, { value: "CA", label: "California" },
      { value: "CO", label: "Colorado" }, { value: "DC", label: "District of Columbia" },
      { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
      { value: "IL", label: "Illinois" }, { value: "LA", label: "Louisiana" },
      { value: "MA", label: "Massachusetts" }, { value: "MD", label: "Maryland" },
      { value: "MN", label: "Minnesota" }, { value: "NC", label: "North Carolina" },
      { value: "NY", label: "New York" }, { value: "OR", label: "Oregon" },
      { value: "PA", label: "Pennsylvania" }, { value: "TN", label: "Tennessee" },
      { value: "TX", label: "Texas" }, { value: "WA", label: "Washington" },
    ] },
  { key: "classYear", label: "Class Year", icon: GraduationCap, group: "Merge Fields", type: "multi-select", searchable: true,
    options: [
      { value: "2026", label: "2026" }, { value: "2020", label: "2020" },
      { value: "2019", label: "2019" }, { value: "2018", label: "2018" },
      { value: "2016", label: "2016" }, { value: "2015", label: "2015" },
      { value: "2014", label: "2014" }, { value: "2012", label: "2012" },
      { value: "2011", label: "2011" }, { value: "2010", label: "2010" },
      { value: "2008", label: "2008" }, { value: "2006", label: "2006" },
      { value: "2005", label: "2005" }, { value: "2002", label: "2002" },
      { value: "2001", label: "2001" }, { value: "2000", label: "2000" },
      { value: "1998", label: "1998" }, { value: "1997", label: "1997" },
      { value: "1995", label: "1995" }, { value: "1993", label: "1993" },
      { value: "1992", label: "1992" }, { value: "1991", label: "1991" },
      { value: "1990", label: "1990" }, { value: "1989", label: "1989" },
      { value: "1988", label: "1988" }, { value: "1985", label: "1985" },
      { value: "1983", label: "1983" }, { value: "1980", label: "1980" },
      { value: "1979", label: "1979" }, { value: "1978", label: "1978" },
      { value: "1976", label: "1976" }, { value: "1964", label: "1964" },
    ] },
  { key: "givingLevel", label: "Giving Level", icon: Layers, group: "Merge Fields", type: "multi-select",
    options: [
      { value: "Leadership Circle", label: "Leadership Circle" },
      { value: "Benefactor", label: "Benefactor" },
      { value: "Annual Supporter", label: "Annual Supporter" },
      { value: "Staff Donor", label: "Staff Donor" },
      { value: "New Donor", label: "New Donor" },
      { value: "Prospective", label: "Prospective" },
    ] },
  { key: "donorStatus", label: "Donor Status", icon: Heart, group: "Merge Fields", type: "multi-select",
    options: [
      { value: "major", label: "Major Donor" },
      { value: "active", label: "Active" },
      { value: "first-time", label: "First-Time" },
      { value: "prospective", label: "Prospective" },
      { value: "lapsed", label: "Lapsed" },
    ] },
  { key: "askAmount", label: "Ask Amount", icon: DollarSign, group: "Merge Fields", type: "multi-select",
    options: [
      { value: "0-100", label: "$0 – $100" },
      { value: "101-500", label: "$101 – $500" },
      { value: "501-1000", label: "$501 – $1,000" },
      { value: "1001-5000", label: "$1,001 – $5,000" },
      { value: "5001+", label: "$5,001+" },
    ] },
  { key: "tags", label: "Tags", icon: Tag, group: "Merge Fields", type: "multi-select",
    options: [
      { value: "Alumni", label: "Alumni" },
      { value: "Major Donor", label: "Major Donor" },
      { value: "Board Member", label: "Board Member" },
      { value: "Foundation", label: "Foundation" },
      { value: "Staff", label: "Staff" },
      { value: "Prospective", label: "Prospective" },
    ] },

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