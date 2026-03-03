import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/app/services/financeService';

// CORRECTION 1: Utiliser Promise pour params
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(
  request: NextRequest, 
  { params }: RouteParams  // La signature reste la même, mais le type change
) {
  try {
    // CORRECTION 2: Attendre la résolution des params
    const { id } = await params;
    
    const idNum = parseInt(id);
    
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'ID invalide' },
        { status: 400 }
      );
    }

    const resultat = await FinanceService.supprimerFraisClasse(idNum);
    
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