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
    
    console.log('📝 Création frais classe avec données:', fraisData);
    
    // ✅ Utilisation de creerFraisScolaire (la méthode qui existe)
    const resultat = await FinanceService.creerFraisScolaire({
      ...fraisData,
      type: 'classe', // Spécifier que c'est pour une classe
      date_creation: new Date().toISOString()
    });
    
    if (!resultat || !resultat.success) {
      console.error('❌ Erreur retournée par le service:', resultat?.erreur);
      return NextResponse.json(
        { 
          success: false, 
          erreur: resultat?.erreur || 'Erreur lors de la création du frais' 
        },
        { status: 400 }
      );
    }

    console.log('✅ Frais créé avec succès:', resultat.frais);
    
    return NextResponse.json({
      success: true,
      frais: resultat.frais
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('❌ Erreur API création frais classe:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}