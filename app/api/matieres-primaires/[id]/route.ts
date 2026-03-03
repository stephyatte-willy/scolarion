import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour une matière
interface Matiere {
  id: number;
  nom: string;
  code_matiere?: string;
  niveau?: string;
  description?: string;
  couleur?: string;
  icone?: string;
  coefficient: number | string;
  note_sur: number | string;
  ordre_affichage?: number | string;
  statut?: string;
  est_supprime?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID invalide' },
        { status: 400 }
      );
    }

    const sql = 'SELECT * FROM matieres_primaire WHERE id = ?';
    const result = await query(sql, [idNum]) as Matiere[];
    
    // ✅ Vérification avec Array.isArray
    if (!Array.isArray(result) || result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Matière non trouvée' },
        { status: 404 }
      );
    }

    const matiere = result[0];
    const matiereFormatee = {
      ...matiere,
      coefficient: parseFloat(matiere.coefficient as string) || 1.0,
      note_sur: parseFloat(matiere.note_sur as string) || 20.0,
      ordre_affichage: parseInt(matiere.ordre_affichage as string) || 0
    };

    return NextResponse.json({
      success: true,
      matiere: matiereFormatee
    });

  } catch (error: any) {
    console.error('❌ Erreur GET matière par ID:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID invalide' },
        { status: 400 }
      );
    }

    const data = await request.json();
    
    // Validation
    if (data.nom && data.nom.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Le nom de la matière est requis' },
        { status: 400 }
      );
    }
    
    if (data.coefficient !== undefined) {
      const coefficient = parseFloat(data.coefficient);
      if (coefficient <= 0) {
        return NextResponse.json(
          { success: false, error: 'Le coefficient doit être supérieur à 0' },
          { status: 400 }
        );
      }
    }
    
    if (data.note_sur !== undefined) {
      const noteSur = parseFloat(data.note_sur);
      if (noteSur <= 0) {
        return NextResponse.json(
          { success: false, error: 'La note sur doit être supérieure à 0' },
          { status: 400 }
        );
      }
    }

    // Vérifier si la matière existe
    const checkSql = 'SELECT id FROM matieres_primaire WHERE id = ?';
    const existing = await query(checkSql, [idNum]) as Matiere[];
    
    // ✅ Vérification avec Array.isArray
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Matière non trouvée' },
        { status: 404 }
      );
    }

    // Construire la requête UPDATE dynamiquement
    const updateFields = [];
    const updateParams = [];

    if (data.nom !== undefined) {
      updateFields.push('nom = ?');
      updateParams.push(data.nom.trim());
    }
    
    if (data.code_matiere !== undefined) {
      updateFields.push('code_matiere = ?');
      updateParams.push(data.code_matiere);
    }
    
    if (data.niveau !== undefined) {
      updateFields.push('niveau = ?');
      updateParams.push(data.niveau);
    }
    
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateParams.push(data.description);
    }
    
    if (data.couleur !== undefined) {
      updateFields.push('couleur = ?');
      updateParams.push(data.couleur);
    }
    
    if (data.icone !== undefined) {
      updateFields.push('icone = ?');
      updateParams.push(data.icone);
    }
    
    if (data.coefficient !== undefined) {
      updateFields.push('coefficient = ?');
      updateParams.push(parseFloat(data.coefficient));
    }
    
    if (data.note_sur !== undefined) {
      updateFields.push('note_sur = ?');
      updateParams.push(parseFloat(data.note_sur));
    }
    
    if (data.ordre_affichage !== undefined) {
      updateFields.push('ordre_affichage = ?');
      updateParams.push(parseInt(data.ordre_affichage));
    }
    
    if (data.statut !== undefined) {
      updateFields.push('statut = ?');
      updateParams.push(data.statut);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }

    updateFields.push('updated_at = NOW()');
    updateParams.push(idNum);
    
    const updateSql = `UPDATE matieres_primaire SET ${updateFields.join(', ')} WHERE id = ?`;
    
    console.log('📝 SQL UPDATE matière:', updateSql);
    console.log('📝 Paramètres:', updateParams);

    await query(updateSql, updateParams);

    // Récupérer la matière mise à jour
    const updatedMatiere = await query(checkSql, [idNum]) as Matiere[];
    const matiere = Array.isArray(updatedMatiere) && updatedMatiere.length > 0 ? updatedMatiere[0] : null;

    const matiereFormatee = matiere ? {
      ...matiere,
      coefficient: parseFloat(matiere.coefficient as string) || 1.0,
      note_sur: parseFloat(matiere.note_sur as string) || 20.0,
      ordre_affichage: parseInt(matiere.ordre_affichage as string) || 0
    } : null;

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

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const idNum = parseInt(id);
    
    if (isNaN(idNum) || idNum <= 0) {
      return NextResponse.json(
        { success: false, error: 'ID invalide' },
        { status: 400 }
      );
    }

    // Vérifier si la matière existe
    const checkSql = 'SELECT id, nom FROM matieres_primaire WHERE id = ?';
    const existing = await query(checkSql, [idNum]) as Matiere[];
    
    // ✅ Vérification avec Array.isArray
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Matière non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si la matière est utilisée dans des notes
    const checkUsageSql = 'SELECT id FROM notes_primaire WHERE matiere_id = ? LIMIT 1';
    const usage = await query(checkUsageSql, [idNum]) as any[];
    
    if (Array.isArray(usage) && usage.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cette matière ne peut pas être supprimée car elle est utilisée dans des notes' 
        },
        { status: 400 }
      );
    }

    const deleteSql = 'DELETE FROM matieres_primaire WHERE id = ?';
    await query(deleteSql, [idNum]);

    return NextResponse.json({
      success: true,
      message: 'Matière supprimée avec succès'
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