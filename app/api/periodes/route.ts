import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const annee = searchParams.get('annee');
    const statut = searchParams.get('statut');

    let sql = 'SELECT * FROM periodes WHERE 1=1';
    const params: any[] = [];

    if (annee && annee !== 'tous') {
      sql += ' AND annee_scolaire = ?';
      params.push(annee);
    }

    if (statut && statut !== 'tous') {
      sql += ' AND statut = ?';
      params.push(statut);
    }

    sql += ' ORDER BY date_debut DESC';

    console.log('📝 SQL périodes:', sql);
    const periodes = await query(sql, params);

    return NextResponse.json({
      success: true,
      periodes: periodes || []
    });
  } catch (error: any) {
    console.error('❌ Erreur GET périodes:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message}`,
        periodes: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validation des champs requis
    if (!data.nom || !data.annee_scolaire || !data.date_debut || !data.date_fin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Les champs nom, année scolaire, date début et date fin sont requis' 
        },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO periodes (
        nom, annee_scolaire, date_debut, date_fin, 
        type_periode, numero, statut, code_periode
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    // Convertir undefined en null
    const params = [
      data.nom || null,
      data.annee_scolaire || null,
      data.date_debut || null,
      data.date_fin || null,
      data.type_periode || 'trimestre',
      data.numero || 1,
      data.statut || 'active',
      data.code_periode || null
    ];

    console.log('📝 SQL création période:', sql, params);
    await query(sql, params);

    return NextResponse.json({
      success: true,
      message: 'Période créée avec succès'
    }, { status: 201 });
  } catch (error: any) {
    console.error('❌ Erreur POST période:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la création: ${error.message}` 
      },
      { status: 500 }
    );
  }
}