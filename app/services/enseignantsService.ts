import { query } from '../lib/database';
import bcrypt from 'bcryptjs';

export interface Enseignant {
  id: number;
  user_id: number;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  date_naissance: string;
  lieu_naissance?: string;
  genre: 'M' | 'F';
  adresse?: string;
  telephone?: string;
  specialite?: string;
  diplome?: string;
  date_embauche: string;
  statut: 'actif' | 'inactif' | 'retraite' | 'demission';
  type_contrat: 'titulaire' | 'contractuel' | 'vacataire';
  type_enseignant: 'instituteur' | 'professeur' | 'administratif';
  salaire?: number;
  created_at: string;
  nombre_classes?: number;
  classes_principales?: string;
  matieres_enseignees?: string;
  avatar_url?: string;
  fonction?: string;
  departement?: string;
}

export interface Matiere {
  id: number;
  nom: string;
  niveau: 'primaire' | 'college' | 'lycee';
  couleur?: string;
  icone?: string;
}

export interface FiltresEnseignants {
  recherche?: string;
  specialite?: string;
  statut?: string;
  type_contrat?: string;
  type_enseignant?: string;
  genre?: string;
  fonction?: string;
  departement?: string;
}

export interface Classe {
  id: number;
  nom: string;
  niveau: string;
  nom_complet: string;
  cycle: string;
  professeur_principal_id?: number;
  created_at: string;
}

export class EnseignantsService {
  
  // MÉTHODE : Obtenir tous les enseignants avec filtres
  static async obtenirEnseignants(filtres: FiltresEnseignants = {}): Promise<{success: boolean, enseignants?: Enseignant[], erreur?: string}> {
    try {
      console.log('🔍 Début récupération personnel avec filtres:', filtres);
      
      let sql = `
        SELECT 
          e.id,
          e.user_id,
          e.matricule,
          e.date_naissance,
          e.lieu_naissance,
          e.genre,
          e.adresse,
          e.telephone,
          e.specialite,
          e.diplome,
          e.date_embauche,
          e.statut,
          e.type_contrat,
          e.type_enseignant,
          e.matieres_enseignees,
          e.salaire,
          e.created_at,
          e.avatar_url,
          e.fonction,
          e.departement,
          u.nom,
          u.prenom,
          u.email,
          COUNT(DISTINCT c.id) as nombre_classes,
          GROUP_CONCAT(DISTINCT CONCAT(c.niveau, ' ', c.nom) SEPARATOR ', ') as classes_principales
        FROM enseignants e
        INNER JOIN users u ON e.user_id = u.id
        LEFT JOIN classes c ON e.user_id = c.professeur_principal_id
        WHERE u.role = 'enseignant'
      `;
      
      const params: any[] = [];
      const conditions: string[] = [];

      if (filtres.recherche) {
        conditions.push(`(u.nom LIKE ? OR u.prenom LIKE ? OR e.matricule LIKE ? OR e.specialite LIKE ? OR e.matieres_enseignees LIKE ? OR e.fonction LIKE ?)`);
        params.push(`%${filtres.recherche}%`, `%${filtres.recherche}%`, `%${filtres.recherche}%`, `%${filtres.recherche}%`, `%${filtres.recherche}%`, `%${filtres.recherche}%`);
      }

      if (filtres.specialite) {
        conditions.push(`e.specialite = ?`);
        params.push(filtres.specialite);
      }

      if (filtres.statut) {
        conditions.push(`e.statut = ?`);
        params.push(filtres.statut);
      }

      if (filtres.type_contrat) {
        conditions.push(`e.type_contrat = ?`);
        params.push(filtres.type_contrat);
      }

      if (filtres.type_enseignant) {
        conditions.push(`e.type_enseignant = ?`);
        params.push(filtres.type_enseignant);
      }

      if (filtres.genre) {
        conditions.push(`e.genre = ?`);
        params.push(filtres.genre);
      }

      if (filtres.fonction) {
        conditions.push(`e.fonction = ?`);
        params.push(filtres.fonction);
      }

      if (filtres.departement) {
        conditions.push(`e.departement = ?`);
        params.push(filtres.departement);
      }

      if (conditions.length > 0) {
        sql += ` AND ${conditions.join(' AND ')}`;
      }

      sql += ` GROUP BY e.id`;
      sql += ` ORDER BY e.type_enseignant, u.nom, u.prenom`;

      console.log('📝 SQL personnel:', sql);
      const result = await query(sql, params);
      const enseignants = result as Enseignant[];
      
      console.log('✅ Personnel récupéré:', enseignants.length);
      return { success: true, enseignants };
    } catch (error: any) {
      console.error('❌ Erreur récupération personnel:', error);
      return { 
        success: false, 
        erreur: `Erreur base de données: ${error.message}` 
      };
    }
  }

