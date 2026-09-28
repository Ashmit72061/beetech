import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

const SESSION_COOKIE = "hc_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export type AuthenticatedSession = {
  userId: string;
  email: string;
  person: string;
  organisation: string;
  role: "beekeeper" | "manufacturer" | "lab" | "consumer" | "admin";
  signedInAt: string;
};

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function roleForClient(role: string): AuthenticatedSession["role"] {
  return role.toLowerCase() as AuthenticatedSession["role"];
}

function safeSession(record: { user: { id: string; email: string; name: string; role: string; organization: { name: string } }; createdAt: Date }) {
  return { userId: record.user.id, email: record.user.email, person: record.user.name, organisation: record.user.organization.name, role: roleForClient(record.user.role), signedInAt: record.createdAt.toISOString() };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { id: randomBytes(20).toString("hex"), userId, tokenHash: hashToken(token), expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", expires: expiresAt, path: "/" });
}

export async function getSession(): Promise<AuthenticatedSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: { include: { organization: true } } } });
  if (!session || session.expiresAt <= new Date() || !session.user.active) {
    if (session) await db.session.delete({ where: { id: session.id } });
    return null;
  }
  await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  return safeSession(session);
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard");
  return session;
}
