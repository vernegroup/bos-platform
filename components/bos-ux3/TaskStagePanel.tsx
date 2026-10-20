"use client";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ActionPanel from "./ActionPanel";
import AuditDetails from "./AuditDetails";
import NextStep from "./NextStep";
import ProgressSequence, { type StageView } from "./ProgressSequence";
import SaveFeedback, { type SaveStatus } from "./SaveFeedback";
import { BOS_STAGE_COPY, BOS_STAGE_ORDER, type BOSStage } from "./operational-copy";
import "./bos-ux3.css";

export type StageConfirmationResult = { ok:boolean; error?:string; stage?:BOSStage; recordedAt?:string; author?:string; nonce?:number };
export type StageConfirmationAction = (previous:StageConfirmationResult, data:FormData)=>Promise<StageConfirmationResult>;
export type TaskStagePanelProps = {
  processId:string;
  taskId:string;
  taskName:string;
  startComplete:boolean;
  stages:readonly {stage:BOSStage;timestamp?:string;author?:string}[];
  action:StageConfirmationAction;
};

const auditDateFormatter = new Intl.DateTimeFormat("pl-PL", {dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Warsaw"});
function formatAuditDate(value:string):string {const date=new Date(value);return Number.isNaN(date.getTime())?value:auditDateFormatter.format(date)+" (Warszawa)";}

function StageSubmit({label,pending,disabled}:{label:string;pending:boolean;disabled:boolean}) {
  return <button type="submit" disabled={disabled||pending} aria-disabled={disabled||pending}>
    {pending?"Zapisywanie…":label}
  </button>;
}

export default function TaskStagePanel({processId,taskId,taskName,startComplete,stages,action}:TaskStagePanelProps) {
  const router=useRouter();
  const [result,formAction,pending]=useActionState(action,{ok:false});
  const [acknowledged,setAcknowledged]=useState<StageConfirmationResult|null>(null);
  const [refreshing,setRefreshing]=useState(false);
  const stageMap=new Map(stages.map(item=>[item.stage,item]));
  const completed=BOS_STAGE_ORDER.filter(stage=>Boolean(stageMap.get(stage)?.timestamp)).length;
  const current=BOS_STAGE_ORDER.find(stage=>!stageMap.get(stage)?.timestamp);
  const currentIndex=current?BOS_STAGE_ORDER.indexOf(current):-1;
  const canConfirm=Boolean(startComplete&&current&&
    (currentIndex===0||Boolean(stageMap.get(BOS_STAGE_ORDER[currentIndex-1])?.timestamp)));
  const views:StageView[]=BOS_STAGE_ORDER.map(stage=>{
    const data=stageMap.get(stage);
    const done=Boolean(data?.timestamp);
    return {stage,state:done?"done":!startComplete?"blocked":stage===current&&canConfirm?"current":"pending",author:data?.author,timestamp:data?.timestamp};
  });
  useEffect(()=>{
    if(result.nonce===undefined) return;
    setAcknowledged(result);
    if(result.ok) {
      setRefreshing(true);
      router.refresh();
    }
  },[result,router]);
  useEffect(()=>{
    if(!refreshing) return;
    if(acknowledged?.stage&&stageMap.get(acknowledged.stage)?.timestamp) setRefreshing(false);
  },[refreshing,acknowledged,stages]);
  const feedback:SaveStatus=pending?"saving":acknowledged?.ok?"saved":acknowledged?.error?"error":"idle";
  return <div className="bos-ux3-task-panel" aria-label={`Przebieg czynności: ${taskName}`}>
    <ProgressSequence stages={views}/>
    {current&&canConfirm&&<ActionPanel title={BOS_STAGE_COPY[current].title} description={BOS_STAGE_COPY[current].instruction}>
      <form action={formAction}>
        <input type="hidden" name="processId" value={processId}/>
        <input type="hidden" name="standardTaskId" value={taskId}/>
        <input type="hidden" name="stage" value={current}/>
        <StageSubmit label={BOS_STAGE_COPY[current].confirmation} pending={pending} disabled={refreshing}/>
      </form>
    </ActionPanel>}
    {!startComplete&&<NextStep description="Najpierw potwierdź wymagane warunki rozpoczęcia wdrożenia."/>}
    {!current&&<NextStep description="Udokumentowano wszystkie pięć etapów tej czynności. Przejdź do następnej czynności lub oceny gotowości."/>}
    {current&&startComplete&&!canConfirm&&<NextStep description="Zakończ poprzedni etap, aby przejść dalej."/>}
    <SaveFeedback status={feedback} message={pending?undefined:acknowledged?.error} author={acknowledged?.ok?acknowledged.author:undefined} timestamp={acknowledged?.ok?acknowledged.recordedAt:undefined}/>
    {refreshing&&<p role="status">Aktualizowanie postępu z serwera…</p>}
    <AuditDetails><ol>{stages.filter(x=>x.timestamp).map(x=><li key={x.stage}>{BOS_STAGE_COPY[x.stage].title} — {x.author||"Autor nieznany"} · <time dateTime={x.timestamp}>{formatAuditDate(x.timestamp)}</time></li>)}</ol></AuditDetails>
    <small>{completed} z 5 etapów udokumentowanych. Potwierdzenie zapisuje deklarację prowadzącego, nie automatyczną ocenę kompetencji.</small>
  </div>;
}
