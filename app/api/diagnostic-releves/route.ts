import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/app/lib/database';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Diagnostic API relevés démarré');
    
    // Test 1: Connexion à la base de données
    let test1;
    try {
      test1 = await query('SELECT 1 as test_value');
      console.log('✅ Test 1 - Connexion DB:', test1);
    } catch (error: any) {
      console.error('❌ Test 1 échoué:', error.message);
      test1 = { error: error.message };
    }
    
    // Test 2: Vérifier si la table existe
    let test2;
    try {
      test2 = await query('SHOW TABLES LIKE "releves_primaire"');
      console.log('✅ Test 2 - Table existe:', test2);
    } catch (error: any) {
      console.error('❌ Test 2 échoué:', error.message);
      test2 = { error: error.message };
    }
    
    // Test 3: Compter les lignes
    let test3;
    try {
      test3 = await query('SELECT COUNT(*) as count FROM releves_primaire');
      console.log('✅ Test 3 - Nombre de relevés:', test3);
    } catch (error: any) {
      console.error('❌ Test 3 échoué:', error.message);
      test3 = { error: error.message };
    }
    
    // Test 4: Récupérer 2 relevés (requête SIMPLE)
    let test4;
    try {
      test4 = await query('SELECT id, eleve_nom, eleve_prenom FROM releves_primaire LIMIT 2');
      console.log('✅ Test 4 - 2 premiers relevés:', test4);
      
      // Vérifier le type de retour
      console.log('📊 Type de retour test4:', typeof test4);
      console.log('📊 Est un tableau?', Array.isArray(test4));
      console.log('📊 Contenu détaillé:', JSON.stringify(test4, null, 2));
    } catch (error: any) {
      console.error('❌ Test 4 échoué:', error.message);
      test4 = { error: error.message };
    }
    
    // Test 5: Vérifier la structure de la table
    let test5;
    try {
      test5 = await query('DESCRIBE releves_primaire');
      console.log('✅ Test 5 - Structure table:', test5);
    } catch (error: any) {
      console.error('❌ Test 5 échoué:', error.message);
      test5 = { error: error.message };
    }
    
    // Test 6: Vérifier les relevés pour classe 8, période 1
    let test6;
    try {
      test6 = await query('SELECT * FROM releves_primaire WHERE classe_id = 8 AND periode_id = 1');
      console.log('✅ Test 6 - Relevés classe 8 période 1:', test6);
    } catch (error: any) {
      console.error('❌ Test 6 échoué:', error.message);
      test6 = { error: error.message };
    }
    
    return NextResponse.json({
      success: true,
      diagnostic: {
        test_connexion: test1,
        table_existe: test2,
        nombre_releves: test3,
        premiers_releves: test4,
        structure_table: test5,
        releves_filtres: test6
      },
      notes: {
        type_test4: typeof test4,
        is_array_test4: Array.isArray(test4),
        raw_test4: test4
      }
    });
  } catch (error: any) {
    console.error('❌ Erreur diagnostic:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}