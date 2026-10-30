import {
  CPU,
  avrInstruction,
  AVRIOPort,
  AVRTimer,
  AVRUSART,
  PinState,
  portBConfig,
  portCConfig,
  portDConfig,
  timer0Config,
  timer1Config,
  timer2Config,
  usart0Config,
} from 'avr8js';
import { SignalValue } from '../../types/circuit';
import { parseIntelHex } from './intelHex';

export const UNO_CLOCK_HZ = 16_000_000;
const CYCLES_PER_MS = UNO_CLOCK_HZ / 1000;
/** Serial monitor text kept per board. */
const SERIAL_LIMIT = 4000;

/**
 * An emulated ATmega328P (Uno/Nano) running a compiled sketch. Only the digital side is modelled:
 * pins are 0/1 when the sketch makes them outputs, and float (-1) while they are inputs.
 */
export class UnoBoard {
  private readonly cpu: CPU;
  private readonly portB: AVRIOPort;
  private readonly portC: AVRIOPort;
  private readonly portD: AVRIOPort;
  serial = '';

  constructor(hex: string) {
    const flash = parseIntelHex(hex);
    this.cpu = new CPU(new Uint16Array(flash.buffer));
    new AVRTimer(this.cpu, timer0Config);
    new AVRTimer(this.cpu, timer1Config);
    new AVRTimer(this.cpu, timer2Config);
    const usart = new AVRUSART(this.cpu, usart0Config, UNO_CLOCK_HZ);
    usart.onByteTransmit = (byte) => {
      this.serial = (this.serial + String.fromCharCode(byte)).slice(-SERIAL_LIMIT);
    };
    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);
  }

  /** Runs the program for `ms` milliseconds of board time. */
  run(ms: number): void {
    const end = this.cpu.cycles + Math.round(ms * CYCLES_PER_MS);
    while (this.cpu.cycles < end) {
      avrInstruction(this.cpu);
      this.cpu.tick();
    }
  }

  /** Port and bit for Arduino pin numbering: D0–D7 on port D, D8–D13 on port B, A0–A5 (14–19) on port C. */
  private locate(pin: number): [AVRIOPort, number] {
    if (pin < 8) return [this.portD, pin];
    if (pin < 14) return [this.portB, pin - 8];
    return [this.portC, pin - 14];
  }

  /** Level the board drives on a pin: 0/1 for an output, floating for an input. */
  output(pin: number): SignalValue {
    const [port, bit] = this.locate(pin);
    const state = port.pinState(bit);
    return state === PinState.High ? 1 : state === PinState.Low ? 0 : -1;
  }

  /** Level the circuit puts on a pin; a floating pin reads 1 with INPUT_PULLUP and 0 otherwise. */
  input(pin: number, value: SignalValue): void {
    const [port, bit] = this.locate(pin);
    port.setPin(bit, value === -1 ? port.pinState(bit) === PinState.InputPullUp : value === 1);
  }
}
