"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TextChat from "./TextChat";
import VoiceStateIndicator from "./VoiceStateIndicator";
import type { MicrophoneState } from "./MicrophoneControl";
import { VoiceSessionClient, type VoiceSessionSnapshot } from "../../lib/bos/voice/VoiceSessionClient";

type AssistantPanelProps = { onClose: () => void };

export default function AssistantPanel({ onClose }: AssistantPanelProps) {
  const [voiceState, setVoiceState] = useState<MicrophoneState>("idle");
  const clientRef = useRef<VoiceSessionClient | null>(null);
  const [session, setSession] = useState<VoiceSessionSnapshot | null>(null);

  if (!clientRef.current) clientRef.current = new VoiceSessionClient();

  useEffect(() => {
    const client = clientRef.current!;
    const unsubscribe = client.subscribe(setSession);
    client.start();
    return () => {
      unsubscribe();
      client.close();
    };
  }, []);

  const handleStreamChange = useCallback((stream: MediaStream | null) => {
    const client = clientRef.current;
    if (!client) return;
    if (stream) void client.attachMicrophone(stream);
    else client.detachMicrophone();
  }, []);

  return (
    <section className="bos-assistant-panel" id="bos-support-window" role="dialog" aria-modal="false" aria-labelledby="bos-assistant-title" data-voice-session={session?.status ?? "idle"}>
      <header className="bos-assistant-header">
        <div>
          <span className="bos-assistant-eyebrow">BOS ASSISTANT <span className="bos-assistant-ai-badge" aria-label="Asystent AI">AI</span></span>
          <h2 id="bos-assistant-title">Jak mogę pomóc?</h2>
        </div>
        <button className="bos-assistant-close" type="button" onClick={onClose} aria-label="Zamknij BOS Assistant">×</button>
      </header>
      <p className="bos-assistant-ai-disclosure" role="note">Rozmawiasz z systemem AI.</p>\n      <VoiceStateIndicator state={voiceState} />
      <TextChat onVoiceStateChange={setVoiceState} onMicrophoneStreamChange={handleStreamChange} />
    </section>
  );
}
