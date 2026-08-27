import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

const LANGUAGES = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇹🇳" },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, right: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  const activeLanguage = (i18n.resolvedLanguage ?? i18n.language).split("-")[0];
  const current = LANGUAGES.find((l) => l.code === activeLanguage) ?? LANGUAGES[0];

  function toggleOpen() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
    setOpen((v) => !v);
  }

  function changeLanguage(code: string) {
    i18n.changeLanguage(code);
    setOpen(false);
  }

  // Ferme le menu si on redimensionne / scrolle, pour eviter un menu mal positionne
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={buttonRef}
        onClick={toggleOpen}
        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-gray-300 transition hover:border-[#22D3EE]/30 hover:text-white"
        aria-label="Changer de langue"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3 12h18M12 3c2.5 2.7 4 6.2 4 9s-1.5 6.3-4 9c-2.5-2.7-4-6.2-4-9s1.5-6.3 4-9Z" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        <span className="hidden sm:inline">{current.flag} {current.label}</span>
      </button>

      {open &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Fermer le menu des langues"
              className="fixed inset-0 z-[9998]"
              onClick={() => setOpen(false)}
            />
            <div
              className="fixed z-[9999] w-44 rounded-xl border border-white/10 bg-[#070D1C]/95 p-1.5 shadow-xl backdrop-blur-2xl"
              style={{ top: coords.top, right: coords.right }}
            >
              {LANGUAGES.map((lang) => (
                <button
                  type="button"
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-white/[0.05] ${
                    lang.code === current.code ? "text-[#22D3EE]" : "text-gray-300"
                  }`}
                >
                  <span>{lang.flag}</span>
                  {lang.label}
                  {lang.code === current.code && <span className="ml-auto text-xs">✓</span>}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}