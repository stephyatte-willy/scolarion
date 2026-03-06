import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { runTransaction } from '@/app/lib/database';
import { existsSync } from 'fs';

export async function POST(request: Request) {
  try {
    console.log('📥 API upload avatar - Début');
    
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    const userId = formData.get('userId') as string;
    
    console.log('📝 Données reçues:', { userId, fileName: file?.name });
    
    if (!file || !userId) {
      return NextResponse.json(
        { success: false, erreur: 'Fichier ou utilisateur manquant' },
        { status: 400 }
      );
    }
    
    // Validation du type de fichier
    const typesValides = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!typesValides.includes(file.type)) {
      return NextResponse.json(
        { success: false, erreur: 'Type de fichier non supporté' },
        { status: 400 }
      );
    }
    
    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, erreur: 'Fichier trop volumineux (max 5MB)' },
        { status: 400 }
      );
    }
    
    // ✅ Utiliser /tmp au lieu de public/ (comme pour les élèves)
    const uploadDir = '/tmp/uploads/avatars';
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
      console.log('📁 Dossier créé:', uploadDir);
    }
    
    // Générer un nom de fichier unique
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const timestamp = Date.now();
    const extension = path.extname(file.name);
    const filename = `avatar_${userId}_${timestamp}${extension}`;
    const filepath = path.join(uploadDir, filename);
    
    await writeFile(filepath, buffer);
    console.log('💾 Fichier sauvegardé:', filepath);
    
    // ✅ URL publique via une API (comme pour les élèves)
    const avatarUrl = `/api/avatars/${filename}`;
    
    // Mettre à jour dans la base de données
    await runTransaction(async (connection) => {
      // Mettre à jour dans users
      await connection.execute(
        'UPDATE users SET avatar_url = ? WHERE id = ?',
        [avatarUrl, userId]
      );
      console.log('✅ Avatar mis à jour dans users');
      
      // Mettre à jour dans enseignants (si l'utilisateur est un enseignant)
      await connection.execute(
        'UPDATE enseignants SET avatar_url = ? WHERE user_id = ?',
        [avatarUrl, userId]
      );
      console.log('✅ Avatar mis à jour dans enseignants');
    });
    
    console.log('✅ Upload réussi, URL:', avatarUrl);
    
    return NextResponse.json({ 
      success: true, 
      avatar_url: avatarUrl 
    });
    
  } catch (error) {
    console.error('❌ Erreur upload avatar:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}