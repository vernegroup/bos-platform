import "./styles.css";

import TopBar from "./components/TopBar";
import ExecutivePaper from "./components/ExecutivePaper";
import PurchaseHeader from "./components/PurchaseHeader";
import DocumentTable from "./components/DocumentTable";
import Signature from "./components/Signature";
import BottomBar from "./components/BottomBar";

export default function SuccessPage() {
  return (
    <>
      <TopBar />

      <main className="bos-success-page">

        <ExecutivePaper>

          <PurchaseHeader />

          <DocumentTable />

          <Signature />

        </ExecutivePaper>

      </main>

      <BottomBar />
    </>
  );
}