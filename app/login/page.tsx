import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import LoginForm from "./LoginForm";
import "./login.css";

type LoginPageProps = { searchParams: Promise<{ callbackUrl?: string }> };

function safeCallbackUrl(value?: string) {
  return value?.startsWith("/app") ? value : "/app";
}

function GoogleMark() {
  return (
    <svg className="bos-login-google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.97-.9 6.62-2.36l-3.24-2.54c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.93V7.45H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.55l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.62 9.62 0 0 0 12 2a10 10 0 0 0-8.96 5.45l3.35 2.62C7.18 7.7 9.39 5.94 12 5.94Z" />
    </svg>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  if (session?.user) redirect(callbackUrl);

  return (
    <main className="bos-login">
      <section className="bos-login-auth" aria-label="Logowanie do platformy BOS">
        <section className="bos-login-panel" aria-labelledby="bos-login-title">
          <Link href="/" className="bos-login-brand" aria-label="BOS — strona publiczna">
            <span className="bos-login-brand-name">BOS</span>
            <span className="bos-login-brand-subtitle">STANDARDY OPERACYJNE BIZNESU</span>
          </Link>

          <div className="bos-login-rule" aria-hidden="true" />

          <div className="bos-login-copy">
            <h1 id="bos-login-title">Zaloguj się do swojego konta</h1>
            <p>Zarządzaj produktami, zespołem i standardami w swojej organizacji.</p>
          </div>

          <LoginForm callbackUrl={callbackUrl} />

          <div className="bos-login-divider"><span>lub</span></div>

          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: callbackUrl });
            }}
          >
            <button type="submit" className="bos-login-google">
              <GoogleMark />
              <span>Zaloguj się przez Google</span>
            </button>
          </form>

          <p className="bos-login-register">
            Nie masz jeszcze konta? <Link href="/register">Utwórz konto firmowe</Link>
          </p>
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
