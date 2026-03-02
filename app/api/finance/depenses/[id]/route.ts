// app/api/finance/depenses/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Définir les types
interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const depenseId = parseInt(id);
    
    console.log('🔧 PUT /api/finance/depenses/[id] - ID:', depenseId);
    
    if (!depenseId || isNaN(depenseId)) {
      console.error('❌ ID de dépense invalide:', id);
      return NextResponse.json(
        { success: false, erreur: 'ID de dépense invalide' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    console.log('📝 Données reçues:', body);
    
    // Validation
    const champsRequis = [
      { nom: 'budget_id', valeur: body.budget_id },
      { nom: 'description', valeur: body.description },
      { nom: 'montant', valeur: body.montant },
      { nom: 'date_depense', valeur: body.date_depense },
      { nom: 'beneficiaire', valeur: body.beneficiaire }
    ];
    
    const champsManquants = champsRequis.filter(champ => 
      !champ.valeur || (champ.nom === 'montant' && champ.valeur <= 0)
    );
    
    if (champsManquants.length > 0) {
      console.error('❌ Champs requis manquants:', champsManquants);
      return NextResponse.json(
        { success: false, erreur: 'Champs requis manquants: ' + champsManquants.map(c => c.nom).join(', ') },
        { status: 400 }
      );
    }
    
    // Vérifier si la dépense existe
    const checkSql = 'SELECT * FROM depenses_budget WHERE id = ?';
    console.log('🔍 SQL Check:', checkSql, 'ID:', depenseId);
    
    const existingDepense = await query(checkSql, [depenseId]) as any[];
    
    if (existingDepense.length === 0) {
      console.error('❌ Dépense non trouvée ID:', depenseId);
      return NextResponse.json(
        { success: false, erreur: 'Dépense non trouvée' },
        { status: 404 }
      );
    }
    
    console.log('✅ Dépense trouvée:', existingDepense[0]);
    
    // Mettre à jour la dépense
    const sql = `
      UPDATE depenses_budget 
      SET 
        budget_id = ?,
        description = ?,
        montant = ?,
        date_depense = ?,
        categorie = ?,
        beneficiaire = ?,
        reference = ?,
        statut = ?,
        type_depense = ?,
        mode_paiement = ?,
        sous_categorie = ?,
        numero_facture = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    
    const valeurs = [
      body.budget_id,
      body.description,
      body.montant,
      body.date_depense,
      body.type_depense || 'divers',
      body.beneficiaire,
      body.reference || null,
      body.statut || 'valide',
      body.type_depense || 'divers',
      body.mode_paiement || 'especes',
      body.sous_categorie || null,
      body.numero_facture || null,
      body.notes || null,
      depenseId
    ];
    
    console.log('🔧 SQL Update:', sql);
    console.log('🔧 Valeurs:', valeurs);
    
    await query(sql, valeurs);
    
    console.log('✅ Dépense mise à jour');
    
    // Mettre à jour les statistiques du budget
    try {
      const updateBudgetSql = `
        UPDATE budgets 
        SET montant_depense = (
          SELECT COALESCE(SUM(montant), 0) 
          FROM depenses_budget 
          WHERE budget_id = ? AND statut IN ('valide', 'paye')
        )
        WHERE id = ?
      `;
      
      await query(updateBudgetSql, [body.budget_id, body.budget_id]);
      console.log('✅ Budget mis à jour');
    } catch (budgetError) {
      console.error('⚠️ Erreur lors de la mise à jour du budget:', budgetError);
      // Continuer même si la mise à jour du budget échoue
    }
    
    // Récupérer la dépense mise à jour
    const updatedDepenseSql = `
      SELECT 
        db.*,
        b.categorie as budget_categorie
      FROM depenses_budget db
      INNER JOIN budgets b ON db.budget_id = b.id
      WHERE db.id = ?
    `;
    
    const updatedDepense = await query(updatedDepenseSql, [depenseId]) as any[];
    
    console.log('📋 Dépense mise à jour récupérée:', updatedDepense[0]);
    
    return NextResponse.json({
      success: true,
      depense: updatedDepense[0],
      message: 'Dépense modifiée avec succès'
    });
  } catch (error: any) {
    console.error('❌ Erreur modification dépense:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la modification de la dépense',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params;
    const depenseId = parseInt(id);
    
    console.log('🗑️ DELETE /api/finance/depenses/[id] - ID:', depenseId);
    
    if (!depenseId || isNaN(depenseId)) {
      console.error('❌ ID de dépense invalide:', id);
      return NextResponse.json(
        { success: false, erreur: 'ID de dépense invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier si la dépense existe et récupérer le budget_id
    const checkSql = 'SELECT * FROM depenses_budget WHERE id = ?';
    console.log('🔍 SQL Check:', checkSql, 'ID:', depenseId);
    
    const existingDepense = await query(checkSql, [depenseId]) as any[];
    
    if (existingDepense.length === 0) {
      console.error('❌ Dépense non trouvée ID:', depenseId);
      return NextResponse.json(
        { success: false, erreur: 'Dépense non trouvée' },
        { status: 404 }
      );
    }
    
    console.log('✅ Dépense trouvée:', existingDepense[0]);
    
    const budgetId = existingDepense[0].budget_id;
    console.log('💰 Budget ID:', budgetId);
    
    // Supprimer la dépense
    const deleteSql = 'DELETE FROM depenses_budget WHERE id = ?';
    console.log('🔧 SQL Delete:', deleteSql, 'ID:', depenseId);
    
    await query(deleteSql, [depenseId]);
    console.log('✅ Dépense supprimée');
    
    // Mettre à jour les statistiques du budget
    try {
      const updateBudgetSql = `
        UPDATE budgets 
        SET montant_depense = (
          SELECT COALESCE(SUM(montant), 0) 
          FROM depenses_budget 
          WHERE budget_id = ? AND statut IN ('valide', 'paye')
        )
        WHERE id = ?
      `;
      
      await query(updateBudgetSql, [budgetId, budgetId]);
      console.log('✅ Budget mis à jour');
    } catch (budgetError) {
      console.error('⚠️ Erreur lors de la mise à jour du budget:', budgetError);
      // Continuer même si la mise à jour du budget échoue
    }
    
    return NextResponse.json({
      success: true,
      message: 'Dépense supprimée avec succès'
    });
  } catch (error: any) {
    console.error('❌ Erreur suppression dépense:', error);
    console.error('❌ Stack trace:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la suppression de la dépense',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}