"use client";

import { useEffect,useRef,useState } from "react";
import { getBOSProduct, type BOSProductKey } from "@/data/products";

type Variant="default"|"rail"|"appRail"|"buyMenu";

export default function ProductDetailsModal({product,variant="default",onOpen}:{product:BOSProductKey;variant?:Variant;onOpen?:()=>void}){
 const [open,setOpen]=useState(false); const [checkoutPending,setCheckoutPending]=useState(false); const [checkoutError,setCheckoutError]=useState(""); const closeRef=useRef<HTMLButtonElement>(null); const triggerRef=useRef<HTMLButtonElement>(null);
 const catalogProduct=getBOSProduct(product); const d=catalogProduct.sales;
 const demoAvailable=false;
 useEffect(()=>{if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow="hidden";closeRef.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false);if(e.key==="Tab"){const modal=closeRef.current?.closest<HTMLElement>('[role="dialog"]');if(!modal)return;const items=Array.from(modal.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],video[controls],[tabindex]:not([tabindex="-1"])'));const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener("keydown",key);return()=>{document.body.style.overflow=previous;document.removeEventListener("keydown",key);triggerRef.current?.focus()}},[open]);
 function show(){onOpen?.();setCheckoutError("");setOpen(true)}
 async function checkout(){if(checkoutPending)return;setCheckoutPending(true);setCheckoutError("");try{const response=await fetch(catalogProduct.offer.checkoutEndpoint,{method:"POST"});const payload=await response.json().catch(()=>null) as {url?:string}|null;if(!response.ok||!payload?.url)throw new Error("checkout_failed");window.location.assign(payload.url)}catch{setCheckoutError("Nie udało się otworzyć płatności. Spróbuj ponownie.");setCheckoutPending(false)}}
 const triggerClass=variant==="rail"?"bos-product-rail__reveal":variant==="appRail"?"bos-app-product-rail-item bos-app-product-rail-item--sale":variant==="buyMenu"?"bos-topbar-buy-option":"bos-product-more";
 const triggerLabel=variant==="rail"?"POZNAJ":variant==="appRail"||variant==="buyMenu"?catalogProduct.displayName:"Dowiedz się więcej";
 return <>
  <button ref={triggerRef} type="button" aria-haspopup="dialog" aria-expanded={open} className={triggerClass} onClick={show}>{triggerLabel} <span aria-hidden="true">→</span></button>
  {open&&<div className="bos-product-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
   <section className="bos-product-modal" role="dialog" aria-modal="true" aria-labelledby={"modal-"+product}>
    <button ref={closeRef} className="bos-product-modal-close" type="button" aria-label="Zamknij" onClick={()=>setOpen(false)}>×</button>
    <div className="bos-product-modal-copy">
     <span className="bos-product-modal-kicker">{d.kicker}</span><h2 id={"modal-"+product}>{d.title}</h2><p className="bos-product-modal-lead">{d.description}</p>
     <div className="bos-product-modal-benefits">{d.benefits.map(([h,p])=><article key={h}><div><h3>{h}</h3><p>{p}</p></div></article>)}</div>
     <div className="bos-product-modal-audience"><b>Dla kogo?</b><p>{d.audience}</p></div>
     <button type="button" className="bos-product-modal-cta" onClick={checkout} disabled={checkoutPending} aria-label={catalogProduct.offer.ariaLabel}>{checkoutPending?"OTWIERAM PŁATNOŚĆ…":"KUP"} <span>→</span></button>
     {checkoutError&&<p className="bos-product-modal-checkout-error" role="alert">{checkoutError}</p>}
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
