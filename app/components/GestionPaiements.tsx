'use client';

import { useState, useEffect, useCallback } from 'react';
import ModalDetailsPaiement from './ModalDetailsPaiement';
import ModalImprimerRecu from './ModalImprimerRecu';
import ModalSupprimerPaiement from './ModalSupprimerPaiement';
import ModalModifierPaiement from './ModalModifierPaiement';
import ModalHistoriquePaiements from './ModalHistoriquePaiements';
import * as XLSX from 'xlsx';

// Interfaces pour les paramètres
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

interface ParametresApp {
  id: number;
  devise: string;
  symbole_devise: string;
  format_date: string;
  fuseau_horaire: string;
  langue_defaut: string;
  theme_defaut: string;
}

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  classe_id: number;
  classe_nom: string;
  classe_niveau: string;
  statut: 'actif' | 'inactif';
}

interface Alerte {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

interface ElevePourRelance {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
  classe_id: number;
  classe_nom: string;
  classe_niveau: string;
  telephone_parent: string;
  email_parents: string;
  total_reste_a_payer: number;
  details_frais: Array<{
    categorie_nom: string;
    montant_restant: number;
    periodicite: string;
  }>;
  messagePersonnalise?: string;
}

interface RelanceMultipleData {
  eleves: ElevePourRelance[];
  messageRelance: string;
  anneeScolaire: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
}

interface CategorieFrais {
  id: number;
  nom: string;
  description: string;
  type: string;
  periodicite: 'unique' | 'mensuel' | 'trimestriel' | 'annuel';
}

interface FraisScolaire {
  id: number;
  categorie_frais_id: number;
  classe_id: number;
  annee_scolaire: string;
  montant: number;
  nombre_versements: number;
  periodicite: 'unique' | 'mensuel' | 'trimestriel' | 'annuel';
  statut: 'actif' | 'inactif';
  categorie_nom?: string;
  categorie_type?: string;
  categorie_periodicite?: string;
}

interface FraisEleve {
  id: number;
  frais_scolaire_id: number;
  eleve_id: number;
  annee_scolaire: string;
  montant: number;
  montant_paye: number;
  date_echeance: string;
  statut: 'en_attente' | 'partiel' | 'paye' | 'en_retard';
  date_paiement?: string;
  categorie_nom?: string;
  categorie_type?: string;
  periodicite?: string;
  frais_restant?: number;
}

interface StatistiquesClasse {
  total_frais_classe: number;
  total_paye_par_frais: Record<number, number>;
  reste_a_payer_par_frais: Record<number, number>;
  progression_globale: number;
  details_frais: Array<{
    id: number;
    categorie_nom: string;
    montant_total: number;
    montant_paye: number;
    reste_a_payer: number;
    progression: number;
  }>;
}

interface VersementScolarite {
  id: number;
  frais_eleve_id: number;
  eleve_id: number;
  numero_versement: number;
  montant_versement: number;
  montant_paye: number;
  date_echeance: string;
  statut: 'en_attente' | 'partiel' | 'paye' | 'en_retard';
  date_paiement?: string;
  reste_apres_paiement?: number;
}

interface Paiement {
  id: number;
  frais_eleve_id: number;
  eleve_id: number;
  montant: number;
  date_paiement: string;
  mode_paiement: string;
  reference_paiement: string;
  numero_versement?: number;
  numero_recu?: number;
  notes: string;
  statut_paiement?: string;
  statut: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  eleve_nom?: string;
  eleve_prenom?: string;
  eleve_matricule?: string;
  classe_nom?: string;
  classe_niveau?: string;
  categorie_nom?: string;
  montant_total?: number;
  montant_paye?: number;
  statut_frais?: string;
  annee_scolaire?: string;
  reste_a_payer?: number;
}

interface PaiementFormData {
  frais_eleve_id: number | null;
  frais_scolaire_id: number | null;
  eleve_id: number | null;
  montant: number;
  date_paiement: string;
  mode_paiement: 'especes' | 'cheque' | 'virement' | 'carte' | 'mobile' | 'autre';
  reference_paiement: string;
  notes: string;
  statut: 'paye' | 'en_attente';
  created_by: number;
  numero_versement?: number;
  versement_id?: number;
  is_versement?: boolean;
}

type SortFieldPaiement = 'eleve' | 'categorie' | 'classe' | 'date' | 'versement';

export default function GestionPaiements() {
  // États principaux
  const [ongletActif, setOngletActif] = useState<'liste' | 'nouveau' | 'versements'>('liste');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [alerte, setAlerte] = useState<{type: 'success' | 'error' | 'warning' | 'info' , message: string} | null>(null);
  const [exportEnCours, setExportEnCours] = useState(false);
  
  // États pour les paramètres
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp | null>(null);
  
  // Données
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [fraisScolaires, setFraisScolaires] = useState<FraisScolaire[]>([]);
  const [fraisEleves, setFraisEleves] = useState<FraisEleve[]>([]);
  const [versements, setVersements] = useState<VersementScolarite[]>([]);
  
  // États de sélection
  const [classeSelectionnee, setClasseSelectionnee] = useState<number | null>(null);
  const [eleveSelectionne, setEleveSelectionne] = useState<number | null>(null);
  const [fraisSelectionne, setFraisSelectionne] = useState<FraisScolaire | null>(null);
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [derniersPaiements, setDerniersPaiements] = useState<Paiement[]>([]);
  const [historiqueOuvert, setHistoriqueOuvert] = useState<number | null>(null);
  const [historiqueEleve, setHistoriqueEleve] = useState<any>(null);

  const [elevesSelectionnes, setElevesSelectionnes] = useState<number[]>([]);
  const [modalRelanceMultipleOuvert, setModalRelanceMultipleOuvert] = useState(false);
  const [relanceMultipleData, setRelanceMultipleData] = useState<RelanceMultipleData | null>(null);
  const [chargementRelance, setChargementRelance] = useState(false);
  const [categoriesFraisMensuels, setCategoriesFraisMensuels] = useState<CategorieFrais[]>([]);

  const [modalSuppressionMultipleOuvert, setModalSuppressionMultipleOuvert] = useState(false);
  const [chargementSuppression, setChargementSuppression] = useState(false);
  const [paiementsASupprimer, setPaiementsASupprimer] = useState<number[]>([]);
  const [detailsSuppression, setDetailsSuppression] = useState<any[]>([]);

  // Fonctions de défilement
  const defilerVersEtapeClasse = () => defilerVersEtape('etape-classe');
  const defilerVersEtapeEleve = () => defilerVersEtape('etape-eleve');
  const defilerVersEtapeFrais = () => defilerVersEtape('etape-frais');
  const defilerVersEtapeConfigScolarite = () => defilerVersEtape('etape-config-scolarite');
  const defilerVersEtapeDetails = () => defilerVersEtape('etape-details-paiement');
  
  // Filtres
  const [filtres, setFiltres] = useState({
    date_debut: '',
    date_fin: '',
    classe_id: '',
    mode_paiement: '',
    statut: '',
    du_jour: false,
    du_mois: false,
    de_l_annee: false,
    eleve_id: '',
    categorie_frais_mensuel_id: '',
    categorie_frais_id: ''
  });
  
  // Formulaire paiement
  const [formPaiement, setFormPaiement] = useState<PaiementFormData>({
    frais_eleve_id: null,
    frais_scolaire_id: null,
    eleve_id: null,
    montant: 0,
    date_paiement: new Date().toISOString().split('T')[0],
    mode_paiement: 'especes',
    reference_paiement: '',
    notes: '',
    statut: 'paye',
    created_by: 1,
    is_versement: false
  });
  
  // États pour les versements
  const [versementSelectionne, setVersementSelectionne] = useState<number | null>(null);
  const [numeroVersement, setNumeroVersement] = useState<number>(1);
  const [montantTotalScolarite, setMontantTotalScolarite] = useState<number>(0);
  const [montantRestantScolarite, setMontantRestantScolarite] = useState<number>(0);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPaiements, setTotalPaiements] = useState(0);
  const itemsParPage = 20;
  
  // Année scolaire
  const [anneeScolaire, setAnneeScolaire] = useState('');
  
  // États pour les modales
  const [modalDetailsOpen, setModalDetailsOpen] = useState(false);
  const [modalReceiptOpen, setModalReceiptOpen] = useState(false);
  const [modalDeleteOpen, setModalDeleteOpen] = useState(false);
  const [paiementSelectionne, setPaiementSelectionne] = useState<Paiement | null>(null);
  const [detailsPaiement, setDetailsPaiement] = useState<any>(null);
  const [vueActuelle, setVueActuelle] = useState<'derniers' | 'tous'>('derniers');
  const [categoriesFrais, setCategoriesFrais] = useState<CategorieFrais[]>([]);
  const [totaux, setTotaux] = useState({
    total_a_payer: 0,
    total_paye: 0,
    reste_a_payer: 0
  });

  const [totauxReels, setTotauxReels] = useState({
    total_a_payer_reel: 0,
    total_paye_reel: 0,
    reste_a_payer_reel: 0
  });
  
  // Tri
  const [triPaiement, setTriPaiement] = useState<{
    champ: SortFieldPaiement;
    direction: 'asc' | 'desc';
  }>({
    champ: 'date',
    direction: 'desc'
  });

  // ==================== FONCTIONS DE FORMATAGE DYNAMIQUE ====================

  // Formater une date selon la configuration
  const formaterDate = (date: string | Date): string => {
    if (!parametresApp) {
      try {
        return new Date(date).toLocaleDateString('fr-FR');
      } catch {
        return date as string;
      }
    }
    
    try {
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
    } catch {
      return date as string;
    }
  };

