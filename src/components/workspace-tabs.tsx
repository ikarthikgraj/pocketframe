"use client";

import { useState, type ReactNode } from "react";
import type { WorkflowTab } from "@/lib/workflow";
import { WorkspaceNavigationProvider } from "@/components/workspace-navigation";
import { WorkflowTabIcon } from "@/components/workflow-tab-icon";

export { WORKFLOW_TABS } from "@/lib/workflow";

type Stage = { name: WorkflowTab; ready: boolean; blockedMessage?: string; content: ReactNode };

export function WorkspaceTabs({ stages, initialTab, overview }: { stages: Stage[]; initialTab: WorkflowTab; overview?: ReactNode }) {
  const [activeTab, setActiveTab] = useState<WorkflowTab>(initialTab);
  const activeStage = stages.find((stage) => stage.name === activeTab) ?? stages[0];
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
              disabled={blocked}
              title={blocked ? stage.blockedMessage : undefined}
              onClick={() => setActiveTab(stage.name)}
            >
              {stage.name}
            </button>
          );
        })}
      </nav>
      {blockedStage?.blockedMessage && <p className="tab-hint">{blockedStage.blockedMessage}</p>}
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
