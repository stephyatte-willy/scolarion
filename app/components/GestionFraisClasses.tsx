'use client';

import { useState, useEffect, useRef, useCallback } from 'react'; 
import * as XLSX from 'xlsx';
import './GestionFinance.css';

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

interface FraisScolaire {
  id: number;
  classe_id: number;
  categorie_frais_id: number;
  annee_scolaire: string;
  montant: number;
  periodicite: 'unique' | 'mensuel' | 'trimestriel' | 'annuel';
  statut: 'actif' | 'inactif';
  classe_nom: string; 
  classe_niveau: string; 
  categorie_nom: string; 
  classe?: { 
    id: number;
    nom: string;
    niveau: string;
  };
  
  categorie?: { 
    id: number;
    nom: string;
    description?: string;
    type: string;
    montant_base: number;
    periodicite: string;
    statut: string;
  };
  nombre_eleves?: number;
}

interface CategorieFrais {
  id: number;
  nom: string;
  description?: string;
  type: 'scolarite' | 'divers' | 'penalite' | 'autre';
  montant_base: number;
  periodicite: 'unique' | 'mensuel' | 'trimestriel' | 'annuel';
  statut: 'actif' | 'inactif';
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
}

type SortField = 'numero' | 'classe' | 'categorie' | 'montant' | 'periodicite' | 'eleves' | 'statut';
type SortDirection = 'asc' | 'desc';

interface Props {
  formaterMontant?: (montant: number) => string;
  formaterDate?: (date: Date | string) => string;
  deviseSymbole?: string;
}

