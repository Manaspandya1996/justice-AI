import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  ShieldAlert,
  Clock,
  CheckCircle,
  FileText,
  Fingerprint,
  Upload,
  AlertTriangle,
  MapPin,
  Phone,
  BookOpen,
  Volume2,
  Mic,
  MicOff,
  UserCheck,
  Check,
  RotateCcw,
  Plus,
  Trash2,
  Download
} from "lucide-react";
import { AnalysisResult, CaseItem } from "../types";

interface CitizenPortalProps {
  language: string;
  cases: CaseItem[];
  onNewFIR: (newCase: CaseItem) => void;
  isLoadingCases: boolean;
}

const TEMPLATES = [
  {
    label: "WhatsApp UPI Scam",
    text: "Someone on WhatsApp offered me a work-from-home job and asked me to scan a QR code to receive my first payment. Instead of getting money, ₹12,000 was debited from my bank account."
  },
  {
    label: "Instagram Hacked & Extorted",
    text: "My Instagram account was hacked. The hacker changed my recovery email and is now messaging my followers demanding ₹15,000, threatening to leak edited pictures of me if I don't pay."
  },
  {
    label: "Assault & Robbery",
    text: "Two boys blocked my path on a motorbike near Sector 12, assaulted me with wooden sticks, and stole my gold chain and wallet containing ₹4,000 cash."
  },
  {
    label: "Bank OTP Fraud",
    text: "I received a phone call from someone claiming to be SBI bank manager. They said my card was blocked and asked for the OTP sent to my phone. I gave it, and instantly ₹45,000 was debited from my account."
  }
];

