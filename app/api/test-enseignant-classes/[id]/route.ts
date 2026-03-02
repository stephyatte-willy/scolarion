import { NextRequest, NextResponse } from 'next/server';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const enseignantId = parseInt(id);
    
    return NextResponse.json({
      success: true,
      enseignantId,
      test: "API de test accessible",
      endpoint: `/api/enseignants/${enseignantId}/classes`
    });
  } catch (error: any) {
    console.error('❌ Erreur test:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}