'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import './GestionNotesPrimaire.css';
import ModalRelevesGeneres from './ModalRelevesGeneres';
import GestionMatieres from './GestionMatieres';
import { FileText, Eye, Printer } from 'lucide-react';

// Interfaces (inchangées)
interface ElevePrimaire {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  classe_id: number;
  classe_nom?: string;
  niveau?: string;
  statut: string;
  matricule?: string;
  email_parents?: string;
  genre?: 'M' | 'F';
}

interface ClassePrimaire {
  id: number;
  nom: string; 
  niveau: string;
  professeur_principal_id?: number;
  created_at: string;
  effectif?: number;
  instituteur_nom?: string;
}

interface PeriodePrimaire {
  id: number;
  nom: string;
  code_periode: string;
  annee_scolaire: string;
  date_debut: string;
  date_fin: string;
  type_periode: string;
  numero: number;
  est_periode_courante: boolean;
  statut: string;
}

interface MatierePrimaire {
  id: number;
  nom: string;
  code_matiere: string;
  niveau: string;
  description?: string;
  couleur: string;
  icone: string;
  coefficient: number;
  note_sur: number;
  ordre_affichage: number;
  statut: string;
}

interface CompositionPrimaire {
  id: number;
  code_composition: string;
  titre: string;
  classe_id: number;
  classe_nom: string;
  classe_niveau?: string;
  instituteur_id: number;
  instituteur_nom: string;
  date_composition: string;
  periode_id: number;
  periode_nom: string;
  annee_scolaire: string;
  statut: string;
  notes_saisies: boolean;
  releves_generes: boolean;
  est_supprime?: boolean;
}

interface NotePrimaire {
  id?: number;
  eleve_id: number;
  eleve_nom: string;
  eleve_prenom: string;
  composition_id: number;
  matiere_id: number;
  matiere_nom: string;
  note: number;
  note_sur: number;
  appreciation: string;
  date_saisie: string;
  saisie_par: number;
  saisie_par_nom: string;
  couleur?: string;
  coefficient?: number;
}

interface ParametresEcole {
  nom_ecole: string;
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

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  important?: boolean;
}

interface RelevePrimaire {
  id: number;
  eleve_id: number;
  matricule: string;
  eleve_nom: string;
  eleve_prenom: string;
  classe_id: number;
  classe_nom: string;
  periode_id: number;
  periode_nom: string;
  moyennes_par_matiere: string | any[];
  moyenne_generale: number;
  rang: number;
  mention: string;
  appreciation_generale: string;
  date_generation: string;
  statut: string;
  email_envoye: boolean;
  date_envoi_email: string | null;
}

interface ReleveData {
  eleve_id: number;
  eleve_nom: string;
  eleve_prenom: string;
  matricule: string;
  classe_nom: string;
  periode_nom: string;
  composition_titre: string;
  date_composition: string;
  matieres: Array<{
    matiere_id: number;
    matiere_nom: string;
    coefficient: number;
    note: number;
    note_sur: number;
    appreciation: string;
    note_coefficientee?: number | string;
  }>;
  moyenne_generale: number;
  rang: number;
  mention: string;
  appreciation_generale: string;
}

interface ReleveDetailModalData {
  id: number;
  eleve_id: number;
  matricule: string;
  eleve_nom: string;
  eleve_prenom: string;
  classe_nom: string;
  periode_nom: string;
  moyenne_generale: number;
  rang: number;
  mention: string;
  appreciation_generale: string;
  date_generation: string;
  statut: string;
  email_envoye: boolean;
  date_envoi_email: string | null;
  moyennes_par_matiere: Array<{
    matiere_id: number;
    matiere_nom: string;
    coefficient: number;
    note: number;
    note_sur: number;
    appreciation: string;
  }>;
}

// Interface pour les données brutes de l'API
interface RelevePrimaireAPI {
  id: number;
  eleve_id: number;
  matricule: string;
  eleve_nom: string;
  eleve_prenom: string;
  classe_id: number;
  classe_nom: string;
  periode_id: number;
  periode_nom: string;
  moyennes_par_matiere: string; // JSON string
  moyenne_generale: number;
  rang: number;
  mention: string;
  appreciation_generale: string;
  date_generation: string;
  statut: string;
  email_envoye: boolean;
  date_envoi_email: string | null;
}

// Interfaces dans la section des interfaces existantes
interface PeriodeVerification {
  id: number;
  est_periode_courante: boolean;
  compositions_count?: number;
  notes_count?: number;
  can_be_deleted: boolean;
}

interface MatiereVerification {
  id: number;
  notes_count?: number;
  can_be_deleted: boolean;
}

// Interface pour l'affichage dans la modale
interface RelevePourAffichage {
  id: number;
  eleve_id: number;
  matricule: string;
  eleve_nom: string;
  eleve_prenom: string;
  classe_nom: string;
  periode_nom: string;
  moyenne_generale: number;
  rang: number;
  mention: string;
  appreciation_generale: string;
  date_generation: string;
  statut: string;
  email_envoye: boolean;
  date_envoi_email: string | null;
  moyennes_par_matiere: Array<{
    matiere_id: number;
    matiere_nom: string;
    coefficient: number;
    note: number;
    note_sur: number;
    appreciation: string;
  }>;
  composition_titre?: string;
}

interface Props {
  onRetourTableauDeBord: () => void;
}

