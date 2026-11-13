"use client";
// In-page confirmation dialog for the admin (instead of window.confirm). Keyboard: Tab moves, Esc cancels.
import { AlertDialog } from "radix-ui";

type Props = {
  open: boolean;
  title: string;
  children?: React.ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function AdminConfirmDialog({ open, title, children, confirmLabel, cancelLabel = "Abbrechen", danger, busy, confirmDisabled, onConfirm, onCancel }: Props) {
  return (
    <AlertDialog.Root open={open} onOpenChange={(value) => { if (!value && !busy) onCancel(); }}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/40" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-[60] max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[1.5rem] bg-white p-6 text-[#10261e] shadow-2xl">
          <AlertDialog.Title className="font-display text-2xl leading-tight">{title}</AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="mt-3 text-sm leading-6 text-[#10261e]/70">{children}</div>
          </AlertDialog.Description>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <AlertDialog.Cancel disabled={busy} className="min-h-11 rounded-full border border-[#10261e]/20 px-5 text-sm font-semibold hover:bg-[#f4f0e8] disabled:opacity-50">{cancelLabel}</AlertDialog.Cancel>
            <button
              type="button"
              disabled={busy || confirmDisabled}
              onClick={onConfirm}
              className={`min-h-11 rounded-full px-5 text-sm font-semibold text-white disabled:opacity-60 ${danger ? "bg-[#a52520] hover:bg-[#bf3029]" : "bg-[#10261e] hover:bg-[#1c3a2f]"}`}
            >
              {busy ? "Bitte warten…" : confirmLabel}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
