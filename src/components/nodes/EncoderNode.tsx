import React, { memo, useState, useEffect } from 'react';
import { NodeProps, useUpdateNodeInternals } from '@xyflow/react';
import { Table } from 'lucide-react';
import { NodeData } from '../../types/circuit';
import { DEFAULT_ENCODER_CONFIG } from '../../types/encoder';
import { evaluateEncoder } from '../../simulation/encoderLogic';
import { EncoderTruthTableModal } from '../ui/EncoderTruthTableModal';
import { ChipFrame, ChipPinRow, chipActionClass } from './ChipFrame';

/** Encoder chip; its settings and the full truth table live in the inspector. */
export const EncoderNode = memo(({ id, data }: NodeProps) => {
  const updateNodeInternals = useUpdateNodeInternals();
  const [isTruthTableOpen, setIsTruthTableOpen] = useState(false);

  const nodeData = data as unknown as NodeData;
  const { label, inputs = [], outputs = [] } = nodeData;
  const config = nodeData.encoderConfig || DEFAULT_ENCODER_CONFIG;
  const state = nodeData.encoderState || evaluateEncoder(inputs.map((p) => p.value), config).state;

  // Pins change with the settings, so React Flow has to re-measure the handles
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, inputs.length, outputs.length, updateNodeInternals]);

  return (
    <>
      <ChipFrame
        title={label || 'Encoder'}
        tag={`${config.inputs}-to-${Math.log2(config.inputs)}${config.priority ? ' priority' : ''}`}
        accentColor="var(--cy-500)"
        minWidth={170}
        action={
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsTruthTableOpen(true);
            }}
            title="Truth table"
            aria-label="Truth table"
            className={chipActionClass}
          >
            <Table className="w-3.5 h-3.5" />
          </button>
        }
      >
        <ChipPinRow inputs={inputs} outputs={outputs} aliases={nodeData.pinAliases} />
        {state.error && (
          <p className="relative mx-[17px] mt-1 text-[10px] leading-tight text-[#ffb347]" role="status">
            {state.error}
          </p>
        )}
      </ChipFrame>

      <EncoderTruthTableModal
        isOpen={isTruthTableOpen}
        onClose={() => setIsTruthTableOpen(false)}
        config={config}
        encoderState={state}
        currentInputs={inputs.map((p) => p.value)}
        nodeLabel={label || 'Encoder'}
      />
    </>
  );
});

EncoderNode.displayName = 'EncoderNode';
