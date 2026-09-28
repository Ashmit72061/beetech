"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { createSession, destroySession } from "@/lib/auth";
import { db } from "@/lib/db";
import { safeNextPath, signInSchema } from "@/lib/validation/auth";

export type SignInResult = { error: string } | { redirectTo: string };

export async function signInAction(input: { email: string; password: string; next?: string }): Promise<SignInResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid email address and password." };
  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !user.active || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return { error: "Email or password does not match an available Honey Chain account." };
  await createSession(user.id);
  return { redirectTo: safeNextPath(parsed.data.next) };
}

export async function signOutAction() {
  await destroySession();
  redirect("/login");
}
