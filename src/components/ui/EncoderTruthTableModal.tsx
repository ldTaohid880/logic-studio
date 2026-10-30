import React, { useEffect, useMemo, useRef } from 'react';
import { TruthTableDialog } from './TruthTableDialog';
import { TruthTable } from './TruthTable';
import { tableLines, fileSlug } from './useTableExport';
import { EncoderConfig, EncoderState } from '../../types/encoder';
import { SignalValue } from '../../types/circuit';
import { generateEncoderTruthTable } from '../../utils/truthTableGenerator';
import { getEncoderExplanation } from '../../utils/encoderExplanation';

interface EncoderTruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EncoderConfig;
  encoderState?: EncoderState;
  currentInputs?: SignalValue[];
  nodeLabel?: string;
}

export const EncoderTruthTableModal: React.FC<EncoderTruthTableModalProps> = ({ isOpen, ...props }) =>
  isOpen ? <EncoderTruthTableDialog {...props} /> : null;

const EncoderTruthTableDialog: React.FC<Omit<EncoderTruthTableModalProps, 'isOpen'>> = ({
  onClose,
  config,
  encoderState,
  currentInputs,
  nodeLabel = 'Encoder',
}) => {
  const activeRowRef = useRef<HTMLTableRowElement>(null);
  const table = useMemo(() => generateEncoderTruthTable(config, currentInputs), [config, currentInputs]);
  const explanation = useMemo(() => getEncoderExplanation(config, encoderState), [config, encoderState]);
  const active = table.rows.find((r) => r.isActive);

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [active?.id]);

  const outputHeaders = [
    ...table.headers.outputs,
    'Value',
    'V',
    ...(config.showEnableOutput ? ['EO'] : []),
    ...(config.showGroupSignal ? ['GS'] : []),
  ];
  const outputsOf = (r: (typeof table.rows)[number]) => [
    ...r.outputs,
    r.decimal === 'ERROR' ? 'error' : r.decimal,
    r.valid,
    ...(config.showEnableOutput ? [r.eo] : []),
    ...(config.showGroupSignal ? [r.gs] : []),
  ];

  const inputLevel = (config.inputActiveMode ?? config.activeMode ?? 'high') === 'high' ? 'active high' : 'active low';
  const outputLevel = (config.outputActiveMode ?? config.activeMode ?? 'high') === 'high' ? 'active high' : 'active low';
  const priority = config.priority
    ? `priority to the ${config.priorityDirection === 'highest' ? 'highest' : 'lowest'} input`
    : 'no priority';

  return (
    <TruthTableDialog
      onClose={onClose}
      title={`Truth table: ${nodeLabel}`}
      description={`${config.inputs}-to-${Math.log2(config.inputs)} encoder · inputs ${inputLevel}, outputs ${outputLevel} · ${priority}`}
      status={
        <span className={explanation.statusType === 'error' ? 'text-signal-unknown' : undefined}>{explanation.explanation}</span>
      }
      footerNote={
        <>
          {table.rows.length} rows · <span className="font-mono">X</span> don't care · V valid output
          {config.priority ? '' : ' · several active inputs is an error without priority'}
        </>
      }
      fileBase={`${fileSlug(nodeLabel)}-truth-table`}
      lines={(sep) =>
        tableLines(
          ['Row', ...table.headers.inputs, ...outputHeaders],
          table.rows.map((r) => [r.label, ...r.inputs, ...outputsOf(r)]),
          sep
        )
      }
      className="w-full max-w-4xl max-h-[85vh]"
    >
      <TruthTable
        caption={`Truth table for ${nodeLabel}`}
        rowHeader="Row"
        inputHeaders={table.headers.inputs}
        outputHeaders={outputHeaders}
        rows={table.rows.map((r, i) => ({
          key: r.id,
          index: i,
          label: r.label,
          inputs: r.inputs,
          outputs: outputsOf(r),
          isActive: r.isActive,
          warning: r.isError ? r.explanationNote : undefined,
        }))}
        activeRowRef={activeRowRef}
      />
    </TruthTableDialog>
  );
};
