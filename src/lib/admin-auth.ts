import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminToken, safeEqual } from "@/lib/secrets";

export async function isAdmin(): Promise<boolean> {
  const token = adminToken();
  const cookie = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Boolean(token && cookie && safeEqual(cookie, token));
}
