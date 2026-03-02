'use client';

import { useState, useEffect, useRef } from 'react';
import './GestionFinance.css';

// ... interfaces existantes ...

export default function ModalHistoriquePaiements({
  isOpen,
  onClose,
  eleveId,
  eleveNom,
  elevePrenom
}: ModalHistoriquePaiementsProps) {
  // ... états existants ...

  // Fonction améliorée pour générer le message de relance
  const genererMessageRelance = (data: {
    eleveNom: string;
    elevePrenom: string;
    classe: string;
    fraisRestants: Array<{categorie: string, montantRestant: number, periodicite?: string}>;
    montantTotalRestant: number;
    anneeScolaire: string;
  }) => {
    const aujourdhui = new Date();
    const moisSuivant = aujourdhui.getMonth() + 2 > 12 ? 1 : aujourdhui.getMonth() + 2;
    const anneeMoisSuivant = moisSuivant === 1 ? aujourdhui.getFullYear() + 1 : aujourdhui.getFullYear();
    const dateControle = `6/${moisSuivant < 10 ? '0' + moisSuivant : moisSuivant}/${anneeMoisSuivant}`;
    
    // Détail des frais formaté
    let detailsFrais = '';
    if (data.fraisRestants.length > 0) {
      detailsFrais = data.fraisRestants.map(f => {
        const periodicite = f.periodicite ? ` (${getPeriodiciteLibelle(f.periodicite)})` : '';
        return `• ${f.categorie}${periodicite} : ${formaterMontantFCFA(f.montantRestant)}`;
      }).join('\n');
    }
    
    // Coordonnées de l'école
    const coordonneesEcole = parametresEcole ? `
    
📞 ${parametresEcole.telephone || 'Non renseigné'}
📧 ${parametresEcole.email || 'Non renseigné'}
📍 ${parametresEcole.adresse || 'Non renseigné'}` : '';
    
    return `🏫 *${parametresEcole?.nom_ecole || 'Établissement Scolaire'}*
📋 *RELANCE DE PAIEMENT SCOLAIRE*

👨‍🎓 *ÉLÈVE CONCERNÉ(E)*
Nom : ${data.elevePrenom} ${data.eleveNom}
Classe : ${data.classe}
Année scolaire : ${data.anneeScolaire}

💰 *SITUATION FINANCIÈRE*
Montant total dû : *${formaterMontantFCFA(data.montantTotalRestant)}*

📋 *DÉTAIL DES FRAIS RESTANTS :*
${detailsFrais}

⏰ *ÉCHÉANCE IMPORTANTE*
Les contrôles de paiement s'effectuent à partir du *${dateControle}*.
*Tout élève non en règle sera interdit(e) d'accès aux salles de classe.*

💳 *MODES DE PAIEMENT ACCEPTÉS*
• Espèces à la comptabilité
• Virement bancaire
• Mobile Money
• Chèque

📞 *POUR TOUTE INFORMATION*
Vous pouvez nous contacter aux coordonnées suivantes :${coordonneesEcole}

─────────────────────
*MERCI DE RÉGULARISER VOTRE SITUATION DANS LES PLUS BREFS DÉLAIS.*

_Cordialement,_
*LA COMPTABILITÉ*
${parametresEcole?.nom_ecole || 'Établissement Scolaire'}`;
  };

  // Fonction WhatsApp corrigée
  const envoyerRelanceWhatsApp = () => {
    if (!relanceData || !relanceData.telephoneParent) {
      alert('Numéro de téléphone du parent non disponible');
      return;
    }
    
    // Nettoyer le numéro (supprimer les espaces et le +)
    const numeroPropre = relanceData.telephoneParent.replace(/[\s\+]/g, '');
    
    // Vérifier si le numéro commence par l'indicatif
    let numeroWhatsApp = numeroPropre;
    if (!numeroPropre.startsWith('221')) {
      // Ajouter l'indicatif Sénégal par défaut
      numeroWhatsApp = '221' + numeroPropre;
    }
    
    // Message avec encoding correct
    const message = messageRelance;
    
    // URL WhatsApp avec le bon format
    const url = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${encodeURIComponent(message)}`;
    
    // Ouvrir dans un nouvel onglet
    window.open(url, '_blank', 'noopener,noreferrer');
    
    // Optionnel: stocker la relance
    stockerRelance('whatsapp');
  };

  // Fonction pour stocker la relance
  const stockerRelance = async (methode: string) => {
    try {
      const response = await fetch('/api/finance/relances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eleve_id: eleveId,
          parent_telephone: relanceData?.telephoneParent,
          parent_email: relanceData?.emailParent,
          message: messageRelance,
          montant_du: relanceData?.montantTotalRestant,
          methode_envoi: methode,
          statut: 'envoye',
          envoye_par: 1 // À remplacer par l'ID de l'utilisateur connecté
        })
      });
      
      const data = await response.json();
      if (data.success) {
        console.log('Relance stockée avec succès');
      }
    } catch (error) {
      console.error('Erreur stockage relance:', error);
    }
  };

  // Modifier le JSX pour la modale de relance
  return (
    <>
      {/* Modale de relance améliorée */}
      {showModalRelance && relanceData && (
        <div className="overlay-modal-premium" onClick={() => setShowModalRelance(false)}>
          <div className="modal-premium modal-relance-enhanced" onClick={(e) => e.stopPropagation()}>
            {/* En-tête élégante */}
            <div className="modal-header-relance">
              <div className="header-gradient">
                <div className="header-content">
                  <div className="header-title">
                    <div className="title-icon">📬</div>
                    <div>
                      <h2>Envoyer une Relance de Paiement</h2>
                      <p className="subtitle">Communiquez avec le parent concernant les frais restants</p>
                    </div>
                  </div>
                  <button className="btn-close-relance" onClick={() => setShowModalRelance(false)}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Contenu principal avec onglets */}
            <div className="relance-tabs">
              <button className={`relance-tab ${true ? 'active' : ''}`}>
                <span className="tab-icon">✉️</span>
                <span className="tab-label">Message</span>
              </button>
              <button className="relance-tab">
                <span className="tab-icon">👤</span>
                <span className="tab-label">Destinataire</span>
              </button>
              <button className="relance-tab">
                <span className="tab-icon">💳</span>
                <span className="tab-label">Paiement</span>
              </button>
            </div>

            <div className="modal-content-relance">
              {/* Carte de résumé élégante */}
              <div className="summary-card-enhanced">
                <div className="summary-header">
                  <div className="summary-avatar">
                    <span className="avatar-initials">
                      {relanceData.elevePrenom.charAt(0)}{relanceData.eleveNom.charAt(0)}
                    </span>
                  </div>
                  <div className="summary-info">
                    <h3 className="eleve-name">{relanceData.elevePrenom} {relanceData.eleveNom}</h3>
                    <div className="eleve-details">
                      <span className="badge-classe">{relanceData.classe}</span>
                      <span className="separator">•</span>
                      <span className="badge-statut">
                        {relanceData.montantTotalRestant > 0 ? '⏳ En retard' : '✅ À jour'}
                      </span>
                    </div>
                  </div>
                  <div className="summary-amount">
                    <div className="amount-label">Montant dû</div>
                    <div className="amount-value">{formaterMontantFCFA(relanceData.montantTotalRestant)}</div>
                  </div>
                </div>
                
                <div className="summary-grid">
                  <div className="summary-item">
                    <div className="item-icon">📱</div>
                    <div className="item-content">
                      <div className="item-label">Téléphone</div>
                      <div className="item-value">{relanceData.telephoneParent || 'Non renseigné'}</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="item-icon">📧</div>
                    <div className="item-content">
                      <div className="item-label">Email</div>
                      <div className="item-value">{relanceData.emailParent || 'Non renseigné'}</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="item-icon">📅</div>
                    <div className="item-content">
                      <div className="item-label">Année scolaire</div>
                      <div className="item-value">{relanceData.anneeScolaire}</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="item-icon">📋</div>
                    <div className="item-content">
                      <div className="item-label">Frais en attente</div>
                      <div className="item-value">{relanceData.fraisRestants.length}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Éditeur de message amélioré */}
              <div className="message-editor-enhanced">
                <div className="editor-header">
                  <h3>Message de relance</h3>
                  <div className="editor-tools">
                    <button 
                      className="tool-btn copy" 
                      onClick={() => {
                        navigator.clipboard.writeText(messageRelance);
                        alert('Message copié dans le presse-papier !');
                      }}
                      title="Copier le message"
                    >
                      <span className="tool-icon">📋</span>
                      <span className="tool-text">Copier</span>
                    </button>
                    <button 
                      className="tool-btn reset" 
                      onClick={() => setMessageRelance(genererMessageRelance(relanceData))}
                      title="Réinitialiser le message"
                    >
                      <span className="tool-icon">🔄</span>
                      <span className="tool-text">Réinitialiser</span>
                    </button>
                    <button 
                      className="tool-btn preview" 
                      onClick={() => window.open(`data:text/plain;charset=utf-8,${encodeURIComponent(messageRelance)}`)}
                      title="Voir l'aperçu"
                    >
                      <span className="tool-icon">👁️</span>
                      <span className="tool-text">Aperçu</span>
                    </button>
                  </div>
                </div>
                
                <div className="editor-container">
                  <div className="editor-sidebar">
                    <div className="sidebar-title">Variables disponibles :</div>
                    <div className="variables-list">
                      <button className="variable-tag" onClick={() => {
                        const textarea = document.querySelector('.message-textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          const cursorPos = textarea.selectionStart;
                          const textBefore = messageRelance.substring(0, cursorPos);
                          const textAfter = messageRelance.substring(cursorPos);
                          setMessageRelance(textBefore + '{NOM_ELEVE}' + textAfter);
                        }
                      }}>
                        {relanceData.elevePrenom} {relanceData.eleveNom}
                      </button>
                      <button className="variable-tag" onClick={() => {
                        const textarea = document.querySelector('.message-textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          const cursorPos = textarea.selectionStart;
                          const textBefore = messageRelance.substring(0, cursorPos);
                          const textAfter = messageRelance.substring(cursorPos);
                          setMessageRelance(textBefore + '{CLASSE}' + textAfter);
                        }
                      }}>
                        {relanceData.classe}
                      </button>
                      <button className="variable-tag" onClick={() => {
                        const textarea = document.querySelector('.message-textarea') as HTMLTextAreaElement;
                        if (textarea) {
                          const cursorPos = textarea.selectionStart;
                          const textBefore = messageRelance.substring(0, cursorPos);
                          const textAfter = messageRelance.substring(cursorPos);
                          setMessageRelance(textBefore + '{MONTANT_TOTAL}' + textAfter);
                        }
                      }}>
                        {formaterMontantFCFA(relanceData.montantTotalRestant)}
                      </button>
                    </div>
                  </div>
                  
                  <div className="editor-main">
                    <textarea
                      className="message-textarea"
                      value={messageRelance}
                      onChange={(e) => setMessageRelance(e.target.value)}
                      rows={10}
                      placeholder="Votre message de relance..."
                    />
                    <div className="editor-footer">
                      <div className="char-count">
                        {messageRelance.length} caractères • {messageRelance.split(' ').length} mots
                      </div>
                      <div className="message-type">
                        <span className="type-badge whatsapp">Format WhatsApp</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Liste des frais restants */}
              <div className="frais-section">
                <div className="section-header">
                  <h3>Détail des frais restants</h3>
                  <div className="section-subtitle">Ces montants seront inclus dans la relance</div>
                </div>
                <div className="frais-grid">
                  {relanceData.fraisRestants.map((frais, index) => (
                    <div key={index} className="frais-card-enhanced">
                      <div className="frais-icon">
                        {frais.categorie.includes('Scolarité') ? '💰' : 
                         frais.categorie.includes('Cantine') ? '🍱' : 
                         frais.categorie.includes('Inscription') ? '📝' : '📋'}
                      </div>
                      <div className="frais-content">
                        <div className="frais-title">{frais.categorie}</div>
                        <div className="frais-details">
                          {frais.periodicite && (
                            <span className="detail-tag">{getPeriodiciteLibelle(frais.periodicite)}</span>
                          )}
                        </div>
                      </div>
                      <div className="frais-amount">
                        <div className="amount-due">{formaterMontantFCFA(frais.montantRestant)}</div>
                        <div className="amount-label">Reste à payer</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Méthodes d'envoi améliorées */}
              <div className="methods-section">
                <div className="section-header">
                  <h3>Méthodes d'envoi</h3>
                  <div className="section-subtitle">Choisissez comment envoyer la relance</div>
                </div>
                <div className="methods-grid-enhanced">
                  {relanceData.telephoneParent && (
                    <div className="method-card whatsapp" onClick={envoyerRelanceWhatsApp}>
                      <div className="method-icon">
                        <span className="icon-large">💚</span>
                      </div>
                      <div className="method-content">
                        <h4 className="method-title">WhatsApp</h4>
                        <p className="method-description">
                          Envoyer via WhatsApp Business avec message formaté
                        </p>
                        <div className="method-info">
                          <span className="info-item">📱 {relanceData.telephoneParent}</span>
                          <span className="info-item">⚡ Instantané</span>
                        </div>
                      </div>
                      <button className="method-action" onClick={envoyerRelanceWhatsApp}>
                        Envoyer
                        <span className="action-icon">➡️</span>
                      </button>
                    </div>
                  )}
                  
                  {relanceData.emailParent && (
                    <div className="method-card email" onClick={envoyerRelanceEmail}>
                      <div className="method-icon">
                        <span className="icon-large">📧</span>
                      </div>
                      <div className="method-content">
                        <h4 className="method-title">Email</h4>
                        <p className="method-description">
                          Envoyer un email professionnel avec pièce jointe
                        </p>
                        <div className="method-info">
                          <span className="info-item">✉️ {relanceData.emailParent}</span>
                          <span className="info-item">📎 Avec PDF</span>
                        </div>
                      </div>
                      <button className="method-action" onClick={envoyerRelanceEmail}>
                        Envoyer
                        <span className="action-icon">➡️</span>
                      </button>
                    </div>
                  )}
                  
                  <div className="method-card print" onClick={imprimerRelance}>
                    <div className="method-icon">
                      <span className="icon-large">🖨️</span>
                    </div>
                    <div className="method-content">
                      <h4 className="method-title">Imprimer</h4>
                      <p className="method-description">
                        Imprimer une version physique à remettre à l'élève
                      </p>
                      <div className="method-info">
                        <span className="info-item">📄 Format A4</span>
                        <span className="info-item">🏫 En-tête officielle</span>
                      </div>
                    </div>
                    <button className="method-action" onClick={imprimerRelance}>
                      Imprimer
                      <span className="action-icon">🖨️</span>
                    </button>
                  </div>
                  
                  {relanceData.telephoneParent && (
                    <div className="method-card sms" onClick={envoyerRelanceSMS}>
                      <div className="method-icon">
                        <span className="icon-large">📱</span>
                      </div>
                      <div className="method-content">
                        <h4 className="method-title">SMS</h4>
                        <p className="method-description">
                          Envoyer un SMS rapide avec le montant principal
                        </p>
                        <div className="method-info">
                          <span className="info-item">📱 {relanceData.telephoneParent}</span>
                          <span className="info-item">⚡ Rapide</span>
                        </div>
                      </div>
                      <button className="method-action" onClick={envoyerRelanceSMS}>
                        Envoyer
                        <span className="action-icon">➡️</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pied de page avec statistiques */}
            <div className="modal-footer-relance">
              <div className="footer-stats">
                <div className="stat-item">
                  <span className="stat-label">Destinataire</span>
                  <span className="stat-value">
                    {relanceData.telephoneParent ? '📱 Disponible' : '❌ Non disponible'}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Message</span>
                  <span className="stat-value">{messageRelance.length} caractères</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Statut</span>
                  <span className="stat-value ready">✅ Prêt à envoyer</span>
                </div>
              </div>
              <div className="footer-actions">
                <button className="btn-cancel" onClick={() => setShowModalRelance(false)}>
                  Annuler
                </button>
                <button className="btn-send-all" onClick={envoyerRelanceWhatsApp}>
                  <span className="btn-icon">🚀</span>
                  Envoyer via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles CSS améliorés */}
      <style jsx>{`
        .modal-relance-enhanced {
          max-width: 1000px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        
        /* En-tête avec gradient */
        .modal-header-relance {
          border-radius: 16px 16px 0 0;
          overflow: hidden;
        }
        
        .header-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #ed8936 100%);
          padding: 24px;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-title {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .title-icon {
          font-size: 40px;
          background: rgba(255, 255, 255, 0.2);
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(10px);
        }
        
        .header-title h2 {
          margin: 0;
          color: white;
          font-size: 28px;
          font-weight: 700;
        }
        
        .subtitle {
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          margin-top: 4px;
        }
        
        .btn-close-relance {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;
        }
        
        .btn-close-relance:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: rotate(90deg);
        }
        
        /* Onglets */
        .relance-tabs {
          display: flex;
          background: white;
          padding: 0 24px;
          border-bottom: 1px solid #e8edf2;
        }
        
        .relance-tab {
          padding: 16px 24px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #718096;
          transition: all 0.2s;
        }
        
        .relance-tab:hover {
          color: #4a5568;
          background: #f7fafc;
        }
        
        .relance-tab.active {
          color: #667eea;
          border-bottom-color: #667eea;
        }
        
        /* Carte de résumé améliorée */
        .summary-card-enhanced {
          background: white;
          border-radius: 16px;
          margin: 24px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #e8edf2;
        }
        
        .summary-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e8edf2;
        }
        
        .summary-avatar {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .avatar-initials {
          color: white;
          font-size: 28px;
          font-weight: 700;
        }
        
        .summary-info {
          flex: 1;
        }
        
        .eleve-name {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
          color: #1a202c;
        }
        
        .eleve-details {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .badge-classe {
          background: #c6f6d5;
          color: #22543d;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .badge-statut {
          background: #fed7d7;
          color: #742a2a;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .summary-amount {
          text-align: right;
        }
        
        .amount-label {
          font-size: 12px;
          color: #718096;
          margin-bottom: 4px;
        }
        
        .amount-value {
          font-size: 28px;
          font-weight: 700;
          color: #e53e3e;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
        }
        
        .summary-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .item-icon {
          font-size: 20px;
          width: 44px;
          height: 44px;
          background: #f7fafc;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .item-label {
          font-size: 12px;
          color: #718096;
          margin-bottom: 2px;
        }
        
        .item-value {
          font-size: 15px;
          font-weight: 600;
          color: #2d3748;
        }
        
        /* Éditeur de message amélioré */
        .message-editor-enhanced {
          background: white;
          border-radius: 16px;
          margin: 0 24px 24px 24px;
          border: 1px solid #e8edf2;
          overflow: hidden;
        }
        
        .editor-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          background: #f7fafc;
          border-bottom: 1px solid #e8edf2;
        }
        
        .editor-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }
        
        .editor-tools {
          display: flex;
          gap: 8px;
        }
        
        .tool-btn {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          font-size: 13px;
          color: #4a5568;
          transition: all 0.2s;
        }
        
        .tool-btn:hover {
          background: #edf2f7;
          transform: translateY(-1px);
        }
        
        .tool-btn.copy:hover {
          border-color: #667eea;
          color: #667eea;
        }
        
        .tool-btn.reset:hover {
          border-color: #ed8936;
          color: #ed8936;
        }
        
        .tool-btn.preview:hover {
          border-color: #38a169;
          color: #38a169;
        }
        
        .editor-container {
          display: flex;
          min-height: 300px;
        }
        
        .editor-sidebar {
          width: 250px;
          padding: 20px;
          background: #fafafa;
          border-right: 1px solid #e8edf2;
        }
        
        .sidebar-title {
          font-size: 12px;
          color: #718096;
          margin-bottom: 12px;
          font-weight: 600;
        }
        
        .variables-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .variable-tag {
          padding: 8px 12px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .variable-tag:hover {
          background: #edf2f7;
          border-color: #667eea;
          color: #667eea;
        }
        
        .editor-main {
          flex: 1;
          padding: 20px;
        }
        
        .message-textarea {
          width: 100%;
          min-height: 200px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
          color: #2d3748;
          resize: vertical;
        }
        
        .message-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .editor-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
        }
        
        .char-count {
          font-size: 12px;
          color: #718096;
        }
        
        .type-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
        }
        
        .type-badge.whatsapp {
          background: #25d366;
          color: white;
        }
        
        /* Frais restants */
        .frais-section {
          margin: 0 24px 24px 24px;
        }
        
        .section-header {
          margin-bottom: 16px;
        }
        
        .section-header h3 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }
        
        .section-subtitle {
          font-size: 13px;
          color: #718096;
        }
        
        .frais-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 12px;
        }
        
        .frais-card-enhanced {
          background: white;
          border: 1px solid #e8edf2;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s;
        }
        
        .frais-card-enhanced:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }
        
        .frais-icon {
          font-size: 24px;
          width: 48px;
          height: 48px;
          background: #f7fafc;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .frais-content {
          flex: 1;
        }
        
        .frais-title {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 4px;
        }
        
        .frais-details {
          display: flex;
          gap: 4px;
        }
        
        .detail-tag {
          background: #e8edf2;
          color: #4a5568;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
        }
        
        .frais-amount {
          text-align: right;
        }
        
        .amount-due {
          font-size: 18px;
          font-weight: 700;
          color: #e53e3e;
        }
        
        .amount-label {
          font-size: 11px;
          color: #718096;
        }
        
        /* Méthodes d'envoi améliorées */
        .methods-section {
          margin: 0 24px;
        }
        
        .methods-grid-enhanced {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }
        
        .method-card {
          background: white;
          border: 2px solid #e8edf2;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }
        
        .method-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }
        
        .method-card.whatsapp:hover {
          border-color: #25d366;
          background: rgba(37, 211, 102, 0.02);
        }
        
        .method-card.email:hover {
          border-color: #ea4335;
          background: rgba(234, 67, 53, 0.02);
        }
        
        .method-card.print:hover {
          border-color: #8b5cf6;
          background: rgba(139, 92, 246, 0.02);
        }
        
        .method-card.sms:hover {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.02);
        }
        
        .method-icon {
          width: 64px;
          height: 64px;
          background: #f7fafc;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .icon-large {
          font-size: 32px;
        }
        
        .method-content {
          flex: 1;
        }
        
        .method-title {
          margin: 0 0 8px 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a202c;
        }
        
        .method-description {
          font-size: 13px;
          color: #718096;
          margin-bottom: 12px;
          line-height: 1.4;
        }
        
        .method-info {
          display: flex;
          gap: 12px;
        }
        
        .info-item {
          font-size: 11px;
          color: #a0aec0;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .method-action {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          padding: 10px 20px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        
        .method-card.whatsapp .method-action {
          background: #25d366;
        }
        
        .method-card.email .method-action {
          background: #ea4335;
        }
        
        .method-card.print .method-action {
          background: #8b5cf6;
        }
        
        .method-card.sms .method-action {
          background: #3b82f6;
        }
        
        .method-action:hover {
          transform: translateX(4px);
        }
        
        /* Pied de page amélioré */
        .modal-footer-relance {
          margin-top: auto;
          padding: 24px;
          background: white;
          border-top: 1px solid #e8edf2;
          border-radius: 0 0 16px 16px;
        }
        
        .footer-stats {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 20px;
          border-bottom: 1px solid #e8edf2;
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-label {
          display: block;
          font-size: 12px;
          color: #718096;
          margin-bottom: 4px;
        }
        
        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #2d3748;
        }
        
        .stat-value.ready {
          color: #38a169;
        }
        
        .footer-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .btn-cancel {
          padding: 12px 32px;
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          color: #4a5568;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .btn-cancel:hover {
          background: #edf2f7;
          transform: translateY(-1px);
        }
        
        .btn-send-all {
          padding: 12px 32px;
          background: linear-gradient(135deg, #25d366 0%, #128c7e 100%);
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        
        .btn-send-all:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(37, 211, 102, 0.4);
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .modal-relance-enhanced {
            max-width: 95%;
          }
          
          .header-title h2 {
            font-size: 20px;
          }
          
          .summary-header {
            flex-direction: column;
            text-align: center;
          }
          
          .summary-amount {
            text-align: center;
          }
          
          .editor-container {
            flex-direction: column;
          }
          
          .editor-sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #e8edf2;
          }
          
          .methods-grid-enhanced {
            grid-template-columns: 1fr;
          }
          
          .footer-stats {
            flex-direction: column;
            gap: 16px;
          }
          
          .footer-actions {
            flex-direction: column;
            gap: 12px;
          }
          
          .btn-cancel, .btn-send-all {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}