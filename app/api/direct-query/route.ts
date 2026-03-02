// /api/direct-query/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sql, params = [] } = data;
    
    if (!sql) {
      return NextResponse.json(
        { success: false, error: 'SQL requis' },
        { status: 400 }
      );
    }
    
    console.log('🔍 Direct query SQL:', sql);
    console.log('🔍 Params:', params);
    
    const results = await query(sql, params);
    
    return NextResponse.json({
      success: true,
      results: results || []
    });
    
  } catch (error: any) {
    console.error('❌ Erreur direct query:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        results: []
      },
      { status: 500 }
    );
  }
}