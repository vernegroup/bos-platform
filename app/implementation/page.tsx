import "./styles.css";

import TopBar from "./components/TopBar";
import ExecutivePaper from "./components/ExecutivePaper";
import ImplementationHero from "./components/ImplementationHero";
import ImplementationForm from "./components/ImplementationForm";

export default function ImplementationPage() {
  return (
    <>
      <TopBar />

      <main className="bos-implementation-page">
        <div className="bos-page-width">
          <section className="bos-implementation-layout">
            <ImplementationHero />

            <ExecutivePaper>
              <ImplementationForm />
            </ExecutivePaper>
          </section>
        </div>
      </main>
    </>
  );
}