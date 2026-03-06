import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  console.log('🔵 Chargement des employés...');
  
  try {
    const sql = `
      SELECT 
        e.id,
        e.user_id,
        e.matricule,
        u.nom,
        u.prenom,
        u.email,
        u.statut as user_statut,
        COALESCE(e.avatar_url, u.avatar_url) as avatar_url,
        e.fonction,
        e.departement,
        e.type_enseignant,
        e.statut as employe_statut,
        e.telephone,
        e.specialite,
        GROUP_CONCAT(DISTINCT r.nom) as role_names
      FROM enseignants e
      INNER JOIN users u ON e.user_id = u.id
      LEFT JOIN users_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY e.id
      ORDER BY u.nom, u.prenom
    `;
    
    const rows = await query(sql) as any[];
    
    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json({ success: true, employes: [] });
    }
    
    const employes = rows.map((row: any) => ({
      id: row.id || 0,
      user_id: Number(row.user_id) || 0,
      matricule: row.matricule || '',
      nom: row.nom || '',
      prenom: row.prenom || '',
      email: row.email || '',
      fonction: row.fonction || row.type_enseignant || '',
      departement: row.departement || '',
      type_enseignant: row.type_enseignant || 'professeur',
      employe_statut: row.employe_statut || 'actif',
      user_statut: row.user_statut || 'actif',
      avatar_url: row.avatar_url || null,
      telephone: row.telephone || '',
      specialite: row.specialite || '',
      roles: row.role_names ? row.role_names.split(',').map((n: string) => n.trim()) : []
    }));
    
    return NextResponse.json({ 
      success: true, 
      employes
    });
    
  } catch (error: any) {
    console.error('❌ Erreur GET employes:', error);
    return NextResponse.json(
      { success: false, employes: [] },
      { status: 500 }
    );
  }
}