import React, { useEffect, useMemo, useRef } from 'react';
import { TruthTableDialog } from './TruthTableDialog';
import { TruthTable } from './TruthTable';
import { tableLines, fileSlug } from './useTableExport';
import { SevenSegmentConfig } from '../../types/sevenSegment';
import { PinData } from '../../types/circuit';
import { buildSevenSegmentTable } from '../../utils/sevenSegmentLogic';

interface SevenSegmentTruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: SevenSegmentConfig;
  currentInputs: PinData[];
  nodeLabel: string;
}

const SEGMENTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

const MODE_TEXT: Record<SevenSegmentConfig['mode'], string> = {
  binary: 'Binary: shows 0–F',
  hex: 'Hex: shows 0–F',
  bcd: 'BCD: shows 0–9',
  direct: 'Direct: one input per segment',
};

export const SevenSegmentTruthTableModal: React.FC<SevenSegmentTruthTableModalProps> = ({ isOpen, ...props }) =>
  isOpen ? <SevenSegmentTruthTableDialog {...props} /> : null;

const SevenSegmentTruthTableDialog: React.FC<Omit<SevenSegmentTruthTableModalProps, 'isOpen'>> = ({ onClose, config, currentInputs, nodeLabel }) => {
  const activeRowRef = useRef<HTMLTableRowElement>(null);
  const table = useMemo(() => buildSevenSegmentTable(config, currentInputs), [config, currentInputs]);
  const active = table.rows.find((r) => r.isActive);

  useEffect(() => {
    activeRowRef.current?.scrollIntoView({ block: 'nearest' });
  }, [active?.index]);

  const outputHeaders = [...SEGMENTS, 'Shows'];
  const anode = config.displayType === 'common_anode';

  return (
    <TruthTableDialog
      onClose={onClose}
      title={`Truth table: ${nodeLabel}`}
      description={`${MODE_TEXT[config.mode]} · ${anode ? 'common anode (segments light on 0)' : 'common cathode (segments light on 1)'}`}
      status={
        active ? (
          <>
            On the canvas right now: inputs <span className="font-mono text-fg">{active.inputs.join('')}</span> light{' '}
            <span className="font-mono text-fg">{SEGMENTS.filter((_, i) => active.segments[i]).join(' ') || 'nothing'}</span> and show{' '}
            <span className="font-mono text-fg">{active.shows}</span>.
          </>
        ) : (
          'Connect every input to see which row the display is on.'
        )
      }
      footerNote={`${table.rows.length} rows · segment columns: 1 = lit`}
      fileBase={`${fileSlug(nodeLabel)}-truth-table`}
      lines={(sep) =>
        tableLines(
          [...table.inputHeaders, ...outputHeaders],
          table.rows.map((r) => [...r.inputs, ...r.segments, r.shows]),
          sep
        )
      }
      className="w-full max-w-2xl max-h-[85vh]"
    >
      <TruthTable
        caption={`Truth table for ${nodeLabel}`}
        inputHeaders={table.inputHeaders}
        outputHeaders={outputHeaders}
        rows={table.rows.map((r) => ({
          key: `r${r.index}`,
          index: r.index,
          inputs: r.inputs,
          outputs: [...r.segments, r.shows],
          isActive: r.isActive,
        }))}
        activeRowRef={activeRowRef}
      />
    </TruthTableDialog>
  );
};
