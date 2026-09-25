"use client";

import { useEffect, useRef, useState } from "react";

export type MicrophoneState = "idle" | "requesting" | "active" | "denied" | "unsupported";
type MicrophoneControlProps = { onStateChange?: (state: MicrophoneState) => void; onStreamChange?: (stream: MediaStream | null) => void; };
const VOICE_NOTICE_KEY = "bos.voice.firstUseNotice.v1";

export default function MicrophoneControl({ onStateChange, onStreamChange }: MicrophoneControlProps) {
  const [state,setState]=useState<MicrophoneState>("idle");
  const [showNotice,setShowNotice]=useState(false);
  const streamRef=useRef<MediaStream|null>(null);
  const noticeRef=useRef<HTMLDivElement|null>(null);
  const previousFocusRef=useRef<HTMLElement|null>(null);
  function updateState(next:MicrophoneState){setState(next);onStateChange?.(next);}
  function stopMicrophone(){streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;onStreamChange?.(null);updateState("idle");}

  async function startMicrophone(){
    if(!navigator.mediaDevices?.getUserMedia){updateState("unsupported");return;}
    updateState("requesting");
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      streamRef.current=stream;onStreamChange?.(stream);updateState("active");
    }catch(error){
      const denied=error instanceof DOMException&&(error.name==="NotAllowedError"||error.name==="SecurityError");
      onStreamChange?.(null);updateState(denied?"denied":"idle");
    }
  }

  async function toggleMicrophone(){
    if(state==="active"){stopMicrophone();return;}
    let acknowledged=false;
    try{acknowledged=localStorage.getItem(VOICE_NOTICE_KEY)==="acknowledged";}catch{}
    if(!acknowledged){setShowNotice(true);return;}
    await startMicrophone();
  }

  async function acceptNotice(){
    try{localStorage.setItem(VOICE_NOTICE_KEY,"acknowledged");}catch{}
    setShowNotice(false);
    await startMicrophone();
  }

  useEffect(()=>()=>{streamRef.current?.getTracks().forEach(t=>t.stop());streamRef.current=null;onStreamChange?.(null);},[onStreamChange]);

  useEffect(()=>{
    if(!showNotice) return;
    previousFocusRef.current=document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog=noticeRef.current;
    const focusable=dialog?.querySelector<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
    focusable?.focus();
    function onKeyDown(event:KeyboardEvent){
      if(event.key==="Escape"){event.preventDefault();setShowNotice(false);setShowPrivacy(false);return;}
      if(event.key!=="Tab"||!dialog)return;
      const nodes=Array.from(dialog.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"));
      if(!nodes.length)return;
      const first=nodes[0],last=nodes[nodes.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
    document.addEventListener("keydown",onKeyDown);
    return()=>{document.removeEventListener("keydown",onKeyDown);previousFocusRef.current?.focus();};
  },[showNotice]);

  const label=state==="active"?"Wyłącz mikrofon":state==="requesting"?"Oczekiwanie na dostęp do mikrofonu":"Włącz mikrofon";
  return <div className="bos-microphone-control">
    <button className={`bos-microphone-button bos-microphone-button-${state}`} type="button" onClick={toggleMicrophone} disabled={state==="requesting"} aria-label={label} aria-pressed={state==="active"} title={label}>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14.5a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v4.5a4 4 0 0 0 4 4Zm-2-8.5a2 2 0 1 1 4 0v4.5a2 2 0 1 1-4 0V6Zm8 4a1 1 0 0 1 2 0v.5a8 8 0 0 1-7 7.94V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.56A8 8 0 0 1 4 10.5V10a1 1 0 1 1 2 0v.5a6 6 0 0 0 12 0V10Z"/></svg>
      {state==="active"&&<span className="bos-microphone-live-dot" aria-hidden="true"/>}
    </button>
    {(state==="denied"||state==="unsupported")&&<span className="bos-microphone-error" role="status">{state==="denied"?"Brak dostępu do mikrofonu.":"Mikrofon nie jest obsługiwany w tej przeglądarce."}</span>}
    {showNotice&&<div className="bos-voice-notice-backdrop" role="presentation">
      <div className="bos-voice-notice" role="dialog" aria-modal="true" aria-labelledby="bos-voice-notice-title">
        <span className="bos-voice-notice-label">BOS VOICE · AI</span>
        <h3 id="bos-voice-notice-title">Rozmowa głosowa z systemem AI</h3>
        <p id="bos-voice-notice-description">Aby prowadzić rozmowę głosową, dźwięk z mikrofonu jest przetwarzany w celu rozpoznania wypowiedzi i wygenerowania odpowiedzi.</p>
        <p className="bos-voice-notice-secondary">Po wybraniu „Uruchom Voice” przeglądarka może osobno poprosić o dostęp do mikrofonu.</p>
        <div className="bos-voice-notice-actions">
          <button type="button" className="bos-voice-notice-cancel" onClick={()=>setShowNotice(false)}>Anuluj</button>
          <button type="button" className="bos-voice-notice-start" onClick={acceptNotice}>Uruchom Voice</button>
        </div>
      </div>
    </div>}
  </div>;
}
