import Link from "next/link";

export default function BOSAppNotFound() {
  return (
    <section className="bos-system-state">
      <span className="bos-system-state-kicker">BOS / 404</span>
      <h1>Nie znaleziono wskazanego rekordu</h1>
      <p>Element mógł zostać usunięty, należy do innej organizacji albo podany adres jest nieprawidłowy.</p>
      <Link href="/app">WRÓĆ DO PANELU →</Link>
    </section>
  );
}
