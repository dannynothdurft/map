import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secret = process.env.SESSION_SECRET;

if (!secret) {
  throw new Error(
    "SESSION_SECRET ist nicht gesetzt. Bitte in .env.local konfigurieren (z. B. via `openssl rand -base64 32`).",
  );
}

const encodedKey = new TextEncoder().encode(secret);
const COOKIE_NAME = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Kept minimal on purpose - name/role are included so API routes can stamp
// `createdBy` or check admin access without an extra DB lookup per request.
interface SessionPayload extends JWTPayload {
  userId: string;
  name: string;
  role: "admin" | "member";
}

export interface SessionUser {
  id: string;
  name: string;
  role: "admin" | "member";
}

async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser) {
  const token = await encrypt({ userId: user.id, name: user.name, role: user.role });
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const payload = await decrypt(cookieStore.get(COOKIE_NAME)?.value);
  if (!payload) return null;
  return { id: payload.userId, name: payload.name, role: payload.role };
}

/** Convenience for API routes: resolves the current user or null if unauthenticated. */
export async function requireUser(): Promise<SessionUser | null> {
  return getSession();
}

/** Convenience for admin-only API routes: resolves the current user or null if not an admin. */
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSession();
  return user?.role === "admin" ? user : null;
}
