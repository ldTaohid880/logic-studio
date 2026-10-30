# Roadmap

Logic Studio is one app for beginners and advanced students alike. There is no beginner/advanced mode: advanced tools appear when a student uses the part or view that needs them (add a clock and the run controls and timing diagram appear; add a board and its program panel appears). Defaults never change what a beginner sees, and the golden tests on the built-in examples guard that.

## Done

- **Correct, trustworthy simulation:** circuits that never settle are detected and outlined; files are validated on open; every chip is tested against a reference model.
- **Circuit truth table:** click a row to set the switches, memory start options, and a simplified expression (Quine–McCluskey) for each output.
- **Clock, run controls and timing diagram:** run, pause, step one clock edge, restart, speed; waveforms of clocks, inputs, sensors and outputs; VCD export for GTKWave.
- **Sequential and memory parts:** 4-bit counter, shift register, ALU, 16 × 4 RAM and an editable ROM.
- **Uno-compatible board:** runs a compiled sketch (`.hex` from the Arduino IDE) on an emulated ATmega328P; two-way header pins D2–D13 and A0–A5; serial monitor.
- **Sensors:** light, temperature, obstacle and motion modules with a digital output and adjustable threshold.

## Next

### Check my circuit
Give a target truth table, or a list of test inputs and expected outputs, and the app runs them and shows which rows fail. Starts from the truth table dialog ("Save as test"). Works for assignments and self-study.

### State machine designer
Draw states and transitions; the app builds the state table, the simplified next-state and output equations (with the existing minimiser) and the flip-flop circuit.

### Analog sensors and `analogRead`
Feed sensor readings into the board's ADC so sketches can use `analogRead` on A0–A5 and the sensors' real values, not just their thresholded digital output. Possibly a potentiometer part.

### Timing lessons
Optional gate delays (default 0, so nothing changes for beginners) to show propagation delay, the critical path and glitches (hazards) in the timing diagram. Needs an event-driven engine mode.

### Multi-bit buses
Wires that carry 4 or 8 bits with a visible width, splitters and joiners, and floating (Z) versus conflicting (X) values kept apart. Lets RAM, ROM, registers and the ALU take buses instead of separate bit pins.

## Later

### Programming the board inside the app
A code editor on the board. Compiling Arduino code needs a server (the compiler doesn't run in the browser), so this comes after `.hex` loading has proved useful. A smaller alternative is a simplified Arduino language interpreted in the browser.

### More boards and parts
- Nano (same chip as the Uno, so nearly free) and later Mega.
- Motion sensor hold time, ultrasonic distance sensor (needs microsecond timing), buzzer, servo and stepper outputs.
- PWM shown as a duty cycle rather than flicker.

### Verilog export
Export a circuit as structural Verilog for FPGA courses.

### Classroom and sharing
- Share a circuit as a link.
- Read-only exercise files with instructions and checks for teachers.

### Quality and reach
- End-to-end browser tests in CI, ESLint, and versioned file migrations.
- First-run onboarding tour, offline support (PWA), accessibility pass and bundle size work.
