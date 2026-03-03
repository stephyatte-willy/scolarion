// app/api/matieres-primaires/[id]/check-delete.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // ✅ Récupération asynchrone de l'ID
    const { id } = await params;
    const matiereId = parseInt(id);
    
    console.log('🔍 Vérification suppression matière ID:', matiereId);
    
    if (isNaN(matiereId) || matiereId <= 0) {
      return NextResponse.json({
        success: false,
        error: 'ID de matière invalide'
      }, { status: 400 });
    }

    // 1. Vérifier si la matière existe
    const matiereSql = 'SELECT * FROM matieres_primaire WHERE id = ? AND est_supprime = FALSE';
    const matiereResult = await query(matiereSql, [matiereId]) as any[];
    
    if (!Array.isArray(matiereResult) || matiereResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Matière non trouvée'
      }, { status: 404 });
    }

    // 2. Vérifier si la matière est utilisée dans des notes
    const notesSql = 'SELECT COUNT(*) as count FROM notes_primaire WHERE matiere_id = ?';
    const notesResult = await query(notesSql, [matiereId]) as any[];
    const notesCount = Array.isArray(notesResult) && notesResult[0] 
      ? parseInt(notesResult[0].count) || 0 
      : 0;

    // 3. Vérifier si la matière est utilisée dans des compositions
    const compositionsSql = 'SELECT COUNT(*) as count FROM compositions_primaire WHERE matiere_id = ?';
    const compositionsResult = await query(compositionsSql, [matiereId]) as any[];
    const compositionsCount = Array.isArray(compositionsResult) && compositionsResult[0] 
      ? parseInt(compositionsResult[0].count) || 0 
      : 0;

    // 4. Déterminer si la matière peut être supprimée
    const canBeDeleted = notesCount === 0 && compositionsCount === 0;
    
    return NextResponse.json({
      success: true,
      can_be_deleted: canBeDeleted,
      notes_count: notesCount,
      compositions_count: compositionsCount,
      error: !canBeDeleted 
        ? 'Cette matière ne peut pas être supprimée car elle est utilisée dans des notes ou des compositions' 
        : null
    });

  } catch (error: any) {
    console.error('❌ Erreur vérification matière:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Erreur lors de la vérification: ${error.message || 'Erreur inconnue'}`
    }, { status: 500 });
  }
}