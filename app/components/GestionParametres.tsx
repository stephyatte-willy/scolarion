// app/components/GestionParametres.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useToast } from '../hooks/useToast';
import Toast from './Toast';
import './GestionParametres.css';

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

interface AnneeScolaire {
  id: number;
  libelle: string;
  date_debut: string;
  date_fin: string;
  est_active: boolean;
  est_cloturee: boolean;
}

// Mise à jour de l'interface ParametresApp
interface ParametresApp {
  id?: number; 
  devise: string;
  symbole_devise: string;
  format_date: string;
  fuseau_horaire: string;
  langue_defaut: string;
  theme_defaut: string;
}

// Ajout des interfaces pour les logs et sauvegardes
interface LogActivite {
  id: number;
  user_id: number;
  user_nom: string;
  user_prenom: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

interface Sauvegarde {
  id: string;  // Changé de number à string
  nom_fichier: string;
  taille: string;
  date_creation: string;
  type: 'automatique' | 'manuelle';
  statut: 'succès' | 'échec' | 'en_cours';
}

interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  avatar_url?: string;
  statut: string;
  last_login?: string;
  roles?: { id: number; nom: string }[];
}

interface Role {
  id: number;
  nom: string;
  description: string;
  niveau: number;
  permissions: Permission[];
}

interface Permission {
  id: number;
  nom: string;
  code: string;
  module: string;
  description: string;
}

interface Employe {
  id: number;
  user_id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  fonction: string;
  departement: string;
  type_enseignant: string;
  statut: string;
  avatar_url?: string;
  user_statut: string;
  roles?: { id: number; nom: string }[];
}

interface Props {
  onRetourTableauDeBord: () => void;
}

export default function GestionParametres({ onRetourTableauDeBord }: Props) {
  const [ongletActif, setOngletActif] = useState('ecole');
  const [chargement, setChargement] = useState(false);
  const { toasts, showSuccess, showError, removeToast } = useToast();

  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [uploadChargement, setUploadChargement] = useState(false);
  const inputFileRef = useRef<HTMLInputElement>(null); 
  
  
  // États pour les différents paramètres
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole>({
    id: 0,
    nom_ecole: '',
    slogan: "L'excellence éducative depuis 1985",
    adresse: '',
    telephone: '',
    email: '',
    logo_url: null,
    couleur_principale: '#3B82F6',
    annee_scolaire: ''
  });
  
  const [anneesScolaires, setAnneesScolaires] = useState<AnneeScolaire[]>([]);
const [parametresApp, setParametresApp] = useState<ParametresApp>({
  id: 1,  // Ajoutez l'id
  devise: 'XOF',
  symbole_devise: 'F CFA',
  format_date: 'dd/mm/yyyy',
  fuseau_horaire: 'Africa/Abidjan',
  langue_defaut: 'fr',
  theme_defaut: 'clair'
});
  
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [utilisateurSelectionne, setUtilisateurSelectionne] = useState<Utilisateur | null>(null);
  const [roleSelectionne, setRoleSelectionne] = useState<Role | null>(null);
  const [afficherModalUtilisateur, setAfficherModalUtilisateur] = useState(false);
  const [afficherModalRole, setAfficherModalRole] = useState(false);
  const [anneeEnCoursEdition, setAnneeEnCoursEdition] = useState<AnneeScolaire | null>(null);
  const [afficherModalModificationAnnee, setAfficherModalModificationAnnee] = useState(false);
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [employeSelectionne, setEmployeSelectionne] = useState<Employe | null>(null);
  const [afficherModalGestionPrivileges, setAfficherModalGestionPrivileges] = useState(false);
  const [logsActivite, setLogsActivite] = useState<LogActivite[]>([]);
  const [sauvegardes, setSauvegardes] = useState<Sauvegarde[]>([]);
  const [afficherModalLogs, setAfficherModalLogs] = useState(false);
  const [afficherModalSauvegarde, setAfficherModalSauvegarde] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [nettoyageEnCours, setNettoyageEnCours] = useState(false);
  const [filtreLogs, setFiltreLogs] = useState('tout');
  const [dateDebutLogs, setDateDebutLogs] = useState('');
  const [dateFinLogs, setDateFinLogs] = useState('');
  const [formModificationAnnee, setFormModificationAnnee] = useState({
    libelle: '',
    date_debut: '',
    date_fin: '',
    est_active: false
  });

  // États pour les modales personnalisées
const [modalConfirmation, setModalConfirmation] = useState<{
  isOpen: boolean;
  titre: string;
  message: string;
  type: 'danger' | 'warning' | 'info';
  itemNom: string;
  onConfirm: () => void;
} | null>(null);

const [modalDesactivation, setModalDesactivation] = useState<{
  isOpen: boolean;
  utilisateur: Employe | null;
  action: 'activer' | 'désactiver' | 'suspendre';
  onConfirm: (motif?: string) => void;
} | null>(null);

  
  // Formulaire utilisateur
  const [formUtilisateur, setFormUtilisateur] = useState({
    email: '',
    password: '',
    nom: '',
    prenom: '',
    role: 'enseignant',
    roles: [] as number[],
    statut: 'actif' as 'actif' | 'inactif'
  });
  
  // Formulaire rôle
  const [formRole, setFormRole] = useState({
    nom: '',
    description: '',
    niveau: 0,
    permissions: [] as number[]
  });
  
  // Nouvelle année scolaire
  const [nouvelleAnnee, setNouvelleAnnee] = useState({
    libelle: '',
    date_debut: '',
    date_fin: '',
    est_active: false
  });
  
  const [afficherModalAnnee, setAfficherModalAnnee] = useState(false);

  useEffect(() => {
    chargerDonnees();
  }, [ongletActif]);

  useEffect(() => {
  console.log('📊 État anneesScolaires mis à jour:', anneesScolaires);
  if (anneesScolaires.length > 0) {
    anneesScolaires.forEach(annee => {
      console.log(`   - ${annee.libelle}: ID=${annee.id} (${typeof annee.id})`);
    });
  }
}, [anneesScolaires]);

const chargerEmployes = async () => {
  try {
    const response = await fetch('/api/parametres/employes');
    const data = await response.json();
    if (data.success && data.employes) {
      setEmployes(data.employes);
    }
  } catch (error) {
    console.error('Erreur chargement employés:', error);
    showError('Impossible de charger la liste des employés');
  }
};

// Modifier chargerDonnees pour inclure les employés
const chargerDonnees = async () => {
  setChargement(true);
  try {
    if (ongletActif === 'ecole') {
      await chargerParametresEcole();
      await chargerAnneesScolaires();
    } else if (ongletActif === 'utilisateurs') {
      await chargerEmployes(); // Remplacer chargerUtilisateurs par chargerEmployes
      await chargerRoles();
      await chargerPermissions();
    } else if (ongletActif === 'systeme') {
      await chargerParametresApp();
    }
  } catch (error) {
    console.error('Erreur chargement:', error);
    showError('Erreur lors du chargement des données');
  } finally {
    setChargement(false);
  }
};

// Fonction pour ouvrir le modal de gestion des privilèges
const ouvrirModalGestionPrivileges = (employe: Employe) => {
  setEmployeSelectionne(employe);
  setFormUtilisateur({
    email: employe.email,
    password: '',
    nom: employe.nom,
    prenom: employe.prenom,
    role: 'enseignant',
    roles: employe.roles?.map(r => r.id) || [],
    statut: employe.user_statut as 'actif' | 'inactif'
  });
  setAfficherModalGestionPrivileges(true);
};

// Fonction pour sauvegarder les privilèges d'un employé
// Fonction pour sauvegarder les privilèges d'un employé (VERSION AVEC LOGS)
const sauvegarderPrivilegesEmploye = async () => {
  try {
    setChargement(true);
    
    if (!employeSelectionne) {
      showError('Aucun employé sélectionné');
      return;
    }
    
    console.log('=== DÉBUG ENVOI ===');
    console.log('employeSelectionne:', employeSelectionne);
    console.log('user_id:', employeSelectionne.user_id);
    console.log('Type user_id:', typeof employeSelectionne.user_id);
    
    // Construction de l'URL
    const url = `/api/parametres/employes/${employeSelectionne.user_id}/privileges`;
    console.log('URL appelée:', url);
    
    const payload = {
      roles: formUtilisateur.roles,
      statut: formUtilisateur.statut
    };
    console.log('Payload:', payload);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    console.log('Statut réponse:', response.status);
    const data = await response.json();
    console.log('Réponse:', data);
    
    if (response.ok && data.success) {
      showSuccess('Privilèges mis à jour avec succès !');
      setAfficherModalGestionPrivileges(false);
      setEmployeSelectionne(null);
      await chargerEmployes();
    } else {
      showError(data.erreur || 'Erreur lors de la mise à jour');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showError('Erreur de connexion');
  } finally {
    setChargement(false);
  }
};

// Fonction pour activer/désactiver un compte utilisateur
const changerStatutCompte = async (employe: Employe, action: 'activer' | 'désactiver') => {
  setModalDesactivation({
    isOpen: true,
    utilisateur: employe,
    action: action,
    onConfirm: async (motif?: string) => {
      try {
        setChargement(true);
        
        const nouveauStatut = action === 'activer' ? 'actif' : 'inactif';
        
        const response = await fetch(`/api/parametres/utilisateurs/${employe.user_id}/statut`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            statut: nouveauStatut,
            motif: motif 
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          showSuccess(`Compte ${action === 'activer' ? 'activé' : 'désactivé'} avec succès !`);
          await chargerEmployes();
        } else {
          showError(data.erreur || `Erreur lors de la ${action} du compte`);
        }
      } catch (error) {
        console.error('Erreur changement statut:', error);
        showError('Erreur de connexion');
      } finally {
        setChargement(false);
      }
    }
  });
};

const ouvrirSelecteurFichier = () => {
    inputFileRef.current?.click();
  };

  // Fonction pour gérer le changement de logo
const gererChangementLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Validation du type de fichier
  const typesValides = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!typesValides.includes(file.type)) {
    showError('Format de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP');
    return;
  }
  
  // Validation de la taille (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showError('L\'image ne doit pas dépasser 5MB');
    return;
  }
  
  setUploadChargement(true);
  
  try {
    // Afficher la prévisualisation
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewLogo(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Préparer le FormData pour l'upload
    const formData = new FormData();
    formData.append('logo', file);
    
    // Envoyer au serveur
    const response = await fetch('/api/parametres/logo', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
      // ✅ CORRECTION : Mettre à jour avec la nouvelle URL et forcer un re-rendu
      const nouvelleUrl = data.logo_url;
      
      setParametresEcole(prev => {
        console.log('🔄 Mise à jour du logo:', nouvelleUrl);
        return {
          ...prev,
          logo_url: nouvelleUrl
        };
      });
      
      setPreviewLogo(null);
      showSuccess('Logo téléchargé avec succès !');
      
      // ✅ FORCER le rechargement de la page de connexion si elle est ouverte
      // En émettant un événement personnalisé
      window.dispatchEvent(new CustomEvent('logo-updated', { 
        detail: { logo_url: nouvelleUrl } 
      }));
      
    } else {
      showError(data.erreur || 'Erreur lors du téléchargement du logo');
      setPreviewLogo(null);
    }
  } catch (error) {
    console.error('Erreur upload:', error);
    showError('Erreur de connexion lors du téléchargement');
    setPreviewLogo(null);
  } finally {
    setUploadChargement(false);
    if (inputFileRef.current) {
      inputFileRef.current.value = '';
    }
  }
};

