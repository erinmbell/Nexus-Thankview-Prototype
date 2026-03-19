import { useState, ElementType } from "react";
import { useSearchParams } from "react-router";
import { useToast } from "../contexts/ToastContext";
import {
  Building2, Mail, Users, Bell, X, Check,
  Upload, MoreHorizontal, Plus, Video, Link2,
  Camera, Monitor, Captions, Sparkles, UserCheck,
  Globe, ExternalLink, ChartBar, AlertCircle, Copy,
  Trash2, Star, Shield, RefreshCw, Info, Clapperboard, Play, DollarSign, RotateCcw, CreditCard, Receipt, CalendarClock,
  ChevronDown, Save, User, Smartphone,
} from "lucide-react";
import {
  TextInput,
  Select,
  Switch,
  Button,
  Badge,
  Modal,
  Menu,
  ActionIcon,
  Avatar,
  Title,
  Text,
  Stack,
  Box,
  ColorSwatch,
  Tooltip,
  Table,
  SegmentedControl,
  SimpleGrid,
  Collapse,
  UnstyledButton,
  PasswordInput,
} from "@mantine/core";
import { TV } from "../theme";
import { TablePagination } from "../components/TablePagination";
import { SortableHeader, nextSort, sortRows } from "../components/SortableHeader";
import type { SortState } from "../components/SortableHeader";
import { EditColumnsModal, ColumnsButton } from "../components/ColumnCustomizer";
import type { ColumnDef } from "../components/ColumnCustomizer";

type Tab = "general" | "email_sms" | "users" | "notifications" | "video" | "one_to_one" | "dns_setup" | "subscription" | "profile";

const TABS: { key: Tab; icon: ElementType; label: string }[] = [
  { key: "profile",       icon: User,      label: "My Profile"        },
  { key: "general",       icon: Building2, label: "General Portal"    },
  { key: "email_sms",     icon: Mail,      label: "Email & SMS"       },
  { key: "dns_setup",     icon: Globe,     label: "DNS Setup"         },
  { key: "users",         icon: Users,     label: "Manage Users"      },
  { key: "notifications", icon: Bell,      label: "Notifications"     },
  { key: "video",         icon: Video,     label: "Video & Recording" },
  { key: "one_to_one",    icon: Link2,     label: "1:1 Video"         },
  { key: "subscription", icon: CreditCard, label: "Subscription & Billing" },
];

const MOCK_USERS = [
  { id: 1, name: "Kelley Molt",       email: "kelley.molt@hartwell.edu",   role: "TV Admin",           status: "Active",  lastLogin: "Feb 27, 2026 · 9:14 AM",  sendingDomain: "hartwell.edu" as string | null       },
  { id: 2, name: "James Okafor",      email: "j.okafor@hartwell.edu",      role: "Basic TV User",      status: "Active",  lastLogin: "Feb 26, 2026 · 3:42 PM",  sendingDomain: "giving.hartwell.edu" as string | null },
  { id: 3, name: "Michelle Park",     email: "m.park@hartwell.edu",        role: "TV Video Recorder",  status: "Active",  lastLogin: "Feb 24, 2026 · 11:08 AM", sendingDomain: null as string | null                  },
  { id: 4, name: "Derek Williams",    email: "d.williams@hartwell.edu",    role: "TV Content Creator", status: "Active",  lastLogin: "Feb 20, 2026 · 2:17 PM",  sendingDomain: null as string | null                  },
  { id: 5, name: "Sarah Chen",        email: "s.chen@hartwell.edu",        role: "Basic TV User",      status: "Active",  lastLogin: "Feb 25, 2026 · 10:30 AM", sendingDomain: null as string | null                  },
  { id: 6, name: "Pending Invite",    email: "t.hernandez@hartwell.edu",   role: "Basic TV User",      status: "Pending", lastLogin: null,                       sendingDomain: null as string | null                  },
];

const MOCK_DOMAINS = [
  { domain: "hartwell.edu",        status: "verified" as const, isDefault: true  },
  { domain: "giving.hartwell.edu", status: "verified" as const, isDefault: false },
  { domain: "alumni.hartwell.edu", status: "pending"  as const, isDefault: false },
];



const ROLES = ["TV Admin", "Basic TV User", "TV Content Creator", "TV Video Recorder"];

// ── Shared helpers ──────────────────────────────────────────────────────────────
/** Consistent section-header style */
function SectionHeader({ icon: Icon, title, description }: { icon?: ElementType; title: string; description?: string }) {
  return (
    <Box px="lg" py="sm" bg={TV.surfaceMuted} style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} style={{ color: TV.brand }} />}
        <Title order={4} fz={15}>{title}</Title>
      </div>
      {description && <Text fz={12} c={TV.textSecondary} mt={2}>{description}</Text>}
    </Box>
  );
}

/** Consistent label style for non-Mantine input labels */
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>
      {children}
    </Text>
  );
}

/** Toggle row: label/desc on left, switch on right */
function ToggleRow({
  label,
  description,
  checked,
  onChange,
  extra,
  borderBottom = true,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
  extra?: React.ReactNode;
  borderBottom?: boolean;
}) {
  return (
    <Box px="lg" py="sm" style={borderBottom ? { borderBottom: `1px solid ${TV.borderDivider}` } : undefined}>
      <div className="flex items-start justify-between flex-nowrap">
        <div style={{ flex: 1 }}>
          {extra ?? (
            <Text fz={13} fw={600} c={TV.textPrimary}>{label}</Text>
          )}
          {description && <Text fz={12} c={TV.textSecondary}>{description}</Text>}
        </div>
        <Switch
          checked={checked}
          onChange={onChange}
          size="md"
          color="tvPurple.6"
          styles={{ track: { cursor: "pointer" } }}
        />
      </div>
    </Box>
  );
}

// Role → badge color mapping
function roleBadgeColor(role: string): string {
  switch (role) {
    case "TV Admin":           return "tvPurple";
    case "Basic TV User":      return "cyan";
    case "TV Content Creator": return "teal";
    case "TV Video Recorder":  return "orange";
    default:                   return "gray";
  }
}

// ── Invite User Modal ─────────────────────────────────────────────────────────
function InviteModal({ opened, onClose, onInvite }: { opened: boolean; onClose: () => void; onInvite: (email: string, role: string) => void }) {
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState("Basic TV User");

  return (
    <Modal opened={opened} onClose={onClose} title="Invite User" size="md"
      styles={{ title: { fontWeight: 900, fontSize: "16px", color: TV.textPrimary } }}
    >
      <Stack gap="md">
        <TextInput
          label="Email Address"
          placeholder="colleague@hartwell.edu"
          value={email}
          onChange={e => setEmail(e.currentTarget.value)}
        />
        <div>
          <FieldLabel>Role</FieldLabel>
          <Stack gap={6}>
            {ROLES.map(r => (
              <div
                key={r}
                className="rounded-[var(--mantine-radius-md)] border-2"
                style={{
                  cursor: "pointer",
                  borderColor: role === r ? TV.brand : TV.borderLight,
                  backgroundColor: role === r ? TV.brandTint : "white",
                  transition: "all 120ms ease",
                  padding: "12px 16px",
                }}
                onClick={() => setRole(r)}
              >
                <div className="flex items-center justify-between flex-nowrap">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-2">
                      <Badge color={roleBadgeColor(r)} size="xs">{r}</Badge>
                    </div>
                    <Text fz={11} c={TV.textSecondary} mt={4}>{ROLE_DESCRIPTIONS[r]}</Text>
                  </div>
                  {role === r && <Check size={16} style={{ color: TV.brand, flexShrink: 0 }} />}
                </div>
              </div>
            ))}
          </Stack>
        </div>
      </Stack>
      <div className="flex items-center justify-end gap-3" style={{ marginTop: 20 }}>
        <Button variant="outline" color="red" onClick={onClose} radius="xl">
          Cancel
        </Button>
        <Button
          leftSection={<Mail size={13} />}
          onClick={() => { onInvite(email, role); onClose(); }}
          disabled={!email}
          color="tvPurple"
        >
          Send Invite
        </Button>
      </div>
    </Modal>
  );
}

// ── Profile Tab ────────────────────────────────────────────────────────────────
function ProfileTab() {
  const { show } = useToast();

  const [firstName, setFirstName] = useState("Kelley");
  const [lastName,  setLastName]  = useState("Molt");
  const [jobTitle,  setJobTitle]  = useState<string | null>("Director of Annual Giving");

  // Password
  const [showPwForm,  setShowPwForm]  = useState(false);
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const pwMatch = newPw === confirmPw && newPw.length >= 8;

  // 2FA (SMS-based)
  const [twoFa,     setTwoFa]     = useState(false);
  const [twoFaStep, setTwoFaStep] = useState<"off" | "phone" | "code">("off");
  const [phoneNum,   setPhoneNum]  = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [codeSent,   setCodeSent]  = useState(false);

  const handleSaveProfile = () => show("Profile updated!", "success");

  const handleSavePw = () => {
    if (!pwMatch) return;
    setShowPwForm(false);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    show("Password updated!", "success");
  };

  const handleEnable2FA = () => setTwoFaStep("phone");

  const handleSendCode = () => {
    setCodeSent(true);
    setTwoFaStep("code");
    show("Verification code sent to " + phoneNum, "info");
  };

  const handleVerify2FA = () => {
    setTwoFa(true);
    setTwoFaStep("off");
    setCodeSent(false);
    show("Two-step verification enabled!", "success");
  };

  return (
    <Stack gap="md" maw={672}>
      {/* Avatar header */}
      <div className="flex items-center gap-4">
        <Box w={64} h={64} style={{ borderRadius: "50%", backgroundColor: TV.brand, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 22, fontWeight: 900, flexShrink: 0 }}>
          KM
        </Box>
        <div>
          <Title order={4} fz={15}>{firstName} {lastName}</Title>
          <Text fz={12} c={TV.textSecondary}>kelley.molt@hartwell.edu</Text>
          <Badge color="tvPurple" size="sm" mt={4}>TV Admin</Badge>
        </div>
      </div>

      {/* Profile info */}
      <div className="rounded-[var(--mantine-radius-default)] border" style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
        <SectionHeader icon={User} title="Profile Information" description="Your name and title as they appear across ThankView." />
        <Box px="lg" py="md">
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
            <TextInput label="First Name" value={firstName} onChange={e => setFirstName(e.currentTarget.value)} />
            <TextInput label="Last Name" value={lastName} onChange={e => setLastName(e.currentTarget.value)} />
          </SimpleGrid>
          <Select
            label="Job Title / Function"
            placeholder="Select your role"
            value={jobTitle}
            onChange={setJobTitle}
            data={[
              "Director of Annual Giving",
              "Director of Development",
              "Director of Alumni Relations",
              "Vice President of Advancement",
              "Major Gifts Officer",
              "Gift Officer",
              "Stewardship Coordinator",
              "Donor Relations Manager",
              "Annual Fund Manager",
              "Campaign Manager",
              "Communications Director",
              "Marketing Manager",
              "Admissions Counselor",
              "Director of Admissions",
              "Student Affairs",
              "Academic Affairs",
              "President / Chancellor",
              "Executive Director",
              "Program Manager",
              "Other",
            ]}
            searchable
            mb="md"
          />
          <Button leftSection={<Check size={13} />} color="tvPurple" onClick={handleSaveProfile}>Save Profile</Button>
        </Box>
      </div>

      {/* Password */}
      <div className="rounded-[var(--mantine-radius-default)] border" style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
        <Box px="lg" py="md">
          <div className="flex items-center justify-between mb-3">
            <Title order={3} fz={16}>Password</Title>
            <Button variant={showPwForm ? "outline" : "subtle"} color={showPwForm ? "red" : "tvPurple"} size="compact-sm" onClick={() => setShowPwForm(!showPwForm)}>
              {showPwForm ? "Cancel" : "Update Password"}
            </Button>
          </div>
          {!showPwForm && <Text fz={13} c={TV.textSecondary}>Last updated 3 months ago.</Text>}
          {showPwForm && (
            <Stack gap="md">
              <PasswordInput label="Current Password" value={currentPw} onChange={e => setCurrentPw(e.currentTarget.value)} />
              <PasswordInput label="New Password" value={newPw} onChange={e => setNewPw(e.currentTarget.value)} />
              <PasswordInput label="Confirm Password" value={confirmPw} onChange={e => setConfirmPw(e.currentTarget.value)} />
              {newPw && confirmPw && !pwMatch && (
                <Text fz={12} c="red">Passwords don't match or must be at least 8 characters.</Text>
              )}
              <div className="flex items-center gap-3">
                <Button variant="outline" color="red" onClick={() => setShowPwForm(false)}>Cancel</Button>
                <Button leftSection={<Save size={13} />} color="tvPurple" onClick={handleSavePw} disabled={!pwMatch || !currentPw}>Save Password</Button>
              </div>
            </Stack>
          )}
        </Box>
      </div>

      {/* 2FA — SMS-based */}
      <div className="rounded-[var(--mantine-radius-default)] border" style={{ borderColor: TV.borderLight, overflow: "hidden" }}>
        <Box px="lg" py="md">
          <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
            <div className="flex items-center gap-2">
              <Shield size={18} style={{ color: TV.brand }} />
              <Title order={3} fz={16}>Two-Step Verification</Title>
            </div>
            {!twoFa && twoFaStep === "off" && (
              <Button variant="subtle" color="tvPurple" size="compact-sm" onClick={handleEnable2FA}>Enable</Button>
            )}
            {twoFa && (
              <Button variant="subtle" color="red" size="compact-sm" onClick={() => { setTwoFa(false); setPhoneNum(""); show("Two-step verification disabled", "info"); }}>Disable</Button>
            )}
          </div>
          <Text fz={12} c={TV.textSecondary} mb="md">Add an extra layer of security. When you sign in, we'll text a verification code to your mobile phone.</Text>

          {/* Active state */}
          {twoFa && (
            <Box p="sm" bg={TV.successBg} style={{ borderRadius: 10, border: `1px solid ${TV.successBorder}` }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                <Check size={15} style={{ color: TV.success }} />
                <Text fz={13} fw={600} c={TV.success}>Two-step verification is active</Text>
              </div>
              <div className="flex items-center" style={{ gap: 6 }}>
                <Smartphone size={13} style={{ color: TV.textSecondary }} />
                <Text fz={12} c={TV.textSecondary}>Codes sent to ••••••���{phoneNum.slice(-4) || "1234"}</Text>
              </div>
            </Box>
          )}

          {/* Step 1: Enter phone number */}
          {twoFaStep === "phone" && (
            <Stack gap="md">
              <Text fz={13} c={TV.textPrimary}>Enter the mobile phone number where you'd like to receive verification codes.</Text>
              <TextInput
                label="Mobile Phone Number"
                placeholder="(555) 555-1234"
                leftSection={<Smartphone size={14} />}
                value={phoneNum}
                onChange={e => setPhoneNum(e.currentTarget.value)}
                description="Standard SMS rates may apply."
              />
              <div className="flex items-center gap-3">
                <Button variant="outline" color="red" onClick={() => { setTwoFaStep("off"); setPhoneNum(""); }}>Cancel</Button>
                <Button color="tvPurple" onClick={handleSendCode} disabled={phoneNum.length < 10}>Send Code</Button>
              </div>
            </Stack>
          )}

          {/* Step 2: Enter the code */}
          {twoFaStep === "code" && (
            <Stack gap="md">
              <Box p="sm" bg={TV.surfaceMuted} style={{ borderRadius: 10, border: `1px solid ${TV.borderDivider}` }}>
                <div className="flex items-center" style={{ gap: 6 }}>
                  <Smartphone size={13} style={{ color: TV.brand }} />
                  <Text fz={12} c={TV.textPrimary}>We sent a 6-digit code to <Text span fw={600}>{phoneNum}</Text></Text>
                </div>
              </Box>
              <div>
                <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} mb={6}>Verification Code</Text>
                <div className="flex items-center gap-3">
                  <TextInput
                    value={verifyCode} onChange={e => setVerifyCode(e.currentTarget.value)}
                    placeholder="6-digit code" maxLength={6} w={160}
                    styles={{ input: { fontFamily: "monospace", letterSpacing: "0.25em" } }}
                  />
                  <Button color="tvPurple" onClick={handleVerify2FA} disabled={verifyCode.length < 6}>Verify</Button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="subtle" color="tvPurple" size="compact-sm" onClick={() => show("New code sent to " + phoneNum, "info")}>Resend Code</Button>
                <Button variant="subtle" color="gray" size="compact-sm" onClick={() => { setTwoFaStep("phone"); setVerifyCode(""); setCodeSent(false); }}>Change Number</Button>
                <Button variant="outline" color="red" size="compact-sm" onClick={() => { setTwoFaStep("off"); setPhoneNum(""); setVerifyCode(""); setCodeSent(false); }}>Cancel</Button>
              </div>
            </Stack>
          )}
        </Box>
      </div>
    </Stack>
  );
}

