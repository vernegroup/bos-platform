import "./styles.css";

import TopBar from "../components/TopBar";
import HeroSection from "../components/HeroSection";
import Divider from "../components/Divider";
import BinderSection from "../components/BinderSection";
import BottomBar from "../components/BottomBar";

export default function HomePage() {
  return (
    <>

      <TopBar />

      <main className="bos-home">

        <HeroSection />

        <Divider />

        <BinderSection />

      </main>

      <BottomBar />

    </>
  );
}