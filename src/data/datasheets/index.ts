import { GateType } from '../../types/circuit';
import { PARTS } from '../components';
import { createPart } from '../../store/partFactory';
import { Datasheet, LogicStudioPin } from './types';
import { GATE_SHEETS } from './gates';
import { COMBINATIONAL_SHEETS } from './combinational';
import { ARITHMETIC_SHEETS } from './arithmetic';
import { MEMORY_SHEETS } from './memory';
import { IO_SHEETS } from './io';
import { BOARD_SHEETS } from './boards';
import { generateDatasheet } from './generated';

export * from './types';
export { FAMILY_NOTE, familySpecs } from './family';
export { buildFunctionTable } from './functionTable';
export type { FunctionTableData, FunctionRow } from './functionTable';
export { pinKey, findPin } from './pinouts';

/** Sheets written by hand, one per part that has a real equivalent plus the parts worth a longer explanation. */
export const HAND_WRITTEN_SHEETS: Datasheet[] = [
  ...GATE_SHEETS, ...COMBINATIONAL_SHEETS, ...ARITHMETIC_SHEETS, ...MEMORY_SHEETS, ...IO_SHEETS, ...BOARD_SHEETS,
];

const HAND_WRITTEN = new Map<GateType, Datasheet>(HAND_WRITTEN_SHEETS.map((s) => [s.type, s]));
const cache = new Map<GateType, Datasheet>();

/** The part's own pins, read from a freshly created part so they cannot differ from the canvas. */
function logicStudioPins(type: GateType): LogicStudioPin[] {
  try {
    const data = createPart(type, { x: 0, y: 0 }, []).data as { inputs?: { id: string; name: string }[]; outputs?: { id: string; name: string }[] };
    return [
      ...(data.inputs ?? []).map((p) => ({ id: p.id, name: p.name, dir: 'in' as const })),
      ...(data.outputs ?? []).map((p) => ({ id: p.id, name: p.name, dir: 'out' as const })),
    ];
  } catch {
    return [];
  }
}

/** The datasheet of any part: the hand-written one if there is one, otherwise one made from the part catalog. */
export function getDatasheet(type: GateType): Datasheet {
  const cached = cache.get(type);
  if (cached) return cached;
  const sheet = { ...(HAND_WRITTEN.get(type) ?? generateDatasheet(type)), logicStudioPins: logicStudioPins(type) };
  cache.set(type, sheet);
  return sheet;
}

const normal = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, '');

/** Reads a link key: a part type (AND, mux_2to1) or a part number (74HC08). */
export function resolveDatasheetKey(key: string): GateType | null {
  const k = normal(key);
  const byType = PARTS.find((p) => normal(p.type) === k);
  if (byType) return byType.type;
  const byNumber = PARTS.find((p) => p.partNumber && normal(p.partNumber) === k);
  return byNumber ? byNumber.type : null;
}
