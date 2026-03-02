// app/api/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Vous pouvez ajouter des logs ici pour déboguer
  console.log(`🌐 API Request: ${request.method} ${request.url}`);
  
  const response = NextResponse.next();
  
  // Ajouter des headers pour éviter les erreurs CORS
  response.headers.set('Content-Type', 'application/json');
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};