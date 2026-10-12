import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Mail } from "lucide-react";
import { workspaceApi, type MyProject } from "../../services/workspaceApi";
import { PageHeader, ProgressBar, cardCls, errMsg, statusLabel } from "../../components/ui-nexus/kit";
import { SkeletonCards } from "../../components/ui-nexus/Skeleton";
import { formatDate } from "../../i18n/format";
import { toast } from "../../lib/toast";

export default function MyProjectsPage() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<MyProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    workspaceApi
      .myProjects()
      .then(setProjects)
      .catch((e) => toast.error(errMsg(e, t("employee.projects.loadError"))))
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("employee.projects.title")} subtitle={t("employee.projects.subtitle")} />

      {loading ? (
        <SkeletonCards count={3} />
      ) : projects.length === 0 ? (
        <div className={`${cardCls} p-10 text-center text-sm text-slate-400`}>{t("employee.projects.empty")}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <article key={project.id} className={`${cardCls} p-5`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-white">{project.name}</h3>
                <span className="shrink-0 rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-slate-300">
                  {statusLabel(project.status)}
                </span>
              </div>
              {project.description && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{project.description}</p>}

              <div className="mt-4">
                <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                  <span>{t("chef.projects.progress")}</span>
                  <span className="font-semibold text-white">{project.progress}%</span>
                </div>
                <ProgressBar value={project.progress} />
              </div>

              <p className="mt-4 text-xs text-slate-500">
                {t("employee.projects.myTasks", { open: project.my_open_tasks, done: project.my_done_tasks })}
              </p>
              {project.deadline && (
                <p className="mt-1 text-xs text-slate-500">{t("chef.projects.deadline", { date: formatDate(project.deadline) })}</p>
              )}

              {project.chef_de_projet && (
                <div className="mt-4 border-t border-white/[0.06] pt-3 text-xs text-slate-400">
                  <p>
                    {t("common.roles.chef_de_projet")} :{" "}
                    <span className="text-slate-200">
                      {project.chef_de_projet.first_name} {project.chef_de_projet.last_name}
                    </span>
                  </p>
                  <a href={`mailto:${project.chef_de_projet.email}`} className="mt-1 inline-flex items-center gap-1 text-cyan-300 hover:underline" dir="ltr">
                    <Mail className="h-3 w-3" />
                    {project.chef_de_projet.email}
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
