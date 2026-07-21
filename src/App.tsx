import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CitizenPortal from "./components/CitizenPortal";
import PolicePortal from "./components/PolicePortal";
import { CaseItem } from "./types";
import { Landmark, ShieldAlert, Sparkles, AlertCircle } from "lucide-react";

export default function App() {
  const [currentPortal, setCurrentPortal] = useState<"citizen" | "police">("citizen");
  const [language, setLanguage] = useState<string>("en");
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serverActive, setServerActive] = useState<boolean>(true);

  // Fetch all cases from full-stack express server
  const fetchCases = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/cases");
      if (!response.ok) {
        throw new Error("Failed to contact database");
      }
      const data = await response.json();
      setCases(data);
      setServerActive(true);
    } catch (error) {
      console.error("Database connection failure:", error);
      setServerActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  // Update cases on new e-FIR submission
  const handleNewFIR = (newCase: CaseItem) => {
    setCases((prev) => [newCase, ...prev]);
  };

  // Update specific case timeline or status
  const handleUpdateCase = (updatedCase: CaseItem) => {
    setCases((prev) => prev.map((c) => (c.id === updatedCase.id ? updatedCase : c)));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans" id="app-root-container">
      {/* Top Header Navigation */}
      <Header
        currentPortal={currentPortal}
        setCurrentPortal={setCurrentPortal}
        language={language}
        setLanguage={setLanguage}
      />

      {/* Alert if Server is Offline */}
      {!serverActive && (
        <div className="bg-error-container text-on-error-container p-3 text-xs font-bold text-center border-b border-error/20 flex items-center justify-center gap-2">
          <AlertCircle className="h-4 w-4 text-error" />
          <span>Warning: App is running in Local Fallback mode because the Express Server is booting or offline. Some AI legal assessments may be slow.</span>
        </div>
      )}

      {/* India National Banner Info bar */}
      <div className="bg-primary text-white py-2 text-[10px] sm:text-xs font-extrabold text-center tracking-widest uppercase flex items-center justify-center gap-3">
        <span className="flex items-center gap-1"><Landmark className="h-3 w-3" /> Ministry of Home Affairs</span>
        <span>•</span>
        <span className="flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Cyber Crime Cell Command</span>
        <span>•</span>
        <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-secondary-container" /> Indian Penal Code (BNS 2023) Certified</span>
      </div>

      {/* Main Body */}
      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {currentPortal === "citizen" ? (
            <motion.div
              key="citizen-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <CitizenPortal
                language={language}
                cases={cases}
                onNewFIR={handleNewFIR}
                isLoadingCases={isLoading}
              />
            </motion.div>
          ) : (
            <motion.div
              key="police-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <PolicePortal
                cases={cases}
                onUpdateCase={handleUpdateCase}
                onRefreshCases={fetchCases}
                isLoadingCases={isLoading}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Official Footer */}
      <Footer />
    </div>
  );
}
