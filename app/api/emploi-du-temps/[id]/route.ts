import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface corrigée avec Promise
interface Params {
  params: Promise<{
    id: string;
  }>;
}

// GET: Récupérer un créneau spécifique par son ID
export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Récupération asynchrone de l'ID
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID invalide'
      }, { status: 400 });
    }

    console.log(`📡 GET /api/emploi-du-temps/${id} appelé`);

    const sql = `
      SELECT 
        e.*,
        c.nom_cours,
        c.description as cours_description,
        c.statut as cours_statut,
        cl.nom as classe_nom,
        cl.niveau,
        CONCAT(u.prenom, ' ', u.nom) as professeur_nom,
        u.email as professeur_email
      FROM emploi_du_temps e
      LEFT JOIN cours c ON e.code_cours = c.code_cours
      LEFT JOIN classes cl ON e.classe_id = cl.id
      LEFT JOIN enseignants ens ON e.professeur_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id
      WHERE e.id = ?
    `;
    
    const result = await query(sql, [id]) as any[];
    const creneau = result[0];

    if (!creneau) {
      return NextResponse.json({
        success: false,
        error: 'Créneau non trouvé'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      creneau: creneau,
      message: 'Créneau récupéré avec succès'
    });

  } catch (error: any) {
    console.error('❌ ERREUR dans GET /api/emploi-du-temps/[id]:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur: ' + (error.message || 'Erreur inconnue')
      },
      { status: 500 }
    );
  }
}

