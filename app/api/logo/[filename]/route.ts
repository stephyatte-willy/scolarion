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
    
    // Sécuriser le nom du fichier (empêcher les attaques de type path traversal)
    const safeFilename = path.basename(filename);
    const filePath = path.join('/tmp/uploads/logos', safeFilename);
    
    console.log('🔍 Recherche du logo:', filePath);
    
    // Vérifier si le fichier existe
    if (!existsSync(filePath)) {
      console.log('❌ Fichier non trouvé:', filePath);
      return NextResponse.json(
        { success: false, erreur: 'Logo non trouvé' },
        { status: 404 }
      );
    }
    
    // Lire le fichier
    const fileBuffer = await readFile(filePath);
    
    // Déterminer le type MIME
    const ext = safeFilename.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    const contentType = mimeTypes[ext] || 'image/jpeg';
    
    console.log('✅ Logo trouvé, taille:', fileBuffer.length, 'type:', contentType);
    
    // Retourner l'image
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache 24h
      },
    });
    
  } catch (error) {
    console.error('❌ Erreur lecture logo:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}