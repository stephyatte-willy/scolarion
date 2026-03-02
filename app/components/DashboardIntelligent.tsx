'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  ChartOptions,
  TooltipItem
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface DashboardStats {
  // Indicateurs clés
  total_recettes: number;
  total_depenses: number;
  solde_actuel: number;
  previsions_budget: number;
  budget_restant: number;
  pourcentage_budget_utilise: number;
  
  // Frais
  total_frais_a_payer: number;
  total_frais_payes: number;
  total_impayes: number;
  total_en_retard: number;
  taux_recouvrement: number;
  
  // Paiements
  nombre_paiements_jour: number;
  montant_paiements_jour: number;
  nombre_paiements_mois: number;
  montant_paiements_mois: number;
  nombre_paiements_annee: number;
  montant_paiements_annee: number;
  
  // Élèves
  nombre_eleves_avec_impaye: number;
  nombre_eleves_a_jour: number;
  
  // Statistiques par classe
  stats_par_classe: Array<{
    classe: string;
    total_a_payer: number;
    total_paye: number;
    taux_recouvrement: number;
    nombre_eleves: number;
    eleves_impayes: number;
  }>;
  
  // Statistiques par catégorie de frais
  stats_par_categorie: Array<{
    categorie: string;
    total_a_payer: number;
    total_paye: number;
    taux_recouvrement: number;
  }>;
  
  // Évolution mensuelle
  evolution_mensuelle: Array<{
    mois: string;
    recettes: number;
    depenses: number;
    solde: number;
    previsions: number;
  }>;
  
  // Dernières transactions
  dernieres_transactions: Array<{
    id: number;
    type: 'recette' | 'depense';
    description: string;
    montant: number;
    date: string;
    categorie: string;
    reference?: string;
  }>;
  
  // Alertes
  alertes: Array<{
    type: 'warning' | 'danger' | 'info' | 'success';
    message: string;
    action?: string;
  }>;
  
  // Année scolaire
  annee_scolaire: string;
}

// Interface pour les impayés
interface EleveImpaye {
  id: number;
  eleve_id: number;
  eleve_nom: string;
  eleve_prenom: string;
  eleve_matricule: string;
  classe: string;
  classe_id: number;
  categorie_frais: string;
  categorie_id: number;
  periodicite: string;
  montant_total: number;
  montant_paye: number;
  reste_a_payer: number;
  date_echeance: string;
  jours_retard: number;
  telephone_parent: string;
  email_parent: string;
  statut: 'en_attente' | 'en_retard' | 'partiel';
  annee_scolaire: string;
}

interface DashboardIntelligentProps {
  onNavigateToBudget?: () => void;
  theme?: string; // Ajoutez cette ligne
}

interface FiltresImpayes {
  classe_id: string;
  categorie_id: string;
  statut: 'tous' | 'en_retard' | 'partiel';
  recherche: string;
}

