import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const enseignantId = parseInt(id);

    if (isNaN(enseignantId)) {
      return NextResponse.json(
        { success: false, erreur: 'ID enseignant invalide' },
        { status: 400 }
      );
    }

    const sql = `
      SELECT * FROM documents_enseignants 
      WHERE enseignant_id = ? 
      ORDER BY date_upload DESC
    `;
    
    const documents = await query(sql, [enseignantId]) as any[];

    return NextResponse.json({
      success: true,
      documents
    });

  } catch (error: any) {
    console.error('❌ Erreur récupération documents:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message}` 
      },
      { status: 500 }
    );
  }
}