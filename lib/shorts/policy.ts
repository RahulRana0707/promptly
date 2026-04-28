type QuotaAction = "transcribe" | "analyze" | "render";

const ALLOWED_SOURCE_HOSTS = [
  "youtube.com",
  "www.youtube.com",
  "youtu.be",
  "m.youtube.com",
  "spotify.com",
  "open.spotify.com",
  "podcasts.apple.com",
];

const QUOTA_LIMITS_PER_HOUR: Record<QuotaAction, number> = {
  transcribe: 20,
  analyze: 40,
  render: 30,
};

const quotaStore = new Map<string, { count: number; windowStartMs: number }>();

function buildQuotaKey(userId: string, action: QuotaAction): string {
  return `${userId}:${action}`;
}

export function isSupportedSourceUrl(raw: string): boolean {
  const input = raw.trim();
  if (!input) return false;
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(url.protocol)) return false;
  const host = url.hostname.toLowerCase();
  return ALLOWED_SOURCE_HOSTS.some(
    (allowed) => host === allowed || host.endsWith(`.${allowed}`)
  );
}

export function consumeShortsQuota(input: {
  userId: string;
  action: QuotaAction;
}): { ok: boolean; remaining: number; retryAfterSec: number } {
  const now = Date.now();
  const key = buildQuotaKey(input.userId, input.action);
  const hourMs = 60 * 60 * 1000;
  const limit = QUOTA_LIMITS_PER_HOUR[input.action];
  const existing = quotaStore.get(key);
  const active =
    existing && now - existing.windowStartMs < hourMs
      ? existing
      : { count: 0, windowStartMs: now };

  if (active.count >= limit) {
    const retryAfterSec = Math.max(
      1,
      Math.ceil((active.windowStartMs + hourMs - now) / 1000)
    );
    quotaStore.set(key, active);
    return { ok: false, remaining: 0, retryAfterSec };
  }

  const next = { ...active, count: active.count + 1 };
  quotaStore.set(key, next);
  return { ok: true, remaining: Math.max(0, limit - next.count), retryAfterSec: 0 };
}

export function logShortsApiEvent(event: {
  route: string;
  stage: string;
  projectId?: string;
  userId?: string;
  detail?: string;
  code?: string;
}) {
  // Structured logs make backend failures and timings easier to inspect in hosted logs.
  console.info(
    JSON.stringify({
      ns: "shorts_api",
      ts: new Date().toISOString(),
      ...event,
    })
  );
}
