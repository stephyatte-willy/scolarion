import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Vérification Inscription - Début');
    
    const { searchParams } = new URL(request.url);
    const eleveId = searchParams.get('eleve_id');
    const anneeScolaire = searchParams.get('annee_scolaire') || '2025-2026';

    console.log('📦 Paramètres vérification:', { eleveId, anneeScolaire });

    if (!eleveId) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'ID élève requis',
          inscriptionExistante: false 
        },
        { status: 400 }
      );
    }

    // Vérifier si l'élève a déjà payé les frais d'inscription pour cette année
    const sql = `
      SELECT 
        pf.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        cf.nom as categorie_nom,
        cf.id as categorie_id
      FROM paiements_frais pf
      INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      INNER JOIN eleves e ON pf.eleve_id = e.id
      WHERE pf.eleve_id = ? 
        AND fs.annee_scolaire = ?
        AND cf.id = 2  -- ID 2 = Frais d'inscription
        AND pf.statut = 'paye'
    `;

    const resultats = await query(sql, [parseInt(eleveId), anneeScolaire]) as any[];

    console.log('📊 Résultats vérification:', {
      nbResultats: resultats.length,
      inscriptionExistante: resultats.length > 0
    });

    if (resultats.length > 0) {
      const eleve = resultats[0];
      return NextResponse.json({
        success: true,
        inscriptionExistante: true,
        nomEleve: `${eleve.eleve_prenom} ${eleve.eleve_nom}`,
        details: {
          date_paiement: eleve.date_paiement,
          montant: eleve.montant,
          mode_paiement: eleve.mode_paiement
        }
      });
    }

    return NextResponse.json({
      success: true,
      inscriptionExistante: false
    });

  } catch (error: any) {
    console.error('❌ Erreur vérification inscription:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}`,
        inscriptionExistante: false 
      },
      { status: 500 }
    );
  }
}