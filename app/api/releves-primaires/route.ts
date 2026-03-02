import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Fonction pour convertir les types MySQL en types JavaScript
function convertMySQLTypes(data: any): any {
  if (Array.isArray(data)) {
    return data.map(convertMySQLTypes);
  } else if (data && typeof data === 'object') {
    const result: any = {};
    for (const key in data) {
      const value = data[key];
      
      // Convertir les champs DECIMAL en nombres
      if (key === 'moyenne_generale' || key.includes('moyenne') || key === 'note' || key === 'note_sur') {
        result[key] = value !== null ? parseFloat(value) : 0;
      }
      // Convertir les booléens
      else if (key === 'email_envoye' || key === 'notes_saisies' || key === 'releves_generes') {
        result[key] = value !== null ? Boolean(value) : false;
      }
      // Convertir les nombres entiers
      else if (key === 'id' || key === 'eleve_id' || key === 'classe_id' || key === 'periode_id' || key === 'rang') {
        result[key] = value !== null ? parseInt(value, 10) : 0;
      }
      // Garder les autres champs tels quels
      else {
        result[key] = value;
      }
    }
    return result;
  }
  return data;
}

export async function GET(request: NextRequest) {
  console.log('🚀 API /api/releves-primaires appelée');
  
  try {
    const { searchParams } = new URL(request.url);
    const compositionId = searchParams.get('composition_id');
    const classeId = searchParams.get('classe_id');
    const periodeId = searchParams.get('periode_id');
    const eleveId = searchParams.get('eleve_id');

    console.log('📋 Paramètres reçus:', {
      compositionId,
      classeId,
      periodeId,
      eleveId
    });

    // Construire la requête SQL de base
let sql = `
  SELECT 
    r.id,
    r.eleve_id,
    r.matricule,
    r.eleve_nom,
    r.eleve_prenom,
    r.classe_id,
    r.classe_nom,
    r.periode_id,
    r.periode_nom,
    r.moyennes_par_matiere,
    CAST(r.moyenne_generale AS DECIMAL(4,2)) as moyenne_generale,
    r.rang,
    r.mention,
    r.appreciation_generale,
    r.date_generation,
    r.statut,
    r.email_envoye,
    r.date_envoi_email,
    r.created_at,
    r.updated_at,
    e.telephone_parent  -- Ajout du téléphone parent
  FROM releves_primaire r
  LEFT JOIN eleves e ON r.eleve_id = e.id
  WHERE 1=1
`;
    
    let params: any[] = [];

    // Si composition_id est fourni
    if (compositionId && compositionId !== 'tous' && compositionId !== '0') {
      console.log('🔍 Recherche par composition_id:', compositionId);
      
      try {
        const compSql = `
          SELECT classe_id, periode_id 
          FROM compositions_primaire 
          WHERE id = ? AND est_supprime = 0
        `;
        
        const compResult: any = await query(compSql, [parseInt(compositionId)]);
        
        if (compResult && compResult.length > 0) {
          const comp = compResult[0];
          sql += ' AND r.classe_id = ? AND r.periode_id = ?';
          params.push(comp.classe_id, comp.periode_id);
        }
      } catch (compError: any) {
        console.error('❌ Erreur composition:', compError);
      }
    }
    
    // Filtre par classe
    if (classeId && classeId !== 'tous' && classeId !== '0') {
      sql += ' AND r.classe_id = ?';
      params.push(parseInt(classeId));
    }
    
    // Filtre par période
    if (periodeId && periodeId !== 'tous' && periodeId !== '0') {
      sql += ' AND r.periode_id = ?';
      params.push(parseInt(periodeId));
    }
    
    // Filtre par élève
    if (eleveId && eleveId !== 'tous' && eleveId !== '0') {
      sql += ' AND r.eleve_id = ?';
      params.push(parseInt(eleveId));
    }
    
    // Ajouter le tri
    sql += ' ORDER BY r.rang ASC, r.moyenne_generale DESC';
    
    console.log('📝 SQL final:', sql);
    console.log('🔧 Paramètres:', params);
    
    try {
      // Exécuter la requête
      const result = await query(sql, params);
      
      // Convertir les types MySQL
      const releves = convertMySQLTypes(result || []);

      // S'assurer que moyennes_par_matiere est parsable
const relevesValides = releves.map((releve: any) => {
  try {
    // Si c'est déjà un tableau, le garder tel quel
    if (Array.isArray(releve.moyennes_par_matiere)) {
      return releve;
    }
    
    // Si c'est une chaîne, essayer de la parser
    if (typeof releve.moyennes_par_matiere === 'string') {
      releve.moyennes_par_matiere = JSON.parse(releve.moyennes_par_matiere);
    } else {
      // Sinon, définir un tableau vide
      releve.moyennes_par_matiere = [];
    }
    
    return releve;
  } catch (error) {
    console.error(`Erreur parsing moyennes pour relevé ${releve.id}:`, error);
    releve.moyennes_par_matiere = [];
    return releve;
  }
});
      
      console.log(`✅ ${releves.length} relevés trouvés et convertis`);
      
      return NextResponse.json({
        success: true,
        message: `${releves.length} relevés récupérés`,
        releves: releves
      });
      
    } catch (dbError: any) {
      console.error('❌ Erreur SQL:', dbError);
      
      // Fallback simplifié
      const fallbackSql = `
        SELECT 
          id, eleve_id, matricule, eleve_nom, eleve_prenom,
          classe_id, classe_nom, periode_id, periode_nom,
          moyennes_par_matiere,
          CAST(moyenne_generale AS DECIMAL(4,2)) as moyenne_generale,
          rang, mention, appreciation_generale,
          date_generation, statut, email_envoye
        FROM releves_primaire 
        ORDER BY date_generation DESC
        LIMIT 50
      `;
      
      const fallbackResult = await query(fallbackSql, []);
      const fallbackReleves = convertMySQLTypes(fallbackResult || []);
      
      return NextResponse.json({
        success: true,
        message: 'Récupération avec fallback',
        releves: fallbackReleves,
        warning: 'Erreur SQL corrigée avec fallback'
      });
    }

  } catch (error: any) {
    console.error('❌ Erreur API:', error);
    
    // Dernier recours
    try {
      const simpleResult = await query(
        'SELECT id, eleve_nom, eleve_prenom, CAST(moyenne_generale AS DECIMAL(4,2)) as moyenne_generale FROM releves_primaire LIMIT 10', 
        []
      );
      const simpleReleves = convertMySQLTypes(simpleResult || []);
      
      return NextResponse.json({
        success: true,
        message: 'Récupération minimale',
        releves: simpleReleves,
        error: error.message
      });
    } catch (finalError) {
      return NextResponse.json({
        success: false,
        error: 'Erreur serveur',
        releves: []
      }, { status: 500 });
    }
  }
}