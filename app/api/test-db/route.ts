// app/api/test-db/route.ts
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT || '3306'),
      connectTimeout: 10000
    });
    
    const [rows] = await connection.execute('SELECT 1 as test');
    await connection.end();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Connexion réussie !',
      data: rows 
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur de connexion',
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
}