import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { Field, PageHeader, btnPrimary, cardCls, errMsg, inputCls } from "../../components/ui-nexus/kit";

type Account = {
  id: number; first_name: string; last_name: string; email: string; role: string;
  phone?: string | null; job_title?: string | null; bio?: string | null;
  weekly_capacity?: number | null; avatar_path?: string | null;
  company?: { id: number; name: string; email?: string | null; phone?: string | null; address?: string | null; industry?: string | null; employees_count?: number | null } | null;
};

type Msg = { type: "ok" | "err"; text: string } | null;

function Banner({ msg }: { msg: Msg }) {
  if (!msg) return null;
  return (
    <p className={`rounded-xl border px-3 py-2 text-sm ${msg.type === "ok" ? "border-emerald-400/20 bg-emerald-400/5 text-emerald-300" : "border-red-500/20 bg-red-500/5 text-red-300"}`}>
      {msg.text}
    </p>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [acc, setAcc] = useState<Account | null>(null);
  const [profileMsg, setProfileMsg] = useState<Msg>(null);
  const [pwdMsg, setPwdMsg] = useState<Msg>(null);
  const [companyMsg, setCompanyMsg] = useState<Msg>(null);
  const [pwd, setPwd] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<{ user: Account }>("/account").then((r) => setAcc(r.data.user)).catch((e) => setProfileMsg({ type: "err", text: errMsg(e) }));
  }, []);

  if (!acc) return <div className={`${cardCls} p-8 text-center text-sm text-slate-400`}>Chargement…</div>;

  const set = <K extends keyof Account>(k: K, v: Account[K]) => setAcc({ ...acc, [k]: v });
  const isDirection = acc.role === "direction";
  const avatarUrl = acc.avatar_path ? `${(import.meta.env.VITE_API_URL ?? "http://localhost:8000/api").replace(/\/api$/, "")}/storage/${acc.avatar_path}` : null;

  async function saveProfile() {
    setSaving(true);
    try {
      const r = await api.put<{ user: Account }>("/account/profile", {
        first_name: acc!.first_name, last_name: acc!.last_name, email: acc!.email,
        phone: acc!.phone || null, job_title: acc!.job_title || null, bio: acc!.bio || null,
        weekly_capacity: acc!.weekly_capacity || null,
      });
      setAcc(r.data.user);
      setProfileMsg({ type: "ok", text: "Profil mis à jour." });
    } catch (e) {
      setProfileMsg({ type: "err", text: errMsg(e) });
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(file: File) {
    const fd = new FormData();
    fd.append("avatar", file);
    try {
      const r = await api.post<{ user: Account }>("/account/avatar", fd);
      setAcc(r.data.user);
      setProfileMsg({ type: "ok", text: "Photo mise à jour." });
    } catch (e) {
      setProfileMsg({ type: "err", text: errMsg(e) });
    }
  }

  async function savePassword() {
    try {
      await api.put("/account/password", pwd);
      setPwd({ current_password: "", password: "", password_confirmation: "" });
      setPwdMsg({ type: "ok", text: "Mot de passe mis à jour." });
    } catch (e) {
      setPwdMsg({ type: "err", text: errMsg(e) });
    }
  }

  async function saveCompany() {
    if (!acc?.company) return;
    try {
      const r = await api.put<{ user: Account }>("/account/company", acc.company);
      setAcc(r.data.user);
      setCompanyMsg({ type: "ok", text: "Entreprise mise à jour." });
    } catch (e) {
      setCompanyMsg({ type: "err", text: errMsg(e) });
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Paramètres du compte" subtitle={`Connecté en tant que ${user?.role === "direction" ? "Direction" : "Chef de projet"}`} />

      <section className={`${cardCls} space-y-4 p-6`}>
        <h2 className="text-base font-semibold text-white">Profil</h2>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 text-lg font-bold text-white">
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : `${acc.first_name[0] ?? ""}${acc.last_name[0] ?? ""}`}
          </div>
          <label className="cursor-pointer text-sm text-cyan-300 hover:underline">
            Changer la photo
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom"><input className={inputCls} value={acc.first_name} onChange={(e) => set("first_name", e.target.value)} /></Field>
          <Field label="Nom"><input className={inputCls} value={acc.last_name} onChange={(e) => set("last_name", e.target.value)} /></Field>
          <Field label="Email"><input type="email" className={inputCls} value={acc.email} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Téléphone"><input className={inputCls} value={acc.phone ?? ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Poste"><input className={inputCls} value={acc.job_title ?? ""} onChange={(e) => set("job_title", e.target.value)} /></Field>
          {!isDirection && (
            <Field label="Capacité hebdo (h)"><input type="number" className={inputCls} value={acc.weekly_capacity ?? 40} onChange={(e) => set("weekly_capacity", Number(e.target.value))} /></Field>
          )}
        </div>
        <Field label="Bio"><textarea rows={3} className={inputCls} value={acc.bio ?? ""} onChange={(e) => set("bio", e.target.value)} /></Field>
        <Banner msg={profileMsg} />
        <button className={btnPrimary} onClick={saveProfile} disabled={saving}>Enregistrer le profil</button>
      </section>

      <section className={`${cardCls} space-y-4 p-6`}>
        <h2 className="text-base font-semibold text-white">Sécurité</h2>
        <Field label="Mot de passe actuel"><input type="password" className={inputCls} value={pwd.current_password} onChange={(e) => setPwd({ ...pwd, current_password: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nouveau mot de passe"><input type="password" className={inputCls} value={pwd.password} onChange={(e) => setPwd({ ...pwd, password: e.target.value })} /></Field>
          <Field label="Confirmation"><input type="password" className={inputCls} value={pwd.password_confirmation} onChange={(e) => setPwd({ ...pwd, password_confirmation: e.target.value })} /></Field>
        </div>
        <Banner msg={pwdMsg} />
        <button className={btnPrimary} onClick={savePassword} disabled={!pwd.current_password || pwd.password.length < 8}>Changer le mot de passe</button>
      </section>

      {isDirection && acc.company && (
        <section className={`${cardCls} space-y-4 p-6`}>
          <h2 className="text-base font-semibold text-white">Entreprise</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nom"><input className={inputCls} value={acc.company.name} onChange={(e) => set("company", { ...acc.company!, name: e.target.value })} /></Field>
            <Field label="Secteur"><input className={inputCls} value={acc.company.industry ?? ""} onChange={(e) => set("company", { ...acc.company!, industry: e.target.value })} /></Field>
            <Field label="Email"><input type="email" className={inputCls} value={acc.company.email ?? ""} onChange={(e) => set("company", { ...acc.company!, email: e.target.value })} /></Field>
            <Field label="Téléphone"><input className={inputCls} value={acc.company.phone ?? ""} onChange={(e) => set("company", { ...acc.company!, phone: e.target.value })} /></Field>
            <Field label="Adresse"><input className={inputCls} value={acc.company.address ?? ""} onChange={(e) => set("company", { ...acc.company!, address: e.target.value })} /></Field>
            <Field label="Effectif"><input type="number" className={inputCls} value={acc.company.employees_count ?? ""} onChange={(e) => set("company", { ...acc.company!, employees_count: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
          </div>
          <Banner msg={companyMsg} />
          <button className={btnPrimary} onClick={saveCompany}>Enregistrer l'entreprise</button>
        </section>
      )}
    </div>
  );
}
