"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "../login/login.module.scss";

interface InviteInfo {
  email: string;
  name: string | null;
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isCheckingInvite, setIsCheckingInvite] = useState(Boolean(token));

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCheckingInvite(true);

    // The invite check is a UX nicety (pre-fills/locks the email) - the
    // token is still validated server-side on submit regardless. If
    // something on the client (network, browser extension, ad blocker)
    // blocks or stalls this request, never leave the user stuck on the
    // loading screen - fall back to an open, editable form after a timeout.
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    fetch(`/api/invites/${token}`, { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          setInviteError(data.error ?? "Einladung ist ungültig.");
          return;
        }
        setInvite(data);
        setEmail(data.email);
        if (data.name) setName(data.name);
      })
      .catch(() => {
        // Aborted (timeout) or network error - proceed with an open form
        // rather than showing an error, since the server still validates
        // the token on submit.
      })
      .finally(() => {
        clearTimeout(timeout);
        setIsCheckingInvite(false);
      });

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [token]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, token }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? "Registrierung fehlgeschlagen.");
        return;
      }

      router.push("/");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  if (token && isCheckingInvite) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>APO MAP</h1>
          <p className={styles.subtitle}>Einladung wird geprüft…</p>
        </div>
      </div>
    );
  }

  if (token && inviteError) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <h1 className={styles.title}>APO MAP</h1>
          <p className={styles.error}>{inviteError}</p>
          <p className={styles.footer}>
            Schon ein Konto? <Link href="/login">Anmelden</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>APO MAP</h1>
        <p className={styles.subtitle}>
          {invite ? "Richte dein eingeladenes Konto ein." : "Konto erstellen."}
        </p>

        <label className={styles.field}>
          <span>Name</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            required
            autoFocus
          />
        </label>

        <label className={styles.field}>
          <span>E-Mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            readOnly={Boolean(invite)}
            required
          />
        </label>

        <label className={styles.field}>
          <span>Passwort</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? "Wird erstellt…" : "Konto erstellen"}
        </button>

        {error && <p className={styles.error}>{error}</p>}

        <p className={styles.footer}>
          Schon ein Konto? <Link href="/login">Anmelden</Link>
        </p>
      </form>
    </div>
  );
}
