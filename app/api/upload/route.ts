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

    // Lire l'image et la convertir en Base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    
    // Créer l'URL data
    const photoBase64 = `data:${file.type};base64,${base64}`;

    // SI C'EST TROP LONG, on retourne une image par défaut
    if (photoBase64.length > 200000) { // 200KB max
      return NextResponse.json({
        success: true,
        photo_url: '/default-avatar.png', // Image par défaut
        message: 'Image trop grande, utilisation de l\'image par défaut'
      });
    }

    return NextResponse.json({
      success: true,
      photo_url: photoBase64,
      message: 'Photo convertie avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors du traitement' },
      { status: 500 }
    );
  }
}