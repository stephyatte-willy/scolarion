import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    if (!body.budget_id || !body.description || !body.montant || !body.date_depense) {
      return NextResponse.json(
        { success: false, erreur: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO depenses_budget 
        (budget_id, description, montant, date_depense, categorie, beneficiaire, reference, statut, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'valide', 1, NOW())
    `;
    
    const result = await query(sql, [
      body.budget_id,
      body.description,
      body.montant,
      body.date_depense,
      body.categorie,
      body.beneficiaire || null,
      body.reference || null
    ]) as any;

    return NextResponse.json({
      success: true,
      depense: { id: result.insertId, ...body }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur création dépense:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la création de la dépense' },
      { status: 500 }
    );
  }
}