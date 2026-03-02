export class AvatarService {
  static async obtenirAvatar(userId: number): Promise<{
    success: boolean;
    avatar_url?: string;
    has_avatar: boolean;
    type?: string;
    erreur?: string;
  }> {
    try {
      const response = await fetch(`/api/avatar/${userId}`);
      const data = await response.json();

      if (!response.ok) {
        return { success: false, has_avatar: false, erreur: data.erreur };
      }

      return data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'avatar:', error);
      return { 
        success: false, 
        has_avatar: false, 
        erreur: 'Erreur de connexion au serveur' 
      };
    }
  }

  static genererInitiales(prenom: string, nom: string): string {
    return `${prenom[0] || ''}${nom[0] || ''}`.toUpperCase();
  }

  static async supprimerAvatar(userId: number): Promise<{success: boolean, message?: string, erreur?: string}> {
    try {
      const response = await fetch(`/api/avatar/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, erreur: data.erreur };
      }

      return { success: true, message: data.message };
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'avatar:', error);
      return { success: false, erreur: 'Erreur de connexion au serveur' };
    }
  }
}