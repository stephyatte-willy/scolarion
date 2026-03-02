import { NextRequest, NextResponse } from 'next/server';
import { query, runTransaction } from '@/app/lib/database';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { paiement_ids } = body;
    
    if (!paiement_ids || !Array.isArray(paiement_ids) || paiement_ids.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Aucun paiement sélectionné'
      }, { status: 400 });
    }

    console.log(`🗑️ Suppression multiple de ${paiement_ids.length} paiement(s)`);
    
    // ✅ UTILISATION DE runTransaction POUR GÉRER LES TRANSACTIONS
    const result = await runTransaction(async (connection) => {
      
      // 1. Récupérer les IDs des frais_eleves à mettre à jour
      const placeholders = paiement_ids.map(() => '?').join(',');
      const [fraisElevesRows] = await connection.execute(`
        SELECT DISTINCT frais_eleve_id, eleve_id
        FROM paiements_frais 
        WHERE id IN (${placeholders})
      `, paiement_ids);
      
      const fraisElevesResult = fraisElevesRows as any[];
      console.log(`📊 ${fraisElevesResult.length} frais_eleves à mettre à jour`);
      
      // 2. Supprimer les paiements
      const [deleteResult] = await connection.execute(`
        DELETE FROM paiements_frais 
        WHERE id IN (${placeholders})
      `, paiement_ids);
      
      console.log(`✅ ${(deleteResult as any).affectedRows || paiement_ids.length} paiement(s) supprimé(s)`);
      
      // 3. Récupérer les détails pour la confirmation AVANT la mise à jour
      const [detailsRows] = await connection.execute(`
        SELECT 
          pf.id,
          e.prenom as eleve_prenom,
          e.nom as eleve_nom,
          e.matricule as eleve_matricule,
          pf.date_paiement,
          TIME(pf.created_at) as heure_paiement,
          cf.nom as categorie_nom,
          pf.numero_versement,
          pf.montant
        FROM paiements_frais pf
        INNER JOIN eleves e ON pf.eleve_id = e.id
        INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE pf.id IN (${placeholders})
      `, paiement_ids);
      
      const detailsResult = detailsRows as any[];
      
      // 4. Recalculer les montants_paye pour chaque frais_eleve
      for (const fe of fraisElevesResult) {
        await connection.execute(`
          UPDATE frais_eleves fe
          SET 
            montant_paye = COALESCE((
              SELECT SUM(montant)
              FROM paiements_frais 
              WHERE frais_eleve_id = fe.id AND statut = 'paye'
            ), 0),
            statut = CASE 
              WHEN COALESCE((
                SELECT SUM(montant)
                FROM paiements_frais 
                WHERE frais_eleve_id = fe.id AND statut = 'paye'
              ), 0) >= fe.montant THEN 'paye'
              WHEN COALESCE((
                SELECT SUM(montant)
                FROM paiements_frais 
                WHERE frais_eleve_id = fe.id AND statut = 'paye'
              ), 0) > 0 THEN 'partiel'
              ELSE 'en_attente'
            END,
            updated_at = NOW()
          WHERE id = ?
        `, [fe.frais_eleve_id]);
      }
      
      return {
        supprime: paiement_ids.length,
        details: detailsResult
      };
    });
    
    console.log(`✅✅✅ ${result.supprime} paiement(s) supprimé(s) avec succès`);
    
    return NextResponse.json({
      success: true,
      supprime: result.supprime,
      details: result.details,
      message: `${result.supprime} paiement(s) supprimé(s) avec succès`
    });
    
  } catch (error: any) {
    console.error('❌ Erreur suppression multiple:', error);
    console.error('❌ Stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur lors de la suppression: ${error.message}`
      },
      { status: 500 }
    );
  }
}