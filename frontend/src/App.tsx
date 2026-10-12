import { BrowserRouter as Router } from "react-router";

import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import Toaster from "./components/ui-nexus/Toaster";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <Toaster />
      </Router>
    </AuthProvider>
  );
}