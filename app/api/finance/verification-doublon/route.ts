import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Vérification Doublon - Début');
    
    const { searchParams } = new URL(request.url);
    const versementId = searchParams.get('versement_id');
    const eleveId = searchParams.get('eleve_id');

    console.log('📦 Paramètres vérification doublon:', { versementId, eleveId });

    if (!versementId || !eleveId) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Paramètres manquants',
          doublonTrouve: false
        },
        { status: 400 }
      );
    }

    // Vérifier le statut actuel du versement
    const sqlVersement = `
      SELECT 
        vs.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom
      FROM versements_scolarite vs
      INNER JOIN eleves e ON vs.eleve_id = e.id
      WHERE vs.id = ? AND vs.eleve_id = ?
    `;

    const versements = await query(sqlVersement, [parseInt(versementId), parseInt(eleveId)]) as any[];

    if (versements.length === 0) {
      return NextResponse.json({
        success: true,
        doublonTrouve: false,
        message: 'Versement non trouvé'
      });
    }

    const versement = versements[0];
    const montantRestant = versement.montant_versement - (versement.montant_paye || 0);

    console.log('📊 Statut versement:', {
      statut: versement.statut,
      montantVersement: versement.montant_versement,
      montantPaye: versement.montant_paye,
      montantRestant: montantRestant
    });

    // Si le versement est déjà entièrement payé
    if (versement.statut === 'paye' || montantRestant <= 0) {
      return NextResponse.json({
        success: true,
        doublonTrouve: true,
        montantRestant: montantRestant,
        message: `Le versement ${versement.numero_versement} est déjà entièrement payé.`
      });
    }

    return NextResponse.json({
      success: true,
      doublonTrouve: false,
      montantRestant: montantRestant
    });

  } catch (error: any) {
    console.error('❌ Erreur vérification doublon:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}`,
        doublonTrouve: false
      },
      { status: 500 }
    );
  }
}