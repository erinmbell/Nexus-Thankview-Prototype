import {
  Mail, MessageSquare, Timer, GitBranch, Bell,
  Send, BarChart3, TriangleAlert, CircleAlert,
  Link2, Eye, Play, Check, Share2, Target,
  Download, Reply, X,
} from "lucide-react";

// ── Video Builder types ──────────────────────────────────────────────────────

/** Which sub-view the video builder is showing */
export type BuilderView =
  | "overview"
  | "intro-builder"
  | "personalized-recorder"
  | "shared-recording"
  | "outro-builder"
  | "overlay"
  | "library";

/** Toggle state for each video element */
export interface VideoElements {
  intro: boolean;
  personalizedClip: boolean;
  sharedVideo: boolean;
  outro: boolean;
}

export const DEFAULT_VIDEO_ELEMENTS: VideoElements = {
  intro: false,
  personalizedClip: false,
  sharedVideo: false,
  outro: false,
};

export const DEFAULT_ELEMENT_ORDER: (keyof VideoElements)[] = [
  "intro",
  "personalizedClip",
  "sharedVideo",
  "outro",
];

/** Lightweight video reference used by pickers and library grids */
export interface PickerVideo {
  id: number;
  title: string;
  duration: string;
  date: string;
  color: string;
}

export const PICKER_VIDEOS: PickerVideo[] = [
  { id: 1, title: "Spring Thank You Message",     duration: "1:32", date: "Feb 28, 2026", color: "from-[#7c45b0] to-[#7c45b0]" },
  { id: 2, title: "Scholarship Recipient Story",  duration: "2:15", date: "Feb 20, 2026", color: "from-[#1e3a8a] to-[#3b82f6]" },
  { id: 3, title: "Campus Tour Highlight",        duration: "1:48", date: "Jan 15, 2026", color: "from-[#374151] to-[#6b7280]" },
  { id: 4, title: "Purple Branded Intro",          duration: "0:08", date: "Jan 30, 2026", color: "from-[#6B21A8] to-[#a855f7]" },
  { id: 5, title: "Gratitude Outro with CTA",     duration: "0:12", date: "Jan 28, 2026", color: "from-[#b91c1c] to-[#dc2626]" },
  { id: 6, title: "End of Year Appeal",           duration: "3:05", date: "Dec 20, 2025", color: "from-[#14532d] to-[#22c55e]" },
  { id: 7, title: "Student Testimonial Reel",     duration: "2:41", date: "Dec 5, 2025",  color: "from-[#007c9e] to-[#00C0F5]" },
  { id: 8, title: "Alumni Networking Event Recap", duration: "1:55", date: "Nov 18, 2025", color: "from-[#b45309] to-[#b45309]" },
];

// Runtime field manifest for audit auto-detection (keys match FlowStep fields)
export const FLOW_STEP_FIELD_MANIFEST: string[] = [
  'id', 'type', 'label', 'description', 'automationEnabled', 'sendTimePreference',
  'waitDays', 'conditionField',
  'subject', 'body', 'senderName', 'senderEmail', 'replyTo', 'replyToList',
  'ccAddresses', 'bccAddresses', 'font', 'bodyFontFamily', 'bodyFontSize', 'bodyTextColor', 'bodyLineHeight', 'signatureId', 'envelopeId', 'thumbnailType', 'includeVideoThumbnail',
  'btnBg', 'btnText',
  'smsBody', 'smsPhoneNumber', 'smsReplyToPhone', 'smsAutoResponder',
  'attachedVideo', 'landingPageEnabled', 'landingPageId', 'lpModule',
  'ctaText', 'ctaUrl',
  'allowEmailReply', 'allowVideoReply', 'allowSaveButton', 'allowShareButton', 'allowDownloadVideo',
  'closedCaptionsEnabled', 'lpWhiteGradient',
  'envelopePreText', 'envelopePostText',
  'pdfFileName', 'pdfPages', 'pdfSize', 'pdfAllowDownload', 'pdfShareWithConstituents',
  'formUrl', 'formHeight', 'formFullWidth',
  'subscribeCta', 'language',
  'trueBranch', 'falseBranch',
  'vrDeliveryType', 'vrInstructions', 'vrInstructionVideoId', 'vrDueDate', 'vrReminderDays',
  'vrReminderEnabled', 'vrSubmissionsEnabled',
  'ogTitle', 'ogDescription', 'ogImage',
  'contactDateFieldId', 'contactFieldDaysBefore', 'contactFieldRecurAnnually',
  'contactFieldLeapYear', 'contactFieldSendTime',
];

// ── Flow step types ──────────────────────────────────────────────────────────
export type FlowStepType = "email" | "sms" | "wait" | "condition" | "exit" | "video-request";

