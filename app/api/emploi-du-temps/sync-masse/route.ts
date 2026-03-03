// app/api/emploi-du-temps/sync-masse/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interfaces pour le typage
interface Cours {
  code_cours: string;
  classe_id: number;
  professeur_id: number;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle?: string;
  couleur?: string;
  nom_cours?: string;
  description?: string;
  professeur_nom?: string;
  classe_nom?: string;
  [key: string]: any;
}

interface EmploiDuTemps {
  id: number;
  code_cours: string;
  classe_id: number;
  professeur_id: number;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle?: string;
  couleur?: string;
  [key: string]: any;
}

interface CountResult {
  count: number;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { classe_id, professeur_id, action = 'sync' } = data;
    
    console.log('🔄 Synchronisation en masse démarrée', { classe_id, professeur_id, action });
    
    // Construire les conditions WHERE
    const whereConditions: string[] = [];
    const params: any[] = [];
    
    if (classe_id && classe_id !== 'tous' && classe_id !== 'null' && classe_id !== 'undefined') {
      whereConditions.push('c.classe_id = ?');
      params.push(parseInt(classe_id));
    }
    
    if (professeur_id && professeur_id !== 'tous' && professeur_id !== 'null' && professeur_id !== 'undefined') {
      whereConditions.push('c.professeur_id = ?');
      params.push(parseInt(professeur_id));
    }
    
    const whereClause = whereConditions.length > 0 
      ? `AND ${whereConditions.join(' AND ')}` 
      : '';
    