export default function GestionFraisClasses({ 
  formaterMontant: propFormaterMontant, 
  formaterDate: propFormaterDate,
  deviseSymbole: propDeviseSymbole 
}: Props) {
  const [fraisScolaires, setFraisScolaires] = useState<FraisScolaire[]>([]);
  const [categories, setCategories] = useState<CategorieFrais[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modalSuppressionOuvert, setModalSuppressionOuvert] = useState(false);
  const [fraisASupprimer, setFraisASupprimer] = useState<FraisScolaire | null>(null);
  const [chargement, setChargement] = useState(true);
  const [alerte, setAlerte] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const [modeEdition, setModeEdition] = useState(false);
  const [fraisEnEdition, setFraisEnEdition] = useState<FraisScolaire | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp | null>(null);
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);

  const [fraisSelectionnes, setFraisSelectionnes] = useState<number[]>([]);
  const [modalSuppressionMultipleOuvert, setModalSuppressionMultipleOuvert] = useState(false);
  const [selectionTout, setSelectionTout] = useState(false);
  const [fraisASupprimerMultiple, setFraisASupprimerMultiple] = useState<FraisScolaire[]>([]);

  // États pour les filtres et le tri
  const [filtres, setFiltres] = useState({
    classe: '',
    categorie: '',
    periodicite: '',
    statut: '',
    annee_scolaire: ''
  });
  
  const [tri, setTri] = useState<{
    champ: SortField;
    direction: SortDirection;
  }>({
    champ: 'numero',
    direction: 'asc'
  });

  const [formData, setFormData] = useState({
    classe_id: '',
    categorie_frais_id: '',
    montant: 0,
    periodicite: 'unique' as 'unique' | 'mensuel' | 'trimestriel' | 'annuel',
    annee_scolaire: ''
  });

  const contenuAImprimerRef = useRef<HTMLDivElement>(null);

  // ==================== FONCTIONS DE FORMATAGE DYNAMIQUE ====================

  // Formater une date selon la configuration
  const formaterDateLocale = (date: Date | string): string => {
    if (propFormaterDate) {
      return propFormaterDate(date);
    }
    
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
  const formaterMontantLocal = (montant: number): string => {
    if (propFormaterMontant) {
      return propFormaterMontant(montant);
    }
    
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

  // ==================== CHARGEMENT DES DONNÉES ====================

  useEffect(() => {
    chargerDonneesInitiales();
  }, []);

  useEffect(() => {
    chargerDonnees();
    const anneeScolaire = genererAnneeScolaire();
    setFormData(prev => ({ ...prev, annee_scolaire: anneeScolaire }));
    setFiltres(prev => ({ ...prev, annee_scolaire: anneeScolaire }));
  }, []);

  useEffect(() => {
    if (alerte) {
      const timer = setTimeout(() => {
        setAlerte(null);
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [alerte]);

  // Gestion de la fermeture avec Echap
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (modalOuvert) fermerModal();
        if (modalSuppressionOuvert) fermerModalSuppression();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [modalOuvert, modalSuppressionOuvert]);

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

  const genererAnneeScolaire = (): string => {
    if (parametresEcole?.annee_scolaire) {
      return parametresEcole.annee_scolaire;
    }
    
    const maintenant = new Date();
    const annee = maintenant.getFullYear();
    const mois = maintenant.getMonth() + 1;
    
    if (mois >= 8) {
      return `${annee}-${annee + 1}`;
    } else {
      return `${annee - 1}-${annee}`;
    }
  };

  const chargerDonnees = async () => {
    setChargement(true);
    try {
      const [fraisResponse, categoriesResponse, classesResponse] = await Promise.all([
        fetch('/api/finance/frais-scolaires'),
        fetch('/api/finance/categories-frais'),
        fetch('/api/classes')
      ]);

      const fraisData = await fraisResponse.json();
      const categoriesData = await categoriesResponse.json();
      const classesData = await classesResponse.json();

      if (categoriesData.success) setCategories(categoriesData.categories || []);
      if (classesData.success) setClasses(classesData.classes || []);

      if (fraisData.success) {
        setFraisScolaires(fraisData.frais || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      setAlerte({ type: 'error', message: 'Erreur lors du chargement des données' });
    } finally {
      setChargement(false);
    }
  };

  // Fonction pour gérer la sélection/déselection d'un frais
  const toggleSelectionFrais = (fraisId: number) => {
    setFraisSelectionnes(prev => {
      if (prev.includes(fraisId)) {
        return prev.filter(id => id !== fraisId);
      } else {
        return [...prev, fraisId];
      }
    });
  };

  // Fonction pour sélectionner/désélectionner tous les frais
  const toggleSelectionTous = () => {
    if (fraisSelectionnes.length === fraisAffiches.length) {
      setFraisSelectionnes([]);
      setSelectionTout(false);
    } else {
      setFraisSelectionnes(fraisAffiches.map(f => f.id));
      setSelectionTout(true);
    }
  };

  // Fonction pour préparer la suppression multiple
  const preparerSuppressionMultiple = () => {
    if (fraisSelectionnes.length === 0) {
      setAlerte({ 
        type: 'error', 
        message: 'Veuillez sélectionner au moins un frais à supprimer' 
      });
      return;
    }

    const fraisSelectionnesDetails = fraisAffiches.filter(f => 
      fraisSelectionnes.includes(f.id)
    );
    
    setFraisASupprimerMultiple(fraisSelectionnesDetails);
    setModalSuppressionMultipleOuvert(true);
  };

  // Fonction pour exécuter la suppression multiple
  const supprimerFraisMultiple = async () => {
    if (fraisASupprimerMultiple.length === 0) return;

    try {
      console.log(`🗑️ Suppression multiple de ${fraisASupprimerMultiple.length} frais`);
      
      const idsASupprimer = fraisASupprimerMultiple.map(f => f.id);
      
      const response = await fetch('/api/finance/frais-scolaires/suppression-multiple', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ ids: idsASupprimer })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP suppression multiple:', response.status, errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Réponse suppression multiple:', data);
      
      if (data.success) {
        setModalSuppressionMultipleOuvert(false);
        setFraisSelectionnes([]);
        setFraisASupprimerMultiple([]);
        chargerDonnees();
        setAlerte({ 
          type: 'success', 
          message: data.message || `${fraisASupprimerMultiple.length} frai(s) et tous les frais élèves associés supprimés avec succès!` 
        });
      } else {
        setAlerte({ type: 'error', message: data.erreur || 'Erreur lors de la suppression multiple' });
      }
    } catch (error: any) {
      console.error('❌ Erreur suppression multiple:', error);
      if (error.name === 'AbortError') {
        setAlerte({ type: 'error', message: 'La requête de suppression a expiré.' });
      } else {
        setAlerte({ type: 'error', message: `Erreur lors de la suppression multiple: ${error.message}` });
      }
    }
  };

  // Fonction pour obtenir les frais filtrés
  const obtenirFraisFiltres = () => {
    let fraisFiltres = [...fraisScolaires];

    if (filtres.classe) {
      fraisFiltres = fraisFiltres.filter(frais => 
        frais.classe_id.toString() === filtres.classe
      );
    }

    if (filtres.categorie) {
      fraisFiltres = fraisFiltres.filter(frais => 
        frais.categorie_frais_id.toString() === filtres.categorie
      );
    }

    if (filtres.periodicite) {
      fraisFiltres = fraisFiltres.filter(frais => 
        frais.periodicite === filtres.periodicite
      );
    }

    if (filtres.statut) {
      fraisFiltres = fraisFiltres.filter(frais => 
        frais.statut === filtres.statut
      );
    }

    if (filtres.annee_scolaire) {
      fraisFiltres = fraisFiltres.filter(frais => 
        frais.annee_scolaire === filtres.annee_scolaire
      );
    }

    return fraisFiltres;
  };

  const exporterVersExcel = () => {
    try {
      const fraisAExporter = obtenirFraisFiltres();
      
      if (fraisAExporter.length === 0) {
        setAlerte({ type: 'error', message: 'Aucune donnée à exporter' });
        return;
      }

      const donneesExcel = fraisAExporter.map((frais, index) => ({
        'N°': index + 1,
        'Classe': `${frais.classe_niveau} ${frais.classe_nom}`,
        'Catégorie': frais.categorie_nom,
        'Montant': frais.montant,
        'Montant Formaté': formaterMontantLocal(frais.montant),
        'Périodicité': frais.periodicite.charAt(0).toUpperCase() + frais.periodicite.slice(1),
        'Nombre d\'élèves': frais.nombre_eleves || 0,
        'Statut': frais.statut === 'actif' ? 'Actif' : 'Inactif',
        'Année scolaire': frais.annee_scolaire
      }));

      const classeur = XLSX.utils.book_new();
      const feuille = XLSX.utils.json_to_sheet(donneesExcel);
      XLSX.utils.book_append_sheet(classeur, feuille, 'Frais Scolaires');
      
      const largeursColonnes = [
        { wch: 5 },   // N°
        { wch: 20 },  // Classe
        { wch: 25 },  // Catégorie
        { wch: 15 },  // Montant
        { wch: 20 },  // Montant Formaté
        { wch: 15 },  // Périodicité
        { wch: 15 },  // Nombre d'élèves
        { wch: 10 },  // Statut
        { wch: 15 }   // Année scolaire
      ];
      feuille['!cols'] = largeursColonnes;
      
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0];
      const heureStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
      const nomFichier = `frais_scolaires_${dateStr}_${heureStr}.xlsx`;
      
      XLSX.writeFile(classeur, nomFichier);
      
      setAlerte({ 
        type: 'success', 
        message: `${fraisAExporter.length} frais exportés avec succès vers Excel` 
      });
      
    } catch (error) {
      console.error('Erreur export Excel:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de l\'export Excel' });
    }
  };

  const formaterDate = (date: Date) => {
    return formaterDateLocale(date);
  };

  // Fonction pour obtenir le résumé des filtres
  const obtenirResumeFiltres = () => {
    const resume = [];
    if (filtres.classe) {
      const classe = classes.find(c => c.id.toString() === filtres.classe);
      if (classe) resume.push(`Classe: ${classe.niveau} ${classe.nom}`);
    }
    if (filtres.categorie) {
      const categorie = categories.find(c => c.id.toString() === filtres.categorie);
      if (categorie) resume.push(`Catégorie: ${categorie.nom}`);
    }
    if (filtres.periodicite) {
      resume.push(`Périodicité: ${filtres.periodicite}`);
    }
    if (filtres.statut) {
      resume.push(`Statut: ${filtres.statut}`);
    }
    if (filtres.annee_scolaire) {
      resume.push(`Année scolaire: ${filtres.annee_scolaire}`);
    }
    return resume.join(' | ');
  };

  // Fonction pour appliquer les filtres et le tri
  const fraisFiltresEtTries = () => {
    let fraisFiltres = [...fraisScolaires];

    if (filtres.classe) {
      fraisFiltres = fraisFiltres.filter(frais => 
        frais.classe_id.toString() === filtres.classe
      );
    }

    if (filtres.categorie) {
      fraisFiltres = fraisFiltres.filter(frais => 
        frais.categorie_frais_id.toString() === filtres.categorie
      );
    }

    if (filtres.periodicite) {
      fraisFiltres = fraisFiltres.filter(frais => 
        frais.periodicite === filtres.periodicite
      );
    }

    if (filtres.statut) {
      fraisFiltres = fraisFiltres.filter(frais => 
        frais.statut === filtres.statut
      );
    }

    if (filtres.annee_scolaire) {
      fraisFiltres = fraisFiltres.filter(frais => 
        frais.annee_scolaire === filtres.annee_scolaire
      );
    }

    fraisFiltres.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (tri.champ) {
        case 'numero':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'classe':
          aValue = `${a.classe?.niveau || ''} ${a.classe?.nom || ''}`.toLowerCase();
          bValue = `${b.classe?.niveau || ''} ${b.classe?.nom || ''}`.toLowerCase();
          break;
        case 'categorie':
          aValue = a.categorie?.nom?.toLowerCase() || '';
          bValue = b.categorie?.nom?.toLowerCase() || '';
          break;
        case 'montant':
          aValue = a.montant;
          bValue = b.montant;
          break;
        case 'periodicite':
          aValue = a.periodicite;
          bValue = b.periodicite;
          break;
        case 'eleves':
          aValue = a.nombre_eleves || 0;
          bValue = b.nombre_eleves || 0;
          break;
        case 'statut':
          aValue = a.statut;
          bValue = b.statut;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return tri.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return tri.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return fraisFiltres;
  };

  const handleTri = (champ: SortField) => {
    setTri(prev => ({
      champ,
      direction: prev.champ === champ && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getIconeTri = (champ: SortField) => {
    if (tri.champ !== champ) return '↕️';
    return tri.direction === 'asc' ? '↑' : '↓';
  };

  const reinitialiserFiltres = () => {
    setFiltres({
      classe: '',
      categorie: '',
      periodicite: '',
      statut: '',
      annee_scolaire: genererAnneeScolaire()
    });
  };

  const ouvrirModalCreation = () => {
    setModeEdition(false);
    setFraisEnEdition(null);
    setFormData({
      classe_id: '',
      categorie_frais_id: '',
      montant: 0,
      periodicite: 'unique',
      annee_scolaire: genererAnneeScolaire()
    });
    setModalOuvert(true);
  };

  const ouvrirModalEdition = (frais: FraisScolaire) => {
    setModeEdition(true);
    setFraisEnEdition(frais);
    setFormData({
      classe_id: frais.classe_id.toString(),
      categorie_frais_id: frais.categorie_frais_id.toString(),
      montant: frais.montant,
      periodicite: frais.periodicite,
      annee_scolaire: frais.annee_scolaire
    });
    setModalOuvert(true);
  };

  const fermerModal = () => {
    setModalOuvert(false);
    setModeEdition(false);
    setFraisEnEdition(null);
  };

  const ouvrirModalSuppression = (frais: FraisScolaire) => {
    setFraisASupprimer(frais);
    setModalSuppressionOuvert(true);
  };

  const fermerModalSuppression = () => {
    setModalSuppressionOuvert(false);
    setFraisASupprimer(null);
  };

  const creerOuModifierFrais = async () => {
    if (!formData.classe_id || !formData.categorie_frais_id || !formData.montant || formData.montant <= 0) {
      setAlerte({ 
        type: 'error', 
        message: 'Veuillez remplir tous les champs obligatoires avec des valeurs valides' 
      });
      return;
    }

    try {
      interface DonneesAEnvoyer {
        classe_id: number;
        categorie_frais_id: number;
        montant: number;
        periodicite: 'unique' | 'mensuel' | 'trimestriel' | 'annuel';
        annee_scolaire: string;
        id?: number;
      }

      const donneesAEnvoyer: DonneesAEnvoyer = {
        classe_id: parseInt(formData.classe_id),
        categorie_frais_id: parseInt(formData.categorie_frais_id),
        montant: parseFloat(formData.montant.toString()),
        periodicite: formData.periodicite,
        annee_scolaire: formData.annee_scolaire || genererAnneeScolaire()
      };

      if (modeEdition && fraisEnEdition) {
        donneesAEnvoyer.id = fraisEnEdition.id;
      }

      console.log('📤 Envoi des données:', donneesAEnvoyer);

      let url = '/api/finance/frais-scolaires';
      let method = 'POST';
      
      if (modeEdition && fraisEnEdition) {
        url = `/api/finance/frais-scolaires/${fraisEnEdition.id}`;
        method = 'PUT';
      }

      console.log(`🎯 ${method} vers ${url}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(donneesAEnvoyer),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('📥 Réponse reçue:', response.status, response.statusText);

      const responseText = await response.text();
      console.log('📄 Contenu de la réponse:', responseText);

      if (!responseText) {
        throw new Error('La réponse du serveur est vide');
      }

      const data = JSON.parse(responseText);
      
      if (response.ok) {
        console.log('✅ Succès:', data);
        fermerModal();
        chargerDonnees();
        setAlerte({ 
          type: 'success', 
          message: modeEdition ? 'Frais modifié avec succès!' : 'Frais créé avec succès!' 
        });
      } else {
        console.error('❌ Erreur serveur:', data);
        throw new Error(data.erreur || `Erreur ${response.status}: ${response.statusText}`);
      }
      
    } catch (error: any) {
      console.error('💥 Erreur lors de l\'opération:', error);
      
      let messageErreur = 'Une erreur est survenue.';
      
      if (error.name === 'AbortError') {
        messageErreur = 'La requête a pris trop de temps. Veuillez réessayer.';
      } else if (error.message.includes('existe déjà') || error.message.includes('duplicate')) {
        messageErreur = 'Ce frais existe déjà pour cette classe et cette catégorie.';
      } else {
        messageErreur = error.message || 'Erreur inconnue.';
      }
      
      setAlerte({ type: 'error', message: messageErreur });
    }
  };

  const supprimerFrais = async () => {
    if (!fraisASupprimer || !fraisASupprimer.id || fraisASupprimer.id <= 0) {
      console.error('❌ ID invalide pour suppression:', fraisASupprimer?.id);
      setAlerte({ type: 'error', message: 'Aucun frais valide sélectionné pour la suppression' });
      return;
    }

    try {
      console.log('🗑️ Suppression frais ID:', fraisASupprimer.id);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`/api/finance/frais-scolaires/${fraisASupprimer.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erreur HTTP suppression:', response.status, errorText);
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Réponse suppression:', data);
      
      if (data.success) {
        fermerModalSuppression();
        chargerDonnees();
        setAlerte({ 
          type: 'success', 
          message: data.message || 'Frais et tous les frais élèves associés supprimés avec succès!' 
        });
      } else {
        setAlerte({ type: 'error', message: data.erreur || 'Erreur lors de la suppression' });
      }
    } catch (error: any) {
      console.error('❌ Erreur suppression frais:', error);
      if (error.name === 'AbortError') {
        setAlerte({ type: 'error', message: 'La requête de suppression a expiré. Cette opération peut prendre du temps en raison des données associées.' });
      } else {
        setAlerte({ type: 'error', message: `Erreur lors de la suppression: ${error.message}` });
      }
    }
  };

  const imprimerListe = useCallback(() => {
    const fraisAImprimer = obtenirFraisFiltres();
    
    if (fraisAImprimer.length === 0) {
      setAlerte({ type: 'error', message: 'Aucune donnée à imprimer' });
      return;
    }

    if (!contenuAImprimerRef.current) {
      console.error('Référence d\'impression non disponible');
      setAlerte({ type: 'error', message: 'Erreur lors de la préparation de l\'impression' });
      return;
    }

    try {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez vos bloqueurs de popups.');
      }

      const contenuHTML = contenuAImprimerRef.current.innerHTML;
      
      const totalMontant = fraisAImprimer.reduce((sum, f) => sum + f.montant, 0);
      const totalEleves = fraisAImprimer.reduce((sum, f) => sum + (f.nombre_eleves || 0), 0);
      
      const htmlComplet = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Liste des Frais Scolaires</title>
          <meta charset="UTF-8">
          <style>
            body { 
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 20px;
              background: white;
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
            }
            
            .resume-filtres {
              background: #f5f5f5;
              padding: 12px;
              margin: 15px 0;
              border-radius: 4px;
              font-size: 11px;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            
            th {
              background-color: ${parametresEcole?.couleur_principale || '#3B82F6'};
              color: white;
              font-weight: bold;
              text-align: left;
              padding: 12px;
              border: 1px solid ${parametresEcole?.couleur_principale || '#1d4ed8'};
            }
            
            td {
              padding: 10px;
              border: 1px solid #ddd;
            }
            
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            
            .total-section {
              margin-top: 30px;
              padding: 20px;
              background: linear-gradient(135deg, #f8fafc, #e2e8f0);
              border-radius: 8px;
              text-align: center;
              font-size: 18px;
              font-weight: bold;
            }
            
            .footer {
              text-align: center;
              margin-top: 50px;
              font-size: 12px;
              color: #666;
            }
            
            .date-print {
              text-align: right;
              font-size: 12px;
              color: #666;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="date-print">
            Imprimé le: ${formaterDateLocale(new Date())}
          </div>
          
          <div class="header">
            <div class="school-name">${parametresEcole?.nom_ecole || 'Établissement Scolaire'}</div>
            <div class="school-info">
              ${parametresEcole?.adresse ? `📍 ${parametresEcole.adresse}` : ''}
            </div>
          </div>
          
          <h2 style="text-align: center;">Liste des Frais Scolaires</h2>
          
          ${filtres.classe || filtres.categorie || filtres.periodicite || filtres.statut ? `
            <div class="resume-filtres">
              <strong>Filtres appliqués:</strong> ${obtenirResumeFiltres()}
            </div>
          ` : ''}

          <table>
            <thead>
              <tr>
                <th>N°</th>
                <th>Classe</th>
                <th>Catégorie</th>
                <th>Montant</th>
                <th>Périodicité</th>
                <th>Élèves</th>
                <th>Statut</th>
                <th>Année scolaire</th>
              </tr>
            </thead>
            <tbody>
              ${fraisAImprimer.map((frais, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${frais.classe_niveau} ${frais.classe_nom}</td>
                  <td>${frais.categorie_nom}</td>
                  <td style="text-align: right;">${formaterMontantLocal(frais.montant)}</td>
                  <td>${frais.periodicite.charAt(0).toUpperCase() + frais.periodicite.slice(1)}</td>
                  <td style="text-align: right;">${frais.nombre_eleves || 0}</td>
                  <td>${frais.statut === 'actif' ? 'Actif' : 'Inactif'}</td>
                  <td>${frais.annee_scolaire}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="total-section">
            <div><strong>Résumé financier</strong></div>
            <div style="margin-top: 10px;">
              <div>Total frais: <strong>${fraisAImprimer.length}</strong></div>
              <div>Montant total: <strong style="color: #10b981;">${formaterMontantLocal(totalMontant)}</strong></div>
              <div>Total élèves concernés: <strong>${totalEleves}</strong></div>
            </div>
          </div>

          <div class="footer">
            <div>Document généré par le Système de Gestion Scolaire</div>
            <div>© ${new Date().getFullYear()} - Tous droits réservés</div>
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

      printWindow.document.open();
      printWindow.document.write(htmlComplet);
      printWindow.document.close();

      setAlerte({ 
        type: 'success', 
        message: `Ouverture de l'impression pour ${fraisAImprimer.length} frais` 
      });
      
    } catch (error: any) {
      console.error('Erreur impression:', error);
      setAlerte({ 
        type: 'error', 
        message: `Erreur impression: ${error.message}` 
      });
    }
  }, [fraisScolaires, filtres, classes, categories, parametresEcole]);

  const genererFraisEleves = async (fraisId: number) => {
    if (!fraisId) {
      setAlerte({ type: 'error', message: 'ID du frais invalide' });
      return;
    }

    try {
      console.log('🔄 Génération frais élèves pour ID:', fraisId);

      const response = await fetch('/api/finance/frais-scolaires/generer-eleves', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ frais_scolaire_id: fraisId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Réponse génération:', data);
      
      if (data.success) {
        setAlerte({ type: 'success', message: data.message || 'Frais générés avec succès pour les élèves' });
        chargerDonnees();
      } else {
        setAlerte({ type: 'error', message: data.erreur || 'Erreur lors de la génération' });
      }
    } catch (error: any) {
      console.error('❌ Erreur génération frais élèves:', error);
      setAlerte({ type: 'error', message: `Erreur lors de la génération: ${error.message}` });
    }
  };

  if (chargement) {
    return (
      <div className={`chargement-frais ${parametresApp?.theme_defaut || 'clair'}`}>
        <div className="spinner-grand"></div>
        <p>Chargement des frais scolaires...</p>
      </div>
    );
  }

  const fraisAffiches = fraisFiltresEtTries();

  return (
    <div className={`conteneur-frais-classes ${parametresApp?.theme_defaut || 'clair'}`}>
      <div className="en-tete-fixe-finance">
        <div className="conteneur-en-tete-fixe-finance">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span style={{ fontSize: '22px' }}>🏫💰</span>
              <span style={{ fontSize: '24px', fontWeight: '600'}}>
               Gestion des Frais Scolaires
              </span>
            </div>
<div className="actions-globales">
          <button 
            className="bouton-export2"
            onClick={exporterVersExcel}
            title="Exporter vers Excel"
            disabled={obtenirFraisFiltres().length === 0}
          >
            📊 Excel
          </button>
          <button 
            className="bouton-print2"
            onClick={imprimerListe}
            title="Imprimer la liste"
            disabled={obtenirFraisFiltres().length === 0}
          >
            🖨️ Imprimer
          </button>
        
          {fraisSelectionnes.length > 0 && (
            <button 
              className="bouton-suppression-multiple"
              onClick={preparerSuppressionMultiple}
              title={`Supprimer ${fraisSelectionnes.length} frai(s) sélectionné(s)`}
            >
              🗑️ Supprimer ({fraisSelectionnes.length})
            </button>
          )}
          
          <button 
            className="bouton-ajouter-premier"
            onClick={ouvrirModalCreation}
          >
            ➕ Nouveau Frais
          </button>
        </div>
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

      {/* Section Filtres */}
      <div className="section-filtres">        
        <div className="grille-filtres">
          <div className="groupe-filtre">
            <label>Classe</label>
            <select
              value={filtres.classe}
              onChange={(e) => setFiltres(prev => ({ ...prev, classe: e.target.value }))}
              className="input-filtre"
            >
              <option value="">Toutes les classes</option>
              {classes.map(classe => (
                <option key={classe.id} value={classe.id}>
                  {classe.niveau} {classe.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="groupe-filtre">
            <label>Catégorie</label>
            <select
              value={filtres.categorie}
              onChange={(e) => setFiltres(prev => ({ ...prev, categorie: e.target.value }))}
              className="input-filtre"
            >
              <option value="">Toutes les catégories</option>
              {categories.map(categorie => (
                <option key={categorie.id} value={categorie.id}>
                  {categorie.nom}
                </option>
              ))}
            </select>
          </div>

          <div className="groupe-filtre">
            <label>Périodicité</label>
            <select
              value={filtres.periodicite}
              onChange={(e) => setFiltres(prev => ({ ...prev, periodicite: e.target.value }))}
              className="input-filtre"
            >
              <option value="">Toutes les périodicités</option>
              <option value="unique">Unique</option>
              <option value="mensuel">Mensuel</option>
              <option value="trimestriel">Trimestriel</option>
              <option value="annuel">Annuel</option>
            </select>
          </div>

          <div className="groupe-filtre">
            <label>Statut</label>
            <select
              value={filtres.statut}
              onChange={(e) => setFiltres(prev => ({ ...prev, statut: e.target.value }))}
              className="input-filtre"
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
            </select>
          </div>

          <div className="groupe-filtre">
            <button 
              className="bouton-secondaire petit"
              onClick={reinitialiserFiltres}
            >
              🔄 Réinitialiser
            </button>
          </div>
        </div>

        <div className="resume-filtres">
          <span className="nombre-resultats">
            {fraisAffiches.length} frais affiché(s)
            {fraisScolaires.length !== fraisAffiches.length && ` sur ${fraisScolaires.length} total`}
          </span>
        </div>
      </div>

      {/* Contenu à imprimer (caché à l'écran) */}
      <div className="conteneur-impression" style={{ display: 'none' }}>
        <div ref={contenuAImprimerRef} className="contenu-impression">
          {/* Le contenu est généré dynamiquement par la fonction imprimerListe */}
        </div>
      </div>
          
      <div className="en-tete-impression" style={{ display: 'none' }}>
        <span>Liste des Frais Scolaires </span> - <span style={{color: '#7b7c7e'}}>{fraisAffiches.length} frais défini(s)</span>  
      </div>

      {/* Tableau avec numéros et tri */}
      <table className="tableau-simple">
        <thead>
          <tr>
            <th style={{ width: '50px' }}>
              <label className="checkbox-container">
                <input 
                  type="checkbox"
                  checked={fraisSelectionnes.length === fraisAffiches.length && fraisAffiches.length > 0}
                  onChange={toggleSelectionTous}
                  className="checkbox-modern"
                />
                <span className="checkmark"></span>
              </label>
            </th>
            <th 
              className="colonne-triable"
              onClick={() => handleTri('numero')}
              style={{ cursor: 'pointer' }}
            >
              N° {getIconeTri('numero')}
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
              onClick={() => handleTri('montant')}
              style={{ cursor: 'pointer' }}
            >
              Montant {getIconeTri('montant')}
            </th>
            <th 
              className="colonne-triable"
              onClick={() => handleTri('periodicite')}
              style={{ cursor: 'pointer' }}
            >
              Périodicité {getIconeTri('periodicite')}
            </th>
            <th 
              className="colonne-triable"
              onClick={() => handleTri('eleves')}
              style={{ cursor: 'pointer' }}
            >
              Élèves {getIconeTri('eleves')}
            </th>
            <th 
              className="colonne-triable"
              onClick={() => handleTri('statut')}
              style={{ cursor: 'pointer' }}
            >
              Statut {getIconeTri('statut')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {fraisAffiches.length > 0 ? (
            fraisAffiches.map((frais, index) => (
              <tr key={frais.id} className={fraisSelectionnes.includes(frais.id) ? 'ligne-selectionnee' : ''}>
                <td style={{ width: '50px' }}>
                  <label className="checkbox-container">
                    <input 
                      type="checkbox"
                      checked={fraisSelectionnes.includes(frais.id)}
                      onChange={() => toggleSelectionFrais(frais.id)}
                      className="checkbox-modern"
                    />
                    <span className="checkmark"></span>
                  </label>
                </td>
                <td className="numero-ligne">
                  <strong>{index + 1}</strong>
                </td>
                <td>
                  <strong>{frais.classe_niveau} {frais.classe_nom}</strong>
                </td>
                <td>{frais.categorie_nom}</td>
                <td>{formaterMontantLocal(frais.montant)}</td>
                <td>
                  <span className={`badge ${frais.periodicite}`}>
                    {frais.periodicite}
                  </span>
                </td>
                <td>
                  <span className={`badge ${frais.nombre_eleves ? 'avec-eleves' : 'sans-eleves'}`}>
                    {frais.nombre_eleves || 0}
                  </span>
                </td>
                <td>
                  <span className={`badge ${frais.statut}`}>
                    {frais.statut}
                  </span>
                </td>
                <td>
                  <div className="actions-ligne">
                    <button 
                      className="bouton-icone"
                      onClick={() => genererFraisEleves(frais.id)}
                      title="Générer pour les élèves"
                    >
                      🔄
                    </button>
                    <button 
                      className="bouton-icone"
                      onClick={() => ouvrirModalEdition(frais)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      className="bouton-icone danger"
                      onClick={() => ouvrirModalSuppression(frais)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '40px' }}>
                <div className="aucun-frais">
                  <div className="icone-aucun-frais">📝</div>
                  <h3>Aucun frais scolaire trouvé</h3>
                  <p>
                    {fraisScolaires.length === 0 
                      ? 'Commencez par créer votre premier frais scolaire.' 
                      : 'Aucun frais ne correspond aux filtres sélectionnés.'
                    }
                  </p>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Modal création/édition moderne */}
      {modalOuvert && (
        <div className="overlay-modal-modern" onClick={fermerModal}>
          <div className="modal-modern large" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal-modern">
              <h2>{modeEdition ? 'Modifier le Frais' : 'Nouveau Frais Scolaire'}</h2>
              <button className="bouton-fermer-modal-modern" onClick={fermerModal}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="contenu-modal-modern">
              <div className="grille-formulaire-modern">
                <div className="groupe-champ-modern">
                  <label>Classe *</label>
                  <select
                    value={formData.classe_id}
                    onChange={(e) => setFormData({...formData, classe_id: e.target.value})}
                    className="input-modern"
                  >
                    <option value="">Sélectionnez une classe</option>
                    {classes.map(classe => (
                      <option key={classe.id} value={classe.id}>
                        {classe.niveau} {classe.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="groupe-champ-modern">
                  <label>Catégorie de frais *</label>
                  <select
                    value={formData.categorie_frais_id}
                    onChange={(e) => {
                      const categorieId = e.target.value;
                      const categorie = categories.find(c => c.id === parseInt(categorieId));
                      setFormData({
                        ...formData,
                        categorie_frais_id: categorieId,
                        periodicite: (categorie?.periodicite as any) || 'unique'
                      });
                    }}
                    className="input-modern"
                  >
                    <option value="">Sélectionnez une catégorie</option>
                    {categories.map(categorie => (
                      <option key={categorie.id} value={categorie.id}>
                        {categorie.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="groupe-champ-modern">
                  <label>Montant ({parametresApp?.symbole_devise || 'F CFA'}) *</label>
                  <input
                    type="number"
                    value={formData.montant || ''}
                    onChange={(e) => setFormData({...formData, montant: parseFloat(e.target.value) || 0})}
                    min="0"
                    step="100"
                    placeholder="Saisissez le montant"
                    className="input-modern"
                  />
                </div>

                <div className="groupe-champ-modern">
                  <label>Périodicité *</label>
                  <select
                    value={formData.periodicite}
                    onChange={(e) => setFormData({...formData, periodicite: e.target.value as any})}
                    className="input-modern"
                  >
                    <option value="unique">Unique</option>
                    <option value="mensuel">Mensuel</option>
                    <option value="trimestriel">Trimestriel</option>
                    <option value="annuel">Annuel</option>
                  </select>
                </div>
                 
                <input
                  type="hidden"
                  value={formData.annee_scolaire}
                  onChange={(e) => setFormData({...formData, annee_scolaire: e.target.value})}
                />
              </div>

              {(formData.classe_id && formData.categorie_frais_id && formData.annee_scolaire) && (
                <div className="verification-frais">
                  {(() => {
                    const fraisExiste = fraisScolaires.find(frais => 
                      frais.classe_id === parseInt(formData.classe_id) &&
                      frais.categorie_frais_id === parseInt(formData.categorie_frais_id) &&
                      frais.annee_scolaire === formData.annee_scolaire &&
                      (!modeEdition || frais.id !== fraisEnEdition?.id)
                    );
                    
                    if (fraisExiste) {
                      return (
                        <div className="alerte-avertissement" style={{
                          background: '#fff3cd',
                          border: '1px solid #ffeaa7',
                          borderRadius: '8px',
                          padding: '12px',
                          marginTop: '10px',
                          fontSize: '14px'
                        }}>
                          <strong>⚠️ Attention :</strong> Un frais existe déjà pour cette combinaison.
                          <br />
                          <small>
                            <strong>Frais existant :</strong> {fraisExiste.categorie?.nom || 'Catégorie inconnue'} - 
                            {formaterMontantLocal(fraisExiste.montant)} ({fraisExiste.periodicite})
                          </small>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              <div className="actions-modal-modern">
                <button className="bouton-secondaire-modern" onClick={fermerModal}>
                  Annuler
                </button>
                <button 
                  className="bouton-primaire-modern" 
                  onClick={creerOuModifierFrais}
                  disabled={!formData.classe_id || !formData.categorie_frais_id || !formData.montant}
                >
                  {modeEdition ? '💾 Modifier' : '➕ Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression moderne */}
      {modalSuppressionOuvert && fraisASupprimer && (
        <div className="overlay-modal-modern" onClick={fermerModalSuppression}>
          <div className="modal-modern confirmation" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal-modern">
              <h2>Confirmer la suppression</h2>
              <button className="bouton-fermer-modal-modern" onClick={fermerModalSuppression}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="contenu-modal-modern">
              <div className="icone-avertissement">
                ⚠️
              </div>
              <h3 className="avertissement-text">Êtes-vous sûr de vouloir supprimer ce frais ?</h3>
              <div className="details-suppression">
                <p><strong>Classe:</strong> {fraisASupprimer.classe_niveau} {fraisASupprimer.classe_nom}</p>
                <p><strong>Catégorie:</strong> {fraisASupprimer.categorie_nom}</p>
                <p><strong>Montant:</strong> {formaterMontantLocal(fraisASupprimer.montant)}</p>
              </div>

              <div className="actions-modal-modern">
                <button className="bouton-secondaire-modern" onClick={fermerModalSuppression}>
                  Annuler
                </button>
                <button 
                  className="bouton-danger-modern" 
                  onClick={supprimerFrais}
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation pour suppression multiple */}
      {modalSuppressionMultipleOuvert && fraisASupprimerMultiple.length > 0 && (
        <div className="overlay-modal-modern" onClick={() => setModalSuppressionMultipleOuvert(false)}>
          <div className="modal-modern confirmation large" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal-modern" style={{ borderBottom: '2px solid #fee2e2' }}>
              <h2 style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🗑️ Confirmer la suppression multiple
              </h2>
              <button className="bouton-fermer-modal-modern" onClick={() => setModalSuppressionMultipleOuvert(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="contenu-modal-modern">
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
                    Vous êtes sur le point de supprimer <strong>{fraisASupprimerMultiple.length} frai(s) scolaire(s)</strong>.
                  </p>
                  <p style={{ 
                    fontSize: '13px', 
                    color: '#7f1d1d',
                    fontStyle: 'italic'
                  }}>
                    Cette action est irréversible. Tous les frais élèves associés seront également supprimés.
                  </p>
                </div>
              </div>

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
                  📋 Détail des frais à supprimer
                  <span style={{ 
                    background: '#dc2626', 
                    color: 'white', 
                    padding: '2px 10px', 
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {fraisASupprimerMultiple.length} frai(s)
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
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Classe</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Catégorie</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px' }}>Périodicité</th>
                        <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px' }}>Montant</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fraisASupprimerMultiple.map((frais, index) => (
                        <tr key={frais.id} style={{ 
                          borderBottom: '1px solid #e2e8f0',
                          background: index % 2 === 0 ? 'white' : '#fafafa'
                        }}>
                          <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                            <strong>{frais.classe_niveau} {frais.classe_nom}</strong>
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                            {frais.categorie_nom}
                          </td>
                          <td style={{ padding: '10px 12px', fontSize: '13px' }}>
                            <span className={`badge ${frais.periodicite}`}>
                              {frais.periodicite}
                            </span>
                          </td>
                          <td style={{ 
                            padding: '10px 12px', 
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#059669',
                            textAlign: 'right'
                          }}>
                            {formaterMontantLocal(frais.montant)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot style={{ 
                      background: '#f1f5f9',
                      borderTop: '2px solid #e2e8f0'
                    }}>
                      <tr>
                        <td colSpan={3} style={{ 
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
                          {formaterMontantLocal(fraisASupprimerMultiple.reduce((sum, f) => sum + f.montant, 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

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
                  style={{ padding: '12px 24px' }}
                >
                  Annuler
                </button>
                
                <button 
                  className="bouton-danger-modern"
                  onClick={supprimerFraisMultiple}
                  style={{
                    background: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px 32px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  🗑️ Confirmer la suppression ({fraisASupprimerMultiple.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}