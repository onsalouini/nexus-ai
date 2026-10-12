import axios from "axios";
import i18n from "../i18n";
import { toast } from "./toast";

// backend Laravel — adapte l'URL si besoin (voir .env du frontend : VITE_API_URL)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  headers: { Accept: "application/json" },
});

// Requêtes où un 401 signifie "identifiants invalides", pas "session expirée"
const AUTH_ENDPOINTS = ["/login", "/register", "/auth/send-code", "/auth/verify-code", "/auth/2fa/verify"];

// attache automatiquement le token stocké après login/register + la langue active
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nexus_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Accept-Language"] = (i18n.resolvedLanguage ?? i18n.language ?? "fr").split("-")[0];
  return config;
});

// si le token expire ou est invalide, on nettoie et on renvoie vers /signin
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url ?? "";
    const isAuthRequest = AUTH_ENDPOINTS.some((endpoint) => url.endsWith(endpoint));

    // Erreurs génériques signalées par un toast (les erreurs métier restent gérées par les pages)
    const status: number | undefined = error.response?.status;
    if (!error.response && error.code !== "ERR_CANCELED") {
      toast.error(i18n.t("common.networkError"));
    } else if (status === 403) {
      toast.error(error.response?.data?.message || i18n.t("common.forbidden"));
    } else if (status === 500) {
      toast.error(error.response?.data?.message || i18n.t("common.serverError"));
    }

    if (status === 401 && !isAuthRequest) {
      localStorage.removeItem("nexus_token");
      localStorage.removeItem("nexus_user");
      if (window.location.pathname !== "/signin") {
        window.location.href = "/signin";
      }
    }
    return Promise.reject(error);
  }
);
