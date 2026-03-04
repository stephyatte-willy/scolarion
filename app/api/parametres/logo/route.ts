// app/api/parametres/logo/route.ts
import { NextResponse } from 'next/server';
import { put, del } from '@vercel/blob';
import { query } from '@/app/lib/database';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, erreur: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    const typesValides = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!typesValides.includes(file.type)) {
      return NextResponse.json(
        { success: false, erreur: 'Format de fichier non supporté. Utilisez JPEG, PNG, GIF ou WebP' },
        { status: 400 }
      );
    }

    // Validation de la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, erreur: 'Le fichier ne doit pas dépasser 5MB' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const extension = file.name.split('.').pop() || file.type.split('/')[1];
    const fileName = `logos/logo_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;

    // Upload vers Vercel Blob
    const blob = await put(fileName, file, {
      access: 'public',
      addRandomSuffix: false,
    });

    // Mettre à jour la base de données
    const existing = await query('SELECT id, logo_url FROM parametres LIMIT 1') as any[];
    
    if (existing && existing.length > 0) {
      // Supprimer l'ancien logo du Blob s'il existe
      const oldLogoUrl = existing[0].logo_url;
      if (oldLogoUrl && oldLogoUrl.includes('blob.vercel-storage.com')) {
        try {
          await del(oldLogoUrl);
        } catch (error) {
          console.error('Erreur suppression ancien logo du Blob:', error);
        }
      }

      // Mettre à jour avec le nouveau logo
      await query(
        'UPDATE parametres SET logo_url = ?, updated_at = NOW() WHERE id = 1',
        [blob.url]
      );
    } else {
      // Insérer si la table est vide
      await query(
        `INSERT INTO parametres (nom_ecole, logo_url, annee_scolaire, created_at, updated_at) 
         VALUES ('École', ?, '2024-2025', NOW(), NOW())`,
        [blob.url]
      );
    }

    return NextResponse.json({ 
      success: true, 
      logo_url: blob.url,
      message: 'Logo téléchargé avec succès' 
    });

  } catch (error: any) {
    console.error('Erreur upload logo:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors du téléchargement du logo' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    // Récupérer l'URL du logo actuel
    const result = await query('SELECT logo_url FROM parametres WHERE id = 1') as any[];
    
    if (result && result.length > 0 && result[0].logo_url) {
      const logoUrl = result[0].logo_url;
      
      // Supprimer du Blob si c'est une URL Vercel Blob
      if (logoUrl.includes('blob.vercel-storage.com')) {
        try {
          await del(logoUrl);
        } catch (error) {
          console.error('Erreur suppression du Blob:', error);
        }
      }

      // Mettre à jour la base de données
      await query(
        'UPDATE parametres SET logo_url = NULL, updated_at = NOW() WHERE id = 1'
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Logo supprimé avec succès' 
    });

  } catch (error: any) {
    console.error('Erreur suppression logo:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la suppression du logo' },
      { status: 500 }
    );
  }
}
