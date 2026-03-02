import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    // Test direct de la base de données
    const sql = 'SELECT COUNT(*) as count FROM classes';
    const result = await query(sql) as any[];
    const nombreClasses = result[0]?.count || 0;
    
    // Récupérer quelques classes pour vérifier
    const sqlClasses = `
      SELECT id, nom, niveau, professeur_principal_id 
      FROM classes 
      ORDER BY id 
      LIMIT 10
    `;
    const classes = await query(sqlClasses) as any[];
    
    return NextResponse.json({
      success: true,
      nombreClasses,
      classes,
      message: `Base de données accessible. ${nombreClasses} classes trouvées.`
    });
  } catch (error: any) {
    console.error('❌ Erreur test classes:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}