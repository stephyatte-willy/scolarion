<<<<<<< HEAD
'use client';

import { useState, useEffect, useRef } from 'react';
import { Paiement } from '@/app/types/finance';

interface ParametresEcole {
  nom_ecole: string;
  adresse: string;
  telephone: string;
  email: string;
  logo_url?: string;
  couleur_principale?: string;
}

interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  avatar_url?: string;
}

interface FraisEleveDetails {
  montant_total: number;
  montant_paye_total: number;
  reste_a_payer: number;
  montant_du_paiement: number;
}

interface ModalImprimerRecuProps {
  isOpen: boolean;
  onClose: () => void;
  paiement: Paiement;
  onSuccess?: () => void;
}

export default function ModalImprimerRecu({ isOpen, onClose, paiement, onSuccess }: ModalImprimerRecuProps) {
  const [chargement, setChargement] = useState(false);
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [estDuplicata, setEstDuplicata] = useState(false);
  const [details, setDetails] = useState<FraisEleveDetails | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && paiement) {
      console.log('🔍 Données du paiement reçu:', {
        id: paiement.id,
        frais_eleve_id: paiement.frais_eleve_id,
        montant: paiement.montant,
        montant_paye: paiement.montant_paye,
        montant_total: paiement.montant_total,
        reste_a_payer: paiement.reste_a_payer,
        categorie: paiement.categorie_nom
      });
      
      chargerDonnees();
      verifierDuplicata();
      calculerDetails();
    }
  }, [isOpen, paiement]);
  
  const calculerDetails = () => {
    console.log('🧮 Calcul des détails pour le reçu');
    
    // Montant de ce paiement spécifique
    const montantDuPaiement = parseFloat(paiement.montant?.toString() || '0');
    
    // Si nous avons les données directement du paiement (montant_paye = total payé à ce jour)
    if (paiement.montant_total !== undefined && paiement.montant_paye !== undefined) {
      const montantTotal = parseFloat(paiement.montant_total.toString()) || 0;
      const montantPayeTotal = parseFloat(paiement.montant_paye.toString()) || 0;
      
      // IMPORTANT: montant_paye dans l'API est le TOTAL payé à ce jour
      // Le reste à payer = montant total - montant déjà payé
      const reste = Math.max(0, montantTotal - montantPayeTotal);
      
      console.log('📊 Calcul basé sur données paiement:', {
        montantTotal,
        montantPayeTotal,
        montantDuPaiement,
        reste
      });
      
      setDetails({
        montant_total: montantTotal,
        montant_paye_total: montantPayeTotal,
        reste_a_payer: reste,
        montant_du_paiement: montantDuPaiement
      });
      return;
    }
    
    // Si nous avons reste_a_payer directement
    if (paiement.reste_a_payer !== undefined) {
      const montantTotal = parseFloat(paiement.montant_total?.toString() || '0');
      const reste = parseFloat(paiement.reste_a_payer.toString()) || 0;
      
      // Calculer montant payé total = montant total - reste
      const montantPayeTotal = Math.max(0, montantTotal - reste);
      
      console.log('📊 Calcul basé sur reste_a_payer:', {
        montantTotal,
        montantPayeTotal,
        montantDuPaiement,
        reste
      });
      
      setDetails({
        montant_total: montantTotal,
        montant_paye_total: montantPayeTotal,
        reste_a_payer: reste,
        montant_du_paiement: montantDuPaiement
      });
      return;
    }
    
    // Valeurs par défaut
    console.log('⚠️ Données insuffisantes, valeurs par défaut');
    setDetails({
      montant_total: 0,
      montant_paye_total: montantDuPaiement,
      reste_a_payer: 0,
      montant_du_paiement: montantDuPaiement
    });
  };
  
  const chargerDonnees = async () => {
    try {
      setChargement(true);
      
      // Charger les paramètres de l'école
      const responseParametres = await fetch('/api/parametres/ecole');
      if (responseParametres.ok) {
        const data = await responseParametres.json();
        setParametresEcole(data.parametres);
      } else {
        setParametresEcole({
          nom_ecole: "École Excellence",
          adresse: "Abidjan, Côte d'Ivoire",
          telephone: "+225 27 22 44 55 66",
          email: "contact@ecole-excellence.ci"
        });
      }
      
      // Charger les informations de l'utilisateur
      if (paiement.created_by) {
        const responseUtilisateur = await fetch(`/api/utilisateurs/${paiement.created_by}`);
        if (responseUtilisateur.ok) {
          const data = await responseUtilisateur.json();
          if (data.success) {
            setUtilisateur(data.utilisateur);
          } else {
            setUtilisateur({
              id: 1,
              nom: "Administrateur",
              prenom: "Système",
              email: "admin@ecole.ci"
            });
          }
        }
      } else {
        setUtilisateur({
          id: 1,
          nom: "Administrateur",
          prenom: "Système",
          email: "admin@ecole.ci"
        });
      }
      
    } catch (error) {
      console.error('Erreur chargement données reçu:', error);
      setParametresEcole({
        nom_ecole: "École Excellence",
        adresse: "Abidjan, Côte d'Ivoire",
        telephone: "+225 27 22 44 55 66",
        email: "contact@ecole-excellence.ci"
      });
      setUtilisateur({
        id: 1,
        nom: "Administrateur",
        prenom: "Système",
        email: "admin@ecole.ci"
      });
    } finally {
      setChargement(false);
    }
  };
  
  const verifierDuplicata = async () => {
    try {
      const response = await fetch(`/api/finance/paiements/${paiement.id}/impression`);
      if (response.ok) {
        const data = await response.json();
        setEstDuplicata(!data.premiere_impression);
      }
    } catch (error) {
      console.error('Erreur vérification duplicata:', error);
    }
  };
  
  const formaterMontantFCFA = (montant: number): string => {
    if (isNaN(montant) || !isFinite(montant) || montant === null || montant === undefined) {
      return '0 FCFA';
    }
    
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };
  
  const formaterDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  };
  
  const numeroEnLettres = (nombre: number): string => {
    if (nombre <= 0) return 'zéro';
    
    const unite = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const dizaine = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    const centaines = ['', 'cent', 'deux cent', 'trois cent', 'quatre cent', 'cinq cent', 'six cent', 'sept cent', 'huit cent', 'neuf cent'];
    
    let resultat = '';
    let n = Math.floor(nombre);
    
    // Gérer les millions
    if (n >= 1000000) {
      const millions = Math.floor(n / 1000000);
      resultat += (millions === 1 ? 'un million ' : `${numeroEnLettres(millions)} millions `);
      n %= 1000000;
    }
    
    // Gérer les milliers
    if (n >= 1000) {
      const milliers = Math.floor(n / 1000);
      if (milliers === 1) {
        resultat += 'mille ';
      } else {
        resultat += `${numeroEnLettres(milliers)} mille `;
      }
      n %= 1000;
    }
    
    // Gérer les centaines
    if (n >= 100) {
      const centaine = Math.floor(n / 100);
      resultat += centaines[centaine];
      if (centaine > 1 && n % 100 > 0) {
        resultat += ' ';
      } else if (centaine > 1) {
        resultat += 's ';
      } else {
        resultat += ' ';
      }
      n %= 100;
    }
    
    // Gérer les dizaines et unités
    if (n > 0) {
      if (n < 10) {
        resultat += unite[n];
      } else if (n < 20) {
        const exceptions = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
        resultat += exceptions[n - 10];
      } else {
        const d = Math.floor(n / 10);
        const u = n % 10;
        
        if (d === 7 || d === 9) {
          resultat += dizaine[d - 1];
          if (u === 1) {
            resultat += '-et-onze';
          } else if (u > 0) {
            resultat += '-' + unite[u + 10];
          } else {
            resultat += '-dix';
          }
        } else {
          resultat += dizaine[d];
          if (u > 0) {
            if (d === 1 || d === 7 || d === 9) {
              resultat += '-' + unite[u];
            } else if (d === 8 && u === 0) {
              resultat += 's';
            } else {
              resultat += (u === 1 && d !== 8) ? '-et-un' : '-' + unite[u];
            }
          }
        }
      }
    }
    
    return resultat.trim() + ' francs CFA';
  };
  
  const getModePaiementLibelle = (mode: string): string => {
    const modes: Record<string, string> = {
      'especes': 'Espèces',
      'cheque': 'Chèque',
      'virement': 'Virement',
      'carte': 'Carte bancaire',
      'mobile': 'Mobile Money',
      'autre': 'Autre'
    };
    return modes[mode] || mode;
  };
  
  const marquerCommeImprime = async () => {
    try {
      const response = await fetch(`/api/finance/paiements/${paiement.id}/marquer-imprime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEstDuplicata(false);
          if (onSuccess) onSuccess();
        }
      }
    } catch (error) {
      console.error('Erreur marquage impression:', error);
    }
  };
  
  const imprimerRecu = () => {
    if (!estDuplicata) {
      marquerCommeImprime();
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Récupérer les montants pour l'impression
    const montantPaiementActuel = details?.montant_du_paiement || parseFloat(paiement.montant?.toString() || '0');
    const totalPaye = details?.montant_paye_total || 0;
    const reste = details?.reste_a_payer || 0;
    const montantTotal = details?.montant_total || 0;
    
    console.log('🖨️ Montants pour impression:', {
      montantPaiementActuel,
      totalPaye,
      reste,
      montantTotal
    });
    
    const contenu = `
      <div class="receipt-container">
        ${estDuplicata ? '<div class="duplicata-overlay">DUPLICATA</div>' : ''}
        
        <!-- Section En-tête -->
        <div class="header-section">
          <div class="school-info">
            ${parametresEcole?.logo_url ? 
              `<img src="${parametresEcole.logo_url}" alt="Logo école" class="school-logo" />` : 
              ''
            }
            <div class="school-name">${parametresEcole?.nom_ecole || "École Excellence"}</div>
            <div class="school-details">
              ${parametresEcole?.adresse || "Abidjan, Côte d'Ivoire"}<br />
              Tél: ${parametresEcole?.telephone || "+225 27 22 44 55 66"}<br />
              Email: ${parametresEcole?.email || "contact@ecole.ci"}
            </div>
          </div>
          
          <div class="receipt-title">
            REÇU DE PAIEMENT
          </div>
          
          <div class="school-year">
            Année scolaire<br />
            <strong>${paiement.annee_scolaire || "2024-2025"}</strong>
          </div>
        </div>
        
        <!-- Numéro de reçu -->
        <div class="receipt-number">
          Reçu N°: <strong>${paiement.numero_recu || paiement.id.toString().padStart(6, '0')}</strong>
          ${estDuplicata ? '<span style="color: red; margin-left: 5px;">(DUPLICATA)</span>' : ''}
        </div>
        
        <!-- Section Info Élève -->
        <div class="student-section">
          <div class="student-info">
            <div class="student-label">L'élève :</div>
            <div class="student-value">
              <strong>${paiement.eleve_prenom || ''} ${paiement.eleve_nom || ''}</strong>
              ${paiement.eleve_matricule ? `<br />Matricule: ${paiement.eleve_matricule}` : ''}
            </div>
          </div>
          <div class="class-info">
            <div class="class-label">Classe :</div>
            <div class="class-value">
              <strong>${paiement.classe_niveau || ''} ${paiement.classe_nom || ''}</strong>
            </div>
          </div>
        </div>
        
        <!-- Section Info Paiement -->
        <div class="payment-section">
          <div class="payment-details">
            <div class="payment-row">
              <span class="payment-label">Catégorie :</span>
              <span class="payment-value">${paiement.categorie_nom || 'Frais scolaire'}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Mode de paiement :</span>
              <span class="payment-value">${getModePaiementLibelle(paiement.mode_paiement)}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Date :</span>
              <span class="payment-value">${formaterDate(paiement.date_paiement)}</span>
            </div>
            ${paiement.reference_paiement ? `
              <div class="payment-row">
                <span class="payment-label">Référence :</span>
                <span class="payment-value">${paiement.reference_paiement}</span>
              </div>
            ` : ''}
            ${paiement.numero_versement ? `
              <div class="payment-row">
                <span class="payment-label">Versement :</span>
                <span class="payment-value">N° ${paiement.numero_versement}</span>
              </div>
            ` : ''}
            ${montantTotal > 0 ? `
              <div class="payment-row">
                <span class="payment-label">Montant total :</span>
                <span class="payment-value">${formaterMontantFCFA(montantTotal)}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="amount-section">
            <div class="amount-label">Montant de ce paiement :</div>
            <div class="amount-figures">
              ${formaterMontantFCFA(montantPaiementActuel)}
            </div>
            <div class="amount-words">
              ${numeroEnLettres(montantPaiementActuel)}
            </div>
          </div>
        </div>
        
        <!-- Section Reste à Payer -->
        <div class="balance-section">
          <div class="balance-item">
            <div class="balance-label">Total payé à ce jour :</div>
            <div class="balance-value" style="color: #059669">
              ${formaterMontantFCFA(totalPaye)}
            </div>
            <div style="font-size: 7pt; color: #666; margin-top: 1mm;">
              (cumul des versements)
            </div>
          </div>
          <div class="balance-item">
            <div class="balance-label">Reste à payer :</div>
            <div class="balance-value" style="color: ${reste > 0 ? '#dc2626' : '#059669'}">
              ${formaterMontantFCFA(reste)}
            </div>
            ${montantTotal > 0 ? `
              <div style="font-size: 7pt; color: #666; margin-top: 1mm;">
                (sur ${formaterMontantFCFA(montantTotal)})
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Section Signature -->
        <div class="signature-section">
          <div class="signature-row">
            <div class="signature-item">
              <div>Fait à Abidjan, le ${formaterDate(new Date().toISOString())}</div>
            </div>
            <div class="signature-item">
              <div class="signature-line"></div>
              <div>Signature et cachet de l'établissement</div>
            </div>
            <div class="signature-item">
              <div>Saisi par :</div>
              <div><strong>${utilisateur?.prenom || 'Système'} ${utilisateur?.nom || 'Admin'}</strong></div>
            </div>
          </div>
        </div>
        
        <!-- Section Avertissement -->
        <div class="warning-section">
          ⚠️ Aucun remboursement ne se fera après le versement
        </div>
      </div>
    `;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu de paiement N°${paiement.numero_recu || paiement.id}</title>
        <meta charset="UTF-8">
        <style>
          @page { size: A5 portrait; margin: 3mm; }
          body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; font-size: 9pt; line-height: 1.2; width: 99mm; }
          .receipt-container { width: 99mm; max-width: 99mm; min-height: 140mm; margin: 0 auto; padding: 4mm; box-sizing: border-box; position: relative; border: 1px solid #ccc; background: white; }
          .duplicata-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 32px; color: rgba(255, 0, 0, 0.15); font-weight: bold; z-index: 1000; pointer-events: none; opacity: 0.5; }
          .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3mm; border-bottom: 1px solid #000; padding-bottom: 2mm; }
          .school-info { flex: 1; font-size: 7pt; line-height: 1.1; min-width: 30mm; }
          .school-logo { max-width: 15mm; max-height: 15mm; margin-bottom: 1mm; }
          .school-name { font-weight: bold; font-size: 8pt; margin-bottom: 0.5mm; color: #000; }
          .school-details { font-size: 6pt; color: #555; line-height: 1.1; }
          .receipt-title { text-align: center; font-size: 11pt; font-weight: bold; margin: 0; flex: 1; padding: 0 2mm; }
          .school-year { text-align: right; font-size: 7pt; flex: 1; min-width: 25mm; }
          .receipt-number { text-align: center; font-size: 9pt; font-weight: bold; margin: 2mm 0; padding: 1mm; border: 1px solid #000; background-color: #f8fafc; }
          .student-section { display: flex; justify-content: space-between; margin: 3mm 0; padding: 2mm; border-bottom: 1px solid #ccc; font-size: 8pt; }
          .student-info, .class-info { flex: 1; }
          .student-label, .class-label { font-weight: bold; font-size: 7pt; margin-bottom: 0.5mm; }
          .student-value, .class-value { font-size: 8pt; }
          .payment-section { display: flex; justify-content: space-between; margin: 3mm 0; padding: 2mm; border-bottom: 1px solid #ccc; }
          .payment-details { flex: 1; margin-right: 2mm; }
          .payment-row { display: flex; justify-content: space-between; margin: 1mm 0; font-size: 8pt; }
          .payment-label { font-weight: bold; min-width: 25mm; }
          .payment-value { text-align: right; flex: 1; }
          .amount-section { flex: 1; border-left: 1px solid #ccc; padding-left: 2mm; text-align: center; }
          .amount-label { font-weight: bold; font-size: 8pt; margin-bottom: 1mm; }
          .amount-figures { font-size: 11pt; font-weight: bold; color: #000; margin: 2mm 0; }
          .amount-words { font-size: 7pt; font-style: italic; color: #555; line-height: 1.1; padding: 1mm; background: #f8fafc; border-radius: 2px; }
          .balance-section { display: flex; justify-content: space-between; margin: 3mm 0; padding: 2mm; border: 1px solid #ccc; background-color: #f5f5f5; font-size: 8pt; }
          .balance-item { flex: 1; text-align: center; }
          .balance-label { font-weight: bold; margin-bottom: 1mm; }
          .balance-value { font-size: 9pt; font-weight: bold; }
          .signature-section { margin-top: 4mm; padding-top: 2mm; border-top: 1px solid #000; font-size: 7pt; }
          .signature-row { display: flex; justify-content: space-between; align-items: flex-end; }
          .signature-item { flex: 1; text-align: center; padding: 0 1mm; }
          .signature-line { width: 30mm; height: 1px; background: #000; margin: 10px auto 3px; }
          .warning-section { margin-top: 4mm; padding: 2mm; text-align: center; font-size: 7pt; color: #dc2626; font-weight: bold; border-top: 1px dashed #ccc; }
          @media print { .no-print { display: none !important; } .receipt-container { border: none; } body { margin: 0; padding: 0; } }
        </style>
      </head>
      <body>
        ${contenu}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>Aperçu du reçu</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {chargement ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Préparation du reçu...</p>
            </div>
          ) : (
            <>
              <div className="receipt-screen-preview">
                {estDuplicata && (
                  <div className="duplicata-badge">
                    DUPLICATA
                  </div>
                )}
                
                <div className="preview-header">
                  <div className="preview-school-info">
                    <div className="preview-school-name">
                      {parametresEcole?.nom_ecole || "École Excellence"}
                    </div>
                    <div className="preview-school-details">
                      {parametresEcole?.adresse || "Abidjan, Côte d'Ivoire"}<br />
                      Tél: {parametresEcole?.telephone || "+225 27 22 44 55 66"}<br />
                      Email: {parametresEcole?.email || "contact@ecole.ci"}
                    </div>
                  </div>
                  
                  <div className="preview-title">
                    REÇU DE PAIEMENT
                  </div>
                  
                  <div className="preview-year">
                    Année scolaire<br />
                    <strong>{paiement.annee_scolaire || "2024-2025"}</strong>
                  </div>
                </div>
                
                <div className="preview-receipt-number">
                  Reçu N°: <strong>{paiement.numero_recu || paiement.id.toString().padStart(6, '0')}</strong>
                  {estDuplicata && <span style={{color: 'red', marginLeft: '5px'}}>(DUPLICATA)</span>}
                </div>
                
                <div className="preview-student-section">
                  <div className="preview-student-info">
                    <div className="preview-student-label">L'élève :</div>
                    <div className="preview-student-value">
                      <strong>{paiement.eleve_prenom || ''} {paiement.eleve_nom || ''}</strong>
                      {paiement.eleve_matricule && (
                        <div className="preview-matricule">
                          Matricule: {paiement.eleve_matricule}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="preview-class-info">
                    <div className="preview-class-label">Classe :</div>
                    <div className="preview-class-value">
                      <strong>{paiement.classe_niveau || ''} {paiement.classe_nom || ''}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="preview-payment-section">
                  <div className="preview-payment-details">
                    <div className="preview-payment-row">
                      <span className="preview-payment-label">Catégorie :</span>
                      <span className="preview-payment-value">{paiement.categorie_nom || 'Frais scolaire'}</span>
                    </div>
                    <div className="preview-payment-row">
                      <span className="preview-payment-label">Mode de paiement :</span>
                      <span className="preview-payment-value">{getModePaiementLibelle(paiement.mode_paiement)}</span>
                    </div>
                    <div className="preview-payment-row">
                      <span className="preview-payment-label">Date :</span>
                      <span className="preview-payment-value">{formaterDate(paiement.date_paiement)}</span>
                    </div>
                    {paiement.reference_paiement && (
                      <div className="preview-payment-row">
                        <span className="preview-payment-label">Référence :</span>
                        <span className="preview-payment-value">{paiement.reference_paiement}</span>
                      </div>
                    )}
                    {paiement.numero_versement && (
                      <div className="preview-payment-row">
                        <span className="preview-payment-label">Versement :</span>
                        <span className="preview-payment-value">N° {paiement.numero_versement}</span>
                      </div>
                    )}
                    {details?.montant_total && details.montant_total > 0 && (
                      <div className="preview-payment-row">
                        <span className="preview-payment-label">Montant total :</span>
                        <span className="preview-payment-value">{formaterMontantFCFA(details.montant_total)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="preview-amount-section">
                    <div className="preview-amount-label">Montant de ce paiement :</div>
                    <div className="preview-amount-figures">
                      {formaterMontantFCFA(paiement.montant || 0)}
                    </div>
                    <div className="preview-amount-words">
                      {numeroEnLettres(paiement.montant || 0)}
                    </div>
                  </div>
                </div>
                
                <div className="preview-balance-section">
                  <div className="preview-balance-item">
                    <div className="preview-balance-label">Total payé à ce jour :</div>
                    <div className="preview-balance-value" style={{color: '#059669'}}>
                      {formaterMontantFCFA(details?.montant_paye_total || 0)}
                    </div>
                    <div style={{fontSize: '10px', color: '#666', marginTop: '2px'}}>
                      (cumul des versements)
                    </div>
                  </div>
                  <div className="preview-balance-item">
                    <div className="preview-balance-label">Reste à payer :</div>
                    <div className="preview-balance-value" style={{ color: (details?.reste_a_payer || 0) > 0 ? '#dc2626' : '#059669' }}>
                      {formaterMontantFCFA(details?.reste_a_payer || 0)}
                    </div>
                    {details?.montant_total && details.montant_total > 0 && (
                      <div style={{fontSize: '10px', color: '#666', marginTop: '2px'}}>
                        (sur {formaterMontantFCFA(details.montant_total)})
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="preview-signature-section">
                  <div className="preview-signature-row">
                    <div className="preview-signature-item">
                      <div>Fait à Abidjan, le {formaterDate(new Date().toISOString())}</div>
                    </div>
                    <div className="preview-signature-item">
                      <div className="preview-signature-line"></div>
                      <div>Signature et cachet de l'établissement</div>
                    </div>
                    <div className="preview-signature-item">
                      <div>Saisi par :</div>
                      <div><strong>{utilisateur?.prenom || 'Système'} {utilisateur?.nom || 'Admin'}</strong></div>
                    </div>
                  </div>
                </div>
                
                <div className="preview-warning-section">
                  ⚠️ Aucun remboursement ne se fera après le versement
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={onClose}
                >
                  Fermer
                </button>
                <button 
                  className="btn-primary"
                  onClick={imprimerRecu}
                >
                  {estDuplicata ? '🖨️ Imprimer le DUPLICATA' : '🖨️ Imprimer le reçu'}
                </button>
              </div>
            </>
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
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          max-width: 90%;
          max-height: 90vh;
          overflow: hidden;
        }
        
        .modal-content.large {
          width: 700px;
          max-width: 90%;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffffff;
          color: #ffffffff;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.3rem;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #000000ff;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-button:hover {
          background: rgba(131, 131, 131, 0.2);
        }
        
        .modal-body {
          padding: 20px;
          overflow-y: auto;
          max-height: calc(90vh - 70px);
        }
        
        .receipt-screen-preview {
          width: 297px;
          min-height: 420px;
          margin: 0 auto 20px;
          padding: 15px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background: white;
          position: relative;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.3;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .duplicata-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 40px;
          color: rgba(255, 0, 0, 0.15);
          font-weight: bold;
          z-index: 1;
          pointer-events: none;
        }
        
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          border-bottom: 1px solid #000;
          padding-bottom: 8px;
        }
        
        .preview-school-info {
          flex: 1;
          font-size: 10px;
          line-height: 1.2;
        }
        
        .preview-school-name {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 3px;
        }
        
        .preview-school-details {
          font-size: 9px;
          color: #555;
        }
        
        .preview-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          flex: 1;
          padding: 0 10px;
        }
        
        .preview-year {
          text-align: right;
          font-size: 10px;
          flex: 1;
        }
        
        .preview-receipt-number {
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          margin: 8px 0;
          padding: 5px;
          border: 1px solid #000;
          background-color: #f8fafc;
        }
        
        .preview-student-section {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px;
          border-bottom: 1px solid #ccc;
        }
        
        .preview-student-info, .preview-class-info {
          flex: 1;
        }
        
        .preview-student-label, .preview-class-label {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 3px;
        }
        
        .preview-student-value, .preview-class-value {
          font-size: 12px;
        }
        
        .preview-matricule {
          font-size: 10px;
          color: #666;
          margin-top: 2px;
        }
        
        .preview-payment-section {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px;
          border-bottom: 1px solid #ccc;
        }
        
        .preview-payment-details {
          flex: 1;
          margin-right: 10px;
        }
        
        .preview-payment-row {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }
        
        .preview-payment-label {
          font-weight: bold;
          min-width: 80px;
        }
        
        .preview-payment-value {
          text-align: right;
          flex: 1;
        }
        
        .preview-amount-section {
          flex: 1;
          border-left: 1px solid #ccc;
          padding-left: 10px;
          text-align: center;
        }
        
        .preview-amount-label {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 5px;
        }
        
        .preview-amount-figures {
          font-size: 16px;
          font-weight: bold;
          color: #000;
          margin: 5px 0;
        }
        
        .preview-amount-words {
          font-size: 10px;
          font-style: italic;
          color: #555;
          line-height: 1.2;
          padding: 5px;
          background: #f8fafc;
          border-radius: 3px;
          margin-top: 5px;
        }
        
        .preview-balance-section {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px;
          border: 1px solid #ccc;
          background-color: #f5f5f5;
        }
        
        .preview-balance-item {
          flex: 1;
          text-align: center;
        }
        
        .preview-balance-label {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 3px;
        }
        
        .preview-balance-value {
          font-size: 13px;
          font-weight: bold;
        }
        
        .preview-signature-section {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #000;
          font-size: 10px;
        }
        
        .preview-signature-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        
        .preview-signature-item {
          flex: 1;
          text-align: center;
          padding: 0 5px;
        }
        
        .preview-signature-line {
          width: 70px;
          height: 1px;
          background: #000;
          margin: 15px auto 5px;
        }
        
        .preview-warning-section {
          margin-top: 15px;
          padding: 8px;
          text-align: center;
          font-size: 10px;
          color: #dc2626;
          font-weight: bold;
          border-top: 1px dashed #ccc;
        }
        
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .btn-primary {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .btn-primary:hover {
          background: #2563eb;
        }
        
        .btn-secondary {
          padding: 10px 20px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .btn-secondary:hover {
          background: #e2e8f0;
        }
        
        @media (max-width: 768px) {
          .modal-content.large {
            width: 95%;
          }
          
          .receipt-screen-preview {
            width: 100%;
            transform: scale(0.9);
            transform-origin: top center;
          }
        }
      `}</style>
    </div>
  );
=======
'use client';

import { useState, useEffect, useRef } from 'react';
import { Paiement } from '@/app/types/finance';

interface ParametresEcole {
  nom_ecole: string;
  adresse: string;
  telephone: string;
  email: string;
  logo_url?: string;
  couleur_principale?: string;
}

interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  avatar_url?: string;
}

interface FraisEleveDetails {
  montant_total: number;
  montant_paye_total: number;
  reste_a_payer: number;
  montant_du_paiement: number;
}

interface ModalImprimerRecuProps {
  isOpen: boolean;
  onClose: () => void;
  paiement: Paiement;
  onSuccess?: () => void;
}

export default function ModalImprimerRecu({ isOpen, onClose, paiement, onSuccess }: ModalImprimerRecuProps) {
  const [chargement, setChargement] = useState(false);
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [estDuplicata, setEstDuplicata] = useState(false);
  const [details, setDetails] = useState<FraisEleveDetails | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen && paiement) {
      console.log('🔍 Données du paiement reçu:', {
        id: paiement.id,
        frais_eleve_id: paiement.frais_eleve_id,
        montant: paiement.montant,
        montant_paye: paiement.montant_paye,
        montant_total: paiement.montant_total,
        reste_a_payer: paiement.reste_a_payer,
        categorie: paiement.categorie_nom
      });
      
      chargerDonnees();
      verifierDuplicata();
      calculerDetails();
    }
  }, [isOpen, paiement]);
  
  const calculerDetails = () => {
    console.log('🧮 Calcul des détails pour le reçu');
    
    // Montant de ce paiement spécifique
    const montantDuPaiement = parseFloat(paiement.montant?.toString() || '0');
    
    // Si nous avons les données directement du paiement (montant_paye = total payé à ce jour)
    if (paiement.montant_total !== undefined && paiement.montant_paye !== undefined) {
      const montantTotal = parseFloat(paiement.montant_total.toString()) || 0;
      const montantPayeTotal = parseFloat(paiement.montant_paye.toString()) || 0;
      
      // IMPORTANT: montant_paye dans l'API est le TOTAL payé à ce jour
      // Le reste à payer = montant total - montant déjà payé
      const reste = Math.max(0, montantTotal - montantPayeTotal);
      
      console.log('📊 Calcul basé sur données paiement:', {
        montantTotal,
        montantPayeTotal,
        montantDuPaiement,
        reste
      });
      
      setDetails({
        montant_total: montantTotal,
        montant_paye_total: montantPayeTotal,
        reste_a_payer: reste,
        montant_du_paiement: montantDuPaiement
      });
      return;
    }
    
    // Si nous avons reste_a_payer directement
    if (paiement.reste_a_payer !== undefined) {
      const montantTotal = parseFloat(paiement.montant_total?.toString() || '0');
      const reste = parseFloat(paiement.reste_a_payer.toString()) || 0;
      
      // Calculer montant payé total = montant total - reste
      const montantPayeTotal = Math.max(0, montantTotal - reste);
      
      console.log('📊 Calcul basé sur reste_a_payer:', {
        montantTotal,
        montantPayeTotal,
        montantDuPaiement,
        reste
      });
      
      setDetails({
        montant_total: montantTotal,
        montant_paye_total: montantPayeTotal,
        reste_a_payer: reste,
        montant_du_paiement: montantDuPaiement
      });
      return;
    }
    
    // Valeurs par défaut
    console.log('⚠️ Données insuffisantes, valeurs par défaut');
    setDetails({
      montant_total: 0,
      montant_paye_total: montantDuPaiement,
      reste_a_payer: 0,
      montant_du_paiement: montantDuPaiement
    });
  };
  
  const chargerDonnees = async () => {
    try {
      setChargement(true);
      
      // Charger les paramètres de l'école
      const responseParametres = await fetch('/api/parametres/ecole');
      if (responseParametres.ok) {
        const data = await responseParametres.json();
        setParametresEcole(data.parametres);
      } else {
        setParametresEcole({
          nom_ecole: "École Excellence",
          adresse: "Abidjan, Côte d'Ivoire",
          telephone: "+225 27 22 44 55 66",
          email: "contact@ecole-excellence.ci"
        });
      }
      
      // Charger les informations de l'utilisateur
      if (paiement.created_by) {
        const responseUtilisateur = await fetch(`/api/utilisateurs/${paiement.created_by}`);
        if (responseUtilisateur.ok) {
          const data = await responseUtilisateur.json();
          if (data.success) {
            setUtilisateur(data.utilisateur);
          } else {
            setUtilisateur({
              id: 1,
              nom: "Administrateur",
              prenom: "Système",
              email: "admin@ecole.ci"
            });
          }
        }
      } else {
        setUtilisateur({
          id: 1,
          nom: "Administrateur",
          prenom: "Système",
          email: "admin@ecole.ci"
        });
      }
      
    } catch (error) {
      console.error('Erreur chargement données reçu:', error);
      setParametresEcole({
        nom_ecole: "École Excellence",
        adresse: "Abidjan, Côte d'Ivoire",
        telephone: "+225 27 22 44 55 66",
        email: "contact@ecole-excellence.ci"
      });
      setUtilisateur({
        id: 1,
        nom: "Administrateur",
        prenom: "Système",
        email: "admin@ecole.ci"
      });
    } finally {
      setChargement(false);
    }
  };
  
  const verifierDuplicata = async () => {
    try {
      const response = await fetch(`/api/finance/paiements/${paiement.id}/impression`);
      if (response.ok) {
        const data = await response.json();
        setEstDuplicata(!data.premiere_impression);
      }
    } catch (error) {
      console.error('Erreur vérification duplicata:', error);
    }
  };
  
  const formaterMontantFCFA = (montant: number): string => {
    if (isNaN(montant) || !isFinite(montant) || montant === null || montant === undefined) {
      return '0 FCFA';
    }
    
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant) + ' FCFA';
  };
  
  const formaterDate = (date: string) => {
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  };
  
  const numeroEnLettres = (nombre: number): string => {
    if (nombre <= 0) return 'zéro';
    
    const unite = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
    const dizaine = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
    const centaines = ['', 'cent', 'deux cent', 'trois cent', 'quatre cent', 'cinq cent', 'six cent', 'sept cent', 'huit cent', 'neuf cent'];
    
    let resultat = '';
    let n = Math.floor(nombre);
    
    // Gérer les millions
    if (n >= 1000000) {
      const millions = Math.floor(n / 1000000);
      resultat += (millions === 1 ? 'un million ' : `${numeroEnLettres(millions)} millions `);
      n %= 1000000;
    }
    
    // Gérer les milliers
    if (n >= 1000) {
      const milliers = Math.floor(n / 1000);
      if (milliers === 1) {
        resultat += 'mille ';
      } else {
        resultat += `${numeroEnLettres(milliers)} mille `;
      }
      n %= 1000;
    }
    
    // Gérer les centaines
    if (n >= 100) {
      const centaine = Math.floor(n / 100);
      resultat += centaines[centaine];
      if (centaine > 1 && n % 100 > 0) {
        resultat += ' ';
      } else if (centaine > 1) {
        resultat += 's ';
      } else {
        resultat += ' ';
      }
      n %= 100;
    }
    
    // Gérer les dizaines et unités
    if (n > 0) {
      if (n < 10) {
        resultat += unite[n];
      } else if (n < 20) {
        const exceptions = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
        resultat += exceptions[n - 10];
      } else {
        const d = Math.floor(n / 10);
        const u = n % 10;
        
        if (d === 7 || d === 9) {
          resultat += dizaine[d - 1];
          if (u === 1) {
            resultat += '-et-onze';
          } else if (u > 0) {
            resultat += '-' + unite[u + 10];
          } else {
            resultat += '-dix';
          }
        } else {
          resultat += dizaine[d];
          if (u > 0) {
            if (d === 1 || d === 7 || d === 9) {
              resultat += '-' + unite[u];
            } else if (d === 8 && u === 0) {
              resultat += 's';
            } else {
              resultat += (u === 1 && d !== 8) ? '-et-un' : '-' + unite[u];
            }
          }
        }
      }
    }
    
    return resultat.trim() + ' francs CFA';
  };
  
  const getModePaiementLibelle = (mode: string): string => {
    const modes: Record<string, string> = {
      'especes': 'Espèces',
      'cheque': 'Chèque',
      'virement': 'Virement',
      'carte': 'Carte bancaire',
      'mobile': 'Mobile Money',
      'autre': 'Autre'
    };
    return modes[mode] || mode;
  };
  
  const marquerCommeImprime = async () => {
    try {
      const response = await fetch(`/api/finance/paiements/${paiement.id}/marquer-imprime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEstDuplicata(false);
          if (onSuccess) onSuccess();
        }
      }
    } catch (error) {
      console.error('Erreur marquage impression:', error);
    }
  };
  
  const imprimerRecu = () => {
    if (!estDuplicata) {
      marquerCommeImprime();
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Récupérer les montants pour l'impression
    const montantPaiementActuel = details?.montant_du_paiement || parseFloat(paiement.montant?.toString() || '0');
    const totalPaye = details?.montant_paye_total || 0;
    const reste = details?.reste_a_payer || 0;
    const montantTotal = details?.montant_total || 0;
    
    console.log('🖨️ Montants pour impression:', {
      montantPaiementActuel,
      totalPaye,
      reste,
      montantTotal
    });
    
    const contenu = `
      <div class="receipt-container">
        ${estDuplicata ? '<div class="duplicata-overlay">DUPLICATA</div>' : ''}
        
        <!-- Section En-tête -->
        <div class="header-section">
          <div class="school-info">
            ${parametresEcole?.logo_url ? 
              `<img src="${parametresEcole.logo_url}" alt="Logo école" class="school-logo" />` : 
              ''
            }
            <div class="school-name">${parametresEcole?.nom_ecole || "École Excellence"}</div>
            <div class="school-details">
              ${parametresEcole?.adresse || "Abidjan, Côte d'Ivoire"}<br />
              Tél: ${parametresEcole?.telephone || "+225 27 22 44 55 66"}<br />
              Email: ${parametresEcole?.email || "contact@ecole.ci"}
            </div>
          </div>
          
          <div class="receipt-title">
            REÇU DE PAIEMENT
          </div>
          
          <div class="school-year">
            Année scolaire<br />
            <strong>${paiement.annee_scolaire || "2024-2025"}</strong>
          </div>
        </div>
        
        <!-- Numéro de reçu -->
        <div class="receipt-number">
          Reçu N°: <strong>${paiement.numero_recu || paiement.id.toString().padStart(6, '0')}</strong>
          ${estDuplicata ? '<span style="color: red; margin-left: 5px;">(DUPLICATA)</span>' : ''}
        </div>
        
        <!-- Section Info Élève -->
        <div class="student-section">
          <div class="student-info">
            <div class="student-label">L'élève :</div>
            <div class="student-value">
              <strong>${paiement.eleve_prenom || ''} ${paiement.eleve_nom || ''}</strong>
              ${paiement.eleve_matricule ? `<br />Matricule: ${paiement.eleve_matricule}` : ''}
            </div>
          </div>
          <div class="class-info">
            <div class="class-label">Classe :</div>
            <div class="class-value">
              <strong>${paiement.classe_niveau || ''} ${paiement.classe_nom || ''}</strong>
            </div>
          </div>
        </div>
        
        <!-- Section Info Paiement -->
        <div class="payment-section">
          <div class="payment-details">
            <div class="payment-row">
              <span class="payment-label">Catégorie :</span>
              <span class="payment-value">${paiement.categorie_nom || 'Frais scolaire'}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Mode de paiement :</span>
              <span class="payment-value">${getModePaiementLibelle(paiement.mode_paiement)}</span>
            </div>
            <div class="payment-row">
              <span class="payment-label">Date :</span>
              <span class="payment-value">${formaterDate(paiement.date_paiement)}</span>
            </div>
            ${paiement.reference_paiement ? `
              <div class="payment-row">
                <span class="payment-label">Référence :</span>
                <span class="payment-value">${paiement.reference_paiement}</span>
              </div>
            ` : ''}
            ${paiement.numero_versement ? `
              <div class="payment-row">
                <span class="payment-label">Versement :</span>
                <span class="payment-value">N° ${paiement.numero_versement}</span>
              </div>
            ` : ''}
            ${montantTotal > 0 ? `
              <div class="payment-row">
                <span class="payment-label">Montant total :</span>
                <span class="payment-value">${formaterMontantFCFA(montantTotal)}</span>
              </div>
            ` : ''}
          </div>
          
          <div class="amount-section">
            <div class="amount-label">Montant de ce paiement :</div>
            <div class="amount-figures">
              ${formaterMontantFCFA(montantPaiementActuel)}
            </div>
            <div class="amount-words">
              ${numeroEnLettres(montantPaiementActuel)}
            </div>
          </div>
        </div>
        
        <!-- Section Reste à Payer -->
        <div class="balance-section">
          <div class="balance-item">
            <div class="balance-label">Total payé à ce jour :</div>
            <div class="balance-value" style="color: #059669">
              ${formaterMontantFCFA(totalPaye)}
            </div>
            <div style="font-size: 7pt; color: #666; margin-top: 1mm;">
              (cumul des versements)
            </div>
          </div>
          <div class="balance-item">
            <div class="balance-label">Reste à payer :</div>
            <div class="balance-value" style="color: ${reste > 0 ? '#dc2626' : '#059669'}">
              ${formaterMontantFCFA(reste)}
            </div>
            ${montantTotal > 0 ? `
              <div style="font-size: 7pt; color: #666; margin-top: 1mm;">
                (sur ${formaterMontantFCFA(montantTotal)})
              </div>
            ` : ''}
          </div>
        </div>
        
        <!-- Section Signature -->
        <div class="signature-section">
          <div class="signature-row">
            <div class="signature-item">
              <div>Fait à Abidjan, le ${formaterDate(new Date().toISOString())}</div>
            </div>
            <div class="signature-item">
              <div class="signature-line"></div>
              <div>Signature et cachet de l'établissement</div>
            </div>
            <div class="signature-item">
              <div>Saisi par :</div>
              <div><strong>${utilisateur?.prenom || 'Système'} ${utilisateur?.nom || 'Admin'}</strong></div>
            </div>
          </div>
        </div>
        
        <!-- Section Avertissement -->
        <div class="warning-section">
          ⚠️ Aucun remboursement ne se fera après le versement
        </div>
      </div>
    `;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Reçu de paiement N°${paiement.numero_recu || paiement.id}</title>
        <meta charset="UTF-8">
        <style>
          @page { size: A5 portrait; margin: 3mm; }
          body { margin: 0; padding: 0; font-family: 'Arial', sans-serif; font-size: 9pt; line-height: 1.2; width: 99mm; }
          .receipt-container { width: 99mm; max-width: 99mm; min-height: 140mm; margin: 0 auto; padding: 4mm; box-sizing: border-box; position: relative; border: 1px solid #ccc; background: white; }
          .duplicata-overlay { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 32px; color: rgba(255, 0, 0, 0.15); font-weight: bold; z-index: 1000; pointer-events: none; opacity: 0.5; }
          .header-section { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 3mm; border-bottom: 1px solid #000; padding-bottom: 2mm; }
          .school-info { flex: 1; font-size: 7pt; line-height: 1.1; min-width: 30mm; }
          .school-logo { max-width: 15mm; max-height: 15mm; margin-bottom: 1mm; }
          .school-name { font-weight: bold; font-size: 8pt; margin-bottom: 0.5mm; color: #000; }
          .school-details { font-size: 6pt; color: #555; line-height: 1.1; }
          .receipt-title { text-align: center; font-size: 11pt; font-weight: bold; margin: 0; flex: 1; padding: 0 2mm; }
          .school-year { text-align: right; font-size: 7pt; flex: 1; min-width: 25mm; }
          .receipt-number { text-align: center; font-size: 9pt; font-weight: bold; margin: 2mm 0; padding: 1mm; border: 1px solid #000; background-color: #f8fafc; }
          .student-section { display: flex; justify-content: space-between; margin: 3mm 0; padding: 2mm; border-bottom: 1px solid #ccc; font-size: 8pt; }
          .student-info, .class-info { flex: 1; }
          .student-label, .class-label { font-weight: bold; font-size: 7pt; margin-bottom: 0.5mm; }
          .student-value, .class-value { font-size: 8pt; }
          .payment-section { display: flex; justify-content: space-between; margin: 3mm 0; padding: 2mm; border-bottom: 1px solid #ccc; }
          .payment-details { flex: 1; margin-right: 2mm; }
          .payment-row { display: flex; justify-content: space-between; margin: 1mm 0; font-size: 8pt; }
          .payment-label { font-weight: bold; min-width: 25mm; }
          .payment-value { text-align: right; flex: 1; }
          .amount-section { flex: 1; border-left: 1px solid #ccc; padding-left: 2mm; text-align: center; }
          .amount-label { font-weight: bold; font-size: 8pt; margin-bottom: 1mm; }
          .amount-figures { font-size: 11pt; font-weight: bold; color: #000; margin: 2mm 0; }
          .amount-words { font-size: 7pt; font-style: italic; color: #555; line-height: 1.1; padding: 1mm; background: #f8fafc; border-radius: 2px; }
          .balance-section { display: flex; justify-content: space-between; margin: 3mm 0; padding: 2mm; border: 1px solid #ccc; background-color: #f5f5f5; font-size: 8pt; }
          .balance-item { flex: 1; text-align: center; }
          .balance-label { font-weight: bold; margin-bottom: 1mm; }
          .balance-value { font-size: 9pt; font-weight: bold; }
          .signature-section { margin-top: 4mm; padding-top: 2mm; border-top: 1px solid #000; font-size: 7pt; }
          .signature-row { display: flex; justify-content: space-between; align-items: flex-end; }
          .signature-item { flex: 1; text-align: center; padding: 0 1mm; }
          .signature-line { width: 30mm; height: 1px; background: #000; margin: 10px auto 3px; }
          .warning-section { margin-top: 4mm; padding: 2mm; text-align: center; font-size: 7pt; color: #dc2626; font-weight: bold; border-top: 1px dashed #ccc; }
          @media print { .no-print { display: none !important; } .receipt-container { border: none; } body { margin: 0; padding: 0; } }
        </style>
      </head>
      <body>
        ${contenu}
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() {
              window.close();
            }, 500);
          };
        </script>
      </body>
      </html>
    `);
    
    printWindow.document.close();
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2>Aperçu du reçu</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {chargement ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Préparation du reçu...</p>
            </div>
          ) : (
            <>
              <div className="receipt-screen-preview">
                {estDuplicata && (
                  <div className="duplicata-badge">
                    DUPLICATA
                  </div>
                )}
                
                <div className="preview-header">
                  <div className="preview-school-info">
                    <div className="preview-school-name">
                      {parametresEcole?.nom_ecole || "École Excellence"}
                    </div>
                    <div className="preview-school-details">
                      {parametresEcole?.adresse || "Abidjan, Côte d'Ivoire"}<br />
                      Tél: {parametresEcole?.telephone || "+225 27 22 44 55 66"}<br />
                      Email: {parametresEcole?.email || "contact@ecole.ci"}
                    </div>
                  </div>
                  
                  <div className="preview-title">
                    REÇU DE PAIEMENT
                  </div>
                  
                  <div className="preview-year">
                    Année scolaire<br />
                    <strong>{paiement.annee_scolaire || "2024-2025"}</strong>
                  </div>
                </div>
                
                <div className="preview-receipt-number">
                  Reçu N°: <strong>{paiement.numero_recu || paiement.id.toString().padStart(6, '0')}</strong>
                  {estDuplicata && <span style={{color: 'red', marginLeft: '5px'}}>(DUPLICATA)</span>}
                </div>
                
                <div className="preview-student-section">
                  <div className="preview-student-info">
                    <div className="preview-student-label">L'élève :</div>
                    <div className="preview-student-value">
                      <strong>{paiement.eleve_prenom || ''} {paiement.eleve_nom || ''}</strong>
                      {paiement.eleve_matricule && (
                        <div className="preview-matricule">
                          Matricule: {paiement.eleve_matricule}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="preview-class-info">
                    <div className="preview-class-label">Classe :</div>
                    <div className="preview-class-value">
                      <strong>{paiement.classe_niveau || ''} {paiement.classe_nom || ''}</strong>
                    </div>
                  </div>
                </div>
                
                <div className="preview-payment-section">
                  <div className="preview-payment-details">
                    <div className="preview-payment-row">
                      <span className="preview-payment-label">Catégorie :</span>
                      <span className="preview-payment-value">{paiement.categorie_nom || 'Frais scolaire'}</span>
                    </div>
                    <div className="preview-payment-row">
                      <span className="preview-payment-label">Mode de paiement :</span>
                      <span className="preview-payment-value">{getModePaiementLibelle(paiement.mode_paiement)}</span>
                    </div>
                    <div className="preview-payment-row">
                      <span className="preview-payment-label">Date :</span>
                      <span className="preview-payment-value">{formaterDate(paiement.date_paiement)}</span>
                    </div>
                    {paiement.reference_paiement && (
                      <div className="preview-payment-row">
                        <span className="preview-payment-label">Référence :</span>
                        <span className="preview-payment-value">{paiement.reference_paiement}</span>
                      </div>
                    )}
                    {paiement.numero_versement && (
                      <div className="preview-payment-row">
                        <span className="preview-payment-label">Versement :</span>
                        <span className="preview-payment-value">N° {paiement.numero_versement}</span>
                      </div>
                    )}
                    {details?.montant_total && details.montant_total > 0 && (
                      <div className="preview-payment-row">
                        <span className="preview-payment-label">Montant total :</span>
                        <span className="preview-payment-value">{formaterMontantFCFA(details.montant_total)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="preview-amount-section">
                    <div className="preview-amount-label">Montant de ce paiement :</div>
                    <div className="preview-amount-figures">
                      {formaterMontantFCFA(paiement.montant || 0)}
                    </div>
                    <div className="preview-amount-words">
                      {numeroEnLettres(paiement.montant || 0)}
                    </div>
                  </div>
                </div>
                
                <div className="preview-balance-section">
                  <div className="preview-balance-item">
                    <div className="preview-balance-label">Total payé à ce jour :</div>
                    <div className="preview-balance-value" style={{color: '#059669'}}>
                      {formaterMontantFCFA(details?.montant_paye_total || 0)}
                    </div>
                    <div style={{fontSize: '10px', color: '#666', marginTop: '2px'}}>
                      (cumul des versements)
                    </div>
                  </div>
                  <div className="preview-balance-item">
                    <div className="preview-balance-label">Reste à payer :</div>
                    <div className="preview-balance-value" style={{ color: (details?.reste_a_payer || 0) > 0 ? '#dc2626' : '#059669' }}>
                      {formaterMontantFCFA(details?.reste_a_payer || 0)}
                    </div>
                    {details?.montant_total && details.montant_total > 0 && (
                      <div style={{fontSize: '10px', color: '#666', marginTop: '2px'}}>
                        (sur {formaterMontantFCFA(details.montant_total)})
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="preview-signature-section">
                  <div className="preview-signature-row">
                    <div className="preview-signature-item">
                      <div>Fait à Abidjan, le {formaterDate(new Date().toISOString())}</div>
                    </div>
                    <div className="preview-signature-item">
                      <div className="preview-signature-line"></div>
                      <div>Signature et cachet de l'établissement</div>
                    </div>
                    <div className="preview-signature-item">
                      <div>Saisi par :</div>
                      <div><strong>{utilisateur?.prenom || 'Système'} {utilisateur?.nom || 'Admin'}</strong></div>
                    </div>
                  </div>
                </div>
                
                <div className="preview-warning-section">
                  ⚠️ Aucun remboursement ne se fera après le versement
                </div>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={onClose}
                >
                  Fermer
                </button>
                <button 
                  className="btn-primary"
                  onClick={imprimerRecu}
                >
                  {estDuplicata ? '🖨️ Imprimer le DUPLICATA' : '🖨️ Imprimer le reçu'}
                </button>
              </div>
            </>
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
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
          max-width: 90%;
          max-height: 90vh;
          overflow: hidden;
        }
        
        .modal-content.large {
          width: 700px;
          max-width: 90%;
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px 20px;
          border-bottom: 1px solid #e5e7eb;
          background: #ffffffff;
          color: #ffffffff;
        }
        
        .modal-header h2 {
          margin: 0;
          font-size: 1.3rem;
        }
        
        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #000000ff;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .close-button:hover {
          background: rgba(131, 131, 131, 0.2);
        }
        
        .modal-body {
          padding: 20px;
          overflow-y: auto;
          max-height: calc(90vh - 70px);
        }
        
        .receipt-screen-preview {
          width: 297px;
          min-height: 420px;
          margin: 0 auto 20px;
          padding: 15px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background: white;
          position: relative;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.3;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .duplicata-badge {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 40px;
          color: rgba(255, 0, 0, 0.15);
          font-weight: bold;
          z-index: 1;
          pointer-events: none;
        }
        
        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 10px;
          border-bottom: 1px solid #000;
          padding-bottom: 8px;
        }
        
        .preview-school-info {
          flex: 1;
          font-size: 10px;
          line-height: 1.2;
        }
        
        .preview-school-name {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 3px;
        }
        
        .preview-school-details {
          font-size: 9px;
          color: #555;
        }
        
        .preview-title {
          text-align: center;
          font-size: 14px;
          font-weight: bold;
          flex: 1;
          padding: 0 10px;
        }
        
        .preview-year {
          text-align: right;
          font-size: 10px;
          flex: 1;
        }
        
        .preview-receipt-number {
          text-align: center;
          font-size: 12px;
          font-weight: bold;
          margin: 8px 0;
          padding: 5px;
          border: 1px solid #000;
          background-color: #f8fafc;
        }
        
        .preview-student-section {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px;
          border-bottom: 1px solid #ccc;
        }
        
        .preview-student-info, .preview-class-info {
          flex: 1;
        }
        
        .preview-student-label, .preview-class-label {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 3px;
        }
        
        .preview-student-value, .preview-class-value {
          font-size: 12px;
        }
        
        .preview-matricule {
          font-size: 10px;
          color: #666;
          margin-top: 2px;
        }
        
        .preview-payment-section {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px;
          border-bottom: 1px solid #ccc;
        }
        
        .preview-payment-details {
          flex: 1;
          margin-right: 10px;
        }
        
        .preview-payment-row {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }
        
        .preview-payment-label {
          font-weight: bold;
          min-width: 80px;
        }
        
        .preview-payment-value {
          text-align: right;
          flex: 1;
        }
        
        .preview-amount-section {
          flex: 1;
          border-left: 1px solid #ccc;
          padding-left: 10px;
          text-align: center;
        }
        
        .preview-amount-label {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 5px;
        }
        
        .preview-amount-figures {
          font-size: 16px;
          font-weight: bold;
          color: #000;
          margin: 5px 0;
        }
        
        .preview-amount-words {
          font-size: 10px;
          font-style: italic;
          color: #555;
          line-height: 1.2;
          padding: 5px;
          background: #f8fafc;
          border-radius: 3px;
          margin-top: 5px;
        }
        
        .preview-balance-section {
          display: flex;
          justify-content: space-between;
          margin: 10px 0;
          padding: 8px;
          border: 1px solid #ccc;
          background-color: #f5f5f5;
        }
        
        .preview-balance-item {
          flex: 1;
          text-align: center;
        }
        
        .preview-balance-label {
          font-weight: bold;
          font-size: 11px;
          margin-bottom: 3px;
        }
        
        .preview-balance-value {
          font-size: 13px;
          font-weight: bold;
        }
        
        .preview-signature-section {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #000;
          font-size: 10px;
        }
        
        .preview-signature-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        
        .preview-signature-item {
          flex: 1;
          text-align: center;
          padding: 0 5px;
        }
        
        .preview-signature-line {
          width: 70px;
          height: 1px;
          background: #000;
          margin: 15px auto 5px;
        }
        
        .preview-warning-section {
          margin-top: 15px;
          padding: 8px;
          text-align: center;
          font-size: 10px;
          color: #dc2626;
          font-weight: bold;
          border-top: 1px dashed #ccc;
        }
        
        .loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px;
        }
        
        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }
        
        .btn-primary {
          padding: 10px 20px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .btn-primary:hover {
          background: #2563eb;
        }
        
        .btn-secondary {
          padding: 10px 20px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }
        
        .btn-secondary:hover {
          background: #e2e8f0;
        }
        
        @media (max-width: 768px) {
          .modal-content.large {
            width: 95%;
          }
          
          .receipt-screen-preview {
            width: 100%;
            transform: scale(0.9);
            transform-origin: top center;
          }
        }
      `}</style>
    </div>
  );
>>>>>>> 32d4e54ab2267c749063a541db8ca8150d07c1c5
}