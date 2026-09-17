import PricingText from "./PricingText";
import PricingImage from "./PricingImage";

export default function PricingSection() {
  return (
    <section className="bos-hero-section">

      <div className="bos-page-width">

        <div className="bos-hero-grid">

          <PricingText />

          <PricingImage />

        </div>

      </div>

    </section>
  );
}