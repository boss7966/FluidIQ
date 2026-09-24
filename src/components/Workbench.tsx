import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Plus, Trash2, Trophy, HelpCircle, Activity, Sparkles, RefreshCcw } from "lucide-react";
import { WorkbenchComponent, HoseConnection } from "../types";

// Setup unique ID generator
const genId = () => "comp_" + Math.random().toString(36).substring(2, 9);

interface ComponentTemplate {
  type: WorkbenchComponent["type"];
  name: string;
  nameMy: string;
  category: "pneumatics" | "hydraulics";
  ports: { id: string; x: number; y: number; type: "input" | "output" | "supply" }[];
  icon: string;
}

const TEMPLATES: ComponentTemplate[] = [
  {
    type: "compressor",
    name: "Air Compressor Source",
    nameMy: "Pemampat Udara",
    category: "pneumatics",
    ports: [{ id: "supply", x: 60, y: 15, type: "supply" }],
    icon: "⌾"
  },
  {
    type: "pump",
    name: "Hydraulic Pump Source",
    nameMy: "Pam Hidraulik",
    category: "hydraulics",
    ports: [{ id: "supply", x: 60, y: 15, type: "supply" }],
    icon: "◉"
  },
  {
    type: "32valve",
    name: "3/2 Way Push Button",
    nameMy: "Injap 3/2 Butang Tekan",
    category: "pneumatics",
    ports: [
      { id: "p1", x: 15, y: 65, type: "input" }, // supply in
      { id: "p2", x: 60, y: 15, type: "output" } // work out
    ],
    icon: "◫"
  },
  {
    type: "52valve",
    name: "5/2 Double Solenoid",
    nameMy: "Injap 5/2 Solenoid Kembar",
    category: "pneumatics",
    ports: [
      { id: "p1", x: 15, y: 65, type: "input" }, // pressure supply
      { id: "p4", x: 45, y: 15, type: "output" }, // output A
      { id: "p2", x: 75, y: 15, type: "output" }  // output B
    ],
    icon: "☵"
  },
  {
    type: "single_cylinder",
    name: "Single-Acting Cylinder",
    nameMy: "Silinder Tindakan Tunggal",
    category: "pneumatics",
    ports: [{ id: "a", x: 25, y: 70, type: "input" }],
    icon: "⇄"
  },
  {
    type: "double_cylinder",
    name: "Double-Acting Cylinder",
    nameMy: "Silinder Tindakan Dua Hala",
    category: "pneumatics",
    ports: [
      { id: "a", x: 25, y: 70, type: "input" }, // extend port
      { id: "b", x: 75, y: 70, type: "input" }  // retract port
    ],
    icon: "⇉"
  }
];

