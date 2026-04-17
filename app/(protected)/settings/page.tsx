import { SettingsForms } from "@/components/settings-forms";
import { requirePairRoom } from "@/lib/data";

export default async function SettingsPage() {
  const { profile, partnerProfile, pairRoom } = await requirePairRoom();

  return <SettingsForms profile={profile} partner={partnerProfile} pairRoom={pairRoom} />;
}
