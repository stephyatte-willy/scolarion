// /api/finance/beneficiaires/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeBudget = searchParams.get('type_budget');
    
    if (typeBudget === 'personnel') {
      // Récupérer les employés (users avec role enseignant ou administratif)
      const sql = `
        SELECT 
          u.id,
          u.nom,
          u.prenom,
          u.email,
          u.role,
          e.matricule,
          e.fonction,
          e.departement
        FROM users u
        LEFT JOIN enseignants e ON u.id = e.user_id
        WHERE u.role IN ('enseignant', 'admin')
        AND u.statut = 'actif'
        ORDER BY u.nom, u.prenom
      `;
      
      const employes = await query(sql) as any[];
      
      const beneficiaires = employes.map(emp => ({
        id: emp.id,
        nom_complet: `${emp.prenom} ${emp.nom}`,
        matricule: emp.matricule || '',
        fonction: emp.fonction || emp.role,
        email: emp.email,
        type: 'employe'
      }));
      
      return NextResponse.json({
        success: true,
        beneficiaires,
        type: 'employes'
      });
    } else if (typeBudget === 'fournisseurs') {
      // Récupérer les fournisseurs (à partir de votre table fournisseurs si elle existe)
      const sql = 'SELECT * FROM fournisseurs WHERE statut = "actif" ORDER BY nom';
      const fournisseurs = await query(sql) as any[];
      
      return NextResponse.json({
        success: true,
        beneficiaires: fournisseurs,
        type: 'fournisseurs'
      });
    } else {
      return NextResponse.json({
        success: true,
        beneficiaires: [],
        type: 'autre'
      });
    }
  } catch (error: any) {
    console.error('Erreur récupération bénéficiaires:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la récupération des bénéficiaires' },
      { status: 500 }
    );
  }
}