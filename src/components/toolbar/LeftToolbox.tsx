import React, { useState } from 'react';
import { GateType } from '../../types/circuit';
import { GateIcon } from '../nodes/GateIcons';
import { useCircuitStore } from '../../store/useCircuitStore';
import { ToggleLeft, Monitor, Cpu, Plus, Search } from 'lucide-react';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { SegmentedControl } from '../ui/SegmentedControl';

interface ToolboxItem {
  type: GateType;
  name: string;
  description: string;
  category: 'Inputs' | 'Logic Gates' | 'Combinational' | 'Sequential' | 'Arithmetic' | 'Outputs' | 'Utility';
  isConfigurable?: boolean;
  badgeTag?: string;
}

const TOOLBOX_ITEMS: ToolboxItem[] = [
  // Inputs
  { type: 'INPUT', name: 'Digital Input', description: 'Static toggle switch (0 or 1)', category: 'Inputs', badgeTag: 'Fixed IC' },
  { type: 'PUSH_BUTTON', name: 'Push Button', description: 'Momentary active-high push button', category: 'Inputs', badgeTag: 'Fixed IC' },
  { type: 'DIP_SWITCH', name: 'DIP Switch', description: 'Multi-bit toggle switch array (2/4/8-bit)', category: 'Inputs', badgeTag: 'Fixed IC' },
  { type: 'CLOCK', name: 'Clock Generator', description: 'Configurable periodic pulse generator', category: 'Inputs', badgeTag: 'Fixed IC' },
  { type: 'CONST_HIGH', name: 'Constant HIGH', description: 'Fixed HIGH (1 / VCC) logic level', category: 'Inputs', badgeTag: 'Fixed IC' },
  { type: 'CONST_LOW', name: 'Constant LOW', description: 'Fixed LOW (0 / GND) logic level', category: 'Inputs', badgeTag: 'Fixed IC' },
  { type: 'MULTI_INPUT', name: 'Multi-Input Bus', description: 'Grouped 1-32 bit bus toggles', category: 'Inputs', badgeTag: 'Fixed IC' },
  { type: 'CFG_CONSTANT', name: 'Constant', description: 'Multi-bit custom constant value generator', category: 'Inputs', isConfigurable: true, badgeTag: 'Configurable' },

  // Logic Gates
  { type: 'AND', name: 'AND Gate', description: 'HIGH if all inputs are HIGH', category: 'Logic Gates', badgeTag: 'Fixed IC' },
  { type: 'OR', name: 'OR Gate', description: 'HIGH if any input is HIGH', category: 'Logic Gates', badgeTag: 'Fixed IC' },
  { type: 'NOT', name: 'NOT Inverter', description: 'Inverts signal (0 -> 1, 1 -> 0)', category: 'Logic Gates', badgeTag: 'Fixed IC' },
  { type: 'NAND', name: 'NAND Gate', description: 'Inverted AND logic', category: 'Logic Gates', badgeTag: 'Fixed IC' },
  { type: 'NOR', name: 'NOR Gate', description: 'Inverted OR logic', category: 'Logic Gates', badgeTag: 'Fixed IC' },
  { type: 'XOR', name: 'XOR Gate', description: 'Exclusive OR logic', category: 'Logic Gates', badgeTag: 'Fixed IC' },
  { type: 'XNOR', name: 'XNOR Gate', description: 'Inverted XOR logic', category: 'Logic Gates', badgeTag: 'Fixed IC' },
  { type: 'BUFFER', name: 'Buffer', description: 'Passes signal unchanged', category: 'Logic Gates', badgeTag: 'Fixed IC' },
  { type: 'TRI_STATE_BUFFER', name: 'Tri-State Buffer', description: 'Buffer with active-high Enable (OE)', category: 'Logic Gates', badgeTag: 'Fixed IC' },

  // Combinational Components (Fixed ICs)
  { type: 'HALF_SUBTRACTOR', name: 'Half Subtractor', description: 'Subtracts 2 bits -> Difference & Borrow', category: 'Combinational', badgeTag: 'SUB-2' },
  { type: 'FULL_SUBTRACTOR', name: 'Full Subtractor', description: '3-bit subtractor with Borrow In/Out', category: 'Combinational', badgeTag: 'SUB-3' },
  { type: 'MUX_4TO1', name: '4:1 Multiplexer', description: 'Selects 1 of 4 inputs to output Y', category: 'Combinational', badgeTag: '74HC153' },
  { type: 'DEMUX_1TO4', name: '1:4 Demultiplexer', description: 'Routes input to 1 of 4 outputs', category: 'Combinational', badgeTag: '74HC139' },
  { type: 'MUX_8TO1', name: '8:1 Multiplexer', description: 'Selects 1 of 8 inputs with 3 select bits', category: 'Combinational', badgeTag: '74HC151' },
  { type: 'DEMUX_1TO8', name: '1:8 Demultiplexer', description: 'Routes input to 1 of 8 output lines', category: 'Combinational', badgeTag: '74HC138' },
  { type: 'DECODER_3TO8', name: '3->8 Decoder', description: '3-to-8 line decoder chip', category: 'Combinational', badgeTag: '74HC138' },
  { type: 'DECODER_4TO16', name: '4->16 Decoder', description: '4-to-16 line active-high decoder', category: 'Combinational', badgeTag: '74HC154' },
  { type: 'ENCODER_8TO3', name: '8->3 Encoder', description: '8-to-3 priority line encoder', category: 'Combinational', badgeTag: '74HC148' },
  { type: 'PARITY_GENERATOR', name: 'Parity Generator', description: 'Generates even & odd parity bits', category: 'Combinational', badgeTag: '74HC280' },
  { type: 'PARITY_CHECKER', name: 'Parity Checker', description: 'Checks input parity error bit', category: 'Combinational', badgeTag: '74HC280C' },
  { type: 'CONVERTER_BIN_TO_GRAY', name: 'Binary to Gray', description: 'Converts 4-bit binary to Gray code', category: 'Combinational', badgeTag: 'CONV-BG' },
  { type: 'CONVERTER_GRAY_TO_BIN', name: 'Gray to Binary', description: 'Converts 4-bit Gray code to binary', category: 'Combinational', badgeTag: 'CONV-GB' },
  { type: 'PRIORITY_ENCODER', name: 'Priority Encoder', description: '4-to-2 priority line encoder', category: 'Combinational', badgeTag: '74HC148' },
  { type: 'COMPARATOR_4BIT', name: '4-Bit Comparator', description: 'Compares A & B (A>B, A=B, A<B)', category: 'Combinational', badgeTag: '74HC85' },
  { type: 'DECODER_BCD_TO_7SEG', name: 'BCD to 7-Segment', description: 'Decodes 4-bit BCD to 7 segments (a-g)', category: 'Combinational', badgeTag: '74HC4511' },

  // Combinational Configurable
  { type: 'CFG_ENCODER', name: 'Encoder', description: 'Variable N-to-Log2(N) priority encoder block', category: 'Combinational', isConfigurable: true, badgeTag: 'Configurable' },
  { type: 'CFG_DECODER', name: 'Decoder', description: 'Variable N-bit input decoder (2^N outputs)', category: 'Combinational', isConfigurable: true, badgeTag: 'Configurable' },
  { type: 'CFG_MUX', name: 'MUX', description: 'Variable N-channel W-bit width multiplexer', category: 'Combinational', isConfigurable: true, badgeTag: 'Configurable' },
  { type: 'CFG_DEMUX', name: 'DEMUX', description: 'Variable N-channel W-bit width demultiplexer', category: 'Combinational', isConfigurable: true, badgeTag: 'Configurable' },
  { type: 'CFG_COMPARATOR', name: 'Comparator', description: 'Variable N-bit magnitude comparator (>, =, <)', category: 'Combinational', isConfigurable: true, badgeTag: 'Configurable' },

  // Sequential Components (Fixed ICs)
  { type: 'D_LATCH', name: 'D Latch', description: 'Level-triggered data latch with Enable', category: 'Sequential', badgeTag: '74HC75' },
  { type: 'JK_FLIPFLOP', name: 'JK Flip-Flop', description: 'Edge-triggered JK flip-flop', category: 'Sequential', badgeTag: '74HC109' },
  { type: 'T_FLIPFLOP', name: 'T Flip-Flop', description: 'Toggle flip-flop with clear', category: 'Sequential', badgeTag: '74HC74T' },
  { type: 'REGISTER_4BIT', name: '4-Bit Register', description: 'Parallel-in parallel-out 4-bit register', category: 'Sequential', badgeTag: '74HC173' },
  { type: 'SHIFT_REGISTER_4BIT', name: '4-Bit Shift Register', description: 'Serial/parallel shift register', category: 'Sequential', badgeTag: '74HC195' },
  { type: 'UP_COUNTER_4BIT', name: 'Up Counter', description: '4-bit binary up counter (0 to 15)', category: 'Sequential', badgeTag: '74HC191U' },
  { type: 'DOWN_COUNTER_4BIT', name: 'Down Counter', description: '4-bit binary down counter (15 to 0)', category: 'Sequential', badgeTag: '74HC191D' },
  { type: 'RING_COUNTER', name: 'Ring Counter', description: '4-bit circulating ring counter', category: 'Sequential', badgeTag: '74HC4017' },
  { type: 'RIPPLE_COUNTER', name: 'Ripple Counter', description: '4-bit asynchronous ripple counter', category: 'Sequential', badgeTag: '74HC393' },
  { type: 'SYNCHRONOUS_COUNTER', name: 'Synchronous Counter', description: '4-bit synchronous binary counter', category: 'Sequential', badgeTag: '74HC163' },
  { type: 'UP_DOWN_COUNTER', name: 'Up/Down Counter', description: '4-bit bi-directional counter', category: 'Sequential', badgeTag: '74HC190' },
  { type: 'FREQUENCY_DIVIDER', name: 'Frequency Divider', description: 'Divides clock frequency by 2, 4, 8, 16', category: 'Sequential', badgeTag: '74HC4024' },

  // Sequential Configurable
  { type: 'CFG_REGISTER', name: 'Register', description: 'Variable N-bit parallel register with EN/CLR', category: 'Sequential', isConfigurable: true, badgeTag: 'Configurable' },
  { type: 'CFG_SHIFT_REGISTER', name: 'Shift Register', description: 'Variable N-bit shift register (SI, SO, Load)', category: 'Sequential', isConfigurable: true, badgeTag: 'Configurable' },
  { type: 'CFG_COUNTER', name: 'Counter', description: 'Variable N-bit modulo counter (Up/Down/BCD)', category: 'Sequential', isConfigurable: true, badgeTag: 'Configurable' },

  // Arithmetic Components
  { type: 'HALF_ADDER', name: 'Half Adder', description: 'Adds 2 bits -> Sum & Carry Out', category: 'Arithmetic', badgeTag: 'ADD-2' },
  { type: 'FULL_ADDER', name: 'Full Adder', description: '3-bit adder with Carry In & Carry Out', category: 'Arithmetic', badgeTag: 'ADD-3' },
  { type: 'ADDER_4BIT', name: '4-Bit Adder', description: '4-bit parallel ripple carry adder', category: 'Arithmetic', badgeTag: '74HC283' },
  { type: 'INCREMENTER_4BIT', name: '4-Bit Incrementer', description: 'Increments 4-bit input by +1', category: 'Arithmetic', badgeTag: 'INC-4' },
  { type: 'DECREMENTER_4BIT', name: '4-Bit Decrementer', description: 'Decrements 4-bit input by -1', category: 'Arithmetic', badgeTag: 'DEC-4' },
  { type: 'ADDER_SUBTRACTOR_4BIT', name: 'Adder/Subtractor', description: '4-bit combined adder/subtractor', category: 'Arithmetic', badgeTag: '74HC283S' },
  { type: 'ALU_4BIT', name: '4-Bit ALU', description: 'Arithmetic Logic Unit (8 operations)', category: 'Arithmetic', badgeTag: '74HC181' },

  // Utility Components
  { type: 'BUS_SPLITTER', name: 'Bus Splitter', description: 'Splits multi-bit bus into individual lines', category: 'Utility', badgeTag: 'Fixed IC' },
  { type: 'BUS_JOINER', name: 'Bus Joiner', description: 'Combines single bit lines into a bus', category: 'Utility', badgeTag: 'Fixed IC' },
  { type: 'BUS_TAP', name: 'Bus Tap', description: 'Extracts single line from a bus', category: 'Utility', badgeTag: 'Fixed IC' },
  { type: 'BIT_EXTRACTOR', name: 'Bit Extractor', description: 'Extracts specific bit N', category: 'Utility', badgeTag: 'Fixed IC' },
  { type: 'DELAY_ELEMENT', name: 'Delay Element', description: 'Buffers signal with 1-tick latency', category: 'Utility', badgeTag: 'Fixed IC' },
  { type: 'TUNNEL', name: 'Wireless Tunnel', description: 'Wireless wire connection node', category: 'Utility', badgeTag: 'Fixed IC' },
  { type: 'TEXT_LABEL', name: 'Annotation Note', description: 'Text note for schematic documentation', category: 'Utility', badgeTag: 'Fixed IC' },
  { type: 'CFG_BUS_SPLITTER', name: 'Bus Splitter', description: 'Splits variable N-bit bus into single bit lines', category: 'Utility', isConfigurable: true, badgeTag: 'Configurable' },
  { type: 'CFG_BUS_JOINER', name: 'Bus Joiner', description: 'Combines variable N single lines into bus', category: 'Utility', isConfigurable: true, badgeTag: 'Configurable' },

  // Outputs
  { type: 'OUTPUT', name: 'Digital Output', description: 'Glow LED display', category: 'Outputs', badgeTag: 'Fixed IC' },
  { type: 'OSCILLOSCOPE', name: 'Oscilloscope', description: 'Digital waveform oscilloscope display', category: 'Outputs', badgeTag: 'Fixed IC' },
  { type: 'RGB_LED', name: 'RGB LED', description: 'Multi-color R, G, B led indicator', category: 'Outputs', badgeTag: 'Fixed IC' },
  { type: 'LOGIC_PROBE', name: 'Logic Probe', description: 'Visual state probe (0, 1, Floating Z)', category: 'Outputs', badgeTag: 'Fixed IC' },
  { type: 'SEVEN_SEGMENT', name: '7-Segment LED', description: '4-bit numeric segment display', category: 'Outputs', badgeTag: 'Fixed IC' },
  { type: 'HEX_DISPLAY', name: 'Hex Display', description: 'Single hexadecimal digit display (0-F)', category: 'Outputs', badgeTag: 'Fixed IC' },
  { type: 'BUS_MONITOR', name: 'Bus Monitor', description: 'Displays multi-bit bus in Hex/Dec/Bin', category: 'Outputs', badgeTag: 'Fixed IC' },
  { type: 'LED_MATRIX', name: 'LED Matrix', description: 'Configurable LED dot-matrix display (8x8/16x16)', category: 'Outputs', isConfigurable: true, badgeTag: 'Configurable' },
  { type: 'BOOLEAN_EQUATION_GENERATOR', name: 'Boolean Equation', description: 'Live mathematical expression solver from connected logic graph', category: 'Outputs', badgeTag: 'Fixed IC' },
];

