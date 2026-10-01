import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import ClaimPurchaseForm from "./ClaimPurchaseForm";
import "../login/login.css";
type Props={searchParams:Promise<{token?:string}>};
export default async function ClaimPurchasePage({searchParams}:Props){const session=await auth();if(session?.user)redirect("/app");const {token=""}=await searchParams;return <main className="bos-login"><section className="bos-login-auth"><section className="bos-login-panel"><Link href="/" className="bos-login-brand"><span className="bos-login-brand-name">BOS</span><span className="bos-login-brand-subtitle">BUSINESS OPERATING STANDARDS</span></Link><div className="bos-login-rule"/><div className="bos-login-copy"><h1>Aktywuj zakupiony dostęp</h1><p>Ustaw hasło do konta BOS. Link otrzymany po zakupie jest jednorazowy.</p></div><ClaimPurchaseForm token={token}/></section></section><aside className="bos-login-brand-panel"><div className="bos-login-brand-backdrop"/><div className="bos-login-brand-message"><p>Uporządkowana praca.<br/>Silniejsze organizacje.</p><span/></div></aside></main>}
