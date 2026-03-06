import { NextRequest, NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, erreur: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validation des types d'images
    const typesValides = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!typesValides.includes(file.type)) {
      return NextResponse.json(
        { success: false, erreur: 'Format non supporté. Utilisez JPEG, PNG, GIF ou WebP' },
        { status: 400 }
      );
    }

    // Validation de la taille (max 2MB pour les photos d'élèves)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, erreur: 'Image trop volumineuse (max 2MB)' },
        { status: 400 }
      );
    }

    // ✅ Utiliser /tmp pour l'écriture temporaire (comme pour le logo)
    const uploadDir = '/tmp/uploads/eleves';
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `eleve_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // ✅ URL publique via une API
    const photoUrl = `/api/eleves/photo/${fileName}`;

    return NextResponse.json({ 
      success: true, 
      photo_url: photoUrl,
      message: 'Photo téléchargée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur upload photo élève:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur lors du téléchargement' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('file');
    
    if (!fileName) {
      return NextResponse.json(
        { success: false, erreur: 'Nom de fichier manquant' },
        { status: 400 }
      );
    }

    const filePath = path.join('/tmp/uploads/eleves', fileName);
    
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Photo supprimée' 
    });

  } catch (error) {
    console.error('❌ Erreur suppression photo:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}