export interface FlowStep {
  id: string;
  type: FlowStepType;
  label: string;
  description: string;
  automationEnabled: boolean;
  sendTimePreference: string;
  // Wait specific
  waitDays?: number;
  waitUntilDate?: string;
  // Condition specific
  conditionField?: string;
  // Email content
  subject?: string;
  body?: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: string;
  replyToList?: string[];       // Multiple reply-to addresses
  ccAddresses?: string;          // CC addresses (comma-separated, optional)
  bccAddresses?: string;         // BCC addresses (comma-separated, optional)
  font?: string;
  bodyFontFamily?: string;   // Email body font family (email-safe)
  bodyFontSize?: number;     // Email body font size in px
  bodyTextColor?: string;    // Email body text color
  bodyLineHeight?: number;   // Email body line-height multiplier
  signatureId?: number | null;  // Selected email signature ID
  envelopeId?: number;
  thumbnailType?: "envelope" | "static" | "animated";
  includeVideoThumbnail?: boolean; // Whether to include video thumbnail in email body
  btnBg?: string;
  btnText?: string;
  // SMS content
  smsBody?: string;
  smsPhoneNumber?: string;
  smsReplyToPhone?: string;
  smsAutoResponder?: string;
  smsQuietHours?: boolean;
  // Video attachment (for email/sms steps)
  attachedVideo?: { id: number; title: string; duration: string; color: string } | null;
  // Landing page
  landingPageEnabled?: boolean;
  landingPageId?: number;
  lpModule?: "none" | "cta" | "pdf" | "form";
  ctaText?: string;
  ctaUrl?: string;
  allowEmailReply?: boolean;
  allowVideoReply?: boolean;
  allowSaveButton?: boolean;    // Landing page Save button toggle
  allowShareButton?: boolean;   // Landing page Share button toggle
  allowDownloadVideo?: boolean; // Landing page Download Video toggle
  // Landing page closed captions
  closedCaptionsEnabled?: boolean;
  // Landing page white gradient overlay
  lpWhiteGradient?: boolean;
  // Envelope text before/after name area
  envelopePreText?: string;     // Text before the constituent name on envelope
  envelopePostText?: string;    // Text after the constituent name on envelope
  // PDF attachment for landing page
  pdfFileName?: string;
  pdfPages?: number;
  pdfSize?: string;
  pdfAllowDownload?: boolean;
  pdfShareWithConstituents?: boolean;
  // Form integration
  formUrl?: string;
  formHeight?: number;
  formFullWidth?: boolean;
  // Subscribe CTA toggle
  subscribeCta?: boolean;
  // Language for unsubscribe/button text
  language?: string;
  // Branch children (for conditions)
  trueBranch?: FlowStep[];
  falseBranch?: FlowStep[];
  // Video Request step fields
  vrDeliveryType?: "email" | "sms" | "link";
  vrInstructions?: string;
  vrInstructionVideoId?: number;
  vrInstructionVideoTitle?: string;
  vrInstructionVideoDuration?: string;
  vrInstructionVideoColor?: string;
  vrDueDate?: string;
  vrReminderDays?: number[];
  vrReminderEnabled?: boolean;
  vrSubmissionsEnabled?: boolean;
  vrIncludeLibraryVideo?: boolean;
  vrLibraryVideoId?: number;
  vrLibraryVideoTitle?: string;
  vrBrandedLandingPage?: number;
  vrShareableUrl?: string;
  // Social Sharing
  socialSharingEnabled?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  // ODDER / Endowment Report fields
  odderReportTabs?: OdderReportTab[];
  odderPassword?: string;
  odderPasswordEnabled?: boolean;
  odderLookbackEnabled?: boolean;
  odderRequestPrintEnabled?: boolean;
  odderCtaEnabled?: boolean;
  odderCtaText?: string;
  odderCtaUrl?: string;
  odderCcEnabled?: boolean;
  // Contact-date-field automation (per-step birthday/anniversary scheduling)
  contactDateFieldId?: ConstituentDateFieldId;
  contactFieldDaysBefore?: number;
  contactFieldRecurAnnually?: boolean;
  contactFieldLeapYear?: "feb28" | "mar1";
  contactFieldSendTime?: string;
}

// ── ODDER Report Tab ───────────────────────────────────────────────────────
export interface OdderReportTab {
  id: string;
  label: string;
  type: "variable" | "static";
  fileName?: string;
  fileSize?: string;
  pageCount?: number;
  matchedCount?: number;
  totalConstituents?: number;
}

// ── Emoji constants ────────────────────────────────────────────────────────
export const EMOJI_CATEGORIES = [
  { label: "Smileys", emojis: ["\u{1F600}","\u{1F60A}","\u{1F604}","\u{1F970}","\u{1F60D}","\u{1F917}","\u{1F60E}","\u{1F64C}","\u{1F44F}","\u2764\uFE0F","\u{1F49C}","\u{1F389}","\u{1F38A}","\u2728","\u2B50","\u{1F525}","\u{1F4AA}","\u{1F64F}","\u{1F44B}","\u{1F603}"] },
  { label: "Gestures", emojis: ["\u{1F44D}","\u{1F446}","\u270C\uFE0F","\u{1F91D}","\u{1F490}","\u{1F31F}","\u{1F3C6}","\u{1F4E3}","\u{1F4E2}","\u{1F381}","\u{1F393}","\u{1F4DA}","\u{1F3EB}","\u{1F4B0}","\u{1F929}","\u{1FAF6}","\u{1F440}","\u{1F942}","\u{1F37E}","\u{1F3AF}"] },
];

