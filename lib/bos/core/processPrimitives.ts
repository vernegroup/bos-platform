import "server-only";

type PersistedTaskProgress = {
  standardTaskId?: string;
  status?: string;
  completedAt?: string | Date | null;
  note?: string | null;
  explainedAt?: string | Date | null;
  shownAt?: string | Date | null;
  togetherAt?: string | Date | null;
  soloAt?: string | Date | null;
  checkedAt?: string | Date | null;
  explainedBy?: string | null; shownBy?: string | null; togetherBy?: string | null; soloBy?: string | null; checkedBy?: string | null;
};

export function hasStandardTaskId(task: PersistedTaskProgress): task is PersistedTaskProgress & { standardTaskId: string } {
  return Boolean(task.standardTaskId);
}

export type ProcessTaskRecord = {
  standardTaskId: string;
  status: "GOTOWE"|"W TOKU"|"DO WYKONANIA";
  explainedAt?: string | Date;
  shownAt?: string | Date;
  togetherAt?: string | Date;
  soloAt?: string | Date;
  checkedAt?: string | Date;
  completedAt?: string;
  note?: string;
  explainedBy?: string; shownBy?: string; togetherBy?: string; soloBy?: string; checkedBy?: string;
};
export type ProcessStartCheckRecord = { requirementId:string; isSatisfied:boolean; checkedAt?:string|Date; note?:string };
export type ProcessReadinessCheckRecord = { criterionId:string; isPassed:boolean; checkedAt?:string|Date; checkedBy?:string; note?:string };
export type ProcessRecord = {
  id:string; employeeId?:string; employee:string; standardId:string; standardVersion:string; startedAt:string; targetDate:string; owner:string;
  status:"PLANOWANE"|"W TOKU"|"WSTRZYMANE";
  tasks:ProcessTaskRecord[];
  startChecks:ProcessStartCheckRecord[];
  readinessChecks:ProcessReadinessCheckRecord[];
};

export function getProcessProgress(process: ProcessRecord) {
  const completed=process.tasks.filter((t: { status: string })=>t.status==="GOTOWE").length;
  return {completed,total:process.tasks.length,percent:process.tasks.length?Math.round(completed/process.tasks.length*100):0};
}

export type OnboardingTaskStage = "EXPLAINED"|"SHOWN"|"TOGETHER"|"SOLO"|"CHECKED";

export const ONBOARDING_TASK_STAGE_ORDER: readonly OnboardingTaskStage[] = ["EXPLAINED","SHOWN","TOGETHER","SOLO","CHECKED"];
