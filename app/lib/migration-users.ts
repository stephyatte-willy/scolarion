import { query } from './database';
import bcrypt from 'bcryptjs';

export async function migrerUtilisateursExistants() {
  try {
    console.log('🔄 Migration des utilisateurs existants...');

    // Récupérer tous les utilisateurs
    const utilisateurs = await query('SELECT id, password, avatar_url FROM users') as any[];

    for (const utilisateur of utilisateurs) {
      console.log(`Traitement de l'utilisateur ${utilisateur.id}:`);

      // 1. Corriger le mot de passe si nécessaire
      if (!utilisateur.password.startsWith('$2b$')) {
        console.log(`  - Hachage du mot de passe pour l'utilisateur ${utilisateur.id}`);
        const motDePasseHash = await bcrypt.hash(utilisateur.password, 12);
        await query(
          'UPDATE users SET password = ? WHERE id = ?',
          [motDePasseHash, utilisateur.id]
        );
      }

      // 2. Nettoyer les avatars base64 tronqués
      if (utilisateur.avatar_url && utilisateur.avatar_url.startsWith('data:') && utilisateur.avatar_url.length < 500) {
        console.log(`  - Nettoyage de l'avatar tronqué pour l'utilisateur ${utilisateur.id}`);
        await query(
          'UPDATE users SET avatar_url = NULL WHERE id = ?',
          [utilisateur.id]
        );
      }
    }

    console.log('✅ Migration terminée avec succès');
    return { success: true, message: `${utilisateurs.length} utilisateurs migrés` };

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    return { success: false, error };
  }
}