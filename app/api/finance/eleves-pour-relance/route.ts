import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eleve_ids } = body;
    
    if (!eleve_ids || !Array.isArray(eleve_ids) || eleve_ids.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Liste d\'IDs d\'élèves requise'
      }, { status: 400 });
    }
    
    // Convertir les IDs en chaîne pour la requête SQL
    const idsStr = eleve_ids.join(',');
    
    // Requête principale pour les informations des élèves
    const elevesSql = `
      SELECT 
        e.id,
        e.nom,
        e.prenom,
        e.matricule,
        e.classe_id,
        e.telephone_parent,
        e.email_parents,
        c.nom as classe_nom,
        c.niveau as classe_niveau
      FROM eleves e
      INNER JOIN classes c ON e.classe_id = c.id
      WHERE e.id IN (${idsStr})
        AND e.statut = 'actif'
    `;
    
    const elevesResult = await query(elevesSql) as any[];
    
    if (elevesResult.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Aucun élève actif trouvé'
      }, { status: 404 });
    }
    
    // Récupérer les frais restants pour chaque élève
    const elevesAvecFrais = await Promise.all(
      elevesResult.map(async (eleve) => {
        // Requête pour les frais restants de chaque élève
        const fraisSql = `
          SELECT 
            cf.nom as categorie_nom,
            GREATEST(fe.montant - fe.montant_paye, 0) as montant_restant,
            fs.periodicite
          FROM frais_eleves fe
          INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
          INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
          WHERE fe.eleve_id = ?
            AND fe.statut IN ('en_attente', 'partiel', 'en_retard')
            AND GREATEST(fe.montant - fe.montant_paye, 0) > 0
          ORDER BY cf.nom
        `;
        
        const fraisResult = await query(fraisSql, [eleve.id]) as any[];
        
        // Requête pour le total restant
        const totalSql = `
          SELECT COALESCE(
            SUM(GREATEST(fe.montant - fe.montant_paye, 0)),
            0
          ) as total_reste_a_payer
          FROM frais_eleves fe
          WHERE fe.eleve_id = ?
            AND fe.statut IN ('en_attente', 'partiel', 'en_retard')
        `;
        
        const totalResult = await query(totalSql, [eleve.id]) as any[];
        const total_reste_a_payer = parseFloat(totalResult[0]?.total_reste_a_payer) || 0;
        
        return {
          id: eleve.id,
          nom: eleve.nom,
          prenom: eleve.prenom,
          matricule: eleve.matricule,
          classe_id: eleve.classe_id,
          classe_nom: eleve.classe_nom,
          classe_niveau: eleve.classe_niveau,
          telephone_parent: eleve.telephone_parent || '',
          email_parents: eleve.email_parents || '',
          total_reste_a_payer: total_reste_a_payer,
          details_frais: fraisResult.map(frais => ({
            categorie_nom: frais.categorie_nom,
            montant_restant: parseFloat(frais.montant_restant) || 0,
            periodicite: frais.periodicite
          }))
        };
      })
    );
    
    // Filtrer les élèves qui ont des frais restants
    const elevesAvecRelance = elevesAvecFrais.filter(eleve => 
      eleve.total_reste_a_payer > 0 && eleve.details_frais.length > 0
    );
    
    if (elevesAvecRelance.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Aucun élève sélectionné n\'a de frais restants à payer'
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      eleves: elevesAvecRelance
    });
    
  } catch (error: any) {
    console.error('❌ Erreur API élèves pour relance:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}