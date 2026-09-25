export type VoiceErrorSource="microphone"|"transport"|"realtime"|"playback"|"session"|"api";
export type VoiceErrorDiagnostic={
  id:string; at:number; source:VoiceErrorSource; code:string; message:string;
  recoverable:boolean; sessionId:string|null; realtimeEventType:string|null;
};
const MAX_ERRORS=50;
function safeMessage(value:unknown){return value instanceof Error?value.message:String(value||"Unknown Voice error").slice(0,300);}
export class VoiceErrorDiagnostics{
  private errors:VoiceErrorDiagnostic[]=[];
  record(input:Omit<VoiceErrorDiagnostic,"id"|"at"|"message">&{message:unknown}){
    const item:VoiceErrorDiagnostic={...input,id:`voice-error-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,at:Date.now(),message:safeMessage(input.message)};
    this.errors.push(item);if(this.errors.length>MAX_ERRORS)this.errors.splice(0,this.errors.length-MAX_ERRORS);return item;
  }
  getErrors(){return this.errors.map(item=>({...item}));}
  getLatest(){const item=this.errors[this.errors.length-1];return item?{...item}:null;}
  clear(){this.errors=[];}
}