  // MÉTHODE : Obtenir toutes les classes disponibles
  // MÉTHODE : Obtenir toutes les classes disponibles
static async obtenirClassesDisponibles(): Promise<{success: boolean, classes?: Classe[], erreur?: string}> {
  try {
    const sql = `
      SELECT 
        c.*,
        CONCAT(c.niveau, ' ', c.nom) as nom_complet,
        u.nom as professeur_nom,
        u.prenom as professeur_prenom,
        COUNT(DISTINCT e.id) as nombre_eleves
      FROM classes c
      LEFT JOIN users u ON c.professeur_principal_id = u.id
      LEFT JOIN eleves e ON c.id = e.classe_id AND e.statut = 'actif'
      GROUP BY c.id, c.nom, c.niveau, c.cycle, c.professeur_principal_id
      ORDER BY 
        CASE c.niveau 
          WHEN 'CP1' THEN 1
          WHEN 'CP2' THEN 2
          WHEN 'CE1' THEN 3
          WHEN 'CE2' THEN 4
          WHEN 'CM1' THEN 5
          WHEN 'CM2' THEN 6
          ELSE 7
        END,
        c.nom
    `;
    
    console.log('📝 [SERVICE] Requête classes disponibles avec nombre d\'élèves');
    const classes = await query(sql) as Classe[];
    
    console.log(`✅ [SERVICE] ${classes.length} classes récupérées`);
    
    // Debug: Afficher les premières classes
    classes.slice(0, 5).forEach((classe, index) => {
      console.log(`   ${index + 1}. ${classe.nom_complet} - Prof: ${classe.professeur_principal_id || 'Aucun'}`);
    });
    
    return { success: true, classes };
  } catch (error: any) {
    console.error('❌ [SERVICE] Erreur récupération classes:', error);
    return { success: false, erreur: 'Erreur lors de la récupération des classes: ' + error.message };
  }
}

  // MÉTHODE : Attribuer une classe à un enseignant
  static async attribuerClasse(enseignantId: number, classeId: number): Promise<{success: boolean, erreur?: string}> {
    try {
      console.log('🔄 [SERVICE] Début attribution classe');
      console.log('📝 [SERVICE] Enseignant ID:', enseignantId, 'Classe ID:', classeId);
      
      // Vérifier que l'ID enseignant est valide
      if (!enseignantId || isNaN(enseignantId)) {
        console.error('❌ [SERVICE] ID enseignant invalide:', enseignantId);
        return { success: false, erreur: 'ID enseignant invalide' };
      }
      
      // Récupérer l'enseignant avec jointure sur users
      const sqlEnseignant = `
        SELECT e.id, e.user_id, e.matricule, u.nom, u.prenom 
        FROM enseignants e 
        INNER JOIN users u ON e.user_id = u.id 
        WHERE e.id = ?
      `;
      
      console.log('🔍 [SERVICE] Requête SQL enseignant:', sqlEnseignant, 'avec param:', enseignantId);
      
      const enseignants = await query(sqlEnseignant, [enseignantId]) as any[];
      
      console.log('🔍 [SERVICE] Résultat requête enseignant:', enseignants);
      
      if (enseignants.length === 0) {
        console.error('❌ [SERVICE] Enseignant non trouvé avec ID:', enseignantId);
        return { success: false, erreur: 'Enseignant non trouvé. ID: ' + enseignantId };
      }
      
      const enseignant = enseignants[0];
      const userId = enseignant.user_id;
      
      console.log('✅ [SERVICE] Enseignant trouvé:', {
        id: enseignant.id,
        userId: userId,
        matricule: enseignant.matricule,
        nom: `${enseignant.prenom} ${enseignant.nom}`
      });
      
      // Vérifier si la classe existe
      const sqlVerif = 'SELECT id, nom, niveau, professeur_principal_id FROM classes WHERE id = ?';
      const classes = await query(sqlVerif, [classeId]) as any[];
      
      if (classes.length === 0) {
        console.error('❌ [SERVICE] Classe non trouvée avec ID:', classeId);
        return { success: false, erreur: 'Classe non trouvée' };
      }
      
      const classe = classes[0];
      console.log('✅ [SERVICE] Classe trouvée:', {
        id: classe.id,
        nom: classe.nom,
        niveau: classe.niveau,
        professeur_actuel: classe.professeur_principal_id
      });
      
      // Vérifier si la classe est déjà attribuée à cet enseignant
      if (classe.professeur_principal_id === userId) {
        console.log('ℹ️ [SERVICE] Classe déjà attribuée au même enseignant');
        return { success: false, erreur: 'Cette classe est déjà attribuée à cet enseignant' };
      }
      
      // Vérifier si la classe est déjà attribuée à un autre enseignant
      if (classe.professeur_principal_id && classe.professeur_principal_id !== userId) {
        console.log('⚠️ [SERVICE] Classe déjà attribuée à un autre enseignant');
        
        // Récupérer le nom de l'enseignant actuel
        const sqlProfesseurActuel = 'SELECT nom, prenom FROM users WHERE id = ?';
        const professeurActuel = await query(sqlProfesseurActuel, [classe.professeur_principal_id]) as any[];
        
        let message = 'Cette classe est déjà attribuée à un autre enseignant';
        if (professeurActuel.length > 0) {
          message = `Cette classe est déjà attribuée à ${professeurActuel[0].prenom} ${professeurActuel[0].nom}`;
        }
        
        return { success: false, erreur: message };
      }
      
      // Attribuer la classe
      const sqlUpdate = 'UPDATE classes SET professeur_principal_id = ? WHERE id = ?';
      console.log('📝 [SERVICE] Attribution de la classe:', {
        classe: classe.nom,
        à: `${enseignant.prenom} ${enseignant.nom}`,
        userId: userId
      });
      
      await query(sqlUpdate, [userId, classeId]);
      
      console.log('✅ [SERVICE] Classe attribuée avec succès');
      return { success: true };
      
    } catch (error: any) {
      console.error('❌ [SERVICE] Erreur attribution classe:', error);
      console.error('❌ [SERVICE] Détails:', error.message);
      return { success: false, erreur: 'Erreur base de données: ' + error.message };
    }
  }

