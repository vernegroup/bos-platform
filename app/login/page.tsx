import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import "./login.css";

type LoginPageProps = { searchParams: Promise<{ callbackUrl?: string }> };

function safeCallbackUrl(value?: string) {
  return value?.startsWith("/app") ? value : "/app";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = safeCallbackUrl(params.callbackUrl);
  if (session?.user) redirect(callbackUrl);

  return (
    <main className="bos-login">
      <section className="bos-login-panel">
        <Link href="/" className="bos-login-brand" aria-label="BOS — strona publiczna">
          <strong>BOS</strong><span>Business Operating Standards</span>
        </Link>
        <div className="bos-login-copy">
          <span className="bos-login-kicker">DOSTĘP DO PLATFORMY</span>
          <h1>Zaloguj się do BOS</h1>
          <p>Konto użytkownika potwierdza tożsamość. Uprawnienia do firmy i produktów są przydzielane niezależnie w BOS.</p>
        </div>
        <form action={async () => { "use server"; await signIn("google", { redirectTo: callbackUrl }); }}>
          <button type="submit" className="bos-login-google">Kontynuuj z Google</button>
        </form>
        <p className="bos-login-note">Logowanie e-mail zostanie podłączone jako niezależna metoda po skonfigurowaniu dostawcy poczty. BOS nie przechowuje hasła Google.</p>
      </section>
    </main>
  );
}
