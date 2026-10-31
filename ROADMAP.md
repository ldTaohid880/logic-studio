# Roadmap

Logic Studio is one app for beginners and advanced students alike. There is no beginner/advanced mode: advanced tools appear when a student uses the part or view that needs them (add a clock and the run controls and timing diagram appear; add a board and its program panel appears). Defaults never change what a beginner sees, and the golden tests on the built-in examples guard that.

## Done

- **Correct, trustworthy simulation:** circuits that never settle are detected and outlined; files are validated on open; every chip is tested against a reference model.
- **Circuit truth table:** click a row to set the switches, memory start options, and a simplified expression (Quine–McCluskey) for each output.
- **Clock, run controls and timing diagram:** run, pause, step one clock edge, restart, speed; waveforms of clocks, inputs, sensors and outputs; VCD export for GTKWave.
- **Sequential and memory parts:** 4-bit counter, shift register, ALU, 16 × 4 RAM and an editable ROM.
- **Uno-compatible board:** runs a compiled sketch (`.hex` from the Arduino IDE) on an emulated ATmega328P; two-way header pins D2–D13 and A0–A5; serial monitor.
- **Sensors:** light, temperature, obstacle and motion modules with a digital output and adjustable threshold.
- **Realistic parts:** chips drawn as DIP packages; slide switch, tactile button, DIP switch, oscillator can and display modules drawn like the real components.
- **Core parts:** D flip-flop with preset and clear, SR latch, 2:1 multiplexer.
- **Shared bus wires:** several tri-state outputs (or board pins) can drive one input; disagreeing drivers are shown as a conflict.
- **Karnaugh maps:** a K-map for each output (2–4 inputs) in the circuit truth table, with every group of the simplified expression outlined.
- **Build a circuit from an expression or truth table:** AND/OR/NOT, NAND-only or NOR-only, with the gate count and logic levels of each.
- **Watch any wire** in the timing diagram, like a logic analyser probe.
- **Gate delays:** optional delay per gate, so static hazards glitch and ring oscillators run (Static hazard example).
- **Pull-up and pull-down resistors** and an open-drain buffer (wired AND).
- **Check my circuit:** expected outputs as expressions, saved with the circuit; the truth table marks rows that differ.
- **Multi-bit buses:** bus joiner and splitter (2, 4 or 8 bits), bus wires with their value in hex.
- **Industry-standard parts:** 74HC161 counter with load, 74HC160 decade counter, 74HC194 universal shift register, 74HC154 4-to-16 decoder, 74HC273 8-bit register, 74HC373 8-bit latch with tri-state outputs.
- **Circuit statistics:** gates by type, chips, logic levels and the longest path (selectable on the canvas).
- **Export and projects:** SVG and PDF export, a parts list packed into real chips (CSV), several autosaved projects.
- **Arduino extras:** analogRead from sensor AO pins and a potentiometer, analogWrite (PWM dims LEDs), tone and a buzzer, a 16 × 2 LCD that works with LiquidCrystal.
- **Share links and Verilog export.**
- **Datasheets for every part:** a wide reader with real pinouts, function tables made from the simulation, 74HC electrical and timing figures, print/PDF and `#datasheet=` links.
- **Agent-friendly project:** lean CLAUDE.md with topic rules loaded by path, runbooks for common tasks, a review agent, and project conventions checked automatically (`npm run lint:conventions`, CI and an edit hook).

## Next

### State machine designer
Draw states and transitions; the app builds the state table, the simplified next-state and output equations (with the existing minimiser) and the flip-flop circuit.

### Timing lessons
Different delays per gate type and highlighting the critical path (unit gate delays are done).

### More from buses
Bus pins on RAM, ROM, registers, the ALU and displays, bus tunnels, and tri-state bus drivers, so wide data paths need fewer splitters. Sequential test vectors for "check my circuit" (clocked steps, not just a truth table).

## Later

### Programming the board inside the app
A code editor on the board. Compiling Arduino code needs a server (the compiler doesn't run in the browser), so this comes after `.hex` loading has proved useful. A smaller alternative is a simplified Arduino language interpreted in the browser.

### More boards and parts
- Nano (same chip as the Uno, so nearly free) and later Mega.
- Motion sensor hold time, ultrasonic distance sensor (needs microsecond timing), buzzer, servo and stepper outputs.
- PWM shown as a duty cycle rather than flicker.

### Arduino: testing with real sketches
The board features are tested with hand-assembled programs; testing with sketches compiled by the Arduino IDE (blink, analogRead, fade, LiquidCrystal, tone) still needs doing, ideally as fixtures in the test suite.

### Verilog behaviour for more chips
Behavioural Verilog for counters, shift registers, registers and the ALU (they export as empty "black box" modules today), and bus pins as vectors.

### Classroom
Read-only exercise files with instructions for teachers (expected outputs and share links are done).

### Quality and reach
- End-to-end browser tests in CI, ESLint, and versioned file migrations.
- First-run onboarding tour, offline support (PWA), accessibility pass and bundle size work.
