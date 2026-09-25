import { strict as assert } from "node:assert";
import type { AnalyticsEventV1 } from "../contracts/event-v1";
import { normalizeAnalyticsEvents } from "../normalization/data-normalizer";
import { buildSessions } from "../session/session-engine";
import { buildTrafficSummary } from "../traffic/traffic-engine";
import { buildInteractionSummary } from "../interaction/interaction-engine";
import { buildAiFeedbackSummary } from "../ai/ai-feedback-engine";
import { buildTechnicalSummary } from "../technical/technical-engine";
import { buildTimeAggregation } from "../time/time-aggregator";
import { buildAnalyticsLayers } from "../layers/layer-engine";

const base = { schema_version: "1.0", domain: "example.test", app_id: "synthetic-app", environment: "preview" } as const;
const e = (event_id: string, timestamp: string, event: AnalyticsEventV1["event"], path: string, data: Record<string, unknown> = {}, session_id = "s1", source: AnalyticsEventV1["source"] = "browser"): AnalyticsEventV1 => ({ ...base, event_id, timestamp, event, path, data, session_id, source });

const events: AnalyticsEventV1[] = [
  e("01","2026-09-25T10:00:00.000Z","session_start","/a"),
  e("02","2026-09-25T10:00:01.000Z","page_view","/a"),
  e("03","2026-09-25T10:00:05.000Z","click","/a",{ coordinates:{viewport_x:100,viewport_y:100,document_x:200,document_y:300,normalized_x:0.25,normalized_y:0.5}, viewport:{width:1200,height:800}, document:{width:1200,height:1600}, element:{id:"cta",type:"button"} }),
  e("04","2026-09-25T10:00:10.000Z","scroll","/a",{ depth:0.5 }),
  e("05","2026-09-25T10:00:20.000Z","navigation","/b",{ from:"/a",to:"/b" }),
  e("06","2026-09-25T10:00:21.000Z","page_view","/b"),
  e("07","2026-09-25T10:00:30.000Z","user_feedback","/b",{ intent:"confusion",reason:"unclear",result:"unresolved",topic:"navigation" },"s1","ai"),
  e("08","2026-09-25T10:00:40.000Z","frontend_error","/b",{ error_type:"TypeError",fingerprint:"deadbeef" },"s1","system"),
  e("09","2026-09-25T10:00:41.000Z","http_status","/b",{ status:500,method:"GET",route:"/api/example" },"s1","system"),
  e("10","2026-09-25T10:00:42.000Z","latency","/b",{ duration_ms:240,operation:"example" },"s1","system"),
  e("11","2026-09-25T10:01:00.000Z","session_end","/b"),
];

const normalized = normalizeAnalyticsEvents(events, new Date("2026-09-25T10:02:00.000Z"));
assert.equal(normalized.report.input, 11); assert.equal(normalized.report.output, 11);
const clean = normalized.events.map(({event}) => event);
const sessions = buildSessions(clean);
assert.equal(sessions.length,1); assert.equal(sessions[0].duration_ms,60000); assert.equal(sessions[0].page_view_count,2); assert.equal(sessions[0].entry_path,"/a"); assert.equal(sessions[0].exit_path,"/b");
const traffic = buildTrafficSummary(clean,sessions);
assert.equal(traffic.sessions,1); assert.equal(traffic.page_views,2); assert.equal(traffic.transitions.length,1); assert.equal(traffic.transitions[0].from,"/a"); assert.equal(traffic.transitions[0].to,"/b");
const interaction = buildInteractionSummary(clean);
assert.equal(interaction.clicks,1); assert.equal(interaction.scroll_events,1);
const pathA = interaction.paths.find((x)=>x.path==="/a")!; assert.equal(pathA.average_scroll_depth,0.5); assert.equal(pathA.max_scroll_depth,0.5); assert.equal(pathA.spatial.length,1);
const ai = buildAiFeedbackSummary(clean); assert.equal(ai.feedback_events,1); assert.equal(ai.unresolved,1);
const technical = buildTechnicalSummary(clean); assert.equal(technical.frontend_errors,1); assert.equal(technical.http_status_events,1); assert.equal(technical.latency[0].average_ms,240);
const time = buildTimeAggregation(clean); assert.equal(time.minute.length,2); assert.equal(time.hour.length,1); assert.equal(time.day.length,1); assert.equal(time.week.length,1); assert.equal(time.month.length,1);
const layers = buildAnalyticsLayers(clean,sessions,["sessions","views","clicks","scroll","ai_feedback","errors","http_status","latency"]); assert.equal(layers.length,8);
console.log("AE-22 synthetic analytics test: PASS");
