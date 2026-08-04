import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { Cpu } from 'lucide-react';

export const ICComponentNode: React.FC<NodeProps> = memo(({ id, data: nodeData, selected }) => {
  const data = nodeData as unknown as NodeData;
  const inputs = data.inputs || [];
  const outputs = data.outputs || [];

  const getICHeader = () => {
    switch (data.gateType) {
      case 'HALF_SUBTRACTOR': return { title: 'Half Subtractor', code: 'SUB-2' };
      case 'FULL_SUBTRACTOR': return { title: 'Full Subtractor', code: 'SUB-3' };
      case 'MUX_4TO1': return { title: '4:1 MUX', code: '74HC153' };
      case 'DEMUX_1TO4': return { title: '1:4 DEMUX', code: '74HC139' };
      case 'PRIORITY_ENCODER': return { title: 'Priority Encoder', code: '74HC148' };
      case 'COMPARATOR_4BIT': return { title: '4-bit Comparator', code: '74HC85' };
      case 'DECODER_BCD_TO_7SEG': return { title: 'BCD to 7-Seg', code: '74HC4511' };
      case 'D_LATCH': return { title: 'D Latch', code: '74HC75' };
      case 'JK_FLIPFLOP': return { title: 'JK Flip-Flop', code: '74HC109' };
      case 'REGISTER_4BIT': return { title: '4-bit Register', code: '74HC173' };
      case 'SHIFT_REGISTER_4BIT': return { title: '4-bit Shift Reg', code: '74HC195' };
      case 'UP_COUNTER_4BIT': return { title: '4-bit Up Counter', code: '74HC191U' };
      case 'DOWN_COUNTER_4BIT': return { title: '4-bit Down Counter', code: '74HC191D' };
      case 'MUX_8TO1': return { title: '8:1 MUX', code: '74HC151' };
      case 'DEMUX_1TO8': return { title: '1:8 DEMUX', code: '74HC138' };
      case 'DECODER_3TO8': return { title: '3->8 Decoder', code: '74HC138' };
      case 'DECODER_4TO16': return { title: '4->16 Decoder', code: '74HC154' };
      case 'ENCODER_8TO3': return { title: '8->3 Encoder', code: '74HC148' };
      case 'PARITY_GENERATOR': return { title: 'Parity Gen', code: '74HC280' };
      case 'PARITY_CHECKER': return { title: 'Parity Checker', code: '74HC280C' };
      case 'CONVERTER_BIN_TO_GRAY': return { title: 'Bin -> Gray', code: 'CONV-BG' };
      case 'CONVERTER_GRAY_TO_BIN': return { title: 'Gray -> Bin', code: 'CONV-GB' };
      case 'T_FLIPFLOP': return { title: 'T Flip-Flop', code: '74HC74T' };
      case 'RING_COUNTER': return { title: 'Ring Counter', code: '74HC4017' };
      case 'RIPPLE_COUNTER': return { title: 'Ripple Counter', code: '74HC393' };
      case 'SYNCHRONOUS_COUNTER': return { title: 'Sync Counter', code: '74HC163' };
      case 'UP_DOWN_COUNTER': return { title: 'Up/Down Counter', code: '74HC190' };
      case 'FREQUENCY_DIVIDER': return { title: 'Freq Divider', code: '74HC4024' };
      case 'INCREMENTER_4BIT': return { title: '4-bit Incrementer', code: 'INC-4' };
      case 'DECREMENTER_4BIT': return { title: '4-bit Decrementer', code: 'DEC-4' };
      case 'ADDER_SUBTRACTOR_4BIT': return { title: 'Adder/Subtractor', code: '74HC283S' };
      case 'ALU_4BIT': return { title: '4-bit ALU', code: '74HC181' };
      default: return { title: data.label || 'IC Module', code: '74HC00' };
    }
  };

  const header = getICHeader();

  return (
    <div
      className={`min-w-[170px] bg-slate-900/95 border rounded-xl shadow-md backdrop-blur-md transition-all duration-150 ${
        selected ? 'border-emerald-400 ring-1 ring-emerald-400/40' : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* IC Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/80 rounded-t-xl">
        <div className="flex items-center gap-1.5 min-w-0">
          <Cpu className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="text-xs font-mono font-bold text-slate-100 truncate">
            {data.label || header.title}
          </span>
        </div>
        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          {header.code}
        </span>
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
                  className={`!w-3 !h-3 !-left-[19px] !border-2 !transition-all ${
                    isHigh
                      ? '!bg-emerald-400 !border-emerald-200'
                      : '!bg-slate-800 !border-slate-600'
                  }`}
                />
                <span className={`text-[10px] font-mono font-medium ${isHigh ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
                  {pin.name}
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
                <span className={`text-[10px] font-mono font-medium ${isHigh ? 'text-emerald-300 font-semibold' : 'text-slate-400'}`}>
                  {pin.name}
                </span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id={pin.id}
                  className={`!w-3 !h-3 !-right-[19px] !border-2 !transition-all ${
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
