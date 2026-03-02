// /api/finance/verifier-paiement-scolarite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eleveId = searchParams.get('eleve_id');
    const fraisScolaireId = searchParams.get('frais_scolaire_id');

    if (!eleveId || !fraisScolaireId) {
      return NextResponse.json({
        success: false,
        erreur: 'Paramètres manquants'
      }, { status: 400 });
    }

    // Vérifier s'il existe déjà un paiement global de scolarité pour cette année
    const sql = `
      SELECT COUNT(*) as count 
      FROM paiements_frais pf
      INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE fe.eleve_id = ?
        AND fe.frais_scolaire_id = ?
        AND cf.type = 'scolarite'
        AND YEAR(pf.date_paiement) = YEAR(CURDATE())
        AND pf.numero_versement IS NULL
        AND pf.statut = 'paye'
    `;
    
    const result = await query(sql, [parseInt(eleveId), parseInt(fraisScolaireId)]) as any[];
    
    const peutPayer = result[0].count === 0;
    
    return NextResponse.json({
      success: true,
      peut_payer: peutPayer,
      message: peutPayer ? 
        "Paiement de scolarité autorisé" : 
        "Un paiement global de scolarité existe déjà pour cette année"
    });
  } catch (error: any) {
    console.error('Erreur vérification paiement scolarité:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la vérification du paiement scolarité',
        peut_payer: true
      },
      { status: 500 }
    );
  }
}