import React from "react";
import { ShieldAlert, Info, Globe } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950/40 backdrop-blur-md border-t border-cyan-500/15 mt-16 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-cyan-500/10 pb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-16 bg-slate-950/60 p-1.5 border border-cyan-500/20 rounded shadow-[0_0_15px_rgba(6,182,212,0.1)] flex items-center justify-center overflow-hidden">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqiDxW0IyT_WCLQkXCtBvkmkTDH0gdTS9U7UKbaF6HHZi11Xn0jOYHXx75TniXkgtRDAqPr4ZoSPp63B98SvJAgmWR4m8geZUKX5uY9mo9M2T2IfVjeB_YecgNVrjiAPywlRQmR8wKJ1ToyGD4MNUOmVPV3D1kdL2NZDOd8ZHsXeUDTrIbnRwV4fZMuurp4sokUcRK51h_CqY_aIcQuiPeHPVPFtPNnM4LNSuB9SVXJKufofhbkwdJAqJWJzcH_m4YbSEqi6zk-NYj"
                alt="State Emblem of India"
                className="h-full object-contain filter brightness-110 contrast-125"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="font-mono font-extrabold text-primary uppercase text-xs sm:text-sm leading-tight tracking-widest">
                Government of India
              </p>
              <p className="text-slate-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mt-0.5">
                Ministry of Home Affairs | National Cyber Crime Division
              </p>
            </div>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono font-bold text-slate-400">
            <a href="#privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-primary transition-colors">
              Terms of Service
            </a>
            <a href="#accessibility" className="hover:text-primary transition-colors">
              Accessibility Statement
            </a>
            <a href="#help" className="hover:text-primary transition-colors">
              Help & FAQ
            </a>
          </nav>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-mono font-bold text-slate-400">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <span>© 2026 National Cyber Crime Reporting Portal. Ministry of Electronics & IT (MeitY) Certified.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldAlert className="h-3.5 w-3.5" /> Secure 256-Bit SSL
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <Info className="h-3.5 w-3.5" /> BNSS & BSA compliant
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
