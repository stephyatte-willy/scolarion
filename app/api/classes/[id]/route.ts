import { NextRequest, NextResponse } from 'next/server';
import { ClassesService } from '@/app/services/classesService';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    console.log('🔍 GET Classe - ID reçu:', id);
    
    const idNum = parseInt(id);
    console.log('🔍 GET Classe - ID parsé:', idNum);
    
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
    
    const resultat = await ClassesService.obtenirClasseParId(idNum);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      classe: resultat.classe
    });
  } catch (error) {
    console.error('❌ Erreur API classe par ID:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    console.log('🔄 PUT Classe - ID reçu:', id);
    
    const idNum = parseInt(id);
    console.log('🔄 PUT Classe - ID parsé:', idNum);
    
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
    
    const classeData = await request.json();
    console.log('📦 Données reçues pour modification:', classeData);
    
    const resultat = await ClassesService.mettreAJourClasse(idNum, classeData);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log('✅ Classe modifiée avec succès:', resultat.classe);
    return NextResponse.json({
      success: true,
      classe: resultat.classe
    });
  } catch (error) {
    console.error('❌ Erreur API mise à jour classe:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur lors de la mise à jour' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    console.log('🗑️ DELETE Classe - ID reçu:', id);
    
    const idNum = parseInt(id);
    console.log('🗑️ DELETE Classe - ID parsé:', idNum);
    
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
    
    const resultat = await ClassesService.supprimerClasse(idNum);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log('✅ Classe supprimée avec succès - ID:', idNum);
    return NextResponse.json({
      success: true,
      message: 'Classe supprimée avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur API suppression classe:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur lors de la suppression' },
      { status: 500 }
    );
  }
}