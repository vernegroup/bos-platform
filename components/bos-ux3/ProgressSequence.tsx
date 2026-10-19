import { BOS_STAGE_COPY, BOS_STAGE_ORDER, type BOSStage } from "./operational-copy";
export type StageState = "done"|"current"|"pending"|"blocked";
export type StageView = {stage:BOSStage;state:StageState;author?:string;timestamp?:string};
export default function ProgressSequence({stages,compact=false}:{stages:readonly StageView[];compact?:boolean}) {
  const byStage=new Map(stages.map(item=>[item.stage,item]));
  return <ol className={`bos-ux3-sequence${compact?" bos-ux3-sequence--compact":""}`} aria-label="Przebieg nauki czynności">
    {BOS_STAGE_ORDER.map((stage,index)=>{
      const item=byStage.get(stage);
      const state=item?.state??"pending";
      return <li key={stage} className={`bos-ux3-sequence__item bos-ux3-sequence__item--${state}`} aria-current={state==="current"?"step":undefined}>
        <span className="bos-ux3-sequence__index" aria-hidden="true">{state==="done"?"✓":index+1}</span>
        <span><strong>{BOS_STAGE_COPY[stage].title}</strong><small>{state==="done"?"Zapisano potwierdzenie":state==="current"?"Aktualny etap":state==="blocked"?"Zablokowane":"Oczekuje"}</small>
        {state==="done"&&(item?.author||item?.timestamp)&&<small>{[item.author,item.timestamp].filter(Boolean).join(" · ")}</small>}</span>
      </li>;
    })}
  </ol>;
}
