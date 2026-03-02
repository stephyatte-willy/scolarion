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
        u.avatar_url,
        e.fonction,
        e.departement,
        e.type_enseignant,
        e.statut as employe_statut,
        e.telephone,
        e.specialite,
        GROUP_CONCAT(DISTINCT r.id) as role_ids,
        GROUP_CONCAT(DISTINCT r.nom) as role_names
      FROM enseignants e
      INNER JOIN users u ON e.user_id = u.id
      LEFT JOIN users_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      GROUP BY e.id, e.user_id, e.matricule, u.nom, u.prenom, u.email, 
               u.statut, u.avatar_url, e.fonction, e.departement, 
               e.type_enseignant, e.statut, e.telephone, e.specialite
      ORDER BY u.nom, u.prenom
    `;
    
    const rows = await query(sql) as any[];
    console.log(`📊 ${rows.length} employés trouvés`);
    
    const employes = rows.map(row => {
      // Traitement sécurisé des rôles
      let roles = [];
      if (row.role_ids && row.role_names) {
        const ids = row.role_ids.split(',');
        const noms = row.role_names.split(',');
        roles = ids.map((id: string, index: number) => ({
          id: parseInt(id.trim()),
          nom: noms[index]?.trim() || ''
        }));
      }
      
      // CONVERSION TRÈS ROBUSTE du user_id
      let userId = 0;
      if (row.user_id !== null && row.user_id !== undefined) {
        // Si c'est déjà un nombre, on le garde, sinon on le convertit
        userId = typeof row.user_id === 'number' 
          ? row.user_id 
          : parseInt(String(row.user_id).trim(), 10);
        
        // Vérifier que la conversion a réussi
        if (isNaN(userId)) {
          console.warn(`⚠️ user_id invalide pour l'employé ${row.matricule}:`, row.user_id);
          userId = 0;
        }
      }
      
      console.log(`Employé ${row.matricule}: user_id brut=${row.user_id} (${typeof row.user_id}) -> converti=${userId}`);
      
      return {
        id: row.id,
        user_id: userId,
        matricule: row.matricule,
        nom: row.nom,
        prenom: row.prenom,
        email: row.email,
        fonction: row.fonction || row.type_enseignant,
        departement: row.departement,
        type_enseignant: row.type_enseignant,
        employe_statut: row.employe_statut,
        user_statut: row.user_statut || 'inactif',
        avatar_url: row.avatar_url,
        telephone: row.telephone,
        specialite: row.specialite,
        roles: roles
      };
    });
    
    return NextResponse.json({ 
      success: true, 
      employes,
      count: employes.length
    });
    
  } catch (error: any) {
    console.error('❌ Erreur GET employes:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la récupération des employés',
        details: error.message 
      },
      { status: 500 }
    );
  }
}