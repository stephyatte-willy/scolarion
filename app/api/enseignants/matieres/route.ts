import { NextResponse } from 'next/server';
import { EnseignantsService } from '@/app/services/enseignantsService';

export async function GET() {
  try {
    const resultat = await EnseignantsService.obtenirMatieres();
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      matieres: resultat.matieres
    });
  } catch (error) {
    console.error('Erreur API matières:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}