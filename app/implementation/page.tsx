export default function ImplementationPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg,#06162f 0%,#12376a 100%)",
        padding: "60px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          background: "#ffffff",
          borderRadius: "20px",
          padding: "50px",
          boxShadow: "0 25px 70px rgba(0,0,0,.25)",
        }}
      >
        <h1
          style={{
            color: "#0b2346",
            fontSize: "42px",
            marginBottom: "15px",
            textAlign: "center",
          }}
        >
          Zostaw kontakt
        </h1>

        <p
          style={{
            color: "#4b5563",
            textAlign: "center",
            lineHeight: 1.8,
            marginBottom: "40px",
          }}
        >
          Chcesz wdrożyć Business Operating Standards
          w swojej firmie?
          <br />
          Wypełnij formularz – skontaktujemy się z Tobą.
        </p>

        <form>
          <input
            type="text"
            placeholder="Imię i nazwisko"
            style={inputStyle}
          />

          <input
            type="text"
            placeholder="Nazwa firmy"
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="Adres e-mail"
            style={inputStyle}
          />

          <input
            type="tel"
            placeholder="Telefon"
            style={inputStyle}
          />

          <textarea
            placeholder="Krótko opisz swoją firmę lub potrzebę..."
            rows={6}
            style={textareaStyle}
          />

          <label
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "flex-start",
              marginBottom: "30px",
              fontSize: "14px",
              color: "#555",
            }}
          >
            <input type="checkbox" />

            Wyrażam zgodę na kontakt w celu odpowiedzi
            na moje zapytanie.
          </label>

          <button
            type="submit"
            style={buttonStyle}
          >
            Zostaw kontakt
          </button>
        </form>
      </div>
    </main>
  );
}

const inputStyle = {
  width: "100%",
  padding: "16px",
  marginBottom: "18px",
  borderRadius: "10px",
  border: "1px solid #d6d6d6",
  fontSize: "16px",
  boxSizing: "border-box" as const,
};

const textareaStyle = {
  ...inputStyle,
  resize: "vertical" as const,
};

const buttonStyle = {
  width: "100%",
  padding: "18px",
  background: "#ff7a00",
  color: "#fff",
  border: "none",
  borderRadius: "10px",
  fontSize: "18px",
  fontWeight: 700,
  cursor: "pointer",
};