  // Formater un montant selon la devise configurée
  const formaterMontant = (montant: number): string => {
    if (!parametresApp) {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'XOF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(montant);
    }
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: parametresApp.devise,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(montant).replace(parametresApp.devise, parametresApp.symbole_devise);
    } catch (error) {
      console.error('Erreur formatage montant:', error);
      return `${montant.toLocaleString('fr-FR')} ${parametresApp.symbole_devise}`;
    }
  };

  // Formater l'heure
  const formaterHeure = (date: string | Date): string => {
    try {
      return new Date(date).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  // ==================== CHARGEMENT DES DONNÉES ====================

  // Charger les données initiales
  useEffect(() => {
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth() + 1;
    
    if (mois >= 8) {
      setAnneeScolaire(`${annee}-${annee + 1}`);
    } else {
      setAnneeScolaire(`${annee - 1}-${annee}`);
    }
    
    chargerDonneesInitiales();
    chargerPaiements();
    chargerCategoriesFraisMensuels();
    chargerCategoriesFrais(); 
  }, [page, filtres, triPaiement, vueActuelle]); 

  // Charger les paramètres de l'école et de l'application
  useEffect(() => {
    const chargerParametres = async () => {
      try {
        const [ecoleResponse, appResponse] = await Promise.all([
          fetch('/api/parametres/ecole'),
          fetch('/api/parametres/application')
        ]);
        
        const ecoleData = await ecoleResponse.json();
        if (ecoleData.success) {
          setParametresEcole(ecoleData.parametres);
        }
        
        const appData = await appResponse.json();
        if (appData.success && appData.parametres) {
          setParametresApp(appData.parametres);
        } else {
          // Valeurs par défaut
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
      } catch (error) {
        console.error('Erreur chargement paramètres:', error);
      }
    };
    
    chargerParametres();
  }, []);

  // Gérer les alertes
  useEffect(() => {
    if (alerte) {
      const timer = setTimeout(() => {
        setAlerte(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alerte]);

  // Fonction pour le tri
  const handleTri = (champ: SortFieldPaiement) => {
    setTriPaiement(prev => ({
      champ,
      direction: prev.champ === champ && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getIconeTri = (champ: SortFieldPaiement) => {
    if (triPaiement.champ !== champ) return '↕️';
    return triPaiement.direction === 'asc' ? '↑' : '↓';
  };

  // Fonctions principales
  const chargerDonneesInitiales = async () => {
    try {
      const responseClasses = await fetch('/api/classes');
      if (responseClasses.ok) {
        const dataClasses = await responseClasses.json();
        setClasses(dataClasses.classes || []);
      }
      
      await chargerTotauxReels();
      
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
      setAlerte({ type: 'error', message: 'Erreur lors du chargement des données initiales' });
    }
  };

  const chargerCategoriesFrais = async () => {
    try {
      const response = await fetch('/api/finance/categories-frais');
      const data = await response.json();
      if (data.success) {
        setCategoriesFrais(data.categories || []);
      }
    } catch (error) {
      console.error('❌ Erreur chargement catégories frais:', error);
    }
  };

  // Calculer les totaux
  const calculerTotaux = (paiementsListe: Paiement[], vue: 'derniers' | 'tous') => {
    if (!Array.isArray(paiementsListe) || paiementsListe.length === 0) {
      setTotaux({
        total_a_payer: 0,
        total_paye: 0,
        reste_a_payer: 0
      });
      return;
    }
    
    if (vue === 'derniers') {
      let totalPaye = 0;
      let totalReste = 0;
      
      const fraisTraites = new Set<number>();
      
      paiementsListe.forEach(p => {
        const fraisEleveId = p.frais_eleve_id;
        
        if (!fraisTraites.has(fraisEleveId)) {
          fraisTraites.add(fraisEleveId);
          
          const montant = Number(p.montant) || 0;
          const reste = Number(p.reste_a_payer) || 0;
          
          totalPaye += montant;
          totalReste += reste;
        }
      });
      
      const totalAPayer = totalPaye + totalReste;
      
      setTotaux({
        total_a_payer: totalAPayer,
        total_paye: totalPaye,
        reste_a_payer: totalReste
      });
      
    } else {
      let totalPaye = 0;
      let totalReste = 0;
      
      paiementsListe.forEach(p => {
        totalPaye += Number(p.montant) || 0;
        totalReste += Number(p.reste_a_payer) || 0;
      });
      
      const totalAPayer = totalPaye + totalReste;
      
      setTotaux({
        total_a_payer: totalAPayer,
        total_paye: totalPaye,
        reste_a_payer: totalReste
      });
    }
  };

  // Charger les totaux réels
  const chargerTotauxReels = async () => {
    try {
      const params = new URLSearchParams();
        
      if (filtres.classe_id && filtres.classe_id.trim() !== '') {
        params.append('classe_id', filtres.classe_id);
      }
      
      if (filtres.categorie_frais_id && filtres.categorie_frais_id.trim() !== '') {
        params.append('categorie_frais_id', filtres.categorie_frais_id);
      }
      
      if (filtres.eleve_id && filtres.eleve_id.trim() !== '') {
        params.append('eleve_id', filtres.eleve_id);
      }
      
      const url = `/api/finance/paiements/totaux-reels?${params.toString()}`;
      console.log('📊 Chargement des totaux réels:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setTotauxReels({
          total_a_payer_reel: data.total_a_payer || 0,
          total_paye_reel: data.total_paye || 0,
          reste_a_payer_reel: data.reste_a_payer || 0
        });
        console.log('✅ Totaux réels chargés:', data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement totaux réels:', error);
    }
  };

  const chargerCategoriesFraisMensuels = async () => {
    try {
      const response = await fetch('/api/finance/categories-frais?periodicite=mensuel');
      const data = await response.json();
      if (data.success) {
        setCategoriesFraisMensuels(data.categories || []);
      }
    } catch (error) {
      console.error('Erreur chargement catégories frais mensuels:', error);
    }
  };

  // Gestion de la sélection/désélection
  const toggleSelectionEleve = (eleveId: number) => {
    setElevesSelectionnes(prev => {
      if (prev.includes(eleveId)) {
        return prev.filter(id => id !== eleveId);
      } else {
        return [...prev, eleveId];
      }
    });
  };

  const toggleSelectionTous = () => {
    const elevesDeLaPage = derniersPaiements
      .slice((page - 1) * itemsParPage, page * itemsParPage)
      .map(p => p.eleve_id);
    
    if (elevesSelectionnes.length === elevesDeLaPage.length) {
      setElevesSelectionnes([]);
    } else {
      setElevesSelectionnes(elevesDeLaPage);
    }
  };

  // Exécuter la suppression multiple
  const executerSuppressionMultiple = async () => {
    if (paiementsASupprimer.length === 0) return;
    
    setChargementSuppression(true);
    
    try {
      console.log(`🗑️ Suppression de ${paiementsASupprimer.length} paiement(s)`);
      
      const response = await fetch('/api/finance/paiements/suppression-multiple', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          paiement_ids: paiementsASupprimer 
        })
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.erreur || 'Erreur lors de la suppression multiple');
      }
      
      setAlerte({ 
        type: 'success', 
        message: `${data.supprime || paiementsASupprimer.length} paiement(s) supprimé(s) avec succès` 
      });
      
      setElevesSelectionnes([]);
      setPaiementsASupprimer([]);
      setDetailsSuppression([]);
      setModalSuppressionMultipleOuvert(false);
      await chargerPaiements();
      
    } catch (error: any) {
      console.error('❌ Erreur suppression multiple:', error);
      setAlerte({ 
        type: 'error', 
        message: error.message || 'Erreur lors de la suppression multiple' 
      });
    } finally {
      setChargementSuppression(false);
    }
  };

  // Préparer la suppression multiple
  const preparerSuppressionMultiple = async () => {
    if (elevesSelectionnes.length === 0) {
      setAlerte({ 
        type: 'error', 
        message: 'Veuillez sélectionner au moins un élève' 
      });
      return;
    }

    setChargementSuppression(true);
    
    try {
      const response = await fetch('/api/finance/paiements/par-eleves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eleve_ids: elevesSelectionnes,
          filtre_categorie: filtres.categorie_frais_mensuel_id || null
        })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.erreur || 'Erreur lors de la récupération des paiements');
      }

      if (data.paiement_ids.length === 0) {
        setAlerte({ 
          type: 'warning', 
          message: 'Aucun paiement trouvé pour les élèves sélectionnés' 
        });
        return;
      }

      setPaiementsASupprimer(data.paiement_ids);
      setDetailsSuppression(data.details || []);
      setModalSuppressionMultipleOuvert(true);
      
    } catch (error: any) {
      console.error('❌ Erreur préparation suppression:', error);
      setAlerte({ 
        type: 'error', 
        message: error.message || 'Erreur lors de la préparation de la suppression' 
      });
    } finally {
      setChargementSuppression(false);
    }
  };

  // Préparer la relance multiple
  const preparerRelanceMultiple = async () => {
    if (elevesSelectionnes.length === 0) {
      setAlerte({ type: 'error', message: 'Veuillez sélectionner au moins un élève' });
      return;
    }

    setChargementRelance(true);
    try {
      const response = await fetch('/api/finance/eleves-pour-relance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eleve_ids: elevesSelectionnes })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.erreur || 'Erreur lors de la récupération des données');
      }

      const messageAffichage = genererMessageRelanceMultiplePourAffichage(data.eleves);
      
      const elevesAvecMessages = data.eleves.map((eleve: ElevePourRelance) => ({
        ...eleve,
        messagePersonnalise: genererMessageRelancePersonnalise(eleve)
      }));
      
      setRelanceMultipleData({
        eleves: elevesAvecMessages,
        messageRelance: messageAffichage,
        anneeScolaire: anneeScolaire
      });
      
      setModalRelanceMultipleOuvert(true);
      
    } catch (error: any) {
      console.error('❌ Erreur préparation relance multiple:', error);
      setAlerte({ 
        type: 'error', 
        message: error.message || 'Erreur lors de la préparation de la relance' 
      });
    } finally {
      setChargementRelance(false);
    }
  };

  // Générer le message de relance multiple
  const genererMessageRelanceMultiple = (eleves: ElevePourRelance[]): string => {
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const moisSuivant = maintenant.getMonth() + 2 > 12 ? 1 : maintenant.getMonth() + 2;
    const anneeMoisSuivant = moisSuivant === 1 ? annee + 1 : annee;
    const dateControle = `6/${moisSuivant < 10 ? '0' + moisSuivant : moisSuivant}/${anneeMoisSuivant}`;
    
    let message = `🏫 *Établissement Scolaire*\n📋 *RELANCE DE PAIEMENT*\n\n`;
    
    eleves.forEach((eleve, index) => {
      const detailsFrais = eleve.details_frais
        .map(f => `• ${f.categorie_nom} : ${formaterMontant(f.montant_restant)}`)
        .join('\n');
      
      message += `👨‍🎓 *Élève ${index + 1}:* ${eleve.prenom} ${eleve.nom}\n`;
      message += `📚 Classe : ${eleve.classe_niveau} ${eleve.classe_nom}\n`;
      message += `💰 Montant dû : ${formaterMontant(eleve.total_reste_a_payer)}\n`;
      
      if (detailsFrais) {
        message += `📋 Détail des frais :\n${detailsFrais}\n`;
      }
      
      if (eleve.telephone_parent) {
        message += `📱 Contact : ${eleve.telephone_parent}\n`;
      }
      
      message += `\n---\n`;
    });
    
    message += `\n📅 *IMPORTANT :* Les contrôles s'effectuant à partir du ${dateControle}, tout élève non en règle sera interdit(e) d'accès aux salles de classe.\n`;
    message += `Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.\n\n`;
    message += `_Cordialement,_\n*LA COMPTABILITÉ*\nÉtablissement Scolaire`;
    
    return message;
  };

  // Générer le message de relance PERSONNALISÉ pour chaque élève
  const genererMessageRelancePersonnalise = (eleve: ElevePourRelance): string => {
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const moisSuivant = maintenant.getMonth() + 2 > 12 ? 1 : maintenant.getMonth() + 2;
    const anneeMoisSuivant = moisSuivant === 1 ? annee + 1 : annee;
    const dateControle = `6/${moisSuivant < 10 ? '0' + moisSuivant : moisSuivant}/${anneeMoisSuivant}`;
    
    let detailsFrais = '';
    if (eleve.details_frais.length > 0) {
      detailsFrais = eleve.details_frais
        .map(f => `• ${f.categorie_nom} : ${formaterMontant(f.montant_restant)}`)
        .join('\n');
    }
    
    const coordonneesEcole = parametresEcole ? `
    
📞 ${parametresEcole.telephone || 'Non renseigné'}
📧 ${parametresEcole.email || 'Non renseigné'}
📍 ${parametresEcole.adresse || 'Non renseigné'}` : '';
    
    return `🏫 *${parametresEcole?.nom_ecole || 'Établissement Scolaire'}*
📋 *RELANCE DE PAIEMENT*
    
Cher Parent,

Sauf erreur de notre part, votre enfant ${eleve.prenom} ${eleve.nom}, 
en classe de ${eleve.classe_niveau} ${eleve.classe_nom}, 
au titre de l'année scolaire ${anneeScolaire}, 
doit la somme de ${formaterMontant(eleve.total_reste_a_payer)}.

${detailsFrais ? `Détail des frais restants :\n${detailsFrais}\n` : ''}

Les contrôles s'effectuant à partir du ${dateControle}, tout élève non en règle sera interdit(e) d'accès aux salles de classe.
Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.

_Cordialement,_
*LA COMPTABILITÉ*
${parametresEcole?.nom_ecole || 'Établissement Scolaire'}
${coordonneesEcole}`;
  };

  // Générer le message de relance pour AFFICHAGE dans la modal (regroupé)
  const genererMessageRelanceMultiplePourAffichage = (eleves: ElevePourRelance[]): string => {
    let message = `🏫 *Établissement Scolaire*\n📋 *RELANCE DE PAIEMENT MULTIPLE*\n\n`;
    message += `Nombre d'élèves : ${eleves.length}\n\n`;
    
    eleves.forEach((eleve, index) => {
      message += `${index + 1}. ${eleve.prenom} ${eleve.nom} (${eleve.classe_niveau} ${eleve.classe_nom}) - ${formaterMontant(eleve.total_reste_a_payer)}\n`;
    });
    
    message += `\n📅 Les contrôles s'effectuant à partir du 06/XX/XXXX, tout élève non en règle sera interdit(e) d'accès aux salles de classe.\n`;
    message += `Nous vous prions de bien vouloir régulariser cette situation dans les plus brefs délais.\n\n`;
    message += `_Cordialement,_\n*LA COMPTABILITÉ*\nÉtablissement Scolaire`;
    
    return message;
  };

  // Envoyer les relances WhatsApp en masse
  const envoyerRelancesWhatsAppMultiple = () => {
    if (!relanceMultipleData) return;
    
    const elevesAvecTelephone = relanceMultipleData.eleves.filter(e => 
      e.telephone_parent && e.telephone_parent.trim() !== ''
    );
    
    if (elevesAvecTelephone.length === 0) {
      setAlerte({ type: 'error', message: 'Aucun élève sélectionné n\'a de numéro de téléphone parent' });
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    elevesAvecTelephone.forEach((eleve, index) => {
      try {
        const numeroPropre = eleve.telephone_parent.replace(/[\s\+]/g, '');
        let numeroWhatsApp = numeroPropre;
        
        if (!numeroPropre.startsWith('225')) {
          numeroWhatsApp = '225' + numeroPropre;
        }
        if (!numeroWhatsApp.startsWith('+')) {
          numeroWhatsApp = '+' + numeroWhatsApp;
        }
        
        const messagePersonnalise = eleve.messagePersonnalise || genererMessageRelancePersonnalise(eleve);
        
        const url = `https://wa.me/${numeroWhatsApp.replace('+', '')}?text=${encodeURIComponent(messagePersonnalise)}`;
        
        setTimeout(() => {
          window.open(url, '_blank', 'noopener,noreferrer');
        }, index * 500);
        
        successCount++;
        
        setTimeout(() => {
          stockerRelanceIndividuelle(eleve, messagePersonnalise, 'whatsapp');
        }, index * 100);
        
      } catch (error) {
        console.error(`❌ Erreur envoi WhatsApp pour ${eleve.prenom} ${eleve.nom}:`, error);
        errorCount++;
      }
    });
    
    setTimeout(() => {
      if (successCount > 0) {
        setAlerte({ 
          type: 'success', 
          message: `${successCount} relance(s) WhatsApp lancée(s) avec succès${errorCount > 0 ? ` (${errorCount} erreur(s))` : ''}` 
        });
      }
      
      if (errorCount > 0 && successCount === 0) {
        setAlerte({ 
          type: 'error', 
          message: 'Échec de l\'envoi des relances WhatsApp' 
        });
      }
    }, 1000);
  };

  // Stocker les relances individuelles
  const stockerRelanceIndividuelle = async (eleve: any, message: string, methode: string) => {
    try {
      await fetch('/api/finance/relances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eleve_id: eleve.id,
          parent_telephone: eleve.telephone_parent,
          parent_email: eleve.email_parents,
          message: message,
          montant_du: eleve.total_reste_a_payer,
          methode_envoi: methode,
          statut: 'envoye',
          envoye_par: 1
        })
      });
    } catch (error) {
      console.error(`Erreur stockage relance pour ${eleve.prenom} ${eleve.nom}:`, error);
    }
  };

  // Version avec confirmation pour WhatsApp multiple
  const envoyerRelancesWhatsAppMultipleAvecConfirmation = () => {
    if (!relanceMultipleData) return;
    
    const elevesAvecTelephone = relanceMultipleData.eleves.filter(e => 
      e.telephone_parent && e.telephone_parent.trim() !== ''
    );
    
    if (elevesAvecTelephone.length === 0) {
      setAlerte({ type: 'error', message: 'Aucun élève sélectionné n\'a de numéro de téléphone parent' });
      return;
    }
    
    const confirmation = window.confirm(
      `Vous êtes sur le point d'envoyer ${elevesAvecTelephone.length} relance(s) WhatsApp.\n\n` +
      `Chaque parent recevra un message personnalisé concernant uniquement son enfant.\n\n` +
      `Souhaitez-vous continuer ?`
    );
    
    if (!confirmation) return;
    
    setModalRelanceMultipleOuvert(false);
    
    setAlerte({ 
      type: 'success', 
      message: `Préparation de ${elevesAvecTelephone.length} message(s) WhatsApp...` 
    });
    
    setTimeout(() => {
      envoyerRelancesWhatsAppMultiple();
    }, 500);
  };

  // Imprimer les relances multiples
  const imprimerRelancesMultiple = () => {
    if (!relanceMultipleData || !parametresEcole) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .page {
          padding: 15mm;
          page-break-after: always;
          min-height: 297mm;
        }
        
        .page:last-child {
          page-break-after: auto;
        }
        
        .header-relance {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid ${parametresEcole.couleur_principale || '#667eea'};
        }
        
        .header-relance h1 {
          font-size: 20px;
          color: #1a202c;
          margin-bottom: 8px;
        }
        
        .infos-ecole {
          font-size: 11px;
          color: #4a5568;
        }
        
        .logo-ecole {
          max-width: 80px;
          max-height: 80px;
          margin: 0 auto 10px auto;
        }
        
        .date-lieu {
          text-align: right;
          margin-bottom: 20px;
          font-style: italic;
          color: #718096;
        }
        
        .destinataire {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8fafc;
          border-radius: 8px;
          border-left: 4px solid ${parametresEcole.couleur_principale || '#667eea'};
        }
        
        .destinataire strong {
          display: block;
          margin-bottom: 5px;
          color: #1e293b;
        }
        
        .eleve-infos {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 10px;
        }
        
        .info-item {
          font-size: 11px;
        }
        
        .info-label {
          font-weight: 600;
          color: #4a5568;
        }
        
        .info-value {
          color: #1e293b;
        }
        
        .table-frais {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 11px;
        }
        
        .table-frais th {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          padding: 10px;
          text-align: left;
          font-weight: 600;
          color: #4a5568;
        }
        
        .table-frais td {
          border: 1px solid #e2e8f0;
          padding: 10px;
          color: #2d3748;
        }
        
        .table-frais tr:nth-child(even) {
          background: #fafafa;
        }
        
        .montant-total {
          text-align: right;
          font-weight: 600;
          font-size: 14px;
          margin: 20px 0;
          padding-top: 15px;
          border-top: 2px solid #e2e8f0;
        }
        
        .message-relance {
          white-space: pre-line;
          margin: 25px 0;
          font-size: 11px;
          line-height: 1.8;
          padding: 15px;
          background: #f7fafc;
          border-radius: 6px;
          border-left: 4px solid ${parametresEcole.couleur_principale || '#667eea'};
        }
        
        .signature {
          margin-top: 40px;
          text-align: right;
        }
        
        .signature-stamp {
          display: inline-block;
          border-top: 1px solid #333;
          width: 200px;
          padding-top: 10px;
          text-align: center;
        }
        
        .footer-relance {
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 10px;
          color: #718096;
        }
        
        .page-number {
          position: absolute;
          bottom: 10mm;
          right: 15mm;
          font-size: 10px;
          color: #94a3b8;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .page {
            padding: 10mm;
          }
          
          .page-break {
            page-break-after: always;
          }
          
          .no-print {
            display: none !important;
          }
        }
      </style>
    `;

    let contenuHTML = '';
    const maintenant = new Date();
    
    relanceMultipleData.eleves.forEach((eleve: ElevePourRelance, index: number) => {
      const messagePersonnalise = (eleve as any).messagePersonnalise || genererMessageRelancePersonnalise(eleve);
      
      contenuHTML += `
        <div class="page">
          <div class="header-relance">
            ${parametresEcole.logo_url ? 
              `<img src="${parametresEcole.logo_url}" alt="${parametresEcole.nom_ecole}" class="logo-ecole">` : ''}
            <h1>${parametresEcole.nom_ecole || 'Établissement Scolaire'}</h1>
            <div class="infos-ecole">
              Relance de paiement scolaire
              ${parametresEcole.slogan ? `<br><em>"${parametresEcole.slogan}"</em>` : ''}
            </div>
          </div>
          
          <div class="date-lieu">
            Fait le ${formaterDate(maintenant)}
          </div>
          
          <div class="destinataire">
            <strong>À l'attention des parents de :</strong>
            <div style="font-size: 14px; margin-bottom: 5px;">${eleve.prenom} ${eleve.nom}</div>
            
            <div class="eleve-infos">
              <div class="info-item">
                <div class="info-label">Matricule</div>
                <div class="info-value">${eleve.matricule}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Classe</div>
                <div class="info-value">${eleve.classe_niveau} ${eleve.classe_nom}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Téléphone Parent</div>
                <div class="info-value">${eleve.telephone_parent || 'Non renseigné'}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Email Parent</div>
                <div class="info-value">${eleve.email_parents || 'Non renseigné'}</div>
              </div>
            </div>
          </div>
          
          ${eleve.details_frais.length > 0 ? `
            <table class="table-frais">
              <thead>
                <tr>
                  <th>Catégorie de frais</th>
                  <th>Montant restant</th>
                  <th>Périodicité</th>
                </tr>
              </thead>
              <tbody>
                ${eleve.details_frais.map(frais => `
                  <tr>
                    <td>${frais.categorie_nom}</td>
                    <td>${formaterMontant(frais.montant_restant)}</td>
                    <td>${frais.periodicite}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : ''}
          
          <div class="montant-total">
            TOTAL DÛ : ${formaterMontant(eleve.total_reste_a_payer)}
          </div>
          
          <div class="message-relance">
            ${messagePersonnalise.replace(/\*/g, '**')}
          </div>
          
          <div class="signature">
            <div class="signature-stamp">
              <strong>La Comptabilité</strong><br>
              ${parametresEcole.nom_ecole || 'Établissement Scolaire'}
            </div>
          </div>
          
          <div class="footer-relance">
            Document généré automatiquement • Élève ${index + 1} sur ${relanceMultipleData.eleves.length}
          </div>
          
          <div class="page-number">
            Page ${index + 1}
          </div>
        </div>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Relances de paiement - ${relanceMultipleData.eleves.length} élève(s)</title>
          ${styles}
        </head>
        <body>
          ${contenuHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
    
    stockerRelancesMultiple('impression');
  };

  // Stocker toutes les relances
  const stockerRelancesMultiple = async (methode: string) => {
    if (!relanceMultipleData) return;
    
    try {
      for (const eleve of relanceMultipleData.eleves) {
        const messagePersonnalise = eleve.messagePersonnalise || genererMessageRelancePersonnalise(eleve);
        
        await fetch('/api/finance/relances', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eleve_id: eleve.id,
            parent_telephone: eleve.telephone_parent,
            parent_email: eleve.email_parents,
            message: messagePersonnalise,
            montant_du: eleve.total_reste_a_payer,
            methode_envoi: methode,
            statut: 'envoye',
            envoye_par: 1
          })
        });
      }
    } catch (error) {
      console.error('Erreur stockage relances multiples:', error);
    }
  };

  const defilerVersEtape = (etapeId: string) => {
    setTimeout(() => {
      const element = document.getElementById(etapeId);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const chargerPaiements = async (nouvelleVue?: 'derniers' | 'tous') => {
    try {
      setChargement(true);
      setErreur(null);
      
      const vueAUtiliser = nouvelleVue || vueActuelle;
      
      const params = new URLSearchParams();
      params.append('vue', vueAUtiliser);
      
      if (filtres.date_debut && filtres.date_debut.trim() !== '') {
        params.append('date_debut', filtres.date_debut);
      }
      if (filtres.date_fin && filtres.date_fin.trim() !== '') {
        params.append('date_fin', filtres.date_fin);
      }
      if (filtres.classe_id && filtres.classe_id.trim() !== '') {
        params.append('classe_id', filtres.classe_id);
      }
      if (filtres.mode_paiement && filtres.mode_paiement.trim() !== '') {
        params.append('mode_paiement', filtres.mode_paiement);
      }
      if (filtres.statut && filtres.statut.trim() !== '') {
        params.append('statut', filtres.statut);
      }
      if (filtres.eleve_id && filtres.eleve_id.trim() !== '') {
        params.append('eleve_id', filtres.eleve_id);
      }
      
      if (filtres.categorie_frais_id && filtres.categorie_frais_id.trim() !== '') {
        params.append('categorie_frais_id', filtres.categorie_frais_id);
      }
      
      if (filtres.du_jour) params.append('du_jour', 'true');
      if (filtres.du_mois) params.append('du_mois', 'true');
      if (filtres.de_l_annee) params.append('de_l_annee', 'true');
      
      params.append('tri_champ', triPaiement.champ);
      params.append('tri_direction', triPaiement.direction);
      params.append('page', page.toString());
      params.append('limit', itemsParPage.toString());
      
      const url = `/api/finance/paiements?${params.toString()}`;
      console.log('📡 Chargement URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        if (vueAUtiliser === 'derniers') {
          setDerniersPaiements(data.paiements || []);
          setTotalPaiements(data.total || 0);
          setTotalPages(data.totalPages || 1);
          calculerTotaux(data.paiements || [], 'derniers');
        } else {
          setPaiements(data.paiements || []);
          setTotalPaiements(data.total || 0);
          setTotalPages(data.totalPages || 1);
          calculerTotaux(data.paiements || [], 'tous');
        }
        
        if (nouvelleVue) {
          setVueActuelle(nouvelleVue);
        }
        
        await chargerTotauxReels();
        
        console.log(`✅ ${data.paiements?.length || 0} paiements chargés`);
      } else {
        console.warn('⚠️ Erreur API mais données reçues:', data);
        setAlerte({ type: 'warning', message: data.erreur || 'Erreur lors du chargement' });
        setDerniersPaiements([]);
        setPaiements([]);
        setTotalPaiements(0);
        setTotalPages(1);
        setTotaux({ total_a_payer: 0, total_paye: 0, reste_a_payer: 0 });
        setTotauxReels({ total_a_payer_reel: 0, total_paye_reel: 0, reste_a_payer_reel: 0 });
      }
        
    } catch (error: any) {
      console.error('❌ Erreur chargement paiements:', error);
      
      setAlerte({ 
        type: 'error', 
        message: 'Erreur de connexion. Vérifiez votre réseau.' 
      });
      
      setDerniersPaiements([]);
      setPaiements([]);
      setTotalPaiements(0);
      setTotalPages(1);
      setTotaux({ total_a_payer: 0, total_paye: 0, reste_a_payer: 0 });
      setTotauxReels({ total_a_payer_reel: 0, total_paye_reel: 0, reste_a_payer_reel: 0 });
      
    } finally {
      setChargement(false);
    }
  };

  // Fonction pour exporter en Excel
  const exporterEnExcel = async (type: 'tout' | 'filtre' = 'filtre') => {
    try {
      setExportEnCours(true);
      
      const params = new URLSearchParams();
      params.append('vue', vueActuelle);
      
      if (filtres.date_debut && filtres.date_debut.trim() !== '') {
        params.append('date_debut', filtres.date_debut);
      }
      if (filtres.date_fin && filtres.date_fin.trim() !== '') {
        params.append('date_fin', filtres.date_fin);
      }
      if (filtres.classe_id && filtres.classe_id.trim() !== '') {
        params.append('classe_id', filtres.classe_id);
      }
      if (filtres.mode_paiement && filtres.mode_paiement.trim() !== '') {
        params.append('mode_paiement', filtres.mode_paiement);
      }
      if (filtres.statut && filtres.statut.trim() !== '') {
        params.append('statut', filtres.statut);
      }
      if (filtres.eleve_id && filtres.eleve_id.trim() !== '') {
        params.append('eleve_id', filtres.eleve_id);
      }
      
      if (filtres.categorie_frais_id && filtres.categorie_frais_id.trim() !== '') {
        params.append('categorie_frais_id', filtres.categorie_frais_id);
      }
      
      if (filtres.du_jour) params.append('du_jour', 'true');
      if (filtres.du_mois) params.append('du_mois', 'true');
      if (filtres.de_l_annee) params.append('de_l_annee', 'true');
      
      params.append('tri_champ', triPaiement.champ);
      params.append('tri_direction', triPaiement.direction);
      
      if (type === 'tout') {
        params.append('tous', 'true');
      } else {
        params.append('page', page.toString());
        params.append('limit', itemsParPage.toString());
      }
      
      const url = `/api/finance/paiements/export?${params.toString()}`;
      console.log('📡 Export URL:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.erreur || 'Erreur lors de l\'exportation');
      }
      
      const paiementsAExporter = data.paiements || [];
      
      let totalPaye = 0;
      let totalReste = 0;
      
      if (vueActuelle === 'derniers') {
        paiementsAExporter.forEach((paiement: any) => {
          totalPaye += Number(paiement.montant) || 0;
          totalReste += Number(paiement.reste_a_payer) || 0;
        });
      } else {
        const resteParFrais = new Map();
        
        paiementsAExporter.forEach((paiement: any) => {
          totalPaye += Number(paiement.montant) || 0;
          
          if (paiement.frais_eleve_id && paiement.reste_a_payer !== undefined) {
            resteParFrais.set(paiement.frais_eleve_id, Number(paiement.reste_a_payer) || 0);
          }
        });
        
        resteParFrais.forEach(reste => {
          totalReste += reste;
        });
      }
      
      const totalAPayer = totalPaye + totalReste;
      
      const donneesFormatees = paiementsAExporter.map((paiement: any, index: number) => {
        return {
          'N°': index + 1,
          'Élève': paiement.eleve_nom_complet || `${paiement.eleve_prenom || ''} ${paiement.eleve_nom || ''}`.trim(),
          'Matricule': paiement.eleve_matricule || '',
          'Classe': paiement.classe_complet || `${paiement.classe_niveau || ''} ${paiement.classe_nom || ''}`.trim(),
          'Catégorie': paiement.categorie_nom || '',
          'Périodicité': paiement.categorie_periodicite || '',
          'Statut': paiement.statut_libelle || getStatutTexte(paiement.statut_paiement || paiement.statut || 'paye'),
          'Date paiement': paiement.date_paiement_formatee || formaterDate(paiement.date_paiement),
          'Heure': formaterHeure(paiement.date_paiement),
          'Type versement': paiement.type_versement || (paiement.numero_versement ? `${paiement.numero_versement}e Versement` : 'Paiement global'),
          'Montant payé (FCFA)': Number(paiement.montant || 0).toLocaleString('fr-FR'),
          'Montant total (FCFA)': Number(paiement.montant_total || 0).toLocaleString('fr-FR'),
          'Reste à payer (FCFA)': Number(paiement.reste_a_payer || 0).toLocaleString('fr-FR'),
          'Mode paiement': paiement.mode_paiement_libelle || getModePaiementLibelle(paiement.mode_paiement),
          'Référence': paiement.reference_paiement || '',
          'N° Reçu': paiement.numero_recu || '',
          'Notes': paiement.notes || '',
          'Année scolaire': paiement.annee_scolaire || ''
        };
      });
      
      donneesFormatees.push({
        'N°': '',
        'Élève': '📊 TOTAUX',
        'Matricule': '',
        'Classe': '',
        'Catégorie': '',
        'Périodicité': '',
        'Statut': '',
        'Date paiement': '',
        'Heure': '',
        'Type versement': vueActuelle === 'derniers' ? 'Derniers paiements' : 'Tous les paiements',
        'Montant payé (FCFA)': totalPaye.toLocaleString('fr-FR'),
        'Montant total (FCFA)': totalAPayer.toLocaleString('fr-FR'),
        'Reste à payer (FCFA)': totalReste.toLocaleString('fr-FR'),
        'Mode paiement': '',
        'Référence': '',
        'N° Reçu': '',
        'Notes': `Export ${vueActuelle === 'derniers' ? 'derniers paiements' : 'tous les paiements'} - ${formaterDate(new Date())}`,
        'Année scolaire': ''
      });
      
      const titre = `Paiements_${vueActuelle === 'derniers' ? 'derniers' : 'tous'}_${new Date().toISOString().split('T')[0]}`;
      
      import('xlsx').then(XLSX => {
        const classeur = XLSX.utils.book_new();
        const feuille = XLSX.utils.json_to_sheet(donneesFormatees);
        
        feuille['!cols'] = [
          { wch: 5 },   // N°
          { wch: 30 },  // Élève
          { wch: 15 },  // Matricule
          { wch: 20 },  // Classe
          { wch: 20 },  // Catégorie
          { wch: 12 },  // Périodicité
          { wch: 15 },  // Statut
          { wch: 15 },  // Date paiement
          { wch: 10 },  // Heure
          { wch: 20 },  // Type versement
          { wch: 18 },  // Montant payé
          { wch: 18 },  // Montant total
          { wch: 18 },  // Reste à payer
          { wch: 15 },  // Mode paiement
          { wch: 20 },  // Référence
          { wch: 12 },  // N° Reçu
          { wch: 30 },  // Notes
          { wch: 15 },  // Année scolaire
        ];
        
        XLSX.utils.book_append_sheet(classeur, feuille, 'Paiements');
        
        const dateStr = new Date().toISOString().split('T')[0];
        const heureStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
        const nomFichier = `${titre}_${heureStr}.xlsx`;
        
        XLSX.writeFile(classeur, nomFichier);
        
        setAlerte({ 
          type: 'success', 
          message: `Export réussi ! ${paiementsAExporter.length} paiements exportés.` 
        });
      }).catch(err => {
        console.error('❌ Erreur chargement XLSX:', err);
        throw new Error('Erreur lors de la génération du fichier Excel');
      });
      
    } catch (error: any) {
      console.error('❌ Erreur export Excel:', error);
      setAlerte({ 
        type: 'error', 
        message: `Erreur lors de l'exportation: ${error.message}` 
      });
    } finally {
      setExportEnCours(false);
    }
  };

  // Imprimer la liste des paiements
  const imprimerPaiements = useCallback(async () => {
    try {
      setExportEnCours(true);
      
      let ecole = parametresEcole;
      if (!ecole) {
        try {
          const response = await fetch('/api/parametres/ecole');
          const data = await response.json();
          if (data.success) {
            ecole = data.parametres;
            setParametresEcole(ecole);
          }
        } catch (error) {
          console.error('Erreur chargement paramètres:', error);
        }
      }
      
      const sourcePaiements = vueActuelle === 'derniers' ? derniersPaiements : paiements;
      const paiementsAImprimer = sourcePaiements.slice((page - 1) * itemsParPage, page * itemsParPage);
      
      if (paiementsAImprimer.length === 0) {
        setAlerte({ type: 'error', message: 'Aucun paiement à imprimer' });
        setExportEnCours(false);
        return;
      }
      
      let totalPaye = 0;
      let totalReste = 0;
      
      if (vueActuelle === 'derniers') {
        paiementsAImprimer.forEach(p => {
          totalPaye += Number(p.montant) || 0;
          totalReste += Number(p.reste_a_payer) || 0;
        });
      } else {
        const resteParFrais = new Map();
        
        paiementsAImprimer.forEach(p => {
          totalPaye += Number(p.montant) || 0;
          
          if (p.frais_eleve_id && p.reste_a_payer !== undefined) {
            resteParFrais.set(p.frais_eleve_id, Number(p.reste_a_payer) || 0);
          }
        });
        
        resteParFrais.forEach(reste => {
          totalReste += reste;
        });
      }
      
      const totalAPayer = totalPaye + totalReste;
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        setAlerte({ type: 'error', message: 'Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez vos bloqueurs de popups.' });
        setExportEnCours(false);
        return;
      }
      
      const lignesTableau = paiementsAImprimer.map((paiement, index) => {
        const numLigne = (page - 1) * itemsParPage + index + 1;
        const montant = formaterMontant(Number(paiement.montant) || 0);
        const reste = paiement.reste_a_payer ? formaterMontant(Number(paiement.reste_a_payer)) : '0 FCFA';
        const classe = `${paiement.classe_niveau || ''} ${paiement.classe_nom || ''}`.trim();
        const eleve = `${paiement.eleve_nom || ''} ${paiement.eleve_prenom || ''}`.trim();
        const categorie = paiement.categorie_nom || '';
        const versement = paiement.numero_versement ? `${paiement.numero_versement}e Versement` : 'Global';
        const date = formaterDate(paiement.date_paiement);
        const statut = getStatutTexte(paiement.statut_paiement || paiement.statut || 'paye');
        
        return `
          <tr>
            <td style="text-align: center; padding: 8px; border: 1px solid #ddd;">${numLigne}</td>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>${eleve}</strong><br><small style="color: #666;">${paiement.eleve_matricule || ''}</small></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${classe}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${categorie}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${date}</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${versement}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${montant}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${reste}</td>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${statut}</td>
          </tr>
        `;
      }).join('');
      
      const styles = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            line-height: 1.5;
            color: #333;
            background: white;
          }
          
          .page {
            padding: 20mm 15mm;
            min-height: 297mm;
            position: relative;
          }
          
          .header {
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 2px solid ${ecole?.couleur_principale || '#3b82f6'};
            display: flex;
            align-items: center;
            gap: 20px;
          }
          
          .logo {
            max-width: 80px;
            max-height: 80px;
            object-fit: contain;
          }
          
          .ecole-info {
            flex: 1;
          }
          
          .ecole-nom {
            font-size: 24px;
            font-weight: 700;
            color: ${ecole?.couleur_principale || '#3b82f6'};
            margin-bottom: 5px;
          }
          
          .ecole-details {
            font-size: 11px;
            color: #666;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
          }
          
          .titre-document {
            text-align: center;
            margin: 20px 0;
            font-size: 18px;
            font-weight: 600;
            color: #333;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .filtres-info {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 20px;
            font-size: 11px;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
          }
          
          .filtre-item {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          
          .filtre-label {
            font-weight: 600;
            color: #475569;
          }
          
          .filtre-valeur {
            color: #1e293b;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
          }
          
          th {
            background: ${ecole?.couleur_principale || '#3b82f6'};
            color: white;
            font-weight: 600;
            padding: 10px;
            text-align: left;
            border: 1px solid ${ecole?.couleur_principale || '#3b82f6'};
            white-space: nowrap;
          }
          
          td {
            padding: 8px 10px;
            border: 1px solid #e2e8f0;
            vertical-align: top;
          }
          
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          .total-section {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid ${ecole?.couleur_principale || '#3b82f6'};
            display: flex;
            justify-content: flex-end;
          }
          
          .total-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px 25px;
            min-width: 300px;
          }
          
          .total-ligne {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px dashed #e2e8f0;
          }
          
          .total-ligne:last-child {
            border-bottom: none;
            font-weight: 700;
            font-size: 13px;
            padding-top: 10px;
            margin-top: 5px;
            border-top: 2px solid #e2e8f0;
          }
          
          .total-label {
            color: #475569;
          }
          
          .total-valeur {
            font-weight: 600;
            color: #059669;
          }
          
          .total-valeur.reste {
            color: #dc2626;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #94a3b8;
          }
          
          .footer-left {
            display: flex;
            gap: 20px;
          }
          
          .footer-right {
            text-align: right;
          }
          
          .signature {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          
          .signature-box {
            text-align: center;
            width: 200px;
          }
          
          .signature-line {
            border-top: 1px solid #333;
            margin-top: 40px;
            padding-top: 10px;
          }
          
          @media print {
            body {
              padding: 0;
            }
            
            .page {
              padding: 15mm;
            }
            
            .no-print {
              display: none !important;
            }
          }
          
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
          }
          
          .badge-paye {
            background: #d1fae5;
            color: #065f46;
          }
          
          .badge-attente {
            background: #fef3c7;
            color: #92400e;
          }
          
          .badge-retard {
            background: #fee2e2;
            color: #991b1b;
          }
        </style>
      `;
      
      const filtresActifs = [];
      if (filtres.classe_id) {
        const classe = classes.find(c => c.id.toString() === filtres.classe_id);
        if (classe) filtresActifs.push(`<span class="filtre-item"><span class="filtre-label">Classe:</span> <span class="filtre-valeur">${classe.niveau} ${classe.nom}</span></span>`);
      }
      if (filtres.mode_paiement) {
        filtresActifs.push(`<span class="filtre-item"><span class="filtre-label">Mode:</span> <span class="filtre-valeur">${getModePaiementLibelle(filtres.mode_paiement)}</span></span>`);
      }
      if (filtres.statut) {
        filtresActifs.push(`<span class="filtre-item"><span class="filtre-label">Statut:</span> <span class="filtre-valeur">${getStatutTexte(filtres.statut)}</span></span>`);
      }
      if (filtres.categorie_frais_id) {
        const categorie = categoriesFrais.find(c => c.id.toString() === filtres.categorie_frais_id);
        if (categorie) filtresActifs.push(`<span class="filtre-item"><span class="filtre-label">Catégorie:</span> <span class="filtre-valeur">${categorie.nom}</span></span>`);
      }
      if (filtres.date_debut || filtres.date_fin) {
        filtresActifs.push(`<span class="filtre-item"><span class="filtre-label">Période:</span> <span class="filtre-valeur">${filtres.date_debut || '...'} → ${filtres.date_fin || '...'}</span></span>`);
      }
      if (filtres.du_jour) filtresActifs.push(`<span class="filtre-item"><span class="filtre-label">Filtre:</span> <span class="filtre-valeur">Du jour</span></span>`);
      if (filtres.du_mois) filtresActifs.push(`<span class="filtre-item"><span class="filtre-label">Filtre:</span> <span class="filtre-valeur">Du mois</span></span>`);
      if (filtres.de_l_annee) filtresActifs.push(`<span class="filtre-item"><span class="filtre-label">Filtre:</span> <span class="filtre-valeur">De l'année</span></span>`);
      
      const resumeFiltres = filtresActifs.length > 0 
        ? `<div class="filtres-info">${filtresActifs.join('')}</div>`
        : '';
      
      const htmlComplet = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Liste des paiements - ${ecole?.nom_ecole || 'École'}</title>
          <meta charset="UTF-8">
          ${styles}
        </head>
        <body>
          <div class="page">
            <div class="header">
              ${ecole?.logo_url ? 
                `<img src="${ecole.logo_url}" alt="Logo" class="logo">` : 
                `<div style="width: 80px; height: 80px; background: ${ecole?.couleur_principale || '#3b82f6'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 24px;">🏫</div>`
              }
              <div class="ecole-info">
                <div class="ecole-nom">${ecole?.nom_ecole || 'Établissement Scolaire'}</div>
                <div class="ecole-details">
                  <span>📍 ${ecole?.adresse || 'Adresse non renseignée'}</span>
                  <span>📞 ${ecole?.telephone || 'Tél. non renseigné'}</span>
                  <span>✉️ ${ecole?.email || 'Email non renseigné'}</span>
                </div>
              </div>
            </div>
            
            <div class="titre-document">
              📋 LISTE DES PAIEMENTS - ${vueActuelle === 'derniers' ? 'DERNIERS PAIEMENTS' : 'TOUS LES PAIEMENTS'}
            </div>
            
            ${resumeFiltres}
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 11px;">
              <div><strong>Date d'édition:</strong> ${formaterDate(new Date())} à ${formaterHeure(new Date())}</div>
              <div><strong>Année scolaire:</strong> ${anneeScolaire}</div>
              <div><strong>Nombre de paiements:</strong> ${paiementsAImprimer.length}</div>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th style="text-align: center;">N°</th>
                  <th>Élève</th>
                  <th>Classe</th>
                  <th>Catégorie</th>
                  <th>Date</th>
                  <th>Versement</th>
                  <th style="text-align: right;">Montant</th>
                  <th style="text-align: right;">Reste</th>
                  <th style="text-align: center;">Statut</th>
                </tr>
              </thead>
              <tbody>
                ${lignesTableau}
              </tbody>
            </table>
            
            <div class="total-section">
              <div class="total-box">
                <div class="total-ligne">
                  <span class="total-label">Total à payer :</span>
                  <span class="total-valeur">${formaterMontant(totalAPayer)}</span>
                </div>
                <div class="total-ligne">
                  <span class="total-label">Total payé :</span>
                  <span class="total-valeur">${formaterMontant(totalPaye)}</span>
                </div>
                <div class="total-ligne">
                  <span class="total-label">Reste à payer :</span>
                  <span class="total-valeur reste">${formaterMontant(totalReste)}</span>
                </div>
                <div class="total-ligne">
                  <span class="total-label">Nombre de paiements :</span>
                  <span class="total-valeur">${paiementsAImprimer.length}</span>
                </div>
              </div>
            </div>
            
            <div class="signature">
              <div class="signature-box">
                <div class="signature-line">Le Caissier(ère)</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">Le Comptable</div>
              </div>
              <div class="signature-box">
                <div class="signature-line">Le Directeur(trice)</div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-left">
                <span>📅 ${formaterDate(new Date())}</span>
                <span>🕐 ${formaterHeure(new Date())}</span>
                <span>📄 Page 1/1</span>
              </div>
              <div class="footer-right">
                <span>${ecole?.nom_ecole || 'Établissement Scolaire'} - Document généré automatiquement</span>
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                setTimeout(function() {
                  window.close();
                }, 1000);
              }, 500);
            };
          </script>
        </body>
        </html>
      `;
      
      printWindow.document.open();
      printWindow.document.write(htmlComplet);
      printWindow.document.close();
      
      setAlerte({ 
        type: 'success', 
        message: `Préparation de l'impression pour ${paiementsAImprimer.length} paiements...` 
      });
      
    } catch (error: any) {
      console.error('❌ Erreur impression:', error);
      setAlerte({ 
        type: 'error', 
        message: `Erreur lors de l'impression: ${error.message}` 
      });
    } finally {
      setExportEnCours(false);
    }
  }, [vueActuelle, derniersPaiements, paiements, page, itemsParPage, filtres, classes, categoriesFrais, anneeScolaire, parametresEcole, parametresApp]);

  // Fonctions utilitaires
  const getStatutTexte = (statut: string): string => {
    const textes: Record<string, string> = {
      'paye': 'Payé',
      'en_attente': 'En attente',
      'partiel': 'Partiel',
      'en_retard': 'En retard',
      'annule': 'Annulé'
    };
    return textes[statut] || statut;
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

  const getStatutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      'paye': 'badge-succes',
      'en_attente': 'badge-attente',
      'partiel': 'badge-partiel',
      'en_retard': 'badge-retard',
      'annule': 'badge-annule'
    };
    
    const textes: Record<string, string> = {
      'paye': 'Payé',
      'en_attente': 'En attente',
      'partiel': 'Partiel',
      'en_retard': 'En retard',
      'annule': 'Annulé'
    };
    
    return (
      <span className={`badge-statut ${styles[statut] || 'badge-default'}`}>
        {textes[statut] || statut}
      </span>
    );
  };

  const getPeriodiciteLabel = (periodicite: string) => {
    const labels: Record<string, string> = {
      'unique': 'Unique',
      'mensuel': 'Mensuel',
      'trimestriel': 'Trimestriel',
      'annuel': 'Annuel'
    };
    return labels[periodicite] || periodicite;
  };

  const filtrerDerniersPaiements = (paiements: Paiement[]): Paiement[] => {
    const paiementsParEleve: Record<number, Paiement[]> = {};
    
    paiements.forEach(paiement => {
      if (!paiementsParEleve[paiement.eleve_id]) {
        paiementsParEleve[paiement.eleve_id] = [];
      }
      paiementsParEleve[paiement.eleve_id].push(paiement);
    });

    const derniersPaiements: Paiement[] = [];
    
    Object.values(paiementsParEleve).forEach(paiementsEleve => {
      if (paiementsEleve.length > 0) {
        const paiementsTries = [...paiementsEleve].sort((a, b) => {
          const dateA = new Date(a.date_paiement || a.created_at || '').getTime();
          const dateB = new Date(b.date_paiement || b.created_at || '').getTime();
          return dateB - dateA;
        });
        
        derniersPaiements.push(paiementsTries[0]);
      }
    });
    
    return derniersPaiements;
  };

  // Charger l'historique d'un élève
  const chargerHistoriqueEleve = async (eleveId: number) => {
    try {
      const eleveInfo = derniersPaiements.find(p => p.eleve_id === eleveId);
      
      if (!eleveInfo) {
        setAlerte({ type: 'error', message: 'Informations de l\'élève non disponibles' });
        return;
      }
      
      setHistoriqueOuvert(eleveId);
      
    } catch (error: any) {
      console.error('❌ Erreur chargement historique:', error);
      setAlerte({ 
        type: 'error', 
        message: 'Erreur lors de l\'ouverture de l\'historique' 
      });
    }
  };

  // Fermer l'historique
  const fermerHistorique = () => {
    setHistoriqueOuvert(null);
    setHistoriqueEleve(null);
  };
  
  const handleModifierPaiement = (paiement: Paiement) => {
    setPaiementSelectionne(paiement);
    setModalEditOpen(true);
  };

  const chargerElevesParClasse = async (classeId: number) => {
    try {
      const response = await fetch(`/api/eleves?classe_id=${classeId}&statut=actif`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEleves(data.eleves || []);
        } else {
          setAlerte({ type: 'error', message: 'Erreur lors du chargement des élèves' });
        }
      }
    } catch (error) {
      console.error('Erreur chargement élèves:', error);
      setAlerte({ type: 'error', message: 'Erreur lors du chargement des élèves' });
    }
  };
  
  const chargerFraisScolairesParClasse = async (classeId: number) => {
    try {
      const response = await fetch(`/api/finance/frais-scolaires?classe_id=${classeId}&annee_scolaire=${anneeScolaire}&statut=actif`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFraisScolaires(data.frais || []);
        } else {
          setAlerte({ type: 'error', message: 'Erreur lors du chargement des frais scolaires' });
        }
      }
    } catch (error) {
      console.error('Erreur chargement frais scolaires:', error);
      setAlerte({ type: 'error', message: 'Erreur lors du chargement des frais scolaires' });
    }
  };
  
  const chargerFraisEleve = async (eleveId: number) => {
    try {
      const response = await fetch(`/api/finance/frais-eleves?eleve_id=${eleveId}&annee_scolaire=${anneeScolaire}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const fraisAvecRestant = (data.frais || []).map((frais: FraisEleve) => ({
            ...frais,
            frais_restant: frais.montant - frais.montant_paye
          }));
          setFraisEleves(fraisAvecRestant);
        }
      }
    } catch (error) {
      console.error('Erreur chargement frais élève:', error);
    }
  };
  
  const chargerVersementsScolarite = async (fraisEleveId: number) => {
    try {
      const response = await fetch(`/api/finance/versements-scolarite?frais_eleve_id=${fraisEleveId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setVersements(data.versements || []);
          
          const versementsNonPayes = (data.versements || []).filter((v: VersementScolarite) => 
            v.statut !== 'paye' && v.montant_paye < v.montant_versement
          );
          const prochainVersement = versementsNonPayes.length > 0 
            ? Math.min(...versementsNonPayes.map((v: VersementScolarite) => v.numero_versement))
            : (data.versements?.length || 0) + 1;
          
          if (formPaiement.is_versement) {
            const montantVersement = versementsNonPayes.find((v: VersementScolarite) => 
              v.numero_versement === prochainVersement
            )?.montant_versement || calculerMontantVersement();
            
            setFormPaiement(prev => ({
              ...prev,
              montant: montantVersement,
              numero_versement: prochainVersement
            }));
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement versements:', error);
    }
  };

  const verifierPaiementPeriodique = async (eleveId: number, fraisScolaireId: number, periodicite: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/finance/verifier-paiement-periodique?eleve_id=${eleveId}&frais_scolaire_id=${fraisScolaireId}&periodicite=${periodicite}`);
      if (response.ok) {
        const data = await response.json();
        return data.peut_payer || true;
      }
      return true;
    } catch (error) {
      console.error('Erreur vérification paiement périodique:', error);
      return true;
    }
  };
    
  const verifierInscriptionPayee = async (eleveId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/finance/verifier-inscription?eleve_id=${eleveId}&annee_scolaire=${anneeScolaire}`);
      if (response.ok) {
        const data = await response.json();
        return data.inscription_payee || false;
      }
      return true;
    } catch (error) {
      console.error('Erreur vérification inscription:', error);
      return true;
    }
  };
  
  const handleSelectionClasse = async (classeId: number) => {
    setClasseSelectionnee(classeId);
    setEleveSelectionne(null);
    setFraisSelectionne(null);
    setFraisScolaires([]);
    setEleves([]);
    
    await chargerElevesParClasse(classeId);
    await chargerFraisScolairesParClasse(classeId);
    
    defilerVersEtapeEleve();
  };
  
  const handleSelectionEleve = async (eleveId: number) => {
    setEleveSelectionne(eleveId);
    setFraisSelectionne(null);
    setVersementSelectionne(null);
    setVersements([]);
    
    await chargerFraisEleve(eleveId);
    
    setFormPaiement(prev => ({
      ...prev,
      eleve_id: eleveId,
      frais_eleve_id: null,
      frais_scolaire_id: null,
      montant: 0
    }));
    
    defilerVersEtapeFrais();
  };
  
  const handleSelectionFrais = async (frais: FraisScolaire) => {
    if (!eleveSelectionne) {
      setAlerte({ type: 'error', message: 'Veuillez d\'abord sélectionner un élève' });
      return;
    }
    
    setFraisSelectionne(frais);
    setVersementSelectionne(null);
    setNumeroVersement(1);
    
    if (frais.categorie_type === 'scolarite') {
      try {
        const response = await fetch(
          `/api/finance/verifier-inscription?eleve_id=${eleveSelectionne}&annee_scolaire=${anneeScolaire}`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          if (!data.inscription_payee) {
            setAlerte({
              type: 'error',
              message: 'L\'inscription doit être payée avant de pouvoir payer la scolarité.'
            });
            setFraisSelectionne(null);
            return;
          }
        }
      } catch (error) {
        console.error('Erreur vérification inscription:', error);
        setAlerte({
          type: 'warning', 
          message: 'Impossible de vérifier le statut de l\'inscription. Veuillez continuer avec prudence.'
        });
      }
    }
    
    if (frais.categorie_type !== 'scolarite') {
      const peutPayer = await verifierPaiementPeriodique(eleveSelectionne, frais.id, frais.periodicite);
      if (!peutPayer) {
        setAlerte({
          type: 'error',
          message: `Ce frais de type "${frais.periodicite}" a déjà été payé pour la période en cours.`
        });
        setFraisSelectionne(null);
        return;
      }
    }
    
    const fraisEleveExistant = fraisEleves.find(fe => 
      fe.frais_scolaire_id === frais.id && fe.eleve_id === eleveSelectionne
    );
    
    if (fraisEleveExistant) {
      setFormPaiement(prev => ({
        ...prev,
        frais_eleve_id: fraisEleveExistant.id,
        frais_scolaire_id: frais.id,
        montant: fraisEleveExistant.frais_restant || frais.montant - fraisEleveExistant.montant_paye
      }));
      
      setMontantTotalScolarite(frais.montant);
      setMontantRestantScolarite(fraisEleveExistant.frais_restant || frais.montant - fraisEleveExistant.montant_paye);
      
      if (frais.categorie_type === 'scolarite') {
        await chargerVersementsScolarite(fraisEleveExistant.id);
      }
    } else {
      setFormPaiement(prev => ({
        ...prev,
        frais_eleve_id: null,
        frais_scolaire_id: frais.id,
        montant: frais.montant
      }));
      
      setMontantTotalScolarite(frais.montant);
      setMontantRestantScolarite(frais.montant);
    }
    
    if (frais.categorie_type === 'scolarite') {
      defilerVersEtapeConfigScolarite();
    } else {
      defilerVersEtapeDetails();
    }
  };

  const verifierPaiementGlobalScolarite = async (eleveId: number, fraisScolaireId: number): Promise<boolean> => {
    try {
      const response = await fetch(
        `/api/finance/verifier-paiement-scolarite?eleve_id=${eleveId}&frais_scolaire_id=${fraisScolaireId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return data.peut_payer || true;
      }
      return true;
    } catch (error) {
      console.error('Erreur vérification paiement scolarité:', error);
      return true;
    }
  };
  
  const handleSelectionVersement = (versementId: number) => {
    const versement = versements.find(v => v.id === versementId);
    if (!versement) return;
    
    setVersementSelectionne(versementId);
    
    const montantDu = versement.montant_versement - versement.montant_paye;
    
    setFormPaiement(prev => ({
      ...prev,
      montant: montantDu,
      numero_versement: versement.numero_versement,
      versement_id: versement.id,
      is_versement: true
    }));
  };
  
  const calculerMontantVersement = () => {
    if (!fraisSelectionne || !montantRestantScolarite || numeroVersement < 1) return 0;
    
    if (versements.length === 0) {
      return Math.ceil(montantRestantScolarite / numeroVersement);
    }
    
    const prochainVersement = trouverProchainVersement();
    const versementTrouve = versements.find(v => v.numero_versement === prochainVersement);
    
    if (versementTrouve) {
      return versementTrouve.montant_versement - versementTrouve.montant_paye;
    }
    
    const versementsPayes = versements.filter(v => v.statut === 'paye').length;
    const versementsRestants = Math.max(1, numeroVersement - versementsPayes);
    return Math.ceil(montantRestantScolarite / versementsRestants);
  };

  const trouverProchainVersement = (): number => {
    const versementsNonPayes = versements.filter(v => 
      v.statut !== 'paye' && v.montant_paye < v.montant_versement
    );
    
    if (versementsNonPayes.length > 0) {
      return Math.min(...versementsNonPayes.map(v => v.numero_versement));
    }
    
    return versements.length > 0 ? Math.max(...versements.map(v => v.numero_versement)) + 1 : 1;
  };
  
  const handleNombreVersementsChange = (nombre: number) => {
    if (nombre < 1) return;
    if (versements.length > 0) {
      const versementsPayes = versements.filter(v => v.statut === 'paye' || v.montant_paye > 0);
      
      if (versementsPayes.length > 0) {
        const dernierNumeroVersementPaye = Math.max(...versementsPayes.map(v => v.numero_versement));
        const nombreRecommande = Math.max(dernierNumeroVersementPaye + 1, nombre);
        
        const nouveauNombre = Math.min(nombreRecommande, 10);
        
        if (nouveauNombre !== nombre) {
          console.log(`🔄 Ajustement automatique: ${nombre} → ${nouveauNombre} versements (basé sur dernier versement #${dernierNumeroVersementPaye})`);
          nombre = nouveauNombre;
        }
      }
    }
    
    setNumeroVersement(nombre);
    
    if (montantRestantScolarite > 0) {
      const montantParVersement = calculerMontantVersement();
      const prochainVersement = trouverProchainVersement();
      
      setFormPaiement(prev => ({
        ...prev,
        montant: montantParVersement,
        numero_versement: prochainVersement,
        is_versement: true
      }));
    }
  };

  const handleSoumettrePaiement = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formPaiement.eleve_id) {
      setAlerte({ type: 'error', message: 'Veuillez sélectionner un élève' });
      return;
    }
    
    if (!formPaiement.frais_scolaire_id) {
      setAlerte({ type: 'error', message: 'Veuillez sélectionner un frais' });
      return;
    }
    
    if (formPaiement.montant <= 0) {
      setAlerte({ type: 'error', message: 'Le montant doit être supérieur à 0' });
      return;
    }
    
    if (formPaiement.montant > montantRestantScolarite) {
      setAlerte({ type: 'error', message: `Le montant ne peut pas dépasser ${formaterMontant(montantRestantScolarite)}` });
      return;
    }
    
    if (!formPaiement.is_versement && fraisSelectionne) {
      const fraisEleveExistant = fraisEleves.find(fe => 
        fe.frais_scolaire_id === fraisSelectionne.id
      );
      
      if (fraisEleveExistant && fraisEleveExistant.statut === 'paye') {
        setAlerte({ 
          type: 'error', 
          message: 'Ce frais a déjà été payé en totalité.' 
        });
        return;
      }
    }
    
    try {
      setChargement(true);
      
      const paiementData: any = {
        ...formPaiement,
        annee_scolaire: anneeScolaire,
        created_by: 1
      };
      
      if (fraisSelectionne?.categorie_type === 'scolarite' && !formPaiement.is_versement) {
        const peutPayerGlobal = await verifierPaiementGlobalScolarite(
          formPaiement.eleve_id!, 
          formPaiement.frais_scolaire_id!
        );

        if (!peutPayerGlobal) {
          setAlerte({
            type: 'error',
            message: 'Un paiement global de scolarité a déjà été effectué pour cette année scolaire.'
          });
          setChargement(false);
          return;
        }
      }
      
      const response = await fetch('/api/finance/paiements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paiementData)
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.erreur || 'Erreur lors de l\'enregistrement du paiement');
      }
      
      setAlerte({ type: 'success', message: 'Paiement enregistré avec succès' });

      if (data.paiement) {
        setTimeout(() => {
          const imprimerMaintenant = window.confirm(
            'Paiement enregistré avec succès !\n\nSouhaitez-vous imprimer le reçu maintenant ?\n\n' +
            'Remarque : Si vous imprimez plus tard, le reçu sera marqué comme "DUPLICATA".'
          );
          
          if (imprimerMaintenant) {
            setPaiementSelectionne(data.paiement);
            setModalReceiptOpen(true);
          }
        }, 500);
      }
      
      setFormPaiement({
        frais_eleve_id: null,
        frais_scolaire_id: null,
        eleve_id: null,
        montant: 0,
        date_paiement: new Date().toISOString().split('T')[0],
        mode_paiement: 'especes',
        reference_paiement: '',
        notes: '',
        statut: 'paye',
        created_by: 1,
        is_versement: false
      });
      
      setClasseSelectionnee(null);
      setEleveSelectionne(null);
      setFraisSelectionne(null);
      setVersementSelectionne(null);
      setFraisScolaires([]);
      setEleves([]);
      setFraisEleves([]);
      setVersements([]);
      
      await chargerPaiements();
      
      setTimeout(() => {
        setOngletActif('liste');
      }, 1500);
      
    } catch (error: any) {
      console.error('❌ Erreur enregistrement paiement:', error);
      setAlerte({ 
        type: 'error', 
        message: error.message || 'Erreur lors de l\'enregistrement du paiement' 
      });
    } finally {
      setChargement(false);
    }
  };
  
  const handleImprimerRecu = (paiement: Paiement) => {
    setPaiementSelectionne(paiement);
    setModalReceiptOpen(true);
  };
  
  const handleSupprimerPaiement = (paiement: Paiement) => {
    setPaiementSelectionne(paiement);
    setModalDeleteOpen(true);
  };
  
  const refreshPaiements = () => {
    chargerPaiements();
  };

  return (
    <div className={`conteneur-gestion-paiements ${parametresApp?.theme_defaut || 'clair'}`}>
      <div className="en-tete-fixe-finance">
        <div className="conteneur-en-tete-fixe-finance">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px' }}>💰✅</span>
              <span style={{fontSize: '24px', fontWeight: '600'}}>
               Gestion des Paiements
              </span>
            </div>
        <div className="actions-globales">
          <button 
            type="button"
            className={`bouton-vue-finance ${ongletActif === 'liste' ? 'actif' : ''}`}
            onClick={() => setOngletActif('liste')}
          >
            📋 Liste des Paiements
          </button>
          <button 
            type="button"
            className={`bouton-vue-finance ${ongletActif === 'nouveau' ? 'actif' : ''}`}
            onClick={() => setOngletActif('nouveau')}
          >
            💰 Nouveau Paiement
          </button>
        </div>
        </div>
      </div>

      {alerte && (
        <div className={`alerte-modern ${alerte.type === 'success' ? 'alerte-succes-modern' : 'alerte-erreur-modern'}`}>
          <div className="contenu-alerte-modern">
            <div className="icone-alerte-modern">
              {alerte.type === 'success' ? '✅' : '⚠️'}
            </div>
            <div className="texte-alerte-modern">
              <span className="message-alerte">{alerte.message}</span>
            </div>
            <button 
              type="button"
              className="bouton-fermer-alerte-modern"
              onClick={() => setAlerte(null)}
            >
              X
            </button>
          </div>
        </div>
      )}
      
      <div className="contenu-paiements">
        {ongletActif === 'liste' && (
          <div className="section-liste-paiements">
            {/* Section des filtres */}
            <div className="carte-filtres">
              <div className="grille-filtres-paie">
                <div className="groupe-champ">
                  <label>Classe</label>
                  <select 
                    value={filtres.classe_id}
                    onChange={async (e) => {
                      const classeId = e.target.value;
                      setFiltres({...filtres, classe_id: classeId});
                      if (classeId) {
                        await chargerElevesParClasse(parseInt(classeId));
                      } else {
                        setEleves([]);
                      }
                    }}
                  >
                    <option value="">Toutes les classes</option>
                    {classes.map(classe => (
                      <option key={classe.id} value={classe.id}>
                        {classe.niveau} {classe.nom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="groupe-champ">
                  <label>Mode de paiement</label>
                  <select 
                    value={filtres.mode_paiement}
                    onChange={(e) => setFiltres({...filtres, mode_paiement: e.target.value})}
                  >
                    <option value="">Tous</option>
                    <option value="especes">Espèces</option>
                    <option value="cheque">Chèque</option>
                    <option value="virement">Virement</option>
                    <option value="carte">Carte</option>
                    <option value="mobile">Mobile Money</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                    
                <div className="groupe-champ">
                  <label>Élève</label>
                  <select 
                    value={filtres.eleve_id}
                    onChange={(e) => setFiltres({...filtres, eleve_id: e.target.value})}
                  >
                    <option value="">Tous les élèves</option>
                    {eleves.map(eleve => (
                      <option key={eleve.id} value={eleve.id}>
                        {eleve.prenom} {eleve.nom} ({eleve.matricule})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="groupe-champ">
                  <label>🏷️ Catégorie des frais</label>
                  <select 
                    value={filtres.categorie_frais_id || ''}
                    onChange={(e) => {
                      const categorieId = e.target.value;
                      setFiltres({...filtres, categorie_frais_id: categorieId});
                      setPage(1);
                    }}
                  >
                    <option value="">Toutes les catégories</option>
                    {categoriesFrais.map(categorie => (
                      <option key={categorie.id} value={categorie.id}>
                        {categorie.nom} ({categorie.periodicite})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="actions-filtres-paie">
                <div className="groupe-champ2">
                  <label>Date début : </label>
                  <input 
                    type="date" 
                    value={filtres.date_debut}
                    onChange={(e) => setFiltres({...filtres, date_debut: e.target.value})}
                  />
                </div>
                
                <div className="groupe-champ2">
                  <label>Date fin : </label>
                  <input 
                    type="date" 
                    value={filtres.date_fin}
                    onChange={(e) => setFiltres({...filtres, date_fin: e.target.value})}
                  />
                </div>
                
                <div className="filtres-rapides">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={filtres.du_jour}
                      onChange={(e) => setFiltres({...filtres, du_jour: e.target.checked})}
                    />
                    Du jour
                  </label>
                  
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={filtres.du_mois}
                      onChange={(e) => setFiltres({...filtres, du_mois: e.target.checked})}
                    />
                    Du mois
                  </label>
                  
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={filtres.de_l_annee}
                      onChange={(e) => setFiltres({...filtres, de_l_annee: e.target.checked})}
                    />
                    De l'année
                  </label>
                </div>
                
                <button 
                  type="button"
                  className="bouton-secondaire"
                  onClick={() => {
                    setFiltres({
                      date_debut: '',
                      date_fin: '',
                      classe_id: '',
                      mode_paiement: '',
                      statut: '',
                      du_jour: false,
                      du_mois: false,
                      de_l_annee: false,
                      eleve_id: '',
                      categorie_frais_mensuel_id: '', 
                      categorie_frais_id: '' 
                    });
                    setEleves([]);
                    setPage(1);
                    chargerPaiements(); 
                    chargerTotauxReels();
                  }}
                >
                  Réinitialiser
                </button>
                
                <button 
                  type="button"
                  className="bouton-primaire"
                  onClick={() => chargerPaiements()}
                >
                  Appliquer filtres
                </button>
              </div>
            </div>
            
            <div>
              <div className="entete-tableau">
                <div className="titre-et-export">
                  <div className="boutons-vue">
                    <button 
                      type="button"
                      className={`bouton-vue-finance ${vueActuelle === 'derniers' ? 'actif' : ''}`}
                      onClick={() => chargerPaiements('derniers')}
                    >
                      📌 Dernier
                    </button>
                    <button 
                      type="button"
                      className={`bouton-vue-finance ${vueActuelle === 'tous' ? 'actif' : ''}`}
                      onClick={() => chargerPaiements('tous')}
                    >
                      📋 Tous
                    </button>
                    <button 
                      type="button"
                      className="bouton-print2"
                      disabled={exportEnCours || (vueActuelle === 'derniers' ? derniersPaiements.length === 0 : paiements.length === 0)}
                      onClick={imprimerPaiements}
                      title="Imprimer la liste des paiements"
                      style={{ fontSize: '18px' }}
                    >
                      🖨️
                    </button>
                    <button 
                      type="button"
                      className="bouton-print2"
                      title="Exporter vers Excel"
                      disabled={exportEnCours || (vueActuelle === 'derniers' ? derniersPaiements.length === 0 : paiements.length === 0)}
                      onClick={() => exporterEnExcel('filtre')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="26" height="26" viewBox="0 0 48 48">
                        <path fill="#4CAF50" d="M41,10H25v28h16c0.553,0,1-0.447,1-1V11C42,10.447,41.553,10,41,10z"></path>
                        <path fill="#FFF" d="M32 15H39V18H32zM32 25H39V28H32zM32 30H39V33H32zM32 20H39V23H32zM25 15H30V18H25zM25 25H30V28H25zM25 30H30V33H25zM25 20H30V23H25z"></path>
                        <path fill="#2E7D32" d="M27 42L6 38 6 10 27 6z"></path>
                        <path fill="#FFF" d="M19.129,31l-2.411-4.561c-0.092-0.171-0.186-0.483-0.284-0.938h-0.037c-0.046,0.215-0.154,0.541-0.324,0.979L13.652,31H9.895l4.462-7.001L10.274,17h3.837l2.001,4.196c0.156,0.331,0.296,0.725,0.42,1.179h0.04c0.078-0.271,0.224-0.68,0.439-1.22L19.237,17h3.515l-4.199,6.939l4.316,7.059h-3.74V31z"></path>
                      </svg>
                      {exportEnCours ? '⏳ Exportation...' : ''}
                    </button>

                    <button 
                      type="button"
                      className={`bouton-suppression-multiple ${elevesSelectionnes.length > 0 ? 'actif' : ''}`}
                      onClick={preparerSuppressionMultiple}
                      disabled={elevesSelectionnes.length === 0 || chargementSuppression}
                    >
                      {chargementSuppression ? (
                        '⏳ Vérification...'
                      ) : (
                        <>🗑️ ({elevesSelectionnes.length})</>
                      )}
                    </button>

                    <button 
                      type="button"
                      className="bouton-relance-multiple"
                      onClick={preparerRelanceMultiple}
                      disabled={elevesSelectionnes.length === 0 || chargementRelance}
                      title='Envoyer relance'
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="24" height="24" viewBox="0 0 48 48">
                        <path fill="#fff" d="M4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98c-0.001,0,0,0,0,0h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303z"></path>
                        <path fill="#fff" d="M4.868,43.803c-0.132,0-0.26-0.052-0.355-0.148c-0.125-0.127-0.174-0.312-0.127-0.483l2.639-9.636c-1.636-2.906-2.499-6.206-2.497-9.556C4.532,13.238,13.273,4.5,24.014,4.5c5.21,0.002,10.105,2.031,13.784,5.713c3.679,3.683,5.704,8.577,5.702,13.781c-0.004,10.741-8.746,19.48-19.486,19.48c-3.189-0.001-6.344-0.788-9.144-2.277l-9.875,2.589C4.953,43.798,4.911,43.803,4.868,43.803z"></path>
                        <path fill="#cfd8dc" d="M24.014,5c5.079,0.002,9.845,1.979,13.43,5.566c3.584,3.588,5.558,8.356,5.556,13.428c-0.004,10.465-8.522,18.98-18.986,18.98h-0.008c-3.177-0.001-6.3-0.798-9.073-2.311L4.868,43.303l2.694-9.835C5.9,30.59,5.026,27.324,5.027,23.979C5.032,13.514,13.548,5,24.014,5 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974C24.014,42.974,24.014,42.974,24.014,42.974 M24.014,4C24.014,4,24.014,4,24.014,4C12.998,4,4.032,12.962,4.027,23.979c-0.001,3.367,0.849,6.685,2.461,9.622l-2.585,9.439c-0.094,0.345,0.002,0.713,0.254,0.967c0.19,0.192,0.447,0.297,0.711,0.297c0.085,0,0.17-0.011,0.254-0.033l9.687-2.54c2.828,1.468,5.998,2.243,9.197,2.244c11.024,0,19.99-8.963,19.995-19.98c0.002-5.339-2.075-10.359-5.848-14.135C34.378,6.083,29.357,4.002,24.014,4L24.014,4z"></path>
                        <path fill="#40c351" d="M35.176,12.832c-2.98-2.982-6.941-4.625-11.157-4.626c-8.704,0-15.783,7.076-15.787,15.774c-0.001,2.981,0.833,5.883,2.413,8.396l0.376,0.597l-1.595,5.821l5.973-1.566l0.577,0.342c2.422,1.438,5.2,2.198,8.032,2.199h0.006c8.698,0,15.777-7.077,15.78-15.776C39.795,19.778,38.156,15.814,35.176,12.832z"></path>
                        <path fill="#fff" fillRule="evenodd" d="M19.268,16.045c-0.355-0.79-0.729-0.806-1.068-0.82c-0.277-0.012-0.593-0.011-0.909-0.011c-0.316,0-0.83,0.119-1.265,0.594c-0.435,0.475-1.661,1.622-1.661,3.956c0,2.334,1.7,4.59,1.937,4.906c0.237,0.316,3.282,5.259,8.104,7.161c4.007,1.58,4.823,1.266,5.693,1.187c0.87-0.079,2.807-1.147,3.202-2.255c0.395-1.108,0.395-2.057,0.277-2.255c-0.119-0.198-0.435-0.316-0.909-0.554s-2.807-1.385-3.242-1.543c-0.435-0.158-0.751-0.237-1.068,0.238c-0.316,0.474-1.225,1.543-1.502,1.859c-0.277,0.317-0.554,0.357-1.028,0.119c-0.474-0.238-2.002-0.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285c-0.277-0.474-0.03-0.731,0.208-0.968c0.213-0.213,0.474-0.554,0.712-0.831c0.237-0.277,0.316-0.475,0.474-0.791c0.158-0.317,0.079-0.594-0.04-0.831C20.612,19.329,19.69,16.983,19.268,16.045z" clipRule="evenodd"></path>
                      </svg>
                      {chargementRelance ? '⏳ Préparation...' : `(${elevesSelectionnes.length})`}
                    </button>
                  </div>
                </div>
                <div className="info-pagination">
                  {vueActuelle === 'derniers' ? derniersPaiements.length : paiements.length} paiement(s) trouvé(s) - Page {page} sur {totalPages}
                </div>
              </div>
              
              {chargement ? (
                <div className="chargement-tableau">
                  <div className="spinner"></div>
                  <p>Chargement des paiements...</p>
                </div>
              ) : (vueActuelle === 'derniers' ? derniersPaiements : paiements).length === 0 ? (
                <div className="aucune-donnee">
                  <p>Aucun paiement trouvé</p>
                </div>
              ) : (
                <>
                  <div className="tableau-simple">
                    <table>
                      <thead>
                        <tr>
                          <th style={{ width: '30px' }}>
                            <input 
                              type="checkbox"
                              checked={elevesSelectionnes.length === (vueActuelle === 'derniers' 
                                ? derniersPaiements.slice((page - 1) * itemsParPage, page * itemsParPage).length
                                : paiements.slice((page - 1) * itemsParPage, page * itemsParPage).length)}
                              onChange={toggleSelectionTous}
                            />
                          </th>
                          <th>N°</th>
                          <th 
                            className="colonne-triable"
                            onClick={() => handleTri('eleve')}
                            style={{ cursor: 'pointer' }}
                          >
                            Élève {getIconeTri('eleve')}
                          </th>
                          <th 
                            className="colonne-triable"
                            onClick={() => handleTri('classe')}
                            style={{ cursor: 'pointer' }}
                          >
                            Classe {getIconeTri('classe')}
                          </th>
                          <th 
                            className="colonne-triable"
                            onClick={() => handleTri('categorie')}
                            style={{ cursor: 'pointer' }}
                          >
                            Catégorie {getIconeTri('categorie')}
                          </th>
                          <th 
                            className="colonne-triable"
                            onClick={() => handleTri('date')}
                            style={{ cursor: 'pointer' }}
                          >
                            Date {getIconeTri('date')}
                          </th>
                          <th 
                            className="colonne-triable"
                            onClick={() => handleTri('versement')}
                            style={{ cursor: 'pointer' }}
                          >
                            Versement {getIconeTri('versement')}
                          </th>
                          <th>Montant</th>
                          <th>Reste à payer</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(vueActuelle === 'derniers' ? derniersPaiements : paiements)
                          .slice((page - 1) * itemsParPage, page * itemsParPage)
                          .map((paiement, index) => (
                            <tr key={paiement.id}>
                              <td style={{ width: '30px' }}>
                                <input 
                                  type="checkbox"
                                  checked={elevesSelectionnes.includes(paiement.eleve_id)}
                                  onChange={() => toggleSelectionEleve(paiement.eleve_id)}
                                />
                              </td>
                              <td className="numero-ligne">
                                <strong>{(page - 1) * itemsParPage + index + 1}</strong>
                              </td>
                              <td>
                                <div className="eleve-info">
                                  <span onClick={() => chargerHistoriqueEleve(paiement.eleve_id)}
                                    title="Voir l'historique des paiements"
                                    style={{
                                      color: '#2563eb',
                                      cursor: 'pointer',
                                      fontWeight: '500',
                                      fontSize: '0.7rem',
                                      textDecoration: 'none',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.color = '#1d4ed8';
                                      e.currentTarget.style.textDecoration = 'underline';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.color = '#2563eb';
                                      e.currentTarget.style.textDecoration = 'none';
                                    }}
                                  >
                                    <strong>{paiement.eleve_nom} {paiement.eleve_prenom}</strong>
                                  </span>
                                  <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '2px', display: 'block' }}>
                                    {paiement.eleve_matricule}
                                  </small>
                                </div>
                              </td>
                              <td>
                                <div style={{
                                  color: '#474747',
                                  background: '#e98fff',
                                  borderRadius: '20px',
                                  fontWeight: '600',
                                  padding: '4px',
                                  textAlign: 'center',
                                  fontSize: '0.75rem'
                                }}>{paiement.classe_niveau} {paiement.classe_nom}</div>
                              </td>
                              <td>{paiement.categorie_nom}</td>
                              <td className="date-cell">
                                <span className="date-paiement">
                                  {formaterDate(paiement.date_paiement)}
                                </span>
                                {paiement.created_at && (
                                  <small className="heure-paiement">
                                    {formaterHeure(paiement.created_at)}
                                  </small>
                                )}
                              </td>
                              <td style={{ fontSize: '0.9rem' }}>
                                {paiement.numero_versement ? 
                                  `${paiement.numero_versement}e Versement` : 
                                  'Paiement global'}
                              </td>
                              <td className="montant-cell">
                                <span className="style3">{formaterMontant(paiement.montant)}</span>
                                {paiement.montant_total && (
                                  <small>sur {formaterMontant(paiement.montant_total)}</small>
                                )}
                              </td>
                              <td className="style4">
                                {paiement.reste_a_payer && paiement.reste_a_payer > 0 ? (
                                  <span className="reste-a-payer-positif">
                                    {formaterMontant(paiement.reste_a_payer)}
                                  </span>
                                ) : (
                                  <span className="style5">{formaterMontant(0)}</span>
                                )}
                              </td>
                              <td>
                                <div className="actions-buttons">
                                  <button 
                                    onClick={() => handleImprimerRecu(paiement)}
                                    className="action-button receipt"
                                    title="Voir reçu"
                                  >
                                    🧾
                                  </button>
                                  <button 
                                    onClick={() => handleModifierPaiement(paiement)}
                                    className="action-button edit"
                                    title="Modifier"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    onClick={() => handleSupprimerPaiement(paiement)}
                                    className="action-button delete"
                                    title="Supprimer"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {!chargement && (vueActuelle === 'derniers' ? derniersPaiements.length > 0 : paiements.length > 0) && (
                    <>
                      <div className="">
                        <div className="totaux-header">
                          <span className="totaux-titre">
                            {vueActuelle === 'derniers' ? '📌 Totaux (Derniers paiements par élève)' : '📋 Totaux (Tous les paiements)'}
                          </span>
                        </div>
                        <div className="totaux-container">
                          <div className="total-item">
                            <span className="total-label">Total à payer :</span>
                            <span className="total-valeur">{formaterMontant(totaux.total_a_payer)}</span> | 
                          </div>
                          <div className="total-item">
                            <span className="total-label">Total payé :</span>
                            <span className="total-valeur total-paye">{formaterMontant(totaux.total_paye)}</span> | 
                          </div>
                          <div className="total-item">
                            <span className="total-label">Reste à payer :</span>
                            <span className={`total-valeur ${totaux.reste_a_payer > 0 ? 'total-reste' : ''}`}>
                              {formaterMontant(totaux.reste_a_payer)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="">
                        <div className="totaux-header">
                          <span className="totaux-titre">💰 Totaux RÉELS (Tous frais confondus)</span>
                        </div>
                        <div className="totaux-container">
                          <div className="total-item">
                            <span className="total-label">Total à payer :</span>
                            <span className="total-valeur total-reel">{formaterMontant(totauxReels.total_a_payer_reel)}</span> | 
                          </div>
                          <div className="total-item">
                            <span className="total-label">Total payé :</span>
                            <span className="total-valeur total-paye-reel">{formaterMontant(totauxReels.total_paye_reel)}</span> |
                          </div>
                          <div className="total-item">
                            <span className="total-label">Reste à payer :</span>
                            <span className={`total-valeur ${totauxReels.reste_a_payer_reel > 0 ? 'total-reste-reel' : ''}`}>
                              {formaterMontant(totauxReels.reste_a_payer_reel)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button 
                        type="button"
                        className="bouton-pagination"
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                      >
                        ← Précédent
                      </button>
                      
                      <div className="pages">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum = page;
                          if (page > 3) {
                            pageNum = Math.max(1, page - 2) + i;
                          } else {
                            pageNum = i + 1;
                          }
                          
                          if (pageNum <= totalPages) {
                            return (
                              <button 
                                key={pageNum}
                                type="button"
                                className={`bouton-page ${page === pageNum ? 'active' : ''}`}
                                onClick={() => setPage(pageNum)}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                          return null;
                        })}
                      </div>
                      
                      <button 
                        type="button"
                        className="bouton-pagination"
                        disabled={page === totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        Suivant →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        
        {ongletActif === 'nouveau' && (
          <div>
            <h3>Nouveau Paiement</h3>
            <p className="info-annee">Année scolaire: {anneeScolaire}</p>
            
            <form onSubmit={handleSoumettrePaiement} className="formulaire-paiement">
              <div className="groupe-champ">
                {/* Étape 1: Sélection de la classe */}
                <div id="etape-classe" className="etape etape-classe">
                  <h4>Sélectionner la classe</h4>
                  
                  <div className="groupe-champ">
                    <label>Classe</label>
                    <select 
                      required
                      value={classeSelectionnee || ''}
                      onChange={async (e) => {
                        const classeId = parseInt(e.target.value);
                        if (!isNaN(classeId)) {
                          await handleSelectionClasse(classeId);
                        }
                      }}
                    >
                      <option value="">Sélectionner une classe</option>
                      {classes.map(classe => (
                        <option key={classe.id} value={classe.id}>
                          {classe.niveau} {classe.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Étape 2: Sélection de l'élève */}
                {classeSelectionnee && (
                  <div id="etape-eleve" className="etape etape-eleve">
                    <h4>Sélectionner l'élève</h4>
                    
                    <div className="groupe-champ">
                      <label>Élève</label>
                      <select 
                        required
                        value={eleveSelectionne || ''}
                        onChange={(e) => {
                          const eleveId = parseInt(e.target.value);
                          if (!isNaN(eleveId)) {
                            handleSelectionEleve(eleveId);
                          }
                        }}
                        disabled={eleves.length === 0}
                      >
                        <option value="">Sélectionner un élève</option>
                        {eleves.map(eleve => (
                          <option key={eleve.id} value={eleve.id}>
                            {eleve.prenom} {eleve.nom} - {eleve.matricule}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Frais existants de l'élève */}
                    {eleveSelectionne && fraisEleves.length > 0 && (
                      <div className="info-frais-eleve">
                        <h5>Frais existants de l'élève</h5>
                        <div className="liste-frais-existants">
                          {fraisEleves.map(frais => (
                            <div key={frais.id} className="carte-frais-existant">
                              <div className="entete-carte-frais">
                                <span className="categorie-nom">{frais.categorie_nom}</span>
                                <span className={`statut-frais ${frais.statut}`}>
                                  {getStatutBadge(frais.statut)}
                                </span>
                              </div>
                              <div className="details-carte-frais">
                                <span>Total: {formaterMontant(frais.montant)}</span>
                                <span>Payé: {formaterMontant(frais.montant_paye)}</span>
                                <span className="montant-restant">
                                  Restant: {formaterMontant(frais.frais_restant || 0)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Étape 3: Sélection du frais */}
                {classeSelectionnee && eleveSelectionne && fraisScolaires.length > 0 && (
                  <div id="etape-frais" className="etape etape-frais">
                    <h4>Sélectionner le frais à payer</h4>
                    
                    <div className="liste-frais-scolaires">
                      {fraisScolaires.map(frais => {
                        const fraisEleveExistant = fraisEleves.find(fe => 
                          fe.frais_scolaire_id === frais.id && fe.eleve_id === eleveSelectionne
                        );
                        const montantRestant = fraisEleveExistant ? 
                          (fraisEleveExistant.frais_restant || frais.montant - fraisEleveExistant.montant_paye) : 
                          frais.montant;
                        
                        const isInscription = frais.categorie_type === 'inscription' || frais.categorie_nom?.toLowerCase().includes('inscription');
                        const isScolarite = frais.categorie_type === 'scolarite';
                        const isInscriptionPayee = isInscription && fraisEleveExistant && 
                          (fraisEleveExistant.statut === 'paye' || fraisEleveExistant.montant_paye >= frais.montant);
                        
                        const isFraisUnique = frais.periodicite === 'unique' || frais.categorie_periodicite === 'unique';
                        const isFraisUniquePaye = isFraisUnique && fraisEleveExistant && 
                          (fraisEleveExistant.statut === 'paye' || fraisEleveExistant.montant_paye >= frais.montant);
                        
                        const isFraisAnnuel = frais.periodicite === 'annuel' || frais.categorie_periodicite === 'annuel';
                        const isFraisAnnuelPaye = isFraisAnnuel && fraisEleveExistant && 
                          (fraisEleveExistant.statut === 'paye' || fraisEleveExistant.montant_paye >= frais.montant);
                        
                        const isFraisAnnuelPayePourAnnee = isFraisAnnuel && fraisEleveExistant && 
                          (fraisEleveExistant.statut === 'paye' || fraisEleveExistant.montant_paye >= frais.montant) &&
                          fraisEleveExistant.annee_scolaire === anneeScolaire;
                        
                        const estFraisDesactive = 
                          isInscriptionPayee || 
                          isFraisUniquePaye || 
                          isFraisAnnuelPaye || 
                          isFraisAnnuelPayePourAnnee;
                        
                        return (
                          <div 
                            key={frais.id}
                            className={`carte-frais-scolaire ${
                              fraisSelectionne?.id === frais.id ? 'selectionne' : ''
                            } ${estFraisDesactive ? 'desactive' : ''}`}
                            onClick={() => {
                              if (estFraisDesactive) {
                                let message = '';
                                if (isInscriptionPayee) {
                                  message = 'L\'inscription est déjà payée pour cet élève.';
                                } else if (isFraisUniquePaye) {
                                  message = `Ce frais "${frais.categorie_nom}" est de type UNIQUE et a déjà été payé intégralement.`;
                                } else if (isFraisAnnuelPaye || isFraisAnnuelPayePourAnnee) {
                                  message = `Ce frais "${frais.categorie_nom}" est de type ANNUEL et a déjà été payé pour l'année scolaire ${anneeScolaire}.`;
                                }
                                setAlerte({
                                  type: 'warning',
                                  message
                                });
                                return;
                              }
                              handleSelectionFrais(frais);
                            }}
                            style={estFraisDesactive ? {
                              opacity: 0.6,
                              cursor: 'not-allowed',
                              backgroundColor: '#f9fafb',
                              borderColor: '#e5e7eb',
                              pointerEvents: 'none'
                            } : {}}
                          >
                            <div className="entete-carte-frais">
                              <h5>{frais.categorie_nom || `Frais ${frais.id}`}</h5>
                              <span className="periodicite-frais">
                                {getPeriodiciteLabel(frais.periodicite)}
                              </span>
                            </div>
                            
                            <div className="details-carte-frais">
                              <div className="montant-frais">
                                <span>Montant total: {formaterMontant(frais.montant)}</span>
                                {fraisEleveExistant && (
                                  <>
                                    <span>Déjà payé: {formaterMontant(fraisEleveExistant.montant_paye)}</span>
                                    <span className="montant-restant">
                                      Reste : {formaterMontant(montantRestant)}
                                    </span>
                                  </>
                                )}
                                {!fraisEleveExistant && (
                                  <span className="montant-restant">
                                    À payer: {formaterMontant(montantRestant)}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {fraisEleveExistant && (
                              <div className="statut-frais-existant">
                                Statut: {getStatutBadge(fraisEleveExistant.statut)}
                              </div>
                            )}
                            
                            {isFraisUniquePaye && (
                              <div className="badge-unique-paye" style={{
                                marginTop: '10px',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                backgroundColor: '#d4edda',
                                color: '#155724',
                                textAlign: 'center'
                              }}>
                                ✓ Frais unique déjà payé
                              </div>
                            )}
                            
                            {(isFraisAnnuelPaye || isFraisAnnuelPayePourAnnee) && (
                              <div className="badge-annuel-paye" style={{
                                marginTop: '10px',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                backgroundColor: '#cce5ff',
                                color: '#004085',
                                textAlign: 'center',
                                border: '1px solid #b8daff'
                              }}>
                                📅 Frais annuel déjà payé ({anneeScolaire})
                              </div>
                            )}
                            
                            {isInscriptionPayee && (
                              <div className="badge-succes" style={{
                                marginTop: '10px',
                                padding: '5px 10px',
                                borderRadius: '4px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                backgroundColor: '#d4edda',
                                color: '#155724',
                                textAlign: 'center'
                              }}>
                                ✓ Inscription déjà payée
                              </div>
                            )}
                            
                            {isScolarite && fraisEleveExistant && versements.length > 0 && (
                              <div className="versements-resume" style={{
                                marginTop: '10px',
                                padding: '8px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '4px',
                                fontSize: '0.8rem'
                              }}>
                                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Versements :</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                  {versements.map((versement, index) => (
                                    <span 
                                      key={versement.id}
                                      style={{
                                        padding: '2px 6px',
                                        borderRadius: '3px',
                                        backgroundColor: versement.statut === 'paye' ? '#d4edda' : 
                                                      versement.statut === 'partiel' ? '#fff3cd' : 
                                                      versement.statut === 'en_retard' ? '#f8d7da' : '#e9ecef',
                                        color: versement.statut === 'paye' ? '#155724' : 
                                              versement.statut === 'partiel' ? '#856404' : 
                                              versement.statut === 'en_retard' ? '#721c24' : '#495057',
                                        fontSize: '0.75rem',
                                        fontWeight: '600'
                                      }}
                                    >
                                      #{versement.numero_versement}: {formaterMontant(versement.montant_paye)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Étape 4: Configuration du paiement de scolarité */}
                {fraisSelectionne && fraisSelectionne.categorie_type === 'scolarite' && (
                  <div id="etape-config-scolarite" className="etape etape-config-scolarite">
                    <h4>Configuration du paiement de scolarité</h4>
                    
                    <div className="info-scolarite-globale">
                      <div className="montant-total-scolarite">
                        <span>Montant total de la scolarité:</span>
                        <strong>{formaterMontant(montantTotalScolarite)}</strong>
                      </div>
                      
                      <div className="montant-restant-scolarite">
                        <span>Reste à payer:</span>
                        <strong>{formaterMontant(montantRestantScolarite)}</strong>
                      </div>
                      
                      {versements.length > 0 && (
                        <div className="versements-existants">
                          <h5>Versements déjà effectués</h5>
                          <div className="liste-versements-existants">
                            {versements.map(versement => (
                              <div key={versement.id} className="carte-versement-existant">
                                <div className="entete-versement">
                                  <span>Versement #{versement.numero_versement}</span>
                                  <span className={`statut-versement ${versement.statut}`}>
                                    {getStatutBadge(versement.statut)}
                                  </span>
                                </div>
                                <div className="details-versement">
                                  <span>Montant: {formaterMontant(versement.montant_versement)}</span>
                                  <span>Payé: {formaterMontant(versement.montant_paye)}</span>
                                  <span>Reste: {formaterMontant(versement.montant_versement - versement.montant_paye)}</span>
                                </div>
                                {versement.date_paiement && (
                                  <div className="date-paiement">
                                    Payé le: {formaterDate(versement.date_paiement)}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {(() => {
                        const prochainVersement = trouverProchainVersement();
                        
                        return (
                          <div className="choix-type-paiement">
                            <h5>Comment souhaitez-vous payer ?</h5>
                            
                            <label className="radio-label">
                              <input 
                                type="radio" 
                                name="type_paiement_scolarite"
                                checked={!formPaiement.is_versement}
                                onChange={() => {
                                  setFormPaiement(prev => ({
                                    ...prev,
                                    montant: montantRestantScolarite,
                                    is_versement: false,
                                    numero_versement: undefined,
                                    versement_id: undefined
                                  }));
                                  setVersementSelectionne(null);
                                  setNumeroVersement(1);
                                  defilerVersEtapeDetails();
                                }}
                              />
                              Paiement global ({formaterMontant(montantRestantScolarite)})
                            </label>

                            <label className="radio-label">
                              <input 
                                type="radio" 
                                name="type_paiement_scolarite"
                                checked={formPaiement.is_versement}
                                onChange={() => {
                                  const prochainVersement = trouverProchainVersement();
                                  const montantVersement = versements.find(v => 
                                    v.numero_versement === prochainVersement
                                  )?.montant_versement || Math.ceil(montantRestantScolarite / Math.max(1, numeroVersement));
                                  
                                  setFormPaiement(prev => ({
                                    ...prev,
                                    montant: montantVersement,
                                    is_versement: true,
                                    numero_versement: prochainVersement
                                  }));
                                  defilerVersEtapeDetails();
                                }}
                              />
                              Paiement par versement(s)
                            </label>
                            
                            {formPaiement.is_versement && (
                              <div className="configuration-versements">
                                <div className="groupe-champ">
                                  <label>Nombre total de versements souhaités</label>
                                  <select 
                                    value={numeroVersement}
                                    onChange={(e) => {
                                      const newNumVersements = parseInt(e.target.value);
                                      handleNombreVersementsChange(newNumVersements);
                                    }}
                                  >
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                      <option key={num} value={num}>
                                        {num} versement{num > 1 ? 's' : ''}
                                      </option>
                                    ))}
                                  </select>
                                  
                                  {(() => {
                                    const prochainVersement = trouverProchainVersement();
                                    const versementsExistants = versements.length;
                                    
                                    if (versementsExistants > 0) {
                                      const versementsPayes = versements.filter(v => v.statut === 'paye' || v.montant_paye > 0);
                                      const dernierVersementPaye = versementsPayes.length > 0 
                                        ? Math.max(...versementsPayes.map(v => v.numero_versement))
                                        : 0;
                                      
                                      const prochainRecommande = dernierVersementPaye + 1;
                                      
                                      if (numeroVersement !== prochainRecommande && prochainRecommande <= 10) {
                                        setTimeout(() => {
                                          setNumeroVersement(prochainRecommande);
                                          const montantParVersement = Math.ceil(montantRestantScolarite / Math.max(1, prochainRecommande));
                                          setFormPaiement(prev => ({
                                            ...prev,
                                            montant: montantParVersement,
                                            numero_versement: prochainVersement
                                          }));
                                        }, 100);
                                      }
                                    }
                                    
                                    return (
                                      <small className="hint" style={{ color: '#3b82f6', fontWeight: '500', marginTop: '14px' }}>
                                        {versementsExistants > 0 ? (
                                          <>
                                            ⚡ Dernier versement effectué: #{Math.max(...versements.filter(v => v.montant_paye > 0).map(v => v.numero_versement), 0)}
                                            <br />
                                            ✅ Précédent : {Math.min(
                                              Math.max(...versements.filter(v => v.montant_paye > 0).map(v => v.numero_versement), 0),
                                              10
                                            )}e Versement
                                          </>
                                        ) : (
                                          <></>
                                        )}
                                      </small>
                                    );
                                  })()}
                                </div>
                                
                                <div className="groupe-champ">
                                  <select 
                                    value={formPaiement.numero_versement || trouverProchainVersement()}
                                    onChange={(e) => {
                                      const numero = parseInt(e.target.value);
                                      const versement = versements.find(v => v.numero_versement === numero);
                                      const montantDu = versement 
                                        ? versement.montant_versement - versement.montant_paye
                                        : Math.ceil(montantRestantScolarite / Math.max(1, numeroVersement));
                                      
                                      setFormPaiement(prev => ({
                                        ...prev,
                                        numero_versement: numero,
                                        montant: montantDu
                                      }));
                                    }}
                                  >
                                    {Array.from({ length: numeroVersement }, (_, i) => {
                                      const numVersement = i + 1;
                                      const versement = versements.find(v => v.numero_versement === numVersement);
                                      const estPaye = versement?.statut === 'paye' || (versement?.montant_paye || 0) >= (versement?.montant_versement || 0);
                                      const estPartiel = versement?.statut === 'partiel' || (versement?.montant_paye || 0) > 0;
                                      const estProchain = numVersement === trouverProchainVersement();
                                      
                                      return (
                                        <option 
                                          key={numVersement} 
                                          value={numVersement}
                                          disabled={estPaye}
                                          style={{ 
                                            color: estPaye ? '#999' : estPartiel ? '#ffc107' : estProchain ? '#2563eb' : 'inherit',
                                            backgroundColor: estPaye ? '#f5f5f5' : 'white',
                                            fontWeight: estProchain ? 'bold' : estPartiel ? 'bold' : 'normal'
                                          }}
                                        >
                                          Versement #{numVersement} 
                                          {estPaye ? ' (✓ Déjà payé)' : 
                                          estPartiel ? ` (⏳ Partiel: ${formaterMontant(versement?.montant_paye || 0)}/${formaterMontant(versement?.montant_versement || 0)})` : 
                                          estProchain ? ' (▶️ Prochain à payer)' : 
                                          ''}
                                        </option>
                                      );
                                    })}
                                  </select>
                                  <small className="hint">
                                    {formPaiement.numero_versement === trouverProchainVersement() 
                                      ? `✅ Prochain versement à payer: #${trouverProchainVersement()}`
                                      : `📌 Versement sélectionné: #${formPaiement.numero_versement}`
                                    }
                                  </small>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}
                
                {/* Étape 5: Détails du paiement (pour tous les frais) */}
                {fraisSelectionne && (
                  <div id="etape-details-paiement" className="etape etape-details-paiement">
                    <h4>
                      Détails du paiement : <span style={{ fontSize: '18px', fontWeight: '600', borderRadius: '50px', border: '1px solid #f57f5b', background: ' linear-gradient(135deg, #f6d5a9, #f57f5b)', color: '#853500', padding: '4px', width:'100px', textAlign: 'center' }}>{fraisSelectionne.categorie_nom || 'Frais scolaire'}</span>
                    </h4>
                    
                    <div className="grille-details-paiement">
                      <div className="groupe-champ">
                        <label>Montant à payer</label>
                        <input 
                          type="number" 
                          required
                          min="0"
                          step="100"
                          value={formPaiement.montant}
                          onChange={(e) => setFormPaiement({...formPaiement, montant: parseFloat(e.target.value) || 0})}
                        />
                      </div>
                      
                      <div className="groupe-champ">
                        <label>Date de paiement</label>
                        <input 
                          type="date" 
                          required
                          value={formPaiement.date_paiement}
                          onChange={(e) => setFormPaiement({...formPaiement, date_paiement: e.target.value})}
                        />
                      </div>
                      
                      <div className="groupe-champ">
                        <label>Mode de paiement</label>
                        <select 
                          required
                          value={formPaiement.mode_paiement}
                          onChange={(e) => setFormPaiement({
                            ...formPaiement, 
                            mode_paiement: e.target.value as any
                          })}
                        >
                          <option value="especes">Espèces</option>
                          <option value="cheque">Chèque</option>
                          <option value="virement">Virement bancaire</option>
                          <option value="carte">Carte bancaire</option>
                          <option value="mobile">Mobile Money</option>
                          <option value="autre">Autre</option>
                        </select>
                      </div>
                      
                      <div className="groupe-champ">
                        <label>Référence du paiement</label>
                        <input 
                          type="text" 
                          value={formPaiement.reference_paiement}
                          onChange={(e) => setFormPaiement({...formPaiement, reference_paiement: e.target.value})}
                          placeholder="N° de chèque, référence virement..."
                        />
                      </div>
                      
                      <div className="groupe-champ">
                        <label>Commentaire (optionnel)</label>
                        <textarea 
                          value={formPaiement.notes}
                          onChange={(e) => setFormPaiement({...formPaiement, notes: e.target.value})}
                          placeholder="Commentaire sur le paiement..."
                          rows={3}
                        />
                      </div>
                      <input 
                        type="hidden" 
                        name="statut" 
                        value="paye" 
                      />
                    </div>
                    
                    {/* Résumé du paiement */}
                    <div className="resume-paiement">
                      <h5>Résumé du paiement</h5>
                      <div className="details-resume">
                        <div className="ligne-resume">
                          <span>Élève:</span>
                          <span>
                            {eleves.find(e => e.id === eleveSelectionne)?.prenom} {eleves.find(e => e.id === eleveSelectionne)?.nom}
                          </span>
                        </div>
                        
                        <div className="ligne-resume">
                          <span>Frais:</span>
                          <span>{fraisSelectionne.categorie_nom || 'Frais scolaire'}</span>
                        </div>
                        
                        <div className="ligne-resume">
                          <span>Périodicité:</span>
                          <span>{getPeriodiciteLabel(fraisSelectionne.periodicite)}</span>
                        </div>
                        
                        {formPaiement.is_versement && (
                          <>
                            <div className="ligne-resume">
                              <span>Type de paiement:</span>
                              <span>Versement</span>
                            </div>
                            <div className="ligne-resume">
                              <span>Numéro du versement:</span>
                              <span>#{formPaiement.numero_versement}</span>
                            </div>
                            <div className="ligne-resume">
                              <span>Nombre total de versements:</span>
                              <span>{numeroVersement}</span>
                            </div>
                          </>
                        )}
                        
                        {!formPaiement.is_versement && (
                          <div className="ligne-resume">
                            <span>Type de paiement:</span>
                            <span>Paiement global</span>
                          </div>
                        )}
                        
                        <div className="ligne-resume">
                          <span>Montant à payer:</span>
                          <span className="montant-total">{formaterMontant(formPaiement.montant)}</span>
                        </div>
                        
                        {fraisSelectionne.categorie_type === 'scolarite' && (
                          <div className="ligne-resume">
                            <span>Reste après paiement:</span>
                            <span className="montant-restant">
                              {formaterMontant(montantRestantScolarite - formPaiement.montant)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="actions-formulaire">
                      <button 
                        type="button" 
                        className="bouton-secondaire"
                        onClick={() => {
                          setOngletActif('liste');
                          setFormPaiement({
                            frais_eleve_id: null,
                            frais_scolaire_id: null,
                            eleve_id: null,
                            montant: 0,
                            date_paiement: new Date().toISOString().split('T')[0],
                            mode_paiement: 'especes',
                            reference_paiement: '',
                            notes: '',
                            statut: 'paye',
                            created_by: 1,
                            is_versement: false
                          });
                          setClasseSelectionnee(null);
                          setEleveSelectionne(null);
                          setFraisSelectionne(null);
                          setVersementSelectionne(null);
                          setFraisScolaires([]);
                          setEleves([]);
                          setFraisEleves([]);
                          setVersements([]);
                        }}
                      >
                        Annuler
                      </button>
                      
                      <button 
                        type="submit" 
                        className="bouton-primaire"
                        disabled={chargement}
                      >
                        {chargement ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
      
      {/* Modales */}      
      {modalReceiptOpen && paiementSelectionne && (
        <ModalImprimerRecu
          isOpen={modalReceiptOpen}
          onClose={() => setModalReceiptOpen(false)}
          paiement={paiementSelectionne}
          onSuccess={refreshPaiements}
        />
      )}
      
      {modalDeleteOpen && paiementSelectionne && (
        <ModalSupprimerPaiement
          isOpen={modalDeleteOpen}
          onClose={() => setModalDeleteOpen(false)}
          paiement={paiementSelectionne}
          onSuccess={refreshPaiements}
        />
      )}

      {modalEditOpen && paiementSelectionne && (
        <ModalModifierPaiement
          isOpen={modalEditOpen}
          onClose={() => setModalEditOpen(false)}
          paiement={paiementSelectionne}
          onSuccess={refreshPaiements}
        />
      )}

      {/* Modale Historique des Paiements */}
      {historiqueOuvert !== null && (
        <ModalHistoriquePaiements
          isOpen={historiqueOuvert !== null}
          onClose={fermerHistorique}
          eleveId={historiqueOuvert}
          eleveNom={derniersPaiements.find(p => p.eleve_id === historiqueOuvert)?.eleve_nom || ''}
          elevePrenom={derniersPaiements.find(p => p.eleve_id === historiqueOuvert)?.eleve_prenom || ''}
        />
      )}

      {/* Modale pour la relance multiple */}
      {modalRelanceMultipleOuvert && relanceMultipleData && (
        <div className="overlay-modal-modern" onClick={() => setModalRelanceMultipleOuvert(false)}>
          <div className="modal-modern large" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal-modern">
              <h2>📬 Relance de paiement multiple</h2>
              <button 
                className="bouton-fermer-modal-modern" 
                onClick={() => setModalRelanceMultipleOuvert(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="contenu-modal-modern">
              <div className="resume-relance-multiple">
                <h3>Résumé de la relance</h3>
                <div className="stats-relance">
                  <div className="stat-relance">
                    <div className="stat-label">Nombre d'élèves</div>
                    <div className="stat-value">{relanceMultipleData.eleves.length}</div>
                  </div>
                  <div className="stat-relance">
                    <div className="stat-label">Avec téléphone</div>
                    <div className="stat-value">
                      {relanceMultipleData.eleves.filter(e => e.telephone_parent && e.telephone_parent.trim() !== '').length}
                    </div>
                  </div>
                  <div className="stat-relance">
                    <div className="stat-label">Avec email</div>
                    <div className="stat-value">
                      {relanceMultipleData.eleves.filter(e => e.email_parents && e.email_parents.trim() !== '').length}
                    </div>
                  </div>
                  <div className="stat-relance">
                    <div className="stat-label">Total dû</div>
                    <div className="stat-value">
                      {formaterMontant(relanceMultipleData.eleves.reduce((sum, e) => sum + e.total_reste_a_payer, 0))}
                    </div>
                  </div>
                </div>
                
                <div className="liste-eleves-relance">
                  <h4>Élèves sélectionnés</h4>
                  <div className="tableau-eleves-relance">
                    <table>
                      <thead>
                        <tr>
                          <th>Élève</th>
                          <th>Classe</th>
                          <th>Téléphone</th>
                          <th>Total dû</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relanceMultipleData.eleves.map((eleve, index) => (
                          <tr key={eleve.id}>
                            <td>
                              <strong>{eleve.prenom} {eleve.nom}</strong>
                              <div className="eleve-matricule">{eleve.matricule}</div>
                            </td>
                            <td>{eleve.classe_niveau} {eleve.classe_nom}</td>
                            <td>
                              {eleve.telephone_parent ? (
                                <span className="contact-ok">✓ {eleve.telephone_parent}</span>
                              ) : (
                                <span className="contact-manquant">✗ Non renseigné</span>
                              )}
                            </td>
                            <td>{formaterMontant(eleve.total_reste_a_payer)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="message-relance-preview">
                  <h4>Message de relance</h4>
                  <div className="message-editor">
                    <textarea
                      value={relanceMultipleData.messageRelance}
                      onChange={(e) => setRelanceMultipleData({
                        ...relanceMultipleData,
                        messageRelance: e.target.value
                      })}
                      rows={12}
                      placeholder="Modifiez le message de relance..."
                    />
                    <div className="message-tools">
                      <button 
                        className="btn-tool"
                        onClick={() => navigator.clipboard.writeText(relanceMultipleData.messageRelance)}
                      >
                        📋 Copier
                      </button>
                      <button 
                        className="btn-tool"
                        onClick={() => setRelanceMultipleData({
                          ...relanceMultipleData,
                          messageRelance: genererMessageRelanceMultiple(relanceMultipleData.eleves)
                        })}
                      >
                        🔄 Réinitialiser
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="actions-relance-multiple">
                  <h4>Méthodes d'envoi</h4>
                  <div className="methodes-grid">
                    <button 
                      className="methode-btn whatsapp"
                      onClick={envoyerRelancesWhatsAppMultipleAvecConfirmation}
                      disabled={relanceMultipleData.eleves.filter(e => e.telephone_parent && e.telephone_parent.trim() !== '').length === 0}
                    >
                      <span className="methode-icon">💚</span>
                      <span className="methode-label">WhatsApp</span>
                      <span className="methode-desc">
                        Envoyer à {relanceMultipleData.eleves.filter(e => e.telephone_parent && e.telephone_parent.trim() !== '').length} parent(s)
                      </span>
                      <small style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                        Message personnalisé par élève
                      </small>
                    </button>
                    
                    <button 
                      className="methode-btn impression"
                      onClick={imprimerRelancesMultiple}
                    >
                      <span className="methode-icon">🖨️</span>
                      <span className="methode-label">Imprimer</span>
                      <span className="methode-desc">Imprimer les {relanceMultipleData.eleves.length} relances</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="actions-modal-modern">
              <button 
                className="bouton-secondaire-modern"
                onClick={() => setModalRelanceMultipleOuvert(false)}
              >
                Annuler
              </button>
              <button 
                className="bouton-primaire-modern"
                onClick={envoyerRelancesWhatsAppMultiple}
                disabled={relanceMultipleData.eleves.filter(e => e.telephone_parent && e.telephone_parent.trim() !== '').length === 0}
              >
                📤 Envoyer maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION SUPPRESSION MULTIPLE */}
      {modalSuppressionMultipleOuvert && (
        <div className="overlay-modal-modern" onClick={() => setModalSuppressionMultipleOuvert(false)}>
          <div className="modal-modern large" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal-modern" style={{ borderBottom: '2px solid #fee2e2' }}>
              <h2 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🗑️ Suppression multiple de paiements
              </h2>
              <button 
                className="bouton-fermer-modal-modern" 
                onClick={() => setModalSuppressionMultipleOuvert(false)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="contenu-modal-modern">
              <div style={{ padding: '24px' }}>
                
                <div style={{ 
                  background: '#fef2f2', 
                  border: '1px solid #fee2e2',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px'
                }}>
                  <div style={{ fontSize: '32px' }}>⚠️</div>
                  <div>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#991b1b',
                      marginBottom: '8px'
                    }}>
                      Êtes-vous absolument sûr ?
                    </h3>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#b91c1c',
                      marginBottom: '4px'
                    }}>
                      Vous êtes sur le point de supprimer les paiements de <strong>{elevesSelectionnes.length} élève(s)</strong>.
                    </p>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#7f1d1d',
                      fontStyle: 'italic'
                    }}>
                      Cette action est irréversible. Les reçus associés seront également supprimés.
                    </p>
                  </div>
                </div>

                {detailsSuppression.length > 0 && (
                  <div style={{ marginBottom: '24px' }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      color: '#1e293b',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      📋 Détail des paiements à supprimer
                      <span style={{ 
                        background: '#dc2626', 
                        color: 'white', 
                        padding: '2px 10px', 
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {paiementsASupprimer.length} paiement(s)
                      </span>
                    </h4>
                    
                    <div style={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ 
                          background: '#f8fafc', 
                          position: 'sticky', 
                          top: 0,
                          borderBottom: '2px solid #e2e8f0'
                        }}>
                          <tr>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Élève</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Date</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Catégorie</th>
                            <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Versement</th>
                            <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsSuppression.map((detail, index) => (
                            <tr key={detail.id || index} style={{ 
                              borderBottom: '1px solid #e2e8f0',
                              background: index % 2 === 0 ? 'white' : '#fafafa'
                            }}>
                              <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                                <strong>{detail.eleve_prenom} {detail.eleve_nom}</strong>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>{detail.eleve_matricule}</div>
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                                {formaterDate(detail.date_paiement)}
                                <div style={{ fontSize: '11px', color: '#64748b' }}>
                                  {formaterHeure(detail.date_paiement)}
                                </div>
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                                {detail.categorie_nom}
                              </td>
                              <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                                {detail.numero_versement ? `${detail.numero_versement}e` : 'Global'}
                              </td>
                              <td style={{ 
                                padding: '10px 12px', 
                                fontSize: '13px',
                                fontWeight: '600',
                                color: '#059669',
                                textAlign: 'right'
                              }}>
                                {formaterMontant(detail.montant)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot style={{ 
                          background: '#f1f5f9',
                          borderTop: '2px solid #e2e8f0'
                        }}>
                          <tr>
                            <td colSpan={4} style={{ 
                              padding: '12px', 
                              textAlign: 'right',
                              fontWeight: '600'
                            }}>
                              Total à supprimer :
                            </td>
                            <td style={{ 
                              padding: '12px', 
                              textAlign: 'right',
                              fontWeight: '700',
                              color: '#dc2626',
                              fontSize: '15px'
                            }}>
                              {formaterMontant(detailsSuppression.reduce((sum, d) => sum + d.montant, 0))}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'flex-end', 
                  gap: '12px',
                  marginTop: '24px',
                  paddingTop: '24px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  <button 
                    className="bouton-secondaire-modern"
                    onClick={() => setModalSuppressionMultipleOuvert(false)}
                    disabled={chargementSuppression}
                    style={{ padding: '12px 24px' }}
                  >
                    Annuler
                  </button>
                  
                  <button 
                    className="bouton-danger-modern"
                    onClick={executerSuppressionMultiple}
                    disabled={chargementSuppression || paiementsASupprimer.length === 0}
                    style={{
                      background: chargementSuppression ? '#94a3b8' : '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 32px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: chargementSuppression ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {chargementSuppression ? (
                      <>
                        <span className="spinner-small"></span>
                        Suppression en cours...
                      </>
                    ) : (
                      <>
                        🗑️ Confirmer la suppression ({paiementsASupprimer.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      
      <style jsx>{`
        /* Styles généraux */
               
        .en-tete-paiements {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .en-tete-paiements h2 {
          margin: 0;
          color: #1e293b;
          font-size: 1.75rem;
        }
        
        .boutons-actions {
          display: flex;
          gap: 10px;
        }
        
        .bouton-action {
          padding: 10px 20px;
          border: 2px solid #cbd5e1;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .bouton-action:hover {
          border-color: #94a3b8;
          transform: translateY(-1px);
        }
        
        .bouton-action.actif {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        /* Alertes */
        .alerte-modern {
          margin-bottom: 20px;
          border-radius: 8px;
          overflow: hidden;
        }
        
        .alerte-succes-modern {
          background: linear-gradient(to right, #10b981, #059669);
        }
        
        .alerte-erreur-modern {
          background: linear-gradient(to right, #ef4444, #dc2626);
        }
        
        .contenu-alerte-modern {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          color: white;
        }
        
        .icone-alerte-modern {
          font-size: 20px;
          margin-right: 15px;

        }
        
        .texte-alerte-modern {
          flex: 1;
        }
        
        .message-alerte {
          font-weight: 500;
          color:  #ffffff;
        }
        
        .bouton-fermer-alerte-modern {
          background: rgba(129, 122, 122, 0.77);
          border: none;
          color: #ffffff;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }           
        
        .groupe-champ {
          display: flex;
          flex-direction: column;
        }
        
        .groupe-champ label {
          margin-bottom: 5px;
          font-size: 0.875rem;
          color: #64748b;
          font-weight: 500;
        }
        
        .groupe-champ input,
        .groupe-champ select {
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 0.875rem;
        }
        
        .groupe-champ input:focus,
        .groupe-champ select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 0.875rem;
          color: #64748b;
        }
        
        .grille-filtres-paie {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 10px;
        }

        .actions-filtres-paie {
          grid-column: 1 / -1;
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          padding-top: 10px;
          border-top: 1px solid #dddddb;
        }
        
        .bouton-primaire {
          padding: 8px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
        }

        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        th {
          background: #f8fafc;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
          white-space: nowrap;
        }
        
        td {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          color: #475569;
        }
        
        tr:hover {
          background: #f8fafc;
        }
        
        .eleve-info {
          display: flex;
          flex-direction: column;
        }
        
        .eleve-info small {
          color: #64748b;
          font-size: 0.75rem;
          margin-top: 2px;
        }
        
        .montant-cell {
          display: flex;
          flex-direction: column;
        }
        
        .montant-cell .montant {
          font-weight: 600;
          color: #059669;
        }
        
        .montant-cell small {
          color: #94a3b8;
          font-size: 0.75rem;
        }
        
        .badge-mode {
          display: inline-block;
          padding: 4px 8px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: capitalize;
        }
        
        .badge-statut {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .badge-succes {
          background: #d1fae5;
          color: #065f46;
        }
        
        .badge-attente {
          background: #fef3c7;
          color: #92400e;
        }
        
        .badge-partiel {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .badge-retard {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .badge-default {
          background: #f1f5f9;
          color: #475569;
        }
        
        .reste-a-payer-cell {
          font-weight: 500;
        }
        
        .reste-a-payer-positif {
          color: #dc2626;
        }
        
        .reste-a-payer-zero {
          color: #059669;
        }
        
        /* Boutons d'action dans le tableau */
        .actions-buttons {
          display: flex;
          gap: 8px;
        }
        
        .action-button {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .action-button.details {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .action-button.details:hover {
          background: #bfdbfe;
          transform: translateY(-2px);
        }
        
        .action-button.receipt {
          background: #dcfce7;
          color: #166534;
        }
        
        .action-button.receipt:hover {
          background: #bbf7d0;
          transform: translateY(-2px);
        }
        
        .action-button.delete {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .action-button.delete:hover {
          background: #fecaca;
          transform: translateY(-2px);
        }
        
        
        .pages {
          display: flex;
          gap: 5px;
        }
        
        /* Chargement */
        .chargement-tableau {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
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
        
        .aucune-donnee {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }
        
        /* Formulaire nouveau paiement */
        .section-nouveau-paiement {
          background: white;
          border-radius: 10px;
          padding: 30px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        
        .section-nouveau-paiement h3 {
          margin-top: 0;
          margin-bottom: 10px;
          color: #334155;
        }
        
        .info-annee {
          color: #64748b;
          margin-bottom: 30px;
          font-size: 0.875rem;
        }
        
        .etape {
          margin-bottom: 30px;
          padding-bottom: 30px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .etape:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        
        .etape h4 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #475569;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .etape h4:before {
          content: "";
          display: inline-block;
          width: 24px;
          height: 24px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          text-align: center;
          line-height: 24px;
          font-size: 0.875rem;
        }
        
        .etape-classe h4:before { content: "1"; }
        .etape-eleve h4:before { content: "2"; }
        .etape-frais h4:before { content: "3"; }
        .etape-details-paiement h4:before { content: "4"; }
        
        .liste-frais-scolaires {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 15px;
        }
        
        .carte-frais-scolaire {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .carte-frais-scolaire:hover {
          border-color: #94a3b8;
          transform: translateY(-2px);
        }
        
        .carte-frais-scolaire.selectionne {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        
        .entete-carte-frais {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 15px;
        }
        
        .entete-carte-frais h5 {
          margin: 0;
          color: #1e293b;
          font-size: 1rem;
        }
        
        .periodicite-frais {
          background: #e0e7ff;
          color: #3730a3;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .details-carte-frais {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .montant-frais {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .montant-restant {
          font-weight: 600;
          color: #dc2626;
        }
        
        .info-frais {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #64748b;
        }
        
        .statut-frais-existant {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          font-size: 0.875rem;
        }
        
        /* Info scolarité */
        .info-scolarite-globale {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 8px;
          padding: 20px;
        }
        
        .montant-total-scolarite,
        .montant-restant-scolarite {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #e0f2fe;
        }
        
        .montant-restant-scolarite {
          border-bottom: none;
        }
        
        .versements-existants {
          margin-top: 20px;
        }
        
        .versements-existants h5 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #475569;
        }
        
        .liste-versements-existants {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 10px;
        }
        
        .carte-versement-existant {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 15px;
        }
        
        .entete-versement {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        
        .details-versement {
          display: flex;
          justify-content: space-between;
          font-size: 0.875rem;
          color: #64748b;
        }
        
        .date-paiement {
          font-size: 0.75rem;
          color: #94a3b8;
        }
        
        /* Choix type paiement */
        .choix-type-paiement {
          margin-top: 20px;
        }
        
        .choix-type-paiement h5 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #475569;
        }
        
        .options-paiement {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .radio-label {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          padding: 10px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .radio-label:hover {
          border-color: #94a3b8;
        }
        
        .radio-label input[type="radio"]:checked + * {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        
        /* Configuration versements */
        .configuration-versements {
          margin-top: 20px;
          padding: 20px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
        }
        
        .simulation-versements {
          margin-top: 20px;
        }
        
        .simulation-versements h6 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #475569;
          font-size: 0.875rem;
        }
        
        .liste-simulation {
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        
        .ligne-simulation {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          border-bottom: 1px dashed #e2e8f0;
        }
        
        .ligne-simulation.total {
          font-weight: 600;
          color: #1e293b;
          border-bottom: 2px solid #e2e8f0;
          padding-top: 10px;
          margin-top: 5px;
        }
        
        /* Grille détails paiement */
        .grille-details-paiement {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-bottom: 30px;
        }
        
        .plein-largeur {
          grid-column: 1 / -1;
        }
        
        .hint {
          display: block;
          margin-top: 16px;
          color: #64748b;
          font-size: 0.75rem;
        }
        
        textarea {
          resize: vertical;
          min-height: 80px;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-family: inherit;
          font-size: 0.875rem;
        }
        
        textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        /* Résumé paiement */
        .resume-paiement {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .resume-paiement h5 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #475569;
        }
        
        .details-resume {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .ligne-resume {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .ligne-resume:last-child {
          border-bottom: none;
        }
        
        .montant-total {
          font-weight: 600;
          color: #059669;
          font-size: 1.1rem;
        }
        
        .montant-restant {
          font-weight: 600;
          color: #dc2626;
        }
        
        /* Actions formulaire */
        .actions-formulaire {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .en-tete-paiements {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }
          
          .boutons-actions {
            justify-content: center;
          }
          
          .entete-tableau {
            flex-direction: column;
            gap: 10px;
            align-items: stretch;
          }
          
          .actions-buttons {
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .grille-filtres {
            grid-template-columns: 1fr;
          }          
          .liste-frais-scolaires {
            grid-template-columns: 1fr;
          }
          
          .grille-details-paiement {
            grid-template-columns: 1fr;
          }

          .eleve-nom-link {
            background: none;
            border: none;
            color: #2563eb;
            cursor: pointer;
            text-align: left;
            padding: 0;
            font: inherit;
          }

          .eleve-nom-link:hover {
            text-decoration: underline;
            color: #1d4ed8;
          }
          
          .actions-formulaire {
            flex-direction: column;
          }
                    
          .actions-formulaire button {
            width: 100%;
          }
            .carte-frais-scolaire.desactive {
    opacity: 0.6;
    cursor: not-allowed;
    background-color: #f9fafb;
    border-color: #e5e7eb;
    pointer-events: none;
  }
  
  .carte-frais-scolaire.desactive:hover {
    transform: none;
    border-color: #e5e7eb;
    box-shadow: none;
  }
  
  /* ✅ NOUVEAU : Badge pour frais unique payé */
  .badge-unique-paye {
    display: inline-block;
    padding: 4px 8px;
    background-color: #d1fae5;
    color: #065f46;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    margin-top: 8px;
  }
        }
      `}</style>
    </div>
  );
}