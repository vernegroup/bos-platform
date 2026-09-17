import "./styles.css";
import "./product-stage.css";

import TopBar from "../components/TopBar";

import ProductStage from "../components/ProductStage";
import PromotionSection from "../components/PromotionSection";

import FeatureCards from "../components/FeatureCards";

import BottomBar from "../components/BottomBar";

import BOSSupport from "../components/BOSSupport/BOSSupport";

import { bosProducts } from "../data/products";

export default function HomePage() {
  return (
    <>
      <TopBar />

      <main className="bos-home">

        <ProductStage product={bosProducts[0]} />

        <PromotionSection />

        <FeatureCards />

      </main>

      <BottomBar />

      <BOSSupport />

    </>
  );
}
