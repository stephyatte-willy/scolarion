import { NextRequest, NextResponse } from 'next/server';
import { PersonnelService } from '@/app/services/personnelService';

export async function GET() {
  try {
    const departements = await PersonnelService.obtenirDepartements();
    
    return NextResponse.json({
      success: true,
      departements: departements
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