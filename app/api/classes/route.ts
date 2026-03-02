import { NextRequest, NextResponse } from 'next/server';
import { ClassesService } from '@/app/services/classesService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtres = {
      recherche: searchParams.get('recherche') || undefined,
      niveau: searchParams.get('niveau') || undefined,
      cycle: searchParams.get('cycle') || undefined
    };

    const resultat = await ClassesService.obtenirClasses(filtres);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      classes: resultat.classes
    });
  } catch (error) {
    console.error('Erreur API classes:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const classeData = await request.json();
    const resultat = await ClassesService.creerClasse(classeData);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      classe: resultat.classe
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur API création classe:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}