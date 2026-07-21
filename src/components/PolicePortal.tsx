import React, { useState, useEffect } from "react";
import {
  Shield,
  Clock,
  Filter,
  CheckCircle,
  FileText,
  AlertTriangle,
  MapPin,
  TrendingUp,
  Award,
  BookOpen,
  Calendar,
  Send,
  Loader,
  Plus,
  RefreshCw,
  Download,
  AlertCircle
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { CaseItem } from "../types";

interface PolicePortalProps {
  cases: CaseItem[];
  onUpdateCase: (updatedCase: CaseItem) => void;
  onRefreshCases: () => void;
  isLoadingCases: boolean;
}

const CRIME_TRENDS = [
  { month: "Jan", cases: 45 },
  { month: "Feb", cases: 52 },
  { month: "Mar", cases: 68 },
  { month: "Apr", cases: 85 },
  { month: "May", cases: 110 },
  { month: "Jun", cases: 95 },
  { month: "Jul", cases: 124 }
];

const CATEGORY_DATA = [
  { name: "Cyber Fraud", value: 45, color: "#1A237E" },
  { name: "Identity Theft", value: 25, color: "#8F4E00" },
  { name: "Violent Crimes", value: 15, color: "#BA1A1A" },
  { name: "Property Disputes", value: 15, color: "#023900" }
];

export default function PolicePortal({
  cases,
  onUpdateCase,
  onRefreshCases,
  isLoadingCases
}: PolicePortalProps) {
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [filterSeverity, setFilterSeverity] = useState<"All" | "High" | "Medium" | "Low">("All");

  // Manual Timeline Action State
  const [newTimelineTitle, setNewTimelineTitle] = useState("");
  const [newTimelineDesc, setNewTimelineDesc] = useState("");
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);

  // Document Generator State
  const [draftDocType, setDraftDocType] = useState<"caseDiary" | "witnessStatement" | "chargeSummary" | null>(null);
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftedText, setDraftedText] = useState("");

  // Default to selecting the first case on load
  useEffect(() => {
    if (cases.length > 0 && !selectedCase) {
      setSelectedCase(cases[0]);
    }
  }, [cases, selectedCase]);

  // Statistics calculation
  const stats = React.useMemo(() => {
    const total = cases.length;
    const pending = cases.filter((c) => c.status === "Pending").length;
    const active = cases.filter((c) => c.status === "Active" || c.status === "Under Investigation").length;
    const closed = cases.filter((c) => c.status === "Closed").length;
    return { total, pending, active, closed };
  }, [cases]);

  // Filtered priority cases
  const filteredCases = React.useMemo(() => {
    if (filterSeverity === "All") return cases;
    return cases.filter((c) => c.severity === filterSeverity);
  }, [cases, filterSeverity]);

  // Handle case status update
  const handleStatusChange = async (newStatus: "Pending" | "Active" | "Under Investigation" | "Closed") => {
    if (!selectedCase) return;
    try {
      const res = await fetch(`/api/cases/${selectedCase.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated: CaseItem = await res.json();
      setSelectedCase(updated);
      onUpdateCase(updated);
    } catch (e) {
      alert("Error changing status: " + e);
    }
  };

  // Handle manual timeline log submission
  const handleAddTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !newTimelineTitle || !newTimelineDesc) return;

    setIsAddingTimeline(true);
    try {
      const res = await fetch(`/api/cases/${selectedCase.id}/timeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTimelineTitle,
          description: newTimelineDesc,
          type: "info"
        })
      });
      if (!res.ok) throw new Error("Failed to add timeline log");
      const updated: CaseItem = await res.json();
      setSelectedCase(updated);
      onUpdateCase(updated);
      setNewTimelineTitle("");
      setNewTimelineDesc("");
    } catch (err) {
      alert("Error adding timeline item: " + err);
    } finally {
      setIsAddingTimeline(false);
    }
  };

  // Handle AI Document Drafting via Express Gemini endpoint
  const handleAiDraft = async (type: "caseDiary" | "witnessStatement" | "chargeSummary") => {
    if (!selectedCase) return;
    setDraftDocType(type);
    setIsDrafting(true);
    setDraftedText("");

    try {
      const res = await fetch(`/api/cases/${selectedCase.id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: type })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to draft document via server.");
      }

      const data = await res.json();
      setDraftedText(data.document);
      setSelectedCase(data.caseItem);
      onUpdateCase(data.caseItem);
    } catch (err: any) {
      console.error(err);
      setDraftedText(`⚠️ **Drafting failed:** ${err.message || "Ensure your server.ts and GEMINI_API_KEY secret are correct."}`);
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6" id="police-portal-container">
      {/* Top Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-outline-variant p-6 rounded-xl shadow-xs">
        <div>
          <span className="text-xs font-bold text-primary tracking-widest uppercase block mb-1">
            MHA Police Command Console
          </span>
          <h2 className="text-xl font-extrabold text-on-surface">National Incident Command Centre</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRefreshCases}
            disabled={isLoadingCases}
            className="px-4 py-2 bg-surface-container border hover:bg-surface-container-high rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingCases ? "animate-spin" : ""}`} />
            Refresh Records
          </button>
        </div>
      </div>

      {/* Analytics Bento Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white border border-outline-variant p-5 rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-on-surface">{stats.total}</p>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Total Ingress FIRs
            </p>
          </div>
        </div>

        {/* Stat 2 */}
        <div className="bg-white border border-outline-variant p-5 rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-error-container/40 flex items-center justify-center text-error">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-on-surface">{stats.pending}</p>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Pending Validation
            </p>
          </div>
        </div>

        {/* Stat 3 */}
        <div className="bg-white border border-outline-variant p-5 rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center text-primary">
            <RefreshCw className="h-6 w-6 animate-spin-slow" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-on-surface">{stats.active}</p>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Under Investigation
            </p>
          </div>
        </div>

        {/* Stat 4 */}
        <div className="bg-white border border-outline-variant p-5 rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center text-green-800">
            <CheckCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-extrabold text-on-surface">{stats.closed}</p>
            <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
              Cases Prosecuted
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Live map & Analytical charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Crime trend chart */}
        <div className="col-span-12 lg:col-span-5 bg-white border border-outline-variant p-5 rounded-xl shadow-xs">
          <div className="flex items-center gap-1 mb-4">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Monthly Cyber Ingress Trends</h3>
          </div>
          <div className="h-48 text-[11px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CRIME_TRENDS}>
                <defs>
                  <linearGradient id="colorCases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A237E" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#1A237E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#767683" />
                <YAxis stroke="#767683" />
                <Tooltip />
                <Area type="monotone" dataKey="cases" stroke="#000666" fillOpacity={1} fill="url(#colorCases)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category distribution */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-white border border-outline-variant p-5 rounded-xl shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-4">Case Distribution</h3>
          <div className="h-48 flex justify-center items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CATEGORY_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" align="center" verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heat Map image */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 bg-white border border-outline-variant p-5 rounded-xl shadow-xs overflow-hidden flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-3">Delhi Central Hotspots</h3>
          <div className="relative flex-1 aspect-square rounded-lg bg-surface-container overflow-hidden min-h-[140px]">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCHBC0HQXhMfMbwwfcQfMJwipulWIjYOHlaN-kbgjqNiQf-8I_Rt5DYHZh6UMYOFnySCf8qAnPzVA-GLO4GHJH6xUSCfu7fjCfXFHnsM8CuV_z4j857N0gYZnErUvZ5DH2K4FPLEVfmnqZxVzilakS7LcVDztpjSluCxTGzNn_WG7452fakBHTrJ4k7uQJAFqo0MF34l29GXjavx7IiMpI74BU5WXW8X7l7eV-9PZ5EU1tpQ208VYiVSgo0Z5eGSzz1QoMVo_RdCRls"
              alt="Crime Density Map"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-on-surface/50 to-transparent flex items-end p-2">
              <span className="text-white text-[10px] font-bold flex items-center gap-1 leading-none">
                <MapPin className="h-3 w-3" /> Dwarka - Connaught Place
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Case List & Deep Investigation Desk */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* List panel (col 4) */}
        <div className="col-span-12 lg:col-span-4 bg-white border border-outline-variant p-5 rounded-xl shadow-xs flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2">
            <h3 className="text-xs font-extrabold text-primary uppercase">Priority Cases Intake</h3>
            <div className="flex items-center gap-1 bg-surface-container-high px-2 py-1 rounded border">
              <Filter className="h-3 w-3 text-primary" />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value as any)}
                className="text-[10px] font-bold bg-transparent outline-none border-none text-primary cursor-pointer p-0"
              >
                <option value="All">All Risks</option>
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
            {filteredCases.length === 0 ? (
              <p className="text-xs text-on-surface-variant italic text-center py-6">No matching cases.</p>
            ) : (
              filteredCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedCase(c);
                    setDraftDocType(null);
                    setDraftedText("");
                  }}
                  className={`p-3.5 border rounded-lg transition-all cursor-pointer text-left ${
                    selectedCase?.id === c.id
                      ? "border-primary bg-surface-container-low shadow-sm"
                      : "border-outline-variant bg-white hover:bg-surface-container-low"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="font-extrabold text-[11px] text-primary">{c.id}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        c.severity === "High"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.severity} Risk
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-on-surface leading-tight mb-1">{c.complainantName}</h4>
                  <p className="text-[10px] text-on-surface-variant leading-relaxed line-clamp-2">
                    {c.incidentDescription}
                  </p>
                  <div className="flex justify-between items-center mt-2 border-t border-dashed border-outline-variant/50 pt-2 text-[9px] text-on-surface-variant">
                    <span>{new Date(c.submittedAt).toLocaleDateString("en-IN")}</span>
                    <span className="font-bold text-primary">{c.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Deep Analysis & Officer workflow (col 8) */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-outline-variant rounded-xl p-6 shadow-xs">
          {selectedCase ? (
            <div className="flex flex-col gap-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-outline-variant pb-4 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-primary">{selectedCase.id}</h3>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">
                      {selectedCase.category}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                    Complainant Name: <span className="font-bold text-on-surface">{selectedCase.complainantName}</span> | Phone: {selectedCase.complainantPhone}
                  </p>
                </div>

                <div className="flex items-center gap-1 bg-surface border rounded-lg p-1">
                  {["Pending", "Active", "Under Investigation", "Closed"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(st as any)}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                        selectedCase.status === st
                          ? "bg-primary text-white shadow-xs"
                          : "text-on-surface-variant hover:text-primary hover:bg-surface-container"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid: Narratives & Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-4">
                  {/* Detailed Description */}
                  <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/60">
                    <h4 className="text-xs font-bold text-primary mb-2 flex items-center gap-1">
                      <FileText className="h-4 w-4" /> Logged Narrative Incident
                    </h4>
                    <p className="text-xs text-on-surface-variant leading-relaxed italic">
                      "{selectedCase.incidentDescription}"
                    </p>
                  </div>

                  {/* Document Generation Control Panel */}
                  <div className="bg-white border border-outline-variant p-4 rounded-xl flex flex-col gap-3">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5 border-b pb-1.5">
                      <BookOpen className="h-4 w-4 text-secondary" /> AI Document Compiler Desk
                    </h4>
                    <p className="text-[10px] text-on-surface-variant">
                      Draft high-gravity legal records in official formatting matching Indian Penal statutes.
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleAiDraft("caseDiary")}
                        className="p-2 border rounded hover:bg-surface-container font-bold text-[10px] text-primary flex flex-col items-center gap-1 text-center cursor-pointer"
                      >
                        <FileText className="h-4 w-4" />
                        Case Diary
                      </button>
                      <button
                        onClick={() => handleAiDraft("witnessStatement")}
                        className="p-2 border rounded hover:bg-surface-container font-bold text-[10px] text-primary flex flex-col items-center gap-1 text-center cursor-pointer"
                      >
                        <FileText className="h-4 w-4" />
                        Witness Rec
                      </button>
                      <button
                        onClick={() => handleAiDraft("chargeSummary")}
                        className="p-2 border rounded hover:bg-surface-container font-bold text-[10px] text-primary flex flex-col items-center gap-1 text-center cursor-pointer"
                      >
                        <Shield className="h-4 w-4" />
                        Charge Sheet
                      </button>
                    </div>

                    {/* Live document terminal */}
                    {draftDocType && (
                      <div className="mt-3 bg-surface border border-outline-variant rounded-lg p-3.5 flex flex-col gap-2">
                        <div className="flex justify-between items-center text-[10px] font-bold text-primary">
                          <span className="uppercase">Drafting: {draftDocType}</span>
                          {isDrafting ? (
                            <span className="flex items-center gap-1 text-secondary">
                              <Loader className="h-3 w-3 animate-spin" /> Live AI compiling...
                            </span>
                          ) : (
                            <span className="text-green-700">COMPLETED</span>
                          )}
                        </div>

                        {isDrafting ? (
                          <div className="h-24 bg-white rounded border flex items-center justify-center text-[10px] text-on-surface-variant font-medium">
                            Compiling legal acts, digital trace hashes, and witness chronologies. Please wait...
                          </div>
                        ) : (
                          <>
                            <div className="bg-white p-2.5 rounded border text-[9px] font-mono whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed text-on-surface-variant custom-scrollbar">
                              {draftedText}
                            </div>
                            <button
                              onClick={() => {
                                const blob = new Blob([draftedText], { type: "text/plain" });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url;
                                a.download = `${selectedCase.id}_${draftDocType}.txt`;
                                a.click();
                              }}
                              className="w-full py-1 bg-primary text-white text-[9px] rounded font-bold hover:opacity-90 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Download className="h-3 w-3" /> Save / Download Copy
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Case Logs and updates */}
                <div className="flex flex-col gap-4">
                  {/* Timeline progress */}
                  <div className="bg-white border p-4 rounded-xl flex flex-col gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                    <h4 className="text-xs font-bold text-primary border-b pb-1">Chronological Investigation Trail</h4>
                    <div className="relative pl-3.5 border-l border-outline-variant space-y-4">
                      {selectedCase.timeline.map((evt, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-primary border-2 border-white"></div>
                          <div className="text-[10px] text-on-surface-variant leading-relaxed">
                            <span className="text-[8px] font-bold text-on-surface-variant block">
                              {new Date(evt.date).toLocaleString("en-IN")}
                            </span>
                            <span className="font-bold text-on-surface block leading-tight">{evt.title}</span>
                            <span>{evt.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manual Log Timeline Form */}
                  <form onSubmit={handleAddTimeline} className="bg-surface-container p-4 rounded-xl border border-outline-variant flex flex-col gap-2.5">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1">
                      <Plus className="h-4 w-4" /> Add Action Timeline Log
                    </h4>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={newTimelineTitle}
                        onChange={(e) => setNewTimelineTitle(e.target.value)}
                        placeholder="Log Title (e.g. notices issued, bank freeze status)"
                        className="p-2 bg-white border rounded text-xs font-semibold focus:ring-1 focus:ring-primary focus:border-transparent outline-none"
                        required
                      />
                      <textarea
                        value={newTimelineDesc}
                        onChange={(e) => setNewTimelineDesc(e.target.value)}
                        placeholder="Log details (digital trail findings, suspect updates)"
                        className="p-2 bg-white border rounded text-xs font-medium focus:ring-1 focus:ring-primary focus:border-transparent outline-none h-14"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isAddingTimeline || !newTimelineTitle || !newTimelineDesc}
                      className="w-full py-2 bg-primary text-white rounded text-[10px] font-bold hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="h-3 w-3" /> Log Action to Case
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AlertCircle className="h-10 w-10 text-on-surface-variant opacity-40 mb-2 animate-pulse" />
              <p className="text-sm font-bold text-on-surface-variant">Intake System Awaiting Selection</p>
              <p className="text-xs text-on-surface-variant max-w-sm mt-1">Select any priority digital e-FIR on the intake panel to access the active investigation control desk.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
