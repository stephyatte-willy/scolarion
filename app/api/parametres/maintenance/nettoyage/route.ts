import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';
import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'backups');

export async function POST() {
  try {
    const resultats: any = {
      tablesOptimisees: [],
      fichiersTempSupprimes: 0,
      logsSupprimes: 0
    };
    
    // 1. Essayer d'optimiser les tables
    const tables = ['users', 'enseignants', 'eleves', 'classes', 'logs_activite'];
    
    for (const table of tables) {
      try {
        await query(`OPTIMIZE TABLE ${table}`);
        resultats.tablesOptimisees.push(table);
      } catch (e) {
        console.log(`Table ${table} non optimisée:`, e);
      }
    }
    
    // 2. Supprimer les logs de plus de 30 jours si la table existe
    try {
      const [result] = await query(
        `DELETE FROM logs_activite 
         WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
      ) as any;
      resultats.logsSupprimes = result?.affectedRows || 0;
    } catch (e) {
      console.log('Table logs_activite peut-être absente');
    }
    
    // 3. Nettoyer les fichiers temporaires
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR)
        .filter(file => file.startsWith('temp_') || file.endsWith('.tmp'));
      
      for (const file of files) {
        try {
          fs.unlinkSync(path.join(BACKUP_DIR, file));
          resultats.fichiersTempSupprimes++;
        } catch (e) {
          console.error(`Erreur suppression ${file}:`, e);
        }
      }
    }
    
    // 4. Créer un log (optionnel)
    try {
      await query(
        'INSERT INTO logs_activite (action, details, created_at) VALUES (?, ?, NOW())',
        ['maintenance', `Nettoyage effectué: ${resultats.tablesOptimisees.length} tables optimisées`]
      );
    } catch (e) {
      console.log('Log ignoré');
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Nettoyage terminé: ${resultats.tablesOptimisees.length} tables optimisées`,
      resultats 
    });
    
  } catch (error: any) {
    console.error('Erreur nettoyage:', error);
    return NextResponse.json(
      { success: false, erreur: error.message || 'Erreur lors du nettoyage' }
    );
  }
}