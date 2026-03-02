import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';

function genererIdUnique(): string {
  return `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function POST(request: NextRequest) {
  let filePath: string | null = null;

  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    const userId = formData.get('userId') as string;

    console.log('🔄 Upload avatar pour l\'utilisateur:', userId);

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, erreur: 'Fichier et ID utilisateur requis' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    const typesValides = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!typesValides.includes(file.type)) {
      return NextResponse.json(
        { success: false, erreur: 'Type de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP.' },
        { status: 400 }
      );
    }

    // Validation de la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, erreur: 'Le fichier ne doit pas dépasser 2MB' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const utilisateurExist = await query(
      'SELECT id, avatar_url FROM users WHERE id = ?',
      [userId]
    ) as any[];

    if (utilisateurExist.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Créer le dossier de uploads
    const uploadsDir = join(process.cwd(), 'public', 'uploads', 'avatars');
    await mkdir(uploadsDir, { recursive: true });

    // Générer un nom de fichier unique
    const fileExtension = file.type.split('/')[1] || 'jpg';
    const fileName = `${genererIdUnique()}.${fileExtension}`;
    filePath = join(uploadsDir, fileName);

    // Convertir et écrire le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Vérifier que le fichier a été correctement écrit
    const stats = await import('fs').then(fs => fs.promises.stat(filePath));
    if (stats.size === 0) {
      throw new Error('Fichier écrit de taille 0');
    }

    // Chemin d'accès public
    const publicUrl = `/uploads/avatars/${fileName}`;

    // Supprimer l'ancien avatar s'il existe (fichier physique)
    const ancienUtilisateur = utilisateurExist[0];
    if (ancienUtilisateur.avatar_url && ancienUtilisateur.avatar_url.startsWith('/uploads/')) {
      try {
        const ancienPath = join(process.cwd(), 'public', ancienUtilisateur.avatar_url);
        await unlink(ancienPath);
        console.log('🗑️ Ancien avatar supprimé:', ancienUtilisateur.avatar_url);
      } catch (error) {
        console.log('ℹ️ Ancien avatar non trouvé ou déjà supprimé');
      }
    }

    // Mettre à jour l'avatar dans la base de données
    await query(
      'UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?',
      [publicUrl, userId]
    );

    console.log('✅ Avatar uploadé avec succès:', publicUrl);

    return NextResponse.json({
      success: true,
      message: 'Avatar mis à jour avec succès',
      avatar_url: publicUrl
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de l\'upload de l\'avatar:', error);
    
    // Nettoyer le fichier partiellement uploadé en cas d'erreur
    if (filePath) {
      try {
        await unlink(filePath);
        console.log('🗑️ Fichier partiellement uploadé supprimé');
      } catch (cleanupError) {
        console.error('❌ Erreur lors du nettoyage du fichier:', cleanupError);
      }
    }
    
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de l\'upload de l\'image' },
      { status: 500 }
    );
  }
}