import { NextResponse } from 'next/server';
import { query, runTransaction } from '@/app/lib/database';
import bcrypt from 'bcryptjs'; // Changé de bcrypt à bcryptjs

export async function GET() {
  try {
    const sql = `
      SELECT u.*, 
        GROUP_CONCAT(DISTINCT r.id) as role_ids,
        GROUP_CONCAT(DISTINCT r.nom) as role_names
      FROM users u
      LEFT JOIN users_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;
    
    const rows = await query(sql) as any[];
    
    const utilisateurs = rows.map(row => ({
      ...row,
      roles: row.role_ids ? row.role_ids.split(',').map((id: string, index: number) => ({
        id: parseInt(id),
        nom: row.role_names.split(',')[index]
      })) : []
    }));
    
    return NextResponse.json({ success: true, utilisateurs });
  } catch (error) {
    console.error('Erreur GET utilisateurs:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Vérifier si l'email existe déjà
    const existingUsers = await query(
      'SELECT id FROM users WHERE email = ?',
      [data.email]
    ) as any[];
    
    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }
    
    // Hasher le mot de passe avec bcryptjs
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Utiliser runTransaction pour la création
    const result = await runTransaction(async (connection) => {
      // Créer l'utilisateur
      const [insertResult] = await connection.execute(
        `INSERT INTO users 
         (email, password, nom, prenom, role, statut) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [data.email, hashedPassword, data.nom, data.prenom, data.role, data.statut]
      );
      
      const userId = (insertResult as any).insertId;
      
      // Assigner les rôles
      if (data.roles && data.roles.length > 0) {
        for (const roleId of data.roles) {
          await connection.execute(
            'INSERT INTO users_roles (user_id, role_id) VALUES (?, ?)',
            [userId, roleId]
          );
        }
      }
      
      return userId;
    });
    
    return NextResponse.json({ success: true, id: result });
  } catch (error) {
    console.error('Erreur POST utilisateur:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}