import { NextResponse } from 'next/server';
import sharp from 'sharp';

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

    console.log('📤 Conversion en base64...');
    const bytes = await fichier.arrayBuffer();
    let buffer: Buffer = Buffer.from(bytes); // ✅ Type explicite
    let finalType = fichier.type;
    
    // ✅ Si c'est une image, la compresser pour réduire la taille
    if (fichier.type.startsWith('image/')) {
      try {
        console.log('🖼️ Compression de l\'image...');
        
        // Utiliser sharp pour compresser l'image
        const compressedBuffer = await sharp(buffer)
          .resize(800, 800, { // Redimensionner si trop grande
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 70 }) // Convertir en JPEG avec qualité 70%
          .toBuffer();
        
        buffer = Buffer.from(compressedBuffer); // ✅ Conversion explicite en Buffer
        finalType = 'image/jpeg';
        console.log('✅ Image compressée, nouvelle taille:', buffer.length, 'bytes');
      } catch (compressError) {
        console.error('⚠️ Erreur compression, utilisation de l\'original:', compressError);
        // Continuer avec l'original si la compression échoue
      }
    }
    
    // Convertir en base64
    const base64 = buffer.toString('base64');
    const dataURI = `data:${finalType};base64,${base64}`;

    console.log('✅ Conversion réussie, taille base64 finale:', dataURI.length, 'caractères');

    return NextResponse.json({
      success: true,
      url: dataURI,
      nomFichier: fichier.name,
      type: finalType,
      taille: buffer.length
    });

  } catch (error) {
    console.error('❌ Erreur upload justificatif:', error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'upload" },
      { status: 500 }
    );
  }
}