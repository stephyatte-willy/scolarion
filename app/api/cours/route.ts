import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour typer les résultats des requêtes
interface CoursRow {
  code_cours: string;
  nom_cours: string;
  description: string | null;
  professeur_id: number;
  classe_id: number;
  matiere_id: number | null;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle: string | null;
  couleur: string | null;
  statut: string;
  created_at?: string;
  updated_at?: string;
  professeur_nom?: string;
  classe_nom?: string;
  matiere_nom?: string;
}

interface EnseignantRow {
  id: number;
  user_id: number;
  nom?: string;
  prenom?: string;
}

interface ClasseRow {
  id: number;
  nom: string;
  niveau: string;
}

// GET: Récupérer tous les cours ou un cours spécifique
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codeCours = searchParams.get('code');
    
    // Si un code est spécifié, retourner un cours spécifique
    if (codeCours) {
      const sql = `
        SELECT 
          c.*,
          CONCAT(u.prenom, ' ', u.nom) as professeur_nom,
          cl.nom as classe_nom,
          mp.nom as matiere_nom,
          mp.code_matiere as matiere_code
        FROM cours c
        LEFT JOIN enseignants ens ON c.professeur_id = ens.id
        LEFT JOIN users u ON ens.user_id = u.id
        LEFT JOIN classes cl ON c.classe_id = cl.id
        LEFT JOIN matieres_primaire mp ON c.matiere_id = mp.id
        WHERE c.code_cours = ?
        ORDER BY 
          CASE c.jour_semaine 
            WHEN 'Lundi' THEN 1
            WHEN 'Mardi' THEN 2
            WHEN 'Mercredi' THEN 3
            WHEN 'Jeudi' THEN 4
            WHEN 'Vendredi' THEN 5
            WHEN 'Samedi' THEN 6
            ELSE 7
          END, 
          c.heure_debut
      `;
      const coursResult = await query(sql, [codeCours]) as CoursRow[];
      
      if (coursResult.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Cours non trouvé' 
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        cours: coursResult[0]
      });
    }
    
    // Sinon, retourner tous les cours avec filtres
    const statut = searchParams.get('statut');
    const classeId = searchParams.get('classe_id');
    const professeurId = searchParams.get('professeur_id');

    // Construire la requête SQL dynamiquement
    let sql = `
      SELECT 
        c.*,
        CONCAT(u.prenom, ' ', u.nom) as professeur_nom,
        cl.nom as classe_nom,
        mp.nom as matiere_nom,
        mp.code_matiere as matiere_code
      FROM cours c
      LEFT JOIN enseignants ens ON c.professeur_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id
      LEFT JOIN classes cl ON c.classe_id = cl.id
      LEFT JOIN matieres_primaire mp ON c.matiere_id = mp.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (statut && statut !== 'tous') {
      sql += ' AND c.statut = ?';
      params.push(statut);
    }

    if (classeId && classeId !== 'tous') {
      sql += ' AND c.classe_id = ?';
      params.push(parseInt(classeId));
    }

    if (professeurId && professeurId !== 'tous') {
      sql += ' AND c.professeur_id = ?';
      params.push(parseInt(professeurId));
    }

    // Ajouter le tri par jour et heure
    sql += ` ORDER BY 
      CASE c.jour_semaine 
        WHEN 'Lundi' THEN 1
        WHEN 'Mardi' THEN 2
        WHEN 'Mercredi' THEN 3
        WHEN 'Jeudi' THEN 4
        WHEN 'Vendredi' THEN 5
        WHEN 'Samedi' THEN 6
        ELSE 7
      END, 
      c.heure_debut`;

    console.log('📝 Requête SQL GET cours:', sql);
    console.log('🔧 Paramètres:', params);

    const coursResult = await query(sql, params) as CoursRow[];

    return NextResponse.json({
      success: true,
      cours: coursResult,
      total: coursResult.length
    });

  } catch (error: any) {
    console.error('❌ Erreur GET cours:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message || 'Erreur inconnue'}`,
        cours: []
      },
      { status: 500 }
    );
  }
}

