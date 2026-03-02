import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classeId = searchParams.get('classe_id');
    const periodeId = searchParams.get('periode_id');
    const statut = searchParams.get('statut');
    const inclureSupprimees = searchParams.get('inclure_supprimees') === 'true';

    let sql = `
      SELECT c.*, 
             p.nom as periode_nom
      FROM compositions_primaire c
      LEFT JOIN periodes_primaire p ON c.periode_id = p.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (!inclureSupprimees) {
      sql += ' AND c.est_supprime = FALSE';
    }

    if (classeId && classeId !== 'tous') {
      sql += ' AND c.classe_id = ?';
      params.push(parseInt(classeId));
    }

    if (periodeId && periodeId !== 'tous') {
      sql += ' AND c.periode_id = ?';
      params.push(parseInt(periodeId));
    }

    if (statut && statut !== 'tous') {
      sql += ' AND c.statut = ?';
      params.push(statut);
    }

    sql += ' ORDER BY c.date_composition DESC, c.created_at DESC';

    const compositions = await query(sql, params);
    
    // Convertir les valeurs booléennes
    const compositionsFormatees = compositions.map((comp: any) => ({
      ...comp,
      notes_saisies: comp.notes_saisies === 1 || comp.notes_saisies === true,
      releves_generes: comp.releves_generes === 1 || comp.releves_generes === true,
      est_supprime: comp.est_supprime === 1 || comp.est_supprime === true
    }));

    return NextResponse.json({
      success: true,
      compositions: compositionsFormatees || []
    });
  } catch (error: any) {
    console.error('❌ Erreur GET compositions primaires:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message}`,
        compositions: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📥 Données création composition:', data);

    // Validation
    if (!data.titre) {
      return NextResponse.json(
        { success: false, error: 'Titre requis' },
        { status: 400 }
      );
    }

    if (!data.classe_id) {
      return NextResponse.json(
        { success: false, error: 'Classe requise' },
        { status: 400 }
      );
    }

    if (!data.date_composition) {
      return NextResponse.json(
        { success: false, error: 'Date de composition requise' },
        { status: 400 }
      );
    }

    // Générer un code unique
    const codeComposition = data.code_composition || 
      `COMP-PRIM-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Vérifier si une composition existe déjà pour cette classe et période
    const checkSql = `
      SELECT id FROM compositions_primaire 
      WHERE classe_id = ? AND periode_id = ? AND titre LIKE ? AND est_supprime = FALSE
    `;
    const existing = await query(checkSql, [
      data.classe_id, 
      data.periode_id || 0,
      `%${data.titre}%`
    ]);
    
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Une composition similaire existe déjà pour cette classe et période' },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO compositions_primaire (
        code_composition, titre, classe_id, classe_nom,
        instituteur_id, instituteur_nom, date_composition,
        periode_id, periode_nom, annee_scolaire, statut,
        notes_saisies, releves_generes, est_supprime
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, FALSE, FALSE)
    `;
    
    const params = [
      codeComposition,
      data.titre,
      data.classe_id,
      data.classe_nom || '',
      data.instituteur_id || 0,
      data.instituteur_nom || 'Inconnu',
      data.date_composition,
      data.periode_id || 0,
      data.periode_nom || '',
      data.annee_scolaire || '',
      data.statut || 'a_venir'
    ];

    console.log('📝 SQL création composition:', sql, params);
    const result: any = await query(sql, params);

    // Récupérer la composition créée
    const getSql = 'SELECT * FROM compositions_primaire WHERE id = ?';
    const [composition] = await query(getSql, [result.insertId]);

    return NextResponse.json({
      success: true,
      composition: composition,
      message: 'Composition créée avec succès'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Erreur POST composition:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la création: ${error.message}` 
      },
      { status: 500 }
    );
  }
}