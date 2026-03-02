import { NextRequest, NextResponse } from 'next/server';
import { ElevesService } from '@/app/services/elevesService';

// Interface pour le contexte avec params
interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Attendre la résolution des params
    const { id } = await context.params;
    console.log('🔍 GET Élève - ID reçu:', id);
    
    const idNum = parseInt(id);
    console.log('🔍 GET Élève - ID parsé:', idNum);
    
    if (isNaN(idNum) || idNum <= 0) {
      console.error('❌ ID invalide détecté:', id);
      return NextResponse.json(
        { 
          success: false, 
          erreur: `ID invalide: "${id}". L'ID doit être un nombre positif.` 
        },
        { status: 400 }
      );
    }
    
    const resultat = await ElevesService.obtenirEleveParId(idNum);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      eleve: resultat.eleve
    });
  } catch (error) {
    console.error('❌ Erreur API élève par ID:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    // Attendre la résolution des params
    const { id } = await context.params;
    console.log('🔄 PUT Élève - ID reçu:', id);
    
    const idNum = parseInt(id);
    console.log('🔄 PUT Élève - ID parsé:', idNum);
    
    if (isNaN(idNum) || idNum <= 0) {
      console.error('❌ ID invalide pour PUT:', id);
      return NextResponse.json(
        { 
          success: false, 
          erreur: `ID invalide pour la modification: "${id}"` 
        },
        { status: 400 }
      );
    }
    
    const eleveData = await request.json();
    console.log('📦 Données reçues pour modification:', eleveData);
    
    const resultat = await ElevesService.mettreAJourEleve(idNum, eleveData);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log('✅ Élève modifié avec succès:', resultat.eleve);
    return NextResponse.json({
      success: true,
      eleve: resultat.eleve
    });
  } catch (error) {
    console.error('❌ Erreur API mise à jour élève:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    // Attendre la résolution des params
    const { id } = await context.params;
    console.log('🗑️ DELETE Élève - ID reçu:', id);
    
    const idNum = parseInt(id);
    console.log('🗑️ DELETE Élève - ID parsé:', idNum);
    
    if (isNaN(idNum) || idNum <= 0) {
      console.error('❌ ID invalide pour DELETE:', id);
      return NextResponse.json(
        { 
          success: false, 
          erreur: `ID invalide pour la suppression: "${id}"` 
        },
        { status: 400 }
      );
    }
    
    const resultat = await ElevesService.supprimerEleve(idNum);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log('✅ Élève supprimé avec succès - ID:', idNum);
    return NextResponse.json({
      success: true,
      message: 'Élève supprimé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur API suppression élève:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    );
  }
}