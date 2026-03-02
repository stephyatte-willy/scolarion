// /api/finance/verifier-inscription/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eleveId = searchParams.get('eleve_id');
    const anneeScolaire = searchParams.get('annee_scolaire');

    if (!eleveId || !anneeScolaire) {
      return NextResponse.json({
        success: false,
        erreur: 'Paramètres manquants'
      }, { status: 400 });
    }

    // Vérifier si l'inscription est payée pour cette année
    const sql = `
      SELECT 
        fe.id,
        fe.statut,
        fe.montant,
        fe.montant_paye,
        cf.nom as categorie_nom,
        CASE 
          WHEN fe.statut = 'paye' THEN true
          WHEN fe.montant_paye >= fe.montant THEN true
          ELSE false
        END as est_payee
      FROM frais_eleves fe
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE fe.eleve_id = ? 
        AND fe.annee_scolaire = ?
        AND (cf.type = 'inscription' OR cf.nom LIKE '%inscription%')
      ORDER BY fe.created_at DESC
      LIMIT 1
    `;
    
    const result = await query(sql, [parseInt(eleveId), anneeScolaire]) as any[];
    
    let inscriptionPayee = false;
    let details = null;
    
    if (result.length > 0) {
      const inscription = result[0];
      inscriptionPayee = inscription.est_payee === 1 || inscription.est_payee === true;
      details = {
        statut: inscription.statut,
        montant: inscription.montant,
        montant_paye: inscription.montant_paye,
        categorie: inscription.categorie_nom
      };
    }

    return NextResponse.json({
      success: true,
      inscription_payee: inscriptionPayee,
      details: details,
      message: inscriptionPayee ? 
        "L'inscription est payée" : 
        "L'inscription n'est pas payée"
    });
  } catch (error: any) {
    console.error('Erreur vérification inscription:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la vérification de l\'inscription',
        inscription_payee: false 
      },
      { status: 500 }
    );
  }
}