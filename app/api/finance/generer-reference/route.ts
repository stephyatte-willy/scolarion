// /api/finance/generer-reference/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categorieBudget = searchParams.get('categorie_budget');
    const typeDepense = searchParams.get('type_depense');
    
    if (!categorieBudget || !typeDepense) {
      return NextResponse.json(
        { success: false, erreur: 'Catégorie budget et type dépense requis' },
        { status: 400 }
      );
    }

    const maintenant = new Date();
    const jour = maintenant.getDate().toString().padStart(2, '0');
    const mois = (maintenant.getMonth() + 1).toString().padStart(2, '0');
    const annee = maintenant.getFullYear().toString().slice(-2);
    
    // Codes pour les types de budget
    const codesBudget: Record<string, string> = {
      'personnel': 'PR',
      'fonctionnement': 'FN',
      'pedagogique': 'PD',
      'electricité': 'EL',
      'eau': 'EA',
      'maintenance': 'MT',
      'fournitures': 'FR',
      'equipement': 'EQ',
      'restauration': 'RS',
      'transport': 'TR',
      'activites': 'AC',
      'formation': 'FM',
      'publicite': 'PB',
      'frais_financiers': 'FF',
      'impots_taxes': 'IT',
      'divers': 'DV'
    };
    
    // Codes pour les types de dépense
    const codesDepense: Record<string, string> = {
      'salaires': 'SL',
      'honoraires': 'HR',
      'loyer': 'LR',
      'electricite': 'EL',
      'eau': 'EA',
      'telecom': 'TC',
      'fournitures_bureau': 'FB',
      'materiel_scolaire': 'MS',
      'maintenance_equipement': 'ME',
      'frais_deplacement': 'FD',
      'publicite_marketing': 'PM',
      'formation': 'FR',
      'assurances': 'AS',
      'frais_bancaires': 'FB',
      'impots_taxes': 'IT',
      'divers': 'DV'
    };
    
    const codeBudget = codesBudget[categorieBudget] || 'XX';
    const codeDepense = codesDepense[typeDepense] || 'XX';
    
    // Vérifier si la référence existe déjà dans la base de données
    let referenceUnique = false;
    let reference = '';
    let tentatives = 0;
    const maxTentatives = 10;
    
    while (!referenceUnique && tentatives < maxTentatives) {
      // Générer un numéro séquentiel aléatoire
      const numeroSeq = Math.floor(1000 + Math.random() * 9000);
      
      // Construire la référence
      reference = `${codeBudget}${codeDepense}${jour}${mois}${annee}${numeroSeq}`.slice(0, 15).toUpperCase();
      
      // Vérifier si la référence existe déjà
      const sql = 'SELECT COUNT(*) as count FROM depenses_budget WHERE reference = ?';
      const result = await query(sql, [reference]) as any[];
      
      if (result[0].count === 0) {
        referenceUnique = true;
      }
      
      tentatives++;
    }
    
    if (!referenceUnique) {
      // En cas d'échec après plusieurs tentatives, ajouter un timestamp
      const timestamp = Date.now().toString().slice(-4);
      reference = `${codeBudget}${codeDepense}${jour}${mois}${annee}${timestamp}`.slice(0, 15).toUpperCase();
    }
    
    return NextResponse.json({
      success: true,
      reference,
      format: `${codeBudget}-${codeDepense}-${jour}${mois}${annee}-XXXX`,
      explication: `Budget: ${categorieBudget}, Dépense: ${typeDepense}, Date: ${jour}/${mois}/${annee}`
    });
    
  } catch (error: any) {
    console.error('Erreur génération référence:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la génération de la référence' },
      { status: 500 }
    );
  }
}