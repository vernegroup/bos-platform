import "../styles.css";

import { notFound } from "next/navigation";

import TopBar from "../components/TopBar";
import ExecutivePaper from "../components/ExecutivePaper";
import PurchaseHeader from "../components/PurchaseHeader";
import DocumentTable from "../components/DocumentTable";
import Signature from "../components/Signature";
import BottomBar from "../components/BottomBar";

import { verifyCheckout } from "@/lib/verifyCheckout";

type Props = {
  searchParams: Promise<{
    session_id?: string;
  }>;
};

export default async function OnboardingSuccessPage({
  searchParams,
}: Props) {
  const { session_id } = await searchParams;

  if (!session_id) {
    notFound();
  }

  const checkout = await verifyCheckout(session_id, "onboarding");

  if (!checkout) {
    notFound();
  }

  return (
    <>
      <TopBar />

      <main className="bos-success-page">

        <ExecutivePaper>

          <PurchaseHeader product="BOS Wdrożenia" />

          <DocumentTable
            product="BOS Wdrożenia"
            sessionId={checkout.session.id}
          />

          <Signature />

        </ExecutivePaper>

      </main>

      <BottomBar />

    </>
  );
}