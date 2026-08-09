import React from "react";
import { Link } from "react-router";
import ThemeTogglerTwo from "../../components/common/ThemeTogglerTwo";

const signals = [
  { label: "Risque projet", color: "#16B378", top: "18%", left: "22%" },
  { label: "Support client", color: "#2E9BE6", top: "62%", left: "14%" },
  { label: "Santé financière", color: "#F2497A", top: "40%", left: "78%" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative p-6 bg-white z-1 dark:bg-gray-900 sm:p-0">
      <div className="relative flex flex-col justify-center w-full h-screen lg:flex-row dark:bg-gray-900 sm:p-0">
        {children}

        {/* Panneau de marque NEXUS AI — remplace le logo générique du template */}
        <div className="relative items-center hidden w-full h-full overflow-hidden lg:w-1/2 bg-[#0B1021] lg:grid">
          {/* halo de fond coloré (mêmes teintes que la Landing) */}
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <div className="absolute -left-20 top-0 h-80 w-80 rounded-full bg-[#16B378] blur-[110px]" />
            <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-[#2E9BE6] blur-[110px]" />
            <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-[#F2497A] blur-[110px]" />
          </div>

          {/* points animés représentant les 3 signaux */}
          {signals.map((s) => (
            <span
              key={s.label}
              className="absolute h-2.5 w-2.5 animate-pulse rounded-full"
              style={{ backgroundColor: s.color, top: s.top, left: s.left }}
            />
          ))}

          <div className="relative flex flex-col items-center max-w-xs px-6 text-center">
            <Link to="/" className="mb-6 flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#16B378] via-[#2E9BE6] to-[#F2497A] font-['Space_Grotesk',sans-serif] text-sm font-bold text-white shadow-md shadow-[#2E9BE6]/20">
                N
              </div>
              <span className="font-['Space_Grotesk',sans-serif] text-lg font-bold tracking-tight text-slate-900">
                NEXUS <span className="text-[#2E9BE6]">AI</span>
              </span>
            </Link>

            <p className="font-['Space_Grotesk',sans-serif] text-3xl font-bold tracking-tight text-slate-900">
              Trois signaux. Un score. Une décision claire.
            </p>
            <p className="mt-3 text-base leading-relaxed text-slate-500">
              Projets, support client et santé financière, fusionnés en un score
              de santé d'entreprise unique et expliqué.
            </p>

            <div className="mt-8 flex flex-col items-start gap-2.5">
              {signals.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-xs font-medium text-slate-400">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="fixed z-50 hidden bottom-6 right-6 sm:block">
          <ThemeTogglerTwo />
        </div>
      </div>
    </div>
  );
}