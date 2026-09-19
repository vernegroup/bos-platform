import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ForgotPasswordForm from "./ForgotPasswordForm";
import "../login/login.css";
import "./reset.css";

export default async function ForgotPasswordPage() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <main className="bos-login">
      <section className="bos-login-auth" aria-label="Odzyskiwanie hasła BOS">
        <section className="bos-login-panel" aria-labelledby="bos-reset-title">
          <Link href="/" className="bos-login-brand" aria-label="BOS — strona publiczna">
            <span className="bos-login-brand-name">BOS</span>
            <span className="bos-login-brand-subtitle">BUSINESS OPERATING STANDARDS</span>
          </Link>
          <div className="bos-login-rule" aria-hidden="true" />
          <div className="bos-login-copy">
            <h1 id="bos-reset-title">Odzyskaj dostęp do konta</h1>
            <p>Podaj adres e-mail przypisany do konta BOS. Wyślemy jednorazowy link do ustawienia nowego hasła.</p>
          </div>
          <ForgotPasswordForm />
        </section>
      </section>
      <aside className="bos-login-brand-panel" aria-label="Business Operating Standards">
        <div className="bos-login-brand-backdrop" aria-hidden="true" />
        <div className="bos-login-brand-message"><p>Uporządkowana praca.<br />Silniejsze organizacje.</p><span aria-hidden="true" /></div>
      </aside>
    </main>
  );
}