// PUT: Mettre à jour un créneau spécifique
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    // Récupération asynchrone de l'ID
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID invalide'
      }, { status: 400 });
    }

    const data = await request.json();
    console.log(`📦 PUT /api/emploi-du-temps/${id} données:`, data);

    // Vérifier si le créneau existe
    const checkSql = 'SELECT id FROM emploi_du_temps WHERE id = ?';
    const checkResult = await query(checkSql, [id]) as any[];
    
    if (checkResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Créneau non trouvé'
      }, { status: 404 });
    }

    // ⚠️ RENOMMÉ: "sqlParams" au lieu de "params" pour éviter le conflit
    const sqlParams = [
      data.code_cours || null,
      data.classe_id,
      data.professeur_id,
      data.jour_semaine,
      data.heure_debut,
      data.heure_fin,
      data.salle || '',
      data.type_creneau || 'cours',
      data.description || '',
      data.couleur || '#3B82F6',
      id
    ];

    const sql = `
      UPDATE emploi_du_temps 
      SET code_cours = ?, classe_id = ?, professeur_id = ?, jour_semaine = ?, 
          heure_debut = ?, heure_fin = ?, salle = ?, type_creneau = ?, 
          description = ?, couleur = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    await query(sql, sqlParams); // ✅ Utilisation de sqlParams
    
    // Récupérer le créneau mis à jour
    const getSql = `
      SELECT 
        e.*,
        c.nom_cours,
        c.description as cours_description,
        cl.nom as classe_nom,
        cl.niveau,
        CONCAT(u.prenom, ' ', u.nom) as professeur_nom,
        u.email as professeur_email
      FROM emploi_du_temps e
      LEFT JOIN cours c ON e.code_cours = c.code_cours
      LEFT JOIN classes cl ON e.classe_id = cl.id
      LEFT JOIN enseignants ens ON e.professeur_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id
      WHERE e.id = ?
    `;
    
    const getResult = await query(getSql, [id]) as any[];
    const creneauMisAJour = getResult[0];

    return NextResponse.json({
      success: true,
      creneau: creneauMisAJour,
      message: 'Créneau modifié avec succès'
    });

  } catch (error: any) {
    console.error('❌ ERREUR dans PUT /api/emploi-du-temps/[id]:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur lors de la modification du créneau'
    }, {
      status: 500
    });
  }
}

// DELETE: Supprimer un créneau spécifique
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID invalide'
      }, { status: 400 });
    }

    console.log(`🗑️ DELETE /api/emploi-du-temps/${id} appelé`);

    const getSql = 'SELECT * FROM emploi_du_temps WHERE id = ?';
    const getResult = await query(getSql, [id]) as any[];
    const creneau = getResult[0];

    if (!creneau) {
      return NextResponse.json({
        success: false,
        error: 'Créneau non trouvé'
      }, { status: 404 });
    }

    const deleteSql = 'DELETE FROM emploi_du_temps WHERE id = ?';
    await query(deleteSql, [id]);

    return NextResponse.json({
      success: true,
      message: 'Créneau supprimé avec succès',
      creneau: creneau
    });

  } catch (error: any) {
    console.error('❌ ERREUR dans DELETE /api/emploi-du-temps/[id]:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur lors de la suppression du créneau'
    }, {
      status: 500
    });
  }
}

// PATCH: Mettre à jour partiellement un créneau
export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    
    if (isNaN(id)) {
      return NextResponse.json({
        success: false,
        error: 'ID invalide'
      }, { status: 400 });
    }

    const data = await request.json();
    console.log(`📦 PATCH /api/emploi-du-temps/${id} données partielles:`, data);

    const checkSql = 'SELECT id FROM emploi_du_temps WHERE id = ?';
    const checkResult = await query(checkSql, [id]) as any[];
    
    if (checkResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Créneau non trouvé'
      }, { status: 404 });
    }

    // Construire dynamiquement la requête UPDATE
    const fields: string[] = [];
    const sqlValues: any[] = [];

    if (data.code_cours !== undefined) {
      fields.push('code_cours = ?');
      sqlValues.push(data.code_cours || null);
    }
    if (data.classe_id !== undefined) {
      fields.push('classe_id = ?');
      sqlValues.push(data.classe_id);
    }
    if (data.professeur_id !== undefined) {
      fields.push('professeur_id = ?');
      sqlValues.push(data.professeur_id);
    }
    if (data.jour_semaine !== undefined) {
      fields.push('jour_semaine = ?');
      sqlValues.push(data.jour_semaine);
    }
    if (data.heure_debut !== undefined) {
      fields.push('heure_debut = ?');
      sqlValues.push(data.heure_debut);
    }
    if (data.heure_fin !== undefined) {
      fields.push('heure_fin = ?');
      sqlValues.push(data.heure_fin);
    }
    if (data.salle !== undefined) {
      fields.push('salle = ?');
      sqlValues.push(data.salle);
    }
    if (data.type_creneau !== undefined) {
      fields.push('type_creneau = ?');
      sqlValues.push(data.type_creneau);
    }
    if (data.description !== undefined) {
      fields.push('description = ?');
      sqlValues.push(data.description);
    }
    if (data.couleur !== undefined) {
      fields.push('couleur = ?');
      sqlValues.push(data.couleur);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');

    if (fields.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Aucun champ à mettre à jour'
      }, { status: 400 });
    }

    sqlValues.push(id);

    const sql = `UPDATE emploi_du_temps SET ${fields.join(', ')} WHERE id = ?`;
    await query(sql, sqlValues);

    // Récupérer le créneau mis à jour
    const getSql = `
      SELECT 
        e.*,
        c.nom_cours,
        c.description as cours_description,
        cl.nom as classe_nom,
        cl.niveau,
        CONCAT(u.prenom, ' ', u.nom) as professeur_nom,
        u.email as professeur_email
      FROM emploi_du_temps e
      LEFT JOIN cours c ON e.code_cours = c.code_cours
      LEFT JOIN classes cl ON e.classe_id = cl.id
      LEFT JOIN enseignants ens ON e.professeur_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id
      WHERE e.id = ?
    `;
    
    const getResult = await query(getSql, [id]) as any[];
    const creneauMisAJour = getResult[0];

    return NextResponse.json({
      success: true,
      creneau: creneauMisAJour,
      message: 'Créneau mis à jour partiellement avec succès'
    });

  } catch (error: any) {
    console.error('❌ ERREUR dans PATCH /api/emploi-du-temps/[id]:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur lors de la mise à jour partielle du créneau'
    }, {
      status: 500
    });
  }
}
