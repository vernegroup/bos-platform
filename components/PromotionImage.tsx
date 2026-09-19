import Image from "next/image";
import PromotionCard from "./PromotionCard";
import ProductVideo from "./ProductVideo";

export default function PromotionImage() {
  return (
    <div className="bos-hero-image">

      <Image
        src="/images/promotions-hero.png"
        alt="BOS Promotions"
        className="bos-hero-photo"
        width={685}
        height={840}
        sizes="(max-width: 800px) 100vw, 50vw"
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
