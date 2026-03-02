import { NextRequest, NextResponse } from 'next/server';
import { EnseignantsService } from '@/app/services/enseignantsService';

export async function GET(request: NextRequest) {
  try {
    console.log('🌐 API Personnel - Début requête GET');
    
    const { searchParams } = new URL(request.url);
    const filtres = {
      recherche: searchParams.get('recherche') || undefined,
      specialite: searchParams.get('specialite') || undefined,
      statut: searchParams.get('statut') || undefined,
      type_contrat: searchParams.get('type_contrat') || undefined,
      type_enseignant: searchParams.get('type_enseignant') || undefined,
      genre: searchParams.get('genre') || undefined,
      fonction: searchParams.get('fonction') || undefined, // AJOUTÉ
      departement: searchParams.get('departement') || undefined // AJOUTÉ
    };

    console.log('🔍 Filtres reçus:', filtres);

    const resultat = await EnseignantsService.obtenirEnseignants(filtres);
    
    if (!resultat.success) {
      console.error('❌ Erreur service personnel:', resultat.erreur);
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log('✅ Personnel retourné:', resultat.enseignants?.length || 0);
    
    return NextResponse.json({
      success: true,
      enseignants: resultat.enseignants || [] // Gardez le nom "enseignants" pour la compatibilité
    });
  } catch (error: any) {
    console.error('💥 Erreur API personnel:', error);
    console.error('💥 Stack trace:', error.stack);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}

// La méthode POST reste exactement la même
export async function POST(request: NextRequest) {
  try {
    const enseignantData = await request.json();
    console.log('📝 API Création membre - Données:', enseignantData);
    
    const resultat = await EnseignantsService.creerEnseignant(enseignantData);
    
    if (!resultat.success) {
      console.error('❌ Erreur création membre:', resultat.erreur);
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log('✅ Membre créé avec succès');
    
    return NextResponse.json({
      success: true,
      enseignant: resultat.enseignant
    }, { status: 201 });
  } catch (error: any) {
    console.error('💥 Erreur API création membre:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}