import type { RealtimeEvent } from "./RealtimeEvents";

export type VadMode = "server_vad" | "semantic_vad";
export type VadState = "idle" | "listening" | "speech";

export type VadConfig = {
  mode?: VadMode;
  threshold?: number;
  prefixPaddingMs?: number;
  silenceDurationMs?: number;
  createResponse?: boolean;
  interruptResponse?: boolean;
};

export type VadSignal = {
  state: VadState;
  audioStartMs: number | null;
  audioEndMs: number | null;
};

export function createVadSessionUpdate(config: VadConfig = {}): RealtimeEvent {
  const mode = config.mode ?? "server_vad";
  const turnDetection =
    mode === "semantic_vad"
      ? {
          type: "semantic_vad",
          create_response: config.createResponse ?? true,
          interrupt_response: config.interruptResponse ?? true,
        }
      : {
          type: "server_vad",
          threshold: config.threshold ?? 0.5,
          prefix_padding_ms: config.prefixPaddingMs ?? 300,
          silence_duration_ms: config.silenceDurationMs ?? 500,
          create_response: config.createResponse ?? true,
          interrupt_response: config.interruptResponse ?? true,
        };

  return {
    type: "session.update",
    session: {
      audio: {
        input: {
          turn_detection: turnDetection,
        },
      },
    },
  };
}

export function reduceVadEvent(current: VadSignal, event: RealtimeEvent): VadSignal {
  if (event.type === "input_audio_buffer.speech_started") {
    return {
      state: "speech",
      audioStartMs: typeof event.audio_start_ms === "number" ? event.audio_start_ms : null,
      audioEndMs: null,
    };
  }

  if (event.type === "input_audio_buffer.speech_stopped") {
    return {
      state: "listening",
      audioStartMs: current.audioStartMs,
      audioEndMs: typeof event.audio_end_ms === "number" ? event.audio_end_ms : null,
    };
  }

  return current;
}
