"use client";
import Link from "next/link";
import { useEffect,useRef,useState } from "react";

type ProductKey="onboarding"|"promotions";
const data={
 onboarding:{
  kicker:"BOS WDROŻENIA",title:"Uporządkuj wdrożenie. Skróć drogę do samodzielności.",
  description:"BOS Wdrożenia prowadzi managera przez przygotowanie, realizację i zamknięcie wdrożenia pracownika w jednym, powtarzalnym procesie.",
  benefits:[["Jeden standard","Stanowisko, czynności krytyczne i oczekiwany rezultat są zapisane w jednym miejscu."],["Kontrola postępu","Manager widzi etap procesu, realizację zadań i moment gotowości pracownika."],["Mniej improwizacji","Kolejne wdrożenia wykorzystują ten sam sprawdzony mechanizm zamiast zaczynać od zera."]],
  audience:"Dla właścicieli i managerów MŚP, którzy chcą wdrażać pracowników w sposób powtarzalny i możliwy do kontrolowania.",
  steps:[["01","Przygotuj","Zdefiniuj stanowisko i standard."],["02","Przeprowadź","Realizuj kolejne etapy wdrożenia."],["03","Zamknij","Zweryfikuj gotowość i zachowaj historię."]],
  demo:"/videos/bos-onboarding-demo.webm"
 },
 promotions:{
  kicker:"BOS AWANSE",title:"Zmieniaj role bez utraty kontroli nad procesem.",
  description:"BOS Awanse porządkuje awanse i przesunięcia poziome jako proces wejścia pracownika w nową rolę, z własnym standardem i kryterium gotowości.",
  benefits:[["Nowa rola, nowy standard","Kompetencje wymagane na nowym stanowisku są opisane niezależnie od poprzedniej roli."],["Ciągłość pracownika","Proces może korzystać z historii osoby w organizacji bez skracania wymagań nowego stanowiska."],["Decyzja oparta na gotowości","Zamknięcie zmiany następuje po weryfikacji wykonania i gotowości do samodzielnej pracy."]],
  audience:"Dla firm, które rozwijają ludzi wewnętrznie i chcą prowadzić awanse oraz przesunięcia według jasnego, udokumentowanego procesu.",
  steps:[["01","Przygotuj zmianę","Wybierz osobę, rolę i standard."],["02","Przeprowadź","Realizuj wymagania nowego stanowiska."],["03","Zweryfikuj","Zamknij zmianę po potwierdzeniu gotowości."]],
  demo:"/videos/bos-promotions-demo.webm"
 }
} as const;

export default function ProductDetailsModal({product,variant="default"}:{product:ProductKey;variant?:"default"|"rail"}){
 const [open,setOpen]=useState(false); const [videoFailed,setVideoFailed]=useState(false); const closeRef=useRef<HTMLButtonElement>(null); const d=data[product];
 useEffect(()=>{if(!open)return;setVideoFailed(false);const previous=document.body.style.overflow;document.body.style.overflow="hidden";closeRef.current?.focus();const key=(e:KeyboardEvent)=>{if(e.key==="Escape")setOpen(false)};document.addEventListener("keydown",key);return()=>{document.body.style.overflow=previous;document.removeEventListener("keydown",key)}},[open]);
 return <>
  <button type="button" className={variant==="rail"?"bos-product-rail__reveal":"bos-product-more"} onClick={()=>setOpen(true)}>{variant==="rail"?"POZNAJ":"Dowiedz się więcej"} <span aria-hidden="true">→</span></button>
  {open&&<div className="bos-product-modal-backdrop" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
   <section className="bos-product-modal" role="dialog" aria-modal="true" aria-labelledby={"modal-"+product}>
    <button ref={closeRef} className="bos-product-modal-close" type="button" aria-label="Zamknij" onClick={()=>setOpen(false)}>×</button>
    <div className="bos-product-modal-copy">
     <span className="bos-product-modal-kicker">{d.kicker}</span><h2 id={"modal-"+product}>{d.title}</h2><p className="bos-product-modal-lead">{d.description}</p>
     <div className="bos-product-modal-benefits">{d.benefits.map(([h,p])=><article key={h}><i aria-hidden="true">✓</i><div><h3>{h}</h3><p>{p}</p></div></article>)}</div>
     <div className="bos-product-modal-audience"><b>Dla kogo?</b><p>{d.audience}</p></div>
     <Link href="/register" className="bos-product-modal-cta">ZAŁÓŻ KONTO <span>→</span></Link>
    </div>
    <div className="bos-product-modal-demo">
     <div className="bos-product-demo-frame">
      {!videoFailed?<video autoPlay muted loop playsInline preload="metadata" onError={()=>setVideoFailed(true)}><source src={d.demo} type="video/webm"/></video>:<div className="bos-product-demo-placeholder"><span>BOS</span><strong>Demo produktu</strong><p>Miejsce na finalne nagranie rzeczywistego interfejsu.</p></div>}
     </div>
     <div className="bos-product-modal-steps">{d.steps.map(([n,h,p])=><article key={n}><b>{n}</b><div><h3>{h}</h3><p>{p}</p></div></article>)}</div>
    </div>
   </section>
  </div>}
 </>;
}
