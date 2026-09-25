import type { RealtimeEvent } from "./RealtimeEvents";

export type BargeInState = {
  responseId: string | null;
  itemId: string | null;
  outputIndex: number | null;
  contentIndex: number | null;
  assistantSpeaking: boolean;
  interruptedAt: number | null;
};

export const INITIAL_BARGE_IN_STATE: BargeInState = {
  responseId: null,
  itemId: null,
  outputIndex: null,
  contentIndex: null,
  assistantSpeaking: false,
  interruptedAt: null,
};

export function reduceAssistantPlayback(current: BargeInState, event: RealtimeEvent): BargeInState {
  if (event.type === "response.output_audio.delta" || event.type === "response.audio.delta") {
    return {
      ...current,
      responseId: typeof event.response_id === "string" ? event.response_id : current.responseId,
      itemId: typeof event.item_id === "string" ? event.item_id : current.itemId,
      outputIndex: typeof event.output_index === "number" ? event.output_index : current.outputIndex,
      contentIndex: typeof event.content_index === "number" ? event.content_index : current.contentIndex,
      assistantSpeaking: true,
    };
  }
  if (
    event.type === "response.output_audio.done" ||
    event.type === "response.audio.done" ||
    event.type === "response.done" ||
    event.type === "response.cancelled"
  ) {
    return { ...current, assistantSpeaking: false };
  }
  return current;
}

export function createCancelResponseEvent(): RealtimeEvent {
  return { type: "response.cancel" };
}

export function createTruncateItemEvent(state: BargeInState, audioEndMs: number): RealtimeEvent | null {
  if (!state.itemId) return null;
  return {
    type: "conversation.item.truncate",
    item_id: state.itemId,
    content_index: state.contentIndex ?? 0,
    audio_end_ms: Math.max(0, Math.round(audioEndMs)),
  };
}
