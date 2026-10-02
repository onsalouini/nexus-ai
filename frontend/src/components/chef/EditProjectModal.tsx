import { useState } from "react";
import { chefApi } from "../../services/chefApi";
import { Field, Modal, STATUS_LABEL, btnGhost, btnPrimary, errMsg, inputCls } from "../ui-nexus/kit";

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
      await chefApi.updateProject(project.id, {
        ...f,
        description: f.description || null,
        start_date: f.start_date || null,
        deadline: f.deadline || null,
      });
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
    <Modal title="Modifier le projet" onClose={onClose} wide>
      <div className="space-y-4">
        <Field label="Nom"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Description"><textarea rows={3} className={inputCls} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Statut">
            <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Début"><input type="date" className={inputCls} value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
          <Field label="Échéance"><input type="date" className={inputCls} value={f.deadline} onChange={(e) => setF({ ...f, deadline: e.target.value })} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Effort prévu (h)">{num("planned_effort")}</Field>
          <Field label="Durée (mois)">{num("length")}</Field>
          <Field label="Exp. équipe">{num("team_exp")}</Field>
          <Field label="Exp. chef">{num("manager_exp")}</Field>
        </div>
        <p className="text-xs text-slate-500">Modifier l'effort, la durée ou l'expérience relance automatiquement la prédiction de risque IA.</p>
        {error && <p className="text-sm text-red-300">{error}</p>}
        <div className="flex justify-end gap-2">
          <button className={btnGhost} onClick={onClose}>Annuler</button>
          <button className={btnPrimary} onClick={save} disabled={busy || !f.name.trim()}>{busy ? "Enregistrement…" : "Enregistrer"}</button>
        </div>
      </div>
    </Modal>
  );
}
