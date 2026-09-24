import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// J4012 Module Course Knowledge Base for RAG Search
interface CourseUnit {
  id: number;
  title: string;
  titleMy: string;
  type: "pneumatics" | "hydraulics" | "both";
  summary: string;
  keyTerms: { en: string; my: string; desc: string }[];
  formulas?: { name: string; eq: string; desc: string }[];
  sections: { title: string; content: string }[];
  troubleshooting?: { symptom: string; cause: string; solution: string }[];
}

const J4012_KNOWLEDGE: CourseUnit[] = [
  {
    id: 1,
    title: "Introduction to Pneumatic Systems",
    titleMy: "Pengenalan Sistem Pneumatik",
    type: "pneumatics",
    summary: "Basics of pneumatics, atmospheric pressure, gauge pressure, absolute pressure, and the advantages/disadvantages of pneumatic systems in engineering.",
    keyTerms: [
      { en: "Atmospheric Pressure", my: "Tekanan Atmosfera", desc: "Pressure exerted by the weight of air in the atmosphere (approx 1.013 bar / 101.3 kPa)." },
      { en: "Gauge Pressure", my: "Tekanan Tolok", desc: "Pressure measured relative to atmospheric pressure (0 bar on a standard gauge)." },
      { en: "Absolute Pressure", my: "Tekanan Mutlak", desc: "The total pressure relative to absolute vacuum. Absolute Pressure = Gauge Pressure + Atmospheric Pressure." }
    ],
    formulas: [
      { name: "Absolute Pressure", eq: "P_abs = P_gauge + P_atm", desc: "Calculates total pressure including atmospheric weight." }
    ],
    sections: [
      {
        title: "Section 1.1: Basic Principles",
        content: "Pneumatics uses pressurized gas (usually air) to transmit and control power. Air is clean, abundant, easily transported in pipes, and safe in hazardous environments. However, air is compressible, leading to non-uniform piston speeds under varying loads, and requires lubrication to prevent cylinder wear."
      },
      {
        title: "Section 1.2: Pressure Definitions",
        content: "Atmospheric pressure is 101.3 kPa at sea level. Gauge pressure is the pressure displayed on gauges (relative to atmospheric). Absolute pressure uses absolute zero pressure (vacuum) as its reference point."
      }
    ]
  },
  {
    id: 2,
    title: "Air Compressors & Air Distribution Systems",
    titleMy: "Pemampat Udara & Sistem Pengagihan Udara",
    type: "pneumatics",
    summary: "Air compression methods (reciprocating, rotary, screw), air receivers, secondary air treatment (F.R.L. unit: Filter, Regulator, Lubricator), and pipe ring systems.",
    keyTerms: [
      { en: "Receiver Tank", my: "Tangki Penerima", desc: "Dampens pressure pulses, cools the compressed air, and stores air capacity to prevent frequent compressor cycling." },
      { en: "FRL Unit", my: "Unit Penyediaan Udara (FRL)", desc: "A three-part assembly: Filter (tapis kotoran), Regulator (kawal tekanan), and Lubricator (pelincir injap)." },
      { en: "Ring Main", my: "Paip Utama Gelang", desc: "A looped piping layout ensuring equal pressure distribution to all workstations and allowing easy drainage of moisture." }
    ],
    sections: [
      {
        title: "Section 2.1: Compressor Types",
        content: "Reciprocating compressors use pistons to reduce volume and increase pressure, suitable for high pressure. Rotary compressors use rotating vanes or screws, delivering smooth, continuous flow. Screw compressors are popular for industrial labs due to quiet operation and heavy continuous duty cycle."
      },
      {
        title: "Section 2.2: Air Preparation (F.R.L. Unit)",
        content: "Before reaching control valves and actuators, the air must be prepared: 1. Filter removes rust, scale, and condensed water. 2. Regulator adjusts pressure to operating levels (usually 6 bar in lab). 3. Lubricator adds a fine oil mist to lubricate moving seals in cylinders and spool valves."
      }
    ]
  },
  {
    id: 3,
    title: "Pneumatic Actuators",
    titleMy: "Penggerak Pneumatik (Silinder)",
    type: "pneumatics",
    summary: "Mechanical devices that convert fluid power into linear or rotary motion, focusing on single-acting and double-acting cylinders, seals, and cushioning.",
    keyTerms: [
      { en: "Single-Acting Cylinder", my: "Silinder Tindakan Tunggal", desc: "Has one air port. Extends by pressurized air, retracts via an internal spring (spring return)." },
      { en: "Double-Acting Cylinder", my: "Silinder Tindakan Dua Hala", desc: "Has two air ports. Extends and retracts using pressurized air, allowing force in both directions." },
      { en: "Cushioning", my: "Kusyen Udara", desc: "Adjustable decelerator at the cylinder end cap that traps air to slow down the piston before impact, reducing noise and damage." }
    ],
    formulas: [
      { name: "Piston Area", eq: "A = (π × D^2) / 4", desc: "Area of the piston face where D is the bore diameter." },
      { name: "Single-Acting Force (Extension)", eq: "F_ext = (P × A) - F_spring", desc: "Force exerted by single acting cylinder, minus spring force." },
      { name: "Double-Acting Extension Force", eq: "F_ext = P × A", desc: "Extension force exerted by a double-acting cylinder." },
      { name: "Double-Acting Retraction Force", eq: "F_ret = P × (A_piston - A_rod)", desc: "Retraction force is less because the rod reduces the effective piston area." }
    ],
    sections: [
      {
        title: "Section 3.1: Linear Actuators",
        content: "Single-acting cylinders are used for clamping, ejecting, and simple holding where stroke length is short (<100mm) due to spring limitations. Double-acting cylinders have infinite stroke applications, and can pull or push with high force. The retraction force is always smaller than the extension force because the piston rod occupies space on the retracting side, reducing effective area."
      },
      {
        title: "Section 3.2: Seals and Cushioning",
        content: "Lip seals prevent leakage across the piston head. Ring cushion plungers trap exhaust air at the end of the stroke, forcing it to pass through a tiny, needle-valve adjusted throttle, creating a pneumatic dashpot cushion."
      }
    ]
  },
  {
    id: 4,
    title: "Directional Control Valves (DCV)",
    titleMy: "Injap Kawalan Arah",
    type: "pneumatics",
    summary: "Valve ports and positions (3/2, 5/2, 5/3), actuation methods (manual, mechanical, pneumatic pilot, electrical solenoid), and spool design.",
    keyTerms: [
      { en: "3/2 Way Valve", my: "Injap 3/2 Hala", desc: "Has 3 ports and 2 positions. Commonly used to control single-acting cylinders or pilot other valves." },
      { en: "5/2 Way Valve", my: "Injap 5/2 Hala", desc: "Has 5 ports and 2 positions. Standard for controlling double-acting cylinders (Ports 2/4 go to cylinder chambers, 1 is supply, 3/5 are exhaust)." },
      { en: "Solenoid Valve", my: "Injap Solenoid", desc: "Electromagnetically actuated valve. Single solenoid uses a return spring; double solenoid maintains its state (bi-stable memory)." }
    ],
    sections: [
      {
        title: "Section 4.1: Port Numbering & ISO Symbols",
        content: "Based on ISO 1219: Port 1 is pressure supply, Ports 2 & 4 are working ports to cylinders, Ports 3 & 5 are exhausts, Ports 12 & 14 are pilot control inputs (where applying pilot air to 14 connects supply 1 to working port 4)."
      },
      {
        title: "Section 4.2: Spool Valve Design",
        content: "A spool valve consists of a sliding metal cylinder (spool) inside a valve body. When shifted, lands on the spool cover or uncover specific ports, altering flow paths. Spool valves can be direct-acting or pilot-operated for lower actuation force."
      }
    ]
  },
  {
    id: 5,
    title: "Control Circuit Logic & Multi-Cylinder Sequences",
    titleMy: "Litar Kawalan Pneumatik & Jujukan Silinder",
    type: "pneumatics",
    summary: "Pneumatic circuits, AND/OR logic gates, memory circuits, and multi-cylinder sequencing (e.g. A+ B+ A- B-) using Step Counters, Cascade systems, or limit switches.",
    keyTerms: [
      { en: "Shuttle Valve (OR Gate)", my: "Injap Ulang-Alik (Injap ATAU)", desc: "Allows flow if pressure is applied to either Input A OR Input B." },
      { en: "Dual-Pressure Valve (AND Gate)", my: "Injap Dua Tekanan (Injap DAN)", desc: "Requires pressure at both Input A AND Input B simultaneously to deliver an output." },
      { en: "Cascade System", my: "Sistem Melata (Cascade)", desc: "A method to solve overlapping pneumatic pilot signals by dividing cylinder sequences into non-conflicting groups and using group valves." },
      { en: "Step Counter", my: "Penghitung Langkah (Step Counter)", desc: "A modular sequencer where each step must be fully completed (e.g., cylinder limit switch tripped) before the controller enables the next step." }
    ],
    sections: [
      {
        title: "Section 5.1: Logic Circuits",
        content: "Logic gates are vital for safety. An AND valve ensures two-hand control (operator must press two buttons at once, protecting hands from presses). An OR valve allows cylinder operation from two separate locations (e.g. lab entry and emergency reset)."
      },
      {
        title: "Section 5.2: Multi-Cylinder Sequencing",
        content: "Sequencing like A+ B+ A- B- describes: Cylinder A extends (A+), then Cylinder B extends (B+), then Cylinder A retracts (A-), then Cylinder B retracts (B-). If pilot signals overlap (e.g. limit switch 'a1' still active when 'a0' is triggered), the valve stalls. Group selection in Cascade circuits or the step counter logic (Unit 5.4) solves this by switching air supply between groups."
      }
    ]
  },
  {
    id: 6,
    title: "Introduction to Hydraulic Systems",
    titleMy: "Pengenalan Sistem Hidraulik",
    type: "hydraulics",
    summary: "Basic principles of hydraulics, comparison between hydraulics and pneumatics, and the application of Pascal's Law.",
    keyTerms: [
      { en: "Pascal's Law", my: "Hukum Pascal", desc: "Pressure applied to a confined fluid is transmitted undiminished in all directions and acts with equal force on equal areas." },
      { en: "Incompressibility", my: "Ketaktermampatan", desc: "Hydraulic oil is virtually incompressible, allowing extremely precise speed control, massive force generation, and stiff mechanical hold." }
    ],
    formulas: [
      { name: "Pascal's Law", eq: "P = F / A", desc: "Pressure equals force divided by piston area." },
      { name: "Hydraulic Lever (Force Multiplication)", eq: "F_2 = F_1 × (A_2 / A_1)", desc: "A small force on a small piston can lift a massive weight on a large piston." }
    ],
    sections: [
      {
        title: "Section 6.1: Hydraulics vs. Pneumatics",
        content: "Pneumatics works at low pressures (6-10 bar) and is fast. Hydraulics works at extremely high pressures (50-400+ bar) and is slower but capable of heavy lifting (forklifts, heavy presses, hydraulic jacks). Hydraulics is self-lubricating but poses oil leak risks and environmental hazards."
      },
      {
        title: "Section 6.2: Pascal's Principle",
        content: "Because hydraulic fluid is incompressible, applying a force of 10 N to a 1 cm² piston creates a pressure of 10 N/cm² (1 bar). If this pressure is transmitted to a 100 cm² piston, the output force is 1000 N. This is the foundation of hydraulic jacks and power steering."
      }
    ]
  },
  {
    id: 7,
    title: "Hydraulic Fluid & Reservoirs",
    titleMy: "Minyak Hidraulik & Tangki Cecair",
    type: "hydraulics",
    summary: "Viscosity, hydraulic oil characteristics, contaminants, filters, and the functions of the oil reservoir.",
    keyTerms: [
      { en: "Viscosity Index", my: "Indeks Kelikatan", desc: "A measure of fluid viscosity change with temperature. High index means viscosity remains stable under hot lab operations." },
      { en: "Reservoir (Tank)", my: "Tangki Minyak", desc: "Stores oil, dissipates heat, allows air bubbles to escape, and lets contaminants settle to the bottom." },
      { en: "Suction Filter", my: "Penapis Sedutan", desc: "Coarse strainer on the pump intake that protects the hydraulic pump from large particles." }
    ],
    sections: [
      {
        title: "Section 7.1: Fluid Viscosity",
        content: "If viscosity is too high (thick oil), flow is restricted, causing cavitation in the pump. If viscosity is too low (thin oil), internal wear and leakage increase, reducing system efficiency."
      },
      {
        title: "Section 7.2: Reservoir Internals",
        content: "The reservoir is not just a container; it has baffles. Baffles block returning hot oil, forcing it to slide along the reservoir walls to cool down and allow air bubbles to rise and pop before being drawn back by the suction pipe."
      }
    ]
  },
  {
    id: 8,
    title: "Hydraulic Pumps & Actuators",
    titleMy: "Pam Hidraulik & Penggerak",
    type: "hydraulics",
    summary: "Positive displacement pumps (gear pump, vane pump, piston pump), hydraulic motors, and double-rod cylinders.",
    keyTerms: [
      { en: "Positive Displacement Pump", my: "Pam Anjakan Positif", desc: "Delivers a fixed volume of oil per revolution regardless of load pressure. Must have a relief valve connected!" },
      { en: "External Gear Pump", my: "Pam Gear Luaran", desc: "Simple, highly robust hydraulic pump that traps oil between rotating gear teeth and the pump casing to push it to the outlet." },
      { en: "Cavitation", my: "Kavitas (Rongga Udara)", desc: "Implosion of vapor bubbles inside the pump due to low suction pressure, causing high pitch screaming noise and eroding internal gear metal." }
    ],
    formulas: [
      { name: "Pump Flow Rate", eq: "Q = V_d × n × η_v", desc: "Q is flow, V_d is displacement, n is speed, η_v is volumetric efficiency." },
      { name: "Hydraulic Motor Torque", eq: "T = (ΔP × V_d) / (2 × π)", desc: "Torque generated by a hydraulic motor based on pressure drop." }
    ],
    sections: [
      {
        title: "Section 8.1: Pump Mechanisms",
        content: "Gear pumps are low cost and reliable for J4012 lab rigs. Vane pumps are quieter and can be variable displacement. Piston pumps operate at extremely high pressures (up to 700 bar) and are highly efficient but complex and sensitive to fluid contamination."
      },
      {
        title: "Section 8.2: Hydraulic Actuators",
        content: "Hydraulic cylinders are built of heavy steel walls and robust wiper seals to withstand high pressures. Hydraulic motors work on the reverse principle of pumps, turning pressurized flow into continuous torque and shaft rotation."
      }
    ]
  },
  {
    id: 9,
    title: "Hydraulic Control Valves",
    titleMy: "Injap Kawalan Hidraulik",
    type: "hydraulics",
    summary: "Pressure relief valves, flow control (needle, throttle, pressure compensated), check valves, and pilot-operated spool valves.",
    keyTerms: [
      { en: "Pressure Relief Valve", my: "Injap Pelepas Tekanan", desc: "Critical safety valve that opens and dumps oil to the tank when the maximum safe system pressure is exceeded." },
      { en: "One-Way Flow Control Valve", my: "Injap Kawalan Aliran Satu Arah", desc: "Restricts flow in one direction (meter-in or meter-out) while allowing free return flow in the opposite direction." },
      { en: "Pilot Operated Check Valve", my: "Injap Semak Pandu arah", desc: "Allows free flow in one direction, and completely blocks reverse flow unless a pilot pressure signal is applied to unlock the check seat." }
    ],
    sections: [
      {
        title: "Section 9.1: Pressure Regulation",
        content: "A hydraulic positive displacement pump pushes oil continuously. If a cylinder stops moving and there is no pressure relief valve (PRV), the pressure will rise instantly until a hose bursts or the motor burns out. The PRV acts as the system's safety valve, set to open at e.g. 50 bar in lab trainers."
      },
      {
        title: "Section 9.2: Speed Control Systems",
        content: "Speed control is achieved via: 1. Meter-In: throttling oil entering the cylinder (good for lifting loads). 2. Meter-Out: throttling exhaust oil leaving the cylinder (prevents 'runaway' when a heavy load pulls the cylinder downwards)."
      }
    ]
  },
  {
    id: 10,
    title: "Electro-Pneumatics & Electro-Hydraulics",
    titleMy: "Elektro-Pneumatik & Elektro-Hidraulik",
    type: "both",
    summary: "Integrating electrical controls with fluid power, electrical relays, solenoids, limit switches, proximity sensors, and PLC integration.",
    keyTerms: [
      { en: "Relay", my: "Ganti-Kaji (Relay)", desc: "Electromagnetic switch that uses low voltage control (e.g., 24V DC) to toggle high-current solenoid coils." },
      { en: "Proximity Sensor", my: "Penderia Kehampiran", desc: "Non-contact sensor (inductive for metal pistons, capacitive for liquid level) used to detect when cylinders are fully extended." },
      { en: "Latch Circuit", my: "Litar Pegang-Sendiri (Self-Latching)", desc: "An electrical contact arrangement that keeps a relay energized after a start push button is released." }
    ],
    sections: [
      {
        title: "Section 10.1: Solenoid Interface",
        content: "In electro-pneumatics, standard air piping is simplified. Hand levers are replaced with 24V DC solenoid coils. Applying electric current pulls a plunger inside the valve, shifting the spool. Relays handle logic, enabling automatic timing and safety interlocks."
      },
      {
        title: "Section 10.2: Ladder Diagrams",
        content: "Controls are drawn as electrical ladder lines. Power rails are 24V (left) and 0V (right). Rungs contain push buttons, normally-open (NO) / normally-closed (NC) relay contacts, and output loads like relay coils (K1, K2) or solenoid coils (Y1, Y2)."
      }
    ]
  },
  {
    id: 11,
    title: "Troubleshooting & Maintenance",
    titleMy: "Mengesan Kerosakan & Penyenggaraan",
    type: "both",
    summary: "Standard methods for diagnosing mechanical failures, air/oil leakages, pressure drops, creeping in cylinders, and pump cavitation noises.",
    keyTerms: [
      { en: "Creeping", my: "Rayapan Silinder (Creeping)", desc: "Slow, unintentional sliding of the cylinder piston under load, usually caused by worn internal piston seals or a leaking spool valve." },
      { en: "Cavitation Noise", my: "Bunyi Kavitas (Screaming)", desc: "A high-pitched metallic crackling or screaming sound from a hydraulic pump, signifying air bubbles imploding inside, indicating intake blockage." },
      { en: "Pressure Drop", my: "Susutan Tekanan", desc: "Loss of operating pressure due to leaks, choked suction strainers, or a sticking pressure relief valve." }
    ],
    troubleshooting: [
      {
        symptom: "Cylinder Creeping (Piston slides slowly)",
        cause: "Worn piston cup seals allowing oil/air to slip between chambers; or inner scratches on cylinder bore.",
        solution: "Replace piston seal pack; inspect cylinder bore; check directional valve for centering leakage."
      },
      {
        symptom: "Hydraulic Pump makes a screaming, crackling noise",
        cause: "Cavitation caused by choked intake strainer, highly thick oil at low temperature, or air leak in suction pipe.",
        solution: "Clean the suction filter; replace hydraulic oil with correct viscosity index; tighten suction pipe joints."
      },
      {
        symptom: "Fluctuating or vibrating system pressure",
        cause: "Air trapped in cylinder/lines; or pressure relief valve spring has lost tension / is contaminated with grit.",
        solution: "Bleed air from high-point bleed screws; dismantle and clean the pressure relief valve; adjust spring preload."
      },
      {
        symptom: "Pneumatic cylinder extends with jerky, uneven motion",
        cause: "Air compressibility under high friction; dry seals lacking lubrication; or exhaust throttle sticking.",
        solution: "Check FRL unit oil levels; adjust lubricator feed rate; inspect guide rails for alignment; adjust flow control."
      }
    ],
    sections: [
      {
        title: "Section 11.1: Troubleshooting Methodology",
        content: "Troubleshooting in J4012 lab experiments follows the 'Symptom-Cause-Remedy' cycle. When a system fails to build pressure, always check the source first (compressor/pump running? relief valve closed?). Next, verify pilot signals, and finally check actuator seals."
      },
      {
        title: "Section 11.2: Cylinder Creeping Analysis",
        content: "Creeping occurs when a piston returns or drifts despite the valve being closed. This internal drift can be diagnosed by pressure-checking one port while blocking the other. If oil or air leaks from the open port, the piston seals are completely shot."
      }
    ]
  }
];

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK with fallback
const ai = getGeminiClient();

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "MY_GEMINI_API_KEY" || key.trim() === "") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: key,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// 1. Course J4012 Module API Endpoint (Search & RAG)
app.post("/api/query", async (req, res) => {
  try {
    const { question, history = [] } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required." });
    }

    const lowercaseQ = question.toLowerCase();
    
    // RAG: Perform local keyword retrieval to find most relevant unit and section
    let matchedUnit: CourseUnit | null = null;
    let matchedSection: string = "";
    let highestScore = 0;

    for (const unit of J4012_KNOWLEDGE) {
      let score = 0;
      if (lowercaseQ.includes(unit.title.toLowerCase()) || lowercaseQ.includes(unit.titleMy.toLowerCase())) {
        score += 10;
      }
      
      // Check keywords in summary
      const keywords = ["creeping", "creep", "rayapan", "boyle", "pascal", "injap", "valve", "pam", "pump", "compressor", "pemampat", "frl", "solenoid", "latch", "cascade", "cavitation", "kavitas", "vibrate", "leak", "bocor"];
      for (const kw of keywords) {
        if (lowercaseQ.includes(kw)) {
          if (unit.summary.toLowerCase().includes(kw) || JSON.stringify(unit.keyTerms).toLowerCase().includes(kw)) {
            score += 3;
          }
        }
      }

      // Check sections
      for (const sec of unit.sections) {
        if (lowercaseQ.includes(sec.title.toLowerCase()) || sec.content.toLowerCase().split(" ").filter(w => lowercaseQ.includes(w)).length > 3) {
          score += 5;
        }
      }

      if (score > highestScore) {
        highestScore = score;
        matchedUnit = unit;
        // select best section
        const bestSec = unit.sections.find(s => s.content.toLowerCase().split(" ").some(w => lowercaseQ.includes(w)));
        matchedSection = bestSec ? `${bestSec.title}: ${bestSec.content}` : unit.sections[0].content;
      }
    }

    // Default to general if no clear match
    const contextUnit = matchedUnit || J4012_KNOWLEDGE[10]; // Unit 11 as standard troubleshooting default
    const contextInfo = `
Retrieved Module Context:
Unit: ${contextUnit.id} - ${contextUnit.title} (${contextUnit.titleMy})
Key Summary: ${contextUnit.summary}
Formula references: ${JSON.stringify(contextUnit.formulas || [])}
Troubleshooting checklist matches: ${JSON.stringify(contextUnit.troubleshooting || [])}
Relevant Section text: ${matchedSection || contextUnit.sections[0].content}
`;

    const chatHistory = history.map((h: any) => ({
      role: h.role === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));

    // System prompt guiding Gemini to behave as FluidIQ, J4012 Smart Lab Assistant
    const systemInstruction = `
You are FluidIQ, the professional AI Smart Lab Assistant for the polytechnic course 'J4012 Pneumatics & Hydraulics'.
You help students in the lab, classroom, and during exam revision.
Your personality:
- Extremely knowledgeable, technical, and precise yet highly helpful and encouraging.
- Speak with professional engineer command room authority but remain highly accessible to students.
- Always fluidly switch between Malay (Bahasa Melayu) and English technical terms when appropriate, especially when requested (e.g. "Injap 5/2 solenoid kembar" for "5/2 double solenoid valve"). This reflects Malaysian Polytechnic standards (Penerangan Kendalian).
- Format response beautifully: highlight equations like P_1V_1 = P_2V_2 using bolding/markdown, and use lists for troubleshooting or repair checklists.
- Incorporate specific Unit numbers (e.g., Unit 11, Unit 3) and page references when answering.
- Keep responses clean, structured, and focused. Do not waffle. Always output a visual smart summary snippet at the end if the student asks for a formula, symptom, or process.
`;

    if (ai) {
      try {
        // Build contents including history
        const promptText = `
Student Question: "${question}"

Using this highly accurate context from the official J4012 syllabus if relevant:
${contextInfo}

Please answer the student's question directly.
`;
        
        const contents = [
          ...chatHistory,
          { role: "user", parts: [{ text: promptText }] }
        ];

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents as any,
          config: {
            systemInstruction,
            temperature: 0.7
          }
        });

        return res.json({
          answer: response.text,
          unitId: contextUnit.id,
          unitTitle: contextUnit.title,
          sourceContext: contextInfo
        });
      } catch (geminiError: any) {
        console.error("Gemini API Error, falling back to local heuristic:", geminiError);
      }
    }

    // Fallback response generator if Gemini fails or is not configured
    let fallbackText = `### FluidIQ Assistant (Offline Mode)\n\n`;
    fallbackText += `*Searching Unit ${contextUnit.id} J4012 Syllabus... Found matches!*\n\n`;
    fallbackText += `**${contextUnit.title} (${contextUnit.titleMy})**\n\n`;
    
    if (lowercaseQ.includes("creeping") || lowercaseQ.includes("rayapan") || lowercaseQ.includes("creep")) {
      fallbackText += `**Cylinder Creeping (Rayapan Silinder)** occurs when a piston shifts or drifts under load despite the valve being closed. This is detailed in **Unit 11** of J4012.\n\n`;
      fallbackText += `**Potential Causes:**\n`;
      fallbackText += `1. **Worn Piston Cup Seals:** Pressure slips between cylinder chambers.\n`;
      fallbackText += `2. **Internal Valve Leakage:** A spool valve is scratched, causing air/oil bypass.\n\n`;
      fallbackText += `**Syllabus Repair Checklist:**\n`;
      fallbackText += `- Inspect internal bore for scoring.\n`;
      fallbackText += `- Replace seals using a standard polyurethane seal kit.\n`;
      fallbackText += `- Test directional control valve spool bypass.`;
    } else if (lowercaseQ.includes("boyle") || lowercaseQ.includes("pressure") || lowercaseQ.includes("tekanan")) {
      fallbackText += `Under **Unit 1 / Unit 2**, pressure changes are described by **Boyle's Law**:\n\n`;
      fallbackText += `$$\\mathbf{P_1V_1 = P_2V_2}$$\n\n`;
      fallbackText += `Where temperature is constant, pressure is inversely proportional to volume. In J4012, this governs compressor capacity and air receiver storage calculations.`;
    } else if (lowercaseQ.includes("pascal") || lowercaseQ.includes("hukum pascal")) {
      fallbackText += `Under **Unit 6 (Hydraulics Basics)**, force generation is governed by **Pascal's Law**:\n\n`;
      fallbackText += `$$\\mathbf{F = P \\times A}$$\n\n`;
      fallbackText += `Where $\\mathbf{F}$ is force (Newtons), $\\mathbf{P}$ is pressure (Pascal or bar), and $\\mathbf{A}$ is piston cross-sectional area (m²). A small input pressure over a large output area yields a massive force multiplication.`;
    } else {
      fallbackText += `Regarding your inquiry on fluid power, here is the official snippet from **Unit ${contextUnit.id}**:\n\n`;
      fallbackText += `> ${contextUnit.summary}\n\n`;
      fallbackText += `**Key Technical Translation:**\n`;
      contextUnit.keyTerms.slice(0, 3).forEach(term => {
        fallbackText += `- **${term.en}** matches Malay **${term.my}**: *${term.desc}*\n`;
      });
      if (contextUnit.formulas && contextUnit.formulas.length > 0) {
        fallbackText += `\n**Core Mathematical Formula:** \`${contextUnit.formulas[0].eq}\` (${contextUnit.formulas[0].name})\n`;
      }
    }
    
    fallbackText += `\n\n*Note: Set your GEMINI_API_KEY in Secrets to activate full RAG dialog models.*`;

    return res.json({
      answer: fallbackText,
      unitId: contextUnit.id,
      unitTitle: contextUnit.title,
      sourceContext: contextInfo
    });

  } catch (err: any) {
    console.error("Server query endpoint error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// 2. Download Summary / Checklist endpoints
app.get("/api/download/summary/:unitId", (req, res) => {
  const unitId = parseInt(req.params.unitId);
  const unit = J4012_KNOWLEDGE.find(u => u.id === unitId);

  if (!unit) {
    return res.status(404).send("Unit not found");
  }

  const content = `===========================================================
                FLUIDIQ SMART SUMMARY SHEET 
       J4012 Pneumatics & Hydraulics - Polytechnic Module
===========================================================

UNIT ${unit.id}: ${unit.title.toUpperCase()}
MALAY TRANSLATION: ${unit.titleMy}
SYSTEM CLASSIFICATION: ${unit.type.toUpperCase()}

-----------------------------------------------------------
1. UNIT SUMMARY
-----------------------------------------------------------
${unit.summary}

-----------------------------------------------------------
2. CORE SYLLABUS SECTIONS
-----------------------------------------------------------
${unit.sections.map(sec => `[${sec.title}]
${sec.content}
`).join("\n")}

-----------------------------------------------------------
3. MALAYSIAN / ENGLISH TECHNICAL TERMS REFERENCE
-----------------------------------------------------------
${unit.keyTerms.map(t => `- English: ${t.en}
  Malay:   ${t.my}
  Function: ${t.desc}
`).join("\n")}

${unit.formulas && unit.formulas.length > 0 ? `-----------------------------------------------------------
4. MATHEMATICAL FORMULAS
-----------------------------------------------------------
${unit.formulas.map(f => `- ${f.name}
  Equation: ${f.eq}
  Usage:    ${f.desc}
`).join("\n")}` : ""}

${unit.troubleshooting && unit.troubleshooting.length > 0 ? `-----------------------------------------------------------
5. SYMPTOMS & TROUBLESHOOTING CHECKLIST
-----------------------------------------------------------
${unit.troubleshooting.map(t => `- Symptom:  ${t.symptom}
  Cause:    ${t.cause}
  Remedy:   ${t.solution}
`).join("\n")}` : ""}

===========================================================
FluidIQ: Build the logic. Feel the pressure.
Downloaded from Polytechnic Lab Assistant Portal
===========================================================
`;

  res.setHeader("Content-Disposition", `attachment; filename=Unit_${unitId}_Summary_J4012.txt`);
  res.setHeader("Content-Type", "text/plain");
  res.send(content);
});

app.get("/api/download/troubleshoot", (req, res) => {
  const content = `===========================================================
            FLUIDIQ CYLINDER REPAIR CHECKLIST
       J4012 Syllabus Unit 11 - Troubleshooting Guidelines
===========================================================

DIAGNOSING CYLINDER CREEPING ("RAYAPAN SILINDER")
-----------------------------------------------------------
Creeping is defined as the slow return or movement of a piston
after the controls are locked. Follow these steps to diagnose:

[STEP 1] ISOLATE THE CYLINDER
Shut down the pump/compressor. Disconnect both lines (hoses) 
going to Port A and Port B. 

[STEP 2] SEAL BYPASS TEST
- Apply pressure ONLY to the rodless end working port.
- Watch the opposing open port.
- If fluid/air slips out of the opposing open port, the 
  piston cup seals are cracked or worn out.
- If no leakage is seen, the cylinder is fine; check 
  the Directional Control Valve spool for bypass leakage.

[STEP 3] REPLACE CUP SEALS
- Unscrew the front cylinder head cap.
- Carefully slide out the piston assembly.
- Wipe away old carbonized hydraulic oil or dry grease.
- Inspect the steel internal cylinder wall for scratching/scoring.
- Slide off old wear-rings and O-ring cup seals.
- Coat new polyurethane seals in system oil and slide them on.
- Carefully slide the piston assembly back, ensuring seals do not fold.
- Retorque head cap screws evenly.

-----------------------------------------------------------
COMMON SYMPTOMS, CAUSES, AND REMEDIES
-----------------------------------------------------------

Symptom 1: Jerky, stick-slip cylinder extension
- Cause: Lack of lubrication in airline or misaligned mechanical guides.
- Remedy: Fill FRL lubricator with SAE 10 lubricant; check guide rod alignment.

Symptom 2: High pitch screaming sound from Hydraulic Power Unit
- Cause: Suction strainer fully choked, or oil too cold and thick (cavitation).
- Remedy: Shut off immediately. Wash suction filter in solvent. Re-run oil.

Symptom 3: System pressure will not build up on pressure gage
- Cause: Pressure Relief Valve (PRV) sticking wide open due to metal dirt.
- Remedy: Dismantle and clean relief spring and needle seat assembly.

===========================================================
FluidIQ: Build the logic. Feel the pressure.
File downloaded successfully.
===========================================================
`;

  res.setHeader("Content-Disposition", "attachment; filename=Cylinder_Troubleshoot_J4012.txt");
  res.setHeader("Content-Type", "text/plain");
  res.send(content);
});

// Serve J4012 content list for the frontend timeline
app.get("/api/units", (req, res) => {
  res.json(J4012_KNOWLEDGE.map(u => ({
    id: u.id,
    title: u.title,
    titleMy: u.titleMy,
    type: u.type,
    summary: u.summary,
    keyTerms: u.keyTerms,
    formulas: u.formulas,
    troubleshooting: u.troubleshooting
  })));
});

// 3. Vite development server setup or static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production build from dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`FluidIQ J4012 Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
