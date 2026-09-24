import React, { useState, useEffect } from "react";
import { BookOpen, Search, Download, HelpCircle, Check, Award, AlertCircle } from "lucide-react";
import { Unit } from "../types";

// Standard J4012 Quiz Questions Database mapped to Unit IDs
const UNIT_QUIZZES: { [unitId: number]: { question: string; options: string[]; correctIndex: number; explanation: string }[] } = {
  1: [
    {
      question: "Which formula represents absolute pressure (Tekanan Mutlak)?",
      options: ["P_gauge + P_atm", "P_gauge - P_atm", "P_gauge * P_atm", "P_atm / P_gauge"],
      correctIndex: 0,
      explanation: "Absolute pressure is calculated relative to absolute zero (vacuum). Thus, it equals Gauge Pressure plus Atmospheric Pressure."
    },
    {
      question: "What is standard atmospheric pressure at sea level in bar?",
      options: ["0 bar", "1.013 bar", "6 bar", "10 bar"],
      correctIndex: 1,
      explanation: "Standard atmospheric pressure is approximately 1.013 bar (equivalent to 101.3 kPa)."
    }
  ],
  2: [
    {
      question: "What is the function of the receiver tank (Tangki Penerima) in a compressor assembly?",
      options: ["Lubricate valves", "Store compressed air and cool it", "Generate vacuum", "Filter dust particles"],
      correctIndex: 1,
      explanation: "The receiver tank stores compressed air volume, cools the air, and stabilizes pulses before distribution."
    },
    {
      question: "What does the abbreviation F.R.L. stand for in pneumatic systems?",
      options: ["Fast Release Lever", "Flow Regulator Line", "Filter Regulator Lubricator", "Fluid Reservoir Link"],
      correctIndex: 2,
      explanation: "FRL stands for Filter, Regulator, and Lubricator – the three core items of secondary air preparation."
    }
  ],
  3: [
    {
      question: "Why does a pneumatic cylinder have lower retraction force than extension force?",
      options: ["Due to spring resistance", "Because the piston rod reduces the effective working surface area", "Air expands during retraction", "Due to exhaust throttling"],
      correctIndex: 1,
      explanation: "The presence of the piston rod reduces the effective working surface area on the retraction side of the piston."
    }
  ],
  6: [
    {
      question: "According to Pascal's Law (Hukum Pascal), how does pressure act inside a confined fluid?",
      options: ["Only acts downwards", "Decreases with distance", "Acts equally in all directions with equal force on equal areas", "Vents automatically"],
      correctIndex: 2,
      explanation: "Pascal's Law states pressure is transmitted undiminished in all directions and acts with equal force on equal areas."
    }
  ],
  11: [
    {
      question: "What is 'Cylinder Creeping' (Rayapan Silinder) usually a symptom of?",
      options: ["Low pump speed", "Worn internal piston seals or spool leakage", "Incorrect oil color", "High air humidity"],
      correctIndex: 1,
      explanation: "Creeping occurs when fluid bypasses worn piston seals or leaks through valve clearances, drifting the cylinder piston."
    }
  ]
};

