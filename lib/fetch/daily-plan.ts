import type { DailyPlanResult } from "@/lib/types/daily-plan";

export type DailyPlanDayListItem = {
  planDate: string;
  updatedAt: string;
};

export type DailyPlanStateResponse = {
  dates: DailyPlanDayListItem[];
  plan?: DailyPlanResult | null;
  planDate?: string;
};

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

export async function fetchDailyPlanState(
  dateYmd: string
): Promise<DailyPlanStateResponse> {
  const res = await fetch(
    `/api/daily-plan?date=${encodeURIComponent(dateYmd)}`,
    { cache: "no-store" }
  );
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return (await res.json()) as DailyPlanStateResponse;
}

export async function fetchDailyPlanDatesOnly(): Promise<{
  dates: DailyPlanDayListItem[];
}> {
  const res = await fetch("/api/daily-plan", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return (await res.json()) as { dates: DailyPlanDayListItem[] };
}

export async function saveDailyPlanForDateApi(input: {
  planDate: string;
  plan: DailyPlanResult;
}): Promise<{ plan: DailyPlanResult; planDate: string }> {
  const res = await fetch("/api/daily-plan", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return (await res.json()) as { plan: DailyPlanResult; planDate: string };
}

export async function deleteDailyPlanForDateApi(
  dateYmd: string
): Promise<{ ok: boolean; deleted: boolean }> {
  const res = await fetch(
    `/api/daily-plan?date=${encodeURIComponent(dateYmd)}`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return (await res.json()) as { ok: boolean; deleted: boolean };
}

export async function generateDailyPlanApi(input: {
  planDate: string;
  profile: unknown;
  patternIds: string[];
  signalTargets: string[];
  toneRisk: string;
}): Promise<{ plan: DailyPlanResult; planDate: string }> {
  const res = await fetch("/api/daily-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    throw new Error(await readErrorMessage(res));
  }
  return (await res.json()) as { plan: DailyPlanResult; planDate: string };
}
