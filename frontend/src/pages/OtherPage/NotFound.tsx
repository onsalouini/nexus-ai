import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import PageMeta from "../../components/common/PageMeta";
import LanguageSwitcher from "../../components/common/LanguageSwitcher";
import { useAuth, getDashboardPath } from "../../context/AuthContext";

export default function NotFound() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const target = user ? getDashboardPath(user.role) : "/";

  return (
    <>
      <PageMeta title={`404 | NEXUS AI`} description={t("common.notFound.title")} />

      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#030712] px-4 font-['Inter',sans-serif] text-white">
        <div className="pointer-events-none absolute -start-40 top-[15%] h-[420px] w-[420px] rounded-full bg-[#22D3EE]/10 blur-[150px]" />
        <div className="pointer-events-none absolute -end-40 bottom-[10%] h-[420px] w-[420px] rounded-full bg-[#8B5CF6]/10 blur-[150px]" />

        <div className="absolute end-4 top-4 sm:end-6 sm:top-6">
          <LanguageSwitcher />
        </div>

        <div className="relative w-full max-w-md text-center">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-[#67E8F9]">
            {t("common.notFound.eyebrow")}
          </p>

          <h1 className="mt-4 bg-gradient-to-r from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] bg-clip-text font-['Space_Grotesk',sans-serif] text-[96px] font-bold leading-none text-transparent">
            404
          </h1>

          <h2 className="mt-4 text-xl font-semibold">{t("common.notFound.title")}</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">{t("common.notFound.text")}</p>

          <Link
            to={target}
            className="mt-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 text-sm font-semibold text-[#04101f] transition hover:opacity-90"
          >
            {user ? t("common.notFound.backDashboard") : t("common.notFound.backHome")}
          </Link>
        </div>

        <p className="absolute bottom-6 text-xs text-slate-600">
          © {new Date().getFullYear()} NEXUS AI
        </p>
      </div>
    </>
  );
}
