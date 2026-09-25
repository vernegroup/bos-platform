export type VoiceUserRole = string | null;

export type VoiceUserContext = {
  authenticated: boolean;
  userRole: VoiceUserRole;
};

export function createVoiceUserContext(authenticated: boolean, role?: string | null): VoiceUserContext {
  return {
    authenticated,
    userRole: authenticated && role?.trim() ? role.trim().toLowerCase() : null,
  };
}
