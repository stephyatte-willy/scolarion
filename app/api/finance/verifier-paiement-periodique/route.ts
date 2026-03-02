// /api/finance/verifier-paiement-periodique/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eleveId = searchParams.get('eleve_id');
    const fraisScolaireId = searchParams.get('frais_scolaire_id');
    const periodicite = searchParams.get('periodicite');

    if (!eleveId || !fraisScolaireId || !periodicite) {
      return NextResponse.json({
        success: false,
        erreur: 'Paramètres manquants'
      }, { status: 400 });
    }

    // Récupérer le frais scolaire pour connaître la catégorie
    const sqlFraisScolaire = `
      SELECT fs.*, cf.periodicite as categorie_periodicite, cf.type as categorie_type
      FROM frais_scolaires fs
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE fs.id = ?
    `;
    
    const fraisScolaireResult = await query(sqlFraisScolaire, [parseInt(fraisScolaireId)]) as any[];
    
    if (fraisScolaireResult.length === 0) {
      return NextResponse.json({
        success: true,
        peut_payer: true
      });
    }

    const fraisScolaire = fraisScolaireResult[0];
    
    // POUR LA SCOLARITÉ, on a une logique différente
    if (fraisScolaire.categorie_type === 'scolarite') {
      // Pour la scolarité, on vérifie seulement si un paiement global existe
      const checkGlobalScolariteSql = `
        SELECT COUNT(*) as count 
        FROM paiements_frais pf
        INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
        WHERE fe.eleve_id = ?
          AND fe.frais_scolaire_id = ?
          AND YEAR(pf.date_paiement) = YEAR(CURDATE())
          AND pf.numero_versement IS NULL
          AND pf.statut = 'paye'
      `;
      
      const result = await query(checkGlobalScolariteSql, [
        parseInt(eleveId), 
        parseInt(fraisScolaireId)
      ]) as any[];
      
      const peutPayer = result[0].count === 0;
      
      return NextResponse.json({
        success: true,
        peut_payer: peutPayer,
        message: peutPayer ? 
          "Paiement de scolarité autorisé" : 
          "Un paiement global de scolarité existe déjà pour cette année"
      });
    }
    
    // Pour les autres types de frais (non-scolarité)
    let sqlVerification = `
      SELECT COUNT(*) as count 
      FROM paiements_frais pf
      INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
      WHERE fe.eleve_id = ? 
        AND fe.frais_scolaire_id = ?
        AND pf.statut = 'paye'
    `;
    
    const params: any[] = [parseInt(eleveId), parseInt(fraisScolaireId)];
    
    // Ajouter des conditions basées sur la périodicité
    const aujourdhui = new Date();
    let conditionTemporelle = '';
    
    switch (periodicite) {
      case 'mensuel':
        conditionTemporelle = `
          AND MONTH(pf.date_paiement) = MONTH(?)
          AND YEAR(pf.date_paiement) = YEAR(?)
        `;
        params.push(aujourdhui, aujourdhui);
        break;
        
      case 'trimestriel':
        const trimestre = Math.floor((aujourdhui.getMonth() + 3) / 3);
        conditionTemporelle = `
          AND QUARTER(pf.date_paiement) = ?
          AND YEAR(pf.date_paiement) = YEAR(?)
        `;
        params.push(trimestre, aujourdhui);
        break;
        
      case 'annuel':
        conditionTemporelle = `
          AND YEAR(pf.date_paiement) = YEAR(?)
        `;
        params.push(aujourdhui);
        break;
        
      case 'unique':
        // Pour les frais uniques, on vérifie simplement s'il y a eu un paiement
        conditionTemporelle = '';
        break;
    }
    
    sqlVerification += conditionTemporelle;
    
    const result = await query(sqlVerification, params) as any[];
    
    const peutPayer = result[0].count === 0;
    
    return NextResponse.json({
      success: true,
      peut_payer: peutPayer,
      message: peutPayer ? 
        "Aucun paiement trouvé pour cette période" : 
        "Un paiement existe déjà pour cette période"
    });
  } catch (error: any) {
    console.error('Erreur vérification paiement périodique:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la vérification du paiement périodique',
        peut_payer: true // En cas d'erreur, on autorise le paiement
      },
      { status: 500 }
    );
  }
}