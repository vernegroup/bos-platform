export type VoiceSessionDiagnosticEvent =
  | "session_started" | "microphone_attached" | "realtime_connected"
  | "microphone_detached" | "session_error" | "session_closed";

export type VoiceSessionDiagnostic = {
  event: VoiceSessionDiagnosticEvent;
  sessionId: string | null;
  at: number;
  status: string;
  hasMicrophone: boolean;
  isRealtimeConnected: boolean;
  interruptionCount: number;
  lastEventType: string | null;
  errorCode: string | null;
};

const MAX_EVENTS=100;

export class VoiceSessionDiagnostics {
  private events:VoiceSessionDiagnostic[]=[];
  record(event:VoiceSessionDiagnosticEvent,input:Omit<VoiceSessionDiagnostic,"event"|"at">){
    this.events.push({event,at:Date.now(),...input});
    if(this.events.length>MAX_EVENTS)this.events.splice(0,this.events.length-MAX_EVENTS);
  }
  getEvents(){return this.events.map(item=>({...item}));}
  clear(){this.events=[];}
}
