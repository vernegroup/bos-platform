import "../styles.css";

export default function ImplementationForm() {
  return (
    <section className="bos-form">

      <div className="bos-form-header">

        <div className="bos-form-eyebrow">
          FORMULARZ KONTAKTOWY
        </div>

        <h2 className="bos-form-title">
          Porozmawiajmy o wdrożeniu
        </h2>

        <p className="bos-form-text">
          Uzupełnij poniższe informacje. Skontaktujemy się z Tobą, aby omówić zakres wdrożenia, przewidywany czas realizacji oraz potrzeby Twojej firmy.
        </p>

      </div>

      <form className="bos-contact-form">

        <div className="bos-field">

          <label>
            IMIE I NAZWISKO
          </label>

          <input
            type="text"
            placeholder="Jan Kowalski"
          />

        </div>

        <div className="bos-field">

          <label>
            NAZWA FIRMY
          </label>

          <input
            type="text"
            placeholder="Nazwa Firmy"
          />

        </div>

        <div className="bos-form-grid">

          <div className="bos-field">

            <label>
              Email
            </label>

            <input
              type="email"
              placeholder="kontakt@poczta.pl"
            />

          </div>

          <div className="bos-field">

            <label>
              TELEFON KONTAKTOWY
            </label>

            <input
              type="tel"
              placeholder="+48 ..."
            />

          </div>

        </div>

        <div className="bos-field">

          <label>
            ROZMIAR FIRMY
          </label>

          <select>

            <option>
              Wybierz…
            </option>

            <option>
              1–10 pracowników
            </option>

            <option>
              11–50 pracowników
            </option>

            <option>
              51–250 pracowników
            </option>

            <option>
              250+ pracowników
            </option>

          </select>

        </div>

        <div className="bos-field">

          <label>
            Wiadomość
          </label>

          <textarea
            rows={6}
            placeholder="Krótko opisz, czego potrzebuje Twoja firma..."
          />

        </div>

        <label className="bos-checkbox">

          <input type="checkbox" />

          <span>
           Wyrażam zgodę na kontakt w sprawie wdrożenia Business Operating Standards.
          </span>

        </label>

        <button
          className="bos-submit"
          type="submit"
        >
          ZAPYTAJ O WDROŻENIE
        </button>

      </form>

    </section>
  );
}