  // MÉTHODE : Retirer une classe d'un enseignant
  static async retirerClasse(enseignantId: number, classeId: number): Promise<{success: boolean, erreur?: string}> {
    try {
      console.log('🔄 [SERVICE] Début retrait classe');
      console.log('📝 [SERVICE] Enseignant ID:', enseignantId, 'Classe ID:', classeId);
      
      // Vérifier que l'enseignant existe
      const sqlEnseignant = 'SELECT user_id FROM enseignants WHERE id = ?';
      const enseignants = await query(sqlEnseignant, [enseignantId]) as any[];
      
      if (enseignants.length === 0) {
        return { success: false, erreur: 'Enseignant non trouvé' };
      }
      
      const userId = enseignants[0].user_id;
      
      // Vérifier que la classe existe et qu'elle est bien attribuée à cet enseignant
      const sqlVerif = 'SELECT id, nom, professeur_principal_id FROM classes WHERE id = ?';
      const classes = await query(sqlVerif, [classeId]) as any[];
      
      if (classes.length === 0) {
        return { success: false, erreur: 'Classe non trouvée' };
      }
      
      const classe = classes[0];
      
      // Vérifier que la classe est bien attribuée à cet enseignant
      if (classe.professeur_principal_id !== userId) {
        return { 
          success: false, 
          erreur: 'Cette classe n\'est pas attribuée à cet enseignant' 
        };
      }
      
      // Retirer la classe (mettre à NULL le professeur_principal_id)
      const sqlUpdate = 'UPDATE classes SET professeur_principal_id = NULL WHERE id = ?';
      await query(sqlUpdate, [classeId]);
      
      console.log('✅ [SERVICE] Classe retirée avec succès');
      return { success: true };
      
    } catch (error: any) {
      console.error('❌ [SERVICE] Erreur retrait classe:', error);
      return { success: false, erreur: 'Erreur lors du retrait de la classe: ' + error.message };
    }
  }

  // MÉTHODE : Obtenir les classes d'un enseignant
  static async obtenirClassesEnseignant(enseignantId: number): Promise<{success: boolean, classes?: Classe[], erreur?: string}> {
    try {
      console.log('🔄 [SERVICE] Récupération classes enseignant ID:', enseignantId);
      
      // D'abord, récupérer le user_id de l'enseignant
      const sqlUser = 'SELECT user_id FROM enseignants WHERE id = ?';
      const enseignants = await query(sqlUser, [enseignantId]) as any[];
      
      if (enseignants.length === 0) {
        return { success: false, erreur: 'Enseignant non trouvé' };
      }
      
      const userId = enseignants[0].user_id;
      
      // Ensuite, récupérer les classes où cet utilisateur est professeur principal
      const sql = `
        SELECT 
          c.*,
          CONCAT(c.niveau, ' ', c.nom) as nom_complet,
          u.nom as professeur_nom,
          u.prenom as professeur_prenom,
          COUNT(DISTINCT e.id) as nombre_eleves
        FROM classes c
        LEFT JOIN users u ON c.professeur_principal_id = u.id
        LEFT JOIN eleves e ON c.id = e.classe_id AND e.statut = 'actif'
        WHERE c.professeur_principal_id = ?
        GROUP BY c.id, c.nom, c.niveau, c.cycle, c.professeur_principal_id
        ORDER BY 
          CASE c.niveau 
            WHEN 'CP1' THEN 1
            WHEN 'CP2' THEN 2
            WHEN 'CE1' THEN 3
            WHEN 'CE2' THEN 4
            WHEN 'CM1' THEN 5
            WHEN 'CM2' THEN 6
            ELSE 7
          END,
          c.nom
      `;
      
      console.log('📝 [SERVICE] Requête SQL pour classes enseignant:', sql);
      console.log('🔍 [SERVICE] User ID recherché:', userId);
      
      const classes = await query(sql, [userId]) as Classe[];
      
      console.log('✅ [SERVICE] Classes trouvées:', classes.length);
      classes.forEach(classe => {
        console.log(`   - ${classe.nom_complet} (ID: ${classe.id})`);
      });
      
      return { success: true, classes };
    } catch (error: any) {
      console.error('❌ [SERVICE] Erreur récupération classes enseignant:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des classes: ' + error.message };
    }
  }

