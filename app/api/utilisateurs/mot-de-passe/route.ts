import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';
import bcrypt from 'bcryptjs';

export async function PUT(request: NextRequest) {
  try {
    const { id, motDePasseActuel, nouveauMotDePasse } = await request.json();

    console.log('🔄 Changement de mot de passe pour l\'utilisateur:', id);

    // Validation des données
    if (!id || !motDePasseActuel || !nouveauMotDePasse) {
      return NextResponse.json(
        { success: false, erreur: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    if (nouveauMotDePasse.length < 6) {
      return NextResponse.json(
        { success: false, erreur: 'Le mot de passe doit contenir au moins 6 caractères' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur avec le mot de passe actuel
    const utilisateurs = await query(
      'SELECT id, password FROM users WHERE id = ?',
      [id]
    ) as any[];

    if (utilisateurs.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    const utilisateur = utilisateurs[0];

    // Vérifier le mot de passe actuel
    let motDePasseValide = false;
    
    // Vérifier si le mot de passe est hashé avec bcrypt
    if (utilisateur.password.startsWith('$2b$')) {
      // Mot de passe déjà hashé avec bcrypt
      motDePasseValide = await bcrypt.compare(motDePasseActuel, utilisateur.password);
    } else {
      // Mot de passe en clair (migration depuis ancien système)
      motDePasseValide = motDePasseActuel === utilisateur.password;
    }

    if (!motDePasseValide) {
      return NextResponse.json(
        { success: false, erreur: 'Mot de passe actuel incorrect' },
        { status: 401 }
      );
    }

    // Hasher le nouveau mot de passe avec bcrypt
    const nouveauMotDePasseHash = await bcrypt.hash(nouveauMotDePasse, 12);

    // Mettre à jour le mot de passe
    await query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [nouveauMotDePasseHash, id]
    );

    console.log('✅ Mot de passe changé avec succès');

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur lors du changement de mot de passe:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur lors du changement de mot de passe' },
      { status: 500 }
    );
  }
}