export default function Workbench({ onProgressUpdate }: { onProgressUpdate?: (percent: number) => void }) {
  const [placedComponents, setPlacedComponents] = useState<WorkbenchComponent[]>([]);
  const [connections, setConnections] = useState<HoseConnection[]>([]);
  const [selectedPort, setSelectedPort] = useState<{ compId: string; portId: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSequence, setActiveSequence] = useState<"A+" | "A+ A-" | "A+ B+ A- B-">("A+ A-");
  const [cylinderPositions, setCylinderPositions] = useState<{ [id: string]: number }>({}); // 0 to 100 percentage extended
  const [badgeEarned, setBadgeEarned] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [simCycle, setSimCycle] = useState(0);

  // Synthesize realistic pneumatic hissing sound using Web Audio API!
  const playPneumaticHiss = (volume = 0.35, duration = 1.1) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      
      const bufferSize = audioCtx.sampleRate * duration;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate White Noise
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = buffer;

      // Filter to simulate compressed air exiting a nozzle (hiss)
      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, audioCtx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(120, audioCtx.currentTime + duration - 0.1);

      // Volume envelope (puff and decay)
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + duration);

      noiseNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      noiseNode.start();
    } catch (e) {
      console.warn("Web Audio Synthesis not fully supported or blocked in iframe:", e);
    }
  };

  // Click handler to select component template & place it on the grid
  const handleAddComponent = (template: ComponentTemplate) => {
    // Generate a default coordinate
    const count = placedComponents.length;
    const x = 50 + (count % 3) * 160;
    const y = 80 + Math.floor(count / 3) * 150;

    const newComp: WorkbenchComponent = {
      id: genId(),
      type: template.type,
      name: template.name,
      nameMy: template.nameMy,
      category: template.category,
      x,
      y,
      ports: template.ports
    };

    setPlacedComponents((prev) => [...prev, newComp]);
  };

  // Select / connect ports
  const handlePortClick = (compId: string, portId: string) => {
    if (!selectedPort) {
      setSelectedPort({ compId, portId });
    } else {
      // Connect port A to port B
      if (selectedPort.compId === compId) {
        // Can't connect to itself
        setSelectedPort(null);
        return;
      }

      // Check if connection already exists
      const exists = connections.some(
        (c) =>
          (c.fromComponentId === selectedPort.compId &&
            c.fromPortId === selectedPort.portId &&
            c.toComponentId === compId &&
            c.toPortId === portId) ||
          (c.fromComponentId === compId &&
            c.fromPortId === portId &&
            c.toComponentId === selectedPort.compId &&
            c.toPortId === selectedPort.portId)
      );

      if (!exists) {
        // Find categories
        const compA = placedComponents.find((c) => c.id === selectedPort.compId);
        const compB = placedComponents.find((c) => c.id === compId);
        const color = compA?.category === "hydraulics" || compB?.category === "hydraulics" ? "blue" : "orange";

        const newConn: HoseConnection = {
          id: "hose_" + Math.random().toString(36).substring(2, 9),
          fromComponentId: selectedPort.compId,
          fromPortId: selectedPort.portId,
          toComponentId: compId,
          toPortId: portId,
          color
        };

        setConnections((prev) => [...prev, newConn]);
      }
      setSelectedPort(null);
    }
  };

  // Reset workspace
  const handleReset = () => {
    setPlacedComponents([]);
    setConnections([]);
    setSelectedPort(null);
    setIsPlaying(false);
    setCylinderPositions({});
    setBadgeEarned(false);
    setSimError(null);
  };

  // Run validation & logic sequence simulation
  const handlePlay = () => {
    if (placedComponents.length === 0) {
      setSimError("Your lab workbench is empty. Add components to build a pneumatic sequence!");
      return;
    }

    // Step 1: Must have a source (compressor or pump)
    const hasSource = placedComponents.some((c) => c.type === "compressor" || c.type === "pump");
    if (!hasSource) {
      setSimError("Missing pressure supply! Add an 'Air Compressor Source' or 'Hydraulic Pump Source'.");
      return;
    }

    // Step 2: Must have at least one valve and one cylinder
    const hasValve = placedComponents.some((c) => c.type === "32valve" || c.type === "52valve");
    const hasCylinder = placedComponents.some((c) => c.type === "single_cylinder" || c.type === "double_cylinder");

    if (!hasValve) {
      setSimError("Overpressure warning! Air must pass through a Directional Control Valve (3/2 or 5/2 Valve).");
      return;
    }
    if (!hasCylinder) {
      setSimError("Nothing to actuate! Connect your valves to a cylinder.");
      return;
    }

    // Step 3: Check if hoses are connected
    if (connections.length < 2) {
      setSimError("Chamber disconnected! Route hoses (finger-tap ports) from Compressor to Valve, then Valve to Cylinder.");
      return;
    }

    // Success! Start simulation
    setSimError(null);
    setIsPlaying(true);
    setSimCycle(0);
    playPneumaticHiss(0.4, 0.8);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCylinderPositions({});
  };

  // Simulate Cylinder Actuation Cycles
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying) {
      timer = setInterval(() => {
        // Find cylinders
        const cylinders = placedComponents.filter(
          (c) => c.type === "single_cylinder" || c.type === "double_cylinder"
        );

        setCylinderPositions((prev) => {
          const updated = { ...prev };
          cylinders.forEach((cyl) => {
            const current = updated[cyl.id] || 0;
            // Cycle back and forth to simulate logic sequence
            if (current === 0) {
              // extend
              updated[cyl.id] = 100;
              playPneumaticHiss(0.35, 0.7); // PISTON EXTEND HISS
            } else {
              // retract
              updated[cyl.id] = 0;
              playPneumaticHiss(0.2, 0.9); // EXHAUST VENT HISS
            }
          });
          return updated;
        });

        setSimCycle((c) => {
          const next = c + 1;
          if (next >= 4) {
            // Earn Badge after 2 full extend/retract sequences!
            setBadgeEarned(true);
            if (onProgressUpdate) {
              onProgressUpdate(25); // Major completion boost!
            }
          }
          return next;
        });

      }, 1800);
    }
    return () => clearInterval(timer);
  }, [isPlaying, placedComponents]);

  // Remove a placed component and its connections
  const removeComponent = (id: string) => {
    setPlacedComponents((prev) => prev.filter((c) => c.id !== id));
    setConnections((prev) => prev.filter((c) => c.fromComponentId !== id && c.toComponentId !== id));
    if (selectedPort?.compId === id) setSelectedPort(null);
  };

  return (
    <div className="bg-slate-900 border border-slate-700/50 rounded-xl shadow-2xl p-5 text-slate-100 font-sans max-w-5xl mx-auto">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
            Unit 5.0 Interactive Workbench
          </span>
          <h3 className="font-bold text-lg text-slate-100 tracking-tight mt-1">
            FLUID POWER SYSTEM WORKBENCH
          </h3>
          <p className="text-xs text-slate-400">Drag/Click components, connect ports to design pneumatic & hydraulic logic</p>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800 flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-mono">Sequence Target:</span>
            <select
              value={activeSequence}
              onChange={(e: any) => setActiveSequence(e.target.value)}
              className="bg-transparent text-amber-400 font-mono font-bold focus:outline-none"
            >
              <option value="A+">A+ (Single Action)</option>
              <option value="A+ A-">A+ A- (Reciprocating)</option>
              <option value="A+ B+ A- B-">A+ B+ A- B- (Cascade)</option>
            </select>
          </div>

          <button
            onClick={isPlaying ? handleStop : handlePlay}
            className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded shadow transition ${
              isPlaying
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5" /> STOP
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" /> RUN LOGIC
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded transition"
            title="Clear Workbench"
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Drawer - Components Menu */}
        <div className="lg:col-span-3 space-y-3.5">
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              COMPONENT DRAWER
            </h4>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 max-h-[380px] overflow-y-auto pr-1 no-scrollbar">
              {TEMPLATES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => handleAddComponent(t)}
                  className="flex items-center gap-3 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 p-2.5 rounded text-left transition text-xs w-full"
                >
                  <div className={`w-8 h-8 rounded flex items-center justify-center text-lg font-mono font-bold shrink-0 ${
                    t.category === "pneumatics" 
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" 
                      : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                  }`}>
                    {t.icon}
                  </div>
                  <div>
                    <div className="font-bold text-[11px] text-slate-200 leading-tight">{t.name}</div>
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">{t.nameMy}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="font-bold text-slate-300 mb-1 flex items-center gap-1 font-mono text-[10px]">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> ASSEMBLY TRICK:
            </div>
            <p>1. Tap a component above to add it.</p>
            <p>2. Tap a port circle (input/output) on one component, then another to wire a connection line.</p>
            <p>3. Set a sequence, and tap "RUN LOGIC" to watch pistons move with realistic high-pressure huffs.</p>
          </div>
        </div>

        {/* Central Workspace Grid */}
        <div className="lg:col-span-9 bg-slate-950 border border-slate-800/80 rounded-lg min-h-[400px] relative overflow-hidden flex flex-col justify-between">
          
          {/* Canvas Workspace Area */}
          <div className="flex-1 relative p-4 h-[350px] overflow-auto select-none" style={{ backgroundImage: "radial-gradient(#1e293b 1.5px, transparent 1.5px)", backgroundSize: "16px 16px" }}>
            
            {/* Simulation alert banner */}
            {simError && (
              <div className="absolute top-3 left-3 right-3 bg-red-950/40 border border-red-500/30 text-red-200 p-2.5 rounded text-xs z-20 flex items-center gap-2.5">
                <Trash2 className="w-4 h-4 shrink-0 text-red-400" />
                <span>{simError}</span>
              </div>
            )}

            {/* Placed components */}
            {placedComponents.map((comp) => {
              const cylExtPct = cylinderPositions[comp.id] || 0;

              return (
                <div
                  key={comp.id}
                  className="absolute bg-slate-900 border border-slate-700 rounded-lg p-3 w-40 shadow-xl"
                  style={{ left: comp.x, top: comp.y }}
                >
                  {/* Delete indicator */}
                  <button
                    onClick={() => removeComponent(comp.id)}
                    className="absolute top-1.5 right-1.5 text-slate-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Component Metadata */}
                  <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">{comp.category}</div>
                  <h5 className="font-bold text-xs text-slate-100 leading-tight mt-0.5 pr-4">{comp.name}</h5>

                  {/* Visual components animation representing cylinders & compressor */}
                  <div className="my-2.5 h-12 bg-slate-950 border border-slate-800 rounded flex items-center justify-center relative overflow-hidden">
                    {(comp.type === "single_cylinder" || comp.type === "double_cylinder") && (
                      <div className="w-full px-3 relative h-6 flex items-center">
                        {/* Cylinder body */}
                        <div className="w-2/3 h-4 bg-slate-800 border border-slate-700 rounded relative z-10">
                          {/* Piston head */}
                          <div
                            className="absolute h-full w-2 bg-emerald-500 transition-all duration-700"
                            style={{ left: `${cylExtPct * 0.7}%` }}
                          />
                        </div>
                        {/* Cylinder Rod shaft extending */}
                        <div
                          className="h-1.5 bg-slate-400 border border-slate-300 absolute transition-all duration-700"
                          style={{
                            left: "50px",
                            width: `${cylExtPct * 0.4}px`
                          }}
                        />
                        {/* Cylinder external actuator nose */}
                        <div
                          className="w-3.5 h-3.5 bg-amber-500 rounded-full border border-amber-600 transition-all duration-700 absolute"
                          style={{
                            left: `${50 + cylExtPct * 0.4}px`
                          }}
                        />
                      </div>
                    )}

                    {comp.type === "compressor" && (
                      <div className="text-center">
                        <span className={`text-2xl block font-mono ${isPlaying ? "animate-spin text-amber-500" : "text-slate-500"}`}>⌾</span>
                      </div>
                    )}
                    {comp.type === "pump" && (
                      <div className="text-center">
                        <span className={`text-2xl block font-mono ${isPlaying ? "animate-pulse text-blue-500" : "text-slate-500"}`}>◉</span>
                      </div>
                    )}
                    {(comp.type === "32valve" || comp.type === "52valve") && (
                      <div className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                        <span className="border border-slate-800 px-1 rounded bg-slate-900">A</span>
                        <span className="text-slate-400">⇆</span>
                        <span className="border border-slate-800 px-1 rounded bg-slate-900">B</span>
                      </div>
                    )}
                  </div>

                  {/* Ports for hose mapping */}
                  <div className="flex justify-around items-center pt-1 border-t border-slate-800/60">
                    {comp.ports.map((port) => {
                      const isPortSelected = selectedPort?.compId === comp.id && selectedPort?.portId === port.id;
                      return (
                        <button
                          key={port.id}
                          onClick={() => handlePortClick(comp.id, port.id)}
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center font-mono text-[8px] font-bold transition-all ${
                            isPortSelected
                              ? "bg-amber-400 border-white scale-125 shadow-[0_0_8px_#fbbf24]"
                              : comp.category === "hydraulics"
                              ? "bg-blue-950 border-blue-500 text-blue-400 hover:bg-blue-800"
                              : "bg-amber-950 border-amber-500 text-amber-400 hover:bg-amber-800"
                          }`}
                          title={`Port: ${port.id.toUpperCase()}`}
                        >
                          {port.id[0].toUpperCase()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Render connection hoses lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              {connections.map((conn) => {
                const fromComp = placedComponents.find((c) => c.id === conn.fromComponentId);
                const toComp = placedComponents.find((c) => c.id === conn.toComponentId);
                if (!fromComp || !toComp) return null;

                // Find port offsets
                const fromPort = fromComp.ports.find((p) => p.id === conn.fromPortId);
                const toPort = toComp.ports.find((p) => p.id === conn.toPortId);
                if (!fromPort || !toPort) return null;

                const x1 = fromComp.x + 80; // approximate center offset
                const y1 = fromComp.y + 115;
                const x2 = toComp.x + 80;
                const y2 = toComp.y + 115;

                return (
                  <g key={conn.id}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={conn.color === "blue" ? "#3b82f6" : "#f97316"}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className={isPlaying ? "stroke-dasharray-[6] animate-[dash_1.5s_linear_infinite]" : ""}
                      style={{
                        strokeDasharray: isPlaying ? "8, 5" : "none"
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Instruction placeholder if empty */}
            {placedComponents.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4 pointer-events-none">
                <Activity className="w-12 h-12 text-slate-700 animate-pulse" />
                <div>
                  <h4 className="font-bold text-slate-500 text-sm font-mono tracking-wider">LAB CANVAS OFFLINE</h4>
                  <p className="text-xs text-slate-600 max-w-sm mt-1">
                    Select tools from the drawer to begin designing J4012 circuits
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Gamified Trophies & Stats Section */}
          {badgeEarned && (
            <div className="bg-slate-950 p-4 border-t border-slate-800/80 rounded-b-lg flex flex-col md:flex-row items-center justify-between gap-4 z-20">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-500/10 p-2.5 rounded-full border border-yellow-500/30 animate-bounce">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-yellow-400 tracking-wide flex items-center gap-1.5">
                    SEQUENCE MASTER BADGE EARNED!
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h4>
                  <p className="text-xs text-slate-400">
                    Piston cylinder sequence logic synchronized. Successfully executed {simCycle} flow cycles.
                  </p>
                </div>
              </div>
              <div className="font-mono text-emerald-400 text-xs font-bold bg-emerald-950/40 border border-emerald-500/20 px-3 py-1 rounded">
                +25% LAB PROGRESS BOOST
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
