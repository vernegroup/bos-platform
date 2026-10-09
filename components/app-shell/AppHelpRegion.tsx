"use client";

import { useState } from "react";

export default function AppHelpRegion(){
  const [expanded,setExpanded]=useState(false);
  return <aside className="bos-app-help-region" aria-label="Pomoc kontekstowa BOS">
    <div className="bos-app-help-desktop"><p className="bos-app-help-heading">Pomoc kontekstowa</p><p>Pomoc dla bieżącego ekranu będzie dostępna tutaj.</p></div>
    <div className="bos-app-help-compact">
      <button type="button" className="bos-app-help-toggle" aria-expanded={expanded} aria-controls="bos-app-help-details" onClick={()=>setExpanded(v=>!v)}>Pomoc kontekstowa <span aria-hidden="true">{expanded?"−":"+"}</span></button>
      {expanded&&<p id="bos-app-help-details">Pomoc dla bieżącego ekranu będzie dostępna tutaj.</p>}
    </div>
  </aside>;
}
