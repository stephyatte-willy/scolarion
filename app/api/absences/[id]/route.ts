import { NextResponse } from 'next/server';
import { query, runTransaction } from '@/app/lib/database';

// GET /api/absences/[id] - Récupérer une absence spécifique
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Récupérer l'ID depuis les paramètres (asynchrone)
    const { id } = await params;
    
    console.log('🔍 Récupération absence ID:', id);
    
    const sql = `
      SELECT a.*, 
        e.nom as eleve_nom, 
        e.prenom as eleve_prenom,
        c.nom as classe_nom, 
        c.niveau as classe_niveau,
        co.nom_cours as cours_nom
      FROM absences a
      INNER JOIN eleves e ON a.eleve_id = e.id
      INNER JOIN classes c ON a.classe_id = c.id
      LEFT JOIN cours co ON a.cours_id = co.code_cours
      WHERE a.id = ?
    `;
    
    const absences = await query(sql, [id]) as any[];
    
    if (!absences || absences.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Absence non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, absence: absences[0] });
    
  } catch (error) {
    console.error('❌ Erreur GET absence:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

// PUT /api/absences/[id] - Modifier une absence
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Récupérer l'ID depuis les paramètres
    const { id } = await params;
    
    const data = await request.json();
    console.log('📝 Modification absence ID:', id, 'Données:', data);
    
    // Vérifier si l'absence existe
    const checkSql = 'SELECT id FROM absences WHERE id = ?';
    const existing = await query(checkSql, [id]) as any[];
    
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Absence non trouvée' },
        { status: 404 }
      );
    }
    
    await runTransaction(async (connection) => {
      await connection.execute(
        `UPDATE absences SET
          date_absence = ?,
          heure_debut = ?,
          heure_fin = ?,
          type_absence = ?,
          duree_minutes = ?,
          justifiee = ?,
          motif = ?,
          piece_justificative = ?,
          cours_id = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          data.date_absence,
          data.heure_debut || null,
          data.heure_fin || null,
          data.type_absence,
          data.duree_minutes || 0,
          data.justifiee ? 1 : 0,
          data.motif,
          data.piece_justificative || null,
          data.cours_id || null,
          id
        ]
      );
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Absence modifiée avec succès' 
    });
    
  } catch (error) {
    console.error('❌ Erreur PUT absence:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}

// PATCH /api/absences/[id] - Justifier une absence
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Récupérer l'ID depuis les paramètres
    const { id } = await params;
    
    const body = await request.json();
    console.log('🔧 Justification absence ID:', id, 'Données:', body);
    
    // Vérifier si l'absence existe
    const checkSql = 'SELECT * FROM absences WHERE id = ?';
    const existing = await query(checkSql, [id]) as any[];
    
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Absence non trouvée' },
        { status: 404 }
      );
    }
    
    // Conversion robuste de justifiee
    let justifieeValue: number;
    if (body.justifiee === true || body.justifiee === 1 || body.justifiee === '1') {
      justifieeValue = 1;
    } else if (body.justifiee === false || body.justifiee === 0 || body.justifiee === '0') {
      justifieeValue = 0;
    } else {
      // Si non spécifié, garder la valeur existante
      justifieeValue = existing[0].justifiee;
    }
    
    const piece_justificative = body.piece_justificative || existing[0].piece_justificative;
    
    const updateSql = `
      UPDATE absences 
      SET justifiee = ?, 
          piece_justificative = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(updateSql, [justifieeValue, piece_justificative, id]);
    
    // Récupérer l'absence mise à jour
    const updated = await query(checkSql, [id]) as any[];
    
    return NextResponse.json({ 
      success: true, 
      message: 'Absence justifiée avec succès',
      data: updated[0]
    });
    
  } catch (error) {
    console.error('❌ Erreur PATCH:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la justification' },
      { status: 500 }
    );
  }
}

// DELETE /api/absences/[id] - Supprimer une absence
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Récupérer l'ID depuis les paramètres
    const { id } = await params;
    
    console.log('🗑️ Suppression absence ID:', id);
    
    // Vérifier si l'absence existe
    const checkSql = 'SELECT id FROM absences WHERE id = ?';
    const existing = await query(checkSql, [id]) as any[];
    
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Absence non trouvée' },
        { status: 404 }
      );
    }
    
    await query('DELETE FROM absences WHERE id = ?', [id]);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Absence supprimée avec succès' 
    });
    
  } catch (error) {
    console.error('❌ Erreur DELETE absence:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}