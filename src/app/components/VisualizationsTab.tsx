import React, { useState, useMemo } from "react";
import { Text, SegmentedControl, Drawer, Badge, Avatar, TextInput } from "@mantine/core";
import { Link } from "react-router";
import {
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  BarChart, Bar, PieChart as RPieChart, Pie, Cell,
  ComposedChart, Line,
} from "recharts";
import { MapPin, Smartphone, Monitor, Tablet, Globe, Star, Search, Mail, MousePointerClick, Play, CheckCircle, ExternalLink, ChevronDown } from "lucide-react";
import { TV } from "../theme";
import { WorldMap } from "./WorldMap";
import { DashCard, ChartBox, DRAWER_STYLES } from "./shared";

// ── Data Constants ────────────────────────────────────────────────────────────

const DEVICE_DATA = [
  { name: "Desktop", value: 42, color: TV.brand },
  { name: "Mobile", value: 45, color: TV.info },
  { name: "Tablet", value: 10, color: TV.warning },
  { name: "Unknown", value: 3, color: TV.textDecorative },
];
const DEVICE_ICON: Record<string, any> = { Desktop: Monitor, Mobile: Smartphone, Tablet: Tablet, Unknown: Globe };

const AGE_DATA = [
  { age: "18-24", recipients: 3124, engagementAvg: 41 },
  { age: "25-34", recipients: 5187, engagementAvg: 58 },
  { age: "35-44", recipients: 6168, engagementAvg: 72 },
  { age: "45-54", recipients: 5842, engagementAvg: 79 },
  { age: "55-64", recipients: 4289, engagementAvg: 84 },
  { age: "65+",   recipients: 2135, engagementAvg: 68 },
];

const ENGAGEMENT_SCORE_DATA = [
  { stars: 1, label: "1 Star", count: 3286, pct: 12.2 },
  { stars: 2, label: "2 Stars", count: 4104, pct: 15.2 },
  { stars: 3, label: "3 Stars", count: 7842, pct: 29.1 },
  { stars: 4, label: "4 Stars", count: 7698, pct: 28.6 },
  { stars: 5, label: "5 Stars", count: 3985, pct: 14.8 },
];

// Geographic data — heavily US-centric, with some Canada and a few international
const GEO_DATA = [
  // ── US — Major metros ──
  { city: "New York",       state: "NY", country: "US", clicks: 4218, views: 5814, finished: 3140, ctaClicks: 1652 },
  { city: "Brooklyn",       state: "NY", country: "US", clicks: 1842, views: 2531, finished: 1368, ctaClicks: 718 },
  { city: "White Plains",   state: "NY", country: "US", clicks: 612,  views: 871,  finished: 461,  ctaClicks: 245 },
  { city: "Los Angeles",    state: "CA", country: "US", clicks: 3105, views: 4287, finished: 2218, ctaClicks: 1184 },
  { city: "San Francisco",  state: "CA", country: "US", clicks: 2218, views: 3105, finished: 1628, ctaClicks: 888 },
  { city: "San Diego",      state: "CA", country: "US", clicks: 1145, views: 1612, finished: 845,  ctaClicks: 432 },
  { city: "Sacramento",     state: "CA", country: "US", clicks: 578,  views: 824,  finished: 412,  ctaClicks: 218 },
  { city: "Chicago",        state: "IL", country: "US", clicks: 2412, views: 3318, finished: 1792, ctaClicks: 945 },
  { city: "Naperville",     state: "IL", country: "US", clicks: 418,  views: 612,  finished: 324,  ctaClicks: 172 },
  { city: "Boston",         state: "MA", country: "US", clicks: 2614, views: 3612, finished: 2018, ctaClicks: 1012 },
  { city: "Cambridge",      state: "MA", country: "US", clicks: 1218, views: 1714, finished: 918,  ctaClicks: 478 },
  { city: "Worcester",      state: "MA", country: "US", clicks: 412,  views: 618,  finished: 312,  ctaClicks: 165 },
  { city: "Houston",        state: "TX", country: "US", clicks: 1918, views: 2714, finished: 1412, ctaClicks: 745 },
  { city: "Austin",         state: "TX", country: "US", clicks: 1512, views: 2118, finished: 1118, ctaClicks: 612 },
  { city: "Dallas",         state: "TX", country: "US", clicks: 1318, views: 1842, finished: 978,  ctaClicks: 512 },
  { city: "San Antonio",    state: "TX", country: "US", clicks: 612,  views: 878,  finished: 445,  ctaClicks: 234 },
  { city: "Washington",     state: "DC", country: "US", clicks: 1612, views: 2218, finished: 1178, ctaClicks: 618 },
  { city: "Philadelphia",   state: "PA", country: "US", clicks: 1418, views: 1978, finished: 1045, ctaClicks: 548 },
  { city: "Pittsburgh",     state: "PA", country: "US", clicks: 718,  views: 1012, finished: 534,  ctaClicks: 278 },
  { city: "Atlanta",        state: "GA", country: "US", clicks: 1218, views: 1712, finished: 912,  ctaClicks: 478 },
  { city: "Denver",         state: "CO", country: "US", clicks: 1045, views: 1478, finished: 778,  ctaClicks: 412 },
  { city: "Seattle",        state: "WA", country: "US", clicks: 1312, views: 1845, finished: 978,  ctaClicks: 512 },
  { city: "Miami",          state: "FL", country: "US", clicks: 1145, views: 1618, finished: 845,  ctaClicks: 445 },
  { city: "Orlando",        state: "FL", country: "US", clicks: 618,  views: 878,  finished: 462,  ctaClicks: 242 },
  { city: "Minneapolis",    state: "MN", country: "US", clicks: 712,  views: 1012, finished: 534,  ctaClicks: 278 },
  { city: "Portland",       state: "OR", country: "US", clicks: 612,  views: 878,  finished: 462,  ctaClicks: 242 },
  { city: "Nashville",      state: "TN", country: "US", clicks: 518,  views: 745,  finished: 392,  ctaClicks: 208 },
  { city: "Charlotte",      state: "NC", country: "US", clicks: 478,  views: 678,  finished: 358,  ctaClicks: 188 },
  { city: "Raleigh",        state: "NC", country: "US", clicks: 345,  views: 498,  finished: 262,  ctaClicks: 138 },
  // ── Canada ──
  { city: "Toronto",        state: "ON", country: "CA", clicks: 1412, views: 1978, finished: 1045, ctaClicks: 548 },
  { city: "Ottawa",         state: "ON", country: "CA", clicks: 418,  views: 612,  finished: 324,  ctaClicks: 172 },
  { city: "Vancouver",      state: "BC", country: "CA", clicks: 812,  views: 1145, finished: 612,  ctaClicks: 318 },
  { city: "Montreal",       state: "QC", country: "CA", clicks: 618,  views: 878,  finished: 462,  ctaClicks: 242 },
  { city: "Calgary",        state: "AB", country: "CA", clicks: 312,  views: 445,  finished: 234,  ctaClicks: 124 },
  // ── International (sparse) ──
  { city: "London",         state: "ENG", country: "GB", clicks: 412,  views: 618,  finished: 324,  ctaClicks: 172 },
  { city: "Sydney",         state: "NSW", country: "AU", clicks: 218,  views: 334,  finished: 178,  ctaClicks: 92 },
];

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", FR: "France",
  DE: "Germany", AU: "Australia", JP: "Japan", SG: "Singapore",
  AE: "United Arab Emirates", MX: "Mexico", BR: "Brazil", IN: "India",
  HK: "Hong Kong",
};

