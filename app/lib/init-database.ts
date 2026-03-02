import { query } from './database';

export async function initialiserBaseDeDonnees() {
  try {
    console.log('🔄 Initialisation de la base de données...');

    // Vérifier si la table parametres existe
    await query(`
      CREATE TABLE IF NOT EXISTS parametres (
        id INT PRIMARY KEY AUTO_INCREMENT,
        nom_ecole VARCHAR(255) NOT NULL,
        adresse TEXT,
        telephone VARCHAR(20),
        email VARCHAR(100),
        logo_url VARCHAR(500),
        couleur_principale VARCHAR(7) DEFAULT '#3B82F6',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Vérifier si la table users existe
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        role ENUM('admin', 'enseignant', 'etudiant', 'parent') NOT NULL,
        avatar_url VARCHAR(500),
        statut ENUM('actif', 'inactif') DEFAULT 'actif',
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Vérifier s'il y a des paramètres
    const parametresExistants = await query('SELECT COUNT(*) as count FROM parametres') as any[];
    console.log('📊 Paramètres existants:', parametresExistants[0].count);
    
    // Dans la fonction initialiserBaseDeDonnees(), modifier la partie paramètres :
if (parametresExistants[0].count === 0) {
  console.log('➕ Insertion des paramètres par défaut...');
  // Insérer les paramètres par défaut avec slogan
  await query(`
    INSERT INTO parametres (nom_ecole, adresse, telephone, email, logo_url, slogan) 
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    'Non défini',
    'Non défini',
    'Non défini',
    'Non défini',
    'Non défini',
    'Non défini'
  ]);
}

    // Vérifier s'il y a des utilisateurs
    const utilisateursExistants = await query('SELECT COUNT(*) as count FROM users') as any[];
    console.log('👥 Utilisateurs existants:', utilisateursExistants[0].count);
    
    if (utilisateursExistants[0].count === 0) {
      console.log('➕ Insertion des utilisateurs par défaut...');
      // Insérer les utilisateurs par défaut avec mot de passe en clair pour le développement
      await query(`
        INSERT INTO users (email, password, nom, prenom, role) 
        VALUES 
        (?, ?, ?, ?, ?),
        (?, ?, ?, ?, ?)
      `, [
        'admin@ecole.fr', 'password123', 'Dupont', 'Marie', 'admin',
        'professeur@ecole.fr', 'password123', 'Martin', 'Pierre', 'enseignant'
      ]);
    }

    // Vérifier les utilisateurs insérés
    const utilisateurs = await query('SELECT email, nom, prenom, role FROM users') as any[];
    console.log('📋 Liste des utilisateurs:', utilisateurs);

    console.log('✅ Base de données initialisée avec succès');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
    return { success: false, error };
  }
}