// ── Language options ────────────────────────────────────────────────────────
export const LANGUAGE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "fr-ca", label: "French (Canada)" },
  { id: "es", label: "Spanish" },
  { id: "pt", label: "Portuguese" },
  { id: "de", label: "German" },
  { id: "zh", label: "Chinese (Simplified)" },
  { id: "ja", label: "Japanese" },
  { id: "ko", label: "Korean" },
] as const;

export const FLOW_STEP_TYPES: { id: FlowStepType; label: string; icon: any; color: string; bg: string; desc: string }[] = [
  { id: "email",     label: "Email",     icon: Mail,          color: "text-tv-brand",   bg: "bg-tv-brand-tint", desc: "Send an email (with optional video)" },
  { id: "sms",       label: "SMS",       icon: MessageSquare, color: "text-tv-info",    bg: "bg-tv-info-bg",    desc: "Send a text message (with optional video)" },
  { id: "wait",      label: "Wait",      icon: Timer,         color: "text-tv-warning", bg: "bg-tv-warning-bg", desc: "Pause before next step" },
  { id: "condition", label: "Condition",  icon: GitBranch,     color: "text-tv-brand",   bg: "bg-tv-brand-tint",    desc: "Branch based on behavior" },
  { id: "video-request", label: "Video Request", icon: Bell, color: "text-tv-warning", bg: "bg-tv-warning-bg", desc: "Request a video from constituents" },
];

export interface ConditionOption {
  id: string;
  label: string;
  desc: string;
  channels?: ("email" | "sms")[]; // undefined = all channels
}

export const CONDITION_OPTIONS: ConditionOption[] = [
  { id: "email_opened",      label: "Email Opened?",              desc: "Check if the constituent opened the previous email", channels: ["email"] },
  { id: "responded_email",   label: "Responded to Email?",        desc: "Check if the constituent replied to the previous email", channels: ["email"] },
  { id: "sms_responded",     label: "Responded to SMS?",          desc: "Check if the constituent responded to the previous SMS", channels: ["sms"] },
  { id: "sms_viewed_link",   label: "Viewed Link in SMS?",        desc: "Check if the constituent tapped the link in the previous SMS", channels: ["sms"] },
  { id: "had_interaction",   label: "Had Interaction",             desc: "Check for a specific interaction type since the previous step" },
  { id: "made_gift",         label: "Made Gift",                   desc: "Check if the constituent made a gift since the previous step" },
  { id: "portfolio_stage",   label: "Moved into Portfolio Stage",  desc: "Check if the constituent moved to a specific portfolio stage" },
  { id: "saved_search",      label: "Qualified for Saved Search",  desc: "Check if the constituent matches a saved search criteria" },
];

/** Keep a flat string array for backward-compat with the drawer condition selector */
export const CONDITION_LABELS = CONDITION_OPTIONS.map(c => c.label);

export const WAIT_PRESETS = [1, 2, 3, 5, 7, 14, 30];

export function makeId() { return "s" + Math.random().toString(36).slice(2, 8); }

export const SMS_MAX = 160;

export const MERGE_FIELDS = ["{{first_name}}", "{{last_name}}", "{{gift_amount}}", "{{fund_name}}", "{{campaign_name}}", "{{sender_name}}"];

// ── Categorised merge-field registry ───────────────────────────────────────
export interface MergeFieldDef {
  /** Token as inserted, e.g. "{{first_name}}" */
  token: string;
  /** Human-readable label */
  label: string;
  /** Example output for preview */
  example: string;
}

export interface MergeFieldCategory {
  id: string;
  label: string;
  icon: string; // lucide icon name hint (used by the picker component)
  fields: MergeFieldDef[];
}

