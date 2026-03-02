import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    // Utiliser query directement pour tester
    await query('SELECT 1');
    return NextResponse.json({
      success: true,
      status: {
        connected: true,
        message: 'Connexion à la base de données établie'
      }
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}