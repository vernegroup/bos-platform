"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

type Props = { children: ReactNode; pendingLabel?: string; disabled?: boolean; className?: string };

export default function StandardSubmitButton({ children, pendingLabel="Zapisywanie…", disabled=false, className="bos-standard-primary-action" }: Props) {
  const { pending } = useFormStatus();
  return <>
    <button type="submit" className={className} disabled={disabled || pending} aria-disabled={disabled || pending}>{pending ? pendingLabel : children}</button>
    {pending && <span role="status" aria-live="polite" className="bos-ux3-standard-saving">Trwa zapis. Poczekaj na zakończenie operacji.</span>}
  </>;
}
