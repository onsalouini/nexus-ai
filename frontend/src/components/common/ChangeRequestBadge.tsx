import { useTranslation } from "react-i18next";
import type { ChangeRequestPriority, ChangeRequestStatus } from "../../services/clientApi";

const STATUS_CLS: Record<ChangeRequestStatus, string> = {
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  accepted: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
  in_progress: "border-violet-400/30 bg-violet-400/10 text-violet-200",
  done: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  rejected: "border-red-400/30 bg-red-500/10 text-red-200",
};

const PRIORITY_CLS: Record<ChangeRequestPriority, string> = {
  low: "text-slate-400",
  normal: "text-sky-300",
  high: "text-rose-300",
};

/* Statut et priorité d'une demande de changement (espace client et chef) */
export function ChangeStatusBadge({ status }: { status: ChangeRequestStatus }) {
  const { t } = useTranslation();
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_CLS[status]}`}>
      {t(`changes.status.${status}`)}
    </span>
  );
}

export function ChangePriority({ priority }: { priority: ChangeRequestPriority }) {
  const { t } = useTranslation();
  return <span className={`text-[11px] font-medium ${PRIORITY_CLS[priority]}`}>● {t(`changes.priority.${priority}`)}</span>;
}
