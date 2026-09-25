import type { AnalyticsEnvironment, AnalyticsEventName, AnalyticsEventV1 } from "../contracts/event-v1";

export interface BrowserCollectorContext {
  domain: string;
  appId: string;
  environment: AnalyticsEnvironment;
  path: () => string;
}

const SESSION_KEY = "bos_analytics_session_v1";

function id(prefix: "evt" | "ses"): string {
  return prefix + "_" + crypto.randomUUID();
}

function getSessionId(): string {
  const existing = sessionStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const next = id("ses");
  sessionStorage.setItem(SESSION_KEY, next);
  return next;
}

export class BrowserCollector {
  private buffer: AnalyticsEventV1[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly context: BrowserCollectorContext) {}

  emit(event: AnalyticsEventName, data: Record<string, unknown> = {}): void {
    this.buffer.push({
      schema_version: "1.0",
      event_id: id("evt"),
      timestamp: new Date().toISOString(),
      source: "browser",
      domain: this.context.domain,
      app_id: this.context.appId,
      environment: this.context.environment,
      path: this.context.path(),
      session_id: getSessionId(),
      event,
      data,
    });

    if (this.buffer.length >= 20) void this.flush();
    else if (!this.timer) this.timer = setTimeout(() => void this.flush(), 2000);
  }

  pageView(): void { this.emit("page_view"); }
  navigation(from: string, to: string): void { this.emit("navigation", { from, to }); }
  scroll(depth: number): void { this.emit("scroll", { depth: Math.max(0, Math.min(1, depth)) }); }

  click(mouseEvent: MouseEvent): void {
    const target = mouseEvent.target instanceof Element ? mouseEvent.target : null;
    const documentElement = document.documentElement;
    const documentWidth = Math.max(documentElement.scrollWidth, documentElement.clientWidth);
    const documentHeight = Math.max(documentElement.scrollHeight, documentElement.clientHeight);
    const documentX = mouseEvent.clientX + window.scrollX;
    const documentY = mouseEvent.clientY + window.scrollY;

    this.emit("click", {
      coordinates: {
        viewport_x: mouseEvent.clientX,
        viewport_y: mouseEvent.clientY,
        document_x: documentX,
        document_y: documentY,
        normalized_x: documentWidth ? documentX / documentWidth : 0,
        normalized_y: documentHeight ? documentY / documentHeight : 0,
      },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      document: { width: documentWidth, height: documentHeight },
      element: {
        id: target?.getAttribute("data-analytics-id") || undefined,
        type: target?.tagName.toLowerCase() || "unknown",
      },
    });
  }

  async flush(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    if (!this.buffer.length) return;
    const batch = this.buffer.splice(0, this.buffer.length);
    try {
      const response = await fetch("/api/analytics/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(batch),
        keepalive: true,
      });
      if (!response.ok) throw new Error("Analytics collector rejected batch.");
    } catch {
      this.buffer.unshift(...batch);
    }
  }
}
