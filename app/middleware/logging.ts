import { NextRequest, NextResponse } from 'next/server';

export function loggingMiddleware(request: NextRequest) {
  console.log(`[${request.method}] ${request.url}`);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  
  if (request.method !== 'GET') {
    request.clone().json().then(data => {
      console.log('Body:', data);
    }).catch(() => {
      console.log('No JSON body or error reading body');
    });
  }
  
  return NextResponse.next();
}