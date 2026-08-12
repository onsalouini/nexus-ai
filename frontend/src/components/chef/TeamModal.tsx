import { useEffect, useState, type FormEvent } from "react";
import { api } from "../../lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Invitation = {
  id: number;
  email: string;
  first_name: string | null;
  job_title: string | null;
  accepted_at: string | null;
  role?: string;
  project?: {
    name: string;
  } | null;
};

type ProjectOption = {
  id: number;
  name: string;
};

type Feedback = {
  type: "success" | "error";
  text: string;
};

export default function TeamModal({ open, onClose }: Props) {
  const [members, setMembers] = useState<Invitation[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  const [form, setForm] = useState({
    first_name: "",
    email: "",
    job_title: "",
    project_id: "",
  });

  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);

  const [feedback, setFeedback] = useState<Feedback | null>(null);

  /*
   * ============================================================
   * CHARGEMENT
   * ============================================================
   */

  async function load() {
    try {
      setLoading(true);

      const [invRes, projRes] = await Promise.all([
        api.get("/invitations"),
        api.get("/projects"),
      ]);

      const invitations: Invitation[] = Array.isArray(invRes.data)
        ? invRes.data
        : [];

      const projectList: ProjectOption[] = Array.isArray(projRes.data)
        ? projRes.data
        : [];

      setMembers(
        invitations.filter(
          (invitation) => invitation.role === "membre_equipe"
        )
      );

      setProjects(projectList);
    } catch (error) {
      console.error("Erreur lors du chargement de l'équipe :", error);

      setFeedback({
        type: "error",
        text: "Impossible de charger les données de l'équipe.",
      });
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * OUVERTURE DU MODAL
   * ============================================================
   */

  useEffect(() => {
    if (open) {
      setFeedback(null);
      load();
    }
  }, [open]);

  /*
   * ============================================================
   * INVITATION
   * ============================================================
   */

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.email.trim()) {
      setFeedback({
        type: "error",
        text: "Veuillez renseigner une adresse email.",
      });

      return;
    }

    try {
      setSending(true);
      setFeedback(null);

      await api.post("/invitations", {
        email: form.email.trim(),
        first_name: form.first_name.trim(),
        job_title: form.job_title.trim(),
        role: "membre_equipe",
        project_id: form.project_id
          ? Number(form.project_id)
          : null,
      });

      setFeedback({
        type: "success",
        text: `Invitation envoyée à ${form.email}`,
      });

      setForm({
        first_name: "",
        email: "",
        job_title: "",
        project_id: "",
      });

      await load();
    } catch (error) {
      console.error("Erreur invitation :", error);

      setFeedback({
        type: "error",
        text: "Impossible d'envoyer l'invitation.",
      });
    } finally {
      setSending(false);
    }
  }

  /*
   * ============================================================
   * FERMETURE
   * ============================================================
   */

  if (!open) {
    return null;
  }

  /*
   * ============================================================
   * INPUT STYLE
   * ============================================================
   */

  const inputClass = `
    h-11
    w-full
    rounded-xl
    border
    border-white/[0.09]
    bg-white/[0.025]
    px-3.5
    text-sm
    text-white
    outline-none
    placeholder:text-slate-600
    backdrop-blur-xl
    transition-all
    duration-200
    focus:border-[#22D3EE]/40
    focus:bg-white/[0.04]
    focus:ring-2
    focus:ring-[#22D3EE]/10
  `;

  /*
   * ============================================================
   * UI
   * ============================================================
   */

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        overflow-y-auto
        bg-[#00040c]/75
        p-4
        backdrop-blur-md
      "
    >
      {/* Glow cyan */}

      <div
        className="
          pointer-events-none
          absolute
          left-[20%]
          top-[15%]
          h-[350px]
          w-[350px]
          rounded-full
          bg-[#22D3EE]/10
          blur-[130px]
        "
      />

      {/* Glow violet */}

      <div
        className="
          pointer-events-none
          absolute
          bottom-[10%]
          right-[15%]
          h-[350px]
          w-[350px]
          rounded-full
          bg-[#8B5CF6]/10
          blur-[140px]
        "
      />

      {/* ======================================================
          MODAL
      ====================================================== */}

      <div
        className="
          relative
          max-h-[90vh]
          w-full
          max-w-xl
          overflow-y-auto
          overflow-hidden
          rounded-[28px]
          border
          border-white/[0.10]
          bg-[#071021]/90
          shadow-[0_40px_120px_rgba(0,0,0,.65)]
          backdrop-blur-2xl
        "
      >
        {/* Mirror reflection */}

        <div
          className="
            pointer-events-none
            absolute
            inset-x-8
            top-0
            h-px
            bg-gradient-to-r
            from-transparent
            via-white/50
            to-transparent
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            left-[15%]
            right-[15%]
            top-0
            h-20
            bg-white/[0.035]
            blur-2xl
          "
        />

        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="relative border-b border-white/[0.06] px-6 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Logo */}

              <div className="relative">
                <div
                  className="
                    absolute
                    -inset-2
                    rounded-2xl
                    bg-gradient-to-r
                    from-[#22D3EE]
                    to-[#8B5CF6]
                    opacity-20
                    blur-xl
                  "
                />

                <img
                  src="/nexus-logo.jpg"
                  alt="NEXUS AI"
                  className="
                    relative
                    h-11
                    w-11
                    rounded-[14px]
                    object-cover
                    ring-1
                    ring-white/15
                  "
                />
              </div>

              <div>
                <div
                  className="
                    font-['Space_Grotesk',sans-serif]
                    text-lg
                    font-bold
                    tracking-tight
                    text-white
                  "
                >
                  Mon équipe
                </div>

                <p className="mt-0.5 text-xs text-slate-500">
                  Gérez les membres de votre projet
                </p>
              </div>
            </div>

            {/* Close */}

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                border
                border-white/[0.07]
                bg-white/[0.025]
                text-slate-500
                transition
                hover:border-white/15
                hover:bg-white/[0.06]
                hover:text-white
              "
            >
              ✕
            </button>
          </div>

          {/* Badge */}

          <div
            className="
              mt-5
              inline-flex
              items-center
              gap-2
              rounded-full
              border
              border-[#22D3EE]/15
              bg-[#22D3EE]/[0.04]
              px-3
              py-1.5
            "
          >
            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-[#22D3EE]
                shadow-[0_0_10px_#22D3EE]
              "
            />

            <span
              className="
                font-mono
                text-[8px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-[#67E8F9]
              "
            >
              Team Management
            </span>
          </div>
        </div>

        {/* ====================================================
            BODY
        ==================================================== */}

        <div className="relative px-6 py-6 sm:px-7">
          {/* ==================================================
              INVITATION
          ================================================== */}

          <div className="mb-6">
            <div className="mb-3">
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#22D3EE]">
                Nouvelle invitation
              </p>

              <h3 className="mt-1 text-sm font-semibold text-white">
                Ajouter un membre
              </h3>

              <p className="mt-1 text-xs leading-5 text-slate-500">
                Le membre recevra un email pour créer son compte NEXUS AI.
              </p>
            </div>

            <form
              onSubmit={handleInvite}
              className="
                relative
                overflow-hidden
                rounded-2xl
                border
                border-white/[0.07]
                bg-white/[0.025]
                p-4
              "
            >
              {/* reflection */}

              <div
                className="
                  pointer-events-none
                  absolute
                  inset-x-8
                  top-0
                  h-px
                  bg-gradient-to-r
                  from-transparent
                  via-white/30
                  to-transparent
                "
              />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* First name */}

                <input
                  type="text"
                  placeholder="Prénom"
                  className={inputClass}
                  value={form.first_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      first_name: event.target.value,
                    }))
                  }
                />

                {/* Job */}

                <input
                  type="text"
                  placeholder="Poste · Développeur"
                  className={inputClass}
                  value={form.job_title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      job_title: event.target.value,
                    }))
                  }
                />
              </div>

              {/* Email */}

              <input
                type="email"
                required
                placeholder="Adresse email"
                className={`mt-3 ${inputClass}`}
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
              />

              {/* Project */}

              <select
                className={`mt-3 ${inputClass}`}
                value={form.project_id}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    project_id: event.target.value,
                  }))
                }
              >
                <option value="" className="bg-[#071021]">
                  Aucun projet
                </option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                    className="bg-[#071021]"
                  >
                    {project.name}
                  </option>
                ))}
              </select>

              {/* Submit */}

              <button
                type="submit"
                disabled={sending}
                className="
                  group
                  relative
                  mt-4
                  w-full
                  overflow-hidden
                  rounded-xl
                  border
                  border-[#22D3EE]/20
                  bg-gradient-to-r
                  from-[#22D3EE]
                  via-[#3B82F6]
                  to-[#8B5CF6]
                  py-3
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_10px_30px_rgba(34,211,238,.12)]
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:shadow-[0_15px_40px_rgba(34,211,238,.20)]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                <span className="relative z-10">
                  {sending ? "Envoi en cours..." : "Inviter le membre"}
                </span>

                <span
                  className="
                    pointer-events-none
                    absolute
                    inset-x-0
                    top-0
                    h-px
                    bg-white/50
                  "
                />
              </button>
            </form>
          </div>

          {/* ==================================================
              FEEDBACK
          ================================================== */}

          {feedback && (
            <div
              className={`
                mb-6
                rounded-xl
                border
                px-4
                py-3
                text-xs
                ${
                  feedback.type === "success"
                    ? "border-[#22D3EE]/15 bg-[#22D3EE]/[0.05] text-[#67E8F9]"
                    : "border-red-400/15 bg-red-500/[0.05] text-red-300"
                }
              `}
            >
              {feedback.text}
            </div>
          )}

          {/* ==================================================
              MEMBERS
          ================================================== */}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-[#8B5CF6]">
                  Team
                </p>

                <h3 className="mt-1 text-sm font-semibold text-white">
                  Membres de l'équipe
                </h3>
              </div>

              <span
                className="
                  rounded-full
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  px-2.5
                  py-1
                  font-mono
                  text-[9px]
                  text-slate-400
                "
              >
                {members.length}
              </span>
            </div>

            <div
              className="
                overflow-hidden
                rounded-2xl
                border
                border-white/[0.07]
                bg-white/[0.02]
              "
            >
              {loading ? (
                <div className="px-4 py-8 text-center">
                  <div
                    className="
                      mx-auto
                      h-6
                      w-6
                      animate-spin
                      rounded-full
                      border-2
                      border-white/10
                      border-t-[#22D3EE]
                    "
                  />

                  <p className="mt-3 text-xs text-slate-600">
                    Chargement de l'équipe...
                  </p>
                </div>
              ) : members.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div
                    className="
                      mx-auto
                      flex
                      h-10
                      w-10
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-white/[0.07]
                      bg-white/[0.025]
                      text-[#67E8F9]
                    "
                  >
                    ✦
                  </div>

                  <p className="mt-3 text-sm text-slate-400">
                    Aucun membre pour l'instant.
                  </p>

                  <p className="mt-1 text-[11px] text-slate-600">
                    Envoyez votre première invitation ci-dessus.
                  </p>
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      border-b
                      border-white/[0.05]
                      px-4
                      py-3.5
                      last:border-b-0
                    "
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {/* Avatar */}

                      <div
                        className="
                          flex
                          h-9
                          w-9
                          shrink-0
                          items-center
                          justify-center
                          rounded-xl
                          border
                          border-[#22D3EE]/10
                          bg-gradient-to-br
                          from-[#22D3EE]/10
                          to-[#8B5CF6]/10
                          font-semibold
                          text-[#67E8F9]
                        "
                      >
                        {(member.first_name?.[0] ??
                          member.email[0] ??
                          "?").toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {member.first_name ?? member.email}
                        </p>

                        <p className="mt-0.5 truncate text-[10px] text-slate-600">
                          {member.job_title ?? "Poste non renseigné"}

                          {member.project?.name && (
                            <>
                              {" · "}
                              {member.project.name}
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Status */}

                    <span
                      className={`
                        shrink-0
                        rounded-full
                        border
                        px-2.5
                        py-1
                        text-[9px]
                        font-semibold
                        ${
                          member.accepted_at
                            ? "border-emerald-400/10 bg-emerald-400/[0.06] text-emerald-300"
                            : "border-amber-400/10 bg-amber-400/[0.06] text-amber-300"
                        }
                      `}
                    >
                      {member.accepted_at
                        ? "Actif"
                        : "En attente"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}