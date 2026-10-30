import { EncoderConfig } from '../types/encoder';
import { SignalValue } from '../types/circuit';
import { evaluateEncoder } from '../simulation/encoderLogic';

export interface TruthTableRow {
  id: string;
  label: string;
  inputs: (number | string)[]; // 0, 1, or 'X'
  outputs: number[]; // A_{M-1}..A0
  decimal: number | string;
  valid: number;
  eo: number;
  gs: number;
  isError?: boolean;
  isActive?: boolean;
  explanationNote?: string;
}

export interface TruthTableData {
  headers: {
    inputs: string[];
    outputs: string[];
    decimal: string;
    valid: string;
    eo: string;
    gs: string;
  };
  rows: TruthTableRow[];
}

export function generateEncoderTruthTable(
  config: EncoderConfig,
  currentInputs?: SignalValue[]
): TruthTableData {
  const numInputs = config.inputs;
  const numBinaryOutputs = Math.log2(numInputs);
  const isInputActiveHigh = (config.inputActiveMode ?? config.activeMode ?? 'high') === 'high';
  const isOutputActiveHigh = (config.outputActiveMode ?? config.activeMode ?? 'high') === 'high';

  // Headers (D{N-1} down to D0)
  const inputHeaders: string[] = [];
  for (let i = numInputs - 1; i >= 0; i--) {
    inputHeaders.push(`D${i}`);
  }

  // Outputs (A{M-1} down to A0)
  const outputHeaders: string[] = [];
  for (let i = numBinaryOutputs - 1; i >= 0; i--) {
    outputHeaders.push(`A${i}`);
  }

  const rows: TruthTableRow[] = [];
  const activeVal = isInputActiveHigh ? 1 : 0;
  const inactiveVal = isInputActiveHigh ? 0 : 1;
  const idleOutputBit = isOutputActiveHigh ? 0 : 1;

  // Evaluate current simulation active state
  let simulatedActiveIndex: number | null = null;
  let simulatedError = false;
  let activeInputIndices: number[] = [];

  if (currentInputs && currentInputs.length >= numInputs) {
    const evalRes = evaluateEncoder(currentInputs, config);
    simulatedActiveIndex = evalRes.state.activeIndex;
    simulatedError = !!evalRes.state.error;
    activeInputIndices = evalRes.state.activeInputsIndices;
  }

  // Row 0: No active inputs
  const noInputVals = Array(numInputs).fill(inactiveVal);
  rows.push({
    id: 'row-none',
    label: 'No Active Input',
    inputs: [...noInputVals].reverse(),
    outputs: Array(numBinaryOutputs).fill(idleOutputBit),
    decimal: '-',
    valid: 0,
    eo: 1,
    gs: 0,
    isActive: simulatedActiveIndex === null && !simulatedError && activeInputIndices.length === 0,
    explanationNote: `All inputs inactive in ${isInputActiveHigh ? 'Active High' : 'Active Low'} mode. Valid (V)=0, Enable Output (EO)=1.`,
  });

  if (config.priority) {
    // Priority Mode: Construct rows showing Don't Care 'X' symbols
    for (let activeIdx = 0; activeIdx < numInputs; activeIdx++) {
      const inputVals: (number | string)[] = Array(numInputs).fill(inactiveVal);

      if (config.priorityDirection === 'highest') {
        // D_activeIdx is active. Higher bits D_{activeIdx+1}..D_{N-1} are inactive.
        // Lower bits D_0..D_{activeIdx-1} are Don't Cares ('X').
        inputVals[activeIdx] = activeVal;
        for (let j = 0; j < activeIdx; j++) {
          inputVals[j] = 'X';
        }
      } else {
        // Lowest First: D_activeIdx is active. Lower bits D_0..D_{activeIdx-1} are inactive.
        // Higher bits D_{activeIdx+1}..D_{N-1} are Don't Cares ('X').
        inputVals[activeIdx] = activeVal;
        for (let j = activeIdx + 1; j < numInputs; j++) {
          inputVals[j] = 'X';
        }
      }

      // Compute binary outputs for activeIdx considering Output Logic
      const outputs: number[] = [];
      for (let bit = numBinaryOutputs - 1; bit >= 0; bit--) {
        const rawBit = (activeIdx >> bit) & 1;
        const outBit = isOutputActiveHigh ? rawBit : (1 - rawBit);
        outputs.push(outBit);
      }

      const isActive = simulatedActiveIndex === activeIdx && !simulatedError;

      rows.push({
        id: `row-d${activeIdx}`,
        label: `D${activeIdx} Active`,
        inputs: [...inputVals].reverse(),
        outputs,
        decimal: activeIdx,
        valid: 1,
        eo: 0,
        gs: 1,
        isActive,
        explanationNote: `D${activeIdx} active. Output is ${outputs.join('')} (${isOutputActiveHigh ? 'Direct' : 'Inverted'} for Decimal ${activeIdx}).`,
      });
    }
  } else {
    // Standard Mode: Single-active rows D0..D{N-1}
    for (let activeIdx = 0; activeIdx < numInputs; activeIdx++) {
      const inputVals: (number | string)[] = Array(numInputs).fill(inactiveVal);
      inputVals[activeIdx] = activeVal;

      const outputs: number[] = [];
      for (let bit = numBinaryOutputs - 1; bit >= 0; bit--) {
        const rawBit = (activeIdx >> bit) & 1;
        const outBit = isOutputActiveHigh ? rawBit : (1 - rawBit);
        outputs.push(outBit);
      }

      const isActive = simulatedActiveIndex === activeIdx && !simulatedError;

      rows.push({
        id: `row-d${activeIdx}`,
        label: `D${activeIdx} Active`,
        inputs: [...inputVals].reverse(),
        outputs,
        decimal: activeIdx,
        valid: 1,
        eo: 0,
        gs: 1,
        isActive,
        explanationNote: `Single active input D${activeIdx}. Output is ${outputs.join('')} (Decimal ${activeIdx}).`,
      });
    }

    // Add standard multi-active error row
    const errInputs = Array(numInputs).fill(inactiveVal);
    errInputs[0] = activeVal;
    errInputs[1] = activeVal;

    rows.push({
      id: 'row-error',
      label: 'Multiple Inputs Active',
      inputs: [...errInputs].reverse(),
      outputs: Array(numBinaryOutputs).fill(0),
      decimal: 'ERROR',
      valid: 0,
      eo: 0,
      gs: 0,
      isError: true,
      isActive: simulatedError,
      explanationNote: 'Standard encoder cannot encode multiple active inputs without Priority Mode.',
    });
  }

  // Append dynamic live canvas state row if error in live simulation
  if (simulatedError && !config.priority) {
    const liveInputs = currentInputs ? currentInputs.slice(1) : [];
    const liveInputsRev = [...liveInputs.slice(0, numInputs)].reverse();
    rows.push({
      id: 'row-live-sim-error',
      label: '⚡ Current Live Canvas State (Error)',
      inputs: liveInputsRev,
      outputs: Array(numBinaryOutputs).fill(0),
      decimal: 'ERROR',
      valid: 0,
      eo: 0,
      gs: 0,
      isError: true,
      isActive: true,
      explanationNote: `Multiple inputs active (${activeInputIndices.map((i) => `D${i}`).join(', ')}). Invalid state in standard mode.`,
    });
  }

  return {
    headers: {
      inputs: inputHeaders,
      outputs: outputHeaders,
      decimal: 'Decimal',
      valid: 'Valid (V)',
      eo: 'EO',
      gs: 'GS',
    },
    rows,
  };
}

export function exportTruthTableToCSV(table: TruthTableData, filename = 'encoder_truth_table.csv') {
  const headerLine = ['Row Label', ...table.headers.inputs, ...table.headers.outputs, 'Decimal', 'Valid (V)', 'EO', 'GS', 'Notes'].join(',');
  const rowLines = table.rows.map((row) => {
    return [
      `"${row.label}"`,
      ...row.inputs,
      ...row.outputs,
      row.decimal,
      row.valid,
      row.eo,
      row.gs,
      `"${row.explanationNote || ''}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headerLine, ...rowLines].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
