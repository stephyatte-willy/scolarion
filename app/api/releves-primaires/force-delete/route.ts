// /api/releves-primaires/force-delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const compositionId = searchParams.get('composition_id');
    
    if (!compositionId) {
      return NextResponse.json(
        { success: false, error: 'ID de composition requis' },
        { status: 400 }
      );
    }
    
    // Récupérer les infos de la composition
    const compSql = 'SELECT classe_id, periode_id FROM compositions_primaire WHERE id = ?';
    const [composition]: any = await query(compSql, [parseInt(compositionId)]);
    
    if (!composition) {
      return NextResponse.json(
        { success: false, error: 'Composition non trouvée' },
        { status: 404 }
      );
    }
    
    // Supprimer tous les relevés pour cette classe/période
    const deleteSql = 'DELETE FROM releves_primaire WHERE classe_id = ? AND periode_id = ?';
    const result: any = await query(deleteSql, [composition.classe_id, composition.periode_id]);
    
    return NextResponse.json({
      success: true,
      supprimes: result.affectedRows || 0,
      message: `${result.affectedRows || 0} relevés supprimés`
    });
    
  } catch (error: any) {
    console.error('❌ Erreur suppression forcée:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}