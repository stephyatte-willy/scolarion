import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get('classe_id');
    const periodeId = searchParams.get('periode_id');
    const matiereId = searchParams.get('matiere_id');
    const statut = searchParams.get('statut');

    let sql = `
      SELECT e.*, 
             m.nom as matiere_nom,
             c.nom as classe_nom,
             CONCAT(u.prenom, ' ', u.nom) as enseignant_nom,
             ens.matricule as enseignant_matricule
      FROM evaluations e
      LEFT JOIN matieres m ON e.matiere_id = m.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN enseignants ens ON e.enseignant_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (classeId && classeId !== 'tous') {
      sql += ' AND e.classe_id = ?';
      params.push(parseInt(classeId));
    }

    if (periodeId && periodeId !== 'tous') {
      sql += ' AND e.periode_id = ?';
      params.push(parseInt(periodeId));
    }

    if (matiereId && matiereId !== 'tous') {
      sql += ' AND e.matiere_id = ?';
      params.push(parseInt(matiereId));
    }

    if (statut && statut !== 'tous') {
      sql += ' AND e.statut = ?';
      params.push(statut);
    }

    sql += ' ORDER BY e.date_evaluation DESC';

    console.log('📝 SQL évaluations:', sql);
    const evaluations = await query(sql, params);

    return NextResponse.json({
      success: true,
      evaluations: evaluations || []
    });
  } catch (error: any) {
    console.error('❌ Erreur GET évaluations:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message}`,
        evaluations: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📥 Données reçues pour création évaluation:', data);
    
    // Validation
    if (!data.code_evaluation) {
      return NextResponse.json(
        { success: false, error: 'Code évaluation requis' },
        { status: 400 }
      );
    }

    if (!data.titre) {
      return NextResponse.json(
        { success: false, error: 'Titre requis' },
        { status: 400 }
      );
    }

    // Vérifier si le code existe déjà
    const checkSql = 'SELECT id FROM evaluations WHERE code_evaluation = ?';
    const existing = await query(checkSql, [data.code_evaluation]);
    
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ce code existe déjà' },
        { status: 400 }
      );
    }

    // Vérifier si l'enseignant existe
    const checkEnseignantSql = 'SELECT id FROM enseignants WHERE id = ?';
    const enseignantExists = await query(checkEnseignantSql, [data.enseignant_id]);
    
    if (enseignantExists.length === 0 && data.enseignant_id) {
      return NextResponse.json(
        { success: false, error: 'Enseignant non trouvé' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO evaluations (
        code_evaluation, titre, description, matiere_id, classe_id,
        enseignant_id, type_evaluation, date_evaluation, coefficient,
        note_maximale, bareme, periode_id, statut, annee_scolaire
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Convertir undefined en null ou valeurs par défaut
    const params = [
      data.code_evaluation || null,
      data.titre || null,
      data.description || null,
      data.matiere_id || null,
      data.classe_id || null,
      data.enseignant_id || null,
      data.type_evaluation || 'devoir',
      data.date_evaluation || new Date().toISOString().split('T')[0],
      data.coefficient || 1.0,
      data.note_maximale || 20.00,
      data.bareme || 'sur_20',
      data.periode_id || null,
      data.statut || 'a_venir',
      data.annee_scolaire || null
    ];

    console.log('📝 SQL création évaluation:', sql);
    console.log('📋 Paramètres:', params);
    
    const result = await query(sql, params);

    // Récupérer l'évaluation créée avec les jointures
    const getSql = `
      SELECT e.*, 
             m.nom as matiere_nom,
             c.nom as classe_nom,
             CONCAT(u.prenom, ' ', u.nom) as enseignant_nom,
             ens.matricule as enseignant_matricule
      FROM evaluations e
      LEFT JOIN matieres m ON e.matiere_id = m.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN enseignants ens ON e.enseignant_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id
      WHERE e.id = ?
    `;
    
    const [evaluation] = await query(getSql, [result.insertId]);

    console.log('✅ Évaluation créée avec succès:', evaluation);

    return NextResponse.json({
      success: true,
      evaluation: evaluation,
      message: 'Évaluation créée avec succès'
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Erreur POST évaluation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la création: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

// PUT: Mettre à jour une évaluation
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📥 Données reçues pour mise à jour évaluation:', data);

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'ID évaluation requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'évaluation existe
    const checkSql = 'SELECT * FROM evaluations WHERE id = ?';
    const existing = await query(checkSql, [data.id]);
    
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Évaluation non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si l'enseignant existe
    if (data.enseignant_id) {
      const checkEnseignantSql = 'SELECT id FROM enseignants WHERE id = ?';
      const enseignantExists = await query(checkEnseignantSql, [data.enseignant_id]);
      
      if (enseignantExists.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Enseignant non trouvé' },
          { status: 400 }
        );
      }
    }

    // Construire dynamiquement la requête UPDATE
    const updateFields = [];
    const updateParams = [];

    if (data.titre !== undefined) {
      updateFields.push('titre = ?');
      updateParams.push(data.titre);
    }
    
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(data.description);
    }
    
    if (data.matiere_id !== undefined) {
      updateFields.push('matiere_id = ?');
      updateParams.push(data.matiere_id);
    }
    
    if (data.classe_id !== undefined) {
      updateFields.push('classe_id = ?');
      updateParams.push(data.classe_id);
    }
    
    if (data.enseignant_id !== undefined) {
      updateFields.push('enseignant_id = ?');
      updateParams.push(data.enseignant_id);
    }
    
    if (data.type_evaluation !== undefined) {
      updateFields.push('type_evaluation = ?');
      updateParams.push(data.type_evaluation);
    }
    
    if (data.date_evaluation !== undefined) {
      updateFields.push('date_evaluation = ?');
      updateParams.push(data.date_evaluation);
    }
    
    if (data.coefficient !== undefined) {
      updateFields.push('coefficient = ?');
      updateParams.push(data.coefficient);
    }
    
    if (data.note_maximale !== undefined) {
      updateFields.push('note_maximale = ?');
      updateParams.push(data.note_maximale);
    }
    
    if (data.bareme !== undefined) {
      updateFields.push('bareme = ?');
      updateParams.push(data.bareme);
    }
    
    if (data.periode_id !== undefined) {
      updateFields.push('periode_id = ?');
      updateParams.push(data.periode_id);
    }
    
    if (data.statut !== undefined) {
      updateFields.push('statut = ?');
      updateParams.push(data.statut);
    }
    
    if (data.annee_scolaire !== undefined) {
      updateFields.push('annee_scolaire = ?');
      updateParams.push(data.annee_scolaire);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }

    // Ajouter l'ID à la fin des paramètres
    updateParams.push(data.id);

    const updateSql = `UPDATE evaluations SET ${updateFields.join(', ')} WHERE id = ?`;
    
    console.log('📝 SQL UPDATE évaluation:', updateSql);
    console.log('📋 Paramètres:', updateParams);
    
    await query(updateSql, updateParams);

    // Récupérer l'évaluation mise à jour
    const getSql = `
      SELECT e.*, 
             m.nom as matiere_nom,
             c.nom as classe_nom,
             CONCAT(u.prenom, ' ', u.nom) as enseignant_nom,
             ens.matricule as enseignant_matricule
      FROM evaluations e
      LEFT JOIN matieres m ON e.matiere_id = m.id
      LEFT JOIN classes c ON e.classe_id = c.id
      LEFT JOIN enseignants ens ON e.enseignant_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id
      WHERE e.id = ?
    `;
    
    const [evaluation] = await query(getSql, [data.id]);

    return NextResponse.json({
      success: true,
      evaluation: evaluation,
      message: 'Évaluation mise à jour avec succès'
    });
  } catch (error: any) {
    console.error('❌ Erreur PUT évaluation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la mise à jour: ${error.message}` 
      },
      { status: 500 }
    );
  }
}