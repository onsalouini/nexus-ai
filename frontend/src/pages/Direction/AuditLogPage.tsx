import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShieldCheck } from "lucide-react";
import { workspaceApi, type AuditEntry, type Paginated } from "../../services/workspaceApi";
import { PageHeader, btnGhost, cardCls, errMsg, inputCls } from "../../components/ui-nexus/kit";
import { SkeletonRows } from "../../components/ui-nexus/Skeleton";
import { formatDateTime } from "../../i18n/format";
import { roleLabel } from "../../i18n/labels";
import { toast } from "../../lib/toast";
import { exportRows } from "../../utils/export";

const FILTERS = ["", "auth", "account", "invitation", "project", "company", "ticket"];

/* Journal d'audit : actions sensibles de l'entreprise (connexions, invitations, projets, sécurité) */
export default function AuditLogPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [data, setData] = useState<Paginated<AuditEntry> | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await workspaceApi.auditLogs({ page, action: action || undefined }));
    } catch (e) {
      toast.error(errMsg(e, t("audit.loadError")));
    } finally {
      setLoading(false);
    }
  }, [page, action, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const describe = (entry: AuditEntry) => {
    const meta = entry.meta ?? {};
    const detail = meta.project ?? meta.email ?? meta.name ?? meta.title ?? "";
    const role = typeof meta.role === "string" ? ` (${roleLabel(meta.role)})` : "";
    return `${t(`audit.actions.${entry.action}`, { defaultValue: entry.action })}${detail ? ` — ${detail}` : ""}${role}`;
  };

  function exportLog(format: "csv" | "xlsx") {
    if (!data) return;
    void exportRows(format, t("audit.title"), [
      { header: t("audit.date"), value: (e: AuditEntry) => formatDateTime(e.created_at) },
      { header: t("audit.user"), value: (e: AuditEntry) => (e.user ? `${e.user.first_name} ${e.user.last_name}` : "—") },
      { header: t("audit.action"), value: (e: AuditEntry) => describe(e) },
      { header: "IP", value: (e: AuditEntry) => e.ip ?? "" },
    ], data.data);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("audit.title")}
        subtitle={t("audit.subtitle")}
        action={
          <div className="flex gap-2">
            <button className={btnGhost} onClick={() => exportLog("csv")} disabled={!data?.data.length}>CSV</button>
            <button className={btnGhost} onClick={() => exportLog("xlsx")} disabled={!data?.data.length}>Excel</button>
          </div>
        }
      />

      <select
        aria-label={t("audit.filter")}
        className={`${inputCls} !w-auto`}
        value={action}
        onChange={(e) => {
          setPage(1);
          setAction(e.target.value);
        }}
      >
        {FILTERS.map((f) => (
          <option key={f} value={f}>{t(`audit.filters.${f || "all"}`)}</option>
        ))}
      </select>

      {loading && !data ? (
        <SkeletonRows count={6} />
      ) : !data || data.data.length === 0 ? (
        <div className={`${cardCls} p-10 text-center text-sm text-slate-400`}>{t("audit.empty")}</div>
      ) : (
        <div className={`${cardCls} divide-y divide-white/[0.05]`}>
          {data.data.map((entry) => (
            <div key={entry.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <ShieldCheck className={`h-4 w-4 shrink-0 ${entry.action.includes("failed") ? "text-red-400" : "text-cyan-300"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-slate-200">{describe(entry)}</p>
                <p className="text-xs text-slate-500">
                  {entry.user ? `${entry.user.first_name} ${entry.user.last_name} · ${roleLabel(entry.user.role)}` : "—"}
                  {entry.ip && <span dir="ltr"> · {entry.ip}</span>}
                </p>
              </div>
              <span className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</span>
            </div>
          ))}
        </div>
      )}

      {data && data.last_page > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm text-slate-400">
          <button className={btnGhost} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("common.previous")}</button>
          <span>{t("audit.page", { page: data.current_page, total: data.last_page })}</span>
          <button className={btnGhost} disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}>{t("common.next")}</button>
        </div>
      )}
    </div>
  );
}
