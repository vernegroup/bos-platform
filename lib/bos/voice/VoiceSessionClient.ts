import { RealtimeWebRTCTransport } from "./RealtimeWebRTCTransport";
import type { RealtimeEvent, RealtimeEventEnvelope } from "./RealtimeEvents";
import { createVadSessionUpdate, reduceVadEvent, type VadConfig, type VadSignal, type VadState } from "./VoiceActivityDetection";

export type VoiceSessionStatus = "idle" | "ready" | "connecting" | "connected" | "microphone-active" | "closing" | "closed" | "error";

export type VoiceSessionSnapshot = {
  id: string | null; status: VoiceSessionStatus; startedAt: number | null; endedAt: number | null;
  hasMicrophone: boolean; isRealtimeConnected: boolean; lastEventType: string | null;
  vadState: VadState; speechStartedAtMs: number | null; speechEndedAtMs: number | null; error: string | null;
};

type VoiceSessionListener = (snapshot: VoiceSessionSnapshot) => void;
type RealtimeEventListener = (envelope: RealtimeEventEnvelope) => void;

const INITIAL_VAD: VadSignal = { state: "idle", audioStartMs: null, audioEndMs: null };
const INITIAL_SNAPSHOT: VoiceSessionSnapshot = {
  id:null,status:"idle",startedAt:null,endedAt:null,hasMicrophone:false,isRealtimeConnected:false,lastEventType:null,
  vadState:"idle",speechStartedAtMs:null,speechEndedAtMs:null,error:null,
};

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `voice-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export class VoiceSessionClient {
  private snapshot: VoiceSessionSnapshot = { ...INITIAL_SNAPSHOT };
  private listeners = new Set<VoiceSessionListener>();
  private eventListeners = new Set<RealtimeEventListener>();
  private microphoneStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private vad: VadSignal = { ...INITIAL_VAD };
  private transport = new RealtimeWebRTCTransport({
    onRemoteStream:(stream)=>this.handleRemoteStream(stream),
    onEvent:(envelope)=>this.handleRealtimeEvent(envelope),
  });

  getSnapshot(){return this.snapshot;}
  subscribe(listener:VoiceSessionListener){this.listeners.add(listener);listener(this.snapshot);return()=>this.listeners.delete(listener);}
  subscribeToEvents(listener:RealtimeEventListener){this.eventListeners.add(listener);return()=>this.eventListeners.delete(listener);}
  sendRealtimeEvent(event:RealtimeEvent){this.transport.sendEvent(event);}
  configureVad(config:VadConfig={}){this.transport.sendEvent(createVadSessionUpdate(config));}

  start(){
    if(this.snapshot.status!=="idle"&&this.snapshot.status!=="closed")return this.snapshot;
    this.vad={...INITIAL_VAD};
    this.setSnapshot({...INITIAL_SNAPSHOT,id:createSessionId(),status:"ready",startedAt:Date.now()});
    return this.snapshot;
  }

  async attachMicrophone(stream:MediaStream){
    if(this.snapshot.status==="idle"||this.snapshot.status==="closed")this.start();
    this.microphoneStream=stream;
    this.setSnapshot({...this.snapshot,status:"connecting",hasMicrophone:true,error:null,vadState:"listening"});
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
    this.microphoneStream=null;this.transport.disconnect();this.vad={...INITIAL_VAD};
    if(this.snapshot.status==="closed"||this.snapshot.status==="idle")return;
    this.setSnapshot({...this.snapshot,status:"ready",hasMicrophone:false,isRealtimeConnected:false,vadState:"idle",
      speechStartedAtMs:null,speechEndedAtMs:null,error:null});
  }

  fail(message:string){this.setSnapshot({...this.snapshot,status:"error",isRealtimeConnected:false,vadState:"idle",error:message});}

  close(){
    if(this.snapshot.status==="closed"||this.snapshot.status==="idle")return;
    this.setSnapshot({...this.snapshot,status:"closing"});
    this.microphoneStream=null;this.transport.disconnect();this.vad={...INITIAL_VAD};
    if(this.remoteAudio){this.remoteAudio.pause();this.remoteAudio.srcObject=null;this.remoteAudio=null;}
    this.setSnapshot({...this.snapshot,status:"closed",endedAt:Date.now(),hasMicrophone:false,isRealtimeConnected:false,
      vadState:"idle",speechStartedAtMs:null,speechEndedAtMs:null});
  }

  private handleRealtimeEvent(envelope:RealtimeEventEnvelope){
    const type=envelope.event.type;
    const error=type==="error"?this.readRealtimeError(envelope.event):this.snapshot.error;
    this.vad=reduceVadEvent(this.vad,envelope.event);
    this.setSnapshot({...this.snapshot,lastEventType:type,error,vadState:this.vad.state,
      speechStartedAtMs:this.vad.audioStartMs,speechEndedAtMs:this.vad.audioEndMs});
    this.eventListeners.forEach((listener)=>listener(envelope));
  }

  private readRealtimeError(event:RealtimeEvent){
    const error=event.error;
    if(error&&typeof error==="object"&&"message" in error&&typeof error.message==="string")return error.message;
    return "Realtime API zwróciło błąd.";
  }

  private handleRemoteStream(stream:MediaStream|null){
    if(!stream||typeof Audio==="undefined"){if(this.remoteAudio)this.remoteAudio.srcObject=null;return;}
    if(!this.remoteAudio){this.remoteAudio=new Audio();this.remoteAudio.autoplay=true;}
    this.remoteAudio.srcObject=stream;void this.remoteAudio.play().catch(()=>undefined);
  }

  private setSnapshot(next:VoiceSessionSnapshot){this.snapshot=next;this.listeners.forEach((listener)=>listener(this.snapshot));}
}