const STATE_NAMES: Record<string, string> = {
  NY: "New York", CA: "California", IL: "Illinois", MA: "Massachusetts",
  TX: "Texas", DC: "District of Columbia", PA: "Pennsylvania", GA: "Georgia",
  CO: "Colorado", WA: "Washington", FL: "Florida", MN: "Minnesota",
  OR: "Oregon", TN: "Tennessee", NC: "North Carolina",
  ON: "Ontario", BC: "British Columbia", QC: "Quebec", AB: "Alberta",
  ENG: "England", NSW: "New South Wales",
};

// Recipient-level data — ~90 recipients, heavily US
type GeoRecipient = { name: string; email: string; city: string; state: string; country: string; opened: boolean; watched: boolean; ctaClicked: boolean };
const GEO_RECIPIENTS: GeoRecipient[] = [
  // ── NY (12) ──
  { name: "Ryan O'Brien",      email: "r.obrien@alumni.edu",      city: "New York",     state: "NY", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Jessica Lee",       email: "j.lee@alumni.edu",         city: "New York",     state: "NY", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "David Kim",         email: "d.kim@alumni.edu",         city: "New York",     state: "NY", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Priya Patel",       email: "p.patel@alumni.edu",       city: "New York",     state: "NY", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Marcus Johnson",    email: "m.johnson@alumni.edu",     city: "New York",     state: "NY", country: "US", opened: false, watched: false, ctaClicked: false },
  { name: "Elena Vasquez",     email: "e.vasquez@alumni.edu",     city: "New York",     state: "NY", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Andrew Chang",      email: "a.chang@alumni.edu",       city: "Brooklyn",     state: "NY", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Nicole Stewart",    email: "n.stewart@alumni.edu",     city: "Brooklyn",     state: "NY", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Brian Murphy",      email: "b.murphy@alumni.edu",      city: "Brooklyn",     state: "NY", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Karen Goldstein",   email: "k.goldstein@alumni.edu",   city: "White Plains", state: "NY", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Daniel Rivera",     email: "d.rivera@alumni.edu",      city: "White Plains", state: "NY", country: "US", opened: false, watched: false, ctaClicked: false },
  { name: "Laura Bennett",     email: "l.bennett@alumni.edu",     city: "White Plains", state: "NY", country: "US", opened: true,  watched: false, ctaClicked: false },
  // ── CA (11) ──
  { name: "Jason Park",        email: "j.park@alumni.edu",        city: "Los Angeles",   state: "CA", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Michelle Tran",     email: "m.tran@alumni.edu",        city: "Los Angeles",   state: "CA", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Roberto Sanchez",   email: "r.sanchez@alumni.edu",     city: "Los Angeles",   state: "CA", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Amy Nakamura",      email: "a.nakamura@alumni.edu",    city: "San Francisco", state: "CA", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Kevin Wright",      email: "k.wright@alumni.edu",      city: "San Francisco", state: "CA", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Christine Huang",   email: "c.huang@alumni.edu",       city: "San Francisco", state: "CA", country: "US", opened: false, watched: false, ctaClicked: false },
  { name: "Derek Foster",      email: "d.foster@alumni.edu",      city: "San Diego",     state: "CA", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Samantha Cole",     email: "s.cole@alumni.edu",        city: "San Diego",     state: "CA", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Tyler Ross",        email: "t.ross@alumni.edu",        city: "Sacramento",    state: "CA", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Maria Gonzalez",    email: "m.gonzalez@alumni.edu",    city: "Sacramento",    state: "CA", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Patrick Sullivan",  email: "p.sullivan@alumni.edu",    city: "Los Angeles",   state: "CA", country: "US", opened: true,  watched: false, ctaClicked: false },
  // ── MA (8) ──
  { name: "Jennifer Walsh",    email: "j.walsh@alumni.edu",       city: "Boston",    state: "MA", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Steven Chen",       email: "s.chen@alumni.edu",        city: "Boston",    state: "MA", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Catherine Morris",  email: "c.morris@alumni.edu",      city: "Boston",    state: "MA", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "William Hayes",     email: "w.hayes@alumni.edu",       city: "Boston",    state: "MA", country: "US", opened: false, watched: false, ctaClicked: false },
  { name: "Rachel Bloom",      email: "r.bloom@alumni.edu",       city: "Cambridge", state: "MA", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Alexander Reed",    email: "a.reed@alumni.edu",        city: "Cambridge", state: "MA", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Hannah Fischer",    email: "h.fischer@alumni.edu",     city: "Worcester", state: "MA", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Nathan Brooks",     email: "n.brooks@alumni.edu",      city: "Worcester", state: "MA", country: "US", opened: true,  watched: true,  ctaClicked: true },
  // ── TX (8) ──
  { name: "Carlos Mendez",     email: "c.mendez@alumni.edu",      city: "Houston",      state: "TX", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Ashley Thompson",   email: "a.thompson@alumni.edu",    city: "Houston",      state: "TX", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Brandon White",     email: "b.white@alumni.edu",       city: "Austin",       state: "TX", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Megan Torres",      email: "m.torres@alumni.edu",      city: "Austin",       state: "TX", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Joshua Garcia",     email: "j.garcia@alumni.edu",      city: "Dallas",       state: "TX", country: "US", opened: false, watched: false, ctaClicked: false },
  { name: "Stephanie Ruiz",    email: "s.ruiz@alumni.edu",        city: "Dallas",       state: "TX", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Raymond Cruz",      email: "r.cruz@alumni.edu",        city: "San Antonio",  state: "TX", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Olivia Barnes",     email: "o.barnes@alumni.edu",      city: "San Antonio",  state: "TX", country: "US", opened: true,  watched: true,  ctaClicked: true },
  // ── IL (6) ──
  { name: "Anna Kowalski",     email: "a.kowalski@alumni.edu",    city: "Chicago",    state: "IL", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Tom Bradley",       email: "t.bradley@alumni.edu",     city: "Chicago",    state: "IL", country: "US", opened: false, watched: false, ctaClicked: false },
  { name: "Vanessa Stone",     email: "v.stone@alumni.edu",       city: "Chicago",    state: "IL", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "George Patterson",  email: "g.patterson@alumni.edu",   city: "Chicago",    state: "IL", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Lindsey Harper",    email: "l.harper@alumni.edu",      city: "Naperville", state: "IL", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Keith Simmons",     email: "k.simmons@alumni.edu",     city: "Naperville", state: "IL", country: "US", opened: true,  watched: true,  ctaClicked: false },
  // ── DC / PA / GA / CO / WA / FL / MN / OR / TN / NC (1-3 each) ──
  { name: "Monica Price",      email: "m.price@alumni.edu",       city: "Washington",    state: "DC", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Gregory Adams",     email: "g.adams@alumni.edu",       city: "Washington",    state: "DC", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Sandra Lewis",      email: "s.lewis@alumni.edu",       city: "Philadelphia",  state: "PA", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Jeffrey Collins",   email: "j.collins@alumni.edu",     city: "Philadelphia",  state: "PA", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Donna Campbell",    email: "d.campbell@alumni.edu",    city: "Pittsburgh",    state: "PA", country: "US", opened: false, watched: false, ctaClicked: false },
  { name: "Timothy Young",     email: "t.young@alumni.edu",       city: "Atlanta",       state: "GA", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Rebecca Hill",      email: "r.hill@alumni.edu",        city: "Atlanta",       state: "GA", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Sarah Mitchell",    email: "s.mitchell@alumni.edu",    city: "Denver",        state: "CO", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "James Rodriguez",   email: "j.rodriguez@alumni.edu",   city: "Denver",        state: "CO", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Emily Chen",        email: "e.chen@alumni.edu",        city: "Denver",        state: "CO", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Lisa Park",         email: "l.park@alumni.edu",        city: "Seattle",       state: "WA", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Aaron Wolfe",       email: "a.wolfe@alumni.edu",       city: "Seattle",       state: "WA", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Diana Reyes",       email: "d.reyes@alumni.edu",       city: "Miami",         state: "FL", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Victor Morales",    email: "v.morales@alumni.edu",     city: "Miami",         state: "FL", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Christina Lane",    email: "c.lane@alumni.edu",        city: "Orlando",       state: "FL", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Paul Jensen",       email: "p.jensen@alumni.edu",      city: "Minneapolis",   state: "MN", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Theresa Grant",     email: "t.grant@alumni.edu",       city: "Portland",      state: "OR", country: "US", opened: true,  watched: false, ctaClicked: false },
  { name: "Russell Dixon",     email: "r.dixon@alumni.edu",       city: "Nashville",     state: "TN", country: "US", opened: true,  watched: true,  ctaClicked: true },
  { name: "Kimberly Webb",     email: "k.webb@alumni.edu",        city: "Charlotte",     state: "NC", country: "US", opened: true,  watched: true,  ctaClicked: false },
  { name: "Roger Palmer",      email: "r.palmer@alumni.edu",      city: "Raleigh",       state: "NC", country: "US", opened: true,  watched: false, ctaClicked: false },
  // ── Canada (8) ──
  { name: "Sophie Martin",     email: "s.martin@alumni.edu",      city: "Toronto",   state: "ON", country: "CA", opened: true,  watched: true,  ctaClicked: true },
  { name: "Liam Hughes",       email: "l.hughes@alumni.edu",      city: "Toronto",   state: "ON", country: "CA", opened: true,  watched: false, ctaClicked: false },
  { name: "Natalie Tremblay",  email: "n.tremblay@alumni.edu",    city: "Toronto",   state: "ON", country: "CA", opened: true,  watched: true,  ctaClicked: false },
  { name: "Ethan Roy",         email: "e.roy@alumni.edu",         city: "Ottawa",    state: "ON", country: "CA", opened: true,  watched: true,  ctaClicked: true },
  { name: "Claire Bouchard",   email: "c.bouchard@alumni.edu",    city: "Montreal",  state: "QC", country: "CA", opened: true,  watched: true,  ctaClicked: false },
  { name: "Julien Gagnon",     email: "j.gagnon@alumni.edu",      city: "Montreal",  state: "QC", country: "CA", opened: true,  watched: false, ctaClicked: false },
  { name: "Maya Singh",        email: "m.singh@alumni.edu",       city: "Vancouver", state: "BC", country: "CA", opened: true,  watched: true,  ctaClicked: true },
  { name: "Ben Taylor",        email: "b.taylor@alumni.edu",      city: "Calgary",   state: "AB", country: "CA", opened: false, watched: false, ctaClicked: false },
  // ── International (3) ──
  { name: "Emma Wilson",       email: "e.wilson@alumni.edu",      city: "London", state: "ENG", country: "GB", opened: true,  watched: true,  ctaClicked: true },
  { name: "Oliver Pearce",     email: "o.pearce@alumni.edu",      city: "London", state: "ENG", country: "GB", opened: true,  watched: false, ctaClicked: false },
  { name: "Chris Evans",       email: "c.evans@alumni.edu",       city: "Sydney", state: "NSW", country: "AU", opened: true,  watched: true,  ctaClicked: true },
];

const SENDER_DATA = [
  { sender: "Kelley Molt", sends: 8412, opened: 6478, clicks: 2108, views: 5298, watched: 4012, finished: 3189, ctaClicks: 1498 },
  { sender: "Michelle Park", sends: 6198, opened: 4834, clicks: 1544, views: 3918, watched: 2891, finished: 2472, ctaClicks: 1041 },
  { sender: "James Okafor", sends: 4135, opened: 3142, clicks: 932, views: 2673, watched: 1956, finished: 1651, ctaClicks: 845 },
  { sender: "Sarah Hernandez", sends: 3890, opened: 2918, clicks: 812, views: 2341, watched: 1734, finished: 1420, ctaClicks: 712 },
  { sender: "David Nguyen", sends: 2740, opened: 2108, clicks: 621, views: 1812, watched: 1345, finished: 1098, ctaClicks: 534 },
];

const FUNNEL_DATA = [
  { label: "Sent",        value: 26945, icon: Mail,              color: TV.brand },
  { label: "Opened",      value: 19480, icon: MousePointerClick, color: "#6d3fa0" },
  { label: "Watched",     value: 15938, icon: Play,              color: "#5e2d8e" },
  { label: "Finished",    value: 11830, icon: CheckCircle,       color: "#4e2378" },
  { label: "CTA Clicked", value: 4630,  icon: ExternalLink,      color: "#3e1a62" },
];

// ── Shared sub-components ─────────────────────────────────────────────────────

// DashCard, ChartBox, and DRAWER_STYLES imported from ./shared

// ── Component ─────────────────────────────────────────────────────────────────

export function VisualizationsTab() {
  const [geoBreakout, setGeoBreakout] = useState<"city" | "state" | "country">("city");
  const [geoDrilldown, setGeoDrilldown] = useState<{ label: string; type: "state" | "country" | "city"; value: string } | null>(null);
  const [drillSearch, setDrillSearch] = useState("");
  const [geoTableOpen, setGeoTableOpen] = useState(true);

  // Reset search when drill target changes
  const openDrill = (d: typeof geoDrilldown) => { setDrillSearch(""); setGeoDrilldown(d); };

  // Aggregate geo data by breakout level
  const geoAggregated = useMemo(() => {
    const map = new Map<string, { label: string; clicks: number; views: number; finished: number; ctaClicks: number; filterKey: string; filterType: "city" | "state" | "country" }>();
    for (const g of GEO_DATA) {
      const key = geoBreakout === "city" ? `${g.city}|${g.state}|${g.country}` : geoBreakout === "state" ? `${g.state}|${g.country}` : g.country;
      const label = geoBreakout === "city" ? `${g.city}, ${g.state}`
        : geoBreakout === "state" ? `${STATE_NAMES[g.state] || g.state} (${g.country})`
        : (COUNTRY_NAMES[g.country] || g.country);
      const existing = map.get(key);
      if (existing) {
        existing.clicks += g.clicks;
        existing.views += g.views;
        existing.finished += g.finished;
        existing.ctaClicks += g.ctaClicks;
      } else {
        map.set(key, { label, clicks: g.clicks, views: g.views, finished: g.finished, ctaClicks: g.ctaClicks, filterKey: key, filterType: geoBreakout });
      }
    }
    return [...map.values()].sort((a, b) => b.views - a.views);
  }, [geoBreakout]);

  // Drilldown recipients — all matching
  const drillRecipients = useMemo(() => {
    if (!geoDrilldown) return [];
    return GEO_RECIPIENTS.filter(r => {
      if (geoDrilldown.type === "state") return r.state === geoDrilldown.value;
      if (geoDrilldown.type === "country") return r.country === geoDrilldown.value;
      return `${r.city}|${r.state}|${r.country}` === geoDrilldown.value;
    });
  }, [geoDrilldown]);

  // Filtered by search
  const filteredDrillRecipients = useMemo(() => {
    if (!drillSearch.trim()) return drillRecipients;
    const q = drillSearch.toLowerCase();
    return drillRecipients.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      r.city.toLowerCase().includes(q) ||
      r.state.toLowerCase().includes(q)
    );
  }, [drillRecipients, drillSearch]);

  // Star bar colors (gradient from light to dark purple)
  const STAR_COLORS = ["#d4c5e8", "#b99ed6", "#9a73c4", TV.brand, "#5e2d8e"];
  const totalEngagement = ENGAGEMENT_SCORE_DATA.reduce((s, d) => s + d.count, 0);

  return (
    <>
      {/* Geographic map — Global */}
      <DashCard className="p-4 sm:p-5 mb-4">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <Text fz={14} fw={700} c={TV.textPrimary}>Recipient Locations</Text>
          <Text fz={11} c={TV.textSecondary}>Click a country or row below to view recipients</Text>
        </div>
        <div className="relative rounded-lg overflow-hidden" style={{ height: 380, backgroundColor: TV.surface }}>
          <WorldMap
            countryValues={GEO_RECIPIENTS.reduce<Record<string, number>>((acc, r) => {
              acc[r.country] = (acc[r.country] || 0) + 1;
              return acc;
            }, {})}
            cityDots={(() => {
              const cityMap = new Map<string, number>();
              for (const r of GEO_RECIPIENTS) {
                cityMap.set(r.city, (cityMap.get(r.city) || 0) + 1);
              }
              return [...cityMap.entries()].map(([city, count]) => ({ city, count }));
            })()}
            color={TV.brand}
            valueLabel="recipients"
            onRegionClick={(countryCode, countryName) => {
              openDrill({ label: countryName, type: "country", value: countryCode });
            }}
          />
        </div>
        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-tv-brand" /><Text fz={10} c={TV.textSecondary}>Dot size = relative recipients</Text></div>
          <div className="flex items-center gap-1.5"><div className="w-5 h-2.5 rounded-sm bg-gradient-to-r from-[#ede9f5] to-tv-brand" /><Text fz={10} c={TV.textSecondary}>Country fill = recipient density</Text></div>
          <Text fz={10} c={TV.textSecondary}>Scroll to zoom · drag to pan</Text>
        </div>
      </DashCard>

      {/* Geographic table breakdown */}
      <DashCard className="mb-4">
        <button
          className="flex items-center justify-between w-full p-4 sm:p-5 cursor-pointer"
          onClick={() => setGeoTableOpen(prev => !prev)}
        >
          <div className="flex items-center gap-3">
            <Text fz={14} fw={700} c={TV.textPrimary}>Geographic Breakdown</Text>
            <Text fz={11} c={TV.textSecondary}>{geoAggregated.length} locations</Text>
          </div>
          <ChevronDown
            size={16}
            style={{
              color: TV.textSecondary,
              transition: "transform 200ms ease",
              transform: geoTableOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>
        {geoTableOpen && (
          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
            <div className="flex items-center justify-end mb-3">
              <SegmentedControl value={geoBreakout} onChange={v => setGeoBreakout(v as any)} radius="xl" color="tvPurple" size="xs"
                data={[{ value: "city", label: "City" }, { value: "state", label: "State" }, { value: "country", label: "Country" }]}
                styles={{ root: { backgroundColor: TV.surface, border: "none" } }}
              />
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-2.5 bg-tv-surface-muted rounded-t-[10px] border-b text-[11px] font-semibold uppercase tracking-[0.04em] [&>span]:whitespace-nowrap" style={{ borderColor: TV.borderDivider, color: TV.textSecondary }}>
                  <span>{geoBreakout === "city" ? "City" : geoBreakout === "state" ? "State" : "Country"}</span>
                  <span>Clicks</span><span>Views</span><span>Finished</span><span>CTA</span>
                </div>
                {geoAggregated.map((g, i) => (
                  <button
                    key={i}
                    className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-2.5 border-b last:border-b-0 items-center w-full text-left transition-colors hover:bg-tv-surface-muted"
                    style={{ borderColor: TV.borderDivider }}
                    onClick={(e) => {
                      e.stopPropagation();
                      const parts = g.filterKey.split("|");
                      if (g.filterType === "city") {
                        openDrill({ label: g.label, type: "city", value: g.filterKey });
                      } else if (g.filterType === "state") {
                        openDrill({ label: g.label, type: "state", value: parts[0] });
                      } else {
                        openDrill({ label: g.label, type: "country", value: parts[0] });
                      }
                    }}
                  >
                    <div className="flex items-center gap-2 flex-nowrap">
                      <MapPin size={11} style={{ color: TV.brand }} className="shrink-0" />
                      <Text fz={12} fw={600} c={TV.textPrimary}>{g.label}</Text>
                    </div>
                    <Text fz={12} c={TV.textPrimary}>{g.clicks.toLocaleString()}</Text>
                    <Text fz={12} c={TV.textPrimary}>{g.views.toLocaleString()}</Text>
                    <Text fz={12} c={TV.textPrimary}>{g.finished.toLocaleString()}</Text>
                    <Text fz={12} c={TV.textPrimary}>{g.ctaClicks.toLocaleString()}</Text>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DashCard>

      {/* Geo Drilldown Drawer */}
      <Drawer opened={!!geoDrilldown} onClose={() => setGeoDrilldown(null)} position="right" size="lg" title={`Recipients — ${geoDrilldown?.label ?? ""}`} styles={DRAWER_STYLES}>
        {geoDrilldown && (() => {
          const all = drillRecipients;
          const shown = filteredDrillRecipients;
          const openedCount = all.filter(r => r.opened).length;
          const watchedCount = all.filter(r => r.watched).length;
          const ctaCount = all.filter(r => r.ctaClicked).length;
          return (
            <div>
              {/* Summary stats */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
                <div>
                  <Text fz={11} c={TV.textSecondary}>Recipients</Text>
                  <Text fz={16} fw={700} c={TV.textPrimary}>{all.length}</Text>
                </div>
                <div>
                  <Text fz={11} c={TV.textSecondary}>Opened</Text>
                  <Text fz={16} fw={700} c={TV.textPrimary}>{openedCount} <Text component="span" fz={11} c={TV.textSecondary}>({all.length > 0 ? ((openedCount / all.length) * 100).toFixed(0) : 0}%)</Text></Text>
                </div>
                <div>
                  <Text fz={11} c={TV.textSecondary}>Watched</Text>
                  <Text fz={16} fw={700} c={TV.textPrimary}>{watchedCount} <Text component="span" fz={11} c={TV.textSecondary}>({all.length > 0 ? ((watchedCount / all.length) * 100).toFixed(0) : 0}%)</Text></Text>
                </div>
                <div>
                  <Text fz={11} c={TV.textSecondary}>CTA Clicked</Text>
                  <Text fz={16} fw={700} c={TV.textPrimary}>{ctaCount} <Text component="span" fz={11} c={TV.textSecondary}>({all.length > 0 ? ((ctaCount / all.length) * 100).toFixed(0) : 0}%)</Text></Text>
                </div>
              </div>

              <div className="border-b mb-3" style={{ borderColor: TV.borderDivider }} />

              {/* Search */}
              <TextInput
                placeholder="Search by name, email, or location…"
                leftSection={<Search size={14} style={{ color: TV.textSecondary }} />}
                value={drillSearch}
                onChange={e => setDrillSearch(e.currentTarget.value)}
                size="xs"
                radius="md"
                mb="sm"
                styles={{
                  input: { borderColor: TV.borderLight, fontSize: 12 },
                }}
              />

              {/* Result count */}
              {drillSearch.trim() && (
                <Text fz={11} c={TV.textSecondary} mb="xs">
                  Showing {shown.length} of {all.length} recipient{all.length !== 1 ? "s" : ""}
                </Text>
              )}

              {/* Table */}
              <div className="overflow-x-auto">
                <div className="min-w-[480px]">
                  <div className="grid grid-cols-[2fr_1.5fr_80px_80px_80px] gap-3 px-5 py-2.5 bg-tv-surface-muted rounded-t-[10px] border-b text-[11px] font-semibold uppercase tracking-[0.04em] [&>span]:whitespace-nowrap" style={{ borderColor: TV.borderDivider, color: TV.textSecondary }}>
                    <span>Name</span><span>Location</span><span>Opened</span><span>Watched</span><span>CTA</span>
                  </div>
                  {shown.length === 0 && (
                    <div className="flex items-center justify-center py-8">
                      <Text fz={12} c={TV.textSecondary}>
                        {drillSearch.trim() ? "No recipients match your search" : "No recipients found in this region"}
                      </Text>
                    </div>
                  )}
                  {shown.map((r, i) => (
                    <div key={i} className="grid grid-cols-[2fr_1.5fr_80px_80px_80px] gap-3 px-5 py-2.5 border-b last:border-b-0 items-center" style={{ borderColor: TV.borderDivider }}>
                      <div>
                        <Link
                          to={`/recipients/${r.email.split("@")[0]}`}
                          className="no-underline transition-colors hover:underline"
                          style={{ color: TV.textBrand }}
                        >
                          <Text fz={12} fw={600} c={TV.textBrand}>{r.name}</Text>
                        </Link>
                        <Text fz={10} c={TV.textSecondary}>{r.email}</Text>
                      </div>
                      <Text fz={11} c={TV.textSecondary}>{r.city}, {r.state}</Text>
                      <div>{r.opened ? <Badge size="xs" color="green" variant="light">Yes</Badge> : <Badge size="xs" color="gray" variant="light">No</Badge>}</div>
                      <div>{r.watched ? <Badge size="xs" color="green" variant="light">Yes</Badge> : <Badge size="xs" color="gray" variant="light">No</Badge>}</div>
                      <div>{r.ctaClicked ? <Badge size="xs" color="green" variant="light">Yes</Badge> : <Badge size="xs" color="gray" variant="light">No</Badge>}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </Drawer>

      {/* Device + Funnel | Engagement Score — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div className="flex flex-col gap-4 min-w-0">
          <DashCard className="p-4 sm:p-5">
            <Text fz={14} fw={700} c={TV.textPrimary} mb="sm">Device Breakdown</Text>
            <div className="flex items-center gap-5">
              <RPieChart id="device-pie" width={120} height={120}>
                <Pie key="pie" data={DEVICE_DATA} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={3} dataKey="value">
                  {DEVICE_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </RPieChart>
              <div className="flex-1 space-y-3">
                {DEVICE_DATA.map(d => {
                  const Icon = DEVICE_ICON[d.name] || Globe;
                  return (
                    <div key={d.name} className="flex items-center gap-2.5">
                      <Icon size={13} style={{ color: d.color }} />
                      <Text fz={12} fw={600} c={TV.textPrimary} className="flex-1">{d.name}</Text>
                      <Text fz={12} fw={700} c={TV.textPrimary}>{d.value}%</Text>
                    </div>
                  );
                })}
              </div>
            </div>
          </DashCard>

          <DashCard className="p-4 sm:p-5">
            <Text fz={14} fw={700} c={TV.textPrimary} mb={4}>Video Engagement Funnel</Text>
            <Text fz={11} c={TV.textSecondary} mb="md">Drop-off across each stage</Text>
            <div className="space-y-2">
              {FUNNEL_DATA.map((step, i) => {
                const Icon = step.icon;
                const barPct = (step.value / FUNNEL_DATA[0].value) * 100;
                const prevValue = i > 0 ? FUNNEL_DATA[i - 1].value : null;
                const dropPct = prevValue ? (((prevValue - step.value) / prevValue) * 100).toFixed(0) : null;
                return (
                  <div key={step.label}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Icon size={12} style={{ color: step.color }} />
                        <Text fz={12} fw={600} c={TV.textPrimary}>{step.label}</Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Text fz={12} fw={700} c={TV.textPrimary}>{step.value.toLocaleString()}</Text>
                        {dropPct && (
                          <Text fz={10} c={TV.textSecondary}>-{dropPct}%</Text>
                        )}
                      </div>
                    </div>
                    <div className="h-[14px] rounded-[5px] overflow-hidden" style={{ backgroundColor: TV.borderLight }}>
                      <div
                        className="h-full rounded-[5px] transition-all"
                        style={{ width: `${Math.max(barPct, 2)}%`, backgroundColor: step.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: TV.borderDivider }}>
              <Text fz={11} c={TV.textSecondary}>Overall Conversion</Text>
              <Text fz={14} fw={700} c={TV.textPrimary}>
                {((FUNNEL_DATA[FUNNEL_DATA.length - 1].value / FUNNEL_DATA[0].value) * 100).toFixed(1)}%
              </Text>
            </div>
          </DashCard>
        </div>

        <DashCard className="p-5 sm:p-6 min-w-0 flex flex-col">
          <Text fz={14} fw={700} c={TV.textPrimary} mb={4}>Engagement Score Distribution</Text>
          <Text fz={11} c={TV.textSecondary} mb="lg">{totalEngagement.toLocaleString()} total recipients rated</Text>
          <div className="flex-1 flex flex-col justify-center space-y-5">
            {ENGAGEMENT_SCORE_DATA.map((d) => {
              const maxCount = Math.max(...ENGAGEMENT_SCORE_DATA.map(x => x.count));
              const barPct = (d.count / maxCount) * 100;
              return (
                <div key={d.stars}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <Star key={si} size={13} fill={si < d.stars ? STAR_COLORS[d.stars - 1] : "none"} stroke={si < d.stars ? STAR_COLORS[d.stars - 1] : TV.borderStrong} strokeWidth={1.5} />
                        ))}
                      </div>
                      <Text fz={11} c={TV.textSecondary} ml={4}>{d.label}</Text>
                    </div>
                    <div className="flex items-center gap-2">
                      <Text fz={13} fw={700} c={TV.textPrimary}>{d.count.toLocaleString()}</Text>
                      <Text fz={11} c={TV.textSecondary} className="w-[38px] text-right">{d.pct}%</Text>
                    </div>
                  </div>
                  <div className="h-[30px] rounded-sm overflow-hidden" style={{ backgroundColor: TV.borderLight }}>
                    <div
                      className="h-full rounded-sm transition-all"
                      style={{ width: `${Math.max(barPct, 3)}%`, backgroundColor: STAR_COLORS[d.stars - 1] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: TV.borderDivider }}>
            <Text fz={11} c={TV.textSecondary}>Avg Score</Text>
            <div className="flex items-center gap-1.5">
              <Text fz={14} fw={700} c={TV.textPrimary}>{(ENGAGEMENT_SCORE_DATA.reduce((s, d) => s + d.stars * d.count, 0) / totalEngagement).toFixed(1)}</Text>
              <Star size={14} fill={TV.brand} stroke={TV.brand} />
            </div>
          </div>
        </DashCard>
      </div>

      {/* Age — combined chart with recipients + avg engagement */}
      <DashCard className="p-4 sm:p-5 mb-4">
        <Text fz={14} fw={700} c={TV.textPrimary} mb="sm">Recipients & Engagement by Age</Text>
        <ChartBox height={180}>
          {(w, h) => (
          <ComposedChart id="age-engagement" width={w} height={h} data={AGE_DATA}>
            <CartesianGrid key="grid" vertical={false} strokeDasharray="3 3" stroke={TV.borderLight} />
            <XAxis key="xaxis" dataKey="age" tick={{ fill: TV.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis key="yaxis-left" yAxisId="left" tick={{ fill: TV.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis key="yaxis-right" yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: TV.textSecondary, fontSize: 11 }} axisLine={false} tickLine={false} />
            <RTooltip key="tooltip" contentStyle={{ borderRadius: 10, border: `1px solid ${TV.borderLight}`, fontSize: 12 }} />
            <Bar key="bar" yAxisId="left" dataKey="recipients" fill={TV.info} name="Recipients" radius={[6, 6, 0, 0]} />
            <Line key="line" yAxisId="right" type="monotone" dataKey="engagementAvg" stroke={TV.success} strokeWidth={2.5} dot={{ fill: TV.success, r: 3, strokeWidth: 0 }} name="Avg Engagement %" />
          </ComposedChart>
          )}
        </ChartBox>
        <div className="flex items-center justify-center gap-6 mt-2">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-tv-info" /><Text fz={11} c={TV.textSecondary}>Recipients (left axis)</Text></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-0.5 rounded bg-tv-success" /><Text fz={11} c={TV.textSecondary}>Avg Engagement % (right axis)</Text></div>
        </div>
      </DashCard>

      {/* Sender breakdown */}
      <DashCard className="p-4 sm:p-5">
        <Text fz={14} fw={700} c={TV.textPrimary} mb="sm">Engagement by Sender</Text>
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-2.5 bg-tv-surface-muted rounded-t-[10px] border-b text-[11px] font-semibold uppercase tracking-[0.04em] [&>span]:whitespace-nowrap" style={{ borderColor: TV.borderDivider, color: TV.textSecondary }}>
              <span>Sender</span><span>Sent</span><span>Opened</span><span>Clicked</span><span>Views</span><span>Watched</span><span>Finished</span><span>CTA</span>
            </div>
            {SENDER_DATA.map((s, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-5 py-2.5 border-b last:border-b-0 items-center" style={{ borderColor: TV.borderDivider }}>
                <div className="flex items-center gap-2 flex-nowrap">
                  <Avatar radius="xl" size="xs" color="tvPurple">{s.sender.split(" ").map(n => n[0]).join("")}</Avatar>
                  <Text fz={12} fw={600} c={TV.textPrimary}>{s.sender}</Text>
                </div>
                <Text fz={12} c={TV.textPrimary}>{s.sends.toLocaleString()}</Text>
                <div>
                  <Text fz={12} c={TV.textPrimary}>{s.opened.toLocaleString()}</Text>
                  <Text fz={10} c={TV.textSecondary}>{((s.opened / s.sends) * 100).toFixed(0)}%</Text>
                </div>
                <Text fz={12} c={TV.textPrimary}>{s.clicks.toLocaleString()}</Text>
                <Text fz={12} c={TV.textPrimary}>{s.views.toLocaleString()}</Text>
                <div>
                  <Text fz={12} c={TV.textPrimary}>{s.watched.toLocaleString()}</Text>
                  <Text fz={10} c={TV.textSecondary}>{((s.watched / s.sends) * 100).toFixed(0)}%</Text>
                </div>
                <Text fz={12} c={TV.textPrimary}>{s.finished.toLocaleString()}</Text>
                <Text fz={12} c={TV.textPrimary}>{s.ctaClicks.toLocaleString()}</Text>
              </div>
            ))}
          </div>
        </div>
      </DashCard>
    </>
  );
}
