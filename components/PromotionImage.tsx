import PromotionCard from "./PromotionCard";
import ProductVideo from "./ProductVideo";

export default function PromotionImage() {
  return (
    <div className="bos-hero-image">

      <img
        src="/images/promotions-hero.png"
        alt="BOS Promotions"
        className="bos-hero-photo"
      />

      <div className="bos-product-media-stack">

        <ProductVideo
          src="/videos/onboarding-02.mp4"
          label="BOS Promotions"
        />

        <PromotionCard />

      </div>

    </div>
  );
}