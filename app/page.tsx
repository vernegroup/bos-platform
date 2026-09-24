
import "./styles.css";
import "./product-stage.css";
import "./product-flow.css";
import "./navigation.css";
import "./footer.css";
import "./mobile.css";
import "./product-alignment.css";
import "./public-scene.css";
import "./public-hero.css";
import "./public-products.css";
import "./public-story.css";

import TopBar from "../components/TopBar";
import BottomBar from "../components/BottomBar";
import BOSSupport from "../components/BOSSupport/BOSSupport";
import ProductRail from "../components/home/ProductRail";
import PublicScene from "../components/home/PublicScene";
import PublicHero from "../components/home/PublicHero";
import PublicStory from "../components/home/PublicStory";

export default function HomePage() {
  return (
    <div className="bos-public-root">
      <PublicScene />
      <div className="bos-public-content">
        <TopBar />

        <main className="bos-home">
          <PublicHero />

          <ProductRail />

          <PublicStory />
        </main>

        <BottomBar />
        <BOSSupport />
      </div>
    </div>
  );
}
