import { CircuitPreset } from '../../types/circuit';
import { GATE_EXAMPLES } from './gates';
import { COMBINATIONAL_EXAMPLES } from './combinational';
import { MEMORY_EXAMPLES } from './memory';
import { PROJECT_EXAMPLES } from './projects';

/** Built-in example circuits (File → Example circuits), in the order the examples dialog lists them. */
export const CIRCUIT_PRESETS: CircuitPreset[] = [...GATE_EXAMPLES, ...COMBINATIONAL_EXAMPLES, ...MEMORY_EXAMPLES, ...PROJECT_EXAMPLES];
