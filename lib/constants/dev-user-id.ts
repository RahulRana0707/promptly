/**
 * Single dev user id for DB profile row + API routes.
 * Must match `prisma/seed.ts` (seed imports this constant).
 */
export const DEV_USER_ID = "promptly-dev";

export function getPlaceholderUserId(): string {
  return DEV_USER_ID;
}
