import { NextRequest, NextResponse } from 'next/server';
import { query, pool } from '@/app/lib/database';

// GET - Récupérer les remises
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const frais_scolaire_id = searchParams.get('frais_scolaire_id');
    const eleve_id = searchParams.get('eleve_id');
    const actives = searchParams.get('actives') === 'true';

    let sql = `
      SELECT 
        r.*,
        fs.montant as montant_frais_original,
        cf.nom as categorie_nom,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule as eleve_matricule
      FROM remises_frais r
      INNER JOIN frais_scolaires fs ON r.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      INNER JOIN eleves e ON r.eleve_id = e.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (frais_scolaire_id && frais_scolaire_id !== '') {
      sql += ' AND r.frais_scolaire_id = ?';
      params.push(parseInt(frais_scolaire_id));
    }

    if (eleve_id && eleve_id !== '') {
      sql += ' AND r.eleve_id = ?';
      params.push(parseInt(eleve_id));
    }

    // ✅ CORRECTION ICI : Utiliser la colonne 'statut' avec la valeur 'active'
    if (actives) {
      sql += ' AND r.statut = ?';
      params.push('active');  // La valeur 'active' comme paramètre
    }

    sql += ' ORDER BY r.date_remise DESC';

    console.log('📝 SQL Remise:', sql);
    console.log('📦 Paramètres:', params);

    const remises = await query(sql, params);
    
    console.log('✅ Remises trouvées:', remises);

    return NextResponse.json({
      success: true,
      remises: Array.isArray(remises) ? remises : []
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération remises:', error);
    return NextResponse.json(
      { success: false, erreur: error.message, remises: [] },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle remise
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Création remise:', body);

    // Validation
    if (!body.frais_scolaire_id || !body.eleve_id || !body.motif) {
      return NextResponse.json({
        success: false,
        erreur: 'Données incomplètes: frais, élève et motif requis'
      }, { status: 400 });
    }

    if (!body.montant_final && body.montant_final !== 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Montant final requis'
      }, { status: 400 });
    }

    // Récupérer le montant original du frais scolaire
    const fraisResult = await query(`
      SELECT montant FROM frais_scolaires WHERE id = ?
    `, [body.frais_scolaire_id]) as any[];

    if (fraisResult.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Frais scolaire non trouvé'
      }, { status: 404 });
    }

    const montantOriginal = parseFloat(fraisResult[0].montant);
    const montantFinal = parseFloat(body.montant_final);

    // Vérifier que le montant final n'est pas supérieur à l'original
    if (montantFinal > montantOriginal) {
      return NextResponse.json({
        success: false,
        erreur: 'Le montant final ne peut pas être supérieur au montant original'
      }, { status: 400 });
    }

    // Obtenir une connexion du pool pour la transaction
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query('START TRANSACTION');

      // ✅ Vérifier et supprimer toute remise active existante (au cas où)
      await connection.query(`
        UPDATE remises_frais 
        SET statut = 'inactive' 
        WHERE frais_scolaire_id = ? AND eleve_id = ? AND statut = 'active'
      `, [body.frais_scolaire_id, body.eleve_id]);

      // ✅ Maintenant, insérer la nouvelle remise
      const [insertRemiseResult] = await connection.query(`
        INSERT INTO remises_frais (
          frais_scolaire_id, eleve_id, montant_original, montant_remise,
          montant_final, type_remise, valeur_remise, motif, date_remise, created_by, statut
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
      `, [
        body.frais_scolaire_id,
        body.eleve_id,
        montantOriginal,
        montantOriginal - montantFinal,
        montantFinal,
        body.type_remise || 'montant_fixe',
        body.valeur_remise || null,
        body.motif,
        body.created_by || 1,
        'active'
      ]);

      const remiseId = (insertRemiseResult as any).insertId;

      // 2. Déterminer l'année scolaire
      const anneeScolaire = body.annee_scolaire || (() => {
        const maintenant = new Date();
        const annee = maintenant.getFullYear();
        const mois = maintenant.getMonth() + 1;
        return mois >= 8 ? `${annee}-${annee + 1}` : `${annee - 1}-${annee}`;
      })();

      // 3. Vérifier si un frais élève existe
      const [fraisEleveResult] = await connection.query(`
        SELECT id, montant FROM frais_eleves 
        WHERE frais_scolaire_id = ? AND eleve_id = ? AND annee_scolaire = ?
      `, [body.frais_scolaire_id, body.eleve_id, anneeScolaire]) as any[];

      if (fraisEleveResult && fraisEleveResult.length > 0) {
        // Mettre à jour le frais élève existant
        await connection.query(`
          UPDATE frais_eleves 
          SET montant_original = montant,
              montant = ?,
              a_remise = 1,
              remise_id = ?,
              motif_remise = ?
          WHERE id = ?
        `, [montantFinal, remiseId, body.motif, fraisEleveResult[0].id]);
      } else {
        // Créer le frais élève avec le montant réduit
        const dateEcheance = new Date();
        dateEcheance.setMonth(dateEcheance.getMonth() + 1);
        const dateEcheanceStr = dateEcheance.toISOString().split('T')[0];

        await connection.query(`
          INSERT INTO frais_eleves (
            frais_scolaire_id, eleve_id, annee_scolaire, montant, montant_original,
            montant_paye, date_echeance, statut, a_remise, remise_id, motif_remise
          ) VALUES (?, ?, ?, ?, ?, 0, ?, 'en_attente', 1, ?, ?)
        `, [
          body.frais_scolaire_id,
          body.eleve_id,
          anneeScolaire,
          montantFinal,
          montantOriginal,
          dateEcheanceStr,
          remiseId,
          body.motif
        ]);
      }

      await connection.query('COMMIT');

      // Récupérer la remise créée
      const remiseCree = await query(`
        SELECT 
          r.*,
          cf.nom as categorie_nom,
          e.nom as eleve_nom,
          e.prenom as eleve_prenom
        FROM remises_frais r
        INNER JOIN frais_scolaires fs ON r.frais_scolaire_id = fs.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        INNER JOIN eleves e ON r.eleve_id = e.id
        WHERE r.id = ?
      `, [remiseId]) as any[];

       return NextResponse.json({
        success: true,
        remise: remiseCree[0],
        message: 'Remise appliquée avec succès'
      });

    } catch (error) {
      if (connection) {
        await connection.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }

  } catch (error: any) {
    console.error('❌ Erreur création remise:', error);
    return NextResponse.json(
      { success: false, erreur: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Désactiver une remise
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({
        success: false,
        erreur: 'ID de remise requis'
      }, { status: 400 });
    }

    let connection;
    try {
      connection = await pool.getConnection();
      await connection.query('START TRANSACTION');

      // Récupérer la remise
      const [remiseResult] = await connection.query(`
        SELECT * FROM remises_frais WHERE id = ?
      `, [parseInt(id)]) as any[];

      if (!remiseResult || remiseResult.length === 0) {
        return NextResponse.json({
          success: false,
          erreur: 'Remise non trouvée'
        }, { status: 404 });
      }

      const remise = remiseResult[0];

      // 1. D'abord, restaurer le montant original dans frais_eleves
      await connection.query(`
        UPDATE frais_eleves 
        SET montant = montant_original,
            a_remise = 0,
            remise_id = NULL,
            motif_remise = NULL
        WHERE remise_id = ?
      `, [parseInt(id)]);

      // 2. Ensuite, mettre à jour le statut de la remise
      await connection.query(`
        UPDATE remises_frais SET statut = ? WHERE id = ?
      `, ['inactive', parseInt(id)]);

      // ✅ 3. Option 1: Attendre un peu pour s'assurer que la transaction est commitée
      // (MySQL gère ça automatiquement avec COMMIT)

      await connection.query('COMMIT');

      // ✅ 4. Option 2: Vérifier que la mise à jour a bien été effectuée
      const [verif] = await connection.query(`
        SELECT statut FROM remises_frais WHERE id = ?
      `, [parseInt(id)]) as any[];

      console.log('✅ Statut après mise à jour:', verif?.[0]?.statut);

      return NextResponse.json({
        success: true,
        message: 'Remise désactivée et montant restauré avec succès'
      });

    } catch (error) {
      if (connection) {
        await connection.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (connection) {
        connection.release();
      }
    }

  } catch (error: any) {
    console.error('❌ Erreur suppression remise:', error);
    return NextResponse.json(
      { success: false, erreur: error.message },
      { status: 500 }
    );
  }
}