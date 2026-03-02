import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour typer les résultats
interface VersementScolarite {
  id: number;
  eleve_id: number;
  frais_scolaire_id: number;
  numero_versement: number;
  montant_versement: number;
  montant_paye: number;
  date_echeance: string;
  statut: string;
  // Autres champs si nécessaire
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eleveId = searchParams.get('eleve_id');

    if (!eleveId) {
      return NextResponse.json({ success: false, erreur: 'ID élève requis' });
    }

    // Historique des paiements
    const paiements = await query(`
      SELECT 
        p.*,
        cf.nom as categorie_nom,
        fs.montant as montant_total
      FROM paiements_frais p
      INNER JOIN frais_scolaires fs ON p.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE p.eleve_id = ?
      ORDER BY p.date_paiement DESC
    `, [eleveId]);

    // Prochain versement
    const prochainVersement = await query(`
      SELECT *
      FROM versements_scolarite 
      WHERE eleve_id = ? 
        AND (statut = 'en_attente' OR statut = 'partiel' OR statut = 'en_retard')
      ORDER BY date_echeance ASC 
      LIMIT 1
    `, [eleveId]) as VersementScolarite[];

    // ✅ CORRECTION : Accès sécurisé au premier élément
    const prochainVersementData = Array.isArray(prochainVersement) && prochainVersement.length > 0 
      ? prochainVersement[0] 
      : null;

    return NextResponse.json({
      success: true,
      paiements,
      prochain_versement: prochainVersementData
    });
  } catch (error: any) {
    console.error('Erreur détails élève:', error);
    return NextResponse.json({ success: false, erreur: error.message });
  }
}