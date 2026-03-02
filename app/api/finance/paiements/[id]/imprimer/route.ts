import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paiementId = parseInt(params.id);
    
    // Vérifier si c'est la première impression
    const checkSql = `
      SELECT date_premiere_impression FROM paiements_frais WHERE id = ?
    `;
    
    const result = await query(checkSql, [paiementId]) as any[];
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Paiement non trouvé' },
        { status: 404 }
      );
    }
    
    const paiement = result[0];
    
    let updateSql: string;
    
    if (!paiement.date_premiere_impression) {
      // Première impression
      updateSql = `
        UPDATE paiements_frais 
        SET date_premiere_impression = NOW(),
            updated_at = NOW()
        WHERE id = ?
      `;
    } else {
      // Duplicata
      updateSql = `
        UPDATE paiements_frais 
        SET date_impression_recu = NOW(),
            est_duplicata = 1,
            updated_at = NOW()
        WHERE id = ?
      `;
    }
    
    await query(updateSql, [paiementId]);
    
    // Récupérer les informations mises à jour
    const updatedPaiement = await query(`
      SELECT * FROM paiements_frais WHERE id = ?
    `, [paiementId]) as any[];
    
    return NextResponse.json({
      success: true,
      paiement: updatedPaiement[0],
      is_duplicate: !!paiement.date_premiere_impression
    });
    
  } catch (error: any) {
    console.error('Erreur marquage impression:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors du marquage de l\'impression' },
      { status: 500 }
    );
  }
}