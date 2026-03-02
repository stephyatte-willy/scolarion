// app/api/notes/verifier-matiere/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matiereId = searchParams.get('matiere_id');

    if (!matiereId) {
      return NextResponse.json(
        { success: false, error: 'ID de matière requis' },
        { status: 400 }
      );
    }

    // Vérifier dans la table des notes si cette matière est utilisée
    // Note: Adaptez le nom de la table selon votre structure de base de données
    const sql = `
      SELECT COUNT(*) as count 
      FROM notes 
      WHERE matiere_id = ?
    `;
    
    const result = await query(sql, [parseInt(matiereId)]) as any[];
    
    const count = result[0]?.count || 0;
    
    return NextResponse.json({
      success: true,
      aDesNotes: count > 0,
      count: count
    });

  } catch (error: any) {
    console.error('❌ Erreur vérification notes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message}`,
        aDesNotes: false 
      },
      { status: 500 }
    );
  }
}
