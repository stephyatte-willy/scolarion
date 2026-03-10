import { NextRequest, NextResponse } from 'next/server';
import { query, runTransaction } from '@/app/lib/database';
import { RowDataPacket } from 'mysql2';

// Interface pour le résultat de la requête composition
interface CompositionResult extends RowDataPacket {
  classe_id: number;
  periode_id: number;
}

export async function POST(request: NextRequest) {
  console.log('🚀 API masse appelée');
  
  try {
    const data = await request.json();
    const { releves, composition_id } = data;
    
    console.log(`📊 ${releves?.length || 0} relevés à sauvegarder`);
    
    if (!releves || !Array.isArray(releves) || releves.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun relevé' },
        { status: 400 }
      );
    }

    const result = await runTransaction(async (connection) => {
      // ÉTAPE 1: Supprimer les anciens relevés SI on a composition_id
      if (composition_id) {
        try {
          const compSql = 'SELECT classe_id, periode_id FROM compositions_primaire WHERE id = ?';
          const [compResult] = await connection.execute<CompositionResult[]>(compSql, [composition_id]);
          
          if (compResult && compResult.length > 0) {
            const comp = compResult[0];
            const deleteSql = 'DELETE FROM releves_primaire WHERE classe_id = ? AND periode_id = ?';
            await connection.execute(deleteSql, [comp.classe_id, comp.periode_id]);
            console.log(`🗑️ Anciens relevés supprimés`);
          }
        } catch (deleteError) {
          console.warn('⚠️ Impossible de supprimer anciens:', deleteError);
          // Continuer quand même
        }
      }
      
      // ÉTAPE 2: Insérer les nouveaux
      let insertedCount = 0;
      
      for (const releve of releves) {
        try {
          const sql = `
            INSERT INTO releves_primaire (
              eleve_id, matricule, eleve_nom, eleve_prenom,
              classe_id, classe_nom, periode_id, periode_nom,
              moyennes_par_matiere, moyenne_generale, rang,
              mention, appreciation_generale, date_generation,
              statut, email_envoye, date_envoi_email
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)
          `;
          
          const params = [
            releve.eleve_id,
            releve.matricule || '',
            releve.eleve_nom || '',
            releve.eleve_prenom || '',
            releve.classe_id,
            releve.classe_nom || '',
            releve.periode_id,
            releve.periode_nom || '',
            releve.moyennes_par_matiere || '[]',
            releve.moyenne_generale || 0,
            releve.rang || 0,
            releve.mention || '',
            releve.appreciation_generale || '',
            'finalise',
            0,
            null
          ];
          
          await connection.execute(sql, params);
          insertedCount++;
          
        } catch (insertError: any) {
          // Si erreur de duplication, essayer UPDATE
          if (insertError.code === 'ER_DUP_ENTRY' || insertError.message.includes('Duplicate')) {
            console.log(`🔄 Duplicata détecté pour élève ${releve.eleve_id}, mise à jour...`);
            
            const updateSql = `
              UPDATE releves_primaire SET
                matricule = ?,
                eleve_nom = ?,
                eleve_prenom = ?,
                classe_nom = ?,
                periode_nom = ?,
                moyennes_par_matiere = ?,
                moyenne_generale = ?,
                rang = ?,
                mention = ?,
                appreciation_generale = ?,
                date_generation = NOW(),
                updated_at = NOW(),
                date_envoi_email = NULL
              WHERE eleve_id = ? AND classe_id = ? AND periode_id = ?
            `;
            
            const updateParams = [
              releve.matricule || '',
              releve.eleve_nom || '',
              releve.eleve_prenom || '',
              releve.classe_nom || '',
              releve.periode_nom || '',
              releve.moyennes_par_matiere || '[]',
              releve.moyenne_generale || 0,
              releve.rang || 0,
              releve.mention || '',
              releve.appreciation_generale || '',
              releve.eleve_id,
              releve.classe_id,
              releve.periode_id
            ];
            
            await connection.execute(updateSql, updateParams);
            insertedCount++;
          } else {
            console.error(`❌ Erreur insertion élève ${releve.eleve_id}:`, insertError.message);
            throw insertError;
          }
        }
      }
      
      // ÉTAPE 3: Mettre à jour la composition
      if (composition_id) {
        try {
          await connection.execute(
            'UPDATE compositions_primaire SET releves_generes = TRUE, updated_at = NOW() WHERE id = ?',
            [composition_id]
          );
        } catch (updateError) {
          console.warn('⚠️ Mise à jour composition échouée:', updateError);
        }
      }
      
      return { inserted: insertedCount };
    });

    console.log(`✅ ${result.inserted} relevés traités`);
    
    return NextResponse.json({
      success: true,
      message: `${result.inserted} relevés sauvegardés`,
      inserted: result.inserted
    });

  } catch (error: any) {
    console.error('❌ Erreur API masse:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: `Erreur: ${error.message}`,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}