import { NextResponse } from 'next/server';
import { EnseignantsService } from '@/app/services/enseignantsService';

export async function GET() {
  try {
    const resultat = await EnseignantsService.obtenirSpecialites();
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      specialites: resultat.specialites
    });
  } catch (error) {
    console.error('Erreur API spécialités:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}