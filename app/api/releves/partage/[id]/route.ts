import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour les paramètres
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams  // ✅ Interface avec Promise
) {
  try {
    // ✅ Récupération asynchrone de l'ID
    const { id } = await params;
    console.log('🔄 API partage relevé ID:', id);
    
    // Validation de l'ID
    const idNum = parseInt(id);
    if (isNaN(idNum) || idNum <= 0) {
      console.log('❌ ID invalide:', id);
      return NextResponse.json({
        success: false,
        error: 'ID de relevé invalide'
      }, { status: 400 });
    }
    
    // Récupérer les paramètres de l'école
    const ecoleSql = 'SELECT * FROM parametres LIMIT 1';
    const ecoleResult = await query(ecoleSql) as any[];
    const ecole = ecoleResult[0] || {
      nom_ecole: "École Primaire",
      adresse: "Adresse non spécifiée",
      telephone: "00 00 00 00 00",
      email: "contact@ecole.fr",
      slogan: "L'excellence éducative",
      couleur_principale: "#3B82F6"
    };
    
    // Récupérer le relevé
    const releveSql = `
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
        e.telephone_parent,
        e.email_parents
      FROM releves_primaire r
      LEFT JOIN eleves e ON r.eleve_id = e.id
      WHERE r.id = ?
    `;
    
    const releveResult = await query(releveSql, [idNum]) as any[];
    
    if (!releveResult || releveResult.length === 0) {
      console.log('❌ Relevé non trouvé pour ID:', id);
      return NextResponse.json({
        success: false,
        error: 'Relevé non trouvé'
      }, { status: 404 });
    }
    
    const releve = releveResult[0];
    console.log('✅ Relevé trouvé:', {
      id: releve.id,
      eleve: `${releve.eleve_prenom} ${releve.eleve_nom}`,
      classe: releve.classe_nom
    });
    
    // Convertir les moyennes par matière si c'est une string
    let moyennesParsed = [];
    if (releve.moyennes_par_matiere) {
      try {
        const parsed = typeof releve.moyennes_par_matiere === 'string' 
          ? JSON.parse(releve.moyennes_par_matiere)
          : releve.moyennes_par_matiere;
        
        if (Array.isArray(parsed)) {
          moyennesParsed = parsed;
        }
      } catch (error) {
        console.error('❌ Erreur parsing moyennes:', error);
        // Essayer un format alternatif
        try {
          const cleaned = releve.moyennes_par_matiere.toString().replace(/\\/g, '');
          const reparsed = JSON.parse(cleaned);
          if (Array.isArray(reparsed)) {
            moyennesParsed = reparsed;
          }
        } catch (e) {
          console.error('❌ Erreur réparation parsing:', e);
          moyennesParsed = [];
        }
      }
    }
    
    // Récupérer les notes détaillées si disponibles
    let notesDetaillees = [];
    if (releve.eleve_id && releve.periode_id) {
      try {
        const notesSql = `
          SELECT 
            n.*, 
            mp.nom as matiere_nom,
            mp.couleur, 
            mp.coefficient, 
            mp.icone
          FROM notes_primaire n
          LEFT JOIN matieres_primaire mp ON n.matiere_id = mp.id
          WHERE n.eleve_id = ? 
            AND EXISTS (
              SELECT 1 FROM compositions_primaire cp 
              WHERE cp.id = n.composition_id 
                AND cp.periode_id = ?
            )
          ORDER BY mp.nom
        `;
        const notesResult = await query(notesSql, [releve.eleve_id, releve.periode_id]) as any[];
        notesDetaillees = notesResult || [];
        console.log(`📝 ${notesDetaillees.length} notes détaillées trouvées`);
      } catch (error) {
        console.error('❌ Erreur récupération notes:', error);
      }
    }
    
    // Si pas de moyennes parsées mais des notes détaillées, créer un résumé
    if (moyennesParsed.length === 0 && notesDetaillees.length > 0) {
      // Créer un résumé par matière
      const matieresMap = new Map();
      
      notesDetaillees.forEach((note: any) => {
        const matiereId = note.matiere_id;
        if (!matieresMap.has(matiereId)) {
          matieresMap.set(matiereId, {
            matiere_id: matiereId,
            matiere_nom: note.matiere_nom || `Matière ${matiereId}`,
            note: 0,
            note_sur: 20,
            coefficient: note.coefficient || 1,
            appreciation: '',
            count: 0,
            total: 0
          });
        }
        
        const matiere = matieresMap.get(matiereId);
        matiere.total += parseFloat(note.note) || 0;
        matiere.count += 1;
      });
      
      // Calculer les moyennes
      moyennesParsed = Array.from(matieresMap.values()).map((matiere: any) => ({
        ...matiere,
        note: matiere.count > 0 ? (matiere.total / matiere.count) : 0,
        moyenne_matiere: matiere.count > 0 ? (matiere.total / matiere.count) : 0,
        appreciation: matiere.note >= 16 ? 'Excellent' : 
                     matiere.note >= 14 ? 'Très Bien' : 
                     matiere.note >= 12 ? 'Bien' : 
                     matiere.note >= 10 ? 'Assez Bien' : 
                     matiere.note >= 8 ? 'Passable' : 'Insuffisant'
      }));
    }
    
    return NextResponse.json({
      success: true,
      releve: {
        ...releve,
        moyennes_par_matiere: moyennesParsed,
        notes_detaillees: notesDetaillees,
        moyenne_generale: parseFloat(releve.moyenne_generale) || 0,
        rang: parseInt(releve.rang) || 0,
        date_generation: releve.date_generation
      },
      ecole
    });
    
  } catch (error: any) {
    console.error('❌ Erreur API partage relevé:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur serveur: ' + error.message
    }, { status: 500 });
  }
}