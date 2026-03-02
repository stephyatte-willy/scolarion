import { NextResponse } from 'next/server';
import { runTransaction } from '@/app/lib/database';

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  console.log('🔵 DÉBUT PUT PRIVILÈGES');
  console.log('📌 params reçus (complets):', JSON.stringify(params));
  console.log('📌 userId brut:', params?.userId);
  console.log('📌 Type userId:', typeof params?.userId);
  
  try {
    // Récupération sécurisée du userId - MÉTHODE ROBUSTE
    let rawUserId = null;
    
    // Essayer différentes méthodes pour obtenir l'ID
    if (params && params.userId) {
      rawUserId = params.userId;
    } else {
      // Essayer de l'extraire de l'URL
      const url = new URL(request.url);
      const pathParts = url.pathname.split('/');
      const possibleId = pathParts[pathParts.length - 2]; // .../employes/4/privileges
      if (possibleId && !isNaN(Number(possibleId))) {
        rawUserId = possibleId;
        console.log('📌 ID extrait de l\'URL:', rawUserId);
      }
    }
    
    console.log('📌 rawUserId final:', rawUserId);
    
    if (!rawUserId) {
      console.error('❌ userId manquant dans params');
      console.error('📌 params reçus:', params);
      console.error('📌 request.url:', request.url);
      
      return NextResponse.json(
        { success: false, erreur: 'ID utilisateur manquant dans la requête' },
        { status: 400 }
      );
    }
    
    // Conversion en nombre
    const userId = parseInt(rawUserId, 10);
    console.log('🔢 userId converti:', userId);
    
    if (isNaN(userId) || userId <= 0) {
      console.error('❌ userId invalide après conversion:', rawUserId);
      return NextResponse.json(
        { success: false, erreur: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }
    
    // Récupération des données du body
    let body;
    try {
      body = await request.json();
      console.log('📦 Body reçu:', body);
    } catch (e) {
      console.error('❌ Erreur parsing JSON:', e);
      return NextResponse.json(
        { success: false, erreur: 'Format de données invalide' },
        { status: 400 }
      );
    }
    
    const { roles, statut } = body;
    
    // Validation des données
    if (!Array.isArray(roles)) {
      console.error('❌ roles n\'est pas un tableau:', roles);
      return NextResponse.json(
        { success: false, erreur: 'Format des rôles invalide' },
        { status: 400 }
      );
    }
    
    // Valider chaque rôle (doit être un nombre)
    const validRoles = roles.every(r => typeof r === 'number' && !isNaN(r));
    if (!validRoles) {
      console.error('❌ Certains rôles ne sont pas des nombres:', roles);
      return NextResponse.json(
        { success: false, erreur: 'Les IDs des rôles doivent être des nombres' },
        { status: 400 }
      );
    }
    
    if (!statut || !['actif', 'inactif'].includes(statut)) {
      console.error('❌ statut invalide:', statut);
      return NextResponse.json(
        { success: false, erreur: 'Statut invalide' },
        { status: 400 }
      );
    }
    
    console.log('✅ Validation OK, exécution transaction...');
    
    // Exécuter la transaction
    const result = await runTransaction(async (connection) => {
      console.log('🔄 Début transaction...');
      
      // Vérifier que l'utilisateur existe
      const [userCheck] = await connection.execute(
        'SELECT id, email, nom, prenom FROM users WHERE id = ?',
        [userId]
      ) as any[];
      
      if (!userCheck || userCheck.length === 0) {
        console.error(`❌ Utilisateur avec ID ${userId} non trouvé dans la table users`);
        
        // Vérifier si l'utilisateur existe dans enseignants
        const [enseignantCheck] = await connection.execute(
          'SELECT user_id FROM enseignants WHERE user_id = ?',
          [userId]
        ) as any[];
        
        if (enseignantCheck && enseignantCheck.length > 0) {
          console.log(`✅ Utilisateur trouvé dans enseignants mais pas dans users?`);
          // Créer l'utilisateur s'il n'existe pas ?
          throw new Error(`Utilisateur ID ${userId} trouvé dans enseignants mais pas dans users`);
        }
        
        throw new Error(`Utilisateur avec ID ${userId} non trouvé`);
      }
      
      console.log('✅ Utilisateur trouvé:', userCheck[0]);
      
      // Mettre à jour le statut de l'utilisateur
      const [updateResult] = await connection.execute(
        'UPDATE users SET statut = ? WHERE id = ?',
        [statut, userId]
      ) as any;
      
      console.log('📊 Résultat mise à jour statut:', updateResult);
      
      // Supprimer les anciens rôles
      const [deleteResult] = await connection.execute(
        'DELETE FROM users_roles WHERE user_id = ?',
        [userId]
      ) as any;
      
      console.log(`🗑️ ${deleteResult.affectedRows} ancien(s) rôle(s) supprimé(s)`);
      
      // Ajouter les nouveaux rôles (si présents)
      if (roles.length > 0) {
        for (const roleId of roles) {
          // Vérifier que le rôle existe
          const [roleCheck] = await connection.execute(
            'SELECT id, nom FROM roles WHERE id = ?',
            [roleId]
          ) as any[];
          
          if (!roleCheck || roleCheck.length === 0) {
            console.warn(`⚠️ Rôle ID ${roleId} non trouvé, insertion ignorée`);
            continue;
          }
          
          console.log(`➕ Ajout du rôle:`, roleCheck[0]);
          
          await connection.execute(
            'INSERT INTO users_roles (user_id, role_id) VALUES (?, ?)',
            [userId, roleId]
          );
        }
        console.log(`✅ ${roles.length} rôle(s) ajouté(s)`);
      } else {
        console.log('ℹ️ Aucun rôle à ajouter');
      }
      
      return { success: true, userId };
    });
    
    console.log('🎉 Transaction réussie', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Privilèges mis à jour avec succès',
      userId: userId
    });
    
  } catch (error: any) {
    console.error('💥 Erreur dans la transaction:', error);
    
    let message = 'Erreur lors de la mise à jour des privilèges';
    if (error.message) {
      message = error.message;
    }
    
    return NextResponse.json(
      { success: false, erreur: message },
      { status: 500 }
    );
  }
}