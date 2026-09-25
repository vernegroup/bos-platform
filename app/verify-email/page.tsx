import Link from "next/link";
import { verifyEmailToken } from "@/lib/bos/emailVerificationRepository";
import "../login/login.css";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;
  const result = await verifyEmailToken(token ?? "");

  return (
    <main className="bos-login">
      <section className="bos-login-auth">
        <section className="bos-login-panel" aria-labelledby="verify-title">
          <Link href="/" className="bos-login-brand">
            <span className="bos-login-brand-name">BOS</span>
            <span className="bos-login-brand-subtitle">STANDARDY OPERACYJNE BIZNESU</span>
          </Link>
          <div className="bos-login-rule" />
          <div className="bos-login-copy">
            <h1 id="verify-title">{result.ok ? "Adres e-mail potwierdzony" : "Link jest nieprawidłowy lub wygasł"}</h1>
            <p>
              {result.ok
                ? "Konto firmowe BOS jest aktywne. Możesz teraz zalogować się adresem e-mail i hasłem."
                : "Link weryfikacyjny jest jednorazowy i ważny przez 24 godziny."}
            </p>
          </div>
          <Link href="/login" className="bos-login-submit" style={{ textDecoration: "none" }}>
            Przejdź do logowania <span aria-hidden="true">→</span>
          </Link>
        </section>
      </section>
      <aside className="bos-login-brand-panel" aria-label="Standardy Operacyjne Biznesu">
        <div className="bos-login-brand-backdrop" aria-hidden="true" />
        <div className="bos-login-brand-message">
          <p>Uporządkowana praca.<br />Silniejsze organizacje.</p>
          <span aria-hidden="true" />
        </div>
      </aside>
    </main>
  );
}