// Ajoutez aussi cette version améliorée de la suppression
const supprimerLogo = async () => {
  if (!parametresEcole.logo_url && !previewLogo) return;
  
  if (!confirm('Êtes-vous sûr de vouloir supprimer le logo ?')) {
    return;
  }
  
  setUploadChargement(true);
  
  try {
    const response = await fetch('/api/parametres/logo', {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (data.success) {
      setParametresEcole(prev => ({
        ...prev,
        logo_url: null
      }));
      setPreviewLogo(null);
      showSuccess('Logo supprimé avec succès !');
      
      // Émettre l'événement de mise à jour
      window.dispatchEvent(new CustomEvent('logo-updated', { 
        detail: { logo_url: null } 
      }));
      
    } else {
      showError(data.erreur || 'Erreur lors de la suppression du logo');
    }
  } catch (error) {
    console.error('Erreur suppression:', error);
    showError('Erreur de connexion lors de la suppression');
  } finally {
    setUploadChargement(false);
  }
};

// Fonction pour annuler la prévisualisation
const annulerPreview = () => {
  setPreviewLogo(null);
  if (inputFileRef.current) {
    inputFileRef.current.value = '';
  }
};

// Fonction pour gérer les erreurs de chargement d'images
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, employe: Employe) => {
  console.log('❌ Erreur chargement image pour:', employe.prenom, employe.nom, 'URL:', employe.avatar_url);
  
  // Cacher l'image qui a échoué
  const img = e.currentTarget;
  img.style.display = 'none';
  
  // Récupérer le conteneur parent
  const parent = img.parentElement;
  if (parent) {
    // Vérifier s'il y a déjà un div d'initiales
    let initialesDiv = parent.querySelector('.avatar-initiales-fallback');
    if (!initialesDiv) {
      // Créer un nouveau div pour les initiales
      initialesDiv = document.createElement('div');
      initialesDiv.className = 'avatar-initiales-fallback';
      initialesDiv.textContent = getInitiales(employe.nom, employe.prenom);
      parent.appendChild(initialesDiv);
    }
  }
};

  const chargerParametresEcole = async () => {
    try {
      const response = await fetch('/api/parametres/ecole');
      const data = await response.json();
      if (data.success && data.parametres) {
        setParametresEcole(data.parametres);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres école:', error);
      showError('Impossible de charger les paramètres de l\'école');
    }
  };

const ouvrirModalModificationAnnee = (annee: AnneeScolaire) => {
  console.log('🔵 Ouverture modal modification pour année:', annee);
  console.log('🔍 ID avant traitement:', annee.id, 'Type:', typeof annee.id);
  
  // S'assurer que l'ID est conservé
  setAnneeEnCoursEdition({
    ...annee,
    id: Number(annee.id) // Conversion explicite si nécessaire
  });
  
  // Formater les dates pour l'input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  setFormModificationAnnee({
    libelle: annee.libelle,
    date_debut: formatDateForInput(annee.date_debut),
    date_fin: formatDateForInput(annee.date_fin),
    est_active: annee.est_active
  });
  
  setAfficherModalModificationAnnee(true);
};

  const chargerParametresApp = async () => {
  try {
    const response = await fetch('/api/parametres/application');
    const data = await response.json();
    if (data.success && data.parametres) {
      setParametresApp(data.parametres);
    } else {
      // Si pas de paramètres, on utilise les valeurs par défaut
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
    console.error('Erreur chargement paramètres app:', error);
    showError('Impossible de charger la configuration système');
  }
};

// Fonction pour charger les années scolaires
const chargerAnneesScolaires = async () => {
  try {
    console.log('📥 ===== CHARGEMENT ANNÉES SCOLAIRES =====');
    const response = await fetch('/api/parametres/annees-scolaires');
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('📊 Données brutes reçues:', data);
    
    if (data.success && data.annees) {
      // S'assurer que chaque ID est converti en nombre
      const anneesTraitees = data.annees.map((annee: any) => {
        // Conversion explicite en nombre
        let idNumerique: number;
        if (typeof annee.id === 'string') {
          idNumerique = parseInt(annee.id);
        } else {
          idNumerique = Number(annee.id);
        }
        
        console.log(`🆔 Année ${annee.libelle}: ID original=${annee.id} (${typeof annee.id}) -> converti=${idNumerique} (${typeof idNumerique})`);
        
        return {
          ...annee,
          id: idNumerique,
          est_active: annee.est_active === 1 || annee.est_active === true,
          est_cloturee: annee.est_cloturee === 1 || annee.est_cloturee === true
        };
      });
      
      console.log('✅ Années avec IDs numériques:', anneesTraitees);
      setAnneesScolaires(anneesTraitees);
    } else {
      showError('Impossible de charger les années scolaires');
    }
  } catch (error) {
    console.error('❌ Erreur chargement années scolaires:', error);
    showError('Impossible de charger les années scolaires');
  }
};

  const chargerUtilisateurs = async () => {
    try {
      const response = await fetch('/api/parametres/utilisateurs');
      const data = await response.json();
      if (data.success && data.utilisateurs) {
        setUtilisateurs(data.utilisateurs);
      }
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      showError('Impossible de charger les utilisateurs');
    }
  };

  const chargerRoles = async () => {
    try {
      const response = await fetch('/api/parametres/roles');
      const data = await response.json();
      if (data.success && data.roles) {
        setRoles(data.roles);
      }
    } catch (error) {
      console.error('Erreur chargement rôles:', error);
      showError('Impossible de charger les rôles');
    }
  };

  const chargerPermissions = async () => {
    try {
      const response = await fetch('/api/parametres/permissions');
      const data = await response.json();
      if (data.success && data.permissions) {
        setPermissions(data.permissions);
      }
    } catch (error) {
      console.error('Erreur chargement permissions:', error);
      showError('Impossible de charger les permissions');
    }
  };

  const sauvegarderParametresEcole = async () => {
    try {
      setChargement(true);
      const response = await fetch('/api/parametres/ecole', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parametresEcole)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Paramètres de l\'école mis à jour avec succès !');
        await chargerParametresEcole();
      } else {
        showError(data.erreur || 'Erreur lors de la mise à jour des paramètres');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      showError('Erreur de connexion lors de la sauvegarde');
    } finally {
      setChargement(false);
    }
  };

// Dans GestionParametres.tsx, modifier la fonction sauvegarderParametresApp
const sauvegarderParametresApp = async () => {
  try {
    setChargement(true);
    
    if (!parametresApp.devise || !parametresApp.symbole_devise) {
      showError('La devise et son symbole sont obligatoires');
      return;
    }
    
    const response = await fetch('/api/parametres/application', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parametresApp)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess('Configuration système mise à jour avec succès !');
      
      // ✅ CORRECTION: Appliquer le thème et le sauvegarder dans localStorage
      appliquerTheme(parametresApp.theme_defaut);
      localStorage.setItem('theme', parametresApp.theme_defaut);
      
      // Mettre à jour le fuseau horaire dans le localStorage
      localStorage.setItem('fuseau_horaire', parametresApp.fuseau_horaire);
      
      // ✅ AJOUT: Émettre un événement pour informer les autres composants
      window.dispatchEvent(new CustomEvent('theme-change', { 
        detail: { theme: parametresApp.theme_defaut } 
      }));
    } else {
      showError(data.erreur || 'Erreur lors de la mise à jour');
    }
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    showError('Erreur de connexion lors de la sauvegarde');
  } finally {
    setChargement(false);
  }
};

// ✅ CORRECTION: Améliorer la fonction appliquerTheme
const appliquerTheme = (theme: string) => {
  const root = document.documentElement;
  
  // Ajouter une classe de transition pour une animation fluide
  document.body.classList.add('theme-transition');
  
  if (theme === 'sombre') {
    root.classList.add('theme-sombre');
    // ✅ AJOUT: Modifier aussi la meta theme-color pour mobile
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#1a1a1a');
    }
  } else {
    root.classList.remove('theme-sombre');
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', '#ffffff');
    }
  }
  
  // Retirer la classe de transition après l'animation
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 300);
};


