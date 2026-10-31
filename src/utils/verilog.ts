import { Node, Edge } from '@xyflow/react';
import { GateType, NodeData } from '../types/circuit';
import { CustomComponentDefinition } from '../types/customComponent';
import { getDefaultICPins } from '../simulation/icLogic';
import { IC_GATE_TYPES } from '../simulation/engine';
import { getComponentInfo } from '../data/components';
import { isSensor } from '../simulation/sensors';

/**
 * Structural Verilog for FPGA courses. Gates become Verilog gate primitives, tri-state and open-drain
 * buffers bufif1/bufif0, resistors pullup/pulldown, custom components their own modules, and chips
 * modules with behaviour (common flip-flops, latches and muxes) or empty "black box" modules with the
 * right ports for the rest. Switches, buttons, clocks and sensors are inputs; LEDs and displays outputs.
 */

const KEYWORDS = new Set(
  'always and assign begin buf bufif0 bufif1 case default else end endcase endmodule for if initial inout input integer module nand nor not or output parameter posedge negedge pulldown pullup reg supply0 supply1 tri wire xnor xor'.split(' ')
);

/** A legal, readable Verilog identifier for a label ("Carry in (Cin)" → "Carry_in_Cin", "Q̄" → "Qn"). */
export function verilogName(text: string): string {
  let id = text
    .replace(/Q̄/g, 'Qn')
    .replace(/[^A-Za-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '');
  if (!id) id = 'x';
  if (/^[0-9]/.test(id)) id = `n${id}`;
  return KEYWORDS.has(id) ? `${id}_` : id;
}

const GATE_PRIMITIVES: Partial<Record<GateType, string>> = {
  AND: 'and', OR: 'or', NAND: 'nand', NOR: 'nor', XOR: 'xor', XNOR: 'xnor', NOT: 'not', BUFFER: 'buf',
};
const INPUT_TYPES = new Set<string>(['INPUT', 'PUSH_BUTTON', 'CLOCK']);
const OUTPUT_TYPES = new Set<string>(['OUTPUT', 'LOGIC_PROBE']);
const MULTI_OUTPUT_TYPES = new Set<string>(['SEVEN_SEGMENT', 'HEX_DISPLAY', 'BUS_MONITOR']);
const IGNORED = new Set<string>(['TEXT_LABEL', 'TUNNEL', 'BUS_SPLIT', 'BUS_JOIN']);

/** Behaviour of chips that FPGA courses use most; port names follow the chip's pins (see getDefaultICPins). */
const BEHAVIOUR: Partial<Record<GateType, string>> = {
  D_FLIPFLOP: `  reg q = 1'b0;
  assign Q = (PRE && CLR) ? 1'b1 : q;
  assign Qn = (PRE && CLR) ? 1'b1 : ~q;
  always @(posedge CLK or posedge PRE or posedge CLR)
    if (CLR) q <= 1'b0;
    else if (PRE) q <= 1'b1;
    else q <= D;`,
  D_LATCH: `  reg q = 1'b0;
  assign Q = q;
  assign Qn = ~q;
  always @(*)
    if (CLR) q = 1'b0;
    else if (EN) q = D;`,
  JK_FLIPFLOP: `  reg q = 1'b0;
  assign Q = q;
  assign Qn = ~q;
  always @(posedge CLK or posedge CLR)
    if (CLR) q <= 1'b0;
    else case ({J, K})
      2'b01: q <= 1'b0;
      2'b10: q <= 1'b1;
      2'b11: q <= ~q;
      default: q <= q;
    endcase`,
  T_FLIPFLOP: `  reg q = 1'b0;
  assign Q = q;
  assign Qn = ~q;
  always @(posedge CLK or posedge CLR)
    if (CLR) q <= 1'b0;
    else if (T) q <= ~q;`,
  SR_LATCH: `  reg q = 1'b0;
  // S = R = 1 is the forbidden input: both outputs low, like the NOR-gate latch
  assign Q = (S && R) ? 1'b0 : q;
  assign Qn = (S && R) ? 1'b0 : ~q;
  always @(*)
    if (S && !R) q = 1'b1;
    else if (R && !S) q = 1'b0;`,
  MUX_2TO1: `  assign Y = EN & (S ? I1 : I0);`,
  MUX_4TO1: `  assign Y = EN & (S1 ? (S0 ? I3 : I2) : (S0 ? I1 : I0));`,
  HALF_ADDER: `  assign Sum = A ^ B;
  assign Cout = A & B;`,
  FULL_ADDER: `  assign Sum = A ^ B ^ Cin;
  assign Cout = (A & B) | (Cin & (A ^ B));`,
  DECODER_3TO8: `  assign {Y7, Y6, Y5, Y4, Y3, Y2, Y1, Y0} = EN ? (8'b1 << {A2, A1, A0}) : 8'b0;`,
};

const dataOf = (n: Node) => n.data as unknown as NodeData;

/** Union-find over output pins, so drivers sharing a wire (a bus, a tunnel tag) become one net. */
class Nets {
  private parent = new Map<string, string>();
  find(k: string): string {
    const p = this.parent.get(k);
    if (p === undefined || p === k) return k;
    const root = this.find(p);
    this.parent.set(k, root);
    return root;
  }
  union(a: string, b: string) {
    this.parent.set(this.find(a), this.find(b));
  }
}

interface ModuleSource {
  name: string;
  text: string;
}

interface Generator {
  library: Record<string, CustomComponentDefinition>;
  modules: Map<string, ModuleSource>;
  chipTypes: Set<GateType>;
  notes: Set<string>;
}

function chipModuleName(type: GateType) {
  return `ls_${type.toLowerCase()}`;
}

function chipModule(type: GateType): string {
  const pins = getDefaultICPins(type);
  const ports = [...pins.inputs.map((p) => `input ${verilogName(p.name)}`), ...pins.outputs.map((p) => `output ${verilogName(p.name)}`)];
  const body = BEHAVIOUR[type] ?? `  // Behaviour of the ${getComponentInfo(type).name} isn't exported: describe it here, or replace this module.`;
  return `// ${getComponentInfo(type).name}${getComponentInfo(type).partNumber ? ` (${getComponentInfo(type).partNumber})` : ''}\nmodule ${chipModuleName(type)} (\n  ${ports.join(',\n  ')}\n);\n${body}\nendmodule`;
}

/**
 * One module for a circuit. `ports` maps the parts that become ports (switch/LED nodes inside a custom
 * component); without it, the circuit's inputs and outputs become the ports.
 */
function emitModule(
  gen: Generator,
  name: string,
  nodes: Node[],
  edges: Edge[],
  ports?: { inputs: { nodeId?: string; name: string }[]; outputs: { nodeId?: string; name: string }[] }
): void {
  const parts = nodes.filter((n) => dataOf(n)?.gateType);
  const byId = new Map(parts.map((n) => [n.id, n]));
  const used = new Set<string>();
  const unique = (base: string) => {
    let id = verilogName(base);
    for (let i = 2; used.has(id); i++) id = `${verilogName(base)}_${i}`;
    used.add(id);
    return id;
  };

  // Ports
  const inputPorts: string[] = [];
  const outputPorts: string[] = [];
  const netName = new Map<string, string>(); // net root → name
  const pinKey = (nodeId: string, pinId: string) => `${nodeId}|${pinId}`;
  const nets = new Nets();
  const portOfNode = new Map<string, string>();

  if (ports) {
    ports.inputs.forEach((p) => {
      const id = unique(p.name);
      inputPorts.push(id);
      if (p.nodeId) portOfNode.set(p.nodeId, id);
    });
    ports.outputs.forEach((p) => {
      const id = unique(p.name);
      outputPorts.push(id);
      if (p.nodeId) portOfNode.set(p.nodeId, id);
    });
  }

  // Drivers of every input pin, merged into nets
  const driversOf = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!byId.has(e.source) || !byId.has(e.target)) return;
    const key = pinKey(e.target, e.targetHandle || 'in-0');
    const src = pinKey(e.source, e.sourceHandle || 'out-0');
    driversOf.set(key, [...(driversOf.get(key) ?? []), src]);
  });
  driversOf.forEach((srcs) => srcs.slice(1).forEach((s) => nets.union(s, srcs[0])));
  // Tunnels with the same tag share one net: their outputs join whatever drives any of their inputs
  const tags = new Map<string, string[]>();
  parts.forEach((n) => {
    const d = dataOf(n);
    if (d.gateType !== 'TUNNEL' || !d.tunnelLabel) return;
    const tag = d.tunnelLabel.toUpperCase();
    tags.set(tag, [...(tags.get(tag) ?? []), pinKey(n.id, 'out-0'), ...(driversOf.get(pinKey(n.id, 'in-0')) ?? [])]);
  });
  tags.forEach((keys) => keys.slice(1).forEach((k) => nets.union(k, keys[0])));

  const declared: string[] = [];
  const widthOf = new Map<string, number>();
  const net = (outKey: string): string => {
    const root = nets.find(outKey);
    if (!netName.has(root)) {
      const [nodeId, pinId] = outKey.split('|');
      const d = dataOf(byId.get(nodeId)!);
      // Input ports are named up front; other nets are named after the part (and pin, for several outputs)
      const pinName = d?.outputs?.find((p) => p.id === pinId)?.name ?? pinId;
      const name = unique(d?.outputs?.length > 1 ? `${d.label || d.gateType}_${pinName}` : `${d?.label || d?.gateType || 'n'}`);
      netName.set(root, name);
      declared.push(name);
      const width = d?.outputs?.find((p) => p.id === pinId)?.width;
      if (width) widthOf.set(name, width);
    }
    return netName.get(root)!;
  };
  /** Net feeding an input pin, or z when it is unconnected (floating). */
  const inputNet = (nodeId: string, pinId: string): string => {
    const srcs = driversOf.get(pinKey(nodeId, pinId));
    return srcs ? net(srcs[0]) : "1'bz";
  };

  // Top-level ports come from the switches, LEDs and displays
  if (!ports) {
    parts.forEach((n) => {
      const d = dataOf(n);
      if (INPUT_TYPES.has(d.gateType) || isSensor(d.gateType)) {
        const id = unique(d.label || getComponentInfo(d.gateType).name);
        inputPorts.push(id);
        netName.set(nets.find(pinKey(n.id, 'out-0')), id);
      } else if (d.gateType === 'DIP_SWITCH') {
        d.outputs.forEach((p, i) => {
          const id = unique(`${d.label || 'SW'}_${i + 1}`);
          inputPorts.push(id);
          netName.set(nets.find(pinKey(n.id, p.id)), id);
        });
      }
    });
  } else {
    // Inside a component, its input ports are the internal switches
    parts.forEach((n) => {
      const port = portOfNode.get(n.id);
      if (port && INPUT_TYPES.has(dataOf(n).gateType)) netName.set(nets.find(pinKey(n.id, 'out-0')), port);
    });
  }

  const body: string[] = [];
  let g = 0;
  parts.forEach((n) => {
    const d = dataOf(n);
    const t = d.gateType;
    const outs = d.outputs ?? [];
    const ins = d.inputs ?? [];
    if (INPUT_TYPES.has(t) || isSensor(t) || t === 'DIP_SWITCH' || IGNORED.has(t)) {
      if (t === 'BUS_JOIN') body.push(`  assign ${net(pinKey(n.id, 'out-0'))} = {${ins.map((p) => inputNet(n.id, p.id)).reverse().join(', ')}};`);
      if (t === 'BUS_SPLIT') {
        const bus = inputNet(n.id, 'in-0');
        outs.forEach((p, i) => body.push(`  assign ${net(pinKey(n.id, p.id))} = ${bus === "1'bz" ? "1'bz" : `${bus}[${i}]`};`));
      }
      return;
    }
    if (OUTPUT_TYPES.has(t)) {
      const port = ports ? portOfNode.get(n.id) : unique(d.label || getComponentInfo(t).name);
      if (!port) return;
      if (!ports) outputPorts.push(port);
      body.push(`  assign ${port} = ${inputNet(n.id, ins[0]?.id ?? 'in-0')};`);
      return;
    }
    if (MULTI_OUTPUT_TYPES.has(t)) {
      if (ports) return; // inside a component only its own pins are ports
      ins.forEach((p) => {
        const port = unique(`${d.label || getComponentInfo(t).name}_${p.name}`);
        outputPorts.push(port);
        body.push(`  assign ${port} = ${inputNet(n.id, p.id)};`);
      });
      return;
    }
    const out = (i = 0) => net(pinKey(n.id, outs[i]?.id ?? `out-${i}`));
    const label = `g${++g}`;
    if (GATE_PRIMITIVES[t]) {
      body.push(`  ${GATE_PRIMITIVES[t]} ${label} (${[out(), ...ins.map((p) => inputNet(n.id, p.id))].join(', ')});`);
    } else if (t === 'TRI_STATE_BUFFER') {
      body.push(`  bufif1 ${label} (${out()}, ${inputNet(n.id, 'in-0')}, ${inputNet(n.id, 'in-1')});`);
    } else if (t === 'OPEN_DRAIN_BUFFER') {
      body.push(`  bufif0 ${label} (${out()}, 1'b0, ${inputNet(n.id, 'in-0')}); // pulls low, else floats`);
    } else if (t === 'PULL_UP' || t === 'PULL_DOWN') {
      body.push(`  ${t === 'PULL_UP' ? 'pullup' : 'pulldown'} (${out()});`);
    } else if (t === 'CONST_HIGH' || t === 'CONST_LOW') {
      body.push(`  assign ${out()} = 1'b${t === 'CONST_HIGH' ? 1 : 0};`);
    } else if (t === 'CUSTOM' && d.customComponentId && gen.library[d.customComponentId]) {
      const def = gen.library[d.customComponentId];
      const mod = customModule(gen, def);
      body.push(`  ${mod} ${label} (${[...ins.map((p) => inputNet(n.id, p.id)), ...outs.map((_, i) => out(i))].join(', ')});`);
    } else if (IC_GATE_TYPES.has(t)) {
      gen.chipTypes.add(t);
      body.push(`  ${chipModuleName(t)} ${label} (${[...ins.map((p) => inputNet(n.id, p.id)), ...outs.map((_, i) => out(i))].join(', ')});`);
    } else {
      gen.notes.add(`${getComponentInfo(t).name}: not exported`);
      body.push(`  // ${d.label || getComponentInfo(t).name}: ${getComponentInfo(t).name} isn't exported`);
    }
  });

  const declarations = declared.map((w) => `  wire ${widthOf.has(w) ? `[${widthOf.get(w)! - 1}:0] ` : ''}${w};`);
  const header = [...inputPorts.map((p) => `input ${p}`), ...outputPorts.map((p) => `output ${p}`)];
  gen.modules.set(name, {
    name,
    text: `module ${name} (\n  ${header.join(',\n  ')}\n);\n${[...declarations, ...(declarations.length ? [''] : []), ...body].join('\n')}\nendmodule`,
  });
}

