import React, { useState } from "react";
import { Camera, RefreshCw, FileImage, Download, Bookmark, Check, ShieldAlert } from "lucide-react";
import { ISOSymbol } from "../types";

// Standard ISO Symbols from Pages 17-21 & 163-166 of J4012 Module
const J4012_SYMBOLS: ISOSymbol[] = [
  {
    id: "sym_compressor",
    nameEn: "Pneumatic Compressor",
    nameMy: "Pemampat Udara",
    category: "sources",
    imageUrl: "⌾",
    description: "Draws atmospheric air, compresses it to high pressure, and stores it in the receiver tank. Source of pneumatic power in Unit 2.",
    unitRef: 2,
    specification: "Max Output: 10 bar | Flow Rate: 120 L/min | ISO 1219"
  },
  {
    id: "sym_frl",
    nameEn: "F.R.L. Unit (Filter Regulator Lubricator)",
    nameMy: "Unit Penyediaan Udara (FRL)",
    category: "sources",
    imageUrl: "◫",
    description: "Combined three-part component that filters dust/water, regulates working pressure (usually 6 bar), and injects lubricating oil mist.",
    unitRef: 2,
    specification: "Filter Rating: 40μm | Outlet Range: 0.5-8.5 bar | ISO 1219"
  },
  {
    id: "sym_single_cyl",
    nameEn: "Single-Acting Cylinder (Spring Return)",
    nameMy: "Silinder Tindakan Tunggal",
    category: "actuators",
    imageUrl: "⇄",
    description: "Translates pressurized air into linear push force. Retracts automatically via an internal mechanical return spring once air is vented.",
    unitRef: 3,
    specification: "Bore: 25mm | Stroke: 50mm | Return Force: 15 N"
  },
  {
    id: "sym_double_cyl",
    nameEn: "Double-Acting Cylinder",
    nameMy: "Silinder Tindakan Dua Hala",
    category: "actuators",
    imageUrl: "⇉",
    description: "Translates pressurized air/oil into linear force in both directions. Features double ports to extend and retract using fluid flow.",
    unitRef: 3,
    specification: "Bore: 40mm | Stroke: 200mm | Cushioning: Adjustable"
  },
  {
    id: "sym_52solenoid",
    nameEn: "5/2 Way Double Solenoid Valve",
    nameMy: "Injap 5/2 Solenoid Kembar",
    category: "valves",
    imageUrl: "☵",
    description: "Bi-stable valve with 5 ports and 2 positions. Electrically operated by dual 24V solenoids. Retains its shifted state as memory.",
    unitRef: 4,
    specification: "Solenoid: 24V DC | Connection Ports: G1/8 | Flow Rate: 550 L/min"
  },
  {
    id: "sym_hyd_pump",
    nameEn: "Hydraulic Pump",
    nameMy: "Pam Hidraulik",
    category: "sources",
    imageUrl: "◉",
    description: "Positive displacement pump (usually gear type) that delivers continuous oil flow to generate pressure in hydraulics. Found in Unit 8.",
    unitRef: 8,
    specification: "Pressure Rating: 150 bar | Displacement: 4 cc/rev"
  },
  {
    id: "sym_relief_valve",
    nameEn: "Pressure Relief Valve",
    nameMy: "Injap Pelepas Tekanan",
    category: "valves",
    imageUrl: "◬",
    description: "Critical hydraulic safety valve. Opens to release pressure back to the reservoir when circuit loading exceeds the preset rating.",
    unitRef: 9,
    specification: "Cracking Pressure: 10-100 bar | Connection: Inline | ISO 1219-1"
  },
  {
    id: "sym_flow_ctrl",
    nameEn: "One-Way Flow Control Valve",
    nameMy: "Injap Kawalan Aliran Satu Arah",
    category: "valves",
    imageUrl: "⧓",
    description: "Throttles fluid flow in one direction (meter-in/meter-out) while allowing free flow in reverse via a built-in check valve bypass.",
    unitRef: 9,
    specification: "Throttling: Needle Valve | Cracking: 0.5 bar"
  }
];

