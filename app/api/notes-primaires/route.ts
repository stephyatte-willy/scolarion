import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const compositionId = searchParams.get('composition_id');
    const eleveId = searchParams.get('eleve_id');
    const classeId = searchParams.get('classe_id');
    const periodeId = searchParams.get('periode_id');

    let sql = `
      SELECT n.*, 
             mp.couleur,
             mp.coefficient,
             mp.icone
      FROM notes_primaire n
      LEFT JOIN matieres_primaire mp ON n.matiere_id = mp.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (compositionId && compositionId !== 'tous') {
      sql += ' AND n.composition_id = ?';
      params.push(parseInt(compositionId));
    }

    if (eleveId && eleveId !== 'tous') {
      sql += ' AND n.eleve_id = ?';
      params.push(parseInt(eleveId));
    }

    if (classeId && classeId !== 'tous') {
      // Filtrer par classe via la composition
      sql += ' AND n.composition_id IN (SELECT id FROM compositions_primaire WHERE classe_id = ?)';
      params.push(parseInt(classeId));
    }

    if (periodeId && periodeId !== 'tous') {
      // Filtrer par période via la composition
      sql += ' AND n.composition_id IN (SELECT id FROM compositions_primaire WHERE periode_id = ?)';
      params.push(parseInt(periodeId));
    }

    sql += ' ORDER BY n.eleve_nom, n.eleve_prenom, n.matiere_nom';

    console.log('📝 SQL notes primaires:', sql);
    const notes = await query(sql, params);

    return NextResponse.json({
      success: true,
      notes: notes || []
    });
  } catch (error: any) {
    console.error('❌ Erreur GET notes primaires:', error);
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