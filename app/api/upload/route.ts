import { NextRequest, NextResponse } from 'next/server';

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

    // Convertir l'image en Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // Créer l'URL data (format: data:image/jpeg;base64,XXXXX)
    const mimeType = file.type;
    const photoBase64 = `data:${mimeType};base64,${base64}`;

    console.log('✅ Photo convertie en Base64, taille:', Math.round(base64.length / 1024), 'KB');

    return NextResponse.json({
      success: true,
      photo_url: photoBase64, // C'est directement l'image en texte !
      message: 'Photo convertie avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur conversion photo:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors du traitement de la photo' },
      { status: 500 }
    );
  }
}