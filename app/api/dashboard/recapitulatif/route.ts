import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour les résultats de comptage
interface CountResult {
  total: number;
}

export async function GET() {
  try {
    // Exécuter les requêtes en parallèle avec typage explicite
    const [
      inscriptionsResult,
      paiementsResult,
      recettesResult,
      absencesResult,
      notesResult
    ] = await Promise.all([
      // Nombre d'inscriptions ce mois
      query(`
        SELECT COUNT(*) as total 
        FROM inscriptions 
        WHERE MONTH(date_inscription) = MONTH(CURRENT_DATE)
        AND YEAR(date_inscription) = YEAR(CURRENT_DATE)
      `) as Promise<CountResult[]>,
      
      // Nombre de paiements ce mois
      query(`
        SELECT COUNT(*) as total 
        FROM paiements_frais 
        WHERE MONTH(date_paiement) = MONTH(CURRENT_DATE)
        AND YEAR(date_paiement) = YEAR(CURRENT_DATE)
      `) as Promise<CountResult[]>,
      
      // Montant total des recettes ce mois
      query(`
        SELECT COALESCE(SUM(montant), 0) as total 
        FROM paiements_frais 
        WHERE MONTH(date_paiement) = MONTH(CURRENT_DATE)
        AND YEAR(date_paiement) = YEAR(CURRENT_DATE)
      `) as Promise<CountResult[]>,
      
      // Nombre d'absences ce mois
      query(`
        SELECT COUNT(*) as total 
        FROM absences 
        WHERE MONTH(date_absence) = MONTH(CURRENT_DATE)
        AND YEAR(date_absence) = YEAR(CURRENT_DATE)
      `) as Promise<CountResult[]>,
      
      // Nombre de notes ajoutées ce mois
      query(`
        SELECT COUNT(*) as total 
        FROM notes 
        WHERE MONTH(date_creation) = MONTH(CURRENT_DATE)
        AND YEAR(date_creation) = YEAR(CURRENT_DATE)
      `) as Promise<CountResult[]>
    ]);

    // Extraire les valeurs des résultats de manière sécurisée
    const inscriptionsMois = Array.isArray(inscriptionsResult) && inscriptionsResult.length > 0 
      ? Number(inscriptionsResult[0].total) || 0 
      : 0;
      
    const paiementsMois = Array.isArray(paiementsResult) && paiementsResult.length > 0 
      ? Number(paiementsResult[0].total) || 0 
      : 0;
      
    const montantRecettesMois = Array.isArray(recettesResult) && recettesResult.length > 0 
      ? Number(recettesResult[0].total) || 0 
      : 0;
      
    const absencesMois = Array.isArray(absencesResult) && absencesResult.length > 0 
      ? Number(absencesResult[0].total) || 0 
      : 0;
      
    const notesAjouteesMois = Array.isArray(notesResult) && notesResult.length > 0 
      ? Number(notesResult[0].total) || 0 
      : 0;
    
    return NextResponse.json({
      success: true,
      recapitulatif: {
        inscriptions_mois: inscriptionsMois,
        paiements_mois: paiementsMois,
        montant_recettes_mois: montantRecettesMois,
        absences_mois: absencesMois,
        notes_ajoutees_mois: notesAjouteesMois
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur récapitulatif:', error);
    
    return NextResponse.json({
      success: false,
      erreur: 'Erreur lors du chargement du récapitulatif',
      details: error?.message
    }, { status: 500 });
  }
}