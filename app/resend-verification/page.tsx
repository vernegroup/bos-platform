import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ResendVerificationForm from "./ResendVerificationForm";
import "../register/register.css";

export default async function ResendVerificationPage() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <main className="bos-register">
      <section className="bos-register-auth">
        <section className="bos-register-panel" aria-labelledby="resend-title">
          <Link href="/" className="bos-register-brand" aria-label="BOS — strona publiczna">
            <span className="bos-register-brand-name">BOS</span>
            <span className="bos-register-brand-subtitle">BUSINESS OPERATING STANDARDS</span>
          </Link>
          <div className="bos-register-rule" />
          <header className="bos-register-copy">
            <h1 id="resend-title">Ponowna weryfikacja e-mail</h1>
            <p>Podaj adres użyty przy rejestracji. Jeżeli konto oczekuje na aktywację, wyślemy nowy link weryfikacyjny.</p>
          </header>
          <ResendVerificationForm />
        </section>
      </section>
      <aside className="bos-register-brand-panel" aria-label="Business Operating Standards">
        <div className="bos-register-brand-backdrop" aria-hidden="true" />
        <div className="bos-register-brand-message"><p>Jedna organizacja.<br />Jeden uporządkowany system.</p><span aria-hidden="true" /></div>
      </aside>
    </main>
  );
}
