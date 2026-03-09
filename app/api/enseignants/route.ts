import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';
import bcrypt from 'bcryptjs';

// GET - Récupérer tous les employés avec leurs classes
export async function GET(request: NextRequest) {
  try {
    console.log('🌐 API Personnel - GET avec classes');
    
    // Requête améliorée pour inclure les classes
    const sql = `
      SELECT 
        e.*,
        u.nom,
        u.prenom,
        u.email,
        u.avatar_url as user_avatar_url,
        (
          SELECT COUNT(*) 
          FROM classes c 
          WHERE c.professeur_principal_id = e.user_id
        ) as nombre_classes,
        (
          SELECT GROUP_CONCAT(CONCAT(c.niveau, ' ', c.nom) SEPARATOR ', ')
          FROM classes c 
          WHERE c.professeur_principal_id = e.user_id
        ) as classes_principales
      FROM enseignants e
      INNER JOIN users u ON e.user_id = u.id
      ORDER BY u.nom, u.prenom
    `;
    
    console.log('📝 SQL:', sql);
    
    const result = await query(sql, []) as any[];
    
    console.log(`✅ ${result.length} employés trouvés`);
    
    // Transformer les données
    const employes = result.map((row: any) => ({
      id: row.id,
      user_id: row.user_id,
      matricule: row.matricule || '',
      nom: row.nom || '',
      prenom: row.prenom || '',
      email: row.email || '',
      date_naissance: row.date_naissance,
      lieu_naissance: row.lieu_naissance,
      genre: row.genre || 'M',
      adresse: row.adresse,
      telephone: row.telephone,
      specialite: row.specialite,
      diplome: row.diplome,
      date_embauche: row.date_embauche,
      statut: row.statut || 'actif',
      type_contrat: row.type_contrat || 'titulaire',
      type_enseignant: row.type_enseignant || 'professeur',
      matieres_enseignees: row.matieres_enseignees,
      fonction: row.fonction,
      departement: row.departement,
      salaire: row.salaire,
      created_at: row.created_at,
      nombre_classes: parseInt(row.nombre_classes) || 0,
      classes_principales: row.classes_principales || null,
      avatar_url: row.avatar_url || row.user_avatar_url
    }));
    
    // Log pour vérifier les classes des enseignants
    employes.forEach((emp: any) => {
      if (emp.type_enseignant !== 'administratif' && emp.nombre_classes > 0) {
        console.log(`👨‍🏫 ${emp.prenom} ${emp.nom} - ${emp.nombre_classes} classe(s): ${emp.classes_principales}`);
      }
    });
    
    return NextResponse.json({
      success: true,
      enseignants: employes // Garder le nom "enseignants" pour la compatibilité
    });
    
  } catch (error: any) {
    console.error('❌ Erreur GET:', error);
    return NextResponse.json(
      { success: false, enseignants: [], erreur: error?.message },
      { status: 500 }
    );
  }
}

