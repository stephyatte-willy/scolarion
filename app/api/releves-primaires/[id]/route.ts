// app/api/releves-primaires/[id]/route.ts - VERSION AVEC NOTES DÉTAILLÉES
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const releveId = parseInt(id);
    
    console.log('🎯 API relevé détaillé - ID:', releveId);
    
    if (isNaN(releveId) || releveId <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID de relevé invalide' },
        { status: 400 }
      );
    }

    // 1. Récupérer le relevé de base
    const sqlReleve = `
      SELECT 
        r.*,
        e.telephone_parent,
        e.email_parents,
        e.genre,
        e.date_naissance,
        e.lieu_naissance,
        e.nom_pere,
        e.nom_mere
      FROM releves_primaire r
      LEFT JOIN eleves e ON r.eleve_id = e.id
      WHERE r.id = ?
    `;
    
    console.log('📝 SQL relevé:', sqlReleve);
    
    let resultReleve: any[] = [];
    try {
      const queryResult = await query(sqlReleve, [releveId]);
      
      if (Array.isArray(queryResult)) {
        resultReleve = queryResult;
      } else if (queryResult) {
        resultReleve = [queryResult];
      }
      
      console.log(`📊 Résultat relevé: ${resultReleve.length} ligne(s)`);
      
    } catch (dbError: any) {
      console.error('❌ Erreur SQL relevé:', dbError.message);
      // Fallback: utiliser l'API existante
      return await getReleveFromAPI(releveId, request);
    }
    
    if (resultReleve.length === 0) {
      console.log('ℹ️ Relevé non trouvé directement, tentative via API...');
      return await getReleveFromAPI(releveId, request);
    }

    const releveRaw = resultReleve[0];
    
    // 2. Formater le relevé de base
    const releve: any = {
      id: Number(releveRaw.id) || 0,
      eleve_id: Number(releveRaw.eleve_id) || 0,
      matricule: String(releveRaw.matricule || ''),
      eleve_nom: String(releveRaw.eleve_nom || ''),
      eleve_prenom: String(releveRaw.eleve_prenom || ''),
      classe_id: Number(releveRaw.classe_id) || 0,
      classe_nom: String(releveRaw.classe_nom || ''),
      periode_id: Number(releveRaw.periode_id) || 0,
      periode_nom: String(releveRaw.periode_nom || ''),
      moyenne_generale: parseFloat(releveRaw.moyenne_generale) || 0,
      rang: Number(releveRaw.rang) || 0,
      mention: String(releveRaw.mention || ''),
      appreciation_generale: String(releveRaw.appreciation_generale || ''),
      date_generation: String(releveRaw.date_generation || new Date().toISOString()),
      telephone_parent: String(releveRaw.telephone_parent || ''),
      email_parents: String(releveRaw.email_parents || ''),
      genre: String(releveRaw.genre || ''),
      date_naissance: String(releveRaw.date_naissance || ''),
      lieu_naissance: String(releveRaw.lieu_naissance || ''),
      nom_pere: String(releveRaw.nom_pere || ''),
      nom_mere: String(releveRaw.nom_mere || ''),
      moyennes_par_matiere: []
    };
    
    // 3. RÉCUPÉRER LES NOTES DÉTAILLÉES
    console.log('🔍 Récupération des notes détaillées...');
    releve.moyennes_par_matiere = await getNotesDetaillees(releve.eleve_id, releve.periode_id);
    
    // Si pas de notes via l'API, essayer de parser celles du relevé
    if (releve.moyennes_par_matiere.length === 0 && releveRaw.moyennes_par_matiere) {
      console.log('🔍 Tentative de parsing des moyennes stockées...');
      releve.moyennes_par_matiere = parseMoyennesStockees(releveRaw.moyennes_par_matiere);
    }
    
    console.log(`✅ ${releve.moyennes_par_matiere.length} matières trouvées`);
    
    return NextResponse.json({
      success: true,
      releve: releve,
      source: 'direct-with-notes'
    });

  } catch (error: any) {
    console.error('❌ Erreur API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Erreur serveur'
      },
      { status: 500 }
    );
  }
}

