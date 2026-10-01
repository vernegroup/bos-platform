import { notFound } from "next/navigation";
import PurchaseComplete from "../components/PurchaseComplete";
import "../styles.css";
type Props={searchParams:Promise<{session_id?:string}>};
export default async function Page({searchParams}:Props){const {session_id}=await searchParams;if(!session_id)notFound();return <PurchaseComplete sessionId={session_id} product="onboarding"/>;}
