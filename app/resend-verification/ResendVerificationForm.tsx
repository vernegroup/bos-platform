"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resendVerificationAction, type ResendVerificationState } from "../register/actions";

const initialState: ResendVerificationState = { status: "idle" };

export default function ResendVerificationForm() {
  const [state, action, pending] = useActionState(resendVerificationAction, initialState);

  return (
    <form className="bos-register-form" action={action}>
      <label>Adres e-mail
        <input name="email" type="email" autoComplete="email" required disabled={pending} />
      </label>
      {state.message ? <p className={state.status === "error" ? "bos-register-error" : undefined} role="status">{state.message}{state.status === "success" ? " Jeśli nie widzisz wiadomości w skrzynce odbiorczej, sprawdź również folder Spam lub Oferty." : ""}</p> : null}
      <button className="bos-register-submit" type="submit" disabled={pending}>
        {pending ? "Wysyłanie…" : "Wyślij nowy link weryfikacyjny"} {!pending && <span aria-hidden="true">→</span>}
      </button>
      <p className="bos-register-login"><Link href="/login">Wróć do logowania</Link> · <Link href="/register">Rejestracja</Link></p>
    </form>
  );
}
