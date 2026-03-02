// /app/api/database/status/route.ts
import { NextResponse } from 'next/server';
import { getPoolStatus } from '@/app/lib/database';

export async function GET() {
  try {
    const status = await getPoolStatus();
    return NextResponse.json({
      success: true,
      status
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}