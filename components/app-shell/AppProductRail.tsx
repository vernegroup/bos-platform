"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProductDetailsModal from "@/components/home/ProductDetailsModal";
import { bosProducts, plannedBosProducts, type BOSProductKey } from "@/data/products";

const productHrefs: Record<BOSProductKey,string> = {
  onboarding: "/app/onboarding",
  promotions: "/app/promotions",
};

export default function AppProductRail({productEntitlements}:{productEntitlements:{key:BOSProductKey;licensed:boolean}[]}){
  const pathname=usePathname();
  return <nav className="bos-app-product-rail" aria-label="Produkty BOS">
    <span className="bos-app-product-rail-label">BOS</span>
    <div className="bos-app-product-rail-track">
      {bosProducts.map(product=>{
        const licensed=productEntitlements.find(entitlement=>entitlement.key===product.id)?.licensed===true;
        const href=productHrefs[product.id];
        const active=licensed&&(pathname===href||pathname.startsWith(href+"/"));
        return licensed
          ? <Link key={product.id} href={href} className={"bos-app-product-rail-item"+(active?" is-active":"")} aria-current={active?"page":undefined}>{product.displayName}<i aria-hidden="true"/></Link>
          : <div key={product.id} className="bos-app-product-rail-sale"><ProductDetailsModal product={product.id} variant="appRail"/></div>;
      })}
      {plannedBosProducts.map(product=><span key={product.id} className="bos-app-product-rail-item is-planned" aria-disabled="true">{product.displayName}</span>)}
    </div>
  </nav>;
}
