import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eleveId = searchParams.get('eleve_id');
    const fraisScolaireId = searchParams.get('frais_scolaire_id');
    const anneeScolaire = searchParams.get('annee_scolaire');

    if (!eleveId || !fraisScolaireId) {
      return NextResponse.json({
        success: false,
        erreur: 'Paramètres manquants'
      }, { status: 400 });
    }

    // Récupérer le frais élève existant
    const sql = `
      SELECT 
        fe.*,
        cf.periodicite as categorie_periodicite
      FROM frais_eleves fe
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE fe.eleve_id = ? 
        AND fe.frais_scolaire_id = ?
        AND fe.annee_scolaire = ?
    `;
    
    const params = [parseInt(eleveId), parseInt(fraisScolaireId), anneeScolaire];
    const result = await query(sql, params) as any[];
    
    if (result.length > 0) {
      return NextResponse.json({
        success: true,
        existe: true,
        fraisEleve: result[0]
      });
    } else {
      return NextResponse.json({
        success: true,
        existe: false
      });
    }
  } catch (error: any) {
    console.error('Erreur vérification frais élève:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la vérification' },
      { status: 500 }
    );
  }
}