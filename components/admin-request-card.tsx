"use client";

// One open booking request in "Offene Anfragen". Display only: accepting and declining call the existing
// handlers of the admin page (the same status change and API call as in the details panel).
import { Phone } from "lucide-react";
import { agoLabel, dayLabel, dietaryLabel, guestsLabel, occasionLabel, telHref } from "../lib/admin-reservation-ui";

export type RequestCardItem = {
  id: string; date: string; time: string; guest_count: number; customer_name: string; customer_phone: string;
  occasion: string; dietary: string; notes: string; created_at: string;
};

type Props = {
  item: RequestCardItem;
  today: string;
  tableLabel: string;
  saving: boolean;
  declining: boolean;
  reason: string;
  error: string;
  onReasonChange: (value: string) => void;
  onAccept: () => void;
  onDecline: () => void;
  onCancelDecline: () => void;
  onConfirmDecline: () => void;
  onOpen: () => void;
};

export function AdminRequestCard({ item, today, tableLabel, saving, declining, reason, error, onReasonChange, onAccept, onDecline, onCancelDecline, onConfirmDecline, onOpen }: Props) {
  const occasion = occasionLabel(item.occasion), dietary = dietaryLabel(item.dietary), note = item.notes?.trim();
  const reasonId = `decline-reason-${item.id}`;
  return (
    <article className="overflow-hidden rounded-2xl border border-[#10261e]/10 bg-white shadow-sm">
      <div className="grid gap-4 p-4 sm:grid-cols-[104px_1fr] sm:p-5 lg:grid-cols-[104px_1fr_auto] lg:items-center">
        <div className="flex items-baseline gap-3 rounded-xl bg-[#10261e] px-4 py-3 text-[#f5e8d3] sm:flex-col sm:items-center sm:justify-center sm:gap-1 sm:text-center">
          <span className="text-sm font-semibold uppercase tracking-wide text-[#efc67e]">{dayLabel(item.date, today)}</span>
          <span className="font-display text-3xl leading-none">{item.time}</span>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={onOpen} className="min-h-11 truncate text-left text-xl font-semibold underline-offset-4 hover:underline">{item.customer_name}</button>
            {occasion && <span className="rounded-full bg-[#F3E6F0] px-3 py-1 text-xs font-semibold text-[#6E2C5E]">{occasion}</span>}
            {dietary && <span className="rounded-full bg-[#E3EFE7] px-3 py-1 text-xs font-semibold text-[#1F5235]">{dietary}</span>}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#10261e]/70">
            <strong className="text-[#10261e]">{guestsLabel(item.guest_count)} · {tableLabel}</strong>
            <a href={telHref(item.customer_phone)} className="inline-flex min-h-11 items-center gap-1.5 font-medium text-[#10261e] underline-offset-4 hover:underline"><Phone size={15} aria-hidden="true" />{item.customer_phone}</a>
            <span>Anfrage {agoLabel(item.created_at)}</span>
          </p>
          {note && <p className="mt-2 rounded-xl bg-[#f4f0e8] px-3 py-2 text-sm leading-6">„{note}“</p>}
        </div>

        <div className="flex flex-col gap-2 sm:col-span-2 sm:flex-row lg:col-span-1 lg:w-56 lg:flex-col">
          <button type="button" disabled={saving} onClick={onAccept} className="min-h-12 w-full rounded-xl bg-[#1F6B45] px-5 text-base font-semibold text-white hover:bg-[#185A39] disabled:opacity-50">Annehmen</button>
          <button type="button" disabled={saving} onClick={onDecline} aria-expanded={declining} aria-controls={reasonId} className="min-h-12 w-full rounded-xl border-2 border-[#A8322A] bg-white px-5 text-base font-semibold text-[#A8322A] hover:bg-[#FDF1EF] disabled:opacity-50">Ablehnen</button>
        </div>
      </div>

      {declining && (
        <div id={reasonId} className="border-t border-[#A8322A]/20 bg-[#FDF6F4] p-4 sm:p-5">
          <label className="grid gap-2 font-semibold">Grund für „Abgelehnt“
            <textarea autoFocus value={reason} onChange={(event) => onReasonChange(event.target.value)} maxLength={500} rows={2} className="rounded-xl border bg-white px-4 py-3 font-normal" />
          </label>
          <p className="mt-2 text-sm text-[#10261e]/65">Der Gast erhält dabei keine E-Mail. Bitte informieren Sie ihn telefonisch oder per E-Mail.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={onCancelDecline} className="min-h-12 rounded-xl border px-5 text-sm font-semibold">Abbrechen</button>
            <button type="button" disabled={!reason.trim() || saving} onClick={onConfirmDecline} className="min-h-12 rounded-xl bg-[#A8322A] px-5 text-sm font-semibold text-white disabled:opacity-50">Ablehnen bestätigen</button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700">{error}</p>}
    </article>
  );
}
