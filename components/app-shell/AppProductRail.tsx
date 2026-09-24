"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const products=[
  {label:"ONBOARDING",href:"/app/onboarding"},
  {label:"PROMOTIONS",href:"/app/promotions"},
  {label:"WORK"},
  {label:"PRICING"},
  {label:"COMPLIANCE"},
] as const;

export default function AppProductRail(){
  const pathname=usePathname();
  return <nav className="bos-app-product-rail" aria-label="Produkty BOS">
    <span className="bos-app-product-rail-label">BOS</span>
    <div className="bos-app-product-rail-track">
      {products.map(product=>{
        const active=product.href ? (pathname===product.href||pathname.startsWith(product.href+"/")) : false;
        return product.href
          ? <Link key={product.label} href={product.href} className={"bos-app-product-rail-item"+(active?" is-active":"")} aria-current={active?"page":undefined}>{product.label}<i aria-hidden="true"/></Link>
          : <span key={product.label} className="bos-app-product-rail-item is-planned" aria-disabled="true">{product.label}<small>W PRZYGOTOWANIU</small></span>;
      })}
    </div>
  </nav>;
}
