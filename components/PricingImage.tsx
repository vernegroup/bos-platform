import PricingCard from "./PricingCard";
import ProductVideo from "./ProductVideo";

export default function PricingImage() {
  return (
    <div className="bos-hero-image">

      <img
        src="/images/pricing-hero.jpg"
        alt="BOS Pricing"
        className="bos-hero-photo"
      />

      <div className="bos-product-media-stack">

        <ProductVideo
          src="/videos/onboarding-03.mp4"
          label="BOS Pricing"
        />

        <PricingCard />

      </div>

    </div>
  );
}