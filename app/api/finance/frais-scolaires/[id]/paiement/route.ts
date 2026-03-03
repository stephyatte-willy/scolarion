import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/app/services/financeService';

// ✅ Correction: interface avec Promise
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(
  request: NextRequest, 
  { params }: RouteParams  // ✅ Utilisation de l'interface corrigée
) {
  try {
    // ✅ Récupération asynchrone de l'ID
    const { id } = await params;
    const idNum = parseInt(id);
    
    console.log('💰 API Paiement frais - ID:', idNum);
    
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: `ID invalide: "${id}"` 
        },
        { status: 400 }
      );
    }
    
    const paiementData = await request.json();
    console.log('📦 Données paiement reçues:', paiementData);
    
    const resultat = await FinanceService.enregistrerPaiement(idNum, paiementData);
    
    if (!resultat.success) {
      console.error('❌ Erreur enregistrement paiement:', resultat.erreur);
      return NextResponse.json(
        { 
          success: false, 
          erreur: resultat.erreur || 'Erreur lors de l\'enregistrement du paiement' 
        },
        { status: 400 }
      );
    }

    console.log('✅ Paiement enregistré avec succès');
    
    return NextResponse.json({
      success: true,
      frais: resultat.frais
    });
  } catch (error: any) {
    console.error('💥 Erreur API paiement frais:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}
