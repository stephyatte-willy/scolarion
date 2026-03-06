import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    
    // Sécurité : éviter les injections de chemin
    const cleanFilename = path.basename(filename);
    const filePath = path.join('/tmp/uploads/avatars', cleanFilename);
    
    if (!existsSync(filePath)) {
      console.log('❌ Avatar non trouvé:', filePath);
      return NextResponse.json(
        { success: false, erreur: 'Avatar non trouvé' },
        { status: 404 }
      );
    }

    const file = await readFile(filePath);
    
    // Déterminer le type MIME
    const extension = cleanFilename.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    
    const contentType = mimeTypes[extension || ''] || 'application/octet-stream';

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });

  } catch (error) {
    console.error('❌ Erreur lecture avatar:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}