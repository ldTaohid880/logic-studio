import { Datasheet } from './types';
import { PINOUTS, pinsOf } from './pinouts';
import { DECOUPLE, SIM, TIE_UNUSED, tpd, tt } from './common';

export const ARITHMETIC_SHEETS: Datasheet[] = [
  {
    type: 'ADDER_4BIT', title: '4-bit full adder', partNumber: '74HC283',
    summary: 'Adds two 4-bit numbers and a carry in, giving a 4-bit sum and a carry out. The carry out is the fifth bit of the result.',
    howItWorks: [
      'Four full adders are chained so each stage passes its carry to the next (ripple carry). The result is A + B + Cin, from 0 to 31, split over S3..S0 and Cout.',
      'To subtract, invert B and set Cin to 1 (two\'s complement). To chain chips for longer words, connect one chip\'s carry out to the next one\'s carry in.',
    ],
    package: { kind: 'DIP-16', pins: pinsOf(PINOUTS.hc283) },
    mapping: [
      { pin: 'in-0', real: 'A1' }, { pin: 'in-1', real: 'A2' }, { pin: 'in-2', real: 'A3' }, { pin: 'in-3', real: 'A4' },
      { pin: 'in-4', real: 'B1' }, { pin: 'in-5', real: 'B2' }, { pin: 'in-6', real: 'B3' }, { pin: 'in-7', real: 'B4' },
      { pin: 'in-8', real: 'C0' },
      { pin: 'out-0', real: 'S1' }, { pin: 'out-1', real: 'S2' }, { pin: 'out-2', real: 'S3' }, { pin: 'out-3', real: 'S4' }, { pin: 'out-4', real: 'C4' },
    ],
    logicFamily: '74HC', supplyCurrentUa: '8',
    timing: [
      tpd('18', '40', 'Carry in to carry out', 'tpd (C0 to C4)'),
      tpd('22', '45', 'A or B input to sum output', 'tpd (A, B to S)'),
      tt(),
    ],
    applications: ['The arithmetic unit of a small CPU.', 'Add or subtract with a XOR gate on B (adder-subtractor).', 'Counters, incrementers (B = 0, Cin = 1) and address calculation.'],
    pitfalls: ['Ripple carry is slow: the carry passes through every stage, so long adders are limited by delay. This is why fast CPUs use look-ahead carry.', 'The real chip numbers its bits 1 to 4; Logic Studio numbers them 0 to 3.', TIE_UNUSED + ' Tie C0 low when you do not need a carry in.', DECOUPLE],
    simNotes: [SIM.zeroDelay, 'The 74HC283 has internal look-ahead carry; the result is the same as the simulation, only the delay differs.'],
    related: ['FULL_ADDER', 'ADDER_SUBTRACTOR_4BIT', 'ALU_4BIT_8FN', 'INCREMENTER_4BIT'],
    vendorUrl: 'https://www.ti.com/product/SN74HC283',
  },
];
