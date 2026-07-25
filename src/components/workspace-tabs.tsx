"use client";

import { useState, type ReactNode } from "react";
import type { WorkflowTab } from "@/lib/workflow";
import { WorkspaceNavigationProvider } from "@/components/workspace-navigation";
import { WorkflowTabIcon } from "@/components/workflow-tab-icon";
import { LockedFinalCutTab } from "@/components/locked-final-cut-tab";

export { WORKFLOW_TABS } from "@/lib/workflow";

type Stage = { name: WorkflowTab; ready: boolean; blockedMessage?: string; lockCounts?: { narrationApproved: number; shotsApproved: number; totalScenes: number }; content: ReactNode };

export function WorkspaceTabs({ stages, initialTab, overview }: { stages: Stage[]; initialTab: WorkflowTab; overview?: ReactNode }) {
  const [activeTab, setActiveTab] = useState<WorkflowTab>(initialTab);
  const [lockedNotice, setLockedNotice] = useState(false);
  const finalCut = stages.find((stage) => stage.name === "Final Cut");
  const finalCutFallback: WorkflowTab = finalCut?.lockCounts && finalCut.lockCounts.narrationApproved < finalCut.lockCounts.totalScenes ? "Voice" : "Shots";
  const effectiveTab = activeTab === "Final Cut" && finalCut && !finalCut.ready ? finalCutFallback : activeTab;
  const activeStage = stages.find((stage) => stage.name === effectiveTab) ?? stages[0];
  const blockedStage = stages.find((stage) => !stage.ready && stage.name !== "Story");

  return (
    <WorkspaceNavigationProvider value={setActiveTab}>
      {overview}
      <nav className="workspace-tabs" aria-label="Production workflow" role="tablist">
        {stages.map((stage) => {
          const selected = activeStage.name === stage.name;
          const blocked = !stage.ready && stage.name !== "Story";
          const state = selected ? "active" : blocked ? "blocked" : stage.ready ? "complete" : "pending";
          return (
            <button
              key={stage.name}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`panel-${stage.name}`}
              className={`workspace-tab ${selected ? "is-active" : ""} ${blocked ? "is-blocked" : ""}`}
              aria-disabled={blocked}
              title={blocked ? stage.blockedMessage : undefined}
              onClick={() => { if (blocked) { if (stage.name === "Final Cut") setLockedNotice(true); return; } setLockedNotice(false); setActiveTab(stage.name); }}
            >
              <WorkflowTabIcon stage={stage.name} state={state} />
              {stage.name}
            </button>
          );
        })}
      </nav>
      {lockedNotice && <div className="tab-hint"><LockedFinalCutTab narrationApproved={stages.find((stage) => stage.name === "Final Cut")?.lockCounts?.narrationApproved ?? 0} shotsApproved={stages.find((stage) => stage.name === "Final Cut")?.lockCounts?.shotsApproved ?? 0} totalScenes={stages.find((stage) => stage.name === "Final Cut")?.lockCounts?.totalScenes ?? 0} /></div>}
      {!lockedNotice && blockedStage?.blockedMessage && <p className="tab-hint">{blockedStage.blockedMessage}</p>}
      <section
        key={activeStage.name}
        id={`panel-${activeStage.name}`}
        role="tabpanel"
        aria-label={activeStage.name}
        className="workspace-stage tab-fade-in"
      >
        {activeStage.content}
      </section>
    </WorkspaceNavigationProvider>
  );
}
