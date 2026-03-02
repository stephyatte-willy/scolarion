import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const budgetId = parseInt(params.id);
    
    if (!budgetId || isNaN(budgetId)) {
      return NextResponse.json(
        { success: false, erreur: 'ID de budget invalide' },
        { status: 400 }
      );
    }

    const sql = `
      SELECT 
        db.*,
        b.categorie as budget_categorie,
        b.montant_alloue as budget_alloue
      FROM depenses_budget db
      INNER JOIN budgets b ON db.budget_id = b.id
      WHERE db.budget_id = ?
      ORDER BY db.date_depense DESC, db.created_at DESC
    `;
    
    const depenses = await query(sql, [budgetId]) as any[];
    
    // Formater les données pour correspondre à l'interface
    const depensesFormatees = depenses.map(depense => ({
      ...depense,
      type_depense: depense.type_depense || 'divers',
      sous_categorie: depense.sous_categorie || null,
      mode_paiement: depense.mode_paiement || 'especes',
      numero_facture: depense.numero_facture || null,
      notes: depense.notes || null,
      justificatif_url: depense.justificatif_url || null
    }));
    
    return NextResponse.json({
      success: true,
      depenses: depensesFormatees
    });
  } catch (error: any) {
    console.error('Erreur récupération dépenses budget:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la récupération des dépenses du budget',
        details: error.message 
      },
      { status: 500 }
    );
  }
}