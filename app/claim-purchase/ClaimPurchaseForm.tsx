"use client";
import { useActionState } from "react";
import { claimPurchaseAction,type ClaimState } from "./actions";
const initial:ClaimState={status:"idle"};
export default function ClaimPurchaseForm({token}:{token:string}){const [state,action,pending]=useActionState(claimPurchaseAction,initial);if(state.status==="success")return <div className="bos-login-status is-success"><p>{state.message}</p><a href="/login">Przejdź do logowania →</a></div>;return <form action={action} className="bos-login-form"><input type="hidden" name="token" value={token}/><label>Hasło<input name="password" type="password" minLength={12} required autoComplete="new-password"/></label><label>Powtórz hasło<input name="passwordConfirm" type="password" minLength={12} required autoComplete="new-password"/></label>{state.message&&<p role="alert">{state.message}</p>}<button className="bos-login-submit" disabled={pending}>{pending?"AKTYWUJĘ…":"AKTYWUJ DOSTĘP"} <span>→</span></button></form>}
