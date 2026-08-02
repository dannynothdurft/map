"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserSummary } from "@/types/user";

export function useCurrentUser() {
  const router = useRouter();
  const [user, setUser] = useState<UserSummary | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // One-time hydration from the API after mount.
    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then(setUser)
      .finally(() => setIsLoaded(true));
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }, [router]);

  return { user, isLoaded, logout };
}
