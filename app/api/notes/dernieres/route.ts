// app/api/notes/dernieres/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limite = parseInt(searchParams.get('limite') || '5');

    // Adapter selon votre structure de tables
    const sql = `
      SELECT 
        n.id,
        n.eleve_id,
        CONCAT(e.nom, ' ', e.prenom) as eleve_nom,
        e.prenom as eleve_prenom,
        n.matiere_nom as matiere,
        n.note,
        n.date_saisie as date
      FROM notes_primaire n
      LEFT JOIN eleves e ON n.eleve_id = e.id
      ORDER BY n.date_saisie DESC, n.created_at DESC
      LIMIT ?
    `;

    const notes = await query(sql, [limite]);

    return NextResponse.json({
      success: true,
      notes: notes,
      total: notes.length
    });
  } catch (error: any) {
    console.error('❌ Erreur récupération dernières notes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message}`,
        notes: []
      },
      { status: 500 }
    );
  }
}