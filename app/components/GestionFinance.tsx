'use client';

import { useState, useEffect } from 'react';
import GestionFraisClasses from './GestionFraisClasses'; 
import GestionPaiements from './GestionPaiements';
import './GestionFinance.css';
import './GestionFinanceSombre.css';
import GestionBudget from './GestionBudget';
import DashboardIntelligent from './DashboardIntelligent';

// Interface pour les paramètres de l'école
interface ParametresEcole {
  id: number;
  nom_ecole: string;
  slogan: string;
  adresse: string;
  telephone: string;
  email: string;
  logo_url: string | null;
  couleur_principale: string;
  annee_scolaire: string;
}

// Interface pour les paramètres de l'application
interface ParametresApp {
  id: number;
  devise: string;
  symbole_devise: string;
  format_date: string;
  fuseau_horaire: string;
  langue_defaut: string;
  theme_defaut: string;
}

interface StatistiquesFinancieres {
  total_recettes: number;
  total_depenses: number;
  solde_actuel: number;
  frais_impayes: number;
  frais_en_retard: number;
  evolution_mensuelle: { mois: string; recettes: number; depenses: number }[];
  repartition_recettes: { categorie: string; montant: number }[];
  repartition_depenses: { categorie: string; montant: number }[];
}

interface Transaction {
  id: number;
  type: 'entree' | 'sortie';
  categorie: string;
  montant: number;
  description?: string;
  date_transaction: string;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'carte' | 'autre';
  reference?: string;
  beneficiaire?: string;
  statut: 'confirme' | 'en_attente' | 'annule';
  created_by: number;
  created_at: string;
}

interface Props {
  onRetourTableauDeBord: () => void;
}

