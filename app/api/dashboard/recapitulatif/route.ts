import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    // Exécuter les requêtes en parallèle
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
      `),
      
      // Nombre de paiements ce mois
      query(`
        SELECT COUNT(*) as total 
        FROM paiements_frais 
        WHERE MONTH(date_paiement) = MONTH(CURRENT_DATE)
        AND YEAR(date_paiement) = YEAR(CURRENT_DATE)
      `),
      
      // Montant total des recettes ce mois
      query(`
        SELECT SUM(montant) as total 
        FROM paiements_frais 
        WHERE MONTH(date_paiement) = MONTH(CURRENT_DATE)
        AND YEAR(date_paiement) = YEAR(CURRENT_DATE)
      `),
      
      // Nombre d'absences ce mois
      query(`
        SELECT COUNT(*) as total 
        FROM absences 
        WHERE MONTH(date_absence) = MONTH(CURRENT_DATE)
        AND YEAR(date_absence) = YEAR(CURRENT_DATE)
      `),
      
      // Nombre de notes ajoutées ce mois
      query(`
        SELECT COUNT(*) as total 
        FROM notes 
        WHERE MONTH(date_creation) = MONTH(CURRENT_DATE)
        AND YEAR(date_creation) = YEAR(CURRENT_DATE)
      `)
    ]);

    // Extraire les valeurs des résultats (en gérant le cas où les résultats sont des tableaux)
    const inscriptionsMois = Array.isArray(inscriptionsResult) && inscriptionsResult[0] 
      ? inscriptionsResult[0].total || 0 
      : 0;
      
    const paiementsMois = Array.isArray(paiementsResult) && paiementsResult[0] 
      ? paiementsResult[0].total || 0 
      : 0;
      
    const montantRecettesMois = Array.isArray(recettesResult) && recettesResult[0] 
      ? recettesResult[0].total || 0 
      : 0;
      
    const absencesMois = Array.isArray(absencesResult) && absencesResult[0] 
      ? absencesResult[0].total || 0 
      : 0;
      
    const notesAjouteesMois = Array.isArray(notesResult) && notesResult[0] 
      ? notesResult[0].total || 0 
      : 0;
    
    return NextResponse.json({
      success: true,
      recapitulatif: {
        inscriptions_mois: Number(inscriptionsMois),
        paiements_mois: Number(paiementsMois),
        montant_recettes_mois: Number(montantRecettesMois),
        absences_mois: Number(absencesMois),
        notes_ajoutees_mois: Number(notesAjouteesMois)
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
