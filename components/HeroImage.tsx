import HeroCard from "./HeroCard";

export default function HeroImage() {
  return (
    <div className="bos-hero-image">

      <img
        src="/images/hero-office.png"
        alt="Business Operating Standards"
        className="bos-hero-photo"
      />

      <HeroCard />

    </div>
  );
}