// app/api/releves-primaires/[id]/matieres/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const releveId = parseInt(id);
    
    // Récupérer le relevé pour avoir eleve_id et periode_id
    const sqlReleve = 'SELECT eleve_id, periode_id FROM releves_primaire WHERE id = ?';
    const releveResult: any = await query(sqlReleve, [releveId]);
    
    if (!releveResult || releveResult.length === 0) {
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
    
    const notes = await query(sqlNotes, [releve.eleve_id, releve.periode_id]);
    
    const matieres = notes.map((note: any) => ({
      matiere_id: note.matiere_id,
      matiere_nom: note.matiere_nom,
      coefficient: parseFloat(note.coefficient) || 1,
      note: parseFloat(note.note) || 0,
      note_sur: parseFloat(note.note_sur) || 20,
      appreciation: note.appreciation || 'Non noté',
      couleur: note.couleur || '#3B82F6',
      icone: note.icone || '📚',
      note_coefficientee: (parseFloat(note.note) || 0) * (parseFloat(note.coefficient) || 1)
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