import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Totaux réels paiements - Début GET');
    
    const searchParams = request.nextUrl.searchParams;
    
    // Récupérer les paramètres de filtrage
    const annee_scolaire = searchParams.get('annee_scolaire');
    const classe_id = searchParams.get('classe_id');
    const categorie_frais_id = searchParams.get('categorie_frais_id');
    const eleve_id = searchParams.get('eleve_id');

    // ✅ REQUÊTE POUR CALCULER LES TOTAUX RÉELS
    // Ces totaux sont basés sur les frais_eleves, pas sur les paiements
    let sql = `
      SELECT 
        SUM(fe.montant) AS total_a_payer,
        SUM(fe.montant_paye) AS total_paye,
        SUM(fe.montant - fe.montant_paye) AS reste_a_payer
      FROM frais_eleves fe
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN eleves e ON fe.eleve_id = e.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    // ✅ AJOUTER LES FILTRES
    if (annee_scolaire && annee_scolaire !== '') {
      sql += ` AND fe.annee_scolaire = ?`;
      params.push(annee_scolaire);
    }
    
    if (classe_id && classe_id !== '') {
      sql += ` AND e.classe_id = ?`;
      params.push(parseInt(classe_id));
    }
    
    if (categorie_frais_id && categorie_frais_id !== '') {
      sql += ` AND fs.categorie_frais_id = ?`;
      params.push(parseInt(categorie_frais_id));
    }
    
    if (eleve_id && eleve_id !== '') {
      sql += ` AND fe.eleve_id = ?`;
      params.push(parseInt(eleve_id));
    }

    console.log('📊 SQL Totaux réels:', sql);
    console.log('📊 Paramètres:', params);

    const result = await query(sql, params) as any[];
    
    const totaux = result[0] || {
      total_a_payer: 0,
      total_paye: 0,
      reste_a_payer: 0
    };

    console.log('✅ Totaux réels calculés:', {
      total_a_payer: totaux.total_a_payer || 0,
      total_paye: totaux.total_paye || 0,
      reste_a_payer: totaux.reste_a_payer || 0
    });

    return NextResponse.json({
      success: true,
      total_a_payer: Number(totaux.total_a_payer) || 0,
      total_paye: Number(totaux.total_paye) || 0,
      reste_a_payer: Number(totaux.reste_a_payer) || 0
    });
    
  } catch (error: any) {
    console.error('❌ Erreur calcul totaux réels:', error);
    console.error('❌ Message:', error.message);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur: ${error.message}`,
        total_a_payer: 0,
        total_paye: 0,
        reste_a_payer: 0
      },
      { status: 200 }
    );
  }
}