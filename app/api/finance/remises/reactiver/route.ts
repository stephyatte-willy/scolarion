import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({
        success: false,
        erreur: 'ID de remise requis'
      }, { status: 400 });
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query('START TRANSACTION');

      // Récupérer la remise à réactiver
      const [remiseResult] = await connection.query(`
        SELECT * FROM remises_frais WHERE id = ?
      `, [id]) as any[];

      if (!remiseResult || remiseResult.length === 0) {
        return NextResponse.json({
          success: false,
          erreur: 'Remise non trouvée'
        }, { status: 404 });
      }

      const remise = remiseResult[0];

      // Désactiver toute remise active existante
      await connection.query(`
        UPDATE remises_frais 
        SET statut = 'inactive' 
        WHERE frais_scolaire_id = ? AND eleve_id = ? AND statut = 'active' AND id != ?
      `, [remise.frais_scolaire_id, remise.eleve_id, id]);

      // Réactiver la remise
      await connection.query(`
        UPDATE remises_frais SET statut = 'active' WHERE id = ?
      `, [id]);

      // Mettre à jour le frais élève
      await connection.query(`
        UPDATE frais_eleves 
        SET montant = ?,
            a_remise = 1,
            remise_id = ?,
            motif_remise = ?
        WHERE frais_scolaire_id = ? AND eleve_id = ? AND annee_scolaire = ?
      `, [
        remise.montant_final,
        id,
        remise.motif,
        remise.frais_scolaire_id,
        remise.eleve_id,
        remise.annee_scolaire || (() => {
          const maintenant = new Date();
          const annee = maintenant.getFullYear();
          const mois = maintenant.getMonth() + 1;
          return mois >= 8 ? `${annee}-${annee + 1}` : `${annee - 1}-${annee}`;
        })()
      ]);

      await connection.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Remise réactivée avec succès'
      });

    } catch (error) {
      if (connection) {
        await connection.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }

  } catch (error: any) {
    console.error('❌ Erreur réactivation remise:', error);
    return NextResponse.json(
      { success: false, erreur: error.message },
      { status: 500 }
    );
  }
}