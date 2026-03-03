import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interfaces pour le typage
interface Releve {
  eleve_id: number;
  periode_id: number;
}

interface Note {
  matiere_id: number;
  matiere_nom: string;
  coefficient: number;
  note_sur: number;
  couleur: string;
  icone: string;
  note: number;
  appreciation: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const releveId = parseInt(id);
    
    // Récupérer le relevé pour avoir eleve_id et periode_id
    const sqlReleve = 'SELECT eleve_id, periode_id FROM releves_primaire WHERE id = ?';
    const releveResult = await query(sqlReleve, [releveId]) as Releve[];
    
    if (!Array.isArray(releveResult) || releveResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Relevé non trouvé' },
        { status: 404 }
      );
    }
    
    const releve = releveResult[0];
    
    // Récupérer les notes de l'élève pour cette période
    const sqlNotes = `
      SELECT 
        n.matiere_id,
        mp.nom as matiere_nom,
        mp.coefficient,
        mp.note_sur,
        mp.couleur,
        mp.icone,
        n.note,
        n.appreciation
      FROM notes_primaire n
      JOIN matieres_primaire mp ON n.matiere_id = mp.id
      WHERE n.eleve_id = ? 
        AND EXISTS (
          SELECT 1 FROM compositions_primaire cp 
          WHERE cp.id = n.composition_id 
          AND cp.periode_id = ?
        )
      ORDER BY mp.ordre_affichage
    `;
    
    const notes = await query(sqlNotes, [releve.eleve_id, releve.periode_id]) as Note[];
    
    // ✅ Vérifier que notes est bien un tableau
    const notesArray = Array.isArray(notes) ? notes : [];
    
    const matieres = notesArray.map((note: Note) => ({
      matiere_id: note.matiere_id,
      matiere_nom: note.matiere_nom,
      coefficient: parseFloat(note.coefficient as any) || 1,
      note: parseFloat(note.note as any) || 0,
      note_sur: parseFloat(note.note_sur as any) || 20,
      appreciation: note.appreciation || 'Non noté',
      couleur: note.couleur || '#3B82F6',
      icone: note.icone || '📚',
      note_coefficientee: (parseFloat(note.note as any) || 0) * (parseFloat(note.coefficient as any) || 1)
    }));
    
    return NextResponse.json({
      success: true,
      matieres: matieres
    });

  } catch (error: any) {
    console.error('Erreur API matières:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur serveur'
      },
      { status: 500 }
    );
  }
}