import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Dans Next.js 13+, params est une Promise
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    console.log('🔍 Tentative de suppression de la période ID:', id);
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID invalide' 
        },
        { status: 400 }
      );
    }
    
    const numericId = parseInt(id);
    
    // Vérifier si la période existe
    const existing = await query(
      'SELECT * FROM periodes_primaire WHERE id = ?', 
      [numericId]
    ) as any[];
    
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Période non trouvée' 
        },
        { status: 404 }
      );
    }

    const periode = existing[0];
    
    // Vérifier si c'est la période courante
    if (periode.est_periode_courante) {
      return NextResponse.json({
        success: false,
        error: 'Impossible de supprimer la période courante'
      }, { status: 400 });
    }
    
    // Vérifier les dépendances
    const checkDepsSql = `
      SELECT 
        (SELECT COUNT(*) FROM compositions_primaire WHERE periode_id = ?) as compositions_count,
        (SELECT COUNT(*) FROM releves_primaire WHERE periode_id = ?) as releves_count
    `;
    
    const depsResult = await query(checkDepsSql, [numericId, numericId]) as any[];
    const deps = depsResult[0];
    
    if (deps.compositions_count > 0) {
      return NextResponse.json({
        success: false,
        error: `Impossible de supprimer: ${deps.compositions_count} composition(s) utilisent cette période`
      }, { status: 400 });
    }
    
    if (deps.releves_count > 0) {
      return NextResponse.json({
        success: false,
        error: `Impossible de supprimer: ${deps.releves_count} relevé(s) utilisent cette période`
      }, { status: 400 });
    }

    // Supprimer la période
    await query('DELETE FROM periodes_primaire WHERE id = ?', [numericId]);

    return NextResponse.json({
      success: true,
      message: 'Période supprimée avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur DELETE période:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const data = await request.json();
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ID invalide' 
        },
        { status: 400 }
      );
    }
    
    const numericId = parseInt(id);
    
    console.log('📥 Modification période ID:', numericId, 'Données:', data);

    // Vérifier si la période existe
    const existing = await query(
      'SELECT * FROM periodes_primaire WHERE id = ?', 
      [numericId]
    ) as any[];
    
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Période non trouvée' 
        },
        { status: 404 }
      );
    }

    const currentPeriode = existing[0];
    
    // Si on définit comme période courante, désactiver les autres
    if (data.est_periode_courante && !currentPeriode.est_periode_courante) {
      await query(
        'UPDATE periodes_primaire SET est_periode_courante = FALSE WHERE est_periode_courante = TRUE',
        []
      );
    }

    // Préparer les champs à mettre à jour
    const updates: string[] = [];
    const queryParams: any[] = [];
    
    if (data.nom !== undefined) {
      updates.push('nom = ?');
      queryParams.push(data.nom?.trim() || '');
    }
    
    if (data.code_periode !== undefined) {
      updates.push('code_periode = ?');
      queryParams.push(data.code_periode?.trim() || '');
    }
    
    if (data.annee_scolaire !== undefined) {
      updates.push('annee_scolaire = ?');
      queryParams.push(data.annee_scolaire?.trim() || '');
    }
    
    if (data.date_debut !== undefined) {
      updates.push('date_debut = ?');
      queryParams.push(data.date_debut?.trim() || '');
    }
    
    if (data.date_fin !== undefined) {
      updates.push('date_fin = ?');
      queryParams.push(data.date_fin?.trim() || '');
    }
    
    if (data.type_periode !== undefined) {
      updates.push('type_periode = ?');
      queryParams.push(data.type_periode?.trim() || 'trimestre');
    }
    
    if (data.numero !== undefined) {
      updates.push('numero = ?');
      queryParams.push(parseInt(data.numero) || 1);
    }
    
    if (data.est_periode_courante !== undefined) {
      updates.push('est_periode_courante = ?');
      queryParams.push(data.est_periode_courante ? 1 : 0);
    }
    
    if (data.statut !== undefined) {
      updates.push('statut = ?');
      queryParams.push(data.statut?.trim() || 'active');
    }
    
    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }
    
    updates.push('updated_at = NOW()');
    queryParams.push(numericId);
    
    const updateSql = `UPDATE periodes_primaire SET ${updates.join(', ')} WHERE id = ?`;
    
    await query(updateSql, queryParams);

    // Récupérer la période mise à jour
    const [updatedPeriode] = await query(
      'SELECT * FROM periodes_primaire WHERE id = ?', 
      [numericId]
    ) as any[];

    return NextResponse.json({
      success: true,
      periode: updatedPeriode,
      message: 'Période modifiée avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur PUT période:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la modification: ${error.message}` 
      },
      { status: 500 }
    );
  }
}