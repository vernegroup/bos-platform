import { RealtimeWebRTCTransport } from "./RealtimeWebRTCTransport";
import type { RealtimeEvent, RealtimeEventEnvelope } from "./RealtimeEvents";
import { createVadSessionUpdate, reduceVadEvent, type VadConfig, type VadSignal, type VadState } from "./VoiceActivityDetection";
import { INITIAL_BARGE_IN_STATE, createCancelResponseEvent, createTruncateItemEvent, reduceAssistantPlayback, type BargeInState } from "./BargeInController";
import { AudioPlaybackController, type AudioPlaybackState } from "./AudioPlaybackController";

export type VoiceSessionStatus = "idle" | "ready" | "connecting" | "connected" | "microphone-active" | "closing" | "closed" | "error";
export type VoiceSessionSnapshot = {
  id:string|null; status:VoiceSessionStatus; startedAt:number|null; endedAt:number|null;
  hasMicrophone:boolean; isRealtimeConnected:boolean; lastEventType:string|null;
  vadState:VadState; speechStartedAtMs:number|null; speechEndedAtMs:number|null;
  assistantSpeaking:boolean; interruptionCount:number; playbackState:AudioPlaybackState; error:string|null;
};
type VoiceSessionListener=(snapshot:VoiceSessionSnapshot)=>void;
type RealtimeEventListener=(envelope:RealtimeEventEnvelope)=>void;
const INITIAL_VAD:VadSignal={state:"idle",audioStartMs:null,audioEndMs:null};
const INITIAL_SNAPSHOT:VoiceSessionSnapshot={
  id:null,status:"idle",startedAt:null,endedAt:null,hasMicrophone:false,isRealtimeConnected:false,lastEventType:null,
  vadState:"idle",speechStartedAtMs:null,speechEndedAtMs:null,assistantSpeaking:false,interruptionCount:0,playbackState:"idle",error:null,
};
function createSessionId(){if(typeof crypto!=="undefined"&&"randomUUID" in crypto)return crypto.randomUUID();return `voice-${Date.now()}-${Math.random().toString(36).slice(2)}`;}

export class VoiceSessionClient{
  private snapshot={...INITIAL_SNAPSHOT};
  private listeners=new Set<VoiceSessionListener>();
  private eventListeners=new Set<RealtimeEventListener>();
  private microphoneStream:MediaStream|null=null;
  private vad={...INITIAL_VAD};
  private bargeIn:BargeInState={...INITIAL_BARGE_IN_STATE};
  private playback=new AudioPlaybackController();
  private transport=new RealtimeWebRTCTransport({
    onRemoteStream:(stream)=>this.handleRemoteStream(stream),
    onEvent:(envelope)=>this.handleRealtimeEvent(envelope),
  });

  constructor(){this.playback.subscribe((p)=>this.setSnapshot({...this.snapshot,playbackState:p.state}));}
  getSnapshot(){return this.snapshot;}
  subscribe(listener:VoiceSessionListener){this.listeners.add(listener);listener(this.snapshot);return()=>this.listeners.delete(listener);}
  subscribeToEvents(listener:RealtimeEventListener){this.eventListeners.add(listener);return()=>this.eventListeners.delete(listener);}
  sendRealtimeEvent(event:RealtimeEvent){this.transport.sendEvent(event);}
  configureVad(config:VadConfig={}){this.transport.sendEvent(createVadSessionUpdate(config));}

  start(){
    if(this.snapshot.status!=="idle"&&this.snapshot.status!=="closed")return this.snapshot;
    this.vad={...INITIAL_VAD};this.bargeIn={...INITIAL_BARGE_IN_STATE};
    this.setSnapshot({...INITIAL_SNAPSHOT,id:createSessionId(),status:"ready",startedAt:Date.now()});return this.snapshot;
  }

