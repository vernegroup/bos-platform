import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function NoAccessPage(){
  const session=await auth();
  const email=session?.user?.email?.trim().toLowerCase();
  let paidPurchase=false;
  if(email){
    const rows=await db().unsafe("SELECT 1 FROM purchases WHERE lower(buyer_email)=$1 AND status='PAID' LIMIT 1",[email]);
    paidPurchase=rows.length>0;
  }
  return <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f2eee5",color:"#132238"}}><section style={{width:"min(100%,560px)",border:"1px solid rgba(19,34,56,.24)",background:"#faf7ef",padding:36}}><p style={{fontSize:11,fontWeight:700,letterSpacing:".16em",color:"#8a6b2f"}}>BOS / DOSTĘP</p><h1 style={{fontFamily:"Georgia,serif",fontSize:42,margin:"14px 0"}}>{paidPurchase?"Zakup został potwierdzony":"Konto nie ma dostępu do organizacji"}</h1><p style={{lineHeight:1.65,color:"#5f6670"}}>{paidPurchase?"BOS ma opłacony zakup przypisany do tego adresu e-mail. Wyloguj się i zaloguj ponownie tym samym adresem Google, aby platforma powiązała tożsamość z utworzoną organizacją.":"Tożsamość została potwierdzona, ale BOS nie znalazł aktywnego członkostwa w organizacji. Dostęp nadaje właściciel lub administrator firmy."}</p><Link href="/api/auth/signout" style={{display:"inline-block",marginTop:20,color:"#132238",fontWeight:700}}>Wyloguj</Link></section></main>
}
