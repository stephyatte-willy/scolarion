import { NextRequest, NextResponse } from 'next/server';
import { EnseignantsService } from '@/app/services/enseignantsService';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    console.log('🔍 GET Enseignant - ID reçu:', id);
    
    const idNum = parseInt(id);
    
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: `ID invalide: "${id}"` 
        },
        { status: 400 }
      );
    }
    
    const resultat = await EnseignantsService.obtenirEnseignantParId(idNum);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      enseignant: resultat.enseignant
    });
  } catch (error) {
    console.error('❌ Erreur API enseignant par ID:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    console.log('🔄 PUT Enseignant - ID reçu:', id);
    
    const idNum = parseInt(id);
    
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: `ID invalide pour la modification: "${id}"` 
        },
        { status: 400 }
      );
    }
    
    const enseignantData = await request.json();
    console.log('📦 Données reçues pour modification:', enseignantData);
    
    const resultat = await EnseignantsService.mettreAJourEnseignant(idNum, enseignantData);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      enseignant: resultat.enseignant
    });
  } catch (error) {
    console.error('❌ Erreur API mise à jour enseignant:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    console.log('🗑️ DELETE Enseignant - ID reçu:', id);
    
    const idNum = parseInt(id);
    
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: `ID invalide pour la suppression: "${id}"` 
        },
        { status: 400 }
      );
    }
    
    const resultat = await EnseignantsService.supprimerEnseignant(idNum);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Enseignant supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur API suppression enseignant:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    );
  }
}