// ── General Tab ────────────────────────────────────────────────────────────────
function GeneralTab() {
  const { show } = useToast();
  const [orgName, setOrgName] = useState("Hartwell University");
  const [orgUrl,  setOrgUrl]  = useState("https://hartwell.edu");
  const [sso,     setSso]     = useState(false);
  const [logoUploaded, setLogoUploaded] = useState(true);

  return (
    <Stack gap="lg" maw={672}>
      {/* Org Settings */}
      <div className="rounded-[var(--mantine-radius-default)] border p-5" style={{ borderColor: TV.borderLight }}>
        <Title order={3} fz={16} mb="md">Organization Settings</Title>
        <Stack gap="md">
          <TextInput
            label="Organization Name"
            value={orgName}
            onChange={e => setOrgName(e.currentTarget.value)}
            description="This is what appears in the org switcher."
          />
          <div>
            <FieldLabel>Organization Slug</FieldLabel>
            <Box px="sm" py={10} bg={TV.surface} style={{ border: `1px solid ${TV.borderLight}`, borderRadius: "10px" }}>
              <Text fz={13} c={TV.textSecondary}>hartwell.thankview.com</Text>
            </Box>
            <Text fz={11} c={TV.textSecondary} mt={4}>Slug cannot be changed. Contact support to update.</Text>
          </div>
          <TextInput
            label="Organization URL"
            description="This is the URL recipients are taken to when they click your logo on a landing page."
            value={orgUrl}
            onChange={e => setOrgUrl(e.currentTarget.value)}
          />
        </Stack>
      </div>

      {/* Logo */}
      <div className="rounded-[var(--mantine-radius-default)] border p-5" style={{ borderColor: TV.borderLight }}>
        <Title order={3} fz={16} mb={4}>Organization Logo</Title>
        <Text fz={12} c={TV.textSecondary} mb="md">This will be the default logo shown on landing pages and envelopes.</Text>
        <div className="flex items-center gap-4">
          <Box
            w={96} h={96}
            style={{
              borderRadius: 20,
              border: logoUploaded ? `2px solid ${TV.borderStrong}` : `2px dashed ${TV.border}`,
              backgroundColor: logoUploaded ? TV.brandTint : TV.surface,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {logoUploaded ? (
              <Text fz={20} fw={900} c="tvPurple.6">HU</Text>
            ) : (
              <Upload size={24} style={{ color: TV.textDecorative }} />
            )}
          </Box>
          <div>
            <Button
              variant="default"
              leftSection={<Upload size={13} />}
              radius="xl"
              size="sm"
              onClick={() => setLogoUploaded(!logoUploaded)}
              styles={{ root: { borderColor: TV.borderLight, color: TV.textSecondary } }}
              mb={8}
            >
              {logoUploaded ? "Replace logo" : "Upload logo"}
            </Button>
            <Text fz={11} c={TV.textSecondary}>PNG or SVG · Recommended 200x80px</Text>
          </div>
        </div>
      </div>

      {/* SSO */}
      <div className="rounded-[var(--mantine-radius-default)] border p-5" style={{ borderColor: TV.borderLight }}>
        <div className="flex items-start justify-between flex-nowrap">
          <div>
            <div className="flex items-center gap-2">
              <Title order={3} fz={16}>Microsoft Single Sign-On (SSO)</Title>
              <Badge variant="light" color="tvPurple" size="xs">Microsoft Only</Badge>
            </div>
            <Text fz={12} c={TV.textSecondary} mt={4}>Allow users to sign in using your organization's Microsoft Azure AD / Entra ID account. SSO requires additional configuration in your Microsoft admin portal.</Text>
          </div>
          <Switch
            checked={sso}
            onChange={() => setSso(!sso)}
            size="lg"
            color="tvPurple.6"
            styles={{ track: { cursor: "pointer" } }}
          />
        </div>
        <Box mt="md" p="sm" bg={sso ? TV.brandTint : TV.surfaceMuted} style={{ borderRadius: 10, border: `1px solid ${sso ? TV.borderStrong : TV.borderLight}` }}>
          {sso ? (
            <Stack gap={6}>
              <Text fz={12} c="tvPurple.6">Microsoft SSO is enabled for your organization.</Text>
              <Text fz={12} c={TV.textSecondary}>Follow the setup guide to complete your Azure AD configuration. Flipping this toggle alone does not activate SSO — you must also register ThankView in your Microsoft admin portal.</Text>
              <div className="flex items-center" style={{ gap: 6, marginTop: 8 }}>
                <ExternalLink size={12} style={{ color: TV.brand }} />
                <Text component="a" href="https://help.thankview.com/t/35hpdms/setting-up-microsoft-single-sign-on-sso" target="_blank" rel="noopener noreferrer" fz={12} fw={600} c={TV.brand} style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
                  Setting Up Microsoft SSO — Help Center
                </Text>
              </div>
            </Stack>
          ) : (
            <Stack gap={6}>
              <Text fz={12} c={TV.textSecondary}>SSO is currently disabled. Before enabling, review the setup guide to ensure your Microsoft Azure AD / Entra ID is properly configured.</Text>
              <div className="flex items-center" style={{ gap: 6, marginTop: 8 }}>
                <ExternalLink size={12} style={{ color: TV.brand }} />
                <Text component="a" href="https://help.thankview.com/t/35hpdms/setting-up-microsoft-single-sign-on-sso" target="_blank" rel="noopener noreferrer" fz={12} fw={600} c={TV.brand} style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
                  Setting Up Microsoft SSO — Help Center
                </Text>
              </div>
            </Stack>
          )}
        </Box>
      </div>

      <Button
        leftSection={<Check size={14} />}
        color="tvPurple"
        onClick={() => show("Settings saved!", "success")}
      >
        Save Settings
      </Button>
    </Stack>
  );
}

// ── Email & SMS Tab ────────────────────────────────────────────────────────────
function EmailSmsTab() {
  const { show } = useToast();
  const [showDomainModal, setShowDomainModal] = useState(false);

  return (
    <Stack gap="lg" maw={672}>
      <div className="rounded-[var(--mantine-radius-default)] border p-5" style={{ borderColor: TV.borderLight }}>
        <Title order={3} fz={16} mb="md">Email Sending Domains</Title>
        <Stack gap="xs">
          {["hartwell.edu", "giving.hartwell.edu"].map(domain => (
            <div key={domain} className="flex items-center gap-3 px-3" style={{ paddingTop: 10, paddingBottom: 10, backgroundColor: TV.surface, borderRadius: 10, border: `1px solid ${TV.borderLight}` }}>
              <Box w={8} h={8} style={{ borderRadius: "50%", backgroundColor: TV.success, flexShrink: 0 }} />
              <Text fz={13} fw={600} c={TV.textPrimary} style={{ flex: 1 }}>{domain}</Text>
              <Badge color="green" variant="light" size="sm">Verified</Badge>
            </div>
          ))}
        </Stack>
        <Text fz={11} c={TV.textSecondary} mt="sm">Need to adjust your domain? Contact EverTrue support.</Text>
        <Button
          variant="default"
          leftSection={<Plus size={13} />}
          radius="xl"
          size="sm"
          mt="sm"
          onClick={() => setShowDomainModal(true)}
          styles={{ root: { borderColor: TV.borderLight, color: TV.textSecondary } }}
        >
          Add Custom Domain
        </Button>
      </div>

      <div className="rounded-[var(--mantine-radius-default)] border p-5" style={{ borderColor: TV.borderLight }}>
        <Title order={3} fz={16} mb={4}>SMS Settings</Title>
        <Text fz={13} c={TV.textSecondary} mb="md">
          This is the area code recipients will see when they receive a text message from your organization via ThankView. A local or recognizable area code can increase open rates and build trust with your audience.
        </Text>
        <div>
          <FieldLabel>SMS Area Code</FieldLabel>
          <div className="flex items-center gap-3 px-3" style={{ paddingTop: 10, paddingBottom: 10, backgroundColor: TV.surface, borderRadius: 10, border: `1px solid ${TV.borderLight}` }}>
            <Text fz={13} fw={600} c={TV.textPrimary}>+1 (617)</Text>
            <Text fz={11} c={TV.textSecondary} ml="xs">Boston, MA · Custom area code</Text>
          </div>
          <Text fz={11} c={TV.textSecondary} mt={4}>U.S. customers can request a custom area code. Contact support to update.</Text>
        </div>
      </div>

      <Button leftSection={<Check size={14} />} color="tvPurple" onClick={() => show("Email & SMS settings saved!", "success")}>
        Save Settings
      </Button>

      {/* Add Domain Modal */}
      <Modal opened={showDomainModal} onClose={() => setShowDomainModal(false)} title="Add Custom Domain" size="lg"
        styles={{ title: { fontWeight: 900, fontSize: "16px", color: TV.textPrimary } }}
      >
        <Text fz={13} c={TV.textSecondary} mb="md">Add a DNS TXT record to verify your domain ownership.</Text>
        <Box bg={TV.surface} p="md" style={{ borderRadius: 12, fontFamily: "monospace" }} mb="md">
          <Text fz={12}><Text span c={TV.textSecondary}>Type:</Text> TXT</Text>
          <Text fz={12}><Text span c={TV.textSecondary}>Host:</Text> _thankview-verify</Text>
          <Text fz={12}><Text span c={TV.textSecondary}>Value:</Text> tv-verify=abc123xyz</Text>
        </Box>
        <TextInput label="Domain to add" placeholder="e.g. alumni.hartwell.edu" mb="lg" />
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" color="red" radius="xl" onClick={() => setShowDomainModal(false)}>
            Cancel
          </Button>
          <Button color="tvPurple" onClick={() => { show("Domain verification initiated!", "success"); setShowDomainModal(false); }}>
            Verify Domain
          </Button>
        </div>
      </Modal>
    </Stack>
  );
}

// ── DNS Setup Tab ──────────────────────────────────────────────────────────────
function DnsSetupTab() {
  const { show } = useToast();
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [domains, setDomains] = useState<{ id: number; domain: string; status: "verified" | "pending" | "failed"; isDefault: boolean; addedAt: string }[]>([]);
  const [showDnsRecords, setShowDnsRecords] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const hasMultiple = domains.length > 1;
  const hasDomains = domains.length > 0;

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const d = newDomain.trim().toLowerCase();
    if (domains.some(x => x.domain === d)) {
      show("This domain has already been added.", "error");
      return;
    }
    setDomains(prev => [
      ...prev,
      {
        id: Date.now(),
        domain: d,
        status: "pending",
        isDefault: prev.length === 0,
        addedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      },
    ]);
    setNewDomain("");
    setShowDomainModal(false);
    show(`Domain "${d}" added — DNS records are ready for your IT team.`, "success");
  };

  const handleSetDefault = (id: number) => {
    setDomains(prev => prev.map(d => ({ ...d, isDefault: d.id === id })));
    show("Default domain updated", "success");
  };

  const handleRemove = (id: number) => {
    const removing = domains.find(d => d.id === id);
    setDomains(prev => {
      const next = prev.filter(d => d.id !== id);
      if (removing?.isDefault && next.length > 0) next[0].isDefault = true;
      return next;
    });
    setConfirmRemove(null);
    show("Domain removed", "success");
  };

  const handleVerify = (id: number) => {
    setDomains(prev => prev.map(d => d.id === id ? { ...d, status: "verified" } : d));
    show("Domain verified successfully!", "success");
  };

  const statusColor = (s: string) => s === "verified" ? "green" : s === "pending" ? "yellow" : "red";
  const statusLabel = (s: string) => s === "verified" ? "Verified" : s === "pending" ? "Pending Verification" : "Verification Failed";
  const statusDot   = (s: string) => s === "verified" ? TV.success : s === "pending" ? TV.warning : TV.danger;

  const dnsRecords = (domain: string) => [
    { type: "TXT",   host: `_thankview.${domain}`, value: `tv-verify=${btoa(domain).slice(0, 16)}`, purpose: "Domain ownership verification" },
    { type: "CNAME", host: `tv-bounce.${domain}`,  value: "bounce.mail-et.com",                      purpose: "Bounce handling" },
    { type: "CNAME", host: `tv-dkim.${domain}`,    value: "dkim.mail-et.com",                        purpose: "DKIM email authentication" },
    { type: "TXT",   host: domain,                  value: "v=spf1 include:mail-et.com ~all",         purpose: "SPF record (append to existing)" },
  ];

  return (
    <Stack gap="lg" maw={720}>
      {/* Header card */}
      <div className="rounded-[var(--mantine-radius-default)] border p-5" style={{ borderColor: TV.borderLight }}>
        <Title order={3} fz={16} mb={4}>Email Domain (DNS) Configuration</Title>
        <Text fz={13} c={TV.textSecondary} mb="md">
          Set up a sending domain so ThankView can send emails on behalf of your organization. Once your IT team adds the required DNS records, your domain will be verified automatically.
        </Text>

        {/* Status badge */}
        <div className="flex items-center gap-2 mb-4">
          {hasDomains ? (
            <Badge
              variant="light"
              color={domains.every(d => d.status === "verified") ? "green" : "yellow"}
              size="sm"
              leftSection={
                domains.every(d => d.status === "verified")
                  ? <Check size={10} />
                  : <AlertCircle size={10} />
              }
            >
              {domains.every(d => d.status === "verified")
                ? `${domains.length} domain${domains.length > 1 ? "s" : ""} configured`
                : "Configuration in progress"}
            </Badge>
          ) : (
            <Badge variant="light" color="red" size="sm" leftSection={<AlertCircle size={10} />}>
              Not configured
            </Badge>
          )}
        </div>

        {/* Empty state */}
        {!hasDomains && (
          <Box p="md" bg={TV.surfaceMuted} style={{ borderRadius: 12, border: `1px solid ${TV.borderLight}` }}>
            <div className="flex items-start gap-3 flex-nowrap">
              <Info size={16} style={{ color: TV.textSecondary, flexShrink: 0, marginTop: 2 }} />
              <div>
                <Text fz={13} c={TV.textLabel}>
                  Email sending is currently using the pre-warmed domain: <Text span fw={600} c={TV.textPrimary}>@mail-et.com</Text>
                </Text>
                <Text fz={12} c={TV.textSecondary} mt={4}>
                  Configure your organization's domain to allow ThankView to send emails on your behalf. This improves deliverability and ensures recipients see your brand in the "from" address.
                </Text>
              </div>
            </div>
            <Button
              color="tvPurple"
              leftSection={<Plus size={14} />}
              mt="md"
              onClick={() => setShowDomainModal(true)}
            >
              Set Up Domain
            </Button>
          </Box>
        )}

        {/* Domain list */}
        {hasDomains && (
          <>
            <Stack gap="xs">
              {domains.map(d => (
                <div key={d.id} className="rounded-[var(--mantine-radius-default)] p-4" style={{ border: `1px solid ${d.isDefault ? TV.borderStrong : TV.borderLight}`, backgroundColor: d.isDefault ? TV.brandTint : "white" }}>
                  <div className="flex items-start justify-between flex-nowrap">
                    <div className="flex items-center gap-3 flex-nowrap" style={{ flex: 1, minWidth: 0 }}>
                      <Box w={10} h={10} style={{ borderRadius: "50%", backgroundColor: statusDot(d.status), flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="flex items-center gap-2 flex-nowrap">
                          <Text fz={14} fw={600} c={TV.textPrimary} truncate>{d.domain}</Text>
                          {d.isDefault && hasMultiple && (
                            <Badge size="xs" variant="light" color="tvPurple" leftSection={<Star size={8} />}>Default</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 2 }}>
                          <Badge color={statusColor(d.status)} variant="light" size="xs">{statusLabel(d.status)}</Badge>
                          <Text fz={10} c={TV.textSecondary}>Added {d.addedAt}</Text>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-nowrap">
                      {d.status === "pending" && (
                        <Tooltip label="Re-check verification" withArrow>
                          <ActionIcon variant="light" color="tvPurple" radius="xl" size="sm" onClick={() => handleVerify(d.id)}>
                            <RefreshCw size={13} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="View DNS records" withArrow>
                        <ActionIcon variant="light" color="gray" radius="xl" size="sm" onClick={() => setShowDnsRecords(showDnsRecords === d.id ? null : d.id)}>
                          <Shield size={13} />
                        </ActionIcon>
                      </Tooltip>
                      {hasMultiple && !d.isDefault && (
                        <Tooltip label="Set as default" withArrow>
                          <ActionIcon variant="light" color="tvPurple" radius="xl" size="sm" onClick={() => handleSetDefault(d.id)}>
                            <Star size={13} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="Remove domain" withArrow>
                        <ActionIcon variant="light" color="red" radius="xl" size="sm" onClick={() => setConfirmRemove(d.id)}>
                          <Trash2 size={13} />
                        </ActionIcon>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Expandable DNS records */}
                  {showDnsRecords === d.id && (
                    <Box mt="sm" p="sm" bg={TV.surfaceMuted} style={{ borderRadius: 10, border: `1px solid ${TV.borderLight}` }}>
                      <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: 8 }}>
                        <Shield size={13} style={{ color: TV.brand }} />
                        <Text fz={12} fw={600} c={TV.textPrimary}>Required DNS Records</Text>
                      </div>
                      <Text fz={11} c={TV.textSecondary} mb="sm">Add these records to your DNS provider. Changes may take up to 48 hours to propagate.</Text>
                      <Stack gap={6}>
                        {dnsRecords(d.domain).map((rec, i) => (
                          <Box key={i} p="xs" bg="white" style={{ borderRadius: 8, border: `1px solid ${TV.borderDivider}`, fontFamily: "monospace" }}>
                            <div className="flex items-center gap-1.5 flex-nowrap" style={{ marginBottom: 4 }}>
                              <Badge size="xs" variant="light" color={rec.type === "TXT" ? "cyan" : "tvPurple"} radius="sm" styles={{ root: { fontFamily: "monospace" } }}>{rec.type}</Badge>
                              <Text fz={10} c={TV.textSecondary} fs="italic" style={{ fontFamily: "'Roboto', sans-serif" }}>{rec.purpose}</Text>
                            </div>
                            <div className="flex items-center gap-1 flex-nowrap">
                              <Text fz={11} c={TV.textLabel} style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                <Text span c={TV.textSecondary}>Host: </Text>{rec.host}
                              </Text>
                              <Tooltip label="Copy host" withArrow>
                                <ActionIcon variant="subtle" color="gray" size="xs" onClick={() => { navigator.clipboard.writeText(rec.host); show("Copied!", "success"); }}>
                                  <Copy size={10} />
                                </ActionIcon>
                              </Tooltip>
                            </div>
                            <div className="flex items-center gap-1 flex-nowrap" style={{ marginTop: 2 }}>
                              <Text fz={11} c={TV.textLabel} style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                <Text span c={TV.textSecondary}>Value: </Text>{rec.value}
                              </Text>
                              <Tooltip label="Copy value" withArrow>
                                <ActionIcon variant="subtle" color="gray" size="xs" onClick={() => { navigator.clipboard.writeText(rec.value); show("Copied!", "success"); }}>
                                  <Copy size={10} />
                                </ActionIcon>
                              </Tooltip>
                            </div>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </div>
              ))}
            </Stack>

            <Button
              variant="default"
              leftSection={<Plus size={13} />}
              radius="xl"
              size="sm"
              mt="sm"
              onClick={() => setShowDomainModal(true)}
              styles={{ root: { borderColor: TV.borderLight, color: TV.textSecondary } }}
            >
              Add Another Domain
            </Button>
          </>
        )}
      </div>

      {/* Multi-domain info banner */}
      {hasMultiple && (
        <Box bg={TV.brandTint} p="md" style={{ borderRadius: 12, border: `1px solid ${TV.borderStrong}` }}>
          <div className="flex items-start gap-3 flex-nowrap">
            <Users size={16} style={{ color: TV.brand, flexShrink: 0, marginTop: 2 }} />
            <div>
              <Text fz={13} fw={600} c={TV.textPrimary}>Multiple domains configured</Text>
              <Text fz={12} c={TV.textSecondary} mt={2}>
                You can assign a specific sending domain to each user in the <Text span fw={600} c={TV.brand}>Manage Users</Text> tab. Users without an assigned domain will send from the default domain (<Text span fw={600}>{domains.find(d => d.isDefault)?.domain}</Text>).
              </Text>
            </div>
          </div>
        </Box>
      )}

      {/* Fallback domain info */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader icon={Shield} title="Fallback Sending Domain" description="What happens when no custom domain is configured or a domain fails verification." />
        <Box px="lg" py="sm">
          <div className="flex items-start gap-3 flex-nowrap">
            <Box w={40} h={40} bg={TV.surface} style={{ borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Mail size={18} style={{ color: TV.brand }} />
            </Box>
            <div style={{ flex: 1 }}>
              <Text fz={13} fw={600} c={TV.textPrimary}>@mail-et.com</Text>
              <Text fz={12} c={TV.textSecondary}>
                This is ThankView's pre-warmed shared sending domain. All sends will come from this domain if no custom domain is configured or verified.
              </Text>
              {hasDomains && (
                <Text fz={11} c={TV.textSecondary} mt={4} fs="italic">
                  Since you have {domains.length} custom domain{domains.length > 1 ? "s" : ""}, this fallback will only be used if all custom domains fail verification.
                </Text>
              )}
            </div>
          </div>
        </Box>
      </div>

      {/* Help article link */}
      <Box px={4}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <ExternalLink size={12} style={{ color: TV.brand }} />
          <Text component="a" href="https://help.thankview.com/dns-setup" target="_blank" rel="noopener noreferrer" fz={12} fw={600} c={TV.brand} style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
            DNS Setup Guide — Help Center
          </Text>
        </div>
      </Box>

      {/* ── Add Domain Modal ── */}
      <Modal
        opened={showDomainModal}
        onClose={() => { setShowDomainModal(false); setNewDomain(""); }}
        title="Set Up Domain"
        size="lg"
        styles={{ title: { fontWeight: 900, fontSize: "16px", color: TV.textPrimary } }}
      >
        <Stack gap="md">
          <Text fz={13} c={TV.textSecondary}>
            Enter your organization's email sending domain. After adding it, you'll receive DNS records to provide to your IT team.
          </Text>

          <TextInput
            label="Sending Domain"
            placeholder="e.g. hartwell.edu or alumni.hartwell.edu"
            value={newDomain}
            onChange={e => setNewDomain(e.currentTarget.value)}
            description="Enter the domain you want to send emails from (e.g. hartwell.edu)."
          />

          {newDomain.trim() && (
            <Box bg={TV.surface} p="md" style={{ borderRadius: 12, border: `1px solid ${TV.borderLight}` }}>
              <div className="flex items-center gap-1.5 flex-wrap" style={{ marginBottom: 8 }}>
                <Info size={13} style={{ color: TV.brand }} />
                <Text fz={12} fw={600} c={TV.textPrimary}>What happens next</Text>
              </div>
              <Stack gap={4}>
                <div className="flex items-center gap-2 flex-nowrap">
                  <Box w={20} h={20} bg={TV.brandTint} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Text fz={10} fw={700} c={TV.brand}>1</Text>
                  </Box>
                  <Text fz={12} c={TV.textLabel}>We'll generate the required DNS records (TXT, CNAME)</Text>
                </div>
                <div className="flex items-center gap-2 flex-nowrap">
                  <Box w={20} h={20} bg={TV.brandTint} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Text fz={10} fw={700} c={TV.brand}>2</Text>
                  </Box>
                  <Text fz={12} c={TV.textLabel}>Your IT team adds these records to your DNS provider</Text>
                </div>
                <div className="flex items-center gap-2 flex-nowrap">
                  <Box w={20} h={20} bg={TV.brandTint} style={{ borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Text fz={10} fw={700} c={TV.brand}>3</Text>
                  </Box>
                  <Text fz={12} c={TV.textLabel}>Verification happens automatically (up to 48 hours)</Text>
                </div>
              </Stack>
            </Box>
          )}
        </Stack>

        <div className="flex items-center justify-end gap-3 mt-6">
          <Button variant="outline" color="red" radius="xl" onClick={() => { setShowDomainModal(false); setNewDomain(""); }}>
            Cancel
          </Button>
          <Button color="tvPurple" leftSection={<Plus size={14} />} onClick={handleAddDomain} disabled={!newDomain.trim()}>
            Add Domain
          </Button>
        </div>
      </Modal>

      {/* ── Remove confirmation modal ── */}
      {confirmRemove !== null && (
        <Modal
          opened
          onClose={() => setConfirmRemove(null)}
          withCloseButton={false}
          size={420}
          padding="lg"
        >
          <div className="flex items-start gap-4 mb-6 flex-nowrap">
            <Box
              w={44} h={44}
              style={{ borderRadius: "50%", backgroundColor: TV.dangerBg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              <AlertCircle size={20} style={{ color: TV.danger }} />
            </Box>
            <div style={{ flex: 1 }}>
              <Title order={3} fz={16} mb={4}>Remove Domain</Title>
              <Text fz={13} c={TV.textSecondary}>
                Are you sure you want to remove <Text span fw={600} c={TV.textPrimary}>{domains.find(d => d.id === confirmRemove)?.domain}</Text>? Sends from this domain will fall back to the default domain or @mail-et.com.
              </Text>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" color="red" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button color="red" onClick={() => handleRemove(confirmRemove)}>Remove</Button>
          </div>
        </Modal>
      )}
    </Stack>
  );
}

// ── Role descriptions & permission matrix ───────────────────────────────────────
const ROLE_DESCRIPTIONS: Record<string, string> = {
  "TV Admin":           "Full access — design pages, record & edit videos, manage campaigns & constituents, view metrics, invite & manage users, and configure org settings.",
  "Basic TV User":      "Design pages, record & edit videos, copy videos, customize & send campaigns, manage constituents & recipients, and view metrics. Cannot manage users or org settings.",
  "TV Content Creator": "Design envelopes & landing pages, record & edit videos, copy videos, and customize campaign content. Cannot manage recipients, send campaigns, or view metrics.",
  "TV Video Recorder":  "Record, upload, and edit videos only. No access to pages, campaigns, constituents, metrics, or settings.",
};

// Granular permission keys for the matrix table
const PERMISSION_KEYS = [
  { key: "designPages",       label: "Design Envelopes & Landing Pages" },
  { key: "recordEditVideos",  label: "Record, Upload, Edit & Caption Videos" },
  { key: "copyVideos",        label: "Copy Videos" },
  { key: "customizeCampaign", label: "Customize Campaign Content" },
  { key: "manageRecipients",  label: "Add / Adjust Campaign Recipients" },
  { key: "manageContacts",    label: "Add & Edit Constituents" },
  { key: "sendCampaigns",     label: "Send, Schedule, or Cancel Campaigns" },
  { key: "viewMetrics",       label: "View & Export Metrics" },
  { key: "viewUsers",         label: "View TV Users" },
  { key: "manageUsers",       label: "Invite & Manage Users w/ TV Roles" },
  { key: "orgSettings",       label: "Adjust TV Org Settings & Integrations" },
] as const;

const ROLE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  "TV Admin": {
    designPages: true, recordEditVideos: true, copyVideos: true, customizeCampaign: true,
    manageRecipients: true, manageContacts: true, sendCampaigns: true, viewMetrics: true,
    viewUsers: true, manageUsers: true, orgSettings: true,
  },
  "Basic TV User": {
    designPages: true, recordEditVideos: true, copyVideos: true, customizeCampaign: true,
    manageRecipients: true, manageContacts: true, sendCampaigns: true, viewMetrics: true,
    viewUsers: false, manageUsers: false, orgSettings: false,
  },
  "TV Content Creator": {
    designPages: true, recordEditVideos: true, copyVideos: true, customizeCampaign: true,
    manageRecipients: false, manageContacts: false, sendCampaigns: false, viewMetrics: false,
    viewUsers: false, manageUsers: false, orgSettings: false,
  },
  "TV Video Recorder": {
    designPages: false, recordEditVideos: true, copyVideos: false, customizeCampaign: false,
    manageRecipients: false, manageContacts: false, sendCampaigns: false, viewMetrics: false,
    viewUsers: false, manageUsers: false, orgSettings: false,
  },
};

/** Whether a role has campaign-send permissions */
const canSend = (role: string) => ROLE_PERMISSIONS[role]?.sendCampaigns === true;

/** Only verified domains are assignable */
const assignableDomains = () => MOCK_DOMAINS.filter(d => d.status === "verified");

// ── Users Column definitions ──────────────────────────────────────────────────
const USERS_ALL_COLUMNS: ColumnDef[] = [
  { key: "user",      label: "User",           group: "Summary", required: true },
  { key: "role",      label: "Role",           group: "Summary" },
  { key: "domain",    label: "Sending Domain", group: "Summary" },
  { key: "status",    label: "Status",         group: "Summary" },
  { key: "lastLogin", label: "Last Login",     group: "Summary" },
  { key: "email",     label: "Email",          group: "Details" },
];
const USERS_DEFAULT_COLUMNS = ["user", "role", "domain", "status", "lastLogin"];

// ── Billing Column definitions ────────────────────────────────────────────────
const BILLING_ALL_COLUMNS: ColumnDef[] = [
  { key: "date",   label: "Date",        group: "Summary", required: true },
  { key: "desc",   label: "Description", group: "Summary" },
  { key: "amount", label: "Amount",      group: "Summary" },
  { key: "status", label: "Status",      group: "Summary" },
];
const BILLING_DEFAULT_COLUMNS = ["date", "desc", "amount", "status"];

// ── Users Tab ──────────────────────────────────────────────────────────────────
function UsersTab() {
  const { show } = useToast();
  const [users, setUsers]         = useState(MOCK_USERS);
  const [usersPage, setUsersPage] = useState(1);
  const [usersRowsPerPage, setUsersRowsPerPage] = useState(10);
  const [usersSort, setUsersSort] = useState<SortState>({ key: null, dir: null });
  const [usersActiveCols, setUsersActiveCols] = useState<string[]>(USERS_DEFAULT_COLUMNS);
  const [showUsersEditCols, setShowUsersEditCols] = useState(false);
  const handleUsersSort = (key: string) => setUsersSort(prev => nextSort(prev, key));
  const sortedUsers = sortRows(users, usersSort, (u, key) => {
    switch (key) {
      case "user": return u.name;
      case "role": return u.role;
      case "domain": return u.sendingDomain ?? "";
      case "status": return u.status;
      case "lastLogin": return u.lastLogin;
      default: return "";
    }
  });
  const [showInvite, setShowInvite] = useState(false);
  const [roleModalUser, setRoleModalUser] = useState<typeof MOCK_USERS[0] | null>(null);
  const [pendingRole, setPendingRole] = useState<string>("");
  const [matrixOpen, setMatrixOpen] = useState(false);
  const [matrixSort, setMatrixSort] = useState<SortState>({ key: null, dir: null });
  const handleMatrixSort = (key: string) => setMatrixSort(prev => nextSort(prev, key));
  const [domainModalUser, setDomainModalUser] = useState<typeof MOCK_USERS[0] | null>(null);
  const [pendingDomain, setPendingDomain] = useState<string | null>(null);

  const handleInvite = (email: string, role: string) => {
    const newUser = { id: Date.now(), name: "Pending Invite", email, role, status: "Pending", lastLogin: null as string | null, sendingDomain: null as string | null };
    setUsers(u => [...u, newUser]);
    show(`Invite sent to ${email}`, "success");
  };

  const openDomainModal = (user: typeof MOCK_USERS[0]) => {
    setDomainModalUser(user);
    setPendingDomain(user.sendingDomain);
  };

  const handleDomainSave = () => {
    if (!domainModalUser) return;
    setUsers(u => u.map(x => x.id === domainModalUser.id ? { ...x, sendingDomain: pendingDomain } : x));
    const label = pendingDomain
      ? `${domainModalUser.name} will now send from ${pendingDomain}`
      : `${domainModalUser.name} will use the organization default domain`;
    show(label, "success");
    setDomainModalUser(null);
  };

  const defaultDomain = MOCK_DOMAINS.find(d => d.isDefault)?.domain ?? "mail-et.com";

  const openRoleModal = (user: typeof MOCK_USERS[0]) => {
    setRoleModalUser(user);
    setPendingRole(user.role);
  };

  const handleRoleSave = () => {
    if (!roleModalUser) return;
    setUsers(u => u.map(x => x.id === roleModalUser.id ? { ...x, role: pendingRole } : x));
    show(`${roleModalUser.name}'s role updated to ${pendingRole}`, "success");
    setRoleModalUser(null);
  };

  const handleRemove = (id: number) => {
    setUsers(u => u.filter(x => x.id !== id));
    show("User removed", "success");
  };

  const handleResendInvite = (email: string) => {
    show(`Invitation resent to ${email}`, "success");
  };

  return (
    <Stack gap="md">
      {/* Header bar */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <Box px="lg" py="sm" bg={TV.surfaceMuted} style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Users size={15} style={{ color: TV.brand }} />
                <Title order={4} fz={15}>Organization Users</Title>
                <Badge size="sm" variant="light" color="tvPurple" radius="sm">{users.length}</Badge>
              </div>
              <Text fz={12} c={TV.textSecondary} mt={2}>View all users, their roles, and last activity. Only Admins can manage users and permissions.</Text>
            </div>
            <div className="flex items-center gap-2">
              <Button leftSection={<Plus size={13} />} color="tvPurple" onClick={() => setShowInvite(true)} size="sm" radius="md">
                Invite User
              </Button>
              <ColumnsButton onClick={() => setShowUsersEditCols(true)} />
            </div>
          </div>
        </Box>

        {/* Desktop table */}
        <Box visibleFrom="sm" className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <Table verticalSpacing={0} horizontalSpacing={0} highlightOnHover
            styles={{ table: { borderCollapse: "collapse", minWidth: 700 }, td: { whiteSpace: "nowrap" } }}
          >
            <Table.Thead className="sticky top-0 z-20" style={{ backgroundColor: "#fff" }}>
              <Table.Tr style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
                {usersActiveCols.map(colKey => {
                  const col = USERS_ALL_COLUMNS.find(c => c.key === colKey);
                  if (!col) return null;
                  return (
                    <Table.Th key={colKey} style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <SortableHeader label={col.label} sortKey={colKey} currentSort={usersSort.key} currentDir={usersSort.dir} onSort={handleUsersSort} />
                    </Table.Th>
                  );
                })}
                <Table.Th w={44} style={{ padding: "10px 16px", verticalAlign: "middle" }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedUsers.slice((usersPage - 1) * usersRowsPerPage, usersPage * usersRowsPerPage).map(u => (
                <Table.Tr key={u.id} style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
                  {usersActiveCols.map(colKey => (
                    <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      {colKey === "user" ? (
                        <div className="flex items-center gap-2.5 flex-nowrap">
                          <Avatar size="sm" color={u.status === "Pending" ? "gray" : "tvPurple"} radius="xl">
                            {u.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
                          </Avatar>
                          <div style={{ minWidth: 0 }}>
                            <div className="flex items-center gap-1.5 flex-nowrap">
                              <Text fz={13} fw={600} c={TV.textPrimary} truncate>{u.name}</Text>
                              {u.id === 1 && <Badge size="xs" variant="light" color="tvPurple" radius="sm">You</Badge>}
                            </div>
                            <Text fz={11} c={TV.textSecondary} truncate>{u.email}</Text>
                          </div>
                        </div>
                      ) : colKey === "role" ? (
                        <Tooltip label={ROLE_DESCRIPTIONS[u.role] || ""} multiline w={260} withArrow position="top">
                          <Badge color={roleBadgeColor(u.role)} size="sm" style={{ cursor: "help" }}>{u.role}</Badge>
                        </Tooltip>
                      ) : colKey === "domain" ? (
                        canSend(u.role) ? (
                          <div className="flex items-center gap-1.5 flex-nowrap">
                            <Box w={6} h={6} style={{ borderRadius: "50%", backgroundColor: u.sendingDomain ? TV.success : TV.borderLight, flexShrink: 0 }} />
                            <Text fz={12} c={u.sendingDomain ? TV.textPrimary : TV.textDecorative} truncate style={{ maxWidth: 140 }}>
                              {u.sendingDomain ?? `Default (${defaultDomain})`}
                            </Text>
                          </div>
                        ) : (
                          <Text fz={11} c={TV.textDecorative} fs="italic">N/A</Text>
                        )
                      ) : colKey === "status" ? (
                        <Badge color={u.status === "Active" ? "green" : "yellow"} size="sm" variant="light">{u.status}</Badge>
                      ) : colKey === "lastLogin" ? (
                        u.lastLogin ? (
                          <Text fz={12} c={TV.textSecondary}>{u.lastLogin}</Text>
                        ) : (
                          <Text fz={12} c={TV.textDecorative} fs="italic">Never</Text>
                        )
                      ) : colKey === "email" ? (
                        <Text fz={12} c={TV.textSecondary}>{u.email}</Text>
                      ) : (
                        <Text fz={12} c={TV.textSecondary}>—</Text>
                      )}
                    </Table.Td>
                  ))}
                  <Table.Td style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                    <Menu shadow="md" width={180} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" radius="xl" size="sm" aria-label="User actions">
                          <MoreHorizontal size={14} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item fz={13} leftSection={<Shield size={13} />} onClick={() => openRoleModal(u)}>Change Role</Menu.Item>
                        {canSend(u.role) && (
                          <Menu.Item fz={13} leftSection={<Globe size={13} />} onClick={() => openDomainModal(u)}>Assign Domain</Menu.Item>
                        )}
                        {u.status === "Pending" && (
                          <Menu.Item fz={13} leftSection={<Mail size={13} />} onClick={() => handleResendInvite(u.email)}>Resend Invite</Menu.Item>
                        )}
                        <Menu.Divider />
                        <Menu.Item fz={13} color="red" leftSection={<Trash2 size={13} />} onClick={() => handleRemove(u.id)}>Remove User</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <TablePagination page={usersPage} rowsPerPage={usersRowsPerPage} totalRows={users.length}
            onPageChange={setUsersPage} onRowsPerPageChange={setUsersRowsPerPage} rowOptions={["5", "10", "25"]} />
        </Box>

        {/* Mobile cards */}
        <Box hiddenFrom="sm">
          {users.map(u => (
            <div key={u.id} className="flex items-center gap-4 flex-nowrap px-3 py-3" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
              <Avatar size="md" color={u.status === "Pending" ? "gray" : "tvPurple"} radius="xl">
                {u.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
              </Avatar>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-1.5 flex-nowrap">
                  <Text fz={13} fw={600} c={TV.textPrimary} truncate>{u.name}</Text>
                  {u.id === 1 && <Badge size="xs" variant="light" color="tvPurple" radius="sm">You</Badge>}
                </div>
                <Text fz={11} c={TV.textSecondary} truncate>{u.email}</Text>
                <div className="flex items-center gap-1.5 flex-wrap" style={{ marginTop: 4 }}>
                  <Badge color={roleBadgeColor(u.role)} size="xs">{u.role}</Badge>
                  <Badge color={u.status === "Active" ? "green" : "yellow"} size="xs" variant="light">{u.status}</Badge>
                </div>
                {canSend(u.role) && (
                  <div className="flex items-center gap-1 flex-wrap" style={{ marginTop: 4 }}>
                    <Globe size={10} style={{ color: TV.textSecondary }} />
                    <Text fz={10} c={u.sendingDomain ? TV.textLabel : TV.textDecorative}>
                      {u.sendingDomain ?? `Default (${defaultDomain})`}
                    </Text>
                  </div>
                )}
                {u.lastLogin ? (
                  <Text fz={10} c={TV.textDecorative} mt={2}>{u.lastLogin}</Text>
                ) : (
                  <Text fz={10} c={TV.textDecorative} fs="italic" mt={2}>Never logged in</Text>
                )}
              </div>
              <Menu shadow="md" width={180} position="bottom-end">
                <Menu.Target>
                  <ActionIcon variant="light" color="gray" radius="xl" aria-label="User actions">
                    <MoreHorizontal size={15} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item fz={13} leftSection={<Shield size={13} />} onClick={() => openRoleModal(u)}>Change Role</Menu.Item>
                  {canSend(u.role) && (
                    <Menu.Item fz={13} leftSection={<Globe size={13} />} onClick={() => openDomainModal(u)}>Assign Domain</Menu.Item>
                  )}
                  {u.status === "Pending" && (
                    <Menu.Item fz={13} leftSection={<Mail size={13} />} onClick={() => handleResendInvite(u.email)}>Resend Invite</Menu.Item>
                  )}
                  <Menu.Divider />
                  <Menu.Item fz={13} color="red" leftSection={<Trash2 size={13} />} onClick={() => handleRemove(u.id)}>Remove User</Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </div>
          ))}
        </Box>
      </div>

      {/* Role permissions matrix — collapsed by default */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <UnstyledButton
          w="100%"
          px="lg"
          py="sm"
          bg={TV.surfaceMuted}
          style={{ borderBottom: matrixOpen ? `1px solid ${TV.borderDivider}` : undefined }}
          onClick={() => setMatrixOpen(o => !o)}
        >
          <div className="flex items-center justify-between flex-nowrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Shield size={15} style={{ color: TV.brand }} />
              <div>
                <Title order={4} fz={15}>Role Permissions Matrix</Title>
                <Text fz={12} c={TV.textSecondary} mt={2}>Full breakdown of what each ThankView role can access.</Text>
              </div>
            </div>
            <ChevronDown
              size={18}
              style={{
                color: TV.textSecondary,
                transition: "transform 200ms ease",
                transform: matrixOpen ? "rotate(180deg)" : "rotate(0deg)",
                flexShrink: 0,
              }}
            />
          </div>
        </UnstyledButton>

        <Collapse in={matrixOpen}>
          <Box style={{ overflowX: "auto", maxHeight: "60vh", overflowY: "auto" }}>
            <Table verticalSpacing={0} horizontalSpacing={0} highlightOnHover
              styles={{ table: { borderCollapse: "collapse", minWidth: 700 }, td: { whiteSpace: "nowrap" } }}
            >
              <Table.Thead className="sticky top-0 z-20" style={{ backgroundColor: "#fff" }}>
                <Table.Tr style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
                  <Table.Th style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap", textAlign: "left", minWidth: 200 }}>
                    <SortableHeader label="Permission" sortKey="permission" currentSort={matrixSort.key} currentDir={matrixSort.dir} onSort={handleMatrixSort} />
                  </Table.Th>
                  {ROLES.map(r => (
                    <Table.Th key={r} style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap", textAlign: "center", minWidth: 110 }}>
                      <Badge color={roleBadgeColor(r)} size="xs" variant="light">{r}</Badge>
                    </Table.Th>
                  ))}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {sortRows([...PERMISSION_KEYS], matrixSort, (p, key) => key === "permission" ? p.label : "").map(p => (
                  <Table.Tr key={p.key} style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
                    <Table.Td style={{ padding: "12px 16px", verticalAlign: "middle" }}><Text fz={12} c={TV.textPrimary}>{p.label}</Text></Table.Td>
                    {ROLES.map(r => (
                      <Table.Td key={r} style={{ padding: "12px 16px", verticalAlign: "middle", textAlign: "center" }}>
                        {ROLE_PERMISSIONS[r]?.[p.key] ? (
                          <Check size={15} style={{ color: TV.success }} />
                        ) : (
                          <X size={15} style={{ color: TV.danger }} />
                        )}
                      </Table.Td>
                    ))}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Box>
          <Box px="lg" py={10} bg={TV.surfaceMuted} style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
            <Text fz={11} c={TV.textSecondary}>Role names updated from legacy terms: "Admin" → TV Admin, "Creator" → Basic TV User, "Recorder" → TV Video Recorder. TV Content Creator is a new role.</Text>
          </Box>
        </Collapse>
      </div>

      {/* Invite Modal */}
      <InviteModal opened={showInvite} onClose={() => setShowInvite(false)} onInvite={handleInvite} />

      {/* Change Role Modal */}
      <Modal
        opened={!!roleModalUser}
        onClose={() => setRoleModalUser(null)}
        title="Change User Role"
        centered
        size="md"
        radius="lg"
        styles={{ title: { fontWeight: 900, fontSize: "16px", color: TV.textPrimary } }}
      >
        {roleModalUser && (
          <Stack gap="md">
            <div className="flex items-center gap-3 flex-nowrap">
              <Avatar size="md" color="tvPurple" radius="xl">
                {roleModalUser.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
              </Avatar>
              <div>
                <Text fz={14} fw={600} c={TV.textPrimary}>{roleModalUser.name}</Text>
                <Text fz={12} c={TV.textSecondary}>{roleModalUser.email}</Text>
              </div>
            </div>

            <div>
              <FieldLabel>Select New Role</FieldLabel>
              <Stack gap={6}>
                {ROLES.map(r => (
                  <div
                    key={r}
                    className="rounded-[var(--mantine-radius-default)] px-4 py-2 border cursor-pointer transition-all"
                    style={{
                      borderWidth: 2,
                      borderColor: pendingRole === r ? TV.brand : TV.borderLight,
                      backgroundColor: pendingRole === r ? TV.brandTint : "white",
                    }}
                    onClick={() => setPendingRole(r)}
                  >
                    <div className="flex items-center justify-between flex-nowrap">
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Text fz={13} fw={600} c={pendingRole === r ? TV.brand : TV.textPrimary}>{r}</Text>
                          {roleModalUser.role === r && (
                            <Badge size="xs" variant="light" color="gray" radius="sm">Current</Badge>
                          )}
                        </div>
                        <Text fz={11} c={TV.textSecondary} mt={2}>{ROLE_DESCRIPTIONS[r]}</Text>
                      </div>
                      {pendingRole === r && <Check size={16} style={{ color: TV.brand, flexShrink: 0 }} />}
                    </div>
                  </div>
                ))}
              </Stack>
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <Button variant="outline" color="red" radius="md" onClick={() => setRoleModalUser(null)}>
                Cancel
              </Button>
              <Button
                color="tvPurple"
                radius="md"
                disabled={pendingRole === roleModalUser.role}
                onClick={handleRoleSave}
              >
                Save Role
              </Button>
            </div>
          </Stack>
        )}
      </Modal>

      {/* Edit Columns Modal */}
      {showUsersEditCols && (
        <EditColumnsModal columns={USERS_ALL_COLUMNS} active={usersActiveCols} onClose={() => setShowUsersEditCols(false)}
          onSave={cols => { setUsersActiveCols(cols); show("Columns updated!", "success"); }} />
      )}

      {/* Assign Sending Domain Modal */}
      <Modal
        opened={!!domainModalUser}
        onClose={() => setDomainModalUser(null)}
        title="Assign Sending Domain"
        centered
        size="md"
        radius="lg"
        styles={{ title: { fontWeight: 900, fontSize: "16px", color: TV.textPrimary } }}
      >
        {domainModalUser && (
          <Stack gap="md">
            <div className="flex items-center gap-3 flex-nowrap">
              <Avatar size="md" color="tvPurple" radius="xl">
                {domainModalUser.name.split(" ").slice(0, 2).map(n => n[0]).join("")}
              </Avatar>
              <div>
                <Text fz={14} fw={600} c={TV.textPrimary}>{domainModalUser.name}</Text>
                <Text fz={12} c={TV.textSecondary}>{domainModalUser.email}</Text>
              </div>
            </div>

            <Text fz={13} c={TV.textSecondary}>
              Choose which verified domain this user's campaign emails will be sent from. Only domains that have passed DNS verification can be assigned.
            </Text>

            <div>
              <FieldLabel>Select Sending Domain</FieldLabel>
              <Stack gap={6}>
                {/* "Use organization default" option */}
                <div
                  className="rounded-[var(--mantine-radius-default)] px-4 py-2 border cursor-pointer transition-all"
                  style={{
                    borderWidth: 2,
                    borderColor: pendingDomain === null ? TV.brand : TV.borderLight,
                    backgroundColor: pendingDomain === null ? TV.brandTint : "white",
                  }}
                  onClick={() => setPendingDomain(null)}
                >
                  <div className="flex items-center justify-between flex-nowrap">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Text fz={13} fw={600} c={pendingDomain === null ? TV.brand : TV.textPrimary}>Use Organization Default</Text>
                        <Badge size="xs" variant="light" color="tvPurple" leftSection={<Star size={7} />}>Default</Badge>
                      </div>
                      <Text fz={11} c={TV.textSecondary} mt={2}>Sends from <Text span fw={600}>{defaultDomain}</Text> — the organization's default sending domain.</Text>
                    </div>
                    {pendingDomain === null && <Check size={16} style={{ color: TV.brand, flexShrink: 0 }} />}
                  </div>
                </div>

                {/* Each verified domain */}
                {assignableDomains().map(d => (
                  <div
                    key={d.domain}
                    className="rounded-[var(--mantine-radius-default)] px-4 py-2 border cursor-pointer transition-all"
                    style={{
                      borderWidth: 2,
                      borderColor: pendingDomain === d.domain ? TV.brand : TV.borderLight,
                      backgroundColor: pendingDomain === d.domain ? TV.brandTint : "white",
                    }}
                    onClick={() => setPendingDomain(d.domain)}
                  >
                    <div className="flex items-center justify-between flex-nowrap">
                      <div style={{ flex: 1 }}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Text fz={13} fw={600} c={pendingDomain === d.domain ? TV.brand : TV.textPrimary}>{d.domain}</Text>
                          {d.isDefault && <Badge size="xs" variant="light" color="tvPurple" radius="sm">Org Default</Badge>}
                        </div>
                        <Text fz={11} c={TV.textSecondary} mt={2}>
                          Campaign emails from {domainModalUser.name.split(" ")[0]} will appear as <Text span fw={600} ff="monospace">{domainModalUser.email.split("@")[0]}@{d.domain}</Text>
                        </Text>
                      </div>
                      {pendingDomain === d.domain && <Check size={16} style={{ color: TV.brand, flexShrink: 0 }} />}
                    </div>
                  </div>
                ))}
              </Stack>
            </div>

            {/* Pending domains note */}
            {MOCK_DOMAINS.some(d => d.status === "pending") && (
              <Box p="sm" bg={TV.warningBg} style={{ borderRadius: 10, border: `1px solid ${TV.warningBorder}` }}>
                <div className="flex items-start gap-1.5 flex-nowrap">
                  <AlertCircle size={13} style={{ color: TV.warning, flexShrink: 0, marginTop: 2 }} />
                  <Text fz={11} c={TV.warningHover}>
                    {MOCK_DOMAINS.filter(d => d.status === "pending").map(d => d.domain).join(", ")} {MOCK_DOMAINS.filter(d => d.status === "pending").length === 1 ? "is" : "are"} pending DNS verification and cannot be assigned yet. Complete the DNS setup in the <Text span fw={600} c={TV.brand}>DNS Setup</Text> tab.
                  </Text>
                </div>
              </Box>
            )}

            <div className="flex items-center justify-end gap-3" style={{ marginTop: "var(--mantine-spacing-sm)" }}>
              <Button variant="outline" color="red" radius="md" onClick={() => setDomainModalUser(null)}>
                Cancel
              </Button>
              <Button
                color="tvPurple"
                radius="md"
                disabled={pendingDomain === domainModalUser.sendingDomain}
                onClick={handleDomainSave}
              >
                Save Domain
              </Button>
            </div>
          </Stack>
        )}
      </Modal>
    </Stack>
  );
}

// ── Notifications Tab ──────────────────────────────────────────────────────────
function NotificationsTab() {
  const { show } = useToast();
  const [notifs, setNotifs] = useState({
    campaignSent:    true,
    replyReceived:   true,
    videoProcessed:  false,
    weeklyDigest:    true,
    deliveryFailure: true,
  });

  const [emailNotifs, setEmailNotifs] = useState({
    replyForwarding:      true,
    campaignComplete:     true,
    exportReady:          true,
    teamInviteAccepted:   false,
    weeklyDigestEmail:    true,
    deliveryFailureEmail: true,
    billingAlerts:        true,
    newContactAdded:      false,
  });

  const ITEMS = [
    { key: "campaignSent",    label: "Campaign Sent",       desc: "When a campaign is successfully delivered" },
    { key: "replyReceived",   label: "Reply Received",      desc: "When a constituent sends a video reply" },
    { key: "videoProcessed",  label: "Video Processed",     desc: "When an uploaded video finishes processing" },
    { key: "weeklyDigest",    label: "Weekly Digest",       desc: "A summary of campaign performance every Monday" },
    { key: "deliveryFailure", label: "Delivery Failure",    desc: "When a message fails to deliver" },
  ] as const;

  const EMAIL_ITEMS = [
    { key: "replyForwarding",      label: "Reply Forwarding",        desc: "Forward constituent video replies to your inbox" },
    { key: "campaignComplete",     label: "Campaign Complete",       desc: "Email when a campaign finishes sending to all recipients" },
    { key: "exportReady",          label: "Export Ready",            desc: "Email when a CSV or data export is ready to download" },
    { key: "teamInviteAccepted",   label: "Team Invite Accepted",   desc: "Email when an invited team member joins your organization" },
    { key: "weeklyDigestEmail",    label: "Weekly Digest Email",     desc: "A performance summary email sent every Monday morning" },
    { key: "deliveryFailureEmail", label: "Delivery Failure Alert",  desc: "Email when a message bounces or fails to deliver" },
    { key: "billingAlerts",        label: "Billing & Subscription",  desc: "Payment receipts, plan changes, and usage alerts" },
    { key: "newContactAdded",      label: "New Constituent Added",       desc: "Email when constituents are added via import or integration" },
  ] as const;

  return (
    <Stack gap="lg" maw={672}>
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader title="In-App Notifications" description="Control which events trigger notifications in ThankView." />
        {ITEMS.map((item, i) => (
          <ToggleRow
            key={item.key}
            label={item.label}
            description={item.desc}
            checked={notifs[item.key]}
            onChange={() => setNotifs(n => ({ ...n, [item.key]: !n[item.key] }))}
            borderBottom={i < ITEMS.length - 1}
          />
        ))}
      </div>

      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader title="Email Notifications" description="Control which events send you an email. These are separate from in-app notifications." />
        {EMAIL_ITEMS.map((item, i) => (
          <ToggleRow
            key={item.key}
            label={item.label}
            description={item.desc}
            checked={emailNotifs[item.key]}
            onChange={() => setEmailNotifs(n => ({ ...n, [item.key]: !n[item.key] }))}
            borderBottom={i < EMAIL_ITEMS.length - 1}
          />
        ))}
      </div>

      <Button leftSection={<Check size={14} />} color="tvPurple" onClick={() => show("Notification preferences saved!", "success")}>
        Save Preferences
      </Button>
    </Stack>
  );
}

// ── Video & Recording Tab ──────────────────────────────────────────────────────
function VideoTab() {
  const { show } = useToast();
  const [defaultRes, setDefaultRes] = useState<"480" | "720" | "1080">("1080");
  const [teleprompter, setTeleprompter] = useState(true);
  const [bgBlur, setBgBlur] = useState(false);
  const [virtualBg, setVirtualBg] = useState(false);
  const [virtualBgUploaded, setVirtualBgUploaded] = useState(false);
  const [aiCaptions, setAiCaptions] = useState(true);
  const [revCaptions, setRevCaptions] = useState(false);

  const [captionDownload, setCaptionDownload] = useState(true);
  const [captionEdit, setCaptionEdit] = useState(true);
  const [autoRenewCredits, setAutoRenewCredits] = useState(true);
  const captionCreditBalance = 32.50;
  const [defaultView, setDefaultView] = useState<"grid" | "table">("grid");
  const [defaultSort, setDefaultSort] = useState("date_created");
  const [videoTagsEnabled, setVideoTagsEnabled] = useState(true);
  const [thumbnailUpload, setThumbnailUpload] = useState(true);
  const [combineEnabled, setCombineEnabled] = useState(true);
  const [autoConvert, setAutoConvert] = useState(true);
  const [outroEnabled, setOutroEnabled] = useState(true);
  const [selectedOutro, setSelectedOutro] = useState("hartwell_branded");
  const [outroUploaded, setOutroUploaded] = useState(false);

  const OUTRO_OPTIONS = [
    { value: "hartwell_branded", label: "Hartwell University — Branded Outro", duration: "0:06", uploaded: "Jan 12, 2026" },
    { value: "giving_day",       label: "Giving Day 2026 — Thank You",        duration: "0:08", uploaded: "Feb 3, 2026" },
    { value: "alumni_relations", label: "Alumni Relations — Stay Connected",   duration: "0:05", uploaded: "Nov 20, 2025" },
  ];

  return (
    <Stack gap="lg" maw={672}>
      {/* Recording Defaults */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader icon={Camera} title="Recording Defaults" description="Set organization-wide defaults for in-app video recording on desktop and mobile." />
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <FieldLabel>Default Recording Resolution</FieldLabel>
          <SimpleGrid cols={3} spacing="xs">
            {(["480", "720", "1080"] as const).map(res => (
              <Button
                key={res}
                variant={defaultRes === res ? "light" : "default"}
                color={defaultRes === res ? "tvPurple" : "gray"}
                radius="md"
                onClick={() => setDefaultRes(res)}
                styles={{
                  root: { borderWidth: 2, borderColor: defaultRes === res ? TV.brand : TV.borderLight, backgroundColor: defaultRes === res ? TV.brandTint : "white", height: "auto", padding: "10px 0" },
                  inner: { flexDirection: "column" as const },
                  label: { flexDirection: "column" as const, gap: 2 },
                }}
              >
                <Text fz={14} fw={600} c={defaultRes === res ? TV.brand : TV.textPrimary}>{res}p</Text>
                <Text fz={10} c={TV.textSecondary}>{res === "480" ? "Standard" : res === "720" ? "HD" : "Full HD"}</Text>
              </Button>
            ))}
          </SimpleGrid>
          <Text fz={10} c={TV.textSecondary} mt="xs">Users can override this per-recording. Higher resolutions require more bandwidth.</Text>
        </Box>
        <ToggleRow label="Script / Teleprompter" description="Allow users to type a script visible on-screen while recording." checked={teleprompter} onChange={() => setTeleprompter(!teleprompter)} />
        <ToggleRow label="Background Blur" description="Allow users to blur their background during desktop recording." checked={bgBlur} onChange={() => setBgBlur(!bgBlur)} />
        <Box px="lg" py="sm">
          <div className="flex items-start justify-between flex-nowrap" style={{ marginBottom: virtualBg ? "var(--mantine-spacing-sm)" : 0 }}>
            <div>
              <Text fz={13} fw={600} c={TV.textPrimary}>Virtual Background</Text>
              <Text fz={12} c={TV.textSecondary}>Allow users to select an image as a virtual background during desktop recording.</Text>
            </div>
            <Switch checked={virtualBg} onChange={() => setVirtualBg(!virtualBg)} size="md" color="tvPurple.6" styles={{ track: { cursor: "pointer" } }} />
          </div>
          {virtualBg && (
            <div>
              <FieldLabel>Default Organization Background</FieldLabel>
              <Button
                variant="default"
                fullWidth
                onClick={() => setVirtualBgUploaded(!virtualBgUploaded)}
                radius="md"
                styles={{
                  root: {
                    borderWidth: 2, borderStyle: "dashed", height: "auto", padding: "12px",
                    borderColor: virtualBgUploaded ? TV.success : TV.border,
                    backgroundColor: virtualBgUploaded ? TV.successBg : "white",
                  },
                  label: { justifyContent: "flex-start" },
                }}
              >
                <div className="flex items-center gap-3 flex-nowrap">
                  {virtualBgUploaded ? (
                    <>
                      <Box w={40} h={40} bg={TV.successBg} style={{ border: `1px solid ${TV.successBorder}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={16} style={{ color: TV.success }} />
                      </Box>
                      <div>
                        <Text fz={12} fw={600} c={TV.textPrimary}>hartwell_bg.jpg</Text>
                        <Text fz={11} c={TV.textSecondary}>1920 x 1080 px</Text>
                      </div>
                    </>
                  ) : (
                    <>
                      <Box w={40} h={40} bg={TV.surface} style={{ borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Upload size={16} style={{ color: TV.textSecondary }} />
                      </Box>
                      <Text fz={12} c={TV.textSecondary}>Upload background image (JPG, PNG)</Text>
                    </>
                  )}
                </div>
              </Button>
            </div>
          )}
        </Box>
      </div>

      {/* Default Outro */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader icon={Clapperboard} title="Default Outro" description="Set a default outro clip that is automatically appended to the end of every video recorded or uploaded in your portal." />
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <div className="flex items-start justify-between flex-nowrap">
            <div style={{ flex: 1 }}>
              <Text fz={13} fw={600} c={TV.textPrimary}>Enable Default Outro</Text>
              <Text fz={12} c={TV.textSecondary}>When enabled, this outro will be appended to all new videos by default. Users can remove the outro from individual videos if needed.</Text>
            </div>
            <Switch
              checked={outroEnabled}
              onChange={() => setOutroEnabled(!outroEnabled)}
              size="md"
              color="tvPurple.6"
              styles={{ track: { cursor: "pointer" } }}
            />
          </div>
        </Box>

        {outroEnabled && (
          <>
            <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
              <Select
                label="Selected Outro"
                description="Choose which outro clip to use as the portal default. All users in your organization will see this outro appended to their videos."
                value={selectedOutro}
                onChange={v => v && setSelectedOutro(v)}
                data={OUTRO_OPTIONS.map(o => ({ value: o.value, label: o.label }))}
              />
              {/* Selected outro details */}
              {(() => {
                const selected = OUTRO_OPTIONS.find(o => o.value === selectedOutro);
                if (!selected) return null;
                return (
                  <Box mt="sm" p="sm" bg={TV.surface} style={{ borderRadius: 10, border: `1px solid ${TV.borderLight}` }}>
                    <div className="flex items-center gap-3 flex-nowrap">
                      <Box
                        w={64} h={36}
                        style={{
                          borderRadius: 6,
                          backgroundColor: TV.textPrimary,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          position: "relative", overflow: "hidden", flexShrink: 0,
                        }}
                      >
                        <div style={{ position: "absolute", inset: 0, opacity: 0.25, backgroundImage: `radial-gradient(circle, ${TV.brand} 0%, transparent 70%)` }} />
                        <Play size={14} style={{ color: "white", zIndex: 1, marginLeft: 1 }} />
                      </Box>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text fz={12} fw={600} c={TV.textPrimary} truncate>{selected.label}</Text>
                        <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 2 }}>
                          <Text fz={10} c={TV.textSecondary}>Duration: {selected.duration}</Text>
                          <Text fz={10} c={TV.textSecondary}>Uploaded: {selected.uploaded}</Text>
                        </div>
                      </div>
                    </div>
                  </Box>
                );
              })()}
            </Box>

            {/* Upload new outro */}
            <Box px="lg" py="sm">
              <FieldLabel>Upload New Outro</FieldLabel>
              <Button
                variant="default"
                fullWidth
                onClick={() => setOutroUploaded(!outroUploaded)}
                radius="md"
                styles={{
                  root: {
                    borderWidth: 2, borderStyle: "dashed", height: "auto", padding: "12px",
                    borderColor: outroUploaded ? TV.success : TV.border,
                    backgroundColor: outroUploaded ? TV.successBg : "white",
                  },
                  label: { justifyContent: "flex-start" },
                }}
              >
                <div className="flex items-center gap-3 flex-nowrap">
                  {outroUploaded ? (
                    <>
                      <Box w={40} h={40} bg={TV.successBg} style={{ border: `1px solid ${TV.successBorder}`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={16} style={{ color: TV.success }} />
                      </Box>
                      <div>
                        <Text fz={12} fw={600} c={TV.textPrimary}>new_outro_2026.mp4</Text>
                        <Text fz={11} c={TV.textSecondary}>0:07 · 1920 x 1080 · Uploaded just now</Text>
                      </div>
                    </>
                  ) : (
                    <>
                      <Box w={40} h={40} bg={TV.surface} style={{ borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Upload size={16} style={{ color: TV.textSecondary }} />
                      </Box>
                      <div>
                        <Text fz={12} c={TV.textSecondary}>Upload a video file (MP4, MOV · max 30 seconds)</Text>
                        <Text fz={10} c={TV.textSecondary} mt={2}>Recommended: 1920x1080, under 10 seconds for best engagement</Text>
                      </div>
                    </>
                  )}
                </div>
              </Button>
            </Box>
          </>
        )}

        <Box px="lg" py={10} bg={TV.surfaceMuted} style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
          <Text fz={11} c={TV.textSecondary}>The outro plays after the main video content ends. Users can remove or replace the outro on a per-video basis from the Video Library.</Text>
        </Box>
      </div>

      {/* Closed Captions */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader icon={Captions} title="Closed Captions" description="Configure captioning options for video accessibility across your portal." />

        {/* AI Captioning — portal-level toggle */}
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <div className="flex items-start justify-between flex-nowrap">
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2 flex-wrap">
                <Sparkles size={13} style={{ color: TV.brand }} />
                <Text fz={13} fw={600} c={TV.textPrimary}>AI Closed Captioning</Text>
              </div>
              <Text fz={12} c={TV.textSecondary} mt={4}>When enabled, all new videos recorded or uploaded in your portal will be automatically captioned using AI. This applies organization-wide — individual users do not need to take any action.</Text>
              <Text fz={10} c={TV.textSecondary} fs="italic" mt={4}>~20% of recent library videos use AI captions.</Text>
            </div>
            <Switch checked={aiCaptions} onChange={() => setAiCaptions(!aiCaptions)} size="md" color="tvPurple.6" styles={{ track: { cursor: "pointer" } }} />
          </div>
        </Box>

        {/* Human-Written Captions — paid feature */}
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <div className="flex items-start justify-between flex-nowrap" style={{ marginBottom: revCaptions ? "var(--mantine-spacing-sm)" : 0 }}>
            <div style={{ flex: 1 }}>
              <div className="flex items-center gap-2 flex-wrap">
                <UserCheck size={13} style={{ color: TV.brand }} />
                <Text fz={13} fw={600} c={TV.textPrimary}>Human-Written Captions</Text>
                <Badge size="xs" variant="light" color="tvPurple" radius="sm">Paid</Badge>
              </div>
              <Text fz={12} c={TV.textSecondary} mt={4}>Enable this to allow users in your portal to submit videos for professional, human-written captions. Each caption request uses credits from your organization's caption balance. This is ideal for high-visibility videos like donor thank-yous, campaign launches, or official addresses where accuracy matters most.</Text>
            </div>
            <Switch checked={revCaptions} onChange={() => setRevCaptions(!revCaptions)} size="md" color="tvPurple.6" styles={{ track: { cursor: "pointer" } }} />
          </div>

          {revCaptions && (
            <Stack gap="sm">
              {/* Credit balance card */}
              <Box p="sm" bg={TV.surface} style={{ borderRadius: 10, border: `1px solid ${TV.borderLight}` }}>
                <div className="flex items-center justify-between flex-nowrap">
                  <div className="flex items-center gap-3 flex-nowrap">
                    <Box w={36} h={36} bg="white" style={{ borderRadius: 8, border: `1px solid ${TV.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <DollarSign size={16} style={{ color: TV.brand }} />
                    </Box>
                    <div>
                      <Text fz={12} fw={600} c={TV.textPrimary}>Caption Credit Balance</Text>
                      <Text fz={11} c={TV.textSecondary}>Used for human-written caption requests</Text>
                    </div>
                  </div>
                  <Text fz={18} fw={700} c={TV.textPrimary}>${captionCreditBalance.toFixed(2)}</Text>
                </div>
              </Box>

              {/* Auto-renew toggle */}
              <Box p="sm" bg={autoRenewCredits ? TV.successBg : TV.surfaceMuted} style={{ borderRadius: 10, border: `1px solid ${autoRenewCredits ? TV.successBorder : TV.borderLight}` }}>
                <div className="flex items-start justify-between flex-nowrap">
                  <div className="flex items-start gap-3 flex-nowrap">
                    <Box w={36} h={36} bg="white" style={{ borderRadius: 8, border: `1px solid ${autoRenewCredits ? TV.successBorder : TV.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <RotateCcw size={14} style={{ color: autoRenewCredits ? TV.success : TV.textSecondary }} />
                    </Box>
                    <div style={{ flex: 1 }}>
                      <Text fz={12} fw={600} c={TV.textPrimary}>Auto-Renew Credits</Text>
                      <Text fz={11} c={TV.textSecondary} mt={2}>Automatically add <Text span fw={600} c={TV.textPrimary}>$50.00</Text> in caption credits when your balance falls below <Text span fw={600} c={TV.textPrimary}>$0.00</Text>. This ensures your users never lose access to human captioning while they're working.</Text>
                      {autoRenewCredits && (
                        <Text fz={10} c={TV.success} fs="italic" mt={4}>Auto-renew is active. Your payment method on file will be charged $50.00 when the balance is depleted.</Text>
                      )}
                    </div>
                  </div>
                  <Switch checked={autoRenewCredits} onChange={() => setAutoRenewCredits(!autoRenewCredits)} size="md" color="tvPurple" styles={{ track: { cursor: "pointer" } }} />
                </div>
              </Box>

              <Text fz={10} c={TV.textSecondary} fs="italic">Human captioning typically takes 12–24 hours per video. Credits are deducted when the caption request is submitted.</Text>
            </Stack>
          )}
        </Box>

        {/* Additional caption tools */}
        <ToggleRow label="Edit Captions In-App" description="Allow users to edit caption text directly within ThankView after captions are added." checked={captionEdit} onChange={() => setCaptionEdit(!captionEdit)} />
        <ToggleRow label="Caption Download" description="Allow users to download caption files (VTT/SRT) from captioned videos." checked={captionDownload} onChange={() => setCaptionDownload(!captionDownload)} borderBottom={false} />
        <Box px="lg" py={10} bg={TV.surfaceMuted} style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
          <Text fz={11} c={TV.textSecondary}>Users can also upload VTT or SRT caption files manually per video from the Video Library.</Text>
        </Box>
      </div>

      {/* Video Library Defaults */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader icon={Video} title="Video Library Defaults" description="Set defaults for how the video library displays and organizes content." />
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <FieldLabel>Default View</FieldLabel>
          <SegmentedControl
            value={defaultView}
            onChange={v => setDefaultView(v as "grid" | "table")}
            data={[
              { label: "Grid View", value: "grid" },
              { label: "Table View", value: "table" },
            ]}
            fullWidth
            radius="md"
            color="tvPurple"
            styles={{
              root: { backgroundColor: TV.surface, border: `1px solid ${TV.borderLight}` },
            }}
          />
        </Box>
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <Select
            label="Default Sort Order"
            value={defaultSort}
            onChange={v => v && setDefaultSort(v)}
            data={[
              { value: "date_created",  label: "Date Created (newest first)" },
              { value: "title",         label: "Title (A-Z)" },
              { value: "date_modified", label: "Date Modified (newest first)" },
              { value: "duration",      label: "Video Duration (longest first)" },
            ]}
          />
        </Box>
        <ToggleRow label="Video Tags" description="Allow users to add searchable tags to library videos." checked={videoTagsEnabled} onChange={() => setVideoTagsEnabled(!videoTagsEnabled)} borderBottom={false} extra={
          <>
            <Text fz={13} fw={600} c={TV.textPrimary}>Video Tags</Text>
            <Text fz={12} c={TV.textSecondary}>Allow users to add searchable tags to library videos.</Text>
            <Text fz={10} c={TV.textSecondary} fs="italic" mt={2}>~20% of library videos currently have tags.</Text>
          </>
        } />
      </div>

      {/* Video Editing & Upload */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader icon={Monitor} title="Video Editing & Upload" description="Configure which editing tools and upload options are available." />
        <ToggleRow label="Custom Thumbnails" description="Allow users to upload a custom image as the video thumbnail." checked={thumbnailUpload} onChange={() => setThumbnailUpload(!thumbnailUpload)} extra={
          <>
            <Text fz={13} fw={600} c={TV.textPrimary}>Custom Thumbnails</Text>
            <Text fz={12} c={TV.textSecondary}>Allow users to upload a custom image as the video thumbnail.</Text>
            <Text fz={10} c={TV.textSecondary} fs="italic" mt={2}>~36% of recent videos have a custom thumbnail.</Text>
          </>
        } />
        <ToggleRow label="Combine / Splice Videos" description="Allow users to combine multiple library videos into a new video." checked={combineEnabled} onChange={() => setCombineEnabled(!combineEnabled)} extra={
          <>
            <Text fz={13} fw={600} c={TV.textPrimary}>Combine / Splice Videos</Text>
            <Text fz={12} c={TV.textSecondary}>Allow users to combine multiple library videos into a new video.</Text>
            <Text fz={10} c={TV.textSecondary} fs="italic" mt={2}>~3% of library videos are the result of combining other videos.</Text>
          </>
        } />
        <ToggleRow label="Auto-Convert Uploads to 4:3" description="Automatically reformat uploaded videos to 4:3 aspect ratio for consistency." checked={autoConvert} onChange={() => setAutoConvert(!autoConvert)} borderBottom={false} />
        <Box px="lg" py={10} bg={TV.surfaceMuted} style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
          <Text fz={11} c={TV.textSecondary}>Crop, trim, and rotate tools are always available for all users in the video editor.</Text>
        </Box>
      </div>

      <Button leftSection={<Check size={14} />} color="tvPurple" onClick={() => show("Video & recording settings saved!", "success")}>
        Save Settings
      </Button>
    </Stack>
  );
}

// ── 1:1 Video Tab ──────────────────────────────────────────────────────────────
function OneToOneTab() {
  const { show } = useToast();
  const [defaultAccent, setDefaultAccent] = useState(TV.brand);
  const [defaultCta, setDefaultCta] = useState("Watch My Message");
  const [showReply, setShowReply] = useState(true);
  const [showCta, setShowCta] = useState(true);
  const [linkFormat, setLinkFormat] = useState<"short" | "full">("short");
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [linkExpiry, setLinkExpiry] = useState("never");
  const [metricsView, setMetricsView] = useState(true);
  const [metricsCta, setMetricsCta] = useState(true);
  const [metricsWatch, setMetricsWatch] = useState(true);
  const [metricsDuration, setMetricsDuration] = useState(true);

  const ACCENT_PRESETS = [
    { label: "True Purple",     value: TV.brand },
    { label: "Hartwell Navy",   value: "#1B3461" },
    { label: "Hartwell Gold",   value: "#C8962A" },
    { label: "Heritage Maroon", value: "#6B1E33" },
    { label: "Success Green",   value: TV.success },
  ];

  return (
    <Stack gap="lg" maw={672}>
      {/* Explainer */}
      <Box bg={TV.brandTint} p="md" style={{ borderRadius: 20, border: `1px solid ${TV.borderStrong}` }}>
        <div className="flex items-start gap-3 flex-nowrap">
          <Link2 size={18} style={{ color: TV.brand, flexShrink: 0, marginTop: 2 }} />
          <div>
            <Text fz={13} fw={600} c={TV.textPrimary}>What is 1:1 Video?</Text>
            <Text fz={12} c={TV.textSecondary} mt={2}>Every library video can be shared as a 1:1 link — a personal video URL that recipients can click to view on a branded landing page. You can paste these links directly into any email or message. Configure your organization's defaults below.</Text>
          </div>
        </div>
      </Box>

      {/* Landing Page Defaults */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader icon={Globe} title="Landing Page Defaults" description="Set the default appearance for 1:1 video landing pages. Users can customize per-video." />
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <FieldLabel>Default Accent Color</FieldLabel>
          <div className="flex items-center gap-2.5 flex-wrap">
            {ACCENT_PRESETS.map(c => (
              <Tooltip key={c.value} label={c.label} withArrow>
                <Button
                  variant={defaultAccent === c.value ? "light" : "default"}
                  color={defaultAccent === c.value ? "tvPurple" : "gray"}
                  radius="md"
                  size="sm"
                  onClick={() => setDefaultAccent(c.value)}
                  styles={{
                    root: { borderWidth: 2, borderColor: defaultAccent === c.value ? TV.brand : TV.borderLight, backgroundColor: defaultAccent === c.value ? TV.brandTint : "white", paddingLeft: 10, paddingRight: 12 },
                  }}
                  leftSection={<ColorSwatch color={c.value} size={20} />}
                  rightSection={defaultAccent === c.value ? <Check size={11} style={{ color: TV.brand }} /> : undefined}
                >
                  <Text fz={12} fw={500} c={defaultAccent === c.value ? TV.brand : TV.textPrimary}>{c.label}</Text>
                </Button>
              </Tooltip>
            ))}
            {/* Custom color picker */}
            <label style={{ cursor: "pointer" }}>
              <Button
                component="span"
                variant={!ACCENT_PRESETS.some(c => c.value === defaultAccent) ? "light" : "default"}
                color={!ACCENT_PRESETS.some(c => c.value === defaultAccent) ? "tvPurple" : "gray"}
                radius="md"
                size="sm"
                styles={{
                  root: {
                    borderWidth: 2,
                    borderColor: !ACCENT_PRESETS.some(c => c.value === defaultAccent) ? TV.brand : TV.borderLight,
                    backgroundColor: !ACCENT_PRESETS.some(c => c.value === defaultAccent) ? TV.brandTint : "white",
                    paddingLeft: 10, paddingRight: 12,
                    position: "relative" as const, overflow: "visible",
                  },
                }}
                leftSection={
                  <Box w={20} h={20} style={{ borderRadius: "50%", overflow: "hidden", position: "relative", border: `1px solid ${TV.borderLight}`, background: !ACCENT_PRESETS.some(c => c.value === defaultAccent) ? defaultAccent : "conic-gradient(from 0deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)" }}>
                    <input type="color" value={defaultAccent} onChange={e => setDefaultAccent(e.target.value)} style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%" }} />
                  </Box>
                }
                rightSection={!ACCENT_PRESETS.some(c => c.value === defaultAccent) ? <Check size={11} style={{ color: TV.brand }} /> : undefined}
              >
                <Text fz={12} fw={500} c={!ACCENT_PRESETS.some(c => c.value === defaultAccent) ? TV.brand : TV.textPrimary}>Custom</Text>
              </Button>
            </label>
          </div>
        </Box>
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <TextInput
            label="Default CTA Button Text"
            value={defaultCta}
            onChange={e => setDefaultCta(e.currentTarget.value)}
            placeholder="e.g. Watch My Message"
            description="This text appears on the primary button on the landing page."
          />
        </Box>
        <ToggleRow label="Show Call to Action" description="Display a CTA button below the video on the landing page." checked={showCta} onChange={() => setShowCta(!showCta)} />
        <ToggleRow label="Show Reply Form" description="Include a reply / comment box on the 1:1 landing page by default." checked={showReply} onChange={() => setShowReply(!showReply)} borderBottom={false} />

        {/* Mini Preview */}
        <Box px="lg" py="sm" bg={TV.surfaceMuted} style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
          <Text fz={10} fw={600} c={TV.textSecondary} tt="uppercase" lts="0.05em" mb={8}>Preview</Text>
          <Box bg="white" style={{ borderRadius: 12, border: `1px solid ${TV.borderLight}`, overflow: "hidden", maxWidth: 280 }}>
            <Box h={4} style={{ backgroundColor: defaultAccent }} />
            <Box p="sm">
              <Box style={{ aspectRatio: "16/9", backgroundColor: TV.textPrimary, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", marginBottom: 8 }}>
                <div style={{ position: "absolute", inset: 0, opacity: 0.2, backgroundImage: `radial-gradient(circle, ${defaultAccent} 0%, transparent 70%)` }} />
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                  <div style={{ width: 0, height: 0, marginLeft: 2, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderLeft: "7px solid white" }} />
                </div>
              </Box>
              {showCta && (
                <Box py={6} mb={6} style={{ borderRadius: 999, backgroundColor: defaultAccent, textAlign: "center" }}>
                  <Text fz={9} fw={700} c="white">{defaultCta}</Text>
                </Box>
              )}
              {showReply && (
                <Box px="xs" py={6} style={{ border: `1px solid ${TV.borderLight}`, borderRadius: 6 }}>
                  <Text fz={8} c={TV.textSecondary}>Leave a reply...</Text>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </div>

      {/* Link Settings */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader icon={ExternalLink} title="Link Settings" description="Configure how 1:1 video links are generated and shared." />
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <FieldLabel>Link Format</FieldLabel>
          <SimpleGrid cols={2} spacing="xs">
            {(["short", "full"] as const).map(fmt => (
              <Button
                key={fmt}
                variant={linkFormat === fmt ? "light" : "default"}
                color={linkFormat === fmt ? "tvPurple" : "gray"}
                radius="md"
                onClick={() => setLinkFormat(fmt)}
                styles={{
                  root: { borderWidth: 2, borderColor: linkFormat === fmt ? TV.brand : TV.borderLight, backgroundColor: linkFormat === fmt ? TV.brandTint : "white", height: "auto", padding: "12px 0" },
                  inner: { flexDirection: "column" as const },
                  label: { flexDirection: "column" as const, gap: 2 },
                }}
              >
                <Text fz={12} fw={600} c={linkFormat === fmt ? TV.brand : TV.textPrimary}>{fmt === "short" ? "Short Link" : "Full URL"}</Text>
                <Text fz={10} c={TV.textSecondary} ff="monospace" mt={2}>{fmt === "short" ? "tv.ht/abc123" : "thankview.com/hartwell/v/abc123"}</Text>
              </Button>
            ))}
          </SimpleGrid>
        </Box>
        <ToggleRow label="View Tracking" description="Track when recipients open and view the 1:1 video landing page." checked={trackingEnabled} onChange={() => setTrackingEnabled(!trackingEnabled)} />
        <Box px="lg" py="sm">
          <Select
            label="Link Expiration"
            value={linkExpiry}
            onChange={v => v && setLinkExpiry(v)}
            data={[
              { value: "never", label: "Never expire" },
              { value: "30",    label: "30 days after creation" },
              { value: "90",    label: "90 days after creation" },
              { value: "365",   label: "1 year after creation" },
            ]}
            description="Expired links will show a friendly 'this video is no longer available' page."
          />
        </Box>
      </div>

      {/* 1:1 Metrics */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader icon={ChartBar} title="1:1 Video Metrics" description="Choose which metrics to display and include in exports for 1:1 videos." />
        {[
          { key: "metricsView",     label: "Total Views",            desc: "Track total views per 1:1 video link",                                                on: metricsView,     set: () => setMetricsView(!metricsView) },
          { key: "metricsCta",      label: "CTA Interactions",       desc: "Track how many viewers click the call-to-action button (count and %)",                 on: metricsCta,      set: () => setMetricsCta(!metricsCta) },
          { key: "metricsWatch",    label: "Watch Completion",       desc: "Track how many viewers started and watched the full video (count and %)",               on: metricsWatch,    set: () => setMetricsWatch(!metricsWatch) },
          { key: "metricsDuration", label: "Average View Duration",  desc: "Track the average amount of time viewers spend watching the video",                     on: metricsDuration, set: () => setMetricsDuration(!metricsDuration) },
        ].map((m, i, arr) => (
          <ToggleRow key={m.key} label={m.label} description={m.desc} checked={m.on} onChange={m.set} borderBottom={i < arr.length - 1} />
        ))}
        <Box px="lg" py={10} bg={TV.surfaceMuted} style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
          <Text fz={11} c={TV.textSecondary}>Users can view and export a list of each video's title, creator, 1:1 link, and selected metrics from the Video Library.</Text>
        </Box>
      </div>

      <Button leftSection={<Check size={14} />} color="tvPurple" onClick={() => show("1:1 Video settings saved!", "success")}>
        Save Settings
      </Button>
    </Stack>
  );
}

// ── Subscription & Billing Tab ──────────────────────────────────────────────
function SubscriptionTab() {
  const { show } = useToast();
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardZip, setCardZip] = useState("");
  const [billingSort, setBillingSort] = useState<SortState>({ key: null, dir: null });
  const handleBillingSort = (key: string) => setBillingSort(prev => nextSort(prev, key));
  const [billingActiveCols, setBillingActiveCols] = useState<string[]>(BILLING_DEFAULT_COLUMNS);
  const [showBillingEditCols, setShowBillingEditCols] = useState(false);

  // Mock current card
  const currentCard = { brand: "Visa", last4: "4242", expiry: "09/27", name: "Kelley Molt" };

  const handleUpdateCard = () => {
    if (!cardNumber || !cardExpiry || !cardCvc || !cardName) {
      show("Please fill in all card fields.", "warning");
      return;
    }
    show("Payment method updated successfully.", "success");
    setCardModalOpen(false);
    setCardNumber("");
    setCardExpiry("");
    setCardCvc("");
    setCardName("");
    setCardZip("");
  };

  return (
    <Stack gap="md">
      {/* Current Plan */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader icon={Receipt} title="Subscription Plan" description="Your current ThankView subscription details." />
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <div className="flex items-center justify-between flex-nowrap">
            <div>
              <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                <Text fz={13} fw={600} c={TV.textPrimary}>ThankView Pro</Text>
                <Badge size="xs" variant="light" color="green" radius="sm">Active</Badge>
              </div>
              <Text fz={12} c={TV.textSecondary}>Annual plan · Billed yearly · Renews on March 15, 2027</Text>
            </div>
            <Text fz={18} fw={700} c={TV.textPrimary}>$2,400<Text span fz={11} fw={400} c={TV.textSecondary}>/yr</Text></Text>
          </div>
        </Box>
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <SimpleGrid cols={3} spacing="md">
            <div>
              <Text fz={11} c={TV.textSecondary}>Users Included</Text>
              <Text fz={13} fw={600} c={TV.textPrimary}>25</Text>
            </div>
            <div>
              <Text fz={11} c={TV.textSecondary}>Videos This Period</Text>
              <Text fz={13} fw={600} c={TV.textPrimary}>1,247</Text>
            </div>
            <div>
              <Text fz={11} c={TV.textSecondary}>Storage Used</Text>
              <Text fz={13} fw={600} c={TV.textPrimary}>18.3 GB <Text span fz={11} fw={400} c={TV.textSecondary}>/ 50 GB</Text></Text>
            </div>
          </SimpleGrid>
        </Box>
        <Box px="lg" py={10} bg={TV.surfaceMuted} style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
          <Text fz={11} c={TV.textSecondary}>To change or cancel your plan, contact your ThankView account representative.</Text>
        </Box>
      </div>

      {/* Payment Method */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <SectionHeader icon={CreditCard} title="Payment Method" description="Manage the credit card on file for subscription and caption credit charges." />
        <Box px="lg" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <div className="flex items-center justify-between flex-nowrap">
            <div className="flex items-center gap-3 flex-nowrap">
              <Box w={48} h={32} bg={TV.surface} style={{ borderRadius: 6, border: `1px solid ${TV.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CreditCard size={18} style={{ color: TV.brand }} />
              </Box>
              <div>
                <div className="flex items-center gap-1.5">
                  <Text fz={13} fw={600} c={TV.textPrimary}>{currentCard.brand} ending in {currentCard.last4}</Text>
                  <Badge size="xs" variant="light" color="tvPurple" radius="sm">Default</Badge>
                </div>
                <Text fz={12} c={TV.textSecondary}>Expires {currentCard.expiry} · Cardholder: {currentCard.name}</Text>
              </div>
            </div>
            <Button variant="light" color="tvPurple" size="xs" radius="md" onClick={() => setCardModalOpen(true)}>
              Update Card
            </Button>
          </div>
        </Box>
        <Box px="lg" py={10} bg={TV.surfaceMuted} style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
          <Text fz={11} c={TV.textSecondary}>This card is used for subscription renewals and caption credit auto-renew charges.</Text>
        </Box>
      </div>

      {/* Billing History */}
      <div className="rounded-[var(--mantine-radius-default)] border overflow-hidden" style={{ borderColor: TV.borderLight }}>
        <Box px="lg" py="sm" bg={TV.surfaceMuted} style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarClock size={15} style={{ color: TV.brand }} />
              <div>
                <Title order={4} fz={15}>Billing History</Title>
                <Text fz={12} c={TV.textSecondary} mt={2}>Recent charges and invoices for your organization.</Text>
              </div>
            </div>
            <ColumnsButton onClick={() => setShowBillingEditCols(true)} />
          </div>
        </Box>
        <Box style={{ overflowX: "auto", maxHeight: "70vh", overflowY: "auto" }}>
          <Table verticalSpacing={0} horizontalSpacing={0} highlightOnHover
            styles={{ table: { borderCollapse: "collapse", minWidth: 600 }, td: { whiteSpace: "nowrap" } }}>
            <Table.Thead className="sticky top-0 z-20" style={{ backgroundColor: "#fff" }}>
              <Table.Tr style={{ borderBottom: `1px solid ${TV.borderLight}` }}>
                {billingActiveCols.map(colKey => {
                  const col = BILLING_ALL_COLUMNS.find(c => c.key === colKey);
                  if (!col) return null;
                  return (
                    <Table.Th key={colKey} style={{ padding: "10px 16px", verticalAlign: "middle", whiteSpace: "nowrap" }}>
                      <SortableHeader label={col.label} sortKey={colKey} currentSort={billingSort.key} currentDir={billingSort.dir} onSort={handleBillingSort} />
                    </Table.Th>
                  );
                })}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortRows([
                { date: "Mar 15, 2026", desc: "Annual Subscription Renewal", amount: "$2,400.00", status: "Paid" },
                { date: "Feb 22, 2026", desc: "Caption Credits — Auto-Renew", amount: "$50.00", status: "Paid" },
                { date: "Jan 10, 2026", desc: "Caption Credits — Auto-Renew", amount: "$50.00", status: "Paid" },
                { date: "Mar 15, 2025", desc: "Annual Subscription Renewal", amount: "$2,400.00", status: "Paid" },
              ], billingSort, (row, key) => {
                switch (key) {
                  case "date": return row.date;
                  case "desc": return row.desc;
                  case "amount": return parseFloat(row.amount.replace(/[$,]/g, ""));
                  case "status": return row.status;
                  default: return "";
                }
              }).map((row, i) => (
                <Table.Tr key={i} style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
                  {billingActiveCols.map(colKey => (
                    <Table.Td key={colKey} style={{ padding: "12px 16px", verticalAlign: "middle" }}>
                      {colKey === "date" ? <Text fz={12} c={TV.textPrimary}>{row.date}</Text> :
                       colKey === "desc" ? <Text fz={12} c={TV.textPrimary}>{row.desc}</Text> :
                       colKey === "amount" ? <Text fz={12} fw={600} c={TV.textPrimary}>{row.amount}</Text> :
                       colKey === "status" ? <Badge size="xs" variant="light" color="green" radius="sm">{row.status}</Badge> :
                       <Text fz={12} c={TV.textSecondary}>—</Text>}
                    </Table.Td>
                  ))}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          <TablePagination page={1} rowsPerPage={10} totalRows={4}
            onPageChange={() => {}} onRowsPerPageChange={() => {}} rowOptions={["5", "10", "25"]} />
        </Box>
        <Box px="lg" py={10} bg={TV.surfaceMuted} style={{ borderTop: `1px solid ${TV.borderDivider}` }}>
          <Text fz={11} c={TV.textSecondary}>For detailed invoices or billing questions, contact billing@thankview.com.</Text>
        </Box>
      </div>

      {/* Billing Edit Columns Modal */}
      {showBillingEditCols && (
        <EditColumnsModal columns={BILLING_ALL_COLUMNS} active={billingActiveCols} onClose={() => setShowBillingEditCols(false)}
          onSave={cols => { setBillingActiveCols(cols); show("Columns updated!", "success"); }} />
      )}

      {/* Update Card Modal */}
      <Modal opened={cardModalOpen} onClose={() => setCardModalOpen(false)} title="Update Payment Method" centered size="md" radius="lg">
        <Stack gap="sm">
          <Text fz={12} c={TV.textSecondary} mb={4}>Enter your new credit card details. This card will be used for all future charges including subscription renewals and caption credit auto-renew.</Text>

          <TextInput
            label="Cardholder Name"
            placeholder="Name as it appears on card"
            value={cardName}
            onChange={e => setCardName(e.currentTarget.value)}
            radius="md"
          />
          <TextInput
            label="Card Number"
            placeholder="1234 5678 9012 3456"
            value={cardNumber}
            onChange={e => setCardNumber(e.currentTarget.value)}
            radius="md"
            leftSection={<CreditCard size={14} />}
          />
          <div className="flex items-center gap-3" style={{ flex: 1 }}>
            <TextInput
              label="Expiration"
              placeholder="MM / YY"
              value={cardExpiry}
              onChange={e => setCardExpiry(e.currentTarget.value)}
              radius="md"
              style={{ flex: 1 }}
            />
            <TextInput
              label="CVC"
              placeholder="123"
              value={cardCvc}
              onChange={e => setCardCvc(e.currentTarget.value)}
              radius="md"
              style={{ flex: 1 }}
            />
          </div>
          <TextInput
            label="Billing ZIP / Postal Code"
            placeholder="10001"
            value={cardZip}
            onChange={e => setCardZip(e.currentTarget.value)}
            radius="md"
          />

          <div className="flex items-center justify-end gap-3" style={{ marginTop: 'var(--mantine-spacing-sm)' }}>
            <Button variant="outline" color="red" radius="md" onClick={() => setCardModalOpen(false)}>Cancel</Button>
            <Button color="tvPurple" radius="md" onClick={handleUpdateCard}>Save Payment Method</Button>
          </div>
        </Stack>
      </Modal>
    </Stack>
  );
}

// ─────────────────���───────────────────────────────────────────────────────────
export function Settings() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<Tab>(() => {
    const t = searchParams.get("tab") as Tab | null;
    return t && ["profile", "general", "email_sms", "users", "notifications", "video", "one_to_one", "dns_setup", "subscription"].includes(t) ? t : "profile";
  });

  return (
    <div className="flex flex-col sm:flex-row h-full overflow-hidden">
      {/* ── Mobile: horizontal scrolling tab strip ── */}
      <div className="sm:hidden flex overflow-x-auto border-b border-tv-border-light bg-white shrink-0 px-2">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={[
              "flex items-center gap-2 px-4 py-3.5 text-[13px] font-medium whitespace-nowrap shrink-0 border-b-2 transition-all",
              tab === t.key
                ? "border-tv-brand-bg text-tv-brand"
                : "border-transparent text-tv-text-label hover:text-tv-brand",
            ].join(" ")}
          >
            <t.icon size={14} className="shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Desktop: left sidebar nav ── */}
      <div className="hidden sm:flex w-[220px] shrink-0 bg-white border-r border-tv-border-light flex-col pt-6">
        <Text fz={11} fw={600} tt="uppercase" lts="0.05em" c={TV.textLabel} px="lg" mb="sm">Settings</Text>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2.5 px-5 py-3 text-[13px] transition-all text-left ${tab === t.key ? "bg-tv-brand-tint text-tv-brand font-semibold border-l-[3px] border-tv-brand-bg" : "text-tv-text-label hover:bg-tv-surface hover:text-tv-brand"}`}
          >
            <t.icon size={15} className="shrink-0" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8">
        <Box mb="lg">
          <Title order={1} fz={{ base: 22, sm: 26 }}>
            {TABS.find(t => t.key === tab)?.label}
          </Title>
          <Text fz={13} c={TV.textSecondary} mt={2}>
            {tab === "profile"       ? "Manage your personal account details and security." :
             tab === "general"       ? "Manage your organization's core settings."       :
             tab === "email_sms"     ? "Configure sending domains and SMS settings."      :
             tab === "dns_setup"     ? "Set up custom sending domains for your organization." :
             tab === "users"         ? "Invite and manage users in your organization."    :
             tab === "notifications" ? "Control which events send you notifications."   :
             tab === "video"         ? "Configure video recording, captions, and library defaults." :
             tab === "subscription"  ? "Manage your subscription plan, payment method, and billing history." :
                                       "Manage 1:1 video landing pages, links, and tracking."}
          </Text>
        </Box>
        {tab === "profile"       && <ProfileTab />}
        {tab === "general"       && <GeneralTab />}
        {tab === "email_sms"     && <EmailSmsTab />}
        {tab === "dns_setup"     && <DnsSetupTab />}
        {tab === "users"         && <UsersTab />}
        {tab === "notifications" && <NotificationsTab />}
        {tab === "video"         && <VideoTab />}
        {tab === "one_to_one"    && <OneToOneTab />}
        {tab === "subscription" && <SubscriptionTab />}
      </div>
    </div>
  );
}