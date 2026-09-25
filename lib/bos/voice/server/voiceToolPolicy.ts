import "server-only";
import { voiceBosAccessPolicy } from "./voiceWritePolicy";

export const VOICE_DB_TOOLS_ENABLED=false as const;
const DB_TOOL_PATTERNS=[/\bsql\b/i,/\bdatabase\b/i,/\bpostgres\b/i,/\bneon\b/i,/\bquery\b/i,/\bexecute\b/i,/\binsert\b/i,/\bupdate\b/i,/\bdelete\b/i];
export function assertNoVoiceDatabaseTools(tools:unknown){if(tools==null)return;if(Array.isArray(tools)&&tools.length===0)return;const serialized=JSON.stringify(tools);if(DB_TOOL_PATTERNS.some(pattern=>pattern.test(serialized)))throw new Error("VOICE_DB_TOOL_FORBIDDEN");throw new Error("VOICE_TOOLS_NOT_ALLOWED_IN_LAB");}
export function createVoiceLabToolPolicy(){return {tools:[] as never[],tool_choice:"none" as const,bosAccess:voiceBosAccessPolicy()};}
