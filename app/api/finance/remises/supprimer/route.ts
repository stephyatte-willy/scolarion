import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/app/lib/database';

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

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

      // Récupérer la remise
      const [remiseResult] = await connection.query(`
        SELECT * FROM remises_frais WHERE id = ?
      `, [parseInt(id)]) as any[];

      if (!remiseResult || remiseResult.length === 0) {
        return NextResponse.json({
          success: false,
          erreur: 'Remise non trouvée'
        }, { status: 404 });
      }

      const remise = remiseResult[0];

      // Si la remise est active, restaurer d'abord le montant original
      if (remise.statut === 'active') {
        await connection.query(`
          UPDATE frais_eleves 
          SET montant = montant_original,
              a_remise = 0,
              remise_id = NULL,
              motif_remise = NULL
          WHERE remise_id = ?
        `, [parseInt(id)]);
      }

      // Supprimer définitivement la remise
      await connection.query(`
        DELETE FROM remises_frais WHERE id = ?
      `, [parseInt(id)]);

      await connection.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Remise supprimée définitivement avec succès'
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
    console.error('❌ Erreur suppression définitive remise:', error);
    return NextResponse.json(
      { success: false, erreur: error.message },
      { status: 500 }
    );
  }
}