// /api/releves-primaires/nettoyer/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get('classe_id');
    const periodeId = searchParams.get('periode_id');
    
    if (!classeId || !periodeId) {
      return NextResponse.json(
        { success: false, error: 'Classe et période requises' },
        { status: 400 }
      );
    }
    
    // Vider la table
    const sql = 'DELETE FROM releves_primaire WHERE classe_id = ? AND periode_id = ?';
    const result: any = await query(sql, [parseInt(classeId), parseInt(periodeId)]);
    
    // Réinitialiser l'auto-incrément si besoin
    await query('ALTER TABLE releves_primaire AUTO_INCREMENT = 1', []);
    
    return NextResponse.json({
      success: true,
      message: `Table nettoyée: ${result.affectedRows || 0} lignes supprimées`
    });
    
  } catch (error: any) {
    console.error('❌ Erreur nettoyage:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}