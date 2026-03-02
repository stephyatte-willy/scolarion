'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import './GestionNotes.css';

// Interfaces des données
interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  date_naissance: string;
  classe_id: number;
  classe_nom?: string;
  niveau?: string;
  statut: string;
  matricule?: string;
}

interface Matiere {
  id: number;
  nom: string;
  niveau: string;
  couleur: string;
  icone: string;
  statut: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  annee_scolaire: string;
  effectif?: number;
}

interface Periode {
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

interface Enseignant {
  id: number;
  nom: string;
  prenom: string;
  nom_complet: string;
  email: string;
  specialite: string;
  statut: string;
  matricule?: string;
}

interface Evaluation {
  id: number;
  code_evaluation: string;
  titre: string;
  description: string;
  matiere_id: number;
  matiere_nom: string;
  classe_id: number;
  classe_nom: string;
  enseignant_id: number;
  enseignant_nom: string;
  type_evaluation: string;
  date_evaluation: string;
  coefficient: number;
  note_maximale: number;
  bareme: string;
  periode_id: number;
  periode_nom: string;
  annee_scolaire: string;
  statut: string;
}

interface Note {
  id?: number;
  eleve_id: number;
  eleve_nom: string;
  eleve_prenom: string;
  evaluation_id: number;
  evaluation_code: string;
  evaluation_titre: string;
  note: number | string;
  note_sur: number | string;
  appreciation: string;
  date_saisie: string;
  saisie_par: number;
  saisie_par_nom: string;
  est_absent: boolean;
  est_exempte: boolean;
  est_annulee: boolean;
  motif_absence: string;
  classe_id: number;
  classe_nom: string;
  matiere_id: number;
  matiere_nom: string;
  enseignant_id: number;
  enseignant_nom: string;
  periode_id: number;
  periode_nom: string;
  annee_scolaire: string;
}

interface Props {
  onRetourTableauDeBord: () => void;
}

export default function GestionNotes({ onRetourTableauDeBord }: Props) {
  // ========== ÉTATS PRINCIPAUX ==========
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  
  const [chargement, setChargement] = useState(true);
  const [alerte, setAlerte] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null);

  // ========== FILTRES ==========
  const [classeSelectionnee, setClasseSelectionnee] = useState<number>(0);
  const [matiereSelectionnee, setMatiereSelectionnee] = useState<number>(0);
  const [periodeSelectionnee, setPeriodeSelectionnee] = useState<number>(0);
  const [evaluationSelectionnee, setEvaluationSelectionnee] = useState<number>(0);
  const [ongletActif, setOngletActif] = useState<'saisie' | 'consultation' | 'moyennes' | 'bulletins'>('saisie');

  // ========== NOUVEAUX ÉTATS ==========
  const [rechercheEleve, setRechercheEleve] = useState('');
  const [triConsultation, setTriConsultation] = useState<'nom' | 'moyenne' | 'matiere'>('nom');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [triMoyennes, setTriMoyennes] = useState<'nom' | 'moyenne' | 'rang'>('nom');
  const [filtreReussite, setFiltreReussite] = useState<'tous' | 'reussi' | 'echoue'>('tous');
  const [periodeBulletin, setPeriodeBulletin] = useState<number>(0);
  const [filtreValidation, setFiltreValidation] = useState<'tous' | 'valide' | 'non_valide'>('tous');

  // ========== MODALS ==========
  const [modalEvaluationOuvert, setModalEvaluationOuvert] = useState(false);
  const [modalSaisieMasseOuvert, setModalSaisieMasseOuvert] = useState(false);
  const [modalImportNotesOuvert, setModalImportNotesOuvert] = useState(false);
  const [modalPeriodeOuvert, setModalPeriodeOuvert] = useState(false);

  // ========== FORMULAIRES ==========
  const [formEvaluation, setFormEvaluation] = useState({
    code_evaluation: '',
    titre: '',
    description: '',
    matiere_id: 0,
    matiere_nom: '',
    classe_id: 0,
    classe_nom: '',
    enseignant_id: 0,
    enseignant_nom: '',
    type_evaluation: 'devoir',
    date_evaluation: new Date().toISOString().split('T')[0],
    coefficient: 1.0,
    note_maximale: 20.00,
    bareme: 'sur_20',
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
    type_periode: 'trimestre' as 'trimestre' | 'semestre' | 'annuel' | 'bimestre' | 'quadrimestre',
    numero: 1,
    est_periode_courante: false,
    statut: 'active' as 'active' | 'fermee' | 'a_venir'
  });

  // ========== NOTES DE MASSE ==========
  const [notesMasse, setNotesMasse] = useState<Record<number, string>>({});
  const [appreciationsMasse, setAppreciationsMasse] = useState<Record<number, string>>({});
  const [fichierImport, setFichierImport] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [utilisateur, setUtilisateur] = useState<any>(null);
  const [dernierNumeroEvaluation, setDernierNumeroEvaluation] = useState<Record<string, number>>({});

