'use client';

interface ModalDetailsPaiementProps {
  isOpen: boolean;
  onClose: () => void;
  paiement: any;
  details?: any;
}

export default function ModalDetailsPaiement({ 
  isOpen, 
  onClose, 
  paiement,
  details 
}: ModalDetailsPaiementProps) {
  
  if (!isOpen) return null;
  
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant);
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };
  
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>📋 Détails du paiement #{paiement?.numero_recu || paiement?.id}</h3>
          <button onClick={onClose} style={styles.closeButton}>×</button>
        </div>
        
        <div style={styles.content}>
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Informations générales</h4>
            <div style={styles.grid}>
              <div style={styles.infoCard}>
                <label style={styles.label}>Date de paiement</label>
                <span style={styles.value}>{formatDate(paiement.date_paiement)}</span>
              </div>
              <div style={styles.infoCard}>
                <label style={styles.label}>Montant payé</label>
                <span style={{...styles.value, color: '#059669', fontWeight: 'bold'}}>
                  {formatMontant(paiement.montant)} FCFA
                </span>
              </div>
              <div style={styles.infoCard}>
                <label style={styles.label}>Mode de paiement</label>
                <span style={{
                  ...styles.badge,
                  backgroundColor: '#dbeafe',
                  color: '#1e40af'
                }}>
                  {paiement.mode_paiement}
                </span>
              </div>
              <div style={styles.infoCard}>
                <label style={styles.label}>Statut</label>
                <span style={{
                  ...styles.badge,
                  backgroundColor: paiement.statut_paiement === 'paye' ? '#d1fae5' : '#fef3c7',
                  color: paiement.statut_paiement === 'paye' ? '#065f46' : '#92400e'
                }}>
                  {paiement.statut_paiement || paiement.statut}
                </span>
              </div>
            </div>
          </div>
          
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Informations élève</h4>
            <div style={styles.grid}>
              <div style={styles.infoCard}>
                <label style={styles.label}>Nom complet</label>
                <span style={styles.value}>{paiement.eleve_prenom} {paiement.eleve_nom}</span>
              </div>
              <div style={styles.infoCard}>
                <label style={styles.label}>Matricule</label>
                <span style={styles.value}>{paiement.eleve_matricule}</span>
              </div>
              <div style={styles.infoCard}>
                <label style={styles.label}>Classe</label>
                <span style={styles.value}>{paiement.classe_niveau} {paiement.classe_nom}</span>
              </div>
              <div style={styles.infoCard}>
                <label style={styles.label}>Année scolaire</label>
                <span style={styles.value}>{paiement.annee_scolaire}</span>
              </div>
            </div>
          </div>
          
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>Informations frais</h4>
            <div style={styles.grid}>
              <div style={styles.infoCard}>
                <label style={styles.label}>Catégorie</label>
                <span style={styles.value}>{paiement.categorie_nom}</span>
              </div>
              <div style={styles.infoCard}>
                <label style={styles.label}>Montant total</label>
                <span style={styles.value}>{formatMontant(paiement.montant_total)} FCFA</span>
              </div>
              <div style={styles.infoCard}>
                <label style={styles.label}>Déjà payé</label>
                <span style={styles.value}>{formatMontant(paiement.montant_paye)} FCFA</span>
              </div>
              <div style={styles.infoCard}>
                <label style={styles.label}>Reste à payer</label>
                <span style={{...styles.value, color: '#dc2626', fontWeight: 'bold'}}>
                  {formatMontant(paiement.montant_total - paiement.montant_paye)} FCFA
                </span>
              </div>
            </div>
            
            {paiement.reste_a_payer > 0 && (
              <div style={styles.alert}>
                <strong>Reste à payer :</strong> {formatMontant(paiement.reste_a_payer)} FCFA
              </div>
            )}
          </div>
          
          <div style={styles.footer}>
            <button onClick={onClose} style={styles.button}>
              Fermer
            </button>
          </div>
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
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '800px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column' as 'column'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
    borderBottom: '1px solid #e5e7eb',
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    color: 'white',
    borderRadius: '12px 12px 0 0'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    color: 'white',
    fontSize: '1.5rem',
    cursor: 'pointer',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  content: {
    padding: '30px',
    overflowY: 'auto' as 'auto',
    flex: 1
  },
  section: {
    marginBottom: '30px',
    paddingBottom: '25px',
    borderBottom: '1px solid #e5e7eb'
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: '20px',
    color: '#374151',
    fontSize: '1.1rem',
    fontWeight: 600
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '15px'
  },
  infoCard: {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '15px',
    borderLeft: '4px solid #4f46e5'
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    color: '#6b7280',
    marginBottom: '6px',
    fontWeight: 500
  },
  value: {
    display: 'block',
    fontWeight: 500,
    color: '#111827',
    fontSize: '1rem'
  },
  badge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: 600,
    textTransform: 'capitalize' as 'capitalize'
  },
  alert: {
    background: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '8px',
    padding: '15px',
    marginTop: '20px',
    color: '#92400e',
    fontWeight: 500
  },
  footer: {
    padding: '20px 0 0 0',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  button: {
    padding: '10px 24px',
    background: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 500,
    cursor: 'pointer'
  }
};