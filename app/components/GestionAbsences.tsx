'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';
import './GestionAbsences.css';
import ModalMotifs from './ModalMotifs';
import ModalTypesAbsence from './ModalTypesAbsence';
import * as XLSX from 'xlsx';

// Interfaces pour les paramètres dynamiques
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
  date_naissance: string;
  classe_id: number;
  classe_nom?: string;
  niveau?: string;
  statut: string;
  photo_url?: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  annee_scolaire: string;
  effectif?: number;
}

interface Absence {
  id: number;
  eleve_id: number;
  date_absence: string;
  heure_debut: string | null;
  heure_fin: string | null;
  type_absence: 'absence' | 'retard' | 'sortie_anticipée' | 'exclusion';
  duree_minutes: number;
  justifiee: boolean;
  motif: string;
  piece_justificative: string | null;
  saisie_par: number;
  classe_id: number;
  cours_id: string | null;
  periode_id: number | null;
  eleve_nom?: string;
  eleve_prenom?: string;
  classe_nom?: string;
  cours_nom?: string;
  created_at: string;
  updated_at: string;
}

interface MotifAbsence {
  id: number;
  libelle: string;
  description: string;
  type_absence: string;
  justifiable: boolean;
  couleur: string;
  statut: string;
}

interface Cours {
  code_cours: string;
  nom_cours: string;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle: string;
}

interface Periode {
  id: number;
  nom: string;
  annee_scolaire: string;
  date_debut: string;
  date_fin: string;
  type_periode: string;
  statut: string;
}

interface StatsAbsence {
  total_absences: number;
  total_retards: number;
  absences_justifiees: number;
  absences_non_justifiees: number;
  total_minutes_retard: number;
  derniere_absence: string | null;
}

interface Props {
  onRetourTableauDeBord: () => void;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: {
    type: string;
    eleveId: number;
    eleveNom: string;
    absenceId?: number;
  };
}

