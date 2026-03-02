// /api/finance/budget/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// CORRECTION : Interface pour le contexte
interface Context {
  params: Promise<{ id: string }>;
}

export async function PUT(
  request: NextRequest,
  context: Context
) {
  try {
    const { id } = await context.params; // CORRECTION : Ajouter await
    const budgetId = parseInt(id);
    
    console.log('Modification budget ID:', budgetId);
    
    if (!budgetId || isNaN(budgetId)) {
      return NextResponse.json(
        { success: false, erreur: 'ID de budget invalide' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    console.log('Données reçues:', body);
    
    // Validation
    if (!body.categorie || !body.montant_alloue) {
      return NextResponse.json(
        { success: false, erreur: 'Champs requis manquants' },
        { status: 400 }
      );
    }
    
    // Vérifier si le budget existe
    const checkSql = 'SELECT * FROM budgets WHERE id = ?';
    const existingBudget = await query(checkSql, [budgetId]) as any[];
    
    if (existingBudget.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Budget non trouvé' },
        { status: 404 }
      );
    }
    
    // Mettre à jour le budget
    const sql = `
      UPDATE budgets 
      SET 
        categorie = ?,
        montant_alloue = ?,
        description = ?,
        updated_at = NOW()
      WHERE id = ?
    `;
    
    await query(sql, [
      body.categorie,
      body.montant_alloue,
      body.description || null,
      budgetId
    ]);
    
    // Récupérer le budget mis à jour avec les calculs
    const updatedBudgetSql = `
      SELECT 
        b.*,
        COALESCE(SUM(db.montant), 0) as montant_depense,
        CASE 
          WHEN b.montant_alloue > 0 THEN 
            ROUND((COALESCE(SUM(db.montant), 0) / b.montant_alloue) * 100, 1)
          ELSE 0
        END as pourcentage_utilisation,
        CASE 
          WHEN COALESCE(SUM(db.montant), 0) >= b.montant_alloue THEN 'depasse'
          WHEN (COALESCE(SUM(db.montant), 0) / b.montant_alloue) >= 0.8 THEN 'en_alerte'
          ELSE 'dans_les_normes'
        END as statut
      FROM budgets b
      LEFT JOIN depenses_budget db ON b.id = db.budget_id AND db.statut IN ('valide', 'paye')
      WHERE b.id = ?
      GROUP BY b.id
    `;
    
    const updatedBudget = await query(updatedBudgetSql, [budgetId]) as any[];
    
    return NextResponse.json({
      success: true,
      budget: updatedBudget[0]
    });
  } catch (error: any) {
    console.error('Erreur modification budget:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la modification du budget',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: Context
) {
  try {
    const { id } = await context.params;
    const budgetId = parseInt(id);
    
    console.log('Suppression budget ID:', budgetId);
    
    if (!budgetId || isNaN(budgetId)) {
      return NextResponse.json(
        { success: false, erreur: 'ID de budget invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier si le budget existe
    const checkSql = 'SELECT * FROM budgets WHERE id = ?';
    const existingBudget = await query(checkSql, [budgetId]) as any[];
    
    if (existingBudget.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Budget non trouvé' },
        { status: 404 }
      );
    }
    
    // Vérifier si le budget a des dépenses associées
    const checkDepensesSql = 'SELECT COUNT(*) as count FROM depenses_budget WHERE budget_id = ?';
    const depensesResult = await query(checkDepensesSql, [budgetId]) as any[];
    const nombreDepenses = depensesResult[0]?.count || 0;
    
    if (nombreDepenses > 0) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: `Ce budget a ${nombreDepenses} dépense(s) associée(s). Supprimez d'abord les dépenses avant de supprimer le budget.`
        },
        { status: 400 }
      );
    }
    
    // Supprimer le budget (seulement s'il n'y a pas de dépenses)
    const deleteBudgetSql = 'DELETE FROM budgets WHERE id = ?';
    await query(deleteBudgetSql, [budgetId]);
    
    return NextResponse.json({
      success: true,
      message: 'Budget supprimé avec succès'
    });
  } catch (error: any) {
    console.error('Erreur suppression budget:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la suppression du budget',
        details: error.message 
      },
      { status: 500 }
    );
  }
}