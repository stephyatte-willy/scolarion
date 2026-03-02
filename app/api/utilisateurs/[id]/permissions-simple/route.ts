import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    
    // Requête pour récupérer les permissions
    const permissions = await query(`
      SELECT DISTINCT p.code
      FROM permissions p
      INNER JOIN roles_permissions rp ON p.id = rp.permission_id
      INNER JOIN users_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `, [userId]);
    
    // Transformer en tableau de codes
    const codes = Array.isArray(permissions) 
      ? permissions.map(p => p.code)
      : [];
    
    return NextResponse.json({
      success: true,
      permissions: codes
    });
    
  } catch (error) {
    return NextResponse.json({ success: false, permissions: [] });
  }
}