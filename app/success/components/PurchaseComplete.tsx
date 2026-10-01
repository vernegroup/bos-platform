import Link from "next/link";
import { auth } from "@/auth";
import { verifyCheckout } from "@/lib/verifyCheckout";
import type { BOSProductKey } from "@/data/products";
import { getBOSProduct } from "@/data/products";
import "../styles.css";

type Props={sessionId:string;product:BOSProductKey};
export default async function PurchaseComplete({sessionId,product}:Props){
 const checkout=await verifyCheckout(sessionId,product); if(!checkout)return null;
 const session=await auth(); const catalog=getBOSProduct(product); const authenticated=Boolean(session?.user);
 const entitlementReady=checkout.purchaseStatus==="PAID"&&checkout.licenseStatus==="ACTIVE";
 const productHref=product==="onboarding"?"/app/onboarding":"/app/promotions";
 return <main className="bos-success-page"><div className="bos-page-width"><section className="bos-paper bos-purchase-complete"><div className="bos-content">
  <div className="bos-order">PŁATNOŚĆ POTWIERDZONA</div><h1 className="bos-title">Zakup {catalog.displayName} został przyjęty.</h1>
  <p className="bos-purchase-lead">{authenticated?(entitlementReady?"Licencja jest aktywna w Twojej organizacji BOS.":"Płatność jest potwierdzona. Kończymy aktywację licencji w Twojej organizacji."):"Na adres e-mail użyty podczas płatności wysyłamy bezpieczny link do aktywacji dostępu BOS."}</p>
  <div className="bos-purchase-state"><span>Płatność</span><strong>Potwierdzona</strong><span>Dostęp</span><strong>{entitlementReady?"Aktywny":"Aktywacja"}</strong></div>
  <div className="bos-purchase-actions">{authenticated&&entitlementReady?<Link className="bos-download" href={productHref}>OTWÓRZ PRODUKT</Link>:authenticated?<Link className="bos-download" href="/app/products">PRZEJDŹ DO PRODUKTÓW</Link>:<Link className="bos-download" href="/login">PRZEJDŹ DO LOGOWANIA</Link>}<Link className="bos-portal-button" href={authenticated?"/app":"/"}>{authenticated?"PANEL BOS":"STRONA GŁÓWNA"}</Link></div>
  {!authenticated&&<p className="bos-purchase-note">Nie twórz drugiego konta dla tego zakupu. Użyj linku aktywacyjnego z wiadomości e-mail; jest jednorazowy i prowadzi do ustawienia hasła.</p>}
 </div></section></div></main>;
}
