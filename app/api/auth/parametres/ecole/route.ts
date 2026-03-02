import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    const sql = 'SELECT * FROM parametres LIMIT 1';
    const parametres = await query(sql) as any[];
    
    return NextResponse.json({
      success: true,
      parametres: parametres[0] || null
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    return NextResponse.json(
      { erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}