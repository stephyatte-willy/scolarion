import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = parseInt(params.userId);
    
    const sql = `
      SELECT e.*, u.email, u.role
      FROM enseignants e
      INNER JOIN users u ON e.user_id = u.id
      WHERE e.user_id = ?
    `;
    
    const employes = await query(sql, [userId]) as any[];
    
    if (!employes || employes.length === 0) {
      return NextResponse.json({ success: true, employe: null });
    }
    
    return NextResponse.json({ success: true, employe: employes[0] });
    
  } catch (error) {
    console.error('Erreur GET employe:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}