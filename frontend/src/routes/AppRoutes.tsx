import { Routes, Route } from "react-router";

import SignIn from "../pages/AuthPages/SignIn";
import SignUp from "../pages/AuthPages/SignUp";
import NotFound from "../pages/OtherPage/NotFound";

import Landing from "../pages/Landing";
import CompanyForm from "../pages/Onboarding/CompanyForm";

import DirectorInvitations from "../pages/DirectorInvitations";
import RiskPredictionsPage from "../pages/Chef/RiskPredictionsPage"; // 👈 nouveau
import PrivateRoute from "../components/PrivateRoute";
import InvitationWelcome from "../pages/AuthPages/InvitationWelcome";
import SignUpComplete from "../pages/AuthPages/SignUpComplete";

import ChefDashboard from "../pages/Dashboard/ChefDashboard";
import EmployeeLayout from "../components/employee/EmployeeLayout";
import MyTasksPage from "../pages/Employee/MyTasksPage";
import MyProjectsPage from "../pages/Employee/MyProjectsPage";
import TicketsPage from "../pages/Support/TicketsPage";
import PlanningPage from "../pages/Planning/PlanningPage";
import AuditLogPage from "../pages/Direction/AuditLogPage";
import ChefLayout from "../components/chef/ChefLayout";
import TeamMembersPage from "../pages/Chef/TeamMembersPage";
import TasksPage from "../pages/Chef/TasksPage";
import TrackingPage from "../pages/Chef/TrackingPage";
import SettingsPage from "../pages/Settings/SettingsPage";
import RiskModelsPage from "../pages/Chef/RiskModelsPage";
import AssistantPage from "../pages/Chef/AssistantPage";
import MonitoringPage from "../pages/Direction/MonitoringPage";
import DirectionDashboard from "../components/director/DirectionDashboard";
import DirectorLayout from "../components/director/DirectorLayout";
import ProjectsPage from "../components/director/ProjectsPage";
import ProjectDetailsPage from "../components/director/ProjectDetailsPage";
import TeamPage from "../components/director/TeamPage";
import FinancialHealthPage from "../pages/Direction/FinancialHealthPage";

export default function AppRoutes() {
  return (
    <Routes>

      {/* =========================
          PUBLIC
      ========================= */}

      <Route path="/" element={<Landing />} />

      <Route path="/signin" element={<SignIn />} />

      <Route path="/signup" element={<SignUp />} />

      <Route
        path="/onboarding/entreprise"
        element={<CompanyForm />}
      />

      {/* =========================
          INVITATIONS
      ========================= */}

      <Route
        path="/invitation"
        element={<InvitationWelcome />}
      />

      <Route
        path="/invitation/complete"
        element={<SignUpComplete />}
      />

      {/* =========================
          DIRECTION
      ========================= */}

      <Route
        element={
          <PrivateRoute roles={["direction"]}>
            <DirectorLayout />
          </PrivateRoute>
        }
      >
        <Route
          path="/dashboard/direction"
          element={<DirectionDashboard />}
        />

        <Route
          path="/dashboard/direction/projects"
          element={<ProjectsPage />}
        />

        <Route
          path="/dashboard/direction/projects/:id"
          element={<ProjectDetailsPage />}
        />

        <Route
          path="/dashboard/direction/team"
          element={<TeamPage />}
        />

        <Route
          path="/dashboard/direction/invitations"
          element={<DirectorInvitations />}
        />

        <Route
  path="/dashboard/direction/monitoring"
  element={<MonitoringPage />}
/>

       <Route
  path="/dashboard/direction/analytics"
  element={<FinancialHealthPage />}
/>

        <Route
          path="/dashboard/direction/ai"
          element={<AssistantPage />}
        />

        <Route
          path="/dashboard/direction/settings"
          element={<SettingsPage />}
        />

        <Route path="/dashboard/direction/planning" element={<PlanningPage />} />
        <Route path="/dashboard/direction/support" element={<TicketsPage />} />
        <Route path="/dashboard/direction/audit" element={<AuditLogPage />} />

        <Route
          path="/dashboard/direction/model"
          element={<AssistantPage />}
        />

        <Route
          path="/dashboard/direction/activity"
          element={
            <div className="text-white">
              Activity
            </div>
          }
        />
      </Route>

      {/* =========================
          CHEF DE PROJET
      ========================= */}

      <Route
        element={
          <PrivateRoute roles={["chef_de_projet"]}>
            <ChefLayout />
          </PrivateRoute>
        }
      >
        <Route
          path="/dashboard/chef"
          element={<ChefDashboard />}
        />
<Route
    path="/dashboard/chef/risk-predictions" // 👈 nouveau
    element={<RiskPredictionsPage />}
  />
        <Route
          path="/dashboard/chef/team"
          element={<TeamMembersPage />}
        />

        <Route
          path="/dashboard/chef/tasks"
          element={<TasksPage />}
        />

        <Route
          path="/dashboard/chef/tracking"
          element={<TrackingPage />}
        />

        <Route
          path="/dashboard/chef/settings"
          element={<SettingsPage />}
        />

        <Route path="/dashboard/chef/planning" element={<PlanningPage />} />

        <Route
          path="/dashboard/chef/models"
          element={<RiskModelsPage />}
        />

        <Route
          path="/dashboard/chef/assistant"
          element={<AssistantPage />}
        />
      </Route>

      {/* =========================
          EMPLOYÉS
      ========================= */}

      {/* Agent support : file de tickets en page d'accueil */}
      <Route
        element={
          <PrivateRoute roles={["agent_support"]}>
            <EmployeeLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard/support" element={<TicketsPage />} />
        <Route path="/dashboard/support/tasks" element={<MyTasksPage />} />
        <Route path="/dashboard/support/projects" element={<MyProjectsPage />} />
        <Route path="/dashboard/support/planning" element={<PlanningPage />} />
        <Route path="/dashboard/support/settings" element={<SettingsPage />} />
      </Route>

      {/* Membre d'équipe : ses tâches en page d'accueil */}
      <Route
        element={
          <PrivateRoute roles={["membre_equipe"]}>
            <EmployeeLayout />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard/membre" element={<MyTasksPage />} />
        <Route path="/dashboard/membre/projects" element={<MyProjectsPage />} />
        <Route path="/dashboard/membre/planning" element={<PlanningPage />} />
        <Route path="/dashboard/membre/settings" element={<SettingsPage />} />
      </Route>

      {/* =========================
          404
      ========================= */}

      <Route
        path="*"
        element={<NotFound />}
      />

    </Routes>
  );
}