function customModule(gen: Generator, def: CustomComponentDefinition): string {
  const name = `cc_${verilogName(def.name)}`;
  if (gen.modules.has(name)) return name;
  gen.modules.set(name, { name, text: '' }); // reserve (recursion is rejected elsewhere)
  emitModule(gen, name, def.nodes as Node[], def.edges as Edge[], {
    inputs: def.inputs.map((p) => ({ nodeId: p.internalNodeId, name: p.name })),
    outputs: def.outputs.map((p) => ({ nodeId: p.internalNodeId, name: p.name })),
  });
  return name;
}

export function circuitToVerilog(nodes: Node[], edges: Edge[], library: Record<string, CustomComponentDefinition> = {}, top = 'circuit'): string {
  const gen: Generator = { library, modules: new Map(), chipTypes: new Set(), notes: new Set() };
  emitModule(gen, verilogName(top), nodes, edges);
  const topModule = gen.modules.get(verilogName(top))!;
  const others = [...gen.modules.values()].filter((m) => m !== topModule);
  const chips = [...gen.chipTypes].map(chipModule);
  const notes = [...gen.notes];
  return [
    `// Exported from Logic Studio on ${new Date().toISOString().slice(0, 10)}`,
    '// Gates use Verilog primitives; unconnected inputs are 1\'bz (Logic Studio treats some floating controls as enabled).',
    ...notes.map((n) => `// ${n}`),
    '',
    topModule.text,
    ...others.map((m) => `\n${m.text}`),
    ...chips.map((c) => `\n${c}`),
    '',
  ].join('\n');
}
