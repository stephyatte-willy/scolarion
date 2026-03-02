import { NextRequest, NextResponse } from 'next/server';
import { EnseignantsService } from '@/app/services/enseignantsService';

// IMPORTANT: Avec Next.js 16 et Turbopack, nous devons utiliser une approche différente
export async function POST(request: NextRequest) {
  try {
    console.log('🌐 API Attribution classe - Début');
    
    // Extraire l'ID de l'enseignant de l'URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const enseignantId = parseInt(pathParts[pathParts.length - 2]); // -2 car le dernier segment est "attribuer-classe"
    
    console.log('🔍 ID enseignant extrait de l\'URL:', enseignantId);
    
    if (isNaN(enseignantId)) {
      return NextResponse.json(
        { success: false, erreur: 'ID enseignant invalide dans l\'URL' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    console.log('📦 Corps de la requête:', body);
    
    const { classeId } = body;
    
    if (!classeId) {
      return NextResponse.json(
        { success: false, erreur: 'ID classe requis' },
        { status: 400 }
      );
    }
    
    console.log('🎯 Attribution - Enseignant ID:', enseignantId, 'Classe ID:', classeId);
    
    const resultat = await EnseignantsService.attribuerClasse(enseignantId, classeId);
    
    if (!resultat.success) {
      console.error('❌ Erreur service attribution:', resultat.erreur);
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log('✅ Attribution réussie');
    return NextResponse.json({
      success: true,
      message: 'Classe attribuée avec succès'
    });
  } catch (error: any) {
    console.error('💥 Erreur API attribution classe:', error);
    console.error('💥 Stack trace:', error.stack);
    return NextResponse.json(
      { success: false, erreur: `Erreur serveur: ${error.message}` },
      { status: 500 }
    );
  }
}