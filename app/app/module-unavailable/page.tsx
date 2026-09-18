import Link from "next/link";

export default function ModuleUnavailablePage() {
  return (
    <section>
      <div className="bos-app-page-heading">
        <span className="bos-app-eyebrow">BOS / LICENCJA</span>
        <h1>Moduł niedostępny</h1>
        <p>Ta organizacja nie posiada aktywnej licencji do żądanego produktu BOS.</p>
      </div>
      <div className="bos-app-panel">
        <p>Licencja produktu jest niezależna od konta użytkownika. Dostęp otrzymują członkowie organizacji, której przyznano aktywną licencję.</p>
        <Link href="/app/products">Wróć do produktów →</Link>
      </div>
    </section>
  );
}
