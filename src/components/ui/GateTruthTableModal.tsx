import React, { useMemo } from 'react';
import { TruthTableDialog } from './TruthTableDialog';
import { TruthTable } from './TruthTable';
import { tableLines, fileSlug } from './useTableExport';
import { GateType, PinData } from '../../types/circuit';
import { buildGateTruthTable } from '../../utils/gateTruthTable';
import { getComponentInfo } from '../../data/components';

interface GateTruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  gateType: GateType;
  inputCount: number;
  currentInputs?: PinData[];
  nodeLabel?: string;
}

export const GateTruthTableModal: React.FC<GateTruthTableModalProps> = ({ isOpen, ...props }) =>
  isOpen ? <GateTruthTableDialog {...props} /> : null;

const GateTruthTableDialog: React.FC<Omit<GateTruthTableModalProps, 'isOpen'>> = ({
  onClose,
  gateType,
  inputCount,
  currentInputs,
  nodeLabel,
}) => {
  const info = getComponentInfo(gateType);
  const table = useMemo(
    () => buildGateTruthTable(gateType, inputCount, currentInputs?.map((p) => p.value)),
    [gateType, inputCount, currentInputs]
  );
  const active = table.rows.find((r) => r.isActive);

  return (
    <TruthTableDialog
      onClose={onClose}
      title={`Truth table: ${nodeLabel && nodeLabel !== info.name ? `${nodeLabel} (${info.name})` : info.name}`}
      description={info.description}
      status={
        active ? (
          <>
            On the canvas right now: inputs <span className="font-mono text-fg">{active.inputs.join('')}</span> give{' '}
            <span className="font-mono text-fg">{active.outputs.join(', ')}</span> (row m{active.index}).
          </>
        ) : (
          'Connect every input to see which row the circuit is on.'
        )
      }
      footerNote={`${table.rows.length} rows`}
      fileBase={`${fileSlug(nodeLabel || info.name)}-truth-table`}
      lines={(sep) =>
        tableLines(
          [...table.inputHeaders, ...table.outputHeaders],
          table.rows.map((r) => [...r.inputs, ...r.outputs]),
          sep
        )
      }
    >
      <TruthTable caption={`Truth table for ${info.name}`} inputHeaders={table.inputHeaders} outputHeaders={table.outputHeaders} rows={table.rows} />
    </TruthTableDialog>
  );
};
