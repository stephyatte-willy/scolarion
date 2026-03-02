import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
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

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, erreur: 'Le fichier doit être une image' },
        { status: 400 }
      );
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, erreur: 'L\'image ne doit pas dépasser 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = join(process.cwd(), 'public/uploads/eleves');
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `eleve-${timestamp}.${extension}`;
    const filepath = join(uploadsDir, filename);

    // Sauvegarder le fichier
    await writeFile(filepath, buffer);

    // URL accessible publiquement
    const photoUrl = `/uploads/eleves/${filename}`;

    console.log('✅ Photo uploadée:', photoUrl);

    return NextResponse.json({
      success: true,
      photo_url: photoUrl,
      message: 'Photo uploadée avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur upload photo:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de l\'upload de la photo' },
      { status: 500 }
    );
  }
}