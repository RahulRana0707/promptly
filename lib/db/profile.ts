import { prisma } from "@/lib/prisma";
import {
  creatorProfileFromJson,
  defaultCreatorProfile,
  type CreatorProfile,
} from "@/lib/types/profile";

export async function getProfileForUser(
  userId: string
): Promise<CreatorProfile> {
  const row = await prisma.profile.findUnique({ where: { userId } });
  if (!row?.data) {
    return defaultCreatorProfile();
  }
  return creatorProfileFromJson(row.data);
}

export async function upsertProfileForUser(
  userId: string,
  profile: CreatorProfile
): Promise<CreatorProfile> {
  await prisma.profile.upsert({
    where: { userId },
    create: { userId, data: profile },
    update: { data: profile },
  });
  return profile;
}
