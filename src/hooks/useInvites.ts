"use client";

import { useCallback, useEffect, useState } from "react";
import type { InviteSummary } from "@/lib/inviteDocument";

interface InviteApiError {
  error: string;
}

export function useInvites() {
  const [invites, setInvites] = useState<InviteSummary[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const response = await fetch("/api/admin/invites");
    if (!response.ok) return;
    const data: InviteSummary[] = await response.json();
    setInvites(data);
  }, []);

  useEffect(() => {
    // One-time hydration from the API after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh().finally(() => setIsLoaded(true));
  }, [refresh]);

  const inviteUser = useCallback(async (email: string, name?: string) => {
    const response = await fetch("/api/admin/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name }),
    });
    const data: InviteSummary | InviteApiError = await response.json();

    if (!response.ok || "error" in data) {
      throw new Error("error" in data ? data.error : "Einladung fehlgeschlagen.");
    }

    setInvites((prev) => [data, ...prev]);
    return data;
  }, []);

  return { invites, isLoaded, inviteUser };
}
