import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  console.log('🚀 API /api/auth/connexion appelée');
  try {
    console.log('📦 Tentative de parsing du JSON...');
    const { email, password } = await request.json();
    console.log('✅ JSON parsé avec succès', { email: email ? 'fourni' : 'manquant' });

    // Valider les données d'entrée
    if (!email || !password) {
      return NextResponse.json(
        { success: false, erreur: 'Email et mot de passe sont requis' },
        { status: 400 }
      );
    }

    // Rechercher l'utilisateur dans la base de données
    const sql = 'SELECT * FROM users WHERE email = ? AND statut = "actif"';
    const utilisateurs = await query(sql, [email]) as any[];

    console.log('📊 Utilisateurs trouvés:', utilisateurs.length);

    if (utilisateurs.length === 0) {
      console.log('❌ Aucun utilisateur trouvé avec cet email:', email);
      return NextResponse.json(
        { success: false, erreur: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const utilisateur = utilisateurs[0];
    console.log('👤 Utilisateur trouvé:', {
      id: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role
    });

    // Vérifier le mot de passe
    let motDePasseValide = false;
    
    if (utilisateur.password.startsWith('$2b$')) {
      // Mot de passe hashé avec bcrypt
      motDePasseValide = await bcrypt.compare(password, utilisateur.password);
    } else {
      // Ancien mot de passe en clair (pour la transition)
      motDePasseValide = password === utilisateur.password;
      
      // Si le mot de passe en clair est valide, le hasher pour la prochaine fois
      if (motDePasseValide) {
        const nouveauHash = await bcrypt.hash(password, 12);
        await query('UPDATE users SET password = ? WHERE id = ?', [nouveauHash, utilisateur.id]);
        console.log('🔄 Mot de passe migré vers bcrypt');
      }
    }

    console.log('🔑 Validation mot de passe:', motDePasseValide);

    if (!motDePasseValide) {
      console.log('❌ Mot de passe incorrect');
      return NextResponse.json(
        { success: false, erreur: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // Mettre à jour la dernière connexion
    await query('UPDATE users SET last_login = NOW() WHERE id = ?', [utilisateur.id]);

    // Retourner les informations de l'utilisateur (sans le mot de passe)
    const utilisateurSansMotDePasse = {
      id: utilisateur.id,
      email: utilisateur.email,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      role: utilisateur.role,
      avatar_url: utilisateur.avatar_url,
      statut: utilisateur.statut
    };

    console.log('✅ Connexion réussie pour:', utilisateur.email);

    return NextResponse.json({
      success: true,
      utilisateur: utilisateurSansMotDePasse
    });

    } catch (error: any) {
    console.error('❌ Erreur CATCH globale:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      { success: false, erreur: 'Erreur serveur lors de l\'authentification' },
      { status: 500 }
    );
  }
}