export default function CitizenPortal({
  language,
  cases,
  onNewFIR,
  isLoadingCases
}: CitizenPortalProps) {
  // Tabs: 'assistant' | 'dashboard' | 'rights' | 'fir'
  const [activeTab, setActiveTab] = useState<"assistant" | "dashboard" | "rights" | "fir">("assistant");

  // Chat Assistant State
  const [inputMessage, setInputMessage] = useState("");
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "user" | "ai"; text: string; analysis?: AnalysisResult }>>([
    {
      sender: "ai",
      text: "Namaste. I am your AI Legal Assistant. Please describe what happened in your own words (e.g. UPI fraud, hacking, theft, harassment). I will identify applicable laws, translate provisions, suggest evidence checklist, and guide you through a secure e-FIR submission."
    }
  ]);

  // STT / Mic transcription state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Sound TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);

  // --- One-Click FIR Form State ---
  const [firStep, setFirStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [complainantName, setComplainantName] = useState("");
  const [complainantPhone, setComplainantPhone] = useState("");
  const [complainantAadhaar, setComplainantAadhaar] = useState("");
  const [aadhaarVerified, setAadhaarVerified] = useState(false);
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [uploadedEvidence, setUploadedEvidence] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [isFiling, setIsFiling] = useState(false);
  const [filedId, setFiledId] = useState<string | null>(null);

  // HTML5 Canvas for Signature state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);

  // Dashboard state
  const [selectedDashboardCase, setSelectedDashboardCase] = useState<CaseItem | null>(null);

  // Setup Web Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === "hi" ? "hi-IN" : language === "gu" ? "gu-IN" : "en-IN";

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage((prev) => (prev ? prev + " " + transcript : transcript));
        setIsListening(false);
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, [language]);

  // Handle Voice Recording
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser version. Please type your query.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  // Text to Speech
  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      if (language === "hi") utterance.lang = "hi-IN";
      else if (language === "gu") utterance.lang = "gu-IN";
      else utterance.lang = "en-IN";

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Text-to-speech is not supported in this browser.");
    }
  };

  // Trigger Analyze Incident via Express Server Endpoint
  const handleAnalyze = async (descToAnalyze: string) => {
    const text = descToAnalyze.trim();
    if (!text) return;

    setIsAnalysing(true);
    setAnalysisResult(null);

    // Append user message
    setChatHistory((prev) => [...prev, { sender: "user", text }]);

    try {
      const res = await fetch("/api/analyze-incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: text })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to analyze incident.");
      }

      const data: AnalysisResult = await res.json();
      setAnalysisResult(data);
      
      // Seed prefilled data for FIR
      setComplainantName("");
      setComplainantPhone("");
      setAadhaarVerified(false);
      setAadhaarOtpSent(false);
      setUploadedEvidence([]);

      setChatHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Incident analyzed successfully with **${data.confidenceScore}% confidence**. I have categorized this under **${data.category} - ${data.crimeType}** with **${data.severity} severity**. Citing applicable statutes: ${data.applicableSections.map((s) => `${s.act} ${s.section}`).join(", ")}.`,
          analysis: data
        }
      ]);
    } catch (error: any) {
      console.error(error);
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `⚠️ **Analysis Error:** ${error.message || "An unexpected error occurred while communicating with the AI Engine. Please check your Gemini API configuration."}`
        }
      ]);
    } finally {
      setIsAnalysing(false);
      setInputMessage("");
    }
  };

  // Drag and Drop File Uploader
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files).map((f: any) => f.name);
      setUploadedEvidence((prev) => [...prev, ...files]);
    }
  };

  // Canvas Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000666";

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureData(canvasRef.current.toDataURL());
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  };

  // Aadhaar Mock OTP Trigger
  const handleSendAadhaarOtp = () => {
    if (!complainantAadhaar || complainantAadhaar.length < 12) {
      alert("Please enter a valid 12-digit Aadhaar Card Number.");
      return;
    }
    setAadhaarOtpSent(true);
    alert("JusticeAI Mock Aadhaar System: OTP has been successfully dispatched to the mobile number linked to Aadhaar. Enter OTP '1930' to verify.");
  };

  const handleVerifyAadhaarOtp = () => {
    if (aadhaarOtp === "1930") {
      setAadhaarVerified(true);
      alert("Identity Verified successfully via UIDAI central secure server.");
    } else {
      alert("Invalid OTP code. Please enter '1930' to simulate successful verification.");
    }
  };

  // Submit final FIR to Node DB
  const handleSubmitFIR = async () => {
    if (!analysisResult) return;
    if (!aadhaarVerified) {
      alert("Please verify your Identity via Aadhaar before submitting.");
      return;
    }
    if (!signatureData) {
      alert("Please sign in the digital signature box.");
      return;
    }
    if (!declarationChecked) {
      alert("Please accept the legal declaration terms (Section 191 IPC compliance).");
      return;
    }

    setIsFiling(true);

    try {
      const response = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complainantName,
          complainantPhone,
          complainantAadhaar,
          incidentDate: new Date().toISOString(),
          incidentDescription: chatHistory[chatHistory.length - 2]?.text || "E-FIR description logged via assistant.",
          category: analysisResult.category,
          crimeType: analysisResult.crimeType,
          severity: analysisResult.severity,
          urgencyLevel: analysisResult.urgencyLevel,
          riskScore: analysisResult.riskScore,
          evidence: uploadedEvidence,
          signature: signatureData,
          analysis: analysisResult
        })
      });

      if (!response.ok) {
        throw new Error("Failed to file complaint.");
      }

      const data: CaseItem = await response.json();
      onNewFIR(data);
      setFiledId(data.id);
      setFirStep(5);
    } catch (e) {
      alert("Failed to submit FIR: " + e);
    } finally {
      setIsFiling(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="citizen-portal-container">
      {/* Sidebar navigation */}
      <aside className="col-span-12 lg:col-span-3 flex flex-col gap-4">
        {/* Quick info card */}
        <div className="glass-panel p-5 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)] border-cyan-500/10">
          <div className="flex items-center gap-2 text-primary font-mono font-bold mb-3">
            <ShieldAlert className="h-5 w-5 animate-pulse" />
            <h3 className="text-xs uppercase tracking-wider">Citizen Services</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Authorized portal to access national crime data and consult certified AI Legal advisors.
          </p>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => setActiveTab("assistant")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                activeTab === "assistant"
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/35 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  : "bg-slate-950/40 text-slate-400 border-white/5 hover:bg-cyan-500/10 hover:text-cyan-300"
              }`}
            >
              <Sparkles className="h-4 w-4 text-cyan-400" /> AI Legal Assistant
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/35 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  : "bg-slate-950/40 text-slate-400 border-white/5 hover:bg-cyan-500/10 hover:text-cyan-300"
              }`}
            >
              <FileText className="h-4 w-4 text-cyan-400" /> Case Status Dashboard
            </button>
            <button
              onClick={() => setActiveTab("rights")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-2 border cursor-pointer ${
                activeTab === "rights"
                  ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/35 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                  : "bg-slate-950/40 text-slate-400 border-white/5 hover:bg-cyan-500/10 hover:text-cyan-300"
              }`}
            >
              <BookOpen className="h-4 w-4 text-cyan-400" /> Constitutional Safeguards
            </button>
          </div>
        </div>

        {/* Emergencies Box */}
        <div className="glass-panel p-5 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.2)] border-red-500/20">
          <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest mb-3">Emergency Helpline</h4>
          <a
            href="tel:1930"
            className="w-full flex items-center justify-center gap-2 py-3 bg-red-950/40 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all rounded-lg font-mono font-bold text-xs border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
          >
            <Phone className="h-4 w-4 text-red-400" />
            Call National Helpline (1930)
          </a>
          <p className="text-[10px] font-mono text-center text-slate-400 mt-2">
            Immediate financial freeze assistance for active banking frauds. Available 24/7.
          </p>
        </div>
      </aside>

      {/* Main Tab Panels */}
      <main className="col-span-12 lg:col-span-9">
        {activeTab === "assistant" && (
          <div className="flex flex-col gap-6">
            {/* Chat Frame */}
            <div className="glass-panel-glow rounded-xl flex flex-col h-[600px] shadow-[0_8px_32px_0_rgba(6,182,212,0.15)] overflow-hidden">
              <div className="p-4 border-b border-cyan-500/15 bg-slate-950/60 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]"></span>
                  <span className="text-xs font-mono font-extrabold text-cyan-400 uppercase tracking-wider">
                    JusticeAI Legal Advisor Active
                  </span>
                </div>
                <span className="text-[10px] text-cyan-400 bg-slate-950/80 border border-cyan-500/20 px-2 py-1 rounded font-mono font-bold uppercase tracking-wide">
                  BNS 2023 Compliant
                </span>
              </div>

              {/* Chat history */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-4 custom-scrollbar">
                {chatHistory.map((msg, index) => (
                  <div key={index} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.sender === "user" ? (
                      <div className="bg-cyan-950/40 text-cyan-200 border border-cyan-500/25 p-4 rounded-2xl rounded-tr-none max-w-[85%] text-xs font-mono leading-relaxed">
                        {msg.text}
                      </div>
                    ) : (
                      <div className="bg-slate-950/60 border border-cyan-500/15 p-4 sm:p-5 rounded-2xl rounded-tl-none max-w-[90%] shadow-lg flex flex-col gap-4 border-l-4 border-l-cyan-400">
                        <div className="flex items-center gap-2 text-cyan-400 font-mono">
                          <Sparkles className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">AI Analysis Result</span>
                        </div>
                        <div className="text-xs text-slate-300 leading-relaxed font-medium">
                          {msg.text}
                        </div>

                        {/* Rendering core analysis results dynamically inside chat */}
                        {msg.analysis && (
                          <div className="flex flex-col gap-4 mt-2 font-sans">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="bg-slate-900/50 p-3 rounded-lg border border-cyan-500/15">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold mb-1">
                                  Incident Category
                                </p>
                                <p className="font-extrabold text-cyan-400 text-xs">{msg.analysis.category}</p>
                              </div>
                              <div className="bg-red-950/30 p-3 rounded-lg border border-red-500/25">
                                <p className="text-[10px] text-red-300 uppercase tracking-wider font-mono font-bold mb-1">
                                  Severity Level
                                </p>
                                <p className="font-extrabold text-red-400 text-xs flex items-center gap-1">
                                  <AlertTriangle className="h-3.5 w-3.5" />
                                  {msg.analysis.severity} Risk ({msg.analysis.urgencyLevel})
                                </p>
                              </div>
                            </div>

                            {/* Section breakdown cards */}
                            <div className="bg-slate-900/40 p-4 rounded-lg border border-cyan-500/15">
                              <p className="text-xs font-mono font-bold text-cyan-400 mb-3 flex items-center gap-1.5">
                                <BookOpen className="h-4 w-4 text-cyan-400" /> Applicable Legal Sections
                              </p>
                              <div className="space-y-3">
                                {msg.analysis.applicableSections.map((sec, sIdx) => (
                                  <div key={sIdx} className="bg-slate-950/80 p-3 rounded border border-cyan-500/10 shadow-xs">
                                    <div className="flex justify-between items-center mb-1">
                                      <span className="font-mono font-extrabold text-xs text-cyan-400">
                                        {sec.act} : {sec.section}
                                      </span>
                                      <span className="text-[9px] bg-cyan-500/10 text-cyan-400 font-extrabold px-1.5 py-0.5 rounded border border-cyan-500/20">
                                        {sec.bailable ? "Bailable" : "Non-Bailable"}
                                      </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-300 mb-1">{sec.title}</p>
                                    <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">
                                      <span className="font-bold text-cyan-400">Why Applies:</span> {sec.whyApplies}
                                    </p>
                                    <p className="text-[9px] text-slate-300 bg-slate-900/60 p-1.5 rounded border border-white/5">
                                      <span className="font-bold text-cyan-400">Max Punishment:</span> {sec.punishmentMax} |{" "}
                                      <span className="font-bold text-cyan-400">Trial Court:</span> {sec.court}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Bilingual Multi-Language Explanations */}
                            <div className="bg-slate-900/50 p-4 rounded-lg border border-cyan-500/15">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-mono font-bold text-cyan-400">Bilingual Simple Explanation</span>
                                <button
                                  onClick={() => speakText(msg.analysis!.simpleExplanation.english)}
                                  className="p-1 text-cyan-400 hover:bg-cyan-500/10 rounded transition-all cursor-pointer"
                                  title="Listen out loud"
                                >
                                  <Volume2 className="h-4 w-4" />
                                </button>
                              </div>
                              <div className="space-y-3 text-xs">
                                <div className="border-l-2 border-cyan-400 pl-2.5">
                                  <p className="font-mono font-bold text-cyan-400 text-[10px]">Simple English</p>
                                  <p className="text-slate-300 mt-0.5">{msg.analysis.simpleExplanation.english}</p>
                                </div>
                                <div className="border-l-2 border-emerald-400 pl-2.5">
                                  <p className="font-mono font-bold text-emerald-400 text-[10px]">सरल हिंदी (Hindi)</p>
                                  <p className="text-slate-300 mt-0.5">{msg.analysis.simpleExplanation.hindi}</p>
                                </div>
                                <div className="border-l-2 border-purple-400 pl-2.5">
                                  <p className="font-mono font-bold text-purple-400 text-[10px]">સરળ ગુજરાતી (Gujarati)</p>
                                  <p className="text-slate-300 mt-0.5">{msg.analysis.simpleExplanation.gujarati}</p>
                                </div>
                              </div>
                            </div>

                            {/* Step Navigator */}
                            <div className="border-t border-cyan-500/15 pt-3">
                              <p className="text-xs font-mono font-bold text-cyan-400 mb-2">Immediate Steps to Take:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                                {msg.analysis.steps.map((st, sIdx) => (
                                  <div key={sIdx} className="flex items-center gap-1.5 p-1.5 bg-slate-900/40 rounded border border-cyan-500/10">
                                    <CheckCircle className="h-3.5 w-3.5 text-cyan-400" />
                                    <span>{st}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setFirStep(1);
                                setComplainantName("");
                                setComplainantPhone("");
                                setAadhaarVerified(false);
                                setAadhaarOtpSent(false);
                                setUploadedEvidence([]);
                                setActiveTab("fir");
                              }}
                              className="w-full mt-2 py-3 bg-cyan-500 text-slate-950 font-mono font-extrabold text-xs rounded-lg flex items-center justify-center gap-2 hover:bg-cyan-400 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all active:scale-95 cursor-pointer"
                            >
                              <Fingerprint className="h-4 w-4" /> Begin Secure One-Click FIR Process
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {isAnalysing && (
                  <div className="flex justify-start">
                    <div className="bg-slate-950/80 border border-cyan-500/25 p-5 rounded-2xl rounded-tl-none max-w-[80%] shadow-[0_4px_25px_rgba(0,0,0,0.3)] flex items-center gap-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-400 border-t-transparent"></div>
                      <span className="text-xs font-mono font-semibold text-cyan-300">
                        JusticeAI is analyzing the incident structure, mapping legal acts, and compiling First Information Report parameters...
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-slate-950/50 border-t border-cyan-500/15 flex flex-col gap-2">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAnalyze(inputMessage)}
                    placeholder="Describe your situation in details (e.g. UPI fraud of ₹50,000, hacking, assault)..."
                    className="w-full py-3.5 pl-4 pr-24 bg-slate-900/60 border border-cyan-500/25 rounded-xl text-xs font-mono font-medium focus:ring-1 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-all text-slate-100 shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]"
                    disabled={isAnalysing}
                  />
                  <div className="absolute right-2 flex items-center gap-1.5">
                    <button
                      onClick={toggleListening}
                      className={`p-2 rounded-lg cursor-pointer ${
                        isListening ? "bg-red-500 text-white animate-pulse" : "text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10"
                      }`}
                      title="Dictate message (Speech to Text)"
                    >
                      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleAnalyze(inputMessage)}
                      className="bg-cyan-500 text-slate-950 p-2 rounded-lg hover:bg-cyan-400 active:scale-95 transition-all cursor-pointer"
                      disabled={isAnalysing}
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mt-1 sm:gap-2">
                  <span className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Quick Templates:</span>
                  {TEMPLATES.map((tpl, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputMessage(tpl.text)}
                      className="text-[10px] px-2.5 py-1 bg-slate-900/80 border border-cyan-500/15 rounded-full text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300 transition-all font-mono font-bold cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] font-mono text-center text-slate-400 mt-2 leading-tight">
                  Secured by Ministry of Electronics & IT (MeitY). Under Section 79 of IT Act, AI-generated legal assessments serve strictly as advisory documentation and do not replace legal counsel.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Dash Board Tab */}
        {activeTab === "dashboard" && (
          <div className="glass-panel rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.15)] flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-cyan-500/10 pb-4 gap-2">
              <div>
                <h3 className="text-base font-mono font-extrabold text-cyan-400">Your Incident Tracker</h3>
                <p className="text-xs text-slate-400">Track status of your filed complaints in real-time.</p>
              </div>
              <button
                onClick={() => {
                  setAnalysisResult(null);
                  setActiveTab("assistant");
                }}
                className="px-4 py-2 bg-cyan-500 text-slate-950 hover:bg-cyan-400 rounded-lg text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all cursor-pointer"
              >
                + File New Report
              </button>
            </div>

            {isLoadingCases ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-cyan-400 border-t-transparent"></div>
                <span className="text-xs font-mono font-semibold text-cyan-400">Connecting to Crime Intelligence DB...</span>
              </div>
            ) : cases.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 rounded-lg border border-dashed border-cyan-500/25">
                <FileText className="h-10 w-10 text-slate-500 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-mono font-bold text-slate-400">No FIR records found on your current session.</p>
                <p className="text-[11px] font-mono text-slate-500 mt-1">Use our AI assistant to analyze and submit your first complaint.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* List of cases */}
                <div className="flex flex-col gap-3">
                  {cases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedDashboardCase(c)}
                      className={`p-4 border rounded-xl transition-all cursor-pointer ${
                        selectedDashboardCase?.id === c.id
                          ? "border-cyan-400 bg-cyan-950/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                          : "border-white/5 bg-slate-900/40 hover:bg-cyan-500/5 hover:border-white/10"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono font-extrabold text-xs text-cyan-400">{c.id}</span>
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                            c.status === "Pending"
                              ? "bg-amber-950/40 text-amber-400 border border-amber-500/30"
                              : c.status === "Under Investigation"
                              ? "bg-cyan-950/40 text-cyan-400 border border-cyan-500/30"
                              : c.status === "Closed"
                              ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-900 text-slate-300 border border-white/10"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-mono font-bold text-slate-200 mb-1">{c.crimeType}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {c.incidentDescription}
                      </p>
                      <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-mono font-medium">
                        <span>Submitted: {new Date(c.submittedAt).toLocaleDateString("en-IN")}</span>
                        <span>Risk Score: <span className="font-bold text-red-400">{c.riskScore}%</span></span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Case Detail Panel */}
                <div className="bg-slate-950/40 border border-cyan-500/15 rounded-xl p-5 shadow-[0_4px_25px_rgba(0,0,0,0.2)]">
                  {selectedDashboardCase ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center border-b border-cyan-500/10 pb-3">
                        <div>
                          <h4 className="font-mono font-extrabold text-sm text-cyan-400">{selectedDashboardCase.id}</h4>
                          <span className="text-[10px] font-mono font-bold text-slate-400">
                            Logged Complainant: {selectedDashboardCase.complainantName}
                          </span>
                        </div>
                        <span className="text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-mono font-bold px-2.5 py-1 rounded">
                          {selectedDashboardCase.status}
                        </span>
                      </div>

                      {/* Timeline status */}
                      <div>
                        <h5 className="text-xs font-mono font-bold text-cyan-400 mb-3">Investigation Progress Log</h5>
                        <div className="relative pl-4 border-l-2 border-cyan-500/20 space-y-4">
                          {selectedDashboardCase.timeline.map((evt, idx) => (
                            <div key={idx} className="relative">
                              <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-cyan-400 border-2 border-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.6)]"></div>
                              <div className="text-[11px] font-sans">
                                <span className="text-[9px] font-mono font-bold text-slate-500 block">
                                  {new Date(evt.date).toLocaleString("en-IN")}
                                </span>
                                <span className="font-bold text-slate-200 block">{evt.title}</span>
                                <span className="text-slate-400">{evt.description}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Evidence attached */}
                      <div className="border-t border-cyan-500/10 pt-3">
                        <h5 className="text-xs font-mono font-bold text-cyan-400 mb-2">Attached Evidence Vault</h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedDashboardCase.evidence.length === 0 ? (
                            <span className="text-[10px] text-slate-500 italic font-mono">No files uploaded.</span>
                          ) : (
                            selectedDashboardCase.evidence.map((file, fIdx) => (
                              <span key={fIdx} className="text-[10px] px-2.5 py-1 bg-slate-900 border border-cyan-500/15 rounded font-mono font-semibold text-cyan-300 flex items-center gap-1">
                                <FileText className="h-3 w-3 text-cyan-400" />
                                {file}
                              </span>
                            ))
                          )}
                        </div>
                      </div>

                      {/* FIR Document View and Download */}
                      {selectedDashboardCase.documents.fir && (
                        <div className="border-t border-cyan-500/10 pt-3">
                          <h5 className="text-xs font-mono font-bold text-cyan-400 mb-2">Compiled Legal Document</h5>
                          <div className="bg-slate-900/80 p-3 rounded border border-cyan-500/10 text-[10px] font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-48 custom-scrollbar text-cyan-300">
                            {selectedDashboardCase.documents.fir}
                          </div>
                          <button
                            onClick={() => {
                              const blob = new Blob([selectedDashboardCase.documents.fir!], { type: "text/plain" });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${selectedDashboardCase.id}_FIR_Document.txt`;
                              a.click();
                            }}
                            className="mt-2 py-1.5 px-3 bg-cyan-500/10 border border-cyan-500/35 hover:bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-bold rounded flex items-center justify-center gap-1.5 w-full transition-all cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" /> Download Official FIR Copy
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <FileText className="h-8 w-8 text-slate-500 opacity-40 mb-2" />
                      <p className="text-xs font-mono font-bold text-slate-400">Select an FIR from the list to examine details, investigation logs, and download documents.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Constitutional Tab */}
        {activeTab === "rights" && (
          <div className="glass-panel rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.15)] flex flex-col gap-6">
            <div className="border-b border-cyan-500/10 pb-3">
              <h3 className="text-base font-mono font-extrabold text-cyan-400">Constitutional Safeguards & Rights Assistant</h3>
              <p className="text-xs text-slate-400">
                Know your rights guaranteed under the Constitution of India and police procedural manuals (BNSS 2023).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-slate-900/30 p-4 rounded-xl border border-cyan-500/15">
                  <h4 className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 mb-2">
                    <CheckCircle className="h-4 w-4 text-cyan-400" /> Rights During FIR (First Information Report)
                  </h4>
                  <ul className="text-[11px] text-slate-400 space-y-2 list-disc pl-4 font-sans font-medium">
                    <li>The police MUST register your complaint if it discloses a cognizable offense (Section 173 BNSS).</li>
                    <li>You have a constitutional right to get a free physical or digital copy of your FIR immediately.</li>
                    <li>If a police station refuses to file, you can submit the complaint directly to the Superintendent of Police (SP) or Metropolitan Magistrate.</li>
                  </ul>
                </div>

                <div className="bg-slate-900/30 p-4 rounded-xl border border-cyan-500/15">
                  <h4 className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 mb-2">
                    <CheckCircle className="h-4 w-4 text-cyan-400" /> Rights of Cyber Crime Victims
                  </h4>
                  <ul className="text-[11px] text-slate-400 space-y-2 list-disc pl-4 font-sans font-medium">
                    <li>Financial fraud victims can secure rapid reversal of transactions under RBI guidelines if reported quickly.</li>
                    <li>Victims of online bullying or cyber stalking have a right to immediate social media content masking.</li>
                    <li>Your personal digital evidence must be handled securely under BSA 2023 (chain of custody certificate).</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-slate-900/30 p-4 rounded-xl border border-cyan-500/15">
                  <h4 className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 mb-2">
                    <CheckCircle className="h-4 w-4 text-cyan-400" /> Rights of Women and Children
                  </h4>
                  <ul className="text-[11px] text-slate-400 space-y-2 list-disc pl-4 font-sans font-medium">
                    <li>Women have the right to file Zero FIR from any location or jurisdiction in India.</li>
                    <li>A woman can only be searched or arrested by a female officer, and strictly between sunrise and sunset.</li>
                    <li>Under POCSO Act, child identity must be protected completely from any public domain exposure.</li>
                  </ul>
                </div>

                <div className="bg-slate-900/30 p-4 rounded-xl border border-cyan-500/15">
                  <h4 className="text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5 mb-2">
                    <CheckCircle className="h-4 w-4 text-cyan-400" /> Rights During Arrest
                  </h4>
                  <ul className="text-[11px] text-slate-400 space-y-2 list-disc pl-4 font-sans font-medium">
                    <li>Article 22 of Constitution guarantees the right to know the exact grounds of your arrest.</li>
                    <li>Right to consult and be defended by a legal practitioner of your own choice.</li>
                    <li>You must be produced before the nearest judicial magistrate within 24 hours of arrest.</li>
                    <li>Article 20(3) protects you against self-incrimination; you cannot be forced to witness against yourself.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* One-Click FIR Form Tab */}
        {activeTab === "fir" && (
          <div className="glass-panel rounded-xl p-6 shadow-[0_4px_30px_rgba(0,0,0,0.15)] flex flex-col gap-6">
            <div className="border-b border-cyan-500/10 pb-4 text-center md:text-left">
              <h2 className="text-base font-mono font-extrabold text-cyan-400">Secure e-FIR Filing Channel</h2>
              <p className="text-xs text-slate-400">
                Digitally authenticated filing directly into the crime control system under BNSS 2023 guidelines.
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="mb-6">
              <div className="relative flex justify-between items-start w-full max-w-2xl mx-auto">
                <div className="absolute top-5 left-0 w-full h-[1px] bg-slate-800 z-0"></div>
                <div
                  className="absolute top-5 left-0 h-[1.5px] bg-cyan-400 z-0 transition-all duration-500"
                  style={{ width: `${(firStep - 1) * 25}%` }}
                ></div>

                {[
                  { step: 1, label: "Review Draft", icon: "📝" },
                  { step: 2, label: "Verify Identity", icon: "🆔" },
                  { step: 3, label: "Evidence", icon: "📎" },
                  { step: 4, label: "Sign Box", icon: "🖋️" },
                  { step: 5, label: "Receipt", icon: "✅" }
                ].map((s) => (
                  <div key={s.step} className="relative z-10 flex flex-col items-center gap-1.5 font-mono">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 font-bold text-xs shadow-sm transition-all ${
                        firStep >= s.step
                          ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                          : "bg-slate-900 text-slate-500 border-white/5"
                      }`}
                    >
                      {s.icon}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* STEP 1: REVIEW AI DRAFT */}
            {firStep === 1 && (
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-slate-900/40 rounded-lg border border-cyan-500/15">
                  <h4 className="text-xs font-mono font-extrabold text-cyan-400 flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4" /> AI-Generated FIR Application Draft
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    Based on your statements to our AI Assistant, the following official FIR complaint petition has been drafted. Please review carefully before proceeding to identity authentication.
                  </p>

                  <div className="bg-slate-950/80 p-4 rounded border border-cyan-500/10 font-mono text-[10px] text-cyan-300 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto custom-scrollbar">
                    {analysisResult?.draftFIR.formalDraftText || "No active draft available. Please query the Assistant first."}
                  </div>
                </div>

                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => setFirStep(2)}
                    className="px-6 py-2.5 bg-cyan-500 text-slate-950 text-xs font-mono font-bold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:bg-cyan-400 active:scale-95 transition-all cursor-pointer"
                  >
                    Confirm & Proceed to Identity Verification
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: VERIFY IDENTITY VIA AADHAAR */}
            {firStep === 2 && (
              <div className="flex flex-col gap-5 max-w-md mx-auto w-full py-6">
                <div className="text-center">
                  <Fingerprint className="h-12 w-12 text-cyan-400 mx-auto mb-2 animate-bounce" />
                  <h4 className="text-sm font-mono font-bold text-cyan-400">UIDAI Aadhaar Verification</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Authenticating your digital signature and identity in compliance with the Information Technology Act.
                  </p>
                </div>

                <div className="bg-slate-900/30 p-5 rounded-xl border border-cyan-500/15 flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                      Complainant Full Name
                    </label>
                    <input
                      type="text"
                      value={complainantName}
                      onChange={(e) => setComplainantName(e.target.value)}
                      placeholder="Enter your full name (matching Aadhaar)"
                      className="w-full p-2.5 glass-input rounded-lg text-xs font-medium outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                      Complainant Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={complainantPhone}
                      onChange={(e) => setComplainantPhone(e.target.value)}
                      placeholder="e.g. +91 99999 99999"
                      className="w-full p-2.5 glass-input rounded-lg text-xs font-medium outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                      Aadhaar Number (12 Digits)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={12}
                        value={complainantAadhaar}
                        onChange={(e) => setComplainantAadhaar(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 123456789012"
                        className="flex-1 p-2.5 glass-input rounded-lg text-xs font-medium outline-none"
                        disabled={aadhaarVerified}
                      />
                      <button
                        onClick={handleSendAadhaarOtp}
                        className="px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/35 hover:bg-cyan-500/20 text-cyan-400 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer"
                        disabled={aadhaarVerified}
                      >
                        {aadhaarOtpSent ? "Resend" : "Send OTP"}
                      </button>
                    </div>
                  </div>

                  {aadhaarOtpSent && !aadhaarVerified && (
                    <div className="border-t border-cyan-500/10 pt-3 flex flex-col gap-2">
                      <label className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                        Enter 4-Digit Mobile OTP
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={aadhaarOtp}
                          onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ""))}
                          placeholder="OTP Code"
                          className="flex-1 p-2.5 glass-input rounded-lg text-xs font-medium outline-none"
                        />
                        <button
                          onClick={handleVerifyAadhaarOtp}
                          className="px-4 py-2.5 bg-emerald-500 text-slate-950 text-xs font-mono font-bold rounded-lg hover:bg-emerald-400 transition-all cursor-pointer"
                        >
                          Verify OTP
                        </button>
                      </div>
                    </div>
                  )}

                  {aadhaarVerified && (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs font-mono font-bold flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Complainant Aadhaar Verified Successfully!
                    </div>
                  )}
                </div>

                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => setFirStep(1)}
                    className="px-4 py-2 border border-cyan-500/25 rounded-lg text-xs font-mono font-bold text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setFirStep(3)}
                    disabled={!aadhaarVerified || !complainantName}
                    className="px-6 py-2.5 bg-cyan-500 text-slate-950 text-xs font-mono font-bold rounded-lg shadow-sm hover:bg-cyan-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Proceed to Evidence Upload
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: EVIDENCE UPLOAD */}
            {firStep === 3 && (
              <div className="flex flex-col gap-5 max-w-xl mx-auto w-full py-4">
                <div className="text-center">
                  <Upload className="h-10 w-10 text-cyan-400 mx-auto mb-2 animate-pulse" />
                  <h4 className="text-sm font-mono font-bold text-cyan-400">Upload Incident Evidence Checklist</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Attach required verification documents. Cyber evidence will undergo Hash-Verification under Section 65B of IT Act.
                  </p>
                </div>

                {/* Evidence Drag-Drop Box */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                    dragActive ? "border-cyan-400 bg-cyan-950/20" : "border-cyan-500/15 bg-slate-900/40 hover:bg-cyan-500/5 hover:border-cyan-500/30"
                  }`}
                >
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-mono font-bold text-slate-300">Drag and drop screenshots or logs here</p>
                  <p className="text-[10px] text-slate-500 mt-1">Accepts PNG, JPG, PDF, MP4 (Max 15MB)</p>
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        const simulatedFiles = ["chat_screenshot_1.jpg", "payment_receipt.pdf", "ip_log_record.txt"];
                        setUploadedEvidence((prev) => [...prev, simulatedFiles[Math.floor(Math.random() * simulatedFiles.length)]]);
                      }}
                      className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/35 text-xs font-mono font-bold rounded-lg text-cyan-400 hover:bg-cyan-500/20 transition-all cursor-pointer"
                    >
                      Simulate File Selection
                    </button>
                  </div>
                </div>

                {/* List of files */}
                {uploadedEvidence.length > 0 && (
                  <div className="bg-slate-950/40 border border-cyan-500/15 rounded-xl p-4 flex flex-col gap-2">
                    <p className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider mb-1">Attached Files Vault</p>
                    <div className="flex flex-col gap-2">
                      {uploadedEvidence.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-cyan-500/10 text-xs">
                          <span className="font-mono font-semibold text-slate-200 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-cyan-400" />
                            {file}
                          </span>
                          <button
                            onClick={() => setUploadedEvidence((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom Checklist recommendations */}
                <div className="bg-slate-900/30 p-4 rounded-lg border border-cyan-500/15">
                  <h5 className="text-xs font-mono font-bold text-cyan-400 mb-2 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-cyan-400" /> Recommended Evidence for {analysisResult?.crimeType || "Hacking"}
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-400 font-mono">
                    {analysisResult?.evidenceRequired.map((ev, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 p-1 bg-slate-950/60 border border-cyan-500/10 rounded">
                        <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                        <span>{ev}</span>
                      </div>
                    )) || <span>Standard screenshots & logs.</span>}
                  </div>
                </div>

                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => setFirStep(2)}
                    className="px-4 py-2 border border-cyan-500/25 rounded-lg text-xs font-mono font-bold text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setFirStep(4)}
                    className="px-6 py-2.5 bg-cyan-500 text-slate-950 text-xs font-mono font-bold rounded-lg shadow-sm hover:bg-cyan-400 transition-all cursor-pointer"
                  >
                    Proceed to Digital Signature
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: DIGITAL SIGNATURE */}
            {firStep === 4 && (
              <div className="flex flex-col gap-5 max-w-md mx-auto w-full py-4">
                <div className="text-center">
                  <FileText className="h-10 w-10 text-cyan-400 mx-auto mb-2" />
                  <h4 className="text-sm font-mono font-bold text-cyan-400">Provide Hand-drawn Digital Signature</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Sign inside the canvas box below to bind your digital declaration to this petition.
                  </p>
                </div>

                {/* Drawing pad */}
                <div className="relative border border-cyan-500/20 rounded-xl overflow-hidden shadow-xs bg-slate-950/80">
                  <div className="p-2 border-b border-cyan-500/15 bg-slate-900/60 flex justify-between items-center text-[10px] font-mono font-bold text-slate-400">
                    <span>DRAW SIGNATURE BELOW</span>
                    <button
                      onClick={clearSignature}
                      className="text-red-400 flex items-center gap-1 hover:text-red-300 cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" /> Clear
                    </button>
                  </div>
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    width={400}
                    height={150}
                    className="signature-pad w-full h-[150px] block cursor-crosshair bg-slate-900/20"
                  />
                </div>

                {/* Self Declaration check */}
                <div className="flex items-start gap-2 bg-red-950/10 p-3.5 rounded-lg border border-red-500/20">
                  <input
                    type="checkbox"
                    id="legal-terms-check"
                    checked={declarationChecked}
                    onChange={(e) => setDeclarationChecked(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-cyan-500/25 bg-slate-900 text-cyan-500 focus:ring-cyan-500"
                  />
                  <label htmlFor="legal-terms-check" className="text-[10px] sm:text-xs text-slate-400 leading-relaxed font-sans font-semibold">
                    I solemnly declare that all information provided in this complaint is accurate and true to the best of my knowledge, and understand that filing false complaints is an offense under Section 191 IPC / 229 BNS.
                  </label>
                </div>

                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => setFirStep(3)}
                    className="px-4 py-2 border border-cyan-500/25 rounded-lg text-xs font-mono font-bold text-cyan-400 hover:bg-cyan-500/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmitFIR}
                    disabled={isFiling || !signatureData || !declarationChecked}
                    className="px-6 py-2.5 bg-cyan-500 text-slate-950 text-xs font-mono font-extrabold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-400 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isFiling ? (
                      <>
                        <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent"></div>
                        Submitting FIR...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Submit FIR Petition
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: RECEIPT STATUS TRACKER */}
            {firStep === 5 && (
              <div className="flex flex-col gap-6 max-w-lg mx-auto w-full py-6 text-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-base font-mono font-extrabold text-cyan-400">FIR Submitted & Certified!</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Your First Information Report has been securely authenticated, digitally signed, and dispatched to the Crime Intelligence Cell.
                  </p>
                </div>

                <div className="bg-slate-900/30 p-6 rounded-xl border border-cyan-500/15 max-w-md mx-auto w-full flex flex-col gap-4 text-xs font-mono font-bold">
                  <div className="flex justify-between items-center py-2 border-b border-cyan-500/10">
                    <span className="text-slate-400 font-medium">Tracking Reference No:</span>
                    <span className="text-cyan-400 font-extrabold">{filedId}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-cyan-500/10">
                    <span className="text-slate-400 font-medium">Jurisdiction Station:</span>
                    <span className="text-slate-200">National Cyber Crime Cell</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-cyan-500/10">
                    <span className="text-slate-400 font-medium">Complainant:</span>
                    <span className="text-slate-200">{complainantName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 font-medium">E-Verification Status:</span>
                    <span className="text-emerald-400 uppercase">Aadhaar Certified</span>
                  </div>
                </div>

                <div className="bg-cyan-500/5 p-4 rounded-lg border border-cyan-500/20 text-xs text-cyan-400 leading-relaxed text-left max-w-md mx-auto font-sans font-medium">
                  <span className="font-mono font-bold block mb-1 text-cyan-300">What Happens Next?</span>
                  1. You will receive an SMS and Email confirmation linked with your Aadhaar identity.<br />
                  2. A certified officer will inspect the digital trail and issue notices to intermediate gateway servers.<br />
                  3. You can track this in your <strong>Case Status Dashboard</strong>.
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setSelectedDashboardCase(cases.find((c) => c.id === filedId) || null);
                      setActiveTab("dashboard");
                    }}
                    className="px-6 py-2.5 bg-cyan-500 text-slate-950 text-xs font-mono font-bold rounded-lg shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:bg-cyan-400 cursor-pointer"
                  >
                    Go to Case Tracker
                  </button>
                  <button
                    onClick={() => {
                      setAnalysisResult(null);
                      setChatHistory([
                        {
                          sender: "ai",
                          text: "FIR file complete. Let me know if there's any other legal consult or case details you would like to analyze."
                        }
                      ]);
                      setActiveTab("assistant");
                    }}
                    className="px-6 py-2.5 bg-slate-900/60 text-cyan-400 text-xs font-mono font-bold rounded-lg hover:bg-cyan-500/10 border border-cyan-500/25 cursor-pointer"
                  >
                    Consult AI Again
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
