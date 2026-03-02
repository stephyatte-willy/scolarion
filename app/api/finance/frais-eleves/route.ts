// /api/finance/frais-eleves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Frais élèves - Début GET');
    
    const searchParams = request.nextUrl.searchParams;
    const eleveId = searchParams.get('eleve_id');
    const anneeScolaire = searchParams.get('annee_scolaire');

    if (!eleveId) {
      return NextResponse.json(
        { success: false, erreur: 'L\'ID de l\'élève est requis' },
        { status: 400 }
      );
    }

    let sql = `
      SELECT 
        fe.*,
        cf.nom as categorie_nom,
        cf.type as categorie_type,
        cf.periodicite as categorie_periodicite
      FROM frais_eleves fe
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE fe.eleve_id = ?
    `;
    
    const params: any[] = [parseInt(eleveId)];

    if (anneeScolaire) {
      sql += ' AND fe.annee_scolaire = ?';
      params.push(anneeScolaire);
    }

    sql += ' ORDER BY fe.created_at DESC';

    const result = await query(sql, params);
    
    // CORRECTION TypeScript : garantir que c'est un tableau
    const frais = Array.isArray(result) ? result : [];
    console.log(`✅ ${frais.length} frais élèves trouvés pour l'élève ${eleveId}`);
    
    return NextResponse.json({
      success: true,
      frais: frais
    });
  } catch (error: any) {
    console.error('❌ Erreur récupération frais élèves:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la récupération des frais élèves',
        frais: []
      },
      { status: 500 }
    );
  }
}