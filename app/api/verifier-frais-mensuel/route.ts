import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eleveId = searchParams.get('eleve_id');
    const fraisScolaireId = searchParams.get('frais_scolaire_id');
    const mois = searchParams.get('mois'); // Format: YYYY-MM

    if (!eleveId || !fraisScolaireId) {
      return NextResponse.json({
        success: false,
        erreur: 'Paramètres manquants'
      }, { status: 400 });
    }

    // Déterminer le mois à vérifier (mois en cours par défaut)
    let moisVerification = mois;
    if (!moisVerification) {
      const maintenant = new Date();
      moisVerification = `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}`;
    }

    // Vérifier si un paiement existe déjà pour ce mois
    const sql = `
      SELECT COUNT(*) as count 
      FROM paiements_frais pf
      INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
      WHERE fe.eleve_id = ? 
        AND fe.frais_scolaire_id = ?
        AND pf.statut = 'paye'
        AND DATE_FORMAT(pf.date_paiement, '%Y-%m') = ?
    `;
    
    const result = await query(sql, [
      parseInt(eleveId), 
      parseInt(fraisScolaireId),
      moisVerification
    ]) as any[];
    
    const paiementExiste = result[0].count > 0;
    
    return NextResponse.json({
      success: true,
      paiement_existe: paiementExiste,
      mois: moisVerification,
      peut_payer: !paiementExiste,
      message: paiementExiste ? 
        `Un paiement pour ce frais existe déjà pour le mois de ${moisVerification}` : 
        `Aucun paiement trouvé pour le mois de ${moisVerification}`
    });
  } catch (error: any) {
    console.error('Erreur vérification frais mensuel:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la vérification du frais mensuel',
        peut_payer: true
      },
      { status: 500 }
    );
  }
}