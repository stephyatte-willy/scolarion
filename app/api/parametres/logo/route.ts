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
      return NextResponse.json({ success: false, erreur: 'Aucun fichier' });
    }

    // Validation
    const typesValides = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!typesValides.includes(file.type)) {
      return NextResponse.json({ success: false, erreur: 'Format non supporté' });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ success: false, erreur: 'Fichier trop volumineux' });
    }

    // ✅ Utiliser /tmp pour l'écriture
    const uploadDir = '/tmp/uploads/logos';
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `logo_${Date.now()}.${extension}`;
    const filePath = path.join(uploadDir, fileName);
    
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // ✅ URL publique via l'API
    const logoUrl = `/api/logos/${fileName}`;

    // Mettre à jour la BDD
    await query('UPDATE parametres SET logo_url = ?, updated_at = NOW() WHERE id = 1', [logoUrl]);

    return NextResponse.json({ success: true, logo_url: logoUrl });

  } catch (error) {
    console.error('❌ Erreur:', error);
    return NextResponse.json({ success: false, erreur: 'Erreur serveur' });
  }
}

export async function DELETE() {
  try {
    const result = await query('SELECT logo_url FROM parametres WHERE id = 1') as any[];
    
    if (result && result.length > 0 && result[0].logo_url) {
      const logoUrl = result[0].logo_url;
      
      // Extraire le nom du fichier de l'URL
      const fileName = logoUrl.split('/').pop();
      if (fileName) {
        const filePath = path.join('/tmp/uploads/logos', fileName);
        try {
          if (existsSync(filePath)) {
            await unlink(filePath);
          }
        } catch (error) {
          console.error('Erreur suppression fichier:', error);
        }
      }

      await query('UPDATE parametres SET logo_url = NULL, updated_at = NOW() WHERE id = 1');
    }

    return NextResponse.json({ success: true, message: 'Logo supprimé' });

  } catch (error) {
    console.error('❌ Erreur suppression:', error);
    return NextResponse.json({ success: false, erreur: 'Erreur serveur' });
  }
}