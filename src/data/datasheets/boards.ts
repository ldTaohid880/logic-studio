import { Datasheet } from './types';
import { PINOUTS, findPin, pinsOf } from './pinouts';
import { BOARD_PINS, boardPinName } from '../../simulation/timeline';

// Arduino pin name -> ATmega328P package pin
const PACKAGE_PIN: Record<string, string> = {
  D2: 'PD2', D3: 'PD3', D4: 'PD4', D5: 'PD5', D6: 'PD6', D7: 'PD7',
  D8: 'PB0', D9: 'PB1', D10: 'PB2', D11: 'PB3', D12: 'PB4', D13: 'PB5',
  A0: 'PC0', A1: 'PC1', A2: 'PC2', A3: 'PC3', A4: 'PC4', A5: 'PC5',
};

const pins = pinsOf(PINOUTS.atmega328p);

export const BOARD_SHEETS: Datasheet[] = [
  {
    type: 'ARDUINO_UNO', title: 'Uno-compatible board', partNumber: 'ATmega328P',
    summary: 'A small microcontroller board that runs a program you load as compiled Arduino code. Its pins D2–D13 and A0–A5 connect to your circuit.',
    howItWorks: [
      'The brain is an ATmega328P chip, an 8-bit AVR microcontroller. The sketch you write is compiled to machine code (an Intel HEX file) and run by the chip, one instruction after another.',
      'Each pin can be an input (reads the wire) or an output (drives it), chosen by the program with pinMode. Analog pins A0–A5 can also read voltages with the 10-bit analog-to-digital converter, and some pins make PWM, which looks like an adjustable voltage.',
    ],
    package: { kind: 'DIP-28', pins },
    mapping: BOARD_PINS.flatMap((pin, i) => {
      const real = PACKAGE_PIN[boardPinName(pin)];
      return real && findPin(pins, real)
        ? [{ pin: `in-${i}`, real, note: 'Read side' }, { pin: `out-${i}`, real, note: 'Drive side' }]
        : [];
    }),
    electrical: [
      { param: 'Supply voltage', symbol: 'VCC', value: '4.5 V to 5.5 V', conditions: 'At 16 MHz; 5 V on an Uno' },
      { param: 'Clock frequency', symbol: 'fCLK', value: '16 MHz', conditions: 'Crystal on an Uno' },
      { param: 'Output current per pin', symbol: 'IO', value: '20 mA recommended, 40 mA absolute max' },
      { param: 'Total current, all pins', symbol: 'ΣIO', value: '200 mA max' },
      { param: 'Flash / SRAM / EEPROM', symbol: '', value: '32 KB / 2 KB / 1 KB' },
      { param: 'Analog inputs', symbol: 'ADC', value: '6 channels, 10 bits', conditions: '0 V to 5 V' },
    ],
    applications: ['Control LEDs, motors and displays from a program.', 'Read sensors and switches and decide what to do.', 'Learn how software and hardware meet.'],
    pitfalls: ['Never draw more than about 20 mA from a pin. Drive big loads through a transistor.', 'Pins 0 and 1 are used for the USB serial link on a real board, so Logic Studio leaves them out.', 'Always use a resistor in series with an LED.'],
    simNotes: [
      'Runs real compiled HEX on an AVR emulator. Digital I/O, timers (millis, delay, PWM, tone) and serial output are included; other peripherals (I²C, SPI, interrupts from pins) are not.',
      'Each pin shows two handles stacked together: dragging a wire out drives from the pin and dropping a wire on it reads the pin.',
      'The real board has more parts (USB chip, regulator, crystal) that are not simulated.',
    ],
    related: ['LCD_16X2', 'POTENTIOMETER', 'SENSOR_LIGHT', 'OUTPUT'],
    vendorUrl: 'https://www.microchip.com/en-us/product/ATmega328P',
  },
];
