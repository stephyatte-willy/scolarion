import { NextRequest, NextResponse } from 'next/server';
import { query, runTransaction } from '@/app/lib/database'; // Correction ici : runTransaction au lieu de transaction

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { notes, composition_id } = data;
    
    if (!notes || !Array.isArray(notes) || notes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucune note à sauvegarder' },
        { status: 400 }
      );
    }

    if (!composition_id) {
      return NextResponse.json(
        { success: false, error: 'Composition requise' },
        { status: 400 }
      );
    }

    // Vérifier que la composition existe
    const checkCompSql = 'SELECT id FROM compositions_primaire WHERE id = ?';
    const compositionExists = await query(checkCompSql, [composition_id]);
    
    // Note: query renvoie un tableau, on vérifie sa longueur
    if (!Array.isArray(compositionExists) || compositionExists.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Composition non trouvée' },
        { status: 404 }
      );
    }

    const result = await runTransaction(async (connection) => {
      let notesSauvegardees = 0;
      let notesModifiees = 0;
      
      for (const noteData of notes) {
        // Validation de la note
        const noteValue = parseFloat(noteData.note);
        if (isNaN(noteValue) || noteValue < 0 || noteValue > noteData.note_sur) {
          continue; // Ignorer les notes invalides
        }

        // Vérifier si la note existe
        const checkSql = 'SELECT id FROM notes_primaire WHERE eleve_id = ? AND composition_id = ? AND matiere_id = ?';
        const [existingRows]: any = await connection.execute(checkSql, [
          noteData.eleve_id, 
          composition_id, 
          noteData.matiere_id
        ]);
        
        if (existingRows && existingRows.length > 0) {
          // Mettre à jour la note existante
          const updateSql = `
            UPDATE notes_primaire SET 
              note = ?, 
              appreciation = ?, 
              date_saisie = ?, 
              saisie_par = ?,
              saisie_par_nom = ?
            WHERE id = ?
          `;
          await connection.execute(updateSql, [
            noteValue,
            noteData.appreciation || '',
            noteData.date_saisie || new Date().toISOString().split('T')[0],
            noteData.saisie_par || 0,
            noteData.saisie_par_nom || '',
            existingRows[0].id
          ]);
          notesModifiees++;
        } else {
          // Insérer une nouvelle note
          const insertSql = `
            INSERT INTO notes_primaire (
              eleve_id, eleve_nom, eleve_prenom, composition_id,
              matiere_id, matiere_nom, note, note_sur, appreciation,
              date_saisie, saisie_par, saisie_par_nom
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          await connection.execute(insertSql, [
            noteData.eleve_id,
            noteData.eleve_nom || '',
            noteData.eleve_prenom || '',
            composition_id,
            noteData.matiere_id,
            noteData.matiere_nom || '',
            noteValue,
            noteData.note_sur || 20.00,
            noteData.appreciation || '',
            noteData.date_saisie || new Date().toISOString().split('T')[0],
            noteData.saisie_par || 0,
            noteData.saisie_par_nom || ''
          ]);
          notesSauvegardees++;
        }
      }
      
      // Mettre à jour le statut de la composition
      if (notesSauvegardees > 0 || notesModifiees > 0) {
        const updateCompSql = `
          UPDATE compositions_primaire 
          SET notes_saisies = TRUE, 
              statut = 'en_cours',
              updated_at = NOW()
          WHERE id = ?
        `;
        await connection.execute(updateCompSql, [composition_id]);
      }
      
      return { 
        success: true, 
        notes_sauvegardees: notesSauvegardees, 
        notes_modifiees: notesModifiees 
      };
    });

    return NextResponse.json({
      success: true,
      message: `${result.notes_sauvegardees} notes sauvegardées et ${result.notes_modifiees} notes modifiées avec succès`,
      stats: result
    });

  } catch (error: any) {
    console.error('❌ Erreur POST notes primaires masse:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la sauvegarde: ${error.message}` 
      },
      { status: 500 }
    );
  }
}