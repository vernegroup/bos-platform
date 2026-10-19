"use client";
import type { ReactNode } from "react";
import { BOS_OPERATION_MESSAGES } from "./operational-copy";
export type SaveStatus = "idle"|"saving"|"saved"|"error"|"unknown"|"conflict"|"blocked";
export type SaveFeedbackProps = {
  status: SaveStatus;
  message?: string;
  author?: string;
  timestamp?: string;
  id?: string;
  children?: ReactNode;
};
export default function SaveFeedback({status,message,author,timestamp,id,children}:SaveFeedbackProps) {
  if(status==="idle"&&!message&&!children) return null;
  const defaultText=status==="idle"?"":BOS_OPERATION_MESSAGES[status];
  return <div id={id} className={`bos-ux3-feedback bos-ux3-feedback--${status}`}
    role={status==="error"||status==="unknown"||status==="conflict"?"alert":"status"}
    aria-live={status==="error"||status==="unknown"||status==="conflict"?"assertive":"polite"}
    aria-atomic="true" data-state={status}>
    <span>{message??defaultText}</span>
    {status==="saved"&&(author||timestamp)&&<small>{[author,timestamp].filter(Boolean).join(" · ")}</small>}
    {children}
  </div>;
}
