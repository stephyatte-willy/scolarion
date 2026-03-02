import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { notes, evaluation_id } = data;
    
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucune note à sauvegarder' },
        { status: 400 }
      );
    }

    if (!evaluation_id) {
      return NextResponse.json(
        { success: false, error: 'Évaluation requise' },
        { status: 400 }
      );
    }

    const result = await transaction(async (connection) => {
      for (const noteData of notes) {
        // Vérifier si la note existe
        const checkSql = 'SELECT id FROM notes WHERE eleve_id = ? AND evaluation_id = ?';
        const [existing] = await connection.execute(checkSql, [noteData.eleve_id, evaluation_id]);
        
        if (existing && existing.length > 0) {
          // Mettre à jour
          const updateSql = `
            UPDATE notes SET 
              note = ?, 
              note_sur = ?, 
              appreciation = ?, 
              date_saisie = ?, 
              saisie_par = ?
            WHERE id = ?
          `;
          await connection.execute(updateSql, [
            noteData.note,
            noteData.note_sur || 20.00,
            noteData.appreciation || '',
            noteData.date_saisie || new Date().toISOString().split('T')[0],
            noteData.saisie_par,
            existing[0].id
          ]);
        } else {
          // Insérer
          const insertSql = `
            INSERT INTO notes (
              eleve_id, evaluation_id, note, note_sur, appreciation,
              date_saisie, saisie_par
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;
          await connection.execute(insertSql, [
            noteData.eleve_id,
            evaluation_id,
            noteData.note,
            noteData.note_sur || 20.00,
            noteData.appreciation || '',
            noteData.date_saisie || new Date().toISOString().split('T')[0],
            noteData.saisie_par
          ]);
        }
      }
      
      return { success: true, count: notes.length };
    });

    return NextResponse.json({
      success: true,
      message: `${notes.length} notes sauvegardées avec succès`
    });
  } catch (error: any) {
    console.error('❌ Erreur POST notes masse:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la sauvegarde: ${error.message}` 
      },
      { status: 500 }
    );
  }
}