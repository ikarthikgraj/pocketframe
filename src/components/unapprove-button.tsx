"use client";

import { useState } from "react";
import { ConfirmationDialog } from "@/components/confirmation-dialog";

export function UnapproveButton({ onConfirm, disabled }: { onConfirm: () => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" className="unapprove-button" onClick={() => setOpen(true)} disabled={disabled}>Unapprove</button><ConfirmationDialog open={open} title="Unapprove this version?" message="This will lock Final Cut until every narration and shot is approved again." confirmLabel="Unapprove" danger onCancel={() => setOpen(false)} onConfirm={() => { setOpen(false); onConfirm(); }} /></>;
}
