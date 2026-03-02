import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/app/services/financeService';

export async function GET(request: NextRequest) {
  try {
    const resultat = await FinanceService.obtenirStatistiquesPaiements({});
    
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
    
    // Retournez des valeurs par défaut sécurisées
    const statistiquesDefaut = {
      total_jour: 0,
      total_mois: 0,
      total_annee: 0,
      total_periode: 0,
      nombre_paiements_jour: 0,
      nombre_paiements_mois: 0,
      moyenne_paiement: 0,
      repartition_categories: [],
      evolution_paiements: []
    };
    
    return NextResponse.json({
      success: true,
      statistiques: statistiquesDefaut
    });
  }
}