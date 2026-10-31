import React, { memo, useEffect, useState } from 'react';
import { Position, NodeProps } from '@xyflow/react';
import { Volume2, VolumeX } from 'lucide-react';
import { NodeData } from '../../types/circuit';
import { Pin } from './Pin';
import { Lead, PartLabel, PartSvg } from './partKit';

const W = 75;
const H = 45;
/** An active buzzer's own tone when the input is simply high. */
const OWN_TONE_HZ = 2300;

let audio: AudioContext | null = null;

/**
 * Buzzer: sounds while its input is 1, at the frequency the wire carries (tone() on a board, a clock),
 * else at its own tone. Sound stays off until turned on here, so a circuit never beeps unexpectedly.
 */
export const BuzzerNode: React.FC<NodeProps> = memo(({ data: nodeData }) => {
  const data = nodeData as unknown as NodeData;
  const input = data.inputs?.[0];
  const sounding = input?.value === 1;
  const freq = input?.freq && input.freq >= 20 ? Math.min(input.freq, 12000) : OWN_TONE_HZ;
  const [soundOn, setSoundOn] = useState(false);

  useEffect(() => {
    if (!soundOn || !sounding) return;
    audio ??= new AudioContext();
    void audio.resume();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.value = 0.04;
    osc.connect(gain).connect(audio.destination);
    osc.start();
    return () => {
      osc.stop();
      osc.disconnect();
    };
  }, [soundOn, sounding, freq]);

  return (
    <div className="lsp-schematic relative" style={{ width: W, height: H }}>
      <PartLabel text={data.label} />
      <PartSvg width={W} height={H}>
        <Lead x1={0} x2={14} y={15} value={input?.value} />
        <circle cx={34} cy={22} r={20} fill="#1c1d20" stroke="#3d4046" strokeWidth={1.5} />
        <circle cx={34} cy={22} r={4} fill="#050505" />
        <text x={20} y={14} fontSize={9} fill="#d0d3d8" fontWeight={700}>+</text>
        {sounding &&
          [8, 13].map((r) => (
            <path key={r} d={`M${56 + r / 2} ${22 - r} Q${60 + r} 22 ${56 + r / 2} ${22 + r}`} fill="none" stroke="var(--signal-high)" strokeWidth={1.5} />
          ))}
      </PartSvg>
      <button
        type="button"
        onClick={() => setSoundOn(!soundOn)}
        aria-pressed={soundOn}
        aria-label={soundOn ? 'Mute buzzer' : 'Turn buzzer sound on'}
        title={soundOn ? 'Sound on' : 'Sound off: click to hear it'}
        className="nodrag absolute -bottom-5 left-[24px] p-0.5 rounded text-fg-subtle hover:text-fg"
      >
        {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
      </button>
      {sounding && (
        <span className="absolute -bottom-5 left-[44px] text-[10px] font-mono text-fg-subtle whitespace-nowrap">
          {Math.round(freq)} Hz
        </span>
      )}
      <Pin type="target" position={Position.Left} id="in-0" value={input?.value} label="Buzzer +" style={{ top: 15 }} />
    </div>
  );
});

BuzzerNode.displayName = 'BuzzerNode';
