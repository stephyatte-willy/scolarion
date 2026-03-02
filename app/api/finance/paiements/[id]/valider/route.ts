import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/app/services/financeService';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('✅ API Validation paiement - Début');
    const paiementId = parseInt(params.id);
    const validationData = await request.json();

    console.log('📦 ID reçu:', params.id, 'ID parsé:', paiementId);
    console.log('📦 Données validation:', validationData);

    if (isNaN(paiementId)) {
      return NextResponse.json(
        { success: false, erreur: 'ID de paiement invalide' },
        { status: 400 }
      );
    }

    const resultat = await FinanceService.validerPaiement(paiementId, validationData);

    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log('✅ Paiement validé avec succès');
    
    return NextResponse.json({
      success: true,
      paiement: resultat.paiement,
      message: 'Paiement validé avec succès'
    });
  } catch (error: any) {
    console.error('💥 Erreur API validation paiement:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}