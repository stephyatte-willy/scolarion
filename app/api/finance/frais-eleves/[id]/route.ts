// /api/finance/frais-eleves/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fraisEleveId = parseInt(params.id);
    
    if (!fraisEleveId) {
      return NextResponse.json({
        success: false,
        erreur: 'ID du frais élève requis'
      }, { status: 400 });
    }
    
    const sql = `
      SELECT 
        fe.*,
        cf.nom as categorie_nom,
        cf.type as categorie_type,
        fs.montant as montant_total_scolaire
      FROM frais_eleves fe
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE fe.id = ?
    `;
    
    const result = await query(sql, [fraisEleveId]) as any[];
    
    if (result.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Frais élève non trouvé'
      }, { status: 404 });
    }
    
    const frais = result[0];
    
    return NextResponse.json({
      success: true,
      frais: {
        id: frais.id,
        montant: frais.montant,
        montant_paye: frais.montant_paye,
        reste_a_payer: Math.max(0, frais.montant - frais.montant_paye),
        categorie_nom: frais.categorie_nom,
        categorie_type: frais.categorie_type,
        statut: frais.statut
      }
    });
    
  } catch (error: any) {
    console.error('Erreur récupération frais élève:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la récupération des détails'
      },
      { status: 500 }
    );
  }
}