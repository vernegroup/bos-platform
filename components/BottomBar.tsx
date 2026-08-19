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
              KRS: 0000991479
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
              BUSINESS OPERATING STANDARDS
            </div>

            <div className="bos-footer-row">
              Executive Operating Platform
            </div>

          </div>

          {/* Kontakt */}

          <div className="bos-footer-contact">

            <div className="bos-footer-title">
              CONTACT
            </div>

            <div className="bos-footer-row">
              sop@vp.pl
            </div>

            <div className="bos-footer-row">
              0048 889 322 470
            </div>

          </div>

          {/* Strona */}

          <div className="bos-footer-page">

            <div className="bos-footer-location">
              
            </div>

            <div className="bos-footer-number">
              
            </div>

          </div>

        </div>

      </div>

    </footer>
  );
}