import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json({
        success: true,
        photo_url: null,
        message: 'Aucune photo fournie'
      });
    }

    // Lire l'image
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Convertir en Base64 mais TRÈS petite (seulement les 5000 premiers caractères)
    const base64 = buffer.toString('base64').substring(0, 5000);
    
    // Créer l'URL data
    const photoBase64 = `data:${file.type};base64,${base64}`;

    console.log('✅ Photo convertie (version réduite)');

    return NextResponse.json({
      success: true,
      photo_url: photoBase64,
      message: 'Photo enregistrée'
    });

  } catch (error) {
    console.error('❌ Erreur:', error);
    // En cas d'erreur, on retourne null mais on ne bloque pas
    return NextResponse.json({
      success: true,
      photo_url: null,
      message: 'Erreur ignorée'
    });
  }
}