import { createBrowserRouter, redirect } from "react-router";
import { Layout }             from "./components/Layout";
import { Dashboard }          from "./pages/Dashboard";
import { VideoLibrary }       from "./pages/VideoLibrary";
import { VideoProfile }       from "./pages/VideoProfile";
import { VideoCreate }        from "./pages/VideoCreate";

import { Contacts }           from "./pages/Contacts";
import { ContactProfile }     from "./pages/ContactProfile";
import { Analytics }          from "./pages/Analytics";
import { EnvelopeBuilder }    from "./pages/EnvelopeBuilder";
import { LandingPageBuilder } from "./pages/LandingPageBuilder";
import { Settings }           from "./pages/Settings";
import { UserProfile }        from "./pages/UserProfile";
import { EmailTemplates }     from "./pages/assets/EmailTemplates";
import { EnvelopeDesigns }    from "./pages/assets/EnvelopeDesigns";
import { LandingPageDesigns } from "./pages/assets/LandingPageDesigns";
import { VideoClips }         from "./pages/assets/VideoClips";
import { ImageLibrary }       from "./pages/assets/ImageLibrary";
import { IntroLibrary }       from "./pages/assets/IntroLibrary";
import { OutroLibrary }       from "./pages/assets/OutroLibrary";
import { CreateAssets }       from "./pages/CreateAssets";
import { CreateIntro }        from "./pages/CreateIntro";
import { CreateOutro }        from "./pages/CreateOutro";
import { EmailTemplateBuilder } from "./pages/EmailTemplateBuilder";
import { Lists }              from "./pages/Lists";
import { PersonalizedRecorderPage } from "./pages/campaign/PersonalizedRecorderPage";
import { CampaignsList }         from "./pages/CampaignsList";
import { CreateCampaign }        from "./pages/CreateCampaign";
import { CampaignDetail }        from "./pages/CampaignDetail";
import { RequirementsAudit }      from "./pages/RequirementsAudit";
import { SavedSearches }      from "./pages/SavedSearches";
import { AddContacts }        from "./pages/AddContacts";
import { NotFound }           from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true,                  Component: Dashboard },
      { path: "videos",               Component: VideoLibrary },
      { path: "videos/:id",           Component: VideoProfile },
      { path: "video/create",         Component: VideoCreate },
      { path: "videos/record-1to1",   Component: PersonalizedRecorderPage },
      { path: "audit",                Component: RequirementsAudit },
      // Campaigns
      { path: "campaigns",            Component: CampaignsList },
      { path: "campaigns/create",     Component: CreateCampaign },
      { path: "campaigns/:id",        Component: CampaignDetail },

      { path: "contacts",             Component: Contacts },
      { path: "contacts/add",         Component: AddContacts },
      { path: "contacts/:id",         Component: ContactProfile },
      { path: "lists",                Component: Lists },
      { path: "saved-searches",       Component: SavedSearches },
      { path: "analytics",            Component: Analytics },
      { path: "envelope",             Component: EnvelopeBuilder },
      { path: "landing",              Component: LandingPageBuilder },
      { path: "settings",             Component: Settings },
      { path: "profile",              Component: UserProfile },
      { path: "assets",               Component: CreateAssets },
      // Assets & Templates
      { path: "assets/templates",     Component: EmailTemplates },
      { path: "assets/envelopes",     Component: EnvelopeDesigns },
      { path: "assets/landing-pages", Component: LandingPageDesigns },
      { path: "assets/video-clips",   Component: VideoClips },
      { path: "assets/images",        Component: ImageLibrary },
      { path: "assets/intros",        Component: IntroLibrary },
      { path: "assets/outros",        Component: OutroLibrary },
      { path: "intro/create",         Component: CreateIntro },
      { path: "outro/create",         Component: CreateOutro },
      { path: "template/create",      Component: EmailTemplateBuilder },
      // Catch-all redirect for removed Send Flow routes
      { path: "send/*",               loader: () => redirect("/videos") },
      { path: "send",                 loader: () => redirect("/videos") },
      { path: "*",                    Component: NotFound },
    ],
  },
]);