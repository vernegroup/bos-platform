import PromotionText from "./PromotionText";
import PromotionImage from "./PromotionImage";

export default function PromotionSection() {
  return (
    <section className="bos-hero-section">

      <div className="bos-page-width">

        <div className="bos-hero-grid">

          <PromotionText />

          <PromotionImage />

        </div>

      </div>

    </section>
  );
}