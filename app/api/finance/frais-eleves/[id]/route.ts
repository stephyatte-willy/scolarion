// /api/finance/frais-eleves/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Définir le type du contexte (optionnel mais recommandé)
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Récupérer l'ID de manière asynchrone depuis les paramètres
    const { id } = await context.params;
    
    // Convertir en nombre
    const fraisEleveId = parseInt(id);
    
    // Valider l'ID
    if (isNaN(fraisEleveId) || fraisEleveId <= 0) {
      return NextResponse.json({
        success: false,
        erreur: 'ID du frais élève invalide ou manquant'
      }, { status: 400 });
    }
    
    console.log('🔍 Récupération frais élève ID:', fraisEleveId);
    
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
    console.error('❌ Erreur récupération frais élève:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la récupération des détails'
      },
      { status: 500 }
    );
  }
}
