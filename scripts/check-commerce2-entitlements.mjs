import assert from "node:assert/strict";
function entitled({type,status,validUntil,now}){return status==="ACTIVE"&&(type==="PERPETUAL"||(type==="ANNUAL"&&validUntil>now))}
const now=new Date("2026-10-02T12:00:00Z");
assert.equal(entitled({type:"PERPETUAL",status:"ACTIVE",validUntil:null,now}),true);
assert.equal(entitled({type:"ANNUAL",status:"ACTIVE",validUntil:new Date("2027-10-02T12:00:00Z"),now}),true);
assert.equal(entitled({type:"ANNUAL",status:"ACTIVE",validUntil:new Date("2026-10-02T11:59:59Z"),now}),false);
assert.equal(entitled({type:"ANNUAL",status:"REVOKED",validUntil:new Date("2027-10-02T12:00:00Z"),now}),false);
console.log("PASS COMMERCE-2 entitlement expiry: perpetual + annual active/expired/revoked");
