import {
  AVRADC,
  adcConfig,
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
/** Run slices averaged for PWM duty and frequency (a 490 Hz PWM period is about 2 ms). */
const PWM_WINDOW = 4;
const PIN_COUNT = 20;

/** A part wired to the board whose fast strobe has to be caught inside the emulator (an LCD's E pin). */
export interface PinTap {
  id: string;
  /** Pin whose falling edge takes a reading. */
  strobe: number;
  /** Pins read at that moment. */
  pins: number[];
}

export interface PwmReading {
  /** Fraction of the time the pin was high. */
  duty: number;
  /** Rising edges per second. */
  frequency: number;
}

/**
 * An emulated ATmega328P (Uno/Nano) running a compiled sketch. Only the digital side is modelled:
 * pins are 0/1 when the sketch makes them outputs, and float (-1) while they are inputs.
 */
export class UnoBoard {
  private readonly cpu: CPU;
  private readonly portB: AVRIOPort;
  private readonly portC: AVRIOPort;
  private readonly portD: AVRIOPort;
  private readonly adc: AVRADC;
  serial = '';
  // PWM measurement: level, when it last changed, high time and rising edges in this slice
  private readonly level = new Array<boolean>(PIN_COUNT).fill(false);
  private readonly since = new Array<number>(PIN_COUNT).fill(0);
  private readonly highCycles = new Array<number>(PIN_COUNT).fill(0);
  private readonly rises = new Array<number>(PIN_COUNT).fill(0);
  private history: { cycles: number; high: number[]; rises: number[] }[] = [];
  private taps: PinTap[] = [];
  private tapEvents: { id: string; levels: SignalValue[] }[] = [];

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
    this.adc = new AVRADC(this.cpu, adcConfig);
    [this.portD, this.portB, this.portC].forEach((port, p) => port.addListener(() => this.pinsChanged(p === 0 ? 0 : p === 1 ? 8 : 14)));
  }

  // Called by the emulated chip whenever a port's pins change, at that exact cycle
  private pinsChanged(first: number) {
    const now = this.cpu.cycles;
    const count = first === 8 ? 6 : first === 14 ? 6 : 8;
    for (let pin = first; pin < first + count; pin++) {
      const high = this.output(pin) === 1;
      if (high === this.level[pin]) continue;
      if (this.level[pin]) this.highCycles[pin] += now - this.since[pin];
      else this.rises[pin]++;
      this.level[pin] = high;
      this.since[pin] = now;
      // A falling strobe: read the other pins now, before the program changes them
      if (!high) this.taps.filter((t) => t.strobe === pin).forEach((t) => this.tapEvents.push({ id: t.id, levels: t.pins.map((p) => this.output(p)) }));
    }
  }

  /** Runs the program for `ms` milliseconds of board time. */
  run(ms: number): void {
    const start = this.cpu.cycles;
    const end = start + Math.round(ms * CYCLES_PER_MS);
    this.highCycles.fill(0);
    this.rises.fill(0);
    this.since.fill(start);
    while (this.cpu.cycles < end) {
      avrInstruction(this.cpu);
      this.cpu.tick();
    }
    for (let pin = 0; pin < PIN_COUNT; pin++) if (this.level[pin]) this.highCycles[pin] += this.cpu.cycles - this.since[pin];
    this.history = [...this.history, { cycles: this.cpu.cycles - start, high: this.highCycles.slice(), rises: this.rises.slice() }].slice(-PWM_WINDOW);
  }

  /** Duty and frequency of a pin that keeps switching (analogWrite, tone), or null for a steady pin. */
  pwm(pin: number): PwmReading | null {
    const cycles = this.history.reduce((a, h) => a + h.cycles, 0);
    const rises = this.history.reduce((a, h) => a + h.rises[pin], 0);
    if (cycles === 0 || rises < 2) return null;
    const duty = this.history.reduce((a, h) => a + h.high[pin], 0) / cycles;
    return { duty, frequency: (rises * UNO_CLOCK_HZ) / cycles };
  }

  /** Sets the parts to watch for fast strobes; their readings collect until takeTapEvents. */
  setTaps(taps: PinTap[]): void {
    this.taps = taps;
  }

  takeTapEvents(): { id: string; levels: SignalValue[] }[] {
    const events = this.tapEvents;
    this.tapEvents = [];
    return events;
  }

  /** Voltage on an analog input A0–A5 (channel 0–5), read by analogRead. */
  analog(channel: number, volts: number): void {
    this.adc.channelValues[channel] = volts;
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
