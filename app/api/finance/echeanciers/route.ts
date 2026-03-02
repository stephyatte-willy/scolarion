import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Echeanciers - Début GET');
    
    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get('classe_id');
    const fraisScolaireId = searchParams.get('frais_scolaire_id');
    const global = searchParams.get('global');

    console.log('📦 Paramètres échéanciers:', { classeId, fraisScolaireId, global });

    // Si paramètre global, retourner tous les échéanciers
    if (global) {
      const sql = `
        SELECT 
          ec.*,
          c.nom as classe_nom,
          c.niveau as classe_niveau,
          fs.montant as frais_montant,
          cf.nom as categorie_nom
        FROM echeanciers_classe ec
        INNER JOIN classes c ON ec.classe_id = c.id
        INNER JOIN frais_scolaires fs ON ec.frais_scolaire_id = fs.id
        INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
        ORDER BY c.niveau, c.nom, ec.nom_echeancier
      `;

      const echeanciers = await query(sql) as any[];
      
      return NextResponse.json({
        success: true,
        echeanciers: echeanciers || []
      });
    }

    // Vérification que les paramètres ne sont pas null pour une requête spécifique
    if (!classeId || !fraisScolaireId) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Classe ID et Frais Scolaire ID requis',
          echeanciers: [] 
        },
        { status: 400 }
      );
    }

    // Conversion sécurisée en nombres
    const classeIdNum = parseInt(classeId);
    const fraisScolaireIdNum = parseInt(fraisScolaireId);

    // Vérification que la conversion a fonctionné
    if (isNaN(classeIdNum) || isNaN(fraisScolaireIdNum)) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'IDs invalides',
          echeanciers: [] 
        },
        { status: 400 }
      );
    }

    // Récupérer l'échéancier principal
    const sqlEcheancier = `
      SELECT 
        ec.*,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        fs.montant as montant_frais,
        cf.nom as categorie_nom
      FROM echeanciers_classe ec
      INNER JOIN classes c ON ec.classe_id = c.id
      INNER JOIN frais_scolaires fs ON ec.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE ec.classe_id = ? AND ec.frais_scolaire_id = ? AND ec.statut = 'actif'
    `;

    const echeanciers = await query(sqlEcheancier, [classeIdNum, fraisScolaireIdNum]) as any[];

    if (echeanciers.length === 0) {
      return NextResponse.json({
        success: true,
        echeanciers: [],
        message: 'Aucun échéancier trouvé'
      });
    }

    // Récupérer les versements de l'échéancier
    const sqlVersements = `
      SELECT * FROM versements_echeancier 
      WHERE echeancier_id = ? 
      ORDER BY numero_versement ASC
    `;

    const versements = await query(sqlVersements, [echeanciers[0].id]) as any[];

    const echeancierComplet = {
      ...echeanciers[0],
      versements: versements || []
    };

    console.log('✅ Échéancier trouvé avec', versements.length, 'versements');

    return NextResponse.json({
      success: true,
      echeanciers: [echeancierComplet]
    });

  } catch (error: any) {
    console.error('❌ Erreur API échéanciers:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}`,
        echeanciers: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('💰 API Echeanciers - Création/Modification');
    
    const body = await request.json();
    const { classe_id, frais_scolaire_id, nom_echeancier, montant_total, nombre_versements, versements } = body;

    console.log('📦 Données échéancier:', body);

    if (!classe_id || !frais_scolaire_id || !nom_echeancier || !montant_total || !versements) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Données manquantes pour créer l\'échéancier' 
        },
        { status: 400 }
      );
    }

    // Conversion sécurisée
    const classeIdNum = parseInt(classe_id.toString());
    const fraisScolaireIdNum = parseInt(frais_scolaire_id.toString());

    if (isNaN(classeIdNum) || isNaN(fraisScolaireIdNum)) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'IDs invalides' 
        },
        { status: 400 }
      );
    }

    // Vérifier si un échéancier existe déjà
    const echeancierExistants = await query(
      'SELECT id FROM echeanciers_classe WHERE classe_id = ? AND frais_scolaire_id = ?',
      [classeIdNum, fraisScolaireIdNum]
    ) as any[];

    let echeancierId;

    if (echeancierExistants.length > 0) {
      // Mettre à jour l'échéancier existant
      echeancierId = echeancierExistants[0].id;
      
      await query(
        'UPDATE echeanciers_classe SET nom_echeancier = ?, montant_total = ?, nombre_versements = ? WHERE id = ?',
        [nom_echeancier, parseFloat(montant_total), parseInt(nombre_versements), echeancierId]
      );

      // Supprimer les anciens versements
      await query('DELETE FROM versements_echeancier WHERE echeancier_id = ?', [echeancierId]);
      
      console.log('✅ Échéancier mis à jour');
    } else {
      // Créer un nouvel échéancier
      const result = await query(
        `INSERT INTO echeanciers_classe (classe_id, frais_scolaire_id, nom_echeancier, montant_total, nombre_versements, statut) 
         VALUES (?, ?, ?, ?, ?, 'actif')`,
        [classeIdNum, fraisScolaireIdNum, nom_echeancier, parseFloat(montant_total), parseInt(nombre_versements)]
      ) as any;

      echeancierId = result.insertId;
      console.log('✅ Nouvel échéancier créé ID:', echeancierId);
    }

    // Insérer les versements
    for (const versement of versements) {
      await query(
        `INSERT INTO versements_echeancier (echeancier_id, numero_versement, montant_versement, date_echeance, pourcentage, ordre) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          echeancierId,
          versement.numero_versement,
          versement.montant_versement,
          versement.date_echeance,
          versement.pourcentage,
          versement.ordre || versement.numero_versement
        ]
      );
    }

    console.log('✅', versements.length, 'versements créés');

    return NextResponse.json({
      success: true,
      message: `Échéancier ${echeancierExistants.length > 0 ? 'mis à jour' : 'créé'} avec succès`,
      echeancier_id: echeancierId
    });

  } catch (error: any) {
    console.error('❌ Erreur création échéancier:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur lors de la création de l'échéancier: ${error.message}` 
      },
      { status: 500 }
    );
  }
}