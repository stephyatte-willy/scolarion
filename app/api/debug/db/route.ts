import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    console.log('🔍 Débugage de la base de données...');

    // Vérifier la connexion
    const connexion = await query('SELECT 1 as test') as any[];
    console.log('✅ Test connexion:', connexion);

    // Vérifier les tables
    const tables = await query('SHOW TABLES') as any[];
    console.log('📊 Tables existantes:', tables);

    // Vérifier les utilisateurs
    const utilisateurs = await query('SELECT * FROM users') as any[];
    console.log('👥 Utilisateurs:', utilisateurs);

    // Vérifier les paramètres
    const parametres = await query('SELECT * FROM parametres') as any[];
    console.log('⚙️ Paramètres:', parametres);

    return NextResponse.json({
      success: true,
      connexion: 'OK',
      tables: tables.map((t: any) => Object.values(t)[0]),
      utilisateurs: utilisateurs,
      parametres: parametres
    });

  } catch (error: any) {
    console.error('❌ Erreur de débugage:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      tables: [],
      utilisateurs: [],
      parametres: []
    }, { status: 500 });
  }
}