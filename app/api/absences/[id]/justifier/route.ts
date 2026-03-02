// /api/absences/[id]/justifier/route.ts - VERSION AVEC LOGS DÉTAILLÉS
import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const body = await request.json();
    
    // Log détaillé de ce qui est reçu
    console.log('🔍 DONNÉES REÇUES DANS L\'API:');
    console.log('- ID:', id);
    console.log('- Body complet:', JSON.stringify(body, null, 2));
    console.log('- justifiee (brut):', body.justifiee);
    console.log('- type de justifiee:', typeof body.justifiee);
    
    // CORRECTION ROBUSTE: Convertir en nombre de façon explicite
    let justifieeValue: number;
    
    if (body.justifiee === true || body.justifiee === 1 || body.justifiee === '1' || body.justifiee === 1) {
      justifieeValue = 1;
    } else if (body.justifiee === false || body.justifiee === 0 || body.justifiee === '0' || body.justifiee === 0) {
      justifieeValue = 0;
    } else {
      // Par défaut, si c'est undefined ou autre, on met 0
      justifieeValue = 0;
    }
    
    const piece_justificative = body.piece_justificative || null;
    
    console.log('✅ VALEURS APRÈS CONVERSION:');
    console.log('- justifiee (converti):', justifieeValue);
    console.log('- type justifiee:', typeof justifieeValue);
    console.log('- piece_justificative:', piece_justificative);
    
    // Vérifier d'abord si l'absence existe
    const checkSql = 'SELECT * FROM absences WHERE id = ?';
    const existing = await query(checkSql, [id]) as any[];
    
    console.log('📋 Absence avant mise à jour:', existing[0] || 'Non trouvée');
    
    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Absence non trouvée' },
        { status: 404 }
      );
    }
    
    // Exécuter la mise à jour
    const updateSql = `
      UPDATE absences 
      SET justifiee = ?, 
          piece_justificative = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;
    
    console.log('📝 Exécution SQL:', updateSql);
    console.log('📊 Paramètres:', [justifieeValue, piece_justificative, id]);
    
    const result = await query(updateSql, [justifieeValue, piece_justificative, id]);
    
    console.log('✅ Résultat de la mise à jour:', result);
    
    // Vérifier après mise à jour
    const afterSql = 'SELECT * FROM absences WHERE id = ?';
    const after = await query(afterSql, [id]) as any[];
    
    console.log('📋 Absence après mise à jour:', after[0] || 'Non trouvée');
    console.log('✅ justifiee après mise à jour:', after[0]?.justifiee);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Absence justifiée avec succès',
      data: { 
        justifiee: justifieeValue, 
        piece_justificative,
        resultat: after[0]
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur justification:', error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la justification" },
      { status: 500 }
    );
  }
}