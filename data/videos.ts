import { fmtSec } from "../utils";

// ── Shared Video Types ────────────────────────────────────────────────────────
export interface CaptionLine {
  id: number;
  start: string;
  end: string;
  text: string;
}

export interface CropRect {
  x: number;      // percentage 0–100
  y: number;
  width: number;
  height: number;
}

export interface VideoItem {
  id: number;
  title: string;
  duration: string;
  durationSec: number;
  originalDurationSec: number;
  trimStart: number;
  trimEnd: number;
  isTrimmed: boolean;
  date: string;
  dateCreated: string;
  dateModified: string;
  views: number;
  folder: string;
  thumb: "purple" | "teal" | "green" | "orange" | "red";
  thumbnailSaved: boolean;
  thumbnailTime: number;
  thumbnailImage: string | null;
  processing?: boolean;
  tags: string[];
  creator: string;
  isReply: boolean;
  archived: boolean;
  favorited: boolean;
  description: string;
  recipient: string;
  captions: CaptionLine[];
  captionSource: "ai" | "upload" | "rev" | "none";
  rotation: 0 | 90 | 180 | 270;
  crop: CropRect | null;
  videoType: "clip" | "campaign";
}

// ── Constants ─────────────────────────────────────────────────────────────────
export const DEFAULT_CAPTIONS: CaptionLine[] = [
  { id: 1, start: "0:00", end: "0:04", text: "Hi there, thanks so much for your support." },
  { id: 2, start: "0:05", end: "0:10", text: "Your generosity means the world to our students." },
  { id: 3, start: "0:11", end: "0:18", text: "We couldn't do this without donors like you." },
];

export const THUMB_CLASSES: Record<string, string> = {
  purple: "from-[#7c45b0] to-[#995cd3]",
  teal:   "from-[#0090bb] to-[#00C0F5]",
  green:  "from-[#0e8a45] to-[#16b364]",
  orange: "from-[#c97c0a] to-[#F59E0B]",
  red:    "from-[#991b1b] to-[#ef4444]",
};

export const TAG_LABELS: Record<string, string> = {
  "thank-you": "Thank You",
  "solicitation": "Appeals",
  "video-request": "Video Request",
  "event": "Event",
  "updates": "Updates",
  "birthdays": "Birthdays",
  "anniversaries": "Anniversaries",
  "endowment-reports": "Endowment",
  "career-moves": "Career Moves",
  "other": "Other",
};

export const CREATORS = ["Kelley Molt", "Emma Chen", "David Ross", "Sarah Kim"];

export const FOLDERS = ["Thank You Videos", "Solicitation 2025", "Replies", "Onboarding", "Events", "Stewardship"];
export const FOLDERS_WITH_ALL = ["All Videos", ...FOLDERS];

// ── Video Generation ──────────────────────────────────────────────────────────
const RECIPIENT_NAMES = [
  "Margaret Williams", "Robert Chen", "Patricia Morrison", "David Nakamura", "Susan Bradley",
  "James Fitzgerald", "Linda Okonkwo", "Michael Torres", "Barbara Johansson", "Richard Park",
  "Jennifer Ashworth", "Thomas Blackwell", "Maria Gonzalez", "Christopher Lee", "Nancy Whitfield",
  "Daniel Kowalski", "Sarah Bergman", "Matthew Reeves", "Elizabeth Dumont", "Andrew Sinclair",
  "Karen Yamamoto", "Joseph Hartley", "Lisa Fernandez", "Steven Katz", "Dorothy Chambers",
  "Paul Nguyen", "Sandra Rossi", "Mark Ellison", "Ashley Dubois", "Brian Callahan",
  "Cynthia Ramsey", "Kevin Sato", "Donna Petrov", "George Underwood", "Michelle Chang",
  "Edward Morales", "Amanda Schultz", "Ronald Haines", "Deborah Lund", "Timothy Gupta",
  "Stephanie Barlow", "Jason Volkov", "Rebecca Tillman", "Gary Stein", "Laura Whitmore",
  "Jeffrey Pham", "Christine Erickson", "Ryan Delgado", "Kathleen Frost", "Scott Bhatnagar",
  "Heather O'Brien", "Benjamin Lam", "Angela Strauss", "Dennis Ramirez", "Amy Tanaka",
  "Gregory Bowman", "Melissa Forster", "Kenneth Choi", "Brenda Marchetti", "Joshua Ivanov",
  "Virginia Holloway", "Patrick Sung", "Carol Wexler", "Raymond Nair", "Samantha Byrne",
  "Henry Castellano", "Martha Lindgren", "Jack Osei", "Julia Pemberton", "Albert Chandra",
];

