'use client';

import { useEffect } from 'react';
import './ModalSuppression.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  type?: 'danger' | 'warning' | 'info';
  itemName?: string;
  isLoading?: boolean;
}

export default function ModalSuppression({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation',
  message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  type = 'danger',
  itemName = '',
  isLoading = false
}: Props) {
  // Gestion de la touche Escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  // Configuration par type
  const getTypeConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: '⚠️',
          buttonClass: 'warning'
        };
      case 'info':
        return {
          icon: 'ℹ️',
          buttonClass: 'info'
        };
      default: // danger
        return {
          icon: '🗑️',
          buttonClass: 'danger'
        };
    }
  };

  const config = getTypeConfig();

  return (
    <div className="modal-overlay" onClick={!isLoading ? onClose : undefined}>
      <div 
        className="modal-suppression" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="en-tete-modal">
          <h3>{title}</h3>
          <button 
            className="bouton-fermer-modal" 
            onClick={onClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>
        
        <div className="contenu-modal">
          <div className={`icone-type ${type}`}>
            {config.icon}
          </div>
          <p>{message}</p>
          {itemName && (
            <div className="item-a-supprimer">
              <strong>{itemName}</strong>
            </div>
          )}
        </div>
        
        <div className="pied-modal">
          <button 
            className="bouton-annuler" 
            onClick={onClose} 
            disabled={isLoading}
          >
            Annuler
          </button>
          <button 
            className={`bouton-fermer-complet ${config.buttonClass}`}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner-mini"></span>
                Suppression...
              </>
            ) : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}