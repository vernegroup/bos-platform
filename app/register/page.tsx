import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import RegisterForm from "./RegisterForm";
import "./register.css";

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/app");

  return (
    <main className="bos-register">
      <section className="bos-register-auth">
        <section className="bos-register-panel" aria-labelledby="bos-register-title">
          <Link href="/" className="bos-register-brand" aria-label="BOS — strona publiczna">
            <span className="bos-register-brand-name">BOS</span>
            <span className="bos-register-brand-subtitle">STANDARDY OPERACYJNE BIZNESU</span>
          </Link>
          <div className="bos-register-rule" />
          <header className="bos-register-copy">
            <h1 id="bos-register-title">Utwórz konto firmowe</h1>
            <p>Jedno konto właściciela tworzy organizację BOS. Kolejnych użytkowników zaprosisz później do tej samej organizacji.</p>
          </header>
          <RegisterForm />
        </section>
      </section>
      <aside className="bos-register-brand-panel" aria-label="Standardy Operacyjne Biznesu">
        <div className="bos-register-brand-backdrop" aria-hidden="true" />
        <div className="bos-register-brand-message">
          <p>Jedna organizacja.<br />Jeden uporządkowany system.</p>
          <span aria-hidden="true" />
        </div>
      </aside>
    </main>
  );
}
