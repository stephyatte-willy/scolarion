import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

// Interface pour les périodes
interface Periode {
  id: number;
  nom: string;
  code_periode: string;
  annee_scolaire: string;
  date_debut: string;
  date_fin: string;
  type_periode: string;
  numero: number;
  est_periode_courante: number | boolean;
  statut: string;
  [key: string]: any;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const annee = searchParams.get('annee');
    const statut = searchParams.get('statut');
    const type = searchParams.get('type');

    let sql = 'SELECT * FROM periodes_primaire WHERE 1=1';
    const params: any[] = [];

    if (annee && annee !== 'tous') {
      sql += ' AND annee_scolaire = ?';
      params.push(annee);
    }

    if (statut && statut !== 'tous') {
      sql += ' AND statut = ?';
      params.push(statut);
    }

    if (type && type !== 'tous') {
      sql += ' AND type_periode = ?';
      params.push(type);
    }

    sql += ' ORDER BY date_debut DESC, numero ASC';

    console.log('📝 SQL périodes primaires:', sql);
    const periodes = await query(sql, params) as Periode[];

    return NextResponse.json({
      success: true,
      periodes: Array.isArray(periodes) ? periodes : []
    });
  } catch (error: any) {
    console.error('❌ Erreur GET périodes primaires:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur serveur: ${error.message}`,
        periodes: []
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📥 Données création période primaire:', data);

    // Validation des champs requis
    if (!data.nom || !data.annee_scolaire || !data.date_debut || !data.date_fin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Les champs nom, année scolaire, date début et date fin sont requis' 
        },
        { status: 400 }
      );
    }

    // Vérifier les dates
    const dateDebut = new Date(data.date_debut);
    const dateFin = new Date(data.date_fin);
    
    if (dateDebut >= dateFin) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'La date de début doit être antérieure à la date de fin' 
        },
        { status: 400 }
      );
    }

    // Si c'est la période courante, désactiver les autres périodes courantes
    if (data.est_periode_courante) {
      await query(
        'UPDATE periodes_primaire SET est_periode_courante = FALSE WHERE est_periode_courante = TRUE',
        []
      );
    }

    // Générer le code période si non fourni
    let codePeriode = data.code_periode;
    if (!codePeriode) {
      const typeAbrev = data.type_periode ? data.type_periode.substring(0, 1).toUpperCase() : 'T';
      const annee = data.annee_scolaire ? data.annee_scolaire.split('-')[0] : new Date().getFullYear().toString();
      codePeriode = `PRIM-${typeAbrev}${data.numero || 1}-${annee}`;
    }

    // Vérifier si le code existe déjà
    const checkSql = 'SELECT id FROM periodes_primaire WHERE code_periode = ?';
    const existing = await query(checkSql, [codePeriode]) as Periode[];
    
    if (Array.isArray(existing) && existing.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ce code de période existe déjà' 
        },
        { status: 400 }
      );
    }

    const sql = `
      INSERT INTO periodes_primaire (
        nom, code_periode, annee_scolaire, date_debut, date_fin, 
        type_periode, numero, est_periode_courante, statut
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      data.nom,
      codePeriode,
      data.annee_scolaire,
      data.date_debut,
      data.date_fin,
      data.type_periode || 'trimestre',
      data.numero || 1,
      data.est_periode_courante ? 1 : 0,
      data.statut || 'active'
    ];

    console.log('📝 SQL création période primaire:', sql, params);
    const result: any = await query(sql, params);

    // Récupérer la période créée
    const getSql = 'SELECT * FROM periodes_primaire WHERE id = ?';
    const getResult = await query(getSql, [result.insertId]) as Periode[];
    const periode = Array.isArray(getResult) && getResult.length > 0 ? getResult[0] : null;

    return NextResponse.json({
      success: true,
      periode: periode,
      message: 'Période primaire créée avec succès'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Erreur POST période primaire:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la création: ${error.message}` 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    
    console.log('📥 Données mise à jour période primaire:', data);

    if (!data.id) {
      return NextResponse.json(
        { success: false, error: 'ID période requis' },
        { status: 400 }
      );
    }

    // Vérifier si la période existe
    const checkSql = 'SELECT * FROM periodes_primaire WHERE id = ?';
    const existing = await query(checkSql, [data.id]) as Periode[];
    
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Période non trouvée' },
        { status: 404 }
      );
    }

    // Si on change la période courante, désactiver les autres
    if (data.est_periode_courante && !existing[0].est_periode_courante) {
      await query(
        'UPDATE periodes_primaire SET est_periode_courante = FALSE WHERE est_periode_courante = TRUE',
        []
      );
    }

    // Construire dynamiquement la requête UPDATE
    const updateFields = [];
    const updateParams = [];

    if (data.nom !== undefined) {
      updateFields.push('nom = ?');
      updateParams.push(data.nom);
    }
    
    if (data.code_periode !== undefined) {
      updateFields.push('code_periode = ?');
      updateParams.push(data.code_periode);
    }
    
    if (data.annee_scolaire !== undefined) {
      updateFields.push('annee_scolaire = ?');
      updateParams.push(data.annee_scolaire);
    }
    
    if (data.date_debut !== undefined) {
      updateFields.push('date_debut = ?');
      updateParams.push(data.date_debut);
    }
    
    if (data.date_fin !== undefined) {
      updateFields.push('date_fin = ?');
      updateParams.push(data.date_fin);
    }
    
    if (data.type_periode !== undefined) {
      updateFields.push('type_periode = ?');
      updateParams.push(data.type_periode);
    }
    
    if (data.numero !== undefined) {
      updateFields.push('numero = ?');
      updateParams.push(data.numero);
    }
    
    if (data.est_periode_courante !== undefined) {
      updateFields.push('est_periode_courante = ?');
      updateParams.push(data.est_periode_courante ? 1 : 0);
    }
    
    if (data.statut !== undefined) {
      updateFields.push('statut = ?');
      updateParams.push(data.statut);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucune donnée à mettre à jour' },
        { status: 400 }
      );
    }

    updateParams.push(data.id);
    const updateSql = `UPDATE periodes_primaire SET ${updateFields.join(', ')} WHERE id = ?`;
    
    console.log('📝 SQL UPDATE période primaire:', updateSql, updateParams);
    await query(updateSql, updateParams);

    // Récupérer la période mise à jour
    const getSql = 'SELECT * FROM periodes_primaire WHERE id = ?';
    const getResult = await query(getSql, [data.id]) as Periode[];
    const periode = Array.isArray(getResult) && getResult.length > 0 ? getResult[0] : null;

    return NextResponse.json({
      success: true,
      periode: periode,
      message: 'Période primaire mise à jour avec succès'
    });

  } catch (error: any) {
    console.error('❌ Erreur PUT période primaire:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur lors de la mise à jour: ${error.message}` 
      },
      { status: 500 }
    );
  }
}