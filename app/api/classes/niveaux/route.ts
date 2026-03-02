import { NextResponse } from 'next/server';
import { ClassesService } from '@/app/services/classesService';

export async function GET() {
  try {
    const resultat = await ClassesService.obtenirNiveaux();
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      niveaux: resultat.niveaux
    });
  } catch (error) {
    console.error('Erreur API niveaux:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}