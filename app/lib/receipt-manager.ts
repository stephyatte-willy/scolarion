import { query } from './database';

export class ReceiptManager {
  static async getNextReceiptNumber(): Promise<number> {
    const currentYear = new Date().getFullYear();
    
    // Vérifier si la séquence existe pour l'année en cours
    const checkSql = `
      SELECT * FROM numero_recu_sequence 
      WHERE annee = ?
    `;
    
    const result = await query(checkSql, [currentYear]) as any[];
    
    if (result.length === 0) {
      // Créer une nouvelle séquence pour l'année
      const insertSql = `
        INSERT INTO numero_recu_sequence (dernier_numero, annee)
        VALUES (0, ?)
      `;
      await query(insertSql, [currentYear]);
      
      return 1;
    } else {
      // Incrémenter la séquence existante
      const updateSql = `
        UPDATE numero_recu_sequence 
        SET dernier_numero = dernier_numero + 1,
            updated_at = NOW()
        WHERE annee = ?
      `;
      
      await query(updateSql, [currentYear]);
      
      // Récupérer le nouveau numéro
      const getSql = `
        SELECT dernier_numero FROM numero_recu_sequence 
        WHERE annee = ?
      `;
      
      const newResult = await query(getSql, [currentYear]) as any[];
      return newResult[0].dernier_numero;
    }
  }

  static async markReceiptPrinted(paiementId: number): Promise<void> {
    const sql = `
      UPDATE paiements_frais 
      SET date_impression_recu = NOW(),
          est_duplicata = 1,
          updated_at = NOW()
      WHERE id = ?
    `;
    
    await query(sql, [paiementId]);
  }

  static async getReceiptInfo(paiementId: number): Promise<any> {
    const sql = `
      SELECT 
        pf.*,
        pf.numero_recu,
        pf.date_impression_recu,
        pf.est_duplicata,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        cf.nom as categorie_nom,
        cf.type as categorie_type,
        fe.montant as montant_total,
        fe.montant_paye,
        fe.statut as statut_frais
      FROM paiements_frais pf
      INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
      INNER JOIN eleves e ON pf.eleve_id = e.id
      INNER JOIN classes c ON e.classe_id = c.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE pf.id = ?
    `;
    
    const result = await query(sql, [paiementId]) as any[];
    return result[0];
  }
}