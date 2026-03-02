// app/api/matieres-primaires/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour typer les résultats des requêtes
interface MatierePrimaireRow {
  id: number;
  nom: string;
  code_matiere: string;
  niveau: string;
  description: string | null;
  couleur: string;
  icone: string | null;
  coefficient: number | string;
  note_sur: number | string;
  ordre_affichage: number | string;
  statut: string;
  created_at: string;
  updated_at: string;
}

interface QueryResult {
  insertId?: number;
  affectedRows?: number;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET matières primaires démarré');
    
    const { searchParams } = new URL(request.url);
    const niveau = searchParams.get('niveau');
    const statut = searchParams.get('statut');

    let sql = `
      SELECT * FROM matieres_primaire 
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (niveau && niveau !== 'tous') {
      sql += ' AND niveau = ?';
      params.push(niveau);
    }

    if (statut && statut !== 'tous') {
      sql += ' AND statut = ?';
      params.push(statut);
    }

    sql += ' ORDER BY ordre_affichage ASC, nom ASC';

    console.log('📝 SQL matières:', sql);
    
    let matieres: MatierePrimaireRow[] = [];
    try {
      const result = await query(sql, params);
      matieres = Array.isArray(result) ? result as MatierePrimaireRow[] : [];
      console.log(`✅ ${matieres.length} matières trouvées`);
    } catch (dbError: any) {
      console.error('❌ Erreur base de données matières:', dbError.message);
      return NextResponse.json({
        success: false,
        error: 'Erreur base de données',
        matieres: []
      }, { status: 500 });
    }

    // Formater les données - convertissez TOUS les nombres
    const matieresFormatees = matieres.map((matiere: MatierePrimaireRow) => {
      // Gestion robuste des nombres
      const coefficient = matiere.coefficient 
        ? typeof matiere.coefficient === 'string' 
          ? parseFloat(matiere.coefficient) 
          : Number(matiere.coefficient)
        : 1.0;
      
      const noteSur = matiere.note_sur 
        ? typeof matiere.note_sur === 'string'
          ? parseFloat(matiere.note_sur)
          : Number(matiere.note_sur)
        : 20.0;
      
      const ordreAffichage = matiere.ordre_affichage
        ? typeof matiere.ordre_affichage === 'string'
          ? parseInt(matiere.ordre_affichage)
          : Number(matiere.ordre_affichage)
        : 0;

      return {
        id: matiere.id,
        nom: matiere.nom || '',
        code_matiere: matiere.code_matiere || '',
        niveau: matiere.niveau || 'primaire',
        description: matiere.description || '',
        couleur: matiere.couleur || '#3B82F6',
        icone: matiere.icone || '📚',
        coefficient: coefficient,
        note_sur: noteSur,
        ordre_affichage: ordreAffichage,
        statut: matiere.statut || 'actif',
        created_at: matiere.created_at,
        updated_at: matiere.updated_at
      };
    });

    return NextResponse.json({
      success: true,
      matieres: matieresFormatees,
      metadata: {
        total: matieresFormatees.length,
        niveaux_disponibles: [...new Set(matieresFormatees.map(m => m.niveau))]
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur GET matières primaires:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message}`,
        matieres: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST création matière démarré');
    
    const data = await request.json();
    console.log('📦 Données reçues:', data);
    console.log('🎨 Icône reçue:', data.icone); // Vérification

