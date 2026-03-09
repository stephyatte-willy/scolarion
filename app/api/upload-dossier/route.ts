import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('📤 API Upload Dossier - Début');
  
  try {
    const formData = await request.formData();
    console.log('📤 FormData reçu, clés:', Array.from(formData.keys()));
    
    const file = formData.get('dossier') as File;
    const nomEleve = formData.get('nomEleve') as string || 'Inconnu';
    const matricule = formData.get('matricule') as string || 'NOUVEAU';
    
    console.log('📤 Données reçues:', {
      nomEleve,
      matricule,
      nomFichier: file?.name,
      taille: file?.size,
      type: file?.type,
      existe: !!file
    });

    if (!file || file.size === 0) {
      console.error('❌ Aucun fichier valide reçu');
      return NextResponse.json(
        { success: false, erreur: 'Aucun fichier fourni ou fichier vide' },
        { status: 400 }
      );
    }

    // Valider la taille du fichier (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      console.error('❌ Fichier trop volumineux:', file.size, '>', MAX_SIZE);
      return NextResponse.json(
        { success: false, erreur: 'Fichier trop volumineux (max 10MB)' },
        { status: 400 }
      );
    }

    // Valider le type de fichier
    const typesAutorises = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!typesAutorises.includes(file.type)) {
      console.error('❌ Type de fichier non autorisé:', file.type);
      return NextResponse.json(
        { success: false, erreur: 'Type de fichier non autorisé' },
        { status: 400 }
      );
    }

    // Convertir le fichier en base64
    console.log('📤 Conversion en base64...');
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;
    
    console.log('✅ Conversion réussie, taille base64:', dataURI.length, 'caractères');

    // Créer l'objet dossier physique avec le bon format
    const dossierPhysique = {
      url: dataURI,
      nomOriginal: file.name,
      taille: file.size,
      type: file.type,
      date: new Date().toISOString()
    };

    console.log('✅ Dossier physique créé:', {
      nomOriginal: dossierPhysique.nomOriginal,
      taille: dossierPhysique.taille,
      type: dossierPhysique.type,
      urlLength: dossierPhysique.url.length
    });
    
    return NextResponse.json({
      success: true,
      dossier: dossierPhysique,
      message: 'Fichier converti avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur upload dossier:', error);
    console.error('❌ Stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}`,
        details: error.stack 
      },
      { status: 500 }
    );
  }
}