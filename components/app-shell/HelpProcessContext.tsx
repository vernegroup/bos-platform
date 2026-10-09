"use client";

import { useEffect } from "react";
import type { HelpContext } from "@/lib/bos/helpContext";

export const HELP_CONTEXT_EVENT = "bos:help-context";
export const HELP_CONTEXT_REQUEST = "bos:help-context-request";

/** Product pages publish only allowlisted status codes; never employee or process data. */
export default function HelpProcessContext({ context }: { context: HelpContext }) {
  useEffect(() => {
    const publish = () => window.dispatchEvent(new CustomEvent<HelpContext>(HELP_CONTEXT_EVENT, { detail: context }));
    window.addEventListener(HELP_CONTEXT_REQUEST, publish);
    publish();
    return () => window.removeEventListener(HELP_CONTEXT_REQUEST, publish);
  }, [context.product, context.screen, context.stage, context.state]);
  return null;
}
