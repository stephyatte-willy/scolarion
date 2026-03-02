'use client';

import { useEffect } from 'react';

interface ModalConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

export default function ModalConfirmation({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Oui',
  cancelText = 'Non'
}: ModalConfirmationProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div className="modal-simple-overlay" onClick={handleOverlayClick}>
      <div className="modal-simple-content">
        <div className="modal-simple-header">
          <h3 className="modal-simple-title">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="modal-simple-close"
          >
            ×
          </button>
        </div>
        
        <div className="modal-simple-body">
          <p>{message}</p>
        </div>
        
        <div className="modal-simple-footer">
          <button
            type="button"
            onClick={onClose}
            className="modal-simple-cancel"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="modal-simple-confirm"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}