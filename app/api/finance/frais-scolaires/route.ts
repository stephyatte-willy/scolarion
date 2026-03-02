// /api/finance/frais-scolaires/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/app/services/financeService';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Frais scolaires - Début GET');
    
    const searchParams = request.nextUrl.searchParams;
    const classeId = searchParams.get('classe_id');
    const anneeScolaire = searchParams.get('annee_scolaire');
    const statut = searchParams.get('statut') || 'actif';

    let sql = `
      SELECT 
        fs.*,
        cf.nom as categorie_nom,
        cf.type as categorie_type,
        cf.periodicite as categorie_periodicite,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        COUNT(e.id) as nombre_eleves
      FROM frais_scolaires fs
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      INNER JOIN classes c ON fs.classe_id = c.id
      LEFT JOIN eleves e ON e.classe_id = c.id AND e.statut = 'actif'
      WHERE fs.statut = ?
    `;
    
    const params: any[] = [statut];

    if (classeId) {
      sql += ' AND fs.classe_id = ?';
      params.push(parseInt(classeId));
    }

    if (anneeScolaire) {
      sql += ' AND fs.annee_scolaire = ?';
      params.push(anneeScolaire);
    }

    sql += ' GROUP BY fs.id ORDER BY cf.nom';

    const result = await query(sql, params);
    
    const frais = Array.isArray(result) ? result : [];
    console.log(`✅ ${frais.length} frais scolaires trouvés`);
    
    return NextResponse.json({
      success: true,
      frais: frais
    });
  } catch (error: any) {
    console.error('❌ Erreur récupération frais scolaires:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la récupération des frais scolaires',
        frais: []
      },
      { status: 500 }
    );
  }
}

// IMPORTANT : Ajoutez cette importation manquante
import { query } from '@/app/lib/database';

// AJOUTER CETTE FONCTION POUR GÉRER LES POST (création)
export async function POST(request: NextRequest) {
  try {
    console.log('📝 API Frais scolaires - Début POST (création)');
    
    // Vérifier que le corps de la requête n'est pas vide
    const text = await request.text();
    if (!text) {
      console.error('❌ Corps de requête vide');
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Données manquantes dans la requête' 
        },
        { status: 400 }
      );
    }
    
    const fraisData = JSON.parse(text);
    console.log('📦 Données reçues:', fraisData);

    // Validation des données requises
    if (!fraisData.classe_id || !fraisData.categorie_frais_id || !fraisData.montant) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Données incomplètes. Classe, catégorie et montant sont requis.' 
        },
        { status: 400 }
      );
    }

    // Appeler le service pour créer le frais
    const resultat = await FinanceService.creerFraisScolaire(fraisData);
    
    if (!resultat.success) {
      console.error('❌ Erreur création frais scolaire:', resultat.erreur);
      return NextResponse.json(
        { 
          success: false, 
          erreur: resultat.erreur || 'Erreur lors de la création du frais scolaire' 
        },
        { status: 400 }
      );
    }

    console.log('✅ Frais scolaire créé avec succès');
    
    return NextResponse.json({
      success: true,
      frais: resultat.frais
    });
  } catch (error: any) {
    console.error('❌ Erreur API création frais scolaire:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

// AJOUTER CETTE FONCTION POUR GÉRER LES PUT (modification)
export async function PUT(request: NextRequest) {
  try {
    console.log('✏️ API Frais scolaires - Début PUT (modification)');
    
    // Vérifier que le corps de la requête n'est pas vide
    const text = await request.text();
    if (!text) {
      console.error('❌ Corps de requête vide');
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Données manquantes dans la requête' 
        },
        { status: 400 }
      );
    }
    
    const fraisData = JSON.parse(text);
    console.log('📦 Données reçues:', fraisData);

    // Vérifier si l'ID est présent
    if (!fraisData.id) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'ID du frais scolaire requis pour la modification' 
        },
        { status: 400 }
      );
    }

    // Validation des données requises
    if (!fraisData.classe_id || !fraisData.categorie_frais_id || !fraisData.montant) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Données incomplètes. Classe, catégorie et montant sont requis.' 
        },
        { status: 400 }
      );
    }

    // Appeler le service pour modifier le frais
    const resultat = await FinanceService.modifierFraisScolaire(fraisData.id, fraisData);
    
    if (!resultat.success) {
      console.error('❌ Erreur modification frais scolaire:', resultat.erreur);
      return NextResponse.json(
        { 
          success: false, 
          erreur: resultat.erreur || 'Erreur lors de la modification du frais scolaire' 
        },
        { status: 400 }
      );
    }

    console.log('✅ Frais scolaire modifié avec succès');
    
    return NextResponse.json({
      success: true,
      frais: resultat.frais
    });
  } catch (error: any) {
    console.error('❌ Erreur API modification frais scolaire:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}