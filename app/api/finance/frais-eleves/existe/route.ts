import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database'; 

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const eleveId = searchParams.get('eleve_id');
    const fraisScolaireId = searchParams.get('frais_scolaire_id');
    const anneeScolaire = searchParams.get('annee_scolaire');

    let sql = `
      SELECT 
        fe.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        e.matricule as eleve_matricule,
        c.nom as classe_nom,
        c.niveau as classe_niveau,
        cf.nom as categorie_nom,
        cf.type as categorie_type,
        cf.id as categorie_id,
        fs.montant as montant_total
      FROM frais_eleves fe
      INNER JOIN eleves e ON fe.eleve_id = e.id
      INNER JOIN classes c ON e.classe_id = c.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (eleveId) {
      sql += ' AND fe.eleve_id = ?';
      params.push(parseInt(eleveId));
    }

    if (fraisScolaireId) {
      sql += ' AND fe.frais_scolaire_id = ?';
      params.push(parseInt(fraisScolaireId));
    }

    if (anneeScolaire) {
      sql += ' AND fe.annee_scolaire = ?';
      params.push(anneeScolaire);
    }

    sql += ' ORDER BY fe.date_echeance ASC';

    const frais = await query(sql, params);

    return NextResponse.json({
      success: true,
      frais: frais || []
    });
  } catch (error: any) {
    console.error('Erreur récupération frais élèves:', error);
    return NextResponse.json(
      { success: false, erreur: 'Erreur lors de la récupération des frais' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Données reçues pour création frais élève:', body);
    
    const {
      frais_scolaire_id,
      eleve_id,
      annee_scolaire,
      montant,
      date_echeance
    } = body;

    // Validation
    if (!frais_scolaire_id || !eleve_id || !annee_scolaire || !montant) {
      return NextResponse.json({
        success: false,
        erreur: 'Données manquantes: frais_scolaire_id, eleve_id, annee_scolaire et montant sont requis'
      }, { status: 400 });
    }

    // Vérifier si le frais scolaire existe
    const fraisScolaireSql = 'SELECT * FROM frais_scolaires WHERE id = ?';
    const fraisScolaireResult = await query(fraisScolaireSql, [frais_scolaire_id]) as any[];
    
    if (fraisScolaireResult.length === 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Frais scolaire non trouvé'
      }, { status: 404 });
    }

    const fraisScolaire = fraisScolaireResult[0];

    // Vérifier si le frais élève existe déjà
    const checkSql = `
      SELECT id FROM frais_eleves 
      WHERE frais_scolaire_id = ? AND eleve_id = ? AND annee_scolaire = ?
    `;
    
    const existingResult = await query(checkSql, [
      frais_scolaire_id,
      eleve_id,
      annee_scolaire
    ]) as any[];

    if (existingResult.length > 0) {
      return NextResponse.json({
        success: false,
        erreur: 'Ce frais existe déjà pour cet élève',
        fraisEleveId: existingResult[0].id
      }, { status: 400 });
    }

    // Calculer la date d'échéance si non fournie
    let dateEcheanceFinale = date_echeance;
    if (!date_echeance) {
      const now = new Date();
      // Par défaut, échéance dans 30 jours
      now.setDate(now.getDate() + 30);
      dateEcheanceFinale = now.toISOString().split('T')[0];
    }

    // Insérer le frais élève
    const insertSql = `
      INSERT INTO frais_eleves (
        frais_scolaire_id, eleve_id, annee_scolaire, 
        montant, date_echeance, statut
      ) VALUES (?, ?, ?, ?, ?, 'en_attente')
    `;
    
    const result = await query(insertSql, [
      frais_scolaire_id,
      eleve_id,
      annee_scolaire,
      montant,
      dateEcheanceFinale
    ]) as any;

    const fraisEleveId = result.insertId;

    // Récupérer le frais créé
    const fraisCreeSql = `
      SELECT 
        fe.*,
        e.nom as eleve_nom,
        e.prenom as eleve_prenom,
        cf.nom as categorie_nom,
        cf.id as categorie_id
      FROM frais_eleves fe
      INNER JOIN eleves e ON fe.eleve_id = e.id
      INNER JOIN frais_scolaires fs ON fe.frais_scolaire_id = fs.id
      INNER JOIN categories_frais cf ON fs.categorie_frais_id = cf.id
      WHERE fe.id = ?
    `;
    
    const fraisCree = await query(fraisCreeSql, [fraisEleveId]) as any[];

    return NextResponse.json({
      success: true,
      fraisEleveId: fraisEleveId,
      frais: fraisCree[0],
      message: 'Frais élève créé avec succès'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Erreur création frais élève:', error);
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur lors de la création du frais élève: ${error.message}` 
      },
      { status: 500 }
    );
  }
}