import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// ── Template shape ─────────────────────────────────────────────────────────────
/** Snapshot of a single FlowStep's content for template storage */
export interface TemplateStepContent {
  type: "email" | "sms" | "wait" | "condition";
  label: string;
  /** Email fields */
  subject?: string;
  body?: string;
  senderName?: string;
  senderEmail?: string;
  replyTo?: string;
  font?: string;
  /** SMS fields */
  smsBody?: string;
  /** Wait step */
  waitDays?: number;
  /** Condition step */
  conditionField?: string;
  /** Landing page */
  landingPageEnabled?: boolean;
  ctaText?: string;
  ctaUrl?: string;
}

export interface CampaignTemplate {
  id: string;
  name: string;
  description: string;
  /** "single" or "multi" */
  mode: "single" | "multi";
  /** Goal within single-step flow */
  goal: "send-video" | "send-without-video" | "request-video" | null;
  /** Delivery channel */
  channel: "email" | "sms" | null;
  /** Selected tag names */
  tags: string[];
  /** Primary step content (used for single-step; first email in multi) */
  stepContent: TemplateStepContent;
  /** Multi-step flow: ordered steps to populate the builder canvas */
  multiSteps?: TemplateStepContent[];
  /** Template creation timestamp */
  createdAt: string;
  /** Is this a built-in template? */
  builtIn?: boolean;
}

