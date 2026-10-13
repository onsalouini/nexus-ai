import { useState } from "react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Building2, GitPullRequestArrow, MailCheck, MessagesSquare, UserPlus } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { SUPPORTED_LANGUAGES, normalizeLanguage } from "../../i18n";
import Avatar from "../ui-nexus/Avatar";
import { Field, Modal, btnGhost, btnPrimary, cardCls, errMsg, inputCls } from "../ui-nexus/kit";
import { formatDate } from "../../i18n/format";
import { toast } from "../../lib/toast";

export type ProjectClientInfo = {
  client: { id: number; first_name: string; last_name: string; email: string; organization?: string | null; avatar_path?: string | null; avatar_color?: string | null } | null;
  client_invitation: { id: number; email: string; first_name?: string | null; organization?: string | null; expires_at: string } | null;
  change_requests_pending: number;
};

/*
| Client propriétaire du projet (suivi chef) : le chef invite le client à créer son compte,
| puis lui écrit et traite ses demandes de changement.
*/
export default function ProjectClientCard({ projectId, info, onChange }: { projectId: number; info: ProjectClientInfo; onChange: () => void }) {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [inviting, setInviting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ first_name: "", email: "", organization: "", locale: normalizeLanguage(i18n.language) as string });

  async function invite() {
    if (!form.email.trim()) {
      toast.error(t("support.required"));
      return;
    }
    setBusy(true);
    try {
      await api.post("/invitations", { ...form, role: "client", project_id: projectId });
      toast.success(t("projectClient.invited", { email: form.email }));
      setInviting(false);
      onChange();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (!info.client_invitation) return;
    try {
      await api.post(`/invitations/${info.client_invitation.id}/resend`);
      toast.success(t("projectClient.resent"));
      onChange();
    } catch (e) {
      toast.error(errMsg(e));
    }
  }

  return (
    <div className={`${cardCls} relative overflow-hidden p-5`}>
      <div className="pointer-events-none absolute -end-10 -top-10 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
      <p className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-amber-200/80">
        <Building2 className="h-4 w-4" />
        {t("projectClient.title")}
      </p>

      {info.client ? (
        <div className="relative flex flex-wrap items-center gap-4">
          <Avatar person={info.client} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-white">
              {info.client.first_name} {info.client.last_name}
            </p>
            <p className="truncate text-xs text-slate-400">
              {info.client.organization ? `${info.client.organization} · ` : ""}
              <span dir="ltr">{info.client.email}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={btnGhost} onClick={() => navigate(`/dashboard/chef/messages?with=${info.client!.id}`)}>
              <MessagesSquare className="h-4 w-4" />
              {t("projectClient.write")}
            </button>
            <button className={btnGhost} onClick={() => navigate("/dashboard/chef/change-requests")}>
              <GitPullRequestArrow className="h-4 w-4" />
              {t("projectClient.requests")}
              {info.change_requests_pending > 0 && (
                <span className="rounded-full bg-amber-400/25 px-1.5 text-[11px] text-amber-100">{info.change_requests_pending}</span>
              )}
            </button>
          </div>
        </div>
      ) : info.client_invitation ? (
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 text-amber-200">
            <MailCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">{t("projectClient.pending", { email: info.client_invitation.email })}</p>
            <p className="text-xs text-slate-500">{t("projectClient.expires", { date: formatDate(info.client_invitation.expires_at) })}</p>
          </div>
          <button className={btnGhost} onClick={resend}>
            {t("projectClient.resend")}
          </button>
        </div>
      ) : (
        <div className="relative flex flex-wrap items-center gap-4">
          <p className="min-w-0 flex-1 text-sm text-slate-400">{t("projectClient.none")}</p>
          {user?.role === "chef_de_projet" && (
            <button className={btnPrimary} onClick={() => setInviting(true)}>
              <UserPlus className="h-4 w-4" />
              {t("projectClient.invite")}
            </button>
          )}
        </div>
      )}

      {inviting && (
        <Modal title={t("projectClient.invite")} onClose={() => setInviting(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-400">{t("projectClient.inviteHint")}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("projectClient.firstName")}>
                <input className={inputCls} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
              </Field>
              <Field label={t("projectClient.email")}>
                <input type="email" dir="ltr" className={inputCls} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
            </div>
            <Field label={t("projectClient.organization")}>
              <input className={inputCls} value={form.organization} onChange={(e) => setForm({ ...form, organization: e.target.value })} />
            </Field>
            <Field label={t("director.invitations.emailLanguage")}>
              <select className={inputCls} value={form.locale} onChange={(e) => setForm({ ...form, locale: e.target.value })}>
                {SUPPORTED_LANGUAGES.map((code) => (
                  <option key={code} value={code}>
                    {t(`settings.languages.${code}`)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2">
              <button className={btnGhost} onClick={() => setInviting(false)}>
                {t("common.cancel")}
              </button>
              <button className={btnPrimary} onClick={invite} disabled={busy}>
                {busy ? t("common.saving") : t("projectClient.send")}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
