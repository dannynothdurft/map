import { randomBytes, createHash } from "crypto";

export interface InviteDocument {
  email: string;
  name?: string;
  tokenHash: string;
  invitedBy: { id: string; name: string };
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
}

const INVITE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function createInviteToken() {
  const token = randomBytes(24).toString("hex");
  return { token, tokenHash: hashInviteToken(token), expiresAt: Date.now() + INVITE_DURATION_MS };
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export interface InviteSummary {
  email: string;
  name?: string;
  invitedBy: { id: string; name: string };
  createdAt: number;
  expiresAt: number;
  usedAt?: number;
}

export function toInviteSummary(doc: InviteDocument): InviteSummary {
  return {
    email: doc.email,
    name: doc.name,
    invitedBy: doc.invitedBy,
    createdAt: doc.createdAt,
    expiresAt: doc.expiresAt,
    usedAt: doc.usedAt,
  };
}
