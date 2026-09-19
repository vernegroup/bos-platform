import Image from "next/image";
import HeroCard from "./HeroCard";
import ProductVideo from "./ProductVideo";

export default function HeroImage() {
  return (
    <div className="bos-hero-image">

      <Image
        src="/images/hero-office.png"
        alt="Business Operating Standards"
        className="bos-hero-photo"
        width={1023}
        height={840}
        sizes="(max-width: 800px) 100vw, 50vw"
      />

      <div className="bos-product-media-stack">

        <ProductVideo
          src="/videos/onboarding-test.mp4"
          label="BOS Onboarding"
        />

        <HeroCard />

      </div>

    </div>
  );
}
