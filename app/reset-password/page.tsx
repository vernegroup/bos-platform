import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ResetPasswordForm from "./ResetPasswordForm";
import "../login/login.css";
import "../forgot-password/reset.css";

type ResetPasswordPageProps = { searchParams: Promise<{ token?: string }> };

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const session = await auth();
  if (session?.user) redirect("/app");
  const { token = "" } = await searchParams;

  return (
    <main className="bos-login">
      <section className="bos-login-auth" aria-label="Ustawianie nowego hasła BOS">
        <section className="bos-login-panel" aria-labelledby="bos-reset-title">
          <Link href="/" className="bos-login-brand" aria-label="BOS — strona publiczna">
            <span className="bos-login-brand-name">BOS</span>
            <span className="bos-login-brand-subtitle">STANDARDY OPERACYJNE BIZNESU</span>
          </Link>
          <div className="bos-login-rule" aria-hidden="true" />
          <div className="bos-login-copy">
            <h1 id="bos-reset-title">Ustaw nowe hasło</h1>
            <p>Wprowadź nowe hasło do swojego konta BOS. Link może zostać użyty tylko raz.</p>
          </div>
          <ResetPasswordForm token={token} />
        </section>
      </section>
      <aside className="bos-login-brand-panel" aria-label="Standardy Operacyjne Biznesu">
        <div className="bos-login-brand-backdrop" aria-hidden="true" />
        <div className="bos-login-brand-message"><p>Uporządkowana praca.<br />Silniejsze organizacje.</p><span aria-hidden="true" /></div>
      </aside>
    </main>
  );
}
