import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    // Récupérer les départements de la base de données
    const sql = `
      SELECT DISTINCT departement 
      FROM enseignants 
      WHERE departement IS NOT NULL AND departement != '' AND departement != 'NULL'
      ORDER BY departement
    `;
    
    const result = await query(sql) as any[];
    const departementsBDD = result.map(row => row.departement).filter(Boolean);

    // Liste de départements prédéfinis
    const departementsPredifinis = [
      'Administration',
      'Finances',
      'Maintenance',
      'Santé',
      'Bibliothèque',
      'Informatique',
      'Secrétariat',
      'Direction',
      'Ressources Humaines',
      'Pédagogie',
      'Vie Scolaire',
      'Logistique'
    ];

    // Fusionner et supprimer les doublons
    const tousDepartements = [...new Set([...departementsBDD, ...departementsPredifinis])];
    
    // Trier par ordre alphabétique
    const departementsTries = tousDepartements.sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      departements: departementsTries
    });
  } catch (error: any) {
    console.error('Erreur récupération départements:', error);
    
    // Retourner la liste prédéfinie en cas d'erreur
    return NextResponse.json({
      success: true,
      departements: [
        'Administration',
        'Finances',
        'Maintenance',
        'Santé',
        'Bibliothèque',
        'Informatique',
        'Secrétariat',
        'Direction'
      ].sort((a, b) => a.localeCompare(b))
    });
  }
}