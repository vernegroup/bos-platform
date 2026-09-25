export type AudioPlaybackState = "idle" | "ready" | "playing" | "paused" | "blocked";

export type AudioPlaybackSnapshot = {
  state: AudioPlaybackState;
  currentTimeMs: number;
  durationMs: number | null;
  hasStream: boolean;
};

type PlaybackListener = (snapshot: AudioPlaybackSnapshot) => void;

const INITIAL: AudioPlaybackSnapshot = {
  state: "idle",
  currentTimeMs: 0,
  durationMs: null,
  hasStream: false,
};

export class AudioPlaybackController {
  private audio: HTMLAudioElement | null = null;
  private snapshot: AudioPlaybackSnapshot = { ...INITIAL };
  private listeners = new Set<PlaybackListener>();

  subscribe(listener: PlaybackListener) {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  attach(stream: MediaStream) {
    if (typeof Audio === "undefined") return;
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.autoplay = true;
      this.audio.addEventListener("playing", this.onPlaying);
      this.audio.addEventListener("pause", this.onPause);
      this.audio.addEventListener("timeupdate", this.onTimeUpdate);
    }
    this.audio.srcObject = stream;
    this.update({ ...this.snapshot, state: "ready", hasStream: true });
    void this.play();
  }

  async play() {
    if (!this.audio || !this.audio.srcObject) return;
    try {
      await this.audio.play();
    } catch {
      this.update({ ...this.snapshot, state: "blocked" });
    }
  }

  pause() {
    this.audio?.pause();
  }

  stop() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.srcObject = null;
    this.update({ ...INITIAL });
  }

  getCurrentTimeMs() {
    return this.audio && Number.isFinite(this.audio.currentTime) ? this.audio.currentTime * 1000 : 0;
  }

  destroy() {
    if (!this.audio) return;
    this.audio.pause();
    this.audio.srcObject = null;
    this.audio.removeEventListener("playing", this.onPlaying);
    this.audio.removeEventListener("pause", this.onPause);
    this.audio.removeEventListener("timeupdate", this.onTimeUpdate);
    this.audio = null;
    this.update({ ...INITIAL });
  }

  private onPlaying = () => this.update({ ...this.snapshot, state: "playing" });
  private onPause = () => {
    if (this.snapshot.hasStream) this.update({ ...this.snapshot, state: "paused" });
  };
  private onTimeUpdate = () => {
    if (!this.audio) return;
    const duration = Number.isFinite(this.audio.duration) ? this.audio.duration * 1000 : null;
    this.update({ ...this.snapshot, currentTimeMs: this.getCurrentTimeMs(), durationMs: duration });
  };
  private update(next: AudioPlaybackSnapshot) {
    this.snapshot = next;
    this.listeners.forEach((listener) => listener(next));
  }
}
