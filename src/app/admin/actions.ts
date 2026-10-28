"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { storyCandidates } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { ADMIN_COOKIE, adminToken, safeEqual } from "@/lib/secrets";

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const password = process.env.ADMIN_PASSWORD;
  const given = String(formData.get("password") ?? "");
  if (!password) return "Admin login is not configured (ADMIN_PASSWORD is not set).";
  if (!safeEqual(given, password)) {
    await new Promise((r) => setTimeout(r, 1000)); // slow down guessing
    return "Wrong password.";
  }
  (await cookies()).set(ADMIN_COOKIE, adminToken()!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: 7 * 24 * 3600,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/admin" });
  redirect("/admin/login");
}

// Every editor action re-checks the session: the queue page is public.
export async function setCandidateStatus(id: number, status: "new" | "rejected") {
  if (!(await isAdmin())) redirect("/admin/login");
  await db().update(storyCandidates).set({ status }).where(eq(storyCandidates.id, id));
  revalidatePath("/admin");
}
