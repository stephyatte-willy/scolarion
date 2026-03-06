import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour le résultat
interface SpecialiteRow {
  specialite: string;
}

export async function GET() {
  try {
    console.log('🔵 Récupération des spécialités...');
    
    // Version simplifiée avec typage explicite
    const result = await query(`
      SELECT DISTINCT specialite 
      FROM enseignants 
      WHERE specialite IS NOT NULL AND specialite != ''
      ORDER BY specialite
    `, []) as SpecialiteRow[];
    
    // Extraire les spécialités
    const specialitesBDD = Array.isArray(result) 
      ? result.map(row => row.specialite).filter(Boolean)
      : [];

    // Liste de spécialités par défaut
    const specialitesParDefaut = [
      'Français',
      'Mathématiques',
      'Histoire-Géographie',
      'Anglais',
      'Espagnol',
      'Allemand',
      'SVT',
      'Physique-Chimie',
      'SES',
      'SNT',
      'EPS',
      'Philosophie',
      'Informatique'
    ];

    // Fusionner et retourner
    const toutesSpecialites = [...new Set([...specialitesBDD, ...specialitesParDefaut])];
    const specialitesTriees = toutesSpecialites.sort((a, b) => a.localeCompare(b));

    console.log(`✅ ${specialitesTriees.length} spécialités récupérées`);

    return NextResponse.json({
      success: true,
      specialites: specialitesTriees
    });

  } catch (error: any) {
    console.error('❌ Erreur spécialités:', error);
    
    // Retourner la liste par défaut en cas d'erreur
    const specialitesSecours = [
      'Français',
      'Mathématiques',
      'Histoire-Géographie',
      'Anglais',
      'SVT',
      'Physique-Chimie',
      'EPS',
      'SES',
      'Philosophie'
    ].sort((a, b) => a.localeCompare(b));

    return NextResponse.json({
      success: true,
      specialites: specialitesSecours
    });
  }
}