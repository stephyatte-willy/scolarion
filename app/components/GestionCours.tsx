'use client';

import { useState, useEffect, useRef } from 'react';
import ModalSuppression from './ModalSuppression';
import GestionMatieres from './GestionMatieres';
import './GestionCours.css';

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

interface MatierePrimaire {
  id: number;
  nom: string;
  code_matiere: string;
  niveau: string;
  description: string;
  couleur: string;
  icone: string;
  coefficient: number;
  note_sur: number;
  ordre_affichage: number;
  statut: 'actif' | 'inactif';
  created_at: string;
}

interface Professeur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  specialite?: string;
}

interface Classe {
  id: number;
  nom: string;
  niveau: string;
  annee_scolaire: string;
}

interface Cours {
  code_cours: string;
  nom_cours: string;
  description: string;
  professeur_id: number;
  professeur_nom?: string;
  classe_id: number;
  classe_nom?: string;
  matiere_id?: number;
  matiere_nom?: string;
  matiere_code?: string;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle: string;
  couleur?: string;
  statut: 'actif' | 'inactif';
  created_at?: string;
  updated_at?: string;
}

interface Props {
  onRetourTableauDeBord: () => void;
}

export default function GestionCours({ onRetourTableauDeBord }: Props) {
  // États principaux
  const [cours, setCours] = useState<Cours[]>([]);
  const [professeurs, setProfesseurs] = useState<Professeur[]>([]);
  const [classes, setClasses] = useState<Classe[]>([]);
  const [matieres, setMatieres] = useState<MatierePrimaire[]>([]);
  const [chargement, setChargement] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);
  const [editionMode, setEditionMode] = useState(false);
  const [coursSelectionne, setCoursSelectionne] = useState<Cours | null>(null);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [filtreClasse, setFiltreClasse] = useState<string>('tous');
  const [filtreProfesseur, setFiltreProfesseur] = useState<string>('tous');
  const [filtreMatiere, setFiltreMatiere] = useState<string>('tous');
  const [alerte, setAlerte] = useState<{type: 'success' | 'error' | 'warning', message: string} | null>(null);
  
  // États pour les paramètres
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp | null>(null);
  
  // Modales
  const [modalSuppressionOuvert, setModalSuppressionOuvert] = useState(false);
  const [coursASupprimer, setCoursASupprimer] = useState<Cours | null>(null);
  const [modalMatieresOuvert, setModalMatieresOuvert] = useState(false);

  const [soumissionEnCours, setSoumissionEnCours] = useState(false);

  // Formulaire
  const [formData, setFormData] = useState({
    code_cours: '',
    nom_cours: '',
    description: '',
    professeur_id: 0,
    classe_id: 0,
    matiere_id: 0,
    jour_semaine: 'Lundi',
    heure_debut: '08:00',
    heure_fin: '09:00',
    salle: '',
    couleur: '#3B82F6',
    statut: 'actif' as 'actif' | 'inactif'
  });

  // Compteur pour générer des codes uniques
  const [compteurCours, setCompteurCours] = useState<{[key: string]: number}>({});

  // Référence pour fermer les modals
  const modalRef = useRef<HTMLDivElement>(null);

  // Jours de la semaine
  const joursSemaine = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  // ==================== FONCTIONS DE FORMATAGE DYNAMIQUE ====================

  // Formater une date selon la configuration
  const formaterDate = (date: Date | string | undefined): string => {
    if (!date) return 'Date inconnue';
    
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

  // Formater l'heure selon le fuseau horaire
  const formaterHeure = (heure: string): string => {
    if (!parametresApp) return heure;
    
    try {
      // Si l'heure est au format HH:MM
      const [heures, minutes] = heure.split(':');
      const date = new Date();
      date.setHours(parseInt(heures), parseInt(minutes), 0);
      
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: parametresApp.fuseau_horaire
      });
    } catch (error) {
      return heure;
    }
  };

  // ==================== FONCTIONS EXISTANTES ====================

  // Charger les paramètres
  const chargerParametres = async () => {
    try {
      const [ecoleResponse, appResponse] = await Promise.all([
        fetch('/api/parametres/ecole'),
        fetch('/api/parametres/application')
      ]);
      
      const ecoleData = await ecoleResponse.json();
      const appData = await appResponse.json();
      
      if (ecoleData.success) {
        setParametresEcole(ecoleData.parametres);
      }
      
      if (appData.success && appData.parametres) {
        setParametresApp(appData.parametres);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres:', error);
    }
  };

  // Charger les données
  const chargerDonnees = async () => {
    try {
      setChargement(true);
      
      // Charger les paramètres d'abord
      await chargerParametres();
      
      // Charger les cours
      const responseCours = await fetch('/api/cours');
      if (responseCours.ok) {
        const dataCours = await responseCours.json();
        if (dataCours.success) {
          setCours(dataCours.cours || []);
        } else {
          console.error('Erreur chargement cours:', dataCours.error);
        }
      }

      // Charger les professeurs
      const responseProfesseurs = await fetch('/api/enseignants');
      if (responseProfesseurs.ok) {
        const dataProfesseurs = await responseProfesseurs.json();
        console.log('📊 Données professeurs reçues:', dataProfesseurs);
        
        if (dataProfesseurs.success) {
          const professeursFormates = dataProfesseurs.enseignants?.map((enseignant: any) => ({
            id: enseignant.id,
            nom: enseignant.nom,
            prenom: enseignant.prenom,
            email: enseignant.email,
            specialite: enseignant.specialite || enseignant.matieres_enseignees
          })) || [];
          
          console.log('👨‍🏫 Professeurs formatés:', professeursFormates);
          setProfesseurs(professeursFormates);
        } else {
          console.error('Erreur chargement professeurs:', dataProfesseurs.erreur);
          setProfesseurs([]);
        }
      } else {
        console.error('HTTP error chargement professeurs:', responseProfesseurs.status);
        setProfesseurs([]);
      }

      // Charger les classes
      const responseClasses = await fetch('/api/classes');
      if (responseClasses.ok) {
        const dataClasses = await responseClasses.json();
        console.log('📊 Données classes reçues:', dataClasses);
        
        if (dataClasses.success) {
          const classesFormatees = dataClasses.classes?.map((classe: any) => ({
            id: classe.id,
            nom: classe.nom,
            niveau: classe.niveau,
            annee_scolaire: parametresEcole?.annee_scolaire || '2024-2025'
          })) || [];
          
          console.log('🎓 Classes formatées:', classesFormatees);
          setClasses(classesFormatees);
        } else {
          console.error('Erreur chargement classes:', dataClasses.erreur);
          setClasses([]);
        }
      } else {
        console.error('HTTP error chargement classes:', responseClasses.status);
        setClasses([]);
      }

      // Charger les matières depuis matieres_primaire
      await chargerMatieres();

    } catch (error) {
      console.error('💥 Erreur chargement données:', error);
      setAlerte({ 
        type: 'error', 
        message: 'Erreur lors du chargement des données' 
      });
      
      setCours([]);
      setProfesseurs([]);
      setClasses([]);
      setMatieres([]);
      
    } finally {
      setChargement(false);
    }
  };

  // Charger les matières depuis matieres_primaire
const chargerMatieres = async () => {
  try {
    console.log('🔄 Chargement des matières...');
    const response = await fetch('/api/matieres-primaires?statut=actif');
    
    // Afficher le statut de la réponse
    console.log('📡 Statut réponse:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('📦 Données reçues:', data);
      
      if (data.success) {
        setMatieres(data.matieres || []);
        console.log('✅ Matières chargées:', data.matieres?.length);
      } else {
        console.error('❌ Erreur API:', data.error);
      }
    } else {
      const text = await response.text();
      console.error('❌ Erreur HTTP:', response.status, text.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ Erreur chargement:', error);
  }
};

  // Recharger les matières après modification
  const rechargerMatieres = async () => {
    await chargerMatieres();
  };

  // Recharger toutes les données
  const rechargerToutesDonnees = async () => {
    try {
      setChargement(true);
      
      await Promise.all([
        fetch('/api/cours')
          .then(res => res.json())
          .then(data => {
            if (data.success) setCours(data.cours || []);
          }),
        
        fetch('/api/enseignants')
          .then(res => res.json())
          .then(data => {
            if (data.success) setProfesseurs(data.enseignants || []);
          }),
        
        fetch('/api/classes')
          .then(res => res.json())
          .then(data => {
            if (data.success) setClasses(data.classes || []);
          }),
        
        chargerMatieres()
      ]);
      
    } catch (error) {
      console.error('Erreur rechargement données:', error);
      setAlerte({ 
        type: 'error', 
        message: 'Erreur lors du rechargement des données' 
      });
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    chargerDonnees();
  }, []);

  useEffect(() => {
    if (alerte) {
      const timer = setTimeout(() => setAlerte(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [alerte]);

  useEffect(() => {
    const nouveauxCompteurs: {[key: string]: number} = {};
    
    cours.forEach(coursItem => {
      const match = coursItem.code_cours.match(/^([A-Z]+)-(\d+)$/);
      if (match) {
        const prefixe = match[1];
        const numero = parseInt(match[2]);
        
        if (!nouveauxCompteurs[prefixe] || numero > nouveauxCompteurs[prefixe]) {
          nouveauxCompteurs[prefixe] = numero;
        }
      }
    });
    
    setCompteurCours(nouveauxCompteurs);
  }, [cours]);

  useEffect(() => {
  console.log('📊 État matières mis à jour:', matieres.length, matieres);
}, [matieres]);

console.log('🔍 Rendu - Nombre de matières:', matieres.length);

  // Gérer le clic externe
  useEffect(() => {
    const gererClicExterieur = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setModalOuvert(false);
      }
    };
    
    if (modalOuvert) {
      document.addEventListener('mousedown', gererClicExterieur);
    }
    
    return () => {
      document.removeEventListener('mousedown', gererClicExterieur);
    };
  }, [modalOuvert]);

  // Fonction pour générer le code cours basé sur la matière
  const genererCodeCours = (matiereNom: string): string => {
    const prefixes: {[key: string]: string} = {
      'mathématiques': 'MAT',
      'français': 'FRAN',
      'sciences': 'SCI',
      'histoire': 'HIST',
      'géographie': 'GEO',
      'physique': 'PHYS',
      'chimie': 'CHIM',
      'anglais': 'ANG',
      'espagnol': 'ESP',
      'allemand': 'ALL',
      'arts': 'ART',
      'musique': 'MUS',
      'éducation physique': 'EPS',
      'informatique': 'INFO',
      'technologie': 'TECH'
    };

    let prefixe = 'COURS';
    const matiereLower = matiereNom.toLowerCase();
    
    for (const [motCle, code] of Object.entries(prefixes)) {
      if (matiereLower.includes(motCle.toLowerCase())) {
        prefixe = code;
        break;
      }
    }

    const numeroSuivant = (compteurCours[prefixe] || 0) + 1;
    const numeroFormate = numeroSuivant.toString().padStart(3, '0');
    
    return `${prefixe}-${numeroFormate}`;
  };

  // Ouvrir modal création
  const ouvrirModalCreation = () => {
    console.log('🎯 Ouvrir modal création');
    console.log(`📊 Enseignants disponibles: ${professeurs.length}`);
    console.log(`📊 Classes disponibles: ${classes.length}`);
    console.log(`📊 Matières disponibles: ${matieres.length}`);
    
    setFormData({
      code_cours: '',
      nom_cours: '',
      description: '',
      professeur_id: professeurs.length > 0 ? professeurs[0].id : 0,
      classe_id: classes.length > 0 ? classes[0].id : 0,
      matiere_id: matieres.length > 0 ? matieres[0].id : 0,
      jour_semaine: 'Lundi',
      heure_debut: '08:00',
      heure_fin: '09:00',
      salle: '',
      couleur: '#3B82F6',
      statut: 'actif'
    });
    
    console.log('📝 FormData initialisé:', {
      professeur_id: professeurs.length > 0 ? professeurs[0].id : 0,
      classe_id: classes.length > 0 ? classes[0].id : 0,
      matiere_id: matieres.length > 0 ? matieres[0].id : 0
    });
    
    setEditionMode(false);
    setCoursSelectionne(null);
    setModalOuvert(true);
  };

  // Ouvrir modal édition
  const ouvrirModalEdition = (cours: Cours) => {
    console.log('📝 Édition du cours:', cours);
    
    const matiereAssociee = matieres.find(m => m.id === cours.matiere_id);
    
    setFormData({
      code_cours: cours.code_cours,
      nom_cours: cours.nom_cours,
      description: cours.description || '',
      professeur_id: cours.professeur_id,
      classe_id: cours.classe_id,
      matiere_id: matiereAssociee?.id || 0,
      jour_semaine: cours.jour_semaine,
      heure_debut: cours.heure_debut,
      heure_fin: cours.heure_fin,
      salle: cours.salle || '',
      couleur: cours.couleur || '#3B82F6',
      statut: cours.statut || 'actif'
    });
    
    setEditionMode(true);
    setCoursSelectionne(cours);
    setModalOuvert(true);
  };

  // Fermer modal
  const fermerModal = () => {
    setModalOuvert(false);
  };

  const gererChangementCodeManuel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      code_cours: value
    }));
  };

  // Gérer changement matière
  const gererChangementMatiere = (matiereId: number) => {
    const matiereSelectionnee = matieres.find(m => m.id === matiereId);
    
    if (matiereSelectionnee) {
      const codeCours = genererCodeCours(matiereSelectionnee.nom);
      
      setFormData(prev => ({
        ...prev,
        matiere_id: matiereId,
        nom_cours: matiereSelectionnee.nom,
        code_cours: codeCours,
        couleur: matiereSelectionnee.couleur
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        matiere_id: matiereId,
        nom_cours: '',
        code_cours: ''
      }));
    }
  };

  // Gérer les changements
  const gererChangementForm = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'matiere_id') {
      const matiereId = parseInt(value);
      gererChangementMatiere(matiereId);
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'professeur_id' || name === 'classe_id' ? parseInt(value) : value
      }));
    }
  };

  // Validation du formulaire
  const validerFormulaire = (): boolean => {
    if (!formData.code_cours.trim()) {
      setAlerte({ type: 'error', message: 'Le code du cours est requis' });
      return false;
    }
    if (!formData.nom_cours.trim()) {
      setAlerte({ type: 'error', message: 'Le nom du cours est requis' });
      return false;
    }
    if (formData.professeur_id === 0) {
      setAlerte({ type: 'error', message: 'Veuillez sélectionner un professeur' });
      return false;
    }
    if (formData.classe_id === 0) {
      setAlerte({ type: 'error', message: 'Veuillez sélectionner une classe' });
      return false;
    }
    if (formData.matiere_id === 0) {
      setAlerte({ type: 'error', message: 'Veuillez sélectionner une matière' });
      return false;
    }
    if (formData.heure_debut >= formData.heure_fin) {
      setAlerte({ type: 'error', message: "L'heure de début doit être avant l'heure de fin" });
      return false;
    }
    return true;
  };

  // Soumettre formulaire
