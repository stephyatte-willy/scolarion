import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour les paramètres
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams  // ✅ Utilisation de l'interface avec Promise
) {
  try {
    // ✅ Récupération asynchrone de l'ID
    const { id } = await params;
    console.log('🔍 GET /api/releves/[id] appelé avec ID:', id);
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID invalide' },
        { status: 400 }
      );
    }

    // Récupérer le relevé par ID
    const sql = `
      SELECT r.*, 
             e.telephone_parent, e.email_parents,
             e.date_naissance, e.lieu_naissance,
             e.genre, e.nationalite
      FROM releves_primaire r
      LEFT JOIN eleves e ON r.eleve_id = e.id
      WHERE r.id = ?
    `;
    
    console.log('📝 SQL:', sql, [idNum]);
    
    const result: any = await query(sql, [idNum]);
    
    if (!result || result.length === 0) {
      console.log('❌ Relevé non trouvé');
      return NextResponse.json(
        { success: false, error: 'Relevé non trouvé' },
        { status: 404 }
      );
    }

    const data = result[0];
    
    // Essayer de récupérer les notes pour ce relevé
    let notes = [];
    try {
      const notesSql = `
        SELECT n.*, mp.nom as matiere_nom, mp.coefficient, mp.note_sur
        FROM notes_primaire n
        LEFT JOIN matieres_primaire mp ON n.matiere_id = mp.id
        WHERE n.eleve_id = ? AND n.periode_id = ?
        ORDER BY mp.ordre_affichage ASC, mp.nom ASC
      `;
      
      const notesResult = await query(notesSql, [data.eleve_id, data.periode_id]);
      
      if (notesResult && (notesResult as any[]).length > 0) {
        notes = (notesResult as any[]).map((note: any) => ({
          matiere_id: note.matiere_id,
          matiere_nom: note.matiere_nom || 'Matière',
          coefficient: note.coefficient || 1,
          note: parseFloat(note.note) || 0,
          note_sur: note.note_sur || 20,
          appreciation: note.appreciation || ''
        }));
      }
    } catch (notesError) {
      console.warn('⚠️ Notes non récupérées:', notesError);
    }

    // Formater le relevé
    const releveFormate = {
      id: data.id,
      eleve_id: data.eleve_id,
      matricule: data.matricule,
      eleve_nom: data.eleve_nom,
      eleve_prenom: data.eleve_prenom,
      classe_id: data.classe_id,
      classe_nom: data.classe_nom,
      periode_id: data.periode_id,
      periode_nom: data.periode_nom,
      moyennes_par_matiere: notes, // Utiliser les notes réelles
      moyenne_generale: parseFloat(data.moyenne_generale) || 0,
      rang: parseInt(data.rang) || 0,
      mention: data.mention || 'Non spécifié',
      appreciation_generale: data.appreciation_generale || 'Aucune appréciation disponible.',
      date_generation: data.date_generation,
      statut: data.statut || 'finalise',
      eleve: {
        date_naissance: data.date_naissance,
        lieu_naissance: data.lieu_naissance,
        telephone_parent: data.telephone_parent,
        email_parents: data.email_parents,
        genre: data.genre,
        nationalite: data.nationalite
      }
    };

    console.log('✅ Relevé formaté envoyé');
    
    return NextResponse.json({
      success: true,
      releve: releveFormate
    });

  } catch (error: any) {
    console.error('❌ Erreur API /api/releves/[id]:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}
