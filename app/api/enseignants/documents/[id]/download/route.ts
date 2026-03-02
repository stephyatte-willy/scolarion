import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { query } from '@/app/lib/database';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
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
    const sql = 'SELECT * FROM documents_enseignants WHERE id = ?';
    const documents = await query(sql, [documentId]) as any[];
    
    if (documents.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Document non trouvé' },
        { status: 404 }
      );
    }

    const document = documents[0];
    const filePath = path.join(process.cwd(), 'public', document.chemin_fichier);

    // Vérifier si le fichier existe
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json(
        { success: false, erreur: 'Fichier non trouvé sur le serveur' },
        { status: 404 }
      );
    }

    // Lire le fichier
    const fileBuffer = await fs.readFile(filePath);
    const headers = new Headers();
    
    // Déterminer le type MIME
    const extension = path.extname(document.nom_fichier).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.txt': 'text/plain'
    };

    const contentType = mimeTypes[extension] || 'application/octet-stream';
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(document.nom_fichier)}"`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error: any) {
    console.error('❌ Erreur téléchargement document:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}