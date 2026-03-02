import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Dans Next.js 16, les params sont directement disponibles
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('🚀 API ÉLÈVES PAR CLASSE - Démarrage');
    
    // Attendre la résolution des params (Next.js 16)
    const resolvedParams = await params;
    const idStr = resolvedParams.id;
    
    console.log('🔢 ID reçu après résolution:', {
      idStr,
      type: typeof idStr,
      rawParams: resolvedParams
    });
    
    // Validation basique
    if (!idStr || idStr.trim() === '') {
      console.error('❌ ID vide ou non fourni');
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'ID de classe non fourni',
          details: { id_received: idStr }
        },
        { status: 400 }
      );
    }
    
    const id = parseInt(idStr);
    console.log('🔢 ID parsé:', id, '(est NaN?', isNaN(id), ')');
    
    if (isNaN(id) || id <= 0) {
      console.error('❌ ID invalide après parsing:', { idStr, id });
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'ID de classe invalide',
          details: {
            id_received: idStr,
            id_parsed: id,
            message: 'L\'ID doit être un nombre positif'
          }
        },
        { status: 400 }
      );
    }
    
    console.log('✅ ID validé:', id);
    
    // REQUÊTE SQL SIMPLIFIÉE POUR DÉMARRER
    const sql = `SELECT * FROM eleves WHERE classe_id = ? ORDER BY nom, prenom`;
    
    console.log('📝 Requête SQL:', sql);
    console.log('🔢 Paramètre classe_id:', id);
    
    const eleves = await query(sql, [id]) as any[];
    
    console.log('✅ Élèves trouvés:', eleves.length);
    
    // Formater les données
    const elevesFormates = eleves.map(eleve => {
      // Gérer les dossiers physiques
      let dossiers = [];
      try {
        if (eleve.dossiers_physiques && typeof eleve.dossiers_physiques === 'string') {
          dossiers = JSON.parse(eleve.dossiers_physiques);
        } else if (Array.isArray(eleve.dossiers_physiques)) {
          dossiers = eleve.dossiers_physiques;
        }
      } catch (e) {
        console.warn('⚠️ Erreur parsing dossiers pour élève', eleve.id, e);
        dossiers = [];
      }
      
      return {
        id: eleve.id,
        matricule: eleve.matricule,
        nom: eleve.nom,
        prenom: eleve.prenom,
        date_naissance: eleve.date_naissance,
        lieu_naissance: eleve.lieu_naissance,
        genre: eleve.genre,
        adresse: eleve.adresse,
        telephone: eleve.telephone,
        email: eleve.email,
        nom_pere: eleve.nom_pere,
        nom_mere: eleve.nom_mere,
        telephone_parent: eleve.telephone_parent,
        classe_id: eleve.classe_id,
        photo_url: eleve.photo_url,
        statut: eleve.statut,
        date_inscription: eleve.date_inscription,
        dossiers_physiques: dossiers,
        nom_classe: eleve.nom_classe,
        niveau_classe: eleve.niveau_classe
      };
    });
    
    console.log('📊 Premier élève formaté:', elevesFormates[0] || 'Aucun élève');
    
    return NextResponse.json({
      success: true,
      eleves: elevesFormates,
      details: {
        classe_id: id,
        total_eleves: elevesFormates.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error: any) {
    console.error('❌ Erreur serveur API:', error);
    console.error('❌ Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: 'Erreur serveur',
        details: {
          message: error.message,
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}