  // MÉTHODE : Obtenir un enseignant par ID
  static async obtenirEnseignantParId(id: number): Promise<{success: boolean, enseignant?: Enseignant, erreur?: string}> {
    try {
      const sql = `
        SELECT 
          e.*,
          u.nom,
          u.prenom,
          u.email,
          COUNT(DISTINCT c.id) as nombre_classes,
          GROUP_CONCAT(DISTINCT c.nom SEPARATOR ', ') as classes_principales
        FROM enseignants e
        INNER JOIN users u ON e.user_id = u.id
        LEFT JOIN classes c ON e.user_id = c.professeur_principal_id
        WHERE e.id = ?
        GROUP BY e.id, e.user_id, e.matricule, u.nom, u.prenom, u.email
      `;
      const enseignants = await query(sql, [id]) as Enseignant[];
      
      if (enseignants.length === 0) {
        return { success: false, erreur: 'Enseignant non trouvé' };
      }

      return { success: true, enseignant: enseignants[0] };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'enseignant:', error);
      return { success: false, erreur: 'Erreur lors de la récupération de l\'enseignant' };
    }
  }

  // MÉTHODE : Obtenir un enseignant par user_id
  static async obtenirEnseignantParUserId(userId: number): Promise<{success: boolean, enseignant?: Enseignant, erreur?: string}> {
    try {
      const sql = `
        SELECT 
          e.*,
          u.nom,
          u.prenom,
          u.email,
          COUNT(DISTINCT c.id) as nombre_classes,
          GROUP_CONCAT(DISTINCT c.nom SEPARATOR ', ') as classes_principales
        FROM enseignants e
        INNER JOIN users u ON e.user_id = u.id
        LEFT JOIN classes c ON e.user_id = c.professeur_principal_id
        WHERE e.user_id = ?
        GROUP BY e.id, e.user_id, e.matricule, u.nom, u.prenom, u.email
      `;
      const enseignants = await query(sql, [userId]) as Enseignant[];
      
      if (enseignants.length === 0) {
        return { success: false, erreur: 'Enseignant non trouvé' };
      }

      return { success: true, enseignant: enseignants[0] };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'enseignant par user_id:', error);
      return { success: false, erreur: 'Erreur lors de la récupération de l\'enseignant' };
    }
  }

  // MÉTHODE : Obtenir les spécialités
  static async obtenirSpecialites(): Promise<{success: boolean, specialites?: string[], erreur?: string}> {
    try {
      // Essayer de récupérer depuis la base de données
      const sql = 'SELECT DISTINCT specialite FROM enseignants WHERE specialite IS NOT NULL AND specialite != "" ORDER BY specialite';
      const result = await query(sql) as any[];
      const specialitesBDD = result.map(row => row.specialite).filter(Boolean);

      // Liste de spécialités par défaut organisée
      const specialitesParDefaut = [
        'Français',
        'Mathématiques',
        'Histoire-Géographie',
        'Anglais',
        'Espagnol',
        'Allemand',
        'SVT',
        'Physique-Chimie',
        'SES',
        'SNT',
        'EPS',
        'ECM',
        'Philosophie',
        'Sciences de l\'Ingénieur',
        'Littérature',
        'Éducation Civique, Juridique et Sociale',
        'Travaux Personnels Encadrés',
        'Latin',
        'Grec Ancien',
        'Arts Plastiques',
        'Musique',
        'Théâtre',
        'Cinéma',
        'Informatique',
        'Management et Gestion'
      ];

      // Fusionner et supprimer les doublons
      const toutesSpecialites = [...new Set([...specialitesBDD, ...specialitesParDefaut])];
      
      // Trier par ordre alphabétique
      const specialitesTriees = toutesSpecialites.sort((a, b) => a.localeCompare(b));

      return { success: true, specialites: specialitesTriees };
    } catch (error) {
      console.error('Erreur lors de la récupération des spécialités:', error);
      
      // Retourner la liste organisée par défaut en cas d'erreur
      const specialitesSecours = [
        'Français',
        'Mathématiques',
        'Histoire-Géographie',
        'Langue Vivante 1 (Anglais)',
        'Sciences de la Vie et de la Terre (SVT)',
        'Physique-Chimie',
        'Éducation Physique et Sportive (EPS)',
        'Sciences Économiques et Sociales (SES)',
        'Philosophie'
      ].sort((a, b) => a.localeCompare(b));
      
      return { success: true, specialites: specialitesSecours };
    }
  }

  // MÉTHODE : Obtenir les matières
  static async obtenirMatieres(): Promise<{success: boolean, matieres?: Matiere[], erreur?: string}> {
    try {
      const sql = `
        SELECT * FROM matieres 
        WHERE statut = 'actif'
        ORDER BY niveau, nom
      `;
      const matieres = await query(sql) as Matiere[];
      return { success: true, matieres };
    } catch (error) {
      console.error('Erreur lors de la récupération des matières:', error);
      // Liste par défaut si la table n'existe pas
      const matieresParDefaut: Matiere[] = [
        { id: 1, nom: 'Mathématiques', niveau: 'primaire', couleur: '#3B82F6', icone: '➕' },
        { id: 2, nom: 'Français', niveau: 'primaire', couleur: '#10B981', icone: '📖' },
        { id: 3, nom: 'Sciences', niveau: 'primaire', couleur: '#8B5CF6', icone: '🔬' },
        { id: 4, nom: 'Histoire-Géographie', niveau: 'primaire', couleur: '#F59E0B', icone: '🌍' },
        { id: 5, nom: 'Arts Plastiques', niveau: 'primaire', couleur: '#EC4899', icone: '🎨' },
        { id: 6, nom: 'Éducation Physique', niveau: 'primaire', couleur: '#EF4444', icone: '⚽' },
        { id: 7, nom: 'Anglais', niveau: 'primaire', couleur: '#6366F1', icone: '🔠' }
      ];
      return { success: true, matieres: matieresParDefaut };
    }
  }

  // MÉTHODE : Créer un enseignant
  static async creerEnseignant(enseignantData: any): Promise<{success: boolean, enseignant?: Enseignant, erreur?: string}> {
  try {
    console.log('🔄 [SERVICE] Début création membre du personnel:', enseignantData);
    
    // Si pas de matricule fourni, générer une suggestion
    let matricule = enseignantData.matricule;
    if (!matricule) {
      const annee = new Date().getFullYear().toString().slice(-2);
      const random = Math.random().toString(36).substr(2, 6).toUpperCase();
      matricule = `EMP${annee}${random}`;
    }
    
    // Vérifier l'unicité du matricule
    const sqlVerifMatricule = 'SELECT id FROM enseignants WHERE matricule = ?';
    const matriculeExiste = await query(sqlVerifMatricule, [matricule]) as any[];
    
    if (matriculeExiste.length > 0) {
      return { success: false, erreur: 'Ce matricule existe déjà. Veuillez en choisir un autre.' };
    }
      
    // Vérifier l'email
    const sqlVerifEmail = 'SELECT id FROM users WHERE email = ?';
    const emailExiste = await query(sqlVerifEmail, [enseignantData.email]) as any[];
    
    if (emailExiste.length > 0) {
      return { success: false, erreur: 'Un utilisateur avec cet email existe déjà' };
    }
    
    // Utiliser le mot de passe fourni ou le mot de passe par défaut
    const motDePasse = enseignantData.password || 'Scolarion26';
    const sel = await bcrypt.genSalt(10);
    const motDePasseHash = await bcrypt.hash(motDePasse, sel);
    
    // Créer l'utilisateur
    const sqlUser = `
      INSERT INTO users (email, password, nom, prenom, role, statut)
      VALUES (?, ?, ?, ?, 'enseignant', ?)
    `;
    
    const paramsUser = [
      enseignantData.email,
      motDePasseHash,
      enseignantData.nom,
      enseignantData.prenom,
      enseignantData.statut || 'actif'
    ];

    console.log('📝 [SERVICE] Création utilisateur avec mot de passe personnalisé');
    
    const resultUser = await query(sqlUser, paramsUser) as any;
    const userId = resultUser.insertId;

    console.log('✅ [SERVICE] Utilisateur créé avec ID:', userId);
    
    // Créer l'enseignant
    const sqlEnseignant = `
      INSERT INTO enseignants (
        user_id, matricule, date_naissance, lieu_naissance, genre, 
        adresse, telephone, specialite, diplome, date_embauche, 
        statut, type_contrat, type_enseignant, matieres_enseignees, salaire, avatar_url,
        fonction, departement
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const paramsEnseignant = [
      userId,
      matricule,
      enseignantData.date_naissance || null,
      enseignantData.lieu_naissance || null,
      enseignantData.genre,
      enseignantData.adresse || null,
      enseignantData.telephone || null,
      enseignantData.type_enseignant === 'professeur' ? enseignantData.specialite || null : null,
      enseignantData.diplome || null,
      enseignantData.date_embauche || new Date().toISOString().split('T')[0],
      enseignantData.statut || 'actif',
      enseignantData.type_contrat || 'titulaire',
      enseignantData.type_enseignant,
      enseignantData.type_enseignant === 'instituteur' ? enseignantData.matieres_enseignees : null,
      enseignantData.salaire || null,
      enseignantData.avatar_url || null,
      enseignantData.type_enseignant === 'administratif' ? 
        (enseignantData.fonction ? `ADMIN - ${enseignantData.fonction}` : null) : 
        (enseignantData.fonction || null),
      enseignantData.departement || null
    ];

    console.log('📝 Création avec fonction:', paramsEnseignant[16], 'Type:', enseignantData.type_enseignant);
    
    await query(sqlEnseignant, paramsEnseignant);

    console.log('✅ [SERVICE] Membre du personnel créé avec succès');
    
    // Récupérer le nouveau membre
    const nouveauMembre = await this.obtenirEnseignantParUserId(userId);
    
    return {
      success: true,
      enseignant: nouveauMembre.enseignant
    };
    
  } catch (error: any) {
    console.error('❌ [SERVICE] Erreur création membre:', error);
    return { 
      success: false, 
      erreur: `Erreur lors de la création: ${error.message || 'Erreur inconnue'}` 
    };
  }
}

  // MÉTHODE : Mettre à jour un enseignant
static async mettreAJourEnseignant(id: number, enseignantData: any): Promise<{success: boolean, enseignant?: Enseignant, erreur?: string}> {
  try {
    console.log('🔄 Mise à jour membre ID:', id, 'Données reçues:', enseignantData);

    // 1. Vérifier si le membre existe
    const membreExiste = await this.obtenirEnseignantParId(id);
    if (!membreExiste.success || !membreExiste.enseignant) {
      return { success: false, erreur: 'Membre non trouvé' };
    }

    const userId = membreExiste.enseignant.user_id;
    const ancienType = membreExiste.enseignant.type_enseignant;
    const nouveauType = enseignantData.type_enseignant || ancienType;

    console.log('📝 Ancien type:', ancienType, 'Nouveau type:', nouveauType);

    // 2. Mise à jour de l'utilisateur (table users)
    const updatesUser = [];
    const paramsUser = [];
    
    if (enseignantData.nom !== undefined) {
      updatesUser.push('nom = ?');
      paramsUser.push(enseignantData.nom);
    }
    if (enseignantData.prenom !== undefined) {
      updatesUser.push('prenom = ?');
      paramsUser.push(enseignantData.prenom);
    }
    if (enseignantData.email !== undefined) {
      // Vérifier si l'email existe déjà pour un autre utilisateur
      if (enseignantData.email !== membreExiste.enseignant.email) {
        const sqlVerifEmail = 'SELECT id FROM users WHERE email = ? AND id != ?';
        const emailExiste = await query(sqlVerifEmail, [enseignantData.email, userId]) as any[];
        
        if (emailExiste.length > 0) {
          return { success: false, erreur: 'Un utilisateur avec cet email existe déjà' };
        }
      }
      updatesUser.push('email = ?');
      paramsUser.push(enseignantData.email);
    }

    // 3. Mise à jour de l'enseignant (table enseignants)
    const updatesEnseignant = [];
    const paramsEnseignant = [];

    // Champs communs à tous les types
    const champsCommuns = [
      'matricule', 'date_naissance', 'lieu_naissance', 'genre', 
      'adresse', 'telephone', 'diplome', 'date_embauche', 
      'statut', 'type_contrat', 'type_enseignant', 'salaire', 'avatar_url'
    ];

    // Traiter chaque champ commun
    for (const champ of champsCommuns) {
      if (enseignantData[champ] !== undefined) {
        updatesEnseignant.push(`${champ} = ?`);
        
        // Traitement spécial selon le type de champ
        if (champ === 'salaire') {
          paramsEnseignant.push(enseignantData[champ] ? parseFloat(enseignantData[champ]) : null);
        } else if (champ === 'date_naissance' || champ === 'date_embauche') {
          // Convertir les dates au format MySQL
          paramsEnseignant.push(enseignantData[champ] ? 
            new Date(enseignantData[champ]).toISOString().split('T')[0] : null);
        } else if (enseignantData[champ] === '' || enseignantData[champ] === null) {
          paramsEnseignant.push(null);
        } else {
          paramsEnseignant.push(enseignantData[champ]);
        }
      }
    }

    // 4. GESTION SPÉCIFIQUE AU TYPE DE PERSONNEL
    // Important: Nettoyer les champs qui ne sont pas pertinents pour le type
    
    // A. Si c'est un PROFESSEUR
    if (nouveauType === 'professeur') {
      console.log('👨‍🏫 Mise à jour pour un PROFESSEUR');
      
      // Spécialité obligatoire pour professeur
      if (enseignantData.specialite !== undefined) {
        updatesEnseignant.push('specialite = ?');
        paramsEnseignant.push(enseignantData.specialite || null);
      }
      
      // Nettoyer les champs des autres types
      updatesEnseignant.push('matieres_enseignees = NULL');
      
      // Pour professeur, fonction et département peuvent être conservés si existants
      // ou être nettoyés si spécifiés comme vides
      if (enseignantData.fonction !== undefined) {
        updatesEnseignant.push('fonction = ?');
        paramsEnseignant.push(enseignantData.fonction || null);
      }
      if (enseignantData.departement !== undefined) {
        updatesEnseignant.push('departement = ?');
        paramsEnseignant.push(enseignantData.departement || null);
      }
    }
    
    // B. Si c'est un INSTITUTEUR
    else if (nouveauType === 'instituteur') {
      console.log('🏫 Mise à jour pour un INSTITUTEUR');
      
      // Matières enseignées pour instituteur
      if (enseignantData.matieres_enseignees !== undefined) {
        updatesEnseignant.push('matieres_enseignees = ?');
        paramsEnseignant.push(enseignantData.matieres_enseignees || null);
      }
      
      // Nettoyer le champ spécialité (réservé aux professeurs)
      updatesEnseignant.push('specialite = NULL');
      
      // Pour instituteur, fonction et département peuvent être conservés
      if (enseignantData.fonction !== undefined) {
        updatesEnseignant.push('fonction = ?');
        paramsEnseignant.push(enseignantData.fonction || null);
      }
      if (enseignantData.departement !== undefined) {
        updatesEnseignant.push('departement = ?');
        paramsEnseignant.push(enseignantData.departement || null);
      }
    }
    
// C. Si c'est un ADMINISTRATIF
else if (nouveauType === 'administratif') {
  console.log('👨‍💼 Mise à jour pour un ADMINISTRATIF');
  
  // Fonction obligatoire pour administratif
  if (enseignantData.fonction !== undefined) {
    // Ajouter le préfixe "ADMIN - " si pas déjà présent
    let fonctionAvecPrefixe = enseignantData.fonction;
    
    if (fonctionAvecPrefixe && !fonctionAvecPrefixe.startsWith('ADMIN - ')) {
      fonctionAvecPrefixe = `ADMIN - ${fonctionAvecPrefixe}`;
    }
    
    updatesEnseignant.push('fonction = ?');
    paramsEnseignant.push(fonctionAvecPrefixe || null);
  }
  
  // Département pour administratif
  if (enseignantData.departement !== undefined) {
    updatesEnseignant.push('departement = ?');
    paramsEnseignant.push(enseignantData.departement || null);
  }
  
  // IMPORTANT: Nettoyer les champs d'enseignement
  updatesEnseignant.push('specialite = NULL');
  updatesEnseignant.push('matieres_enseignees = NULL');
  
  // FORCER le type à administratif
  updatesEnseignant.push('type_enseignant = ?');
  paramsEnseignant.push('administratif');
}

// 5. Validation du matricule (SI MODIFIÉ) - VERSION SÉCURISÉE
if (enseignantData.matricule !== undefined && enseignantData.matricule !== membreExiste.enseignant.matricule) {
  const nouveauMatricule = enseignantData.matricule;
  
  // Vérifier seulement l'unicité
  const sqlVerifMatricule = 'SELECT id FROM enseignants WHERE matricule = ? AND id != ?';
  const matriculeExiste = await query(sqlVerifMatricule, [nouveauMatricule, id]) as any[];
  
  if (matriculeExiste.length > 0) {
    return { 
      success: false, 
      erreur: 'Ce matricule existe déjà. Veuillez en choisir un autre.' 
    };
  }
  
  console.log('✅ Matricule unique validé:', nouveauMatricule);
  
  const typeRecu = enseignantData.type_enseignant;
  const typeExistant = membreExiste.enseignant.type_enseignant;
  
}

    // 6. EXÉCUTION DES MISES À JOUR
    console.log('📊 Mise à jour en cours...');

    // Mise à jour de l'utilisateur
    if (updatesUser.length > 0) {
      paramsUser.push(userId);
      const sqlUser = `UPDATE users SET ${updatesUser.join(', ')} WHERE id = ?`;
      console.log('📝 SQL User:', sqlUser, paramsUser);
      await query(sqlUser, paramsUser);
    }

    // Mise à jour de l'enseignant
    if (updatesEnseignant.length > 0) {
      paramsEnseignant.push(id);
      const sqlEnseignant = `UPDATE enseignants SET ${updatesEnseignant.join(', ')} WHERE id = ?`;
      console.log('📝 SQL Enseignant:', sqlEnseignant, paramsEnseignant);
      await query(sqlEnseignant, paramsEnseignant);
    }

    console.log('✅ Mise à jour terminée avec succès');

    // 7. Récupérer l'enseignant mis à jour
    const enseignantMisAJour = await this.obtenirEnseignantParId(id);
    return enseignantMisAJour;

  } catch (error: any) {
    console.error('❌ Erreur détaillée mise à jour enseignant:', error);
    console.error('❌ Stack trace:', error.stack);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return { 
        success: false, 
        erreur: 'Un enseignant avec cet email ou ce matricule existe déjà' 
      };
    }
    
    return { 
      success: false, 
      erreur: `Erreur lors de la mise à jour: ${error.message || 'Erreur inconnue'}` 
    };
  }
}

  // MÉTHODE : Supprimer un enseignant
  static async supprimerEnseignant(id: number): Promise<{success: boolean, erreur?: string}> {
    try {
      console.log('🗑️ Début suppression enseignant - ID:', id);

      // Vérifier si l'enseignant existe
      const enseignantExiste = await this.obtenirEnseignantParId(id);
      if (!enseignantExiste.success || !enseignantExiste.enseignant) {
        return { success: false, erreur: 'Enseignant non trouvé' };
      }

      const userId = enseignantExiste.enseignant.user_id;

      // Vérifier si l'enseignant est professeur principal de classes
      const sqlVerifClasses = `
        SELECT COUNT(*) as count, GROUP_CONCAT(c.nom) as classes 
        FROM classes c 
        WHERE c.professeur_principal_id = ?
      `;
      const resultVerif = await query(sqlVerifClasses, [userId]) as any[];
      
      if (resultVerif[0].count > 0) {
        const classes = resultVerif[0].classes;
        return { 
          success: false, 
          erreur: `Impossible de supprimer cet enseignant car il est professeur principal des classes: ${classes}. Veuillez d'abord réassigner ces classes.` 
        };
      }

      // Supprimer l'enseignant
      const sqlDeleteEnseignant = 'DELETE FROM enseignants WHERE id = ?';
      await query(sqlDeleteEnseignant, [id]);

      // Supprimer l'utilisateur
      const sqlDeleteUser = 'DELETE FROM users WHERE id = ?';
      await query(sqlDeleteUser, [userId]);

      console.log('✅ Enseignant supprimé avec succès');
      return { success: true };

    } catch (error: any) {
      console.error('❌ Erreur détaillée suppression enseignant:', error);
      
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED') {
        return { 
          success: false, 
          erreur: 'Impossible de supprimer cet enseignant car il est référencé dans d\'autres tables.' 
        };
      }
      
      return { 
        success: false, 
        erreur: `Erreur lors de la suppression: ${error.message || 'Erreur inconnue'}` 
      };
    }
  }

  // MÉTHODE : Obtenir les statistiques générales
  static async obtenirStatistiques(): Promise<{success: boolean, statistiques?: any, erreur?: string}> {
    try {
      const sqlTotal = 'SELECT COUNT(*) as total FROM enseignants';
      const sqlParStatut = 'SELECT statut, COUNT(*) as count FROM enseignants GROUP BY statut';
      const sqlParTypeContrat = 'SELECT type_contrat, COUNT(*) as count FROM enseignants GROUP BY type_contrat';
      const sqlParSpecialite = 'SELECT specialite, COUNT(*) as count FROM enseignants WHERE specialite IS NOT NULL GROUP BY specialite';
      const sqlParGenre = 'SELECT genre, COUNT(*) as count FROM enseignants GROUP BY genre';

      const [total, parStatut, parTypeContrat, parSpecialite, parGenre] = await Promise.all([
        query(sqlTotal),
        query(sqlParStatut),
        query(sqlParTypeContrat),
        query(sqlParSpecialite),
        query(sqlParGenre)
      ]);

      return {
        success: true,
        statistiques: {
          total: (total as any[])[0].total,
          parStatut: parStatut as any[],
          parTypeContrat: parTypeContrat as any[],
          parSpecialite: parSpecialite as any[],
          parGenre: parGenre as any[]
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des statistiques' };
    }
  }

  // MÉTHODE : Obtenir les statistiques par type
// MÉTHODE : Obtenir les statistiques par type
static async obtenirStatistiquesParType(): Promise<{success: boolean, statistiques?: any, erreur?: string}> {
  try {
    // REQUÊTE CORRIGÉE : gérer correctement les types
    const sqlParType = `
      SELECT 
        CASE 
          WHEN fonction LIKE 'ADMIN -%' THEN 'administratif'
          ELSE type_enseignant 
        END as type_personnel,
        COUNT(*) as total,
        SUM(CASE WHEN statut = 'actif' THEN 1 ELSE 0 END) as actifs,
        SUM(CASE WHEN genre = 'M' THEN 1 ELSE 0 END) as hommes,
        SUM(CASE WHEN genre = 'F' THEN 1 ELSE 0 END) as femmes
      FROM enseignants 
      GROUP BY 
        CASE 
          WHEN fonction LIKE 'ADMIN -%' THEN 'administratif'
          ELSE type_enseignant 
        END
      ORDER BY type_personnel
    `;
    
    const sqlMatieresInstituteurs = `
      SELECT 
        COUNT(DISTINCT id) as total_instituteurs,
        GROUP_CONCAT(DISTINCT matieres_enseignees) as toutes_matieres
      FROM enseignants 
      WHERE type_enseignant = 'instituteur' 
        AND matieres_enseignees IS NOT NULL 
        AND matieres_enseignees != ''
    `;

    const [parType, matieresData] = await Promise.all([
      query(sqlParType),
      query(sqlMatieresInstituteurs)
    ]);

    console.log('📊 Statistiques par type récupérées:', parType);

    // Analyser les matières enseignées par les instituteurs
    const matieresInstituteurs = new Set<string>();
    if (matieresData && (matieresData as any[]).length > 0 && (matieresData as any[])[0].toutes_matieres) {
      const toutesMatieres = (matieresData as any[])[0].toutes_matieres;
      toutesMatieres.split(',')
        .map((m: string) => m.trim())
        .filter((m: string) => m)
        .forEach((matiere: string) => matieresInstituteurs.add(matiere));
    }

    return {
      success: true,
      statistiques: {
        parType: parType as any[],
        matieresInstituteurs: Array.from(matieresInstituteurs),
        totalMatieresInstituteurs: matieresInstituteurs.size
      }
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques par type:', error);
    return { success: false, erreur: 'Erreur lors de la récupération des statistiques' };
  }
}

  // MÉTHODE : Obtenir les classes par enseignant
  static async obtenirClassesParEnseignant(enseignantId: number): Promise<{success: boolean, classes?: any[], erreur?: string}> {
    try {
      const sql = `
        SELECT 
          c.id, c.nom, c.niveau, 
          COUNT(e.id) as nombre_eleves
        FROM classes c
        LEFT JOIN eleves e ON c.id = e.classe_id AND e.statut = 'actif'
        WHERE c.professeur_principal_id IN (
          SELECT user_id FROM enseignants WHERE id = ?
        )
        GROUP BY c.id, c.nom, c.niveau
        ORDER BY c.niveau, c.nom
      `;
      const classes = await query(sql, [enseignantId]) as any[];
      return { success: true, classes };
    } catch (error) {
      console.error('Erreur lors de la récupération des classes de l\'enseignant:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des classes de l\'enseignant' };
    }
  }
}