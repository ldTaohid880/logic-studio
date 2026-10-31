import { GateType } from '../../types/circuit';

/** Direction of a package pin as the chip sees it. */
export type PinDir = 'in' | 'out' | 'io' | 'power' | 'nc';

export interface DatasheetPin {
  /** Pin number on the package, counted from the notch. */
  n: number;
  /** Name printed in the real datasheet, without the active-low slash. */
  name: string;
  /** Active low: drawn with an overbar. A name and its inverse (Q and /Q) differ by this flag. */
  low?: boolean;
  dir: PinDir;
  /** What the pin does, in plain words. */
  fn: string;
}

/** DIP kinds are drawn as a package; Module is a flat pin table (LCD, sensor modules, resistors). */
export type PackageKind = 'DIP-14' | 'DIP-16' | 'DIP-20' | 'DIP-24' | 'DIP-28' | 'Module';

export interface DatasheetPackage {
  kind: PackageKind;
  pins: DatasheetPin[];
}

/** Which real pin a Logic Studio pin (`in-N` / `out-N`) stands for. */
export interface PinMapping {
  pin: string;
  /** Name of a pin in `package.pins`. */
  real: string;
  /** Short remark when the polarity or meaning differs. */
  note?: string;
}

/** Hand-written mode (function) table in H/L/X/↑ notation, for chips with memory. */
export interface ModeTable {
  inputHeaders: string[];
  outputHeaders: string[];
  rows: { inputs: string[]; outputs: string[]; note?: string }[];
  /** Legend and remarks shown under the table. */
  notes?: string[];
}

export interface TimingRow {
  param: string;
  symbol: string;
  typ: string;
  /** Worst case; "min …" for limits that are lower bounds (setup time, fmax). */
  max: string;
  unit: string;
  conditions: string;
}

export interface SpecRow {
  param: string;
  symbol: string;
  value: string;
  conditions?: string;
}

/** A pin of the Logic Studio part itself (not of the real chip). */
export interface LogicStudioPin {
  id: string;
  name: string;
  dir: 'in' | 'out';
}

export interface Datasheet {
  type: GateType;
  title: string;
  partNumber?: string;
  /** One to three sentences, plain language. */
  summary: string;
  /** Paragraphs for beginners. */
  howItWorks: string[];
  package?: DatasheetPackage;
  /** How many of the part fit in the real package (a 74HC08 holds four AND gates). */
  gatesPerPackage?: number;
  mapping?: PinMapping[];
  modeTable?: ModeTable;
  /** Set for parts with no single standard chip: the nearest real parts to look at. */
  noStandardChip?: { nearest: string[]; note?: string };
  /** 74HC family electrical characteristics are shown for chips; modules list their own figures. */
  logicFamily?: '74HC';
  /** Supply current class: gates draw less than MSI chips. */
  supplyCurrentUa?: string;
  /** Bus drivers source and sink more current. */
  busDrive?: boolean;
  /** Extra or replacement electrical rows (modules, boards, extra limits of a chip). */
  electrical?: SpecRow[];
  timing?: TimingRow[];
  applications: string[];
  pitfalls: string[];
  /** How the simulator differs from the real part. */
  simNotes: string[];
  related: GateType[];
  vendorUrl?: string;
  /** Pins of the part as placed on the canvas; filled in by getDatasheet. */
  logicStudioPins?: LogicStudioPin[];
  /** Set on sheets made from the part catalog instead of written by hand. */
  generated?: boolean;
}
