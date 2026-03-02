import { NextRequest, NextResponse } from 'next/server';
import { query, transactionQuery, runTransaction } from '@/app/lib/database';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔍 API Suppression multiple frais scolaires - Début DELETE');
    
    // Lire le corps de la requête
    const body = await request.json();
    const { ids } = body;
    
    console.log('📦 IDs reçus:', ids);

    // Validation
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Aucun ID valide fourni pour la suppression' 
        },
        { status: 400 }
      );
    }

    // Vérifier que tous les IDs sont des nombres
    const idsValides = ids.filter(id => !isNaN(parseInt(id))).map(id => parseInt(id));
    
    if (idsValides.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'IDs invalides fournis' 
        },
        { status: 400 }
      );
    }

    console.log(`🗑️ Suppression de ${idsValides.length} frais scolaires:`, idsValides);

    // ✅ SOLUTION: Utiliser runTransaction du fichier database.ts
    const resultat = await runTransaction(async (connection) => {
      
      // Étape 1: Récupérer les IDs des frais_eleves associés à ces frais scolaires
      const placeholders = idsValides.map(() => '?').join(',');
      
      // ✅ IMPORTANT: Utiliser execute() pour les SELECT (c'est supporté)
      const [fraisElevesResult] = await connection.execute(`
        SELECT id FROM frais_eleves 
        WHERE frais_scolaire_id IN (${placeholders})
      `, idsValides);
      
      const fraisElevesIds = (fraisElevesResult as any[]).map(fe => fe.id);
      
      console.log(`📊 Frais élèves associés trouvés: ${fraisElevesIds.length}`);

      let paiementsSupprimes = 0;
      let versementsSupprimes = 0;
      let fraisElevesSupprimes = 0;

      // Étape 2: Supprimer les paiements associés (si la table existe)
      if (fraisElevesIds.length > 0) {
        const placeholdersFE = fraisElevesIds.map(() => '?').join(',');
        
        // ✅ Pour DELETE, on utilise execute() avec des paramètres
        const [paiementsResult] = await connection.execute(`
          DELETE FROM paiements_frais 
          WHERE frais_eleve_id IN (${placeholdersFE})
        `, fraisElevesIds);
        
        paiementsSupprimes = (paiementsResult as any).affectedRows || 0;
        console.log(`✅ ${paiementsSupprimes} paiement(s) associé(s) supprimé(s)`);

        // Étape 3: Supprimer les versements de scolarité associés
        const [versementsResult] = await connection.execute(`
          DELETE FROM versement_scolarite 
          WHERE frais_eleve_id IN (${placeholdersFE})
        `, fraisElevesIds);
        
        versementsSupprimes = (versementsResult as any).affectedRows || 0;
        console.log(`✅ ${versementsSupprimes} versement(s) associé(s) supprimé(s)`);

        // Étape 4: Supprimer les frais_eleves
        const [fraisElevesResult2] = await connection.execute(`
          DELETE FROM frais_eleves 
          WHERE id IN (${placeholdersFE})
        `, fraisElevesIds);
        
        fraisElevesSupprimes = (fraisElevesResult2 as any).affectedRows || 0;
        console.log(`✅ ${fraisElevesSupprimes} frais élève(s) supprimé(s)`);
      }

      // Étape 5: Enfin, supprimer les frais scolaires
      const [fraisResult] = await connection.execute(`
        DELETE FROM frais_scolaires 
        WHERE id IN (${placeholders})
      `, idsValides);
      
      const fraisSupprimes = (fraisResult as any).affectedRows || 0;
      console.log(`✅ ${fraisSupprimes} frai(s) scolaire(s) supprimé(s)`);

      return {
        fraisSupprimes,
        fraisElevesSupprimes,
        paiementsSupprimes,
        versementsSupprimes
      };
    });

    console.log('✅✅✅ Suppression multiple terminée avec succès', resultat);

    return NextResponse.json({
      success: true,
      message: `${idsValides.length} frai(s) scolaire(s) et toutes les données associées ont été supprimés avec succès`,
      supprimes: idsValides.length,
      details: resultat
    });
    
  } catch (error: any) {
    console.error('❌ Erreur suppression multiple frais scolaires:', error);
    console.error('❌ Stack:', error.stack);
    
    if (error.sqlMessage) {
      console.error('❌ SQL Message:', error.sqlMessage);
      console.error('❌ SQL Code:', error.code);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur lors de la suppression multiple: ${error.message}` 
      },
      { status: 500 }
    );
  }
}