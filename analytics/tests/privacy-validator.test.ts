import { strict as assert } from "node:assert";
import { validateAnalyticsEvent } from "../contracts/validator";
import { containsForbiddenAnalyticsData } from "../privacy";

const base = {
  schema_version: "1.0", event_id: "evt_test24_09_valid", timestamp: "2026-09-27T12:00:00.000Z",
  source: "browser", domain: "standardybiznesu.pl", app_id: "bos-platform",
  environment: "preview", path: "/", event: "page_view", data: {}
};

assert.equal(validateAnalyticsEvent(base).valid, true, "valid contract must pass");
assert.equal(validateAnalyticsEvent({...base,event_id:"evt_test24_09_bad_schema",schema_version:"9.9"}).valid, false, "bad schema must fail");
assert.equal(validateAnalyticsEvent({...base,event_id:"evt_test24_09_bad_env",environment:"invalid"}).valid, false, "bad environment must fail");
assert.equal(validateAnalyticsEvent({...base,event_id:"evt_test24_09_bad_scroll",event:"scroll",data:{depth:2}}).valid, false, "invalid scroll must fail");

assert.equal(containsForbiddenAnalyticsData({...base,event_id:"evt_test24_09_email",data:{email:"test@example.com"}}), true, "email key/value must be rejected");
assert.equal(containsForbiddenAnalyticsData({...base,event_id:"evt_test24_09_token",data:{access_token:"abcdefghijklmnopqrstuvwxyz1234567890"}}), true, "token must be rejected");
assert.equal(containsForbiddenAnalyticsData({...base,event_id:"evt_test24_09_prompt",data:{prompt:"secret prompt"}}), true, "AI prompt must be rejected");
assert.equal(containsForbiddenAnalyticsData({...base,event_id:"evt_test24_09_pesel",data:{topic:"44051401458"}}), true, "PESEL-like value must be rejected");
assert.equal(containsForbiddenAnalyticsData(base), false, "valid analytics event must not trigger privacy rejection");

console.log("TEST-24-09 Privacy/Validator: PASS");
