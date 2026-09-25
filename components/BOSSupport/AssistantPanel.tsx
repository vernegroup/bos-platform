"use client";
import {useCallback,useEffect,useRef,useState} from "react";
import TextChat from "./TextChat";import VoiceStateIndicator from "./VoiceStateIndicator";import type{MicrophoneState}from"./MicrophoneControl";import{VoiceSessionClient,type VoiceSessionSnapshot}from"../../lib/bos/voice/VoiceSessionClient";
type AssistantPanelProps={onClose:()=>void};
export default function AssistantPanel({onClose}:AssistantPanelProps){
 const[voiceState,setVoiceState]=useState<MicrophoneState>("idle");const clientRef=useRef<VoiceSessionClient|null>(null);const[session,setSession]=useState<VoiceSessionSnapshot|null>(null);const[showAiNotice,setShowAiNotice]=useState(true);
 if(!clientRef.current)clientRef.current=new VoiceSessionClient();
 useEffect(()=>{const t=window.setTimeout(()=>setShowAiNotice(false),3000);return()=>window.clearTimeout(t);},[]);
 useEffect(()=>{const c=clientRef.current!;const u=c.subscribe(setSession);c.start();return()=>{u();c.close();};},[]);
 const handleStreamChange=useCallback((stream:MediaStream|null)=>{const c=clientRef.current;if(!c)return;if(stream)void c.attachMicrophone(stream);else c.detachMicrophone();},[]);
 return <>{showAiNotice&&<aside className="bos-assistant-ai-toast" role="status" aria-live="polite"><strong>Asystent AI</strong><span>Rozmawiasz z systemem AI. Szczegóły przetwarzania danych są dostępne przy uruchamianiu Voice.</span></aside>}<section className="bos-assistant-panel" id="bos-support-window" role="dialog" aria-modal="false" aria-labelledby="bos-assistant-title" data-voice-session={session?.status??"idle"}><header className="bos-assistant-header"><div><span className="bos-assistant-eyebrow">BOS ASSISTANT <span className="bos-assistant-ai-badge" aria-label="Asystent AI">AI</span></span><h2 id="bos-assistant-title">Jak mogę pomóc?</h2></div><button className="bos-assistant-close" type="button" onClick={onClose} aria-label="Zamknij BOS Assistant">×</button></header><VoiceStateIndicator state={voiceState}/><TextChat onVoiceStateChange={setVoiceState} onMicrophoneStreamChange={handleStreamChange}/></section></>;
}