// Fonction pour récupérer les notes détaillées depuis l'API notes-primaires
async function getNotesDetaillees(eleveId: number, periodeId: number): Promise<any[]> {
  try {
    if (!eleveId || !periodeId) {
      console.log('⚠️ ID élève ou période manquant');
      return [];
    }
    
    console.log(`🔍 Recherche notes pour élève ${eleveId}, période ${periodeId}`);
    
    // Récupérer les notes depuis la table notes_primaire
    const sqlNotes = `
      SELECT 
        n.*,
        mp.nom as matiere_nom,
        mp.coefficient,
        mp.note_sur,
        mp.couleur,
        mp.icone
      FROM notes_primaire n
      LEFT JOIN matieres_primaire mp ON n.matiere_id = mp.id
      WHERE n.eleve_id = ? 
        AND n.periode_id = ?
      ORDER BY mp.ordre_affichage, mp.nom
    `;
    
    const notesResult = await query(sqlNotes, [eleveId, periodeId]);
    
    if (!notesResult || !Array.isArray(notesResult)) {
      console.log('ℹ️ Aucune note trouvée via SQL direct');
      return [];
    }
    
    console.log(`📊 ${notesResult.length} notes récupérées`);
    
    // Transformer les notes en format matières
    const matieres = notesResult.map((note: any) => {
      const noteValue = parseFloat(note.note) || 0;
      const coefficient = parseFloat(note.coefficient) || 1;
      const noteCoefficientee = noteValue * coefficient;
      const noteSur = parseFloat(note.note_sur) || 20;
      
      // Générer une appréciation basée sur la note
      const appreciation = genererAppreciation(noteValue);
      
      return {
        matiere_id: Number(note.matiere_id) || 0,
        matiere_nom: note.matiere_nom || note.matiere_nom_complet || 'Matière',
        coefficient: coefficient,
        note: noteValue,
        note_sur: noteSur,
        note_coefficientee: noteCoefficientee,
        appreciation: note.appreciation || appreciation,
        couleur: note.couleur || '#3B82F6',
        icone: note.icone || '📚'
      };
    });
    
    return matieres;
    
  } catch (error) {
    console.error('❌ Erreur récupération notes détaillées:', error);
    return [];
  }
}

// Fonction pour parser les moyennes stockées dans le relevé
function parseMoyennesStockees(moyennesData: any): any[] {
  try {
    let parsed;
    
    if (typeof moyennesData === 'string') {
      const trimmed = moyennesData.trim();
      if (!trimmed || trimmed === 'null' || trimmed === 'undefined' || trimmed === '') {
        return [];
      }
      parsed = JSON.parse(trimmed);
    } else {
      parsed = moyennesData;
    }
    
    if (Array.isArray(parsed)) {
      return parsed.map((item: any) => {
        const note = parseFloat(item.note || item.moyenne || 0);
        const coefficient = parseFloat(item.coefficient || 1);
        const noteCoefficientee = note * coefficient;
        const noteSur = parseFloat(item.note_sur || 20);
        
        return {
          matiere_id: Number(item.matiere_id || item.id || 0),
          matiere_nom: item.matiere_nom || item.nom || 'Matière',
          coefficient: coefficient,
          note: note,
          note_sur: noteSur,
          note_coefficientee: noteCoefficientee,
          appreciation: item.appreciation || genererAppreciation(note)
        };
      });
    }
    
    return [];
  } catch (error) {
    console.error('❌ Erreur parsing moyennes stockées:', error);
    return [];
  }
}

// Fonction pour générer une appréciation basée sur la note
function genererAppreciation(note: number): string {
  if (note >= 18) return 'Excellent';
  if (note >= 16) return 'Très bien';
  if (note >= 14) return 'Bien';
  if (note >= 12) return 'Assez bien';
  if (note >= 10) return 'Passable';
  if (note >= 8) return 'Insuffisant';
  return 'Très insuffisant';
}

// Fonction fallback: utiliser l'API existante
async function getReleveFromAPI(releveId: number, request: NextRequest) {
  try {
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/releves-primaires`, {
      cache: 'no-store'
    });
    
    if (!response.ok) throw new Error('API générale inaccessible');
    
    const data = await response.json();
    if (!data.success) throw new Error(data.error || 'Erreur API');
    
    const tousReleves = data.releves || [];
    const releveTrouve = tousReleves.find((r: any) => r.id === releveId);
    
    if (!releveTrouve) {
      return NextResponse.json(
        { success: false, error: 'Relevé non trouvé' },
        { status: 404 }
      );
    }
    
    // Récupérer les notes détaillées pour ce relevé
    if (releveTrouve.eleve_id && releveTrouve.periode_id) {
      releveTrouve.moyennes_par_matiere = await getNotesDetaillees(
        releveTrouve.eleve_id, 
        releveTrouve.periode_id
      );
    }
    
    return NextResponse.json({
      success: true,
      releve: releveTrouve,
      source: 'from-api-with-notes'
    });
    
  } catch (error: any) {
    console.error('❌ Erreur fallback API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Relevé non trouvé'
      },
      { status: 404 }
    );
  }
}