const CLIP_TITLES_PERSONAL = [
  "Thank You", "Birthday Greeting", "Congrats on Your Gift", "Welcome to the Family",
  "Scholarship Update", "Year-End Thanks", "Giving Day Shoutout", "Donor Anniversary",
  "Event Follow-Up", "Personal Note", "Holiday Greeting", "Impact Update",
  "Milestone Celebration", "Homecoming Invite", "Reunion Recap", "Endowment Report",
  "Stewardship Check-In", "Career Congrats", "New Baby Congrats", "Retirement Wishes",
];

const CLIP_TITLES_UNIVERSAL = [
  "Welcome Message – Class of 2026", "Annual Fund Thank You", "Matching Gift Challenge",
  "New Student Orientation Welcome", "Holiday Season Greeting", "Giving Tuesday Reminder",
  "Spring Thank You (All Donors)", "Alumni Weekend Recap", "Dean's Welcome Message",
  "President's Year-End Address", "Faculty Spotlight Intro", "Campus Tour Highlight",
  "Student Ambassador Welcome", "Volunteer Appreciation", "Phonathon Thank You",
  "First-Gen Student Shoutout", "Transfer Student Welcome", "Graduate Program Intro",
  "Athletics Season Opener", "Library Renovation Update", "Research Lab Tour Clip",
  "Sustainability Initiative Clip", "Mental Health Awareness Clip", "Study Abroad Promo",
  "Commencement Teaser", "Founders Day Greeting", "Diversity & Inclusion Message",
  "Emergency Fund Update", "Parent & Family Weekend Clip", "Move-In Day Welcome",
];

const CAMPAIGN_TITLES = [
  "Campaign Kick-off – Spring 2026", "Board Member Spotlight", "Scholarship Impact Story 2025",
  "Annual Fund Drive 2026", "Homecoming 2025 Recap", "Giving Day Campaign",
  "Year-End Appeal 2025", "Spring Solicitation 2026", "Major Gifts Initiative",
  "Planned Giving Introduction", "Student Testimonial Series", "Faculty Research Highlights",
  "Capital Campaign Launch", "Endowment Growth Report", "Alumni Engagement Series",
  "Donor Wall Unveiling", "Scholarship Gala Promo", "Heritage Society Welcome",
  "Leadership Giving Circle", "Community Impact Reel", "Class Gift Challenge",
  "President's Circle Invite", "Reunion Giving Push", "Day of Giving Countdown",
  "Matching Gift Employer Promo", "Legacy Donors Tribute", "First-Year Experience",
  "Graduate Outcomes Report", "Athletics Fundraising Drive", "Arts & Culture Campaign",
  "STEM Initiative Launch", "Diversity Scholarship Fund", "Library Campaign Update",
  "Global Health Initiative", "Environmental Fund Kickoff", "Technology Upgrade Appeal",
  "Student Emergency Fund", "Regional Campaign – Northeast", "Regional Campaign – West Coast",
  "Regional Campaign – Southeast", "Regional Campaign – Midwest", "International Giving Appeal",
  "Parents Fund Spring Push", "Young Alumni Challenge", "Faculty Excellence Fund",
  "Mentorship Program Launch", "Internship Fund Appeal", "Campus Beautification Drive",
  "Innovation Lab Fundraiser", "Wellness Center Campaign",
];

