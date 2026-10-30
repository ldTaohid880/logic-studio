import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { NodeData } from '../../types/circuit';
import { useCircuitStore } from '../../store/useCircuitStore';
import { useShallow } from 'zustand/react/shallow';
import { ExternalLink } from 'lucide-react';
import { ChipFrame, ChipPinRow } from './ChipFrame';

const CATEGORY_COLOR: Record<string, string> = {
  Combinational: 'var(--cy-500)',
  Sequential: 'var(--pu-500)',
  Arithmetic: 'var(--am-500)',
};

export const ICComponentNode: React.FC<NodeProps> = memo(({ id, data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const { enterSubcircuitView } = useCircuitStore(useShallow((s) => ({ enterSubcircuitView: s.enterSubcircuitView })));
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

  return (
    <ChipFrame
      title={data.label || header.title}
      tag={header.code}
      accentColor={CATEGORY_COLOR[header.category] ?? 'var(--fg-subtle)'}
      onDoubleClick={handleDoubleClick}
      action={
        subcircuitId ? (
          <button
            type="button"
            onClick={handleDoubleClick}
            title="Show internal logic (double-click)"
            aria-label="Show internal logic"
            className="nodrag p-1 rounded text-fg-subtle hover:text-fg hover:bg-surface-2 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        ) : undefined
      }
    >
      <ChipPinRow inputs={inputs} outputs={outputs} aliases={data.pinAliases} />
    </ChipFrame>
  );
});

ICComponentNode.displayName = 'ICComponentNode';
