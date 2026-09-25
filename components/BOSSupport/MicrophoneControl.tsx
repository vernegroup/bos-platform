"use client";

import { useEffect, useRef, useState } from "react";

export type MicrophoneState = "idle" | "requesting" | "active" | "denied" | "unsupported";

type MicrophoneControlProps = {
  onStateChange?: (state: MicrophoneState) => void;
  onStreamChange?: (stream: MediaStream | null) => void;
};

export default function MicrophoneControl({ onStateChange, onStreamChange }: MicrophoneControlProps) {
  const [state, setState] = useState<MicrophoneState>("idle");
  const streamRef = useRef<MediaStream | null>(null);

  function updateState(next: MicrophoneState) {
    setState(next);
    onStateChange?.(next);
  }

  function stopMicrophone() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    onStreamChange?.(null);
    updateState("idle");
  }

  async function toggleMicrophone() {
    if (state === "active") {
      stopMicrophone();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      updateState("unsupported");
      return;
    }

    updateState("requesting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      streamRef.current = stream;
      onStreamChange?.(stream);
      updateState("active");
    } catch (error) {
      const denied =
        error instanceof DOMException &&
        (error.name === "NotAllowedError" || error.name === "SecurityError");
      onStreamChange?.(null);
      updateState(denied ? "denied" : "idle");
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      onStreamChange?.(null);
    };
  }, [onStreamChange]);

  const label =
    state === "active"
      ? "Wyłącz mikrofon"
      : state === "requesting"
        ? "Oczekiwanie na dostęp do mikrofonu"
        : "Włącz mikrofon";

  return (
    <div className="bos-microphone-control">
      <button
        className={`bos-microphone-button bos-microphone-button-${state}`}
        type="button"
        onClick={toggleMicrophone}
        disabled={state === "requesting"}
        aria-label={label}
        aria-pressed={state === "active"}
        title={label}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 14.5a4 4 0 0 0 4-4V6a4 4 0 1 0-8 0v4.5a4 4 0 0 0 4 4Zm-2-8.5a2 2 0 1 1 4 0v4.5a2 2 0 1 1-4 0V6Zm8 4a1 1 0 0 1 2 0v.5a8 8 0 0 1-7 7.94V21h3a1 1 0 1 1 0 2H8a1 1 0 1 1 0-2h3v-2.56A8 8 0 0 1 4 10.5V10a1 1 0 1 1 2 0v.5a6 6 0 0 0 12 0V10Z" />
        </svg>
        {state === "active" && <span className="bos-microphone-live-dot" aria-hidden="true" />}
      </button>
      {(state === "denied" || state === "unsupported") && (
        <span className="bos-microphone-error" role="status">
          {state === "denied" ? "Brak dostępu do mikrofonu." : "Mikrofon nie jest obsługiwany w tej przeglądarce."}
        </span>
      )}
    </div>
  );
}
