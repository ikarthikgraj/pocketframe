export const WORKFLOW_TABS = ["Story", "Voice", "Clips", "Final Cut"] as const;
export type WorkflowTab = (typeof WORKFLOW_TABS)[number];

export function nextWorkflowTab({ storyReady, voiceReady, shotsReady }: { storyReady: boolean; voiceReady: boolean; shotsReady: boolean }): WorkflowTab {
  if (!storyReady) return "Story";
  if (!voiceReady) return "Voice";
  if (!shotsReady) return "Clips";
  return "Final Cut";
}