  // ========== EFFETS ==========
  useEffect(() => {
    chargerDonnees();
    const userData = localStorage.getItem('utilisateur');
    if (userData) {
      setUtilisateur(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (alerte) {
      const timer = setTimeout(() => setAlerte(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alerte]);

  useEffect(() => {
    if (classeSelectionnee > 0) {
      chargerElevesParClasse(classeSelectionnee);
      chargerEvaluations();
    }
  }, [classeSelectionnee, periodeSelectionnee]);

  useEffect(() => {
    if (evaluationSelectionnee > 0) {
      chargerNotes();
    }
  }, [evaluationSelectionnee]);

  useEffect(() => {
    chargerDerniersNumeros();
  }, [evaluations]);

  useEffect(() => {
    if (classes.length > 0 && classeSelectionnee === 0) {
      setClasseSelectionnee(classes[0].id);
    }
  }, [classes]);

  useEffect(() => {
    if (periodes.length > 0 && periodeSelectionnee === 0) {
      const periodeActive = periodes.find(p => p.est_periode_courante);
      setPeriodeSelectionnee(periodeActive?.id || periodes[0].id);
    }
  }, [periodes]);

  // ========== FONCTIONS DE CHARGEMENT ==========
  const chargerDonnees = async () => {
    try {
      setChargement(true);

      const resClasses = await fetch('/api/classes');
      const dataClasses = await resClasses.json();
      if (dataClasses.success) {
        setClasses(dataClasses.classes || []);
      }

      const resMatieres = await fetch('/api/matieres');
      const dataMatieres = await resMatieres.json();
      if (dataMatieres.success) {
        setMatieres(dataMatieres.matieres || []);
      }

      const resPeriodes = await fetch('/api/periodes');
      const dataPeriodes = await resPeriodes.json();
      if (dataPeriodes.success) {
        setPeriodes(dataPeriodes.periodes || []);
      }

      const resEnseignants = await fetch('/api/enseignants');
      const dataEnseignants = await resEnseignants.json();
      if (dataEnseignants.success) {
        const enseignantsFormates = dataEnseignants.enseignants.map((ens: any) => ({
          id: ens.id,
          nom: ens.nom || '',
          prenom: ens.prenom || '',
          nom_complet: `${ens.prenom || ''} ${ens.nom || ''}`.trim(),
          email: ens.email || '',
          specialite: ens.specialite || '',
          statut: ens.statut || 'actif'
        }));
        setEnseignants(enseignantsFormates);
      }

      // Charger toutes les évaluations initiales
      const resEvaluations = await fetch('/api/evaluations');
      const dataEvaluations = await resEvaluations.json();
      if (dataEvaluations.success) {
        setEvaluations(dataEvaluations.evaluations || []);
      }

      // Charger toutes les notes initiales
      const resNotes = await fetch('/api/notes');
      const dataNotes = await resNotes.json();
      if (dataNotes.success) {
        const notesConverties = dataNotes.notes.map((note: any) => ({
          ...note,
          note: parseFloat(note.note) || 0,
          note_sur: parseFloat(note.note_sur) || 20.00
        }));
        setNotes(notesConverties || []);
      }

    } catch (error) {
      console.error('Erreur chargement données:', error);
      setAlerte({ type: 'error', message: 'Erreur lors du chargement des données' });
    } finally {
      setChargement(false);
    }
  };

  const chargerElevesParClasse = async (classeId: number) => {
    try {
      const response = await fetch(`/api/eleves?classe_id=${classeId}`);
      const data = await response.json();
      if (data.success) {
        setEleves(data.eleves || []);
      }
    } catch (error) {
      console.error('Erreur chargement élèves:', error);
    }
  };

  const chargerEvaluations = async () => {
    try {
      let url = '/api/evaluations';
      const params = [];
      
      if (classeSelectionnee > 0) {
        url += `?classe_id=${classeSelectionnee}`;
        if (periodeSelectionnee > 0) {
          url += `&periode_id=${periodeSelectionnee}`;
        }
      } else if (periodeSelectionnee > 0) {
        url += `?periode_id=${periodeSelectionnee}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setEvaluations(data.evaluations || []);
      }
    } catch (error) {
      console.error('Erreur chargement évaluations:', error);
    }
  };

  const chargerNotes = async () => {
    if (!evaluationSelectionnee) return;

    try {
      const response = await fetch(`/api/notes?evaluation_id=${evaluationSelectionnee}`);
      const data = await response.json();
      if (data.success) {
        const notesConverties = data.notes.map((note: any) => ({
          ...note,
          note: parseFloat(note.note) || 0,
          note_sur: parseFloat(note.note_sur) || 20.00
        }));
        setNotes(prevNotes => {
          // Fusionner les nouvelles notes avec les existantes
          const nouvellesNotes = [...prevNotes];
          notesConverties.forEach(note => {
            const index = nouvellesNotes.findIndex(n => n.id === note.id);
            if (index >= 0) {
              nouvellesNotes[index] = note;
            } else {
              nouvellesNotes.push(note);
            }
          });
          return nouvellesNotes;
        });
      }
    } catch (error) {
      console.error('Erreur chargement notes:', error);
    }
  };

  const chargerDerniersNumeros = () => {
    const numeros: Record<string, number> = {};
    
    evaluations.forEach(evaluationItem => {
      const match = evaluationItem.code_evaluation.match(/^(.*)-(\d{3})$/);
      if (match) {
        const prefixe = match[1];
        const numero = parseInt(match[2]);
        if (!numeros[prefixe] || numero > numeros[prefixe]) {
          numeros[prefixe] = numero;
        }
      }
    });
    
    setDernierNumeroEvaluation(numeros);
  };

  // ========== FONCTIONS UTILITAIRES ==========
  const genererCodeEvaluation = (typeEval: string, matiereId: number): string => {
    if (!matiereId) return '';
    
    const matiere = matieres.find(m => m.id === matiereId);
    if (!matiere) return '';
    
    const prefixeType: Record<string, string> = {
      'devoir': 'DEV',
      'controle': 'CTRL',
      'examen': 'EXAM',
      'projet': 'PROJ',
      'participation': 'PART',
      'oral': 'ORAL'
    };
    
    const prefixe = prefixeType[typeEval] || 'EVAL';
    const annee = new Date().getFullYear();
    const codeMatiere = matiere.nom.substring(0, 3).toUpperCase();
    
    const cle = `${prefixe}-${codeMatiere}-${annee}`;
    const numero = (dernierNumeroEvaluation[cle] || 0) + 1;
    
    return `${prefixe}-${codeMatiere}-${annee}-${numero.toString().padStart(3, '0')}`;
  };

  const genererTitreEvaluation = (typeEval: string, matiereNom: string): string => {
    const typeTraductions: Record<string, string> = {
      'devoir': 'Devoir de',
      'controle': 'Contrôle de',
      'examen': 'Examen de',
      'projet': 'Projet en',
      'participation': 'Participation en',
      'oral': 'Oral de'
    };
    
    const typeTexte = typeTraductions[typeEval] || 'Évaluation de';
    
    return `${typeTexte} ${matiereNom}`;
  };

  const convertirEnNombre = (valeur: any): number => {
    if (valeur === null || valeur === undefined || valeur === '') {
      return 0;
    }
    
    const nombre = parseFloat(valeur);
    return isNaN(nombre) ? 0 : nombre;
  };

  const formaterNote = (note: any): string => {
    const nombre = convertirEnNombre(note);
    return nombre.toFixed(2);
  };

  const getNomEleve = (eleveId: number): string => {
    const eleve = eleves.find(e => e.id === eleveId);
    return eleve ? `${eleve.nom} ${eleve.prenom}` : 'Élève inconnu';
  };

  const getNomMatiere = (matiereId: number): string => {
    const matiere = matieres.find(m => m.id === matiereId);
    return matiere ? matiere.nom : 'Matière inconnue';
  };

  const getNomPeriode = (periodeId: number): string => {
    const periode = periodes.find(p => p.id === periodeId);
    return periode ? `${periode.nom} ${periode.annee_scolaire}` : 'Période inconnue';
  };

  const getClasseSelectionnee = (): Classe | null => {
    return classes.find(c => c.id === classeSelectionnee) || null;
  };

  const isValidNumber = (value: string): boolean => {
    if (value === '') return true;
    return /^\d*\.?\d*$/.test(value);
  };

  const safeParseFloat = (value: string): number => {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  };

  // ========== FONCTIONS POUR CALCULER LES MOYENNES PAR MATIÈRE ==========
  const calculerMoyenneParMatiereEtPeriode = (eleveId: number, matiereId: number, periodeId: number): { moyenne: number, notes: Note[], totalCoefficient: number } => {
    // Récupérer toutes les évaluations pour cette matière et cette période
    const evaluationsMatiere = evaluations.filter(evalItem => 
      evalItem.matiere_id === matiereId && 
      evalItem.periode_id === periodeId &&
      (classeSelectionnee === 0 || evalItem.classe_id === classeSelectionnee)
    );

    if (evaluationsMatiere.length === 0) {
      return { moyenne: 0, notes: [], totalCoefficient: 0 };
    }

    // Récupérer toutes les notes de l'élève pour ces évaluations
    const notesEleve = notes.filter(note => 
      note.eleve_id === eleveId && 
      evaluationsMatiere.some(evalItem => evalItem.id === note.evaluation_id)
    );

    if (notesEleve.length === 0) {
      return { moyenne: 0, notes: [], totalCoefficient: 0 };
    }

    // Calculer la moyenne pondérée
    let totalPoints = 0;
    let totalCoefficients = 0;

    notesEleve.forEach(note => {
      const evaluation = evaluationsMatiere.find(e => e.id === note.evaluation_id);
      if (evaluation) {
        const coefficient = evaluation.coefficient || 1;
        const noteValeur = convertirEnNombre(note.note);
        totalPoints += noteValeur * coefficient;
        totalCoefficients += coefficient;
      }
    });

    const moyenne = totalCoefficients > 0 ? totalPoints / totalCoefficients : 0;

    return { 
      moyenne, 
      notes: notesEleve, 
      totalCoefficient: totalCoefficients 
    };
  };

  const calculerMoyenneGeneraleElevePeriode = (eleveId: number, periodeId: number): { moyenne: number, matieresAvecNotes: number, totalMatieres: number } => {
    if (!periodeId) return { moyenne: 0, matieresAvecNotes: 0, totalMatieres: 0 };

    // Récupérer toutes les matières du niveau de la classe
    const classe = getClasseSelectionnee();
    const matieresClasse = matieres.filter(m => 
      !classe || m.niveau === classe.niveau
    );

    let totalMoyennes = 0;
    let matieresAvecNotes = 0;

    matieresClasse.forEach(matiere => {
      const resultat = calculerMoyenneParMatiereEtPeriode(eleveId, matiere.id, periodeId);
      if (resultat.moyenne > 0) {
        totalMoyennes += resultat.moyenne;
        matieresAvecNotes++;
      }
    });

    const moyenne = matieresAvecNotes > 0 ? totalMoyennes / matieresAvecNotes : 0;

    return { 
      moyenne, 
      matieresAvecNotes, 
      totalMatieres: matieresClasse.length 
    };
  };

  // ========== FONCTIONS POUR L'ONGLET MOYENNES ==========
  const getCoefficientMatiere = (matiereId: number): number => {
    const evaluationsMatiere = evaluations.filter(e => 
      e.matiere_id === matiereId && 
      e.periode_id === periodeSelectionnee &&
      (classeSelectionnee === 0 || e.classe_id === classeSelectionnee)
    );
    
    if (evaluationsMatiere.length === 0) return 1;
    
    const totalCoefficients = evaluationsMatiere.reduce((sum, evalItem) => sum + evalItem.coefficient, 0);
    return totalCoefficients;
  };

  const getNotesMatiere = (eleveId: number, matiereId: number): Note[] => {
    const evaluationsMatiere = evaluations.filter(e => 
      e.matiere_id === matiereId && 
      e.periode_id === periodeSelectionnee &&
      (classeSelectionnee === 0 || e.classe_id === classeSelectionnee)
    );
    
    return notes.filter(n => 
      n.eleve_id === eleveId && 
      evaluationsMatiere.some(e => e.id === n.evaluation_id)
    );
  };

  const getAppreciationMatiere = (eleveId: number, matiereId: number): string => {
    const notesMatiere = getNotesMatiere(eleveId, matiereId);
    if (notesMatiere.length === 0) return 'Non évalué';
    
    const moyenne = notesMatiere.length > 0 
      ? notesMatiere.reduce((sum, note) => sum + convertirEnNombre(note.note), 0) / notesMatiere.length 
      : 0;
    
    if (moyenne >= 16) return 'Excellent travail';
    if (moyenne >= 14) return 'Très bon travail';
    if (moyenne >= 12) return 'Bon travail';
    if (moyenne >= 10) return 'Satisfaisant';
    if (moyenne >= 8) return 'Doit faire des efforts';
    return 'Insuffisant - À travailler';
  };

  const getCouleurNote = (note: number): string => {
    if (note === 0) return '#f9fafb';
    if (note < 8) return '#fee2e2';
    if (note < 10) return '#fef3c7';
    if (note < 12) return '#dbeafe';
    if (note < 14) return '#dcfce7';
    if (note < 16) return '#f0f9ff';
    return '#f5f3ff';
  };

  const getClasseNote = (note: number): string => {
    if (note === 0) return 'non-evalue';
    if (note < 8) return 'tres-faible';
    if (note < 10) return 'faible';
    if (note < 12) return 'passable';
    if (note < 14) return 'assez-bien';
    if (note < 16) return 'bien';
    return 'excellent';
  };

  const getClasseRang = (rang: number): string => {
    if (rang === 1) return 'premier';
    if (rang <= 3) return 'top-trois';
    if (rang <= 10) return 'top-dix';
    return 'autre';
  };

  const getClasseMention = (mention: string): string => {
    const mentionMap: Record<string, string> = {
      'Félicitations': 'Felicitations',
      'Très bien': 'Tres-bien',
      'Bien': 'Bien',
      'Assez bien': 'Assez-bien',
      'Passable': 'Passable',
      'Insuffisant': 'Insuffisant'
    };
    return mentionMap[mention] || '';
  };

  const getEvolutionMoyenne = (eleveId: number): string => {
    return 'N/A';
  };

  const calculerMoyennesEtRangs = () => {
    if (!periodeSelectionnee) return [];
    
    const classe = getClasseSelectionnee();
    const matieresClasse = matieres.filter(m => 
      !classe || m.niveau === classe.niveau
    );
    
    const resultats = eleves.map(eleve => {
      let totalMoyennes = 0;
      let matieresAvecNotes = 0;
      const moyennesMatieres: number[] = [];

      matieresClasse.forEach(matiere => {
        const resultat = calculerMoyenneParMatiereEtPeriode(eleve.id, matiere.id, periodeSelectionnee);
        const moyenneMatiere = resultat.moyenne;
        moyennesMatieres.push(moyenneMatiere);
        
        if (moyenneMatiere > 0) {
          totalMoyennes += moyenneMatiere;
          matieresAvecNotes++;
        }
      });

      const moyenneGenerale = matieresAvecNotes > 0 ? totalMoyennes / matieresAvecNotes : 0;
      
      return { 
        eleve, 
        moyennesMatieres, 
        moyenneGenerale,
        matieresAvecNotes 
      };
    });

    return resultats
      .sort((a, b) => b.moyenneGenerale - a.moyenneGenerale)
      .map((item, index) => ({
        ...item,
        rang: index + 1,
        mention: obtenirMention(item.moyenneGenerale)
      }));
  };

  const calculerMoyenneClasse = (): number => {
    const moyennes = calculerMoyennesEtRangs().map(item => item.moyenneGenerale);
    return moyennes.length > 0 ? moyennes.reduce((a, b) => a + b, 0) / moyennes.length : 0;
  };

  const calculerTauxReussite = (): number => {
    const moyennes = calculerMoyennesEtRangs().map(item => item.moyenneGenerale);
    const reussis = moyennes.filter(m => m >= 10).length;
    return moyennes.length > 0 ? Math.round((reussis / moyennes.length) * 100) : 0;
  };

  const getMeilleureMoyenne = (): number => {
    const moyennes = calculerMoyennesEtRangs().map(item => item.moyenneGenerale);
    return moyennes.length > 0 ? Math.max(...moyennes) : 0;
  };

  const calculerEcartType = (): number => {
    const moyennes = calculerMoyennesEtRangs().map(item => item.moyenneGenerale);
    const moyenneClasse = calculerMoyenneClasse();
    
    if (moyennes.length === 0) return 0;
    
    const ecartsCarres = moyennes.map(m => Math.pow(m - moyenneClasse, 2));
    const variance = ecartsCarres.reduce((a, b) => a + b, 0) / moyennes.length;
    
    return Math.sqrt(variance);
  };

  const obtenirMention = (moyenne: number): string => {
    if (moyenne >= 16) return 'Félicitations';
    if (moyenne >= 14) return 'Très bien';
    if (moyenne >= 12) return 'Bien';
    if (moyenne >= 10) return 'Assez bien';
    if (moyenne >= 8) return 'Passable';
    return 'Insuffisant';
  };

  const calculerRangEleve = (eleveId: number): number => {
    const moyennesAvecIds = eleves.map(e => ({
      eleveId: e.id,
      moyenne: calculerMoyenneGeneraleElevePeriode(e.id, periodeSelectionnee).moyenne
    })).sort((a, b) => b.moyenne - a.moyenne);
    
    const rang = moyennesAvecIds.findIndex(e => e.eleveId === eleveId);
    return rang !== -1 ? rang + 1 : 0;
  };

  const calculerTotalAbsences = (eleveId: number, periodeId: number): number => {
    return 0;
  };

  const calculerTotalRetards = (eleveId: number, periodeId: number): number => {
    return 0;
  };

  const genererBulletinEleve = (eleveId: number): any => {
    const eleve = eleves.find(e => e.id === eleveId);
    const resultatMoyenne = calculerMoyenneGeneraleElevePeriode(eleveId, periodeBulletin || periodeSelectionnee);
    const rang = calculerRangEleve(eleveId);
    const mention = obtenirMention(resultatMoyenne.moyenne);
    
    return {
      eleve,
      moyenneGenerale: resultatMoyenne.moyenne,
      rang,
      mention,
      appreciationProfesseur: '',
      appreciationDirecteur: '',
      statut: 'non_valide',
      dateGeneration: new Date().toISOString()
    };
  };

  const afficherDetailsEleve = (eleveId: number) => {
    const eleve = eleves.find(e => e.id === eleveId);
    if (eleve) {
      alert(`Détails pour ${eleve.nom} ${eleve.prenom}\nMatricule: ${eleve.matricule || 'N/A'}\nDate de naissance: ${new Date(eleve.date_naissance).toLocaleDateString('fr-FR')}`);
    }
  };

  const genererBulletinsClasse = () => {
    if (!classeSelectionnee || !periodeBulletin) {
      setAlerte({ type: 'warning', message: 'Veuillez sélectionner une classe et une période' });
      return;
    }
    
    setAlerte({ type: 'success', message: `Génération des bulletins pour la classe...` });
  };

  const imprimerBulletinsLot = () => {
    setAlerte({ type: 'info', message: 'Impression en lot des bulletins...' });
  };

  const exporterBulletinsPDF = () => {
    setAlerte({ type: 'info', message: 'Export PDF des bulletins...' });
  };

  const validerBulletinsDirecteur = () => {
    setAlerte({ type: 'success', message: 'Bulletins validés par le directeur' });
  };

  const voirBulletinComplet = (eleveId: number) => {
    const bulletin = genererBulletinEleve(eleveId);
    alert(`Bulletin complet pour ${bulletin.eleve.nom} ${bulletin.eleve.prenom}\nMoyenne: ${bulletin.moyenneGenerale.toFixed(2)}\nRang: ${bulletin.rang}ème\nMention: ${bulletin.mention}`);
  };

  const imprimerBulletin = (eleveId: number) => {
    const eleve = eleves.find(e => e.id === eleveId);
    if (eleve) {
      window.print();
    }
  };

  const telechargerBulletinPDF = (eleveId: number) => {
    setAlerte({ type: 'info', message: 'Téléchargement du bulletin PDF...' });
  };

  const envoyerBulletinEmail = (eleveId: number) => {
    const eleve = eleves.find(e => e.id === eleveId);
    if (eleve) {
      setAlerte({ type: 'info', message: `Envoi du bulletin à l'email des parents de ${eleve.nom}...` });
    }
  };

  // ========== GESTION DES ÉVALUATIONS ==========
  const ouvrirModalEvaluation = () => {
    const utilisateurData = JSON.parse(localStorage.getItem('utilisateur') || '{}');
    const enseignantId = utilisateurData.enseignant_id || utilisateurData.id || 0;
    const enseignantNom = utilisateurData.nom + ' ' + utilisateurData.prenom;
    const anneeCourante = new Date().getFullYear();
    
    const matiereInitiale = matieres.length > 0 ? matieres[0] : null;
    const codeInitial = genererCodeEvaluation('devoir', matiereInitiale?.id || 0);
    const titreInitial = matiereInitiale ? genererTitreEvaluation('devoir', matiereInitiale.nom) : '';

    setFormEvaluation({
      code_evaluation: codeInitial,
      titre: titreInitial,
      description: '',
      matiere_id: matiereInitiale?.id || 0,
      matiere_nom: matiereInitiale?.nom || '',
      classe_id: classeSelectionnee || 0,
      classe_nom: classes.find(c => c.id === classeSelectionnee)?.nom || '',
      enseignant_id: enseignantId,
      enseignant_nom: enseignantNom,
      type_evaluation: 'devoir',
      date_evaluation: new Date().toISOString().split('T')[0],
      coefficient: 1.0,
      note_maximale: 20.00,
      bareme: 'sur_20',
      periode_id: periodeSelectionnee || 0,
      periode_nom: periodes.find(p => p.id === periodeSelectionnee)?.nom || '',
      annee_scolaire: `${anneeCourante}-${anneeCourante + 1}`,
      statut: 'a_venir'
    });
    setModalEvaluationOuvert(true);
  };

  const fermerModalEvaluation = () => {
    setModalEvaluationOuvert(false);
  };

  const gererChangementEvaluation = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormEvaluation(prev => {
      const nouvelleValeur = {
        ...prev,
        [name]: name === 'matiere_id' || name === 'classe_id' || name === 'enseignant_id' || name === 'periode_id' 
          ? parseInt(value) 
          : name === 'coefficient' || name === 'note_maximale'
          ? parseFloat(value)
          : value
      };
      
      if (name === 'matiere_id' || name === 'type_evaluation') {
        const matiere = matieres.find(m => m.id === (name === 'matiere_id' ? parseInt(value) : prev.matiere_id));
        const typeEval = name === 'type_evaluation' ? value : prev.type_evaluation;
        const matiereId = name === 'matiere_id' ? parseInt(value) : prev.matiere_id;
        
        if (matiere && matiereId > 0) {
          nouvelleValeur.code_evaluation = genererCodeEvaluation(typeEval, matiereId);
          nouvelleValeur.matiere_nom = matiere.nom;
          const titreAuto = genererTitreEvaluation(typeEval, matiere.nom);
          nouvelleValeur.titre = titreAuto;
        }
      }
      
      if (name === 'matiere_id') {
        const matiere = matieres.find(m => m.id === parseInt(value));
        if (matiere) nouvelleValeur.matiere_nom = matiere.nom;
        
        if (matiere && prev.type_evaluation) {
          const titreAuto = genererTitreEvaluation(prev.type_evaluation, matiere.nom);
          nouvelleValeur.titre = titreAuto;
        }
      }
      
      if (name === 'classe_id') {
        const classe = classes.find(c => c.id === parseInt(value));
        if (classe) nouvelleValeur.classe_nom = classe.nom;
      }
      
      if (name === 'enseignant_id') {
        const enseignant = enseignants.find(e => e.id === parseInt(value));
        if (enseignant) nouvelleValeur.enseignant_nom = enseignant.nom_complet;
      }
      
      if (name === 'periode_id') {
        const periode = periodes.find(p => p.id === parseInt(value));
        if (periode) {
          nouvelleValeur.periode_nom = periode.nom;
          nouvelleValeur.annee_scolaire = periode.annee_scolaire;
        }
      }
      
      if (name === 'type_evaluation' && prev.matiere_id > 0) {
        const matiere = matieres.find(m => m.id === prev.matiere_id);
        if (matiere) {
          const titreAuto = genererTitreEvaluation(value, matiere.nom);
          nouvelleValeur.titre = titreAuto;
        }
      }
      
      return nouvelleValeur;
    });
  };

  const gererChangementTitreManuel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormEvaluation(prev => ({
      ...prev,
      titre: value
    }));
  };

  const validerEvaluation = (): boolean => {
    if (!formEvaluation.code_evaluation.trim()) {
      setAlerte({ type: 'error', message: 'Le code d\'évaluation est requis' });
      return false;
    }
    if (!formEvaluation.titre.trim()) {
      setAlerte({ type: 'error', message: 'Le titre est requis' });
      return false;
    }
    if (formEvaluation.matiere_id === 0) {
      setAlerte({ type: 'error', message: 'Veuillez sélectionner une matière' });
      return false;
    }
    if (formEvaluation.classe_id === 0) {
      setAlerte({ type: 'error', message: 'Veuillez sélectionner une classe' });
      return false;
    }
    if (formEvaluation.enseignant_id === 0) {
      setAlerte({ type: 'error', message: 'Veuillez sélectionner un enseignant' });
      return false;
    }
    if (formEvaluation.periode_id === 0) {
      setAlerte({ type: 'error', message: 'Veuillez sélectionner une période' });
      return false;
    }
    return true;
  };

  const sauvegarderEvaluation = async () => {
    if (!validerEvaluation()) return;

    try {
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formEvaluation)
      });

      const data = await response.json();
      if (data.success) {
        setAlerte({ type: 'success', message: 'Évaluation créée avec succès' });
        fermerModalEvaluation();
        chargerEvaluations();
        
        if (data.evaluation && eleves.length > 0) {
          const nouvellesNotesMasse: Record<number, string> = {};
          const nouvellesAppreciations: Record<number, string> = {};
          
          eleves.forEach(eleve => {
            nouvellesNotesMasse[eleve.id] = '0';
            nouvellesAppreciations[eleve.id] = '';
          });
          
          setNotesMasse(nouvellesNotesMasse);
          setAppreciationsMasse(nouvellesAppreciations);
          setEvaluationSelectionnee(data.evaluation.id);
          setModalSaisieMasseOuvert(true);
        }
      } else {
        setAlerte({ type: 'error', message: data.error || 'Erreur lors de la création' });
      }
    } catch (error) {
      console.error('Erreur création évaluation:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de la création' });
    }
  };

