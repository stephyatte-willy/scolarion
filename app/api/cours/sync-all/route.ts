// app/api/emploi-du-temps/sync-all/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour le type Cours
interface Cours {
  id: number;
  code_cours: string;
  nom_cours: string;
  classe_id: number;
  professeur_id: number;
  professeur_nom: string;
  classe_nom: string;
  jour_semaine: string;
  heure_debut: string;
  heure_fin: string;
  salle: string;
  description: string;
  couleur: string;
  statut: string;
  [key: string]: any;
}

// POST: Synchroniser tous les cours actifs vers l'emploi du temps
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { classe_id, professeur_id, action = 'sync' } = data;
    
    console.log(`🔄 Synchronisation en masse - Action: ${action}`);
    
    // Récupérer tous les cours actifs
    let coursSql = `
      SELECT c.*, 
             CONCAT(e.prenom, ' ', e.nom) as professeur_nom,
             cl.nom as classe_nom
      FROM cours c
      LEFT JOIN enseignants e ON c.professeur_id = e.id
      LEFT JOIN classes cl ON c.classe_id = cl.id
      WHERE c.statut = 'actif'
    `;
    
    const params: any[] = [];
    
    if (classe_id && classe_id !== 'tous') {
      coursSql += ' AND c.classe_id = ?';
      params.push(parseInt(classe_id));
    }
    
    if (professeur_id && professeur_id !== 'tous') {
      coursSql += ' AND c.professeur_id = ?';
      params.push(parseInt(professeur_id));
    }
    
    coursSql += ' ORDER BY c.code_cours';
    
    // ✅ Solution 1: Typer le résultat comme un tableau de Cours
    const coursResult = await query(coursSql, params) as any[];
    
    // ✅ Vérifier que c'est bien un tableau
    const coursList = Array.isArray(coursResult) ? coursResult : [];
    
    console.log(`📚 Cours trouvés: ${coursList.length}`);
    
    const results = {
      added: 0,
      updated: 0,
      removed: 0,
      skipped: 0,
      errors: [] as { code_cours: string; error: string }[]
    };
    
    if (action === 'sync' || action === 'add') {
      // Synchroniser/ajouter tous les cours
      for (const cours of coursList) {
        try {
          // Vérifier si existe déjà
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
          ]) as any[];
          
          const existing = Array.isArray(existingResult) ? existingResult : [];
          
          if (existing.length > 0) {
            // Mettre à jour
            const updateSql = `
              UPDATE emploi_du_temps 
              SET jour_semaine = ?, heure_debut = ?, heure_fin = ?, 
                  salle = ?, couleur = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `;
            
            await query(updateSql, [
              cours.jour_semaine,
              cours.heure_debut,
              cours.heure_fin,
              cours.salle || '',
              cours.couleur || '#3B82F6',
              existing[0].id
            ]);
            
            results.updated++;
          } else {
            // Ajouter
            const insertSql = `
              INSERT INTO emploi_du_temps 
              (code_cours, classe_id, professeur_id, jour_semaine, 
               heure_debut, heure_fin, salle, type_creneau, description, couleur)
              VALUES (?, ?, ?, ?, ?, ?, ?, 'cours', ?, ?)
            `;
            
            await query(insertSql, [
              cours.code_cours,
              cours.classe_id,
              cours.professeur_id,
              cours.jour_semaine,
              cours.heure_debut,
              cours.heure_fin,
              cours.salle || '',
              cours.description || cours.nom_cours,
              cours.couleur || '#3B82F6'
            ]);
            
            results.added++;
          }
          
        } catch (error: any) {
          results.errors.push({
            code_cours: cours.code_cours,
            error: error.message
          });
          results.skipped++;
        }
      }
      
    } else if (action === 'remove') {
      // Retirer tous les cours
      for (const cours of coursList) {
        try {
          const deleteSql = `
            DELETE FROM emploi_du_temps 
            WHERE code_cours = ? 
            AND classe_id = ? 
            AND professeur_id = ?
          `;
          
          await query(deleteSql, [
            cours.code_cours,
            cours.classe_id,
            cours.professeur_id
          ]);
          
          results.removed++;
          
        } catch (error: any) {
          results.errors.push({
            code_cours: cours.code_cours,
            error: error.message
          });
          results.skipped++;
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée: ${results.added} ajoutés, ${results.updated} mis à jour, ${results.removed} retirés, ${results.skipped} ignorés`,
      results: results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('❌ Erreur synchronisation en masse:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la synchronisation en masse: ${error.message || 'Erreur inconnue'}`,
        results: null
      },
      { status: 500 }
    );
  }
}
