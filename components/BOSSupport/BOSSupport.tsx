"use client";

import { useState } from "react";
import "./BOSSupport.css";
import AssistantPanel from "./AssistantPanel";
import BOSSupportButton from "./BOSSupportButton";

export default function BOSSupport() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && <AssistantPanel onClose={() => setOpen(false)} />}
      <div className="bos-support-widget">
        <BOSSupportButton open={open} onToggle={() => setOpen((value) => !value)} />
      </div>
    </>
  );
}
