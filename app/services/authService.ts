import { query } from '../lib/database';
import bcrypt from 'bcryptjs';

export interface Utilisateur {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  avatar_url?: string | null; 
  statut: string;
}

export class AuthService {
  static async authentifierUtilisateur(email: string, password: string): Promise<{success: boolean, utilisateur?: Utilisateur, erreur?: string}> {
  try {
    const response = await fetch('/api/auth/connexion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, erreur: data.erreur };
    }

    return { success: true, utilisateur: data.utilisateur };
  } catch (error) {
    console.error('Erreur d\'authentification:', error);
    return { success: false, erreur: 'Erreur de connexion au serveur' };
  }
}

  static async rechercherUtilisateurParEmail(email: string): Promise<{success: boolean, utilisateur?: {nom: string, prenom: string, role: string}, erreur?: string}> {
    try {
      const response = await fetch('/api/auth/rechercher-utilisateur', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, erreur: data.erreur };
      }

      return { success: true, utilisateur: data.utilisateur };
    } catch (error) {
      console.error('Erreur lors de la recherche utilisateur:', error);
      return { success: false, erreur: 'Erreur de connexion au serveur' };
    }
  }

   static async mettreAJourProfil(utilisateurData: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    avatar_url?: string;
  }): Promise<{success: boolean, utilisateur?: any, erreur?: string}> {
    try {
      const response = await fetch('/api/utilisateurs/profil', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(utilisateurData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, erreur: data.erreur };
      }

      return { success: true, utilisateur: data.utilisateur };
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      return { success: false, erreur: 'Erreur de connexion au serveur' };
    }
  }

  static async changerMotDePasse(motDePasseData: {
    id: number;
    motDePasseActuel: string;
    nouveauMotDePasse: string;
  }): Promise<{success: boolean, message?: string, erreur?: string}> {
    try {
      const response = await fetch('/api/utilisateurs/mot-de-passe', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(motDePasseData),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, erreur: data.erreur };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Erreur lors du changement de mot de passe:', error);
      return { success: false, erreur: 'Erreur de connexion au serveur' };
    }
  }

static async uploadAvatar(formData: FormData): Promise<{success: boolean, avatar_url?: string, erreur?: string}> {
  try {
    console.log('📤 Upload avatar - Début');
    const response = await fetch('/api/utilisateurs/avatar', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('📥 Réponse upload avatar:', data);

    if (!response.ok) {
      return { success: false, erreur: data.erreur || 'Erreur lors de l\'upload' };
    }

    // Si succès, mettre à jour le localStorage
    if (data.success && data.avatar_url) {
      const utilisateurStr = localStorage.getItem('utilisateur');
      if (utilisateurStr) {
        const utilisateur = JSON.parse(utilisateurStr);
        utilisateur.avatar_url = data.avatar_url;
        localStorage.setItem('utilisateur', JSON.stringify(utilisateur));
      }
    }

    return { success: true, avatar_url: data.avatar_url };
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload de l\'avatar:', error);
    return { success: false, erreur: 'Erreur de connexion au serveur' };
  }
}

  static async obtenirParametresEcole(): Promise<{success: boolean, parametres?: any, erreur?: string}> {
    try {
      const response = await fetch('/api/parametres/ecole');
      const data = await response.json();

      if (!response.ok) {
        return { success: false, erreur: data.erreur };
      }

      return { success: true, parametres: data.parametres };
    } catch (error) {
      console.error('Erreur lors de la récupération des paramètres:', error);
      return { 
        success: false, 
        erreur: 'Impossible de charger les paramètres de l\'école' 
      };
    }
  }

  
  static async initialiserBaseDeDonnees(): Promise<{success: boolean, message?: string, erreur?: string}> {
    try {
      const response = await fetch('/api/init-db');
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, erreur: data.message };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de la base de données:', error);
      return { success: false, erreur: 'Erreur de connexion au serveur' };
    }
  }

  static async debugBaseDeDonnees(): Promise<{success: boolean, data?: any, erreur?: string}> {
    try {
      const response = await fetch('/api/debug/db');
      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, erreur: data.error };
      }

      return { success: true, data };
    } catch (error) {
      console.error('Erreur lors du débugage:', error);
      return { success: false, erreur: 'Erreur de connexion au serveur' };
    }
  }

  static async deconnexion(): Promise<{success: boolean}> {
    try {
      await fetch('/api/auth/deconnexion', { method: 'POST' });
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      return { success: true };
    }
  }
}