  async attachMicrophone(stream:MediaStream){
    if(this.snapshot.status==="idle"||this.snapshot.status==="closed")this.start();
    this.microphoneStream=stream;this.setSnapshot({...this.snapshot,status:"connecting",hasMicrophone:true,error:null,vadState:"listening"});
    try{
      await this.transport.connect(stream);
      if(this.microphoneStream!==stream){this.transport.disconnect();return;}
      this.setSnapshot({...this.snapshot,status:"connected",hasMicrophone:true,isRealtimeConnected:true,vadState:"listening"});
      this.configureVad();
    }catch(error){
      this.setSnapshot({...this.snapshot,status:"error",hasMicrophone:true,isRealtimeConnected:false,vadState:"idle",
        error:error instanceof Error?error.message:"Nie udało się połączyć sesji Voice."});
    }
  }

  detachMicrophone(){
    this.microphoneStream=null;this.transport.disconnect();this.playback.stop();this.vad={...INITIAL_VAD};
    if(this.snapshot.status==="closed"||this.snapshot.status==="idle")return;
    this.setSnapshot({...this.snapshot,status:"ready",hasMicrophone:false,isRealtimeConnected:false,vadState:"idle",
      speechStartedAtMs:null,speechEndedAtMs:null,assistantSpeaking:false,error:null});
  }

  fail(message:string){this.setSnapshot({...this.snapshot,status:"error",isRealtimeConnected:false,vadState:"idle",error:message});}

  close(){
    if(this.snapshot.status==="closed"||this.snapshot.status==="idle")return;
    this.setSnapshot({...this.snapshot,status:"closing"});this.microphoneStream=null;this.transport.disconnect();this.vad={...INITIAL_VAD};this.playback.destroy();
    this.setSnapshot({...this.snapshot,status:"closed",endedAt:Date.now(),hasMicrophone:false,isRealtimeConnected:false,
      vadState:"idle",speechStartedAtMs:null,speechEndedAtMs:null,assistantSpeaking:false});
  }

  private handleRealtimeEvent(envelope:RealtimeEventEnvelope){
    const type=envelope.event.type;const wasSpeaking=this.bargeIn.assistantSpeaking;
    this.bargeIn=reduceAssistantPlayback(this.bargeIn,envelope.event);
    if(type==="input_audio_buffer.speech_started"&&wasSpeaking)this.interruptAssistant();
    const error=type==="error"?this.readRealtimeError(envelope.event):this.snapshot.error;
    this.vad=reduceVadEvent(this.vad,envelope.event);
    this.setSnapshot({...this.snapshot,lastEventType:type,error,vadState:this.vad.state,
      speechStartedAtMs:this.vad.audioStartMs,speechEndedAtMs:this.vad.audioEndMs,assistantSpeaking:this.bargeIn.assistantSpeaking});
    this.eventListeners.forEach((listener)=>listener(envelope));
  }

  private interruptAssistant(){
    const audioEndMs=this.playback.getCurrentTimeMs();
    try{this.transport.sendEvent(createCancelResponseEvent());}catch{}
    const truncate=createTruncateItemEvent(this.bargeIn,audioEndMs);
    if(truncate){try{this.transport.sendEvent(truncate);}catch{}}
    this.playback.pause();this.bargeIn={...this.bargeIn,assistantSpeaking:false,interruptedAt:Date.now()};
    this.setSnapshot({...this.snapshot,assistantSpeaking:false,interruptionCount:this.snapshot.interruptionCount+1});
  }

  private readRealtimeError(event:RealtimeEvent){
    const error=event.error;
    if(error&&typeof error==="object"&&"message" in error&&typeof error.message==="string")return error.message;
    return "Realtime API zwróciło błąd.";
  }
  private handleRemoteStream(stream:MediaStream|null){if(stream)this.playback.attach(stream);else this.playback.stop();}
  private setSnapshot(next:VoiceSessionSnapshot){this.snapshot=next;this.listeners.forEach((listener)=>listener(this.snapshot));}
}
