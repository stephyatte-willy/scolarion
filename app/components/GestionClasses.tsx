'use client';

import { useState, useEffect } from 'react';
import { Classe, FiltresClasses } from '../services/classesService';
import './GestionClasses.css';

interface Props {
  onRetourTableauDeBord: () => void;
}

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

interface TriColonneModal {
  colonne: keyof any | null;
  ordre: 'asc' | 'desc';
}

interface SelectionMultipleModal {
  elevesSelectionnes: number[];
  selectionTous: boolean;
}

interface DossierPhysique {
  url: string;
  nomOriginal: string;
  taille: number;
  type: string;
  date: string;
}

interface EleveClasse {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance?: string;
  genre: 'M' | 'F';
  adresse?: string;
  telephone?: string;
  email?: string;
  nom_pere?: string;
  nom_mere?: string;
  telephone_parent?: string;
  classe_id?: number;
  photo_url?: string;
  dossiers_physiques?: DossierPhysique[];
  statut: 'actif' | 'inactif' | 'diplome' | 'abandon';
  date_inscription: string;
  nom_classe?: string;
  niveau_classe?: string;
}

interface Alerte {
  type: 'success' | 'error';
  message: string;
}

export default function GestionClasses({ onRetourTableauDeBord }: Props) {
  // États pour les paramètres
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp | null>(null);

  // États existants
  const [classes, setClasses] = useState<Classe[]>([]);
  const [professeurs, setProfesseurs] = useState<any[]>([]);
  const [niveaux, setNiveaux] = useState<string[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modalDetailOuvert, setModalDetailOuvert] = useState(false);
  const [modalSuppressionOuvert, setModalSuppressionOuvert] = useState(false);
  const [classeSelectionnee, setClasseSelectionnee] = useState<Classe | null>(null);
  const [classeASupprimer, setClasseASupprimer] = useState<Classe | null>(null);
  const [elevesClasse, setElevesClasse] = useState<any[]>([]);
  const [filtres, setFiltres] = useState<FiltresClasses>({});
  const [statistiques, setStatistiques] = useState<any>(null);
  const [modalElevesOuvert, setModalElevesOuvert] = useState(false);
  const [classePourEleves, setClassePourEleves] = useState<Classe | null>(null);

  // États pour le formulaire
  const [formData, setFormData] = useState({
    nom: '',
    niveau: '',
    professeur_principal_id: '' as string | number
  });

  // États pour la gestion des erreurs
  const [erreurFormulaire, setErreurFormulaire] = useState('');

  // États pour le tri et la sélection
  const [tri, setTri] = useState<TriColonneModal>({ colonne: null, ordre: 'asc' });
  const [selectionEleves, setSelectionEleves] = useState<SelectionMultipleModal>({
    elevesSelectionnes: [],
    selectionTous: false
  });

  // ÉTAT POUR LA SÉLECTION MULTIPLE DES CLASSES
  const [selectionClasses, setSelectionClasses] = useState<{
    classesSelectionnees: number[];
    selectionTous: boolean;
  }>({
    classesSelectionnees: [],
    selectionTous: false
  });

  const [modalSuppressionMultipleOuvert, setModalSuppressionMultipleOuvert] = useState(false);
  const [alerte, setAlerte] = useState<Alerte | null>(null);
  const [soumissionEnCours, setSoumissionEnCours] = useState(false);

  // Variables supplémentaires pour la modale de détail
  const [triModal, setTriModal] = useState<TriColonneModal>({ colonne: null, ordre: 'asc' });
  const [selectionModal, setSelectionModal] = useState<SelectionMultipleModal>({
    elevesSelectionnes: [],
    selectionTous: false
  });
  const [chargementElevesClasse, setChargementElevesClasse] = useState(false);

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

  // Appliquer le thème via une classe CSS
  const getThemeClass = (): string => {
    return parametresApp?.theme_defaut || 'clair';
  };

  // ==================== CHARGEMENT DES DONNÉES ====================

  useEffect(() => {
    chargerDonneesInitiales();
  }, []);

  useEffect(() => {
    chargerDonnees();
  }, [filtres]);

  useEffect(() => {
    if (alerte) {
      const timer = setTimeout(() => {
        setAlerte(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [alerte]);

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
    }
  };

  // Ajouter cette fonction vers la fin des fonctions utilitaires (vers ligne 450-460)
// Fonction pour vérifier si parmi les classes sélectionnées, certaines ont des élèves
const verifierClassesAvecEleves = (): boolean => {
  if (selectionClasses.classesSelectionnees.length === 0) return false;
  
  return selectionClasses.classesSelectionnees.some(id => {
    const classe = classes.find(c => c.id === id);
    return classe && classe.nombre_eleves && classe.nombre_eleves > 0;
  });
};

// Fonction pour obtenir le nombre total d'élèves dans les classes sélectionnées
const getTotalElevesSelectionnes = (): number => {
  return selectionClasses.classesSelectionnees.reduce((total, id) => {
    const classe = classes.find(c => c.id === id);
    return total + (classe?.nombre_eleves || 0);
  }, 0);
};

  const chargerDonnees = async () => {
    setChargement(true);
    try {
      const [classesResponse, professeursResponse, niveauxResponse] = await Promise.all([
        fetch(`/api/classes?${new URLSearchParams(filtres as any)}`),
        fetch('/api/classes/professeurs'),
        fetch('/api/classes/niveaux')
      ]);

      const classesData = await classesResponse.json();
      const professeursData = await professeursResponse.json();
      const niveauxData = await niveauxResponse.json();

      if (classesData.success) setClasses(classesData.classes);
      if (professeursData.success) setProfesseurs(professeursData.professeurs);
      if (niveauxData.success) setNiveaux(niveauxData.niveaux);
      
      // Réinitialiser la sélection après chargement
      setSelectionClasses({ classesSelectionnees: [], selectionTous: false });
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setChargement(false);
    }
  };

  // ==================== FONCTIONS DE GESTION DE SÉLECTION MULTIPLE ====================

  // Gérer la sélection/déselection d'une classe
  const gererSelectionClasse = (id: number) => {
    setSelectionClasses(prev => {
      const classesSelectionnees = prev.classesSelectionnees.includes(id)
        ? prev.classesSelectionnees.filter(classeId => classeId !== id)
        : [...prev.classesSelectionnees, id];
      
      return {
        ...prev,
        classesSelectionnees,
        selectionTous: classesSelectionnees.length === classes.length
      };
    });
  };

  // Gérer la sélection/déselection de toutes les classes
  const gererSelectionTous = () => {
    setSelectionClasses(prev => {
      const selectionTous = !prev.selectionTous;
      const classesSelectionnees = selectionTous 
        ? classes.map(classe => classe.id)
        : [];
      
      return {
        ...prev,
        selectionTous,
        classesSelectionnees
      };
    });
  };

  // Vérifier si une classe est sélectionnée
  const estClasseSelectionnee = (id: number): boolean => {
    return selectionClasses.classesSelectionnees.includes(id);
  };

  // Obtenir les classes sélectionnées
  const obtenirClassesSelectionnees = () => {
    return classes.filter(classe => 
      selectionClasses.classesSelectionnees.includes(classe.id)
    );
  };

  // ==================== FONCTIONS DE GESTION ====================

  const gererChangementFiltre = (key: keyof FiltresClasses, value: any) => {
    setFiltres(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const reinitialiserFiltres = () => {
    setFiltres({});
  };

  const ouvrirModal = (classe?: Classe) => {
    setErreurFormulaire('');
    if (classe) {
      setClasseSelectionnee(classe);
      setFormData({
        nom: classe.nom,
        niveau: classe.niveau,
        professeur_principal_id: classe.professeur_principal_id || ''
      });
    } else {
      setClasseSelectionnee(null);
      setFormData({
        nom: '',
        niveau: '',
        professeur_principal_id: ''
      });
    }
    setModalOuvert(true);
  };

  const fermerModal = () => {
    setModalOuvert(false);
    setClasseSelectionnee(null);
    setErreurFormulaire('');
  };

  const fermerModalDetail = () => {
    setModalDetailOuvert(false);
    setClasseSelectionnee(null);
    setElevesClasse([]);
  };

  const ouvrirModalSuppression = (classe: Classe) => {
    setClasseASupprimer(classe);
    setModalSuppressionOuvert(true);
  };

  const fermerModalSuppression = () => {
    setModalSuppressionOuvert(false);
    setClasseASupprimer(null);
  };

  const ouvrirModalSuppressionMultiple = () => {
  if (selectionClasses.classesSelectionnees.length === 0) {
    setAlerte({ type: 'error', message: 'Veuillez sélectionner au moins une classe à supprimer' });
    return;
  }
  
  // Vérifier si des classes avec élèves sont sélectionnées
  const classesAvecEleves = selectionClasses.classesSelectionnees.filter(id => {
    const classe = classes.find(c => c.id === id);
    return classe && classe.nombre_eleves && classe.nombre_eleves > 0;
  });
  
  if (classesAvecEleves.length > 0) {
    const nomsClassesAvecEleves = classesAvecEleves.map(id => {
      const classe = classes.find(c => c.id === id);
      return `${classe?.niveau} ${classe?.nom}`;
    }).join(', ');
    
    setAlerte({ 
      type: 'error', 
      message: `❌ Suppression impossible - ${classesAvecEleves.length} classe(s) contiennent des élèves : ${nomsClassesAvecEleves}. Veuillez d'abord transférer ou désactiver les élèves.` 
    });
    return;
  }
  
  setModalSuppressionMultipleOuvert(true);
};

  const fermerModalSuppressionMultiple = () => {
    setModalSuppressionMultipleOuvert(false);
  };

  const gererChangementFormulaire = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'nom') {
      setFormData(prev => ({
        ...prev,
        [name]: value.toUpperCase()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (name === 'niveau') {
      const ancienNiveau = formData.niveau;
      const nouveauNiveau = value;
      
      const ancienEstPrimaire = estNiveauPrimaire(ancienNiveau);
      const nouveauEstPrimaire = estNiveauPrimaire(nouveauNiveau);
      
      if (ancienEstPrimaire !== nouveauEstPrimaire) {
        setFormData(prev => ({
          ...prev,
          professeur_principal_id: ''
        }));
        
        setAlerte({ 
          type: 'success', 
          message: `Niveau changé. Le ${getLibelleProfesseur(nouveauNiveau).toLowerCase()} a été réinitialisé.` 
        });
      }
    }
    
    setErreurFormulaire('');
  };

  const gererTri = (colonne: keyof any) => {
    setTri(prev => ({
      colonne,
      ordre: prev.colonne === colonne && prev.ordre === 'asc' ? 'desc' : 'asc'
    }));
  };

  const classesTriees = [...classes].sort((a, b) => {
    if (!tri.colonne) return 0;
    
    const aValue = a[tri.colonne as keyof Classe];
    const bValue = b[tri.colonne as keyof Classe];
    
    if (aValue === undefined || bValue === undefined) return 0;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return tri.ordre === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return tri.ordre === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  const soumettreFormulaire = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (soumissionEnCours) return;
     
    if (!formData.niveau) {
      setErreurFormulaire('Le niveau est requis');
      setAlerte({ type: 'error', message: 'Le niveau est requis' });
      return;
    }

    setSoumissionEnCours(true);

    try {
      const url = classeSelectionnee 
        ? `/api/classes/${classeSelectionnee.id}`
        : '/api/classes';
      
      const method = classeSelectionnee ? 'PUT' : 'POST';
      
      console.log('📤 Envoi données:', { url, method, formData });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          professeur_principal_id: formData.professeur_principal_id ? parseInt(formData.professeur_principal_id as string) : null
        })
      });

      console.log('📡 Statut réponse:', response.status);
      const data = await response.json();
      console.log('📥 Réponse API:', data);

      if (data.success) {
        fermerModal();
        await chargerDonnees();
        
        setAlerte({ 
          type: 'success', 
          message: classeSelectionnee 
            ? `🎉 Classe mise à jour avec succès ! ✨` 
            : `🎉 Nouvelle classe créée avec succès ! 🎓`
        });
      } else {
        const messageErreur = data.erreur || 'Erreur lors de l\'opération';
        setErreurFormulaire(messageErreur);
        setAlerte({ type: 'error', message: `❌ ${messageErreur}` });
      }
    } catch (error) {
      console.error('❌ Erreur soumission formulaire:', error);
      const messageErreur = 'Erreur de connexion au serveur';
      setErreurFormulaire(messageErreur);
      setAlerte({ type: 'error', message: `❌ ${messageErreur}` });
    } finally {
      setSoumissionEnCours(false);
    }
  };

  const supprimerClasse = async () => {
    if (!classeASupprimer) {
      console.error('❌ Aucune classe à supprimer');
      return;
    }

    if (!classeASupprimer.id || isNaN(classeASupprimer.id) || classeASupprimer.id <= 0) {
      console.error('❌ ID invalide pour suppression:', classeASupprimer.id);
      setAlerte({ type: 'error', message: 'ID de classe invalide pour la suppression' });
      fermerModalSuppression();
      return;
    }

    try {
      const url = `/api/classes/${classeASupprimer.id}`;
      console.log('🗑️ Tentative suppression - URL:', url);
      console.log('🏫 Classe à supprimer:', classeASupprimer.nom, '- Niveau:', classeASupprimer.niveau);
      
      const response = await fetch(url, {
        method: 'DELETE'
      });

      console.log('📡 Statut réponse suppression:', response.status);
      const resultat = await response.json();
      console.log('📥 Réponse suppression:', resultat);

      if (resultat.success) {
        fermerModalSuppression();
        await chargerDonnees();
        setAlerte({ type: 'success', message: `Classe supprimée avec succès ! 🗑️` });
      } else {
        const messageErreur = resultat.erreur || 'Erreur lors de la suppression';
        console.error('❌ Erreur suppression:', messageErreur);
        setAlerte({ type: 'error', message: messageErreur });
        fermerModalSuppression();
      }
    } catch (error) {
      console.error('❌ Erreur réseau lors de la suppression:', error);
      setAlerte({ type: 'error', message: 'Erreur de connexion au serveur' });
      fermerModalSuppression();
    }
  };

  const supprimerClassesMultiple = async () => {
  if (selectionClasses.classesSelectionnees.length === 0) return;

  try {
    setSoumissionEnCours(true);
    
    const classesAvecEleves = [];
    const classesASupprimer = [];
    
    // D'abord, vérifier quelles classes peuvent être supprimées
    for (const id of selectionClasses.classesSelectionnees) {
      const classe = classes.find(c => c.id === id);
      if (classe && classe.nombre_eleves && classe.nombre_eleves > 0) {
        classesAvecEleves.push(classe);
      } else {
        classesASupprimer.push(id);
      }
    }
    
    if (classesAvecEleves.length > 0) {
      setAlerte({ 
        type: 'error', 
        message: `❌ Impossible de supprimer ${classesAvecEleves.length} classe(s) contenant des élèves` 
      });
      setSelectionClasses({ classesSelectionnees: [], selectionTous: false });
      fermerModalSuppressionMultiple();
      setSoumissionEnCours(false);
      return;
    }
    
    if (classesASupprimer.length === 0) {
      setAlerte({ type: 'error', message: 'Aucune classe valide à supprimer' });
      fermerModalSuppressionMultiple();
      setSoumissionEnCours(false);
      return;
    }
    
    // Effectuer les suppressions une par une pour mieux gérer les erreurs
    const suppressionsReussies = [];
    const suppressionsEchouees = [];
    
    for (const id of classesASupprimer) {
      try {
        const response = await fetch(`/api/classes/${id}`, { 
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const resultat = await response.json();
        
        if (response.ok && resultat.success) {
          suppressionsReussies.push(id);
        } else {
          suppressionsEchouees.push(id);
        }
      } catch (error) {
        console.error(`❌ Erreur suppression classe ${id}:`, error);
        suppressionsEchouees.push(id);
      }
    }

    // Message de résultat
    if (suppressionsReussies.length > 0) {
      setAlerte({ 
        type: 'success', 
        message: `🎉 ${suppressionsReussies.length} classe(s) supprimée(s) avec succès !` 
      });
    }
    
    if (suppressionsEchouees.length > 0) {
      setAlerte({ 
        type: 'error', 
        message: `❌ Échec de suppression pour ${suppressionsEchouees.length} classe(s)` 
      });
    }
    
    // Réinitialiser et recharger
    setSelectionClasses({ classesSelectionnees: [], selectionTous: false });
    fermerModalSuppressionMultiple();
    await chargerDonnees();
    
  } catch (error) {
    console.error('❌ Erreur suppression multiple:', error);
    setAlerte({ type: 'error', message: '❌ Erreur lors de la suppression des classes' });
  } finally {
    setSoumissionEnCours(false);
  }
};

  const gererSelectionEleve = (id: number) => {
    setSelectionEleves(prev => {
      const elevesSelectionnes = prev.elevesSelectionnes.includes(id)
        ? prev.elevesSelectionnes.filter(eleveId => eleveId !== id)
        : [...prev.elevesSelectionnes, id];
      
      return {
        ...prev,
        elevesSelectionnes,
        selectionTous: elevesSelectionnes.length === elevesClasse.length
      };
    });
  };

  const gererSelectionTousEleves = () => {
    setSelectionEleves(prev => {
      const selectionTous = !prev.selectionTous;
      const elevesSelectionnes = selectionTous 
        ? elevesClasse.map((eleve: EleveClasse) => eleve.id)
        : [];
      
      return {
        ...prev,
        selectionTous,
        elevesSelectionnes
      };
    });
  };

  const ouvrirModalElevesClasse = async (classe: Classe) => {
    setClassePourEleves(classe);
    setChargementElevesClasse(true);
    setSelectionModal({ elevesSelectionnes: [], selectionTous: false });
    setTriModal({ colonne: null, ordre: 'asc' });
    
    try {
      console.log('🚀 =========== DÉBUT CHARGEMENT ÉLÈVES ===========');
      console.log('🔍 Classe sélectionnée:', {
        id: classe.id,
        nom: classe.nom,
        niveau: classe.niveau,
        typeId: typeof classe.id
      });
      
      const apiUrl = `/api/classes/${classe.id}/eleves`;
      console.log('📡 URL API appelée:', apiUrl);
      
      const timestamp = Date.now();
      const urlWithCacheBust = `${apiUrl}?_=${timestamp}`;
      console.log('🕒 URL avec cache bust:', urlWithCacheBust);
      
      const response = await fetch(urlWithCacheBust, {
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log('📊 Réponse HTTP brute:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        let errorBody = '';
        try {
          errorBody = await response.text();
          console.error('📄 Corps erreur (text):', errorBody);
          throw new Error(`Erreur ${response.status}: ${response.statusText}`);
        } catch (readError) {
          throw new Error(`Erreur HTTP: ${response.status} - ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      
      console.log('📊 Données API élèves:', {
        success: data.success,
        nbEleves: data.eleves?.length
      });
      
      if (data.success) {
        setElevesClasse(data.eleves || []);
        setModalElevesOuvert(true);
      } else {
        console.error('❌ Erreur API:', data.erreur);
        setAlerte({ 
          type: 'error', 
          message: `Erreur API: ${data.erreur || 'Impossible de charger les élèves'}`
        });
      }
    } catch (error: any) {
      console.error('❌ Erreur complète chargement élèves:', error);
      setAlerte({ 
        type: 'error', 
        message: `Erreur: ${error.message}. Vérifiez la console pour plus de détails.`
      });
    } finally {
      setChargementElevesClasse(false);
      console.log('🏁 =========== FIN CHARGEMENT ÉLÈVES ===========');
    }
  };

  const fermerModalEleves = () => {
    setModalElevesOuvert(false);
    setClassePourEleves(null);
    setElevesClasse([]);
  };

  // ==================== FONCTIONS UTILITAIRES ====================

  const getLibelleProfesseur = (niveau?: string): string => {
    const niveauActuel = niveau || formData.niveau;
    
    if (!niveauActuel) return 'Professeur Principal';
    
    const niveauxPrimaire = ['Petite Section','Moyenne Section','Grande Section', 'CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];
    const niveauxSecondaire = ['6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale'];
    
    if (niveauxPrimaire.includes(niveauActuel)) {
      return 'Maître Titulaire';
    } else if (niveauxSecondaire.includes(niveauActuel)) {
      return 'Professeur Principal';
    }
    
    return 'Professeur Principal';
  };

  const estNiveauPrimaire = (niveau?: string): boolean => {
    const niveauActuel = niveau || formData.niveau;
    const niveauxPrimaire = ['Petite Section','Moyenne Section','Grande Section', 'CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];
    return niveauxPrimaire.includes(niveauActuel || '');
  };

  const estNiveauSecondaire = (niveau?: string): boolean => {
    const niveauActuel = niveau || formData.niveau;
    const niveauxSecondaire = ['6ème', '5ème', '4ème', '3ème', 'Seconde', 'Première', 'Terminale'];
    return niveauxSecondaire.includes(niveauActuel || '');
  };

  const calculerTauxRemplissage = (classe: Classe) => {
    const elevesActuels = classe.nombre_eleves || 0;
    const capacite = 40;
    return Math.round((elevesActuels / capacite) * 100);
  };

  const getCouleurTauxRemplissage = (taux: number) => {
    if (taux >= 90) return '#ef4444';
    if (taux >= 75) return '#f59e0b';
    return '#10b981';
  };

  const calculerAge = (dateNaissance: string) => {
    const naissance = new Date(dateNaissance);
    const aujourdhui = new Date();
    let age = aujourdhui.getFullYear() - naissance.getFullYear();
    const mois = aujourdhui.getMonth() - naissance.getMonth();
    
    if (mois < 0 || (mois === 0 && aujourdhui.getDate() < naissance.getDate())) {
      age--;
    }
    
    return age;
  };

  const getCouleurStatut = (statut: string) => {
    const couleurs = {
      'actif': '#10b981',
      'inactif': '#6b7280',
      'diplome': '#3b82f6',
      'abandon': '#ef4444'
    };
    return couleurs[statut as keyof typeof couleurs] || '#6b7280';
  };

  const getIconeTypeFichier = (type: string): string => {
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('image')) return '🖼️';
    return '📄';
  };

  const gererSelectionEleveModal = (id: number) => {
    setSelectionModal(prev => {
      const elevesSelectionnes = prev.elevesSelectionnes.includes(id)
        ? prev.elevesSelectionnes.filter(eleveId => eleveId !== id)
        : [...prev.elevesSelectionnes, id];
      
      return {
        ...prev,
        elevesSelectionnes,
        selectionTous: elevesSelectionnes.length === elevesClasse.length
      };
    });
  };

  const gererSelectionTousModal = () => {
    setSelectionModal(prev => {
      const selectionTous = !prev.selectionTous;
      const elevesSelectionnes = selectionTous 
        ? elevesClasse.map(eleve => eleve.id)
        : [];
      
      return {
        ...prev,
        selectionTous,
        elevesSelectionnes
      };
    });
  };

  const gererTriModal = (colonne: keyof any) => {
    setTriModal(prev => ({
      colonne,
      ordre: prev.colonne === colonne && prev.ordre === 'asc' ? 'desc' : 'asc'
    }));
  };

  const elevesClasseTries = [...elevesClasse].sort((a, b) => {
    if (!triModal.colonne) return 0;
    
    const aValue = a[triModal.colonne as keyof any];
    const bValue = b[triModal.colonne as keyof any];
    
    if (aValue === undefined || bValue === undefined) return 0;
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return triModal.ordre === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    return 0;
  });

  // ==================== FONCTIONS D'IMPRESSION ====================

  const imprimerListeElevesClasse = async () => {
    const classeAImprimer = classeSelectionnee || classePourEleves;
    
    if (!classeAImprimer) {
      setAlerte({ type: 'error', message: 'Aucune classe sélectionnée' });
      return;
    }
    
    if (elevesClasse.length === 0) {
      setAlerte({ type: 'error', message: 'Aucun élève à imprimer dans cette classe' });
      return;
    }
    
    console.log('🖨️ Impression pour classe:', classeAImprimer.nom, 'avec', elevesClasse.length, 'élèves');
    
    try {
      let ecoleInfo = parametresEcole;
      if (!ecoleInfo) {
        try {
          const response = await fetch('/api/parametres/ecole');
          const data = await response.json();
          if (data.success) {
            ecoleInfo = data.parametres;
          }
        } catch (error) {
          console.warn('⚠️ Impossible de charger les paramètres école:', error);
        }
      }
      
      if (!ecoleInfo) {
        ecoleInfo = {
          id: 0,
          nom_ecole: "Établissement Scolaire",
          slogan: "",
          adresse: "",
          telephone: "",
          email: "",
          logo_url: "",
          couleur_principale: "#3B82F6",
          annee_scolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        };
      }
      
      const dateImpression = new Date();
      const dateFormatted = formaterDate(dateImpression);
      const heureFormatted = dateImpression.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const contenuImprimable = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Liste des Élèves - ${classeAImprimer.niveau} ${classeAImprimer.nom}</title>
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
              border-bottom: 4px solid ${ecoleInfo.couleur_principale || '#3B82F6'};
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .school-name {
              font-size: 28px;
              font-weight: bold;
              color: ${ecoleInfo.couleur_principale || '#2c3e50'};
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
            .class-title {
              font-size: 22px;
              margin: 20px 0;
              color: #34495e;
              background: linear-gradient(90deg, ${ecoleInfo.couleur_principale || '#3B82F6'}20, transparent);
              padding: 10px;
              border-radius: 5px;
            }
            .class-info {
              display: flex;
              justify-content: space-between;
              margin: 20px 0;
              padding: 15px;
              background: #f8fafc;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .info-item {
              text-align: center;
              flex: 1;
            }
            .info-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .info-value {
              font-size: 18px;
              font-weight: bold;
              color: #1e293b;
              margin-top: 5px;
            }
            .table-container {
              overflow-x: auto;
              margin: 30px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: ${ecoleInfo.couleur_principale || '#3B82F6'};
              color: white;
              padding: 12px 15px;
              text-align: left;
              font-weight: 600;
              border: 1px solid ${ecoleInfo.couleur_principale ? '#1d4ed8' : '#1e293b'};
            }
            td {
              padding: 12px 15px;
              border: 1px solid #e2e8f0;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            .badge-genre {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .badge-M {
              background: #dbeafe;
              color: #1e40af;
            }
            .badge-F {
              background: #fce7f3;
              color: #be185d;
            }
            .photo-cell {
              text-align: center;
            }
            .photo-mini {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              object-fit: cover;
              border: 2px solid ${ecoleInfo.couleur_principale || '#3B82F6'};
            }
            .photo-placeholder {
              width: 40px;
              height: 40px;
              border-radius: 50%;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              display: inline-flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-weight: bold;
              font-size: 14px;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              font-size: 12px;
              color: #7f8c8d;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              @page {
                margin: 15mm;
                size: A4;
              }
              body { 
                margin: 0 !important;
                padding: 10px !important;
                font-size: 11pt !important;
              }
              .no-print { display: none !important; }
              th { font-size: 10pt; padding: 8px 10px; }
              td { font-size: 10pt; padding: 8px 10px; }
              .class-info { break-inside: avoid; }
              table { page-break-inside: avoid; }
              tr { page-break-inside: avoid; }
            }
            .signature-area {
              margin-top: 60px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 40px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 60px;
              padding-top: 5px;
              width: 80%;
              margin-left: 10%;
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
            .actions-impression {
              margin-top: 20px;
              text-align: center;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .bouton-impression {
              padding: 10px 20px;
              background: #3B82F6;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin: 5px;
              font-size: 14px;
            }
            .bouton-fermer {
              padding: 10px 20px;
              background: #6b7280;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin: 5px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="date-print">
            Imprimé le: ${dateFormatted} à ${heureFormatted}
          </div>
          
          <div class="header">
            <div class="logo-header">
              ${ecoleInfo.logo_url ? `<img src="${ecoleInfo.logo_url}" class="logo-img" alt="Logo">` : ''}
              <div>
                <div class="school-name">${ecoleInfo.nom_ecole || "ÉTABLISSEMENT SCOLAIRE"}</div>
                <div class="school-info">
                  ${ecoleInfo.adresse ? `<span>📍 ${ecoleInfo.adresse}</span>` : ''}
                  ${ecoleInfo.telephone ? `<span>📞 ${ecoleInfo.telephone}</span>` : ''}
                  ${ecoleInfo.email ? `<span>✉️ ${ecoleInfo.email}</span>` : ''}
                </div>
              </div>
            </div>
            
            <div class="class-title">
              📋 LISTE DES ÉLÈVES - ${classeAImprimer.niveau} ${classeAImprimer.nom}
            </div>
          </div>
          
          <div class="class-info">
            <div class="info-item">
              <div class="info-label">Niveau</div>
              <div class="info-value">${classeAImprimer.niveau}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Classe</div>
              <div class="info-value">${classeAImprimer.nom}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Total Élèves</div>
              <div class="info-value">${elevesClasse.length}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Année Scolaire</div>
              <div class="info-value">${parametresEcole?.annee_scolaire || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}</div>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Matricule</th>
                  <th>Nom et Prénom</th>
                  <th>Sexe</th>
                  <th>Date de Naissance</th>
                  <th>Lieu de Naissance</th>
                  <th>Âge</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                ${elevesClasse.map((eleve: EleveClasse, index: number) => {
                  const age = calculerAge(eleve.date_naissance);
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td><strong>${eleve.matricule || 'N/A'}</strong></td>
                      <td><strong>${eleve.nom} ${eleve.prenom}</strong></td>
                      <td>
                        <span class="badge-genre badge-${eleve.genre}">
                          ${eleve.genre === 'M' ? 'Masculin' : 'Féminin'}
                        </span>
                      </td>
                      <td>${formaterDate(eleve.date_naissance)}</td>
                      <td>${eleve.lieu_naissance || 'Non renseigné'}</td>
                      <td><strong>${age} ans</strong></td>
                      <td>
                        <span style="
                          display: inline-block;
                          padding: 4px 8px;
                          border-radius: 12px;
                          font-size: 11px;
                          font-weight: bold;
                          color: white;
                          background: ${getCouleurStatut(eleve.statut)};
                        ">
                          ${eleve.statut.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
                ${elevesClasse.length === 0 ? `
                  <tr>
                    <td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">
                      Aucun élève dans cette classe
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
          
          <div class="signature-area">
            <div>
              <div class="signature-line"></div>
              <div style="margin-top: 5px; font-size: 14px;"><strong>Le Directeur</strong></div>
              <div style="font-size: 12px; color: #666;">Signature et cachet</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div style="margin-top: 5px; font-size: 14px;"><strong>Le Professeur Principal</strong></div>
              <div style="font-size: 12px; color: #666;">${classeAImprimer.nom_professeur_principal || 'Non assigné'}</div>
            </div>
          </div>
          
          <div class="footer">
            <div>Document généré par le Système de Gestion Scolaire</div>
            <div>Liste des élèves • ${classeAImprimer.niveau} ${classeAImprimer.nom} • ${elevesClasse.length} élève${elevesClasse.length > 1 ? 's' : ''}</div>
            <div style="margin-top: 10px; color: #aaa; font-size: 10px;">
              Ce document est confidentiel.
            </div>
          </div>
          
          <div class="actions-impression no-print">
            <button onclick="window.print()" class="bouton-impression">
              🖨️ Imprimer maintenant
            </button>
            <button onclick="window.close()" class="bouton-fermer">
              ✕ Fermer la fenêtre
            </button>
          </div>
          
          <script>
            setTimeout(function() {
              window.print();
            }, 1000);
            
            window.onafterprint = function() {
              setTimeout(function() {
                if (confirm('Impression terminée. Voulez-vous fermer cette fenêtre ?')) {
                  window.close();
                }
              }, 500);
            };
          </script>
        </body>
        </html>
      `;
      
      const fenetreImpression = window.open('', '_blank', 'width=900,height=700');
      if (fenetreImpression) {
        fenetreImpression.document.write(contenuImprimable);
        fenetreImpression.document.close();
        fenetreImpression.focus();
        setAlerte({ type: 'success', message: `Fenêtre d'impression ouverte pour ${elevesClasse.length} élève(s)` });
      } else {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez vos bloqueurs de popup.');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'impression:', error);
      setAlerte({ type: 'error', message: `Erreur d'impression: ${error.message}` });
    }
  };

  const imprimerToutesLesClasses = async () => {
    if (classes.length === 0) {
      setAlerte({ type: 'error', message: 'Aucune classe à imprimer' });
      return;
    }
    
    console.log('🖨️ Impression de toutes les classes:', classes.length, 'classes');
    
    try {
      let ecoleInfo = parametresEcole;
      if (!ecoleInfo) {
        try {
          const response = await fetch('/api/parametres/ecole');
          const data = await response.json();
          if (data.success) {
            ecoleInfo = data.parametres;
          }
        } catch (error) {
          console.warn('⚠️ Impossible de charger les paramètres école:', error);
        }
      }
      
      if (!ecoleInfo) {
        ecoleInfo = {
          id: 0,
          nom_ecole: "Établissement Scolaire",
          slogan: "",
          adresse: "",
          telephone: "",
          email: "",
          logo_url: "",
          couleur_principale: "#3B82F6",
          annee_scolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
        };
      }
      
      const totalEleves = classes.reduce((sum, classe) => sum + (classe.nombre_eleves || 0), 0);
      const tauxMoyenRemplissage = classes.length > 0 
        ? Math.round(classes.reduce((sum, classe) => sum + calculerTauxRemplissage(classe), 0) / classes.length)
        : 0;
      
      const dateImpression = new Date();
      const dateFormatted = formaterDate(dateImpression);
      const heureFormatted = dateImpression.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const contenuImprimable = `
        <!DOCTYPE html>
        <html lang="fr">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Liste de Toutes les Classes - ${ecoleInfo.nom_ecole}</title>
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
              border-bottom: 4px solid ${ecoleInfo.couleur_principale || '#3B82F6'};
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .school-name {
              font-size: 28px;
              font-weight: bold;
              color: ${ecoleInfo.couleur_principale || '#2c3e50'};
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
            .document-title {
              font-size: 22px;
              margin: 20px 0;
              color: #34495e;
              background: linear-gradient(90deg, ${ecoleInfo.couleur_principale || '#3B82F6'}20, transparent);
              padding: 15px;
              border-radius: 5px;
              text-align: center;
            }
            .statistics {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin: 25px 0;
              padding: 20px;
              background: #f8fafc;
              border-radius: 10px;
              border: 1px solid #e2e8f0;
            }
            .stat-item {
              text-align: center;
              padding: 15px;
              background: white;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .stat-label {
              font-size: 12px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 5px;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              color: ${ecoleInfo.couleur_principale || '#3B82F6'};
            }
            .stat-sub {
              font-size: 12px;
              color: #94a3b8;
              margin-top: 3px;
            }
            .table-container {
              overflow-x: auto;
              margin: 30px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th {
              background: ${ecoleInfo.couleur_principale || '#3B82F6'};
              color: white;
              padding: 12px 15px;
              text-align: left;
              font-weight: 600;
              border: 1px solid ${ecoleInfo.couleur_principale ? '#1d4ed8' : '#1e293b'};
            }
            td {
              padding: 12px 15px;
              border: 1px solid #e2e8f0;
            }
            tr:nth-child(even) {
              background: #f8fafc;
            }
            tr:hover {
              background: #f1f5f9;
            }
            .badge-niveau {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 20px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .badge-primaire {
              background: #dbeafe;
              color: #1e40af;
            }
            .badge-secondaire {
              background: #fce7f3;
              color: #be185d;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              font-size: 12px;
              color: #7f8c8d;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            @media print {
              @page {
                margin: 15mm;
                size: A4;
              }
              body { 
                margin: 0 !important;
                padding: 10px !important;
                font-size: 11pt !important;
              }
              .no-print { display: none !important; }
              th { font-size: 10pt; padding: 8px 10px; }
              td { font-size: 10pt; padding: 8px 10px; }
              .statistics { 
                grid-template-columns: repeat(2, 1fr);
                break-inside: avoid; 
              }
              table { page-break-inside: avoid; }
              tr { page-break-inside: avoid; }
            }
            .signature-area {
              margin-top: 60px;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 40px;
              text-align: center;
            }
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 60px;
              padding-top: 5px;
              width: 80%;
              margin-left: 10%;
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
            .actions-impression {
              margin-top: 20px;
              text-align: center;
              padding: 20px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .bouton-impression {
              padding: 10px 20px;
              background: #3B82F6;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin: 5px;
              font-size: 14px;
            }
            .bouton-fermer {
              padding: 10px 20px;
              background: #6b7280;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              margin: 5px;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="date-print">
            Imprimé le: ${dateFormatted} à ${heureFormatted}
          </div>
          
          <div class="header">
            <div class="logo-header">
              ${ecoleInfo.logo_url ? `<img src="${ecoleInfo.logo_url}" class="logo-img" alt="Logo">` : ''}
              <div>
                <div class="school-name">${ecoleInfo.nom_ecole || "ÉTABLISSEMENT SCOLAIRE"}</div>
                <div class="school-info">
                  ${ecoleInfo.adresse ? `<span>📍 ${ecoleInfo.adresse}</span>` : ''}
                  ${ecoleInfo.telephone ? `<span>📞 ${ecoleInfo.telephone}</span>` : ''}
                  ${ecoleInfo.email ? `<span>✉️ ${ecoleInfo.email}</span>` : ''}
                </div>
              </div>
            </div>
            
            <div class="document-title">
              📚 LISTE DE TOUTES LES CLASSES - ANNÉE SCOLAIRE ${parametresEcole?.annee_scolaire || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`}
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Niveau</th>
                  <th>Classe</th>
                  <th>Type</th>
                  <th>Professeur Principal</th>
                  <th>Nombre d'Élèves</th>
                </tr>
              </thead>
              <tbody>
                ${classes.map((classe, index) => {
                  return `
                    <tr>
                      <td>${index + 1}</td>
                      <td><strong>${classe.niveau}</strong></td>
                      <td><strong>${classe.nom}</strong></td>
                      <td>
                        <span class="badge-niveau ${estNiveauPrimaire(classe.niveau) ? 'badge-primaire' : 'badge-secondaire'}">
                          ${estNiveauPrimaire(classe.niveau) ? '👦 Primaire' : '👩‍🎓 Secondaire'}
                        </span>
                      </td>
                      <td>${classe.nom_professeur_principal || 'Non assigné'}</td>
                      <td>
                        <strong>${classe.nombre_eleves || 0}</strong>
                        <div style="font-size: 11px; color: #64748b;">
                          ${classe.nombre_eleves || 0} élève${classe.nombre_eleves !== 1 ? 's' : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="signature-area">
            <div>
              <div class="signature-line"></div>
              <div style="margin-top: 5px; font-size: 14px;"><strong>Le Directeur</strong></div>
              <div style="font-size: 12px; color: #666;">Signature et cachet</div>
            </div>
            <div>
              <div class="signature-line"></div>
              <div style="margin-top: 5px; font-size: 14px;"><strong>Le Secrétaire</strong></div>
              <div style="font-size: 12px; color: #666;">Signature</div>
            </div>
          </div>
          
          <div class="footer">
            <div>Document généré par le Système de Gestion Scolaire</div>
            <div>Liste des classes • ${classes.length} classe${classes.length > 1 ? 's' : ''} • ${totalEleves} élève${totalEleves > 1 ? 's' : ''}</div>
            <div style="margin-top: 10px; color: #aaa; font-size: 10px;">
              Document officiel • Édition: ${dateFormatted} • Page 1/1
            </div>
          </div>
          
          <div class="actions-impression no-print">
            <button onclick="window.print()" class="bouton-impression">
              🖨️ Imprimer maintenant
            </button>
            <button onclick="window.close()" class="bouton-fermer">
              ✕ Fermer la fenêtre
            </button>
          </div>
          
          <script>
            setTimeout(function() {
              window.print();
            }, 1000);
            
            window.onafterprint = function() {
              setTimeout(function() {
                if (confirm('Impression terminée. Voulez-vous fermer cette fenêtre ?')) {
                  window.close();
                }
              }, 500);
            };
          </script>
        </body>
        </html>
      `;
      
      const fenetreImpression = window.open('', '_blank', 'width=1000,height=700');
      if (fenetreImpression) {
        fenetreImpression.document.write(contenuImprimable);
        fenetreImpression.document.close();
        fenetreImpression.focus();
        setAlerte({ type: 'success', message: `Fenêtre d'impression ouverte pour ${classes.length} classe(s)` });
      } else {
        throw new Error('Impossible d\'ouvrir la fenêtre d\'impression. Vérifiez vos bloqueurs de popup.');
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'impression des classes:', error);
      setAlerte({ type: 'error', message: `Erreur d'impression: ${error.message}` });
    }
  };

  // ==================== RENDU ====================

  if (chargement && classes.length === 0) {
    return (
      <div className="chargement-classes">
        <div className="spinner-grand"></div>
        <p>Chargement des classes...</p>
      </div>
    );
  }

  return (
    <div className={`conteneur-gestion-classes ${getThemeClass()}`}>
      {/* En-tête FIXE */}
      <div className="en-tete-fixe-eleves">
        <div className="conteneur-en-tete-fixe-eleves">
          <div className="titre-fixe-eleves">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <span style={{ fontSize: '22px' }}>🏫</span>
              <h1>
                Gestion des Classes
              </h1>
              {selectionClasses.classesSelectionnees.length > 0 && (
                <span className="indicateur-selection-fixe">
                  {selectionClasses.classesSelectionnees.length} sélectionné(s)
                </span>
              )}
            </div>
          </div>

          {/* Boutons à droite */}
          <div className="actions-fixes">
            {/* Case à cocher "Tout sélectionner" */}
            {classes.length > 0 && (
              <div className="selecteur-tous" style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0 10px',
                background: '#f3f4f6',
                borderRadius: '8px',
                marginRight: '10px'
              }}>
                <input
                  type="checkbox"
                  id="selecteurTousClasses"
                  checked={selectionClasses.selectionTous}
                  onChange={gererSelectionTous}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: parametresEcole?.couleur_principale || '#3B82F6'
                  }}
                />
                <label htmlFor="selecteurTousClasses" style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  cursor: 'pointer'
                }}>
                  Tout sélectionner
                </label>
              </div>
            )}

            {/* Bouton de suppression multiple */}
              {selectionClasses.classesSelectionnees.length > 0 && (
                <button 
                  className="bouton-supprimer-multiple-fixe"
                  onClick={ouvrirModalSuppressionMultiple}
                  title={verifierClassesAvecEleves() 
                    ? "Certaines classes sélectionnées contiennent des élèves et ne peuvent pas être supprimées" 
                    : "Supprimer les classes sélectionnées"}
                  style={{
                    background: verifierClassesAvecEleves() ? '#9ca3af' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: verifierClassesAvecEleves() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.3s ease',
                    fontSize: '14px',
                    boxShadow: verifierClassesAvecEleves() ? 'none' : '0 2px 8px rgba(239, 68, 68, 0.2)',
                    opacity: verifierClassesAvecEleves() ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!verifierClassesAvecEleves()) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!verifierClassesAvecEleves()) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
                    }
                  }}
                  disabled={verifierClassesAvecEleves()}
                >
                  🗑️ Supprimer ({selectionClasses.classesSelectionnees.length})
                </button>
              )}
            
            {/* Bouton Imprimer toutes les classes */}
            <button 
              className="bouton-imprimer-toutes-classes-fixe"
              onClick={imprimerToutesLesClasses}
              disabled={classes.length === 0}
              title={classes.length === 0 ? 'Aucune classe à imprimer' : 'Imprimer la liste de toutes les classes'}
              style={{
                background: classes.length === 0 
                  ? '#9ca3af' 
                  : `linear-gradient(135deg, ${parametresEcole?.couleur_principale || '#10b981'} 0%, ${parametresEcole?.couleur_principale ? '#1d4ed8' : '#059669'} 100%)`,
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: classes.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                fontSize: '14px',
                boxShadow: classes.length > 0 ? `0 2px 8px ${parametresEcole?.couleur_principale ? `${parametresEcole.couleur_principale}40` : 'rgba(16, 185, 129, 0.2)'}` : 'none'
              }}
              onMouseEnter={(e) => {
                if (classes.length > 0) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${parametresEcole?.couleur_principale ? `${parametresEcole.couleur_principale}60` : 'rgba(16, 185, 129, 0.3)'}`;
                }
              }}
              onMouseLeave={(e) => {
                if (classes.length > 0) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = `0 2px 8px ${parametresEcole?.couleur_principale ? `${parametresEcole.couleur_principale}40` : 'rgba(16, 185, 129, 0.2)'}`;
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>📋</span>
              <span>Imprimer</span>
              {classes.length > 0 && (
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {classes.length}
                </span>
              )}
            </button>
            
            {/* Bouton Ajouter une classe */}
            <button 
              className="bouton-classe-fixe"
              onClick={() => ouvrirModal()}
              title="Ajouter une nouvelle classe"
              style={{
                background: `linear-gradient(135deg, ${parametresEcole?.couleur_principale || '#37b757'} 0%, ${parametresEcole?.couleur_principale ? '#0bfe90' : '#aae915'} 100%)`,
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                fontSize: '14px',
                boxShadow: `0 2px 8px ${parametresEcole?.couleur_principale ? `${parametresEcole.couleur_principale}40` : 'rgba(59, 130, 246, 0.2)'}`
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 12px ${parametresEcole?.couleur_principale ? `${parametresEcole.couleur_principale}60` : 'rgba(59, 130, 246, 0.3)'}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 2px 8px ${parametresEcole?.couleur_principale ? `${parametresEcole.couleur_principale}40` : 'rgba(59, 130, 246, 0.2)'}`;
              }}
            >
              <span style={{ fontSize: '16px' }}>🏫</span>
              <span>Ajouter une classe</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Alerte */}
      {alerte && (
        <div className={`alerte ${alerte.type === 'success' ? 'alerte-succes' : 'alerte-erreur'}`}>
          <div className="contenu-alerte">
            <span className="icone-alerte">
              {alerte.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="texte-alerte">{alerte.message}</span>
            <button 
              className="bouton-fermer-alerte"
              onClick={() => setAlerte(null)}
              title="Fermer"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0',
                margin: '0',
                fontSize: '16px',
                color: '#dc2626',
                transition: 'color 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#b91c1c';
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#dc2626';
                e.currentTarget.style.background = 'none';
              }}
            >
              ❌
            </button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="section-filtres-classe">
        <div className="grille-filtres">
          <div className="groupe-filtre">
            <label>Recherche</label>
            <input
              type="text"
              placeholder="Nom ou niveau..."
              value={filtres.recherche || ''}
              onChange={(e) => gererChangementFiltre('recherche', e.target.value)}
            />
          </div>
          <div className="groupe-filtre">
            <label>Niveau</label>
            <select
              value={filtres.niveau || ''}
              onChange={(e) => gererChangementFiltre('niveau', e.target.value || undefined)}
            >
              <option value="">Tous les niveaux</option>
              {niveaux.map(niveau => (
                <option key={niveau} value={niveau}>{niveau}</option>
              ))}
            </select>
          </div>
          <div className="groupe-filtre">
            <button className="bouton-reinitialiser" onClick={reinitialiserFiltres}>
              🔄 Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Liste des classes avec cases à cocher */}
      <div className="grille-classes-classe">
      {classesTriees.map(classe => {
        const tauxRemplissage = calculerTauxRemplissage(classe);
        const couleurTaux = getCouleurTauxRemplissage(tauxRemplissage);
        const estSelectionnee = selectionClasses.classesSelectionnees.includes(classe.id);
        
        return (
          <div 
            key={classe.id} 
            className={`carte-classe-classe ${estSelectionnee ? 'carte-classe-selectionnee' : ''}`}
            style={{
              position: 'relative',
              ...(estSelectionnee ? {
                border: `2px solid ${parametresEcole?.couleur_principale || '#3B82F6'}`,
                boxShadow: `0 4px 12px ${parametresEcole?.couleur_principale ? `${parametresEcole.couleur_principale}40` : 'rgba(59, 130, 246, 0.2)'}`,
                transform: 'translateY(-2px)'
              } : {})
            }}
          >
              <div style={{
                position: 'absolute',
                top: '6px',
                left: '10px',
                zIndex: 10,
                background: '#e2e8f000',
                borderRadius: '4px',
                padding: '2px',
              }}>
                <input
                  type="checkbox"
                  checked={estSelectionnee}
                  onChange={() => gererSelectionClasse(classe.id)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: parametresEcole?.couleur_principale || '#3B82F6',
                    margin: 0
                  }}
                  title={estSelectionnee ? 'Désélectionner cette classe' : 'Sélectionner cette classe'}
                />
              </div>

              <div className="en-tete-carte-classe-1">
                <span className="">🏫 {classe.niveau} {classe.nom}</span>
              </div>

              <div className="info-classe">
                <div className="info-item-classe">
                  <span className="label">👨‍🎓 Élèves:</span>
                  <span className="valeur">{classe.nombre_eleves || 0}</span>
                </div>
                
                {classe.nom_professeur_principal && (
                  <div className="info-item-classe">
                    <span className="label style-2">
                      {classe.niveau.includes('Primaire') ? 'Enseignant:' : 'Enseignant:'}
                    </span>
                    <span className="valeur style-2">{classe.nom_professeur_principal}</span>
                  </div>
                )}
              </div>

              <div className="actions-carte-classe">
                <button 
                  className="bouton-eleves-classe-classe"
                  onClick={() => ouvrirModalElevesClasse(classe)}
                  title={`Voir les élèves de ${classe.niveau} ${classe.nom}`}
                >
                  👁️
                </button>
                
                <button 
                  className="bouton-modifier-classe" 
                  title="Modifier la classe"
                  onClick={() => ouvrirModal(classe)}
                >
                  ✏️
                </button>
                
                <button 
                  className={`bouton-supprimer-classe ${classe.nombre_eleves && classe.nombre_eleves > 0 ? 'bouton-supprimer-desactive' : ''}`}
                  title={classe.nombre_eleves && classe.nombre_eleves > 0 
                    ? `Suppression impossible - Cette classe contient ${classe.nombre_eleves} élève(s)` 
                    : "Supprimer la classe"}
                  onClick={() => {
                    if (classe.nombre_eleves && classe.nombre_eleves > 0) {
                      setAlerte({ 
                        type: 'error', 
                        message: `❌ Suppression impossible - Cette classe contient ${classe.nombre_eleves} élève(s). Veuillez d'abord transférer ou désactiver les élèves.` 
                      });
                    } else {
                      ouvrirModalSuppression(classe);
                    }
                  }}
                  disabled={classe.nombre_eleves ? classe.nombre_eleves > 0 : false}
                  style={{
                    opacity: classe.nombre_eleves && classe.nombre_eleves > 0 ? 0.5 : 1,
                    cursor: classe.nombre_eleves && classe.nombre_eleves > 0 ? 'not-allowed' : 'pointer',
                    background: classe.nombre_eleves && classe.nombre_eleves > 0 ? '#9ca3af' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    boxShadow: classe.nombre_eleves && classe.nombre_eleves > 0 ? 'none' : '0 2px 4px rgba(239, 68, 68, 0.2)'
                  }}
                  onMouseEnter={(e) => {
                    if (!classe.nombre_eleves || classe.nombre_eleves === 0) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(239, 68, 68, 0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!classe.nombre_eleves || classe.nombre_eleves === 0) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(239, 68, 68, 0.2)';
                    }
                  }}
                >
                  🗑️
                </button>
              </div>

              {/* Badge "Sélectionnée" si la classe est choisie */}
              {estSelectionnee && (
                <div className="badge-selection" style={{
                  position: 'absolute',
                  top: '6px',
                  right: '10px',
                  background: parametresEcole?.couleur_principale || '#3B82F6',
                  color: 'white',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  zIndex: 2
                }}>
                  ✓ Sélectionnée
                </div>
              )}
            </div>
          );
        })}
      </div>

      {classes.length === 0 && (
        <div className="aucune-donnee">
          <p>Aucune classe trouvée avec les critères sélectionnés</p>
        </div>
      )}

      {/* Modal d'ajout/modification */}
      {modalOuvert && (
        <div className="overlay-modal" onClick={fermerModal}>
          <div className="modal-classe-modern" onClick={(e) => e.stopPropagation()}>
            {/* En-tête moderne */}
            <div className="en-tete-modal-modern">
              <div className="titre-modal-modern">
                <div className="icone-titre-modal">
                  {classeSelectionnee ? '✏️' : '🏫'}
                </div>
                <div>
                  <h2>{classeSelectionnee ? 'Modifier la classe' : 'Ajouter une nouvelle classe'}</h2>
                  <p className="sous-titre-modal">
                    {classeSelectionnee ? 'Mettez à jour les informations de la classe' : 'Remplissez les informations de la nouvelle classe'}
                  </p>
                </div>
              </div>
              <button className="bouton-fermer-modal-modern" onClick={fermerModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <form onSubmit={soumettreFormulaire} className="formulaire-classe-modern">
              {erreurFormulaire && (
                <div className="message-erreur-formulaire-modern">
                  <div className="icone-erreur">⚠️</div>
                  <div className="texte-erreur">{erreurFormulaire}</div>
                </div>
              )}

              <div className="grille-formulaire-modern">
                <div>
                  <label className="label-champ-modern">
                    Niveau <span className="requis">*</span>
                    {formData.niveau && (
                      <span className={`badge-niveau ${estNiveauPrimaire() ? 'primaire' : 'secondaire'}`}>
                        {estNiveauPrimaire() ? '👦 Primaire' : '👩‍🎓 Secondaire'}
                      </span>
                    )}
                  </label>
                  <div className="select-container-modern">
                    <select
                      name="niveau"
                      value={formData.niveau}
                      onChange={gererChangementFormulaire}
                      className="select-champ-modern"
                      required
                    >
                      <option value="">Sélectionnez un niveau</option>
                      <optgroup label="🎒 Primaire">
                        <option value="Petite Section">Petite Section</option>
                        <option value="Moyenne Section">Moyenne Section</option>
                        <option value="Grande Section">Grande Section</option>
                        <option value="CP1">CP1</option>
                        <option value="CP2">CP2</option>
                        <option value="CE1">CE1</option>
                        <option value="CE2">CE2</option>
                        <option value="CM1">CM1</option>
                        <option value="CM2">CM2</option>
                      </optgroup>
                      <optgroup label="🎓 Secondaire - Collège">
                        <option value="6ème">6ème</option>
                        <option value="5ème">5ème</option>
                        <option value="4ème">4ème</option>
                        <option value="3ème">3ème</option>
                      </optgroup>
                      <optgroup label="🎓 Secondaire - Lycée">
                        <option value="Seconde">Seconde</option>
                        <option value="Première">Première</option>
                        <option value="Terminale">Terminale</option>
                      </optgroup>
                    </select>
                    <div className="select-arrow">▼</div>
                  </div>
                  {formData.niveau && (
                    <div className="indicateur-niveau">
                      <span className={`icone-niveau ${estNiveauPrimaire() ? 'primaire' : 'secondaire'}`}>
                        {estNiveauPrimaire() ? '👨‍🏫' : '👩‍🏫'}
                      </span>
                      <span>
                        {estNiveauPrimaire() 
                          ? 'Niveau primaire - Maître titulaire' 
                          : 'Niveau secondaire - Professeur principal'
                        }
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label-champ-modern">
                    Nom de la classe <span className="requis"></span>
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={gererChangementFormulaire}
                    className="input-champ-modern"
                    placeholder="Ex: A, B, C, A1, B2"
                  />
                  <div className="indicateur-format">🔤 Majuscules automatiques</div>
                </div>

                <div className="plein-largeur">
                  <label className="label-champ-modern">
                    {getLibelleProfesseur()}
                    {formData.niveau && (
                      <span className="info-libelle">
                        ({estNiveauPrimaire() ? 'Enseignant unique' : 'Coordinateur pédagogique'})
                      </span>
                    )}
                  </label>
                  <div className="select-container-modern">
                    <select
                      name="professeur_principal_id"
                      value={formData.professeur_principal_id}
                      onChange={gererChangementFormulaire}
                      className="select-champ-modern"
                    >
                      <option value="">
                        {formData.niveau 
                          ? `Aucun ${getLibelleProfesseur().toLowerCase()}`
                          : 'Sélectionnez un niveau d\'abord'
                        }
                      </option>
                      {professeurs.map(prof => (
                        <option key={prof.id} value={prof.id}>
                          {prof.prenom} {prof.nom}
                          {prof.matieres && ` - ${prof.matieres}`}
                        </option>
                      ))}
                    </select>
                    <div className="select-arrow">▼</div>
                  </div>
                  <div className="indicateur-format">
                    {formData.niveau ? (
                      <>
                        <span className={`icone-role ${estNiveauPrimaire() ? 'primaire' : 'secondaire'}`}>
                          {estNiveauPrimaire() ? '👨‍🏫' : '👩‍🏫'}
                        </span>
                        {estNiveauPrimaire() 
                          ? 'Enseignant responsable de toute la classe'
                          : 'Enseignant coordinateur des différentes matières'
                        }
                      </>
                    ) : (
                      '👆 Sélectionnez d\'abord un niveau'
                    )}
                  </div>
                </div>
              </div>

              <div className="actions-formulaire-modern">
                <button 
                  type="button" 
                  className="bouton-annuler-classe"
                  onClick={fermerModal}
                >
                  <span className="icone-bouton">↶</span>
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className={`bouton-sauvegarder-classe ${soumissionEnCours ? 'bouton-chargement' : ''}`}
                  disabled={soumissionEnCours}
                >
                  {soumissionEnCours ? (
                    <>
                      <div className="spinner-bouton-modern"></div>
                      Traitement en cours...
                    </>
                  ) : (
                    <>
                      <span className="icone-bouton">
                        {classeSelectionnee ? '💾' : '🏫'}
                      </span>
                      {classeSelectionnee ? 'Mettre à jour' : 'Créer la classe'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de suppression unique */}
      {modalSuppressionOuvert && classeASupprimer && (
        <div className="overlay-modal" onClick={fermerModalSuppression}>
          <div className="modal-suppression" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal-suppression-classe">
              <h2>⚠️ Confirmer Suppression</h2>
            </div>
            
            <div className="contenu-modal-suppression">
              <p>
                Êtes-vous sûr de vouloir supprimer la classe <strong>"{classeASupprimer.nom}"</strong> ?
              </p>
              
              {classeASupprimer.nombre_eleves && classeASupprimer.nombre_eleves > 0 ? (
                <div className="avertissement-important">
                  <p>⚠️ <strong>Attention:</strong> Cette classe contient {classeASupprimer.nombre_eleves} élève(s).</p>
                  <p>La suppression n'est pas recommandée. Vous pouvez plutôt désactiver les élèves ou les transférer vers une autre classe.</p>
                </div>
              ) : (
                <div className="information-suppression">
                  <p>Cette action est irréversible. La classe sera définitivement supprimée de la base de données.</p>
                </div>
              )}
            </div>
            
            <div className="actions-modal-suppression" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button 
                className="bouton-annuler-suppression"
                onClick={fermerModalSuppression}
              >
                Annuler
              </button>
              <button 
                className="bouton-confirmer-suppression"
                onClick={supprimerClasse}
                disabled={classeASupprimer?.nombre_eleves ? classeASupprimer.nombre_eleves > 0 : false}
              >
                🗑️ Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de suppression multiple */}
      {modalSuppressionMultipleOuvert && (
        <div className="overlay-modal" onClick={fermerModalSuppressionMultiple}>
          <div className="modal-suppression" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal-suppression-classe">
              <h2>⚠️ Confirmer Suppression</h2>
            </div>
            
            <div className="contenu-modal-suppression">
              <p>
                Êtes-vous sûr de vouloir supprimer <strong>{selectionClasses.classesSelectionnees.length} classe(s)</strong> ?
              </p>
              
              <div className="liste-classes-a-supprimer" style={{
                maxHeight: '200px',
                overflowY: 'auto',
                margin: '15px 0',
                padding: '10px',
                background: '#f3f4f6',
                borderRadius: '8px'
              }}>
                {obtenirClassesSelectionnees().map(classe => (
                  <div key={classe.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <span>🏫</span>
                    <span><strong>{classe.niveau} {classe.nom}</strong></span>
                    {classe.nombre_eleves ? classe.nombre_eleves > 0 && (
                      <span style={{
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        marginLeft: 'auto'
                      }}>
                        {classe.nombre_eleves} élève(s)
                      </span>
                    ) : null}
                  </div>
                ))}
              </div>
              
              <div className="avertissement-important">
                <p>⚠️ <strong>Attention:</strong> Cette action est irréversible.</p>
                <p>Les classes contenant des élèves ne pourront pas être supprimées.</p>
              </div>
            </div>
            
            <div className="actions-modal-suppression" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <button 
                className="bouton-annuler-suppression"
                onClick={fermerModalSuppressionMultiple}
              >
                Annuler
              </button>
              <button 
                className="bouton-confirmer-suppression"
                onClick={supprimerClassesMultiple}
                disabled={soumissionEnCours}
              >
                {soumissionEnCours ? (
                  <>
                    <div className="spinner-bouton-modern"></div>
                    Suppression en cours...
                  </>
                ) : (
                  `🗑️ Supprimer (${selectionClasses.classesSelectionnees.length})`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour afficher les élèves d'une classe */}
      {modalElevesOuvert && classePourEleves && (
        <div className="overlay-modal" onClick={fermerModalEleves}>
          <div className="modal-eleves-classe" onClick={(e) => e.stopPropagation()}>
            {/* En-tête de la modale */}
            <div className="en-tete-modal-modern">
              <div className="titre-modal-modern">
                <div className="icone-titre-modal">👨‍🎓</div>
                <div>
                  <h2>Élèves de la classe {classePourEleves.niveau} {classePourEleves.nom}</h2>
                </div>
              </div>
              <button className="bouton-fermer-modal-modern" onClick={fermerModalEleves}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Contenu de la modale */}
            <div className="contenu-modal-eleves">
              {chargementElevesClasse ? (
                <div className="chargement-eleves">
                  <div className="spinner-grand"></div>
                  <p>Chargement des élèves...</p>
                </div>
              ) : (
                <>
                  {/* Informations rapides */}
                  <div className="infos-rapides">
                    <div className="info-rapide">
                      <span className="label">Classe :</span>
                      <span className="valeur">{classePourEleves.niveau} {classePourEleves.nom}</span>
                    </div>
                    <div className="info-rapide">
                      <span className="label">Total élèves :</span>
                      <span className="valeur">{elevesClasse.length}</span>
                    </div>
                    {classePourEleves.nom_professeur_principal && (
                      <div className="info-rapide">
                        <span className="label">Enseignant :</span>
                        <span className="valeur">{classePourEleves.nom_professeur_principal}</span>
                      </div>
                    )}

                    {/* Bouton d'impression */}
                    <button 
                      className="bouton-imprimer-detail"
                      onClick={imprimerListeElevesClasse}
                      disabled={elevesClasse.length === 0}
                      style={{
                        background: elevesClasse.length === 0 
                          ? '#9ca3af' 
                          : `linear-gradient(135deg, ${parametresEcole?.couleur_principale || '#3B82F6'} 0%, ${parametresEcole?.couleur_principale ? '#1d4ed8' : '#1D4ED8'} 100%)`,
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: elevesClasse.length === 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        if (elevesClasse.length > 0) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 4px 12px ${parametresEcole?.couleur_principale ? `${parametresEcole.couleur_principale}60` : 'rgba(59, 130, 246, 0.3)'}`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (elevesClasse.length > 0) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {elevesClasse.length === 0 ? '📄 Vide' : `🖨️ Imprimer (${elevesClasse.length})`}
                    </button>
                  </div>

                  {/* Tableau des élèves */}
                  <div className="tableau-eleves-container">
                    {elevesClasse.length > 0 ? (
                      <table className="tableau-eleves">
                        <thead>
                          <tr className="style-2">
                            <th className="colonne-numero colonne-sans-tri">
                              <div className="en-tete-tri">
                                <span>N°</span>
                              </div>
                            </th>
                            <th onClick={() => gererTriModal('matricule')}>
                              <div className="en-tete-tri">
                                <span>Matricule</span>
                                <div className="fleches-tri">
                                  <div className={`fleche-tri fleche-haut ${triModal.colonne === 'matricule' && triModal.ordre === 'asc' ? 'fleche-active' : ''}`} />
                                  <div className={`fleche-tri fleche-bas ${triModal.colonne === 'matricule' && triModal.ordre === 'desc' ? 'fleche-active' : ''}`} />
                                </div>
                              </div>
                            </th>
                            <th onClick={() => gererTriModal('nom')}>
                              <div className="en-tete-tri">
                                <span>Nom et Prénom</span>
                                <div className="fleches-tri">
                                  <div className={`fleche-tri fleche-haut ${triModal.colonne === 'nom' && triModal.ordre === 'asc' ? 'fleche-active' : ''}`} />
                                  <div className={`fleche-tri fleche-bas ${triModal.colonne === 'nom' && triModal.ordre === 'desc' ? 'fleche-active' : ''}`} />
                                </div>
                              </div>
                            </th>
                            <th onClick={() => gererTriModal('genre')}>
                              <div className="en-tete-tri">
                                <span>Genre</span>
                                <div className="fleches-tri">
                                  <div className={`fleche-tri fleche-haut ${triModal.colonne === 'genre' && triModal.ordre === 'asc' ? 'fleche-active' : ''}`} />
                                  <div className={`fleche-tri fleche-bas ${triModal.colonne === 'genre' && triModal.ordre === 'desc' ? 'fleche-active' : ''}`} />
                                </div>
                              </div>
                            </th>
                            <th onClick={() => gererTriModal('date_naissance')}>
                              <div className="en-tete-tri">
                                <span>Date Naissance</span>
                                <div className="fleches-tri">
                                  <div className={`fleche-tri fleche-haut ${triModal.colonne === 'date_naissance' && triModal.ordre === 'asc' ? 'fleche-active' : ''}`} />
                                  <div className={`fleche-tri fleche-bas ${triModal.colonne === 'date_naissance' && triModal.ordre === 'desc' ? 'fleche-active' : ''}`} />
                                </div>
                              </div>
                            </th>
                            <th onClick={() => gererTriModal('lieu_naissance')}>
                              <div className="en-tete-tri">
                                <span>Lieu Naissance</span>
                                <div className="fleches-tri">
                                  <div className={`fleche-tri fleche-haut ${triModal.colonne === 'lieu_naissance' && triModal.ordre === 'asc' ? 'fleche-active' : ''}`} />
                                  <div className={`fleche-tri fleche-bas ${triModal.colonne === 'lieu_naissance' && triModal.ordre === 'desc' ? 'fleche-active' : ''}`} />
                                </div>
                              </div>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {elevesClasseTries.map((eleve, index) => {
                            const age = calculerAge(eleve.date_naissance);
                            return (
                              <tr key={eleve.id} className="style-1">
                                <td>
                                  <div className="badge-numero">{index + 1}</div>
                                </td>
                                <td className="matricule">{eleve.matricule || 'N/A'}</td>
                                <td>
                                  <div className="nom-complet-avec-photo">
                                    <div className="avatar-liste">
                                      {eleve.photo_url ? (
                                        <img 
                                          src={eleve.photo_url} 
                                          alt={`${eleve.prenom} ${eleve.nom}`}
                                          className="photo-eleve-liste"
                                        />
                                      ) : (
                                        <div className="avatar-placeholder-liste">
                                          {(eleve.prenom?.charAt(0) || '?') + (eleve.nom?.charAt(0) || '?')}
                                        </div>
                                      )}
                                    </div>
                                    <div className="info-eleve-liste">
                                      <strong>{eleve.nom} {eleve.prenom}</strong>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge-genre ${eleve.genre === 'M' ? 'garcon' : 'fille'}`}>
                                    {eleve.genre === 'M' ? '👦 Garçon' : '👧 Fille'}
                                  </span>
                                </td>
                                <td>
                                  <div>
                                    <div>{formaterDate(eleve.date_naissance)}</div>
                                    <div className="age-eleve" style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                      ({age} ans)
                                    </div>
                                  </div>
                                </td>
                                <td>{eleve.lieu_naissance || 'Non renseigné'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    ) : (
                      <div className="aucune-donnee">
                        <p>Aucun élève dans cette classe</p>
                        <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                          Vérifiez que des élèves sont bien inscrits dans cette classe.
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}