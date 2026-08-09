import axios from "axios";

// backend Laravel — adapte l'URL si besoin (voir .env du frontend : VITE_API_URL)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  headers: { Accept: "application/json" },
});

// attache automatiquement le token stocké après login/register
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nexus_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// si le token expire ou est invalide, on nettoie et on renvoie vers /login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("nexus_token");
      localStorage.removeItem("nexus_user");
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);