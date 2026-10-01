"use client";

import Link from "next/link";
import { useEffect,useRef,useState } from "react";
import { getBOSProduct, type BOSProductKey } from "@/data/products";

export default function ProductDetailsModal({product,variant="default"}:{product:BOSProductKey;variant?:"default"|"rail"|"appRail"}){
 const [open,setOpen]=useState(false); const closeRef=useRef<HTMLButtonElement>(null); const triggerRef=useRef<HTMLButtonElement>(null);
 const catalogProduct=getBOSProduct(product); const d=catalogProduct.sales;
 // No product demo .webm files are published yet; avoid a guaranteed failed request.
 const demoAvailable=false;
 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";closeRef.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false);if(e.key==="Tab"){const modal=closeRef.current?.closest<HTMLElement>('[role="dialog"]');if(!modal)return;const items=Array.from(modal.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],video[controls],[tabindex]:not([tabindex="-1"])'));const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener("keydown",key);return()=>{document.body.style.overflow=previous;document.removeEventListener("keydown",key);triggerRef.current?.focus()}},[open]);
 return <>
  <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} className={variant==="rail"?"bos-product-rail__reveal":variant==="appRail"?"bos-app-product-rail-item bos-app-product-rail-item--sale":"bos-product-more"} onClick={()=>setOpen(true)}>{variant==="rail"?"POZNAJ":variant==="appRail"?catalogProduct.displayName:"Dowiedz się więcej"} <span aria-hidden="true">→</span></button>
  {open&&<div className="bos-product-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
   <section className="bos-product-modal" role="dialog" aria-modal="true" aria-labelledby={"modal-"+product}>
    <button ref={closeRef} className="bos-product-modal-close" type="button" aria-label="Zamknij" onClick={()=>setOpen(false)}>×</button>
    <div className="bos-product-modal-copy">
     <span className="bos-product-modal-kicker">{d.kicker}</span><h2 id={"modal-"+product}>{d.title}</h2><p className="bos-product-modal-lead">{d.description}</p>
     <div className="bos-product-modal-benefits">{d.benefits.map(([h,p])=><article key={h}><div><h3>{h}</h3><p>{p}</p></div></article>)}</div>
     <div className="bos-product-modal-audience"><b>Dla kogo?</b><p>{d.audience}</p></div>
     <Link href="/register" className="bos-product-modal-cta">ZAŁÓŻ KONTO <span>→</span></Link>
    </div>
    <div className="bos-product-modal-demo">
     <div className="bos-product-demo-frame">
      {demoAvailable?<video autoPlay muted loop playsInline preload="metadata"><source src={d.demo} type="video/webm"/></video>:<div className="bos-product-demo-placeholder"><span>BOS</span><strong>Prezentacja produktu</strong><p>Nagranie interfejsu będzie dostępne po publikacji wersji demonstracyjnej.</p></div>}
     </div>
     <div className="bos-product-modal-steps">{d.steps.map(([,h,p])=><article key={h}><div><h3>{h}</h3><p>{p}</p></div></article>)}</div>
    </div>
   </section>
  </div>}
 </>;
}
