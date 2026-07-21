import React from "react";
import { Shield, User, Landmark, Languages } from "lucide-react";

interface HeaderProps {
  currentPortal: "citizen" | "police";
  setCurrentPortal: (portal: "citizen" | "police") => void;
  language: string;
  setLanguage: (lang: string) => void;
}

export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "gu", label: "ગુજરાતી (Gujarati)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
  { code: "bn", label: "বাংলা (Bengali)" },
];

export default function Header({
  currentPortal,
  setCurrentPortal,
  language,
  setLanguage,
}: HeaderProps) {
  const [langDropdownOpen, setLangDropdownOpen] = React.useState(false);

  const selectedLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-950/60 backdrop-blur-md border-b border-cyan-500/15 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-container border border-primary/30 rounded-lg text-primary shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse">
              <Landmark className="h-5 w-5" id="header-landmark-icon" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-primary flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                JusticeAI
              </span>
              <span className="hidden sm:inline-block text-[9px] font-mono font-bold text-cyan-400/80 uppercase tracking-widest block leading-none">
                Cyber Intelligence & Law Desk
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                id="language-toggle-btn"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold text-primary border border-cyan-500/25 hover:bg-cyan-500/10 rounded-md transition-all cursor-pointer"
              >
                <Languages className="h-3.5 w-3.5" />
                <span className="hidden md:inline">{selectedLang.label}</span>
                <span className="inline md:hidden">{selectedLang.code.toUpperCase()}</span>
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md bg-slate-950/90 backdrop-blur-lg border border-cyan-500/25 shadow-2xl z-50 py-1 font-mono">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code);
                        setLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-cyan-500/10 font-semibold block transition-colors ${
                        language === lang.code ? "text-primary font-bold bg-cyan-500/15" : "text-slate-300"
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Portal Toggle Selector */}
            <div className="flex items-center bg-slate-950/80 rounded-lg p-1 border border-cyan-500/25 shadow-[0_0_15px_rgba(0,0,0,0.2)]">
              <button
                id="portal-toggle-citizen"
                onClick={() => setCurrentPortal("citizen")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentPortal === "citizen"
                    ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    : "text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Citizen Portal
              </button>
              <button
                id="portal-toggle-police"
                onClick={() => setCurrentPortal("police")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  currentPortal === "police"
                    ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                    : "text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                Police Command
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
