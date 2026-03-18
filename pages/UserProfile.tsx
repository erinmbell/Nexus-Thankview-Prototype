import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Check, Shield, Save, Smartphone,
} from "lucide-react";
import { useToast } from "../contexts/ToastContext";
import { TV } from "../theme";
import {
  TextInput, PasswordInput, Select, Button, Badge,
  Title, Text, Stack, Box, SimpleGrid,
} from "@mantine/core";

import { Breadcrumbs } from "../components/Breadcrumbs";

const JOB_TITLES = [
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
];

export function UserProfile() {
  const navigate = useNavigate();
  const { show }  = useToast();

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

  const handleSaveProfile = () => show("Profile updated!", "success");

  const handleSavePw = () => {
    if (!pwMatch) return;
    setShowPwForm(false);
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
    show("Password updated!", "success");
  };

  const handleEnable2FA = () => setTwoFaStep("phone");

  const handleSendCode = () => {
    setTwoFaStep("code");
    show("Verification code sent to " + phoneNum, "info");
  };

  const handleVerify2FA = () => {
    setTwoFa(true);
    setTwoFaStep("off");
    show("Two-step verification enabled!", "success");
  };

  return (
    <Box p={{ base: "sm", sm: "xl" }} pt={0} maw={672}>
      {/* Breadcrumb */}
      <div className="sticky top-0 z-10 bg-tv-surface-muted pt-4 sm:pt-6 pb-3 -mx-3 sm:-mx-6 px-3 sm:px-6 mb-1">
        <Breadcrumbs items={[
          { label: "Settings", href: "/settings?tab=profile" },
          { label: "My Profile" },
        ]} />
      </div>

      <Title order={1} fz={{ base: 22, sm: 26 }} mb="lg">My Profile</Title>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
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
      <div className="border rounded-[var(--mantine-radius-default)] p-4 sm:p-6 mb-4" style={{ borderColor: TV.borderLight }}>
        <Title order={3} fz={16} mb="md">Profile Information</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
          <TextInput label="First Name" value={firstName} onChange={e => setFirstName(e.currentTarget.value)} />
          <TextInput label="Last Name" value={lastName} onChange={e => setLastName(e.currentTarget.value)} />
        </SimpleGrid>
        <Select
          label="Job Title / Function"
          placeholder="Select your role"
          value={jobTitle}
          onChange={setJobTitle}
          data={JOB_TITLES}
          searchable
          mb="md"
        />
        <Button leftSection={<Check size={13} />} color="tvPurple" onClick={handleSaveProfile}>
          Save Profile
        </Button>
      </div>

      {/* Password */}
      <div className="border rounded-[var(--mantine-radius-default)] p-6 mb-4" style={{ borderColor: TV.borderLight }}>
        <div className="flex items-center justify-between mb-3">
          <Title order={3} fz={16}>Password</Title>
          <Button variant="subtle" color={showPwForm ? "red" : "tvPurple"} size="compact-sm" onClick={() => setShowPwForm(!showPwForm)}>
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
      </div>

      {/* 2FA — SMS-based */}
      <div className="border rounded-[var(--mantine-radius-default)] p-6" style={{ borderColor: TV.borderLight }}>
        <div className="flex items-center justify-between mb-2">
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
            <div className="flex items-center gap-2 mb-1">
              <Check size={15} style={{ color: TV.success }} />
              <Text fz={13} fw={600} c={TV.success}>Two-step verification is active</Text>
            </div>
            <div className="flex items-center gap-1.5">
              <Smartphone size={13} style={{ color: TV.textSecondary }} />
              <Text fz={12} c={TV.textSecondary}>Codes sent to {"\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}{phoneNum.slice(-4) || "1234"}</Text>
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
              <div className="flex items-center gap-1.5">
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
              <Button variant="subtle" color="gray" size="compact-sm" onClick={() => { setTwoFaStep("phone"); setVerifyCode(""); }}>Change Number</Button>
              <Button variant="outline" color="red" size="compact-sm" onClick={() => { setTwoFaStep("off"); setPhoneNum(""); setVerifyCode(""); }}>Cancel</Button>
            </div>
          </Stack>
        )}
      </div>
    </Box>
  );
}