// ── Seed data ──────────────────────────────────────────────────────────────────
const BUILT_IN_TEMPLATES: CampaignTemplate[] = [
  {
    id: "tpl-thank-you-video",
    name: "Thank You Video",
    description: "Personalized video thank-you message for recent donors. Includes video recording step and email delivery.",
    mode: "single",
    goal: "send-video",
    channel: "email",
    tags: ["Thank You"],
    stepContent: {
      type: "email",
      label: "Thank You Email",
      subject: "A personal thank you from {{school_name}}",
      body: `<p>Dear {{first_name}},</p>
<p>Thank you so much for your generous gift of {{gift_amount}} to the {{fund_name}}. Your support directly impacts our students and helps us continue our mission of academic excellence.</p>
<p>I recorded a short video just for you \u2014 please take a moment to watch it. It means the world to us that you chose to invest in our community.</p>
<p>With gratitude,<br/>Dr. Rebecca Torres<br/>Vice President for Advancement</p>`,
      senderName: "Office of Advancement",
      senderEmail: "advancement@hartwell.edu",
      replyTo: "giving@hartwell.edu",
      font: "Serif (Garamond)",
      landingPageEnabled: true,
      ctaText: "Make Another Gift",
      ctaUrl: "https://hartwell.edu/give",
    },
    createdAt: "2025-10-15T10:00:00Z",
    builtIn: true,
  },
  {
    id: "tpl-event-invite",
    name: "Event Invitation",
    description: "Clean email invitation for upcoming campus events \u2014 homecoming, reunions, galas.",
    mode: "single",
    goal: "send-without-video",
    channel: "email",
    tags: ["Events"],
    stepContent: {
      type: "email",
      label: "Event Invitation",
      subject: "You're invited: {{event_name}} \u2014 {{event_date}}",
      body: `<p>Dear {{first_name}},</p>
<p>We are thrilled to invite you to <strong>{{event_name}}</strong>, taking place on <strong>{{event_date}}</strong> at the Hartwell Grand Ballroom.</p>
<p>This year's event celebrates a decade of transformative impact, and we'd love for you to be part of it.</p>
<p>We hope to see you there!</p>
<p>Warm regards,<br/>The Alumni Relations Team</p>`,
      senderName: "Alumni Relations",
      senderEmail: "alumni@hartwell.edu",
      replyTo: "events@hartwell.edu",
      font: "Serif (Garamond)",
      landingPageEnabled: true,
      ctaText: "RSVP Now",
      ctaUrl: "https://hartwell.edu/events/rsvp",
    },
    createdAt: "2025-09-20T14:30:00Z",
    builtIn: true,
  },
  {
    id: "tpl-video-request-students",
    name: "Student Video Request",
    description: "Collect thank-you videos from scholarship recipients to share with donors.",
    mode: "single",
    goal: "request-video",
    channel: "email",
    tags: ["Video Request", "Student Engagement"],
    stepContent: {
      type: "email",
      label: "Video Request Email",
      subject: "We'd love to hear from you, {{first_name}}!",
      body: `<p>Hi {{first_name}},</p>
<p>As a recipient of the <strong>{{scholarship_name}}</strong>, you have a unique opportunity to make a direct impact on your donor's day.</p>
<p>Click the button below to start recording. You can re-record as many times as you'd like before submitting.</p>
<p>Thank you for paying it forward,<br/>The Student Affairs Team</p>`,
      senderName: "Student Affairs",
      senderEmail: "studentaffairs@hartwell.edu",
      replyTo: "studentaffairs@hartwell.edu",
      font: "Sans-serif (Inter)",
    },
    createdAt: "2025-11-01T09:00:00Z",
    builtIn: true,
  },
  {
    id: "tpl-birthday-sms",
    name: "Birthday Greeting (SMS)",
    description: "Quick SMS birthday greeting with personalized merge fields.",
    mode: "single",
    goal: "send-without-video",
    channel: "sms",
    tags: ["Birthdays"],
    stepContent: {
      type: "sms",
      label: "Birthday SMS",
      smsBody: "Happy birthday, {{first_name}}! From all of us at Hartwell University, we hope your day is filled with joy. Thank you for being part of our community!",
      senderName: "Hartwell University",
    },
    createdAt: "2025-08-12T11:00:00Z",
    builtIn: true,
  },
  {
    id: "tpl-appeal-drip",
    name: "Annual Fund Appeal Sequence",
    description: "Multi-step drip campaign for annual giving appeals with branching based on engagement.",
    mode: "multi",
    goal: null,
    channel: "email",
    tags: ["Appeals / Solicitation"],
    stepContent: {
      type: "email",
      label: "Initial Appeal",
      subject: "Your impact at {{school_name}}, {{first_name}}",
      body: `<p>Dear {{first_name}},</p>
<p>Every year, gifts to the Annual Fund power the experiences that make Hartwell extraordinary.</p>
<p>Will you make a gift today?</p>
<p>With gratitude,<br/>The Annual Giving Team</p>`,
      senderName: "Annual Giving",
      senderEmail: "annualfund@hartwell.edu",
      replyTo: "giving@hartwell.edu",
      font: "Serif (Garamond)",
      landingPageEnabled: true,
      ctaText: "Give to the Annual Fund",
      ctaUrl: "https://hartwell.edu/give",
    },
    multiSteps: [
      {
        type: "email",
        label: "Initial Appeal",
        subject: "Your impact at {{school_name}}, {{first_name}}",
        body: `<p>Dear {{first_name}},</p><p>Every year, gifts to the Annual Fund power the experiences that make Hartwell extraordinary.</p><p>Will you make a gift today?</p>`,
        senderName: "Annual Giving",
        senderEmail: "annualfund@hartwell.edu",
        replyTo: "giving@hartwell.edu",
        font: "Serif (Garamond)",
        landingPageEnabled: true,
        ctaText: "Give to the Annual Fund",
        ctaUrl: "https://hartwell.edu/give",
      },
      { type: "wait", label: "Wait 5 days", waitDays: 5 },
      { type: "condition", label: "Opened email?", conditionField: "Opened previous email" },
      {
        type: "email",
        label: "Follow-Up (Engaged)",
        subject: "Thank you for reading, {{first_name}}",
        body: `<p>Hi {{first_name}},</p><p>I noticed you took a look at our last message \u2014 thank you!</p>`,
        senderName: "Jordan Mitchell",
        senderEmail: "j.mitchell@hartwell.edu",
        replyTo: "giving@hartwell.edu",
      },
      {
        type: "email",
        label: "Re-Engagement (Didn't Open)",
        subject: "Did you miss this, {{first_name}}?",
        body: `<p>Hi {{first_name}},</p><p>I know inboxes get busy, so I wanted to make sure this didn't slip through the cracks.</p>`,
        senderName: "Annual Giving",
        senderEmail: "annualfund@hartwell.edu",
        replyTo: "giving@hartwell.edu",
      },
      { type: "wait", label: "Wait 7 days", waitDays: 7 },
      {
        type: "email",
        label: "Final Reminder",
        subject: "Last chance: Annual Fund closes {{deadline_date}}",
        body: `<p>Dear {{first_name}},</p><p>This is it \u2014 the Annual Fund closes on <strong>{{deadline_date}}</strong>, and we're so close to reaching our goal.</p>`,
        senderName: "Annual Giving",
        senderEmail: "annualfund@hartwell.edu",
        replyTo: "giving@hartwell.edu",
        landingPageEnabled: true,
        ctaText: "Make Your Gift Before {{deadline_date}}",
        ctaUrl: "https://hartwell.edu/give",
      },
    ],
    createdAt: "2025-07-05T16:00:00Z",
    builtIn: true,
  },
];

// ── Context ────────────────────────────────────────────────────────────────────
interface TemplateContextValue {
  templates: CampaignTemplate[];
  addTemplate: (tpl: Omit<CampaignTemplate, "id" | "createdAt">) => CampaignTemplate;
  removeTemplate: (id: string) => void;
  updateTemplate: (id: string, patch: Partial<CampaignTemplate>) => void;
}

const TemplateContext = createContext<TemplateContextValue | null>(null);

export function TemplateProvider({ children }: { children: ReactNode }) {
  const [templates, setTemplates] = useState<CampaignTemplate[]>(BUILT_IN_TEMPLATES);

  const addTemplate = useCallback((tpl: Omit<CampaignTemplate, "id" | "createdAt">) => {
    const newTpl: CampaignTemplate = {
      ...tpl,
      id: `tpl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setTemplates(prev => [newTpl, ...prev]);
    return newTpl;
  }, []);

  const removeTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const updateTemplate = useCallback((id: string, patch: Partial<CampaignTemplate>) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
  }, []);

  return (
    <TemplateContext.Provider value={{ templates, addTemplate, removeTemplate, updateTemplate }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplates() {
  const ctx = useContext(TemplateContext);
  if (!ctx) throw new Error("useTemplates must be used within TemplateProvider");
  return ctx;
}
