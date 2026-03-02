import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log('🔄 API partage simple - ID:', id);
    
    // Récupérer les paramètres de l'école d'abord
    let ecole;
    try {
      const ecoleResult = await query('SELECT * FROM parametres LIMIT 1') as any[];
      ecole = ecoleResult[0] || {
        nom_ecole: "Groupe Scolaire GNAMIEN ASSA",
        adresse: "Biengerville CEFAL",
        telephone: "+225 01 72 95 45 47",
        email: "groupescolairegnamienassa@gmail.com",
        slogan: "Apprendre - Partager - Grandir",
        couleur_principale: "#3B82F6"
      };
    } catch (error) {
      ecole = {
        nom_ecole: "Groupe Scolaire GNAMIEN ASSA",
        adresse: "Biengerville CEFAL",
        telephone: "+225 01 72 95 45 47",
        email: "groupescolairegnamienassa@gmail.com",
        slogan: "Apprendre - Partager - Grandir"
      };
    }
    
    // 1. D'abord, voir si la table releves_primaire existe et contient des données
    try {
      const testQuery = await query('SHOW TABLES LIKE "releves_primaire"') as any[];
      console.log('📊 Table releves_primaire existe?', testQuery.length > 0);
      
      if (testQuery.length > 0) {
        const countResult = await query('SELECT COUNT(*) as count FROM releves_primaire') as any[];
        console.log('📊 Nombre total de relevés:', countResult[0]?.count);
      }
    } catch (error) {
      console.log('❌ Erreur vérification table:', error);
    }
    
    // 2. Récupérer le relevé avec une requête très simple
    const releveSql = `
      SELECT 
        id, 
        eleve_id,
        matricule,
        eleve_nom,
        eleve_prenom,
        classe_nom,
        periode_nom,
        moyennes_par_matiere,
        moyenne_generale,
        rang,
        mention,
        appreciation_generale,
        date_generation,
        statut
      FROM releves_primaire 
      WHERE id = ?
    `;
    
    console.log('📝 SQL:', releveSql);
    console.log('🔧 Paramètre ID:', parseInt(id));
    
    const releveResult = await query(releveSql, [parseInt(id)]) as any[];
    
    console.log('📊 Résultat query:', {
      existe: !!releveResult,
      longueur: releveResult?.length,
      premierElement: releveResult?.[0]
    });
    
    if (!releveResult || releveResult.length === 0) {
      console.log('❌ Relevé non trouvé avec ID:', id);
      
      // Essayer avec une requête alternative
      const alternativeSql = 'SELECT * FROM releves_primaire WHERE id = ? LIMIT 1';
      const alternativeResult = await query(alternativeSql, [parseInt(id)]) as any[];
      
      if (!alternativeResult || alternativeResult.length === 0) {
        // Essayer de trouver n'importe quel relevé pour debug
        const debugSql = 'SELECT id, eleve_nom FROM releves_primaire LIMIT 5';
        const debugResult = await query(debugSql) as any[];
        console.log('🐛 Debug - 5 premiers relevés:', debugResult);
        
        return NextResponse.json({
          success: false,
          error: `Relevé ID ${id} non trouvé. Base contient ${debugResult?.length || 0} relevés.`
        }, { status: 404 });
      }
      
      // Si trouvé avec requête alternative
      const releve = alternativeResult[0];
      return preparerReponse(releve, ecole);
    }
    
    const releve = releveResult[0];
    return preparerReponse(releve, ecole);
    
  } catch (error: any) {
    console.error('❌ Erreur API partage simple:', error);
    
    // Retourner une réponse avec des données de test pour debug
    return NextResponse.json({
      success: true,
      debug: true,
      message: 'Mode debug - Données de test',
      releve: {
        id: parseInt(id),
        eleve_nom: 'Test',
        eleve_prenom: 'Élève',
        matricule: 'TEST' + id,
        classe_nom: 'CM2',
        periode_nom: 'Trimestre 1',
        moyennes_par_matiere: JSON.stringify([
          { matiere_nom: 'Mathématiques', note: 16.5, coefficient: 3, appreciation: 'Très Bien' },
          { matiere_nom: 'Français', note: 14.2, coefficient: 3, appreciation: 'Bien' }
        ]),
        moyenne_generale: 15.35,
        rang: 5,
        mention: 'Bien',
        appreciation_generale: 'Élève test pour debug.',
        date_generation: new Date().toISOString()
      },
      ecole: {
        nom_ecole: "Groupe Scolaire GNAMIEN ASSA",
        adresse: "Biengerville CEFAL",
        telephone: "+225 01 72 95 45 47",
        email: "groupescolairegnamienassa@gmail.com",
        slogan: "Apprendre - Partager - Grandir"
      }
    });
  }
}

