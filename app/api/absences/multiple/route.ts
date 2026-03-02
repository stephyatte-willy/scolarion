import { NextResponse } from 'next/server';
import { query, runTransaction } from '@/app/lib/database';

// DELETE /api/absences/multiple - Supprimer plusieurs absences
export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();
    
    console.log('🗑️ Suppression multiple des absences:', ids);
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucune absence sélectionnée' },
        { status: 400 }
      );
    }

    // Vérifier que toutes les absences existent
    const placeholders = ids.map(() => '?').join(',');
    const checkSql = `SELECT id FROM absences WHERE id IN (${placeholders})`;
    const existing = await query(checkSql, ids) as any[];
    
    if (existing.length !== ids.length) {
      const foundIds = existing.map((e: any) => e.id);
      const missingIds = ids.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { 
          success: false, 
          error: `Certaines absences n'existent pas: ${missingIds.join(', ')}` 
        },
        { status: 404 }
      );
    }

    // Supprimer les absences dans une transaction
    await runTransaction(async (connection) => {
      const deleteSql = `DELETE FROM absences WHERE id IN (${placeholders})`;
      await connection.execute(deleteSql, ids);
    });

    return NextResponse.json({ 
      success: true, 
      message: `${ids.length} absence(s) supprimée(s) avec succès`,
      count: ids.length
    });

  } catch (error) {
    console.error('❌ Erreur DELETE multiple absences:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression multiple' },
      { status: 500 }
    );
  }
}