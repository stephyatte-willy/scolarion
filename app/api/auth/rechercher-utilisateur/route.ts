import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, erreur: 'Email requis' },
        { status: 400 }
      );
    }

    // Rechercher l'utilisateur dans la base de données
    const sql = 'SELECT nom, prenom, role FROM users WHERE email = ?';
    const utilisateurs = await query(sql, [email]) as any[];

    if (utilisateurs.length === 0) {
      return NextResponse.json({
        success: true,
        utilisateur: null
      });
    }

    const utilisateur = utilisateurs[0];

    return NextResponse.json({
      success: true,
      utilisateur: {
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        role: utilisateur.role
      }
    });

  } catch (error: any) {
    console.error('Erreur lors de la recherche utilisateur:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur' },
      { status: 500 }
    );
  }
}