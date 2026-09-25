"use client";

import Link from "next/link";
import { useState } from "react";


type LoginFormProps = { callbackUrl: string };

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    setError("");
    setPending(true);
    // Use Auth.js' same-origin server callback flow. This lets the response that
    // authenticates the credentials set the session cookie on the exact host
    // currently serving BOS (Preview today, standardybiznesu.pl in production).
    // Do not use the client helper here: Preview deployment hostnames change.
  }

  return (
    <form className="bos-login-form" action="/api/auth/callback/credentials" method="post" onSubmit={handleSubmit}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <div className="bos-login-field">
        <label htmlFor="email">Adres e-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nazwa@twojafirma.pl"
          required
          disabled={pending}
        />
      </div>

      <div className="bos-login-field">
        <div className="bos-login-field-heading">
          <label htmlFor="password">Hasło</label>
          <Link href="/forgot-password">Nie pamiętasz hasła?</Link>
        </div>
        <div className="bos-login-password">
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Wpisz hasło"
            required
            disabled={pending}
          />
          <button
            type="button"
            className="bos-login-password-toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ukryj hasło" : "Pokaż hasło"}
            aria-pressed={showPassword}
            disabled={pending}
          >
            {showPassword ? "Ukryj" : "Pokaż"}
          </button>
        </div>
      </div>

      {error ? <p className="bos-login-error" role="alert">{error}</p> : null}

      <button type="submit" className="bos-login-submit" disabled={pending}>
        <span>{pending ? "Logowanie…" : "Zaloguj się"}</span>
        {!pending ? <span aria-hidden="true">→</span> : null}
      </button>
    </form>
  );
}