export const MERGE_FIELD_CATEGORIES: MergeFieldCategory[] = [
  {
    id: "contact",
    label: "Contact Info",
    icon: "User",
    fields: [
      { token: "{{first_name}}", label: "First Name", example: "Sarah" },
      { token: "{{last_name}}", label: "Last Name", example: "Chen" },
      { token: "{{full_name}}", label: "Full Name", example: "Sarah Chen" },
      { token: "{{preferred_name}}", label: "Preferred Name", example: "Sarah" },
      { token: "{{prefix}}", label: "Prefix / Title", example: "Ms." },
      { token: "{{suffix}}", label: "Suffix", example: "Jr." },
      { token: "{{nickname}}", label: "Nickname", example: "Sari" },
      { token: "{{salutation}}", label: "Salutation", example: "Dear Ms. Chen" },
      { token: "{{formal_salutation}}", label: "Formal Salutation", example: "Dear Ms. Sarah Chen" },
      { token: "{{email}}", label: "Email Address", example: "sarah.chen@example.com" },
      { token: "{{phone}}", label: "Phone", example: "(555) 123-4567" },
      { token: "{{mobile_phone}}", label: "Mobile Phone", example: "(555) 987-6543" },
      { token: "{{home_phone}}", label: "Home Phone", example: "(555) 111-2222" },
      { token: "{{gender}}", label: "Gender", example: "Female" },
      { token: "{{pronouns}}", label: "Pronouns", example: "she/her" },
      { token: "{{birthday}}", label: "Birthday", example: "March 15" },
      { token: "{{age}}", label: "Age", example: "42" },
      { token: "{{constituent_id}}", label: "Constituent ID", example: "CON-00482" },
    ],
  },
  {
    id: "address",
    label: "Address",
    icon: "MapPin",
    fields: [
      { token: "{{address_line_1}}", label: "Address Line 1", example: "123 Main Street" },
      { token: "{{address_line_2}}", label: "Address Line 2", example: "Apt 4B" },
      { token: "{{city}}", label: "City", example: "Hartford" },
      { token: "{{state}}", label: "State / Province", example: "CT" },
      { token: "{{zip}}", label: "ZIP / Postal Code", example: "06106" },
      { token: "{{country}}", label: "Country", example: "United States" },
      { token: "{{full_address}}", label: "Full Address (formatted)", example: "123 Main St, Hartford, CT 06106" },
      { token: "{{county}}", label: "County", example: "Hartford County" },
      { token: "{{region}}", label: "Region", example: "Northeast" },
    ],
  },
  {
    id: "giving",
    label: "Giving History",
    icon: "DollarSign",
    fields: [
      { token: "{{gift_amount}}", label: "Last Gift Amount", example: "$1,000" },
      { token: "{{last_gift_date}}", label: "Last Gift Date", example: "Dec 15, 2025" },
      { token: "{{last_gift_fund}}", label: "Last Gift Fund", example: "Annual Fund" },
      { token: "{{lifetime_giving}}", label: "Lifetime Giving", example: "$24,500" },
      { token: "{{giving_this_fy}}", label: "Giving This FY", example: "$2,500" },
      { token: "{{giving_last_fy}}", label: "Giving Last FY", example: "$3,000" },
      { token: "{{largest_gift}}", label: "Largest Gift", example: "$5,000" },
      { token: "{{largest_gift_date}}", label: "Largest Gift Date", example: "Jun 2023" },
      { token: "{{first_gift_date}}", label: "First Gift Date", example: "Sep 2010" },
      { token: "{{first_gift_amount}}", label: "First Gift Amount", example: "$50" },
      { token: "{{consecutive_years}}", label: "Consecutive Giving Years", example: "8" },
      { token: "{{total_gifts}}", label: "Total Number of Gifts", example: "32" },
      { token: "{{giving_level}}", label: "Giving Level / Society", example: "President's Circle" },
      { token: "{{pledge_balance}}", label: "Pledge Balance", example: "$2,000" },
      { token: "{{pledge_total}}", label: "Pledge Total", example: "$10,000" },
      { token: "{{pledge_start_date}}", label: "Pledge Start Date", example: "Jan 2025" },
      { token: "{{pledge_end_date}}", label: "Pledge End Date", example: "Dec 2029" },
      { token: "{{next_payment_date}}", label: "Next Payment Due", example: "Apr 1, 2026" },
      { token: "{{avg_gift}}", label: "Average Gift Amount", example: "$766" },
      { token: "{{donor_status}}", label: "Donor Status", example: "Active" },
      { token: "{{lybunt_status}}", label: "LYBUNT / SYBUNT", example: "LYBUNT" },
      { token: "{{matching_company}}", label: "Matching Gift Company", example: "Acme Corp" },
      { token: "{{matching_ratio}}", label: "Matching Ratio", example: "2:1" },
      { token: "{{fund_name}}", label: "Fund / Designation Name", example: "Scholarship Endowment" },
    ],
  },
  {
    id: "education",
    label: "Education & Affiliation",
    icon: "GraduationCap",
    fields: [
      { token: "{{class_year}}", label: "Class Year", example: "2005" },
      { token: "{{degree}}", label: "Degree", example: "B.A." },
      { token: "{{major}}", label: "Major", example: "Economics" },
      { token: "{{minor}}", label: "Minor", example: "Mathematics" },
      { token: "{{college}}", label: "College / School", example: "College of Arts & Sciences" },
      { token: "{{campus}}", label: "Campus", example: "Main Campus" },
      { token: "{{student_status}}", label: "Student Status", example: "Alumnus/a" },
      { token: "{{greek_org}}", label: "Greek Organization", example: "Alpha Phi" },
      { token: "{{athletics}}", label: "Athletics / Sport", example: "Men's Lacrosse" },
      { token: "{{activities}}", label: "Activities / Clubs", example: "Student Government" },
      { token: "{{residence_hall}}", label: "Residence Hall", example: "Morrison Hall" },
      { token: "{{graduation_date}}", label: "Graduation Date", example: "May 2005" },
      { token: "{{second_degree}}", label: "Second Degree", example: "M.B.A." },
      { token: "{{second_class_year}}", label: "Second Class Year", example: "2008" },
      { token: "{{honors}}", label: "Honors", example: "Magna Cum Laude" },
      { token: "{{mentor_name}}", label: "Mentor / Advisor", example: "Dr. Williams" },
    ],
  },
  {
    id: "employment",
    label: "Employment",
    icon: "Briefcase",
    fields: [
      { token: "{{employer}}", label: "Employer", example: "Acme Corporation" },
      { token: "{{job_title}}", label: "Job Title", example: "VP of Marketing" },
      { token: "{{industry}}", label: "Industry", example: "Technology" },
      { token: "{{work_email}}", label: "Work Email", example: "s.chen@acme.com" },
      { token: "{{work_phone}}", label: "Work Phone", example: "(555) 444-3333" },
      { token: "{{work_address}}", label: "Work Address", example: "456 Corporate Blvd" },
      { token: "{{linkedin_url}}", label: "LinkedIn URL", example: "linkedin.com/in/sarahchen" },
      { token: "{{retired}}", label: "Retired", example: "No" },
    ],
  },
  {
    id: "relationship",
    label: "Relationships",
    icon: "Users",
    fields: [
      { token: "{{spouse_name}}", label: "Spouse / Partner Name", example: "Michael Chen" },
      { token: "{{spouse_first_name}}", label: "Spouse First Name", example: "Michael" },
      { token: "{{spouse_class_year}}", label: "Spouse Class Year", example: "2006" },
      { token: "{{joint_salutation}}", label: "Joint Salutation", example: "Dear Sarah and Michael" },
      { token: "{{parent_name}}", label: "Parent Name", example: "Robert Chen" },
      { token: "{{child_name}}", label: "Child Name", example: "Emma Chen '28" },
      { token: "{{legacy_status}}", label: "Legacy Status", example: "Legacy Family" },
      { token: "{{relationship_mgr}}", label: "Relationship Manager", example: "James Okafor" },
      { token: "{{assigned_officer}}", label: "Assigned Gift Officer", example: "Kelley Molt" },
    ],
  },
  {
    id: "event",
    label: "Events & Engagement",
    icon: "Calendar",
    fields: [
      { token: "{{event_name}}", label: "Event Name", example: "Annual Gala 2026" },
      { token: "{{event_date}}", label: "Event Date", example: "April 18, 2026" },
      { token: "{{event_time}}", label: "Event Time", example: "6:00 PM" },
      { token: "{{event_location}}", label: "Event Location", example: "Grand Ballroom" },
      { token: "{{rsvp_status}}", label: "RSVP Status", example: "Confirmed" },
      { token: "{{rsvp_link}}", label: "RSVP Link", example: "https://events.hartwell.edu/rsvp" },
      { token: "{{table_number}}", label: "Table Number", example: "12" },
      { token: "{{guest_count}}", label: "Guest Count", example: "2" },
      { token: "{{last_event_attended}}", label: "Last Event Attended", example: "Reunion 2025" },
      { token: "{{volunteer_role}}", label: "Volunteer Role", example: "Class Agent" },
      { token: "{{committee}}", label: "Committee", example: "Campaign Steering" },
      { token: "{{board_member}}", label: "Board Member", example: "Yes" },
    ],
  },
  {
    id: "campaign",
    label: "Campaign & Sender",
    icon: "Send",
    fields: [
      { token: "{{campaign_name}}", label: "Campaign Name", example: "Spring Annual Fund Appeal" },
      { token: "{{sender_name}}", label: "Sender Name", example: "Kelley Molt" },
      { token: "{{sender_email}}", label: "Sender Email", example: "kelley.molt@hartwell.edu" },
      { token: "{{sender_title}}", label: "Sender Title", example: "Director of Annual Giving" },
      { token: "{{sender_phone}}", label: "Sender Phone", example: "(555) 100-2000" },
      { token: "{{organization_name}}", label: "Organization Name", example: "Hartwell University" },
      { token: "{{reply_to}}", label: "Reply-To Address", example: "giving@hartwell.edu" },
      { token: "{{giving_page_url}}", label: "Giving Page URL", example: "https://give.hartwell.edu" },
      { token: "{{video_link}}", label: "Video Link", example: "https://thankview.com/v/abc123" },
      { token: "{{landing_page_url}}", label: "Landing Page URL", example: "https://tv.hartwell.edu/lp1" },
    ],
  },
  {
    id: "system",
    label: "System & Dates",
    icon: "Settings",
    fields: [
      { token: "{{date_today}}", label: "Today's Date", example: "March 13, 2026" },
      { token: "{{current_year}}", label: "Current Year", example: "2026" },
      { token: "{{current_fy}}", label: "Current Fiscal Year", example: "FY26" },
      { token: "{{link}}", label: "ThankView Link", example: "https://thankview.com/\u2026" },
      { token: "{{unsubscribe_link}}", label: "Unsubscribe Link", example: "[unsubscribe]" },
      { token: "{{view_online_link}}", label: "View Online Link", example: "[view in browser]" },
      { token: "{{tracking_pixel}}", label: "Tracking Pixel", example: "[pixel]" },
      { token: "{{share_link}}", label: "Social Share Link", example: "https://thankview.com/share/\u2026" },
    ],
  },
  {
    id: "custom",
    label: "Custom Fields",
    icon: "Puzzle",
    fields: [
      { token: "{{custom_text_1}}", label: "Custom Text 1", example: "\u2014" },
      { token: "{{custom_text_2}}", label: "Custom Text 2", example: "\u2014" },
      { token: "{{custom_text_3}}", label: "Custom Text 3", example: "\u2014" },
      { token: "{{custom_text_4}}", label: "Custom Text 4", example: "\u2014" },
      { token: "{{custom_text_5}}", label: "Custom Text 5", example: "\u2014" },
      { token: "{{custom_number_1}}", label: "Custom Number 1", example: "\u2014" },
      { token: "{{custom_number_2}}", label: "Custom Number 2", example: "\u2014" },
      { token: "{{custom_date_1}}", label: "Custom Date 1", example: "\u2014" },
      { token: "{{custom_date_2}}", label: "Custom Date 2", example: "\u2014" },
      { token: "{{custom_boolean_1}}", label: "Custom Flag 1", example: "\u2014" },
      { token: "{{custom_boolean_2}}", label: "Custom Flag 2", example: "\u2014" },
      { token: "{{custom_url_1}}", label: "Custom URL 1", example: "\u2014" },
    ],
  },
];

