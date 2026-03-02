import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get('classe_id');
    const periodeId = searchParams.get('periode_id');

    // 1. Vérifier le contenu de la table
    const sqlTotal = 'SELECT COUNT(*) as total FROM releves_primaire';
    const resultTotal = await query(sqlTotal);
    const totalReleves = resultTotal[0]?.total || 0;

    // 2. Vérifier les relevés pour cette classe et période
    let sqlFiltre = 'SELECT * FROM releves_primaire WHERE 1=1';
    const params: any[] = [];
    
    if (classeId && classeId !== '0') {
      sqlFiltre += ' AND classe_id = ?';
      params.push(parseInt(classeId));
    }
    
    if (periodeId && periodeId !== '0') {
      sqlFiltre += ' AND periode_id = ?';
      params.push(parseInt(periodeId));
    }
    
    sqlFiltre += ' LIMIT 10';
    
    const relevesFiltres = await query(sqlFiltre, params);

    // 3. Vérifier la structure des données
    const relevesAvecProblemes = relevesFiltres.filter((releve: any) => {
      try {
        if (releve.moyennes_par_matiere) {
          if (typeof releve.moyennes_par_matiere === 'string') {
            JSON.parse(releve.moyennes_par_matiere);
          }
        }
        return false; // Pas de problème
      } catch (error) {
        return true; // Problème détecté
      }
    });

    return NextResponse.json({
      success: true,
      verification: {
        total_releves_base: totalReleves,
        releves_filtres: relevesFiltres.length,
        classe_id: classeId,
        periode_id: periodeId,
        releves_trouves: relevesFiltres.map((r: any) => ({
          id: r.id,
          eleve: `${r.eleve_nom} ${r.eleve_prenom}`,
          moyenne: r.moyenne_generale,
          rang: r.rang,
          date_generation: r.date_generation
        })),
        problemes_detectes: relevesAvecProblemes.length > 0 ? 'OUI' : 'NON',
        details_problemes: relevesAvecProblemes.map((r: any) => ({
          id: r.id,
          eleve: `${r.eleve_nom} ${r.eleve_prenom}`,
          probleme: 'JSON invalide dans moyennes_par_matiere'
        }))
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      verification: {
        erreur: true
      }
    });
  }
}