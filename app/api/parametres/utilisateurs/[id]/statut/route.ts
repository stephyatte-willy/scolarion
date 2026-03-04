// app/api/parametres/utilisateurs/[id]/statut/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour les paramètres
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PUT(
  request: NextRequest,  // ✅ Utilisation de NextRequest
  { params }: RouteParams  // ✅ Interface avec Promise
) {
  console.log('🔵 PUT statut utilisateur - Début');
  
  try {
    // ✅ Récupération asynchrone et propre de l'ID
    const { id } = await params;
    const userId = parseInt(id, 10);
    
    console.log('📌 ID utilisateur:', userId);
    
    // ✅ Validation simple et efficace
    if (isNaN(userId) || userId <= 0) {
      return NextResponse.json(
        { success: false, erreur: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }
    
    // Récupérer les données du body
    const body = await request.json();
    const { statut } = body;
    console.log('📦 Body reçu:', { statut });
    
    if (!statut || !['actif', 'inactif'].includes(statut)) {
      return NextResponse.json(
        { success: false, erreur: 'Statut invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier si l'utilisateur existe
    const users = await query(
      'SELECT id, role FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    console.log('📊 Utilisateur trouvé:', users[0]);
    
    if (!users || users.length === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    // Vérifier si c'est le dernier admin actif (si on désactive)
    if (statut === 'inactif' && users[0].role === 'admin') {
      const admins = await query(
        'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND statut = "actif" AND id != ?',
        [userId]
      ) as any[];
      
      if (admins[0]?.count === 0) {
        return NextResponse.json(
          { success: false, erreur: 'Impossible de désactiver le dernier administrateur actif' },
          { status: 400 }
        );
      }
    }
    
    // Mettre à jour le statut
    await query(
      'UPDATE users SET statut = ? WHERE id = ?',
      [statut, userId]
    );
    
    console.log('✅ Statut mis à jour avec succès');
    
    return NextResponse.json({ 
      success: true, 
      message: `Compte ${statut === 'actif' ? 'activé' : 'désactivé'} avec succès` 
    });
    
  } catch (error: any) {
    console.error('❌ Erreur PUT statut utilisateur:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: error.message || 'Erreur lors du changement de statut' 
      },
      { status: 500 }
    );
  }
}
