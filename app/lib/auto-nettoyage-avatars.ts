import { query } from './database';

export async function nettoyerTousAvatarsCorrompus() {
  try {
    console.log('🔄 Nettoyage automatique de tous les avatars corrompus...');

    const utilisateurs = await query('SELECT id, avatar_url FROM users WHERE avatar_url IS NOT NULL') as any[];
    
    let compteurNettoyes = 0;

    for (const utilisateur of utilisateurs) {
      if (utilisateur.avatar_url.startsWith('data:image')) {
        // Vérifier si base64 est tronqué
        if (utilisateur.avatar_url.length < 1000 || !utilisateur.avatar_url.includes('base64,')) {
          await query('UPDATE users SET avatar_url = NULL WHERE id = ?', [utilisateur.id]);
          compteurNettoyes++;
          console.log(`🗑️ Avatar corrompu nettoyé pour l'utilisateur ${utilisateur.id}`);
        }
      }
    }

    console.log(`✅ Nettoyage terminé: ${compteurNettoyes} avatars corrompus nettoyés`);
    return { success: true, nettoyes: compteurNettoyes };

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage automatique:', error);
    return { success: false, error };
  }
}

// Exécuter au démarrage si nécessaire
// nettoyerTousAvatarsCorrompus();