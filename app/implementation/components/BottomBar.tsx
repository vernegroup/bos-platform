export default function BottomBar() {
  return (
    <footer className="bos-bottom-bar">

      <div className="bos-page-width">

        <div className="bos-bottom-bar-inner">

          {/* Firma */}

          <div className="bos-footer-company">

            <div className="bos-footer-title">
              VERNE GROUP sp. z o.o.
            </div>

            <div className="bos-footer-row">
              NIP: 7532484848
            </div>

            <div className="bos-footer-row">
              KRS: XXXXXXXXXX
            </div>

            <div className="bos-footer-links">

              <a
                href="/documents/politykaPrywatnosci.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Polityka prywatności
              </a>

              <span>•</span>

              <a
                href="/documents/regulamin.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                Regulamin
              </a>

              <span>•</span>

              <a
                href="/documents/rodo.pdf"
                target="_blank"
                rel="noopener noreferrer"
              >
                RODO
              </a>

            </div>

          </div>

          {/* Platforma */}

          <div className="bos-footer-platform">

            <div className="bos-footer-title">
              STANDARDY OPERACYJNE BIZNESU
            </div>

            <div className="bos-footer-row">
              Platforma zarządzania operacyjnego
            </div>

          </div>

          {/* Kontakt */}

          <div className="bos-footer-contact">

            <div className="bos-footer-title">
              KONTAKT
            </div>

            <div className="bos-footer-row">
              office@bosplatform.pl
            </div>

            <div className="bos-footer-row">
              www.bosplatform.pl
            </div>

          </div>

          {/* Strona */}

          <div className="bos-footer-page">

            <div className="bos-footer-location">
              PLATFORMA
            </div>

            <div className="bos-footer-number">
              01 / 08
            </div>

          </div>

        </div>

      </div>

    </footer>
  );
}