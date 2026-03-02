import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { query } from '@/app/lib/database';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Créer le dossier s'il n'existe pas
try {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('✅ Dossier backups créé');
  }
} catch (error) {
  console.error('❌ Erreur création dossier backups:', error);
}

export async function GET() {
  try {
    console.log('📥 Chargement des sauvegardes...');
    
    // Vérifier si le dossier existe
    if (!fs.existsSync(BACKUP_DIR)) {
      return NextResponse.json({ 
        success: true, 
        sauvegardes: [] 
      });
    }
    
    // Lire tous les fichiers .sql
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith('.sql'));
    
    console.log(`📋 ${files.length} fichiers trouvés`);
    
    // Créer un tableau de sauvegardes avec des IDs persistants
    const sauvegardes = await Promise.all(files.map(async (file) => {
      const filePath = path.join(BACKUP_DIR, file);
      const stats = fs.statSync(filePath);
      
      // Essayer de lire l'ID depuis un fichier .id ou utiliser le timestamp comme fallback
      let id: number;
      const idFilePath = path.join(BACKUP_DIR, `${file}.id`);
      
      if (fs.existsSync(idFilePath)) {
        // Lire l'ID depuis le fichier
        id = parseInt(fs.readFileSync(idFilePath, 'utf8'));
      } else {
        // Générer un ID basé sur le timestamp et le sauvegarder
        id = parseInt(Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000));
        fs.writeFileSync(idFilePath, id.toString());
      }
      
      // Essayer de lire le type depuis un fichier .type
      let type: 'automatique' | 'manuelle' = 'manuelle';
      const typeFilePath = path.join(BACKUP_DIR, `${file}.type`);
      
      if (fs.existsSync(typeFilePath)) {
        type = fs.readFileSync(typeFilePath, 'utf8') as 'automatique' | 'manuelle';
      } else if (file.startsWith('auto_')) {
        type = 'automatique';
        fs.writeFileSync(typeFilePath, 'automatique');
      } else {
        fs.writeFileSync(typeFilePath, 'manuelle');
      }
      
      return {
        id,
        nom_fichier: file,
        taille: formatBytes(stats.size),
        date_creation: stats.mtime.toISOString(),
        type,
        statut: 'succès'
      };
    }));
    
    // Trier par date de création (plus récent d'abord)
    sauvegardes.sort((a, b) => 
      new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime()
    );
    
    console.log(`✅ ${sauvegardes.length} sauvegardes chargées`);
    
    return NextResponse.json({ 
      success: true, 
      sauvegardes 
    });
    
  } catch (error: any) {
    console.error('❌ Erreur GET sauvegardes:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: error.message || 'Erreur lors de la récupération',
        sauvegardes: [] 
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const filename = `backup_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);
    
    console.log('💾 Création sauvegarde:', filename);
    
    // Générer un ID unique et persistant
    const id = parseInt(Date.now().toString().slice(-8) + Math.floor(Math.random() * 1000));
    
    // Créer le fichier de sauvegarde
    const content = `-- Sauvegarde du ${new Date().toLocaleString('fr-FR')}
-- Fichier: ${filename}
-- ID: ${id}
-- Date de création: ${new Date().toISOString()}

-- Cette sauvegarde a été créée manuellement le ${new Date().toLocaleString('fr-FR')}

CREATE TABLE IF NOT EXISTS backup_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date_sauvegarde DATETIME,
  fichier VARCHAR(255),
  backup_id INT
);

INSERT INTO backup_log (date_sauvegarde, fichier, backup_id) 
VALUES (NOW(), '${filename}', ${id});
`;
    
    fs.writeFileSync(filepath, content, 'utf8');
    
    // Sauvegarder l'ID et le type dans des fichiers séparés
    fs.writeFileSync(path.join(BACKUP_DIR, `${filename}.id`), id.toString());
    fs.writeFileSync(path.join(BACKUP_DIR, `${filename}.type`), 'manuelle');
    
    console.log('✅ Fichier créé avec ID:', id);
    
    // Créer un log dans la base de données (optionnel)
    try {
      await query(
        'INSERT INTO logs_activite (action, details, created_at) VALUES (?, ?, NOW())',
        ['sauvegarde', `Sauvegarde manuelle: ${filename} (ID: ${id})`]
      );
    } catch (logError) {
      console.log('ℹ️ Log non enregistré (table peut-être absente)');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sauvegarde créée avec succès',
      fichier: filename,
      id
    });
    
  } catch (error: any) {
    console.error('❌ Erreur POST sauvegarde:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: error.message || 'Erreur lors de la sauvegarde' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, erreur: 'ID non fourni' },
        { status: 400 }
      );
    }
    
    console.log('🗑️ Suppression sauvegarde ID:', id);
    
    // Lister tous les fichiers .sql et .id et .type
    const files = fs.readdirSync(BACKUP_DIR);
    
    // Chercher le fichier .id correspondant
    const idFile = files.find(f => f === `${id}.id`);
    
    if (!idFile) {
      return NextResponse.json(
        { success: false, erreur: 'Sauvegarde non trouvée' },
        { status: 404 }
      );
    }
    
    // Lire le nom du fichier de sauvegarde depuis le fichier .id
    const backupFileName = idFile.replace('.id', '');
    const backupFilePath = path.join(BACKUP_DIR, backupFileName);
    const typeFilePath = path.join(BACKUP_DIR, `${backupFileName}.type`);
    
    // Supprimer les fichiers associés
    if (fs.existsSync(backupFilePath)) {
      fs.unlinkSync(backupFilePath);
      console.log('✅ Fichier supprimé:', backupFileName);
    }
    
    if (fs.existsSync(typeFilePath)) {
      fs.unlinkSync(typeFilePath);
    }
    
    fs.unlinkSync(path.join(BACKUP_DIR, idFile));
    
    // Créer un log
    try {
      await query(
        'INSERT INTO logs_activite (action, details, created_at) VALUES (?, ?, NOW())',
        ['suppression', `Sauvegarde supprimée: ${backupFileName}`]
      );
    } catch (logError) {
      console.log('ℹ️ Log non enregistré');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Sauvegarde supprimée' 
    });
    
  } catch (error: any) {
    console.error('❌ Erreur DELETE sauvegarde:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: error.message || 'Erreur lors de la suppression' 
      },
      { status: 500 }
    );
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}