import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog } from './Dialog';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}) => (
  <Dialog
    isOpen={isOpen}
    onClose={onCancel}
    title={title}
    maxWidth="sm"
    icon={destructive ? <AlertTriangle className="w-4 h-4" /> : undefined}
    footer={
      <>
        <Button variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'danger' : 'primary'}
          onClick={onConfirm}
          data-autofocus
          className={destructive ? '!bg-rose-600 hover:!bg-rose-700 !text-on-accent !border-transparent' : ''}
        >
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div className="text-sm text-fg-muted leading-relaxed">{message}</div>
  </Dialog>
);
