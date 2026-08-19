import HeroText from "./HeroText";
import HeroImage from "./HeroImage";

export default function HeroSection() {
  return (
    <section className="bos-hero-section">

      <div className="bos-page-width">

        <div className="bos-hero-grid">

          <HeroText />

          <HeroImage />

        </div>

      </div>

    </section>
  );
}