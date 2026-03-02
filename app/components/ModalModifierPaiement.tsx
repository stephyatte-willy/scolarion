'use client';

import { useState, useEffect } from 'react';

interface ModalModifierPaiementProps {
  isOpen: boolean;
  onClose: () => void;
  paiement: any;
  onSuccess: () => void;
}

export default function ModalModifierPaiement({ 
  isOpen, 
  onClose, 
  paiement,
  onSuccess 
}: ModalModifierPaiementProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // États du formulaire
  const [formData, setFormData] = useState({
    montant: 0,
    date_paiement: '',
    mode_paiement: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte' | 'mobile' | 'autre',
    reference_paiement: '',
    notes: '',
    statut: 'paye' as 'paye' | 'en_attente'
  });
  
  // Initialiser les données du formulaire
  useEffect(() => {
    if (paiement) {
      setFormData({
        montant: paiement.montant || 0,
        date_paiement: paiement.date_paiement || new Date().toISOString().split('T')[0],
        mode_paiement: paiement.mode_paiement || 'especes',
        reference_paiement: paiement.reference_paiement || '',
        notes: paiement.notes || '',
        statut: paiement.statut_paiement || paiement.statut || 'paye'
      });
      setError(null);
      setSuccess(false);
    }
  }, [paiement]);
  
  if (!isOpen) return null;
  
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant);
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'montant') {
      // Valider que le montant est un nombre positif
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      } else if (value === '') {
        setFormData(prev => ({ ...prev, [name]: 0 }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    setError(null);
  };
  
  const validateForm = (): boolean => {
    // Validation du montant
    if (formData.montant <= 0) {
      setError('Le montant doit être supérieur à 0');
      return false;
    }
    
    // Validation de la date
    if (!formData.date_paiement) {
      setError('La date de paiement est requise');
      return false;
    }
    
    // Vérifier si le montant ne dépasse pas le montant total
    if (paiement.montant_total && formData.montant > paiement.montant_total) {
      setError(`Le montant ne peut pas dépasser ${formatMontant(paiement.montant_total)} FCFA`);
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // En production, utilisez cette API
      const response = await fetch(`/api/finance/paiements/${paiement.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.erreur || 'Erreur lors de la modification');
      }
      
      setSuccess(true);
      
      // Fermer la modale après 2 secondes et rafraîchir
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
      
    } catch (error: any) {
      setError(error.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReset = () => {
    setFormData({
      montant: paiement.montant || 0,
      date_paiement: paiement.date_paiement || new Date().toISOString().split('T')[0],
      mode_paiement: paiement.mode_paiement || 'especes',
      reference_paiement: paiement.reference_paiement || '',
      notes: paiement.notes || '',
      statut: paiement.statut_paiement || paiement.statut || 'paye'
    });
    setError(null);
  };
  
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>✏️ Modifier le paiement #{paiement.numero_recu || paiement.id}</h3>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        
        <div style={styles.content}>
          {success ? (
            <div style={styles.successMessage}>
              <div style={styles.successIcon}>✅</div>
              <h4>Modification réussie !</h4>
              <p>Le paiement a été modifié avec succès.</p>
              <p>Fermeture automatique dans 2 secondes...</p>
            </div>
          ) : (
            <>
              {/* Résumé du paiement */}
              <div style={styles.summary}>
                <h4 style={styles.summaryTitle}>Résumé du paiement original</h4>
                <div style={styles.summaryGrid}>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Élève:</span>
                    <span style={styles.summaryValue}>{paiement.eleve_prenom} {paiement.eleve_nom}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Classe:</span>
                    <span style={styles.summaryValue}>{paiement.classe_niveau} {paiement.classe_nom}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Catégorie:</span>
                    <span style={styles.summaryValue}>{paiement.categorie_nom}</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Montant total:</span>
                    <span style={styles.summaryValue}>{formatMontant(paiement.montant_total)} FCFA</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Déjà payé:</span>
                    <span style={styles.summaryValue}>{formatMontant(paiement.montant_paye)} FCFA</span>
                  </div>
                  <div style={styles.summaryItem}>
                    <span style={styles.summaryLabel}>Reste à payer:</span>
                    <span style={{...styles.summaryValue, color: '#dc2626'}}>
                      {formatMontant(paiement.montant_total - paiement.montant_paye)} FCFA
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Formulaire de modification */}
              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.formGrid}>
                  {/* Montant */}
                  <div style={styles.formGroup}>
                    <label htmlFor="montant" style={styles.label}>
                      Montant (FCFA) *
                    </label>
                    <input
                      type="number"
                      id="montant"
                      name="montant"
                      value={formData.montant}
                      onChange={handleInputChange}
                      min="0"
                      step="100"
                      required
                      style={styles.input}
                    />
                    <div style={styles.hint}>
                      Montant original: {formatMontant(paiement.montant)} FCFA
                    </div>
                  </div>
                  
                  {/* Date de paiement */}
                  <div style={styles.formGroup}>
                    <label htmlFor="date_paiement" style={styles.label}>
                      Date de paiement *
                    </label>
                    <input
                      type="date"
                      id="date_paiement"
                      name="date_paiement"
                      value={formData.date_paiement}
                      onChange={handleInputChange}
                      required
                      style={styles.input}
                    />
                    <div style={styles.hint}>
                      Date originale: {formatDate(paiement.date_paiement)}
                    </div>
                  </div>
                  
                  {/* Mode de paiement */}
                  <div style={styles.formGroup}>
                    <label htmlFor="mode_paiement" style={styles.label}>
                      Mode de paiement *
                    </label>
                    <select
                      id="mode_paiement"
                      name="mode_paiement"
                      value={formData.mode_paiement}
                      onChange={handleInputChange}
                      required
                      style={styles.select}
                    >
                      <option value="especes">Espèces</option>
                      <option value="cheque">Chèque</option>
                      <option value="virement">Virement bancaire</option>
                      <option value="carte">Carte bancaire</option>
                      <option value="mobile">Mobile Money</option>
                      <option value="autre">Autre</option>
                    </select>
                    <div style={styles.hint}>
                      Mode original: {paiement.mode_paiement}
                    </div>
                  </div>
                  
                  {/* Statut */}
                  <div style={styles.formGroup}>
                    <label htmlFor="statut" style={styles.label}>
                      Statut *
                    </label>
                    <select
                      id="statut"
                      name="statut"
                      value={formData.statut}
                      onChange={handleInputChange}
                      required
                      style={styles.select}
                    >
                      <option value="paye">Payé</option>
                      <option value="en_attente">En attente</option>
                    </select>
                    <div style={styles.hint}>
                      Statut original: {paiement.statut_paiement || paiement.statut}
                    </div>
                  </div>
                  
                  {/* Référence */}
                  <div style={styles.formGroup}>
                    <label htmlFor="reference_paiement" style={styles.label}>
                      Référence
                    </label>
                    <input
                      type="text"
                      id="reference_paiement"
                      name="reference_paiement"
                      value={formData.reference_paiement}
                      onChange={handleInputChange}
                      placeholder="N° de chèque, référence virement..."
                      style={styles.input}
                    />
                    <div style={styles.hint}>
                      Référence originale: {paiement.reference_paiement || 'Aucune'}
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div style={{...styles.formGroup, gridColumn: '1 / -1'}}>
                    <label htmlFor="notes" style={styles.label}>
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Notes additionnelles..."
                      rows={3}
                      style={styles.textarea}
                    />
                    <div style={styles.hint}>
                      Notes originales: {paiement.notes || 'Aucune'}
                    </div>
                  </div>
                </div>
                
                {/* Aperçu des modifications */}
                <div style={styles.preview}>
                  <h5 style={styles.previewTitle}>Aperçu des modifications</h5>
                  <div style={styles.previewGrid}>
                    <div style={styles.previewItem}>
                      <span style={styles.previewLabel}>Ancien montant:</span>
                      <span style={styles.previewValue}>{formatMontant(paiement.montant)} FCFA</span>
                    </div>
                    <div style={styles.previewItem}>
                      <span style={styles.previewLabel}>Nouveau montant:</span>
                      <span style={{...styles.previewValue, color: '#059669'}}>
                        {formatMontant(formData.montant)} FCFA
                      </span>
                    </div>
                    <div style={styles.previewItem}>
                      <span style={styles.previewLabel}>Différence:</span>
                      <span style={{
                        ...styles.previewValue,
                        color: formData.montant > paiement.montant ? '#059669' : 
                               formData.montant < paiement.montant ? '#dc2626' : '#64748b'
                      }}>
                        {formatMontant(formData.montant - paiement.montant)} FCFA
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Message d'erreur */}
                {error && (
                  <div style={styles.errorMessage}>
                    <div style={styles.errorIcon}>❌</div>
                    <span>{error}</span>
                  </div>
                )}
                
                {/* Actions */}
                <div style={styles.actions}>
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    style={styles.cancelButton}
                  >
                    Annuler
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={loading}
                    style={styles.resetButton}
                  >
                    Réinitialiser
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading}
                    
                    style={styles.submitButton}
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
              
              {/* Informations de sécurité */}
              <div style={styles.securityInfo}>
                <div style={styles.securityIcon}>🔒</div>
                <div>
                  <strong>Note de sécurité:</strong> La modification d'un paiement est une opération sensible. 
                  Toutes les modifications sont enregistrées dans les logs du système pour traçabilité.
                </div>
              </div>
            </>
          )}
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
    zIndex: 1003
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '700px',
    maxWidth: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as 'column'
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    color: 'white',
    borderRadius: '12px 12px 0 0'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem'
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
    borderRadius: '50%'
  },
  content: {
    padding: '20px',
    overflowY: 'auto' as 'auto',
    flex: 1
  },
  
  /* Message de succès */
  successMessage: {
    textAlign: 'center' as 'center',
    padding: '40px 20px'
  },
  successIcon: {
    fontSize: '3rem',
    marginBottom: '20px'
  },
  
  /* Résumé */
  summary: {
    background: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  summaryTitle: {
    marginTop: 0,
    marginBottom: '15px',
    color: '#0369a1'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  summaryItem: {
    display: 'flex',
    flexDirection: 'column' as 'column'
  },
  summaryLabel: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '4px'
  },
  summaryValue: {
    fontWeight: 500,
    color: '#1e293b'
  },
  
  /* Formulaire */
  form: {
    marginTop: '20px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column' as 'column'
  },
  label: {
    fontSize: '0.875rem',
    color: '#374151',
    marginBottom: '8px',
    fontWeight: 500
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '1rem',
    transition: 'border-color 0.2s'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '1rem',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  textarea: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical' as 'vertical',
    minHeight: '80px'
  },
  hint: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: '5px',
    fontStyle: 'italic'
  },
  
  /* Aperçu */
  preview: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px'
  },
  previewTitle: {
    marginTop: 0,
    marginBottom: '15px',
    color: '#475569'
  },
  previewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  previewItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #e5e7eb'
  },
  previewLabel: {
    color: '#64748b'
  },
  previewValue: {
    fontWeight: 500
  },
  
  /* Messages d'erreur */
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontWeight: 500
  },
  errorIcon: {
    fontSize: '1.25rem'
  },
  
  /* Actions */
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '15px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb'
  },
  cancelButton: {
    padding: '10px 24px',
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  resetButton: {
    padding: '10px 24px',
    background: '#9ca3af',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  submitButton: {
    padding: '10px 24px',
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 500,
    cursor: 'pointer',
    fontSize: '0.875rem'
  },
  
  /* Informations de sécurité */
  securityInfo: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    background: '#fef3c7',
    border: '1px solid #fde68a',
    borderRadius: '8px',
    padding: '15px',
    marginTop: '20px',
    color: '#92400e'
  },
  securityIcon: {
    fontSize: '1.5rem',
    flexShrink: 0
  }
};