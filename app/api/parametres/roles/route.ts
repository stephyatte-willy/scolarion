import { NextResponse } from 'next/server';
import { query, runTransaction } from '@/app/lib/database';

export async function GET() {
  try {
    const sql = `
      SELECT r.*, 
        GROUP_CONCAT(p.id) as permission_ids,
        GROUP_CONCAT(p.nom) as permission_noms,
        GROUP_CONCAT(p.code) as permission_codes,
        GROUP_CONCAT(p.module) as permission_modules,
        GROUP_CONCAT(p.description) as permission_descriptions
      FROM roles r
      LEFT JOIN roles_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY r.id
      ORDER BY r.niveau DESC
    `;
    
    const rows = await query(sql) as any[];
    
    const roles = rows.map(row => ({
      ...row,
      permissions: row.permission_ids ? row.permission_ids.split(',').map((id: string, index: number) => ({
        id: parseInt(id),
        nom: row.permission_noms.split(',')[index],
        code: row.permission_codes.split(',')[index],
        module: row.permission_modules.split(',')[index],
        description: row.permission_descriptions.split(',')[index]
      })) : []
    }));
    
    return NextResponse.json({ success: true, roles });
  } catch (error) {
    console.error('Erreur GET roles:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la récupération' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const result = await runTransaction(async (connection) => {
      // Créer le rôle
      const [insertResult] = await connection.execute(
        `INSERT INTO roles (nom, description, niveau) 
         VALUES (?, ?, ?)`,
        [data.nom, data.description, data.niveau]
      );
      
      const roleId = (insertResult as any).insertId;
      
      // Assigner les permissions
      if (data.permissions && data.permissions.length > 0) {
        for (const permissionId of data.permissions) {
          await connection.execute(
            'INSERT INTO roles_permissions (role_id, permission_id) VALUES (?, ?)',
            [roleId, permissionId]
          );
        }
      }
      
      return roleId;
    });
    
    return NextResponse.json({ success: true, id: result });
  } catch (error) {
    console.error('Erreur POST role:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la création' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, erreur: 'ID non fourni' },
        { status: 400 }
      );
    }
    
    await runTransaction(async (connection) => {
      // Mettre à jour le rôle
      await connection.execute(
        `UPDATE roles SET nom = ?, description = ?, niveau = ? 
         WHERE id = ?`,
        [data.nom, data.description, data.niveau, id]
      );
      
      // Supprimer les anciennes permissions
      await connection.execute(
        'DELETE FROM roles_permissions WHERE role_id = ?',
        [id]
      );
      
      // Assigner les nouvelles permissions
      if (data.permissions && data.permissions.length > 0) {
        for (const permissionId of data.permissions) {
          await connection.execute(
            'INSERT INTO roles_permissions (role_id, permission_id) VALUES (?, ?)',
            [id, permissionId]
          );
        }
      }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur PUT role:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  }
}