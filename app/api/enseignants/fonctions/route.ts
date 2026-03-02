import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    // Récupérer les fonctions de la base de données
    const sql = `
      SELECT DISTINCT fonction 
      FROM enseignants 
      WHERE fonction IS NOT NULL AND fonction != '' AND fonction != 'NULL'
      ORDER BY fonction
    `;
    
    const result = await query(sql) as any[];
    const fonctionsBDD = result.map(row => row.fonction).filter(Boolean);

    // Liste de fonctions prédéfinies
    const fonctionsPredifinies = [
      'Secrétaire',
      'Comptable',
      'Surveillant',
      'Concierge',
      'Infirmier',
      'Bibliothécaire',
      'Psychologue scolaire',
      'Assistant administratif',
      'Responsable informatique',
      'Chef de maintenance',
      'Agent de service',
      'Directeur administratif',
      'Assistant de direction',
      'Archiviste',
      'Standardiste'
    ];

    // Fusionner et supprimer les doublons
    const toutesFonctions = [...new Set([...fonctionsBDD, ...fonctionsPredifinies])];
    
    // Trier par ordre alphabétique
    const fonctionsTriees = toutesFonctions.sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      fonctions: fonctionsTriees
    });
  } catch (error: any) {
    console.error('Erreur récupération fonctions:', error);
    
    // Retourner la liste prédéfinie en cas d'erreur
    return NextResponse.json({
      success: true,
      fonctions: [
        'Secrétaire',
        'Comptable',
        'Surveillant',
        'Concierge',
        'Infirmier',
        'Bibliothécaire',
        'Psychologue scolaire',
        'Assistant administratif'
      ].sort((a, b) => a.localeCompare(b))
    });
  }
}