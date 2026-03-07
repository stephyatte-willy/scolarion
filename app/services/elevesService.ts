import { query } from '../lib/database';

export interface DossierPhysique {
  url: string;
  nomOriginal: string;
  taille: number;
  type: string;
  date: string;
}

export interface Eleve {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  date_naissance: string;
  lieu_naissance?: string;
  genre: 'M' | 'F';
  adresse?: string;
  email?: string;
  email_parents?: string; // ✅ AJOUTÉ
  nom_pere?: string;
  nom_mere?: string;
  telephone_parent?: string;
  classe_id?: number;
  photo_url?: string;
  dossiers_physiques?: DossierPhysique[];
  statut: 'actif' | 'inactif' | 'diplome' | 'abandon';
  date_inscription: string;
  nom_classe?: string;
  niveau_classe?: string;
}

export interface Classe {
  id: number;
  nom: string;
  niveau: string;
  cycle?: string;
  capacite_max: number;
  professeur_principal_id?: number;
}

export interface FiltresEleves {
  recherche?: string;
  classe_id?: number;
  statut?: string;
  genre?: string;
}

export class ElevesService {
  // Fonction pour parser les dossiers physiques
  private static parseDossiersPhysiques(dossiersString: string | null): DossierPhysique[] {
    if (!dossiersString || dossiersString === 'null' || dossiersString === 'NULL') {
      return [];
    }
    
    try {
      const parsed = JSON.parse(dossiersString);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('❌ Erreur parsing dossiers:', error, 'String:', dossiersString);
      return [];
    }
  }

  // Fonction pour transformer un élève de la base
  private static transformEleve(eleveDb: any): Eleve {
    return {
      ...eleveDb,
      dossiers_physiques: this.parseDossiersPhysiques(eleveDb.dossiers_physiques)
    };
  }

  static async obtenirEleves(filtres: FiltresEleves = {}): Promise<{success: boolean, eleves?: Eleve[], erreur?: string}> {
    try {
      let sql = `
        SELECT 
          e.*, 
          c.nom as nom_classe, 
          c.niveau as niveau_classe 
        FROM eleves e 
        LEFT JOIN classes c ON e.classe_id = c.id 
        WHERE 1=1
      `;
      const params: any[] = [];

      if (filtres.recherche) {
        sql += ` AND (e.nom LIKE ? OR e.prenom LIKE ? OR e.matricule LIKE ?)`;
        params.push(`%${filtres.recherche}%`, `%${filtres.recherche}%`, `%${filtres.recherche}%`);
      }

      if (filtres.classe_id) {
        sql += ` AND e.classe_id = ?`;
        params.push(filtres.classe_id);
      }

      if (filtres.statut) {
        sql += ` AND e.statut = ?`;
        params.push(filtres.statut);
      }

      if (filtres.genre) {
        sql += ` AND e.genre = ?`;
        params.push(filtres.genre);
      }

      sql += ` ORDER BY e.nom, e.prenom`;

      const elevesDb = await query(sql, params) as any[];
      
      // Transformer les élèves
      const eleves = elevesDb.map(eleveDb => this.transformEleve(eleveDb));
      
      console.log('📊 Élèves récupérés:', eleves.length, 'avec dossiers:', 
        eleves.map(e => ({ 
          nom: e.nom, 
          nbDossiers: e.dossiers_physiques?.length || 0 
        }))
      );
      
      return { success: true, eleves };
    } catch (error) {
      console.error('Erreur lors de la récupération des élèves:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des élèves' };
    }
  }

