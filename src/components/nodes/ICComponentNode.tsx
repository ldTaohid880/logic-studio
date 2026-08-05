import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { Cpu, ExternalLink } from 'lucide-react';

export const ICComponentNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const { enterSubcircuitView } = useCircuitStore();
  const inputs = data.inputs || [];
  const outputs = data.outputs || [];

  const subcircuitId = data.customComponentId || 
    (data.gateType === 'HALF_ADDER' ? 'builtin_half_adder' : 
     data.gateType === 'FULL_ADDER' ? 'builtin_full_adder' : undefined);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subcircuitId) {
      enterSubcircuitView(subcircuitId, id);
    }
  };

  const getICHeader = () => {
    switch (data.gateType) {
      case 'HALF_ADDER': return { title: 'Half Adder', code: 'HA-2', category: 'Arithmetic' };
      case 'FULL_ADDER': return { title: 'Full Adder', code: 'FA-3', category: 'Arithmetic' };
      case 'ADDER_4BIT': return { title: '4-bit Adder', code: '74HC283', category: 'Arithmetic' };
      case 'HALF_SUBTRACTOR': return { title: 'Half Subtractor', code: 'SUB-2', category: 'Combinational' };
      case 'FULL_SUBTRACTOR': return { title: 'Full Subtractor', code: 'SUB-3', category: 'Combinational' };
      case 'MUX_4TO1': return { title: '4:1 MUX', code: '74HC153', category: 'Combinational' };
      case 'DEMUX_1TO4': return { title: '1:4 DEMUX', code: '74HC139', category: 'Combinational' };
      case 'PRIORITY_ENCODER': return { title: 'Priority Encoder', code: '74HC148', category: 'Combinational' };
      case 'COMPARATOR_4BIT': return { title: '4-bit Comparator', code: '74HC85', category: 'Combinational' };
      case 'DECODER_BCD_TO_7SEG': return { title: 'BCD to 7-Seg', code: '74HC4511', category: 'Combinational' };
      case 'D_LATCH': return { title: 'D Latch', code: '74HC75', category: 'Sequential' };
      case 'JK_FLIPFLOP': return { title: 'JK Flip-Flop', code: '74HC109', category: 'Sequential' };
      case 'REGISTER_4BIT': return { title: '4-bit Register', code: '74HC173', category: 'Sequential' };
      case 'SHIFT_REGISTER_4BIT': return { title: '4-bit Shift Reg', code: '74HC195', category: 'Sequential' };
      case 'UP_COUNTER_4BIT': return { title: '4-bit Up Counter', code: '74HC191U', category: 'Sequential' };
      case 'DOWN_COUNTER_4BIT': return { title: '4-bit Down Counter', code: '74HC191D', category: 'Sequential' };
      case 'MUX_8TO1': return { title: '8:1 MUX', code: '74HC151', category: 'Combinational' };
      case 'DEMUX_1TO8': return { title: '1:8 DEMUX', code: '74HC138', category: 'Combinational' };
      case 'DECODER_3TO8': return { title: '3->8 Decoder', code: '74HC138', category: 'Combinational' };
      case 'DECODER_4TO16': return { title: '4->16 Decoder', code: '74HC154', category: 'Combinational' };
      case 'ENCODER_8TO3': return { title: '8->3 Encoder', code: '74HC148', category: 'Combinational' };
      case 'PARITY_GENERATOR': return { title: 'Parity Gen', code: '74HC280', category: 'Combinational' };
      case 'PARITY_CHECKER': return { title: 'Parity Checker', code: '74HC280C', category: 'Combinational' };
      case 'CONVERTER_BIN_TO_GRAY': return { title: 'Bin -> Gray', code: 'CONV-BG', category: 'Combinational' };
      case 'CONVERTER_GRAY_TO_BIN': return { title: 'Gray -> Bin', code: 'CONV-GB', category: 'Combinational' };
      case 'T_FLIPFLOP': return { title: 'T Flip-Flop', code: '74HC74T', category: 'Sequential' };
      case 'RING_COUNTER': return { title: 'Ring Counter', code: '74HC4017', category: 'Sequential' };
      case 'RIPPLE_COUNTER': return { title: 'Ripple Counter', code: '74HC393', category: 'Sequential' };
      case 'SYNCHRONOUS_COUNTER': return { title: 'Sync Counter', code: '74HC163', category: 'Sequential' };
      case 'UP_DOWN_COUNTER': return { title: 'Up/Down Counter', code: '74HC190', category: 'Sequential' };
      case 'FREQUENCY_DIVIDER': return { title: 'Freq Divider', code: '74HC4024', category: 'Sequential' };
      case 'INCREMENTER_4BIT': return { title: '4-bit Incrementer', code: 'INC-4', category: 'Arithmetic' };
      case 'DECREMENTER_4BIT': return { title: '4-bit Decrementer', code: 'DEC-4', category: 'Arithmetic' };
      case 'ADDER_SUBTRACTOR_4BIT': return { title: 'Adder/Subtractor', code: '74HC283S', category: 'Arithmetic' };
      case 'ALU_4BIT': return { title: '4-bit ALU', code: '74HC181', category: 'Arithmetic' };
      default: return { title: data.label || 'IC Module', code: '74HC00', category: 'Utility' };
    }
  };

  const header = getICHeader();

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Combinational':
        return {
          icon: 'text-blue-400',
          badge: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
          border: 'border-slate-800 hover:border-blue-500/50',
        };
      case 'Sequential':
        return {
          icon: 'text-slate-400',
          badge: 'bg-slate-850 text-slate-300 border-slate-800',
          border: 'border-slate-800 hover:border-slate-750',
        };
      case 'Arithmetic':
        return {
          icon: 'text-amber-400',
          badge: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
          border: 'border-slate-800 hover:border-amber-500/50',
        };
      default:
        return {
          icon: 'text-slate-400',
          badge: 'bg-slate-800 text-slate-400 border-slate-700',
          border: 'border-slate-800 hover:border-slate-750',
        };
    }
  };

  const styles = getCategoryStyles(header.category);

  const pinAliases = data.pinAliases || {};
  const getPinDisplayName = (pin: { id: string; name: string }) => {
    const alias = pinAliases[pin.id];
    if (!alias) return pin.name;
    return alias.length > 8 ? alias.substring(0, 8) + '…' : alias;
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className={`min-w-[170px] bg-slate-900/95 border rounded-xl shadow-md backdrop-blur-md transition-all duration-150 border-slate-800 hover:border-slate-750`}
    >
      {/* IC Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/80 rounded-t-xl gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Cpu className={`w-3.5 h-3.5 shrink-0 ${styles.icon}`} />
          <span className="text-xs font-mono font-bold text-slate-100 truncate">
            {data.label || header.title}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {subcircuitId && (
            <button
              onClick={handleDoubleClick}
              title="Expand Internal Logic (Double-click)"
              className="p-0.5 rounded hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
          {header.code.startsWith('74HC') && (
            <span className={`text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded border ${styles.badge}`}>
              {header.code}
            </span>
          )}
        </div>
      </div>

      {/* Pin Grid Body */}
      <div className="p-3 flex justify-between gap-4 relative">
        {/* Left Side: Inputs */}
        <div className="flex flex-col gap-2.5">
          {inputs.map((pin) => {
            const isHigh = pin.value === 1;
            return (
              <div key={pin.id} className="relative flex items-center gap-2 group">
                <Handle
                  type="target"
                  position={Position.Left}
                  id={pin.id}
                  className={`!w-3 !h-3 !-left-[19px] !border-2 ${
                    isHigh
                      ? '!bg-emerald-400 !border-emerald-200'
                      : '!bg-slate-800 !border-slate-600'
                  }`}
                />
                <span
                  className={`text-[10px] font-mono font-medium ${isHigh ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}
                  title={pinAliases[pin.id] ? `${pin.name} (${pinAliases[pin.id]})` : pin.name}
                >
                  {getPinDisplayName(pin)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Side: Outputs */}
        <div className="flex flex-col gap-2.5 items-end">
          {outputs.map((pin) => {
            const isHigh = pin.value === 1;
            return (
              <div key={pin.id} className="relative flex items-center gap-2 group">
                <span
                  className={`text-[10px] font-mono font-medium ${isHigh ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}
                  title={pinAliases[pin.id] ? `${pin.name} (${pinAliases[pin.id]})` : pin.name}
                >
                  {getPinDisplayName(pin)}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={pin.id}
                  className={`!w-3 !h-3 !-right-[19px] !border-2 ${
                    isHigh
                      ? '!bg-emerald-400 !border-emerald-200'
                      : '!bg-slate-800 !border-slate-600'
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

ICComponentNode.displayName = 'ICComponentNode';