export const LeftToolbox: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'fixed' | 'configurable'>('all');
  const addNode = useCircuitStore((state) => state.addNode);


  const handleAddAtCenter = (type: GateType) => {
    const x = 320 + Math.random() * 80;
    const y = 180 + Math.random() * 80;
    addNode(type, { x, y });
  };

  const handleDragStart = (e: React.DragEvent, type: GateType) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  const filteredItems = TOOLBOX_ITEMS.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.badgeTag && item.badgeTag.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (typeFilter === 'fixed') {
      return !item.isConfigurable;
    }
    if (typeFilter === 'configurable') {
      return item.isConfigurable;
    }

    return true;
  });

  const categories = ['Inputs', 'Logic Gates', 'Combinational', 'Sequential', 'Arithmetic', 'Utility', 'Outputs'] as const;
  const customComponentList = Object.values(useCircuitStore.getState().customComponents || {});
  const { instantiateCustomComponent } = useCircuitStore();

  return (
    <aside className="w-64 h-full border-r flex flex-col z-20 select-none overflow-hidden bg-slate-950/90 border-slate-900 text-slate-100">
      {/* Header & Search */}
      <div className="p-3.5 border-b space-y-3 shrink-0 border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-slate-200">
              Palette
            </span>
          </div>
          <Badge variant="slate" size="xs">
            {filteredItems.length + customComponentList.length} Items
          </Badge>
        </div>

        <Input
          placeholder="Search components..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-3.5 h-3.5" />}
          onClear={() => setSearchQuery('')}
        />

        {/* Component Type Filter Bar */}
        <SegmentedControl
          options={[
            { value: 'all', label: 'All' },
            { value: 'fixed', label: 'Fixed IC' },
            { value: 'configurable', label: 'Cfg' },
          ]}
          value={typeFilter}
          onChange={(val) => setTypeFilter(val as 'all' | 'fixed' | 'configurable')}
          size="xs"
          className="w-full"
        />
      </div>

      {/* Component Palette Item List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Custom Components Category Section */}
        {customComponentList.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-400 px-1">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-300">
                  Custom Subcircuits
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{customComponentList.length}</span>
            </div>

            <div className="space-y-1.5">
              {customComponentList
                .filter((c) => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => instantiateCustomComponent(comp.id, { x: 300, y: 200 })}
                    className="group flex items-center justify-between p-2 rounded-xl border cursor-pointer transition-all duration-150 bg-emerald-950/20 border-emerald-900/60 hover:border-emerald-500/50 hover:bg-emerald-900/40"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                        style={{ backgroundColor: comp.color || '#10b981' }}
                      >
                        ⚡
                      </div>
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="text-xs font-mono font-bold truncate text-slate-100">
                          {comp.name}
                        </span>
                        <span className="text-[10px] font-sans truncate text-slate-400">
                          {comp.inputs.length} IN / {comp.outputs.length} OUT
                        </span>
                      </div>
                    </div>

                    <Plus className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  </div>
                ))}
            </div>
          </div>
        )}

        {categories.map((category) => {
          const items = filteredItems
            .filter((i) => i.category === category)
            .sort((a, b) => a.name.localeCompare(b.name));

          if (items.length === 0) return null;

          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 px-1">
                <div className="flex items-center gap-1.5">
                  {category === 'Inputs' && <ToggleLeft className="w-3.5 h-3.5 text-slate-400" />}
                  {category === 'Logic Gates' && <Cpu className="w-3.5 h-3.5 text-slate-400" />}
                  {category === 'Combinational' && <Cpu className="w-3.5 h-3.5 text-blue-400" />}
                  {category === 'Sequential' && <Cpu className="w-3.5 h-3.5 text-slate-400" />}
                  {category === 'Arithmetic' && <Cpu className="w-3.5 h-3.5 text-amber-400" />}
                  {category === 'Utility' && <Cpu className="w-3.5 h-3.5 text-slate-500" />}
                  {category === 'Outputs' && <Monitor className="w-3.5 h-3.5 text-emerald-400" />}
                  <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-slate-300">
                    {category}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{items.length}</span>
              </div>

              <div className="space-y-1.5">
                {items.map((item) => (
                  <div
                    key={`${item.type}-${item.isConfigurable ? 'cfg' : 'fixed'}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.type)}
                    onClick={() => handleAddAtCenter(item.type)}
                    className="group flex items-center justify-between p-2 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-emerald-500/50 hover:bg-slate-800/80 cursor-pointer transition-all duration-150"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                        <GateIcon type={item.type} className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col min-w-0 pr-1">
                        <span className="text-xs font-mono font-medium truncate text-slate-200 group-hover:text-white">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-sans truncate text-slate-400">
                          {item.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {item.isConfigurable ? (
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Cfg
                        </span>
                      ) : (item.badgeTag && item.badgeTag.startsWith('74HC')) ? (
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {item.badgeTag}
                        </span>
                      ) : null}
                      <Plus className="w-3.5 h-3.5 text-slate-500 transition-colors group-hover:text-emerald-400" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
