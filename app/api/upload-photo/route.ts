import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('photo') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, erreur: 'Aucun fichier' },
        { status: 400 }
      );
    }

    // Vérifications
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, erreur: 'Format non supporté' },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, erreur: 'Image trop volumineuse (max 5MB)' },
        { status: 400 }
      );
    }

    // Convertir en buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload vers Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'eleves',
          public_id: `eleve_${Date.now()}`,
          transformation: [
            { width: 300, height: 300, crop: 'fill' }, // Redimensionner
            { quality: 'auto' } // Compression automatique
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    // @ts-ignore
    const photoUrl = result.secure_url;

    console.log('✅ Photo uploadée avec succès:', photoUrl);

    return NextResponse.json({
      success: true,
      photo_url: photoUrl,
      message: 'Photo uploadée avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur upload:', error);
    return NextResponse.json(
      { success: false, erreur: error.message || 'Erreur serveur' },
      { status: 500 }
    );
  }
}