export default function GestionFinance({ onRetourTableauDeBord }: Props) {
  const [ongletActif, setOngletActif] = useState('tableau-de-bord-intelligent');
  const [statistiques, setStatistiques] = useState<StatistiquesFinancieres | null>(null);
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp | null>(null);

  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);
  const [alerte, setAlerte] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const [formTransaction, setFormTransaction] = useState({
    type: 'entree' as 'entree' | 'sortie',
    categorie: '',
    montant: 0,
    description: '',
    date_transaction: new Date().toISOString().split('T')[0],
    mode_paiement: 'especes' as 'especes' | 'cheque' | 'virement' | 'carte' | 'autre',
    reference: '',
    beneficiaire: ''
  });

  useEffect(() => {
    chargerDonneesInitiales();
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [ongletActif]);

  useEffect(() => {
    if (alerte) {
      const timer = setTimeout(() => {
        setAlerte(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [alerte]);

  // ==================== FONCTIONS DE FORMATAGE DYNAMIQUE ====================

  // Formater une date selon la configuration
  const formaterDate = (date: Date | string): string => {
    if (!parametresApp) {
      return new Date(date).toLocaleDateString('fr-FR');
    }
    
    const d = new Date(date);
    const jour = d.getDate().toString().padStart(2, '0');
    const mois = (d.getMonth() + 1).toString().padStart(2, '0');
    const annee = d.getFullYear();
    const anneeCourt = annee.toString().slice(-2);
    
    switch (parametresApp.format_date) {
      case 'dd/mm/yyyy':
        return `${jour}/${mois}/${annee}`;
      case 'mm/dd/yyyy':
        return `${mois}/${jour}/${annee}`;
      case 'yyyy-mm-dd':
        return `${annee}-${mois}-${jour}`;
      case 'dd.mm.yyyy':
        return `${jour}.${mois}.${annee}`;
      case 'dd/mm/yy':
        return `${jour}/${mois}/${anneeCourt}`;
      default:
        return `${jour}/${mois}/${annee}`;
    }
  };

  // Formater un montant selon la devise configurée
  const formaterMontant = (montant: number): string => {
    if (!parametresApp) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF'
      }).format(montant).replace('XOF', 'F CFA');
    }
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: parametresApp.devise,
        currencyDisplay: 'code'
      }).format(montant).replace(parametresApp.devise, parametresApp.symbole_devise);
    } catch (error) {
      console.error('Erreur formatage montant:', error);
      return `${montant.toLocaleString('fr-FR')} ${parametresApp.symbole_devise}`;
    }
  };

  // Formater une devise pour l'affichage
  const formaterDevise = (montant: number): string => {
    if (!parametresApp) {
      return montant.toLocaleString('fr-FR') + ' F CFA';
    }
    return montant.toLocaleString('fr-FR') + ' ' + parametresApp.symbole_devise;
  };

  // ==================== CHARGEMENT DES DONNÉES ====================

  const chargerDonneesInitiales = async () => {
    try {
      await Promise.all([
        chargerParametresEcole(),
        chargerParametresApp()
      ]);
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
    }
  };

  const chargerParametresEcole = async () => {
    try {
      const response = await fetch('/api/parametres/ecole');
      const data = await response.json();
      if (data.success) {
        setParametresEcole(data.parametres);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres école:', error);
    }
  };

  const chargerParametresApp = async () => {
    try {
      const response = await fetch('/api/parametres/application');
      const data = await response.json();
      if (data.success && data.parametres) {
        setParametresApp(data.parametres);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres app:', error);
      // Valeurs par défaut en cas d'erreur
      setParametresApp({
        id: 1,
        devise: 'XOF',
        symbole_devise: 'F CFA',
        format_date: 'dd/mm/yyyy',
        fuseau_horaire: 'Africa/Abidjan',
        langue_defaut: 'fr',
        theme_defaut: 'clair'
      });
    }
  };

  const chargerDonnees = async () => {
    setChargement(true);
    setErreurChargement(null);
    
    try {
      if (ongletActif === 'tableau-de-bord-intelligent') {
        await chargerStatistiques();
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setErreurChargement('Erreur lors du chargement des données');
      setAlerte({ type: 'error', message: 'Erreur lors du chargement des données' });
    } finally {
      setChargement(false);
    }
  };

  const chargerStatistiques = async () => {
    try {
      console.log('🔄 Chargement statistiques...');
      const response = await fetch('/api/finance/statistiques');
      
      if (!response.ok) {
        console.warn('⚠️ Statut HTTP non-200, utilisation données par défaut');
        utiliserStatistiquesParDefaut();
        return;
      }
      
      const data = await response.json();
      console.log('📊 Données statistiques reçues:', data);

      if (data.success && data.statistiques) {
        setStatistiques(data.statistiques);
      } else {
        console.warn('⚠️ Données statistiques invalides, utilisation données par défaut');
        utiliserStatistiquesParDefaut();
      }
    } catch (error: any) {
      console.error('💥 Erreur chargement statistiques:', error);
      setErreurChargement(`Impossible de charger les statistiques: ${error.message}`);
      utiliserStatistiquesParDefaut();
    }
  };

  const utiliserStatistiquesParDefaut = () => {
    const statistiquesParDefaut: StatistiquesFinancieres = {
      total_recettes: 0,
      total_depenses: 0,
      solde_actuel: 0,
      frais_impayes: 0,
      frais_en_retard: 0,
      evolution_mensuelle: [],
      repartition_recettes: [],
      repartition_depenses: []
    };
    setStatistiques(statistiquesParDefaut);
  };

  // Fonction pour naviguer vers l'onglet budget
  const handleNavigateToBudget = () => {
    setOngletActif('budget');
  };

  // Fonction pour générer un rapport financier
  const genererRapportFinancier = () => {
    if (!statistiques) return;
    
    const dateImpression = formaterDate(new Date());
    const heureImpression = new Date().toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    const contenuImprimable = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport Financier - ${parametresEcole?.nom_ecole || 'Établissement'}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            background: #fff;
          }
          .header {
            text-align: center;
            border-bottom: 4px solid ${parametresEcole?.couleur_principale || '#3B82F6'};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .school-name {
            font-size: 28px;
            font-weight: bold;
            color: ${parametresEcole?.couleur_principale || '#2c3e50'};
            margin: 10px 0;
            text-transform: uppercase;
          }
          .school-info {
            color: #666;
            font-size: 14px;
            margin: 5px 0;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
          }
          .report-title {
            font-size: 24px;
            margin: 20px 0;
            color: #34495e;
            background: linear-gradient(90deg, ${parametresEcole?.couleur_principale || '#3B82F6'}20, transparent);
            padding: 15px;
            border-radius: 5px;
            text-align: center;
          }
          .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
          }
          .card {
            padding: 20px;
            border-radius: 10px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          .card.positive {
            background: linear-gradient(135deg, #10b98120, #05966920);
            border-color: #10b981;
          }
          .card.negative {
            background: linear-gradient(135deg, #ef444420, #dc262620);
            border-color: #ef4444;
          }
          .card-value {
            font-size: 32px;
            font-weight: bold;
            color: #1e293b;
            margin: 10px 0;
          }
          .card-label {
            font-size: 14px;
            color: #64748b;
            text-transform: uppercase;
          }
          .table-container {
            margin: 30px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: ${parametresEcole?.couleur_principale || '#3B82F6'};
            color: white;
            padding: 12px;
            text-align: left;
          }
          td {
            padding: 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #7f8c8d;
            font-size: 12px;
          }
          .date-print {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-bottom: 20px;
          }
          .logo-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 10px;
          }
          .logo-img {
            max-height: 60px;
            max-width: 60px;
            object-fit: contain;
          }
          .summary-total {
            margin-top: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #f8fafc, #e2e8f0);
            border-radius: 8px;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="date-print">
          Rapport généré le: ${dateImpression} à ${heureImpression}
        </div>
        
        <div class="header">
          <div class="logo-header">
            ${parametresEcole?.logo_url ? `<img src="${parametresEcole.logo_url}" class="logo-img" alt="Logo">` : ''}
            <div>
              <div class="school-name">${parametresEcole?.nom_ecole || "ÉTABLISSEMENT SCOLAIRE"}</div>
              <div class="school-info">
                ${parametresEcole?.adresse ? `<span>📍 ${parametresEcole.adresse}</span>` : ''}
                ${parametresEcole?.telephone ? `<span>📞 ${parametresEcole.telephone}</span>` : ''}
                ${parametresEcole?.email ? `<span>✉️ ${parametresEcole.email}</span>` : ''}
              </div>
            </div>
          </div>
          
          <div class="report-title">
            RAPPORT FINANCIER • ${parametresEcole?.annee_scolaire || new Date().getFullYear()}
          </div>
        </div>
        
        <div class="summary-cards">
          <div class="card positive">
            <div class="card-label">Total Recettes</div>
            <div class="card-value">${formaterMontant(statistiques.total_recettes)}</div>
          </div>
          <div class="card negative">
            <div class="card-label">Total Dépenses</div>
            <div class="card-value">${formaterMontant(statistiques.total_depenses)}</div>
          </div>
          <div class="card ${statistiques.solde_actuel >= 0 ? 'positive' : 'negative'}">
            <div class="card-label">Solde Actuel</div>
            <div class="card-value">${formaterMontant(statistiques.solde_actuel)}</div>
          </div>
          <div class="card negative">
            <div class="card-label">Frais Impayés</div>
            <div class="card-value">${formaterMontant(statistiques.frais_impayes)}</div>
          </div>
        </div>
        
        ${statistiques.evolution_mensuelle.length > 0 ? `
          <div class="table-container">
            <h3>📊 Évolution Mensuelle</h3>
            <table>
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Recettes</th>
                  <th>Dépenses</th>
                  <th>Solde</th>
                </tr>
              </thead>
              <tbody>
                ${statistiques.evolution_mensuelle.map(item => `
                  <tr>
                    <td><strong>${item.mois}</strong></td>
                    <td style="color: #10b981;">${formaterMontant(item.recettes)}</td>
                    <td style="color: #ef4444;">${formaterMontant(item.depenses)}</td>
                    <td style="font-weight: bold; color: ${item.recettes - item.depenses >= 0 ? '#10b981' : '#ef4444'}">
                      ${formaterMontant(item.recettes - item.depenses)}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}
        
        <div class="summary-total">
          <div>SOLDE GLOBAL: <span style="color: ${statistiques.solde_actuel >= 0 ? '#10b981' : '#ef4444'}">
            ${formaterMontant(statistiques.solde_actuel)}
          </span></div>
          <div style="font-size: 14px; margin-top: 10px; color: #666;">
            Frais en retard: ${formaterMontant(statistiques.frais_en_retard)}
          </div>
        </div>
        
        <div class="footer">
          <div>Document généré par le Système de Gestion Scolaire</div>
          <div>Rapport financier • ${formaterDate(new Date())}</div>
          <div style="margin-top: 10px; color: #aaa; font-size: 10px;">
            Ce document est confidentiel.
          </div>
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          };
        </script>
      </body>
      </html>
    `;
    
    const fenetreImpression = window.open('', '_blank');
    if (fenetreImpression) {
      fenetreImpression.document.write(contenuImprimable);
      fenetreImpression.document.close();
    } else {
      setAlerte({ type: 'error', message: 'Veuillez autoriser les popups pour l\'impression' });
    }
  };

  if (chargement && ongletActif !== 'frais') {
    return (
      <div className={`chargement-finance ${parametresApp?.theme_defaut || 'clair'}`}>
        <div className="spinner-grand"></div>
        <p>Chargement des données financières...</p>
      </div>
    );
  }

  const getThemeClass = () => {
  return parametresApp?.theme_defaut === 'sombre' ? 'sombre' : '';
};

  return (
    <div className={`conteneur-gestion-finance ${parametresApp?.theme_defaut || 'clair'}`}>
      {/* En-tête avec informations dynamiques */}
      <div className="en-tete-fixe-eleves">
        <div className="conteneur-en-tete-fixe-eleves">
          <div className="titre-fixe-eleves">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>💵</span> 
              <h1>
                Gestion Financière
              </h1>
            </div>
          </div>
        </div>
        {/* Navigation par onglets */}
      <div className="navigation-finance">
        <button 
          className={`onglet-finance ${ongletActif === 'tableau-de-bord-intelligent' ? 'actif' : ''}`}
          onClick={() => setOngletActif('tableau-de-bord-intelligent')}
        >
          🖥️ Tableau de Bord
        </button>
        <button 
          className={`onglet-finance ${ongletActif === 'frais-classes' ? 'actif' : ''}`}
          onClick={() => setOngletActif('frais-classes')}
        >
          🎯 Frais Scolaires
        </button>
        <button 
          className={`onglet-finance ${ongletActif === 'paiements' ? 'actif' : ''}`}
          onClick={() => setOngletActif('paiements')}
        >
          💰 Paiements
        </button>
        <button 
          className={`onglet-finance ${ongletActif === 'budget' ? 'actif' : ''}`}
          onClick={() => setOngletActif('budget')}
        >
          📋 Budget
        </button>
      </div>
      </div>

      {/* Alertes */}
      {alerte && (
        <div className={`alerte-modern ${alerte.type === 'success' ? 'alerte-succes-modern' : 'alerte-erreur-modern'}`}>
          <div className="contenu-alerte-modern">
            <div className="icone-alerte-modern">
              {alerte.type === 'success' ? '✅' : '❌'}
            </div>
            <div className="texte-alerte-modern">
              <span className="titre-alerte">{alerte.type === 'success' ? 'Succès' : 'Erreur'}</span>
              <span className="message-alerte">{alerte.message}</span>
            </div>
            <button 
              className="bouton-fermer-alerte-modern"
              onClick={() => setAlerte(null)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message d'erreur de chargement */}
      {erreurChargement && (
        <div className="alerte-avertissement">
          <div className="contenu-alerte-avertissement">
            <div className="icone-alerte-avertissement">⚠️</div>
            <div className="texte-alerte-avertissement">
              <span className="titre-alerte">Avertissement</span>
              <span className="message-alerte">
                {erreurChargement}. Les données affichées peuvent être incomplètes.
              </span>
            </div>
          </div>
        </div>
      )}

      

      {/* Contenu des onglets */}
      <div className="contenu-finance">
        
        {ongletActif === 'tableau-de-bord-intelligent' && (
          <DashboardIntelligent onNavigateToBudget={handleNavigateToBudget} />
        )}

        {ongletActif === 'frais-classes' && (
          <GestionFraisClasses 
            formaterMontant={formaterMontant}
            formaterDate={formaterDate}
            deviseSymbole={parametresApp?.symbole_devise || 'F CFA'}
          />
        )}

        {ongletActif === 'paiements' && (
          <GestionPaiements />
        )}

        {ongletActif === 'budget' && (
          <GestionBudget 
            formaterMontant={formaterMontant}
            formaterDate={formaterDate}
            deviseSymbole={parametresApp?.symbole_devise || 'F CFA'}
          />
        )}
      </div>
    </div>
  );
}