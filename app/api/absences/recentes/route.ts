// app/api/absences/recentes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limite') || '5');

    const sql = `
      SELECT 
        a.id,
        a.eleve_id,
        CONCAT(e.nom, ' ', e.prenom) as eleve_nom,
        e.prenom as eleve_prenom,
        a.date_absence,
        a.type_absence,
        a.justifiee,
        a.motif,
        a.duree_minutes
      FROM absences a
      LEFT JOIN eleves e ON a.eleve_id = e.id
      ORDER BY a.date_absence DESC, a.created_at DESC
      LIMIT ?
    `;

    const absences = await query(sql, [limite]);

    return NextResponse.json({
      success: true,
      dernieres: absences
    });
  } catch (error: any) {
    console.error('❌ Erreur récupération absences récentes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message}`,
        dernieres: []
      },
      { status: 500 }
    );
  }
}