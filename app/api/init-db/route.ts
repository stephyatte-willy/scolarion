import { NextResponse } from 'next/server';
import { initialiserBaseDeDonnees } from '@/app/lib/init-database';

export async function GET() {
  try {
    const resultat = await initialiserBaseDeDonnees();
    
    if (resultat.success) {
      return NextResponse.json({
        success: true,
        message: 'Base de données initialisée avec succès'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Erreur lors de l\'initialisation',
        error: resultat.error
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erreur API init-db:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    }, { status: 500 });
  }
}