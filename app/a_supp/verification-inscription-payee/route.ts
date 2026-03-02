import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour typer les résultats de la requête
interface InscriptionResult {
  id: number;
  montant: number;
  montant_paye: number;
  statut: string;
  eleve_nom: string;
  eleve_prenom: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const eleveId = searchParams.get('eleve_id');
    const anneeScolaire = searchParams.get('annee_scolaire') || '2025-2026';

    if (!eleveId) {
      return NextResponse.json({ 
        success: false, 
        erreur: 'ID élève requis' 
      });
    }

    // Vérifier directement si une inscription payée existe
    const inscriptionPayee = await query(`
      SELECT 
        fe.id,
        fe.montant,
        fe.montant_paye,
        fe.statut,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom
      FROM frais_eleves fe
      INNER JOIN eleves e ON fe.eleve_id = e.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      WHERE fe.eleve_id = ?
        AND fs.categorie_frais_id = 2  -- ID 2 = Frais d'inscription
        AND fe.annee_scolaire = ?
        AND fe.statut = 'paye'
      LIMIT 1
    `, [parseInt(eleveId), anneeScolaire]) as InscriptionResult[];

    // ✅ CORRECTION : Vérification de type sécurisée
    const hasInscriptionPayee = Array.isArray(inscriptionPayee) && inscriptionPayee.length > 0;
    const firstResult = hasInscriptionPayee ? inscriptionPayee[0] : null;

    return NextResponse.json({
      success: true,
      inscriptionPayee: hasInscriptionPayee,
      details: firstResult
    });

  } catch (error: any) {
    console.error('Erreur vérification inscription payée:', error);
    return NextResponse.json({ 
      success: false, 
      erreur: error.message 
    });
  }
}