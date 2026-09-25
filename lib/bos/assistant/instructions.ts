import {BOS_ASSISTANT_SYSTEM_PROMPT}from"./systemPrompt";
import {pageContextInstruction,type BosPageContext}from"./pageContext";
import {userContextInstruction,type BosAssistantUserContext}from"./userContext";
import {BOS_HALLUCINATION_GUARD}from"./hallucinationGuard";
import {BOS_READ_ONLY_INSTRUCTION}from"./readOnlyBoundary";
export function buildBosAssistantInstructions(page:BosPageContext,user:BosAssistantUserContext,channel:"text"|"voice"){
 return [BOS_ASSISTANT_SYSTEM_PROMPT,BOS_HALLUCINATION_GUARD,BOS_READ_ONLY_INSTRUCTION,pageContextInstruction(page),userContextInstruction(user),`KANAŁ: ${channel}. Te same zasady, zakres obowiązków i ograniczenia obowiązują w Text i Voice.`].join("\n\n");
}