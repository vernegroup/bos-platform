import { RealtimeWebRTCTransport } from "./RealtimeWebRTCTransport";
import type { RealtimeEvent, RealtimeEventEnvelope } from "./RealtimeEvents";

export type VoiceSessionStatus = "idle" | "ready" | "connecting" | "connected" | "microphone-active" | "closing" | "closed" | "error";

export type VoiceSessionSnapshot = {
  id: string | null;
  status: VoiceSessionStatus;
  startedAt: number | null;
  endedAt: number | null;
  hasMicrophone: boolean;
  isRealtimeConnected: boolean;
  lastEventType: string | null;
  error: string | null;
};

type VoiceSessionListener = (snapshot: VoiceSessionSnapshot) => void;
type RealtimeEventListener = (envelope: RealtimeEventEnvelope) => void;

const INITIAL_SNAPSHOT: VoiceSessionSnapshot = {
  id: null, status: "idle", startedAt: null, endedAt: null, hasMicrophone: false,
  isRealtimeConnected: false, lastEventType: null, error: null,
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
  private transport = new RealtimeWebRTCTransport({
    onRemoteStream: (stream) => this.handleRemoteStream(stream),
    onEvent: (envelope) => this.handleRealtimeEvent(envelope),
  });

  getSnapshot() { return this.snapshot; }

  subscribe(listener: VoiceSessionListener) {
    this.listeners.add(listener); listener(this.snapshot); return () => this.listeners.delete(listener);
  }

  subscribeToEvents(listener: RealtimeEventListener) {
    this.eventListeners.add(listener); return () => this.eventListeners.delete(listener);
  }

  sendRealtimeEvent(event: RealtimeEvent) { this.transport.sendEvent(event); }

  start() {
    if (this.snapshot.status !== "idle" && this.snapshot.status !== "closed") return this.snapshot;
    this.setSnapshot({
      id: createSessionId(), status: "ready", startedAt: Date.now(), endedAt: null,
      hasMicrophone: false, isRealtimeConnected: false, lastEventType: null, error: null,
    });
    return this.snapshot;
  }

  async attachMicrophone(stream: MediaStream) {
    if (this.snapshot.status === "idle" || this.snapshot.status === "closed") this.start();
    this.microphoneStream = stream;
    this.setSnapshot({ ...this.snapshot, status: "connecting", hasMicrophone: true, error: null });
    try {
      await this.transport.connect(stream);
      if (this.microphoneStream !== stream) { this.transport.disconnect(); return; }
      this.setSnapshot({ ...this.snapshot, status: "connected", hasMicrophone: true, isRealtimeConnected: true });
    } catch (error) {
      this.setSnapshot({
        ...this.snapshot, status: "error", hasMicrophone: true, isRealtimeConnected: false,
        error: error instanceof Error ? error.message : "Nie udało się połączyć sesji Voice.",
      });
    }
  }

  detachMicrophone() {
    this.microphoneStream = null; this.transport.disconnect();
    if (this.snapshot.status === "closed" || this.snapshot.status === "idle") return;
    this.setSnapshot({ ...this.snapshot, status: "ready", hasMicrophone: false, isRealtimeConnected: false, error: null });
  }

  fail(message: string) { this.setSnapshot({ ...this.snapshot, status: "error", isRealtimeConnected: false, error: message }); }

  close() {
    if (this.snapshot.status === "closed" || this.snapshot.status === "idle") return;
    this.setSnapshot({ ...this.snapshot, status: "closing" });
    this.microphoneStream = null; this.transport.disconnect();
    if (this.remoteAudio) { this.remoteAudio.pause(); this.remoteAudio.srcObject = null; this.remoteAudio = null; }
    this.setSnapshot({ ...this.snapshot, status: "closed", endedAt: Date.now(), hasMicrophone: false, isRealtimeConnected: false });
  }

  private handleRealtimeEvent(envelope: RealtimeEventEnvelope) {
    const type = envelope.event.type;
    const error = type === "error" ? this.readRealtimeError(envelope.event) : this.snapshot.error;
    this.setSnapshot({ ...this.snapshot, lastEventType: type, error });
    this.eventListeners.forEach((listener) => listener(envelope));
  }

  private readRealtimeError(event: RealtimeEvent) {
    const error = event.error;
    if (error && typeof error === "object" && "message" in error && typeof error.message === "string") return error.message;
    return "Realtime API zwróciło błąd.";
  }

  private handleRemoteStream(stream: MediaStream | null) {
    if (!stream || typeof Audio === "undefined") { if (this.remoteAudio) this.remoteAudio.srcObject = null; return; }
    if (!this.remoteAudio) { this.remoteAudio = new Audio(); this.remoteAudio.autoplay = true; }
    this.remoteAudio.srcObject = stream;
    void this.remoteAudio.play().catch(() => undefined);
  }

  private setSnapshot(next: VoiceSessionSnapshot) {
    this.snapshot = next; this.listeners.forEach((listener) => listener(this.snapshot));
  }
}
