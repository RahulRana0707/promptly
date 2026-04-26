import type { Metadata } from "next";

import { ProfileClient } from "@/components/profile/profile-client";
import { getPlaceholderUserId } from "@/lib/constants/dev-user-id";
import { getProfileForUser } from "@/lib/db/profile";
import { defaultCreatorProfile } from "@/lib/types/profile";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  let initialProfile = defaultCreatorProfile();
  let loadError: string | null = null;

  try {
    initialProfile = await getProfileForUser(getPlaceholderUserId());
  } catch {
    loadError =
      "Could not load profile from the database. You can still edit defaults; save will fail until the database is available.";
  }

  return <ProfileClient initialProfile={initialProfile} loadError={loadError} />;
}
