import { NextRequest, NextResponse } from 'next/server';
import { runTransaction, query } from '@/app/lib/database';
import bcrypt from 'bcryptjs';

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
  try {
    const data = await request.json();
    // ✅ Récupération asynchrone de l'ID
    const { id } = await params;
    const userId = parseInt(id);
    
    console.log('📝 PUT utilisateur ID:', userId, 'Données:', data);
    
    await runTransaction(async (connection) => {
      // Vérifier si l'email existe déjà pour un autre utilisateur
      if (data.email) {
        const [existingUsers] = await connection.execute(
          'SELECT id FROM users WHERE email = ? AND id != ?',
          [data.email, userId]
        ) as any[];
        
        if (existingUsers && existingUsers.length > 0) {
          throw new Error('Cet email est déjà utilisé par un autre utilisateur');
        }
      }
      
      // Mettre à jour l'utilisateur
      let sql = 'UPDATE users SET email = ?, nom = ?, prenom = ?, statut = ?';
      const params: any[] = [data.email, data.nom, data.prenom, data.statut];
      
      // Si un nouveau mot de passe est fourni, le mettre à jour
      if (data.password && data.password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        sql += ', password = ?';
        params.push(hashedPassword);
      }
      
      sql += ' WHERE id = ?';
      params.push(userId);
      
      await connection.execute(sql, params);
      
      // Supprimer les anciens rôles
      await connection.execute(
        'DELETE FROM users_roles WHERE user_id = ?',
        [userId]
      );
      
      // Ajouter les nouveaux rôles
      if (data.roles && data.roles.length > 0) {
        for (const roleId of data.roles) {
          await connection.execute(
            'INSERT INTO users_roles (user_id, role_id) VALUES (?, ?)',
            [userId, roleId]
          );
        }
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erreur PUT utilisateur:', error);
    return NextResponse.json(
      { success: false, erreur: error.message || 'Erreur lors de la modification' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,  // ✅ Utilisation de NextRequest
  { params }: RouteParams  // ✅ Réutilisation de l'interface
) {
  try {
    // ✅ Récupération asynchrone de l'ID
    const { id } = await params;
    const userId = parseInt(id);
    
    console.log('🗑️ DELETE utilisateur ID:', userId);
    
    // Vérifier si c'est le dernier admin
    const admins = await query(
      'SELECT COUNT(*) as count FROM users WHERE role = "admin" AND id != ?',
      [userId]
    ) as any[];
    
    const userToDelete = await query(
      'SELECT role FROM users WHERE id = ?',
      [userId]
    ) as any[];
    
    if (userToDelete[0]?.role === 'admin' && admins[0]?.count === 0) {
      return NextResponse.json(
        { success: false, erreur: 'Impossible de supprimer le dernier administrateur' },
        { status: 400 }
      );
    }
    
    await runTransaction(async (connection) => {
      // Supprimer les rôles associés
      await connection.execute(
        'DELETE FROM users_roles WHERE user_id = ?',
        [userId]
      );
      
      // Supprimer l'utilisateur
      await connection.execute(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE utilisateur:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la suppression' },
      { status: 500 }
    );
  }
}
