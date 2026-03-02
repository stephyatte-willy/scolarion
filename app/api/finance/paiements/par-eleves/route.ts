import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eleve_ids, filtre_categorie } = body;
    
    if (!eleve_ids || !Array.isArray(eleve_ids) || eleve_ids.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Aucun élève sélectionné'
      }, { status: 400 });
    }

    console.log(`🔍 Récupération des paiements pour ${eleve_ids.length} élève(s)`);
    
    const placeholders = eleve_ids.map(() => '?').join(',');
    
    // ✅ Si un filtre catégorie est actif, on prend les DERNIERS paiements
    // Sinon, on prend TOUS les paiements
    let sql = '';
    let params: any[] = [];
    
    if (filtre_categorie) {
      // Avec filtre catégorie mensuelle : prendre le DERNIER paiement de ce frais pour chaque élève
      sql = `
        SELECT 
          p1.id,
          p1.eleve_id,
          p1.montant,
          p1.date_paiement,
          p1.created_at,
          TIME(p1.created_at) as heure_paiement,
          e.prenom as eleve_prenom,
          e.nom as eleve_nom,
          e.matricule as eleve_matricule,
          cf.nom as categorie_nom,
          p1.numero_versement
        FROM paiements_frais p1
        INNER JOIN frais_eleves fe ON p1.frais_eleve_id = fe.id
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN eleves e ON p1.eleve_id = e.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE p1.eleve_id IN (${placeholders})
          AND fs.categorie_frais_id = ?
          AND CONCAT(p1.date_paiement, ' ', TIME(p1.created_at)) = (
            SELECT CONCAT(p2.date_paiement, ' ', TIME(p2.created_at))
            FROM paiements_frais p2
            INNER JOIN frais_eleves fe2 ON p2.frais_eleve_id = fe2.id
            INNER JOIN frais_scolaires fs2 ON fe2.frais_scolaire_id = fs2.id
            WHERE p2.eleve_id = p1.eleve_id
              AND fs2.categorie_frais_id = ?
            ORDER BY p2.date_paiement DESC, p2.created_at DESC
            LIMIT 1
          )
      `;
      
      params = [...eleve_ids, filtre_categorie, filtre_categorie];
      
    } else {
      // Sans filtre : prendre TOUS les paiements des élèves sélectionnés
      sql = `
        SELECT 
          pf.id,
          pf.eleve_id,
          pf.montant,
          pf.date_paiement,
          pf.created_at,
          TIME(pf.created_at) as heure_paiement,
          e.prenom as eleve_prenom,
          e.nom as eleve_nom,
          e.matricule as eleve_matricule,
          cf.nom as categorie_nom,
          pf.numero_versement
        FROM paiements_frais pf
        INNER JOIN eleves e ON pf.eleve_id = e.id
        INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
        INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        WHERE pf.eleve_id IN (${placeholders})
        ORDER BY pf.date_paiement DESC, pf.created_at DESC
      `;
      
      params = eleve_ids;
    }
    
    const result = await query(sql, params) as any[];
    
    const paiement_ids = result.map(p => p.id);
    const details = result.map(p => ({
      id: p.id,
      eleve_id: p.eleve_id,
      eleve_prenom: p.eleve_prenom,
      eleve_nom: p.eleve_nom,
      eleve_matricule: p.eleve_matricule,
      date_paiement: p.date_paiement,
      heure_paiement: p.heure_paiement ? p.heure_paiement.substring(0, 5) : '',
      categorie_nom: p.categorie_nom,
      numero_versement: p.numero_versement,
      montant: p.montant
    }));
    
    console.log(`✅ ${paiement_ids.length} paiement(s) trouvé(s)`);
    
    return NextResponse.json({
      success: true,
      paiement_ids,
      details,
      count: paiement_ids.length
    });
    
  } catch (error: any) {
    console.error('❌ Erreur récupération paiements par élèves:', error);
    console.error('❌ Stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur: ${error.message}`,
        paiement_ids: [],
        details: []
      },
      { status: 500 }
    );
  }
}