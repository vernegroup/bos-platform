"use client";
import {useEffect,useState} from "react";
import "./BOSSupport.css";
import AssistantPanel from "./AssistantPanel";
import BOSSupportButton from "./BOSSupportButton";
export default function BOSSupport(){
 const[open,setOpen]=useState(false);const[showAiNotice,setShowAiNotice]=useState(false);
 function toggle(){setOpen(v=>{const next=!v;if(next)setShowAiNotice(true);return next;});}
 useEffect(()=>{if(!showAiNotice)return;const t=window.setTimeout(()=>setShowAiNotice(false),3000);return()=>window.clearTimeout(t);},[showAiNotice]);
 return <>{open&&<AssistantPanel onClose={()=>setOpen(false)}/>} {open&&showAiNotice&&<aside className="bos-assistant-ai-toast" role="status" aria-live="polite"><strong>AI</strong><span>Rozmawiasz z systemem AI. Informacje o przetwarzaniu danych są dostępne przy uruchamianiu Voice.</span></aside>}<div className="bos-support-widget"><BOSSupportButton open={open} onToggle={toggle}/></div></>;
}
