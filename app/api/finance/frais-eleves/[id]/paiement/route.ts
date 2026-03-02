import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/app/services/financeService';

interface Context {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    const fraisEleveId = parseInt(id);
    
    if (isNaN(fraisEleveId) || fraisEleveId <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'ID du frais élève invalide' },
        { status: 400 }
      );
    }

    const paiementData = await request.json();
    
    // Validation des données
    if (!paiementData.montant || paiementData.montant <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'Le montant du paiement est requis et doit être positif' },
        { status: 400 }
      );
    }

    const resultat = await FinanceService.enregistrerPaiement(fraisEleveId, paiementData);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      frais: resultat.frais,
      message: 'Paiement enregistré avec succès'
    });
  } catch (error: any) {
    console.error('Erreur API enregistrement paiement:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}