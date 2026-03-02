import { NextRequest, NextResponse } from 'next/server';
import { query, runTransaction } from '@/app/lib/database';

// GET - Récupérer tous les motifs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statut = searchParams.get('statut') || 'actif';
    const type = searchParams.get('type');

    let sql = 'SELECT * FROM motifs_absence WHERE 1=1';
    const params: any[] = [];

    if (statut !== 'tous') {
      sql += ' AND statut = ?';
      params.push(statut);
    }

    if (type && type !== 'tous') {
      sql += ' AND type_absence = ?';
      params.push(type);
    }

    sql += ' ORDER BY type_absence, libelle';

    const motifs = await query(sql, params);
    
    return NextResponse.json({ success: true, motifs });
    
  } catch (error) {
    console.error('❌ Erreur GET motifs:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des motifs' },
      { status: 500 }
    );
  }
}

// POST - Créer un nouveau motif
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Validation
    if (!data.libelle || !data.type_absence) {
      return NextResponse.json(
        { success: false, error: 'Libellé et type requis' },
        { status: 400 }
      );
    }

    const insertId = await runTransaction(async (connection) => {
      const [result] = await connection.execute(
        `INSERT INTO motifs_absence 
         (libelle, description, type_absence, justifiable, couleur, statut)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.libelle,
          data.description || null,
          data.type_absence,
          data.justifiable ? 1 : 0,
          data.couleur || '#64748b',
          data.statut || 'actif'
        ]
      );
      return (result as any).insertId;
    });

    return NextResponse.json({ 
      success: true, 
      id: insertId,
      message: 'Motif créé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur POST motif:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}

// PUT - Modifier un motif
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
        `UPDATE motifs_absence SET
          libelle = ?,
          description = ?,
          type_absence = ?,
          justifiable = ?,
          couleur = ?,
          statut = ?
         WHERE id = ?`,
        [
          data.libelle,
          data.description || null,
          data.type_absence,
          data.justifiable ? 1 : 0,
          data.couleur || '#64748b',
          data.statut || 'actif',
          id
        ]
      );
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Motif modifié avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur PUT motif:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer un motif
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

    // Vérifier si le motif est utilisé
    const checkSql = 'SELECT COUNT(*) as count FROM absences WHERE motif = (SELECT libelle FROM motifs_absence WHERE id = ?)';
    const result = await query(checkSql, [id]) as any[];
    
    if (result[0].count > 0) {
      return NextResponse.json(
        { success: false, error: 'Ce motif est utilisé dans des absences, vous ne pouvez pas le supprimer' },
        { status: 400 }
      );
    }

    await query('DELETE FROM motifs_absence WHERE id = ?', [id]);

    return NextResponse.json({ 
      success: true, 
      message: 'Motif supprimé avec succès'
    });
    
  } catch (error) {
    console.error('❌ Erreur DELETE motif:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}