// POST: Créer un nouveau cours
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📥 Données reçues pour création cours:', data);
    
    // Validation
    if (!data.code_cours || data.code_cours.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le code du cours est requis' 
        },
        { status: 400 }
      );
    }

    if (!data.nom_cours || data.nom_cours.trim() === '') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le nom du cours est requis' 
        },
        { status: 400 }
      );
    }

    if (!data.professeur_id || data.professeur_id === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Un professeur doit être sélectionné' 
        },
        { status: 400 }
      );
    }

    if (!data.classe_id || data.classe_id === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Une classe doit être sélectionnée' 
        },
        { status: 400 }
      );
    }

    if (!data.matiere_id || data.matiere_id === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Une matière doit être sélectionnée' 
        },
        { status: 400 }
      );
    }

    // Vérifier si le code existe déjà
    const checkSql = 'SELECT code_cours FROM cours WHERE code_cours = ?';
    const existing = await query(checkSql, [data.code_cours.trim()]) as any[];
    
    if (existing.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ce code cours existe déjà' 
        },
        { status: 400 }
      );
    }

    // Vérifier si la matière existe dans matieres_primaire
    const checkMatiereSql = 'SELECT id FROM matieres_primaire WHERE id = ?';
    const matiereExists = await query(checkMatiereSql, [data.matiere_id]) as any[];

    if (matiereExists.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La matière sélectionnée n\'existe pas' 
        },
        { status: 400 }
      );
    }

    // Vérifier si le professeur existe
    const checkProfesseurSql = 'SELECT id FROM enseignants WHERE id = ?';
    const professeurExists = await query(checkProfesseurSql, [data.professeur_id]) as any[];
    
    if (professeurExists.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le professeur sélectionné n\'existe pas' 
        },
        { status: 400 }
      );
    }

    // Vérifier si la classe existe
    const checkClasseSql = 'SELECT id FROM classes WHERE id = ?';
    const classeExists = await query(checkClasseSql, [data.classe_id]) as any[];
    
    if (classeExists.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La classe sélectionnée n\'existe pas' 
        },
        { status: 400 }
      );
    }

    // Vérifier les conflits d'horaire
    const conflitSql = `
      SELECT code_cours, nom_cours 
      FROM cours 
      WHERE classe_id = ? 
        AND jour_semaine = ? 
        AND (
          (heure_debut <= ? AND heure_fin > ?) OR
          (heure_debut < ? AND heure_fin >= ?) OR
          (heure_debut >= ? AND heure_fin <= ?)
        )
        AND statut = 'actif'
    `;
    
    const conflits = await query(conflitSql, [
      data.classe_id,
      data.jour_semaine,
      data.heure_debut, data.heure_debut,
      data.heure_fin, data.heure_fin,
      data.heure_debut, data.heure_fin
    ]) as any[];

    if (conflits.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Conflit d'horaire avec le cours: ${conflits[0].nom_cours} (${conflits[0].code_cours})`
        },
        { status: 400 }
      );
    }

    // Insérer le nouveau cours
    const insertSql = `
      INSERT INTO cours (
        code_cours, nom_cours, description, 
        professeur_id, classe_id, matiere_id,
        jour_semaine, heure_debut, heure_fin, 
        salle, couleur, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.code_cours.trim(),
      data.nom_cours.trim(),
      data.description || '',
      data.professeur_id,
      data.classe_id,
      data.matiere_id,
      data.jour_semaine,
      data.heure_debut,
      data.heure_fin,
      data.salle || '',
      data.couleur || '#3B82F6',
      data.statut || 'actif'
    ];

    console.log('📝 SQL INSERT cours:', insertSql);
    console.log('🔧 Paramètres:', params);

    await query(insertSql, params);

    // Récupérer le cours créé
    const getSql = 'SELECT * FROM cours WHERE code_cours = ?';
    const getResult = await query(getSql, [data.code_cours]) as any[];
    const nouveauCours = getResult[0];

    console.log('✅ Cours créé avec succès:', nouveauCours);

    return NextResponse.json({
      success: true,
      cours: nouveauCours,
      message: 'Cours créé avec succès'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Erreur POST cours:', error);
    
    // Vérifier si c'est une erreur de contrainte d'unicité
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ce code cours existe déjà' 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la création du cours: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}

// PUT: Mettre à jour un cours
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📥 Données reçues pour mise à jour cours:', data);
    
    // Utiliser ancien_code_cours pour identifier le cours à mettre à jour
    const ancienCode = data.ancien_code_cours || data.code_cours;
    
    if (!ancienCode) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le code du cours est requis pour la mise à jour' 
        },
        { status: 400 }
      );
    }

    // Vérifier que le cours existe
    const checkSql = 'SELECT * FROM cours WHERE code_cours = ?';
    const checkResult = await query(checkSql, [ancienCode]) as any[];
    
    if (checkResult.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cours non trouvé' 
        },
        { status: 404 }
      );
    }

    const existing = checkResult[0];

    // Si le code change, vérifier qu'il n'existe pas déjà
    if (data.code_cours && data.code_cours !== ancienCode) {
      const codeCheckSql = 'SELECT code_cours FROM cours WHERE code_cours = ? AND code_cours != ?';
      const codeExists = await query(codeCheckSql, [data.code_cours, ancienCode]) as any[];
      
      if (codeExists.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Ce code cours existe déjà' 
          },
          { status: 400 }
        );
      }
    }

    // Vérifier si la matière existe dans matieres_primaire
    if (data.matiere_id) {
  // ✅ CORRECTION : Supprimer la condition sur statut
  const checkMatiereSql = 'SELECT id FROM matieres_primaire WHERE id = ?';
  const matiereExists = await query(checkMatiereSql, [data.matiere_id]) as any[];
  
  if (matiereExists.length === 0) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'La matière sélectionnée n\'existe pas' 
      },
      { status: 400 }
    );
  }
}

    // Vérifier si le professeur existe
    if (data.professeur_id) {
      const checkProfesseurSql = 'SELECT id FROM enseignants WHERE id = ?';
      const professeurExists = await query(checkProfesseurSql, [data.professeur_id]) as any[];
      
      if (professeurExists.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Le professeur sélectionné n\'existe pas' 
          },
          { status: 400 }
        );
      }
    }

    // Vérifier si la classe existe
    if (data.classe_id) {
      const checkClasseSql = 'SELECT id FROM classes WHERE id = ?';
      const classeExists = await query(checkClasseSql, [data.classe_id]) as any[];
      
      if (classeExists.length === 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'La classe sélectionnée n\'existe pas' 
          },
          { status: 400 }
        );
      }
    }

    // Vérifier les conflits d'horaire (exclure le cours actuel)
    if (data.classe_id && data.jour_semaine && data.heure_debut && data.heure_fin) {
      const conflitSql = `
        SELECT code_cours, nom_cours 
        FROM cours 
        WHERE classe_id = ? 
          AND jour_semaine = ? 
          AND code_cours != ?
          AND (
            (heure_debut <= ? AND heure_fin > ?) OR
            (heure_debut < ? AND heure_fin >= ?) OR
            (heure_debut >= ? AND heure_fin <= ?)
          )
          AND statut = 'actif'
      `;
      
      const conflits = await query(conflitSql, [
        data.classe_id || existing.classe_id,
        data.jour_semaine || existing.jour_semaine,
        ancienCode,
        data.heure_debut || existing.heure_debut,
        data.heure_debut || existing.heure_debut,
        data.heure_fin || existing.heure_fin,
        data.heure_fin || existing.heure_fin,
        data.heure_debut || existing.heure_debut,
        data.heure_fin || existing.heure_fin
      ]) as any[];

      if (conflits.length > 0) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Conflit d'horaire avec le cours: ${conflits[0].nom_cours} (${conflits[0].code_cours})`
          },
          { status: 400 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData = {
      code_cours: data.code_cours || existing.code_cours,
      nom_cours: data.nom_cours || existing.nom_cours,
      description: data.description !== undefined ? data.description : existing.description,
      professeur_id: data.professeur_id || existing.professeur_id,
      classe_id: data.classe_id || existing.classe_id,
      matiere_id: data.matiere_id !== undefined ? data.matiere_id : existing.matiere_id,
      jour_semaine: data.jour_semaine || existing.jour_semaine,
      heure_debut: data.heure_debut || existing.heure_debut,
      heure_fin: data.heure_fin || existing.heure_fin,
      salle: data.salle !== undefined ? data.salle : existing.salle,
      couleur: data.couleur || existing.couleur,
      statut: data.statut || existing.statut
    };

    // Mettre à jour le cours
    const updateSql = `
      UPDATE cours 
      SET code_cours = ?, nom_cours = ?, description = ?, 
          professeur_id = ?, classe_id = ?, matiere_id = ?,
          jour_semaine = ?, heure_debut = ?, heure_fin = ?, 
          salle = ?, couleur = ?, statut = ?
      WHERE code_cours = ?
    `;
    
    const params = [
      updateData.code_cours,
      updateData.nom_cours,
      updateData.description,
      updateData.professeur_id,
      updateData.classe_id,
      updateData.matiere_id,
      updateData.jour_semaine,
      updateData.heure_debut,
      updateData.heure_fin,
      updateData.salle,
      updateData.couleur,
      updateData.statut,
      ancienCode
    ];

    console.log('📝 SQL UPDATE cours:', updateSql);
    console.log('🔧 Paramètres:', params);

    await query(updateSql, params);

    // Récupérer le cours mis à jour
    const getSql = 'SELECT * FROM cours WHERE code_cours = ?';
    const getResult = await query(getSql, [updateData.code_cours]) as any[];
    const coursMisAJour = getResult[0];

    console.log('✅ Cours mis à jour:', coursMisAJour);

    return NextResponse.json({
      success: true,
      cours: coursMisAJour,
      message: 'Cours mis à jour avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur PUT cours:', error);
    
    // Vérifier si c'est une erreur de contrainte d'unicité
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ce code cours existe déjà' 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la mise à jour du cours: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}

// DELETE: Supprimer un cours
export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const { code_cours } = data;
    
    console.log('📥 Demande de suppression cours:', code_cours);
    
    if (!code_cours) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le code du cours est requis pour la suppression' 
        },
        { status: 400 }
      );
    }

    // Vérifier que le cours existe
    const checkSql = 'SELECT * FROM cours WHERE code_cours = ?';
    const checkResult = await query(checkSql, [code_cours]) as any[];
    
    if (checkResult.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cours non trouvé' 
        },
        { status: 404 }
      );
    }

    // Supprimer le cours
    const deleteSql = 'DELETE FROM cours WHERE code_cours = ?';
    
    console.log('📝 SQL DELETE cours:', deleteSql);
    console.log('🔧 Paramètres:', [code_cours]);

    await query(deleteSql, [code_cours]);

    console.log('✅ Cours supprimé avec succès:', code_cours);

    return NextResponse.json({
      success: true,
      message: 'Cours supprimé avec succès',
      cours: checkResult[0]
    });

  } catch (error: any) {
    console.error('❌ Erreur DELETE cours:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la suppression du cours: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}

// PATCH: Mettre à jour partiellement un cours
export async function PATCH(request: NextRequest) {
  try {
    const data = await request.json();
    const { code_cours } = data;
    
    if (!code_cours) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le code du cours est requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier que le cours existe
    const checkSql = 'SELECT * FROM cours WHERE code_cours = ?';
    const checkResult = await query(checkSql, [code_cours]) as any[];
    
    if (checkResult.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cours non trouvé' 
        },
        { status: 404 }
      );
    }

    // Préparer les champs à mettre à jour
    const updates: string[] = [];
    const params: any[] = [];
    
    const fields = ['nom_cours', 'description', 'professeur_id', 'classe_id', 'matiere_id', 
                   'jour_semaine', 'heure_debut', 'heure_fin', 'salle', 'couleur', 'statut'];
    
    fields.forEach(field => {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    });
    
    if (updates.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Aucune donnée à mettre à jour' 
        },
        { status: 400 }
      );
    }
    
    params.push(code_cours);
    
    const updateSql = `UPDATE cours SET ${updates.join(', ')} WHERE code_cours = ?`;
    
    console.log('📝 SQL PATCH cours:', updateSql);
    console.log('🔧 Paramètres:', params);

    await query(updateSql, params);

    // Récupérer le cours mis à jour
    const getSql = 'SELECT * FROM cours WHERE code_cours = ?';
    const getResult = await query(getSql, [code_cours]) as any[];
    const coursMisAJour = getResult[0];

    return NextResponse.json({
      success: true,
      cours: coursMisAJour,
      message: 'Cours mis à jour partiellement avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur PATCH cours:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la mise à jour partielle du cours: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}