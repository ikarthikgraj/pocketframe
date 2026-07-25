export function LockedFinalCutTab({ narrationApproved, shotsApproved, totalScenes }: { narrationApproved: number; shotsApproved: number; totalScenes: number }) {
  return <span className="locked-final-cut-copy"><strong>🔒 Final Cut is locked.</strong><small>Approve every narration and shot before opening Final Cut.</small><small>Narration approved: {narrationApproved} of {totalScenes} · Shots approved: {shotsApproved} of {totalScenes}</small></span>;
}
