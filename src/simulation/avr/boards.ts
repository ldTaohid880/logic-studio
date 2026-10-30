import type { UnoBoard } from './unoBoard';
import { BoardFirmware } from '../../types/circuit';

/**
 * Running boards, one per part on the canvas. The emulator (avr8js) loads on first use, so circuits
 * without a board don't download it.
 */

let Uno: typeof UnoBoard | null = null;
let loading: Promise<void> | null = null;

export function loadEmulator(): Promise<void> {
  loading ??= import('./unoBoard').then((m) => {
    Uno = m.UnoBoard;
  });
  return loading;
}

interface RunningBoard {
  firmwareId: string;
  board: UnoBoard | null;
}

const running = new Map<string, RunningBoard>();

/** The running board for a part, started with its program on first use. Null until the emulator has loaded. */
export function boardFor(nodeId: string, firmware: BoardFirmware | undefined): UnoBoard | null {
  if (!firmware) return null;
  if (!Uno) {
    void loadEmulator();
    return null;
  }
  let entry = running.get(nodeId);
  if (!entry || entry.firmwareId !== firmware.id) {
    let board: UnoBoard | null = null;
    try {
      board = new Uno(firmware.hex);
    } catch (e) {
      console.error('Failed to start the board program', e);
    }
    entry = { firmwareId: firmware.id, board };
    running.set(nodeId, entry);
  }
  return entry.board;
}

/** Serial monitor text of a running board. */
export const boardSerial = (nodeId: string): string => running.get(nodeId)?.board?.serial ?? '';

/** Stops every board; the next run starts their programs from the beginning. */
export function restartBoards(): void {
  running.clear();
}
