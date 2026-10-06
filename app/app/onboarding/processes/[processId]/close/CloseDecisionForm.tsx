"use client";

import { useActionState } from "react";

export type CloseDecisionState={
  formalitiesError?:boolean;
  summary?:string;
  recommendations?:string;
};

type Props={
  action:(state:CloseDecisionState,formData:FormData)=>Promise<CloseDecisionState>;
  processId:string;
  ready:boolean;
};

const initialState:CloseDecisionState={};

export default function CloseDecisionForm({action,processId,ready}:Props){
  const [state,formAction,pending]=useActionState(action,initialState);
  return <form action={formAction} className="bos-close-decision-form">
    <input type="hidden" name="processId" value={processId}/>
    <aside className="bos-guidance bos-guidance-formalities"><div><span className="bos-guidance-eyebrow">PRZED ZAPISEM DECYZJI</span><strong>Formalności pozostają poza BOS</strong><p>Potwierdź tylko, że wymagane szkolenia BHP, badania, uprawnienia, instruktaże lub inne obowiązki zostały zweryfikowane w odpowiednim systemie albo dokumentacji.</p></div><details><summary>? Dlaczego osobne potwierdzenie</summary><p>BOS dokumentuje gotowość operacyjną według Standardu. Nie zastępuje prawnych ani branżowych procedur dopuszczenia do pracy.</p></details></aside>
    <label id="formalities"><span>POTWIERDZENIE FORMALNOŚCI</span><span><input type="checkbox" name="formalitiesConfirmed"/> Potwierdzam, że wymagane formalności dotyczące dopuszczenia do pracy zostały zweryfikowane poza BOS.</span><small>Wymagane wyłącznie dla decyzji GOTOWY.</small></label>
    {state.formalitiesError&&<div className="bos-publish-error" role="alert"><strong>Potwierdź formalności przed decyzją GOTOWY</strong><p>Zaznacz potwierdzenie powyżej. Wpisane podsumowanie i dalsze działania zostały zachowane bez umieszczania ich w adresie strony.</p></div>}
    <label className="bos-close-guided-field"><span>PODSUMOWANIE FAKTÓW</span><small>Zapisz obserwowalne fakty będące podstawą decyzji. Nie opisuj cech osoby.</small><textarea name="summary" required maxLength={1200} defaultValue={state.summary??""} placeholder="Np. Wszystkie czynności wykonane i sprawdzone; 2/2 K zaliczone; kryterium kompletacji bez braków potwierdzone w realnej pracy."/></label>
    <label className="bos-close-guided-field"><span>POWÓD / DALSZE DZIAŁANIE</span><small>Wymagane znaczeniowo dla JESZCZE NIE i STOP; przy GOTOWY możesz zapisać dalsze zalecenia operacyjne.</small><textarea name="recommendations" maxLength={1200} defaultValue={state.recommendations??""} placeholder="Np. Powtórzyć czynność 04 na kolejnej zmianie i ponownie sprawdzić rezultat."/></label>
    <div className="bos-close-decision-guide"><strong>Wybierz decyzję</strong><p>{ready?"Bramka Gotowości jest kompletna. GOTOWY jest dostępne, ale decyzję nadal podejmuje człowiek.":"Bramka Gotowości jest niepełna. GOTOWY pozostaje zablokowane; możesz wybrać JESZCZE NIE, aby zachować postęp i wrócić do pracy, albo STOP, aby zakończyć proces bez potwierdzenia gotowości."}</p></div>
    <div className="bos-close-decisions bos-guided-decisions"><button name="decision" value="READY" disabled={!ready||pending}><strong>GOTOWY</strong><span>{ready?"zakończ wdrożenie pozytywnie":"wymaga kompletnej Bramki Gotowości"}</span></button><button name="decision" value="NOT_YET" disabled={pending}><strong>JESZCZE NIE</strong><span>zachowaj postęp i wróć do pracy</span></button><button name="decision" value="STOP" disabled={pending}><strong>STOP</strong><span>zakończ bez potwierdzenia gotowości</span></button></div>
  </form>;
}
