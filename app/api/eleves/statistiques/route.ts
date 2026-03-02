import { NextResponse } from 'next/server';
import { ElevesService } from '@/app/services/elevesService';

export async function GET() {
  try {
    const resultat = await ElevesService.obtenirStatistiques();
    
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
  } catch (error) {
    console.error('Erreur API statistiques élèves:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}