"use client";
import { useEffect,useState } from "react";

const EVENT="bos:open-intro";

export function BOSIntroTrigger(){
 return <button type="button" className="bos-home-secondary-action bos-intro-reopen" onClick={()=>window.dispatchEvent(new Event(EVENT))}>CZYM JEST BOS?</button>;
}
export default function BOSIntro(){
 const [open,setOpen]=useState(false);
 useEffect(()=>{
  try{if(localStorage.getItem("bos_intro_seen")!=="1")setOpen(true)}catch{}
  const show=()=>setOpen(true); window.addEventListener(EVENT,show); return()=>window.removeEventListener(EVENT,show);
 },[]);
 useEffect(()=>{if(!open)return;const key=(e:KeyboardEvent)=>{if(e.key==="Escape")close()};document.addEventListener("keydown",key);document.body.classList.add("bos-overlay-open");return()=>{document.removeEventListener("keydown",key);document.body.classList.remove("bos-overlay-open")}},[open]);
 function close(){try{localStorage.setItem("bos_intro_seen","1")}catch{} setOpen(false)}
 if(!open)return null;
 return <div className="bos-intro" role="dialog" aria-modal="true" aria-labelledby="bos-intro-title">
  <div className="bos-intro-inner">
   <div className="bos-intro-mark">BOS</div>
   <div className="bos-intro-rule"/>
   <span>BUSINESS OPERATING STANDARDS</span>
   <h2 id="bos-intro-title">System operacyjny dla małych i średnich firm.</h2>
   <p>BOS porządkuje powtarzalne procesy firmy i zamienia sposób działania organizacji w konkretne, mierzalne i możliwe do wdrożenia systemy pracy.</p>
   <strong>Nie kolejny zestaw dokumentów. Narzędzia do prowadzenia rzeczywistych procesów.</strong>
   <button autoFocus type="button" onClick={close}>POZNAJ BOS <b aria-hidden="true">→</b></button>
   <small>WDROŻENIA · AWANSE · KOLEJNE SYSTEMY</small>
  </div>
 </div>
}
