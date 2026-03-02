import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eleveId = searchParams.get('eleve_id');
    const fraisScolaireId = searchParams.get('frais_scolaire_id');

    let sql = `
      SELECT 
        v.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        cf.nom as categorie_nom
      FROM versements_scolarite v
      INNER JOIN eleves e ON v.eleve_id = e.id
      INNER JOIN frais_scolaires fs ON v.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (eleveId) {
      sql += ' AND v.eleve_id = ?';
      params.push(parseInt(eleveId));
    }

    if (fraisScolaireId) {
      sql += ' AND v.frais_scolaire_id = ?';
      params.push(parseInt(fraisScolaireId));
    }

    sql += ' ORDER BY v.numero_versement ASC';

    const versements = await query(sql, params);

    return NextResponse.json({
      success: true,
      versements: versements || []
    });
  } catch (error: any) {
    console.error('Erreur récupération versements:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la récupération des versements' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      frais_eleve_id,
      frais_scolaire_id,
      montant_total,
      nombre_versements,
      date_debut_versements
    } = body;

    // Récupérer l'élève à partir du frais élève
    const sqlEleve = `
      SELECT eleve_id FROM frais_eleves WHERE id = ?
    `;
    
    const eleveResult = await query(sqlEleve, [frais_eleve_id]) as any[];
    
    if (eleveResult.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Frais élève non trouvé'
      });
    }

    const eleveId = eleveResult[0].eleve_id;
    const montantParVersement = parseFloat(montant_total) / (nombre_versements || 4);
    const dateDebut = date_debut_versements ? new Date(date_debut_versements) : new Date();

    for (let i = 1; i <= (nombre_versements || 4); i++) {
      const dateEcheance = new Date(dateDebut);
      dateEcheance.setMonth(dateEcheance.getMonth() + (i - 1));
      
      await query(
        `INSERT INTO versements_scolarite (
          eleve_id, frais_scolaire_id, numero_versement, 
          montant_versement, date_echeance, statut
        ) VALUES (?, ?, ?, ?, ?, 'en_attente')`,
        [eleveId, frais_scolaire_id, i, montantParVersement, dateEcheance.toISOString().split('T')[0]]
      );
    }

    return NextResponse.json({
      success: true,
      message: `${nombre_versements || 4} versements créés avec succès`
    });
  } catch (error: any) {
    console.error('Erreur création versements:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la création des versements' },
      { status: 500 }
    );
  }
}