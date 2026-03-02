import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { releve_id, mode_envoi, date_envoi, statut } = await request.json();

    await query(
      `UPDATE releves_primaire 
       SET email_envoye = ?, 
           mode_envoi = ?, 
           date_envoi_email = ?,
           statut = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [statut === 'envoyé', mode_envoi, date_envoi, statut, releve_id]
    );

    return NextResponse.json({
      success: true,
      message: 'Statut mis à jour'
    });

  } catch (error) {
    console.error('❌ Erreur mise à jour statut:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur mise à jour'
    }, { status: 500 });
  }
}