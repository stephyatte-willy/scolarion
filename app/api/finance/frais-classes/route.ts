import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/app/services/financeService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtres = {
      classe_id: searchParams.get('classe_id') ? parseInt(searchParams.get('classe_id')!) : undefined,
      annee_scolaire: searchParams.get('annee_scolaire') || undefined,
      statut: searchParams.get('statut') || undefined
    };

    const resultat = await FinanceService.obtenirFraisClasses(filtres);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      frais: resultat.frais || []
    });
  } catch (error: any) {
    console.error('Erreur API frais classes:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}`,
        frais: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const fraisData = await request.json();
    
    // ✅ Utilisation de la méthode suggérée
    const resultat = await FinanceService.creerFraisScolaire({
      ...fraisData,
      type: 'classe' // Spécifier que c'est pour une classe
    });
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      frais: resultat.frais
    }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur API création frais classe:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}
