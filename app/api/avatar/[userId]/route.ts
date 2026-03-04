<<<<<<< HEAD
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // ✅ Récupération asynchrone avec await
    const { userId } = await params;

    console.log('🔄 Récupération de l\'avatar pour l\'utilisateur:', userId);

    // Validation de l'ID
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { success: false, erreur: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    const utilisateurs = await query(
      'SELECT id, nom, prenom, avatar_url FROM users WHERE id = ?',
      [parseInt(userId)]
    ) as any[];

    console.log('📊 Résultat requête:', utilisateurs);

    if (utilisateurs.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Utilisateur non trouvé', userId },
        { status: 404 }
      );
    }

    const utilisateur = utilisateurs[0];
    const avatarUrl = utilisateur.avatar_url;

    console.log('👤 Utilisateur trouvé:', { 
      id: utilisateur.id, 
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      hasAvatar: !!avatarUrl 
    });

    // Si pas d'avatar, retourner une réponse avec initiales
    if (!avatarUrl) {
      return NextResponse.json({
        success: true,
        avatar_url: null,
        has_avatar: false,
        initiales: `${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase()
      });
    }

    // Si c'est une URL de fichier
    if (avatarUrl.startsWith('/uploads/')) {
      return NextResponse.json({
        success: true,
        avatar_url: avatarUrl,
        has_avatar: true,
        type: 'file'
      });
    }

    // Si c'est base64, vérifier qu'il est complet
    if (avatarUrl.startsWith('data:image')) {
      const estBase64Complet = avatarUrl.length > 1000 && avatarUrl.includes('base64,');
      
      if (estBase64Complet) {
        return NextResponse.json({
          success: true,
          avatar_url: avatarUrl,
          has_avatar: true,
          type: 'base64'
        });
      } else {
        // Base64 tronqué, le supprimer
        await query(
          'UPDATE users SET avatar_url = NULL WHERE id = ?',
          [utilisateur.id]
        );
        console.log('🗑️ Base64 tronqué supprimé pour l\'utilisateur:', utilisateur.id);
        
        return NextResponse.json({
          success: true,
          avatar_url: null,
          has_avatar: false,
          initiales: `${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase()
        });
      }
    }

    // Type d'avatar non reconnu
    return NextResponse.json({
      success: true,
      avatar_url: null,
      has_avatar: false,
      initiales: `${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase()
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération de l\'avatar:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur serveur',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
=======
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// ✅ CORRECTION : Promise ajoutée
interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // ✅ Récupération asynchrone avec await
    const { userId } = await params;

    console.log('🔄 Récupération de l\'avatar pour l\'utilisateur:', userId);

    // Validation de l'ID
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json(
        { success: false, erreur: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur
    const utilisateurs = await query(
      'SELECT id, nom, prenom, avatar_url FROM users WHERE id = ?',
      [parseInt(userId)]
    ) as any[];

    console.log('📊 Résultat requête:', utilisateurs);

    if (utilisateurs.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Utilisateur non trouvé', userId },
        { status: 404 }
      );
    }

    const utilisateur = utilisateurs[0];
    const avatarUrl = utilisateur.avatar_url;

    console.log('👤 Utilisateur trouvé:', { 
      id: utilisateur.id, 
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      hasAvatar: !!avatarUrl 
    });

    // Si pas d'avatar, retourner une réponse avec initiales
    if (!avatarUrl) {
      return NextResponse.json({
        success: true,
        avatar_url: null,
        has_avatar: false,
        initiales: `${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase()
      });
    }

    // Si c'est une URL de fichier
    if (avatarUrl.startsWith('/uploads/')) {
      return NextResponse.json({
        success: true,
        avatar_url: avatarUrl,
        has_avatar: true,
        type: 'file'
      });
    }

    // Si c'est base64, vérifier qu'il est complet
    if (avatarUrl.startsWith('data:image')) {
      const estBase64Complet = avatarUrl.length > 1000 && avatarUrl.includes('base64,');
      
      if (estBase64Complet) {
        return NextResponse.json({
          success: true,
          avatar_url: avatarUrl,
          has_avatar: true,
          type: 'base64'
        });
      } else {
        // Base64 tronqué, le supprimer
        await query(
          'UPDATE users SET avatar_url = NULL WHERE id = ?',
          [utilisateur.id]
        );
        console.log('🗑️ Base64 tronqué supprimé pour l\'utilisateur:', utilisateur.id);
        
        return NextResponse.json({
          success: true,
          avatar_url: null,
          has_avatar: false,
          initiales: `${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase()
        });
      }
    }

    // Type d'avatar non reconnu
    return NextResponse.json({
      success: true,
      avatar_url: null,
      has_avatar: false,
      initiales: `${utilisateur.prenom[0]}${utilisateur.nom[0]}`.toUpperCase()
    });

  } catch (error: any) {
    console.error('❌ Erreur lors de la récupération de l\'avatar:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur serveur',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
>>>>>>> 32d4e54ab2267c749063a541db8ca8150d07c1c5
