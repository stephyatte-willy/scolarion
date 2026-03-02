import { NextRequest, NextResponse } from 'next/server';
import { PersonnelService } from '@/app/services/personnelService';

export async function GET() {
  try {
    const fonctions = await PersonnelService.obtenirFonctions();
    
    return NextResponse.json({
      success: true,
      fonctions: fonctions
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