    // 1. Récupérer tous les cours actifs
    const sqlCours = `
      SELECT c.*, 
             CONCAT(u.prenom, ' ', u.nom) as professeur_nom,
             cl.nom as classe_nom
      FROM cours c
      LEFT JOIN enseignants ens ON c.professeur_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id
      LEFT JOIN classes cl ON c.classe_id = cl.id
      WHERE c.statut = 'actif'
      ${whereClause}
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
    
    console.log('📝 SQL cours:', sqlCours);
    console.log('🔧 Paramètres:', params);
    
    // ✅ Casting explicite en tableau de Cours
    const coursResult = await query(sqlCours, params) as any[];
    const coursList = Array.isArray(coursResult) ? coursResult : [];
    console.log(`📚 ${coursList.length} cours trouvés pour synchronisation`);
    
    if (coursList.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Aucun cours à synchroniser',
        stats: {
          ajoutes: 0,
          mis_a_jour: 0,
          erreurs: 0,
          total: 0
        }
      }, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }
    
    const stats = {
      ajoutes: 0,
      mis_a_jour: 0,
      erreurs: 0,
      details: [] as any[]
    };
    
    // 2. Synchroniser chaque cours
    for (const cours of coursList) {
      try {
        // Vérifier si le cours existe déjà dans l'emploi du temps
        const checkSql = `
          SELECT id FROM emploi_du_temps 
          WHERE code_cours = ? 
          AND classe_id = ? 
          AND professeur_id = ?
        `;
        
        const existingResult = await query(checkSql, [
          cours.code_cours,
          cours.classe_id,
          cours.professeur_id
        ]) as EmploiDuTemps[];
        
        const existing = Array.isArray(existingResult) ? existingResult : [];
        
        if (existing.length > 0) {
          // Mettre à jour le créneau existant
          const updateSql = `
            UPDATE emploi_du_temps 
            SET jour_semaine = ?, 
                heure_debut = ?, 
                heure_fin = ?, 
                salle = ?, 
                couleur = ?, 
                description = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `;
          
          await query(updateSql, [
            cours.jour_semaine,
            cours.heure_debut,
            cours.heure_fin,
            cours.salle || '',
            cours.couleur || '#3B82F6',
            cours.description || cours.nom_cours,
            existing[0].id
          ]);
          
          stats.mis_a_jour++;
          stats.details.push({
            code_cours: cours.code_cours,
            action: 'updated',
            emploi_id: existing[0].id
          });
          
          console.log(`✅ Cours mis à jour: ${cours.code_cours}`);
          
        } else {
          // Ajouter un nouveau créneau
          const insertSql = `
            INSERT INTO emploi_du_temps 
            (code_cours, classe_id, professeur_id, jour_semaine, 
             heure_debut, heure_fin, salle, type_creneau, description, couleur)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'cours', ?, ?)
          `;
          
          const result = await query(insertSql, [
            cours.code_cours,
            cours.classe_id,
            cours.professeur_id,
            cours.jour_semaine,
            cours.heure_debut,
            cours.heure_fin,
            cours.salle || '',
            cours.description || cours.nom_cours,
            cours.couleur || '#3B82F6'
          ]) as any;
          
          stats.ajoutes++;
          stats.details.push({
            code_cours: cours.code_cours,
            action: 'added',
            emploi_id: result?.insertId
          });
          
          console.log(`✅ Cours ajouté: ${cours.code_cours}`);
        }
        
      } catch (error: any) {
        stats.erreurs++;
        stats.details.push({
          code_cours: cours.code_cours,
          action: 'error',
          error: error.message
        });
        
        console.error(`❌ Erreur synchronisation cours ${cours.code_cours}:`, error.message);
      }
    }
    
    // 3. Construire la requête pour récupérer l'emploi du temps mis à jour
    const emploiWhereConditions: string[] = [];
    const emploiParams: any[] = [];
    
    if (classe_id && classe_id !== 'tous' && classe_id !== 'null' && classe_id !== 'undefined') {
      emploiWhereConditions.push('e.classe_id = ?');
      emploiParams.push(parseInt(classe_id));
    }
    
    if (professeur_id && professeur_id !== 'tous' && professeur_id !== 'null' && professeur_id !== 'undefined') {
      emploiWhereConditions.push('e.professeur_id = ?');
      emploiParams.push(parseInt(professeur_id));
    }
    
    const emploiWhereClause = emploiWhereConditions.length > 0 
      ? `AND ${emploiWhereConditions.join(' AND ')}` 
      : '';
    
    const emploiSql = `
      SELECT e.*, 
             c.nom_cours,
             cl.nom as classe_nom,
             CONCAT(u.prenom, ' ', u.nom) as professeur_nom
      FROM emploi_du_temps e
      LEFT JOIN cours c ON e.code_cours = c.code_cours
      LEFT JOIN classes cl ON e.classe_id = cl.id
      LEFT JOIN enseignants ens ON e.professeur_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id
      WHERE 1=1
      ${emploiWhereClause}
      ORDER BY 
        CASE e.jour_semaine 
          WHEN 'Lundi' THEN 1
          WHEN 'Mardi' THEN 2
          WHEN 'Mercredi' THEN 3
          WHEN 'Jeudi' THEN 4
          WHEN 'Vendredi' THEN 5
          WHEN 'Samedi' THEN 6
          ELSE 7
        END, 
        e.heure_debut
    `;
    
    const emploiResult = await query(emploiSql, emploiParams) as any[];
    const emploiMisAJour = Array.isArray(emploiResult) ? emploiResult : [];
    
    console.log('🔄 Synchronisation terminée avec succès');
    
    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée: ${stats.ajoutes} cours ajoutés, ${stats.mis_a_jour} cours mis à jour, ${stats.erreurs} erreurs`,
      stats: stats,
      emploi_du_temps: emploiMisAJour,
      total: emploiMisAJour.length
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur synchronisation en masse:', error);
    
    return NextResponse.json({
      success: false,
      error: `Erreur lors de la synchronisation: ${error.message || 'Erreur inconnue'}`
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/emploi-du-temps/sync-masse');
    
    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get('classe_id');
    const professeurId = searchParams.get('professeur_id');
    
    // Construire les conditions
    const whereConditions: string[] = [];
    const params: any[] = [];
    
    if (classeId && classeId !== 'tous' && classeId !== 'null' && classeId !== 'undefined') {
      whereConditions.push('c.classe_id = ?');
      params.push(parseInt(classeId));
    }
    
    if (professeurId && professeurId !== 'tous' && professeurId !== 'null' && professeurId !== 'undefined') {
      whereConditions.push('c.professeur_id = ?');
      params.push(parseInt(professeurId));
    }
    
    const whereClause = whereConditions.length > 0 
      ? `AND ${whereConditions.join(' AND ')}` 
      : '';
    
    // Compter les cours non synchronisés
    const sqlCount = `
      SELECT COUNT(*) as count
      FROM cours c
      WHERE c.statut = 'actif'
      AND NOT EXISTS (
        SELECT 1 FROM emploi_du_temps e 
        WHERE e.code_cours = c.code_cours
        AND e.classe_id = c.classe_id
        AND e.professeur_id = c.professeur_id
      )
      ${whereClause}
    `;
    
    const countResult = await query(sqlCount, params) as CountResult[];
    const count = Array.isArray(countResult) && countResult.length > 0 
      ? countResult[0]?.count || 0 
      : 0;
    
    return NextResponse.json({
      success: true,
      cours_non_synchronises: count,
      message: count > 0 
        ? `${count} cours ne sont pas dans l'emploi du temps`
        : 'Tous les cours sont synchronisés'
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur vérification synchronisation:', error);
    
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
