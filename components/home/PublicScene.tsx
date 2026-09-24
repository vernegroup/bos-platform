"use client";

import { useEffect } from "react";

const beams = [
  ["ice","near"],["blue","far"],["violet","mid"],["rose","near"],
  ["gold","far"],["ice","mid"],["violet","near"],["blue","far"],["gold","mid"],
] as const;

export default function PublicScene() {
  useEffect(() => {
    const root=document.documentElement;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame=0,scrollTarget=0,scrollCurrent=0,mouseTargetX=0,mouseTargetY=0,mouseX=0,mouseY=0,active=true;
    const readScroll=()=>{const max=Math.max(root.scrollHeight-window.innerHeight,1);scrollTarget=Math.min(Math.max(window.scrollY/max,0),1)};
    const tick=()=>{
      if(!active)return;
      if(reduced.matches){root.style.setProperty("--bos-public-scroll","0");root.style.setProperty("--bos-public-mouse-x","0");root.style.setProperty("--bos-public-mouse-y","0");frame=0;return}
      scrollCurrent+=(scrollTarget-scrollCurrent)*.075;mouseX+=(mouseTargetX-mouseX)*.045;mouseY+=(mouseTargetY-mouseY)*.045;
      root.style.setProperty("--bos-public-scroll",scrollCurrent.toFixed(4));root.style.setProperty("--bos-public-mouse-x",mouseX.toFixed(4));root.style.setProperty("--bos-public-mouse-y",mouseY.toFixed(4));
      const moving=Math.abs(scrollTarget-scrollCurrent)>.0001||Math.abs(mouseTargetX-mouseX)>.0001||Math.abs(mouseTargetY-mouseY)>.0001;
      frame=moving?requestAnimationFrame(tick):0;
    };
    const wake=()=>{if(!frame)frame=requestAnimationFrame(tick)};
    const onScroll=()=>{readScroll();wake()};
    const onPointer=(e:PointerEvent)=>{if(e.pointerType==="touch")return;mouseTargetX=Math.max(-1,Math.min(1,(e.clientX/window.innerWidth-.5)*2));mouseTargetY=Math.max(-1,Math.min(1,(e.clientY/window.innerHeight-.5)*2));wake()};
    const onLeave=()=>{mouseTargetX=0;mouseTargetY=0;wake()};
    const onVisibility=()=>{active=!document.hidden;if(active){readScroll();wake()}else if(frame){cancelAnimationFrame(frame);frame=0}};
    readScroll();scrollCurrent=scrollTarget;
    window.addEventListener("scroll",onScroll,{passive:true});window.addEventListener("resize",onScroll);window.addEventListener("pointermove",onPointer,{passive:true});document.documentElement.addEventListener("pointerleave",onLeave);document.addEventListener("visibilitychange",onVisibility);reduced.addEventListener("change",wake);wake();
    return()=>{active=false;if(frame)cancelAnimationFrame(frame);window.removeEventListener("scroll",onScroll);window.removeEventListener("resize",onScroll);window.removeEventListener("pointermove",onPointer);document.documentElement.removeEventListener("pointerleave",onLeave);document.removeEventListener("visibilitychange",onVisibility);reduced.removeEventListener("change",wake);["--bos-public-scroll","--bos-public-mouse-x","--bos-public-mouse-y"].forEach(v=>root.style.removeProperty(v))};
  },[]);

  return <div className="bos-public-scene" aria-hidden="true">
    <div className="bos-public-scene__base"/>
    <div className="bos-public-scene__mist bos-public-scene__mist--left"/>
    <div className="bos-public-scene__mist bos-public-scene__mist--right"/>
    <div className="bos-public-scene__architecture">
      <i className="bos-public-edge bos-public-edge--left"/><i className="bos-public-edge bos-public-edge--right"/>
      <i className="bos-public-edge bos-public-edge--top"/><i className="bos-public-edge bos-public-edge--deep"/>
    </div>
    <div className="bos-public-scene__beams">{beams.map(([tone,depth],i)=><i key={i} className={`bos-public-beam bos-public-beam--${tone} bos-public-beam--${depth} bos-public-beam--n${i+1}`}/>)}</div>
    <div className="bos-public-scene__haze"/>
    <div className="bos-public-scene__vignette"/>
    <div className="bos-public-scene__grain"/>
  </div>;
}
