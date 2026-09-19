"use client";

import Link from "next/link";
import { useActionState } from "react";
import { forgotPasswordAction, type ForgotPasswordState } from "./actions";

const initialState: ForgotPasswordState = { status: "idle" };

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.status === "success") {
    return (
      <div className="bos-reset-success" role="status">
        <h2>Sprawdź swoją pocztę</h2>
        <p>{state.message}</p>
        <Link href="/login">Wróć do logowania</Link>
      </div>
    );
  }

  return (
    <form className="bos-login-form" action={action}>
      <div className="bos-login-field">
        <label htmlFor="email">Adres e-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" placeholder="nazwa@twojafirma.pl" required disabled={pending} />
      </div>
      <button type="submit" className="bos-login-submit" disabled={pending}>
        <span>{pending ? "Wysyłanie…" : "Wyślij instrukcję"}</span>
        {!pending ? <span aria-hidden="true">→</span> : null}
      </button>
      <p className="bos-reset-back"><Link href="/login">← Wróć do logowania</Link></p>
    </form>
  );
}
