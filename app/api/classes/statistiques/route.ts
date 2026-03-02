import { NextResponse } from 'next/server';
import { ClassesService } from '@/app/services/classesService';

export async function GET() {
  try {
    const resultat = await ClassesService.obtenirStatistiques();
    
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
    console.error('Erreur API statistiques classes:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}