import { NextRequest, NextResponse } from 'next/server';
import { PersonnelService } from '@/app/services/personnelService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filtres = {
      recherche: searchParams.get('recherche') || undefined,
      specialite: searchParams.get('specialite') || undefined,
      statut: searchParams.get('statut') || undefined,
      type_contrat: searchParams.get('type_contrat') || undefined,
      type_personnel: searchParams.get('type_personnel') || undefined,
      genre: searchParams.get('genre') || undefined,
      fonction: searchParams.get('fonction') || undefined,
      departement: searchParams.get('departement') || undefined
    };

    const resultat = await PersonnelService.obtenirPersonnel(filtres);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      personnel: resultat.personnel || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const personnelData = await request.json();
    
    const resultat = await PersonnelService.creerPersonnel(personnelData);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      personnel: resultat.personnel
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}