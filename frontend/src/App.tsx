import { BrowserRouter as Router } from "react-router";

import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}