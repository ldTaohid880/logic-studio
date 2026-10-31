---
name: avr-program
description: Hand-assemble small ATmega328P (Arduino Uno) programs as 16-bit words for Logic Studio's emulator tests, since there is no AVR compiler in CI or the sandbox. Use when testing the Uno board, timers, ADC, PWM, serial or LCD taps.
---

# Hand-assembled AVR test programs

Tests in `src/simulation/timeline.test.ts` load programs with `wordsToIntelHex(words)` (`simulation/avr/intelHex.ts`) into `UnoBoard`. Don't download or run a toolchain (arduino-cli, avr-gcc): write the words by hand and **comment the assembly next to them** like the existing tests do.

## Encodings (d, r = register 0–31; K = constant; A = I/O address 0–63)

| Instruction | Word | Notes |
|---|---|---|
| `ldi Rd,K` | `0xE000 \| (K & 0xF0) << 4 \| (d - 16) << 4 \| (K & 0x0F)` | d = 16–31 only |
| `out A,Rr` | `0xB800 \| (A & 0x30) << 5 \| r << 4 \| (A & 0x0F)` | |
| `in Rd,A` | `0xB000 \| (A & 0x30) << 5 \| d << 4 \| (A & 0x0F)` | |
| `sbi A,b` / `cbi A,b` | `0x9A00 \| A << 3 \| b` / `0x9800 \| A << 3 \| b` | A = 0–31 |
| `sbic A,b` / `sbis A,b` | `0x9900 \| A << 3 \| b` / `0x9B00 \| A << 3 \| b` | skip if bit clear / set |
| `rjmp k` | `0xC000 \| (k & 0x0FFF)` | k = words from the **next** instruction, so `rjmp .` (jump to itself) = `0xCFFF` |
| `brne k` | `0xF401 \| (k & 0x7F) << 3` | k 7-bit signed from the next instruction; back 2 = `0xF7F1` |
| `dec Rd` | `0x940A \| d << 4` | |
| `sts k,Rr` | `0x9200 \| r << 4`, then `k` | two words; data address (I/O + 0x20) |
| `lds Rd,k` | `0x9000 \| d << 4`, then `k` | two words |
| `sbrc Rr,b` | `0xFC00 \| r << 4 \| b` | skip if register bit clear |

## Addresses

- I/O space (`in`/`out`/`sbi`/`cbi`): `PINB 0x03, DDRB 0x04, PORTB 0x05, PIND 0x09, DDRD 0x0A, PORTD 0x0B`. Data space (`lds`/`sts`) = I/O + 0x20.
- ADC (data space): `ADCL 0x78, ADCH 0x79, ADCSRA 0x7A, ADMUX 0x7C`. `ADMUX 0x60` = AVcc reference, left-adjusted, channel 0; `ADCSRA 0xC7` = enable + start, prescaler 128; bit 6 (ADSC) clears when done.
- Uno pins: D0–D7 = PORTD bits 0–7, D8–D13 = PORTB bits 0–5 (D13 = PB5, the LED), A0–A5 = PORTC 0–5.

## Worked examples (verified by the tests)

- D13 follows D2: `ldi r16,0x20 / out DDRB,r16 / loop: sbic PIND,2 / rjmp +2 / cbi PORTB,5 / rjmp loop / sbi PORTB,5 / rjmp loop` → `0xE200, 0xB904, 0x994A, 0xC002, 0x982D, 0xCFFC, 0x9A2D, 0xCFFA`.
- 25 % PWM on D13 with `dec`/`brne` delay loops, ADC read to PORTB, and LCD E-pulse taps: see `timeline.test.ts`.

## Check your encoding

A wrong word usually shows up as a pin that never changes. Before trusting a test, step it: `board.run(ms)` and read `board.output(pin)` (`board.input(pin, level)` drives a pin); decode a doubtful word by re-deriving the formula above. Three of the first hand encodings in this repo were wrong (an LDI and a BRNE) and only the failing test caught them — always assert a value that would differ if the program didn't run.
