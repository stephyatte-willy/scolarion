'use client';

import { useState, useEffect } from 'react';
import './GestionEleves.css';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';

// Interfaces existantes (gardez-les telles quelles)
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

interface DossierPhysique {
  url: string;
  nomOriginal: string;
  taille: number;
  type: string;
  date: string;
}

interface Eleve {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance?: string;
  genre: 'M' | 'F';
  adresse?: string;
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

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  cycle?: string;
  capacite_max: number;
  professeur_principal_id?: number;
}

interface FiltresEleves {
  recherche?: string;
  classe_id?: number;
  statut?: string;
  genre?: string;
}

interface TriColonne {
  colonne: keyof Eleve | null;
  ordre: 'asc' | 'desc';
}

interface Props {
  onRetourTableauDeBord: () => void;
}

interface SelectionMultiple {
  elevesSelectionnes: number[];
  selectionTous: boolean;
}

export default function GestionEleves({ onRetourTableauDeBord }: Props) {
  // États existants (gardez-les tous)
  const [eleves, setEleves] = useState<Eleve[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [modalDetailOuvert, setModalDetailOuvert] = useState(false);
  const [modalSuppressionOuvert, setModalSuppressionOuvert] = useState(false);
  const [eleveSelectionne, setEleveSelectionne] = useState<Eleve | null>(null);
  const [eleveASupprimer, setEleveASupprimer] = useState<Eleve | null>(null);
  const [filtres, setFiltres] = useState<FiltresEleves>({});
  const [tri, setTri] = useState<TriColonne>({ colonne: null, ordre: 'asc' });
  const [soumissionEnCours, setSoumissionEnCours] = useState(false);
  const [statistiques, setStatistiques] = useState<any>(null);
  const [voirToutesLesClasses, setVoirToutesLesClasses] = useState(false);
  const [ajoutMultiple, setAjoutMultiple] = useState(false);
  const [fichiersDossiers, setFichiersDossiers] = useState<File[]>([]);
  const [uploadDossiersEnCours, setUploadDossiersEnCours] = useState(false);
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp | null>(null);
  const [modalClassesOuvert, setModalClassesOuvert] = useState(false);
  const [classeSelectionnee, setClasseSelectionnee] = useState<any>(null);
  const [elevesClasse, setElevesClasse] = useState<Eleve[]>([]);
  const [chargementElevesClasse, setChargementElevesClasse] = useState(false);
  const [defilementVersDossier, setDefilementVersDossier] = useState(false);
  

  // États pour le formulaire
  const [formData, setFormData] = useState({
  matricule: '',
  nom: '',
  prenom: '',
  date_naissance: '',
  lieu_naissance: '',
  genre: 'M' as 'M' | 'F',
  adresse: '',
  email: '',
  nom_pere: '',
  nom_mere: '',
  telephone_parent: '',
  classe_id: '',
  statut: 'actif' as 'actif' | 'inactif' | 'diplome' | 'abandon',
  photo_url: '' // 👈 AJOUTEZ CETTE LIGNE
});

  // États pour la gestion des erreurs
  const [erreurFormulaire, setErreurFormulaire] = useState('');

  // États pour la sélection multiple
  const [selection, setSelection] = useState<SelectionMultiple>({
    elevesSelectionnes: [],
    selectionTous: false
  });

  const [modalSuppressionMultipleOuvert, setModalSuppressionMultipleOuvert] = useState(false);

  // État pour l'upload de photo
  const [uploadPhoto, setUploadPhoto] = useState({
    enCours: false,
    progression: 0,
    fichier: null as File | null,
    apercu: null as string | null
  });

  // NOUVEAU : Hook pour les toasts
  const { toasts, showSuccess, showError, showWarning, removeToast } = useToast();

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

  // Formater un montant (si utilisé)
  const formaterMontant = (montant: number): string => {
    if (!parametresApp) {
      return `${montant} F CFA`;
    }
    
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: parametresApp.devise,
        currencyDisplay: 'code'
      }).format(montant).replace(parametresApp.devise, parametresApp.symbole_devise);
    } catch (error) {
      console.error('Erreur formatage montant:', error);
      return `${montant} ${parametresApp.symbole_devise}`;
    }
  };

  // ==================== FONCTIONS EXISTANTES ====================

  // Fonction pour générer un matricule automatique
  const genererMatricule = (): string => {
    const annee = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `ELV${annee}${random}`;
  };

  // Fonction pour initialiser le formulaire avec un matricule généré
  const initialiserFormulaireAvecMatricule = () => {
    const nouveauMatricule = genererMatricule();
    setFormData({
      matricule: nouveauMatricule,
      nom: '',
      prenom: '',
      date_naissance: '',
      lieu_naissance: '',
      genre: 'M',
      adresse: '',
      email: '',
      nom_pere: '',
      nom_mere: '',
      telephone_parent: '',
      classe_id: '',
      statut: 'actif',
       photo_url: ''
    });
  };

  const reinitialiserFormulaire = () => {
    const nouveauMatricule = genererMatricule();
    setFormData({
      matricule: nouveauMatricule,
      nom: '',
      prenom: '',
      date_naissance: '',
      lieu_naissance: '',
      genre: 'M' as 'M' | 'F',
      adresse: '',
      email: '',
      nom_pere: '',
      nom_mere: '',
      telephone_parent: '',
      classe_id: '',
      statut: 'actif' as 'actif' | 'inactif' | 'diplome' | 'abandon',
       photo_url: ''
    });
    
    reinitialiserUpload();
    setFichiersDossiers([]);
    setErreurFormulaire('');
  };

  // Fonction pour obtenir l'icône selon le type de fichier
  const getIconeTypeFichier = (type: string): string => {
    if (type.includes('pdf')) return '📕';
    if (type.includes('word') || type.includes('doc')) return '📝';
    if (type.includes('excel') || type.includes('sheet')) return '📊';
    if (type.includes('image')) return '🖼️';
    return '📄';
  };

  useEffect(() => {
    chargerDonneesInitiales();
  }, []);

  useEffect(() => {
    chargerDonnees();
    chargerStatistiques();
  }, [filtres]);

  useEffect(() => {
  if (modalDetailOuvert && defilementVersDossier && eleveSelectionne) {
    // Petit délai pour permettre au DOM de se mettre à jour
    setTimeout(() => {
      const sectionDossier = document.getElementById('section-dossiers-eleve');
      if (sectionDossier) {
        sectionDossier.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
      setDefilementVersDossier(false);
    }, 300);
  }
}, [modalDetailOuvert, defilementVersDossier, eleveSelectionne]);

  const chargerDonneesInitiales = async () => {
    try {
      await Promise.all([
        chargerParametresEcole(),
        chargerParametresApp(),
        chargerClasses()
      ]);
    } catch (error) {
      console.error('Erreur chargement données initiales:', error);
      showError('Erreur lors du chargement des données initiales');
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
      showError('Erreur lors du chargement des paramètres de l\'école');
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
      showError('Erreur lors du chargement des paramètres de l\'application');
    }
  };

  const chargerClasses = async () => {
    try {
      const response = await fetch('/api/eleves/classes');
      const data = await response.json();
      if (data.success) setClasses(data.classes || []);
    } catch (error) {
      console.error('Erreur chargement classes:', error);
      showError('Erreur lors du chargement des classes');
    }
  };

  // Fonction pour formater le nom en majuscules
  const formaterNom = (value: string): string => {
    return value.toUpperCase();
  };

  // Fonction pour formater les prénoms (première lettre en majuscule après chaque espace)
  const formaterPrenom = (value: string): string => {
    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Fonction pour valider et formater les numéros de téléphone
  const formaterTelephone = (value: string): string => {
    const numerosSeulement = value.replace(/\D/g, '');
    return numerosSeulement.slice(0, 10);
  };

  // Fonction de gestion des changements
  const gererChangementFormulaire = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    let valeurFormatee = value;

    switch (name) {
      case 'nom':
        valeurFormatee = formaterNom(value);
        break;
      case 'prenom':
      case 'nom_pere':
      case 'nom_mere':
        valeurFormatee = formaterPrenom(value);
        break;
      case 'telephone_parent':
        valeurFormatee = formaterTelephone(value);
        break;
      default:
        valeurFormatee = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: valeurFormatee
    }));
    
    setErreurFormulaire('');
  };
  
  const chargerDonnees = async () => {
    setChargement(true);
    try {
      const queryParams = new URLSearchParams();
      if (filtres.recherche) queryParams.append('recherche', filtres.recherche);
      if (filtres.classe_id) queryParams.append('classe_id', filtres.classe_id.toString());
      if (filtres.statut) queryParams.append('statut', filtres.statut);
      if (filtres.genre) queryParams.append('genre', filtres.genre);

      console.log('🔍 Chargement élèves avec filtres:', filtres);
      
      const [elevesResponse] = await Promise.all([
        fetch(`/api/eleves?${queryParams}`)
      ]);

      const elevesData = await elevesResponse.json();

      console.log('📊 Réponse élèves API:', {
        success: elevesData.success,
        nbEleves: elevesData.eleves?.length
      });

      if (elevesData.success) {
        setEleves(elevesData.eleves || []);
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      showError('Erreur lors du chargement des données');
    } finally {
      setChargement(false);
    }
  };

  const chargerStatistiques = async () => {
    try {
      const response = await fetch('/api/eleves/statistiques');
      const data = await response.json();
      if (data.success) {
        setStatistiques(data.statistiques);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
      showError('Erreur lors du chargement des statistiques');
    }
  };

  const gererTri = (colonne: keyof Eleve) => {
    setTri(prev => ({
      colonne,
      ordre: prev.colonne === colonne && prev.ordre === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Gestion de la sélection multiple
  const gererSelectionEleve = (id: number) => {
    setSelection(prev => {
      const elevesSelectionnes = prev.elevesSelectionnes.includes(id)
        ? prev.elevesSelectionnes.filter(eleveId => eleveId !== id)
        : [...prev.elevesSelectionnes, id];
      
      return {
        ...prev,
        elevesSelectionnes,
        selectionTous: elevesSelectionnes.length === elevesTries.length
      };
    });
  };

  const gererSelectionTous = () => {
    setSelection(prev => {
      const selectionTous = !prev.selectionTous;
      const elevesSelectionnes = selectionTous 
        ? elevesTries.map(eleve => eleve.id)
        : [];
      
      return {
        ...prev,
        selectionTous,
        elevesSelectionnes
      };
    });
  };

  const ouvrirModalSuppressionMultiple = () => {
    if (selection.elevesSelectionnes.length === 0) {
      showError('Veuillez sélectionner au moins un élève à supprimer');
      return;
    }
    setModalSuppressionMultipleOuvert(true);
  };

  const fermerModalSuppressionMultiple = () => {
    setModalSuppressionMultipleOuvert(false);
  };

  const supprimerElevesMultiple = async () => {
    if (selection.elevesSelectionnes.length === 0) return;

    try {
      setSoumissionEnCours(true);
      
      const suppressions = selection.elevesSelectionnes.map(id => 
        fetch(`/api/eleves/${id}`, { method: 'DELETE' })
      );

      const resultats = await Promise.all(suppressions);
      const tousReussis = resultats.every(response => response.ok);

      if (tousReussis) {
        showSuccess(`${selection.elevesSelectionnes.length} élève(s) supprimé(s) avec succès!`);
        
        setSelection({ elevesSelectionnes: [], selectionTous: false });
        fermerModalSuppressionMultiple();
        
        chargerDonnees();
        chargerStatistiques();
      } else {
        throw new Error('Certaines suppressions ont échoué');
      }
    } catch (error) {
      console.error('❌ Erreur suppression multiple:', error);
      showError('Erreur lors de la suppression des élèves');
    } finally {
      setSoumissionEnCours(false);
    }
  };

  const obtenirElevesSelectionnes = () => {
    return elevesTries.filter(eleve => 
      selection.elevesSelectionnes.includes(eleve.id)
    );
  };

  const elevesTries = [...eleves].sort((a, b) => {
    if (!tri.colonne) return 0;
    
    const aValue = a[tri.colonne];
    const bValue = b[tri.colonne];
    
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

  const gererChangementFiltre = (key: keyof FiltresEleves, value: any) => {
    setFiltres(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };


const reinitialiserFiltres = () => {
  setFiltres({});
};

  const debugEleve = (eleve: Eleve | null, contexte: string) => {
    console.log(`🔍 DEBUG ${contexte}:`, {
      id: eleve?.id,
      typeId: typeof eleve?.id,
      nom: eleve?.nom,
      prenom: eleve?.prenom,
      matricule: eleve?.matricule
    });
  };

  const ouvrirModal = (eleve?: Eleve) => {
    setErreurFormulaire('');
    setAjoutMultiple(false);
    
    reinitialiserUpload();
    setFichiersDossiers([]);
    
    if (eleve) {
      setEleveSelectionne(eleve);
      
      const dateNaissance = new Date(eleve.date_naissance);
      const dateFormatee = dateNaissance.toISOString().split('T')[0];
      
      setFormData({
        matricule: eleve.matricule,
        nom: eleve.nom,
        prenom: eleve.prenom,
        date_naissance: dateFormatee,
        lieu_naissance: eleve.lieu_naissance || '',
        genre: eleve.genre,
        adresse: eleve.adresse || '',
        email: eleve.email || '',
        nom_pere: eleve.nom_pere || '',
        nom_mere: eleve.nom_mere || '',
        telephone_parent: eleve.telephone_parent || '',
          photo_url: '',
        classe_id: eleve.classe_id && classes.find(c => c.id === eleve.classe_id) 
          ? eleve.classe_id.toString() 
          : '',
        statut: eleve.statut
      });
      
      if (eleve.photo_url) {
        setUploadPhoto(prev => ({
          ...prev,
          apercu: eleve.photo_url || null
        }));
      }
    } else {
      setEleveSelectionne(null);
      const nouveauMatricule = genererMatricule();
      setFormData({
        matricule: nouveauMatricule,
        nom: '',
        prenom: '',
        date_naissance: '',
        lieu_naissance: '',
        genre: 'M',
        adresse: '',
        email: '',
        nom_pere: '',
        nom_mere: '',
        telephone_parent: '',
        classe_id: '',
        statut: 'actif',
          photo_url: ''
      });
    }
    setModalOuvert(true);
  };

  const fermerModal = () => {
    setModalOuvert(false);
    setEleveSelectionne(null);
    setErreurFormulaire('');
  };

  const ouvrirModalDetail = (eleve: Eleve, versDossier: boolean = false) => {
  setEleveSelectionne(eleve);
  setModalDetailOuvert(true);
  if (versDossier) {
    setDefilementVersDossier(true);
  }
};

  const fermerModalDetail = () => {
    setModalDetailOuvert(false);
    setEleveSelectionne(null);
  };

  const ouvrirModalSuppression = (eleve: Eleve) => {
    setEleveASupprimer(eleve);
    setModalSuppressionOuvert(true);
  };

  const fermerModalSuppression = () => {
    setModalSuppressionOuvert(false);
    setEleveASupprimer(null);
  };
  
  const soumettreFormulaire = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (soumissionEnCours) return;
    
    const matriculeValide = formData.matricule.trim();
    const nomValide = formData.nom.trim();
    const prenomValide = formData.prenom.trim();
    
    if (!matriculeValide || !nomValide || !prenomValide || !formData.date_naissance) {
      setErreurFormulaire('Les champs matricule, nom, prénom et date de naissance sont requis');
      showError('Les champs matricule, nom, prénom et date de naissance sont requis');
      return;
    }
    
    if (!/^[A-Z0-9]{5,20}$/.test(matriculeValide)) {
      setErreurFormulaire('Le matricule doit contenir uniquement des lettres majuscules et chiffres (5-20 caractères)');
      showError('Le matricule doit contenir uniquement des lettres majuscules et chiffres (5-20 caractères)');
      return;
    }
    
    try {
      const response = await fetch(`/api/eleves?recherche=${encodeURIComponent(matriculeValide)}`);
      const data = await response.json();
      
      if (data.success && data.eleves) {
        if (eleveSelectionne) {
          const autreEleveAvecMemeMatricule = data.eleves.find(
            (e: Eleve) => e.matricule === matriculeValide && e.id !== eleveSelectionne.id
          );
          
          if (autreEleveAvecMemeMatricule) {
            const message = `Ce matricule est déjà utilisé par l'élève: ${autreEleveAvecMemeMatricule.nom} ${autreEleveAvecMemeMatricule.prenom}`;
            setErreurFormulaire(message);
            showError(message);
            return;
          }
        } else {
          if (data.eleves.some((e: Eleve) => e.matricule === matriculeValide)) {
            const message = 'Ce matricule est déjà utilisé par un autre élève';
            setErreurFormulaire(message);
            showError(message);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Erreur vérification matricule:', error);
    }

    setSoumissionEnCours(true);
    
    try {
      const dataAEnvoyer: any = {
        matricule: matriculeValide,
        nom: nomValide,
        prenom: prenomValide,
        date_naissance: formData.date_naissance,
        lieu_naissance: formData.lieu_naissance.trim() || null,
        genre: formData.genre,
        adresse: formData.adresse.trim() || null,
        email: formData.email.trim() || null,
        nom_pere: formData.nom_pere.trim() || null,
        nom_mere: formData.nom_mere.trim() || null,
        telephone_parent: formData.telephone_parent.trim() || null,
        statut: formData.statut
      };

      if (uploadPhoto.fichier) {
       dataAEnvoyer.photo_url = await uploaderPhoto(); 
      } else if (uploadPhoto.apercu === null && eleveSelectionne?.photo_url) {
        // Supprimer la photo
        dataAEnvoyer.photo_url = null;
      } else if (uploadPhoto.apercu === eleveSelectionne?.photo_url) {
        // Garder la photo existante
        dataAEnvoyer.photo_url = eleveSelectionne.photo_url;
      }

      let dossiersPhysiquesData: any[] = [];
      if (fichiersDossiers.length > 0) {
        try {
          console.log('📤 Tentative upload de', fichiersDossiers.length, 'dossiers...');
          const resultatsUpload = await uploaderDossiersPhysiques();
          dossiersPhysiquesData = resultatsUpload;
          console.log('✅ Dossiers uploadés:', dossiersPhysiquesData);
        } catch (error) {
          console.error('❌ Erreur upload des dossiers:', error);
          showWarning('Élève créé/modifié, mais certains dossiers n\'ont pas pu être sauvegardés.');
        }
      } else if (eleveSelectionne?.dossiers_physiques) {
        dossiersPhysiquesData = eleveSelectionne.dossiers_physiques;
      }

      if (dossiersPhysiquesData.length > 0) {
        dataAEnvoyer.dossiers_physiques = JSON.stringify(dossiersPhysiquesData);
      } else {
        dataAEnvoyer.dossiers_physiques = null;
      }

      if (formData.classe_id && formData.classe_id.trim() !== '') {
        const classeId = parseInt(formData.classe_id);
        const classeExistante = classes.find(c => c.id === classeId);
        if (classeExistante) {
          dataAEnvoyer.classe_id = classeId;
        } else {
          const message = 'La classe sélectionnée n\'existe pas';
          setErreurFormulaire(message);
          showError(message);
          setSoumissionEnCours(false);
          return;
        }
      } else {
        dataAEnvoyer.classe_id = null;
      }

      console.log('📤 Données à envoyer:', dataAEnvoyer);

      let response;
      let url;
      
      if (eleveSelectionne) {
        if (!eleveSelectionne.id || isNaN(eleveSelectionne.id) || eleveSelectionne.id <= 0) {
          console.error('❌ ID invalide dans élève sélectionné:', eleveSelectionne.id);
          const message = 'ID d\'élève invalide pour la modification';
          setErreurFormulaire(message);
          showError(message);
          return;
        }

        url = `/api/eleves/${eleveSelectionne.id}`;
        response = await fetch(url, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataAEnvoyer)
        });
      } else {
        url = '/api/eleves';
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataAEnvoyer)
        });
      }

      const resultat = await response.json();

      if (resultat.success) {
        if (!eleveSelectionne) {
          setAjoutMultiple(true);
          
          const message = `Élève créé avec succès! ${fichiersDossiers.length > 0 ? 'Dossiers téléchargés.' : ''}`;
          showSuccess(message);
          
          reinitialiserFormulaire();
          
          chargerDonnees();
          chargerStatistiques();
        } else {
          fermerModal();
          chargerDonnees();
          chargerStatistiques();
          showSuccess('Élève mis à jour avec succès!');
        }
      } else {
        const messageErreur = resultat.erreur || 'Erreur lors de l\'opération';
        setErreurFormulaire(messageErreur);
        showError(messageErreur);
      }
    } catch (error) {
      console.error('❌ Erreur réseau ou serveur:', error);
      const message = 'Erreur de connexion au serveur';
      setErreurFormulaire(message);
      showError(message);
    } finally {
      setSoumissionEnCours(false);
      if (eleveSelectionne) {
        reinitialiserUpload();
        setFichiersDossiers([]);
      }
    }
  };

  const gererSelectionDossiers = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichiers = e.target.files;
    if (fichiers && fichiers.length > 0) {
      const fichiersArray = Array.from(fichiers);
      
      const typesAutorises = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/jpg',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      const fichiersValides = fichiersArray.filter(fichier => {
        const estValide = typesAutorises.includes(fichier.type);
        const tailleValide = fichier.size <= 10 * 1024 * 1024;
        
        if (!estValide) {
          console.warn(`⚠️ Fichier non supporté: ${fichier.name} (${fichier.type})`);
        }
        if (!tailleValide) {
          console.warn(`⚠️ Fichier trop volumineux: ${fichier.name} (${fichier.size / 1024 / 1024}MB)`);
        }
        
        return estValide && tailleValide;
      });
      
      if (fichiersValides.length !== fichiersArray.length) {
        showWarning('Certains fichiers ont été ignorés (type non supporté ou taille > 10MB)');
      }
      
      setFichiersDossiers(prev => [...prev, ...fichiersValides]);
    }
  };

  const supprimerFichierDossier = (index: number) => {
    setFichiersDossiers(prev => prev.filter((_, i) => i !== index));
  };

  const uploaderDossiersPhysiques = async (): Promise<any[]> => {
    if (fichiersDossiers.length === 0) {
      console.log('📤 Aucun fichier à uploader');
      return [];
    }

    console.log('📤 Début upload dossiers:', fichiersDossiers.length, 'fichiers');
    
    setUploadDossiersEnCours(true);
    const resultats: any[] = [];

    try {
      for (let i = 0; i < fichiersDossiers.length; i++) {
        const fichier = fichiersDossiers[i];
        console.log(`📤 [${i+1}/${fichiersDossiers.length}] Upload fichier:`, fichier.name);
        
        const uploadFormData = new FormData();
        uploadFormData.append('dossier', fichier);
        uploadFormData.append('nomEleve', `${formData.nom}_${formData.prenom}`.replace(/[^a-zA-Z0-9]/g, '_'));
        uploadFormData.append('matricule', eleveSelectionne?.matricule || 'nouveau_' + Date.now());

        console.log('📤 Envoi requête à /api/upload-dossier...');
        
        const response = await fetch('/api/upload-dossier', {
          method: 'POST',
          body: uploadFormData,
        });

        console.log('📡 Réponse upload:', response.status, response.statusText);
        
        const result = await response.json();
        console.log('📊 Résultat upload:', result);
        
        if (response.ok && result.success) {
          resultats.push({
            url: result.url,
            nomOriginal: result.nomOriginal || fichier.name,
            taille: result.taille || fichier.size,
            type: result.type || fichier.type,
            date: result.date || new Date().toISOString()
          });
          console.log('✅ Fichier uploadé avec succès:', result.nomOriginal);
        } else {
          console.error('❌ Erreur upload fichier:', result.erreur || 'Erreur inconnue');
          throw new Error(`Échec upload ${fichier.name}: ${result.erreur || 'Erreur serveur'}`);
        }
        
        if (i < fichiersDossiers.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log('✅ Tous les uploads terminés:', resultats.length, 'fichiers');
      return resultats;

    } catch (error) {
      console.error('❌ Erreur upload des dossiers:', error);
      showError(`Erreur lors de l'upload des dossiers: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      throw error;
    } finally {
      setUploadDossiersEnCours(false);
    }
  };

  const gererSelectionFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fichier = e.target.files?.[0];
    if (fichier) {
      if (!fichier.type.startsWith('image/')) {
        showError('Veuillez sélectionner une image valide');
        return;
      }
      
      if (fichier.size > 5 * 1024 * 1024) {
        showError('L\'image ne doit pas dépasser 5MB');
        return;
      }
      
      setUploadPhoto(prev => ({
        ...prev,
        fichier,
        apercu: URL.createObjectURL(fichier)
      }));
    }
  };

const uploaderPhoto = async (): Promise<string> => {
  if (!uploadPhoto.fichier) {
    throw new Error('Aucun fichier à uploader');
  }

  setUploadPhoto(prev => ({ ...prev, enCours: true, progression: 0 }));

  try {
    const formData = new FormData();
    formData.append('photo', uploadPhoto.fichier);

    // Simuler la progression
    const interval = setInterval(() => {
      setUploadPhoto(prev => ({
        ...prev,
        progression: Math.min(prev.progression + 10, 90)
      }));
    }, 200);

    const response = await fetch('/api/eleves/photo', {
      method: 'POST',
      body: formData,
    });

    clearInterval(interval);

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.erreur || 'Erreur lors de l\'upload');
    }

    setUploadPhoto(prev => ({ ...prev, progression: 100 }));
    
    // Petite pause pour voir la progression
    await new Promise(resolve => setTimeout(resolve, 500));

     console.log('📸 URL photo reçue:', data.photo_url);

    // ✅ L'URL retournée est propre et courte
    return data.photo_url;

  } catch (error) {
    console.error('❌ Erreur upload:', error);
    showError(`Erreur upload: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    throw error;
  } finally {
    setUploadPhoto(prev => ({ ...prev, enCours: false }));
  }
};

const supprimerPhotoServeur = async (photoUrl: string) => {
  try {
    const fileName = photoUrl.split('/').pop();
    if (!fileName) return;
    
    const response = await fetch(`/api/eleves/photo?file=${fileName}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    if (!data.success) {
      console.warn('⚠️ Erreur suppression photo:', data.erreur);
    }
  } catch (error) {
    console.error('❌ Erreur suppression photo serveur:', error);
  }
};

  const reinitialiserUpload = () => {
    if (uploadPhoto.apercu) {
      URL.revokeObjectURL(uploadPhoto.apercu);
    }
    setUploadPhoto({
      enCours: false,
      progression: 0,
      fichier: null,
      apercu: null
    });
  };

  const supprimerEleve = async () => {
    if (!eleveASupprimer) {
      console.error('❌ Aucun élève à supprimer');
      return;
    }

    if (!eleveASupprimer.id || isNaN(eleveASupprimer.id) || eleveASupprimer.id <= 0) {
      console.error('❌ ID invalide pour suppression:', eleveASupprimer.id);
      showError('ID d\'élève invalide pour la suppression');
      fermerModalSuppression();
      return;
    }

    try {
      const url = `/api/eleves/${eleveASupprimer.id}`;
      console.log('🗑️ Tentative suppression - URL:', url);
      console.log('👤 Élève à supprimer:', eleveASupprimer.nom, eleveASupprimer.prenom);
      
      const response = await fetch(url, {
        method: 'DELETE'
      });

      console.log('📡 Statut réponse suppression:', response.status);
      const resultat = await response.json();
      console.log('📥 Réponse suppression:', resultat);

      if (resultat.success) {
        fermerModalSuppression();
        chargerDonnees();
        chargerStatistiques();
        showSuccess('Élève supprimé avec succès!');
      } else {
        const messageErreur = resultat.erreur || 'Erreur lors de la suppression';
        console.error('❌ Erreur suppression:', messageErreur);
        showError(messageErreur);
        fermerModalSuppression();
      }
    } catch (error) {
      console.error('❌ Erreur réseau lors de la suppression:', error);
      showError('Erreur de connexion au serveur');
      fermerModalSuppression();
    }
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

  if (chargement && eleves.length === 0) {
    return (
      <div className="chargement-eleves">
        <div className="spinner-grand"></div>
        <p>Chargement des élèves...</p>
      </div>
    );
  }

  const ouvrirModalClasse = async (classe: any) => {
    setClasseSelectionnee(classe);
    setChargementElevesClasse(true);
    
    try {
      const response = await fetch(`/api/eleves?classe_id=${classe.id}`);
      const data = await response.json();
      
      if (data.success) {
        setElevesClasse(data.eleves || []);
      } else {
        setElevesClasse([]);
        showError('Erreur lors du chargement des élèves');
      }
    } catch (error) {
      console.error('Erreur chargement élèves classe:', error);
      setElevesClasse([]);
    } finally {
      setChargementElevesClasse(false);
      setModalClassesOuvert(true);
    }
  };

  const fermerModalClasses = () => {
    setModalClassesOuvert(false);
    setClasseSelectionnee(null);
    setElevesClasse([]);
  };

  const imprimerListeClasse = async () => {
    if (!classeSelectionnee) return;
    
    // Votre code d'impression existant...
    const ecoleData: ParametresEcole = parametresEcole || {
      id: 0,
      nom_ecole: "École Primaire Notre Dame",
      slogan: "L'excellence éducative",
      adresse: "Rue des Écoles, 12345 Ville",
      telephone: "01 23 45 67 89",
      email: "ecole@contact.fr",
      logo_url: null,
      couleur_principale: "#3B82F6",
      annee_scolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    };
    
    // Si pas de paramètres, essayer de les charger
    if (!parametresEcole) {
      try {
        const response = await fetch('/api/parametres/ecole');
        const data = await response.json();
        if (data.success && data.parametres) {
          Object.assign(ecoleData, data.parametres);
        }
      } catch (error) {
        console.error('Erreur chargement école:', error);
      }
    }
    
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
        <title>Liste des Élèves - ${classeSelectionnee.niveau} ${classeSelectionnee.nom}</title>
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
            border-bottom: 1px solid ${ecoleData.couleur_principale};
            padding-bottom: 1px;
            margin-bottom: 1px;
          }
          .school-name {
            font-size: 20px;
            font-weight: bold;
            color: #2c3e50;
            margin: 2px 0;
            text-transform: uppercase;
          }
          .school-info {
            color: #666;
            font-size: 14px;
            margin: 1px 0;
            display: flex;
            justify-content: center;
            gap: 2px;
            flex-wrap: wrap;
          }
          .class-title {
            font-size: 22px;
            margin: 20px 0;
            color: #34495e;
            background: linear-gradient(90deg, ${ecoleData.couleur_principale}20, transparent);
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
            background: ${ecoleData.couleur_principale};
            color: white;
            padding: 12px 15px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #1d4ed8;
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
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #7f8c8d;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            body { 
              margin: 0 !important;
              padding: 10px !important;
              font-size: 12px !important;
            }
            .no-print { display: none !important; }
            th { font-size: 11px; padding: 8px 10px; }
            td { font-size: 11px; padding: 8px 10px; }
            .class-info { break-inside: avoid; }
          }
          .signature-area {
            margin-top: 60px;
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 40px;
            text-align: right;
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
            margin-bottom: 2px;
          }
          .logo-img {
            max-height: 40px;
            max-width: 40px;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="date-print">
          Imprimé le: ${dateImpression} à ${heureImpression}
        </div>
        
        <div class="header">
          <div class="logo-header">
            ${ecoleData.logo_url ? `<img src="${ecoleData.logo_url}" class="logo-img" alt="Logo">` : ''}
            <div>
              <div class="school-name">${ecoleData.nom_ecole}</div>
              <div class="school-info">
                ${ecoleData.adresse ? `<span>📍 ${ecoleData.adresse}</span>` : ''}
                ${ecoleData.telephone ? `<span>📞 ${ecoleData.telephone}</span>` : ''}
                ${ecoleData.email ? `<span>✉️ ${ecoleData.email}</span>` : ''}
              </div>
            </div>
          </div>
          
          <div class="class-title">
            📋 LISTE DES ÉLÈVES - ${classeSelectionnee.niveau} ${classeSelectionnee.nom}
          </div>
        </div>
        
        <div class="class-info">
          <div class="info-item">
            <div class="info-label">Niveau</div>
            <div class="info-value">${classeSelectionnee.niveau}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Classe</div>
            <div class="info-value">${classeSelectionnee.nom}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Total Élèves</div>
            <div class="info-value">${elevesClasse.length}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Année Scolaire</div>
            <div class="info-value">${ecoleData.annee_scolaire}</div>
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
              </tr>
            </thead>
            <tbody>
              ${elevesClasse.map((eleve, index) => {
                const age = calculerAge(eleve.date_naissance);
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td><strong>${eleve.matricule}</strong></td>
                    <td><strong>${eleve.nom} ${eleve.prenom}</strong></td>
                    <td>
                      <span class="badge-genre badge-${eleve.genre}">
                        ${eleve.genre === 'M' ? 'Masculin' : 'Féminin'}
                      </span>
                    </td>
                    <td>${formaterDate(eleve.date_naissance)}</td>
                    <td>${eleve.lieu_naissance || 'Non renseigné'}</td>
                    <td><strong>${age} ans</strong></td>
                  </tr>
                `;
              }).join('')}
              ${elevesClasse.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 40px; color: #64748b;">
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
            <div style="margin-top: 5px; font-size: 14px;"><strong>Enseignant Principal</strong></div>
            <div style="font-size: 12px; color: #666;">${classeSelectionnee.nom}</div>
          </div>
        </div>
        
        <div class="footer">
          <div>Document généré par le Système de Gestion Scolaire</div>
          <div>Liste des élèves • ${classeSelectionnee.niveau} ${classeSelectionnee.nom} • ${elevesClasse.length} élève${elevesClasse.length > 1 ? 's' : ''}</div>
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
      showSuccess('Document d\'impression généré');
    } else {
      showError('Veuillez autoriser les popups pour l\'impression');
    }
  };

  const imprimerFicheEleve = async () => {
    if (!eleveSelectionne) return;
    
    // Votre code d'impression existant...
    const ecoleData: ParametresEcole = parametresEcole || {
      id: 0,
      nom_ecole: "École Primaire Notre Dame",
      slogan: "L'excellence éducative",
      adresse: "Rue des Écoles, 12345 Ville",
      telephone: "01 23 45 67 89",
      email: "ecole@contact.fr",
      logo_url: null,
      couleur_principale: "#3B82F6",
      annee_scolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    };
    
    if (!parametresEcole) {
      try {
        const response = await fetch('/api/parametres/ecole');
        const data = await response.json();
        if (data.success && data.parametres) {
          Object.assign(ecoleData, data.parametres);
        }
      } catch (error) {
        console.error('Erreur chargement école:', error);
      }
    }
    
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
        <title>Fiche Élève - ${eleveSelectionne.nom} ${eleveSelectionne.prenom}</title>
        <style>
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0;
            padding: 20px;
            line-height: 1.2;
            color: #333;
            background: #fff;
          }
          .header {
            text-align: center;
            padding-bottom: 2px;
            margin-bottom: 2px;
            position: relative;
          }
          .school-name {
            font-size: 20px;
            font-weight: bold;
            color: ${ecoleData.couleur_principale};
            margin: 10px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
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
          .student-title {
            font-size: 18px;
            font-weight: 600;
            margin: 2px 0;
            color: #34495e;
            background: linear-gradient(90deg, ${ecoleData.couleur_principale}20, transparent);
            padding: 10px;
            border-radius: 5px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 10px;
          }
          .info-section {
            border: 1px solid #e0e0e0;
            padding: 10px;
            border-radius: 8px;
            background: #fff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          }
          .info-section h3 {
            margin-top: 0;
            color: ${ecoleData.couleur_principale};
            padding-bottom: 5px;
            margin-bottom: 7px;
            font-size: 16px;
          }
          .info-row {
            display: flex;
            margin-bottom: 1px;
            padding-bottom: 2px;
            border-bottom: 1px dashed #eee;
          }
          .info-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
          }
          .label {
            font-weight: 600;
            min-width: 140px;
            color: #555;
            flex-shrink: 0;
          }
          .value {
            color: #222;
            flex: 1;
          }
          .photo-container {
            text-align: center;
            margin: 20px auto;
            max-width: 200px;
          }
          .student-photo {
            width: 60px;
            height: 60px;
            object-fit: cover;
            border-radius: 50%;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1);
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
            .no-print { display: none !important; }
            body { 
              margin: 0 !important;
              padding: 10px !important;
              font-size: 12px !important;
            }
            .header { border-width: 3px; }
            .school-name { font-size: 24px; }
            .student-title { font-size: 18px; }
            .info-section { break-inside: avoid; }
            .photo-container { margin: 10px auto; }
          }
          .signature-area {
            margin-top: 60px;
            display: grid;
            grid-template-columns: repeat(1, 1fr);
            gap: 40px;
            text-align: right;
          }
          .signature-line {
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
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .badge-statut-print {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
            color: white;
            background: ${getCouleurStatut(eleveSelectionne.statut)};
          }
          .dossier-list {
            margin: 10px 0;
            padding-left: 20px;
          }
          .dossier-item {
            margin-bottom: 5px;
            font-size: 13px;
          }
          .logo-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 2px;
          }
          .logo-img {
            max-height: 40px;
            max-width: 40px;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <div class="date-print">
          Imprimé le: ${dateImpression} à ${heureImpression}
        </div>
        
        <div class="header">
          <div class="logo-header">
            ${ecoleData.logo_url ? `<img src="${ecoleData.logo_url}" class="logo-img" alt="Logo">` : ''}
            <div>
              <div class="school-name">${ecoleData.nom_ecole}</div>
              <div class="school-info">
                ${ecoleData.adresse ? `<span>📍 ${ecoleData.adresse}</span>` : ''}
                ${ecoleData.telephone ? `<span>📞 ${ecoleData.telephone}</span>` : ''}
                ${ecoleData.email ? `<span>✉️ ${ecoleData.email}</span>` : ''}
              </div>
            </div>
          </div>
          
          <div class="student-title">
            FICHE INDIVIDUELLE DE L'ÉLÈVE
          </div>
        </div>
        
        <div class="photo-container">
          ${eleveSelectionne.photo_url ? 
            `<img src="${eleveSelectionne.photo_url}" class="student-photo" alt="Photo de l'élève">` : 
            ''
          }
        </div>
        
        <div class="info-grid">
          <div class="info-section">
            <h3>📋 INFORMATIONS PERSONNELLES</h3>
            <div class="info-row">
              <div class="label">Matricule:</div>
              <div class="value"><strong>${eleveSelectionne.matricule}</strong></div>
            </div>
            <div class="info-row">
              <div class="label">Nom complet:</div>
              <div class="value"><strong>${eleveSelectionne.nom} ${eleveSelectionne.prenom}</strong></div>
            </div>
            <div class="info-row">
              <div class="label">Date de naissance:</div>
              <div class="value">${formaterDate(eleveSelectionne.date_naissance)}</div>
            </div>
            <div class="info-row">
              <div class="label">Âge:</div>
              <div class="value">${calculerAge(eleveSelectionne.date_naissance)} ans</div>
            </div>
            <div class="info-row">
              <div class="label">Genre:</div>
              <div class="value">${eleveSelectionne.genre === 'M' ? '👦 Masculin' : '👧 Féminin'}</div>
            </div>
            ${eleveSelectionne.lieu_naissance ? `
              <div class="info-row">
                <div class="label">Lieu de naissance:</div>
                <div class="value">${eleveSelectionne.lieu_naissance}</div>
              </div>
            ` : ''}
          </div>
          
          <div class="info-section">
            <h3>🏫 SCOLARITÉ</h3>
            <div class="info-row">
              <div class="label">Statut:</div>
              <div class="value">
                ${eleveSelectionne.statut.toUpperCase()}
                <span class="badge-statut-print">${eleveSelectionne.statut}</span>
              </div>
            </div>
            <div class="info-row">
              <div class="label">Date d'inscription:</div>
              <div class="value">${formaterDate(eleveSelectionne.date_inscription)}</div>
            </div>
            ${eleveSelectionne.nom_classe ? `
              <div class="info-row">
                <div class="label">Classe:</div>
                <div class="value"><strong>${eleveSelectionne.niveau_classe} ${eleveSelectionne.nom_classe}</strong></div>
              </div>
            ` : `
              <div class="info-row">
                <div class="label">Classe:</div>
                <div class="value" style="color: #999; font-style: italic;">Non assigné</div>
              </div>
            `}
          </div>
          
          <div class="info-section">
            <h3>📞 CONTACTS</h3>
            ${eleveSelectionne.adresse ? `
              <div class="info-row">
                <div class="label">Adresse:</div>
                <div class="value">${eleveSelectionne.adresse}</div>
              </div>
            ` : ''}
            ${eleveSelectionne.email ? `
              <div class="info-row">
                <div class="label">Email:</div>
                <div class="value">✉️ ${eleveSelectionne.email}</div>
              </div>
            ` : ''}
            ${eleveSelectionne.telephone_parent ? `
              <div class="info-row">
                <div class="label">Téléphone:</div>
                <div class="value">📞 ${eleveSelectionne.telephone_parent}</div>
              </div>
            ` : ''}
          </div>
          
          <div class="info-section">
            <h3>👨‍👩‍👧‍👦 INFORMATIONS PARENTALES</h3>
            ${eleveSelectionne.nom_pere ? `
              <div class="info-row">
                <div class="label">Père:</div>
                <div class="value">${eleveSelectionne.nom_pere}</div>
              </div>
            ` : ''}
            ${eleveSelectionne.nom_mere ? `
              <div class="info-row">
                <div class="label">Mère:</div>
                <div class="value">${eleveSelectionne.nom_mere}</div>
              </div>
            ` : ''}
            
          </div>
        </div>
        
        ${eleveSelectionne.dossiers_physiques && eleveSelectionne.dossiers_physiques.length > 0 ? `
          <div class="info-section" style="grid-column: 1 / -1;">
            <h3>📁 DOSSIER(S) FOURNI(S) (${eleveSelectionne.dossiers_physiques.length})</h3>
            <div class="dossier-list">
              ${eleveSelectionne.dossiers_physiques.map((dossier: any, index: number) => `
                <div class="dossier-item">
                  <strong>${index + 1}.</strong> ${dossier.nomOriginal} 
                  <span style="color: #666; font-size: 11px;">
                    (${(dossier.taille / 1024).toFixed(1)} KB - ${dossier.type.split('/')[1]?.toUpperCase() || 'DOCUMENT'})
                  </span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <div class="signature-area">
          <div>
            <div class="signature-line"></div>
            <div style="margin-top: 5px; font-size: 14px;"><strong>Le Directeur</strong></div>
            <div style="font-size: 12px; color: #666;">${ecoleData.nom_ecole}</div>
          </div>
        </div>
        
        <div class="footer">
          <div>Document généré par le Système de Gestion Scolaire</div>
          <div>Fiche élève N°${eleveSelectionne.matricule} • ID: ${eleveSelectionne.id}</div>
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
      showSuccess('Fiche élève générée pour impression');
    } else {
      showError('Veuillez autoriser les popups pour l\'impression');
    }
  };

  const imprimerTousLesEleves = async () => {
    if (eleves.length === 0) {
      showError('Aucun élève à imprimer');
      return;
    }
    
    // Votre code d'impression existant...
    const ecoleData: ParametresEcole = parametresEcole || {
      id: 0,
      nom_ecole: "École Primaire Notre Dame",
      slogan: "L'excellence éducative",
      adresse: "Rue des Écoles, 12345 Ville",
      telephone: "01 23 45 67 89",
      email: "ecole@contact.fr",
      logo_url: null,
      couleur_principale: "#3B82F6",
      annee_scolaire: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
    };
    
    if (!parametresEcole) {
      try {
        const response = await fetch('/api/parametres/ecole');
        const data = await response.json();
        if (data.success && data.parametres) {
          Object.assign(ecoleData, data.parametres);
        }
      } catch (error) {
        console.error('Erreur chargement école:', error);
      }
    }
    
    let toutesLesClasses: Classe[] = [];
    try {
      const response = await fetch('/api/eleves/classes');
      const data = await response.json();
      if (data.success) {
        toutesLesClasses = data.classes || [];
        console.log('📚 Classes chargées:', toutesLesClasses);
      }
    } catch (error) {
      console.error('Erreur chargement classes:', error);
    }
    
    const mapClasses = new Map<number, Classe>();
    toutesLesClasses.forEach(classe => {
      mapClasses.set(classe.id, classe);
    });
    
    const elevesAvecClasses = eleves.map(eleve => {
      let nomClasse = 'Non assigné';
      let niveauClasse = '';
      
      if (eleve.classe_id && mapClasses.has(eleve.classe_id)) {
        const classe = mapClasses.get(eleve.classe_id)!;
        nomClasse = classe.nom;
        niveauClasse = classe.niveau;
      } else if (eleve.nom_classe) {
        nomClasse = eleve.nom_classe;
        niveauClasse = eleve.niveau_classe || '';
      }
      
      return {
        ...eleve,
        nom_classe_final: nomClasse,
        niveau_classe_final: niveauClasse,
        nom_classe_complet: niveauClasse ? `${niveauClasse} ${nomClasse}` : nomClasse
      };
    });
    
    const elevesParClasse = elevesAvecClasses.reduce((acc, eleve) => {
      const cle = eleve.nom_classe_complet;
      if (!acc[cle]) {
        acc[cle] = [];
      }
      acc[cle].push(eleve);
      return acc;
    }, {} as Record<string, typeof elevesAvecClasses[0][]>);
    
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
        <title>Liste Complète des Élèves</title>
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
            border-bottom: 4px solid ${ecoleData.couleur_principale};
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .school-name {
            font-size: 28px;
            font-weight: bold;
            color: #2c3e50;
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
          .document-title-eleve {
            font-size: 18px;
            margin: 1px 0 2px 0;
            color: #34495e;
            background: linear-gradient(90deg, ${ecoleData.couleur_principale}20, transparent);
            padding: 2px;
            border-radius: 5px;
            text-align: center;
          }
          .section-classe {
            margin: 0px 0;
          }
          .classe-header {
            font-size: 18px;
            font-weight: bold;
            color: #1e293b;
            background: #e2e8f0;
            padding: 12px 15px;
            border-radius: 5px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 13px;
          }
          th {
            background: ${ecoleData.couleur_principale};
            color: white;
            padding: 10px 12px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #1d4ed8;
            font-size: 12px;
          }
          td {
            padding: 10px 12px;
            border: 1px solid #e2e8f0;
            font-size: 12px;
          }
          tr:nth-child(even) {
            background: #f8fafc;
          }
          .badge-genre-print {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 20px;
            font-size: 11px;
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
          .badge-statut-print {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 600;
            color: white;
          }
          .footer {
            text-align: center;
            margin-top: 50px;
            font-size: 12px;
            color: #7f8c8d;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          @media print {
            body { 
              margin: 0 !important;
              padding: 10px !important;
              font-size: 11px !important;
            }
            .no-print { display: none !important; }
            th { font-size: 10px; padding: 8px 10px; }
            td { font-size: 10px; padding: 8px 10px; }
            .page-break { page-break-after: always; }
          }
          .date-print {
            text-align: right;
            font-size: 12px;
            color: #666;
            margin-bottom: 20px;
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
          }
          .logo-header {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 15px;
            margin-bottom: 2px;
          }
          .logo-img {
            max-height: 40px;
            max-width: 40px;
            object-fit: contain;
          }
          .total-summary {
            text-align: center;
            margin: 2px 0;
            padding: 2px;
            background: linear-gradient(135deg, ${ecoleData.couleur_principale}, #1D4ED8);
            color: white;
            border-radius: 8px;
            font-size: 18px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="date-print">
          Imprimé le: ${dateImpression} à ${heureImpression}
        </div>
        
        <div class="header">
          <div class="logo-header">
            ${ecoleData.logo_url ? `<img src="${ecoleData.logo_url}" class="logo-img" alt="Logo">` : ''}
            <div>
              <div class="school-name">${ecoleData.nom_ecole}</div>
              <div class="school-info">
                ${ecoleData.adresse ? `<span>📍 ${ecoleData.adresse}</span>` : ''}
                ${ecoleData.telephone ? `<span>📞 ${ecoleData.telephone}</span>` : ''}
                ${ecoleData.email ? `<span>✉️ ${ecoleData.email}</span>` : ''}
              </div>
            </div>
          </div>
          
          <div class="document-title-eleve">
            📋 LISTE COMPLÈTE DES ÉLÈVES
          </div>
        </div>
        
        <div class="total-summary">
          TOTAL: ${eleves.length} ÉLÈVE${eleves.length > 1 ? 'S' : ''} • ${Object.keys(elevesParClasse).length} CLASSE${Object.keys(elevesParClasse).length > 1 ? 'S' : ''}
        </div>
        
        ${Object.entries(elevesParClasse).map(([classeNom, elevesClasse]) => {
          const elevesTries = [...elevesClasse].sort((a, b) => a.nom.localeCompare(b.nom));
          
          return `
            <div class="section-classe">
              <div class="classe-header">
                <span>🏫 ${classeNom}</span>
                <span style="font-size: 12px; background: ${ecoleData.couleur_principale}; color: white; padding: 2px 10px; border-radius: 12px;">
                  ${elevesClasse.length} élève${elevesClasse.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th width="50">N°</th>
                    <th width="120">Matricule</th>
                    <th>Nom et Prénom</th>
                    <th width="80">Sexe</th>
                    <th width="80">Classe</th>
                    <th width="100">Date Naissance</th>
                    <th width="80">Âge</th>
                    <th width="100">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  ${elevesTries.map((eleve, index) => {
                    const age = calculerAge(eleve.date_naissance);
                    const statutCouleur = getCouleurStatut(eleve.statut);
                    
                    const classeAAfficher = eleve.nom_classe_complet;
                    const estNonAssigne = classeAAfficher === 'Non assigné';
                    
                    return `
                      <tr>
                        <td>${index + 1}</td>
                        <td><strong>${eleve.matricule}</strong></td>
                        <td><strong>${eleve.nom} ${eleve.prenom}</strong></td>
                        <td>
                          <span class="badge-genre-print badge-${eleve.genre}">
                            ${eleve.genre === 'M' ? 'M' : 'F'}
                          </span>
                        </td>
                        <td>
                          ${estNonAssigne ? 
                            `<span style="color: #999; font-style: italic;">Non assigné</span>` :
                            `<span>${classeAAfficher}</span>`
                          }
                        </td>
                        <td>${formaterDate(eleve.date_naissance)}</td>
                        <td><strong>${age} ans</strong></td>
                        <td>
                          <span class="badge-statut-print" style="background: ${statutCouleur}">
                            ${eleve.statut.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `;
        }).join('')}
        
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
      showSuccess('Liste complète générée pour impression');
    } else {
      showError('Veuillez autoriser les popups pour l\'impression');
    }
  };

  return (
    <div className={`conteneur-gestion-eleves ${parametresApp?.theme_defaut || 'clair'}`}>
      {/* NOUVEAU : Conteneur de toasts */}
      <div className="toasts-container">
        {toasts.map(toast => (
                <Toast
                  key={toast.id}
                  message={toast.message}
                  type={toast.type}
                  duration={toast.duration}
                  onClose={() => removeToast(toast.id)}
                />
              ))}
      </div>

      {/* En-tête */}
      <div className="en-tete-fixe-eleves">
        <div className="conteneur-en-tete-fixe-eleves">
          <div className="titre-fixe-eleves">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>👨‍🎓</span> 
              <h1>
                Gestion des Élèves
              </h1>
              {selection.elevesSelectionnes.length > 0 && (
                <span className="indicateur-selection-fixe-eleves">
                  {selection.elevesSelectionnes.length} sélectionné(s)
                </span>
              )}
            </div>
          </div>

          <div className="actions-fixes-eleves">
            {selection.elevesSelectionnes.length > 0 && (
              <button 
                className="bouton-supprimer-multiple-fixe-eleves"
                onClick={ouvrirModalSuppressionMultiple}
                title="Supprimer les élèves sélectionnés"
                style={{
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.3s ease',
                  fontSize: '14px',
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
                }}
              >
                🗑️ Supprimer ({selection.elevesSelectionnes.length})
              </button>
            )}
            
            <button 
              className="bouton-imprimer-eleves-fixe"
              onClick={imprimerTousLesEleves}
              disabled={eleves.length === 0}
              title={eleves.length === 0 ? 'Aucun élève à imprimer' : 'Imprimer la liste de tous les élèves'}
              style={{
                background: eleves.length === 0 
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
                color: 'white',
                border: 'none',
                padding: '10px 16px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: eleves.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease',
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.2)'
              }}
            >
              <span style={{ fontSize: '16px' }}>📋</span>
              <span>Imprimer </span>
              {eleves.length > 0 && (
                <span style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {eleves.length}
                </span>
              )} élève(s)
            </button>
            
            <button 
              className="bouton-eleve-fixe"
              onClick={() => ouvrirModal()}
              title="Ajouter un nouvel élève"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
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
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.2)';
              }}
            >
              <span style={{ fontSize: '16px' }}>👨‍🎓</span>
              <span>Ajouter un élève</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cartes statistiques améliorées */}
      {statistiques && (
        <div className="grille-statistiques-eleves">
          <div className="carte-statistique-eleve">
            <div className="valeur-statistique-eleve">{statistiques.total}</div>
            <div className="label-statistique">Total Élèves Actifs</div>
          </div>
          
          <div className="carte-statistique-eleve">
            <div className="valeur-statistique-eleve">{statistiques.garcons}</div>
            <div className="label-statistique">Garçons</div>
            <div className="sous-label-statistique">
              {Math.round((statistiques.garcons / statistiques.total) * 100)}% du total
            </div>
          </div>
          
          <div className="carte-statistique-eleve">
            <div className="valeur-statistique-eleve">{statistiques.filles}</div>
            <div className="label-statistique">Filles</div>
            <div className="sous-label-statistique">
              {Math.round((statistiques.filles / statistiques.total) * 100)}% du total
            </div>
          </div>
          
          <div className="carte-statistique-eleve">
            <div className="valeur-statistique-eleve">{statistiques.parClasse?.length || 0}</div>
            <div className="label-statistique">Classes</div>
            <div className="sous-label-statistique">
              avec élèves actifs
            </div>
          </div>
        </div>
      )}

      {/* Répartition par classe */}
      {statistiques?.parClasse && statistiques.parClasse.length > 0 && (
        <div className="section-repartition-modern">
          <div className="titre-et-actions">
            <h3 className="titre-repartition-modern">
              <span className="icone-titre">🏫</span>
              Répartition par Classe
              <span className="badge-nombre-classes">
                {statistiques.parClasse.length} classe{statistiques.parClasse.length > 1 ? 's' : ''}
              </span>
            </h3>
            
            {statistiques.parClasse.length > 6 && (
              <button 
                className={`bouton-voir-toutes ${voirToutesLesClasses ? 'bouton-actif' : ''}`}
                onClick={() => setVoirToutesLesClasses(!voirToutesLesClasses)}
              >
                {voirToutesLesClasses ? (
                  <>
                    <span className="icone-bouton">▲</span>
                    Réduire
                  </>
                ) : (
                  <>
                    <span className="icone-bouton">▼</span>
                    Voir toutes les classes ({statistiques.parClasse.length})
                  </>
                )}
              </button>
            )}
          </div>
          
          <div className={`grille-repartition-modern ${voirToutesLesClasses ? 'toutes-classes' : ''}`}>
            {statistiques.parClasse
              .slice(0, voirToutesLesClasses ? statistiques.parClasse.length : 6)
              .map((classe: any, index: number) => {
                const pourcentageGarcons = classe.total_eleves > 0 
                  ? Math.round((classe.garcons / classe.total_eleves) * 100) 
                  : 0;
                const pourcentageFilles = classe.total_eleves > 0 
                  ? Math.round((classe.filles / classe.total_eleves) * 100) 
                  : 0;
                
                return (
                  <div 
                    key={classe.id} 
                    className="carte-repartition-modern cliquable"
                    onClick={() => ouvrirModalClasse(classe)}
                    title={`Cliquer pour voir la liste des élèves de ${classe.niveau} ${classe.nom}`}
                  >
                    <div className="badge-classement">
                      {classe.total_eleves} élève{classe.total_eleves > 1 ? 's' : ''}
                    </div>
                    
                    <div className="indicateur-clic">
                      <svg fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6m4-3h6v6m-11 5L21 3"/>
                      </svg>
                    </div>
                    
                    <div className="en-tete-carte-repartition">
                      <h4 className="nom-classe-repartition">{classe.niveau} {classe.nom}</h4>
                    </div>
                    
                    <div className="graphique-repartition">
                      <div className="barre-repartition">
                        <div 
                          className="portion-garcons" 
                          style={{ width: `${pourcentageGarcons}%` }}
                          title={`${classe.garcons} garçons (${pourcentageGarcons}%)`}
                        >
                          {pourcentageGarcons >= 15 && (
                            <span className="texte-portion">👦 {pourcentageGarcons}%</span>
                          )}
                        </div>
                        <div 
                          className="portion-filles" 
                          style={{ width: `${pourcentageFilles}%` }}
                          title={`${classe.filles} filles (${pourcentageFilles}%)`}
                        >
                          {pourcentageFilles >= 15 && (
                            <span className="texte-portion">👧 {pourcentageFilles}%</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="details-repartition-modern">                  
                      {classe.total_eleves > 0 && (
                        <div className="pourcentages-repartition">
                          <div className="pourcentage-item">
                            👦
                            <span>Garçons: {classe.garcons}</span>
                          </div>
                          <div className="pourcentage-item">
                            👧
                            <span>Filles: {classe.filles}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          
          {statistiques.parClasse.length > 6 && !voirToutesLesClasses && (
            <div className="indicateur-classes-masquees">
              <div className="message-masque">
                <span className="icone-masque">🔍</span>
                <span>
                  {statistiques.parClasse.length - 6} classe{statistiques.parClasse.length - 6 > 1 ? 's' : ''} supplémentaire{statistiques.parClasse.length - 6 > 1 ? 's' : ''} non affichée{statistiques.parClasse.length - 6 > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filtres */}
      <div className="section-filtres-eleve">
        <div className="grille-filtres">
          <div className="groupe-filtre">
            <label>Recherche</label>
            <input
              type="text"
              placeholder="Nom, prénom ou matricule..."
              value={filtres.recherche || ''}
              onChange={(e) => gererChangementFiltre('recherche', e.target.value)}
            />
          </div>
          <div className="groupe-filtre">
            <label>Classe</label>
            <select
              value={filtres.classe_id || ''}
              onChange={(e) => gererChangementFiltre('classe_id', e.target.value ? parseInt(e.target.value) : undefined)}
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
            <label>Statut</label>
            <select
              value={filtres.statut || ''}
              onChange={(e) => gererChangementFiltre('statut', e.target.value || undefined)}
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="inactif">Inactif</option>
              <option value="diplome">Diplômé</option>
              <option value="abandon">Abandon</option>
            </select>
          </div>
          <div className="groupe-filtre">
            <label>Genre</label>
            <select
              value={filtres.genre || ''}
              onChange={(e) => gererChangementFiltre('genre', e.target.value || undefined)}
            >
              <option value="">Tous</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
          </div>
          <div className="groupe-filtre">
            <button className="bouton-reinitialiser" onClick={reinitialiserFiltres}>
              🔄 Réinitialiser
            </button>
          </div>

          {selection.elevesSelectionnes.length > 0 && (
            <span className="indicateur-selection">
              {selection.elevesSelectionnes.length} sélectionné(s)
            </span>
          )}

          <div className="conteneur-bouton-droite">
            {selection.elevesSelectionnes.length > 0 && (
              <button
                className="bouton-supprimer-multiple"
                onClick={ouvrirModalSuppressionMultiple}
              >
                🗑️ Supprimer ({selection.elevesSelectionnes.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tableau des élèves */}
      <div className="tableau-eleves-container">
        <table className="tableau-eleves">
          <thead>
            <tr className="style-2">
              <th className="colonne-checkbox colonne-sans-tri">
                <div className="en-tete-tri">
                  <input
                    type="checkbox"
                    checked={selection.selectionTous}
                    onChange={gererSelectionTous}
                    className="checkbox-selection-tous"
                  />
                </div>
              </th>
              <th className="colonne-numero colonne-sans-tri">
                <div className="en-tete-tri">
                  <span>N°</span>
                </div>
              </th>
              <th onClick={() => gererTri('matricule')}>
                <div className="en-tete-tri">
                  <span>Matricule</span>
                  <div className="fleches-tri">
                    <div className={`fleche-tri fleche-haut ${tri.colonne === 'matricule' && tri.ordre === 'asc' ? 'fleche-active' : ''}`} />
                    <div className={`fleche-tri fleche-bas ${tri.colonne === 'matricule' && tri.ordre === 'desc' ? 'fleche-active' : ''}`} />
                  </div>
                </div>
              </th>
              <th onClick={() => gererTri('nom')}>
                <div className="en-tete-tri">
                  <span>Nom Complet</span>
                  <div className="fleches-tri">
                    <div className={`fleche-tri fleche-haut ${tri.colonne === 'nom' && tri.ordre === 'asc' ? 'fleche-active' : ''}`} />
                    <div className={`fleche-tri fleche-bas ${tri.colonne === 'nom' && tri.ordre === 'desc' ? 'fleche-active' : ''}`} />
                  </div>
                </div>
              </th>
              <th onClick={() => gererTri('date_naissance')}>
                <div className="en-tete-tri">
                  <span>Âge</span>
                  <div className="fleches-tri">
                    <div className={`fleche-tri fleche-haut ${tri.colonne === 'date_naissance' && tri.ordre === 'asc' ? 'fleche-active' : ''}`} />
                    <div className={`fleche-tri fleche-bas ${tri.colonne === 'date_naissance' && tri.ordre === 'desc' ? 'fleche-active' : ''}`} />
                  </div>
                </div>
              </th>
              <th onClick={() => gererTri('genre')}>
                <div className="en-tete-tri">
                  <span>Genre</span>
                  <div className="fleches-tri">
                    <div className={`fleche-tri fleche-haut ${tri.colonne === 'genre' && tri.ordre === 'asc' ? 'fleche-active' : ''}`} />
                    <div className={`fleche-tri fleche-bas ${tri.colonne === 'genre' && tri.ordre === 'desc' ? 'fleche-active' : ''}`} />
                  </div>
                </div>
              </th>
              <th onClick={() => gererTri('nom_classe')}>
                <div className="en-tete-tri">
                  <span>Classe</span>
                  <div className="fleches-tri">
                    <div className={`fleche-tri fleche-haut ${tri.colonne === 'nom_classe' && tri.ordre === 'asc' ? 'fleche-active' : ''}`} />
                    <div className={`fleche-tri fleche-bas ${tri.colonne === 'nom_classe' && tri.ordre === 'desc' ? 'fleche-active' : ''}`} />
                  </div>
                </div>
              </th>
              <th onClick={() => gererTri('statut')}>
                <div className="en-tete-tri">
                  <span>Statut</span>
                  <div className="fleches-tri">
                    <div className={`fleche-tri fleche-haut ${tri.colonne === 'statut' && tri.ordre === 'asc' ? 'fleche-active' : ''}`} />
                    <div className={`fleche-tri fleche-bas ${tri.colonne === 'statut' && tri.ordre === 'desc' ? 'fleche-active' : ''}`} />
                  </div>
                </div>
              </th>
              <th className="colonne-sans-tri">
                <div className="en-tete-tri">
                  <span>Contact Parent</span>
                </div>
              </th>
              <th className="colonne-sans-tri">
                <div className="en-tete-tri">
                  <span>Actions</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {elevesTries.map((eleve, index) => {
              const age = calculerAge(eleve.date_naissance);
              const estSelectionne = selection.elevesSelectionnes.includes(eleve.id);
              
              return (
                <tr 
                  key={eleve.id} 
                  className={`style-1 ${estSelectionne ? 'ligne-selectionnee' : ''}`}
                >
                  <td className="cellule-checkbox">
                    <input
                      type="checkbox"
                      checked={estSelectionne}
                      onChange={() => gererSelectionEleve(eleve.id)}
                      className="checkbox-ligne"
                    />
                  </td>
                  
                  <td>
                    <div className="badge-numero">{index + 1}</div>
                  </td>
                  <td className="matricule">{eleve.matricule}</td>
                  <td>
                    <div className="nom-complet-avec-photo">
                      <div className="avatar-liste">
                        {eleve.photo_url ? (
                          <img 
                            src={eleve.photo_url} 
                            alt={`${eleve.prenom} ${eleve.nom}`}
                            className="photo-eleve-liste"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.parentElement?.querySelector('.avatar-placeholder-liste')?.classList.remove('avatar-placeholder-liste-hidden');
                              console.log('❌ Erreur chargement photo:', eleve.photo_url);
                            }}
                          />
                        ) : null}
                        <div className={`avatar-placeholder-liste ${eleve.photo_url ? 'avatar-placeholder-liste-hidden' : ''}`}>
                          {eleve.genre === 'M' ? '👦' : '👧'}
                        </div>
                      </div>
                      <div className="info-eleve-liste">
                        <strong>{eleve.nom} {eleve.prenom}</strong>
                        {eleve.email && <div className="email">{eleve.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="age-eleve">
                      {age} ans
                    </div>
                  </td>
                  <td>
                    <span className={`badge-genre ${eleve.genre === 'M' ? 'garcon' : 'fille'}`}>
                      {eleve.genre === 'M' ? '👦 Garçon' : '👧 Fille'}
                    </span>
                  </td>
                  <td>
                    <div className="niveau-classe-repartition">{eleve.niveau_classe} {eleve.nom_classe}</div>
                  </td>
                  <td>
                    <span 
                      className="badge-statut"
                      style={{ backgroundColor: getCouleurStatut(eleve.statut) }}
                    >
                      {eleve.statut}
                    </span>
                  </td>
                  <td>
                    <div className="contacts-parents">
                      {eleve.telephone_parent && <div>📞 {eleve.telephone_parent}</div>}
                      {(eleve.nom_pere || eleve.nom_mere) && (
                        <div className="noms-parents">
                          {eleve.nom_pere && eleve.nom_mere 
                            ? `${eleve.nom_pere} / ${eleve.nom_mere}`
                            : eleve.nom_pere || eleve.nom_mere
                          }
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="actions-ligne">
                      <button 
                        className="bouton-1"
                        onClick={() => ouvrirModalDetail(eleve)}
                        title="Voir les détails"
                      >
                        👁️
                      </button>
                      <button 
                        className="bouton-2"
                        onClick={() => ouvrirModal(eleve)}
                        title="Modifier"
                      >
                        ✏️
                      </button>
                      {/* Bouton Dossier - apparaît seulement si l'élève a des dossiers */}
                      {eleve.dossiers_physiques && eleve.dossiers_physiques.length > 0 && (
                        <button 
                          className="bouton-dossier"
                          onClick={() => ouvrirModalDetail(eleve, true)}
                          title={`Voir les dossiers (${eleve.dossiers_physiques.length})`}
                        >
                          📁
                          {eleve.dossiers_physiques.length > 1 && (
                            <span className="badge-dossier-bouton">
                              {eleve.dossiers_physiques.length}
                            </span>
                          )}
                        </button>
                      )}
                      <button 
                        className="bouton-3"
                        onClick={() => ouvrirModalSuppression(eleve)}
                        title="Supprimer"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {eleves.length === 0 && (
          <div className="aucune-donnee">
            <p>Aucun élève trouvé avec les critères sélectionnés</p>
          </div>
        )}
      </div>

      {/* Modal d'ajout/modification */}
{modalOuvert && (
  <div className="overlay-modal" onClick={fermerModal}>
    <div className="modal-eleve-modern" onClick={(e) => e.stopPropagation()}>
      {/* En-tête moderne */}
      <div className="en-tete-modal-modern">
        <div className="titre-modal-modern">
          <div className="icone-titre-modal">
            {eleveSelectionne ? '✏️' : '👨‍🎓'}
          </div>
          <div>
            <h2>{eleveSelectionne ? 'Modifier l\'élève' : 'Ajouter un nouvel élève'}</h2>
            <p className="sous-titre-modal">
              {eleveSelectionne ? 'Mettez à jour les informations de l\'élève' : 'Remplissez les informations du nouvel élève'}
            </p>
          </div>
        </div>
        <button className="bouton-fermer-modal-modern" onClick={fermerModal}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <form id="form-eleve" onSubmit={soumettreFormulaire} className="formulaire-eleve-modern">
        {erreurFormulaire && (
          <div className="message-erreur-formulaire-modern">
            <div className="icone-erreur">⚠️</div>
            <div className="texte-erreur">{erreurFormulaire}</div>
          </div>
        )}

        {/* Section Photo de Profil */}
        <div className="section-upload-photo-modern">
          <div className="upload-zone-modern">
            <input
              type="file"
              id="photo-eleve"
              accept="image/*"
              onChange={gererSelectionFichier}
              disabled={uploadPhoto.enCours}
              className="input-fichier-modern"
            />
            <label htmlFor="photo-eleve" className="label-upload-modern">
              {uploadPhoto.apercu ? (
                <div className={`apercu-photo-modern ${eleveSelectionne?.photo_url && uploadPhoto.apercu === eleveSelectionne.photo_url ? 'existant' : 'nouveau'}`}>
                  <img src={uploadPhoto.apercu} alt="Aperçu" />
                  <div className="overlay-upload-modern">
                    <span className="icone-upload-modern">📸</span>
                    <span className="texte-overlay">{eleveSelectionne?.photo_url ? 'Changer' : 'Ajouter'} la photo</span>
                  </div>
                  {eleveSelectionne?.photo_url && uploadPhoto.apercu === eleveSelectionne.photo_url && (
                    <div className="badge-photo-existante-modern">Actuelle</div>
                  )}
                </div>
              ) : eleveSelectionne?.photo_url ? (
                <div className="apercu-photo-modern existant">
                  <img 
                    src={eleveSelectionne.photo_url} 
                    alt="Photo actuelle"
                    onError={(e) => {
                      console.log('❌ Erreur chargement photo actuelle:', eleveSelectionne.photo_url);
                      e.currentTarget.style.display = 'none';
                      // Afficher un placeholder
                    }}
                  />
                  <div className="overlay-upload-modern">
                    <span className="icone-upload-modern">📸</span>
                    <span className="texte-overlay">Changer la photo</span>
                  </div>
                  <div className="badge-photo-existante-modern">Actuelle</div>
                </div>
              ) : (
                <div className="placeholder-upload-modern">
                  <div className="icone-upload-grand-modern">📸</div>
                  <div className="texte-upload-modern">
                    <span className="titre-upload-modern">Ajouter une photo</span>
                    <span className="sous-titre-upload-modern">JPEG, PNG - Max 2MB</span>
                  </div>
                </div>
              )}
            </label>
            
            {/* Barre de progression */}
            {uploadPhoto.enCours && (
              <div className="barre-progression-container-modern">
                <div className="barre-progression-modern">
                  <div 
                    className="barre-progression-remplissage-modern"
                    style={{ width: `${uploadPhoto.progression}%` }}
                  />
                </div>
                <span className="texte-progression-modern">
                  Upload... {uploadPhoto.progression}%
                </span>
              </div>
            )}
            
            {/* Bouton pour supprimer la photo */}
            {(eleveSelectionne?.photo_url || uploadPhoto.apercu) && !uploadPhoto.enCours && (
              <button
                type="button"
                className="bouton-supprimer-photo-modern"
                onClick={() => {
                  if (uploadPhoto.apercu && uploadPhoto.apercu !== eleveSelectionne?.photo_url) {
                    reinitialiserUpload();
                  } else {
                    setUploadPhoto(prev => ({ ...prev, apercu: null, fichier: null }));
                    setFormData(prev => ({ ...prev, photo_url: '' }));
                  }
                }}
              >
                🗑️ Supprimer la photo
              </button>
            )}
          </div>
        </div>

        {/* Grille de formulaire moderne */}
        <div className="grille-formulaire-modern">
          {/* Section */}
          <div className="section-formulaire">
            <h6 className="titre-info">📋 Informations Personnelles</h6>
            <div className="champs-section">
              <div>
      <div className="label-et-actions">
        <label className="label-champ-modern">
          Matricule <span className="requis">*</span>
        </label>
        {!eleveSelectionne && (
          <button
            type="button"
            className="bouton-regenerer-matricule"
            onClick={() => {
              const nouveauMatricule = genererMatricule();
              setFormData(prev => ({
                ...prev,
                matricule: nouveauMatricule
              }));
              // ✅ Sans alerte
            }}
            title="Générer un nouveau matricule"
          >
            🔄 Regénérer
          </button>
        )}
      </div>
      <div className="input-groupe-matricule">
        <input
          type="text"
          name="matricule"
          value={formData.matricule}
          onChange={(e) => {
            setFormData(prev => ({
              ...prev,
              matricule: e.target.value.toUpperCase()
            }));
            setErreurFormulaire('');
          }}
          className="input-champ-modern"
          placeholder="Ex: ELV2024ABC123"
          required
          maxLength={20}
        />
        {!eleveSelectionne && (
          <div className="indicateur-format">🔄 Auto-généré, modifiable</div>
        )}
      </div>
    </div>
              <div>
                <label className="label-champ-modern">
                  Nom <span className="requis">*</span>
                </label>
                <input
                  type="text"
                  name="nom"
                  value={formData.nom}
                  onChange={gererChangementFormulaire}
                  className="input-champ-modern"
                  placeholder="Ex: KOUAMÉ"
                  required
                />
                <div className="indicateur-format">🔤 Majuscules automatiques</div>
              </div>

              <div>
                <label className="label-champ-modern">
                  Prénom <span className="requis">*</span>
                </label>
                <input
                  type="text"
                  name="prenom"
                  value={formData.prenom}
                  onChange={gererChangementFormulaire}
                  className="input-champ-modern"
                  placeholder="Ex: Kouassi Désiré Alvin"
                  required
                />
                <div className="indicateur-format">✨ Majuscule automatique</div>
              </div>

              <div>
                <label className="label-champ-modern">
                  Date de Naissance <span className="requis">*</span>
                </label>
                <input
                  type="date"
                  name="date_naissance"
                  value={formData.date_naissance}
                  onChange={gererChangementFormulaire}
                  className="input-champ-modern"
                  required
                />
              </div>

              <div>
                <label className="label-champ-modern">Lieu de Naissance</label>
                <input
                  type="text"
                  name="lieu_naissance"
                  value={formData.lieu_naissance}
                  onChange={gererChangementFormulaire}
                  className="input-champ-modern"
                  placeholder="Ex: Abidjan, Cocody"
                />
              </div>

              <div>
                <label className="label-champ-modern">
                  Genre <span className="requis">*</span>
                </label>
                <div className="select-container-modern">
                  <select
                    name="genre"
                    value={formData.genre}
                    onChange={gererChangementFormulaire}
                    className="select-champ-modern"
                    required
                  >
                    <option value="M">👦 Masculin</option>
                    <option value="F">👧 Féminin</option>
                  </select>
                  <div className="select-arrow">▼</div>
                </div>
              </div>
            </div>

            {/* Section Dossiers Physiques */}
<div className="section-formulaire">
  <h3 className="titre-info">📁 Dossiers de l'élève</h3>
  <div className="champs-section">
    <div className="plein-largeur">      
      {/* Zone de drop des fichiers */}
      <div className="upload-dossiers-zone">
        <input
          type="file"
          id="dossiers-eleve"
          multiple
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xls,.xlsx"
          onChange={gererSelectionDossiers}
          disabled={uploadDossiersEnCours}
          className="input-fichier-dossiers"
        />
        <label htmlFor="dossiers-eleve" className="label-upload-dossiers">
          <div className="icone-upload-grand-dossiers">📁</div>
          <div className="texte-upload-dossiers">
            <span className="titre-upload-dossiers">
              Glissez ou cliquez pour sélectionner
            </span>
            <span className="sous-titre-upload-dossiers">
              PDF, DOC, DOCX, JPG, PNG, XLS, XLSX (max 10MB par fichier)
            </span>
          </div>
        </label>
      </div>
      
      {/* Liste des fichiers sélectionnés */}
      {fichiersDossiers.length > 0 && (
        <div className="liste-fichiers-dossiers">
          <div className="en-tete-liste-fichiers">
            <span className="titre-liste-fichiers">
              📋 {fichiersDossiers.length} fichier{fichiersDossiers.length > 1 ? 's' : ''} sélectionné{fichiersDossiers.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="conteneur-fichiers">
            {fichiersDossiers.map((fichier, index) => (
              <div key={index} className="item-fichier">
                <div className="info-fichier">
                  <span className={`icone-type-fichier ${getIconeTypeFichier(fichier.type)}`}>
                    {getIconeTypeFichier(fichier.type)}
                  </span>
                  <div className="details-fichier">
                    <span className="nom-fichier">{fichier.name}</span>
                    <span className="taille-fichier">
                      {(fichier.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className="bouton-supprimer-fichier"
                  onClick={() => supprimerFichierDossier(index)}
                  disabled={uploadDossiersEnCours}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Indicateur de chargement */}
      {uploadDossiersEnCours && (
        <div className="chargement-dossiers">
          <div className="spinner-petit"></div>
          <span>Téléchargement des dossiers en cours...</span>
        </div>
      )}
    </div>
  </div>
</div>
          </div>

          {/* Section Scolarité */}
          <div className="section-formulaire">
            <h3 className="titre-info">🏫 Scolarité</h3>
            <div className="champs-section">
              <div>
                <label className="label-champ-modern">Classe</label>
                <div className="select-container-modern">
                  <select
                    name="classe_id"
                    value={formData.classe_id}
                    onChange={gererChangementFormulaire}
                    className="select-champ-modern"
                  >
                    <option value="">Sélectionnez une classe</option>
                    {classes.map(classe => (
                      <option key={classe.id} value={classe.id}>
                        {classe.niveau} {classe.nom}
                      </option>
                    ))}
                  </select>
                  <div className="select-arrow">▼</div>
                </div>
              </div>

              <div>
                <label className="label-champ-modern">
                  Statut <span className="requis">*</span>
                </label>
                <div className="select-container-modern">
                  <select
                    name="statut"
                    value={formData.statut}
                    onChange={gererChangementFormulaire}
                    className="select-champ-modern"
                    required
                  >
                    <option value="actif">✅ Actif</option>
                    <option value="inactif">⏸️ Inactif</option>
                    <option value="diplome">🎓 Diplômé</option>
                    <option value="abandon">❌ Abandon</option>
                  </select>
                  <div className="select-arrow">▼</div>
                </div>
              </div>
            </div>

            {/* Section Informations Parentales */}
            <div className="section-formulaire">
            <h3 className="titre-info">👨‍👩‍👧‍👦 Informations Parentales</h3>
            <div className="champs-section">
              <div>
                <label className="label-champ-modern">Nom du Père</label>
                <input
                  type="text"
                  name="nom_pere"
                  value={formData.nom_pere}
                  onChange={gererChangementFormulaire}
                  className="input-champ-modern"
                  placeholder="Ex: Kouamé Jean"
                />
                <div className="indicateur-format">✨ Majuscule automatique</div>
              </div>

              <div>
                <label className="label-champ-modern">Nom de la Mère</label>
                <input
                  type="text"
                  name="nom_mere"
                  value={formData.nom_mere}
                  onChange={gererChangementFormulaire}
                  className="input-champ-modern"
                  placeholder="Ex: Traoré Marie"
                />
                <div className="indicateur-format">✨ Majuscule automatique</div>
              </div>

              <div>
                <label className="label-champ-modern">Téléphone Parent</label>
                <input
                  type="tel"
                  name="telephone_parent"
                  value={formData.telephone_parent}
                  onChange={gererChangementFormulaire}
                  className="input-champ-modern"
                  placeholder="Ex: 0707654321"
                  maxLength={10}
                />
                <div className="indicateur-format">🔢 Chiffres uniquement (max 10)</div>
              </div>
            </div>
          </div>
          {/* Section Contacts */}
          <div className="section-formulaire">
            <h3 className="titre-info">📞 Contacts</h3>
            <div className="champs-section">

              <div>
                <label className="label-champ-modern">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={gererChangementFormulaire}
                  className="input-champ-modern"
                  placeholder="Ex: eleve@ecole.ci"
                />
              </div>

              <div className="plein-largeur">
                <label className="label-champ-modern">Adresse</label>
                <textarea
                  name="adresse"
                  value={formData.adresse}
                  onChange={gererChangementFormulaire}
                  className="textarea-champ-modern"
                  placeholder="Ex: 123 Rue des Écoles, Cocody"
                  rows={3}
                />
              </div>
            </div>
          </div>
          </div>

          
        </div>

        {/* Actions du formulaire */}
        <div className="actions-fixe-bas">
          <button 
            type="button" 
            className="bouton-annuler-eleve"
            onClick={fermerModal}
            disabled={soumissionEnCours || uploadDossiersEnCours}
          >
            <span className="icone-bouton">❌</span>
            Annuler
          </button>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="submit" 
              form="form-eleve"
              className="bouton-sauvegarder-eleve"
              disabled={soumissionEnCours || uploadDossiersEnCours}
            >
              {soumissionEnCours ? (
                <>
                  <div className="spinner-bouton-fixe"></div>
                  Traitement...
                </>
              ) : uploadDossiersEnCours ? (
                <>
                  <div className="spinner-bouton-fixe"></div>
                  Upload...
                </>
              ) : (
                <>
                  <span className="icone-bouton">
                    {eleveSelectionne ? '💾' : '👨‍🎓'}
                  </span>
                  {eleveSelectionne ? 'Mettre à jour' : 'Créer l\'élève'}
                </>
              )}
            </button>
          </div>
        </div>

      </form>
    </div>
  </div>
)}

      {/* Modal de détail */}
{modalDetailOuvert && eleveSelectionne && (
  <div className="overlay-modal active" onClick={fermerModalDetail}>
    <div className="modal-detail-eleve-modern" onClick={(e) => e.stopPropagation()}>
      {/* En-tête avec photo de profil et informations principales */}
      <div className="en-tete-detail-modern">
  <div className="profil-header">
    <div className="avatar-profil">
  {eleveSelectionne?.photo_url ? (
    <img 
      src={eleveSelectionne.photo_url} 
      alt={`${eleveSelectionne.prenom} ${eleveSelectionne.nom}`}
      className="photo-profil-detail"
      onError={(e) => {
        console.log('❌ Erreur chargement photo détail:', eleveSelectionne.photo_url);
        e.currentTarget.style.display = 'none';
        e.currentTarget.parentElement?.querySelector('.avatar-placeholder-detail')?.classList.remove('avatar-placeholder-detail-hidden');
      }}
    />
  ) : null}
  <div className={`avatar-placeholder-detail ${eleveSelectionne?.photo_url ? 'avatar-placeholder-detail-hidden' : ''}`}>
    {eleveSelectionne?.prenom?.charAt(0)}{eleveSelectionne?.nom?.charAt(0)}
  </div>
</div>
    
    <div className="info-principale-modern">
      <div className="info-header-row">
        <div className="info-left-section">
          <h2>{eleveSelectionne.prenom} {eleveSelectionne.nom}</h2>
          <div className="matricule-modern">#{eleveSelectionne.matricule}</div>
        </div>
        
        <button className="bouton-fermer-modal-modern" onClick={fermerModalDetail}>
         ❌
        </button>
      </div>
    </div>
  </div>
</div>

      {/* Contenu détaillé */}
      <div className="contenu-detail-modern">
        <div className="grille-details-modern">
          {/* Colonne */}
          <div className="colonne-details">
            <div className="carte-info">
              <h3 className="titre-carte">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
                Informations Personnelles
              </h3>
              <div className="liste-infos">
                <div className="item-info">
                  <span className="label-info">Date de naissance</span>
                  <span className="valeur-info">
                    {new Date(eleveSelectionne.date_naissance).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                {eleveSelectionne.lieu_naissance && (
                  <div className="item-info">
                    <span className="label-info">Lieu de naissance</span>
                    <span className="valeur-info">{eleveSelectionne.lieu_naissance}</span>
                  </div>
                )}
                <div className="item-info">
                  <span className="label-info">Âge</span>
                  <span className="valeur-info">{calculerAge(eleveSelectionne.date_naissance)} ans</span>
                </div>
                <div className="item-info">
                  <span className="label-info">Genre</span>
                  <span className="valeur-info">{eleveSelectionne.genre === 'M' ? '👦 Garçon' : '👧 Fille'}</span>
                </div>
                {eleveSelectionne.adresse && (
                  <div className="item-info">
                    <span className="label-info">Adresse</span>
                    <span className="valeur-info">{eleveSelectionne.adresse}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Carte Contacts */}
            <div className="carte-info">
              <h3 className="titre-carte">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
                Contacts
              </h3>
              <div className="liste-infos">
                
                {eleveSelectionne.email && (
                  <div className="item-info">
                    <span className="label-info">Email</span>
                    <a href={`mailto:${eleveSelectionne.email}`} className="valeur-info lien">
                      ✉️ {eleveSelectionne.email}
                    </a>
                  </div>
                )}

                {eleveSelectionne.telephone_parent && (
                  <div className="item-info">
                    <span className="label-info">Téléphone</span>
                    <a href={`tel:${eleveSelectionne.telephone_parent}`} className="valeur-info lien">
                      📞 {eleveSelectionne.telephone_parent}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Colonne Informations Scolaires et Parentales */}
          <div className="colonne-details">
            {/* Carte Scolarité */}
            <div className="carte-info">
              <h3 className="titre-carte">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82zM12 3L1 9l11 6 9-4.91V17h2V9L12 3z"/>
                </svg>
                Scolarité
              </h3>
              <div className="liste-infos">
                <div className="item-info">
                  <span className="label-info">Date d'inscription</span>
                  <span className="valeur-info">
                    {new Date(eleveSelectionne.date_inscription).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                {eleveSelectionne.nom_classe ? (
                  <>
                    <div className="item-info">
                      <span className="label-info">Classe</span>
                      <span className="valeur-info">{eleveSelectionne.niveau_classe} {eleveSelectionne.nom_classe}</span>
                    </div>
                  </>
                ) : (
                  <div className="item-info">
                    <span className="label-info">Classe</span>
                    <span className="valeur-info aucune">Non assigné</span>
                  </div>
                )}
              </div>
            </div>

            {/* Carte Informations Parentales */}
            <div className="carte-info">
              <h3 className="titre-carte">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A3.02 3.02 0 0 0 16.95 6h-2.67c-.88 0-1.68.5-2.08 1.29L9 12v9h3v-6h2v6h3zm-4.33-15.33c.66 0 1.33.67 1.33 1.33s-.67 1.33-1.33 1.33S14 8.66 14 8s.67-1.33 1.33-1.33zM12 14v-2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V14h-3z"/>
                </svg>
                Informations Parentales
              </h3>
              <div className="liste-infos">
                {eleveSelectionne.nom_pere && (
                  <div className="item-info">
                    <span className="label-info">Père</span>
                    <span className="valeur-info">{eleveSelectionne.nom_pere}</span>
                  </div>
                )}
                {eleveSelectionne.nom_mere && (
                  <div className="item-info">
                    <span className="label-info">Mère</span>
                    <span className="valeur-info">{eleveSelectionne.nom_mere}</span>
                  </div>
                )}
                
              </div>
            </div>

            {/* Section Dossiers Physiques */}
{eleveSelectionne.dossiers_physiques && eleveSelectionne.dossiers_physiques.length > 0 && (
  <div id="section-dossiers-eleve" className="carte-info">
  <h3 className="titre-carte">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
    </svg>
    Dossier(s) Fourni(s)
    {eleveSelectionne.dossiers_physiques && eleveSelectionne.dossiers_physiques.length > 0 && (
      <span className="badge-nombre-dossiers">
        {eleveSelectionne.dossiers_physiques.length}
      </span>
    )}
  </h3>
  {eleveSelectionne.dossiers_physiques && eleveSelectionne.dossiers_physiques.length > 0 ? (
    <div className="liste-dossiers-detail">
      {eleveSelectionne.dossiers_physiques.map((dossier, index) => (
        <div key={index} className="item-dossier-detail">
          <div className="info-dossier-detail">
            <span className={`icone-dossier ${getIconeTypeFichier(dossier.type)}`}>
              {getIconeTypeFichier(dossier.type)}
            </span>
            <div className="details-dossier">
              <span className="nom-dossier">{dossier.nomOriginal}</span>
              <div className="meta-dossier">
                <span className="taille-dossier">
                  {(dossier.taille / 1024).toFixed(2)} KB
                </span>
                <span className="date-dossier">
                  {new Date(dossier.date).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
          <div className="actions-dossier">
            <a 
              href={dossier.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bouton-telecharger-dossier"
              title="Télécharger"
            >
              ⬇️
            </a>
            <a 
              href={dossier.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="bouton-voir-dossier"
              title="Ouvrir"
            >
              👁️
            </a>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="aucun-dossier">
      <p>Aucun dossier physique pour cet élève</p>
    </div>
  )}
</div>
)}
          </div>
        </div>
      </div>

      {/* Actions en bas de la modale */}
      <div className="actions-detail-modern">
  <button 
    className="bouton-secondaire"
    onClick={fermerModalDetail}
  >
    Fermer
  </button>
  <div className="groupe-actions">
    {/* Nouveau bouton d'impression */}
    <button 
      className="bouton-imprimer-detail"
      onClick={imprimerFicheEleve}
    >
      🖨️ Imprimer
    </button>
    <button 
      className="bouton-modifier-detail"
      onClick={() => {
        fermerModalDetail();
        ouvrirModal(eleveSelectionne);
      }}
    >
      ✏️ Modifier
    </button>
    <button 
      className="bouton-supprimer-detail"
      onClick={() => {
        fermerModalDetail();
        ouvrirModalSuppression(eleveSelectionne);
      }}
    >
      🗑️ Supprimer
    </button>
  </div>
</div>
    </div>
  </div>
)}

      {/* Modal de suppression personnalisée */}
      {modalSuppressionOuvert && eleveASupprimer && (
        <div className="overlay-modal" onClick={fermerModalSuppression}>
          <div className="modal-suppression" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal-suppression-eleve">
              <h2> ⚠️ Confirmer Suppression</h2>
            </div>
            
            <div className="contenu-modal-suppression">
              <p>
                Êtes-vous sûr de vouloir supprimer l'élève <strong>"{eleveASupprimer.nom} {eleveASupprimer.prenom}"</strong> ?
              </p>
              
              <div className="information-suppression">
                <p>Cette action est irréversible. Toutes les données de l'élève seront définitivement supprimées de la base de données.</p>
                
                <div className="details-suppression">
                  <div><strong>Matricule:</strong> {eleveASupprimer.matricule}</div>
                  {eleveASupprimer.nom_classe && (
                    <div><strong>Classe:</strong> {eleveASupprimer.niveau_classe} {eleveASupprimer.nom_classe}</div>
                  )}
                  <div><strong>Statut:</strong> {eleveASupprimer.statut}</div>
                </div>
              </div>
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
                onClick={supprimerEleve}
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
      <div className="en-tete-modal-suppression-eleve">
        <h2>⚠️ Confirmer Suppression</h2>
      </div>
      
      <div className="contenu-modal-suppression">
        <p>
          Êtes-vous sûr de vouloir supprimer <strong>{selection.elevesSelectionnes.length} élève(s)</strong> sélectionné(s) ?
        </p>
        
        <div className="information-suppression">
          <p>Cette action est irréversible. Toutes les données des élèves seront définitivement supprimées.</p>
          
          <div className="liste-eleves-suppression">
            <h4>Élèves à supprimer :</h4>
            <div className="grille-eleves-suppression">
              {obtenirElevesSelectionnes().map(eleve => (
                <div key={eleve.id} className="eleve-suppression-item">
                  <div className="avatar-eleve-suppression">
                    {eleve.photo_url ? (
                      <img src={eleve.photo_url} alt={`${eleve.prenom} ${eleve.nom}`} />
                    ) : (
                      <div className="avatar-placeholder-suppression">
                        {eleve.prenom.charAt(0)}{eleve.nom.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="info-eleve-suppression">
                    <strong>{eleve.nom} {eleve.prenom}</strong>
                    <span className="matricule-suppression">#{eleve.matricule}</span>
                    {eleve.nom_classe && (
                      <span className="classe-suppression">{eleve.nom_classe}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="actions-modal-suppression" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <button 
          className="bouton-annuler-suppression"
          onClick={fermerModalSuppressionMultiple}
          disabled={soumissionEnCours}
        >
          Annuler
        </button>
        <button 
          className="bouton-confirmer-suppression"
          onClick={supprimerElevesMultiple}
          disabled={soumissionEnCours}
        >
          {soumissionEnCours ? (
            <>
              <div className="spinner-bouton"></div>
              Suppression...
            </>
          ) : (
            `🗑️ Supprimer ${selection.elevesSelectionnes.length} élève(s)`
          )}
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal pour afficher les élèves d'une classe */}
{modalClassesOuvert && classeSelectionnee && (
  <div className="overlay-modal" onClick={fermerModalClasses}>
    <div className="modal-detail-eleve-modern" onClick={(e) => e.stopPropagation()}>
      {/* En-tête moderne */}
      <div className="en-tete-modal-modern">
        <div className="titre-modal-modern">
          <div className="icone-titre-modal">🏫</div>
          <div>
            <h2>Liste des Élèves - {classeSelectionnee.niveau} {classeSelectionnee.nom}</h2>
            <p className="sous-titre-modal">
              {elevesClasse.length} élève{elevesClasse.length > 1 ? 's' : ''} dans cette classe
            </p>
          </div>
        </div>
        <button className="bouton-fermer-modal-modern" onClick={fermerModalClasses}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Contenu de la modale */}
      <div className="contenu-detail-modern">
        {chargementElevesClasse ? (
          <div className="chargement-eleves">
            <div className="spinner-grand"></div>
            <p>Chargement des élèves...</p>
          </div>
        ) : (
          <div className="tableau-eleves-container">
            <table className="tableau-eleves">
              <thead>
                <tr className="style-2">
                  <th className="colonne-numero colonne-sans-tri">
                    <div className="en-tete-tri">
                      <span>N°</span>
                    </div>
                  </th>
                  <th>Matricule</th>
                  <th>Nom et Prénom</th>
                  <th>Sexe</th>
                  <th>Date Naissance</th>
                  <th>Lieu de Naissance</th>
                  <th>Âge</th>
                </tr>
              </thead>
              <tbody>
                {elevesClasse.map((eleve, index) => {
                  const age = calculerAge(eleve.date_naissance);
                  return (
                    <tr key={eleve.id} className="style-1">
                      <td>
                        <div className="badge-numero">{index + 1}</div>
                      </td>
                      <td className="matricule">{eleve.matricule}</td>
                      <td>
                        <div className="nom-complet-avec-photo">
                          <div className="avatar-liste">
                            {eleve.photo_url ? (
                              <img 
                                src={eleve.photo_url} 
                                alt={`${eleve.prenom} ${eleve.nom}`}
                                className="photo-eleve-liste"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.parentElement?.querySelector('.avatar-placeholder-liste')?.classList.remove('avatar-placeholder-liste-hidden');
                                  console.log('❌ Erreur chargement photo:', eleve.photo_url);
                                }}
                              />
                            ) : null}
                            <div className={`avatar-placeholder-liste ${eleve.photo_url ? 'avatar-placeholder-liste-hidden' : ''}`}>
                              {eleve.genre === 'M' ? '👦' : '👧'}
                            </div>
                          </div>
                          <div className="info-eleve-liste">
                            <strong>{eleve.nom} {eleve.prenom}</strong>
                            {eleve.email && <div className="email">{eleve.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge-genre ${eleve.genre === 'M' ? 'garcon' : 'fille'}`}>
                          {eleve.genre === 'M' ? '👦 Garçon' : '👧 Fille'}
                        </span>
                      </td>
                      <td>
                        {new Date(eleve.date_naissance).toLocaleDateString('fr-FR')}
                      </td>
                      <td>
                        {eleve.lieu_naissance || '-'}
                      </td>
                      <td>
                        <div className="age-eleve">
                          {age} ans
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {elevesClasse.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="aucune-donnee">
                        <p>Aucun élève dans cette classe</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Actions en bas de la modale */}
      <div className="actions-detail-modern">
        <button 
          className="bouton-secondaire"
          onClick={fermerModalClasses}
        >
          Fermer
        </button>
        <div className="groupe-actions">
          <button 
            className="bouton-imprimer-detail"
            onClick={imprimerListeClasse}
            disabled={elevesClasse.length === 0}
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}