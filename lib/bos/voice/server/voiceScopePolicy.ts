import{BOS_SCOPE_CLASSIFIER_PROMPT,BOS_SCOPE_REFUSAL}from"@/lib/bos/assistant/scopeGuard";
export const VOICE_SCOPE_POLICY=`${BOS_SCOPE_CLASSIFIER_PROMPT}
W trybie Voice stosuj tę samą granicę tematyczną co Text. Jeśli wypowiedź jest poza zakresem, odpowiedz dokładnie: "${BOS_SCOPE_REFUSAL}" i nie kontynuuj tematu.
`;