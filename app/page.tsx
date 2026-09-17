import "./styles.css";
import "./product-stage.css";

import TopBar from "../components/TopBar";

import ProductStory from "../components/ProductStory";

import FeatureCards from "../components/FeatureCards";

import BottomBar from "../components/BottomBar";

import BOSSupport from "../components/BOSSupport/BOSSupport";

export default function HomePage() {
  return (
    <>
      <TopBar />

      <main className="bos-home">

        <ProductStory />

        <FeatureCards />

      </main>

      <BottomBar />

      <BOSSupport />

    </>
  );
}
