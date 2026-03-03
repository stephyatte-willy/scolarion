import { NextRequest, NextResponse } from 'next/server'; // ✅ Changé Request → NextRequest
import { query } from '@/app/lib/database';

// ✅ Interface avec Promise
interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(
  request: NextRequest, // ✅ NextRequest au lieu de Request
  { params }: RouteParams
) {
  try {
    // ✅ Récupération asynchrone de l'userId
    const { userId } = await params;
    const userIdNum = parseInt(userId);
    
    console.log('🔍 Récupération employé pour userId:', userIdNum);
    
    const sql = `
      SELECT e.*, u.email, u.role
      FROM enseignants e
      INNER JOIN users u ON e.user_id = u.id
      WHERE e.user_id = ?
    `;
    
    const employes = await query(sql, [userIdNum]) as any[];
    
    if (!employes || employes.length === 0) {
      return NextResponse.json({ success: true, employe: null });
    }
    
    return NextResponse.json({ success: true, employe: employes[0] });
    
  } catch (error) {
    console.error('❌ Erreur GET employe:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la récupération des données' },
      { status: 500 }
    );
  }
}