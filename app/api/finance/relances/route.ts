import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('📬 API Relances - Début POST');
    
    const body = await request.json();
    
    const {
      eleve_id,
      parent_telephone,
      parent_email,
      message,
      montant_du,
      methode_envoi,
      statut,
      envoye_par
    } = body;

    if (!eleve_id || !message || !methode_envoi) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Données manquantes: eleve_id, message et methode_envoi sont requis' 
        },
        { status: 400 }
      );
    }

    const insertSql = `
      INSERT INTO relances_paiements 
      (eleve_id, parent_telephone, parent_email, message, montant_du, 
       methode_envoi, statut, envoye_par, date_envoi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const params = [
      eleve_id,
      parent_telephone || '',
      parent_email || '',
      message,
      montant_du || 0,
      methode_envoi,
      statut || 'envoye',
      envoye_par || 1
    ];

    await query(insertSql, params);

    console.log('✅ Relance enregistrée avec succès');

    return NextResponse.json({
      success: true,
      message: 'Relance enregistrée avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur API relances:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}