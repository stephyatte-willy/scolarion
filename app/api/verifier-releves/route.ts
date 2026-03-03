import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour les résultats de comptage
interface CountResult {
  total: number;
}

// Interface pour un relevé
interface Releve {
  id: number;
  eleve_nom: string;
  eleve_prenom: string;
  moyenne_generale: number;
  rang: number;
  date_generation: string;
  moyennes_par_matiere?: string | any;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get('classe_id');
    const periodeId = searchParams.get('periode_id');

    // 1. Vérifier le contenu de la table avec typage explicite
    const sqlTotal = 'SELECT COUNT(*) as total FROM releves_primaire';
    const resultTotal = await query(sqlTotal) as CountResult[];
    
    // ✅ Vérifier que c'est un tableau avant d'accéder à l'index 0
    const totalReleves = Array.isArray(resultTotal) && resultTotal.length > 0 
      ? Number(resultTotal[0].total) || 0 
      : 0;

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
    
    const relevesFiltres = await query(sqlFiltre, params) as Releve[];
    
    // ✅ S'assurer que c'est un tableau
    const relevesArray = Array.isArray(relevesFiltres) ? relevesFiltres : [];

    // 3. Vérifier la structure des données
    const relevesAvecProblemes = relevesArray.filter((releve: Releve) => {
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
        releves_filtres: relevesArray.length,
        classe_id: classeId,
        periode_id: periodeId,
        releves_trouves: relevesArray.map((r: Releve) => ({
          id: r.id,
          eleve: `${r.eleve_nom} ${r.eleve_prenom}`,
          moyenne: r.moyenne_generale,
          rang: r.rang,
          date_generation: r.date_generation
        })),
        problemes_detectes: relevesAvecProblemes.length > 0 ? 'OUI' : 'NON',
        details_problemes: relevesAvecProblemes.map((r: Releve) => ({
          id: r.id,
          eleve: `${r.eleve_nom} ${r.eleve_prenom}`,
          probleme: 'JSON invalide dans moyennes_par_matiere'
        }))
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur vérification relevés:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      verification: {
        erreur: true
      }
    }, { status: 500 });
  }
}