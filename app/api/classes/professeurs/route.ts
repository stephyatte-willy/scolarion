import { NextResponse } from 'next/server';
import { ClassesService } from '@/app/services/classesService';

export async function GET() {
  try {
    console.log('📋 API Récupération des professeurs');
    
    const resultat = await ClassesService.obtenirProfesseurs();
    
    if (!resultat.success) {
      console.error('❌ Erreur service professeurs:', resultat.erreur);
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log(`✅ ${resultat.professeurs?.length || 0} professeurs trouvés`);
    
    return NextResponse.json({
      success: true,
      professeurs: resultat.professeurs || []
    });
  } catch (error) {
    console.error('❌ Erreur API professeurs:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
