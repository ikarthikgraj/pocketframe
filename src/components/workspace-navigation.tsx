"use client";

import { createContext, useContext } from "react";
import type { WorkflowTab } from "@/lib/workflow";

const WorkspaceNavigationContext = createContext<((tab: WorkflowTab) => void) | null>(null);

export const WorkspaceNavigationProvider = WorkspaceNavigationContext.Provider;
export function useWorkspaceNavigation() { return useContext(WorkspaceNavigationContext); }
