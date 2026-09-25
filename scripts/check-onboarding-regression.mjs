import fs from "node:fs";
const fail=m=>{console.error("FAIL",m);process.exitCode=1},pass=m=>console.log("PASS",m);
const read=p=>fs.readFileSync(new URL("../"+p,import.meta.url),"utf8");
const r=read("lib/bos/onboardingRepository.ts"),c=read("app/app/onboarding/closed/[closureId]/page.tsx"),p=read("app/app/onboarding/processes/[processId]/page.tsx");
const checks=[
["latest published version offered for new onboarding",/SELECT DISTINCT ON \(s\.id\)[\s\S]*sv\.status='PUBLISHED'[\s\S]*ORDER BY s\.id,sv\.version_number DESC/,r],
["process pins standard_version_id",/INSERT INTO onboarding_processes\([\s\S]*standard_version_id[\s\S]*\$\{input\.standardVersionId\}/,r],
["tasks bind to pinned version",/standard_tasks[\s\S]*standard_version_id=\$\{input\.standardVersionId\}/,r],
["start checks bind to pinned version",/standard_start_requirements[\s\S]*standard_version_id=\$\{input\.standardVersionId\}/,r],
["readiness checks bind to pinned version",/standard_readiness_criteria[\s\S]*standard_version_id=\$\{input\.standardVersionId\}/,r],
["ordered task progression retained",/WYJAŚNIJ → POKAŻ → RAZEM → SAM → SPRAWDŹ/,r],
["closure keeps version label",/standardVersion:r\.version_label/,r],
["closure resolves exact historical version",/versions\.find\(item=>item\.version===closure\.standardVersion\)/,c],
["reopen preserves closure history",/Wznowienie nie usuwa tej Karty Zakończenia/,c],
["process retains readiness controls",/readiness|kryteri|gotow/i,p]
];
for(const [n,re,s] of checks) re.test(s)?pass(n):fail(n);
if(process.exitCode) process.exit(process.exitCode);
console.log("Onboarding regression contract: PASS.");
