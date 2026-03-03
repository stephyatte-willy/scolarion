import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// GET - Vérifier l'état d'impression
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Correction: Promise
) {
  try {
    // ✅ Récupération asynchrone de l'ID
    const { id } = await params;
    const paiementId = parseInt(id);
    
    if (isNaN(paiementId) || paiementId <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'ID invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier si c'est une première impression
    const sql = `
      SELECT 
        date_premiere_impression,
        date_impression_recu,
        est_duplicata
      FROM paiements_frais 
      WHERE id = ?
    `;
    
    const result = await query(sql, [paiementId]) as any[];
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Paiement non trouvé' },
        { status: 404 }
      );
    }
    
    const paiement = result[0];
    const premiereImpression = !paiement.date_premiere_impression;
    
    return NextResponse.json({
      success: true,
      premiere_impression: premiereImpression,
      date_premiere_impression: paiement.date_premiere_impression,
      date_impression_recu: paiement.date_impression_recu,
      est_duplicata: paiement.est_duplicata || false
    });
    
  } catch (error: any) {
    console.error('Erreur vérification impression:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la vérification de l\'impression'
      },
      { status: 500 }
    );
  }
}

// POST - Enregistrer une impression
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Correction: Promise
) {
  try {
    // ✅ Récupération asynchrone de l'ID
    const { id } = await params;
    const paiementId = parseInt(id);
    
    if (isNaN(paiementId) || paiementId <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'ID invalide' },
        { status: 400 }
      );
    }
    
    // Récupérer l'état actuel du paiement
    const checkSql = `
      SELECT date_premiere_impression 
      FROM paiements_frais 
      WHERE id = ?
    `;
    
    const checkResult = await query(checkSql, [paiementId]) as any[];
    
    if (checkResult.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Paiement non trouvé' },
        { status: 404 }
      );
    }
    
    const datePremiereImpression = checkResult[0].date_premiere_impression;
    const maintenant = new Date();
    
    if (!datePremiereImpression) {
      // Première impression
      const updateSql = `
        UPDATE paiements_frais 
        SET 
          date_premiere_impression = ?,
          date_impression_recu = ?,
          updated_at = NOW()
        WHERE id = ?
      `;
      
      await query(updateSql, [maintenant, maintenant, paiementId]);
      
      return NextResponse.json({
        success: true,
        message: 'Première impression enregistrée',
        date_premiere_impression: maintenant
      });
    } else {
      // Duplicata
      const updateSql = `
        UPDATE paiements_frais 
        SET 
          date_impression_recu = ?,
          est_duplicata = true,
          updated_at = NOW()
        WHERE id = ?
      `;
      
      await query(updateSql, [maintenant, paiementId]);
      
      return NextResponse.json({
        success: true,
        message: 'Duplicata enregistré',
        est_duplicata: true,
        date_impression_recu: maintenant
      });
    }
    
  } catch (error: any) {
    console.error('Erreur marquage impression:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors du marquage de l\'impression'
      },
      { status: 500 }
    );
  }
}