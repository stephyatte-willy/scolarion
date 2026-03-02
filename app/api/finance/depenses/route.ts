import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Dans /api/finance/depenses/route.ts - fonction GET
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Lire tous les paramètres de filtrage
    const dateDebut = searchParams.get('date_debut');
    const dateFin = searchParams.get('date_fin');
    const budgetId = searchParams.get('budget_id');
    const typeDepense = searchParams.get('type_depense');
    const modePaiement = searchParams.get('mode_paiement');
    const statut = searchParams.get('statut');
    const beneficiaire = searchParams.get('beneficiaire');
    const montantMin = searchParams.get('montant_min');
    const montantMax = searchParams.get('montant_max');
    const anneeScolaire = searchParams.get('annee_scolaire');
    
    let sql = `
      SELECT 
        d.*,
        b.categorie as budget_categorie,
        b.montant_alloue as budget_alloue
      FROM depenses_budget d
      LEFT JOIN budgets b ON d.budget_id = b.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Filtre par date
    if (dateDebut) {
      sql += ' AND d.date_depense >= ?';
      params.push(dateDebut);
    }
    
    if (dateFin) {
      sql += ' AND d.date_depense <= ?';
      params.push(dateFin);
    }
    
    // Filtre par budget
    if (budgetId) {
      sql += ' AND d.budget_id = ?';
      params.push(parseInt(budgetId));
    }
    
    // Filtre par type de dépense
    if (typeDepense) {
      sql += ' AND d.type_depense = ?';
      params.push(typeDepense);
    }
    
    // Filtre par mode de paiement
    if (modePaiement) {
      sql += ' AND d.mode_paiement = ?';
      params.push(modePaiement);
    }
    
    // Filtre par statut
    if (statut) {
      sql += ' AND d.statut = ?';
      params.push(statut);
    }
    
    // Filtre par bénéficiaire (recherche LIKE)
    if (beneficiaire) {
      sql += ' AND d.beneficiaire LIKE ?';
      params.push(`%${beneficiaire}%`);
    }
    
    // Filtre par montant minimum
    if (montantMin) {
      sql += ' AND d.montant >= ?';
      params.push(parseFloat(montantMin));
    }
    
    // Filtre par montant maximum
    if (montantMax) {
      sql += ' AND d.montant <= ?';
      params.push(parseFloat(montantMax));
    }
    
    // Filtre par année scolaire via le budget
    if (anneeScolaire) {
      sql += ' AND b.annee_scolaire = ?';
      params.push(anneeScolaire);
    }
    
    sql += ' ORDER BY d.date_depense DESC, d.created_at DESC';
    
    console.log('🔍 SQL dépenses avec filtres:', sql);
    console.log('🔍 Paramètres:', params);
    
    const depenses = await query(sql, params) as any[];
    
    // Formater les données
    const depensesFormatees = depenses.map(depense => ({
      id: depense.id,
      budget_id: depense.budget_id,
      budget_categorie: depense.budget_categorie || 'Non spécifié',
      type_depense: depense.type_depense || 'divers',
      sous_categorie: depense.sous_categorie,
      description: depense.description,
      montant: Number(depense.montant) || 0,
      date_depense: depense.date_depense,
      mode_paiement: depense.mode_paiement || 'especes',
      numero_facture: depense.numero_facture,
      beneficiaire: depense.beneficiaire,
      reference: depense.reference,
      statut: depense.statut || 'valide',
      notes: depense.notes,
      created_by: depense.created_by,
      created_at: depense.created_at,
      updated_at: depense.updated_at
    }));
    
    return NextResponse.json({
      success: true,
      depenses: depensesFormatees,
      total: depensesFormatees.length,
      montant_total: depensesFormatees.reduce((sum, d) => sum + d.montant, 0)
    });
  } catch (error: any) {
    console.error('❌ Erreur récupération dépenses:', error);
    return NextResponse.json({
      success: false,
      depenses: [],
      total: 0,
      montant_total: 0,
      erreur: error.message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Données reçues pour création dépense:', body);
    
    // Validation
    const champsRequis = [
      { nom: 'budget_id', valeur: body.budget_id },
      { nom: 'description', valeur: body.description },
      { nom: 'montant', valeur: body.montant },
      { nom: 'date_depense', valeur: body.date_depense },
      { nom: 'beneficiaire', valeur: body.beneficiaire }
    ];
    
    for (const champ of champsRequis) {
      if (!champ.valeur || (champ.nom === 'montant' && champ.valeur <= 0)) {
        return NextResponse.json(
          { 
            success: false, 
            erreur: `Le champ ${champ.nom} est requis`,
            details: `Valeur reçue: ${champ.valeur}`
          },
          { status: 400 }
        );
      }
    }
    
    // Vérifier le budget
    const budgetSql = 'SELECT * FROM budgets WHERE id = ?';
    const budgetResult = await query(budgetSql, [body.budget_id]) as any[];
    
    if (budgetResult.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Budget non trouvé' },
        { status: 404 }
      );
    }
    
    const budget = budgetResult[0];
    
    // Calculer le total des dépenses existantes pour ce budget
    const depensesExistantesSql = `
      SELECT COALESCE(SUM(montant), 0) as total_depenses 
      FROM depenses_budget 
      WHERE budget_id = ? AND statut IN ('valide', 'paye')
    `;
    
    const depensesExistantesResult = await query(depensesExistantesSql, [body.budget_id]) as any[];
    const totalDepensesExistantes = Number(depensesExistantesResult[0]?.total_depenses) || 0;
    const nouveauTotal = totalDepensesExistantes + Number(body.montant);
       
    // Insérer la dépense
    const insertSql = `
      INSERT INTO depenses_budget (
        budget_id, 
        description, 
        montant, 
        date_depense, 
        categorie, 
        beneficiaire, 
        reference, 
        statut, 
        type_depense,
        mode_paiement,
        sous_categorie,
        numero_facture,
        notes,
        created_by, 
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())
    `;
    
    console.log('Exécution SQL:', insertSql);
    console.log('Valeurs:', [
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
      body.notes || null
    ]);
    
    const result = await query(insertSql, [
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
      body.notes || null
    ]) as any;
    
    console.log('Résultat insertion:', result);
    
    // Mettre à jour le budget
    try {
      const updateBudgetSql = `
        UPDATE budgets 
        SET montant_depense = (
          SELECT COALESCE(SUM(montant), 0) 
          FROM depenses_budget 
          WHERE budget_id = ? AND statut IN ('valide', 'paye')
        ),
        updated_at = NOW()
        WHERE id = ?
      `;
      
      await query(updateBudgetSql, [body.budget_id, body.budget_id]);
    } catch (updateError) {
      console.warn('Erreur lors de la mise à jour du budget:', updateError);
      // Continuer même si la mise à jour échoue
    }
    
    return NextResponse.json({
      success: true,
      depense: {
        id: result.insertId,
        ...body,
        // Ajouter les champs pour correspondre à l'interface
        type_depense: body.type_depense || 'divers',
        mode_paiement: body.mode_paiement || 'especes',
        sous_categorie: body.sous_categorie || null,
        notes: body.notes || null,
        budget_categorie: budget.categorie
      },
      message: 'Dépense enregistrée avec succès'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur création dépense:', error);
    console.error('Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la création de la dépense',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}