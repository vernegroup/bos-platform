import Image from "next/image";

export default function Hero() {
  return (
    <section className="hero-section">
      <div
        className="container"
        style={{
          maxWidth: "980px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <Image
          src="/images/bos-logo.png"
          alt="Business Operating Standards"
          width={460}
          height={130}
          priority
          style={{
            display: "block",
            margin: "0 auto 20px auto",
            width: "100%",
            maxWidth: "460px",
            height: "auto",
          }}
        />

        <h1>Business Operating Standards</h1>

        <p>
          Gotowe standardy operacyjne dla nowoczesnych przedsiębiorstw.
        </p>
      </div>
    </section>
  );
}