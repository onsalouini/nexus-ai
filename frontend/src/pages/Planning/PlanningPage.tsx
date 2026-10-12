import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { useAuth, getDashboardPath } from "../../context/AuthContext";
import { chefApi } from "../../services/chefApi";
import { getDirectorProjects } from "../../services/directorProjects";
import { workspaceApi } from "../../services/workspaceApi";
import PlanningView, { type PlanningProject, type PlanningTask } from "../../components/planning/PlanningView";
import { PageHeader, errMsg } from "../../components/ui-nexus/kit";
import { SkeletonCards } from "../../components/ui-nexus/Skeleton";
import { toast } from "../../lib/toast";

/* Planning (calendrier + Gantt) : les données dépendent du rôle connecté */
export default function PlanningPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<PlanningProject[]>([]);
  const [tasks, setTasks] = useState<PlanningTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        if (user?.role === "chef_de_projet") {
          const [projectList, taskList] = await Promise.all([chefApi.projects(), chefApi.tasks()]);
          setProjects(projectList as PlanningProject[]);
          setTasks(taskList.map((task) => ({ ...task, project_name: task.project?.name })));
        } else if (user?.role === "direction") {
          setProjects((await getDirectorProjects()) as unknown as PlanningProject[]);
        } else {
          const [projectList, taskList] = await Promise.all([workspaceApi.myProjects(), workspaceApi.myTasks()]);
          setProjects(projectList);
          setTasks(taskList.map((task) => ({ ...task, project_name: task.project?.name })));
        }
      } catch (e) {
        toast.error(errMsg(e, t("planning.loadError")));
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [user?.role, t]);

  return (
    <div className="space-y-6">
      <PageHeader title={t("planning.title")} subtitle={t("planning.subtitle")} />
      {loading ? (
        <SkeletonCards count={3} className="h-28" />
      ) : (
        <PlanningView
          projects={projects}
          tasks={tasks}
          onTaskClick={() => {
            const base = getDashboardPath(user?.role ?? null);
            navigate(user?.role === "chef_de_projet" ? `${base}/tasks` : base);
          }}
        />
      )}
    </div>
  );
}