export default function GestionAbsences({ onRetourTableauDeBord }: Props) {
  const { toasts, showSuccess, showError, showWarning, showInfo, removeToast } = useToast();

  // États principaux
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [motifs, setMotifs] = useState<MotifAbsence[]>([]);
  const [cours, setCours] = useState<Cours[]>([]);
  const [periodes, setPeriodes] = useState<Periode[]>([]);
  const [chargement, setChargement] = useState(true);
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp | null>(null);
  
  // États UI
  const [classeSelectionnee, setClasseSelectionnee] = useState<number | null>(null); 

  const [periodeSelectionnee, setPeriodeSelectionnee] = useState<number | null>(null);
  const [dateDebut, setDateDebut] = useState<string>('');
  const [dateFin, setDateFin] = useState<string>('');
  const [ongletActif, setOngletActif] = useState<'liste' | 'statistiques' | 'alertes'>('liste');
  const [vueCalendrier, setVueCalendrier] = useState<'jour' | 'semaine' | 'mois'>('semaine');
  const [filtreType, setFiltreType] = useState<string>('tous');
  const [filtreJustifiee, setFiltreJustifiee] = useState<string>('tous');
  const [rechercheEleve, setRechercheEleve] = useState<string>('');

  // Modals
  const [modalSaisieOuvert, setModalSaisieOuvert] = useState(false);
  const [modalEditionOuvert, setModalEditionOuvert] = useState(false);
  const [modalMultipleOuvert, setModalMultipleOuvert] = useState(false);
  const [modalJustificationOuvert, setModalJustificationOuvert] = useState(false);
  const [modalStatsOuvert, setModalStatsOuvert] = useState(false);
  const [soumissionEnCours, setSoumissionEnCours] = useState(false);
  const [justificationEnCours, setJustificationEnCours] = useState(false);
  const [fichierJustificatif, setFichierJustificatif] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [modalSuppressionOuvert, setModalSuppressionOuvert] = useState(false);
  const [absenceASupprimer, setAbsenceASupprimer] = useState<Absence | null>(null);
  const [modalSuppressionMultipleOuvert, setModalSuppressionMultipleOuvert] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const [modalMotifsOuvert, setModalMotifsOuvert] = useState(false);
  const [modalTypesOuvert, setModalTypesOuvert] = useState(false);
  const [typesAbsence, setTypesAbsence] = useState<any[]>([]);
    
  const [uploadJustificatif, setUploadJustificatif] = useState({
  enCours: false,
  progression: 0,
  fichier: null as File | null,
  url: null as string | null
});

  // Formulaire
  const [formAbsence, setFormAbsence] = useState<Partial<Absence>>({
    eleve_id: 0,
    date_absence: new Date().toISOString().split('T')[0],
    heure_debut: null,
    heure_fin: null,
    type_absence: 'absence',
    duree_minutes: 0,
    justifiee: false,
    motif: '',
    piece_justificative: null,
    classe_id: 0,
    cours_id: null,
    periode_id: null
  });

  // Saisie multiple
  const [elevesSelectionnes, setElevesSelectionnes] = useState<number[]>([]);
  const [absencesMultiples, setAbsencesMultiples] = useState<Partial<Absence>[]>([]);

  // Utilisateur
  const [utilisateur, setUtilisateur] = useState<any>(null);

  // Stats
  const [statsClasse, setStatsClasse] = useState<StatsAbsence>({
    total_absences: 0,
    total_retards: 0,
    absences_justifiees: 0,
    absences_non_justifiees: 0,
    total_minutes_retard: 0,
    derniere_absence: null
  });

  const preparerDonneesExport = (absencesAFiltrer: Absence[]) => {
  return absencesAFiltrer.map(absence => ({
    'Élève': `${absence.eleve_prenom || ''} ${absence.eleve_nom || ''}`.trim(),
    'Classe': absence.classe_nom || getNomClasse(absence.classe_id),
    'Date': formaterDate(absence.date_absence),
    'Type': getTypeAbsenceLabel(absence.type_absence),
    'Statut': absence.justifiee ? 'Justifiée' : 'Non justifiée',
    'Heure': absence.heure_debut ? formaterHeure(absence.heure_debut) : '-',
    'Durée': absence.duree_minutes ? formaterDuree(absence.duree_minutes) : '-',
    'Motif': absence.motif || '-',
    'Cours': absence.cours_nom || '-',
    'Pièce jointe': absence.piece_justificative ? 'Oui' : 'Non',
    'Date de saisie': formaterDate(absence.created_at || new Date().toISOString())
  }));
};

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

  const formaterHeure = (heure: string | null): string => {
    if (!heure) return '';
    return heure.substring(0, 5); // HH:MM
  };

  const formaterDuree = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const heures = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${heures}h${mins.toString().padStart(2, '0')}` : `${heures}h`;
  };

  const declencherUpload = () => {
  if (fileInputRef.current) {
    fileInputRef.current.click();
  }
};

useEffect(() => {
  chargerDonneesInitiales();
  
  try {
    const userData = localStorage.getItem('utilisateur');
    if (userData) {
      setUtilisateur(JSON.parse(userData));
    }
  } catch (e) {
    console.warn('Erreur de lecture utilisateur:', e);
  }
}, []);

// CORRECTION: Un seul useEffect pour recharger les absences quand les filtres changent
useEffect(() => {
  chargerAbsences();
}, [classeSelectionnee, periodeSelectionnee, dateDebut, dateFin, filtreType, filtreJustifiee]);

useEffect(() => {
  if (classeSelectionnee) {
    // Si une classe spécifique est sélectionnée, charger ses élèves
    chargerElevesParClasse(classeSelectionnee);
    chargerCoursParClasse(classeSelectionnee);
  } else {
    // Si "Toutes les classes" est sélectionné, charger TOUS les élèves
    chargerTousLesEleves();
    setCours([]); // Vider les cours car pas de classe spécifique
  }
}, [classeSelectionnee]);

useEffect(() => {
  console.log('🎯 Filtre justification changé:', filtreJustifiee);
  // Recharger les absences avec le nouveau filtre
  chargerAbsences();
}, [filtreJustifiee]);

const chargerDonneesInitiales = async () => {
  try {
    setChargement(true);
    
    await Promise.all([
      chargerParametresEcole(),
      chargerParametresApp(),
      chargerClasses(),
      chargerPeriodes(),
      chargerMotifsAbsence(),
      chargerTypesAbsence() // Ajoutez cette ligne
    ]);

    await chargerTousLesEleves();
    
  } catch (error) {
    console.error('Erreur chargement données initiales:', error);
    showError('Erreur lors du chargement des données');
  } finally {
    setChargement(false);
  }
};

const chargerTypesAbsence = async () => {
  try {
    const response = await fetch('/api/absences/types?statut=actif');
    const data = await response.json();
    if (data.success) {
      setTypesAbsence(data.types || []);
    }
  } catch (error) {
    console.error('Erreur chargement types:', error);
  }
};

const chargerTousLesEleves = async () => {
  try {
    console.log('🔍 Chargement de tous les élèves');
    
    const response = await fetch('/api/eleves');
    const data = await response.json();
    
    console.log('👥 Tous les élèves chargés:', data);
    
    if (data.success && data.eleves) {
      setEleves(data.eleves || []);
      setElevesSelectionnes([]);
    } else {
      console.warn('Aucun élève trouvé');
      setEleves([]);
    }
  } catch (error) {
    console.error('Erreur chargement tous les élèves:', error);
    showError('Impossible de charger les élèves');
    setEleves([]);
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
    }
  };

 const chargerClasses = async () => {
  try {
    const response = await fetch('/api/classes');
    const data = await response.json();
    console.log('📚 Classes chargées:', data);
    
    if (data.success && data.classes) {
      setClasses(data.classes || []);
      // CORRECTION: NE PAS sélectionner automatiquement la première classe
      // Laisser classeSelectionnee à null pour "Toutes les classes"
    } else {
      console.warn('Aucune classe trouvée');
    }
  } catch (error) {
    console.error('Erreur chargement classes:', error);
    showError('Impossible de charger les classes');
  }
};

  const chargerPeriodes = async () => {
  try {
    // CORRECTION: Enlever le filtre statut pour voir toutes les périodes
    const response = await fetch('/api/periodes');
    const data = await response.json();
    console.log('📅 Périodes chargées:', data); // Debug
    
    if (data.success && data.periodes) {
      setPeriodes(data.periodes || []);
      // Ne pas présélectionner automatiquement
    }
  } catch (error) {
    console.error('Erreur chargement périodes:', error);
    showError('Impossible de charger les périodes');
  }
};

const supprimerAbsencesMultiples = async () => {
  if (elevesSelectionnes.length === 0) {
    showWarning('Veuillez sélectionner au moins un élève');
    return;
  }

  const absencesAEleves = absences.filter(absence => 
    elevesSelectionnes.includes(absence.eleve_id)
  );

  if (absencesAEleves.length === 0) {
    showWarning('Aucune absence trouvée pour les élèves sélectionnés');
    return;
  }

  setModalSuppressionMultipleOuvert(true);
};

const confirmerSuppressionMultiple = async () => {
  try {
    setSuppressionEnCours(true);
    
    const absencesASupprimer = absences
      .filter(absence => elevesSelectionnes.includes(absence.eleve_id))
      .map(absence => absence.id);

    if (absencesASupprimer.length === 0) {
      showWarning('Aucune absence à supprimer');
      setModalSuppressionMultipleOuvert(false);
      return;
    }

    console.log('🗑️ Suppression multiple des absences:', absencesASupprimer);

    const response = await fetch('/api/absences/multiple', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ids: absencesASupprimer
      })
    });

    const data = await response.json();

    if (data.success) {
      showSuccess(`${absencesASupprimer.length} absence(s) supprimée(s) avec succès`);
      setModalSuppressionMultipleOuvert(false);
      setElevesSelectionnes([]); // Désélectionner tous les élèves
      await chargerAbsences(); // Recharger la liste
    } else {
      showError(data.error || 'Erreur lors de la suppression multiple');
    }
  } catch (error) {
    console.error('❌ Erreur suppression multiple:', error);
    showError('Erreur lors de la suppression multiple');
  } finally {
    setSuppressionEnCours(false);
  }
};

const gererSelectionTousAvecAbsences = () => {
  const elevesAvecAbsences = [...new Set(absences.map(a => a.eleve_id))];
  
  if (elevesSelectionnes.length === elevesAvecAbsences.length) {
    setElevesSelectionnes([]);
  } else {
    setElevesSelectionnes(elevesAvecAbsences);
  }
};

const gererSelectionNonJustifiees = () => {
  const elevesNonJustifiees = [...new Set(
    absences
      .filter(a => !a.justifiee)
      .map(a => a.eleve_id)
  )];
  setElevesSelectionnes(elevesNonJustifiees);
};

  const chargerMotifsAbsence = async () => {
    try {
      const response = await fetch('/api/absences/motifs');
      const data = await response.json();
      if (data.success && data.motifs) {
        setMotifs(data.motifs || []);
      }
    } catch (error) {
      console.error('Erreur chargement motifs:', error);
    }
  };

const chargerElevesParClasse = async (classeId: number) => {
  try {
    console.log('🔍 Chargement des élèves pour la classe:', classeId);
    
    const response = await fetch(`/api/eleves?classe_id=${classeId}`);
    const data = await response.json();
    
    console.log('👥 Élèves chargés:', data);
    
    if (data.success && data.eleves) {
      setEleves(data.eleves || []);
      setElevesSelectionnes([]);
    } else {
      console.warn('Aucun élève trouvé pour cette classe');
      setEleves([]);
    }
  } catch (error) {
    console.error('Erreur chargement élèves:', error);
    showError('Impossible de charger les élèves');
    setEleves([]);
  }
};

const chargerCoursParClasse = async (classeId: number) => {
  try {
    console.log('📚 Chargement des cours pour la classe:', classeId);
    
    // CORRECTION: Ajouter le paramètre statut=actif pour ne charger que les cours actifs
    const response = await fetch(`/api/cours?classe_id=${classeId}&statut=actif`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📚 Cours reçus:', data);
    
    if (data.success && data.cours) {
      setCours(data.cours || []);
      console.log('✅ Cours chargés:', data.cours.length);
    } else {
      console.warn('⚠️ Aucun cours trouvé pour cette classe');
      setCours([]);
    }
  } catch (error) {
    console.error('❌ Erreur chargement cours:', error);
    setCours([]);
    showError('Impossible de charger la liste des cours');
  }
};

// Dans la fonction chargerAbsences, ajoutez ces logs
  const chargerAbsences = async () => {
    try {
      const params = new URLSearchParams();
      
      console.log('🔍 État actuel des filtres:');
      console.log('   - filtreJustifiee:', filtreJustifiee);
      console.log('   - filtreType:', filtreType);
      console.log('   - classeSelectionnee:', classeSelectionnee);
      console.log('   - periodeSelectionnee:', periodeSelectionnee);
      console.log('   - dateDebut:', dateDebut);
      console.log('   - dateFin:', dateFin);
      
      // CORRECTION: N'ajouter classe_id QUE si elle est sélectionnée (et pas null)
      if (classeSelectionnee) {
        params.append('classe_id', classeSelectionnee.toString());
      }
      
      // N'ajouter periode_id que si elle est sélectionnée
      if (periodeSelectionnee) {
        params.append('periode_id', periodeSelectionnee.toString());
      }
      
      // CORRECTION IMPORTANTE: N'ajouter les dates QUE si elles sont définies
      if (dateDebut && dateDebut.trim() !== '') {
        params.append('date_debut', dateDebut);
      }
      
      if (dateFin && dateFin.trim() !== '') {
        params.append('date_fin', dateFin);
      }
      
      // Ajouter les filtres
      if (filtreType !== 'tous') {
        params.append('type', filtreType);
      }
      
      if (filtreJustifiee !== 'tous') {
        // Envoyer '1' pour justifié, '0' pour non justifié
        const valeurJustifiee = filtreJustifiee === 'oui' ? '1' : '0';
        params.append('justifiee', valeurJustifiee);
        console.log('📊 Paramètre justifiee envoyé:', valeurJustifiee);
      }

      const url = `/api/absences${params.toString() ? `?${params.toString()}` : ''}`;
      console.log('📡 URL complète:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📊 Réponse API - Nombre d\'absences:', data.absences?.length || 0);
      
      if (data.success) {
        setAbsences(data.absences || []);
        calculerStatsClasse(data.absences || []);
      } else {
        console.warn('⚠️ Aucune absence trouvée');
        setAbsences([]);
        calculerStatsClasse([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement absences:', error);
      setAbsences([]);
      showError('Erreur lors du chargement des absences');
    }
  };

    const handleResetFilters = () => {
    setFiltreType('tous');
    setFiltreJustifiee('tous');
    setDateDebut('');  // Vide pour afficher toutes les dates
    setDateFin('');    // Vide pour afficher toutes les dates
    setClasseSelectionnee(null);
    setPeriodeSelectionnee(null);
    chargerTousLesEleves();
  };

  const calculerStatsClasse = (absencesData: Absence[]) => {
  console.log('📊 Calcul des stats avec', absencesData.length, 'absences');
  
  const stats: StatsAbsence = {
    total_absences: 0,
    total_retards: 0,
    absences_justifiees: 0,
    absences_non_justifiees: 0,
    total_minutes_retard: 0,
    derniere_absence: null
  };

  absencesData.forEach(absence => {
    if (absence.type_absence === 'retard') {
      stats.total_retards++;
      stats.total_minutes_retard += absence.duree_minutes || 0;
    } else {
      stats.total_absences++;
      if (absence.justifiee) {
        stats.absences_justifiees++;
      } else {
        stats.absences_non_justifiees++;
      }
    }
  });

  if (absencesData.length > 0) {
    const dates = absencesData.map(a => new Date(a.date_absence).getTime());
    const derniereDate = new Date(Math.max(...dates));
    stats.derniere_absence = derniereDate.toISOString().split('T')[0];
  }

  console.log('✅ Stats calculées:', stats);
  setStatsClasse(stats);
};

const gererSelectionFichierJustificatif = (e: React.ChangeEvent<HTMLInputElement>) => {
  const fichier = e.target.files?.[0];
  if (fichier) {
    console.log('📁 Fichier sélectionné:', fichier.name, fichier.type, fichier.size);
    
    // Validation du type
    const typesValides = [
      'application/pdf', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (!typesValides.includes(fichier.type)) {
      showError('Format de fichier non supporté. Utilisez PDF, DOC, DOCX, JPG, PNG, GIF ou WEBP');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Validation de la taille
    if (fichier.size > 5 * 1024 * 1024) {
      showError('Le fichier ne doit pas dépasser 5MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Réinitialiser l'état avant de définir le nouveau fichier
    setUploadJustificatif({
      enCours: false,
      progression: 0,
      fichier: fichier,
      url: null
    });
    
    showInfo(`Fichier "${fichier.name}" sélectionné`);
  }
};

// Fonction pour uploader le justificatif
const uploaderJustificatif = async (absenceId: number): Promise<string | null> => {
  if (!uploadJustificatif.fichier) {
    return null;
  }

  setUploadJustificatif(prev => ({ ...prev, enCours: true, progression: 0 }));

  try {
    let fichierAEnvoyer = uploadJustificatif.fichier;
    
    // Si c'est une image, la compresser
    if (fichierAEnvoyer.type.startsWith('image/')) {
      fichierAEnvoyer = await compresserImage(fichierAEnvoyer);
    }

    const formData = new FormData();
    formData.append('fichier', fichierAEnvoyer);
    formData.append('absenceId', absenceId.toString());

    console.log('📤 Upload du fichier:', fichierAEnvoyer.name);

    const response = await fetch('/api/upload-justificatif', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      setUploadJustificatif(prev => ({ 
        ...prev, 
        progression: 100, 
        url: data.url,
        enCours: false
      }));
      
      console.log('✅ Fichier uploadé avec succès (base64)');
      return data.url;
    } else {
      throw new Error(data.error || 'Erreur upload');
    }
  } catch (error) {
    console.error('❌ Erreur upload justificatif:', error);
    showError('Erreur lors de l\'upload du justificatif');
    setUploadJustificatif(prev => ({ 
      ...prev, 
      enCours: false,
      progression: 0 
    }));
    return null;
  }
};

// Fonction de compression d'image
const compresserImage = (fichier: File): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(fichier);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Redimensionner l'image si trop grande
        let width = img.width;
        let height = img.height;
        const maxDimension = 800;
        
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          } else {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Convertir en JPEG avec qualité réduite
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const nouveauFichier = new File([blob], fichier.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(nouveauFichier);
            } else {
              reject(new Error('Échec de la compression'));
            }
          },
          'image/jpeg',
          0.7 // Qualité 70%
        );
      };
      img.onerror = () => reject(new Error('Erreur chargement image'));
    };
    reader.onerror = () => reject(new Error('Erreur lecture fichier'));
  });
};

const ouvrirModalSaisie = () => {
  const classeId = classeSelectionnee || 0;
  
  setFormAbsence({
    eleve_id: 0,
    date_absence: new Date().toISOString().split('T')[0],
    heure_debut: null,
    heure_fin: null,
    type_absence: 'absence',
    duree_minutes: 0,
    justifiee: false,
    motif: '',
    piece_justificative: null,
    classe_id: classeId,
    cours_id: null,
    periode_id: periodeSelectionnee || null
  });
  
  setCours([]);
  
  setModalSaisieOuvert(true);
};

// Dans components/GestionAbsences.tsx - Modifiez ouvrirModalEdition
const ouvrirModalEdition = async (absence: Absence) => {
  // Formater la date correctement pour l'input date (YYYY-MM-DD)
  const dateObj = new Date(absence.date_absence);
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;
  
  console.log('📅 Date originale:', absence.date_absence);
  console.log('📅 Date formatée:', formattedDate);
  
  setFormAbsence({
    id: absence.id,
    eleve_id: absence.eleve_id,
    date_absence: formattedDate,
    heure_debut: absence.heure_debut || null,
    heure_fin: absence.heure_fin || null,
    type_absence: absence.type_absence,
    duree_minutes: absence.duree_minutes || 0,
    justifiee: absence.justifiee,
    motif: absence.motif,
    piece_justificative: absence.piece_justificative || null,
    classe_id: absence.classe_id,
    cours_id: absence.cours_id || null,
    periode_id: absence.periode_id || null
  });
  
  // Charger les cours de la classe de l'absence
  await chargerCoursParClasse(absence.classe_id);
  
  setModalEditionOuvert(true);
};

  const ouvrirModalMultiple = () => {
    if (elevesSelectionnes.length === 0) {
      showWarning('Veuillez sélectionner au moins un élève');
      return;
    }

    const absencesMultiplesData = elevesSelectionnes.map(eleveId => ({
      eleve_id: eleveId,
      date_absence: new Date().toISOString().split('T')[0],
      heure_debut: null,
      heure_fin: null,
      type_absence: 'absence' as const,
      duree_minutes: 0,
      justifiee: false,
      motif: '',
      classe_id: classeSelectionnee || 0,
      periode_id: periodeSelectionnee || null
    }));

    setAbsencesMultiples(absencesMultiplesData);
    setModalMultipleOuvert(true);
  };

  const ouvrirModalJustification = (absence: Absence) => {
    setFormAbsence({ ...absence });
    setModalJustificationOuvert(true);
  };

  const fermerModal = () => {
    setModalSaisieOuvert(false);
    setModalEditionOuvert(false);
    setModalMultipleOuvert(false);
    setModalJustificationOuvert(false);
    setFormAbsence({});
  };

  const gererChangementForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let newValue: any = value;
    
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'eleve_id' || name === 'classe_id' || name === 'periode_id' || name === 'duree_minutes') {
      newValue = value ? parseInt(value) : 0;
    } else if (name === 'heure_debut' || name === 'heure_fin') {
      newValue = value || null;
    }
    
    setFormAbsence(prev => ({
      ...prev,
      [name]: newValue
    }));
  };

  const gererChangementMotif = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const motifId = parseInt(e.target.value);
    const motifSelectionne = motifs.find(m => m.id === motifId);
    
    if (motifSelectionne) {
      setFormAbsence(prev => ({
        ...prev,
        motif: motifSelectionne.libelle,
        justifiable: motifSelectionne.justifiable
      }));
    }
  };

  const validerFormulaire = (): boolean => {
    if (!formAbsence.eleve_id || formAbsence.eleve_id === 0) {
      showError('Veuillez sélectionner un élève');
      return false;
    }

    if (!formAbsence.date_absence) {
      showError('La date est requise');
      return false;
    }

    if (!formAbsence.motif || formAbsence.motif.trim() === '') {
      showError('Veuillez sélectionner un motif');
      return false;
    }

    if (formAbsence.type_absence === 'retard' && (!formAbsence.heure_debut || formAbsence.duree_minutes === 0)) {
      showError('Pour un retard, veuillez préciser l\'heure et la durée');
      return false;
    }

    return true;
  };

  const sauvegarderAbsence = async (estEdition: boolean = false) => {
    if (!validerFormulaire()) return;

    try {
      const absenceData = {
        ...formAbsence,
        saisie_par: utilisateur?.id || 0
      };

      const url = estEdition ? `/api/absences/${formAbsence.id}` : '/api/absences';
      const method = estEdition ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(absenceData)
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(estEdition ? 'Absence modifiée avec succès' : 'Absence enregistrée avec succès');
        fermerModal();
        chargerAbsences();
      } else {
        showError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur sauvegarde absence:', error);
      showError('Erreur lors de l\'enregistrement');
    }
  };

const handleEleveChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
  const eleveId = parseInt(e.target.value);
  
  // Trouver l'élève sélectionné
  const eleve = eleves.find(e => e.id === eleveId);
  
  setFormAbsence(prev => ({
    ...prev,
    eleve_id: eleveId,
    classe_id: eleve ? eleve.classe_id : (classeSelectionnee || 0)
  }));
  
  // Charger les cours de la classe de l'élève
  if (eleve) {
    await chargerCoursParClasse(eleve.classe_id);
  }
};

  const sauvegarderAbsencesMultiples = async () => {
    if (absencesMultiples.length === 0) return;

    try {
      const absencesValides = absencesMultiples.filter(absence => 
        absence.eleve_id && absence.eleve_id > 0 && absence.motif && absence.motif.trim() !== ''
      );

      if (absencesValides.length === 0) {
        showError('Aucune absence valide à enregistrer');
        return;
      }

      const response = await fetch('/api/absences/multiple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          absences: absencesValides.map(absence => ({
            ...absence,
            saisie_par: utilisateur?.id || 0
          }))
        })
      });

      const data = await response.json();
      if (data.success) {
        showSuccess(`${absencesValides.length} absences enregistrées avec succès`);
        setModalMultipleOuvert(false);
        setAbsencesMultiples([]);
        setElevesSelectionnes([]);
        chargerAbsences();
      } else {
        showError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur sauvegarde multiple:', error);
      showError('Erreur lors de l\'enregistrement');
    }
  };

// Dans components/GestionAbsences.tsx
const justifierAbsence = async () => {
  if (!formAbsence.id) {
    showError('Aucune absence sélectionnée');
    return;
  }

  try {
    setSoumissionEnCours(true);
    
    let pieceUrl = formAbsence.piece_justificative;
    
    if (uploadJustificatif.fichier) {
      pieceUrl = await uploaderJustificatif(formAbsence.id);
      if (!pieceUrl) {
        showError('Erreur lors de l\'upload du justificatif');
        setSoumissionEnCours(false);
        return;
      }
    }

    // Envoyer 1 pour true, 0 pour false
    const payload = {
      justifiee: formAbsence.justifiee ? 1 : 0,
      piece_justificative: pieceUrl
    };

    console.log('📤 Envoi justification avec pièce jointe (base64)');

    const response = await fetch(`/api/absences/${formAbsence.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (data.success) {
      showSuccess('Absence justifiée avec succès');
      fermerModal();
      setUploadJustificatif({ enCours: false, progression: 0, fichier: null, url: null });
      await chargerAbsences();
      setFormAbsence({});
    } else {
      showError(data.error || 'Erreur lors de la justification');
    }
  } catch (error) {
    console.error('❌ Erreur justification:', error);
    showError('Erreur lors de la justification');
  } finally {
    setSoumissionEnCours(false);
  }
};
const supprimerAbsence = (absence: Absence) => {
  setAbsenceASupprimer(absence);
  setModalSuppressionOuvert(true);
};

