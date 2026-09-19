"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  registerCompanyAction,
  resendVerificationAction,
  type RegisterState,
  type ResendVerificationState,
} from "./actions";

const initialState: RegisterState = { status: "idle" };
const initialResendState: ResendVerificationState = { status: "idle" };

function VerificationResend({ email }: { email: string }) {
  const [state, action, pending] = useActionState(resendVerificationAction, initialResendState);

  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <button className="bos-register-submit" type="submit" disabled={pending}>
        {pending ? "Wysyłanie…" : "Wyślij ponownie e-mail weryfikacyjny"}
      </button>
      {state.message ? (
        <p className={state.status === "error" ? "bos-register-error" : undefined} role="status">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerCompanyAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  if (state.status === "success") {
    return (
      <div className="bos-register-success" role="status">
        <h2>Konto utworzone</h2>
        <p>{state.message}</p>
        {state.email ? <VerificationResend email={state.email} /> : null}
        <Link href="/login">Wróć do logowania →</Link>
      </div>
    );
  }

  return (
    <form className="bos-register-form" action={action}>
      <div className="bos-register-grid">
        <label>Imię<input name="firstName" autoComplete="given-name" required disabled={pending} /></label>
        <label>Nazwisko<input name="lastName" autoComplete="family-name" required disabled={pending} /></label>
      </div>

      <label>Firmowy adres e-mail<input name="email" type="email" autoComplete="email" placeholder="nazwa@twojafirma.pl" required disabled={pending} /></label>

      <div className="bos-register-section">
        <span>Dane organizacji</span>
      </div>

      <label>Nazwa firmy<input name="companyName" autoComplete="organization" required disabled={pending} /></label>
      <div className="bos-register-grid">
        <label>NIP<input name="taxId" inputMode="numeric" placeholder="1234567890" required disabled={pending} /></label>
        <label>Kraj
          <select name="country" defaultValue="PL" disabled={pending}>
            <option value="PL">Polska</option>
          </select>
        </label>
      </div>

      <div className="bos-register-section">
        <span>Zabezpieczenie konta</span>
      </div>

      <label>Hasło
        <div className="bos-register-password">
          <input name="password" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} required disabled={pending} />
          <button type="button" onClick={() => setShowPassword(v => !v)} disabled={pending}>{showPassword ? "Ukryj" : "Pokaż"}</button>
        </div>
        <small>Minimum 12 znaków.</small>
      </label>
      <label>Powtórz hasło<input name="passwordConfirm" type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={12} required disabled={pending} /></label>

      {state.status === "error" ? <p className="bos-register-error" role="alert">{state.message}</p> : null}

      <button className="bos-register-submit" type="submit" disabled={pending}>
        {pending ? "Tworzenie konta…" : "Utwórz konto firmowe"} {!pending && <span aria-hidden="true">→</span>}
      </button>

      <p className="bos-register-login">Masz już konto? <Link href="/login">Zaloguj się</Link></p>
    </form>
  );
}