  static async obtenirEleveParId(id: number): Promise<{success: boolean, eleve?: Eleve, erreur?: string}> {
    try {
      const sql = `
        SELECT e.*, c.nom as nom_classe, c.niveau as niveau_classe 
        FROM eleves e 
        LEFT JOIN classes c ON e.classe_id = c.id 
        WHERE e.id = ?
      `;
      const elevesDb = await query(sql, [id]) as any[];
      
      if (elevesDb.length === 0) {
        return { success: false, erreur: 'Élève non trouvé' };
      }

      const eleve = this.transformEleve(elevesDb[0]);
      console.log('📊 Élève récupéré:', eleve.nom, 'dossiers:', eleve.dossiers_physiques?.length);
      
      return { success: true, eleve };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'élève:', error);
      return { success: false, erreur: 'Erreur lors de la récupération de l\'élève' };
    }
  }

  static async obtenirClasses(): Promise<{success: boolean, classes?: Classe[], erreur?: string}> {
    try {
      const sql = 'SELECT * FROM classes ORDER BY niveau, nom';
      const classes = await query(sql) as Classe[];
      return { success: true, classes };
    } catch (error) {
      console.error('Erreur lors de la récupération des classes:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des classes' };
    }
  }

  static async creerEleve(eleveData: any): Promise<{success: boolean, eleve?: Eleve, erreur?: string}> {
  try {
    console.log('📝 Création élève - Données reçues:', eleveData);
    
    // Utiliser le matricule fourni par l'utilisateur
    const matricule = eleveData.matricule || `ELV${new Date().getFullYear()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Vérifier si le matricule existe déjà
    const sqlVerif = 'SELECT id FROM eleves WHERE matricule = ?';
    const existing = await query(sqlVerif, [matricule]) as any[];
    
    if (existing.length > 0) {
      return { 
        success: false, 
        erreur: `Le matricule "${matricule}" est déjà utilisé par un autre élève` 
      };
    }
    
    // ✅ Valeur par défaut pour email_parents (obligatoire)
    const emailParents = eleveData.email_parents || eleveData.email || '';
    
    const sql = `
      INSERT INTO eleves (
        matricule, nom, prenom, date_naissance, lieu_naissance, genre, 
        adresse, email, email_parents, nom_pere, nom_mere, telephone_parent, 
        classe_id, photo_url, statut, date_inscription, dossiers_physiques
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?)
    `;
    
    const params = [
      matricule,
      eleveData.nom,
      eleveData.prenom,
      eleveData.date_naissance,
      eleveData.lieu_naissance || null,
      eleveData.genre,
      eleveData.adresse || null,
      eleveData.email || null,
      emailParents, // ✅ Plus jamais null
      eleveData.nom_pere || null,
      eleveData.nom_mere || null,
      eleveData.telephone_parent || null,
      eleveData.classe_id || null,
      eleveData.photo_url || null,
      eleveData.statut || 'actif',
      eleveData.dossiers_physiques || null
    ];

    console.log('📝 Exécution INSERT avec params:', params);
    
    const result = await query(sql, params) as any;
    console.log('✅ Résultat insertion - insertId:', result.insertId);
    
    // ✅ Vérifier que l'insertion a réussi
    if (!result.insertId) {
      return { 
        success: false, 
        erreur: 'Échec de la création : aucun ID retourné' 
      };
    }
    
    // ✅ Récupérer l'élève créé avec une requête directe
    const selectSql = `
      SELECT 
        e.*, 
        c.nom as nom_classe, 
        c.niveau as niveau_classe 
      FROM eleves e 
      LEFT JOIN classes c ON e.classe_id = c.id 
      WHERE e.id = ?
    `;
    
    const nouvelEleveResult = await query(selectSql, [result.insertId]) as any[];
    
    if (!nouvelEleveResult || nouvelEleveResult.length === 0) {
      console.error('❌ Élève créé mais non trouvé avec ID:', result.insertId);
      return { 
        success: false, 
        erreur: 'Élève créé mais non trouvé dans la base de données' 
      };
    }
    
    // Transformer l'élève
    const eleve = this.transformEleve(nouvelEleveResult[0]);
    console.log('✅ Élève créé avec succès - ID:', eleve.id, 'Nom:', eleve.nom);
    
    return { 
      success: true, 
      eleve: eleve 
    };
    
  } catch (error: any) {
    console.error('❌ Erreur création élève:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return { 
        success: false, 
        erreur: 'Ce matricule est déjà utilisé. Veuillez en choisir un autre.' 
      };
    }
    
    return { 
      success: false, 
      erreur: `Erreur lors de la création de l'élève: ${error.message}` 
    };
  }
}

  static async mettreAJourEleve(id: number, eleveData: any): Promise<{success: boolean, eleve?: Eleve, erreur?: string}> {
    try {
      console.log('🔄 Service mise à jour - ID:', id, 'Data:', eleveData);
      
      // Vérifier d'abord si l'élève existe
      const eleveExiste = await this.obtenirEleveParId(id);
      if (!eleveExiste.success) {
        return { success: false, erreur: 'Élève non trouvé' };
      }

      // Vérifier si le nouveau matricule est déjà utilisé par un autre élève
      if (eleveData.matricule && eleveData.matricule !== eleveExiste.eleve?.matricule) {
        const sqlVerifMatricule = 'SELECT id, nom, prenom FROM eleves WHERE matricule = ? AND id != ?';
        const matriculeExistant = await query(sqlVerifMatricule, [eleveData.matricule, id]) as any[];
        
        if (matriculeExistant.length > 0) {
          const autreEleve = matriculeExistant[0];
          return { 
            success: false, 
            erreur: `Ce matricule est déjà utilisé par l'élève: ${autreEleve.nom} ${autreEleve.prenom}` 
          };
        }
      }

      // VÉRIFICATION DE LA CLASSE SI ELLE EST FOURNIE
      if (eleveData.classe_id !== undefined && eleveData.classe_id !== null) {
        const classes = await this.obtenirClasses();
        if (classes.success) {
          const classeExistante = classes.classes?.find(c => c.id === eleveData.classe_id);
          if (!classeExistante) {
            return { 
              success: false, 
              erreur: `La classe avec l'ID ${eleveData.classe_id} n'existe pas` 
            };
          }
        }
      }

      const champs = [];
      const params = [];

      // ✅ CORRECTION: Ajout de 'email_parents' dans la liste des champs autorisés
      const champsAutorises = [
        'matricule', 'nom', 'prenom', 'date_naissance', 'lieu_naissance', 'genre',
        'adresse', 'email', 'email_parents', 'nom_pere', 'nom_mere',
        'telephone_parent', 'classe_id', 'photo_url', 'statut', 'dossiers_physiques'
      ];

      for (const [key, value] of Object.entries(eleveData)) {
        if (champsAutorises.includes(key) && value !== undefined) {
          champs.push(`${key} = ?`);
          
          // Gestion robuste des valeurs
          if (key === 'classe_id') {
            if (value === '' || value === null) {
              params.push(null);
            } else {
              const classeId = Number(value);
              params.push(isNaN(classeId) ? null : classeId);
            }
          } else if (key === 'date_naissance' && value) {
            const date = new Date(value as string);
            params.push(date.toISOString().split('T')[0]);
          } else if (key === 'dossiers_physiques') {
            if (value === null || value === '' || value === 'null') {
              params.push(null);
            } else {
              params.push(value);
            }
          } else {
            params.push(value === '' ? null : value);
          }
        }
      }

      if (champs.length === 0) {
        return { success: false, erreur: 'Aucune donnée à mettre à jour' };
      }

      params.push(id);
      const sql = `UPDATE eleves SET ${champs.join(', ')} WHERE id = ?`;

      console.log('📝 SQL mise à jour:', sql);
      console.log('🔢 Paramètres:', params);

      const result = await query(sql, params) as any;
      console.log('✅ Résultat mise à jour:', result);

      // Recharger l'élève mis à jour
      const eleveMisAJour = await this.obtenirEleveParId(id);
      
      if (!eleveMisAJour.success) {
        return { success: false, erreur: 'Élève non trouvé après mise à jour' };
      }
      
      return eleveMisAJour;
    } catch (error: any) {
      console.error('❌ Erreur mise à jour élève:', error);
      
      if (error.code === 'ER_DUP_ENTRY') {
        return { 
          success: false, 
          erreur: 'Ce matricule est déjà utilisé par un autre élève' 
        };
      }
      
      return { 
        success: false, 
        erreur: 'Erreur lors de la mise à jour de l\'élève: ' + error.message 
      };
    }
  }

  static async supprimerEleve(id: number): Promise<{success: boolean, erreur?: string}> {
    try {
      console.log('🗑️ Service suppression - ID:', id);
      
      // Vérifier d'abord si l'élève existe
      const eleveExiste = await this.obtenirEleveParId(id);
      if (!eleveExiste.success) {
        return { success: false, erreur: 'Élève non trouvé' };
      }

      const sql = 'DELETE FROM eleves WHERE id = ?';
      const result = await query(sql, [id]) as any;
      
      console.log('✅ Résultat suppression:', result);

      if (result.affectedRows === 0) {
        return { success: false, erreur: 'Aucun élève trouvé avec cet ID' };
      }

      return { success: true };
    } catch (error: any) {
      console.error('❌ Erreur suppression élève:', error);
      
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return { success: false, erreur: 'Impossible de supprimer cet élève car il est référencé dans d\'autres tables' };
      }
      
      return { success: false, erreur: 'Erreur lors de la suppression de l\'élève: ' + error.message };
    }
  }

  static async validerIdEleve(id: number): Promise<{success: boolean, erreur?: string}> {
    try {
      if (!id || isNaN(id) || id <= 0) {
        return { success: false, erreur: 'ID d\'élève invalide' };
      }
      
      const eleve = await this.obtenirEleveParId(id);
      return { 
        success: eleve.success, 
        erreur: eleve.success ? undefined : 'Élève non trouvé' 
      };
    } catch (error) {
      console.error('Erreur validation ID élève:', error);
      return { success: false, erreur: 'Erreur lors de la validation de l\'ID' };
    }
  }

  static async obtenirStatistiques(): Promise<{success: boolean, statistiques?: any, erreur?: string}> {
    try {
      const sqlTotal = 'SELECT COUNT(*) as total FROM eleves WHERE statut = ?';
      const totalResult = await query(sqlTotal, ['actif']) as any[];
      
      const sqlParGenre = `
        SELECT genre, COUNT(*) as count 
        FROM eleves 
        WHERE statut = ?
        GROUP BY genre
      `;
      const parGenre = await query(sqlParGenre, ['actif']) as any[];
      
      const sqlParClasse = `
        SELECT 
          c.id,
          c.nom, 
          c.niveau, 
          COUNT(e.id) as total_eleves,
          SUM(CASE WHEN e.genre = 'F' THEN 1 ELSE 0 END) as filles,
          SUM(CASE WHEN e.genre = 'M' THEN 1 ELSE 0 END) as garcons
        FROM classes c 
        LEFT JOIN eleves e ON c.id = e.classe_id AND e.statut = ?
        GROUP BY c.id, c.nom, c.niveau
        ORDER BY c.niveau, c.nom
      `;
      const parClasse = await query(sqlParClasse, ['actif']) as any[];
      
      const sqlParStatut = 'SELECT statut, COUNT(*) as count FROM eleves GROUP BY statut';
      const parStatut = await query(sqlParStatut) as any[];

      const totalEleves = totalResult[0]?.total || 0;
      const garcons = parGenre.find((g: any) => g.genre === 'M')?.count || 0;
      const filles = parGenre.find((g: any) => g.genre === 'F')?.count || 0;

      return {
        success: true,
        statistiques: {
          total: totalEleves,
          garcons: garcons,
          filles: filles,
          parClasse: parClasse,
          parStatut: parStatut
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return { success: false, erreur: 'Erreur lors de la récupération des statistiques' };
    }
  }

  static async obtenirRepartitionParClasse(): Promise<{success: boolean, repartition?: any[], erreur?: string}> {
    try {
      const sql = `
        SELECT 
          c.nom as classe,
          c.niveau,
          COUNT(e.id) as total_eleves,
          SUM(CASE WHEN e.genre = 'F' THEN 1 ELSE 0 END) as filles,
          SUM(CASE WHEN e.genre = 'M' THEN 1 ELSE 0 END) as garcons
        FROM classes c
        LEFT JOIN eleves e ON c.id = e.classe_id AND e.statut = 'actif'
        GROUP BY c.id, c.nom, c.niveau
        ORDER BY c.niveau, c.nom
      `;
      
      const repartition = await query(sql) as any[];
      return { success: true, repartition };
    } catch (error) {
      console.error('Erreur lors de la récupération de la répartition par classe:', error);
      return { success: false, erreur: 'Erreur lors de la récupération de la répartition par classe' };
    }
  }
}