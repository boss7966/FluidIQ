import React, { useState } from "react";
import { Calculator, HelpCircle, Activity, RotateCcw } from "lucide-react";

export default function FormulaCalculator({ onClose }: { onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<"pascal" | "boyle" | "cylinder">("pascal");

  // Pascal's Law state
  const [pascalForce, setPascalForce] = useState<number>(100); // Newtons
  const [pascalPressure, setPascalPressure] = useState<number>(10); // bar (1 bar = 100 kPa)
  const [pascalArea, setPascalArea] = useState<number>(10); // cm^2
  const [pascalSolveFor, setPascalSolveFor] = useState<"force" | "pressure" | "area">("force");

  // Boyle's Law state
  const [boyleP1, setBoyleP1] = useState<number>(1); // bar
  const [boyleV1, setBoyleV1] = useState<number>(10); // Litres
  const [boyleP2, setBoyleP2] = useState<number>(2); // bar
  const [boyleV2, setBoyleV2] = useState<number>(5); // Litres
  const [boyleSolveFor, setBoyleSolveFor] = useState<"p1" | "v1" | "p2" | "v2">("v2");

  // Cylinder Force state
  const [cylBore, setCylBore] = useState<number>(50); // mm
  const [cylRod, setCylRod] = useState<number>(20); // mm
  const [cylPress, setCylPress] = useState<number>(6); // bar (standard pneumatics)
  const [cylExtForce, setCylExtForce] = useState<number>(0);
  const [cylRetForce, setCylRetForce] = useState<number>(0);

  const handlePascalCalculate = () => {
    if (pascalSolveFor === "force") {
      // F = P * A (P in bar, A in cm^2. 1 bar = 10 N/cm^2)
      // Force in Newtons = Pressure (bar) * Area (cm^2) * 10
      return pascalPressure * pascalArea * 10;
    } else if (pascalSolveFor === "pressure") {
      // P = F / (A * 10)
      return pascalArea > 0 ? pascalForce / (pascalArea * 10) : 0;
    } else {
      // A = F / (P * 10)
      return pascalPressure > 0 ? pascalForce / (pascalPressure * 10) : 0;
    }
  };

  const handleBoyleCalculate = () => {
    // P1 * V1 = P2 * V2
    if (boyleSolveFor === "p1") {
      return boyleV1 > 0 ? (boyleP2 * boyleV2) / boyleV1 : 0;
    } else if (boyleSolveFor === "v1") {
      return boyleP1 > 0 ? (boyleP2 * boyleV2) / boyleP1 : 0;
    } else if (boyleSolveFor === "p2") {
      return boyleV2 > 0 ? (boyleP1 * boyleV1) / boyleV2 : 0;
    } else {
      return boyleP2 > 0 ? (boyleP1 * boyleV1) / boyleP2 : 0;
    }
  };

  // Cylinder forces calculation
  const calculateCylinderForces = () => {
    const boreRadiusCm = cylBore / 20; // convert mm to cm, then divide by 2
    const rodRadiusCm = cylRod / 20;
    const pistonArea = Math.PI * Math.pow(boreRadiusCm, 2);
    const rodArea = Math.PI * Math.pow(rodRadiusCm, 2);
    const effectiveRetractArea = pistonArea - rodArea;

    // 1 bar = 10 N/cm^2
    const ext = cylPress * pistonArea * 10;
    const ret = cylPress * Math.max(0, effectiveRetractArea) * 10;
    return { ext: Math.round(ext * 10) / 10, ret: Math.round(ret * 10) / 10 };
  };

  const cylResults = calculateCylinderForces();

  return (
    <div className="bg-slate-900 border border-slate-700/60 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md max-w-xl mx-auto w-full text-slate-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            <Calculator className="w-5 h-5 text-amber-500 animate-pulse" />
          </div>
          <div>
            <h3 className="font-semibold text-sm tracking-wider text-slate-200">LAB CALCULATOR</h3>
            <p className="text-xs text-slate-400">J4012 Hydro-Pneumatic Fluid Formulas</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xs px-2.5 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 transition"
          >
            Close
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40 p-1.5 gap-1">
        <button
          onClick={() => setActiveTab("pascal")}
          className={`flex-1 text-center py-2 text-xs font-medium rounded-md tracking-wider transition ${
            activeTab === "pascal"
              ? "bg-blue-600/15 text-blue-400 border border-blue-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          PASCAL'S LAW (Hidraulik)
        </button>
        <button
          onClick={() => setActiveTab("boyle")}
          className={`flex-1 text-center py-2 text-xs font-medium rounded-md tracking-wider transition ${
            activeTab === "boyle"
              ? "bg-amber-600/15 text-amber-400 border border-amber-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          BOYLE'S LAW (Pneumatik)
        </button>
        <button
          onClick={() => setActiveTab("cylinder")}
          className={`flex-1 text-center py-2 text-xs font-medium rounded-md tracking-wider transition ${
            activeTab === "cylinder"
              ? "bg-emerald-600/15 text-emerald-400 border border-emerald-500/30"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
          }`}
        >
          CYLINDER FORCE (J4012)
        </button>
      </div>

      {/* Calculator Body */}
      <div className="p-5 space-y-4">
        {/* Pascal's Law Tab */}
        {activeTab === "pascal" && (
          <div className="space-y-4">
            <div className="bg-slate-950/50 p-3.5 border border-slate-800 rounded-lg flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">HUKUM PASCAL</span>
                <h4 className="text-sm font-semibold text-slate-200 mt-1">Pressure Multiplier Principle</h4>
                <p className="text-xs text-slate-400 max-w-sm">Pressure applied to fluid acts equally in all directions.</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-lg font-bold text-blue-400 tracking-wider">F = P × A</span>
              </div>
            </div>

            {/* Selector Solve For */}
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1 rounded-md">
              {(["force", "pressure", "area"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setPascalSolveFor(mode)}
                  className={`py-1.5 text-xs font-medium rounded capitalize tracking-wider transition ${
                    pascalSolveFor === mode
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Solve for {mode}
                </button>
              ))}
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              {pascalSolveFor !== "force" && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-mono">Force (F) - Newtons</label>
                  <input
                    type="number"
                    value={pascalForce}
                    onChange={(e) => setPascalForce(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
              {pascalSolveFor !== "pressure" && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-mono">Pressure (P) - bar</label>
                  <input
                    type="number"
                    value={pascalPressure}
                    onChange={(e) => setPascalPressure(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
              {pascalSolveFor !== "area" && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-mono">Piston Area (A) - cm²</label>
                  <input
                    type="number"
                    value={pascalArea}
                    onChange={(e) => setPascalArea(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Result Display */}
            <div className="bg-blue-950/20 border border-blue-500/20 p-4 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-xs text-blue-400 font-semibold tracking-wider font-mono">CALCULATED OUTCOME:</span>
                <p className="text-xs text-slate-400 capitalize mt-1">Target value solved for: {pascalSolveFor}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-blue-400 font-mono">
                  {Math.round(handlePascalCalculate() * 100) / 100}
                </span>
                <span className="text-xs text-slate-300 font-mono ml-1.5">
                  {pascalSolveFor === "force" ? "N" : pascalSolveFor === "pressure" ? "bar" : "cm²"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Boyle's Law Tab */}
        {activeTab === "boyle" && (
          <div className="space-y-4">
            <div className="bg-slate-950/50 p-3.5 border border-slate-800 rounded-lg flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-mono">HUKUM BOYLE</span>
                <h4 className="text-sm font-semibold text-slate-200 mt-1">Ideal Gas Compressibility</h4>
                <p className="text-xs text-slate-400 max-w-sm">Constant temperature pressure-volume ratios.</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-lg font-bold text-amber-400 tracking-wider">P₁V₁ = P₂V₂</span>
              </div>
            </div>

            {/* Selector Solve For */}
            <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-md text-xs">
              {(["p1", "v1", "p2", "v2"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setBoyleSolveFor(mode)}
                  className={`py-1.5 font-medium rounded uppercase transition ${
                    boyleSolveFor === mode
                      ? "bg-amber-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Input Grid */}
            <div className="grid grid-cols-2 gap-3">
              {boyleSolveFor !== "p1" && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-mono">Initial Press (P₁) - bar</label>
                  <input
                    type="number"
                    value={boyleP1}
                    onChange={(e) => setBoyleP1(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}
              {boyleSolveFor !== "v1" && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-mono">Initial Vol (V₁) - L</label>
                  <input
                    type="number"
                    value={boyleV1}
                    onChange={(e) => setBoyleV1(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}
              {boyleSolveFor !== "p2" && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-mono">Final Press (P₂) - bar</label>
                  <input
                    type="number"
                    value={boyleP2}
                    onChange={(e) => setBoyleP2(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}
              {boyleSolveFor !== "v2" && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-mono">Final Vol (V₂) - L</label>
                  <input
                    type="number"
                    value={boyleV2}
                    onChange={(e) => setBoyleV2(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Result */}
            <div className="bg-amber-950/20 border border-amber-500/20 p-4 rounded-lg flex justify-between items-center">
              <div>
                <span className="text-xs text-amber-400 font-semibold tracking-wider font-mono">CALCULATED OUTCOME:</span>
                <p className="text-xs text-slate-400 uppercase mt-1">Target value solved for: {boyleSolveFor}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-amber-400 font-mono">
                  {Math.round(handleBoyleCalculate() * 100) / 100}
                </span>
                <span className="text-xs text-slate-300 font-mono ml-1.5">
                  {boyleSolveFor.startsWith("p") ? "bar" : "Litres"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Cylinder Force Tab */}
        {activeTab === "cylinder" && (
          <div className="space-y-4">
            <div className="bg-slate-950/50 p-3.5 border border-slate-800 rounded-lg flex flex-col md:flex-row justify-between items-center gap-3">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">UNIT 3 & UNIT 8 FORCE</span>
                <h4 className="text-sm font-semibold text-slate-200 mt-1">Double Acting Cylinder Forces</h4>
                <p className="text-xs text-slate-400 max-w-sm">Calculates pull & push forces, highlighting rod-side losses.</p>
              </div>
              <div className="text-right text-xs space-y-1 font-mono text-slate-400">
                <div>A_ext = πD²/4</div>
                <div>A_ret = π(D²-d²)/4</div>
              </div>
            </div>

            {/* Parameters Inputs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block font-mono">Bore Dia (D) - mm</label>
                <input
                  type="number"
                  value={cylBore}
                  onChange={(e) => setCylBore(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block font-mono">Rod Dia (d) - mm</label>
                <input
                  type="number"
                  value={cylRod}
                  onChange={(e) => setCylRod(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 block font-mono">Pressure (P) - bar</label>
                <input
                  type="number"
                  value={cylPress}
                  onChange={(e) => setCylPress(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Output Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-950/25 border border-emerald-500/20 p-3.5 rounded-lg text-center">
                <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Extension (Push) Force</span>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-1.5">
                  {cylResults.ext} <span className="text-xs text-slate-300">N</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Area = {Math.round(Math.PI * Math.pow(cylBore/20, 2) * 100) / 100} cm²</p>
              </div>

              <div className="bg-emerald-950/25 border border-emerald-500/20 p-3.5 rounded-lg text-center">
                <span className="text-[11px] text-slate-400 font-mono uppercase tracking-wider">Retraction (Pull) Force</span>
                <div className="text-xl font-bold text-emerald-400 font-mono mt-1.5">
                  {cylResults.ret} <span className="text-xs text-slate-300">N</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Area = {Math.round(Math.PI * (Math.pow(cylBore/20, 2) - Math.pow(cylRod/20, 2)) * 100) / 100} cm²</p>
              </div>
            </div>

            <div className="text-[10.5px] bg-slate-950 p-2.5 rounded text-slate-400 flex items-start gap-2 border border-slate-800">
              <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                *Retraction force is lower than extension force because the piston rod occupies space inside the cylinder chamber, reducing the effective oil/air working surface area.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-slate-950 px-5 py-3 border-t border-slate-800 text-[10.5px] text-slate-400 flex justify-between items-center font-mono">
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3 text-blue-500 animate-pulse" />
          POLYTECHNIC LAB MODULE COMPLIANT
        </span>
        <span>J4012 CALC V1.0</span>
      </div>
    </div>
  );
}