export default function GestionNotesPrimaire({ onRetourTableauDeBord }: Props) {
  // ========== ÉTATS PRINCIPAUX ==========
  const [eleves, setEleves] = useState<ElevePrimaire[]>([]);
  const [classes, setClasses] = useState<ClassePrimaire[]>([]);
  const [periodes, setPeriodes] = useState<PeriodePrimaire[]>([]);
  const [matieres, setMatieres] = useState<MatierePrimaire[]>([]);
  const [compositions, setCompositions] = useState<CompositionPrimaire[]>([]);
  const [notes, setNotes] = useState<NotePrimaire[]>([]);
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp | null>(null);
  
  const [chargement, setChargement] = useState(true);
  const [chargementSaisie, setChargementSaisie] = useState(false);
  
  // Système de notifications Toast
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // ========== FILTRES ==========
  const [classeSelectionnee, setClasseSelectionnee] = useState<number>(0);
  const [periodeSelectionnee, setPeriodeSelectionnee] = useState<number>(0);
  const [compositionSelectionnee, setCompositionSelectionnee] = useState<number>(0);
  const [ongletActif, setOngletActif] = useState<'compositions' | 'saisie' | 'releves'>('compositions');

  // ========== MODALES ET FORMULAIRES ==========
  const [modalCompositionOuvert, setModalCompositionOuvert] = useState(false);
  const [modalPeriodeOuvert, setModalPeriodeOuvert] = useState(false);
    
  // États pour la gestion des périodes (modification/suppression)
  const [periodeAModifier, setPeriodeAModifier] = useState<PeriodePrimaire | null>(null);
  const [periodeASupprimer, setPeriodeASupprimer] = useState<PeriodePrimaire | null>(null);

  const [compositionAModifier, setCompositionAModifier] = useState<CompositionPrimaire | null>(null);
  const [compositionASupprimer, setCompositionASupprimer] = useState<CompositionPrimaire | null>(null);

  // États après relevés de notes
  const [releves, setReleves] = useState<RelevePrimaire[]>([]);
  const [chargementReleves, setChargementReleves] = useState(false);
  const [generationEnCours, setGenerationEnCours] = useState<Record<number, boolean>>({});
  const [releveEnCoursGeneration, setReleveEnCoursGeneration] = useState<number | null>(null);
  const [releveAPrevisualiser, setReleveAPrevisualiser] = useState<ReleveData | null>(null);
  const [modalPrevisualisationOuvert, setModalPrevisualisationOuvert] = useState(false);

  const [relevesImprimer, setRelevesImprimer] = useState<ReleveData[]>([]);
  const [modalImprimerTous, setModalImprimerTous] = useState(false);

  const [tousRelevesAffiches, setTousRelevesAffiches] = useState<RelevePourAffichage[]>([]);
  const [modalTousRelevesOuvert, setModalTousRelevesOuvert] = useState(false);
  const [erreurChargement, setErreurChargement] = useState<string | null>(null);

  const [showRelevesModal, setShowRelevesModal] = useState(false);
  const [selectedCompositionForReleves, setSelectedCompositionForReleves] = useState<number | null>(null);
  const [moyenneClasse, setMoyenneClasse] = useState<number>(0);
  const [periodesSupprimables, setPeriodesSupprimables] = useState<Record<number, boolean>>({});

  const [verificationsMatieres, setVerificationsMatieres] = useState<Record<number, MatiereVerification>>({});
  const [verificationsPeriodes, setVerificationsPeriodes] = useState<Record<number, PeriodeVerification>>({});

  const [modalMatieresCoursOuvert, setModalMatieresCoursOuvert] = useState(false);

  const ouvrirGestionMatieres = () => {
  setModalMatieresCoursOuvert(true);
};

  const [formComposition, setFormComposition] = useState({
    titre: '',
    classe_id: 0,
    classe_nom: '',
    classe_niveau: '',
    date_composition: new Date().toISOString().split('T')[0],
    periode_id: 0,
    periode_nom: '',
    annee_scolaire: '',
    statut: 'a_venir'
  });

  const [formPeriode, setFormPeriode] = useState({
    nom: '',
    code_periode: '',
    annee_scolaire: '',
    date_debut: '',
    date_fin: '',
    type_periode: 'trimestre' as 'trimestre' | 'semestre' | 'bimestre',
    numero: 1,
    est_periode_courante: false,
    statut: 'active' as 'active' | 'a_venir' | 'fermee'
  });

  // ========== SAISIE DES NOTES (SIMPLIFIÉE) ==========
  const [notesSaisie, setNotesSaisie] = useState<Record<string, Record<string, {
    note: string;
  }>>>({});

  const [appreciationsGenerales, setAppreciationsGenerales] = useState<Record<number, string>>({});

  // ========== UTILISATEUR ==========
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [instituteur, setInstituteur] = useState<any>(null);

  // ========== RÉFÉRENCES ==========
  const notesInitialiseesRef = useRef(false);

  // ========== FONCTIONS DE FORMATAGE DYNAMIQUE ==========

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

  // Formater l'heure
  const formaterHeure = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // ========== FONCTIONS D'APPRÉCIATION AUTOMATIQUE ==========
  const genererAppreciationAuto = (note: number): string => {
    const noteNum = parseFloat(note.toString()) || 0;
    
    if (noteNum === 0) return 'Non évalué';
    if (noteNum >= 18) return 'Excellent';
    if (noteNum >= 16) return 'Très Bien';
    if (noteNum >= 14) return 'Bien';
    if (noteNum >= 10) return 'Assez Bien';
    return 'Insuffisant';
  };

  const genererAppreciationDetaillee = (note: number): string => {
    const noteNum = parseFloat(note.toString()) || 0;
    
    if (noteNum === 0) return 'Élève non évalué pour cette période';
    if (noteNum >= 18) return 'Excellent - Travail remarquable, félicitations !';
    if (noteNum >= 16) return 'Très Bien - Très bon travail, continuez ainsi !';
    if (noteNum >= 14) return 'Bien - Bon travail, des progrès sont encore possibles';
    if (noteNum >= 10) return 'Assez Bien - Résultats satisfaisants, peut mieux faire';
    return 'Insuffisant - Des efforts supplémentaires sont nécessaires';
  };

  const calculerMention = (moyenne: number): string => {
    if (moyenne >= 18) return 'Félicitations';
    if (moyenne >= 16) return 'Très bien';
    if (moyenne >= 14) return 'Bien';
    if (moyenne >= 12) return 'Assez bien';
    if (moyenne >= 10) return 'Passable';
    return 'Insuffisant';
  };

  // ========== FONCTIONS DE NOTIFICATION TOAST ==========
  const ajouterToast = (
    type: 'success' | 'error' | 'warning' | 'info', 
    message: string, 
    options?: {
      duration?: number;
      action?: {
        label: string;
        onClick: () => void;
      };
      important?: boolean;
    }
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = options?.duration || 5000;
    const important = options?.important || false;
    
    const newToast: ToastNotification = { 
      id, 
      type, 
      message, 
      duration,
      action: options?.action,
      important
    };
    
    setToasts(prev => [...prev, newToast]);
    
    setTimeout(() => {
      fermerToast(id);
    }, duration);
  };

  const fermerToast = (id: string) => {
    const toastElement = document.querySelector(`[data-toast-id="${id}"]`);
    if (toastElement) {
      toastElement.classList.add('exiting');
    }
    
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 400);
  };

  const handleViewReleves = (compositionId?: number) => {
    setSelectedCompositionForReleves(compositionId || null);
    setShowRelevesModal(true);
  };

  // ========== FONCTIONS DE CHARGEMENT ==========
  const chargerDonneesInitiales = async () => {
    try {
      setChargement(true);

      // Charger les paramètres de l'école
      try {
        const resParametres = await fetch('/api/parametres/ecole');
        const dataParametres = await resParametres.json();
        if (dataParametres.success) {
          setParametresEcole(dataParametres.parametres);
        }
      } catch (error) {
        console.log('⚠️ Impossible de charger les paramètres de l\'école');
      }

      // Charger les paramètres de l'application
      try {
        const resApp = await fetch('/api/parametres/application');
        const dataApp = await resApp.json();
        if (dataApp.success) {
          setParametresApp(dataApp.parametres);
        }
      } catch (error) {
        console.log('⚠️ Impossible de charger les paramètres de l\'application');
      }

      // Charger les classes
      try {
        const resClasses = await fetch('/api/classes');
        const dataClasses = await resClasses.json();
        
        if (dataClasses.success && dataClasses.classes) {
          const niveauxPrimaire = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];
          const classesPrimaires = dataClasses.classes.filter((classe: any) => 
            niveauxPrimaire.includes(classe.niveau)
          );
          setClasses(classesPrimaires);
        }
      } catch (error) {
        console.error('❌ Erreur chargement classes:', error);
        setClasses([]);
      }

      // Charger les périodes
      try {
        const resPeriodes = await fetch('/api/periodes-primaires');
        const dataPeriodes = await resPeriodes.json();
        if (dataPeriodes.success) {
          setPeriodes(dataPeriodes.periodes || []);
        }
      } catch (error) {
        console.error('❌ Erreur chargement périodes:', error);
        setPeriodes([]);
      }

      // Charger les matières
      try {
        const resMatieres = await fetch('/api/matieres-primaires');
        const dataMatieres = await resMatieres.json();
        if (dataMatieres.success) {
          const matieresTriees = (dataMatieres.matieres || []).sort((a: MatierePrimaire, b: MatierePrimaire) => 
            a.ordre_affichage - b.ordre_affichage
          );
          setMatieres(matieresTriees);
        }
      } catch (error) {
        console.error('❌ Erreur chargement matières:', error);
      }

      // Récupérer l'utilisateur
      try {
        const userData = localStorage.getItem('utilisateur');
        if (userData) {
          const user = JSON.parse(userData);
          setUtilisateur(user);
          if (user.role === 'enseignant' || user.role === 'instituteur') {
            setInstituteur(user);
          }
        }
      } catch (error) {
        console.log('⚠️ Utilisateur non connecté');
      }

    } catch (error) {
      console.error('❌ Erreur chargement initial:', error);
      ajouterToast('error', 'Erreur lors du chargement des données');
    } finally {
      setChargement(false);
    }
  };

  const convertirEnNombre = (valeur: any): number => {
    if (valeur === null || valeur === undefined || valeur === '') {
      return 0;
    }
    if (typeof valeur === 'number') {
      return valeur;
    }
    const nombre = parseFloat(valeur);
    return isNaN(nombre) ? 0 : nombre;
  };

  const chargerElevesParClasse = async (classeId: number) => {
    try {
      const url = `/api/eleves?classe_id=${classeId}&_=${Date.now()}`;
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        const elevesTries = (data.eleves || []).sort((a: ElevePrimaire, b: ElevePrimaire) => 
          a.nom.localeCompare(b.nom)
        );
        setEleves(elevesTries);
      } else {
        setEleves([]);
        ajouterToast('error', 'Erreur lors du chargement des élèves');
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement élèves:', error.message);
      setEleves([]);
      ajouterToast('error', 'Erreur lors du chargement des élèves');
    }
  };

  const chargerMatieresPrimaire = async () => {
    try {
      const response = await fetch('/api/matieres-primaires');
      const data = await response.json();
      if (data.success) {
        const matieresTriees = (data.matieres || []).sort((a: MatierePrimaire, b: MatierePrimaire) => 
          a.ordre_affichage - b.ordre_affichage
        );
        setMatieres(matieresTriees);
      }
    } catch (error) {
      console.error('Erreur chargement matières primaires:', error);
    }
  };

  const verifierSuppressions = async () => {
    try {
      // Vérifier toutes les matières
      const verifMatieres: Record<number, MatiereVerification> = {};
      for (const matiere of matieres) {
        const response = await fetch(`/api/matieres-primaires/${matiere.id}/check-delete`);
        if (response.ok) {
          const data = await response.json();
          verifMatieres[matiere.id] = data;
        }
      }
      setVerificationsMatieres(verifMatieres);

      // Vérifier toutes les périodes
      const verifPeriodes: Record<number, PeriodeVerification> = {};
      for (const periode of periodes) {
        const response = await fetch(`/api/periodes-primaires/${periode.id}/check-delete`);
        if (response.ok) {
          const data = await response.json();
          verifPeriodes[periode.id] = data;
        }
      }
      setVerificationsPeriodes(verifPeriodes);
    } catch (error) {
      console.error('Erreur vérification suppressions:', error);
    }
  };

  // Appelez cette fonction quand les données changent
  useEffect(() => {
    if (matieres.length > 0 || periodes.length > 0) {
      verifierSuppressions();
    }
  }, [matieres, periodes]);

  const chargerCompositions = async () => {
    if (!classeSelectionnee || !periodeSelectionnee) {
      console.log('⚠️ Classe ou période non sélectionnée pour charger les compositions');
      return;
    }

    try {
      const response = await fetch(`/api/compositions-primaires?classe_id=${classeSelectionnee}&periode_id=${periodeSelectionnee}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCompositions(data.compositions || []);
      } else {
        console.error('❌ Erreur API compositions:', data.error);
        setCompositions([]);
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement compositions:', error.message);
      setCompositions([]);
    }
  };

  const chargerNotesComposition = async () => {
    if (!compositionSelectionnee) {
      console.log('⚠️ Aucune composition sélectionnée');
      return;
    }

    try {
      const response = await fetch(`/api/notes-primaires?composition_id=${compositionSelectionnee}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNotes(data.notes || []);
        initialiserNotesSaisie(data.notes);
      } else {
        console.error('❌ Erreur API notes:', data.error);
        setNotes([]);
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement notes:', error.message);
      setNotes([]);
    }
  };

  // ========== GESTION DES NOTES ==========
  const initialiserNotesSaisie = (notesData: NotePrimaire[]) => {
    const nouvellesNotes: Record<string, Record<string, {note: string}>> = {};
    
    eleves.forEach(eleve => {
      nouvellesNotes[eleve.id] = {};
      matieres.forEach(matiere => {
        const noteExistante = notesData.find((n: NotePrimaire) => 
          n.eleve_id === eleve.id && n.matiere_id === matiere.id
        );
        
        nouvellesNotes[eleve.id][matiere.id] = {
          note: noteExistante ? noteExistante.note.toString() : '0'
        };
      });
    });
    
    setNotesSaisie(nouvellesNotes);
    notesInitialiseesRef.current = true;
  };

  const gererChangementNote = (eleveId: number, matiereId: number, valeur: string) => {
    const matiere = matieres.find(m => m.id === matiereId);
    const noteSur = matiere?.note_sur || 20;
    
    if (valeur === '' || /^\d*\.?\d*$/.test(valeur)) {
      const numValue = parseFloat(valeur);
      if (!isNaN(numValue)) {
        if (numValue > noteSur) {
          ajouterToast('warning', `La note ne peut pas dépasser ${noteSur} pour cette matière`);
          return;
        }
        
        setNotesSaisie(prev => ({
          ...prev,
          [eleveId]: {
            ...prev[eleveId] || {},
            [matiereId]: {
              ...(prev[eleveId]?.[matiereId] || { note: '0' }),
              note: valeur
            }
          }
        }));
      } else if (valeur === '') {
        setNotesSaisie(prev => ({
          ...prev,
          [eleveId]: {
            ...prev[eleveId] || {},
            [matiereId]: {
              note: ''
            }
          }
        }));
      }
    }
  };

  // Fonction améliorée pour imprimer un relevé d'élève depuis la liste
  const imprimerReleveEleve = async (eleve: ElevePrimaire) => {
    if (!compositionSelectionnee) {
      ajouterToast('error', 'Veuillez sélectionner une composition');
      return;
    }
    
    try {
      setGenerationEnCours(prev => ({ ...prev, [eleve.id]: true }));
      setReleveEnCoursGeneration(eleve.id);
      
      const composition = compositions.find(c => c.id === compositionSelectionnee);
      if (!composition) {
        throw new Error('Composition non trouvée');
      }
      
      // Chercher le relevé existant pour cet élève
      const releveEleve = releves.find(r => r.eleve_id === eleve.id);
      
      let releveData: ReleveData;
      
      if (releveEleve) {
        // Si le relevé existe déjà, l'utiliser
        let moyennesParsed = [];
        try {
          if (releveEleve.moyennes_par_matiere && typeof releveEleve.moyennes_par_matiere === 'string') {
            moyennesParsed = JSON.parse(releveEleve.moyennes_par_matiere);
          } else if (Array.isArray(releveEleve.moyennes_par_matiere)) {
            moyennesParsed = releveEleve.moyennes_par_matiere;
          }
        } catch (error) {
          console.error('Erreur parsing moyennes:', error);
          moyennesParsed = [];
        }
        
        // S'il n'y a pas de matières dans le relevé, récupérer les notes depuis l'API
        if (moyennesParsed.length === 0) {
          const responseNotes = await fetch(
            `/api/notes-primaires?composition_id=${compositionSelectionnee}&eleve_id=${eleve.id}`
          );
          
          if (responseNotes.ok) {
            const dataNotes = await responseNotes.json();
            if (dataNotes.success && dataNotes.notes) {
              moyennesParsed = dataNotes.notes.map((note: any) => ({
                matiere_id: note.matiere_id,
                matiere_nom: note.matiere_nom,
                coefficient: parseFloat(note.coefficient) || 1,
                note: parseFloat(note.note) || 0,
                note_sur: parseFloat(note.note_sur) || 20,
                appreciation: genererAppreciationAuto(parseFloat(note.note))
              }));
            }
          }
        }
        
        releveData = {
          eleve_id: eleve.id,
          eleve_nom: eleve.nom,
          eleve_prenom: eleve.prenom,
          matricule: eleve.matricule || '',
          classe_nom: composition.classe_nom,
          periode_nom: composition.periode_nom,
          composition_titre: composition.titre,
          date_composition: composition.date_composition,
          matieres: moyennesParsed,
          moyenne_generale: releveEleve.moyenne_generale,
          rang: releveEleve.rang,
          mention: releveEleve.mention,
          appreciation_generale: releveEleve.appreciation_generale
        };
      } else {
        // Si pas de relevé existant, générer les données depuis les notes
        const responseNotes = await fetch(
          `/api/notes-primaires?composition_id=${compositionSelectionnee}&eleve_id=${eleve.id}`
        );
        
        if (!responseNotes.ok) {
          throw new Error(`Erreur HTTP notes: ${responseNotes.status}`);
        }
        
        const dataNotes = await responseNotes.json();
        if (!dataNotes.success) {
          throw new Error(dataNotes.error || 'Erreur lors de la récupération des notes');
        }
        
        const notesEleve = dataNotes.notes || [];
        
        if (notesEleve.length === 0) {
          ajouterToast('warning', `Aucune note trouvée pour ${eleve.prenom} ${eleve.nom}`);
          return;
        }
        
        // Calculer la moyenne pour cet élève
        const matieresAvecNotes = notesEleve.map((note: any) => ({
          note: parseFloat(note.note) || 0,
          coefficient: parseFloat(note.coefficient) || 1
        }));
        
        const moyenneEleve = calculerMoyennePonderee(matieresAvecNotes);
        
        // Calculer le rang
        const elevesAvecMoyennes = [];
        for (const eleveClasse of eleves) {
          const responseEleveNotes = await fetch(
            `/api/notes-primaires?composition_id=${compositionSelectionnee}&eleve_id=${eleveClasse.id}`
          );
          
          if (responseEleveNotes.ok) {
            const dataEleveNotes = await responseEleveNotes.json();
            if (dataEleveNotes.success && dataEleveNotes.notes?.length > 0) {
              const notes = dataEleveNotes.notes;
              const matieresNotes = notes.map((note: any) => ({
                note: parseFloat(note.note) || 0,
                coefficient: parseFloat(note.coefficient) || 1
              }));
              const moyenne = calculerMoyennePonderee(matieresNotes);
              
              elevesAvecMoyennes.push({
                eleve_id: eleveClasse.id,
                moyenne: moyenne
              });
            }
          }
        }
        
        const rangs = calculerRangsEleves(elevesAvecMoyennes);
        const rangEleve = rangs[eleve.id] || 0;
        
        releveData = {
          eleve_id: eleve.id,
          eleve_nom: eleve.nom,
          eleve_prenom: eleve.prenom,
          matricule: eleve.matricule || '',
          classe_nom: composition.classe_nom,
          periode_nom: composition.periode_nom,
          composition_titre: composition.titre,
          date_composition: composition.date_composition,
          matieres: notesEleve.map((note: any) => ({
            matiere_id: note.matiere_id,
            matiere_nom: note.matiere_nom,
            coefficient: parseFloat(note.coefficient) || 1,
            note: parseFloat(note.note) || 0,
            note_sur: parseFloat(note.note_sur) || 20,
            appreciation: genererAppreciationAuto(parseFloat(note.note))
          })),
          moyenne_generale: parseFloat(moyenneEleve.toFixed(2)),
          rang: rangEleve,
          mention: calculerMention(moyenneEleve),
          appreciation_generale: genererAppreciationDetaillee(moyenneEleve)
        };
      }
      
      // Lancer l'impression directement
      imprimerReleve(releveData);
      
    } catch (error: any) {
      console.error('Erreur impression relevé:', error);
      ajouterToast('error', `Erreur lors de l'impression du relevé: ${error.message}`);
    } finally {
      setGenerationEnCours(prev => ({ ...prev, [eleve.id]: false }));
      setReleveEnCoursGeneration(null);
    }
  };

  // Fonction pour parser les moyennes par matière d'un relevé
  const parserMoyennesParMatiere = (releve: RelevePrimaire): Array<{
    matiere_id: number;
    matiere_nom: string;
    coefficient: number;
    note: number;
    note_sur: number;
    appreciation: string;
  }> => {
    try {
      if (!releve.moyennes_par_matiere) {
        return [];
      }
      
      let parsedData;
      
      // Si c'est une chaîne JSON, la parser
      if (typeof releve.moyennes_par_matiere === 'string') {
        parsedData = JSON.parse(releve.moyennes_par_matiere);
      } else {
        // Sinon, utiliser directement
        parsedData = releve.moyennes_par_matiere;
      }
      
      // S'assurer que c'est un tableau
      if (!Array.isArray(parsedData)) {
        console.warn('Les moyennes par matière ne sont pas un tableau:', parsedData);
        return [];
      }
      
      // Transformer en format standard
      return parsedData.map((item: any) => ({
        matiere_id: item.matiere_id || 0,
        matiere_nom: item.matiere_nom || 'Matière inconnue',
        coefficient: item.coefficient ? parseFloat(item.coefficient) : 1,
        note: item.note ? parseFloat(item.note) : 0,
        note_sur: item.note_sur ? parseFloat(item.note_sur) : 20,
        appreciation: item.appreciation || genererAppreciationAuto(item.note || 0)
      }));
      
    } catch (error) {
      console.error('Erreur lors du parsing des moyennes:', error);
      return [];
    }
  };

  const sauvegarderNotes = async () => {
    if (!compositionSelectionnee) {
      ajouterToast('error', 'Veuillez sélectionner une composition');
      return;
    }

    try {
      setChargementSaisie(true);

      const notesASauvegarder: any[] = [];
      
      Object.entries(notesSaisie).forEach(([eleveIdStr, notesMatieres]) => {
        const eleveId = parseInt(eleveIdStr);
        const eleve = eleves.find(e => e.id === eleveId);
        
        if (!eleve) return;
        
        Object.entries(notesMatieres).forEach(([matiereIdStr, noteData]) => {
          const matiereId = parseInt(matiereIdStr);
          const matiere = matieres.find(m => m.id === matiereId);
          
          if (!matiere) return;
          
          const noteValue = parseFloat(noteData.note) || 0;
          const noteSur = matiere.note_sur || 20;
          
          if (noteValue > noteSur) {
            ajouterToast('warning', `Note de ${eleve.nom} en ${matiere.nom} dépasse ${noteSur}`);
            return;
          }
          
          notesASauvegarder.push({
            eleve_id: eleveId,
            eleve_nom: eleve.nom,
            eleve_prenom: eleve.prenom,
            matiere_id: matiereId,
            matiere_nom: matiere.nom,
            note: noteValue,
            note_sur: noteSur,
            appreciation: '',
            date_saisie: new Date().toISOString().split('T')[0],
            saisie_par: utilisateur?.id || 0,
            saisie_par_nom: utilisateur?.nom || 'Inconnu'
          });
        });
      });

      const response = await fetch('/api/notes-primaires/masse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notesASauvegarder,
          composition_id: compositionSelectionnee
        })
      });

      const data = await response.json();
      if (data.success) {
        ajouterToast('success', 
          `Notes sauvegardées avec succès! ${data.stats?.notes_sauvegardees || 0} notes ajoutées, ${data.stats?.notes_modifiees || 0} modifiées.`
        );
        chargerNotesComposition();
        chargerCompositions();
      } else {
        ajouterToast('error', data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde notes:', error);
      ajouterToast('error', 'Erreur lors de la sauvegarde des notes');
    } finally {
      setChargementSaisie(false);
    }
  };

  // Fonction pour obtenir une couleur aléatoire (pour les barres)
  const getCouleurAleatoire = (seed: string) => {
    const couleurs = [
      '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
      '#EC4899', '#14B8A6', '#F97316', '#6366F1', '#84CC16'
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return couleurs[Math.abs(hash) % couleurs.length];
  };

  // Fonction pour afficher les détails d'un relevé
  const afficherDetailsReleve = (releve: RelevePourAffichage) => {
    const modalDetails = window.open('', '_blank');
    if (modalDetails) {
      const html = `
        <html>
        <head>
          <title>Détails du relevé #${releve.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .container { max-width: 800px; margin: 0 auto; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .table th, .table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .table th { background: #f1f3f5; }
            .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .badge-success { background: #d3f9d8; color: #2b8a3e; }
            .badge-warning { background: #fff3bf; color: #e67700; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Détails du relevé #${releve.id}</h1>
              <p><strong>Élève:</strong> ${releve.eleve_prenom} ${releve.eleve_nom}</p>
              <p><strong>Classe:</strong> ${releve.classe_nom} | <strong>Période:</strong> ${releve.periode_nom}</p>
            </div>
            
            <h3>Moyennes par matière</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Matière</th>
                  <th>Coefficient</th>
                  <th>Note</th>
                  <th>Appréciation</th>
                </tr>
              </thead>
              <tbody>
                ${releve.moyennes_par_matiere.map(matiere => `
                  <tr>
                    <td>${matiere.matiere_nom}</td>
                    <td>${matiere.coefficient}</td>
                    <td>${matiere.note.toFixed(2)} / ${matiere.note_sur}</td>
                    <td>${matiere.appreciation}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <h3>Informations générales</h3>
            <table class="table">
              <tr>
                <td><strong>Moyenne générale:</strong></td>
                <td>${releve.moyenne_generale.toFixed(2)} / 20</td>
              </tr>
              <tr>
                <td><strong>Rang:</strong></td>
                <td>${releve.rang}${releve.rang === 1 ? 'er' : 'ème'}</td>
              </tr>
              <tr>
                <td><strong>Mention:</strong></td>
                <td><span class="badge badge-success">${releve.mention}</span></td>
              </tr>
              <tr>
                <td><strong>Statut:</strong></td>
                <td><span class="badge ${releve.statut === 'finalise' ? 'badge-success' : 'badge-warning'}">${releve.statut}</span></td>
              </tr>
              <tr>
                <td><strong>Email envoyé:</strong></td>
                <td>${releve.email_envoye ? 'Oui' : 'Non'}</td>
              </tr>
              <tr>
                <td><strong>Date de génération:</strong></td>
                <td>${new Date(releve.date_generation).toLocaleString('fr-FR')}</td>
              </tr>
            </table>
            
            <h3>Appréciation générale</h3>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
              ${releve.appreciation_generale}
            </div>
          </div>
        </body>
        </html>
      `;
      
      modalDetails.document.write(html);
      modalDetails.document.close();
    }
  };

  // ========== FONCTIONS UTILITAIRES ==========
  const obtenirCouleurNote = (note: number): string => {
    if (note >= 16) return '#10B981';
    if (note >= 14) return '#3B82F6';
    if (note >= 12) return '#8B5CF6';
    if (note >= 10) return '#F59E0B';
    if (note >= 8) return '#EF4444';
    return '#DC2626';
  };

  const getClasseNote = (note: number | string): string => {
    const noteNumber = convertirEnNombre(note);
    
    if (noteNumber >= 16) return 'excellent';
    if (noteNumber >= 14) return 'tres-bien';
    if (noteNumber >= 12) return 'bien';
    if (noteNumber >= 10) return 'assez-bien';
    if (noteNumber >= 8) return 'passable';
    return 'insuffisant';
  };

  const getClasseMention = (mention: string): string => {
    const mentionMap: Record<string, string> = {
      'Félicitations': 'felicitations',
      'Très bien': 'tres-bien',
      'Bien': 'bien',
      'Assez bien': 'assez-bien',
      'Passable': 'passable',
      'Insuffisant': 'insuffisant'
    };
    return mentionMap[mention] || '';
  };

  const formaterNomClasse = (classe: ClassePrimaire): string => {
    if (!classe) return '';
    return classe.nom.trim() ? `${classe.niveau} ${classe.nom}` : classe.niveau;
  };

  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const supprimerPeriode = async () => {
    if (!periodeASupprimer) return;
    
    try {
      // Vérifier d'abord si la période peut être supprimée
      const responseVerification = await fetch(`/api/periodes-primaires/${periodeASupprimer.id}/check-delete`);
      
      if (responseVerification.ok) {
        const verificationData = await responseVerification.json();
        
        if (!verificationData.can_be_deleted) {
          // Si la période ne peut pas être supprimée, afficher un message
          ajouterToast('error', 
            verificationData.error || 
            'Impossible de supprimer cette période (données liées ou période courante)'
          );
          setPeriodeASupprimer(null);
          return;
        }
      }
      
      // Si on arrive ici, la suppression est autorisée
      const response = await fetch(`/api/periodes-primaires/${periodeASupprimer.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        ajouterToast('success', 'Période supprimée avec succès');
        setPeriodeASupprimer(null);
        chargerDonneesInitiales();
      } else {
        ajouterToast('error', data.error || 'Erreur lors de la suppression');
      }
    } catch (error: any) {
      console.error('Erreur suppression période:', error);
      ajouterToast('error', 'Erreur lors de la suppression de la période');
    }
  };

  // ========== GESTION DES PÉRIODES ==========
  const ouvrirModalPeriode = (periode?: PeriodePrimaire) => {
    if (periode) {
      setPeriodeAModifier(periode);
      
      let dateDebut = '';
      let dateFin = '';
      
      try {
        if (periode.date_debut) {
          const dateD = new Date(periode.date_debut);
          if (!isNaN(dateD.getTime())) {
            dateDebut = dateD.toISOString().split('T')[0];
          }
        }
        
        if (periode.date_fin) {
          const dateF = new Date(periode.date_fin);
          if (!isNaN(dateF.getTime())) {
            dateFin = dateF.toISOString().split('T')[0];
          }
        }
      } catch (error) {
        console.error('Erreur parsing dates période:', error);
      }
      
      setFormPeriode({
        nom: periode.nom,
        code_periode: periode.code_periode,
        annee_scolaire: periode.annee_scolaire,
        date_debut: dateDebut || '',
        date_fin: dateFin || '',
        type_periode: periode.type_periode as any,
        numero: periode.numero,
        est_periode_courante: periode.est_periode_courante,
        statut: periode.statut as any
      });
    } else {
      const anneeCourante = new Date().getFullYear();
      setPeriodeAModifier(null);
      setFormPeriode({
        nom: '',
        code_periode: '',
        annee_scolaire: `${anneeCourante}-${anneeCourante + 1}`,
        date_debut: '',
        date_fin: '',
        type_periode: 'trimestre',
        numero: 1,
        est_periode_courante: false,
        statut: 'active'
      });
    }
    setModalPeriodeOuvert(true);
  };

  const fermerModalPeriode = () => {
    setModalPeriodeOuvert(false);
    setPeriodeAModifier(null);
  };

  const sauvegarderPeriode = async () => {
    try {
      if (!formPeriode.nom.trim()) {
        ajouterToast('error', 'Le nom de la période est requis');
        return;
      }
      
      if (!formPeriode.date_debut || !formPeriode.date_fin) {
        ajouterToast('error', 'Les dates de début et fin sont requises');
        return;
      }

      const url = periodeAModifier 
        ? `/api/periodes-primaires/${periodeAModifier.id}`
        : '/api/periodes-primaires';
      
      const method = periodeAModifier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(periodeAModifier ? { ...formPeriode, id: periodeAModifier.id } : formPeriode)
      });

      const data = await response.json();
      if (data.success) {
        ajouterToast('success', periodeAModifier 
          ? 'Période modifiée avec succès' 
          : 'Période primaire créée avec succès'
        );
        fermerModalPeriode();
        chargerDonneesInitiales();
      } else {
        ajouterToast('error', data.error || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      console.error('Erreur opération période primaire:', error);
      ajouterToast('error', 'Erreur lors de l\'opération');
    }
  };

  // ========== GESTION DES COMPOSITIONS ==========
  const ouvrirModalComposition = (composition?: CompositionPrimaire) => {
    if (composition) {
      console.log('🔧 Ouverture MODIFICATION composition:', composition);
      setCompositionAModifier(composition);
      
      let formattedDate = '';
      try {
        if (composition.date_composition) {
          const date = new Date(composition.date_composition);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0];
          }
        }
      } catch (error) {
        console.error('Erreur parsing date:', error);
      }
      
      setFormComposition({
        titre: composition.titre || '',
        classe_id: composition.classe_id || 0,
        classe_nom: composition.classe_nom || '',
        classe_niveau: composition.classe_niveau || '',
        date_composition: formattedDate || new Date().toISOString().split('T')[0],
        periode_id: composition.periode_id || 0,
        periode_nom: composition.periode_nom || '',
        annee_scolaire: composition.annee_scolaire || '',
        statut: composition.statut || 'a_venir'
      });
    } else {
      console.log('➕ Ouverture NOUVELLE composition');
      const anneeCourante = new Date().getFullYear();
      const classe = classes.find(c => c.id === classeSelectionnee);
      const periode = periodes.find(p => p.id === periodeSelectionnee);
      
      setCompositionAModifier(null);
      
      const nomClasseAffiche = classe 
        ? (classe.nom.trim() ? `${classe.niveau} ${classe.nom}` : classe.niveau)
        : '';
      
      setFormComposition({
        titre: `${periode?.nom || 'Période'} - ${new Date().toLocaleDateString('fr-FR')}`,
        classe_id: classeSelectionnee || 0,
        classe_nom: nomClasseAffiche,
        classe_niveau: classe?.niveau || '',
        date_composition: new Date().toISOString().split('T')[0],
        periode_id: periodeSelectionnee || 0,
        periode_nom: periode?.nom || '',
        annee_scolaire: periode?.annee_scolaire || `${anneeCourante}-${anneeCourante + 1}`,
        statut: 'a_venir'
      });
    }
    setModalCompositionOuvert(true);
  };

  const fermerModalComposition = () => {
    console.log('❌ Fermeture modal composition');
    setModalCompositionOuvert(false);
    setTimeout(() => {
      setCompositionAModifier(null);
      setFormComposition({
        titre: '',
        classe_id: 0,
        classe_nom: '',
        classe_niveau: '',
        date_composition: new Date().toISOString().split('T')[0],
        periode_id: 0,
        periode_nom: '',
        annee_scolaire: '',
        statut: 'a_venir'
      });
    }, 300);
  };

  const sauvegarderComposition = async () => {
    if (!formComposition.titre.trim()) {
      ajouterToast('error', 'Le titre est requis');
      return;
    }
    if (formComposition.classe_id === 0) {
      ajouterToast('error', 'Veuillez sélectionner une classe');
      return;
    }
    if (formComposition.periode_id === 0) {
      ajouterToast('error', 'Veuillez sélectionner une période');
      return;
    }

    try {
      const compositionData = {
        ...formComposition,
        instituteur_id: instituteur?.id || utilisateur?.id || 0,
        instituteur_nom: instituteur?.nom_complet || `${utilisateur?.prenom} ${utilisateur?.nom}` || 'Inconnu'
      };

      const url = compositionAModifier 
        ? `/api/compositions-primaires/${compositionAModifier.id}`
        : '/api/compositions-primaires';
      
      const method = compositionAModifier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(compositionData)
      });

      const data = await response.json();
      if (data.success) {
        ajouterToast('success', compositionAModifier 
          ? 'Composition modifiée avec succès' 
          : 'Composition créée avec succès'
        );
        fermerModalComposition();
        chargerCompositions();
        
        if (!compositionAModifier && data.composition) {
          setCompositionSelectionnee(data.composition.id);
          setOngletActif('saisie');
        }
      } else {
        ajouterToast('error', data.error || 'Erreur lors de l\'opération');
      }
    } catch (error) {
      console.error('Erreur opération composition:', error);
      ajouterToast('error', 'Erreur lors de l\'opération');
    }
  };

  const supprimerComposition = async () => {
    if (!compositionASupprimer) return;
    
    try {
      const confirmSuppression = window.confirm(
        `Êtes-vous sûr de vouloir supprimer la composition "${compositionASupprimer.titre}" ?\n\n` +
        `⚠️ ATTENTION : Cette action supprimera également :\n` +
        `• Toutes les notes associées à cette composition\n` +
        `• Tous les relevés générés à partir de cette composition\n` +
        `\nCette action est IRREVERSIBLE !`
      );
      
      if (!confirmSuppression) {
        setCompositionASupprimer(null);
        return;
      }

      const response = await fetch(`/api/compositions-primaires/${compositionASupprimer.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (data.success) {
        ajouterToast('success', data.message || 'Composition supprimée avec succès');
        
        if (compositionSelectionnee === compositionASupprimer.id) {
          setCompositionSelectionnee(0);
          setOngletActif('compositions');
          setNotes([]);
          setNotesSaisie({});
        }
        
        chargerCompositions();
        
        setCompositionASupprimer(null);
      } else {
        ajouterToast('error', data.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression composition:', error);
      ajouterToast('error', 'Erreur lors de la suppression de la composition');
      setCompositionASupprimer(null);
    }
  };

  // Fonction pour calculer la moyenne générale de la classe
  const calculerMoyenneGeneraleClasse = (): number => {
    if (eleves.length === 0) return 0;
    
    // Récupérer tous les relevés de la classe
    const relevesClasse = releves.filter(r => 
      r.classe_id === classeSelectionnee
    );
    
    if (relevesClasse.length === 0) return 0;
    
    const sommeMoyennes = relevesClasse.reduce((total, releve) => {
      const moyenne = parseFloat(releve.moyenne_generale.toString()) || 0;
      return total + moyenne;
    }, 0);
    
    return parseFloat((sommeMoyennes / relevesClasse.length).toFixed(2));
  };

  const calculerEtMettreAJourMoyenneClasse = () => {
    if (eleves.length === 0 || releves.length === 0) {
      setMoyenneClasse(0);
      return;
    }
    
    // Filtrer les relevés de la classe actuelle
    const relevésClasseActuelle = releves.filter(r => r.classe_id === classeSelectionnee);
    
    if (relevésClasseActuelle.length === 0) {
      setMoyenneClasse(0);
      return;
    }
    
    const sommeMoyennes = relevésClasseActuelle.reduce((total, r) => {
      return total + (parseFloat(r.moyenne_generale.toString()) || 0);
    }, 0);
    
    const moyenne = parseFloat((sommeMoyennes / relevésClasseActuelle.length).toFixed(2));
    setMoyenneClasse(moyenne);
  };

  // Appelez cette fonction quand les relevés changent
  useEffect(() => {
    calculerEtMettreAJourMoyenneClasse();
  }, [releves, classeSelectionnee]);

  // OU si vous voulez calculer sur tous les élèves (même ceux sans relevé)
  const calculerMoyenneTousEleves = (): number => {
    if (eleves.length === 0) return 0;
    
    let sommeMoyennes = 0;
    let elevesAvecMoyennes = 0;
    
    eleves.forEach(eleve => {
      const releveEleve = releves.find(r => r.eleve_id === eleve.id);
      if (releveEleve) {
        sommeMoyennes += parseFloat(releveEleve.moyenne_generale.toString()) || 0;
        elevesAvecMoyennes++;
      }
    });
    
    if (elevesAvecMoyennes === 0) return 0;
    return parseFloat((sommeMoyennes / elevesAvecMoyennes).toFixed(2));
  };

  // ========== FONCTIONS POUR LES RELEVÉS ==========
  const calculerMoyennePonderee = (matieres: Array<{note: number, coefficient: number}>): number => {
    let totalNotes = 0;
    let totalCoefficients = 0;
    
    matieres.forEach(matiere => {
      const note = matiere.note || 0;
      const coefficient = matiere.coefficient || 1;
      totalNotes += note * coefficient;
      totalCoefficients += coefficient;
    });
    
    if (totalCoefficients === 0) return 0;
    return totalNotes / totalCoefficients;
  };

  const calculerRangsEleves = (elevesAvecMoyennes: Array<{eleve_id: number, moyenne: number}>): Record<number, number> => {
  // Trier par moyenne décroissante
  const elevesTries = [...elevesAvecMoyennes].sort((a, b) => {
    // Tri précis (3 décimales)
    const diff = b.moyenne - a.moyenne;
    if (Math.abs(diff) < 0.001) return 0;
    return diff > 0 ? 1 : -1;
  });
  
  const rangs: Record<number, number> = {};
  let rangActuel = 1;
  let moyennePrecedente: number | null = null;
  
  for (let i = 0; i < elevesTries.length; i++) {
    const eleve = elevesTries[i];
    const moyenneArrondie = Math.round(eleve.moyenne * 100) / 100; // Arrondi à 2 décimales
    
    if (moyennePrecedente === null) {
      // Premier élève
      rangs[eleve.eleve_id] = 1;
      moyennePrecedente = moyenneArrondie;
    } else {
      // Comparer avec la moyenne précédente
      if (Math.abs(moyenneArrondie - moyennePrecedente) < 0.001) {
        // Même moyenne -> même rang
        rangs[eleve.eleve_id] = rangActuel;
      } else {
        // Moyenne différente -> nouveau rang = i + 1
        rangActuel = i + 1;
        rangs[eleve.eleve_id] = rangActuel;
        moyennePrecedente = moyenneArrondie;
      }
    }
  }
  
  return rangs;
};

  const chargerReleves = async () => {
    console.log('🔄 Chargement des relevés...');
    
    if (!compositionSelectionnee) {
      console.log('⚠️ Aucune composition sélectionnée');
      setReleves([]);
      return;
    }
    
    try {
      setChargementReleves(true);
      
      const url = `/api/releves-primaires?composition_id=${compositionSelectionnee}`;
      console.log('🔗 URL:', url);
      
      const response = await fetch(url);
      console.log('📨 Statut réponse:', response.status);
      
      if (!response.ok) {
        console.error(`❌ Erreur HTTP: ${response.status} ${response.statusText}`);
        
        // Essayer une méthode de secours
        try {
          const composition = compositions.find(c => c.id === compositionSelectionnee);
          if (composition) {
            const backupUrl = `/api/releves-primaires?classe_id=${composition.classe_id}&periode_id=${composition.periode_id}`;
            console.log('🔄 Tentative URL de secours:', backupUrl);
            
            const backupResponse = await fetch(backupUrl);
            if (backupResponse.ok) {
              const backupData = await backupResponse.json();
              if (backupData.success) {
                const relevesTries = (backupData.releves || []).sort((a: RelevePrimaire, b: RelevePrimaire) => a.rang - b.rang);
                setReleves(relevesTries);
                console.log(`✅ ${relevesTries.length} relevés chargés (méthode secours)`);
                return;
              }
            }
          }
        } catch (backupError) {
          console.error('❌ Méthode secours échouée:', backupError);
        }
        
        setReleves([]);
        return;
      }
      
      const data = await response.json();
      console.log('📊 Réponse API:', data);
      
      if (data.success) {
        const relevesArray = Array.isArray(data.releves) ? data.releves : [];
        
        const relevesTries = relevesArray.sort((a: RelevePrimaire, b: RelevePrimaire) => a.rang - b.rang);
        setReleves(relevesTries);
        console.log(`✅ ${relevesTries.length} relevés chargés`);
      } else {
        console.error('❌ Erreur dans la réponse:', data.error);
        setReleves([]);
      }
      
    } catch (error: any) {
      console.error('❌ Erreur chargement relevés:', error.message || error);
      setReleves([]);
      ajouterToast('error', 'Erreur chargement relevés');
    } finally {
      setChargementReleves(false);
    }
  };

  // Fonction pour forcer la génération (en cas de problème)
  const forcerGenerationReleves = async () => {
    if (!compositionSelectionnee) {
      ajouterToast('error', 'Veuillez sélectionner une composition');
      return;
    }
    
    const confirmation = window.confirm(
      '⚠️ FORCER LA GÉNÉRATION DES RELEVÉS\n\n' +
      'Cette action va :\n' +
      '1. Supprimer TOUS les relevés existants pour cette composition\n' +
      '2. Générer de nouveaux relevés\n' +
      '3. Ignorer toutes les vérifications\n\n' +
      'Confirmer pour continuer ?'
    );
    
    if (!confirmation) return;
    
    try {
      setChargementReleves(true);
      
      const composition = compositions.find(c => c.id === compositionSelectionnee);
      if (!composition) {
        ajouterToast('error', 'Composition non trouvée');
        return;
      }
      
      // D'abord, supprimer tous les relevés existants
      const deleteUrl = `/api/releves-primaires/force-delete?composition_id=${compositionSelectionnee}`;
      const deleteResponse = await fetch(deleteUrl, { method: 'DELETE' });
      
      if (deleteResponse.ok) {
        ajouterToast('info', 'Anciens relevés supprimés, génération en cours...');
      }
      
      // Appeler la génération normale avec regenere=true
      await genererRelevesTous();
      
    } catch (error: any) {
      console.error('❌ Erreur forcer génération:', error);
      ajouterToast('error', 'Erreur lors de la génération forcée');
    } finally {
      setChargementReleves(false);
    }
  };

  const chargerRelevesParComposition = async (compositionId: number) => {
    try {
      const composition = compositions.find(c => c.id === compositionId);
      if (!composition) return [];
      
      const sql = `
        SELECT * FROM releves_primaire 
        WHERE classe_id = ? AND periode_id = ?
        ORDER BY rang ASC
      `;
      
      const response = await fetch(`/api/direct-query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql,
          params: [composition.classe_id, composition.periode_id]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur chargement secours:', error);
      return [];
    }
  };

  const genererReleveEleve = async (eleve: ElevePrimaire) => {
    if (!compositionSelectionnee) {
      ajouterToast('error', 'Veuillez sélectionner une composition');
      return;
    }
    
    try {
      setGenerationEnCours(prev => ({ ...prev, [eleve.id]: true }));
      setReleveEnCoursGeneration(eleve.id);
      
      const composition = compositions.find(c => c.id === compositionSelectionnee);
      if (!composition) {
        throw new Error('Composition non trouvée');
      }
      
      const responseNotes = await fetch(
        `/api/notes-primaires?composition_id=${compositionSelectionnee}&eleve_id=${eleve.id}`
      );
      
      if (!responseNotes.ok) {
        throw new Error(`Erreur HTTP notes: ${responseNotes.status}`);
      }
      
      const dataNotes = await responseNotes.json();
      if (!dataNotes.success) {
        throw new Error(dataNotes.error || 'Erreur lors de la récupération des notes');
      }
      
      const notesEleve = dataNotes.notes || [];
      
      if (notesEleve.length === 0) {
        ajouterToast('warning', `Aucune note trouvée pour ${eleve.prenom} ${eleve.nom}`);
        return;
      }
      
      const matieresAvecNotes = notesEleve.map((note: any) => ({
        note: parseFloat(note.note) || 0,
        coefficient: parseFloat(note.coefficient) || 1
      }));
      
      const moyenneEleve = calculerMoyennePonderee(matieresAvecNotes);
      
      const elevesAvecMoyennes = [];
      
      for (const eleveClasse of eleves) {
        const responseEleveNotes = await fetch(
          `/api/notes-primaires?composition_id=${compositionSelectionnee}&eleve_id=${eleveClasse.id}`
        );
        
        if (responseEleveNotes.ok) {
          const dataEleveNotes = await responseEleveNotes.json();
          if (dataEleveNotes.success && dataEleveNotes.notes?.length > 0) {
            const notes = dataEleveNotes.notes;
            const matieresNotes = notes.map((note: any) => ({
              note: parseFloat(note.note) || 0,
              coefficient: parseFloat(note.coefficient) || 1
            }));
            const moyenne = calculerMoyennePonderee(matieresNotes);
            
            elevesAvecMoyennes.push({
              eleve_id: eleveClasse.id,
              moyenne: moyenne
            });
          }
        }
      }
      
      const rangs = calculerRangsEleves(elevesAvecMoyennes);
      const rangEleve = rangs[eleve.id] || 0;
      
      const releveData: ReleveData = {
        eleve_id: eleve.id,
        eleve_nom: eleve.nom,
        eleve_prenom: eleve.prenom,
        matricule: eleve.matricule || '',
        classe_nom: composition.classe_nom,
        periode_nom: composition.periode_nom,
        composition_titre: composition.titre,
        date_composition: composition.date_composition,
        matieres: notesEleve.map((note: any) => ({
          matiere_id: note.matiere_id,
          matiere_nom: note.matiere_nom,
          coefficient: parseFloat(note.coefficient) || 1,
          note: parseFloat(note.note) || 0,
          note_sur: parseFloat(note.note_sur) || 20,
          appreciation: genererAppreciationAuto(parseFloat(note.note))
        })),
        moyenne_generale: parseFloat(moyenneEleve.toFixed(2)),
        rang: rangEleve,
        mention: calculerMention(moyenneEleve),
        appreciation_generale: genererAppreciationDetaillee(moyenneEleve)
      };
      
      setReleveAPrevisualiser(releveData);
      setModalPrevisualisationOuvert(true);
      
    } catch (error: any) {
      console.error('Erreur génération relevé:', error);
      ajouterToast('error', `Erreur lors de la génération du relevé: ${error.message}`);
    } finally {
      setGenerationEnCours(prev => ({ ...prev, [eleve.id]: false }));
      setReleveEnCoursGeneration(null);
    }
  };

  const genererRelevesTous = async () => {
  console.log('🚀 Début génération relevés tous');
  
  if (!compositionSelectionnee) {
    console.error('❌ Aucune composition sélectionnée');
    ajouterToast('error', 'Veuillez sélectionner une composition');
    return;
  }
  
  if (eleves.length === 0) {
    console.error('❌ Aucun élève');
    ajouterToast('error', 'Aucun élève dans cette classe');
    return;
  }
  
  const composition = compositions.find(c => c.id === compositionSelectionnee);
  if (!composition) {
    console.error('❌ Composition non trouvée');
    ajouterToast('error', 'Composition non trouvée');
    return;
  }
  
  const confirmation = window.confirm(
    `Générer les relevés pour ${eleves.length} élève(s) ?`
  );
  
  if (!confirmation) return;
  
  try {
    setChargementReleves(true);
    
    console.log('📊 Récupération des notes...');
    const responseNotes = await fetch(
      `/api/notes-primaires?composition_id=${compositionSelectionnee}`
    );
    
    if (!responseNotes.ok) {
      throw new Error(`Erreur HTTP notes: ${responseNotes.status}`);
    }
    
    const dataNotes = await responseNotes.json();
    
    if (!dataNotes.success || !dataNotes.notes || dataNotes.notes.length === 0) {
      throw new Error('Aucune note trouvée pour cette composition');
    }
    
    const toutesNotes = dataNotes.notes;
    
    // Récupérer les coefficients des matières
    const matieresAvecCoef: Record<number, number> = {};
    matieres.forEach(m => {
      matieresAvecCoef[m.id] = m.coefficient || 1;
    });
    
    // Grouper les notes par élève
    const notesParEleve: Record<number, any[]> = {};
    eleves.forEach(eleve => {
      notesParEleve[eleve.id] = toutesNotes.filter((note: any) => note.eleve_id === eleve.id);
    });
    
    // Calculer les moyennes PONDÉRÉES pour chaque élève
    const elevesAvecMoyennes: Array<{eleve_id: number, moyenne: number}> = [];
    
    eleves.forEach(eleve => {
      const notesEleve = notesParEleve[eleve.id] || [];
      
      if (notesEleve.length === 0) return;
      
      let totalPoints = 0;
      let totalCoefficients = 0;
      
      notesEleve.forEach((note: any) => {
        const coefficient = matieresAvecCoef[note.matiere_id] || 1;
        const noteValue = parseFloat(note.note) || 0;
        
        totalPoints += noteValue * coefficient;
        totalCoefficients += coefficient;
      });
      
      if (totalCoefficients > 0) {
        const moyenne = totalPoints / totalCoefficients;
        elevesAvecMoyennes.push({
          eleve_id: eleve.id,
          moyenne: moyenne
        });
        console.log(`📊 ${eleve.prenom} ${eleve.nom}: ${moyenne.toFixed(2)} (total: ${totalPoints}/${totalCoefficients} coefs)`);
      }
    });
    
    // Calculer les rangs avec gestion correcte des égalités
    const rangs = calculerRangsEleves(elevesAvecMoyennes);
    
    // Préparer les relevés
    const relevesASauvegarder = [];
    
    for (const eleve of eleves) {
      const notesEleve = notesParEleve[eleve.id] || [];
      
      if (notesEleve.length === 0) {
        console.log(`⚠️ Aucune note pour ${eleve.prenom} ${eleve.nom}`);
        continue;
      }
      
      // Calculer la moyenne pondérée
      let totalPoints = 0;
      let totalCoefficients = 0;
      
      notesEleve.forEach((note: any) => {
        const coefficient = matieresAvecCoef[note.matiere_id] || 1;
        const noteValue = parseFloat(note.note) || 0;
        totalPoints += noteValue * coefficient;
        totalCoefficients += coefficient;
      });
      
      const moyenne = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;
      const moyenneArrondie = Math.round(moyenne * 100) / 100;
      const rang = rangs[eleve.id] || 0;
      
      // Préparer les données des matières avec notes coefficientées
      const moyennesParMatiere = notesEleve.map((note: any) => {
        const coefficient = matieresAvecCoef[note.matiere_id] || 1;
        const noteValue = parseFloat(note.note) || 0;
        
        return {
          matiere_id: note.matiere_id,
          matiere_nom: note.matiere_nom,
          coefficient: coefficient,
          note: noteValue,
          note_sur: parseFloat(note.note_sur) || 20,
          appreciation: genererAppreciationAuto(noteValue),
          note_coefficientee: (noteValue * coefficient).toFixed(2)
        };
      });
      
      const releveAPersister = {
        eleve_id: eleve.id,
        matricule: eleve.matricule || `ELV${Date.now().toString().slice(-6)}`,
        eleve_nom: eleve.nom,
        eleve_prenom: eleve.prenom,
        classe_id: composition.classe_id,
        classe_nom: composition.classe_nom,
        periode_id: composition.periode_id,
        periode_nom: composition.periode_nom,
        moyennes_par_matiere: JSON.stringify(moyennesParMatiere),
        moyenne_generale: moyenneArrondie,
        rang: rang,
        mention: calculerMention(moyenneArrondie),
        appreciation_generale: genererAppreciationDetaillee(moyenneArrondie),
        date_generation: new Date().toISOString()
      };
      
      console.log(`📄 Relevé ${eleve.prenom} ${eleve.nom}: moyenne ${moyenneArrondie}, rang ${rang}`);
      relevesASauvegarder.push(releveAPersister);
    }
    
    if (relevesASauvegarder.length === 0) {
      throw new Error('Aucun relevé à sauvegarder');
    }
    
    console.log('💾 Sauvegarde des relevés...');
    const response = await fetch('/api/releves-primaires/masse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        releves: relevesASauvegarder,
        composition_id: compositionSelectionnee
      })
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Génération réussie !');
      ajouterToast('success', `${relevesASauvegarder.length} relevés générés avec succès !`);
      
      // Recharger les relevés
      await chargerReleves();
    } else {
      throw new Error(data.error || 'Erreur API');
    }
    
  } catch (error: any) {
    console.error('❌ ERREUR génération:', error);
    ajouterToast('error', `Erreur: ${error.message}`);
  } finally {
    setChargementReleves(false);
  }
};

  const reinitialiserEtGenerer = async () => {
    if (!compositionSelectionnee) {
      ajouterToast('error', 'Sélectionnez une composition');
      return;
    }
    
    const confirmation = window.confirm(
      '🚨 RÉINITIALISATION COMPLÈTE\n\n' +
      'Cette action va:\n' +
      '1. Supprimer TOUS les relevés existants\n' +
      '2. Générer de nouveaux relevés\n' +
      '3. Ignorer toutes les vérifications\n\n' +
      'Êtes-vous ABSOLUMENT sûr ?'
    );
    
    if (!confirmation) return;
    
    try {
      setChargementReleves(true);
      
      const composition = compositions.find(c => c.id === compositionSelectionnee);
      if (composition) {
        const response = await fetch(`/api/releves-primaires/nettoyer?classe_id=${composition.classe_id}&periode_id=${composition.periode_id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          console.log('✅ Table nettoyée');
        }
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await genererRelevesTous();
      
    } catch (error) {
      console.error('❌ Erreur réinitialisation:', error);
      ajouterToast('error', 'Erreur réinitialisation');
    } finally {
      setChargementReleves(false);
    }
  };

  const telechargerReleve = (releveData: ReleveData) => {
    const moyenneClasse = calculerMoyenneGeneraleClasse();
    
    const matieresAvecNotesCoefficientees = releveData.matieres.map(matiere => ({
      ...matiere,
      note_coefficientee: (matiere.note * matiere.coefficient).toFixed(2)
    }));
    
    const totalNotesCoefficientees = matieresAvecNotesCoefficientees
      .reduce((total, matiere) => total + parseFloat(matiere.note_coefficientee || '0'), 0);
    
    const dateImpression = formaterDate(new Date());
    const heureImpression = formaterHeure(new Date());
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relevé de notes - ${releveData.eleve_prenom} ${releveData.eleve_nom}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
          }
          .releve-container {
            border: 2px solid #000;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .entete-ecole {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
          }
          .nom-ecole {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          .adresse-ecole {
            font-size: 14px;
            color: #555;
            margin-bottom: 5px;
          }
          .infos-eleve {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border: 1px solid #ddd;
            padding: 15px;
            border-radius: 5px;
          }
          .section-eleve, .section-scolaire {
            flex: 1;
          }
          .section-titre {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 16px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .info-ligne {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 14px;
          }
          .info-label {
            font-weight: bold;
            color: #555;
          }
          .info-valeur {
            color: #000;
          }
          .tableau-notes th:nth-child(4),
          .tableau-notes td:nth-child(4) {
            width: 15%;
            font-weight: bold;
          }
          .total-coefficientee {
            margin: 10px 0;
            padding: 8px;
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            border-radius: 4px;
            text-align: right;
            font-weight: bold;
          }
          .tableau-notes {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .tableau-notes th {
            background-color: #f8f9fa;
            border: 1px solid #ddd;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            color: #2c3e50;
          }
          .tableau-notes td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: center;
          }
          .note-excellente { color: #27ae60; font-weight: bold; }
          .note-tres-bien { color: #2980b9; font-weight: bold; }
          .note-bien { color: #8e44ad; }
          .note-passable { color: #f39c12; }
          .note-insuffisante { color: #e74c3c; }
          .totaux {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
            padding-top: 20px;
            border-top: 2px solid #000;
          }
          .moyenne-generale {
            text-align: center;
            flex: 1;
          }
          .moyenne-valeur {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
          }
          .rang-mention {
            text-align: center;
            flex: 1;
          }
          .mention {
            font-size: 20px;
            font-weight: bold;
            color: #27ae60;
            margin-top: 10px;
          }
          .moyenne-classe-section {
            text-align: center;
            margin: 15px 0;
            padding: 12px;
            background-color: #e6f7ff;
            border: 1px solid #91d5ff;
            border-radius: 6px;
          }
          .moyenne-classe-label {
            font-weight: bold;
            color: #0050b3;
            font-size: 14px;
          }
          .moyenne-classe-valeur {
            font-size: 22px;
            font-weight: bold;
            color: #003a8c;
            margin: 5px 0;
          }
          .appreciation {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
            border-left: 4px solid #3498db;
          }
          .appreciation-titre {
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #000;
          }
          .signature {
            text-align: center;
            flex: 1;
          }
          .ligne-signature {
            margin-top: 40px;
            border-top: 1px solid #000;
            width: 200px;
            display: inline-block;
          }
          .date-generation {
            text-align: right;
            font-size: 12px;
            color: #777;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="releve-container">
          <div class="entete-ecole">
            <div class="nom-ecole">${parametresEcole?.nom_ecole || 'ÉCOLE PRIMAIRE'}</div>
            <div class="adresse-ecole">${parametresEcole?.adresse || 'Adresse non définie'}</div>
            <div class="adresse-ecole">Tél: ${parametresEcole?.telephone || ''} - Email: ${parametresEcole?.email || ''}</div>
          </div>
          
          <div class="infos-eleve">
            <div class="section-eleve">
              <div class="section-titre">SECTION ÉLÈVE</div>
              <div class="info-ligne">
                <span class="info-label">Nom et Prénom:</span>
                <span class="info-valeur">${releveData.eleve_nom} ${releveData.eleve_prenom}</span>
              </div>
              <div class="info-ligne">
                <span class="info-label">Sexe:</span>
                <span class="info-valeur">${eleves.find(e => e.id === releveData.eleve_id)?.genre === 'M' ? 'Masculin' : 'Féminin'}</span>
              </div>
            </div>
            
            <div class="section-scolaire">
              <div class="section-titre">SECTION SCOLAIRE</div>
              <div class="info-ligne">
                <span class="info-label">Classe:</span>
                <span class="info-valeur">${releveData.classe_nom}</span>
              </div>
              <div class="info-ligne">
                <span class="info-label">Matricule:</span>
                <span class="info-valeur">${releveData.matricule || 'N/A'}</span>
              </div>
              <div class="info-ligne">
                <span class="info-label">Effectif classe:</span>
                <span class="info-valeur">${eleves.length} élèves</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <h3>${releveData.composition_titre}</h3>
            <div style="color: #777;">
              Date de la composition: ${formaterDate(releveData.date_composition)}
            </div>
          </div>
          
          <table class="tableau-notes">
            <thead>
              <tr>
                <th>Matières</th>
                <th>Coefficients</th>
                <th>Notes</th>
                <th>Notes Coéf.</th>
                <th>Sur</th>
                <th>Appréciations</th>
              </tr>
            </thead>
            <tbody>
              ${matieresAvecNotesCoefficientees.map(matiere => {
                const classeNote = getClasseNote(matiere.note);
                return `
                  <tr>
                    <td>${matiere.matiere_nom}</td>
                    <td>${matiere.coefficient}</td>
                    <td class="note-${classeNote}">
                      ${matiere.note.toFixed(2)}
                    </td>
                    <td style="font-weight: bold; color: #2c3e50;">
                      ${matiere.note_coefficientee}
                    </td>
                    <td>${matiere.note_sur}</td>
                    <td>${matiere.appreciation}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="total-coefficientee">
            Total des notes coéfficientées: ${totalNotesCoefficientees.toFixed(2)}
          </div>
          
          <div class="totaux">
            <div class="moyenne-generale">
              <div>MOYENNE GÉNÉRALE</div>
              <div class="moyenne-valeur">${releveData.moyenne_generale.toFixed(2)} / 20</div>
            </div>
            
            <div class="rang-mention">
              <div>RANG: ${releveData.rang}${releveData.rang === 1 ? 'er' : 'ème'} / ${eleves.length}</div>
              <div class="mention">${releveData.mention.toUpperCase()}</div>
            </div>
          </div>
          
          <div class="moyenne-classe-section">
            <div class="moyenne-classe-label">MOYENNE GÉNÉRALE DE LA CLASSE</div>
            <div class="moyenne-classe-valeur">${moyenneClasse.toFixed(2)} / 20</div>
          </div>
          
          <div class="appreciation">
            <div class="appreciation-titre">APPRÉCIATION GÉNÉRALE</div>
            <div>${releveData.appreciation_generale}</div>
          </div>
          
          <div class="signatures">
            <div class="signature">
              <div>Le Directeur</div>
              <div class="ligne-signature"></div>
            </div>
            <div class="signature">
              <div>L'Instituteur</div>
              <div class="ligne-signature"></div>
            </div>
          </div>
          
          <div class="date-generation">
            Généré le ${dateImpression} à ${heureImpression}
          </div>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relevé_${releveData.eleve_nom}_${releveData.eleve_prenom}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    ajouterToast('success', 'Relevé téléchargé avec succès');
  };

  const afficherRelevesComposition = async () => {
    console.log('🔄 Affichage relevés composition:', compositionSelectionnee);
    
    if (!compositionSelectionnee) {
      ajouterToast('warning', 'Veuillez sélectionner une composition d\'abord');
      return;
    }
    
    try {
      setChargementReleves(true);
      
      const url = `/api/releves-primaires?composition_id=${compositionSelectionnee}`;
      console.log('🔗 URL:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.releves && Array.isArray(data.releves)) {
        if (data.releves.length === 0) {
          ajouterToast('warning', 'Aucun relevé généré pour cette composition');
          return;
        }
        
        const composition = compositions.find(c => c.id === compositionSelectionnee);
        
        const relevesFormates: RelevePourAffichage[] = data.releves.map((releve: any) => {
          let moyennesParsed = [];
          try {
            if (releve.moyennes_par_matiere && typeof releve.moyennes_par_matiere === 'string') {
              moyennesParsed = JSON.parse(releve.moyennes_par_matiere);
            } else if (Array.isArray(releve.moyennes_par_matiere)) {
              moyennesParsed = releve.moyennes_par_matiere;
            }
          } catch (error) {
            console.error('Erreur parsing moyennes:', error);
            moyennesParsed = [];
          }
          
          return {
            id: releve.id,
            eleve_id: releve.eleve_id,
            matricule: releve.matricule || 'N/A',
            eleve_nom: releve.eleve_nom || 'Inconnu',
            eleve_prenom: releve.eleve_prenom || '',
            classe_nom: releve.classe_nom || 'Non spécifiée',
            periode_nom: releve.periode_nom || 'Non spécifiée',
            moyenne_generale: parseFloat(releve.moyenne_generale) || 0,
            rang: parseInt(releve.rang) || 0,
            mention: releve.mention || 'Non spécifiée',
            appreciation_generale: releve.appreciation_generale || '',
            date_generation: releve.date_generation || new Date().toISOString(),
            statut: releve.statut || 'brouillon',
            email_envoye: Boolean(releve.email_envoye),
            date_envoi_email: releve.date_envoi_email || null,
            moyennes_par_matiere: moyennesParsed,
            composition_titre: composition?.titre || 'Composition'
          };
        });
        
        console.log(`✅ ${relevesFormates.length} relevés de composition formatés`);
        
        setTousRelevesAffiches(relevesFormates);
        setModalTousRelevesOuvert(true);
        
      } else {
        throw new Error(data.error || 'Format de réponse invalide');
      }
      
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      ajouterToast('error', `Erreur: ${error.message}`);
    } finally {
      setChargementReleves(false);
    }
  };

  // Fonction pour ouvrir une vue détaillée d'un relevé
  const ouvrirVueDetaillee = (releve: RelevePourAffichage) => {
    const releveDetail: ReleveData = {
      eleve_id: releve.eleve_id,
      eleve_nom: releve.eleve_nom,
      eleve_prenom: releve.eleve_prenom,
      matricule: releve.matricule || '',
      classe_nom: releve.classe_nom,
      periode_nom: releve.periode_nom,
      composition_titre: releve.composition_titre || 'Composition',
      date_composition: compositions.find(c => c.id === compositionSelectionnee)?.date_composition || '',
      matieres: releve.moyennes_par_matiere,
      moyenne_generale: releve.moyenne_generale,
      rang: releve.rang,
      mention: releve.mention,
      appreciation_generale: releve.appreciation_generale
    };
    
    setReleveAPrevisualiser(releveDetail);
    setModalTousRelevesOuvert(false);
    setModalPrevisualisationOuvert(true);
  };

  // Fonction pour générer un rapport complet
  const genererRapportComplet = (tousReleves: RelevePourAffichage[]) => {
    if (tousReleves.length === 0) {
      ajouterToast('warning', 'Aucun relevé à exporter');
      return;
    }
    
    const dateGeneration = new Date().toLocaleDateString('fr-FR');
    const heureGeneration = new Date().toLocaleTimeString('fr-FR');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Rapport complet des relevés - ${dateGeneration}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .rapport-header { text-align: center; margin-bottom: 30px; }
          .rapport-header h1 { color: #2c3e50; margin: 0; }
          .rapport-infos { display: flex; justify-content: space-between; margin-top: 10px; }
          .table-rapport { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table-rapport th { background-color: #f8f9fa; border: 1px solid #ddd; padding: 12px; text-align: left; }
          .table-rapport td { border: 1px solid #ddd; padding: 10px; }
          .statistiques { margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
          .stat-card { background: white; padding: 15px; border-radius: 5px; text-align: center; }
          .stat-valeur { font-size: 24px; font-weight: bold; color: #2c3e50; }
          .stat-label { color: #666; margin-top: 5px; }
          .page-break { page-break-after: always; }
          .signature { margin-top: 50px; text-align: center; }
          .signature-line { width: 200px; border-top: 1px solid #000; margin: 0 auto; }
        </style>
      </head>
      <body>
        <div class="rapport-header">
          <h1>Rapport complet des relevés de notes</h1>
          <h3>${parametresEcole?.nom_ecole || 'École Primaire'}</h3>
          <div class="rapport-infos">
            <div>Date du rapport: ${dateGeneration}</div>
            <div>Heure: ${heureGeneration}</div>
            <div>Total: ${tousReleves.length} relevés</div>
          </div>
        </div>
        
        <table class="table-rapport">
          <thead>
            <tr>
              <th>ID</th>
              <th>Élève</th>
              <th>Classe</th>
              <th>Période</th>
              <th>Moyenne</th>
              <th>Rang</th>
              <th>Mention</th>
              <th>Date Génération</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            ${tousReleves.map((releve, index) => `
              <tr>
                <td>${releve.id || index + 1}</td>
                <td>${releve.eleve_prenom} ${releve.eleve_nom}</td>
                <td>${releve.classe_nom}</td>
                <td>${releve.periode_nom}</td>
                <td>${releve.moyenne_generale.toFixed(2)}</td>
                <td>${releve.rang}${releve.rang === 1 ? 'er' : 'ème'}</td>
                <td>${releve.mention}</td>
                <td>${releve.date_generation ? formaterDate(releve.date_generation) : '-'}</td>
                <td>${releve.statut || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="statistiques">
          <h3>Statistiques du rapport</h3>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-valeur">${tousReleves.length}</div>
              <div class="stat-label">Total relevés</div>
            </div>
            <div class="stat-card">
              <div class="stat-valeur">${tousReleves.filter(r => r.moyenne_generale >= 10).length}</div>
              <div class="stat-label">Élèves admis</div>
            </div>
            <div class="stat-card">
              <div class="stat-valeur">${(tousReleves.reduce((acc, r) => acc + r.moyenne_generale, 0) / (tousReleves.length || 1)).toFixed(2)}</div>
              <div class="stat-label">Moyenne générale</div>
            </div>
            <div class="stat-card">
              <div class="stat-valeur">${new Set(tousReleves.map(r => r.classe_nom)).size}</div>
              <div class="stat-label">Classes différentes</div>
            </div>
          </div>
        </div>
        
        <div class="signature">
          <p>Le Directeur</p>
          <div class="signature-line"></div>
          <p style="margin-top: 40px;">Date et cachet</p>
        </div>
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rapport_complet_relevés_${dateGeneration.replace(/\//g, '-')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
    ajouterToast('success', 'Rapport complet généré');
  };

  const genererResumeReleves = (relevesData: ReleveData[]) => {
    const entetes = [
      'Rang',
      'Nom',
      'Prénom',
      'Matricule',
      'Moyenne Générale',
      'Mention',
      'Nombre de matières',
      'Date génération'
    ];
    
    const lignes = relevesData.map(releve => [
      releve.rang + (releve.rang === 1 ? 'er' : 'ème'),
      releve.eleve_nom,
      releve.eleve_prenom,
      releve.matricule || '',
      releve.moyenne_generale.toFixed(2),
      releve.mention,
      releve.matieres.length.toString(),
      formaterDate(new Date())
    ]);
    
    const contenuCSV = [
      entetes.join(','),
      ...lignes.map(ligne => ligne.join(','))
    ].join('\n');
    
    const blob = new Blob([contenuCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Resume_releves_${relevesData[0]?.classe_nom}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    ajouterToast('success', 'Résumé téléchargé au format CSV');
  };

  const genererFichierUnique = (
    tousLesReleves: ReleveData[], 
    composition: CompositionPrimaire,
    classe?: ClassePrimaire,
    periode?: PeriodePrimaire
  ) => {
    if (tousLesReleves.length === 0) {
      ajouterToast('warning', 'Aucun relevé à exporter');
      return;
    }

    const nomClasse = classe ? formaterNomClasse(classe) : composition.classe_nom;
    const dateGeneration = formaterDate(new Date());
    const heureGeneration = formaterHeure(new Date());
    
    const relevésHTML = tousLesReleves.map((releve, index) => {
      const matieresAvecNotesCoefficientees = releve.matieres.map(matiere => ({
        ...matiere,
        note_coefficientee: (matiere.note * matiere.coefficient).toFixed(2)
      }));
      
      const totalNotesCoefficientees = matieresAvecNotesCoefficientees
        .reduce((total, matiere) => total + parseFloat(matiere.note_coefficientee || '0'), 0);
        
      return `
        <div class="releve-container">
          <div class="info-eleve">
            <h3>${releve.eleve_prenom} ${releve.eleve_nom} - Matricule: ${releve.matricule || 'N/A'}</h3>
            <p>Rang: ${releve.rang}${releve.rang === 1 ? 'er' : 'ème'} | Moyenne: ${releve.moyenne_generale.toFixed(2)} | Mention: ${releve.mention}</p>
          </div>
          
          <table class="table-notes">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Coefficient</th>
                <th>Note</th>
                <th>Note Coéfficientée</th>
                <th>Sur</th>
                <th>Appréciation</th>
              </tr>
            </thead>
            <tbody>
              ${matieresAvecNotesCoefficientees.map(matiere => `
                <tr>
                  <td>${matiere.matiere_nom}</td>
                  <td>${matiere.coefficient}</td>
                  <td>${matiere.note.toFixed(2)}</td>
                  <td style="font-weight: bold;">${matiere.note_coefficientee}</td>
                  <td>${matiere.note_sur}</td>
                  <td>${matiere.appreciation}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total-coefficientee">
            Total des notes coéfficientées: ${totalNotesCoefficientees.toFixed(2)}
          </div>
          
          <div class="appreciation">
            <p><strong>Appréciation générale:</strong> ${releve.appreciation_generale}</p>
          </div>
          
          <div class="signatures">
            <div class="signature">
              <p>Le Directeur</p>
              <div style="border-top: 1px solid #000; width: 150px; margin: 0 auto;"></div>
            </div>
            <div class="signature">
              <p>L'Instituteur</p>
              <div style="border-top: 1px solid #000; width: 150px; margin: 0 auto;"></div>
            </div>
          </div>
        </div>
        ${index < tousLesReleves.length - 1 ? '<div class="page-break"></div>' : ''}
      `;
    }).join(''); 
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relevés de notes - ${nomClasse} - ${composition.titre}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .releve-container { border: 1px solid #000; padding: 20px; margin-bottom: 30px; }
          .page-break { page-break-after: always; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { margin: 0; }
          .info-eleve { margin-bottom: 15px; }
          .table-notes { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .table-notes th, .table-notes td { border: 1px solid #ddd; padding: 8px; text-align: center; }
          .table-notes th { background-color: #f5f5f5; }
          .table-notes th:nth-child(4) { width: 15%; }
          .table-notes th:nth-child(5) { width: 15%; }
          .table-notes th:nth-child(6) { width: 15%; }
          .table-notes th:nth-child(7) { width: 20%; }
          .total-coefficientee {
            margin: 10px 0;
            padding: 8px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            text-align: right;
            font-weight: bold;
            font-size: 12px;
          }
          .signatures { display: flex; justify-content: space-between; margin-top: 40px; }
          .signature { text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${parametresEcole?.nom_ecole || 'ÉCOLE PRIMAIRE'}</h1>
          <h2>${composition.titre}</h2>
          <p>Classe: ${nomClasse} | Date: ${dateGeneration} - ${heureGeneration}</p>
        </div>
        
        ${relevésHTML}
      </body>
      </html>
    `;
      
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tous_les_relevés_${nomClasse}_${composition.titre.replace(/[^a-z0-9]/gi, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
    
    ajouterToast('success', 
      `${tousLesReleves.length} relevés générés dans un seul fichier HTML.`
    );
    
    setTimeout(() => {
      const previewWindow = window.open();
      if (previewWindow) {
        const newBlob = new Blob([htmlContent], { type: 'text/html' });
        const newUrl = URL.createObjectURL(newBlob);
        previewWindow.location.href = newUrl;
      }
    }, 500);
  };

  // ========== FONCTION D'IMPRESSION ==========
  const imprimerReleve = (releveData: ReleveData) => {
    const moyenneClasse = calculerMoyenneGeneraleClasse();
    
    const matieresAvecNotesCoefficientees = releveData.matieres.map(matiere => ({
      ...matiere,
      note_coefficientee: (matiere.note * matiere.coefficient).toFixed(2)
    }));
    
    const dateImpression = formaterDate(new Date());
    const heureImpression = formaterHeure(new Date());
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relevé de notes - ${releveData.eleve_prenom} ${releveData.eleve_nom}</title>
        <style>
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-family: 'Times New Roman', Times, serif;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-after: always;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 0;
            font-size: 12px;
            line-height: 1.4;
          }
          
          .releve-container {
            border: 2px solid #000;
            padding: 15px;
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          
          .entete-ecole {
            text-align: center;
            border-bottom: 3px double #000;
            padding-bottom: 10px;
            margin-bottom: 15px;
          }
          
          .nom-ecole {
            font-size: 20px;
            font-weight: bold;
            color: #000;
            margin-bottom: 3px;
            text-transform: uppercase;
          }
          
          .adresse-ecole {
            font-size: 11px;
            color: #000;
            margin-bottom: 2px;
          }
          
          .infos-eleve {
            display: flex;
            justify-content: space-between;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 3px;
          }
          
          .section-eleve, .section-scolaire {
            flex: 1;
          }
          
          .section-titre {
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
            font-size: 12px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 3px;
          }
          
          .info-ligne {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
            font-size: 11px;
          }
          
          .info-label {
            font-weight: bold;
            color: #555;
          }
          
          .info-valeur {
            color: #000;
          }

          .tableau-notes th:nth-child(4) {
            width: 15%;
          }
          
          .tableau-notes th:nth-child(5) {
            width: 15%;
          }
          
          .tableau-notes th:nth-child(6) {
            width: 20%;
          }
          
          .total-coefficientee {
            margin-top: 10px;
            padding: 8px;
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
            text-align: right;
            font-weight: bold;
          }
          
          .total-coefficientee span {
            color: #2c3e50;
          }
          
          .note-excellente { font-weight: bold; }
          .note-tres-bien { font-weight: bold; }
          .note-bien { font-weight: normal; }
          .note-passable { font-style: italic; }
          .note-insuffisante { color: #666; }
          
          .totaux {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 2px solid #000;
          }
          
          .moyenne-generale {
            text-align: center;
            flex: 1;
          }
          
          .moyenne-valeur {
            font-size: 24px;
            font-weight: bold;
            color: #000;
          }
          
          .rang-mention {
            text-align: center;
            flex: 1;
          }
          
          .mention {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-top: 8px;
          }
          
          .moyenne-classe-section {
            text-align: center;
            margin-top: 10px;
            padding: 8px;
            background-color: #f0f9ff;
            border: 1px solid #b3e0ff;
            border-radius: 4px;
          }
          
          .moyenne-classe-label {
            font-weight: bold;
            color: #0066cc;
            font-size: 13px;
          }
          
          .moyenne-classe-valeur {
            font-size: 18px;
            font-weight: bold;
            color: #004080;
          }
          
          .appreciation {
            margin-top: 15px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 3px;
            border-left: 4px solid #333;
          }
          
          .appreciation-titre {
            font-weight: bold;
            margin-bottom: 5px;
            color: #000;
            font-size: 12px;
          }
          
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #000;
          }
          
          .signature {
            text-align: center;
            flex: 1;
          }
          
          .ligne-signature {
            margin-top: 30px;
            border-top: 1px solid #000;
            width: 150px;
            display: inline-block;
          }
          
          .date-generation {
            text-align: right;
            font-size: 10px;
            color: #666;
            margin-top: 15px;
            font-style: italic;
          }
          
          .instructions {
            text-align: center;
            font-size: 10px;
            color: #999;
            margin-top: 5px;
            font-style: italic;
            border-top: 1px dashed #ddd;
            padding-top: 5px;
          }
        </style>
      </head>
      <body>
        <div class="releve-container">
          <div class="entete-ecole">
            <div class="nom-ecole">${parametresEcole?.nom_ecole || 'ÉCOLE PRIMAIRE'}</div>
            <div class="adresse-ecole">${parametresEcole?.adresse || 'Adresse non définie'}</div>
            <div class="adresse-ecole">Tél: ${parametresEcole?.telephone || ''} - Email: ${parametresEcole?.email || ''}</div>
          </div>
          
          <div class="infos-eleve">
            <div class="section-eleve">
              <div class="section-titre">SECTION ÉLÈVE</div>
              <div class="info-ligne">
                <span class="info-label">Nom et Prénom:</span>
                <span class="info-valeur">${releveData.eleve_nom} ${releveData.eleve_prenom}</span>
              </div>
              <div class="info-ligne">
                <span class="info-label">Sexe:</span>
                <span class="info-valeur">${eleves.find(e => e.id === releveData.eleve_id)?.genre === 'M' ? 'Masculin' : 'Féminin'}</span>
              </div>
            </div>
            
            <div class="section-scolaire">
              <div class="section-titre">SECTION SCOLAIRE</div>
              <div class="info-ligne">
                <span class="info-label">Classe:</span>
                <span class="info-valeur">${releveData.classe_nom}</span>
              </div>
              <div class="info-ligne">
                <span class="info-label">Matricule:</span>
                <span class="info-valeur">${releveData.matricule || 'N/A'}</span>
              </div>
              <div class="info-ligne">
                <span class="info-label">Effectif classe:</span>
                <span class="info-valeur">${eleves.length} élèves</span>
              </div>
              <div class="info-ligne">
                <span class="info-label">Redoublant:</span>
                <span class="info-valeur">Non</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center; margin: 15px 0;">
            <h3 style="margin: 0; font-size: 14px;">${releveData.composition_titre}</h3>
            <div style="color: #777; font-size: 11px;">
              Date de la composition: ${formaterDate(releveData.date_composition)}
            </div>
          </div>
          
          <table class="tableau-notes">
            <thead>
              <tr>
                <th>Matières</th>
                <th>Coefficients</th>
                <th>Notes</th>
                <th>Notes Coéf.</th>
                <th>Sur</th>
                <th>Appréciations</th>
              </tr>
            </thead>
            <tbody>
              ${matieresAvecNotesCoefficientees.map(matiere => {
                const classeNote = getClasseNote(matiere.note);
                return `
                  <tr>
                    <td>${matiere.matiere_nom}</td>
                    <td>${matiere.coefficient}</td>
                    <td class="note-${classeNote}">
                      ${matiere.note.toFixed(2)}
                    </td>
                    <td style="font-weight: bold; color: #2c3e50;">
                      ${matiere.note_coefficientee}
                    </td>
                    <td>${matiere.note_sur}</td>
                    <td>${matiere.appreciation}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="total-coefficientee">
            Total des notes coéfficientées: <span>${matieresAvecNotesCoefficientees
              .reduce((total, matiere) => total + parseFloat(matiere.note_coefficientee || '0'), 0)
              .toFixed(2)}</span>
          </div>
          
          <div class="totaux">
            <div class="moyenne-generale">
              <div>MOYENNE GÉNÉRALE</div>
              <div class="moyenne-valeur">${releveData.moyenne_generale.toFixed(2)} / 20</div>
            </div>
            
            <div class="rang-mention">
              <div>RANG: ${releveData.rang}${releveData.rang === 1 ? 'er' : 'ème'} / ${eleves.length}</div>
              <div class="mention">${releveData.mention.toUpperCase()}</div>
            </div>
          </div>
          
          <div class="moyenne-classe-section">
            <div class="moyenne-classe-label">MOYENNE GÉNÉRALE DE LA CLASSE</div>
            <div class="moyenne-classe-valeur">${moyenneClasse.toFixed(2)} / 20</div>
          </div>
          
          <div class="appreciation">
            <div class="appreciation-titre">APPRÉCIATION GÉNÉRALE</div>
            <div>${releveData.appreciation_generale}</div>
          </div>
          
          <div class="signatures">
            <div class="signature">
              <div>Le Directeur</div>
              <div class="ligne-signature"></div>
            </div>
            
            <div class="signature">
              <div>L'Instituteur</div>
              <div class="ligne-signature"></div>
            </div>
          </div>
          
          <div class="date-generation">
            Généré le ${dateImpression} à ${heureImpression}
          </div>
          
          <div class="instructions no-print">
            Pour imprimer: Ctrl+P ou Fichier > Imprimer | Pour fermer: Fermer cet onglet
          </div>
        </div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      };
    }
    
    ajouterToast('info', 'Ouverture de la fenêtre d\'impression...');
  };

  // ========== EFFETS ==========
  useEffect(() => {
    chargerDonneesInitiales();
  }, []);

  useEffect(() => {
    if (classeSelectionnee > 0 && periodeSelectionnee > 0) {
      chargerElevesParClasse(classeSelectionnee);
      chargerCompositions();
      notesInitialiseesRef.current = false;
    }
  }, [classeSelectionnee, periodeSelectionnee]);

  useEffect(() => {
    if (compositionSelectionnee > 0) {
      chargerNotesComposition();
      setOngletActif('saisie');
    }
  }, [compositionSelectionnee]);

  useEffect(() => {
    if (classes.length > 0 && classeSelectionnee === 0) {
      const niveauxPrimaire = [''];
      const classeParDefaut = classes.find(c => niveauxPrimaire.includes(c.niveau));
      setClasseSelectionnee(classeParDefaut?.id || classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (periodes.length > 0 && periodeSelectionnee === 0) {
      const periodeActive = periodes.find(p => p.est_periode_courante);
      setPeriodeSelectionnee(periodeActive?.id || periodes[0].id);
    }
  }, [periodes]);

  useEffect(() => {
    if (compositionSelectionnee > 0) {
      chargerReleves();
    }
  }, [compositionSelectionnee]);

  useEffect(() => {
    if (compositionSelectionnee && ongletActif === 'releves') {
      console.log('🔄 Chargement auto des relevés pour composition:', compositionSelectionnee);
      const timer = setTimeout(() => {
        chargerReleves();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [compositionSelectionnee, ongletActif]);

  useEffect(() => {
    if (releves.length > 0) {
      console.log(`📊 ${releves.length} relevés disponibles`);
    }
  }, [releves]);

  useEffect(() => {
    if (compositionSelectionnee) {
      console.log('🔄 Chargement auto des relevés pour composition:', compositionSelectionnee);
      chargerReleves();
    }
  }, [compositionSelectionnee]);

  // ========== FILTRES ==========
  const compositionsFiltrees = useMemo(() => {
    let filtrees = compositions;
    
    if (classeSelectionnee > 0) {
      filtrees = filtrees.filter(c => c.classe_id === classeSelectionnee);
    }
    
    if (periodeSelectionnee > 0) {
      filtrees = filtrees.filter(c => c.periode_id === periodeSelectionnee);
    }
    
    return filtrees.sort((a, b) => new Date(b.date_composition).getTime() - new Date(a.date_composition).getTime());
  }, [compositions, classeSelectionnee, periodeSelectionnee]);

  // ========== COMPOSANTS MODAUX ==========
  const ModalPrevisualisation = () => {
    if (!releveAPrevisualiser) return null;
    
    const moyenneClasse = calculerMoyenneGeneraleClasse();
    
    const matieresAvecNotesCoefficientees = releveAPrevisualiser.matieres.map(matiere => ({
      ...matiere,
      note_coefficientee: (matiere.note * matiere.coefficient).toFixed(2)
    }));
    
    const totalNotesCoefficientees = matieresAvecNotesCoefficientees
      .reduce((total, matiere) => total + parseFloat(matiere.note_coefficientee || '0'), 0);
      
    return (
      <div className="modal-overlay">
        <div className="modal-previsualisation">
          <div className="en-tete-modal">
            <h2>Prévisualisation du relevé</h2>
            <button 
              className="bouton-fermer-modal" 
              onClick={() => setModalPrevisualisationOuvert(false)}
            >
              ✕
            </button>
          </div>
          
          <div className="contenu-previsualisation">
            <div className="releve-simulation">
              <div className="entete-releve">
                <div className="nom-ecole-releve">
                  {parametresEcole?.nom_ecole || 'ÉCOLE PRIMAIRE'}
                </div>
                <div className="adresse-ecole-releve">
                  {parametresEcole?.adresse || 'Adresse non définie'}
                </div>
              </div>
              
              <div className="infos-eleve-releve">
                <div className="section-infos">
                  <div className="section-titre-releve">SECTION ÉLÈVE</div>
                  <div className="info-item">
                    <span className="info-label">Nom et Prénom:</span>
                    <span className="info-value">
                      {releveAPrevisualiser.eleve_nom} {releveAPrevisualiser.eleve_prenom}
                    </span>
                  </div>
                </div>
                
                <div className="section-infos">
                  <div className="section-titre-releve">SECTION SCOLAIRE</div>
                  <div className="info-item">
                    <span className="info-label">Classe:</span>
                    <span className="info-value">{releveAPrevisualiser.classe_nom}</span>
                  </div>
                </div>
              </div>
              
              <div className="titre-composition-releve">
                <h3>{releveAPrevisualiser.composition_titre}</h3>
              </div>
              
              <table className="tableau-notes-releve">
                <thead>
                  <tr>
                    <th>Matières</th>
                    <th>Coefficients</th>
                    <th>Notes</th>
                    <th>Notes Coéf.</th>
                    <th>Sur</th>
                    <th>Appréciations</th>
                  </tr>
                </thead>
                <tbody>
                  {matieresAvecNotesCoefficientees.map((matiere, index) => (
                    <tr key={index}>
                      <td>{matiere.matiere_nom}</td>
                      <td>{matiere.coefficient}</td>
                      <td className={`note-cell ${getClasseNote(matiere.note)}`}>
                        {matiere.note.toFixed(2)}
                      </td>
                      <td style={{ fontWeight: 'bold', color: '#2c3e50' }}>
                        {matiere.note_coefficientee}
                      </td>
                      <td>{matiere.note_sur}</td>
                      <td>{matiere.appreciation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              <div style={{
                marginTop: '10px',
                padding: '8px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                textAlign: 'right',
                fontWeight: 'bold'
              }}>
                Total des notes coéfficientées: <span style={{ color: '#2c3e50' }}>
                  {totalNotesCoefficientees.toFixed(2)}
                </span>
              </div>
              
              <div className="totaux-releve">
                <div className="moyenne-section">
                  <div className="moyenne-label">MOYENNE GÉNÉRALE</div>
                  <div className="moyenne-valeur">
                    {releveAPrevisualiser.moyenne_generale.toFixed(2)} / 20
                  </div>
                </div>
                
                <div className="rang-section">
                  <div className="rang-label">
                    RANG: {releveAPrevisualiser.rang}
                    {releveAPrevisualiser.rang === 1 ? 'er' : 'ème'} / {eleves.length}
                  </div>
                  <div className="mention-releve">
                    {releveAPrevisualiser.mention.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="moyenne-classe-section" style={{
                textAlign: 'center',
                marginTop: '15px',
                padding: '10px',
                backgroundColor: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: '6px'
              }}>
                <div style={{ fontWeight: 'bold', color: '#0050b3', fontSize: '14px' }}>
                  MOYENNE GÉNÉRALE DE LA CLASSE
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#003a8c', margin: '5px 0' }}>
                  {moyenneClasse.toFixed(2)} / 20
                </div>
              </div>
              
              <div className="appreciation-releve">
                <div className="appreciation-titre">APPRÉCIATION GÉNÉRALE</div>
                <div className="appreciation-contenu">
                  {releveAPrevisualiser.appreciation_generale}
                </div>
              </div>
            </div>
          </div>
          
          <div className="pied-modal">
            <button 
              className="bouton-annuler"
              onClick={() => setModalPrevisualisationOuvert(false)}
            >
              Annuler
            </button>
            <button 
              className="bouton-imprimer"
              onClick={() => {
                imprimerReleve(releveAPrevisualiser);
                setModalPrevisualisationOuvert(false);
              }}
              title="Imprimer le relevé"
            >
              <Printer className="h-4 w-4 inline mr-2" />
              Imprimer
            </button>
            <button 
              className="bouton-telecharger"
              onClick={() => telechargerReleve(releveAPrevisualiser)}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Télécharger
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ========== RENDU ==========
  if (chargement) {
    return (
      <div className="chargement-primaire">
        <div className="spinner-grand"></div>
        <p>Chargement du module primaire...</p>
      </div>
    );
  }

  return (
    <div className={`conteneur-gestion-primaire ${parametresApp?.theme_defaut || 'clair'}`}>
      {/* Section principale */}
      <div className="contenu-principal-primaire">
        {/* Titre principal */}
        <div className="en-tete-fixe-eleves">
        <div className="conteneur-en-tete-fixe-eleves">
          <div className="titre-fixe-eleves">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📝</span> 
              <h1>
                Gestion des notes
              </h1>
            </div>
          </div>

          <div className="actions-fixes-eleves">
             <div className="actions-synchronisation">
              <button 
                    className="bouton-nouvelle-composition"
                    onClick={() => ouvrirModalComposition()}
                    disabled={!classeSelectionnee || !periodeSelectionnee}
                  >
                    <span className="icone-ajouter">+</span>
                    Nouvelle Composition
                    </button>
           <button 
  className="bouton-creer-matiere"
  onClick={ouvrirGestionMatieres}
  title="Gérer les matières"
>
  <span className="icone-ajouter">📚</span>
  Gérer les matières  ({matieres.length})
</button>
          </div>
          </div>
        </div>
      </div>

        {/* Statistiques */}
        <div className="statistiques-primaire">
          <div className="carte-statistique_releve">
            <div className="icone-stat-note">👨‍🎓</div>
            <div className="contenu-stat">
              <div className="valeur-stat-note">{eleves.length}</div>
              <div className="label-stat-note">Élèves</div>
            </div>
          </div>
          
          <div className="carte-statistique_releve">
            <div className="icone-stat-note">📚</div>
            <div className="contenu-stat">
              <div className="valeur-stat-note">{matieres.length}</div>
              <div className="label-stat-note">Matières</div>
            </div>
          </div>
          
          <div className="carte-statistique_releve">
            <div className="icone-stat-note">📝</div>
            <div className="contenu-stat">
              <div className="valeur-stat-note">{compositionsFiltrees.length}</div>
              <div className="label-stat-note">Compositions</div>
            </div>
          </div>
          
          <div className="carte-statistique_releve">
            <div className="icone-stat-note">📄</div>
            <div className="contenu-stat">
              <div className="valeur-stat-note" style={{ color: releves.length > 0 ? '#40c057' : '#868e96' }}>
                {releves.length}
              </div>
              <div className="label-stat-note">
                {releves.length > 0 ? 'Relevés générés' : 'Aucun relevé'}
              </div>
            </div>
          </div>
        </div>

        {/* Section Liste des Périodes */}
        <div className="section-matieres-primaires">
          <div className="en-tete-section-note">
            <h3>📅 Liste des périodes</h3>
          </div>
          
          {periodes.length > 0 ? (
            <div className="liste-matieres">
              {periodes.map(periode => (
                <div key={periode.id} className={`carte-periode ${periode.est_periode_courante ? 'periode-courante' : ''}`}>
                  <div className="info-matiere">
                    <div className="details-matiere">
                      <span className="detail">{periode.nom}</span>
                      <span className="detail">{periode.annee_scolaire}</span>
                      <span className="detail">{periode.type_periode}</span>
                      <span className="detail">
                        {formaterDate(periode.date_debut)} → {formaterDate(periode.date_fin)}
                      </span>
                      {periode.est_periode_courante && (
                        <span className="badge-courante">Période courante</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="actions-matiere">
                    <button 
                      className="bouton-modifier"
                      onClick={() => ouvrirModalPeriode(periode)}
                    >
                      ✏️ 
                    </button>
                    <button 
                      className="bouton-supprimer"
                      onClick={() => {
                        if (!periode.est_periode_courante) {
                          setPeriodeASupprimer(periode);
                        }
                      }}
                      title={periode.est_periode_courante ? "Impossible de supprimer la période courante" : "Supprimer la période"}
                      disabled={periode.est_periode_courante}
                      style={{ 
                        opacity: periode.est_periode_courante ? 0.5 : 1,
                        cursor: periode.est_periode_courante ? 'not-allowed' : 'pointer'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="aucune-periode">
              <p>Aucune période disponible. Ajoutez une période pour commencer.</p>
            </div>
          )}
        </div>

        {/* Navigation par onglets */}
        <div className="navigation-onglets-primaire">
          <button 
            className={`onglet-primaire ${ongletActif === 'compositions' ? 'actif' : ''}`}
            onClick={() => setOngletActif('compositions')}
          >
            📝 Compositions
          </button>
          <button 
            className={`onglet-primaire ${ongletActif === 'saisie' ? 'actif' : ''}`}
            onClick={() => setOngletActif('saisie')}
            disabled={!compositionSelectionnee}
          >
            ✏️ Saisie des notes
          </button>
          <button 
            className={`onglet-primaire ${ongletActif === 'releves' ? 'actif' : ''}`}
            onClick={() => setOngletActif('releves')}
          >
            📄 Relevés de notes
          </button>
        </div>
        
        {/* Filtres */}
        <div className="filtres-primaire">
          <div className="groupe-filtre">
            <label className="label-filtre">Classe</label>
            <select 
              value={classeSelectionnee || 0}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setClasseSelectionnee(value || 0);
                setCompositionSelectionnee(0);
                setOngletActif('compositions');
                notesInitialiseesRef.current = false;
              }}
              className="select-filtre"
            >
              <option value="0">Sélectionnez une classe</option>
              {classes.map(classe => (
                <option key={classe.id} value={classe.id}>
                  {formaterNomClasse(classe)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="groupe-filtre">
            <label className="label-filtre">Période</label>
            <div className="conteneur-select-avec-bouton">
              <select 
                value={periodeSelectionnee || 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setPeriodeSelectionnee(value || 0);
                  setCompositionSelectionnee(0);
                  setOngletActif('compositions');
                  notesInitialiseesRef.current = false;
                }}
                className="select-filtre"
              >
                <option value="0">Sélectionnez une période</option>
                {periodes.map(periode => (
                  <option key={periode.id} value={periode.id}>
                    {periode.nom} - {periode.annee_scolaire}
                    {periode.est_periode_courante ? ' (Période courante)' : ''}
                  </option>
                ))}
              </select>
              <button 
                type="button"
                className="bouton-ajouter-periode"
                onClick={() => ouvrirModalPeriode()}
                title="Ajouter une nouvelle période"
              >
                +
              </button>
            </div>
          </div>
          
          <div className="groupe-filtre">
            <label className="label-filtre">Composition</label>
            <select 
              value={compositionSelectionnee || 0}
              onChange={(e) => {
                const compId = parseInt(e.target.value);
                setCompositionSelectionnee(compId || 0);
                if (compId > 0) {
                  setOngletActif('saisie');
                }
              }}
              className="select-filtre"
              disabled={compositionsFiltrees.length === 0}
            >
              <option value="0">Sélectionnez une composition</option>
              {compositionsFiltrees.map(composition => (
                <option key={composition.id} value={composition.id}>
                  {composition.titre} - {formaterDate(composition.date_composition)}
                  {composition.notes_saisies ? ' ✓' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contenu selon l'onglet actif */}
        <div className="contenu-primaire">
          {ongletActif === 'compositions' && (
            <div className="vue-compositions">
              <div className="en-tete-section-note">
                <h3>Gestion des Compositions</h3>
              </div>
              
              {compositionsFiltrees.length > 0 ? (
                <div className="liste-compositions">
                  {compositionsFiltrees.map(composition => (
                    <div 
                      key={composition.id}
                      className={`carte-composition ${compositionSelectionnee === composition.id ? 'selectionnee' : ''} ${composition.est_supprime ? 'supprimee' : ''}`}
                      onClick={() => {
                        if (!composition.est_supprime) {
                          setCompositionSelectionnee(composition.id);
                          setOngletActif('saisie');
                        }
                      }}
                    >
                      <div className="en-tete-carte-composition">
                        <h4 className="titre-composition">
                          {composition.titre}
                          {composition.est_supprime && (
                            <span className="badge-supprime">SUPPRIMÉE</span>
                          )}
                        </h4>
                      </div>
                      
                      <div className="details-composition">
                        <div className="detail">
                          <div className="badges-composition">
                            <span className={`badge-statut ${composition.statut}`}>
                              {composition.statut}
                            </span>
                            {composition.notes_saisies && (
                              <span className="badge-notes">Notes saisies ✓</span>
                            )}
                            {composition.releves_generes && (
                              <span className="badge-releves">Relevés générés ✓</span>
                            )}
                          </div>
                          <span className="valeur">Classe : <strong> {(() => {
                              const classe = classes.find(c => c.id === composition.classe_id);
                              return classe ? formaterNomClasse(classe) : composition.classe_nom;
                            })()}</strong></span>
                        </div>
                        <div className="detail">
                          <span className="valeur">Date : <strong>{isValidDate(composition.date_composition) 
                              ? formaterDate(composition.date_composition)
                              : 'Date invalide'}</strong></span>
                        </div>
                        <div className="detail">
                          <span className="valeur">Période : <strong>{composition.periode_nom}</strong></span>
                        </div>
                        <div className="detail">
                          <span className="valeur">Instituteur : <strong>{composition.instituteur_nom}</strong></span>
                        </div>
                      </div>
                      
                      <div className="actions-composition">
                        {!composition.est_supprime && (
                          <>
                            <button 
                              className="bouton-note"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompositionSelectionnee(composition.id);
                                setOngletActif('saisie');
                              }}
                            >
                              {composition.notes_saisies ? 'Modifier Notes' : 'Saisir Notes'}
                            </button>
                            
                            <button 
                              className="bouton-compo"
                              onClick={(e) => {
                                e.stopPropagation();
                                ouvrirModalComposition(composition);
                              }}
                              title="Modifier la composition"
                              style={{fontSize: '12px', width: '110px', height: '40px'}}
                            >
                              ✏️ Modifier 
                            </button>
                            
                            <button 
                              className="bouton-supp-compo"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCompositionASupprimer(composition);
                              }}
                              title="Supprimer la composition"
                              style={{fontSize: '12px', width: '120px', height: '40px'}}
                            >
                              🗑️ Supprimer
                            </button>
                          </>
                        )}
                        
                        {composition.est_supprime && (
                          <div className="message-supprime">
                            <span className="icone-supprime">🗑️</span>
                            Cette composition a été supprimée
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="aucune-composition">
                  <div className="icone-aucune">📝</div>
                  <h3>Aucune composition</h3>
                  <p>Créez une nouvelle composition pour commencer à saisir les notes</p>
                  <button 
                    className="bouton-creer-composition"
                    onClick={() => ouvrirModalComposition()}
                    disabled={!classeSelectionnee || !periodeSelectionnee}
                  >
                    <span className="icone-ajouter">+ </span>
                    Créer une composition
                  </button>
                </div>
              )}
            </div>
          )}

          {ongletActif === 'saisie' && (
            <div className="vue-saisie-primaire">
              <h3>Saisie des notes</h3>
              {compositionSelectionnee && (
                <div className="stats-rapides">
                  <div className="stat">
                    <span className="stat-number">Composition</span>
                    <span className="stat-label">{compositions.find(c => c.id === compositionSelectionnee)?.titre}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">Date</span>
                    <span className="stat-label">{formaterDate(compositions.find(c => c.id === compositionSelectionnee)?.date_composition || '')}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">Classe</span>
                    <span className="stat-label">{(() => {
                      const classe = classes.find(c => c.id === classeSelectionnee);
                      return classe ? `${classe.niveau}${classe.nom ? ` ${classe.nom}` : ''}` : '';
                    })()}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{eleves.length}</span>
                    <span className="stat-label">Élèves</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">{matieres.length}</span>
                    <span className="stat-label">Matières</span>
                  </div>
                  <div className="stat">
                    <span className="stat-number">
                      {(() => {
                        const totalNotes = Object.values(notesSaisie).reduce((acc, notesMatieres) => {
                          return acc + Object.values(notesMatieres).filter(n => parseFloat(n.note) > 0).length;
                        }, 0);
                        return totalNotes;
                      })()}
                    </span>
                    <span className="stat-label">Notes saisies</span>
                  </div>
                </div>
              )}  
              
              {eleves.length > 0 && matieres.length > 0 ? (
                <>
                  <div className="tableau-wrapper">
                    <div className="tableau-saisie-simple">
                      <div className="table-header">
                        <div className="header-cell header-eleve">
                          <div>Élève</div>
                          <div className="sub-header">Matricule</div>
                        </div>
                        {matieres.map(matiere => (
                          <div key={matiere.id} className="header-cell header-matiere">
                            <div className="matiere-name">{matiere.nom.length > 8 ? matiere.nom.substring(0, 7) + '...' : matiere.nom}</div>
                            <div className="matiere-details">
                              <span className="coef">Coef: {matiere.coefficient}</span>
                              <span className="max">Max: {matiere.note_sur}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="table-body">
                        {eleves.map(eleve => (
                          <div key={eleve.id} className="table-row">
                            <div className="cell cell-eleve">
                              <div className="eleve-info">
                                <div className="eleve-nom">{eleve.prenom} {eleve.nom.charAt(0)}.</div>
                                <div className="eleve-details">
                                  <span className="matricule-eleve">{eleve.matricule || 'N/A'}</span>
                                  {eleve.email_parents && <span className="email-icon" title={eleve.email_parents}>📧</span>}
                                </div>
                              </div>
                            </div>
                            
                            {matieres.map(matiere => {
                              const noteData = notesSaisie[eleve.id]?.[matiere.id] || { note: '0' };
                              const noteValue = parseFloat(noteData.note) || 0;
                              const noteSur = matiere.note_sur || 20;
                              const isNoteValide = noteValue <= noteSur;
                              
                              return (
                                <div key={`${eleve.id}-${matiere.id}`} className="cell cell-note">
                                  <div className="note-input-container">
                                    <input
                                      type="text"
                                      inputMode="decimal"
                                      value={noteData.note}
                                      onChange={(e) => gererChangementNote(eleve.id, matiere.id, e.target.value)}
                                      className={`note-input ${!isNoteValide ? 'error' : ''}`}
                                      placeholder="0"
                                      maxLength={5}
                                      style={{
                                        borderColor: noteValue > 0 ? obtenirCouleurNote(noteValue) : '#ddd'
                                      }}
                                    />
                                    <div className="note-max">/{noteSur}</div>
                                  </div>
                                  {noteValue > 0 && (
                                    <div className="note-preview" style={{ color: obtenirCouleurNote(noteValue) }}>
                                      {noteValue.toFixed(1)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="actions-bottom">
                    <button 
                      className="btn btn-save"
                      onClick={sauvegarderNotes}
                      disabled={chargementSaisie}
                    >
                      {chargementSaisie ? 'Sauvegarde...' : '💾 Sauvegarder'}
                    </button>
                  </div>
                </>
              ) : (
                <div className="no-data-message">
                  <p>❌ Aucune donnée disponible. Sélectionnez une composition avec des élèves et des matières.</p>
                </div>
              )}
            </div>
          )}

          {ongletActif === 'releves' && (
            <div className="vue-releves-primaire">
              <div className="en-tete-releves">
                <h3>Gestion des Relevés de Notes</h3>

                <button 
                  className="btn"
                  onClick={genererRelevesTous}
                  disabled={!compositionSelectionnee}
                  style={{ backgroundColor: '#28a745', color: 'white' }}
                >
                  📄 Générer TOUS les relevés
                </button>
                
                <button 
                  className="btn"
                  onClick={reinitialiserEtGenerer}
                  disabled={!compositionSelectionnee}
                  style={{ backgroundColor: '#dc3545', color: 'white' }}
                >
                  🧹 Réinitialiser & Générer
                </button>
                <button
                  onClick={() => handleViewReleves(compositionSelectionnee)}
                  className="bouton-actualiser"
                >
                  👁 Voir tous les relevés
                </button>  

                <div className="actions-releves">
                  <button 
                    className="bouton-modifier-ens"
                    onClick={chargerReleves}
                  >
                    🔄 Actualiser ({releves.length})
                  </button>
                </div>
              </div>

              {compositionSelectionnee ? (
                <div className="contenu-releves">
                  <div className="info-composition-releves">
                    <div className="info-item">
                      <span className="label">Composition:</span>
                      <span className="value">
                        {compositions.find(c => c.id === compositionSelectionnee)?.titre}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Relevés générés:</span>
                      <span className="value" style={{ color: releves.length > 0 ? '#40c057' : '#fa5252' }}>
                        {releves.length}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Classe:</span>
                      <span className="value">
                        {(() => {
                          const classe = classes.find(c => c.id === classeSelectionnee);
                          return classe ? formaterNomClasse(classe) : '';
                        })()}
                      </span>
                    </div>
                    <div className="info-item">
                      <span className="label">Période:</span>
                      <span className="value">
                        {compositions.find(c => c.id === compositionSelectionnee)?.periode_nom}
                      </span>
                    </div>
                  </div>
                  
                  <div className="liste-eleves-releves">
                    <h4>Liste des élèves ({eleves.length})</h4>
                    
                    {chargementReleves ? (
                      <div className="chargement-releves">
                        <div className="spinner"></div>
                        <p>Chargement des relevés...</p>
                      </div>
                    ) : (
                      <div className="tableau-eleves-releves">
                        <div className="table-header-releves">
                          <div className="header-cell">Élève</div>
                          <div className="header-cell">Matricule</div>
                          <div className="header-cell">Statut relevé</div>
                          <div className="header-cell">Moyenne</div>
                          <div className="header-cell">Rang</div>
                          <div className="header-cell">Actions</div>
                        </div>
                        
                        <div className="table-body-releves">
                          {eleves.map(eleve => {
                            const releveEleve = releves.find(r => r.eleve_id === eleve.id);
                            const enCoursGeneration = generationEnCours[eleve.id];
                            
                            return (
                              <div key={eleve.id} className="table-row-releves">
                                <div className="cell cell-eleve">
                                  <div className="nom-eleve">
                                    {eleve.prenom} {eleve.nom}
                                  </div>
                                </div>
                                
                                <div className="Style_font">
                                  {eleve.matricule || 'N/A'}
                                </div>
                                
                                <div className="cell cell-statut">
                                  {enCoursGeneration ? (
                                    <span className="statut-en-cours">
                                      <span className="spinner-mini"></span> Génération...
                                    </span>
                                  ) : releveEleve ? (
                                    <div className="statut-finalise">
                                      <span className="icone-statut">✓</span>
                                      Généré le {formaterDate(releveEleve.date_generation)}
                                    </div>
                                  ) : (
                                    <span className="statut-a-generer">À générer</span>
                                  )}
                                </div>
                                
                                <div className="cell cell-moyenne">
                                  {releveEleve ? (
                                    <span className={`moyenne-affichage ${getClasseNote(releveEleve.moyenne_generale)}`}>
                                      {releveEleve.moyenne_generale.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span className="moyenne-non-dispo">-</span>
                                  )}
                                </div>
                                
                                <div className="cell cell-rang">
                                  {releveEleve ? (
                                    <span className="rang-affichage">
                                      {releveEleve.rang}
                                      {releveEleve.rang === 1 ? 'er' : 'ème'}
                                    </span>
                                  ) : (
                                    <span>-</span>
                                  )}
                                </div>
                                
                                <div className="cell cell-actions">
                                  {enCoursGeneration ? (
                                    <button className="btn btn-action" disabled>
                                      <span className="spinner-mini"></span>
                                    </button>
                                  ) : (
                                    <div className="flex gap-1">
                                      <button 
                                        className="btn btn-action btn-generer"
                                        onClick={() => genererReleveEleve(eleve)}
                                        title="Voir le relevé"
                                      >
                                        <Eye className="h-4 w-4" />
                                      </button>
                                      
                                      <button 
                                        className="btn btn-action btn-imprimer"
                                        onClick={() => imprimerReleveEleve(eleve)}
                                        title="Imprimer le relevé"
                                      >
                                        <Printer className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aucune-composition-selectionnee">
                  <div className="icone-message">📄</div>
                  <h3>Aucune composition sélectionnée</h3>
                  <p>Veuillez sélectionner une composition pour gérer les relevés de notes</p>
                  <button 
                    className="btn btn-selectionner"
                    onClick={() => setOngletActif('compositions')}
                  >
                    ← Retour aux compositions
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modales restaurées */}
      {modalCompositionOuvert && (
        <div className="modal-overlay">
          <div className="modal-composition">
            <div className="en-tete-modal">
              <h2>{compositionAModifier ? 'Modifier la composition' : 'Nouvelle Composition'}</h2>
              <button className="bouton-fermer-modal" onClick={fermerModalComposition}>✕</button>
            </div>
            
            <div className="contenu-modal">
              <div className="formulaire-composition">
                <div className="groupe-champ">
                  <label>Titre *</label>
                  <input
                    type="text"
                    value={formComposition.titre || ''}
                    onChange={(e) => setFormComposition(prev => ({ ...prev, titre: e.target.value }))}
                    className="champ"
                    placeholder="Ex: Composition du 1er trimestre"
                  />
                </div>
                
                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Classe *</label>
                    <select
                      value={formComposition.classe_id || 0}
                      onChange={(e) => {
                        const classeId = parseInt(e.target.value);
                        const classe = classes.find(c => c.id === classeId);
                        setFormComposition(prev => ({ 
                          ...prev, 
                          classe_id: classeId,
                          classe_nom: classe ? formaterNomClasse(classe) : ''
                        }));
                      }}
                      className="champ"
                      disabled={!!compositionAModifier}
                    >
                      <option value="0">Sélectionnez une classe</option>
                      {classes.map(classe => (
                        <option key={classe.id} value={classe.id}>
                          {formaterNomClasse(classe)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Date de la composition</label>
                    <input
                      type="date"
                      value={formComposition.date_composition || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormComposition(prev => ({ ...prev, date_composition: e.target.value }))}
                      className="champ"
                    />
                  </div>
                </div>
                
                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Période *</label>
                    <select
                      value={formComposition.periode_id || 0}
                      onChange={(e) => {
                        const periodeId = parseInt(e.target.value);
                        const periode = periodes.find(p => p.id === periodeId);
                        setFormComposition(prev => ({ 
                          ...prev, 
                          periode_id: periodeId,
                          periode_nom: periode?.nom || '',
                          annee_scolaire: periode?.annee_scolaire || ''
                        }));
                      }}
                      className="champ"
                      disabled={!!compositionAModifier}
                    >
                      <option value="0">Sélectionnez une période</option>
                      {periodes.map(periode => (
                        <option key={periode.id} value={periode.id}>
                          {periode.nom} - {periode.annee_scolaire}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Statut</label>
                    <select
                      value={formComposition.statut || 'a_venir'}
                      onChange={(e) => setFormComposition(prev => ({ ...prev, statut: e.target.value }))}
                      className="champ"
                    >
                      <option value="a_venir">À venir</option>
                      <option value="en_cours">En cours</option>
                      <option value="termine">Terminé</option>
                      <option value="annule">Annulé</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pied-modal">
              <button className="bouton-annuler" onClick={fermerModalComposition}>
                Annuler
              </button>
              <button className="bouton-sauvegarder" onClick={sauvegarderComposition}>
                {compositionAModifier ? 'Modifier la composition' : 'Créer la composition'}
              </button>
            </div>
          </div>
        </div>
      )}

      {compositionASupprimer && (
        <div className="modal-confirmation">
          <div className="modal-confirmation-contenu">
            <h3>⚠️ Confirmer la suppression</h3>
            
            <div className="details-suppression">
              <div className="info-composition-suppression">
                <h4>{compositionASupprimer.titre}</h4>
                <div className="details">
                  <p><strong>Classe :</strong> {compositionASupprimer.classe_nom}</p>
                  <p><strong>Date :</strong> {formaterDate(compositionASupprimer.date_composition)}</p>
                  <p><strong>Période :</strong> {compositionASupprimer.periode_nom}</p>
                </div>
              </div>
              
              <div className="consequences-suppression">
                <h4>Conséquences de la suppression :</h4>
                <ul className="liste-consequences">
                  {compositionASupprimer.notes_saisies && (
                    <li className="consequence grave">
                      ❌ <strong>Toutes les notes</strong> associées à cette composition seront supprimées
                    </li>
                  )}
                  {compositionASupprimer.releves_generes && (
                    <li className="consequence grave">
                      ❌ <strong>Tous les relevés</strong> générés à partir de cette composition seront supprimés
                    </li>
                  )}
                  <li className="consequence">
                    ⚠️ Cette action est <strong>IRRÉVERSIBLE</strong>
                  </li>
                  <li className="consequence">
                    ⚠️ Les données ne pourront pas être récupérées
                  </li>
                </ul>
              </div>
              
              <div className="statistiques-suppression">
                <div className="stat-suppression">
                  <span className="valeur">{compositionASupprimer.notes_saisies ? 'OUI' : 'NON'}</span>
                  <span className="label">Notes saisies</span>
                </div>
                <div className="stat-suppression">
                  <span className="valeur">{compositionASupprimer.releves_generes ? 'OUI' : 'NON'}</span>
                  <span className="label">Relevés générés</span>
                </div>
              </div>
            </div>
            
            <div className="actions-confirmation">
              <button 
                className="bouton-annuler"
                onClick={() => setCompositionASupprimer(null)}
              >
                Annuler
              </button>
              <button 
                className="bouton-confirmer suppression"
                onClick={supprimerComposition}
              >
                🗑️ Confirmer la suppression définitive
              </button>
            </div>
            
            <div className="avertissement-final">
              <p className="texte-avertissement">
                ⚠️ <strong>ATTENTION :</strong> En confirmant, vous acceptez la suppression permanente de toutes les données associées.
              </p>
            </div>
          </div>
        </div>
      )}

      {modalPeriodeOuvert && (
        <div className="modal-overlay">
          <div className="modal-periode">
            <div className="en-tete-modal">
              <h2>{periodeAModifier ? 'Modifier la période' : 'Nouvelle période primaire'}</h2>
              <button className="bouton-fermer-modal" onClick={fermerModalPeriode}>✕</button>
            </div>
            
            <div className="contenu-modal">
              <div className="formulaire-periode">
                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Nom de la période *</label>
                    <input
                      type="text"
                      value={formPeriode.nom}
                      onChange={(e) => setFormPeriode(prev => ({ ...prev, nom: e.target.value }))}
                      className="champ"
                      placeholder="Ex: Trimestre 1"
                    />
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Code période</label>
                    <input
                      type="text"
                      value={formPeriode.code_periode}
                      onChange={(e) => setFormPeriode(prev => ({ ...prev, code_periode: e.target.value }))}
                      className="champ"
                      placeholder="Ex: PRIM-T1-2024"
                    />
                    <small className="texte-aide">Laissé vide pour génération automatique</small>
                  </div>
                </div>
                
                <div className="groupe-champ triple">
                  <div className="sous-groupe">
                    <label>Année scolaire *</label>
                    <input
                      type="text"
                      value={formPeriode.annee_scolaire}
                      onChange={(e) => setFormPeriode(prev => ({ ...prev, annee_scolaire: e.target.value }))}
                      className="champ"
                      placeholder="Ex: 2024-2025"
                    />
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Type de période</label>
                    <select
                      value={formPeriode.type_periode}
                      onChange={(e) => setFormPeriode(prev => ({ 
                        ...prev, 
                        type_periode: e.target.value as any 
                      }))}
                      className="champ"
                    >
                      <option value="trimestre">Trimestre</option>
                      <option value="semestre">Semestre</option>
                      <option value="bimestre">Bimestre</option>
                    </select>
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Numéro</label>
                    <input
                      type="number"
                      value={formPeriode.numero}
                      onChange={(e) => setFormPeriode(prev => ({ 
                        ...prev, 
                        numero: parseInt(e.target.value) || 1 
                      }))}
                      className="champ"
                      min="1"
                      max="4"
                    />
                  </div>
                </div>
                
                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Date de début *</label>
                    <input
                      type="date"
                      value={formPeriode.date_debut}
                      onChange={(e) => setFormPeriode(prev => ({ ...prev, date_debut: e.target.value }))}
                      className="champ"
                    />
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Date de fin *</label>
                    <input
                      type="date"
                      value={formPeriode.date_fin}
                      onChange={(e) => setFormPeriode(prev => ({ ...prev, date_fin: e.target.value }))}
                      className="champ"
                    />
                  </div>
                </div>
                
                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Statut</label>
                    <select
                      value={formPeriode.statut}
                      onChange={(e) => setFormPeriode(prev => ({ 
                        ...prev, 
                        statut: e.target.value as any 
                      }))}
                      className="champ"
                    >
                      <option value="active">Active</option>
                      <option value="a_venir">À venir</option>
                      <option value="fermee">Fermée</option>
                    </select>
                  </div>
                  
                  <div className="sous-groupe">
                    <div className="checkbox-groupe">
                      <input
                        type="checkbox"
                        id="est_periode_courante"
                        checked={formPeriode.est_periode_courante}
                        onChange={(e) => setFormPeriode(prev => ({ 
                          ...prev, 
                          est_periode_courante: e.target.checked 
                        }))}
                      />
                      <label htmlFor="est_periode_courante">
                        Définir comme période courante
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pied-modal">
              <button className="bouton-annuler" onClick={fermerModalPeriode}>
                Annuler
              </button>
              <button className="bouton-sauvegarder" onClick={sauvegarderPeriode}>
                {periodeAModifier ? 'Modifier la période' : 'Créer la période'}
              </button>
            </div>
          </div>
        </div>
      )}


      {periodeASupprimer && (
        <div className="modal-overlay">
          <div className="modal-confirmation-contenu">
            <h3 style={{
                  padding: '10px',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>Confirmer la suppression</h3>
            <p>
              Êtes-vous sûr de vouloir supprimer la période 
              <strong> "{periodeASupprimer.nom}"</strong> ?
            </p>
            <p className="texte-avertissement">
              ⚠️ Cette action est irréversible. Si cette période contient des compositions ou des notes, elle ne pourra pas être supprimée.
            </p>
            <div className="actions-confirmation">
              <button 
                className="bouton-annuler"
                onClick={() => setPeriodeASupprimer(null)}
              >
                X Annuler
              </button>
              <button 
                className="bouton-confirmer"
                onClick={supprimerPeriode}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {modalPrevisualisationOuvert && <ModalPrevisualisation />}

      {showRelevesModal && (
        <ModalRelevesGeneres
          isOpen={showRelevesModal}
          onClose={() => {
            setShowRelevesModal(false);
            setSelectedCompositionForReleves(null);
          }}
          compositionId={selectedCompositionForReleves}
        />
      )}

      {/* Modal de gestion des matières depuis GestionCours */}
{modalMatieresCoursOuvert && (
  <div className="modal-overlay-matieres" onClick={() => setModalMatieresCoursOuvert(false)}>
    <div className="modal-matieres-contenu" onClick={(e) => e.stopPropagation()}>
          <GestionMatieres 
            onMatiereAjoutee={async () => {
              await chargerMatieresPrimaire();
            }}
            onFermer={() => setModalMatieresCoursOuvert(false)}
          />
    </div>
  </div>
)}

      {/* Toast Notifications */}
      <div className="toasts-container">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            data-toast-id={toast.id}
            className={`toast-notification ${toast.type} ${toast.important ? 'important' : ''} ${toast.action ? 'toast-with-actions' : ''}`}
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest('.toast-action-button')) {
                fermerToast(toast.id);
              }
            }}
          >
            <div className="toast-content">
              <span className="toast-icon">
                {toast.type === 'success' ? '✓' : 
                 toast.type === 'error' ? '✕' : 
                 toast.type === 'warning' ? '⚠' : 'ℹ'}
              </span>
              <span className="toast-message">{toast.message}</span>
              {!toast.important && (
                <button 
                  className="toast-close"
                  onClick={() => fermerToast(toast.id)}
                  aria-label="Fermer"
                >
                  ×
                </button>
              )}
            </div>
            
            {toast.action && (
              <div className="toast-actions">
                <button 
                  className="toast-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.action!.onClick();
                    fermerToast(toast.id);
                  }}
                >
                  {toast.action.label}
                </button>
                {toast.important && (
                  <button 
                    className="toast-action-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fermerToast(toast.id);
                    }}
                  >
                    Ignorer
                  </button>
                )}
              </div>
            )}
            
            {!toast.important && toast.duration && toast.duration > 0 && (
              <div className="toast-progress">
                <div 
                  className="toast-progress-bar"
                  style={{ animationDuration: `${toast.duration}ms` }}
                ></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}