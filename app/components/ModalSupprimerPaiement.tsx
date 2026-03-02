'use client';

import { useState } from 'react';

interface ModalSupprimerPaiementProps {
  isOpen: boolean;
  onClose: () => void;
  paiement: any;
  onSuccess: () => void;
}

export default function ModalSupprimerPaiement({ 
  isOpen, 
  onClose, 
  paiement,
  onSuccess 
}: ModalSupprimerPaiementProps) {
  const [loading, setLoading] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  if (!isOpen) return null;
  
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant);
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };
  
  const handleDelete = async () => {
    if (confirmationText !== 'SUPPRIMER') {
      setError('Veuillez écrire "SUPPRIMER" en majuscules pour confirmer');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/finance/paiements/${paiement.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Paiement supprimé avec succès');
        onSuccess();
        onClose();
      } else {
        setError(data.erreur || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      setError('Erreur réseau: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateImpact = () => {
    const montantTotal = paiement.montant_total || paiement.montant;
    const montantPaye = paiement.montant_paye || 0;
    const nouveauMontantPaye = Math.max(0, montantPaye - paiement.montant);
    
    let nouveauStatut = 'en_attente';
    if (nouveauMontantPaye <= 0) {
      nouveauStatut = 'en_attente';
    } else if (nouveauMontantPaye >= montantTotal) {
      nouveauStatut = 'paye';
    } else {
      nouveauStatut = 'partiel';
    }
    
    return { nouveauMontantPaye, nouveauStatut };
  };
  
  const impact = calculateImpact();
  
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>🗑️ Supprimer le paiement #{paiement.numero_recu || paiement.id}</h3>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        
        <div style={styles.content}>
          <div style={styles.warning}>
            <div style={styles.warningIcon}>⚠️</div>
            <div style={styles.warningContent}>
              <h4 style={styles.warningTitle}>Attention ! Cette action est irréversible</h4>
              <p style={styles.warningText}>
                Voulez-Vous Vraiment supprimer ce paiement ?
              </p>
            </div>
          </div>
          
          <div style={styles.details}>
            <div style={styles.detailsGrid}>
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Date:</label>
                <span style={styles.detailValue}>{formatDate(paiement.date_paiement)}</span>
              </div>
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Élève:</label>
                <span style={styles.detailValue}>{paiement.eleve_prenom} {paiement.eleve_nom}</span>
              </div>
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Matricule:</label>
                <span style={styles.detailValue}>{paiement.eleve_matricule}</span>
              </div>
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Classe:</label>
                <span style={styles.detailValue}>{paiement.classe_niveau} {paiement.classe_nom}</span>
              </div>
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Montant:</label>
                <span style={{...styles.detailValue, color: '#dc2626', fontWeight: 'bold'}}>
                  {formatMontant(paiement.montant)} FCFA
                </span>
              </div>
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Catégorie:</label>
                <span style={styles.detailValue}>{paiement.categorie_nom}</span>
              </div>
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Mode:</label>
                <span style={styles.detailValue}>{paiement.mode_paiement}</span>
              </div>
              <div style={styles.detailItem}>
                <label style={styles.detailLabel}>Numéro reçu:</label>
                <span style={styles.detailValue}>#{paiement.numero_recu || paiement.id}</span>
              </div>
            </div>
          </div>
          
          <div style={styles.confirmation}>
            <p style={styles.confirmationText}>
              Pour confirmer la suppression, veuillez écrire <strong>SUPPRIMER</strong> en majuscules dans le champ ci-dessous :
            </p>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => {
                setConfirmationText(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Écrivez SUPPRIMER ici"
              style={styles.confirmationInput}
              autoComplete="off"
              spellCheck="false"
            />
            {error && <div style={styles.error}>{error}</div>}
          </div>
        </div>
        
        <div style={styles.footer}>
          <button 
            onClick={onClose}
            style={styles.cancelButton}
            disabled={loading}
          >
            Annuler
          </button>
          <button 
            onClick={handleDelete}
            disabled={loading || confirmationText !== 'SUPPRIMER'}
            style={{
              ...styles.deleteButton,
              opacity: (loading || confirmationText !== 'SUPPRIMER') ? 0.6 : 1,
              cursor: (loading || confirmationText !== 'SUPPRIMER') ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Suppression en cours...' : 'Confirmer la suppression'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1002
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '600px',
    maxWidth: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as 'column'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
    background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
    color: 'white',
    borderRadius: '12px 12px 0 0'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600
  },
  closeButton: {
    position: 'absolute' as 'absolute',
    top: '15px',
    right: '15px',
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    padding: '20px',
    overflowY: 'auto' as 'auto',
    flex: 1
  },
  warning: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '20px',
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  warningIcon: {
    fontSize: '2rem',
    marginRight: '15px',
    color: '#92400e'
  },
  warningContent: {
    flex: 1
  },
  warningTitle: {
    marginTop: 0,
    marginBottom: '10px',
    color: '#92400e',
    fontSize: '1.1rem'
  },
  warningText: {
    color: '#92400e',
    margin: 0,
    lineHeight: '1.6'
  },
  details: {
    marginBottom: '20px'
  },
  detailsTitle: {
    marginTop: 0,
    marginBottom: '15px',
    color: '#374151',
    fontSize: '1rem',
    fontWeight: 600
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px'
  },
  detailItem: {
    backgroundColor: '#f9fafb',
    padding: '12px',
    borderRadius: '6px',
    borderLeft: '3px solid #dc2626'
  },
  detailLabel: {
    display: 'block',
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '4px',
    fontWeight: 500
  },
  detailValue: {
    fontWeight: 500,
    color: '#111827',
    fontSize: '0.95rem'
  },
  impact: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  impactTitle: {
    marginTop: 0,
    marginBottom: '15px',
    color: '#0369a1',
    fontSize: '1rem',
    fontWeight: 600
  },
  impactGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '10px'
  },
  impactItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #e0f2fe'
  },
  impactItemLast: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0'
  },
  impactLabel: {
    fontSize: '0.875rem',
    color: '#475569',
    fontWeight: 500
  },
  impactValue: {
    fontWeight: 600,
    color: '#111827',
    fontSize: '0.95rem'
  },
  confirmation: {
    margin: '25px 0',
    padding: '20px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px'
  },
  confirmationText: {
    marginTop: 0,
    marginBottom: '15px',
    color: '#475569',
    lineHeight: '1.6'
  },
  confirmationInput: {
    width: '100%',
    padding: '12px',
    border: '2px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'monospace',
    textTransform: 'uppercase' as 'uppercase',
    transition: 'border-color 0.2s'
  },
  error: {
    color: '#dc2626',
    marginTop: '10px',
    fontSize: '0.875rem',
    fontWeight: 500
  },
  consequences: {
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '20px'
  },
  consequencesTitle: {
    marginTop: 0,
    marginBottom: '10px',
    color: '#374151',
    fontSize: '1rem',
    fontWeight: 600
  },
  consequencesList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#475569'
  },
  consequencesItem: {
    marginBottom: '8px',
    lineHeight: '1.5'
  },
  footer: {
    padding: '20px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px'
  },
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.875rem',
    minWidth: '100px'
  },
  deleteButton: {
    padding: '10px 24px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.875rem',
    minWidth: '100px'
  }
};