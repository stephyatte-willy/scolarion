// app/api/periodes-primaires/[id]/check-delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Récupération asynchrone de l'ID
    const { id } = await params;
    const periodeId = parseInt(id);
    
    console.log('🔍 Vérification suppression période ID:', periodeId);
    
    if (isNaN(periodeId) || periodeId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'ID de période invalide'
      }, { status: 400 });
    }

    // 1. Vérifier si la période existe
    const periodeSql = 'SELECT * FROM periodes_primaire WHERE id = ? AND est_supprime = FALSE';
    const periodeResult = await query(periodeSql, [periodeId]) as any[];
    
    if (!Array.isArray(periodeResult) || periodeResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Période non trouvée'
      }, { status: 404 });
    }

    const periode = periodeResult[0];
    console.log('📋 Période trouvée:', periode);

    // 2. Vérifier si c'est la période courante
    if (periode.est_courante === 1 || periode.est_courante === true) {
      return NextResponse.json({
        success: true,
        can_be_deleted: false,
        error: 'Impossible de supprimer la période courante'
      });
    }

    // 3. Vérifier si la période est utilisée dans des compositions
    const compositionsSql = 'SELECT COUNT(*) as count FROM compositions_primaire WHERE periode_id = ?';
    const compositionsResult = await query(compositionsSql, [periodeId]) as any[];
    const compositionsCount = Array.isArray(compositionsResult) && compositionsResult[0] 
      ? parseInt(compositionsResult[0].count) || 0 
      : 0;

    console.log('📊 Compositions trouvées:', compositionsCount);

    // 4. Vérifier si la période est utilisée dans des notes (via les compositions)
    let notesCount = 0;
    if (compositionsCount > 0) {
      // Récupérer les IDs des compositions de cette période
      const compIdsSql = 'SELECT id FROM compositions_primaire WHERE periode_id = ?';
      const compIdsResult = await query(compIdsSql, [periodeId]) as any[];
      
      if (Array.isArray(compIdsResult) && compIdsResult.length > 0) {
        const compIds = compIdsResult.map((c: any) => c.id);
        
        // Vérifier les notes pour ces compositions
        if (compIds.length > 0) {
          const notesSql = `
            SELECT COUNT(*) as count 
            FROM notes_primaire 
            WHERE composition_id IN (${compIds.map(() => '?').join(',')})
          `;
          const notesResult = await query(notesSql, compIds) as any[];
          notesCount = Array.isArray(notesResult) && notesResult[0] 
            ? parseInt(notesResult[0].count) || 0 
            : 0;
        }
      }
    }

    // 5. Déterminer si la période peut être supprimée
    const canBeDeleted = compositionsCount === 0 && notesCount === 0;
    
    return NextResponse.json({
      success: true,
      can_be_deleted: canBeDeleted,
      compositions_count: compositionsCount,
      notes_count: notesCount,
      is_current_period: periode.est_courante === 1 || periode.est_courante === true,
      error: !canBeDeleted 
        ? `Cette période ne peut pas être supprimée car elle est utilisée dans ${compositionsCount} composition(s) et ${notesCount} note(s)` 
        : null
    });

  } catch (error: any) {
    console.error('❌ Erreur vérification période:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Erreur lors de la vérification: ${error.message || 'Erreur inconnue'}`
    }, { status: 500 });
  }
}