// Soumettre formulaire
const soumettreFormulaire = async () => {
  if (!validerFormulaire()) return;

  // ✅ Empêcher les doubles soumissions
  if (soumissionEnCours) return;
  
  setSoumissionEnCours(true); // Activer l'état de chargement

  try {
    setChargement(true);
    
    const url = '/api/cours';
    const method = editionMode ? 'PUT' : 'POST';
    
    const dataAEnvoyer = {
      ...formData,
      ...(editionMode && coursSelectionne && { 
        ancien_code_cours: coursSelectionne.code_cours 
      })
    };
    
    console.log('📤 Envoi des données cours:', dataAEnvoyer);
    
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataAEnvoyer)
    });

    const responseText = await response.text();
    const data = responseText ? JSON.parse(responseText) : { success: false, error: 'Réponse vide' };

    if (data.success) {
      setAlerte({ 
        type: 'success', 
        message: editionMode 
          ? 'Cours modifié avec succès' 
          : 'Cours créé avec succès' 
      });
      
      await rechargerToutesDonnees();
      fermerModal();
    } else {
      setAlerte({ 
        type: 'error', 
        message: data.error || 'Erreur lors de la sauvegarde' 
      });
    }
  } catch (error: any) {
    console.error('💥 Erreur sauvegarde cours:', error);
    setAlerte({ 
      type: 'error', 
      message: error.message || 'Erreur lors de la sauvegarde' 
    });
  } finally {
    setChargement(false);
    setSoumissionEnCours(false); // Désactiver l'état de chargement
  }
};

  // Gestion de la suppression
  const demanderSuppression = (cours: Cours) => {
    setCoursASupprimer(cours);
    setModalSuppressionOuvert(true);
  };

  const confirmerSuppression = async () => {
    if (!coursASupprimer) return;

    try {
      setChargement(true);
      
      const response = await fetch('/api/cours', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code_cours: coursASupprimer.code_cours })
      });

      const data = await response.json();

      if (data.success) {
        setAlerte({ type: 'success', message: 'Cours supprimé avec succès' });
        await rechargerToutesDonnees();
      } else {
        setAlerte({ type: 'error', message: data.error || 'Erreur lors de la suppression' });
      }
    } catch (error) {
      console.error('Erreur suppression cours:', error);
      setAlerte({ type: 'error', message: 'Erreur lors de la suppression' });
    } finally {
      setChargement(false);
      setCoursASupprimer(null);
      setModalSuppressionOuvert(false);
    }
  };

  // Filtrer les cours
  const coursFiltres = cours.filter(cours => {
    const correspondRecherche = 
      cours.code_cours.toLowerCase().includes(recherche.toLowerCase()) ||
      cours.nom_cours.toLowerCase().includes(recherche.toLowerCase()) ||
      cours.description.toLowerCase().includes(recherche.toLowerCase());
    
    const correspondStatut = filtreStatut === 'tous' || cours.statut === filtreStatut;
    const correspondClasse = filtreClasse === 'tous' || cours.classe_id.toString() === filtreClasse;
    const correspondProfesseur = filtreProfesseur === 'tous' || cours.professeur_id.toString() === filtreProfesseur;
    const correspondMatiere = filtreMatiere === 'tous' || cours.matiere_id?.toString() === filtreMatiere;
    
    return correspondRecherche && correspondStatut && correspondClasse && correspondProfesseur && correspondMatiere;
  });

  // Trouver le nom d'un professeur
  const getNomProfesseur = (professeurId: number) => {
    const professeur = professeurs.find(p => p.id === professeurId);
    
    if (!professeur) {
      console.log(`⚠️ Enseignant non trouvé pour ID: ${professeurId}`);
      console.log(`📋 Liste des professeurs disponibles:`, professeurs);
      return 'Enseignant non assigné';
    }
    
    return `${professeur.prenom} ${professeur.nom}`;
  };

  // Trouver le nom d'une classe
  const getNomClasse = (classeId: number) => {
    const classe = classes.find(c => c.id === classeId);
    
    if (!classe) {
      console.log(`⚠️ Classe non trouvée pour ID: ${classeId}`);
      console.log(`📋 Liste des classes disponibles:`, classes);
      return 'Classe non assignée';
    }
    
    return `${classe.niveau} ${classe.nom}`;
  };

  // Trouver la couleur d'une matière
  const getCouleurMatiere = (matiereId?: number): string => {
  if (!matiereId) return '#3B82F6';
  const matiere = matieres.find(m => m.id === matiereId);
  return matiere?.couleur || '#3B82F6';
};

  if (chargement && cours.length === 0) {
    return (
      <div className={`chargement-cours ${parametresApp?.theme_defaut || 'clair'}`}>
        <div className="spinner-grand"></div>
        <p>Chargement des cours...</p>
      </div>
    );
  }

  return (
    <div className={`conteneur-gestion-cours ${parametresApp?.theme_defaut || 'clair'}`}>
      {/* En-tête */}
      <div className="en-tete-fixe-eleves">
        <div className="conteneur-en-tete-fixe-eleves">
          <div className="titre-fixe-eleves">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>📚</span>
              <h1>
                Gestion des Cours
              </h1>
            </div>
          </div>

          {/* BOUTONS À DROITE */}
          <div className="actions-fixes">
            <div className="recherche-cours">
            <input
              type="text"
              placeholder="Rechercher un cours..."
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="champ-recherche-cours"
            />
            <span className="icone-recherche-cours">🔍</span>
          </div>
          <button className="bouton-ajouter-cours" onClick={ouvrirModalCreation}>
          + Nouveau Cours
          </button>
          <button 
            className="bouton-creer-matiere"
            onClick={() => setModalMatieresOuvert(true)}
          >
            <span className="icone-ajouter">📚</span>
            Gérer les matières  ({matieres.length})
          </button>

          </div>
        </div>
      </div>
      <div className="en-tete-gestion-cours">        
        {/* Statistiques */}
        <div className="statistiques-cours">
          <div className="carte-statistique-cours">
            <div className="icone-stat-cours">📚</div>
            <div className="contenu-stat-cours">
              <div className="valeur-stat-cours">{cours.length}</div>
              <div className="label-stat-cours">Cours total</div>
            </div>
          </div>
          
          <div className="carte-statistique-cours">
            <div className="icone-stat-cours">👨‍🏫</div>
            <div className="contenu-stat-cours">
              <div className="valeur-stat-cours">{professeurs.length}</div>
              <div className="label-stat-cours">Enseignants</div>
            </div>
          </div>
          
          <div className="carte-statistique-cours">
            <div className="icone-stat-cours">🎓</div>
            <div className="contenu-stat-cours">
              <div className="valeur-stat-cours">{classes.length}</div>
              <div className="label-stat-cours">Classes</div>
            </div>
          </div>
          
          <div className="carte-statistique-cours">
            <div className="icone-stat-cours">✅</div>
            <div className="contenu-stat-cours">
              <div className="valeur-stat-cours">{cours.filter(c => c.statut === 'actif').length}</div>
              <div className="label-stat-cours">Cours actifs</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes */}
      {alerte && (
        <div className={`alerte-cours ${alerte.type === 'success' ? 'alerte-succes' : 'alerte-erreur'}`}>
          <div className="contenu-alerte-cours">
            <span className="icone-alerte-cours">
              {alerte.type === 'success' ? '✅' : alerte.type === 'warning' ? '⚠️' : '❌'}
            </span>
            <span className="texte-alerte-cours">{alerte.message}</span>
            <button 
              className="bouton-fermer-alerte-cours"
              onClick={() => setAlerte(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="filtres-cours">
        <div className="groupe-filtre">
          <label className="label-filtre">Statut</label>
          <select 
            value={filtreStatut}
            onChange={(e) => setFiltreStatut(e.target.value)}
            className="select-filtre"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
        </div>
        
        <div className="groupe-filtre">
          <label className="label-filtre">Classe</label>
          <select 
            value={filtreClasse}
            onChange={(e) => setFiltreClasse(e.target.value)}
            className="select-filtre"
          >
            <option value="tous">Toutes les classes</option>
            {classes.map(classe => (
              <option key={classe.id} value={classe.id.toString()}>
                {classe.niveau} {classe.nom}
              </option>
            ))}
          </select>
        </div>
        
        <div className="groupe-filtre">
          <label className="label-filtre">Enseignant</label>
          <select 
            value={filtreProfesseur}
            onChange={(e) => setFiltreProfesseur(e.target.value)}
            className="select-filtre"
          >
            <option value="tous">Tous les Enseignants</option>
            {professeurs.map(prof => (
              <option key={prof.id} value={prof.id.toString()}>
                {prof.prenom} {prof.nom}
              </option>
            ))}
          </select>
        </div>

        <div className="groupe-filtre">
          <label className="label-filtre">Matière</label>
          <select 
            value={filtreMatiere}
            onChange={(e) => setFiltreMatiere(e.target.value)}
            className="select-filtre"
          >
            <option value="tous">Toutes les matières</option>
            {matieres.map(matiere => (
            <option key={matiere.id} value={matiere.id.toString()}>
              {matiere.icone} {matiere.nom} ({matiere.code_matiere}) - Coef: {matiere.coefficient}
            </option>
          ))
            }
          </select>
        </div>
        
        <button 
          className="bouton-reinitialiser-filtres"
          onClick={() => {
            setFiltreStatut('tous');
            setFiltreClasse('tous');
            setFiltreProfesseur('tous');
            setFiltreMatiere('tous');
          }}
        >
          Réinitialiser
        </button>
      </div>

      {/* Tableau des cours */}
      <div className="tableau-cours-container">
        {coursFiltres.length === 0 ? (
          <div className="aucun-cours">
            <div className="icone-aucun-cours">📚</div>
            <h3>{cours.length === 0 ? 'Aucun cours disponible' : 'Aucun cours trouvé'}</h3>
            <p>
              {cours.length === 0 
                ? 'Commencez par créer votre premier cours' 
                : 'Aucun cours ne correspond à vos critères de recherche'}
            </p>
            {cours.length === 0 && (
              <button className="bouton-creer-premier-cours" onClick={ouvrirModalCreation}>
                Créer un cours
              </button>
            )}
          </div>
        ) : (
          <div className="liste-cours">
            {coursFiltres.map((coursItem) => (
              <div 
                key={coursItem.code_cours}
                className="carte-cours"
                style={{ borderLeftColor: getCouleurMatiere(coursItem.matiere_id) }}
              >
                <div className="en-tete-carte-cours">
                  <div className="info-cours">
                    <span className="badge-code-cours" style={{ backgroundColor: getCouleurMatiere(coursItem.matiere_id) }}>
                      {coursItem.code_cours}
                    </span>
                    <span className={`badge-statut-cours ${coursItem.statut}`}>
                      {coursItem.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  <div className="actions-carte-cours">
                    <button 
                      className="bouton-action-cours bouton-modifier"
                      onClick={() => ouvrirModalEdition(coursItem)}
                      title="Modifier"
                    >
                      ✏️
                    </button>
                    <button 
                      className="bouton-action-cours bouton-supprimer"
                      onClick={() => demanderSuppression(coursItem)}
                      title="Supprimer"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <h3 className="titre-cours">{coursItem.nom_cours}</h3>
                
                <p className="description-cours">{coursItem.description}</p>
                
                <div className="details-cours">
                  <div className="detail-cours">
                    <span className="label-detail">👨‍🏫 Enseignant:</span>
                    <span className="valeur-detail">{getNomProfesseur(coursItem.professeur_id)}</span>
                  </div>
                  
                  <div className="detail-cours">
                    <span className="label-detail">🏫 Classe:</span>
                    <span className="valeur-detail">{getNomClasse(coursItem.classe_id)}</span>
                  </div>
                  
                  <div className="detail-cours">
                    <span className="label-detail">📅 Horaire:</span>
                    <span className="valeur-detail">
                      {coursItem.jour_semaine} {formaterHeure(coursItem.heure_debut)} - {formaterHeure(coursItem.heure_fin)}
                    </span>
                  </div>
                  
                  <div className="detail-cours">
                    <span className="label-detail">🚪 Salle:</span>
                    <span className="valeur-detail">{coursItem.salle || 'Non spécifiée'}</span>
                  </div>
                </div>
                
                <div className="pied-carte-cours">
                  <span className="date-creation">
                    Créé le {formaterDate(coursItem.created_at)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de création/édition */}
      {modalOuvert && (
        <div className="modal-overlay">
          <div className="modal-cours" ref={modalRef}>
            <div className="en-tete-modal-cours">
              <h2>{editionMode ? 'Modifier le cours' : 'Nouveau cours'}</h2>
              <button className="bouton-fermer-modal" onClick={fermerModal}>✕</button>
            </div>
            
            <div className="contenu-modal-cours">
              <div className="formulaire-cours">
                {/* CHAMP MATIÈRE */}
                <div className="groupe-champ-cours">
                  <label className="label-champ-cours">
                    <span className="required">*</span> Matière
                  </label>
                  <div className="selecteur-matiere">
                    <select
                      name="matiere_id"
                      value={formData.matiere_id}
                      onChange={gererChangementForm}
                      className="champ-cours champ-matiere"
                      required
                    >
                      <option value="0">Sélectionnez une matière...</option>
                      {matieres
                        .filter(m => m.statut === 'actif')
                        .map(matiere => (
                          <option 
                            key={matiere.id} 
                            value={matiere.id}
                            data-couleur={matiere.couleur}
                          >
                            {matiere.icone} {matiere.nom} ({matiere.code_matiere}) - Coef: {matiere.coefficient}
                          </option>
                        ))
                      }
                    </select>
                    <button 
                      type="button"
                      className="bouton-nouvelle-matiere"
                      onClick={() => {
                        setModalOuvert(false);
                        setTimeout(() => setModalMatieresOuvert(true), 300);
                      }}
                      title="Ajouter une nouvelle matière"
                    >
                      +
                    </button>
                  </div>
                  {matieres.length === 0 && (
                    <small className="texte-aide erreur">
                      Aucune matière disponible. Veuillez d'abord créer une matière.
                    </small>
                  )}
                </div>

                {/* CODE DU COURS */}
                <div className="groupe-champ-cours">
                  <label className="label-champ-cours">
                    <span className="required">*</span> Code du cours
                  </label>
                  <div className="conteneur-code-auto">
                    <input
                      type="text"
                      name="code_cours"
                      value={formData.code_cours}
                      onChange={gererChangementCodeManuel}
                      className="champ-cours champ-code-auto"
                      placeholder="Ex: MAT-001"
                      required
                      readOnly={editionMode}
                    />
                    <div className="badge-auto-genere">
                      {editionMode ? 'Lecture seule' : 'Auto-généré'}
                    </div>
                  </div>
                  {editionMode && (
                    <small className="texte-aide">
                      Le code du cours ne peut pas être modifié. Il est généré automatiquement à partir de la matière.
                    </small>
                  )}
                </div>

                {/* NOM DU COURS */}
                <div className="groupe-champ-cours">
                  <label className="label-champ-cours">
                    <span className="required">*</span> Nom du cours
                  </label>
                  <input
                    type="text"
                    name="nom_cours"
                    value={formData.nom_cours}
                    className="champ-cours champ-nom-lecture"
                    readOnly
                  />
                </div>

                {/* COULEUR */}
                <div className="groupe-champ-cours">
                  <label className="label-champ-cours">Couleur du cours</label>
                  <div className="conteneur-couleur-auto">
                    <div 
                      className="couleur-affichage"
                      style={{ backgroundColor: formData.couleur }}
                    ></div>
                    <div className="info-couleur-auto">
                      Définie automatiquement par la matière
                    </div>
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="groupe-champ-cours">
                  <label className="label-champ-cours">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={gererChangementForm}
                    className="champ-cours champ-textarea"
                    placeholder="Description du cours..."
                    rows={3}
                  />
                </div>

                {/* PROFESSEUR ET CLASSE */}
                <div className="groupe-champ-cours double">
                  <div className="sous-groupe">
                    <label className="label-champ-cours">
                      <span className="required">*</span> Enseignant
                    </label>
                    <select
                      name="professeur_id"
                      value={formData.professeur_id}
                      onChange={gererChangementForm}
                      className="champ-cours"
                      required
                    >
                      <option value="0">Sélectionnez un professeur</option>
                      {professeurs.map(prof => (
                        <option key={prof.id} value={prof.id}>
                          {prof.prenom} {prof.nom}
                        </option>
                      ))}
                    </select>
                    {professeurs.length === 0 && (
                      <small className="texte-aide erreur">
                        Aucun professeur disponible
                      </small>
                    )}
                  </div>
                  
                  <div className="sous-groupe">
                    <label className="label-champ-cours">
                      <span className="required">*</span> Classe
                    </label>
                    <select
                      name="classe_id"
                      value={formData.classe_id}
                      onChange={gererChangementForm}
                      className="champ-cours"
                      required
                    >
                      <option value="0">Sélectionnez une classe</option>
                      {classes.map(classe => (
                        <option key={classe.id} value={classe.id}>
                          {classe.niveau} {classe.nom}
                        </option>
                      ))}
                    </select>
                    {classes.length === 0 && (
                      <small className="texte-aide erreur">
                        Aucune classe disponible
                      </small>
                    )}
                  </div>
                </div>

                {/* HORAIRE */}
                <div className="groupe-champ-cours triple">
                  <div className="sous-groupe">
                    <label className="label-champ-cours">Jour</label>
                    <select
                      name="jour_semaine"
                      value={formData.jour_semaine}
                      onChange={gererChangementForm}
                      className="champ-cours"
                    >
                      {joursSemaine.map(jour => (
                        <option key={jour} value={jour}>{jour}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="sous-groupe">
                    <label className="label-champ-cours">Heure début</label>
                    <input
                      type="time"
                      name="heure_debut"
                      value={formData.heure_debut}
                      onChange={gererChangementForm}
                      className="champ-cours"
                    />
                  </div>
                  
                  <div className="sous-groupe">
                    <label className="label-champ-cours">Heure fin</label>
                    <input
                      type="time"
                      name="heure_fin"
                      value={formData.heure_fin}
                      onChange={gererChangementForm}
                      className="champ-cours"
                    />
                  </div>
                </div>

                {/* SALLE */}
                <div className="groupe-champ-cours">
                  <label className="label-champ-cours">Salle</label>
                  <input
                    type="text"
                    name="salle"
                    value={formData.salle}
                    onChange={gererChangementForm}
                    className="champ-cours"
                    placeholder="Ex: Salle 101"
                  />
                </div>

                {/* STATUT */}
                <div className="groupe-champ-cours">
                  <label className="label-champ-cours">Statut</label>
                  <div className="boutons-statut">
                    <button
                      type="button"
                      className={`bouton-statut ${formData.statut === 'actif' ? 'actif' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, statut: 'actif' }))}
                    >
                      Actif
                    </button>
                    <button
                      type="button"
                      className={`bouton-statut ${formData.statut === 'inactif' ? 'inactif' : ''}`}
                      onClick={() => setFormData(prev => ({ ...prev, statut: 'inactif' }))}
                    >
                      Inactif
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pied-modal-cours">
  <button 
    className="bouton-annuler-cours" 
    onClick={fermerModal}
    disabled={soumissionEnCours}
  >
    Annuler
  </button>
  <button 
    className={`bouton-sauvegarder-cours ${soumissionEnCours ? 'en-cours' : ''}`} 
    onClick={soumettreFormulaire}
    disabled={matieres.length === 0 || professeurs.length === 0 || classes.length === 0 || soumissionEnCours}
  >
    {soumissionEnCours ? (
      <>
        <span className="spinner-bouton"></span>
        {editionMode ? 'Modification en cours...' : 'Création en cours...'}
      </>
    ) : (
      editionMode ? 'Modifier' : 'Créer'
    )}
  </button>
</div>
          </div>
        </div>
      )}

      {/* Modal de gestion des matières */}
      {modalMatieresOuvert && (
        <div className="modal-overlay-matieres" onClick={() => setModalMatieresOuvert(false)}>
          <div className="modal-matieres-contenu" onClick={(e) => e.stopPropagation()}>
            <GestionMatieres 
              onMatiereAjoutee={async () => {
                await rechargerMatieres();
                await chargerDonnees();
              }}
              onFermer={() => {
                setModalMatieresOuvert(false);
              }}
            />
          </div>
        </div>
      )}

      <ModalSuppression
        isOpen={modalSuppressionOuvert}
        onClose={() => {
          setModalSuppressionOuvert(false);
          setCoursASupprimer(null);
        }}
        onConfirm={confirmerSuppression}
        title="Supprimer le cours"
        message="Êtes-vous sûr de vouloir supprimer ce cours ?"
        type="danger"
        itemName={coursASupprimer ? `"${coursASupprimer.nom_cours}" (${coursASupprimer.code_cours})` : ''}
      />
    </div>
  );
}