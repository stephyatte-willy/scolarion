import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const anneeScolaire = searchParams.get('annee_scolaire');
    const categorie = searchParams.get('categorie');
    const statut = searchParams.get('statut');

    let sql = `
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
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (anneeScolaire) {
      sql += ' AND b.annee_scolaire = ?';
      params.push(anneeScolaire);
    }

    if (categorie) {
      sql += ' AND b.categorie = ?';
      params.push(categorie);
    }

    sql += ' GROUP BY b.id ORDER BY b.categorie';

    const budgets = await query(sql, params) as any[];
    
    // Convertir les chaînes en nombres
    const budgetsFormates = budgets.map(budget => ({
      ...budget,
      montant_alloue: Number(budget.montant_alloue) || 0,
      montant_depense: Number(budget.montant_depense) || 0,
      pourcentage_utilisation: Number(budget.pourcentage_utilisation) || 0
    }));
    
    // Appliquer le filtre statut si spécifié
    const budgetsFiltres = statut 
      ? budgetsFormates.filter(b => b.statut === statut)
      : budgetsFormates;

    return NextResponse.json({
      success: true,
      budgets: budgetsFiltres
    });
  } catch (error: any) {
    console.error('Erreur récupération budgets:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la récupération des budgets',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation
    if (!body.annee_scolaire || !body.categorie || !body.montant_alloue) {
      return NextResponse.json(
        { success: false, erreur: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO budgets (annee_scolaire, categorie, montant_alloue, description, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    const result = await query(sql, [
      body.annee_scolaire,
      body.categorie,
      body.montant_alloue,
      body.description || null
    ]) as any;

    return NextResponse.json({
      success: true,
      budget: { 
        id: result.insertId, 
        ...body,
        montant_depense: 0,
        pourcentage_utilisation: 0,
        statut: 'dans_les_normes'
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur création budget:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la création du budget',
        details: error.message 
      },
      { status: 500 }
    );
  }
}