    // Validation
    if (!data.nom || data.nom.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Le nom de la matière est requis' },
        { status: 400 }
      );
    }
    
    const coefficient = parseFloat(data.coefficient) || 1.0;
    if (coefficient <= 0) {
      return NextResponse.json(
        { success: false, error: 'Le coefficient doit être supérieur à 0' },
        { status: 400 }
      );
    }
    
    const noteSur = parseFloat(data.note_sur) || 20.0;
    if (noteSur <= 0) {
      return NextResponse.json(
        { success: false, error: 'La note sur doit être supérieure à 0' },
        { status: 400 }
      );
    }

    // Générer un code si vide
    const codeMatiere = data.code_matiere || 
      `${data.nom.substring(0, 4).toUpperCase().replace(/\s/g, '')}-PRIM-${Date.now().toString().slice(-4)}`;

    // Vérifier si le code existe déjà
    const checkSql = 'SELECT id FROM matieres_primaire WHERE code_matiere = ?';
    const existing = await query(checkSql, [codeMatiere]) as MatierePrimaireRow[];
    
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Une matière avec ce code existe déjà' },
        { status: 400 }
      );
    }

    // IMPORTANT: S'assurer que l'icône est bien envoyée
    const icone = data.icone || '📚';
    console.log('🎨 Icône à sauvegarder:', icone);

    const sql = `
      INSERT INTO matieres_primaire (
        nom, code_matiere, niveau, description,
        couleur, icone, coefficient, note_sur,
        ordre_affichage, statut, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;
    
    const params = [
      data.nom.trim(),
      codeMatiere,
      data.niveau || 'primaire',
      data.description || '',
      data.couleur || '#3B82F6',
      icone, // Utiliser la variable icone
      coefficient,
      noteSur,
      parseInt(data.ordre_affichage) || 0,
      data.statut || 'actif'
    ];

    console.log('📝 SQL création matière:', sql);
    console.log('📝 Paramètres complets:', params);
    console.log('🎨 Icône dans paramètres:', params[5]); // Vérification

    let result: QueryResult;
    try {
      result = await query(sql, params) as QueryResult;
      console.log('✅ Matière créée, ID:', result.insertId);
    } catch (dbError: any) {
      console.error('❌ Erreur création matière:', dbError.message);
      return NextResponse.json({
        success: false,
        error: `Erreur base de données: ${dbError.message}`
      }, { status: 500 });
    }

    // Récupérer la matière créée
    const getSql = 'SELECT * FROM matieres_primaire WHERE id = ?';
    const getResult = await query(getSql, [result.insertId]) as MatierePrimaireRow[];
    
    if (!getResult || getResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Matière créée mais non récupérable'
      }, { status: 500 });
    }
    
    const matiere = getResult[0];
    console.log('🎨 Icône récupérée de la BD:', matiere.icone); // Vérification

    // Formater la matière
    const matiereFormatee = {
      id: matiere.id,
      nom: matiere.nom,
      code_matiere: matiere.code_matiere,
      niveau: matiere.niveau,
      description: matiere.description || '',
      couleur: matiere.couleur || '#3B82F6',
      icone: matiere.icone || '📚',
      coefficient: parseFloat(matiere.coefficient as string) || 1.0,
      note_sur: parseFloat(matiere.note_sur as string) || 20.0,
      ordre_affichage: parseInt(matiere.ordre_affichage as string) || 0,
      statut: matiere.statut || 'actif',
      created_at: matiere.created_at,
      updated_at: matiere.updated_at
    };

    return NextResponse.json({
      success: true,
      matiere: matiereFormatee,
      message: 'Matière créée avec succès'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Erreur POST matière:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur création: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

// PUT: Mettre à jour une matière
// Dans la fonction PUT, assurez-vous que l'icône est bien mise à jour :

export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 PUT modification matière démarré');
    
    const data = await request.json();
    console.log('📦 Données reçues:', data);
    console.log('🎨 Icône reçue pour mise à jour:', data.icone);

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID de la matière est requis' },
        { status: 400 }
      );
    }

    // Vérifier que la matière existe
    const checkSql = 'SELECT * FROM matieres_primaire WHERE id = ?';
    const checkResult = await query(checkSql, [data.id]) as MatierePrimaireRow[];
    
    if (!checkResult || checkResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Matière non trouvée' },
        { status: 404 }
      );
    }

    const existing = checkResult[0];

    // Vérifier que le nouveau code n'existe pas déjà
    if (data.code_matiere && data.code_matiere !== existing.code_matiere) {
      const codeCheckSql = 'SELECT id FROM matieres_primaire WHERE code_matiere = ? AND id != ?';
      const codeExists = await query(codeCheckSql, [data.code_matiere, data.id]) as MatierePrimaireRow[];
      
      if (codeExists && codeExists.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Ce code matière existe déjà' },
          { status: 400 }
        );
      }
    }

    const coefficient = parseFloat(data.coefficient) || parseFloat(existing.coefficient as string) || 1.0;
    const noteSur = parseFloat(data.note_sur) || parseFloat(existing.note_sur as string) || 20.0;
    
    // IMPORTANT: Récupérer l'icône
    const icone = data.icone || existing.icone || '📚';
    console.log('🎨 Icône à sauvegarder (mise à jour):', icone);

    const sql = `
      UPDATE matieres_primaire 
      SET nom = ?, code_matiere = ?, niveau = ?, description = ?,
          couleur = ?, icone = ?, coefficient = ?, note_sur = ?,
          ordre_affichage = ?, statut = ?, updated_at = NOW()
      WHERE id = ?
    `;
    
    const params = [
      data.nom || existing.nom,
      data.code_matiere || existing.code_matiere,
      data.niveau || existing.niveau,
      data.description !== undefined ? data.description : existing.description,
      data.couleur || existing.couleur,
      icone, // Utiliser la variable icone
      coefficient,
      noteSur,
      data.ordre_affichage !== undefined ? parseInt(data.ordre_affichage) : parseInt(existing.ordre_affichage as string) || 0,
      data.statut || existing.statut,
      data.id
    ];

    console.log('📝 SQL UPDATE:', sql);
    console.log('📝 Paramètres complets:', params);
    console.log('🎨 Icône dans paramètres:', params[5]); // Vérification

    await query(sql, params);

    // Récupérer la matière mise à jour
    const getSql = 'SELECT * FROM matieres_primaire WHERE id = ?';
    const getResult = await query(getSql, [data.id]) as MatierePrimaireRow[];
    
    if (!getResult || getResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Matière mise à jour mais non récupérable'
      }, { status: 500 });
    }
    
    const matiere = getResult[0];
    console.log('🎨 Icône récupérée après mise à jour:', matiere.icone);

    const matiereFormatee = {
      id: matiere.id,
      nom: matiere.nom,
      code_matiere: matiere.code_matiere,
      niveau: matiere.niveau,
      description: matiere.description || '',
      couleur: matiere.couleur || '#3B82F6',
      icone: matiere.icone || '📚',
      coefficient: parseFloat(matiere.coefficient as string) || 1.0,
      note_sur: parseFloat(matiere.note_sur as string) || 20.0,
      ordre_affichage: parseInt(matiere.ordre_affichage as string) || 0,
      statut: matiere.statut || 'actif',
      created_at: matiere.created_at,
      updated_at: matiere.updated_at
    };

    return NextResponse.json({
      success: true,
      matiere: matiereFormatee,
      message: 'Matière mise à jour avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur PUT matière:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur mise à jour: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

// DELETE: Supprimer une matière
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ DELETE suppression matière démarré');
    
    const data = await request.json();
    console.log('📦 Données reçues:', data);

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'L\'ID de la matière est requis' },
        { status: 400 }
      );
    }

    // Vérifier que la matière existe
    const checkSql = 'SELECT * FROM matieres_primaire WHERE id = ?';
    const checkResult = await query(checkSql, [data.id]) as MatierePrimaireRow[];
    
    if (!checkResult || checkResult.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Matière non trouvée' },
        { status: 404 }
      );
    }

    // ===== NOUVEAU CODE À INSÉRER ICI =====
    // Vérifier qu'aucune note n'utilise cette matière
    const checkNotesSql = 'SELECT COUNT(*) as count FROM notes WHERE matiere_id = ?';
    const notesResult = await query(checkNotesSql, [data.id]) as any[];
    
    if (notesResult[0]?.count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cette matière ne peut pas être supprimée car elle est utilisée dans des notes' 
        },
        { status: 400 }
      );
    }
    // ===== FIN DU NOUVEAU CODE =====

    // Vérifier qu'aucun cours n'utilise cette matière
    const checkCoursSql = 'SELECT COUNT(*) as count FROM cours WHERE matiere_id = ?';
    const coursResult = await query(checkCoursSql, [data.id]) as any[];
    
    if (coursResult && coursResult[0] && coursResult[0].count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Impossible de supprimer cette matière car elle est utilisée par un ou plusieurs cours' 
        },
        { status: 400 }
      );
    }

    const sql = 'DELETE FROM matieres_primaire WHERE id = ?';
    console.log('📝 SQL DELETE:', sql);
    console.log('📝 Paramètres:', [data.id]);

    await query(sql, [data.id]);

    return NextResponse.json({
      success: true,
      message: 'Matière supprimée avec succès',
      matiere: checkResult[0]
    });

  } catch (error: any) {
    console.error('❌ Erreur DELETE matière:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur suppression: ${error.message}` 
      },
      { status: 500 }
    );
  }
}