import { createHmac, timingSafeEqual } from "node:crypto";

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`.
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return safeEqual(request.headers.get("authorization") ?? "", `Bearer ${secret}`);
}

// Admin session cookie value: an HMAC of a fixed label keyed by the admin password,
// so changing ADMIN_PASSWORD logs everyone out.
export function adminToken(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("roundtable-admin-v1").digest("hex");
}

export const ADMIN_COOKIE = "rt_admin";
