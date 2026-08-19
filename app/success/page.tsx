import "./styles.css";

import ExecutivePaper from "./components/ExecutivePaper";
import TopBar from "./components/TopBar";
import PurchaseHeader from "./components/PurchaseHeader";
import DocumentTable from "./components/DocumentTable";
import BottomBar from "./components/BottomBar";

export default function SuccessPage() {
  return (
    <>

      <TopBar />

      <ExecutivePaper>

        <div className="bos-content">

          <PurchaseHeader />

          <DocumentTable />

          <BottomBar />

        </div>

      </ExecutivePaper>

    </>
  );
}