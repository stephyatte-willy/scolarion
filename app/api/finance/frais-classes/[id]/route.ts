import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/app/services/financeService';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id) || id <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'ID invalide' },
        { status: 400 }
      );
    }

    const resultat = await FinanceService.supprimerFraisClasse(id);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: resultat.message
    });
  } catch (error: any) {
    console.error('Erreur API suppression frais classe:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}