import React, { useEffect, useState } from 'react';
import { Check, Copy, Link2 } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { useCircuitStore } from '../../store/useCircuitStore';
import { encodeShare, LONG_LINK, sharePayload } from '../../utils/shareLink';

/** A link that opens this circuit; the circuit travels inside the link, not through a server. */
export const ShareDialog: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) =>
  isOpen ? <Share onClose={onClose} /> : null;

const Share: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const { nodes, edges, customComponents, expected, hierarchyPath, rootCircuitState } = useCircuitStore.getState();
    // Share the whole circuit, even while a sub-circuit is open
    const root = hierarchyPath.length > 1 && rootCircuitState ? rootCircuitState : { nodes, edges };
    encodeShare(sharePayload(root.nodes, root.edges, customComponents, expected)).then((hash) =>
      setLink(`${window.location.origin}${window.location.pathname}${hash}`)
    );
  }, []);

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog
      isOpen
      onClose={onClose}
      title="Share link"
      description="Anyone with this link can open a copy of the circuit. The circuit is stored inside the link itself, not on a server."
      icon={<Link2 className="w-4 h-4" />}
      maxWidth="lg"
      footer={
        <Button variant="primary" disabled={!link} leftIcon={copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} onClick={copy}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      }
    >
      <div className="space-y-2">
        <input
          readOnly
          value={link ?? 'Making the link…'}
          onFocus={(e) => e.target.select()}
          aria-label="Share link"
          className="w-full rounded-lg border border-line bg-surface-0 px-3 py-2 font-mono text-xs text-fg-muted focus:outline-none focus:border-accent"
        />
        {link && (
          <p className={`text-xs ${link.length > LONG_LINK ? 'text-signal-unknown' : 'text-fg-subtle'}`}>
            {link.length.toLocaleString()} characters.
            {link.length > LONG_LINK
              ? ' Some chat apps and email cut long links; if it doesn’t open, use File → Save as JSON and send the file.'
              : ' Expected outputs and custom components go with it.'}
          </p>
        )}
      </div>
    </Dialog>
  );
};
