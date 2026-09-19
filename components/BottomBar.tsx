export default function BottomBar() {
  return (
    <footer id="kontakt" className="bos-bottom-bar">
      <div className="bos-page-width">
        <div className="bos-bottom-bar-inner">
          <div className="bos-footer-brand">
            <div className="bos-footer-brand-mark">BOS</div>
            <div className="bos-footer-brand-name">BUSINESS OPERATING STANDARDS</div>
          </div>

          <div className="bos-footer-company">
            <div className="bos-footer-title">VERNE GROUP sp. z o.o.</div>
            <div className="bos-footer-row">NIP: 7532484848</div>
            <div className="bos-footer-row">KRS: 0000991479</div>
          </div>

          <div className="bos-footer-contact">
            <div className="bos-footer-title">KONTAKT</div>
            <div className="bos-footer-row">sop@vp.pl</div>
            <div className="bos-footer-row">0048 889 322 470</div>
          </div>
        </div>

        <div className="bos-footer-legal">
          <div className="bos-footer-links">
            <a href="/documents/politykaPrywatnosci.pdf" target="_blank" rel="noopener noreferrer">
              Polityka prywatności
            </a>
            <span>•</span>
            <a href="/documents/regulamin.pdf" target="_blank" rel="noopener noreferrer">
              Regulamin
            </a>
            <span>•</span>
            <a href="/documents/rodo.pdf" target="_blank" rel="noopener noreferrer">
              RODO
            </a>
          </div>
          <span>© {new Date().getFullYear()} Verne Group sp. z o.o.</span>
        </div>
      </div>
    </footer>
  );
}
