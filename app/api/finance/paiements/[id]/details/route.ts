import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paiementId = parseInt(params.id);
    
    const sql = `
      SELECT 
        pf.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        cf.nom as categorie_nom,
        cf.type as categorie_type,
        fe.montant as montant_total,
        fe.montant_paye,
        fe.statut as statut_frais,
        fe.annee_scolaire
      FROM paiements_frais pf
      INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
      INNER JOIN eleves e ON pf.eleve_id = e.id
      INNER JOIN classes c ON e.classe_id = c.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE pf.id = ?
    `;
    
    const result = await query(sql, [paiementId]) as any[];
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Paiement non trouvé' },
        { status: 404 }
      );
    }
    
    const paiement = result[0];
    
    // Récupérer les versements si c'est une scolarité
    if (paiement.categorie_type === 'scolarite') {
      const versementsSql = `
        SELECT * FROM versement_scolarite 
        WHERE frais_eleve_id = ?
        ORDER BY numero_versement
      `;
      
      const versements = await query(versementsSql, [paiement.frais_eleve_id]) as any[];
      paiement.versements = versements;
      
      // Calculer le prochain versement
      const prochainVersement = versements.find((v: any) => 
        v.statut === 'en_attente' || v.statut === 'partiel'
      );
      
      paiement.prochain_versement = prochainVersement;
    }
    
    return NextResponse.json({
      success: true,
      paiement: paiement
    });
    
  } catch (error: any) {
    console.error('Erreur récupération détails paiement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la récupération des détails' },
      { status: 500 }
    );
  }
}