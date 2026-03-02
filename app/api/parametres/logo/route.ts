// app/api/parametres/logo/route.ts
import { NextResponse } from 'next/server';
import { writeFile, unlink, mkdir } from 'fs/promises';
import path from 'path';
import { query } from '@/app/lib/database';
import { existsSync } from 'fs';

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

    // Créer le dossier uploads/logos s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Générer un nom de fichier unique
    const extension = file.type.split('/')[1];
    const fileName = `logo_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
    const filePath = path.join(uploadDir, fileName);
    
    // Convertir le fichier en buffer et l'enregistrer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // URL publique du logo
    const logoUrl = `/uploads/logos/${fileName}`;

    // Mettre à jour la base de données
    const existing = await query('SELECT id FROM parametres LIMIT 1') as any[];
    
    if (existing && existing.length > 0) {
      // Récupérer l'ancien logo pour le supprimer
      const oldLogo = await query('SELECT logo_url FROM parametres WHERE id = 1') as any[];
      if (oldLogo && oldLogo.length > 0 && oldLogo[0].logo_url) {
        const oldFilePath = path.join(process.cwd(), 'public', oldLogo[0].logo_url);
        try {
          if (existsSync(oldFilePath)) {
            await unlink(oldFilePath);
          }
        } catch (error) {
          console.error('Erreur suppression ancien logo:', error);
        }
      }

      // Mettre à jour avec le nouveau logo
      await query(
        'UPDATE parametres SET logo_url = ?, updated_at = NOW() WHERE id = 1',
        [logoUrl]
      );
    } else {
      // Insérer si la table est vide
      await query(
        `INSERT INTO parametres (nom_ecole, logo_url, annee_scolaire, created_at, updated_at) 
         VALUES ('École', ?, '2024-2025', NOW(), NOW())`,
        [logoUrl]
      );
    }

    return NextResponse.json({ 
      success: true, 
      logo_url: logoUrl,
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
      const filePath = path.join(process.cwd(), 'public', logoUrl);
      
      // Supprimer le fichier physique
      try {
        if (existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (error) {
        console.error('Erreur suppression fichier logo:', error);
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