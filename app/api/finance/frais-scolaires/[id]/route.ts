// /api/finance/frais-scolaires/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { FinanceService } from '@/app/services/financeService';

// CORRECTION : Interface pour les params dans Next.js App Router
interface Context {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: Context) {
  try {
    console.log('🗑️ API Suppression frais scolaire - Début');
    
    // Extraction correcte des params
    const { id } = await context.params;
    console.log('📦 ID reçu:', id);
    
    const fraisId = parseInt(id);
    
    if (isNaN(fraisId) || fraisId <= 0) {
      console.error('❌ ID invalide:', id);
      return NextResponse.json(
        { 
          success: false, 
          erreur: `ID invalide: "${id}". L'ID doit être un nombre positif.` 
        },
        { status: 400 }
      );
    }

    console.log('🔍 Vérification et suppression en cascade...');
    
    // CORRECTION : Utiliser la nouvelle méthode qui gère la suppression en cascade
    const resultat = await FinanceService.supprimerFraisScolaire(fraisId);
    
    if (!resultat.success) {
      console.error('❌ Erreur suppression frais scolaire:', resultat.erreur);
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    console.log('✅ Frais scolaire supprimé avec succès (avec cascade)');
    
    return NextResponse.json({
      success: true,
      message: resultat.message
    });
  } catch (error: any) {
    console.error('💥 Erreur API suppression frais scolaire:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: Context) {
  try {
    console.log('✏️ API Modification frais scolaire - Début');
    
    // CORRECTION : Extraction correcte des params
    const { id } = await context.params;
    console.log('📦 ID reçu:', id);
    
    const fraisId = parseInt(id);
    
    if (isNaN(fraisId) || fraisId <= 0) {
      console.error('❌ ID invalide:', id);
      return NextResponse.json(
        { 
          success: false, 
          erreur: `ID invalide: "${id}". L'ID doit être un nombre positif.` 
        },
        { status: 400 }
      );
    }

    // CORRECTION : Lire d'abord le texte, puis parser le JSON
    const text = await request.text();
    if (!text) {
      console.error('❌ Corps de requête vide');
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Données manquantes dans la requête' 
        },
        { status: 400 }
      );
    }
    
    const fraisData = JSON.parse(text);
    console.log('📦 Données reçues:', fraisData);

    const resultat = await FinanceService.modifierFraisScolaire(fraisId, fraisData);
    
    if (!resultat.success) {
      console.error('❌ Erreur modification frais scolaire:', resultat.erreur);
      return NextResponse.json(
        { 
          success: false, 
          erreur: resultat.erreur || 'Erreur lors de la modification du frais scolaire' 
        },
        { status: 400 }
      );
    }

    console.log('✅ Frais scolaire modifié avec succès');
    
    return NextResponse.json({
      success: true,
      frais: resultat.frais
    });
  } catch (error: any) {
    console.error('💥 Erreur API modification frais scolaire:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: Context) {
  try {
    // CORRECTION : Extraction correcte des params
    const { id } = await context.params;
    const fraisId = parseInt(id);
    
    if (isNaN(fraisId) || fraisId <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'ID invalide' },
        { status: 400 }
      );
    }

    const resultat = await FinanceService.obtenirFraisScolaireParId(fraisId);
    
    if (!resultat.success) {
      return NextResponse.json(
        { success: false, erreur: resultat.erreur },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      frais: resultat.frais
    });
  } catch (error: any) {
    console.error('Erreur API frais scolaire par ID:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}