const lancerSauvegarde = async () => {
  if (!confirm('Voulez-vous créer une nouvelle sauvegarde ?')) {
    return;
  }
  
  try {
    setSauvegardeEnCours(true);
    console.log('💾 Lancement sauvegarde...');
    
    const response = await fetch('/api/parametres/sauvegardes', {
      method: 'POST'
    });
    
    const data = await response.json();
    console.log('📊 Réponse:', data);
    
    if (data.success) {
      showSuccess('✅ Sauvegarde créée avec succès');
      // Attendre un peu pour que le fichier soit bien écrit
      setTimeout(async () => {
        await chargerSauvegardes();
      }, 500);
    } else {
      showError(data.erreur || '❌ Erreur lors de la sauvegarde');
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde:', error);
    showError('Erreur de connexion');
  } finally {
    setSauvegardeEnCours(false);
  }
};


const chargerSauvegardes = async () => {
  try {
    setChargement(true);
    console.log('📥 Chargement des sauvegardes...');
    
    const response = await fetch('/api/parametres/sauvegardes');
    const data = await response.json();
    
    console.log('📊 Données reçues:', data);
    
    if (data.success) {
      setSauvegardes(data.sauvegardes || []);
      if (data.sauvegardes?.length > 0) {
        console.log(`✅ ${data.sauvegardes.length} sauvegardes chargées`);
      } else {
        console.log('ℹ️ Aucune sauvegarde trouvée');
      }
    } else {
      console.error('❌ Erreur:', data.erreur);
      showError(data.erreur || 'Erreur lors du chargement');
    }
  } catch (error) {
    console.error('❌ Erreur chargement sauvegardes:', error);
    showError('Erreur de connexion');
  } finally {
    setChargement(false);
  }
};


const telechargerSauvegarde = async (sauvegarde: Sauvegarde) => {
  try {
    console.log('📥 Téléchargement sauvegarde:', sauvegarde);
    
    // Utiliser l'ID pour le téléchargement
    const url = `/api/parametres/sauvegardes/${sauvegarde.id}`;
    console.log('🔗 URL:', url);
    
    // Ouvrir dans un nouvel onglet
    window.open(url, '_blank');
    
  } catch (error) {
    console.error('❌ Erreur téléchargement:', error);
    showError('Erreur lors du téléchargement');
  }
};


// Fonction pour supprimer une sauvegarde
const supprimerSauvegarde = async (id: string, nom: string) => {
  if (!confirm(`Supprimer la sauvegarde "${nom}" ?`)) {
    return;
  }
  
  try {
    setChargement(true);
    console.log('🗑️ Suppression sauvegarde ID:', id);
    
    const response = await fetch(`/api/parametres/sauvegardes?id=${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    console.log('📊 Réponse suppression:', data);
    
    if (data.success) {
      showSuccess('✅ Sauvegarde supprimée');
      await chargerSauvegardes();
    } else {
      showError(data.erreur || '❌ Erreur lors de la suppression');
    }
  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    showError('Erreur de connexion');
  } finally {
    setChargement(false);
  }
};

const nettoyerDonnees = async () => {
  if (!confirm('Nettoyer les données temporaires ?')) {
    return;
  }
  
  try {
    setNettoyageEnCours(true);
    
    const response = await fetch('/api/parametres/maintenance/nettoyage', {
      method: 'POST'
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess(data.message || 'Nettoyage effectué');
    } else {
      showError(data.erreur || 'Erreur lors du nettoyage');
    }
  } catch (error) {
    console.error('Erreur nettoyage:', error);
    showError('Erreur de connexion');
  } finally {
    setNettoyageEnCours(false);
  }
};

// Obtenir le libellé du fuseau horaire
const getFuseauHoraireLibelle = (fuseau: string): string => {
  const fuseaux: Record<string, string> = {
    'Africa/Abidjan': 'Abidjan (GMT+0)',
    'Africa/Dakar': 'Dakar (GMT+0)',
    'Africa/Lagos': 'Lagos (GMT+1)',
    'Africa/Johannesburg': 'Johannesburg (GMT+2)',
    'Africa/Cairo': 'Le Caire (GMT+2)',
    'Africa/Casablanca': 'Casablanca (GMT+0)',
    'Africa/Nairobi': 'Nairobi (GMT+3)',
    'Europe/Paris': 'Paris (GMT+1)',
    'Europe/London': 'Londres (GMT+0)'
  };
  return fuseaux[fuseau] || fuseau;
};

// Formater la taille de fichier
const formaterTaille = (octets: number): string => {
  if (octets < 1024) return octets + ' o';
  if (octets < 1024 * 1024) return (octets / 1024).toFixed(2) + ' Ko';
  if (octets < 1024 * 1024 * 1024) return (octets / (1024 * 1024)).toFixed(2) + ' Mo';
  return (octets / (1024 * 1024 * 1024)).toFixed(2) + ' Go';
};

  const creerAnneeScolaire = async () => {
  try {
    setChargement(true);
    
    // Validation
    if (!nouvelleAnnee.libelle || !nouvelleAnnee.date_debut || !nouvelleAnnee.date_fin) {
      showError('Veuillez remplir tous les champs');
      return;
    }
    
    // Vérifier que la date de fin est après la date de début
    if (new Date(nouvelleAnnee.date_fin) <= new Date(nouvelleAnnee.date_debut)) {
      showError('La date de fin doit être postérieure à la date de début');
      return;
    }
    
    const response = await fetch('/api/parametres/annees-scolaires', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nouvelleAnnee)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess('Année scolaire créée avec succès !');
      setAfficherModalAnnee(false);
      setNouvelleAnnee({ libelle: '', date_debut: '', date_fin: '', est_active: false });
      await chargerAnneesScolaires();
    } else {
      showError(data.erreur || 'Erreur lors de la création');
    }
  } catch (error) {
    console.error('❌ Erreur création:', error);
    showError('Erreur de connexion lors de la création');
  } finally {
    setChargement(false);
  }
};
  const sauvegarderRole = async () => {
    try {
      setChargement(true);
      
      // Validation
      if (!formRole.nom) {
        showError('Le nom du rôle est obligatoire');
        return;
      }
      
      const url = roleSelectionne 
        ? `/api/parametres/roles?id=${roleSelectionne.id}`
        : '/api/parametres/roles';
      
      const method = roleSelectionne ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formRole)
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess(`Rôle ${roleSelectionne ? 'modifié' : 'créé'} avec succès !`);
        setAfficherModalRole(false);
        setRoleSelectionne(null);
        setFormRole({ nom: '', description: '', niveau: 0, permissions: [] });
        await chargerRoles();
      } else {
        showError(data.erreur || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      showError('Erreur de connexion lors de la sauvegarde');
    } finally {
      setChargement(false);
    }
  };

  const handlePermissionToggle = (permissionId: number) => {
    setFormRole(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const handleRoleToggle = (roleId: number) => {
  setFormUtilisateur(prev => {
    const newRoles = prev.roles.includes(roleId)
      ? prev.roles.filter(id => id !== roleId)
      : [...prev.roles, roleId];
    
    console.log('Rôles sélectionnés:', newRoles); // Pour debug
    return {
      ...prev,
      roles: newRoles
    };
  });
};;

// Fonction pour modifier une année scolaire
const modifierAnneeScolaire = async () => {
  try {
    setChargement(true);
    
    console.log('🔵 Modification année scolaire - Début');
    console.log('📝 Données du formulaire:', formModificationAnnee);
    console.log('📝 Année en cours édition:', anneeEnCoursEdition);
    
    // Validation
    if (!formModificationAnnee.libelle || !formModificationAnnee.date_debut || !formModificationAnnee.date_fin) {
      showError('Veuillez remplir tous les champs');
      return;
    }
    
    // Vérifier que la date de fin est après la date de début
    if (new Date(formModificationAnnee.date_fin) <= new Date(formModificationAnnee.date_debut)) {
      showError('La date de fin doit être postérieure à la date de début');
      return;
    }
    
    if (!anneeEnCoursEdition) {
      showError('Aucune année sélectionnée');
      return;
    }
    
    console.log('🆔 ID de l\'année à modifier:', anneeEnCoursEdition.id, 'Type:', typeof anneeEnCoursEdition.id);
    
    // ✅ SOLUTION: Envoyer l'ID dans le corps de la requête, pas dans l'URL
    const response = await fetch('/api/parametres/annees-scolaires/modifier', {
      method: 'POST', // Utiliser POST au lieu de PUT pour éviter les problèmes de routage
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: anneeEnCoursEdition.id, // ID dans le corps
        ...formModificationAnnee
      })
    });
    
    console.log('📊 Statut réponse:', response.status);
    
    const data = await response.json();
    console.log('📊 Données réponse:', data);
    
    if (data.success) {
      showSuccess('Année scolaire modifiée avec succès !');
      setAfficherModalModificationAnnee(false);
      setAnneeEnCoursEdition(null);
      await chargerAnneesScolaires();
    } else {
      showError(data.erreur || 'Erreur lors de la modification');
    }
  } catch (error) {
    console.error('❌ Erreur modification année scolaire:', error);
    showError('Erreur de connexion lors de la modification');
  } finally {
    setChargement(false);
  }
};

// Fonction pour activer une année scolaire (VERSION CORRIGÉE)
const activerAnneeScolaire = (annee: AnneeScolaire) => {
  setModalConfirmation({
    isOpen: true,
    titre: 'Activer l\'année scolaire',
    message: `Êtes-vous sûr de vouloir activer l'année "${annee.libelle}" ?`,
    type: 'info',
    itemNom: annee.libelle,
    onConfirm: async () => {
      try {
        setChargement(true);
        
        console.log('🔵 Activation année scolaire - ID:', annee.id);
        
        // ✅ SOLUTION: Envoyer l'ID dans le corps de la requête
        const response = await fetch('/api/parametres/annees-scolaires/activer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: annee.id })
        });
        
        const data = await response.json();
        console.log('📊 Réponse activation:', data);
        
        if (data.success) {
          showSuccess('Année scolaire activée avec succès !');
          await chargerAnneesScolaires();
        } else {
          showError(data.erreur || 'Erreur lors de l\'activation');
        }
      } catch (error) {
        console.error('❌ Erreur activation année:', error);
        showError('Erreur de connexion lors de l\'activation');
      } finally {
        setChargement(false);
      }
    }
  });
};

// Fonction pour supprimer une année scolaire (VERSION CORRIGÉE)
const supprimerAnneeScolaire = (annee: AnneeScolaire) => {
  setModalConfirmation({
    isOpen: true,
    titre: 'Supprimer l\'année scolaire',
    message: `Êtes-vous sûr de vouloir supprimer l'année "${annee.libelle}" ?`,
    type: 'danger',
    itemNom: annee.libelle,
    onConfirm: async () => {
      try {
        setChargement(true);
        
        console.log('🔴 Suppression année scolaire - ID:', annee.id);
        
        // ✅ SOLUTION: Envoyer l'ID dans le corps de la requête
        const response = await fetch('/api/parametres/annees-scolaires/supprimer', {
          method: 'POST', // POST au lieu de DELETE
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: annee.id })
        });
        
        const data = await response.json();
        console.log('📊 Réponse suppression:', data);
        
        if (data.success) {
          showSuccess('Année scolaire supprimée avec succès !');
          await chargerAnneesScolaires();
        } else {
          showError(data.erreur || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('❌ Erreur suppression année:', error);
        showError('Erreur de connexion lors de la suppression');
      } finally {
        setChargement(false);
      }
    }
  });
};

