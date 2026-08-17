import { BrowserRouter as Router, Routes, Route } from "react-router";

import SignIn from "./pages/AuthPages/SignIn";
import SignUp from "./pages/AuthPages/SignUp";
import NotFound from "./pages/OtherPage/NotFound";

import Landing from "./pages/Landing";
import CompanyForm from "./pages/Onboarding/CompanyForm";

import DirectorInvitations from "./pages/DirectorInvitations";

import PrivateRoute from "./components/PrivateRoute";
import { AuthProvider } from "./context/AuthContext";

import InvitationWelcome from "./pages/AuthPages/InvitationWelcome";
import SignUpComplete from "./pages/AuthPages/SignUpComplete";

import ChefDashboard from "./pages/Dashboard/ChefDashboard";
import ChefLayout from "./components/chef/ChefLayout";
import TeamMembersPage from "./pages/Chef/TeamMembersPage";
import TasksPage from "./pages/Chef/TasksPage";
import RiskModelsPage from "./pages/Chef/RiskModelsPage";
import DirectionDashboard from "./components/director/DirectionDashboard";
import DirectorLayout from "./components/director/DirectorLayout";
import ProjectsPage from "./components/director/ProjectsPage";
import ProjectDetailsPage from "./components/director/ProjectDetailsPage";
import TeamPage from "./components/director/TeamPage";
export default function App() {
  return (
    <AuthProvider>
      <Router>
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
              <PrivateRoute>
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
              element={
                <div className="text-white">
                  Monitoring
                </div>
              }
            />

            <Route
              path="/dashboard/direction/analytics"
              element={
                <div className="text-white">
                  Analytics
                </div>
              }
            />

            <Route
              path="/dashboard/direction/ai"
              element={
                <div className="text-white">
                  NEXUS AI
                </div>
              }
            />

            <Route
              path="/dashboard/direction/settings"
              element={
                <div className="text-white">
                  Settings
                </div>
              }
            />

            <Route
              path="/dashboard/direction/model"
              element={
                <div className="text-white">
                  Modèle IA
                </div>
              }
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
              <PrivateRoute>
                <ChefLayout />
              </PrivateRoute>
            }
          >
            <Route
              path="/dashboard/chef"
              element={<ChefDashboard />}
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
              path="/dashboard/chef/models"
              element={<RiskModelsPage />}
            />
          </Route>

          {/* =========================
              404
          ========================= */}

          <Route
            path="*"
            element={<NotFound />}
          />

        </Routes>
      </Router>
    </AuthProvider>
  );
}