export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  permissions: string[]; // Assurez-vous que c'est un tableau de strings
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
  phone?: string;
  department?: string;
  notes?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API calls vers les routes API
export const authAPI = {
  login: async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log('Réponse brute login:', text);
      
      if (!text) {
        throw new Error('Réponse vide du serveur');
      }

      const data = JSON.parse(text);
      return data;
      
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erreur de connexion au serveur' 
      };
    }
  },

  logout: async (): Promise<{ success: boolean }> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  },

  getUserByEmail: async (email: string): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log('Réponse brute user:', text);
      
      if (!text) {
        throw new Error('Réponse vide du serveur');
      }

      const data = await JSON.parse(text);
      return data.user;
      
    } catch (error) {
      console.error('Erreur lors de la recherche utilisateur:', error);
      return null;
    }
  }
};