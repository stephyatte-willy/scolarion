import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '10';

    const transactions = await query(`
      SELECT 
        p.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        cf.nom as categorie,
        'entree' as type
      FROM paiements_frais p
      INNER JOIN frais_eleves fe ON p.frais_eleve_id = fe.id
      INNER JOIN eleves e ON p.eleve_id = e.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      ORDER BY p.created_at DESC
      LIMIT ?
    `, [parseInt(limit)]) as any[];

    return NextResponse.json({
      success: true,
      transactions: transactions.map(t => ({
        id: t.id,
        type: 'entree',
        categorie: t.categorie,
        montant: t.montant,
        description: `Paiement de ${t.eleve_prenom} ${t.eleve_nom}`,
        date_transaction: t.date_paiement,
        mode_paiement: t.mode_paiement,
        statut: t.statut
      }))
    });
  } catch (error: any) {
    console.error('Erreur API transactions récentes:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}