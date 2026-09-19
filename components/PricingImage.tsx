import Image from "next/image";
import PricingCard from "./PricingCard";
import ProductVideo from "./ProductVideo";

export default function PricingImage() {
  return (
    <div className="bos-hero-image">

      <Image
        src="/images/pricing-hero.jpg"
        alt="BOS Pricing"
        className="bos-hero-photo"
        width={2998}
        height={2000}
        sizes="(max-width: 800px) 100vw, 50vw"
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
