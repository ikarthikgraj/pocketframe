import type { WorkflowTab } from "@/lib/workflow";

export function WorkflowTabIcon({ stage, state }: { stage: WorkflowTab; state: "complete" | "active" | "pending" | "blocked" }) {
  const symbols: Record<WorkflowTab, string> = { Story: "◆", Voice: "◖", Shots: "▣", "Final Cut": "▶" };
  return <span className={`workflow-tab-icon is-${state}`} aria-hidden="true">{symbols[stage]}</span>;
}
