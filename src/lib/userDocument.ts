import type { WithId } from "mongodb";
import type { UserSummary } from "@/types/user";

export interface UserDocument {
  email: string;
  name: string;
  passwordHash: string;
  role: "admin" | "member";
  createdAt: number;
}

export function toUserSummary(doc: WithId<UserDocument>): UserSummary {
  return {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    role: doc.role,
  };
}