export default function SmartLibrary({
  units,
  completedQuizzes,
  onQuizCompleted
}: {
  units: Unit[];
  completedQuizzes: number[];
  onQuizCompleted: (unitId: number) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUnitId, setExpandedUnitId] = useState<number | null>(1);
  const [activeQuizUnit, setActiveQuizUnit] = useState<number | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIdx: number]: number }>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);

  // Filter units based on search keywords (supports English/Malay titles)
  const filteredUnits = units.filter(
    (u) =>
      u.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.titleMy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startQuiz = (unitId: number) => {
    setActiveQuizUnit(unitId);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleAnswerSelect = (qIdx: number, optIdx: number) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const submitQuiz = (unitId: number) => {
    const questions = UNIT_QUIZZES[unitId] || [];
    let score = 0;
    
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score++;
      }
    });

    setQuizScore(score);
    setQuizSubmitted(true);

    if (score === questions.length) {
      // Completed successfully
      onQuizCompleted(unitId);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-2xl text-slate-100 font-sans max-w-4xl mx-auto">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-4 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
            <BookOpen className="w-5 h-5 text-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wider uppercase">SMART LIBRARY</h3>
            <p className="text-xs text-slate-400">Search and Download J4012 Cheat Sheets</p>
          </div>
        </div>

        {/* High Speed Search Input */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search syllabus units..."
            className="w-full bg-slate-950 border border-slate-800 rounded pl-9 pr-3.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 font-mono"
          />
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5">
        {/* Timeline Units Navigation List */}
        <div className="md:col-span-5 space-y-2 max-h-[420px] overflow-y-auto pr-1.5 no-scrollbar">
          {filteredUnits.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-6">No matching units found.</p>
          ) : (
            filteredUnits.map((unit) => {
              const isExpanded = expandedUnitId === unit.id;
              const isQuizDone = completedQuizzes.includes(unit.id);
              
              return (
                <button
                  key={unit.id}
                  onClick={() => {
                    setExpandedUnitId(unit.id);
                    setActiveQuizUnit(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition ${
                    isExpanded
                      ? "bg-slate-800 border-slate-700/80"
                      : "bg-slate-950/40 border-slate-850 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-md flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                      unit.type === "pneumatics"
                        ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                        : unit.type === "hydraulics"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                        : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    }`}>
                      {unit.id}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-200 leading-snug">{unit.title}</h4>
                      <p className="text-[10px] text-slate-500 font-mono italic mt-0.5">{unit.titleMy}</p>
                    </div>
                  </div>

                  {/* Status indicators */}
                  {isQuizDone ? (
                    <div className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 p-1 rounded-full shrink-0" title="Assessment Passed">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="text-[9px] text-slate-500 font-mono tracking-wider shrink-0 uppercase">
                      Unit {unit.id}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Detailed Sheet viewer */}
        <div className="md:col-span-7 bg-slate-950/60 border border-slate-850 p-4 rounded-xl flex flex-col justify-between min-h-[400px]">
          {expandedUnitId ? (
            (() => {
              const unit = units.find((u) => u.id === expandedUnitId);
              if (!unit) return null;

              return (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-3.5">
                    {/* Header Spec Block */}
                    <div className="border-b border-slate-800/80 pb-3 flex justify-between items-start">
                      <div>
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${
                          unit.type === "pneumatics"
                            ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                            : unit.type === "hydraulics"
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                        }`}>
                          UNIT {unit.id} • {unit.type}
                        </span>
                        <h4 className="font-bold text-sm text-slate-100 mt-2 tracking-tight">
                          {unit.title}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">Malay: {unit.titleMy}</p>
                      </div>

                      {/* Download summary button */}
                      <a
                        href={`/api/download/summary/${unit.id}`}
                        download
                        className="flex items-center gap-1 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:text-emerald-400 rounded px-2.5 py-1.5 text-[11px] transition font-mono shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> SHEET
                      </a>
                    </div>

                    {/* Quick description summary */}
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 no-scrollbar text-xs">
                      <div>
                        <h5 className="font-bold text-slate-300 font-mono text-[10px] mb-1">UNIT OVERVIEW:</h5>
                        <p className="text-slate-400 leading-relaxed">{unit.summary}</p>
                      </div>

                      {/* Bilingual Dictionary terms */}
                      <div>
                        <h5 className="font-bold text-slate-300 font-mono text-[10px] mb-1.5">BILINGUAL LABORATORY GLOSSARY:</h5>
                        <div className="grid grid-cols-1 gap-1.5 bg-slate-900/60 p-2 rounded border border-slate-800/50">
                          {unit.keyTerms.slice(0, 3).map((term, tIdx) => (
                            <div key={tIdx} className="text-[11px] leading-tight">
                              <span className="font-bold text-slate-200">{term.en}</span>
                              <span className="text-slate-500"> → </span>
                              <span className="text-emerald-400 font-semibold">{term.my}</span>
                              <span className="text-slate-500 block text-[10px] mt-0.5">{term.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Assessment / Quiz Section */}
                  <div className="mt-4 pt-3.5 border-t border-slate-900/80">
                    {activeQuizUnit === unit.id ? (
                      // Display active quiz questions
                      <div className="bg-slate-900/55 border border-slate-800/80 p-3 rounded-lg text-xs space-y-3">
                        <div className="flex justify-between items-center font-mono text-[10px]">
                          <span className="text-amber-400 font-bold">SELF-ASSESSMENT TEST</span>
                          <span>Unit {unit.id}</span>
                        </div>

                        {(UNIT_QUIZZES[unit.id] || []).map((q, qIdx) => (
                          <div key={qIdx} className="space-y-1.5">
                            <p className="font-medium text-slate-200">{qIdx + 1}. {q.question}</p>
                            <div className="grid grid-cols-1 gap-1">
                              {q.options.map((opt, optIdx) => {
                                const isSelected = selectedAnswers[qIdx] === optIdx;
                                const isCorrect = optIdx === q.correctIndex;
                                return (
                                  <button
                                    key={optIdx}
                                    disabled={quizSubmitted}
                                    onClick={() => handleAnswerSelect(qIdx, optIdx)}
                                    className={`w-full text-left py-1.5 px-2.5 rounded border transition text-[11px] flex items-center justify-between ${
                                      quizSubmitted
                                        ? isCorrect
                                          ? "bg-emerald-950/20 border-emerald-500 text-emerald-400"
                                          : isSelected
                                          ? "bg-red-950/20 border-red-500 text-red-400"
                                          : "bg-slate-900 border-slate-850 text-slate-500"
                                        : isSelected
                                        ? "bg-amber-500/10 border-amber-500 text-amber-400"
                                        : "bg-slate-950 border-slate-850 hover:bg-slate-800/40 text-slate-300"
                                    }`}
                                  >
                                    <span>{opt}</span>
                                    {quizSubmitted && isCorrect && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                                  </button>
                                );
                              })}
                            </div>
                            {quizSubmitted && (
                              <p className="text-[10px] text-slate-500 mt-1 pl-1 italic">
                                * {q.explanation}
                              </p>
                            )}
                          </div>
                        ))}

                        {/* Submit Actions */}
                        <div className="flex justify-between items-center pt-1 mt-2">
                          {quizSubmitted ? (
                            <div className="flex items-center gap-1.5 text-[11px]">
                              {quizScore === (UNIT_QUIZZES[unit.id] || []).length ? (
                                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                                  <Award className="w-4 h-4 text-emerald-400" /> PASS! SYLLABUS LOCKED
                                </span>
                              ) : (
                                <span className="text-red-400 flex items-center gap-1">
                                  <AlertCircle className="w-3.5 h-3.5" /> FAILED ({quizScore}/{(UNIT_QUIZZES[unit.id] || []).length}). Try again!
                                </span>
                              )}
                              <button
                                onClick={() => startQuiz(unit.id)}
                                className="text-[10px] underline ml-2 text-slate-400 hover:text-slate-200"
                              >
                                Retry Quiz
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => submitQuiz(unit.id)}
                              disabled={Object.keys(selectedAnswers).length < (UNIT_QUIZZES[unit.id] || []).length}
                              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white py-1 px-3.5 rounded text-[11px] font-semibold transition shadow"
                            >
                              SUBMIT ANSWER
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      // Offer assessment starting
                      <div className="bg-slate-900/30 border border-slate-800 border-dashed p-3 rounded-lg flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                          <div>
                            <h5 className="font-bold text-slate-200">Self-Assessment Assessment Test</h5>
                            <p className="text-[10.5px] text-slate-400 mt-0.5">Solve Unit {unit.id} questions to lock in completion.</p>
                          </div>
                        </div>

                        {UNIT_QUIZZES[unit.id] ? (
                          <button
                            onClick={() => startQuiz(unit.id)}
                            className="bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 font-semibold py-1.5 px-3 rounded text-[11px] hover:bg-emerald-600 hover:text-white transition whitespace-nowrap shrink-0"
                          >
                            {completedQuizzes.includes(unit.id) ? "Retake Quiz" : "Start Test"}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono uppercase shrink-0">Reading Unit Only</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-500 pointer-events-none">
              <BookOpen className="w-10 h-10 animate-pulse text-slate-700" />
              <p className="text-xs">Select a syllabus unit from the list to view specifications</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
