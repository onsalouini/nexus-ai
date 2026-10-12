import { useState } from "react";
import { useTranslation } from "react-i18next";
import { chefApi } from "../../services/chefApi";
import { toast } from "../../lib/toast";
import { Field, Modal, PROJECT_STATUSES, statusLabel, btnGhost, btnPrimary, errMsg, inputCls } from "../ui-nexus/kit";

export type EditableProject = {
  id: number;
  name: string;
  description: string | null;
  status: string;
  start_date?: string | null;
  deadline?: string | null;
  planned_effort: number;
  length: number;
  team_exp: number;
  manager_exp: number;
};

export default function EditProjectModal({
  project,
  onClose,
  onSaved,
}: {
  project: EditableProject;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [f, setF] = useState({
    name: project.name,
    description: project.description ?? "",
    status: project.status,
    start_date: project.start_date ?? "",
    deadline: project.deadline ?? "",
    planned_effort: project.planned_effort,
    length: project.length,
    team_exp: project.team_exp,
    manager_exp: project.manager_exp,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    try {
      const updated = await chefApi.updateProject(project.id, {
        ...f,
        description: f.description || null,
        start_date: f.start_date || null,
        deadline: f.deadline || null,
      });
      // Le backend relance le bilan IA en arrière-plan si les données du modèle ont changé
      toast.success(updated?.ai_report_regenerating ? t("chef.editProject.regenerating") : t("chef.editProject.saved"));
      onSaved();
      onClose();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  }

  const num = (k: "planned_effort" | "length" | "team_exp" | "manager_exp") => (
    <input type="number" min={0} className={inputCls} value={f[k]} onChange={(e) => setF({ ...f, [k]: Number(e.target.value) })} />
  );

  return (
    <Modal title={t("chef.editProject.title")} onClose={onClose} wide>
      <div className="space-y-4">
        <Field label={t("chef.editProject.name")}><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label={t("chef.projectForm.description")}><textarea rows={3} className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label={t("chef.editProject.status")}>
            <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              {PROJECT_STATUSES.map((k) => <option key={k} value={k}>{statusLabel(k)}</option>)}
            </select>
          </Field>
          <Field label={t("chef.editProject.start")}><input type="date" className={inputCls} value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
          <Field label={t("chef.editProject.deadline")}><input type="date" className={inputCls} value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label={t("chef.editProject.plannedEffort")}>{num("planned_effort")}</Field>
          <Field label={t("chef.editProject.length")}>{num("length")}</Field>
          <Field label={t("chef.editProject.teamExp")}>{num("team_exp")}</Field>
          <Field label={t("chef.editProject.managerExp")}>{num("manager_exp")}</Field>
        </div>
        <p className="text-xs text-slate-500">{t("chef.editProject.note")}</p>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <div className="flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose}>{t("common.cancel")}</button>
          <button className={btnPrimary} onClick={save} disabled={busy || !f.name.trim()}>{busy ? t("common.saving") : t("common.save")}</button>
        </div>
      </div>
    </Modal>
  );
}
