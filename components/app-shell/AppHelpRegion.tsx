"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { resolveHelpScreen } from "@/lib/bos/helpContext";

export default function AppHelpRegion(){
  const [expanded,setExpanded]=useState(false);
  const pathname=usePathname();
  const context=resolveHelpScreen(pathname);
  return <aside className="bos-app-help-region" aria-label="Pomoc kontekstowa BOS" data-help-product={context.product} data-help-screen={context.screen}>
    <div className="bos-app-help-desktop">
      <p className="bos-app-help-heading">Pomoc kontekstowa</p>
      <strong>{context.title}</strong>
      <p>{context.summary}</p>
    </div>
    <div className="bos-app-help-compact">
      <button type="button" className="bos-app-help-toggle" aria-expanded={expanded} aria-controls="bos-app-help-details" onClick={()=>setExpanded(v=>!v)}>Pomoc kontekstowa <span aria-hidden="true">{expanded?"−":"+"}</span></button>
      {expanded&&<div id="bos-app-help-details"><strong>{context.title}</strong><p>{context.summary}</p></div>}
    </div>
  </aside>;
}
