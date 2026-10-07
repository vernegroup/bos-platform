"use client";

import { useActionState } from "react";
import { acceptInviteAction,type InviteState } from "./actions";

const initial:InviteState={status:"idle"};

export default function AcceptInviteForm({token}:{token:string}){
  const [state,action,pending]=useActionState(acceptInviteAction,initial);
  if(state.status==="success")return <div className="bos-login-status is-success"><p>{state.message}</p><a href="/login">Przejdź do logowania →</a></div>;
  return <form action={action} className="bos-login-form">
    <input type="hidden" name="token" value={token}/>
    <label>Hasło<input name="password" type="password" minLength={12} required autoComplete="new-password"/></label>
    <label>Powtórz hasło<input name="passwordConfirm" type="password" minLength={12} required autoComplete="new-password"/></label>
    {state.message&&<p role="alert">{state.message}</p>}
    <button className="bos-login-submit" disabled={pending}>{pending?"AKTYWUJĘ…":"DOŁĄCZ DO ORGANIZACJI"} <span>→</span></button>
  </form>;
}
