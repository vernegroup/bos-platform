"use client";

export default function PrintOutcomeButton(){
  return <button type="button" className="bos-outcome-print" onClick={()=>window.print()}>POBIERZ / ZAPISZ PDF</button>;
}
