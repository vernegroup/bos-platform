"use client";

import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";

type LoginFormProps = { callbackUrl: string };

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        redirectTo: callbackUrl,
      });

      if (result?.error) {
        setError("Nieprawidłowy adres e-mail lub hasło.");
        setPending(false);
        return;
      }

      window.location.assign(result?.url || callbackUrl);
    } catch {
      setError("Nie udało się zalogować. Spróbuj ponownie.");
      setPending(false);
    }
  }

  return (
    <form className="bos-login-form" onSubmit={handleSubmit}>
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
