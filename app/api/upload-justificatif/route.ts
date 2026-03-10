import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('📤 API Upload Justificatif - Début');
  
  try {
    const formData = await request.formData();
    const fichier = formData.get('fichier') as File;
    const absenceId = formData.get('absenceId') as string;

    console.log('📤 Données reçues:', {
      absenceId,
      nomFichier: fichier?.name,
      taille: fichier?.size,
      type: fichier?.type,
      existe: !!fichier
    });

    if (!fichier) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validation de la taille (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (fichier.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Le fichier ne doit pas dépasser 5MB' },
        { status: 400 }
      );
    }

    // Validation du type
    const typesValides = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    if (!typesValides.includes(fichier.type)) {
      return NextResponse.json(
        { success: false, error: 'Type de fichier non supporté' },
        { status: 400 }
      );
    }

    // Convertir le fichier en base64
    console.log('📤 Conversion en base64...');
    const bytes = await fichier.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${fichier.type};base64,${base64}`;

    console.log('✅ Conversion réussie, taille base64:', dataURI.length, 'caractères');

    return NextResponse.json({
      success: true,
      url: dataURI,
      nomFichier: fichier.name,
      type: fichier.type,
      taille: fichier.size
    });

  } catch (error) {
    console.error('❌ Erreur upload justificatif:', error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}