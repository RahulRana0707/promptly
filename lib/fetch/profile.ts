import type { CreatorProfile, ProfileAnalysis } from "@/lib/types/profile";

async function readErrorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string; code?: string };
    if (typeof body.error === "string") return body.error;
    if (typeof body.code === "string") return body.code;
  } catch {
    /* ignore */
  }
  return `Request failed (${res.status})`;
}

export async function getProfile(): Promise<CreatorProfile> {
  const res = await fetch("/api/profile", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  const data = (await res.json()) as { profile: CreatorProfile };
  return data.profile;
}

export async function saveProfile(
  profile: CreatorProfile
): Promise<CreatorProfile> {
  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  const data = (await res.json()) as { profile: CreatorProfile };
  return data.profile;
}

export async function analyzeProfile(
  profile: CreatorProfile
): Promise<ProfileAnalysis> {
  const res = await fetch("/api/profile/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  const data = (await res.json()) as { analysis: ProfileAnalysis };
  return data.analysis;
}

export async function suggestProfileFromAi(input: {
  profile: CreatorProfile;
  analysis?: ProfileAnalysis | null;
}): Promise<CreatorProfile> {
  const res = await fetch("/api/profile/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      profile: input.profile,
      analysis: input.analysis ?? null,
    }),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  const data = (await res.json()) as { profile: CreatorProfile };
  return data.profile;
}
