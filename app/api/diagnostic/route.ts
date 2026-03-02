import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  const results: any = {};
  
  try {
    // Test 1: Structure de la table permissions
    results.permissionsStructure = await query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'permissions' 
      AND TABLE_SCHEMA = DATABASE()
    `, []);
    
    // Test 2: Toutes les permissions
    results.allPermissions = await query('SELECT * FROM permissions', []);
    
    // Test 3: Structure roles_permissions
    results.rolesPermissionsStructure = await query(`
      SELECT COLUMN_NAME, DATA_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'roles_permissions' 
      AND TABLE_SCHEMA = DATABASE()
    `, []);
    
    // Test 4: Vérifier les jointures pour l'utilisateur 7
    const userId = 7;
    results.userRoles = await query(`
      SELECT r.* 
      FROM roles r
      INNER JOIN users_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `, [userId]);
    
    results.userPermissions = await query(`
      SELECT p.* 
      FROM permissions p
      INNER JOIN roles_permissions rp ON p.id = rp.permission_id
      INNER JOIN users_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ?
    `, [userId]);
    
    return NextResponse.json({
      success: true,
      message: 'Diagnostic complet',
      data: results
    });
    
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
      results
    }, { status: 500 });
  }
}