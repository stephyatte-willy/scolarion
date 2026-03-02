// app/api/parametres/utilisateurs/[id]/statut/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database'; // On utilise query au lieu de runTransaction pour simplifier

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('🔵 PUT statut utilisateur - Début');
  console.log('📌 params reçus:', params);
  console.log('📌 id brut:', params?.id);
  
  try {
    // Récupération robuste de l'ID
    let userId: number | null = null;
    
    if (params && params.id) {
      userId = parseInt(params.id, 10);
    }
    
    // Fallback via l'URL
    if (!userId || isNaN(userId)) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const possibleId = pathParts[pathParts.length - 2];
      if (possibleId && !isNaN(Number(possibleId))) {
        userId = parseInt(possibleId, 10);
      }
    }
    
    console.log('📌 ID final:', userId);
    
    if (!userId || isNaN(userId) || userId <= 0) {
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
    
    // Mettre à jour le statut - Utilisation directe de query au lieu de runTransaction
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