import { NextRequest, NextResponse } from 'next/server'; // ✅ NextRequest au lieu de Request
import { runTransaction } from '@/app/lib/database';

// ✅ Interface avec Promise
interface RouteParams {
  params: Promise<{
    userId: string;
  }>;
}

export async function PUT(
  request: NextRequest, // ✅ NextRequest
  { params }: RouteParams
) {
  console.log('🔵 DÉBUT PUT PRIVILÈGES');
  
  try {
    // ✅ Récupération asynchrone de l'userId
    const { userId } = await params;
    
    console.log('📌 userId reçu:', userId);
    console.log('📌 Type userId:', typeof userId);
    
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
    
    // Validation userId
    const userIdNum = parseInt(userId);
    if (isNaN(userIdNum) || userIdNum <= 0) {
      console.error('❌ userId invalide:', userId);
      return NextResponse.json(
        { success: false, erreur: 'ID utilisateur invalide' },
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
        [userIdNum]
      ) as any[];
      
      if (!userCheck || userCheck.length === 0) {
        console.error(`❌ Utilisateur avec ID ${userIdNum} non trouvé dans la table users`);
        
        // Vérifier si l'utilisateur existe dans enseignants
        const [enseignantCheck] = await connection.execute(
          'SELECT user_id FROM enseignants WHERE user_id = ?',
          [userIdNum]
        ) as any[];
        
        if (enseignantCheck && enseignantCheck.length > 0) {
          console.log(`✅ Utilisateur trouvé dans enseignants mais pas dans users?`);
          throw new Error(`Utilisateur ID ${userIdNum} trouvé dans enseignants mais pas dans users`);
        }
        
        throw new Error(`Utilisateur avec ID ${userIdNum} non trouvé`);
      }
      
      console.log('✅ Utilisateur trouvé:', userCheck[0]);
      
      // Mettre à jour le statut de l'utilisateur
      const [updateResult] = await connection.execute(
        'UPDATE users SET statut = ? WHERE id = ?',
        [statut, userIdNum]
      ) as any;
      
      console.log('📊 Résultat mise à jour statut:', updateResult);
      
      // Supprimer les anciens rôles
      const [deleteResult] = await connection.execute(
        'DELETE FROM users_roles WHERE user_id = ?',
        [userIdNum]
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
            [userIdNum, roleId]
          );
        }
        console.log(`✅ ${roles.length} rôle(s) ajouté(s)`);
      } else {
        console.log('ℹ️ Aucun rôle à ajouter');
      }
      
      return { success: true, userId: userIdNum };
    });
    
    console.log('🎉 Transaction réussie', result);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Privilèges mis à jour avec succès',
      userId: userIdNum
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
