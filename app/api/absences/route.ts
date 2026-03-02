import { NextResponse } from 'next/server';
import { query, runTransaction } from '@/app/lib/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const classe_id = searchParams.get('classe_id');
    const periode_id = searchParams.get('periode_id');
    const date_debut = searchParams.get('date_debut');
    const date_fin = searchParams.get('date_fin');
    const type = searchParams.get('type');
    const justifiee = searchParams.get('justifiee');
    
    let sql = `
      SELECT a.*, 
        e.nom as eleve_nom, 
        e.prenom as eleve_prenom,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        co.nom_cours as cours_nom
      FROM absences a
      INNER JOIN eleves e ON a.eleve_id = e.id
      INNER JOIN classes c ON a.classe_id = c.id
      LEFT JOIN cours co ON a.cours_id = co.code_cours
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (classe_id) {
      sql += ' AND a.classe_id = ?';
      params.push(parseInt(classe_id));
    }
    
    if (periode_id && periode_id !== 'null' && periode_id !== '') {
      sql += ' AND a.periode_id = ?';
      params.push(parseInt(periode_id));
    }
    
    // CORRECTION: N'ajouter les conditions de date QUE si elles sont fournies
    if (date_debut && date_debut.trim() !== '') {
      sql += ' AND a.date_absence >= ?';
      params.push(date_debut);
    }
    
    if (date_fin && date_fin.trim() !== '') {
      sql += ' AND a.date_absence <= ?';
      params.push(date_fin);
    }
    
    if (type && type !== 'tous') {
      sql += ' AND a.type_absence = ?';
      params.push(type);
    }
    
    if (justifiee && justifiee !== 'tous' && justifiee !== '') {
      sql += ' AND a.justifiee = ?';
      params.push(parseInt(justifiee));
    }
    
    sql += ' ORDER BY a.date_absence DESC, a.created_at DESC';
    
    console.log('🔍 SQL:', sql);
    console.log('📊 Paramètres:', params);
    
    const absences = await query(sql, params);
    
    console.log('✅ Absences trouvées:', Array.isArray(absences) ? absences.length : 0);
    
    return NextResponse.json({ success: true, absences });
    
  } catch (error) {
    console.error('❌ Erreur GET absences:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la récupération des absences' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    console.log('📝 Données reçues pour création:', data);
    
    const insertId = await runTransaction(async (connection) => {
      const [result] = await connection.execute(
        `INSERT INTO absences 
         (eleve_id, date_absence, heure_debut, heure_fin, type_absence, 
          duree_minutes, justifiee, motif, piece_justificative, saisie_par, 
          classe_id, cours_id, periode_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.eleve_id,
          data.date_absence,
          data.heure_debut || null,
          data.heure_fin || null,
          data.type_absence,
          data.duree_minutes || 0,
          0, // Toujours 0 à la création
          data.motif,
          null, // Pas de justificatif à la création
          data.saisie_par,
          data.classe_id,
          data.cours_id || null,
          data.periode_id || null
        ]
      );
      
      return (result as any).insertId;
    });
    
    return NextResponse.json({ success: true, id: insertId });
    
  } catch (error) {
    console.error('❌ Erreur POST absence:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de l\'enregistrement' },
      { status: 500 }
    );
  }
}