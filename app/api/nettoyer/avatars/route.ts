import { NextResponse } from 'next/server';
import { nettoyerAvatarsCorrompus } from '@/app/lib/nettoyer-avatars';

export async function POST() {
  try {
    const resultat = await nettoyerAvatarsCorrompus();
    
    if (resultat.success) {
      return NextResponse.json({
        success: true,
        message: resultat.message
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'Erreur lors du nettoyage des avatars',
        error: resultat.error
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Erreur API nettoyage avatars:', error);
    return NextResponse.json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    }, { status: 500 });
  }
}