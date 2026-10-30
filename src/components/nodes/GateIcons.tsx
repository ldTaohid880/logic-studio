import React from 'react';
import { GateType } from '../../types/circuit';

interface GateIconProps {
  type: GateType;
  className?: string;
}

export const GateIcon: React.FC<GateIconProps> = ({ type, className = 'w-10 h-10' }) => {
  switch (type) {
    case 'AND':
      return (
        <svg viewBox="0 0 50 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* IEEE AND symbol */}
          <path d="M 10 5 L 25 5 C 36 5 36 35 25 35 L 10 35 Z" fill="currentColor" fillOpacity="0.15" />
        </svg>
      );

    case 'NAND':
      return (
        <svg viewBox="0 0 55 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* IEEE NAND symbol */}
          <path d="M 8 5 L 23 5 C 34 5 34 35 23 35 L 8 35 Z" fill="currentColor" fillOpacity="0.15" />
          <circle cx="43" cy="20" r="3.5" fill="#0f172a" />
        </svg>
      );

    case 'OR':
      return (
        <svg viewBox="0 0 50 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* IEEE OR symbol */}
          <path d="M 8 5 C 16 15 16 25 8 35 C 22 35 34 28 42 20 C 34 12 22 5 8 5 Z" fill="currentColor" fillOpacity="0.15" />
        </svg>
      );

    case 'NOR':
      return (
        <svg viewBox="0 0 55 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* IEEE NOR symbol */}
          <path d="M 6 5 C 14 15 14 25 6 35 C 20 35 32 28 40 20 C 32 12 20 5 6 5 Z" fill="currentColor" fillOpacity="0.15" />
          <circle cx="45" cy="20" r="3.5" fill="#0f172a" />
        </svg>
      );

    case 'NOT':
      return (
        <svg viewBox="0 0 45 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* IEEE NOT inverter symbol */}
          <path d="M 10 8 L 32 20 L 10 32 Z" fill="currentColor" fillOpacity="0.15" />
          <circle cx="36" cy="20" r="3.5" fill="#0f172a" />
        </svg>
      );

    case 'XOR':
      return (
        <svg viewBox="0 0 52 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* IEEE XOR symbol */}
          <path d="M 6 5 C 13 15 13 25 6 35" strokeWidth="2" />
          <path d="M 12 5 C 19 15 19 25 12 35 C 25 35 36 28 44 20 C 36 12 25 5 12 5 Z" fill="currentColor" fillOpacity="0.15" />
        </svg>
      );

    case 'XNOR':
      return (
        <svg viewBox="0 0 57 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          {/* IEEE XNOR symbol */}
          <path d="M 5 5 C 12 15 12 25 5 35" strokeWidth="2" />
          <path d="M 10 5 C 17 15 17 25 10 35 C 23 35 34 28 42 20 C 34 12 23 5 10 5 Z" fill="currentColor" fillOpacity="0.15" />
          <circle cx="47" cy="20" r="3.5" fill="#0f172a" />
        </svg>
      );

    case 'INPUT':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="10" width="30" height="20" rx="10" fill="currentColor" fillOpacity="0.15" />
          <circle cx="15" cy="20" r="6" fill="currentColor" />
        </svg>
      );

    case 'OUTPUT':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="20" cy="20" r="14" fill="currentColor" fillOpacity="0.15" />
          <path d="M 20 10 L 20 14 M 20 26 L 20 30 M 10 20 L 14 20 M 26 20 L 30 20" />
        </svg>
      );

    case 'SEVEN_SEGMENT':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="8" y="6" width="24" height="28" rx="4" fill="currentColor" fillOpacity="0.1" />
          <path d="M 14 10 L 26 10 M 26 10 L 26 19 M 26 21 L 26 30 M 14 30 L 26 30 M 14 21 L 14 30 M 14 10 L 14 19 M 14 20 L 26 20" />
        </svg>
      );

    case 'ENCODER':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="28" height="28" rx="6" fill="currentColor" fillOpacity="0.15" />
          <path d="M 12 12 L 20 20 L 12 28" />
          <path d="M 24 14 L 28 14 M 24 20 L 28 20 M 24 26 L 28 26" />
          <circle cx="20" cy="20" r="2" fill="currentColor" />
        </svg>
      );

    case 'BUFFER':
      return (
        <svg viewBox="0 0 45 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 10 8 L 36 20 L 10 32 Z" fill="currentColor" fillOpacity="0.15" />
        </svg>
      );

    case 'TRI_STATE_BUFFER':
      return (
        <svg viewBox="0 0 45 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 10 8 L 36 20 L 10 32 Z" fill="currentColor" fillOpacity="0.15" />
          <path d="M 23 4 L 23 13" strokeWidth="2" strokeDasharray="2 2" />
        </svg>
      );

    case 'PUSH_BUTTON':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="20" cy="20" r="13" fill="currentColor" fillOpacity="0.15" />
          <circle cx="20" cy="20" r="7" fill="currentColor" />
        </svg>
      );

    case 'DIP_SWITCH':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="6" y="8" width="28" height="24" rx="4" fill="currentColor" fillOpacity="0.15" />
          <rect x="10" y="12" width="6" height="16" rx="2" />
          <rect x="24" y="12" width="6" height="16" rx="2" />
          <line x1="13" y1="12" x2="13" y2="19" strokeWidth="3" />
          <line x1="27" y1="21" x2="27" y2="28" strokeWidth="3" />
        </svg>
      );

    case 'CONST_HIGH':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <rect x="6" y="8" width="28" height="24" rx="4" fill="currentColor" fillOpacity="0.15" />
          <text x="20" y="26" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="bold" fontFamily="monospace">1</text>
        </svg>
      );

    case 'CONST_LOW':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <rect x="6" y="8" width="28" height="24" rx="4" fill="currentColor" fillOpacity="0.15" />
          <text x="20" y="26" textAnchor="middle" fill="currentColor" fontSize="16" fontWeight="bold" fontFamily="monospace">0</text>
        </svg>
      );

    case 'LOGIC_PROBE':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="6" y="10" width="28" height="20" rx="4" fill="currentColor" fillOpacity="0.15" />
          <polyline points="10,20 16,14 22,26 28,20" strokeWidth="2.5" />
        </svg>
      );

    case 'HEX_DISPLAY':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="8" y="6" width="24" height="28" rx="4" fill="currentColor" fillOpacity="0.15" />
          <text x="20" y="27" textAnchor="middle" fill="currentColor" fontSize="18" fontWeight="bold" fontFamily="monospace">F</text>
        </svg>
      );

    case 'BUS_MONITOR':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <rect x="6" y="6" width="28" height="28" rx="4" fill="currentColor" fillOpacity="0.15" />
          <path d="M 11 14 H 29 M 11 20 H 29 M 11 26 H 29" strokeWidth="2" />
        </svg>
      );

    case 'HALF_SUBTRACTOR':
    case 'FULL_SUBTRACTOR':
    case 'MUX_4TO1':
    case 'DEMUX_1TO4':
    case 'PRIORITY_ENCODER':
    case 'COMPARATOR_4BIT':
    case 'DECODER_BCD_TO_7SEG':
    case 'D_LATCH':
    case 'JK_FLIPFLOP':
    case 'REGISTER_4BIT':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="28" height="28" rx="5" fill="currentColor" fillOpacity="0.15" />
          <path d="M 12 12 H 16 M 12 20 H 16 M 12 28 H 16" />
          <path d="M 24 12 H 28 M 24 20 H 28 M 24 28 H 28" />
        </svg>
      );

    case 'HALF_ADDER':
    case 'FULL_ADDER':
    case 'ADDER_4BIT':
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="6" width="28" height="28" rx="6" fill="#10b981" fillOpacity="0.2" stroke="#10b981" strokeWidth="2" />
          <path d="M 20 12 V 28 M 12 20 H 28" stroke="#10b981" strokeWidth="2.5" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 40 40" className={className} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="8" y="8" width="24" height="24" rx="4" fill="currentColor" fillOpacity="0.15" />
        </svg>
      );
  }
};
