import { query } from '../lib/database';

export interface Classe {
  id: number;
  nom: string;
  niveau: string;
  professeur_principal_id?: number;
  created_at: string;
  nom_professeur_principal?: string;
  prenom_professeur_principal?: string;
  nombre_eleves?: number;
}

export interface FiltresClasses {
  recherche?: string;
  niveau?: string;
  cycle?: string;
}

export class ClassesService {
  static async obtenirClasses(filtres: FiltresClasses = {}): Promise<{success: boolean, classes?: Classe[], erreur?: string}> {
    try {
      let sql = `
        SELECT 
          c.*,
          CONCAT(p.prenom, ' ', p.nom) as nom_professeur_principal,
          COUNT(e.id) as nombre_eleves
        FROM classes c
        LEFT JOIN users p ON c.professeur_principal_id = p.id AND p.role = 'enseignant'
        LEFT JOIN eleves e ON c.id = e.classe_id AND e.statut = 'actif'
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filtres.recherche) {
        sql += ` AND (c.nom LIKE ? OR c.niveau LIKE ?)`;
        params.push(`%${filtres.recherche}%`, `%${filtres.recherche}%`);
      }

      if (filtres.niveau) {
        sql += ` AND c.niveau = ?`;
        params.push(filtres.niveau);
      }

      if (filtres.cycle) {
        sql += ` AND c.cycle = ?`;
        params.push(filtres.cycle);
      }

      sql += ` GROUP BY c.id, c.nom, c.niveau, c.professeur_principal_id, c.created_at, p.prenom, p.nom`;
      sql += ` ORDER BY 
        CASE 
          WHEN c.niveau = '6ème' THEN 1
          WHEN c.niveau = '5ème' THEN 2
          WHEN c.niveau = '4ème' THEN 3
          WHEN c.niveau = '3ème' THEN 4
          WHEN c.niveau = 'Seconde' THEN 5
          WHEN c.niveau = 'Première' THEN 6
          WHEN c.niveau = 'Terminale' THEN 7
          ELSE 8
        END, c.nom`;

      const classes = await query(sql, params) as Classe[];
      return { success: true, classes };
    } catch (error) {
      console.error('Erreur lors de la récupération des classes:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des classes' };
    }
  }

  static async obtenirClasseParId(id: number): Promise<{success: boolean, classe?: Classe, erreur?: string}> {
    try {
      const sql = `
        SELECT 
          c.*,
          CONCAT(p.prenom, ' ', p.nom) as nom_professeur_principal,
          COUNT(e.id) as nombre_eleves
        FROM classes c
        LEFT JOIN users p ON c.professeur_principal_id = p.id AND p.role = 'enseignant'
        LEFT JOIN eleves e ON c.id = e.classe_id AND e.statut = 'actif'
        WHERE c.id = ?
        GROUP BY c.id, c.nom, c.niveau, c.professeur_principal_id, c.created_at, p.prenom, p.nom
      `;
      const classes = await query(sql, [id]) as Classe[];
      
      if (classes.length === 0) {
        return { success: false, erreur: 'Classe non trouvée' };
      }

      return { success: true, classe: classes[0] };
    } catch (error) {
      console.error('Erreur lors de la récupération de la classe:', error);
      return { success: false, erreur: 'Erreur lors de la récupération de la classe' };
    }
  }

  static async obtenirProfesseurs(): Promise<{success: boolean, professeurs?: any[], erreur?: string}> {
  try {
    // ✅ CORRECTION : Utiliser des guillemets simples ou des paramètres
    const sql = 'SELECT id, nom, prenom, email FROM users WHERE role = ? AND statut = ? ORDER BY nom, prenom';
    const professeurs = await query(sql, ['enseignant', 'actif']) as any[];
    return { success: true, professeurs };
  } catch (error) {
    console.error('Erreur lors de la récupération des professeurs:', error);
    return { success: false, erreur: 'Erreur lors de la récupération des professeurs' };
  }
}

  static async obtenirNiveaux(): Promise<{success: boolean, niveaux?: string[], erreur?: string}> {
    try {
      const sql = 'SELECT DISTINCT niveau FROM classes ORDER BY niveau';
      const result = await query(sql) as any[];
      const niveaux = result.map(row => row.niveau);
      return { success: true, niveaux };
    } catch (error) {
      console.error('Erreur lors de la récupération des niveaux:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des niveaux' };
    }
  }

  static async obtenirCycles(): Promise<{success: boolean, cycles?: string[], erreur?: string}> {
    try {
      const sql = 'SELECT DISTINCT cycle FROM classes WHERE cycle IS NOT NULL ORDER BY cycle';
      const result = await query(sql) as any[];
      const cycles = result.map(row => row.cycle);
      return { success: true, cycles };
    } catch (error) {
      console.error('Erreur lors de la récupération des cycles:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des cycles' };
    }
  }

static async creerClasse(classeData: Omit<Classe, 'id' | 'created_at' | 'nom_professeur_principal' | 'prenom_professeur_principal' | 'nombre_eleves'>): Promise<{success: boolean, classe?: Classe, erreur?: string}> {
  try {
    // Déterminer le cycle en fonction du niveau
    let cycle = '';
    const niveau = classeData.niveau || '';
    
    if (niveau.includes('6ème') || niveau.includes('5ème') || niveau.includes('4ème') || niveau.includes('3ème')) {
      cycle = 'Collège';
    } else if (niveau.includes('Seconde') || niveau.includes('Première') || niveau.includes('Terminale')) {
      cycle = 'Lycée';
    } else if (niveau.includes('CP') || niveau.includes('CE') || niveau.includes('CM')) {
      cycle = 'Primaire';
    } else {
      cycle = 'Général'; // Valeur par défaut
    }
    
    const sql = `
      INSERT INTO classes (nom, niveau, cycle, professeur_principal_id)
      VALUES (?, ?, ?, ?)
    `;
    
    const params = [
      classeData.nom,
      classeData.niveau,
      cycle, // ✅ AJOUTÉ: le cycle est maintenant fourni
      classeData.professeur_principal_id || null
    ];

    console.log('📝 Insertion classe avec cycle:', cycle);
    
    const result = await query(sql, params) as any;
    const nouvelleClasse = await this.obtenirClasseParId(result.insertId);
    
    return nouvelleClasse;
  } catch (error: any) {
    console.error('Erreur lors de la création de la classe:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, erreur: 'Une classe avec ce nom existe déjà' };
    }
    
    return { success: false, erreur: 'Erreur lors de la création de la classe: ' + error.message };
  }
}

static async mettreAJourClasse(id: number, classeData: Partial<Classe>): Promise<{success: boolean, classe?: Classe, erreur?: string}> {
  try {
    console.log('🔄 Service mise à jour - ID:', id, 'Data:', classeData);
    
    // Vérifier d'abord si la classe existe
    const classeExiste = await this.obtenirClasseParId(id);
    if (!classeExiste.success) {
      return { success: false, erreur: 'Classe non trouvée' };
    }

    const champs = [];
    const params = [];

    // Construire dynamiquement la requête UPDATE
    const champsAutorises = ['nom', 'niveau', 'cycle', 'professeur_principal_id'];

    for (const [key, value] of Object.entries(classeData)) {
      if (champsAutorises.includes(key) && value !== undefined) {
        champs.push(`${key} = ?`);
        
        // Gérer les valeurs null pour professeur_principal_id
        if (key === 'professeur_principal_id') {
          params.push(value === '' || value === null ? null : value);
        } else {
          params.push(value);
        }
      }
    }

    // Si le niveau est modifié mais pas le cycle, recalculer le cycle automatiquement
    if (classeData.niveau && !classeData.cycle) {
      let cycle = '';
      const niveau = classeData.niveau || '';
      
      if (niveau.includes('6ème') || niveau.includes('5ème') || niveau.includes('4ème') || niveau.includes('3ème')) {
        cycle = 'Collège';
      } else if (niveau.includes('Seconde') || niveau.includes('Première') || niveau.includes('Terminale')) {
        cycle = 'Lycée';
      } else if (niveau.includes('CP') || niveau.includes('CE') || niveau.includes('CM')) {
        cycle = 'Primaire';
      } else {
        cycle = 'Général';
      }
      
      champs.push('cycle = ?');
      params.push(cycle);
    }

    if (champs.length === 0) {
      return { success: false, erreur: 'Aucune donnée à mettre à jour' };
    }

    params.push(id);
    const sql = `UPDATE classes SET ${champs.join(', ')} WHERE id = ?`;

    console.log('📝 SQL mise à jour:', sql);
    console.log('🔢 Paramètres:', params);

    const result = await query(sql, params) as any;
    console.log('✅ Résultat mise à jour:', result);

    // Recharger la classe mise à jour
    const classeMiseAJour = await this.obtenirClasseParId(id);
    
    if (!classeMiseAJour.success) {
      return { success: false, erreur: 'Classe non trouvée après mise à jour' };
    }
    
    return classeMiseAJour;
  } catch (error: any) {
    console.error('❌ Erreur mise à jour classe:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return { success: false, erreur: 'Une classe avec ce nom existe déjà' };
    }
    
    return { success: false, erreur: 'Erreur lors de la mise à jour de la classe: ' + error.message };
  }
}

  static async supprimerClasse(id: number): Promise<{success: boolean, erreur?: string}> {
    try {
      // Vérifier s'il y a des élèves dans cette classe
      const sqlVerif = 'SELECT COUNT(*) as count FROM eleves WHERE classe_id = ?';
      const result = await query(sqlVerif, [id]) as any[];
      
      if (result[0].count > 0) {
        return { success: false, erreur: 'Impossible de supprimer cette classe car elle contient des élèves' };
      }

      const sql = 'DELETE FROM classes WHERE id = ?';
      await query(sql, [id]);
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la suppression de la classe:', error);
      return { success: false, erreur: 'Erreur lors de la suppression de la classe' };
    }
  }

  static async obtenirStatistiques(): Promise<{success: boolean, statistiques?: any, erreur?: string}> {
    try {
      const sqlTotal = 'SELECT COUNT(*) as total FROM classes';
      const sqlParNiveau = 'SELECT niveau, COUNT(*) as count FROM classes GROUP BY niveau';
      const sqlParCycle = 'SELECT cycle, COUNT(*) as count FROM classes WHERE cycle IS NOT NULL GROUP BY cycle';
      const sqlCapacite = `
        SELECT 
          c.nom,
          c.niveau,
          c.capacite_max,
          COUNT(e.id) as eleves_actuels,
          ROUND((COUNT(e.id) / c.capacite_max) * 100, 2) as taux_remplissage
        FROM classes c
        LEFT JOIN eleves e ON c.id = e.classe_id AND e.statut = 'actif'
        GROUP BY c.id, c.nom, c.niveau, c.capacite_max
      `;

      const [total, parNiveau, parCycle, capacite] = await Promise.all([
        query(sqlTotal),
        query(sqlParNiveau),
        query(sqlParCycle),
        query(sqlCapacite)
      ]);

      return {
        success: true,
        statistiques: {
          total: (total as any[])[0].total,
          parNiveau: parNiveau as any[],
          parCycle: parCycle as any[],
          capacite: capacite as any[]
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des statistiques' };
    }
  }

  static async obtenirElevesParClasse(classeId: number): Promise<{success: boolean, eleves?: any[], erreur?: string}> {
  try {
    console.log('🔍 Service: Récupération élèves pour classe ID:', classeId);
    
    // D'abord, vérifier que la classe existe
    const classeExiste = await this.obtenirClasseParId(classeId);
    if (!classeExiste.success) {
      console.log('❌ Classe non trouvée:', classeId);
      return { 
        success: false, 
        erreur: `Classe avec ID ${classeId} non trouvée` 
      };
    }

    // Requête SQL simplifiée - sans la colonne dossiers_physiques d'abord
    const sql = `
      SELECT 
        e.id,
        e.matricule,
        e.nom,
        e.prenom,
        e.date_naissance,
        e.lieu_naissance,
        e.genre,
        e.adresse,
        e.telephone,
        e.email,
        e.nom_pere,
        e.nom_mere,
        e.telephone_parent,
        e.classe_id,
        e.photo_url,
        e.statut,
        e.date_inscription,
        e.dossiers_physiques,  -- Colonne ajoutée
        c.nom as nom_classe,
        c.niveau as niveau_classe
      FROM eleves e
      LEFT JOIN classes c ON e.classe_id = c.id
      WHERE e.classe_id = ? 
      ORDER BY e.nom, e.prenom
    `;
    
    console.log('📝 Requête SQL pour élèves:', sql.replace(/\s+/g, ' '));
    console.log('🔢 Paramètre classe_id:', classeId);
    
    const elevesDb = await query(sql, [classeId]) as any[];
    
    console.log('✅ Élèves récupérés brute:', elevesDb.length, 'élèves');
    if (elevesDb.length > 0) {
      console.log('📋 Premier élève brute:', {
        id: elevesDb[0].id,
        nom: elevesDb[0].nom,
        prenom: elevesDb[0].prenom,
        dossiers_physiques: elevesDb[0].dossiers_physiques
      });
    }
    
    // Parser les dossiers physiques
    const eleves = elevesDb.map(eleveDb => {
      try {
        // Si dossiers_physiques est null ou undefined
        if (!eleveDb.dossiers_physiques) {
          return {
            ...eleveDb,
            dossiers_physiques: []
          };
        }
        
        // Si c'est déjà un tableau
        if (Array.isArray(eleveDb.dossiers_physiques)) {
          return {
            ...eleveDb,
            dossiers_physiques: eleveDb.dossiers_physiques
          };
        }
        
        // Si c'est une chaîne JSON
        if (typeof eleveDb.dossiers_physiques === 'string') {
          try {
            const parsed = JSON.parse(eleveDb.dossiers_physiques);
            return {
              ...eleveDb,
              dossiers_physiques: Array.isArray(parsed) ? parsed : []
            };
          } catch (parseError) {
            console.warn('⚠️ Erreur parsing JSON pour élève', eleveDb.id, parseError);
            return {
              ...eleveDb,
              dossiers_physiques: []
            };
          }
        }
        
        // Sinon, tableau vide
        return {
          ...eleveDb,
          dossiers_physiques: []
        };
        
      } catch (error) {
        console.error('❌ Erreur traitement élève', eleveDb.id, error);
        return {
          ...eleveDb,
          dossiers_physiques: []
        };
      }
    });
    
    console.log('🎉 Élèves traités:', eleves.length, 'élèves');
    
    return { 
      success: true, 
      eleves 
    };
  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération des élèves de la classe:', error);
    console.error('❌ Détails erreur:', {
      message: error.message,
      stack: error.stack,
      classeId: classeId
    });
    
    return { 
      success: false, 
      erreur: `Erreur base de données: ${error.message}` 
    };
  }
}
}
