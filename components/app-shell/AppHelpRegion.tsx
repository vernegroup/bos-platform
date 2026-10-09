"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { resolveHelpInstruction } from "@/lib/bos/helpInstructions";
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
  const instruction=resolveHelpInstruction({...context,state});
  const details=<>
    <strong>{instruction.title}</strong>
    <ol className="bos-help-instruction-list">{instruction.steps.map((step,index)=><li key={index}>{step}</li>)}</ol>
    {instruction.note&&<p>{instruction.note}</p>}
    {instruction.href&&<Link className="bos-help-instruction-link" href={instruction.href}>{instruction.linkLabel??"Otwórz" } →</Link>}
  </>;
  return <aside className="bos-app-help-region" aria-label="Pomoc kontekstowa BOS" data-help-product={context.product} data-help-screen={context.screen}>
    <div className="bos-app-help-desktop">
      <p className="bos-app-help-heading">Pomoc kontekstowa</p>
      {details}
    </div>
    <div className="bos-app-help-compact">
      <button type="button" className="bos-app-help-toggle" aria-expanded={expanded} aria-controls="bos-app-help-details" onClick={()=>setExpanded(v=>!v)}>Pomoc kontekstowa <span aria-hidden="true">{expanded?"−":"+"}</span></button>
      {expanded&&<div id="bos-app-help-details">{details}</div>}
    </div>
  </aside>;
}
