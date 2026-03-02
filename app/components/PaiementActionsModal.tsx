'use client';

import { useState, useEffect, useRef } from 'react';

interface PaiementActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  paiement: any;
  onDeleteSuccess?: () => void;
}

interface Versement {
  numero: number;
  montant: number;
  date_echeance: string;
}

export default function PaiementActionsModal({ 
  isOpen, 
  onClose, 
  paiement,
  onDeleteSuccess 
}: PaiementActionsModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'receipt' | 'edit' | 'delete'>('details');
  const [loading, setLoading] = useState(false);
  const [receiptInfo, setReceiptInfo] = useState<any>(null);
  const [isDuplicate, setIsDuplicate] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Gérer la fermeture avec la touche Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Fermer en cliquant en dehors de la modale
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node) && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);
  
  // Empêcher le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  // Charger les informations détaillées du paiement
  useEffect(() => {
    if (isOpen && paiement) {
      loadReceiptInfo();
    }
  }, [isOpen, paiement]);
  
  const loadReceiptInfo = async () => {
    try {
      const response = await fetch(`/api/finance/paiements/${paiement.id}/details`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setReceiptInfo(data.paiement);
          // Vérifier si c'est un duplicata
          if (data.paiement.date_impression_recu) {
            setIsDuplicate(true);
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement détails paiement:', error);
    }
  };
  
  const handlePrintReceipt = async () => {
    setLoading(true);
    try {
      // Marquer comme duplicata si c'est la deuxième impression
      const response = await fetch(`/api/finance/paiements/${paiement.id}/imprimer`, {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setIsDuplicate(true);
          // Générer le PDF ou l'impression
          await generateReceiptPDF(data.paiement);
        }
      }
    } catch (error) {
      console.error('Erreur impression reçu:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const generateReceiptPDF = async (paiementData: any) => {
    // Créer un nouvel onglet pour l'impression
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const formattedDate = new Date(paiementData.date_paiement).toLocaleDateString('fr-FR');
    const formattedAmount = formatAmount(paiementData.montant);
    const formattedTotal = formatAmount(paiementData.montant_total);
    const formattedPaid = formatAmount(paiementData.montant_paye);
    const formattedRemaining = formatAmount(paiementData.montant_total - paiementData.montant_paye);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reçu de paiement #${paiementData.numero_recu}</title>
        <style>
          @media print {
            @page {
              margin: 20mm;
              size: A4 portrait;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-family: 'Arial', sans-serif;
              font-size: 12pt;
              line-height: 1.4;
              color: #000;
              background: #fff;
            }
            
            .no-print {
              display: none !important;
            }
            
            .page-break {
              page-break-before: always;
            }
            
            .watermark {
              position: fixed;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 100px;
              color: rgba(255, 0, 0, 0.1);
              z-index: 1000;
              pointer-events: none;
              font-weight: bold;
              letter-spacing: 20px;
            }
          }
          
          * {
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', sans-serif;
            font-size: 12pt;
            line-height: 1.4;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .school-name {
            font-size: 24pt;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .receipt-title {
            font-size: 18pt;
            margin-bottom: 10px;
          }
          
          .receipt-number {
            font-size: 14pt;
            font-weight: bold;
            margin: 15px 0;
            padding: 5px 20px;
            background: #f0f0f0;
            display: inline-block;
            border-radius: 4px;
          }
          
          .duplicate-badge {
            color: #d00;
            font-weight: bold;
            font-size: 16pt;
            margin: 10px 0;
            padding: 5px 15px;
            border: 2px solid #d00;
            display: inline-block;
            border-radius: 4px;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 14pt;
            font-weight: bold;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          
          .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 4px 0;
            border-bottom: 1px dotted #ccc;
          }
          
          .label {
            font-weight: bold;
            min-width: 200px;
          }
          
          .value {
            text-align: right;
          }
          
          .amount {
            font-size: 16pt;
            font-weight: bold;
            text-align: right;
            color: #008000;
          }
          
          .amount-due {
            color: #d00;
            font-weight: bold;
          }
          
          .table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          
          .table th {
            background: #f0f0f0;
            padding: 8px;
            text-align: left;
            border: 1px solid #ccc;
            font-weight: bold;
          }
          
          .table td {
            padding: 8px;
            border: 1px solid #ccc;
          }
          
          .table tr:nth-child(even) {
            background: #f9f9f9;
          }
          
          .signature-area {
            margin-top: 60px;
            text-align: center;
          }
          
          .signature-line {
            border-top: 1px solid #000;
            width: 300px;
            margin: 40px auto 10px;
            padding-top: 10px;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 10pt;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 20px;
          }
          
          .print-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #0070f3;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14pt;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          }
          
          .print-button:hover {
            background: #0051cc;
          }
        </style>
      </head>
      <body>
        ${isDuplicate ? '<div class="watermark">DUPLICATA</div>' : ''}
        
        <div class="header">
          <div class="school-name">ÉCOLE MODÈLE</div>
          <div>123 Avenue de l'Éducation, Ville</div>
          <div>Tél: +221 XX XXX XX XX | Email: contact@ecolemodele.edu</div>
          <div class="receipt-title">REÇU DE PAIEMENT</div>
          <div class="receipt-number">N° ${paiementData.numero_recu}</div>
          <div><strong>Date:</strong> ${formattedDate}</div>
          ${isDuplicate ? '<div class="duplicate-badge">DUPLICATA</div>' : ''}
        </div>
        
        <div class="section">
          <div class="section-title">INFORMATIONS ÉLÈVE</div>
          <div class="grid-2">
            <div>
              <div class="info-row">
                <span class="label">Nom complet:</span>
                <span class="value">${paiementData.eleve_prenom} ${paiementData.eleve_nom}</span>
              </div>
              <div class="info-row">
                <span class="label">Matricule:</span>
                <span class="value">${paiementData.eleve_matricule}</span>
              </div>
            </div>
            <div>
              <div class="info-row">
                <span class="label">Classe:</span>
                <span class="value">${paiementData.classe_niveau} ${paiementData.classe_nom}</span>
              </div>
              <div class="info-row">
                <span class="label">Année scolaire:</span>
                <span class="value">${paiementData.annee_scolaire}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <div class="section-title">DÉTAILS DU PAIEMENT</div>
          <div class="grid-2">
            <div>
              <div class="info-row">
                <span class="label">Catégorie:</span>
                <span class="value">${paiementData.categorie_nom}</span>
              </div>
              <div class="info-row">
                <span class="label">Mode de paiement:</span>
                <span class="value">${paiementData.mode_paiement.toUpperCase()}</span>
              </div>
            </div>
            <div>
              ${paiementData.numero_versement ? `
                <div class="info-row">
                  <span class="label">Type:</span>
                  <span class="value">Versement #${paiementData.numero_versement}</span>
                </div>
              ` : `
                <div class="info-row">
                  <span class="label">Type:</span>
                  <span class="value">Paiement global</span>
                </div>
              `}
              ${paiementData.reference_paiement ? `
                <div class="info-row">
                  <span class="label">Référence:</span>
                  <span class="value">${paiementData.reference_paiement}</span>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
        
        ${paiementData.categorie_type === 'scolarite' ? `
          <div class="section">
            <div class="section-title">DÉTAILS DE LA SCOLARITÉ</div>
            <div class="grid-2">
              <div>
                <div class="info-row">
                  <span class="label">Montant total:</span>
                  <span class="value">${formattedTotal} FCFA</span>
                </div>
                <div class="info-row">
                  <span class="label">Déjà payé:</span>
                  <span class="value">${formattedPaid} FCFA</span>
                </div>
              </div>
              <div>
                <div class="info-row">
                  <span class="label">Reste à payer:</span>
                  <span class="value amount-due">${formattedRemaining} FCFA</span>
                </div>
                ${paiementData.prochain_versement ? `
                  <div class="info-row">
                    <span class="label">Prochain versement:</span>
                    <span class="value">${formatAmount(paiementData.prochain_versement.montant)} FCFA</span>
                  </div>
                ` : ''}
              </div>
            </div>
            
            ${receiptInfo?.versements_restants && receiptInfo.versements_restants.length > 0 ? `
              <div class="section">
                <div class="section-title">VERSEMENTS RESTANTS</div>
                <table class="table">
                  <thead>
                    <tr>
                      <th>N° Versement</th>
                      <th>Montant</th>
                      <th>Date d'échéance</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${receiptInfo.versements_restants.map((versement: Versement) => `
                      <tr>
                        <td>${versement.numero}</td>
                        <td>${formatAmount(versement.montant)} FCFA</td>
                        <td>${new Date(versement.date_echeance).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
          </div>
        ` : ''}
        
        <div class="section">
          <div class="section-title">MONTANT PAYÉ</div>
          <div class="info-row">
            <span class="label">Montant payé:</span>
            <span class="value amount">${formattedAmount} FCFA</span>
          </div>
          <div class="info-row">
            <span class="label">Statut:</span>
            <span class="value">
              ${paiementData.statut_paiement === 'paye' ? '✅ Payé' : 
                paiementData.statut_paiement === 'partiel' ? '⚠️ Partiel' : 
                paiementData.statut_paiement === 'en_attente' ? '⏳ En attente' : 
                paiementData.statut_paiement}
            </span>
          </div>
        </div>
        
        ${paiementData.notes ? `
          <div class="section">
            <div class="section-title">NOTES</div>
            <div style="padding: 10px; background: #f9f9f9; border-left: 4px solid #0070f3;">
              ${paiementData.notes}
            </div>
          </div>
        ` : ''}
        
        <div class="section">
          <div class="signature-area">
            <div>Fait à Ville, le ${formattedDate}</div>
            <div class="signature-line"></div>
            <div>Signature et cachet de l'administration</div>
          </div>
        </div>
        
        <div class="footer">
          <div>Ce reçu est établi par le système de gestion scolaire</div>
          <div><strong>${isDuplicate ? 'DUPLICATA - NE FAIT PAS FOI DE PAIEMENT ORIGINAL' : 'ORIGINAL'}</strong></div>
          <div>Conserver ce reçu pour toute réclamation</div>
        </div>
        
        <button class="print-button no-print" onclick="window.print()">🖨️ Imprimer le reçu</button>
        
        <script>
          // Auto-print
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }, 1000);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount);
  };
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.')) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/finance/paiements/${paiement.id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Paiement supprimé avec succès');
        if (onDeleteSuccess) onDeleteSuccess();
        onClose();
      } else {
        alert('Erreur lors de la suppression: ' + data.erreur);
      }
    } catch (error) {
      console.error('Erreur suppression paiement:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEdit = async () => {
    // Implémentation basique de l'édition
    const newAmount = prompt('Nouveau montant:', paiement.montant.toString());
    if (!newAmount) return;
    
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Montant invalide');
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch(`/api/finance/paiements/${paiement.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ montant: amount })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Paiement modifié avec succès');
        if (onDeleteSuccess) onDeleteSuccess();
        onClose();
      } else {
        alert('Erreur lors de la modification: ' + data.erreur);
      }
    } catch (error) {
      console.error('Erreur modification paiement:', error);
      alert('Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-modern" ref={modalRef}>
        <div className="modal-header">
          <h3>Actions paiement #{paiement?.numero_recu || paiement?.id}</h3>
          <button onClick={onClose} className="modal-close-button">×</button>
        </div>
        
        <div className="modal-tabs">
          <button 
            className={`tab-button ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            📋 Détails
          </button>
          <button 
            className={`tab-button ${activeTab === 'receipt' ? 'active' : ''}`}
            onClick={() => setActiveTab('receipt')}
          >
            🖨️ Reçu
          </button>
          <button 
            className={`tab-button ${activeTab === 'edit' ? 'active' : ''}`}
            onClick={() => setActiveTab('edit')}
          >
            ✏️ Modifier
          </button>
          <button 
            className={`tab-button ${activeTab === 'delete' ? 'active' : ''}`}
            onClick={() => setActiveTab('delete')}
          >
            🗑️ Supprimer
          </button>
        </div>
        
        <div className="modal-content">
          {activeTab === 'details' && (
            <div className="details-section">
              <h4>Informations générales</h4>
              <div className="info-grid">
                <div className="info-item">
                  <label>Date paiement:</label>
                  <span>{formatDate(paiement.date_paiement)}</span>
                </div>
                <div className="info-item">
                  <label>Élève:</label>
                  <span>{paiement.eleve_prenom} {paiement.eleve_nom}</span>
                </div>
                <div className="info-item">
                  <label>Matricule:</label>
                  <span>{paiement.eleve_matricule}</span>
                </div>
                <div className="info-item">
                  <label>Classe:</label>
                  <span>{paiement.classe_niveau} {paiement.classe_nom}</span>
                </div>
                <div className="info-item">
                  <label>Catégorie:</label>
                  <span>{paiement.categorie_nom}</span>
                </div>
                <div className="info-item">
                  <label>Mode paiement:</label>
                  <span className="badge-mode">{paiement.mode_paiement}</span>
                </div>
                <div className="info-item">
                  <label>Montant:</label>
                  <span className="amount">{formatAmount(paiement.montant)} FCFA</span>
                </div>
                <div className="info-item">
                  <label>Référence:</label>
                  <span>{paiement.reference_paiement || 'Non spécifié'}</span>
                </div>
                <div className="info-item">
                  <label>Numéro reçu:</label>
                  <span className="receipt-number">{paiement.numero_recu || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <label>Statut:</label>
                  <span className={`badge-statut ${paiement.statut_paiement}`}>
                    {paiement.statut_paiement === 'paye' ? '✅ Payé' : 
                     paiement.statut_paiement === 'partiel' ? '⚠️ Partiel' : 
                     paiement.statut_paiement === 'en_attente' ? '⏳ En attente' : 
                     paiement.statut_paiement}
                  </span>
                </div>
              </div>
              
              {paiement.reste_a_payer > 0 && (
                <div className="alert-info">
                  <strong>Reste à payer:</strong> {formatAmount(paiement.reste_a_payer)} FCFA
                </div>
              )}
              
              {receiptInfo && receiptInfo.categorie_type === 'scolarite' && (
                <div className="scolarite-details">
                  <h4>Détails de la scolarité</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Montant total:</label>
                      <span>{formatAmount(receiptInfo.montant_total)} FCFA</span>
                    </div>
                    <div className="info-item">
                      <label>Déjà payé:</label>
                      <span>{formatAmount(receiptInfo.montant_paye)} FCFA</span>
                    </div>
                    <div className="info-item">
                      <label>Reste à payer:</label>
                      <span className="amount-due">{formatAmount(receiptInfo.montant_total - receiptInfo.montant_paye)} FCFA</span>
                    </div>
                    {receiptInfo.prochain_versement && (
                      <>
                        <div className="info-item">
                          <label>Prochain versement:</label>
                          <span>#{receiptInfo.prochain_versement.numero_versement}</span>
                        </div>
                        <div className="info-item">
                          <label>Montant:</label>
                          <span>{formatAmount(receiptInfo.prochain_versement.montant)} FCFA</span>
                        </div>
                        <div className="info-item">
                          <label>Échéance:</label>
                          <span>{formatDate(receiptInfo.prochain_versement.date_echeance)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {receiptInfo.versements_restants && receiptInfo.versements_restants.length > 0 && (
                    <div className="versements-restants">
                      <h5>Versements restants</h5>
                      <table className="versements-table">
                        <thead>
                          <tr>
                            <th>N°</th>
                            <th>Montant</th>
                            <th>Échéance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {receiptInfo.versements_restants.map((versement: Versement) => (
                            <tr key={versement.numero}>
                              <td>{versement.numero}</td>
                              <td>{formatAmount(versement.montant)} FCFA</td>
                              <td>{formatDate(versement.date_echeance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
              
              {paiement.notes && (
                <div className="notes-section">
                  <h5>Notes</h5>
                  <div className="notes-content">
                    {paiement.notes}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'receipt' && (
            <div className="receipt-section">
              <div className="receipt-preview">
                <div className="receipt-header-preview">
                  <h4>Reçu #{receiptInfo?.numero_recu || paiement.numero_recu || 'N/A'}</h4>
                  {isDuplicate && (
                    <div className="duplicate-badge">DUPLICATA</div>
                  )}
                </div>
                
                <div className="receipt-actions">
                  <button 
                    onClick={handlePrintReceipt}
                    disabled={loading}
                    className="print-button"
                  >
                    {loading ? 'Génération...' : '🖨️ Imprimer le reçu'}
                  </button>
                  
                  <button 
                    onClick={() => {
                      const url = `/api/finance/paiements/${paiement.id}/pdf`;
                      window.open(url, '_blank');
                    }}
                    className="download-button"
                  >
                    📥 Télécharger PDF
                  </button>
                </div>
                
                <div className="receipt-info">
                  <h5>Informations d'impression</h5>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Numéro de reçu:</label>
                      <span>{receiptInfo?.numero_recu || paiement.numero_recu || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                      <label>Première impression:</label>
                      <span>{receiptInfo?.date_premiere_impression ? 
                        formatDate(receiptInfo.date_premiere_impression) : 'Non imprimé'}</span>
                    </div>
                    <div className="info-item">
                      <label>Dernière impression:</label>
                      <span>{receiptInfo?.date_impression_recu ? 
                        formatDate(receiptInfo.date_impression_recu) : 'Non imprimé'}</span>
                    </div>
                    <div className="info-item">
                      <label>Statut:</label>
                      <span className={`status-badge ${isDuplicate ? 'duplicate' : 'original'}`}>
                        {isDuplicate ? 'Duplicata' : 'Original'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="receipt-preview-content">
                  <h5>Aperçu du reçu</h5>
                  <div className="preview-box">
                    <div className="preview-header">
                      <div>ÉCOLE MODÈLE</div>
                      <div>Reçu de paiement #{receiptInfo?.numero_recu || paiement.numero_recu || 'N/A'}</div>
                    </div>
                    <div className="preview-body">
                      <div><strong>Élève:</strong> {paiement.eleve_prenom} {paiement.eleve_nom}</div>
                      <div><strong>Montant:</strong> {formatAmount(paiement.montant)} FCFA</div>
                      <div><strong>Catégorie:</strong> {paiement.categorie_nom}</div>
                      {isDuplicate && <div className="preview-watermark">DUPLICATA</div>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'edit' && (
            <div className="edit-section">
              <h4>Modifier le paiement</h4>
              <p className="info-text">
                La modification des paiements est limitée pour des raisons de sécurité.
                Seuls certains champs peuvent être modifiés.
              </p>
              
              <div className="edit-form">
                <div className="form-group">
                  <label htmlFor="montant">Montant (FCFA)</label>
                  <input
                    type="number"
                    id="montant"
                    defaultValue={paiement.montant}
                    min="0"
                    step="100"
                    className="form-input"
                  />
                  <small className="hint">Montant maximum: {formatAmount(paiement.montant_total)} FCFA</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="reference">Référence</label>
                  <input
                    type="text"
                    id="reference"
                    defaultValue={paiement.reference_paiement || ''}
                    className="form-input"
                    placeholder="Référence de paiement"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    defaultValue={paiement.notes || ''}
                    className="form-textarea"
                    rows={3}
                    placeholder="Notes additionnelles..."
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button"
                    onClick={onClose}
                    className="cancel-button"
                  >
                    Annuler
                  </button>
                  <button 
                    type="button"
                    onClick={handleEdit}
                    disabled={loading}
                    className="save-button"
                  >
                    {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'delete' && (
            <div className="delete-section">
              <div className="delete-warning">
                <div className="warning-icon">⚠️</div>
                <h4>Supprimer ce paiement</h4>
                <p>
                  Cette action est irréversible. Le paiement sera archivé dans la table 
                  <strong> paiement_frais_supp</strong> et ne sera plus visible dans la liste.
                </p>
                
                <div className="delete-details">
                  <p><strong>Paiement à supprimer:</strong></p>
                  <ul>
                    <li>Date: {formatDate(paiement.date_paiement)}</li>
                    <li>Élève: {paiement.eleve_prenom} {paiement.eleve_nom}</li>
                    <li>Matricule: {paiement.eleve_matricule}</li>
                    <li>Montant: {formatAmount(paiement.montant)} FCFA</li>
                    <li>Mode: {paiement.mode_paiement}</li>
                    <li>Numéro reçu: {paiement.numero_recu || 'N/A'}</li>
                  </ul>
                </div>
                
                <div className="delete-actions">
                  <button 
                    onClick={onClose}
                    className="cancel-button"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleDelete}
                    disabled={loading}
                    className="delete-button"
                  >
                    {loading ? 'Suppression...' : 'Confirmer la suppression'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.75);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-modern {
          background: white;
          border-radius: 12px;
          padding: 0;
          width: 90%;
          max-width: 900px;
          max-height: 90vh;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-50px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 30px;
          border-bottom: 1px solid #e5e7eb;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 1.5rem;
          font-weight: 600;
        }
        
        .modal-close-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 1.5rem;
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s;
        }
        
        .modal-close-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .modal-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
          background: #f9fafb;
        }
        
        .tab-button {
          flex: 1;
          padding: 15px 20px;
          background: none;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
        }
        
        .tab-button:hover {
          background-color: #f3f4f6;
          color: #4b5563;
        }
        
        .tab-button.active {
          color: #667eea;
          border-bottom-color: #667eea;
          background-color: white;
        }
        
        .modal-content {
          padding: 30px;
          max-height: calc(90vh - 120px);
          overflow-y: auto;
        }
        
        /* Détails section */
        .details-section h4 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #374151;
          font-size: 1.25rem;
          font-weight: 600;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }
        
        .info-item label {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 4px;
          font-weight: 500;
        }
        
        .info-item span {
          font-weight: 500;
          color: #111827;
        }
        
        .amount {
          color: #059669;
          font-weight: bold;
          font-size: 1.1rem;
        }
        
        .amount-due {
          color: #dc2626;
          font-weight: bold;
        }
        
        .badge-mode {
          display: inline-block;
          padding: 4px 8px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .badge-statut {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .badge-statut.paye {
          background: #d1fae5;
          color: #065f46;
        }
        
        .badge-statut.partiel {
          background: #fef3c7;
          color: #92400e;
        }
        
        .badge-statut.en_attente {
          background: #e0e7ff;
          color: #3730a3;
        }
        
        .receipt-number {
          font-weight: bold;
          color: #7c3aed;
        }
        
        .alert-info {
          background: #dbeafe;
          border: 1px solid #93c5fd;
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 25px;
          color: #1e40af;
          font-weight: 500;
        }
        
        .scolarite-details {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
        }
        
        .scolarite-details h5 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #4b5563;
        }
        
        .versements-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        
        .versements-table th {
          background: #f3f4f6;
          padding: 10px;
          text-align: left;
          border: 1px solid #e5e7eb;
          font-weight: 600;
          color: #4b5563;
        }
        
        .versements-table td {
          padding: 10px;
          border: 1px solid #e5e7eb;
        }
        
        .versements-table tr:nth-child(even) {
          background: #f9fafb;
        }
        
        .notes-section {
          margin-top: 25px;
          padding: 15px;
          background: #fef3c7;
          border-radius: 8px;
          border-left: 4px solid #d97706;
        }
        
        .notes-section h5 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #92400e;
        }
        
        .notes-content {
          color: #78350f;
          line-height: 1.5;
        }
        
        /* Receipt section */
        .receipt-header-preview {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .duplicate-badge {
          display: inline-block;
          background: #fef3c7;
          color: #92400e;
          padding: 8px 20px;
          border-radius: 20px;
          font-weight: bold;
          margin-top: 10px;
          font-size: 1.1rem;
        }
        
        .receipt-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 30px;
        }
        
        .print-button, .download-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .print-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .print-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }
        
        .print-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .download-button {
          background: #10b981;
          color: white;
        }
        
        .download-button:hover {
          background: #0da271;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.3);
        }
        
        .receipt-info h5 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #374151;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
        }
        
        .status-badge.original {
          background: #d1fae5;
          color: #065f46;
        }
        
        .status-badge.duplicate {
          background: #fef3c7;
          color: #92400e;
        }
        
        .receipt-preview-content {
          margin-top: 30px;
        }
        
        .receipt-preview-content h5 {
          margin-bottom: 15px;
          color: #374151;
        }
        
        .preview-box {
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .preview-header {
          background: #f3f4f6;
          padding: 15px;
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
          font-weight: 500;
        }
        
        .preview-body {
          padding: 20px;
          position: relative;
        }
        
        .preview-watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 60px;
          color: rgba(220, 38, 38, 0.1);
          font-weight: bold;
          pointer-events: none;
        }
        
        /* Edit section */
        .edit-form {
          margin-top: 20px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #374151;
        }
        
        .form-input, .form-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }
        
        .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        
        .hint {
          display: block;
          margin-top: 5px;
          color: #6b7280;
          font-size: 0.875rem;
        }
        
        .form-actions {
          display: flex;
          gap: 15px;
          margin-top: 30px;
        }
        
        .cancel-button, .save-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .cancel-button {
          background: #6b7280;
          color: white;
        }
        
        .cancel-button:hover {
          background: #4b5563;
        }
        
        .save-button {
          background: #10b981;
          color: white;
        }
        
        .save-button:hover {
          background: #0da271;
        }
        
        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* Delete section */
        .delete-warning {
          text-align: center;
          padding: 20px;
        }
        
        .warning-icon {
          font-size: 3rem;
          margin-bottom: 20px;
          color: #f59e0b;
        }
        
        .delete-warning h4 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #dc2626;
        }
        
        .delete-warning p {
          color: #4b5563;
          line-height: 1.6;
          margin-bottom: 25px;
        }
        
        .delete-details {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          margin: 25px 0;
          text-align: left;
        }
        
        .delete-details p {
          margin-top: 0;
          margin-bottom: 10px;
          color: #7f1d1d;
          font-weight: 600;
        }
        
        .delete-details ul {
          list-style: none;
          padding: 0;
          margin: 10px 0 0 0;
        }
        
        .delete-details li {
          padding: 8px 0;
          color: #7f1d1d;
          border-bottom: 1px solid #fecaca;
        }
        
        .delete-details li:last-child {
          border-bottom: none;
        }
        
        .delete-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 30px;
        }
        
        .delete-button {
          background: #dc2626;
          color: white;
          border: none;
          padding: 12px 30px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .delete-button:hover {
          background: #b91c1c;
        }
        
        .delete-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}