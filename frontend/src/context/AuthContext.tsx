import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../lib/api";
import i18n, { normalizeLanguage, type AppLanguage } from "../i18n";

export type UserRole = "direction" | "chef_de_projet" | "agent_support" | "membre_equipe" | "client";

type Company = { id: number; name: string } | null;

export type NexusUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  avatar_path?: string | null;
  avatar_color?: string | null;
  email_alerts?: boolean;
  job_title?: string | null;
  role: UserRole | null;
  company: Company;
  locale?: AppLanguage | null;
  two_factor_enabled?: boolean;
};

type LoginResult = {
  needsCompanySetup: boolean;
  role: UserRole | null;
  // Présent quand la double authentification est active : il faut ensuite appeler verifyTwoFactor
  twoFactorChallenge?: string;
};

type AuthResponse = {
  token?: string;
  user?: NexusUser;
  needs_company_setup?: boolean;
  two_factor_required?: boolean;
  challenge?: string;
};

type AuthContextType = {
  user: NexusUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyTwoFactor: (challenge: string, code: string) => Promise<LoginResult>;
  register: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) => Promise<{ needsCompanySetup: boolean }>;
  registerWithFiles: (formData: FormData) => Promise<{ needsCompanySetup: boolean; role: UserRole | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<NexusUser | null>;
  setUser: (user: NexusUser) => void;
  changeLanguage: (language: AppLanguage) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getDashboardPath(role: UserRole | null): string {
  switch (role) {
    case "direction":
      return "/dashboard/direction";
    case "chef_de_projet":
      return "/dashboard/chef";
    case "agent_support":
      return "/dashboard/support";
    case "membre_equipe":
      return "/dashboard/membre";
    case "client":
      return "/dashboard/client";
    default:
      return "/dashboard";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<NexusUser | null>(null);
  const [loading, setLoading] = useState(true);

  // La langue enregistrée sur le profil l'emporte : elle suit l'utilisateur sur tous ses appareils
  function applyUser(next: NexusUser | null) {
    setUserState(next);
    if (next?.locale && normalizeLanguage(i18n.language) !== next.locale) {
      void i18n.changeLanguage(next.locale);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("nexus_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/me")
      .then((res) => applyUser(res.data))
      .catch(() => {
        localStorage.removeItem("nexus_token");
      })
      .finally(() => setLoading(false));
  }, []);

  function handleAuthResponse(data: AuthResponse): LoginResult {
    if (data.two_factor_required && data.challenge) {
      return { needsCompanySetup: false, role: null, twoFactorChallenge: data.challenge };
    }

    localStorage.setItem("nexus_token", data.token ?? "");
    applyUser(data.user ?? null);

    return {
      needsCompanySetup: Boolean(data.needs_company_setup),
      role: (data.user?.role ?? null) as UserRole | null,
    };
  }

  async function login(email: string, password: string) {
    const res = await api.post<AuthResponse>("/login", { email, password });
    return handleAuthResponse(res.data);
  }

  async function verifyTwoFactor(challenge: string, code: string) {
    const res = await api.post<AuthResponse>("/auth/2fa/verify", { challenge, code });
    return handleAuthResponse(res.data);
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
    applyUser(res.data.user);
    return { needsCompanySetup: res.data.needs_company_setup };
  }

  async function registerWithFiles(formData: FormData) {
    const res = await api.post("/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    localStorage.setItem("nexus_token", res.data.token);
    applyUser(res.data.user);
    return {
      needsCompanySetup: res.data.needs_company_setup,
      role: res.data.user.role,
    };
  }

  // Recharge l'utilisateur (ex : après la création de l'entreprise)
  async function refreshUser() {
    const res = await api.get("/me");
    applyUser(res.data);
    return res.data as NexusUser;
  }

  /* Change la langue de l'interface et la mémorise sur le profil si l'utilisateur est connecté */
  async function changeLanguage(language: AppLanguage) {
    await i18n.changeLanguage(language);
    if (!user) return;

    setUserState({ ...user, locale: language });
    try {
      await api.put("/account/locale", { locale: language });
    } catch {
      /* la langue reste appliquée localement même si l'enregistrement échoue */
    }
  }

  async function logout() {
    try {
      await api.post("/logout");
    } finally {
      localStorage.removeItem("nexus_token");
      setUserState(null);
      window.location.href = "/signin";
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verifyTwoFactor,
        register,
        registerWithFiles,
        logout,
        refreshUser,
        setUser: applyUser,
        changeLanguage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans un <AuthProvider>");
  return ctx;
}
