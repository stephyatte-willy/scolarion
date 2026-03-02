// /api/finance/paiements/actions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/app/services/financeService';

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, erreur: 'ID de paiement invalide' },
        { status: 400 }
      );
    }

    const paiementId = parseInt(id);
    const donnees = await request.json();

    let resultat;

    switch (action) {
      case 'modifier':
        resultat = await FinanceService.modifierPaiement(paiementId, donnees);
        break;
      case 'valider':
        resultat = await FinanceService.validerPaiement(paiementId, donnees);
        break;
      default:
        return NextResponse.json(
          { success: false, erreur: 'Action non supportée' },
          { status: 400 }
        );
    }

    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      paiement: resultat.paiement,
      message: `Paiement ${action === 'modifier' ? 'modifié' : 'validé'} avec succès`
    });
  } catch (error: any) {
    console.error('❌ Erreur API actions paiement:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, erreur: 'ID de paiement invalide' },
        { status: 400 }
      );
    }

    const paiementId = parseInt(id);
    const resultat = await FinanceService.supprimerPaiement(paiementId);

    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: resultat.message || 'Paiement supprimé avec succès'
    });
  } catch (error: any) {
    console.error('❌ Erreur API suppression paiement:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}