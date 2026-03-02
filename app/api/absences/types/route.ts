import { NextRequest, NextResponse } from 'next/server';
import { query, runTransaction } from '@/app/lib/database';

// GET - Récupérer tous les types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut') || 'actif';

    let sql = 'SELECT * FROM types_absence WHERE 1=1';
    const params: any[] = [];

    if (statut !== 'tous') {
      sql += ' AND statut = ?';
      params.push(statut);
    }

    sql += ' ORDER BY id';

    const types = await query(sql, params);
    
    return NextResponse.json({ success: true, types });
    
  } catch (error) {
    console.error('❌ Erreur GET types:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des types' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau type
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validation
    if (!data.libelle || !data.code) {
      return NextResponse.json(
        { success: false, error: 'Libellé et code requis' },
        { status: 400 }
      );
    }

    // Vérifier si le code existe déjà
    const checkSql = 'SELECT id FROM types_absence WHERE code = ?';
    const existing = await query(checkSql, [data.code]) as any[];
    
    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Ce code est déjà utilisé' },
        { status: 400 }
      );
    }

    const insertId = await runTransaction(async (connection) => {
      const [result] = await connection.execute(
        `INSERT INTO types_absence 
         (libelle, code, description, couleur, icone, statut)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.libelle,
          data.code,
          data.description || null,
          data.couleur || '#64748b',
          data.icone || '📅',
          data.statut || 'actif'
        ]
      );
      return (result as any).insertId;
    });

    return NextResponse.json({ 
      success: true, 
      id: insertId,
      message: 'Type créé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur POST type:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un type
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    const data = await request.json();
    
    await runTransaction(async (connection) => {
      await connection.execute(
        `UPDATE types_absence SET
          libelle = ?,
          code = ?,
          description = ?,
          couleur = ?,
          icone = ?,
          statut = ?
         WHERE id = ?`,
        [
          data.libelle,
          data.code,
          data.description || null,
          data.couleur || '#64748b',
          data.icone || '📅',
          data.statut || 'actif',
          id
        ]
      );
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Type modifié avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur PUT type:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un type
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID requis' },
        { status: 400 }
      );
    }

    // Vérifier si le type est utilisé
    const checkSql = 'SELECT COUNT(*) as count FROM absences WHERE type_absence = (SELECT code FROM types_absence WHERE id = ?)';
    const result = await query(checkSql, [id]) as any[];
    
    if (result[0].count > 0) {
      return NextResponse.json(
        { success: false, error: 'Ce type est utilisé dans des absences, vous ne pouvez pas le supprimer' },
        { status: 400 }
      );
    }

    await query('DELETE FROM types_absence WHERE id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Type supprimé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur DELETE type:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}