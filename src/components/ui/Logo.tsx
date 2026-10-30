import React from 'react';

/** Logic Studio mark: an AND gate whose output is high. Same drawing as public/favicon.svg. */
export const Logo: React.FC<{ className?: string; title?: string }> = ({ className, title }) => (
  <svg viewBox="0 0 32 32" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
    {title && <title>{title}</title>}
    <rect width="32" height="32" rx="8" fill="#3b5bdb" />
    <g fill="none" strokeLinecap="round" strokeWidth="2.4">
      <path d="M5 12.5h5M5 19.5h5" stroke="#c7d2fe" />
      <path d="M10 8.5h5.5a7.5 7.5 0 0 1 0 15H10z" stroke="#fff" strokeLinejoin="round" fill="#3b5bdb" />
      <path d="M23 16h4" stroke="#4ade80" />
    </g>
    <circle cx="27" cy="16" r="1.9" fill="#4ade80" />
  </svg>
);
