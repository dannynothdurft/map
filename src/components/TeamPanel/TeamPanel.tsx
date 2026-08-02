"use client";

import { useState, type FormEvent } from "react";
import { useInvites } from "@/hooks/useInvites";
import styles from "./TeamPanel.module.scss";

function describeStatus(invite: { usedAt?: number; expiresAt: number }): string {
  if (invite.usedAt) return "angenommen";
  if (invite.expiresAt < Date.now()) return "abgelaufen";
  return "ausstehend";
}

export default function TeamPanel() {
  const { invites, inviteUser } = useInvites();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      await inviteUser(email.trim(), name.trim() || undefined);
      setMessage(`Einladung an ${email.trim()} verschickt.`);
      setName("");
      setEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Einladung fehlgeschlagen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>
          <span>Name (optional)</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
          />
        </label>

        <label className={styles.field}>
          <span>E-Mail</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={isSubmitting}
          />
        </label>

        <button type="submit" className={styles.submit} disabled={isSubmitting}>
          {isSubmitting ? "Wird versendet…" : "Einladen"}
        </button>

        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.message}>{message}</p>}
      </form>

      {invites.length === 0 ? (
        <div className={styles.empty}>Noch keine Einladungen verschickt.</div>
      ) : (
        <ul className={styles.list}>
          {invites.map((invite) => (
            <li key={`${invite.email}-${invite.createdAt}`} className={styles.item}>
              <div className={styles.details}>
                {invite.name && <span className={styles.name}>{invite.name}</span>}
                <span className={styles.email}>{invite.email}</span>
              </div>
              <span className={`${styles.status} ${styles[describeStatus(invite)]}`}>
                {describeStatus(invite)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
