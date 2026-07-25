"use client";

import { useEffect } from "react";

export function ConfirmationDialog({ open, title, message, confirmLabel, onCancel, onConfirm, danger = false, children }: { open: boolean; title: string; message: string; confirmLabel: string; onCancel: () => void; onConfirm: () => void; danger?: boolean; children?: React.ReactNode }) {
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") onCancel(); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [open, onCancel]);
  if (!open) return null;
  return <div className="dialog-backdrop" role="presentation" onMouseDown={onCancel}><section className="confirmation-dialog" role="dialog" aria-modal="true" aria-labelledby="confirmation-title" onMouseDown={(event) => event.stopPropagation()}><h2 id="confirmation-title">{title}</h2><p>{message}</p>{children}<div className="actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button type="button" className={danger ? "danger" : ""} onClick={onConfirm}>{confirmLabel}</button></div></section></div>;
}
