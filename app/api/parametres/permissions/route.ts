import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    const sql = 'SELECT * FROM permissions ORDER BY module, nom';
    const rows = await query(sql);
    
    return NextResponse.json({ success: true, permissions: rows });
  } catch (error) {
    console.error('Erreur GET permissions:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}