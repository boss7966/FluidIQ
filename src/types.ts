// TypeScript Interfaces for FluidIQ

export interface Unit {
  id: number;
  title: string;
  titleMy: string;
  type: "pneumatics" | "hydraulics" | "both";
  summary: string;
  keyTerms: { en: string; my: string; desc: string }[];
  formulas?: { name: string; eq: string; desc: string }[];
  troubleshooting?: { symptom: string; cause: string; solution: string }[];
}

export interface ISOSymbol {
  id: string;
  nameEn: string;
  nameMy: string;
  category: "valves" | "actuators" | "sources" | "sensors" | "accessories";
  imageUrl: string; // inline SVG or beautiful CSS symbol
  description: string;
  unitRef: number;
  specification: string;
}

export interface WorkbenchComponent {
  id: string;
  type: "compressor" | "pump" | "32valve" | "52valve" | "single_cylinder" | "double_cylinder" | "gauge";
  name: string;
  nameMy: string;
  category: "pneumatics" | "hydraulics";
  x: number;
  y: number;
  ports: { id: string; x: number; y: number; type: "input" | "output" | "supply" }[];
}

export interface HoseConnection {
  id: string;
  fromComponentId: string;
  fromPortId: string;
  toComponentId: string;
  toPortId: string;
  color: "orange" | "blue";
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
