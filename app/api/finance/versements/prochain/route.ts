import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eleveId = searchParams.get('eleve_id');
    const fraisScolaireId = searchParams.get('frais_scolaire_id');

    if (!eleveId) {
      return NextResponse.json({ success: false, erreur: 'ID élève requis' });
    }

    let sql = `
      SELECT 
        vs.*,
        fs.categorie_frais_id,
        cf.nom as categorie_nom
      FROM versements_scolarite vs
      INNER JOIN frais_scolaires fs ON vs.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE vs.eleve_id = ?
        AND (vs.statut = 'en_attente' OR vs.statut = 'partiel' OR vs.statut = 'en_retard')
        AND vs.montant_paye < vs.montant_versement
    `;

    const params: any[] = [parseInt(eleveId)];

    if (fraisScolaireId) {
      sql += ' AND vs.frais_scolaire_id = ?';
      params.push(parseInt(fraisScolaireId));
    }

    sql += ' ORDER BY vs.numero_versement ASC LIMIT 1';

    const versements = await query(sql, params) as any[];

    if (versements.length === 0) {
      return NextResponse.json({ success: true, versement: null });
    }

    return NextResponse.json({ success: true, versement: versements[0] });
  } catch (error: any) {
    console.error('Erreur récupération prochain versement:', error);
    return NextResponse.json({ success: false, erreur: error.message });
  }
}