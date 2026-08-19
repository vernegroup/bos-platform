import "../styles.css";

export default function TopBar() {
  return (
    <header className="bos-topbar">
      <div className="bos-topbar-inner">

        <div className="bos-brand">

          <span className="bos-brand-gold">
            BOS
          </span>

          <span className="bos-brand-white">
            STANDARDY OPERACYJNE BIZNESU
          </span>

        </div>

        <div className="bos-page-title">

          ZAKUP UDANY · DOSTĘP DO MATERIAŁÓW

        </div>

      </div>

      <div className="bos-topbar-line" />

    </header>
  );
}