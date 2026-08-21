import "../styles.css";

export default function DocumentTable() {
  return (
    <section className="bos-documents">

      <div className="bos-document">

        <div className="bos-document-left">

          <div className="bos-document-number">
            01
          </div>

          <div>

            <div className="bos-document-title">
              BOS Onboarding.pdf
            </div>

            <div className="bos-document-description">
              Kompletny standard operacyjny
            </div>

          </div>

        </div>

        <button className="bos-download">
          POBIERZ
        </button>

      </div>

      <div className="bos-document">

        <div className="bos-document-left">

          <div className="bos-document-number">
            02
          </div>

          <div>

            <div className="bos-document-title">
              BOS Forms.xlsx
            </div>

            <div className="bos-document-description">
              Aktywne formularze i checklisty
            </div>

          </div>

        </div>

        <button className="bos-download">
          POBIERZ
        </button>

      </div>

      <div className="bos-document">

        <div className="bos-document-left">

          <div className="bos-document-number">
            03
          </div>

          <div>

            <div className="bos-document-title">
              Implementation Guide.pdf
            </div>

            <div className="bos-document-description">
              Instrukcja wdrożenia produktu
            </div>

          </div>

        </div>

        <button className="bos-download">
          POBIERZ
        </button>

      </div>

    </section>
  );
}