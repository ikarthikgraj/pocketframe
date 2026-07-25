import type { ReactNode } from "react";

export function GuidanceTip({ children }: { children: ReactNode }) {
  return <aside className="guidance-tip"><span aria-hidden="true">💡</span><p>{children}</p></aside>;
}
