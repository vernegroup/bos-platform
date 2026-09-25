import "server-only";
import { createVoiceLabToolPolicy, assertNoVoiceDatabaseTools } from "./voiceToolPolicy";
import { VOICE_SCOPE_POLICY } from "./voiceScopePolicy";

export type EphemeralVoiceCredential = {
  clientSecret: string;
  model: string;
  expiresAt: number | null;
};

type OpenAIClientSecretResponse = {
  value?: string;
  expires_at?: number;
  client_secret?: { value?: string; expires_at?: number };
  error?: { message?: string };
};

export class VoiceCredentialError extends Error {
  constructor(
    message: string,
    readonly upstreamStatus: number,
  ) {
    super(message);
    this.name = "VoiceCredentialError";
  }
}

export async function createEphemeralVoiceCredential(
  apiKey: string,
  model: string,
  instructions: string,
): Promise<EphemeralVoiceCredential> {
  const toolPolicy=createVoiceLabToolPolicy();
  assertNoVoiceDatabaseTools(toolPolicy.tools);
  const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      session: {
        type: "realtime",
        model,
        modalities: ["audio", "text"],
        instructions: `${instructions}\n\n${VOICE_SCOPE_POLICY}`,
        ...toolPolicy,
      },
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as OpenAIClientSecretResponse;
  const clientSecret = data.value ?? data.client_secret?.value;
  const expiresAt = data.expires_at ?? data.client_secret?.expires_at ?? null;

  if (!response.ok || !clientSecret) {
    throw new VoiceCredentialError(
      data.error?.message ?? "OpenAI did not return an ephemeral realtime credential",
      response.status,
    );
  }

  return { clientSecret, model, expiresAt };
}