const ALL_TAGS = ["thank-you", "solicitation", "video-request", "event", "updates", "birthdays", "anniversaries", "endowment-reports", "career-moves", "other"];
const THUMBS: VideoItem["thumb"][] = ["purple", "teal", "green", "orange", "red"];
const CAPTION_SOURCES: VideoItem["captionSource"][] = ["ai", "upload", "rev", "none"];
const ROTATIONS: VideoItem["rotation"][] = [0, 0, 0, 0, 0, 0, 0, 90, 180, 270];

function seededRand(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function generateVideos(): VideoItem[] {
  const rand = seededRand(42);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const pickN = <T,>(arr: T[], n: number): T[] => {
    const shuffled = [...arr].sort(() => rand() - 0.5);
    return shuffled.slice(0, n);
  };

  const months = [
    { month: "Mar", year: 2026, days: 13 },
    { month: "Feb", year: 2026, days: 28 },
    { month: "Jan", year: 2026, days: 31 },
    { month: "Dec", year: 2025, days: 31 },
    { month: "Nov", year: 2025, days: 30 },
    { month: "Oct", year: 2025, days: 31 },
    { month: "Sep", year: 2025, days: 30 },
    { month: "Aug", year: 2025, days: 31 },
    { month: "Jul", year: 2025, days: 31 },
  ];
  const makeDate = (idx: number) => {
    const mi = Math.min(Math.floor(idx / 25), months.length - 1);
    const m = months[mi];
    const day = Math.max(1, Math.min(m.days, Math.floor(rand() * m.days) + 1));
    return { short: `${m.month} ${day}`, full: `${m.month} ${day}, ${m.year} ${Math.floor(rand() * 12) + 1}:${String(Math.floor(rand() * 60)).padStart(2, "0")} ${rand() > 0.5 ? "AM" : "PM"}` };
  };

  const videos: VideoItem[] = [];
  let id = 1;

  // ~70 personal clips (have a recipient)
  for (let i = 0; i < 70; i++) {
    const recipient = RECIPIENT_NAMES[i % RECIPIENT_NAMES.length];
    const titleBase = CLIP_TITLES_PERSONAL[i % CLIP_TITLES_PERSONAL.length];
    const title = `${titleBase} – ${recipient.split(" ")[0]} ${recipient.split(" ")[1][0]}.`;
    const durationSec = Math.floor(rand() * 80) + 15;
    const origDur = durationSec + Math.floor(rand() * 15);
    const isTrimmed = rand() > 0.65;
    const trimStart = isTrimmed ? Math.floor(rand() * 5) : 0;
    const trimEnd = isTrimmed ? origDur - Math.floor(rand() * 5) : origDur;
    const d = makeDate(i);
    const rotation = pick(ROTATIONS);
    const hasCrop = rand() > 0.85;
    const isReply = rand() > 0.88;
    videos.push({
      id: id++, title, duration: fmtSec(durationSec), durationSec, originalDurationSec: origDur,
      trimStart, trimEnd, isTrimmed, date: d.short, dateCreated: d.full,
      dateModified: d.short, views: Math.floor(rand() * 300) + 1,
      folder: isReply ? "Replies" : pick(["Thank You Videos", "Stewardship", "Onboarding"]),
      thumb: pick(THUMBS), thumbnailSaved: rand() > 0.4, thumbnailTime: Math.floor(rand() * durationSec),
      thumbnailImage: null,
      tags: pickN(ALL_TAGS, Math.floor(rand() * 2) + 1),
      creator: pick(CREATORS), isReply, archived: rand() > 0.92,
      favorited: rand() > 0.85, description: `Personalized ${titleBase.toLowerCase()} video for ${recipient}.`,
      recipient, captions: rand() > 0.4 ? DEFAULT_CAPTIONS : [], captionSource: pick(CAPTION_SOURCES),
      rotation, crop: hasCrop ? { x: 10, y: 5, width: 80, height: 90 } : null, videoType: "clip",
    });
  }

  // ~70 universal clips (no recipient)
  for (let i = 0; i < 70; i++) {
    const title = CLIP_TITLES_UNIVERSAL[i % CLIP_TITLES_UNIVERSAL.length] + (i >= CLIP_TITLES_UNIVERSAL.length ? ` (v${Math.floor(i / CLIP_TITLES_UNIVERSAL.length) + 1})` : "");
    const durationSec = Math.floor(rand() * 60) + 18;
    const origDur = durationSec + Math.floor(rand() * 10);
    const isTrimmed = rand() > 0.7;
    const trimStart = isTrimmed ? Math.floor(rand() * 4) : 0;
    const trimEnd = isTrimmed ? origDur - Math.floor(rand() * 4) : origDur;
    const d = makeDate(i);
    const isReply = rand() > 0.92;
    videos.push({
      id: id++, title, duration: fmtSec(durationSec), durationSec, originalDurationSec: origDur,
      trimStart, trimEnd, isTrimmed, date: d.short, dateCreated: d.full,
      dateModified: d.short, views: Math.floor(rand() * 600) + 5,
      folder: pick(["Thank You Videos", "Solicitation 2025", "Onboarding", "Events"]),
      thumb: pick(THUMBS), thumbnailSaved: rand() > 0.35, thumbnailTime: Math.floor(rand() * durationSec),
      thumbnailImage: null,
      tags: pickN(ALL_TAGS, Math.floor(rand() * 2) + 1),
      creator: pick(CREATORS), isReply, archived: rand() > 0.93,
      favorited: rand() > 0.82, description: "", recipient: "",
      captions: rand() > 0.35 ? DEFAULT_CAPTIONS : [], captionSource: pick(CAPTION_SOURCES),
      rotation: pick(ROTATIONS), crop: rand() > 0.9 ? { x: 5, y: 10, width: 90, height: 80 } : null, videoType: "clip",
    });
  }

  // ~50 campaign videos
  for (let i = 0; i < 50; i++) {
    const title = CAMPAIGN_TITLES[i % CAMPAIGN_TITLES.length];
    const durationSec = Math.floor(rand() * 150) + 30;
    const origDur = durationSec + Math.floor(rand() * 20);
    const isTrimmed = rand() > 0.6;
    const trimStart = isTrimmed ? Math.floor(rand() * 8) : 0;
    const trimEnd = isTrimmed ? origDur - Math.floor(rand() * 8) : origDur;
    const d = makeDate(i);
    videos.push({
      id: id++, title, duration: fmtSec(durationSec), durationSec, originalDurationSec: origDur,
      trimStart, trimEnd, isTrimmed, date: d.short, dateCreated: d.full,
      dateModified: d.short, views: Math.floor(rand() * 1200) + 20,
      folder: pick(["Solicitation 2025", "Events", "Stewardship", "Thank You Videos"]),
      thumb: pick(THUMBS), thumbnailSaved: rand() > 0.3, thumbnailTime: Math.floor(rand() * durationSec),
      thumbnailImage: null,
      tags: pickN(ALL_TAGS, Math.floor(rand() * 3) + 1),
      creator: pick(CREATORS), isReply: false, archived: rand() > 0.9,
      favorited: rand() > 0.8, description: `Campaign video: ${title}.`,
      recipient: "", captions: rand() > 0.3 ? DEFAULT_CAPTIONS : [], captionSource: pick(CAPTION_SOURCES),
      rotation: pick(ROTATIONS), crop: null, videoType: "campaign",
    });
  }

  return videos;
}

export const INITIAL_VIDEOS: VideoItem[] = generateVideos();
