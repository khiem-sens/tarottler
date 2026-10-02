"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { errorSchema } from "../lib/schema";
import { ArrowRight, LockKeyhole } from "lucide-react";
import styles from "./studio.module.css";

export default function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const result = await response.json();
      if (!response.ok) throw new Error(errorSchema.parse(result).error);
      router.replace("/admin"); router.refresh();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to sign in."); setBusy(false); }
  }
  return <main className={styles.loginPage}>
    <Link href="/" className={styles.brand}>Tarotler</Link>
    <form className={styles.loginForm} onSubmit={submit}>
      <LockKeyhole size={24} className={styles.loginIcon} />
      <h1>Content studio</h1><p>Admin sign in</p>
      {!configured ? <div role="status" className={styles.notice}>Admin access is not configured.</div> : <>
        <label htmlFor="admin-password">Password</label>
        <input id="admin-password" type="password" autoComplete="current-password" required maxLength={256} value={password} onChange={event => setPassword(event.target.value)} />
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.primary} type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}<ArrowRight size={16} /></button>
      </>}
      <Link className={styles.backLink} href="/">Back to the gallery</Link>
    </form>
  </main>;
}
