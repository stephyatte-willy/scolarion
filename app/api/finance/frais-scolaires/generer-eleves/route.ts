import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour les résultats
interface FraisScolaire {
  id: number;
  montant: number;
  classe_id: number;
  classe_nom: string;
  classe_niveau: string;
  categorie_nom: string;
  [key: string]: any;
}

interface Eleve {
  id: number;
  nom: string;
  prenom: string;
  matricule: string;
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 API Génération frais élèves - Début');
    
    const body = await request.json();
    const { frais_scolaire_id } = body;

    if (!frais_scolaire_id) {
      return NextResponse.json(
        { success: false, erreur: 'ID du frais scolaire requis' },
        { status: 400 }
      );
    }

    // Récupérer les informations du frais scolaire
    const fraisQuery = `
      SELECT fs.*, c.nom as classe_nom, c.niveau as classe_niveau, cf.nom as categorie_nom
      FROM frais_scolaires fs
      INNER JOIN classes c ON fs.classe_id = c.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE fs.id = ?
    `;
    
    // ✅ Correction : Récupérer le résultat et vérifier que c'est un tableau
    const fraisResult = await query(fraisQuery, [frais_scolaire_id]) as FraisScolaire[];
    
    if (!Array.isArray(fraisResult) || fraisResult.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Frais scolaire non trouvé' },
        { status: 404 }
      );
    }
    
    const frais = fraisResult[0];

    // Récupérer les élèves actifs de la classe
    const elevesQuery = `
      SELECT id, nom, prenom, matricule
      FROM eleves
      WHERE classe_id = ? AND statut = 'actif'
    `;
    
    const elevesResult = await query(elevesQuery, [frais.classe_id]) as Eleve[];
    
    // ✅ Vérifier que c'est un tableau
    const eleves = Array.isArray(elevesResult) ? elevesResult : [];

    if (eleves.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Aucun élève actif dans cette classe',
          message: 'Aucun élève trouvé pour générer les frais'
        },
        { status: 404 }
      );
    }

    let fraisGeneres = 0;
    let erreurs = 0;

    // Générer les frais pour chaque élève
    for (const eleve of eleves) {
      try {
        const checkQuery = `
          SELECT id FROM frais_eleves 
          WHERE frais_scolaire_id = ? AND eleve_id = ? AND statut = 'actif'
        `;
        
        const existeResult = await query(checkQuery, [frais_scolaire_id, eleve.id]) as any[];
        const existe = Array.isArray(existeResult) && existeResult.length > 0;
        
        if (existe) {
          console.log(`Frais déjà existant pour l'élève ${eleve.matricule}`);
          continue;
        }

        const insertQuery = `
          INSERT INTO frais_eleves (frais_scolaire_id, eleve_id, montant, statut, date_echeance)
          VALUES (?, ?, ?, 'actif', DATE_ADD(CURDATE(), INTERVAL 30 DAY))
        `;
        
        await query(insertQuery, [frais_scolaire_id, eleve.id, frais.montant]);
        fraisGeneres++;
        
      } catch (error) {
        console.error(`Erreur génération frais pour élève ${eleve.matricule}:`, error);
        erreurs++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `${fraisGeneres} frais générés pour les élèves de ${frais.classe_niveau} ${frais.classe_nom}`,
      details: {
        frais_generes: fraisGeneres,
        erreurs: erreurs,
        total_eleves: eleves.length
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur génération frais élèves:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}