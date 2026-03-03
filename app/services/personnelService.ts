import { query } from '@/app/lib/database';

// Définir une interface pour le type de retour
interface PersonnelRow {
  id: number;
  user_id: number | null;
  matricule: string;
  nom: string | null;
  prenom: string | null;
  email: string | null;
  date_naissance: string | null;
  lieu_naissance: string | null;
  genre: string | null;
  adresse: string | null;
  telephone: string | null;
  specialite: string | null;
  diplome: string | null;
  type_personnel: string | null;
  matieres_enseignees: string | null;
  fonction: string | null;
  departement: string | null;
  date_embauche: string | null;
  statut: string | null;
  type_contrat: string | null;
  avatar_url: string | null;
  salaire: number | null;
  created_at: string | null;
  nombre_classes: number;
  classes_principales: string | null;
}

interface FonctionRow {
  fonction: string;
}

interface DepartementRow {
  departement: string;
}

export class PersonnelService {
  static async obtenirPersonnel(filtres: any) {
    try {
      let sql = `
        SELECT 
          e.id,
          e.user_id,
          e.matricule,
          u.nom,
          u.prenom,
          u.email,
          e.date_naissance,
          e.lieu_naissance,
          e.genre,
          e.adresse,
          e.telephone,
          e.specialite,
          e.diplome,
          e.type_enseignant as type_personnel,
          e.matieres_enseignees,
          e.fonction,
          e.departement,
          e.date_embauche,
          e.statut,
          e.type_contrat,
          e.avatar_url,
          e.salaire,
          e.created_at,
          COUNT(DISTINCT c.id) as nombre_classes,
          GROUP_CONCAT(DISTINCT CONCAT(cl.nom, ' (', cl.niveau, ')') SEPARATOR ', ') as classes_principales
        FROM enseignants e
        LEFT JOIN users u ON e.user_id = u.id
        LEFT JOIN classes_enseignants ce ON e.id = ce.enseignant_id
        LEFT JOIN classes cl ON ce.classe_id = cl.id
        LEFT JOIN classes c ON c.professeur_principal_id = e.user_id OR ce.classe_id = c.id
      `;

      const conditions = [];
      const params = [];

      // Filtres
      if (filtres.recherche) {
        conditions.push(`(u.nom LIKE ? OR u.prenom LIKE ? OR e.matricule LIKE ? OR u.email LIKE ?)`);
        params.push(`%${filtres.recherche}%`, `%${filtres.recherche}%`, `%${filtres.recherche}%`, `%${filtres.recherche}%`);
      }

      if (filtres.type_personnel) {
        conditions.push(`e.type_enseignant = ?`);
        params.push(filtres.type_personnel);
      }

      if (filtres.fonction) {
        conditions.push(`e.fonction = ?`);
        params.push(filtres.fonction);
      }

      if (filtres.departement) {
        conditions.push(`e.departement = ?`);
        params.push(filtres.departement);
      }

      if (filtres.statut) {
        conditions.push(`e.statut = ?`);
        params.push(filtres.statut);
      }

      if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
      }

      sql += ` GROUP BY e.id ORDER BY u.nom, u.prenom`;

      // Typer le résultat comme un tableau de PersonnelRow
      const rows = await query(sql, params) as PersonnelRow[];
      
      return {
        success: true,
        personnel: rows
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du personnel:', error);
      return {
        success: false,
        erreur: 'Erreur lors de la récupération du personnel'
      };
    }
  }

  static async obtenirFonctions() {
    try {
      const rows = await query(`
        SELECT DISTINCT fonction 
        FROM enseignants 
        WHERE fonction IS NOT NULL AND fonction != ''
        ORDER BY fonction
      `) as FonctionRow[];
      
      return rows.map((row) => row.fonction);
    } catch (error) {
      console.error('Erreur lors de la récupération des fonctions:', error);
      return [];
    }
  }

  static async obtenirDepartements() {
    try {
      const rows = await query(`
        SELECT DISTINCT departement 
        FROM enseignants 
        WHERE departement IS NOT NULL AND departement != ''
        ORDER BY departement
      `) as DepartementRow[];
      
      return rows.map((row) => row.departement);
    } catch (error) {
      console.error('Erreur lors de la récupération des départements:', error);
      return [];
    }
  }
}