  // ========== GESTION DES PÉRIODES ==========
  const ouvrirModalPeriode = () => {
    const anneeCourante = new Date().getFullYear();
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
    setModalPeriodeOuvert(true);
  };

  const fermerModalPeriode = () => {
    setModalPeriodeOuvert(false);
  };

  const sauvegarderPeriode = async () => {
    try {
      let codePeriode = formPeriode.code_periode;
      if (!codePeriode) {
        const typeAbrev = formPeriode.type_periode.substring(0, 1).toUpperCase();
        const annee = formPeriode.annee_scolaire.split('-')[0];
        codePeriode = `${typeAbrev}${formPeriode.numero}-${annee}`;
      }
      
      const response = await fetch('/api/periodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formPeriode,
          code_periode: codePeriode
        })
      });

      const data = await response.json();
      if (data.success) {
        setAlerte({ type: 'success', message: 'Période créée avec succès' });
        fermerModalPeriode();
        const resPeriodes = await fetch('/api/periodes');
        const dataPeriodes = await resPeriodes.json();
        if (dataPeriodes.success) {
          setPeriodes(dataPeriodes.periodes || []);
        }
      } else {
        setAlerte({ type: 'error', message: data.error || 'Erreur lors de la création' });
      }
    } catch (error) {
      console.error('Erreur création période:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de la création' });
    }
  };

  // ========== SAISIE DE MASSE ==========
  const ouvrirSaisieMasse = (evaluationItem: Evaluation) => {
    const nouvellesNotesMasse: Record<number, string> = {};
    const nouvellesAppreciations: Record<number, string> = {};
    
    const notesExistentes = notes.filter(n => n.evaluation_id === evaluationItem.id);
    
    eleves.forEach(eleve => {
      const noteExistante = notesExistentes.find(n => n.eleve_id === eleve.id);
      const noteValue = noteExistante?.note;
      nouvellesNotesMasse[eleve.id] = noteValue !== undefined ? noteValue.toString() : '0';
      nouvellesAppreciations[eleve.id] = noteExistante?.appreciation || '';
    });
    
    setNotesMasse(nouvellesNotesMasse);
    setAppreciationsMasse(nouvellesAppreciations);
    setEvaluationSelectionnee(evaluationItem.id);
    setModalSaisieMasseOuvert(true);
  };

  const fermerSaisieMasse = () => {
    setModalSaisieMasseOuvert(false);
  };

  const gererChangementNoteMasse = (eleveId: number, value: string) => {
    if (value === '' || isValidNumber(value)) {
      setNotesMasse(prev => ({
        ...prev,
        [eleveId]: value
      }));
    }
  };

  const gererChangementAppreciationMasse = (eleveId: number, value: string) => {
    setAppreciationsMasse(prev => ({
      ...prev,
      [eleveId]: value
    }));
  };

  const sauvegarderNotesMasse = async () => {
    if (!evaluationSelectionnee) return;

    try {
      const notesASauvegarder = Object.entries(notesMasse).map(([eleveId, noteStr]) => {
        const note = safeParseFloat(noteStr);
        return {
          eleve_id: parseInt(eleveId),
          evaluation_id: evaluationSelectionnee,
          note: note,
          note_sur: formEvaluation.note_maximale,
          appreciation: appreciationsMasse[parseInt(eleveId)] || '',
          date_saisie: new Date().toISOString().split('T')[0],
          saisie_par: utilisateur?.id || 0,
          est_absent: false,
          est_exempte: false,
          est_annulee: false,
          motif_absence: ''
        };
      });

      const response = await fetch('/api/notes/masse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes: notesASauvegarder,
          evaluation_id: evaluationSelectionnee
        })
      });

      const data = await response.json();
      if (data.success) {
        setAlerte({ type: 'success', message: 'Notes enregistrées avec succès' });
        fermerSaisieMasse();
        chargerNotes();
      } else {
        setAlerte({ type: 'error', message: data.error || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      console.error('Erreur sauvegarde notes:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de la sauvegarde' });
    }
  };

  // ========== SAISIE INDIVIDUELLE ==========
  const sauvegarderNote = async (eleveId: number, noteValue: number, appreciation: string) => {
    if (!evaluationSelectionnee) return;

    try {
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eleve_id: eleveId,
          evaluation_id: evaluationSelectionnee,
          note: noteValue,
          note_sur: formEvaluation.note_maximale,
          appreciation: appreciation,
          date_saisie: new Date().toISOString().split('T')[0],
          saisie_par: utilisateur?.id || 0,
          est_absent: false,
          est_exempte: false,
          est_annulee: false,
          motif_absence: ''
        })
      });

      const data = await response.json();
      if (data.success) {
        setAlerte({ type: 'success', message: 'Note enregistrée avec succès' });
        chargerNotes();
      } else {
        setAlerte({ type: 'error', message: data.error || 'Erreur lors de la sauvegarde' });
      }
    } catch (error) {
      console.error('Erreur sauvegarde note:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de la sauvegarde' });
    }
  };

  // ========== EXPORT EXCEL ==========
  const exporterVersExcel = () => {
    if (!evaluationSelectionnee || !classeSelectionnee || !matiereSelectionnee || !periodeSelectionnee) {
      setAlerte({ type: 'warning', message: 'Veuillez sélectionner une évaluation complète' });
      return;
    }

    const evaluation = evaluations.find(e => e.id === evaluationSelectionnee);
    const classe = classes.find(c => c.id === classeSelectionnee);
    const matiere = matieres.find(m => m.id === matiereSelectionnee);
    const periode = periodes.find(p => p.id === periodeSelectionnee);

    const donneesExport = eleves.map((eleve, index) => {
      const noteEleve = notes.filter(n => n.evaluation_id === evaluationSelectionnee && n.eleve_id === eleve.id)[0];
      const resultatMoyenne = calculerMoyenneParMatiereEtPeriode(eleve.id, matiereSelectionnee, periodeSelectionnee);
      
      return {
        'N°': index + 1,
        'Nom': eleve.nom,
        'Prénom': eleve.prenom,
        'Matricule': eleve.matricule || 'N/A',
        'Date Naissance': new Date(eleve.date_naissance).toLocaleDateString('fr-FR'),
        'Note': noteEleve ? convertirEnNombre(noteEleve.note) : 0,
        'Sur': noteEleve ? convertirEnNombre(noteEleve.note_sur) : evaluation?.note_maximale || 20,
        'Appréciation': noteEleve?.appreciation || '',
        'Moyenne matière': resultatMoyenne.moyenne.toFixed(2),
        'Coefficient': resultatMoyenne.totalCoefficient,
        'Type évaluation': evaluation?.type_evaluation || '',
        'Date évaluation': evaluation?.date_evaluation ? new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR') : ''
      };
    });

    const notesValides = notes.filter(n => n.evaluation_id === evaluationSelectionnee && convertirEnNombre(n.note) > 0);
    const moyenneClasse = notesValides.length > 0 
      ? notesValides.reduce((sum, n) => sum + convertirEnNombre(n.note), 0) / notesValides.length 
      : 0;
    
    const meilleureNote = notesValides.length > 0 
      ? Math.max(...notesValides.map(n => convertirEnNombre(n.note))) 
      : 0;
    
    const moinsBonneNote = notesValides.length > 0 
      ? Math.min(...notesValides.map(n => convertirEnNombre(n.note))) 
      : 0;

    const entetes = Object.keys(donneesExport[0] || {}).join(';');
    const lignes = donneesExport.map(ligne => 
      Object.values(ligne).map(v => `"${v}"`).join(';')
    ).join('\n');

    const statistiques = [
      `\n\nStatistiques pour ${matiere?.nom} - ${classe?.niveau} ${classe?.nom}`,
      `Moyenne classe: ${moyenneClasse.toFixed(2)}/${evaluation?.note_maximale || 20}`,
      `Meilleure note: ${meilleureNote}/${evaluation?.note_maximale || 20}`,
      `Moins bonne note: ${moinsBonneNote}/${evaluation?.note_maximale || 20}`,
      `Effectif: ${eleves.length} élèves`,
      `Notes saisies: ${notesValides.length}/${eleves.length}`,
      `Date d'export: ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}`
    ].join('\n');

    const contenuCSV = `${entetes}\n${lignes}${statistiques}`;
    
    const blob = new Blob([contenuCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const nomFichier = `Notes_${matiere?.nom}_${classe?.niveau}_${classe?.nom}_${periode?.nom}_${new Date().toISOString().slice(0,10)}.csv`;
    
    link.href = url;
    link.setAttribute('download', nomFichier);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setAlerte({ type: 'success', message: 'Export Excel réalisé avec succès' });
  };

  // ========== FILTRES ET CALCULS ==========
  const evaluationsFiltrees = useMemo(() => {
    let filtrees = evaluations;
    
    if (classeSelectionnee > 0) {
      filtrees = filtrees.filter(e => e.classe_id === classeSelectionnee);
    }
    
    if (periodeSelectionnee > 0) {
      filtrees = filtrees.filter(e => e.periode_id === periodeSelectionnee);
    }
    
    if (matiereSelectionnee > 0) {
      filtrees = filtrees.filter(e => e.matiere_id === matiereSelectionnee);
    }
    
    return filtrees;
  }, [evaluations, classeSelectionnee, periodeSelectionnee, matiereSelectionnee]);

  const notesFiltrees = useMemo(() => {
    if (evaluationSelectionnee <= 0) return [];
    return notes.filter(n => n.evaluation_id === evaluationSelectionnee);
  }, [notes, evaluationSelectionnee]);

  // ========== COMPOSANT POUR SAISIE INDIVIDUELLE ==========
  const SaisieNoteEleve = ({ eleve }: { eleve: Eleve }) => {
    const noteExistante = notesFiltrees.find(n => n.eleve_id === eleve.id);
    const [note, setNote] = useState(noteExistante?.note?.toString() || '');
    const [appreciation, setAppreciation] = useState(noteExistante?.appreciation || '');

    const handleNoteChange = (value: string) => {
      if (value === '' || isValidNumber(value)) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && numValue <= formEvaluation.note_maximale) {
          setNote(value);
        } else if (value === '') {
          setNote(value);
        }
      }
    };

    const handleSave = () => {
      const noteValue = safeParseFloat(note);
      sauvegarderNote(eleve.id, noteValue, appreciation);
    };

    return (
      <div className="ligne-eleve">
        <div className="cellule nom">
          <div className="info-eleve">
            <span className="nom-eleve">{eleve.nom} {eleve.prenom}</span>
            <span className="matricule-eleve">{eleve.matricule || 'N/A'}</span>
          </div>
        </div>
        
        <div className="cellule note">
          <input
            type="text"
            inputMode="decimal"
            value={note}
            onChange={(e) => handleNoteChange(e.target.value)}
            className="input-note"
            placeholder="0.00"
            onBlur={(e) => {
              const value = e.target.value;
              if (value === '') {
                setNote('0');
              } else {
                const numValue = parseFloat(value);
                if (isNaN(numValue) || numValue > formEvaluation.note_maximale) {
                  setNote('0');
                }
              }
            }}
          />
        </div>
        
        <div className="cellule appreciation">
          <input
            type="text"
            value={appreciation}
            onChange={(e) => setAppreciation(e.target.value)}
            className="input-appreciation"
            placeholder="Appréciation..."
            maxLength={100}
          />
        </div>
        
        <div className="cellule actions">
          <button 
            className="bouton-sauvegarder-note"
            onClick={handleSave}
            disabled={note === ''}
          >
            💾
          </button>
        </div>
      </div>
    );
  };

  // ========== RENDU ==========
  if (chargement) {
    return (
      <div className="chargement-notes">
        <div className="spinner-grand"></div>
        <p>Chargement du module de notes...</p>
      </div>
    );
  }

  return (
    <div className="conteneur-gestion-notes">
      {/* En-tête */}
      <div className="en-tete-gestion-notes"> 
        
        <div className="titre-actions">
          <span>Gestion des Notes-Collège</span>
          <button className="bouton-nouvelle-evaluation" onClick={ouvrirModalEvaluation}>
            <span className="icone-ajouter">+</span>
            Nouvelle Évaluation
          </button>
          
          <button 
            className="bouton-importer-notes"
            onClick={exporterVersExcel}
          >
            <span className="icone-import">📥</span>
            Exporter en Excel
          </button>
        </div>

        {/* Statistiques */}
        <div className="statistiques-notes">
          <div className="carte-statistique">
            <div className="icone-stat">📝</div>
            <div className="contenu-stat">
              <div className="valeur-stat">{evaluationsFiltrees.length}</div>
              <div className="label-stat">Évaluations</div>
            </div>
          </div>
          
          <div className="carte-statistique">
            <div className="icone-stat">👨‍🎓</div>
            <div className="contenu-stat">
              <div className="valeur-stat">{eleves.length}</div>
              <div className="label-stat">Élèves</div>
            </div>
          </div>
          
          <div className="carte-statistique">
            <div className="icone-stat">📚</div>
            <div className="contenu-stat">
              <div className="valeur-stat">{matieres.length}</div>
              <div className="label-stat">Matières</div>
            </div>
          </div>
          
          <div className="carte-statistique">
            <div className="icone-stat">📊</div>
            <div className="contenu-stat">
              <div className="valeur-stat">{notes.length}</div>
              <div className="label-stat">Notes saisies</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {alerte && (
        <div className={`alerte-notes ${alerte.type}`}>
          <div className="contenu-alerte-notes">
            <span className="icone-alerte">
              {alerte.type === 'success' ? '✅' : alerte.type === 'error' ? '❌' : '⚠️'}
            </span>
            <span className="texte-alerte">{alerte.message}</span>
            <button 
              className="bouton-fermer-alerte"
              onClick={() => setAlerte(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Navigation par onglets */}
      <div className="navigation-onglets-notes">
        <button 
          className={`onglet-notes ${ongletActif === 'saisie' ? 'actif' : ''}`}
          onClick={() => setOngletActif('saisie')}
        >
          📝 Saisie des notes
        </button>
        <button 
          className={`onglet-notes ${ongletActif === 'consultation' ? 'actif' : ''}`}
          onClick={() => setOngletActif('consultation')}
        >
          📊 Consultation
        </button>
        <button 
          className={`onglet-notes ${ongletActif === 'moyennes' ? 'actif' : ''}`}
          onClick={() => setOngletActif('moyennes')}
        >
          📈 Moyennes
        </button>
        <button 
          className={`onglet-notes ${ongletActif === 'bulletins' ? 'actif' : ''}`}
          onClick={() => setOngletActif('bulletins')}
        >
          📄 Bulletins
        </button>
      </div>

      {/* Filtres */}
      <div className="filtres-notes">
        <div className="groupe-filtre">
          <label className="label-filtre">Classe</label>
          <select 
            value={classeSelectionnee}
            onChange={(e) => setClasseSelectionnee(parseInt(e.target.value))}
            className="select-filtre"
          >
            <option value="0">Toutes les classes</option>
            {classes.map(classe => (
              <option key={classe.id} value={classe.id}>
                {classe.niveau} {classe.nom}
              </option>
            ))}
          </select>
        </div>
        
        <div className="groupe-filtre">
          <label className="label-filtre">Matière</label>
          <select 
            value={matiereSelectionnee}
            onChange={(e) => setMatiereSelectionnee(parseInt(e.target.value))}
            className="select-filtre"
          >
            <option value="0">Toutes les matières</option>
            {matieres.map(matiere => (
              <option key={matiere.id} value={matiere.id}>
                {matiere.nom}
              </option>
            ))}
          </select>
        </div>
        
        <div className="groupe-filtre">
          <label className="label-filtre">Période</label>
          <select 
            value={periodeSelectionnee}
            onChange={(e) => setPeriodeSelectionnee(parseInt(e.target.value))}
            className="select-filtre"
          >
            <option value="0">Toutes les périodes</option>
            {periodes.map(periode => (
              <option key={periode.id} value={periode.id}>
                {periode.nom} - {periode.annee_scolaire}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contenu selon l'onglet actif */}
      <div className="contenu-notes">
        {ongletActif === 'saisie' && (
          <div className="vue-saisie">
            <div className="liste-evaluations">
              <h3>Évaluations disponibles</h3>
              <div className="cartes-evaluations">
                {evaluationsFiltrees.length > 0 ? (
                  evaluationsFiltrees.map(evaluation => (
                    <div 
                      key={evaluation.id}
                      className={`carte-evaluation ${evaluationSelectionnee === evaluation.id ? 'selectionnee' : ''}`}
                      onClick={() => setEvaluationSelectionnee(evaluation.id)}
                    >
                      <div className="en-tete-carte-evaluation">
                        <span className="type-evaluation">{evaluation.type_evaluation}</span>
                        <span className={`statut-evaluation ${evaluation.statut}`}>
                          {evaluation.statut}
                        </span>
                      </div>
                      <h4 className="titre-evaluation">{evaluation.titre}</h4>
                      <div className="details-evaluation">
                        <span className="detail">📚 {evaluation.matiere_nom}</span>
                        <span className="detail">📅 {new Date(evaluation.date_evaluation).toLocaleDateString('fr-FR')}</span>
                        <span className="detail">⚖️ Coef: {evaluation.coefficient}</span>
                        <span className="detail">📊 Max: {evaluation.note_maximale}</span>
                      </div>
                      <div className="actions-evaluation">
                        <button 
                          className="bouton-saisie-masse"
                          onClick={(e) => {
                            e.stopPropagation();
                            ouvrirSaisieMasse(evaluation);
                          }}
                        >
                          Saisir les notes
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="aucune-evaluation">
                    <div className="icone-aucune-evaluation">📝</div>
                    <p>Aucune évaluation disponible avec les filtres actuels</p>
                    <button 
                      className="bouton-creer-evaluation"
                      onClick={ouvrirModalEvaluation}
                    >
                      Créer une évaluation
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="detail-saisie">
              {evaluationSelectionnee ? (
                <>
                  <div className="en-tete-detail-saisie">
                    <h2>Saisie des notes</h2>
                    <div className="infos-evaluation">
                      <span className="info">
                        Classe: <strong>{getClasseSelectionnee()?.niveau} {getClasseSelectionnee()?.nom}</strong>
                      </span>
                      <span className="info">
                        Évaluation: <strong>{evaluations.find(e => e.id === evaluationSelectionnee)?.titre}</strong>
                      </span>
                      <span className="info">
                        Date: <strong>{new Date(evaluations.find(e => e.id === evaluationSelectionnee)?.date_evaluation || '').toLocaleDateString('fr-FR')}</strong>
                      </span>
                    </div>
                  </div>
                  
                  <div className="tableau-saisie">
                    <div className="en-tete-tableau-saisie">
                      <div className="cellule nom">Nom de l'élève</div>
                      <div className="cellule note">Note / {formEvaluation.note_maximale}</div>
                      <div className="cellule appreciation">Appréciation</div>
                      <div className="cellule actions">Actions</div>
                    </div>
                    
                    <div className="corps-tableau-saisie">
                      {eleves.map(eleve => (
                        <SaisieNoteEleve key={eleve.id} eleve={eleve} />
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="aucune-evaluation-selectionnee">
                  <div className="icone-aucune-evaluation">📝</div>
                  <h3>Sélectionnez une évaluation</h3>
                  <p>Choisissez une évaluation dans la liste pour commencer la saisie des notes</p>
                  <p className="info-importante">⚠️ Utilisez les filtres ci-dessus pour afficher les évaluations disponibles</p>
                </div>
              )}
            </div>
          </div>
        )}

        {ongletActif === 'consultation' && (
          <div className="vue-consultation">
            <h2>Consultation des notes par matière</h2>
            <div className="filtres-avances">
              <div className="groupe-filtre-avance">
                <input
                  type="text"
                  placeholder="Rechercher un élève..."
                  className="input-recherche"
                  value={rechercheEleve}
                  onChange={(e) => setRechercheEleve(e.target.value)}
                />
              </div>
              <div className="groupe-filtre-avance">
                <select 
                  className="select-filtre-avance"
                  value={triConsultation}
                  onChange={(e) => setTriConsultation(e.target.value as 'nom' | 'moyenne' | 'matiere')}
                >
                  <option value="nom">Trier par nom</option>
                  <option value="moyenne">Trier par moyenne</option>
                  <option value="matiere">Trier par matière</option>
                </select>
              </div>
            </div>
            
            {classeSelectionnee && periodeSelectionnee ? (
              <div className="tableau-consultation-matiere">
                <div className="en-tete-consultation-matiere">
                  <div className="colonne nom">Élève</div>
                  <div className="colonne matiere">Matière</div>
                  <div className="colonne moyenne">Moyenne</div>
                  <div className="colonne coefficients">Coefficients</div>
                  <div className="colonne details">Détails des notes</div>
                </div>
                
                <div className="corps-consultation-matiere">
                  {(() => {
                    // Regrouper par élève et matière
                    const donneesParEleveMatiere: Array<{
                      eleve: Eleve;
                      matiere: Matiere;
                      moyenne: number;
                      totalCoefficient: number;
                      notesDetails: Array<{
                        evaluation: string;
                        note: number;
                        coefficient: number;
                      }>;
                    }> = [];

                    eleves.forEach(eleve => {
                      const matieresClasse = matieres.filter(m => 
                        m.niveau === getClasseSelectionnee()?.niveau
                      );

                      matieresClasse.forEach(matiere => {
                        const resultat = calculerMoyenneParMatiereEtPeriode(
                          eleve.id, 
                          matiere.id, 
                          periodeSelectionnee
                        );

                        if (resultat.notes.length > 0) {
                          const notesDetails = resultat.notes.map(note => {
                            const evaluation = evaluations.find(e => e.id === note.evaluation_id);
                            return {
                              evaluation: evaluation?.titre || 'Évaluation inconnue',
                              note: convertirEnNombre(note.note),
                              coefficient: evaluation?.coefficient || 1
                            };
                          });

                          donneesParEleveMatiere.push({
                            eleve,
                            matiere,
                            moyenne: resultat.moyenne,
                            totalCoefficient: resultat.totalCoefficient,
                            notesDetails
                          });
                        }
                      });
                    });

                    // Filtrer par recherche
                    const donneesFiltrees = donneesParEleveMatiere.filter(item =>
                      !rechercheEleve ||
                      item.eleve.nom.toLowerCase().includes(rechercheEleve.toLowerCase()) ||
                      item.eleve.prenom.toLowerCase().includes(rechercheEleve.toLowerCase()) ||
                      item.matiere.nom.toLowerCase().includes(rechercheEleve.toLowerCase())
                    );

                    // Trier les données
                    const donneesTriees = donneesFiltrees.sort((a, b) => {
                      switch (triConsultation) {
                        case 'moyenne':
                          return b.moyenne - a.moyenne;
                        case 'matiere':
                          return a.matiere.nom.localeCompare(b.matiere.nom);
                        default:
                          return a.eleve.nom.localeCompare(b.eleve.nom);
                      }
                    });

                    return donneesTriees.map((item, index) => (
                      <div key={`${item.eleve.id}-${item.matiere.id}`} className="ligne-consultation-matiere">
                        <div className="colonne nom">
                          <div className="info-eleve-consultation">
                            <span className="nom-eleve">{item.eleve.nom} {item.eleve.prenom}</span>
                            <span className="matricule-eleve">{item.eleve.matricule || 'N/A'}</span>
                          </div>
                        </div>
                        <div className="colonne matiere">
                          <span className="nom-matiere">{item.matiere.nom}</span>
                        </div>
                        <div className="colonne moyenne">
                          <span className={`valeur-moyenne ${getClasseNote(item.moyenne)}`}>
                            {item.moyenne.toFixed(2)}/20
                          </span>
                        </div>
                        <div className="colonne coefficients">
                          <span className="valeur-coefficient">
                            Total: {item.totalCoefficient.toFixed(1)}
                          </span>
                        </div>
                        <div className="colonne details">
                          <div className="details-notes">
                            {item.notesDetails.map((detail, idx) => (
                              <div key={idx} className="detail-note">
                                <span className="nom-evaluation">{detail.evaluation}</span>
                                <span className="note-evaluation">{detail.note.toFixed(2)}/20</span>
                                <span className="coef-evaluation">(Coef: {detail.coefficient})</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <div className="selection-obligatoire">
                <div className="icone-selection">🎯</div>
                <h3>Sélectionnez une classe et une période</h3>
                <p>Veuillez sélectionner une classe et une période pour afficher les notes</p>
              </div>
            )}
          </div>
        )}

        {ongletActif === 'moyennes' && (
          <div className="vue-moyennes">
            <h2>Moyennes par matière</h2>
            <div className="filtres-moyennes">
              <div className="groupe-filtre-moyenne">
                <select 
                  className="select-filtre-moyenne"
                  value={triMoyennes}
                  onChange={(e) => setTriMoyennes(e.target.value as 'nom' | 'moyenne' | 'rang')}
                >
                  <option value="nom">Trier par nom</option>
                  <option value="moyenne">Trier par moyenne</option>
                  <option value="rang">Trier par rang</option>
                </select>
              </div>
              <div className="groupe-filtre-moyenne">
                <button 
                  className={`bouton-filtre ${filtreReussite === 'tous' ? 'actif' : ''}`}
                  onClick={() => setFiltreReussite('tous')}
                >
                  Tous
                </button>
                <button 
                  className={`bouton-filtre ${filtreReussite === 'reussi' ? 'actif' : ''}`}
                  onClick={() => setFiltreReussite('reussi')}
                >
                  Réussis
                </button>
                <button 
                  className={`bouton-filtre ${filtreReussite === 'echoue' ? 'actif' : ''}`}
                  onClick={() => setFiltreReussite('echoue')}
                >
                  Échoués
                </button>
              </div>
            </div>
            
            {classeSelectionnee && periodeSelectionnee ? (
              <div className="tableau-moyennes-complet">
                <div className="en-tete-moyennes-detaillee">
                  <div className="colonne nom">Élève</div>
                  {matieres
                    .filter(m => m.niveau === getClasseSelectionnee()?.niveau)
                    .map(matiere => (
                      <div key={matiere.id} className="colonne matiere" style={{ backgroundColor: matiere.couleur + '20' }}>
                        <div className="info-matiere">
                          <span className="icone-matiere">{matiere.icone}</span>
                          <span className="nom-matiere">{matiere.nom}</span>
                        </div>
                        <div className="coef-matiere">Coef: {getCoefficientMatiere(matiere.id).toFixed(1)}</div>
                      </div>
                    ))}
                  <div className="colonne moyenne-generale">
                    <div className="info-moyenne">
                      <span>Moyenne Générale</span>
                      <span className="poids-moyenne">(Pondérée)</span>
                    </div>
                  </div>
                  <div className="colonne rang">Rang</div>
                  <div className="colonne mention">Mention</div>
                  <div className="colonne actions">Actions</div>
                </div>
                
                <div className="corps-moyennes">
                  {calculerMoyennesEtRangs()
                    .filter(eleve => {
                      if (filtreReussite === 'tous') return true;
                      if (filtreReussite === 'reussi') return eleve.moyenneGenerale >= 10;
                      return eleve.moyenneGenerale < 10;
                    })
                    .sort((a, b) => {
                      switch (triMoyennes) {
                        case 'moyenne':
                          return b.moyenneGenerale - a.moyenneGenerale;
                        case 'rang':
                          return a.rang - b.rang;
                        default:
                          return a.eleve.nom.localeCompare(b.eleve.nom);
                      }
                    })
                    .map(({ eleve, moyennesMatieres, moyenneGenerale, rang, mention }) => (
                      <div key={eleve.id} className="ligne-moyenne-detaille">
                        <div className="colonne nom">
                          <div className="info-eleve-complet">
                            <span className="nom-eleve">{eleve.nom} {eleve.prenom}</span>
                            <span className="matricule-eleve">{eleve.matricule || 'N/A'}</span>
                          </div>
                        </div>
                        
                        {matieres
                          .filter(m => m.niveau === getClasseSelectionnee()?.niveau)
                          .map((matiere, index) => {
                            const moyenne = moyennesMatieres[index];
                            const noteColor = getCouleurNote(moyenne);
                            
                            return (
                              <div key={matiere.id} className="colonne matiere">
                                <div className="cellule-matiere">
                                  <span 
                                    className={`valeur-moyenne ${getClasseNote(moyenne)}`}
                                    style={{ backgroundColor: noteColor }}
                                  >
                                    {moyenne > 0 ? moyenne.toFixed(2) : '-'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        
                        <div className="colonne moyenne-generale">
                          <div className="cellule-moyenne-generale">
                            <span className={`valeur-moyenne-generale ${getClasseNote(moyenneGenerale)}`}>
                              {moyenneGenerale.toFixed(2)}
                            </span>
                            <div className="evolution-moyenne">
                              {getEvolutionMoyenne(eleve.id)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="colonne rang">
                          <div className={`badge-rang ${getClasseRang(rang)}`}>
                            {rang}ème
                          </div>
                        </div>
                        
                        <div className="colonne mention">
                          <span className={`badge-mention ${getClasseMention(mention)}`}>
                            {mention}
                          </span>
                        </div>
                        
                        <div className="colonne actions">
                          <button 
                            className="bouton-details"
                            onClick={() => afficherDetailsEleve(eleve.id)}
                            title="Voir le détail des notes"
                          >
                            📊
                          </button>
                          <button 
                            className="bouton-bulletin"
                            onClick={() => voirBulletinComplet(eleve.id)}
                            title="Générer bulletin"
                          >
                            📄
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
                
                <div className="pied-moyennes">
                  <div className="statistiques-moyennes">
                    <div className="stat">
                      <span className="valeur-stat">{calculerMoyenneClasse().toFixed(2)}</span>
                      <span className="label-stat">Moyenne classe</span>
                    </div>
                    <div className="stat">
                      <span className="valeur-stat">{calculerTauxReussite()}%</span>
                      <span className="label-stat">Taux de réussite</span>
                    </div>
                    <div className="stat">
                      <span className="valeur-stat">{getMeilleureMoyenne().toFixed(2)}</span>
                      <span className="label-stat">Meilleure moyenne</span>
                    </div>
                    <div className="stat">
                      <span className="valeur-stat">{calculerEcartType().toFixed(2)}</span>
                      <span className="label-stat">Écart-type</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="selection-obligatoire">
                <div className="icone-selection">🎯</div>
                <h3>Sélectionnez une classe et une période</h3>
                <p>Veuillez sélectionner une classe et une période pour afficher les moyennes</p>
              </div>
            )}
          </div>
        )}

        {ongletActif === 'bulletins' && (
          <div className="vue-bulletins">
            <div className="en-tete-bulletins">
              <h2>Gestion des bulletins</h2>
              <div className="filtres-bulletins">
                <div className="groupe-filtre-bulletin">
                  <select 
                    className="select-filtre-bulletin"
                    value={periodeBulletin}
                    onChange={(e) => setPeriodeBulletin(parseInt(e.target.value))}
                  >
                    <option value="0">Sélectionnez une période</option>
                    {periodes.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nom} - {p.annee_scolaire}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="groupe-filtre-bulletin">
                  <button 
                    className={`bouton-filtre ${filtreValidation === 'tous' ? 'actif' : ''}`}
                    onClick={() => setFiltreValidation('tous')}
                  >
                    Tous
                  </button>
                  <button 
                    className={`bouton-filtre ${filtreValidation === 'valide' ? 'actif' : ''}`}
                    onClick={() => setFiltreValidation('valide')}
                  >
                    Validés
                  </button>
                  <button 
                    className={`bouton-filtre ${filtreValidation === 'non_valide' ? 'actif' : ''}`}
                    onClick={() => setFiltreValidation('non_valide')}
                  >
                    Non validés
                  </button>
                </div>
              </div>
            </div>
            
            <div className="actions-bulletins-principales">
              <button 
                className="bouton-generer-tous"
                onClick={genererBulletinsClasse}
                disabled={!classeSelectionnee || !periodeBulletin}
              >
                📄 Générer tous les bulletins
              </button>
              <button 
                className="bouton-imprimer-lot"
                onClick={imprimerBulletinsLot}
                disabled={!classeSelectionnee || !periodeBulletin}
              >
                🖨️ Imprimer en lot
              </button>
              <button 
                className="bouton-export-pdf"
                onClick={exporterBulletinsPDF}
                disabled={!classeSelectionnee || !periodeBulletin}
              >
                📤 Exporter en PDF
              </button>
              <button 
                className="bouton-validation-directeur"
                onClick={validerBulletinsDirecteur}
                disabled={!classeSelectionnee || !periodeBulletin}
              >
                ✅ Valider par le directeur
              </button>
            </div>
            
            {classeSelectionnee && periodeBulletin ? (
              <div className="liste-bulletins-detaille">
                {eleves.map(eleve => {
                  const bulletin = genererBulletinEleve(eleve.id);
                  const moyenneGenerale = calculerMoyenneGeneraleElevePeriode(eleve.id, periodeBulletin).moyenne;
                  const rang = calculerRangEleve(eleve.id);
                  const mention = obtenirMention(moyenneGenerale);
                  
                  return (
                    <div key={eleve.id} className="carte-bulletin-detaille">
                      <div className="en-tete-bulletin-detaille">
                        <div className="info-eleve-bulletin">
                          <h4>{eleve.nom} {eleve.prenom}</h4>
                          <p className="classe-eleve">{getClasseSelectionnee()?.niveau} {getClasseSelectionnee()?.nom}</p>
                          <p className="matricule-eleve">Matricule: {eleve.matricule || 'N/A'}</p>
                        </div>
                        <div className="periode-bulletin">
                          <span className="label-periode">{getNomPeriode(periodeBulletin)}</span>
                          <span className="date-bulletin">
                            Émis le: {new Date().toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="contenu-bulletin">
                        <div className="section-matiere-bulletin">
                          <h5>Résultats par matière</h5>
                          <div className="tableau-matiere-bulletin">
                            {matieres
                              .filter(m => m.niveau === getClasseSelectionnee()?.niveau)
                              .map(matiere => {
                                const resultat = calculerMoyenneParMatiereEtPeriode(eleve.id, matiere.id, periodeBulletin);
                                const moyenneMatiere = resultat.moyenne;
                                return (
                                  <div key={matiere.id} className="ligne-matiere-bulletin">
                                    <div className="cellule-matiere">
                                      <span className="nom-matiere">{matiere.nom}</span>
                                    </div>
                                    <div className="cellule-moyenne">
                                      <span className={`valeur-moyenne ${moyenneMatiere < 10 ? 'insuffisant' : 'satisfaisant'}`}>
                                        {moyenneMatiere > 0 ? moyenneMatiere.toFixed(2) : '-'}/20
                                      </span>
                                    </div>
                                    <div className="cellule-coefficient">
                                      <span className="valeur-coefficient">
                                        Coef: {resultat.totalCoefficient.toFixed(1)}
                                      </span>
                                    </div>
                                    <div className="cellule-appreciation">
                                      {getAppreciationMatiere(eleve.id, matiere.id)}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                        
                        <div className="section-statistiques-bulletin">
                          <div className="stats-bulletin">
                            <div className="stat-bulletin">
                              <span className="valeur-stat">{moyenneGenerale.toFixed(2)}</span>
                              <span className="label-stat">Moyenne générale</span>
                            </div>
                            <div className="stat-bulletin">
                              <span className="valeur-stat">{rang}ème</span>
                              <span className="label-stat">Rang</span>
                            </div>
                            <div className="stat-bulletin">
                              <span className="valeur-stat">{mention}</span>
                              <span className="label-stat">Mention</span>
                            </div>
                            <div className="stat-bulletin">
                              <span className="valeur-stat">
                                {calculerTotalAbsences(eleve.id, periodeBulletin)}
                              </span>
                              <span className="label-stat">Absences</span>
                            </div>
                            <div className="stat-bulletin">
                              <span className="valeur-stat">
                                {calculerTotalRetards(eleve.id, periodeBulletin)}
                              </span>
                              <span className="label-stat">Retards</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="actions-bulletin">
                        <button 
                          className="bouton-voir-complet"
                          onClick={() => voirBulletinComplet(eleve.id)}
                        >
                          👁️ Voir complet
                        </button>
                        <button 
                          className="bouton-imprimer"
                          onClick={() => imprimerBulletin(eleve.id)}
                        >
                          🖨️ Imprimer
                        </button>
                        <button 
                          className="bouton-telecharger"
                          onClick={() => telechargerBulletinPDF(eleve.id)}
                        >
                          📥 Télécharger PDF
                        </button>
                        <button 
                          className="bouton-envoyer-email"
                          onClick={() => envoyerBulletinEmail(eleve.id)}
                          title="Envoyer par email aux parents"
                        >
                          📧 Envoyer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="selection-obligatoire-bulletin">
                <div className="icone-selection">📄</div>
                <h3>Sélectionnez une classe et une période</h3>
                <p>Veuillez sélectionner une classe et une période pour générer les bulletins</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal création évaluation */}
      {modalEvaluationOuvert && (
        <div className="modal-overlay">
          <div className="modal-evaluation">
            <div className="en-tete-modal">
              <h2>Nouvelle évaluation</h2>
              <button className="bouton-fermer-modal" onClick={fermerModalEvaluation}>✕</button>
            </div>
            
            <div className="contenu-modal">
              <div className="formulaire-evaluation">
                <input
                  type="hidden"
                  name="code_evaluation"
                  value={formEvaluation.code_evaluation}
                  readOnly
                />
                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Type d'évaluation</label>
                    <select
                      name="type_evaluation"
                      value={formEvaluation.type_evaluation}
                      onChange={gererChangementEvaluation}
                      className="champ"
                    >
                      <option value="devoir">Devoir</option>
                      <option value="controle">Contrôle</option>
                      <option value="examen">Examen</option>
                      <option value="projet">Projet</option>
                      <option value="participation">Participation</option>
                      <option value="oral">Oral</option>
                    </select>
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Matière *</label>
                    <select
                      name="matiere_id"
                      value={formEvaluation.matiere_id}
                      onChange={gererChangementEvaluation}
                      className="champ">
                      <option value="0">Sélectionnez une matière</option>
                      {matieres.map(m => (
                        <option key={m.id} value={m.id}>{m.nom}</option>
                      ))}
                    </select>
                  </div>
                </div> 
                
                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Titre *</label>
                    <input
                      type="text"
                      name="titre"
                      value={formEvaluation.titre}
                      onChange={gererChangementTitreManuel}
                      className="champ"
                      placeholder="Ex: Devoir de Mathématiques"
                    />
                    <small className="texte-aide">
                      Généré automatiquement. Vous pouvez le modifier si nécessaire.
                    </small>               
                  </div>
                  <div className="sous-groupe">
                    <label>Date de l'évaluation</label>
                    <input
                      type="date"
                      name="date_evaluation"
                      value={formEvaluation.date_evaluation}
                      onChange={gererChangementEvaluation}
                      className="champ"
                    />
                  </div>
                </div>
                
                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Classe *</label>
                    <select
                      name="classe_id"
                      value={formEvaluation.classe_id}
                      onChange={gererChangementEvaluation}
                      className="champ"
                    >
                      <option value="0">Sélectionnez une classe</option>
                      {classes.map(c => (
                        <option key={c.id} value={c.id}>{c.niveau} {c.nom}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Enseignant *</label>
                    <select
                      name="enseignant_id"
                      value={formEvaluation.enseignant_id}
                      onChange={gererChangementEvaluation}
                      className="champ"
                    >
                      <option value="0">Sélectionnez un enseignant</option>
                      {enseignants.map(ens => (
                        <option key={ens.id} value={ens.id}>
                          {ens.nom_complet} {ens.specialite ? `(${ens.specialite})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Coefficient</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      name="coefficient"
                      value={formEvaluation.coefficient}
                      onChange={gererChangementEvaluation}
                      className="champ"
                    />
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Note maximale</label>
                    <select
                      name="note_maximale"
                      value={formEvaluation.note_maximale}
                      onChange={gererChangementEvaluation}
                      className="champ"
                    >
                      <option value="20">20 points</option>
                      <option value="10">10 points</option>
                      <option value="100">100 points</option>
                    </select>
                  </div>
                </div>

                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Période *</label>
                    <div className="groupe-periode">
                      <select
                        name="periode_id"
                        value={formEvaluation.periode_id}
                        onChange={gererChangementEvaluation}
                        className="champ"
                      >
                        <option value="0">Sélectionnez une période</option>
                        {periodes.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.nom} - {p.annee_scolaire}
                          </option>
                        ))}
                      </select>
                      <span className='espace'>--</span>
                      <button 
                        type="button" 
                        className="bouton-ajouter-periode"
                        onClick={ouvrirModalPeriode}
                        title="Ajouter une nouvelle période"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
                
                <input
                  type="hidden"
                  name="description"
                />             
              </div>
            </div>
            
            <div className="pied-modal">
              <button className="bouton-annuler" onClick={fermerModalEvaluation}>
                Annuler
              </button>
              <button className="bouton-sauvegarder" onClick={sauvegarderEvaluation}>
                Créer l'évaluation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal période */}
      {modalPeriodeOuvert && (
        <div className="modal-overlay">
          <div className="modal-periode">
            <div className="en-tete-modal">
              <h2>Nouvelle période scolaire</h2>
              <button className="bouton-fermer-modal" onClick={fermerModalPeriode}>✕</button>
            </div>
            
            <div className="contenu-modal">
              <div className="formulaire-periode">
                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Nom de la période *</label>
                    <input
                      type="text"
                      name="nom"
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
                      name="code_periode"
                      value={formPeriode.code_periode}
                      onChange={(e) => setFormPeriode(prev => ({ ...prev, code_periode: e.target.value }))}
                      className="champ"
                      placeholder="Ex: T1-2024"
                    />
                    <small className="texte-aide">Laissé vide pour génération automatique</small>
                  </div>
                </div>
                
                <div className="groupe-champ triple">
                  <div className="sous-groupe">
                    <label>Année scolaire *</label>
                    <input
                      type="text"
                      name="annee_scolaire"
                      value={formPeriode.annee_scolaire}
                      onChange={(e) => setFormPeriode(prev => ({ ...prev, annee_scolaire: e.target.value }))}
                      className="champ"
                      placeholder="Ex: 2024-2025"
                    />
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Type de période</label>
                    <select
                      name="type_periode"
                      value={formPeriode.type_periode}
                      onChange={(e) => setFormPeriode(prev => ({ 
                        ...prev, 
                        type_periode: e.target.value as any 
                      }))}
                      className="champ"
                    >
                      <option value="trimestre">Trimestre</option>
                      <option value="semestre">Semestre</option>
                      <option value="annuel">Annuel</option>
                      <option value="bimestre">Bimestre</option>
                      <option value="quadrimestre">Quadrimestre</option>
                    </select>
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Numéro</label>
                    <input
                      type="number"
                      name="numero"
                      value={formPeriode.numero}
                      onChange={(e) => setFormPeriode(prev => ({ 
                        ...prev, 
                        numero: parseInt(e.target.value) || 1 
                      }))}
                      className="champ"
                      min="1"
                    />
                  </div>
                </div>
                
                <div className="groupe-champ double">
                  <div className="sous-groupe">
                    <label>Date de début *</label>
                    <input
                      type="date"
                      name="date_debut"
                      value={formPeriode.date_debut}
                      onChange={(e) => setFormPeriode(prev => ({ ...prev, date_debut: e.target.value }))}
                      className="champ"
                    />
                  </div>
                  
                  <div className="sous-groupe">
                    <label>Date de fin *</label>
                    <input
                      type="date"
                      name="date_fin"
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
                      name="statut"
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
                Créer la période
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal saisie de masse */}
      {modalSaisieMasseOuvert && (
        <div className="modal-overlay">
          <div className="modal-saisie-masse">
            <div className="en-tete-modal">
              <h2>Saisie de masse</h2>
              <button className="bouton-fermer-modal" onClick={fermerSaisieMasse}>✕</button>
            </div>
            
            <div className="contenu-modal">
              <div className="instructions-saisie-masse">
                <p>Saisissez les notes pour tous les élèves de la classe.</p>
                <p>Note maximale: <strong>{formEvaluation.note_maximale}</strong><span className='espace'>------</span><span className="info-validation">⚠️ Seuls les nombres sont autorisés (ex: 15.5)</span></p>
              </div>
              
              <div className="tableau-saisie-masse">
                <div className="en-tete-tableau-masse">
                  <div className="colonne">Nom de l'élève</div>
                  <div className="colonne">Note / {formEvaluation.note_maximale}</div>
                  <div className="colonne">Appréciation</div>
                </div>
                
                <div className="corps-tableau-masse">
                  {eleves.map(eleve => (
                    <div key={eleve.id} className="ligne-saisie-masse">
                      <div className="colonne">
                        <span className="nom-eleve">{eleve.nom} {eleve.prenom}</span>
                      </div>
                      <div className="colonne">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={notesMasse[eleve.id] || '0'}
                          onChange={(e) => gererChangementNoteMasse(eleve.id, e.target.value)}
                          className="input-note-masse"
                          placeholder="0.00"
                          onBlur={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              gererChangementNoteMasse(eleve.id, '0');
                            } else {
                              const numValue = parseFloat(value);
                              if (isNaN(numValue) || numValue > formEvaluation.note_maximale) {
                                gererChangementNoteMasse(eleve.id, '0');
                              }
                            }
                          }}
                        />
                      </div>
                      <div className="colonne">
                        <input
                          type="text"
                          value={appreciationsMasse[eleve.id] || ''}
                          onChange={(e) => gererChangementAppreciationMasse(eleve.id, e.target.value)}
                          className="input-appreciation-masse"
                          placeholder="Appréciation..."
                          maxLength={100}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="pied-modal">
              <button className="bouton-annuler" onClick={fermerSaisieMasse}>
                Annuler
              </button>
              <button 
                className="bouton-sauvegarder" 
                onClick={sauvegarderNotesMasse}
                disabled={Object.keys(notesMasse).length === 0}
              >
                Sauvegarder toutes les notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}