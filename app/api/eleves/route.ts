// app/api/eleves/route.ts - Ajout de logging
import { NextRequest, NextResponse } from 'next/server';
import { ElevesService } from '@/app/services/elevesService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtres = {
      recherche: searchParams.get('recherche') || undefined,
      classe_id: searchParams.get('classe_id') ? parseInt(searchParams.get('classe_id')!) : undefined,
      statut: searchParams.get('statut') || undefined,
      genre: searchParams.get('genre') || undefined
    };

    console.log('🔍 API ÉLÈVES - Filtres reçus:', filtres);

    const resultat = await ElevesService.obtenirEleves(filtres);
    
    console.log('📊 API ÉLÈVES - Résultat service:', {
      success: resultat.success,
      nbEleves: resultat.eleves?.length,
      premierEleve: resultat.eleves?.[0] ? {
        id: resultat.eleves[0].id,
        nom: resultat.eleves[0].nom,
        typeId: typeof resultat.eleves[0].id
      } : 'Aucun élève'
    });
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      eleves: resultat.eleves
    });
  } catch (error) {
    console.error('❌ Erreur API élèves:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const eleveData = await request.json();
    console.log('➕ API CRÉATION ÉLÈVE - Données reçues:', JSON.stringify(eleveData, null, 2));
    
    const resultat = await ElevesService.creerEleve(eleveData);
    
    console.log('📊 API CRÉATION - Résultat:', resultat);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      eleve: resultat.eleve,
      message: 'Élève créé avec succès'
    }, { status: 201 });
    
  } catch (error) {
    console.error('❌ Erreur API création élève:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}