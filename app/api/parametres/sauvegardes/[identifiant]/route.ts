import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// S'assurer que le dossier existe
if (!fs.existsSync(BACKUP_DIR)) {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('✅ Dossier backups créé');
  } catch (error) {
    console.error('❌ Erreur création dossier backups:', error);
  }
}

// Interface pour les paramètres
interface RouteParams {
  params: Promise<{
    identifiant: string;
  }>;
}

export async function GET(
  request: NextRequest,  // ✅ Utilisation de NextRequest
  { params }: RouteParams  // ✅ Utilisation de l'interface avec Promise
) {
  try {
    // ✅ Récupération asynchrone de l'identifiant
    const { identifiant } = await params;
    console.log('📥 API GET - Téléchargement sauvegarde:', identifiant);
    console.log('📂 Dossier backups:', BACKUP_DIR);
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(BACKUP_DIR)) {
      console.error('❌ Dossier backups inexistant');
      return NextResponse.json(
        { success: false, erreur: 'Dossier de sauvegarde non trouvé' },
        { status: 404 }
      );
    }
    
    // Lister les fichiers disponibles
    const fichiersExistants = fs.readdirSync(BACKUP_DIR);
    console.log('📋 Fichiers disponibles:', fichiersExistants);
    
    // Vérifier si c'est un ID numérique ou un nom de fichier
    const isNumeric = /^\d+$/.test(identifiant);
    
    if (isNumeric) {
      // C'est une demande de téléchargement par ID
      const id = parseInt(identifiant);
      console.log('🔍 Recherche par ID:', id);
      
      // Trouver le fichier correspondant à l'ID
      const files = fichiersExistants
        .filter(file => file.endsWith('.sql') || file.endsWith('.zip') || file.endsWith('.gz'))
        .map(file => {
          const stats = fs.statSync(path.join(BACKUP_DIR, file));
          return {
            id: Date.now() - stats.mtimeMs,
            nom_fichier: file,
            path: path.join(BACKUP_DIR, file)
          };
        });
      
      console.log('📊 Fichiers avec IDs:', files.map(f => ({ id: f.id, nom: f.nom_fichier })));
      
      const fichier = files.find(f => f.id === id);
      
      if (!fichier) {
        console.error('❌ Aucun fichier trouvé avec ID:', id);
        return NextResponse.json(
          { success: false, erreur: 'Sauvegarde non trouvée' },
          { status: 404 }
        );
      }
      
      console.log('✅ Fichier trouvé:', fichier.nom_fichier);
      
      // Vérifier que le fichier existe toujours
      if (!fs.existsSync(fichier.path)) {
        console.error('❌ Fichier introuvable sur le disque:', fichier.path);
        return NextResponse.json(
          { success: false, erreur: 'Fichier de sauvegarde introuvable' },
          { status: 404 }
        );
      }
      
      // Lire le fichier
      const fileBuffer = fs.readFileSync(fichier.path);
      console.log('📦 Taille du fichier:', fileBuffer.length, 'bytes');
      
      // Retourner le fichier
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fichier.nom_fichier)}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
      
    } else {
      // C'est une demande de téléchargement par nom de fichier
      console.log('🔍 Recherche par nom:', identifiant);
      
      // Nettoyer le nom du fichier (éviter les injections de chemin)
      const cleanFilename = path.basename(identifiant);
      const filepath = path.join(BACKUP_DIR, cleanFilename);
      
      console.log('📁 Chemin complet:', filepath);
      
      if (!fs.existsSync(filepath)) {
        console.error('❌ Fichier non trouvé:', filepath);
        return NextResponse.json(
          { success: false, erreur: 'Fichier non trouvé' },
          { status: 404 }
        );
      }
      
      const fileBuffer = fs.readFileSync(filepath);
      console.log('📦 Taille du fichier:', fileBuffer.length, 'bytes');
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(cleanFilename)}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    }
    
  } catch (error: any) {
    console.error('❌ Erreur téléchargement:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: error.message || 'Erreur lors du téléchargement',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,  // ✅ Utilisation de NextRequest
  { params }: RouteParams  // ✅ Réutilisation de l'interface
) {
  try {
    // ✅ Récupération asynchrone de l'identifiant
    const { identifiant } = await params;
    console.log('🔴 API DELETE sauvegarde:', identifiant);
    
    // Vérifier si c'est un ID numérique
    if (!/^\d+$/.test(identifiant)) {
      console.error('❌ ID non numérique:', identifiant);
      return NextResponse.json(
        { success: false, erreur: 'ID invalide' },
        { status: 400 }
      );
    }
    
    const id = parseInt(identifiant);
    console.log('🔍 Recherche par ID:', id);
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(BACKUP_DIR)) {
      console.error('❌ Dossier backups inexistant');
      return NextResponse.json(
        { success: false, erreur: 'Dossier de sauvegarde non trouvé' },
        { status: 404 }
      );
    }
    
    // Lister les fichiers
    const fichiersExistants = fs.readdirSync(BACKUP_DIR);
    console.log('📋 Fichiers disponibles:', fichiersExistants);
    
    // Trouver le fichier correspondant à l'ID
    const files = fichiersExistants
      .filter(file => file.endsWith('.sql') || file.endsWith('.zip') || file.endsWith('.gz'))
      .map(file => {
        const stats = fs.statSync(path.join(BACKUP_DIR, file));
        return {
          id: Date.now() - stats.mtimeMs,
          nom_fichier: file,
          path: path.join(BACKUP_DIR, file)
        };
      });
    
    console.log('📊 Fichiers avec IDs:', files.map(f => ({ id: f.id, nom: f.nom_fichier })));
    
    const fichier = files.find(f => Math.abs(f.id - id) < 1000); // Marge d'erreur de 1 seconde
    
    if (!fichier) {
      console.error('❌ Aucun fichier trouvé avec ID proche de:', id);
      return NextResponse.json(
        { success: false, erreur: 'Sauvegarde non trouvée' },
        { status: 404 }
      );
    }
    
    console.log('✅ Fichier trouvé:', fichier.nom_fichier);
    
    // Vérifier que le fichier existe
    if (!fs.existsSync(fichier.path)) {
      console.error('❌ Fichier introuvable sur le disque:', fichier.path);
      return NextResponse.json(
        { success: false, erreur: 'Fichier de sauvegarde introuvable' },
        { status: 404 }
      );
    }
    
    // Supprimer le fichier
    fs.unlinkSync(fichier.path);
    console.log('✅ Fichier supprimé avec succès');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sauvegarde supprimée avec succès' 
    });
    
  } catch (error: any) {
    console.error('❌ Erreur DELETE sauvegarde:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: error.message || 'Erreur lors de la suppression',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
