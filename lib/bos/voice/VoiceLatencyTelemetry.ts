import type { RealtimeEvent } from "./RealtimeEvents";

export type VoiceLatencySnapshot = {
  speechEndAt:number|null; transcriptAt:number|null; intentReadyAt:number|null; actionReadyAt:number|null; firstAudioAt:number|null;
  speechToTranscriptMs:number|null; speechToIntentMs:number|null; speechToActionMs:number|null; speechToFirstAudioMs:number|null;
};

const EMPTY:VoiceLatencySnapshot={speechEndAt:null,transcriptAt:null,intentReadyAt:null,actionReadyAt:null,firstAudioAt:null,speechToTranscriptMs:null,speechToIntentMs:null,speechToActionMs:null,speechToFirstAudioMs:null};

export class VoiceLatencyTelemetry{
  private snapshot:VoiceLatencySnapshot={...EMPTY};
  reset(){this.snapshot={...EMPTY};}
  getSnapshot(){return {...this.snapshot};}
  observeRealtimeEvent(event:RealtimeEvent){
    const type=event.type;
    if(type==="input_audio_buffer.speech_started"){this.reset();return;}
    if(type==="input_audio_buffer.speech_stopped"){this.mark("speechEndAt");return;}
    if(type.includes("transcription")&&type.endsWith(".completed")){this.mark("transcriptAt");return;}
    if(type==="response.created"){this.mark("intentReadyAt");return;}
    if(type==="response.output_item.added"||type==="response.content_part.added"){this.mark("actionReadyAt");}
  }
  markFirstAudio(){this.mark("firstAudioAt");}
  private mark(key:"speechEndAt"|"transcriptAt"|"intentReadyAt"|"actionReadyAt"|"firstAudioAt"){
    if(this.snapshot[key]!==null)return;
    this.snapshot[key]=performance.now();
    const start=this.snapshot.speechEndAt;
    if(start===null)return;
    if(key==="transcriptAt")this.snapshot.speechToTranscriptMs=this.snapshot[key]!-start;
    if(key==="intentReadyAt")this.snapshot.speechToIntentMs=this.snapshot[key]!-start;
    if(key==="actionReadyAt")this.snapshot.speechToActionMs=this.snapshot[key]!-start;
    if(key==="firstAudioAt")this.snapshot.speechToFirstAudioMs=this.snapshot[key]!-start;
  }
}
