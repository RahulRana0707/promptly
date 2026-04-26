import { prisma } from "@/lib/prisma";
import {
  dailyPlanFromJson,
  type DailyPlanResult,
} from "@/lib/types/daily-plan";

export type DailyPlanDayListItem = {
  planDate: string;
  updatedAt: string;
};

function dateToYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Strictly parse YYYY-MM-DD keys used by the daily-plan feature.
 * Returns the normalized key plus Date at UTC midnight for @db.Date storage.
 */
export function parsePlanDateKey(ymd: string): { key: string; date: Date } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) {
    throw new Error("Invalid planDate format. Expected YYYY-MM-DD");
  }

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error("Invalid planDate value");
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  // Reject impossible dates (e.g., 2026-02-31).
  if (dateToYmd(date) !== ymd) {
    throw new Error("Invalid planDate value");
  }

  return { key: ymd, date };
}

export async function listDailyPlanDaysForUser(
  userId: string
): Promise<DailyPlanDayListItem[]> {
  const rows = await prisma.dailyPlanDay.findMany({
    where: { userId },
    orderBy: { planDate: "desc" },
    select: { planDate: true, updatedAt: true },
  });
  return rows.map((r) => ({
    planDate: dateToYmd(r.planDate),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function getDailyPlanForUserDate(
  userId: string,
  ymd: string
): Promise<DailyPlanResult | null> {
  const { date } = parsePlanDateKey(ymd);
  const row = await prisma.dailyPlanDay.findUnique({
    where: { userId_planDate: { userId, planDate: date } },
    select: { data: true },
  });
  if (!row?.data) return null;
  return dailyPlanFromJson(row.data);
}

export async function upsertDailyPlanForUserDate(
  userId: string,
  ymd: string,
  plan: DailyPlanResult
): Promise<DailyPlanResult> {
  const { date } = parsePlanDateKey(ymd);
  await prisma.dailyPlanDay.upsert({
    where: { userId_planDate: { userId, planDate: date } },
    create: {
      userId,
      planDate: date,
      data: plan,
    },
    update: { data: plan },
  });
  return plan;
}

export async function deleteDailyPlanForUserDate(
  userId: string,
  ymd: string
): Promise<boolean> {
  const { date } = parsePlanDateKey(ymd);
  const res = await prisma.dailyPlanDay.deleteMany({
    where: { userId, planDate: date },
  });
  return res.count > 0;
}
