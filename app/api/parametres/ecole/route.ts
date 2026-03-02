// app/api/parametres/ecole/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET() {
  try {
    const sql = 'SELECT * FROM parametres LIMIT 1';
    const parametres = await query(sql) as any[];
    
    const parametresEcole = parametres[0] || {
      nom_ecole: "Non défini",
      slogan: "L'excellence éducative depuis 1985",
      adresse: "Non défini",
      telephone: "Non défini",
      email: "Non défini",
      logo_url: null,
      couleur_principale: "#3B82F6",
      annee_scolaire: ""
    };

    return NextResponse.json({
      success: true,
      parametres: parametresEcole
    });

  } catch (error: any) {
    console.error('Erreur lors de la récupération des paramètres:', error);
    
    const parametresDefaut = {
      nom_ecole: "Non défini",
      slogan: "L'excellence éducative depuis 1985",
      adresse: "Non défini",
      telephone: "Non défini",
      email: "Non défini",
      logo_url: null,
      couleur_principale: "#3B82F6",
      annee_scolaire: ""
    };

    return NextResponse.json({
      success: true,
      parametres: parametresDefaut
    });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    
    // Vérifier si la table parametres a une ligne
    const existing = await query('SELECT id FROM parametres LIMIT 1') as any[];
    
    if (existing && existing.length > 0) {
      // Mise à jour
      await query(
        `UPDATE parametres SET 
          nom_ecole = ?, 
          slogan = ?, 
          adresse = ?, 
          telephone = ?, 
          email = ?, 
          couleur_principale = ?,
          updated_at = NOW()
        WHERE id = 1`,
        [
          data.nom_ecole, 
          data.slogan, 
          data.adresse, 
          data.telephone, 
          data.email, 
          data.couleur_principale
        ]
      );
    } else {
      // Insertion
      await query(
        `INSERT INTO parametres 
          (nom_ecole, slogan, adresse, telephone, email, couleur_principale, annee_scolaire) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          data.nom_ecole, 
          data.slogan, 
          data.adresse, 
          data.telephone, 
          data.email, 
          data.couleur_principale,
          data.annee_scolaire || '2024-2025'
        ]
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Paramètres mis à jour avec succès' 
    });
    
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour des paramètres:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur lors de la mise à jour des paramètres',
        details: error.message 
      },
      { status: 500 }
    );
  }
}