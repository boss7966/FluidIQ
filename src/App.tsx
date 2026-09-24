import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Activity,
  Bot,
  Camera,
  Layers,
  BookOpen,
  Calculator,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Shield,
  Compass,
  FileText
} from "lucide-react";
import { Unit } from "./types";

// Import custom sub-modules
import AiEngineer from "./components/AiEngineer";
import SymbolScanner from "./components/SymbolScanner";
import Workbench from "./components/Workbench";
import SmartLibrary from "./components/SmartLibrary";
import FormulaCalculator from "./components/FormulaCalculator";

// Fallback units in case backend fails or server is restarting
const FALLBACK_UNITS: Unit[] = [
  { id: 1, title: "Introduction to Pneumatic Systems", titleMy: "Pengenalan Sistem Pneumatik", type: "pneumatics", summary: "Basics of pneumatics, pressure types, advantages and disadvantages.", keyTerms: [] },
  { id: 2, title: "Air Compressors & Distribution", titleMy: "Pemampat Udara & Pengagihan", type: "pneumatics", summary: "Air compression types, receiver tanks, and secondary air FRL systems.", keyTerms: [] },
  { id: 3, title: "Pneumatic Actuators", titleMy: "Penggerak Pneumatik (Silinder)", type: "pneumatics", summary: "Linear single/double cylinders, seals, and cushioning.", keyTerms: [] },
  { id: 4, title: "Directional Control Valves", titleMy: "Injap Kawalan Arah", type: "pneumatics", summary: "Port numbering, valve positions, actuation solenoids.", keyTerms: [] },
  { id: 5, title: "Control Circuit Logic & Sequences", titleMy: "Litar Kawalan Pneumatik & Jujukan", type: "pneumatics", summary: "AND/OR logic gates, Cascade circuits, multi-cylinder A+B+A-B- sequences.", keyTerms: [] },
  { id: 6, title: "Introduction to Hydraulic Systems", titleMy: "Pengenalan Sistem Hidraulik", type: "hydraulics", summary: "Hydraulics vs pneumatics comparison, Pascal's Law.", keyTerms: [] },
  { id: 7, title: "Hydraulic Fluid & Reservoirs", titleMy: "Minyak Hidraulik & Tangki", type: "hydraulics", summary: "Viscosity Index, reservoirs, baffles, and suction strainers.", keyTerms: [] },
  { id: 8, title: "Hydraulic Pumps & Actuators", titleMy: "Pam Hidraulik & Penggerak", type: "hydraulics", summary: "External gear pumps, vane pumps, and cavitation noise.", keyTerms: [] },
  { id: 9, title: "Hydraulic Control Valves", titleMy: "Injap Kawalan Hidraulik", type: "hydraulics", summary: "Pressure relief safety valves, flow throttles, meter-out speed limits.", keyTerms: [] },
  { id: 10, title: "Electro-Pneumatics & Electro-Hydraulics", titleMy: "Elektro-Pneumatik & Elektro-Hidraulik", type: "both", summary: "Relay controls, 24V solenoids, latching lines, PLC ladder diagrams.", keyTerms: [] },
  { id: 11, title: "Troubleshooting & Maintenance", titleMy: "Mengesan Kerosakan & Penyenggaraan", type: "both", summary: "Diagnosing cylinder creeping, pump screaming, air/oil leak checks.", keyTerms: [] }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "ai" | "scanner" | "workbench" | "library">("dashboard");
  const [units, setUnits] = useState<Unit[]>(FALLBACK_UNITS);
  const [completedQuizzes, setCompletedQuizzes] = useState<number[]>([1]); // Default start progress
  const [savedSymbolsCount, setSavedSymbolsCount] = useState<number>(0);
  const [workbenchMaster, setWorkbenchMaster] = useState<boolean>(false);
  const [showQuickCalc, setShowQuickCalc] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Simulated activity feed logs
  const [activityLogs, setActivityLogs] = useState<string[]>([
    "Welcome back to FluidIQ Cockpit.",
    "Unit 1 Introduction assessment quiz locked as PASSED.",
    "System pressure calibrated to standard 6.0 bar."
  ]);

  // Fetch real database syllabus on mount
  useEffect(() => {
    fetch("/api/units")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setUnits(data))
      .catch(() => console.log("Serving rich fallback course syllabus data."));
  }, []);

  // Update dynamic clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Progress update triggers
  const handleQuizCompletion = (unitId: number) => {
    if (!completedQuizzes.includes(unitId)) {
      setCompletedQuizzes((prev) => [...prev, unitId]);
      addNotification(`Self-assessment quiz for Unit ${unitId} successfully passed!`);
    }
  };

  const handleWorkbenchBadge = () => {
    if (!workbenchMaster) {
      setWorkbenchMaster(true);
      addNotification("Successfully built sequence circuit. Sequence Master Badge unlocked!");
    }
  };

  const handleSymbolScanned = () => {
    setSavedSymbolsCount((prev) => {
      const next = prev + 1;
      if (next === 1) {
        addNotification("First ISO symbol scanned and logged to workbook.");
      }
      return next;
    });
  };

  const addNotification = (msg: string) => {
    setActivityLogs((prev) => [msg, ...prev.slice(0, 5)]);
  };

  // Calculate global % completion based on achievements
  const calculateTotalProgress = () => {
    let pct = 10; // Base baseline
    pct += completedQuizzes.length * 6; // up to ~66% if all units answered
    if (workbenchMaster) pct += 20; // 20% workbench bonus
    if (savedSymbolsCount > 0) pct += Math.min(15, savedSymbolsCount * 5); // up to 15% scan bonus
    return Math.min(100, pct);
  };

  const progressPercent = calculateTotalProgress();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none antialiased">
      {/* Top Professional Control Room Header */}
      <header className="bg-slate-900/90 border-b border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sticky top-0 z-50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-orange-600 to-blue-600 rounded-xl flex items-center justify-center font-black text-white text-lg tracking-wider shadow-lg shadow-orange-500/10">
            FIQ
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-wider text-slate-100 flex items-center gap-2">
              FLUIDIQ
              <span className="text-[10px] bg-orange-500/10 text-orange-400 font-mono font-bold px-2 py-0.5 rounded border border-orange-500/20">
                J4012 SMART COCKPIT
              </span>
            </h1>
            <p className="text-xs text-slate-400">Pneumatics & Hydraulics Smart Lab Assistant</p>
          </div>
        </div>

        {/* User status & clock */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-300">boss7966@gmail.com</span>
          </div>
          <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-2 text-amber-500">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* Main Feature Tabs Nav Rail */}
      <nav className="bg-slate-900 border-b border-slate-800/60 px-6 py-2.5 flex flex-wrap gap-2 justify-center sm:justify-start">
        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
            activeTab === "dashboard"
              ? "bg-gradient-to-r from-orange-600/15 to-blue-600/15 text-slate-100 border border-slate-700 shadow-inner"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Compass className="w-4 h-4 text-orange-500" /> Cockpit Dashboard
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
            activeTab === "ai"
              ? "bg-amber-600/15 text-amber-400 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Bot className="w-4 h-4 text-amber-500" /> AI Engineer Query
        </button>
        <button
          onClick={() => setActiveTab("scanner")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
            activeTab === "scanner"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Camera className="w-4 h-4 text-blue-400" /> ISO Vision Scanner
        </button>
        <button
          onClick={() => setActiveTab("workbench")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
            activeTab === "workbench"
              ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Layers className="w-4 h-4 text-emerald-400" /> Drag & Drop Lab
        </button>
        <button
          onClick={() => setActiveTab("library")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition ${
            activeTab === "library"
              ? "bg-purple-600/15 text-purple-400 border border-purple-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-400" /> Smart Library
        </button>

        {/* Secondary Quick Calculator toggle */}
        <button
          onClick={() => setShowQuickCalc(!showQuickCalc)}
          className={`ml-auto flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border transition ${
            showQuickCalc
              ? "bg-amber-500/20 border-amber-500 text-amber-400"
              : "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          }`}
        >
          <Calculator className="w-4 h-4 text-amber-400" /> Formula Calculator
        </button>
      </nav>

      {/* Main Dashboard Panel layout */}
      <main className="flex-1 p-6 space-y-6">
        
        {/* Quick Calculator Panel Injection */}
        {showQuickCalc && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <FormulaCalculator onClose={() => setShowQuickCalc(false)} />
          </motion.div>
        )}

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* The Completion Gauge SVG circular ring (Industrial panel design) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />
              
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                Overall Lab completion
              </span>
              
              <div className="relative w-44 h-44 my-5 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  {/* Track ring */}
                  <circle
                    cx="88"
                    cy="88"
                    r="72"
                    stroke="#1e293b"
                    strokeWidth="12"
                    fill="transparent"
                  />
                  {/* Glowing progress ring */}
                  <circle
                    cx="88"
                    cy="88"
                    r="72"
                    stroke="url(#progress-gradient)"
                    strokeWidth="12"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 72}
                    strokeDashoffset={2 * Math.PI * 72 * (1 - progressPercent / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f97316" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Internal overlay content */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-3xl font-extrabold text-white tracking-tighter font-mono">
                    {progressPercent}%
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                    <Shield className="w-3.5 h-3.5" /> SECURE MODE
                  </span>
                </div>
              </div>

              {/* Achievements summary list */}
              <div className="w-full mt-2 border-t border-slate-800/80 pt-3.5 space-y-2 text-xs font-mono text-left">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Quizzes Passed:</span>
                  <span className="font-bold text-white">{completedQuizzes.length}/11</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Scanned Symbols:</span>
                  <span className="font-bold text-blue-400">{savedSymbolsCount} logged</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Sequence Badge:</span>
                  <span className={`font-bold ${workbenchMaster ? "text-emerald-400" : "text-slate-500"}`}>
                    {workbenchMaster ? "UNLOCKED" : "LOCKED"}
                  </span>
                </div>
              </div>
            </div>

            {/* J4012 Syllabus Unit Timeline Scroll list */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col shadow-lg">
              <h3 className="text-xs font-bold tracking-wider font-mono text-slate-300 uppercase mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-orange-500 animate-pulse" />
                J4012 Module Course Timeline
              </h3>

              <div className="flex-1 overflow-y-auto space-y-4 max-h-[310px] pr-1.5 no-scrollbar">
                {units.map((unit) => {
                  const isQuizPassed = completedQuizzes.includes(unit.id);
                  const isPneumatic = unit.type === "pneumatics";
                  
                  return (
                    <button
                      key={unit.id}
                      onClick={() => {
                        setActiveTab("library");
                      }}
                      className="w-full text-left bg-slate-950/60 hover:bg-slate-950 border border-slate-850 hover:border-slate-700/60 p-3 rounded-lg transition flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                          isPneumatic
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        }`}>
                          {unit.id}
                        </div>
                        <div>
                          <h4 className="font-bold text-xs text-slate-200">{unit.title}</h4>
                          <p className="text-[10px] text-slate-500 font-mono mt-0.5">{unit.titleMy}</p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Student Activity Feed & Presets notifications */}
            <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-lg">
              <div className="space-y-4">
                <h3 className="text-xs font-bold tracking-wider font-mono text-slate-300 uppercase flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Activity Feed
                </h3>
                
                <div className="space-y-3 font-mono text-[11px] leading-tight max-h-[220px] overflow-y-auto pr-1 no-scrollbar">
                  {activityLogs.map((log, idx) => (
                    <div key={idx} className="p-2.5 bg-slate-950/80 rounded border border-slate-850 text-slate-400 flex gap-2">
                      <span className="text-blue-500 shrink-0">⊞</span>
                      <span>{log}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Invitation hint block */}
              <div className="mt-4 p-3 bg-blue-950/15 border border-blue-500/20 rounded-lg flex gap-2.5 text-xs text-slate-300">
                <AlertTriangle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  You haven't completed the self-assessment for **Unit 3: Actuators**. Tap below to lock in the score.
                </p>
              </div>

              <button
                onClick={() => setActiveTab("library")}
                className="w-full mt-4 text-center py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded transition shadow"
              >
                Start Unit 3 Quiz
              </button>
            </div>

          </div>
        )}

        {/* Inject sub-panels based on active tab state */}
        {activeTab === "ai" && (
          <AiEngineer onProgressUpdate={() => handleQuizCompletion(11)} />
        )}

        {activeTab === "scanner" && (
          <SymbolScanner onProgressUpdate={() => { handleSymbolScanned(); }} />
        )}

        {activeTab === "workbench" && (
          <Workbench onProgressUpdate={() => { handleWorkbenchBadge(); }} />
        )}

        {activeTab === "library" && (
          <SmartLibrary
            units={units}
            completedQuizzes={completedQuizzes}
            onQuizCompleted={handleQuizCompletion}
          />
        )}

      </main>

      {/* Cockpit Command Center Footer */}
      <footer className="bg-slate-900 border-t border-slate-800/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs font-mono text-slate-500 mt-auto shrink-0">
        <span>FluidIQ Smart Lab Assistant v1.0.0</span>
        <span className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          SYSTEM READY • ALL LAB MODULES ONLINE
        </span>
      </footer>
    </div>
  );
}
