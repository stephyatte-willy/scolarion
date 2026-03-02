// app/api/emploi-du-temps/route.ts (CORRIGÉ)
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// GET: Récupérer l'emploi du temps avec les cours
export async function GET(request: NextRequest) {
  try {
    console.log('📡 GET /api/emploi-du-temps appelé');
    
    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get('classe_id');
    const professeurId = searchParams.get('professeur_id');
    const includeCours = searchParams.get('include_cours') === 'true';

    // CORRECTION : Utiliser la table users pour récupérer nom et prénom
    let sql = `
      SELECT 
        e.*,
        c.nom_cours,
        c.description as cours_description,
        c.statut as cours_statut,
        cl.nom as classe_nom,
        cl.niveau,
        CONCAT(u.prenom, ' ', u.nom) as professeur_nom, -- CORRECTION ICI
        u.email as professeur_email
      FROM emploi_du_temps e
      LEFT JOIN cours c ON e.code_cours = c.code_cours
      LEFT JOIN classes cl ON e.classe_id = cl.id
      LEFT JOIN enseignants ens ON e.professeur_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id -- CORRECTION ICI : Joindre users via enseignants
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (classeId && classeId !== 'null' && classeId !== '') {
      sql += ' AND e.classe_id = ?';
      params.push(parseInt(classeId));
    }

    if (professeurId && professeurId !== 'null' && professeurId !== '') {
      sql += ' AND e.professeur_id = ?';
      params.push(parseInt(professeurId));
    }

    sql += ` ORDER BY 
      CASE e.jour_semaine 
        WHEN 'Lundi' THEN 1
        WHEN 'Mardi' THEN 2
        WHEN 'Mercredi' THEN 3
        WHEN 'Jeudi' THEN 4
        WHEN 'Vendredi' THEN 5
        WHEN 'Samedi' THEN 6
        ELSE 7
      END, 
      e.heure_debut`;

    console.log('SQL final:', sql);
    
    const emploi = await query(sql, params);
    
    console.log('✅ Données récupérées:', Array.isArray(emploi) ? emploi.length : '0');

    return NextResponse.json({
      success: true,
      emploiDuTemps: emploi || [],
      total: Array.isArray(emploi) ? emploi.length : 0,
      message: 'Emploi du temps récupéré avec succès'
    });

  } catch (error: any) {
    console.error('❌ ERREUR dans GET /api/emploi-du-temps:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur serveur: ' + (error.message || 'Erreur inconnue'),
        emploiDuTemps: [],
        total: 0
      },
      { status: 500 }
    );
  }
}

// POST: Créer un nouveau créneau
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log('📦 POST données:', data);

    const sql = `
      INSERT INTO emploi_du_temps 
      (code_cours, classe_id, professeur_id, jour_semaine, heure_debut, heure_fin, salle, type_creneau, description, couleur)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.code_cours || null,
      data.classe_id,
      data.professeur_id,
      data.jour_semaine,
      data.heure_debut,
      data.heure_fin,
      data.salle || '',
      data.type_creneau || 'cours',
      data.description || '',
      data.couleur || '#3B82F6'
    ];

    const result = await query(sql, params);
    const id = (result as any).insertId;

    // CORRECTION : Requête pour récupérer le créneau créé avec les bonnes jointures
    const getSql = `
      SELECT e.*, 
             c.nom_cours,
             cl.nom as classe_nom,
             CONCAT(u.prenom, ' ', u.nom) as professeur_nom -- CORRECTION ICI
      FROM emploi_du_temps e
      LEFT JOIN cours c ON e.code_cours = c.code_cours
      LEFT JOIN classes cl ON e.classe_id = cl.id
      LEFT JOIN enseignants ens ON e.professeur_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id -- CORRECTION ICI
      WHERE e.id = ?
    `;
    
    const [nouveauCreneau] = await query(getSql, [id]);

    return NextResponse.json({
      success: true,
      creneau: nouveauCreneau,
      message: 'Créneau ajouté'
    }, {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur POST:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

// PUT: Mettre à jour un créneau
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID requis'
      }, { status: 400 });
    }

    const sql = `
      UPDATE emploi_du_temps 
      SET code_cours = ?, classe_id = ?, professeur_id = ?, jour_semaine = ?, 
          heure_debut = ?, heure_fin = ?, salle = ?, type_creneau = ?, 
          description = ?, couleur = ?
      WHERE id = ?
    `;
    
    const params = [
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

    await query(sql, params);
    
    // CORRECTION : Requête avec les bonnes jointures
    const getSql = `
      SELECT e.*, 
             c.nom_cours,
             cl.nom as classe_nom,
             CONCAT(u.prenom, ' ', u.nom) as professeur_nom -- CORRECTION ICI
      FROM emploi_du_temps e
      LEFT JOIN cours c ON e.code_cours = c.code_cours
      LEFT JOIN classes cl ON e.classe_id = cl.id
      LEFT JOIN enseignants ens ON e.professeur_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id -- CORRECTION ICI
      WHERE e.id = ?
    `;
    
    const [creneauMisAJour] = await query(getSql, [id]);

    return NextResponse.json({
      success: true,
      creneau: creneauMisAJour,
      message: 'Créneau modifié'
    });

  } catch (error: any) {
    console.error('❌ Erreur PUT:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, {
      status: 500
    });
  }
}

// DELETE: Supprimer un créneau
export async function DELETE(request: NextRequest) {
  try {
    const data = await request.json();
    const { id } = data;

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'ID requis'
      }, { status: 400 });
    }

    const [creneau] = await query('SELECT * FROM emploi_du_temps WHERE id = ?', [id]);
    await query('DELETE FROM emploi_du_temps WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Créneau supprimé',
      creneau: creneau
    });

  } catch (error: any) {
    console.error('❌ Erreur DELETE:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, {
      status: 500
    });
  }
}