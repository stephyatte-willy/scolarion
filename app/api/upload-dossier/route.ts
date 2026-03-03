import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  console.log('📤 API Upload Dossier - Début');
  
  try {
    // ✅ Dans l'App Router, FormData est automatiquement disponible
    // Pas besoin de bodyParser: false, c'est géré nativement
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

    // Créer le dossier s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'dossiers');
    console.log('📁 Chemin upload:', uploadDir);
    
    if (!fs.existsSync(uploadDir)) {
      console.log('📁 Création dossier...');
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('✅ Dossier créé');
    }

    // Vérifier les permissions
    try {
      fs.accessSync(uploadDir, fs.constants.W_OK);
      console.log('✅ Permissions OK');
    } catch (error) {
      console.error('❌ Pas de permissions en écriture sur:', uploadDir);
      return NextResponse.json(
        { success: false, erreur: 'Erreur de permissions sur le dossier de stockage' },
        { status: 500 }
      );
    }

    // Nettoyer le nom du fichier
    const nomOriginal = file.name;
    const extension = path.extname(nomOriginal) || '';
    const nomSansExtension = path.basename(nomOriginal, extension);
    
    // Remplacer les caractères spéciaux
    const nomNettoye = nomSansExtension
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Enlève les accents
      .replace(/[^a-zA-Z0-9_-]/g, '_') // Remplace les caractères spéciaux
      .substring(0, 50); // Limiter la longueur
    
    // Créer un nom de fichier unique
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const nomFichier = `${matricule}_${nomNettoye}_${timestamp}_${random}${extension}`.toLowerCase();
    const cheminFichier = path.join(uploadDir, nomFichier);

    console.log('📁 Sauvegarde fichier:', {
      nomOriginal,
      nomFichier,
      chemin: cheminFichier,
      taille: Math.round(file.size / 1024) + ' KB'
    });

    // Convertir le fichier en ArrayBuffer puis Buffer
    console.log('📤 Conversion fichier en buffer...');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('📤 Écriture fichier...');
    await fs.promises.writeFile(cheminFichier, buffer);
    
    // Vérifier que le fichier a été écrit
    if (!fs.existsSync(cheminFichier)) {
      throw new Error('Fichier non créé après écriture');
    }
    
    const stats = fs.statSync(cheminFichier);
    console.log('✅ Fichier sauvegardé:', {
      taille: stats.size + ' bytes',
      chemin: cheminFichier,
      existe: fs.existsSync(cheminFichier)
    });

    // Lister les fichiers dans le dossier pour vérifier
    const fichiersExistants = fs.readdirSync(uploadDir);
    console.log('📁 Fichiers dans uploads/dossiers:', fichiersExistants);

    // URL accessible depuis le web
    const url = `/uploads/dossiers/${nomFichier}`;

    console.log('✅ Upload réussi, URL:', url);
    
    return NextResponse.json({
      success: true,
      url: url,
      nomFichier: nomFichier,
      nomOriginal: nomOriginal,
      taille: file.size,
      type: file.type,
      date: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Erreur upload dossier:', error);
    console.error('❌ Stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Unknown error'}`,
        details: error.stack 
      },
      { status: 500 }
    );
  }
}