import { NextRequest, NextResponse } from 'next/server';
import { EnseignantsService } from '@/app/services/enseignantsService';

// IMPORTANT: Avec Next.js 16, extraction manuelle de l'ID
export async function GET(request: NextRequest) {
  try {
    console.log('🌐 API Classes enseignant - Début');
    
    // Extraire l'ID de l'enseignant de l'URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const enseignantId = parseInt(pathParts[pathParts.length - 2]); // -2 car le dernier segment est "classes"
    
    console.log('🔍 ID enseignant extrait:', enseignantId);
    
    if (isNaN(enseignantId)) {
      return NextResponse.json(
        { success: false, erreur: 'ID enseignant invalide' },
        { status: 400 }
      );
    }
    
    const resultat = await EnseignantsService.obtenirClassesEnseignant(enseignantId);
    
    if (!resultat.success) {
      console.error('❌ Erreur service classes:', resultat.erreur);
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log('✅ Classes retournées:', resultat.classes?.length || 0);
    
    return NextResponse.json({
      success: true,
      classes: resultat.classes || []
    });
  } catch (error: any) {
    console.error('💥 Erreur API classes enseignant:', error);
    return NextResponse.json(
      { success: false, erreur: `Erreur serveur: ${error.message}` },
      { status: 500 }
    );
  }
}