const confirmerSuppression = async () => {
  if (!absenceASupprimer) return;

  try {
    const response = await fetch(`/api/absences/${absenceASupprimer.id}`, {
      method: 'DELETE'
    });

    const data = await response.json();
    if (data.success) {
      showSuccess('Absence supprimée avec succès');
      setModalSuppressionOuvert(false);
      setAbsenceASupprimer(null);
      await chargerAbsences();
    } else {
      showError(data.error || 'Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('Erreur suppression absence:', error);
    showError('Erreur lors de la suppression');
  }
};

  const gererSelectionEleve = (eleveId: number) => {
    setElevesSelectionnes(prev => {
      if (prev.includes(eleveId)) {
        return prev.filter(id => id !== eleveId);
      } else {
        return [...prev, eleveId];
      }
    });
  };

  const gererSelectionTous = () => {
    if (elevesSelectionnes.length === eleves.length) {
      setElevesSelectionnes([]);
    } else {
      setElevesSelectionnes(eleves.map(e => e.id));
    }
  };

  const gererChangementAbsenceMultiple = (index: number, champ: string, valeur: any) => {
    setAbsencesMultiples(prev => {
      const nouvellesAbsences = [...prev];
      nouvellesAbsences[index] = {
        ...nouvellesAbsences[index],
        [champ]: valeur
      };
      return nouvellesAbsences;
    });
  };

// Fonction pour exporter en Excel
const exporterExcel = () => {
  try {
    showInfo('Préparation de l\'export Excel...');
    
    // Récupérer les absences filtrées
    const absencesAFiltrer = getAbsencesFiltrees;
    
    if (absencesAFiltrer.length === 0) {
      showWarning('Aucune donnée à exporter');
      return;
    }
    
    // Préparer les données
    const donnees = preparerDonneesExport(absencesAFiltrer);
    
    // Créer le classeur Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(donnees);
    
    // Ajuster la largeur des colonnes
    const colWidths = [
      { wch: 30 }, // Élève
      { wch: 20 }, // Classe
      { wch: 15 }, // Date
      { wch: 15 }, // Type
      { wch: 15 }, // Statut
      { wch: 10 }, // Heure
      { wch: 10 }, // Durée
      { wch: 30 }, // Motif
      { wch: 20 }, // Cours
      { wch: 12 }, // Pièce jointe
      { wch: 15 }  // Date de saisie
    ];
    ws['!cols'] = colWidths;
    
    // Ajouter la feuille au classeur
    XLSX.utils.book_append_sheet(wb, ws, 'Absences');
    
    // Générer le fichier
    const nomFichier = `absences_${formaterDate(new Date().toISOString()).replace(/\//g, '-')}.xlsx`;
    XLSX.writeFile(wb, nomFichier);
    
    showSuccess(`Export Excel réussi : ${absencesAFiltrer.length} absence(s) exportée(s)`);
    
  } catch (error) {
    console.error('❌ Erreur export Excel:', error);
    showError('Erreur lors de l\'export Excel');
  }
};

// Fonction pour imprimer
const imprimerListe = () => {
  try {
    showInfo('Préparation de l\'impression...');
    
    // Récupérer les absences filtrées
    const absencesAFiltrer = getAbsencesFiltrees;
    
    if (absencesAFiltrer.length === 0) {
      showWarning('Aucune donnée à imprimer');
      return;
    }
    
    // Calculer les statistiques pour le rapport
    const stats = {
      total: absencesAFiltrer.length,
      justifiees: absencesAFiltrer.filter(a => a.justifiee).length,
      nonJustifiees: absencesAFiltrer.filter(a => !a.justifiee).length,
      retards: absencesAFiltrer.filter(a => a.type_absence === 'retard').length,
      absences: absencesAFiltrer.filter(a => a.type_absence === 'absence').length,
      sorties: absencesAFiltrer.filter(a => a.type_absence === 'sortie_anticipée').length,
      exclusions: absencesAFiltrer.filter(a => a.type_absence === 'exclusion').length
    };
    
    // Créer le contenu HTML pour l'impression
    const contenuImpression = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Liste des absences</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
          }
          .entete {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
          }
          .entete h1 {
            color: #2563eb;
            margin: 0 0 10px 0;
            font-size: 24px;
          }
          .entete h2 {
            color: #4b5563;
            margin: 0;
            font-size: 18px;
            font-weight: normal;
          }
          .infos-impression {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 15px;
            background: #f3f4f6;
            border-radius: 8px;
            font-size: 14px;
          }
          .statistiques {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
          }
          .stat {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          .stat .valeur {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
          }
          .stat .label {
            font-size: 13px;
            color: #6b7280;
            margin-top: 5px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
          }
          th {
            background: #2563eb;
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 500;
          }
          td {
            padding: 10px 8px;
            border-bottom: 1px solid #e5e7eb;
          }
          tr:nth-child(even) {
            background: #f9fafb;
          }
          .justifie {
            color: #059669;
            font-weight: 500;
          }
          .non-justifie {
            color: #dc2626;
            font-weight: 500;
          }
          .type-absence {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
          }
          .type-absence.absence { background: #fee2e2; color: #991b1b; }
          .type-absence.retard { background: #fef3c7; color: #92400e; }
          .type-absence.sortie_anticipée { background: #dbeafe; color: #1e40af; }
          .type-absence.exclusion { background: #f3e8ff; color: #6b21a8; }
          .pied-page {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="entete">
          <h1>${parametresEcole?.nom_ecole || 'Établissement scolaire'}</h1>
          <h2>Liste des absences</h2>
          ${parametresEcole?.slogan ? `<p>${parametresEcole.slogan}</p>` : ''}
        </div>
        
        <div class="infos-impression">
          <div><strong>Période :</strong> ${formaterDate(dateDebut)} - ${formaterDate(dateFin)}</div>
          <div><strong>Classe :</strong> ${classeSelectionnee ? getNomClasse(classeSelectionnee) : 'Toutes les classes'}</div>
          <div><strong>Date d'impression :</strong> ${formaterDate(new Date().toISOString())}</div>
        </div>
        
        <div class="statistiques">
          <div class="stat">
            <div class="valeur">${stats.total}</div>
            <div class="label">Total absences</div>
          </div>
          <div class="stat">
            <div class="valeur">${stats.justifiees}</div>
            <div class="label">Justifiées</div>
          </div>
          <div class="stat">
            <div class="valeur">${stats.nonJustifiees}</div>
            <div class="label">Non justifiées</div>
          </div>
          <div class="stat">
            <div class="valeur">${stats.retards}</div>
            <div class="label">Retards</div>
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Élève</th>
              <th>Classe</th>
              <th>Date</th>
              <th>Type</th>
              <th>Statut</th>
              <th>Heure</th>
              <th>Motif</th>
              <th>Cours</th>
            </tr>
          </thead>
          <tbody>
            ${absencesAFiltrer.map(absence => `
              <tr>
                <td><strong>${absence.eleve_prenom || ''} ${absence.eleve_nom || ''}</strong></td>
                <td>${absence.classe_nom || getNomClasse(absence.classe_id)}</td>
                <td>${formaterDate(absence.date_absence)}</td>
                <td>
                  <span class="type-absence ${absence.type_absence}">
                    ${getTypeAbsenceLabel(absence.type_absence)}
                  </span>
                </td>
                <td class="${absence.justifiee ? 'justifie' : 'non-justifie'}">
                  ${absence.justifiee ? '✓ Justifiée' : '✗ Non justifiée'}
                </td>
                <td>${absence.heure_debut ? formaterHeure(absence.heure_debut) : '-'}</td>
                <td>${absence.motif || '-'}</td>
                <td>${absence.cours_nom || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="pied-page">
          <p>Document généré le ${formaterDate(new Date().toISOString())} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
          <p>Total : ${stats.total} absence(s) • ${stats.justifiees} justifiée(s) • ${stats.nonJustifiees} non justifiée(s)</p>
        </div>
        
        <div class="no-print" style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer;">
            🖨️ Imprimer
          </button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; margin-left: 10px;">
            ✕ Fermer
          </button>
        </div>
        
        <script>
          // Impression automatique après chargement (optionnel)
          // window.onload = () => { setTimeout(() => window.print(), 500); };
        </script>
      </body>
      </html>
    `;
    
    // Ouvrir une nouvelle fenêtre pour l'impression
    const fenetreImpression = window.open('', '_blank');
    if (fenetreImpression) {
      fenetreImpression.document.write(contenuImpression);
      fenetreImpression.document.close();
      
      // Focus sur la nouvelle fenêtre
      fenetreImpression.focus();
      
      showSuccess('Prêt pour l\'impression');
    } else {
      showError('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez que votre navigateur n\'a pas bloqué les pop-ups.');
    }
    
  } catch (error) {
    console.error('❌ Erreur impression:', error);
    showError('Erreur lors de la préparation de l\'impression');
  }
};


  const getNomEleve = (eleveId: number): string => {
    const eleve = eleves.find(e => e.id === eleveId);
    return eleve ? `${eleve.prenom} ${eleve.nom}` : 'Élève inconnu';
  };

  const getNomClasse = (classeId: number): string => {
    const classe = classes.find(c => c.id === classeId);
    return classe ? `${classe.nom} (${classe.niveau})` : 'Classe inconnue';
  };

  const getNomPeriode = (periodeId: number): string => {
    const periode = periodes.find(p => p.id === periodeId);
    return periode ? `${periode.nom} ${periode.annee_scolaire}` : 'Période inconnue';
  };

  const getMotifsParType = (type: string) => {
    return motifs.filter(m => m.type_absence === type && m.statut === 'actif');
  };

  const getTypeAbsenceLabel = (type: string): string => {
    const labels: Record<string, string> = {
      'absence': 'Absence',
      'retard': 'Retard',
      'sortie_anticipée': 'Sortie anticipée',
      'exclusion': 'Exclusion'
    };
    return labels[type] || type;
  };

  const getTypeAbsenceColor = (type: string): string => {
    const colors: Record<string, string> = {
      'absence': '#EF4444',
      'retard': '#F59E0B',
      'sortie_anticipée': '#3B82F6',
      'exclusion': '#DC2626'
    };
    return colors[type] || '#64748b';
  };

  const getElevesFiltres = useMemo(() => {
    if (!rechercheEleve) return eleves;
    
    const recherche = rechercheEleve.toLowerCase();
    return eleves.filter(eleve =>
      eleve.nom.toLowerCase().includes(recherche) ||
      eleve.prenom.toLowerCase().includes(recherche) ||
      `${eleve.prenom} ${eleve.nom}`.toLowerCase().includes(recherche)
    );
  }, [eleves, rechercheEleve]);

  // Dans GestionAbsences.tsx, ajoutez cette fonction
const getAbsencesFiltrees = useMemo(() => {
  let filtrees = absences;

  // Filtre par type
  if (filtreType !== 'tous') {
    filtrees = filtrees.filter(a => a.type_absence === filtreType);
  }

  // CORRECTION: Filtre par justification côté client
  if (filtreJustifiee !== 'tous') {
    const justifieeBool = filtreJustifiee === 'oui';
    filtrees = filtrees.filter(a => {
      // Conversion robuste sans erreur TypeScript
      // On convertit d'abord en nombre, puis en booléen
      const valeurJustifiee = Number(a.justifiee);
      const estJustifiee = valeurJustifiee === 1;
      return estJustifiee === justifieeBool;
    });
    console.log(`🔍 Filtre côté client: ${filtreJustifiee} -> ${filtrees.length} résultats`);
  }

  return filtrees;
}, [absences, filtreType, filtreJustifiee]);

  const getStatsEleve = (eleveId: number) => {
    const absencesEleve = absences.filter(a => a.eleve_id === eleveId);
    
    const stats = {
      total: 0,
      justifiees: 0,
      nonJustifiees: 0,
      retards: 0,
      minutesRetard: 0
    };

    absencesEleve.forEach(absence => {
      if (absence.type_absence === 'retard') {
        stats.retards++;
        stats.minutesRetard += absence.duree_minutes || 0;
      } else {
        stats.total++;
        if (absence.justifiee) {
          stats.justifiees++;
        } else {
          stats.nonJustifiees++;
        }
      }
    });

    return stats;
  };

  if (chargement) {
    return (
      <div className={`chargement-absences ${parametresApp?.theme_defaut || 'clair'}`}>
        <div className="spinner-grand"></div>
        <p>Chargement du module des absences...</p>
      </div>
    );
  }

  return (
    <div className={`conteneur-gestion-absences ${parametresApp?.theme_defaut || 'clair'}`}>
      {/* Toasts */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* En-tête */}
      <div className="en-tete-fixe-eleves">
        <div className="conteneur-en-tete-fixe-eleves">
          <div className="titre-fixe-eleves">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>📋</span> 
              <h1>
                Gestion des absences
              </h1>
            </div>
          </div>

          <div className="actions-fixes-eleves">
             <div className="actions-synchronisation">
              <button className="bouton-nouvelle-absence" onClick={ouvrirModalSaisie}>
                <span className="icone-ajouter">+</span>
                Nouvelle absence
              </button>
              
              {elevesSelectionnes.length > 0 && (
                <button className="bouton-absence-multiple" onClick={ouvrirModalMultiple}>
                  <span className="icone-multiple">👥</span>
                  Absence multiple ({elevesSelectionnes.length})
                </button>
              )}
              
              {/* Nouveaux boutons d'export */}
              <button 
                className="bouton-sauvegarder" 
                onClick={exporterExcel}
                title="Exporter en Excel"
              >
                <span className="icone-excel">📊</span>
                Excel
              </button>
              
              <button 
                className="bouton-imprimer" 
                onClick={imprimerListe}
                title="Imprimer la liste"
              >
                <span className="icone-imprimer">🖨️</span>
                Imprimer
              </button>

              <button className="bouton-reinitialiser" onClick={handleResetFilters}>
                🔄 Réinitialiser
              </button>
          </div>
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="statistiques-rapides-abs">
        <div className="carte-statistique-rapide">
          <div className="icone-stat-abs">📅</div>
          <div className="contenu-stat">
            <div className="valeur-stat-abs">{statsClasse.total_absences}</div>
            <div className="label-stat">Absences totales</div>
          </div>
        </div>
        
        <div className="carte-statistique-rapide">
          <div className="icone-stat-abs">⏰</div>
          <div className="contenu-stat">
            <div className="valeur-stat-abs">{statsClasse.total_retards}</div>
            <div className="label-stat">Retards</div>
          </div>
        </div>
        
        <div className="carte-statistique-rapide">
          <div className="icone-stat-abs">✅</div>
          <div className="contenu-stat">
            <div className="valeur-stat-abs">{statsClasse.absences_justifiees}</div>
            <div className="label-stat">Justifiées</div>
          </div>
        </div>
        
        <div className="carte-statistique-rapide">
          <div className="icone-stat-abs">❌</div>
          <div className="contenu-stat">
            <div className="valeur-stat-abs">{statsClasse.absences_non_justifiees}</div>
            <div className="label-stat">Non justifiées</div>
          </div>
        </div>
        
        <div className="carte-statistique-rapide">
          <div className="icone-stat-abs">🕒</div>
          <div className="contenu-stat">
            <div className="valeur-stat-abs">{formaterDuree(statsClasse.total_minutes_retard)}</div>
            <div className="label-stat">Minutes de retard</div>
          </div>
        </div>
      </div>

      {/* Navigation par onglets */}
      <div className="navigation-onglets-absences">
        <button 
          className={`onglet-absence ${ongletActif === 'liste' ? 'actif' : ''}`}
          onClick={() => setOngletActif('liste')}
        >
          📋 Liste
        </button>
        <button 
          className={`onglet-absence ${ongletActif === 'statistiques' ? 'actif' : ''}`}
          onClick={() => setOngletActif('statistiques')}
        >
          📈 Statistiques
        </button>
      </div>

      {/* Filtres et contrôles */}
      <div className="controles-absences">
        <div className="filtres-principaux-abs">
          <div className="groupe-filtre">
            <label className="label-filtre">Classe</label>
            <select 
              value={classeSelectionnee || ''}
              onChange={(e) => {
                const value = e.target.value;
                setClasseSelectionnee(value ? parseInt(value) : null);
                // Charger les élèves seulement si une classe spécifique est sélectionnée
                if (value) {
                  chargerElevesParClasse(parseInt(value));
                } else {
                  setEleves([]);
                }
              }}
              className="select-filtre-abs"
            >
              <option value="">Toutes les classes</option>
              {classes.map(classe => (
                <option key={classe.id} value={classe.id}>
                  {classe.nom} ({classe.niveau})
                </option>
              ))}
            </select>
          </div>
                    
          <div className="groupe-filtre">
          <label className="label-filtre">Type</label>
          <div className="filtre-avec-bouton">
            <select 
              value={filtreType}
              onChange={(e) => setFiltreType(e.target.value)}
              className="select-filtre-abs"
            >
              <option value="tous">Tous les types</option>
              {typesAbsence.map(type => (
                <option key={type.id} value={type.code}>
                  {type.icone} {type.libelle}
                </option>
              ))}
            </select>
            <button 
              type="button"
              className="bouton-gestion-filtre"
              onClick={() => setModalTypesOuvert(true)}
              title="Gérer les types"
            >
              ⚙️
            </button>
          </div>
        </div>
          
          <div className="groupe-filtre">
            <label className="label-filtre">Justification</label>
            <select 
              value={filtreJustifiee}
              onChange={(e) => setFiltreJustifiee(e.target.value)}
              className="select-filtre-abs"
            >
              <option value="tous">Toutes</option>
              <option value="oui">Justifiées</option>
              <option value="non">Non justifiées</option>
            </select>
          </div>
          
          <div className="groupe-filtre double">
            <div className="sous-groupe">
              <label className="label-filtre">Du</label>
              <input
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
                className="input-date"
              />
            </div>
            
            <div className="sous-groupe">
              <label className="label-filtre">Au</label>
              <input
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
                className="input-date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu selon l'onglet actif */}
      <div className="contenu-absences">
        {ongletActif === 'liste' && (
          <div className="vue-liste">
            <div className="liste-eleves-abs">
              <div className="en-tete-liste-eleves">
                <h3>Élèves de la classe</h3>
                <div className="recherche-eleves">
                  <input
                    type="text"
                    placeholder="Rechercher un élève..."
                    value={rechercheEleve}
                    onChange={(e) => setRechercheEleve(e.target.value)}
                    className="input-recherche"
                  />
                  <span className="icone-recherche">🔍</span>
                </div>
              </div>

              <div className="actions-liste-eleves">                
                <div className="boutons-actions-multiples">
                  {elevesSelectionnes.length > 0 && (
                    <>
                      <button 
                        className="bouton-absence-multiple" 
                        onClick={ouvrirModalMultiple}
                        title="Ajouter une absence pour les élèves sélectionnés"
                      >
                        + Ajouter
                      </button>
                      
                      <button 
                        className="bouton-supprimer-multiple" 
                        onClick={supprimerAbsencesMultiples}
                        title="Supprimer les absences des élèves sélectionnés"
                      >
                        🗑️ Supprimer
                      </button>

                      <span style={{fontSize: '14px', fontWeight: '400', color: '#83898f'}}>{elevesSelectionnes.length} élève(s) sélectionné(s)</span>
                    </>
                  )}
                </div>
              </div>             

               <div className="en-tete-tableau-eleves-abs">
                  <div className="colonne-abs selection">
                    <input
                    type="checkbox"
                    id="select-all"
                    checked={elevesSelectionnes.length === eleves.length && eleves.length > 0}
                    onChange={gererSelectionTous}
                    className="checkbox-eleve"
                  /></div>
                  <div style={{fontSize: '14px', fontWeight: '600', color: '#83898f', margin: '10px', width: '140px'}}>Nom</div>
                  <div style={{fontSize: '14px', fontWeight: '600', color: '#83898f', margin: '10px'}}>Absence</div>
                </div>
              <div className="tableau-eleves-abs">                
                <div className="corps-tableau-eleves">
                  {getElevesFiltres.map(eleve => {
                    const stats = getStatsEleve(eleve.id);
                    return (
                      <div key={eleve.id} className="ligne-eleve-abs">
                        <div className="colonne-abs">
                          <input
                            type="checkbox"
                            checked={elevesSelectionnes.includes(eleve.id)}
                            onChange={() => gererSelectionEleve(eleve.id)}
                            className="checkbox-eleve"
                          />
                        </div>
                        
                        <div className="colonne-abs">
                          <div className="">
                            <div className="details-eleve">
                              <span className="nom-complet">{eleve.prenom} {eleve.nom}</span>
                              <span className="classe-eleve">{eleve.classe_nom || getNomClasse(eleve.classe_id)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="colonne absences">
                          <div className="stats-absences">
                            <span className="stat-justifiee" title="Justifiées">
                             <span style={{margin: '8px'}}> ✅ {stats.justifiees}</span> <span>❌ {stats.nonJustifiees} </span>  
                             <button 
                                className="bouton-ajouter-absence"
                                title='Ajouter une nouvelle absence'
                                onClick={() => {
                                  // Utiliser la même structure que l'ajout normal
                                  setFormAbsence({
                                    eleve_id: eleve.id,
                                    date_absence: new Date().toISOString().split('T')[0],
                                    heure_debut: null,
                                    heure_fin: null,
                                    type_absence: 'absence',
                                    duree_minutes: 0,
                                    justifiee: false,
                                    motif: '',
                                    piece_justificative: null,
                                    classe_id: eleve.classe_id,
                                    cours_id: null,
                                    periode_id: periodeSelectionnee
                                  });
                                  setModalSaisieOuvert(true);
                                }}
                              >
                                + 
                              </button>
                          </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="liste-absences">
              <div className="en-tete-liste-absences">
                <h3>Absences enregistrées</h3>
                <div className="info-stats">
                  <span className="total-absences">
                    {getAbsencesFiltrees.length} absence(s)
                  </span>
                </div>
              </div>
              
              {getAbsencesFiltrees.length === 0 ? (
                <div className="aucune-absence">
                  <div className="icone-aucune-absence">📅</div>
                  <h4>Aucune absence trouvée</h4>
                  <p>Aucune absence ne correspond à vos critères de recherche</p>
                </div>
              ) : (
                <div className="tableau-absences">
                  {getAbsencesFiltrees.map(absence => (
                    <div key={absence.id} className="carte-absence">
                      <div className="en-tete-carte-absence">
                        <div className="info-absence">
                          <div className="type-absence" style={{ backgroundColor: getTypeAbsenceColor(absence.type_absence) }}>
                            {getTypeAbsenceLabel(absence.type_absence)}
                          </div>
                          <div className={`statut-justification ${absence.justifiee ? 'justifiee' : 'non-justifiee'}`}>
                            {absence.justifiee ? '✅ Justifiée' : '❌ Non justifiée'}
                          </div>
                        </div>
                        
                        <div className="actions-carte-absence">
                          {!absence.justifiee && (
                            <button 
                              className="bouton-justifier"
                              onClick={() => ouvrirModalJustification(absence)}
                              title="Justifier"
                            >
                              ✅
                            </button>
                          )}
                          <button 
                            className="bouton-modifier"
                            onClick={() => ouvrirModalEdition(absence)}
                            title="Modifier"
                          >
                            ✏️
                          </button>

                        <button 
                          className="bouton-supprimer"
                          onClick={() => supprimerAbsence(absence)}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                        </div>
                      </div>
                      
                      <div className="corps-carte-absence">
                      <div className="info-eleve-absence">
                        <div className="nom-eleve-absence">
                          <strong>{absence.eleve_prenom} {absence.eleve_nom}</strong>
                          {/* AJOUT : Affichage de la classe */}
                          <span className="classe-eleve-absence">
                            {absence.classe_nom || getNomClasse(absence.classe_id)}
                          </span>
                        </div>
                        <div className="details-absence">
                          <span className="date-absence">
                            📅 {formaterDate(absence.date_absence)}
                          </span>
                          {absence.heure_debut && (
                            <span className="heure-absence">
                              ⏰ {formaterHeure(absence.heure_debut)}
                              {absence.type_absence === 'retard' && absence.duree_minutes > 0 && (
                                <span> ({formaterDuree(absence.duree_minutes)})</span>
                              )}
                            </span>
                          )}
                          {absence.cours_nom && (
                            <span className="cours-absence">
                              📚 {absence.cours_nom}
                            </span>
                          )}
                        </div>
                      </div>
  
                      <div className="motif-absence">
                        <span className="label-motif">Motif : </span>
                        <span className="texte-motif">{absence.motif}</span>
                      </div>
                      
                      <div className="pied-carte-absence">
                      <span className="date-saisie">
                        Saisie le {formaterDate(absence.created_at || new Date())}
                      </span>
                      
                      {/* MODIFICATION : Transformer "Pièce jointe" en lien cliquable */}
                      {absence.piece_justificative && (
                        <a 
                          href={absence.piece_justificative} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="lien-piece-justificative"
                          onClick={(e) => e.stopPropagation()}
                          title="Ouvrir le justificatif"
                        >
                          <span className="icone-piece">📎</span>
                          <span className="texte-piece">Pièce jointe</span>
                          <span className="indicateur-telechargement">⬇️</span>
                        </a>
                      )}
                    </div>
                    </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {ongletActif === 'statistiques' && (
          <div className="vue-statistiques">
            <div className="en-tete-statistiques">
              <h2>Statistiques des absences</h2>
              <div className="periode-statistiques">
                <span className="label-periode">Période:</span>
                <span className="valeur-periode">
                  {periodeSelectionnee ? getNomPeriode(periodeSelectionnee) : 'Toutes périodes'}
                </span>
              </div>
            </div>
            
            <div className="graphiques-statistiques">
              <div className="carte-graphique">
                <h3>Répartition par type</h3>
                <div className="graphique-camembert">
                  <div className="legende-graphique">
                    {['absence', 'retard', 'sortie_anticipée', 'exclusion'].map(type => {
                      const count = absences.filter(a => a.type_absence === type).length;
                      const percentage = absences.length > 0 ? (count / absences.length) * 100 : 0;
                      return (
                        <div key={type} className="item-legende-graphique">
                          <div 
                            className="couleur-item" 
                            style={{ backgroundColor: getTypeAbsenceColor(type) }}
                          ></div>
                          <span className="label-item">{getTypeAbsenceLabel(type)}</span>
                          <span className="valeur-item">{count} ({percentage.toFixed(1)}%)</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <div className="carte-graphique">
                <h3>Évolution hebdomadaire</h3>
                <div className="graphique-barres">
                  <div className="barres-container">
                    {[1, 2, 3, 4, 5].map(semaine => {
                      const count = Math.floor(Math.random() * 10);
                      return (
                        <div key={semaine} className="barre-semaine">
                          <div 
                            className="barre" 
                            style={{ height: `${count * 10}px` }}
                          ></div>
                          <span className="label-semaine">Sem {semaine}</span>
                          <span className="valeur-semaine">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="tableau-statistiques">
              <h3>Détail par élève</h3>
              <div className="tableau-detail">
                <div className="en-tete-tableau-detail">
                  <div className="colonne">Élève</div>
                  <div className="colonne">Absences</div>
                  <div className="colonne">Justifiées</div>
                  <div className="colonne">Non justifiées</div>
                  <div className="colonne">Retards</div>
                  <div className="colonne">Durée retard</div>
                </div>
                
                <div className="corps-tableau-detail">
                  {eleves.map(eleve => {
                    const stats = getStatsEleve(eleve.id);
                    if (stats.total === 0 && stats.retards === 0) return null;
                    
                    return (
                      <div key={eleve.id} className="ligne-detail">
                        <div className="colonne">
                          <span className="nom-eleve-detail">{eleve.prenom} {eleve.nom}</span>
                        </div>
                        <div className="colonne">
                          <span className={`valeur ${stats.total === 0 ? 'zero' : ''}`}>
                            {stats.total}
                          </span>
                        </div>
                        <div className="colonne">
                          <span className="valeur justifiee">{stats.justifiees}</span>
                        </div>
                        <div className="colonne">
                          <span className="valeur non-justifiee">{stats.nonJustifiees}</span>
                        </div>
                        <div className="colonne">
                          <span className={`valeur ${stats.retards === 0 ? 'zero' : ''}`}>
                            {stats.retards}
                          </span>
                        </div>
                        <div className="colonne">
                          <span className="valeur">{formaterDuree(stats.minutesRetard)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal saisie d'absence */}
      {modalSaisieOuvert && (
  <div className="modal-overlay" onClick={fermerModal}>
    <div className="modal-absence" onClick={(e) => e.stopPropagation()}>
      <div className="en-tete-modal">
        <h2>Nouvelle absence</h2>
        <button className="bouton-fermer-modal" onClick={fermerModal}>✕</button>
      </div>
      
      <div className="contenu-modal">
        <form onSubmit={(e) => { e.preventDefault(); sauvegarderAbsence(false); }} className="formulaire-absence">
          <div className="groupe-champ-abs">
          <label className="label-champ">Élève *</label>
          <select
            name="eleve_id"
            value={formAbsence.eleve_id || 0}
            onChange={handleEleveChange}  // Utilisez la nouvelle fonction
            className="champ"
            required
          >
            <option value="0">Sélectionnez un élève</option>
            {eleves.map(eleve => (
              <option key={eleve.id} value={eleve.id}>
                {eleve.prenom} {eleve.nom} - {eleve.classe_nom || getNomClasse(eleve.classe_id)}
              </option>
            ))}
          </select>
        </div>

          <div className="groupe-champ-abs">
            <label className="label-champ">Date *</label>
            <input
              type="date"
              name="date_absence"
              value={formAbsence.date_absence || ''}
              onChange={gererChangementForm}
              className="champ"
              required
            />
          </div>
          
          <div className="groupe-champ-abs">
            <label className="label-champ">Type *</label>
            <div className="champ-avec-bouton">
              <select
                name="type_absence"
                value={formAbsence.type_absence || 'absence'}
                onChange={gererChangementForm}
                className="champ"
                required
              >
                {typesAbsence.map(type => (
                  <option key={type.id} value={type.code}>
                    {type.icone} {type.libelle}
                  </option>
                ))}
              </select>
              <button 
                type="button"
                className="bouton-gestion"
                onClick={() => setModalTypesOuvert(true)}
                title="Gérer les types d'absence"
              >
                ⚙️
              </button>
            </div>
          </div>
          
          {formAbsence.type_absence === 'retard' && (
            <div className="groupe-champ-abs double">
              <div className="sous-groupe">
                <label className="label-champ">Heure de début</label>
                <input
                  type="time"
                  name="heure_debut"
                  value={formAbsence.heure_debut || ''}
                  onChange={gererChangementForm}
                  className="champ"
                />
              </div>
              
              <div className="sous-groupe">
                <label className="label-champ">Durée (minutes)</label>
                <input
                  type="number"
                  name="duree_minutes"
                  value={formAbsence.duree_minutes || 0}
                  onChange={gererChangementForm}
                  className="champ"
                  min="0"
                  max="480"
                />
              </div>
            </div>
          )}
          
          <div className="groupe-champ-abs">
            <label className="label-champ">Motif *</label>
            <div className="champ-avec-bouton">
              <select
                name="motif_select"
                onChange={gererChangementMotif}
                className="champ"
                required
                value={motifs.findIndex(m => m.libelle === formAbsence.motif) + 1 || ''}
              >
                <option value="">Sélectionnez un motif</option>
                {getMotifsParType(formAbsence.type_absence || 'absence').map(motif => (
                  <option key={motif.id} value={motif.id}>
                    {motif.libelle}
                  </option>
                ))}
              </select>
              <button 
                type="button"
                className="bouton-gestion"
                onClick={() => setModalMotifsOuvert(true)}
                title="Gérer les motifs d'absence"
              >
                ⚙️
              </button>
            </div>
            <input
              type="hidden"
              name="motif"
              value={formAbsence.motif || ''}
              onChange={gererChangementForm}
            />
          </div>
          
          <div className="groupe-champ-abs">
            <label className="label-champ">Cours concerné (optionnel)</label>
            <select
              name="cours_id"
              value={formAbsence.cours_id || ''}
              onChange={gererChangementForm}
              className="champ"
            >
              <option value="">Aucun cours spécifique</option>
              {cours && cours.length > 0 ? (
                cours.map(c => (
                  <option key={c.code_cours} value={c.code_cours}>
                    {c.nom_cours} - {c.jour_semaine} {c.heure_debut.substring(0,5)}-{c.heure_fin.substring(0,5)} {c.salle ? `(${c.salle})` : ''}
                  </option>
                ))
              ) : (
                <option value="" disabled>Aucun cours disponible pour cette classe</option>
              )}
            </select>
          </div>
                    
          {formAbsence.justifiee && (
            <div className="groupe-champ-abs">
              <label className="label-champ">Pièce justificative</label>
              <input
                type="text"
                name="piece_justificative"
                value={formAbsence.piece_justificative || ''}
                onChange={gererChangementForm}
                className="champ"
                placeholder="Référence ou description de la pièce"
              />
            </div>
          )}
          
          <div className="pied-modal">
            <button type="button" className="bouton-annuler" onClick={fermerModal}>
              Annuler
            </button>
            <button type="submit" className="bouton-sauvegarder">
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

      {/* Modal édition d'absence */}
      {modalEditionOuvert && (
  <div className="modal-overlay" onClick={fermerModal}>
    <div className="modal-absence" onClick={(e) => e.stopPropagation()}>
      <div className="en-tete-modal">
        <h2>Modifier l'absence</h2>
        <button className="bouton-fermer-modal" onClick={fermerModal}>✕</button>
      </div>
      
      <div className="contenu-modal">
        <form onSubmit={(e) => { e.preventDefault(); sauvegarderAbsence(true); }} className="formulaire-absence">
          <div className="groupe-champ-abs">
            <label className="label-champ">Élève</label>
            <div className="champ-static">
              {formAbsence.eleve_id ? getNomEleve(formAbsence.eleve_id) : ''}
            </div>
          </div>
          
          <div className="groupe-champ-abs">
            <label className="label-champ">Date *</label>
            <input
              type="date"
              name="date_absence"
              value={formAbsence.date_absence || ''}
              onChange={gererChangementForm}
              className="champ"
              required
            />
          </div>
          
          <div className="groupe-champ-abs">
            <label className="label-champ">Type *</label>
            <select
              name="type_absence"
              value={formAbsence.type_absence || 'absence'}
              onChange={gererChangementForm}
              className="champ"
              required
            >
              <option value="absence">Absence</option>
              <option value="retard">Retard</option>
              <option value="sortie_anticipée">Sortie anticipée</option>
              <option value="exclusion">Exclusion</option>
            </select>
          </div>
          
          {formAbsence.type_absence === 'retard' && (
            <div className="groupe-champ-abs double">
              <div className="sous-groupe">
                <label className="label-champ">Heure de début</label>
                <input
                  type="time"
                  name="heure_debut"
                  value={formAbsence.heure_debut || ''}
                  onChange={gererChangementForm}
                  className="champ"
                />
              </div>
              
              <div className="sous-groupe">
                <label className="label-champ">Durée (minutes)</label>
                <input
                  type="number"
                  name="duree_minutes"
                  value={formAbsence.duree_minutes || 0}
                  onChange={gererChangementForm}
                  className="champ"
                  min="0"
                  max="480"
                />
              </div>
            </div>
          )}
          
          <div className="groupe-champ-abs">
            <label className="label-champ">Motif *</label>
            <input
              type="text"
              name="motif"
              value={formAbsence.motif || ''}
              onChange={gererChangementForm}
              className="champ"
              required
            />
          </div>
          
          <div className="groupe-champ-abs">
            <label className="label-champ">Cours concerné</label>
            <select
              name="cours_id"
              value={formAbsence.cours_id || ''}
              onChange={gererChangementForm}
              className="champ"
            >
              <option value="">Aucun cours spécifique</option>
              {cours && cours.length > 0 ? (
                cours.map(c => (
                  <option key={c.code_cours} value={c.code_cours}>
                    {c.nom_cours} - {c.jour_semaine} {c.heure_debut.substring(0,5)}-{c.heure_fin.substring(0,5)} {c.salle ? `(${c.salle})` : ''}
                  </option>
                ))
              ) : (
                <option value="" disabled>Aucun cours disponible pour cette classe</option>
              )}
            </select>
          </div>
                    
          {formAbsence.justifiee && (
            <div className="groupe-champ-abs">
              <label className="label-champ">Pièce justificative</label>
              <input
                type="text"
                name="piece_justificative"
                value={formAbsence.piece_justificative || ''}
                onChange={gererChangementForm}
                className="champ"
                placeholder="Référence ou description de la pièce"
              />
            </div>
          )}
          
          <div className="pied-modal">
            <button type="button" className="bouton-annuler" onClick={fermerModal}>
              Annuler
            </button>
            <button type="submit" className="bouton-sauvegarder">
              Modifier
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
)}

      {/* Modal absence multiple */}
      {modalMultipleOuvert && (
        <div className="modal-overlay" onClick={() => setModalMultipleOuvert(false)}>
          <div className="modal-absence-multiple" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal">
              <h2>Absence multiple</h2>
              <button className="bouton-fermer-modal" onClick={() => setModalMultipleOuvert(false)}>✕</button>
            </div>
            
            <div className="contenu-modal">
              <div className="instructions-multiple">
                <p>Saisie d'absence pour {elevesSelectionnes.length} élève(s) sélectionné(s)</p>
              </div>
              
              <div className="formulaire-multiple">
                <div className="groupe-champ-multiple">
                  <label className="label-champ">Date *</label>
                  <input
                    type="date"
                    value={absencesMultiples[0]?.date_absence || new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setAbsencesMultiples(prev => 
                        prev.map(absence => ({ ...absence, date_absence: newDate }))
                      );
                    }}
                    className="champ"
                    required
                  />
                </div>
                
                <div className="groupe-champ-multiple">
                  <label className="label-champ">Type *</label>
                  <select
                    value={absencesMultiples[0]?.type_absence || 'absence'}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      setAbsencesMultiples(prev => 
                        prev.map(absence => ({ ...absence, type_absence: newType }))
                      );
                    }}
                    className="champ"
                    required
                  >
                    <option value="absence">Absence</option>
                    <option value="retard">Retard</option>
                    <option value="sortie_anticipée">Sortie anticipée</option>
                    <option value="exclusion">Exclusion</option>
                  </select>
                </div>
                
                <div className="groupe-champ-multiple">
                  <label className="label-champ">Motif *</label>
                  <select
                    onChange={(e) => {
                      const motifId = parseInt(e.target.value);
                      const motifSelectionne = motifs.find(m => m.id === motifId);
                      if (motifSelectionne) {
                        setAbsencesMultiples(prev => 
                          prev.map(absence => ({ 
                            ...absence, 
                            motif: motifSelectionne.libelle 
                          }))
                        );
                      }
                    }}
                    className="champ"
                    required
                  >
                    <option value="">Sélectionnez un motif</option>
                    {motifs.map(motif => (
                      <option key={motif.id} value={motif.id}>
                        {motif.libelle}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="liste-eleves-multiple">
                  {absencesMultiples.map((absence, index) => {
                    const eleve = eleves.find(e => e.id === absence.eleve_id);
                    if (!eleve) return null;
                    
                    return (
                      <div key={eleve.id} className="eleve-multiple">
                        <div className="info-eleve-multiple">
                          <span className="nom-eleve-multiple">{eleve.prenom} {eleve.nom}</span>
                        </div>
                        
                        <div className="motif-eleve-multiple">
                          <input
                            type="text"
                            value={absence.motif || ''}
                            onChange={(e) => gererChangementAbsenceMultiple(index, 'motif', e.target.value)}
                            className="input-motif-multiple"
                            placeholder="Motif spécifique..."
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="pied-modal">
              <button className="bouton-annuler" onClick={() => setModalMultipleOuvert(false)}>
                Annuler
              </button>
              <button className="bouton-sauvegarder" onClick={sauvegarderAbsencesMultiples}>
                Enregistrer toutes les absences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal justification */}
        {modalJustificationOuvert && (
          <div className="modal-overlay" onClick={fermerModal}>
            <div className="modal-justification" onClick={(e) => e.stopPropagation()}>
              <div className="en-tete-modal">
                <h2>Justifier une absence</h2>
                <button className="bouton-fermer-modal" onClick={fermerModal}>✕</button>
              </div>
              
              <div className="contenu-modal">
                <div className="info-absence-justification">
                  <div className="eleve-info">
                    <strong>{formAbsence.eleve_id ? getNomEleve(formAbsence.eleve_id) : ''}</strong>
                    <span className="date-absence">
                      {formAbsence.date_absence ? formaterDate(formAbsence.date_absence) : ''}
                    </span>
                    <span className="motif-absence">{formAbsence.motif}</span>
                    {formAbsence.piece_justificative && (
                      <div className="fichier-existant">
                        <span>📎 Fichier actuel: {formAbsence.piece_justificative.split('/').pop()}</span>
                        <a 
                          href={formAbsence.piece_justificative} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="lien-fichier"
                        >
                          Voir
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="formulaire-justification">
                  {/* Case à cocher pour la justification */}
                  <div className="groupe-champ-abs">
                    <label className="label-champ label-checkbox">
                      <input
                        type="checkbox"
                        checked={formAbsence.justifiee || false}
                        onChange={(e) => {
                          setFormAbsence(prev => ({
                            ...prev,
                            justifiee: e.target.checked
                          }));
                        }}
                        className="checkbox"
                      /> <span> Absence justifiée</span>
                    </label>
                  </div>
                  
                  {/* Zone d'upload - Version corrigée */}
                  <div className="groupe-champ-abs">
                    <label className="label-champ">Pièce justificative (PDF, image, document)</label>
                    <div className="zone-upload" onClick={declencherUpload}>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={gererSelectionFichierJustificatif}
                        className="input-fichier"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp"
                        style={{ display: 'none' }} // Cacher l'input natif
                      />
                      <div className="info-upload">
                        <span className="texte-upload">📎 Cliquez pour ajouter un fichier</span>
                        <span className="aide-upload">PDF, DOC, Images (max 5MB)</span>
                      </div>
                    </div>
                    
                    {/* Affichage de la progression d'upload */}
                    {uploadJustificatif.enCours && (
                      <div className="progression-upload">
                        <div className="barre-progression">
                          <div 
                            className="progression" 
                            style={{ width: `${uploadJustificatif.progression}%` }}
                          ></div>
                        </div>
                        <span className="texte-progression">{uploadJustificatif.progression}%</span>
                      </div>
                    )}
                    
                    {/* Affichage du fichier sélectionné */}
                    {uploadJustificatif.fichier && !uploadJustificatif.enCours && (
                      <div className="fichier-selectionne">
                        <span>📄 {uploadJustificatif.fichier.name}</span>
                        <button 
                          type="button"
                          className="bouton-supprimer-fichier"
                          onClick={() => {
                            setUploadJustificatif({
                              enCours: false,
                              progression: 0,
                              fichier: null,
                              url: null
                            });
                            if (fileInputRef.current) {
                              fileInputRef.current.value = '';
                            }
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    
                    {/* Affichage du fichier uploadé avec succès */}
                    {uploadJustificatif.url && (
                      <div className="fichier-uploaded">
                        <span>✅ Fichier uploadé: {uploadJustificatif.fichier?.name}</span>
                        <a 
                          href={uploadJustificatif.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="lien-fichier"
                        >
                          Voir le fichier
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="pied-modal">
                    <button type="button" className="bouton-annuler" onClick={fermerModal}>
                      Annuler
                    </button>
                    <button 
                      type="button"
                      className="bouton-sauvegarder"
                      onClick={justifierAbsence}
                      disabled={soumissionEnCours || uploadJustificatif.enCours}
                    >
                      {soumissionEnCours ? 'En cours...' : 'Justifier l\'absence'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {modalSuppressionOuvert && absenceASupprimer && (
          <div className="modal-overlay" onClick={() => setModalSuppressionOuvert(false)}>
            <div className="modal-absence" onClick={(e) => e.stopPropagation()}>
              <div style={{ backgroundColor: '#dc2626', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px' }}>
                <h2>Confirmer la suppression</h2>
                <button className="bouton-fermer-modal" onClick={() => setModalSuppressionOuvert(false)}>✕</button>
              </div>
              
              <div className="contenu-modal">
                <div className="icone-confirmation" style={{ textAlign: 'center', fontSize: '48px', margin: '2px 0' }}>
                  ⚠️
                </div>
                <p style={{ textAlign: 'center', fontSize: '16px', marginBottom: '20px' }}>
                  Êtes-vous sûr de vouloir supprimer cette absence ?
                </p>
                
                <div className="details-suppression" style={{ 
                  backgroundColor: '#f3f4f6', 
                  padding: '15px', 
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <p><strong>Élève :</strong> {absenceASupprimer.eleve_prenom} {absenceASupprimer.eleve_nom}</p>
                  <p><strong>Date :</strong> {formaterDate(absenceASupprimer.date_absence)}</p>
                  <p><strong>Type :</strong> {getTypeAbsenceLabel(absenceASupprimer.type_absence)}</p>
                  <p><strong>Motif :</strong> {absenceASupprimer.motif}</p>
                </div>
                
                <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                  Cette action est irréversible.
                </p>
              </div>
              
              <div className="pied-modal" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  className="bouton-annuler-abs" 
                  onClick={() => setModalSuppressionOuvert(false)}
                >
                  Annuler
                </button>
                <button 
                  className="bouton-supprimer-abs" 
                  onClick={confirmerSuppression}
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}


          {modalSuppressionMultipleOuvert && (
            <div className="modal-overlay" onClick={() => setModalSuppressionMultipleOuvert(false)}>
               <div className="modal-absence" onClick={(e) => e.stopPropagation()}>
              <div style={{ backgroundColor: '#dc2626', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px' }}>
                  <h2>Confirmer la suppression multiple</h2>
                  <button 
                    className="bouton-fermer-modal" 
                    onClick={() => setModalSuppressionMultipleOuvert(false)}
                  >
                    ✕
                  </button>
                </div>
                
                <div className="contenu-modal">
                  <div className="icone-confirmation" style={{ textAlign: 'center', fontSize: '48px', margin: '20px 0' }}>
                    ⚠️
                  </div>
                  
                  <p style={{ textAlign: 'center', fontSize: '16px', marginBottom: '20px' }}>
                    Êtes-vous sûr de vouloir supprimer toutes les absences des élèves sélectionnés ?
                  </p>
                  
                  <div className="details-suppression" style={{ 
                    backgroundColor: '#f3f4f6', 
                    padding: '15px', 
                    borderRadius: '8px',
                    marginBottom: '20px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    <p><strong>Élèves sélectionnés :</strong> {elevesSelectionnes.length}</p>
                    <p><strong>Absences concernées :</strong> {
                      absences.filter(a => elevesSelectionnes.includes(a.eleve_id)).length
                    }</p>
                    
                    <div style={{ marginTop: '10px' }}>
                      <strong>Liste des élèves :</strong>
                      <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
                        {elevesSelectionnes.map(eleveId => {
                          const eleve = eleves.find(e => e.id === eleveId);
                          const nbAbsences = absences.filter(a => a.eleve_id === eleveId).length;
                          return (
                            <li key={eleveId}>
                              {eleve?.prenom} {eleve?.nom} - {nbAbsences} absence(s)
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                  
                  <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                    Cette action est irréversible.
                  </p>
                </div>
                
                <div className="pied-modal" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button 
                    className="bouton-annuler" 
                    onClick={() => setModalSuppressionMultipleOuvert(false)}
                    disabled={suppressionEnCours}
                  >
                    Annuler
                  </button>
                  <button 
                    className="bouton-supprimer-abs" 
                    onClick={confirmerSuppressionMultiple}
                    disabled={suppressionEnCours}
                  >
                    {suppressionEnCours ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal de gestion des motifs */}
<ModalMotifs
  isOpen={modalMotifsOuvert}
  onClose={() => setModalMotifsOuvert(false)}
  onMotifChange={() => {
    chargerMotifsAbsence();
    // Recharger les motifs dans le formulaire si nécessaire
    if (formAbsence.type_absence) {
      setFormAbsence(prev => ({ ...prev, motif: '' }));
    }
  }}
  typeAbsence={formAbsence.type_absence || 'tous'}
/>

{/* Modal de gestion des types d'absence */}
<ModalTypesAbsence
  isOpen={modalTypesOuvert}
  onClose={() => setModalTypesOuvert(false)}
  onTypeChange={() => {
    chargerTypesAbsence();
    // Mettre à jour le type dans le formulaire si nécessaire
  }}
/>
    </div>
  );
}