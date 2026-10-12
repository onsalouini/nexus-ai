import { Navigate } from "react-router";
import { useTranslation } from "react-i18next";
import { useAuth, getDashboardPath, UserRole } from "../context/AuthContext";
import { ReactNode } from "react";

export default function PrivateRoute({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: UserRole[];
}) {
  const { t } = useTranslation();
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-sm text-gray-400">
        {t("common.loading")}
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Rôle non autorisé : renvoi vers l'espace correspondant à son rôle
  if (roles && (!user.role || !roles.includes(user.role))) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return <>{children}</>;
}
