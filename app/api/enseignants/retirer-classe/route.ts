import { NextRequest, NextResponse } from 'next/server';
import { EnseignantsService } from '@/app/services/enseignantsService';

export async function POST(request: NextRequest) {
  try {
    console.log('🌐 API Retrait classe - Début');
    
    const body = await request.json();
    console.log('📦 Corps de la requête:', body);
    
    const { enseignantId, classeId } = body;
    
    if (!enseignantId || !classeId) {
      return NextResponse.json(
        { success: false, erreur: 'ID enseignant et ID classe requis' },
        { status: 400 }
      );
    }
    
    const id = parseInt(enseignantId);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, erreur: 'ID enseignant invalide' },
        { status: 400 }
      );
    }
    
    console.log('🎯 Retrait - Enseignant ID:', id, 'Classe ID:', classeId);
    
    const resultat = await EnseignantsService.retirerClasse(id, classeId);
    
    if (!resultat.success) {
      console.error('❌ Erreur service retrait:', resultat.erreur);
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log('✅ Retrait réussi');
    return NextResponse.json({
      success: true,
      message: 'Classe retirée avec succès'
    });
  } catch (error: any) {
    console.error('💥 Erreur API retrait classe:', error);
    return NextResponse.json(
      { success: false, erreur: `Erreur serveur: ${error.message}` },
      { status: 500 }
    );
  }
}