import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../lib/api";

export type UserRole = "direction" | "chef_de_projet" | "agent_support" | "membre_equipe";

type Company = { id: number; name: string } | null;

export type NexusUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_path?: string | null;
  role: UserRole | null;
  company: Company;
};

type AuthContextType = {
  user: NexusUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ needsCompanySetup: boolean; role: UserRole | null }>;
  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<{ needsCompanySetup: boolean }>;
  registerWithFiles: (formData: FormData) => Promise<{ needsCompanySetup: boolean; role: UserRole | null }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export function getDashboardPath(role: UserRole | null): string {
  switch (role) {
    case "direction":
      //return "/dashboard/team";
      return "/dashboard/direction";
    case "chef_de_projet":
      return "/dashboard/chef";
    case "agent_support":
      return "/dashboard/support";
    default:
      return "/dashboard";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<NexusUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("nexus_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/me")
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem("nexus_token");
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
  const res = await api.post("/login", { email, password });
  localStorage.setItem("nexus_token", res.data.token);
  setUser(res.data.user);
  const role = res.data.user?.role as UserRole | null;
  console.log("[login] role reçu du backend :", role);
  console.log("[login] user complet reçu :", res.data.user);
  return { needsCompanySetup: res.data.needs_company_setup, role };
}

  async function register(data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) {
    const res = await api.post("/register", data);
    localStorage.setItem("nexus_token", res.data.token);
    setUser(res.data.user);
    return { needsCompanySetup: res.data.needs_company_setup };
  }

  async function registerWithFiles(formData: FormData) {
  const res = await api.post("/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  localStorage.setItem("nexus_token", res.data.token);
  setUser(res.data.user);
  return {
    needsCompanySetup: res.data.needs_company_setup,
    role: res.data.user.role,
  };
}

  async function logout() {
    try {
      await api.post("/logout");
    } finally {
      localStorage.removeItem("nexus_token");
      setUser(null);
      window.location.href = "/signin";
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, registerWithFiles, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  return ctx;
}