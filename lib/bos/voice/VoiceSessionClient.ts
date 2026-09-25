export type VoiceSessionStatus =
  | "idle"
  | "ready"
  | "microphone-active"
  | "closing"
  | "closed"
  | "error";

export type VoiceSessionSnapshot = {
  id: string | null;
  status: VoiceSessionStatus;
  startedAt: number | null;
  endedAt: number | null;
  hasMicrophone: boolean;
  error: string | null;
};

type VoiceSessionListener = (snapshot: VoiceSessionSnapshot) => void;

const INITIAL_SNAPSHOT: VoiceSessionSnapshot = {
  id: null,
  status: "idle",
  startedAt: null,
  endedAt: null,
  hasMicrophone: false,
  error: null,
};

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `voice-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Browser-side owner of a BOS Voice session lifecycle.
 * VOICE-RT-01 deliberately does not open a network connection yet.
 * WebRTC transport is added in VOICE-RT-02.
 */
export class VoiceSessionClient {
  private snapshot: VoiceSessionSnapshot = { ...INITIAL_SNAPSHOT };
  private listeners = new Set<VoiceSessionListener>();
  private microphoneStream: MediaStream | null = null;

  getSnapshot() {
    return this.snapshot;
  }

  subscribe(listener: VoiceSessionListener) {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  start() {
    if (this.snapshot.status !== "idle" && this.snapshot.status !== "closed") {
      return this.snapshot;
    }

    this.setSnapshot({
      id: createSessionId(),
      status: "ready",
      startedAt: Date.now(),
      endedAt: null,
      hasMicrophone: false,
      error: null,
    });
    return this.snapshot;
  }

  attachMicrophone(stream: MediaStream) {
    if (this.snapshot.status === "idle" || this.snapshot.status === "closed") {
      this.start();
    }

    this.microphoneStream = stream;
    this.setSnapshot({
      ...this.snapshot,
      status: "microphone-active",
      hasMicrophone: true,
      error: null,
    });
  }

  detachMicrophone() {
    this.microphoneStream = null;
    if (this.snapshot.status === "closed" || this.snapshot.status === "idle") return;

    this.setSnapshot({
      ...this.snapshot,
      status: "ready",
      hasMicrophone: false,
    });
  }

  fail(message: string) {
    this.setSnapshot({
      ...this.snapshot,
      status: "error",
      error: message,
    });
  }

  close() {
    if (this.snapshot.status === "closed" || this.snapshot.status === "idle") return;

    this.setSnapshot({ ...this.snapshot, status: "closing" });
    this.microphoneStream = null;
    this.setSnapshot({
      ...this.snapshot,
      status: "closed",
      endedAt: Date.now(),
      hasMicrophone: false,
    });
  }

  private setSnapshot(next: VoiceSessionSnapshot) {
    this.snapshot = next;
    this.listeners.forEach((listener) => listener(this.snapshot));
  }
}
