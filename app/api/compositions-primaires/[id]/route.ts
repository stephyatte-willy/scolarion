import { NextRequest, NextResponse } from 'next/server';
import { query, runTransaction } from '@/app/lib/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

// Interface pour la composition
interface CompositionPrimaire extends RowDataPacket {
  id: number;
  titre: string;
  classe_id: number;
  classe_nom: string;
  classe_niveau?: string;
  instituteur_id: number;
  instituteur_nom: string;
  date_composition: string;
  periode_id: number;
  periode_nom: string;
  annee_scolaire: string;
  statut: string;
  notes_saisies: boolean;
  releves_generes: boolean;
  est_supprime: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID composition invalide' },
        { status: 400 }
      );
    }
    
    const sql = 'SELECT * FROM compositions_primaire WHERE id = ? AND est_supprime = FALSE';
    const compositions = await query(sql, [idNum]) as CompositionPrimaire[];
    
    if (!compositions || compositions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Composition non trouvée' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      composition: compositions[0]
    });
  } catch (error: any) {
    console.error('❌ Erreur GET composition par ID:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID composition invalide' },
        { status: 400 }
      );
    }
    
    const data = await request.json();
    
    // Vérifier si la composition existe
    const checkSql = 'SELECT * FROM compositions_primaire WHERE id = ? AND est_supprime = FALSE';
    const existing = await query(checkSql, [idNum]) as CompositionPrimaire[];
    
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Composition non trouvée' },
        { status: 404 }
      );
    }
    
    // Validation
    if (!data.titre?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Titre requis' },
        { status: 400 }
      );
    }
    
    if (!data.statut) {
      return NextResponse.json(
        { success: false, error: 'Statut requis' },
        { status: 400 }
      );
    }
    
    // Construire la requête UPDATE
    const updateFields = [];
    const updateParams: any[] = [];
    
    updateFields.push('titre = ?');
    updateParams.push(data.titre);
    
    updateFields.push('statut = ?');
    updateParams.push(data.statut);
    
    if (data.date_composition) {
      updateFields.push('date_composition = ?');
      updateParams.push(data.date_composition);
    }
    
    updateFields.push('updated_at = NOW()');
    
    updateParams.push(idNum);
    
    const updateSql = `UPDATE compositions_primaire SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await query(updateSql, updateParams);
    
    // Récupérer la composition mise à jour
    const updated = await query(checkSql, [idNum]) as CompositionPrimaire[];
    const composition = updated && updated.length > 0 ? updated[0] : null;
    
    return NextResponse.json({
      success: true,
      composition: composition,
      message: 'Composition mise à jour avec succès'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur PUT composition:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la mise à jour: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID composition invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier si la composition existe
    const checkSql = 'SELECT * FROM compositions_primaire WHERE id = ? AND est_supprime = FALSE';
    const compositions = await query(checkSql, [idNum]) as CompositionPrimaire[];
    
    if (!compositions || compositions.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Composition non trouvée ou déjà supprimée' },
        { status: 404 }
      );
    }
    
    const composition = compositions[0];
    
    // Utiliser runTransaction
    const result = await runTransaction(async (connection) => {
      // 1. Marquer la composition comme supprimée (soft delete)
      const updateCompSql = 'UPDATE compositions_primaire SET est_supprime = TRUE, updated_at = NOW() WHERE id = ?';
      await connection.execute(updateCompSql, [idNum]);
      
      // 2. Supprimer les notes associées (hard delete)
      const deleteNotesSql = 'DELETE FROM notes_primaire WHERE composition_id = ?';
      const [notesResult] = await connection.execute(deleteNotesSql, [idNum]);
      const notesSupprimees = (notesResult as ResultSetHeader).affectedRows || 0;
      
      // 3. Supprimer les relevés associés (hard delete)
      const deleteRelevesSql = 'DELETE FROM releves_primaire WHERE periode_id = ? AND classe_id = ?';
      const [relevesResult] = await connection.execute(deleteRelevesSql, [
        composition.periode_id,
        composition.classe_id
      ]);
      const relevesSupprimes = (relevesResult as ResultSetHeader).affectedRows || 0;
      
      return {
        notes_supprimees: notesSupprimees,
        releves_supprimes: relevesSupprimes,
        composition: composition
      };
    });
    
    return NextResponse.json({
      success: true,
      message: `Composition supprimée avec succès`,
      details: {
        notes_supprimees: result.notes_supprimees,
        releves_supprimes: result.releves_supprimes,
        composition: result.composition.titre
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur DELETE composition:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la suppression: ${error.message}`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}