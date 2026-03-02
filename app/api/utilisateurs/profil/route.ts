import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function PUT(request: NextRequest) {
  try {
    const { id, nom, prenom, email, avatar_url } = await request.json();

    console.log('🔄 Mise à jour du profil:', { id, nom, prenom, email });

    // Validation des données
    if (!id || !nom || !prenom || !email) {
      return NextResponse.json(
        { success: false, erreur: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si l'utilisateur existe
    const utilisateurExist = await query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    ) as any[];

    if (utilisateurExist.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà utilisé par un autre utilisateur
    const emailExist = await query(
      'SELECT id FROM users WHERE email = ? AND id != ?',
      [email, id]
    ) as any[];

    if (emailExist.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    // Mettre à jour le profil
    let sql = '';
    let params = [];

    if (avatar_url) {
      sql = 'UPDATE users SET nom = ?, prenom = ?, email = ?, avatar_url = ?, updated_at = NOW() WHERE id = ?';
      params = [nom, prenom, email, avatar_url, id];
    } else {
      sql = 'UPDATE users SET nom = ?, prenom = ?, email = ?, updated_at = NOW() WHERE id = ?';
      params = [nom, prenom, email, id];
    }

    await query(sql, params);

    console.log('✅ Profil mis à jour avec succès');

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      utilisateur: {
        id: parseInt(id),
        nom,
        prenom,
        email,
        avatar_url: avatar_url || null
      }
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la mise à jour du profil:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur lors de la mise à jour du profil' },
      { status: 500 }
    );
  }
}