// /api/releves-primaires/nettoyer-doublons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Supprimer les doublons en gardant le plus récent
    const sql = `
      DELETE r1 
      FROM releves_primaire r1
      INNER JOIN releves_primaire r2 
      WHERE 
        r1.id < r2.id 
        AND r1.eleve_id = r2.eleve_id 
        AND r1.classe_id = r2.classe_id 
        AND r1.periode_id = r2.periode_id
    `;
    
    const result: any = await query(sql, []);
    
    return NextResponse.json({
      success: true,
      supprimes: result.affectedRows || 0,
      message: `${result.affectedRows || 0} doublons supprimés`
    });
    
  } catch (error: any) {
    console.error('Erreur nettoyage doublons:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}