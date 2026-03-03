// app/api/cours/sync/route.ts (CORRIGÉ)
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour typer les résultats
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

// POST: Synchroniser un cours vers l'emploi du temps
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { code_cours, action = 'add' } = data;
    
    console.log(`🔄 Synchronisation cours ${code_cours} - Action: ${action}`);
    
    if (!code_cours) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le code du cours est requis' 
        },
        { status: 400 }
      );
    }
    
    // CORRECTION : Typer le résultat comme un tableau
    const coursSql = `
      SELECT c.*, 
             CONCAT(u.prenom, ' ', u.nom) as professeur_nom,
             cl.nom as classe_nom
      FROM cours c
      LEFT JOIN enseignants ens ON c.professeur_id = ens.id
      LEFT JOIN users u ON ens.user_id = u.id
      LEFT JOIN classes cl ON c.classe_id = cl.id
      WHERE c.code_cours = ?
    `;
    
    const coursData = await query(coursSql, [code_cours]) as Cours[];
    
    // ✅ Vérifier que c'est bien un tableau
    if (!Array.isArray(coursData) || coursData.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cours non trouvé' 
        },
        { status: 404 }
      );
    }
    
    const cours = coursData[0];
    
    if (action === 'add' || action === 'update') {
      // Vérifier si le cours existe déjà dans l'emploi du temps
      const checkEmploiSql = `
        SELECT id FROM emploi_du_temps 
        WHERE code_cours = ? 
        AND classe_id = ? 
        AND professeur_id = ?
        AND jour_semaine = ?
      `;
      
      const existingEmploi = await query(checkEmploiSql, [
        cours.code_cours,
        cours.classe_id,
        cours.professeur_id,
        cours.jour_semaine
      ]) as EmploiDuTemps[];
      
      // ✅ Vérifier que c'est un tableau
      const existing = Array.isArray(existingEmploi) ? existingEmploi : [];
      
      if (existing.length > 0) {
        // Mettre à jour le créneau existant
        const updateSql = `
          UPDATE emploi_du_temps 
          SET heure_debut = ?, heure_fin = ?, salle = ?, 
              couleur = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        
        await query(updateSql, [
          cours.heure_debut,
          cours.heure_fin,
          cours.salle || '',
          cours.couleur || '#3B82F6',
          existing[0].id
        ]);
        
        console.log('✅ Créneau emploi du temps mis à jour');
        
      } else {
        // Créer un nouveau créneau dans l'emploi du temps
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
        
        console.log('✅ Créneau ajouté à l\'emploi du temps');
      }
      
      // Récupérer l'emploi du temps mis à jour
      const getEmploiSql = `
        SELECT e.*, 
               c.nom_cours,
               cl.nom as classe_nom,
               CONCAT(u.prenom, ' ', u.nom) as professeur_nom
        FROM emploi_du_temps e
        LEFT JOIN cours c ON e.code_cours = c.code_cours
        LEFT JOIN classes cl ON e.classe_id = cl.id
        LEFT JOIN enseignants ens ON e.professeur_id = ens.id
        LEFT JOIN users u ON ens.user_id = u.id
        WHERE e.code_cours = ?
        AND e.classe_id = ?
        AND e.professeur_id = ?
      `;
      
      const emploiSync = await query(getEmploiSql, [
        cours.code_cours,
        cours.classe_id,
        cours.professeur_id
      ]) as EmploiDuTemps[];
      
      return NextResponse.json({
        success: true,
        message: 'Cours synchronisé avec l\'emploi du temps',
        cours: cours,
        emploiDuTemps: Array.isArray(emploiSync) ? emploiSync : [],
        action: existing.length > 0 ? 'updated' : 'added'
      });
      
    } else if (action === 'remove') {
      // Supprimer de l'emploi du temps
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
      
      console.log('✅ Créneau retiré de l\'emploi du temps');
      
      return NextResponse.json({
        success: true,
        message: 'Cours retiré de l\'emploi du temps',
        cours: cours
      });
      
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Action non reconnue. Utilisez: add, update, remove' 
        },
        { status: 400 }
      );
    }
    
  } catch (error: any) {
    console.error('❌ Erreur synchronisation:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la synchronisation: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}

// GET: Vérifier l'état de synchronisation d'un cours
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codeCours = searchParams.get('code_cours');
    
    if (!codeCours) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Le code du cours est requis' 
        },
        { status: 400 }
      );
    }
    
    // Récupérer le cours
    const coursSql = 'SELECT * FROM cours WHERE code_cours = ?';
    const coursData = await query(coursSql, [codeCours]) as Cours[];
    
    // ✅ Vérifier que c'est bien un tableau
    if (!Array.isArray(coursData) || coursData.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cours non trouvé' 
        },
        { status: 404 }
      );
    }
    
    const cours = coursData[0];
    
    // Vérifier dans l'emploi du temps
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
      WHERE e.code_cours = ?
      AND e.classe_id = ?
      AND e.professeur_id = ?
    `;
    
    const emploiData = await query(emploiSql, [
      cours.code_cours,
      cours.classe_id,
      cours.professeur_id
    ]) as EmploiDuTemps[];
    
    const isSynced = Array.isArray(emploiData) && emploiData.length > 0;
    const syncDetails = isSynced ? {
      emploi_id: emploiData[0].id,
      heure_debut_match: emploiData[0].heure_debut === cours.heure_debut,
      heure_fin_match: emploiData[0].heure_fin === cours.heure_fin,
      salle_match: emploiData[0].salle === cours.salle,
      last_sync: emploiData[0].updated_at
    } : null;
    
    return NextResponse.json({
      success: true,
      cours: cours,
      isSynced: isSynced,
      syncDetails: syncDetails,
      emploiDuTemps: Array.isArray(emploiData) ? emploiData : []
    });
    
  } catch (error: any) {
    console.error('❌ Erreur vérification synchronisation:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la vérification: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}
