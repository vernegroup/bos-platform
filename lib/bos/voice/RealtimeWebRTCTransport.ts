export type RealtimeCredential = {
  clientSecret: string;
  model: string;
};

type RealtimeTransportOptions = {
  sessionEndpoint?: string;
  onRemoteStream?: (stream: MediaStream | null) => void;
  onDataChannel?: (channel: RTCDataChannel | null) => void;
};

export class RealtimeWebRTCTransport {
  private peer: RTCPeerConnection | null = null;
  private channel: RTCDataChannel | null = null;
  private microphone: MediaStream | null = null;
  private options: RealtimeTransportOptions;

  constructor(options: RealtimeTransportOptions = {}) {
    this.options = options;
  }

  async connect(stream: MediaStream) {
    this.disconnect();
    this.microphone = stream;

    const credential = await this.getCredential();
    const peer = new RTCPeerConnection();
    this.peer = peer;

    stream.getAudioTracks().forEach((track) => peer.addTrack(track, stream));

    peer.ontrack = (event) => {
      const remote = event.streams[0] ?? new MediaStream([event.track]);
      this.options.onRemoteStream?.(remote);
    };

    const channel = peer.createDataChannel("oai-events");
    this.channel = channel;
    this.options.onDataChannel?.(channel);

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    const response = await fetch(
      `https://api.openai.com/v1/realtime?model=${encodeURIComponent(credential.model)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credential.clientSecret}`,
          "Content-Type": "application/sdp",
        },
        body: offer.sdp,
      },
    );

    if (!response.ok) {
      const detail = await response.text();
      this.disconnect();
      throw new Error(`Realtime WebRTC handshake failed (${response.status}): ${detail.slice(0, 160)}`);
    }

    const answer = { type: "answer" as RTCSdpType, sdp: await response.text() };
    await peer.setRemoteDescription(answer);
  }

  disconnect() {
    this.channel?.close();
    this.channel = null;
    this.options.onDataChannel?.(null);

    if (this.peer) {
      this.peer.ontrack = null;
      this.peer.getSenders().forEach((sender) => sender.replaceTrack(null).catch(() => undefined));
      this.peer.close();
      this.peer = null;
    }

    this.microphone = null;
    this.options.onRemoteStream?.(null);
  }

  private async getCredential(): Promise<RealtimeCredential> {
    const response = await fetch(this.options.sessionEndpoint ?? "/api/voice/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Voice session endpoint failed (${response.status})`);
    }

    const data = (await response.json()) as {
      client_secret?: { value?: string };
      clientSecret?: string;
      model?: string;
    };

    const clientSecret = data.clientSecret ?? data.client_secret?.value;
    if (!clientSecret || !data.model) {
      throw new Error("Voice session endpoint returned incomplete realtime credentials");
    }

    return { clientSecret, model: data.model };
  }
}
