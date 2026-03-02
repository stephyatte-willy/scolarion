// app/api/releves/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /api/releves/check appelée');
    
    // Vérifier si les tables existent
    const checkTables = `
      SHOW TABLES LIKE 'releves_primaire';
    `;
    
    const tablesResult: any = await query(checkTables);
    const tableExists = tablesResult && tablesResult.length > 0;
    
    // Si la table existe, vérifier sa structure
    if (tableExists) {
      const structureSql = `
        DESCRIBE releves_primaire;
      `;
      const structureResult: any = await query(structureSql);
      
      return NextResponse.json({
        success: true,
        tableExists: true,
        structure: structureResult,
        message: 'Table releves_primaire existe'
      });
    } else {
      return NextResponse.json({
        success: true,
        tableExists: false,
        message: 'Table releves_primaire n\'existe pas'
      });
    }
    
  } catch (error: any) {
    console.error('❌ Erreur /api/releves/check:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      tableExists: false
    });
  }
}