import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const evaluationId = searchParams.get('evaluation_id');
    const eleveId = searchParams.get('eleve_id');
    const classeId = searchParams.get('classe_id');

    let sql = `
      SELECT n.*, 
             e.nom as eleve_nom,
             e.prenom as eleve_prenom
      FROM notes n
      LEFT JOIN eleves e ON n.eleve_id = e.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (evaluationId && evaluationId !== 'tous') {
      sql += ' AND n.evaluation_id = ?';
      params.push(parseInt(evaluationId));
    }

    if (eleveId && eleveId !== 'tous') {
      sql += ' AND n.eleve_id = ?';
      params.push(parseInt(eleveId));
    }

    if (classeId && classeId !== 'tous') {
      // Sous-requête pour les élèves de la classe
      sql += ' AND n.eleve_id IN (SELECT id FROM eleves WHERE classe_id = ?)';
      params.push(parseInt(classeId));
    }

    sql += ' ORDER BY e.nom, e.prenom';

    console.log('📝 SQL notes:', sql);
    const notes = await query(sql, params);

    return NextResponse.json({
      success: true,
      notes: notes || []
    });
  } catch (error: any) {
    console.error('❌ Erreur GET notes:', error);
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

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validation
    if (!data.eleve_id) {
      return NextResponse.json(
        { success: false, error: 'Élève requis' },
        { status: 400 }
      );
    }

    if (!data.evaluation_id) {
      return NextResponse.json(
        { success: false, error: 'Évaluation requise' },
        { status: 400 }
      );
    }

    if (data.note === undefined) {
      return NextResponse.json(
        { success: false, error: 'Note requise' },
        { status: 400 }
      );
    }

    // Vérifier si la note existe déjà
    const checkSql = 'SELECT id FROM notes WHERE eleve_id = ? AND evaluation_id = ?';
    const existing = await query(checkSql, [data.eleve_id, data.evaluation_id]);
    
    if (existing.length > 0) {
      // Mettre à jour la note existante
      const updateSql = `
        UPDATE notes SET 
          note = ?, 
          note_sur = ?, 
          appreciation = ?, 
          date_saisie = ?, 
          saisie_par = ?,
          est_absent = ?,
          est_exempte = ?,
          est_annulee = ?,
          motif_absence = ?
        WHERE id = ?
      `;
      
      const params = [
        data.note,
        data.note_sur || 20.00,
        data.appreciation || '',
        data.date_saisie || new Date().toISOString().split('T')[0],
        data.saisie_par,
        data.est_absent ? 1 : 0,
        data.est_exempte ? 1 : 0,
        data.est_annulee ? 1 : 0,
        data.motif_absence || '',
        existing[0].id
      ];

      await query(updateSql, params);
      
      return NextResponse.json({
        success: true,
        message: 'Note mise à jour avec succès'
      });
    } else {
      // Créer une nouvelle note
      const insertSql = `
        INSERT INTO notes (
          eleve_id, evaluation_id, note, note_sur, appreciation,
          date_saisie, saisie_par, est_absent, est_exempte,
          est_annulee, motif_absence
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        data.eleve_id,
        data.evaluation_id,
        data.note,
        data.note_sur || 20.00,
        data.appreciation || '',
        data.date_saisie || new Date().toISOString().split('T')[0],
        data.saisie_par,
        data.est_absent ? 1 : 0,
        data.est_exempte ? 1 : 0,
        data.est_annulee ? 1 : 0,
        data.motif_absence || ''
      ];

      await query(insertSql, params);
      
      return NextResponse.json({
        success: true,
        message: 'Note créée avec succès'
      }, { status: 201 });
    }
  } catch (error: any) {
    console.error('❌ Erreur POST note:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la sauvegarde: ${error.message}` 
      },
      { status: 500 }
    );
  }
}