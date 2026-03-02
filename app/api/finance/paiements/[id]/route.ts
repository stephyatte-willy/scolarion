import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// ✅ CORRECTION POUR NEXT.JS 15+ : Les params sont asynchrones !
interface RouteParams {
  params: Promise<{ id: string }> | { id: string };
}

// Fonction utilitaire pour extraire l'ID (version asynchrone)
async function extractPaiementId(params: RouteParams['params']): Promise<number> {
  console.log('🔍 extractPaiementId - params reçus:', params);
  
  // ✅ Résoudre la Promise si nécessaire (Next.js 15+)
  const resolvedParams = await params;
  console.log('🔍 params résolus:', resolvedParams);
  
  if (!resolvedParams) {
    throw new Error('Paramètres manquants');
  }
  
  const id = resolvedParams.id;
  console.log('🔢 ID brut reçu:', id);
  
  if (!id) {
    throw new Error('ID de paiement manquant');
  }
  
  const numericId = parseInt(id, 10);
  
  if (isNaN(numericId) || numericId <= 0) {
    throw new Error(`ID de paiement invalide: ${id}`);
  }
  
  return numericId;
}

// ✅ GET - Version asynchrone pour Next.js 15+
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔍 GET /api/finance/paiements/[id] appelé');
    console.log('📋 Params (Promise):', params);
    
    // ✅ Attendre la résolution des params
    const paiementId = await extractPaiementId(params);
    console.log('🔢 ID extrait avec succès:', paiementId);
    
    const sql = `
      SELECT 
        pf.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule as eleve_matricule,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        cf.nom as categorie_nom,
        cf.type as categorie_type,
        fe.montant as montant_total,
        fe.montant_paye,
        fe.statut as statut_frais,
        fe.annee_scolaire,
        fe.id as frais_eleve_id,
        CAST(pf.montant AS UNSIGNED) as montant_sans_decimales,
        CAST(fe.montant AS UNSIGNED) as montant_total_sans_decimales,
        CAST(fe.montant_paye AS UNSIGNED) as montant_paye_sans_decimales,
        CAST(GREATEST(fe.montant - fe.montant_paye, 0) AS UNSIGNED) as reste_a_payer_sans_decimales
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
    
    const paiement = {
      ...result[0],
      montant: result[0].montant_sans_decimales || Math.floor(parseFloat(result[0].montant || 0)),
      montant_total: result[0].montant_total_sans_decimales || Math.floor(parseFloat(result[0].montant_total || 0)),
      montant_paye: result[0].montant_paye_sans_decimales || Math.floor(parseFloat(result[0].montant_paye || 0)),
      reste_a_payer: result[0].reste_a_payer_sans_decimales || Math.floor(parseFloat(result[0].reste_a_payer || 0))
    };
    
    return NextResponse.json({
      success: true,
      paiement: paiement
    });
    
  } catch (error: any) {
    console.error('❌ Erreur GET paiement:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: error.message || 'Erreur lors de la récupération des détails'
      },
      { status: 400 }
    );
  }
}

// ✅ PATCH - Version asynchrone pour Next.js 15+
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🔧 PATCH /api/finance/paiements/[id] appelé');
    
    // ✅ Attendre la résolution des params
    const paiementId = await extractPaiementId(params);
    console.log('🔢 ID à modifier:', paiementId);
    
    // Lire le corps de la requête
    let body;
    try {
      body = await request.json();
      console.log('📦 Corps de la requête:', body);
    } catch (error) {
      return NextResponse.json(
        { success: false, erreur: 'Format JSON invalide' },
        { status: 400 }
      );
    }
    
    // ✅ Forcer les montants en entiers
    if (body.montant !== undefined) {
      body.montant = Math.floor(parseFloat(body.montant));
    }
    
    // Validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, erreur: 'Données invalides' },
        { status: 400 }
      );
    }
    
    if (body.montant !== undefined && (isNaN(body.montant) || body.montant <= 0)) {
      return NextResponse.json(
        { success: false, erreur: 'Le montant doit être un nombre entier supérieur à 0' },
        { status: 400 }
      );
    }
    
    // 1. Récupérer le paiement actuel
    const getPaiementSql = `SELECT * FROM paiements_frais WHERE id = ?`;
    const paiementResult = await query(getPaiementSql, [paiementId]) as any[];
    
    if (paiementResult.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Paiement non trouvé' },
        { status: 404 }
      );
    }
    
    const paiementActuel = paiementResult[0];
    
    // 2. Récupérer le frais élève associé
    const fraisEleveSql = `SELECT * FROM frais_eleves WHERE id = ?`;
    const fraisEleveResult = await query(fraisEleveSql, [paiementActuel.frais_eleve_id]) as any[];
    
    if (fraisEleveResult.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Frais élève associé non trouvé' },
        { status: 404 }
      );
    }
    
    const fraisEleve = fraisEleveResult[0];
    
    // 3. Si le montant change, calculer les nouvelles valeurs
    let differenceMontant = 0;
    
    if (body.montant !== undefined) {
      const ancienMontant = Math.floor(parseFloat(paiementActuel.montant));
      const nouveauMontant = body.montant;
      differenceMontant = nouveauMontant - ancienMontant;
      
      if (differenceMontant !== 0) {
        const montantTotalFrais = Math.floor(parseFloat(fraisEleve.montant));
        const montantDejaPaye = Math.floor(parseFloat(fraisEleve.montant_paye || 0));
        const nouveauMontantTotalPaye = montantDejaPaye + differenceMontant;
        
        if (nouveauMontantTotalPaye < 0) {
          return NextResponse.json({
            success: false,
            erreur: 'Le montant total payé ne peut pas être négatif'
          }, { status: 400 });
        }
        
        if (nouveauMontantTotalPaye > montantTotalFrais) {
          return NextResponse.json({
            success: false,
            erreur: `Le montant total payé (${nouveauMontantTotalPaye} FCFA) ne peut pas dépasser le montant du frais (${montantTotalFrais} FCFA)`
          }, { status: 400 });
        }
        
        let nouveauStatutFrais = fraisEleve.statut;
        
        if (nouveauMontantTotalPaye >= montantTotalFrais) {
          nouveauStatutFrais = 'paye';
        } else if (nouveauMontantTotalPaye > 0) {
          nouveauStatutFrais = 'partiel';
        } else {
          nouveauStatutFrais = 'en_attente';
        }
        
        const dateEcheance = new Date(fraisEleve.date_echeance);
        if (nouveauStatutFrais !== 'paye' && dateEcheance < new Date()) {
          nouveauStatutFrais = 'en_retard';
        }
        
        const updateFraisEleveSql = `
          UPDATE frais_eleves 
          SET montant_paye = ?,
              statut = ?,
              updated_at = NOW()
          WHERE id = ?
        `;
        
        await query(updateFraisEleveSql, [
          nouveauMontantTotalPaye,
          nouveauStatutFrais,
          paiementActuel.frais_eleve_id
        ]);
      }
    }
    
    // 4. Préparer la mise à jour du paiement
    const updates: string[] = [];
    const values: any[] = [];
    
    const champsModifiables = [
      'montant', 'date_paiement', 'mode_paiement', 
      'reference_paiement', 'notes', 'statut'
    ];
    
    champsModifiables.forEach(champ => {
      if (body[champ] !== undefined && body[champ] !== null) {
        updates.push(`${champ} = ?`);
        let valeur = body[champ];
        if (champ === 'montant') {
          valeur = Math.floor(parseFloat(valeur));
        }
        values.push(valeur);
      }
    });
    
    if (updates.length === 0 && differenceMontant === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Aucune modification fournie' },
        { status: 400 }
      );
    }
    
    updates.push('updated_at = NOW()');
    values.push(paiementId);
    
    if (updates.length > 0) {
      const updatePaiementSql = `
        UPDATE paiements_frais 
        SET ${updates.join(', ')}
        WHERE id = ?
      `;
      
      await query(updatePaiementSql, values);
    }
    
    // 5. Récupérer le paiement mis à jour
    const updatedPaiement = await query(`
      SELECT 
        pf.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule as eleve_matricule,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        cf.nom as categorie_nom,
        cf.type as categorie_type,
        fe.montant as montant_total,
        fe.montant_paye,
        fe.statut as statut_frais,
        fe.annee_scolaire,
        CAST(pf.montant AS UNSIGNED) as montant_sans_decimales,
        CAST(fe.montant AS UNSIGNED) as montant_total_sans_decimales,
        CAST(fe.montant_paye AS UNSIGNED) as montant_paye_sans_decimales,
        CAST(GREATEST(fe.montant - fe.montant_paye, 0) AS UNSIGNED) as reste_a_payer_sans_decimales
      FROM paiements_frais pf
      INNER JOIN frais_eleves fe ON pf.frais_eleve_id = fe.id
      INNER JOIN eleves e ON pf.eleve_id = e.id
      INNER JOIN classes c ON e.classe_id = c.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE pf.id = ?
    `, [paiementId]) as any[];
    
    const paiementFinal = {
      ...updatedPaiement[0],
      montant: updatedPaiement[0]?.montant_sans_decimales || Math.floor(parseFloat(updatedPaiement[0]?.montant || 0)),
      montant_total: updatedPaiement[0]?.montant_total_sans_decimales || Math.floor(parseFloat(updatedPaiement[0]?.montant_total || 0)),
      montant_paye: updatedPaiement[0]?.montant_paye_sans_decimales || Math.floor(parseFloat(updatedPaiement[0]?.montant_paye || 0)),
      reste_a_payer: updatedPaiement[0]?.reste_a_payer_sans_decimales || Math.floor(parseFloat(updatedPaiement[0]?.reste_a_payer || 0))
    };
    
    return NextResponse.json({
      success: true,
      paiement: paiementFinal,
      message: 'Paiement modifié avec succès'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur PATCH paiement:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: error.message || 'Erreur lors de la modification du paiement'
      },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Version asynchrone pour Next.js 15+
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🗑️ DELETE /api/finance/paiements/[id] appelé');
    
    const paiementId = await extractPaiementId(params);
    console.log('🔢 ID à supprimer:', paiementId);
    
    // 1. Récupérer le paiement
    const getPaiementSql = `SELECT * FROM paiements_frais WHERE id = ?`;
    const paiementResult = await query(getPaiementSql, [paiementId]) as any[];
    
    if (paiementResult.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Paiement non trouvé' },
        { status: 404 }
      );
    }
    
    const paiement = paiementResult[0];
    
    // 2. Archiver dans paiement_frais_supp
    const archiveSql = `
      INSERT INTO paiement_frais_supp (
        id, frais_eleve_id, eleve_id, montant, date_paiement,
        mode_paiement, reference_paiement, statut, notes, created_by,
        created_at, updated_at, deleted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    await query(archiveSql, [
      paiement.id,
      paiement.frais_eleve_id,
      paiement.eleve_id,
      Math.floor(parseFloat(paiement.montant)),
      paiement.date_paiement,
      paiement.mode_paiement,
      paiement.reference_paiement,
      paiement.statut,
      paiement.notes,
      paiement.created_by,
      paiement.created_at,
      paiement.updated_at || paiement.created_at
    ]);
    
    // 3. Récupérer et mettre à jour le frais élève
    const fraisEleveSql = `SELECT * FROM frais_eleves WHERE id = ?`;
    const fraisEleveResult = await query(fraisEleveSql, [paiement.frais_eleve_id]) as any[];
    
    if (fraisEleveResult.length > 0) {
      const fraisEleve = fraisEleveResult[0];
      
      const montantPaiement = Math.floor(parseFloat(paiement.montant));
      const nouveauMontantPaye = Math.floor(parseFloat(fraisEleve.montant_paye || 0)) - montantPaiement;
      const montantTotalFrais = Math.floor(parseFloat(fraisEleve.montant));
      
      let nouveauStatut = 'en_attente';
      
      if (nouveauMontantPaye <= 0) {
        nouveauStatut = 'en_attente';
      } else if (nouveauMontantPaye < montantTotalFrais) {
        nouveauStatut = 'partiel';
      } else if (nouveauMontantPaye >= montantTotalFrais) {
        nouveauStatut = 'paye';
      }
      
      const updateFraisEleveSql = `
        UPDATE frais_eleves 
        SET montant_paye = ?,
            statut = ?,
            updated_at = NOW()
        WHERE id = ?
      `;
      
      await query(updateFraisEleveSql, [
        Math.max(0, nouveauMontantPaye),
        nouveauStatut,
        paiement.frais_eleve_id
      ]);
    }
    
    // 4. Supprimer le paiement original
    const deleteSql = `DELETE FROM paiements_frais WHERE id = ?`;
    await query(deleteSql, [paiementId]);
    
    return NextResponse.json({
      success: true,
      message: 'Paiement supprimé et archivé avec succès'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur DELETE paiement:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la suppression du paiement' },
      { status: 500 }
    );
  }
}

// ✅ POST - Version asynchrone pour Next.js 15+
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const paiementId = await extractPaiementId(params);
    
    const checkSql = `SELECT date_premiere_impression FROM paiements_frais WHERE id = ?`;
    const result = await query(checkSql, [paiementId]) as any[];
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Paiement non trouvé' },
        { status: 404 }
      );
    }
    
    const paiement = result[0];
    let updateSql: string;
    
    if (!paiement.date_premiere_impression) {
      updateSql = `UPDATE paiements_frais SET date_premiere_impression = NOW(), updated_at = NOW() WHERE id = ?`;
    } else {
      updateSql = `UPDATE paiements_frais SET date_impression_recu = NOW(), est_duplicata = 1, updated_at = NOW() WHERE id = ?`;
    }
    
    await query(updateSql, [paiementId]);
    
    const updatedPaiement = await query(`SELECT * FROM paiements_frais WHERE id = ?`, [paiementId]) as any[];
    
    return NextResponse.json({
      success: true,
      paiement: updatedPaiement[0],
      is_duplicate: !!paiement.date_premiere_impression
    });
    
  } catch (error: any) {
    console.error('Erreur marquage impression:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors du marquage de l\'impression' },
      { status: 500 }
    );
  }
}

// OPTIONS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}