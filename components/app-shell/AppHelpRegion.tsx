"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { resolveHelpScreen, type HelpContext } from "@/lib/bos/helpContext";

export default function AppHelpRegion(){
  const [expanded,setExpanded]=useState(false);
  const pathname=usePathname();
  const routeContext=resolveHelpScreen(pathname);
  const [processContext,setProcessContext]=useState<HelpContext|null>(null);
  useEffect(()=>{
    setProcessContext(null);
    const receive=(event:Event)=>{
      const value=(event as CustomEvent<HelpContext>).detail;
      if(value?.product===routeContext.product && value.screen===routeContext.screen) setProcessContext(value);
    };
    window.addEventListener("bos:help-context",receive);
    window.dispatchEvent(new Event("bos:help-context-request"));
    return()=>window.removeEventListener("bos:help-context",receive);
  },[pathname,routeContext.product,routeContext.screen]);
  const context=routeContext;
  const state=processContext?.product===context.product&&processContext.screen===context.screen?processContext.state:undefined;
  const stateText:Record<string,string>={
    "start-blocked":"Najpierw potwierdź warunki rozpoczęcia procesu.",
    "tasks-pending":"Dokończ wymagane etapy czynności.",
    "critical-pending":"Dokończ czynności krytyczne K.",
    "readiness-pending":"Potwierdź kryteria gotowości.",
    "ready-for-decision":"Warunki decyzji są spełnione. Decyzję podejmuje uprawniona osoba.",
    "gate-standard":"Brakuje poprawnego Standardu roli B.",
    "gate-process":"Uzupełnij wymagane dane procesu.",
    "gate-entry":"Dokończ ocenę wejściową.",
    "gate-deployment":"Dokończ wdrożenie roli B.",
    "gate-critical":"Dokończ czynności krytyczne K.",
    "gate-readiness":"Potwierdź kryteria gotowości.",
    "gate-transition":"Potwierdź przekazanie obowiązków A → B."
  };
  const guidance=state?stateText[state]:undefined;
  return <aside className="bos-app-help-region" aria-label="Pomoc kontekstowa BOS" data-help-product={context.product} data-help-screen={context.screen}>
    <div className="bos-app-help-desktop">
      <p className="bos-app-help-heading">Pomoc kontekstowa</p>
      <strong>{context.title}</strong>
      <p>{guidance??context.summary}</p>
    </div>
    <div className="bos-app-help-compact">
      <button type="button" className="bos-app-help-toggle" aria-expanded={expanded} aria-controls="bos-app-help-details" onClick={()=>setExpanded(v=>!v)}>Pomoc kontekstowa <span aria-hidden="true">{expanded?"−":"+"}</span></button>
      {expanded&&<div id="bos-app-help-details"><strong>{context.title}</strong><p>{context.summary}</p></div>}
    </div>
  </aside>;
}
