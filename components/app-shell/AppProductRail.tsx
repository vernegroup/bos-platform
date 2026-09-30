"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ProductKey="onboarding"|"promotions";
type RailProduct={label:string;href?:string;key?:ProductKey};

const products:RailProduct[]=[
  {label:"WDROŻENIA",href:"/app/onboarding",key:"onboarding"},
  {label:"AWANSE",href:"/app/promotions",key:"promotions"},
  {label:"WYCENA"},
];

export default function AppProductRail({licensedProductKeys}:{licensedProductKeys:ProductKey[]}){
  const pathname=usePathname();
  return <nav className="bos-app-product-rail" aria-label="Produkty BOS">
    <span className="bos-app-product-rail-label">BOS</span>
    <div className="bos-app-product-rail-track">
      {products.map(product=>{
        if(product.key&&!licensedProductKeys.includes(product.key))return null;
        const active=product.href ? (pathname===product.href||pathname.startsWith(product.href+"/")) : false;
        return product.href
          ? <Link key={product.label} href={product.href} className={"bos-app-product-rail-item"+(active?" is-active":"")} aria-current={active?"page":undefined}>{product.label}<i aria-hidden="true"/></Link>
          : <span key={product.label} className="bos-app-product-rail-item is-planned" aria-disabled="true">{product.label}</span>;
      })}
    </div>
  </nav>;
}
