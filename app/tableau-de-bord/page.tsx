'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '../services/authService';
import GestionEleves from '../components/GestionEleves';
import GestionClasses from '../components/GestionClasses';
import GestionEnseignants from '../components/GestionPersonnel';
import GestionFinance from '../components/GestionFinance';
import './tableau-de-bord.css';
import GestionCours from '../components/GestionCours';
import GestionEmploiDuTemps from '../components/GestionEmploiDuTemps';
import GestionNotesPrimaire from '../components/GestionNotesPrimaire'; 
import GestionAbsences from '../components/GestionAbsences';
import DashboardIntelligentAcc from '../components/DashboardIntelligentAcc';
import GestionParametres from '../components/GestionParametres';

interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  avatar_url?: string;
}

interface UserRole {
  id: number;
  role_id: number;
  user_id: number;
  role_nom: string;
  role_description?: string;
  role_niveau: number;
}

interface Permission {
  id: number;
  nom: string;
  code: string;
  module: string;
  description?: string;
}

interface EmployeInfo {
  id: number;
  user_id: number;
  matricule: string;
  telephone?: string;
  fonction?: string;
  departement?: string;
  type_enseignant: string;
  avatar_url?: string; 
}

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

export default function TableauDeBord() {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [parametresEcole, setParametresEcole] = useState<ParametresEcole | null>(null);
  const [chargement, setChargement] = useState(true);
  const [menuActif, setMenuActif] = useState('tableau-de-bord');
  const [menuProfilOuvert, setMenuProfilOuvert] = useState(false);
  const [profilOuvert, setProfilOuvert] = useState(false);
  const [alerteSucces, setAlerteSucces] = useState('');
  const [donneesProfil, setDonneesProfil] = useState({
    nom: '',
    prenom: '',
    email: '',
    role: ''
  });
  const [donneesMotDePasse, setDonneesMotDePasse] = useState({
    motDePasseActuel: '',
    nouveauMotDePasse: '',
    confirmerMotDePasse: ''
  });
  const [ongletActif, setOngletActif] = useState('informations');
  const [afficherMotDePasseActuel, setAfficherMotDePasseActuel] = useState(false);
  const [afficherNouveauMotDePasse, setAfficherNouveauMotDePasse] = useState(false);
  const [afficherConfirmerMotDePasse, setAfficherConfirmerMotDePasse] = useState(false);
  const [chargementPhoto, setChargementPhoto] = useState(false);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const menuProfilRef = useRef<HTMLDivElement>(null);
  
  // États pour la navigation entre les modules
  const [afficherGestionEleves, setAfficherGestionEleves] = useState(false);
  const [afficherGestionClasses, setAfficherGestionClasses] = useState(false);
  const [afficherGestionEnseignants, setAfficherGestionEnseignants] = useState(false);
  const [afficherGestionCours, setAfficherGestionCours] = useState(false);
  const [afficherGestionEmploiDuTemps, setAfficherGestionEmploiDuTemps] = useState(false);
  const [afficherGestionNotes, setAfficherGestionNotes] = useState(false);
  const [afficherGestionNotesPrimaire, setAfficherGestionNotesPrimaire] = useState(false);
  const [afficherGestionAbsences, setAfficherGestionAbsences] = useState(false);
  const [afficherGestionFinance, setAfficherGestionFinance] = useState(false);
  const [afficherGestionParametres, setAfficherGestionParametres] = useState(false);
  const [employeInfo, setEmployeInfo] = useState<EmployeInfo | null>(null);
  const [parametresApp, setParametresApp] = useState<ParametresApp>({
    id: 1,
    devise: 'XOF',
    symbole_devise: 'F CFA',
    format_date: 'dd/mm/yyyy',
    fuseau_horaire: 'Africa/Abidjan',
    langue_defaut: 'fr',
    theme_defaut: 'clair'
  });

  const router = useRouter();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [permissions, setPermissions] = useState<string[]>([]);

  // Dans tableau-de-bord.tsx, ajouter dans le useEffect après les autres useEffect
useEffect(() => {
  const handleLogoUpdate = (event: CustomEvent) => {
    console.log('🔄 Logo mis à jour:', event.detail);
    // Forcer le rechargement des paramètres
    chargerParametresEcole();
  };

  window.addEventListener('logo-updated', handleLogoUpdate as EventListener);
  
  return () => {
    window.removeEventListener('logo-updated', handleLogoUpdate as EventListener);
  };
}, []);

// Dans la partie JSX, pour l'affichage du logo en-tête :
{parametresEcole?.logo_url ? (
  <img 
    src={`${parametresEcole.logo_url}?t=${new Date().getTime()}`} 
    alt="Logo école" 
    className="logo-ecole-image"
    onError={(e) => {
      console.error('❌ Erreur chargement logo:', e);
      e.currentTarget.style.display = 'none';
    }}
    onLoad={() => console.log('✅ Logo chargé avec succès')}
  />
) : (
  <div className="logo-ecole-placeholder"></div>
)}

useEffect(() => {
  // Écouter les changements de thème
  const handleThemeChange = (event: CustomEvent) => {
    const { theme } = event.detail;
    console.log('🎨 Changement de thème détecté:', theme);
    appliquerTheme(theme);
    
    // Mettre à jour l'état local
    setParametresApp(prev => ({ ...prev, theme_defaut: theme }));
  };

  window.addEventListener('theme-change', handleThemeChange as EventListener);
  
  return () => {
    window.removeEventListener('theme-change', handleThemeChange as EventListener);
  };
}, []);

  useEffect(() => {
    verifierAuthentification();
    chargerParametresEcole();
    chargerParametresApp();
    
    const gererClicExterieur = (event: MouseEvent) => {
      if (menuProfilRef.current && !menuProfilRef.current.contains(event.target as Node)) {
        setMenuProfilOuvert(false);
      }
    };
    document.addEventListener('mousedown', gererClicExterieur);
    return () => {
      document.removeEventListener('mousedown', gererClicExterieur);
    };
  }, []);

  useEffect(() => {
    if (alerteSucces) {
      const timer = setTimeout(() => {
        setAlerteSucces('');
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [alerteSucces]);

  // Charger les informations de l'employé quand l'utilisateur est disponible
useEffect(() => {
  if (utilisateur) {
    console.log('🔄 Utilisateur chargé, chargement des données...');
    chargerEmployeInfo();
    chargerRolesUtilisateur();
    chargerPermissionsUtilisateur(); // Ajoutez cette ligne
    
    // Appliquer le thème au chargement
    const themeSauvegarde = localStorage.getItem('theme') as 'clair' | 'sombre' | 'auto';
    if (themeSauvegarde) {
      setParametresApp(prev => ({ ...prev, theme_defaut: themeSauvegarde }));
      appliquerTheme(themeSauvegarde);
    }
  }
}, [utilisateur]);

// Dans TableauDeBord, ajoutez cet useEffect après les autres useEffect

useEffect(() => {
  // Écouter les événements de navigation du dashboard
  const handleDashboardNavigation = (event: CustomEvent) => {
    const { page } = event.detail;
    console.log('Navigation reçue du dashboard:', page);
    
    // Appeler la fonction de navigation appropriée
    switch(page) {
      case 'eleves':
        ouvrirGestionEleves();
        break;
      case 'classes':
        ouvrirGestionClasses();
        break;
      case 'personnel':
        ouvrirGestionPersonnel();
        break;
      case 'cours':
        ouvrirGestionCours();
        break;
      case 'emploi':
        ouvrirGestionEmploiDuTemps();
        break;
      case 'notes':
        ouvrirGestionNotesPrimaire();
        break;
      case 'absences':
        ouvrirGestionAbsences();
        break;
      default:
        console.log('Page non reconnue:', page);
    }
  };

  window.addEventListener('dashboard-navigation', handleDashboardNavigation as EventListener);
  
  return () => {
    window.removeEventListener('dashboard-navigation', handleDashboardNavigation as EventListener);
  };
}, []); // Les dépendances vides car les fonctions sont stables

  // Fonction pour charger les paramètres de l'école
  const chargerParametresEcole = async () => {
    try {
      const resultat = await AuthService.obtenirParametresEcole();
      if (resultat.success && resultat.parametres) {
        setParametresEcole(resultat.parametres);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres école:', error);
    }
  };

  // Fonction pour charger les paramètres de l'application
  const chargerParametresApp = async () => {
    try {
      const response = await fetch('/api/parametres/application');
      const data = await response.json();
      if (data.success && data.parametres) {
        setParametresApp(data.parametres);
        appliquerTheme(data.parametres.theme_defaut);
      }
    } catch (error) {
      console.error('Erreur chargement paramètres app:', error);
    }
  };

const chargerRolesUtilisateur = async () => {
  try {
    if (!utilisateur) {
      console.log('⚠️ Pas d\'utilisateur connecté');
      return;
    }
    
    console.log('🔍 Chargement des rôles pour user:', {
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom
    });
    
    const url = `/api/utilisateurs/${utilisateur.id}/roles`;
    console.log('📡 URL appelée:', url);
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('📥 Statut réponse:', response.status, response.statusText);
    
    if (!response.ok) {
      console.error('❌ Erreur HTTP:', response.status, response.statusText);
      
      // Essayer de lire le message d'erreur
      try {
        const errorData = await response.json();
        console.error('❌ Détails erreur:', errorData);
      } catch (e) {
        console.error('❌ Impossible de lire les détails de l\'erreur');
        
        // Essayer de lire comme texte
        try {
          const textError = await response.text();
          console.error('❌ Réponse texte:', textError);
        } catch (e2) {
          console.error('❌ Impossible de lire la réponse');
        }
      }
      
      return;
    }
    
    const data = await response.json();
    console.log('📥 Données rôles reçues:', data);
    
    if (data.success && Array.isArray(data.roles)) {
      setUserRoles(data.roles);
      console.log('✅ Rôles mis à jour:', data.roles.length, 'rôle(s) trouvé(s)');
      
      if (data.roles.length === 0) {
        console.log('ℹ️ Aucun rôle trouvé pour cet utilisateur');
      } else {
        // Afficher les rôles trouvés
        data.roles.forEach((role: any, index: number) => {
          console.log(`   Rôle ${index + 1}:`, role.role_nom, '(niveau:', role.role_niveau, ')');
        });
      }
    } else {
      console.error('❌ Données invalides:', data);
      setUserRoles([]);
    }
  } catch (error) {
    console.error('❌ Erreur chargement rôles:', error);
    if (error instanceof Error) {
      console.error('❌ Message:', error.message);
      console.error('❌ Stack:', error.stack);
    }
    setUserRoles([]);
  }
};

// Ajoutez cette fonction après chargerRolesUtilisateur
const chargerPermissionsUtilisateur = async () => {
  try {
    if (!utilisateur) {
      console.log('⚠️ Pas d\'utilisateur connecté');
      return;
    }
    
    console.log('🔍 Chargement des permissions pour user:', utilisateur.id);
    
    const response = await fetch(`/api/utilisateurs/${utilisateur.id}/permissions`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error('❌ Erreur HTTP:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📥 Données permissions reçues:', data);
    
    if (data.success && Array.isArray(data.permissions)) {
      // On extrait uniquement les codes de permission
      const permissionCodes = data.permissions.map((p: Permission) => p.code);
      setPermissions(permissionCodes);
      console.log('✅ Permissions mises à jour:', permissionCodes);
    } else {
      console.error('❌ Données invalides:', data);
      setPermissions([]);
    }
  } catch (error) {
    console.error('❌ Erreur chargement permissions:', error);
    setPermissions([]);
  }
};

// Ajoutez cette fonction helper
const aPermission = (permissionCode: string): boolean => {
  // Le tableau de bord est toujours accessible
  if (permissionCode === 'dashboard.view') return true;
  
  return permissions.includes(permissionCode);
};

// fonction helper
const formaterRoles = (roles: UserRole[]): string => {
  if (!roles || roles.length === 0) {
    return 'Aucun rôle';
  }
  
  // Si plusieurs rôles, les afficher séparés par des virgules
  return roles.map(role => role.role_nom).join(', ');
};

// Ou si vous voulez afficher uniquement le rôle principal (le plus élevé)
const formaterRolePrincipal = (roles: UserRole[]): string => {
  if (!roles || roles.length === 0) {
    return 'Utilisateur';
  }
  
  // Trier par niveau et prendre le plus élevé
  const rolePrincipal = [...roles].sort((a, b) => b.role_niveau - a.role_niveau)[0];
  return rolePrincipal.role_nom;
};

  // Fonction pour appliquer le thème
const appliquerTheme = (theme: string) => {
  const root = document.documentElement;
  
  // Ajouter une classe de transition temporaire
  document.body.classList.add('theme-transition');
  
  if (theme === 'auto') {
    const heures = new Date().getHours();
    const estNuit = heures < 6 || heures > 19;
    if (estNuit) {
      root.classList.add('theme-sombre');
    } else {
      root.classList.remove('theme-sombre');
    }
    
    // Mettre à jour toutes les 30 minutes
    setInterval(() => {
      const heuresActuelles = new Date().getHours();
      const estNuitActuelle = heuresActuelles < 6 || heuresActuelles > 19;
      if (estNuitActuelle) {
        root.classList.add('theme-sombre');
      } else {
        root.classList.remove('theme-sombre');
      }
    }, 1800000);
    
  } else if (theme === 'sombre') {
    root.classList.add('theme-sombre');
  } else {
    root.classList.remove('theme-sombre');
  }
  
  // Retirer la classe de transition après l'animation
  setTimeout(() => {
    document.body.classList.remove('theme-transition');
  }, 300);
};

  // Fonction pour charger les informations de l'employé
  const chargerEmployeInfo = async () => {
    try {
      if (!utilisateur) return;
      
      const response = await fetch(`/api/employes/user/${utilisateur.id}`);
      const data = await response.json();
      if (data.success && data.employe) {
        const employe = data.employe as EmployeInfo;
        
        // Priorité à l'avatar de l'employé, sinon utiliser celui de l'utilisateur
        if (!employe.avatar_url && utilisateur.avatar_url) {
          employe.avatar_url = utilisateur.avatar_url;
        }
        
        setEmployeInfo(employe);
      }
    } catch (error) {
      console.error('Erreur chargement employé:', error);
    }
  };

  // Fonction pour formater une date
  const formaterDate = (date: Date | string): string => {
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

  // Fonction pour formater un montant
  const formaterMontant = (montant: number): string => {
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

  // Fonction pour vérifier l'authentification
  const verifierAuthentification = () => {
    const estConnecte = localStorage.getItem('estConnecte');
    const donneesUtilisateur = localStorage.getItem('utilisateur');
    
    if (!estConnecte || !donneesUtilisateur) {
      router.push('/connexion');
      return;
    }
    
    try {
      const userData = JSON.parse(donneesUtilisateur) as Utilisateur;
      setUtilisateur(userData);
      setDonneesProfil({
        nom: userData.nom,
        prenom: userData.prenom,
        email: userData.email,
        role: userData.role
      });
      setChargement(false);
    } catch (error) {
      console.error('Erreur parsing utilisateur:', error);
      router.push('/connexion');
    }
  };

  // Fonctions de navigation
  const ouvrirGestionEleves = () => {
    setAfficherGestionEleves(true);
    setAfficherGestionClasses(false);
    setAfficherGestionEnseignants(false);
    setAfficherGestionFinance(false);
    setAfficherGestionCours(false);
    setAfficherGestionEmploiDuTemps(false);
    setAfficherGestionNotes(false);
    setAfficherGestionNotesPrimaire(false);
    setAfficherGestionAbsences(false);
    setAfficherGestionParametres(false);
    setMenuActif('eleves');
  };

  const ouvrirGestionClasses = () => {
    setAfficherGestionClasses(true);
    setAfficherGestionEleves(false);
    setAfficherGestionEnseignants(false);
    setAfficherGestionFinance(false);
    setAfficherGestionCours(false);
    setAfficherGestionEmploiDuTemps(false);
    setAfficherGestionNotes(false);
    setAfficherGestionNotesPrimaire(false);
    setAfficherGestionAbsences(false);
    setAfficherGestionParametres(false);
    setMenuActif('classes');
  };

  const ouvrirGestionPersonnel = () => {
    setAfficherGestionEnseignants(true);
    setAfficherGestionEleves(false);
    setAfficherGestionClasses(false);
    setAfficherGestionFinance(false);
    setAfficherGestionCours(false);
    setAfficherGestionEmploiDuTemps(false);
    setAfficherGestionNotes(false);
    setAfficherGestionNotesPrimaire(false);
    setAfficherGestionAbsences(false);
    setAfficherGestionParametres(false);
    setMenuActif('personnel');
  };

  const ouvrirGestionCours = () => {
    setAfficherGestionCours(true);
    setAfficherGestionEleves(false);
    setAfficherGestionClasses(false);
    setAfficherGestionEnseignants(false);
    setAfficherGestionFinance(false);
    setAfficherGestionEmploiDuTemps(false);
    setAfficherGestionNotes(false);
    setAfficherGestionNotesPrimaire(false);
    setAfficherGestionAbsences(false);
    setAfficherGestionParametres(false);
    setMenuActif('cours');
  };

  const ouvrirGestionEmploiDuTemps = () => {
    setAfficherGestionEmploiDuTemps(true);
    setAfficherGestionEleves(false);
    setAfficherGestionClasses(false);
    setAfficherGestionEnseignants(false);
    setAfficherGestionFinance(false);
    setAfficherGestionCours(false);
    setAfficherGestionNotes(false);
    setAfficherGestionNotesPrimaire(false);
    setAfficherGestionAbsences(false);
    setAfficherGestionParametres(false);
    setMenuActif('emploi-du-temps');
  };

  const ouvrirGestionNotesPrimaire = () => {
    setAfficherGestionNotesPrimaire(true);
    setAfficherGestionNotes(false);
    setAfficherGestionEleves(false);
    setAfficherGestionClasses(false);
    setAfficherGestionEnseignants(false);
    setAfficherGestionFinance(false);
    setAfficherGestionCours(false);
    setAfficherGestionEmploiDuTemps(false);
    setAfficherGestionAbsences(false);
    setAfficherGestionParametres(false);
    setMenuActif('notes');
  };

  const ouvrirGestionNotesCollege = () => {
    setAfficherGestionNotes(true);
    setAfficherGestionNotesPrimaire(false);
    setAfficherGestionEleves(false);
    setAfficherGestionClasses(false);
    setAfficherGestionEnseignants(false);
    setAfficherGestionFinance(false);
    setAfficherGestionCours(false);
    setAfficherGestionEmploiDuTemps(false);
    setAfficherGestionAbsences(false);
    setAfficherGestionParametres(false);
    setMenuActif('notes-college');
  };

  const ouvrirGestionFinance = () => {
    setAfficherGestionFinance(true);
    setAfficherGestionEleves(false);
    setAfficherGestionClasses(false);
    setAfficherGestionEnseignants(false);
    setAfficherGestionCours(false);
    setAfficherGestionEmploiDuTemps(false);
    setAfficherGestionNotes(false);
    setAfficherGestionNotesPrimaire(false);
    setAfficherGestionAbsences(false);
    setAfficherGestionParametres(false);
    setMenuActif('finance');
  };

  const ouvrirGestionAbsences = () => {
    setAfficherGestionAbsences(true);
    setAfficherGestionEleves(false);
    setAfficherGestionClasses(false);
    setAfficherGestionEnseignants(false);
    setAfficherGestionFinance(false);
    setAfficherGestionCours(false);
    setAfficherGestionEmploiDuTemps(false);
    setAfficherGestionNotes(false);
    setAfficherGestionNotesPrimaire(false);
    setAfficherGestionParametres(false);
    setMenuActif('absences');
  };

  const ouvrirGestionParametres = () => {
    setAfficherGestionParametres(true);
    setAfficherGestionEleves(false);
    setAfficherGestionClasses(false);
    setAfficherGestionEnseignants(false);
    setAfficherGestionFinance(false);
    setAfficherGestionCours(false);
    setAfficherGestionEmploiDuTemps(false);
    setAfficherGestionNotes(false);
    setAfficherGestionNotesPrimaire(false);
    setAfficherGestionAbsences(false);
    setMenuActif('parametres');
  };

  const retourTableauDeBord = () => {
    setAfficherGestionEleves(false);
    setAfficherGestionClasses(false);
    setAfficherGestionEnseignants(false);
    setAfficherGestionFinance(false);
    setAfficherGestionCours(false);
    setAfficherGestionEmploiDuTemps(false);
    setAfficherGestionNotes(false);
    setAfficherGestionNotesPrimaire(false);
    setAfficherGestionAbsences(false);
    setAfficherGestionParametres(false);
    setMenuActif('tableau-de-bord');
  };

  const deconnexion = async () => {
  await AuthService.deconnexion();
  localStorage.removeItem('estConnecte');
  localStorage.removeItem('utilisateur');
  
  // Nettoyage des styles avant la redirection
  document.querySelectorAll('.input-champ, .conteneur-input, .groupe-champ').forEach(el => {
    el.removeAttribute('style');
  });
  
  // Supprime les classes qui pourraient interférer
  document.body.classList.remove('theme-sombre', 'theme-clair');
  
  // Force un rechargement propre de la page de connexion
  window.location.href = '/connexion'; // Utilisez ceci au lieu de router.push
};

  const ouvrirProfil = () => {
    setProfilOuvert(true);
    setMenuProfilOuvert(false);
    setOngletActif('informations');
  };

  const fermerProfil = () => {
    setProfilOuvert(false);
    setDonneesMotDePasse({
      motDePasseActuel: '',
      nouveauMotDePasse: '',
      confirmerMotDePasse: ''
    });
  };

  const getFuseauHoraireLibelle = (): string => {
    if (!parametresApp) return 'GMT+0';
    
    const fuseaux: Record<string, string> = {
      'Africa/Abidjan': 'GMT+0',
      'Africa/Dakar': 'GMT+0',
      'Africa/Lagos': 'GMT+1',
      'Africa/Johannesburg': 'GMT+2',
      'Europe/Paris': 'GMT+1',
      'Europe/London': 'GMT+0'
    };
    
    return fuseaux[parametresApp.fuseau_horaire] || 'GMT+0';
  };

  const gererChangementProfil = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDonneesProfil(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const gererChangementMotDePasse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDonneesMotDePasse(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const sauvegarderProfil = async () => {
    try {
      if (!utilisateur) return;
      const resultat = await AuthService.mettreAJourProfil({
        id: utilisateur.id,
        ...donneesProfil,
        avatar_url: previewAvatar || utilisateur?.avatar_url
      });
      if (resultat.success && resultat.utilisateur) {
        const utilisateurMisAJour = {
          ...utilisateur,
          ...resultat.utilisateur
        };
        
        localStorage.setItem('utilisateur', JSON.stringify(utilisateurMisAJour));
        setUtilisateur(utilisateurMisAJour);
        
        setAlerteSucces('Profil mis à jour avec succès !');
        fermerProfil();
      } else {
        alert(resultat.erreur || 'Erreur lors de la sauvegarde du profil');
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du profil:', error);
      alert('Erreur lors de la sauvegarde du profil');
    }
  };

  const changerMotDePasse = async () => {
    try {
      if (!utilisateur) return;
      
      if (donneesMotDePasse.nouveauMotDePasse !== donneesMotDePasse.confirmerMotDePasse) {
        alert('Les mots de passe ne correspondent pas');
        return;
      }
      if (donneesMotDePasse.nouveauMotDePasse.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      
      const resultat = await AuthService.changerMotDePasse({
        id: utilisateur.id,
        motDePasseActuel: donneesMotDePasse.motDePasseActuel,
        nouveauMotDePasse: donneesMotDePasse.nouveauMotDePasse
      });
      
      if (resultat.success) {
        setAlerteSucces('Mot de passe modifié avec succès !');
        setDonneesMotDePasse({
          motDePasseActuel: '',
          nouveauMotDePasse: '',
          confirmerMotDePasse: ''
        });
        setOngletActif('informations');
      } else {
        alert(resultat.erreur || 'Erreur lors du changement de mot de passe');
      }
      
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      alert('Erreur lors du changement de mot de passe');
    }
  };

const gererChangementPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file || !utilisateur) return;
  
  const typesValides = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!typesValides.includes(file.type)) {
    alert('Veuillez sélectionner une image valide (JPEG, PNG, GIF, WebP)');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    alert('L\'image ne doit pas dépasser 5MB');
    return;
  }
  
  setChargementPhoto(true);
  
  try {
    // Prévisualisation immédiate
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewAvatar(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    // Upload du fichier
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('userId', utilisateur.id.toString());
    
    const response = await fetch('/api/utilisateurs/avatar', {
      method: 'POST',
      body: formData
    });
    
    const resultat = await response.json();
    
    // 👇 VOICI LE CONSOLE.LOG À AJOUTER ICI
    console.log('✅ URL retournée par API:', resultat.avatar_url);
    
    if (resultat.success && resultat.avatar_url) {
  // ✅ METTRE À JOUR LES DEUX TABLES
  const avatarUrl = resultat.avatar_url; // "/api/avatars/avatar_1_123456.jpg"
  
  // Mettre à jour l'utilisateur
  const utilisateurMisAJour = {
    ...utilisateur,
    avatar_url: avatarUrl
  };
  localStorage.setItem('utilisateur', JSON.stringify(utilisateurMisAJour));
  setUtilisateur(utilisateurMisAJour);
  
  // Mettre à jour employeInfo
  setEmployeInfo(prev => prev ? {
    ...prev,
    avatar_url: avatarUrl
  } : null);
  
  setAlerteSucces('Photo de profil mise à jour avec succès !');
} else {
      alert(resultat.erreur || 'Erreur lors du changement de photo');
      setPreviewAvatar(null);
    }
  } catch (error) {
    console.error('Erreur lors du changement de photo:', error);
    alert('Erreur lors du changement de photo');
    setPreviewAvatar(null);
  } finally {
    setChargementPhoto(false);
    if (inputFileRef.current) {
      inputFileRef.current.value = '';
    }
  }
};

const supprimerPhoto = async () => {
  if (!utilisateur) return;
  
  try {
    const resultat = await AuthService.mettreAJourProfil({
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      avatar_url: '' // Envoyer une chaîne vide pour supprimer
    });
    
    if (resultat.success) {
      setPreviewAvatar(null);
      
      // ✅ MISE À JOUR IMMÉDIATE DE L'AFFICHAGE
      
      // Mettre à jour l'utilisateur dans le state
      const utilisateurMisAJour = {
        ...utilisateur,
        avatar_url: undefined
      };
      
      localStorage.setItem('utilisateur', JSON.stringify(utilisateurMisAJour));
      setUtilisateur(utilisateurMisAJour);
      
      // Mettre à jour employeInfo si disponible
      if (employeInfo) {
        setEmployeInfo({
          ...employeInfo,
          avatar_url: undefined
        });
      }
      
      setAlerteSucces('Photo de profil supprimée avec succès !');
    } else {
      alert(resultat.erreur || 'Erreur lors de la suppression de la photo');
    }
  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    alert('Erreur lors de la suppression de la photo');
  }
};

  const ouvrirSelecteurFichier = () => {
    inputFileRef.current?.click();
  };

  if (chargement) {
    return (
      <div className="chargement-ecran">
        <div className="spinner-grand"></div>
        <p>Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className={`conteneur-tableau-de-bord ${parametresApp.theme_defaut}`}>
      {/* Barre latérale */}
      <aside className="barre-laterale" style={{ 
        borderRightColor: parametresEcole?.couleur_principale || '#3B82F6',
        '--couleur-principale': parametresEcole?.couleur_principale || '#3B82F6'
      } as React.CSSProperties}>
        
        <div className="en-tete-barre">
          <div className="logo-tableau-bord">
            <span className="icone-logo">
              <img 
                src="/logo_scolarion.png" 
                alt="Logo Scolarion"
              />
            </span>
          </div>
          <h2 className="titre-application">Scolarion</h2>
          <p className="sous-titre">Plateforme de Gestion Scolaire</p>
        </div>            
        
        <nav className="navigation-principale">
        {/* Tableau de Bord - toujours visible */}
        <button 
          className={`item-menu ${menuActif === 'tableau-de-bord' ? 'actif' : ''}`}
          onClick={retourTableauDeBord}
          style={menuActif === 'tableau-de-bord' ? { 
            backgroundColor: (parametresEcole?.couleur_principale || '#3B82F6') + '20',
            borderLeftColor: parametresEcole?.couleur_principale || '#3B82F6'
          } : {}}
        >
          <span className="icone-menu">📊</span>
          Tableau de Bord
        </button>
        
        {/* GESTION - afficher si au moins une permission du module gestion */}
        {(aPermission('eleves.view') || aPermission('classes.view') || aPermission('personnel.view')) && (
          <div className="groupe-menu">
            <div className="label-groupe">GESTION</div>
            
            {aPermission('eleves.view') && (
              <button 
                className={`item-menu ${menuActif === 'eleves' ? 'actif' : ''}`}
                onClick={ouvrirGestionEleves}
                style={menuActif === 'eleves' ? { 
                  backgroundColor: (parametresEcole?.couleur_principale || '#3B82F6') + '20',
                  borderLeftColor: parametresEcole?.couleur_principale || '#3B82F6'
                } : {}}
              >
                <span className="icone-menu">👨‍🎓</span>
                Élèves
              </button>
            )}
            
            {aPermission('classes.view') && (
              <button 
                className={`item-menu ${menuActif === 'classes' ? 'actif' : ''}`}
                onClick={ouvrirGestionClasses}
                style={menuActif === 'classes' ? { 
                  backgroundColor: (parametresEcole?.couleur_principale || '#3B82F6') + '20',
                  borderLeftColor: parametresEcole?.couleur_principale || '#3B82F6'
                } : {}}
              >
                <span className="icone-menu">🏫</span>
                Classes
              </button>
            )}
            
            {aPermission('personnel.view') && (
              <button 
                className={`item-menu ${menuActif === 'personnel' ? 'actif' : ''}`} 
                onClick={ouvrirGestionPersonnel}
                style={menuActif === 'personnel' ? { 
                  backgroundColor: (parametresEcole?.couleur_principale || '#3B82F6') + '20',
                  borderLeftColor: parametresEcole?.couleur_principale || '#3B82F6'
                } : {}}
              >
                <span className="icone-menu">👨‍💼</span>
                Personnel
              </button>
            )}
          </div>
        )}
        
        {/* ACADÉMIQUE - afficher si au moins une permission du module académique */}
        {(aPermission('cours.view') || aPermission('emploi.view') || aPermission('notes.view') || aPermission('absences.view')) && (
          <div className="groupe-menu">
            <div className="label-groupe">ACADÉMIQUE</div>
            
            {aPermission('cours.view') && (
              <button 
                className={`item-menu ${menuActif === 'cours' ? 'actif' : ''}`}
                onClick={ouvrirGestionCours}
                style={menuActif === 'cours' ? { 
                  backgroundColor: (parametresEcole?.couleur_principale || '#3B82F6') + '20',
                  borderLeftColor: parametresEcole?.couleur_principale || '#3B82F6'
                } : {}}
              >
                <span className="icone-menu">📚</span>
                Cours
              </button>
            )}
            
            {aPermission('emploi.view') && (
              <button 
                className={`item-menu ${menuActif === 'emploi-du-temps' ? 'actif' : ''}`}
                onClick={ouvrirGestionEmploiDuTemps}
                style={menuActif === 'emploi-du-temps' ? { 
                  backgroundColor: (parametresEcole?.couleur_principale || '#3B82F6') + '20',
                  borderLeftColor: parametresEcole?.couleur_principale || '#3B82F6'
                } : {}}
              >
                <span className="icone-menu">📅</span>
                Emploi du temps
              </button>
            )}
            
            {aPermission('notes.view') && (
              <>
                <button 
                  className={`item-menu ${menuActif === 'notes' ? 'actif' : ''}`}
                  onClick={ouvrirGestionNotesPrimaire}
                  style={menuActif === 'notes' ? { 
                    backgroundColor: (parametresEcole?.couleur_principale || '#3B82F6') + '20',
                    borderLeftColor: parametresEcole?.couleur_principale || '#3B82F6'
                  } : {}}
                >
                  <span className="icone-menu">📝</span>
                  Notes
                </button>
                        </>
            )}
            
            {aPermission('absences.view') && (
              <button 
                className={`item-menu ${menuActif === 'absences' ? 'actif' : ''}`}
                onClick={ouvrirGestionAbsences}
                style={menuActif === 'absences' ? { 
                  backgroundColor: (parametresEcole?.couleur_principale || '#3B82F6') + '20',
                  borderLeftColor: parametresEcole?.couleur_principale || '#3B82F6'
                } : {}}
              >
                <span className="icone-menu">📋</span>
                Absences
              </button>
            )}
          </div>
        )}
        
        {/* FINANCE/PARAMETRES - afficher si au moins une permission */}
        {(aPermission('finance.view') || aPermission('settings.view')) && (
          <div className="groupe-menu">
            <div className="label-groupe">FINANCE/PARAMETRE</div>
            
            {aPermission('finance.view') && (
              <button 
                className={`item-menu ${menuActif === 'finance' ? 'actif' : ''}`}
                onClick={ouvrirGestionFinance}
                style={menuActif === 'finance' ? { 
                  backgroundColor: (parametresEcole?.couleur_principale || '#3B82F6') + '20',
                  borderLeftColor: parametresEcole?.couleur_principale || '#3B82F6'
                } : {}}
              >
                <span className="icone-menu">💵</span>
                Finance
              </button>
            )}
            
            {aPermission('settings.view') && (
              <button 
                className={`item-menu ${menuActif === 'parametres' ? 'actif' : ''}`}
                onClick={ouvrirGestionParametres}
                style={menuActif === 'parametres' ? { 
                  backgroundColor: (parametresEcole?.couleur_principale || '#3B82F6') + '20',
                  borderLeftColor: parametresEcole?.couleur_principale || '#3B82F6'
                } : {}}
              >
                <span className="icone-menu">⚙️</span>
                Paramètres
              </button>
            )}
          </div>
        )}
      </nav>
        
        <div className="pied-barre">
          <div className="info-systeme">
            <span className="version">v2.1.0</span>
            <span className="date-jour">{formaterDate(new Date())}</span>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="contenu-principal">
        {/* EN-TÊTE FIXE */}
        <header className="en-tete-principal" style={{ 
          borderBottomColor: (parametresEcole?.couleur_principale || '#3B82F6') + '40'
        }}>
          <div className="en-tete-ecole">
            <div className="logo-ecole-en-tete">
              {parametresEcole?.logo_url ? (
                <img src={parametresEcole.logo_url} alt="Logo école" className="logo-ecole-image" />
              ) : (
                <div className="logo-ecole-placeholder"></div>
              )}
            </div>
            <div className="info-ecole-en-tete">
              <h1 className="nom-ecole-en-tete" style={{ color: parametresEcole?.couleur_principale || '#2500ca' }}>
                {parametresEcole?.nom_ecole || 'Établissement Scolaire'}
              </h1>
              <p className="slogan-ecole-en-tete">{parametresEcole?.slogan || ''}</p>
              <div className="annee-scolaire-mini">
              Année scolaire : {parametresEcole?.annee_scolaire || ''}
            </div>
            </div>
            
            
            </div>
          
        <div className="actions-utilisateur">          
          <div className="conteneur-profil-utilisateur" ref={menuProfilRef}>
            <div 
              className="profil-utilisateur"
              onClick={() => setMenuProfilOuvert(!menuProfilOuvert)}
            >
             <div className="avatar-menu">
  {employeInfo?.avatar_url ? (
    <img 
      src={`${employeInfo.avatar_url}?t=${Date.now()}`}
      className="avatar-menu"
      alt="Avatar"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent) {
          const initiales = document.createElement('span');
          initiales.className = 'initiale-avatar';
          initiales.textContent = `${utilisateur?.prenom?.[0] || ''}${utilisateur?.nom?.[0] || ''}`;
          parent.appendChild(initiales);
        }
      }}
    />
  ) : utilisateur?.avatar_url ? (
    <img 
      src={`${utilisateur.avatar_url}?t=${Date.now()}`}
      className="avatar-menu"
      alt="Avatar"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent) {
          const initiales = document.createElement('span');
          initiales.className = 'initiale-avatar';
          initiales.textContent = `${utilisateur?.prenom?.[0] || ''}${utilisateur?.nom?.[0] || ''}`;
          parent.appendChild(initiales);
        }
      }}
    />
  ) : (
    <span className="initiale-avatar">
      {utilisateur?.prenom?.[0] || ''}{utilisateur?.nom?.[0] || ''}
    </span>
  )}
</div>
              <div className="info-utilisateur">
                <div className="nom-utilisateur">
                  {utilisateur?.nom || ''} {utilisateur?.prenom || ''}
                </div>
                <div className="role-utilisateur">
                  {/* Afficher le rôle principal ou tous les rôles */}
                  {userRoles.length > 0 
                    ? formaterRolePrincipal(userRoles) 
                    : employeInfo?.fonction || 'Utilisateur'}
                </div>
              </div>
              <span className={`fleche-menu ${menuProfilOuvert ? 'ouvert' : ''}`}>
                ▼
              </span>
            </div>
            
            {menuProfilOuvert && (
              <div className="menu-deroulant-profil">
                <div className="en-tete-menu-profil">
                 <div className="avatar-menu">
  {employeInfo?.avatar_url ? (
    <img 
      src={`${employeInfo.avatar_url}?t=${Date.now()}`}
      className="avatar-menu"
      alt="Avatar"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent) {
          const initiales = document.createElement('span');
          initiales.className = 'initiale-avatar-menu';
          initiales.textContent = `${utilisateur?.prenom?.[0] || ''}${utilisateur?.nom?.[0] || ''}`;
          parent.appendChild(initiales);
        }
      }}
    />
  ) : utilisateur?.avatar_url ? (
    <img 
      src={`${utilisateur.avatar_url}?t=${Date.now()}`}
      className="avatar-menu"
      alt="Avatar"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
        const parent = e.currentTarget.parentElement;
        if (parent) {
          const initiales = document.createElement('span');
          initiales.className = 'initiale-avatar-menu';
          initiales.textContent = `${utilisateur?.prenom?.[0] || ''}${utilisateur?.nom?.[0] || ''}`;
          parent.appendChild(initiales);
        }
      }}
    />
  ) : (
    <span className="initiale-avatar-menu">
      {utilisateur?.prenom?.[0] || ''}{utilisateur?.nom?.[0] || ''}
    </span>
  )}
</div>
                  <div className="info-menu-profil">
                    <div className="nom-menu-profil">
                      {utilisateur?.nom || ''} {utilisateur?.prenom || ''}
                    </div>
                    <div className="email-menu-profil">
                      {utilisateur?.email || ''}
                    </div>
                    <div className="roles-menu-profil">
                      {/* Afficher tous les rôles sous forme de badges */}
                      {userRoles.length > 0 ? (
                        userRoles.map((role, index) => (
                          <span key={index} className="badge-role-profil">
                            {role.role_nom}
                          </span>
                        ))
                      ) : (
                        <span className="badge-role-profil">
                          {employeInfo?.fonction || 'Utilisateur'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="separateur-menu"></div>
                
                <button 
                  className="item-menu-profil"
                  onClick={ouvrirProfil}
                >
                  <span className="icone-item-menu">👤</span>
                  Mon Profil
                </button>
                
                <button 
                  className="item-menu-profil"
                  onClick={deconnexion}
                >
                  <span className="icone-item-menu">🚪</span>
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
        </header>

        {/* Alerte de succès */}
        {alerteSucces && (
          <div className="alerte-succes" style={{ backgroundColor: parametresEcole?.couleur_principale || '#3B82F6' }}>
            <div className="contenu-alerte-succes">
              <span className="icone-alerte">✅</span>
              <span className="texte-alerte">{alerteSucces}</span>
              <button 
                className="bouton-fermer-alerte"
                onClick={() => setAlerteSucces('')}
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* CONTENU DES MODULES */}
        <div className="contenu-modules">
          {afficherGestionEleves ? (
            <GestionEleves onRetourTableauDeBord={retourTableauDeBord} />
          ) : afficherGestionClasses ? (
            <GestionClasses onRetourTableauDeBord={retourTableauDeBord} />
          ) : afficherGestionEnseignants ? (
            <GestionEnseignants onRetourTableauDeBord={retourTableauDeBord} />
          ) : afficherGestionCours ? (
            <GestionCours onRetourTableauDeBord={retourTableauDeBord} />
          ) : afficherGestionEmploiDuTemps ? (
            <GestionEmploiDuTemps onRetourTableauDeBord={retourTableauDeBord} />
          ) : afficherGestionNotesPrimaire ? (
            <GestionNotesPrimaire onRetourTableauDeBord={retourTableauDeBord} />
          ) : afficherGestionNotesPrimaire ? (
            <GestionNotesPrimaire onRetourTableauDeBord={retourTableauDeBord} />
          ) : afficherGestionAbsences ? (
            <GestionAbsences onRetourTableauDeBord={retourTableauDeBord} />
          ) : afficherGestionFinance ? (
            <GestionFinance onRetourTableauDeBord={retourTableauDeBord} />
          ) : afficherGestionParametres ? (
            <GestionParametres onRetourTableauDeBord={retourTableauDeBord} />
          ) : (
            /* Tableau de bord principal */
            <div className="contenu-tableau-bord">
              <DashboardIntelligentAcc 
                formaterMontant={formaterMontant}
                formaterDate={formaterDate}
                deviseSymbole={parametresApp.symbole_devise}
              />              
            </div>
          )}
        </div>
      </main>

      {/* Modal de profil */}
      {profilOuvert && (
        <div className="overlay-profil" onClick={fermerProfil}>
          <div className="modal-profil" onClick={(e) => e.stopPropagation()}>
            <div className="en-tete-modal-profil">
              <h2 className="titre-modal-profil">Mon Profil</h2>
              <button className="bouton-fermer-modal" onClick={fermerProfil}>
                ✕
              </button>
            </div>
            
            <div className="navigation-modal-profil">
              <button 
                className={`onglet-profil ${ongletActif === 'informations' ? 'actif' : ''}`}
                onClick={() => setOngletActif('informations')}
              >
                Informations Personnelles
              </button>
              <button 
                className={`onglet-profil ${ongletActif === 'securite' ? 'actif' : ''}`}
                onClick={() => setOngletActif('securite')}
              >
                Sécurité
              </button>
            </div>
            
            <div className="contenu-modal-profil">
              {ongletActif === 'informations' ? (
                <div>
                  <div className="section-avatar-profil">
                    <div className="avatar-grand-container">
                      <div className="avatar-grand">
                        {previewAvatar ? (
                          <img 
                            src={previewAvatar} 
                            alt="Avatar" 
                            className="image-avatar"
                          />
                        ) : (employeInfo?.avatar_url || utilisateur?.avatar_url) ? (
                          <img 
                            src={employeInfo?.avatar_url || utilisateur?.avatar_url || ''} 
                            alt="Avatar" 
                            className="image-avatar"
                            key={employeInfo?.avatar_url || utilisateur?.avatar_url || 'default'}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                let initialesSpan = parent.querySelector('.initiale-avatar-grand');
                                if (!initialesSpan) {
                                  initialesSpan = document.createElement('span');
                                  initialesSpan.className = 'initiale-avatar-grand';
                                  initialesSpan.textContent = `${utilisateur?.prenom?.[0] || ''}${utilisateur?.nom?.[0] || ''}`;
                                  parent.appendChild(initialesSpan);
                                }
                              }
                            }}
                          />
                        ) : (
                          <span className="initiale-avatar-grand">
                            {utilisateur?.prenom?.[0] || ''}{utilisateur?.nom?.[0] || ''}
                          </span>
                        )}
                        {chargementPhoto && (
                          <div className="overlay-chargement-avatar">
                            <div className="spinner-avatar"></div>
                          </div>
                        )}
                      </div>
                      <div className="actions-avatar">
                        <input
                          type="file"
                          ref={inputFileRef}
                          onChange={gererChangementPhoto}
                          accept="image/jpeg,image/jpg,image/png,image/gif"
                          className="input-fichier-cache"
                        />
                        <button 
                          className="bouton-changer-avatar"
                          onClick={ouvrirSelecteurFichier}
                          disabled={chargementPhoto}
                        >
                          {chargementPhoto ? '📤 Chargement...' : '📷 Changer la photo'}
                        </button>
                        {(previewAvatar || utilisateur?.avatar_url) && (
                          <button 
                            className="bouton-supprimer-avatar"
                            onClick={supprimerPhoto}
                            disabled={chargementPhoto}
                          >
                            🗑️ Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="formulaire-profil">
                    <div className="groupe-champ-profil">
                      <label className="label-champ-profil">Prénom</label>
                      <input
                        type="text"
                        name="prenom"
                        value={donneesProfil.prenom}
                        onChange={gererChangementProfil}
                        className="champ-profil"
                        placeholder="Votre prénom"
                      />
                    </div>
                    
                    <div className="groupe-champ-profil">
                      <label className="label-champ-profil">Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={donneesProfil.nom}
                        onChange={gererChangementProfil}
                        className="champ-profil"
                        placeholder="Votre nom"
                      />
                    </div>
                    
                    <div className="groupe-champ-profil">
                      <label className="label-champ-profil">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={donneesProfil.email}
                        onChange={gererChangementProfil}
                        className="champ-profil"
                        placeholder="Votre email"
                      />
                    </div>
                    
                    <div className="groupe-champ-profil">
                      <label className="label-champ-profil">Rôle</label>
                      <div className="champ-role-profil">
                        {employeInfo?.fonction || donneesProfil.role}
                      </div>
                      <small className="texte-aide-profil">
                        Le rôle ne peut pas être modifié
                      </small>
                    </div>
                  </div>
                  
                  <div className="actions-modal-profil">
                    <button 
                      className="bouton-annuler-profil"
                      onClick={fermerProfil}
                    >
                      Annuler
                    </button>
                    <button 
                      className="bouton-sauvegarder-profil"
                      onClick={sauvegarderProfil}
                    >
                      💾 Sauvegarder
                    </button>
                  </div>
                </div>
              ) : (
                <div className="section-mot-de-passe">
                  <h3 className="titre-section-mot-de-passe">Changer le mot de passe</h3>
                  <p className="description-section-mot-de-passe">
                    Pour modifier votre mot de passe, veuillez remplir les champs ci-dessous.
                  </p>
                  
                  <div className="formulaire-mot-de-passe">
                    <div className="groupe-champ-profil">
                      <label className="label-champ-profil">Mot de passe actuel</label>
                      <div className="conteneur-input-mot-de-passe">
                        <input
                          type={afficherMotDePasseActuel ? "text" : "password"}
                          name="motDePasseActuel"
                          value={donneesMotDePasse.motDePasseActuel}
                          onChange={gererChangementMotDePasse}
                          className="champ-profil champ-mot-de-passe"
                          placeholder="Votre mot de passe actuel"
                        />
                        <button
                          type="button"
                          className="bouton-oeil-mot-de-passe"
                          onClick={() => setAfficherMotDePasseActuel(!afficherMotDePasseActuel)}
                        >
                          {afficherMotDePasseActuel ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="groupe-champ-profil">
                      <label className="label-champ-profil">Nouveau mot de passe</label>
                      <div className="conteneur-input-mot-de-passe">
                        <input
                          type={afficherNouveauMotDePasse ? "text" : "password"}
                          name="nouveauMotDePasse"
                          value={donneesMotDePasse.nouveauMotDePasse}
                          onChange={gererChangementMotDePasse}
                          className="champ-profil champ-mot-de-passe"
                          placeholder="Votre nouveau mot de passe"
                        />
                        <button
                          type="button"
                          className="bouton-oeil-mot-de-passe"
                          onClick={() => setAfficherNouveauMotDePasse(!afficherNouveauMotDePasse)}
                        >
                          {afficherNouveauMotDePasse ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                      <small className="texte-aide-profil">
                        Minimum 6 caractères
                      </small>
                    </div>
                    
                    <div className="groupe-champ-profil">
                      <label className="label-champ-profil">Confirmer le mot de passe</label>
                      <div className="conteneur-input-mot-de-passe">
                        <input
                          type={afficherConfirmerMotDePasse ? "text" : "password"}
                          name="confirmerMotDePasse"
                          value={donneesMotDePasse.confirmerMotDePasse}
                          onChange={gererChangementMotDePasse}
                          className="champ-profil champ-mot-de-passe"
                          placeholder="Confirmez votre nouveau mot de passe"
                        />
                        <button
                          type="button"
                          className="bouton-oeil-mot-de-passe"
                          onClick={() => setAfficherConfirmerMotDePasse(!afficherConfirmerMotDePasse)}
                        >
                          {afficherConfirmerMotDePasse ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="actions-modal-profil">
                    <button 
                      className="bouton-annuler-profil"
                      onClick={() => setOngletActif('informations')}
                    >
                      Retour
                    </button>
                    <button 
                      className="bouton-sauvegarder-profil"
                      onClick={changerMotDePasse}
                    >
                      🔒 Changer le mot de passe
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}