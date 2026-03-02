import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fichier = formData.get('fichier') as File;
    const absenceId = formData.get('absenceId') as string;

    if (!fichier) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Créer le dossier uploads
    const uploadDir = path.join(process.cwd(), 'public/uploads/justificatifs');
    await mkdir(uploadDir, { recursive: true });

    // Générer un nom de fichier unique
    const timestamp = Date.now();
    const extension = path.extname(fichier.name);
    const fileName = `justificatif_${absenceId}_${timestamp}${extension}`;
    const filePath = path.join(uploadDir, fileName);
    const publicPath = `/uploads/justificatifs/${fileName}`;

    // Sauvegarder le fichier
    const bytes = await fichier.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    return NextResponse.json({ 
      success: true, 
      url: publicPath
    });

  } catch (error) {
    console.error('Erreur upload:', error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}