// POST - Créer un nouvel employé (identique à votre code original)
export async function POST(request: NextRequest) {
  try {
    console.log('🌐 API Personnel - POST');
    
    // 1. Lire les données de la requête
    const data = await request.json();
    console.log('📦 Données reçues:', data);
    
    // 2. Validation des champs obligatoires
    if (!data.nom || !data.prenom || !data.email || !data.matricule) {
      return NextResponse.json(
        { 
          success: false, 
          erreur: 'Les champs nom, prénom, email et matricule sont requis' 
        },
        { status: 400 }
      );
    }

    // 3. Vérifier si l'email existe déjà
    const emailCheck = await query(
      'SELECT id FROM users WHERE email = ?',
      [data.email]
    ) as any[];
    
    if (Array.isArray(emailCheck) && emailCheck.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // 4. Vérifier si le matricule existe déjà
    const matriculeCheck = await query(
      'SELECT id FROM enseignants WHERE matricule = ?',
      [data.matricule]
    ) as any[];
    
    if (Array.isArray(matriculeCheck) && matriculeCheck.length > 0) {
      return NextResponse.json(
        { success: false, erreur: 'Ce matricule est déjà utilisé' },
        { status: 400 }
      );
    }

    // 5. Hasher le mot de passe
    const motDePasse = data.password || 'Scolarion26';
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // 6. Créer l'utilisateur et RÉCUPÉRER L'ID
    const userResult = await query(
      `INSERT INTO users (email, password, nom, prenom, role, statut)
       VALUES (?, ?, ?, ?, 'enseignant', ?)`,
      [
        data.email,
        hashedPassword,
        data.nom.toUpperCase(),
        data.prenom,
        data.statut || 'actif'
      ]
    ) as any;

    // ✅ Récupérer l'ID de l'utilisateur inséré
    let userId;
    
    if (userResult && userResult.insertId !== undefined) {
      userId = userResult.insertId;
    } else if (userResult && userResult.id !== undefined) {
      userId = userResult.id;
    } else if (Array.isArray(userResult) && userResult.length > 0 && userResult[0].insertId) {
      userId = userResult[0].insertId;
    } else {
      const userQuery = await query(
        'SELECT id FROM users WHERE email = ?',
        [data.email]
      ) as any[];
      
      if (Array.isArray(userQuery) && userQuery.length > 0) {
        userId = userQuery[0].id;
      } else {
        throw new Error('Impossible de récupérer l\'ID du nouvel utilisateur');
      }
    }

    console.log('✅ Utilisateur créé avec ID:', userId);

    // 7. Déterminer le type d'enseignant et les champs spécifiques
    let typeEnseignant = data.type_enseignant || 'professeur';
    let specialite = null;
    let matieresEnseignees = null;
    let fonction = null;
    let departement = null;

    if (typeEnseignant === 'professeur' && data.specialite) {
      specialite = data.specialite;
    } else if (typeEnseignant === 'instituteur' && data.matieres_enseignees) {
      matieresEnseignees = data.matieres_enseignees;
    } else if (typeEnseignant === 'administratif') {
      if (data.fonction) {
        fonction = data.fonction.startsWith('ADMIN - ') 
          ? data.fonction 
          : `ADMIN - ${data.fonction}`;
      }
      departement = data.departement || null;
    }

    // 8. Créer l'enseignant
    await query(
      `INSERT INTO enseignants (
        user_id, matricule, date_naissance, lieu_naissance, genre,
        adresse, telephone, specialite, diplome, date_embauche,
        statut, type_contrat, type_enseignant, matieres_enseignees,
        salaire, avatar_url, fonction, departement
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        data.matricule,
        data.date_naissance || null,
        data.lieu_naissance || null,
        data.genre || 'M',
        data.adresse || null,
        data.telephone || null,
        specialite,
        data.diplome || null,
        data.date_embauche || new Date().toISOString().split('T')[0],
        data.statut || 'actif',
        data.type_contrat || 'titulaire',
        typeEnseignant,
        matieresEnseignees,
        data.salaire || null,
        data.avatar_url || null,
        fonction,
        departement
      ]
    );

    // 9. Récupérer le nouvel employé (avec les classes pour être cohérent)
    const newEnseignant = await query(
      `SELECT 
        e.*,
        u.nom,
        u.prenom,
        u.email,
        u.avatar_url as user_avatar_url,
        (
          SELECT COUNT(*) 
          FROM classes c 
          WHERE c.professeur_principal_id = e.user_id
        ) as nombre_classes,
        (
          SELECT GROUP_CONCAT(CONCAT(c.niveau, ' ', c.nom) SEPARATOR ', ')
          FROM classes c 
          WHERE c.professeur_principal_id = e.user_id
        ) as classes_principales
      FROM enseignants e
      INNER JOIN users u ON e.user_id = u.id
      WHERE e.user_id = ?`,
      [userId]
    ) as any[];

    console.log('✅ Employé créé avec succès');

    return NextResponse.json({
      success: true,
      enseignant: Array.isArray(newEnseignant) && newEnseignant.length > 0 
        ? newEnseignant[0] 
        : null,
      message: 'Employé créé avec succès'
    }, { status: 201 });

  } catch (error: any) {
    console.error('❌ Erreur POST:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { success: false, erreur: 'Un employé avec cet email ou matricule existe déjà' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        success: false, 
        erreur: `Erreur serveur: ${error.message || 'Erreur inconnue'}` 
      },
      { status: 500 }
    );
  }
}