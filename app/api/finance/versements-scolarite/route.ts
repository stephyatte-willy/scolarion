// /api/finance/versements-scolarite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fraisEleveId = searchParams.get('frais_eleve_id');
    
    if (!fraisEleveId) {
      return NextResponse.json({
        success: false,
        erreur: 'frais_eleve_id est requis'
      }, { status: 400 });
    }
    
    const sql = `
      SELECT 
        vs.*,
        fe.montant as montant_total_scolarite,
        fe.montant_paye as montant_total_paye,
        (fe.montant - fe.montant_paye) as montant_total_restant,
        fs.nombre_versements,
        cf.nom as categorie_nom
      FROM versement_scolarite vs
      INNER JOIN frais_eleves fe ON vs.frais_eleve_id = fe.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE vs.frais_eleve_id = ?
      ORDER BY vs.numero_versement
    `;
    
    const result = await query(sql, [parseInt(fraisEleveId)]) as any[];
    
    // Calculer les statistiques
    const stats = {
      total_versements: result.length,
      versements_payes: result.filter(v => v.statut === 'paye').length,
      versements_partiels: result.filter(v => v.statut === 'partiel').length,
      versements_en_attente: result.filter(v => v.statut === 'en_attente').length,
      versements_en_retard: result.filter(v => v.statut === 'en_retard').length,
      montant_total_paye: result.reduce((sum, v) => sum + (v.montant_paye || 0), 0),
      montant_total_a_payer: result.reduce((sum, v) => sum + v.montant_versement, 0),
      prochain_versement: 0
    };
    
    // Trouver le prochain versement à payer
    const versementsNonPayes = result.filter(v => 
      v.statut !== 'paye' && v.montant_paye < v.montant_versement
    );
    stats.prochain_versement = versementsNonPayes.length > 0 
      ? Math.min(...versementsNonPayes.map(v => v.numero_versement))
      : result.length + 1;
    
    return NextResponse.json({
      success: true,
      versements: result,
      stats: stats
    });
  } catch (error: any) {
    console.error('Erreur récupération versements:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la récupération des versements',
        versements: [],
        stats: null
      },
      { status: 500 }
    );
  }
}