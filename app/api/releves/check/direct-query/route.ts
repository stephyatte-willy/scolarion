// app/api/direct-query/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sql, params = [] } = body;
    
    if (!sql) {
      return NextResponse.json({
        success: false,
        error: 'SQL requis'
      }, { status: 400 });
    }
    
    console.log('📝 Direct query:', sql, params);
    
    // Sécurité : limiter aux requêtes SELECT pour les relevés
    if (!sql.trim().toUpperCase().startsWith('SELECT')) {
      return NextResponse.json({
        success: false,
        error: 'Seules les requêtes SELECT sont autorisées'
      }, { status: 400 });
    }
    
    const results = await query(sql, params);
    
    return NextResponse.json({
      success: true,
      results: results || []
    });
    
  } catch (error: any) {
    console.error('❌ Erreur direct query:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      results: []
    });
  }
}