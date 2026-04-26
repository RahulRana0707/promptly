function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * Returns the local calendar date in YYYY-MM-DD form.
 */
export function localDateYmd(input?: Date): string {
  const d = input ?? new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * Best-effort display label for YYYY-MM-DD keys.
 * Falls back to the raw key when parsing fails.
 */
export function formatYmdForUi(
  ymd: string,
  locale?: string | string[]
): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;

  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(year, monthIndex, day);
  if (Number.isNaN(d.getTime())) return ymd;

  return d.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
