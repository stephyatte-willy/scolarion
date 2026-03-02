import { NextResponse } from 'next/server';
import { EnseignantsService } from '@/app/services/enseignantsService';

export async function GET() {
  try {
    const resultat = await EnseignantsService.obtenirClassesDisponibles();
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      classes: resultat.classes
    });
  } catch (error) {
    console.error('Erreur API classes disponibles:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}