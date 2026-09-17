import "./styles.css";

import TopBar from "../components/TopBar";

import HeroSection from "../components/HeroSection";
import PromotionSection from "../components/PromotionSection";

import FeatureCards from "../components/FeatureCards";

import BottomBar from "../components/BottomBar";

import BOSSupport from "../components/BOSSupport/BOSSupport";

export default function HomePage() {
  return (
    <>
      <TopBar />

      <main className="bos-home">

        <HeroSection />

        <PromotionSection />

        <FeatureCards />

      </main>

      <BottomBar />

      <BOSSupport />

    </>
  );
}