// Flat list of all tokens (for validation, etc.)
export const ALL_MERGE_TOKENS = MERGE_FIELD_CATEGORIES.flatMap(c => c.fields.map(f => f.token));

export const LANDING_PAGES = [
  { id: 1, name: "Annual Fund Thank You", color: "#7c45b0", accent: "#a78bfa", image: "https://images.unsplash.com/photo-1769699369445-263a7a365df7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwY2FtcHVzJTIwYWVyaWFsJTIwdmlldyUyMGJ1aWxkaW5nc3xlbnwxfHx8fDE3NzI3Mzg5NTl8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 2, name: "Scholarship Impact Story", color: "#0369a1", accent: "#38bdf8", image: "https://images.unsplash.com/photo-1770827730835-221bd728c012?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb2xsZWdlJTIwY2FtcHVzJTIwYnJpY2slMjBidWlsZGluZ3MlMjBhdXR1bW58ZW58MXx8fHwxNzcyNzM4OTYwfDA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 3, name: "New Student Welcome", color: "#047857", accent: "#34d399", image: "https://images.unsplash.com/photo-1769283978529-07525b9db2f4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwbGVjdHVyZSUyMGhhbGwlMjBtb2Rlcm4lMjBidWlsZGluZ3xlbnwxfHx8fDE3NzI3Mzg5NjB8MA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 4, name: "Donor Appreciation Gala", color: "#b91c1c", accent: "#fca5a5", image: "https://images.unsplash.com/photo-1750128327271-d37dff37497d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkdWF0aW9uJTIwY2VyZW1vbnklMjBjZWxlYnJhdGlvbiUyMHN0YWdlfGVufDF8fHx8MTc3MjczODk2MXww&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 5, name: "Alumni Homecoming", color: "#7e22ce", accent: "#d8b4fe", image: "https://images.unsplash.com/photo-1757143137392-0b1e1a27a7de?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1bml2ZXJzaXR5JTIwYWx1bW5pJTIwZXZlbnQlMjBmb3JtYWwlMjBnYXRoZXJpbmd8ZW58MXx8fHwxNzcyNzM4OTY3fDA&ixlib=rb-4.1.0&q=80&w=400" },
  { id: 6, name: "Endowment Impact Report", color: "#0e7490", accent: "#67e8f9", image: "https://images.unsplash.com/photo-1759092912891-9f52486bb059?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB1bml2ZXJzaXR5JTIwcmVzZWFyY2glMjBsYWIlMjBzY2llbmNlfGVufDF8fHx8MTc3MjczODk3MXww&ixlib=rb-4.1.0&q=80&w=400" },
];

export const ENVELOPE_DESIGNS = [
  { id: 1, name: "Classic White", color: "#ffffff", accent: "#7c45b0", nameColor: "#1e293b", branded: false, lastUsed: "2026-03-01", category: "standard" as const },
  { id: 2, name: "Purple Branded", color: "#4a1d78", accent: "#c09fde", nameColor: "#f0e6ff", branded: true, lastUsed: "2026-02-27", category: "standard" as const },
  { id: 3, name: "Navy Formal", color: "#1b2a4a", accent: "#6889c4", nameColor: "#d4e0f7", branded: true, lastUsed: "2026-02-20", category: "standard" as const },
  { id: 4, name: "Gold Celebration", color: "#3d2b0a", accent: "#d4a843", nameColor: "#fef3d0", branded: true, lastUsed: "2026-01-15", category: "standard" as const },
  { id: 5, name: "Crimson University", color: "#751010", accent: "#c09696", nameColor: "#f7e0e0", branded: true, lastUsed: "2025-12-10", category: "standard" as const },
  { id: 6, name: "Forest Green", color: "#1a3c28", accent: "#6aab82", nameColor: "#d8f0e2", branded: true, lastUsed: "2025-11-22", category: "standard" as const },
  // Holiday templates
  { id: 101, name: "Winter Wonderland", color: "#1a3550", accent: "#7ec8e3", nameColor: "#d6eef8", branded: false, lastUsed: "2025-12-20", category: "holiday" as const, holidayType: "winter" as const },
  { id: 102, name: "Holiday Red & Gold", color: "#5c1010", accent: "#d4a843", nameColor: "#fce8e8", branded: false, lastUsed: "2025-12-18", category: "holiday" as const, holidayType: "christmas" as const },
  { id: 103, name: "Season's Greetings", color: "#1a3a22", accent: "#5cb87a", nameColor: "#d8f0e0", branded: false, lastUsed: "2025-12-15", category: "holiday" as const, holidayType: "greetings" as const },
  { id: 104, name: "Thanksgiving Harvest", color: "#3b2810", accent: "#c49250", nameColor: "#f5e6d0", branded: false, lastUsed: "2025-11-25", category: "holiday" as const, holidayType: "thanksgiving" as const },
  { id: 105, name: "Spring Celebration", color: "#4a1a3a", accent: "#d87aaf", nameColor: "#f8e0ef", branded: false, lastUsed: "2025-04-10", category: "holiday" as const, holidayType: "spring" as const },
  { id: 106, name: "Eid al-Fitr", color: "#1a2744", accent: "#c9a84c", nameColor: "#f5ecd4", branded: false, lastUsed: "2026-03-01", category: "holiday" as const, holidayType: "eid-fitr" as const },
  { id: 107, name: "Eid al-Adha", color: "#2d1a3e", accent: "#8ec8a0", nameColor: "#e8f5ee", branded: false, lastUsed: "2025-06-07", category: "holiday" as const, holidayType: "eid-adha" as const },
  // Legacy templates
  { id: 201, name: "Classic Ivory", color: "#f5f0e0", accent: "#8a6b2e", nameColor: "#3d2b0a", branded: false, lastUsed: "2025-09-15", category: "legacy" as const },
  { id: 202, name: "Traditional Navy", color: "#1e293b", accent: "#d4a843", nameColor: "#fef9ee", branded: false, lastUsed: "2025-08-20", category: "legacy" as const },
  { id: 203, name: "Heritage Burgundy", color: "#4c1d2e", accent: "#d4a07a", nameColor: "#fde8da", branded: false, lastUsed: "2025-07-10", category: "legacy" as const },
  { id: 204, name: "Parchment Gold", color: "#f5eed8", accent: "#8a6520", nameColor: "#3d2b0a", branded: false, lastUsed: "2025-06-01", category: "legacy" as const },
];

// ── Derived types from data constants ───────────────────────────────────────
/** Envelope design shape — derived from ENVELOPE_DESIGNS entries */
export type EnvelopeDesign = (typeof ENVELOPE_DESIGNS)[number];

/** Landing page shape — derived from LANDING_PAGES entries */
export type LandingPageDef = (typeof LANDING_PAGES)[number];

// ── Envelope builder constants (shared by CreateCampaign + EnvelopeBuilderModal) ─
export const ENV_COLORS = [
  { label: "Royal Purple", value: "#6B21A8", light: "#f3e8ff" },
  { label: "True Purple",  value: "#7c45b0", light: "#f0eafc" },
  { label: "Navy Blue",    value: "#1e3a8a", light: "#e0f0ff" },
  { label: "Forest Green", value: "#14532d", light: "#f0fdf4" },
  { label: "Crimson",      value: "#b91c1c", light: "#fef2f2" },
  { label: "Slate",        value: "#374151", light: "#f1f5f9" },
  { label: "Midnight",     value: "#1a1a2e", light: "#f0f0f8" },
  { label: "Teal",         value: "#0f766e", light: "#f0fdfa" },
];
export const ENV_TEXTURES  = ["None", "Linen", "Felt", "Marble", "Gradient"];
export const ENV_SEALS     = ["Wax Seal", "Emboss", "Ribbon", "Badge"];
export const ENV_FONTS     = ["Serif (Garamond)", "Sans-Serif (Inter)", "Script (Playfair)", "Modern (Montserrat)"];
export const ENV_GREETINGS = ["Dear {{first_name}},", "Hello {{first_name}},", "Hi {{first_name}},", "{{first_name}} \u2014"];

// ── Email-safe body fonts ───────────────────────────────────────────────────
export const EMAIL_BODY_FONTS = [
  { label: "Arial",               value: "Arial, Helvetica, Roboto, sans-serif" },
  { label: "Helvetica",           value: "Helvetica, Arial, Roboto, sans-serif" },
  { label: "Georgia",             value: "Georgia, Roboto, sans-serif" },
  { label: "Times New Roman",     value: "'Times New Roman', Times, Roboto, sans-serif" },
  { label: "Verdana",             value: "Verdana, Geneva, Roboto, sans-serif" },
  { label: "Tahoma",              value: "Tahoma, Geneva, Roboto, sans-serif" },
  { label: "Trebuchet MS",        value: "'Trebuchet MS', Helvetica, Roboto, sans-serif" },
  { label: "Courier New",         value: "'Courier New', Courier, Roboto, monospace" },
  { label: "Lucida Sans",         value: "'Lucida Sans Unicode', 'Lucida Grande', Roboto, sans-serif" },
  { label: "Palatino",            value: "'Palatino Linotype', 'Book Antiqua', Palatino, Roboto, sans-serif" },
  { label: "Garamond",            value: "Garamond, Baskerville, Roboto, sans-serif" },
] as const;

export const EMAIL_BODY_FONT_SIZES = [10, 11, 12, 13, 14, 15, 16, 18, 20, 24] as const;

export const EMAIL_BODY_LINE_HEIGHTS = [
  { label: "Tight (1.2)",   value: 1.2 },
  { label: "Normal (1.5)",  value: 1.5 },
  { label: "Relaxed (1.75)", value: 1.75 },
  { label: "Loose (2.0)",   value: 2.0 },
] as const;

export const EMAIL_TEXT_COLORS = [
  { label: "Default",   value: "#1e293b" },
  { label: "Black",     value: "#000000" },
  { label: "Dark Gray", value: "#374151" },
  { label: "Gray",      value: "#6b7280" },
  { label: "Navy",      value: "#1e3a5f" },
  { label: "Purple",    value: "#6B21A8" },
  { label: "Teal",      value: "#0f766e" },
  { label: "Forest",    value: "#166534" },
  { label: "Crimson",   value: "#b91c1c" },
  { label: "Brown",     value: "#78350f" },
] as const;

// ── Video Request constants ─────────────────────────────────────────────────
export const VR_DEFAULT_INSTRUCTIONS = "Record a short video (2 minutes max) sharing your experience. Make sure you're in a well-lit, quiet environment. Look at the camera and speak naturally. We'll take care of the rest!";

export const VR_RECORDING_TIPS = [
  "Find a quiet, well-lit space",
  "Look directly at the camera",
  "Keep it under 2 minutes",
  "Speak naturally \u2014 be yourself!",
  "A simple background works best",
];

// ── Constituent date fields (for schedule-by-constituent-field) ──────────────
export const CONSTITUENT_DATE_FIELDS = [
  { id: "birthday",        label: "Birthday",         icon: "Cake",         desc: "Send on each constituent's birthday" },
  { id: "anniversary",     label: "Anniversary",      icon: "CalendarDays", desc: "Send on donation or membership anniversary" },
  { id: "enrollment_date", label: "Enrollment Date",  icon: "GraduationCap", desc: "Send on enrollment anniversary" },
  { id: "graduation_date", label: "Graduation Date",  icon: "GraduationCap", desc: "Send on graduation anniversary" },
  { id: "hire_date",       label: "Hire Date",        icon: "Briefcase",    desc: "Send on work anniversary" },
  { id: "custom_date_1",   label: "Custom Date 1",    icon: "CalendarDays", desc: "Send on a custom date field" },
  { id: "custom_date_2",   label: "Custom Date 2",    icon: "CalendarDays", desc: "Send on a custom date field" },
] as const;
export type ConstituentDateFieldId = (typeof CONSTITUENT_DATE_FIELDS)[number]["id"];

// ── Flow phases for steps 5–8 of the single-step wizard ─────────────────────
export type FlowPhase = "video" | "constituents" | "scheduling" | "confirm";

// ── Success Metrics (shared by CreateCampaign + MultiStepBuilder) ───────────
export interface SuccessMetricDef {
  id: string;
  label: string;
  icon: any;
  category: "delivery" | "engagement" | "negative";
  channels?: ("email" | "sms" | "video-request")[]; // undefined = all channels
  description?: string; // Tooltip text explaining the metric
  benchmark?: string;   // "Good" benchmark for advancement
}

export const SUCCESS_METRICS: SuccessMetricDef[] = [
  { id: "sent",                label: "Sent",                   icon: Send,            category: "delivery", description: "Total messages dispatched to recipients", benchmark: "N/A — delivery metric" },
  { id: "delivered",           label: "Delivered",              icon: BarChart3,       category: "delivery", description: "Messages successfully received by recipient mail server", benchmark: ">95% delivery rate" },
  { id: "bounced",             label: "Bounced",                icon: TriangleAlert,   category: "delivery", description: "Messages that failed to reach the recipient", benchmark: "<5% bounce rate" },
  { id: "opened",              label: "Opened",                 icon: Mail,            category: "engagement", channels: ["email"], description: "Recipients who opened the email (tracking pixel loaded)", benchmark: "40-60% for advancement" },
  { id: "clicked",             label: "Clicked",                icon: Link2,           category: "engagement", channels: ["email"], description: "Recipients who clicked any link in the email", benchmark: "15-30% click rate" },
  { id: "viewed",              label: "Viewed",                 icon: Eye,             category: "engagement", description: "Recipients who watched the video on the landing page", benchmark: "30-50% view rate" },
  { id: "started",             label: "Started",                icon: Play,            category: "engagement" },
  { id: "finished",            label: "Finished",               icon: Check,           category: "engagement" },
  { id: "shared",              label: "Shared",                 icon: Share2,          category: "engagement" },
  { id: "cta-clicked",         label: "CTA Clicked",            icon: Target,          category: "engagement", channels: ["email"] },
  { id: "downloaded",          label: "Downloaded",             icon: Download,        category: "engagement" },
  { id: "replied",             label: "Replied",                icon: Reply,           category: "engagement" },
  { id: "responded",           label: "Responded",              icon: MessageSquare,   category: "engagement", channels: ["sms"] },
  { id: "failed",              label: "Failed",                 icon: X,               category: "negative" },
  { id: "replied-submitted",   label: "Replied & Submitted",    icon: Check,           category: "engagement", channels: ["video-request"] },
  { id: "opened-no-click",     label: "Opened but Didn\u2019t Click", icon: CircleAlert,  category: "negative", channels: ["email"] },
  { id: "didnt-open",          label: "Didn\u2019t Open",            icon: X,               category: "negative", channels: ["email"] },
  { id: "didnt-click",         label: "Didn\u2019t Click",           icon: X,               category: "negative", channels: ["email"] },
  { id: "didnt-view",          label: "Didn\u2019t View",            icon: X,               category: "negative" },
  { id: "unsubscribed",        label: "Unsubscribed",           icon: Bell,            category: "negative" },
  { id: "marked-spam",         label: "Marked as Spam",         icon: TriangleAlert,   category: "negative", channels: ["email"] },
];
