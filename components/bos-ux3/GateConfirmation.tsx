"use client";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SaveFeedback from "./SaveFeedback";
import type { SaveStatus } from "./SaveFeedback";
import "./bos-ux3.css";

export type GateResult = {ok:boolean;error?:string;nonce?:number};
export type GateAction = (previous:GateResult,data:FormData)=>Promise<GateResult>;
type Props = {
  kind:"start"|"readiness";
  processId:string;
  itemId:string;
  label:string;
  done:boolean;
  disabled:boolean;
  blockedReason?:string;
  note?:boolean;
  action:GateAction;
};
export default function GateConfirmation({kind,processId,itemId,label,done,disabled,blockedReason,note,action}:Props){
  const router=useRouter();
  const [result,formAction,pending]=useActionState(action,{ok:false});
  useEffect(()=>{if(result.nonce!==undefined&&result.ok)router.refresh()},[result,router]);
  const status:SaveStatus=pending?"saving":result.nonce===undefined?"idle":result.ok?"saved":"error";
  return <div className="bos-ux3-gate">
    {done?<strong className="bos-ux3-gate__done">✓ {kind==="start"?"Warunek potwierdzony":"Ocena zapisana"}</strong>:
      <form action={formAction}>
        <input type="hidden" name="processId" value={processId}/>
        <input type="hidden" name={kind==="start"?"requirementId":"criterionId"} value={itemId}/>
        {note&&<label className="bos-ux3-gate__note">Fakt z oceny (opcjonalnie)<input name="note" maxLength={500} placeholder="Zapisz zaobserwowany fakt"/></label>}
        <button type="submit" disabled={disabled||pending}>{pending?"Zapisywanie…":label}</button>
      </form>}
    {!done&&disabled&&blockedReason&&<small className="bos-ux3-gate__blocked">{blockedReason}</small>}
    {!done&&<SaveFeedback status={status} message={result.ok?undefined:result.error}/>}
  </div>;
}
