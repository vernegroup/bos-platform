"use client";

import type { MicrophoneState } from "./MicrophoneControl";

type VoiceStateIndicatorProps = { state: MicrophoneState };

const COPY: Record<MicrophoneState, { label: string; detail: string }> = {
  idle: { label: "Voice gotowy", detail: "Mikrofon jest wyłączony" },
  requesting: { label: "Łączenie z mikrofonem", detail: "Potwierdź dostęp w przeglądarce" },
  active: { label: "Mikrofon aktywny", detail: "Test wejścia audio — dźwięk nie jest wysyłany" },
  denied: { label: "Mikrofon zablokowany", detail: "Zmień uprawnienia witryny w przeglądarce" },
  unsupported: { label: "Voice niedostępny", detail: "Ta przeglądarka nie udostępnia mikrofonu" },
};

export default function VoiceStateIndicator({ state }: VoiceStateIndicatorProps) {
  const copy = COPY[state];

  return (
    <div className={`bos-voice-state bos-voice-state-${state}`} role="status" aria-live="polite">
      <span className="bos-voice-state-dot" aria-hidden="true" />
      <span className="bos-voice-state-copy">
        <strong>{copy.label}</strong>
        <span>{copy.detail}</span>
      </span>
      {state === "active" && (
        <span className="bos-voice-state-bars" aria-hidden="true">
          <i /><i /><i /><i />
        </span>
      )}
    </div>
  );
}
