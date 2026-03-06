import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const userIdNum = parseInt(userId);
    
    console.log('🔍 Récupération employé pour userId:', userIdNum);
    
    if (isNaN(userIdNum)) {
      return NextResponse.json({ success: true, employe: null });
    }
    
    const sql = `
      SELECT 
        e.id,
        e.user_id,
        e.matricule,
        u.nom,
        u.prenom,
        u.email,
        e.fonction,
        e.departement,
        e.type_enseignant,
        e.statut as employe_statut,
        u.statut as user_statut,
        COALESCE(e.avatar_url, u.avatar_url) as avatar_url,
        e.telephone,
        e.specialite,
        GROUP_CONCAT(DISTINCT r.nom) as role_names
      FROM enseignants e
      INNER JOIN users u ON e.user_id = u.id
      LEFT JOIN users_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE e.user_id = ?
      GROUP BY e.id
    `;
    
    const result = await query(sql, [userIdNum]);
    
    // ✅ Vérification que result est un tableau et non vide
    if (!result || !Array.isArray(result) || result.length === 0) {
      return NextResponse.json({ success: true, employe: null });
    }
    
    // ✅ Type assertion pour dire à TypeScript que c'est un objet avec nos champs
    const emp = result[0] as any;
    
    // ✅ Construction de l'objet employé avec toutes les propriétés
    const employe = {
      id: emp.id || 0,
      user_id: Number(emp.user_id) || 0,
      matricule: emp.matricule || '',
      nom: emp.nom || '',
      prenom: emp.prenom || '',
      email: emp.email || '',
      fonction: emp.fonction || emp.type_enseignant || '',
      departement: emp.departement || '',
      type_enseignant: emp.type_enseignant || 'professeur',
      employe_statut: emp.employe_statut || 'actif',
      user_statut: emp.user_statut || 'actif',
      avatar_url: emp.avatar_url || null,
      telephone: emp.telephone || '',
      specialite: emp.specialite || '',
      roles: emp.role_names ? emp.role_names.split(',').map((n: string) => n.trim()) : []
    };
    
    console.log('✅ Employé trouvé:', employe.nom, employe.prenom);
    
    return NextResponse.json({ 
      success: true, 
      employe 
    });
    
  } catch (error: any) {
    console.error('❌ Erreur dans GET employe:', error);
    return NextResponse.json({ 
      success: false, 
      employe: null,
      erreur: error?.message || 'Erreur inconnue'
    });
  }
}