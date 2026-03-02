import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/app/services/financeService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtres = {
      date_debut: searchParams.get('date_debut') || undefined,
      date_fin: searchParams.get('date_fin') || undefined,
      du_jour: searchParams.get('du_jour') === 'true',
      du_mois: searchParams.get('du_mois') === 'true',
      de_l_annee: searchParams.get('de_l_annee') === 'true'
    };

    const resultat = await FinanceService.obtenirStatistiquesPaiements(filtres);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      statistiques: resultat.statistiques
    });
  } catch (error: any) {
    console.error('Erreur API statistiques paiements:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}`,
        statistiques: {
          total_jour: 0,
          total_mois: 0,
          total_annee: 0,
          total_periode: 0,
          nombre_paiements_jour: 0,
          nombre_paiements_mois: 0,
          moyenne_paiement: 0,
          repartition_categories: [],
          evolution_paiements: []
        }
      },
      { status: 500 }
    );
  }
}