// Fonction utilitaire pour préparer la réponse
async function preparerReponse(releve: any, ecole: any) {
  console.log('📦 Préparation réponse pour relevé:', releve.id);
  
  // Parser les moyennes par matière
  let moyennesParsed = [];
  if (releve.moyennes_par_matiere) {
    try {
      console.log('📝 Données brutes moyennes:', typeof releve.moyennes_par_matiere, releve.moyennes_par_matiere?.substring?.(0, 100));
      
      let parsed;
      if (typeof releve.moyennes_par_matiere === 'string') {
        // Nettoyer le string
        const cleaned = releve.moyennes_par_matiere
          .replace(/\\\\/g, '')
          .replace(/\\"/g, '"')
          .replace(/"{/g, '{')
          .replace(/}"/g, '}');
        
        console.log('🧹 String nettoyé:', cleaned.substring(0, 100));
        
        try {
          parsed = JSON.parse(cleaned);
        } catch (e1) {
          // Essayer sans nettoyage
          try {
            parsed = JSON.parse(releve.moyennes_par_matiere);
          } catch (e2) {
            // Essayer d'extraire un tableau
            const match = releve.moyennes_par_matiere.match(/\[.*\]/);
            if (match) {
              parsed = JSON.parse(match[0]);
            } else {
              parsed = [];
            }
          }
        }
      } else {
        parsed = releve.moyennes_par_matiere;
      }
      
      if (Array.isArray(parsed)) {
        moyennesParsed = parsed.map((item: any) => ({
          matiere_nom: item.matiere_nom || item.nom || 'Matière',
          note: typeof item.note === 'number' ? item.note : 
                typeof item.moyenne_matiere === 'number' ? item.moyenne_matiere :
                parseFloat(item.note || item.moyenne_matiere || 0),
          coefficient: item.coefficient || 1,
          appreciation: item.appreciation || ''
        }));
      } else if (parsed && typeof parsed === 'object') {
        // Convertir objet en tableau
        moyennesParsed = Object.entries(parsed).map(([key, value]: [string, any]) => ({
          matiere_nom: key,
          note: value.note || value.moyenne || 0,
          coefficient: value.coefficient || 1,
          appreciation: value.appreciation || ''
        }));
      }
      
      console.log('✅ Moyennes parsées:', moyennesParsed.length);
      
    } catch (error) {
      console.error('❌ Erreur parsing moyennes:', error);
      moyennesParsed = [];
    }
  }
  
  // Si pas de moyennes, créer des données par défaut
  if (moyennesParsed.length === 0) {
    moyennesParsed = [{
      matiere_nom: 'Moyenne Générale',
      note: releve.moyenne_generale || 0,
      coefficient: 1,
      appreciation: releve.mention || ''
    }];
  }
  
  return NextResponse.json({
    success: true,
    releve: {
      ...releve,
      moyennes_par_matiere: moyennesParsed,
      moyenne_generale: parseFloat(releve.moyenne_generale) || 0,
      rang: parseInt(releve.rang) || 0
    },
    ecole
  });
}