export default function DashboardIntelligent({ onNavigateToBudget }: DashboardIntelligentProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsFiltrees, setStatsFiltrees] = useState<DashboardStats | null>(null);
  const [chargement, setChargement] = useState(true);
  const [periode, setPeriode] = useState<'jour' | 'mois' | 'annee'>('mois');
  const [alerte, setAlerte] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null);
  const [parametresEcole, setParametresEcole] = useState<any>(null);
  const [exportEnCours, setExportEnCours] = useState(false);
  
  // États pour les impayés
  const [impayes, setImpayes] = useState<EleveImpaye[]>([]);
  const [impayesFiltres, setImpayesFiltres] = useState<EleveImpaye[]>([]);
  const [modalImpayesOuverte, setModalImpayesOuverte] = useState(false);
  const [chargementImpayes, setChargementImpayes] = useState(false);
  const [filtresImpayes, setFiltresImpayes] = useState<FiltresImpayes>({
    classe_id: '',
    categorie_id: '',
    statut: 'tous',
    recherche: ''
  });
  const [categoriesImpayes, setCategoriesImpayes] = useState<Array<{id: number, nom: string}>>([]);
  const [classesImpayes, setClassesImpayes] = useState<Array<{id: number, nom: string, niveau: string}>>([]);
  
  // Référence pour l'impression
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chargerDonnees();
    chargerParametresEcole();
    
    // Rafraîchir toutes les 5 minutes
    const interval = setInterval(() => {
      chargerDonnees();
    }, 300000);
    
    return () => clearInterval(interval);
  }, []);

  // Appliquer les filtres quand la période change
  useEffect(() => {
    if (stats) {
      appliquerFiltres(periode);
    }
  }, [periode, stats]);

  // Effet pour appliquer les filtres aux impayés
  useEffect(() => {
    if (impayes.length > 0) {
      appliquerFiltresImpayes();
    }
  }, [filtresImpayes, impayes]);

  const chargerParametresEcole = async () => {
    try {
      const response = await fetch('/api/parametres/ecole');
      const data = await response.json();
      if (data.success) {
        setParametresEcole(data.parametres);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

 // Dans la fonction chargerDonnees, après avoir reçu les données
const chargerDonnees = async () => {
  setChargement(true);
  try {
    console.log('🔄 Chargement des statistiques du tableau de bord...');
    
    const response = await fetch('/api/finance/dashboard-stats');
    const data = await response.json();
    
    if (data.success) {
      // CORRECTION: Calculer correctement le nombre d'élèves impayés
      const statsCorrigees = {
        ...data.stats,
        // S'assurer que nombre_eleves_avec_impaye est basé sur les vrais impayés
        nombre_eleves_avec_impaye: data.stats.nombre_eleves_avec_impaye || 0,
        // Ajouter un champ pour le nombre total d'élèves si nécessaire
        total_eleves: data.stats.total_eleves || 0
      };
      
      setStats(statsCorrigees);
      appliquerFiltres(periode, statsCorrigees);
      console.log('✅ Statistiques chargées:', statsCorrigees);
    } else {
      console.error('❌ Erreur chargement stats:', data.erreur);
      setAlerte({ type: 'error', message: data.erreur || 'Erreur de chargement' });
    }
  } catch (error: any) {
    console.error('❌ Erreur chargement dashboard:', error);
    setAlerte({ type: 'error', message: `Erreur: ${error.message}` });
  } finally {
    setChargement(false);
  }
};

  // Fonction pour appliquer les filtres de période
  const appliquerFiltres = (periodeSelectionnee: 'jour' | 'mois' | 'annee', donneesStats = stats) => {
    if (!donneesStats) return;
    
    const statsClone = JSON.parse(JSON.stringify(donneesStats)) as DashboardStats;
    
    if (periodeSelectionnee === 'jour') {
      statsClone.total_recettes = donneesStats.montant_paiements_jour;
      statsClone.nombre_paiements_annee = donneesStats.nombre_paiements_jour;
      statsClone.montant_paiements_annee = donneesStats.montant_paiements_jour;
    } else if (periodeSelectionnee === 'mois') {
      statsClone.total_recettes = donneesStats.montant_paiements_mois;
      statsClone.nombre_paiements_annee = donneesStats.nombre_paiements_mois;
      statsClone.montant_paiements_annee = donneesStats.montant_paiements_mois;
    } else {
      statsClone.total_recettes = donneesStats.total_recettes;
      statsClone.nombre_paiements_annee = donneesStats.nombre_paiements_annee;
      statsClone.montant_paiements_annee = donneesStats.montant_paiements_annee;
    }
    
    if (periodeSelectionnee === 'mois') {
      statsClone.evolution_mensuelle = donneesStats.evolution_mensuelle.slice(-1);
    } else if (periodeSelectionnee === 'annee') {
      statsClone.evolution_mensuelle = donneesStats.evolution_mensuelle;
    } else {
      statsClone.evolution_mensuelle = [];
    }
    
    setStatsFiltrees(statsClone);
  };

  // ✅ Fonction pour charger les impayés
  const chargerImpayes = async () => {
    setChargementImpayes(true);
    try {
      console.log('🔄 Chargement des impayés...');
      
      const response = await fetch('/api/finance/impayes');
      const data = await response.json();
      
      if (data.success) {
        setImpayes(data.impayes);
        setImpayesFiltres(data.impayes);
        
        // Extraire les catégories uniques
        const categories = data.impayes
          .map((i: EleveImpaye) => ({ id: i.categorie_id, nom: i.categorie_frais }))
          .filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i);
        setCategoriesImpayes(categories);
        
        // Extraire les classes uniques
        const classesList = data.impayes
          .map((i: EleveImpaye) => ({ id: i.classe_id, nom: i.classe, niveau: '' }))
          .filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i);
        setClassesImpayes(classesList);
        
        console.log(`✅ ${data.impayes.length} impayés chargés`);
      } else {
        setAlerte({ type: 'error', message: data.erreur || 'Erreur chargement impayés' });
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement impayés:', error);
      setAlerte({ type: 'error', message: `Erreur: ${error.message}` });
    } finally {
      setChargementImpayes(false);
    }
  };

  // ✅ Fonction pour appliquer les filtres aux impayés
  const appliquerFiltresImpayes = () => {
    let filtres = [...impayes];
    
    if (filtresImpayes.classe_id) {
      filtres = filtres.filter(i => i.classe_id?.toString() === filtresImpayes.classe_id);
    }
    
    if (filtresImpayes.categorie_id) {
      filtres = filtres.filter(i => i.categorie_id?.toString() === filtresImpayes.categorie_id);
    }
    
    if (filtresImpayes.statut !== 'tous') {
      if (filtresImpayes.statut === 'en_retard') {
        filtres = filtres.filter(i => i.jours_retard > 0);
      } else {
        filtres = filtres.filter(i => i.statut === filtresImpayes.statut && i.jours_retard <= 0);
      }
    }
    
    if (filtresImpayes.recherche) {
      const search = filtresImpayes.recherche.toLowerCase();
      filtres = filtres.filter(i => 
        i.eleve_nom.toLowerCase().includes(search) ||
        i.eleve_prenom.toLowerCase().includes(search) ||
        i.eleve_matricule.toLowerCase().includes(search)
      );
    }
    
    setImpayesFiltres(filtres);
  };

  // ✅ Fonction pour ouvrir la modale des impayés
  const ouvrirModalImpayes = async (action?: string) => {
    await chargerImpayes();
    setModalImpayesOuverte(true);
    
    if (action === 'retard') {
      setFiltresImpayes(prev => ({ ...prev, statut: 'en_retard' }));
    } else if (action === 'partiel') {
      setFiltresImpayes(prev => ({ ...prev, statut: 'partiel' }));
    }
  };

  // ✅ Fonction pour fermer la modale des impayés
  const fermerModalImpayes = () => {
    setModalImpayesOuverte(false);
    setFiltresImpayes({
      classe_id: '',
      categorie_id: '',
      statut: 'tous',
      recherche: ''
    });
  };

  // ✅ Fonction pour réinitialiser les filtres des impayés
  const reinitialiserFiltresImpayes = () => {
    setFiltresImpayes({
      classe_id: '',
      categorie_id: '',
      statut: 'tous',
      recherche: ''
    });
    setImpayesFiltres(impayes);
  };

  // ✅ Fonction pour réinitialiser les filtres du dashboard
  const reinitialiserFiltres = () => {
    setPeriode('mois');
    appliquerFiltres('mois', stats);
    setAlerte({ type: 'success', message: 'Filtres réinitialisés' });
  };

  // ✅ Fonction pour envoyer une relance WhatsApp
// ✅ Fonction améliorée pour envoyer une relance WhatsApp (inspirée de GestionPaiements)
const envoyerRelanceWhatsApp = (eleve: EleveImpaye) => {
  if (!eleve.telephone_parent) {
    setAlerte({ 
      type: 'warning', 
      message: `Aucun numéro de téléphone pour ${eleve.eleve_prenom} ${eleve.eleve_nom}` 
    });
    return;
  }

  try {
    // Nettoyer le numéro de téléphone
    const numeroPropre = eleve.telephone_parent.replace(/[\s\+]/g, '');
    let numeroWhatsApp = numeroPropre;
    
    // Assurer le format international (225 pour la Côte d'Ivoire)
    if (!numeroPropre.startsWith('225')) {
      numeroWhatsApp = '225' + numeroPropre;
    }
    if (!numeroWhatsApp.startsWith('+')) {
      numeroWhatsApp = '+' + numeroWhatsApp;
    }

    // Générer un message personnalisé et professionnel
    const dateEcheance = new Date(eleve.date_echeance).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const messagePersonnalise = `🏫 *${parametresEcole?.nom_ecole || 'Établissement Scolaire'}*
📋 *RELANCE DE PAIEMENT*

Cher Parent,

Nous vous rappelons que votre enfant *${eleve.eleve_prenom} ${eleve.eleve_nom}* (${eleve.classe}) présente un solde impayé de *${formaterMontant(eleve.reste_a_payer)}* pour les frais de *${eleve.categorie_frais}*.

📅 Échéance : ${dateEcheance}
${eleve.jours_retard > 0 ? `⏰ Retard : ${eleve.jours_retard} jour(s)` : ''}

Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.

_Cordialement,_
*LA COMPTABILITÉ*
${parametresEcole?.nom_ecole || 'Établissement Scolaire'}`;

    // URL WhatsApp avec le message personnalisé
    const url = `https://wa.me/${numeroWhatsApp.replace('+', '')}?text=${encodeURIComponent(messagePersonnalise)}`;
    
    // Ouvrir dans un nouvel onglet
    window.open(url, '_blank', 'noopener,noreferrer');
    
    setAlerte({ 
      type: 'success', 
      message: `Message WhatsApp préparé pour ${eleve.eleve_prenom} ${eleve.eleve_nom}` 
    });

    // Stocker la relance en arrière-plan (optionnel)
    stockerRelanceIndividuelle(eleve, messagePersonnalise, 'whatsapp');

  } catch (error) {
    console.error(`❌ Erreur envoi WhatsApp pour ${eleve.eleve_prenom} ${eleve.eleve_nom}:`, error);
    setAlerte({ 
      type: 'error', 
      message: `Erreur lors de la préparation du message WhatsApp` 
    });
  }
};

// ✅ Fonction pour stocker la relance (optionnelle)
const stockerRelanceIndividuelle = async (eleve: EleveImpaye, message: string, methode: string) => {
  try {
    await fetch('/api/finance/relances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eleve_id: eleve.eleve_id,
        parent_telephone: eleve.telephone_parent,
        parent_email: eleve.email_parent,
        message: message,
        montant_du: eleve.reste_a_payer,
        methode_envoi: methode,
        statut: 'envoye',
        envoye_par: 1
      })
    });
  } catch (error) {
    console.error(`Erreur stockage relance pour ${eleve.eleve_prenom} ${eleve.eleve_nom}:`, error);
  }
};

  // ✅ Fonction pour exporter les impayés en Excel
  const exporterImpayesExcel = (donnees: EleveImpaye[]) => {
    try {
      import('xlsx').then(XLSX => {
        const donneesFormatees = donnees.map((impaye, index) => ({
          'N°': index + 1,
          'Élève': `${impaye.eleve_prenom} ${impaye.eleve_nom}`,
          'Matricule': impaye.eleve_matricule,
          'Classe': impaye.classe,
          'Catégorie': impaye.categorie_frais,
          'Périodicité': impaye.periodicite,
          'Montant total (FCFA)': impaye.montant_total,
          'Montant payé (FCFA)': impaye.montant_paye,
          'Reste à payer (FCFA)': impaye.reste_a_payer,
          'Date échéance': new Date(impaye.date_echeance).toLocaleDateString('fr-FR'),
          'Jours de retard': impaye.jours_retard,
          'Statut': getStatutImpayeLibelle(impaye.statut, impaye.jours_retard).texte,
          'Téléphone parent': impaye.telephone_parent || '-',
          'Email parent': impaye.email_parent || '-'
        }));
        
        const classeur = XLSX.utils.book_new();
        const feuille = XLSX.utils.json_to_sheet(donneesFormatees);
        
        feuille['!cols'] = [
          { wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 20 },
          { wch: 25 }, { wch: 12 }, { wch: 18 }, { wch: 18 },
          { wch: 18 }, { wch: 15 }, { wch: 12 }, { wch: 15 },
          { wch: 20 }, { wch: 25 }
        ];
        
        XLSX.utils.book_append_sheet(classeur, feuille, 'Impayés');
        
        const date = new Date().toISOString().split('T')[0];
        XLSX.writeFile(classeur, `impayes_${date}.xlsx`);
        
        setAlerte({ type: 'success', message: 'Export réussi !' });
      });
    } catch (error) {
      console.error('Erreur export:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de l\'export' });
    }
  };

  // ✅ Fonction pour imprimer le tableau de bord
  const imprimerDashboard = useCallback(async () => {
    try {
      setExportEnCours(true);
      
      let ecole = parametresEcole;
      if (!ecole) {
        try {
          const response = await fetch('/api/parametres/ecole');
          const data = await response.json();
          if (data.success) {
            ecole = data.parametres;
          }
        } catch (error) {
          console.error('Erreur chargement paramètres:', error);
        }
      }
      
      const donneesAImprimer = statsFiltrees || stats;
      if (!donneesAImprimer) {
        setAlerte({ type: 'error', message: 'Aucune donnée à imprimer' });
        setExportEnCours(false);
        return;
      }
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setAlerte({ type: 'error', message: 'Impossible d\'ouvrir la fenêtre d\'impression' });
        setExportEnCours(false);
        return;
      }
      
      const contenuHTML = genererHTMLImpression(donneesAImprimer, ecole);
      
      printWindow.document.open();
      printWindow.document.write(contenuHTML);
      printWindow.document.close();
      
      setAlerte({ type: 'success', message: 'Préparation de l\'impression...' });
      
    } catch (error: any) {
      console.error('❌ Erreur impression:', error);
      setAlerte({ type: 'error', message: `Erreur: ${error.message}` });
    } finally {
      setExportEnCours(false);
    }
  }, [statsFiltrees, stats, parametresEcole]);

  // ✅ Fonction utilitaire pour obtenir le libellé du statut
  const getStatutImpayeLibelle = (statut: string, joursRetard: number): { texte: string, classe: string } => {
    if (joursRetard > 0) {
      return { texte: `En retard (${joursRetard} j)`, classe: 'danger' };
    }
    if (statut === 'partiel') {
      return { texte: 'Paiement partiel', classe: 'warning' };
    }
    return { texte: 'En attente', classe: 'info' };
  };

  const formaterMontant = (montant: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(montant);
  };

  const formaterPourcentage = (valeur: number): string => {
    return `${valeur.toFixed(1)}%`;
  };

  const getCouleurStatut = (taux: number): string => {
    if (taux >= 90) return '#10b981';
    if (taux >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const genererHTMLImpression = (donnees: DashboardStats, ecole: any) => {
    const periodeTexte = periode === 'jour' ? 'Journalier' : periode === 'mois' ? 'Mensuel' : 'Annuel';
    const dateNow = new Date().toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const lignesClasses = donnees.stats_par_classe.map(classe => `
      <tr>
        <td>${classe.classe}</td>
        <td>${classe.nombre_eleves}</td>
        <td>${formaterMontant(classe.total_a_payer)}</td>
        <td>${formaterMontant(classe.total_paye)}</td>
        <td>${formaterPourcentage(classe.taux_recouvrement)}</td>
        <td>${classe.eleves_impayes}</td>
      </tr>
    `).join('');
    
    const lignesTransactions = donnees.dernieres_transactions.map(trans => `
      <tr>
        <td>${new Date(trans.date).toLocaleDateString('fr-FR')}</td>
        <td><span class="badge-${trans.type}">${trans.type === 'recette' ? 'Entrée' : 'Sortie'}</span></td>
        <td>${trans.description}</td>
        <td>${trans.categorie}</td>
        <td>${trans.reference || '-'}</td>
        <td class="montant-${trans.type}">${trans.type === 'recette' ? '+' : '-'}${formaterMontant(trans.montant)}</td>
      </tr>
    `).join('');
    
    return `...`; // Contenu HTML d'impression
  };

  if (chargement) {
    return (
      <div className="chargement-dashboard">
        <div className="spinner-grand"></div>
        <p>Chargement du tableau de bord financier...</p>
      </div>
    );
  }

  if (!stats || !statsFiltrees) {
    return (
      <div className="erreur-dashboard">
        <div className="icone-erreur">📊</div>
        <h3>Impossible de charger les données</h3>
        <p>Veuillez réessayer plus tard</p>
        <button onClick={chargerDonnees} className="bouton-reessayer">
          🔄 Réessayer
        </button>
      </div>
    );
  }

  // Données pour les graphiques
  const chartRepartitionRecettes = {
    labels: statsFiltrees.stats_par_categorie.map(c => c.categorie),
    datasets: [
      {
        data: statsFiltrees.stats_par_categorie.map(c => c.total_paye),
        backgroundColor: [
          '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'
        ],
        borderWidth: 0
      }
    ]
  };

  const chartClassesData = {
    labels: statsFiltrees.stats_par_classe.map(c => c.classe),
    datasets: [
      {
        label: 'Taux de recouvrement (%)',
        data: statsFiltrees.stats_par_classe.map(c => c.taux_recouvrement),
        backgroundColor: statsFiltrees.stats_par_classe.map(c => getCouleurStatut(c.taux_recouvrement)),
        borderRadius: 6,
      }
    ]
  };

  const chartCategoriesData = {
    labels: statsFiltrees.stats_par_categorie.map(c => c.categorie),
    datasets: [
      {
        label: 'Montant payé',
        data: statsFiltrees.stats_par_categorie.map(c => c.total_paye),
        backgroundColor: '#10b981',
      },
      {
        label: 'Reste à payer',
        data: statsFiltrees.stats_par_categorie.map(c => c.total_a_payer - c.total_paye),
        backgroundColor: '#ef4444',
      }
    ]
  };

  const pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const label = context.label || '';
            const value = context.raw as number;
            const total = (context.dataset.data as number[]).reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${formaterMontant(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  const barClassesOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            return `Taux: ${context.raw}%`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: (value: string | number) => `${value}%`
        }
      }
    }
  };

  const barCategoriesOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += formaterMontant(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => {
            if (typeof value === 'number') {
              return formaterMontant(value);
            }
            return value;
          }
        }
      }
    }
  };

  return (
    <div className="" ref={dashboardRef}>
      {/* En-tête du dashboard */}
      <div className="en-tete-fixe-finance">
        <div className="conteneur-en-tete-fixe-finance">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px' }}>🖥️</span>
              <span style={{fontSize: '24px', fontWeight: '600'}}>
                Tableau de Bord Financier
              </span>
            </div>

          {/* BOUTONS À DROITE */}
          <div className="actions-fixes">
            <div className="header-right">
          <div className="filtres-periode">
            <button 
              className={`filtre-periode-fin ${periode === 'jour' ? 'actif' : ''}`}
              onClick={() => setPeriode('jour')}
            >
              Jour
            </button>
            <button 
              className={`filtre-periode-fin ${periode === 'mois' ? 'actif' : ''}`}
              onClick={() => setPeriode('mois')}
            >
              Mois
            </button>
            <button 
              className={`filtre-periode-fin ${periode === 'annee' ? 'actif' : ''}`}
              onClick={() => setPeriode('annee')}
            >
              Année
            </button>
          </div>
          <button 
            className="bouton-rafraichir" 
            onClick={reinitialiserFiltres}
            title="Rafraîchir"
          >
            🔄
          </button>
        </div>
          </div>
        </div>
      </div>

      {/* Alertes avec boutons fonctionnels */}
      {statsFiltrees.alertes.length > 0 && (
  <div className="section-alertes">
    {statsFiltrees.alertes.map((alerte, index) => (
      <div key={index} className={`alerte-dashboard ${alerte.type}`}>
        <div className="alerte-icone">
          {alerte.type === 'danger' ? '⚠️' : alerte.type === 'warning' ? '⚡' : 'ℹ️'}
        </div>
        <div className="alerte-contenu">
          <span className="alerte-message">{alerte.message}</span>
          {alerte.action && (
            <button 
              className="alerte-action"
              onClick={() => {
                if (alerte.action === 'Voir impayés') {
                  ouvrirModalImpayes();
                } else if (alerte.action === 'Voir les retards') {
                  ouvrirModalImpayes('retard');
                } else if (alerte.action === 'Voir le budget' || alerte.action === 'Définir budget' || alerte.action === 'Planifier') {
                  if (onNavigateToBudget) {
                    onNavigateToBudget();
                  }
                }
              }}
            >
              {alerte.action}
            </button>
          )}
        </div>
      </div>
    ))}
  </div>
)}

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card-fin" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="kpi-icon">💰</div>
          <div className="kpi-content-fin">
            <span className="kpi-label-fin">Total Recettes ({periode})</span>
            <span className="kpi-valeur-fin">{formaterMontant(statsFiltrees.total_recettes)}</span>
            <span className="kpi-sous-titre-fin">
              {periode === 'jour' ? "Aujourd'hui" : periode === 'mois' ? 'Ce mois' : "Cette année"}
            </span>
          </div>
        </div>

        <div className="kpi-card-fin" style={{ borderLeftColor: '#ef4444' }}>
          <div className="kpi-icon">💸</div>
          <div className="kpi-content-fin">
            <span className="kpi-label-fin">Total Dépenses</span>
            <span className="kpi-valeur-fin">{formaterMontant(statsFiltrees.total_depenses)}</span>
            <span className="kpi-sous-titre-fin">Budget consommé</span>
          </div>
        </div>

        <div className="kpi-card-fin" style={{ borderLeftColor: statsFiltrees.solde_actuel >= 0 ? '#10b981' : '#ef4444' }}>
          <div className="kpi-icon">⚖️</div>
          <div className="kpi-conten-fint">
            <span className="kpi-label-fin">Solde Actuel</span>
            <span className="kpi-valeur-fin">{formaterMontant(statsFiltrees.solde_actuel)}</span>
            <span className="kpi-sous-titre-fin">
              {statsFiltrees.solde_actuel >= 0 ? 'Excédent' : 'Déficit'}
            </span>
          </div>
        </div>

        <div className="kpi-card-fin" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="kpi-icon">📊</div>
          <div className="kpi-content-fin">
            <span className="kpi-label-fin">Budget Prévisionnel</span>
            <span className="kpi-valeur-fin">{formaterMontant(statsFiltrees.previsions_budget)}</span>
            <span className="kpi-sous-titre-fin">
              {formaterPourcentage(statsFiltrees.pourcentage_budget_utilise)} utilisé
            </span>
          </div>
        </div>
      </div>

      {/* Deuxième ligne de KPI - Frais */}
      <div className="kpi-grid second-row">
        <div className="kpi-card-fin" style={{ borderLeftColor: '#f59e0b' }}>
          <div className="kpi-icon">📋</div>
          <div className="kpi-content-fin">
            <span className="kpi-label-fin">Total Frais à payer</span>
            <span className="kpi-valeur-fin">{formaterMontant(statsFiltrees.total_frais_a_payer)}</span>
          </div>
        </div>

        <div className="kpi-card-fin" style={{ borderLeftColor: '#10b981' }}>
          <div className="kpi-icon">✅</div>
          <div className="kpi-content-fin">
            <span className="kpi-label-fin">Total Payé</span>
            <span className="kpi-valeur-fin">{formaterMontant(statsFiltrees.total_frais_payes)}</span>
            <span className="kpi-sous-titre-fin">{formaterPourcentage(statsFiltrees.taux_recouvrement)}</span>
          </div>
        </div>

        <div className="kpi-card-fin" style={{ borderLeftColor: '#ef4444' }}>
          <div className="kpi-icon">⏳</div>
          <div className="kpi-content-fin">
            <span className="kpi-label-fin">Impayés</span>
            <span className="kpi-valeur-fin">{formaterMontant(statsFiltrees.total_impayes)}</span>
            <span className="kpi-sous-titre-fin">
              <button 
                onClick={() => ouvrirModalImpayes()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                  fontSize: '0.8rem'
                }}
              >
              </button>
            </span>
          </div>
        </div>

        <div className="kpi-card-fin" style={{ borderLeftColor: '#8b5cf6' }}>
          <div className="kpi-icon">📅</div>
          <div className="kpi-content-fin">
            <span className="kpi-label-fin">Paiements {periode === 'jour' ? "aujourd'hui" : periode === 'mois' ? 'ce mois' : "cette année"}</span>
            <span className="kpi-valeur-fin">{formaterMontant(statsFiltrees.montant_paiements_annee)}</span>
            <span className="kpi-sous-titre">{statsFiltrees.nombre_paiements_annee} transaction(s)</span>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="graphiques-grid">
        <div className="graphique-card-fin">
          <div className="graphique-header">
            <h3>🥧 Répartition des Recettes</h3>
          </div>
          <div className="graphique-container pie-container">
            <Pie data={chartRepartitionRecettes} options={pieOptions} />
          </div>
        </div>

        <div className="graphique-card-fin">
          <div className="graphique-header">
            <h3>📊 Taux de Recouvrement par Classe</h3>
          </div>
          <div className="graphique-container">
            <Bar data={chartClassesData} options={barClassesOptions} />
          </div>
        </div>

        <div className="graphique-card-fin large">
          <div className="graphique-header">
            <h3>📊 Frais par Catégorie</h3>
          </div>
          <div className="graphique-container">
            <Bar data={chartCategoriesData} options={barCategoriesOptions} />
          </div>
        </div>
      </div>

      {/* MODALE DES IMPAYÉS */}
      {modalImpayesOuverte && (
        <div className="modal-overlay-modern" onClick={fermerModalImpayes}>
          <div className="modal-modern large" onClick={(e) => e.stopPropagation()}>
            {/* En-tête */}
            <div className="modal-header-modern" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              padding: '10px 30px',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  ⚠️
                </div>
                <div>
                  <h2 style={{ margin: '0 0 2px 0', fontSize: '1.4rem', fontWeight: '600' }}>
                    Gestion des Impayés
                  </h2>
                  <p style={{ margin: '0', opacity: '0.8', fontSize: '0.8rem' }}>
                    {impayesFiltres.length} élève(s) concerné(s) • Total: {formaterMontant(impayesFiltres.reduce((sum, i) => sum + i.reste_a_payer, 0))}
                  </p>
                </div>
              </div>
              <button 
                className="modal-close-modern"
                onClick={fermerModalImpayes}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  fontSize: '20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                ✕
              </button>
            </div>

            {/* Corps avec filtres */}
            <div className="modal-body-modern" style={{ padding: '30px', background: '#f8fafc', maxHeight: 'calc(90vh - 180px)', overflowY: 'auto' }}>
              
              {/* Filtres */}
              <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '25px',
                marginBottom: '25px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '20px',
                  marginBottom: '20px'
                }}>
                  {/* Filtre Classe */}
                  <div className="filtre-groupe-modern">
                    <label style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#4b5563',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      📚 CLASSE
                    </label>
                    <select
                      value={filtresImpayes.classe_id}
                      onChange={(e) => setFiltresImpayes({...filtresImpayes, classe_id: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    >
                      <option value="">Toutes les classes</option>
                      {classesImpayes.map(c => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
                  </div>

                  {/* Filtre Catégorie */}
                  <div className="filtre-groupe-modern">
                    <label style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#4b5563',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      🏷️ CATÉGORIE
                    </label>
                    <select
                      value={filtresImpayes.categorie_id}
                      onChange={(e) => setFiltresImpayes({...filtresImpayes, categorie_id: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '12px 15px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#667eea'}
                      onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                    >
                      <option value="">Toutes les catégories</option>
                      {categoriesImpayes.map(c => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
                  </div>


                  {/* Recherche */}
                  <div className="filtre-groupe-modern" style={{ gridColumn: 'span 2' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#4b5563',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      🔍 RECHERCHE
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Nom, prénom ou matricule..."
                        value={filtresImpayes.recherche}
                        onChange={(e) => setFiltresImpayes({...filtresImpayes, recherche: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '12px 15px 12px 45px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '12px',
                          fontSize: '0.95rem',
                          background: 'white',
                          transition: 'all 0.2s',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#667eea'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                      <span style={{
                        position: 'absolute',
                        left: '15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9ca3af',
                        fontSize: '1.1rem'
                      }}>🔍</span>
                    </div>
                  </div>

                  
                  {/* Filtre Statut */}
                  <div className="filtre-groupe-modern">
                    <label style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      color: '#4b5563',
                      marginBottom: '30px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      
                    </label>
                    <button
                    onClick={reinitialiserFiltresImpayes}
                    style={{
                      padding: '10px 20px',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '10px',
                      color: '#4b5563',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
                    title='Réinitialiser les filtres'
                  >
                    <span>🔄</span> Réinitialiser
                  </button>
                  </div>
                </div>

              </div>

              {/* Tableau des impayés */}
              {chargementImpayes ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '60px',
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div className="spinner-modern"></div>
                  <p style={{ color: '#6b7280', marginTop: '20px' }}>Chargement des impayés...</p>
                </div>
              ) : impayesFiltres.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '60px',
                  background: 'white',
                  borderRadius: '16px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ fontSize: '5rem', marginBottom: '20px' }}>🎉</div>
                  <h3 style={{ color: '#1f2937', marginBottom: '10px' }}>Aucun impayé !</h3>
                  <p style={{ color: '#6b7280' }}>Tous les paiements sont à jour. Félicitations !</p>
                </div>
              ) : (
                <div style={{
                  background: 'white',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      minWidth: '1200px'
                    }}>
                      <thead>
  <tr style={{
    background: 'linear-gradient(135deg, #efefef 0%, #a6a9af 100%)',
    color: '#161a1d'
  }}>
    <th style={{ padding: '15px 20px', textAlign: 'center', fontWeight: '500', width: '60px' }}>N°</th>
    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: '500' }}>Élève</th>
    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: '500' }}>Classe</th>
    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: '500' }}>Catégorie</th>
    <th style={{ padding: '15px 20px', textAlign: 'center', fontWeight: '500' }}>Total</th>
    <th style={{ padding: '15px 20px', textAlign: 'center', fontWeight: '500' }}>Payé</th>
    <th style={{ padding: '15px 20px', textAlign: 'center', fontWeight: '500' }}>Reste</th>
    <th style={{ padding: '15px 20px', textAlign: 'left', fontWeight: '500' }}>Échéance</th>
    <th style={{ padding: '15px 20px', textAlign: 'center', fontWeight: '500' }}>Statut</th>
    <th style={{ padding: '15px 20px', textAlign: 'center', fontWeight: '500' }}>Actions</th>
  </tr>
</thead>
<tbody>
  {impayesFiltres.map((impaye, index) => {
    const statutInfo = getStatutImpayeLibelle(impaye.statut, impaye.jours_retard);
    const isRetard = impaye.jours_retard > 0;
    const numeroLigne = index + 1;
    
    return (
      <tr 
        key={index}
        style={{
          background: index % 2 === 0 ? 'white' : '#fafafa',
          borderBottom: '1px solid #f0f0f0',
          transition: 'all 0.2s',
          ...(isRetard && {
            background: 'linear-gradient(90deg, #fef2f2 0%, #ffffff 100%)',
            borderLeft: '4px solid #ef4444'
          })
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isRetard ? '#fee2e2' : '#f3f4f6';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isRetard 
            ? 'linear-gradient(90deg, #fef2f2 0%, #ffffff 100%)'
            : (index % 2 === 0 ? 'white' : '#fafafa');
        }}
      >
        <td style={{ 
          padding: '15px 20px', 
          textAlign: 'center',
          fontWeight: '600',
          color: '#64748b'
        }}>
          {numeroLigne}
        </td>
        <td style={{ padding: '15px 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ color: '#1f2937', fontSize: '0.9rem' }}>
              {impaye.eleve_prenom} {impaye.eleve_nom}
            </strong>
            <small style={{ color: '#6b7280', fontSize: '0.7rem' }}>
              {impaye.eleve_matricule}
            </small>
          </div>
        </td>
        <td style={{ padding: '15px 20px' }}>
          <span style={{
            background: '#f3f4f6',
            padding: '5px 10px',
            borderRadius: '20px',
            fontSize: '0.85rem',
            color: '#4b5563',
            fontWeight: '500'
          }}>
            {impaye.classe}
          </span>
        </td>
        <td style={{ padding: '15px 20px' }}>
          <span style={{ color: '#4b5563' }}>{impaye.categorie_frais}</span>
          <br />
          <small style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
            {impaye.periodicite}
          </small>
        </td>
        <td style={{ padding: '15px 6px', fontSize: '12px', textAlign: 'center', fontWeight: '600' }}>
          {formaterMontant(impaye.montant_total)}
        </td>
        <td style={{ padding: '15px 10px', fontSize: '12px', textAlign: 'center', color: '#10b981', fontWeight: '500' }}>
          {formaterMontant(impaye.montant_paye)}
        </td>
        <td style={{ 
          padding: '15px 20px', 
          fontSize: '12px',
          textAlign: 'center', 
          fontWeight: '700',
          color: isRetard ? '#dc2626' : '#f59e0b'
        }}>
          {formaterMontant(impaye.reste_a_payer)}
        </td>
        <td style={{ padding: '15px 20px' }}>
          <div>
            <div style={{ fontWeight: '500' }}>
              {new Date(impaye.date_echeance).toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </div>
            {impaye.jours_retard > 0 && (
              <div style={{
                fontSize: '0.75rem',
                color: '#dc2626',
                fontWeight: '600',
                marginTop: '4px',
                background: '#fee2e2',
                padding: '2px 6px',
                borderRadius: '4px',
                display: 'inline-block'
              }}>
                ⚠️ Retard: {impaye.jours_retard}j
              </div>
            )}
          </div>
        </td>
        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block',
            padding: '6px 12px',
            borderRadius: '30px',
            fontSize: '0.8rem',
            fontWeight: '600',
            background: isRetard ? '#fee2e2' : (impaye.statut === 'partiel' ? '#fef3c7' : '#dbeafe'),
            color: isRetard ? '#991b1b' : (impaye.statut === 'partiel' ? '#92400e' : '#1e40af')
          }}>
            {isRetard ? `En retard` : impaye.statut === 'partiel' ? 'Partiel' : 'En attente'}
          </span>
        </td>
        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            {impaye.telephone_parent && (
              <button
                onClick={() => envoyerRelanceWhatsApp(impaye)}
                style={{
                  width: '36px',
                  height: '36px',
                  border: 'none',
                  borderRadius: '10px',
                  background: '#25D366',
                  color: 'white',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(37, 211, 102, 0.3)'
                }}
                title="Envoyer une relance par WhatsApp"
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(37, 211, 102, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 211, 102, 0.3)';
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
    <path fill="#fff" d="M4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98c-0.001,0,0,0,0,0h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303z"></path>
    <path fill="#fff" d="M4.868,43.803c-0.132,0-0.26-0.052-0.355-0.148c-0.125-0.127-0.174-0.312-0.127-0.483l2.639-9.636c-1.636-2.906-2.499-6.206-2.497-9.556C4.532,13.238,13.273,4.5,24.014,4.5c5.21,0.002,10.105,2.031,13.784,5.713c3.679,3.683,5.704,8.577,5.702,13.781c-0.004,10.741-8.746,19.48-19.486,19.48c-3.189-0.001-6.344-0.788-9.144-2.277l-9.875,2.589C4.953,43.798,4.911,43.803,4.868,43.803z"></path>
    <path fill="#cfd8dc" d="M24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,4C24.014,4,24.014,4,24.014,4C12.998,4,4.032,12.962,4.027,23.979c-0.001,3.367,0.849,6.685,2.461,9.622l-2.585,9.439c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98c0.002-5.339-2.075-10.359-5.848-14.135C34.378,6.083,29.357,4.002,24.014,4L24.014,4z"></path>
    <path fill="#40c351" d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"></path>
    <path fill="#fff" fillRule="evenodd" d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.474-1.225,1.543-1.502,1.859c-0.277,0.317-0.554,0.357-1.028,0.119c-0.474-0.238-2.002-0.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285c-0.277-0.474-0.03-0.731,0.208-0.968c0.213-0.213,0.474-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.474-0.791c0.158-0.317,0.079-0.594-0.04-0.831C20.612,19.329,19.69,16.983,19.268,16.045z" clipRule="evenodd"></path>
  </svg>
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  })}
</tbody>
<tfoot>
  <tr style={{
    background: '#f9fafb',
    borderTop: '2px solid #e5e7eb'
  }}>
    <td colSpan={6} style={{ 
      padding: '15px 20px', 
      textAlign: 'right',
      fontWeight: '600',
      color: '#4b5563'
    }}>
      TOTAL DES IMPAYÉS :
    </td>
    <td style={{ 
      padding: '15px 20px', 
      textAlign: 'right',
      fontWeight: '800',
      color: '#dc2626',
      fontSize: '1.2rem'
    }}>
      {formaterMontant(impayesFiltres.reduce((sum, i) => sum + i.reste_a_payer, 0))}
    </td>
    <td colSpan={3}></td>
  </tr>
</tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Pied de page */}
            <div style={{
              padding: '20px 30px',
              background: 'white',
              borderTop: '2px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '15px',
              borderBottomLeftRadius: '20px',
              borderBottomRightRadius: '20px'
            }}>
              <button
                onClick={fermerModalImpayes}
                style={{
                  padding: '12px 24px',
                  background: 'white',
                  border: '2px solid #e5e7eb',
                  borderRadius: '12px',
                  color: '#4b5563',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f3f4f6';
                  e.currentTarget.style.borderColor = '#d1d5db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.borderColor = '#e5e7eb';
                }}
              >
                Fermer
              </button>
              <button
                onClick={() => exporterImpayesExcel(impayesFiltres)}
                style={{
                  padding: '4px 10px',
                  background: 'linear-gradient(135deg, #f4cf8a 0%, #fd39fd 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 6px -1px rgba(132, 136, 156, 0.4)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 10px -1px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(102, 126, 234, 0.4)';
                }}
                title='Exporter en Excel'
              >
                <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="32" height="32" viewBox="0 0 48 48">
                    <path fill="#4CAF50" d="M41,10H25v28h16c0.553,0,1-0.447,1-1V11C42,10.447,41.553,10,41,10z"></path>
                    <path fill="#FFF" d="M32 15H39V18H32zM32 25H39V28H32zM32 30H39V33H32zM32 20H39V23H32zM25 15H30V18H25zM25 25H30V28H25zM25 30H30V33H25zM25 20H30V23H25z"></path>
                    <path fill="#2E7D32" d="M27 42L6 38 6 10 27 6z"></path>
                    <path fill="#FFF" d="M19.129,31l-2.411-4.561c-0.092-0.171-0.186-0.483-0.284-0.938h-0.037c-0.046,0.215-0.154,0.541-0.324,0.979L13.652,31H9.895l4.462-7.001L10.274,17h3.837l2.001,4.196c0.156,0.331,0.296,0.725,0.42,1.179h0.04c0.078-0.271,0.224-0.68,0.439-1.22L19.237,17h3.515l-4.199,6.939l4.316,7.059h-3.74V31z"></path>
                  </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Styles du dashboard (garder les styles existants) */
        .dashboard-intelligent {
          padding: 20px;
          background: #f8fafc;
          min-height: 100vh;
          width: 100%;
          max-width: 100%;
          overflow-x: hidden;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 20px;
          padding: 20px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .header-left h2 {
          margin: 0 0 5px 0;
          color: #1e293b;
          font-size: clamp(1.2rem, 4vw, 1.75rem);
        }

        .annee-scolaire {
          margin: 0;
          color: #64748b;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .bouton-reinitialiser,
        .bouton-imprimer,
        .bouton-rafraichir {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .bouton-reinitialiser {
          background: #f1f5f9;
          color: #64748b;
        }

        .bouton-reinitialiser:hover {
          background: #e2e8f0;
          color: #334155;
        }

        .bouton-imprimer {
          background: #8b5cf6;
          color: white;
        }

        .bouton-imprimer:hover {
          background: #7c3aed;
          transform: translateY(-1px);
        }

        .bouton-imprimer:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .bouton-rafraichir {
          width: 40px;
          height: 40px;
          padding: 8px;
          background: #f1f5f9;
          font-size: 1.2rem;
        }

        .bouton-rafraichir:hover {
          background: #e2e8f0;
          transform: rotate(180deg);
        }

        .section-alertes {
          margin-bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

       
        .alerte-icone {
          font-size: 1.5rem;
        }

        .alerte-contenu {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 10px;
        }


        .alerte-action {
          padding: 4px 10px;
          color: #335f75;
          background: #d2e4ed;
          border: 1px solid #c3d5de;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
        }

        .alerte-action:hover {
          background: #a1c8da;
          box-shadow: 0 10px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .kpi-grid.second-row {
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }

        .kpi-content-fin {
          flex: 1;
          min-width: 0;
        }

        .kpi-label-fin {
          display: block;
          font-size: 0.85rem;
          color: #64748b;
          margin-bottom: 5px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

       

        .kpi-sous-titre {
          font-size: 0.8rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .graphiques-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }


        .graphique-legendes {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .legende {
          font-size: 0.85rem;
          padding: 4px 8px;
          border-radius: 6px;
          background: #f8fafc;
          white-space: nowrap;
        }

        .graphique-container {
          height: 300px;
          position: relative;
          width: 100%;
        }

        .pie-container {
          height: 250px;
        }

        .section-tableau {
          background: white;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 30px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 1.2rem;
          color: #334155;
        }

        .badge-info {
          padding: 4px 12px;
          background: #f1f5f9;
          color: #475569;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .tableau-scrollable {
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
        }

        .tableau-dashboard {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
          min-width: 800px;
        }

        .tableau-dashboard th {
          background: #f8fafc;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }

        .tableau-dashboard td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          color: #1e293b;
        }

        .progress-bar-container {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 120px;
          height: 14px;
        }

        .progress-bar {
          border-radius: 4px;
          transition: width 0.3s;
        }

        .badge {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
        }

        .badge.success {
          background: #d1fae5;
          color: #065f46;
        }

        .badge.danger {
          background: #fee2e2;
          color: #991b1b;
        }

        .badge-type {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .badge-type.recette {
          background: #d1fae5;
          color: #065f46;
        }

        .badge-type.depense {
          background: #fee2e2;
          color: #991b1b;
        }

        .montant-positif {
          color: #10b981;
          font-weight: 600;
        }

        .montant-negatif {
          color: #ef4444;
          font-weight: 600;
        }

        .chargement-dashboard,
        .erreur-dashboard {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          background: white;
          border-radius: 16px;
          text-align: center;
        }

        .spinner-grand {
          width: 50px;
          height: 50px;
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

        .icone-erreur {
          font-size: 4rem;
          margin-bottom: 20px;
        }

        .erreur-dashboard h3 {
          color: #1e293b;
          margin-bottom: 10px;
        }

        .erreur-dashboard p {
          color: #64748b;
          margin-bottom: 20px;
        }

        .bouton-reessayer {
          padding: 12px 24px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.2s;
        }

        .bouton-reessayer:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        /* Styles pour la modale */
        .modal-overlay-modern {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(5px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        .modal-modern {
          background: white;
          border-radius: 20px;
          max-width: 90%;
          width: 100%;
          max-height: 90vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.3s ease;
        }

        .modal-modern.large {
          max-width: 1400px;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .modal-close-modern:hover {
          background: rgba(255, 255, 255, 0.3) !important;
          transform: rotate(90deg);
        }

        .spinner-modern {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @media (max-width: 768px) {
          .dashboard-intelligent {
            padding: 10px;
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .header-right {
            justify-content: center;
          }
          
          
          .bouton-reinitialiser,
          .bouton-imprimer {
            flex: 1;
            text-align: center;
          }
          
          .kpi-grid {
            grid-template-columns: 1fr;
          }
          
          .graphiques-grid {
            grid-template-columns: 1fr;
          }
          
          .graphique-card.large {
            grid-column: auto;
          }
          
          .graphique-container {
            height: 250px;
          }
          
          .pie-container {
            height: 200px;
          }
          
          .modal-modern {
            max-width: 100%;
            max-height: 100vh;
            border-radius: 0;
          }
          
          .filtre-groupe-modern[style*="grid-column: span 2"] {
            grid-column: auto !important;
          }
        }

        @media (min-width: 769px) and (max-width: 1200px) {
          .kpi-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .kpi-grid.second-row {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .graphiques-grid {
            grid-template-columns: repeat(1, 1fr);
          }
        }
      `}</style>
    </div>
  );
}