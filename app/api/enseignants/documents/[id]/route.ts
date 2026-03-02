import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { query } from '@/app/lib/database';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const documentId = parseInt(id);

    if (isNaN(documentId)) {
      return NextResponse.json(
        { success: false, erreur: 'ID document invalide' },
        { status: 400 }
      );
    }

    // Récupérer les informations du document
    const sqlSelect = 'SELECT * FROM documents_enseignants WHERE id = ?';
    const documents = await query(sqlSelect, [documentId]) as any[];
    
    if (documents.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Document non trouvé' },
        { status: 404 }
      );
    }

    const document = documents[0];

    // Supprimer le fichier physique
    const filePath = path.join(process.cwd(), 'public', document.chemin_fichier);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('⚠️ Impossible de supprimer le fichier physique:', error);
    }

    // Supprimer de la base de données
    const sqlDelete = 'DELETE FROM documents_enseignants WHERE id = ?';
    await query(sqlDelete, [documentId]);

    return NextResponse.json({
      success: true,
      message: 'Document supprimé avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur suppression document:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}