// Fonction pour modifier un utilisateur
const modifierUtilisateur = async () => {
  try {
    setChargement(true);
    
    if (!utilisateurSelectionne) {
      showError('Aucun utilisateur sélectionné');
      return;
    }
    
    // Validation
    if (!formUtilisateur.email || !formUtilisateur.nom || !formUtilisateur.prenom) {
      showError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    const response = await fetch(`/api/parametres/utilisateurs/${utilisateurSelectionne.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formUtilisateur)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess('Utilisateur modifié avec succès !');
      setAfficherModalUtilisateur(false);
      setUtilisateurSelectionne(null);
      setFormUtilisateur({
        email: '',
        password: '',
        nom: '',
        prenom: '',
        role: 'enseignant',
        roles: [],
        statut: 'actif'
      });
      await chargerUtilisateurs();
    } else {
      showError(data.erreur || 'Erreur lors de la modification');
    }
  } catch (error) {
    console.error('Erreur modification utilisateur:', error);
    showError('Erreur de connexion lors de la modification');
  } finally {
    setChargement(false);
  }
};

// Fonction pour ouvrir le modal de modification d'un utilisateur
const ouvrirModalModificationUtilisateur = (utilisateur: Utilisateur) => {
  setUtilisateurSelectionne(utilisateur);
  setFormUtilisateur({
    email: utilisateur.email,
    password: '', // Ne pas pré-remplir le mot de passe
    nom: utilisateur.nom,
    prenom: utilisateur.prenom,
    role: utilisateur.role,
    roles: utilisateur.roles?.map(r => r.id) || [],
    statut: utilisateur.statut as 'actif' | 'inactif'
  });
  setAfficherModalUtilisateur(true);
};

// Fonction pour suspendre/réactiver un utilisateur
const suspendreUtilisateur = async (utilisateur: Utilisateur) => {
  const nouveauStatut = utilisateur.statut === 'actif' ? 'inactif' : 'actif';
  const action = nouveauStatut === 'actif' ? 'réactiver' : 'suspendre';
  
  if (!confirm(`Êtes-vous sûr de vouloir ${action} cet utilisateur ?`)) {
    return;
  }
  
  try {
    setChargement(true);
    
    const response = await fetch(`/api/parametres/utilisateurs/${utilisateur.id}/statut`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ statut: nouveauStatut })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess(`Utilisateur ${action === 'suspendre' ? 'suspendu' : 'réactivé'} avec succès !`);
      await chargerUtilisateurs();
    } else {
      showError(data.erreur || `Erreur lors de la ${action} de l'utilisateur`);
    }
  } catch (error) {
    console.error('Erreur changement statut:', error);
    showError('Erreur de connexion');
  } finally {
    setChargement(false);
  }
};


// Fonction pour supprimer un rôle avec modale personnalisée
const supprimerRole = async (role: Role) => {
  setModalConfirmation({
    isOpen: true,
    titre: 'Supprimer le rôle',
    message: 'Êtes-vous sûr de vouloir supprimer ce rôle ? Cette action est irréversible.',
    type: 'danger',
    itemNom: role.nom,
    onConfirm: async () => {
      try {
        setChargement(true);
        
        console.log('🗑️ Tentative de suppression du rôle:', role.id);
        
        const response = await fetch(`/api/parametres/roles/${role.id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        console.log('📊 Réponse suppression:', data);
        
        if (data.success) {
          showSuccess('Rôle supprimé avec succès !');
          await chargerRoles();
        } else {
          showError(data.erreur || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur suppression rôle:', error);
        showError('Erreur de connexion lors de la suppression');
      } finally {
        setChargement(false);
      }
    }
  });
};

// Fonction pour supprimer un utilisateur
const supprimerUtilisateur = async (utilisateur: Utilisateur) => {
  setModalConfirmation({
    isOpen: true,
    titre: 'Supprimer l\'utilisateur',
    message: 'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera également son compte.',
    type: 'danger',
    itemNom: `${utilisateur.prenom} ${utilisateur.nom}`,
    onConfirm: async () => {
      try {
        setChargement(true);
        
        const response = await fetch(`/api/parametres/utilisateurs/${utilisateur.id}`, {
          method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
          showSuccess('Utilisateur supprimé avec succès !');
          await chargerUtilisateurs();
        } else {
          showError(data.erreur || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Erreur suppression utilisateur:', error);
        showError('Erreur de connexion lors de la suppression');
      } finally {
        setChargement(false);
      }
    }
  });
};

// Fonction pour dupliquer un rôle
const dupliquerRole = async (role: Role) => {
  try {
    setChargement(true);
    
    const nouveauRole = {
      nom: `${role.nom} (copie)`,
      description: role.description,
      niveau: role.niveau,
      permissions: role.permissions.map(p => p.id)
    };
    
    const response = await fetch('/api/parametres/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nouveauRole)
    });
    
    const data = await response.json();
    
    if (data.success) {
      showSuccess('Rôle dupliqué avec succès !');
      await chargerRoles();
    } else {
      showError(data.erreur || 'Erreur lors de la duplication');
    }
  } catch (error) {
    console.error('Erreur duplication rôle:', error);
    showError('Erreur de connexion lors de la duplication');
  } finally {
    setChargement(false);
  }
};

// Fonction pour sélectionner/désélectionner toutes les permissions d'un module
const toggleToutesPermissionsModule = (module: string, checked: boolean) => {
  const permissionsModule = permissionsParModule[module] || [];
  const idsModule = permissionsModule.map(p => p.id);
  
  setFormRole(prev => {
    if (checked) {
      // Ajouter toutes les permissions du module non déjà présentes
      const nouvellesPermissions = [...new Set([...prev.permissions, ...idsModule])];
      return { ...prev, permissions: nouvellesPermissions };
    } else {
      // Retirer toutes les permissions du module
      const permissionsRestantes = prev.permissions.filter(id => !idsModule.includes(id));
      return { ...prev, permissions: permissionsRestantes };
    }
  });
};

// Fonction pour vérifier si toutes les permissions d'un module sont sélectionnées
const toutesPermissionsModuleSelectionnees = (module: string): boolean => {
  const permissionsModule = permissionsParModule[module] || [];
  if (permissionsModule.length === 0) return false;
  
  return permissionsModule.every(p => formRole.permissions.includes(p.id));
};

// Fonction pour vérifier si certaines permissions d'un module sont sélectionnées
const certainesPermissionsModuleSelectionnees = (module: string): boolean => {
  const permissionsModule = permissionsParModule[module] || [];
  if (permissionsModule.length === 0) return false;
  
  const selectedCount = permissionsModule.filter(p => formRole.permissions.includes(p.id)).length;
  return selectedCount > 0 && selectedCount < permissionsModule.length;
};

  const getInitiales = (nom: string, prenom: string) => {
    return `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase();
  };

  const formaterDate = (date: string | null | undefined) => {
    if (!date) return 'Jamais';
    try {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const permissionsParModule = permissions.reduce((acc, permission) => {
    if (!acc[permission.module]) {
      acc[permission.module] = [];
    }
    acc[permission.module].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  // ==================== COMPOSANTS DE MODALES PERSONNALISÉES ====================

// Modale de confirmation
const ModalConfirmation = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titre, 
  message, 
  type = 'danger',
  itemNom = ''
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  titre: string; 
  message: string; 
  type?: 'danger' | 'warning' | 'info';
  itemNom?: string;
}) => {
  if (!isOpen) return null;
  
  const icones = {
    danger: { icon: '⚠️', bg: '#fee2e2', color: '#ef4444', border: '#fecaca' },
    warning: { icon: '⚠️', bg: '#fef3c7', color: '#f59e0b', border: '#fde68a' },
    info: { icon: 'ℹ️', bg: '#dbeafe', color: '#3b82f6', border: '#bfdbfe' }
  };
  
  const style = icones[type];
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-contenu-confirmation" onClick={(e) => e.stopPropagation()}>
        <div className="modal-confirmation-icon" style={{ background: style.bg, color: style.color }}>
          {style.icon}
        </div>
        <h3 className="modal-confirmation-titre">{titre}</h3>
        <p className="modal-confirmation-message">{message}</p>
        <div className="modal-confirmation-actions">
          <button className="bouton-annuler" onClick={onClose}>
            Annuler
          </button>
          <button 
            className={`bouton-confirmer-activer -${type}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {type === 'danger' ? 'Supprimer' : 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Modale de désactivation/suspension
const ModalDesactivation = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  utilisateur,
  action
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: (motif?: string) => void; 
  utilisateur: Employe | null;
  action: 'activer' | 'désactiver' | 'suspendre';
}) => {
  const [motif, setMotif] = useState('');
  
  if (!isOpen || !utilisateur) return null;
  
  const config = {
    activer: {
      titre: 'Activer le compte',
      message: `Êtes-vous sûr de vouloir activer le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`,
      icon: '🔓',
      color: '#10b981',
      bg: '#d1fae5',
      showMotif: false
    },
    désactiver: {
      titre: 'Désactiver le compte',
      message: `Êtes-vous sûr de vouloir désactiver le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`,
      icon: '🔒',
      color: '#f59e0b',
      bg: '#fef3c7',
      showMotif: true
    },
    suspendre: {
      titre: 'Suspendre le compte',
      message: `Êtes-vous sûr de vouloir suspendre le compte de ${utilisateur.prenom} ${utilisateur.nom} ?`,
      icon: '⚠️',
      color: '#ef4444',
      bg: '#fee2e2',
      showMotif: true
    }
  };
  
  const conf = config[action];
  
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-desactivation" onClick={(e) => e.stopPropagation()}>
        <div className="modal-desactivation-icon" style={{ background: conf.bg, color: conf.color }}>
          {conf.icon}
        </div>
        <h3 className="modal-desactivation-titre">{conf.titre}</h3>
        <p className="modal-desactivation-message">{conf.message}</p>
        
        {conf.showMotif && (
          <div className="modal-desactivation-motif">
            <label htmlFor="motif">Motif (optionnel) :</label>
            <textarea
              id="motif"
              className="champ-textearea"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Raison de la désactivation..."
              rows={3}
            />
          </div>
        )}
        
        <div className="modal-confirmation-actions">
          <button className="bouton-annuler" onClick={onClose}>
            Annuler
          </button>
          <button 
            className={`bouton-confirmer-${action === 'activer' ? 'success' : 'danger'}`}
            onClick={() => {
              onConfirm(motif);
              onClose();
            }}
          >
            {action === 'activer' ? 'Activer' : action === 'désactiver' ? 'Désactiver' : 'Suspendre'}
          </button>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="conteneur-gestion-parametres">
      {/* Afficher les toasts */}
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
            <span style={{ fontSize: '22px' }}>⚙️</span> 
              <h1>
                 Paramètres
              </h1>
            </div>
          </div>

          <div className="actions-fixes-eleves">
         <button 
          className={`onglet-parametre ${ongletActif === 'ecole' ? 'actif' : ''}`}
          onClick={() => setOngletActif('ecole')}
        >
          <span className="icone-onglet">🏫</span>
          École
        </button>
        <button 
          className={`onglet-parametre ${ongletActif === 'utilisateurs' ? 'actif' : ''}`}
          onClick={() => setOngletActif('utilisateurs')}
        >
          <span className="icone-onglet">👥</span>
          Utilisateurs & Rôles
        </button>
        <button 
          className={`onglet-parametre ${ongletActif === 'systeme' ? 'actif' : ''}`}
          onClick={() => setOngletActif('systeme')}
        >
          <span className="icone-onglet">⚙️</span>
          Système
        </button>
          </div>
        </div>
      </div>

      {/* Contenu des onglets */}
      <div className="contenu-parametres">
        {chargement && (
          <div className="chargement-parametres">
            <div className="spinner"></div>
            <p>Chargement des données...</p>
          </div>
        )}

        {/* Onglet École */}
        {!chargement && ongletActif === 'ecole' && (
          <div className="parametres-ecole">
            <div className="section-parametres">
              <h2 className="titre-section">Informations de l'établissement</h2>
              <div className="grille-parametres">
                <div className="groupe-champ-para">
                  <label className="label-champ-para">Nom de l'école</label>
                  <input
                    type="text"
                    className="champ-texte"
                    value={parametresEcole.nom_ecole}
                    onChange={(e) => setParametresEcole({...parametresEcole, nom_ecole: e.target.value})}
                    placeholder="Ex: Lycée Moderne d'Abidjan"
                  />
                </div>
                
                <div className="groupe-champ-para">
                  <label className="label-champ-para">Slogan</label>
                  <input
                    type="text"
                    className="champ-texte"
                    value={parametresEcole.slogan}
                    onChange={(e) => setParametresEcole({...parametresEcole, slogan: e.target.value})}
                    placeholder="Slogan de l'école"
                  />
                </div>
                
                <div className="groupe-champ-para">
                  <label className="label-champ-para">Téléphone</label>
                  <input
                    type="text"
                    className="champ-texte"
                    value={parametresEcole.telephone}
                    onChange={(e) => setParametresEcole({...parametresEcole, telephone: e.target.value})}
                    placeholder="+225 01 23 45 67 89"
                  />
                </div>
                
                <div className="groupe-champ-para">
                  <label className="label-champ-para">Email</label>
                  <input
                    type="email"
                    className="champ-texte"
                    value={parametresEcole.email}
                    onChange={(e) => setParametresEcole({...parametresEcole, email: e.target.value})}
                    placeholder="contact@ecole.ci"
                  />
                </div>
                
                <div className="groupe-champ-para">
                  <label className="label-champ-para">Adresse</label>
                  <input
                    type="text"
                    className="champ-texte"
                    value={parametresEcole.adresse}
                    onChange={(e) => setParametresEcole({...parametresEcole, adresse: e.target.value})}
                    placeholder="Adresse complète de l'école"
                  />
                </div>
                
                <div className="groupe-champ-para">
                  <label className="label-champ-para">Couleur principale</label>
                  <div className="selecteur-couleur">
                    <span className="valeur-couleur">{parametresEcole.couleur_principale}</span>
                    <input
                      type="color"
                      value={parametresEcole.couleur_principale}
                      onChange={(e) => setParametresEcole({...parametresEcole, couleur_principale: e.target.value})}
                    />
                  <button 
                  className="bouton-sauvegarder-tout" 
                  onClick={sauvegarderParametresEcole}
                  disabled={chargement}
                >
                  {chargement ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
                </button>
                </div>
                </div>
              </div>
              
              <div className="actions-section">
                
              </div>
            </div>

            {/* Section Années scolaires */}
            <div className="section-parametres">
              <div className="en-tete-section">
                <h2 className="titre-section-annee-scolaire">Années scolaires</h2>
                <div className="actions-section-header">
                  <button 
                    className="bouton-ajouter-tout"
                    onClick={() => setAfficherModalAnnee(true)}
                    disabled={chargement}
                  >
                    + Nouvelle année
                  </button>
                </div>
              </div>
              
              <div className="liste-annees">
               {anneesScolaires.length > 0 ? (
  anneesScolaires.map(annee => (
    <div key={annee.id} className={`carte-annee ${annee.est_active ? 'active' : ''} ${annee.est_cloturee ? 'cloturee' : ''}`}>
                      <div className="info-annee">
                        <span className="libelle-annee">{annee.libelle}</span>
                        <span className="dates-annee">
                          {new Date(annee.date_debut).toLocaleDateString('fr-FR')} - {new Date(annee.date_fin).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="actions-annee">
                        <button 
                          className="bouton-modifier-annee"
                          onClick={() => {
                            console.log('🖱️ CLIC MODIFIER - Année:', annee);
                            console.log('🆔 ID:', annee.id, 'Type:', typeof annee.id);
                            ouvrirModalModificationAnnee(annee);
                          }}
                          disabled={chargement}
                          title="Modifier"
                        >
                          ✏️
                        </button>
                        
                        {!annee.est_active && !annee.est_cloturee && (
                          <>
                            <button 
                              className="bouton-activer-annee"
                              onClick={() => activerAnneeScolaire(annee)}
                              disabled={chargement}
                              title="Activer"
                            >
                              ✔
                            </button>
                            <button 
                              className="bouton-supprimer-annee"
                              onClick={() => supprimerAnneeScolaire(annee)}
                              disabled={chargement}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="aucune-donnee">
                    <p>Aucune année scolaire trouvée</p>
                  </div>
                )}
              </div>
            </div>

            {/* Section Logo de l'école */}
          <div className="section-parametres">
            <h2 className="titre-section">Logo de l'école</h2>
            <div className="zone-logo">
              <div className="apercu-logo">
                {previewLogo ? (
                  <img 
                    src={previewLogo} 
                    alt="Aperçu logo" 
                    className="logo-preview"
                  />
                ) : parametresEcole.logo_url ? (
                  <img 
                    src={parametresEcole.logo_url} 
                    alt="Logo école" 
                    className="logo-actuel"
                  />
                ) : (
                  <div className="logo-placeholder">
                    <span className="placeholder-icone">🏫</span>
                    <span className="placeholder-texte">Aucun logo</span>
                  </div>
                )}
                
                {uploadChargement && (
                  <div className="overlay-chargement-logo">
                    <div className="spinner-petit"></div>
                    <span>Téléchargement...</span>
                  </div>
                )}
              </div>
              
              <div className="infos-logo">
                <p className="info-taille-logo">
                  Formats acceptés : JPEG, PNG, GIF, WebP (max 5MB)
                </p>
                <p className="info-taille-logo">
                  Dimensions recommandées : 200x200 pixels
                </p>
              </div>
              
              <div className="actions-logo">
                {/* Input file caché */}
                <input
                  type="file"
                  ref={inputFileRef}
                  onChange={gererChangementLogo}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="input-fichier-cache"
                  disabled={uploadChargement}
                />
                
                {/* Bouton de sélection */}
                <button 
                  className="bouton-changer-logo"
                  onClick={ouvrirSelecteurFichier}
                  disabled={uploadChargement}
                >
                  {uploadChargement ? '⏳ Téléchargement...' : '📷 Choisir un logo'}
                </button>
                
                {/* Bouton d'annulation (si preview) */}
                {previewLogo && (
                  <button 
                    className="bouton-annuler-logo"
                    onClick={annulerPreview}
                    disabled={uploadChargement}
                  >
                    ❌ Annuler
                  </button>
                )}
                
                {/* Bouton de suppression (seulement si logo existe et pas de preview) */}
                {parametresEcole.logo_url && !previewLogo && (
                  <button 
                    className="bouton-supprimer-logo"
                    onClick={supprimerLogo}
                    disabled={uploadChargement}
                  >
                    {uploadChargement ? '⏳ Suppression...' : '🗑️ Supprimer le logo'}
                  </button>
                )}
              </div>
            </div>
          </div>
          </div>
        )}

        {/* Onglet Utilisateurs & Rôles */}
        {!chargement && ongletActif === 'utilisateurs' && (
          <div className="parametres-utilisateurs">
            <div className="grille-utilisateurs-roles">

              {/* Colonne Employés */}
              <div className="colonne-employes">
                <div className="en-tete-colonne">
                  <h2 className="titre-colonne">
                    <span className="icone-colonne">👨‍🏫</span>
                    Employés de l'école
                  </h2>
                  <div className="actions-colonne">
                    <button 
                      className="bouton-rafraichir"
                      onClick={() => chargerEmployes()}
                      disabled={chargement}
                      title="Rafraîchir la liste"
                    >
                      🔄
                    </button>
                  </div>
                </div>
                
                <div className="liste-employes">
                  {employes.length > 0 ? (
                    employes.map(employe => (
                      <div key={employe.id} className="carte-employe">
                       <div className="avatar-employe-carte">
                          <div className="avatar-initiales">
                            {getInitiales(employe.nom, employe.prenom)}
                          </div>
                        </div>                        
                        <div className="info-employe-carte">
                          <div className="nom-employe-carte">
                            {employe.nom} {employe.prenom}
                          </div>
                          <div className="email-employe-carte">{employe.email}</div>
                          <div className="fonction-employe-carte">
                            <span className="badge-fonction">{employe.fonction || employe.type_enseignant}</span>
                            {employe.departement && (
                              <span className="badge-departement">{employe.departement}</span>
                            )}
                          </div>
                          <div className="meta-employe">
                            <span className="matricule">Mat: {employe.matricule}</span>
                            <span className={`statut-compte ${employe.user_statut}`}>
                              {employe.user_statut === 'actif' ? 'Compte actif' : 'Compte inactif'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Dans la carte employé, remplacer les boutons */}
                      <div className="actions-employe-carte">
                        <button 
                          className="bouton-action bouton-privileges" 
                          title="Gérer les privilèges"
                          onClick={() => ouvrirModalGestionPrivileges(employe)}
                          disabled={chargement}
                        >
                          🔑
                        </button>
                      </div>
                      </div>
                    ))
                  ) : (
                    <div className="aucune-donnee">
                      <p>Aucun employé trouvé</p>
                      <p className="sous-texte">Créez d'abord des employés dans la gestion du personnel</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne Rôles */}
              <div className="colonne-roles">
                <div className="en-tete-colonne">
                  <h2 className="titre-colonne">
                    <span className="icone-colonne">🔐</span>
                    Rôles & Permissions
                  </h2>
                  <button 
                    className="bouton-ajouter-role"
                    onClick={() => {
                      setRoleSelectionne(null);
                      setFormRole({ nom: '', description: '', niveau: 0, permissions: [] });
                      setAfficherModalRole(true);
                    }}
                    disabled={chargement}
                  >
                    + Nouveau rôle
                  </button>
                </div>
                
                <div className="liste-roles">
                  {roles.length > 0 ? (
                    roles.map(role => (
                      <div key={role.id} className="carte-role">
                        <div className="en-tete-carte-role">
                          <div>
                            <h3 className="nom-role">{role.nom}</h3>
                            <p className="description-role">{role.description}</p>
                          </div>
                          <span className="niveau-role">Niv. {role.niveau}</span>
                        </div>
                        <div className="permissions-role">
                          {role.permissions.slice(0, 3).map(perm => (
                            <span key={perm.id} className="badge-permission">{perm.nom}</span>
                          ))}
                          {role.permissions.length > 3 && (
                            <span className="badge-permission-plus">+{role.permissions.length - 3}</span>
                          )}
                        </div>
                      {/* Dans la carte rôle, remplacer les boutons d'action */}
                      <div className="actions-role">
                        <button 
                          className="bouton-modifier-role"
                          onClick={() => {
                            setRoleSelectionne(role);
                            setFormRole({
                              nom: role.nom,
                              description: role.description,
                              niveau: role.niveau,
                              permissions: role.permissions.map(p => p.id)
                            });
                            setAfficherModalRole(true);
                          }}
                          disabled={chargement}
                        >
                          ✏️ Modifier
                        </button>
                        <button 
                          className="bouton-dupliquer-role"
                          onClick={() => dupliquerRole(role)}
                          disabled={chargement}
                        >
                          📋 Dupliquer
                        </button>
                        <button 
                          className="bouton-supprimer-role"
                          onClick={() => supprimerRole(role)}  // ← ICI : passer l'objet role complet, pas role.id
                          disabled={chargement}
                        >
                          🗑️ Supprimer
                        </button>
                      </div>
                      </div>
                    ))
                  ) : (
                    <div className="aucune-donnee">
                      <p>Aucun rôle trouvé</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Système */}
{!chargement && ongletActif === 'systeme' && (
  <div className="parametres-systeme">
    {/* Configuration générale */}
    <div className="section-parametres">
      <h2 className="titre-section">Configuration générale</h2>
      
      <div className="grille-parametres">
        <div className="groupe-champ">
          <label className="label-champ">Devise par défaut</label>
          <div className="champ-avec-icone">
            <select 
              className="champ-select"
              value={parametresApp.devise}
              onChange={(e) => setParametresApp({...parametresApp, devise: e.target.value})}
            >
              <option value="XOF">Franc CFA (XOF)</option>
              <option value="XAF">Franc CFA (XAF)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar (USD)</option>
              <option value="GBP">Livre Sterling (GBP)</option>
              <option value="CHF">Franc Suisse (CHF)</option>
              <option value="CAD">Dollar Canadien (CAD)</option>
            </select>
            <span className="icone-champ">💰</span>
          </div>
        </div>
        
        <div className="groupe-champ">
          <label className="label-champ">Symbole de la devise
          <small> (Exemple : 1 000 {parametresApp.symbole_devise || 'F CFA'})</small></label>
          <div className="champ-avec-icone">
            <input
              type="text"
              className="champ-texte"
              value={parametresApp.symbole_devise}
              onChange={(e) => setParametresApp({...parametresApp, symbole_devise: e.target.value})}
              placeholder="F CFA"
            />
            <span className="icone-champ">💵</span>
          </div>
          
        </div>
        
        <div className="groupe-champ">
          <label className="label-champ">Format de date  
          <small>  (Aperçu : {new Date().toLocaleDateString('fr-FR', {
              day: '2-digit',
              month: '2-digit',
              year: parametresApp.format_date?.includes('yyyy') ? 'numeric' : '2-digit'
            }).replace(/\//g, parametresApp.format_date?.includes('.') ? '.' : '/')})
          </small></label>
          <div className="champ-avec-icone">
            <select 
              className="champ-select"
              value={parametresApp.format_date}
              onChange={(e) => setParametresApp({...parametresApp, format_date: e.target.value})}
            >
              <option value="dd/mm/yyyy">31/12/2024</option>
              <option value="mm/dd/yyyy">12/31/2024</option>
              <option value="yyyy-mm-dd">2024-12-31</option>
              <option value="dd.mm.yyyy">31.12.2024</option>
              <option value="dd/mm/yy">31/12/24</option>
            </select>
            <span className="icone-champ">📅</span>
          </div>
        </div>
        
        <div className="groupe-champ">
          <label className="label-champ">Fuseau horaire</label>
          <div className="champ-avec-icone">
            <select 
              className="champ-select"
              value={parametresApp.fuseau_horaire}
              onChange={(e) => setParametresApp({...parametresApp, fuseau_horaire: e.target.value})}
            >
              <optgroup label="Afrique de l'Ouest">
                <option value="Africa/Abidjan">Abidjan (GMT+0)</option>
                <option value="Africa/Dakar">Dakar (GMT+0)</option>
                <option value="Africa/Accra">Accra (GMT+0)</option>
                <option value="Africa/Lagos">Lagos (GMT+1)</option>
                <option value="Africa/Ouagadougou">Ouagadougou (GMT+0)</option>
              </optgroup>
              <optgroup label="Afrique Centrale">
                <option value="Africa/Douala">Douala (GMT+1)</option>
                <option value="Africa/Kinshasa">Kinshasa (GMT+1)</option>
                <option value="Africa/Libreville">Libreville (GMT+1)</option>
              </optgroup>
              <optgroup label="Afrique de l'Est">
                <option value="Africa/Nairobi">Nairobi (GMT+3)</option>
                <option value="Africa/Kampala">Kampala (GMT+3)</option>
                <option value="Africa/Dar_es_Salaam">Dar es Salaam (GMT+3)</option>
              </optgroup>
              <optgroup label="Europe">
                <option value="Europe/Paris">Paris (GMT+1)</option>
                <option value="Europe/London">Londres (GMT+0)</option>
                <option value="Europe/Brussels">Bruxelles (GMT+1)</option>
              </optgroup>
            </select>
            <span className="icone-champ">🌍</span>
          </div>
          <small className="aide-champ">
            Heure actuelle: {new Date().toLocaleTimeString('fr-FR', { timeZone: parametresApp.fuseau_horaire })}
          </small>
        </div>
        
        <div className="groupe-champ">
          <label className="label-champ">Langue par défaut</label>
          <div className="champ-avec-icone">
            <select 
              className="champ-select"
              value={parametresApp.langue_defaut}
              onChange={(e) => setParametresApp({...parametresApp, langue_defaut: e.target.value})}
            >
              <option value="fr">🇫🇷 Français</option>
              <option value="en">🇬🇧 English</option>
              <option value="es">🇪🇸 Español</option>
              <option value="pt">🇵🇹 Português</option>
            </select>
            <span className="icone-champ">🌐</span>
          </div>
        </div>
        
        <div className="groupe-champ">
          <label className="label-champ">Thème par défaut</label>
          <div className="selecteur-theme">
            <label className={`option-theme ${parametresApp.theme_defaut === 'clair' ? 'actif' : ''}`}>
              <input
                type="radio"
                name="theme"
                value="clair"
                checked={parametresApp.theme_defaut === 'clair'}
                onChange={(e) => setParametresApp({...parametresApp, theme_defaut: e.target.value})}
              />
              <span className="apercu-theme clair">
                <span className="couleur-claire"></span>
                <span className="couleur-foncee"></span>
              </span>
              <span>Clair</span>
            </label>
            
            <label className={`option-theme ${parametresApp.theme_defaut === 'sombre' ? 'actif' : ''}`}>
              <input
                type="radio"
                name="theme"
                value="sombre"
                checked={parametresApp.theme_defaut === 'sombre'}
                onChange={(e) => setParametresApp({...parametresApp, theme_defaut: e.target.value})}
              />
              <span className="apercu-theme sombre">
                <span className="couleur-foncee"></span>
                <span className="couleur-claire"></span>
              </span>
              <span>Sombre</span>
            </label>
          </div>
        </div>
      </div>
      
      <div className="actions-section">
        <button 
          className="bouton-sauvegarder-tout" 
          onClick={sauvegarderParametresApp}
          disabled={chargement}
        >
          {chargement ? (
            <>
              <span className="spinner-petit"></span>
              Sauvegarde en cours...
            </>
          ) : (
            <>
              <span className="icone-bouton">💾</span>
              Sauvegarder la configuration
            </>
          )}
        </button>
      </div>
    </div>

    {/* Sauvegarde & Maintenance */}
    <div className="section-parametres">
      <h2 className="titre-section">Sauvegarde & Maintenance</h2>
      
      <div className="grille-maintenance">
        <div className="carte-maintenance" onClick={() => setAfficherModalSauvegarde(true)}>
          <div className="icone-maintenance">💾</div>
          <div className="contenu-maintenance">
            <h3 className="titre-maintenance">Sauvegarde de la base de données</h3>
            <p className="description-maintenance">
              Créez une sauvegarde complète de toutes les données de l'application
            </p>
            <div className="stats-sauvegarde">
              <span className="stat-item">
                <span className="stat-valeur">{sauvegardes.length}</span>
                <span className="stat-label">sauvegardes</span>
              </span>
              <span className="stat-item">
                <span className="stat-valeur">
                  {sauvegardes.reduce((acc, s) => acc + (parseInt(s.taille) || 0), 0)}
                </span>
                <span className="stat-label">total</span>
              </span>
            </div>
                  <button 
        className="bouton-maintenance"
        onClick={(e) => {
          e.stopPropagation();
          lancerSauvegarde();
        }}
        disabled={sauvegardeEnCours}
      >
        {sauvegardeEnCours ? '⏳...' : '💾 Nouvelle'}
      </button>
          </div>
        </div>
        
        <div className="carte-maintenance" onClick={nettoyerDonnees}>
          <div className="icone-maintenance">📊</div>
          <div className="contenu-maintenance">
            <h3 className="titre-maintenance">Nettoyage des données</h3>
            <p className="description-maintenance">
              Supprimez les fichiers temporaires et optimisez la base de données
            </p>
            <ul className="liste-optimisations">
              <li>✓ Suppression des fichiers temporaires</li>
              <li>✓ Optimisation des tables</li>
              <li>✓ Nettoyage du cache</li>
            </ul>
            <button 
        className="bouton-maintenance"
        disabled={nettoyageEnCours}
      >
        {nettoyageEnCours ? '⏳...' : '🧹 Nettoyer'}
      </button>
          </div>
        </div>
      </div>
    </div>

    {/* Informations système */}
    <div className="section-parametres">
      <h2 className="titre-section">Informations système</h2>
      
      <div className="grille-info-systeme">
        <div className="carte-info-systeme">
          <div className="info-icone">🖥️</div>
          <div className="info-contenu">
            <div className="info-label">Version de l'application</div>
            <div className="info-valeur">2.1.0</div>
          </div>
        </div>
        
        <div className="carte-info-systeme">
          <div className="info-icone">🗄️</div>
          <div className="info-contenu">
            <div className="info-label">Base de données</div>
            <div className="info-valeur">MySQL 5.7+</div>
          </div>
        </div>
        
        <div className="carte-info-systeme">
          <div className="info-icone">📦</div>
          <div className="info-contenu">
            <div className="info-label">Dernière mise à jour</div>
            <div className="info-valeur">19 Février 2026</div>
          </div>
        </div>
        
        <div className="carte-info-systeme">
          <div className="info-icone">🔒</div>
          <div className="info-contenu">
            <div className="info-label">Espace disque</div>
            <div className="info-valeur">2.4 Go / 10 Go</div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      </div>

      {/* Modal Gestion des Privilèges */}
{afficherModalGestionPrivileges && (
  <div className="modal-overlay" onClick={() => setAfficherModalGestionPrivileges(false)}>
    <div className="modal-contenu modal-large" onClick={(e) => e.stopPropagation()}>
      <div className="modal-en-tete">
        <h2 className="modal-titre">
          Gérer les privilèges : {employeSelectionne?.prenom} {employeSelectionne?.nom}
        </h2>
        <button className="modal-fermer" onClick={() => setAfficherModalGestionPrivileges(false)}>
          ✕
        </button>
      </div>
      
      <div className="modal-corps">
        {/* Informations de l'employé */}
        <div className="infos-employe-modal">
          <div className="avatar-modal">
            {employeSelectionne?.avatar_url ? (
              <img src={employeSelectionne.avatar_url} alt="Avatar" />
            ) : (
              <div className="avatar-initiales-modal">
                {getInitiales(employeSelectionne?.nom || '', employeSelectionne?.prenom || '')}
              </div>
            )}
          </div>
          <div className="details-employe-modal">
            <div className="nom-employe-modal">
              {employeSelectionne?.prenom} {employeSelectionne?.nom}
            </div>
            <div className="email-employe-modal">{employeSelectionne?.email}</div>
            <div className="badges-employe-modal">
              <span className="badge-matricule">Mat: {employeSelectionne?.matricule}</span>
              <span className="badge-fonction-modal">{employeSelectionne?.fonction || employeSelectionne?.type_enseignant}</span>
            </div>
          </div>
        </div>

        {/* Statut du compte */}
        <div className="section-statut">
          <h3 className="titre-section-statut">Statut du compte</h3>
          <div className="selecteur-statut">
            <label className={`option-statut ${formUtilisateur.statut === 'actif' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="statut"
                value="actif"
                checked={formUtilisateur.statut === 'actif'}
                onChange={() => setFormUtilisateur({...formUtilisateur, statut: 'actif'})}
              />
              <span className="statut-indicateur actif">●</span>
              <span>Actif</span>
            </label>
            <label className={`option-statut ${formUtilisateur.statut === 'inactif' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="statut"
                value="inactif"
                checked={formUtilisateur.statut === 'inactif'}
                onChange={() => setFormUtilisateur({...formUtilisateur, statut: 'inactif'})}
              />
              <span className="statut-indicateur inactif">●</span>
              <span>Inactif</span>
            </label>
          </div>
          <p className="aide-statut">
            {formUtilisateur.statut === 'actif' 
              ? "L'utilisateur peut se connecter et accéder à l'application"
              : "L'utilisateur ne peut pas se connecter (compte désactivé)"}
          </p>
        </div>
        
        {/* Attribution des rôles */}
        <div className="section-roles">
          <h3 className="titre-section-roles">Rôles et permissions</h3>
          <p className="description-section-roles">
            Attribuez des rôles à cet employé pour définir ses accès dans l'application
          </p>
          
          <div className="grille-roles">
            {roles.map(role => (
              <label key={role.id} className={`checkbox-role ${formUtilisateur.roles.includes(role.id) ? 'selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={formUtilisateur.roles.includes(role.id)}
                  onChange={() => handleRoleToggle(role.id)}
                />
                <div className="info-checkbox-role">
                  <span className="nom-role-checkbox">{role.nom}</span>
                  <span className="description-role-checkbox">{role.description}</span>
                  <span className="niveau-role-checkbox">Niveau {role.niveau}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
      
      <div className="modal-pied">
        <button 
          className="bouton-annuler" 
          onClick={() => setAfficherModalGestionPrivileges(false)}
          disabled={chargement}
        >
          Annuler
        </button>
        <button 
          className="bouton-confirmer" 
          onClick={sauvegarderPrivilegesEmploye}
          disabled={chargement}
        >
          {chargement ? '⏳ Enregistrement...' : '💾 Enregistrer les privilèges'}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Modal Rôle */}
      {afficherModalRole && (
        <div className="modal-overlay" onClick={() => setAfficherModalRole(false)}>
          <div className="modal-contenu modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-en-tete">
              <h2 className="modal-titre">
                {roleSelectionne ? 'Modifier' : 'Créer'} un rôle
              </h2>
              <button className="modal-fermer" onClick={() => setAfficherModalRole(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-corps">
              <div className="grille-formulaire">
                <div className="groupe-champ">
                  <label className="label-champ">Nom du rôle *</label>
                  <input
                    type="text"
                    className="champ-texte"
                    value={formRole.nom}
                    onChange={(e) => setFormRole({...formRole, nom: e.target.value})}
                    placeholder="Ex: Chef de département"
                  />
                </div>
                
                <div className="groupe-champ">
                  <label className="label-champ">Description</label>
                  <textarea
                    className="champ-textearea"
                    value={formRole.description}
                    onChange={(e) => setFormRole({...formRole, description: e.target.value})}
                    placeholder="Description du rôle"
                    rows={2}
                  />
                </div>
                
                <div className="groupe-champ">
                  <label className="label-champ">Niveau (1-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className="champ-texte"
                    value={formRole.niveau}
                    onChange={(e) => setFormRole({...formRole, niveau: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              {/* Dans le modal des rôles, ajouter cette section avant la grille des permissions */}
<div className="section-permissions">
  <div className="en-tete-permissions">
    <h3 className="titre-section-permissions">Permissions</h3>
    <div className="actions-globales-permissions">
      <button 
        className="bouton-tout-selectionner"
        onClick={() => {
          const toutesPermissions = permissions.map(p => p.id);
          setFormRole({...formRole, permissions: toutesPermissions});
        }}
        disabled={chargement}
        title="Tout sélectionner"
      >
        ✓ Tout sélectionner
      </button>
      <button 
        className="bouton-tout-deselectionner"
        onClick={() => setFormRole({...formRole, permissions: []})}
        disabled={chargement}
        title="Tout désélectionner"
      >
        ✗ Tout désélectionner
      </button>
    </div>
  </div>
  
  <div className="grille-permissions">
    {Object.entries(permissionsParModule).map(([module, perms]) => (
      <div key={module} className="groupe-permissions">
        <div className="en-tete-module-permissions">
          <h4 className="titre-module-permissions">
            {module.charAt(0).toUpperCase() + module.slice(1)}
          </h4>
          <div className="actions-module-permissions">
            <label className="checkbox-module">
              <input
                type="checkbox"
                checked={toutesPermissionsModuleSelectionnees(module)}
                ref={input => {
                  if (input) {
                    input.indeterminate = certainesPermissionsModuleSelectionnees(module);
                  }
                }}
                onChange={(e) => toggleToutesPermissionsModule(module, e.target.checked)}
              />
              <span>Sélectionner tout</span>
            </label>
          </div>
        </div>
        <div className="liste-permissions">
          {perms.map(perm => (
            <label key={perm.id} className="checkbox-permission">
              <input
                type="checkbox"
                checked={formRole.permissions.includes(perm.id)}
                onChange={() => handlePermissionToggle(perm.id)}
              />
              <div className="info-checkbox-permission">
                <span className="nom-permission">{perm.nom}</span>
                <span className="description-permission">{perm.description}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    ))}
  </div>
</div>
            </div>
            
            <div className="modal-pied">
              <button className="bouton-annuler" onClick={() => setAfficherModalRole(false)}>
                Annuler
              </button>
              <button className="bouton-confirmer" onClick={sauvegarderRole} disabled={chargement}>
                {chargement ? 'Sauvegarde...' : (roleSelectionne ? 'Mettre à jour' : 'Créer')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouvelle Année Scolaire */}
      {afficherModalAnnee && (
        <div className="modal-overlay" onClick={() => setAfficherModalAnnee(false)}>
          <div className="modal-contenu" onClick={(e) => e.stopPropagation()}>
            <div className="modal-en-tete">
              <h2 className="modal-titre">Nouvelle année scolaire</h2>
              <button className="modal-fermer" onClick={() => setAfficherModalAnnee(false)}>
                ✕
              </button>
            </div>
            
            <div className="modal-corps">
              <div className="groupe-champ-para">
                <label className="label-champ-annee">Libellé *</label>
                <input
                  type="text"
                  className="champ-texte"
                  value={nouvelleAnnee.libelle}
                  onChange={(e) => setNouvelleAnnee({...nouvelleAnnee, libelle: e.target.value})}
                  placeholder="Ex: 2024-2025"
                />
              </div>
              
              <div className="groupe-champ-para">
                <label className="label-champ-annee">Date de début *</label>
                <input
                  type="date"
                  className="champ-texte"
                  value={nouvelleAnnee.date_debut}
                  onChange={(e) => setNouvelleAnnee({...nouvelleAnnee, date_debut: e.target.value})}
                />
              </div>
              
              <div className="groupe-champ-para">
                <label className="label-champ-annee">Date de fin *</label>
                <input
                  type="date"
                  className="champ-texte"
                  value={nouvelleAnnee.date_fin}
                  onChange={(e) => setNouvelleAnnee({...nouvelleAnnee, date_fin: e.target.value})}
                />
              </div>
              
              <label className="checkbox-activer">
                <input
                  type="checkbox"
                  checked={nouvelleAnnee.est_active}
                  onChange={(e) => setNouvelleAnnee({...nouvelleAnnee, est_active: e.target.checked})}
                />
                Définir comme année active
              </label>
            </div>
            
            <div className="modal-pied">
              <button className="bouton-annuler" onClick={() => setAfficherModalAnnee(false)}>
                Annuler
              </button>
              <button className="bouton-confirmer" onClick={creerAnneeScolaire} disabled={chargement}>
                {chargement ? 'Création...' : 'Créer l\'année scolaire'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modification Année Scolaire */}
{afficherModalModificationAnnee && (
  <div className="modal-overlay" onClick={() => setAfficherModalModificationAnnee(false)}>
    <div className="modal-contenu" onClick={(e) => e.stopPropagation()}>
      <div className="modal-en-tete">
        <h2 className="modal-titre">Modifier l'année scolaire</h2>
        <button className="modal-fermer" onClick={() => setAfficherModalModificationAnnee(false)}>
          ✕
        </button>
      </div>
      
      <div className="modal-corps">
        <div className="groupe-champ-para">
          <label className="label-champ-annee">Libellé *</label>
          <input
            type="text"
            className="champ-texte"
            value={formModificationAnnee.libelle}
            onChange={(e) => setFormModificationAnnee({...formModificationAnnee, libelle: e.target.value})}
            placeholder="Ex: 2024-2025"
          />
        </div>
        
        <div className="groupe-champ-para">
          <label className="label-champ-annee">Date de début *</label>
          <input
            type="date"
            className="champ-texte"
            value={formModificationAnnee.date_debut}
            onChange={(e) => setFormModificationAnnee({...formModificationAnnee, date_debut: e.target.value})}
          />
        </div>
        
        <div className="groupe-champ-para">
          <label className="label-champ-annee">Date de fin *</label>
          <input
            type="date"
            className="champ-texte"
            value={formModificationAnnee.date_fin}
            onChange={(e) => setFormModificationAnnee({...formModificationAnnee, date_fin: e.target.value})}
          />
        </div>
        
        <label className="checkbox-activer">
          <input
            type="checkbox"
            checked={formModificationAnnee.est_active}
            onChange={(e) => setFormModificationAnnee({...formModificationAnnee, est_active: e.target.checked})}
          />
          Définir comme année active
        </label>
      </div>
      
      <div className="modal-pied">
        <button 
          className="bouton-annuler" 
          onClick={() => setAfficherModalModificationAnnee(false)}
          disabled={chargement}
        >
          Annuler
        </button>
        <button 
          className="bouton-confirmer"
          onClick={modifierAnneeScolaire}
          disabled={chargement}
        >
          {chargement ? '⏳ Modification...' : '💾 Enregistrer les modifications'}
        </button>
      </div>
    </div>
  </div>
)}

{/* Modale de confirmation personnalisée */}
{modalConfirmation && (
  <ModalConfirmation
    isOpen={modalConfirmation.isOpen}
    onClose={() => setModalConfirmation(null)}
    onConfirm={modalConfirmation.onConfirm}
    titre={modalConfirmation.titre}
    message={modalConfirmation.message}
    type={modalConfirmation.type}
    itemNom={modalConfirmation.itemNom}
  />
)}

{/* Modal Journaux d'activité */}
{afficherModalLogs && (
  <div className="modal-overlay" onClick={() => setAfficherModalLogs(false)}>
    <div className="modal-contenu modal-tres-large" onClick={(e) => e.stopPropagation()}>
      <div className="modal-en-tete">
        <h2 className="modal-titre">
          <span className="icone-titre">📋</span>
          Journaux d'activité
        </h2>
        <button className="modal-fermer" onClick={() => setAfficherModalLogs(false)}>
          ✕
        </button>
      </div>
      
      <div className="modal-corps">
        {/* Filtres */}
        <div className="filtres-logs">
          <div className="groupe-filtres">
            <select 
              className="filtre-select"
              value={filtreLogs}
              onChange={(e) => setFiltreLogs(e.target.value)}
            >
              <option value="tout">Tous les types</option>
              <option value="connexion">Connexions</option>
              <option value="creation">Créations</option>
              <option value="modification">Modifications</option>
              <option value="suppression">Suppressions</option>
              <option value="export">Exports</option>
            </select>
            
            <input
              type="date"
              className="filtre-date"
              value={dateDebutLogs}
              onChange={(e) => setDateDebutLogs(e.target.value)}
              placeholder="Date début"
            />
            
            <input
              type="date"
              className="filtre-date"
              value={dateFinLogs}
              onChange={(e) => setDateFinLogs(e.target.value)}
              placeholder="Date fin"
            />
            
            <button 
              className="bouton-reinitialiser"
              onClick={() => {
                setFiltreLogs('tout');
                setDateDebutLogs('');
                setDateFinLogs('');
              }}
            >
              ↺ Réinitialiser
            </button>
          </div>
        </div>
        
        {/* Tableau des logs */}
        <div className="tableau-logs">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Utilisateur</th>
                <th>Action</th>
                <th>Détails</th>
                <th>Adresse IP</th>
              </tr>
            </thead>
            <tbody>
              {logsActivite.length > 0 ? (
                logsActivite.map(log => (
                  <tr key={log.id}>
                    <td className="date-log">
                      {new Date(log.created_at).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="utilisateur-log">
                      <div className="avatar-log">
                        {log.user_prenom?.[0]}{log.user_nom?.[0]}
                      </div>
                      <span>{log.user_prenom} {log.user_nom}</span>
                    </td>
                    <td>
                      <span className={`badge-action ${log.action}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="details-log">{log.details}</td>
                    <td className="ip-log">{log.ip_address || 'N/A'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="aucun-log">
                    <div className="message-aucun-log">
                      <span className="icone-aucun">📭</span>
                      <p>Aucun journal d'activité trouvé</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="modal-pied">
        <div className="info-logs">
          Total: <strong>{logsActivite.length}</strong> entrées
        </div>
        <button 
          className="bouton-exporter"
          onClick={() => window.open('/api/parametres/logs/export', '_blank')}
        >
          📤 Exporter en CSV
        </button>
        <button 
          className="bouton-fermer"
          onClick={() => setAfficherModalLogs(false)}
        >
          Fermer
        </button>
      </div>
    </div>
  </div>
)}

{/* Modal Sauvegardes */}
{afficherModalSauvegarde && (
  <div className="modal-overlay" onClick={() => setAfficherModalSauvegarde(false)}>
    <div className="modal-contenu" onClick={(e) => e.stopPropagation()}>
      <div className="modal-en-tete">
        <h2 className="modal-titre">Gestion des sauvegardes</h2>
        <button className="modal-fermer" onClick={() => setAfficherModalSauvegarde(false)}>✕</button>
      </div>
      
      <div className="modal-corps">
        <button 
          className="bouton-sauvegarde-principal"
          onClick={lancerSauvegarde}
          disabled={sauvegardeEnCours}
        >
          {sauvegardeEnCours ? '⏳ Création...' : '➕ Nouvelle sauvegarde'}
        </button>
        
        {/* Dans le modal des sauvegardes */}
<div className="liste-sauvegardes">
  <h3 className="titre-liste">Sauvegardes disponibles</h3>
  
  {sauvegardes.length > 0 ? (
    <div className="grille-sauvegardes">
      {sauvegardes.map(sauvegarde => (
        <div key={sauvegarde.id} className="carte-sauvegarde">
          <div className="icone-sauvegarde">
            {sauvegarde.type === 'automatique' ? '🤖' : '👤'}
          </div>
          <div className="info-sauvegarde">
            <div className="nom-sauvegarde" title={sauvegarde.nom_fichier}>
              {sauvegarde.nom_fichier.length > 30 
                ? sauvegarde.nom_fichier.substring(0, 27) + '...' 
                : sauvegarde.nom_fichier}
            </div>
            <div className="meta-sauvegarde">
              <span className="date-sauvegarde">
                {new Date(sauvegarde.date_creation).toLocaleString('fr-FR')}
              </span>
              <span className="taille-sauvegarde">{sauvegarde.taille}</span>
              <span className={`type-sauvegarde ${sauvegarde.type}`}>
                {sauvegarde.type === 'automatique' ? 'Auto' : 'Manuelle'}
              </span>
            </div>
          </div>
          <div className="actions-sauvegarde-carte">
            <button 
              className="bouton-supprimer-sauvegarde"
              onClick={() => supprimerSauvegarde(sauvegarde.id, sauvegarde.nom_fichier)}
              title="Supprimer"
              disabled={chargement}
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="aucune-sauvegarde">
      <p>Aucune sauvegarde trouvée</p>
      <small>Cliquez sur "Nouvelle sauvegarde" pour créer votre première sauvegarde</small>
    </div>
  )}
</div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}