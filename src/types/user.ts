export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: "admin" | "member";
}
