// app/api/parametres/roles/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'; // ✅ Changé Request → NextRequest
import { runTransaction, query } from '@/app/lib/database';

export async function DELETE(
  request: NextRequest, // ✅ Changé Request → NextRequest pour cohérence
  { params }: { params: Promise<{ id: string }> } // ✅ Correction: Promise
) {
  console.log('🔵 DELETE rôle - Début');
  
  try {
    // ✅ Récupération asynchrone de l'ID (maintenant simple et propre)
    const { id } = await params;
    console.log('📌 ID reçu:', id);
    
    const roleId = parseInt(id, 10);
    console.log('📌 ID parsé:', roleId);
    
    if (!roleId || isNaN(roleId) || roleId <= 0) {
      console.error('❌ ID de rôle invalide');
      return NextResponse.json(
        { success: false, erreur: 'ID de rôle invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier si des utilisateurs ont ce rôle
    const usersWithRole = await query(
      'SELECT COUNT(*) as count FROM users_roles WHERE role_id = ?',
      [roleId]
    ) as any[];
    
    console.log('📊 Utilisateurs avec ce rôle:', usersWithRole[0]?.count);
    
    if (usersWithRole[0]?.count > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Ce rôle est attribué à des utilisateurs et ne peut pas être supprimé' },
        { status: 400 }
      );
    }
    
    // Vérifier si c'est un rôle système
    const roleInfo = await query(
      'SELECT nom FROM roles WHERE id = ?',
      [roleId]
    ) as any[];
    
    console.log('📊 Info rôle:', roleInfo[0]);
    
    const rolesSysteme = ['Super Admin', 'Administrateur', 'Directeur'];
    if (roleInfo[0] && rolesSysteme.includes(roleInfo[0].nom)) {
      return NextResponse.json(
        { success: false, erreur: 'Ce rôle système ne peut pas être supprimé' },
        { status: 400 }
      );
    }
    
    // Exécuter la suppression
    const result = await runTransaction(async (connection) => {
      // Supprimer les permissions associées
      await connection.execute(
        'DELETE FROM roles_permissions WHERE role_id = ?',
        [roleId]
      );
      
      // Supprimer le rôle
      const [deleteResult] = await connection.execute(
        'DELETE FROM roles WHERE id = ?',
        [roleId]
      ) as any;
      
      console.log('📊 Résultat suppression:', deleteResult);
      
      if (deleteResult.affectedRows === 0) {
        throw new Error('Rôle non trouvé');
      }
      
      return deleteResult.affectedRows;
    });
    
    console.log('✅ Suppression réussie pour le rôle', roleId);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rôle supprimé avec succès',
      affectedRows: result
    });
    
  } catch (error: any) {
    console.error('❌ Erreur DELETE rôle:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: error.message || 'Erreur lors de la suppression' 
      },
      { status: 500 }
    );
  }
}