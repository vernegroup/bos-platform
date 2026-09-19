"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { resetPasswordAction, type ResetPasswordState } from "../forgot-password/actions";

const initialState: ResetPasswordState = { status: "idle" };

export default function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  if (state.status === "success") {
    return (
      <div className="bos-reset-success" role="status">
        <h2>Hasło zmienione</h2>
        <p>{state.message}</p>
        <Link href="/login">Przejdź do logowania →</Link>
      </div>
    );
  }

  return (
    <form className="bos-login-form" action={action}>
      <input type="hidden" name="token" value={token} />
      <div className="bos-login-field">
        <label htmlFor="password">Nowe hasło</label>
        <div className="bos-login-password">
          <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Minimum 12 znaków" minLength={12} required disabled={pending || !token} />
          <button type="button" className="bos-login-password-toggle" onClick={() => setShowPassword(v => !v)} disabled={pending || !token}>{showPassword ? "Ukryj" : "Pokaż"}</button>
        </div>
      </div>
      <div className="bos-login-field">
        <label htmlFor="passwordConfirm">Powtórz nowe hasło</label>
        <input id="passwordConfirm" name="passwordConfirm" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Powtórz hasło" minLength={12} required disabled={pending || !token} />
      </div>
      {!token ? <p className="bos-login-error" role="alert">Brakuje tokenu zmiany hasła. Otwórz link otrzymany w wiadomości e-mail.</p> : null}
      {state.status === "error" ? <p className="bos-login-error" role="alert">{state.message}</p> : null}
      <button type="submit" className="bos-login-submit" disabled={pending || !token}>
        <span>{pending ? "Zapisywanie…" : "Ustaw nowe hasło"}</span>
        {!pending ? <span aria-hidden="true">→</span> : null}
      </button>
      <p className="bos-reset-back"><Link href="/forgot-password">Poproś o nowy link</Link></p>
    </form>
  );
}