export default function SymbolScanner({ onProgressUpdate }: { onProgressUpdate?: (percent: number) => void }) {
  const [selectedSymbol, setSelectedSymbol] = useState<ISOSymbol>(J4012_SYMBOLS[2]);
  const [isScanning, setIsScanning] = useState(false);
  const [savedNotes, setSavedNotes] = useState<string[]>([]);
  const [scanTab, setScanTab] = useState<"viewfinder" | "gallery">("viewfinder");

  const triggerScan = (symbol: ISOSymbol) => {
    setIsScanning(true);
    setSelectedSymbol(symbol);
    setTimeout(() => {
      setIsScanning(false);
      // Trigger a completion bonus if scanning new symbols
      if (!savedNotes.includes(symbol.id)) {
        if (onProgressUpdate) {
          onProgressUpdate(10);
        }
      }
    }, 1200);
  };

  const saveToLabNote = (symbol: ISOSymbol) => {
    if (!savedNotes.includes(symbol.id)) {
      setSavedNotes([...savedNotes, symbol.id]);
    }

    // Generate specification download
    const blueprintTxt = `===========================================================
                FLUIDIQ ISO BLUEPRINT SHEET
       J4012 Pneumatics & Hydraulics - Polytechnic Lab
===========================================================

COMPONENT: ${symbol.nameEn.toUpperCase()}
MALAY TRANSLATION: ${symbol.nameMy}
ISO SYMBOL REPRESENTATION: [ ${symbol.imageUrl} ]
Syllabus Reference: Unit ${symbol.unitRef} (Page Ref: 17-21 & 163-166)

-----------------------------------------------------------
1. DETAILED SPECIFICATIONS
-----------------------------------------------------------
- Class: ${symbol.category.toUpperCase()}
- Mechanical Specs: ${symbol.specification}
- Standard Standard: ISO 1219 / ISO 1219-1:2012

-----------------------------------------------------------
2. OPERATIONAL PRINCIPLE
-----------------------------------------------------------
${symbol.description}

-----------------------------------------------------------
3. LAB MAINTENANCE CHECK
-----------------------------------------------------------
Verify all pilot/electric terminals are tight. Ensure O-rings are 
free of abrasion dust. Test port sealing at 6 bar working pressure.

===========================================================
FluidIQ: Build the logic. Feel the pressure.
Blueprint saved to folder successfully.
===========================================================
`;

    const blob = new Blob([blueprintTxt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${symbol.id}_blueprint.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden shadow-xl text-slate-100 font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
            <Camera className="w-5 h-5 text-blue-400 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-wider">ISO VISION SCANNER</h3>
            <p className="text-xs text-slate-400">Scan symbols from J4012 Pages 17–21 & 163–166</p>
          </div>
        </div>
        <div className="flex bg-slate-950 p-1 rounded-md text-xs">
          <button
            onClick={() => setScanTab("viewfinder")}
            className={`px-3 py-1 rounded transition font-medium ${
              scanTab === "viewfinder" ? "bg-blue-600 text-white" : "text-slate-400"
            }`}
          >
            Syllabus Scanner
          </button>
          <button
            onClick={() => setScanTab("gallery")}
            className={`px-3 py-1 rounded transition font-medium ${
              scanTab === "gallery" ? "bg-blue-600 text-white" : "text-slate-400"
            }`}
          >
            Symbol Database ({J4012_SYMBOLS.length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5">
        {/* Scanner view or database grid */}
        <div className="md:col-span-7 flex flex-col items-center justify-center bg-slate-950 rounded-lg p-4 border border-slate-800/80 relative min-h-[350px]">
          {scanTab === "viewfinder" ? (
            <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden">
              {/* Overlay scanning lines */}
              <div className="absolute inset-4 border-2 border-dashed border-blue-500/30 rounded flex flex-col items-center justify-center pointer-events-none">
                {/* Laser line animation */}
                <div className="absolute w-full h-[2px] bg-blue-500/75 shadow-[0_0_10px_#3b82f6] top-0 animate-[scan_2.5s_infinite]" />
                
                {/* Visual target brackets */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
              </div>

              {/* Central Target Symbol */}
              {isScanning ? (
                <div className="text-center space-y-3 py-10 z-10">
                  <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
                  <p className="text-xs text-blue-400 font-mono tracking-wider animate-pulse">ANALYZING SPECIFICATIONS...</p>
                </div>
              ) : (
                <div className="text-center p-6 space-y-6 z-10 w-full">
                  <div className="w-28 h-28 mx-auto bg-slate-900 border border-blue-500/30 rounded-xl flex items-center justify-center text-4xl shadow-2xl relative select-none">
                    <span className="font-mono text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                      {selectedSymbol.imageUrl}
                    </span>
                    <span className="absolute bottom-1 right-2 text-[10px] text-slate-500 font-mono font-bold">ISO 1219</span>
                  </div>
                  <div>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded px-2.5 py-0.5 font-mono uppercase">
                      Textbook Page Match
                    </span>
                    <p className="text-xs text-slate-400 mt-2 font-mono">Click standard textbook symbol below to match:</p>
                  </div>
                </div>
              )}

              {/* Simulated scan triggers */}
              <div className="w-full flex gap-1.5 overflow-x-auto p-1.5 border-t border-slate-900 absolute bottom-0 bg-slate-950/90 no-scrollbar">
                {J4012_SYMBOLS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => triggerScan(s)}
                    disabled={isScanning}
                    className={`px-3 py-2 text-xs rounded border shrink-0 transition font-mono flex items-center gap-1.5 ${
                      selectedSymbol.id === s.id
                        ? "bg-blue-600/15 border-blue-500 text-blue-400 font-bold"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <span className="text-sm font-bold text-blue-400">{s.imageUrl}</span>
                    {s.nameMy.substring(0, 10)}...
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Symbol Database Grid view
            <div className="w-full grid grid-cols-2 gap-3.5 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
              {J4012_SYMBOLS.map((sym) => (
                <button
                  key={sym.id}
                  onClick={() => {
                    setSelectedSymbol(sym);
                    setScanTab("viewfinder");
                  }}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/40 p-3 rounded-lg flex items-center gap-3.5 transition text-left"
                >
                  <div className="w-11 h-11 bg-slate-950 border border-slate-800 rounded flex items-center justify-center text-xl text-blue-400 font-mono shrink-0">
                    {sym.imageUrl}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-200 leading-tight">{sym.nameEn}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{sym.nameMy}</p>
                    <span className="text-[9px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono mt-1 inline-block uppercase">
                      Unit {sym.unitRef}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results Tagging Panel */}
        <div className="md:col-span-5 flex flex-col justify-between bg-slate-900 p-4 border border-slate-800 rounded-lg">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded font-mono px-2 py-0.5 uppercase tracking-wider">
                SMART-TAG METADATA
              </span>
              <h4 className="font-bold text-base text-slate-100 mt-2 tracking-tight">
                {selectedSymbol.nameEn}
              </h4>
              <p className="text-xs text-blue-400 font-medium font-mono mt-0.5 flex items-center gap-1.5">
                Malay: <span className="text-slate-300 font-sans">{selectedSymbol.nameMy}</span>
              </p>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <p className="leading-relaxed">
                {selectedSymbol.description}
              </p>
              <div className="bg-slate-950 p-2.5 rounded font-mono text-[11px] border border-slate-800 space-y-1">
                <div className="text-slate-400">Category: <span className="text-slate-200 capitalize">{selectedSymbol.category}</span></div>
                <div className="text-slate-400">Page Reference: <span className="text-slate-200 font-sans">Pages 17-21 & 163-166</span></div>
                <div className="text-slate-400">Module Reference: <span className="text-amber-400 font-bold">J4012 Unit {selectedSymbol.unitRef}</span></div>
                <div className="text-slate-400 mt-1 border-t border-slate-900 pt-1">
                  Spec: <span className="text-emerald-400 text-[10.5px]">{selectedSymbol.specification}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <button
              onClick={() => saveToLabNote(selectedSymbol)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2 px-3 rounded transition shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              Save to Lab Note (Download Blueprint)
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[10.5px] text-slate-400 font-mono">
              <Bookmark className="w-3 h-3 text-amber-500" />
              {savedNotes.includes(selectedSymbol.id) ? (
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Saved to Report Notebook
                </span>
              ) : (
                <span>Ready for report notebook import</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer warning */}
      <div className="bg-slate-950 p-3 border-t border-slate-800 text-[10px] text-slate-400 flex items-center gap-2 font-mono">
        <ShieldAlert className="w-4 h-4 text-amber-500" />
        <span>APPROVED FOR J4012 PNEUMATICS & HYDRAULICS PRACTICAL EXPERIMENTS PORTFOLIO EXPORT.</span>
      </div>
    </div>
  );
}
