import { query } from './database';

export async function nettoyerAvatarsCorrompus() {
  try {
    console.log('🔄 Nettoyage des avatars corrompus...');

    // Récupérer tous les utilisateurs avec des avatars
    const utilisateurs = await query('SELECT id, avatar_url FROM users WHERE avatar_url IS NOT NULL') as any[];

    let compteurCorriges = 0;
    let compteurSupprimes = 0;

    for (const utilisateur of utilisateurs) {
      if (utilisateur.avatar_url.startsWith('data:image')) {
        // Vérifier si l'image base64 est tronquée
        if (utilisateur.avatar_url.length < 1000) { // Les images base64 valides sont généralement plus longues
          console.log(`❌ Avatar tronqué détecté pour l'utilisateur ${utilisateur.id}`);
          
          // Supprimer l'avatar corrompu
          await query(
            'UPDATE users SET avatar_url = NULL WHERE id = ?',
            [utilisateur.id]
          );
          compteurSupprimes++;
        } else {
          console.log(`✅ Avatar valide pour l'utilisateur ${utilisateur.id}`);
          compteurCorriges++;
        }
      } else if (utilisateur.avatar_url.startsWith('/uploads/')) {
        console.log(`✅ Avatar fichier valide pour l'utilisateur ${utilisateur.id}`);
        compteurCorriges++;
      }
    }

    console.log(`✅ Nettoyage terminé: ${compteurCorriges} avatars valides, ${compteurSupprimes} avatars supprimés`);
    return { 
      success: true, 
      message: `${compteurCorriges} avatars valides, ${compteurSupprimes} avatars corrompus supprimés` 
    };

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage des avatars:', error);
    return { success: false, error };
  }
}